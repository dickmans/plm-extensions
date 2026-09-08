let links            = {};
let workspaces       = [];
let completionEvents = { viewer : false, mcad : false, ecad : false, grids : 0 };
let pendingProcesses = 0;



$(document).ready(function() {

    setUIEvents();
    // setAddinEvents();
    // setAddinMode();

    $('#header-title').html(config.labels.appTitle || 'M/E BOM Editor');
    $('#sync-title'  ).html(config.labels.syncMCAD || 'Synchronize Mechancial BOM');

    workspaces = config.tabs;

    let paramsLandingViews  = config.panels.landingViews;
        paramsLandingViews.id = 'views';
        paramsLandingViews.onDblClickItem = function(elemClicked) { openItem(elemClicked.attr('data-link')); }
    
    let paramsLandingSearch = config.panels.landingSearch;
        paramsLandingSearch.id = 'search';
        paramsLandingSearch.onDblClickItem = function(elemClicked) { openItem(elemClicked.attr('data-link')); }

    let requests  = [];
    let syncTHRow = $('#sync-throw');
    let index     = 0;

    for(let workspace of workspaces) {

        workspace.id = 'table-' + index++;
        
        requests.push($.get('/plm/grid-columns', { wsId : workspace.workspaceId, useCache : true }));

        $('<th></th>').appendTo(syncTHRow)
            .addClass('sync-column')
            .css('background', colors.list[workspace.colorIndex])
            .css('width', 520 / workspaces.length)
            .html(workspace.label);  

        $('<td></td>').addClass('sync-column').appendTo($('#sync-matches'));
        $('<td></td>').addClass('sync-column').appendTo($('#sync-update'));
        $('<td></td>').addClass('sync-column').appendTo($('#sync-new'));
        $('<td></td>').addClass('sync-column').appendTo($('#sync-ecad'));
        $('<td></td>').addClass('sync-column').appendTo($('#sync-mismatch'));

    }    

    getFeatureSettings('mebom', requests, function(responses) {

        for(let index = 0; index < responses.length; index++) {

            let workspace         = workspaces[index];
                workspace.columns = responses[index].data.fields;
                workspace.index   = index - 1;

        }

        let wsIdContext = config.wsContext.workspaceId || common.workspaceIds.equipments;
        
        if(urlParameters.link === '') {

            insertWorkspaceViews (wsIdContext, paramsLandingViews );
            insertWorkspaceSearch(wsIdContext, paramsLandingSearch);

        } else openItem(urlParameters.link);

    });

});


