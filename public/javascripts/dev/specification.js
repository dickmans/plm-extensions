let fields, sections;
let listSpareParts  = [];
let listWearParts   = [];
let link            = '/api/v3/workspaces/' + wsId + '/items/' + dmsId;
let urns = {
    'thumbnail'     : '', 
    'partNumber'    : '', 
    'title'         : '', 
    'description'   : '', 
    'spareWearPart' : '', 
    'material'      : '', 
    'mass'          : '',
    'dimensions'    : ''
}

let paramsAttachments = { 'layout' : 'list', upload : true};

let edit = true;


let ebom, flatEBOM, ebomFields;
let selectedBOMContext      = '';
let wsProblemReports        = { 'id' : '', 'sections' : [], 'fields' : [] };
let wsConfig = {
    'sensors' : {
        'wsId' : 341,
        'pending' : true
    },
    'actors' : {
        'wsId' : 374,
        'pending' : true
    },
    'motors' : {
        'wsId' : 340,
        'pending' : true
    },
    'cylinders' : {
        'wsId' : 376,
        'pending' : true
    },
    'operators' : {
        'wsId' : 472,
        'pending' : true
    }
};

let awaitingViewer = true;
let awaitingBOM    = true;



let components = {
    'motors'     : [],
    'sensors'    : [],
    'actors'     : [],
    'cylinders'  : [],
    'operators'  : []
}
let linksComponentLists = []


let ebomViewName = 'Product Specification Editor';


$(document).ready(function() {
    
    wsProblemReports.id = config.service.wsIdProblemReports;

    appendProcessing('bom', false);
    appendProcessing('details', false);
    appendProcessing('attachments', true);
    appendProcessing('items', false);
    appendViewerProcessing();
    appendOverlay();
    
    setUIEvents();
    getWSConfig();

    if(!isBlank(dmsId)) {
        $('body').removeClass('screen-landing').addClass('screen-main');
        $.get('/plm/details', { 'link' : link}, function(response) {

            let linkEBOM = getSectionFieldValue(response.data.sections, 'ENGINEERING_BOM', '', 'link');

            linksComponentLists.push(getSectionFieldValue(response.data.sections, 'LIST_OF_SENSORS', '', 'link'));
            linksComponentLists.push(getSectionFieldValue(response.data.sections, 'LIST_OF_ACTORS', '', 'link'));
            linksComponentLists.push(getSectionFieldValue(response.data.sections, 'LIST_OF_MOTORS', '', 'link'));
            linksComponentLists.push(getSectionFieldValue(response.data.sections, 'LIST_OF_CYLINDERS', '', 'link'));

            openItem(linkEBOM);
        });
    } else if(!isBlank(config.service.wsIdProducts)) insertWorkspaceItems(config.service.wsIdProducts, {
        'id'                 : 'products', 
        'title'              : 'Products by status', 
        'classNames'         : ['wide', 'm'], 
        'icon'               : 'deployed_code', 
        'fieldIdImage'       : 'IMAGE', 
        'fieldIdTitle'       : 'TITLE', 
        'fieldIdSubtitle'    : 'DESCRIPTION', 
        'sortBy'             : 'title', 
        'groupBy'            : 'status',
        'fieldIdsAttributes' : ['ENGINEERING_BOM','LIST_OF_SENSORS','LIST_OF_ACTORS','LIST_OF_MOTORS','LIST_OF_CYLINDERS']  
    }); 
    
});


