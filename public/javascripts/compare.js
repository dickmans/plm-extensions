let sections, fields, details;
let urnPartNumber = '';
let urns = {
    'partNumber' : '', 'isSparePart' : '', 'sparePart' : '', 'maintenanceKit' : '', 'title' : '', 'description' : '', 'dimensions' : '', 'mass' : ''
}

let viewer1, viewer2, viewer3;
// let viewer1 = new Autodesk.Viewing.GuiViewer3D(document.getElementById('viewer-master'));
// let viewer2 = new Autodesk.Viewing.GuiViewer3D(document.getElementById('viewer-compare'));


let viewables = [];



// const MultipleModelAlignmentType = {
//     CenterToCenter: 1,
//     OriginToOrigin: 2,
//     ShareCoordinates: 3,
//     Custom: 4
//   };

$(document).ready(function() {
    
    let link = '/api/v3/workspaces/' + wsId + '/items/' + dmsId;

    setUIEvents();

    getTabs();
    setViewer();
    getDetails();
    getAttachments();
    getLog(link, 'log-list-left');
    getHistory();
    // setSingleViewer();
    
});

function setUIEvents() {

    $('.tab').click(function() {
        $(this).addClass('selected');
        $(this).siblings().removeClass('selected');
        $('.content').hide();
        $('#' + $(this).attr('data-id')).show();
    });

    $('.tab').first().click();


    // Header Toolbar
    // $('#button-settings').click(function() {
    //     $('#overlay').fadeIn();
    //     $('#options').fadeIn();
    // });
    // $('#submit-request').click(function() {
    //     $('#request').fadeIn();
    //     $('#overlay').fadeIn();
    //     setRequestList();
    // });
    // $('.dialog-close').click(function() {
    //     $('#overlay').fadeOut();
    //     $('.dialog').fadeOut();
    // });
    // $('#options-done').click(function() {
    //     $('#overlay').fadeOut();
    //     $('.dialog').fadeOut();
    // });


    // // Option Toggles
    // $('#toggle-bom').click(function() {
    //     $('body').toggleClass('no-bom');
    //     viewer.resize();
    // })
    // $('#toggle-items').click(function() {
    //     $('body').toggleClass('no-items');
    //     viewer.resize();
    // })
    // $('#toggle-details').click(function() {
    //     $('body').toggleClass('with-details');
    //     viewer.resize();
    // })
    // $('#toggle-attachments').click(function() {
    //     $('body').toggleClass('no-attachments');
    //     viewer.resize();
    // })


    // // Submit Request Dialog functions
    // $('#request-submit').click(function() {
        
    //     $('#request').fadeOut();
        
    //     let params = {
    //         'wsId'     : wsIdRequests,
    //         'sections' : [
    //             {
    //                 'id'        : sectionIdRequests,
    //                 'fields'    : [{
    //                     'fieldId'   : 'LINKED_ITEM',
    //                     'value'     : { 'link' : '/api/v3/workspaces/' + wsId + '/items/' + dmsId },
    //                     'type'      : 'picklist'
    //                 },{
    //                     'fieldId'   : 'COMMENTS',
    //                     'value'     : $('#comments').val(),
    //                     'type'      : 'string'
    //                 }]
    //             }
    //         ]
    //     } 

    //     console.log(params);

    //     $.post({
    //         url         : '/plm/create', 
    //         contentType : "application/json",
    //         data        : JSON.stringify(params)
    //     }, function(response) {
    
    //         console.log(response);

    //         if(!response.error) {

    //             $('.request-item').each(function() {

    //                 let link     = $(this).parent().attr('data-link');
    //                 let quantity = $(this).next().children().first().val();

    //                 let params = {
    //                     'wsId' : wsIdRequests,
    //                     'link' : response.data.split('.autodeskplm360.net')[1],
    //                     'data' : [
    //                         { 'fieldId' : 'ITEM', 'value' : { 'link' : link } },
    //                         { 'fieldId' : 'QUANTITY', 'value' : quantity }
    //                     ]
    //                 }
                    
    //                 console.log(params);

    //                 $.get('/plm/add-grid-row', params, function(response) {
    //                     console.log(response);
    //                 });


    //             });


    //         }

    //         $('#overlay').fadeOut();
    //         $('.spare-part.checked').each(function() { $(this).click(); });
    //         // callback(response);
    
    //         // if(idDialog === 'create-project') {
    //         //     console.log('link to open projcéct : ' + data);
    //         //     openProject(data);
    //         // } else {
    
    //         // }
    //     });

    // });
    // $('#request-cancel').click(function() {
    //     $('#request').fadeOut();
    //     $('#overlay').fadeOut();
    // });


}



