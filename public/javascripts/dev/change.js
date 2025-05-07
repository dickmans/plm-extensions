let maxRequests         = 5;
let urns                = { 'partNumber' : '' }
let now                 = new Date();
let bomItems            = [];
let editableFields      = [];
let indexSelected       = -1;
let multiSelect         = { 'wsId' : '', 'links' : [], 'common': [], 'varies' : [], 'partNumbers': [] };
let wsChangeOrders      = { 'id' : 84, 'sections' : [], 'fields' : [], 'viewId' : '' };
let wsProblemReports    = { 'id' : ''  , 'sections' : [], 'fields' : [] };
let wsSupplierPackages  = { 'id' : ''  , 'sections' : [], 'fields' : [] };

let paramsAttachments = { 
    'size'          : 's', 
    'upload'        : true, 
    'extensionsEx'  : '.dwf,.dwfx' 
}
let paramsProcesses = { 
    'headerLabel'    : 'Change Processes', 
    'createWSID'     : '' ,
    'fieldIdMarkup'  : ''
}
let context = {}
 

$(document).ready(function() {
    
    wsProblemReports.id             = config.explorer.wsIdProblemReports;
    wsSupplierPackages.id           = config.explorer.wsIdSupplierPackages;
    paramsProcesses.createWSID      = config.explorer.wsIdProblemReports;
    paramsProcesses.fieldIdMarkup   = config.explorer.fieldIdPRImage;
    applicationFeatures.viewer      = config.explorer.viewerFeatures;

    // let link = '/api/v3/workspaces/' + wsId + '/items/' + dmsId;
    
    // appendProcessing('dashboard', false);
    // appendProcessing('bom', false);
    // appendProcessing('details', false);
    // appendViewerProcessing();
    // appendOverlay(false);
    
    paramsProcesses.createContext  = {
        'fieldId' : config.explorer.fieldIdPRContext
    }

    // if(isBlank(wsChangeOrders.id)) wsChangeOrders.id = config.explorer.wsIdChangeOrd;

    insertRecentItems({
        headerLabel  : 'Recent Processes',
        size         : 'm',
        workspacesIn : [wsChangeOrders.id]
    });
    // insertSearch({
    //     size         : 'xxs',
    //     images       : true,
    //     limit        : 20,
    //     workspace    : wsChangeOrders.id,
    //     tileCounter  : true,
    //     autoClick    : true
    // });
    insertWorkspaceViews(wsChangeOrders.id, {
        id          : 'workspace',
        headerLabel : 'Change Orders Workspace',
        includeMOW  : true
    });
    // insertBookmarks({
    //     headerLabel  : 'Bookmarks',
    //     images       : true,
    //     workspacesIn : [wsChangeOrders.id]
    // });

    // getInitialData(function() {

    //     $('#overlay').hide();
    //     $('body').removeClass('screen-startup');

    //     if(!isBlank(dmsId)) {
    //         openItem(link);
    //     } else {
    //         $('body').addClass('screen-landing');
    //     }
    // });

    setUIEvents();

});

function setUIEvents() {

    // Header Toolbar
    $('#button-process-close').click(function() {
        $('body').toggleClass('screen-landing').toggleClass('screen-main');
    });
    $('#button-toggle-recents').click(function() {
        $('body').toggleClass('no-recents');
    });

    $('#button-home').click(function() {
        $('body').addClass('screen-landing').removeClass('screen-main');
        document.title = documentTitle;
        window.history.replaceState(null, null, '/explorer?theme=' + theme);
    });
    $('#button-toggle-dashboard').click(function() {
        $('body').toggleClass('no-dashboard');
        viewerResize();
    });
    $('#button-toggle-bom').click(function() {
        if($('body').hasClass('no-bom-tree')) {
            $('body').removeClass('no-bom-tree');
            $('body').addClass('no-bom');
        } else if($('body').hasClass('no-bom')) {
            $('body').removeClass('no-bom');
        } else {
            $('body').addClass('no-bom-tree');
        }
        viewerResize();
    });
    $('#button-toggle-attachments').click(function() {
        $('body').toggleClass('no-attachments');
        viewerResize();
    });
    $('#button-toggle-details').click(function() {
        $('body').toggleClass('with-details');
        if($('body').hasClass('with-details')) {
            $('body').addClass('with-panel');
            $('body').removeClass('with-processes');
        } else {
            $('body').removeClass('with-panel');
        }
        viewerResize();
    });
    $('#button-toggle-processes').click(function() {
        $('body').toggleClass('with-processes');
        if($('body').hasClass('with-processes')) {
            $('body').addClass('with-panel');
            $('body').removeClass('with-details');
        } else {
            $('body').removeClass('with-panel');
        }
        viewerResize();
    });

  
    // Dashboard
    $('#collapse-all-kpis').click(function() {
        $('.kpi').each(function() {
            if(!$(this).hasClass('collapsed')) $(this).click();
        });
    });
    $('#expand-all-kpis').click(function() {
        $('.kpi').each(function() {
            if($(this).hasClass('collapsed')) $(this).click();
        });
    });
    $('#dashboard-reset').click(function() {
        $('.kpi-value.selected').removeClass('selected');
        applyFilters();
    });
    $('#dashboard-refresh').click(function() {
        refreshKPIs();
    });


    // BOM Actions
    $('#save-bom-changes').click(function() {
        saveBOMChanges();
    });
    $('#send-selected').click(function() {
        showCreateDialog();
    });
    $('#go-there').click(function() {
        let link = $('tr.selected').attr('data-link').split('/');
        let url = document.location.href.split('?')[0];
            url += '?';
            url += 'wsId=' + link[4];
            url += '&dmsId=' + link[6];
        document.location.href = url;
    });
    $('#bom-reset').click(function() {
        $('tr.selected').click();
        viewerResetSelection(true);
    });
    $('#bom-search-input').keyup(function() {
        filterBOMTree();
    });


    // Item Details Actions
    $('#save').click(function() {
        saveChanges();
    });


    // Process Creation
    $('#create-process').click(function() {
        
        let elemParent = $('#processes-sections');
            elemParent.html('');
            elemParent.show();

        $(this).siblings().show();
        $(this).hide();

        $('#processes-list').hide();

        insertItemDetailsFields('', 'processes', wsProblemReports.sections, wsProblemReports.fields, null, true, true, true);

    });
    $('#cancel-process').click(function() {

        $('.process-dialog').hide();
        $('#create-process').show();
        $('#processes-list').show();
        $('#processes-sections').hide();

    });
    $('#save-process').click(function() {

        $('#processes-processing').show();
        $('#processes-processing').siblings('.panel-content').hide();

        if(!validateForm($('#processes-sections'))) {
            showErrorMessage('Cannot Save', 'Field validations faild');
            return;
        }

        viewerCaptureScreenshot(null, function() {

            $('#processes-sections').hide();
            $('#processes-list').html('');
            $('#processes-list').show('');
            $('#processes-sections');
    
            let link = $('#processes').attr('data-link');
    
            submitCreateForm(wsProblemReports.id, $('#processes-sections'), 'viewer-markup-image', {}, function(response ) {

                let newLink = response.data.split('.autodeskplm360.net')[1];

                $.get('/plm/add-managed-items', { 'link' : newLink, 'items' : [ link ] }, function(response) {

                    insertChangeProcesses(link, paramsProcesses);
                    $('.process-dialog').hide();
                    $('#create-process').show();
                    $('#processes-list').show();
                });

            });

        });

    });


    // Create Connect Dialog
    $('#create-connect-cancel').click(function() {
        $('#overlay').hide();
        $('#create-connect').hide();
    });
    $('#create-connect-confirm').click(function() {
        
        if(!validateForm($('#create-connect-sections'))) return;

        $('#create-connect').hide();

        submitCreateForm(wsSupplierPackages.id, $('#create-connect-sections'), null, {}, function(response ) {
            $('#overlay').hide();
        });
        
    });

}



