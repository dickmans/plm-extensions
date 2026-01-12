let maxRequests = 5;

let paramsSummary = {
    id       : 'details',
    contents : [ { 
        type   : 'details', 
        params : {
            id               : 'details-details', 
            collapseContents : true, 
            hideHeader       : true,
            layout           : 'narrow'
        }
    },{
        type   : 'attachments',
        params : { 
            id               : 'details-attachments', 
            contentSize      : 's',
            editable         : true, 
            reload           : true, 
            uploadScreenshot : true, 
            singleToolbar    : 'controls'
        }
    }],
    layout           : 'tabs',
    hideSubtitle     : true,
    hideCloseButton  : true,
    openInPLM        : true,
    bookmark         : true,
    saveTabSelection : true
}
let paramsoperationsSourcing = {
    id               : 'operations-sourcing',
    headerLabel      : 'Suppliers',
    reload           : true,
    openInPLM        : true,
    layout           : 'table',
    contentSize      : 'm',
    fieldsEx         : ['Manufacturer Part Number']
}
let paramsoperationsGrid = {
    id               : 'operations-grid',
    headerLabel      : 'List of Operations',
    editable         : true,
    hideButtonLabels : true,
    reload           : true,
    multiSelect      : true,
    openInPLM        : true,
    useCache         : true,
    singleToolbar    : 'controls'
}

let ebomPartsList      = [];
let mbomPartsList      = [];
let picklistMakeBuy    = [];
let wsEBOM             = { id : '', sections : [], fields : [], viewId : '', viewFields : [] };
let wsMBOM             = { id : '', sections : [], fields : [], viewId : '', viewFields : [] };
let bomViewLinksMBOM   = { makeBuy : '', ebomRoot : '', isEBOMItem : '' }
let singleWorkspace    = false;
let links              = {};
let basePartNumber     = '';
let viewerStatusColors = false;
let disassembleMode    = false;
let elemBOMDropped     = null;
let siteSuffix         = '';
let siteLabel          = '';
let effectiveDate      = '';
let revisionBias       = '';

let pendingActions, pendingRemovals;


$(document).ready(function() {

    for(let option of options) {
        let param = option.split(':');
        if(param[0].toLowerCase() === 'site') {
            siteSuffix = '_' + param[1];
            siteLabel        = param[1];
        }
    }

    wsEBOM.wsId = config.workspaceEBOM.workspaceId || common.workspaceIds.items
    wsMBOM.wsId = config.workspaceMBOM.workspaceId || common.workspaceIds.items;
    links.start = urlParameters.link;

    appendProcessing('ebom', false);
    appendProcessing('mbom', false);
    appendProcessing('details');
    appendOverlay(true);

    $('#mbom-add-text').html(config.labelInsertNode);

    if(!config.displayOptions.excelExport     ) $('#export'         ).remove(); else $('#export'         ).removeClass('hidden');
    if(!config.displayOptions.bomColumnMakeBuy) $('#make-buy-filter').remove(); else $('#make-buy-filter').removeClass('hidden');

    let requests = [ $.get('/plm/details', { link : links.start }) ];

    getFeatureSettings('mbom', requests, function(responses) {

        insertSearchFilters();
        setUIEvents();

        if( config.displayOptions.tabDisassemble  ) $('#mode-disassemble' ).removeClass('hidden');
        if( config.displayOptions.tabOperations ) $('#mode-operations').removeClass('hidden');
        if(!config.displayOptions.bomColumnMakeBuy) $('body').addClass('hide-column-make-buy');
                
        let fieldIdEBOM = urlParameters.contextfieldidebom || config.workspaceMBOM.fieldIDs.ebom;
        let fieldIdMBOM = urlParameters.contextfieldidmbom || config.workspaceEBOM.fieldIDs.mbom;

        links.ebom    = getSectionFieldValue(responses[0].data.sections, fieldIdEBOM, '', 'link');
        links.mbom    = getSectionFieldValue(responses[0].data.sections, fieldIdMBOM + siteSuffix, '', 'link');

        if(urlParameters.wsId == wsEBOM.wsId) {
            if(isBlank(links.ebom)) {
                links.ebom = links.start;
            } else if(isBlank(links.mbom)) {
                links.mbom = links.start;
            }
        } else if(urlParameters.wsId == wsMBOM.wsId) {
            links.mbom = links.start;
        } else {
            links.context = links.start;
        }

        getInitialData();

    });
        
});


function setUIEvents() {


    // Header Toolbar
    $('#export').click(function() {

        if($(this).hasClass('disabled')) return;

        $('#overlay').show();

        let sheets = [{
            hideRoot   : true,
            type       : 'bom',
            depth      : 10,
            link       : links.mbom,
            name       : 'Purchased Parts',
            freezeCols : ['Descriptor'],
            bomView    : config.workspaceMBOM.bomView,
            totalQty    : {
                label   : 'Total Qty',
                column  : 4
            },
            selectItems : {
                fieldId : config.workspaceMBOM.bomFieldIDs.makeOrBuy,
                values  : ['Buy']
            }
        }];

        $.post('/plm/excel-export', {
            fileName   : 'Purchased Parts.xlsx',
            sheets     : sheets
        }, function(response) {
            $('#overlay').hide();
            let url = document.location.href.split('/mbom')[0] + '/' + response.data.fileUrl;
            document.getElementById('frame-download').src = url;
        });
        
    });
    $('#toggle-details').click(function() { 
        $('body').toggleClass('details-on');
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
        setTimeout(function() { viewer.resize(); }, 250); 
    })
    $('#reset').click(function() { reloadPage(); });  
    $('#save').click(function() {
        setSaveActions();
        showSaveProcessingDialog();
        createNewItems();
    });


    // MBOM Filter
    $('#make-buy-filter').change(function() {
        applyMakeBuyFilter();
    });


    // Tabs
    $('#mode-disassemble').click(function() { 
        resetHiddenInstances();
        $('body').addClass('mode-disassemble').removeClass('mode-ebom').removeClass('mode-add').removeClass('mode-operations');
        setTimeout(function() { 
            viewer.resize(); 
            viewer.setGhosting(false);
            restoreAssembly();
        }, 250); 
        disassembleMode = true;
        $(this).addClass('selected');
        $(this).siblings().removeClass('selected');
    });
    $('#mode-ebom').click(function() { 
        $('body').removeClass('mode-disassemble').addClass('mode-ebom').removeClass('mode-add').removeClass('mode-operations');
        if(typeof viewer !== 'undefined') {
            setTimeout(function() { 
                viewer.resize(); 
                viewer.setGhosting(true);
                viewerResetSelection(false);
            }, 250); 
        }
        disassembleMode = false;
        $(this).addClass('selected');
        $(this).siblings().removeClass('selected');
    });
    $('#mode-add').click(function() { 
        $('body').removeClass('mode-disassemble').removeClass('mode-ebom').addClass('mode-add').removeClass('mode-operations');
        setTimeout(function() { viewer.resize(); }, 250); 
        disassembleMode = false;
        $(this).addClass('selected');
        $(this).siblings().removeClass('selected');
    });
    $('#mode-operations').click(function() { 
        $('body').removeClass('mode-disassemble').removeClass('mode-ebom').removeClass('mode-add').addClass('mode-operations');
        setTimeout(function() { viewer.resize(); }, 250); 
        disassembleMode = false;
        $(this).addClass('selected');
        $(this).siblings().removeClass('selected');
        viewerResize();
    });
    $('#mode-ebom').click();


    // EBOM Alignment
    $('#add-all').click(function() {
        $('.item.additional').find('.item-action-add').click();
    });
    $('#deselect-all').click(function() {
        $('.item.selected').removeClass('selected');
        $('.item').show();
        viewerResetSelection(true);
    });
    $('#toggle-viewer').click(function() {
        $('#toggle-viewer').toggleClass('toggle-on').toggleClass('toggle-off');
        $('body').toggleClass('no-viewer')
    });
    $('#toggle-colors').click(function() {
        $('#toggle-colors').toggleClass('toggle-on').toggleClass('toggle-off');
        viewerStatusColors = (viewerStatusColors) ? false : true;
        setStatusBar();
        setStatusBarFilter();
    });
    $('.bar').click(function() {
        $(this).siblings().removeClass('selected');
        $(this).toggleClass('selected');
        setStatusBar();
        setStatusBarFilter();
    })
    $('#ebom-qty-comparison').click(function() { $('body').removeClass('with-quantity-comparison'); });


    // MBOM Editing
    $('.panel-nav').click(function() {
        clickPanelNav($(this));
    });
    $('.panel-nav').first().click();
    $('#search-input').keypress(function (e) {
        if (e.which === 13) {
            searchItems('search-items', 'search-items-list', $('#search-input').val());
            $('#search-items-list').html('');
        }
    });
    $('#view-selector-ebom').change(function() {
        setWorkspaceView('ebom');
    });
    $('#view-selector-mbom').change(function() {
        setWorkspaceView('mbom');
    });
    $('input.list-search').keypress(function(e) {
        if(e.which === 13) {
            $('#add-processing').show().siblings().hide();
            let elemActive = $('.panel-nav.active').first();
            let query = elemActive.attr('data-query');
            let value = $(this).val();
            if(value !== '')  query = '(' + query + ')+AND+' + $(this).val();
            searchItems(elemActive.attr('data-id') + '-list', query);
        }
    });
    $('input.list-filter').keypress(function() {
        filterList($(this).val(), $(this).parent().next());
    });
    $('input.list-filter').keyup(function(e){
        if(e.keyCode == 8) filterList($(this).val(), $(this).parent().next());
    })  


    // Controls to add new process in BOM
    $('#mbom-add-process > input').keypress(function (e) { insertNewProcess(e); });


    // Set End Item dialog
    $('#end-item-cancel').click(function() { 
        $('.item').removeClass('to-end');
        $('#dialog-end-item').hide();
        $('#overlay').hide();
    });
    $('#end-item-confirm').click(function() { 
        setEBOMEndItem();
    });


    // Insert EBOM to MBOM dialog
    $('#insert-cancel').click(function() { 
        $('.item').removeClass('to-insert');
        $('#dialog-insert').hide();
        $('#overlay').hide();
    });
    $('#insert-confirm').click(function() { 
        insertEBOMtoMBOM();
    });


    // Convert to MBOM dialog
    $('#convert-cancel').click(function() { 
        $('.item').removeClass('to-convert');
        $('#dialog-convert').hide();
        $('#overlay').hide();
    });
    $('#convert-confirm').click(function() { 
        convertEBOMtoMBOM();
    });


    // Copy items dialog
    $('#copy-cancel').click(function() { 
        $('#dialog-copy').hide();
        $('#overlay').hide();
        $('.item.to-move').removeClass('to-move');
    });
    $('#copy-move').click(function() { 
        moveItemQuantity();
    });
    $('#copy-add').click(function() { 
        addItemQuantity();
    });

 
    // Save Confirmation Dialog
    $('#confirm-saving').click(function() {
        if($(this).hasClass('disabled')) return;
        else {
            $('#overlay').hide();
            $('#dialog-saving').hide();
        }
    });

}
function selectTab(elemClicked) { 
    
    // override default tabs

    $('.panel-content').removeClass('hidden');

    elemClicked.addClass('selected');
    elemClicked.siblings().removeClass('selected');

}


// Retrieve data before rendering the MBOM Editor
function getInitialData() {

    let requests = [
        $.get('/plm/versions'               , { link : links.ebom }),
        $.get('/plm/details'                , { link : links.ebom }),
        $.get('/plm/bom-views-and-fields'   , { wsId : wsEBOM.wsId, useCache : true }),
        $.get('/plm/sections'               , { wsId : wsEBOM.wsId, useCache : true }),
        $.get('/plm/sections'               , { wsId : wsMBOM.wsId, useCache : true }),
        $.get('/plm/workspace'              , { wsId : wsEBOM.wsId, useCache : true }),
        $.get('/plm/tableaus'               , { wsId : wsEBOM.wsId }),
        $.get('/plm/fields'                 , { wsId : wsMBOM.wsId, useCache : true }),
        $.get('/plm/picklist'               , { link : '/api/v3/lookups/' + config.picklistIDMakeOrBuy, useCache : true })
    ];

    if(wsEBOM.wsId === wsMBOM.wsId) {

        singleWorkspace = true;
        $('#nav-workspace-views-mbom').hide();

    } else {

        requests.push($.get('/plm/bom-views-and-fields' , { wsId : wsMBOM.wsId, useCache : true }));
        requests.push($.get('/plm/workspace'            , { wsId : wsMBOM.wsId, useCache : true }));
        requests.push($.get('/plm/tableaus'             , { wsId : wsMBOM.wsId }));

    }

    Promise.all(requests).then(function(responses) {

        for(let view of responses[2].data) {
            if(view.name.toLowerCase() === config.workspaceEBOM.bomView.toLowerCase()) {
                wsEBOM.viewId       = view.id;
                wsEBOM.viewFields  = view.fields;
            }
        }

        if(wsEBOM.viewId === '') showErrorMessage('Setup Error', 'Error in configuration, BOM view "'+ config.workspaceEBOM.bomView + '" could not be found in workspace '+ wsEBOM.wsId);

        $('#nav-workspace-views-ebom').html(responses[5].data.name);

        wsEBOM.tableaus = responses[6].data;

        insertWorkspaceViewsOptions('ebom', wsEBOM.tableaus);

        if(wsEBOM.wsId === wsMBOM.wsId) {
        
            wsMBOM.viewId       = wsEBOM.viewId;
            wsMBOM.viewFields  = wsEBOM.viewFields;
        
        } else {

            $('#nav-workspace-views-mbom').html(responses[9].data.name);

            for(let view of responses[8].data) {
                if(view.name === config.workspaceMBOM.bomView) {
                    wsMBOM.viewId       = view.id;
                    wsMBOM.viewFields  = view.fields;
                }
            }

            wsMBOM.tableaus = responses[10].data;

            insertWorkspaceViewsOptions('mbom', wsMBOM.tableaus);

        }

        if(!isBlank(wsMBOM.viewFields)) {
            let bomFieldIDs = config.workspaceMBOM.bomFieldIDs;
            for(let viewColumn of wsMBOM.viewFields) {
                switch(viewColumn.fieldId) {
                    // case common.workspaces.items.fieldIdNumber      : bomViewFieldIDsMBOM.partNumber   = viewColumn.viewDefFieldId; break;
                    // case config.fieldIdType         : bomViewFieldIDsMBOM.type         = viewColumn.viewDefFieldId; break;
                    // case config.fieldIdCategory     : bomViewFieldIDsMBOM.category     = viewColumn.viewDefFieldId; break;
                    // case config.fieldIdProcessCode  : bomViewFieldIDsMBOM.code         = viewColumn.viewDefFieldId; break;
                    // case config.fieldIdEndItem      : bomViewFieldIDsMBOM.endItem      = viewColumn.viewDefFieldId; break;
                    // case config.fieldIdMatchesMBOM  : bomViewFieldIDsMBOM.matchesMBOM  = viewColumn.viewDefFieldId; break;
                    // case config.fieldIdIsProcess    : bomViewFieldIDsMBOM.isProcess    = viewColumn.viewDefFieldId; break;
                    // case config.fieldIdEBOM         : bomViewFieldIDsMBOM.xbom         = viewColumn.viewDefFieldId; break;
                    // case bomFieldIDs.makeOrBuy           : bomViewFieldIDsMBOM.makeBuy      = viewColumn.viewDefFieldId; bomViewLinksMBOM.makeBuy = viewColumn.__self__.link; break;
                    case bomFieldIDs.makeOrBuy           : bomViewLinksMBOM.makeBuy = viewColumn.__self__.link; break;
                    case bomFieldIDs.isEBOMItem          : bomViewLinksMBOM.isEBOMItem = viewColumn.__self__.link; break;
                    // case 'QUANTITY'                      : bomViewFieldIDsMBOM.quantity     = viewColumn.viewDefFieldId; break;
                    case config.fieldIdEBOMItem     : 
                        // bomViewFieldIDsMBOM.ebomItem = viewColumn.viewDefFieldId;
                        bomViewLinksMBOM.ebomItem    = viewColumn.__self__.link; 
                        break;
                }
            }
            // bomViewFieldIDsMBOM.ignoreInMBOM = '';

        }

        wsEBOM.sections = responses[3].data;
        wsMBOM.sections = responses[4].data;
        wsMBOM.fields   = responses[7].data;
        picklistMakeBuy = responses[8].data.items;

        for(let picklistValue of picklistMakeBuy) {
            $('<option></option>').appendTo($('#make-buy-filter'))
                .attr('value', picklistValue.link)    
                .html(picklistValue.title);
        }

        insertCreate(null, [wsMBOM.wsId], { 
            cancelButton    : false,
            id              : 'create-item-form',
            header          : false,
            showInDialog    : false,
            hideComputed    : true,
            hideReadOnly    : true,
            sectionsIn      : config.sectionsInCreateForm,
            afterCreation   : function(id, link) { onItemCreation(link); }
        });

        if(responses[0].error) showErrorMessage('Error at startup', responses[0].data.message);

        let itemVersions = responses[0].data.versions;

        switch(config.switchEBOMRevision.toLowerCase()) {

            case 'working':
                links.latest = itemVersions[0].item.link;
                revisionBias = 'working';
                break;

            case 'latest':
                if(itemVersions.length === 1) {
                    links.latest = itemVersions[0].item.link;
                } else {
                    links.latest  = itemVersions[1].item.link;
                    effectiveDate = itemVersions[1].effectivity.startDate;
                }
                revisionBias = 'release';
                break;

            default:
                links.latest = links.ebom;
                revisionBias = 'release';
                for(let itemVersion of itemVersions) {
                    if(itemVersion.item.link === links.ebom) {
                        effectiveDate = itemVersion.effectivity.startDate;
                    }
                }
                break;

        }

        if(links.ebom !== links.latest) {
            links.ebom = links.latest;
            $.get('/plm/details', { link : links.ebom }, function(response) {
                processItemData(response.data);
            });
        } else {
            processItemData(responses[1].data);
        }

    });

}
function insertWorkspaceViewsOptions(suffix, tableaus) {

    for(let tableau of tableaus) {

        $('<option></option>').appendTo($('#view-selector-' + suffix))
            .attr('value', tableau.link)
            .html(tableau.title);

    }

}