function getViewables() {

    $('#viewer').html('')

    //$.get( '/plm/get-viewable', { 'link' : link }, function(response) {
    $.get( '/plm/list-viewables', { 'wsId' : wsId, 'dmsId' : dmsId }, function(response) {

        if(response.params.link !== link) return;

        if(response.data.length > 0) {

            $('#item-button-view').show().click();

            // $('body').removeClass('no-viewer');
            // $('#header-actions').show();

            let viewLink = response.data[0].selfLink;

            $.get( '/plm/get-viewable', { 'link' : viewLink } , function(response) {
                if(response.params.link !== viewLink) return;
                $('#viewer').show();
                initViewer(response.data, 255);
            });

        }

    });

}
function initViewerDone() {

    console.log('sdfsd');

    console.log(viewer);
    console.log(inst);

    viewer = inst;
    // alert('10');
    // alert($('#viewer').length);
    // $('#viewer').show();
    // $('#viewer').css('z-index', '10000');
}
function onSelectionChanged(event) {}




// Set tab labels and visibility
function getTabs() {

    $.get('/plm/tabs', { 'wsId' : wsId}, function(response) {
    
        for(tab of response.data) {

            switch(tab.workspaceTabName) {

                case 'ITEM_DETAILS':
                    setTab('tab-item-details', tab);
                    break;
                    
                case 'PART_ATTACHMENTS':
                    setTab('tab-files', tab);
                    break;

                case 'BOM_LIST':
                    setTab('tab-bom', tab);
                    break;

                case 'PART_HISTORY':
                    setTab('tab-log', tab);
                    break;

            }

        }
        
    });

}
function setTab(id, tab) {

    let label = (tab.name === null) ? tab.key : tab.name;

    $('#' + id).show();
    $('#' + id).html(label);

}


// Retrieve workspace configuration settings
function getDetails() {

    let promises = [
        $.get('/plm/sections', { 'wsId' : wsId }),
        $.get('/plm/fields', { 'wsId' : wsId }),
        $.get('/plm/details', { 'wsId' : wsId, 'dmsId' : dmsId }),
        $.get('/plm/bom-views-and-fields', { 'wsId' : wsId })
    ];

    Promise.all(promises).then(function(responses) {

        // for(view of responses[0].data) {
        //     if(view.name === 'Spare Parts') {
        //         viewId = view.id;
        //     }
        // }

        // getBOMData(viewId);

        sections  = responses[0].data;
        fields    = responses[1].data;
        details   = responses[2].data;

        $('#header-subtitle').html(details.title);

        setItemDetails();

    });

}
function setItemDetails() {

    let elemParent = $('#details-list');
        elemParent.html('');
    
    $('#details-process').hide();

    insertItemDetails(elemParent, sections, fields, details, false, false, false);

}
function getAttachments() {
    
    $('#files-process').show();

    let elemParent = $('#files-list');
        elemParent.html('');

    $.get( '/plm/attachments', { 'wsId' : wsId, 'dmsId' : dmsId }, function(response) {
        let counter = insertAttachments(elemParent, response.data);
        // if(counter > 0) $('#files-counter').show(); else $('#files-counter').hide();
        // $('#files-counter').html(counter);
        $('#files-process').hide();
    });

}
function getLog(link, id) {

    let elemParent = $('#' + id);
        elemParent.html('');

    $('#log-process').show();

    $.get('/plm/logs', { 'link' : link }, function(response) {
        
        for(log of response.data) {

            let timeStamp = new Date(log.timeStamp);
            let description = log.description;

            if(description === null) {
                description  = log.details[0].fieldName + ' changed from<br/>';
                description += log.details[0].oldValue + '<br/>';
                description += 'to<br/>';
                description += log.details[0].newValue + '<br/>';
            }

            let elemChange = $('<div></div>');
                elemChange.appendTo(elemParent);

            let elemChangeDetails = $('<div></div>');
                elemChangeDetails.addClass('change-log-details');
                elemChangeDetails.appendTo(elemChange);

            let elemChangeDate = $('<div></div>');
                elemChangeDate.addClass('change-log-date');
                elemChangeDate.html(timeStamp.toDateString());
                elemChangeDate.appendTo(elemChangeDetails);

            let elemChangeUser = $('<div></div>');
                elemChangeUser.addClass('change-log-user');
                elemChangeUser.html(log.user.title);
                elemChangeUser.appendTo(elemChangeDetails);

            let elemChangeAction = $('<div></div>');
                elemChangeAction.addClass('change-log-action');
                elemChangeAction.html(log.action.shortName);
                elemChangeAction.appendTo(elemChange);

            let elemChangeDescription = $('<div></div>');
                elemChangeDescription.addClass('change-log-description');
                elemChangeDescription.html(description);
                elemChangeDescription.appendTo(elemChange);
                
        }

        $('#log-process').hide();
        
    });

}


