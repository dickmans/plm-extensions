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
// function insertItemDetails(link, id, data, excludeSections, excludeFields) {

//     if(isBlank(link)) return;
//     if(isBlank(id)) id = 'details';

//     $('#' + id + '-processing').show();

//     insertItemDetailsFields(link, id, null, null, data, false, false, false, excludeSections, excludeFields);

// }
// function insertItemDetailsFields(link, id, sections, fields, data, editable, hideComputed, hideReadOnly, excludeSections, excludeFields) {

//     let requests = [];

//     if(isBlank(id)) id = 'details';

//     $('#' + id).attr('data-link', link);
//     $('#' + id + '-sections').html('');

//     if(isBlank(sections) || isBlank(fields)) {
//         if(!isBlank(link)) {
//             for(workspace of cacheWorkspaces) {
//                 if(workspace.id === link.split('/')[4]) {
//                     if(isBlank(sections)) sections = workspace.sections;
//                     if(isBlank(fields)  ) fields   = workspace.fields;
//                 }
//             }
//         }
//     }

//     if(!isBlank(link)) {
//         if(isBlank(sections)) requests.push($.get('/plm/sections', { 'link' : link }));
//         if(isBlank(fields)  ) requests.push($.get('/plm/fields'  , { 'link' : link }));
//         if(isBlank(data)    ) requests.push($.get('/plm/details' , { 'link' : link })); 
//     }

//     if(requests.length > 0) {

//         Promise.all(requests).then(function(responses) {

//             if($('#' + id).attr('data-link') !== responses[0].params.link) return;

//             let index      = 0;
//             let addToCache = true;

//             if(isBlank(sections)) sections  = responses[index++].data;
//             if(isBlank(fields)  ) fields    = responses[index++].data;
//             if(isBlank(data)    ) data      = responses[index++].data;

//             for(workspace of cacheWorkspaces) {
//                 if(workspace.id === link.split('/')[4]) {
//                     workspace.sections = sections;
//                     workspace.fields = fields;
//                     addToCache = false;
//                 }
//             }

//             if(addToCache) {
//                 cacheWorkspaces.push({
//                     'id'                : link.split('/')[4],
//                     'sections'          : sections,
//                     'fields'            : fields,
//                     'editableFields'    : null,
//                     'bomViews'          : null
//                 })
//             }

//             processItemDetailsFields(id, sections, fields, data, editable, hideComputed, hideReadOnly, excludeSections, excludeFields)

//         });

//     } else {

//         processItemDetailsFields(id, sections, fields, data, editable, hideComputed, hideReadOnly)

//     }

// }
// function processItemDetailsFields(id, sections, fields, data, editable, hideComputed, hideReadOnly, excludeSections, excludeFields) {

//     if(typeof id           === 'undefined') id            = 'details';
//     if(typeof sections     === 'undefined') sections      = [];
//     if(typeof fields       === 'undefined') fields        = [];
//     if(typeof data         === 'undefined') data          = [];
//     if(typeof editable     === 'undefined') editable      = false;
//     if(typeof hideComputed === 'undefined') hideComputed  = false;
//     if(typeof hideReadOnly === 'undefined') hideReadOnly  = false;

//     if(isBlank(excludeSections)) excludeSections = [];
//     if(isBlank(excludeFields)  ) excludeFields   = [];
   
//     let elemParent = $('#' + id + '-sections');
//         elemParent.html('');

//     $('#' + id + '-processing').hide();
   
//     for(section of sections) {

//         let sectionId   = section.__self__.split('/')[6];
//         let isNew       = true;
//         let className   = 'expanded'

//         if(excludeSections.indexOf(sectionId) === -1) {

//             for(cacheSection of cacheSections) {
//                 if(cacheSection.urn === section.urn) {
//                     isNew = false;
//                     className = cacheSection.className;
//                 }
//             }

//             if(isNew) {
//                 cacheSections.push({
//                     'urn' : section.urn, 'className' : 'expanded'
//                 })
//             }

//             let elemSection = $('<div></div>');
//                 elemSection.attr('data-urn', section.urn);
//                 elemSection.addClass('section');
//                 elemSection.addClass(className);
//                 elemSection.html(section.name);
//                 elemSection.appendTo(elemParent);
//                 elemSection.click(function() {
                    
//                     $(this).next().toggle();
//                     $(this).toggleClass('expanded');
//                     $(this).toggleClass('collapsed');

//                     for(cacheSection of cacheSections) {
//                         if(cacheSection.urn === $(this).attr('data-urn')) {
//                             cacheSection.className = $(this).hasClass('expanded') ? 'expanded' : 'collapsed';
//                         }
//                     }

//                 });

//             let elemFields = $('<div></div>');
//                 elemFields.addClass('section-fields');
//                 elemFields.attr('data-id', section.__self__.split('/')[6]);
//                 elemFields.appendTo(elemParent);

//             if(className !== 'expanded') elemFields.toggle();

//             for(sectionField of section.fields) {

//                 if(!excludeFields.includes(sectionField.link.split('/')[8])) {

//                     if(sectionField.type === 'MATRIX') {
//                         for(matrix of section.matrices) {
//                             if(matrix.urn === sectionField.urn) {
//                                 for(matrixFields of matrix.fields) {
//                                     for(matrixField  of matrixFields) {
//                                         if(matrixField !== null) {
//                                             for(wsField of fields) {
//                                                 if(wsField.urn === matrixField.urn)
//                                                     insertField(wsField, data, elemFields, hideComputed, hideReadOnly, editable);
//                                             }
//                                         }
//                                     }
//                                 }
//                             }
//                         }
//                     } else {
//                         for(wsField of fields) {
//                             if(wsField.urn === sectionField.urn)
//                                 insertField(wsField, data, elemFields, hideComputed, hideReadOnly, editable);
//                         }
//                     }
                    
//                 }
//             }

//             if(elemFields.children().length === 0) {
//                 elemFields.hide();
//                 elemSection.hide();
//             }

//         }

//     }

//     insertItemDetailsDone(id);
//     processItemDetailsFieldsDone(id);

// }
// function insertItemDetailsDone(id) {}
// function processItemDetailsFieldsDone(id) {}
// function insertField(field, itemData, elemParent, hideComputed, hideReadOnly, editable, hideLabel, context) {

//     if(typeof hideComputed === 'undefined') hideComputed = false;  // hide computed fields
//     if(typeof hideReadOnly === 'undefined') hideReadOnly = false;  // hide read only fields
//     if(typeof editable     === 'undefined')     editable = false;  // display editable
//     if(typeof hideLabel    === 'undefined')    hideLabel = false;  // return value only, without label field
//     if(typeof context      === 'undefined')      context = null;  

//     if(field.visibility !== 'NEVER') {

//         if(field.editability !== 'NEVER' || !hideReadOnly) {

//             if(!field.formulaField || !hideComputed) {

//                 let value    = null;
//                 let urn      = field.urn.split('.');
//                 let fieldId  = urn[urn.length - 1];
//                 let readonly = (!editable || field.editability === 'NEVER' || (field.editability !== 'ALWAYS' && (typeof itemData === 'undefined')) || field.formulaField);

//                 let elemField = $('<div></div>');
//                     elemField.addClass('field');
//                     // elemField.appendTo(elemParent);