// Process Item Details and set BOM Trees
function processItemData(itemDetails) {

    $('#header-subtitle').html(itemDetails.title);

    basePartNumber = getSectionFieldValue(itemDetails.sections, config.workspaceEBOM.fieldIDs.number, '', null);

    insertViewer(links.ebom);

    createMBOMRoot(itemDetails, function() {

        let requests = [];

        let paramsEBOM = {     
            link            : links.ebom,
            viewId          : wsEBOM.viewId,
            depth           : config.workspaceEBOM.depth,
            revisionBias    : revisionBias,
            getBOMPartsList : true
        }
        
        let paramsMBOM = {     
            link            : links.mbom,
            viewId          : wsMBOM.viewId,
            depth           : config.workspaceEBOM.depth,
            revisionBias    : 'working',
            getBOMPartsList : true
        }

        if(!isBlank(effectiveDate)) {
            paramsEBOM.effectiveDate = effectiveDate;
            paramsMBOM.effectiveDate = effectiveDate;
        }

        requests.push($.get('/plm/bom', paramsEBOM));
        requests.push($.get('/plm/bom', paramsMBOM));

        Promise.all(requests).then(function(responses) {

            eBOM = responses[0].data;
            mBOM = responses[1].data;

            ebomPartsList = responses[0].data.bomPartsList;
            mbomPartsList = responses[1].data.bomPartsList;

            links.ebom = '/api/v3/workspaces/' + wsEBOM.wsId + '/items/' + eBOM.root.split('.')[5];
            links.mbom = '/api/v3/workspaces/' + wsMBOM.wsId + '/items/' + mBOM.root.split('.')[5];

            eBOM.edges.sort(function(a, b){ return a.itemNumber - b.itemNumber });
            mBOM.edges.sort(function(a, b){ return a.itemNumber - b.itemNumber });

            for(let ebomPart of ebomPartsList) {

                ebomPart.bomType  = 'ebom';
                ebomPart.mbom     = getBOMPartFieldValue(ebomPart, config.workspaceEBOM.fieldIDs.mbom);
                ebomPart.type     = ebomPart.details[config.workspaceEBOM.fieldIDs.type    ] || '';
                ebomPart.category = ebomPart.details[config.workspaceEBOM.fieldIDs.category] || '';
                ebomPart.code     = ebomPart.details[config.workspaceEBOM.fieldIDs.code    ] || '';
                
                ebomPart.endItem      = (ebomPart.details[config.workspaceEBOM.fieldIDs.endItem     ] == 'true');
                ebomPart.matchesMBOM  = (ebomPart.details[config.workspaceEBOM.fieldIDs.matchesMBOM ] == 'true');
                ebomPart.ignoreInMBOM = (ebomPart.details[config.workspaceEBOM.fieldIDs.ignoreInMBOM] == 'true');

                ebomPart.hasChildren  = getBOMPartHasChildren(ebomPart, ebomPartsList);
                ebomPart.icon         = getBOMPartIcon(ebomPart);
                ebomPart.makeBuy      = getBOMPartFieldValue(ebomPart, config.workspaceEBOM.fieldIDs.makeOrBuy);
                ebomPart.isLeaf       = isEBOMLeaf(ebomPart);

                if(ebomPart.revision === 'WIP') ebomPart.revision = 'W';

            }

            for(let mbomPart of mbomPartsList) {

                mbomPart.bomType   = 'mbom';
                mbomPart.ebom      = getBOMPartFieldValue(mbomPart, config.workspaceMBOM.fieldIDs.ebom);      
                mbomPart.type      = mbomPart.details[config.workspaceMBOM.fieldIDs.type    ] || '';
                mbomPart.category  = mbomPart.details[config.workspaceMBOM.fieldIDs.category] || '';
                mbomPart.code      = mbomPart.details[config.workspaceMBOM.fieldIDs.code    ] || '';
                mbomPart.ebomRoot  = mbomPart.details[config.workspaceMBOM.fieldIDs.ebomRoot] || '';

                getMatchingEBOMPartProperties(mbomPart);

                mbomPart.hasChildren = getBOMPartHasChildren(mbomPart, mbomPartsList);
                mbomPart.isEBOMItem  = (getBOMPartFieldValue(mbomPart, config.workspaceMBOM.bomFieldIDs.isEBOMItem) == 'true');
                mbomPart.isProcess   = isMBOMProcess(mbomPart);
                mbomPart.isLeaf      = isMBOMLeaf(mbomPart);
                mbomPart.icon        = getBOMPartIcon(mbomPart);
                mbomPart.makeBuy     = getBOMPartFieldValue(mbomPart, config.workspaceMBOM.bomFieldIDs.makeOrBuy);

                if(mbomPart.isProcess) mbomPart.hasChildren = true;

                if(mbomPart.revision === 'WIP') mbomPart.revision = 'W';

            }

            editorResetSelection();
            initEditor();

        });
            
    });
        
}
function createMBOMRoot(ebomItemDetails, callback) {

    if(links.mbom !== '') {
        
        callback();
        
    } else {

        let number = null;

        if(!isBlank(config.workspaceMBOM.fieldIDs.number)) {
            if(!isBlank(config.suffixMBOMNumber)) {
                basePartNumber += config.suffixMBOMNumber + siteLabel;
                number = basePartNumber;
            }
        }

        createMBOMForEBOM(ebomItemDetails, number, config.mbomRoot.typeValue, function() {
            callback();
        });

    }

}
function createMBOMForEBOM(ebomItemDetails, number, type, callback) {

    let timestamp  = new Date();
    let syncDate   = timestamp.getFullYear() + '-' + (timestamp.getMonth()+1) + '-' + timestamp.getDate();

    let params = {
        wsId     : wsMBOM.wsId,
        sections : wsMBOM.sections,
        fields   : [{
            fieldId : config.workspaceMBOM.fieldIDs.ebom,
            value   : { link : ebomItemDetails.__self__ }
        },{
            fieldId : config.workspaceMBOM.fieldIDs.ebomRoot,
            value   : ebomItemDetails.root.link
        },{
            fieldId : config.workspaceMBOM.fieldIDs.lastMBOMSync,
            value   : syncDate
        },{
            fieldId : config.workspaceMBOM.fieldIDs.lastMBOMUser,
            value   : userAccount.displayName
        }]
    };

    if(!isBlank(type)) params.fields.push({
        fieldId : config.workspaceMBOM.fieldIDs.type, 
        value   : { link : type }
    })

    for(let fieldToCopy of config.mbomRoot.fieldsToCopy) {
        params.fields.push({
            fieldId : fieldToCopy.mbom,
            value   : getSectionFieldValue(ebomItemDetails.sections, fieldToCopy.ebom)
        });
    }

    if(!isBlank(number)) {
        params.fields.push({
            fieldId : config.workspaceMBOM.fieldIDs.number,
            value   : number
        });
    }

    $.post({
        url         : '/plm/create', 
        contentType : 'application/json',
        data        : JSON.stringify(params)
    }, function(response) {
        if(response.error) {
            showErrorMessage('Error', 'Error while creating MBOM root item, the editor cannot be used at this time. Please review your server configuration.');
        } else {
            links.mbom = response.data.split('.autodeskplm360.net')[1];
            storeMBOMLink(ebomItemDetails.__self__);
            storeContextMBOMLink()
            callback();
        }
    }); 
    
}
function storeMBOMLink(link) {

    let timestamp  = new Date();
    let lastSync   = timestamp.getFullYear() + '-' + (timestamp.getMonth()+1) + '-' + timestamp.getDate();

    let params   = { 
        link     : link, 
        sections : wsEBOM.sections,
        fields   : [
            { fieldId : config.workspaceEBOM.fieldIDs.mbom         + siteSuffix, value : { link : links.mbom } },
            { fieldId : config.workspaceEBOM.fieldIDs.lastMBOMSync + siteSuffix, value : lastSync },
            { fieldId : config.workspaceEBOM.fieldIDs.lastMBOMUser + siteSuffix, value : userAccount.displayName }
        ] 
    }

    $.post('/plm/edit', params, function() {});

}
function storeContextMBOMLink() {

    if(isBlank(links.context)) return;

    let requests = [
        $.get('/plm/details' , { link : links.context }),
        $.get('/plm/sections', { link : links.context })
    ]

    Promise.all(requests).then(function(responses) {

        let valueMBOM = getSectionFieldValue(responses[0].data.sections, urlParameters.contextfieldidmbom + siteSuffix, '', 'link');
        
        if(isBlank(valueMBOM)) {

            let params = { 
                link     : links.context, 
                sections : responses[1].data, 
                fields   : [{
                    fieldId : urlParameters.contextfieldidmbom + siteSuffix, 
                    value   : { link : links.mbom }
                }] 
            }

            $.post('/plm/edit', params, function() {});

        }

    });

}
function getMatchingEBOMPartProperties(mBOMPart) {

    for(let eBOMPart of ebomPartsList) {
        if(mBOMPart.root === eBOMPart.root) {
            mBOMPart.endItem      = eBOMPart.endItem;
            mBOMPart.matchesMBOM  = eBOMPart.matchesMBOM;
            mBOMPart.ignoreInMBOM = eBOMPart.ignoreInMBOM;
            mBOMPart.category     = eBOMPart.category;
            return;
        }
        if(!isBlank(mBOMPart.ebomRoot)) {
            if(mBOMPart.ebomRoot === eBOMPart.root) {
                mBOMPart.title = eBOMPart.title;
            }
        }
    }

    mBOMPart.endItem      = false;
    mBOMPart.matchesMBOM  = false;
    mBOMPart.ignoreInMBOM = false;
    mBOMPart.category     = '';

}
function initEditor() {
    
    $('#ebom').find('.processing').hide();
    $('#mbom').find('.processing').hide();

    insertEBOMNode($('#ebom-tree'), 0);
    insertMBOMNode($('#mbom-tree'), 0, false);

    if(config.displayOptions.tabOperations) {
        insertSourcing(links.mbom, paramsoperationsSourcing);
        insertGrid(links.mbom, paramsoperationsGrid );
    }

    $('#mbom-tree').find('.item-head').first().attr('id', 'mbom-root-head');
    $('#mbom-tree').find('.item').first().addClass('selected-target').addClass('process');
    
    $('#status-progress').remove();

    setTotalQuantities();
    setStatusBar();

    let elemMBOMRootBOM = $('#mbom-tree').find('.item-bom').first();
        elemMBOMRootBOM.attr('id', 'mbom-root-bom');
        elemMBOMRootBOM.sortable({

            delay       : 250,
            opacity     : 0.4,
            cursor      : 'move',
            cursorAt    : { left : 50, top : 15 },
            items       : '.item',
            placeholder : "sortable-placeholder",
            stop        : function(event, ui) {

                if(elemBOMDropped !== null) {
                    $(this).sortable('cancel');
                    ui.item.appendTo(elemBOMDropped);
                    elemBOMDropped = null;
                } else {
                    updateViewer();
                    moveItemInBOM(ui.item);
                }

                updateMBOMNumbers();
                selectAdjacentMBOMModels();

            }

        });

    $('.bar').show();
    
}
function moveItemInBOM(elemItem) {

    let link = elemItem.attr('data-link');
    
    elemItem.siblings('.item').each(function() {
        
        if($(this).attr('data-link') === link) {
            
            let elemInput   = $(this).find('input.item-qty-input');
            let qty         = Number(elemInput.val());
            let elemQtyAdd  = elemItem.find('input.item-qty-input');

            elemInput.val(qty + Number(elemQtyAdd.val()));
            elemItem.remove();

        }
        
    });

}
function editorResetSelection() {

    insertItemSummary(links.mbom, paramsSummary);

    if(config.displayOptions.tabOperations) {
        insertSourcing(links.mbom, paramsoperationsSourcing);
        insertGrid(links.mbom, paramsoperationsGrid );
    } 

}