// Retrieve Workspace Details, BOM and details
function getInitialData(callback) {

    let requests = [
        $.get('/plm/bom-views-and-fields'   , { 'wsId' : wsChangeOrders.id }),
        $.get('/plm/details'                , { 'wsId' : wsChangeOrders.id, 'dmsId' : dmsId }),
        $.get('/plm/sections'               , { 'wsId' : wsChangeOrders.id }),
        $.get('/plm/fields'                 , { 'wsId' : wsChangeOrders.id }),
        $.get('/plm/sections'               , { 'wsId' : wsProblemReports.id }),
        $.get('/plm/fields'                 , { 'wsId' : wsProblemReports.id })
    ];

    if(!isBlank(config.explorer.wsIdSupplierPackages)) {
        requests.push($.get('/plm/sections', { 'wsId' : wsSupplierPackages.id }));
        requests.push($.get('/plm/fields'  , { 'wsId' : wsSupplierPackages.id }));
    }

    Promise.all(requests).then(function(responses) {

        for(view of responses[0].data) {
            if(view.name === config.explorer.bomViewName) {
                wsChangeOrders.viewId = view.id;
                wsChangeOrders.viewColumns = view.fields;
            }
        }

        if(wsChangeOrders.viewId === '') showErrorMessage('Error in configuration. Could not find BOM view "' + config.explorer.bomViewName + '"');

        wsChangeOrders.sections            = responses[2].data;
        wsChangeOrders.fields              = responses[3].data;
        wsProblemReports.sections   = responses[4].data;
        wsProblemReports.fields     = responses[5].data;
        editableFields              = getEditableFields(wsChangeOrders.fields);

        if(!isBlank(config.explorer.wsIdSupplierPackages)) {
            wsSupplierPackages.sections = responses[6].data;
            wsSupplierPackages.fields   = responses[7].data;
        } else {
            $('#send-selected').remove();
        }

        callback();

    });

}



// Open by id or click in landing page
function clickRecentItem(elemClicked)        { openSelectedItem(elemClicked); }
// function clickSearchResult(elemClicked)      { openSelectedItem(elemClicked); }
function clickWorkspaceViewItem(elemClicked) { openSelectedItem(elemClicked); }
// function clickBookmarkItem(elemClicked)      { openSelectedItem(elemClicked); }
function openSelectedItem(elemClicked)       { openItem(elemClicked.attr('data-link'), elemClicked.attr('data-title')); }
function openItem(link, title) {

    let split = link.split('/');

    setHeaderSubtitle(link);

    window.history.replaceState(null, null, '/change?wsid=' + split[4] + '&dmsid=' + split[6] + '&theme=' + theme);

    $('body').addClass('screen-main').removeClass('screen-landing');
    $('#details').attr('data-link', link);
    // $('#header-subtitle').html('');
    $('#bom-table-tree').html('');
    $('.kpi').remove();
    $('#dashboard-processing').show();
    $('#bom-processing').show();

    context.link = link;
    
    if(isBlank(title)) {
        $.get('/plm/descriptor', { 'link' : link}, function(response) {
            // $('#header-subtitle').html(response.data);
            document.title = documentTitle + ': ' + response.data;
            context.title = response.data;
        });
    } else {
        // $('#header-subtitle').html(title);
        document.title = documentTitle + ': ' + title;
        context.title = title;
    }

    for(let kpi of config.explorer.kpis) {
        kpi.data = [];
    }

    viewerLeaveMarkupMode();
    getBOMData(link);
    insertViewer(link);
    setItemDetails(link);
    insertAttachments(link, paramsAttachments);
    insertChangeProcesses(link, paramsProcesses);

}
function setHeaderSubtitle(link) {

    $('#header-description').html('');
    $('#header-descriptor').html('');
    
    $.get('/plm/details', { 'link' : link}, function(response) {

        let description = getSectionFieldValue(response.data.sections, 'DESCRIPTION', '', '');
        let elem = $('<span></span>');
            elem.html(description);

        isLocked = response.data.itemLocked;

        // if(!isLocked) $('#save').show();

        $('#header-description').append(elem.text());
        $('#header-descriptor').html(response.data.title);

        // getManagedFields();

    });    
}



