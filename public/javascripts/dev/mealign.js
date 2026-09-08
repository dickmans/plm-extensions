let links                    = {};
let workspaces               = [];
let completionEvents         = { landing : false, viewer : false, mcad : false, ecad : false, grids : 0 };
let paramsDetails            = {};
let pendingGridSaveProcesses = 0;


// TODO : Cross Highlight
// TODO : Select in Viewer


$(document).ready(function() {

    setApplicationLabels();
    setUIEvents();
    insertMenu();

    workspaces = config.mappingTables.types;

    paramsDetails             = config.appAlignment.panels.itemDetails;
    paramsDetails.id          = 'details';
    paramsDetails.headerLabel = paramsDetails.headerLabel || 'descriptor';       

    let requests  = [ $.get('/services/chrome') ];
    let syncTHRow = $('#mcad-sync-throw');
    let index     = 0;

    for(let workspace of workspaces) {

        workspace.index = index;
        workspace.id    = 'table-' + index++;
        
        requests.push($.get('/plm/grid-columns', { wsId : workspace.workspaceId, useCache : true }));

        $('<th></th>').appendTo(syncTHRow)
            .addClass('sync-column')
            .css('background', colors.list[workspace.colorIndex])
            .css('width', 520 / workspaces.length)
            .html(workspace.label);  

        $('<td></td>').addClass('sync-column').appendTo($('#mcad-sync-matches'));
        $('<td></td>').addClass('sync-column').appendTo($('#mcad-sync-update'));
        $('<td></td>').addClass('sync-column').appendTo($('#mcad-sync-new'));
        $('<td></td>').addClass('sync-column').appendTo($('#mcad-sync-mismatch'));

    }    

    getFeatureSettings('mebom', requests, function(responses) {

        dataContextMenu = responses[0];

        for(let index = 1; index < responses.length; index++) {
            workspaces[index - 1].columns = responses[index].data.fields;
        }
               
        if(urlParameters.link === '') setLandingPage();
        else openItem(urlParameters.link);

    });

});


// Set UI controls
function setApplicationLabels() {

    $('#header-title').html(config.appAlignment.labels.appTitle || 'M/E Alignment');
    $('#mcad-sync-title'  ).html(config.appAlignment.labels.syncMCAD || 'Synchronize Mechancial BOM');

}
function setUIEvents() {

    // Header Toolbar Buttons
    $('#home').click(function(e) {
        updateURLLink();
        setLandingPage();
        removeContextMenuEntries();
        $('body').removeClass('screen-main').addClass('screen-landing');
        $('#header-subtitle').html('').addClass('hidden');
    });
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
    $('body').click(function(e) {
        // TODO : Deselect grid row item
        let elemGrid = $(e.target).closest('table.grid');
        if(elemGrid.length === 0) {
            // viewerResetSelection();
            // applyViewerColors();
            // insertDetails(links.ebom, paramsDetails);
            // $('*').removeClass('highlighted');
            // $('#mcad').find('.selected').removeClass('selected');
            // gridResetSelection('ecad');
        }
    });

    // Sync Dialog
    $('.sync-close').click(function() {
        $('#overlay').hide();
        $('#mcad-sync').hide();
    });
    $('#mcad-sync-save').click(function() {
        $('#mcad-sync').hide();
        pendingGridSaveProcesses = workspaces.length;
        for(let workspace of workspaces) saveGridData(workspace.id);
    });

}
function disableControlsAtStartup() {

    $('#filter'        ).addClass('disabled');
    $('#excel-export'  ).addClass('disabled');
    $('#mcad-mcad-sync').addClass('disabled');

}
function enableControlsUponCompletion() {

    if(!completionEvents.ecad  ) return;
    
    if(completionEvents.grids !== workspaces.length) return;

    
    if(!completionEvents.viewer) return;
    if(!completionEvents.mcad  ) return;

    $('#filter'        ).removeClass('disabled');
    $('#excel-export'  ).removeClass('disabled');
    $('#mcad-mcad-sync').removeClass('disabled');

    matchMCADViewerInstances();
    updateAlignmentsSyncColumn();
    updateECADSyncColumn();

}