// function insertBOMPartListNode(node, edge, level, linkEBOMRoot, icon, qty, bomType, isLeaf) {
// Insert new BOM Node with icon
function insertBOMPartListNode(bomType, index, node) {
    
    // if(isBlank(edge)) edge = { number : '' };

    if(isBlank(node)) node = (bomType === 'ebom') ? ebomPartsList[index] : mbomPartsList[index];

    if(isBlank(node.type    )) node.type     = '';
    if(isBlank(node.category)) node.category = '';

    let type          = node.type.replace(/ /g, '-').toLowerCase();
    let category      = node.category.replace(/ /g, '-').replace(/,/g, '-').toLowerCase();
    let labelType     = (isBlank(node.type)) ? 'No Type' : 'Type ' + node.type;
    let labelCategory = (isBlank(node.category)) ? 'No Category' : 'Category ' + node.category;

    let elemNode = $('<div></div>')
        .addClass('item')
        .addClass('level-' + node.level)
        .attr('category', category)
        .attr('data-code', node.code)
        // .attr('data-urn', node.urn)
        .attr('data-link', node.link)
        .attr('data-root', node.root)
        // .attr('data-ebom-root', linkEBOMRoot)
        .attr('data-make-buy', '')
        .attr('data-part-number', node.partNumber);
    
    if(category !== '') elemNode.addClass('category-' + category);
    if(type     !== '') elemNode.addClass('type-'     + type    );

    let elemNodeHead   = $('<div></div>').appendTo(elemNode).addClass('item-head');
    let elemNodeToggle = $('<div></div>').appendTo(elemNodeHead).addClass('item-toggle');
    
    $('<div></div>').appendTo(elemNodeHead)
        .addClass('item-icon')
        .addClass('icon')
        .addClass(node.icon)
        .attr('title', labelType + ' / ' + labelCategory);
        // .html('<span class="icon radio-unchecked">' + node.icon + '</span><span class="icon radio-checked">radio_button_checked</span>');
    
    if(config.displayOptions.bomColumnNumber) {
        $('<div></div>').appendTo(elemNodeHead).addClass('item-number').html(node.number);
    }

    let elemNodeTitle = $('<div></div>').appendTo(elemNodeHead)
        .addClass('item-title')
        .attr('title', node.title);
    
    $('<span></span>').appendTo(elemNodeTitle)
        .addClass('item-head-descriptor')
        .html( node.title.split('[REV')[0]);

    let elemNodeActions = $('<div></div>').appendTo(elemNodeTitle).addClass('item-head-actions');

    insertTileActions(elemNodeActions, bomType);

    if(config.displayOptions.bomColumnCode) {
        $('<div></div>').appendTo(elemNodeHead)
            .addClass('item-code')
            .html(node.code)
            .attr('title', 'Process Code');
    }

    $('<div></div>').appendTo(elemNodeHead)
        .addClass('item-revision')
        .html(node.revision);

    if(node.level === 0) {

        elemNode.addClass('root');
        $('<div></div>').appendTo(elemNodeHead).addClass('item-root-extension');

    } else {

        let elemNodeQty = $('<div></div>').appendTo(elemNodeHead)
            .addClass('item-qty');

        let elemQtyInput = $('<input></input>').appendTo(elemNodeQty)
            .attr('type', 'number')
            .attr('min', '0')
            .attr('step', '0.1')
            .attr('title', 'Quantity')
            .attr('placeholder', 'Qty')
            .addClass('item-qty-input');

        if(bomType === 'ebom')  elemQtyInput.attr('disabled', 'disabled'); else insertMBOMQtyInputControls(elemQtyInput);
        
        if(config.displayOptions.bomColumnMakeBuy) {

            let elemMakeBuy = $('<select></select>').appendTo(elemNodeHead)
                .addClass('button')
                .addClass('item-make-buy');

            $('<option></option>').appendTo(elemMakeBuy).html('');

            for(let option of picklistMakeBuy) {
                $('<option></option>').appendTo(elemMakeBuy)
                .attr('value', option.link)
                .html(option.title);
            }

            if(bomType === 'mbom') {

                if(!isBlank(node.makeBuy)) {
                    elemMakeBuy.val(node.makeBuy.link);
                    elemNode.attr('data-make-buy', node.makeBuy.link);
                }
                    
                elemMakeBuy.click(function(e) { e.preventDefault(); e.stopPropagation(); });

            } else {

                if(!isBlank(node.makeBuy)) {
                    elemMakeBuy.val(node.makeBuy.link);
                    elemNode.attr('data-make-buy', node.makeBuy.link);
                }

                elemMakeBuy.attr('disabled', 'disabled');

            }

        }
        
        $('<div></div>').appendTo(elemNodeHead)
            .addClass('item-head-status')
            .attr('title', 'EBOM / MBOM match indicator\r\n- Green : match\r\n- Red : missing in MBOM\r\n- Orange : quantity mismatch');
    
        if(node.quantity !== null) {
            elemQtyInput.val(Number(node.quantity));
            elemNodeHead.attr('data-qty', node.quantity);
            elemNodeTitle.attr('data-qty', node.quantity);
            elemNode.attr('data-qty', node.quantity);
        };

    } 

    if(bomType === 'ebom') {

        elemNode.addClass('is-ebom-item');

        elemNodeHead.click(function(e) {
            e.stopPropagation();
            e.preventDefault();
            selectBOMItem($(this), false);
        });

        if(node.isLeaf) {

            elemNode.addClass('leaf');
            if(!isBlank(node.mbom)) {
                elemNode.attr('data-mbom', node.mbom.link);
                addMBOMShortcut(elemNodeToggle);
            }

        } else {
            
            elemNode.addClass('item-has-bom');
            insertBOMPartsListNodeBOM(bomType, index, node, elemNode, elemNodeToggle);
            
        }

        insertEBOMActions(elemNodeHead, node.isLeaf);
        
    } else {

        insertMBOMSelectEvent(elemNode);

        if(!isBlank(node.ebomRoot)) elemNode.attr('data-ebom-root', node.ebomRoot);

        if(node.isProcess  ) elemNode.addClass('process');
        if(node.isLeaf     ) elemNode.addClass('leaf');
        if(node.isEBOMItem ) elemNode.addClass('is-ebom-item'); else elemNode.addClass('is-mbom-item');

        if(node.isLeaf) {

            if(!isBlank(node.ebom)) {
                elemNode.attr('data-ebom', node.ebom.link);
                addMBOMShortcut(elemNodeToggle);
            }
        
        } else {
            
            insertBOMPartsListNodeBOM(bomType, index, node, elemNode, elemNodeToggle);

            // if(level === 2)  {

                // elemNodeBOM.droppable({
                elemNodeHead.droppable({
                    
                    classes: {
                        'ui-droppable-hover': 'drop-hover'
                    },
                    drop : function(event, ui) {

                        let itemDragged      = ui.draggable;
                        let isAdditionalItem = itemDragged.hasClass('additional-item');
                        let link             = itemDragged.attr('data-link');
                        let isNew            = true;

                        elemBOMDropped = $(this).next();

                        elemBOMDropped.children('.item').each(function() {

                            if($(this).attr('data-link') === link) {
                                
                                isNew = false;
                                let elemInput = $(this).find('input.item-qty-input');
                                let qty = elemInput.val();
                                
                                if(isAdditionalItem)  {
                                    qty++;
                                } else  {
                                    let elemQtyAdd = itemDragged.find('input.item-qty-input');
                                    qty += elemQtyAdd.val();
                                    itemDragged.remove();
                                }

                                elemInput.val(qty);

                            }
                        });

                        if(isAdditionalItem) {

                            if(isNew) insertAdditionalItem($(this), itemDragged.attr('data-link'));
                    
                        }

                        updateMBOMNumbers();
                        selectAdjacentMBOMModels();

                    }
                });

        // }
            
            // if(node.level > 0) addBOMToggle(elemNodeToggle);

            elemNode.click(function(e) {
                e.stopPropagation();
                e.preventDefault();
                selectProcess($(this));
            });
            
        }
    }
    
    return elemNode;
    
}
function insertBOMPartsListNodeBOM(bomType, index, node, elemNode, elemNodeToggle) {

    let bomPartsList = (bomType === 'ebom') ? ebomPartsList : mbomPartsList;

    let elemNodeBOM = $('<div></div>').appendTo(elemNode)
        .addClass('item-bom')
        .addClass('no-scrollbar');
    
    if(node.hasChildren) {

        let nextLevel = node.level + 1;
        let nextIndex = index + 1;
        let edges     = [];

        while (nextIndex < bomPartsList.length) {
            if(bomPartsList[nextIndex].level < nextLevel) {
                break;
            } else if(bomPartsList[nextIndex].level === nextLevel) {
                edges.push(bomPartsList[nextIndex].edgeId);
                if(bomType === 'ebom') insertEBOMNode(elemNodeBOM, nextIndex); else insertMBOMNode(elemNodeBOM, nextIndex);
            }
            nextIndex++;
        }

        if(bomType === 'mbom') elemNode.attr('data-edges', edges.toString());

        if(node.level > 0) addBOMToggle(elemNodeToggle);
               
    }

    return elemNodeBOM;

}
function getBOMPartIcon(part) {

    if(part.bomType === 'mbom') {
        if( part.isProcess  ) return 'radio-process';
        if( part.level === 0) return 'radio-process';
        if(!part.isEBOMItem ) return 'icon-wrench';
    }

    switch(part.type) {
        case 'Mechanical'         : return 'icon-product';
        case 'Electrical'         : return 'icon-cpu'; 
        case 'Manufacturing'      : return 'icon-wrench'; 
        case 'Packaging'          : return 'icon-packaging'; 
        case 'Software'           : return 'icon-code'; 
        case 'Top Level Assembly' : return 'icon-package-alt'; 
    }

    return 'icon-product';

}
function getBOMPartFieldValue(node, fieldId) {

    for(let field of node.fields) {
        if(field.fieldId === fieldId) {
            return field.value;
        }
    }

    return null;

}
function getBOMPartHasChildren(node, bomPartsList) {

    if(node.hasChildren) {

        let level = node.level + 1;
        let index = bomPartsList.indexOf(node) + 1;

        while(index < bomPartsList.length) {

            if(bomPartsList[index].level > level) return false;

            if(bomPartsList[index].level === level) {
                let ignoreChild = (isBlank(bomPartsList[index].ignoreInMBOM)) ? false : bomPartsList[index].ignoreInMBOM;
                if(!ignoreChild) return true;
            }

            index++;

        }

    }

    return false;

}
function insertTileActions(elemActions, bomType) {

    $('<div></div>').appendTo(elemActions)
        .addClass('item-head-action')
        .addClass('icon')
        .addClass('icon-open')
        .addClass('button')
        .addClass('button-open')
        .attr('title', 'Click to open given item in PLM in a new browser tab')
        .click(function(e) {

            e.stopPropagation();
            e.preventDefault();
            
            let elemItem = $(this).closest('.item');
            let link     = elemItem.attr('data-link');
            
            if(link === '') {
                alert('Item does not exist in PLM yet. Save your changes to the database first.');
            } else {
                openItemByLink(link);
            }
            
        });

    $('<div></div>').appendTo(elemActions)
        .addClass('item-head-action')
        .addClass('icon')
        .addClass('icon-filter')
        .addClass('button')
        .addClass('button-filter')
        .attr('title', 'Click to toggle filter for this component in viewer, EBOM and MBOM')
        .click(function(e) {
            e.stopPropagation();
            e.preventDefault();
            selectBOMItem($(this), true);
        });

    if(bomType !== 'mbom') return;

    addActionIcon('visibility', elemActions)
        .attr('title', 'Only show components in viewer required until this step')
        .addClass('button-view')
        .addClass('item-head-action')
        .click(function(e) {

            e.stopPropagation();
            e.preventDefault();
            
            let elemClicked = $(this).closest('.item');
            let isSelected  = $(this).hasClass('selected');

            $('.button-view').removeClass('selected').removeClass('default');

            if(isSelected) {

                $('#mbom-root-bom').find('.item').removeClass('invisible');
                viewer.setGhosting(true);
                viewer.showAll();
                
            } else {   
                
                $(this).addClass('default').addClass('selected');
                $('#mbom-root-bom').find('.item').addClass('invisible');
                resetHiddenInstances();
                viewerHideInvisibleItems(elemClicked);

            }

        });

    addActionIcon('content_copy', elemActions)
        .attr('title', 'Copy this item to selected target')
        .addClass('button-copy')
        .addClass('item-head-action')
        .click(function(e) {
        
            e.stopPropagation();
            e.preventDefault();

            let item        = $(this).closest('.item');
            let itemName    = item.find('.item-head-descriptor').first().html();
            let itemQty     = item.find('.item-qty-input').val();
            let target      = $(this).closest('.selected-target');
            let targetName  = target.find('.item-head-descriptor').first().html();

            $('.to-move').removeClass('to-move');
            item.addClass('to-move');

            $('#move-item-name').html(itemName);
            $('#move-target-name').html(targetName);
            $('#dialog-copy').attr('item-qty', itemQty);
            $('#dialog-copy').show();
            $('#overlay').show();
            $('#copy-qty').val(itemQty);
            $('#copy-qty').select();

        });        

    addActionIcon('delete_forever', elemActions)
        .attr('title', 'Remove this component instance from MBOM')
        .addClass('button-remove')
        .addClass('item-head-action')
        .click(function(e) {

            e.stopPropagation();
            e.preventDefault();

            $(this).closest('.item').remove();
            restoreAssembly();
            setStatusBar();
            setStatusBarFilter();
            selectAdjacentMBOMModels();

        });

}



