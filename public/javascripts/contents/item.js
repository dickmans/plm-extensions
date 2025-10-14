// Library file to contain reusable methods for various UI components
let cachePicklists  = []; // keys: link, data
let cacheSections   = [];
let cacheWorkspaces = [];
let selectedItems   = [];
let requestsLimit   = 5;


/*
// Insert grid for phases, gates and tasks
function insertPhaseGates(link, id) {

    if(isBlank(id)) id = 'project-phase-gates';

    let elemParent = $('#' + id);
        elemParent.addClass('project-phase-gates');
        elemParent.html('');

    $.get('/plm/project', { 'link' : link}, function(response) {

        console.log(response);

        for(projectItem of response.data.projectItems) {

            let elemColumn = $('<div></div>');
                elemColumn.appendTo(elemParent);

            let elemHead = $('<div></div>');
                elemHead.addClass('project-grid-head');
                elemHead.html(projectItem.title);
                elemHead.appendTo(elemColumn);

            if(isBlank(projectItem.projectItems)) {


            } else {

                elemColumn.addClass('tiles');
                elemColumn.addClass('list');
                elemColumn.addClass('xxxs');

                for(task of projectItem.projectItems) {

                    let elemTask;
                    let className = 'task-not-started';
                    let elemProgress = $('<div></div>');
                    elemProgress.addClass('task-progress-bar');

                    if(task.progress === 100) {
                        className = 'task-completed';
                    } else if(task.statusFlag === 'CRITICAL') {
                        className = 'task-overdue';
                    }

                    if(task.type.link === '/api/v3/project-item-type/WFM') {

                        elemTask = genTile(task.item.link, '', null, 'check_circle', task.title);
                    } else {
                        elemTask = genTile('', '', null, 'not_started', task.title);

                    }

                        elemTask.addClass('project-grid-task');
                        elemTask.addClass(className);
                        elemTask.appendTo(elemColumn);

                        elemProgress.appendTo(elemTask);

                }
            }

        }

    });

}*/

/*// Insert Item Details
// function getFilteredPicklistOptions(elemClicked) {

//     closeAllFilteredPicklists();

//     let listName = elemClicked.attr('data-filter-list');
//     let elemList = elemClicked.next();
//     let filters  = [];

//     elemClicked.addClass('filter-list-refresh');

//     $('.filtered-picklist-input').each(function() {
//         if(listName === $(this).attr('data-filter-list')) {
//             let value = $(this).val();
//             if(!isBlank(value)) {
//                 filters.push([ $(this).parent().attr('data-id'), $(this).val() ]);
//             }
//         }
//     });
    
//     $.get( '/plm/filtered-picklist', { 'link' : elemClicked.parent().attr('data-link'), 'filters' : filters, 'limit' : 100, 'offset' : 0 }, function(response) {
//         elemClicked.removeClass('filter-list-refresh');
//         if(!response.error) {
//             for(item of response.data.items) {
//                 let elemOption = $('<div></div>');
//                     elemOption.html(item)    ;
//                     elemOption.appendTo(elemList);
//                     elemOption.click(function() {
//                         $(this).parent().hide();
//                         $(this).parent().prev().val($(this).html());
//                     });
//             }
//             elemList.show();
//         }
//     });   

// }
// function clearFilteredPicklist(elemClicked) {
    
//     closeAllFilteredPicklists();
//     elemClicked.siblings('input').val('');

// }
// function closeAllFilteredPicklists() {

//     $('.filtered-picklist-options').html('').hide();

// }

*/


// Set tab labels and toggle tab visibility based on user permission
function setItemTabLabels(wsId, callback) {

    $.get('/plm/tabs', { wsId : wsId }, function(response) {
        callback(setTabLabels(response.data));
    });

}
function setTabLabels(data) {

    let permissions = [];

    $('#tabItemDetails'  ).hide();
    $('#tabWhereUsed'    ).hide();
    $('#tabAttachments'  ).hide();
    $('#tabBOM'          ).hide();
    $('#tabManagedItems' ).hide();
    $('#tabWorkflow'     ).hide();
    $('#tabGrid'         ).hide();
    $('#tabProject'      ).hide();
    $('#tabRelationships').hide();
    $('#tabMilestones'   ).hide();
    $('#tabChangeLog'    ).hide();

    for(let tab of data) {

        let label = (tab.name === null) ? tab.key : tab.name;

        switch(tab.workspaceTabName) {
            case 'ITEM_DETAILS'         : $('#tabItemDetails'  ).html(label).show(); permissions.push('itemDetails'  ); break;
            case 'PART_ATTACHMENTS'     : $('#tabAttachments'  ).html(label).show(); permissions.push('attachments'  ); break;
            case 'BOM_LIST'             : $('#tabBOM'          ).html(label).show(); permissions.push('bom'          ); break;
            case 'BOM_WHERE_USED'       : $('#tabWhereUsed'    ).html(label).show(); permissions.push('whereUsed'    ); break;
            case 'LINKEDITEMS'          : $('#tabManagedItems' ).html(label).show(); permissions.push('managedItems' ); break;
            case 'WORKFLOW_ACTIONS'     : $('#tabWorkflow'     ).html(label).show(); permissions.push('workflow'     ); break;
            case 'PART_GRID'            : $('#tabGrid'         ).html(label).show(); permissions.push('grid'         ); break;
            case 'PROJECT_MANAGEMENT'   : $('#tabProject'      ).html(label).show(); permissions.push('project'      ); break;
            case 'RELATIONSHIPS'        : $('#tabRelationships').html(label).show(); permissions.push('relationships'); break;
            case 'PART_MILESTONES'      : $('#tabMilestones'   ).html(label).show(); permissions.push('milestons'    ); break;
            case 'PART_HISTORY'         : $('#tabChangeLog'    ).html(label).show(); permissions.push('changeLog'    ); break;
        }

    }

    return permissions;

}


// Insert Item Status
function insertItemStatus(link, id) {

    $('#' + id).html('');

    $.get('/plm/details', { link : link }, function(response) {
        $('#' + id).html(response.data.currentState.title);
    });

}



// Insert Workflow Actions Menu
function insertWorkflowActions(link, params) {

    if(isBlank(link)) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let id               = 'workflow-actions';  // id of DOM element where the actions menu will be inserted
    let label            = 'Change Status';     // Label that will be shown in the select control
    let hideIfEmpty      = true;                // If set to true, the select control will be hidden if there are not workflow actions available
    let disableAtStartup = false;               // If set to true, the select control will be disabled until the available actions have been retrieved
    let onComplete       = function(link) {}

    if( isBlank(params)                 )           params = {};
    if(!isBlank(params.id)              )               id = params.id;
    if(!isBlank(params.label)           )            label = params.label;
    if(!isBlank(params.hideIfEmpty)     )      hideIfEmpty = params.hideIfEmpty;
    if(!isBlank(params.disableAtStartup)) disableAtStartup = params.disableAtStartup;
    if(!isBlank(params.onComplete)      )       onComplete = params.onComplete;

    let elemActions = $('#' + id)
        .attr('data-link', link)
        .html('')
        .change(function() {
            clickWorkflowAction($(this), params);
        });

    if(disableAtStartup) elemActions.addClass('disabled').attr('disabled', '')

    $('<option></option>')
        .attr('value', '')
        .attr('selected', '')
        .html(label)
        .appendTo(elemActions);

    $.get('/plm/transitions', { 'link' : link }, function(response) {

        for(let action of response.data) {

            $('<option></option>').appendTo(elemActions)
                .attr('value', action.__self__)
                .html(action.name);

        }

        if(response.data.length > 0) {
            elemActions.show()
                .removeClass('disabled')
                .removeAttr('disabled');
        } else if(hideIfEmpty) {
            elemActions.hide();
        }

        insertWorkflowActionsDone(id, response);

    });

}
function insertWorkflowActionsDone(id, data) {}
function clickWorkflowAction(elemClicked, params) {

    $('#overlay').show();

    let link       = elemClicked.attr('data-link');
    let transition = elemClicked.val();

    $.get('/plm/transition', { link : link, transition : transition }, function(response) {
        if(response.error) showErrorMessage('Workflow Action Failed', response.data.message);
        $('#overlay').hide();
        clickWorkflowActionDone(response.params.link, response.params.tranistion, response);
        params.onComplete(link);
    });

}
function clickWorkflowActionDone(link, transition, data) {}



// Insert Create
function insertCreate(workspaceNames, workspaceIds, params) {

    if(isBlank(workspaceNames) && isBlank(workspaceIds)) return;
    if(isBlank(workspaceNames)) workspaceNames = [];
    if(isBlank(workspaceIds)) workspaceIds = [];
    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'create' : params.id;
    
    settings.create[id] = getPanelSettings('', params, {
        headerLabel  : 'Create New',
        layout       : 'normal',
        showInDialog : false
    }, [
        [ 'hideComputed'        , true  ],
        [ 'hideReadOnly'        , false ],
        [ 'hideSections'        , false ],
        [ 'picklistLimit'       , 10    ],
        [ 'picklistShortcuts'   , true  ],
        [ 'requiredFieldsOnly'  , false ],
        [ 'firstSectionOnly'    , false ],
        [ 'toggles'             , false ],
        [ 'sectionsIn'          , [] ],
        [ 'sectionsEx'          , [] ],
        [ 'sectionsOrder'       , [] ],
        [ 'fieldValues'         , [] ],
        [ 'contextId'           , null ],
        [ 'contextItem'         , null ],
        [ 'contextItemField'    , null ],
        [ 'contextItems'        , [] ],
        [ 'contextItemFields'   , [] ],
        [ 'viewerImageFields'   , [] ],
        [ 'createButtonTitle'   , '' ],
        [ 'cancelButton'        , true ],
        [ 'cancelButtonIcon'    , '' ],
        [ 'cancelButtonLabel'   , 'Cancel' ],
        [ 'cancelButtonTitle'   , '' ],
        [ 'getDetails'          , false ],
        [ 'onClickCancel'       , function(id) { } ],
        [ 'afterCreation'       , function(id, link, data, contextId) { console.log('New item link : ' + link ); } ]
    ]);

    settings.create[id].wsId     = '';
    settings.create[id].editable = true;
    settings.create[id].derived  = [];
    settings.create[id].load     = function() { insertCreateData(id); }

    genPanelTop(id, settings.create[id], 'create');
    genPanelHeader(id, settings.create[id]);
    genPanelToggleButtons(id, settings.create[id], function() {
        $('#' + id + '-content').find('.section.collapsed').click();
    }, function() {
        $('#' + id + '-content').find('.section.expanded').click();
    });
    genPanelResizeButton(id, settings.create[id]);
    genPanelReloadButton(id, settings.create[id]);

    genPanelContents(id, settings.create[id]).addClass(settings.create[id].layout).addClass('sections');

    if(settings.create[id].cancelButton) {
        genPanelFooterActionButton(id, settings.create[id], 'cancel', {

            label   : settings.create[id].cancelButtonLabel,
            icon    : settings.create[id].cancelButtonIcon,
            title   : settings.create[id].cancelButtonTitle,

        }, function() { 

            $('#overlay').hide();
            $('#' + id).hide();
            settings.create[id].onClickCancel(id);

        });
    }

    genPanelFooterActionButton(id, settings.create[id], 'save', {

        label   : settings.create[id].createButtonLabel,
        icon    : settings.create[id].createButtonIcon,
        title   : settings.create[id].createButtonTitle,
        default : true

    }, function() { 

        $('#' + id + '-processing').show();
        $('#' + id + '-actions').hide();
        $('#' + id + '-content').hide();
        $('#' + id + '-footer').hide();

        submitCreate(settings.create[id].wsId, settings.create[id].sections, $('#' + id + '-content'), settings.create[id], function(response) {

            $('#' + id + '-processing').hide();
            $('#' + id + '-actions').show();
            $('#' + id + '-content').show();
            $('#' + id + '-footer').show();

            if(!isBlank(response.link)) {

                insertCreateAfterCreation(id, response.link);
                settings.create[id].afterCreation(id, response.link, response.data, settings.create[id].contextId);

            }

        });

    });

    if(workspaceIds.length === 1) {

        settings.create[id].wsId = workspaceIds[0];
        settings.create[id].load();

    } else {

        $.get('/plm/workspaces?limit=500', { useCache : true }, function(response) {

            if(workspaceNames.length === 1) {

                for(let workspace of workspaces) {
                    for(let result of response.data.items) {
                        if(result.title.toLowerCase() === workspace.toLowerCase()) {
                            settings.create[id].wsId = [ result.link.split('/')[4] ];
                            settings.create[id].load();
                        }
                    }
                }

            } else {

                let elemToolbar = genPanelToolbar(id, settings.create[id], 'actions').css('justify-content', 'center');

                $('<span></span>').appendTo(elemToolbar)
                    .html('Select workspace of new record:');

                let elemSelect = $('<select></select>').appendTo(elemToolbar)
                    .addClass('button')
                    .addClass('main')
                    .on('change', function() {
                        settings.create[id].wsId = elemSelect.val();
                        settings.create[id].load();
                    });


                for(let result of response.data.items) {

                    let add = false;

                    if(workspaceIds.length === 0) {

                        for(let workspaceName of workspaceNames) {
                            if(result.title.toLowerCase() === workspaceName.toLowerCase()) {
                                add = true;
                                break;
                            }
                        }

                    } else {
                        for(let workspaceId of workspaceIds) {
                            if(result.link.split('/')[4] == workspaceId) {
                                add = true;
                                break;
                            }                         
                        }
                    }

                    if(add) {
                        $('<option></option>').appendTo(elemSelect)
                            .attr('value', result.link.split('/')[4])
                            .html(result.title);
                    }


                }

                settings.create[id].wsId = elemSelect.children().first().attr('value');
                settings.create[id].load();

            }
        });
    }

}
function insertCreateData(id) {

    settings.create[id].timestamp = startPanelContentUpdate(id);

    let requests = [
        $.get('/plm/sections', { wsId : settings.create[id].wsId, useCache : settings.create[id].useCache, timestamp : settings.create[id].timestamp } ),
        $.get('/plm/fields'  , { wsId : settings.create[id].wsId, useCache : settings.create[id].useCache } )
    ]

    for(let contextItem of settings.create[id].contextItems) {
        requests.push($.get('/plm/details', { link : contextItem }));
    }

    if(!isBlank(settings.create[id].contextItem)) {
        requests.push($.get('/plm/details', { link : settings.create[id].contextItem }));
    }

    if((settings.create[id].picklistShortcuts)) {
        requests.push($.get('/plm/bookmarks'));
        requests.push($.get('/plm/recent'));
    }
    
    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.create[id])) return;

        let bookmarks = [];
        let recents   = [];

        if((settings.create[id].picklistShortcuts)) {
            bookmarks = responses[responses.length - 2].data.bookmarks;
            recents   = responses[responses.length - 1].data.recentlyViewedItems;
        }

        settings.create[id].sections = responses[0].data;

        insertDetailsFields(id, responses[0].data, responses[1].data, null, settings.create[id], bookmarks, recents, function() {

            if(settings.create[id].contextItems.length === settings.create[id].contextItemFields.length) {
            
                let index = 0;

                for(let contextItemField of settings.create[id].contextItemFields) {
                    settings.create[id].fieldValues.push({
                        fieldId      : contextItemField,
                        value        : settings.create[id].contextItems[index],
                        displayValue : responses[2 + index++].data.title
                    });
                }

            } 

            if(!isBlank(settings.create[id].contextItem)) {

                if(!isBlank(settings.create[id].contextItemField)) {
                    settings.create[id].fieldValues.push({
                        fieldId      : settings.create[id].contextItemField,
                        value        : settings.create[id].contextItem,
                        displayValue : responses[2].data.title
                    });
                }

                for(let contextItemField of settings.create[id].contextItemFields) {
                    settings.create[id].fieldValues.push({
                        fieldId      : contextItemField,
                        value        : settings.create[id].contextItem,
                        displayValue : responses[2].data.title
                    });
                }

            }
            
            for(let viewerImageField of settings.create[id].viewerImageFields) {
                settings.create[id].fieldValues.push({
                    fieldId      : viewerImageField,
                    viewerImage  : 'viewer-markup-image'
                });
            }

            insertCreateDataSetFieldValues(id, settings.create[id]);
            finishPanelContentUpdate(id, settings.create[id]);
            
        });

    });

}
function insertCreateDataSetFieldValues(id, settings) {

    if(isBlank(settings.fieldValues)) return;

    $('#' + id + '-content').find('.field-value').each(function() {

        let elemField = $(this);
        let fieldId   = elemField.attr('data-id');

        if(!isBlank(fieldId)) {

            for(let fieldValue of settings.fieldValues) {

                if(fieldValue.fieldId === fieldId) {

                    elemField.removeClass('field-editable').addClass('field-locked');

                    if(elemField.hasClass('field-type-single-select')) {

                        let elemInput= elemField.find('input').first();

                        elemInput.val(fieldValue.value);
                        elemInput.attr('disabled', 'disabled');
                        elemInput.attr('data-value', fieldValue.value);
                        elemInput.val(fieldValue.displayValue);
                        elemInput.siblings().remove();

                    } else if(elemField.hasClass('picklist')) {

                        let elemSelect = elemField.children().first();
                            elemSelect.attr('disabled', 'disabled');
                            elemSelect.children().remove();

                        $('<option></option>').appendTo(elemSelect)
                            .attr('id', fieldValue.value)
                            .attr('value', fieldValue.value)
                            .attr('displayValue', fieldValue.displayValue)
                            .html(fieldValue.displayValue);

                        elemSelect.val(fieldValue.value);

                    } else if(!isBlank(fieldValue.viewerImage)) { 
                        let elemCanvas = $('#viewer-markup-' + fieldValue.fieldId);
                        if(elemCanvas.length === 0) {
                            elemCanvas = $('<canvas>').attr('id', 'viewer-markup-' + fieldValue.fieldId).addClass('viewer-screenshot');
                        }
                        elemField.html('').append(elemCanvas);
                        viewerCaptureScreenshot('viewer-markup-' + fieldValue.fieldId, function() {});
                    } else {

                        let elemInput    = elemField.children('input').first();
                        let elemTextarea = elemField.children('textarea').first();

                        if(elemInput.length   > 0) {
                            elemInput.val(fieldValue.value);
                            elemInput.attr('disabled', 'disabled');
                        }
                        if(elemTextarea.length > 0) elemTextarea.val(fieldValue.value);

                    }
                }

                elemField.parent().removeClass('editable').addClass('readonly').addClass('locked');


            }
        }

    });

}
function insertCreateAfterCreation(id, link) {

    clearAllFormFields(id);

    if((settings.create[id].dialog) || $('#' + id).hasClass('dialog'))  {
        $('#overlay').hide();
        $('#' + id).hide();
    } else {
    }

}
function submitCreate(wsIdNew, sections, elemParent, settings, callback) {

    if(!validateForm(elemParent)) {
    
        showErrorMessage('Error', 'Field validations do not permit creation');
        callback();
    
    } else {

        if(isBlank(settings)) settings = {};

        let params = { 
            wsId       : wsIdNew,
            sections   : sections,
            getDetails : settings.getDetails,
            fields     : getFieldValues(elemParent),
            image      : getImagePayload(elemParent)
        };
        
        let requestsDerived = [];

        if(!isBlank(settings)) {
            if(!isBlank(settings.derived)) {

                for(let derivedField of settings.derived) {

                    for(let section of params.sections) {
                        for(let field of section.fields) {
                            if(field.fieldId === derivedField.source) {
                    
                                requestsDerived.push($.get('/plm/derived', {
                                    wsId        : wsIdNew,                         //'create item wsid
                                    fieldId     : derivedField.source,             //'BASE_ITEM'
                                    pivotItemId : field.value.link.split('/')[6]   //'dmsid of selected picklist ittem;
                                }));

                                break;

                            }
                        }
                    }

                }

            }
        }

    // if(!isBlank(idMarkup)) {

    //     let elemMarkupImage = $('#' + idMarkup);

    //     if(elemMarkupImage.length > 0) {
    //         params.image = {
    //             'fieldId' : elemParent.attr('data-field-id-markup'),
    //             'value'   : elemMarkupImage[0].toDataURL('image/jpg')
    //         }
    //     }

    // }

        if(requestsDerived.length > 0) requestsDerived.unshift($.get('/plm/sections', { wsId : wsIdNew }))

        Promise.all(requestsDerived).then(function(responses) {

            if(responses.length > 0) {
                let sections = responses[0].data;
                for(let index = 1; index < responses.length; index++) {
                    addDerivedFieldsToPayload(params.sections, sections, responses[index].data);
                }
            }

            $.post({
                url         : '/plm/create', 
                contentType : 'application/json',
                data        : JSON.stringify(params)
            }, function(response) {

                if(response.error) {
                    showErrorMessage('Error creating item', response.data.errorMessage);
                    callback();
                } else {
                    let result = {};
                    result.link = (settings.getDetails) ? response.data.__self__ : response.data.split('.autodeskplm360.net')[1];
                    result.data = (settings.getDetails) ? response.data : {};
                    callback(result);
                }
                
            });

        });

    }

}
function getFieldValues(elemParent, filter) {

    let fields = [];

    if(isBlank(filter)) filter = '';

    elemParent.find('.field-value' + filter).each(function() {

        let elemField = $(this);
        let included  = elemField.hasClass('field-editable') || elemField.hasClass('field-locked');  // field-locked is used when fields are disabled per contextItem* parameters
        let fieldData = getFieldValue(elemField);

        if(included) {

            if(typeof fieldData.value !== 'undefined') {
                if(fieldData.type !== 'image') {
                    fields.push(fieldData);
                }
            }

            if(elemField.hasClass('field-type-image')) {
                let elemCanvas = elemField.children('canvas');
                if(elemCanvas.length > 0) {
                    
                }
            }
        }

    });

    return fields;

}
// function getSectionsPayload(elemParent) {

//     let sections = [];

//     elemParent.find('.section-fields').each(function() {

//         let elemSection = $(this);

//         let section = {
//             id     : elemSection.attr('data-id'),
//             fields : []
//         };

//         elemSection.find('.field-value').each(function() {

//             let elemField = $(this);
//             let included  = elemField.hasClass('field-editable') || elemField.hasClass('field-locked');  // field-locked is used when fields are disabled per contextItem* parameters
//             let fieldData = getFieldValue(elemField);

//             if(included) {

//                 // if(!elemField.hasClass('multi-picklist')) {
//                     // if(fieldData.value !== null) {
//                         if(typeof fieldData.value !== 'undefined') {
//                             if(fieldData.type !== 'image') {
//                                 section.fields.push(fieldData);
//                             }
//                         }
//                     // }
//                 // }

//                 // }

//                 if(elemField.hasClass('field-type-image')) {
//                     let elemCanvas = elemField.children('canvas');
//                     if(elemCanvas.length > 0) {
                        
//                     }
//                 }
//             }

//         });

//         if(section.fields.length > 0) sections.push(section);

//     });

//     return sections;

// }
function getFieldValue(elemField) {

    // Returns basic link value for picklist fields instead of object as 
    // processing will be performed in the create/edit wrapper call

    let elemInput = elemField.find('input');
    let value     = (elemInput.length > 0) ? elemInput.val() : '';
    // let hasSelect = (elemField.find('select').length > 0);

    let result = {
        fieldId   : elemField.attr('data-id'),
        link      : elemField.attr('data-link'),
        title     : elemField.attr('data-title'),
        typeId    : elemField.attr('data-type-id'),
        value     : value,
        display   : value,
        type      : elemField.attr('data-type') || 'string'
    }

    switch(elemField.attr('data-type')) {

        case 'string':
        case 'date':
        case 'url':
        case 'email':
            break;

        case 'integer':
            if(result.value === '') result.value = null; else result.value = Number(result.value);
            break;

        case 'float':
        case 'money':
            if(result.value === '') result.value = null; else result.value = parseFloat(result.value);
            break;

        case 'paragraph':
        case 'paragraph-nlb':
        case 'csv':
            result.value = elemField.find('textarea').val();
            break;

        case 'checkbox':
            elemInput = elemField.children('.checkbox')
            result.value = (elemInput.hasClass('icon-check-box-checked')) ? 'true' : 'false';
            break;

        case 'radio':
            let selected = elemField.find('.radio-option.selected');
            if(selected.length === 0) result.value = null; else result.value = selected.attr('data-link');
            break;

        case 'buom':
        case 'single-select':
            result.value = elemField.find('.picklist-input').first().attr('data-value');
            break;

        case 'multi-select':
            result.value = [];
            elemField.find('.picklist-selected-item').each(function() {
                result.value.push($(this).attr('data-link'));
            });
            if(result.value.length === 0) result.value = null;
            break;

        default : 

            // if(elemField.hasClass('image')) {
            //     result.type = 'image';
            // } else if(elemField.hasClass('paragraph')) {
            //     value           = elemField.find('textarea').val();
            //     result.value    = value;
            //     result.display  = value;
            // } else if(elemField.hasClass('radio')) {
            //     result.type  = 'picklist';
            //     result.value = null;
            //     elemField.find('input').each(function() {
            //     // elemField.children().each(function() {
            //         if($(this).prop('checked')) {
            //             result.value    = { 'link' : $(this).attr('value') };
            //             result.display  = $(this).siblings('label').first().html();
            //             result.type     = 'picklist';
            //         }
            //     });
            // } else if(elemField.hasClass('single-picklist')) {
            //     result.type  = 'single selection';
            //     result.value = elemInput.attr('data-value') || null;
            // } else if(elemField.hasClass('multi-picklist')) {
            //     result.value = [];
            //     elemField.find('.picklist-selected-item').each(function () {
            //         result.value.push({ link : $(this).attr('data-link')});
            //     });
            //     if(result.value.length === 0) result.value = null;
            // } else if(hasSelect) {
            //     elemInput = elemField.find('select');
            //     result.type ='picklist';
            //     if(elemInput.val() === '') {
            //         result.value = null;
            //     } else {
            //         result.value = {
            //             'link' : elemInput.val()
            //         };
            //         result.display = elemInput.val();
            //     }
            // } else if(elemField.hasClass('filtered-picklist')) {
            //     if(result.value === '') result.value = null; else result.value = { 'title' : result.value };
            //     result.type = 'filtred-picklist';
            // } else if(elemField.hasClass('float')) {
            //     if(result.value === '') result.value = null; else result.value = parseFloat(result.value);
            //     result.type = 'float';
            // } else if(elemField.hasClass('integer')) {
            //     if(result.value === '') result.value = null; else result.value = Number(result.value);
            //     result.type = 'integer';
            // } else if(elemField.hasClass('checkbox')) {
            //     result.value = (elemInput.is(':checked')) ? 'true' : 'false';
            // }

            break;
    }

    return result;

}
function getImagePayload(elemParent) {

    let result = null;

    elemParent.find('canvas.viewer-screenshot').each(function() {
        let elemField = $(this).closest('.field-value');
        result = {
            fieldId : elemField.attr('data-id'),
            value   : $(this)[0].toDataURL('image/jpg')
        }
    });


    return result;


    // if(!isBlank(idMarkup)) {

    //     let elemMarkupImage = $('#' + idMarkup);

    //     if(elemMarkupImage.length > 0) {
    //         params.image = {
    //             'fieldId' : elemParent.attr('data-field-id-markup'),
    //             'value'   : elemMarkupImage[0].toDataURL('image/jpg')
    //         }
    //     }

    // }


    // let sections = [];

    // elemParent.find('.section-fields').each(function() {

    //     let section = {
    //         'id'        : $(this).attr('data-id'),
    //         'fields'    : []
    //     };

    //     $(this).find('.field.editable').each(function() {

    //         let elemField = $(this).children('.field-value').first();
    //         let fieldData = getFieldValue(elemField);
            
    //         // if(!elemField.hasClass('multi-picklist')) {
    //             if(fieldData.value !== null) {
    //                 if(typeof fieldData.value !== 'undefined') {
    //                     if(fieldData.value !== '') {
    //                         section.fields.push({
    //                             fieldId   : fieldData.fieldId,
    //                             link      : fieldData.link,
    //                             value     : fieldData.value,
    //                             type      : fieldData.type,
    //                             title     : fieldData.title,
    //                             typeId    : fieldData.typeId,
    //                         });
    //                     }
    //                 }
    //             }
    //         // }

    //         if(elemField.hasClass('image')) {
    //             let elemCanvas = elemField.children('canvas');
    //             if(elemCanvas.length > 0) {
                    
    //             }
    //         }

    //     });

    //     if(section.fields.length > 0) sections.push(section);

    // });

    // return sections;

}
function validateForm(elemForm) {

    let result = true;

    $('.required-empty').removeClass('required-empty');

    elemForm.find('.field-value').each(function() {

        if($(this).parent().hasClass('required')) {

            let elemInput = $(this);
            let fieldData = getFieldValue($(this));

            if (isBlank(fieldData.value)) {
                elemInput.addClass('required-empty');
                result = false;
            }
        }
       
    });
    
    return result;
    
}
function clearAllFormFields(id) {

    let elemForm = $('#' + id);

    elemForm.find('.field-value').each(function() {
        $(this).children().val('');
    });

    elemForm.find('.radio-option').removeClass('selected');
    elemForm.find('.radio-option.default').click();
    elemForm.find('.picklist-input').val('');

}



