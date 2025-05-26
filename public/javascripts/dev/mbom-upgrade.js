let maxRequests        = 4;
let wsEBOM             = { 'id' : '', 'sections' : [], 'fields' : [], 'viewId' : '', 'viewColumns' : [] };
let wsMBOM             = { 'id' : '', 'sections' : [], 'fields' : [], 'viewId' : '', 'viewColumns' : [] };
let singleWorkspace    = false;
let links              = {};

let paramsSummary = {
    id       : 'summary',
    contents : [ { 
        type   : 'details', 
        params : {
            id               : 'summary-details', 
            collapseContents : true, 
            hideHeader       : true,
            layout           : 'narrow'
        }
    },{
        type   : 'attachments',
        params : { 
            id            : 'summary-attachments', 
            editable      : true , 
            singleToolbar : 'controls'
        }
    }],
    layout       : 'tabs',
    openInPLM    : true
}

let eBOM            = {};
let mBOM            = {};
let uBOM            = {};
let urlParameters   = getURLParameters();
let instructions    = [];
let itemsToValidate = [];
let bomListPrevious  = [];

let basePartNumber      = '';
let viewerStatusColors  = false;
let disassembleMode     = false;
let elemBOMDropped      = null;
let siteSuffix          = '';
let siteLabel           = '';

let pendingActions, pendingRemovals;
let linkEBOM, linkMBOM, linkFieldEBOMItem, linkFieldEBOMRootItem;
let sectionIdMBOM;


$(document).ready(function() {
    
    for(let option of options) {
        let param = option.split(':');
        if(param[0].toLowerCase() === 'site') {
            siteSuffix = '_' + param[1];
            siteLabel = param[1];
        }
    }

    wsEBOM.wsId = config.mbom.wsIdEBOM;
    wsMBOM.wsId = config.mbom.wsIdMBOM;

    appendProcessing('ebom', false);
    appendProcessing('mbom', false);
    appendProcessing('details');
    appendOverlay();

    getFeatureSettings('mbom', [], function() {

        insertSearchFilters();
        setUIEvents();

        // Start from context object (i.e. Asset)
        if((wsId !== wsEBOM.wsId) && (wsId !== wsEBOM.wsId)) {

            $.get('/plm/details', { link : urlParameters.link }, function(response) {

                console.log(response);
                console.log(urlParameters);
                
                let ebom = getSectionFieldValue(response.data.sections, config.mbom.fieldIdEBOM, '', 'link');
                wsId     = ebom.split('/')[4];
                dmsId    = ebom.split('/')[6];

                let contextFieldIdEBOM = urlParameters.contextfieldidebom || config.mbom.fieldIdEBOM;
                let contextFieldIdMBOM = urlParameters.contextfieldidmbom || config.mbom.fieldIdMBOM;
                let contextFieldIdPREV = urlParameters.contextfieldidprev || config.mbom.fieldIdPREV;

                links.ebom     = getSectionFieldValue(response.data.sections, contextFieldIdEBOM, '', 'link');
                links.mbom     = getSectionFieldValue(response.data.sections, contextFieldIdMBOM + siteSuffix, '', 'link');
                links.previous = getSectionFieldValue(response.data.sections, contextFieldIdPREV, '', 'link');
                
                console.log(contextFieldIdPREV);

                if(isBlank(links.mbom)) links.context = urlParameters.link;
                
                // links.ebom    = getSectionFieldValue(response.data.sections, config.mbom.fieldIdEBOM, '', 'link');
                // links.mbom    = getSectionFieldValue(response.data.sections, config.mbom.fieldIdMBOM, '', 'link');
                // links.previous = getSectionFieldValue(response.data.sections, 'EBOM_ADDITION_1',       '', 'link');


                links.start   = links.ebom;
                wsId          = links.ebom.split('/')[4];
                dmsId         = links.ebom.split('/')[6];

                console.log(links);

                getInitialData(); 

            });

        } else getInitialData();   

    });
        
});


