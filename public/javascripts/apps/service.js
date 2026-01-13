let fields, sections, bomViewIdItems;
let workspaceIds = {};
let links = {};
let urns  = {
    thumbnail     : '', 
    partNumber    : '', 
    title         : '', 
    description   : '', 
    spareWearPart : '', 
    material      : '', 
    mass          : '',
    dimensions    : ''
}

// let bom, flatBOM;
let listServiceItems      = { spareParts : [], kit : [], offering : [], wearParts : []};
let wsProblemReports      = { id : '', sections : [], fields : [] };
let wsSparePartsRequests  = { id : '', sections : [], fields : [] };
let paramsItemDetails     = {}
let paramsItemAttachments = {}
let paramsDocumentation   = {}
let paramsProcesses       = { 
    hideHeader          : true, 
    createWSID          : '',
    createHeaderLabel       : 'Create Problem Report',
    createContextItemFields : ['AFFECTED_ITEM'],
    createViewerImageFields : ['IMAGE_1'],
    editable            : true,
    fieldIdMarkup       : '',
    openInPLM           : true,
    reload              : true,
    contentSize         : 'm',
    singleToolbar       : 'actions'
}


$(document).ready(function() {

    appendProcessing('items');
    appendOverlay();
    insertMenu();

    paramsProcesses.createPerformTransition = config.problemReports.transitionOnCreate;

    workspaceIds = {
        products           : config.products.workspaceId           || common.workspaceIds.products,
        sparePartsRequests : config.sparePartsRequests.workspaceId || common.workspaceIds.sparePartsRequests,
        problemReports     : config.problemReports.workspaceId     || common.workspaceIds.problemReports,
        assets             : config.assets.workspaceId             || common.workspaceIds.assets,
        orderProjects      : config.orderProjects.workspaceId      || common.workspaceIds.orderProjects,
        assetServices      : config.assetServices.workspaceId      || common.workspaceIds.assetServices,
    }
    
    let requests = [ 
        $.get('/plm/me', { useCache : false }),
        $.get('/plm/sections', { wsId : workspaceIds.sparePartsRequests, useCache : true }),
        $.get('/plm/bom-view-by-name', { wsId : common.workspaceIds.items, name : config.items.bomViewName, useCache : true })
    ];

    getFeatureSettings('service', requests, function(responses) {

        let user = responses[0].data;
        bomViewIdItems = responses[2].data.id;

        $('#request-name'   ).val(user.displayName || '');
        $('#request-company').val(user.organization|| '');
        $('#request-e-mail' ).val(user.email       || '');
        $('#request-address').val(user.address1    || '');
        $('#request-city'   ).val(user.city        || '');
        $('#request-postal' ).val(user.postal      || '');
        $('#request-country').val(user.country     || '');  

        paramsProcesses.createWSID    = workspaceIds.problemReports;
        paramsProcesses.workspacesIn  = [workspaceIds.problemReports.toString()];
        paramsProcesses.fieldIdMarkup = config.problemReports.fieldIdImage;
        wsProblemReports.id           = workspaceIds.problemReports;
        wsSparePartsRequests.id       = workspaceIds.sparePartsRequests;       
        wsSparePartsRequests.sections = responses[1].data;       
        
        paramsItemDetails        = config.paramsItemDetails;
        paramsItemDetails.id     = 'details-top';
        paramsItemAttachments    = config.paramsItemAttachments;
        paramsItemAttachments.id = 'details-bottom';
        
        paramsDocumentation            = config.paramsDocumentation;
        paramsDocumentation.id         = 'documentation';
        paramsDocumentation.hideHeader = true;
        
        setUIElements();
        setLandingPage(user.displayName);
        setUIEvents();      

        if(urlParameters.link !== '') {

            if(urlParameters.wsidcontext == workspaceIds.assets) {
                let link = '/api/v3/workspaces/' + urlParameters.wsidcontext + '/items/' + urlParameters.dmsidcontext;
                openSelectedProductOrAsset(link, 'assets', config.assets.fieldIDs);
            } else if(urlParameters.wsidcontext == workspaceIds.products) {
                let link = '/api/v3/workspaces/' + urlParameters.wsidcontext + '/items/' + urlParameters.dmsidcontext;
                openSelectedProductOrAsset(link, 'products', config.products.fieldIDs);
            } else if(urlParameters.link !== '') {
                links.ebom = urlParameters.link;
                openItem();
            }

        }

    });
    
});
function setUIElements() {

    if(!applicationFeatures.homeButton) {
        $('#home').remove();
        $('#landing').remove();
    }

    if(!applicationFeatures.itemAttachments) {
        $('#details-top').css('bottom', '0px');
        $('#details-bottom').remove();
    }

    if(!applicationFeatures.itemDetails) {
        $('#details').remove();
        $('#toggle-details').remove();
    }

    if(!applicationFeatures.contextDocumentation) {
        $('#documentation').remove();
        $('#tab-documentation').remove();
    }

    if(!applicationFeatures.manageProblemReports) {
        $('#processes').remove();
        $('#tab-processes').remove();
    }

    if(!applicationFeatures.showStock) {
        $('#color-stock').remove();
    }

    if(!applicationFeatures.requestWorkflowActions) {
        $('#workflow-actions').remove();
    }

    if(urlParameters.type === 'assets') {
        $('#products').remove();
    } else {
        $('#services').remove();
        $('#projects').remove();
        $('#assets'  ).remove();
    }

    $('#tab-your-requests').html(config.labels.homeSparePartRequests);
    $('#tab-your-problems').html(config.labels.homeProblemReports);

    if(!applicationFeatures.manageSparePartRequests) {
        if(!applicationFeatures.manageProblemReports) {
            $('#your-processes').remove();
            $('body').addClass('no-your-processes');       
        }
    } 

}
function setLandingPage(userName) {

    if(applicationFeatures.homeButton || isBlank(urlParameters.dmsId)) {

        if(urlParameters.type !== 'assets') {

            if(!isBlank(workspaceIds.products)) {
                
                insertResults(workspaceIds.products, config.products.filter ,{
                    id              : 'products',
                    headerLabel     : config.products.headerLabel, 
                    icon            : config.products.icon,
                    groupBy         : config.products.groupBy,
                    contentSize     : config.products.contentSize,
                    // sortBy          : config.products.sortBy, 
                    tileImage       : config.products.tileImage, 
                    tileTitle       : config.products.tileTitle, 
                    tileSubtitle    : config.products.tileSubtitle, 
                    search          : true,
                    layout          : 'grid',
                    groupLayout     : 'horizontal',
                    onClickItem : function(elemClicked) { openSelectedProductOrAsset(elemClicked.attr('data-link'), 'product', config.products.fieldIDs); }
                });

            }

        } else {

            let filterAssetServices = [{
                field       : config.assetServices.fieldIDs.assignee,
                type        : 0,
                comparator  : 5,
                value       : userName          
            }];

            for(let status of config.assetServices.hideStates) {
                filterAssetServices.push({
                    field       : 'WF_CURRENT_STATE',
                    type        : 1,
                    comparator  : 5,
                    value       : status          
                });
            }

            insertResults(workspaceIds.assetServices, filterAssetServices, {
                id          : 'services',
                headerLabel : config.assetServices.headerLabel,
                layout      : 'list',
                contentSize : 'xs',
                tileIcon    : 'icon-service',
                number      : false,
                reload      : true,
                useCache    : false,
                onClickItem : function(elemClicked) { openSelectedAssetService(elemClicked); }
            });

            let filterAssetProjects = [];                

            for(let status of config.orderProjects.hideStates) {
                filterAssetProjects.push({
                    field       : 'WF_CURRENT_STATE',
                    type        : 1,
                    comparator  : 5,
                    value       : status          
                });
            }

            insertResults(workspaceIds.orderProjects, filterAssetProjects, {
                id             : 'projects',
                headerLabel    : config.orderProjects.headerLabel,
                layout         : 'grid',
                contentSize    : 'l',
                tileImage      : 'IMAGE',
                tileTitle      : 'TITLE',
                tileSubtitle   : config.orderProjects.tileSubtitle,
                tileDetails    : config.orderProjects.tileDetails,
                reload         : true,
                search         : true,
                useCache       : true,
                openInPLM      : applicationFeatures.openInPLM,
                openOnDblClick : applicationFeatures.openInPLM,
                onClickItem    : function(elemClicked) { selectProject (elemClicked); }
            });

        }

    }

    if(applicationFeatures.manageSparePartRequests) {

        let params = {
            id           : 'your-requests',
            headerLabel  : config.labels.homeSparePartRequests,
            layout       : 'list',
            contentSize  : 'xs',
            tileIcon     : 'icon-package',
            number       : false,
            search       : true,
            reload       : true,
            tileTitle    : 'DESCRIPTOR',
            tileSubtitle : 'REQUEST_DATE',
            stateColors  : config.sparePartsRequests.stateColors,
            onClickItem  : function(elemClicked) { openRequest(elemClicked); }
        };

        if(applicationFeatures.manageProblemReports) {
            params.hideHeader    = true;
            params.singleToolbar = 'actions';
            params.hideHeader    = true;
        } else {
            params.id = 'your-processes';
        }

        insertResults(workspaceIds.sparePartsRequests, [{
            field       : 'OWNER_USERID',
            type        : 3,
            comparator  : 15,
            value       : userName
        },{
            field       : 'WF_CURRENT_STATE',
            type        : 1,
            comparator  : 5,
            value       : 'Completed'            
        },{
            field       : 'WF_CURRENT_STATE',
            type        : 1,
            comparator  : 5,
            value       : 'Deleted'            
        }], params);

    } else $('#tab-your-requests').remove();

    if(applicationFeatures.manageProblemReports) {

        let params = {
            id             : 'your-problems',
            headerLabel    : config.labels.homeProblemReports,
            layout         : 'list',
            contentSizes   : ['l', 'm', 'xs', 'xxs'],
            search         : true,
            reload         : true,
            openOnDblClick : true,
            openInPLM      : applicationFeatures.openInPLM,
            openOnDblClick : applicationFeatures.openInPLM,
            tileTitle      : 'DESCRIPTOR',
            tileSubtitle   : 'DESCRIPTION',
            tileDetails    : [{
                icon    : 'icon-tag',
                fieldId : 'TYPE',
                prefix  : 'PR Type'
            }, {
                icon    : 'icon-select',
                fieldId : 'SOURCE',
                prefix  : 'PR Source'
            }],
            stateColors : config.problemReports.stateColors,
            onClickItem : function(elemClicked) { openProblemReport(elemClicked); }
        };

        if(applicationFeatures.manageSparePartRequests) {
            params.hideHeader    = true;
            params.singleToolbar = 'actions';
            params.hideHeader    = true;
        } else {
            params.id = 'your-processes';
        }            

        insertResults(workspaceIds.problemReports, [{
            field       : 'OWNER_USERID',
            type        : 3,
            comparator  : 15,
            value       : userName
        },{
            field       : 'WF_CURRENT_STATE',
            type        : 1,
            comparator  : 5,
            value       : 'Completed'
        }], params);            
        
    } else $('#tab-your-problems').remove();

    if(!isBlank(dmsId)) {
        
        $('body').addClass('screen-main').removeClass('screen-landing').removeClass('screen-request');

        let params       = document.location.href.split('?')[1].split('&');
        let wsidcontext  = null;
        let dmsidcontext = null;

        for(let param of params) {
                    if(param.toLowerCase().indexOf('wsidcontext=' ) === 0) { wsidcontext  = param.split('=')[1]; }
            else if(param.toLowerCase().indexOf('dmsidcontext=') === 0) { dmsidcontext = param.split('=')[1]; }
        }

        if(!isBlank(wsidcontext)) {
            if(!isBlank(dmsidcontext)) {
                links.context = '/api/v3/workspaces/' + wsidcontext + '/items/' + dmsidcontext;
            }
        }

        openItem();

    } else $('#landing').show();


}
function setUIEvents() {

    // Close current product display and return to landing page
    if(applicationFeatures.homeButton) {
        $('#home').click(function() {
            viewerLeaveMarkupMode();
            viewerUnloadAllModels();
            $('body').addClass('screen-landing').removeClass('screen-main').removeClass('screen-request');
            document.title = documentTitle;
            let url = '/service?theme=' + theme;
            if(!isBlank(urlParameters.type)) url += '&type=' + urlParameters.type;
            window.history.replaceState(null, null, url);
        });
    }


    // Toggles in header toolbar
    $('#toggle-service').click(function() {
        $('body').toggleClass('no-asset-service');
        viewerResize();
    })
    $('#toggle-bom').click(function() {
        $('body').toggleClass('no-bom');
        viewerResize();
    })
    $('#toggle-snl').click(function() {
        $('body').toggleClass('no-snl');
        viewerResize();
    })
    $('#toggle-panel').click(function() {
        $('body').toggleClass('no-panel');
        viewerResize();
    });
    if(applicationFeatures.itemDetails) {
        $('#toggle-details').click(function() {
            $('body').toggleClass('no-details');
            viewerResize();
        })
    }


    // Spare Parts List Toolbar
    $('#filter-list').click(function() { filterBySparePartsList();   });
    $('#color-stock').click(function() { highlightSparePartStocks(); });
    $('#spare-parts-search-input').keyup(function() { filterSparePartsByInput(); });
        

    // Cart interactions
    $('#cart-title').click(function() {
        $('#cart').toggleClass('collapsed');
        adjustCartHeight();
    });
    $('#filter-cart').click(function() {
        let partNumbers = [];
        $('#cart-list').children().each(function() {
            partNumbers.push($(this).attr('data-part-number'));
        });
        viewerSelectModels(partNumbers);
    });
    $('#clear-cart').click(function() {
        $('#cart-list').children().each(function() {
            removeCartItem($(this));
        });
        adjustCartHeight();
    });
    $('#submit-request').click(function() {
        $('#request-creation').show();
        $('#overlay').show();
        setRequestList();
    });


    // Submit Request Dialog functions
    $('#request-creation-submit').click(function() {
        submitRequest();
    });
    $('#request-creation-cancel').click(function() {
        $('#request-creation').hide();
        $('#overlay').hide();
        clearRequestList();
    });


    // Single Request Display Actions
    $('#close-item').click(function() {
        $('body').addClass('screen-landing')
            .removeClass('screen-main')
            .removeClass('screen-request'); 
    });

}