function setUIEvents() {


    // Close current product display
    $('#done').click(function() {
        $('body').removeClass('screen-main');
        $('body').addClass('screen-landing');
        document.title = documentTitle;
    });


    // Trigger BOM sync based on EBOM data
    $('#header-sync').click(function() {
        syncElementsLists();
    });


    // Toggles in header toolbar
    $('#toggle-layout').click(function() {
        $('body').toggleClass('wide-layout');
        $('#panel').toggleClass('surface-level-2');
        setTimeout(function() { viewer.resize(); }, 250);
    })
    $('#toggle-bom').click(function() {
        $('body').toggleClass('no-bom');setTimeout(function() { viewer.resize(); }, 250);
    })
    $('#toggle-details').click(function() {
        $('body').toggleClass('with-details').removeClass('with-attachments');
        setTimeout(function() { viewer.resize(); }, 250);
    })
    $('#toggle-attachments').click(function() {
        $('body').toggleClass('with-attachments').removeClass('with-details');
        viewer.resize();setTimeout(function() { viewer.resize(); }, 250);
    })


    // Process Creation (to be implemented)
    $('#create-process').click(function() {
        
        $('#processes-sections').html('').show();

        $(this).siblings().show();
        $(this).hide();

        $('#processes-list').hide();

        insertItemDetailsFields('', 'processes', wsProblemReports.sections, wsProblemReports.fields, null, true, true, true);

    });
    $('#cancel-process').click(function() {

        $('#create-process').show();
        $('.process-dialog').hide();
        $('#processes-list').show();
        $('#processes-sections').hide();

    });
    $('#save-process').click(function() {

        if(!validateForm($('#processes-sections'))) return;

        viewerCaptureScreenshot(null, function() {

            $('#processes-toolbar').hide();
            $('#processes-sections').hide();
            $('#processes-list').html('');
            $('#processes-list').show('');
            $('#processes-processing').show();
    
            let link = $('#processes-list').attr('data-source');
    
            submitCreateForm(wsProblemReports.id, $('#processes-sections'), 'viewer-markup-image', {}, function(response ) {

                let newLink = response.data.split('.autodeskplm360.net')[1];
                $.get('/plm/add-managed-items', { 'link' : newLink, 'items' : [ link ] }, function(response) {
                // $.get('/plm/add-relationship', { 'link' : newLink, 'relatedId' : link.split('/')[6] }, function(response) {
                    setProcesses($('#processes-list').attr('data-source'));
                    $('.process-dialog').hide();
                    $('#create-process').show();
                    $('#processes-list').show();
                });

            });

        });

    });

}


function getWSConfig() {

    let requests = [
        $.get('/plm/grid-columns', { 'wsId' : wsConfig.sensors.wsId}),
        $.get('/plm/grid-columns', { 'wsId' : wsConfig.motors.wsId}),
        $.get('/plm/grid-columns', { 'wsId' : wsConfig.cylinders.wsId})
    ]

    Promise.all(requests).then(function(responses) {
        
        wsConfig.sensors.grid = responses[0].data.fields;
        wsConfig.sensors.editableFields = getEditableFields(responses[0].data.fields);

        wsConfig.motors.grid = responses[1].data.fields;
        wsConfig.motors.editableFields = getEditableFields(responses[1].data.fields);

        wsConfig.cylinders.grid = responses[2].data.fields;
        wsConfig.cylinders.editableFields = getEditableFields(responses[2].data.fields);

    });
 
}



// Click on Product in landing page
function clickWorkspaceItem(elemClicked, e) {

    let linkEBOM = elemClicked.attr('data-engineering_bom');

    if(isBlank(linkEBOM)) {
        showErrorMessage('Invalid Product Data', 'BOM of the selected product is not availalbe, please contact your administrator');
        return;
    }

    linksComponentLists = [];

    linksComponentLists.push(elemClicked.attr('data-list_of_sensors'));
    linksComponentLists.push(elemClicked.attr('data-list_of_actors'));
    linksComponentLists.push(elemClicked.attr('data-list_of_motors'));
    linksComponentLists.push(elemClicked.attr('data-list_of_cylinders'));

    $('body').removeClass('screen-landing');
    $('body').addClass('screen-main');

    openItem(linkEBOM);

}
function openItem(link) {

    $('#header-subtitle').html('');
    $('#list-sensors').html('');
    $('#list-actors').html('');
    $('#list-motors').html('');
    $('#list-cylinders').html('');
    $('#panel').hide();

    $.get('/plm/descriptor', { 'link' : link}, function(response) {
        $('#header-subtitle').html(response.data);
        document.title = documentTitle + ': ' + response.data;
    });

    if(isBlank(sections)) getInitialData(link.split('/')[4]);
    insertBOM(link, { 
        'bomViewName'   : ebomViewName, 
        'reset'         : true, 
        'openInPLM'     : true, 
        'goThere'       : false, 
        'hideDetails'   : true
    });
    
    insertViewer(link);
    insertItemDetails(link);
    insertAttachments(link, paramsAttachments);
    // setProcesses(link);

}