function setUIEvents() {


    // Header Toolbar
    $('#header-logo').click(function () { reloadPage(); });
    $('#header-title').click(function () { reloadPage(); });
    $('#toggle-details').click(function() { 
        $('body').toggleClass('details-on');
        $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
        setTimeout(function() { viewer.resize(); }, 250); 
    })
    $('#reset').click(function() { reloadPage(); });  
    $('#save').click(function() {
        setSaveActions();
        showSaveProcessingDialog();
        createNewItems();
    });


    // Tabs
    $('#mode-disassemble').click(function() { 
        resetHiddenInstances();
        $('body').addClass('mode-disassemble').removeClass('mode-ebom').removeClass('mode-add').removeClass('mode-instructions');
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
        $('body').removeClass('mode-disassemble').addClass('mode-ebom').removeClass('mode-add').removeClass('mode-instructions');
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
        $('body').removeClass('mode-disassemble').removeClass('mode-ebom').addClass('mode-add').removeClass('mode-instructions');
        setTimeout(function() { viewer.resize(); }, 250); 
        disassembleMode = false;
        $(this).addClass('selected');
        $(this).siblings().removeClass('selected');
    });
    $('#mode-instructions').click(function() { 
        $('body').removeClass('mode-disassemble').removeClass('mode-ebom').removeClass('mode-add').addClass('mode-instructions');
        setTimeout(function() { viewer.resize(); }, 250); 
        disassembleMode = false;
        $(this).addClass('selected');
        $(this).siblings().removeClass('selected');
    });
    $('#mode-ebom').click();


    // EBOM Alignment
    $('#add-all').click(function() {
        $('.item.additional').find('.item-action-add').click();
    });
    $('#deselect-all').click(function() {
        $('#ebom').find('.item.selected').each(function() {
            $(this).find('.item-title').click();
        });
        viewerResetSelection(true);
    });
    $('#toggle-viewer').click(function() {
        $('#toggle-viewer').toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
        $('body').toggleClass('no-viewer')
        // viewerStatusColors = (viewerStatusColors) ? false : true;
        // setStatusBar();
        // setStatusBarFilter();
    });
    $('#toggle-colors').click(function() {
        $('#toggle-colors').toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
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
    $('#create-operation').click(function() {
        createItem('operation');
    });
    $('#create-end-item').click(function() {
        createItem('item');
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


    // Controls to add new operations in BOM
    $('#mbom-add-name').keypress(function (e) {
        insertNewProcess(e);
    });
    $('#mbom-add-code').keypress(function (e) {
        insertNewProcess(e);
    });


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
        $.get('/plm/versions'               , { link : links.start }),
        $.get('/plm/details'                , { link : links.start }),
        $.get('/plm/bom-views-and-fields'   , { wsId : wsEBOM.wsId, useCache : true }),
        $.get('/plm/sections'               , { wsId : wsEBOM.wsId, useCache : true }),
        $.get('/plm/sections'               , { wsId : wsMBOM.wsId, useCache : true }),
        $.get('/plm/workspace'              , { wsId : wsEBOM.wsId, useCache : true }),
        $.get('/plm/tableaus'               , { wsId : wsEBOM.wsId }),
        $.get('/plm/fields'                 , { wsId : wsMBOM.wsId, useCache : true })
    ];

    if(wsEBOM.wsId === wsMBOM.wsId) {

        singleWorkspace = true;
        $('#nav-workspace-views-mbom').hide();

    } else {

        requests.push($.get('/plm/bom-views-and-fields' , { wsId : wsMBOM.wsId, useCache : true }));
        requests.push($.get('/plm/workspace'            , { wsId : wsMBOM.wsId, useCache : true }));
        requests.push($.get('/plm/tableaus'             , { wsId : wsMBOM.wsId, useCache : true }));

    }

    Promise.all(requests).then(function(responses) {

        for(let view of responses[2].data) {
            if(view.name.toLowerCase() === config.mbom.bomViewNameEBOM.toLowerCase()) {
                wsEBOM.viewId       = view.id;
                wsEBOM.viewColumns  = view.fields;
            }
        }

        if(wsEBOM.viewId === '') showErrorMessage('Setup Error', 'Error in configuration, BOM view "'+ config.mbom.bomViewNameEBOM + '" could not be found in workspace '+ wsEBOM.wsId);

        $('#nav-workspace-views-ebom').html(responses[5].data.name);

        wsEBOM.tableaus = responses[6].data;

        insertViewOptions('ebom', wsEBOM.tableaus);

        if(wsEBOM.wsId === wsMBOM.wsId) {
        
            wsMBOM.viewId       = wsEBOM.viewId;
            wsMBOM.viewColumns  = wsEBOM.viewColumns;
        
        } else {

            $('#nav-workspace-views-mbom').html(responses[9].data.name);

            for(let view of responses[8].data) {
                if(view.name === config.mbom.bomViewNameMBOM) {
                    wsMBOM.viewId       = view.id;
                    wsMBOM.viewColumns  = view.fields;
                }
            }

            wsMBOM.tableaus = responses[10].data;

            insertViewOptions('mbom', wsMBOM.tableaus);

        }

        wsEBOM.sections = responses[3].data;
        wsMBOM.sections = responses[4].data;
        wsMBOM.fields   = responses[7].data;

        for(let column of wsMBOM.viewColumns) {
                 if(column.fieldId === config.mbom.fieldIdEBOMItem    ) { linkFieldEBOMItem     = column.__self__.link; }
            else if(column.fieldId === config.mbom.fieldIdEBOMRootItem) { linkFieldEBOMRootItem = column.__self__.link; }
        }

        insertCreate(null, [wsMBOM.wsId], { 
            cancelButton    : false,
            id              : 'create-item-form',
            header          : false,
            hideComputed    : true,
            hideReadOnly    : true,
            sectionsIn      : config.mbom.sectionInCreateForm,
            afterCreation   : function(id, link) { onItemCreation(link); }
        });

        if(responses[0].error) showErrorMessage('Error at startup', responses[0].data.message);

        // let linkLatest  = responses[0].data.versions[0].item.link;
        // let dmsIDLatest = linkLatest.split('/')[6];

        // if(dmsId !== dmsIDLatest) {
        //     dmsId = dmsIDLatest;
        //     $.get('/plm/details', { 'wsId' : wsId, 'dmsId' : dmsId }, function(response) {
        //         processItemData(response.data);
        //     });
        // } else {
        //     processItemData(responses[1].data);
        // }

        links.latest = responses[0].data.versions[0].item.link;

        if(links.start !== links.latest) {
            links.start = links.latest;
            $.get('/plm/details', { link : links.start }, function(response) {
                processItemData(response.data);
            });
        } else {
            processItemData(responses[1].data);
        }

    });

}
function insertViewOptions(suffix, tableaus) {

    for(let tableau of tableaus) {

        $('<option></option>').appendTo($('#view-selector-' + suffix))
            .attr('value', tableau.link)
            .html(tableau.title);

    }

}



// Process Item Details and set BOM Trees
// function processItemData(itemDetails, fieldsEBOMView, fieldsMBOMView) {
function processItemData(itemDetails) {

    $('#header-subtitle').html(itemDetails.title);

    let valueEBOM = getSectionFieldValue(itemDetails.sections, config.mbom.fieldIdEBOM, '', 'link');
    let valueMBOM = getSectionFieldValue(itemDetails.sections, config.mbom.fieldIdMBOM + siteSuffix, '', 'link');
    
    console.log(valueEBOM);
    console.log(valueMBOM);

    if(valueEBOM !== '') {
        
        links.mbom = links.start;
        links.ebom = valueEBOM;

        $.get('/plm/details', { link : links.ebom}, function(response) {
            basePartNumber = getSectionFieldValue(response.data.sections, config.mbom.fieldIdNumber, '', null);
            processRoots(itemDetails);
        });

    } else {

        links.ebom = links.start;
        links.mbom = valueMBOM;

        basePartNumber = getSectionFieldValue(itemDetails.sections, config.mbom.fieldIdNumber, '', null);
        processRoots(itemDetails);

    }
}
function processRoots(itemDetails) {

    insertViewer(links.ebom);

    createMBOMRoot(itemDetails, function() {

        let requests = [];

        requests.push($.get('/plm/bom', {     
            link          : links.ebom,
            viewId        : wsEBOM.viewId,
            depth         : 10,
            revisionBias  : config.mbom.revisionBias
        }));

        requests.push($.get('/plm/bom', {     
            link          : links.mbom,
            viewId        : wsMBOM.viewId,
            depth         : 10,
            revisionBias  : config.mbom.revisionBias
        }));

        storeContextMBOMLink();

        if(!isBlank(links.previous)) {

            requests.push($.get('/plm/bom', {     
                link          : links.previous,
                viewId        : wsEBOM.viewId,
                depth         : 10,
                revisionBias  : config.mbom.revisionBias
            }));

        }

        Promise.all(requests).then(function(responses) {

            console.log(responses);

            eBOM = responses[0].data;
            mBOM = responses[1].data;

            if(!isBlank(links.previous)) uBOM = responses[2].data;

            console.log(uBOM);
            console.log(mBOM);

            // linkEBOM = '/api/v3/workspaces/' + wsEBOM.wsId + '/items/' + eBOM.root.split('.')[5];
            // linkMBOM = '/api/v3/workspaces/' + wsMBOM.wsId + '/items/' + mBOM.root.split('.')[5];

            links.ebom = '/api/v3/workspaces/' + wsEBOM.wsId + '/items/' + eBOM.root.split('.')[5];
            links.mbom = '/api/v3/workspaces/' + wsMBOM.wsId + '/items/' + mBOM.root.split('.')[5];

            eBOM.edges.sort(function(a, b){ return a.itemNumber - b.itemNumber });
            mBOM.edges.sort(function(a, b){ return a.itemNumber - b.itemNumber });

            insertItemSummary(links.ebom, paramsSummary);
            initEditor();

        });
            
    });
        
}
function createMBOMRoot(itemDetails, callback) {

    console.log('createMBOMRoot');
    console.log(links);

    if(links.mbom !== '') {
        
        callback();
        
    } else {

        let params = {
            wsId      : wsMBOM.wsId,
            sections  : []
        };

        addFieldToPayload(params.sections, wsMBOM.sections, null, config.mbom.fieldIdEBOM, { 'link' : itemDetails.__self__ } );

        for(let fieldToCopy of config.mbom.fieldsToCopy) {
            let field = getSectionField(itemDetails.sections, fieldToCopy);
            addFieldToPayload(params.sections, wsMBOM.sections, null, fieldToCopy, field.value);
        }

        if(!isBlank(config.mbom.fieldIdNumber)) {
            if(!isBlank(config.mbom.suffixItemNumber)) {
                basePartNumber += config.mbom.suffixItemNumber + siteLabel
                addFieldToPayload(params.sections, wsMBOM.sections, null, config.mbom.fieldIdNumber, basePartNumber);
            }
        }

        for(let newDefault of config.mbom.newDefaults) {
            addFieldToPayload(params.sections, wsMBOM.sections, null, newDefault[0], newDefault[1]);
        }

        console.log(params);

        $.post({
            url         : '/plm/create', 
            contentType : 'application/json',
            data        : JSON.stringify(params)
        }, function(response) {
            if(response.error) {
                showErrorMessage('Error', 'Error while creating MBOM root item, the editor cannot be used at this time. Please review your server configuration.');
            } else {
                links.mbom = response.data.split('.autodeskplm360.net')[1];
                storeMBOMLink(links.ebom, links.mbom);
                callback();
            }
        }); 
            
    }
    
}
function storeMBOMLink(linkUpdate, linkMBOM) {

    let timestamp  = new Date();
    let value      = timestamp.getFullYear() + '-' + (timestamp.getMonth()+1) + '-' + timestamp.getDate();
    let params     = { link : linkUpdate, sections : [] }

    addFieldToPayload(params.sections, wsEBOM.sections, null, config.mbom.fieldIdMBOM     + siteSuffix, { link : linkMBOM });
    addFieldToPayload(params.sections, wsEBOM.sections, null, config.mbom.fieldIdLastSync + siteSuffix, value);
    addFieldToPayload(params.sections, wsEBOM.sections, null, config.mbom.fieldIdLastUser + siteSuffix, userAccount.displayName);

    $.post('/plm/edit', params, function() {});

}
// function storeMBOMLink(ebomLink, mbomLink) {

//     let timestamp  = new Date();
//     let value      = timestamp.getFullYear() + '-' + (timestamp.getMonth()+1) + '-' + timestamp.getDate();
//     let paramsEBOM = { 'link' : ebomLink, 'sections'   : [] }

//     addFieldToPayload(paramsEBOM.sections, wsEBOM.sections, null, config.mbom.fieldIdMBOM     + siteSuffix, { 'link' : mbomLink });
//     addFieldToPayload(paramsEBOM.sections, wsEBOM.sections, null, config.mbom.fieldIdLastSync + siteSuffix, value);
//     addFieldToPayload(paramsEBOM.sections, wsEBOM.sections, null, config.mbom.fieldIdLastUser + siteSuffix, userAccount.displayName);

//     $.post('/plm/edit', paramsEBOM, function() {});

// }
function storeContextMBOMLink() {

    if(isBlank(links.context)) return;

    let requests = [
        $.get('/plm/details' , { link : links.context }),
        $.get('/plm/sections', { link : links.context })
    ]

    console.log(links.mbom);

    Promise.all(requests).then(function(responses) {

        let contextFieldIdMBOM = urlParameters.contextfieldidmbom || config.mbom.fieldIdMBOM

        let valueMBOM = getSectionFieldValue(responses[0].data.sections, contextFieldIdMBOM, '', 'link');
        
        if(isBlank(valueMBOM)) {

            let params = { link : links.context, sections : [] }

            addFieldToPayload(params.sections, responses[1].data, null, contextFieldIdMBOM, { link : links.mbom });

            console.log(params);

            $.post('/plm/edit', params, function() {});

        }

    });

}
function initEditor() {
    
    $('#ebom').find('.processing').hide();
    $('#mbom').find('.processing').hide();

    setEBOM($('#ebom-tree'), eBOM.root, 1, null);
    setMBOM($('#mbom-tree'), mBOM.root, 1, null, '');

    $('#mbom-tree').find('.item-head').first().attr('id', 'mbom-root-head');
    $('#mbom-tree').find('.item').first().addClass('selected-target');
    
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



// Set & update status bar
function setStatusBar() {
    
    let countAdditional = 0;
    let countDifferent  = 0;
    let countMatch      = 0;
    
    let listEBOM = [];
    let listMBOM = [];
    let qtysEBOM = [];
    let qtysMBOM = [];

    let listRed     = [];
    let listYellow  = [];
    let listGreen   = [];
    
    $('#ebom').find('.item').each(function() {
        if(!$(this).hasClass('item-has-bom')) {
            let link = $(this).attr('data-link');
            $(this).removeClass('additional');
            $(this).removeClass('different');
            $(this).removeClass('match');
            $(this).removeClass('neutral');
            $(this).removeClass('enable-update');
            if(listEBOM.indexOf(link) === -1) {
                listEBOM.push(link);
                qtysEBOM.push(Number($(this).attr('data-total-qty')));
            }
        }
    });

    $('#mbom').find('.item.is-ebom-item').each(function() {
        if(!$(this).hasClass('root')) {
            if(!$(this).hasClass('operation')) {
                if(!$(this).hasClass('mbom-item')) {

                    $(this).removeClass('additional');
                    $(this).removeClass('different');
                    $(this).removeClass('match');
                    $(this).removeClass('neutral');

                    let link     = $(this).attr('data-link');
                    let linkEBOM = $(this).attr('data-link-ebom');
                
                    if(typeof linkEBOM !== 'undefined') link = linkEBOM;

                    let index = listMBOM.indexOf(link);
                    let qty   = Number($(this).find('.item-qty-input').val());

                    if(index === -1) {
                        listMBOM.push(link);
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
            let index    = listMBOM.indexOf(ebomLink); 
            let qty      = qtysEBOM[listEBOM.indexOf(ebomLink)];
            if(listMBOM.indexOf(ebomLink) === -1) {
                countAdditional++;
                if(listRed.indexOf(partNumber) === -1) listRed.push(partNumber);
                $(this).addClass('additional');
            } else if(qtysMBOM[index] === qty) {
                $(this).addClass('match');
                countMatch++;
                if(listGreen.indexOf(partNumber) === -1) listGreen.push(partNumber);
            } else {
                $(this).addClass('different');
                countDifferent++;
                if(listYellow.indexOf(partNumber) === -1) listYellow.push(partNumber);
                if($(this).attr('data-instance-qty') === $(this).attr('data-total-qty')) {  

                    let countMBOMInstances = 0;

                    $('#mbom').find('.item').each(function() {

                        let mbomLink = $(this).attr('data-link');
                        if(ebomLink === mbomLink) {
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
            if(!$(this).hasClass('operation')) {
                
                let mbomLink = $(this).attr('data-link');
                let ebomLink = $(this).attr('data-link-ebom');
                
                if(typeof ebomLink !== 'undefined') mbomLink = ebomLink;
                
                let index   = listEBOM.indexOf(mbomLink); 
                let qty     = qtysMBOM[listMBOM.indexOf(mbomLink)];

                if(index === -1) {
                    countAdditional++;
                    $(this).addClass('additional');
                } else if(qtysEBOM[index] === qty) {
                    $(this).addClass('match');
                } else {
                    $(this).addClass('different');
                }
            }
        }
    });
    
    $('#status-additional').css('flex', countAdditional + ' 1 0%');
    $('#status-different').css('flex', countDifferent + ' 1 0%');
    $('#status-match').css('flex', countMatch + ' 1 0%');
    
    if(countAdditional === 0) $('#status-additional').css('border-width', '0px');  else $('#status-additional').css('border-width', '5px');
    if(countDifferent  === 0) $('#status-different' ).css('border-width', '0px');  else $('#status-different' ).css('border-width', '5px');
    if(countMatch      === 0) $('#status-match'     ).css('border-width', '0px');  else $('#status-match'     ).css('border-width', '5px');
    
    if(!isViewerStarted()) return; 

    viewerResetColors();

    if(viewerStatusColors) {
        viewerSetColors(listRed    , { keepHidden : true, unhide : false, resetColors : false, color : config.vectors.red}    );
        viewerSetColors(listYellow , { keepHidden : true, unhide : false, resetColors : false, color : config.vectors.yellow} );
        viewerSetColors(listGreen  , { keepHidden : true, unhide : false, resetColors : false, color : config.vectors.green}  );
    }

}



// Input controls to add new items to MBOM
function insertNewProcess(e) {
    
    if (e.which == 13) {

        if($('#mbom-add-name').val() === '') return;

        let elemNew = getBOMNode(2, '', '', '', '', $('#mbom-add-name').val(), '', '', '', $('#mbom-add-code').val(), 'radio_button_unchecked', '', 'mbom', '', false);
            elemNew.attr('data-parent', '');
            elemNew.addClass('operation');
            elemNew.addClass('neutral');
        
        let elemBOM = $('#mbom-tree').children().first().children('.item-bom').first();

        if(disassembleMode) elemBOM.prepend(elemNew);
        else elemBOM.append(elemNew);

        selectProcess(elemNew);
        
        $('#mbom-add-name').val('');
        $('#mbom-add-code').val('');
        $('#mbom-add-name').focus();
        
    }
    
}



// Display EBOM information
function setEBOM(elemParent, urn, level, qty) {

    let descriptor  = getDescriptor(eBOM, urn);
    let nodeLink    = getLink(eBOM, urn);
    let rootLink    = getRootLink(eBOM, urn);
    let partNumber  = getNodeProperty(eBOM, urn, wsEBOM.viewColumns, config.items.fieldIdNumber, '');
    let category    = getNodeProperty(eBOM, urn, wsEBOM.viewColumns, config.mbom.fieldIdCategory, '');
    let type        = getNodeProperty(eBOM, urn, wsEBOM.viewColumns, 'TYPE', '');
    let code        = getNodeProperty(eBOM, urn, wsEBOM.viewColumns, config.mbom.fieldIdProcessCode, '');
    let icon        = getIconClassName(nodeLink);
    let ignoreMBOM  = getNodeProperty(eBOM, urn, wsEBOM.viewColumns, config.mbom.fieldIdIgnoreInMBOM, '');
    let hasMBOM     = getNodeLink(eBOM, urn, wsEBOM.viewColumns, config.mbom.fieldIdMBOM + siteSuffix, '');
    let isLeaf      = isEBOMLeaf(level, urn, hasMBOM);

    if(ignoreMBOM !== 'true') {
    
        let elemNode = getBOMNode(level, urn, nodeLink, rootLink, rootLink, descriptor, partNumber, category, type, code, icon, qty, 'ebom', hasMBOM, isLeaf, level);
            elemNode.appendTo(elemParent);
            
        if(hasMBOM !== '') elemNode.attr('data-link-mbom', hasMBOM);

        if(level === 1) elemNode.addClass('root');
        else elemNode.addClass('leaf');
        
    }
    
}
function isEBOMLeaf(level, urn, hasMBOM) {

    let endItem     = getNodeProperty(eBOM, urn, wsEBOM.viewColumns, config.mbom.fieldIdEndItem,     '');
    let matchesMBOM = getNodeProperty(eBOM, urn, wsEBOM.viewColumns, config.mbom.fieldIdMatchesMBOM, '');
    
    if(level === 1) return false;
    if(hasMBOM !== '') return true;
    if(endItem === 'true') return true;
    if(matchesMBOM === 'true') return true;
    
    for(let edgeEBOM of eBOM.edges) {
        if(edgeEBOM.parent === urn) {
            if(getNodeProperty(eBOM, edgeEBOM.child, wsEBOM.viewColumns, config.mbom.fieldIdIgnoreInMBOM, '') !== true) {
                return  false;   
            }
        }
    }
        
    return true;
    
}
function getBOMNode(level, urn, nodeLink, rootLink, linkEBOMRoot, descriptor, partNumber, category, type, code, icon, qty, bomType, bomMatch, isLeaf, level) {
    
    category = category.replace(/ /g, '-').toLowerCase();
    type     = type.replace(/ /g, '-').toLowerCase();

    let elemNode = $('<div></div>')
        .addClass('item')
        .attr('category', category)
        .attr('data-code', code)
        .attr('data-urn', urn)
        .attr('data-level', level)
        .attr('data-link', nodeLink)
        .attr('data-root', rootLink)
        .attr('data-ebom-root', linkEBOMRoot)
        .attr('data-part-number', partNumber);

    if(bomType === 'ebom') {
        if(level === 2) {
            itemsToValidate.push(elemNode);
        }
    }
    
    let elemNodeHead = $('<div></div>').appendTo(elemNode)
        .addClass('item-head');
    
    let elemNodeToggle = $('<div></div>').appendTo(elemNodeHead)
        .addClass('item-toggle');
    
    let elemNodeIcon = $('<div></div>').appendTo(elemNodeHead)
        .addClass('item-icon')
        .html('<span class="icon radio-unchecked">' + icon + '</span><span class="icon radio-checked">radio_button_checked</span>');
    
    let elemNodeTitle = $('<div></div>').appendTo(elemNodeHead)
        .addClass('item-title')
        .attr('title', descriptor);
    
    $('<span></span>').appendTo(elemNodeTitle)
        .addClass('item-head-descriptor')
        .html(descriptor)

    $('<span class="icon">open_in_new</span>').appendTo(elemNodeTitle)
        .addClass('item-link')
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

    $('<span class="icon">filter_list</span>').appendTo(elemNodeTitle)
        .addClass('item-link')
        .attr('title', 'Click to toggle filter for this component in viewer, EBOM and MBOM')
        .click(function(e) {
            e.stopPropagation();
            e.preventDefault();
            selectBOMItem($(this), true);
        });

    $('<div></div>').appendTo(elemNodeHead)
        .addClass('item-code')
        .html(code)
        .attr('title', 'Process Code');

    let elemNodeQty = $('<div></div>').appendTo(elemNodeHead)
        .addClass('item-qty');
    
    let elemQtyInput = $('<input></input>').appendTo(elemNodeQty)
        .attr('type', 'number')
        .attr('title', 'Quantity')
        .addClass('item-qty-input');
    
    $('<div></div>').appendTo(elemNodeHead)
        .addClass('item-head-status')
        .attr('title', 'EBOM / MBOM match indicator\r\n- Green : match\r\n- Red : missing in MBOM\r\n- Orange : quantity mismatch');
    
    let elemNodeActions = $('<div></div>').appendTo(elemNodeHead)
        .addClass('item-actions');
    
    if(qty !== null) {
        elemQtyInput.val(qty);
        elemNodeHead.attr('data-qty', qty);
        elemNodeTitle.attr('data-qty', qty);
        elemNode.attr('data-qty', qty);
    };
    
    if(category !== '') elemNode.addClass('category-' + category);
    if(type     !== '') elemNode.addClass('type-' + type);
    

    if(bomType === 'ebom') {

        elemNode.addClass('is-ebom-item');
        elemQtyInput.attr('disabled', 'disabled');
        elemNodeIcon.attr('title', 'EBOM item');

        elemNodeTitle.click(function(e) {
            e.stopPropagation();
            e.preventDefault();
            selectBOMItem($(this), false);
        });

        if(!isLeaf) {
            
            elemNode.addClass('item-has-bom');
        
            let elemNodeBOM = $('<div></div>').appendTo(elemNode)
                .addClass('item-bom');
    
            for(let edgeEBOM of eBOM.edges) {
                if(edgeEBOM.depth === level) {
                    if(edgeEBOM.parent === urn) { 
                        let childQty = Number(getEdgeProperty(edgeEBOM, wsEBOM.viewColumns, 'QUANTITY', '0.0'));
                        setEBOM(elemNodeBOM, edgeEBOM.child, level + 1, childQty);
                    }
                }
            }

            if(level > 1) addBOMToggle(elemNodeToggle);

            addActionIcon('playlist_add', elemNodeActions)
                .addClass('item-action-add-all')
                .attr('title', 'Add all subcomponents to MBOM')
                .click(function() {
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
                .click(function() {

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
                .click(function() {
                    
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
                .click(function() {
                    
                    let elemItem = $(this).closest('.item');
                        elemItem.addClass('to-convert');

                    let itemName = elemItem.find('.item-head-descriptor').first().html();

                    $('#convert-item-name').html(itemName);
                    $('#dialog-convert').show();
                    $('#overlay').show();

                });
            
            
        } else {

            if(bomMatch !== '') addMBOMShortcut(elemNodeToggle);
           
            addAction('Add', elemNodeActions)
                .addClass('item-action-add')
                .attr('title', 'Add this component with matching quantity to MBOM on right hand side')
                .click(function() {
                    insertFromEBOMToMBOM($(this));
                    setStatusBar();
                    setStatusBarFilter();
                });

            addAction('Update', elemNodeActions)
                .addClass('item-action-update')
                .click(function() {
                    updateFromEBOMToMBOM($(this));
                    setStatusBar();
                    setStatusBarFilter();
                });
            
        }
        
    } else {
                
        insertMBOMSelectEvent(elemNode);
        insertMBOMQtyInputControls(elemQtyInput);
        insertMBOMActions(elemNodeActions);

        // TODO load instructions at startup
        // let note = getEdgeProperty(edgeEBOM, wsMBOM.viewColumns, config.mbom.fieldIdInstructions, '');
                        
        // instructions.push({
        //     'link'      : nodeLink,
        //     'edge'      : edgeEBOM,
        //     'note'      : note,
        //     'markup'    : ''
        // });
        
        if(bomMatch !== '') addMBOMShortcut(elemNodeToggle);

        if(isLeaf) {
            
            $('#ebom').find('.item').each(function() {
            
                var urnEBOM = $(this).attr('data-urn');
                var catEBOM = $(this).attr('category');
                if(urnEBOM === urn) {
                    if(typeof urnEBOM !== 'undefined') {
                        elemNode.addClass(catEBOM);
                    }
                }
            
            });
        
        } else {
            
            let elemNodeBOM = $('<div></div>');
                elemNodeBOM.addClass('item-bom');
                elemNodeBOM.appendTo(elemNode);

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

                            if(isNew) insertAdditionalItem($(this), itemDragged.html(), itemDragged.attr('data-urn'), itemDragged.attr('data-link'));
                    
                        }

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
function getEdgeProperty(edge, cols, fieldId, defValue) {
    
    let id = getViewFieldId(cols, fieldId);
    
    for(let field of edge.fields) {
        
        let fieldIdBOM  = Number(field.metaData.link.split('/')[10]);
        if(fieldIdBOM === id) return field.value;
    }
    
    return defValue;
    
}
function getNodeProperty(list, urn, cols, fieldId, defValue) {

    let id = getViewFieldId(cols, fieldId);

    if(id === '') return defValue;
    
    for(let node of list.nodes) {
        
        if(node.item.urn === urn) {

            for(let field of node.fields) {

                let fieldId = Number(field.metaData.link.split('/')[10]);
                
                if(id === fieldId) {
                    if(typeof field.value === 'object') {
                        return field.value.title;
                    } else {
                        return field.value;    
                    }
                }
                
            }
            
            return defValue;
            
        }
        
    }
    
    return defValue;
    
}
function getNodeLink(list, urn, cols, fieldId, defValue) {

    let id = getViewFieldId(cols, fieldId);
  
    if(id === '') return defValue;
    
    for(let node of list.nodes) {
        
        if(node.item.urn === urn) {
            
            for(let field of node.fields) {
                
                let fieldId = Number(field.metaData.link.split('/')[10]);
                
                if(id === fieldId) {

                    return field.value.link;

                    // if(typeof field.value === 'object') {
                    //     return field.value.urn;
                    // } else {
                    //     return field.value;    
                    // }
                }
                
            }
            
            return defValue;
            
        }
        
    }
    
    return defValue;
    
}
function getViewFieldId(cols, fieldId) {
    
    for(let col of cols) {
        if(col.fieldId === fieldId) return col.viewDefFieldId;
    }
    
    return '';
    
}
function insertFromEBOMToMBOM(elemAction) {
    
    let elemItem    = elemAction.closest('.item');
    let code        = elemItem.attr('data-code');
    let category    = elemItem.attr('category');
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
            clone.click(function(e) {
                // console.log('new target clicked');
            });
            
            let elemQtyInput = clone.find('.item-qty-input');
                elemQtyInput.removeAttr('disabled');
                elemQtyInput.keyup(function (e) {
                    //if (e.which == 13) {
                        // $(this).closest('.item').attr('data-qty', $(this).val());
                        $(this).closest('.item').attr('data-instance-qty', $(this).val());
                        setStatusBar();
                        setBOMPanels($(this).closest('.item').attr('data-link'));
                    //}
                });
                elemQtyInput.click(function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    $(this).select();
                });

            let elemActions = clone.find('.item-actions');
                elemActions.html('');

            insertMBOMActions(elemActions);

        }

    }
    

}
function updateFromEBOMToMBOM(elemAction) {
    
    let elemItem    = elemAction.closest('.item');
    let link        = elemItem.attr('data-link');
    let qty         = elemItem.attr('data-instance-qty');
    
    let listMBOM = $('#mbom').find('[data-link="' + link + '"]');
    
    if(listMBOM.length === 1) {
        listMBOM.find('.item-qty-input').val(qty);
        setStatusBar();
        if(elemItem.hasClass('selected')) setBOMPanels(link);
    }
    
}
function insertEBOMtoMBOM() {

    $('#dialog-insert').hide();

    let elemItem = $('.item.to-insert');

    if(elemItem.length > 0) {

        let params = {
            'link'      : elemItem.attr('data-link'),
            'sections'  : []
        };

        addFieldToPayload(params.sections, wsEBOM.sections, null, config.mbom.fieldIdMatchesMBOM, true );

        $.post('/plm/edit', params, function(response) {
        
            if(response.error) {

                showErrorMessage('Error', 'Error while updating item with Matches MBOM flag');

            } else {

                let elemItem        = $('.item.to-insert');
                let elemItemHead    = elemItem.children('.item-head');
                let elemItemToggle  = elemItemHead.children('.item-toggle');
                let elemItemActions = elemItemHead.children('.item-actions');
        
                elemItem.children('.item-bom').remove();
                elemItem.removeClass('item-has-bom');
                elemItemToggle.children().remove();
                elemItemActions.children().remove();

                setTotalQuantities();

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

    let elemItem     = $('.item.to-convert');
    let link         = elemItem.attr('data-link');
    let linkEBOMRoot = elemItem.attr('data-ebom-root');

    if(elemItem.length > 0) {

        let requests = [
            $.get('/plm/details', { 'link' : link }),
            $.get('/plm/bom', { 'link' : link, 'depth' : 1, 'viewId' : wsEBOM.viewId})
        ];

        Promise.all(requests).then(function(responses) {

            let params = {
                'wsId'      : wsMBOM.wsId,
                'sections'  : []
            };

            addFieldToPayload(params.sections, wsMBOM.sections, null, config.mbom.fieldIdEBOM, { 'link' : link } );

            for(let fieldToCopy of config.mbom.fieldsToCopy) {
                let value = getSectionFieldValue(responses[0].data.sections, fieldToCopy, '', 'link');
                addFieldToPayload(params.sections, wsMBOM.sections, null, fieldToCopy, value);
            }

            let partNumber = getSectionFieldValue(responses[0].data.sections, config.mbom.fieldIdNumber, '', null);

            if(!isBlank(config.mbom.fieldIdNumber)) {
                if(!isBlank(config.mbom.suffixItemNumber)) {
                    partNumber += config.mbom.suffixItemNumber + siteLabel
                    addFieldToPayload(params.sections, wsMBOM.sections, null, config.mbom.fieldIdNumber, partNumber);
                }
            }

            for(let newDefault of config.mbom.newDefaults) {
                addFieldToPayload(params.sections, wsMBOM.sections, null, newDefault[0], newDefault[1]);
            }

            $.post({
                url         : '/plm/create', 
                contentType : 'application/json',
                data        : JSON.stringify(params)
            }, function(response) {
                if(response.error) {
                    showErrorMessage('Error', 'Error while creating matching MBOM item, please review your server configuration and logs');
                } else {

                    let linkNew     = response.data.split('.autodeskplm360.net')[1];
                    let wsIdParent  = linkNew.split('/')[4]
                    let dmsIdParent = linkNew.split('/')[6];

                    elemItem.attr('data-link-mbom', linkNew);
                    
                    storeMBOMLink(link, linkNew);
                    copyBOM(wsIdParent, dmsIdParent, linkEBOMRoot, responses[1].data);

                }

            }); 

        });

    }

}
function copyBOM(wsIdParent, dmsIdParent, linkEBOMRoot, bom) {

    if(bom.edges.length === 0) {

        let elemItem        = $('.item.to-convert');
        let elemItemHead    = elemItem.children('.item-head');
        let elemItemToggle  = elemItemHead.children('.item-toggle');
        let elemItemActions = elemItemHead.children('.item-actions');

        elemItem.children('.item-bom').remove();
        elemItem.removeClass('item-has-bom');
        elemItemToggle.children().remove();
        elemItemActions.children().remove();

        setTotalQuantities();
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

    } else {
        
        
        let requests = [];

        for(let edge of bom.edges) {


            if(requests.length < maxRequests) {

                let params = {
                    'wsIdParent'    : wsIdParent,
                    'dmsIdParent'   : dmsIdParent,
                    'wsIdChild'     : edge.child.split('.')[4],
                    'dmsIdChild'    : edge.child.split('.')[5],
                    'quantity'      : Number(getEdgeProperty(edge, wsEBOM.viewColumns, 'QUANTITY', '0.0')),
                    'pinned'        : config.mbom.pinMBOMItems,
                    'number'        : edge.itemNumber,
                    'fields'        : [
                        { 'link' : linkFieldEBOMItem,     'value' : true         },
                        { 'link' : linkFieldEBOMRootItem, 'value' : linkEBOMRoot }
                    ]
                }
                
                let childMBOMLink = getNodeLink(bom, edge.child, wsEBOM.viewColumns, config.mbom.fieldIdMBOM + siteSuffix, '');

                if(childMBOMLink !== '') {
                    params.wsIdChild  = childMBOMLink.split('/')[4];
                    params.dmsIdChild = childMBOMLink.split('/')[6];
                }

                requests.push($.post('/plm/bom-add', params));

            }

        }

        Promise.all(requests).then(function(responess) {
            bom.edges.splice(0, maxRequests);
            copyBOM(wsIdParent, dmsIdParent, linkEBOMRoot, bom);
        });

    }

}
function setEBOMEndItem() {

    $('#dialog-end-item').hide();

    let elemItem = $('.item.to-end');

    if(elemItem.length > 0) {

        let params = {
            'link'      : elemItem.attr('data-link'),
            'sections'  : []
        };

        addFieldToPayload(params.sections, wsEBOM.sections, null, config.mbom.fieldIdEndItem, true);

        $.post('/plm/edit', params, function(response) {
        
            if(response.error) {

                showErrorMessage('Error', 'Error while updating End Item flag of item ' + params.link);

            } else {

                let elemItem        = $('.item.to-end');
                let elemItemHead    = elemItem.children('.item-head');
                let elemItemToggle  = elemItemHead.children('.item-toggle');
                let elemItemActions = elemItemHead.children('.item-actions');
        
                elemItem.children('.item-bom').remove();
                elemItem.removeClass('item-has-bom');
                elemItemToggle.children().remove();
                elemItemActions.children().remove();

                setTotalQuantities();

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




// Display MBOM information
function setMBOM(elemParent, urn, level, qty, urnParent, additionalItem) {

    let descriptor   = getDescriptor(mBOM, urn);
    let nodeLink     = getLink(mBOM, urn);
    let rootLink     = getRootLink(mBOM, urn);
    let partNumber   = getNodeProperty(mBOM, urn, wsMBOM.viewColumns, config.items.fieldIdNumber, '');
    let category     = getNodeProperty(mBOM, urn, wsMBOM.viewColumns, 'TYPE', '');
    let type         = getNodeProperty(mBOM, urn, wsMBOM.viewColumns, 'TYPE', '');
    let code         = getNodeProperty(mBOM, urn, wsMBOM.viewColumns, config.mbom.fieldIdProcessCode, '');
    let edge         = getMBOMEdge(urn, urnParent);
    let edges        = [];
    let isProcess    = isMBOMProcess(urn, level);
    let isEBOMItem   = checkEBOMItem(edge);
    let linkEBOMRoot = getEdgeProperty(edge, wsMBOM.viewColumns, config.mbom.fieldIdEBOMRootItem, '');
    let nodeLinkEBOM = getNodeLink(mBOM, urn, wsMBOM.viewColumns, config.mbom.fieldIdEBOM, '');
    let icon         = getIconClassName(nodeLink, isProcess, isEBOMItem);
    let isLeaf       = isMBOMLeaf(urn, level);
    let itemNumber   = getMBOMEdgeNumber(urn, urnParent);

    let hasInstructions = hasNodeInstructions(edge.edgeId, partNumber, nodeLink);

    // isProcess = (type === 'Process') ? true : false;

    if(isBlank(additionalItem)) additionalItem = false;

    if(additionalItem) {
        isProcess = true; 
        isLeaf    = false;
    } else if(isProcess) isLeaf = false;
    
    let elemNode = getBOMNode(level, urn, nodeLink, rootLink, linkEBOMRoot, descriptor, partNumber, category, type, code, icon, qty, 'mbobm', nodeLinkEBOM, isLeaf);
//        elemNode.addClass('neutral');
        elemNode.attr('data-parent', urnParent);
        elemNode.attr('data-edge', edge.edgeId);
        elemNode.attr('data-edges', '');
        // elemNode.attr('data-ebom-item', isEBOMItem);
        // elemNode.attr('data-number', itemNumber);
        elemNode.attr('data-number-db', itemNumber);
        elemNode.appendTo(elemParent);   
    
    if(isEBOMItem) { 
        elemNode.addClass('is-ebom-item'); 
    } else { 
        elemNode.addClass('mbom-item');    
        // elemNode.attr('title', 'This is a manufacturing specific item which is not contained in the EBOM');
    }

    if(nodeLinkEBOM !== '') {

        elemNode.attr('data-link-ebom', nodeLinkEBOM);
        elemNode.attr('data-link-mbom', nodeLink);
        
        $('#ebom').find('.leaf').each(function() {
            
            let link = $(this).attr('data-link');
            
            if(link === nodeLinkEBOM) {
                
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
    
    if(level === 1) {
        elemNode.addClass('root');
    } else if(isProcess) {
        if(level === 2) {
            elemNode.addClass('neutral');
            elemNode.addClass('operation');
        }
    }

    // if(icon === 'factory') {
    //     elemNode.attr('title', 'This is a manufacturing specific item being managed in the Items & BOMS workspace');
    //     elemNode.addClass('mbom-item');
    // }
    
    if(isLeaf) {

        elemNode.addClass('leaf');

    } else {
        
        let elemNodeBOM = elemNode.find('.item-bom').first();
        
        for(let edgeMBOM of mBOM.edges) {
            if(edgeMBOM.depth === level) {
                if(edgeMBOM.parent === urn) {
                    edges.push(edgeMBOM.edgeId);
                    let childQty = Number(getEdgeProperty(edgeMBOM, wsMBOM.viewColumns, 'QUANTITY', '0.0'))
                    setMBOM(elemNodeBOM, edgeMBOM.child, level + 1, childQty, urn);
                }
            }
        }
        
        elemNode.attr('data-edges', edges.toString());
        
    }
    console.log(uBOM);
    
    bomListPrevious = getBOMPartsList({
        viewFields : wsEBOM.viewColumns
    }, uBOM);

    console.log(bomListPrevious);

    applyUpgradeFilter();

    return elemNode;
    
}
function isMBOMProcess(urn, level)  {

    if(level === 1) return true;

    let isProcess = getNodeProperty(mBOM, urn, wsMBOM.viewColumns, config.mbom.fieldIdIsProcess, '');

    if(isBlank(isProcess)) {
        return false;
    } else if(isProcess.toUpperCase() === 'TRUE') {
        return true;
    }
    
    return false;

}
function checkEBOMItem(edge)  {

    let isEBOMItem = getEdgeProperty(edge, wsMBOM.viewColumns, config.mbom.fieldIdEBOMItem, 'false');
    
    return (isEBOMItem.toLowerCase() === 'true')
    
}
function isMBOMLeaf(urn, level) {
    
    let endItem     = getNodeProperty(eBOM, urn, wsEBOM.viewColumns, config.mbom.fieldIdEndItem,     '');
    let matchesMBOM = getNodeProperty(eBOM, urn, wsEBOM.viewColumns, config.mbom.fieldIdMatchesMBOM, '');

    if(level === 1) return false;    
    if(level === 3) return true;
    if(endItem === 'true') return true;
    if(matchesMBOM === 'true') return true;
    
    for(let edgeMBOM of eBOM.edges) {
        if(edgeMBOM.parent === urn) return false;
    }
    
    return true;
    
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
    });

}
function insertMBOMQtyInputControls(elemQtyInput) {

    elemQtyInput.click(function(e) {
        e.stopPropagation();
        e.preventDefault();
        $(this).select();
    });

    elemQtyInput.on("change paste keyup", function(e) {
        $(this).closest('.item').attr('data-instance-qty', $(this).val());
        setStatusBar();
        setBOMPanels($(this).closest('.item').attr('data-link'));
    });

    elemQtyInput.focusout(function() {
        $('body').removeClass('bom-panel-on');
    });

    elemQtyInput.attr('title', 'Set quantity of this component');


}
function insertMBOMActions(elemActions) {

    elemActions.html('');

    addActionIcon('visibility', elemActions)
        .attr('title', 'Only show components in viewer required until this step')
        .addClass('button-view')
        .click(function(event) {

            event.stopPropagation();
            event.preventDefault();
            
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

    addActionIcon('delete_forever', elemActions)
        .attr('title', 'Remove this component instance from MBOM')
        .addClass('button-remove')
        .click(function() {

            event.stopPropagation();
            event.preventDefault();

            $(this).closest('.item').remove();
            restoreAssembly();
            setStatusBar();
            setStatusBarFilter();
            selectAdjacentMBOMModels();

        });

    addActionIcon('content_copy', elemActions)
        .attr('title', 'Copy this item to selected target')
        .addClass('button-copy')
        .click(function(event) {
        
            event.stopPropagation();
            event.preventDefault();

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

}
function hasNodeInstructions(edge, partNumber, nodeLink) {

    if(edge !== '') {
        for(let edgeMBOM of mBOM.edges) {
            if(edgeMBOM.edgeId === edge) {

                let note    = getEdgeProperty(edgeMBOM, wsMBOM.viewColumns, config.mbom.fieldIdInstructions, '');
                let svg     = getEdgeProperty(edgeMBOM, wsMBOM.viewColumns, config.mbom.fieldIdMarkupSVG   , '');
                let state   = getEdgeProperty(edgeMBOM, wsMBOM.viewColumns, config.mbom.fieldIdMarkupStage , '');
                            
                instructions.push({
                    'partNumber' : partNumber,
                    'link'       : nodeLink,
                    'edge'       : edgeMBOM,
                    'note'       : note,
                    'svg'        : svg,
                    'state'      : state,
                    'changed'    : false
                });

                return (note !== '');

            }
        }
    }

    return false;

}



function applyUpgradeFilter() {

    if(isBlank(links.previous)) return;

    console.log(itemsToValidate.length);

    if(itemsToValidate.length === 0) return;


    console.log(itemsToValidate.length);
    console.log(bomListPrevious.length);

    let nextItemsToValidate = [];

    for(let item of itemsToValidate) {

        let level      = item.attr('data-level');
        let link       = item.attr('data-link');
        let root       = item.attr('data-root');
        let partNumber = item.attr('data-part-number');
        let parent     = item.parent().closest('.item').attr('data-part-number');
        let isMatch    = false;

        console.log(level);
        console.log(root);
        console.log(parent);
        console.log(link);

        for(let previous of bomListPrevious) {

            if(previous.level == level) {
                if(previous.root == root) {
                    if((previous.parent == parent) || (level == 2)) {
                        if(previous.link == link) {
                            isMatch = true;
                        }
                    }
                }
            }
        }

        if(isMatch) {
            // item.addClass('matches-previous').addClass('hidden');
            item.remove();
        } else {

            let elemBOM = item.children('.item-bom');

            if(elemBOM.length > 0) {

                elemBOM.children('.item').each(function() {
                    nextItemsToValidate.push($(this));
                });

            }

        }
        

    }

    itemsToValidate = nextItemsToValidate.slice();
    applyUpgradeFilter();

}



// Parse BOM information
function getDescriptor(data, urn) {
    
    for(let node of data.nodes) {
        if(node.item.urn === urn) {
            return node.item.title;
        }
    }
    
    return '';
    
}
function getLink(data, urn) {
    
    for(let node of data.nodes) {
        if(node.item.urn === urn) {
            return node.item.link;
        }
    }
    
    return '';
    
}
function getRootLink(data, urn) {
    
    for(let node of data.nodes) {
        if(node.item.urn === urn) {
            return node.rootItem.link;
        }
    }
    
    return '';
    
}
function getMBOMEdge(urn, urnParent) {
    
    let empty = { 'edgeId' : '', 'fields': [] }

    if(urnParent === '') return empty;
    
    for(let edge of mBOM.edges) {
        if(edge.child === urn) {
            if(edge.parent === urnParent) {
                return edge;
            }
        }
    }
    
    return empty;
    
}
function getMBOMEdgeNumber(urn, urnParent) {
    
    if(urnParent === '') return -1;
    
    for(let edge of mBOM.edges) {
        if(edge.child === urn) {
            if(edge.parent === urnParent) {
                return edge.itemNumber;
            }
        }
    }
    
    return -1;

}



// Toggles to expand / collapse BOMs
function addBOMToggle(elemParent) {
    
    $('<div></div>').appendTo(elemParent)
        .css('display', 'none')
        .html('<span class="icon chevron-right">chevron_right</span>')
        .click(function(e) {
            
            e.preventDefault();
            e.stopPropagation();

            if(e.shiftKey) { 
                let elemRoot = $(this).closest('.root');
                elemRoot.find('.chevron-right:visible').click();
            } else {
                $(this).closest('.item').find('.item-bom').show(); 
                $(this).siblings().toggle();
                $(this).toggle();
            };
            
        });
    
    $('<div></div>').appendTo(elemParent)
        .html('<span class="icon expand-more">expand_more</span>')
        .click(function(e) {

            e.preventDefault();
            e.stopPropagation();
            
            if(e.shiftKey) { 
                let elemRoot = $(this).closest('.root');
                elemRoot.find('.expand-more:visible').click();
            } else {
                $(this).closest('.item').find('.item-bom').hide(); 
                $(this).siblings().toggle();
                $(this).toggle();
            }
            
        });
    
}



// Add Shortcut to open related MBOM
function addMBOMShortcut(elemParent) {
    
     $('<div></div>').appendTo(elemParent)
        .addClass('icon')
        .addClass('mbom-shortcut')
        .attr('title', 'This item has MBOM defined, click to open the given editor')
        .click(function() {

            let elemItem = $(this).closest('.item');
            let linkMBOM = elemItem.attr('data-link');

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

    let urns = [];
    let qtys = [];

    $('#ebom').find('.item-qty-input').each(function() {

        let elemQtyInput = $(this);

        if(elemQtyInput.parent().parent().siblings().length === 0) {
            
            let totalQuantity   = Number(elemQtyInput.val());
            let elemItem        = elemQtyInput.closest('.item');
            let urn             = elemItem.attr('data-urn');

            elemQtyInput.parents('.item-has-bom').each(function() {
                if(this.hasAttribute('data-qty')) {
                    totalQuantity = totalQuantity * Number($(this).attr('data-qty'));
                }
            })

            elemItem.attr('data-instance-qty', totalQuantity);
            elemQtyInput.val(totalQuantity);

            if(urns.indexOf(urn) === -1) {
                urns.push(urn);
                qtys.push(totalQuantity);
            } else {
                qtys[urns.indexOf(urn)] += totalQuantity;
            }

        }
    });

    $('#ebom').find('.item-qty-input').each(function() {
    
        let elemItem = $(this).closest('.item');
        let urn = elemItem.attr('data-urn');

        elemItem.attr('data-total-qty', qtys[urns.indexOf(urn)]);

    });

}



// Enable item filtering & preview
function selectProcess(elemClicked) {

    $('body').removeClass('bom-panel-on');
    $('.item').removeClass('selected');
    $('.selected-target').removeClass('selected-target');
    
    elemClicked.addClass('selected-target');
    elemClicked.addClass('selected');

    let itemLink = elemClicked.attr('data-link');

    if(!isBlank(itemLink)) {
        insertItemSummary(itemLink, paramsSummary);
    }

}
function selectBOMItem(elemClicked, filter) {

    let elemItem = elemClicked.closest('.item');

    $('.adjacent-prev').removeClass('adjacent-prev');
    $('.current-mbom ').removeClass('current-mbom ');
    $('.adjacent-next').removeClass('adjacent-next');    

    if(filter) {
        if(elemItem.hasClass('filter')) deselectItem(elemClicked);
        else selectItem(elemItem, filter);
    } else {
        if(elemItem.hasClass('selected'))  deselectItem(elemClicked);
        else selectItem(elemItem, filter);
    }

}
function selectItem(elemItem, filter) {   

    let link        = elemItem.attr('data-link');
    let isSelected  = elemItem.hasClass('selected');
    let partNumber  = elemItem.attr('data-part-number');
    
    if(typeof partNumber === 'undefined') partNumber = '';

    if(elemItem.hasClass('leaf')) {

        setStatusBar();

        if(filter) {
            if(isViewerStarted()) viewer.setGhosting(false);
            $('.leaf').hide();
            $('.operation').hide();
            $('.item.filter').removeClass('filter');
            elemItem.addClass('filter');
        } else {
            if(isViewerStarted()) viewer.setGhosting(true);
        }

        $('.item').removeClass('selected');

        $('.leaf').each(function() {
            
            if($(this).attr('data-link') === link) {

                $(this).show();
                $(this).addClass('selected');
                unhideParent($(this).parent());

                if(partNumber === '') partNumber = $(this).attr('data-part-number');
                if(typeof partNumber === 'undefined') partNumber = '';

            // } else if($(this).attr('data-urn-bom') === urn) {
            //     $(this).show();
            //     $(this).addClass('selected');
            //     unhideParent($(this).parent());
            // }else if($(this).attr('data-urn-ebom') === urn) {
            //     $(this).show();
            //     $(this).addClass('selected');
            //     unhideParent($(this).parent());
            }

        });

        if(!isSelected || filter) {
            if(partNumber !== '') {

                let elemMBOM = elemItem.closest('#mbom');

                if(elemMBOM.length === 1) {
                    elemItem.addClass('current-mbom');
                    viewerSelectModel(partNumber, { 'fitToView' : false, resetColors : true, highlight : true });
                    if(!filter) selectAdjacentMBOMModels();
                } else {
                    viewerSelectModel(partNumber, {
                        highlight : true
                    });
                }

            }
            insertItemSummary(link, paramsSummary);
            setBOMPanels(link);
        }

    }

    // Set instructions in viewer markup
    $('#my-markup-button').removeClass('highlight');
    $('#viewer-note').val('');
    $('#viewer-note').attr('data-link', link);

    for(let instruction of instructions) {
        if(instruction.link === link) {
            if(instruction.note !== '') {
                $('#viewer-note').val(instruction.note);
                $('#viewer-note').attr('data-part-number', partNumber);
                $('#my-markup-button').addClass('highlight');
                restoreMarkupSVG = instruction.svg;
                restoreMarkupState = instruction.state;
            }
        }
    }
    
}
function selectAdjacentMBOMModels() {

    $('.adjacent-prev').removeClass('adjacent-prev');
    $('.adjacent-next').removeClass('adjacent-next');    

    if($('.current-mbom').length === 0) return;
    
    let elemItem = $('.current-mbom').first();

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
            viewerSetColor(prevPartNumber, { 'color' : config.vectors.green, resetColors : false } );
        }
    }

    // Get next element within tree
    let elemNext = getNextAdjacentItem(elemItem);

    if(elemNext !== null) {
        if(elemNext.length > 0) {
            let nextPartNumber = elemNext.attr('data-part-number');
            elemNext.addClass('adjacent-next');
            viewerSetColor(nextPartNumber, { 'color' : config.vectors.red, resetColors : false } );
        }
    }

}
function getNextAdjacentItem(elemItem) {

    let elemNextAll = elemItem.nextAll();
    let elemNext    = null;

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

    return elemNext;

}
function deselectItem(elemClicked) {

    $('body').removeClass('bom-panel-on');
    $('.item').removeClass('selected');
    $('.item').removeClass('filter');
    $('.item').show();

    insertItemSummary(linkEBOM, paramsSummary);

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



// BOM Panels with total quantities
function setBOMPanels(link) {

    $('body').addClass('bom-panel-on');

    let qtyEBOM = 0;
    let qtyMBOM = 0;

    $('#ebom').find('.item').each(function() {
        if($(this).attr('data-link') === link) {
            qtyEBOM = Number($(this).attr('data-total-qty'));
            $('#ebom-total-qty').html(qtyEBOM);
        }
    });

    $('#mbom').find('.item').each(function() {
        if($(this).attr('data-link') === link) {
            qtyMBOM += Number($(this).find('.item-qty-input').val());
        }
    });

    $('#mbom-total-qty').html(qtyMBOM + ' (' + (qtyMBOM-qtyEBOM) + ')');

}



// Drag & Drop functions
function moveItemQuantity() {
    
    let elemItem    = $('.to-move');
    let elemBOM     = $('.selected-target').children('.item-bom');
    let exists      = itemExistsInBOM(elemItem, elemBOM);
    let qtyMove     = $('#copy-qty').val();
    let qtyNew      = elemItem.find('.item-qty-input').val() - $('#copy-qty').val();
    let elemClone   = getItemClone(elemItem);

    if(!exists) {

        elemClone.appendTo(elemBOM);
        elemClone.attr('data-qty', qtyMove);
        elemClone.attr('data-instance-qty', qtyMove);
        elemClone.find('.item-qty-input').val(qtyMove);
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
    let elemClone   = getItemClone(elemItem);

    if(!exists) {
        elemClone.appendTo(elemBOM);
        elemClone.attr('data-qty', qtyAdd);
        elemClone.attr('data-instance-qty', qtyAdd);
        elemClone.find('.item-qty-input').val(qtyAdd);
    }

    $('#copy-cancel').click();
    setStatusBar();

}
function itemExistsInBOM(elemItem, elemBOM) {
    
    let exists = false;
    
    elemBOM.children().each(function() {
        if($(this).attr('data-urn') === elemItem.attr('data-urn')) {
        
            let qtyNew = $(this).find('.item-qty').val();
            let qtyAdd  = $('#copy-qty').val();
            qtyNew  = parseInt(qtyAdd) + parseInt(qtyNew);
            
            $(this).find('.item-qty').val(qtyNew);
            
            exists = true;
            
        } 
    });

    return exists;
    
}
function getItemClone(elemItem) {

    let elemClone       = elemItem.clone();
    let elemQtyInput    = elemClone.find('.item-qty-input');
    let elemActions     = elemClone.find('.item-actions');
            
    insertMBOMSelectEvent(elemClone)
    insertMBOMQtyInputControls(elemQtyInput)
    insertMBOMActions(elemActions);

   return elemClone;

}



// Add Items Tab
function insertSearchFilters() {

    if(isBlank(config.mbom.searches)) return;

    let index = 0;

    for(let view of config.mbom.searches) {

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

        $.get('/plm//tableau-data', { 'link' : $('#view-selector-' + suffix).val() }, function(response) {      
            
            $('#add-processing').hide();
            
            let indexDescriptorField = 0;

            if(response.data.items.length > 0) {
                for(let indexField = 0; indexField < response.data.items[0].fields.length; indexField++) {
                    if(response.data[0].fields[indexField].id === 'DESCRIPTOR') {
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

        if(ws === config.mbom.wsIdMBOM) addItemListEntry(link, urn, title, className, elemList, false);

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

    if(isProcess) elemItem.addClass('is-operation');

}
function insertAdditionalItem(elemHead, title, urn, link) {

    $('#overlay').show();

    let requests = [
        $.get('/plm/details', { link : link}),
        $.get('/plm/bom', { 
            link            : link,
            viewId          : wsMBOM.viewId,
            depth           : 2,
            revisionBias    : config.mbom.revisionBias
        })
    ]

    Promise.all(requests).then(function(responses) {

        let isProcess = getSectionFieldValue(responses[0].data.sections, config.mbom.fieldIdIsProcess, false);
        $('#overlay').hide();

        if(isProcess) {
            mBOM = responses[1].data;
            for(let edgeMBOM of mBOM.edges) edgeMBOM.depth++;
            let newNode = setMBOM(elemHead.next(), mBOM.root, 2, null, '', true);
            matchEBOMItems(newNode);
        } else {

      
            let qty         = '1';
            let elemBOM     = elemHead.next();
            let className   = getIconClassName(link, false, false);
            
            let elemNode = $('<div></div>').appendTo(elemBOM)
                .addClass('item')
                .addClass('leaf')
                .addClass('unique')
                .addClass('mbom-item')
                .addClass(className)
                .attr('data-urn', urn)
                .attr('data-link', link)
                .attr('data-qty', qty);
        
            let elemNodeHead = $('<div></div>').appendTo(elemNode)
                .addClass('item-head')
                .attr('data-qty', qty);
            
            $('<div></div>').appendTo(elemNodeHead)
                .addClass('item-toggle');
            
            $('<div></div>').appendTo(elemNodeHead)
                .addClass('item-icon')
                .html('<span class="icon">build</span>');
            
            $('<div></div>').appendTo(elemNodeHead)
                .addClass('item-title')
                .html(title)
                .attr('data-urn', '')
                .attr('data-qty', qty);

            $('<div></div>').appendTo(elemNodeHead)
                .addClass('item-code');
            
            let elemNodeQty = $('<div></div>').appendTo(elemNodeHead)
                .addClass('item-qty');

            $('<input></input>').appendTo(elemNodeQty)
                .attr('type', 'number')
                .addClass('item-qty-input')
                .val(qty);
            
            $('<div></div>').appendTo(elemNodeHead)
                .addClass('item-head-status');
            
            let elemNodeActions = $('<div></div>').appendTo(elemNodeHead)
                .addClass('item-actions');
            
            insertMBOMActions(elemNodeActions);

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

    if (event.dbIdArray.length === 1) {

        let updateBOMPanels = true;

        viewer.getProperties(event.dbIdArray[0], function(data) {

            let partNumber = data.name.split(':')[0];
            let propertyMatch = false;

            for(let partNumberProperty of config.viewer.numberProperties) {
                for(let property of data.properties) {
                    if(property.displayName === partNumberProperty) {
                        partNumber = property.displayValue;
                        if(partNumber.indexOf(':') > -1) { partNumber = partNumber.split(':')[0]; }
                        propertyMatch = true;
                        break;
                    }
                }
                if(propertyMatch) break;
            }

            if(disassembleMode) {

                if((event.mouseButton === 0) || isBlank(event.mouseButton)) {
                    $('#ebom').find('.item.leaf').each(function() {
                        let elemEBOM = $(this);
                        if(elemEBOM.attr('data-part-number') === partNumber) {
                            let elemActionAdd = elemEBOM.find('.item-action-add').first();
                            elemActionAdd.click();
                            
                        }
                    });
                    viewerHideModel(partNumber);
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
                            setBOMPanels($(this).attr('data-link'));
                            updateBOMPanels = false;
                        }
                    }
                });

            }

        });

    } else {

        $('.item.leaf').show();
        $('.item.selected').removeClass('selected');
        $('body').removeClass('bom-panel-on');
        
       viewer.clearThemingColors();

    }

}
function closedViewerMarkup(markupSVG, markupState) {

    let note        = $('#viewer-note').val();
    let link        = $('#viewer-note').attr('data-link');
    let partNumber  = $('#viewer-note').attr('data-part-number');

    let add = true;

    for(let instruction of instructions) {
        if(instruction.link === link) {
            instruction.note = note;
            instruction.svg = markupSVG;
            instruction.state = markupState;
            instruction.changed = true;
            add = false;
        }
    }

    if(add) {
        instructions.push({
            'partNumber' : partNumber,
            'link'       : link,
            'edge'       : '',
            'note'       : note,
            'svg'        : markupSVG,
            'state'      : markupState,
            'changed'    : true
        });
    }

    if(note !== '') $('#my-markup-button').addClass('highlight');

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
        let linkItem    = elemParent.attr('data-link').split('/');
        let edges       = [];
        let number      = 1;

        if((typeof listEdges !== 'undefined') && (listEdges !== '')){

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
                        'wsId'      : linkItem[4],
                        'dmsId'     : linkItem[6],
                        'edgeId'    : edge
                    });
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

                let dbNumber = elemItem.attr('data-number-db');
                let edNumber = elemItem.attr('data-number');
                let dbQty    = elemItem.attr('data-qty');
                let edQty    = elemItem.find('.item-qty-input').first().val();

                if(dbQty !== edQty) elemItem.addClass('pending-update');
                else if(dbNumber !== edNumber) elemItem.addClass('pending-update');

            }           

            for(let instruction of instructions) {
                if(instruction.link === elemItem.attr('data-link')) {
                    if(instruction.changed) elemItem.addClass('pending-update');
                }
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
                    'wsId'      : config.mbom.wsIdMBOM,
                    'sections'  : []
                };

                addFieldToPayload(params.sections, wsMBOM.sections, null, config.mbom.fieldIdTitle, title);
                addFieldToPayload(params.sections, wsMBOM.sections, null, config.mbom.fieldIdIsProcess, true);
                addFieldToPayload(params.sections, wsMBOM.sections, null, config.mbom.fieldIdProcessCode, code);

                if(!isBlank(config.mbom.fieldIdNumber)) {
                    if(!isBlank(config.mbom.incrementOperatonsItemNumber)) {
                        if(code !== '') {
                          addFieldToPayload(params.sections, wsMBOM.sections, null, config.mbom.fieldIdNumber, basePartNumber + '-' + code);
                        }
                    }
                }

                for(let newDefault of config.mbom.newDefaults) {
                    addFieldToPayload(params.sections, wsMBOM.sections, null, newDefault[0], newDefault[1]);
                }

                requests.push($.post('/plm/create', params));
                elements.push(elemItem);

            }

        });

        Promise.all(requests).then(function(responses) {

            requests = [];

            for(let response of responses) {
                if(response.error) {
                    showErrorMessage('Error while creating new MBOM nodes', 'Error message : ' + response.message + '<br/>Please refresh your browser window before continuing. All changes that were not saved will be lost.');
                    return;
                }
                requests.push($.get('/plm/descriptor', {
                    'link' : response.data.split('.autodeskplm360.net')[1]
                }));
            }

            Promise.all(requests).then(function(responses) {

                let index = 0;

                for(let response of responses) {

                    let elemItem = elements[index++];
                        elemItem.attr('data-link', response.params.link);
                        elemItem.attr('root-link', response.params.link);
                        elemItem.removeClass('pending-creation');

                    let elemHead = elemItem.children().first();
                        elemHead.find('.item-head-descriptor').html(response.data);    
                    
                    if(elemHead.find('.item-head-descriptor').length === 0) elemHead.find('.item-title').html(response.data);

                }

                createNewItems(); 

            });       

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
                let paramsParent = elemParent.attr('data-link').split('/');
                let paramsChild  = elemItem.attr('data-link').split('/');
                let edQty        = elemItem.find('.item-qty-input').first().val();
                let linkMBOM     = elemItem.attr('data-link-mbom');
                let linkEBOMRoot = elemItem.attr('data-ebom-root');
                let isEBOMItem   = elemItem.hasClass('is-ebom-item');
                
                if (typeof linkMBOM !== 'undefined') {
                    paramsChild[4] = linkMBOM.split('/')[4];
                    paramsChild[6] = linkMBOM.split('/')[6];
                }

                let params = {                    
                    'wsIdParent'    : paramsParent[4],
                    'wsIdChild'     : paramsChild[4],
                    'dmsIdParent'   : paramsParent[6], 
                    'dmsIdChild'    : paramsChild[6],
                    'number'        : elemItem.attr('data-number'),
                    'quantity'      : edQty,
                    'pinned'        : config.mbom.pinMBOMItems,
                    'fields'        : []
                };

                if(isEBOMItem) params.fields.push({ 'link' : linkFieldEBOMItem, 'value' : true });
                if(!isBlank(linkEBOMRoot)) params.fields.push({ 'link' : linkFieldEBOMRootItem, 'value' : linkEBOMRoot });

                requests.push($.post('/plm/bom-add', params));
                elements.push(elemItem);

            }

        });

        Promise.all(requests).then(function(responses) {
        
            requests = [];

            for(let response of responses) {
                requests.push($.get('/plm/bom-item', { 'link' : response.data }));
                if(response.error) {
                    showErrorMessage('Error while adding BOM items', response.data[0].message);
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

                let elemItem    = $(this);
                let elemParent   = elemItem.parent().closest('.item');
                let edNumber     = elemItem.attr('data-number');
                let paramsChild  = elemItem.attr('data-link').split('/');
                let paramsParent = elemParent.attr('data-link').split('/');
                let urnMBOM      = elemItem.attr('data-link-mbom');
                let edQty        = elemItem.find('.item-qty-input').first().val();

                if(typeof urnMBOM !== 'undefined') {
                    let data = elemItem.attr('data-link-mbom').split('.');
                    paramsChild[4] = data[4];
                    paramsChild[6] = data[5];
                }

                let params = {                    
                    'wsIdParent'  : paramsParent[4],
                    'wsIdChild'   : paramsChild[4],
                    'dmsIdParent' : paramsParent[6], 
                    'dmsIdChild'  : paramsChild[6],
                    'edgeId'      : elemItem.attr('data-edge'),
                    'number'      : edNumber,
                    'quantity'    : edQty,
                    'pinned'      : config.mbom.pinMBOMItems
                };

                let linkFieldNote   = '';
                let linkFieldSVG    = '';
                let linkFieldState  = '';

                for(let column of wsMBOM.viewColumns) {
                         if(column.fieldId === config.mbom.fieldIdInstructions) linkFieldNote  = column.link;
                    else if(column.fieldId === config.mbom.fieldIdMarkupSVG   ) linkFieldSVG   = column.link;
                    else if(column.fieldId === config.mbom.fieldIdMarkupState ) linkFieldState = column.link;
                }

                for(let instruction of instructions) {
                    if(instruction.link === elemItem.attr('data-link')) {
                        if(instruction.changed) {
                            params.fields = [
                                { 'link'  : linkFieldNote , 'value' : instruction.note  },
                                { 'link'  : linkFieldSVG  , 'value' : instruction.svg   },
                                { 'link'  : linkFieldState, 'value' : instruction.state }
                            ]
                        }
                    }
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
                    elemItem.attr('data-qty', response.params.qty);
        
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
    let value      = timestamp.getFullYear() + '-' + (timestamp.getMonth()+1) + '-' + timestamp.getDate();
    let paramsEBOM = { 'link' : linkEBOM, 'sections'   : [] }
    let paramsMBOM = { 'link' : linkMBOM, 'sections'   : [] }

    addFieldToPayload(paramsEBOM.sections, wsEBOM.sections, null, config.mbom.fieldIdLastSync, value);
    addFieldToPayload(paramsEBOM.sections, wsEBOM.sections, null, config.mbom.fieldIdLastUser + siteSuffix, userAccount.displayName);
    addFieldToPayload(paramsMBOM.sections, wsMBOM.sections, null, config.mbom.fieldIdLastSync, value);

    $.post('/plm/edit', paramsEBOM, function(response) {});
    $.post('/plm/edit', paramsMBOM, function(response) {});

}