// Insert Item Details
function insertDetails(link, params) {

    if(isBlank(link)) return;
    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'details' : params.id;
    
    settings.details[id] = getPanelSettings(link, params, {
        headerLabel : 'Details',
        layout      : 'normal'
    }, [
        [ 'bookmark'           , false ],
        [ 'cloneable'          , false ],
        [ 'cloneDialog'        , false ],
        [ 'expandSections'     , []    ],
        [ 'hideComputed'       , false ],
        [ 'hideLabels'         , false ],
        [ 'hideReadOnly'       , false ],
        [ 'hideSections'       , false ],
        [ 'picklistLimit'      , 10    ],
        [ 'picklistShortcuts'  , true  ],
        [ 'requiredFieldsOnly' , false ],
        [ 'saveButtonLabel'    , 'Save'],
        [ 'suppressLinks'      , false ],
        [ 'toggles'            , false ],
        [ 'workflowActions'    , false ],
        [ 'sectionsIn'         , [] ],
        [ 'sectionsEx'         , [] ],
        [ 'sectionsOrder'      , [] ],
        [ 'afterCloning'       , function(id, link) { console.log('New item link : ' + link ); } ]
    ]);

    settings.details[id].load = function() { insertDetailsData(id); }

    genPanelTop(id, settings.details[id], 'details');
    genPanelHeader(id, settings.details[id]);
    genPanelToggleButtons(id, settings.details[id], function() {
        $('#' + id + '-content').find('.section.collapsed').click();
    }, function() {
        $('#' + id + '-content').find('.section.expanded').click();
    });
    genPanelBookmarkButton(id, settings.details[id]);
    genPanelCloneButton(id, settings.details[id]);
    genPanelOpenInPLMButton(id, settings.details[id]);
    genPanelWorkflowActions(id, settings.details[id]);
    genPanelSearchInput(id, settings.details[id]);
    genPanelResizeButton(id, settings.details[id]);
    genPanelReloadButton(id, settings.details[id]);

    genPanelContents(id, settings.details[id]).addClass(settings.details[id].layout).addClass('sections');

    if(settings.details[id].cloneDialog) {

        genPanelFooterActionButton(id, settings.details[id], 'clone-cancel', {
            label   : 'Cancel',
            title   : 'Cancel',
            default : false
        }, function() {             
            $('#overlay').hide();
            $('#' + id).hide();
        });

        genPanelFooterActionButton(id, settings.details[id], 'clone-confirm', {
            label   : 'Clone',
            title   : 'Create clone in PLM',
            default : true
        }, function() {           
            appendOverlay(false);  
            submitClone(id, function(url) {
                $('#overlay').hide();
                $('#' + id).hide();
                settings.details[id].afterCloning(id, url);
            });
        });

    } else if(settings.details[id].editable) {

        genPanelFooterActionButton(id, settings.details[id], 'save', {

            label   : settings.details[id].saveButtonLabel,
            title   : 'Save changes to PLM',
            default : true

        }, function() { 

            appendOverlay(false);
            submitEdit(settings.details[id].link, settings.details[id].sections, $('#' + id + '-content'), function() {
                $('#overlay').hide();
            });

        });

    }

    insertDetailsDone(id);

    settings.details[id].load();

}
function insertDetailsDone(id) {}
function insertDetailsData(id) {

    settings.details[id].timestamp = startPanelContentUpdate(id);

    let requests = [ 
        $.get('/plm/details' , { link : settings.details[id].link, timestamp : settings.details[id].timestamp }),
        $.get('/plm/sections', { wsId : settings.details[id].link.split('/')[4], useCache : settings.details[id].useCache }),
        $.get('/plm/fields'  , { wsId : settings.details[id].link.split('/')[4], useCache : settings.details[id].useCache })
    ];

    if((settings.details[id].bookmark) ) requests.push($.get('/plm/bookmarks'  , { link : settings.details[id].link }));
    if((settings.details[id].cloneable)) requests.push($.get('/plm/permissions', { link : settings.details[id].link }));
    if((settings.details[id].picklistShortcuts)) {
        requests.push($.get('/plm/bookmarks'));
        requests.push($.get('/plm/recent'));
    }

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.details[id])) return;

        settings.details[id].sections   = responses[1].data;
        settings.details[id].descriptor = responses[0].data.title;

        setPanelBookmarkStatus(id, settings.details[id], responses);
        setPanelCloneStatus(id, settings.details[id], responses);

        if(settings.details[id].workflowActions) {
            insertWorkflowActions(settings.details[id].link, {
                id : id + '-workflow-actions',
                hideIfEmpty : true,
                onComplete : function() { settings.details[id].load() }
            });
        }

        let bookmarks = [];
        let recents   = [];

        if((settings.details[id].picklistShortcuts)) {
            bookmarks = responses[responses.length - 2].data.bookmarks;
            recents   = responses[responses.length - 1].data.recentlyViewedItems;
        }

        insertDetailsFields(id, responses[1].data, responses[2].data, responses[0].data, settings.details[id], bookmarks, recents, function() {
            finishPanelContentUpdate(id, settings.details[id]);
            insertDetailsDataDone(id, responses[1].data, responses[2].data, responses[0].data);
        });


    });

}
function insertDetailsFields(id, sections, fields, data, settings, bookmarks, recents, callback) {

    $('#' + id + '-processing').hide();

    if(isBlank(settings)) settings = {};

    let elemContent = $('#' + id + '-content');
    let sectionsIn  = settings.sectionsIn;
    let sectionsEx  = settings.sectionsEx;
    let fieldsIn    = settings.fieldsIn;
    let fieldsEx    = settings.fieldsEx;
    let fieldValues = (isBlank(settings.fieldValues)) ? [] : settings.fieldValues;

    elemContent.scrollTop();
    settings.derived = [];

    if(isBlank(settings.expandSections  )) settings.expandSections   = [];
    if(isBlank(settings.collapseContents)) settings.collapseContents = false;
    if(isBlank(settings.firstSectionOnly)) settings.firstSectionOnly = false;
    if(isBlank(settings.editable        )) settings.editable         = false;

    if(!settings.editable   ) elemContent.addClass('readonly');    
    if(settings.hideSections) elemContent.addClass('sections-hidden');    

    if(!isBlank(settings.sectionsOrder)) {

        let sort = 1;

        for(let orderedSection of settings.sectionsOrder) {
            for(let section of sections) {
                if(orderedSection === section.name) {
                    section.order = sort++;
                }
            }
        }

        for(let section of sections) {
            if(isBlank(section.order)) {
                section.order = sort++;
            }
        }

        sortArray(sections, 'order', 'Integer');

    }

    if(settings.firstSectionOnly) {

        if(sectionsIn.length > 0) {
            
            sectionsIn.splice(1, sectionsIn.length - 1);
            
        } else if(sectionsEx.length > 0) {

            for(let section of sections) {
                if(!sectionsEx.includes(section.name)) {
                    sectionsIn.push(section.name);
                    break;
                }
            }

        } else {

            sectionsIn.push(sections[0].name);

        }

    } 

    for(let section of sections) {
        section.visible = false;
        if(sectionsIn.length === 0 || sectionsIn.includes(section.name)) {
            if(sectionsEx.length === 0 || !sectionsEx.includes(section.name)) {
                section.visible = true;
            }
        }
    }

    let allVisibleSectionsFields = getAllVisibleSectionsFieldIDs(sections);

    for(let field of fields) {

        field.id       = field.urn.split('.').pop();
        field.visible  = false;
        field.required = isFieldRequired(field);

        if(!settings.requiredFieldsOnly || field.required) {
            if(fieldsIn.length === 0 || fieldsIn.includes(field.id)) {
                if(fieldsEx.length === 0 || !fieldsEx.includes(field.id)) {
                    for(let section of allVisibleSectionsFields) {
                        if(section.fields.includes(field.id)) {
                            field.visible = true;
                            break;
                        }
                    }
                }
            }
        }

    }

    getFieldsPicklistsData(settings, fields, function(picklistsData) {

        if(settings.editable) {

            for(let field of fields) {

                if(!isBlank(field.derived)) {
                    if(field.derived) {

                        let source = field.derivedFieldSource.__self__.split('/')[8];
                        let isNew  = true;

                        for(let derived of settings.derived) {
                            if(derived.source === source) {
                                isNew = false;
                                break;
                            }
                        }

                        if(isNew) {
                            settings.derived.push({
                                fieldId : field.__self__.split('/').pop(),
                                source  : source
                            });
                        }
                        
                    }
                }

            }
        }


    // Promise.all(picklistsRequests).then(function(responses) {
       
        // for(let response of responses) {
            // picklistsData.push({
                // link       : response.params.link,
                // items      : response.data.items,
                // totalCount : response.data.totalCount
            // })
        // }

        for(let section of sections) {

            if(!section.visible) continue;

            let sectionId   = section.__self__.split('/')[6];
            let isNew       = true;
            let sectionLock = false;
            let className   = (settings.collapseContents) ? 'collapsed' : 'expanded';
            let elemSection = $('<div></div>');

            if(!isBlank(settings.expandSections)) {
                if(settings.expandSections.length > 0) {
                    className = (settings.expandSections.includes(section.name)) ? 'expanded' : 'collapsed';
                }
            }

            if(!isBlank(data)) {
                if(!isBlank(data.sections)) {
                    for(let dataSection of data.sections) {
                        if(sectionId === dataSection.link.split('/')[10]) {
                            sectionLock = dataSection.sectionLocked;
                        }
                    }
                }
            }

            if(!settings.hideSections) {

                for(let cacheSection of cacheSections) {
                    if(cacheSection.link === id + section.__self__) {
                        isNew     = false;
                        className = cacheSection.className;
                    }
                }

                if(isNew) {
                    cacheSections.push({
                        link      : id + section.__self__, 
                        className : className
                    })
                }

                elemSection = $('<div></div>').appendTo(elemContent)
                    .attr('data-urn', section.urn)
                    .attr('data-link', section.__self__)
                    .addClass('section')
                    .addClass(className)
                    .html(section.name)
                    .attr('title', 'Keep the [Shift] key pressed when clicking this section to toggle all sections at once')
                    .click(function(e) {
                        
                        $(this).next().toggle();
                        $(this).toggleClass('expanded').toggleClass('collapsed');

                        if (e.shiftKey) {
                            if($(this).hasClass('expanded')) {
                                $(this).siblings('.section').addClass('expanded').removeClass('collapsed');
                                $(this).siblings('.section-fields').show();
                            } else {
                                $(this).siblings('.section').removeClass('expanded').addClass('collapsed');
                                $(this).siblings('.section-fields').hide();
                            }
                        }
    
                        for(let cacheSection of cacheSections) {
                            if(cacheSection.link === id + $(this).attr('data-link')) {
                                cacheSection.className = $(this).hasClass('expanded') ? 'expanded' : 'collapsed';
                            }
                        }

                    });

            }

            let elemFields = $('<div></div>').appendTo(elemContent)
                .addClass('section-fields')
                .attr('data-id', sectionId);

            if(className !== 'expanded') elemFields.toggle();

            if((section.type === 'CLASSIFICATION') && (!isBlank(data))) {

                let sectionId = section.__self__.split('/').pop();

                for(let dataSection of data.sections) {

                    let dataSectionId = dataSection.link.split('/').pop();

                    if(dataSectionId === sectionId) {

                        elemSection.html(section.name + ' : ' + dataSection.classificationName);

                        for(let dataSectionField of dataSection.fields) {

                            let fieldId = dataSectionField.__self__.split('/').pop();

                            if(fieldsIn.length === 0 || fieldsIn.includes(fieldId)) {
                                if(fieldsEx.length === 0 || !fieldsEx.includes(fieldId)) {

                                    let wsField = {
                                        name            : dataSectionField.title,
                                        type            : dataSectionField.type,
                                        unitOfMeasure   : null,
                                        urn             : dataSectionField.urn,
                                        value           : dataSectionField.value,
                                        visibility      : 'ALWAYS'
                                    };

                                    wsField.type.title = 'Single Line Text';
                                    insertDetailsField(wsField, data, elemFields, settings, sectionLock, bookmarks, recents, picklistsData);

                                }
                            }
                        }
                    }
                }
                
            } else {

                for(let sectionField of section.fields) {

                    let fieldId  = sectionField.link.split('/')[8];
                    let included = false;

                    if(sectionField.type === 'MATRIX') {
                        for(let matrix of section.matrices) {
                            if(matrix.urn === sectionField.urn) {
                                for(let matrixFields of matrix.fields) {
                                    for(let matrixField  of matrixFields) {
                                        if(matrixField !== null) {
                                            for(let wsField of fields) {
                                                
                                                if(wsField.urn === matrixField.urn) {
                                                    // let matrixFieldId = matrixField.link.split('/').pop();
                                                    if(wsField.visible) {
                                                    // if(fieldsIn.length === 0 || fieldsIn.includes(matrixFieldId)) {
                                                        // if(fieldsEx.length === 0 || !fieldsEx.includes(matrixFieldId)) {
                                                            insertDetailsField(wsField, data, elemFields, settings, sectionLock, bookmarks, recents, picklistsData);
                                                            included = true;
                                                        // }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        for(let wsField of fields) {
                            if(wsField.urn === sectionField.urn) {
                                if(wsField.visible) {
                                    insertDetailsField(wsField, data, elemFields, settings, sectionLock, bookmarks, recents, picklistsData);
                                    included = true;
                                }
                            }
                        }
                    }

                // if(sectionField.derived) included = false;

                    if(!included) {
                        for(let fieldValue of fieldValues) {
                            for(let wsField of fields) {
                                if(wsField.urn === sectionField.urn) {
                                    if(fieldValue.fieldId === fieldId) {
                                        insertHiddenDetailsField(wsField, elemFields, fieldValue);
                                    }
                                }
                            }
                        }
                    }


                }
            }

            if(elemFields.children().length === 0) {
                elemFields.remove();
                elemSection.remove();
            }

        }

        insertAllPicklistData(settings, picklistsData, elemContent);

        callback();

    });

}
function submitEdit(link, sections, elemParent, callback) {

    if(!validateForm(elemParent)) {

        showErrorMessage('Error', 'Field validations are not met');
        callback();

    } else {

        let params = { 
            link     : link,
            sections : sections,
            fields   : getFieldValues(elemParent, '.changed')
        };

        console.log(params);

        if(params.fields.length === 0) callback();
        else {
            $.post('/plm/edit', params, function(response) {
                elemParent.find('.field-value.changed').removeClass('changed');
                callback(response);
            });
        }
    }
        
}
function getFieldsPicklistsData(settings, fields, callback) {
    
    if(!settings.editable) { callback([]); return; }
    if(isBlank(settings.contextItemFields)) settings.contextItemFields = [];

    let picklistsData     = [];
    let picklistsLinks    = [];
    let picklistsRequests = [];    

    for(let field of fields) {

        let fieldId   = field.urn.split('.').pop();
        let fieldName = field.name;

        if(fieldId !== settings.contextItemField) {
            if(!settings.contextItemFields.includes(fieldId)) {
                if(field.visibility !== 'NEVER') {
                    if(field.editability !== 'NEVER') {
                        if(isBlank(field.visible)) field.visible = true;
                        if(field.visible) {
                            if(settings.fieldsIn.length === 0 || settings.fieldsIn.includes(fieldId) || settings.fieldsIn.includes(fieldName)) {
                                if(settings.fieldsEx.length === 0 || ((!settings.fieldsEx.includes(fieldId)) && (!settings.fieldsEx.includes(fieldName)))) {
                                    if(!isBlank(field.picklist)) {
                                        if(!picklistsLinks.includes(field.picklist)) {
                                            picklistsLinks.push(field.picklist);
                                            if(field.type.title === 'Radio Button') {
                                                let useCache = isBlank(field.picklistFieldDefinition) ? settings.useCache : false;
                                                let limit    = isBlank(field.picklistFieldDefinition) ? 100 : 15;
                                                picklistsRequests.push($.get('/plm/picklist', { link : field.picklist, limit : limit, useCache : useCache }));
                                            } else {
                                                picklistsData.push({
                                                    link       : field.picklist,
                                                    items      : [],
                                                    totalCount : -1
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Promise.all(picklistsRequests).then(function(responses) {   
        for(let response of responses) {
            picklistsData.push({
                link       : response.params.link,
                items      : response.data.items,
                totalCount : response.data.totalCount
            });
        }
        callback(picklistsData);
    });

}
function insertAllPicklistData(settings, picklistsData, elemContent) {

    let requests = [];

    for(let picklist of picklistsData) {

        let params     = { 
            link  : picklist.link, 
            limit : settings.picklistLimit 
        }


        if(picklist.totalCount < 0) requests.push($.get('/plm/picklist', params))
    }

    Promise.all(requests).then(function(responses) {

        for(let picklist of picklistsData) {
            for(let response of responses) {
                if(response.params.link === picklist.link) {
                    picklist.items = response.data.items;
                    picklist.totalCount = response.data.totalCount;
                }
            }
        }

        elemContent.find('input.picklist-input').each(function() {
            updatePickListOptions($(this), 0, false, picklistsData);
        });

    });

}
function getAllVisibleSectionsFieldIDs(sections) {

    let results = [];

    for(let section of sections) {

        if(section.visible) {

            let newSection = {
                link   : section.__self__,
                fields : []
            };

            for(let field of section.fields) {
                if(field.type === 'MATRIX') {
                    for(let matrix of section.matrices) {
                        if(matrix.urn === field.urn) {
                            for(let matrixFields of matrix.fields) {
                                for(let matrixField  of matrixFields) {
                                    if(matrixField !== null) {
                                        let matrixFieldId = matrixField.link.split('/').pop();
                                        newSection.fields.push(matrixFieldId)
                                    }
                                }
                            }
                        }
                    }
                } else {
                    let fieldId = field.urn.split('.').pop();
                    newSection.fields.push(fieldId);
                }
            }

            results.push(newSection);

        }

    }

    return results;

}
function insertDetailsField(field, data, elemFields, settings, sectionLock, bookmarks, recents, picklistsData) {

    if(!field.visible) return;

    if(isBlank(settings)) {
        settings = {
            hideComputed      : false,
            hideReadOnly      : false,
            hideLabels        : false,
            suppressLinks     : false,
            editable          : false,
            picklistShortcuts : false,
            fieldsIn          : []
        }
    } else {
        if(isBlank(settings.fieldsIn)) settings.fieldsIn = [];
    }

    let hideComputed    = (isBlank(settings.hideComputed)) ? false : settings.hideComputed;
    let hideReadOnly    = (isBlank(settings.hideReadOnly)) ? false : settings.hideReadOnly;
    let hideLabels      = (isBlank(settings.hideLabels  )) ? false : settings.hideLabels;
    let suppressLinks   = (isBlank(settings.suppressLink)) ? false : settings.suppressLinks;
    let editable        = (isBlank(settings.editable    )) ? false : settings.editable;

    if(field.visibility === 'NEVER') return;
    if((field.editability === 'NEVER') && hideReadOnly) return;
    if(field.formulaField  && hideComputed) return;

    let value    = null;
    let urn      = field.urn.split('.');
    // let fieldId  = urn[urn.length - 1];
    let readonly = (!settings.editable || field.editability === 'NEVER' || (field.editability !== 'ALWAYS' && (typeof data === 'undefined')) || field.formulaField);
    // let required = isFieldRequired(field, fieldId, settings);

    if(sectionLock) { readonly = true; editable = false; }

    if(readonly) editable = false;

    // if(!required && settings.requiredFieldsOnly) return;

    let elemField = $('<div></div>').addClass('field').addClass('content-item').attr('id', 'field-' + field.id);
    let elemValue = $('<div></div>');
    let elemInput = $('<input>');

    // setFieldDataAndClasses(elemValue, field, settings.editable); // moved to function insertField

    if(!hideLabels) $('<div></div>').appendTo(elemField).addClass('field-label').html(field.name);

    if(!isBlank(data)) {
        for(let nextSection of data.sections) {
            for(let itemField of nextSection.fields) {
                if(itemField.hasOwnProperty('urn')) {
                    let urn = itemField.urn.split('.');
                    let itemFieldId = urn[urn.length - 1];
                    if(field.id === itemFieldId) {
                        value = itemField.value;
                        break;
                    }
                }
            }
        }
    }

    if(isBlank(value)) {
        if(field.hasOwnProperty('value')) value = field.value;
    }

    if(typeof value === 'undefined') value = null;

    insertField(settings, elemValue, field, data, picklistsData, bookmarks, recents);

    /*switch(field.type.title) {

        case 'Auto Number':
            value = (value !== null) ? value : '';
            if(editable) {            
                elemValue.addClass('auto-number');
                elemValue.addClass('string');
                elemValue.append(elemInput);
                elemInput.val(value);
            } else {
                elemValue.html(value);
            }
            break;

        case 'Single Line Text':
            elemValue.addClass('single-line-text');
            if(field.formulaField) {
                elemValue.addClass('computed');
                elemValue.addClass('no-scrollbar');
                elemValue.html($('<div></div>').html(value).text());
            } else {
                elemValue.addClass('string');
                value = (value === null) ? '' : value;
                if(editable) {
                    elemInput.val(value);
                    if(field.fieldLength !== null) {
                        elemInput.attr('maxlength', field.fieldLength);
                        elemInput.css('max-width', field.fieldLength * 8 + 'px');
                    }
                    elemValue.append(elemInput);
                } else {
                    elemValue.html(value);
                }
            }
            break;

        case 'Paragraph':
            elemValue.addClass('paragraph');
            if(editable) {
                elemInput = $('<textarea></textarea>');
                elemValue.append(elemInput);
                // if(value !== null) elemValue.val($('<div></div>').html(value).text());
                if(value !== null) elemInput.html(value);
            } else {
                elemValue.html($('<div></div>').html(value).text());
            }
            break;

        case 'URL':
            elemValue.addClass('url');
            if(editable) {
                elemValue.append(elemInput);
                if(value !== null) elemInput.val(value);
            } else {
                elemInput = $('<div></div>');
                elemValue.addClass('link');
                elemValue.append(elemInput);
                if(value !== '') {
                    elemInput.attr('onclick', 'window.open("' + value + '")');
                    elemInput.html(value);
                }
            }
            break;

        case 'Integer':
            if(value === null) value = '';
            if(editable) {
                elemValue.addClass('integer');
                elemValue.append(elemInput);
                elemInput.val(value);
            } else {
                elemValue.html(value);
            }
            break;
            
        case 'Float':
        case 'Money':
            if(value === null) value = '';
            if(editable) {
                elemValue.addClass('float');
                elemValue.append(elemInput);
                elemInput.val(value);
            } else {
                elemValue.html(value);
            }
            break;

        case 'Date':
            if(editable) {
                elemInput.attr('type', 'date');
                elemValue.addClass('date');
                elemValue.append(elemInput);
                if(value !== null) elemInput.val(value);
            } else {
                if(value !== null) {
                    var date = new Date(value);
                    value = date.toLocaleDateString();
                }
                elemValue.html(value);
            }
            break;
            
        case 'Check Box':
            elemInput.attr('type', 'checkbox');
            elemValue.addClass('checkbox');
            elemValue.append(elemInput);
            if(value !== null) if(value === 'true') elemInput.attr('checked', true);
            break;

        case 'Single Selection':
        case 'Multiple Selection':
            elemValue.addClass((field.type.title === 'Multiple Selection') ? 'multi-picklist' : 'single-picklist');
            if(editable) {

                if(field.type.title === 'Multiple Selection') {
                    let elemControls = $('<div></div>').appendTo(elemValue).addClass('picklist-controls');
                    elemControls.append(elemInput);
                    insertFieldPicklistControls(field, elemControls, elemInput, settings, field.picklistFieldDefinition, value, bookmarks, recents);
                    $('<div></div>').appendTo(elemValue).addClass('picklist-selected-items').addClass('hidden');
                } else {
                    elemValue.append(elemInput);
                    insertFieldPicklistControls(field, elemValue, elemInput, settings, field.picklistFieldDefinition, value, bookmarks, recents);
                }

                updatePickListOptions(elemInput, 0, false, picklistsData);

            } else if(field.type.title === 'Multiple Selection') {

                if(value !== null) {
                    for(optionValue of value) {
                        let elemOption = $('<div></div>');
                            elemOption.attr('data-link', optionValue.link);
                            elemOption.html(optionValue.title);
                            elemOption.appendTo(elemValue);
                            if(!suppressLinks) {
                                elemOption.addClass('picklist-selected-item');
                                elemOption.click(function() { openItemByLink($(this).attr('data-link')); });
                            }
                    }
                }

            } else {
                elemValue = $('<div></div>');
                elemValue.addClass('string');
                if(value !== null) {
                    elemValue.html(value.title);
                    if(field.type.link === '/api/v3/field-types/23') {
                        elemValue.attr('data-item-link', value.link);
                        if(!suppressLinks) {
                            elemValue.addClass('link');
                            elemValue.attr('onclick', 'openItemByURN("' + value.urn + '")');
                        }
                    }
                }
                if(field.type.link === '/api/v3/field-types/23') elemValue.addClass('linking');
            }
            break;

        // case 'Multiple Selection':
        //     elemValue.addClass('multi-picklist');
        //     console.log(field);
        //         if(value !== null) {
        //             for(optionValue of value) {
        //                 let elemOption = $('<div></div>');
        //                     elemOption.attr('data-link', optionValue.link);
        //                     elemOption.html(optionValue.title);
        //                     elemOption.appendTo(elemValue);
        //                     if(!suppressLinks) {
        //                         elemOption.addClass('field-multi-picklist-item');
        //                         elemOption.click(function() { openItemByLink($(this).attr('data-link')); });
        //                     }
        //             }
        //         }
        //     break;

        case 'Filtered':
            if(editable) {
                
                elemValue.addClass('filtered-picklist').append(elemInput);
                elemInput.attr('data-filter-list', field.picklist)
                    .attr('data-filter-field', field.picklistFieldDefinition.split('/')[8])
                    .addClass('filtered-picklist-input')
                    .click(function() {
                        getFilteredPicklistOptions($(this));
                    });
                
                if(value !== null) elemInput.val(value);
                
                $('<div></div>').appendTo(elemValue)
                    .addClass('filtered-picklist-options');
                
                $('<div></div>').appendTo(elemValue)
                    .addClass('icon')
                    .addClass('icon-close')
                    .addClass('xxs')
                    .click(function() {
                        clearFilteredPicklist($(this));
                    });

            } else {
                elemValue = $('<div></div>');
                elemValue.addClass('string')
                if(value !== null) {
                    if(typeof value === 'string') elemValue.html(value);
                    else elemValue.html(value.title);
                    if(field.type.link === '/api/v3/field-types/23') {
                        elemValue.attr('onclick', 'openItemByURN("' + value.urn + '")')
                            .attr('data-item-link', value.link)
                            .addClass('link');
                    }
                }
                if(field.type.link === '/api/v3/field-types/23') elemValue.addClass('linking');
            }
            break;

        case 'BOM UOM Pick List':
            if(editable) {
                
                elemInput = $('<select>');
                elemValue.addClass('picklist');
                elemValue.append(elemInput);

                let elemOptionBlank = $('<option></option>');
                    elemOptionBlank.attr('value', null);
                    elemOptionBlank.appendTo(elemInput);

                getPickListOptions(elemInput, field.picklist, fieldId, 'select', value, picklistsData);

            } else {
                elemInput = $('<div></div>');
                elemValue.addClass('string');
                elemValue.append(elemInput);

                if(value !== null) {
                    elemInput.html(value.title);
                    if(field.type.link === '/api/v3/field-types/28') {
                        elemInput.attr('data-item-link', value.link);
                    }
                }
                if(field.type.link === '/api/v3/field-types/28') elemValue.addClass('bom-uom');
            }
            break;

        case 'Image':
            elemValue.addClass('drop-zone');
            elemValue.addClass('image');
            getImageField(elemValue, value);
            break;

        case 'Radio Button':
            if(editable) {
                elemValue = $('<div></div>');
                elemValue.addClass('radio');
                getPickListOptions(elemValue, field.picklist, fieldId, 'radio', value, picklistsData);
            } else {
                // elemValue = $('<input>');
                // elemValue.addClass('string');
                if(value !== null) elemValue.html(value.title);
            }
            break;

        default:

            if(!isBlank(field.defaultValue)) {
                elemValue.val(field.defaultValue);
            }

            break;

    }*/

    elemValue.addClass('field-value');

    // elemValue.attr('data-id'        , fieldId);
    // elemValue.attr('data-title'     , field.name);
    // elemValue.attr('data-link'      , field.__self__);
    // elemValue.attr('data-type-id'   , field.type.link.split('/')[4]);

    if(readonly) {
        elemInput.attr('readonly', true);
        elemInput.attr('disabled', true);
        // elemValue.addClass('readonly');    
        // elemField.addClass('readonly');    
    } else {
        // elemField.addClass('editable');               

        if(field.hasOwnProperty('fieldValidators')) {
            if(field.fieldValidators !== null) {
                for(let validator of field.fieldValidators) {
                    if(validator.validatorName === 'required') {
                        elemField.addClass('required');
                    } else if(validator.validatorName === 'dropDownSelection') {
                        elemField.addClass('required');
                    } else if(validator.validatorName === 'maxlength') {
                        elemValue.attr('maxlength', validator.variables.maxlength);
                    }
                }
            }
        }

    }
    
    if(hideLabels) {
        if(elemFields !== null) elemValue.appendTo(elemFields); 
        return elemValue;
    } else {
        elemValue.appendTo(elemField);
        if(elemFields !== null) elemField.appendTo(elemFields);
        return elemField;
    }
    
}
function insertField(settings, elemParent, field, data, picklistsData, bookmarks, recents) {

    if(field.visibility === 'NEVER') return null;

    if(isBlank(field.id)) field.id = field.urn.split('.').pop();

    let value     = getFieldValueFromResponseData(field.id, data) || '';
    let editable  = (isBlank(settings.editable)) ? false : settings.editable;
    let elemInput = $('<input>').attr('data-id', field.id);

    
    settings.readonly = (field.editability === 'NEVER') || (field.formulaField) || (field.type.title === 'Image') || false;

    if(settings.readonly) editable = false;

    setFieldDataAndClasses(elemParent, field, settings.editable);

        // console.log(value + ' : ' + editable + ' : ' + field.type.title);

    if(!editable) {

        if(value === null) value = '';

        if(field.unitOfMeasure !== null) value += ' ' + field.unitOfMeasure;

        switch(field.type.title) {

            case 'Auto Number':
                elemParent.html(value);
                break;
            
            case 'Single Line Text':
                if(field.formulaField) {
                    elemParent.addClass('field-computed');
                    elemParent.addClass('no-scrollbar');
                    elemParent.html($('<div></div>').html(value).text());
                } else elemParent.html(value);
                break;

            case 'Date':
                if(!isBlank(value)) {
                    var date = new Date(value);
                    elemParent.html(date.toLocaleDateString());
                }
                break;

            case 'Integer':
                elemParent.html(value);
                break;

            case 'Float':
            case 'Money':
                value = (value !== '') ? parseFloat(value).toFixed(field.fieldPrecision) : '';
                if(value !== '' ) { if(field.unitOfMeasure !== null) value += ' ' + field.unitOfMeasure; }
                elemParent.html(value);
                break;

            case 'Paragraph':
            case 'Paragraph w/o Line Breaks':
                elemParent.html(value);
                break;

            case 'Check Box':
                insertFieldCheckBox(elemParent, value, editable);
                break; 

            case 'URL':
                elemParent.html(value);
                if(!isBlank(value)) elemParent.click(function() { 
                    let url = $(this).html();
                        if(url.indexOf('http') < 0) url = 'https://' + url;
                        window.open(url);
                });
                break;

            case 'Email':
                elemParent.html(value);
                if(!isBlank(value)) elemParent.click(function() { window.open('mailto:' + value); });
                break;

            case 'CSV':
                elemParent.html(value);
                break;
 

            case 'Radio Button':
                if(!isBlank(value)) elemParent.html(value.title);
                if(!isBlank(field.picklistFieldDefinition)) {
                    if(!settings.suppressLinks) {
                        elemParent.addClass('with-link');
                        elemParent.click(function() { openItemByLink(value.link); })
                    }
                }
                break; 

            case 'Single Selection':
                elemParent.addClass('nowrap');
                if(!isBlank(value)) elemParent.html(value.title);
                if(!isBlank(field.picklistFieldDefinition)) {
                    if(!settings.suppressLinks) {
                        elemParent.addClass('with-link');
                        elemParent.click(function() { openItemByLink(value.link); })
                    }
                }
                break;           

            case 'Multiple Selection':
                let elemList = $('<div></div>').addClass('picklist-selected-items').appendTo(elemParent);
                for(let item of value) {
                    $('<div></div>').appendTo(elemList).addClass('picklist-selected-item').addClass('nowrap').html(item.title).attr('data-link', item.link);
                }
                if(!isBlank(field.picklistFieldDefinition)) {
                    if(!settings.suppressLinks) {
                        elemList.children().addClass('with-link');
                        elemList.children().click(function() {  
                            openItemByLink($(this).attr('data-link'));
                        });
                    }
                }
                break;  

            case 'Image':
                insertFieldImage(elemParent, value);
                break;

            case 'BOM UOM Pick List':
                if(!isBlank(value)) elemParent.html(value.title);
                break;     

            default : 
                console.log('insertField ReadOnly');
                console.log(field);
                console.log(value);
                console.log(field.type.title);
                break;
        }

    } else {
    
        switch(field.type.title) {

            case 'Single Line Text':
                elemInput.appendTo(elemParent).addClass('single-line-text');
                elemInput.on('keyup', function() { 
                    $(this).parent().addClass('changed');
                    if($(this).val() !== '') $(this).parent().removeClass('required-empty');
                });
                if(!isBlank(value)) elemInput.val(value);
                break;            

            case 'Date':
                elemInput.appendTo(elemParent).attr('type', 'date').addClass('date');
                elemInput.on('change', function() { $(this).parent().addClass('changed')});
                if(!isBlank(value)) {
                    if(value.indexOf('/') > -1) {
                        let split = value.split('/');
                        value = split[2] + '-' + split[0] + '-' + split[1];
                    }
                    elemInput.val(value);
                }
                break;

            case 'Integer':
                elemInput.appendTo(elemParent).addClass('integer');
                elemInput.attr('type', 'number');
               
                elemInput.on('keyup', function() { $(this).parent().addClass('changed')});
                if(!isBlank(value)) elemInput.val(value);
                break;

            case 'Float':
            case 'Money':
                value = (value !== '') ? parseFloat(value).toFixed(field.fieldPrecision) : '';
                elemInput.appendTo(elemParent).addClass('float');
                elemInput.attr('type', 'number');
                elemInput.on('keyup', function() { $(this).parent().addClass('changed')});
                if(!isBlank(value)) elemInput.val(value);
                break;

            case 'Paragraph':
            case 'Paragraph w/o Line Breaks':
            case 'CSV':
                elemInput = $('<textarea></textarea');
                elemInput.appendTo(elemParent).addClass('paragraph');
                elemInput.on('keyup', function() { $(this).parent().addClass('changed')});
                if(!isBlank(value)) elemInput.val(value);
                break;

            case 'Check Box':
                insertFieldCheckBox(elemParent, value, editable);
                break;

            case 'URL':
                elemInput.appendTo(elemParent).addClass('url');
                elemInput.on('keyup', function() { $(this).parent().addClass('changed')});
                if(!isBlank(value)) elemInput.val(value);
                $('<div></div>').appendTo(elemParent)
                    .attr('title', 'Open URL in new tab')
                    .addClass('field-action')
                    .addClass('button')
                    .addClass('icon')
                    .addClass('icon-open').click(function() {
                        let url = $(this).prev().val();
                        if(url.indexOf('http') < 0) url = 'https://' + url;
                        window.open(url);
                    });
                break;

            case 'Email':
                elemInput.appendTo(elemParent).addClass('email');
                elemInput.on('keyup', function() { $(this).parent().addClass('changed')});
                if(!isBlank(value)) elemInput.val(value);
                $('<div></div>').appendTo(elemParent)
                    .attr('title', 'Click to send new mail to the given address')
                    .addClass('field-action')
                    .addClass('button')
                    .addClass('icon')
                    .addClass('icon-send').click(function() {
                        window.open('mailto:' + $(this).prev().val());
                    });                
                break;

            case 'Radio Button':
                elemInput = insertFieldRadios(field, picklistsData, value);
                elemInput.appendTo(elemParent).addClass('radio');
                break;

            case 'Single Selection':
            case 'Multiple Selection':
            case 'BOM UOM Pick List':
                elemInput = insertFieldPicklistControls(settings, field, elemParent, value, bookmarks, recents);
                updatePickListOptions(elemInput, 0, false, picklistsData);
                break;

            default : 
                console.log('insertField : Unsuppoorted field.type');
                console.log(field);
                break;

        }

        if(field.unitOfMeasure !== null) {
            $('<div></div>').appendTo(elemParent)
                .addClass('field-unit')
                .html(field.unitOfMeasure);
        }

        if(field.required) elemInput.addClass('column-required');

    }

    return elemInput; 
  
}
function setFieldValue(elemField, value, display) {

    if(elemField.hasClass('field-type-single-select')) {
        
        let elemInput = elemField.find('.picklist-input');
            elemInput.val(display).attr('data-value', value);


    } else if(elemField.hasClass('field-type-radio')) {

        let elemSelected  = elemField.find('.radio-option.selected');
        let valueSelected = '';

        if(elemSelected.length > 0) valueSelected = elemSelected.attr('data-link');

        if(valueSelected !== value) {
            elemSelected.removeClass('selected');
            elemField.find('.radio-option').each(function() {
                if($(this).attr('data-link') === value) $(this).addClass('selected');
            });
        }

    } else if(elemField.hasClass('field-type-checkbox')) {
    } else elemField.children().val(value);

}
function getFieldValueFromResponseData(fieldId, data) {

    if(isBlank(data)) return null;

    if(data.hasOwnProperty('sections')) {

        for(let section of data.sections) {
            for(let field of section.fields) {
                if(!isBlank(field.__self__)) {
                    let id = field.__self__.split('/').pop();
                    if(id === fieldId) return field.value;
                }
            }
        }

    } else {
        for(let field of data) {
            let id = '';
            if(!isBlank(field.urn)) id = field.urn.split('.').pop();
            else if(!isBlank(field.__self__)) id = field.__self__.split('/').pop();
            if(id === fieldId) return field.value;
        }
    }

    return null;

}
function setFieldDataAndClasses(elem, field, editable) {

    let fieldId  = field.fieldId || field.urn.split('.').pop();
    let readonly = (field.editability === 'NEVER') || (field.formulaField) || false;

    elem.attr('data-id'     , fieldId);
    elem.attr('data-link'   , field.__self__);
    elem.attr('data-title'  , field.name);
    elem.attr('data-type-id', field.type.link.split('/').pop());

    elem.addClass('field-id-' + fieldId);

    if(readonly) editable = false;
    if(editable) elem.addClass('field-editable'); else elem.addClass('field-readonly');
    if(field.unitOfMeasure !== null) elem.addClass('field-with-unit');
    if(field.type.title === 'URL'  ) elem.addClass('field-with-action');
    if(field.type.title === 'Email') elem.addClass('field-with-action');

    switch(field.type.title) {

        case 'Single Line Text'         : elem.attr('data-type', 'string'       ); elem.addClass('field-type-string'       ); break;
        case 'Date'                     : elem.attr('data-type', 'date'         ); elem.addClass('field-type-date'         ); break;
        case 'Integer'                  : elem.attr('data-type', 'integer'      ); elem.addClass('field-type-integer'      ); break;
        case 'Float'                    : elem.attr('data-type', 'float'        ); elem.addClass('field-type-float'        ); break;
        case 'Money'                    : elem.attr('data-type', 'money'        ); elem.addClass('field-type-money'        ); break;
        case 'Paragraph'                : elem.attr('data-type', 'paragraph'    ); elem.addClass('field-type-paragraph'    ); break;
        case 'Paragraph w/o Line Breaks': elem.attr('data-type', 'paragraph-nlb'); elem.addClass('field-type-paragraph-nlb'); break;
        case 'Check Box'                : elem.attr('data-type', 'checkbox'     ); elem.addClass('field-type-checkbox'     ); break;
        case 'URL'                      : elem.attr('data-type', 'url'          ); elem.addClass('field-type-url'          ); break;
        case 'Email'                    : elem.attr('data-type', 'email'        ); elem.addClass('field-type-email'        ); break;
        case 'CSV'                      : elem.attr('data-type', 'csv'          ); elem.addClass('field-type-csv'          ); break;
        case 'Radio Button'             : elem.attr('data-type', 'radio'        ); elem.addClass('field-type-radio'        ); break;
        case 'Single Selection'         : elem.attr('data-type', 'single-select'); elem.addClass('field-type-single-select'); break;
        case 'Multiple Selection'       : elem.attr('data-type', 'multi-select' ); elem.addClass('field-type-multi-select' ); break;
        case 'Image'                    : elem.attr('data-type', 'image'        ); elem.addClass('field-type-image'        ); break;
        case 'BOM UOM Pick List'        : elem.attr('data-type', 'buom'         ); elem.addClass('field-type-buom,'        ); break;

    }

}
function insertFieldCheckBox(elemParent, value, editable) {

    let elemCheckbox = $('<div></div>').appendTo(elemParent)
        .addClass('checkbox')
        .addClass('icon');
        
    if((value !== null) && (value === 'true')) elemCheckbox.addClass('icon-check-box-checked').addClass('filled'); else elemCheckbox.addClass('icon-check-box');

    if(editable) elemCheckbox.parent().click(function() {
        $(this).children().first().toggleClass('filled')
            .toggleClass('icon-check-box')
            .toggleClass('icon-check-box-checked');

        let elemCell = $(this).closest('.field-editable');

        if(elemCell.length > 0) {
            elemCell.addClass('changed');
            elemCell.parent().addClass('changed');
        }

    })


}
function insertFieldRadios(field, picklistsData, value) {

    let elemInput     = $('<div></div>').addClass('radio-options');
    let picklistItems = [];

    for(let picklist of picklistsData ) {
        if(picklist.link === field.picklist) {
            picklistItems = picklist.items;
            break;
        }
    }

    for(let option of picklistItems) {

        let elemRadioOption = $('<div></div>').appendTo(elemInput)
            .addClass('radio-option')
            .attr('data-link', option.link)
            .click(function() {
                
                let elemCell = $(this).closest('td.field-editable');
                if(elemCell.length > 0) {
                    elemCell.addClass('changed');
                    elemCell.parent().addClass('changed');
                }

                $(this).toggleClass('selected');
                $(this).siblings().removeClass('selected');
                $(this).closest('.field-value').addClass('changed');
                if($(this).hasClass('selected')) {
                    $(this).closest('.field-value').removeClass('required-empty');
                }
                
            });

        if(option.link === value.link) elemRadioOption.addClass('selected').addClass('default');

        $('<div></div>').appendTo(elemRadioOption)
            .addClass('icon')
            .addClass('radio-icon');

        $('<div></div>').appendTo(elemRadioOption)
            .addClass('radio-label')
            .html(option.title)
    
    }

    return elemInput;

}
function insertFieldImage(elemParent, value) {

    if(isBlank(value)) return;
    
    $.get('/plm/image', { link : value.link }, function(response) {
                                
        $("<img class='thumbnail' src='data:image/png;base64," + response.data + "'>").appendTo(elemParent);
                                
    });
    
}
function insertFieldPicklistControls(settings, field, elemParent, value, bookmarks, recents) {
    
    let elemControls = $('<div></div>').addClass('picklist-controls').appendTo(elemParent);
    let elemList     = $('<div></div>').addClass('picklist-selected-items').addClass('hidden');
    
    if(field.type.title === 'Multiple Selection') {
        elemList.appendTo(elemParent);
        elemControls.addClass('picklist-multi-select');
    }

    let elemInput = $('<input></input>').appendTo(elemControls)
        .addClass('picklist-input')
        .attr('data-last-filter', '')
        .attr('placeholder', 'Type to search')
        .attr('data-picklist', field.picklist)
        .attr('data-picklist-ws', field.picklistFieldDefinition || '')
        .keyup(function(e) {
            if(e.key === 'Tab') return;
            else if(e.key === 'Escape') return;
            $(this).addClass('filtering');
            updatePickListOptions($(this), 0, true);
        })
        .focus(function() {
            elemInput.next().removeClass('hidden');
        });

    if(!isBlank(value)) {
        if(field.type.title === 'Multiple Selection') {
            if(value.length > 0) {
                for(let item of value) insertPicklistSelectedItem(settings, elemList, item.link, item.title);
                elemList.removeClass('hidden');
            }
        } else if(typeof value === 'string') {
            elemInput.val(value);
            elemInput.attr('data-value', value);
        } else {
            elemInput.val(value.title);
            elemInput.attr('data-value', value.link);
        }
    }

    let elemPicklist = $('<div></div>').appendTo(elemControls)
        .addClass('picklist')
        .addClass('query')
        .addClass('no-scrollbar')
        .addClass('hidden')
        .attr('data-limit', settings.picklistLimit || '10')
        .attr('data-offset', 0);
        
    let elemActions = $('<div></div>').appendTo(elemControls)
        .addClass('picklist-actions');

    if(settings.picklistShortcuts) {
        if(!isBlank(field.picklistFieldDefinition)) {
            if(bookmarks.length > 0 || recents.length > 0) {

                elemActions.addClass('with-shortcuts');

                let workspace = field.picklistFieldDefinition.split('/views/')[0];
                let matches   = [];

                for(let recent of recents) {
                    if(recent.item.link.indexOf(workspace) === 0) matches.push({
                        link  : recent.item.link,
                        title : recent.item.title,
                        icon  : 'icon-history'
                    })
                }

                for(let bookmark of bookmarks) {
                    if(bookmark.item.link.indexOf(workspace) === 0) matches.push({
                        link  : bookmark.item.link,
                        title : bookmark.item.title,
                        icon  : 'icon-bookmark-off'
                    })
                }

                if(matches.length > 0) {

                    $('<div></div>').appendTo(elemActions)
                        .addClass('button')
                        .addClass('icon')
                        .addClass('icon-clipboard-add')
                        .addClass('pickklist-open-shortcuts')
                        .attr('title', 'Insert from bookmarks or recent items');
                        
                    let elemShortcuts = $('<div></div>').appendTo(elemControls)
                        .addClass('picklist')
                        .addClass('shortcuts')
                        .addClass('hidden');
                        
                    let elemShortcutOptions = $('<div></div>').appendTo(elemShortcuts).addClass('picklist-options');

                    for(let match of matches) {

                        let elemShortcut = $('<div></div>').appendTo(elemShortcutOptions)
                            .addClass('picklist-option')
                            .addClass('picklist-option-shortcut')
                            .attr('data-link', match.link)
                            .attr('value', match.link)
                            .attr('displayValue', match.title)
                            .click(function() {
                                selectPicklistValue($(this));
                            });

                        $('<div></div>').appendTo(elemShortcut).addClass('picklist-option-icon').addClass('icon').addClass(match.icon);
                        $('<div></div>').appendTo(elemShortcut).addClass('picklist-option-title').html(match.title);

                    }

                }

            }
        }
    }

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-cancel')
        .attr('title', 'Clear field')
        .click(function(e) {

            e.preventDefault();
            e.stopPropagation();

            let elemInput = $(this).parent().siblings('input').first();
            let elemCell  = $(this).closest('td.field-editable');

            if(elemCell.length > 0) {
                elemCell.addClass('changed');
                elemCell.parent().addClass('changed');
            }
            
            elemInput.val('')
                .attr('data-value', '')
                .attr('data-last-filter', '')
                .removeClass('filtering')
                .next().removeClass('no-matches');

            updatePickListOptions(elemInput, 0, false);

            let elemControls = $(this).closest('.picklist-controls');
            let elemSelected = elemControls.siblings('.picklist-selected-items');
            
            if(elemSelected.length > 0) {
                elemSelected.children().remove();
                elemSelected.addClass('hidden');
            }
           
            $(this).parent().siblings('.picklist').find('.picklist-option').removeClass('hidden');
            $(this).closest('.field-value').addClass('changed');

        });

    $('<div></div>').appendTo(elemPicklist).addClass('picklist-options').addClass('no-scrollbar').addClass('pos-abs-max');
    $('<div></div>').appendTo(elemPicklist).addClass('picklist-no-data').addClass('with-icon').addClass('icon-important').html('No matching entires');
    
    let elemUpdate     = $('<div></div>').appendTo(elemPicklist).addClass('picklist-update').addClass('pos-abs-max').addClass('hidden');
    let elemProcessing = $('<div></div>').appendTo(elemUpdate).addClass('processing');

    $('<div></div>').addClass('bounce1').appendTo(elemProcessing);
    $('<div></div>').addClass('bounce2').appendTo(elemProcessing);
    $('<div></div>').addClass('bounce3').appendTo(elemProcessing);

    let elemFooter = $('<div></div>').appendTo(elemPicklist).addClass('picklist-footer').addClass('pos-abs-bottom');
    
    $('<div></div>').appendTo(elemFooter).addClass('picklist-counter');

    $('<div></div>').appendTo(elemFooter)
        .addClass('picklist-next')
        .addClass('button')
        .addClass('default')
        .addClass('with-icon')
        .addClass('icon-chevron-right')
        .html('Next')
        .click(function() {
            let elemPicklist = $(this).closest('.picklist');
            let elemInput    = elemPicklist.prev();
            let isUpdate     = elemInput.attr('data-last-filter') !== '';
            updatePickListOptions(elemPicklist.prev(), elemPicklist.find('.picklist-option').length, isUpdate);
        });    

    return elemInput;

}
function updatePickListOptions(elemInput, offset, isUpdate, picklistsData) {

    let elemPicklist = elemInput.next();
    let filterValue  = elemInput.val().toLowerCase();

    if(elemInput.val() === '') elemInput.removeClass('filtering');

    if(elemPicklist.length === 0) return;
    if(!elemPicklist.hasClass('picklist')) return;

    if(offset === 0) {
        if(filterValue !== '') {
            if(filterValue === elemInput.attr('data-last-filter')) {
                return;
            }
        }
    }

    if(isUpdate) elemInput.attr('data-value', '');

    if(!isBlank(picklistsData)) {
        for(let picklistData of picklistsData) {
            if(picklistData.link === elemInput.attr('data-picklist')) {
                updatePickListOptionsList(elemPicklist, picklistData, offset, '');
                break;
            }
        }
    } else if(elemPicklist.hasClass('static')) {

        elemInput.attr('data-last-filter', filterValue);

        elemPicklist.find('.picklist-option').each(function() {
            
            let elemOption  = $(this);
            let valueOption = elemOption.html().toLowerCase();
            
            if(valueOption.includes(filterValue)) elemOption.removeClass('hidden'); else elemOption.addClass('hidden');

        });    
        
        let countTotal  = elemPicklist.find('.picklist-option').length;
        let countHidden = elemPicklist.find('.picklist-option.hidden').length;

        if(countTotal === countHidden) elemPicklist.addClass('no-matches'); else elemPicklist.removeClass('no-matches'); 

    } else {

        let elemUpdate = elemPicklist.find('.picklist-update');
        let timestamp  = new Date().getTime();
        let params     = { 
            link       : elemInput.attr('data-picklist'), 
            filter     : (isUpdate) ? filterValue : '', 
            limit      : elemPicklist.attr('data-limit'), 
            offset     : offset,
            timestamp  : timestamp
        }

        elemInput.attr('data-last-filter', params.filter.toLowerCase());
        elemUpdate.removeClass('hidden');
        
        $.get('/plm/picklist', params, function(response) {

            if(response.error) {}

            if(response.params.timestamp == timestamp) {
                if((!isUpdate) || (response.params.filter === elemInput.val())) {
                    
                    if(offset === 0) elemPicklist.find('.picklist-option').remove();
                    
                    elemUpdate.addClass('hidden');

                    updatePickListOptionsList(elemPicklist, response.data, offset, params.filter);

                }
            }

        });        
    }

}
function updatePickListOptionsList(elemPicklist, picklistData, offset, filter) {

    if(picklistData.totalCount === -1) return;

    let elemOptions       = elemPicklist.find('.picklist-options');
    let elemCounter       = elemPicklist.find('.picklist-counter');
    let elemControls      = elemOptions.closest('.picklist-controls');
    let multiSelect       = elemControls.hasClass('picklist-multi-select');
    let elemSelectedItems = elemControls.find('.picklist-selected-items');
    let elemLast          = null;

    for(let option of picklistData.items) {

        let title = option.title;

        if(!isBlank(option.version)) title += ' ' + option.version;

        let elemOption = $('<div></div>').appendTo(elemOptions)
            .addClass('picklist-option')
            .addClass('picklist-option-result')
            .attr('id', option.link)
            .attr('value', option.link)
            .attr('displayValue', title)
            .click(function() {
                selectPicklistValue($(this));
            });

        $('<div></div>').appendTo(elemOption)
            .addClass('picklist-option-counter')
            .html(elemOptions.children().length);

        if(multiSelect) {
            
            let checked      = false;
            let elemCheckbox = $('<div></div>').appendTo(elemOption).addClass('icon').addClass('picklist-option-checkbox');
                
            elemSelectedItems.children().each(function() {
                if($(this).attr('data-link') === option.link) checked = true;
            });

            if(checked) {
                elemCheckbox.addClass('filled').addClass('icon-check-box-checked');
            } else {
                elemCheckbox.addClass('icon-check-box');
            }
        }

        $('<div></div>').appendTo(elemOption)
            .addClass('picklist-option-title')
            .html(title);

        elemLast  = elemOption;

    }

    if(elemLast !== null) elemLast.get(0).scrollIntoView({ behavior : 'smooth', block: 'nearest', inline: 'start' });
        
    let countAll    = elemPicklist.find('.picklist-option').length;
    let countHidden = elemPicklist.find('.picklist-option.hidden').length;

    if(countAll === picklistData.totalCount) {
        if(offset === 0) {
            if(filter === '') {
                elemPicklist.addClass('static'); 
                elemPicklist.css('min-height', ((countAll * 29) - 1) + 'px');
            }
        }
    }

    if(!elemPicklist.hasClass('static')) {

        let limit = Number(elemPicklist.attr('data-limit'));
        elemPicklist.css('min-height', ((limit * 29) + 61) + 'px');
        elemPicklist.addClass('with-footer'); 
        // elemCounter.html('Displaying ' + countAll + ' of ' + picklistData.totalCount + ' results');
        // elemCounter.html(picklistData.totalCount + ' total matches');
        elemCounter.html(countAll + ' of ' + picklistData.totalCount + ' results');

        let elemButtonNext = elemPicklist.find('.picklist-next');

        if(countAll === picklistData.totalCount) {
            elemButtonNext.addClass('hidden');
        } else {
            elemButtonNext.removeClass('hidden');
        }

    } 

    if(countAll === countHidden) elemPicklist.addClass('no-matches'); else elemPicklist.removeClass('no-matches'); 



}
function selectPicklistValue(elemClicked) {

    let elemControls    = elemClicked.closest('.picklist-controls');
    let elemPicklist    = elemClicked.closest('.picklist');
    let isMultiPicklist = elemControls.hasClass('picklist-multi-select');

    elemClicked.closest('.field-value').addClass('changed');

    if(isMultiPicklist) {

        let elemList   = elemControls.siblings('.picklist-selected-items');
        let elemCheck  = elemClicked.find('.picklist-option-checkbox');
        let isShortcut = elemClicked.hasClass('picklist-option-shortcut')
        let add        = isShortcut;

        if(!isShortcut) {
            elemCheck.toggleClass('icon-check-box-checked').toggleClass('filled').toggleClass('icon-check-box');
            add = elemCheck.hasClass('icon-check-box-checked');
        } else {
            let link = elemClicked.attr('data-link');
            $('.picklist-option-result').each(function() {
                if($(this).attr('value') === link) {
                    let elemIcon = $(this).find('.picklist-option-checkbox');
                    elemIcon.addClass('filled').addClass('icon-check-box-checked').removeClass('icon-check-box');
                }
            });
        }
        
        if(!add) {
            elemList.children().each(function() {
                if($(this).attr('data-link') === elemClicked.attr('value')) $(this).remove();
            });
        } else {
            elemList.children().each(function() {
                if($(this).attr('data-link') === elemClicked.attr('value')) add = false;
            });
        }

        if(add) insertPicklistSelectedItem({}, elemList, elemClicked.attr('value'), elemClicked.attr('displayValue'));
        if(elemList.children().length === 0) elemList.addClass('hidden'); 

    } else {
    
        let elemInput = elemPicklist.siblings('input').first();
            elemInput.val(elemClicked.attr('displayValue'));
            elemInput.attr('data-value', elemClicked.attr('value'));
            elemInput.removeClass('filtering');

        elemPicklist.addClass('hidden');

        let elemCell = elemInput.closest('td.field-editable');

        if(elemCell.length > 0) {
            elemCell.addClass('changed');
            elemCell.parent().addClass('changed');
        }

    }   

}
function insertPicklistSelectedItem(settings, list, link, displayValue) {

    if(isBlank(settings.suppressLinks)) settings.suppressLinks = false;

    let item = $('<div></div>').appendTo(list)
        .addClass('picklist-selected-item')
        .attr('data-link', link);

    if(!settings.suppressLinks) {
        item.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            openItemByLink($(this).attr('data-link'));
        });
    }
        
    $('<div></div>').appendTo(item)
        .addClass('picklist-selected-item-title')
        .html(displayValue);

    list.removeClass('hidden');

    if(!settings.readonly) {

        $('<div></div>').appendTo(item)
            .addClass('picklist-selected-item-remove')
            .addClass('icon')
            .addClass('icon-cancel')
            .click(function(e) {

                e.preventDefault();
                e.stopPropagation();

                let elemClicked     = $(this).closest('.picklist-selected-item');
                let link            = elemClicked.attr('data-link');
                let elemFieldValue  = $(this).closest('.field-value');
                let elemList        = $(this).closest('.picklist-selected-items');

                elemFieldValue.find('.picklist-option').each(function() {
                    if(link === $(this).attr('value')) {
                        let elemCheckbox = $(this).find('.picklist-option-checkbox');
                        $(elemCheckbox).removeClass('filled').removeClass('icon-check-box-checked').addClass('icon-check-box');
                    }
                });
                elemFieldValue.addClass('changed');
                elemClicked.remove();
                if(elemList.children().length === 0) elemList.addClass('hidden');

        });

    }

}
function isFieldRequired(field) {

    if(!isBlank(field.validations)) {
        for(let validation of field.validations) {
            if(validation.validatorName === 'required') {
                return true;
            } else if(validation.validatorName === 'dropDownSelection') {
                return true;
            }
        }
    }

    if(isBlank(field.fieldValidators)) return false;

    for(let validator of field.fieldValidators) {
        if(validator.validatorName === 'required') {
            return true;
        } else if(validator.validatorName === 'dropDownSelection') {
            return true;
        }
    }

    return false;

}
function getEditableFields(fields, insertOptions) {

    let result = [];

    if(typeof insertOptions === 'undefined') insertOptions = true;

    for(let field of fields) {

        if(field.editability === 'ALWAYS') {
            if(field.type !== null) {

                let elemControl = null;
                let required    = field.required || false;
                let maxLength   = null;
                let fieldId     = ('fieldId' in field) ? field.fieldId : field.__self__.split('/')[8];

                switch(field.type.title) {

                    case 'Check Box': 
                        elemControl = $('<input>');
                        elemControl.attr('type', 'checkbox');
                        break;

                    case 'Date':
                        elemControl = $('<input>');
                        elemControl.attr('type', 'date');
                        break;

                    case 'Float': 
                    case 'Integer': 
                    case 'Single Line Text': 
                        elemControl = $('<input>');
                        break;

                    case 'Paragraph':
                        elemControl = $('<textarea>');
                        break;

                    case 'Radio Button': 
                    case 'Single Selection': 
                        elemControl = $('<select>');
                        elemControl.addClass('picklist');
                        if(insertOptions) {
                            $('<option></option>').appendTo(elemControl).attr('value', null);
                            getPickListOptions(elemControl, field.picklist, fieldId, 'select', '', []);
                        }
                        break;

                }

                if(field.hasOwnProperty('fieldValidators')) {
                    if(field.fieldValidators !== null) {
                        for(let validator of field.fieldValidators) {
                            if(validator.validatorName === 'required') {
                                required = true;
                            } else if(validator.validatorName === 'dropDownSelection') {
                                required = true;
                            } else if(validator.validatorName === 'maxlength') {
                                maxLength = validator.variables.maxlength;
                            }
                        }
                    }
                }

                result.push({
                    id          : fieldId,
                    title       : field.name,
                    link        : field.__self__,
                    type        : field.type.title,
                    typeId      : field.type.link.split('/')[4],
                    validators  : field.validators || '',
                    required    : required,
                    maxLength   : maxLength,
                    picklist    : field.picklist || '',
                    control     : elemControl
                });

            }
        }

    }

    return result;

}
function getPickListOptions(elemParent, link, fieldId, type, value, picklistsData) {

    for(let picklist of picklistsData) {
        if(picklist.link === link) {
            insertPickListOptions(elemParent, picklist.items, fieldId, type, value);
            return;
        }
    }

    $.get( '/plm/picklist', { link : link, limit : 25, offset : 0 }, function(response) {

        if(!response.error) {

            let isNew = true;

            for(let picklist of cachePicklists) {
                if(picklist.link === link) {
                    isNew = false;
                    continue;
                }
            }

            if(isNew) {
                cachePicklists.push({
                    link : link,
                    data : response.data
                });
            }

            insertPickListOptions(elemParent, response.data.items, fieldId, type, value);
        }
    });

}
function insertPickListOptions(elemParent, picklistItems, fieldId, type, value) {
       
    if(type === 'radio') {

        for(let option of picklistItems) {

            let index = $('.radio').length + 1;

            let elemRadio = $('<div></div>').appendTo(elemParent)
                .addClass('radio-option')
                .attr('name', fieldId + '-' + index);

            let elemInput = $('<input>').appendTo(elemRadio)
                .attr('type', 'radio')
                .attr('id', option.link)
                .attr('value', option.link)
                .attr('name', fieldId + '-' + index);

            $('<label></label>').appendTo(elemRadio)
                .addClass('radio-label')
                .attr('for', fieldId + '-' + index)
                .html(option.title);

            if(!isBlank(value)) {
                if(!value.hasOwnProperty('link')) {
                    if(value === option.title) elemInput.prop('checked', true);
                } else if(value.link === option.link) {
                    elemInput.prop('checked', true);
                }
            }
        }

    } else if(type === 'select') {

        for(let option of picklistItems) {

            let title = option.title;

            if(!isBlank(option.version)) title += ' ' + option.version;

            let elemOption = $('<option></option>').appendTo(elemParent)
                .attr('id', option.link)
                .attr('value', option.link)
                .attr('displayValue', title)
                .html(title);

            if(!isBlank(value)) {
                if(!value.hasOwnProperty('link')) {
                    if(value === option.title) elemOption.attr('selected', true);
                } else if(value.link === option.link) {
                    elemOption.attr('selected', true);
                }   
            }

        }
    


    }

}
function getFilteredPicklistOptions(elemClicked) {

    $('.filtered-picklist-options').html('').hide();

    let listName = elemClicked.attr('data-filter-list');
    let elemList = elemClicked.next();
    let filters  = [];

    elemClicked.addClass('filter-list-refresh');

    $('.filtered-picklist-input').each(function() {
        if(listName === $(this).attr('data-filter-list')) {
            let value = $(this).val();
            if(!isBlank(value)) {
                filters.push([ $(this).parent().attr('data-id'), $(this).val() ]);
            }
        }
    });
    
    $.get( '/plm/filtered-picklist', { 
        link    : elemClicked.parent().attr('data-link'), 
        filters : filters, 
        limit   : 100, 
        offset  : 0 
    }, function(response) {
        elemClicked.removeClass('filter-list-refresh');
        if(!response.error) {
            for(let item of response.data.items) {
                $('<div></div>').appendTo(elemList)
                    .html(item)
                    .click(function() {
                        $(this).parent().hide();
                        $(this).parent().prev().val($(this).html());
                    });
            }
            elemList.show();
        }
    });   

}
function insertHiddenDetailsField(field, elemFields, fieldValue) {

    // insert fields that must not be shown but have predefined values to be set as defined by setting fieldValues

    let elemField = $('<div></div').appendTo(elemFields)
        .addClass('field')
        .addClass('content-item')
        .addClass('editable')
        .hide();

    let elemLabel = $('<div></div>').appendTo(elemField);

    let elemValue = $('<div></div>').appendTo(elemField)
        .addClass('field-value')
        .attr('data-id', fieldValue.fieldId)
        .attr('data-title', field.name)
        .attr('data-link', field.__self__)
        .attr('data-type-id', field.type.link.split('/')[4]);

    let elemInput = $('<input>').val(fieldValue.value);

    switch(field.type.title) {

        case 'Single Line Text':
            elemValue.addClass('single-line-text');
            break;

        case 'Single Selection':
            elemValue.addClass('single-picklist').addClass('picklist');
            elemInput = $('<select>');
            $('<option></option>').appendTo(elemInput).attr('value', fieldValue);
            break;

    }

    elemInput.appendTo(elemValue)

}
function insertDetailsDataDone(id, sections, fields, data) {}



// Insert Clone Dialog
function insertClone(link, params) {

    if(isBlank(link)) return;
    if(isBlank(params)) params = {};

    params.id           = 'clone-dialog';
    params.headerLabel  = 'Clone';
    params.bookmark     = false;
    params.cloneable    = false;
    params.cloneDialog  = true;
    params.editable     = true;
    params.layout       = 'normal';
    params.openInPLM    = false;

    params.toggles = (isBlank(params.toggles)) ? true : params.toggles;
    
    insertDetails(link, params);

}
function submitClone(id, callback) {

    $('#' + id + '-processing').show();
    $('#' + id + '-footer').hide();

    let elemContent = $('#' + id + '-content');
        elemContent.hide();

    let params = { 
        link     : settings.details[id].link,
        sections : getSectionsPayload(elemContent)
    };

    $.post('/plm/clone', params, function(response) {
        console.log(response);
        $('#' + id + '-footer').show();
        let url = response.data.split('.autodeskplm360.net');
        callback(url);
    });

}


// Insert all image field images
function insertImages(link, params) {

    if(isBlank(link)) return;
    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'images' : params.id;
    
    settings.images[id] = getPanelSettings(link, params, {
        headerLabel : 'Images'
    }, [
        [ 'layout'     , 'grid' ],
        [ 'contentSize', 'm'    ],
        [ 'sectionsIn' , []     ],
        [ 'sectionsEx' , []     ]
    ]);

    settings.images[id].load = function() { insertImagesData(id); }

    genPanelTop(id, settings.images[id], 'images');
    genPanelHeader(id, settings.images[id]);
    genPanelBookmarkButton(id, settings.images[id]);
    genPanelOpenInPLMButton(id, settings.images[id]);
    genPanelReloadButton(id, settings.images[id]);
    genPanelContents(id, settings.images[id]).addClass('panel-images');

    insertImagesDone(id);

    settings.images[id].load();

}
function insertImagesDone(id) {}
function insertImagesData(id) {

    settings.images[id].timestamp = startPanelContentUpdate(id);

    let requests = [ 
        $.get('/plm/details' , { link : settings.images[id].link, timestamp : settings.images[id].timestamp })
    ];

    if((settings.images[id].bookmark) ) requests.push($.get('/plm/bookmarks', { link : settings.images[id].link }));

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.images[id])) return;

        let sectionsIn   = settings.images[id].sectionsIn;
        let sectionsEx   = settings.images[id].sectionsEx;
        let fieldsIn     = settings.images[id].fieldsIn;
        let fieldsEx     = settings.images[id].fieldsEx;
        let elemContent  = $('#' + id + '-content');

        settings.images[id].descriptor = responses[0].data.title;

        setPanelBookmarkStatus(id, settings.images[id], responses);

        for(let section of responses[0].data.sections) {

            if(sectionsIn.length === 0 || sectionsIn.includes(section.name)) {
                if(sectionsEx.length === 0 || !sectionsEx.includes(section.name)) {

                    for(let field of section.fields) {

                        let fieldId  = field.__self__.split('/')[10];

                        if(fieldsIn.length === 0 || fieldsIn.includes(fieldId)) {
                            if(fieldsEx.length === 0 || !fieldsEx.includes(fieldId)) {

                                if(field.type.link === '/api/v3/field-types/15') {
                                    if(!isBlank(field.value)) {
                                        let elemImage = $('<div></div>').appendTo(elemContent).addClass('content-item');
                                        appendImageFromCache(elemImage, settings.images[id], {
                                            icon        : 'icon-image',
                                            imageLink   : field.value.link,
                                            replace     : true
                                        });
                                    }
                                }

                            }
                        }
                    }
                }
            }
        }

        finishPanelContentUpdate(id, settings.images[id]);
        insertImagesDataDone(id, responses[0].data);

    });

}
function insertImagesDataDone(id, data) {}



// Insert attachments as tiles or table
function insertAttachments(link, params) {

    if(isBlank(link)) return;
    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'attachments' : params.id;
    
    settings.attachments[id] = getPanelSettings(link, params, {
        headerLabel : 'Attachments',
        layout      : 'list',
        tileIcon    : 'icon-pdf',
        contentSize : 'm',
    }, [
        [ 'bookmark'           , false ],
        [ 'filterByType'       , false ],
        [ 'folders'            , false ],
        [ 'fileVersion'        , true  ],
        [ 'fileSize'           , true  ],
        [ 'includeVaultFiles'  , false ],
        [ 'includeRelatedFiles', false ],
        [ 'split'              , false ],
        [ 'download'           , true  ],
        [ 'uploadLabel'        , 'Upload File' ],
        [ 'extensionsIn'       , [] ],
        [ 'extensionsEx'       , [] ]
    ]);

    settings.attachments[id].load = function() { fileUploadDone(id); }

    genPanelTop(id, settings.attachments[id], 'attachments');
    genPanelHeader(id, settings.attachments[id]);
    genPanelBookmarkButton(id, settings.attachments[id]);
    genPanelOpenInPLMButton(id, settings.attachments[id]);
    genPanelFilterSelect(id, settings.attachments[id], 'filterByType', 'type', 'All Types');
    genPanelSearchInput(id, settings.attachments[id]);
    genPanelResizeButton(id, settings.attachments[id]);
    genPanelReloadButton(id, settings.attachments[id]);
    genPanelContents(id, settings.attachments[id]).addClass('attachments-content');

    if(settings.attachments[id].editable) {

        let elemToolbar = genPanelToolbar(id, settings.attachments[id], 'actions');

        let elemUpload = $('<div></div>').prependTo(elemToolbar)
            .addClass('button')
            .addClass('icon-upload')
            .addClass('disabled')
            .attr('id', id + '-upload')
            .attr('title', settings.attachments[id].uploadLabel)
            .html(settings.attachments[id].uploadLabel)
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                clickAttachmentsUpload(id, $(this));
            });

        if(isBlank(settings.attachments[id].uploadLabel)) {
            elemUpload.addClass('icon');
        } else {
            elemUpload.addClass('with-icon');
        }

        let elemFrame  = $('#frame-upload');
        let elemForm   = $('#uploadForm');
        let elemSelect = $('#select-file');
                
        if(elemFrame.length === 0) {
            $('<iframe>', {
                id   : 'frame-upload',
                name :  'frame-upload'
            }).appendTo('body').on('load', function() {
                fileUploadDone(id);
            }).addClass('hidden');
        }            

        if(elemForm.length === 0) {
            elemForm = $('<form>', {
                id      : 'uploadForm',
                method  : 'post',
                encType : 'multipart/form-data',
                target  : 'frame-upload'
            }).appendTo('body');
        }            

        if(elemSelect.length === 0) {
            elemSelect = $('<input>', {
                id  : 'select-file',
                type : 'file',
                name : 'newFiles'
            }).appendTo(elemForm)
            .addClass('hidden')
            .addClass('button')
            .addClass('main')
            .change(function() {
                selectFileForUpload(id);
            });
        }

    }

    if(settings.attachments[id].download) {
        if($('#frame-download').length === 0) {
            $('<frame>').appendTo($('body'))
                .attr('id', 'frame-download')
                .attr('name', 'frame-download')
                .css('display', 'none');
        }  
    }

    insertAttachmentsData(id, false);  

}
function insertAttachmentsData(id, update) {

    let params = {
        link      : settings.attachments[id].link,
        timestamp : settings.attachments[id].timestamp
    }

    let elemContent = $('#' + id + '-content');      
    let elemUpload  = $('#' + id + '-upload');
    let elemSelect  = $('#' + id + '-filter-type');
    let isTable     = elemContent.hasClass('table');

    if(elemSelect.length > 0) {
        elemSelect.children().remove();
        elemSelect.hide();
        $('<option></option>').appendTo(elemSelect)
            .attr('value', 'all')
            .html('All Types');

    }

    if(!update) elemContent.html(''); 
    if(elemUpload.length > 0) elemUpload.addClass('disabled');

    let requests = [
        $.get('/plm/attachments', params),
        $.get('/plm/permissions', { link : settings.attachments[id].link })
    ];

    elemContent.hide();
    $('#' + id + '-no-data').hide();
    $('#' + id + '-processing').show();

    if((settings.attachments[id].includeRelatedFiles)) requests.push($.get('/plm/related-attachments', { link : settings.attachments[id].link })); 
    if((settings.attachments[id].bookmark           )) requests.push($.get('/plm/bookmarks', { link : settings.attachments[id].link })); 
    if((settings.attachments[id].includeVaultFiles  )) requests.push($.get('/plm/details', { link : settings.attachments[id].link })); 

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.attachments[id])) return;

        setPanelBookmarkStatus(id, settings.attachments[id], responses);

        let attachments = responses[0].data;
        let currentIDs  = [];
        let folders     = [];
        let listTypes   = [];
        let listRelated = false;

        elemContent.find('.attachment').each(function() {

            let remove    = true;
            let currentId = Number($(this).attr('data-file-id'));

            $(this).removeClass('highlight');

            for(let attachment of attachments) {
                if(attachment.id === currentId) {
                    remove = false;
                    continue;
                }
            }

            if(remove) $(this).remove(); else currentIDs.push(currentId);

        });


        if((settings.attachments[id].includeRelatedFiles)) {
            for(let related of responses[2].data) attachments.push(related);
        }

        for(let attachment of attachments) {

            if(currentIDs.indexOf(attachment.id) > -1) continue;

            let extension = attachment.type.extension.split('.').pop();
            let included  = true;

            if((settings.attachments[id].extensionsIn.length === 0) || ( settings.attachments[id].extensionsIn.includes(extension))) {
                if((settings.attachments[id].extensionsEx.length === 0) || (!settings.attachments[id].extensionsEx.includes(extension))) { 

                    let attFolder   = attachment.folder;
                    let folderId    = '';
                    let type        = attachment.type.fileType;

                    if(!listTypes.includes(type)) listTypes.push(type);

                    if(attFolder !== null) {
                        let isNewFolder = true;
                        folderId = attFolder.id;
                        for (let folder of folders) {
                            if(folder.name === attFolder.name) {
                                isNewFolder = false;
                            }
                        }
                        if(isNewFolder) folders.push(attFolder);
                    }

                    sortArray(folders, 'name');

                    let date = new Date(attachment.created.timeStamp);
                    
                    if(attachment.hasOwnProperty('relatedTabs')) {
                        if(!listRelated) {
                            $('<div></div>').appendTo(elemContent)
                                .addClass('attachments-separator')
                                .html('Related Files');
                        }
                        listRelated = true;
                    }

                    let elemAttachment = $('<div></div>').appendTo(elemContent)
                        .addClass('content-item')
                        .addClass('attachment')
                        .addClass('tile')
                        .attr('data-file-id', attachment.id)
                        .attr('data-folder-id', folderId)
                        .attr('data-url', attachment.url)
                        .attr('data-file-link', attachment.selfLink)
                        .attr('data-extension', attachment.type.extension)
                        .attr('data-filter-type', type);

                    if(update) {
                        elemAttachment.addClass('highlight');
                        elemAttachment.prependTo(elemContent);
                    } else {
                        elemAttachment.appendTo(elemContent);
                    }

                    getFileGrahpic(attachment).appendTo(elemAttachment);

                    let elemAttachmentDetails = $('<div></div>').appendTo(elemAttachment)
                        .addClass('attachment-details')
                        .addClass('tile-details');

                    let elemAttachmentName = $('<div></div>').appendTo(elemAttachmentDetails)
                        .addClass('attachment-name')
                        .addClass('tile-title');

                    if(!settings.attachments[id].split) {

                        elemAttachmentName.addClass('nowrap');
                        elemAttachmentName.html(attachment.name);

                    } else {

                        let filename   = attachment.name.split('.');
                        let filePrefix = '';

                        for(let i = 0; i < filename.length - 1; i++) filePrefix += filename[i];

                        $('<div></div>').appendTo(elemAttachmentName)
                            .addClass('attachment-name-prefix')
                            .addClass('nowrap')
                            .html(filePrefix);

                        $('<div></div>').appendTo(elemAttachmentName)
                            .addClass('attachment-name-suffix')
                            .html('.' + filename[filename.length - 1]);

                    }

                    let elemAttachmentSummary = $('<div></div>').appendTo(elemAttachmentDetails)
                        .addClass('attachment-summary')
                        .addClass('tile-data')

                    if(settings.attachments[id].fileVersion) {
                        $('<div></div>').appendTo(elemAttachmentSummary)
                            .addClass('attachment-version')
                            .addClass('nowrap')
                            .html('V' + attachment.version);
                    }

                    if(settings.attachments[id].fileSize) {
                        let fileSize = (attachment.size / 1024 / 1024).toFixed(2);
                        $('<div></div>').appendTo(elemAttachmentSummary)
                            .addClass('attachment-size')
                            .addClass('nowrap')
                            .html(fileSize + ' MB');      
                    }

                    $('<div></div>').appendTo(elemAttachmentSummary)
                        .addClass('attachment-date')
                        .addClass('nowrap')
                        .html(date.toLocaleString());

                    $('<div></div>').appendTo(elemAttachmentSummary)
                        .addClass('attachment-user')
                        .addClass('nowrap')
                        .html('<i class="icon icon-user filled"></i>' + attachment.created.user.title);

                    if(isTable) {
                        elemAttachmentName.appendTo(elemAttachment);
                        elemAttachmentSummary.children().each(function() {
                            $(this).appendTo(elemAttachment);
                        });
                        elemAttachmentDetails.remove();
                        elemAttachmentSummary.remove();
                    }

                    if(settings.attachments[id].download) {
                        if(hasPermission(responses[1].data, 'view_attachments')) {
                            elemAttachment.click(function() {
                                clickAttachment($(this));      
                                if(!isBlank(settings.attachments[id].onItemClick)) settings.attachments[id].onItemClick($(this));                          
                            }).dblclick(function() {
                                if(!isBlank(settings.attachments[id].onItemDblClick)) settings.attachments[id].onItemDblClick($(this));                          
                            });
                        }
                    }

                }
            }

        }

        if(settings.attachments[id].folders) {

            for(let folder of folders) {

                let elemFolder = $('<div></div>').appendTo(elemContent)
                    .addClass('folder')
                    .attr('data-folder-id', folder.id);
                    
                let elemFolderHeader = $('<div></div>').appendTo(elemFolder)
                    .addClass('folder-header')
                    .click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        clickFolderToggle($(this), e);
                    })

                $('<div></div>').appendTo(elemFolderHeader)
                    .addClass('folder-toggle')
                    .addClass('icon');
                    // .addClass('icon-collapse')

                $('<div></div>').appendTo(elemFolderHeader)
                    .addCklass('folder-icon')
                    .addClass('icon')
                    .addClass('icon-folder');

                $('<div></div>').appendTo(elemFolderHeader)
                    .addClass('folder-name')
                    .html(folder.name);

                let elemFolderAttachments = $('<div></div>').appendTo(elemFolder)
                    .addClass('folder-attachments');

                elemContent.children('.attachment').each(function() {
                    if($(this).attr('data-folder-id') === folder.id.toString()) {
                        $(this).appendTo(elemFolderAttachments);
                    }
                });

            }

            elemContent.children('.attachment').each(function() {
                $(this).appendTo(elemContent);
            });

        }

        if(hasPermission(responses[1].data, 'add_attachments')) {
            if(elemUpload.length > 0) elemUpload.removeClass('disabled');
        }

        insertVaultFiles(id, responses, listTypes, function() {

            let mode = (elemContent.hasClass('table')) ? 'block' : 'flex';

            if(isTable) {
                let elemTable = $('<div></div').appendTo(elemContent)
                .addClass('attachments-table');
                $('.attachment').appendTo(elemTable);
            }

            if(elemContent.find('.attachment').length === 0) $('#' + id + '-no-data').css('display', 'flex');
            else $('#' + id + '-no-data').hide();

            elemContent.css('display', mode);
            $('#' + id + '-processing').hide();

            listTypes.sort();

            setPanelFilterOptions(id, 'type', listTypes);
            finishPanelContentUpdate(id, settings.attachments[id]);
            insertAttachmentsDone(id, responses[0], update);

        });


    });

}
function insertVaultFiles(id, responses, listTypes, callback) {

    let itemData = null;

    if(!settings.attachments[id].includeVaultFiles) callback(); else {

        if(isBlank(vaultId)) callback(); else {

            for(let response of responses) if(response.url.indexOf('/details') === 0) itemData = response.data;

            if(itemData === null) callback(); else {

                if(itemData.length === 0) callback(); else {

                    let number      = getSectionFieldValue(itemData.sections, config.items.fieldIdNumber, '');
                    let pdmId       = getSectionFieldValue(itemData.sections, config.items.fieldIdPDM, '');
                    let elemContent = $('#' + id + '-content');  


                    // if(!isBlank(pdmId)) {

                        // $.get('/vault/item-files', {
                        //     itemId : pdmId
                        // }, function(response) {
                        //     console.log(response);
                        //     // for(let result of response.data.results) insertVaultFile(id, elemContent, result, listTypes);
                        //     // callback();
                        // });
                            
                    // } else if(!isBlank(number)) {

                        $.get('/vault/search-items', {
                            query : number,
                            limit : 1
                        }, function(response) {
                            if(response.data.results.length > 0) {
                                $.get('/vault/item-files', {
                                    link : response.data.results[0].url
                                }, function(response) {
                                    if(response.data.results.length > 0) {
                                        $('<div></div>').appendTo(elemContent)
                                            .addClass('attachments-separator')
                                            .html('Vault Files');
                                    }
                                    for(let result of response.data.results) insertVaultFile(id, elemContent, result, listTypes);
                                    callback();
                                });
                            } else callback();
                        });

                    // } else callback();

                }
            }
        }
    }

}
function insertVaultFile(id, elemContent, attachment, listTypes) {

    let suffix   = attachment.file.name.split('.').pop();
    let fileType = suffix.toUpperCase() + ' File';

    switch(suffix) {

        case 'docx' : fileType = 'Microsoft Word'; break;
        case 'xlsx' : fileType = 'Microsoft Excel'; break;
        case 'pptx' : fileType = 'Microsoft PowerPoint'; break;
        case 'png'  : fileType = 'PNG image'; break;

    }

    if((settings.attachments[id].extensionsIn.length === 0) || ( settings.attachments[id].extensionsIn.includes(suffix))) {
        if((settings.attachments[id].extensionsEx.length === 0) || (!settings.attachments[id].extensionsEx.includes(suffix))) { 

            if(!listTypes.includes(fileType)) listTypes.push(fileType);

            let elemAttachment = $('<div></div>').appendTo(elemContent)
                .addClass('content-item')
                .addClass('attachment')
                .addClass('tile')
                .attr('data-file-link', attachment.file.url)
                .attr('data-filter-type', fileType)

            let icon = 'icon-attachment';

                 if(attachment.itemAssociationType === 'Primary' ) icon = 'icon-counter-1';
            else if(attachment.itemAssociationType === 'Tertiary') icon = 'icon-counter-2';

            $('<div></div>').appendTo(elemAttachment)
                .addClass('attachment-graphic')
                .addClass('tile-image')
                .append('<span class="icon ' + icon + '"></span>');

            let elemAttachmentDetails = $('<div></div>').appendTo(elemAttachment)
                .addClass('attachment-details')
                .addClass('tile-details');

            $('<div></div>').appendTo(elemAttachmentDetails)
                .addClass('attachment-name')
                .addClass('tile-title')
                .addClass('nowrap')
                .html(attachment.file.name);

            let elemAttachmentSummary = $('<div></div>').appendTo(elemAttachmentDetails)
                .addClass('attachment-summary')
                .addClass('tile-data')

            if(settings.attachments[id].fileVersion) {
                $('<div></div>').appendTo(elemAttachmentSummary)
                    .addClass('attachment-version')
                    .addClass('nowrap')
                    .html('V' + attachment.file.version);
            }

            if(settings.attachments[id].fileSize) {
                let fileSize = (attachment.file.size / 1024 / 1024).toFixed(2);
                $('<div></div>').appendTo(elemAttachmentSummary)
                    .addClass('attachment-size')
                    .addClass('nowrap')
                    .html(fileSize + ' MB');      
            }

            let date = new Date(attachment.file.lastModifiedDate);

            $('<div></div>').appendTo(elemAttachmentSummary)
                .addClass('attachment-date')
                .addClass('nowrap')
                .html(date.toLocaleString());

            $('<div></div>').appendTo(elemAttachmentSummary)
                .addClass('attachment-user')
                .addClass('nowrap')
                .html('<i class="icon icon-user filled"></i>' + attachment.file.createUserName);

            if(settings.attachments[id].download) {
                elemAttachment.click(function(e) {
                    clickVaultFile(e, $(this));
                });
            }
        }
    }

}
function clickVaultFile(e, elemAttachment) {

    e.preventDefault();
    e.stopPropagation();

    let params = {
        link : elemAttachment.attr('data-file-link')
    }

    $.get( '/vault/download', params, function(response) {
        document.getElementById('frame-download').src = response.data.link;
    })

}
function insertAttachmentsDone(id, data, update) {}
function getFileGrahpic(attachment) {

    let elemGrahpic = $("<div class='attachment-graphic tile-image'></div>");

    switch (attachment.type.extension) {
    
        case '.jpg':
        case '.jpeg':
        case '.JPG':
        case '.png':
        case '.PNG':
        case '.tiff':
        case '.png':
        case '.dwfx':
            elemGrahpic.append('<img src="' + attachment.thumbnails.small + '">');
            break;

        default:
            let svg = getFileSVG(attachment.type.extension);
            elemGrahpic.append('<img ng-src="' + svg + '" src="' + svg + '">');
            break;
    
    }

    return elemGrahpic;
}
function getFileSVG(extension) {

    let svg;

    switch (extension) {
  
        case '.doc':
        case '.docx':
            svg = "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJhc3NldHMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB3aWR0aD0iMTRweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Ym94PSIwIDAgMTQgMTYiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDE0IDE2IiB4bWw6c3BhY2U9InByZXNlcnZlIj48Zz48cG9seWdvbiBmaWxsPSIjMTI3M0M1IiBwb2ludHM9IjksMCA5LDUgMTQsNSAJIi8+PHBhdGggZmlsbD0iIzEyNzNDNSIgZD0iTTgsMEgwdjE2aDE0VjZIOFYweiBNMTAsMTNIMnYtMWg4VjEzeiBNMTIsMTFIMnYtMWgxMFYxMXogTTEyLDh2MUgyVjhIMTJ6Ii8+PC9nPjwvc3ZnPg==";
            break;
        
        case '.xls':
        case '.xlsx':
            svg = "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJhc3NldHMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxM3B4IiB2aWV3Ym94PSIwIDAgMTYgMTMiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDE2IDEzIiB4bWw6c3BhY2U9InByZXNlcnZlIj48cGF0aCBmaWxsPSIjODZCQjQwIiBkPSJNMCwwdjEzaDE2VjBIMHogTTksMTJINHYtMmg1VjEyeiBNOSw5SDRWN2g1Vjl6IE05LDZINFY0aDVWNnogTTksM0g0VjFoNVYzeiBNMTUsMTJoLTV2LTJoNVYxMnogTTE1LDloLTVWNw0KCWg1Vjl6IE0xNSw2aC01VjRoNVY2eiBNMTUsM2gtNVYxaDVWM3oiLz48L3N2Zz4=";
            break;
     
        case '.pdf':
            svg = "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJhc3NldHMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB3aWR0aD0iMTRweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Ym94PSIwIDAgMTQgMTYiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDE0IDE2IiB4bWw6c3BhY2U9InByZXNlcnZlIj48Zz48cG9seWdvbiBmaWxsPSIjRUI0RDREIiBwb2ludHM9IjksMCA5LDUgMTQsNSAJIi8+PHBhdGggZmlsbD0iI0VCNEQ0RCIgZD0iTTgsNlYwSDB2MTZoMTRWNkg4eiBNMiw1aDR2NEgyVjV6IE0xMCwxM0gydi0xaDhWMTN6IE0xMiwxMUgydi0xaDEwVjExeiBNMTIsOUg3VjhoNVY5eiIvPjwvZz48L3N2Zz4=";
            break;
            
        case 'jpg':
        case 'jpeg':
        case 'JPG':
        case 'png':
        case 'PNG':
        case 'tiff':
            svg = "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJhc3NldHMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB3aWR0aD0iMTVweCIgaGVpZ2h0PSIxNXB4IiB2aWV3Ym94PSIwIDAgMTUgMTUiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDE1IDE1IiB4bWw6c3BhY2U9InByZXNlcnZlIj48cGF0aCBmaWxsPSIjN0I4RkE2IiBkPSJNMSwxaDEzdjExSDFWMXogTTAsMHYxNWgxNVYwSDB6IE0xMCw0LjVDMTAsNS4zLDEwLjcsNiwxMS41LDZDMTIuMyw2LDEzLDUuMywxMyw0LjVDMTMsMy43LDEyLjMsMywxMS41LDMNCglDMTAuNywzLDEwLDMuNywxMCw0LjV6IE0yLDExaDEwTDYsNUwyLDlWMTF6Ii8+PC9zdmc+";
            break;

        case '.rvt':
            svg = 'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJhc3NldHMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Qm94PSIwIDAgMTYgMTYiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDE2IDE2IiB4bWw6c3BhY2U9InByZXNlcnZlIj48Zz48ZyBpZD0iZmlsZUljb25CR181NV8iPjxwYXRoIGlkPSJmb2xkZWRDb3JuZXJfMTUxXyIgZmlsbD0iIzEyNzNDNSIgZD0iTTExLDBsNSw1aC01VjB6Ii8+PHBhdGggaWQ9ImJhY2tncm91bmRfMTUxXyIgZmlsbD0iIzBDNTA4OSIgZD0iTTAsMHYxNmgxNlY1aC01VjBIMHoiLz48cGF0aCBpZD0id2hpdGVfMTAxXyIgZmlsbD0iI0ZGRkZGRiIgZD0iTTEsMXY4aDE0VjVoLTRWMUgxeiIvPjxwYXRoIGlkPSJzaGFkb3dfMTI2XyIgb3BhY2l0eT0iMC4yIiBmaWxsPSIjMUIzRjYzIiBlbmFibGUtYmFja2dyb3VuZD0ibmV3ICAgICIgZD0iTTE2LDEwbC01LTVoNVYxMHoiLz48L2c+PGc+PHBhdGggZmlsbD0iI0ZGRkZGRiIgZD0iTTMsMTFoMWMwLjMsMCwwLjUsMC4yLDAuNSwwLjVTNC4zLDEyLDQsMTJIM1YxMXogTTIsMTB2NWgxdi0yaDAuN0w1LDE1aDFsLTEuNC0yLjENCgkJCWMwLjUtMC4yLDAuOS0wLjgsMC45LTEuNEM1LjUsMTAuNyw0LjgsMTAsNCwxMEgyeiIvPjxwYXRoIGZpbGw9IiNGRkZGRkYiIGQ9Ik0xMywxMWgxLjN2LTFoLTMuN3YxSDEydjRoMVYxMXoiLz48cGF0aCBmaWxsPSIjRkZGRkZGIiBkPSJNOSwxNWwyLTVoLTFsLTEuNSw0TDcsMTBINmwyLDVIOXoiLz48L2c+PC9nPjwvc3ZnPg==';
            break;

        default: 
            svg = 'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJhc3NldHMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Qm94PSIwIDAgMTQgMTYiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDE0IDE2IiB4bWw6c3BhY2U9InByZXNlcnZlIj48Zz48cG9seWdvbiBmaWxsPSIjN0I4RkE2IiBwb2ludHM9IjksMCA5LDUgMTQsNSAJIi8+PHBhdGggZmlsbD0iIzdCOEZBNiIgZD0iTTgsMEgwdjE2aDE0VjZIOFYweiIvPjwvZz48L3N2Zz4=';
            break;
            
    }
    
    return svg;
    
}
function clickAttachment(elemClicked) {

    let elemItem       = elemClicked.closest('.item');
    let elemAttachment = elemClicked.closest('.attachment');
    let fileExtension  = elemAttachment.attr('data-extension');

    // let elemPreview = $('<div></div>').appendTo('body')
    //     .attr('id', 'preview')
    //     .addClass('screen')
    //     .addClass('surface-level-2');

    // let elemPreviewHeader = $('<div></div>').appendTo(elemPreview)
    //     .attr('id', 'preview-header')    
    //     .addClass('preview-header');

    // $('<div></div>').appendTo(elemPreviewHeader)
    //     .attr('id', 'preview-title')    
    //     .addClass('preview-title')
    //     .html('test');

    // let elemPreviewToolbar = $('<div></div>').appendTo(elemPreviewHeader)
    //     .attr('id', 'preview-toolbar')
    //     .addClass('preview-toolbar');
        
    //     $('<div></div>').appendTo(elemPreviewToolbar)
    //     .addClass('button')
    //     .addClass('icon')
    //     .addClass('icon-close')
    //     .click(function() {
    //         let elemScreen = $(this).closest('.screen');
    //         elemScreen.hide();
    //     });
        
        
    // let elemPreviewFrame = $('<div></div>').appendTo(elemPreview)
    //         .attr('id', 'preview-frame')
    //         .addClass('preview-frame');


    let params = {
        'wsId'      : elemItem.attr('data-wsid'),
        'dmsId'     : elemItem.attr('data-dmsid'),
        'fileId'    : elemAttachment.attr('data-file-id'),
        'fileLink'  : elemAttachment.attr('data-file-link')
    }

    $.getJSON( '/plm/download', params, function(response) {

        // console.log(response);

        // let fileUrl = response.data.fileUrl;
// 
        // fileUrl += '&content_disposition=application/pdf';

        // console.log(fileUrl);

        // $('<object>').appendTo(elemPreviewFrame)
            // .show()
            // .attr('type','application/pdf')
            // .attr('data', fileUrl);
            // .attr('data', response.data.fileUrl);
        // $('<iframe></iframe>').appendTo(elemPreviewFrame)
        //     .show()
        //     .attr('src', response.data.fileUrl);


        document.getElementById('frame-download').src = response.data.fileUrl;

        // switch(fileExtension) {

        //     case '.pdf':
                
        //         let elemFramePreview = $('#frame-preview');
        //         if(elemFramePreview.length > 0) {
        //             elemFramePreview.show();
        //             elemFramePreview.attr('data', response.data.fileUrl)
        //         } else {
        //             document.getElementById('frame-download').src = response.data.fileUrl;
        //         }

        //         break;

        //     default:
        //         document.getElementById('frame-download').src = response.data.fileUrl;
        //         break;
                
        // }

    });

}
function clickFolderToggle(elemClicked, e) {

    let elemFolder = elemClicked.closest('.folder');
        elemFolder.toggleClass('collapsed');

    let elemFolderAttachments = elemFolder.find('.folder-attachments');
    elemFolderAttachments.toggle();

}
function clickAttachmentsUpload(id, elemClicked) {

    if(elemClicked.hasClass('disabled')) return;

    let link = settings.attachments[id].link;

    let urlUpload = '/plm/upload/';
        urlUpload += link.split('/')[4] + '/';
        urlUpload += link.split('/')[6];

    $('#uploadForm').attr('action', urlUpload);   
    $('#select-file').val('');
    $('#select-file').click();

}
function selectFileForUpload(id) {

    if($('#select-file').val() === '') return;

    $('#' + id + '-content').hide();
    $('#' + id + '-processing').show();
    $('#' + id + '-no-data').hide();
    
    $('#uploadForm').submit();

}
function fileUploadDone(id) {

    settings.attachments[id].timestamp = new Date().getTime();

    insertAttachmentsData(id, true);

}



// Insert Grid table
function insertGrid(link, params) {

    if(isBlank(link)) return;
    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'grid' : params.id;
    
    settings.grid[id] = getPanelSettings(link, params, {
        headerLabel : 'Grid',
        layout      : 'table'
    }, [
        [ 'autoSave'            , false ],
        [ 'filterEmpty'         , false ],
        [ 'hideButtonCreate'    , false ],
        [ 'hideButtonClone'     , false ],
        [ 'hideButtonDisconnect', false ],
        [ 'rotate'              , false ],
        [ 'bookmark'            , false ],
        [ 'picklistLimit'       , 10    ],
        [ 'picklistShortcuts'   , false ]
    ]);

    settings.grid[id].layout = 'table';
    settings.grid[id].load   = function() { insertGridData(id); }

    genPanelTop(id, settings.grid[id], 'grid');
    genPanelHeader(id, settings.grid[id]);
    genPanelBookmarkButton(id, settings.grid[id]);
    genPanelOpenInPLMButton(id, settings.grid[id]);
    genPanelSelectionControls(id, settings.grid[id]);
    genPanelFilterToggleEmpty(id, settings.grid[id]);
    genPanelSearchInput(id, settings.grid[id]);
    genPanelResizeButton(id, settings.grid[id]);
    genPanelReloadButton(id, settings.grid[id]);

    genPanelContents(id, settings.grid[id]);

    if(settings.grid[id].editable) {

        genPanelAutoSaveToggle(id, settings.grid[id]);

        let elemToolbar = genPanelToolbar(id, settings.grid[id], 'actions');

        $('<div></div>').appendTo(elemToolbar)
            .addClass('button')
            .addClass('default')
            .attr('id', id + '-action-save') 
            .attr('title', 'Save all changes to PLM')
            .html('Save Changes')
            .addClass('hidden')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                saveGridData(id);
            });

        if(!settings.grid[id].hideButtonCreate) {

            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('with-icon')
                .addClass('icon-list-add')
                .attr('id', id + '-action-add')
                .attr('title', 'Insert new row')
                .html('Insert Row')
                .addClass('hidden')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    insertGridRow(id, null);
                    $('#' + id + '-no-data').hide();
                    $('#' + id + '-content').show();
                    resetTableSelectAllCheckBox($(this));
                });
        }

        if(!settings.grid[id].hideButtonClone) {

            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('with-icon')
                .addClass('icon-clone')
                .addClass('panel-action-clone')
                .addClass('grid-action-clone')
                .attr('title', 'Clones the selected rows')
                .attr('id', id + '-action-clone')
                .html('Clone Selected')
                .addClass('hidden')
                .addClass('multi-select-action')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    cloneGridRows(id);
                    resetTableSelectAllCheckBox($(this));
                });

        }

        let elemDisconnect = genPanelDisconnectButton(id, settings.grid[id], function() { deleteGridRows(id); });
            elemDisconnect.attr('title', 'Removes the selected rows from the view with the next Save operation');

    }

    insertGridDone(id);

    settings.grid[id].load();

}
function insertGridDone(id) {}
function insertGridData(id) {

    settings.grid[id].timestamp = startPanelContentUpdate(id);

    let params = {
        link      : settings.grid[id].link,
        timestamp : settings.grid[id].timestamp
    }

    let requests    = [
        $.get('/plm/grid'        , params),
        $.get('/plm/permissions' , params),
        $.get('/plm/grid-columns', { 
            link            : settings.grid[id].link, 
            useCache        : settings.grid[id].useCache,
            getValidations  : settings.grid[id].editable
        })
    ];

    if(settings.grid[id].bookmark) requests.push($.get('/plm/bookmarks', { link : settings.grid[id].link })); 
    if(settings.grid[id].headerLabel == 'descriptor') requests.push($.get('/plm/details', { link : settings.grid[id].link })); 

    Promise.all(requests).then(function(responses) {

        console.log(responses);

        if(stopPanelContentUpdate(responses[0], settings.grid[id])) return;

        let rows        = responses[0].data;
        let permissions = responses[1].data;
        let columns     = responses[2].data;

        settings.grid[id].columns    = [];
        settings.grid[id].picklists  = [];

        if(settings.grid[id].headerLabel == 'descriptor') settings.grid[id].descriptor = responses[responses.length - 1].data.title;

        setPanelBookmarkStatus(id, settings.grid[id], responses);

        if(!hasPermission(permissions, 'edit_grid')) settings.grid[id].editable = false;

        let elemContent    = $('#' + id + '-content');
        let elemTable      = $('<table></table>').appendTo(elemContent).addClass('grid').attr('id', id + '-table');
        let elemTHead      = $('<thead></thead>').addClass('fixed').attr('id', id + '-thead');
        let elemTBody      = $('<tbody></tbody>').appendTo(elemTable).attr('id', id + '-tbody').attr('id', id + '-tbody');
        let elemTHRow      = $('<tr></tr>').appendTo(elemTHead).addClass('fixed');

        getFieldsPicklistsData(settings.grid[id], columns.fields, function(picklistsData) {

            for(let field of columns.fields) {
                field.id       = field.__self__.split('/').pop();
                field.preserve = false;
                if(!includePanelTableColumn(field.id, field.name, settings.grid[id], settings.grid[id].columns.length)) {
                    field.preserve = true;
                } else if(field.visibility === 'NEVER') {
                    field.preserve   = true;
                    field.visibility = 'ALWAYS';
                }
                settings.grid[id].columns.push(field);
            }

            if(settings.grid[id].tableHeaders) elemTHead.prependTo(elemTable);

            if(rows.length > 0 ) {
                if(!isBlank(settings.grid[id].groupBy)) {
                    for(let row of rows) {
                        row.group = getGridRowValue(row, settings.grid[id].groupBy, '', 'title');
                    }
                    sortArray(rows, 'group', 'string', 'ascending');
                }
            }

            if(!settings.grid[id].rotate) {

                elemTable.addClass('fixed-header');
                
                // if(settings.grid[id].editable || settings.grid[id].multiSelect) {
                if(settings.grid[id].multiSelect) {

                    let elemHeadCell = $('<th></th>').appendTo(elemTHRow);
                    
                    if(settings.grid[id].multiSelect) {

                        elemHeadCell.addClass('table-check-box');

                        $('<div></div>').appendTo(elemHeadCell)
                            .attr('id', id + '-select-all')
                            .addClass('content-select-all')
                            .addClass('icon')
                            .addClass('icon-check-box')
                            .click(function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                clickTableToggleAll($(this));
                            });

                    }

                }

                for(let column of settings.grid[id].columns) {
                    let elemCell = $('<th></th>').appendTo(elemTHRow).html(column.name);
                        setFieldDataAndClasses(elemCell, column, settings.grid[id].editable);
                    if(column.preserve) elemCell.addClass('hidden');
                    if(column.required) elemCell.addClass('required');
                    // console.log(column);
                }

                let groupName = null;
                let groupSpan = settings.grid[id].columns.length;

                if(settings.grid[id].editable && settings.grid[id].multiSelect) groupSpan++;

                for(let row of rows) {

                    if(!isBlank(settings.grid[id].groupBy)) {

                        if(groupName !== row.group) {

                            let elemGroup = $('<tr></tr>').appendTo(elemTBody)
                                .addClass('table-group');

                            let elemGroupTitle = $('<td></td>').appendTo(elemGroup)
                                .addClass('table-group-title')
                                .attr('colspan', groupSpan)
                                .html(isBlank(row.group) ? 'n/a' : row.group)
                                .click(function() {
                                    $(this).toggleClass('collapsed');
                                    if($(this).hasClass('collapsed')) {
                                        $(this).parent().nextUntil('.table-group').hide();
                                    } else {
                                        $(this).parent().nextUntil('.table-group').show();
                                    }
                                });

                            if(settings.grid[id].collapseContents) elemGroupTitle.addClass('collapsed');

                        }

                        groupName = row.group;

                    }

                    insertGridRow(id, row, picklistsData);

                }

                insertAllPicklistData(settings.grid[id], picklistsData, elemTBody);

            } else {

                elemTable.addClass('rotated');

                for(let column of settings.grid[id].columns) {

                    let elemTableRow = $('<tr></tr>').appendTo(elemTBody)
                        .addClass('content-item')
                        .click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            clickContentItemSelect($(this), e);
                        });

                    $('<th></th>').appendTo(elemTableRow).html(column.name);

                    for(let row of responses[0].data) {

                        let value   = getGridRowValue(row, column.fieldId, '', 'title');

                        $('<td></td>').appendTo(elemTableRow).html(value);

                    }

                }
            }

            if(settings.grid[id].editable) {
                if(hasPermission(permissions, 'edit_grid'       )) { $('#' + id + '-action-save'  ).removeClass('hidden'); } else { $('#' + id + '-action-save'  ).remove(); }
                if(hasPermission(permissions, 'add_to_grid'     )) { $('#' + id + '-action-add'   ).removeClass('hidden'); } else { $('#' + id + '-action-add'   ).remove(); }
                if(hasPermission(permissions, 'add_to_grid'     )) { $('#' + id + '-action-clone' ).removeClass('hidden'); } else { $('#' + id + '-action-clone' ).remove(); }
                if(hasPermission(permissions, 'delete_from_grid')) { $('#' + id + '-action-remove').removeClass('hidden'); } else { $('#' + id + '-action-remove').remove(); }
            }

            finishPanelContentUpdate(id, settings.grid[id]);
            insertGridDataDone(id, rows, columns);

        });

    });

}
function insertGridDataDone(id, rows, columns) {}
function insertGridRow(id, row, picklistsData) {

    let elemTBody = $('#' + id + '-tbody');

    let elemTableRow = $('<tr></tr>').appendTo(elemTBody)
        .addClass('content-item')
        .attr('data-link', '');

    if(isBlank(row)) {
        elemTableRow.addClass('new');
    } else {
        for(let field of row.rowData) {
            if(field.title === 'Row Id') {
                elemTableRow.attr('data-link', field.__self__);
            }
        }
    }

    if(settings.grid[id].collapseContents) {
        if(!isBlank(settings.grid[id].groupBy)) {
            elemTableRow.hide();
        }
    }

    if(settings.grid[id].multiSelect) {

        $('<td></td>').appendTo(elemTableRow)
            .html('<div class="icon icon-check-box"></div>')
            .addClass('content-item-check-box')
            .addClass('table-check-box');

    }

    for(let field of settings.grid[id].columns) {

        let elemCell = $('<td></td>').appendTo(elemTableRow);

        if(field.preserve) elemCell.addClass('hidden');
            
        if(isBlank(row)) insertField(settings.grid[id], elemCell, field, null, picklistsData, [], []);
        else insertField(settings.grid[id], elemCell, field, row.rowData, picklistsData, [], []);
        
        if(field.editability === 'NEVER') {
            let value  = '';
            if(!isBlank(row)) value = getFieldValueFromResponseData(field.id, row.rowData) || '';
            elemCell.attr('data-value', value);
        }
        
    } 

    setGridRowEvents(id, elemTableRow);

    return elemTableRow;

}
function setGridRowEvents(id, elemRow) {

    elemRow.click(function(e) {
        // clickContentItemSelect($(this), e);
        if(!isBlank(settings.grid[id].onClickItem)) settings.grid[id].onClickItem($(this));
    }).dblclick(function() {
        if(!isBlank(settings.grid[id].onDblClickItem)) settings.grid[id].onDblClickItem($(this));
    });

    let elemCheckbox = elemRow.children('td.table-check-box');

    if(elemCheckbox.length > 0) {
        elemCheckbox.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            let elemContentItem = $(this).closest('.content-item');
                elemContentItem.toggleClass('checked');
            clickContentItemSelect(elemContentItem);
            resetTableSelectAllCheckBox(elemContentItem);
        })              
        .dblclick(function(e){
            e.preventDefault();
            e.stopPropagation();
        });
    }

    elemRow.find('.field-editable').each(function() {
    
        let elemInput = $(this).children().first();

        elemInput.click   (function(e) { $(this).select(); });
        elemInput.dblclick(function(e) { e.stopPropagation(); });
        elemInput.change  (function(e) { changedGridValue($(this)); });

    });

}
function changedGridValue(elemInput) {

    let elemTop    = elemInput.closest('.panel-top');
    let elemParent = elemInput.parent();
    let id         = elemTop.attr('id');

    if(elemParent.is('td')) {

        let index   = elemInput.parent().index();
        let value   = elemInput.val();

        elemInput.parent().addClass('changed');
        elemInput.closest('tr').addClass('changed');

        $('#' + id + '-save').show();

        elemTop.find('.content-item.checked').each(function() {
            $(this).addClass('changed');
            $(this).children().eq(index).addClass('changed');
            $(this).children().eq(index).children().first().val(value);
        });

        updateListCalculations(id);
        updatePanelCalculations(id);

    }

    autoSaveGridData(id);

}
function cloneGridRows(id) {

    let elemTBody = $('#' + id + '-tbody');

    elemTBody.find('tr.selected').each(function() {
    
        let elemNew = $(this).clone().appendTo(elemTBody);
        
        elemNew.removeClass('selected')
            .removeClass('checked')
            .removeClass('changed')
            .attr('data-link', '')
            .addClass('new');

        elemNew.find('.changed').removeClass('changed');

        setGridRowEvents(id, elemNew);

    });

    autoSaveGridData(id);

}
function deleteGridRows(id) {

    let elemTBody = $('#' + id + '-tbody');
    let elemPanel = $('#' + id);

    elemTBody.find('tr.selected').each(function() {
        
        $(this).addClass('hidden')
            .removeClass('new')
            .removeClass('changed')
            .removeClass('selected');

    });

    elemPanel.find('.multi-select-action').hide();

    cleanupEmptyGridGroups(id);
    autoSaveGridData(id);

}
function saveGridData(id) {

    if(!settings.grid[id].autoSave) appendOverlay(false);

    let requests    = [];
    let elemTBody   = $('#' + id + '-tbody');
    let rowsNew     = [];
    let index       = 0;

    elemTBody.children('.hidden').each(function() {

        let elemRow = $(this);
        let link    = elemRow.attr('data-link');

        if(link !== '') requests.push($.post('/plm/remove-grid-row', { link : link }));
        
        elemRow.remove();

    });

    elemTBody.children('.new').each(function() {

        let elemRow = $(this);
        let params  = {
            link  : settings.grid[id].link, 
            data  : [],
            index : index++
        } 

        elemRow.removeClass('changed').attr('data-new-row-' + index);
        elemRow.children('td.field-editable').each(function() {
            let fieldData =  getFieldValue($(this));
            params.data.push(fieldData);
        });

        rowsNew.push(elemRow);
        requests.push($.post('/plm/add-grid-row', params))

    });

    elemTBody.children('.changed').each(function() {

        let elemRow = $(this);
        let rowId   = elemRow.attr('data-link').split('/').pop();

        if(!elemRow.hasClass('new')) {

            let params = {
                link  : settings.grid[id].link, 
                rowId : rowId, 
                data  : [] 
            }            

            elemRow.children('td.field-editable').each(function() {
                let fieldData =  getFieldValue($(this));
                params.data.push(fieldData);
            });
            elemRow.children('td.field-readonly').each(function() {
                let elemCell = $(this);
                params.data.push({
                    fieldId : elemCell.attr('data-id'),
                    type    : elemCell.attr('data-type'),
                    value   : elemCell.attr('data-value')
                });
            });

            requests.push($.post('/plm/update-grid-row', params));

        }

    });

    Promise.all(requests).then(function(responses) {

        for(let response of responses) {

            if(response.error) {
                showErrorMessage('Error when saving', response.data.message);
            } else {
                if(response.url.indexOf('/add-grid-row') === 0) {
                    let index = Number(response.params.index);
                    rowsNew[index].attr('data-link', response.data.split('.autodeskplm360.net')[1]);
                    rowsNew[index].removeClass('new');
                }
            }

        }

        elemTBody.find('.changed').removeClass('changed');
        cleanupEmptyGridGroups(id);
        $('#overlay').hide();
        updateListCalculations(id);
        updatePanelCalculations(id);
        
    });

}
function autoSaveGridData(id) {

    if(settings.grid[id].autoSave) saveGridData(id);

}
function cleanupEmptyGridGroups(id) {

    let elemTBody = $('#' + id + '-tbody');

    elemTBody.children('.table-group').each(function() {
        
        let elemGroup = $(this);
        let list      = elemGroup.nextUntil('.table-group');
        let isEmpty   = (list.length === 0);

        if(!isEmpty) {
            isEmpty = true;
            list.each(function() {
                if(!$(this).hasClass('hidden')) isEmpty = false;
            });
        }

        if(isEmpty) elemGroup.remove();

    });

}


