let links         = {}
let wsItems       = {};
let wsAssetItems  = { linkEndItem : null, linkSparePart : null, linkPurchased : null, linkSerial : null };
let projectItems  = [];
let ebomPartsList = [];
let abomPartsList = [];

let paramsSummary = {
    id               : 'summary',
    contents         : [],
    layout           : 'tabs',
    hideSubtitle     : true,
    hideCloseButton  : true,
    openInPLM        : true,
    bookmark         : true,
    saveTabSelection : true
}
let contentsAsset = [{ 
    type   : 'details', 
    params : {
        id             : 'details-details', 
        expandSections : ['Header'],
        hideHeader     : true,
        layout         : 'narrow'
    }
},{
    type   : 'attachments',
    params : { 
        id            : 'details-attachments', 
        contentSize   : 's',
        editable      : true , 
        singleToolbar : 'controls'
    }
}];
let contentsItem = [{ 
    type   : 'details', 
    params : {
        id             : 'details-details', 
        expandSections : ['Header'],
        hideHeader     : true,
        layout         : 'narrow'
    }
},{
    type   : 'attachments',
    params : { 
        id            : 'details-attachments', 
        contentSize   : 's',
        editable      : true , 
        singleToolbar : 'controls'
    }
},{
    type   : 'change-processes',
    params : { 
        id            : 'details-changes', 
        contentSize   : 's',
        openInPLM     : true
    }
},{
    type   : 'sourcing',
    params : { 
        id            : 'details-sourcing', 
        contentSize   : 's',
        editable      : true , 
        singleToolbar : 'controls'
    }
}];
let contentsAssetItem = [{ 
    type   : 'details', 
    params : {
        id             : 'details-details', 
        expandSections : ['Header'],
        hideHeader     : true,
        layout         : 'narrow'
    }
},{
    type   : 'grid',
    params : { 
        id            : 'details-grid', 
        contentSize   : 's',
        editable     : true,
        singleToolbar : 'controls'
    }
},{
    type   : 'attachments',
    params : { 
        id            : 'details-attachments', 
        contentSize   : 's',
        editable      : true , 
        singleToolbar : 'controls'
    }
}];


$(document).ready(function() {

    links.asset              = urlParameters.link;
    wsAssetItems.workspaceId = config.assetItems.workspaceId || common.workspaceIds.assetItems;

    $('#toggle-bom').html(config.bomLabel);

    appendOverlay(true);

    let requests = [

        $.get('/plm/details' , { link : links.asset }),
        $.get('/plm/project' , { link : links.asset }),
        
        $.get('/plm/sections'            , { wsId : wsAssetItems.workspaceId, useCache : false }),
        $.get('/plm/fields'              , { wsId : wsAssetItems.workspaceId, useCache : false }),
        $.get('/plm/bom-views-and-fields', { wsId : wsAssetItems.workspaceId, useCache : false })

    ];    

    getFeatureSettings('abom', requests, function(responses) {
        startEditor(responses);
        setUIEvents();
    });

});

function setUIEvents() {

    $('#header-toolbar').children('.button.with-icon').click(function() {

        if($(this).hasClass('disabled')) return;
        
        $(this).siblings().removeClass('main');
        $(this).addClass('main');
        
        $('.panel').addClass('hidden');

        let panelId = $(this).attr('data-panel-id');

        $('#' + panelId).removeClass('hidden');

        if(panelId === 'spl') {
            insertBOMPartsList(links.abom, {
                counters        : true,
                headerLabel     : 'Spare Parts List',
                id              : 'spl',
                reload          : true,
                layout          : 'table',
                openInPLM       : true,
                hideParents     : false,
                search          : true,
                selectItems     : { fieldId : 'SPARE_PART', values :['true'] },
                viewerSelection : true
            });
        }

        if(panelId === 'ppl') {
            insertBOMPartsList(links.abom, {
                counters        : true,
                headerLabel     : 'Purchased Parts',
                id              : 'ppl',
                openInPLM       : true,
                reload          : true,
                layout          : 'list',
                contentSize     : 's',
                hideParents     : false,
                search          : true,
                selectItems     : { fieldId : 'PURCHASED', values :['true'] }
            });
        }

        if(panelId === 'snl') {
            insertGrid(links.serials, {
                id          : 'snl',
                counters    : true,
                headerLabel : 'Serial Numbers',
                editable    : true,
                reload      : true,
                search      : true,
                fieldsEx : ['Purchased', 'Location', 'Notes'],
                // useCache    : false,
                // fieldIdPartNumber : 'ITEM_NUMBER',
                // onClickItem : function(elemClicked) { console.log('1'); onSerialNumberClick(elemClicked); } 
                onClickItem : function(elemClicked) { selectSerialNumberInList(elemClicked); }
                // filterBySelection : true,
                // multiSelect : true
            });
        }

    });

    $('#header-toolbar').children('.button').first().click();
    
    $('#toggle-summary').click(function() {
        $('body').toggleClass('no-summary');
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
        viewerResize();
    });

}