// Get viewable and init Forge viewer
function onViewerSelectionChanged(event) {

    let found = false;

    if(viewer.getSelection().length === 0) {

        return;

    } else {

        viewer.getProperties(event.dbIdArray[0], function(data) {

            for(property of data.properties) {

                if(config.viewer.numberProperties.indexOf(property.displayName) > -1) {

                    let partNumber = property.displayValue;

                    $('tr').each(function() {
                        if(!found) {
                            if($(this).attr('data-part-number') === partNumber) {
                                found = true;
                                $(this).click();
                            }
                        }
                    });

                    if(!found) {
                        if(partNumber.indexOf(':') > -1 ) {
                            partNumber = property.displayValue.split(':')[0];
                            $('tr').each(function() {
                                if(!found) {
                                    if($(this).attr('data-part-number') === partNumber) {
                                        found = true;
                                        $(this).click();
                                        // if(!$(this).hasClass('selected')) {

                                        // }
                                        
                                    }
                                }
                            });
                        }
                    }

                }

            }

        });

    }

}
function initViewerDone() {
    
    $('#viewer-markup-image').attr('data-field-id', config.explorer.fieldIdProblemReportImage);

}



// Insert Selected item's data
function getBOMData(link) {
    
    let params = {
        'link'          : link,
        'depth'         : 10,
        'revisionBias'  : revisionBias,
        'viewId'        : wsChangeOrders.viewId
    }

    let promises = [
        $.get('/plm/bom', params),
        $.get('/plm/bom-flat', params)
    ];

    Promise.all(promises).then(function(responses) {

        // Drop KPIs not contained in BOM View
        for(var i = config.explorer.kpis.length - 1; i >= 0; i--) {

            let keep = false;

            for(field of wsChangeOrders.viewColumns) {
                if(field.fieldId === config.explorer.kpis[i].fieldId) {
                    keep = true;
                    break;
                }
            }

            if(!keep) config.explorer.kpis.splice(i, 1);

        }

        $('#dashboard-processing').hide();
        $('#bom-processing').hide();
        setFlatBOMHeader();
        setBOMData(responses[0].data, responses[1].data);

    });

}
function setFlatBOMHeader() {

    let elemFlatBOMTHead = $('<thead></thead>');
        elemFlatBOMTHead.appendTo($('#bom-table-flat'));

    let elemFlatBOMHead = $('<tr></tr>');
        elemFlatBOMHead.appendTo(elemFlatBOMTHead);
    
    let elemFlatBOMHeadCheck = $('<th></th>');
        elemFlatBOMHeadCheck.html('<div id="flat-bom-select-all" class="icon flat-bom-check-box xxs"></div>');
        elemFlatBOMHeadCheck.appendTo(elemFlatBOMHead);
        elemFlatBOMHeadCheck.click(function() {
            toggleSelectAll();
        });

    let elemFlatBOMHeadNumber = $('<th></th>');
        elemFlatBOMHeadNumber.html('Nr');
        elemFlatBOMHeadNumber.addClass('sticky');
        elemFlatBOMHeadNumber.appendTo(elemFlatBOMHead);

    let elemFlatBOMHeadItem = $('<th></th>');
        elemFlatBOMHeadItem.html('Item');
        elemFlatBOMHeadItem.addClass('sticky');
        elemFlatBOMHeadItem.appendTo(elemFlatBOMHead);

    let elemFlatBOMHeadQty = $('<th></th>');
        elemFlatBOMHeadQty.html('Qty');
        elemFlatBOMHeadQty.appendTo(elemFlatBOMHead); 

    for(kpi of config.explorer.kpis) {
        let elemFlatBOMHeadCell = $('<th></th>');
            elemFlatBOMHeadCell.html(kpi.title);
            elemFlatBOMHeadCell.appendTo(elemFlatBOMHead);       
    }
   
    let elemFlatBOMTBody = $('<tbody></tbody>');
        elemFlatBOMTBody.attr('id', 'bom-table-flat-tbody');
        elemFlatBOMTBody.appendTo($('#bom-table-flat'));

}
function setBOMData(bom, flatBom) {

    let elemRoot = $('#bom-table-tree');
        elemRoot.html('');

    for(field of wsChangeOrders.viewColumns) {
        if(field.fieldId === 'NUMBER') urns.partNumber = field.__self__.urn;
        else {
            for(kpi of config.explorer.kpis) {
                if(field.fieldId === kpi.fieldId) {
                    kpi.urn = field.__self__.urn;
                }
            }
        }
    }

    insertNextBOMLevel(bom, elemRoot, bom.root, flatBom);
    insertFlatBOM(flatBom);

    for(kpi of config.explorer.kpis) insertKPI(kpi);

    $('#items-processing').hide();


    $('.bom-nav').click(function(e) {

        e.stopPropagation();
        e.preventDefault();

        let elemItem  = $(this).closest('tr');
        let level     = Number(elemItem.attr('data-level'));
        let levelNext = level - 1;
        let levelHide = 10000;
        let elemNext  = $(this).closest('tr');
        let doExpand  = $(this).hasClass('collapsed');

        $(this).toggleClass('collapsed');
        
        do {

            elemNext  = elemNext.next();
            levelNext = Number(elemNext.attr('data-level'));

            if(levelNext > level) {

                if(doExpand) {

                    if(levelHide > levelNext) {

                        elemNext.show();

                        let elemToggle = elemNext.children().first().find('.bom-nav');

                        if(elemToggle.length > 0) {
                            if(elemToggle.hasClass('collapsed')) {
                                levelHide = levelNext + 1;
                            }
                        }

                    }

                } else {
                    elemNext.hide();
                }

            }
        } while(levelNext > level);

    });

    $('#bom-table-tree').children('tr').click(function(e) {
        selectBOMItem(e, $(this));
    });
    $('tr.flat-bom-row').click(function(e) {
        selectBOMItem(e, $(this));
    });

}
function insertNextBOMLevel(bom, elemRoot, parent, flatBom) {

    let result = false;

    for(edge of bom.edges) {

        if(edge.parent === parent) {

            result = true;

            let title       = getBOMItem(edge.child, bom.nodes);
            let partNumber  = getBOMCellValue(edge.child, urns.partNumber , bom.nodes);
            let link        = getBOMNodeLink(edge.child, bom.nodes);
            let newBOMItem  = { 'urn' : edge.child, 'part-number' : partNumber };
            let newItem     = true;

            if(partNumber === '') partNumber = title.split(' - ')[0];

            let elemRow = $('<tr></tr>');
                elemRow.attr('data-number', edge.itemNumber);
                elemRow.attr('data-part-number', partNumber);
                elemRow.attr('data-title', title);
                elemRow.attr('data-qty', '1');
                elemRow.addClass('bom-item');
                elemRow.appendTo(elemRoot);
    
            for(let kpi of config.explorer.kpis) {

                let kpiValue = getBOMCellValue(edge.child, kpi.urn, bom.nodes, 'title');

                if(kpi.type === 'non-empty') {
                    kpiValue = (kpiValue === '' ) ? 'No' : 'Yes';
                } else if(kpi.type === 'days') {
                    if(kpiValue === '') kpiValue = '-'
                    else {
                        let day  = kpiValue.split(' ')[0].split('-');
                        let date = new Date(day[0], day[1], day[2].split('T')[0]);
                        var diff = now.getTime() - date.getTime();
                        kpiValue = diff / (1000 * 3600 * 24);
                        kpiValue = Math.round(kpiValue, 0);
                        kpiValue = kpiValue + ' days ago';
                    }
                } else if(kpi.type === 'value') {
                    kpiValue = (kpiValue === '' ) ? '-' : kpiValue;
                }

                newBOMItem[kpi.id] = kpiValue;
                parseKPI(kpi, kpiValue);
    
            }

            for(bomItem of bomItems) {

                if(bomItem.urn === edge.child) { newItem = false; break; }
            }

            if(newItem) bomItems.push(newBOMItem);

            for(node of bom.nodes) {
                if(node.item.urn === edge.child) {
                    elemRow.attr('data-dmsId',      node.item.link.split('/')[6]);
                    elemRow.attr('data-link',       node.item.link);
                    elemRow.attr('data-urn',        edge.child);
                    elemRow.attr('data-edgeId',     edge.edgeId);
                    elemRow.attr('data-edgeLink',   edge.edgeLink);
                    elemRow.attr('data-level',      edge.depth);
                    elemRow.addClass('level-' + edge.depth);
                }
            }
            $('<td></td>').appendTo(elemRow)
                .addClass('bom-color');

            let elemCell = $('<td></td>').appendTo(elemRow)
                .addClass('bom-first-col');

            let elemCellNumber = $('<span></span>');
                elemCellNumber.addClass('bom-number');
                elemCellNumber.html(edge.depth + '.' + edge.itemNumber);
                elemCellNumber.appendTo(elemCell);

            let elemCellTitle = $('<span></span>');
                elemCellTitle.addClass('bom-title');
                elemCellTitle.html(title);
                elemCellTitle.appendTo(elemCell);

            let hasChildren = insertNextBOMLevel(bom, elemRoot, edge.child, flatBom);

            elemRow.children().first().each(function() {
                
                if(hasChildren) {

                    let elemNav = $('<span></span>');
                        elemNav.addClass('bom-nav');
                        elemNav.addClass('icon');
                        elemNav.addClass('expanded');
                        elemNav.prependTo(elemCell);

                    elemRow.addClass('node');

                }

                let elemColor = $('<span></span>');
                    elemColor.addClass('bom-color');
                    elemColor.prependTo($(this));

            });

        }

    }

    return result;

}
function getBOMItem(id, nodes) {

    for(node of nodes) {
        if(node.item.urn === id) {
            return node.item.title;
        }
    }

    return '';
    
}
function getBOMNodeLink(id, nodes) {
    for(node of nodes) {
        if(node.item.urn === id) {
            return node.item.link;
        }
    }
    return '';
}
function filterBOMTree() {

    $('tr.result').removeClass('result');
    $('.bom-nav.collapsed').removeClass('collapsed');

    let filterValue = $('#bom-search-input').val().toLowerCase();

    if(filterValue === '') {

        $('#bom-table-tree').children().each(function() {
            $(this).show();
        });
        $('.flat-bom-item').each(function() {
            $(this).parent().show();
        });

    } else {

        $('.bom-nav.collapsed').removeClass('collapsed').addClass('expanded');
        
        $('#bom-table-tree').children().each(function() {
            $(this).hide();
        });
        $('.flat-bom-item').each(function() {
            $(this).parent().hide();
        });

        $('#bom-table-tree').children().each(function() {

            let cellValue = $(this).children('.bom-first-col').html().toLowerCase();

            if(cellValue.indexOf(filterValue) > -1) {
             
                $(this).show();
                $(this).addClass('result');
             
                let level = Number($(this).attr('data-level'));
                unhideParents(level - 1, $(this));

            }

        });

        $('.flat-bom-row').each(function() {

            let elemRow   = $(this);

            elemRow.children().each(function() {
                let cellValue = $(this).html().toLowerCase();
                if(cellValue.indexOf(filterValue) > -1) {
                    elemRow.show();
                }
            });

        });

    }

}
function unhideParents(level, elem) {

    elem.prevAll().each(function() {

        let prevLevel = Number($(this).attr('data-level'));

        if(level === prevLevel) {
            level--;
            $(this).show();
        }

    });

}
function selectBOMItem(e, elemClicked) {

    $('#create-process').show();
    $('#cancel-process').hide();
    $('#save-process').hide();
    $('#processes-details').hide();
    
    let partNumbers = [];

    if(elemClicked.hasClass('selected')) {
        
        paramsProcesses.createContext.link  = context.link;
        paramsProcesses.createContext.title = context.title;

        elemClicked.removeClass('selected');
        
        viewerResetSelection(true);
        insertAttachments($('#viewer').attr('data-link'), paramsAttachments);
        insertChangeProcesses(context.link, paramsProcesses);

        // if($('.flat-bom-row.selected').length === 0) {

        //     $('.bom-action').hide();
            
        //     insertAttachments('/api/v3/workspaces/' + wsId + '/items/' + dmsId);
        //     insertChangeProcesses('/api/v3/workspaces/' + wsId + '/items/' + dmsId, 'processes');
        //     viewerResetSelection(true);
            
        //     multiSelect.wsId        = '';
        //     multiSelect.links       = [];
        //     multiSelect.common      = [];
        //     multiSelect.varies      = [];
        //     multiSelect.partNumbers = [];
            
        //     indexSelected = -1;
            
        // } else if(e.shiftKey) {

        //     // let partNumbers = [];
        //     $('.flat-bom-row.selected').each(function() {
        //         partNumbers.push($(this).attr('data-part-number'));
        //     });
        //     viewerSelectModels(partNumbers, true);
        //     viewerResetColors();

        // } else {
        //     elemClicked.click();
        // }

    } else {      

        if(e.shiftKey) {

            if(indexSelected > -1) {
                let increment = (indexSelected < elemClicked.index()) ? 1 : -1;
                do {
                    $('.flat-bom-row').eq(indexSelected).addClass('selected');
                    indexSelected += increment;
                } while (indexSelected !== elemClicked.index());
            }
            $('.flat-bom-row.selected').each(function() {
                partNumbers.push($(this).attr('data-part-number'));
            });
            viewerSelectModels(partNumbers);

        } else if(e.ctrlKey || event.metaKey) {

            $('.flat-bom-row.selected').each(function() {
                partNumbers.push($(this).attr('data-part-number'));
            });
            viewerSelectModels(partNumbers);

        } else {
            
            $('#bom-table-tree').children().removeClass('selected');
            $('.flat-bom-row').removeClass('selected');
            // viewerResetColors();
            // viewerSelectModels(multiSelect.partNumbers, true);
            
        }

        elemClicked.addClass('selected');
        partNumbers.push(elemClicked.attr('data-part-number'));

        indexSelected = elemClicked.index();

        let linkSelected   = elemClicked.attr('data-link');

        $('#details').attr('data-link', linkSelected);
        $('.bom-action').show();
        $('#go-there').show();
        
        paramsProcesses.createContext.title = elemClicked.attr('data-title');
        paramsProcesses.createContext.link  = linkSelected;
        
        viewerSelectModels(partNumbers);
        setItemDetails(linkSelected);
        insertAttachments(linkSelected, paramsAttachments);
        insertChangeProcesses(linkSelected, paramsProcesses);
        
    }

}
function toggleSelectAll() {
 
    let elemControl = $('#flat-bom-select-all');
        elemControl.toggleClass('selected');

    if(elemControl.hasClass('selected')) {
        $('.flat-bom-row').addClass('selected');
        viewerSelectAll();
    } else {
        $('.flat-bom-row').removeClass('selected');
        viewerResetSelection(true);
    }

}
function insertFlatBOM(flatBom) {

    let elemParent = $('#bom-table-flat-tbody');
    let count      = 1;

    for(item of flatBom) {

        let link        = item.item.link.toString();
        let urn         = item.item.urn;
        let title       = item.item.title;
        let qty         = Number(item.totalQuantity).toFixed(2);
        let partNumber  = getFlatBOMCellValue(flatBom, link, urns.partNumber, 'title');

        if(partNumber === '') partNumber = title.split(' - ')[0];

        let elemRow = $('<tr></tr>');
            elemRow.attr('data-link', link);
            elemRow.attr('data-urn', urn);
            elemRow.attr('data-part-number', partNumber);
            elemRow.addClass('flat-bom-row');
            elemRow.appendTo(elemParent);

        let elemRowCheck = $('<td></td>');
            elemRowCheck.html('<div class="icon flat-bom-check-box xxs"></div>');
            elemRowCheck.addClass('flat-bom-check');
            elemRowCheck.appendTo(elemRow);

        let elemRowNumber = $('<td></td>');
            elemRowNumber.html(count++);
            elemRowNumber.addClass('flat-bom-number');
            elemRowNumber.appendTo(elemRow);

        let elemRowItem = $('<td></td>');
            elemRowItem.html(title)
            elemRowItem.addClass('flat-bom-item');
            elemRowItem.appendTo(elemRow);

        let elemRowQty = $('<td></td>');
            elemRowQty.html(qty);
            elemRowQty.addClass('flat-bom-qty');
            elemRowQty.appendTo(elemRow);

        for(kpi of config.explorer.kpis) {

            let value       = getFlatBOMCellValue(flatBom, link, kpi.urn, 'title');
            let isEditable  = false;
            let elemRowCell = $('<td></td>');

            elemRowCell.appendTo(elemRow); 

            for(editableField of editableFields) {

                if(kpi.fieldId === editableField.id) {

                    if(!isBlank(editableField.control)) {

                        let elemControl = editableField.control.clone();
                            elemControl.appendTo(elemRowCell);
                            elemRowCell.attr('data-id', editableField.id);
                            elemControl.click(function(e) {
                                e.stopPropagation();
                            });
                            elemControl.change(function() {
                                valueChanged($(this));
                            });

                        switch (editableField.type) {

                            case 'Single Selection':
                                elemControl.val(value.link);
                                break;

                            default:
                                elemControl.val(value);
                                break;

                        }

                        isEditable = true;
                    }

                }

            }

            if(!isEditable) elemRowCell.html(value);
                         
        }

    }

}
function valueChanged(elemControl) {

    let index = elemControl.parent().index();
    let value = elemControl.val();

    elemControl.parent().addClass('changed');
    elemControl.closest('tr').addClass('changed');

    $('#save-bom-changes').show();

    $('.flat-bom-row.selected').each(function() {
        $(this).addClass('changed');
        $(this).children().eq(index).addClass('changed');
        $(this).children().eq(index).children().first().val(value);
    })

}
function parseKPI(kpi, value) {

    let isNew = true;

    for(let entry of kpi.data) {
        if(entry.value === value) {
            entry.count++;
            isNew = false;
            break;
        }
    }

    if(isNew) kpi.data.push({ 
        'value'     : value, 
        'count'     : 1, 
        'color'     : config.colors.list[ kpi.data.length % config.colors.list.length ],
        'vector'    : config.vectors.list[kpi.data.length % config.vectors.list.length] 
    });

}
function insertKPI(kpi) {

    let elemDashboard = $('#dashboard-panel');
    
    let elemKPI = $('<div></div>');
        elemKPI.attr('data-kpi-id', kpi.id);
        elemKPI.addClass('kpi');
        elemKPI.appendTo(elemDashboard);
        elemKPI.click(function() {
            $(this).toggleClass('collapsed');
            $(this).find('.kpi-values').toggle();
        });

    let elemKPISelect = $('<div></div>');
        elemKPISelect.addClass('kpi-selector');
        elemKPISelect.appendTo(elemKPI);
        elemKPISelect.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            selectKPI($(this).parent());
        });

    let elemKPIHeader = $('<div></div>');
        elemKPIHeader.addClass('kpi-header');
        elemKPIHeader.html(kpi.title);
        elemKPIHeader.appendTo(elemKPI);

    let elemKPIValues = $('<div></div>');
        elemKPIValues.addClass('kpi-values');
        elemKPIValues.addClass(kpi.style);
        elemKPIValues.appendTo(elemKPI);

    if(kpi.style === 'bars') {

        let sort = (typeof kpi.sort === 'undefined') ? 'count' : kpi.sort;

        sortArray(kpi.data, sort, 'number', 'descending');

        let max = 1; 

        for(entry of kpi.data) {
            if(entry.count > max) max = entry.count;
        }

        kpi.max = max;

    }

    for(entry of kpi.data) {

        let color =  entry.color;
        let label = (entry.value === '') ? '-' : entry.value;

        let elemKPIValue = $('<div></div>');
            elemKPIValue.attr('data-filter', entry.value);
            elemKPIValue.addClass('kpi-value');
            elemKPIValue.appendTo(elemKPIValues);
            elemKPIValue.click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                selectKPIValue(e, $(this));
            });
    
        let elemKPILabel = $('<div></div>');
            elemKPILabel.addClass('kpi-label');
            elemKPILabel.html(label);
            elemKPILabel.appendTo(elemKPIValue);

        let elemKPICounter = $('<div></div>');
            elemKPICounter.addClass('kpi-counter');
            elemKPICounter.html(entry.count);
            elemKPICounter.appendTo(elemKPIValue);

        if(kpi.style === 'bars') {
            let width = entry.count * 100 / kpi.max;
            elemKPIValue.css('background', 'linear-gradient(90deg, ' + color + ' 0 ' + width + '%, var(--color-surface-level-1) ' + width + '% 100%)');
        } else {
            elemKPILabel.css('border-color', entry.color);
        }

    }

}