// Insert BOM tree with selected controls
function insertBOM(link , params) {

    if(isBlank(link)) return;
    if(isBlank(params)) params = {};

    let id          = isBlank(params.id) ? 'bom' : params.id;
    let hideDetails = true;
    
    if(!isBlank(params.fieldsIn)) hideDetails = false;
    if(!isBlank(params.fieldsEx)) hideDetails = false;

    settings.bom[id] = getPanelSettings(link, params, {
        headerLabel : 'BOM',
        contentSize : 'm',
    }, [
        [ 'additionalRequests'  , []    ],
        [ 'bomViewName'         , ''    ],
        [ 'depth'               , 10    ],
        [ 'endItemFieldId'      , ''    ],
        [ 'endItemValue'        , ''    ],
        [ 'getFlatBOM'          , false ],
        [ 'goThere'             , false ],
        [ 'hideDetails'         , hideDetails  ],
        [ 'includeBOMPartList'  , false ],
        [ 'path'                , false ],
        [ 'position'            , true  ],
        [ 'revisionBias'        , 'release' ],
        [ 'selectItems'         , {}    ],
        [ 'selectUnique'        , true  ],
        [ 'showRestricted'      , false ],
        [ 'toggles'             , false ],
        [ 'viewSelector'        , false ],
        [ 'viewerSelection'     , false ]
    ]);

    settings.bom[id].load = function() { changeBOMView(id); }

    if(!isBlank(params.endItem)) {
        if(!isBlank(params.endItem.fieldId)) settings.bom[id].endItemFieldId = params.endItem.fieldId;
        if(!isBlank(params.endItem.value  )) settings.bom[id].endItemValue   = params.endItem.value;
    }

    genPanelTop(id, settings.bom[id], 'bom');
    genPanelHeader(id, settings.bom[id]);
    genPanelOpenSelectedInPLMButton(id, settings.bom[id]);
    genPanelSelectionControls(id, settings.bom[id]);

    if(settings.bom[id].goThere) {

        $('<div></div>').appendTo(genPanelToolbar(id, settings.bom[id], 'controls'))
            .addClass('button')
            .addClass('icon')
            .addClass('icon-go-there')
            .addClass('xs')
            .addClass('bom-single-select-action')
            .attr('title', 'Open this view for the selected item')
            .click(function() {
                clickBOMGoThere($(this));
            });

    }

    genPanelToggleButtons(id, settings.bom[id], 
        function() {   expandAllNodes(id); }, 
        function() { collapseAllNodes(id); }
    );

    $('<select></select>').appendTo(genPanelToolbar(id, settings.bom[id], 'controls'))
        .addClass('bom-view-selector')
        .addClass('button')
        .attr('id', id + '-view-selector')
        .hide()
        .change(function() {
            changeBOMView(id);
        });
   

    //  Set defaults for optional parameters
    // --------------------------------------
    // let deselect            = true;      // Adds button to deselect selected element (not available if multiSelect is enabled)
    // let position            = true;      // When set to true, the position / find number will be displayed

    // let revisionBias        = 'release'; // Set BOM configuration to expand [release, working, changeOrder, allChangeOrder]
    // let selectItems         = {};
    // let selectUnique        = true;      // Defines if only unique items should be returned based on selectItems filter, skipping following instances of the same item
    // let showRestricted      = false;     // When set to true, red lock icons will be shown if an item's BOM contains items that are not accessilbe for the user due to access permissions
    // let views               = false;     // Adds drop down menu to select from the available PLM BOM views

    // settings.bom[id].position           = position;
    // settings.bom[id].quantity           = quantity;
    // settings.bom[id].hideDetails        = hideDetails;
    // settings.bom[id].showRestricted     = showRestricted;
    // settings.bom[id].selectItems        = selectItems;
    // settings.bom[id].selectUnique       = selectUnique;
    // settings.bom[id].endItemFieldId     = null;
    // settings.bom[id].endItemValue       = null;


    genPanelResizeButton(id, settings.bom[id]);
    genPanelSearchInput(id, settings.bom[id]);
    genPanelResetButton(id, settings.bom[id]);
    genPanelReloadButton(id, settings.bom[id]);

    genPanelContents(id, settings.bom[id]);

    if(settings.bom[id].path) {

        $('<div></div>').appendTo($('#' + id))
            .attr('id', id + '-bom-path')
            .addClass('bom-path-empty')
            .addClass('bom-path')
            .addClass('no-scrollbar');

        let elemBOMGoTo = $('<div></div>').appendTo($('#' + id))
            .attr('id', id + '-bom-goto')
            .addClass('bom-go-to');

        $('<div></div>').appendTo(elemBOMGoTo)
            .attr('id', id + '-bom-go-to-top')
            .addClass('bom-go-to-top')
            .addClass('button')
            .addClass('icon')
            .addClass('icon-top')
            .attr('title', 'Scroll to top of BOM')
            .click(function() {
                bomScrollToTop(id);
            });

        $('<div></div>').appendTo(elemBOMGoTo)
            .attr('id', id + '-bom-go-to-bottom')
            .addClass('bom-go-to-bottom')
            .addClass('button')
            .addClass('icon')
            .addClass('icon-bottom')
            .attr('title', 'Scroll to bottom of BOM')
            .click(function() {
                bomScrollToBottom(id);
            });

        $('#' + id).addClass('with-bom-path');

    } 

    insertBOMDone(id);
    getBOMTabViews(id, settings.bom[id]);

}
function getBOMTabViews(id, settings) {

    let elemSelect = $('#' + id + '-view-selector');

    $.get('/plm/bom-views-and-fields', { link : settings.link, useCache : settings.useCache }, function(response) {

        settings.bomViews = [];

        sortArray(response.data, 'name');

        for(let bomView of response.data) {

            $('<option></option>').appendTo(elemSelect)
                .html(bomView.name)
                .attr('value', bomView.id);

            if(!isBlank(settings.bomViewName)) {
                if(bomView.name === settings.bomViewName) {
                    elemSelect.val(bomView.id);
                }
            }

            let view = {
                id      : bomView.id,
                name    : bomView.name,
                columns : [],
                urns    : {
                    partNumber  : '',
                    quantity    : '',
                    endItem     : '',
                    selectItems : ''
                }
            }

            let columnsCount = 1;

            for(let field of bomView.fields) {
                
                field.included = false;

                if(field.displayName !== 'Descriptor') {
                    if(includePanelTableColumn(field.fieldId, field.displayName, settings, columnsCount++)) {
                        if(!settings.hideDetails) {
                            field.included = true;
                        }      
                    }
                }

                view.columns.push(field);

                switch(field.fieldId) {
                    case settings.fieldIdPartNumber   : view.urns.partNumber  = field.__self__.urn; break;
                    case config.items.fieldIdNumber   : if(isBlank(view.urns.partNumber)) view.urns.partNumber  = field.__self__.urn; break;
                    case 'QUANTITY'                   : view.urns.quantity    = field.__self__.urn; break;
                    case settings.endItemFieldId      : view.urns.endItem     = field.__self__.urn; break;
                    default:
                        if(!isBlank(settings.selectItems)) {
                            if(field.fieldId === settings.selectItems.fieldId) view.urns.selectItems = field.__self__.urn;
                        }
                        break;
                }

            }

            settings.bomViews.push(view);
        
        }

        if(settings.viewSelector) elemSelect.show();

        settings.load();

    });

}
function insertBOMDone(id) {}
function changeBOMView(id) {

    settings.bom[id].timestamp = startPanelContentUpdate(id);
    settings.bom[id].viewId    = $('#' +  id + '-view-selector').val();
    settings.bom[id].indexEdge = 0;

    let elemBOM         = $('#' + id);
    let selectedItems   = [];

    let params = {
        link          : settings.bom[id].link,
        depth         : settings.bom[id].depth,
        revisionBias  : settings.bom[id].revisionBias,
        viewId        : settings.bom[id].viewId,
        timestamp     : settings.bom[id].timestamp
    }

    let requests = [
        $.get('/plm/bom', params),
        $.get('/plm/workspaces', { useCache : true })
    ];

    if(settings.bom[id].getFlatBOM) requests.push($.get('/plm/bom-flat', params));
    if(settings.bom[id].headerLabel == 'descriptor') requests.push($.get('/plm/descriptor', params));

    for(let request of settings.bom[id].additionalRequests) requests.push(request);

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.bom[id])) return;

        for(let response of responses) {
            if(response.url.indexOf('/descriptor?') === 0) settings.bom[id].descriptor = response.data;
        }

        for(let view of settings.bom[id].bomViews) {
            if( settings.bom[id].viewId == view.id) {
                settings.bom[id].columns             = view.columns;
                settings.bom[id].fieldURNPartNumber  = view.urns.partNumber;
                settings.bom[id].fieldURNQuantity    = view.urns.quantity;
                settings.bom[id].fieldURNEndItem     = view.urns.endItem;
                settings.bom[id].fieldURNSelectItems = view.urns.selectItems;
                break;
            }
        }

        $('#' + id + '-content').addClass('tree');

        let elemTable = $('<table></table').appendTo($('#' + id + '-content'))
            .attr('id', id + '-table')
            .addClass('bom-table')
            .addClass('fixed-header');

        let elemTHead = $('<thead></thead>').appendTo(elemTable).attr('id', id + '-thead').addClass('bom-thead');
        let elemTBody = $('<tbody></tbody>').appendTo(elemTable).attr('id', id + '-tbody').addClass('bom-tbody');
            
        if(!settings.bom[id].tableHeaders) elemTHead.hide();

        if(!isBlank(settings.bom[id].selectItems.values)) {
            settings.bom[id].selectItems.values = settings.bom[id].selectItems.values.map(function(item) { 
                return item.toLowerCase(); 
            }); 
        }

        setBOMHeaders(id, elemTHead);
        insertNextBOMLevel(id, elemTBody, responses[0].data, responses[0].data.root, 1, '', selectedItems, responses[1].data.items);
        enableBOMToggles(id);

        if(settings.bom[id].collapseContents) collapseAllNodes(id);

        if(!elemBOM.hasClass('no-bom-counters')) { $('#' + id + '-bom-counters').show(); }

        let dataFlatBOM     = null;
        let dataAdditional  = [];
        let indexAdditional = 2;

        if(settings.bom[id].getFlatBOM) dataFlatBOM = responses[indexAdditional++].data;

        while (indexAdditional < responses.length) {
            dataAdditional.push(responses[indexAdditional++]);
        } 

        let responseData = {};

        if(settings.bom[id].includeBOMPartList) responseData.bomPartsList = getBOMPartsList(settings.bom[id], responses[0].data)

        changeBOMViewDone(id, settings.bom[id], responses[0].data, selectedItems, dataFlatBOM, dataAdditional);
        finishPanelContentUpdate(id, settings.bom[id], null, null, responseData);

    });

}
function changeBOMViewDone(id, settings, bom, selectedItems, dataFlatBOM, dataAdditional) {}
function setBOMHeaders(id, elemTHead) {

    let elemTHRow = $('<tr></tr>').appendTo(elemTHead).attr('id', id + '-thead-row');

    $('<th></th>').appendTo(elemTHRow).html('').addClass('bom-color');
    $('<th></th>').appendTo(elemTHRow).html('Item').addClass('bom-first-col');

    if(settings.bom[id].showRestricted) $('<th></th>').appendTo(elemTHRow).html('').addClass('bom-column-locks');
    
    for(let column of settings.bom[id].columns) {
        if(column.included) {
            $('<th></th>').appendTo(elemTHRow)
                .html(column.displayName)
                .addClass('bom-column-' + column.fieldId.toLowerCase());
        }
    }

}
function insertNextBOMLevel(id, elemTable, bom, parent, parentQuantity, numberPath, selectedItems, workspaces) {

    let result    = { hasChildren : false, hasRestricted : false};
    let firstLeaf = true;

    for(let i = settings.bom[id].indexEdge; i < bom.edges.length; i++) {

        let edge = bom.edges[i];

        if(edge.parent === parent) {

            if(i === settings.bom[id].indexEdge + 1) settings.bom[id].indexEdge = i;

            let node = {}
                        
            for(let bomNode of bom.nodes) {
                if(bomNode.item.urn === edge.child) {
                    node = bomNode;
                    break;
                }
            }
            
            node.quantity = getBOMEdgeValue(edge, settings.bom[id].fieldURNQuantity, null, 0);
            
            if((typeof node.restricted === 'undefined') || (node.restricted === false)) {

                node.restricted    = false;
                node.totalQuantity = node.quantity * parentQuantity;

                for(let field of node.fields) {

                    if('context' in field) {
                        node.restricted = true;
                    }

                    let fieldValue = (typeof field.value === 'object') ? field.value.title : field.value;

                    switch(field.metaData.urn) {

                        case settings.bom[id].fieldURNPartNumber:
                            node.partNumber = fieldValue;
                            break;

                        case settings.bom[id].fieldURNEndItem:
                            node.endItem = fieldValue;
                            break;

                        case settings.bom[id].fieldURNSelectItems:
                            node.selectItems = fieldValue;
                            edge.selectItems = fieldValue;
                            break;

                    }

                }

                if(!isBlank(settings.bom[id].fieldURNSelectItems)) {
                    for(let fieldEdge of edge.fields) {
                        if(fieldEdge.metaData.urn === settings.bom[id].fieldURNSelectItems) {
                            edge.selectItems = (typeof fieldEdge.value === 'object') ? fieldEdge.value.title : fieldEdge.value;
                            node.selectItems = edge.selectItems;
                        }
                    }
                }

            } else node.totalQuantity += node.quantity * parentQuantity;

            if(node.restricted) {

                result.hasRestricted = true;

            } else {

                result.hasChildren  = true;
                let urnEdgeChild    = edge.child;
                let isEndItem       = false;
                let workspace       = '';
                let workspaceLink   = node.item.link.split('/items/')[0];

                for(let ws of workspaces) if(ws.link === workspaceLink) { workspace = ws.title; break; }

                if((settings.bom[id].workspacesIn.length === 0) || ( settings.bom[id].workspacesIn.includes(workspace))) {
                    if((settings.bom[id].workspacesEx.length === 0) || (!settings.bom[id].workspacesEx.includes(workspace))) {

                        let elemRow = $('<tr></tr>').appendTo(elemTable)
                            .attr('data-number',         edge.itemNumber)
                            .attr('data-number-path',    numberPath + edge.itemNumber)
                            .attr('data-part-number',    node.partNumber)
                            .attr('data-quantity',       node.quantity)
                            .attr('data-total-quantity', node.totalQuantity)
                            .attr('data-number',         edge.itemNumber)
                            // .attr('data-dmsId',       node.item.link.split('/')[6])
                            .attr('data-link',           node.item.link)
                            .attr('data-root-link',      node.rootItem.link)
                            .attr('data-urn',            edge.child)
                            .attr('data-title',          node.item.title)
                            .attr('data-edgeId',         edge.edgeId)
                            .attr('data-edge-Link',      edge.edgeLink)
                            .attr('data-level',          edge.depth)
                            .addClass('level-' + edge.depth)
                            .addClass('bom-item')
                            .addClass('tree-item')
                            .addClass('content-item')
                            .click(function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                // toggleBOMItemActions($(this));
                                clickContentItem($(this), e);
                                updateBOMPath($(this));
                                togglePanelToolbarActions($(this));
                                updatePanelCalculations(id);
                                if(settings.bom[id].viewerSelection) selectInViewer(id);
                                clickBOMItem($(this), e);
                                if(!isBlank(settings.bom[id].onClickItem)) settings.bom[id].onClickItem($(this));
                            }).dblclick(function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                if(!isBlank(settings.bom[id].onDblClickItem)) settings.bom[id].onDblClickItem($(this));
                                else if(settings.bom[id].openOnDblClick) openItemByLink($(this).attr('data-link'));
                            });
                

                        let elemColor = $('<td></td>').appendTo(elemRow).addClass('bom-color');
                        let elemCell  = $('<td></td>').appendTo(elemRow).addClass('bom-first-col');

                        if(settings.bom[id].position) {

                            $('<span></span>').appendTo(elemCell)
                                .addClass('bom-number')
                                .html(edge.depth + '.' + edge.itemNumber);

                        }

                        $('<span></span>').appendTo(elemCell)
                            .addClass('bom-descriptor')
                            .html(node.item.title);

                        // if(settings.bom[id].quantity) {

                        //     $('<td></td>').appendTo(elemRow)
                        //         .addClass('bom-quantity')
                        //         .html(bomQuantity);

                        // }

                        let elemCellLocks = $('<td></td>')
                            .addClass('bom-column-icon')
                            .addClass('bom-column-locks');

                        if(settings.bom[id].showRestricted) elemCellLocks.appendTo(elemRow);

                        for(let column of settings.bom[id].columns) {

                            if(column.included) {

                                let value = '';

                                if(column.fieldTab === 'STANDARD_BOM') value = getBOMEdgeValue(edge, column.__self__.urn, null, '');
                                else value = getBOMCellValue(edge.child, column.__self__.urn, bom.nodes, 'title');

                                $('<td></td>').appendTo(elemRow)
                                    .html(value)
                                    .addClass('bom-column-' + column.fieldId.toLowerCase());

                            }

                        }

                        if(!isBlank(settings.bom[id].selectItems.values)) {
                            if(!isBlank(edge.selectItems)) {
                                if(settings.bom[id].selectItems.values.indexOf(edge.selectItems.toLowerCase()) > -1) {

                                    let selectItem = true;

                                    if(settings.bom[id].selectUnique) {
                                        for(let selectedItem of selectedItems) {
                                            if(selectedItem.node.item.link === node.item.link) {
                                                selectItem = false;
                                                break;
                                            }
                                        }
                                    }

                                    if(selectItem) {
                                        selectedItems.push({
                                            'node' : node,
                                            'edge' : edge
                                        })
                                    }

                                }
                            }

                        }

                        if(!isBlank(settings.bom[id].fieldURNEndItem)) {
                            isEndItem = (settings.bom[id].endItemValue.toString().toLowerCase() === node.endItem.toString().toLowerCase());
                        }

                        let itemBOM = (isEndItem) ? { hasChildren : false, hasRestricted : false } : insertNextBOMLevel(id, elemTable, bom, urnEdgeChild, node.quantity * parentQuantity, numberPath + edge.itemNumber + '.', selectedItems, workspaces);

                        if(!itemBOM.hasChildren) {

                            elemRow.addClass('leaf');
                            if(firstLeaf) elemRow.addClass('first-leaf');
                            firstLeaf = false;

                        } else {

                            $('<span></span>').prependTo(elemCell)
                                .addClass('bom-nav')
                                .addClass('icon')

                            elemRow.addClass('node');

                        }

                        if(itemBOM.hasRestricted) {
                            if(settings.bom[id].showRestricted) {
                                $('<span></span>').appendTo(elemCellLocks)
                                    .addClass('bom-restricted')
                                    .addClass('icon')
                                    .addClass('icon-lock')
                                    .addClass('filled')
                                    .attr('title', 'You do not have access to all items in this BOM');
                            }
                        }
                    }
                }
            }
        }
    }

    return result;

}
function enableBOMToggles(id) {

    $('#' + id).find('.bom-nav').click(function(e) {
    
        e.stopPropagation();
        e.preventDefault();

        let elemItem    = $(this).closest('tr');
        let level       = Number(elemItem.attr('data-level'));
        let levelNext   = level - 1;
        let levelHide   = level + 2;
        let elemNext    = $(this).closest('tr');
        let doExpand    = elemItem.hasClass('collapsed');
        let filterValue = $('#' + id + '-search-input').val().toLowerCase();
        let isFiltered  = (isBlank(filterValue)) ? false : true;

        if(e.shiftKey) levelHide = 100;

        elemItem.toggleClass('collapsed');

        do {

            elemNext  = elemNext.next();
            levelNext = Number(elemNext.attr('data-level'));

            if(levelNext > level) {
                if(doExpand) {
                    if(levelHide > levelNext) {
                        if((!isFiltered) || elemNext.hasClass('result') || elemNext.hasClass('result-parent')) {
                            elemNext.removeClass('hidden');
                            if(e.shiftKey) {
                                elemNext.removeClass('collapsed');
                            }
                        }
                    }
                } else {
                    elemNext.addClass('hidden');
                    elemNext.addClass('collapsed');
                }
            }

        } while(levelNext > level);


        // if(!elemItem.hasClass('collapsed')) {

        //     let elemInput   = $('#' + id + '-search-input');
        //     let filterValue = elemInput.val().toLowerCase();

        //     if(!isBlank(filterValue)) searchInBOM(id, elemInput);
            
        // }

    });

}
// function toggleBOMItemActions(elemClicked) {