// Startup
function startEditor(responses) {

    $('#header-subtitle').html(responses[0].data.title);

    let fieldIdEBOM = urlParameters.fieldidebom || config.assetFieldIDs.ebom;
    
    links.ebom    = getSectionFieldValue(responses[0].data.sections, fieldIdEBOM, '', 'link');
    links.abom    = getSectionFieldValue(responses[0].data.sections, config.assetFieldIDs.abom, '', 'link');
    links.serials = getSectionFieldValue(responses[0].data.sections, config.assetFieldIDs.serialNumbers, '', 'link');
    
    insertViewer(links.ebom, {
        cacheInstances : true
    }); 

    for(let projectItem of responses[1].data.projectItems) {
        if(!isBlank(projectItem.item)) {
            let projectItemLink = projectItem.item.link;
            let projectItemWSID = projectItemLink.split('/')[4];
            let deliveriesWorkspaceId = config.orderProjectDeliveries.workspaceId || common.workspaceIds.orderProjectDeliveries;
            if(projectItemWSID == deliveriesWorkspaceId) {
                projectItems.push({
                    link  : projectItemLink,
                    title : projectItem.title,
                    date  : projectItem.endDate
                });
            }
        }
    }

    wsAssetItems.sections       = responses[2].data;
    wsAssetItems.fields         = responses[3].data;
    wsAssetItems.derived        = [];
    wsAssetItems.bomViewId      = responses[4].data[0].id;
    wsAssetItems.bomViewFields  = responses[4].data[0].fields;

    for(let field of wsAssetItems.fields) {                
        if(field.derived) wsAssetItems.derived.push(field);            
    }

    for(let bomViewField of wsAssetItems.bomViewFields) {
        switch(bomViewField.fieldId) {

            case 'ID'           : wsAssetItems.linkFieldId      = bomViewField.__self__.link; break;
            case 'ITEM_EDGE_ID' : wsAssetItems.linkFieldEdgeId  = bomViewField.__self__.link; break;
            case 'ITEM_ROOT'    : wsAssetItems.linkFieldRoot    = bomViewField.__self__.link; break;
            case 'END_ITEM'     : wsAssetItems.linkEndItem      = bomViewField.__self__.link; break;
            case 'SPARE_PART'   : wsAssetItems.linkSparePart    = bomViewField.__self__.link; break;
            case 'PURCHASED'    : wsAssetItems.linkPurchased    = bomViewField.__self__.link; break;
            case 'SERIAL'       : wsAssetItems.linkSerial       = bomViewField.__self__.link; break;

        }
    }    

    if(isBlank(links.ebom)) {

        showErrorMessage('No Engineering BOM', 'There is no Engineering BOM defined for this Asset, which is required by the editor.');

    } else {

        if(isBlank(links.abom)) {
            createRootAssetItem(function() {
                insertEditor();
            });
        } else {
            insertEditor();
        }

    }

}
function createRootAssetItem(callback) {

    let paramsDerived = {
        wsId    : wsAssetItems.workspaceId,
        fieldId : config.assetItems.fieldIDs.item,
        link    : links.ebom
    };

    let requests = [
        $.get('/plm/derived', paramsDerived),
        $.get('/plm/sections', { wsId : urlParameters.wsid, useCache : true })
    ];

    Promise.all(requests).then(function(responses) {

        let paramsCreate = {
            wsId     : wsAssetItems.workspaceId,
            sections : wsAssetItems.sections,
            derived  : responses[0].data,
            fields   : [
                { fieldId : config.assetItems.fieldIDs.asset, value : links.asset },
                { fieldId : config.assetItems.fieldIDs.item , value : links.ebom  }
            ]
        };

        let paramsEdit = { 
            link     : links.asset, 
            sections : responses[1].data,
            fields   : []
        }        

        $.post('/plm/create', paramsCreate, function(response) {
            
            links.abom = response.data.split('plm360.net')[1];
            paramsEdit.fields.push({ fieldId : config.assetFieldIDs.abom, value : { link : links.abom}});
            $.post('/plm/edit', paramsEdit);
            callback();

        });

    });

}
function insertEditor() {

    paramsSummary.contents = contentsAsset;
    insertItemSummary(links.asset, paramsSummary);

    let additionalRequests = [$.get('/plm/bom', { link : links.abom, viewId : wsAssetItems.bomViewId, getBOMPartsList : true })];

    for(let projectItem of projectItems) {
        additionalRequests.push($.get('/plm/manages', { link : projectItem.link }));
    }

    insertBOM(links.ebom, {
        headerLabel         : config.bomLabel,
        fieldsIn            : ['Quantity'],
        contentSize         : 's',
        collapseContents    : true,
        counters            : true,
        includeBOMPartList  : true,
        openInPLM           : true,
        path                : true,
        reload              : true,
        search              : true,
        toggles             : true,
        bomViewName         : config.items.bomViewName,
        additionalRequests  : additionalRequests,
        onClickItem         : function(elemClicked) { onBOMItemClick(elemClicked); }
    }); 

}
function onBOMItemClick(elemClicked) {

    let index    = elemClicked.index();
    let ebomPart = ebomPartsList[index];
    let linkABOM = elemClicked.attr('data-abom');

    if(elemClicked.hasClass('selected')) {
        if(isBlank(linkABOM)) {
            paramsSummary.contents = contentsItem;
            insertItemSummary(elemClicked.attr('data-link'), paramsSummary);
            
        } else {
            paramsSummary.contents = contentsAssetItem;
            insertItemSummary(linkABOM, paramsSummary);
        }
        viewerSelectModel(ebomPart.path, { ghosting : true, usePath : true });
    } else {
        paramsSummary.contents = contentsAsset;
        insertItemSummary(links.asset, paramsSummary);
        viewerResetSelection();
    }

}


