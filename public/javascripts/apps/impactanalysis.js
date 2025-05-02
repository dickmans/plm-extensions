let managedItems        = [];
let selectedManagedItem = {};
let bomViews            = [];
let bomItemsByStatus    = [];
let relatedWorkspaces   = [];
let relatedItems        = [];
let isRevisioningWS     = false;
let isEditable          = false;
let urlParameters       = getURLParameters();


$(document).ready(function() {   

    appendProcessing('nav', false);
    appendProcessing('details', false);
    appendProcessing('change', false);
    appendViewerProcessing();
    appendOverlay(true);

    setUIEvents();

    getFeatureSettings('impactanalysis', [], function(responses) {

        getLockStatusAndSubtitle();
        getWorkspaceConfiguration();
        getRelationships(function() {});

    });

});


// UI functionality
function setUIEvents() {
       

    // Header Actions
    $('#toggle-list').click(function() {
        $('body').toggleClass('no-nav');
        $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
        if(typeof viewer !== 'undefined') { setTimeout(function() { viewer.resize(); }, 250); }
    });
    $('#toggle-tabs').click(function() {
        $('body').toggleClass('no-tabs');
        $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
        if(typeof viewer !== 'undefined') { setTimeout(function() { viewer.resize(); }, 250); }
    });
    $('#toggle-side').click(function() {
        $('body').toggleClass('no-side');
        $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
        if(typeof viewer !== 'undefined') { setTimeout(function() { viewer.resize(); }, 250); }
    });
    $('#toggle-comparison').click(function() {

    
        $.get( '/plm/get-viewables', { 'wsId' : selectedManagedItem.wsId, 'dmsId' : selectedManagedItem.prev }, function(response) {
    
            if(response.data.length > 0) {
    
                // for(viewable of response.data) {
    
                    // let resourceName = viewable.resourceName;

                    // console.log(resourceName);
    
                    // if((resourceName.indexOf('.iam.dwf') > 0) || (resourceName.indexOf('.ipt.dwf') > 0)){
                        // $.get( '/plm/get-viewable', { 'link' : viewable.selfLink } , function(response) {        
                            addToViewer(response.data[0]);
                        // });
                    // }
    
                // }
    
            }
    
        });
        // $.get( '/plm/list-viewables', { 'wsId' : selectedManagedItem.wsId, 'dmsId' : selectedManagedItem.prev }, function(response) {
    
        //     console.log(response);
    
        //     if(response.data.length > 0) {
    
        //         for(viewable of response.data) {
    
        //             let resourceName = viewable.resourceName;

        //             console.log(resourceName);
    
        //             if((resourceName.indexOf('.iam.dwf') > 0) || (resourceName.indexOf('.ipt.dwf') > 0)){
        //                 $.get( '/plm/get-viewable', { 'link' : viewable.selfLink } , function(response) {        
        //                     addToViewer(response.data);
        //                 });
        //             }
    
        //         }
    
        //     }
    
        // });



    });
    $('#toggle-viewer').click(function() {
        $('body').toggleClass('no-viewer');
        if(typeof viewer !== 'undefined') { setTimeout(function() { viewer.resize(); }, 250); }
    });


    // Update Manage Item in given CO tab
    $('#save').click(function() {
        updateManagedItem();
    });


    $('.bar').click(function() {

        viewerResetSelection();

        if($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            $('.bom-item').each(function() {
                $(this).show();
            });
        } else {
            $(this).addClass('selected');
            $(this).siblings().removeClass('selected');
            let filter = $(this).attr('data-filter');
            let partNumbers = [];
            $('.bom-item').each(function() {
                if($(this).hasClass(filter)) {
                    $(this).show(); 
                    partNumbers.push($(this).attr('data-part-number'));
                } else $(this).hide();
            });
            viewerSelectModels(partNumbers);
            setItemColorsInViewer();




            // viewerSetColors(partNumbers, color, fitToView)
        }

    });
    $('#apply-to-viewer').click(function() {
        setItemColorsInViewer();
    });


    $('#related-select-all').click(function() {
        $('.changed-item').addClass('selected');
    });

    $('#related-deselect-all').click(function() {
        $('.changed-item').removeClass('selected');
    });

    $('#related-add-selected').click(function() {
        addManagedItem(false);
    });

    $('#related-add-all').click(function() {
        addManagedItem(true);
    });

    // $('#tabs').children().click(function() {
    //     $(this).addClass('selected');
    //     $(this).siblings().removeClass('selected');

    // });
    // $('#tabs').children().first().click();


}
function getItemLink(title, urn, tag) {
    
    if(tag === null) tag = 'td';
    if(typeof tag === 'undefined') tag = 'td';

    let params  = urn.split(".");
    let wsId    = params[params.length - 2];
    let urnLink = urn;
        urnLink = urnLink.replace(/:/g, "%60");
        urnLink = urnLink.replace(/\./g, ",");
    
    let link = $("<a></a>");
        link.attr("target", "_blank");
        link.attr("href", "https://" + tenant + ".autodeskplm360.net/plm/workspaces/" + wsId + "/items/itemDetails?view=full&tab=details&mode=view&itemId=" + urnLink);
        link.html(title);
    
    let elemLink = $('<' + tag + '></' + tag + '>');
        elemLink.append(link);
    
    return elemLink;
                    
}
function getFieldItemLink(value) {
    
    let params  = value.urn.split(".");
    let wsId    = params[params.length - 2];
    let urnLink = value.urn;
        urnLink = urnLink.replace(/:/g, "%60");
    
    let link = $("<a></a>");
        link.css("display", "block");
        link.attr("target", "_blank");
        link.attr("href", "https://" + tenant + ".autodeskplm360.net/plm/workspaces/" + wsId + "/items/itemDetails?view=full&tab=details&mode=view&itemId=" + urnLink);
        link.html(value.title);
    
    return link;
                    
}
function setCounter(id, value, total) {

    let elemCounter = $('#' + id + '-counter');
    let count = elemCounter.html();

    if(typeof total === 'undefined') total = true;

    if((count !== '') && (count !== '-')) count = Number(count); else count = 0;

    if(!total) value += count;

    if(value > 0) {
        elemCounter.html(value);
        elemCounter.parent().removeClass('count-work');
        elemCounter.parent().removeClass('count-none');
        elemCounter.parent().addClass('count-done');
    } else {
        elemCounter.html('-');
        elemCounter.parent().removeClass('count-work');
        elemCounter.parent().removeClass('count-done');
        elemCounter.parent().addClass('count-none');
    }

    // if(value > 0) elemCounter.css('display', 'inline-block');
    // else elemCounter.siblings('.none').css('display', 'inline-block');

}


// Get user access permission
function getLockStatusAndSubtitle() {

    let requests = [
        $.get('/plm/details',     { wsId : wsId, dmsId : dmsId }),
        $.get('/plm/permissions', { wsId : wsId, dmsId : dmsId })
    ]

    Promise.all(requests).then(function(responses) {

        let description = getSectionFieldValue(responses[0].data.sections, 'DESCRIPTION', '', '');
        let elem        = $('<span></span>').html(description);

        $('#header-description').append(elem.text());
        $('#header-descriptor').html(responses[0].data.title);

        let isLocked = responses[0].data.itemLocked;

        if(!isLocked) {
            if(hasPermission(responses[1].data, 'edit_workflow_items')) {
                isEditable = true;
                $('#save').show();
            }
        }

        getManagedFields();

    });

    // $.get('/plm/permissions', { wsId : wsId, dmsId : dmsId }, function(response) {
    //     if(hasPermission(response.data, 'edit_workflow_items')) {
    //         isEditable = true;
    //         $('#save').show();
    //     }
    //     getManagedFields();
    // });

}


