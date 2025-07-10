let urlParameters   = getURLParameters();
let links           = {};
let workspaces      = [];

let paramsDetails = {
    headerLabel     : 'descriptor',
    expandSections  : ['Basic'],
    layout          : 'narrow',
    toggles         : true
}


$(document).ready(function() {

    appendOverlay(true);
    setUIEvents();

    getFeatureSettings('assetEditor', [], function() {

    workspaces = config.assetEditor.workspaces;

        let requests = [ $.get('/plm/details', { link : urlParameters.link}) ];

        for(let workspace of workspaces) requests.push($.get('/plm/grid-columns', { wsId : workspace.workspaceId }));

        Promise.all(requests).then(function(responses) {

            links.ebom = getSectionFieldValue(responses[0].data.sections, config.assetEditor.fieldIdBOM, '', 'link');

            insertDetails(links.ebom, paramsDetails);

            insertBOM(links.ebom, {
                search              : true,
                path                : true,
                counters            : true,
                openInPLM           : true,
                collapseContents    : true,
                toggles             : true,
                viewerSelection     : false,
                includeBOMPartList  : true,
                bomViewName         : config.assetEditor.bomViewName,
                columnsIn           : ['Quantity', 'Qty'],
                contentSize         : 'm',
                afterCompletion     : function(id, data) { afterBOMCompletion(id, data) },
                onClickItem         : function(elemClicked) { onSelectBOMItem(elemClicked); }
            });

            insertViewer(links.ebom);

            for(let index = 1; index < responses.length; index++) {
                let workspace         = workspaces[index-1];
                    workspace.columns = responses[index].data.fields;
                    workspace.link    = getSectionFieldValue(responses[0].data.sections, workspace.fieldId, '', 'link');
            }

        });

    });

});


// Set UI controls
function setUIEvents() {

    // Header Toolbar Buttons
    $('#bom-sync').click(function() {
        syncItemsList();
    });
    $('#toggle-layout').click(function() {
        $('body').toggleClass('layout-h');
        $(this).toggleClass('toggle-on');
        viewerResize(200);
    });
    $('#toggle-bom').click(function() {
        $('body').toggleClass('no-bom');
        $(this).toggleClass('toggle-on');
        viewerResize(200);
    });
    $('#toggle-details').click(function() {
        $('body').toggleClass('no-details');
        $(this).toggleClass('toggle-on');
        viewerResize(200);
    });

}


