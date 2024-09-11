let links           = {}
let wsItems         = { linkEndItem : null, linkSparePart : null, linkPurchased : null };
let wsAssetItems    = { linkEndItem : null, linkSparePart : null, linkPurchased : null, linkSerial : null };
let projectItems    = [];

$(document).ready(function() {

    links.asset = '/api/v3/workspaces/' + wsId + '/items/' + dmsId;
 
    appendOverlay(true);
    getInitialData();
    setUIEvents();

});


function setUIEvents() {

    // $('#button-new').click(function() {
    //     showCreateForm(95, {
    //         headerLabel     : 'Create new configuration',
    //         sectionsEx      : ['Product Marketing','Product Catalog Images'],
    //         compactDisplay  : false
    //     });
    // });

    // $('#toggle-bom').click(function() {
    //     $('body').toggleClass('no-bom');
    //     $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
    //     viewerResize(250);
    // });

    // $('#toggle-details').click(function() {
    //     $('body').toggleClass('no-details');
    //     $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
    //     viewerResize(250);
    // });

    // $('#home').click(function() {
    //     $('body').removeClass('editor-mode');
    // });


    // $('#button-save-features').click(function() {
    //     saveConfigurationFeatures();
    // });

}



function getInitialData() {

    let requests = [
        $.get('/plm/details', { link : links.asset }),
        $.get('/plm/fields', { wsId : wsId }),
        $.get('/plm/project', { link : links.asset })
    ];

    Promise.all(requests).then(function(responses) {

        $('#header-subtitle').html(responses[0].data.title);

        console.log(responses[2]);

        links.ebom = getSectionFieldValue(responses[0].data.sections, config.sbom.fieldIdAssetEBOM, '', 'link');
        links.mbom = getSectionFieldValue(responses[0].data.sections, config.sbom.fieldIdAssetEBOM, '', 'link');
        links.sbom = getSectionFieldValue(responses[0].data.sections, config.sbom.fieldIdAssetSBOM, '', 'link');

        for(let field of responses[1].data) {
            let fieldId = field.__self__.split('/')[8];
            if(fieldId === config.sbom.fieldIdAssetSBOM) {
                wsAssetItems.id = field.picklistFieldDefinition.split('/')[4];
                break;
            }
        }

        console.log(projectItems);

        insertViewer(links.ebom); 

        requests = [ 
            $.get('/plm/sections'            , { wsId : wsAssetItems.id}),
            $.get('/plm/fields'              , { wsId : wsAssetItems.id}),
            $.get('/plm/bom-views-and-fields', { wsId : wsAssetItems.id})
        ]

        if(isBlank(links.sbom)) {
            requests.push($.get('/plm/derived', {
                link        : links.mbom,
                wsId        : wsAssetItems.id,
                fieldId     : config.sbom.fieldIdAssetItemItem,
                pivotItemId : links.mbom.split('/')[6],
            }));
            requests.push($.get('/plm/sections', { wsId : wsId}));
        }

        for(let projectItem of responses[2].data.projectItems) {
            let projectItemLink = projectItem.item.link;
            let projectItemWSID = projectItemLink.split('/')[4];
            if(projectItemWSID === config.sbom.wsIdAssetProjectItems) {
                projectItems.push({
                    link  : projectItemLink,
                    title : projectItem.title,
                    date  : projectItem.endDate
                });
            }
        }

        Promise.all(requests).then(function(responses) {
            
            wsAssetItems.sections       = responses[0].data;
            wsAssetItems.fields         = responses[1].data;
            wsAssetItems.derived        = [];
            wsAssetItems.bomViewId      = responses[2].data[0].id;
            wsAssetItems.bomViewFields  = responses[2].data[0].fields;
            
            for(let field of wsAssetItems.fields) {                
                if(field.derived) wsAssetItems.derived.push(field);            
            }

            for(let bomViewField of wsAssetItems.bomViewFields) {
                switch(bomViewField.fieldId) {

                    case 'ID'               : wsAssetItems.linkFieldId      = bomViewField.__self__.link; break;
                    case 'ITEM_EDGE_ID'     : wsAssetItems.linkFieldEdgeId  = bomViewField.__self__.link; break;
                    case 'ITEM_ROOT'        : wsAssetItems.linkFieldRoot    = bomViewField.__self__.link; break;
                    case 'END_ITEM'         : wsAssetItems.linkEndItem      = bomViewField.__self__.link; break;
                    case 'SPARE_WEAR_PART'  : wsAssetItems.linkSparePart    = bomViewField.__self__.link; break;
                    case 'PURCHASED'        : wsAssetItems.linkPurchased    = bomViewField.__self__.link; break;
                    case 'SERIAL'           : wsAssetItems.linkSerial       = bomViewField.__self__.link; break;

                }
            }

            if(isBlank(links.sbom)) {
                createRootAssetItem(links.mbom, responses[3].data, function() {
                    insertEditor();
                    linkRootAssetItem(responses[4].data);
                });
            } else {
                insertEditor();
            }

        });

    });

}
function createRootAssetItem(linkItem, dataDerived, callback) {

    let params = {
        'wsId'      : wsAssetItems.id,
        'sections'  : []
    };

    addFieldToPayload(params.sections, wsAssetItems.sections, null, config.sbom.fieldIdAssetItemAsset, { 'link' : links.asset });
    addFieldToPayload(params.sections, wsAssetItems.sections, null, config.sbom.fieldIdAssetItemItem,  { 'link' : linkItem    });
    
    addDerivedFieldsToPayload(params.sections, wsAssetItems.sections, dataDerived);

    $.post('/plm/create', params, function(response) {
        links.sbom = response.data.split('360.net')[1];
        callback();
    });

}
function linkRootAssetItem(wsAssetsSections) {

    $.get('/plm/derived', {

        link        : links.sbom,
        wsId        : wsId,
        fieldId     : config.sbom.fieldIdAssetSBOM,
        pivotItemId : links.sbom.split('/')[6],

    }, function(response) {

        let params = {
            link     : links.asset,
            sections : [] 
        }

        addFieldToPayload(params.sections, wsAssetsSections, null, config.sbom.fieldIdAssetSBOM, { 'link' : links.sbom });
        addDerivedFieldsToPayload(params.sections, wsAssetsSections, response.data);

        $.get('/plm/edit', params, function(response) {
            // console.log(response);
        });

    });

}
function insertEditor() {

    let additionalRequests = [$.get('/plm/bom', { link : links.sbom, viewId : wsAssetItems.bomViewId })];

    for(let projectItem of projectItems) {
        additionalRequests.push($.get('/plm/manages', { link : projectItem.link }));
    }


    insertBOM(links.mbom, {
        headers             : true,
        compactDisplay      : true,
        hideDetails         : true,
        quantity            : true,
        multiSelect         : false,
        bomViewName         : config.sbom.bomViewNameItems,
        additionalRequests  : additionalRequests
    }); 

}


