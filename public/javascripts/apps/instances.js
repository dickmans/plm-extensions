let links            = {};
let workspaces       = [];
let completionEvents = 0;

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
    setAddinEvents();
    setAddinMode();

    viewerCacheBoundingBoxes = true;

    getFeatureSettings('instances', [], function() {
        
        for(let workspace of config.tabs) {
            if(isBlank(workspace.workspaceId)) workspace.workspaceId = common.workspaceIds.serialNumbers;
        };

        workspaces = config.tabs;

        let wsIdAssets = config.assets.workspaceId || common.workspaceIds.assets;

        if(urlParameters.wsId != wsIdAssets) {

            insertResults(wsIdAssets, [{
                field       : config.assets.fieldIdBOM,       
                type        : 0,
                comparator  : 3,
                value       : urlParameters.number
            }], {
                headerLabel : config.landingHeader || 'Select Asset',
                layout      : 'list',
                contentSize : 'xs',
                onClickItem : function(elemClicked) { selectResult(elemClicked); }
            });

        } else openEditor(urlParameters.link);

    });

});


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
                color     : colors.list[workspace.colorIndex].split('#')[1],
                fieldsIn  : workspace.fieldsIn || [],
                fieldsEx  : workspace.fieldsEx || [],
                colWidths : []
            });
        }

        $.post('/plm/excel-export', {
            fileName   : config.exportFileName + ' ' + urlParameters.title.split(' - ')[0] + '.xlsx',
            sheets     : sheets
        }, function(response) {
            $('#overlay').hide();
            let url = document.location.href.split('/instances')[0] + '/' + response.data.fileUrl;
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


// Start Editor
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

        links.ebom = getSectionFieldValue(responses[0].data.sections, config.assets.fieldIdBOM, '', 'link');

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
            bomViewName         : config.bomViewName,
            fieldsIn            : ['Quantity', 'Qty'],
            contentSize         : 'm',
            afterCompletion     : function(id, data) { afterBOMCompletion(id, data) },
            onClickItem         : function(elemClicked) { onSelectBOMItem(elemClicked); }
        });

        insertViewer(links.ebom, { cacheInstances : true });

        for(let index = 1; index < responses.length; index++) {

            let workspace         = workspaces[index-1];
                workspace.columns = responses[index].data.fields;
                workspace.link    = getSectionFieldValue(responses[0].data.sections, workspace.fieldId, '', 'link');
                workspace.index   = index - 1;

        }

        $('#excel-export').removeClass('disabled');

    });

}
function onViewerLoadingDone() {

    completionEvents++;

    setGridSyncStatus();

}
function setGridSyncStatus() {

    if(completionEvents <= workspaces.length) return;

    let index = 0;

    for(let workspace of workspaces) {

        let elemTHead       = $('#table-' + index + '-thead');
        let elemTHRow       = elemTHead.children().first();
        let elemTBody       = $('#table-' + index + '-tbody');
        let viewerInstances = [];

        elemTBody.children().each(function() {

            let elemRow = $(this);

            if(elemRow.hasClass('table-group')) {

                let elemCellGroup = elemRow.children().first(); 
                    elemCellGroup.attr('colspan', elemTHRow.children().length);

                let partNumber  = elemCellGroup.html();
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

        index++;

    }

}


// Enable embedded mode to support usage as addin
function setAddinMode() {

    // isAddin = true;

    if(!isAddin) return;

    console.log('setAddinMode START');
    console.log('isAddin : ' + isAddin);

    // $('#header').addClass('hidden');
    // $('.screen').css('top', '0px');

    $('body').addClass('addin');
    // $('#bom').addClass('hidden');
    // $('#toggle-layout').remove();
    // $('#toggle-bom').remove();
    // $('#toggle-details').remove();    

    //selectInstance('002771.iam|Build Assembly:1|94500A231:6');

    // if(typeof chrome !== 'undefined') {
    //     if(typeof chrome.webview !== 'undefined') {

    //         embedded = true;

    //         console.log('setEmbeddedMode : adding Event Listener');
            
    //         window.chrome.webview.addEventListener('message', arg => { 

    //             console.log('---------------------------------------------------');
    //             console.log('Received message from Inventor');

    //             // 'response:title:text'
    //             // 'selectInstance:partNumber:instanceId'
    //             // selectInstance:94500A231:002771.iam|Build Assembly: 1|94500A231:1
    //             // selectComponent:94500A231

    //             $('#overlay').hide();

    //             switch(messageType) {

    //                 case 'response': 
    //                     let messageTitle = response[1];
    //                     let messageText  = (response.length > 2) ? response[2] : 'Please contact your administrator';
    //                     if(messageTitle != 'success') showErrorMessage(messageTitle, messageText);
    //                     break;

    //                 case 'selectInstance':
    //                     let instanceId = (response.length > 2) ? response[2] : '';
    //                     selectInstance(instanceId);
    //                     break;

    //                 case 'selectComponent':
    //                     let partNumber = (response.length > 1) ? response[1] : '';
    //                     selectComponent(partNumber);
    //                     break;

    //                 default: break;

    //             }

    //         });

    //     }
    // }

    
    // embedded = true;



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
                        elemIcon.css('background', colors.list[workspace.colorIndex]);
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

            // workspace.fieldsIn.push('NR');
            
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
                hideButtonLabels  : isAddin,
                singleToolbar     : 'actions',
                sortOrder         : workspace.sortOrder,
                fieldsIn          : workspace.fieldsIn,
                fieldsEx          : workspace.fieldsEx,
                groupBy           : workspace.groupBy || '',
                collapseContents  : workspace.collapseContents || false,
                textNoData        : 'No items found. Use the button Snyc with BOM in the main toolbar to update this table.',
                contentSizes      : isAddin ? ['s'] : ['s', 'xs', 'xxs', 'xxl', 'xl', 'l', 'm'],
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

            viewerSetColors(partNumbers, { unhide : true, color : colors.vectors.list[workspace.colorIndex], resetColors : false } );

        }

    } else {

        viewerResetSelection();

    }


}


// Filter tables upon BOM selection
function onSelectBOMItem(elemClicked) {

    let selected = $('#bom-tbody').find('tr.selected').length;

    $('#items').find('.highlighted').removeClass('highlighted');
    $('#items').find('.selected'   ).removeClass('selected'   );

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

        $('.table-group').removeClass('keep');

        for(let workspace of workspaces) {

            let elemGrid = $('#table-' + index++ + '-tbody');

            elemGrid.find('tr.content-item').each(function() {

                let elemRow   = $(this);
                let gridRow   = getGridRowDetails(elemRow, workspace.fieldsList);
                let elemGroup = elemRow.prevAll('.table-group').first();

                if(gridRow.path.indexOf(path.string) < 0) {
                    elemRow.addClass('hidden');
                    // elemRow.prev('.table-group').addClass('hidden');
                    if(!elemGroup.hasClass('keep')) elemGroup.addClass('hidden');
                } else {
                    elemRow.removeClass('hidden');
                    // elemRow.prev('.table-group').removeClass('hidden');
                    elemGroup.removeClass('hidden').addClass('keep');
                }

            });
        
        }

        viewerSelectModel(partNumber);
        insertDetails(elemClicked.attr('data-link'), paramsDetails);

    }

}