// Post processing once BOM is loaded
function afterBOMCompletion(id, data) {  

    $('#overlay').hide();

    getMatchingBOMItems(data.bomPartsList);
    addBOMIconColumn(id);
    insertTabControls();
    insertTabHeaders();
    insertTabContents();
    addBOMToolbarActions();

}
function getMatchingBOMItems(bomPartsList) {

    for(let workspace of workspaces) {

        workspace.items = [];

        for(let item of bomPartsList) {
            let value = item.details[workspace.filter.fieldId];
            if(!isBlank(value)) {
                if(value.toString().toLowerCase() == workspace.filter.value.toString().toLowerCase()) {
                    workspace.items.push(item);
                }
            }
        }

    }

}
function addBOMIconColumn(id) {

    let elemTHRow = $('#' + id + '-thead-row');
    let elemTBody = $('#' + id + '-tbody');

    // for(let workspace of workspaces) {

        $('<th></th>').appendTo(elemTHRow)
            .addClass('column-icon')
            .html('Icon');

        elemTBody.children().each(function() {

            let elemRow  = $(this);
            let elemIcon = $('<td></td>').appendTo($(this)).addClass('column-icon');
            let link     = $(this).attr('data-link');
            let index    = 0;

            for(let workspace of workspaces) {

                if(isBlank(workspace.colorIndex))  workspace.colorIndex = index + 5;

                for(let item of workspace.items) {
                    if(item.link === link) {
                        elemIcon.addClass('icon');
                        elemIcon.addClass(workspace.bomIcon);
                        elemIcon.attr('title', workspace.label);
                        elemIcon.css('background', config.colors.list[workspace.colorIndex]);
                        elemRow.addClass('workspace-type-' + index);
                        break;
                    }
                }
                index++;
            }

        });

    // }

}
function insertTabControls() {

    let index = 0;

    for(let workspace of workspaces) {

        $('<div></div>').appendTo($('#tabs'))
            .attr('data-index', index)
            .attr('data-tab-group', 'tab-item-type')
            .addClass('with-icon')
            .addClass(workspace.bomIcon)
            .html(workspace.label)
            .click(function() {
                clickTab($(this));
                let index = $(this).index() + 0;
                $('#items').children().addClass('hidden');
                $('#table-' + index).removeClass('hidden');
            });

        // $('<table></table>').appendTo($('#items'))
        $('<div></div>').appendTo($('#items'))
            .addClass('tab-item-type')
            .addClass('hidden')
            .addClass('row-hovering')
            .attr('id', 'table-' + index)
            .attr('data-index', index++);

    }

    $('#tabs').children().first().click();

}
function insertTabHeaders() {

    let index = 0;

    for(let workspace of workspaces) {

        let elemParent = $('#items').children(':eq(' + index++ + ')');
        let elemTHead  = $('<thead></thead>').appendTo(elemParent);
        let elemTHRow  = $('<tr></tr>').appendTo(elemTHead);

        for(let column of workspace.columns) {

            let id = column.__self__.split('/').pop();

            if((workspace.columnsIn.length === 0) || ( workspace.columnsIn.includes(id))) {
                if((workspace.columnsEx.length === 0) || (!workspace.columnsEx.includes(id))) {
                    $('<th></th>').appendTo(elemTHRow)
                        .addClass('grid-column-' + id)
                        .html(column.name);
                }
            }

        }

    }

}
function insertTabContents() {

    let index = 0;

    for(let workspace of workspaces) {

        if(!isBlank(workspace.link)) {
            
            insertGrid(workspace.link, {
                id                : 'table-' + index++,
                counters          : true,
                editable          : true,
                hideHeader        : true,
                multiSelect       : true,
                reload            : true,
                search            : true,
                filterEmpty       : true,
                filterBySelection : true,
                singleToolbar     : 'actions',
                columnsIn         : workspace.columnsIn,
                columnsEx         : workspace.columnsEx,
                groupBy           : workspace.groupBy || '',
                collapseContents  : workspace.collapseContents || false,
                textNoData        : 'No items found. Use the EBOM sync to update this table.',
                contentSizes      : ['s', 'xs', 'xxs', 'xxl', 'xl', 'l', 'm'],
                afterCompletion   : function(id) { afterGridCompletion(id); },
                // onClickItem       : function(elemClicked) { onSelectGridItem(elemClicked); }
            });
        }

    }


    // let requests = [];

    // for(let workspace of workspaces) requests.push($.get('/plm/grid', { link : workspace.link}));

    // Promise.all(requests).then(function(responses) {


    //     // console.log(responses);

    //     let index = 0;   

    //     for(let workspace of workspaces) {

    //         let elemParent = $('#items').children(':eq(' + index++ + ')');
    //         let elemTBody  = $('<tbody></tbody>').appendTo(elemParent);
        
    //         for(let item of workspace.items) {

    //             console.log(item);

    //             let itemInstances = viewerGetComponentsInstances([item.partNumber]);

    //             console.log(itemInstances);


    //             for(let instance = 0; instance < item.totalQuantity; instance++) {

    //                 let eleTBRow = $('<tr></tr>').appendTo(elemTBody)
    //                     .attr('data-edgeid', item.edgeId)
    //                     .attr('data-link', item.link)
    //                     .attr('data-part-number', item.partNumber)
    //                     // .attr('data-viewer-id', itemInstances[0].instances[instance].dbId)
    //                     .click(function() {
    //                         selectContentRow($(this));
    //                     })

    //                 if(!isBlank(itemInstances.length)) {
    //                     if(itemInstances.length > 0) {
    //                         if(!isBlank(itemInstances[0].instances)) {
    //                             console.log(itemInstances[0].instances[instance]);
    //                             eleTBRow.attr('data-viewer-dbid', itemInstances[0].instances[instance].dbId);
    //                         }
    //                     }
    //                 }


    //                 for(let column of workspace.columns) {

    //                     let columnId = column.__self__.split('/').pop();

    //                     if((workspace.columnsIn.length === 0) || ( workspace.columnsIn.includes(columnId))) {
    //                         if((workspace.columnsEx.length === 0) || (!workspace.columnsEx.includes(columnId))) {
                                
    //                             let elemCell = $('<td></td>').appendTo(eleTBRow)
    //                                 .addClass('grid-column-' + columnId)
    //                                 .html('-');

    //                             let fields = Object.keys(item.details);

    //                             for(let field of fields) {

    //                                 // console.log(field + ' ---' + columnId);

    //                                 if(field === columnId) {
    //                                     elemCell.html(item.details[field]);
    //                                     break;
    //                                 }

    //                             }

    //                             // if(id === 'NUMBER') {
                                    
    //                             // }
    //                         }
    //                     }
    //                 }
    //             }




    //         }

    //     }


    // });

}
function addBOMToolbarActions() {

    let elemAfter = $('#bom-action-expand-all');

    $('<div></div>').insertBefore(elemAfter)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-3d')
        .attr('id', 'apply-bom-colors')
        .attr('title', 'Highlight functional items by defined color')
        .click(function() {
            $(this).toggleClass('main');
            applyViewerColors();

        });

}
function applyViewerColors() {

    let applyBOMColors = $('#apply-bom-colors').hasClass('main');

    viewerResetColors();

    if(applyBOMColors) {

        viewer.hideAll();

        for(let workspace of workspaces) {

            let partNumbers = [];

            for(let item of workspace.items) partNumbers.push(item.partNumber);

            viewerSetColors(partNumbers, { unhide : true, color : config.vectors.list[workspace.colorIndex], resetColors : false } );

        }

    } else {

        viewerResetSelection();

    }


}