//     let elemBOM             = elemClicked.closest('.bom');
//     let actionsMultiSelect  = elemBOM.find('.bom-multi-select-action');
//     let actionsSingleSelect = elemBOM.find('.bom-single-select-action');

//     if(elemBOM.find('.bom-item.selected').length === 1) actionsSingleSelect.show(); else actionsSingleSelect.hide();
//     if(elemBOM.find('.bom-item.selected').length   > 0)  actionsMultiSelect.show(); else  actionsMultiSelect.hide();

// }
// function clickBOMSelectAll(elemClicked) {

//     let elemBOM = elemClicked.closest('.bom');

//     elemBOM.find('.bom-item').addClass('selected');

//     toggleBOMItemActions(elemClicked);
//     updateBOMCounters(elemBOM.attr('id'));

// }
// function clickBOMDeselectAll(elemClicked) {

//     // let elemBOM = elemClicked.closest('.bom');

//     // elemBOM.find('.bom-item').removeClass('selected');

//     // toggleBOMItemActions(elemClicked);
//     // updateBOMPath(elemClicked);
//     // updateBOMCounters(elemBOM.attr('id'));



//     let id          = elemClicked.closest('.bom').attr('id');
//     let elemContent = elemClicked.closest('.bom').find('.bom-tbody');