// Retrieve Workspace Details
function getInitialData(wsId) {

    let promises = [
        $.get('/plm/sections'   , { 'wsId' : wsId }),
        $.get('/plm/fields'     , { 'wsId' : wsId }),
        $.get('/plm/sections'   , { 'wsId' : wsProblemReports.id }),
        $.get('/plm/fields'     , { 'wsId' : wsProblemReports.id }),
    ];

    Promise.all(promises).then(function(responses) {

        let errors = false;

        for(response of responses) {
            if(response.error) {
                let message = (isBlank(response.data.message)) ? 'Error in accessing ' + response.params.url : response.data.message;
                showErrorMessage('Error occured', message);
                errors = true;
            }
        }

        if(!errors) {
            sections                        = responses[0].data;
            fields                          = responses[1].data;
            wsProblemReports.sections       = responses[2].data;
            wsProblemReports.fields         = responses[3].data;
        }

    });

} 


// Insert flat BOMs of related element lists
function insertElementLists() {

    $('#panel').show();

    insertFlatBOM(linksComponentLists[0], { 'id' : 'list-sensors',   'title' : '', 'editable' : edit, 'bomViewName' : 'Specification', 'views' : true, 'quantity' : false, 'position' : false, 'descriptor' : false });
    insertFlatBOM(linksComponentLists[1], { 'id' : 'list-actors',    'title' : '', 'editable' : edit, 'bomViewName' : 'Default View',  'views' : true, 'quantity' : false, 'position' : false, 'descriptor' : false });
    insertFlatBOM(linksComponentLists[2], { 'id' : 'list-motors' ,   'title' : '', 'editable' : edit, 'filterEmpty' : true, 'bomViewName' : 'Specification', 'views' : true, 'quantity' : false, 'position' : false, 'descriptor' : false });
    insertFlatBOM(linksComponentLists[3], { 'id' : 'list-cylinders', 'title' : '', 'editable' : edit, 'bomViewName' : 'Specification', 'views' : true, 'quantity' : false, 'position' : false, 'descriptor' : false });

}


// EBOM User Interactions
function clickBOMItem(elemClicked, e) {

    if(elemClicked.hasClass('selected')) {
        elemClicked.removeClass('selected');
        insertItemDetails('/api/v3/workspaces/' + wsId + '/items/' + dmsId);
        insertAttachments('/api/v3/workspaces/' + wsId + '/items/' + dmsId, paramsAttachments);
        setProcesses('/api/v3/workspaces/' + wsId + '/items/' + dmsId);
        updateViewer();
        $('.flat-bom-item').show();
        $('.application-data-instance').show();
    } else {
        $('tr.selected').removeClass('selected');
        elemClicked.addClass('selected');
        insertItemDetails(elemClicked.attr('data-link'));
        insertAttachments(elemClicked.attr('data-link'), paramsAttachments);
        setProcesses(elemClicked.attr('data-link'));
        updateViewer();
        filterPartList(elemClicked);
        filterApplicationData(elemClicked);
        
    }

    updateBOMCounters(elemClicked.closest('.bom').attr('id'));

}
function clickBOMResetDone() {
    
    $('.application-data-instance').show();

    let link = $('#bom').attr('data-link');
    
    insertItemDetails(link);
    insertAttachments(link, paramsAttachments);
    updateViewer();

}
function filterPartList(elemClicked) {

    let children = getBOMItemChhildren(elemClicked);

    children.push(elemClicked);

    $('.flat-bom-item').hide();
    //$('.application-data-cell').hide();

    for(let child of children) {

        let partNumber = child.attr('data-part-number');

        $('.flat-bom-item').each(function() {
            if($(this).attr('data-part-number') === partNumber) $(this).show();
        })

    }


}
function filterApplicationData(elemClicked) {

    let partNumber = elemClicked.attr('data-part-number');

    $('.application-data-instance').hide();

    $('.application-data-instance').each(function() {
        let path = $(this).attr('data-path');
        if(path.indexOf(partNumber) > -1) {
            $(this).show();
            // $(this).closest('.application-data-cell').show();
        }
    })

}