// Display EBOM information
function insertEBOMNode(elemParent, index) {

    if(index > ebomPartsList.length - 1) return;

    let node = ebomPartsList[index];

    if(!node.ignoreInMBOM) {
    
        insertBOMPartListNode('ebom', index).appendTo(elemParent);
            
        // if(node.xbom !== '') elemNode.attr('data-link-mbom', node.xbom);
        
    }
    
}
function isEBOMLeaf(node) {

    if( node.level  ===  0 ) return false;
    if( node.mbom   !== '' ) return true;
    if( node.endItem       ) return true;
    if( node.matchesMBOM   ) return true;
        
    return !node.hasChildren;
    
}
function insertEBOMActions(elemNodeHead, isLeaf) {

    let elemNodeActions = $('<div></div>').appendTo(elemNodeHead).addClass('item-actions');

    if(!isLeaf) {

        addActionIcon('playlist_add', elemNodeActions)
            .addClass('item-action-add-all')
            .attr('title', 'Add all subcomponents to MBOM')
            .click(function(e) {

                e.stopPropagation();
                e.preventDefault();

                let elemBOM = $(this).closest('.item-head').next();
                elemBOM.children().each(function() {
                    if(!$(this).hasClass('match')) {
                        $(this).find('.item-action-add:visible').click();
                    }
                }); 
            });

        addActionIcon('variable_add', elemNodeActions)
            .addClass('item-action-end-item')
            .attr('title', 'Set this to be an end item')
            .click(function(e) {

                e.stopPropagation();
                e.preventDefault();

                let elemItem = $(this).closest('.item');
                    elemItem.addClass('to-end');

                let itemName = elemItem.find('.item-head-descriptor').first().html();

                $('#end-item-name').html(itemName);
                $('#dialog-end-item').show();
                $('#overlay').show();

            });

        addActionIcon('add_link', elemNodeActions)
            .addClass('item-action-insert')
            .attr('title', 'Add this BOM as is to the MBOM and enable given flag on the item')
            .click(function(e) {
                
                e.stopPropagation();
                e.preventDefault();

                let elemItem = $(this).closest('.item');
                    elemItem.addClass('to-insert');

                let itemName = elemItem.find('.item-head-descriptor').first().html();

                $('#insert-item-name').html(itemName);
                $('#dialog-insert').show();
                $('#overlay').show();

            });

        addActionIcon('factory', elemNodeActions)
            .addClass('item-action-convert')
            .attr('title', 'Insert this EBOM as MBOM node to the MBOM')
            .click(function(e) {
                
                e.stopPropagation();
                e.preventDefault();

                let elemItem = $(this).closest('.item');
                    elemItem.addClass('to-convert');

                let itemName = elemItem.find('.item-head-descriptor').first().html();

                $('#convert-item-name').html(itemName);
                $('#dialog-convert').show();
                $('#overlay').show();

            });

    } else {
           
        addAction('Add', elemNodeActions)
            .addClass('item-action-add')
            .attr('title', 'Add this component with matching quantity to selected node in the MBOM')
            .click(function(e) {
                e.stopPropagation();
                e.preventDefault();
                insertFromEBOMToMBOM($(this));
                setStatusBar();
                setStatusBarFilter();
            });

        addAction('Qty', elemNodeActions)
            .addClass('item-action-update')
            .addClass('update-quantity')
            .addClass('with-icon')
            .addClass('icon-link-update')
            .attr('title', 'Update quantity in MBOM to match this EBOM value')
            .click(function(e) {
                e.stopPropagation();
                e.preventDefault();
                updateQuantityFromEBOMToMBOM($(this));
                setStatusBar();
                setStatusBarFilter();
            });
            
        addAction('Rev', elemNodeActions)
            .addClass('item-action-update')
            .addClass('update-revision')
            .addClass('with-icon')
            .addClass('icon-link-update')
            .attr('title', 'Update revision in MBOM to match this EBOM item')
            .click(function(e) {
                e.stopPropagation();
                e.preventDefault();
                updateRevisionFromEBOMToMBOM($(this));
                setStatusBar();
                setStatusBarFilter();
            });

    }

}
function getBOMNode(node, edge, level, linkEBOMRoot, icon, qty, bomType, isLeaf) {
    
    if(isBlank(edge)) edge = { number : '' };

    let category = node.category.replace(/ /g, '-').toLowerCase();
    let type     = node.type.replace(/ /g, '-').toLowerCase();

    let elemNode = $('<div></div>')
        .addClass('item')
        .addClass('level-' + level)
        .attr('category', category)
        .attr('data-code', node.code)
        .attr('data-urn', node.urn)
        .attr('data-link', node.link)
        .attr('data-root', node.root)
        .attr('data-ebom-root', linkEBOMRoot)
        .attr('data-make-buy', '')
        .attr('data-part-number', node.partNumber);
    
    let elemNodeHead   = $('<div></div>').appendTo(elemNode).addClass('item-head');
    let elemNodeToggle = $('<div></div>').appendTo(elemNodeHead).addClass('item-toggle');
    let elemNodeIcon   = $('<div></div>').appendTo(elemNodeHead).addClass('item-icon')
        .html('<span class="icon radio-unchecked">' + icon + '</span><span class="icon radio-checked">radio_button_checked</span>');
    
    if(config.displayOptions.bomColumnNumber) {
        $('<div></div>').appendTo(elemNodeHead).addClass('item-number').html(edge.number);
    }

    let elemNodeTitle = $('<div></div>').appendTo(elemNodeHead)
        .addClass('item-title')
        .attr('title', node.descriptor || descriptor);
    
    $('<span></span>').appendTo(elemNodeTitle)
        .addClass('item-head-descriptor')
        .html( node.descriptor || descriptor);

    let elemNodeActions = $('<div></div>').appendTo(elemNodeTitle).addClass('item-head-actions');

    $('<div></div>').appendTo(elemNodeActions)
        .addClass('item-head-action')
        .addClass('icon')
        .addClass('icon-open')
        .addClass('button')
        .addClass('button-open')
        .attr('title', 'Click to open given item in PLM in a new browser tab')
        .click(function(e) {

            e.stopPropagation();
            e.preventDefault();
            
            let elemItem = $(this).closest('.item');
            let link     = elemItem.attr('data-link');
            
            if(link === '') {
                alert('Item does not exist in PLM yet. Save your changes to the database first.');
            } else {
                openItemByLink(link);
            }
            
        });

    $('<div></div>').appendTo(elemNodeActions)
        .addClass('item-head-action')
        .addClass('icon')
        .addClass('icon-filter')
        .addClass('button')
        .addClass('button-filter')
        .attr('title', 'Click to toggle filter for this component in viewer, EBOM and MBOM')
        .click(function(e) {
            e.stopPropagation();
            e.preventDefault();
            selectBOMItem($(this), true);
        });

    if(config.displayOptions.bomColumnCode) {
        $('<div></div>').appendTo(elemNodeHead)
            .addClass('item-code')
            .html(node.code)
            .attr('title', 'Process Code');
    }

    $('<div></div>').appendTo(elemNodeHead)
        .addClass('item-revision')
        .html(node.revision);

    if(level === 1) {

        $('<div></div>').appendTo(elemNodeHead).addClass('item-root-extension');

    } else {

        let elemNodeQty = $('<div></div>').appendTo(elemNodeHead)
            .addClass('item-qty');
        
        let elemQtyInput = $('<input></input>').appendTo(elemNodeQty)
            .attr('type', 'number')
            .attr('title', 'Quantity')
            .attr('placeholder', 'Qty')
            .addClass('item-qty-input');

        if(bomType === 'ebom')  elemQtyInput.attr('disabled', 'disabled'); else insertMBOMQtyInputControls(elemQtyInput);
        
        if(config.displayOptions.bomColumnMakeBuy) {

            let elemMakeBuy = $('<select></select>').appendTo(elemNodeHead)
                .addClass('button')
                .addClass('item-make-buy');

            $('<option></option>').appendTo(elemMakeBuy).html('');

            for(let option of picklistMakeBuy) {
                $('<option></option>').appendTo(elemMakeBuy)
                .attr('value', option.link)
                .html(option.title);
            }

            if(bomType === 'mbom') {

                if(!isBlank(edge.makeBuy)) {
                    elemMakeBuy.val(edge.makeBuy.link);
                    elemNode.attr('data-make-buy', edge.makeBuy.link);
                }

                elemMakeBuy.click(function(e) { e.preventDefault(); e.stopPropagation(); });

            } else {

                if(!isBlank(node.makeBuy)) {
                    elemMakeBuy.val(node.makeBuy.link);
                    elemNode.attr('data-make-buy', node.makeBuy.link);
                }

                elemMakeBuy.attr('disabled', 'disabled');

            }

        }
        
        
        $('<div></div>').appendTo(elemNodeHead)
            .addClass('item-head-status')
            .attr('title', 'EBOM / MBOM match indicator\r\n- Green : match\r\n- Red : missing in MBOM\r\n- Orange : quantity mismatch');
    

        if(qty !== null) {
            elemQtyInput.val(qty);
            elemNodeHead.attr('data-qty', qty);
            elemNodeTitle.attr('data-qty', qty);
            elemNode.attr('data-qty', qty);
        };


    } 
    
    if(category !== '') elemNode.addClass('category-' + category);
    if(type     !== '') elemNode.addClass('type-' + type);
    
    if(bomType === 'ebom') {

        elemNode.addClass('is-ebom-item');
        elemNodeIcon.attr('title', 'EBOM item');

        elemNodeTitle.click(function(e) {
            e.stopPropagation();
            e.preventDefault();
            selectBOMItem($(this), false);
        });

        if(!isLeaf) {
            
            elemNode.addClass('item-has-bom');
        
            let elemNodeBOM = $('<div></div>').appendTo(elemNode)
                .addClass('item-bom')
                .addClass('no-scrollbar');
    
            for(let edgeEBOM of eBOM.edges) {
                if(edgeEBOM.depth === level) {
                    if(edgeEBOM.parent === node.urn) { 
                        let childQty = Number(getEdgeProperty(edgeEBOM, wsEBOM.viewFields, 'QUANTITY', '0.0'));
                        setEBOM(elemNodeBOM, edgeEBOM.child, level + 1, childQty, node.urn);
                    }
                }
            }

            if(level > 1) addBOMToggle(elemNodeToggle);
            
        } else {

            if(node.xbom !== '') addMBOMShortcut(elemNodeToggle);
            
        }

        insertEBOMActions(elemNodeHead, isLeaf);
        
    } else {
                
        insertMBOMSelectEvent(elemNode);
        
        insertMBOMActions(elemNodeActions);
        
        if(node.xbom !== '') addMBOMShortcut(elemNodeToggle);

        if(isLeaf) {
            
            $('#ebom').find('.item').each(function() {
            
                var urnEBOM = $(this).attr('data-urn');
                var catEBOM = $(this).attr('category');
                if(urnEBOM === node.urn) {
                    if(typeof urnEBOM !== 'undefined') {
                        elemNode.addClass(catEBOM);
                    }
                }
            
            });
        
        } else {
            
            $('<div></div>').appendTo(elemNode)
                .addClass('item-bom')
                .addClass('no-scrollbar');

            // if(level === 2)  {

                // elemNodeBOM.droppable({
                elemNodeHead.droppable({
                    
                    classes: {
                        'ui-droppable-hover': 'drop-hover'
                    },
                    drop : function(event, ui) {

                        let itemDragged      = ui.draggable;
                        let isAdditionalItem = itemDragged.hasClass('additional-item');
                        let link             = itemDragged.attr('data-link');
                        let isNew            = true;

                        elemBOMDropped = $(this).next();

                        elemBOMDropped.children('.item').each(function() {

                            if($(this).attr('data-link') === link) {
                                
                                isNew = false;
                                let elemInput = $(this).find('input.item-qty-input');
                                let qty = elemInput.val();
                                
                                if(isAdditionalItem)  {
                                    qty++;
                                } else  {
                                    let elemQtyAdd = itemDragged.find('input.item-qty-input');
                                    qty += elemQtyAdd.val();
                                    itemDragged.remove();
                                }

                                elemInput.val(qty);

                            }
                        });

                        if(isAdditionalItem) {

                            if(isNew) insertAdditionalItem($(this), itemDragged.attr('data-link'));
                    
                        }

                        updateMBOMNumbers();
                        selectAdjacentMBOMModels();

                    }
                });

        // }
            
            if(level > 1) addBOMToggle(elemNodeToggle);

            elemNode.click(function(e) {
                e.stopPropagation();
                e.preventDefault();
                selectProcess($(this));
            });
            
        }
    }
    
    return elemNode;
    
}
// function getEdgeProperty(edge, cols, fieldId, defValue) {
    
//     let id = getViewFieldId(cols, fieldId);
    
//     for(let field of edge.fields) {
        
//         let fieldIdBOM  = Number(field.metaData.link.split('/')[10]);
//         if(fieldIdBOM === id) return field.value;
//     }
    
//     return defValue;
    
// }
// function getNodeProperty(list, urn, cols, fieldId, defValue) {

//     let id = getViewFieldId(cols, fieldId);

//     if(id === '') return defValue;
    
//     for(let node of list.nodes) {
        
//         if(node.item.urn === urn) {

//             for(let field of node.fields) {

//                 let fieldId = Number(field.metaData.link.split('/')[10]);
                
//                 if(id === fieldId) {
//                     if(typeof field.value === 'object') {
//                         return field.value.title;
//                     } else {
//                         return field.value;    
//                     }
//                 }
                
//             }
            
//             return defValue;
            
//         }
        
//     }
    
//     return defValue;
    
// }
// function getNodeLink(list, urn, cols, fieldId, defValue) {

//     let id = getViewFieldId(cols, fieldId);
  
//     if(id === '') return defValue;
    
//     for(let node of list.nodes) {
        
//         if(node.item.urn === urn) {
            
//             for(let field of node.fields) {
                
//                 let fieldId = Number(field.metaData.link.split('/')[10]);
                
//                 if(id === fieldId) {

//                     return field.value.link;

//                     // if(typeof field.value === 'object') {
//                     //     return field.value.urn;
//                     // } else {
//                     //     return field.value;    
//                     // }
//                 }
                
//             }
            
//             return defValue;
            
//         }
        
//     }
    
//     return defValue;
    
// }
// function getViewFieldId(cols, fieldId) {
    
//     for(let col of cols) {
//         if(col.fieldId === fieldId) return col.viewDefFieldId;
//     }
    
//     return '';
    
// }
function insertFromEBOMToMBOM(elemAction) {
    
    let elemItem    = elemAction.closest('.item');
    let code        = elemItem.attr('data-code');
    // let category    = elemItem.attr('category');
    let elemTarget  = $('#mbom').find('.root');
    let operationMatch = false;
    
    if(code !== '') {
        if($('.operation').length > 0) {
            
            $('.operation').each(function() {
                if(!operationMatch) {
                    let operationCode = $(this).attr('data-code');
                    if(operationCode === code) {
                        operationMatch = true;
                        elemTarget = $(this); 
                    }
                };
            });
            
        }
    }

    if(!operationMatch) {
        elemTarget = $('.selected-target');
    }
    
    if(elemTarget !== null) {   

        let elemTargetBOM = elemTarget.find('.item-bom').first();
        let srcPartNumber = elemItem.attr('data-part-number');
        let existsInBOM   = false;

        elemTargetBOM.children('.item').each(function() {
            
            let tgtPartNumber = $(this).attr('data-part-number');
            
            if(srcPartNumber === tgtPartNumber) {
                
                existsInBOM = true;
                let srcQty  = Number(elemItem.attr('data-instance-qty'));
                let elemQty = $(this).find('.item-qty-input').first();
                let tgtQty  = Number(elemQty.val()) + srcQty;
                
                elemQty.val(tgtQty);

            }
            
        });

        if(!existsInBOM) {

            let clone = elemItem.clone(true, true);
                
            if(disassembleMode) {
                clone.prependTo(elemTarget.find('.item-bom').first());
            } else {
                clone.appendTo(elemTarget.find('.item-bom').first());
            }
            clone.click(function(e) {});

            if(!isBlank(clone.attr('data-mbom'))) {
                clone.attr('data-ebom-root', clone.attr('data-root'));
                clone.attr('data-ebom', clone.attr('data-link'));
                clone.attr('data-link', clone.attr('data-mbom'));
            } 
            
            let elemQtyInput = clone.find('.item-qty-input');
                elemQtyInput.removeAttr('disabled');
                elemQtyInput.keyup(function (e) {
                    $(this).closest('.item').attr('data-instance-qty', $(this).val());
                    setStatusBar();
                    setBOMTotalQuantities($(this).closest('.item').attr('data-root'));
                });
                elemQtyInput.click(function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    $(this).select();
                });

            let elemActions = clone.find('.item-actions');
                elemActions.remove();

            let elemMakeBuy = clone.find('.item-make-buy');
                elemMakeBuy.val(clone.attr('data-make-buy'));
                elemMakeBuy.removeAttr('disabled');
                elemMakeBuy.click(function(e) { e.preventDefault(); e.stopPropagation(); });

            let elemItemHeadActions = clone.find('.item-head-actions');
                elemItemHeadActions.children().remove();

            insertTileActions(elemItemHeadActions, 'mbom');

            if(!disassembleMode) {
                if(elemTarget.hasClass('selected')) {
                    let elemBOM = elemTarget.find('.item-bom').first(); 
                    selectProcessPartsInViewer(elemBOM);             
                }
            }

        }

    }
    

}
function updateQuantityFromEBOMToMBOM(elemAction) {
    
    let elemItem = elemAction.closest('.item');
    let root     = elemItem.attr('data-root');
    let qty      = elemItem.attr('data-instance-qty');
    
    let listMBOM = $('#mbom').find('[data-root="' + root + '"]');
    
    if(listMBOM.length === 1) {
        listMBOM.find('.item-qty-input').val(qty);
        if(elemItem.hasClass('selected')) setBOMTotalQuantities(elemItem.attr('data-root'));
    }
    
}
function updateRevisionFromEBOMToMBOM(elemAction) {
    
    let elemItem = elemAction.closest('.item');
    let root     = elemItem.attr('data-root');
    let link     = elemItem.attr('data-link');
    let revision = elemItem.find('.item-revision').html();
    let listMBOM = $('#mbom').find('[data-root="' + root + '"]');

    listMBOM.each(function() {
        let elemMBOM = $(this);
        elemMBOM.attr('data-link-db', elemMBOM.attr('data-link'));
        elemMBOM.attr('data-link', link);
        elemMBOM.find('.item-revision').html(revision);
    });
    
}
function setEBOMEndItem() {

    $('#dialog-end-item').hide();

    let elemItem = $('.item.to-end');

    if(elemItem.length > 0) {

        let params = {
            link     : elemItem.attr('data-link'),
            sections : wsEBOM.sections,
            fields   : [
                { fieldId : config.workspaceEBOM.fieldIDs.endItem, value : true }
            ]
        };

        $.post('/plm/edit', params, function(response) {
        
            if(response.error) {

                showErrorMessage('Error', 'Error while updating End Item flag of item ' + params.link);

            } else {

                let elemItem        = $('.item.to-end');
                let elemItemHead    = elemItem.children('.item-head');
                let elemItemToggle  = elemItemHead.children('.item-toggle');
                let elemItemActions = elemItemHead.children('.item-actions');
        
                elemItem.addClass('leaf');
                elemItem.children('.item-bom').remove();
                elemItem.removeClass('item-has-bom');
                elemItemToggle.removeClass('icon').removeClass('icon-expand').removeClass('icon-collapse');
                elemItemActions.children().remove();

                setTotalQuantities();
                setStatusBar();

                let elemActionAdd = addAction('Add', elemItemActions);
                    elemActionAdd.addClass('item-action-add');
                    elemActionAdd.attr('title', 'Add this component with matching quantity to MBOM on right hand side');
                    elemActionAdd.click(function() {
                        insertFromEBOMToMBOM($(this));
                        setStatusBar();
                        setStatusBarFilter();
                    });
        
                elemActionAdd.click();
        
                $('#overlay').hide();
                $('.item').removeClass('to-insert');

            }

        }); 

    }

}
function insertEBOMtoMBOM() {

    $('#dialog-insert').hide();

    let elemItem = $('.item.to-insert');

    if(elemItem.length > 0) {

        let params = {
            link     : elemItem.attr('data-link'),
            sections : wsEBOM.sections,
            fields   : [
                { fieldId : config.workspaceEBOM.fieldIDs.matchesMBOM, value : true }
            ]
        };

        $.post('/plm/edit', params, function(response) {
        
            if(response.error) {

                showErrorMessage('Error', 'Error while updating item with Matches MBOM flag');

            } else {

                let elemItem        = $('.item.to-insert');
                let elemItemHead    = elemItem.children('.item-head');
                let elemItemToggle  = elemItemHead.children('.item-toggle');
                let elemItemActions = elemItemHead.children('.item-actions');
        
                elemItem.addClass('leaf');
                elemItem.children('.item-bom').remove();
                elemItem.removeClass('item-has-bom');
                elemItemToggle.removeClass('icon').removeClass('icon-expand').removeClass('icon-collapse');
                elemItemActions.children().remove();

                setTotalQuantities();
                // setStatusBar();

                let elemActionAdd = addAction('Add', elemItemActions);
                    elemActionAdd.addClass('item-action-add');
                    elemActionAdd.attr('title', 'Add this component with matching quantity to MBOM on right hand side');
                    elemActionAdd.click(function() {
                        insertFromEBOMToMBOM($(this));
                        setStatusBar();
                        setStatusBarFilter();
                    });
        
                elemActionAdd.click();
        
                $('#overlay').hide();
                $('.item').removeClass('to-insert');

            }

        }); 

    }

}
function convertEBOMtoMBOM() {

    $('#dialog-convert').hide();

    let elemItem = $('.item.to-convert');
    let link     = elemItem.attr('data-link');
    let root     = elemItem.attr('data-root');

    if(elemItem.length > 0) {

        let requests = [
            $.get('/plm/details', { link : link }),
            // $.get('/plm/bom'    , { link : link, 'depth' : 1, 'viewId' : wsEBOM.viewId})
        ];

        Promise.all(requests).then(function(responses) {

            let partNumber = '';

            if(!isBlank(config.workspaceMBOM.fieldIDs.number)) {
                if(!isBlank(config.suffixMBOMNumber)) {
                    partNumber  = getSectionFieldValue(responses[0].data.sections, config.workspaceEBOM.fieldIDs.number, '', null);
                    partNumber += config.suffixMBOMNumber + siteLabel
                }
            }

            createMBOMRoot(responses[0].data, partNumber, function(linkMBOM) {

                elemItem.attr('data-link-mbom', linkMBOM);
                    
                    // storeMBOMLink(link, linkNew);


                let elemItem        = $('.item.to-convert');
                let elemItemHead    = elemItem.children('.item-head');
                let elemItemToggle  = elemItemHead.children('.item-toggle');
                let elemItemActions = elemItemHead.children('.item-actions');

                elemItem.addClass('leaf');
                elemItem.children('.item-bom').remove();
                elemItem.removeClass('item-has-bom');
                elemItemToggle.removeClass('icon').removeClass('icon-expand').removeClass('icon-collapse');
                elemItemActions.children().remove();

                setTotalQuantities();
                // setStatusBar();

                addMBOMShortcut(elemItemToggle);

                let elemActionAdd = addAction('Add', elemItemActions);
                    elemActionAdd.addClass('item-action-add');
                    elemActionAdd.attr('title', 'Add this component with matching quantity to MBOM on right hand side');
                    elemActionAdd.click(function() {
                        insertFromEBOMToMBOM($(this));
                        setStatusBar();
                        setStatusBarFilter();
                    });

                elemActionAdd.click();

                $('#overlay').hide();
                $('.item').removeClass('to-convert');


            });


            // let params = {
            //     wsId      : wsMBOM.wsId,
            //     sections  : wsMBOM.sections,
            //     fields    : [
            //         { fieldId : config.workspaceMBOM.fieldIDs.ebom, value : { link : link } }
            //     ]
            // };

            // addFieldToPayload(params.sections, wsMBOM.sections, null, config.fieldIdEBOM, { 'link' : link } );

            // for(let fieldToCopy of config.mbomRootFieldsToCopy) {
            //     let value = getSectionFieldValue(responses[0].data.sections, fieldToCopy.ebom, '', 'object');
            //     params.fields.push({ fieldId : fieldToCopy.mbom, value : value });
            //     // addFieldToPayload(params.sections, wsMBOM.sections, null, fieldToCopy.mbom, value);
            // }

            
            // if(!isBlank(config.workspaceMBOM.fieldIDs.number)) {
            //     if(!isBlank(config.suffixMBOMNumber)) {
            //         let partNumber  = getSectionFieldValue(responses[0].data.sections, config.workspaceEBOM.fieldIDs.number, '', null);
            //             partNumber += config.suffixMBOMNumber + siteLabel
            //         params.fields.push({ fieldId : config.workspaceMBOM.fieldIDs.number, value : partNumber });
            //         // addFieldToPayload(params.sections, wsMBOM.sections, null, config.fieldIdNumber, partNumber);
            //     }
            // }

            // for(let newDefault of config.newProcessDefaults) {
            //     addFieldToPayload(params.sections, wsMBOM.sections, null, newDefault[0], newDefault[1]);
            // }

            // $.post({
            //     url         : '/plm/create', 
            //     contentType : 'application/json',
            //     data        : JSON.stringify(params)
            // }, function(response) {
            //     if(response.error) {
            //         showErrorMessage('Error', 'Error while creating matching MBOM item, please review your server configuration and logs');
            //     } else {

                    // let linkNew     = response.data.split('.autodeskplm360.net')[1];
                    // let wsIdParent  = linkNew.split('/')[4]
                    // let dmsIdParent = linkNew.split('/')[6];

                    // elemItem.attr('data-link-mbom', linkNew);
                    
                    // storeMBOMLink(link, linkNew);


                    // let elemItem        = $('.item.to-convert');
                    // let elemItemHead    = elemItem.children('.item-head');
                    // let elemItemToggle  = elemItemHead.children('.item-toggle');
                    // let elemItemActions = elemItemHead.children('.item-actions');

                    // elemItem.addClass('leaf');
                    // elemItem.children('.item-bom').remove();
                    // elemItem.removeClass('item-has-bom');
                    // elemItemToggle.removeClass('icon').removeClass('icon-expand').removeClass('icon-collapse');
                    // elemItemActions.children().remove();

                    // setTotalQuantities();
                    // // setStatusBar();

                    // addMBOMShortcut(elemItemToggle);

                    // let elemActionAdd = addAction('Add', elemItemActions);
                    //     elemActionAdd.addClass('item-action-add');
                    //     elemActionAdd.attr('title', 'Add this component with matching quantity to MBOM on right hand side');
                    //     elemActionAdd.click(function() {
                    //         insertFromEBOMToMBOM($(this));
                    //         setStatusBar();
                    //         setStatusBarFilter();
                    //     });

                    // elemActionAdd.click();

                    // $('#overlay').hide();
                    // $('.item').removeClass('to-convert');

                    // copyBOM(wsIdParent, dmsIdParent, root, responses[1].data);

        //         }

        //     }); 

        });

    }

}
// function copyBOM(wsIdParent, dmsIdParent, linkEBOMRoot, bom) {