//     elemContent.children().removeClass('selected');

//     updateBOMPath(elemClicked);
//     togglePanelToolbarActions($(this));
//     updatePanelCalculations(id);
//     if(settings.bom[id].viewerSelection) selectInViewer(id);
     
//     clickBOMDeselectAllDone(elemClicked);

// }
// function clickBOMDeselectAllDone(elemClicked) {}
// function clickBOMExpandAll(elemClicked) {

//     let elemBOM     = elemClicked.closest('.bom');
//     let id          = elemBOM.attr('id');
//     let elemContent = $('#' + id + '-tbody');
//     let elemInput   = $('#' + id + '-search-input');
//     let filterValue = elemInput.val().toLowerCase();

//     if(!isBlank(filterValue)) {
//         // searchInBOM(id, elemInput);
//         filterPanelContent(id);
//     } else {
//         elemContent.children().removeClass('bom-hidden').removeClass('collapsed');
//     }

// }
// function clickBOMCollapseAll(elemClicked) {

//     let elemBOM     = elemClicked.closest('.bom');
//     let id          = elemBOM.attr('id');
//     let elemContent = $('#' + id + '-tbody');

//     elemContent.children().each(function() {
//         if($(this).children('th').length === 0) {
//             if(!$(this).hasClass('bom-level-1')) {
//                 $(this).addClass('bom-hidden');
//             }
//             if($(this).hasClass('node')) $(this).addClass('collapsed');
//         }
//     });

// }
function unhideBOMParents(level, elem) {

    elem.prevAll().each(function() {

        let prevLevel = Number($(this).attr('data-level'));

        console.log(prevLevel);


        if(level === prevLevel) {
            level--;
            $(this).show();
        }

    });

}
// function clickBOMReset(elemClicked) {

//     let id          = elemClicked.closest('.bom').attr('id');
//     let elemContent = elemClicked.closest('.bom').find('.bom-tbody');

//     elemContent.children().removeClass('result').removeClass('selected').removeClass('bom-hidden');
    
//     $('#' + id + '-search-input').val('');

//     updateBOMPath(elemClicked);
//     togglePanelToolbarActions($(this));
//     updatePanelCalculations(id);
//     if(settings.bom[id].viewerSelection) selectInViewer(id);

//     clickBOMResetDone(elemClicked);

// }
// function clickBOMResetDone(elemClicked) {}
// function clickBOMOpenInPLM(elemClicked) {

//     let elemBOM   = elemClicked.closest('.bom');
//     let elemItem  = elemBOM.find('.bom-item.selected').first();
    
//     openItemByLink(elemItem.attr('data-link'));

// }
function clickBOMGoThere(elemClicked) {

    let elemBOM   = elemClicked.closest('.bom');
    let elemItem  = elemBOM.find('.bom-item.selected').first();

    if(elemItem.length > 0) {
        
        let link        = elemItem.attr('data-link').split('/');
        let location    = document.location.href.split('?');
        let params      = (location.length > 1) ? location[1].split('&') : [];
        let url         = location[0] + '?';
        let appendDMSID = true;
        let appendWSID  = true;

        for(param of params) {
            if(param.toLowerCase().indexOf('dmsid=') === 0) {
                url += '&dmsId=' + link[6];
                appendDMSID = false;
            } else if(param.toLowerCase().indexOf('wsid=') === 0) {
                url += '&wsId=' + link[4];
                appendWSID = false;
            } else url += '&' + param;
        }

        if(appendWSID) url += '&wsId=' + link[4];
        if(appendDMSID) url += '&dmsId=' + link[6];

        document.location.href = url;

    } 

}
function selectInViewer(id) {

    let listSelected = $('#' + id).find('.content-item.selected');

    if(listSelected.length === 0) {
      
        viewerResetSelection();
        
    } else {

        let partNumbers = [];

        listSelected.each(function() {
            let partNumber = $(this).attr('data-part-number');
            if(!partNumbers.includes(partNumber)) partNumbers.push(partNumber);
            
        });

        viewerSelectModels(partNumbers);

    }

}
function clickBOMItem(elemClicked, e) {}
function getBOMItemChildren(elemClicked, firstLevelOnly) {

    if(isBlank(firstLevelOnly)) firstLevelOnly = false;

    let level     = Number(elemClicked.attr('data-level'));
    let levelNext = level - 1;
    let elemNext  = elemClicked;
    let children  = [];

    do {

        elemNext  = elemNext.next();
        levelNext = Number(elemNext.attr('data-level'));

        if(levelNext > level) {
            if(firstLevelOnly) {
                if((levelNext - level) === 1 ) {
                    children.push(elemNext); 
                }
            } else children.push(elemNext);
        }

    } while(levelNext > level);

    return children;

}
function getBOMItemParent(elemItem) {

    let level = Number(elemItem.attr('data-level'));
    let elemParent = null;

    elemItem.prevAll().each(function() {
        let nextLevel = Number($(this).attr('data-level'));
        if(elemParent === null) {
        if(nextLevel < level) {
            elemParent = $(this);
        }
    }
    });

    return elemParent;

}
function getBOMItemPath(elemItem) {

    let result = {
        'string' : elemItem.attr('data-part-number'),
        'items'  : [elemItem]
    }

    let level = Number(elemItem.attr('data-level'));

    elemItem.prevAll().each(function() {
        let nextLevel = Number($(this).attr('data-level'));
        if(nextLevel < level) {
            result.string = $(this).attr('data-part-number') + '|' + result.string;
            result.items.unshift($(this));
            level = nextLevel;
        }
    });

    return result;

}
function getBOMItemByEdgeId(id, edgeId) {

    let elemTop = $('#' + id);
    let result  = null;

    elemTop.find('tr.content-item').each(function() {
        let bomEdgeId = $(this).attr('data-edgeid');
        if(!isBlank(bomEdgeId)) {
            if(bomEdgeId == edgeId) {
                result = $(this);
                return false;
            }
        }
    });

    return result;

}
function bomScrollToTop(id) {

    let elemBOM = $('#' + id + '-content');

    elemBOM.animate({ scrollTop: 0 }, 200);

}
function bomScrollToBottom(id) {

    let elemBOM  = $('#' + id + '-content');
    let elemItem = elemBOM.find('.content-item').last();
    let top      = elemItem.position().top;

    elemBOM.animate({ scrollTop: top }, 200);

}
function bomScrollToItem(elemClicked) {

    let panel   = elemClicked.closest('.panel-top');
    let id      = panel.attr('id');
    let elemBOM = $('#' + id + '-content');
    let edgeId  = elemClicked.attr('data-edgeid');
    let top     = elemBOM.innerHeight() / 2;

    $('#' + id + '-tbody').find('.bom-item').each(function() {
        if($(this).attr('data-edgeid') === edgeId) {
            console.log($(this).position().top);
            top = $(this).position().top - top;
        }
    });

    elemBOM.animate({ scrollTop: top }, 500);

}
function bomDisplayItem(elemItem) {

    let level = Number(elemItem.attr('data-level'));
    let panel = elemItem.closest('.panel-top');
    let id    = panel.attr('id');

    expandBOMParents(level - 1, elemItem);
    
    let elemBOM = elemItem.closest('.panel-content');
    let top     = elemItem.position().top - (elemBOM.innerHeight() / 2);
    
    elemBOM.animate({ scrollTop: top }, 500);

    if(settings.bom[id].path) updateBOMPath(elemItem);

}
function bomDisplayItemByPartNumber(number, select, deselect) {

    if(isBlank(select  )) select   = true;
    if(isBlank(deselect)) deselect = true;

    let result = {
        elements : [],
        links    : []
    }

    $('.bom-item').each(function() {
        if(number === $(this).attr('data-part-number')) {
            bomDisplayItem($(this));
            result.links.push($(this).attr('data-link'));
            result.elements.push($(this));
            if(select) $(this).addClass('selected');
        } else {
            if(deselect) $(this).removeClass('selected');
        }
    });

    return result;

}
function bomDisplayItemByPath(path, select, deselect) {

    if(isBlank(select  )) select   = true;
    if(isBlank(deselect)) deselect = true;

    let split    = path.split('|');
    let result   = {
        elements : [],
        links    : []
    }

    if(deselect) $('.bom-item').removeClass('selected');

    $('.bom-item.level-1').each(function() {

        let partNumber = $(this).attr('data-part-number');

        if(partNumber === split[1]) {
            getBOMPathElements(split, 1, result, $(this), select, deselect);
        }

    });    

    return result;

}
function getBOMPathElements(path, index, result, elemItem, select, deselect) {

    result.elements.push(elemItem);
    result.links.push(elemItem.attr('data-link'));

    if(index === (path.length - 1)) {

        if(select) elemItem.addClass('selected');
        bomDisplayItem(elemItem);

    } else {
        
        let children = getBOMItemChildren(elemItem, true);

        for(let child of children) {

            let partNumber = child.attr('data-part-number');

            if(partNumber === path[index + 1]) {
                getBOMPathElements(path, index + 1, result, child, select, deselect);
            }

        }
    }

}
function expandBOMParents(level, elem) {

    elem.prevAll('.bom-item.node').each(function() {

        let prevLevel   = Number($(this).attr('data-level'));
        let isNode      = $(this).hasClass('node');
        let isCollapsed = $(this).hasClass('collapsed');

        if(level === prevLevel) {
            level--;
            $(this).show();
            if(isNode) {
                if(isCollapsed) {
                    $(this).find('.bom-nav').click();
                }
            }
        }

    });

}
function updateBOMPath(elemClicked) {
    
    let elemBOM  = elemClicked.closest('.bom');
    let id       = elemBOM.attr('id');
    let elemPath = $('#' + id + '-bom-path');

    if(elemPath.length === 0) return;
    
    elemPath.html('').addClass('bom-path-empty');
    
    if(!elemClicked.hasClass('selected')) return;
    
    let path        = getBOMItemPath(elemClicked);
    let index       = 0;

    elemPath.removeClass('bom-path-empty');

    for(let item of path.items) {

        let label = item.attr('data-part-number');

        if(isBlank(label)) label = item.attr('data-title');

        label = label.split(' - ')[0];

        let elemItem = $('<div></div>').appendTo(elemPath)
            .attr('data-edgeid', item.attr('data-edgeid'))
            .html(label);

        if(path.items.length === 1) elemItem.addClass('bom-path-selected-single');

        if(index < path.items.length - 1) {
            elemItem.addClass('bom-path-parent');
            elemItem.click(function() {
                let edgeId = $(this).attr('data-edgeid');
                $('#' + id + '-tbody').find('.bom-item').each(function() {
                    if($(this).attr('data-edgeid') === edgeId) {
                        bomDisplayItem($(this));
                        $(this).click();
                    }
                });
            });
        } else {
            elemItem.addClass('bom-path-selected');
            elemItem.click(function() {
                bomScrollToItem($(this));
            });
        }

        index++;

    }

}
function resetBOMPath(id) {

    let elemPath = $('#' + id + '-bom-path');

    if(elemPath.length === 0) return;
    
    elemPath.html('').addClass('bom-path-empty');
    
}