// Filter tables upon BOM selection
function onSelectBOMItem(elemClicked) {

    let selected = $('#bom-tbody').find('tr.selected').length;

    if(selected === 0) {

        $('#items').find('tr.content-item').removeClass('hidden');
        $('#items').find('tr.table-group').removeClass('hidden');
        viewerResetSelection();
        applyViewerColors();

        insertDetails(links.ebom, paramsDetails);

    } else {

        let path       = getBOMItemPath(elemClicked);
        let partNumber = elemClicked.attr('data-part-number');
        let index     = 0;

        for(let workspace of workspaces) {

            let elemGrid = $('#table-' + index++ + '-tbody');

            elemGrid.find('tr.content-item').each(function() {

                let elemRow = $(this);
                let gridRow = getGridRowDetails(elemRow, workspace.columnsDef);

                if(gridRow.path.indexOf(path.string) < 0) {
                    elemRow.addClass('hidden');
                    elemRow.prev('.table-group').addClass('hidden');
                } else {
                    elemRow.removeClass('hidden');
                    elemRow.prev('.table-group').removeClass('hidden');
                }

            });
        
        }

        viewerSelectModel(partNumber);
        insertDetails(elemClicked.attr('data-link'), paramsDetails);

    }

}



// Highlight viewer instances upon selection of item in tabs
function afterGridCompletion(id) {

    let elemTable = $('#' + id);

    elemTable.find('input').click(function() {
        selectGridItem($(this).closest('tr'));
    });

}
function selectGridItem(elemClicked) {

    let isSelected = elemClicked.hasClass('highlighted');
    let elemPanel  = elemClicked.closest('.panel-top');
    let index      = elemPanel.index();
    let rowData    = getGridRowDetails(elemClicked, workspaces[index].columnsDef);

    $('.highlighted').removeClass('highlighted');

    // elemPanel.find('tr.selected').each(function() { $(this).removeClass('selected') });


    if(isSelected) {

        viewerResetSelection();

    } else {

        elemClicked.addClass('highlighted');

        viewerHighlightInstances(rowData.partNumber, [], [rowData.instanceId], {});
        bomDisplayItemByPath(rowData.path);

        elemClicked.prevUntil('.table-group').each(function() { $(this).addClass('related'); })
        elemClicked.nextUntil('.table-group').each(function() { $(this).addClass('related'); })

    }

}