// Highlight viewer instances upon selection of item in tabs
function afterGridCompletion(id) {

    completionEvents++;

    let elemTable   = $('#' + id);
    let elemActions = $('#' + id + '-actions');
    let elemToggle  = $('#' + id + '-toggle-isolate');
    let elemTHead   = $('#' + id + '-thead');
    let elemTHRow   = elemTHead.children().first();

    if(isAddin) {
        if(elemToggle.length === 0) {
            
            $('<div></div>').prependTo(elemActions)
            .addClass('button')
            .addClass('with-toggle')
            .addClass('toggle-isolate')
            .attr('id', id + '-toggle-isolate')
            .html('Isolate')
            .click(function() {
                $(this).toggleClass('toggle-on').toggleClass('toggle-off');
                updateIsolate($(this));
            });
            
        }
    }

    elemTable.find('input').click(function() {
        selectGridItem($(this).closest('tr'));
    });

    $('<th></th>').insertAfter(elemTHRow.children().first())
        .addClass('sync-status')
        .html('');

    setGridSyncStatus();

}
function selectGridItem(elemClicked) {

    console.log('selectGridItem START');

    let elemPanel     = elemClicked.closest('.panel-top');
    let isHighlighted = elemClicked.hasClass('highlighted');
    let index         = elemPanel.index();
    let rowData       = getGridRowDetails(elemClicked, workspaces[index].fieldsList);

    $('.content-item.selected').removeClass('selected');

    elemClicked.addClass('selected');

    togglePanelToolbarActions(elemClicked);

    if(isHighlighted) return;

    $('.highlighted').removeClass('highlighted');
    $('.addin-context-element').removeClass('addin-context-element');
    $('.addin-focus-element').removeClass('addin-focus-element');

    // if(isSelected) {

        // viewerResetSelection();

    // } else {

        let elemToggleIsolate = elemPanel.find('.toggle-isolate');
        let addinAction       = 'selectInstance';

        if(elemToggleIsolate.length > 0) {
            if(elemToggleIsolate.hasClass('toggle-on')) {
                addinAction = 'isolateInstance';
            }
        }

        elemClicked.addClass('highlighted').addClass('addin-context-element');

        if(isAddin && sendAddinMessage) {
            console.log('addin message to ' + host);
            console.log(rowData);
            let selection = 'plm-item;' + rowData.partNumber + ';' + '--' + ';' + elemClicked.attr('data-link')+ ';' + rowData.instancePath;
            console.log(selection);
            console.log("addin message = " +  addinAction + ":" + selection.toString());
            // $('#overlay').show();
            $(':focus').addClass('addin-focus-element');
            window.chrome.webview.postMessage(addinAction + ":" + selection.toString()); 
        } else {
            bomDisplayItemByPath(rowData.path);
        }

        viewerHighlightInstances(rowData.partNumber, [], [rowData.instancePath], {});

        elemClicked.prevUntil('.table-group').each(function() { $(this).addClass('related'); })
        elemClicked.nextUntil('.table-group').each(function() { $(this).addClass('related'); })

    // }

}
function updateIsolate(elemToggleIsolate) {

    if(!isAddin) return;


    let elemHighlighted = $('.highlighted').first();

    if(  elemHighlighted.length === 0) return;
    if(elemToggleIsolate.length === 0) return;

    $('.addin-context-element').removeClass('addin-context-element');
    
    elemHighlighted.addClass('addin-context-element');
    
    let elemPanel   = elemHighlighted.closest('.panel-top'); 
    let index       = elemPanel.index();
    let rowData     = getGridRowDetails(elemHighlighted, workspaces[index].fieldsList);
    let addinAction = (elemToggleIsolate.hasClass('toggle-on')) ? 'isolateInstance' : 'selectInstance';
    let selection   = 'plm-item;' + rowData.partNumber + ';' + '--' + ';' + elemHighlighted.attr('data-link')+ ';' + rowData.instancePath;

    window.chrome.webview.postMessage(addinAction + ":" + selection.toString()); 

}