// Insert selected BOM items in flat list
function insertBOMPartsList(link , params) {

    if(isBlank(link)) return;
    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'bom-parts-list' : params.id;
    
    settings.partList[id] = getPanelSettings(link, params, {
        headerLabel : 'BOM Parts List'
    }, [
        [ 'bomViewName'     , 'Default View' ],
        [ 'depth'           , 10             ],
        [ 'hideParents'     , false          ],
        [ 'revisionBias'    , 'release'      ],
        [ 'selectItems'     , {}             ],
        [ 'viewerSelection' , false          ]
    ]);

    settings.partList[id].load = function() { insertBOMPartsListData(id); }

    genPanelTop(id, settings.partList[id], 'partList');
    genPanelHeader(id, settings.partList[id]);
    genPanelOpenSelectedInPLMButton(id, settings.partList[id]);
    genPanelSelectionControls(id, settings.partList[id]);
    genPanelSearchInput(id, settings.partList[id]);
    genPanelResizeButton(id, settings.partList[id]);
    genPanelReloadButton(id, settings.partList[id]);
    genPanelContents(id, settings.partList[id]);

    insertBOMPartsListDone(id);

    getBOMViewId(settings.partList[id]);

}
function insertBOMPartsListDone(id) {}
function getBOMViewId( settings) {

    $.get('/plm/bom-views-and-fields', { link : settings.link, useCache : settings.useCache }, function(response) {

        for(let bomView of response.data) {
            if(bomView.name === settings.bomViewName) {
                settings.viewId = bomView.id;
                settings.viewFields = bomView.fields;
                settings.load();
            }
        }

    });

}
function insertBOMPartsListData(id) {

    settings.partList[id].timestamp = startPanelContentUpdate(id);
    settings.partList[id].columns   = [];

    let params = {
        link          : settings.partList[id].link,
        depth         : settings.partList[id].depth,
        revisionBias  : settings.partList[id].revisionBias,
        viewId        : settings.partList[id].viewId,
        timestamp     : settings.partList[id].timestamp
    }

    $.get('/plm/bom', params, function(response) {

        if(stopPanelContentUpdate(response, settings.partList[id])) return;

        let parts = getBOMPartsList(settings.partList[id], response.data);
        let items = [];

        if(parts.length > 0) {
            for(let field of parts[0].fields) {
                if(includePanelTableColumn(field.fieldId, field.displayName, settings.partList[id], settings.partList[id].columns.length)) {
                    settings.partList[id].columns.push(field);
                }
            }
        }

        for(let part of parts) {

            if((!settings.partList[id].hideParents) || (!part.hasChildren)) {

                let contentItem = genPanelContentItem(settings.partList[id], {
                    link  : part.link,
                    title : part.title
                });

                for(let field of part.fields) {
                
                    if(field.fieldId === config.items.fieldIdNumber            ) contentItem.partNumber = field.value;
                    if(field.fieldId === settings.partList[id].tileImageFieldId) contentItem.imageId    = field.value;
                    if(field.fieldId === settings.partList[id].tileTitle       ) contentItem.title      = field.value;
                    if(field.fieldId === settings.partList[id].tileSubtitle    ) contentItem.subtitle   = field.value;
                    if(field.fieldId === settings.partList[id].groupBy         ) contentItem.group      = field.value;
                    if(field.fieldId === 'DESCRIPTOR'                          ) contentItem.descriptor = field.value;
                    if(field.fieldId === 'WF_CURRENT_STATE'                    ) contentItem.status     = field.value;
                
                    for(let tileDetail of contentItem.details) {
                        if(field.fieldId === tileDetail.fieldId) {
                            tileDetail.value = field.fieldData.value;
                        }
                    }
                    for(let column of settings.partList[id].columns) {

                        if(field.fieldId === column.fieldId) {
                        
                            let value = field.value;
                        
                            contentItem.data.push({
                                fieldId : column.fieldId,
                                value   : value
                            });

                        }

                    }

                }

                items.push(contentItem);
            }

        }

        insertBOMPartsListDataDone(id, response);
        finishPanelContentUpdate(id, settings.partList[id], items);

    });

}
function insertBOMPartsListDataDone(id, response) {}



// Insert Flat BOM with selected controls
function insertFlatBOM(link , params) {

    if(isBlank(link)) return;

    let id = isBlank(params.id) ? 'flat-bom' : params.id;
    
    settings.flatBOM[id] = getPanelSettings(link, params, {
        headerLabel : 'Flat BOM'
    }, [
        [ 'viewSelector'    , false ],
        [ 'fieldIdPartNumber'    , 'NUMBER' ],
        // [ 'filterEmpty'     , false ],
        // [ 'counters'        , false ],
        // [ 'totals'          , false ],
        // [ 'ranges'          , false ],
        [ 'depth'           , 10 ],
        [ 'revisionBias'    , 'release' ],
        [ 'bomViewName'     , '' ],
        [ 'bomViewId'       , '' ]
    ]);

    settings.flatBOM[id].layout = 'table';
    settings.flatBOM[id].load   = function() { insertFlatBOMData(id); }

    genPanelTop(id, settings.flatBOM[id], 'flat-bom');
    genPanelHeader(id, settings.flatBOM[id]);
    genPanelOpenSelectedInPLMButton(id, settings.flatBOM[id]);
    genPanelSelectionControls(id, settings.flatBOM[id]);

    let elemToolbar = genPanelToolbar(id, settings.flatBOM[id], 'controls');

    $('<select></select>').appendTo(elemToolbar)
        .addClass('flat-bom-view-selector')
        .addClass('button')
        .attr('id', id + '-view-selector')
        .hide()
        .change(function() {
            insertFlatBOMData(id);
        });

    genPanelSearchInput(id, settings.flatBOM[id]);
    genPanelResizeButton(id, settings.flatBOM[id]);
    genPanelReloadButton(id, settings.flatBOM[id] );

    genPanelContents(id, settings.flatBOM[id]);

    if(settings.flatBOM[id].editable) {

        let elemToolbar = genPanelToolbar(id, settings.flatBOM[id], 'controls');

        $('<div></div>').prependTo(elemToolbar)
            .addClass('button')
            .addClass('default')
            .attr('id', id + '-save')
            .html('Save')
            .hide()
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                savePanelTableChanges(id, settings.flatBOM[id]);
            });

    }

    insertFlatBOMDone(id);        
    getBOMTabViews(id,  settings.flatBOM[id]);


    //  Set defaults for optional parameters
    // --------------------------------------
    // let multiSelect     = false;           // Enables selection of multiple items
    // let filterEmpty     = false;           // When set to true, adds filter for rows with empty input cells 
    // let tableHeaders    = true;            // When set to false, the table headers will not be shown
    // let number          = true;            // When set to true, a counter will be displayed as first column
    // let descriptor      = true;            // When set to true, the descriptor will be displayed as first table column
    // let quantity        = false;           // When set to true, the quantity column will be displayed
    // let hideDetails     = false;           // When set to true, detail columns will be skipped, only the descriptor will be shown
    // let counters        = true;            // Display counters at bottom to indicate total, selected, filtered and modified items
    // let totals          = false;           // Enable automatic total calculation for numeric columns, based on selected (or all) items
    // let ranges          = false;           // Enable automatic range indicators for numeric columns, based on selected (or all) items
    // let depth           = 10;              // BOM Levels to expand
    // let revisionBias    = 'release';       // Set BOM configuration to expand [release, working, changeOrder, allChangeOrder]
    // let bomViewName     = '';              // BOM view of PLM to display (if no value is provided, bomViewId will be used)
    // let bomViewId       = '';              // BOM view of PLM to display (if no value is provided, the first view available will be used)
    
    // if(!isBlank(params.viewSelector)  )   viewSelector = params.viewSelector;
    // if(!isBlank(params.search)        )         search = params.search;
    // if(!isBlank(params.placeholder)   )    placeholder = params.placeholder;
    // if(!isBlank(params.multiSelect)   )    multiSelect = params.multiSelect;
    // if(!isBlank(params.filterSelected)) filterSelected = params.filterSelected;
    // if(!isBlank(params.tableHeaders)  )   tableHeaders = params.tableHeaders;
    // if(!isBlank(params.number)        )         number = params.number;
    // if(!isBlank(params.descriptor)    )     descriptor = params.descriptor;
    // if(!isBlank(params.quantity)      )       quantity = params.quantity;
    // if(!isBlank(params.totals)        )         totals = params.totals;
    // if(!isBlank(params.ranges)        )         ranges = params.ranges;

        // $('<div></div>').appendTo($('#' + id + '-toolbar'))
            // .addClass('button') 
            // .addClass('with-icon') 
            // .addClass('icon-filter') 
            // .addClass('flat-bom-counter') 
            // .html('0 rows selected')
            // .hide()
            // .click(function() {
            //     $(this).toggleClass('selected');
            //     filterFlatBOMByCounter($(this));
            // });
      

    // } else { elemTop.addClass('no-header'); }

}
function insertFlatBOMDone(id) {}
function insertFlatBOMData(id) {

    settings.flatBOM[id].timestamp = startPanelContentUpdate(id);
    settings.flatBOM[id].viewId    = $('#' +  id + '-view-selector').val();

    let params = {
        link          : settings.flatBOM[id].link,
        depth         : settings.flatBOM[id].depth,
        revisionBias  : settings.flatBOM[id].revisionBias,
        viewId        : settings.flatBOM[id].viewId,
        timestamp     : settings.flatBOM[id].timestamp
    }

    for(let view of settings.flatBOM[id].bomViews) {
        if(params.viewId == view.id) {
            settings.flatBOM[id].columns             = view.columns;
            settings.flatBOM[id].fieldURNPartNumber  = view.urns.partNumber;
            settings.flatBOM[id].fieldURNQuantity    = view.urns.quantity;
            settings.flatBOM[id].fieldURNEndItem     = view.urns.endItem;
            settings.flatBOM[id].fieldURNSelectItems = view.urns.selectItems;
            break;
        }
    }

    sortArray(settings.flatBOM[id].columns, 'displayOrder', 'integer');

    let requests = [
        $.get('/plm/bom-flat', params),
        $.get('/plm/workspaces', { useCache : true})
    ];

    for(let field of settings.flatBOM[id].columns) {
        // if(field.fieldId === config.items.fieldIdNumber) fieldURNPartNumber = field.__self__.urn;
        if(settings.flatBOM[id].editable) {
            if(field.visibility !== 'NEVER') {
                if(field.editability !== 'NEVER') {
                    if(field.type.title === 'Single Selection') {
                        field.picklist = field.lookups;
                        let add = true
                        for(let picklist of cachePicklists) {
                            if(picklist.link === field.lookups) {
                                add = false;
                                continue;
                            }
                        }
                        if(add) requests.push($.get( '/plm/picklist', { 'link' : field.lookups, 'limit' : 100, 'offset' : 0 }));
                    }
                }
            }
        }
    }

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.flatBOM[id])) return;

        let columns = [];
        let items   = [];
        let bom     = responses[0].data;

        for(let view of settings.flatBOM[id].bomViews) {
            if(settings.flatBOM[id].viewId == view.id) {
                columns = view.columns;
                break;
            }
        }
    
        for(let column of columns) {
            if(includePanelTableColumn(column.fieldId, column.displayName, settings.flatBOM[id], settings.flatBOM[id].columns.length)) {
                settings.flatBOM[id].columns.push(column);
            }
        }

        for(let item of bom) {

            let workspace     = '';
            let workspaceLink = item.item.link.split('/items/')[0];

            for(let ws of responses[1].data.items) {
                if(ws.link === workspaceLink) { workspace = ws.title; break; }
            }

            if((settings.flatBOM[id].workspacesIn.length === 0) || ( settings.flatBOM[id].workspacesIn.includes(workspace))) {
                if((settings.flatBOM[id].workspacesEx.length === 0) || (!settings.flatBOM[id].workspacesEx.includes(workspace))) {

                    let contentItem = genPanelContentItem(settings.flatBOM[id], {
                        link       : item.item.link,
                        title      : item.item.title,
                        quantity   : item.totalQuantity,
                        partNumber : getFlatBOMNodeValue(item, settings.flatBOM[id].fieldURNPartNumber)
                    });

                    for(let column of settings.flatBOM[id].columns) {

                        let value = '';

                        for(let field of item.occurrences[0].fields) {
                            if(field.metaData.link === column.__self__.link) {
                                value = field.value;
                                break;
                            }
                        }

                        contentItem.data.push({
                            fieldId : column.fieldId,
                            value   : value
                        });

                    }

                    // for(let field of item.data) {
                    //     if(field.fieldId === config.items.fieldIdNumber) {
                    //         contentItem.partNumber = field.value;
                    //         break;
                    //     }

                    // }

                    items.push(contentItem);

                }
            }

        }

        finishPanelContentUpdate(id, settings.flatBOM[id], items);
        insertFlatBOMDataDone(id, responses);

    });

}
function insertFlatBOMDataDone(id, data) {}



// Insert Where Used immediate parents
// function insertParents(link, id, icon, enableExpand) {

//     if(isBlank(link         )) return;
//     if(isBlank(id           ))           id = 'parents';
//     if(isBlank(icon         ))         icon = 'account_tree';
//     if(isBlank(enableExpand )) enableExpand = false;

//     let timestamp = new Date().getTime();

//     let elemList = $('#' + id + '-list');
//         elemList.attr('data-timestamp', timestamp);
//         elemList.html('');

//     let elemProcessing = $('#' + id + '-processing')
//         elemProcessing.show();

//     let params = {
//         'link'      : link,
//         'depth'     : 1,
//         'timestamp' : timestamp
//     }

//     $.get('/plm/where-used', params, function(response) {

//         if(response.params.timestamp === $('#' + id + '-list').attr('data-timestamp')) {
//             if(response.params.link === link) {
        
//                 elemProcessing.hide();

//                 for(let edge of response.data.edges) {

//                     let urnParent = edge.child;
//                     let quantity  =  0;

//                     for(let node of response.data.nodes) {

//                         console.log(urnParent);
//                         console.log(node.item.urn);

//                         if(urnParent === node.item.urn){ 

//                             console.log('hier');

//                             for(field of node.fields) {
//                                 if(field.title === 'QUANTITY') quantity = field.value;
//                             }

//                             let elemTile = genTile(node.item.link, '', '', icon, node.item.title, 'Quantity: ' + quantity);
//                                 elemTile.appendTo(elemList);
//                                 elemTile.addClass('parent');
//                                 elemTile.click(function(e) {
//                                     e.preventDefault();
//                                     e.stopPropagation();
//                                     clickParentItem($(this));
//                                 });

//                             if(enableExpand) {

//                                 let elemToggle = $('<div></div>');
//                                     elemToggle.addClass('icon');
//                                     elemToggle.addClass('icon-expand');
//                                     elemToggle.addClass('tile-toggle');
//                                     elemToggle.prependTo(elemTile);
//                                     elemToggle.click(function(e) {
//                                         e.preventDefault();
//                                         e.stopPropagation();
//                                         clickParentItemToggle(id, $(this));
//                                     });
                                    
//                             }

//                         }
//                     }
//                 }

//                 if(response.data.totalCount === 0) {
//                     $('<div>No parents found</div>').appendTo(elemList)
//                         .css('margin', 'auto');
//                 }

//                 insertParentsDone(id);

//             }     
//         }

//     });
    
// }
// function insertParentsDone(id) {}
// function clickParentItem(elemClicked) { openItemByLink(elemClicked.attr('data-link')); }
// function clickParentItemToggle(id, elemClicked) { 

//     let elemParent = elemClicked.closest('.tile');
//         elemParent.toggleClass('expanded');

//     if(elemParent.hasClass('expanded')) {

//         if(elemParent.nextUntil('.parent').length === 0) {
        
//         let linkParent  = elemParent.attr('data-link');
//         let idBOM       = 'bom-' + linkParent.split('/')[6];
//         let elemBOM     = $('<div></div>');
        
//         elemBOM.attr('id', idBOM);
//         elemBOM.addClass('child');
//         elemBOM.insertAfter(elemParent);
        
//         insertBOM(linkParent, {
//             'id'        : idBOM,
//             'title'     : '',
//             'toggles'   : true,
//             'search'    : true
//         });

//         } else {
//             elemParent.nextUntil('.parent').show();
//         }

//     } else {
        
//         elemParent.nextUntil('.parent').hide();

//     }

// }


// Insert Where Used root items
function insertRootParents(link, params) {

    if(isBlank(link)) return;

    let id = isBlank(params.id) ? 'roots' : params.id;
    
    settings.roots[id] = getPanelSettings(link, params, {
        headerLabel : 'Root Parents',
        layout      : 'table',
        tileIcon    : 'icon-link'
    }, [
        [ 'depth'             , 10   ],
        [ 'filterByLifecycle' , true ],
        [ 'filterByWorkspace' , true ]
    ]);

    settings.roots[id].load = function() { insertRootParentsData(id); }

    genPanelTop(id, settings.roots[id], 'roots');
    genPanelHeader(id, settings.roots[id]);
    genPanelOpenSelectedInPLMButton(id, settings.roots[id]);
    genPanelSelectionControls(id, settings.roots[id]);
    genPanelFilterSelect(id, settings.roots[id], 'filterByLifecycle', 'lifecycle', 'All Lifecycles');
    genPanelFilterSelect(id, settings.roots[id], 'filterByWorkspace', 'workspace', 'All Workspaces');
    genPanelSearchInput(id, settings.roots[id]);
    genPanelResizeButton(id, settings.roots[id]);
    genPanelReloadButton(id, settings.roots[id]);

    genPanelContents(id, settings.roots[id]);

    insertRootParentsDone(id);
    
    settings.roots[id].load();

}
function insertRootParentsData(id) {

    settings.roots[id].timestamp = startPanelContentUpdate(id);

    let params = {
        link        : settings.roots[id].link,
        depth       : settings.roots[id].depth,
        timestamp   : settings.roots[id].timestamp
    }

    let requests = [
        $.get('/plm/where-used', params),
        $.get('/plm/workspaces', { useCache : true } )
    ]

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.roots[id])) return;

        let items           = [];
        let listWorkspaces  = [];
        let listLifecycles  = [];
        let columns         = [
            { displayName : 'Item',      fieldId : 'item'      },
            { displayName : 'Lifecycle', fieldId : 'lifecycle' },
            { displayName : 'Quantity',  fieldId : 'quantity'  },
            { displayName : 'Hierarchy', fieldId : 'hierarchy' }
        ]


        for(let column of columns) {
            if(includePanelTableColumn(column.fieldId, column.displayName, settings.roots[id], settings.roots[id].columns.length)) {
                settings.roots[id].columns.push(column);
            }
        }

        for(let edge of responses[0].data.edges) {

            if(!edge.hasOwnProperty('edgeLink')) {

                for(let node of responses[0].data.nodes) {

                    if(edge.child === node.item.urn) {

                        let workspace   = '';
                        let linkWorkspace = node.item.link.split('/items/')[0];

                        for(let ws of responses[1].data.items) {
                            if(linkWorkspace === ws.link) {
                                workspace = ws.title;
                                break;
                            }
                        }

                        if((settings.roots[id].workspacesIn.length === 0) || ( settings.roots[id].workspacesIn.includes(workspace))) {
                            if((settings.roots[id].workspacesEx.length === 0) || (!settings.roots[id].workspacesEx.includes(workspace))) {

                                let lifecycle   = '';
                                let quantity    = '';

                                for(let field of node.fields) {
                                         if(field.title === 'QUANTITY' ) quantity  = field.value;
                                    else if(field.title === 'LIFECYCLE') lifecycle = field.value;
                                }

                                let path = [];

                                if(!listWorkspaces.includes(workspace)) listWorkspaces.push(workspace);
                                if(!listLifecycles.includes(lifecycle)) listLifecycles.push(lifecycle);
                                
                                getRootChildren(path, responses[0].data.edges, responses[0].data.nodes, node.item.urn, 1);

                                let contentItem = genPanelContentItem(settings.roots[id], {
                                    link        : node.item.link,
                                    title       : node.item.title,
                                    subtitle    : workspace,
                                });

                                contentItem.path = path;

                                contentItem.data = [
                                    { fieldId : 'item'       , value : node.item.title },
                                    { fieldId : 'lifecycle'  , value : lifecycle       },
                                    { fieldId : 'quantity'   , value : quantity        },
                                    { fieldId : 'hierarchy'  , value : ''              }
                                ];
                    
                                contentItem.filters = [
                                    { key : 'lifecycle', value : lifecycle },
                                    { key : 'workspace', value : workspace }
                                ];                                

                                items.push(contentItem);

                            }
                        }

                    }
                }
            }
        }

        if(settings.roots[id].layout.toLowerCase() === 'table') {
            genTable(id ,items, settings.roots[id]);
            $('#' + id + '-tbody').children().each(function() {
                
                let elemCell = $(this).children().last();
                let link     = $(this).attr('data-link');
            
                for(let item of items) {

                    if(item.link === link) {

                        for(let step of item.path) {

                            let elemParent     = $('<div></div>').appendTo(elemCell)
                                .addClass('roots-parent')
                                .addClass('content-item')
                                .attr('data-link', item.link)
                                .attr('data-part-number', item.title.split(' - ')[0])
                                .attr('data-title', item.title);

                            let elemParentPath = $('<div></div>').appendTo(elemParent).addClass('roots-parent-path');

                            for(let i = step.level - 1; i > 0; i--) { elemParentPath.append('<div class="path-icon icon icon-east"></div>'); }

                            $('<div></div>').appendTo(elemParentPath)
                                .addClass('path-child')
                                .html(step.title);

                        }

                        break;

                    }

                }

            });
        } else {
            genTilesList(id, items, settings.roots[id]);   
            // addTilesListImages(id, settings.roots[id]);
        }

        setPanelFilterOptions(id, 'lifecycle', listLifecycles);
        setPanelFilterOptions(id, 'workspace', listWorkspaces);
        finishPanelContentUpdate(id, settings.roots[id]);
        insertRootParentsDataDone(id, responses[0].data);
           
    });
    
}
function getRootChildren(path, edges, nodes, parent, level) {

    for(let edge of edges) {

        if(parent === edge.child) {

            for(let node of nodes) {
                if(parent === node.item.urn) {
                    path.push({
                        level : level,
                        link : node.item.link,
                        title : node.item.title
                    });
                }
            }

            getRootChildren(path, edges, nodes, edge.parent, level + 1);

        }

    }

}
function insertRootParentsDone(id) {}
function insertRootParentsDataDone(id, data) {}



// Insert Where Used direct parents
function insertParents(link, params) {

    if(isBlank(link)) return;

    let id = isBlank(params.id) ? 'parents' : params.id;
    
    settings.parents[id] = getPanelSettings(link, params, {
        headerLabel : 'Parents',
        layout      : 'list',
        tileIcon    : 'icon-product'
    }, [
        [ 'displayParentsBOM', false ],
        [ 'filterByLifecycle', false ],
        [ 'filterByWorkspace', false ],
        [ 'afterParentBOMCompletion', function(id) {} ]
    ]);

    settings.parents[id].expand = settings.parents[id].displayParentsBOM;
    settings.parents[id].load = function() { insertParentsData(id); }

    genPanelTop(id, settings.parents[id], 'parents');
    genPanelHeader(id, settings.parents[id]);
    genPanelOpenSelectedInPLMButton(id, settings.parents[id]);
    genPanelSelectionControls(id, settings.parents[id]);
    genPanelFilterSelect(id, settings.parents[id], 'filterByLifecycle', 'lifecycle', 'All Lifecycles');
    genPanelFilterSelect(id, settings.parents[id], 'filterByWorkspace', 'workspace', 'All Workspaces');
    genPanelSearchInput(id, settings.parents[id]);
    genPanelResizeButton(id, settings.parents[id]);
    genPanelReloadButton(id, settings.parents[id]);

    genPanelContents(id, settings.parents[id]);

    insertParentsDone(id);
    
    settings.parents[id].load();

}
function insertParentsData(id) {

    settings.parents[id].timestamp = startPanelContentUpdate(id);

    let params = {
        link        : settings.parents[id].link,
        limit       : 1,
        timestamp   : settings.parents[id].timestamp
    }

    let requests = [
        $.get('/plm/where-used', params),
        $.get('/plm/workspaces'   , { useCache : true } )
    ]

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.parents[id])) return;

        let items           = [];
        let listWorkspaces  = [];
        let listLifecycles  = [];
        let columns         = [
            { displayName : 'Item',      fieldId : 'item'      },
            { displayName : 'Lifecycle', fieldId : 'lifecycle' },
            { displayName : 'Workspace', fieldId : 'workspace' }
        ]

        for(let column of columns) {
            if(includePanelTableColumn(column.fieldId, column.displayName, settings.parents[id], settings.parents[id].columns.length)) {
                settings.parents[id].columns.push(column);
            }
        }

        for(let parent of responses[0].data.edges) {

            for(let node of responses[0].data.nodes) {

                if(parent.child === node.item.urn){ 

                    let workspace     = '';
                    let lifecycle     = '';
                    let linkWorkspace = node.item.link.split('/items/')[0];

                    for(let ws of responses[1].data.items) {
                        if(linkWorkspace === ws.link) {
                            workspace = ws.title;
                            break;
                        }
                    }

                    if((settings.parents[id].workspacesIn.length === 0) || ( settings.parents[id].workspacesIn.includes(workspace))) {
                        if((settings.parents[id].workspacesEx.length === 0) || (!settings.parents[id].workspacesEx.includes(workspace))) {

                            for(let field of node.fields) {
                                if(field.title === 'LIFECYCLE') lifecycle = field.value;
                            }

                            if(!listWorkspaces.includes(workspace)) listWorkspaces.push(workspace);
                            if(!listLifecycles.includes(lifecycle)) listLifecycles.push(lifecycle);

                            let contentItem = genPanelContentItem(settings.parents[id], {
                                link        : node.item.link,
                                title       : node.item.title,
                                subtitle    : lifecycle,
                            });

                            contentItem.data = [
                                { fieldId : 'item'       , value : node.item.title },
                                { fieldId : 'lifecycle'  , value : lifecycle },
                                { fieldId : 'workspace'  , value : workspace }
                            ];

                            contentItem.filters = [
                                { key : 'lifecycle', value : lifecycle },
                                { key : 'workspace', value : workspace }
                            ];

                            items.push(contentItem);

                        }
                    }
                }
            }
                
        }

        if(settings.parents[id].layout.toLowerCase() === 'table') {
            genTable(id, items, settings.parents[id]);
        } else {
            genTilesList(id, items, settings.parents[id]);   
            addTilesListChevrons(id, settings.parents[id], function(elemClicked) { insertParentBOM(id, elemClicked); });
        }

        sortArray(listLifecycles, 0);
        sortArray(listWorkspaces, 0);

        setPanelFilterOptions(id, 'lifecycle', listLifecycles);
        setPanelFilterOptions(id, 'workspace', listWorkspaces);
        finishPanelContentUpdate(id, settings.parents[id]);
        insertParentsDataDone(id, responses[0].data);
        
    });

}
function insertParentBOM(id, elemClicked) {

    let elemParent = elemClicked.closest('.content-item');
    let linkParent = elemParent.attr('data-link');

    if(elemClicked.hasClass('icon-collapse')) {

        let idBOM = 'parent-bom-' + linkParent.split('/')[6];
        
        $('<div></div>').insertAfter(elemParent)
            .attr('id', idBOM)    
            .addClass('parent-bom');
                
        insertBOM(linkParent, {
            id               : idBOM,
            hideHeader       : true,
            title            : '',
            collapseContents : true,
            afterCompletion  : function() { settings.parents[id].afterParentBOMCompletion(idBOM); }
        });

    } else {

        elemParent.nextUntil('.content-item').remove();

    }

}
function insertParentsDone(id)  {}
function insertParentsDataDone(id, data)  {}




// Insert BOM children which are new or have been changed
function insertBOMChanges(link, params) {

    if(isBlank(link)) return;

    let id = isBlank(params.id) ? 'changes' : params.id;
    
    settings.changes[id] = getPanelSettings(link, params, {
        headerLabel : 'Changed BOM Items',
        layout      : 'list',
        tileIcon    : 'icon-product'
    }, [
        [ 'depth'             , 10   ],
        [ 'filterByLifecycle' , true ],
        [ 'filterByWorkspace' , true ],
        [ 'limit'             , 250  ],
        [ 'wsIdChangesProcess', '78' ]
    ]);

    settings.changes[id].load = function() { insertBOMChangesData(id); }

    genPanelTop(id, settings.changes[id], 'changes');
    genPanelHeader(id, settings.changes[id]);
    genPanelOpenSelectedInPLMButton(id, settings.changes[id]);
    genPanelSelectionControls(id, settings.changes[id]);
    genPanelFilterSelect(id, settings.changes[id], 'filterByLifecycle', 'lifecycle', 'All Lifecycles');
    genPanelFilterSelect(id, settings.changes[id], 'filterByWorkspace', 'workspace', 'All Workspaces');
    genPanelSearchInput(id, settings.changes[id]);
    genPanelResizeButton(id, settings.changes[id]);
    genPanelReloadButton(id, settings.changes[id]);

    genPanelContents(id, settings.changes[id]);

    insertBOMChangesDone(id);

    settings.changes[id].load();

}
function insertBOMChangesData(id) {

    settings.changes[id].timestamp = startPanelContentUpdate(id);

    let params = {
        link        : settings.changes[id].link,
        limit       : settings.changes[id].limit,
        relatedWSID : settings.changes[id].wsIdChangesProcess,
        timestamp   : settings.changes[id].timestamp
    }

    let requests = [
        $.get('/plm/related-items', params),
        $.get('/plm/workspaces'   , { useCache : true } )
    ]

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.changes[id])) return;

        let items           = [];
        let listWorkspaces  = [];
        let listLifecycles  = [];
        let columns         = [
            { displayName : 'Item',      fieldId : 'item'      },
            { displayName : 'Lifecycle', fieldId : 'lifecycle' },
        ]

        for(let column of columns) {
            if(includePanelTableColumn(column.fieldId, column.displayName, settings.changes[id], settings.changes[id].columns.length)) {
                settings.changes[id].columns.push(column);
            }
        }

        for(let changedItem of responses[0].data) {

            let workspace     = '';
            let linkWorkspace = changedItem.link.split('/items/')[0];

            for(let ws of responses[1].data.items) {
                if(linkWorkspace === ws.link) {
                    workspace = ws.title;
                    break;
                }
            }

            

            if((settings.changes[id].workspacesIn.length === 0) || ( settings.changes[id].workspacesIn.includes(workspace))) {
                if((settings.changes[id].workspacesEx.length === 0) || (!settings.changes[id].workspacesEx.includes(workspace))) {

                    if(!listWorkspaces.includes(workspace)) listWorkspaces.push(workspace);
                    if(!listLifecycles.includes(changedItem.lifecycle)) listLifecycles.push(changedItem.lifecycle);

                    let contentItem = genPanelContentItem(settings.changes[id], {
                        link        : changedItem.link,
                        title       : changedItem.title,
                        subtitle    : changedItem.lifecycle,
                    });

                    contentItem.data = [
                        { fieldId : 'item'       , value : changedItem.title },
                        { fieldId : 'lifecycle'  , value : changedItem.lifecycle }
                    ];

                    contentItem.filters = [
                        { key : 'lifecycle', value : changedItem.lifecycle },
                        { key : 'workspace', value : workspace }
                    ];

                    items.push(contentItem)

                }
            }
                
        }

        sortArray(listLifecycles, 0);
        sortArray(listWorkspaces, 0);

        setPanelFilterOptions(id, 'lifecycle', listLifecycles);
        setPanelFilterOptions(id, 'workspace', listWorkspaces);
        finishPanelContentUpdate(id, settings.changes[id], items);
        insertBOMChangesDataDone(id, responses[0].data);
        
    });

}
function insertBOMChangesDone(id) {}
function insertBOMChangesDataDone(id, data)  {}