// KPI Handling
function selectKPI(elemClicked) {

    viewerResetColors();

    let id          = elemClicked.attr('data-kpi-id');
    let isSelected  = elemClicked.hasClass('selected');
    let kpiData     = null;

    $('.kpi').removeClass('selected');
    // $('.kpi-value').removeClass('selected');
    // $('#bom').addClass('no-colors');
    // $('#flat-bom').addClass('no-colors');
    $('.bom-color').each(function() { $(this).css('background', '') });
    $('.flat-bom-number').each(function() { $(this).css('background', '') });

    if(isSelected) return; 
        
    for(kpi of config.explorer.kpis) {
        if(kpi.id === id) {
            kpiData = kpi.data;
            break;
        }
    }

    if(kpiData === null) return;

    // $('#bom').removeClass('no-colors');
    // $('#flat-bom').removeClass('no-colors');
    elemClicked.addClass('selected');

    viewerResetColors();

    elemClicked.find('.kpi-value').each(function() {
    
        let filter      = $(this).attr('data-filter');
        let color       = '';
        let vector      = null;
        let partNumbers = [];

        for(entry of kpiData) {
            if(entry.value === filter) {
                color  = entry.color;
                vector = entry.vector;
                break;
            }
        }

        $('#bom-table-tree').children().each(function() {
            
            let value   = null;
            let urn     = $(this).attr('data-urn');

            for (bomItem of bomItems) {
                if(bomItem.urn === urn) {
                    value = bomItem[id];
                }
            }

            if(value === filter) {
                partNumbers.push($(this).attr('data-part-number'));
                $(this).find('.bom-color').css('background', color);
            }

        });

        $('#bom-table-flat').find('tr').each(function() {

            let value   = null;
            let urn     = $(this).attr('data-urn');

            for (bomItem of bomItems) {
                if(bomItem.urn === urn) {
                    value = bomItem[id];
                }
            }

            if(value === filter) {
                $(this).children('.flat-bom-number').first().css('background', color);
            }

        });

        viewerSetColors(partNumbers, { 
            'color' : vector ,
            'resetColors' : false
        });

    });

}
function selectKPIValue(e, elemClicked) {

    let isSelected = elemClicked.hasClass('selected');
    
    if(!e.shiftKey) $('.kpi-value').removeClass('selected');

    if(isSelected) elemClicked.removeClass('selected');
    else           elemClicked.addClass('selected');
    
    applyFilters();

}
function applyFilters() {

    let partNumbers = [];
    let filters     = [];
    let counter     = 0;

    $('.kpi-value.selected').each(function() {

        let id      = $(this).closest('.kpi').attr('data-kpi-id');
        let value   = $(this).attr('data-filter');
        let isNew   = true;

        for(filter of filters) {
            if(filter.id === id) {
                filter.values.push(value);
                isNew = false;
            }
        }

        if(isNew) filters.push({
            'id'     : id,
            'values' : [value]
        });

    });

    viewerResetSelection(true);

    $('#bom-table-tree').children().each(function() {

        let isVisible   = true;
        let urn         = $(this).attr('data-urn');

        for(bomItem of bomItems) {
            if(bomItem.urn === urn) {
                for(filter of filters) {
                    let value = bomItem[filter.id];
                    if(filter.values.indexOf(value) < 0) isVisible = false;
                }
                break;
            }
        }

        if(isVisible) {
            $(this).show().removeClass('hidden');
            counter++;
            partNumbers.push($(this).attr('data-part-number'));
        } else $(this).hide().addClass('hidden');;

    });


    $('.flat-bom-row').each(function() {

        let isVisible   = true;
        let urn         = $(this).attr('data-urn');

        for(bomItem of bomItems) {
            if(bomItem.urn === urn) {
                for(filter of filters) {
                    let value = bomItem[filter.id];
                    if(filter.values.indexOf(value) < 0) isVisible = false;
                }
                break;
            }
        }

        if(isVisible) $(this).show().removeClass('hidden');
        else          $(this).hide().addClass('hidden');

    });

    if($('.kpi-value.selected').length > 0) {
        $('#dashboard').removeClass('no-toolbar');
        $('#dashboard-counter').html(counter + ' matches');
        if(counter === 1) $('#dashboard-counter').html('1 match');
    } else {
        $('#dashboard').addClass('no-toolbar');
    }

    if(filters.length === 0) viewerResetColors();
    else viewerSelectModels(partNumbers);

}
function refreshKPIs() {

    let params = {
        'wsId'          : wsId,
        'dmsId'         : dmsId,
        'depth'         : 10,
        // 'revisionBias'  : 'allChangeOrder',
        // 'revisionBias'  : 'changeOrder',
        'revisionBias'  : 'release',
        // 'revisionBias'  : 'working',
        'viewId'        : wsChangeOrders.viewId
    }

    let promises = [
        $.get('/plm/bom'     , params),
        $.get('/plm/bom-flat', params)
    ];


    // $('#dashboard-panel').html('');
    $('#dashboard-panel').addClass('hidden');
    $('#dashboard-processing').show();

    Promise.all(promises).then(function(responses) {


        let bom = responses[0].data;

        bomItems = [];


        for(kpi of config.explorer.kpis) {
            for(data of kpi.data) {
                data.count = 0;
            }
        };

        parsetNextBOMLevelKPIs(bom, bom.root);

        $('#dashboard-panel').removeClass('hidden');
        $('#dashboard-processing').hide();

        
        for(kpi of config.explorer.kpis) refreshKPI(kpi);


    });
    
}
function parsetNextBOMLevelKPIs(bom, parent) {

    for(edge of bom.edges) {

        if(edge.parent === parent) {

            let partNumber  = getBOMCellValue(edge.child, urns.partNumber , bom.nodes);
            // let link        = getBOMNodeLink(edge.child, bom.nodes);
            let newBOMItem  = { 'urn' : edge.child, 'part-number' : partNumber };
            let newItem     = true;


            for(kpi of config.explorer.kpis) {

                let kpiValue = getBOMCellValue(edge.child, kpi.urn, bom.nodes, 'title');

                if(kpi.type === 'non-empty') {
                    kpiValue = (kpiValue === '' ) ? 'No' : 'Yes';
                } else if(kpi.type === 'days') {
                    if(kpiValue === '') kpiValue = '-'
                    else {
                        let day  = kpiValue.split(' ')[0].split('-');
                        let date = new Date(day[0], day[1], day[2].split('T')[0]);
                        var diff = now.getTime() - date.getTime();
                        kpiValue = diff / (1000 * 3600 * 24);
                        kpiValue = Math.round(kpiValue, 0);
                        kpiValue = kpiValue + ' days ago';
                    }
                } else if(kpi.type === 'value') {
                    kpiValue = (kpiValue === '' ) ? '-' : kpiValue;
                }

                newBOMItem[kpi.id] = kpiValue;
                parseKPI(kpi, kpiValue);

                for(bomItem of bomItems) {

                    if(bomItem.urn === edge.child) { newItem = false; break; }
                }
    
                if(newItem) bomItems.push(newBOMItem);

                
    
            }

            parsetNextBOMLevelKPIs(bom, edge.child);

        }
    }

}
function refreshKPI(kpi) {

    let elemDashboard = $('#dashboard-panel');

    if(kpi.style === 'bars') {

        let sort = (typeof kpi.sort === 'undefined') ? 'count' : kpi.sort;

        sortArray(kpi.data, sort, 'number', 'descending');

        let max = 1; 

        for(entry of kpi.data) {
            if(entry.count > max) max = entry.count;
        }

        kpi.max = max;

    }

    elemDashboard.children('.kpi').each(function() {
        
        let elemKPI = $(this);
        let id = elemKPI.attr('data-kpi-id');

        if(id === kpi.id) {
        
            let elemKPISelector = $(this).children('.kpi-selector').first();

            if(elemKPI.hasClass('selected')) {
                elemKPI.removeClass('selected');
                // selectKPI(elemKPISelector);
                elemKPISelector.click();
            }
            
        let elemKPIValues = $(this).children('.kpi-values').first();
        elemKPIValues.html('');

        for(entry of kpi.data) {

            let color =  entry.color;
            let label = (entry.value === '') ? '-' : entry.value;
    
            let elemKPIValue = $('<div></div>');
                elemKPIValue.attr('data-filter', entry.value);
                elemKPIValue.addClass('kpi-value');
                elemKPIValue.appendTo(elemKPIValues);
                elemKPIValue.click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    selectKPIValue(e, $(this));
                });
        
            let elemKPILabel = $('<div></div>');
                elemKPILabel.addClass('kpi-label');
                elemKPILabel.html(label);
                elemKPILabel.appendTo(elemKPIValue);
    
            let elemKPICounter = $('<div></div>');
                elemKPICounter.addClass('kpi-counter');
                elemKPICounter.html(entry.count);
                elemKPICounter.appendTo(elemKPIValue);
    
            if(kpi.style === 'bars') {
                let width = entry.count * 100 / kpi.max;
                elemKPIValue.css('background', 'linear-gradient(90deg, ' + color + ' 0 ' + width + '%, white ' + width + '% 100%)');
            } else {
                elemKPILabel.css('border-color', entry.color);
            }
    
        }
    }

    });
    
    
}
 