// Add controls to EBOM toolbar
function insertBOMDone(id) {

    $('#' + id).attr('data-abom', links.abom);

    // $('<div><div>').prependTo($('#' + id + '-toolbar'))
    //     .addClass('button')    
    //     .addClass('with-icon')
    //     .addClass('icon-toggle-off')
    //     .html('Viewer Colors')
    //     .click(function(e) {
    //         $(this).toggleClass('filled').toggleClass('icon-toggle-off').toggleClass('icon-toggle-on');
    //         if($(this).hasClass('icon-toggle-off')) {
    //             viewerResetColors();
    //         } else {
    //             let partNumbersMissing = [];
    //             let partNumbersMatch = [];

    //             $('.bom-item').each(function() {
    //                 let partNumber = $(this).attr('data-part-number');
    //                 if($(this).hasClass('missing')) partNumbersMissing.push(partNumber);
    //                 else partNumbersMatch.push(partNumber);
    //             });

    //             console.log(partNumbersMatch);

    //             viewerSetColors(partNumbersMissing, { 
    //                 'color' : [221/255,  34/255, 34/255, 0.8] ,
    //                 'resetColors' : true
    //             });
    //             viewerSetColors(partNumbersMatch, { 
    //                 'color' : [106/255, 151/255, 40/255, 0.8],
    //                 'resetColors' : false
    //             });


    //         }
    //     });

    $('<div><div>').insertBefore($('#bom-action-expand-all'))
        .addClass('button')    
        .addClass('with-icon')
        .addClass('icon-toggle-off')
        .html('Deliveries Assignment')
        .click(function(e) {
            $(this).toggleClass('filled').toggleClass('icon-toggle-off').toggleClass('icon-toggle-on');
            $('body').toggleClass('with-processes');
            viewerResize(250);
        });

    $('<div><div>').prependTo($('#' + id + '-controls'))
        .attr('id', 'button-create-items')
        .addClass('button')    
        .addClass('bom-multi-select-action')
        .html('Create Items')
        .click(function(e) {
            saveChanges();
        });

    $('<div><div>').prependTo($('#' + id + '-controls'))
        .attr('id', 'button-save-changes')
        .addClass('button')    
        .addClass('default')    
        .html('Save Changes')
        .click(function(e) {
            saveChanges();
        });

}
function saveChanges() {

    let requests  = [];
    let reqRemove = [];

    for(let projectItem of projectItems) projectItem.items = [];
    
    $('#overlay').show();

    $('#bom-tbody').children().each(function() {
        
        let elemItem     = $(this);
        let elemChanged  = elemItem.find('td.changed');
        let linkSBOM     = elemItem.attr('data-abom');
        let linkAssigned = elemItem.attr('data-link-assigned');
        let linkUpdate   = elemItem.attr('data-link-update');
        
        if(!isBlank(linkSBOM)) {

            if(elemChanged.length > 0) {

                let params = { link : linkSBOM, sections : [] }

                addFieldToPayload(params.sections, wsAssetItems.sections, null, 'END_ITEM'  , elemItem.hasClass('is-end-item'));
                addFieldToPayload(params.sections, wsAssetItems.sections, null, 'SPARE_PART', elemItem.hasClass('is-spare-part'));
                addFieldToPayload(params.sections, wsAssetItems.sections, null, 'PURCHASED' , elemItem.hasClass('is-purchased'));
                addFieldToPayload(params.sections, wsAssetItems.sections, null, 'SERIAL'    , elemItem.hasClass('is-serial'));
            
                console.log(params);

                requests.push($.post('/plm/edit', params));

            }

       
            console.log(linkAssigned);
            console.log(linkUpdate);


            if(linkAssigned !== linkUpdate) {

                if(!isBlank(linkUpdate)) {

                    for(let projectItem of projectItems) {

                        if(projectItem.link === linkUpdate) {
                            projectItem.items.push(linkSBOM);
                        }

                    }

                    
                }

                if(!isBlank(linkAssigned)) {
                        reqRemove.push($.get('/plm/remove-managed-item', {
                            link : linkAssigned, 
                        itemId : linkSBOM.split('/')[6]
                    }));
                }

                elemItem.attr('data-link-assigned', linkUpdate);

            }
        }

    });

    for(let projectItem of projectItems) {

        if(projectItem.items.length > 0) {
            // console.log(projectItem.items);
            requests.push($.post('/plm/add-managed-items', { link : projectItem.link, items : projectItem.items }))
        }

    }

    Promise.all(reqRemove).then(function(responses) {
        console.log(responses);
        Promise.all(requests).then(function(responses) {
            console.log(responses);
            $('#overlay').hide();
            $('#bom').removeClass('changed');
            $('td').removeClass('changed');
        });
    });

}