// Click on Project in Landing Page
function selectProject(elemClicked) {

    let descriptor = elemClicked.attr('data-descriptor');
    let isSelected = elemClicked.hasClass('selected');

    if(!isSelected) {

        $('body').addClass('no-assets-list');
        return;

    } else {

        $('body').removeClass('no-assets-list');

        insertResults(workspaceIds.assets, [{
            field       : config.assets.fieldIDs.project,
            type        : 0,
            comparator  : 15,
            value       : descriptor
        }], {
            id           : 'assets',
            headerLabel  : 'Assets of ' + descriptor,
            layout       : 'table',
            contentSize  : 'm',
            fields       : config.assets.tableColumns,
            useCache     : true,
            search       : true,
            openInPLM    : applicationFeatures.openInPLM,
            onClickItem  : function(elemClicked) { openSelectedProductOrAsset(elemClicked.attr('data-link'), 'asset', config.assets.fieldIDs); }
        });

    }

}


// Click on existing Spare Parts Request or Problem Report in Landing Page
function openRequest(elemClicked) {

    let link = elemClicked.attr('data-link');

    insertItemSummary(link, {
        bookmark : false,
        contents : [
            { type : 'workflow-history', className : 'surface-level-1', params : { id : 'request-workflow-history' } },
            { type : 'details'         , className : 'surface-level-1', params : { id : 'request-details', expandSections : config.sparePartsRequests.sectionsExpanded, suppressLinks : true, sectionsEx : config.sparePartsRequests.sectionsExcluded } },
            { type : 'grid'            , className : 'surface-level-1', params : { id : 'request-grid', headerLabel : 'Part List', fieldsEx : config.sparePartsRequests.gridColumnsExcluded } },
            { type : 'attachments'     , className : 'surface-level-1', params : { id : 'request-attachments', editable : true, layout : 'tiles', singleToolbar : 'controls' } },
        ],
        statesColors    : config.sparePartsRequests.stateColors,  
        layout          : 'dashboard',
        reload          : false,
        openInPLM       : applicationFeatures.openInPLM,
        workflowActions : applicationFeatures.requestWorkflowActions
    })

}
function openProblemReport(elemClicked) {

    let link = elemClicked.attr('data-link');

    insertItemSummary(link, {
        bookmark : false,
        contents : [
            { type : 'workflow-history', className : 'surface-level-1', params : { id : 'request-workflow-history' } },
            { type : 'details'         , className : 'surface-level-1', params : { id : 'request-details', expandSections : config.problemReports.sectionsExpanded, suppressLinks : true, sectionsEx : config.problemReports.sectionsExcluded } },
            { type : 'grid'            , className : 'surface-level-1', params : { id : 'request-grid', headerLabel : 'Notes' } },
            { type : 'attachments'     , className : 'surface-level-1', params : { id : 'request-attachments', editable : true, layout : 'tiles', singleToolbar : 'controls' } },
        ],
        statesColors    : config.problemReports.stateColors,
        layout          : 'dashboard',
        reload          : false,
        openInPLM       : applicationFeatures.openInPLM,
        workflowActions : applicationFeatures.problemWorkflowActions
    })

}