// Landing Page
function setLandingPage() {

    if(completionEvents.landing) return;

    let paramsLandingViews                = config.appAlignment.panels.landingViews;
        paramsLandingViews.id             = 'views';
        paramsLandingViews.onDblClickItem = function(elemClicked) { openItem(elemClicked.attr('data-link')); }
    
    let paramsLandingSearch                = config.appAlignment.panels.landingSearch;
        paramsLandingSearch.id             = 'search';
        paramsLandingSearch.onDblClickItem = function(elemClicked) { openItem(elemClicked.attr('data-link')); }     

    let wsIdContext = config.wsContext.workspaceId || common.workspaceIds.equipments;

    insertWorkspaceViews (wsIdContext, paramsLandingViews );
    insertWorkspaceSearch(wsIdContext, paramsLandingSearch);

    completionEvents.landing = true;

}



// Start Editor
function openItem(link) {

    insertContextMenuEntries(link);
    disableControlsAtStartup();
    appendOverlay(false);
    updateURLLink(link);

    links.context = link;

    completionEvents.mcad   = false;
    completionEvents.ecad   = false;
    completionEvents.viewer = false;
    completionEvents.grids  = 0;

    let requests = [ $.get('/plm/details', { link : link }) ];

    let paramsMCAD = config.appAlignment.panels.bomMCAD;
        paramsMCAD.id              = 'mcad';
        paramsMCAD.headerLabel     = paramsMCAD.headerLabel || 'Mechanical BOM';
        paramsMCAD.singleToolbar   = 'actions';
        paramsMCAD.viewerSelection = true;
        paramsMCAD.onClickItem     = function(elemClicked) { onClickMCADItem(elemClicked); }
        paramsMCAD.afterCompletion = function(id, data)    { afterMCADCompletion(id, data) };
        
    paramsMCAD.hideItems = [
        { fieldId : 'IGNORE_IN_MBOM', value : 'true' }
    ]
    paramsMCAD.hideChildren = [
        { fieldId : 'END_ITEM', value : 'true', className : 'hidden-children' }
    ]


    let paramsECAD = config.appAlignment.panels.bomECAD;

        paramsECAD.id              = 'ecad';
        paramsECAD.headerLabel     = paramsECAD.headerLabel || 'Electrical BOM';
        paramsECAD.singleToolbar   = 'actions';
        paramsECAD.dragable        = true;
        paramsECAD.afterCompletion = function(id, data) { afterECADCompletion(id, data) };

    Promise.all(requests).then(function(responses) {

        printResponsesErrorMessagesToConsole(responses);

        urlParameters.title = responses[0].data.title;

        $('body').addClass('screen-main').removeClass('screen-landing');
        $('#header-subtitle').html(urlParameters.title).removeClass('hidden');
        $('#overlay').hide();

        links.mcad = getSectionFieldValue(responses[0].data.sections, config.wsContext.fieldIds.mcad , '', 'link');
        links.ecad = getSectionFieldValue(responses[0].data.sections, config.wsContext.fieldIds.ecad , '', 'link');

        for(let workspace of workspaces) workspace.link = getSectionFieldValue(responses[0].data.sections, workspace.fieldId, '', 'link');

        if(isBlank(links.mcad)) {

            showStartupError({
                title        : 'Missing Data',
                details      : 'This editor requires an Mechanical BOM with viewable file, but such data could not be found in context of<br><strong>' + responses[0].data.title + '</strong>',
                instructions : 'Select an Mechanical BOM in field <strong>' + config.wsContext.fieldIds.mcad + '</strong> or update your server configuration to use another field referencing the right Mechancial BOM'
            });

        } else {

            insertBOM(links.mcad, paramsMCAD);

            insertViewer(links.mcad, { 
                cacheInstances     : true,
                cacheBoundingBoxes : true,
                features           : config.appAlignment.viewerFeatures,
                afterCompletion    : function(id) { afterViewerCompletion(id); }
            });

            insertAlignmentTabs();
            insertAlignmentGrids();
            insertGrid(links.ecad, paramsECAD);
            insertDetails(links.context, paramsDetails);

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



// MCAD Tree
function afterMCADCompletion(id, data) {  

    $('#overlay').hide();

    let elemControls = $('<div></div>').appendTo($('#mcad-header')).addClass('panel-controls'); 

    $('<div></div>').appendTo(elemControls)
        .attr('id', 'mcad-mcad-sync')
        .addClass('button')
        .addClass('append-chevron')
        .addClass('default')
        .addClass('disabled')
        .html(config.appAlignment.labels.btnSyncMCAD || 'Sync')
        .click(function() {
            syncMCADItemsListWithAligment();
        });

    let elemAfter = $('#mcad-search');

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

    getMCADItemsForAlignment(data.bomPartsList);
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
function addMCADTreeIconColumn(id) {

    let elemTHRow = $('#' + id + '-thead-row');
    let elemTBody = $('#' + id + '-tbody');

    $('<th></th>').appendTo(elemTHRow)
        .addClass('column-icon')
        .addClass('tree-column-icon');

    elemTBody.children().each(function() {

        let elemRow  = $(this);
        let elemIcon = $('<td></td>').appendTo($(this)).addClass('column-icon').addClass('tree-column-icon');
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
function onClickMCADItem(elemClicked) {

    let selected = $('#mcad-tbody').find('tr.selected').length;

    $('#grids').find('.highlighted').removeClass('highlighted');
    $('#grids').find('.selected'   ).removeClass('selected'   );

    if(selected === 0) {

        $('#grids').find('tr.content-item').removeClass('hidden');
        $('#grids').find('tr.table-group').removeClass('hidden');

        viewerResetSelection();
        applyViewerColors();
        insertDetails(links.ebom, paramsDetails);
        gridResetSelection('ecad');

    } else {

        let treeItemPath = getTreeItemPath(elemClicked).string;
        let partNumber   = elemClicked.attr('data-part-number');
        let index        = 0;

        $('.table-group').removeClass('keep');

        for(let workspace of workspaces) {

            let elemGrid = $('#table-' + index++ + '-tbody');

            elemGrid.find('tr.content-item').each(function() {

                let elemRow   = $(this);
                let gridRow   = getGridRowDetails(elemRow, config.mappingTables.fieldIds);
                let elemGroup = elemRow.prevAll('.table-group').first();

                if(gridRow.locMCAD.indexOf(treeItemPath) < 0) {
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

        // viewerSelectModel(partNumber);
        insertDetails(elemClicked.attr('data-link'), paramsDetails);

        // gridSelectRows('ecad', [
        //     { attribute : 'data-part-number', value : elemClicked.attr('data-part-number') }
        // ]);

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



// Alignment Tables
function insertAlignmentTabs() {

    let index = 0;

    $('#tabs').html('');

    for(let workspace of workspaces) {

        let elemTab = $('<div></div>').appendTo($('#tabs'))
            .attr('data-index', index)
            .attr('data-tab-group', 'types')
            .html(workspace.label)
            .click(function() {
                clickTab($(this));
                // let index = $(this).index() + 0;
                // $('#grids').children().addClass('hidden');
                // $('#table-' + index).removeClass('hidden');
                // $('*').removeClass('selected-for-mapping');
                // $('*').removeClass('mapping-start');
                // $('.mcad-sync-result-match').removeClass('hidden');
                // $('.mcad-sync-result-update').removeClass('hidden');
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
            .addClass('types')
            .addClass('hidden')
            .addClass('row-hovering')
            .attr('id', workspace.id)
            .attr('data-index', index++);

    }

    $('#tabs').children().first().click();

}
function insertAlignmentGrids() {

    let paramsGrid       = config.appAlignment.panels.alignmentGrids;
    let defaultSortOrder = [ { sortBy : config.mappingTables.fieldIds.id, sortType : 'integer', sortDirection : 'ascending' } ];
    let defaultFieldsIn  = [
        config.mappingTables.fieldIds.id,
        config.mappingTables.fieldIds.tag,
        config.mappingTables.fieldIds.partNumber,
        config.mappingTables.fieldIds.title,
        config.mappingTables.fieldIds.linkECAD,
        config.mappingTables.fieldIds.manufacturer,
        config.mappingTables.fieldIds.mpn,
    ];

    for(let workspace of workspaces) {

        if(!isBlank(workspace.link)) {

            $('#' + workspace.id).addClass('no-mcad-sync');

            paramsGrid.id              = workspace.id;
            paramsGrid.singleToolbar   = 'actions',
            paramsGrid.sortOrder       = workspace.sortOrder || [];
            paramsGrid.fieldsEx        = workspace.fieldsEx  || [];
            paramsGrid.sortOrder       = workspace.sortOrder || defaultSortOrder;
            paramsGrid.groupBy         = workspace.groupBy   || config.mappingTables.fieldIds.partNumber;
            paramsGrid.fieldsIn        = defaultFieldsIn;
            paramsGrid.onClickItem     = function(elemClicked) { selectGridItem(elemClicked); };
            paramsGrid.afterCompletion = function(id) { afterGridCompletion(id); };
            paramsGrid.afterSave       = function(id) { afterGridSave(id);       };

            paramsGrid.attributes = [
                { name : 'data-part-number', fieldId : config.mappingTables.fieldIds.partNumber },
                { name : 'data-loc-mcad',    fieldId : config.mappingTables.fieldIds.locMCAD    }
            ];

            for(let fieldId of workspace.fieldsIn) {
                if(!paramsGrid.fieldsIn.includes(fieldId)) paramsGrid.fieldsIn.push(fieldId);
            }
            
            insertGrid(workspace.link, paramsGrid);

        }

    }

}
function afterGridCompletion(id) {


    let elemTable   = $('#' + id);
    let elemActions = $('#' + id + '-actions');
    let elemToggle  = $('#' + id + '-toggle-isolate');
    let elemTHead   = $('#' + id + '-thead');
    let elemTBody   = $('#' + id + '-tbody');
    let elemTHRow   = elemTHead.children().first();


    //     insertBOMMatchesIcons(elemRow);



    completionEvents.grids++;

    enableControlsUponCompletion();

}
function insertBOMMatchesIcons(elemRow) {

    // TODO : Implement ECAD match icons

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
    let rowData       = getGridRowDetails(elemClicked, config.mappingTables.fieldIds);
    let id            = elemPanel.attr('id');

    $('.content-item.selected').removeClass('selected');

    elemClicked.addClass('selected');

    // togglePanelToolbarActions(id);

    if(isHighlighted) return;

    $('.highlighted').removeClass('highlighted');

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
function afterGridSave(id) {

    $('#' + id).addClass('no-mcad-sync');
    removeGridSyncColumns();

    if(--pendingGridSaveProcesses > 0) $('#overlay').show();

}
function updateAlignmentsSyncColumn() {

    for(let workspace of workspaces) {

        let elemTHSync = $('#' + workspace.id + '-thead .ecad-sync-status-column');
        let elemTBody  = $('#' + workspace.id + '-tbody');

        if(elemTHSync.length === 0)  {
            let elemTHRef =  $('#' + workspace.id + '-thead .field-id-' +  config.mappingTables.fieldIds.title);
            $('<th></th>').insertAfter(elemTHRef).addClass('ecad-sync-status-column').html('ECAD');     
        }

        elemTBody.children().each(function() {

            let elemRow = $(this);

            if(elemRow.hasClass('content-item')) {
                
                let elemCellSync = insertGridSyncCell(elemRow, config.mappingTables.fieldIds.title, 'ecad-sync-status-column');
                
                setAlignmentRowECADSyncStatus(elemRow, elemCellSync);


            } else {

                elemRow.attr('colspan', '200');

            }

        });

    }

}



// ECAD BOM List
function afterECADCompletion(id, data) {

    let elemControls = $('#ecad-controls');
    
    if(elemControls.length === 0) {

        elemControls = $('<div></div>').appendTo($('#ecad-header'))
            .addClass('panel-controls')
            .attr('id', 'ecad-controls');

        $('<div></div>').appendTo(elemControls)
            .attr('id', 'ecad-sync')
            .addClass('button')
            .addClass('with-icon')
            .addClass('icon-link-update')
            .addClass('default')
            .html(config.appAlignment.labels.btnSyncECAD || 'Sync')
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

    }

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

    $('<th></th>').prependTo(elemTHRow).addClass('ecad-sync-status-column');    

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
    
        let elemRow   = $(this);
        let elemCell  = $(this).children('.ecad-sync-status-column').first();
        let ecadItem  = getRowData(elemRow, config.ecadBOM.fieldIds);
        let status    = 'missing';
        let workspace = getMatchingWorkspace(ecadItem.class.display);

        if(workspace === null) status = 'e-only';
        else {

            const elemTable = $('#' + workspace.id + '-tbody');

            elemTable.children('.content-item').each(function() {

                let elemRow  = $(this);
                let gridItem = getRowData(elemRow, config.mappingTables.fieldIds);

                if(ecadItem.tag.value === gridItem.tag.value) {

                    status = 'matching-tag';

                    if(ecadItem.location.value === gridItem.locECAD.value) {

                        status = 'matching-location'

                        if(ecadItem.manufacturer.value === gridItem.manufacturer.value) {
                            if(ecadItem.mpn.value === gridItem.mpn.value) {
                                status = 'exact-match';
                            }
                        }

                    }

                }

            });

        }
        
        let elemIcon = $('<div></div>').addClass('icon');

        elemRow.removeClass('status-missing').removeClass('status-mapped').removeClass('status-match');

        switch(status) {

            case 'e-only':
                elemRow.addClass('status-e-only');
                elemIcon.addClass('icon-cable')
                    .attr('title', config.appAlignment.labels.tooltipECADOnly);
                break;

            case 'missing':
                elemRow.addClass('status-missing');
                elemIcon.addClass('icon-important')
                    .addClass('filled')
                    .attr('title', config.appAlignment.labels.tooltipMissing);
                break;

            case 'matching-tag':
                elemRow.addClass('status-mapped');
                elemIcon.addClass('icon-tag')
                    .addClass('filled')
                    .attr('title', config.appAlignment.labels.tooltipMatchingTag);
                break;

            case 'matching-location':
                elemRow.addClass('status-mapped');
                elemIcon.addClass('icon-delete-column')
                    .attr('title', config.appAlignment.labels.tooltipMatchDiff);
                break;

            case 'exact-match':
                elemRow.addClass('status-match');
                elemIcon.addClass('icon-released')
                    .addClass('filled')
                    .attr('title', config.appAlignment.labels.tooltipMatch);
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
        result[key]  = getFieldValue(elemCell);

    }

    result.link = elemRow.attr('data-link');

    return result;

}
function getMatchingWorkspace(className) {

    if(typeof className === 'undefined') return null;

    for(let workspace of workspaces) {
        if(workspace.label.toLowerCase() == className.toLowerCase()) return workspace
    }

    return null;

}
function syncECADItemsListWithAligment() {

    $('#overlay').show();

    let requests       = [];
    let elemTBody      = $('#ecad-tbody');
    let fieldIdMapping = config.ecadBOM.fieldIds.linkMapping;

    elemTBody.children('.content-item').each(function() {
     
        let ecadRow   = $(this);
        let ecadItem  = getRowData(ecadRow, config.ecadBOM.fieldIds);
        let workspace = getMatchingWorkspace(ecadItem.class.display);

        console.log(ecadItem);

        if(workspace !== null) {

            $('#' + workspace.id + '-tbody .content-item').each(function() {

                let gridRow     = $(this);
                let gridItem    = getRowData(gridRow, config.mappingTables.fieldIds);
                let linkMapping = gridRow.attr('data-link');

                console.log(gridItem);

                if(ecadItem.tag.value === gridItem.tag.value) {

                    updateMappingRowFromECADItem(gridRow, ecadItem);

                    let elemFieldMapping = ecadRow.find('.field-id-' + fieldIdMapping);
                        elemFieldMapping.attr('data-value', linkMapping);

                    let params = {
                        link  : links.ecad,           
                        rowId : ecadRow.attr('data-link').split('/').pop(),    
                        data  : [
                            { fieldId : config.ecadBOM.fieldIds.location     , type : 'string'        , value : ecadItem.location.value },
                            { fieldId : config.ecadBOM.fieldIds.tag          , type : 'string'        , value : ecadItem.tag.value },
                            { fieldId : config.ecadBOM.fieldIds.item         , type : 'single-select' , value : ecadItem.item.lookup },
                            { fieldId : config.ecadBOM.fieldIds.number       , type : 'string'        , value : ecadItem.number.value },
                            { fieldId : config.ecadBOM.fieldIds.title        , type : 'string'        , value : ecadItem.title.value },
                            { fieldId : config.ecadBOM.fieldIds.manufacturer , type : 'single-select' , value : ecadItem.manufacturer.lookup },
                            { fieldId : config.ecadBOM.fieldIds.mpn          , type : 'string'        , value : ecadItem.mpn.mpn },
                            { fieldId : config.ecadBOM.fieldIds.class        , type : 'single-select' , value : ecadItem.class.lookup },
                            { fieldId : config.ecadBOM.fieldIds.partNumber   , type : 'string'        , value : ecadItem.partNumber.value },
                            { fieldId : config.ecadBOM.fieldIds.linkMapping  , type : 'string'        , value : linkMapping },
                        ]
                    }

                    console.log(params);

                    requests.push($.post('/plm/update-grid-row', params));


                    // updateECADItemFromMappingRow(gridRow, ecadRow);
                }

            });
        }

    });

    Promise.all(requests).then(function(responses) {
        $('#overlay').hide();
        updateECADSyncColumn();
    })

}
function updateMappingRowFromECADItem(elemRow, ecadItem) {

    elemRow.addClass('changed');

    console.log()

    updateGridRowCellFromECADItem(elemRow, config.mappingTables.fieldIds.linkECAD    , ecadItem.item        );
    updateGridRowCellFromECADItem(elemRow, config.mappingTables.fieldIds.locECAD     , ecadItem.location    );
    updateGridRowCellFromECADItem(elemRow, config.mappingTables.fieldIds.manufacturer, ecadItem.manufacturer);
    updateGridRowCellFromECADItem(elemRow, config.mappingTables.fieldIds.mpn         , ecadItem.mpn         );
    updateGridRowCellFromECADItem(elemRow, config.mappingTables.fieldIds.linkECADBOM , ecadItem.link        );

}
function updateGridRowCellFromECADItem(elemRow, fieldId, ecadItemData) {

    console.log(fieldId);
    console.log(ecadItemData);

    let elemField =  elemRow.find('.field-id-' + fieldId);

    if(elemField.length === 0) return;

    setFieldValue(elemField, ecadItemData);

}



// Highlight matching instance upon selection in Inventor
// selectInstance('002771.iam|Build Assembly:1|94500A231:2')
// selectInstance('01-0289.iam|01-0745:1|01-0743:1')
function selectInstance(locViewer) {

    console.log('selectInstance START')

    if(isBlank(locViewer)) return;

    for(let workspace of workspaces) {

        let fieldId = config.mappingTables.fieldIds.locViewer;

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
// function onViewerSelectionChangedDone(viewerInstance, partNumbers, event) {

//     if(partNumbers.length === 0) return;

//     let partNumber = partNumbers.pop();
//     let instanceId = event.dbIdArray[0];

//     treeDisplayItemByPropertyValue('bom', 'data-part-number', partNumber);

//     $('#grids').find('tr.content-item').removeClass('selected').removeClass('highlighted');

//     for(let index = 0; index < workspaces.length; index++) {

//         let gridRows = getGridRows(index);

//         for(let gridRow of gridRows) {

//             if(gridRow.instanceId == instanceId) {                    
//                 gridRow.elem.addClass('highlighted');
//                 $('#grids').children().addClass('hidden');
//                 $('#table-' + index).removeClass('hidden');
//                 index =  workspaces.length + 1;
//             } else if(gridRow.partNumber === partNumber) {
//                 gridRow.elem.addClass('selected');

//             }
//         }
//     }

// }
// function selectContentRow(elemRow) {

//     console.log('selectContentRow');

//     let partNumber = elemRow.attr('data-part-number');
//     let dbId       = elemRow.attr('data-viewer-dbid');
    
//     $('#grids').find('tr.selected'   ).removeClass('selected'   );
//     $('#grids').find('tr.highlighted').removeClass('highlighted');
    
//     $('#grids').find('tr').each(function() {
//         let pn = $(this).attr('data-part-number');
//         if(pn === partNumber) $(this).addClass('selected');
//     });

//     elemRow.removeClass('selected').addClass('highlighted');

//     bomDisplayItemByPartNumber(partNumber);

//     viewerHighlightInstances(partNumber, [dbId], {
//         ghosting : true
//     });

// }


// Sync from MCAD Tree
function syncMCADItemsListWithAligment() {

    // Match is based on 
    // - Part Number
    // - Viewer Location

    if($('#mcad-mcad-sync').hasClass('disabled')) return;

    $('#overlay').show();
    $('#mcad-sync').show();
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
            mismatch : 0
            // ecad     : 0
        }

        // console.log(workspace);
        // console.log(gridRows);
        // console.log(workspace.items);

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
                                setAlignmentRowMCADSyncStatus(workspace, gridRow, 'match');
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

                            let elemCell = gridRow.elem.find('.field-id-' + config.mappingTables.fieldIds.locViewer);
                                elemCell.children().first().val(instance.locViewer);
                                elemCell.addClass('changed');
                        
                            setAlignmentRowMCADSyncStatus(workspace, gridRow, 'update');

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
                    let elemCell = insertGridSyncCell(elemRow);


                    // let gridData = getGridRowDetails(elemRow, config.mappingTables.fieldIds);

                    // elemRow.find('.field-id-' + config.mappingTables.fieldIds.source     ).children().first().val('M');
                    elemRow.find('.field-id-' + config.mappingTables.fieldIds.id         ).children().first().val(instance.instanceId);
                    elemRow.find('.field-id-' + config.mappingTables.fieldIds.partNumber ).children().first().val(item.partNumber);
                    elemRow.find('.field-id-' + config.mappingTables.fieldIds.title      ).children().first().val(item.details.TITLE);
                    elemRow.find('.field-id-' + config.mappingTables.fieldIds.rootMCAD   ).children().first().val(item.root);
                    elemRow.find('.field-id-' + config.mappingTables.fieldIds.locMCAD    ).children().first().val(instance.path);
                    elemRow.find('.field-id-' + config.mappingTables.fieldIds.locViewer  ).children().first().val(instance.instancePath);
                    elemRow.find('.field-id-' + config.mappingTables.fieldIds.boundingBox).children().first().val(JSON.stringify(instance.boundingBox));

                    let elemField = elemRow.find('.field-id-' + config.mappingTables.fieldIds.linkMCAD);

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
                // let source = gridRow.elem.attr('data-source') || 'M';
                // let isECAD = (source === 'E');
                // if(isECAD) {    
                    // // setRowMCADSyncStatus(workspace, gridRow, 'ecad');
                    // workspace.counters.ecad++;
                // } else {
                    setAlignmentRowMCADSyncStatus(workspace, gridRow, 'mismatch');
                    workspace.counters.mismatch++;
                // }
            }
        }

        $('#mcad-sync-matches' ).children().eq(iWS + 2).html(workspace.counters.match);
        $('#mcad-sync-update'  ).children().eq(iWS + 2).html(workspace.counters.update);
        $('#mcad-sync-new'     ).children().eq(iWS + 2).html(workspace.counters.new);
        $('#mcad-sync-mismatch').children().eq(iWS + 2).html(workspace.counters.mismatch);
        // $('#mcad-sync-ecad'    ).children().eq(iWS + 2).html(workspace.counters.ecad);

        if(refresh) grids.push(iWS);

        iWS++;

    }

    return;

}
function insertGridSyncColumn(id) {

    let classNameID = 'field-id-' + config.mappingTables.fieldIds.id;

    let elemTHRef = $('#' + id + '-thead .' + classNameID);
    // let elemTHRow = elemTHead.children().first();
    let elemTBody = $('#' + id + '-tbody');


    $('<th></th>').insertAfter(elemTHRef)
        .addClass('mcad-sync-status-column')
        .html('Sync Result');

    elemTBody.children().each(function() {

        let elemRow = $(this);

        if(elemRow.hasClass('content-item')) {
            insertGridSyncCell(elemRow, config.mappingTables.fieldIds.id, 'mcad-sync-status-column');
        } else {
            elemRow.attr('colspan', '200');
        }

    });

}
function insertGridSyncCell(elemRow, fieldIdRef, className) {

    let elemCell  = elemRow.children('.' + className).first();
    

    if(elemCell.length === 0) {
        
        let selectRef   = '.field-id-' + fieldIdRef;
        let elemCellRef = elemRow.children(selectRef).first();
        
        elemCell = $('<td></td>').insertAfter(elemCellRef).addClass(className);

    }

    return elemCell;

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
    let columns   = config.mappingTables.fieldIds;

    elemTBody.children('.content-item').each(function() {

        let gridRow = getGridRowDetails($(this), columns);
        gridRow.elem = $(this);
        results.push(gridRow);

    });

    return results;

}
function getGridRowDetails(elemRow, columns) {

    let gridRow  =  {
        tag        : '',
        partNumber : '',
        locMCAD    : '',
        locViewer  : '',
        status     : 'mismatch'
    }

    elemRow.children().each(function() {

        let elemCell = $(this);
        let fieldId  = elemCell.attr('data-id');

        gridRow.partNumber = elemRow.attr('data-part-number');
        gridRow.locMCAD    = elemRow.attr('data-loc-mcad');

        if(!isBlank(fieldId)) {

            switch(fieldId) {

                case columns.tag:
                    gridRow.tag = elemCell.children().first().val();
                    break;                

                case columns.locViewer:
                    gridRow.locViewer = elemCell.children().first().val();
                    break;

                case columns.boundingBox:
                    gridRow.boundingBox = elemCell.children().first().val();
                    break;

            }

        }           
        
    });

    return gridRow;

}
function setAlignmentRowMCADSyncStatus(workspace, gridRow, status) {

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
function setAlignmentRowECADSyncStatus(elemRow, elemCellSync) {

    elemCellSync.html('');

    let status   = 'missing';
    let elemIcon = $('<div></div>').appendTo(elemCellSync).addClass('icon');

    switch(status) {

        case 'missing':
            elemRow.addClass('ecad-sync-result-missing');
            elemIcon.addClass('icon-warning')
                .addClass('filled')
                .attr('title', config.appAlignment.labels.tooltipAlignMissing);
            break;

        case 'different':
            elemRow.addClass('ecad-sync-result-different');
            elemIcon.addClass('icon-join')
                .addClass('filled')
                .attr('title', config.appAlignment.labels.tooltipAlignDiffer);
            break;

        case 'match':
            elemRow.addClass('ecad-sync-result-match');
            elemIcon.addClass('icon-check')
                .addClass('filled')
                .attr('title', config.appAlignment.labels.tooltipAlignCheck);
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

    fieldsEx.push(config.mappingTables.fieldIds.partNumber);
    fieldsEx.push(config.mappingTables.fieldIds.title);
    fieldsEx.push(config.mappingTables.fieldIds.revision);
    fieldsEx.push(config.mappingTables.fieldIds.path);
    fieldsEx.push(config.mappingTables.fieldIds.instanceId);
    fieldsEx.push(config.mappingTables.fieldIds.locViewer);
    fieldsEx.push(config.mappingTables.fieldIds.boundingBox);

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