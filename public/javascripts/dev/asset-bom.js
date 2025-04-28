let links           = {}
let urlParameters      = getURLParameters();
let wsItems         = { linkEndItem : null, linkSparePart : null, linkPurchased : null };
let wsAssetItems    = { linkEndItem : null, linkSparePart : null, linkPurchased : null, linkSerial : null };
let projectItems    = [];

$(document).ready(function() {

    links.asset = urlParameters.link;

    appendOverlay(true);

    getFeatureSettings('sbom', [], function() {

        getInitialData();
        setUIEvents();

    });

});


function setUIEvents() {


    $('#header-toolbar').children('.button').click(function() {

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
                hideParents     : false,
                search          : true,
                selectItems     : { fieldId : 'PURCHASED', values :['true'] },
                viewerSelection : true
            });
        }

        if(panelId === 'snl') {
            insertGrid(links.serials, {
                id          : 'snl',
                counters    : true,
                headerLabel : 'Serial Numbers',
                // editable    : true,
                editable    : false,
                reload      : true,
                search      : true,
                // columnsEx : ['Purchased', 'Location', 'Installation Date', 'Notes'],
                columnsEx : ['Purchased', 'Location', 'Notes'],
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

}



function getInitialData() {

    let requests = [
        $.get('/plm/details', { link : links.asset }),
        $.get('/plm/fields' , { wsId : wsId, useCache : true }),
        $.get('/plm/project', { link : links.asset })
    ];

    Promise.all(requests).then(function(responses) {

        console.log(responses);

        $('#header-subtitle').html(responses[0].data.title);

        let fieldIdEBOM = urlParameters.fieldidebom || config.sbom.fieldIdAssetEBOM;
        let fieldIdMBOM = urlParameters.fieldidmbom || config.sbom.fieldIdAssetMBOM;

        links.ebom    = getSectionFieldValue(responses[0].data.sections, fieldIdEBOM, '', 'link');
        links.mbom    = getSectionFieldValue(responses[0].data.sections, fieldIdMBOM, '', 'link');
        links.abom    = getSectionFieldValue(responses[0].data.sections, config.sbom.fieldIdAssetABOM, '', 'link');
        links.serials = getSectionFieldValue(responses[0].data.sections, config.sbom.fieldIdAssetSERIALS, '', 'link');

        console.log(links);

        for(let field of responses[1].data) {
            let fieldId = field.__self__.split('/')[8];
            if(fieldId === config.sbom.fieldIdAssetABOM) {
                wsAssetItems.id = field.picklistFieldDefinition.split('/')[4];
                break;
            }
        }

        insertViewer(links.ebom); 

        // if(!isBlank(links.serials)) $('#toggle-snl').removeClass('disabled');

        // insertGrid(links.serials, {
        //     id          : 'snl',
        //     counters    : true,
        //     headerLabel : 'Serial Numbers',
        //     // editable    : true,
        //     editable    : true,
        //     reload      : true,
        //     search      : true,
        //     // columnsEx : ['Purchased', 'Location', 'Installation Date', 'Notes'],
        //     columnsEx : ['Purchased', 'Location', 'Notes'],
        //     // useCache    : false,
        //     // fieldIdPartNumber : 'ITEM_NUMBER',
        //     onClickItem : function(elemClicked) { console.log('1'); onSerialNumberClick(elemClicked); } 
        //     // filterBySelection : true,
        //     // multiSelect : true
        // });

        requests = [ 
            $.get('/plm/sections'            , { wsId : wsAssetItems.id, useCache : false }),
            $.get('/plm/fields'              , { wsId : wsAssetItems.id, useCache : false }),
            $.get('/plm/bom-views-and-fields', { wsId : wsAssetItems.id, useCache : false })
        ]

        if(isBlank(links.abom)) {
            requests.push($.get('/plm/derived', {
                link        : links.mbom,
                wsId        : wsAssetItems.id,
                fieldId     : config.sbom.fieldIdAssetItemItem,
                pivotItemId : links.mbom.split('/')[6],
            }));
            requests.push($.get('/plm/sections', { wsId : wsId }));
        }

        for(let projectItem of responses[2].data.projectItems) {
            console.log(projectItem);
            if(!isBlank(projectItem.item)) {
                let projectItemLink = projectItem.item.link;
                let projectItemWSID = projectItemLink.split('/')[4];
                if(projectItemWSID === config.sbom.wsIdAssetDeliveries) {
                    projectItems.push({
                        link  : projectItemLink,
                        title : projectItem.title,
                        date  : projectItem.endDate
                    });
                }
            }
        }

        console.log(projectItems);

        Promise.all(requests).then(function(responses) {

            console.log(responses);
            
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

                    case 'ID'           : wsAssetItems.linkFieldId      = bomViewField.__self__.link; break;
                    case 'ITEM_EDGE_ID' : wsAssetItems.linkFieldEdgeId  = bomViewField.__self__.link; break;
                    case 'ITEM_ROOT'    : wsAssetItems.linkFieldRoot    = bomViewField.__self__.link; break;
                    case 'END_ITEM'     : wsAssetItems.linkEndItem      = bomViewField.__self__.link; break;
                    case 'SPARE_PART'   : wsAssetItems.linkSparePart    = bomViewField.__self__.link; break;
                    case 'PURCHASED'    : wsAssetItems.linkPurchased    = bomViewField.__self__.link; break;
                    case 'SERIAL'       : wsAssetItems.linkSerial       = bomViewField.__self__.link; break;

                }
            }

            links.tableau = setTableau(wsAssetItems.id, 'Asset Serial Numbers', ['descriptor', 'ASSET', 'grid.ID', 'grid.SERIAL', 'last_modified_on'], [
                { fieldId : 'ASSET', match : 'ALL', filters : [['Is', $('#header-subtitle').html()]] }
            ]);

            console.log(links.abom);

            if(isBlank(links.abom)) {
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


// Asset BOM Editor : Add further controls
function insertBOMDone(id) {

    $('#' + id).attr('data-link-sbom', links.abom);

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

    $('<div><div>').prependTo($('#' + id + '-controls'))
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
        let linkSBOM     = elemItem.attr('data-link-sbom');
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


// Asset BOM Editor : Add additional columns
function changeBOMViewDone(id, settings, bomData, selectedItems, dataFlatBOM, dataAdditional) {

    let abom = dataAdditional[0].data;

    for(let field of settings.columns) {
        switch(field.fieldId) {
            case 'END_ITEM'         : wsItems.linkEndItem   = field.__self__.link; break;
            case 'SPARE_WEAR_PART'  : wsItems.linkSparePart = field.__self__.link; break;
            case 'PDM_CATEGORY'     : wsItems.linkPurchased = field.__self__.link; break;
            case 'SERIAL'           : wsItems.linkSerial    = field.__self__.link; break;
        }
    }

    let elemTHeadRow = $('#' + id + '-thead-row');

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

        console.log(projectItem)

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

        for(let node of abom.nodes) {
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
                                case wsAssetItems.linkSerial    : isSerial      = nodeField.value === 'true'; console.log(nodeField.value); break;

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
                                if(config.service.fieldValues.indexOf(field.value.toLowerCase()) >= 0) isSparePart = true;
                                break;

                            case wsItems.linkPurchased:
                                if(field.value.toLowerCase() === 'purchased part') isPurchased = true;
                                break;

                            case wsItems.linkSerial:
                                isSerial = (field.value === 'true');
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


// Serial Numbers Management : Add further Controls
function insertGridDone(id) {
   
    $('<div><div>').prependTo($('#' + id + '-controls'))
        .addClass('button')    
        .addClass('with-icon')
        .addClass('icon-reset')
        .html('Sync with Asset BOM')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            syncSerialNumberWithAssetBOM();
            // syncSerialNumbersWithAssetBOM();
        });

}
function syncSerialNumberWithAssetBOM() {
   
    $('#overlay').show();

    let elemSelected    = $('.tree-item.selected');
    let itemLinkSBOM    = elemSelected.attr('data-link-sbom');
    let itemNumber      = elemSelected.attr('data-part-number');
    let itemQuantity    = elemSelected.attr('data-quantity');
    let itemPath        = getBOMItemPath(elemSelected);

    // let split = itemNumber.split('-');
    // if(split.length === 3);
    // itemNumber = split[1] + '-' + split[2];

    console.log(itemLinkSBOM);
    console.log(itemNumber);
    console.log(itemQuantity);
    console.log(itemPath);

    let requests = [
        // $.get('/plm/grid', { link : links.serials }),
        $.get('/plm/grid', { link : links.selected }),
        $.get('/plm/grid', { link : links.serials }),
        // $.get('/plm/bom',  { link : links.abom, viewId : wsAssetItems.bomViewId }),
        // $.get('/plm/bom-views-and-fields',  { link : links.abom, viewId : wsAssetItems.bomViewId, useCache : true })
    ]

    Promise.all(requests).then(function(responses) {

        console.log(responses);
        console.log(links);

        // let parts = getBOMPartsList({ 
        //     viewFields : responses[2].data[0].fields,
        //     selectItems : {
        //         fieldId : 'SPARE_PART',
        //         values : [ 'true' ]
        //     }
        // }, responses[1].data);

        let requestsAddItem    = [];
        let requestsAddList    = [];
        let requestsRemoveItem = [];
        let requestsRemoveList = [];
        let index              = 1;

        // for(let part of parts) {

            // let path  = part.path.toString();
            // let count = part.quantity;

            // let count = Number()

            // for(let field of part.fields) {
            //     if(field.fieldId === 'NUMBER') part.number = field.value;
            // }

        for(let row of responses[0].data) {
            let ref = getGridRowValue(row, 'LOCATION', '');
            console.log(ref);
            if(ref === itemPath.string) index++;
        }

        let viewerInstances = viewerGetComponentsInstances([itemNumber])[0].instances;

        // console.log(viewerInstances.length);

        for(index; index <= itemQuantity; index++) {
            console.log(index);
            let viewerdbId = (index < viewerInstances.length + 1) ? viewerInstances[index-1].dbId : '';
            // console.log(viewerdbId);
            requestsAddItem.push($.get('/plm/add-grid-row', {
                link : itemLinkSBOM,
                data : [
                    { fieldId : 'ID'   , value : index            },
                    { fieldId : 'LOCATION'   , value : itemPath.string            },
                    { fieldId : 'ITEM_NUMBER', value : elemSelected.attr('data-part-number')        },
                    { fieldId : 'INSTANCE_ID', value : viewerdbId          }
                    // { fieldId : 'ITEM'       , value : { link : part.link }}
                ]
            }));
            // console.log(itemLinkSBOM);

            let data = [
                { fieldId : 'ASSET_ITEM'  , value : itemLinkSBOM          },
                { fieldId : 'LOCATION'   , value : itemPath.string            },
                { fieldId : 'ITEM_NUMBER', value : elemSelected.attr('data-part-number')        },
                { fieldId : 'INSTANCE_ID', value : viewerdbId          }
                // { fieldId : 'ITEM'       , value : { link : links.selected }}
            ];

            // console.log(data);


            requestsAddList.push($.get('/plm/add-grid-row', {
                link : links.serials,
                data : [
                    { fieldId : 'ASSET_ITEM'  , value : { link : itemLinkSBOM          }},
                    { fieldId : 'LOCATION'   , value : itemPath.string            },
                    { fieldId : 'ITEM_NUMBER', value : elemSelected.attr('data-part-number')        },
                    { fieldId : 'INSTANCE_ID', value : viewerdbId          }
                    // { fieldId : 'ITEM'       , value : { link : links.selected }}
                ]
            }));
        }


        // console.log(requestsAddItem.length);
        // console.log(requestsAddList.length);
        // console.log(links.serials);

        Promise.all(requestsAddItem).then(function(responses) {
            Promise.all(requestsAddList).then(function(responses) {
                Promise.all(requestsRemoveItem).then(function(responses) {
                    $('#overlay').hide();
                    settings.grid['grid'].load();
                });
            });
        });

    });


}
function syncSerialNumbersWithAssetBOM() {

    $('#overlay').show();

    let requests = [
        // $.get('/plm/grid', { link : links.serials }),
        $.get('/plm/grid', { link : links.selected }),
        $.get('/plm/bom',  { link : links.abom, viewId : wsAssetItems.bomViewId }),
        $.get('/plm/bom-views-and-fields',  { link : links.abom, viewId : wsAssetItems.bomViewId, useCache : true })
    ]

    Promise.all(requests).then(function(responses) {

        let parts = getBOMPartsList({ 
            viewFields : responses[2].data[0].fields,
            selectItems : {
                fieldId : 'SPARE_PART',
                values : [ 'true' ]
            }
        }, responses[1].data);

        let requestsAdd    = [];
        let requestsRemove = [];

        for(let part of parts) {

            let path  = part.path.toString();
            let count = part.quantity;

            for(let field of part.fields) {
                if(field.fieldId === 'NUMBER') part.number = field.value;
            }

            for(let row of responses[0].data) {
                let ref = getGridRowValue(row, 'LOCATION', '');
                if(ref === path) count--;
            }

            let viewerInstances = viewerGetComponentsInstances([part.number])[0].instances;

            for(let i = 0; i < count; i++) {
                let viewerdbId = (i < viewerInstances.length) ? viewerInstances[i].dbId : '';
                requests.push($.get('/plm/add-grid-row', {
                    link : links.serials,
                    data : [
                        { fieldId : 'LOCATION'   , value : path                },
                        { fieldId : 'ITEM_NUMBER', value : part.number         },
                        { fieldId : 'VIEWER_DBID', value : viewerdbId          },
                        { fieldId : 'ITEM'       , value : { link : part.link }}
                    ]
                }));
            }

        }

        Promise.all(requestsAdd).then(function(responses) {
            Promise.all(requestsRemove).then(function(responses) {
                $('#overlay').hide();
                settings.grid['snl'].load();
            });
        });

    });

}
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

    let elemCellDBID = elemClicked.find('.column-INSTANCE_ID');
    
    if(elemCellDBID.length === 0) return;
    
    let elemCellNUMBER = elemClicked.find('.column-ITEM_NUMBER');

    if(elemCellNUMBER.length === 0) return;

    let dbId   =   elemCellDBID.html();
    let number = elemCellNUMBER.html();

    viewerHighlightInstances(number, [dbId], { ghosting : false })

}







// function insertGridDataDone(id) {

//     console.log('   insertGridDataDone   ---');

//     let elemTHRow = $('#grid-thead').children().first();
//     let elemTBody = $('#grid-tbody');

//     elemTHRow.prepend($('<th></th>'));

//     elemTBody.children().each(function() {

//         let elemRow = $(this);

//         let elemCell = $('<td></td>').prependTo(elemRow);
//         let elemButton = $('<div></div>').appendTo(elemCell)
//             .addClass('button')
//             .addClass('select-in-viewer')
//             .addClass('icon')
//             .addClass('icon-link')
//             .click(function() {
//                 $('.select-in-viewer').removeClass('main');
//                 let selection = viewerGetSelectedComponentPaths();
//                 if(selection.length === 1) {
//                     let elemRow = $(this).closest('tr');
//                     elemRow.find('input').each(function() {
//                         if($(this).attr('data-id') === 'LOCATION') {
//                             $(this).val(selection[0]);
//                             viewerResetSelection({
//                                 fitToView : false,
//                                 resetView : false,
//                                 resetColors : false,
//                                 keepHidden : true,
//                                 showAll : false
//                             });
//                         }
//                     });
//                 } else {
//                     $(this).addClass('main');
//                 }

//             });

//     });


// }





// Create new asset item when user clicks given button
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
                addFieldToPayload(params.sections, wsAssetItems.sections, null, 'INSTANCE_COUNT', item.attr('data-total-quantity') );

                addDerivedFieldsToPayload(params.sections, wsAssetItems.sections, dataDerivedFields);

                console.log(params);

                requestsCreate.push($.post('/plm/create', params));

            }

        }

        Promise.all(requestsCreate).then(function(responses) {

            for(let response of responses) {
                
                let linkAssetItem   = response.data.split('360.net')[1];
                let linkAssetParent = links.abom;
                let elemBOMItem     = $('.bom-item:eq(' + response.params.index + ')');
                let elemBOMParent   = getBOMItemParent(elemBOMItem);

                if(elemBOMParent !== null) linkAssetParent = elemBOMParent.attr('data-link-sbom');

                elemBOMItem.attr('data-link-sbom', linkAssetItem)
                    .removeClass('missing')
                    .addClass('match');

                requestsUpdate.push($.get('/plm/details', { link : linkAssetItem, index : response.params.index }));
                requestsUpdate.push($.get('/plm/bom-add', { linkParent : linkAssetParent, linkChild : linkAssetItem, number : elemBOMItem.attr('data-number'), quantity : elemBOMItem.attr('data-total-quantity') }));

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


// Open selected Asset Item when clicking the given descriptor
function openAssetItem(elemClicked) {

    let elemItem = elemClicked.closest('.bom-item');
    let linkSBOM = elemItem.attr('data-link-sbom');

    if(!isBlank(linkSBOM)) openItemByLink(linkSBOM);

}