// Insert APS Viewer
function insertViewer(link, params) {

    if(isBlank(link)) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let id          = 'viewer';
    let fileId      = '';         // Select a specific file to be rendered by providing its unique ID
    let filename    = '';         // Select a specific file to be rendered by providing its filename (matches the Title column in the attachments tab) 

    if( isBlank(params)         )   params = {};
    if(!isBlank(params.id)      )       id = params.id;
    if(!isBlank(params.fileId)  )   fileId = params.fileId;
    if(!isBlank(params.filename)) filename = params.filename;

    settings.viewer[id]               = {};
    settings.viewer[id].link          = link;
    settings.viewer[id].timeStamp     = new Date().getTime();
    settings.viewer[id].extensionsIn  = ['dwf','dwfx','iam','ipt','stp','step','sldprt','pdf'];
    settings.viewer[id].extensionsEx  = [];
    settings.viewer[id].restartViewer = params.restartViewer || false;

    if(!isBlank(params.extensionsIn)    ) settings.viewer[id].extensionsIn     = params.extensionsIn;
    if(!isBlank(params.extensionsEx)    ) settings.viewer[id].extensionsEx     = params.extensionsEx;
    if(!isBlank(params.backgroundColor) ) settings.viewer[id].backgroundColor  = params.backgroundColor;
    if(!isBlank(params.antiAliasing)    ) settings.viewer[id].antiAliasing     = params.antiAliasing;
    if(!isBlank(params.ambientShadows)  ) settings.viewer[id].ambientShadows   = params.ambientShadows;
    if(!isBlank(params.groundReflection)) settings.viewer[id].groundReflection = params.groundReflection;
    if(!isBlank(params.groundShadow)    ) settings.viewer[id].groundShadow     = params.groundShadow;
    if(!isBlank(params.lightPreset)     ) settings.viewer[id].lightPreset      = params.lightPreset;

    let elemInstance = $('#' + id).children('.adsk-viewing-viewer');
    if(elemInstance.length > 0) elemInstance.hide();

    $('#' + id).attr('data-link', link);

    let elemProcessing = $('#' + id + '-processing');

    if(elemProcessing.length === 0) {
        appendViewerProcessing(id, false);
    } else {
        elemProcessing.show();
        $('#' + id + '-message').hide();
    }

    $.get('/plm/get-viewables', { 
        link          : link, 
        fileId        : fileId, 
        filename      : filename, 
        extensionsIn  : settings.viewer[id].extensionsIn, 
        extensionsEx  : settings.viewer[id].extensionsEx, 
        timeStamp     : settings.viewer[id].timeStamp
    }, function(response) {

        if(settings.viewer[id].link      !== response.params.link     ) return;
        if(settings.viewer[id].timeStamp !=  response.params.timeStamp) return;

        
        if(response.data.length > 0) {
            
            sortArray(response.data, 'size', 'integer', 'descending');
            
            let formats3D  = config.viewer.preferredFileSuffixes || ['.ipt.dwf', '.iam.dwf'];
            let viewables  = [];
            let found3DDWF = false;

            for(let viewable of response.data) {
                if((viewable.type == 'DWF File') && !found3DDWF) {
                    for(let format of formats3D) {
                        if(viewable.name.toLowerCase().indexOf(format.toLowerCase()) > -1) found3DDWF = true;
                    }
                    viewables.unshift(viewable);
                } else viewables.push(viewable);
            }

            $('body').removeClass('no-viewer');

            if(elemInstance.length > 0) elemInstance.show();

            insertViewerDone(id, response.data);
            initViewer(id, viewables, settings.viewer[id]);

        } else {

            $('#' + id).hide();
            $('#' + id + '-processing').hide();
            $('#' + id + '-message').css('display', 'flex');
            $('body').addClass('no-viewer');

        }
        
    });

}
function insertViewerDone(id, viewables) {}



// Insert Viewer and Markups
function insertViewerMarkups(contentId, link, params, sections, fields) {

    let linkViewable   = (isBlank(params.fieldIdViewable)) ? link : getSectionFieldValue(sections, params.fieldIdViewable, '', 'link');
    let allImageFields = getAllImageFieldIDs(fields);
    let elemTop        = $('#' + contentId);

    if(isBlank(params.markupsImageFields)) params.markupsImageFields = [];

    if(params.markupsImageFields.length === 0) {
        if(!isBlank(params.markupsImageFieldsPrefix)) {
            params.markupsImageFields = allImageFields
        } else {
            for(let imageField of allImageFields) {
                if(imageField.indexOf(params.markupsImageFieldsPrefix) === 0) params.markupsImageFields.push(imageField);
            }
        }
    }

    let elemViewer = $('#' + contentId + '-viewer');

    if(elemViewer.length === 0) {

        $('<div></div>').appendTo(elemTop)
            .attr('id', contentId + '-viewer')
            .addClass('viewer');

    }
    
    params.id             = contentId + '-viewer';
    params.restartViewer  = true;
    viewerFeatures.markup = true;

    insertViewer(linkViewable, params);
    
    let elemMarkups = $('<div></div>').appendTo(elemTop)
        .attr('id', contentId + '-markups')
        .addClass('item-markups');

    let elemMarkupsPanel = $('<div></div>').appendTo(elemMarkups)
        .attr('id', contentId + '-markups-panel')
        .addClass('item-markups-panel');
    
    $('<div></div>').appendTo(elemMarkupsPanel)
        .addClass('item-markups-panel-title')
        .html('Markups');

    $('<div></div>').appendTo(elemMarkupsPanel)
        .addClass('item-markups-panel-text')
        .html('Capture markups using the given controls within the viewer above. They will be saved in context of this process.');

    let elemMarkupsList = $('<div></div>').appendTo(elemMarkups)
        .attr('id', contentId + '-viewer-markups-list')
        .addClass('item-markups-list');

    for(let field of params.markupsImageFields) {

        $('<canvas></canvas>').appendTo(elemMarkupsList)
            .attr('id', field)
            .attr('data-fieldid', field)
            .addClass('markup')
            .addClass('placeholder')
            .click(function() {
                selectItemMarkup($(this));
            });

        let value = getSectionFieldValue(sections, field, '', 'link');

        if(value !== '') {

            $.get('/plm/image-cache', {
                imageLink : value,
                fieldId   : field
            }, function(response) {

                $('#' + response.params.fieldId).removeClass('placeholder');

                let canvas = document.getElementById(response.params.fieldId);
                    // canvas.width  = 100;
                    canvas.height = 80;

                let ctx  = canvas.getContext('2d');
                let img = new Image();
                    img.src = response.data.url;
                    img.onload = function() {
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    };
            
            });

        }

    }

    params.id = contentId;

}
function selectItemMarkup(elemClicked) {

    elemClicked.siblings().removeClass('selected');
    elemClicked.toggleClass('selected');

    let elemTop     = elemClicked.closest('.item-markup');
    let elemToolbar = elemTop.find('.viewer-markup-toolbar');
    let elemButton  = elemTop.find('.viewer-markup-button.enable-markup');

    if(elemClicked.hasClass('selected')) {
        if(elemToolbar.hasClass('hidden')) {
            elemButton.click();
        }
    } else if(!elemToolbar.hasClass('hidden')) {
        viewerLeaveMarkupMode();
    }

}



// Insert Managed Items tab
function insertManagedItems(link, params) {

    if(isBlank(link)) return;

    let id = isBlank(params.id) ? 'managed-items' : params.id;
    
    settings.managedItems[id] = getPanelSettings(link, params, {
        headerLabel : 'Managed Items',
        layout      : 'table',
        tileIcon    : 'icon-product'
    }, [
        [ 'filterByLifecycle'   , true  ],
        [ 'filterByWorkspace'   , true  ],
        [ 'hideButtonDisconnect', false ]
    ]);

    settings.managedItems[id].load = function() { insertManagedItemsData(id); }

    genPanelTop(id, settings.managedItems[id], 'managed-items');
    genPanelHeader(id, settings.managedItems[id]);
    genPanelOpenSelectedInPLMButton(id, settings.managedItems[id]);
    genPanelDisconnectButton(id, settings.managedItems[id], function() { removeManagedItems(id); } );
    genPanelSelectionControls(id, settings.managedItems[id]);
    genPanelFilterSelect(id, settings.managedItems[id], 'filterByLifecycle', 'lifecycle', 'All Lifecycle Transitions');
    genPanelFilterSelect(id, settings.managedItems[id], 'filterByWorkspace', 'workspace', 'All Workspaces');
    genPanelSearchInput(id, settings.managedItems[id]);
    genPanelResizeButton(id, settings.managedItems[id]);
    genPanelReloadButton(id, settings.managedItems[id]);

    genPanelContents(id, settings.managedItems[id]);

    insertManagedItemsDone(id);
    
    settings.managedItems[id].load();

}
function insertManagedItemsData(id, linkNew) {

    settings.managedItems[id].timestamp = startPanelContentUpdate(id);

    let params = {
        link      : settings.managedItems[id].link,
        timestamp : settings.managedItems[id].timestamp
    }

    let requests = [
        $.get('/plm/manages', params),
        $.get('/plm/managed-fields', { link : settings.managedItems[id].link, useCache : true }),
        $.get('/plm/workspaces', { useCache : true })
    ]

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.managedItems[id])) return;

        let items           = [];
        let listWorkspaces  = [];
        let listLifecycles  = [];
        let columns         = [
            { displayName : 'Item',         fieldId : 'item'        },
            { displayName : 'Lifecycle',    fieldId : 'lifecycle'   },
            { displayName : 'Effectivity',  fieldId : 'effectivity' },
            { displayName : 'From',         fieldId : 'from'        },
            { displayName : 'To',           fieldId : 'to'          }
        ]

        for(let column of responses[1].data) {
            if(column.visibility !== 'NEVER') columns.push({ displayName : column.name, fieldId : column.__self__ })
        }

        for(let column of columns) {
            if(includePanelTableColumn(column.fieldId, column.displayName, settings.managedItems[id], settings.managedItems[id].columns.length)) {
                settings.managedItems[id].columns.push(column);
            }
        }                

        for(let item of responses[0].data) {

            let lifecycle       = isBlank(item.targetTransition) ? '-' : item.targetTransition.title;
            let effectivity     = ''
            let workspace       = '';
            let workspaceLink   = item.item.link.split('/items/')[0];

            for(let ws of responses[2].data.items) {
                if(ws.link === workspaceLink) { workspace = ws.title; break; }
            }

            if((settings.managedItems[id].workspacesIn.length === 0) || ( settings.managedItems[id].workspacesIn.includes(workspace))) {
                if((settings.managedItems[id].workspacesEx.length === 0) || (!settings.managedItems[id].workspacesEx.includes(workspace))) {
            
                    if(!isBlank(item.effectivityDate)) {
                        let split   = item.effectivityDate.split('-');
                        let date    = new Date(split[0], split[1], split[2]);
                        effectivity = date.toLocaleDateString();
                    }

                    if(!listLifecycles.includes(lifecycle)) listLifecycles.push(lifecycle);
                    if(!listWorkspaces.includes(workspace)) listWorkspaces.push(workspace);

                    let contentItem = genPanelContentItem(settings.managedItems[id], {
                        link  : item.item.link, 
                        title : item.item.title,
                        subtitle    : 'Lifeycle Transition : ' + lifecycle
                    });

                    contentItem.data = [
                        { fieldId : 'item'       , value : item.item.title },
                        { fieldId : 'lifecycle'  , value : lifecycle },
                        { fieldId : 'effectivity', value : effectivity },
                        { fieldId : 'from'       , value : isBlank(item.fromRelease) ? '' : item.fromRelease },
                        { fieldId : 'to'         , value : isBlank(item.toRelease)   ? '' : item.toRelease }
                    ];

                    contentItem.filters = [
                        { key : 'lifecycle', value : lifecycle },
                        { key : 'workspace', value : workspace }
                    ];


                    // let newItem = {
                    //     link        : item.item.link,
                    //     image       : '',
                    //     title       : item.item.title,
                    //     subtitle    : 'Lifeycle Transition : ' + lifecycle,
                    //     details     : '',
                    //     partNumber  : item.item.title.split(' - ')[0],
                    //     data        : [
                    //         { fieldId : 'item'       , value : item.item.title },
                    //         { fieldId : 'lifecycle'  , value : lifecycle },
                    //         { fieldId : 'effectivity', value : effectivity },
                    //         { fieldId : 'from'       , value : isBlank(item.fromRelease) ? '' : item.fromRelease },
                    //         { fieldId : 'to'         , value : isBlank(item.toRelease)   ? '' : item.toRelease }
                    //     ],
                    //     filters : [{
                    //         key : 'lifecycle', value : lifecycle
                    //     }],
                    //     quantity    : ''
                    // };

                    for(let index = 5; index < settings.managedItems[id].columns.length; index++) {
                        for(let field of item.linkedFields) {
                            if(field.__self__ === settings.managedItems[id].columns[index].fieldId) {
                                contentItem.data.push({
                                    fieldId : field.__self__,
                                    value : field.value
                                })
                            }
                        }
                    }

                    items.push(contentItem);
            }}

        }

        // if(!isBlank(linkNew)) { 
        //     $('#' + id + '-content').find('.content-item').each(function() {
        //         if($(this).attr('data-link') === linkNew) $(this).click();
        //     });
        // }

        sortArray(listLifecycles, 0);
        sortArray(listWorkspaces, 0);

        setPanelFilterOptions(id, 'lifecycle', listLifecycles);
        setPanelFilterOptions(id, 'workspace', listWorkspaces);
        finishPanelContentUpdate(id, settings.managedItems[id], items);
        insertManagedItemsDataDone(id, responses[0].data, responses[1].data);

    });

}
function removeManagedItems(id) {

    let requests = [];

    $('#' + id + '-content').hide();
    $('#' + id + '-processing').show();

    $('#' + id + '-content').find('.content-item.selected').each(function() {
        requests.push($.get('/plm/remove-managed-item', { 
            link   : settings.managedItems[id].link, 
            itemId : $(this).attr('data-link').split('/')[6]
        }));
    });

    Promise.all(requests).then(function(responses) {
        insertManagedItemsData(id);
    });

}
function insertManagedItemsDone(id) {}
function insertManagedItemsDataDone(id, items, fields) {}



// Insert related processes
function insertChangeProcesses(link, params) {

    if(isBlank(link)) return;

    let id = isBlank(params.id) ? 'processes' : params.id;
    
    settings.processes[id] = getPanelSettings(link, params, {
        headerLabel : 'Processes',
        layout      : 'list',
        tileIcon    : 'icon-status'
    },[
        [ 'filterByStatus'           , false ],
        [ 'filterByWorkspace'        , false ],
        [ 'createId'                 , 'create' ],
        [ 'createHeaderLabel'        , 'Create Process' ],
        [ 'createSectionsIn'         , [] ],
        [ 'createSectionsEx'         , [] ],
        [ 'createFieldsIn'           , [] ],
        [ 'createFieldsEx'           , [] ],
        [ 'createWorkspaceIds'       , [] ],
        [ 'createWorkspaceNames'     , [] ],
        [ 'createContextItems'       , [] ], // ['/api/v3/workspaces/57/items/12345']
        [ 'createContextItemFields'  , [] ], // ['AFFECTED_ITEM']
        [ 'createViewerImageFields'  , [] ], // 'IMAGE_1'
        [ 'createConnectAffectedItem', true ]
    ]);

    settings.processes[id].load = function() { insertChangeProcessesData(id); }

    genPanelTop(id, settings.processes[id], 'processes');
    genPanelHeader(id, settings.processes[id]);
    genPanelOpenSelectedInPLMButton(id, settings.processes[id]);
    genPanelSelectionControls(id, settings.processes[id]);
    genPanelFilterSelect(id, settings.processes[id], 'filterByStatus'   , 'status'   , 'All States'    );
    genPanelFilterSelect(id, settings.processes[id], 'filterByWorkspace', 'workspace', 'All Workspaces');
    genPanelSearchInput(id, settings.processes[id]);
    genPanelResizeButton(id, settings.processes[id]);
    genPanelReloadButton(id, settings.processes[id]);

    genPanelContents(id, settings.processes[id]);

    if(settings.processes[id].editable) {

        genPanelActionButton(id, {}, 'create', 'Create New', 'Create new process', function() {
            insertCreate(settings.processes[id].createWorkspaceNames, settings.processes[id].createWorkspaceIds, {
                id                  : settings.processes[id].createId,
                headerLabel         : settings.processes[id].createHeaderLabel,
                sectionsIn          : settings.processes[id].createSectionsIn,
                sectionsEx          : settings.processes[id].createSectionsEx,
                fieldsIn            : settings.processes[id].createFieldsIn,
                fieldsEx            : settings.processes[id].createFieldsEx,
                contextId           : id,
                contextItem         : settings.processes[id].link,
                contextItems        : settings.processes[id].createContextItems,
                contextItemFields   : settings.processes[id].createContextItemFields,
                viewerImageFields   : settings.processes[id].createViewerImageFields,
                afterCreation       : function(createId, createLink, data, id) { afterChangeProcessCreation(createId, createLink, id); }
            });
        }).addClass('panel-action-create').addClass('default');

    }

    insertChangeProcessesDone(id);
    
    settings.processes[id].load();

}
function insertChangeProcessesData(id, linkNew) {

    settings.processes[id].timestamp = startPanelContentUpdate(id);

    let params = {
        link      : settings.processes[id].link,
        timestamp : settings.processes[id].timestamp
    }

    let requests = [
        $.get('/plm/changes', params),
        $.get('/plm/workspaces?limit=250', { useCache : true })
    ]

    if(settings.processes[id].editable) {
        requests.push($.get('/plm/permissions', params));
        requests.push($.get('/plm/linked-workspaces', { link : settings.processes[id].link, useCache : true }));
    }

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.processes[id])) return;

        settings.processes[id].columns = [];

        let items           = [];
        let listWorkspaces  = [];
        let listStates      = [];
        let columns         = [
            { displayName : 'Item',                 fieldId : 'item'      },
            { displayName : 'Workspace',            fieldId : 'workspace' },
            { displayName : 'Current State',        fieldId : 'current'   },
            { displayName : 'Last Action',          fieldId : 'action'    },
            { displayName : 'Date of Last Action',  fieldId : 'date'      },
            { displayName : 'Performed By',         fieldId : 'user'      },
            { displayName : 'Created On',           fieldId : 'created'   },
            { displayName : 'Created By',           fieldId : 'creator'   }
        ]

        for(let column of columns) {
            if(includePanelTableColumn(column.fieldId, column.displayName, settings.processes[id], settings.processes[id].columns.length)) {
                settings.processes[id].columns.push(column);
            }
        }

        for(let process of responses[0].data) {
            
            process.sort = process['last-workflow-history'].created;

            let workspaceLink = process.item.link.split('/items/')[0];

            for(let workspace of responses[1].data.items) {
                if(workspace.link === workspaceLink) {
                    process.workspace = workspace.title;
                    break;
                }
            };

        }

        sortArray(responses[0].data, 'sort', 'date', 'descending');

        for(let process of responses[0].data) {

            let state       = process['workflow-state'].title;
            let workspace   = process.workspace;
            let workspaceId = process.__self__.split('/')[4];

            if((settings.processes[id].workspacesIn.length === 0) || ( settings.processes[id].workspacesIn.includes(workspace)) || ( settings.processes[id].workspacesIn.includes(workspaceId))) {
                if((settings.processes[id].workspacesEx.length === 0) || ((!settings.processes[id].workspacesEx.includes(workspace)) && !settings.processes[id].workspacesEx.includes(workspaceId))) {

                    if(!listStates.includes(state)) listStates.push(state);
                    if(!listWorkspaces.includes(workspace)) listWorkspaces.push(workspace);

                    let dateAction   = process['last-workflow-history' ].created.split('T')[0].split('-');
                    let actionDate   = new Date(dateAction[0], dateAction[1], dateAction[2]);
                    let dateCreated  = process['first-workflow-history'].created.split('T')[0].split('-');
                    let creationDate = new Date(dateCreated[0], dateCreated[1], dateCreated[2]);

                    let contentItem = genPanelContentItem(settings.processes[id], {
                        link        : process.item.link, 
                        title       : process.item.title,
                        subtitle    : 'Workspace : ' + workspace + ', current status: '+ process.item.currentState,
                    });

                    let userLast  = (isBlank(process['last-workflow-history'].actualUser)) ? process['last-workflow-history'].user.title : process['last-workflow-history'].actualUser.title;
                    let userFirst = (isBlank(process['first-workflow-history'].actualUser)) ? process['first-workflow-history'].user.title : process['first-workflow-history'].actualUser.title;
        
                    contentItem.data = [
                        { fieldId : 'item'      , value : process.item.title },
                        { fieldId : 'workspace' , value : workspace },
                        { fieldId : 'current'   , value : process['workflow-state'].title },
                        { fieldId : 'action'    , value : process['last-workflow-history'].workflowTransition.title },
                        { fieldId : 'date'      , value : actionDate.toLocaleDateString() },
                        { fieldId : 'user'      , value : userLast },
                        { fieldId : 'created'   , value : creationDate.toLocaleDateString() },
                        { fieldId : 'creator'   , value : userFirst }
                    ];
        
                    contentItem.filters = [
                        { key : 'status'   , value : state     },
                        { key : 'workspace', value : workspace }
                    ];

                    items.push(contentItem);

                }
            }
        }

        sortArray(listWorkspaces, 0);

        setPanelFilterOptions(id, 'status', listStates);
        setPanelFilterOptions(id, 'workspace', listWorkspaces);
        setPanelContentActions(id, settings.processes[id], responses);
        finishPanelContentUpdate(id, settings.processes[id], items, linkNew);
        insertChangeProcessesDataDone(id, responses[0].data);

    });
    
}
function afterChangeProcessCreation(createId, createLink, id) {

    if(!settings.processes[id].createConnectAffectedItem) return;

    let link = settings.processes[id].link;

    $.post('/plm/add-managed-items', { link : createLink, items : [ link ] }, function() {
        insertChangeProcessesData(id, createLink);
    });

}
function insertChangeProcessesDone(id) {}
function insertChangeProcessesDataDone(id, data) {}




// Insert Project tab data
function insertProject(link, params) {

    if(isBlank(link)) return;

    let id = isBlank(params.id) ? 'project' : params.id;
    
    settings.project[id] = getPanelSettings(link, params, {
        headerLabel : 'Timeline',
        layout      : 'list',
        tileIcon    : 'icon-calendar'
    },[
        [ 'filterByStatus'         , false ],
        [ 'filterByWorkspace'      , false ],
        [ 'hideButtonCreate'       , false ],
        [ 'hideButtonDisconnect'   , false ],
        [ 'multiSelect'            , true ],
        [ 'createId'               , 'create' ],
        [ 'createHeaderLabel'      , 'Create Process' ],
        [ 'createHideSections'     , false ],
        [ 'createSectionsIn'       , [] ],
        [ 'createSectionsEx'       , [] ],
        [ 'createFieldsIn'         , [] ],
        [ 'createFieldsEx'         , [] ],
        [ 'createWorkspaceIds'     , [] ],
        [ 'createWorkspaceNames'   , [] ],
        [ 'createContextItemField' , null ], // ['/api/v3/workspaces/57/items/12345']
        [ 'createContextItems'     , [] ], // ['/api/v3/workspaces/57/items/12345']
        [ 'createContextItemFields', [] ], // ['AFFECTED_ITEM']
        [ 'createViewerImageFields', [] ], // 'IMAGE_1'
        [ 'createToggles'          , false ]    
    ]);

    if(settings.project[id].stateColors.length === 0) {
        settings.project[id].stateColors = [
            { state : 'Due'    , color : '#dd2222' },
            { state : 'In Work', color : '#faa21b' },
            { state : 'Done'   , color : '#6a9728' },
            { state : 'Planned', color : '#0696d7' }
        ]
    }

    settings.project[id].load = function() { insertProjectData(id); }

    genPanelTop(id, settings.project[id], 'project');
    genPanelHeader(id, settings.project[id]);
    genPanelOpenSelectedInPLMButton(id, settings.project[id]);
    genPanelSelectionControls(id, settings.project[id]);
    genPanelFilterSelect(id, settings.project[id], 'filterByStatus'   , 'status'   , 'All States'    );
    genPanelFilterSelect(id, settings.project[id], 'filterByWorkspace', 'workspace', 'All Workspaces');
    genPanelSearchInput(id, settings.project[id]);
    genPanelResizeButton(id, settings.project[id]);
    genPanelReloadButton(id, settings.project[id]);

    genPanelContents(id, settings.project[id]);

    if(settings.project[id].editable) {

        genPanelCreateButton(id, settings.project[id], function(createId, createLink, data, id) { afterProjectItemCreation(createId, createLink, data, id); });
        genPanelDisconnectButton(id, settings.project[id], function() { disconnectProjectItems(id); });

    }

    insertProjectDone(id);
    
    settings.project[id].load();

}
function insertProjectDone(id) {}
function insertProjectData(id, linkNew) {

    settings.project[id].timestamp = startPanelContentUpdate(id);

    let params = {
        link      : settings.project[id].link,
        timestamp : settings.project[id].timestamp
    }

    let requests = [
        $.get('/plm/project', params),
        $.get('/plm/workspaces?limit=250', { useCache : true })
    ]

    if(settings.project[id].editable) {
        requests.push($.get('/plm/permissions', params));
        requests.push($.get('/plm/related-workspaces', { wsId : settings.project[id].link.split('/')[4], view : '16', useCache : true }));
    }

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.project[id])) return;

        settings.project[id].columns = [];

        let items           = [];
        let listWorkspaces  = [];
        let listStates      = [];
        let columns         = [
            { displayName : 'Item'      , fieldId : 'item'       },
            { displayName : 'Workspace' , fieldId : 'workspace'  },
            { displayName : 'Status'    , fieldId : 'status'     },
            { displayName : 'Start Date', fieldId : 'startDate'  },
            { displayName : 'End Date'  , fieldId : 'endDate'    },
            { displayName : 'Duration'  , fieldId : 'duration'   },
            { displayName : 'Progress'  , fieldId : 'progress'   },
        ]

        for(let column of columns) {
            if(includePanelTableColumn(column.fieldId, column.displayName, settings.project[id], settings.project[id].columns.length)) {
                settings.project[id].columns.push(column);
            }
        }

        for(let projectItem of responses[0].data.projectItems) {

            projectItem.sort = projectItem['endDate'];

            if(isBlank(projectItem.details)) {

                projectItem.workspace   = 'Manual Entry';
                projectItem.workspaceId = '-';
                projectItem.link        = settings.project[id].link;

            } else {

                let workspaceLink = projectItem.details.link.split('/items/')[0];

                for(let workspace of responses[1].data.items) {
                    if(workspace.link === workspaceLink) {
                        projectItem.workspace   = workspace.title;
                        projectItem.workspaceId = projectItem.details.link.split('/')[4];
                        projectItem.link        = projectItem.details.link.split('/views')[0];
                        break;
                    }
                };

            }

        }

        sortArray(responses[0].data.projectItems, 'sort', 'date', 'descending');

        for(let projectItem of responses[0].data.projectItems) {

            let state       = projectItem.status || '-';
            let workspace   = projectItem.workspace;

            if((settings.project[id].workspacesIn.length === 0) || ( settings.project[id].workspacesIn.includes(workspace)) || ( settings.project[id].workspacesIn.includes(projectItem.workspaceId))) {
                if((settings.project[id].workspacesEx.length === 0) || ((!settings.project[id].workspacesEx.includes(workspace)) && !settings.project[id].workspacesEx.includes(projectItem.workspaceId))) {

                    if(!listWorkspaces.includes(workspace)) listWorkspaces.push(workspace);

                    let contentItem = genPanelContentItem(settings.project[id], {
                        link        : projectItem.link, 
                        edge        : projectItem.__self__,
                        title       : projectItem.title,
                        subtitle    : workspace + ' | Status ' + state + ' | ' + projectItem.startDate + ' > ' + projectItem.endDate,
                    });

                    contentItem.data = [
                        { fieldId : 'item'     , value : projectItem.title     },
                        { fieldId : 'workspace', value : workspace             },
                        { fieldId : 'status'   , value : projectItem.status    },
                        { fieldId : 'startDate', value : projectItem.startDate },
                        { fieldId : 'endDate'  , value : projectItem.endDate   },
                        { fieldId : 'duration' , value : projectItem.duration  },
                        { fieldId : 'progress' , value : projectItem.progress  },
                    ];

                    contentItem.status = getProjectItemFlag(projectItem);

                    if(!listStates.includes(projectItem.status)) listStates.push(projectItem.status);
        
                    contentItem.filters = [
                        { key : 'status'   , value : projectItem.status },
                        { key : 'workspace', value : workspace          }
                    ];

                    items.push(contentItem);

                }
            }
        }

        sortArray(listStates, 0);
        sortArray(listWorkspaces, 0);

        setPanelFilterOptions(id, 'status', listStates);
        setPanelFilterOptions(id, 'workspace', listWorkspaces);
        setPanelContentActions(id, settings.project[id], responses);
        finishPanelContentUpdate(id, settings.project[id], items, linkNew);
        insertProjectDataDone(id, responses[0].data);

    });
    
}
function insertProjectDataDone(id, data) {}
function getProjectItemFlag(projectItem) {

    if(projectItem.progress === 100) return 'Done';

    let refDate = projectItem.endDate.split('-');
    let timeEnd = new Date(refDate[0], refDate[1] - 1, refDate[2]).getTime();
    let timeNow = new Date().getTime();

    if(timeNow > timeEnd) return 'Due';
    else if(projectItem.progress > 0) return 'In Work';

    return 'Planned';

}
function afterProjectItemCreation(createId, createLink, data, id) {

    $.post('/plm/add-project-item', { link : settings.project[id].link, item : createLink }, function(response) {
        $('#overlay').hide();
        $('#' + createId).hide();
        settings.project[id].load();
    });

}
function disconnectProjectItems(id) {

    let elemPanel       = $('#' + id);
    let requests        = [];
    
    $('#' + id + '-processing').show();
    $('#' + id + '-content').hide();

    elemPanel.find('.content-item.selected').each(function() {
        requests.push($.post('/plm/remove-project-item', { link : $(this).attr('data-edge')}))
    });

    Promise.all(requests).then(function(responses) {
        settings.project[id].load();
    });

}





// Insert Relationships
function insertRelationships(link, params) {
    
    if(isBlank(link)) return;

    let id = isBlank(params.id) ? 'relationships' : params.id;
    
    settings.relationships[id] = getPanelSettings(link, params, {
        headerLabel : 'Relationships',
        layout      : 'list',
        tileIcon    : 'icon-link'
    }, [
        [ 'filterByWorkspace', true ]
    ]);

    settings.relationships[id].load = function() { insertRelationshipsData(id); }

    genPanelTop(id, settings.relationships[id], 'managed-items');
    genPanelHeader(id, settings.relationships[id]);
    genPanelOpenSelectedInPLMButton(id, settings.relationships[id]);
    genPanelSelectionControls(id, settings.relationships[id]);
    genPanelFilterSelect(id, settings.relationships[id], 'filterByWorkspace', 'workspace', 'All Workspaces');
    genPanelSearchInput(id, settings.relationships[id]);
    genPanelResizeButton(id, settings.relationships[id]);
    genPanelReloadButton(id, settings.relationships[id]);

    genPanelContents(id, settings.relationships[id]);

    insertRelationshipsDone(id);

    settings.relationships[id].load();

}
function insertRelationshipsData(id) {

    settings.relationships[id].timestamp = startPanelContentUpdate(id);

    let params = {
        link        : settings.relationships[id].link,
        timestamp   : settings.relationships[id].timestamp
    }

    $.get('/plm/relationships', params, function(response) {

        if(stopPanelContentUpdate(response, settings.relationships[id])) return;

        settings.relationships[id].columns = [];

        let items           = [];
        let listWorkspaces  = [];
        let columns         = [
            { displayName : 'Item',             fieldId : 'item'        },
            { displayName : 'Workspace',        fieldId : 'workspace'   },
            { displayName : 'Current State',    fieldId : 'current'     },
            { displayName : 'Direction Type',   fieldId : 'direction'   },
            { displayName : 'Description',      fieldId : 'description' }
        ]

        for(let column of columns) {
            if(includePanelTableColumn(column.fieldId, column.displayName, settings.relationships[id], settings.relationships[id].columns.length)) {
                settings.relationships[id].columns.push(column);
            }
        }

        for(let relationship of response.data) {
            relationship.sort1 = relationship.workspace.title;
            relationship.sort2 = relationship.item.title;
        }

        sortArray(response.data, 'sort2');
        sortArray(response.data, 'sort1');

        for(let relationship of response.data) {

            let workspace = relationship.workspace.title;

            if((settings.relationships[id].workspacesIn.length === 0) || ( settings.relationships[id].workspacesIn.includes(workspace))) {
                if((settings.relationships[id].workspacesEx.length === 0) || (!settings.relationships[id].workspacesEx.includes(workspace))) {

                    if(!listWorkspaces.includes(workspace)) listWorkspaces.push(workspace);

                    let contentItem = genPanelContentItem(settings.relationships[id], {
                        link        : relationship.item.link, 
                        title       : relationship.item.title,
                        subtitle    : workspace
                    });
        
                    contentItem.data = [
                        { fieldId : 'item'       , value : relationship.item.title },
                        { fieldId : 'workspace'  , value : workspace },
                        { fieldId : 'current'    , value : (isBlank(relationship.state)) ? '' : relationship.state.title },
                        { fieldId : 'direction'  , value : relationship.direction.type },
                        { fieldId : 'description', value : relationship.description }
                    ];
        
                    contentItem.filters = [{
                        key : 'workspace', value : workspace
                    }];

                    items.push(contentItem);

                }
            }

        }

        // if(settings.relationships[id].layout.toLowerCase() === 'table') {
        //     genTable(id ,settings.relationships[id], items);
        // } else {
        //     genTilesList(id, items, settings.relationships[id]);   
        // }

        sortArray(listWorkspaces, 0);
        setPanelFilterOptions(id, 'workspace', listWorkspaces);

        finishPanelContentUpdate(id, settings.relationships[id], items);
        insertRelationshipsDataDone(id, response);


    })
    
}
function insertRelationshipsDone(id) {}
function insertRelationshipsDataDone(id, data) {}