// Insert descriptor in header subtitle
// function setHeaderSubtitle() {

//     $.get('/plm/details', { 'wsId' : wsId, 'dmsId' : dmsId}, function(response) {

//         let description = getSectionFieldValue(response.data.sections, 'DESCRIPTION', '', '');
//         let elem = $('<span></span>');
//             elem.html(description);

//         isLocked = response.data.itemLocked;

//         if(!isLocked) $('#save').show();

//         $('#header-description').append(elem.text());
//         $('#header-descriptor').html(response.data.title);

//         getManagedFields();

//     });    
// }


// Get columns of managed items tab of Change Order
function getManagedFields() {
    
    $.get('/plm/managed-fields', { wsId : urlParameters.wsId, useCache : true }, function(response) {

        let elemFields = $('#change');

        for(let field of response.data) {
            insertDetailsField(field, null, elemFields, false, { editable : isEditable });
        }

        elemFields.children('.field').hide();

        $('#overlay').hide();

    });

}


// Get relationships
function getWorkspaceConfiguration() {

    let requests = [
        $.get('/plm/workspace',          { wsId : urlParameters.wsId, useCache : true }),
        $.get('/plm/related-workspaces', { wsId : urlParameters.wsId, useCache : true, view : '10'})
    ];

    Promise.all(requests).then(function(responses) {

        isRevisioningWS = responses[0].data.type === '/api/v3/workspace-types/7';

        for(workspace of responses[1].data) {
            relatedWorkspaces.push({
                'wsId'  : workspace.link.split('/')[4],
                'title' : workspace.title
            });
        }

        // TODO : REMOVE
        // getManagedItems();

        insertManagedItems(urlParameters.link, {
            headerLabel     : 'Affected Items',
            layout          : 'list',
            contentSize     : 'm',
            number          : true,
            reload          : true,
            search          : true,
            singleToolbar   : 'actions',
            counters        : true,
            onClickItem     : function(elemClicked) { selectManagedItem(elemClicked); },
            onDblClickItem  : function(elemClicked) { openItemByLink(elemClicked.attr('data-link')); }
        });

    });

}
function insertManagedItemsDataDone(id, items, fields) {

    for(let item of items) {
        
        let countStock       = 0;
        let countOrders      = 0;
        let countSupplies    = 0;
        let productionOrders = [];
        let transitionLink   = (isBlank(item.targetTransition)) ? '' : item.targetTransition.link;

        for(let field of item.linkedFields) {
                    
            let fieldId = field.__self__.split('/')[8];

            switch(fieldId) {

                case config.impactanalysis.fieldIdStockQuantity              : countStock        = field.value; break;
                case config.impactanalysis.fieldIdNextProductionOrderQantity : countOrders       = field.value; break;
                case config.impactanalysis.fieldIdPendingSupplies            : countSupplies     = (field.value === 'true') ? 1 : 0; break;
                case config.impactanalysis.fieldIdProductionOrdersData       : productionOrders  = field.value; break;

            }

            if(fieldId === config.impactanalysis.fieldIdProposedChange) transition = field.value;

        }

        if(!isBlank(productionOrders)) {
            if(!Array.isArray(productionOrders)) {
                productionOrders = productionOrders.replace(/&#34;/g, '"');
                productionOrders = JSON.parse(productionOrders);
            }
        } else { productionOrders = []; }        

        if(countStock   > 1000) countStock   = Math.floor(countStock   / 1000) + ' k';
        if(countOrders  > 1000) countOrders  = Math.floor(countOrders  / 1000) + ' k';

        managedItems.push({
            link              : item.item.link,
            affected          : item.__self__,
            wsId              : item.item.link.split('/')[4],
            fields            : item.linkedFields,
            from              : item.fromRelease,
            transition        : transitionLink,
            prev              : null,
            prevLink          : null,
            productionOrders  : productionOrders
        });

        if(!isRevisioningWS) {
            transition === '';
            for(field of affectedItem.linkedFields) {
                let fieldId = field.__self__.split('/')[8];
                if(fieldId === config.impactanalysis.fieldIdProposedChange) transition = field.value;
            }
        }

        $('#managed-items-content').children().each(function() {

            let elemTile = $(this);

            if(elemTile.attr('data-link') === item.item.link) {

                elemTile.addClass('unread');

                let elemStatus = $('<div></div>').appendTo(elemTile)
                    .addClass('tile-item-status');

                let elemStatusStock = $('<div></div>').appendTo(elemStatus)
                    .attr('title', 'In Stock Quantity');
                
                $('<div></div>').appendTo(elemStatusStock)
                    .addClass('icon')
                    .addClass('icon-stock');
            
                $('<div></div>').appendTo(elemStatusStock)
                    .addClass('value')
                    .html(countStock);

                let elemStatusOrders = $('<div></div>').appendTo(elemStatus)
                    .attr('title', 'Next Production Order Quantity');
                
                $('<div></div>').appendTo(elemStatusOrders)
                    .addClass('icon')
                    .addClass('icon-order-in-work');
                
                $('<div></div>').appendTo(elemStatusOrders)
                    .addClass('value')
                    .html(countOrders);

                let elemStatusSuppliers = $('<div></div>').appendTo(elemStatus)
                    .attr('title', 'Supplier Packages Pending');
                
                $('<div></div>').appendTo(elemStatusSuppliers)
                    .addClass('icon')
                    .addClass('icon-shipping');
                
                $('<div></div>').appendTo(elemStatusSuppliers)
                    .addClass('value')
                    .html(countSupplies);
                    
                if(countStock    !== 0) elemStatusStock.addClass('highlight-stock');
                if(countOrders   !== 0) elemStatusOrders.addClass('highlight-orders');
                if(countSupplies !== 0) elemStatusSuppliers.addClass('highlight-suppliers');

            }

        });


    }

    $('#managed-items-content').children().first().click();

}


// Retrieve related items
function getRelationships(callback) {

    relatedItems = [];

    $.get('/plm/relationships', { wsId : wsId, dmsId: dmsId}, function(response) {

        if(response.error) showErrorMessage('Error', response.data.message);
        else {

            for(relationship of response.data) {
                relatedItems.push({
                    'urn'           : relationship.item.urn,
                    'link'          : relationship.__self__,
                    'description'   : relationship.description
                });
            }

            callback();
        }

    });

}



// TODO : REMOVE
// Get managed items of Change Order
// function getManagedItems() {
    
//     $.get('/plm/manages', { 'dmsId' : dmsId, 'wsId' : wsId }, function(response) {

//         $('#nav-counter').html(response.data.length);
//         $('#nav-processing').hide();

//         let isUpdate = $('.nav-item').length > 0;

//         for(var i = 0; i < response.data.length; i++) {
            
//             var affectedItem    = response.data[i];
//             var itemData        = affectedItem.item.link.split('/');
//             var transition      = (affectedItem.hasOwnProperty("targetTransition")) ? affectedItem.targetTransition.title : "- not defined -";
//             let transitionLink  = (affectedItem.hasOwnProperty('targetTransition')) ? affectedItem.targetTransition.link : '';
//             let revision        = "";
//             let fromRelease     = (affectedItem.hasOwnProperty("fromRelease")) ? affectedItem.fromRelease : "";
//             let toRelease       = (affectedItem.hasOwnProperty("toRelease")) ? affectedItem.toRelease : "";

//             let add              = true;
//             let countStock       = 0;
//             let countOrders      = 0;
//             let countSupplies    = 0;
//             let productionOrders = [];

//             $('.nav-item').each(function() {
//                 if($(this).attr('data-urn') === affectedItem.item.urn) add = false;
//             });


//             if(add) {

//                 if(fromRelease !== "") {
//                     revision = "from Rev " + fromRelease + " to Rev " + toRelease;    
//                 } else if(toRelease !== "") {
//                     revision = "Release as Rev " + toRelease;           
//                 } else {
//                     revision = " - not defined -"          
//                 }

//                 if(transition !== '- not defined -') transition += ' ' + revision;

//                 for(field of affectedItem.linkedFields) {
                    
//                     let fieldId = field.__self__.split('/')[8];

//                     switch(fieldId) {

//                         case config.impactanalysis.fieldIdStockQuantity              : countStock        = field.value; break;
//                         case config.impactanalysis.fieldIdNextProductionOrderQantity : countOrders       = field.value; break;
//                         case config.impactanalysis.fieldIdPendingSupplies            : countSupplies     = (field.value === 'true') ? 1 : 0; break;
//                         case config.impactanalysis.fieldIdProductionOrdersData       : productionOrders  = field.value; break;

//                     }

//                     if(fieldId === config.impactanalysis.fieldIdProposedChange) transition = field.value;

//                 }

//                 if(!isBlank(productionOrders)) {
//                     if(!Array.isArray(productionOrders)) {
//                         productionOrders = productionOrders.replace(/&#34;/g, '"');
//                         productionOrders = JSON.parse(productionOrders);
//                     }
//                 } else { productionOrders = []; }

//                 if(countStock   > 1000) countStock   = Math.floor(countStock   / 1000) + ' k';
//                 if(countOrders  > 1000) countOrders  = Math.floor(countOrders  / 1000) + ' k';

//                 managedItems.push({
//                     'urn'               : affectedItem.item.urn,
//                     'affected'          : affectedItem.__self__,
//                     'link'              : affectedItem.item.link,
//                     'wsId'              : itemData[4],
//                     'dmsId'             : itemData[6],
//                     'fields'            : affectedItem.linkedFields,
//                     'from'              : affectedItem.fromRelease,
//                     'transition'        : transitionLink,
//                     'prev'              : null,
//                     'prevLink'          : null,
//                     'productionOrders'  : productionOrders
//                 });

//                 if(!isRevisioningWS) {
//                     transition === '';
//                     for(field of affectedItem.linkedFields) {
//                         let fieldId = field.__self__.split('/')[8];
//                         if(fieldId === config.impactanalysis.fieldIdProposedChange) transition = field.value;
//                     }
//                 }

//                 let elemTile = genTile(affectedItem.item.link, affectedItem.item.urn, '', 'icon-item', affectedItem.item.title, transition);
//                     elemTile.addClass('nav-item');
//                     elemTile.addClass('unread');
//                     elemTile.appendTo("#nav-list").fadeIn();
//                     elemTile.click(function() {
//                         selectManagedItem($(this));
//                     });

//                 let elemStatus = $('<div></div>').appendTo(elemTile)
//                     .addClass('tile-item-status');

//                 let elemStatusStock = $('<div></div>').appendTo(elemStatus)
//                     .attr('title', 'In Stock Quantity');
                
//                 $('<div></div>').appendTo(elemStatusStock)
//                     .addClass('icon')
//                     .addClass('icon-stock');
            
//                 $('<div></div>').appendTo(elemStatusStock)
//                     .addClass('value')
//                     .html(countStock);

//                 let elemStatusOrders = $('<div></div>').appendTo(elemStatus)
//                     .attr('title', 'Next Production Order Quantity');
                
//                 $('<div></div>').appendTo(elemStatusOrders)
//                     .addClass('icon')
//                     .addClass('icon-order-in-work');
                
//                 $('<div></div>').appendTo(elemStatusOrders)
//                     .addClass('value')
//                     .html(countOrders);

//                 let elemStatusSuppliers = $('<div></div>').appendTo(elemStatus)
//                     .attr('title', 'Supplier Packages Pending');
                
//                 $('<div></div>').appendTo(elemStatusSuppliers)
//                     .addClass('icon')
//                     .addClass('icon-shipping');
                
//                 $('<div></div>').appendTo(elemStatusSuppliers)
//                     .addClass('value')
//                     .html(countSupplies);
                    

//                 if(countStock    !== 0) elemStatusStock.addClass('highlight-stock');
//                 if(countOrders   !== 0) elemStatusOrders.addClass('highlight-orders');
//                 if(countSupplies !== 0) elemStatusSuppliers.addClass('highlight-suppliers');

//             }

//         }

//         if(!isUpdate) $('.nav-item').first().click();
        
//     });  

// }


// Get information for selected managed item
function selectManagedItem(elemClicked) {

    $('#overlay').hide();

    elemClicked.removeClass('unread');
    elemClicked.addClass('selected');
    
    $('#change-processing').show();
    $('#change').children('.field').hide();

    let link = elemClicked.attr('data-link');

    reset();
    
    $('#item').attr('data-link', link);
    $('#item-title').html(elemClicked.find('.tile-title').html());

    for(let managedItem of managedItems) {
        if(managedItem.link === link) selectedManagedItem = managedItem;
    }

    insertViewer(link);
    insertDetails(link, {
        hideHeaderLabel  : true,
        collapseContents : true,
        layout           : 'narrow',
        toggles          : true
    })
    insertChangeLog(link, {
        hideHeader      : true,
        filterByUser    : true,
        filterByAction  : true,
        singleToolbar   : 'actions'
    });
    setAffectedItemFields();
    getRootParents();
    getRelated();
    getImpactedRelationships();
    getChangeProcesses();
    getProductionOrders();

    if(selectedManagedItem.prev === null) {
        $.get('/plm/versions', { link : selectedManagedItem.link }, function(response) {
            selectedManagedItem.prev = '';
            selectedManagedItem.prevLink = '';
            for(let version of response.data.versions) {
                if(!isBlank(version.version)) {
                    if(version.version === selectedManagedItem.from) {
                        //$(this).attr('data-from-link', version.item.link);
                        selectedManagedItem.prev     = version.item.link.split('/')[6];
                        selectedManagedItem.prevLink = version.item.link;
                    }
                }
            }
            getBOM();
            getAttachments();
            getItemDetails();
        });
    } else {
        getBOM();
        getAttachments();
        getItemDetails();
    }

}
function reset() {
   
    $('#item').show();

    $('#viewer').hide();

    $('#tabs').children().removeClass('count-none');
    $('#tabs').children().removeClass('count-done');
    $('#tabs').children().addClass('count-work');
    $('#tabs').find('.counter').html('');

    $('#bom-table').html('');
    $('.content-table').find('tbody').children().remove();
    $('.content-list').children().remove();

    $('#related-list').html(''  );

    $('#message').hide();
    
    $('#details-progress').show();
    $('#details-sections').html('');
    $('#details-prev-sections').html('');

    $('.bar').css('flex-grow', 0);
    
}


// APS Viewer
function initViewerDone() {

    viewerAddMarkupControls();   
    viewerAddGhostingToggle();
    viewerAddResetButton();
    viewerAddViewsToolbar();

    $('#viewer-markup-image').attr('data-field-id', 'IMAGE_1');

}


// Get viewables of selected Vault Item to init viewer
function addToViewer(model) {

    if(typeof model.offsetX === 'undefined') model.offsetX = 0;
    if(typeof model.offsetY === 'undefined') model.offsetY = 0;
    if(typeof model.offsetZ === 'undefined') model.offsetZ = 0;

    if(typeof model.angleX === 'undefined') model.angleX = 0;
    if(typeof model.angleY === 'undefined') model.angleY = 0;
    if(typeof model.angleZ === 'undefined') model.angleZ = 0;


    Autodesk.Viewing.Document.load('urn:'+ model.urn, function(doc) {
    
        const rotation = new THREE.Matrix4().makeRotationX(Number(model.angleX)).makeRotationY(Number(model.angleY));
        const translation = new THREE.Matrix4().makeTranslation(Number(model.offsetX), Number(model.offsetY), Number(model.offsetZ));
        
        var viewable = doc.getRoot().getDefaultGeometry();
        viewer.loadDocumentNode(doc, viewable, {
            keepCurrentModels: true,
            // preserveView: true,
            // preserveView: false,
            // keepCurrentModels: true,
                            // placementTransform: (new THREE.Matrix4()).setPosition({x:-1000,y:1000,z:0}),
                            // placementTransform: (new THREE.Matrix4()).makeRotationY(90).makeRotationZ(90).setPosition({x:-1000,y:1000,z:0}),
                            // placementTransform: (new THREE.Matrix4()).makeRotationX(Number(model.angleX)).makeRotationY(Number(model.angleY)).makeRotationZ(Number(model.angleZ)).setPosition({x:Number(model.offsetX), y:Number(model.offsetY), z:Number(model.offsetZ)}),
                            // placementTransform: translation,   // works
                            // placementTransform: rotation, // fails
                            // placementTransform: new THREE.Matrix4().makeRotationX(Number(model.angleX)), // works
                            // placementTransform: new THREE.Matrix4().makeRotationX(Number(model.angleX)).makeTranslation(Number(model.offsetX), Number(model.offsetY), Number(model.offsetZ)), // fails
            // placementTransform: rotation.multiply(translation), // works
            // keepCurrentModels: true,
            globalOffset: {x:0,y:0,z:0}
        }).then(function(result) {
            // viewer.showAll();
            modelDiff();
        }).catch(function(err) {
            console.log(err);
        });

    }, onDocumentLoadFailure);



    // console.log(data);

    // if(index < documents.length) {
        
        // Autodesk.Viewing.Initializer({accessToken: accessToken}, function() {
            // Autodesk.Viewing.Document.load('urn:' + data.urn, function(document) {

            //     // console.log(document);
            //     // console.log(document.getRoot());
            //     // // console.log(document.getPropertyDbPath());


            //     // console.log('aha');

            //     // var rootItem = document.getRootItem();
            //     // var geometryItems3d = Autodesk.Viewing.Document.getSubItemsWithProperties(
            //     //     rootItem, {
            //     //         'type': 'geometry',
            //     //         'role': '3d' },    
            //     //     true);
                
            //     // var pathCollection = [];
                
            //     // geometryItems3d.forEach((item)=>{
            //     //     pathCollection.push(document.getViewablePath(item));
            //     // });
                
            //     var loadOptions = {
            //         keepCurrentModels : true,
            //         globalOffset: {x:0, y:0, z:0},
            //         applyRefPoint: true,
            //         modelNameOverride: name,
            //         applyScaling: 'mm'
            //         // placementTransform: mat , 
            //         // globalOffset:{x:0,y:0,z:0}
            //         // sharedPropertyDbPath: document.getPropertyDbPath()
            //     };
                
            //     // var mat = new THREE.Matrix4();
            //     // viewer.loadModel(pathCollection[0], loadOptions, function() {
            //     //     loadNext();
            //     // });


            //     const rootItem = document.getRoot();
            //     const filter = { type: 'geometry', role: '3d' };
            //     const viewables = rootItem.search(filter);

            //     if (viewables.length === 0) {
            //       return onLoadModelError('Document contains no viewables.');
            //     }

            //     const bubble = viewables[0];

            //     viewer.loadDocumentNode(document, bubble, loadOptions).then(modelDiff);

  



                
            // });
        // });
        
    // }
}
function modelDiff() {

    // 'application/vnd.autodesk.fusion360': { 'supports2d': true },
    // 'application/vnd.autodesk.f3d': { 'supports2d': true },
    // 'application/vnd.autodesk.revit': { 'supports2d': true },
    // 'application/vnd.autodesk.r360': { 'supports2d': true },
    // 'application/vnd.autodesk.inventor.assembly': { 'supports2d': true },
    // 'application/vnd.autodesk.navisworks': { 'supports2d': true  },
    // 'application/vnd.autodesk.cad': { 'supports2d': false  },
    // 'application/vnd.autodesk.dxf': { 'supports2d': false  },
    // 'application/vnd.autodesk.autocad.dwg': { 'supports2d': false  }


    var extensionConfig = {
        'availableDiffModes': ['overlay', 'sidebyside'],
        'mimeType' : 'application/vnd.autodesk.inventor.assembly',
        // 'mimeType' : 'application/vnd.autodesk.cad',
        // 'mimeType' : 'application/vnd.autodesk.autocad.dwg',
        'primaryModels' : [viewer.getVisibleModels()[1]],
        // 'diffadp' : true,
        'diffadp' : false,
        'diffModels' : [viewer.getVisibleModels()[0]],
        // 'diffMode' : 'overlay',
        'diffMode' : 'sidebyside',
        'useSplitScreenExtension': true,
        'versionA' : '2',
        'versionB' : '1'
    }

    viewer.loadExtension('Autodesk.DiffTool', extensionConfig).then(function (res) {
        window.DIFF_EXT = viewer.getExtension('Autodesk.DiffTool');
        console.log(window.DIFF_EXT);
    }).catch(function (err) {
        console.log(err);
    });

} 



// [2] Set managed items tab fields
function setAffectedItemFields() {

    $('#change').find('.field-value').each(function() {
        $(this).children().first().val('');
    });

    $.get('/plm/managed-item', { link : selectedManagedItem.affected}, function(response) {
        $('#change-processing').hide();
        $('#change').children('.field').show();
        for(let field of response.data.linkedFields) setFieldValue(field);
    });

}
function setFieldValue(field) {

    let fieldId = field.__self__.split('/')[8];

    $('.field-value').each(function() {

        if($(this).attr('data-id') === fieldId) {

            let value = field.value;

            if(typeof field.value === 'object') value = field.value.link;

            if($(this).hasClass('checkbox')) {
                if(value === 'true') {
                    $(this).children().first().prop( "checked", true );
                } else {
                    $(this).children().first().prop( "checked", false );
                }
            } else $(this).children().first().val(value);

        }

    });

}
function updateManagedItem() {

    $('#overlay').show();

    let params = {
        link       : selectedManagedItem.affected,
        fields     : [],
        transition : selectedManagedItem.transition
    }

    $('#change .field-value').each(function() {

        let fieldData = getFieldValue($(this));

        params.fields.push({
            __self__ : $(this).attr('data-link'),
            value    : fieldData.value
        });

    });

    $.post('/plm/update-managed-item', params, function(response) {
        if(response.error) {
            showErrorMessage('Error', response.data.message);
            }
        $('#overlay').hide();
    });

}



// [3] Get details of selected item
function getItemDetails() {

    // let promises = [
    //     $.get('/plm/sections', { 'wsId' : wsId }),
    //     $.get('/plm/fields', { 'wsId' : wsId }),
    //     $.get('/plm/details', { 'link' : link })
    // ];

    // Promise.all(promises).then(function(responses) {
    //     $.get('/plm/details', { 'link' : link }, function(response) {
    //         insertItemDetails(elemParent, responses[0].data, responses[1].data, responses[2].data, false, false, false);

    $('#details-processing').show();
    $('#details-sections').html('');

    let elemParentPrev = $('#details-prev-sections');
        elemParentPrev.html('');


    let requests = [ 
        $.get('/plm/sections', { 'wsId' : selectedManagedItem.wsId }), 
        $.get('/plm/fields'  , { 'wsId' : selectedManagedItem.wsId }), 
        $.get('/plm/details' , { 'link' : selectedManagedItem.link })
    ];

    if(selectedManagedItem.prevLink !== '') requests.push($.get('/plm/details', { 'link' : selectedManagedItem.prevLink }));

    Promise.all(requests).then(function(responses) {

        if(responses[2].params.link !== selectedManagedItem.link) return;

        $('#details-processing').hide();

        // insertItemDetailsFields('', 'details', responses[0].data, responses[1].data, responses[2].data, false, false, false);

        if(requests.length > 3) {
            // insertItemDetailsFields('', 'details-prev', responses[0].data, responses[1].data, responses[3].data, false, false, false);
            // markItemDetailsChanges();
            elemParentPrev.html('');
        }

    });


    // $.get('/plm/details', { 'link' : selectedManagedItem.link }, function(response) {

    //     if(response.params.link !== selectedManagedItem.link) return;

    //     $('#item-title').html(response.data.title);

    //     let elemList = $('#details-list');
    //         // elemList.children().hide();
    //         elemList.html('');
        
    //     for(section of response.data.sections) {
        
    //         var elemSection = $('<div></div>');
    //             elemSection.addClass('section');
    //             elemSection.appendTo(elemList);
            
    //         var elemSectionTitle = $('<div></div>');
    //             elemSectionTitle.addClass('section-title');
    //             elemSectionTitle.html(section.title);
    //             elemSectionTitle.appendTo(elemSection);
            
    //         var elemSectionContent = $('<div></div>');
    //             elemSectionContent.addClass('section-content');
    //             elemSectionContent.appendTo(elemSection);
        
    //         for(field of section.fields) {
            
    //             var elemField = $('<div></div>');
    //             var elemLabel = $('<div></div>');
    //             var elemValue = $('<div></div>');

    //             elemField.addClass('field');
    //             elemLabel.addClass('field-label');
    //             elemValue.addClass('field-value');
                
    //             let fieldValue  = field.value;
                
    //             if(fieldValue === null) {
    //                 elemValue.html('');
    //             } else if(typeof fieldValue === 'object' ) {
    //                 if(Array.isArray(fieldValue)) {
    //                     for(value of field.value) {
    //                         elemValue.append(getFieldItemLink(value));
    //                     }       
    //                 } else {
    //                      elemValue.append(getFieldItemLink(field.value));
    //                 }
    //             } else {
    //                 elemValue.html(decodeHtml(field.value));
    //             }
                
    //             elemLabel.html(field.title);

    //             elemField.append(elemLabel).append(elemValue);
    //             elemField.appendTo(elemSectionContent);
            
    //         }
    //     }
        
    // });
    
}
function markItemDetailsChanges() {

    $('#details-sections').find('.field-value').each(function() {

        let fieldId     = $(this).attr('data-id');
        let fieldValue  = $(this).val();
        let elemField   = $(this).closest('.field');
        let className   = 'match';

        $('#details-prev-sections').find('.field-value').each(function() {
            if($(this).attr('data-id') === fieldId) {
                if($(this).val() !== fieldValue) {
                    
                    className = 'different';

                    let elemDiff = $('<div></div>');
                        elemDiff.addClass('field');
                        elemDiff.addClass('difference');
                        elemDiff.insertAfter(elemField);

                    let elemDiffLabel = $('<div></div>');
                        elemDiffLabel.addClass('field-label');
                        elemDiffLabel.addClass('icon');
                        elemDiffLabel.addClass('icon-important');
                        elemDiffLabel.appendTo(elemDiff);

                    $(this).appendTo(elemDiff).addClass('was');
                }
            }
        });

        elemField.addClass(className);


    });


}


// [4] Get Bill of Materials
function getBOM() {

    let proceed = true;

    $('.bom-view').each(function() {
        if($(this).attr('data-wsid') === selectedManagedItem.wsId) {
            $(this).show();
            if($(this).hasClass('selected')) {
                $(this).click();
                proceed = false;
            }
        } else {
            $(this).hide();
        }
    });

    if(proceed) {
        $('.bom-view').each(function() {
            if($(this).attr('data-wsid') === selectedManagedItem.wsId) {
                if(proceed) {
                    $(this).click();
                    proceed = false;
                }
            }
        });
    }

    if(proceed) {

        $.get('/plm/bom-views-and-fields', { link : selectedManagedItem.link, useCache : true }, function(response) {

            let totalViews = response.data.length;

            for(let view of response.data) {

                bomViews.push({
                    'wsId'      : selectedManagedItem.wsId,
                    'id'        : view.id,
                    'link'      : view.__self__.link,
                    'name'      : view.name,
                    'default'   : view.isDefault,
                    'fields'    : []
                });

                let elemView = $('<div></div>');
                    elemView.attr('data-wsId', selectedManagedItem.wsId);
                    elemView.attr('data-link', view.link);
                    elemView.attr('data-viewId', view.id);
                    elemView.addClass('bom-view');
                    elemView.html(view.name);
                    elemView.appendTo($('#bom-views'));
                    elemView.click(function() {
                        selectBOMView($(this));

                    });

                if(isFirstView()) elemView.addClass('first');
                if(isLastView(totalViews)) elemView.addClass('last');

                if(view.isDefault === true) {
                    elemView.click();
                }

            };

        });

    }

}
function isFirstView() {
    
    let count = 0;

    for(bomView of bomViews) {
        if(bomView.wsId === selectedManagedItem.wsId) count++;
    }
    
    if(count === 1) return true;

    return false;

}
function isLastView(total) {
    
    let count = 0;

    for(bomView of bomViews) {
        if(bomView.wsId === selectedManagedItem.wsId) count++;
    }
    
    if(count === total) return true;

    return false;
    
}
function selectBOMView(elemClicked) {

    let bomViewId = Number(elemClicked.attr('data-viewId'));

    elemClicked.siblings('[data-wsId="' + selectedManagedItem.wsId + '"]').removeClass('selected');
    elemClicked.addClass('selected');

    for(bomView of bomViews) {

        if(bomView.id === bomViewId) {

            if(bomView.fields.length === 0) {

                $.get( '/plm/bom-view-fields', { 'link' : bomView.link }, function(response) {

                    for(bomViewDef of bomViews) {

                        if(response.params.link === bomViewDef.link) {

                            for(field of response.data) {
                                bomViewDef.fields.push({
                                    'name'          : field.name,
                                    'formulaField'  : field.formulaField,
                                    'displayOrder'  : field.displayOrder,
                                    'link'          : field.__self__.link,
                                    'fieldId'       : field.fieldId,
                                    'type'          : field.type.link,
                                    'formulaField'  : field.formulaField
                                }) 
                            }
                            bomViewDef.fields.sort(function(a, b){
                                var nameA=a.displayOrder, nameB=b.displayOrder
                                if (nameA < nameB) //sort string ascending
                                    return -1 
                                if (nameA > nameB)
                                    return 1
                                return 0 //default return value (no sorting)
                            });

                            continue;
                        }
                    }

                    let requestId = response.params.link.split('/')[8];
                    setBOMTable(requestId);

                });
            } else {

                setBOMTable(bomView.id);
            }

            break;

        }

    }

}
function setBOMTable(viewId) {
    
    // let selectedManagedItem;
    let fields  = [];
    let columns = '';

    let params = {
        link          : selectedManagedItem.link,
        revisionBias  : 'changeOrder',
        viewId        : viewId
    }

    for(let bomView of bomViews) {
        if(bomView.id === Number(viewId)) {
            fields = bomView.fields;
            for(field of bomView.fields) {
                columns += '<th>' + field.name + '</th>';
            }
            break;
        }
    }

    $.get( '/plm/bom-flat', params, function(response) {



        //if(data.bom.root.link.indexOf('/api/v3/workspaces/' + selectedManagedItem.wsId + '/items/' + selectedManagedItem.dmsId) < 0) return;
        if(response.params.link !== params.link) return;


        let counter     = 0;
        let elemTable   = $("#bom-table");

        elemTable.html('');

        for(item of response.data) {
            
            counter++;

            // let icon = (managedItems.indexOf(item.item.urn) < 0) ? '<i class="zmdi zmdi-minus-circle"></i>' : '<i class="zmdi zmdi-check-circle"></i>';
            let icon = (managedItems.indexOf(item.item.urn) < 0) ? '' : '<i class="zmdi zmdi-check-circle"></i>';
                
            // var elemRow = $("<tr></tr>");
            //     elemRow.append('<td class="bom-status"></td>');
            //     elemRow.append('<td>' + icon + '</td>');
            //     elemRow.append(getItemLink(item.item.title, item.item.urn));
            //     elemRow.append('<td>' + item.item.version + '</td>');
            //     elemRow.append('<td>' + item.totalQuantity + '</td>');
            //     elemRow.append('<td>' + item.occurrences.length + '</td>');

            //     for(field of fields) {
            //         let value = '';
            //         for(property of item.occurrences[0].fields) {
            //             if(property.metaData.link === field.link) {
            //                 value = property.value;
            //                 break;
            //             }
            //         }
            //         elemRow.append('<td>' + value + '</td>');
            //     }

            //     elemRow.appendTo(elemTable);
            //     elemRow.attr('data-title', item.item.title);
            //     elemRow.attr('data-link', item.item.link);
            //     elemRow.addClass('bom-item');

            let elemRow = genBOMItem(item, fields);

            elemRow.click(function() {

                if($(this).hasClass('selected')) {                          
                    viewerResetSelection(true);
                    $(this).removeClass('selected');
                } else {

                    let partNumber = $(this).attr('data-part-number');

                    viewerSelectModel(partNumber);

                    $(this).siblings().removeClass('selected');
                    $(this).addClass('selected');
                    
                }

            });
                
        }
        
        // elemTable.prepend('<tr><th></th><th></th><th>Item</th><th>Rev</th><th>Quantity</th><th>Occurences</th>' + columns + '</tr>');
        elemTable.prepend('<tr><th></th><th></th>' + columns + '</tr>');
        
        setCounter("bom", counter);
        $('#overlay').hide();

        getBOMStatus(viewId, fields);

    });

}
function getBOMStatus(viewId, fields) {

    let params = {
        'wsId'          : selectedManagedItem.wsId,
        'dmsId'         : selectedManagedItem.prev,
        'revisionBias'  : 'release',
        'viewId'     : viewId
    }

    if((typeof selectedManagedItem.prev !== 'undefined') && (selectedManagedItem.prev !== '')) {

        $.get( '/plm/bom-flat', params, function(response) {
            // if(data.root.link.indexOf('/api/v3/workspaces/' + selectedManagedItem.wsId + '/items/' + selectedManagedItem.prev) < 0) return;
            if(response.params.dmsId !== params.dmsId) return;
            setBOMStatus(response.data, fields);
        });

    } else {
        setBOMStatus([], fields);
    }

}
function setBOMStatus(listPrevious, fields) {

    bomItemsByStatus = {
        'new'       : [],
        'additional': [],
        'different' : [],
        'match'     : [],
        'removed'   : []
    };

    $('td.bom-status').each(function() {

        let status          = '';
        let isAdditional    = true;
        let isDifferent     = false;
        let isNew           = false;
        let parent          = $(this).closest('tr');
        let link            = parent.attr('data-link');
        let partNumber      = parent.attr('data-part-number');

        for(previous of listPrevious) {

            let prevPartNumber = previous.item.title.split(' - ')[0];

            if(prevPartNumber === partNumber) {


                isAdditional = false;


                if(previous.item.link === link) {
                    if(Number(parent.attr('data-qty')) !== previous.totalQuantity) {
                        isDifferent = true;
                    }
                } else {
                    isDifferent = true;
                }

            } 

            // console.log(previous.item.link);
            // if(previous.item.link === link) {
            //     isAdditional = false;
            // }
        }

        if(isNew) { status = 'new'; bomItemsByStatus.new.push(partNumber);
        } else if(isAdditional) { status = 'additional'; bomItemsByStatus.additional.push(partNumber);
        } else if(isDifferent) { status = 'different'; bomItemsByStatus.different.push(partNumber);
        } else { status = 'match'; bomItemsByStatus.match.push(partNumber); }

        parent.addClass(status);

    });

    for(previous of listPrevious) {

        let isRemoved = true;

        $('tr.bom-item').each(function() {
            let link = $(this).attr('data-link');
            if(link === previous.item.link) {
                isRemoved = false;
            }
        });

        // if(isRemoved) {
        //     let elemItem = genBOMItem(previous, fields);
        //     elemItem.addClass('removed');
        //     console.log(previous);
        //     console.log(previous.title);
        //     bomItemsByStatus.removed.push(previous.title.split(' - ')[0]);
        // }

    }

    $('#bom-status-new').css('flex-grow', bomItemsByStatus.new.length);
    $('#bom-status-additional').css('flex-grow', bomItemsByStatus.additional.length);
    $('#bom-status-different').css('flex-grow', bomItemsByStatus.different.length);
    $('#bom-status-match').css('flex-grow', bomItemsByStatus.match.length);
    $('#bom-status-removed').css('flex-grow', bomItemsByStatus.removed.length);

    //setItemColorsInViewer();

}
function genBOMItem(item, fields) {

    let elemRow = $("<tr></tr>");
    let icon = '';


    for(managedItem of managedItems) {
        if(managedItem.urn === item.item.urn) icon = '<i class="zmdi zmdi-check-circle"></i>';
    }

    // let icon = (managedItems.indexOf(item.item.urn) < 0) ? '' : '<i class="zmdi zmdi-check-circle"></i>';

    elemRow.append('<td class="bom-status"></td>');
    elemRow.append('<td>' + icon + '</td>');
    // elemRow.append(getItemLink(item.item.title, item.item.urn));
    // elemRow.append('<td class="bom-version">' + item.item.version + '</td>');
    // elemRow.append('<td class="bom-quantity">' + item.totalQuantity + '</td>');
    // elemRow.append('<td>' + item.occurrences.length + '</td>');


    for(let field of fields) {
        let value = '';
        for(let property of item.occurrences[0].fields) {
            if(property.metaData.link === field.link) {
                value = property.value;
                break;
            }
        }
        if(field.formulaField) value = decodeHtml(value);
        elemRow.append('<td>' + value + '</td>');
    }

    elemRow.appendTo($("#bom-table"));

    elemRow.attr('data-qty', item.totalQuantity);
    elemRow.attr('data-version', item.item.version);
    elemRow.attr('data-title', item.item.title);
    elemRow.attr('data-part-number', item.item.title.split(' - ')[0]);
    elemRow.attr('data-link', item.item.link);
    
    elemRow.addClass('bom-item');

    return elemRow;

}
function setItemColorsInViewer() {

    viewerResetColors();

    if($('#apply-to-viewer').is(":checked")) {

        viewerSetColors(bomItemsByStatus.new        , { 'resetColors' : false, 'color' : config.colors.red    });
        viewerSetColors(bomItemsByStatus.additional , { 'resetColors' : false, 'color' : config.colors.blue   });
        viewerSetColors(bomItemsByStatus.different  , { 'resetColors' : false, 'color' : config.colors.yellow });
        viewerSetColors(bomItemsByStatus.match      , { 'resetColors' : false, 'color' : config.colors.green  });

    }

}


// [5] Get End Items
function getRootParents() {

    $('#roots-table').find('tbody').children().remove();
   
    $.get('/plm/where-used', { 'link' : selectedManagedItem.link }, function(response) {

        if(response.params.link !==  selectedManagedItem.link) return;

        let counterRoots    = 0;
        let elemTable       = $('#roots-table').find('tbody');
        let urnsRoots       = [];

        if(response.data.hasOwnProperty('edges')) {
            for(let edge of response.data.edges) {

                if(!edge.hasOwnProperty('edgeLink')) {

                    let urn      = edge.child;
                    let temp     = urn.split('.');
                    let edgeWSID = temp[4];
                    let wsTitle  = relatedProperty(edgeWSID, 'title');

                    if(urnsRoots.indexOf(urn) < 0) {

                        if(isRelated(edgeWSID)) {

                            for(let node of response.data.nodes) {
                                if(urn === node.item.urn) {

                                    $.get('/plm/is-archived', { 'link' : node.item.link, 'item' : node.item }, function(response) {

                                        if(response.data === false) insertImpactedItem(response.params.item, wsTitle);

                                    });

                                }
                            }

                            urn = edge.parent;

                        }

                        for(let node of response.data.nodes) {

                            if(node.item.urn === urn) {

                                let lifecycle = '';

                                for(let field of node.fields) {
                                    if(field.title === 'LIFECYCLE') lifecycle = field.value;
                                }

                                let elemItem = $('<td></td>')
                                    .html(node.item.title)
                                    .addClass('tiny')
                                    .addClass('link')
                                    .click(function() {
                                        openItemByURN($(this).closest('tr').attr('data-urn'));
                                    });

                                let elemChildren = $('<td></td>').addClass('roots-column-path');

                                $('<tr></tr>').appendTo(elemTable)
                                    .append('<td class="roots-column-number">' + ++counterRoots + '</td>')
                                    .append(elemItem)
                                    .append('<td class="tiny">' + lifecycle + '</td>')
                                    .append(elemChildren)
                                    .attr('data-urn', urn);

                                getChildren(elemChildren, response.data.edges, response.data.nodes, urn, 1, urn.split('.').pop());

                            }

                        }
                    }

                    urnsRoots.push(urn);
                    
                }
            }
        }

        setImpactedStatus();
        setCounter('roots', counterRoots);
        setCounter('impacted', $('#impacted-tbody').children().length);

    });
    
}
function getChildren(elemChildren, edges, nodes, parent, level, urnPath) {

    urnPath += '.' + parent.split('.').pop();

    for(let edge of edges) {

        if(edge.child === parent) {

            let parentExists = false;

            elemChildren.children().each(function() {
                let childUrn = $(this).attr('data-urn-path');
                if(childUrn == urnPath) parentExists = true;
            });

            if(!parentExists) {

                let elemParent          = $('<div></div>').addClass('parent');
                let elemParentActions   = $('<div></div>').appendTo(elemParent).addClass('parent-actions');
                let elemParentPath      = $('<div></div>').appendTo(elemParent).addClass('parent-path');
                let isConnected         = false;

                elemParent.attr('data-urn', edge.child);
                elemParent.attr('data-urn-path', urnPath);

                for(let managedItem of managedItems) {
                    if(managedItem.urn === edge.child) {
                        isConnected = true;
                        continue;
                    }
                }

                if(isEditable) {
                    if(!isConnected) {

                         $('<div></div>').appendTo(elemParentActions)
                            .addClass('button')
                            .html('Add')
                            .click(function() {
                                $('#overlay').show();
                                let link  = $(this).closest('.parent').attr('data-link');
                                let items = [link];
                                $.get('/plm/add-managed-items', { 'wsId' : wsId , 'dmsId' : dmsId, 'items' : items }, function() {
                                    $('#overlay').hide();
                                    $('.parent').each(function() {
                                        if(link === $(this).attr('data-link')) {
                                            $(this).find('.button').remove();
                                        }
                                    });
                                    getManagedItems();
                                });  
                            });
                    }
                }
                
                for(let i = level - 2; i > 0; i--) { elemParentPath.append('<span class="icon transparent">horizontal_rule</span>'); }

                elemParentPath.append('<span class="icon">subdirectory_arrow_right</span>');

                for(let node of nodes) {
                    if(parent === node.item.urn) {
                        elemParent.attr('data-link', node.item.link);
                        elemParentPath.append(node.item.title);
                        elemParentPath.click(function() {
                            openItemByURN($(this).parent().attr('data-urn'));
                        });
                    }
                }

                if(level   > 1) elemChildren.append(elemParent);
                if(level === 2) elemParent.addClass('top');

            }

            getChildren(elemChildren, edges, nodes, edge.parent, level + 1, urnPath);

        }
    }

}
function isRelated(id) {

    for(let workspace of relatedWorkspaces) {
        if(workspace.wsId === id) return true;
    }

    return false;

}
function relatedProperty(id, property) {

    for(let workspace of relatedWorkspaces) {
        if(workspace.wsId === id) return workspace[property];
    }

    return '';

}
function getImpactedRelationships() {

    $.get('/plm/relationships', { 'link' : selectedManagedItem.link }, function(response) {

        if(response.params.link  !== selectedManagedItem.link) return;

        for(let relationship of response.data) {
            insertImpactedItem(relationship.item, relationship.workspace.title);
        }
        
        $('#overlay').hide();
        
    });
    
}
function insertImpactedItem(item, workspace) {

    let elemTableBody = $('#impacted-tbody');
    let itemWSID      = item.link.split('/')[4];
    let itemDMSID     = item.link.split('/')[6];

    if(isRelated(itemWSID)) {

        let elemTitle = $('<td></td>')
            .addClass('link')
            .addClass('tiny')
            .html(item.title)
            .click(function() {
                openItemByURN($(this).closest('tr').attr('data-urn'));
            });

        let elemStatus  = $('<td class="impacted-status tiny"><span class="icon">link</span></td>');
        let elemInput   = $('<td></td>').html('<input class="rel-desc" value="">');
        let elemActions = $('<td></td>').addClass('impacted-actions');

        if(!isEditable) {

            elemInput.html('<input disabled class="rel-desc" value="">');

        } else {

            $('<div></div>').appendTo(elemActions)
                .addClass('button')
                .addClass('default')
                .addClass('impacted-connect')
                .html('Connect')
                .click(function() {
                    addRelationship($(this));
                });
                
            $('<div></div>').appendTo(elemActions)
                .addClass('button')
                .addClass('impacted-disconnect')
                .html('Disconnect')
                .click(function() {
                    removeRelationship($(this));
                });

            $('<div></div>').appendTo(elemActions)
                .addClass('button')
                .addClass('impacted-update')
                .html('Update')
                .click(function() {
                    updateRelationship($(this));
                });
        
        }

        $('<tr></tr>').appendTo(elemTableBody)
            .attr('data-id', itemDMSID)
            .attr('data-urn', item.urn)
            .addClass('impacted-item')
            .append(elemStatus)
            .append('<td class="tiny">' + workspace + '</td>')
            .append(elemTitle)
            .append(elemInput)
            .append(elemActions);

        setImpactedStatus();
        setCounter('impacted', $('#impacted-tbody').children().length, true);

    }
}


// [6] Manage Relationships
function addRelationship(elemButton) {

    $('#overlay').show();

    let elemRow = elemButton.closest('tr');
    let description = elemRow.find('input').first().val();

    let params = {
        'wsId'          : wsId, 
        'dmsId'         : dmsId,
        'relatedId'     : elemRow.attr('data-id'),
        'description'   : description,
        'type'          : 'bi'
    }

    $.get('/plm/add-relationship', params, function() {
        getRelationships(function() {
            setImpactedStatus();
            $('#overlay').hide();
        });
    });

}
function removeRelationship(elemButton) {

    $('#overlay').show();

    let urn  = elemButton.closest('tr').attr('data-urn');
    let link = '';

    for(relatedItem of relatedItems){
        if(relatedItem.urn === urn) {
            link = relatedItem.link;
            break;
        }
    }

    if(link === '') return;

    $.get('/plm/remove-relationship', { 'link' : link }, function() {
        getRelationships(function() {
            setImpactedStatus();
            $('#overlay').hide();
        });
    });

}
function updateRelationship(elemButton) {

    $('#overlay').show();

    let urn  = elemButton.closest('tr').attr('data-urn');
    let desc = elemButton.closest('tr').find('input').val();
    let link = '';

    for(relatedItem of relatedItems){
        if(relatedItem.urn === urn) {
            link = relatedItem.link;
            break;
        }
    }

    if(link === '') return;

    $.get('/plm/update-relationship', { 'link' : link, 'description' : desc }, function() {
        getRelationships(function() {
            setImpactedStatus();
            $('#overlay').hide();
        });
    });

}
function setImpactedStatus() {

    $('.impacted-item').each(function() {
        
        let urn         = $(this).attr('data-urn');
        let className   = 'disconnected';
        let description = '';

        for(relatedItem of relatedItems) {
            if(relatedItem.urn === urn) {
                className = 'connected';
                description = relatedItem.description;
                break;
            }
        }

        $(this).removeClass('disconnected');
        $(this).removeClass('connected');
        $(this).addClass(className);
        $(this).find('input').val(description);

    });

}


// [7] Get related changed items
function getRelated() {
    
    $.get('/plm/related-items', { 'link' : selectedManagedItem.link, 'relatedWSID' : wsId }, function(response) {

        if(response.params.link  !== selectedManagedItem.link) return;

        let elemList  = $('#related-list').html('');

        $('#related-counter').html('');
        $('#related-counter').parent().removeClass('counter-done').removeClass('counter-none').addClass('counter-work');

        for(let relatedItem of response.data) {
            
            let elemItem = $('<div></div>').appendTo(elemList)
                .attr('data-title', relatedItem.title)
                .attr('data-part-number', relatedItem.title.split(' - ')[0])
                .attr('data-link', relatedItem.link)
                .addClass('changed-item')
                .click(function() {
                    $(this).toggleClass('selected');
                    if($(this).hasClass('selected')) {
                        viewerSelectModel($(this).attr('data-part-number'), {
                            isolate     : true,
                            ghosting    : false,
                            fitToView   : false,
                            highlight   : true,
                            resetColors : true
                        });
                    } else {
                        viewerResetSelection(true);
                    }
                });

            $('<div></div>').appendTo(elemItem).addClass('changed-item-title' ).html(relatedItem.title);
            $('<div></div>').appendTo(elemItem).addClass('changed-item-detail').html(relatedItem.lifecycle);
            $('<div></div>').appendTo(elemItem).addClass('changed-item-detail').html(relatedItem.version);
                
        }
            
        setCounter('related', response.data.length);

        if(isEditable) {
            $('#related-actions').css('display', 'flex');
        }

        $('#overlay').hide();
        
    });
    
}
function addManagedItem(all) {

    let selectedManagedItem;
    let items = [];

    for(managedItem of managedItems) {
        if(managedItem.urn === selectedURN) selectedManagedItem = managedItem;
    }

    $('.changed-item').each(function() {
        if(all === true || $(this).hasClass('selected')) items.push($(this).attr('data-link'));
    })

    if(items.length === 0) return;

    $('#overlay').show();

    $.get('/plm/add-managed-items', { 'wsId' : wsId , 'dmsId' : dmsId, 'items' : items }, function() {
        getRelated();
        getManagedItems();
    });    

}


// [8] Get item attachments
function getAttachments() {

    let promises = [ $.get('/plm/attachments', { 'link' : selectedManagedItem.link }) ];
    
    if(selectedManagedItem.prevLink !== '') promises.push($.get('/plm/attachments', { 'link' : selectedManagedItem.prevLink }));

    Promise.all(promises).then(function(responses) {

        let response = responses[0];

        if(response.params.link !== selectedManagedItem.link) return;

        let elemTable   = $('#attachments-table').find('tbody');

        for(attachment of response.data) {
            
            let timeStamp   = new Date(attachment.created.timeStamp);
            let description = (typeof attachment.description === 'undefined') ? '' : attachment.description;
            let elemIcon    = $('<td class="tiny"></td>').append(getFileGrahpic(attachment));
            let status      = 'New';
            let className   = 'status-new';

            if(responses.length > 1) {
                for(prevAttachment of responses[1].data) {
                    if(prevAttachment.name === attachment.name) {
                        if(attachment.version === 1) {
                            status = 'Changed';
                            className = 'status-changed'
                        }
                    }
                }
            }
            
            let elemRow = $('<tr></tr>');
                elemRow.append(elemIcon);
                elemRow.append('<td>' + attachment.name + '</td>');
                // elemRow.append('<td>' + attachment.resourceName + '</td>');
                elemRow.append('<td class="' + className + '">' + status + '</td>');
                elemRow.append('<td class="tiny align-right">' + attachment.version + '</td>');
                elemRow.append('<td class="tiny">' + timeStamp.toLocaleString() + '</td>');
                elemRow.append('<td class="tiny">' + attachment.created.user.title + '</td>');
                elemRow.append('<td class="tiny">' + description + '</td>');
                elemRow.append('<td class="tiny">' + attachment.type.fileType + '</td>');
                elemRow.appendTo(elemTable);
                elemRow.addClass('link');
                elemRow.attr('data-url', attachment.url);
                elemRow.click(function() {
                    window.open($(this).attr('data-url'));
                });
                
        }

        setCounter('attachments', response.data.length);

    });
    
}


// [9] Get related Change Processes
function getChangeProcesses() {

    $.get('/plm/changes', { 'link' : selectedManagedItem.link }, function(response) {
        
        if(response.params.link !== selectedManagedItem.link) return;

        let elemTable = $('#changes-table').find('tbody');
        
        for(let process of response.data) {
         
            let dateCreate = new Date(process['first-workflow-history'].created);
            let dateUpdate = new Date(process['last-workflow-history'].created);           

            $('<tr></tr>').appendTo(elemTable)
                .append('<td>' + process.item.title + '</td>')
                .append('<td class="tiny">' + process['workflow-state'].title + '</td>')
                .append('<td class="tiny">' + dateCreate.toLocaleString() + '</td>')
                .append('<td>' + process['last-workflow-history'].user.title + '</td>')
                .append('<td class="tiny">' + dateUpdate.toLocaleString() + '</td>')
                .append('<td>' + process['first-workflow-history'].user.title + '</td>')
                .addClass('link')
                .attr('data-urn', process.item.urn)
                .click(function() {
                    openItemByURN($(this).attr('data-urn'));
                });
                
        }
        
        setCounter('changes', response.data.length);
        
    });  

}


// [10] Get ERP Production Orders
function getProductionOrders() {

    let elemTable = $('#orders-table').find('tbody');
        elemTable.html('');
        
    for(let order of selectedManagedItem.productionOrders) {
         
        var date = new Date(order.date);

        $('<tr></tr>').appendTo(elemTable)
            .append('<td>' + order.id + '</td>')
            .append('<td>' + order.site + '</td>')
            .append('<td>' + order.qty + '</td>')
            .append('<td>' + date.toLocaleDateString() + '</td>');
                
    }
        
    setCounter('orders', selectedManagedItem.productionOrders.length);

}