// Highlight matching items upon selection in viewer
function onViewerSelectionChanged(event) {

    if(viewerHideSelected(event)) return;

    viewerGetSelectedPartNumber(event, function(partNumber) {

    $('#items').find('tr.content-item').removeClass('selected').removeClass('highlighted');

        let instanceId  = event.dbIdArray[0];

        for(let index = 0; index < workspaces.length; index++) {

            let gridRows = getGridRows(index);

            for(let gridRow of gridRows) {

                if(gridRow.instanceId == instanceId) {                    
                    gridRow.elem.addClass('highlighted');
                    $('#items').children().addClass('hidden');
                    $('#table-' + index).removeClass('hidden');
                    index =  workspaces.length + 1;
                } else if(gridRow.partNumber === partNumber) {
                    gridRow.elem.addClass('selected');

                }
            }
        }

        bomDisplayItemByPartNumber(partNumber);

    });

}


function selectContentRow(elemRow) {

    console.log('selectContentRow');

    let partNumber = elemRow.attr('data-part-number');
    let dbId       = elemRow.attr('data-viewer-dbid');
    
    $('#items').find('tr.selected'   ).removeClass('selected'   );
    $('#items').find('tr.highlighted').removeClass('highlighted');
    
    $('#items').find('tr').each(function() {
        let pn = $(this).attr('data-part-number');
        if(pn === partNumber) $(this).addClass('selected');
    });

    elemRow.removeClass('selected').addClass('highlighted');

    bomDisplayItemByPartNumber(partNumber);

    viewerHighlightInstances(partNumber, [dbId], {
        ghosting : true
    });

}



// Update grid data with EBOM entries
function syncItemsList() {

    $('#overlay').show();

    let index    = 0;
    let requests = [];

    for(let workspace of workspaces) {

        let gridRows = getGridRows(index++);

        for(let item of workspace.items) {

            item.instances = [];

            let viewerInstances = viewerGetComponentsInstances([item.partNumber])[0];

            for(let viewerInstance of viewerInstances.instances) {
                if(viewerInstance.path === item.path) {
                    console.log('found match');
                    item.instances.push(viewerInstance);
                }
            } 

        }     

        for(let item of workspace.items) {

            for(let gridRow of gridRows) {
                if(item.partNumber === gridRow.partNumber) {
                    if(item.path === gridRow.path) {
                        let index = 0;
                        for(let instance of item.instances) {
                            if(instance.instanceId == gridRow.instanceId) {
                                item.instances.splice(index, 1);
                                break;
                            }
                            index++;
                        }
                    }
                }
            }

            for(let instance of item.instances) {

                let params = {
                    wsId : workspace.workspaceId,
                    link : workspace.link,
                    data : [
                        { fieldId : workspace.columnsDef.partNumber, value : item.partNumber     },
                        { fieldId : workspace.columnsDef.path      , value : item.path           },
                        { fieldId : workspace.columnsDef.instanceId, value : instance.instanceId }
                    ]
                }

                requests.push($.post('/plm/add-grid-row', params));

            }

        }
    }

    Promise.all(requests).then(function(responses) {
        $('#overlay').hide();
    });

}
function getGridRows(index) {

    let results   = [];
    let elemTBody = $('#table-' + index + '-tbody');
    let columns   = workspaces[index].columnsDef;

    elemTBody.children('.content-item').each(function() {

        let gridRow = getGridRowDetails($(this), columns);
        gridRow.elem = $(this);
        results.push(gridRow);

    });

    return results;

}
function getGridRowDetails(elemRow, columns) {

    let gridRow  =  {
        partNumber : '',
        path       : '',
        instanceId : ''
    }

    elemRow.children().each(function() {

        let elemCell = $(this);
        let fieldId  = elemCell.attr('data-id');

        if(!isBlank(fieldId)) {

            switch(fieldId) {

                case columns.partNumber:
                    gridRow.partNumber = elemCell.children().first().val();
                    break;

                case columns.path:
                    gridRow.path = elemCell.children().first().val();
                    break;

                case columns.instanceId:
                    gridRow.instanceId = elemCell.children().first().val();
                    break;

            }

        }           
        
    });

    return gridRow;

}