// Click on Product or Asset in landing page
function openSelectedAssetService(elemClicked) {

    $('#overlay').show();
    $('#toggle-service').removeClass('hidden');
    $('body').addClass('no-panel');

    links.service = elemClicked.attr('data-link');

    $.get('/plm/details', { link : links.service }, function(response) {

        let linkAsset = getSectionFieldValue(response.data.sections, config.assetServices.fieldIDs.asset    , '', 'link');
        let linkSNL   = getSectionFieldValue(response.data.sections, config.assetServices.fieldIDs.serialnrs, '', 'link');

        openSelectedProductOrAsset(linkAsset, 'asset', config.assets.fieldIDs, links.service, linkSNL);
       
        insertItemSummary(links.service, {
            contents : [{
                type : 'details',
                params : { 
                    id             : 'service-details', 
                    editable       : true,
                    hideHeader     : true,
                    expandSections : config.assetServices.detailsPanel.expandSections,
                    sectionsEx     : config.assetServices.detailsPanel.excludeSections
                }
            },{ 
                type   : 'grid',
                params : { 
                    id         : 'service-grid', 
                    fieldsEx   : ['Comments', 'Required Tools'], 
                    hideHeader : true,
                } 
            }, { 
                type : 'attachments',
                params : { 
                    id : 'service-attachments', 
                    editable : true, 
                    layout : 'list', 
                    contentSize : 'm', 
                    singleToolbar : 'controls'
                }
            }],
            statesColors    : [
                { label : 'New',         color : 'red',    states : ['Received'] },
                { label : 'In Work',     color : 'yellow', states : ['Review', 'Quote Creation'] },
                { label : 'Waiting',     color : 'red',    states : ['Awaiting Response', 'Quote Submitted'] },
                { label : 'Delivery',    color : 'yellow', states : ['Order in process', 'Shipment'] },
                { label : 'Completed',   color : 'green',  states : ['Completed'] }
            ],
            id              : 'service',
            hideCloseButton : true,
            layout          : 'tabs',
            openInPLM       : false,
            reload          : false,
            workflowActions : true
        });        

    });

}
function openSelectedProductOrAsset(link, type, fieldIDs, linkService, linkSNL) {

    $('#overlay').show();

    links.context = link;

    if(isBlank(linkService)) {

        $('body').addClass('no-asset-service').removeClass('no-panel');
        $('#toggle-service').addClass('hidden');

    } else {

        $('body').removeClass('no-asset-service');

    }
    
    $.get('/plm/details', { link : links.context }, function(response) {

        links.ebom = getSectionFieldValue(response.data.sections, fieldIDs.ebom, '', 'link');
        links.sbom = getSectionFieldValue(response.data.sections, fieldIDs.sbom, '', 'link');
        links.snl  = linkSNL;

        if(isBlank(linkSNL)) {
            if(type === 'asset') {
                links.snl = getSectionFieldValue(response.data.sections, fieldIDs.serialnrs, '', 'link');
            } 
        }

        if(isBlank(links.ebom)) {
            showErrorMessage('Invalid Product Data', 'BOM of the selected ' + type + ' is not availalbe, please contact your administrator');
            return;
        }

        $('body').addClass('screen-main').removeClass('screen-landing').removeClass('screen-request');

        let splitEBOM    = links.ebom.split('/');
        let splitContext = links.context.split('/');
        let url          = '/service?wsid=' + splitEBOM[4] + '&dmsid=' + splitEBOM[6] + '&wsidcontext=' + splitContext[4] + '&dmsidcontext=' + splitContext[6] + '&theme=' + theme;

        if(!isBlank(urlParameters.type)) url += '&type=' + urlParameters.type;

        window.history.replaceState(null, null, url);

        openItem();

    });

}
function openItem() {

    listServiceItems = { spareParts : [], kit : [], offering : [], wearParts : []}

    $('#header-subtitle').html('');
    $('#cart-list').html('');
    $('#items-content').html('');
    $('#items-processing').show();
    $('#overlay').hide();

    if(isBlank(links.snl)) $('#toggle-snl').addClass('hidden'); else $('#toggle-snl').removeClass('hidden');
    if(isBlank(links.context)) $('body').addClass('no-asset-service');
    
    adjustCartHeight();

    $.get('/plm/descriptor', { link : (links.context || links.ebom)}, function(response) {
        $('#header-subtitle').html(response.data);
        document.title = documentTitle + ': ' + response.data;
    });

    if(!isBlank(links.context)) {
        if(applicationFeatures.contextDocumentation) {
            $('#tab-documentation').show();
            insertAttachments(links.context, paramsDocumentation);
        }
    } else if($('#tab-documentation').length > 0) { $('#tab-documentation').hide(); }

    $('#tabs').children().first().click();

    // if(isBlank(sections)) getInitialData(links.bom.split('/')[4]);

    let paramsBOM = {
        bomViewName         : config.items.bomViewName, 
        collapseContents    : true,
        contentSize         : 's',
        reset               : true, 
        path                : true, 
        hideDetails         : false, 
        quantity            : true,
        counters            : true,
        getFlatBOM          : true, 
        search              : true,
        showRestricted      : false,
        toggles             : true,
        openInPLM           : config.applicationFeatures.openInPLM,
        revisionBias        : config.items.bomRevisionBias,
        endItem             : config.items.endItemFilter,
        selectItems         : { fieldId : config.items.fieldIdSparePart, values : config.items.fieldValuesSparePart }
    }

    let keys = Object.keys(config.paramsBOM);

    for(let key of keys) paramsBOM[key] = config.paramsBOM[key];

    insertBOM          (links.ebom, paramsBOM);
    insertViewer       (links.ebom);
    updateRelatedPanels(links.ebom);

    if(!isBlank(links.sbom)) insertServiceBOM();

    if(isBlank(links.snl)) {
        
        $('body').addClass('no-snl');   
        $('#toggle-snl').addClass('hidden');
    
    } else {

        console.log(config.serialNumbers.fieldIDs.partNumber);
        console.log(config.serialNumbers.fieldIDs.instanceId);

        $('body').removeClass('no-snl');
        $('#toggle-snl').removeClass('hidden');
        insertGrid(links.snl, { 
            id            : 'snl',
            headerLabel   : 'Serial Numbers',
            singleToolbar : 'controls',
            fieldsIn      : config.serialNumbers.tableColumns,
            editable      : true,
            groupBy       : config.serialNumbers.fieldIDs.partNumber,
            sortBy        : config.serialNumbers.fieldIDs.instanceId,
            sortType      : 'integer',
            onClickItem   : function(elemClicked) { selectSerialNumber(elemClicked); }
        });

    }

}
function updateRelatedPanels(link) {

    paramsProcesses.createContextItems      = [link];
    paramsProcesses.createContextItemFields = ['AFFECTED_ITEM'];

    if(!isBlank(links.context)) {
        paramsProcesses.createContextItems.push(links.context);
        paramsProcesses.createContextItemFields.push('AFFECTED_PRODUCT');
    }

    if(applicationFeatures.itemDetails        )          insertDetails(link, paramsItemDetails    );
    if(applicationFeatures.itemAttachments     )     insertAttachments(link, paramsItemAttachments);
    if(applicationFeatures.manageProblemReports) insertChangeProcesses(link, paramsProcesses      );

}


// Retrieve Workspace Details
// function getInitialData(wsId) {

//     let promises = [
//         $.get('/plm/sections'   , { wsId : wsId }),
//         $.get('/plm/fields'     , { wsId : wsId }),
//         $.get('/plm/sections'   , { wsId : wsProblemReports.id }),
//         $.get('/plm/fields'     , { wsId : wsProblemReports.id }),
//         $.get('/plm/sections'   , { wsId : wsSparePartsRequests.id })
//     ];

//     Promise.all(promises).then(function(responses) {

//         let errors = false;

//         for(let response of responses) {
//             if(response.error) {
//                 let message = (isBlank(response.data.message)) ? 'Error in accessing ' + response.params.url : response.data.message;
//                 showErrorMessage('Error occured', message);
//                 errors = true;
//             }
//         }

//         if(!errors) {
//             sections                        = responses[0].data;
//             fields                          = responses[1].data;
//             wsProblemReports.sections       = responses[2].data;
//             wsProblemReports.fields         = responses[3].data;
//             wsProblemReports.fieldIdImage   = config.problemReports.fieldIdImage;
//             wsSparePartsRequests.sections   = responses[4].data;

//             if(isBlank(config.problemReports.fieldIdImage)) {
//                 wsProblemReports.fieldIdImage = getFirstImageFieldID(wsProblemReports.fields);
//                 paramsProcesses.fieldIdMarkup = wsProblemReports.fieldIdImage;
//                 if(applicationFeatures.manageProblemReports) insertChangeProcesses(link, paramsProcesses);
//             }


//         }

//     });

// }     


// Parse BOM for Spare Parts
function changeBOMViewDone(id, settings, bom, selectedItems, flatBOM) {

    $('#bom-processing').hide();

    if(!isBlank(links.sbom)) {
        finishSparePartsList();
        return;
    }

    if(selectedItems.length > 15) $('#items-content').removeClass('l').addClass('m');

    // let fields         = [];
    // let urnsSpareParts = [];
    // let fieldIdImage   = config.items.fieldIdImage;
    let elemContent    = $('#items-content');

    // for(let bomView of settings.bomViews) {
    //     if(bomView.id == settings.viewId) {
    //         fields = bomView.columns;
    //         break;
    //     }
    // }

    // if(isBlank(fieldIdImage)) fieldIdImage = getFirstImageFieldID(fields);

    // for(let field of fields) {

    //     let urnField = field.__self__.urn;

    //     switch(field.fieldId) {
    //         case 'NUMBER'                                     : urnsSpareParts.partNumber   = urnField; break;
    //         case 'TITLE'                                      : urnsSpareParts.title        = urnField; break;
    //         case 'DESCRIPTION'                                : urnsSpareParts.description  = urnField; break;
    //         case fieldIdImage                                 : urnsSpareParts.image        = urnField; break;
    //         case common.workspaces.items.fieldIdNumber                   : urnsSpareParts.partNumber   = urnField; break;
    //         case config.fieldId                       : urnsSpareParts.spareWearPart= urnField; break;
    //         case config.items.sparePartTileDetails[0] : urnsSpareParts.material     = urnField; break;
    //         case config.items.sparePartTileDetails[1] : urnsSpareParts.weight       = urnField; break;
    //         case config.items.sparePartTileDetails[2] : urnsSpareParts.dimensions   = urnField; break;
    //     }

    // }
    
    // insertBOMSpareParts(elemContent, selectedItems, urnsSpareParts, flatBOM);

    for(let selectedItem of selectedItems) insertSparePart(elemContent, selectedItem, 'sparePart');
    
    setSparePartStockStatus();
    insertNonSparePartMessage();
    finishSparePartsList();

}
// function insertBOMSpareParts(elemParent, selectedItems, urnsSpareParts, flatBOM) {