// Add columns to EBOM display
function changeBOMViewDone(id, settings, bomData, selectedItems, dataFlatBOM, dataAdditional, partsList) {

    ebomPartsList = partsList;
    abomPartsList = dataAdditional[0].data.bomPartsList;

    let elemTHeadRow = $('#' + id + '-thead-row');

    $('<th></th>').appendTo(elemTHeadRow)
        .addClass('column-id')
        .html(config.assetItems.workspaceName);

    $('<th></th>').appendTo(elemTHeadRow)
        .addClass('column-end-item')
        .html('End Item');

    $('<th></th>').appendTo(elemTHeadRow)
        .addClass('column-spare-part')
        .html('Spare');

    $('<th></th>').appendTo(elemTHeadRow)
        .addClass('column-purchased')
        .html('Purchased');

    $('<th></th>').appendTo(elemTHeadRow)
        .addClass('column-serial')
        .html('Serial #');

    for(let projectItem of projectItems) {

        let title = projectItem.title.split(' - ');

        $('<th></th>').appendTo(elemTHeadRow)
            .addClass('column-process')
            .html(title[0] + '</br>' + projectItem.date);

    }

    let elemTBody = $('#' + id + '-tbody');

    elemTBody.children().each(function() {

        let elemBOMItem = $(this);
        let hasABOM     = false;
        let isEndItem   = false;
        let index       = $(this).index();
        let ebomPart    = ebomPartsList[index];

        let valueSparePart     = ebomPart.details[config.items.fields.sparePart.fieldId]   || '';
        let valueSerialNumber  = ebomPart.details[config.items.fields.serialNumber.fieldId]  || 'false';
        let valuePurchasedPart = ebomPart.details[config.items.fields.purchasedPart.fieldId] || '';

        let isSparePart = config.items.fields.sparePart.values.includes(valueSparePart.toLowerCase());
        let isSerial    = (valueSerialNumber == 'true');
        let isPurchased = config.items.fields.purchasedPart.values.includes(valuePurchasedPart.toLowerCase());

        let elemCellID = $('<td></td>').appendTo(elemBOMItem)
            .addClass('column-id')
            .click(function(e) {
                e.stopPropagation();
                e.preventDefault();
                openAssetItem($(this));
            });

        for(let abomPart of abomPartsList) {
            if(abomPart.details[config.assetItems.fieldIDs.root] === ebomPart.root) {
                if(abomPart.details[config.assetItems.fieldIDs.path] === ebomPart.path) {
                    
                    hasABOM = true;
                    elemBOMItem.attr('data-abom', abomPart.link);
                    elemBOMItem.addClass('match');

                    isSparePart = (abomPart.details[config.assetItems.fieldIDs.sparePart] == 'true');
                    isSerial    = (abomPart.details[config.assetItems.fieldIDs.serial]    == 'true');
                    isPurchased = (abomPart.details[config.assetItems.fieldIDs.purchased] == 'true');

                    elemCellID.html(abomPart.details[config.assetItems.fieldIDs.id]);

                }
            }
        }

        if(!hasABOM) {

            elemBOMItem.addClass('missing');
            $('<div></div>').appendTo(elemCellID)
                .addClass('button')
                .addClass('create-asset-item')
                .html('Create Item')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    clickCreateAssetItem($(this));
                });

        }

        let elemCellEndItem = $('<td></td>').appendTo(elemBOMItem)
            .addClass('column-end-item')
            .addClass('column-toggles');
            
        $('<div></div>').appendTo(elemCellEndItem)
            .addClass('icon')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).closest('.bom-item').toggleClass('is-end-item');
                $(this).parent().addClass('changed');
                $('#' + id).addClass('changed');
            });


        let elemCellSparePart = $('<td></td>').appendTo(elemBOMItem)
            .addClass('column-spare-part')
            .addClass('column-toggles');
            
        $('<div></div>').appendTo(elemCellSparePart)
            .addClass('icon')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).closest('.bom-item').toggleClass('is-spare-part');
                $(this).parent().addClass('changed');
                $('#' + id).addClass('changed');
            });

        let elemCellPurchased = $('<td></td>').appendTo(elemBOMItem)
            .addClass('column-purchased')
            .addClass('column-toggles');
            
        $('<div></div>').appendTo(elemCellPurchased)
            .addClass('icon')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).closest('.bom-item').toggleClass('is-purchased');
                $(this).parent().addClass('changed');
                $('#' + id).addClass('changed');
            });

        let elemCellSerial = $('<td></td>').appendTo(elemBOMItem)
            .addClass('column-serial')
            .addClass('column-toggles');
            
        $('<div></div>').appendTo(elemCellSerial)
            .addClass('icon')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).closest('.bom-item').toggleClass('is-serial');
                $(this).parent().addClass('changed');
                $('#' + id).addClass('changed');
            });

        if(isEndItem  ) elemBOMItem.addClass('is-end-item');
        if(isSparePart) elemBOMItem.addClass('is-spare-part');
        if(isPurchased) elemBOMItem.addClass('is-purchased');
        if(isSerial   ) elemBOMItem.addClass('is-serial');

        elemBOMItem.attr('data-link-assigned', '');
        elemBOMItem.attr('data-link-update', '');

        for(let projectItem of projectItems) {


            let elemCellProcess = $('<td></td>').appendTo(elemBOMItem)
                .addClass('column-process')
                .addClass('column-toggles');
            
            $('<div></div>').appendTo(elemCellProcess)
                .addClass('icon')
                .click(function(e) {

                    e.preventDefault();
                    e.stopPropagation();

                    let elemCell = $(this).parent();
                        elemCell.toggleClass('is-managed');
                        elemCell.siblings().removeClass('is-managed');
                        elemCell.parent().addClass('changed-process');

                    let linkProjectItem = elemCell.hasClass('is-managed') ? projectItem.link : '';

                    let elemRow  = $(this).closest('.bom-item');
                        elemRow.attr('data-link-update', linkProjectItem);

                    $('#' + id).addClass('changed');

                });



                for(let additional of dataAdditional) {

                    // console.log(projectItem);
                    // console.log(additional);
    
                        if(additional.params.link === projectItem.link) {
    
                            for(let managedItem of additional.data) {
    
                                if(managedItem.item.link === elemBOMItem.attr('data-abom')) {
                                    elemBOMItem.attr('data-link-assigned', projectItem.link);
                                    elemBOMItem.attr('data-link-update', projectItem.link);
                                    elemCellProcess.addClass('is-managed');
                                }
    
                            }
    
                            // console.log(additional.data);
    
                        }
                }


            // let title = projectItem.title.split(' - ');
    
            // $('<th></th>').appendTo(elemTHeadRow)
            //     .addClass('column-process')
            //     .html(title[0] + '</br>' + projectItem.date);
    
        }

    });

}