function insertBOMDone(id) {

    $('#' + id).attr('data-link-sbom', links.sbom);

    // $('<div><div>').prependTo($('#' + id + '-toolbar'))
    //     .addClass('button')    
    //     .addClass('with-icon')
    //     .addClass('icon-toggle-off')
    //     .html('Serial Numbers')
    //     .click(function(e) {
    //         $(this).toggleClass('filled').toggleClass('icon-toggle-off').toggleClass('icon-toggle-on');
    //         $('body').toggleClass('with-grid');
    //         viewerResize(250);
    //     });

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

    $('<div><div>').prependTo($('#' + id + '-toolbar'))
        .addClass('button')    
        .addClass('with-icon')
        .addClass('icon-toggle-off')
        .html('Deliveries')
        .click(function(e) {
            $(this).toggleClass('filled').toggleClass('icon-toggle-off').toggleClass('icon-toggle-on');
            $('body').toggleClass('with-processes');
            viewerResize(250);
        });

    $('<div><div>').prependTo($('#' + id + '-toolbar'))
        .attr('id', 'button-create-items')
        .addClass('button')    
        .addClass('bom-multi-select-action')
        .html('Create Items')
        .click(function(e) {
            saveChanges();
            // $(this).toggleClass('filled').toggleClass('icon-toggle-off').toggleClass('icon-toggle-on');
        });

    $('<div><div>').prependTo($('#' + id + '-toolbar'))
        .attr('id', 'button-save-changes')
        .addClass('button')    
        .addClass('default')    
        .html('Save Changes')
        .click(function(e) {
            saveChanges();
            // $(this).toggleClass('filled').toggleClass('icon-toggle-off').toggleClass('icon-toggle-on');
        });

}