// Insert Sourcing tab
function insertSourcing(link, params) {

    if(isBlank(link)) return;
    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'sourcing' : params.id;
    
    settings.sourcing[id] = getPanelSettings(link, params, {
        headerLabel : 'Sourcing',
        layout      : 'table'
    }, [
        [ 'filterBySupplier'    , false ],
        [ 'filterByManufacturer', false ],
        [ 'groupBy'             , ''    ]
    ]);

    settings.sourcing[id].load   = function() { insertSourcingData(id); }

    genPanelTop(id, settings.sourcing[id], 'sourcing');
    genPanelHeader(id, settings.sourcing[id]);
    genPanelBookmarkButton(id, settings.sourcing[id]);
    genPanelOpenInPLMButton(id, settings.sourcing[id]);
    genPanelFilterSelect(id, settings.sourcing[id], 'filterBySupplier', 'supplier', 'All Suppliers');
    genPanelFilterSelect(id, settings.sourcing[id], 'filterByManufacturer', 'manufacturer', 'All Manufacturers');
    genPanelSearchInput(id, settings.sourcing[id]);
    genPanelResizeButton(id, settings.sourcing[id]);
    genPanelReloadButton(id, settings.sourcing[id]);

    genPanelContents(id, settings.sourcing[id]);

    insertSourcingDone(id);

    settings.sourcing[id].load();

}
function insertSourcingData(id) {

    settings.sourcing[id].timestamp = startPanelContentUpdate(id);

    let requests    = [
        $.get('/plm/quotes', {
            link      : settings.sourcing[id].link,
            timestamp : settings.sourcing[id].timestamp
        }),
    ];

    if((settings.sourcing[id].bookmark)) requests.push($.get('/plm/bookmarks', { link : settings.sourcing[id].link })); 

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.sourcing[id])) return;

        setPanelBookmarkStatus(id, settings.sourcing[id], responses);

        settings.sourcing[id].columns = [];

        let items             = [];
        let listSuppliers     = [];
        let listManufacturers = [];
        let columns           = [
            { displayName : 'Supplier'                , fieldId : 'supplier'        },
            { displayName : 'Supplier Part Number'    , fieldId : 'supplier-pn'     },
            { displayName : 'Manufacturer'            , fieldId : 'manufacturer'    },
            { displayName : 'Manufacturer Part Number', fieldId : 'manufacturer-pn' },
            { displayName : 'Lead Time'               , fieldId : 'lead-time'       },
            { displayName : 'Unit Cost'               , fieldId : 'unit-cost'       }
        ]

        for(let column of columns) {
            if(includePanelTableColumn(column.fieldId, column.displayName, settings.sourcing[id], settings.sourcing[id].columns.length)) {
                settings.sourcing[id].columns.push(column);
            }
        }

        for(let supplier of responses[0].data.suppliers) {
            supplier.sort = supplier.supplier.title;
        }

        sortArray(responses[0].data.suppliers, 'sort');

        for(let source of responses[0].data.suppliers) {

            let supplierName     = source.supplier.title;
            let manufacturerName = source.manufacturer;

            if(!listSuppliers.includes(supplierName)) listSuppliers.push(supplierName);
            if(!listManufacturers.includes(manufacturerName)) listManufacturers.push(manufacturerName);

            for(let quote of source.quotes.data) {

                let contentItem = genPanelContentItem(settings.sourcing[id], {
                    title : source.supplierPartNumber + ' ' + supplierName + ' | ' + manufacturerName,
                    subtitle : quote.unitPrice
                });
    
                contentItem.data = [
                    { fieldId : 'supplier'       , value : supplierName },
                    { fieldId : 'supplier-pn'    , value : source.supplierPartNumber },
                    { fieldId : 'manufacturer'   , value : manufacturerName },
                    { fieldId : 'manufacturer-pn', value : source.manufacturerPartNumber },
                    { fieldId : 'lead-time'      , value : quote.leadTime },
                    { fieldId : 'unit-cost'      , value : quote.unitPrice }
                ];
    
                switch(settings.sourcing[id].groupBy) {

                    case 'supplier':
                        contentItem.group = supplierName;
                        contentItem.title = source.supplierPartNumber + ' | ' + manufacturerName;
                        break;

                    case 'manufacturer':
                        contentItem.group = manufacturerName;
                        contentItem.title = source.supplierPartNumber + ' ' + supplierName;
                        break;

                }

                contentItem.filters = [
                    { key : 'supplier', value : supplierName },
                    { key : 'manufacturer', value : manufacturerName }
                ];

                items.push(contentItem);

            }

        }

        sortArray(listSuppliers, 0);
        sortArray(listManufacturers, 0);
        setPanelFilterOptions(id, 'supplier', listSuppliers);
        setPanelFilterOptions(id, 'manufacturer', listManufacturers);

        finishPanelContentUpdate(id, settings.sourcing[id], items);
        insertSourcingDataDone(id, responses[0]);        
 
    });

}
function insertSourcingDone(id) {}
function insertSourcingDataDone(id, rows, columns) {}



// Insert Workflow History
function insertWorkflowHistory(link, params) {

    if(isBlank(link)) return;

    let id = isBlank(params.id) ? 'workflow-history' : params.id;
    
    settings.workflowHistory[id] = getPanelSettings(link, params, {
        headerLabel : 'Workflow History',
    }, [
        [ 'showNextTransitions', true ],
        [ 'finalStates'        , ['Complete', 'Completed', 'Closed', 'Done'] ],
        [ 'transitionsIn'      , [] ],
        [ 'transitionsEx'      , ['Cancel', 'Delete'] ]
    ]);

    settings.workflowHistory[id].load = function() { insertWorkflowHistoryData(id); }

    genPanelTop(id, settings.workflowHistory[id], 'processes');
    genPanelHeader(id, settings.workflowHistory[id]);
    genPanelOpenInPLMButton(id, settings.workflowHistory[id]);
    genPanelSearchInput(id, settings.workflowHistory[id]);
    genPanelResizeButton(id, settings.workflowHistory[id]);
    genPanelReloadButton(id, settings.workflowHistory[id]);

    genPanelContents(id, settings.workflowHistory[id]).addClass('workflow-history-content').removeClass('list');

    insertWorkflowHistoryDone(id);

    settings.workflowHistory[id].load();

}
function insertWorkflowHistoryData(id) {

    settings.workflowHistory[id].timestamp = startPanelContentUpdate(id);

    let params = {
        link      : settings.workflowHistory[id].link,
        timestamp : settings.workflowHistory[id].timestamp
    }

    let requests = [ 
        $.get('/plm/workflow-history', params),
        $.get('/plm/details',          params)
    ];

    if(settings.workflowHistory[id].showNextTransitions) requests.push($.get('/plm/transitions', params));

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.workflowHistory[id])) return;

        let index         = 1;
        let transitionsIn = settings.workflowHistory[id].transitionsIn;
        let transitionsEx = settings.workflowHistory[id].transitionsEx;
        let currentStatus = responses[1].data.currentState.title;
        let elemContent   = $('#' + id + '-content');

        if(settings.workflowHistory[id].showNextTransitions) {
            if(!settings.workflowHistory[id].finalStates.includes(currentStatus)) {

                let elemNext = $('<div></div>').addClass('workflow-next');

                let elemNextTitle = $('<div></div>').appendTo(elemNext)
                    .html('Next Step')
                    .addClass('workflow-next-title');

                for(let nextTransition of responses[2].data) {

                    if(!transitionsEx.includes(nextTransition.name)) {
                    
                        $('<div></div>').appendTo(elemNext)
                            .addClass('with-icon')
                            .addClass('icon-arrow-right')
                            .addClass('workflow-next-action')
                            .html(nextTransition.name);

                    }

                }

                if(elemNext.children().length > 1) elemNext.appendTo(elemContent);
                if(elemNext.children().length > 2) elemNextTitle.html('Possible Next Steps');

            }
        }

        for(let action of responses[0].data.history) {
            
            let actionTitle = action.workflowTransition.title;

            if(transitionsIn.length === 0 || transitionsIn.includes(actionTitle)) {
                if(transitionsEx.length === 0 || !transitionsEx.includes(actionTitle)) {

                    let timeStamp = new Date(action.created);
                    let icon      = (index++ === responses[0].data.history.length) ? 'icon-start' : 'icon-check';

                    if((index === 2) && settings.workflowHistory[id].finalStates.includes(currentStatus)) icon = 'icon-finish';
                    
                    let elemEvent = $('<div></div>').appendTo(elemContent)
                        .addClass('workflow-history-event')
                        .addClass('content-item')
                        .click(function() {
                            if(!isBlank(settings.workflowHistory[id].onItemClick)) settings.workflowHistory[id].onItemClick($(this));
                        }).dblclick(function() {
                            if(!isBlank(settings.workflowHistory[id].onItemDblClick)) settings.workflowHistory[id].onItemDblClick($(this));
                        });

                    let elemAction = $('<div></div>').appendTo(elemEvent)
                        .addClass('workflow-history-action');

                    $('<div></div>').appendTo(elemAction)
                        .addClass('workflow-history-action-icon')
                        .addClass('icon')
                        .addClass(icon)
                        .addClass('filled');

                    $('<div></div>').appendTo(elemAction)
                        .addClass('workflow-history-action-text')
                        .html(action.workflowTransition.title);
                        

                    $('<div></div>').appendTo(elemEvent)
                        .addClass('workflow-history-comment')
                        .html(action.comments);

                    $('<div></div>').appendTo(elemEvent)
                        .addClass('workflow-history-user')
                        .html(action.user.title);

                    $('<div></div>').appendTo(elemEvent)
                        .addClass('workflow-history-date')
                        .html(timeStamp.toLocaleDateString());

                }
            }
        }

        finishPanelContentUpdate(id, settings.workflowHistory[id]);
        insertWorkflowHistoryDone(id, responses[0].data, responses[1].data);

    });

}
function insertWorkflowHistoryDone(id) {}
function insertWorkflowHistoryDataDone(id, history, item) {}



// Insert Change Log
function insertChangeLog(link, params) {

    if(isBlank(link)) return;

    let id = isBlank(params.id) ? 'change-log' : params.id;
    
    settings.changeLog[id] = getPanelSettings(link, params, {
        headerLabel : 'Change Log',
        textNoData  : 'No change log entries found'
    }, [
        [ 'filterByUser'  , true ],
        [ 'filterByAction', true ],
        [ 'actionsIn'     , []   ],
        [ 'actionsEx'     , []   ],
        [ 'usersIn'       , []   ],
        [ 'usersEx'       , []   ],
    ]);

    settings.changeLog[id].layout = 'table';
    settings.changeLog[id].load   = function() {  insertChangeLogData(id); }

    genPanelTop(id, settings.changeLog[id], 'managed-items', []);
    genPanelHeader(id, settings.changeLog[id]);
    genPanelOpenInPLMButton(id, settings.changeLog[id]);
    genPanelFilterSelect(id, settings.changeLog[id], 'filterByUser', 'user', 'All Users');
    genPanelFilterSelect(id, settings.changeLog[id], 'filterByAction', 'action', 'All Actions');
    genPanelSearchInput(id, settings.changeLog[id]);
    genPanelResizeButton(id, settings.changeLog[id]);
    genPanelReloadButton(id, settings.changeLog[id]);

    genPanelContents(id, settings.changeLog[id]);

    insertChangeLogDone(id);

    settings.changeLog[id].load();

}
function insertChangeLogData(id) {

    settings.changeLog[id].timestamp = startPanelContentUpdate(id);

    let params = {
        link        : settings.changeLog[id].link,
        timestamp   : settings.changeLog[id].timestamp
    }

    $.get('/plm/logs', params, function(response) {

        if(stopPanelContentUpdate(response, settings.changeLog[id])) return;

        let number      = 1;
        let elemContent = $('#' + id + '-content'); 
        let elemTable   = $('<table></table>').appendTo(elemContent).addClass('fixed-header').addClass('row-hovering');
        let elemTHead   = $('<thead></thead>');
        let elemTHRow   = $('<tr></tr>').appendTo(elemTHead);
        let elemTBody   = $('<tbody></tbody>').attr('id', id + '-tbody').appendTo(elemTable);
        let listUsers   = [];
        let listActions = [];
        let columns     = [ 'Date', 'User', 'Action', 'Details' ]
        let counter     = 0;

        if(settings.changeLog[id].number) $('<th></th>').appendTo(elemTHRow).html('#').addClass('change-log-number');

        for(let column of columns) {
            if(includePanelTableColumn('', column, settings.changeLog[id], counter++)) {
                $('<th></th>').appendTo(elemTHRow)
                    .addClass('col')
                    .html(column);
            }
        }

        if(settings.changeLog[id].tableHeaders) elemTHead.appendTo(elemTable);

        for(let entry of response.data) {

            let user        = entry.user.title;
            let action      = entry.action.shortName;
            let elemDetails = $('<div></div>').addClass('change-log-details');

            if((settings.changeLog[id].usersIn.length === 0) || ( settings.changeLog[id].usersIn.includes(user))) {
                if((settings.changeLog[id].usersEx.length === 0) || (!settings.changeLog[id].usersEx.includes(user))) {
                    if((settings.changeLog[id].actionsIn.length === 0) || ( settings.changeLog[id].actionsIn.includes(action))) {
                        if((settings.changeLog[id].actionsEx.length === 0) || (!settings.changeLog[id].actionsEx.includes(action))) {

                            if(!listUsers.includes(user)) listUsers.push(user);
                            if(!listActions.includes(action)) listActions.push(action);

                            let elemRow = $('<tr></tr>').appendTo(elemTBody)
                                .attr('data-filter-user', user)
                                .attr('data-filter-action', action)
                                .addClass('content-item').click(function() {
                                    if(!isBlank(settings.changeLog[id].onItemClick)) settings.changeLog[id].onItemClick($(this));                          
                                }).dblclick(function() {
                                    if(!isBlank(settings.changeLog[id].onItemDblClick)) settings.changeLog[id].onItemDblClick($(this));                          
                                });

                            if(settings.changeLog[id].number) $('<td></td>').appendTo(elemRow).html(number++).addClass('change-log-number');

                            if(isBlank(entry.description)) {

                                for(let detail of entry.details) {

                                    let elemDetail = $('<div></div>').appendTo(elemDetails);
                                        elemDetail.append($('<span class="change-log-detail-field">' + detail.fieldName + '</span>'));
                                        elemDetail.append('<span>changed from</span>');
                                        elemDetail.append($('<span class="change-log-detail-old">' + detail.oldValue + '</span>'));
                                        elemDetail.append('<span>to</span>');
                                        elemDetail.append($('<span class="change-log-detail-new">' + detail.newValue + '</span>'));

                                }

                            } else elemDetails.append(entry.description);

                            counter = 0;

                            for(let column of columns) {

                                if(includePanelTableColumn('', column, settings.changeLog[id], counter++)) {

                                    let elemCell = $('<td></td>').appendTo(elemRow);

                                    switch(column) {

                                        case 'Date': 
                                            let timeStamp = new Date(entry.timeStamp);
                                            elemCell.html(timeStamp.toLocaleDateString()).addClass('change-log-date');
                                            break;

                                        case 'User': 
                                            elemCell.html(entry.user.title).addClass('change-log-user');
                                            break;

                                        case 'Action': 
                                            elemCell.html(entry.action.shortName).addClass('change-log-action');
                                            break;

                                        case 'Details': 
                                            elemCell.append(elemDetails);
                                            break;

                                    }
        
                                }
                            }
                        }
                    }
                }
            }
        }

        sortArray(listUsers, 0);
        sortArray(listActions, 0);
        
        setPanelFilterOptions(id, 'user', listUsers);
        setPanelFilterOptions(id, 'action', listActions);

        finishPanelContentUpdate(id, settings.changeLog[id]);
        insertChangeLogDataDone(id, response);
   
    });
    
}
function insertChangeLogDone(id) {}
function insertChangeLogDataDone(id, data) {}




// Open given item in main screen of app, insert given dom elements before if needed
function insertItemSummary(link, params) {

    if(isBlank(link)) return;
    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'item' : params.id;

    settings.summary[id] = getPanelSettings(link, params, {}, [
        [ 'bookmark'        , false ],
        [ 'className'       , ''    ],
        [ 'cloneable'       , false ],
        [ 'contents'        , [ { type : 'details', params : { id : 'item-section-details' } } ] ],
        [ 'layout'          , 'tabs'],
        [ 'hideSubtitle'    , false ],
        [ 'hideCloseButton' , false ],
        [ 'includeViewer'   , false ],
        [ 'statesColors'    , []    ],
        [ 'surfaceLevel'    , null  ],
        [ 'toggleBodyClass' , ''    ],
        [ 'workflowActions' , false ],
        [ 'wrapControls'    , false ],
        [ 'onClickClose'    , function(id, link) { } ],
        [ 'afterCloning'    , function(id, link) { console.log('New item link : ' + link ); } ]
    ]);

    settings.summary[id].wsId    = link.split('/')[4];
    settings.summary[id].load    = function() { setItemSummaryData(id); }

    let elemItemTop = $('#' + id);

    if(elemItemTop.length === 0) {
        elemItemTop = $('<div></div>').appendTo('body')
            .attr('id', id)    
            .addClass('screen');
    } else elemItemTop.html('');

    elemItemTop.attr('data-link', settings.summary[id].link)
        .addClass('item')
        .addClass('panel-top')
        .addClass('workspace-' + settings.summary[id].wsId);

    if(isBlank(settings.summary[id].surfaceLevel)) {

        settings.summary[id].surfaceLevel = getSurfaceLevel(elemItemTop, false);

        if(settings.summary[id].surfaceLevel === 'surface-level-0') {
            settings.summary[id].surfaceLevel = 'surface-level-1';
            elemItemTop.addClass(settings.summary[id].surfaceLevel);
        }

    } else {

        if(settings.summary[id].surfaceLevel.indexOf('surface-level') !== 0) settings.summary[id].surfaceLevel = 'surface-level-' + settings.summary[id].surfaceLevel;
        elemItemTop.addClass(settings.summary[id].surfaceLevel);

    }

    settings.summary[id].contentSurfaceLevel = getMatchingContentSurfaceLevels(settings.summary[id].surfaceLevel);

    if(!isBlank(settings.summary[id]).className) elemItemTop.addClass(settings.summary[id].className);

    let elemItemHeader          = $('#' + id + '-header');
    let elemItemTitle           = $('#' + id + '-title');
    let elemItemDescriptor      = $('#' + id + '-descriptor');
    let elemItemSubtitle        = $('#' + id + '-subtitle');
    let elemItemStatus          = $('#' + id + '-status');
    let elemItemSummary         = $('#' + id + '-summary');
    let elemItemControls        = $('#' + id + '-controls');
    let elemItemClose           = $('#' + id + '-close');
    let elemItemContent         = $('#' + id + '-content');
    let elemItemWorkflowActions = $('#' + id + '-workflow-actions');

    if(elemItemHeader.length     === 0) { elemItemHeader     = $('<div></div>').attr('id', id + '-header'    ).addClass('item-header'    ).addClass('panel-header'    ).appendTo(elemItemTop);      }
    if(elemItemTitle.length      === 0) { elemItemTitle      = $('<div></div>').attr('id', id + '-title'     ).addClass('item-title'     ).addClass('panel-title'     ).appendTo(elemItemHeader);   }
    if(elemItemDescriptor.length === 0) { elemItemDescriptor = $('<div></div>').attr('id', id + '-descriptor').addClass('item-descriptor').addClass('panel-title-main').appendTo(elemItemTitle);    }
    if(elemItemSubtitle.length   === 0) { elemItemSubtitle   = $('<div></div>').attr('id', id + '-subtitle'  ).addClass('item-subtitle'  ).addClass('panel-title-sub' ).appendTo(elemItemTitle);    }
    if(elemItemStatus.length     === 0) { elemItemStatus     = $('<div></div>').attr('id', id + '-status'    ).addClass('item-status'    ).addClass('panel-status'    ).appendTo(elemItemSubtitle); }
    if(elemItemSummary.length    === 0) { elemItemSummary    = $('<div></div>').attr('id', id + '-summary'   ).addClass('item-summary'   ).addClass('panel-summary'   ).appendTo(elemItemSubtitle); }
    if(elemItemControls.length   === 0) { elemItemControls   = $('<div></div>').attr('id', id + '-controls'  ).addClass('item-controls'  ).addClass('panel-controls'  ).appendTo(elemItemHeader);   }
    if(elemItemContent.length    === 0) { elemItemContent    = $('<div></div>').attr('id', id + '-content'   ).addClass('item-content'   ).addClass('panel-content'   ).appendTo(elemItemTop);      }

    elemItemDescriptor.html('');
        elemItemStatus.html('');
       elemItemSummary.html('');
       elemItemContent.html('');

    genPanelBookmarkButton(id, settings.summary[id]);
    genPanelCloneButton(id, settings.summary[id]);
    genPanelOpenInPLMButton(id, settings.summary[id]);
    genPanelReloadButton(id, settings.summary[id]);

    if(settings.summary[id].workflowActions) {
        if(elemItemWorkflowActions.length === 0) {
            elemItemWorkflowActions = $('<select></select>').prependTo(elemItemControls)
                .attr('id', id + '-workflow-actions')
                .addClass('item-workflow-actions')
                .addClass('button')
                .hide();
        }
    }

    if(elemItemClose.length === 0) { 
        if(!settings.summary[id].hideCloseButton) {
            elemItemClose = $('<div></div>').appendTo(elemItemControls)
                .attr('id', id + '-close')
                .addClass('button')
                .addClass('icon')
                .addClass('icon-close')
                .click(function() {
                    if(isBlank(settings.summary[id].toggleBodyClass))  $('#' + id).hide();
                    else $('body').removeClass(settings.summary[id].toggleBodyClass);
                    settings.summary[id].onClickClose(id, settings.summary[id].link);
                });
        }
    }

    switch(settings.summary[id].layout) {

        case 'dashboard':
            elemItemTop.addClass('with-panels');
            break;

        case 'tabs':
            $('<div></div>').attr('id', id + '-tabs').addClass('panel-tabs').appendTo(elemItemTop);
            elemItemTop.addClass('with-tabs').addClass('panel-top');
            elemItemContent.addClass(settings.summary[id].contentSurfaceLevel);
            break;

        case 'sections':
            elemItemTop.addClass('with-sections').addClass('panel-top');
            elemItemContent.addClass('panel-sections');
            break;

    }

    if(settings.summary[id].includeViewer) {
        $('<div></div>').attr('id', id + '-viewer').addClass('panel-viewer').appendTo(elemItemTop);
    }

    if(!isBlank(settings.summary[id].headerTopLabel)) {
        $('#' + id).addClass('with-top-title');
        let elemTopTitle = $('#' + id + '-title-top');
        if(elemTopTitle.length === 0) {
            elemTopTitle = $('<div></div>').prependTo(elemItemTitle)
                .addClass('panel-title-top')
                .attr('id', id + '-title-top');
        }
        elemTopTitle.html(settings.summary[id].headerTopLabel);
    }

    if(settings.summary[id].wrapControls) elemItemTop.addClass('wrap-controls');
    if(settings.summary[id].hideSubtitle) elemItemTop.addClass('no-sub-title');

    if(!isBlank(settings.summary[id].toggleBodyClass)) $('body').addClass(settings.summary[id].toggleBodyClass);

    insertItemSummaryDone(id);

    settings.summary[id].load();

}
function setItemSummaryData(id) {

    settings.summary[id].timestamp = new Date().getTime();

    // let elemItemDescriptor  = $('#' + id + '-descriptor').html('').addClass('animation');
    // let elemItemStatus      = $('#' + id + '-status').html('').addClass('animation');
    // let elemItemSummary     = $('#' + id + '-summary').html('').addClass('animation');
    let elemItemDescriptor  = $('#' + id + '-descriptor').html('');
    let elemItemStatus      = $('#' + id + '-status').html('');
    let elemItemSummary     = $('#' + id + '-summary').html('');
    
    $('#' + id + '-content').html('');
    $('#' + id + '-workflow-actions').hide();
    $('#' + id).show();

    let requests = [
        $.get('/plm/details'       , { link : settings.summary[id].link, timestamp : settings.summary[id].timestamp }),
        $.get('/plm/change-summary', { link : settings.summary[id].link }),
        $.get('/plm/fields'        , { link : settings.summary[id].link, useCache : settings.summary[id].useCache }),
        $.get('/plm/tabs'          , { link : settings.summary[id].link, useCache : settings.summary[id].useCache })
    ];

    if((settings.summary[id].bookmark) ) requests.push($.get('/plm/bookmarks'  , { link : settings.summary[id].link }));
    if((settings.summary[id].cloneable)) requests.push($.get('/plm/permissions', { link : settings.summary[id].link }));

    Promise.all(requests).then(function(responses) {

        if(responses[0].params.timestamp == settings.summary[id].timestamp) {
            if(responses[0].params.link === settings.summary[id].link) {

                $('.animation').removeClass('animation');

                elemItemDescriptor.html(responses[0].data.title);

                if(isBlank(responses[0].data.currentState)) {
                    elemItemStatus.hide();
                } else {

                    let stateLabel = responses[0].data.currentState.title;
                    let stateColor = '#000';

                    for(let statesColor of settings.summary[id].statesColors) {
                        if(statesColor.states.indexOf(responses[0].data.currentState.title) > -1) {
                            if(!isBlank(statesColor.color)) stateColor = statesColor.color;
                            if(!isBlank(statesColor.label)) stateLabel = statesColor.label;
                            break;
                        }
                    }

                    elemItemStatus.css('background-color', stateColor);
                    elemItemStatus.html(stateLabel);
        
                }

                if(responses[1].status !== 403) {

                    let dateCreated  = new Date(responses[1].data.createdOn);

                    let elemCreatedBy = $('<span></span>')
                        .attr('id', '#' + id + '-created-by')
                        .addClass('item-created-by')
                        .html(responses[1].data.createdBy.displayName);

                    let elemCreatedOn = $('<span></span>')
                        .attr('id', '#' + id + '-created-on')
                        .addClass('item-created-on')
                        .html(dateCreated.toLocaleDateString());

                    elemItemSummary.append('Created by ')
                        .append(elemCreatedBy)
                        .append(' on ')
                        .append(elemCreatedOn);

                    if(!isBlank(responses[1].data.lastModifiedBy)) {

                        let elemModifiedBy = $('<span></span>')
                            .attr('id', '#' + id + '-modified-by')
                            .addClass('item-modified-by')
                            .html(responses[1].data.lastModifiedBy.displayName);

                        let elemModifiedOn = $('<span></span>')
                            .attr('id', '#' + id + '-modified-on')
                            .addClass('item-modified-on')
                            .html(new Date(responses[1].data.lastModifiedOn).toLocaleDateString());

                        elemItemSummary.append('. Last modified by ')
                            .append(elemModifiedBy)
                            .append(' on ')
                            .append(elemModifiedOn);

                    }

                }

                setPanelBookmarkStatus(id, settings.summary[id], responses);
                setPanelCloneStatus(id, settings.summary[id], responses);

                if(settings.summary[id].workflowActions) {
                    insertWorkflowActions(settings.summary[id].link, {
                        id : id + '-workflow-actions',
                        onComplete : function() { settings.summary[id].load() }
                    });
                }

                insertItemSummaryContents(id, responses[0].data, responses[2].data, responses[3].data);

            }
        }

    });

}
function insertItemSummaryContents(id, details, fields, tabs) {

    let elemItemContent = $('#' + id + '-content');
    let elemTabs        = $('#' + id + '-tabs');
    let tabsAccessible  = [];
    let tabLabels       = {};
    let isFirst         = true;

    if(elemTabs.length > 0) elemTabs.html('');

    for(let tab of tabs) {
        tabsAccessible.push(tab.workspaceTabName);
        tabLabels[tab.workspaceTabName] = isBlank(tab.name) ? tab.key : tab.name;
    }

    if(settings.summary[id].includeViewer) {
        $('#' + id).addClass('includes-viewer');
        insertViewer(settings.summary[id].link, {
            id : id + '-viewer'
        });
    } else {
        $('#' + id).removeClass('includes-viewer');
    }

    for(let content of settings.summary[id].contents) {

        if(isBlank(content.params)) content.params = {};

        let link      = settings.summary[id].link;
        let contentId = (isBlank(content.params.id)) ? 'item-' + content.type : content.params.id;
        let className = (isBlank(content.className)) ? settings.summary[id].contentSurfaceLevel : content.className;
        let elemTop   = $('#' + contentId);
        
        content.params.id = contentId;

        if(!isBlank(content.link)) {
            if(content.link.indexOf('/') < 0) {
                link = getSectionFieldValue(details.sections, content.link, '', 'link');
            } else link = content.link;
        }

        if(settings.summary[id].layout === 'sections') {
            content.params.headerToggle = true;
        }

        if(elemTop.length === 0) {
            elemTop = $('<div></div>').appendTo(elemItemContent)
                .attr('id', contentId)
                .addClass(className)
                .addClass('item-' + content.type.toLowerCase());
        }

        switch(content.type.toLowerCase()) {

            case 'details':
                if(tabsAccessible.includes('ITEM_DETAILS') || (!isBlank(content.params.link))) {
                    insertItemSummaryContentTab(id, contentId, tabLabels.ITEM_DETAILS, content.params, isFirst);  
                    insertDetails(link, content.params);
                }
                break;

            case 'images':
                if(tabsAccessible.includes('ITEM_DETAILS') || (!isBlank(content.params.link))) {
                    let headerLabel = (isBlank(content.params.headerLabel)) ? 'Images' : content.params.headerLabel;
                    insertItemSummaryContentTab(id, contentId, headerLabel, content.params, isFirst);  
                    insertImages(link, content.params);
                }
                break;
            
            case 'attachments':
                if(tabsAccessible.includes('PART_ATTACHMENTS')) {
                    insertItemSummaryContentTab(id, contentId, tabLabels.PART_ATTACHMENTS, content.params, isFirst);          
                    insertAttachments(link, content.params);
                }
                break;

            case 'viewer':
                if(isBlank(content.params.fieldIdViewable)) {
                    if(tabsAccessible.includes('PART_ATTACHMENTS')) {
                        insertItemSummaryContentTab(id, contentId, 'Viewer', content.params, isFirst);
                        if(settings.summary[id].layout !== 'tabs') insertViewer(settings.summary[id].link, content.params);
                    }
                } else {
                    settings.summary[id].linkViewable = getSectionFieldValue(details.sections, content.params.fieldIdViewable, '', 'link');
                    insertItemSummaryContentTab(id, contentId, 'Viewer', content.params, isFirst);
                    viewerFeatures.markup = true;
                    if(settings.summary[id].layout !== 'tabs') insertViewer(settings.summary[id].linkViewable, content.params);
                }
                break;

            case 'markup':
                if(tabsAccessible.includes('PART_ATTACHMENTS')|| (!isBlank(content.link))) {
                    insertItemSummaryContentTab(id, contentId, 'Markup', content.params, isFirst);          
                    insertViewerMarkups(contentId, settings.summary[id].link, content.params, details.sections, fields);
                }      
                break;

            case 'bom':
                if(tabsAccessible.includes('BOM_LIST')|| (!isBlank(content.link))) {
                    insertItemSummaryContentTab(id, contentId, tabLabels.BOM_LIST, content.params, isFirst);          
                    insertBOM(link, content.params);
                }                
                break;

            case 'flat-bom':
                if(tabsAccessible.includes('BOM_LIST')) {
                    insertItemSummaryContentTab(id, contentId, 'Flat BOM', content.params, isFirst);          
                    insertFlatBOM(link, content.params);
                } 
                break;

            case 'parents':
                if(tabsAccessible.includes('BOM_WHERE_USED')) {
                    insertItemSummaryContentTab(id, contentId, tabLabels.BOM_WHERE_USED, content.params, isFirst);          
                    insertParents(link, content.params);
                } 
                break;

            case 'root-parents':
                if(tabsAccessible.includes('BOM_WHERE_USED')) {
                    insertItemSummaryContentTab(id, contentId, tabLabels.BOM_WHERE_USED, content.params, isFirst);          
                    insertRootParents(link, content.params);
                } 
                break;

            case 'grid':
                if(tabsAccessible.includes('PART_GRID')) {
                    insertItemSummaryContentTab(id, contentId, tabLabels.PART_GRID, content.params, isFirst);          
                    insertGrid(link, content.params);
                }
                break;

            case 'sourcing':
                if(tabsAccessible.includes('SOURCING')) {
                    insertItemSummaryContentTab(id, contentId, tabLabels.SOURCING, content.params, isFirst);          
                    insertSourcing(link, content.params);
                }
                break;

            case 'project':
                if(tabsAccessible.includes('PROJECT_MANAGEMENT')) {
                    insertItemSummaryContentTab(id, contentId, tabLabels.PROJECT_MANAGEMENT, content.params, isFirst);          
                    insertProject(link, content.params);
                }
                break;

            case 'relationships':
                if(tabsAccessible.includes('RELATIONSHIPS')) {
                    insertItemSummaryContentTab(id, contentId, tabLabels.RELATIONSHIPS, content.params, isFirst);          
                    insertRelationships(link, content.params);
                }
                break;

            case 'managed-items':
                if(tabsAccessible.includes('LINKEDITEMS')) {
                    insertItemSummaryContentTab(id, contentId, tabLabels.LINKEDITEMS, content.params, isFirst);          
                    insertManagedItems(link, content.params);
                }
                break;

            case 'change-processes':
                if(tabsAccessible.includes('WORKFLOW_REFERENCES')) {
                    insertItemSummaryContentTab(id, contentId, tabLabels.WORKFLOW_REFERENCES, content.params, isFirst);          
                    insertChangeProcesses(link, content.params);
                }
                break;

            case 'workflow-history':
                if(tabsAccessible.includes('WORKFLOW_ACTIONS')) {
                    insertItemSummaryContentTab(id, contentId, tabLabels.WORKFLOW_ACTIONS, content.params, isFirst);          
                    insertWorkflowHistory(link, content.params);
                }
                break;

            case 'change-log':
                if(tabsAccessible.includes('PART_HISTORY')) {
                    insertItemSummaryContentTab(id, contentId, tabLabels.PART_HISTORY, content.params, isFirst);          
                    insertChangeLog(link, content.params);
                }
                break;

        }

        isFirst = false;
    }

    if(elemTabs.length > 0) elemTabs.children().first().click();

    insertItemSummaryDataDone(id);

}
function insertItemSummaryContentTab(id, contentId, label, params, isFirst) {

    if(settings.summary[id].layout !== 'tabs') return;

    let elemTabs = $('#' + id + '-tabs');
    let tabLabel = isBlank(params.headerLabel) ? label : params.headerLabel;
    
    $('<div></div>').appendTo(elemTabs)
        .attr('data-content-id', contentId)
        .html(tabLabel)
        .click(function() {

            $(this).addClass('selected').siblings().removeClass('selected');
            $(this).css('background', 'var(--color-' + settings.summary[id].contentSurfaceLevel + ')') ;
            $(this).siblings().css('background', 'none');

            let contentId    = $(this).attr('data-content-id');
            let elemContents = $('#' + id + '-content');

            elemContents.children().each(function() {
                if($(this).attr('id') === contentId) {
                    $(this).removeClass('hidden');
                } else {
                    $(this).addClass('hidden');
                }
            });

            if(label === 'Viewer') {
                if(isBlank(settings.summary[id].linkViewable)) insertViewer(settings.summary[id].link, params);
                else insertViewer(settings.summary[id].linkViewable, params);
            }

        });
    
    params.hideHeaderLabel = true;
    params.hidePanel       = !isFirst;

}
function insertItemSummaryDone(id) {}
function insertItemSummaryDataDone(id) {}