// Get item version history
function getHistory() {

    let elemProcess = $('#versions-process');
        elemProcess.show();
    
    let elemParent = $('#versions-list');
        elemParent.html('');

    $.get('/plm/versions', { 'wsId' : wsId, 'dmsId' : dmsId }, function (response) {
        
        console.log(response);

        for(version of response.data.versions) {

            let versionLabel = (version.hasOwnProperty('version')) ? version.version : '';
            let versionStart = (version.effectivity.hasOwnProperty('startDate')) ? version.effectivity.startDate : '';

            let elemVersion = $('<div></div>');
                elemVersion.addClass('item-version');
                elemVersion.attr('data-link', version.item.link);
                elemVersion.appendTo(elemParent);
                elemVersion.click(function() {
                    if(!$(this).hasClass('selected')) selectVersion($(this).attr('data-link'));
                    $('.item-version').removeClass('selected');
                    $(this).addClass('selected');  
                });

            let elemVersionDescriptor = $('<div></div>');
                elemVersionDescriptor.addClass('item-version-descriptor');
                elemVersionDescriptor.html(version.item.title);
                elemVersionDescriptor.appendTo(elemVersion);

            let elemVersionStatus = $('<div></div>');
                elemVersionStatus.addClass('item-version-status');
                elemVersionStatus.html(version.status);
                elemVersionStatus.appendTo(elemVersion);

            let elemVersionNumber = $('<div></div>');
                elemVersionNumber.addClass('item-version-number');
                elemVersionNumber.html(version.versionNumber);
                elemVersionNumber.appendTo(elemVersion);

            let elemVersionLabel = $('<div></div>');
                elemVersionLabel.addClass('item-version-label');
                elemVersionLabel.html(versionLabel);
                elemVersionLabel.appendTo(elemVersion);

            let elemVersionLifecycle = $('<div></div>');
                elemVersionLifecycle.addClass('item-version-lifecycle');
                elemVersionLifecycle.html(version.lifecycle.title);
                elemVersionLifecycle.appendTo(elemVersion);

            let elemVersionStart = $('<div></div>');
                elemVersionStart.addClass('item-version-start');
                elemVersionStart.html(versionStart);
                elemVersionStart.appendTo(elemVersion);

        }

        elemProcess.hide();

    });

}
function selectVersion(link) {

    console.log(link);

    getLog(link, 'log-list-right');


    $('#overlay').show();

    $.get('/plm/details', { 'link' : link }, function(response) {

        $('.side').remove();

        $('.field').each(function() {

            let elemField = $(this);
            let fieldId = elemField.find('.field-value').attr('data-id');
            let value = getFieldValue(response.data.sections, fieldId, '');

            let elemValue = $('<div></div>');
                elemValue.addClass('side');
                elemValue.html(value);
                elemValue.appendTo(elemField);

            let elemComparison = $('<div></div>');
                elemComparison.addClass('side');
                elemComparison.appendTo(elemField);

        });

        $('#overlay').hide();


    });


    updateViewer(link);



}
function getFieldValue(sections, fieldId, defaultValue) {

    for(section of sections) {
        for(field of section.fields) {
            let id = field.urn.split('.')[9];
            if(id === fieldId) {
                return field.value;
            }

        }
    }

    return defaultValue;

}




function updateViewer(link) {

    document.getElementsByClassName('adsk-viewing-viewer')[0].style.height = '800px'
    document.getElementsByClassName('adsk-viewing-viewer')[0].style.width = '1400px'

    $.get( '/plm/list-viewables', { 'link' : link }, function(response) {

        console.log(response);

        if(response.data.length > 0) {

            for(viewable of response.data) {

                let resourceName = viewable.resourceName;

                if(resourceName.indexOf('.iam.dwf') > 0) {
                    $.get( '/plm/get-viewable', { 'link' : viewable.selfLink } , function(response) {        
                        addToViewer(response.data);
                    });
                }

            }

        }

    });
    
};