function changeBOMViewDone(id, fields, bomData, selectedItems, dataFlatBOM, dataAdditional) {

    console.log(dataAdditional);

    for(let field of fields) {
        switch(field.fieldId) {
            case 'END_ITEM'         : wsItems.linkEndItem   = field.__self__.link; break;
            case 'SPARE_WEAR_PART'  : wsItems.linkSparePart = field.__self__.link; break;
            case 'PDM_CATEGORY'     : wsItems.linkPurchased = field.__self__.link; break;
        }
    }


    $('#overlay').hide();

    let sbom = dataAdditional[0].data;
    let elemTHeadRow = $('#' + id + '-thead-row');


// console.log(sbom);

    $('<th></th>').appendTo(elemTHeadRow)
        .addClass('column-id')
        .html('ID');

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
        let edgeId      = elemBOMItem.attr('data-edgeid');
        let linkItem    = elemBOMItem.attr('data-link');
        let hasSBOM     = false;
        let isEndItem   = false;
        let isSparePart = false;
        let isPurchased = false;
        let isSerial    = false;

        let elemCellID = $('<td></td>').appendTo(elemBOMItem)
            .addClass('column-id')
            .click(function(e) {
                e.stopPropagation();
                e.preventDefault();
                openAssetItem($(this));
            });

        for(let node of sbom.nodes) {
            for(let field of node.fields) {
                // console.log(field);
                if(field.metaData.link === wsAssetItems.linkFieldEdgeId) {
                    if(field.value === edgeId) {
                        hasSBOM = true;
                        elemBOMItem.attr('data-link-sbom', node.item.link);
                        elemBOMItem.addClass('match');

                        for(let nodeField of node.fields) {
                            switch(nodeField.metaData.link) {

                                case wsAssetItems.linkFieldId   : elemCellID.html(nodeField.value); break;
                                case wsAssetItems.linkEndItem   : isEndItem     = nodeField.value === 'true'; break;
                                case wsAssetItems.linkSparePart : isSparePart   = nodeField.value === 'true'; break;
                                case wsAssetItems.linkPurchased : isPurchased   = nodeField.value === 'true'; break;
                                case wsAssetItems.linkSerial    : isSerial      = nodeField.value === 'true'; break;

                            }

                        }


                    }
                }
            }

        }

        if(!hasSBOM) {

            for(let node of bomData.nodes) {
                if(node.item.link === linkItem) {
                    for(let field of node.fields) {
                        switch(field.metaData.link) {

                            case wsItems.linkSparePart:
                                console.log(field.value);
                                if(config.service.fieldValues.indexOf(field.value.toLowerCase()) >= 0) isSparePart = true;
                                break;

                            case wsItems.linkPurchased:
                                console.log(field.value);
                                if(field.value.toLowerCase() === 'purchased part') isPurchased = true;
                                break;

                        }

                    }
                }
            }


            elemBOMItem.addClass('missing');
            let elemCreateItem = $('<div></div>').appendTo(elemCellID)
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
    
                                if(managedItem.item.link === elemBOMItem.attr('data-link-sbom')) {
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


// Selection of item in BOM
function clickBOMItemDone(elemClicked, e) {

    if(elemClicked.hasClass('selected')) { 
        viewerSelectModel(elemClicked.attr('data-part-number'));
        let linkSBOM = elemClicked.attr('data-link-sbom');
        if(!isBlank(linkSBOM)) insertGrid(linkSBOM);
    } else viewerResetSelection();

}


function clickCreateAssetItem(elemClicked) {

    let elemBOMItem     = elemClicked.closest('.bom-item');
    let itemPath        = getBOMItemPath(elemBOMItem);
    let requestsDerived = [];
    let requestsCreate  = [];
    let requestsUpdate  = [];

    $('#overlay').show();

    for(let item of itemPath.items) {

        let linkItem = item.attr('data-link');
        let linkSBOM = item.attr('data-link-sbom');

        if(isBlank(linkSBOM)) {

            let params = {
                link        : linkItem,
                wsId        : wsAssetItems.id,
                fieldId     : config.sbom.fieldIdAssetItemItem,
                pivotItemId : linkItem.split('/')[6],
                index       : item.index()
            };

            requestsDerived.push($.get('/plm/derived', params));

        }

    }

    Promise.all(requestsDerived).then(function(responses) {

        console.log(responses);

        for(let item of itemPath.items) {

            let linkItem            = item.attr('data-link');
            let linkSBOM            = item.attr('data-link-sbom');
            let dataDerivedFields   = [];

            if(isBlank(linkSBOM)) {

                for(let response of responses) {

                    if(response.params.link === linkItem) {
                        dataDerivedFields = response.data;
                        break;
                    }

                }

                let params = {
                    'wsId'      : wsAssetItems.id,
                    'sections'  : [],
                    'index'     : item.index()
                };

                addFieldToPayload(params.sections, wsAssetItems.sections, null, config.sbom.fieldIdAssetItemAsset, { 'link' : links.asset } );
                addFieldToPayload(params.sections, wsAssetItems.sections, null, config.sbom.fieldIdAssetItemItem, { 'link' : item.attr('data-link') } );
                addFieldToPayload(params.sections, wsAssetItems.sections, null, 'ITEM_EDGE_ID', item.attr('data-edgeid') );
                addFieldToPayload(params.sections, wsAssetItems.sections, null, 'END_ITEM', item.hasClass('is-end-item') );
                addFieldToPayload(params.sections, wsAssetItems.sections, null, 'SPARE_WEAR_PART', item.hasClass('is-spare-part') );
                addFieldToPayload(params.sections, wsAssetItems.sections, null, 'PURCHASED', item.hasClass('is-purchased') );
                addFieldToPayload(params.sections, wsAssetItems.sections, null, 'SERIAL', item.hasClass('is-serial') );

                addDerivedFieldsToPayload(params.sections, wsAssetItems.sections, dataDerivedFields);

                requestsCreate.push($.post('/plm/create', params));

            }

        }

        Promise.all(requestsCreate).then(function(responses) {

            for(let response of responses) {
                
                let linkAssetItem   = response.data.split('360.net')[1];
                let linkAssetParent = links.sbom;
                let elemBOMItem     = $('.bom-item:eq(' + response.params.index + ')');
                let elemBOMParent   = getBOMItemParent(elemBOMItem);

                if(elemBOMParent !== null) linkAssetParent = elemBOMParent.attr('data-link-sbom');

                elemBOMItem.attr('data-link-sbom', linkAssetItem)
                    .removeClass('missing')
                    .addClass('match');

                requestsUpdate.push($.get('/plm/details', { link : linkAssetItem, index : response.params.index }));
                requestsUpdate.push($.get('/plm/bom-add', { linkParent : linkAssetParent, linkChild : linkAssetItem, number : elemBOMItem.attr('data-number') }));

            }


            Promise.all(requestsUpdate).then(function(responses) {

                for(let response of responses) {
                    if(response.url.indexOf('/details') === 0) {
                        let elemBOMItem     = $('.bom-item:eq(' + response.params.index + ')');
                        let elemCellID      = elemBOMItem.find('.column-id');
                        console.log(response);
                        // elemCellID.html(response.data.title + ' ' + response.data.version);
                        elemCellID.html(getSectionFieldValue(response.data.sections, 'ID', ''));
                    }
                }

                $('#overlay').hide();

            });
        });
    });

}


// Save changes to the checkboxes for existing Asset Items
function saveChanges() {

    let requests  = [];
    let reqRemove = [];

    for(let projectItem of projectItems) projectItem.items = [];
    
    $('#overlay').show();

    $('.bom-item').each(function() {
        
        let elemItem     = $(this);
        let elemChanged  = elemItem.find('td.changed');
        let linkSBOM     = elemItem.attr('data-link-sbom');
        let linkAssigned = elemItem.attr('data-link-assigned');
        let linkUpdate   = elemItem.attr('data-link-update');
        
        if(!isBlank(linkSBOM)) {

            if(elemChanged.length > 0) {

                let params = { 'link' : linkSBOM, 'sections'   : [] }

                addFieldToPayload(params.sections, wsAssetItems.sections, null, 'END_ITEM', elemItem.hasClass('is-end-item'));
                addFieldToPayload(params.sections, wsAssetItems.sections, null, 'SPARE_WEAR_PART', elemItem.hasClass('is-spare-part'));
                addFieldToPayload(params.sections, wsAssetItems.sections, null, 'PURCHASED', elemItem.hasClass('is-purchased'));
                addFieldToPayload(params.sections, wsAssetItems.sections, null, 'SERIL', elemItem.hasClass('is-serial'));
            
                requests.push($.get('/plm/edit', params));

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
            requests.push($.get('/plm/add-managed-items', { link : projectItem.link, items : projectItem.items }))
        }

    }

    // console.log(projectItems);

    console.log(reqRemove.length);
    console.log(requests.length);

    // requests = [];


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


// Open selected Asset Item when clicking the given descriptor
function openAssetItem(elemClicked) {

    let elemItem = elemClicked.closest('.bom-item');
    let linkSBOM = elemItem.attr('data-link-sbom');

    if(!isBlank(linkSBOM)) openItemByLink(linkSBOM);

}