// Set UI controls
function setUIEvents() {

    // Header Toolbar Buttons
    // $('#mcad-sync').click(function(e) {
    //     e.stopPropagation();
    //     if($(this).hasClass('disabled')) return;
    //     syncItemsList();
    // });
    $('#excel-export').click(function(e) {
        e.stopPropagation();
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
    $('#toggle-layout').click(function(e) {
        e.stopPropagation();
        $('body').toggleClass('layout-h');
        $(this).toggleClass('toggle-on');
        viewerResize(200);
    });
    $('#toggle-mcad').click(function(e) {
        e.stopPropagation();
        $('body').toggleClass('no-mcad');
        $(this).toggleClass('toggle-on');
        viewerResize(200);
    });
    $('#toggle-ecad').click(function(e) {
        e.stopPropagation();
        $('body').toggleClass('no-ecad');
        $(this).toggleClass('toggle-on');
        viewerResize(200);
    });
    $('#toggle-details').click(function(e) {
        e.stopPropagation();
        $('body').toggleClass('no-details');
        $(this).toggleClass('toggle-on');
        viewerResize(200);
    });

    // Deselect grid item
    // $('body').click(function(e) {
    //     let elemGrid = $(e.target).closest('table.grid');
    //     if(elemGrid.length === 0) {
    //         viewerResetSelection();
    //         applyViewerColors();
    //         insertDetails(links.ebom, paramsDetails);
    //         $('*').removeClass('highlighted');
    //         $('#bom').find('.selected').removeClass('selected');
    //         gridResetSelection('ecad');
    //     }
    // });

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
function openItem(link) {

    disableControlsAtStartup();

    links.context = link;

    completionEvents.mcad   = false;
    completionEvents.ecad   = false;
    completionEvents.viewer = false;
    completionEvents.grids  = 0;

    appendOverlay(false);

    let requests = [ $.get('/plm/details', { link : link }) ];

    let paramsMCAD = config.panels.bomMCAD;
        paramsMCAD.id = 'mcad';
        paramsMCAD.headerLabel = paramsMCAD.headerLabel || 'Mechanical BOM';
        paramsMCAD.singleToolbar = 'actions';
        paramsMCAD.viewerSelection = true;
        paramsMCAD.afterCompletion = function(id, data) { afterMCADCompletion(id, data) };

    let paramsECAD = config.panels.bomECAD;

        paramsECAD.id              = 'ecad';
        paramsECAD.headerLabel     = paramsECAD.headerLabel || 'Electrical BOM';
        paramsECAD.singleToolbar   = 'actions';
        paramsECAD.dragable        = true;
        paramsECAD.afterCompletion = function(id, data) { afterECADCompletion(id, data) };

    let paramsDetails = config.panels.itemDetails;
        paramsDetails.id = 'details';
        paramsDetails.headerLabel = paramsDetails.headerLabel || 'descriptor';

    Promise.all(requests).then(function(responses) {

        printResponsesErrorMessagesToConsole(responses);

        urlParameters.title = responses[0].data.title;

        $('body').addClass('screen-main').removeClass('screen-landing');
        $('#header-subtitle').html(urlParameters.title);
        $('#overlay').hide();

        links.mcad = getSectionFieldValue(responses[0].data.sections, config.wsContext.fieldIds.mcad , '', 'link');
        links.ecad = getSectionFieldValue(responses[0].data.sections, config.wsContext.fieldIds.ecad , '', 'link');

        for(let workspace of workspaces) workspace.link = getSectionFieldValue(responses[0].data.sections, workspace.fieldId, '', 'link');

        // if(includeECAD) {
            // $('#mcad-sync').remove();
            // $('body').removeClass('no-ecad');
            // $('#toggle-layout').addClass('hidden');
            // $('#toggle-mcad-bom').html('Mechanical BOM');
            // $('#toggle-ecad-bom').removeClass('hidden');
        // } else {
            // $('#mcad-sync').removeClass('hidden');
            // $('#sync-ecad').addClass('hidden');
        // }


        if(isBlank(links.mcad)) {

            showStartupError({
                title        : 'Missing Data',
                details      : 'This editor requires an Mechanical BOM with viewable file, but such data could not be found in context of<br><strong>' + responses[0].data.title + '</strong>',
                instructions : 'Select an Mechanical BOM in field <strong>' + config.wsContext.fieldIds.mcad + '</strong> or update your server configuration to use another field referencing the right Mechancial BOM'
            });

        } else {

            // let paramsBOM = {
            //     headerLabel         : 'BOM',
            //     search              : true,
            //     path                : true,
            //     counters            : true,
            //     openInPLM           : true,
            //     collapseContents    : true,
            //     toggles             : true,
            //     viewerSelection     : false,
            //     includeBOMPartList  : true,
            //     bomViewName         : config.bomViewName,
            //     fieldsIn            : ['Quantity', 'Qty'],
            //     contentSize         : 'm',
            //     afterCompletion     : function(id, data)    { afterBOMCompletion(id, data)  },
            //     onClickItem         : function(elemClicked) { onClickBOMItem(elemClicked); }
            // }




            insertBOM(links.mcad, paramsMCAD);

            insertViewer(links.mcad, { 
                cacheInstances     : true,
                cacheBoundingBoxes : true,
                features           : config.viewerFeatures,
                afterCompletion    : function(id) { afterViewerCompletion(id); }
            });

            // for(let index = 1; index < responses.length; index++) {

            //     let workspace         = workspaces[index-1];
            //         workspace.columns = responses[index].data.fields;
            //         workspace.link    = getSectionFieldValue(responses[0].data.sections, workspace.fieldId, '', 'link');
            //         workspace.index   = index - 1;

            // }

            insertAlignmentTabs();
            insertAlignmentGrids();
            // insertBOMPartsList(links.ecad, paramsECAD);
            insertGrid(links.ecad, paramsECAD);
            insertDetails(links.context, paramsDetails);

            // if(includeECAD) {

            //     // insertGrid(links.ecad, {
            //     //     id            : 'ecad',
            //     //     headerLabel   : 'Electrical BOM',
            //     //     groupBy       : 'NUMBER',
            //     //     fieldsIn      : config.ecad.fieldsIn,
            //     //     attributes : [
            //     //         { name : 'data-part-number', fieldId : config.ecad.fieldIds.partNumber },
            //     //         { name : 'data-tag',         fieldId : config.ecad.fieldIds.tag        }
            //     //     ],
            //     //     openInPLM : true,
            //     //     reload    : true,
            //     //     toggles   : true,
            //     //     afterCompletion : function(id, data) { afterECADCompletion(id, data) },
            //     // })

            //     insertBOM(links.ecad, {
            //         id : 'ecad',
            //         headerLabel : 'Electrical BOM'
            //     })

            // }

        }

    });

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
//                 let locViewer = elemRow.find('.field-id-INSTANCE_PATH').children().first().val();
//                 let boundingBox  = elemRow.find('.field-id-BOUNDING_BOX').children().first().val();
//                 let elemIcon     = $('<div></div>').appendTo(elemCell).addClass('icon');
//                 let statusIcon   = 'icon-checkmark';
//                 let statusTitle  = 'No matching instance';
//                 let matches      = { path : false, box : false, instance : null }

//                 for(let viewerInstance of viewerInstances) {

//                     let matchBox  = (JSON.stringify(viewerInstance.boundingBox) == boundingBox);
//                     let matchPath = viewerInstance.locViewer == locViewer;

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
// function setAddinMode() {

//     // isAddin = true;

//     if(!isAddin) return;

//     $('body').addClass('addin');

// }
function insertAlignmentTabs() {

    let index = 0;

    $('#tabs').html('');

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
                $('.mcad-sync-result-match').removeClass('hidden');
                $('.mcad-sync-result-update').removeClass('hidden');
            });

        $('<div></div>').prependTo(elemTab)
            .addClass('icon')
            .addClass(workspace.icon)
            .css('color', colors.list[workspace.colorIndex]);

        $('<div></div>').appendTo(elemTab)
            .addClass('tab-counter')
            .addClass('hidden')
            .css('background-color', colors.list[workspace.colorIndex])
            .html(0);

        $('<div></div>').appendTo($('#grids'))
            .addClass('tab-item-type')
            .addClass('hidden')
            .addClass('row-hovering')
            .attr('id', workspace.id)
            .attr('data-index', index++);

    }

    // let elemTabAll = $('<div></div>').appendTo($('#tabs'))
    //     .attr('data-index', index)
    //     .attr('data-tab-group', 'tab-item-type')
    //     .html('All')
    //     .click(function() {
    //         clickTab($(this));
    //         let index = $(this).index() + 0;
    //         $('#items').children().addClass('hidden');
    //         $('#table-' + index).removeClass('hidden');
    //         $('*').removeClass('selected-for-mapping');
    //         $('*').removeClass('mapping-start');
    //         $('.mcad-sync-result-match').removeClass('hidden');
    //         $('.mcad-sync-result-update').removeClass('hidden');
    //     });    

    // $('<div></div>').prependTo(elemTabAll)
    //     .addClass('icon')
    //     .addClass('icon-sum');

    $('#tabs').children().first().click();

}
function insertAlignmentGrids() {

    let paramsGrid = config.panels.alignmentGrids;

    for(let workspace of workspaces) {

        if(!isBlank(workspace.link)) {

            $('#' + workspace.id).addClass('no-mcad-sync');

            paramsGrid.id              = workspace.id;
            paramsGrid.singleToolbar   = 'actions',
            paramsGrid.sortOrder       = workspace.sortOrder || [];
            paramsGrid.fieldsIn        = workspace.fieldsIn  || [];
            paramsGrid.fieldsEx        = workspace.fieldsEx  || [];
            paramsGrid.groupBy         = workspace.groupBy   || '';
            paramsGrid.afterCompletion = function(id) { afterGridCompletion(id); },
            paramsGrid.afterSave       = function(id) { afterGridSave(id);       },
            
            insertGrid(workspace.link, paramsGrid);


            // insertGrid(workspace.link, {
            //     // id                : workspace.id,
            //     attributes : [
            //         { name : 'data-part-number'  , fieldId : workspace.fieldIds.partNumber   },
            //         { name : 'data-tag'          , fieldId : workspace.fieldIds.tag          },
            //         { name : 'data-instance-path', fieldId : workspace.fieldIds.locViewer },
            //         { name : 'data-source'       , fieldId : workspace.fieldIds.source       }
            //     ],
            //     // singleToolbar     : 'actions',
            // });

        }

    }

}
// function insertAlignmentGrids() {

//     let index = 0;

//     for(let workspace of workspaces) {

//         let elemParent = $('#grids').children(':eq(' + index++ + ')');
//         let elemTHead  = $('<thead></thead>').appendTo(elemParent);
//         let elemTHRow  = $('<tr></tr>').appendTo(elemTHead);

//         for(let column of workspace.columns) {

//             let id = column.__self__.split('/').pop();

//             if((workspace.fieldsIn.length === 0) || ( workspace.fieldsIn.includes(id))) {
//                 if((workspace.fieldsEx.length === 0) || (!workspace.fieldsEx.includes(id))) {
//                     $('<th></th>').appendTo(elemTHRow)
//                         .addClass('grid-column-' + id)
//                         .html(column.name);
//                 }
//             }

//         }

//     }

// }
function disableControlsAtStartup() {

    $('#filter'        ).addClass('disabled');
    $('#excel-export'  ).addClass('disabled');
    $('#mcad-mcad-sync').addClass('disabled');

}
function enableControlsUponCompletion() {

    if(!completionEvents.mcad  ) return;
    if(!completionEvents.ecad  ) return;
    if(!completionEvents.viewer) return;

    if(completionEvents.grids !== workspaces.length) return;

    $('#filter'        ).removeClass('disabled');
    $('#excel-export'  ).removeClass('disabled');
    $('#mcad-mcad-sync').removeClass('disabled');

    matchMCADViewerInstances();
    updateECADSyncColumn();

}


// MCAD BOM Tree
function afterMCADCompletion(id, data) {  

    $('#overlay').hide();

    let elemControls = $('<div></div>').appendTo($('#mcad-header')).addClass('panel-controls'); 

    $('<div></div>').appendTo(elemControls)
        .attr('id', 'mcad-mcad-sync')
        .addClass('button')
        .addClass('with-icon')
        .addClass('icon-link-update')
        .addClass('default')
        .addClass('disabled')
        .html('Sync Tabs')
        .click(function() {
            syncMCADItemsListWithAligment();
        });

    // #mcad-sync.disabled.button.default.with-icon.icon-refresh.hidden(title="Synchronize grid entries with the BOM tree") Sync with BOM

    console.log(data);

    getMCADItemsForAlignment(data.bomPartsList);
    addMCADToolbarActions();
    addMCADTreeIconColumn(id);

    completionEvents.mcad = true;

    enableControlsUponCompletion();

}
function getMCADItemsForAlignment(bomPartsList) {

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
function addMCADToolbarActions() {

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
function addMCADTreeIconColumn(id) {

    let elemTHRow = $('#' + id + '-thead-row');
    let elemTBody = $('#' + id + '-tbody');

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
                    elemIcon.addClass(workspace.icon);
                    elemIcon.attr('title', workspace.label);
                    elemIcon.css('background', colors.list[workspace.colorIndex]);
                    elemRow.addClass('workspace-type-' + index);
                    break;
                }
            }
            index++;
        }

    });

}
function applyViewerColors() {

    let applyBOMColors = $('#apply-bom-colors').hasClass('main');

    viewerResetColors();

    if(applyBOMColors) {

        viewerHideAll();

        for(let workspace of workspaces) {

            let partNumbers = [];

            for(let item of workspace.items) partNumbers.push(item.partNumber);

        viewerSetColors(partNumbers, { unhide : true, color : colors.vectors.list[workspace.colorIndex], resetColors : false } );

        }

    } else {

        viewerResetSelection();

    }


}


