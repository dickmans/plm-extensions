let links            = {};
let workspaces       = [];
let completionEvents = { viewer : false, bom : false, grids : 0 };
let pendingProcesses = 0;


let paramsDetails = {
    headerLabel     : 'descriptor',
    expandSections  : ['Basic'],
    layout          : 'narrow',
    openInPLM       : true,
    toggles         : true
}


$(document).ready(function() {

    setUIEvents();
    setAddinEvents();
    setAddinMode();

    viewerSettings.cacheBoundingBoxes = true;
    viewerSettings.cacheInstances     = true;

    getFeatureSettings('instances', [], function() {
        
        let index = 0;

        workspaces = config.tabs;

        for(let workspace of workspaces) {
            workspace.id = 'table-' + index++;
            if(isBlank(workspace.workspaceId)) workspace.workspaceId = common.workspaceIds.serialNumbers;
        };      

        let wsIdAssets = config.assets.workspaceId || common.workspaceIds.assets;

        if(urlParameters.wsId != wsIdAssets) {

            insertResults(wsIdAssets, [{
                field       : config.assets.fieldIdBOM,       
                type        : 0,
                comparator  : 3,
                value       : urlParameters.number   // partNumber to prevent findByPartNumber
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
        if($(this).hasClass('disabled')) return;
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

    // Deselect grid item
    $('body').click(function(e) {
        let elemGrid = $(e.target).closest('table.grid');
        if(elemGrid.length === 0) {
            viewerResetSelection();
            applyViewerColors();
            insertDetails(links.ebom, paramsDetails);
            $('*').removeClass('highlighted');
            $('#bom').find('.selected').removeClass('selected');
        }
    });

    // Sync Dialog
    $('.sync-close').click(function() {
        $('#overlay').hide();
        $('#sync').hide();
    });
    $('#sync-save').click(function() {
        $('#sync').hide();
        pendingProcesses = workspaces.length;
        for(let workspace of workspaces) saveGridData(workspace.id);
    });

}


// Start Editor
function selectResult(elemClicked) {

    openEditor(elemClicked.attr('data-link'));

}
function openEditor(link) {

    appendOverlay(false);

    let requests = [ $.get('/plm/details', { link : link }) ];
    let syncTHRow = $('#sync-throw');

    for(let workspace of workspaces) {
        
        requests.push($.get('/plm/grid-columns', { wsId : workspace.workspaceId }));

        $('<th></th>').appendTo(syncTHRow)
            .addClass('sync-column')
            .css('background', colors.list[workspace.colorIndex])
            .css('width', 520 / workspaces.length)
            .html(workspace.label);  

        $('<td></td>').addClass('sync-column').appendTo($('#sync-new'));
        $('<td></td>').addClass('sync-column').appendTo($('#sync-update'));
        $('<td></td>').addClass('sync-column').appendTo($('#sync-mismatch'));
        $('<td></td>').addClass('sync-column').appendTo($('#sync-matches'));

    }

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

    });

}
function onViewerLoadingDone() {

    completionEvents.viewer = true;
    matchBOMViewerInstances();

    // setGridSyncStatus();

}
// function setGridSyncStatus() {

//     return;

//     if(completionEvents <= workspaces.length) return;

//     let index = 0;

//     for(let workspace of workspaces) {

//         let elemCounter     = $('.tab-counter').eq(index);
//         let elemTHead       = $('#table-' + index + '-thead');
//         let elemTHRow       = elemTHead.children().first();
//         let elemTBody       = $('#table-' + index + '-tbody');
//         let viewerInstances = [];
//         let countMismatches = 0;

//         elemCounter.addClass('hidden');

//         elemTBody.children().each(function() {

//             let elemRow = $(this);

//             if(elemRow.hasClass('table-group')) {

//                 let elemCellGroup = elemRow.children().first(); 
//                     elemCellGroup.attr('colspan', elemTHRow.children().length);

//                 let partNumber  = elemCellGroup.html();
//                 viewerInstances = viewerGetComponentsInstances([partNumber])[0].instances;

//             } else {

//                 let elemCell = elemRow.children('.sync-status').first();
//                     elemCell.html('');

//                 // let instanceId   = elemRow.find('.field-id-INSTANCE_ID').children().first().val();
//                 let instancePath = elemRow.find('.field-id-INSTANCE_PATH').children().first().val();
//                 let boundingBox  = elemRow.find('.field-id-BOUNDING_BOX').children().first().val();
//                 let elemIcon     = $('<div></div>').appendTo(elemCell).addClass('icon');
//                 let statusIcon   = 'icon-checkmark';
//                 let statusTitle  = 'No matching instance';
//                 let matches      = { path : false, box : false, instance : null }

//                 for(let viewerInstance of viewerInstances) {

//                     let matchBox  = (JSON.stringify(viewerInstance.boundingBox) == boundingBox);
//                     let matchPath = viewerInstance.instancePath == instancePath;

//                     if(matchBox && matchPath) {
//                         matches.box  = true;
//                         matches.path = true;
//                         break;
//                     } else if(matchPath) {
//                         matches.box  = false;
//                         matches.path = true;
//                         break;
//                     } else if(matchBox) {
//                         matches.box = true;
//                     }
                    
//                 }
                
//                 if(matches.box && matches.path) {
//                     statusIcon  = 'icon-checkmark';
//                     statusTitle = 'Found matching instance ID at right position';
//                     elemIcon.css('background', 'none');
//                 } else {
//                     if(matches.path) {
//                         statusIcon  = 'icon-product-alert';
//                         statusTitle = 'Found instance BOM, but at different 3D position. Use BOM sync to update the reference.';
//                     } else if(matches.box) {
//                         statusIcon  = 'icon-list-alert';
//                         statusTitle = 'Found instance in 3D, but at different BOM position. Use BOM sync to update the reference.';
//                     } else if(!matches.box && !matches.path) {
//                         statusIcon  = 'icon-cancel';
//                         statusTitle = 'No matching instance found. Use BOM sync to update this table.';
//                     }
//                     countMismatches++;
//                     elemIcon.css('background', colors.list[workspace.colorIndex]);
//                 }

//                 elemCell.attr('title', statusTitle);
//                 elemIcon.addClass(statusIcon);

//             }

//         });

//         elemCounter.html(countMismatches);

//         if(countMismatches > 0) elemCounter.removeClass('hidden');

//         index++;

//     }

// }


// Enable embedded mode to support usage as addin
function setAddinMode() {

    // isAddin = true;

    if(!isAddin) return;

    $('body').addClass('addin');

}


// Post processing once BOM is loaded
function afterBOMCompletion(id, data) {  

    $('#overlay').hide();

    completionEvents.bom = true;

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

    matchBOMViewerInstances();

}
function matchBOMViewerInstances() {

    if(!completionEvents.viewer) return;
    if(!completionEvents.bom   ) return;

    if(completionEvents.grids === workspaces.length) {
        $('#bom-sync').removeClass('disabled');
        $('#excel-export').removeClass('disabled');
    }

    for(let workspace of workspaces) {
        for(let item of workspace.items) {
            
            let viewerInstances = viewerGetComponentsInstances([item.partNumber])[0];

            item.instances = [];
            
            for(let item of workspace.items) {
                for(let viewerInstance of viewerInstances.instances) {
                    if(viewerInstance.pathNumbers === item.path) {
                        item.instances.push(viewerInstance);
                    }
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

        let elemTab = $('<div></div>').appendTo($('#tabs'))
            .attr('data-index', index)
            .attr('data-tab-group', 'tab-item-type')
            .html(workspace.label)
            .click(function() {
                clickTab($(this));
                let index = $(this).index() + 0;
                $('#items').children().addClass('hidden');
                $('#table-' + index).removeClass('hidden');
                $('*').removeClass('selected-for-mapping');
                $('*').removeClass('mapping-start');
                $('.bom-sync-result-match').removeClass('hidden');
                $('.bom-sync-result-update').removeClass('hidden');
            });

        $('<div></div>').prependTo(elemTab)
            .addClass('icon')
            .addClass(workspace.bomIcon)
            .css('color', colors.list[workspace.colorIndex]);

        $('<div></div>').appendTo(elemTab)
            .addClass('tab-counter')
            .addClass('hidden')
            .css('background-color', colors.list[workspace.colorIndex])
            .html(0);

        $('<div></div>').appendTo($('#items'))
            .addClass('tab-item-type')
            .addClass('hidden')
            .addClass('row-hovering')
            .attr('id', workspace.id)
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

    for(let workspace of workspaces) {

        if(!isBlank(workspace.link)) {

            $('#' + workspace.id).addClass('no-bom-sync');
            
            insertGrid(workspace.link, {
                id                : workspace.id,
                autoSave          : true,
                counters          : false,
                editable          : true,
                hideHeader        : true,
                multiSelect       : true,
                reload            : true,
                search            : false,
                filterEmpty       : false,
                filterBySelection : true,
                toggles           : true,
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
                afterSave         : function(id) { afterGridSave(id); },
            });
        }

    }

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

    completionEvents.grids++;

    let elemTable   = $('#' + id);
    let elemActions = $('#' + id + '-actions');
    let elemToggle  = $('#' + id + '-toggle-isolate');
    let elemTHead   = $('#' + id + '-thead');
    let elemTBody   = $('#' + id + '-tbody');
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
        .html('BOM Sync');

    elemTBody.children('.content-item').each(function() {

        let elemRow  = $(this);
        let elemCell = $('<td></td>').insertAfter(elemRow.children().first()).addClass('sync-status');

        elemRow.attr('data-mapped', false);

        $('<div></div>').appendTo(elemCell)
            .addClass('icon')
            .addClass('icon-help-circle');

    });

    if(completionEvents.grids === workspaces.length) {
        $('#bom-sync').removeClass('disabled');
        $('#excel-export').removeClass('disabled');
    }

}
function selectGridItem(elemClicked) {

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
function afterGridSave(id) {

    $('#' + id).addClass('no-bom-sync');
    if(--pendingProcesses > 0) $('#overlay').show();

}


// Highlight matching instance upon selection in Inventor
// selectInstance('002771.iam|Build Assembly:1|94500A231:2')
// selectInstance('01-0289.iam|01-0745:1|01-0743:1')
function selectInstance(instancePath) {

    console.log('selectInstance START')

    if(isBlank(instancePath)) return;

    for(let workspace of workspaces) {

        let fieldId = workspace.fieldsList.instancePath;

        $('#' + workspace.id + '-table').find('.field-id-' + fieldId).each(function() {

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
    $('#sync').show();
    $('*').removeClass('bom-sync-result-new');
    $('*').removeClass('bom-sync-result-match');
    $('*').removeClass('bom-sync-result-update');
    $('*').removeClass('bom-sync-result-mismatch');

    let iWS   = 0;
    let grids = [];

    for(let workspace of workspaces) {

        let gridRows = getGridRows(iWS);
        let refresh  = false;

        $('#' + workspace.id).removeClass('no-bom-sync');

        workspace.counters = {
            new      : 0,
            match    : 0,
            update   : 0,
            mismatch : 0
        }

        for(let item of workspace.items) {

            for(let instance of item.instances) {
                
                if(isBlank(instance.action)) instance.action = 'add';

                instance.status = 'new';

                for(let gridRow of gridRows) {
                    if(item.partNumber === gridRow.partNumber) {
                        if(instance.instancePath == gridRow.instancePath) {

                            if(!gridRow.elem.hasClass('new')) {
                                instance.status = 'match';
                                instance.action = '';
                                workspace.counters.match++;
                                setGridRowSyncStatus(workspace, gridRow, 'match');
                            } else {
                                instance.action = '';
                            }

                            gridRow.elem.attr('data-mapped', true);

                        } else if(gridRow.boundingBox === JSON.stringify(instance.boundingBox)) {
                            
                            instance.status = 'update';
                            instance.action = 'update';
                            workspace.counters.update++;
                            
                            gridRow.elem.attr('data-mapped', true);
                            gridRow.elem.addClass('changed');

                            let elemCell = gridRow.elem.find('.field-id-' + workspace.fieldsList.instancePath);
                                elemCell.children().first().val(instance.instancePath);
                                elemCell.addClass('changed');
                        
                            setGridRowSyncStatus(workspace, gridRow, 'update');

                        }

                    }
                }

                if(instance.status === 'new') workspace.counters.new++;

            }

        }

        for(let item of workspace.items) {
            
            let gridGroups = getGridGroups(iWS);
            let elemGroup = null;

            gridGroups.each(function() {
                let gridGroup = $(this);
                if(gridGroup.attr('data-title') === item.partNumber) {
                    elemGroup = gridGroup;
                }
            });

            for(let instance of item.instances) {
                if(instance.action == 'add') {
                    
                    if(elemGroup === null) elemGroup = insertGridGroup(workspace.id, item.partNumber);
                    
                    let elemRow  = insertGridRow(workspace.id, null, null, item.partNumber);
                    let elemCell = $('<td></td>').insertAfter(elemRow.children().first()).addClass('sync-status');

                    elemRow.find('.field-id-' + workspace.fieldsList.partNumber  ).children().first().val(item.partNumber);
                    elemRow.find('.field-id-' + workspace.fieldsList.title       ).children().first().val(item.details.TITLE);
                    elemRow.find('.field-id-' + workspace.fieldsList.revision    ).children().first().val(item.details.REVISION);
                    elemRow.find('.field-id-' + workspace.fieldsList.instanceId  ).children().first().val(instance.instanceId);
                    elemRow.find('.field-id-' + workspace.fieldsList.instancePath).children().first().val(instance.instancePath);
                    elemRow.find('.field-id-' + workspace.fieldsList.path        ).children().first().val(item.path);
                    elemRow.find('.field-id-' + workspace.fieldsList.boundingBox ).children().first().val(JSON.stringify(instance.boundingBox));

                    elemRow.find('input').click(function() {
                        selectGridItem($(this).closest('tr'));
                    });

                    elemRow.addClass('bom-sync-result-new');

                    $('<div></div>').appendTo(elemCell)
                        .addClass('icon')
                        .addClass('icon-create')
                        .addClass('filled')
                        .attr('title', 'This line will be added to match the BOM instances');

                    let elemActions = $('<div></div>').appendTo(elemCell)
                        .addClass('sync-actions')

                    $('<div></div>').appendTo(elemActions)
                        .addClass('button')
                        .addClass('match-select')
                        .html('Select')
                        .attr('title', 'Match the instance to this line')
                        .click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            selectInstanceMapping($(this));
                            stopInstanceMapping($(this));
                        });

                    $('#' + workspace.id + '-no-data').hide();
                    $('#' + workspace.id + '-content').show();

                    instance.action = '';

                }
            }
            
        }

        for(let gridRow of gridRows) {
            if(gridRow.elem.attr('data-mapped') === 'false') {
                setGridRowSyncStatus(workspace, gridRow, 'mismatch');
                workspace.counters.mismatch++;
            }
        }

        $('#sync-new'     ).children().eq(iWS + 2).html(workspace.counters.new);
        $('#sync-matches' ).children().eq(iWS + 2).html(workspace.counters.match);
        $('#sync-update'  ).children().eq(iWS + 2).html(workspace.counters.update);
        $('#sync-mismatch').children().eq(iWS + 2).html(workspace.counters.mismatch);

        if(refresh) grids.push(iWS);
        iWS++;

    }

    return;

}
function getGridGroups(index) {

    let elemTBody = $('#table-' + index + '-tbody');

    return elemTBody.children('.table-group');

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
        instancePath : '',
        status       : 'mismatch'
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

                case columns.boundingBox:
                    gridRow.boundingBox = elemCell.children().first().val();
                    break;

            }

        }           
        
    });

    return gridRow;

}
function setGridRowSyncStatus(workspace, gridRow, status) {

    let elemCell = gridRow.elem.find('.sync-status');
        elemCell.html('');

    let elemIcon = $('<div></div>').appendTo(elemCell).addClass('icon');

    switch(status) {

        case 'match':
            gridRow.elem.addClass('bom-sync-result-match');
            elemIcon.addClass('icon-checkmark')
                .addClass('filled')
                .attr('title', 'This line is in sync with the BOM')
            break;

        case 'update':
            gridRow.elem.addClass('bom-sync-result-update');
            elemIcon.addClass('icon-product-alert')
                .addClass('filled')
                .attr('title', 'This instance has been moved in the structure, but will be mapped based on matching bounding box');
            break;

        case 'mismatch':
            gridRow.elem.addClass('bom-sync-result-mismatch');
            elemIcon.addClass('icon-warning')
                .attr('title', 'Requires manual action as there is no match in BOM')
                .addClass('filled')
                .css('color', colors.list[workspace.colorIndex]);

            let elemActions = $('<div></div>').appendTo(elemCell)
                    .addClass('sync-actions')

            $('<div></div>').appendTo(elemActions)
                .addClass('button')
                .addClass('match-start')
                .html('Match')
                .attr('title', 'Match this row to a new row')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    startInstanceMapping($(this));
                });

            $('<div></div>').appendTo(elemActions)
                .addClass('button')
                .addClass('match-stop')
                .html('Stop')
                .attr('title', 'Stop matching this row to an existing one')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    stopInstanceMapping($(this));
                });

            break;

    }

}
function startInstanceMapping(elemClicked) {

    $('*').removeClass('selected-for-mapping');
    $('.bom-sync-result-match').addClass('hidden');
    $('.bom-sync-result-update').addClass('hidden');
    $('.mapped').addClass('hidden');

    elemClicked.closest('table').addClass('mapping-start');

    let elemRow = elemClicked.closest('tr');
        elemRow.addClass('selected-for-mapping');

}
function stopInstanceMapping(elemClicked) {

    $('*').removeClass('mapping-start');

    $('*').removeClass('selected-for-mapping');
    $('.bom-sync-result-match').removeClass('hidden');
    $('.bom-sync-result-update').removeClass('hidden');
    $('.mapped').removeClass('hidden');

}
function selectInstanceMapping(elemClicked) {

    let elemTarget = elemClicked.closest('tr');
        elemTarget.addClass('mapped');

    let elemIcon = elemTarget.find('.sync-status').find('.icon');
        elemIcon.removeClass('icon-create').addClass('icon-swap-circle');

    let elemSource = $('.selected-for-mapping');
        elemSource.addClass('hidden');

    copyInstanceValues(elemSource, elemTarget);    

}
function copyInstanceValues(elemSource, elemTarget) {
    
    let elemTop      = elemSource.closest('.panel-top');
    let indexTop     = Number(elemTop.attr('data-index'));
    let workspace    = workspaces[indexTop];
    let sourceValues = elemSource.find('input');
    let targetValues = elemTarget.find('input');
    let index        = 0;
    let fieldsEx     = [];

    fieldsEx.push(workspace.fieldsList.partNumber);
    fieldsEx.push(workspace.fieldsList.title);
    fieldsEx.push(workspace.fieldsList.revision);
    fieldsEx.push(workspace.fieldsList.path);
    fieldsEx.push(workspace.fieldsList.instanceId);
    fieldsEx.push(workspace.fieldsList.instancePath);
    fieldsEx.push(workspace.fieldsList.boundingBox);

    sourceValues.each(function() {

        let elemInput = targetValues.eq(index);
        let idInput   = elemInput.attr('data-id');

        if(!fieldsEx.includes(idInput)) {
            elemInput.val($(this).val());
            elemInput.parent().addClass('changed');
        }

        index++;
        
    })

}