//     let params = { 
//         icon     : 'icon-settings',
//         replace  : true
//     }

//     for(let selectedItem of selectedItems) {

//         listServiceItems.spareParts.push(selectedItem.node.item.link);

//         let elemSparePart = $('<div></div>').appendTo(elemParent)
//             .addClass('tile')
//             .addClass('spare-part')
//             .attr('data-link', selectedItem.node.item.link)
//             .attr('data-part-number', selectedItem.node.partNumber)
//             .attr('data-qty', selectedItem.node.totalQuantity)
//             .click(function(e) {
//                 clickSparePart($(this));
//             });
                        
//         let elemSparePartImage = $('<div></div>').appendTo(elemSparePart)
//             .addClass('spare-part-image')
//             .addClass('tile-image');
                
//         $('<span></span>').appendTo(elemSparePartImage)
//             .addClass('icon')
//             .addClass(params.icon);

//         params.imageLink = getFlatBOMCellValue(flatBOM, selectedItem.node.item.link, urnsSpareParts.image);
    
//         if(params.imageLink === '') {
//             $.get('/plm/details', { 'link' : selectedItem.node.item.link}, function(response) {
//                 params.imageLink = getFirstImageFieldValue(response.data.sections);
//                 $('.spare-part').each(function() {
//                     if($(this).attr('data-link') === response.params.link) {
//                         let elemImage = $(this).find('.spare-part-image').first();
//                         appendImageFromCache(elemImage, {}, params, function() {});
//                     }
//                 });
//             });
//         } else appendImageFromCache(elemSparePartImage, {}, params, function() {});
                    
//         let elemSparePartDetails = $('<div></div>').appendTo(elemSparePart)
//             .addClass('spare-part-details')
//             .addClass('tile-details');

//         let elemSparePartData = $('<div></div>').appendTo(elemSparePartDetails)
//             .addClass('spare-part-data')
//             .addClass('tile-data');
    
//         let elemSparePartID = $('<div></div>').appendTo(elemSparePartDetails)
//             .addClass('spare-part-identifier');
    
//         $('<div></div>').appendTo(elemSparePartID)
//             .addClass('spare-part-quantity')
//             .html(Number(selectedItem.node.totalQuantity));
    
//         $('<div></div>').appendTo(elemSparePartID)
//             .addClass('spare-part-number')
//             .addClass('tile-title')
//             .html(selectedItem.node.partNumber);    
        
//         let title = selectedItem.node.item.title;

//         if(title.indexOf(selectedItem.node.partNumber) === 0) title = selectedItem.node.item.title.split(' - ')[1];

//         $('<div></div>').appendTo(elemSparePartDetails)
//             .addClass('spare-part-title')
//             .html(title);  
    
//         $('<div></div>').appendTo(elemSparePartData)
//             .addClass('spare-part-material')
//             .addClass('with-icon')
//             .addClass('icon-product')
//             .addClass('filled')
//             .html(getBOMNodeValue(selectedItem.node, urnsSpareParts.material));
            
//         let partSpec        = '';
//         let partWeight      = getBOMNodeValue(selectedItem.node, urnsSpareParts.weight);
//         let partDimensions  = getBOMNodeValue(selectedItem.node, urnsSpareParts.dimensions);
                
//         if(partWeight !== '') {
//             partSpec = partWeight;
//             if(partWeight !== '') partSpec = partWeight + ' / ' + partDimensions;
//         } else partSpec = partDimensions
    
//         $('<div></div>').appendTo(elemSparePartData)
//             .addClass('spare-part-dimensions')
//             .addClass('with-icon')
//             .addClass('icon-width')
//             .html(partSpec);
    
//         let elemSparePartSide = $('<div></div>').appendTo(elemSparePart)
//             .addClass('spare-part-side');
    
//         let elemCartQuantity = $('<div></div>').appendTo(elemSparePartSide)
//             .addClass('cart-quantity')
//             .click(function(e) {
//                 e.preventDefault();
//                 e.stopPropagation();
//             });
    
//         $('<div></div>').appendTo(elemCartQuantity)
//             .addClass('cart-quantity-label')
//             .html('Qty');
    
//         $('<input></input>').appendTo(elemCartQuantity)
//             .addClass('cart-quantity-input')
//             .val('1');
    
//         let elemCartAdd = $('<div></div>').appendTo(elemSparePartSide)
//             .addClass('button')
//             .addClass('cart-add')
//             .click(function(e) {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 moveSparePart($(this));
//             });  
                
//         $('<div></div>').appendTo(elemCartAdd)
//             .addClass('icon')
//             .addClass('icon-cart-add');
    
//         $('<div></div>').appendTo(elemCartAdd)
//             .html('Add to cart');
    
//         $('<div></div>').appendTo(elemSparePartSide)
//             .addClass('button')
//             .addClass('icon')
//             .addClass('icon-delete')
//             .addClass('cart-remove')
//             .click(function(e) {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 moveSparePart($(this));
//             });  
    
//             if(applicationFeatures.showStock) {
//                 $('<div></div>').appendTo(elemSparePartSide).addClass('spare-part-stock');
//             }

//     }