function addToViewer(data) {

    // console.log(data);

    // if(index < documents.length) {
        
        // Autodesk.Viewing.Initializer({accessToken: accessToken}, function() {
            Autodesk.Viewing.Document.load('urn:' + data.urn, function(document) {

                // console.log(document);
                // console.log(document.getRoot());
                // // console.log(document.getPropertyDbPath());


                // console.log('aha');

                // var rootItem = document.getRootItem();
                // var geometryItems3d = Autodesk.Viewing.Document.getSubItemsWithProperties(
                //     rootItem, {
                //         'type': 'geometry',
                //         'role': '3d' },    
                //     true);
                
                // var pathCollection = [];
                
                // geometryItems3d.forEach((item)=>{
                //     pathCollection.push(document.getViewablePath(item));
                // });
                
                var loadOptions = {
                    keepCurrentModels : true,
                    // globalOffset: {x:0, y:0, z:0},
                    applyRefPoint: true,
                    // modelNameOverride: name,
                    applyScaling: 'mm'
                    // placementTransform: mat , 
                    // globalOffset:{x:0,y:0,z:0}
                    // sharedPropertyDbPath: document.getPropertyDbPath()
                };
                
                // var mat = new THREE.Matrix4();
                // viewer.loadModel(pathCollection[0], loadOptions, function() {
                //     loadNext();
                // });


                const rootItem = document.getRoot();
                const filter = { type: 'geometry', role: '3d' };
                const viewables = rootItem.search(filter);

                if (viewables.length === 0) {
                  return onLoadModelError('Document contains no viewables.');
                }

                const bubble = viewables[0];

                viewer.loadDocumentNode(document, bubble, loadOptions).then(modelDiff);

  



                
            });
        // });
        
    // }
}

function modelDiff() {

    var extensionConfig = {
        'mimeType' : 'application/vnd.autodesk.inventor.assembly',
        'primaryModels' : [viewer.getVisibleModels()[0]],
        'diffModels' : [viewer.getVisibleModels()[1]],
        // 'diffMode' : 'overlay',
        'diffMode' : 'sidebyside',
        'versionA' : '2',
        'versionB' : '1'
    }

    viewer.loadExtension('Autodesk.DiffTool', extensionConfig).then(function (res) {
        //window.DIFF_EXT = viewer.getExtension('Autodesk.DiffTool');
        //console.log(window.DIFF_EXT);
    }).catch(function (err) {
        console.log(err);
    });

} 






// Get viewable and init Forge viewer
function setViewer() {
    $.get('/plm/get-viewables', { 'wsId' : wsId, 'dmsId' : dmsId }, function(response) {

        if(response.data.length > 0) {

            let found = false;

            for(viewable of response.data) {
                if(viewable.name.indexOf('.iam.dwf') > -1) {
                    initViewer(viewable, 255, 'viewer');
                    // initViewer2(viewable, 255, 'viewer-compare');
                    found = true;
                    break;
                }
            }

            if(!found) initViewer(response.data[0], 255, 'viewer');

        }


    });




}
function onSelectionChanged(event) {

    let found = false;

    if (event.dbIdArray.length === 1) {


        viewer.getProperties(event.dbIdArray[0], function(data) {

            for(property of data.properties) {

                if(partNumberProperties.indexOf(property.displayName) > -1) {

                    let partNumber = property.displayValue;

                    $('tr').each(function() {

                        console.log(' >>> ' + $(this).attr('data-part-number'));

                        if(!found) {

                            if($(this).attr('data-part-number') === partNumber) {
                                found = true;
                                $(this).click();
                            }
                        }
        
                    });

                }

            }

        });

    }

}
function initViewerDone() {}