//     if(bom.edges.length === 0) {

//         let elemItem        = $('.item.to-convert');
//         let elemItemHead    = elemItem.children('.item-head');
//         let elemItemToggle  = elemItemHead.children('.item-toggle');
//         let elemItemActions = elemItemHead.children('.item-actions');

//         elemItem.children('.item-bom').remove();
//         elemItem.removeClass('item-has-bom');
//         elemItemToggle.children().remove();
//         elemItemActions.children().remove();

//         setTotalQuantities();
//         addMBOMShortcut(elemItemToggle);

//         let elemActionAdd = addAction('Add', elemItemActions);
//             elemActionAdd.addClass('item-action-add');
//             elemActionAdd.attr('title', 'Add this component with matching quantity to MBOM on right hand side');
//             elemActionAdd.click(function() {
//                 insertFromEBOMToMBOM($(this));
//                 setStatusBar();
//                 setStatusBarFilter();
//             });

//         elemActionAdd.click();

//         $('#overlay').hide();
//         $('.item').removeClass('to-convert');

//     } else {
        
        
//         let requests = [];

//         for(let edge of bom.edges) {


//             if(requests.length < maxRequests) {

//                 let params = {
//                     'wsIdParent'    : wsIdParent,
//                     'dmsIdParent'   : dmsIdParent,
//                     'wsIdChild'     : edge.child.split('.')[4],
//                     'dmsIdChild'    : edge.child.split('.')[5],
//                     'quantity'      : Number(getEdgeProperty(edge, wsEBOM.viewFields, 'QUANTITY', '0.0')),
//                     'pinned'        : config.pinEBOMItemsInMBOM,
//                     'number'        : edge.itemNumber,
//                     'fields'        : [
//                         { 'link' : linkFieldEBOMItem,     'value' : true         },
//                         { 'link' : linkFieldEBOMRootItem, 'value' : linkEBOMRoot }
//                     ]
//                 }
                
//                 let childMBOMLink = getNodeLink(bom, edge.child, wsEBOM.viewFields, config.fieldIdMBOM + siteSuffix, '');

//                 if(childMBOMLink !== '') {
//                     params.wsIdChild  = childMBOMLink.split('/')[4];
//                     params.dmsIdChild = childMBOMLink.split('/')[6];
//                 }

//                 requests.push($.post('/plm/bom-add', params));

//             }

//         }

//         Promise.all(requests).then(function(responess) {
//             bom.edges.splice(0, maxRequests);
//             copyBOM(wsIdParent, dmsIdParent, linkEBOMRoot, bom);
//         });

//     }

// }





// Display MBOM information
function insertMBOMNode(elemParent, index, additionalItem) {

    if(index > mbomPartsList.length - 1) return;

    if(isBlank(additionalItem)) additionalItem = false;

    let node = mbomPartsList[index];

    if(additionalItem) { node.isProcess = true; node.isLeaf = false;} 

    insertBOMPartListNode('mbom', index).appendTo(elemParent)
        .attr('data-edge', node.edgeId || '')
        .attr('data-number-db', node.number);
            
}
function setMBOM(elemParent, urn, level, qty, urnParent, additionalItem) {

    if(isBlank(additionalItem)) additionalItem = false;   

    if(node.xbom !== '') {

        elemNode.attr('data-link-ebom', node.xbom);
        elemNode.attr('data-link-mbom', node.link);
        
        $('#ebom').find('.leaf').each(function() {
            
            let link = $(this).attr('data-link');
            
            if(link === node.xbom) {
                
                let titleEBOM   = $(this).find('.item-title').first().html();
                let codeEBOM    = $(this).find('.item-code').first().html();
                let classNames  = $(this).attr('class').split(' ');

                for(let className of classNames) {

                    if(className.indexOf('category-') === 0) elemNode.addClass(className);

                }
                
                elemNode.find('.item-title').first().html(titleEBOM);
                elemNode.find('.item-code').first().html(codeEBOM);
                elemNode.removeClass('mbom-item');
                
            }
            
        });
        
    }
    
    // if(level === 1) {
    //     elemNode.addClass('root');
    // } else if(node.isProcess) {
    //     if(level === 2) {
    //         elemNode.addClass('operation');
    //     }
    // }
    
    // if(isLeaf) {

    //     elemNode.addClass('leaf');

    // } else {
        
    //     let elemNodeBOM = elemNode.find('.item-bom').first();
        
    //     for(let edgeMBOM of mBOM.edges) {
    //         if(edgeMBOM.depth === level) {
    //             if(edgeMBOM.parent === urn) {
    //                 edges.push(edgeMBOM.edgeId);
    //                 let childQty = Number(getEdgeProperty(edgeMBOM, wsMBOM.viewFields, 'QUANTITY', '0.0'))
    //                 setMBOM(elemNodeBOM, edgeMBOM.child, level + 1, childQty, urn);
    //             }
    //         }
    //     }
        
    //     elemNode.attr('data-edges', edges.toString());
        
    // }
    
    return elemNode;
    
}
function isMBOMProcess(node) {

    if( node.isEBOMItem   ) return false;
    if(!isBlank(node.ebom)) return false;

    return (node.details.IS_PROCESS === 'true');

}
function isMBOMLeaf(node) {
    
    if( node.level  === 0 ) return false;    
    if( node.level  === 2 ) return true;
    if( node.endItem      ) return true;
    if( node.matchesMBOM  ) return true;
    if( !(isBlank(node.ebom)) ) return true;
    if( node.isProcess    ) return false;
    
    return !node.hasChildren;
    
}
function addAction(label, elemParent) {
    
    let elemAction = $('<div></div>').appendTo(elemParent)
        .addClass('button')
        .addClass('item-action')
        .html(label);
    
    return elemAction;

}
function addActionIcon(icon, elemParent) {
    
    let elemAction = $('<div></div>').appendTo(elemParent)
        .addClass('button')
        .addClass('item-action')
        .addClass('icon')
        .html(icon);
    
    return elemAction;

}
function insertMBOMSelectEvent(elemItem) {

    elemItem.click(function(e) {
        e.stopPropagation();
        e.preventDefault();
        selectBOMItem($(this), false);
        if(config.displayOptions.tabOperations) {
            insertSourcing(elemItem.attr('data-link'), paramsoperationsSourcing);
            insertGrid(elemItem.attr('data-link') , paramsoperationsGrid );
        }
    });

}
function insertMBOMQtyInputControls(elemQtyInput) {

    elemQtyInput.click(function(e) {
        e.stopPropagation();
        e.preventDefault();
        $(this).select();
        setBOMTotalQuantities($(this).closest('.item').attr('data-root'));
    });

    elemQtyInput.on("change paste keyup", function(e) {
        let elemItem = $(this).closest('.item');
        elemItem.attr('data-instance-qty', $(this).val());
        if(elemItem.hasClass('is-mbom-item')) {
            $('body').removeClass('with-quantity-comparison');
        } else {
            setBOMTotalQuantities($(this).closest('.item').attr('data-root'));
        }
        setStatusBar();
    });

    elemQtyInput.attr('title', 'Set quantity of this component');

}



// Toggles to expand / collapse BOMs
function addBOMToggle(elemParent) {

    elemParent.addClass('icon').addClass('icon-collapse');

    elemParent.click(function(e) {
            
        e.preventDefault();
        e.stopPropagation();

        let elemToggle = $(this);
        let selector   = elemToggle.hasClass('icon-collapse') ? '.icon-collapse' : '.icon-expand';

        elemToggle.toggleClass('icon-collapse').toggleClass('icon-expand');
        elemToggle.closest('.item').find('.item-bom').toggleClass('hidden');        

        if(e.shiftKey) { 
            let elemParentBOM = $(this).closest('.item-bom');
            elemParentBOM.find(selector).click();
        }
        
    });
    
}



// Add Shortcut to open related MBOM
function addMBOMShortcut(elemParent) {
    
     $('<div></div>').appendTo(elemParent)
        .addClass('icon')
        .addClass('mbom-shortcut')
        .addClass('icon-factory')
        .attr('title', 'This item has MBOM defined, click to open the given editor')
        .click(function(e) {

            e.preventDefault();
            e.stopPropagation();

            let elemItem = $(this).closest('.item');
            let linkMBOM = elemItem.attr('data-mbom') || elemItem.attr('data-link');

            let url = '/mbom'
                + '?wsId='    + linkMBOM.split('/')[4]
                + '&dmsId='   + linkMBOM.split('/')[6]
                + '&theme='   + theme
                + '&options=' + options;
                        
            window.open(url);

        });
    
}



// Calculate total quantities
function setTotalQuantities() {

    let roots = [];
    let qtys  = [];

    $('#ebom').find('.item-qty-input').each(function() {

        let elemQtyInput = $(this);

        if(elemQtyInput.parent().parent().siblings().length === 0) {
            
            let totalQuantity   = Number(elemQtyInput.val());
            let elemItem        = elemQtyInput.closest('.item');
            let root            = elemItem.attr('data-root');

            elemQtyInput.parents('.item-has-bom').each(function() {
                if(this.hasAttribute('data-qty')) {
                    totalQuantity = totalQuantity * Number($(this).attr('data-qty'));
                }
            })

            elemItem.attr('data-instance-qty', totalQuantity);
            elemQtyInput.val(totalQuantity);

            if(roots.indexOf(root) === -1) {
                roots.push(root);
                qtys.push(totalQuantity);
            } else {
                qtys[roots.indexOf(root)] += totalQuantity;
            }

        }
    });

    $('#ebom').find('.item-qty-input').each(function() {
    
        let elemItem = $(this).closest('.item');
        let root     = elemItem.attr('data-root');

        elemItem.attr('data-total-qty', qtys[roots.indexOf(root)]);

    });

}