// Viewer
function afterViewerCompletion(id) {

    completionEvents.viewer = true;

    enableControlsUponCompletion();

}
function matchMCADViewerInstances() {

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


// Filter tables upon BOM selection
function onClickBOMItem(elemClicked) {

    let selected = $('#bom-tbody').find('tr.selected').length;

    $('#items').find('.highlighted').removeClass('highlighted');
    $('#items').find('.selected'   ).removeClass('selected'   );

    if(selected === 0) {

        $('#items').find('tr.content-item').removeClass('hidden');
        $('#items').find('tr.table-group').removeClass('hidden');

        viewerResetSelection();
        applyViewerColors();
        insertDetails(links.ebom, paramsDetails);
        gridResetSelection('ecad');

    } else {

        let path       = getTreeItemPath(elemClicked).string;
        let partNumber = elemClicked.attr('data-part-number');
        let index     = 0;

        $('.table-group').removeClass('keep');

        for(let workspace of workspaces) {

            let elemGrid = $('#table-' + index++ + '-tbody');

            elemGrid.find('tr.content-item').each(function() {

                let elemRow   = $(this);
                let gridRow   = getGridRowDetails(elemRow, workspace.fieldIds);
                let elemGroup = elemRow.prevAll('.table-group').first();

                if(gridRow.path.indexOf(path) < 0) {
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

        gridSelectRows('ecad', [
            { attribute : 'data-part-number', value : elemClicked.attr('data-part-number') }
        ]);

    }

}


// Highlight viewer instances upon selection of item in tabs
function afterGridCompletion(id) {


    let elemTable   = $('#' + id);
    let elemActions = $('#' + id + '-actions');
    let elemToggle  = $('#' + id + '-toggle-isolate');
    let elemTHead   = $('#' + id + '-thead');
    let elemTBody   = $('#' + id + '-tbody');
    let elemTHRow   = elemTHead.children().first();

    elemTHead.find('.field-id-SOURCE').html('<span class="icon icon-script"></span>');

    // if(isAddin) {
    //     if(elemToggle.length === 0) {
            
    //         $('<div></div>').prependTo(elemActions)
    //         .addClass('button')
    //         .addClass('with-toggle')
    //         .addClass('toggle-isolate')
    //         .attr('id', id + '-toggle-isolate')
    //         .html('Isolate')
    //         .click(function() {
    //             $(this).toggleClass('toggle-on').toggleClass('toggle-off');
    //             updateIsolate($(this));
    //         });
            
    //     }
    // }

    elemTable.find('input').click(function() {
        selectGridItem($(this).closest('tr'));
    });

    // $('<th></th>').insertAfter(elemTHRow.children().first())
    //     .addClass('column-bom-matches')
    //     .html('M/E Match');

    // $('<th></th>').insertAfter(elemTHRow.children().first())
    //     .addClass('sync-status')
    //     .html('MCAD Sync');

    // elemTBody.children('.content-item').each(function() {

    //     let elemRow  = $(this);

    //     insertBOMMatchesIcons(elemRow);

    //     let elemCell = $('<td></td>').insertAfter(elemRow.children().first()).addClass('sync-status');

    //     elemRow.attr('data-mapped', false);

    //     $('<div></div>').appendTo(elemCell)
    //         .addClass('icon')
    //         .addClass('icon-help-circle');

        

    // });

    completionEvents.grids++;

    enableControlsUponCompletion();

}
function insertBOMMatchesIcons(elemRow) {

    let elemCell = $('<td></td>').insertAfter(elemRow.children().first()).addClass('column-bom-matches');

    let elemIcons = $('<div></div>').appendTo(elemCell)
        .addClass('bom-match-icons');

    $('<div></div>').appendTo(elemIcons)
        .addClass('icon')
        .addClass('bom-match-icon')
        .addClass('mechanical');

    $('<div></div>').appendTo(elemIcons)
        .addClass('icon')
        .addClass('bom-match-icon')
        .addClass('electrical');

    let classNameMCAD = getMCADMatchIcon(elemRow);
    let classNameECAD = getECADMatchIcon(elemRow);

    elemRow.addClass(classNameMCAD);
    elemRow.addClass(classNameECAD);

}
function getMCADMatchIcon(elemRow) {

    return;

    let className       = 'no-mcad-match';
    let partNumber      = elemRow.attr('data-part-number');
    let locViewer    = elemRow.attr('data-instance-path');
    let matchesNumber   = false;
    let matchesInstance = false;
    let viewerInstances = viewerGetComponentsInstances([partNumber])[0];

    for(let viewerInstance of viewerInstances.instances) {
        if(locViewer == viewerInstance.locViewer) {
            matchesInstance = true;
            matchesNumber = true;
        }
    }

    if(!matchesInstance) {
        if(viewerInstances.length > 0) matchesNumber = true;
    }

    if(matchesNumber) {
        if(matchesInstance) className = 'mcad-instance-match';
        else className = 'mcad-match';
    }

    return className

}
function getECADMatchIcon(elemRow) {

    let className     = 'no-ecad-match';
    let partNumber    = elemRow.attr('data-part-number');
    let tag           = elemRow.attr('data-tag');
    let matchesNumber = false;
    let matchesTag    = false;

    $('#ecad-tbody').children('.content-item').each(function() {

        if(!matchesTag) {

            let elemECAD   = $(this);
            let ecadNumber = elemECAD.attr('data-part-number');
            let ecadTag    = elemECAD.attr('data-tag');

            if(tag == ecadTag) {
                matchesTag    = true;
                matchesNumber = (partNumber === ecadNumber);
            } else if(!matchesNumber) {
                matchesNumber = (partNumber === ecadNumber);
            }

        }

    });

    if(matchesNumber) {
        if(matchesTag) className = 'ecad-tag-match';
        else className = 'ecad-match';
    }

    return className;

}
function selectGridItem(elemClicked) {

    let elemPanel     = elemClicked.closest('.panel-top');
    let isHighlighted = elemClicked.hasClass('highlighted');
    let index         = elemPanel.index();
    let rowData       = getGridRowDetails(elemClicked, workspaces[index].fieldIds);
    let id            = elemPanel.attr('id');

    $('.content-item.selected').removeClass('selected');

    elemClicked.addClass('selected');

    togglePanelToolbarActions(id);

    if(isHighlighted) return;

    $('.highlighted').removeClass('highlighted');
    // $('.addin-context-element').removeClass('addin-context-element');
    // $('.addin-focus-element').removeClass('addin-focus-element');

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


        treeDisplayItemByPath('mcad', rowData.locMCAD);

        viewerHighlightInstances(rowData.partNumber, [], [rowData.locViewer], {});

        gridSelectRows('ecad', [
            { attribute : 'data-part-number', value  : elemClicked.attr('data-part-number') }
        ],[
            { attribute : 'data-tag', value  : elemClicked.attr('data-tag') }
        ]);

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
    let rowData     = getGridRowDetails(elemHighlighted, workspaces[index].fieldIds);
    let addinAction = (elemToggleIsolate.hasClass('toggle-on')) ? 'isolateInstance' : 'selectInstance';
    let selection   = 'plm-item;' + rowData.partNumber + ';' + '--' + ';' + elemHighlighted.attr('data-link')+ ';' + rowData.locViewer;

    window.chrome.webview.postMessage(addinAction + ":" + selection.toString()); 

}
function afterGridSave(id) {

    $('#' + id).addClass('no-mcad-sync');
    removeGridSyncColumns();

    if(--pendingProcesses > 0) $('#overlay').show();

}



// ECAD BOM List
function afterECADCompletion(id, data) {


    let elemControls = $('<div></div>').appendTo($('#ecad-header')).addClass('panel-controls'); 

    $('<div></div>').appendTo(elemControls)
        .attr('id', 'ecad-sync')
        .addClass('button')
        .addClass('with-icon')
        .addClass('icon-link-update')
        .addClass('default')
        .html('Sync')
        .click(function() {
            syncECADItemsListWithAligment();
        });   

    $('<div></div>').appendTo(elemControls)
        .attr('id', 'ecad-import')
        .addClass('button')
        .addClass('with-icon')
        .addClass('icon-upload')
        .html('Import from ECAD')
        .click(function() {

        });    

    $('#' + id).find('.content-item').each(function() {

        let elemRow = $(this);
        let link    = elemRow.attr('data-link');
        let rowId   = link.split('/').pop();

        // for(let row of data.rows) {
            
        //     let dataId = getGridRowId(row);

        //     if(rowId == dataId) {
                
        //         let number = getGridRowValue(row, 'NUMBER', '');
        //         let tag    = getGridRowValue(row, 'TAG', '');
                
        //         elemRow.attr('data-part-number', number);
        //         elemRow.attr('data-tag', tag);
                
        //         break;

        //     }
        // }

        elemRow.click(function() {

            selectECADInstance($(this));

        });

    });

    let elemTHead = $('#' + id + '-thead');
    let elemTHRow = elemTHead.children().first();
    let elemTBody = $('#' + id + '-tbody');    

    $('<th></th>').prependTo(elemTHRow)
        .html('Sync')
        .addClass('ecad-sync-status-column');    

    elemTBody.children().each(function() {

        let elemRow = $(this);

        if(elemRow.hasClass('content-item')) {
            $('<td></td>').prependTo(elemRow).addClass('ecad-sync-status-column');
        } else {
            elemRow.attr('colspan', '200');
        }

    });

    completionEvents.ecad = true;

    enableControlsUponCompletion();

}
function selectECADInstance(elemClicked) {

    let number       = elemClicked.attr('data-part-number');
    let tag          = elemClicked.attr('data-tag');
    let locViewer = '';

    if(isBlank(number)) return;

    for(let workspace of workspaces) {

        gridResetSelection(workspace.id);

        let rows = gridFilterRows(workspace.id, [ { attribute : 'data-part-number', value : number } ]);

        // select tab if grid rows.length > 0

        for(let row of rows) {
            if(row.attr('data-tag') == tag) {
                locViewer = row.attr('data-instance-path');
                row.addClass('highlighted');
            }
        }

    }

    console.log(locViewer);

    if(locViewer === '') bomDisplayItemByPartNumber(number, true, true); else bomDisplayItemByPath(rowData.locViewer);

    viewerHighlightInstances(number, [], [locViewer], {});


}
function updateECADSyncColumn() {

    let elemTBody = $('#ecad-tbody');

    elemTBody.children('.content-item').each(function() {
    
        let elemRow  = $(this);
        let elemCell = $(this).children('.ecad-sync-status-column').first();
        let ecadItem = getRowData(elemRow, config.ecad.fieldIds);
        let status   = 'missing';

        const workspace = getMatchingWorkspace(ecadItem.class.display);
        const elemTable = $('#' + workspace.id + '-tbody');

        elemTable.children('.content-item').each(function() {

            let elemRow  = $(this);
            let gridItem = getRowData(elemRow, workspace.fieldIds);

            if(ecadItem.tag === gridItem.tag) {

                status = 'matching-tag';

                if(ecadItem.location === gridItem.locECAD) {

                    status = 'matching-location'

                    if(ecadItem.manufacturer.value === gridItem.manufacturer.value) {
                        if(ecadItem.mpn === gridItem.mpn) {
                            status = 'exact-match';
                        }
                    }

                }

            }

        });
        
        let elemIcon = $('<div></div>').addClass('icon');

        elemRow.removeClass('status-missing').removeClass('status-mapped').removeClass('status-match');

        switch(status) {

            case 'missing':
                elemRow.addClass('status-missing');
                elemIcon.addClass('icon-important')
                    .addClass('filled')
                    .attr('title', 'Do not exist in mapping table');
                break;

            case 'matching-tag':
                elemRow.addClass('status-mapped');
                elemIcon.addClass('icon-tag')
                    .addClass('filled')
                    .attr('title', 'Entry with matching tag has been found');
                break;

            case 'matching-location':
                elemRow.addClass('status-mapped');
                elemIcon.addClass('icon-delete-column')
                    .attr('title', 'Entry with matching tag and location has been found, but properties differ');
                break;

            case 'exact-match':
                elemRow.addClass('status-match');
                elemIcon.addClass('icon-released')
                    .addClass('filled')
                    .attr('title', 'Exact match is available');
                break;


        }

        elemCell.html('').append(elemIcon);

    });

}
function getRowData(elemRow, fieldIds) {

    let result = {};
    let keys   = Object.keys(fieldIds);

    for(let key of keys) {

        let elemCell =  elemRow.find('.field-id-' + fieldIds[key]);

        if(!isBlank(elemCell.attr('data-display'))) {
            result[key] = {
                value   : elemCell.attr('data-value'),
                display : elemCell.attr('data-display'),
                link    : elemCell.attr('data-value'),
                title   : elemCell.attr('data-display')
            };
        } else if(elemCell.children().length === 0) {
            result[key] = elemCell.html(); 
        } else {
            result[key] = elemCell.children().first().val();
        }
    }

    return result;

}
function getMatchingWorkspace(className) {

    for(let workspace of workspaces) {
        if(workspace.label.toLowerCase() == className.toLowerCase()) return workspace
    }

    return null;

}
function syncECADItemsListWithAligment() {

    let elemTBody = $('#ecad-tbody');

    elemTBody.children('.content-item').each(function() {
     
        let elemRow   = $(this);
        let ecadItem = getRowData(elemRow, config.ecad.fieldIds);

        console.log(ecadItem);

        let workspace = getMatchingWorkspace(ecadItem.class.display);
        let elemTable = $('#' + workspace.id + '-tbody');

        elemTable.children('.content-item').each(function() {

            let elemRow  = $(this);
            let gridItem = getRowData(elemRow, workspace.fieldIds);

            if(ecadItem.tag === gridItem.tag) {

                updateGridRowFromECADItem(elemRow, ecadItem, workspace.fieldIds);

            }

            // console.log(gridItem);

            
            // const gridLocation     = elemRow.find('.field-id-' + workspace.fieldIds.locECAD     ).children().first().val();
            // const gridTag          = elemRow.find('.field-id-' + workspace.fieldIds.tag         ).children().first().val();
            // const gridNumber       = elemRow.find('.field-id-' + workspace.fieldIds.partNumber  ).children().first().val();
            // const gridManufacturer = elemRow.find('.field-id-' + workspace.fieldIds.manufacturer).children().first().val();
            // const gridMPN          = elemRow.find('.field-id-' + workspace.fieldIds.mpn         ).children().first().val();

            // console.log(gridNumber);

            // if(tag === gridTag) {

            //     status = 'matching-tag';

            //     if(location === gridLocation) {

            //         status = 'matching-location'

            //         if(manufacturer === gridManufacturer) {
            //             if(mpn === gridMPN) {
            //                 status = 'exact-match';
            //             }
            //         }

            //     }

            // }

        });

    });

    updateECADSyncColumn();

}
function updateGridRowFromECADItem(elemRow, ecadItem, fieldIds) {

    elemRow.addClass('changed');

    updateGridRowCellFromECADItem(elemRow, fieldIds.locECAD     , ecadItem.location    );
    updateGridRowCellFromECADItem(elemRow, fieldIds.manufacturer, ecadItem.manufacturer);
    updateGridRowCellFromECADItem(elemRow, fieldIds.mpn         , ecadItem.mpn         );




    // elemRow.find('.field-id-' + fieldIds.locECAD     ).children().first().val(ecadItem.location);
    // elemRow.find('.field-id-' + fieldIds.manufacturer).children().first().val(ecadItem.manufacturer);
    // elemRow.find('.field-id-' + fieldIds.mpn         ).children().first().val(ecadItem.mpn);

}
function updateGridRowCellFromECADItem(elemRow, fieldId, ecadItemData) {

    let elemField =  elemRow.find('.field-id-' + fieldId)

    if(elemField.lenght === 0) return;

    console.log(ecadItemData);

    setFieldValue(elemField, ecadItemData);


}



// Highlight matching instance upon selection in Inventor
// selectInstance('002771.iam|Build Assembly:1|94500A231:2')
// selectInstance('01-0289.iam|01-0745:1|01-0743:1')
function selectInstance(locViewer) {

    console.log('selectInstance START')

    if(isBlank(locViewer)) return;

    for(let workspace of workspaces) {

        let fieldId = workspace.fieldIds.locViewer;

        $('#' + workspace.id + '-table').find('.field-id-' + fieldId).each(function() {

            let elemInput = $(this).children('input');
            let value     = elemInput.val();

            if(value === locViewer) {
                selectGridItem(elemInput.closest('tr'));
                $('#tabs').children().eq(workspace.index).click();
                return;
            }
                
        });
            
    }

    sendAddinMessage = true;

}


// Highlight matching items upon selection in viewer
function onViewerSelectionChangedDone(viewerInstance, partNumbers, event) {

    if(partNumbers.length === 0) return;

    let partNumber = partNumbers.pop();
    let instanceId = event.dbIdArray[0];

    treeDisplayItemByPropertyValue('bom', 'data-part-number', partNumber);

    $('#items').find('tr.content-item').removeClass('selected').removeClass('highlighted');

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
function syncMCADItemsListWithAligment() {

    // Match is based on 
    // - Part Number
    // - Viewer Location

    if($('#mcad-mcad-sync').hasClass('disabled')) return;

    $('#overlay').show();
    $('#sync').show();
    $('*').removeClass('mcad-sync-result-match');
    $('*').removeClass('mcad-sync-result-update');
    $('*').removeClass('mcad-sync-result-new');
    $('*').removeClass('mcad-sync-result-mismatch');

    let iWS   = 0;
    let grids = [];

    for(let workspace of workspaces) {

        let gridRows = getGridRows(iWS);
        let refresh  = false;

        $('#' + workspace.id).removeClass('no-mcad-sync');

        workspace.counters = {
            match    : 0,
            update   : 0,
            new      : 0,
            mismatch : 0,
            ecad     : 0
        }

        console.log(workspace);
        console.log(gridRows);
        console.log(workspace.items);

        insertGridSyncColumn(workspace.id);

        for(let item of workspace.items) {

            for(let instance of item.instances) {
                
                instance.action = instance.action || 'add';
                instance.status = 'new';

                for(let gridRow of gridRows) {
                    if(item.partNumber === gridRow.partNumber) {
                        if(instance.instancePath == gridRow.locViewer) {

                            if(!gridRow.elem.hasClass('new')) {
                                instance.status = 'match';
                                instance.action = '';
                                workspace.counters.match++;
                                setRowMCADSyncStatus(workspace, gridRow, 'match');
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

                            let elemCell = gridRow.elem.find('.field-id-' + workspace.fieldIds.locViewer);
                                elemCell.children().first().val(instance.locViewer);
                                elemCell.addClass('changed');
                        
                            setRowMCADSyncStatus(workspace, gridRow, 'update');

                        }

                    }
                }

                if(instance.status === 'new') workspace.counters.new++;

            }

        }

        for(let item of workspace.items) {
            
            let gridGroups = getGridGroups(iWS);
            let elemGroup  = null;

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
                    let elemCell = $('<td></td>').prependTo(elemRow).addClass('mcad-sync-status-column');

                    console.log(item);

                    // let gridData = getGridRowDetails(elemRow, workspace.fieldIds);

                    elemRow.find('.field-id-' + workspace.fieldIds.source     ).children().first().val('M');
                    elemRow.find('.field-id-' + workspace.fieldIds.id         ).children().first().val(instance.instanceId);
                    elemRow.find('.field-id-' + workspace.fieldIds.partNumber ).children().first().val(item.partNumber);
                    elemRow.find('.field-id-' + workspace.fieldIds.title      ).children().first().val(item.details.TITLE);
                    elemRow.find('.field-id-' + workspace.fieldIds.rootMCAD   ).children().first().val(item.root);
                    elemRow.find('.field-id-' + workspace.fieldIds.locMCAD    ).children().first().val(instance.path);
                    elemRow.find('.field-id-' + workspace.fieldIds.locViewer  ).children().first().val(instance.instancePath);
                    elemRow.find('.field-id-' + workspace.fieldIds.boundingBox).children().first().val(JSON.stringify(instance.boundingBox));

                    let elemField = elemRow.find('.field-id-' + workspace.fieldIds.linkMCAD);

                    setFieldValue(elemField, item.link, item.title);

                    elemRow.find('input').click(function() {
                        selectGridItem($(this).closest('tr'));
                    });

                    elemRow.addClass('mcad-sync-result-new');

                    $('<div></div>').appendTo(elemCell)
                        .addClass('with-icon')
                        .addClass('icon-create')
                        .addClass('filled')
                        .html('New')
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
                let source = gridRow.elem.attr('data-source') || 'M';
                let isECAD = (source === 'E');
                if(isECAD) {
                    setRowMCADSyncStatus(workspace, gridRow, 'ecad');
                    workspace.counters.ecad++;
                } else {
                    setRowMCADSyncStatus(workspace, gridRow, 'mismatch');
                    workspace.counters.mismatch++;
                }
            }
        }

        $('#sync-matches' ).children().eq(iWS + 2).html(workspace.counters.match);
        $('#sync-update'  ).children().eq(iWS + 2).html(workspace.counters.update);
        $('#sync-new'     ).children().eq(iWS + 2).html(workspace.counters.new);
        $('#sync-mismatch').children().eq(iWS + 2).html(workspace.counters.mismatch);
        $('#sync-ecad'    ).children().eq(iWS + 2).html(workspace.counters.ecad);

        if(refresh) grids.push(iWS);

        iWS++;

    }

    return;

}
function insertGridSyncColumn(id) {


    let elemTHead = $('#' + id + '-thead');
    let elemTHRow = elemTHead.children().first();
    let elemTBody = $('#' + id + '-tbody');

    $('<th></th>').prependTo(elemTHRow)
        .html('Sync')
        .addClass('mcad-sync-status-column');

    elemTBody.children().each(function() {

        let elemRow = $(this);

        if(elemRow.hasClass('content-item')) {
            $('<td></td>').prependTo(elemRow).addClass('mcad-sync-status-column');
        } else {
            elemRow.attr('colspan', '200');
        }

    });

}
function removeGridSyncColumns() {

    $('.mcad-sync-status-column').remove();

}
function getGridGroups(index) {

    let elemTBody = $('#table-' + index + '-tbody');

    return elemTBody.children('.table-group');

}
function getGridRows(index) {

    let results   = [];
    let elemTBody = $('#table-' + index + '-tbody');
    let columns   = workspaces[index].fieldIds;

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
        locViewer : '',
        tag          : '',
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

                case columns.locViewer:
                    gridRow.locViewer = elemCell.children().first().val();
                    break;

                case columns.boundingBox:
                    gridRow.boundingBox = elemCell.children().first().val();
                    break;

                case columns.tag:
                    gridRow.tag = elemCell.children().first().val();
                    break;

            }

        }           
        
    });

    return gridRow;

}
function setRowMCADSyncStatus(workspace, gridRow, status) {

    let elemCell = gridRow.elem.find('.mcad-sync-status-column');
        elemCell.html('');

    let elemIcon = $('<div></div>').appendTo(elemCell).addClass('with-icon');

    switch(status) {

        case 'match':
            gridRow.elem.addClass('mcad-sync-result-match');
            elemIcon.addClass('icon-checkmark')
                .addClass('filled')
                .html('Match')
                .attr('title', 'This line is in sync with the BOM')
            break;

        case 'update':
            gridRow.elem.addClass('mcad-sync-result-update');
            elemIcon.addClass('icon-product-alert')
                .addClass('filled')
                .html('Update')
                .attr('title', 'This instance has been moved in the structure, but will be mapped based on matching bounding box');
            break;

        case 'ecad':
            gridRow.elem.addClass('mcad-sync-result-ecad');
            elemIcon.addClass('icon-cpu')
                .addClass('filled')
                .html('ECAD Item')
                .attr('title', 'This instance has been added from ECAD BOM');
            break;            

        case 'mismatch':
            gridRow.elem.addClass('mcad-sync-result-mismatch');
            elemIcon.addClass('icon-warning')
                .attr('title', 'Requires manual action as there is no match in BOM')
                .addClass('filled')
                // .html('Requires Action')
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
    $('.mcad-sync-result-match').addClass('hidden');
    $('.mcad-sync-result-update').addClass('hidden');
    $('.mapped').addClass('hidden');

    elemClicked.closest('table').addClass('mapping-start');

    let elemRow = elemClicked.closest('tr');
        elemRow.addClass('selected-for-mapping');

}
function stopInstanceMapping(elemClicked) {

    $('*').removeClass('mapping-start');

    $('*').removeClass('selected-for-mapping');
    $('.mcad-sync-result-match').removeClass('hidden');
    $('.mcad-sync-result-update').removeClass('hidden');
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

    fieldsEx.push(workspace.fieldIds.partNumber);
    fieldsEx.push(workspace.fieldIds.title);
    fieldsEx.push(workspace.fieldIds.revision);
    fieldsEx.push(workspace.fieldIds.path);
    fieldsEx.push(workspace.fieldIds.instanceId);
    fieldsEx.push(workspace.fieldIds.locViewer);
    fieldsEx.push(workspace.fieldIds.boundingBox);

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