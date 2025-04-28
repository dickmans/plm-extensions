let links           = {}
let wsConfig        = {};
let urlParameters   = getURLParameters();
let paramsDetails   = {
    editable       : false,
    openInPLM      : true,
    bookmark       : true,
    layout         : 'narrow',
    headerLabel    : 'descriptor',
    expandSections : ['Basic']
}

$(document).ready(function() {

    appendOverlay(false);
    appendProcessing('serivce-offerings', false);

    getFeatureSettings('sbom', [], function() {

        getInitialData();
        setUIEvents();
        insertDetails(urlParameters.link, paramsDetails);

    });

});


function setUIEvents() {

    $('#toggle-viewer').click(function() {
        $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
        $('body').toggleClass('no-viewer');
        viewerResize(100);
    });

    $('#toggle-details').click(function() {
        $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
        $('body').toggleClass('no-details');
        viewerResize(100);
    });

    $('#add-service-offering').click(function() {
        insertServiceOffering();
    });

    $('#save').click(function() {
        saveChanges();
    });

}



function getInitialData() {

    let requests = [
        $.get('/plm/details' , { link : urlParameters.link }),
        $.get('/plm/picklist', { link : '/api/v3/lookups/CUSTOM_LOOKUP_ITEM_TYPES' }),
        $.get('/plm/sections', { wsId : config.items.wsId })
    ];

    Promise.all(requests).then(function(responses) {

        $('#overlay').hide();
        $('#header-subtitle').html(responses[0].data.title);

        links.ebom    = getSectionFieldValue(responses[0].data.sections, config.sbom.fieldIdEBOM, '', 'link');
        links.sbom    = getSectionFieldValue(responses[0].data.sections, config.sbom.fieldIdSBOM, '', 'link');

        wsConfig.sections = responses[2].data;

        console.log(responses);
        console.log(links);

        for(let type of responses[1].data.items) {

            if(type.title === config.sbom.typeServiceOffering) {
                wsConfig.linkTypeService = type.link;
            }

        }

        console.log(wsConfig);

        // insertViewer(links.ebom); 
        insertBOM(links.ebom, {
            collapseContents : true,
            counters         : true,
            search           : true,
            path             : true,
            toggles          : true,
            viewerSelection  : true,
            columnsIn        : ['Quantity'],
            onClickItem      : function(elemClicked) { insertDetails(elemClicked.attr('data-link'), paramsDetails); },
            onDblClickItem   : function(elemClicked) { insertPart(elemClicked); }
        }); 
        
        getServiceOfferings();

    });

}
function getServiceOfferings() {

    if(isBlank(links.sbom)) return;

    let params = {
        link : links.sbom
    }

    $.get('/plm/bom-views-and-fields', params, function(response) {

        let bomSettings = {};

        for(let bomView of response.data) {

            console.log(bomView);

            if(bomView.name === config.sbom.bomViewName) {
                params.viewId = bomView.id;
                bomSettings.viewFields = bomView.fields;
                break;
            }
        }

        params.depth = 2;
        
        $.get('/plm/bom', params, function(response) {

            $('#serivce-offerings-processing').remove();
            
            console.log(response);

            let parts = getBOMPartsList(bomSettings, response.data);

            console.log(parts);

            for(let part of parts) {

                // if(node.item.link !== links.bom) {

                if(!isBlank(part.details.TYPE)) {

                    console.log('1');

                    console.log(part);

                    if(part.details.TYPE.title === config.sbom.typeServiceOffering) {

                        console.log('2');

                        let elemService = insertServiceOffering(part.link, part.details.TITLE);
                    }

                }

            }
            
        });
        
    });

}