// }
function insertServiceBOM() {

    let elemContent = $('#items-content');
        elemContent.addClass('service-bom').removeClass('l').addClass('m');

    let params = {
        link            : links.sbom,
        depth           : 4,
        viewId          : bomViewIdItems,
        getBOMPartsList : true,
    }

    $.get('/plm/bom', params, function(response) {

        let elemListGroup     = insertSparePartsGroup(elemContent, config.serviceBOMTypes.sparePart.groupLabel);
        let elemListParts     = insertSparePartsList(elemContent);
        let elemKitsGroup     = insertSparePartsGroup(elemContent, config.serviceBOMTypes.kit.groupLabel);
        let elemKitsParts     = insertSparePartsList(elemContent);
        let elemOfferingGroup = insertSparePartsGroup(elemContent, config.serviceBOMTypes.offering.groupLabel);
        let elemOfferingParts = insertSparePartsList(elemContent);
        let elemComponents    = null;
        let type              = '';

        for(let bomPart of response.data.bomPartsList) {

            if(bomPart.level === 1 && bomPart.details.TYPE === config.serviceBOMTypes.sparePart.fieldValue) { 
                type = 'sparePart'; 
            } else if(bomPart.level === 1 && bomPart.details.TYPE === config.serviceBOMTypes.kit.fieldValue) { 
                type = 'kit'; 
                let elemKit = insertSparePart(elemKitsParts, bomPart, 'kit');
                elemComponents = insertSparePartComponents(elemKit);
            } else if(bomPart.level === 1 && bomPart.details.TYPE === config.serviceBOMTypes.offering.fieldValue) { 
                type = 'offering'; 
                let elemOffering = insertSparePart(elemOfferingParts, bomPart, 'offering');
                elemComponents = insertSparePartComponents(elemOffering);
            } else if(bomPart.level === 2) {
                if(type === 'sparePart') insertSparePart(elemListParts, bomPart, 'sparePart');
                else if(type === 'kit') {
                    listServiceItems.kit.push(bomPart.link);
                    insertSparePartComponent(elemComponents, bomPart);
                }
            } else if(bomPart.level === 3) {
                if(type === 'offering') {
                    listServiceItems.offering.push(bomPart.link);
                    insertSparePartComponent(elemComponents, bomPart);
                }
            }

        }

        setSparePartStockStatus();
        insertNonSparePartMessage();
        finishSparePartsList();

    });

}
function insertSparePartsGroup(elemTop, text) {
 
    let elemSparePartsGroup = $('<div></div>').appendTo(elemTop)
        .addClass('spare-parts-group')
        .click(function() {
            let elemToggle = $(this).children().first();
            elemToggle.toggleClass('icon-chevron-down').toggleClass('icon-chevron-right');
            $(this).next().toggle();
        });
    
    $('<div></div>').appendTo(elemSparePartsGroup)
        .addClass('spare-parts-group-icon')
        .addClass('icon')
        .addClass('icon-chevron-down');

    $('<div></div>').appendTo(elemSparePartsGroup)
        .addClass('spare-parts-group-text')
        .html(text);;

    return elemSparePartsGroup;

}
function insertSparePartsList(elemParent) {
 
    let elemSparePartsList = $('<div></div>').appendTo(elemParent)
        .addClass('spare-parts-list')
        .addClass('list')
        .addClass('tiles')
        .addClass('m')
        .addClass('surface-level-2');

    return elemSparePartsList;

}
function insertSparePartComponents(elemPrevious) {
 
    elemPrevious.addClass('has-components');

    let elemSparePartComponents = $('<div></div>').insertAfter(elemPrevious)
        .addClass('spare-part-components')
        .addClass('no-scrollbar')
        .addClass('list')
        .addClass('tiles')
        .addClass('surface-level-2');

    $('<div></div>').appendTo(elemSparePartComponents)
        .addClass('spare-part-components-toggle')
        .addClass('icon-toggle-collapse')
        .addClass('icon')
        .click(function() {
            $(this).toggleClass('icon-toggle-collapse').toggleClass('icon-toggle-expand');
            $(this).prevAll('.spare-part-component').toggleClass('hidden');
        });

    return elemSparePartComponents;

}
function insertSparePartComponent(elemParent, bomPart) {

    let elemToggle = elemParent.find('.spare-part-components-toggle');

    let elemComponent = $('<div></div>').insertBefore(elemToggle)
        .attr('data-link', bomPart.link)
        .attr('data-root', bomPart.root)
        .attr('data-title', bomPart.title)
        .attr('data-part-number', bomPart.partNumber)
        .addClass('spare-part-component')
        .click(function(e) {
            clickSparePart($(this));
        });

    $('<div></div>').appendTo(elemComponent)
        .addClass('spare-part-component-quantity')
        .html(Number(bomPart.quantity));

    $('<div></div>').appendTo(elemComponent)
        .addClass('spare-part-component-title')
        .html(bomPart.title);

}
function insertSparePart(elemParent, bomPart, type) {

    listServiceItems.spareParts.push(bomPart.root);

    let addToCart = (elemParent.attr('id') === 'cart-list');

    let elemSparePart = $('<div></div>').appendTo(elemParent)
        .addClass('tile')
        .addClass('spare-part')
        .attr('data-link', bomPart.link)
        .attr('data-root', bomPart.root)
        .attr('data-title', bomPart.title)
        .attr('data-type', type)
        .attr('data-part-number', bomPart.partNumber)
        .attr('data-qty', bomPart.totalQuantity)
        .click(function(e) {
            clickSparePart($(this));
        });
                    
    let elemSparePartImage = $('<div></div>').appendTo(elemSparePart)
        .addClass('spare-part-image')
        .addClass('tile-image');

    let elemSparePartIcon = $('<span></span>').appendTo(elemSparePartImage)
            .addClass('icon')
            .addClass('filled')
            .addClass(config.serviceBOMTypes[type].icon);
         
    if(addToCart) {

        if(!isBlank(bomPart.image)) {

            elemSparePartIcon.remove();
            $('<img>').attr('src', bomPart.image).appendTo(elemSparePartImage);

        }

    } else {
    
        $.get('/plm/details', { link : bomPart.link }, function(response) {
            let params = {
                replace   : true,
                icon      : config.serviceBOMTypes[type].icon,
                imageLink : getFirstImageFieldValue(response.data.sections)
            }
            $('.spare-part').each(function() {
                if($(this).attr('data-link') === response.params.link) {
                    let elemImage = $(this).find('.spare-part-image').first();
                    appendImageFromCache(elemImage, {}, params, function() {});
                }
            });
        });
    }
                
    let elemSparePartDetails = $('<div></div>').appendTo(elemSparePart)
        .addClass('spare-part-details')
        .addClass('tile-details');

    let elemSparePartID = $('<div></div>').appendTo(elemSparePartDetails)
        .addClass('spare-part-identifier');

    $('<div></div>').appendTo(elemSparePartID)
        .addClass('spare-part-quantity')
        .html(Number(bomPart.totalQuantity));

    $('<div></div>').appendTo(elemSparePartID)
        .addClass('spare-part-number')
        .addClass('tile-title')
        .html(bomPart.details[config.items.sparePartTileTitle]);    

    $('<div></div>').appendTo(elemSparePartDetails)
        .addClass('spare-part-title')
        .html(bomPart.details[config.items.sparePartTileSubtitle]);  

    // $('<div></div>').appendTo(elemSparePartDetails)
    //     .addClass('spare-part-material')
    //     .addClass('with-icon')
    //     .addClass('icon-product')
    //     .addClass('filled');
    //     // .html(getBOMNodeValue(selectedItem.node, urnsSpareParts.material));
        
    // let partSpec        = '';
    // // let partWeight      = getBOMNodeValue(selectedItem.node, urnsSpareParts.weight);
    // // let partDimensions  = getBOMNodeValue(selectedItem.node, urnsSpareParts.dimensions);
            
    // // if(partWeight !== '') {
    // //     partSpec = partWeight;
    // //     if(partWeight !== '') partSpec = partWeight + ' / ' + partDimensions;
    // // } else partSpec = partDimensions

    // $('<div></div>').appendTo(elemSparePartDetails)
    //     .addClass('spare-part-dimensions')
    //     .addClass('with-icon')
    //     .addClass('icon-width')
    //     .html(partSpec);

    let elemSparePartSide = $('<div></div>').appendTo(elemSparePart)
        .addClass('spare-part-side');


    if(addToCart) {

        let elemCartQuantity = $('<div></div>').appendTo(elemSparePartSide)
            .addClass('cart-quantity')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
            });

        $('<div></div>').appendTo(elemCartQuantity)
            .addClass('cart-quantity-label')
            .html('Qty');

        $('<input></input>').appendTo(elemCartQuantity)
            .addClass('cart-quantity-input')
            .val('1');

        $('<div></div>').appendTo(elemSparePartSide)
            .addClass('button')
            .addClass('icon')
            .addClass('icon-delete')
            .addClass('cart-remove')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                removeCartItem($(this));
            });             

    } else {

        let elemCartAdd = $('<div></div>').appendTo(elemSparePartSide)
            .addClass('button')
            .addClass('cart-add')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                addCartItem($(this));
            });  
                
        $('<div></div>').appendTo(elemCartAdd)
            .addClass('icon')
            .addClass('icon-cart-add');

        $('<div></div>').appendTo(elemCartAdd)
            .html('Add to cart');

    }

    if(applicationFeatures.showStock) {
        $('<div></div>').appendTo(elemSparePartSide).addClass('spare-part-stock');
    }


    return elemSparePart;

}
function insertNonSparePartMessage() {

    if(isBlank(applicationFeatures.enableCustomRequests)) return;
    if(!applicationFeatures.enableCustomRequests) return;

    let elemMessage = $('<div></div>')
        .addClass('surface-level-3')
        .addClass('custom-message')
        .attr('id', 'custom-message')
        .prependTo($('#items-content'));
    
    $('<div></div>').appendTo(elemMessage)
        .addClass('custom-message-text')
        .html("The selected item is not available as spare part. While availability is not guaranteed, you may submit a request for this item anyway. We will validate the given item's availability per each request.<br>Do you want to include this item in your request?");
    
    $('<div></div>').appendTo(elemMessage)
        .addClass('custom-message-button')
        .addClass('button')
        .addClass('default')
        .html('Confirm')
        .click(function(){

            $('#custom-message').hide();
            // let link = $('#custom-message').attr('data-link');
            let itemData = {
                link          : $('#custom-message').attr('data-link'),
                root          : $('#custom-message').attr('data-root'),
                quantity      : 1,
                totalQuantity : 1
            };

            $('.bom-item').each(function() {
                if($(this).attr('data-link') === itemData.link) {
                    itemData.urn = $(this).attr('data-urn');
                    itemData.partNumber = $(this).attr('data-part-number');
                    itemData.title = $(this).attr('data-title');
                    $(this).addClass('is-spare-part').addClass('spare-part-custom');
                    let elemCell = $(this).find('.bom-column-icon');
                    $('<span></span>').appendTo(elemCell)
                        .addClass('icon')
                        .addClass(config.serviceBOMTypes.custom.icon)
                        .addClass('filled')
                        .attr('Custom spare part request');

                }
            });

            // let elemSparePart = genTileSparePart(link, itemData.urn, itemData.partNumber, itemData.title, 1.0);
            // let elemSparePart = genTileSparePart(link, itemData.partNumber, 1.0, itemData.title);

            // let bomPart = {
            //     link : link,

            // }

            let elemSparePart = insertSparePart($('#items-content'), itemData, 'custom');
                elemSparePart.insertAfter($('#custom-message'));
                elemSparePart.addClass('spare-part-custom');

            if(applicationFeatures.showStock) {

                let elemStock  = elemSparePart.find('.spare-part-stock');
                let stockLabel = 'No spare part';
                let stockClass = 'custom';
        
                elemSparePart.addClass('spare-part-stock-' + stockClass);
                elemStock.attr('title', stockLabel);
        
                $('<div></div>').appendTo(elemStock).addClass('spare-part-stock-icon');
                $('<div></div>').appendTo(elemStock).addClass('spare-part-stock-label').html(stockLabel);

            }

        });

}
function insertWearParts() {

    let index = 1;

    for(wearPart of listServiceItems.wearParts) {

        let elemWearPart = $('<div></div>');
            elemWearPart.addClass('wear-part');
            elemWearPart.attr('data-link', wearPart.link);
            elemWearPart.attr('data-part-number', wearPart.partNumber);
            elemWearPart.appendTo($('#wear-parts'));
            elemWearPart.click(function() {
                let link = $(this).attr('data-link');
                $('#bom-table').children().each(function() {
                    if($(this).attr('data-link') === link) { 
                        $(this).click();
                        $(this).get(0).scrollIntoView();
                    }
                });
            });

        let elemWearPartImage = $('<div></div>');
            elemWearPartImage.addClass('wear-part-image');
            elemWearPartImage.appendTo(elemWearPart);              
            
        if(wearPart.linkImage === '') {
            $.get('/plm/details', { 'link' : wearPart.link }, function(response) {
                let linkImage  = getFirstImageFieldValue(response.data.sections);
                $('.wear-part').each(function() {
                    if($(this).attr('data-link') === response.params.link) {
                        let elemWearPartImage = $(this).find('.wear-part-image').first();
                        getImageFromCache(elemWearPartImage, { 'link' : linkImage }, 'settings', '', function() {});
                    }
                });
            });
        } else {
            getImageFromCache(elemWearPartImage, { 'link' : wearPart.linkImage }, 'view_in_ar', '', function() {});
        }

        let elemWearPartDescriptor = $('<div></div>');
            elemWearPartDescriptor.addClass('wear-part-descriptor');
            elemWearPartDescriptor.html(wearPart.partNumber);
            elemWearPartDescriptor.appendTo(elemWearPart);

        let elemWearPartHealth = $('<div></div>');
            elemWearPartHealth.attr('id', 'wp' + index++);
            elemWearPartHealth.addClass('wear-part-health');
            elemWearPartHealth.appendTo(elemWearPart);

    }

}
// function genTileSparePart(link, partNumber, quantity, title) {