//                 let elemLabel = $('<div></div>');
//                     elemLabel.addClass('field-label');
//                     elemLabel.html(field.name);
//                     elemLabel.appendTo(elemField);

//                 let elemValue = $('<div></div>');
//                 let elemInput = $('<input>');

//                 if(!isBlank(itemData)) {
//                     for(nextSection of itemData.sections) {
//                         for(itemField of nextSection.fields) {
//                             if(itemField.hasOwnProperty('urn')) {
//                                 urn = itemField.urn.split('.');
//                                 let itemFieldId = urn[urn.length - 1];
//                                 if(fieldId === itemFieldId) {
//                                     value = itemField.value;
//                                     break;
//                                 }
//                             }
//                         }
//                     }
//                 }

//                 if(typeof value === 'undefined') value = null;

//                 switch(field.type.title) {

//                     case 'Auto Number':
//                         elemValue.addClass('string');
//                         elemValue.append(elemInput);
//                         if(value !== null) elemInput.val(value);
//                         break;

//                     case 'Single Line Text':
//                         if(field.formulaField) {
//                             elemValue.addClass('computed');
//                             elemValue.addClass('no-scrollbar');
//                             elemValue.html($('<div></div>').html(value).text());
//                         } else {
//                             if(value !== null) elemInput.val(value);
//                             if(field.fieldLength !== null) {
//                                 elemInput.attr('maxlength', field.fieldLength);
//                                 elemInput.css('max-width', field.fieldLength * 8 + 'px');
//                             }
//                             elemValue.addClass('string');
//                             elemValue.append(elemInput);
//                         }
//                         break;

//                     case 'Paragraph':
//                         elemValue.addClass('paragraph');
//                         if(editable) {
//                             elemInput = $('<textarea></textarea>');
//                             elemValue.append(elemInput);
//                             // if(value !== null) elemValue.val($('<div></div>').html(value).text());
//                             if(value !== null) elemInput.html(value);
//                         } else {
//                             elemValue.html($('<div></div>').html(value).text());
//                         }
//                         break;

//                     case 'URL':
//                         if(editable) {
//                             elemValue.append(elemInput);
//                             if(value !== null) elemInput.val(value);
//                         } else {
//                             elemInput = $('<div></div>');
//                             elemValue.addClass('link');
//                             elemValue.append(elemInput);
//                             if(value !== '') {
//                                 elemInput.attr('onclick', 'window.open("' + value + '")');
//                                 elemInput.html(value);
//                             }
//                         }
//                         break;

//                     case 'Integer':
//                         elemValue.addClass('integer');
//                         elemValue.append(elemInput);
//                         if(value !== null) elemInput.val(value);
//                         break;
                        
//                     case 'Float':
//                     case 'Money':
//                         elemValue.addClass('float');
//                         elemValue.append(elemInput);
//                         if(value !== null) elemInput.val(value);
//                         break;

//                     case 'Date':
//                         elemInput.attr('type', 'date');
//                         elemValue.addClass('date');
//                         elemValue.append(elemInput);
//                         if(value !== null) elemInput.val(value);
//                         break;
                        
//                     case 'Check Box':
//                         elemInput.attr('type', 'checkbox');
//                         elemValue.addClass('checkbox');
//                         elemValue.append(elemInput);
//                         if(value !== null) if(value === 'true') elemInput.attr('checked', true);
//                         break;

//                     case 'Single Selection':
//                         if(editable) {
//                             elemInput = $('<select>');
//                             elemValue.addClass('picklist');
//                             elemValue.append(elemInput);
//                             if(context === null) {
//                                  $('<option></option>').appendTo(elemInput)
//                                     .attr('value', null);
//                                 getOptions(elemInput, field.picklist, fieldId, 'select', value);
//                             } else {
//                                 $('<option></option>').appendTo(elemInput)
//                                     .attr('value', context.link)
//                                     .html(context.title);
//                             }
//                         } else {
//                             elemValue = $('<div></div>');
//                             elemValue.addClass('string');
//                             if(field.type.link.split('/')[4] === '23') elemValue.addClass('link');
//                             if(value !== null) {
//                                 elemValue.html(value.title);
//                                 if(field.type.link === '/api/v3/field-types/23') {
//                                     elemValue.attr('onclick', 'openItemByURN("' + value.urn + '")');
//                                     elemValue.attr('data-item-link', value.link);
//                                 }
//                             }
//                             if(field.type.link === '/api/v3/field-types/23') elemValue.addClass('linking');
//                         }
//                         break;

//                     case 'Multiple Selection':
//                         elemValue.addClass('multi-picklist');
//                         if(editable) {
//                             if(value !== null) {
//                                 for(optionValue of value) {
//                                     let elemOption = $('<div></div>');
//                                         elemOption.attr('data-link', optionValue.link);
//                                         elemOption.addClass('field-multi-picklist-item');
//                                         elemOption.html(optionValue.title);
//                                         elemOption.appendTo(elemValue);
//                                         elemOption.click(function() { openItemByLink($(this).attr('data-link')); });
//                                 }
//                             }
//                         }
//                         break;

//                     case 'Filtered':
//                         if(editable) {
                            
//                             elemValue.addClass('filtered-picklist');
//                             elemValue.append(elemInput);
//                             elemInput.attr('data-filter-list', field.picklist);
//                             elemInput.attr('data-filter-field', field.picklistFieldDefinition.split('/')[8]);
//                             elemInput.addClass('filtered-picklist-input');
//                             elemInput.click(function() {
//                                 getFilteredPicklistOptions($(this));
//                             });
                            
//                             if(value !== null) elemInput.val(value);
                            
//                             let elemList = $('<div></div>');
//                                 elemList.addClass('filtered-picklist-options');
//                                 elemList.appendTo(elemValue);
                            
//                             let elemIcon = $('<div></div>');
//                                 elemIcon.addClass('icon');
//                                 elemIcon.addClass('icon-close');
//                                 elemIcon.addClass('xxs');
//                                 elemIcon.appendTo(elemValue);
//                                 elemIcon.click(function() {
//                                     clearFilteredPicklist($(this));
//                                 });

//                         } else {
//                             elemValue = $('<div></div>');
//                             elemValue.addClass('string');
//                             elemValue.addClass('link');
//                             if(value !== null) {
//                                 elemValue.html(value.title);
//                                 if(field.type.link === '/api/v3/field-types/23') {
//                                     elemValue.attr('onclick', 'openItemByURN("' + value.urn + '")');
//                                     elemValue.attr('data-item-link', value.link);
//                                 }
//                             }
//                             if(field.type.link === '/api/v3/field-types/23') elemValue.addClass('linking');
//                         }
//                         break;

//                     case 'BOM UOM Pick List':
//                         if(editable) {
                            
//                             elemInput = $('<select>');
//                             elemValue.addClass('picklist');
//                             elemValue.append(elemInput);

//                             let elemOptionBlank = $('<option></option>');
//                                 elemOptionBlank.attr('value', null);
//                                 elemOptionBlank.appendTo(elemInput);

//                             getOptions(elemInput, field.picklist, fieldId, 'select', value);

//                         } else {
//                             elemInput = $('<div></div>');
//                             elemValue.addClass('string');
//                             elemValue.append(elemInput);