// Serial Numbers Management : Add further Controls
// function insertGridDone(id) {
   
    // $('<div><div>').prependTo($('#' + id + '-controls'))
    //     .addClass('button')    
    //     .addClass('with-icon')
    //     .addClass('icon-reset')
    //     .html('Sync with Asset BOM')
    //     .click(function(e) {
    //         e.preventDefault();
    //         e.stopPropagation();
    //         syncSerialNumberWithAssetBOM();
    //         // syncSerialNumbersWithAssetBOM();
    //     });

// }
function selectSerialNumber(elemClicked) {

    let elemCellDBID = elemClicked.find('.column-INSTANCE_ID');
    
    if(elemCellDBID.length === 0) return;
    
    let elemCellNUMBER = elemClicked.find('.column-ITEM_NUMBER');

    if(elemCellNUMBER.length === 0) return;

    let dbId   =   elemCellDBID.children('input').val();
    let number = elemCellNUMBER.children('input').val();

    viewerHighlightInstances(number, [dbId], { ghosting : false })

}
function selectSerialNumberInList(elemClicked) {

    let elemCellPartNumber = elemClicked.find('.field-id-NUMBER');
    let elemCellLocation   = elemClicked.find('.field-id-INSTANCE_PATH');

    let partNumber   = elemCellPartNumber.children().first().val();
    let instancePath = elemCellLocation.children().first().val();

    viewerHighlightInstances(partNumber, [], [instancePath], {});

}