function setItemDetails(link) {

    getBookmarkStatus();

    $('#details-processing').show();
    $('#details-sections').html('');

    $.get('/plm/details', { 'link' : link }, function(response) {

        if($('#details').attr('data-link') !== response.params.link) return;

        insertItemDetailsFields(link, 'details', wsChangeOrders.sections, wsChangeOrders.fields, response.data, true, false, false);

        $('#details-processing').hide();

        if(multiSelect.links.length < 2) {

            for(section of response.data.sections) {
                for(field of section.fields) {
                    if(typeof field.value !== 'undefined') {
                        if(field.value !== null) {
                            multiSelect.common.push({
                                'fieldId' : field.__self__.split('/')[10],
                                'value'   : (typeof field.value === 'object') ? field.value.link : field.value
                            });
                        }
                    }
                }
            }

        } else {

            // console.log(' > parsing common properties');

            for(let index = multiSelect.common.length - 1; index >= 0; index--) {

                let fieldId = multiSelect.common[index].fieldId;
                let keep    = false;

                for(section of response.data.sections) {
                
                    for(field of section.fields) {

                       

                        

                            let id = field.__self__.split('/')[10];
                            

                        if(fieldId === id) {

                            if(field.value !== null) {


                                let value = (typeof field.value === 'object') ? field.value.link : field.value;

                                // console.log(field);
                                // console.log(fieldId);
                                // console.log(field.value);
                                // console.log(multiSelect.common[index].value);
                                if(multiSelect.common[index].value === value) {
                                    keep = true;
                                }
                                // console.log(keep);
                            }

                        }

                    }
                
                }

                if(!keep) {
                    multiSelect.common.splice(index, 1);
                    multiSelect.varies.push(fieldId);
                }
                    
            }

            // console.log(multiSelect);

            $('#sections').find('.field-value').each(function() {

                let id = $(this).attr('data-id');
                let reset = true;
                for(field of multiSelect.common) {
                    if(id === field.fieldId) {
                        // if(field.value === $(this).val()) {
                            reset = false;
                        // }
                    }
                }

                if(reset) {
                    if($(this).hasClass('radio')) {
                        $(this).find('input').each(function() {
                            $(this).removeAttr('checked');
                        });
                    } else $(this).val('');
                } 

            });

        }

    });

}