// Highlight matching instance upon selection in Inventor
// selectInstance('002771.iam|Build Assembly:1|94500A231:2')
// selectInstance('01-0289.iam|01-0745:1|01-0743:1')
function selectInstance(instancePath) {

    console.log('selectInstance START')

    if(isBlank(instancePath)) return;

    for(let workspace of workspaces) {

        let fieldId = workspace.fieldsList.instancePath;
        let tableId = 'table-' + workspace.index;

        console.log(fieldId);

        $('#' + tableId + '-table').find('.field-id-' + fieldId).each(function() {

            let elemInput = $(this).children('input');
            let value     = elemInput.val();

            if(value === instancePath) {
                selectGridItem(elemInput.closest('tr'));
                $('#tabs').children().eq(workspace.index).click();
                return;
            }
                
        });
            
    }

    sendAddinMessage = true;

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

            for(let viewerInstance of viewerInstances.instances) {
                if(viewerInstance.pathNumbers === item.path) {
                    item.instances.push(viewerInstance);
                } else if(viewerInstance.path === item.path) {
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
                            if(instance.instancePath == gridRow.instancePath) {
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
                        { fieldId : workspace.fieldsList.partNumber   , value : item.partNumber       },
                        { fieldId : workspace.fieldsList.title        , value : item.details.TITLE    },
                        { fieldId : workspace.fieldsList.revision     , value : item.details.REVISION },
                        { fieldId : workspace.fieldsList.path         , value : item.path             },
                        { fieldId : workspace.fieldsList.instanceId   , value : instance.instanceId   },
                        { fieldId : workspace.fieldsList.instancePath , value : instance.instancePath },
                        { fieldId : workspace.fieldsList.boundingBox  , value : JSON.stringify(instance.boundingBox) }
                    ]
                }

                requests.push($.post('/plm/add-grid-row', params));
                refresh = true;

            }

        }

        if(refresh) grids.push(iWS);
        iWS++;

    }

    Promise.all(requests).then(function(responses) {
        printResponsesErrorMessagesToConsole(responses);
        for(let grid of grids) {
            settings['table-' + grid].load();
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
        partNumber   : '',
        path         : '',
        instancePath : ''
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

                case columns.instancePath:
                    gridRow.instancePath = elemCell.children().first().val();
                    break;

            }

        }           
        
    });

    return gridRow;

}