// Retrieve Workspace Details, BOM and details
function getBOMData(viewId) {

    let params = {
        'wsId'          : wsId,
        'dmsId'         : dmsId,
        'depth'         : 10,
        'revisionBias'  : 'release',
        'viewId'        : viewId
    }

    let promises = [
        $.get('/plm/bom-view-fields', params),
        $.get('/plm/bom', params)
    ];

    Promise.all(promises).then(function(responses) {
        setBOMData(responses[0].data, responses[1].data);
    });

}
function setBOMData(fields, bom) {

    let elemRoot = $('#bom-tree');
        elemRoot.html('');

    for(field of fields) {
    
             if(field.fieldId === 'NUMBER')          urns.partNumber     = field.__self__.urn;
        else if(field.fieldId === 'IS_SPARE_PART')   urns.isSparePart    = field.__self__.urn;
        else if(field.fieldId === 'SPARE_PART')      urns.sparePart      = field.__self__.urn;
        else if(field.fieldId === 'MAINTENANCE_KIT') urns.maintenanceKit = field.__self__.urn;
        else if(field.fieldId === 'TITLE')           urns.title          = field.__self__.urn;
        else if(field.fieldId === 'DESCRIPTION')     urns.description    = field.__self__.urn;
        else if(field.fieldId === 'DIMENSIONSSIZE')  urns.dimensions     = field.__self__.urn;
        else if(field.fieldId === 'MASS')            urns.mass           = field.__self__.urn;

    }

    insertNextBOMLevel(bom, elemRoot, 'urn:adsk.plm:tenant.workspace.item:' + tenant.toUpperCase() + '.' + wsId + '.' + dmsId);

    $('.spare-part').click(function() {
        $(this).toggleClass('checked');
        updateCounter();
    });

    $('#items-process').hide();


    // setSparePartsList();

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

                        let elemToggle = elemNext.children().first().find('i.bom-nav');

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

    $('tr').click(function() {

        

        if($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            resetViewerSelection(true);
            setAttachments('/api/v3/workspaces/' + wsId + '/items/' + dmsId);
            setSparePartsList();
            //$('body').removeClass('with-details');
        } else {
            viewerResetColors();
            $('tr.selected').removeClass('selected');
            $(this).addClass('selected');
            setItemDetails($(this).attr('data-link'));
            setAttachments($(this).attr('data-link'));
            viewerSelectModel($(this).attr('data-part-number'), true);
            setSparePartsList($(this));
        }
        
    });

}
function insertNextBOMLevel(bom, elemRoot, parent) {

    let result = false;

    for(edge of bom.edges) {

        if(edge.parent === parent) {

            result = true;

            let isSparePart = getBOMCellValue(edge.child, urns.isSparePart, bom.nodes);
            let partNumber = getBOMCellValue(edge.child, urns.partNumber, bom.nodes);
            let link = getBOMNodeLink(edge.child, bom.nodes);

            let elemRow = $('<tr></tr>');
                elemRow.attr('data-number', edge.itemNumber);
                elemRow.attr('data-part-number', partNumber);
                elemRow.attr('data-is-spare-part', isSparePart);
                elemRow.attr('data-spare-part', getBOMCellValue(edge.child, urns.sparePart, bom.nodes));
                elemRow.attr('data-maintenance-kit', getBOMCellValue(edge.child, urns.maintenanceKit, bom.nodes));
                elemRow.attr('data-qty', '1');
                elemRow.attr('data-status', 'match');
                elemRow.appendTo(elemRoot);
    
            if(isSparePart === 'Yes') {
                elemRow.addClass('is-spare-part');
                if(listSpareParts.indexOf(edge.child) === -1) {
                    
                    listSpareParts.push(edge.child);

                    let elemSparePart = $('<div></div>');
                        elemSparePart.addClass('spare-part');
                        elemSparePart.attr('data-link', link);
                        elemSparePart.attr('data-part-number', partNumber);
                        elemSparePart.appendTo($('#items-list'));

                    let elemSparePartCheckEmpty = $('<i></i>');
                        elemSparePartCheckEmpty.addClass('spare-part-check');
                        elemSparePartCheckEmpty.addClass('zmdi');
                        elemSparePartCheckEmpty.addClass('zmdi-square-o');
                        elemSparePartCheckEmpty.appendTo(elemSparePart);

                    let elemSparePartCheck = $('<i></i>');
                        elemSparePartCheck.addClass('spare-part-check');
                        elemSparePartCheck.addClass('zmdi');
                        elemSparePartCheck.addClass('zmdi-check-square');
                        elemSparePartCheck.appendTo(elemSparePart);

                    let elemSparePartNumber = $('<div></div>');
                        elemSparePartNumber.addClass('spare-part-number');
                        elemSparePartNumber.html(getBOMCellValue(edge.child, urns.partNumber, bom.nodes));
                        elemSparePartNumber.appendTo(elemSparePart);
                    
                    let elemSparePartTitle = $('<div></div>');
                        elemSparePartTitle.addClass('spare-part-title');
                        elemSparePartTitle.html(getBOMCellValue(edge.child, urns.title, bom.nodes));
                        elemSparePartTitle.appendTo(elemSparePart);
                    
                    let elemSparePartDescription = $('<div></div>');
                        elemSparePartDescription.html(getBOMCellValue(edge.child, urns.description, bom.nodes));
                        elemSparePartDescription.appendTo(elemSparePart);
                    
                    let elemSparePartDimensions = $('<div></div>');
                        elemSparePartDimensions.html(getBOMCellValue(edge.child, urns.dimensions, bom.nodes));
                        elemSparePartDimensions.appendTo(elemSparePart);
                    
                    let elemSparePartWeight = $('<div></div>');
                        elemSparePartWeight.html(getBOMCellValue(edge.child, urns.mass, bom.nodes));
                        elemSparePartWeight.appendTo(elemSparePart);

                    let elemSparePartShowMe = $('<div></div>');
                        elemSparePartShowMe.addClass('button');
                        elemSparePartShowMe.html('Show Me');
                        elemSparePartShowMe.appendTo(elemSparePart);
                        elemSparePartShowMe.click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            let elemSelected = $(this).closest('.spare-part');
                            let link = elemSelected.attr('data-link');
                            viewerResetColors();
                            viewerSelectModel(elemSelected.attr('data-part-number'), true);
                            $('#bom-tree').children().each(function() {
                                if($(this).attr('data-link') === link) $(this).addClass('selected'); else $(this).removeClass('selected');
                            });
                        });




                }
            }

            for(node of bom.nodes) {
                if(node.item.urn === edge.child) {
                    elemRow.attr('data-dmsId',      node.item.link.split('/')[6]);
                    elemRow.attr('data-link',       node.item.link);
                    elemRow.attr('data-edgeId',     edge.edgeId);
                    elemRow.attr('data-edgeLink',   edge.edgeLink);
                    elemRow.attr('data-level',      edge.depth);
                    elemRow.addClass('bom-level-' + edge.depth);
                }
            }

            // for(key of keysMaster) {
            //     let elemCell = $('<td></td>');
            //         elemCell.appendTo(elemRow);
            //         elemCell.html(getBOMCellValue(edge.child, key, bom.nodes));
            // }

            // console.log(edge);
            // console.log(bom.nodes);

            let elemCell = $('<td></td>');
                    elemCell.appendTo(elemRow);
                    elemCell.html(getBOMItem(edge.child, bom.nodes));

            // let elemCellStatus = $('<td></td>');
            //     elemCellStatus.addClass('cell-status');
            //     elemCellStatus.appendTo(elemRow);

            // for(key of keysVariant) {

            //     let elemCell = $('<td></td>');
            //         elemCell.addClass('cell-variant');
            //         elemCell.appendTo(elemRow);

            //     let elemInput = $('<input>');
            //         elemInput.attr('data-value', '');
            //         elemInput.appendTo(elemCell);
            //         elemInput.keypress(function (e) {
            //             updateValue($(this), e);
            //         });

            // }

            let hasChildren = insertNextBOMLevel(bom, elemRoot, edge.child);

            elemRow.children().first().each(function() {
                
                $(this).addClass('bom-first-col');

                if(hasChildren) {

                    let elemNav = $('<i></i>');
                        elemNav.addClass('bom-nav');
                        elemNav.addClass('zmdi');
                        elemNav.addClass('expanded');
                        elemNav.prependTo($(this));

                    elemRow.addClass('node');

                }

            });

        }

    }

    return result;


}
// function getBOMItemLink(id, nodes) {

//     for(node of nodes) {
//         if(node.item.urn === id) {
//             return node.item.link;
//         }
//     }

//     return '';
    
// }
function getBOMItem(id, nodes) {

    for(node of nodes) {
        if(node.item.urn === id) {
            return node.item.title;
        }
    }

    return '';
    
}
function getBOMCellValue(id, key, nodes) {

    for(node of nodes) {
        if(node.item.urn === id) {
            for(field of node.fields) {
                if(field.metaData.urn === key) {

                    if(typeof field.value !== 'undefined') {
                        if(key === urns.isSparePart) return field.value.title;
                        else return field.value;
                    } else {
                        return '';
                    }

                }
            }
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
function updateValue(elemInput, e) {

    if (e.which == 13) {
    
        if(elemInput.attr('data-value') !== elemInput.val()) {
            elemInput.parent().addClass('changed');
            elemInput.closest('tr').attr('data-status', 'changed');
            updateStatusBar();
        }
    
    }


}
function updateCounter() {

    let count = $('.spare-part.checked').length; 

    $('#counter').html(count);

    if(count === 0) {
        $('#counter').hide();
    } else {
        $('#counter').show();
    }

}

