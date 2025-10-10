let urlParameters   = getURLParameters();
let links           = {};
let workspaces      = [];
let messages        = [];
let embedded        = false;

let paramsDetails = {
    headerLabel     : 'descriptor',
    expandSections  : ['Basic'],
    layout          : 'narrow',
    openInPLM       : true,
    toggles         : true
}


$(document).ready(function() {

    appendOverlay(true);
    setUIEvents();
    setEmbeddedMode();

    viewerCacheBoundingBoxes = true;

    getFeatureSettings('assetEditor', [], function() {

        workspaces = config.assetEditor.workspaces;
        
        if(urlParameters.wsId != config.assetEditor.workspaceId) {

            insertResults(config.assetEditor.workspaceId, [{
                field       : config.assetEditor.fieldIdBOM,       
                type        : 0,
                comparator  : 3,
                value       : urlParameters.descriptor
            }], {
                headerLabel : config.assetEditor.landingHeader || 'Select Asset',
                layout      : 'list',
                contentSize : 'xs',
                onClickItem : function(elemClicked) { selectResult(elemClicked); }
            });

        } else openEditor(urlParameters.link);

    });

});
function selectResult(elemClicked) {

    openEditor(elemClicked.attr('data-link'));

}
function openEditor(link) {

    appendOverlay(false);

    let requests = [ $.get('/plm/details', { link : link }) ];

    for(let workspace of workspaces) requests.push($.get('/plm/grid-columns', { wsId : workspace.workspaceId }));

    Promise.all(requests).then(function(responses) {

        urlParameters.title = responses[0].data.title;

        $('body').addClass('screen-main').removeClass('screen-landing');
        $('#header-subtitle').html(urlParameters.title);
        $('#overlay').hide();

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
            fieldsIn            : ['Quantity', 'Qty'],
            contentSize         : 'm',
            afterCompletion     : function(id, data) { afterBOMCompletion(id, data) },
            onClickItem         : function(elemClicked) { onSelectBOMItem(elemClicked); }
        });

        insertViewer(links.ebom);

        for(let index = 1; index < responses.length; index++) {
            let workspace         = workspaces[index-1];
                workspace.columns = responses[index].data.fields;
                workspace.link    = getSectionFieldValue(responses[0].data.sections, workspace.fieldId, '', 'link');
                workspace.index   = index - 1;
        }

        console.log(workspaces);

        $('#excel-export').removeClass('disabled');

    });

}