// Display create & connect dialog
function showCreateDialog() {

    $('#overlay').show();
    $('#create-connect').show();

    insertItemDetailsFields('', 'create-connect', wsSupplierPackages.sections, wsSupplierPackages.fields, null, true, true, true);

    let elemField;

    $('#create-connect-sections').find('.multi-picklist').each(function() {
        if($(this).attr('data-id') === 'SHARED_ITEMS') elemField = $(this);
    });

    $('#bom-table-tree').children('.selected').each(function() {

        let elemOption = $('<div></div>');
            elemOption.attr('data-link', $(this).attr('data-link'));
            elemOption.html($(this).attr('data-title'));
            elemOption.appendTo(elemField);
        
    });

}



// Save BOM Changes
function saveBOMChanges() {

    $('#overlay').show();
    saveBOMChange();

}
function saveBOMChange() {

    if($('tr.changed').length === 0) {

        $('#save-bom-changes').hide();
        $('#overlay').hide();

    } else {

        let requests = [];
        let elements = [];

        $('tr.changed').each(function() {

            if(requests.length < maxRequests) {

                let elemItem = $(this);

                let params = { 
                    'link'     : elemItem.attr('data-link'),
                    'sections' : []
                };      
        
                elemItem.children('.changed').each(function() {
                    let elemField = getFieldValue($(this));
                    addFieldToPayload(params.sections, wsChangeOrders.sections, null, elemField.fieldId, elemField.value);
                });

                requests.push($.post('/plm/edit', params));
                elements.push(elemItem);

            }

        });

        Promise.all(requests).then(function(responses) {

            for(element of elements) {
                element.removeClass('changed');
                element.children().removeClass('changed');
            }
            saveBOMChange();

        });

    }

}


// Save Item Details Changes
function saveChanges() {
    
    $('#overlay').show();
    saveItem(0);

}
function saveItem() {

    let params = { 
        'link'     : $('#details').attr('data-link'),
        'sections' : getSectionsPayload($('#details-sections')) 
    };

    $.post('/plm/edit', params, function(response) {
        if(response.error) {
            showErrorMessage('Save Failed', response.data.message);
        }
        $('#overlay').hide();
    });

}