// Enable item filtering & preview
function selectProcess(elemClicked) {

    $('body').removeClass('with-quantity-comparison');

    let isSelected = elemClicked.hasClass('selected');

    $('.item').removeClass('selected');
    $('.selected-target').removeClass('selected-target');

    if(!isSelected) {

        editorResetSelection()
        viewerResetSelection();

    } else {

        let itemLink = elemClicked.attr('data-link');

        if(!isBlank(itemLink)) {

            insertItemSummary(itemLink, paramsSummary);

            if(config.displayOptions.tabOperations) {
                insertSourcing(itemLink, paramsoperationsSourcing);
                insertGrid(itemLink, paramsoperationsGrid );
            }    

        }        

        elemClicked.addClass('selected-target');
        elemClicked.addClass('selected');

        let elemBOM = elemClicked.children('.item-bom');
        selectProcessPartsInViewer(elemBOM);

    }

}
function selectProcessPartsInViewer(elemBOM) {

    let partNumbers = [];

    elemBOM.find('.item').each(function() {
        let partNumber = $(this).attr('data-part-number');
        if(!isBlank(partNumber)) {
            if(!partNumbers.includes(partNumber)) partNumbers.push(partNumber);
        }
        viewerSelectModels(partNumbers);
    });

}
function selectBOMItem(elemClicked, filter) {

    let elemItem = elemClicked.closest('.item');

    $('.adjacent-prev').removeClass('adjacent-prev');
    $('.current-mbom ').removeClass('current-mbom ');
    $('.adjacent-next').removeClass('adjacent-next');    

    let elemFiltered = $('.filter').first();
    let pnFiltered   = (elemFiltered.length > 0) ? elemFiltered.attr('data-part-number') : '';
    let partNUmber   = elemItem.attr('data-part-number');

    if(filter) {
        // if(elemItem.hasClass('filter')) deselectItem(elemClicked);
        if(partNUmber === pnFiltered) deselectItem(elemClicked);
        else selectItem(elemItem, filter);
    } else {
        if(elemItem.hasClass('selected')) deselectItem(elemClicked);
        else selectItem(elemItem, filter);
    }

}
function selectItem(elemItem, filter) {   

    let link        = elemItem.attr('data-link');
    let root        = elemItem.attr('data-ebom-root') || elemItem.attr('data-root');
    let isSelected  = elemItem.hasClass('selected');
    let partNumber  = elemItem.attr('data-part-number') || '';

    $('.item').removeClass('selected');

    // if(elemItem.hasClass('leaf')) {

        setStatusBar();

        if(filter) {
            $('.leaf').hide();
            $('.item-has-bom').hide();
            $('.item.root').show();
            $('.operation').hide();
            $('.item.filter').removeClass('filter');
            $('#make-buy-filter').val('all');
            elemItem.addClass('filter');
        }

        // $('.leaf').each(function() {
        $('.item').each(function() {

            let elemLeaf = $(this);
            let rootLeaf = elemLeaf.attr('data-ebom-root') || elemLeaf.attr('data-root');
            
            if(rootLeaf === root) {

                elemLeaf.show();
                elemLeaf.addClass('selected');

                unhideParent(elemLeaf.parent());

                if(partNumber === '') partNumber = elemLeaf.attr('data-part-number');
                if(typeof partNumber === 'undefined') partNumber = '';

            }

        });

        if(!isSelected || filter) {
            if(partNumber !== '') {

                let elemMBOM = elemItem.closest('#mbom');

                if(elemMBOM.length === 1) {
                    elemItem.addClass('current-mbom');
                    viewerSelectModel(partNumber, { 'fitToView' : false, resetColors : true, highlight : true });
                    if(!filter) {
                        selectAdjacentMBOMModels();
                        if(config.displayOptions.tabOperations) {
                            insertSourcing(elemItem.attr('data-link'), paramsoperationsSourcing);
                            insertGrid(elemItem.attr('data-link') , paramsoperationsGrid );
                        }
                    }
                } else {
                    viewerSelectModel(partNumber, {
                        highlight : true
                    });
                }

            }
            insertItemSummary(link, paramsSummary);
            setBOMTotalQuantities(root);
        }
        
    // } else {

        // elemItem.addClass('selected');
        // viewerSelectModel(partNumber, { highlight : true });

    // }
    
}
function selectAdjacentMBOMModels() {

    $('.adjacent-prev').removeClass('adjacent-prev');
    $('.adjacent-next').removeClass('adjacent-next');    

    if($('.current-mbom').length === 0) return;
    
    let elemItem = $('.current-mbom').first();

    if(elemItem.hasClass('process')) return;
    if(!$('body').hasClass('mode-ebom')) return;

    // Get previous element within tree
    let elemPrev = elemItem.prev();
    if(elemPrev.length === 0) {
        let elemParent  = elemItem.parent().parent();
        let elemPrevAll = elemParent.prevAll();
        elemPrev = null;
        elemPrevAll.each(function() {
            if(elemPrev === null) {
                let elemTest = $(this);
                if(elemTest.children('.item-bom').length === 0) {
                    elemPrev = elemTest;
                } else if(elemTest.children('.item-bom').children().length > 0) {
                    elemPrev = elemTest.children('.item-bom').children().last();
                }
            }
        });
    } else if(elemPrev.attr('data-part-number') === '') {
        let elemPrevBOM = elemPrev.children('.item-bom');
        if(elemPrevBOM.length > 0) {
            elemPrev = elemPrevBOM.children().last();
        }
    }
    if(elemPrev !== null) {
        if(elemPrev.length > 0) {
            let prevPartNumber = elemPrev.attr('data-part-number');
            elemPrev.addClass('adjacent-prev');
            viewerSetColor(prevPartNumber, { 'color' : colors.vectors.green, resetColors : false } );
        }
    }

    // Get next element within tree
    let elemNext = getNextAdjacentItem(elemItem);

    if(elemNext !== null) {
        if(elemNext.length > 0) {
            let nextPartNumber = elemNext.attr('data-part-number');
            elemNext.addClass('adjacent-next');
            viewerSetColor(nextPartNumber, { 'color' : colors.vectors.red, resetColors : false } );
        }
    }

}
function getNextAdjacentItem(elemItem) {

    let elemNext = elemItem.next();

    if(elemNext.length === 0) {
        let elemParent  = elemItem.parent().parent();
        let elemNextAll = elemParent.nextAll();
        elemNext = null;
        elemNextAll.each(function() {
            if(elemNext === null) {
                let elemTest = $(this);
                if(elemTest.children('.item-bom').length === 0) {
                    elemNext = elemTest;
                } else if(elemTest.children('.item-bom').children().length > 0) {
                    elemNext = elemTest.children('.item-bom').children().first();
                }
            }
        });
    } else if(elemNext.attr('data-part-number') === '') {
        let elemNextBOM = elemNext.children('.item-bom');
        if(elemNextBOM.length > 0) {
            elemNext = elemNextBOM.children().last();
        }
    }

    return elemNext;

}
function deselectItem(elemClicked) {

    $('body').removeClass('with-quantity-comparison');
    $('.item').removeClass('selected');
    $('.item').removeClass('filter');
    $('.item').show();

    editorResetSelection();

    let elemMBOM = elemClicked.closest('#mbom');

    if(elemMBOM.length === 1) {
        viewerResetSelection(false);
    } else {
        viewerResetSelection({ 'fitToView' : true });
    }

    setStatusBar();
    setStatusBarFilter();

}
function unhideParent(elemVisible) {
    
    let parent = elemVisible.closest('.item');
    
    if(parent.length > 0) {
        parent.show();
//        parent.closest('.item');
        unhideParent(parent.parent());
    }
    
}
function  applyMakeBuyFilter() {

    if(!config.displayOptions.bomColumnMakeBuy) return;

    let value = $('#make-buy-filter').val();

    $('#mbom').find('.item').each(function() {

        let elemItem = $(this);
        let elemHead = elemItem.children('.item-head');
        let selected = elemHead.find('.item-make-buy').val();

        if(value === 'all') {
            elemItem.show();
        } else if(value === 'empty') {
            if(isBlank(selected)) { elemItem.show(); unhideParent(elemItem); } else { elemItem.hide(); }
        } else {
            if(!isBlank(selected)) {
                if(value === selected) {
                    elemItem.show();
                    unhideParent(elemItem);
                } else elemItem.hide();
            } else elemItem.hide();
        }

    });
}


// Set & update status bar and BOM Numbers
function setStatusBar() {

    let countAdditional = 0;
    let countDifferent  = 0;
    let countMatch      = 0;
    
    let listEBOMLinks = [];
    let listEBOMRoots = [];
    let listMBOMLinks = [];
    let listMBOMRoots = [];
    let listMBOMFromE = [];
    let qtysEBOM      = [];
    let qtysMBOM      = [];

    let listRed       = [];
    let listYellow    = [];
    let listGreen     = [];

    $('.item').removeClass('additional').removeClass('different').removeClass('match');
    
    $('#ebom').find('.item').each(function() {
        if(!$(this).hasClass('item-has-bom')) {
            let link = $(this).attr('data-link');
            $(this).removeClass('enable-update');
            $(this).removeClass('different-revision');
            $(this).removeClass('different-qty');
            if(listEBOMLinks.indexOf(link) === -1) {
                listEBOMLinks.push(link);
                listEBOMRoots.push($(this).attr('data-root'));
                qtysEBOM.push(Number($(this).attr('data-total-qty')));
            }
        }
    });

    $('#mbom').find('.item.is-ebom-item').each(function() {

        let elemItem = $(this);

        if(!elemItem.hasClass('root')) {
            if(!elemItem.hasClass('proces')) {
                if(!elemItem.hasClass('mbom-item')) {

                    let link     = elemItem.attr('data-link');
                    let root     = elemItem.attr('data-ebom-root') || elemItem.attr('data-root');
                    // let ebomRoot = elemItem.attr('data-ebom-root');
                    // let linkEBOM = elemItem.attr('data-link-ebom');
                
                    // if(typeof linkEBOM !== 'undefined') link = linkEBOM;

                    let index = listMBOMLinks.indexOf(link);
                    // let qty   = Number(elemItem.find('.item-qty-input').val());

                    let qty      = parseFloat(elemItem.find('.item-qty-input').val());
            
                    elemItem.parents().each(function() {
                        
                        let elemParent = $(this);
                    
                        if(elemParent.hasClass('item-bom')) {
                    
                            let elemHead = elemParent.prev();
                            let elemItem = elemParent.parent();
                    
                            if(!elemItem.hasClass('root')) {
                    
                                let count = elemHead.find('.item-qty-input').val();
                                    count = parseFloat(count);

                                qty = qty * count;

                            }

                        }
                    });


                    if(index === -1) {
                        listMBOMLinks.push(link);
                        listMBOMRoots.push(root);
                        listMBOMFromE.push(!isBlank(elemItem.attr('data-ebom-root')))
                        qtysMBOM.push(qty);
                    } else {
                        qtysMBOM[index] += qty;
                    }
                }
            }
        }

    });

    $('#ebom').find('.item').each(function() {
        let partNumber = $(this).attr('data-part-number');
        if(!$(this).hasClass('item-has-bom')) {

            let ebomLink = $(this).attr('data-link');
            let ebomRoot = $(this).attr('data-root');
            let index    = listMBOMRoots.indexOf(ebomRoot); 
            let qty      = qtysEBOM[listEBOMRoots.indexOf(ebomRoot)];

            if(index === -1) {

                countAdditional++;
                if(listRed.indexOf(partNumber) === -1) listRed.push(partNumber);
                $(this).addClass('additional');

            } else if((qtysMBOM[index] === qty) && (ebomLink === listMBOMLinks[index])) {

                $(this).addClass('match');
                countMatch++;
                if(listGreen.indexOf(partNumber) === -1) listGreen.push(partNumber);

            } else {

                let isMBOMFromE = listMBOMFromE[index];

                if(qtysMBOM[index] !== qty) { 
                    $(this).addClass('different-qty'); 
                } else if(isMBOMFromE) { return; }


                $(this).addClass('different');
                countDifferent++;

                if(ebomLink !== listMBOMLinks[index]) $(this).addClass('different-revision');

                if(listYellow.indexOf(partNumber) === -1) listYellow.push(partNumber);
                if($(this).attr('data-instance-qty') === $(this).attr('data-total-qty')) {  

                    let countMBOMInstances = 0;

                    $('#mbom').find('.item').each(function() {

                        let mbomRoot = $(this).attr('data-ebom-root') || $(this).attr('data-root');
                        if(ebomRoot === mbomRoot) {
                            countMBOMInstances++;
                        }

                    });

                    if(countMBOMInstances === 1) $(this).addClass('enable-update');
                }

            }
            
        }
    });

    $('#mbom').find('.item.is-ebom-item').each(function() {
        if($(this).hasClass('mbom-item')) {
            $(this).addClass('unique');
        } else if(!$(this).hasClass('root')) {
            if(!$(this).hasClass('process')) {
                
                let mbomRoot  = $(this).attr('data-ebom-root') || $(this).attr('data-root');
                let mbomLink  = $(this).attr('data-link');
                let indexRoot = listEBOMRoots.indexOf(mbomRoot); 
                let indexLink = listEBOMLinks.indexOf(mbomLink); 
                let qty       = qtysMBOM[listMBOMRoots.indexOf(mbomRoot)];
                let isFromE   = !isBlank($(this).attr('data-ebom-root'));

                if(indexRoot === -1) {
                    countAdditional++;
                    $(this).addClass('additional');
                } else if(qtysEBOM[indexRoot] !== qty) {
                    $(this).addClass('different');
                } else if(isFromE) {
                    $(this).addClass('match');
                } else if(indexLink === -1) {
                    $(this).addClass('different');
                } else {
                    $(this).addClass('match');
                }
            }
        }
    });
    
    $('#status-additional').css('flex', countAdditional + ' 1 0%');
    $('#status-different' ).css('flex', countDifferent  + ' 1 0%');
    $('#status-match'     ).css('flex', countMatch      + ' 1 0%');
    
    if(countAdditional === 0) $('#status-additional').css('border-width', '0px');  else $('#status-additional').css('border-width', '5px');
    if(countDifferent  === 0) $('#status-different' ).css('border-width', '0px');  else $('#status-different' ).css('border-width', '5px');
    if(countMatch      === 0) $('#status-match'     ).css('border-width', '0px');  else $('#status-match'     ).css('border-width', '5px');
    
    if(!isViewerStarted()) return; 

    viewerResetColors();

    if(viewerStatusColors) {
        viewerSetColors(listRed    , { keepHidden : true, unhide : false, resetColors : false, color : colors.vectors.red}    );
        viewerSetColors(listYellow , { keepHidden : true, unhide : false, resetColors : false, color : colors.vectors.yellow} );
        viewerSetColors(listGreen  , { keepHidden : true, unhide : false, resetColors : false, color : colors.vectors.green}  );
    }

    updateMBOMNumbers();

}
function updateMBOMNumbers() {

    if(!config.displayOptions.bomColumnNumber) return;

    $('#mbom .item-bom').each(function() {

        let elemBOM     = $(this);
        let number      = 1;

        elemBOM.children('.item').each(function()  {
            $(this).attr('data-number', number);
            $(this).find('.item-number').first().html(number++);
        });

    });

}


// Input controls to add new items to MBOM
function insertNewProcess(e) {
    
    if (e.which == 13) {

        if($('#mbom-add-name').val() === '') return;

        let node = {
            level       : 1,
            bomType     : 'mbom',
            title       : $('#mbom-add-name').val(),
            hasChildren : true,
            isEBOMItem  : false,
            isProcess   : true,
            isLeaf      : false,
            icon        : 'radio-process',
            code        : $('#mbom-add-code').val(),
            revision    : '-',
            quantity    : $('#mbom-add-qty' ).val() || 1
        }

        let elemNew = insertBOMPartListNode('mbom', null, node);
        
        let elemBOM = $('#mbom-tree').children().first().children('.item-bom').first();

        if(disassembleMode) elemBOM.prepend(elemNew);
        else elemBOM.append(elemNew);

        updateMBOMNumbers();
        selectProcess(elemNew);
        
        $('#mbom-add-name').val('');
        $('#mbom-add-code').val('');
        $('#mbom-add-qty' ).val('');
        $('#mbom-add-name').focus();
        
    }
    
}



// BOM Panels with total quantities
function setBOMTotalQuantities(linkRoot) {

    $('body').addClass('with-quantity-comparison');

    let qtyEBOM = 0;
    let qtyMBOM = 0;

    $('#ebom').find('.item').each(function() {
        if($(this).attr('data-root') === linkRoot) {
            qtyEBOM = Number($(this).attr('data-total-qty'));
        }
    });

    $('#mbom').find('.leaf').each(function() {
        if($(this).attr('data-root') === linkRoot) {
            
            let elemLeaf = $(this);
            let qty      = parseFloat(elemLeaf.find('.item-qty-input').val());
            
            elemLeaf.parents().each(function() {
                
                let elemParent = $(this);
            
                if(elemParent.hasClass('item-bom')) {
            
                    let elemHead = elemParent.prev();
                    let elemItem = elemParent.parent();
            
                    if(!elemItem.hasClass('root')) {
            
                        let count = elemHead.find('.item-qty-input').val();
                            count = parseFloat(count);

                        qty = qty * count;

                    }

                }
            });

            qtyMBOM += qty;
        }
    });

    if(qtyMBOM === qtyEBOM) {
        $('#ebom-qty-comparison').html('Total quantity matches in EBOM and MBOM : ' + qtyMBOM); 
    } else if(qtyMBOM < qtyEBOM) {
        $('#ebom-qty-comparison').html((qtyEBOM - qtyMBOM) + ' units less in MBOM : (M) ' + qtyMBOM + ' < ' + qtyEBOM + ' (E)'); 
    } else {
        $('#ebom-qty-comparison').html((qtyMBOM-qtyEBOM) + ' units more in MBOM : (M) ' + qtyMBOM + ' > ' + qtyEBOM + ' (E)'); 
    }

}