// Parse BOM for Spare Parts
function changeBOMViewDone(id, fields, viewBOM, viewFlatBOM) {

    ebom        = viewBOM;
    ebomFields  = fields;

    $('#header-sync').removeClass('disabled');

}
function syncElementsLists() {

    $('#overlay').show();

    for(let field of ebomFields) {
    
             if(field.fieldId === 'NUMBER')               urns.partNumber     = field.__self__.urn;
        else if(field.fieldId === 'PART_NUMBER')          urns.partNumber     = field.__self__.urn;
        else if(field.fieldId === 'COMPONENT_TYPE')       urns.componentType  = field.__self__.urn;
        else if(field.fieldId === 'COMPONENT_DATA_WSID')  urns.componentWSID  = field.__self__.urn;
        else if(field.fieldId === 'COMPONENT_DATA_DMSID') urns.componentDMSID = field.__self__.urn;

    }

    let linkEBOM         = $('#bom').attr('data-link');
    let requestsBOMViews = [];

    getBOMComponents('urn:adsk.plm:tenant.workspace.item:' + tenant.toUpperCase() + '.' + linkEBOM.split('/')[4] + '.' + linkEBOM.split('/')[6], 1.0);

    console.log(components);

    for(let link of linksComponentLists) requestsBOMViews.push($.get('/plm/bom-views-and-fields', { 'link' : link }));

    Promise.all(requestsBOMViews).then(function(responses) {
        
        console.log(responses);

        let requestsBOMs    = [];
        let index           = 0;

        for(let link of linksComponentLists) {
            requestsBOMs.push($.get('/plm/bom-flat', {
                'link'          : link,
                'revisionBias'  : 'release',
                'viewId'        : responses[index++].data[0].id
            }))
        }

        Promise.all(requestsBOMs).then(function(responses) {
            
            console.log(responses);
            
            syncComponentsList('sensors', responses[0], function() {
                syncComponentsList('actors', responses[1], function() {
                    syncComponentsList('motors', responses[2], function() {
                        syncComponentsList('cylinders', responses[3], function() {

                            $('#overlay').hide();
                            insertElementLists();
                        });
                    });
                });
            });
        });

    });

}
function getBOMComponents(parent, qtyTotal) {

    let result = false;

    for(let edge of ebom.edges) {

        if(edge.parent === parent) {

            result = true;

            let componentType   = getBOMCellValue(edge.child, urns.componentType, ebom.nodes, 'title');
            let componentWSID   = getBOMCellValue(edge.child, urns.componentWSID, ebom.nodes);
            let componentDMSID  = getBOMCellValue(edge.child, urns.componentDMSID, ebom.nodes);
            let partNumber      = getBOMCellValue(edge.child, urns.partNumber, ebom.nodes);
            // let link        = getBOMNodeLink(edge.child, bom.nodes);
            let quantity        = getBOMEdgeValue(edge, urns.quantity, null, 0);
            let quantityRow     = qtyTotal * quantity;
            let componentsList  = null;

            let component = {
                'partNumber' : partNumber,
                'wsId'       : componentWSID,
                'dmsId'      : componentDMSID,
                'link'       : '/api/v3/workspaces/' + componentWSID + '/items/' + componentDMSID
            }

            switch(componentType) {
                case 'Sensor'   : componentsList = components.sensors; break;
                case 'Actor'    : componentsList = components.actors; break;
                case 'Motor'    : componentsList = components.motors; break;
                case 'Cylinder' : componentsList = components.cylinders; break;
            }

            if(componentsList !== null) {
                let add = true
                for(let entry of componentsList) {
                    if(entry.link === component.link) add = false;
                }
                if(add)componentsList.push(component);
            }

            getBOMComponents(edge.child, quantityRow);
        }
    }

    return result;

}
function syncComponentsList(id, bom, callback) {

    let requests     = [];
    let paramsParent = bom.params.link.split('/');

    for(let component of components[id]) {

        if(isMissing(component.link, bom.data)) {

            let params = {                    
                'wsIdParent'    : paramsParent[4],
                'wsIdChild'     : component.wsId,
                'dmsIdParent'   : paramsParent[6], 
                'dmsIdChild'    : component.dmsId,
                'quantity'      : 1
            };

            console.log('is missing');
            console.log(component);
            console.log(params);

            requests.push($.get('/plm/bom-add', params));

        }

    }

    if(requests.length > 0) {
        Promise.all(requests).then(function(responses) {
            callback();
        });
    } else callback();

}
function isMissing(link, items) {

    for(let item of items) {
        if(item.item.link === link) return false;
    }
    return true;

}