// Set UI controls
function setUIEvents() {

    // Header Toolbar Buttons
    $('#bom-sync').click(function() {
        syncItemsList();
    });
    $('#excel-export').click(function() {

        if($(this).hasClass('disabled')) return;

        $('#overlay').show();

        let sheets = [];

        for(let workspace of workspaces) {
            sheets.push({ 
                type      : 'grid',
                link      : workspace.link,
                name      : workspace.label,
                color     : config.colors.list[workspace.colorIndex].split('#')[1],
                fieldsIn  : workspace.fieldsIn || [],
                fieldsEx  : workspace.fieldsEx || [],
                colWidths : []
            });
        }

        $.post('/plm/excel-export', {
            fileName   : config.assetEditor.exportFileName + ' ' + urlParameters.title.split(' - ')[0] + '.xlsx',
            sheets     : sheets
        }, function(response) {
            $('#overlay').hide();
            let url = document.location.href.split('/asset-editor')[0] + '/' + response.data.fileUrl;
            document.getElementById('frame-download').src = url;
        });
        
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


// Enable embedded mode to support usage as addin
function setEmbeddedMode() {

    if(typeof chrome !== 'undefined') {
        if(typeof chrome.webview !== 'undefined') {

            embedded = true;
            
            chrome.webview.addEventListener('message', arg => { 

                // 'response:title:text'
                // 'selectInstance:instanceId'

                let response      = arg.data.split(':');
                let messageType   = response[0];

                $('#overlay').hide();

                switch(messageType) {

                    case 'response': 
                        let messageTitle = response[1];
                        let messageText  = (response.length > 2) ? response[2] : 'Please contact your administrator';
                        if(messageTitle != 'success') showErrorMessage(messageTitle, messageText);
                        break;

                    case 'selectInstance':
                        let instanceId = (response.length > 1) ? response[1] : '';
                        selectInstance(instanceId);
                        break;

                    default: break;

                }

            });

        }
    }

    console.log('embedded : ' + embedded);
    // embedded = true;

    if(embedded) {
        $('body').addClass('embedded');
        $('#bom').addClass('hidden');
        $('#toggle-layout').remove();
        $('#toggle-bom').remove();
        $('#toggle-details').remove();
    }

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

            if((workspace.fieldsIn.length === 0) || ( workspace.fieldsIn.includes(id))) {
                if((workspace.fieldsEx.length === 0) || (!workspace.fieldsEx.includes(id))) {
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
                autoSave          : true,
                counters          : false,
                editable          : true,
                hideHeader        : true,
                multiSelect       : true,
                reload            : true,
                search            : false,
                filterEmpty       : false,
                filterBySelection : true,
                hideButtonCreate  : true,
                hideButtonClone   : true,
                singleToolbar     : 'actions',
                fieldsIn          : workspace.fieldsIn,
                fieldsEx          : workspace.fieldsEx,
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
                let gridRow = getGridRowDetails(elemRow, workspace.fieldsList);

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

    let elemTable  = $('#' + id);
    let elemTHead  = $('#' + id + '-thead');
    let elemTHRow  = elemTHead.children().first();
    let elemTBody  = $('#' + id + '-tbody');

    let partNumber       = '';
    let viewerInstances  = [];

    elemTable.find('input').click(function() {
        selectGridItem($(this).closest('tr'));
    });

    $('<th></th>').insertAfter(elemTHRow.children().first())
        .addClass('sync-status')
        .html('');


    elemTBody.children().each(function() {

        let elemRow = $(this);

        if(elemRow.hasClass('table-group')) {

            let elemCellGroup = elemRow.children().first(); 
                elemCellGroup.attr('colspan', elemTHRow.children().length);

            partNumber      = elemCellGroup.html();
            viewerInstances = viewerGetComponentsInstances([partNumber])[0].instances;

        } else {
            
            let instanceId  = elemRow.find('.field-id-INSTANCE_ID').children().first().val();
            let boundingBox = elemRow.find('.field-id-INSTANCE_BOUNDING_BOX').children().first().val();
            let elemCell    = $('<td></td>').insertAfter(elemRow.children().first()).addClass('sync-status').addClass('match');;
            let elemIcon    = $('<div></div>').appendTo(elemCell).addClass('icon').addClass('filled');
            let statusIcon  = 'icon-remove';
            let statusTitle = 'No matching instance';

            for(let viewerInstance of viewerInstances) {
                if(viewerInstance.instanceId == instanceId) {
                    
                    if(JSON.stringify(viewerInstance.boundingBox) === boundingBox) {
                        statusIcon  = 'icon-check';
                        statusTitle = 'Found matching instance ID at right position';
                    } else {
                        statusIcon  = 'icon-info';
                        statusTitle = 'Found matching instance ID at different position';
                    }
                    break;
                }
            }

            elemCell.attr('title', statusTitle);
            elemIcon.addClass(statusIcon);

        }

    });

}
function selectGridItem(elemClicked) {

    let isSelected = elemClicked.hasClass('highlighted');
    let elemPanel  = elemClicked.closest('.panel-top');
    let index      = elemPanel.index();
    let rowData    = getGridRowDetails(elemClicked, workspaces[index].fieldsList);

    // console.log(rowData);
    // console.log(isSelected);

    $('.highlighted').removeClass('highlighted');

    if(isSelected) {

        viewerResetSelection();

    } else {

        elemClicked.addClass('highlighted');

        viewerHighlightInstances(rowData.partNumber, [], [rowData.instanceId], {});

        if(embedded) {
            console.log('post Message to ' + host);
            console.log(rowData);
            let selection = 'plm-item;' + rowData.partNumber + ';' + '--' + ';' + elemClicked.attr('data-link')+ ';' + rowData.instanceId;
            console.log(selection);
            $('#overlay').show();
            chrome.webview.postMessage("selectInstance:"  + getNewAddinMessageID(elemClicked) + selection.toString()); 
        } else bomDisplayItemByPath(rowData.path);

        elemClicked.prevUntil('.table-group').each(function() { $(this).addClass('related'); })
        elemClicked.nextUntil('.table-group').each(function() { $(this).addClass('related'); })

    }

}
function getNewAddinMessageID(elements) {

    let now = new Date();
    let id  = now.getTime();
    
    messages.push({ id : id, elements : elements });

    return id + ';';

}


// Highlight matching instance upon selection in Inventor
// selectInstance('002771.iam|Build Assembly:1|94500A231:2')
function selectInstance(instanceId) {

    if(isBlank(instanceId)) return;

    for(let workspace of workspaces) {

        let fieldId = workspace.fieldsList.instanceId;
        let tableId = 'table-' + workspace.index;

        $('#' + tableId + '-table').find('.field-id-' + fieldId).each(function() {

            let elemInput = $(this).children('input');
            let value     = elemInput.val();

            if(value === instanceId) {
                selectGridItem(elemInput.closest('tr'));
                $('#tabs').children().eq(workspace.index).click();
                return;
            }
                
        });
            
    }

}


// Highlight matching items upon selection in viewer
function onViewerSelectionChanged(event) {

    if(!viewerInstanceDataSet) return;
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

    let iWS      = 0;
    let requests = [];
    let grids    = [];
    
    for(let workspace of workspaces) {

        let gridRows = getGridRows(iWS);
        let refresh  = false;

        for(let item of workspace.items) {

            item.instances = [];

            let viewerInstances = viewerGetComponentsInstances([item.partNumber])[0];

            console.log(viewerInstances);

            for(let viewerInstance of viewerInstances.instances) {
                if(viewerInstance.pathNumbers === item.path) {
                    item.instances.push(viewerInstance);
                }
            } 

            console.log(item);

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
                        { fieldId : workspace.fieldsList.partNumber , value : item.partNumber      },
                        { fieldId : workspace.fieldsList.path       , value : item.path            },
                        { fieldId : workspace.fieldsList.instanceId , value : instance.instanceId  },
                        { fieldId : workspace.fieldsList.boundingBox, value : JSON.stringify(instance.boundingBox) }
                    ]
                }

                console.log(params);

                requests.push($.post('/plm/add-grid-row', params));
                refresh = true;

            }

        }

        if(refresh) grids.push(iWS);
        iWS++;

    }

    Promise.all(requests).then(function(responses) {
        for(let grid of grids) {
            settings.grid['table-' + grid].load();
        }
        $('#overlay').hide();
    });

}
function getGridRows(index) {

    let results   = [];
    let elemTBody = $('#table-' + index + '-tbody');
    let columns   = workspaces[index].fieldsList;

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