// Create new asset item when user clicks given button
function clickCreateAssetItem(elemClicked) {

    let elemBOMItem    = elemClicked.closest('.content-item');
    let itemPath       = getBOMItemPath(elemBOMItem);
    let requestsDerive = [];
    let requestsCreate = [];
    let requestsUpdate = [];

    $('#overlay').show();

    for(let item of itemPath.items) {

        let linkABOM = item.attr('data-abom');

        if(isBlank(linkABOM)) {

            let params = {
                wsId    : wsAssetItems.workspaceId,
                fieldId : config.assetItems.fieldIDs.item,
                link    : item.attr('data-link'),
                index   : item.index()
            };

            requestsDerive.push($.get('/plm/derived', params));

        }

    }

    // Get derived fields data for new Asset Item creation
    Promise.all(requestsDerive).then(function(responses) {

        for(let item of itemPath.items) {

            let linkItem = item.attr('data-link');
            let linkABOM = item.attr('data-abom');
            let edgeId   = item.attr('data-edgeid');
            let bomPath  = '';

            for(let bomPart of ebomPartsList) {
                if(edgeId == bomPart.edgeId) { bomPath = bomPart.path; break; }
            }

            if(isBlank(linkABOM)) {

                let paramsCreate = {
                    wsId     : wsAssetItems.workspaceId,
                    sections : wsAssetItems.sections,
                    derived  : [],
                    fields   : [
                        { fieldId : config.assetItems.fieldIDs.asset    , value : links.asset },
                        { fieldId : config.assetItems.fieldIDs.item     , value : linkItem    },
                        { fieldId : config.assetItems.fieldIDs.number   , value : item.attr('data-part-number')  },
                        { fieldId : config.assetItems.fieldIDs.root     , value : item.attr('data-root-link'), type : 'string'  },
                        { fieldId : config.assetItems.fieldIDs.path     , value : bomPath                        },
                        { fieldId : config.assetItems.fieldIDs.endItem  , value : item.hasClass('is-end-item'  ) },
                        { fieldId : config.assetItems.fieldIDs.sparePart, value : item.hasClass('is-spare-part') },
                        { fieldId : config.assetItems.fieldIDs.purchased, value : item.hasClass('is-purchased' ) },
                        { fieldId : config.assetItems.fieldIDs.serial   , value : item.hasClass('is-serial'    ) },
                    ]
                };

                for(let response of responses) {
                    if(response.params.link === linkItem) {
                        paramsCreate.derived = response.data;
                        paramsCreate.index   = response.params.index;
                        break;
                    }
                }

                requestsCreate.push($.post('/plm/create', paramsCreate));

            }

        }

        // Create Asset Items for all levels required
        Promise.all(requestsCreate).then(function(responses) {

            for(let response of responses) {
                
                let linkAssetItem   = response.data.split('plm360.net')[1];
                let linkAssetParent = links.abom;
                let elemBOMItem     = $('.content-item:eq(' + response.params.index + ')');
                let elemBOMParent   = getBOMItemParent(elemBOMItem);

                if(elemBOMParent !== null) linkAssetParent = elemBOMParent.attr('data-abom');

                elemBOMItem.attr('data-abom', linkAssetItem)
                    .removeClass('missing')
                    .addClass('match');

                requestsUpdate.push($.get('/plm/details', { link : linkAssetItem, index : response.params.index }));
                requestsUpdate.push($.post('/plm/bom-add', { linkParent : linkAssetParent, linkChild : linkAssetItem, number : elemBOMItem.attr('data-number'), quantity : elemBOMItem.attr('data-total-quantity') }));

            }

            Promise.all(requestsUpdate).then(function(responses) {

                for(let response of responses) {
                    if(response.url.indexOf('/details') === 0) {
                        let elemBOMItem = $('.content-item:eq(' + response.params.index + ')');
                        let elemCellID  = elemBOMItem.find('.column-id');
                        elemCellID.html(getSectionFieldValue(response.data.sections, config.assetItems.fieldIDs.id, ''));
                    }
                }

                $('#overlay').hide();

            });
            
        });

    });

}


// Open selected Asset Item when clicking the given descriptor
function openAssetItem(elemClicked) {

    let elemItem  = elemClicked.closest('.content-item');
    let linkABOM  = elemItem.attr('data-abom');
    let inSummary = $('#toggle-summary').hasClass('toggle-on');

    if(isBlank(linkABOM)) return;

    if(inSummary) {
        $('.content-item').removeClass('selected');
        elemItem.addClass('selected');
        let index    = elemItem.index();
        let ebomPart = ebomPartsList[index];
        viewerSelectModel(ebomPart.path, { ghosting : true, usePath : true});
        insertItemSummary(linkABOM, paramsSummary);
    } else openItemByLink(linkABOM);

}