//                             if(value !== null) {
//                                 elemInput.html(value.title);
//                                 if(field.type.link === '/api/v3/field-types/28') {
//                                     elemInput.attr('data-item-link', value.link);
//                                 }
//                             }
//                             if(field.type.link === '/api/v3/field-types/28') elemValue.addClass('bom-uom');
//                         }
//                         break;

//                     case 'Image':
//                         elemValue.addClass('drop-zone');
//                         elemValue.addClass('image');
//                         getImage(elemValue, value);
//                         break;

//                     case 'Radio Button':
//                         if(editable) {
//                             elemValue = $('<div></div>');
//                             elemValue.addClass('radio');
//                             getOptions(elemValue, field.picklist, fieldId, 'radio', value);
//                         } else {
//                             elemValue = $('<input>');
//                             elemValue.addClass('string');
//                             if(value !== null) elemValue.val(value.title);
//                         }
//                         break;

//                     default:

//                         if(!isBlank(field.defaultValue)) {
//                             elemValue.val(field.defaultValue);
//                         }

//                         break;

//                 }

//                 elemValue.addClass('field-value');

//                 elemValue.attr('data-id'        , fieldId);
//                 elemValue.attr('data-title'     , field.name);
//                 elemValue.attr('data-link'      , field.__self__);
//                 elemValue.attr('data-type-id'   , field.type.link.split('/')[4]);

//                 if(readonly) {
//                     elemInput.attr('readonly', true);
//                     elemInput.attr('disabled', true);
//                     elemValue.addClass('readonly');    
//                     elemField.addClass('readonly');    
//                 } else {
//                     elemField.addClass('editable');               

//                     if(field.fieldValidators !== null) {
//                         for(let validator of field.fieldValidators) {
//                             if(validator.validatorName === 'required') {
//                                 elemField.addClass('required');
//                             } else if(validator.validatorName === 'dropDownSelection') {
//                                 elemField.addClass('required');
//                             } else if(validator.validatorName === 'maxlength') {
//                                 elemValue.attr('maxlength', validator.variables.maxlength);
//                             }
//                         }
//                     }

//                 }

//                 if(field.unitOfMeasure !== null) {
                    
//                     elemValue.addClass('with-unit');

//                     let elemText = $('<div></div>');
//                         elemText.addClass('field-unit');
//                         elemText.html(field.unitOfMeasure);
//                         elemText.appendTo(elemValue);

//                 }
                
//                 if(hideLabel) {
//                     if(elemParent !== null) elemValue.appendTo(elemParent); 
//                     return elemValue;
//                 } else {
//                     elemValue.appendTo(elemField);
//                     if(elemParent !== null) elemField.appendTo(elemParent);
//                     return elemField;
//                 }

//             }

//         }
//     }

// }
// 
// function getOptions(elemParent, link, fieldId, type, value) {

//     for(let picklist of cachePicklists) {
//         if(picklist.link === link) {
//             insertOptions(elemParent, picklist.data, fieldId, type, value);
//             return;
//         }
//     }

//     $.get( '/plm/picklist', { 'link' : link, 'limit' : 100, 'offset' : 0 }, function(response) {

//         if(!response.error) {

//             let isNew = true;

//             for(let picklist of cachePicklists) {
//                 if(picklist.link === link) {
//                     isNew = false;
//                     continue;
//                 }
//             }

//             if(isNew) {
//                 cachePicklists.push({
//                     'link' : link,
//                     'data' : response.data
//                 });
//             }

//             insertOptions(elemParent, response.data, fieldId, type, value);
//         }
//     });

// }
// function insertOptions(elemParent, data, fieldId, type, value) {

//     for(let option of data.items) {
       
//         if(type === 'radio') {

//             let index = $('.radio').length + 1;

//             let elemRadio = $('<div></div>');
//                 elemRadio.addClass('radio-option');
//                 // elemRadio.attr('name', 'radio-' + index);
//                 elemRadio.attr('name', fieldId + '-' + index);
//                 elemRadio.appendTo(elemParent);

//             let elemInput = $('<input>');
//                 elemInput.attr('type', 'radio');
//                 elemInput.attr('id', option.link);
//                 elemInput.attr('value', option.link);
//                 // elemInput.attr('name', 'radio-' + index);
//                 elemInput.attr('name', fieldId + '-' + index);
//                 elemInput.appendTo(elemRadio);

//             let elemLabel = $('<label></label>');
//                 elemLabel.addClass('radio-label');
//                 // elemLabel.attr('for', option.link);
//                 elemLabel.attr('for', fieldId + '-' + index);
//                 elemLabel.html(option.title);
//                 elemLabel.appendTo(elemRadio);

//             if(typeof value !== 'undefined') {
//                 if(value !== null) {
//                     if(!value.hasOwnProperty('link')) {
//                         if(value === option.title) elemInput.prop('checked', true);
//                     } else if(value.link === option.link) {
//                         elemInput.prop('checked', true);
//                     }
//                 }
//             }

//         } else if(type === 'select') {

//             let title = option.title;

//             if(!isBlank(option.version)) title += ' ' + option.version;

//             let elemOption = $('<option></option>');
//                 elemOption.attr('id', option.link);
//                 elemOption.attr('value', option.link);
//                 elemOption.attr('displayValue', title);
//                 elemOption.html(title);
//                 elemOption.appendTo(elemParent);

//             if(typeof value !== 'undefined') {
//                 if(value !== null) {
//                     if(!value.hasOwnProperty('link')) {
//                         if(value === option.title) elemOption.attr('selected', true);
//                     } else if(value.link === option.link) {
//                         elemOption.attr('selected', true);
//                     }   
//                 }
//             }

//         }
    