// Drag & Drop functions
function moveItemQuantity() {
    
    let elemItem    = $('.to-move');
    let elemBOM     = $('.selected-target').children('.item-bom');
    let exists      = itemExistsInBOM(elemItem, elemBOM);
    let qtyMove     = $('#copy-qty').val();
    let qtyNew      = elemItem.find('.item-qty-input').val() - $('#copy-qty').val();
    let makeBuy     = elemItem.find('.item-make-buy').val();
    let elemClone   = getItemClone(elemItem);

    if(!exists) {

        elemClone.appendTo(elemBOM);
        elemClone.attr('data-qty', qtyMove);
        elemClone.attr('data-instance-qty', qtyMove);
        elemClone.find('.item-qty-input').val(qtyMove);
        elemClone.find('.item-make-buy').val(makeBuy);
        elemClone.find('.item-make-buy').click(function(e) { e.preventDefault(); e.stopPropagation(); });

    }

    if(qtyNew < 1) {
        elemItem.remove();
    } else {
        elemItem.find('.item-qty-input').val(qtyNew);
    }

    $('#copy-cancel').click();
    setStatusBar();

}
function addItemQuantity() {
    
    let elemItem    = $('.to-move');
    let elemBOM     = $('.selected-target').children('.item-bom');
    let exists      = itemExistsInBOM(elemItem, elemBOM);
    let qtyAdd      = $('#copy-qty').val();
    let makeBuy     = elemItem.find('.item-make-buy').val();
    let elemClone   = getItemClone(elemItem);

    if(!exists) {
        elemClone.appendTo(elemBOM);
        elemClone.attr('data-qty', qtyAdd);
        elemClone.attr('data-instance-qty', qtyAdd);
        elemClone.find('.item-qty-input').val(qtyAdd);
        elemClone.find('.item-make-buy').val(makeBuy);
        elemClone.find('.item-make-buy').click(function(e) { e.preventDefault(); e.stopPropagation(); });
    }

    $('#copy-cancel').click();
    setStatusBar();

}
function itemExistsInBOM(elemItem, elemBOM) {
    
    let exists = false;
    
    elemBOM.children().each(function() {
        if($(this).attr('data-root') === elemItem.attr('data-root')) {
        
            let qtyNew = $(this).find('.item-qty-input').val();
            let qtyAdd  = $('#copy-qty').val();
            qtyNew  = parseFloat(qtyAdd) + parseFloat(qtyNew);
            
            $(this).find('.item-qty-input').val(qtyNew);
            
            exists = true;
            
        } 
    });

    return exists;
    
}
function getItemClone(elemItem) {

    let elemClone       = elemItem.clone();
    let elemQtyInput    = elemClone.find('.item-qty-input');
    let elemActions     = elemClone.find('.item-head-actions');

    elemActions.children().remove();
            
    insertMBOMSelectEvent(elemClone)
    insertMBOMQtyInputControls(elemQtyInput)
    insertTileActions(elemActions, 'mbom');

   return elemClone;

}



// Add Items Tab
function insertSearchFilters() {

    if(isBlank(config.predefinedSearchesInAddItems)) return;

    let index = 0;

    for(let view of config.predefinedSearchesInAddItems) {

        index++;

        $('<div></div>').insertAfter($('#nav-search-items'))
            .addClass('blank')
            .addClass('panel-nav')
            .addClass('saved-search')
            .html(view.title)
            .attr('data-id', 'saved-search-' + index)
            .attr('data-wsid', view.wsId)
            .attr('data-query', view.query);

        let elemSearchPanel = $('<div></div>').appendTo($('#add-views'))
            .attr('id', 'saved-search-' + index);

        $('<div></div>').appendTo(elemSearchPanel)
            .addClass('panel-list-toolbar')
            .append('<span>Filter List:</span>')
            .append('<input class="list-filter">')
            .append('<i class="icon">filter_list</i>');

        $('<div></div>').appendTo(elemSearchPanel)
            .addClass('panel-list')
            .attr('id', 'saved-search-' + index + '-list');

    }

}
function clickPanelNav(elemClicked) {

    let update = (elemClicked.hasClass('selected')) ? true : elemClicked.hasClass('blank');

    $('.panel-nav').removeClass('selected');
    elemClicked.addClass('selected').removeClass('blank');
    
    let id = elemClicked.attr('data-id');
    
    $('#' + id).show().siblings().hide();

    if(elemClicked.hasClass('saved-search')) {
        if(update) {
            searchItems(id, id + '-list', elemClicked.attr('data-query'));
        } else {
            $('#' + id).show().siblings().hide();
        }
    } else  if(id === 'search-items') {
        $('#' + id).show().siblings().hide();
    } else  if(id === 'create-item') {
        $('#create-item').show().siblings().hide();
    } else if(update) {

        $('#add-processing').show();

        switch(id) {

            case 'workspace-views-mbom' : setWorkspaceView('mbom'); break;
            case 'workspace-views-ebom' : setWorkspaceView('ebom'); break;
            case 'bookmark-items'       : setBookmarkItemsList(); break;
            case 'recent-items'         : setRecentItemsList(); break;

        }

    }

}
function searchItems(idView, idList, query) {

    $('#' + idList).html('');
    $('#add-processing').show();

    if(query === $('.panel-nav.active').first().attr('data-query') ) {
        if($('#' + idList).children().length > 0) {
            $('#' + idList).parent().show().siblings().hide();
            return;
        }
    }

    let params = { 
        'wsId'   : wsMBOM.wsId,
        'limit'  : 50,
        'offset' : 0,
        'query'  : query,
        'bulk'   : false
    }

    $.get('/plm/search-bulk', params, function(response) {
        setItemsList(idView, idList, response.data.items);
    });

}
function setWorkspaceView(suffix) {

    $('#workspace-views-' + suffix).show();
    $('#add-processing').show();

    if(($('#workspace-views-' + suffix).attr('data-link') === '') || ($('#workspace-views-' + suffix).attr('data-link') !== $('#view-selector-' + suffix).val())) {

        let elemParent = $('#workspace-view-list-' + suffix);
            elemParent.html('');


        $.get('/plm/tableau-data', { 'link' : $('#view-selector-' + suffix).val() }, function(response) {      
            
            $('#add-processing').hide();
            
            let indexDescriptorField = 0;

            if(response.data.items.length > 0) {
                for(let indexField = 0; indexField < response.data.items[0].fields.length; indexField++) {
                    if(response.data.items[0].fields[indexField].id === 'DESCRIPTOR') {
                        indexDescriptorField = indexField;
                        break;
                    }
                }
            }

            for(let item of response.data.items) {
                addItemListEntry(item.item.link, item.item.urn, item.fields[indexDescriptorField].value, suffix, elemParent, false);
            }

        });

    } else {
        $('#add-processing').hide();
    }

    $('#workspace-views-' + suffix).attr('data-link', $('#view-selector-' + suffix).val());

}
function setBookmarkItemsList() {

    $('#bookmark-items-list').html('');

    $.get('/plm/bookmarks', {}, function(response) {
        setItemsList('bookmark-items', 'bookmark-items-list', response.data.bookmarks);
    });

}
function setRecentItemsList() {

    $('#recent-items-list').html('');

    $.get('/plm/recent', {}, function(response) {
        setItemsList('recent-items', 'recent-items-list', response.data.recentlyViewedItems);
    });

}
function setItemsList(idView, idList, list) {

    $('#add-processing').hide();

    let elemList = $('#' + idList);
        elemList.html('');

    for(let item of list) {

        let link        = item.hasOwnProperty('item') ? item.item.link  : item.__self__;
        let urn         = item.hasOwnProperty('item') ? item.item.urn   : item.urn;
        let title       = item.hasOwnProperty('item') ? item.item.title : item.title;
        let className   = getIconClassName(link);
        let ws          = link.split('/')[4];

        if(ws === wsMBOM.wsId) addItemListEntry(link, urn, title, className, elemList, false);

    }

    let elemSelected = $('.panel-nav.selected');  
    let idSelected   = elemSelected.attr('data-id');

    if(idSelected === idView)  $('#' + idView).show().siblings().hide();

}
function addItemListEntry(link, urn, title, className, elemParent, isProcess) {

    let elemItem = $('<div></div>').appendTo(elemParent)
        .addClass('additional-item')
        .attr('data-link', link)
        .attr('data-urn', urn)
        .html(title)
        .click(function() {
            insertItemSummary($(this).attr('data-link'), paramsSummary);
            $(this).addClass('selected');
            $(this).siblings().removeClass('selected');
        })
        .draggable({ 
            scroll      : false,
            appendTo    : 'body',
            containment : 'window',
            cursor      : 'move',
            cursorAt    : { left : 50 },
            helper      : 'clone',
            opacity     : 0.4,
            zIndex      : 100000
        });

    // if(isProcess) elemItem.addClass('is-operation');

}
function insertAdditionalItem(elemHead, link) {

    $('#overlay').show();

    let requests = [
        $.get('/plm/details', { link : link } ),
        $.get('/plm/bom', { 
            link            : link,
            viewId          : wsMBOM.viewId,
            depth           : 2,
            revisionBias    : config.revisionBias
        })
    ]

    Promise.all(requests).then(function(responses) {

        let isProcess = getSectionFieldValue(responses[0].data.sections, config.workspaceMBOM.fieldIDs.isProcess, false);

        $('#overlay').hide();

        if(isProcess == 'true') {

            mBOM = responses[1].data;
            for(let edgeMBOM of mBOM.edges) edgeMBOM.depth++;
            let newNode = setMBOM(elemHead.next(), mBOM.root, 2, null, '', true);
            matchEBOMItems(newNode);

        } else {
      
            let elemParent = elemHead.next();

            let node = {
                link       : link,
                root       : responses[0].data.root.link,
                revision   : (responses[0].data.workingVersion) ? 'W' : responses[0].data.versionId,
                title      : responses[0].data.title,
                bomType    : 'mbom',
                quantity   : 1,
                partNumber : getSectionFieldValue(responses[0].data.sections, config.workspaceMBOM.fieldIDs.number   , ''),
                type       : getSectionFieldValue(responses[0].data.sections, config.workspaceMBOM.fieldIDs.type     , '', 'title'),
                category   : getSectionFieldValue(responses[0].data.sections, config.workspaceMBOM.fieldIDs.category , ''),
                code       : getSectionFieldValue(responses[0].data.sections, config.workspaceMBOM.fieldIDs.code     , ''),
                xbom       : getSectionFieldValue(responses[0].data.sections, config.workspaceMBOM.fieldIDs.ebom     , ''),
                makeBuy    : getSectionFieldValue(responses[0].data.sections, config.workspaceEBOM.fieldIDs.makeOrBuy, '', 'object'),
                isEBOMItem : false,
                isProcess  : false,
                isLeaf     : true
            }

            $('#ebom').find('.item').each(function() { if($(this).attr('data-root') === node.root) node.isEBOMItem = true; })
                
            node.icon = getBOMPartIcon(node);

            insertBOMPartListNode('mbom', null, node).appendTo(elemParent)

            
            // let className  = getIconClassName(link, false, false);
            // let node       = {
            //     link       : link,
            //     urn        : responses[0].data.urn,
            //     descriptor : responses[0].data.title,
            //     root       : responses[0].data.root.link,
            //     code       : getSectionFieldValue(responses[0].data.sections, config.fieldIdProcessCode, '')
            // }
            // let edge = {
            //     id      : '',
            //     number  : '',
            //     makeBuy : getSectionFieldValue(responses[0].data.sections, config.workspaceEBOM.fieldIDs.makeOrBuy, null, 'object')
            // }
            
            // getBOMNode(node, edge, null, '', className, 1, 'mbom', true).appendTo(elemParent);

            // let elemNode = $('<div></div>').appendTo(elemParent)
            //     .addClass('item')
            //     .addClass('leaf')
            //     .addClass('unique')
            //     .addClass('mbom-item')
            //     .addClass(className)
            //     .attr('data-urn', urn)
            //     .attr('data-link', link)
            //     .attr('data-qty', qty);
        
            // let elemNodeHead = $('<div></div>').appendTo(elemNode)
            //     .addClass('item-head')
            //     .attr('data-qty', qty);
            
            // $('<div></div>').appendTo(elemNodeHead)
            //     .addClass('item-toggle');
            
            // $('<div></div>').appendTo(elemNodeHead)
            //     .addClass('item-icon')
            //     .html('<span class="icon">build</span>');
            
            // $('<div></div>').appendTo(elemNodeHead)
            //     .addClass('item-title')
            //     .html(title)
            //     .attr('data-urn', '')
            //     .attr('data-qty', qty);

            // $('<div></div>').appendTo(elemNodeHead)
            //     .addClass('item-code');
            
            // let elemNodeQty = $('<div></div>').appendTo(elemNodeHead)
            //     .addClass('item-qty');

            // $('<input></input>').appendTo(elemNodeQty)
            //     .attr('type', 'number')
            //     .addClass('item-qty-input')
            //     .val(qty);
            
            // $('<div></div>').appendTo(elemNodeHead)
            //     .addClass('item-head-status');
            
            // let elemNodeActions = $('<div></div>').appendTo(elemNodeHead)
            //     .addClass('item-actions');
            
            // insertMBOMActions(elemNodeActions);

        }

        setStatusBar();

    });
        
}
function matchEBOMItems(elemNode) {

    let elemBOM = elemNode.children('.item-bom').first();

    elemBOM.find('.item').each(function() {

        let elemItemM   = $(this);
        let partNumberM = elemItemM.attr('data-part-number');

        $('#ebom-tree').find('.item').each(function() {

            let elemItemE   = $(this);
            let partNumberE = elemItemE.attr('data-part-number');

            if(partNumberM === partNumberE) {
                elemItemM.removeClass('mbom-item').addClass('is-ebom-item')
                elemItemM.attr('data-ebom-root', elemItemE.attr('data-ebom-root'));
            }

        });

    });

}
function getIconClassName(link, isProcess, isEBOMItem) {

    let className = 'deployed_code';

    if(!singleWorkspace) {
        let id = link.split('/')[4];
        if(isBlank(isEBOMItem)) {
            if (id !== wsEBOM.wsId) className = 'build';
        } else if(!isEBOMItem) {
            className = 'build';
        }
    } else {
        if(!isBlank(isProcess)) {
            if(isProcess) return 'radio_button_unchecked';
            else if(!isBlank(isEBOMItem)) {
                if(!isEBOMItem) return 'build';
            }
        }
    }

    return className;

}
function onItemCreation(link) {
    $.get('/plm/details', { link : link }, function(response) {
        addItemListEntry(response.params.link, response.data.urn, response.data.title, 'mbom', $('#create-item-list'), false );
    });
}



// Viewer interaction
function onViewerSelectionChanged(event) {

    if(viewerHideSelected(event)) return;

    if(disableViewerSelectionEvent) return;

    if(event.dbIdArray.length === 1) {

        viewerGetSelectedPartNumber(event, function(partNumber) {

        let updateBOMPanels = true;

            if(disassembleMode) {

                if((event.mouseButton === 0) || isBlank(event.mouseButton)) {

                    disableViewerSelectionEvent = true;
                    viewerHideModel(partNumber);
                    disableViewerSelectionEvent = false;
                    $('#ebom').find('.item.leaf').each(function() {
                        let elemEBOM = $(this);
                        if(elemEBOM.attr('data-part-number') === partNumber) {
                            let elemActionAdd = elemEBOM.find('.item-action-add').first();
                            elemActionAdd.click();
                            
                        }
                    });

                }

            } else {

                $('.item.leaf').hide();
                $('.item.leaf').removeClass('selected');
                $('.item.leaf').each(function() {
                    if($(this).attr('data-part-number') === partNumber) { 
                        $(this).show(); 
                        $(this).addClass('selected'); 
                        $(this).parents().show(); 
                        if(updateBOMPanels) {
                            setBOMTotalQuantities($(this).attr('data-root'));
                            updateBOMPanels = false;
                        }
                    }
                });

            }

         });

    } else {

        $('.item.leaf').show();
        $('.item.selected').removeClass('selected');
        $('body').removeClass('with-quantity-comparison');
        
       viewer.clearThemingColors();

    }

}
function updateViewer() {

    var elemButtonView = $('.button-view.selected');

    if(elemButtonView.length > 0) {
        if(!disassembleMode) {
            viewerHideInvisibleItems(elemButtonView.closest('.item'));
        }
    }

}
function viewerHideInvisibleItems(elemStart) {

    let partNumbers     = [];
    let elemParent      = elemStart.parent().parent();
    let partsColored    = null;

    $('#mbom-root-bom').find('.item').addClass('invisible');

    addPartNumber(partNumbers, null, elemStart, false);

    elemStart.prevAll().each(function() {
        addPartNumber(partNumbers, null, $(this), true);
    });

    if(elemParent.length > 0) {
        elemParent.addClass('visible').removeClass('invisible');
        elemParent.prevAll().each(function() {
            addPartNumber(partNumbers, partsColored, $(this), true);
        });
    }

    viewer.setGhosting(false);
    viewer.hideAll();
    viewerUnhideModels(partNumbers);

}
function addPartNumber(partNumbers, partsColored, elemItem, expand) {

    let result     = [];
    let partNumber = elemItem.attr('data-part-number');

    if(partNumber !== '') {
        partNumbers.push(partNumber);
        if(partsColored !== null) {
            partsColored.push(partNumber);
        }
    }

    if(expand) {
        $(elemItem).find('.item').each(function() {
            addPartNumber(partNumbers, partsColored, $(this), true);
        });
    }

    elemItem.addClass('visible').removeClass('invisible');

    return result;

}
function restoreAssembly() {

    if(!disassembleMode) return;

    viewer.showAll();
    let partNumbers = [];

    $('#mbom').find('.item').each(function() {
        let partNumber = $(this).attr('data-part-number');
        if(partNumber !== '') partNumbers.push(partNumber);
    });
    
    viewerHideModels(partNumbers);

}