// Insert instance data and controls for each Flat BOM
function changeFlatBOMViewDone(id) {

    awaitingBOM = false;
    setApplicationDataTable(id);

}
function setViewerInstancedDataDone() {

    awaitingViewer = false;
    setApplicationDataTable('list-motors');
    setApplicationDataTable('list-sensors');

}
function setApplicationDataTable(id) {

    if(awaitingBOM) return;
    if(awaitingViewer) return;

    let idWS = id.split('-')[1];

    if(wsConfig[idWS].pending = false) return;

    wsConfig[idWS].pending = false;

    let elemTHRow = $('#' + id + '-thead').children().first();

    $('<th></th>').insertAfter(elemTHRow.children().first());

    let elemTBody = $('#' + id + '-tbody');
    let partNumbers = [];

    elemTBody.children().each(function() {

        let elemRow = $(this);
            elemRow.addClass('collapsed');

        let elemCell = $('<td></td>').insertAfter($(this).children().first());

        $('<div></div>').appendTo(elemCell)
            .addClass('icon')
            .addClass('icon-expand');

        $('<div></div>').appendTo(elemCell)
            .addClass('icon')
            .addClass('icon-collapse');

            elemCell.click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                clickToggleApplicationData($(this));
            })

        partNumbers.push(elemRow.attr('data-part-number'));

    });

    let components = viewerGetComponentsInstances(partNumbers);

    for(let component of components) {
        insertApplicationDataTable(id, component);
    }

}
function insertApplicationDataTable(id, component) {

    sortArray(component.instances, 'path');

    let gridConfig = wsConfig[id.split('-')[1]].grid;

    let elemDataRow = $('<tr></tr>').addClass('application-data-row');
    let elemDataCell = $('<td></td>').appendTo(elemDataRow)
        .addClass('application-data-cell')
        .attr('colspan', gridConfig.length + 5);


    let elemTable = $('<table></table>').appendTo(elemDataCell);
    let elemTHead = $('<thead></thead>').appendTo(elemTable);
    let elemTBody = $('<tbody></tbody>').appendTo(elemTable);
    let elemTHRow = $('<tr></tr>').appendTo(elemTHead);
    let index     = 1;
        
    $('<tbody></tbody>').appendTo(elemTable);
    $('<th></th>').appendTo(elemTHRow).html('#');

    for(let field of gridConfig) {
        $('<th></th>').appendTo(elemTHRow)
            .html(field.name);
    }

    $('<th></th>').appendTo(elemTHRow).addClass('instance-path').html('Path');


    $('#' + id + '-tbody').children().each(function() {
        if($(this).attr('data-part-number') === component.partNumber) {
            elemDataRow.insertAfter($(this));
        }
    });


    for(let instance of component.instances) {

        // console.log(instance);

        let elemRow = $('<tr></tr>').appendTo(elemTBody)
            .addClass('application-data-instance')
            .attr('data-viewerid', instance.dbId)
            .attr('data-path', instance.path)
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                clickInstance($(this));
            });

        $('<td></td>').appendTo(elemRow).html(index++);

        for(let field of gridConfig) {

                let elemRowCell = $('<td></td>').appendTo(elemRow);

                //console.log(field);

                let fieldId = field.__self__.split('/').pop();
                //console.log(fieldId);


                let value = '';

                for(let editableField of wsConfig.motors.editableFields) {

                    if(fieldId === editableField.id) {

                        if(!isBlank(editableField.control)) {
    
                            let elemControl = editableField.control.clone();
                                elemControl.appendTo(elemRowCell);
                                elemRowCell.attr('data-id', editableField.id);
                                elemControl.click(function(e) {
                                    e.stopPropagation();
                                });
                                elemControl.change(function() {
                                    changedFlatBOMValue($(this));
                                });
    

                            if(!edit) {


                                elemControl.attr('readonly', true);
                                elemControl.attr('disabled', true);
                                elemRowCell.addClass('readonly');  

                            }

                            switch (editableField.type) {
    
                                case 'Single Selection':
                                    // value = getFlatBOMCellValue(response.data, itemLink, field.__self__.urn, 'link');
                                    elemControl.val(value);
                                    break;
    
                                default:
                                    elemControl.val(value);
                                    break;
    
                            }
    
                            // isEditable = true;
                        }

                    }

                }


        }

        $('<td></td>').appendTo(elemRow).addClass('instance-path').html(instance.path);

    
    }

}
function clickToggleApplicationData(elemClicked) {

    let elemRow = elemClicked.parent();
        elemRow.toggleClass('collapsed');
        elemRow.toggleClass('expanded');

    elemRow.next().children().toggle();

}
function clickInstance(elemClicked) {

    $('.application-data-instance').removeClass('selected');

    elemClicked.addClass('selected');

    let dbId     = elemClicked.attr('data-viewerid');
    let elemPrev = elemClicked.closest('tr.application-data-row').prev();

    if(!elemPrev.hasClass('selected')) {
        $('.flat-bom-item').removeClass('selected');
        elemPrev.addClass('selected');
        insertItemDetails(elemPrev.attr('data-link'));
        insertAttachments(elemPrev.attr('data-link'), paramsAttachments);
        // viewerHighlightInstances(elemPrev.attr('data-part-number'), [dbId], true, true, true);
        viewerHighlightInstances(elemPrev.attr('data-part-number'), [dbId], {});
    } else {
        // viewerHighlightInstances(elemPrev.attr('data-part-number'), [dbId], false, false, false);
        viewerHighlightInstances(elemPrev.attr('data-part-number'), [dbId], {});
    }

}
function clickFlatBOMItem(e, elemClicked) {

    elemClicked.toggleClass('selected').siblings().removeClass('selected');

    $('.bom-item').removeClass('selected');

    if(elemClicked.hasClass('selected')) {
        viewerSelectModels([elemClicked.attr('data-part-number')], true);
        insertItemDetails(elemClicked.attr('data-link'));
        insertAttachments(elemClicked.attr('data-link'), paramsAttachments);
    } else {
        viewerResetSelection(true);
        let elemTable = elemClicked.closest('.flat-bom-tbody');
        elemTable.find('.application-data-instance').removeClass('selected');
    }

}
function clickFlatBOMCheckboxDone(e, elemClicked) {

    let partNumbers = [];

    $('.flat-bom-item.selected').each(function() {
        partNumbers.push($(this).attr('data-part-number'));
    })

    if(partNumbers.length > 0 ) viewerSelectModels(partNumbers, true); else viewerResetSelection(true);

}
function clickSelectAllFlatBOMDone(elemClicked) {

    if(elemClicked.children('.icon-check-box-checked').length > 0) {

    } else {
        viewerResetSelection();
    }
}



