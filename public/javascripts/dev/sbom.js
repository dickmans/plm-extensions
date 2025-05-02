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


// Get current Product data
function getInitialData() {

    let requests = [
        $.get('/plm/details' , { link : urlParameters.link }),
        $.get('/plm/picklist', { link : '/api/v3/lookups/CUSTOM_LOOKUP_ITEM_TYPES' }),
        $.get('/plm/sections', { wsId : config.items.wsId })
    ];

    Promise.all(requests).then(function(responses) {

        $('#overlay').hide();
        $('#header-subtitle').html(responses[0].data.title);
        appendProcessing('serivce-offerings', false);

        links.ebom    = getSectionFieldValue(responses[0].data.sections, config.sbom.fieldIdEBOM, '', 'link');
        links.sbom    = getSectionFieldValue(responses[0].data.sections, config.sbom.fieldIdSBOM, '', 'link');

        wsConfig.sections = responses[2].data;

        for(let type of responses[1].data.items) {

            if(type.title === config.sbom.typeServiceOffering) {
                wsConfig.linkTypeService = type.link;
            } else if(type.title === config.sbom.typeServiceOperation) {
                wsConfig.linkTypeServiceOperation = type.link;
            }

        }

        insertViewer(links.ebom); 
        insertBOM(links.ebom, {
            collapseContents : true,
            counters         : true,
            search           : true,
            path             : true,
            toggles          : true,
            viewerSelection  : true,
            columnsIn        : ['Quantity'],
            onClickItem      : function(elemClicked) { insertDetails(elemClicked.attr('data-link'), paramsDetails); },
            onDblClickItem   : function(elemClicked) { addSelectedPart(elemClicked); }
        }); 
        
        getServiceOfferingsBOM();

    });

}
function getServiceOfferingsBOM() {

    if(isBlank(links.sbom)) return;

    let params = {
        link : links.sbom
    }

    $.get('/plm/bom-views-and-fields', params, function(response) {

        let bomSettings = {};

        for(let bomView of response.data) {
            if(bomView.name === config.sbom.bomViewName) {
                params.viewId = bomView.id;
                bomSettings.viewFields = bomView.fields;
                break;
            }
        }

        params.depth = 3;
        
        $.get('/plm/bom', params, function(response) {

            $('#serivce-offerings-processing').remove();
            
            let parts = getBOMPartsList(bomSettings, response.data);
            let elemService, elemServiceOperation;

            for(let part of parts) {

                let type = part.details.TYPE || { title : '' };

                console.log(part);

                if(type.title === config.sbom.typeServiceOffering) {
                    elemService = insertServiceOffering(part.link, part.details.TITLE, part.edgeId, part.linkParent);
                } else  if(type.title === config.sbom.typeServiceOperation) {
                    elemServiceOperation = insertServiceOperation(elemService, part.link, part.details.TITLE, part.edgeId);
                } else if (part.level === 4) {
                    insertServiceItem(elemServiceOperation.next(), part.link, part.details.TITLE,  part.details.NUMBER, part.edgeId, part.quantity)
                }

            }
            
        });
        
    });

}