//     }
// }
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
        .attr('hidden', '')
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
        headerLabel : 'Create New',
        layout      : 'normal'
    }, [
        [ 'hideComputed'        , true  ],
        [ 'hideReadOnly'        , false ],
        [ 'hideSections'        , false ],
        [ 'requiredFieldsOnly'  , false ],
        [ 'toggles'             , false ],
        [ 'sectionsIn'          , [] ],
        [ 'sectionsEx'          , [] ],
        [ 'sectionsOrder'       , [] ],
        [ 'fieldsIn'            , [] ],
        [ 'fieldsEx'            , [] ],
        [ 'fieldValues'         , [] ],
        [ 'contextId'           , null ],
        [ 'contextItem'         , null ],
        [ 'contextItemFields'   , [] ],
        [ 'viewerImageFields'   , [] ],
        [ 'createButtonLabel'   , 'Create' ],
        [ 'createButtonIcon'    , 'icon-create' ],
        [ 'createButtonTitle'   , '' ],
        [ 'cancelButton'        , true ],
        [ 'cancelButtonIcon'    , '' ],
        [ 'cancelButtonLabel'   , 'Cancel' ],
        [ 'cancelButtonTitle'   , '' ],
        [ 'onClickCancel'       , function(id) { } ],
        [ 'afterCreation'       , function(id, link) { console.log('New item link : ' + link ); } ]
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

    genPanelContents(id, settings.create[id]).addClass(settings.create[id].layout);

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

        if(!validateForm($('#' + id + '-content'))) {
            showErrorMessage('Error', 'Field validations do not permit creation');
            return;
        }

        $('#' + id + '-processing').show();
        $('#' + id + '-actions').hide();
        $('#' + id + '-content').hide();
        $('#' + id + '-footer').hide();

        submitCreateForm(settings.create[id].wsId, $('#' + id + '-content'), settings.create[id], function(response) {

            $('#' + id + '-processing').hide();
            $('#' + id + '-actions').show();
            $('#' + id + '-content').show();
            $('#' + id + '-footer').show();

            if(response.error) {

                showErrorMessage('Error creating item', response.data.errorMessage);

            } else {

                let link = response.data.split('.autodeskplm360.net')[1];
                insertCreateAfterCreation(id, link);
                settings.create[id].afterCreation(id, link, settings.create[id].contextId);

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

    if(!isBlank(settings.create[id].contextItem)) {
        requests.push($.get('/plm/details', { link : settings.create[id].contextItem }));
    }

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.create[id])) return;

            insertDetailsFields(id, responses[0].data, responses[1].data, null, settings.create[id], function() {

            for(let contextItemField of settings.create[id].contextItemFields) {
                settings.create[id].fieldValues.push({
                    fieldId      : contextItemField,
                    value        : settings.create[id].contextItem,
                    displayValue : responses[2].data.title
                })
            }

            for(let viewerImageField of settings.create[id].viewerImageFields) {
                settings.create[id].fieldValues.push({
                    fieldId      : viewerImageField,
                    viewerImage  : 'viewer-markup-image'
                })
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

                    if(elemField.hasClass('picklist')) {

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
            }
        }

    });

}
function insertCreateAfterCreation(id, link) {

    clearAllFormFields(id);

    if(settings.create[id].dialog) {
        $('#overlay').hide();
        $('#' + id).hide();
    }

}
function submitCreateForm(wsIdNew, elemParent, settings, callback) {

    if(isBlank(settings)) settings = {};

    let params = { 
        wsId     : wsIdNew,
        sections : getSectionsPayload(elemParent),
        image    : getImagePayload(elemParent)
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
            callback(response);
        });

    });

}
function submitEdit(link, elemParent, callback) {

    let params = { 
        'link'     : link,
        'sections' : getSectionsPayload(elemParent)
    };

    console.log(params);

    $.post('/plm/edit', params, function(response) {
        callback(response);
    });

}
function getSectionsPayload(elemParent) {

    let sections = [];

    elemParent.find('.section-fields').each(function() {

        let section = {
            id     : $(this).attr('data-id'),
            fields : []
        };

        $(this).find('.field.editable').each(function() {

            let elemField = $(this).children('.field-value').first();
            let fieldData = getFieldValue(elemField);
            
            // if(!elemField.hasClass('multi-picklist')) {
                if(fieldData.value !== null) {
                    if(typeof fieldData.value !== 'undefined') {
                        // if(fieldData.value !== '') {
                        if(fieldData.type !== 'image') {
                            section.fields.push({
                                fieldId   : fieldData.fieldId,
                                link      : fieldData.link,
                                value     : fieldData.value,
                                type      : fieldData.type,
                                title     : fieldData.title,
                                typeId    : fieldData.typeId,
                            });
                        }
                    }
                }
            // }

            if(elemField.hasClass('image')) {
                let elemCanvas = elemField.children('canvas');
                if(elemCanvas.length > 0) {
                    
                }
            }

        });

        if(section.fields.length > 0) sections.push(section);

    });

    return sections;

}
function getFieldValue(elemField) {

    let elemInput = elemField.find('input');
    let value     = (elemInput.length > 0) ? elemInput.val() : '';
    let hasSelect = (elemField.find('select').length > 0);

    let result = {
        fieldId   : elemField.attr('data-id'),
        link      : elemField.attr('data-link'),
        title     : elemField.attr('data-title'),
        typeId    : elemField.attr('data-type-id'),
        value     : value,
        display   : value,
        type      : 'string'
    }

    if(elemField.hasClass('image')) {
        result.type = 'image';
    } else if(elemField.hasClass('paragraph')) {
        value           = elemField.find('textarea').val();
        result.value    = value;
        result.display  = value;
    } else if(elemField.hasClass('radio')) {
        result.type  = 'picklist';
        result.value = null;
        elemField.find('input').each(function() {
        // elemField.children().each(function() {
            if($(this).prop('checked')) {
                result.value    = { 'link' : $(this).attr('value') };
                result.display  = $(this).siblings('label').first().html();
                result.type     = 'picklist';
            }
        });
    // } else if(elemField.hasClass('picklist')) {
    } else if(hasSelect) {
        elemInput = elemField.find('select');
        result.type ='picklist';
        if(elemInput.val() === '') {
            result.value = null;
        } else {
            result.value = {
                'link' : elemInput.val()
            };
            result.display = elemInput.val();
        }
    } else if(elemField.hasClass('multi-picklist')) {
        result.value = [];
        elemField.children().each(function () {
            result.value.push({ 'link' : $(this).attr('data-link')});
        });
    } else if(elemField.hasClass('filtered-picklist')) {
        if(result.value === '') result.value = null; else result.value = { 'title' : result.value };
        result.type = 'filtred-picklist';
    } else if(elemField.hasClass('float')) {
        if(result.value === '') result.value = null; else result.value = parseFloat(result.value);
        result.type = 'float';
    } else if(elemField.hasClass('integer')) {
        if(result.value === '') result.value = null; else result.value = Number(result.value);
        result.type = 'integer';
    } else if(elemField.hasClass('checkbox')) {
        result.value = (elemInput.is(':checked')) ? 'true' : 'false';
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

            if ((fieldData.value === null) || (fieldData.value === '')) {
                elemInput.addClass('required-empty');
                // $('<div class="validation-error">Input is required</div>').insertAfter($(this));
                result = false;
            }
        }
       
    });
    
    return result;
    
}
function clearAllFormFields(id) {

    $('#' + id).find('.field-value').each(function() {
        $(this).children().val('');
    });

    $('#' + id).find('.radio-option').each(function() {
        $(this).children('input').first().prop('checked', false);
    });

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
        [ 'requiredFieldsOnly' , false ],
        [ 'saveButtonLabel'    , 'Save' ],
        [ 'suppressLinks'      , false ],
        [ 'toggles'            , false ],
        [ 'workflowActions'    , false ],
        [ 'sectionsIn'         , [] ],
        [ 'sectionsEx'         , [] ],
        [ 'sectionsOrder'      , [] ],
        [ 'fieldsIn'           , [] ],
        [ 'fieldsEx'           , [] ],
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

    genPanelContents(id, settings.details[id]).addClass(settings.details[id].layout);

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
            submitEdit(settings.details[id].link, $('#' + id + '-content'), function() {
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
        $.get('/plm/sections', { link : settings.details[id].link }),
        $.get('/plm/fields'  , { link : settings.details[id].link })
    ];

    if((settings.details[id].bookmark) ) requests.push($.get('/plm/bookmarks'  , { link : settings.details[id].link }));
    if((settings.details[id].cloneable)) requests.push($.get('/plm/permissions', { link : settings.details[id].link }));

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.details[id])) return;

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

        insertDetailsFields(id, responses[1].data, responses[2].data, responses[0].data, settings.details[id], function() {
            finishPanelContentUpdate(id, settings.details[id]);
            insertDetailsDataDone(id, responses[1].data, responses[2].data, responses[0].data);
        });


    });

}
function insertDetailsFields(id, sections, fields, data, settings, callback) {

    $('#' + id + '-processing').hide();

    if(isBlank(settings)) settings = {};

    let elemContent  = $('#' + id + '-content');
    let sectionsIn   = settings.sectionsIn;
    let sectionsEx   = settings.sectionsEx;
    let fieldsIn     = settings.fieldsIn;
    let fieldsEx     = settings.fieldsEx;
    let fieldValues  = (isBlank(settings.fieldValues)) ? [] : settings.fieldValues;

    elemContent.scrollTop();
    settings.derived = [];

    if(isBlank(settings.expandSections))   settings.expandSections   = [];
    if(isBlank(settings.collapseContents)) settings.collapseContents = false;

    if(!settings.editable) elemContent.addClass('readonly');

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

    for(let section of sections) {

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

        if(sectionsIn.length === 0 || sectionsIn.includes(section.name)) {
            if(sectionsEx.length === 0 || !sectionsEx.includes(section.name)) {

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
                                                    let matrixFieldId = matrixField.link.split('/').pop();
                                                    if(fieldsIn.length === 0 || fieldsIn.includes(matrixFieldId)) {
                                                        if(fieldsEx.length === 0 || !fieldsEx.includes(matrixFieldId)) {
                                                            insertDetailsField(wsField, data, elemFields, sectionLock, settings);
                                                            included = true;
                                                        }
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
                                if(fieldsIn.length === 0 || fieldsIn.includes(fieldId)) {
                                    if(fieldsEx.length === 0 || !fieldsEx.includes(fieldId)) {
                                        insertDetailsField(wsField, data, elemFields, sectionLock, settings);
                                        included = true;
                                    }
                                }
                            }
                        }
                    }

                    // console.log(sectionField);

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

                if(elemFields.children().length === 0) {
                    elemFields.remove();
                    elemSection.remove();
                }
            }

        }
    }

    callback();

}
function insertDetailsField(field, data, elemFields, sectionLock, settings) {

    if(isBlank(settings)) {
        settings = {
            hideComputed   : false,
            hideReadOnly   : false,
            hideLabels     : false,
            suppressLinks  : false,
            editable       : false,
            fieldsIn       : []
        }
    } else {
        if(isBlank(settings.fieldsIn)) settings.fieldsIn = [];
    }

    let hideComputed    = (isBlank(settings.hideComputed )) ? false : settings.hideComputed;
    let hideReadOnly    = (isBlank(settings.hideReadOnly )) ? false : settings.hideReadOnly;
    let hideLabels      = (isBlank(settings.hideLabels   )) ? false : settings.hideLabels;
    let suppressLinks   = (isBlank(settings.suppressLinks)) ? false : settings.suppressLinks;
    let editable        = (isBlank(settings.editable     )) ? false : settings.editable;

    if(field.visibility === 'NEVER') return;
    if((field.editability === 'NEVER') && hideReadOnly) return;
    if(field.formulaField  && hideComputed) return;

    let value    = null;
    let urn      = field.urn.split('.');
    let fieldId  = urn[urn.length - 1];
    let readonly = (!settings.editable || field.editability === 'NEVER' || (field.editability !== 'ALWAYS' && (typeof data === 'undefined')) || field.formulaField);
    let required = isFieldRequiredOrSelected(field, fieldId, settings);
    
    if(sectionLock) { readonly = true; editable = false; }

    if(!required && settings.requiredFieldsOnly) return;

    let elemField = $('<div></div').addClass('field').addClass('content-item').attr('id', 'field-' + fieldId);
    let elemValue = $('<div></div>');
    let elemInput = $('<input>');

    if(!hideLabels) {
        $('<div></div>').appendTo(elemField)
            .addClass('field-label')
            .html(field.name);
    }

    if(!isBlank(data)) {
        for(let nextSection of data.sections) {
            for(let itemField of nextSection.fields) {
                if(itemField.hasOwnProperty('urn')) {
                    let urn = itemField.urn.split('.');
                    let itemFieldId = urn[urn.length - 1];
                    if(fieldId === itemFieldId) {
                        value = itemField.value;
                        break;
                    }
                }
            }
        }
    }

    if(typeof value === 'undefined') value = null;

    switch(field.type.title) {

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
            elemValue.addClass('single-picklist');
            if(editable) {
                elemInput = $('<select>');
                elemValue.addClass('picklist');
                elemValue.append(elemInput);
                let elemOptionBlank = $('<option></option>');
                    elemOptionBlank.attr('value', null);
                    elemOptionBlank.appendTo(elemInput);
                getPickListOptions(elemInput, field.picklist, fieldId, 'select', value);
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

        case 'Multiple Selection':
            elemValue.addClass('multi-picklist');
            if(editable) {
                if(value !== null) {
                    for(optionValue of value) {
                        let elemOption = $('<div></div>');
                            elemOption.attr('data-link', optionValue.link);
                            elemOption.html(optionValue.title);
                            elemOption.appendTo(elemValue);
                            if(!suppressLinks) {
                                elemOption.addClass('field-multi-picklist-item');
                                elemOption.click(function() { openItemByLink($(this).attr('data-link')); });
                            }
                    }
                }
            }
            break;

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

                getPickListOptions(elemInput, field.picklist, fieldId, 'select', value);

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
                getPickListOptions(elemValue, field.picklist, fieldId, 'radio', value);
            } else {
                elemValue = $('<input>');
                elemValue.addClass('string');
                if(value !== null) elemValue.val(value.title);
            }
            break;

        default:

            if(!isBlank(field.defaultValue)) {
                elemValue.val(field.defaultValue);
            }

            break;

    }

    elemValue.addClass('field-value');

    elemValue.attr('data-id'        , fieldId);
    elemValue.attr('data-title'     , field.name);
    elemValue.attr('data-link'      , field.__self__);
    elemValue.attr('data-type-id'   , field.type.link.split('/')[4]);

    if(readonly) {
        elemInput.attr('readonly', true);
        elemInput.attr('disabled', true);
        elemValue.addClass('readonly');    
        elemField.addClass('readonly');    
    } else {
        elemField.addClass('editable');               

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

    if(field.unitOfMeasure !== null) {
        
        elemValue.addClass('with-unit');

        if(editable) {
            $('<div></div>').appendTo(elemValue)
                .addClass('field-unit')
                .html(field.unitOfMeasure);
        } else {
            elemValue.append(' ' + field.unitOfMeasure);
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
function isFieldRequiredOrSelected(field, fieldId, settings) {

    if(isBlank(field.fieldValidators)) return false;

    if(settings.fieldsIn.includes(fieldId)) return true;

    for(let validator of field.fieldValidators) {
        if(validator.validatorName === 'required') {
            return true;
        } else if(validator.validatorName === 'dropDownSelection') {
            return true;
        }
    }

    return false;

}
function getImageField(elemParent, value) {

    if(isBlank(value)) return;
    
    $.get( '/plm/image', { link : value.link }, function(response) {
                                
        $("<img class='thumbnail' src='data:image/png;base64," + response.data + "'>").appendTo(elemParent);
                                
    });
    
}
function getEditableFields(fields) {

    let result = [];

    for(let field of fields) {

        if(field.editability === 'ALWAYS') {
            if(field.type !== null) {

                let elemControl = null;
                let fieldId = ('fieldId' in field) ? field.fieldId : field.__self__.split('/')[8];

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

                    case 'Radio Button': 
                    case 'Single Selection': 
                        elemControl = $('<select>');
                        elemControl.addClass('picklist');

                        $('<option></option>').appendTo(elemControl).attr('value', null);

                        getPickListOptions(elemControl, field.picklist, fieldId, 'select', '');

                        break;

                }

                result.push({
                    id      : fieldId,
                    title   : field.name,
                    link    : field.__self__,
                    type    : field.type.title,
                    typeId  : field.type.link.split('/')[4],
                    control : elemControl
                });

            }
        }

    }

    return result;

}
function getPickListOptions(elemParent, link, fieldId, type, value) {

    for(let picklist of cachePicklists) {
        if(picklist.link === link) {
            insertPickListOptions(elemParent, picklist.data, fieldId, type, value);
            return;
        }
    }

    $.get( '/plm/picklist', { link : link, limit : 100, offset : 0 }, function(response) {

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

            insertPickListOptions(elemParent, response.data, fieldId, type, value);
        }
    });

}
function insertPickListOptions(elemParent, data, fieldId, type, value) {

    for(let option of data.items) {
       
        if(type === 'radio') {

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

        } else if(type === 'select') {

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
        [ 'sectionsEx' , []     ],
        [ 'fieldsIn'   , []     ],
        [ 'fieldsEx'   , []     ]
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
        contentSize : 's',
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
        [ 'rotate'  , false ],
        [ 'bookmark', false ]
    ]);

    settings.grid[id].layout = 'table';
    settings.grid[id].load   = function() { insertGridData(id); }

    genPanelTop(id, settings.grid[id], 'grid');
    genPanelHeader(id, settings.grid[id]);
    genPanelBookmarkButton(id, settings.grid[id]);
    genPanelOpenInPLMButton(id, settings.grid[id]);
    genPanelSearchInput(id, settings.grid[id]);
    genPanelResizeButton(id, settings.grid[id]);
    genPanelReloadButton(id, settings.grid[id]);

    genPanelContents(id, settings.grid[id]);

    if(settings.grid[id].editable) {

        let elemToolbar = genPanelToolbar(id, settings.grid[id], 'controls');

        $('<div></div>').prependTo(elemToolbar)
            .addClass('button')
            .addClass('default')
            .attr('id', id + '-save')
            .html('Save')
            .hide()
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                saveGridData(id);
            });

    }

    insertGridDone(id);

    settings.grid[id].load();

}
function insertGridData(id) {

    settings.grid[id].timestamp = startPanelContentUpdate(id);

    let params = {
        link      : settings.grid[id].link,
        timestamp : settings.grid[id].timestamp
    }

    let requests    = [
        $.get('/plm/grid',         params),
        $.get('/plm/grid-columns', { link : settings.grid[id].link, useCache : settings.grid[id].useCache })
    ];

    if((settings.grid[id].bookmark)) requests.push($.get('/plm/bookmarks', { link : settings.grid[id].link })); 

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.grid[id])) return;

        setPanelBookmarkStatus(id, settings.grid[id], responses);

        let columns = [];

        for(let field of responses[1].data.fields) {
            if(includePanelTableColumn(field.name, settings.grid[id], columns.length)) {
                field.fieldId = field.__self__.split('/').pop();
                columns.push(field);
            }
        }

        if(responses[0].data.length > 0 ) {

            let elemContent    = $('#' + id + '-content');
            let elemTable      = $('<table></table>').appendTo(elemContent).addClass('grid').addClass('row-hovering').attr('id', id + '-table');
            let elemTHead      = $('<thead></thead>').addClass('fixed').attr('id', id + '-thead');
            let elemTBody      = $('<tbody></tbody>').appendTo(elemTable).attr('id', id + '-tbody').attr('id', id + '-tbody');
            let elemTHRow      = $('<tr></tr>').appendTo(elemTHead).addClass('fixed');
            let editableFields = (settings.grid[id].editable) ? getEditableFields(columns) : [];

            if(settings.grid[id].tableHeaders) elemTHead.prependTo(elemTable);

            if(!settings.grid[id].rotate) {

                elemTable.addClass('fixed-header');

                for(let column of columns) {
                    $('<th></th>').appendTo(elemTHRow)
                        .addClass('column-' + column.fieldId)
                        .html(column.name);
                }

                for(let row of responses[0].data) {

                    let elemTableRow = $('<tr></tr>').appendTo(elemTBody)
                        .addClass('content-item')
                        .click(function(e) {
                            clickGridRow($(this), e);
                            if(!isBlank(settings.grid[id].onClickItem)) settings.grid[id].onClickItem($(this));
                        }).dblclick(function() {
                            if(!isBlank(settings.grid[id].onDblClickItem)) settings.grid[id].onDblClickItem($(this));
                        });

                    for(let field of row.rowData) {
                        if(field.title === 'Row Id') {
                            elemTableRow.attr('data-link', field.__self__);
                        }
                    }

                    for(let field of columns) {
                        let value    = getGridRowValue(row, field.fieldId, '', 'title');
                        let elemCell = $('<td></td>').appendTo(elemTableRow)
                            .addClass('column-' + field.fieldId)
                            .attr('data-id', field.fieldId);

                        
                        if(settings.grid[id].editable) {


                            for(let editableField of editableFields) {
                                
                                if(field.fieldId === editableField.id) {

                                    if(!isBlank(editableField.control)) {
                                
                                        elemCell.attr('data-title', editableField.title)
                                            .attr('data-link', editableField.link)
                                            .attr('data-type-id', editableField.typeId);

                                        let elemControl = editableField.control.clone();
                                            elemControl.appendTo(elemCell)
                                            .attr('data-id', editableField.id)
                                            .click(function(e) {
                                                e.stopPropagation();
                                            })
                                            .dblclick(function(e) {
                                                e.stopPropagation()
                                            })
                                            .change(function() {
                                                panelTableCellValueChanged($(this));
                                            });

                                        switch (editableField.type) {
                                            
                                            case 'Single Selection':
                                            // case 'Radio Button':
                                                let linkValue = getGridRowValue(row, field.fieldId, '', 'link');
                                                let elemValue = $('<option></option>')
                                                    .attr('value', linkValue)
                                                    .html(value)
                                                elemControl.append(elemValue);
                                                elemControl.val(linkValue);
                                                break;
                
                                            default:
                                                elemControl.val(value);
                                                break;
                
                                        }
                
                                        isEditable = true;
                                    }
                
                                }
                            }


                        } else elemCell.html(value);
                    }

                }

            } else {

                elemTable.addClass('rotated');

                for(let column of columns) {

                    let elemTableRow = $('<tr></tr>').appendTo(elemTBody)
                        .addClass('content-item')
                        .click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            clickGridRow($(this), e);
                        });

                    $('<th></th>').appendTo(elemTableRow).html(column.name);

                    for(let row of responses[0].data) {

                        let value   = getGridRowValue(row, column.fieldId, '', 'title');

                        $('<td></td>').appendTo(elemTableRow).html(value);

                    }

                }
            }

        }

        finishPanelContentUpdate(id, settings.grid[id]);
        insertGridDataDone(id, responses[0].data, responses[1].data);

    });

}
function insertGridDone(id) {}
function insertGridDataDone(id, rows, columns) {}
function clickGridRow(elemClicked, e) {}
function saveGridData(id) {

    appendOverlay(false);

    let requests  = [];
    let elemTBody = $('#' + id + '-tbody');

    elemTBody.children('.changed').each(function() {

        let elemRow = $(this);
        let rowId   = elemRow.attr('data-link').split('/').pop();
        let data    = [];

        elemRow.children('td').each(function() {
            let fieldData =  getFieldValue($(this));
            data.push({
                fieldId : fieldData.fieldId,
                value   : fieldData.value,
            })
        });

        requests.push($.get('/plm/update-grid-row', { link : settings.grid[id].link, rowId : rowId, data : data }))

    });

    Promise.all(requests).then(function(responses) {
        elemTBody.children().removeClass('changed');
        $('#overlay').hide();
    });

}