// Save Changes
function saveFlatBOMChangesDone() {

    let requests = [];
    $('#overlay').show();


    // $('#list-mot\ors-tbody').find('.application-data-instance').each(function () {
    $('#list-cylinders').find('.application-data-instance').each(function () {

        console.log('instance');

        let elemInstance = $(this);
        let params = {
            'link' : linksComponentLists[3],
            'data' : []
        }

        // console.log(params);

        let proceed = true;

        elemInstance.children('td').each(function() {

            let elemCell   = $(this);
            let elemInput  = elemCell.find('input');
            let elemSelect = elemCell.find('select');

            if(elemInput.length > 0) {
                
                if(proceed) {
                params.data.push({
                    'fieldId' : elemCell.attr('data-id'),
                    'value'   : elemInput.val()
                });
            }
            proceed = false;
            // } else if(elemSelect.length > 0) {
            //     params.data.push({
            //         'fieldId' : elemCell.attr('data-id'),
            //         'value'   : elemSelect.val()
            //     })
            }

        });

        console.log(params);

        requests.push($.get('/plm/add-grid-row', params));

        


    });

    Promise.all(requests).then(function(responses) {
        $('#overlay').hide();
    });

    console.log(requests.length);
    console.log(requests);

}








// function onViewerSelectionChanged(event) {
//     console.log('aha');
// }