/* Insert UI elements for SBOM definition */
function insertServiceOffering(link, title, edgeId, parent) {

    if(isBlank(link)  ) link   = '';
    if(isBlank(title) ) title  = '';
    if(isBlank(edgeId)) edgeId = '';
    if(isBlank(parent)) parent = '';

    let elemService = $('<div></div>').appendTo($('#serivce-offerings'))
        .addClass('service')
        .addClass('surface-level-3')
        .attr('data-link', link)
        .attr('data-title', title)
        .attr('data-edgeid', edgeId)
        .attr('data-parent', parent);

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
        .addClass('icon-3d')
        .click(function() {
            let partNumbers = [];
            $('.bom-item').removeClass('result');
            let elemService = $(this).closest('.service');
            elemService.find('.service-item').each(function() {
                let partNumber = $(this).attr('data-part-number');
                partNumbers.push(partNumber);
                $('.bom-item').each(function() {
                    if($(this).attr('data-part-number') === partNumber) $(this).addClass('result');
                })
            });
            console.log(partNumbers);
            viewerSelectModels(partNumbers);
        });

    $('<div></div>').appendTo(elemServiceActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-open')        
        .click(function() {
            openItemByLink($(this).closest('.service').attr('data-link'));
        })
    
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
            selectItems($(this), 'none');
        });

    // $('<div></div>').appendTo(elemServiceActions)
    //     .addClass('button')
    //     .addClass('icon')
    //     .addClass('icon-select-all')
    //     .click(function() {
    //         selectOperations($(this), 'all');
    //     });

    $('<div></div>').appendTo(elemServiceActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-delete')
        .click(function() {
            $(this).closest('.service').addClass('hidden');
        });


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
function insertServiceOperation(elemService, link, title, edgeId) {

    if(isBlank(link)  ) link   = '';
    if(isBlank(title) ) title  = '';
    if(isBlank(edgeId)) edgeId = '';

    let elemContent = elemService.find('.service-operations').first();

    let elemOperation  = $('<div></div>').appendTo(elemContent)
        .addClass('service-operation')
        .addClass('tile')
        .attr('data-link', link)
        .attr('data-edgeid', edgeId)
        .click(function() {
            $(this).toggleClass('selected');
            if($(this).hasClass('selected')) {
                insertDetails($(this).attr('data-link'), paramsDetails);
            }
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
    
    // let elemDetails = $('<div></div>').appendTo(elemOperation)
    //     .addClass('tile-details');    

    $('<input>').appendTo(elemOperation)
        .addClass('service-operation-name')
        .val(title);

    $('<div></div>').appendTo(elemOperation)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-delete')
        .click(function() {
            let elemOperation = $(this).closest('.service-operation');
            elemOperation.addClass('hidden');
            elemOperation.next().addClass('hidden');
        });        

    $('<div></div>').appendTo(elemContent)
        .addClass('service-items')
        .addClass('surface-level-3')
        .addClass('tiles')
        .addClass('list')
        .addClass('xs');

    return elemOperation;

}
function insertServiceItem(elemPartsList, link, title, partNumber, edgeId, quantity) {

    if(isBlank(edgeId)  ) edgeId   = '';
    if(isBlank(quantity)) quantity = 1.0;

    let elemItem  = $('<div></div>').appendTo(elemPartsList)
        .addClass('service-item')
        .addClass('tile')
        .attr('data-link', link)
        .attr('data-edgeid', edgeId)
        .attr('data-part-number', partNumber)
        .click(function() {
            let isSelected = $(this).hasClass('selected');
            $('.service-item').removeClass('selected');
            if(!isSelected) {
                $(this).addClass('selected');
                let link = $(this).attr('data-link');
                viewerSelectModel($(this).attr('data-part-number'));
                insertDetails(link, paramsDetails);
                $('.bom-item').each(function() {
                    if(link === $(this).attr('data-link')) {
                        bomDisplayItem($(this));
                        $(this).addClass('selected');
                    } else {
                        $(this).removeClass('selected');
                    }
                });
            }
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
        .html(title);
      
    $('<input>').appendTo(elemItem)
        .addClass('service-item-quantity')
        .val(quantity);

    $('<div></div>').appendTo(elemItem)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-delete')
        .click(function() {
            $(this).closest('.service-item').addClass('hidden');
        });

}




function selectOperations(elemButton, mode) {

    let elemParent = elemButton.closest('.service');
    let elemOperations = elemParent.find('.service-operation');

    elemOperations.each(function() {

        if(mode === 'all') $(this).addClass('selected');
        else $(this).removeClass('selected');

    });

}
function selectItems(elemButton, mode) {

    let elemParent = elemButton.closest('.service');
    let elemServiceItems = elemParent.find('.service-item');

    elemServiceItems.each(function() {

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

        insertServiceOperation(elemInput.closest('.service'), '', elemInput.val());

        
        elemInput.val('');
        elemInput.focus();
        
    }
    
}



// When double-clicking a part in the EBOM, add it to the selected Service Operation
function addSelectedPart(elemClicked) {

    $('.service-operation.selected').each(function() {

        let elemPartsList = $(this).next(); 

        insertServiceItem(elemPartsList, elemClicked.attr('data-link'), elemClicked.attr('data-title'), elemClicked.attr('data-part-number'), '', elemClicked.attr('data-quantity'))

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


// Save all changes when clicking the Save button
function saveChanges() {
    
    console.log('saveChanges START');

    $('#overlay').show();

    $('.pending-removal' ).removeClass('.pending-removal' );
    $('.pending-creation').removeClass('.pending-creation');
    $('.pending-addition').removeClass('.pending-addition');

    $('.service').each(function() {

        let link = $(this).attr('data-link');

        if($(this).hasClass('hidden')) {

            if(link === '') $(this).remove(); 
            else $(this).addClass('pending-removal');

        } else {
            if(link === '') {
                $(this).addClass('pending-creation');
                $(this).addClass('pending-addition');
            }
        }

    });

    $('.service-operation').each(function() {
        
        let link = $(this).attr('data-link');

        if($(this).hasClass('hidden')) {

            if(link === '') $(this).remove(); 
            else $(this).addClass('pending-removal');

        } else {
            if(link === '') {
                $(this).addClass('pending-creation');
                $(this).addClass('pending-addition');
            }
        }

    });

    $('.service-item').each(function() {

        let edgeId = $(this).attr('data-edgeid');

        if($(this).hasClass('hidden')) {
            $(this).addClass('pending-removal');
        } else if(edgeId === '') {
            $(this).addClass('pending-addition');
        }
    });

    removeServiceItems();

}
function removeServiceItems() {

    let requests  = [];

    $('.service-item.pending-removal').each(function() {

        let edgeId     = $(this).attr('data-edgeId');
        let elemParent = $(this).closest('.service-items').prev();
        let link       = elemParent.attr('data-link');

        if(!isBlank(edgeId)) {
            if(!isBlank(link)) {

                let params = {
                    edgeId : edgeId,
                    link   : link
                };

                requests.push($.get('/plm/bom-remove', params));

            }
        }

        $(this).remove();

    });

    Promise.all(requests).then(function() { removeServiceOperations(); });

}
function removeServiceOperations() {

    let requests  = [];

    $('.service-operation.pending-removal').each(function() {

        let edgeId     = $(this).attr('data-edgeId');
        let elemParent = $(this).closest('.service');
        let link       = elemParent.attr('data-link');

        if(!isBlank(edgeId)) {
            if(!isBlank(link)) {

                let params = {
                    edgeId : edgeId,
                    link   : link
                };

                requests.push($.get('/plm/bom-remove', params));
                requests.push($.get('/plm/archive'   , $(this).attr('data-link')));

            }
        }

        $(this).next().remove();
        $(this).remove();

    });

    Promise.all(requests).then(function() { removeServiceOfferings(); });

}
function removeServiceOfferings() {

    let requests  = [];

    $('.service.pending-removal').each(function() {

        let edgeId = $(this).attr('data-edgeId');

        if(!isBlank(edgeId)) {

            let params = {
                edgeId : edgeId,
                link   : links.sbom
            };

            console.log(params);

            requests.push($.get('/plm/bom-remove', params));
            requests.push($.get('/plm/archive'   , $(this).attr('data-link')));

        }

        $(this).remove();

    });

    Promise.all(requests).then(function() { createNewOfferings(); });

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

        $('.service.pending-addition').each(function() {

            let elemService = $(this);
            let curIndex    = elemService.attr('data-index');

            if(!isBlank(curIndex)) {

                let edgeId = responses[curIndex].data.split('/bom-items/')[1];
                elemService.attr('data-edgeid', edgeId);

            }

            elemService.removeAttr('data-index');

        });

        console.log(responses);
        createNewOperations();
        

    });

}
function createNewOperations() {

    let requests    = [];
    let index       = 0;

    $('.service-operation.pending-creation').each(function() {

        let link = $(this).attr('data-link');

        if(link === '') {

            let params = {
                wsId      : config.items.wsId,
                sections  : []
            };

            let title = $(this).find('.service-operation-name').first().val();

            addFieldToPayload(params.sections, wsConfig.sections, null, 'TITLE', title);
            addFieldToPayload(params.sections, wsConfig.sections, null, 'TYPE' , { link : wsConfig.linkTypeServiceOperation });

            console.log(params);

            $(this).attr('data-index', index++)
            requests.push($.post('/plm/create', params));

        }

    });

    Promise.all(requests).then(function(responses) {

        console.log(responses);

        $('.service-operation.pending-creation').each(function() {

            let elemOperation = $(this);

            console.log(elemOperation.length);

            let curIndex    = elemOperation.attr('data-index');

            console.log(curIndex);

            if(!isBlank(curIndex)) {

                let link = responses[curIndex].data.split('.autodeskplm360.net')[1];
                elemOperation.attr('data-link', link);

            }

            elemOperation.removeAttr('data-index').removeClass('pending-creation');

        });

        connectNewOperations();

    });

}
function connectNewOperations() {

    let requests    = [];
    let index       = 0;

    $('.service-operation.pending-addition').each(function() {

        // let link = $(this).attr('data-link');

        let elemService = $(this).closest('.service');

        let params = {                    
            linkParent   : elemService.attr('data-link'),
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
        connectNewServiceItems();

    });

}
function connectNewServiceItems() {

    let requests    = [];
    let index       = 0;

    console.log($('.service-item.pending-addition').length);

    $('.service-item.pending-addition').each(function() {

        // let link = $(this).attr('data-link');

        let elemParent = $(this).closest('.service-items').prev();

        console.log(elemParent.length);

        let params = {                    
            linkParent   : elemParent.attr('data-link'),
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
        saveChangesEnd();
    });

}
function saveChangesEnd() {

    

    $('#overlay').hide();
    
}