//     let elemSparePart = $('<div></div>')
//         .addClass('tile')
//         .addClass('spare-part')
//         .attr('data-link', link)
//         .attr('data-part-number', partNumber)
//         .attr('data-qty', quantity)
//         .click(function(e) {
//             clickSparePart($(this));
//         });
                    
//     let elemSparePartImage = $('<div></div>').appendTo(elemSparePart)
//         .addClass('spare-part-image')
//         .addClass('tile-image');
            
//     // let linkImage = getFlatBOMCellValue(flatBOM, selectedItem.node.item.link, urnsSpareParts.image);

//     // getImageFromCache(elemSparePartImage, { 'link' : linkImage }, 'settings', function() {});

//     // if(linkImage === '') {
//         $.get('/plm/details', { 'link' : link}, function(response) {
//             linkImage  = getFirstImageFieldValue(response.data.sections);
//             $('.spare-part').each(function() {
//                 if($(this).attr('data-link') === response.params.link) {
//                     let elemSparePartImage = $(this).find('.spare-part-image').first();
//                     getImageFromCache(elemSparePartImage, { 'link' : linkImage }, 'settings', '', function() {});
//                 }
//             });
//         });
//     // }
                
//     let elemSparePartDetails = $('<div></div>').appendTo(elemSparePart)
//         .addClass('spare-part-details')
//         .addClass('tile-details');

//     let elemSparePartID = $('<div></div>').appendTo(elemSparePartDetails)
//         .addClass('spare-part-identifier');

//     $('<div></div>').appendTo(elemSparePartID)
//         .addClass('spare-part-quantity')
//         .html(Number(quantity));

//     $('<div></div>').appendTo(elemSparePartID)
//         .addClass('spare-part-number')
//         .addClass('tile-title')
//         .html(partNumber);    

//     $('<div></div>').appendTo(elemSparePartDetails)
//         .addClass('spare-part-title')
//         .html(title);  

//     $('<div></div>').appendTo(elemSparePartDetails)
//         .addClass('spare-part-material')
//         .addClass('with-icon')
//         .addClass('icon-product')
//         .addClass('filled');
//         // .html(getBOMNodeValue(selectedItem.node, urnsSpareParts.material));
        
//     let partSpec        = '';
//     // let partWeight      = getBOMNodeValue(selectedItem.node, urnsSpareParts.weight);
//     // let partDimensions  = getBOMNodeValue(selectedItem.node, urnsSpareParts.dimensions);
            
//     // if(partWeight !== '') {
//     //     partSpec = partWeight;
//     //     if(partWeight !== '') partSpec = partWeight + ' / ' + partDimensions;
//     // } else partSpec = partDimensions

//     $('<div></div>').appendTo(elemSparePartDetails)
//         .addClass('spare-part-dimensions')
//         .addClass('with-icon')
//         .addClass('icon-width')
//         .html(partSpec);

//     let elemSparePartSide = $('<div></div>').appendTo(elemSparePart)
//         .addClass('spare-part-side');

//     let elemCartQuantity = $('<div></div>').appendTo(elemSparePartSide)
//         .addClass('cart-quantity')
//         .click(function(e) {
//             e.preventDefault();
//             e.stopPropagation();
//         });

//     $('<div></div>').appendTo(elemCartQuantity)
//         .addClass('cart-quantity-label')
//         .html('Qty');

//     $('<input></input>').appendTo(elemCartQuantity)
//         .addClass('cart-quantity-input')
//         .val('1');

//     let elemCartAdd = $('<div></div>').appendTo(elemSparePartSide)
//         .addClass('button')
//         .addClass('cart-add')
//         .click(function(e) {
//             e.preventDefault();
//             e.stopPropagation();
//             moveSparePart($(this));
//         });  
            
//     $('<div></div>').appendTo(elemCartAdd)
//         .addClass('icon')
//         .addClass('icon-cart-add');

//     $('<div></div>').appendTo(elemCartAdd)
//         .html('Add to cart');

//     $('<div></div>').appendTo(elemSparePartSide)
//         .addClass('button')
//         .addClass('icon')
//         .addClass('icon-delete')
//         .addClass('cart-remove')
//         .click(function(e) {
//             e.preventDefault();
//             e.stopPropagation();
//             moveSparePart($(this));
//         });  

//         if(applicationFeatures.showStock) {
//             $('<div></div>').appendTo(elemSparePartSide).addClass('spare-part-stock');
//         }


//     return elemSparePart;

// }
function setSparePartStockStatus() {

    if(!applicationFeatures.showStock) return;

    $('#items-content').find('.spare-part').each(function() {

        let elemSparePart = $(this);
        let elemStock     = elemSparePart.find('.spare-part-stock');
        let stockLabel    = 'In stock';
        let stockClass    = 'normal';
        let stockRandom   = Math.floor(Math.random() * 3) + 1;
    
             if(stockRandom === 2) { stockLabel = 'Low stock';    stockClass = 'low';  }
        else if(stockRandom === 3) { stockLabel = 'Out of stock'; stockClass = 'none'; }

        elemSparePart.addClass('spare-part-stock-' + stockClass);
        elemSparePart.attr('data-stock', stockClass);
        elemStock.attr('title', stockLabel);

        $('<div></div>').appendTo(elemStock)
            .addClass('spare-part-stock-icon');

        $('<div></div>').appendTo(elemStock)
            .addClass('spare-part-stock-label')
            .html(stockLabel);

    })

}
function finishSparePartsList() {

    $('#items-processing').hide();

    if($('#bom-thead-row').length === 0) return;

    $('<th></th>').addClass('bom-column-icon').addClass('bom-column-spare-parts').appendTo($('#bom-thead-row'));

    $('.bom-item').each(function() {

        let elemBOMItem = $(this);
        let rootLink     = elemBOMItem.attr('data-root-link');
        let elemCell    = $('<td></td>').appendTo(elemBOMItem).addClass('bom-column-icon').addClass('bom-column-spare-parts');
        let proceed     = true;

        for(let sparePart of listServiceItems.spareParts) {
            if(rootLink === sparePart) {
                proceed = false;
                $(this).addClass('is-spare-part');
                $('<span></span>').appendTo(elemCell)
                    .addClass('icon')
                    .addClass(config.serviceBOMTypes.sparePart.icon)
                    .addClass('filled')
                    .attr('title', 'Is Spare Part');
                break;
            }
        }

        if(proceed) {

            for(let kit of listServiceItems.kit) {
                if(rootLink === kit) {
                    proceed = false;
                    $(this).addClass('is-spare-part');
                    $('<span></span>').appendTo(elemCell)
                        .addClass('icon')
                        .addClass(config.serviceBOMTypes.kit.icon)
                        .addClass('filled')
                        .attr('title', 'Contained in Kit');
                }
            }

            if(proceed) {

                for(let offering of listServiceItems.offering) {
                    if(rootLink === offering) {
                        proceed = false;
                        $(this).addClass('is-spare-part');
                        $('<span></span>').appendTo(elemCell)
                            .addClass('icon')
                            .addClass(config.serviceBOMTypes.offering.icong)
                            .addClass('filled')
                            .attr('title', 'Included in offering');
                    }
                }

            }
        }
        
    });

}