// Viewer init and interactions
// function onViewerSelectionChanged(event) {

//     let found = false;

//     if(viewer.getSelection().length === 0) {

//         return;

//     } else {

//         viewer.getProperties(event.dbIdArray[0], function(data) {

//             for(property of data.properties) {

//                 if(partNumberProperties.indexOf(property.displayName) > -1) {

//                     let partNumber = property.displayValue;

//                     $('tr').each(function() {
//                         if(!found) {
//                             if($(this).attr('data-part-number') === partNumber) {
//                                 found = true;
//                                 $(this).click();
//                             }
//                         }
//                     });

//                     if(!found) {
//                         if(partNumber.indexOf(':') > -1 ) {
//                             partNumber = property.displayValue.split(':')[0];
//                             $('tr').each(function() {
//                                 if(!found) {
//                                     if($(this).attr('data-part-number') === partNumber) {
//                                         found = true;
//                                         $(this).click();                                        
//                                     }
//                                 }
//                             });
//                         }
//                     }

//                 }

//             }

//         });

//     }

// }
function initViewerDone() {

    insertElementLists();
    viewerAddMarkupControls();   
    viewerAddGhostingToggle();
    viewerAddResetButton();   
    viewerAddViewsToolbar();

    $('#viewer-markup-image').attr('data-field-id', 'IMAGE_1');

    // awaitingViewer = false;

    // setApplicationDataTable('list-motors');

}
function onViewerSelectionChanged(event) {

    if(disableViewerSelectionEvent) return;

    let selectedComponentPaths = viewerGetSelectedComponentPaths();

    // viewerGetSelectedComponentPaths().then(function(selectedComponentPaths) {
        console.log(selectedComponentPaths);
        console.log(selectedComponentPaths[0]);
        // addSelectedFeatureItems(elemFeature, selectedComponentPaths)

        $('.bom-item').removeClass('selected');
        $('.flat-bom-item').removeClass('selected');
        $('.application-data-instance').removeClass('selected');

        $('.application-data-instance').each(function() {
            let elemInstance = $(this);

            if(elemInstance.attr('data-path') === selectedComponentPaths[0]) {

                console.log('found');

                let elemAppData = elemInstance.closest('.application-data-cell');
                // let elemAppData = elemInstance.closest('.application-data-row');
                let elemItem    = elemAppData.closest('.application-data-row').prev();

                elemAppData.show();
                elemInstance.addClass('selected');
                elemItem.addClass('selected')
                    .addClass('expanded')
                    .removeClass('collapsed');
            }
        })


    // });

    // if (event.dbIdArray.length === 1) {

    //     viewer.getProperties(event.dbIdArray[0], function(data) {

    //         let partNumber = data.name.split(':')[0];
    //         let propertyMatch = false;

    //         for(partNumberProperty of config.viewer.partNumberProperties) {
    //             for(property of data.properties) {
    //                 if(property.displayName === partNumberProperty) {
    //                     partNumber = property.displayValue;
    //                     console.log(partNumber);
    //                     if(partNumber.indexOf(':') > -1) { partNumber = partNumber.split(':')[0]; }
    //                     propertyMatch = true;
    //                     break;
    //                 }
    //             }
    //             if(propertyMatch) break;
    //         }

    //         $('.bom-item').each(function() {

    //             if($(this).attr('data-part-number') === partNumber) {
                
    //                 let link = $(this).attr('data-link');

    //                 if($('#details').attr('data-link') !== link){
    //                     insertAttachments(link);
    //                     insertItemDetails(link);
    //                     setProcesses(link);
    //                 }
                
    //             }

    //         });

    //         $('.spare-part').each(function() {
    //             $(this).hide();
    //             if($(this).hasClass('selected')) $(this).show();
    //             if($(this).attr('data-part-number') === partNumber) $(this).show();
    //         });

    //     });

    // } else {

    //     resetSparePartsList();
        
    // }

}
function updateViewer() {

    disableViewerSelectionEvent = true;

    let selectedBOMNode = $('#bom-tbody').children('.selected');
    let zoomPart        = $('.spare-part.zoom').first();

    viewerResetColors();

    if(selectedBOMNode.length === 1) {

        let partNumber = selectedBOMNode.attr('data-part-number');
        let resetView  = (partNumber !== selectedBOMContext);

        // viewer.hideAll();
        // viewer.setGhosting(false);
        // viewerUnhideModel(selectedBOMNode.attr('data-part-number'), resetView);
        viewerSelectModel(selectedBOMNode.attr('data-part-number'), true);
        selectedBOMContext = partNumber;

        // $('#button-reset').show();

    } else {

        viewer.setGhosting(true);
        viewerResetSelection(selectedBOMContext !== '');
        selectedBOMContext = '';

        // $('#button-reset').css('display', 'none');

    }

    $('.spare-part.selected').each(function() {
        viewerSetColor($(this).attr('data-part-number'), config.vectors.blue, false, false);
    });

    if(zoomPart.length > 0) {
        $('#button-reset').show();
        viewerSetColorToAll(config.vectors.gray);
        viewerSetColor(zoomPart.attr('data-part-number'), config.vectors.red, true, false);

    }

    disableViewerSelectionEvent = false;

}