// Insert BOM tree with selected controls
function insertBOM(link , params) {

    if(isBlank(link)) return;
    if(isBlank(params)) params = {};

    let id          = isBlank(params.id) ? 'bom' : params.id;
    let hideDetails = true;
    
    if(!isBlank(params.columnsIn)) hideDetails = false;
    if(!isBlank(params.columnsEx)) hideDetails = false;

    settings.bom[id] = getPanelSettings(link, params, {
        headerLabel : 'BOM',
        contentSize : 'l',
    }, [
        [ 'additionalRequests'  , []    ],
        [ 'bomViewName'         , ''    ],
        [ 'depth'               , 10    ],
        [ 'endItemFieldId'      , ''    ],
        [ 'endItemValue'        , ''    ],
        [ 'getFlatBOM'          , false ],
        [ 'goThere'             , false ],
        [ 'hideDetails'         , hideDetails  ],
        [ 'includeOMPartList'   , false ],
        [ 'path'                , false ],
        [ 'position'            , true  ],
        [ 'reset'               , false ],
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

    if(settings.bom[id].reset) {

        $('<div></div>').appendTo(genPanelToolbar(id, settings.bom[id], 'controls'))
            .addClass('button')
            .addClass('icon')
            .addClass('icon-reset')
            .addClass('xs')
            .attr('id', id + '-action-reset')
            .attr('title', 'Reset BOM view')
            .click(function() {
                clickBOMReset($(this));
            });

    }
    

    //  Set defaults for optional parameters
    // --------------------------------------
    // let additionalRequests  = [];        // Array of additional requests which will be submitted in parallel to the BOM request
    // let compactDisplay      = false;     // Optimizes CSS settings for a compact display
    // let deselect            = true;      // Adds button to deselect selected element (not available if multiSelect is enabled)
    // let getFlatBOM          = false;     // Retrieve Flat BOM at the same time (i.e. to get total quantities)
    // let hideDetails         = true;      // When set to true, detail columns will be skipped, only the descriptor will be shown
    // let multiSelect         = false;     // Enables selection of multiple items and adds buttons to select / deselect all elements as well as checkboxes
    // let path                = true;      // Display path of selected component in BOM, enabling quick navigation to parent(s)
    // let position            = true;      // When set to true, the position / find number will be displayed

    // let revisionBias        = 'release'; // Set BOM configuration to expand [release, working, changeOrder, allChangeOrder]
    // let selectItems         = {};
    // let selectUnique        = true;      // Defines if only unique items should be returned based on selectItems filter, skipping following instances of the same item
    // let showRestricted      = false;     // When set to true, red lock icons will be shown if an item's BOM contains items that are not accessilbe for the user due to access permissions
    // let openInPLM           = true;      // Adds button to open selected element in PLM
    // let views               = false;     // Adds drop down menu to select from the available PLM BOM views

    // settings.bom[id].position           = position;
    // settings.bom[id].quantity           = quantity;
    // settings.bom[id].hideDetails        = hideDetails;
    // settings.bom[id].showRestricted     = showRestricted;
    // settings.bom[id].selectItems        = selectItems;
    // settings.bom[id].selectUnique       = selectUnique;
    // settings.bom[id].endItemFieldId     = null;
    // settings.bom[id].endItemValue       = null;
    // settings.bom[id].getFlatBOM         = getFlatBOM;
    // settings.bom[id].additionalRequests = additionalRequests;


    genPanelSearchInput(id, settings.bom[id]);
    genPanelResizeButton(id, settings.bom[id]);
    genPanelReloadButton(id, settings.bom[id]);

    genPanelContents(id, settings.bom[id]);

    if(settings.bom[id].path) {
        $('<div></div>').appendTo($('#' + id))
            .attr('id', id + '-bom-path')
            .addClass('bom-path-empty')
            .addClass('bom-path')
            .addClass('no-scrollbar');
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
                    if(includePanelTableColumn(field.displayName, settings, columnsCount++)) {
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

    for(let request of settings.bom[id].additionalRequests) requests.push(request);

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.bom[id])) return;

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

        if(settings.bom[id].includeOMPartList) responseData.bomPartsList = getBOMPartsList(settings.bom[id], responses[0].data)

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
function clickBOMSelectAll(elemClicked) {

    let elemBOM = elemClicked.closest('.bom');

    elemBOM.find('.bom-item').addClass('selected');

    toggleBOMItemActions(elemClicked);
    updateBOMCounters(elemBOM.attr('id'));

}
function clickBOMDeselectAll(elemClicked) {

    let elemBOM = elemClicked.closest('.bom');

    elemBOM.find('.bom-item').removeClass('selected');

    toggleBOMItemActions(elemClicked);
    updateBOMPath(elemClicked);
    updateBOMCounters(elemBOM.attr('id'));

    clickBOMDeselectAllDone(elemClicked);

}
function clickBOMDeselectAllDone(elemClicked) {}
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
// function searchInBOM(id, elemInput) {

//     // TODO: REMOVE

//     let elemTable   = $('#' + id + '-tbody');
//     let filterValue = elemInput.val().toLowerCase();
//     let parents     = [];

//     if(filterValue === '') {

//         elemTable.children().each(function() {
//             $(this).removeClass('bom-hidden').removeClass('result');
//         });
//         elemTable.children('.node').each(function() {
//             $(this).removeClass('collapsed').removeClass('result-parent');
//         });

//     } else {

//         elemTable.children('tr').each(function() {

//             let cellValue = $(this).attr('data-title').toLowerCase();
//             let matches   = (cellValue.indexOf(filterValue) > -1);
//             let level     = Number($(this).attr('data-level'));
//             let isNode    = $(this).hasClass('node');
            
//             if(level <= parents.length) {
//                 parents.splice(level - 1);
//             }

//             if(matches) {
             
//                 $(this).removeClass('bom-hidden').addClass('result');

//                 for(let parent of parents) parent.removeClass('bom-hidden').removeClass('collapsed').addClass('result-parent');

//             } else {

//                 $(this).addClass('bom-hidden').removeClass('result').removeClass('result-parent');

//             }

//             if(isNode) parents.push($(this));

//         });

//     }

//     updateBOMCounters(id);

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
function clickBOMReset(elemClicked) {

    let id          = elemClicked.closest('.bom').attr('id');
    let elemContent = elemClicked.closest('.bom').find('.bom-tbody');

    elemContent.children().removeClass('result').removeClass('selected').removeClass('bom-hidden');
    
    // if(settings.bom[id].collapseContents) {
    //     clickBOMCollapseAll($('#' + id + '-toolbar'));
    // } else {
    //     clickBOMExpandAll($('#' + id + '-toolbar'));
    // }

    $('#' + id + '-search-input').val('');

    toggleBOMItemActions(elemClicked);
    updateBOMPath(elemClicked);
    updateBOMCounters(id);
    clickBOMResetDone(elemClicked);

}
function clickBOMResetDone(elemClicked) {}
function clickBOMOpenInPLM(elemClicked) {

    let elemBOM   = elemClicked.closest('.bom');
    let elemItem  = elemBOM.find('.bom-item.selected').first();
    
    openItemByLink(elemItem.attr('data-link'));

}
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
function bomDisplayItem(elemItem) {

    let level = Number(elemItem.attr('data-level'));

    expandBOMParents(level - 1, elemItem);
    
    let elemBOM = elemItem.closest('.panel-content');
    let top     = elemItem.position().top - (elemBOM.innerHeight() / 2);
    
    elemBOM.animate({ scrollTop: top }, 500);

}
function bomDisplayItemByPartNumber(number, select, deselect) {

    if(isBlank(select  )) select   = true;
    if(isBlank(deselect)) deselect = true;

    let bomItemLinks = [];

    $('.bom-item').each(function() {
        if(number === $(this).attr('data-part-number')) {
            bomDisplayItem($(this));
            bomItemLinks.push($(this).attr('data-link'));
            if(select) $(this).addClass('selected');
        } else {
            if(deselect) $(this).removeClass('selected');
        }
    });

    return bomItemLinks;

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
        } else elemItem.addClass('bom-path-selected');

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
                if(includePanelTableColumn(field.displayName, settings.partList[id], settings.partList[id].columns.length)) {
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
    // genPanelDeselectAllButton(id, settings.flatBOM[id]);
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
  
    // let search          = true;            // Adds quick filtering using search input on top of BOM
    // let placeholder     = 'Search';        // Set placeholder text for quick filtering input
    // let multiSelect     = false;           // Enables selection of multiple items
    // let editable        = false;           // When set to true, enables modifications in editable fields
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
    // if(!isBlank(params.editable)      )       editable = params.editable;
    // if(!isBlank(params.filterEmpty)   )    filterEmpty = params.filterEmpty;
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



    // let elemCounters = $('<div></div>').appendTo($('#' + id))
    //     .attr('id', id + '-list-counters')
    //     .addClass('list-counters')
    //     .hide();

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
            if(includePanelTableColumn(column.displayName, settings.flatBOM[id], settings.flatBOM[id].columns.length)) {
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
            if(includePanelTableColumn(column.displayName, settings.roots[id], settings.roots[id].columns.length)) {
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
            if(includePanelTableColumn(column.displayName, settings.parents[id], settings.parents[id].columns.length)) {
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
            if(includePanelTableColumn(column.displayName, settings.changes[id], settings.changes[id].columns.length)) {
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

        if(settings.viewer[id].link !== response.params.link) return;
        if(settings.viewer[id].timeStamp != response.params.timeStamp) return;

        let suffix3D = ['.iam','.ipt','.stp','.step','.sldprt'];

        if(response.data.length > 0) {

            let viewables = [];

            for(let viewable of response.data) {
                let is3D = false;
                for(let suffix of suffix3D) {
                    if(viewable.name.indexOf(suffix) > -1) {
                        is3D = true;
                        break;
                    }
                }
                if(is3D) viewables.unshift(viewable); else viewables.push(viewable);
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
        [ 'filterByLifecycle', true ],
        [ 'filterByWorkspace', true ]
    ]);

    settings.managedItems[id].load = function() { insertManagedItemsData(id); }

    genPanelTop(id, settings.managedItems[id], 'managed-items');
    genPanelHeader(id, settings.managedItems[id]);
    genPanelOpenSelectedInPLMButton(id, settings.managedItems[id]);
    genPanelRemoveSelectedButton(id, settings.managedItems[id], function() { removeManagedItems(id); } );
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
            if(includePanelTableColumn(column.displayName, settings.managedItems[id], settings.managedItems[id].columns.length)) {
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
        [ 'filterByStatus'         , false ],
        [ 'filterByWorkspace'      , false ],
        [ 'createId'               , 'create' ],
        [ 'createHeaderLabel'      , 'Create Process' ],
        [ 'createSectionsIn'       , [] ],
        [ 'createSectionsEx'       , [] ],
        [ 'createFieldsIn'         , [] ],
        [ 'createFieldsEx'         , [] ],
        [ 'createWorkspaceIds'     , [] ],
        [ 'createWorkspaceNames'   , [] ],
        [ 'createContextItemFields', [] ], // 'AFFECTED_ITEM'
        [ 'createViewerImageFields', [] ], // 'IMAGE_1'
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
                contextItemFields   : settings.processes[id].createContextItemFields,
                viewerImageFields   : settings.processes[id].createViewerImageFields,
                afterCreation       : function(createId, createLink, id) { onChangeProcessCreation(createId, createLink, id); }
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
            if(includePanelTableColumn(column.displayName, settings.processes[id], settings.processes[id].columns.length)) {
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
function onChangeProcessCreation(createId, createLink, id) {

    console.log('onChangeProcessCreation');
    console.log(createId);
    console.log(createLink);
    console.log(settings.processes[id]);

    let link = settings.processes[id].link;

               
    // $.get('/plm/add-managed-items', { 'link' : link, 'items' : [ settings.processes[id].link ] }, function(response) {
    $.get('/plm/add-managed-items', { link : createLink, items : [ link ] }, function(response) {
        console.log(response);
        // settings.processes[id].load(id, createLink);
        insertChangeProcessesData(id, createLink);
    });

}
function insertChangeProcessesDone(id) {}
function insertChangeProcessesDataDone(id, data) {}



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
            if(includePanelTableColumn(column.displayName, settings.relationships[id], settings.relationships[id].columns.length)) {
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
            if(includePanelTableColumn(column.displayName, settings.sourcing[id], settings.sourcing[id].columns.length)) {
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
            if(includePanelTableColumn(column, settings.changeLog[id], counter++)) {
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

                                if(includePanelTableColumn(column, settings.changeLog[id], counter++)) {

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
    }

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
                    settings.summary[id].onClickClose();
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
        $.get('/plm/fields'        , { link : settings.summary[id].link, useCache : true }),
        $.get('/plm/tabs'          , { link : settings.summary[id].link, useCache : true })
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
                if(tabsAccessible.includes('PART_ATTACHMENTS')) {
                    insertItemSummaryContentTab(id, contentId, 'Viewer', content.params, isFirst);  
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
                insertViewer(settings.summary[id].link, params);
            }

        });
    
    params.hideHeaderLabel = true;
    params.hidePanel       = !isFirst;

}
function insertItemSummaryDone(id) {}
function insertItemSummaryDataDone(id) {}