// Filtering by Status Bar
function setStatusBarFilter() {
    
    $('.item.leaf').show();

    let elemSelected = $('.bar.selected');
    
    if(elemSelected.length === 0) return;

    let dbIds          = [];  
    let selectedFilter = elemSelected.attr('data-filter');

    $('.item.leaf').each(function() {
        if(!$(this).hasClass('item-has-bom')) { 
            if(!$(this).hasClass(selectedFilter)) $(this).hide(); 
            else dbIds.push($(this).attr('data-part-number'));
        }
    });

    viewerResetSelection();
    viewerSelectModels(dbIds);
    
}



// Apply changes to database when clicking Save
function setSaveActions() {

    pendingActions   = [0, 0, 0, 0];
    pendingRemovals  = [];

    $('.pending-creation').removeClass('pending-creation');
    $('.pending-addition').removeClass('pending-addition');
    $('.pending-update'  ).removeClass('pending-update'  );

    // Determine and flag new items
    $('#mbom').find('.item').each(function() {
        if((typeof $(this).attr('data-link') === 'undefined') || ($(this).attr('data-link') === '')) {
            $(this).addClass('pending-creation');
        }
    });

    // Determine bom relationships to remove, add or update
    $('#mbom .item-bom').each(function() {

        let elemBOM     = $(this);
        let elemParent  = elemBOM.parent();
        let listEdges   = elemParent.attr('data-edges');
        let linkItem    = elemParent.attr('data-link');
        let edges       = [];
        let number      = 1;

        if(!isBlank(linkItem)) {

            linkItem = linkItem.split('/');

            if((typeof listEdges !== 'undefined') && (listEdges !== '')) {

                edges = listEdges.split(',');
                    
                for(let edge of edges) {
        
                    let keep  = false;
                    
                    elemBOM.children('.item').each(function()  {
                        if($(this).attr('data-edge') === edge) {
                            keep = true;
                        }
                    });

                    if(!keep) {
                        pendingRemovals.push({
                            wsId      : linkItem[4],
                            dmsId     : linkItem[6],
                            edgeId    : edge
                        });
                    }

                }

            }

        }

        elemBOM.children('.item').each(function()  {
            
            let elemItem = $(this).attr('data-number', number++);
            let edge     = elemItem.attr('data-edge');
            
            if(typeof edge === 'undefined') edge = '';
            
            if(edges.indexOf($(this).attr('data-edge')) < 0) {
                $(this).addClass('pending-addition');
            } else {

                let dbLink    = elemItem.attr('data-link-db') || elemItem.attr('data-link') ;
                let edlink    = elemItem.attr('data-link') ;
                let dbNumber  = elemItem.attr('data-number-db');
                let edNumber  = elemItem.attr('data-number');
                let dbQty     = elemItem.attr('data-qty');
                let edQty     = elemItem.find('.item-qty-input').first().val();
                let dbMakeBuy = elemItem.attr('data-make-buy');
                let edMakeBuy = elemItem.find('.item-make-buy').first().val();

                dbQty = parseFloat(dbQty);
                edQty = parseFloat(edQty);

                     if(dbQty     !== edQty    ) elemItem.addClass('pending-update');
                else if(dbNumber  !== edNumber ) elemItem.addClass('pending-update');
                else if(dbMakeBuy !== edMakeBuy) elemItem.addClass('pending-update');
                else if(dbLink    !== edlink   ) elemItem.addClass('pending-update');

            }

        });

    });

    pendingActions[0] = $('.pending-creation').length;
    pendingActions[1] = pendingRemovals.length;
    pendingActions[2] = $('.pending-addition').length;
    pendingActions[3] = $('.pending-update').length;

}
function showSaveProcessingDialog() {
   
    $('.step-bar').addClass('transition-stopper')
    $('.step-bar').css('width', '0%');
    $('#overlay').show();
    $('#confirm-saving').addClass('disabled').removeClass('default');
    $('.in-work').removeClass('in-work');
    $('#step1').addClass('in-work');
    $('.step-bar').removeClass('transition-stopper');
    
    $('#step-counter1').html('0 of ' + pendingActions[0]);
    $('#step-counter2').html('0 of ' + pendingActions[1]);
    $('#step-counter3').html('0 of ' + pendingActions[2]);
    $('#step-counter4').html('0 of ' + pendingActions[3]);
    
    $('#dialog-saving').show();

}
function createNewItems() {
    
    let pending = $('.pending-creation').length;
    let progress = (pendingActions[0] - pending) * 100 / pendingActions[0];

    $('#step-bar1').css('width', progress + '%');
    $('#step-counter1').html((pendingActions[0] - pending) + ' of ' + pendingActions[0]);

    if(pending > 0) {
        
        let requests = [];
        let elements = [];

        $('.pending-creation').each(function() {

            if(requests.length < maxRequests) {

                let elemItem = $(this);
                let title    = elemItem.find('.item-head-descriptor').html();
                let code     = elemItem.find('.item-code').html();
                
                if(elemItem.find('.item-head-descriptor').length === 0) title = elemItem.find('.item-title').html();

                let params = {
                    wsId       : wsMBOM.wsId,
                    sections   : wsMBOM.sections,
                    getDetails : true,
                    fields     : [
                        { fieldId : config.workspaceMBOM.fieldIDs.title    , value : title },
                        { fieldId : config.workspaceMBOM.fieldIDs.isProcess, value : true  },
                        { fieldId : config.workspaceMBOM.fieldIDs.code     , value : code  }
                    ]
                };

                if(!isBlank(config.workspaceMBOM.fieldIDs.number)) {
                    if(!isBlank(config.matchNewProcessNumber)) {
                        if(code !== '') {
                            params.fields.push({ fieldId : config.workspaceMBOM.fieldIDs.number, value : basePartNumber + '-' + code });
                        }
                    }
                }

                for(let newDefault of config.newProcessDefaults) {
                    params.fields.push({ fieldId : newDefault[0], value : newDefault[1] });
                }

                requests.push($.post('/plm/create', params));
                elements.push(elemItem);

            }

        });

        Promise.all(requests).then(function(responses) {

            let index = 0;

            for(let response of responses) {
                if(response.error) {
                    showErrorMessage('Error while creating new MBOM nodes', 'Error message : ' + response.message + '<br/>Please refresh your browser window before continuing. All changes that were not saved will be lost.');
                    return;
                }

                let elemItem = elements[index++];
                    elemItem.attr('data-link', response.data.__self__);
                    elemItem.attr('root-link', response.data.__self__);
                    elemItem.removeClass('pending-creation');

                let elemHead = elemItem.children().first();
                    elemHead.find('.item-head-descriptor').html(response.data.title);    
                    elemHead.find('.item-revision').html('W');  
                    
                if(elemHead.find('.item-head-descriptor').length === 0) elemHead.find('.item-title').html(response.data.title);

            }

            createNewItems(); 

        });
     
    } else { 

        $('#step-bar1').css('width', '100%');
        $('#step1').removeClass('in-work');
        $('#step2').addClass('in-work');
        $('#step-counter1').html(pendingActions[0] + ' of ' + pendingActions[0]);

        deleteBOMItems(); 
        
    }
    
}
function deleteBOMItems() {

    let pending  = pendingRemovals.length;
    let progress = (pendingActions[1] - pending) * 100 / pendingActions[1];

    $('#step-bar2').css('width', progress + '%');
    $('#step-counter2').html((pendingActions[1] - pending) + ' of ' + pendingActions[1]);

    if(pending > 0) {
        
        let requests = [];
        let index    = (maxRequests < pendingRemovals.length) ? maxRequests : pendingRemovals.length;
            index--;

        for(index; index >= 0; index--) {
            requests.push($.get('/plm/bom-remove', pendingRemovals[index]));
            pendingRemovals.splice(index,1);
        }

        Promise.all(requests).then(function(responses) {
        
            for(let response of responses) {

                if(response.error === false) {

                    let edgeId = response.params.edgeId;

                    $('.item').each(function() {
                        let elemItem = $(this);
                        let edgesData = elemItem.attr('data-edges');
                        if(typeof(edgesData) !== 'undefined') {
                            if(edgesData !== '') {
                                let edges = edgesData.split(',');
                                if(edges.indexOf(edgeId) >= 0) {
                                    edges.splice(edges.indexOf(edgeId), 1);
                                    elemItem.attr('data-edges', edges.toString());
                                }
                            }
                        }
                    });

                }

            }

            deleteBOMItems();
        
        });

    } else {

        $('#step-bar2').css('width', '100%');
        $('#step2').removeClass('in-work');
        $('#step3').addClass('in-work');
        $('#step-counter2').html(pendingActions[1] + ' of ' + pendingActions[1]);

        addBOMItems();

    }

}
function addBOMItems() {       
        
    let pending  = $('.pending-addition').length;
    let progress = (pendingActions[2] - pending) * 100 / pendingActions[2];

    $('#step-bar3').css('width', progress + '%');
    $('#step-counter3').html((pendingActions[2] - pending) + ' of ' + pendingActions[2]);

    if(pending > 0) {

        let requests = [];
        let elements = [];

        $('.pending-addition').each(function() {

            if(requests.length < maxRequests) {
            
                let elemItem     = $(this);
                let elemParent   = elemItem.parent().closest('.item');
                let edQty        = elemItem.find('.item-qty-input').first().val();
                let makeBuy      = elemItem.find('.item-make-buy').first().val();
                let linkMBOM     = elemItem.attr('data-link-mbom');
                let linkEBOMRoot = elemItem.attr('data-ebom-root');
                let isEBOMItem   = elemItem.hasClass('is-ebom-item');
                
                let params = {                    
                    linkParent : elemParent.attr('data-link'),
                    linkChild  : (typeof linkMBOM !== 'undefined') ? linkMBOM : elemItem.attr('data-link'),
                    number     : elemItem.attr('data-number'),
                    pinned     : (isEBOMItem && config.pinEBOMItemsInMBOM),
                    quantity   : edQty,
                    fields     : [
                        { link : bomViewLinksMBOM.isEBOMItem, value : isEBOMItem }
                    ]
                };

                if(!isBlank(makeBuy)) params.fields.push({ link : bomViewLinksMBOM.makeBuy , value : { link : makeBuy} });

                requests.push($.post('/plm/bom-add', params));
                elemItem.attr('data-make-buy', makeBuy);
                elements.push(elemItem);

            }

        });

        Promise.all(requests).then(function(responses) {
        
            requests = [];

            for(let response of responses) {
                if(response.error) {
                    showErrorMessage('Error while adding BOM items', response.message);
                    endProcessing();
                    return;
                } else {
                    requests.push($.get('/plm/bom-item', { 'link' : response.data }));
                }
            }

            Promise.all(requests).then(function(responses) {

                let index = 0;

                for(let response of responses) {

                    let elemItem   = elements[index++];
                    let elemParent = elemItem.parent().closest('.item');
                    let edgeId     = response.data.__self__.split('/')[8];
                    let itemNumber = response.data.itemNumber;

                    elemItem.removeClass('pending-addition');
                    elemItem.attr('data-number-db', itemNumber);
                    elemItem.attr('data-edge', edgeId);

                    // Update edges list of parent item
                    if((typeof elemParent.attr('data-edges') === 'undefined') || (elemParent.attr('data-edges') === '')) {
                        
                        elemParent.attr('data-edges', edgeId);
                        
                    } else {

                        let edges = elemParent.attr('data-edges').split(',');
                            edges.push(edgeId);

                        elemParent.attr('data-edges', edges.toString());
                        
                    }

                }

                addBOMItems();

            });
        
        });

    } else {

        $('#step-bar3').css('width', '100%');
        $('#step3').removeClass('in-work');
        $('#step4').addClass('in-work');
        $('#step-counter3').html(pendingActions[2] + ' of ' + pendingActions[2]);

        updateBOMItems();
    }
    
}
function updateBOMItems() {       
        
    let pending  = $('.pending-update').length;
    let progress = (pendingActions[3] - pending) * 100 / pendingActions[3];

    $('#step-bar4').css('width', progress + '%');
    $('#step-counter4').html((pendingActions[3] - pending) + ' of ' + pendingActions[3]);

    if(pending > 0) {

        let requests = [];
        let elements = [];

        $('.pending-update').each(function() {

            if(requests.length < maxRequests) {

                let elemItem     = $(this);
                let elemParent   = elemItem.parent().closest('.item');
                let paramsChild  = elemItem.attr('data-link').split('/');
                let urnMBOM      = elemItem.attr('data-link-mbom');
                let edQty        = elemItem.find('.item-qty-input').first().val();
                let edMakeBuy    = elemItem.find('.item-make-buy').first().val();
                let isEBOMItem   = elemItem.hasClass('is-ebom-item');

                if(typeof urnMBOM !== 'undefined') {
                    let data = elemItem.attr('data-link-mbom').split('.');
                    paramsChild[4] = data[4];
                    paramsChild[6] = data[5];
                }

                let params = { 
                    linkParent : elemParent.attr('data-link'),
                    wsIdChild  : paramsChild[4],
                    dmsIdChild : paramsChild[6],
                    edgeId     : elemItem.attr('data-edge'),
                    number     : elemItem.attr('data-number'),
                    pinned     : (isEBOMItem && config.pinEBOMItemsInMBOM),
                    quantity   : edQty,
                    fields     : [],                    
                };

                if(config.displayOptions.bomColumnMakeBuy) {
                    params.fields.push({ link : bomViewLinksMBOM.makeBuy , value : { link : edMakeBuy} });
                }

                requests.push($.post('/plm/bom-update', params));
                elements.push(elemItem);

            }

        });

        Promise.all(requests).then(function(responses) {

            let index = 0;

            for(let response of responses) {

                let elemItem = elements[index++];
                    elemItem.removeClass('pending-update');
                    elemItem.attr('data-number-db', response.params.number);
                    elemItem.attr('data-qty', response.params.quantity);
                    
                if(config.displayOptions.bomColumnMakeBuy) {                    
                    elemItem.attr('data-make-buy', response.params.fields[0].value.link);
                }
        
            }

            updateBOMItems();

        });

    } else {

        $('#step-bar4').css('width', '100%');
        $('#step4').removeClass('in-work');
        $('#step-counter4').html(pendingActions[3] + ' of ' + pendingActions[3]);

        endProcessing();

    }
    
}
function endProcessing() {

    $('#confirm-saving').removeClass('disabled').addClass('default');
    $('.in-work').removeClass('in-work');

    let timestamp  = new Date();
    let lastSync   = timestamp.getFullYear() + '-' + (timestamp.getMonth()+1) + '-' + timestamp.getDate();
    let paramsEBOM = { link : links.ebom, sections : wsEBOM.sections, fields : [] }
    let paramsMBOM = { link : links.mbom, sections : wsMBOM.sections, fields : [] }

    paramsEBOM.fields.push({ fieldId : config.workspaceEBOM.fieldIDs.lastMBOMSync, value : lastSync });
    paramsMBOM.fields.push({ fieldId : config.workspaceMBOM.fieldIDs.lastMBOMSync, value : lastSync });
    paramsEBOM.fields.push({ fieldId : config.workspaceEBOM.fieldIDs.lastMBOMUser, value : userAccount.displayName });
    paramsMBOM.fields.push({ fieldId : config.workspaceMBOM.fieldIDs.lastMBOMUser, value : userAccount.displayName });

    $.post('/plm/edit', paramsEBOM, function() {});
    $.post('/plm/edit', paramsMBOM, function() {});

}