// Display selected item's Change Processes
function setProcesses(link) {

    $('#processes-toolbar').show();
    $('#processes-processing').show();

    let elemParent = $('#processes-list');
        elemParent.attr('data-source', link);
        elemParent.html('');

    insertChangeProcesses(link, 'processes');

    // $.get('/plm/relationships', { 'link' : link }, function(response) {
    //     if(response.params.link === $('#processes-list').attr('data-source')) {
    //         insertRelationships($('#processes-list'), response.data);
    //         $('#processes-processing').hide();
    //     }
    // });

}


// Set list of selected spare parts for order submittal
function setRequestList() {

    let elemParent = $('#request-list');
        elemParent.html('');

    $('.spare-part.selected').each(function() {

        let number  = $(this).find('.spare-part-number').html();
        let title   = $(this).find('.spare-part-title').html();
        let stock   = $(this).find('.spare-part-stock').html();
        
        let elemItem = $('<div></div>');
            elemItem.attr('data-link', $(this).attr('data-link'));
            elemItem.addClass('request-line');
            elemItem.appendTo(elemParent);

        let elemItemName = $('<div></div>');
            elemItemName.addClass('request-item');
            elemItemName.html(number + ' - ' + title);
            elemItemName.appendTo(elemItem);

        let elemItemQuantity = $('<div></div>');
            elemItemQuantity.addClass('request-quantity');
            elemItemQuantity.appendTo(elemItem);

        $('<input></input>').appendTo(elemItemQuantity)
            .addClass('request-input')    
            .val('1');

        $('<div></div>').appendTo(elemItem)
            .addClass('request-stock')
            .html(stock);

        let elemItemDelete = $('<div></div>');
            elemItemDelete.addClass('request-delete');
            elemItemDelete.addClass('button');
            elemItemDelete.addClass('red');
            elemItemDelete.addClass('icon');
            elemItemDelete.addClass('icon-delete');
            elemItemDelete.appendTo(elemItem);
            elemItemDelete.click(function() {
                let lineItem = $(this).closest('.request-line');
                let link = lineItem.attr('data-link');
                $('.spare-part').each(function() {
                    if($(this).attr('data-link') === link) {
                        $(this).removeClass('selected');
                    }
                });
                lineItem.remove();
            });

    });

}