// BOM User Interactions
function clickBOMItem(elemClicked, e) {

    $('.bom-item').removeClass('selected-context');

    let link = elemClicked.attr('data-link');

    if(elemClicked.hasClass('selected')) {
        
        setSparePartsList(elemClicked);
        viewerSelectModel(elemClicked.attr('data-part-number'), { highlight : false });
        updateRelatedPanels(link);

    } else {

        elemClicked.addClass('selected-context');

        resetSparePartsList();
        viewerResetSelection({
            fitToView : true
        });
        updateRelatedPanels(links.ebom);

    }

}
function panelResetDone(id, elemClicked) {
   
    resetSparePartsList();
    updateViewer();
    updateRelatedPanels(links.ebom);

}


// Manage Spare Parts List Panel
function setSparePartsList(elemItem) {

    $('#items-processing').show();
    
    let listBOMItems = [];
    let count        = 0;
    let level        = 0;
    let elemNext     = $('tr').closest().first();

    if(typeof elemItem !== 'undefined') {
        elemNext  = elemItem;
        level     = Number(elemItem.attr('data-level'));
    }

    let levelNext = level - 1;
    
    $('.spare-part').addClass('hidden');
    $('.spare-part-components').addClass('hidden');
    $('.spare-part-component').each(function() {$(this).removeClass('selected'); });    

    do {

        let isSparePart = elemNext.hasClass('is-spare-part');

        if(isSparePart) {

            count++;
            let root = elemNext.attr('data-root-link');

            if(listBOMItems.indexOf(root) === -1) {
                listBOMItems.push(root);
                unhideMatchingSpareParts(root);
            }
        }

        elemNext  = elemNext.next();
        levelNext = Number(elemNext.attr('data-level'));

    } while(levelNext > level);

    let elemCustomMessage = $('#custom-message');

    // If no spare part is present, validate if parents are spare parts
    if(listBOMItems.length === 0) {
        let parents = getBOMItemPath(elemItem);
        for(let parent of parents.items) {
            if(parent.hasClass('is-spare-part')) {
                let rootParent = parent.attr('data-root-link');
                listBOMItems.push(rootParent);
                unhideMatchingSpareParts(rootParent);
                break;
            }
        }
    }

    // Display message to order custom spare part if enabled
    if(elemCustomMessage.length > 0) {   
        if(listBOMItems.length > 0) {
            elemCustomMessage.hide();
        // } else if(!isNode) {
        } else {
            elemCustomMessage.attr('data-link', elemItem.attr('data-link')).show();
            elemCustomMessage.attr('data-root', elemItem.attr('data-root-link'));
        } 
    }

    $('#items-processing').hide();

}
function unhideMatchingSpareParts(root) {

    $('.spare-part').each(function() {
        if($(this).attr('data-root') === root) $(this).removeClass('hidden');
    });
    $('.spare-part-component').each(function() {
        if($(this).attr('data-root') === root) {
            // $(this).addClass('selected');
            $(this).parent().removeClass('hidden');
            $(this).parent().prev().removeClass('hidden');
        }
    });

}
function resetSparePartsList() {

    $('#custom-message').hide();
    $('.spare-part').each(function() {
        $(this).removeClass('hidden');
    });
    $('.spare-part-components').each(function() {
        $(this).removeClass('hidden');
    });
    $('.spare-part-component').each(function() {
        $(this).removeClass('selected');
    });

}


// Functionality of icons above the Spare Parts List
function filterBySparePartsList() {

    let partNumbers = [];

    $('#items').find('.spare-part').each(function() {

        let elemSparePart = $(this);

        if(!elemSparePart.hasClass('hidden')) {

            partNumbers.push(elemSparePart.attr('data-part-number'));

            let elemNext = elemSparePart.next();

            if(elemNext.hasClass('spare-part-components')) {
                elemNext.find('.spare-part-component').each(function() {
                    partNumbers.push($(this).attr('data-part-number'));
                });
            }

        }

    });    

    viewerSelectModels(partNumbers);

}
function highlightSparePartStocks() {

    highlightSparePartStock('spare-part-stock-normal', colors.vectors.green,  true );
    highlightSparePartStock('spare-part-stock-low'   , colors.vectors.yellow, false);
    highlightSparePartStock('spare-part-stock-none'  , colors.vectors.red,    false);
    highlightSparePartStock('spare-part-stock-custom', colors.vectors.blue,   false);

}
function highlightSparePartStock(className, vector, reset) {

    let partNumbers = [];

    $('#items').find('.spare-part.' + className).each(function() {

        let elemSparePart = $(this);

        if(!elemSparePart.hasClass('hidden')) {

            partNumbers.push(elemSparePart.attr('data-part-number'));

            let elemNext = elemSparePart.next();

            if(elemNext.hasClass('spare-part-components')) {
                elemNext.find('.spare-part-component').each(function() {
                    partNumbers.push($(this).attr('data-part-number'));
                });
            }

        }
    });

    viewerSetColors(partNumbers, { 
        color       : vector,
        resetColors : reset,
        isolate     : reset,
        unhide      : true
    });

}
function filterSparePartsByInput() {

    let value = $('#spare-parts-search-input').val().toLowerCase();

    $('.no-match').removeClass('no-match');

    if(value === '') return;

    $('#items').find('.spare-part').each(function() {

        let elemSparePart = $(this);
        let elemNext      = elemSparePart.next();
        let title         = elemSparePart.attr('data-title').toLowerCase();
        let number        = elemSparePart.attr('data-part-number').toLowerCase();
        let visible       = false;

        if( title.toLowerCase().indexOf(value) > -1) visible = true;
        if(number.toLowerCase().indexOf(value) > -1) visible = true;

        if(elemNext.hasClass('spare-part-components')) {
            elemNext.find('.spare-part-component').each(function() {
                let elemComponent = $(this);
                if(elemComponent.attr('data-title'      ).toLowerCase().indexOf(value) > -1) visible = true;
                if(elemComponent.attr('data-part-number').toLowerCase().indexOf(value) > -1) visible = true;
            });
        }

        if(!visible) {
            elemSparePart.addClass('no-match');
            if(elemNext.hasClass('spare-part-components')) elemNext.addClass('no-match');
        }

    });    

}

// Serial Number interactions
function selectSerialNumber(elemClicked) {

    console.log('selectSerialNumber START');

let gridRow  =  {
        partNumber   : '',
        path         : '',
        instancePath : ''
    }

    let elemPanel  = elemClicked.closest('.panel-top');
    // let rowData    = getSerialNumberDetails(elemClicked, );
    let fieldIDs = config.serialNumbers.fieldIDs;

elemClicked.children().each(function() {

        let elemCell = $(this);
        let fieldId  = elemCell.attr('data-id');

        if(!isBlank(fieldId)) {

            switch(fieldId) {

                case fieldIDs.partNumber:
                    gridRow.partNumber = elemCell.children().first().val();
                    break;

                case fieldIDs.path:
                    gridRow.path = elemCell.children().first().val();
                    break;

                case fieldIDs.instancePath:
                    gridRow.instancePath = elemCell.children().first().val();
                    break;

            }

        }           
        
    });


    console.log(gridRow);

    // $('.highlighted').removeClass('highlighted');

    // // if(isSelected) {

    //     // viewerResetSelection();

    // // } else {

    //     let elemToggleIsolate = elemPanel.find('.toggle-isolate');
    //     let addinAction       = 'selectInstance';

    //     if(elemToggleIsolate.length > 0) {
    //         if(elemToggleIsolate.hasClass('toggle-on')) {
    //             addinAction = 'isolateInstance';
    //         }
    //     }

    //     elemClicked.addClass('highlighted');

        // if(isAddin && sendAddinMessage) {
        //     console.log('addin message to ' + host);
        //     console.log(rowData);
        //     let selection = 'plm-item;' + rowData.partNumber + ';' + '--' + ';' + elemClicked.attr('data-link')+ ';' + rowData.instancePath;
        //     console.log(selection);
        //     console.log("addin message = " +  addinAction + ":" + selection.toString());
        //     // $('#overlay').show();
        //     window.chrome.webview.postMessage(addinAction + ":" + selection.toString()); 
        // } else {
            bomDisplayItemByPath(gridRow.path);
        // }

        viewerHighlightInstances(gridRow.partNumber, [], [gridRow.instancePath], {});

        // elemClicked.prevUntil('.table-group').each(function() { $(this).addClass('related'); })
        // elemClicked.nextUntil('.table-group').each(function() { $(this).addClass('related'); })

    // }

// }
// function getSerialNumberDetails(elemRow, columns) {

    // let gridRow  =  {
    //     partNumber   : '',
    //     path         : '',
    //     instancePath : ''
    // }

    // elemRow.children().each(function() {

    //     let elemCell = $(this);
    //     let fieldId  = elemCell.attr('data-id');

    //     if(!isBlank(fieldId)) {

    //         switch(fieldId) {

    //             case columns.partNumber:
    //                 gridRow.partNumber = elemCell.children().first().val();
    //                 break;

    //             case columns.path:
    //                 gridRow.path = elemCell.children().first().val();
    //                 break;

    //             case columns.instancePath:
    //                 gridRow.instancePath = elemCell.children().first().val();
    //                 break;

    //         }

    //     }           
        
    // });

    // return gridRow;

}