function insertServiceOffering(link, title) {

    if(isBlank(link) ) link  = '';
    if(isBlank(title)) title = '';

    let elemService = $('<div></div>').appendTo($('#serivce-offerings'))
        .addClass('service')
        .addClass('surface-level-3')
        .attr('data-link', link)
        .attr('data-title', title);


    let elemServiceHeader = $('<div></div>').appendTo(elemService)
        .addClass('service-header');        

    let elemServiceTitle = $('<input>').appendTo(elemServiceHeader)
        .addClass('service-title')
        .attr('placeholder', 'Type name');

    if(!isBlank(title)) elemServiceTitle.val(title);

    let elemServiceActions = $('<div></div>').appendTo(elemServiceHeader)
        .addClass('service-actions');

    $('<div></div>').appendTo(elemServiceActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-3d');

    $('<div></div>').appendTo(elemServiceActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-open');
    
    $('<div></div>').appendTo(elemServiceActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-maximize');

    $('<div></div>').appendTo(elemServiceActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-deselect-all')
        .click(function() {
            selectOperations($(this), 'none');
        });

    $('<div></div>').appendTo(elemServiceActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-select-all')
        .click(function() {
            selectOperations($(this), 'all');
        });

    $('<div></div>').appendTo(elemServiceActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-delete')
        .click(function() {
            $(this).closest('.service').remove();
        })


    let elemServiceOperations = $('<div></div>').appendTo(elemService)
        .addClass('service-operations')
        .addClass('tiles') 
        .addClass('list')
        .addClass('xs');

    let elemServiceFooter = $('<div></div>').appendTo(elemService)
        .addClass('service-header');        

    $('<input>').appendTo(elemServiceFooter)
        .addClass('service-new-operation')
        .attr('placeholder', 'Type to insert new operation')
        .keypress(function(e) {
            insertNewServiceOperation(e, $(this));
        });

    return elemService;

}
function insertServiceOperation(elemService, title, link) {

    let elemContent = elemService.find('.service-operations').first();


    let elemOperation  = $('<div></div>').appendTo(elemContent)
        .addClass('service-operation')
        .addClass('tile')
        .click(function() {
            $(this).toggleClass('selected');
        });

    let elemImage = $('<div></div>').appendTo(elemOperation)
        .addClass('tile-image');

    $('<span></span>').appendTo(elemImage)
        .addClass('icon')
        .addClass('icon-service');
        // .html('1');
    // $('<div></div>').appendTo(elemImage)
    //     .addClass('tile-counter')
    //     .html('1');
    
    let elemDetails = $('<div></div>').appendTo(elemOperation)
        .addClass('tile-details');    

    $('<div></div>').appendTo(elemDetails)
        .addClass('tile-title')
        .html(title);


    $('<div></div>').appendTo(elemContent)
        .addClass('service-items')
        .addClass('surface-level-3')
        .addClass('tiles')
        .addClass('list')
        .addClass('xs');

}


function selectOperations(elemButton, mode) {

    let elemParent = elemButton.closest('.service');
    let elemOperations = elemParent.find('.service-operation');

    elemOperations.each(function() {

        if(mode === 'all') $(this).addClass('selected');
        else $(this).removeClass('selected');

    });

}


function insertNewServiceOperation(e, elemInput) {
    
    if (e.which == 13) {

        if(elemInput.val() === '') return;

        // let elemNew = getBOMNode(2, '', '', '', '', $('#mbom-add-name').val(), '', '', '', $('#mbom-add-code').val(), 'radio_button_unchecked', '', 'mbom', '', false);
        //     elemNew.attr('data-parent', '');
        //     elemNew.addClass('operation');
        //     elemNew.addClass('neutral');
        
        // let elemBOM = $('#mbom-tree').children().first().children('.item-bom').first();

        // if(disassembleMode) elemBOM.prepend(elemNew);
        // else elemBOM.append(elemNew);

        // selectProcess(elemNew);

        insertServiceOperation(elemInput.closest('.service'), elemInput.val());

        
        elemInput.val('');
        elemInput.focus();
        
    }
    
}




function insertPart(elemClicked) {

    console.log('hiere');

    console.log(elemClicked.length);
    console.log(elemClicked.attr('data-part-number'));

    $('.service-operation.selected').each(function() {

        let elemList = $(this).next();

        let elemItem  = $('<div></div>').appendTo(elemList)
            .addClass('service-item')
            .addClass('tile')
            .click(function() {
                $(this).toggleClass('selected');
            });

        let elemImage = $('<div></div>').appendTo(elemItem)
            .addClass('tile-image');

        $('<span></span>').appendTo(elemImage)
            .addClass('icon')
            .addClass('icon-product');
            // .html('1');
        // $('<div></div>').appendTo(elemImage)
        //     .addClass('tile-counter')
        //     .html('1');
        
        let elemDetails = $('<div></div>').appendTo(elemItem)
            .addClass('tile-details');    

        $('<div></div>').appendTo(elemDetails)
            .addClass('tile-title')
            .html(elemClicked.attr('data-title'));


    });

}


function createRootAssetItem(linkItem, dataDerived, callback) {

    let params = {
        wsId     : wsAssetItems.id,
        sections : []
    };

    addFieldToPayload(params.sections, wsAssetItems.sections, null, config.sbom.fieldIdAssetItemAsset, { link : links.asset });
    addFieldToPayload(params.sections, wsAssetItems.sections, null, config.sbom.fieldIdAssetItemItem,  { link : linkItem    });
    
    addDerivedFieldsToPayload(params.sections, wsAssetItems.sections, dataDerived);

    console.log(params);

    $.post('/plm/create', params, function(response) {
        links.abom = response.data.split('360.net')[1];
        callback();
    });

}
function linkRootAssetItem(wsAssetsSections) {

    $.get('/plm/derived', {

        link        : links.abom,
        wsId        : wsId,
        fieldId     : config.sbom.fieldIdAssetABOM,
        pivotItemId : links.abom.split('/')[6],

    }, function(response) {

        let params = {
            link     : links.asset,
            sections : [] 
        }

        addFieldToPayload(params.sections, wsAssetsSections, null, config.sbom.fieldIdAssetABOM, { 'link' : links.abom });
        addDerivedFieldsToPayload(params.sections, wsAssetsSections, response.data);

        $.post('/plm/edit', params, function(response) {
            // console.log(response);
        });

    });

}
function insertEditor() {

    let additionalRequests = [$.get('/plm/bom', { link : links.abom, viewId : wsAssetItems.bomViewId })];

    for(let projectItem of projectItems) {
        additionalRequests.push($.get('/plm/manages', { link : projectItem.link }));
    }

    insertBOM(links.mbom, {
        headerLabel         : 'Asset BOM',
        columnsIn           : ['Quantity'],
        collapseContents    : true,
        openInPLM           : true,
        search              : true,
        reload              : true,
        toggles             : true,
        bomViewName         : config.sbom.bomViewNameItems,
        additionalRequests  : additionalRequests,
        onClickItem         : function(elemClicked) { onBOMItemClick(elemClicked); }
    }); 

}
function onBOMItemClick(elemClicked) {

    // $('#grid').addClass('hidden');

    let partNumber = elemClicked.attr('data-part-number');
    let itemNumber = elemClicked.find('.column-id').html();
    let linkSBOM   = elemClicked.attr('data-link-sbom');

    if(elemClicked.hasClass('is-serial')) { 
        $('body').removeClass('no-grid');
    }

    if(elemClicked.hasClass('selected')) { 

        viewerSelectModel(partNumber);

        links.selected = linkSBOM;

        if(!isBlank(linkSBOM)) {
            insertGrid(linkSBOM, {
                // columnsEx   : ['Item Number'],
                editable    : true,
                headerLabel : itemNumber + ': Serial Numbers',
                columnsEx   : ['Status', 'Supplier', 'Remarks', 'Previous Serial #', 'Previous Item Rev'],
                // headerLabel : 'descriptor',
                reload      : true,
                useCache    : false,
                onClickItem : function(elemClicked) { selectSerialNumber(elemClicked); }
            });
        } 



    } else {

        $('body').addClass('no-grid');
        viewerResetSelection();
    }

}



function saveChanges() {

    console.log('saveChanges START');

    $('#overlay').show();

    $('.service').each(function() {

        let link = $(this).attr('data-link');

        if(link === '') {
            $(this).addClass('pending-creation');
            $(this).addClass('pending-addition');
        }

    });


    createNewOfferings();




    // let requests  = [];
    // let reqRemove = [];

    // for(let projectItem of projectItems) projectItem.items = [];
    
    // $('#overlay').show();

    // $('#bom-tbody').children().each(function() {
        
    //     let elemItem     = $(this);
    //     let elemChanged  = elemItem.find('td.changed');
    //     let linkSBOM     = elemItem.attr('data-link-sbom');
    //     let linkAssigned = elemItem.attr('data-link-assigned');
    //     let linkUpdate   = elemItem.attr('data-link-update');
        
    //     if(!isBlank(linkSBOM)) {

    //         if(elemChanged.length > 0) {

    //             let params = { link : linkSBOM, sections : [] }

    //             addFieldToPayload(params.sections, wsAssetItems.sections, null, 'END_ITEM'  , elemItem.hasClass('is-end-item'));
    //             addFieldToPayload(params.sections, wsAssetItems.sections, null, 'SPARE_PART', elemItem.hasClass('is-spare-part'));
    //             addFieldToPayload(params.sections, wsAssetItems.sections, null, 'PURCHASED' , elemItem.hasClass('is-purchased'));
    //             addFieldToPayload(params.sections, wsAssetItems.sections, null, 'SERIAL'    , elemItem.hasClass('is-serial'));
            
    //             console.log(params);

    //             requests.push($.post('/plm/edit', params));

    //         }

       
    //         console.log(linkAssigned);
    //         console.log(linkUpdate);


    //         if(linkAssigned !== linkUpdate) {

    //             if(!isBlank(linkUpdate)) {

    //                 for(let projectItem of projectItems) {

    //                     if(projectItem.link === linkUpdate) {
    //                         projectItem.items.push(linkSBOM);
    //                     }

    //                 }

                    
    //             }

    //             if(!isBlank(linkAssigned)) {
    //                     reqRemove.push($.get('/plm/remove-managed-item', {
    //                         link : linkAssigned, 
    //                     itemId : linkSBOM.split('/')[6]
    //                 }));
    //             }

    //             elemItem.attr('data-link-assigned', linkUpdate);

    //         }
    //     }

    // });


    // for(let projectItem of projectItems) {

    //     if(projectItem.items.length > 0) {
    //         // console.log(projectItem.items);
    //         requests.push($.get('/plm/add-managed-items', { link : projectItem.link, items : projectItem.items }))
    //     }

    // }

    // // console.log(projectItems);

    // console.log(reqRemove.length);
    // console.log(requests.length);

    // // requests = [];


    // Promise.all(reqRemove).then(function(responses) {
    //     console.log(responses);
    //     Promise.all(requests).then(function(responses) {
    //         console.log(responses);
    //         $('#overlay').hide();
    //         $('#bom').removeClass('changed');
    //         $('td').removeClass('changed');
    //     });
    // });

}
function createNewOfferings() {

    let requests    = [];
    let index       = 0;

    $('.service.pending-creation').each(function() {

        let link = $(this).attr('data-link');

        if(link === '') {

            let params = {
                wsId      : config.items.wsId,
                sections  : []
            };

            let title = $(this).find('.service-title').first().val();

            addFieldToPayload(params.sections, wsConfig.sections, null, 'TITLE', title);
            addFieldToPayload(params.sections, wsConfig.sections, null, 'TYPE' , { link : wsConfig.linkTypeService });

            $(this).attr('data-index', index++)
            requests.push($.post('/plm/create', params));

        }

    });

    Promise.all(requests).then(function(responses) {

        $('.service.pending-creation').each(function() {

            let elemService = $(this);
            let curIndex    = elemService.attr('data-index');

            if(!isBlank(curIndex)) {

                let link = responses[curIndex].data.split('.autodeskplm360.net')[1];
                elemService.attr('data-link', link);

            }

            elemService.removeAttr('data-index').removeClass('pending-creation');

        });

        connectNewOfferings();

    });

}
function connectNewOfferings() {

    let requests    = [];
    let index       = 0;

    $('.service.pending-addition').each(function() {

        // let link = $(this).attr('data-link');

        let params = {                    
            linkParent   : links.sbom, 
            linkChild    : $(this).attr('data-link'),
            // number        : elemItem.attr(data-number),
            quantity      : 1,
            pinned        : false,
            fields        : []
        };


        // if(link === '') {

            // let params = {
            //     wsId      : config.items.wsId,
            //     sections  : []
            // };

            // let title = $(this).find('.service-title').first().val();

            // addFieldToPayload(params.sections, wsConfig.sections, null, 'TITLE', title);

            console.log(params);

            // newServices.push($(this));
            $(this).attr('data-index', index++);
            requests.push($.get('/plm/bom-add', params));
        // }

    });

    Promise.all(requests).then(function(responses) {

        // $('.service').each(function() {

        //     let elemService = $(this);

        //     let curIndex = elemService.attr('data-index');

        //     if(!isBlank(curIndex)) {


        //         let link = responses[curIndex].data.split('.autodeskplm360.net')[1];
        //         elemService.attr('data-link', link);

        //     }

        //     elemService.removeAttr('data-index');

        // });

        console.log(responses);
        $('#overlay').hide();

    });

}