// Spare Part interactions
function clickSparePart(elemClicked) {

    let link       = elemClicked.attr('data-link');
    let partNumber = elemClicked.attr('data-part-number');

    if(applicationFeatures.itemDetails) insertDetails(link, paramsItemDetails);
    if(applicationFeatures.itemAttachments) insertAttachments(link, paramsItemAttachments);
    viewerSelectModel(partNumber, { 'highlight' : false , 'isolate' : true } );
    bomDisplayItemByPartNumber(partNumber, true, true);

}


// Viewer init and interactions
function initViewerDone() {

    $('#viewer-markup-image').attr('data-field-id', 'IMAGE_1');

}
function viewerClickResetDone() {}
// function viewerClickReset() {

//     viewer.showAll();
//     viewer.setViewFromFile();
//     viewerResetSelection();

// }
function onViewerSelectionChanged(event) {

    if(viewerHideSelected(event)) return;

    if(disableViewerSelectionEvent) return;

    if (event.dbIdArray.length === 1) {

        let proceed = true;
        let parents = getComponentParents(event.dbIdArray[0]);

        for(let parent of parents) {
            if(proceed) {
                let partNumber = parent.partNumber;

                if(!isBlank(partNumber)) {
                    $('.bom-item').removeClass('selected');
                    $('.bom-item').each(function() {
                        if(proceed) {
                            if($(this).attr('data-part-number') === partNumber) {
                                proceed = false;
                                let linkItem = $(this).attr('data-link');
                                $(this).addClass('selected');
                                bomDisplayItem($(this));
                                setSparePartsList($(this));
                                updateRelatedPanels(linkItem);
                            }
                        }
                    });
                }
            }
        }

    } else if (event.dbIdArray.length === 0) {

        let elemContext = $('.bom-item.selected-context');
        $('.bom-item').removeClass('selected');

        if(elemContext.length === 0) {
            resetSparePartsList();
            resetBOMPath('bom');
        } else {
    
            let linkItem = elemContext.attr('data-link');
            elemContext.addClass('selected');
            bomDisplayItem(elemContext);
            setSparePartsList(elemContext);
            updateBOMPath($(this));
            updateRelatedPanels(linkItem);           

        }

    } else {

        resetSparePartsList();
        
    }

    updatePanelCalculations('bom');

}
// function getFirstBOMParent() {

//     let paths = viewerGetSelectedComponentPaths();
//     let result = null;

//     for(let path of paths) {

//         if(isBlank(result)) {

//             let parents = path.split('|');

//             for(let parent of parents) {

//                 if(isBlank(result)) {

//                     let partNumber = parent.split(';')[0];

//                     $('.bom-item').each(function() {
//                         if($(this).attr('data-part-number') === partNumber) {
//                             console.log('found it');

//                             result = $(this);
//                         }
//                     });

//                 }


//             }
//         }

//     }

//     return result;

// }
function updateViewer(partNumber) {

    if(typeof partNumber === 'undefined') partNumber = '';

    disableViewerSelectionEvent = true;

    let selectedBOMNode = $('.bom-item.selected').first();

    if(partNumber !== '') {
        viewerSelectModel(partNumber, { 'highlight' : false , 'isolate' : true } );
    } else if(selectedBOMNode.length === 1) {
        partNumber = selectedBOMNode.attr('data-part-number');
        viewerSelectModel(partNumber, { 'highlight' : false ,'isolate' : true } );
    } else {
        viewerResetSelection(true, false);
    }

    disableViewerSelectionEvent = false;

}


// Cart Management
function addCartItem(elemClicked) {

    let elemSparePart = elemClicked.closest('.spare-part');
        elemSparePart.addClass('in-cart');

    if(elemSparePart.hasClass('has-components')) elemSparePart.next().addClass('in-cart');

    let item = {
        link          : elemSparePart.attr('data-link'),
        root          : elemSparePart.attr('data-root'),
        title         : elemSparePart.find('.spare-part-title').html(),
        type          : elemSparePart.attr('data-type'),
        image         : elemSparePart.find('img').attr('src'),
        partNumber    : elemSparePart.attr('data-part-number'),
        totalQuantity : elemSparePart.attr('data-qty'),
    }

    let elemItem = insertSparePart($('#cart-list'), item, item.type);
    
    if(applicationFeatures.showStock) {
        elemItem.addClass('spare-part-stock-' + elemSparePart.attr('data-stock'));
        let elemStock = elemItem.find('.spare-part-stock');
        $('<div></div>').appendTo(elemStock).addClass('spare-part-stock-icon');
    }

    adjustCartHeight();
    
}
function removeCartItem(elemClicked) {

    let elemSparePart = elemClicked.closest('.spare-part');
    let root = elemSparePart.attr('data-root');

    $('#items').find('.spare-part').each(function() {
        if($(this).attr('data-root') === root) {
            $(this).removeClass('in-cart');
            if($(this).hasClass('has-components')) $(this).next().removeClass('in-cart');
        }
    });

    elemSparePart.remove();

    adjustCartHeight();
    filterSparePartsByInput();
    
}
function adjustCartHeight() {

    let elemCart            = $('#cart');
    let countPartsInCart    = $('#cart-list').children().length;
    let topTabs             = 0;
    let heightCart          = 38;
    let heightCartList      = 0;
    let maxHeight           = ($('#main').height() - 50) * 0.5;
    let heightTiles         = 68;
    let isVisible           = elemCart.is(':visible');

    if(countPartsInCart === 0) {

        if(isVisible) elemCart.hide();

    } else if(elemCart.hasClass('collapsed')) {

        if(!isVisible) setTimeout(function() { elemCart.fadeIn(); }, 300);

        topTabs = 100;

    } else {

        if(!isVisible) setTimeout(function() { elemCart.fadeIn(); }, 300);
        heightCart = 68 + (countPartsInCart * heightTiles);

        if(heightCart > maxHeight) {
            heightCart      = maxHeight;
            heightCartList  = heightCart - 70;
        } else {
            heightCartList  = countPartsInCart * heightTiles;
        }

        topTabs = heightCart + 70;

    }

    elemCart.css('height', heightCart + 'px');
    $('#cart-list').css('height', heightCartList + 'px');
    $('#tabs').css('top', topTabs + 'px');
    $('.tab-group-main').css('top', (56 + topTabs) + 'px');

    updateCartCounter();

}
function updateCartCounter() {

    let count = $('#cart-list').children().length; 

    $('#cart-counter').html(count);

    if(count === 0) {
        $('#cart-counter').hide();
    } else {
        $('#cart-counter').show();
    }

}


// Update request creation dialog upon opening and cosing
function setRequestList() {

    $('#cart').addClass('collapsed');
    
    $('#cart-list').children().each(function() {
        $(this).appendTo($('#request-list'));
    });

    adjustCartHeight();
}
function clearRequestList() {
    
    $('#cart').removeClass('collapsed');

    $('#request-list').children().each(function() {
        $(this).appendTo($('#cart-list'));
    });

    adjustCartHeight();
}


// Create Spare Parts Request in PLM
function submitRequest() {

    if($('#request-creation-submit').hasClass('disabled')) return;

    $('#request-creation').hide();
    $('#overlay').show();
    $('#overlay-processing').show();

    let params = {
        wsId     : wsSparePartsRequests.id,
        sections : wsSparePartsRequests.sections,
        fields   : [
            { fieldId : 'LINKED_ITEM'             , value : { link : links.ebom }},
            { fieldId : 'REQUESTOR_NAME'          , value : $('#request-name').val()},
            { fieldId : 'REQUESTOR_COMPANY'       , value : $('#request-company').val()},
            { fieldId : 'REQUESTOR_EMAIL'         , value : $('#request-e-mail').val()},
            { fieldId : 'REQUESTOR_ADDRESS'       , value : $('#request-address').val()},
            { fieldId : 'REQUESTOR_CITY'          , value : $('#request-city').val()},
            { fieldId : 'REQUESTOR_POSTAL_CODE'   , value : $('#request-postal').val()},
            { fieldId : 'REQUESTOR_COUNTRY_CODE'  , value : $('#request-country').val()},
            { fieldId : 'REQUEST_SHIPPING_ADDRESS', value : $('#request-shipping-address').val()},
            { fieldId : 'REQUEST_COMMENTS'        , value : $('#reqeust-comments').val()}
        ]
    } 

    $.post({
        url         : '/plm/create', 
        contentType : 'application/json',
        data        : JSON.stringify(params)
    }, function(response) {

        if(!response.error) {

            $('#request-list').children().each(function() {

                let link         = $(this).attr('data-link');
                let quantity     = $(this).find('.cart-quantity-input').val();
                let availability = $(this).find('.spare-part-stock-label').html();
                let params       = {
                    wsId : wsSparePartsRequests.id,
                    link : response.data.split('.autodeskplm360.net')[1],
                    data : [
                        { fieldId : 'ITEM', value : { 'link' : link } },
                        { fieldId : 'QUANTITY', value : quantity },
                        { fieldId : 'AVAILABILITY_AT_REQUEST', value : availability }
                    ]
                }

                $.post('/plm/add-grid-row', params, function(response) {});

            });

            $('#request-list').children().each(function() { $(this).prependTo($('#items-content')); });

            showSuccessMessage('Request has been created successfuly.');

        }

        $('#overlay').hide();
        $('.spare-part.selected').each(function() { $(this).click(); });

    });

}