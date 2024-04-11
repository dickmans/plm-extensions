// Library file to contain reusable methods for various UI components
let cachePicklists  = []; // keys: link, data
let cacheSections   = [];
let cacheWorkspaces = [];
let selectedItems   = [];
let urnsBOMFields   = [];
let requestsLimit   = 5;



// Insert APS Viewer
function insertViewer(link, params) {

    if(isBlank(link)) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let id              = 'viewer';    // ID of the DOM element where the viewer should be inserted
    let fileId          = '';         // Select a specific file to be rendered by providing its unique ID
    let filename        = '';         // Select a specific file to be rendered by providing its filename (matches the Title column in the attachments tab)
    let extensionsIn    = [];         // Defines the list of attachment file types to take into account when requesting the possible list of viewable files. Only file types included in this list will be taken into account.
    let extensionsEx    = [];         // Defines the list of attachment file types to exclued when requesting the possible list of viewable files. Files with an extension listed will not be considered as valid viewable.
    let backgroundColor = '';         // Background color
    let settings        = {};
    
    if( isBlank(params)                 )       params = {};
    if(!isBlank(params.id)              )           id = params.id;
    if(!isBlank(params.fileId)          )       fileId = params.fileId;
    if(!isBlank(params.filename)        )     filename = params.filename;
    if(!isBlank(params.extensionsIn)    ) extensionsIn = params.extensionsIn;
    if(!isBlank(params.extensionsEx)    ) extensionsEx = params.extensionsEx;
    
    if(!isBlank(params.backgroundColor) )  settings.backgroundColor = params.backgroundColor;
    if(!isBlank(params.antiAliasing)    )     settings.antiAliasing = params.antiAliasing;
    if(!isBlank(params.ambientShadows)  )   settings.ambientShadows = params.ambientShadows;
    if(!isBlank(params.groundReflection)) settings.groundReflection = params.groundReflection;
    if(!isBlank(params.groundShadow)    )     settings.groundShadow = params.groundShadow;
    if(!isBlank(params.lightPreset)     )      settings.lightPreset = params.lightPreset;

    let elemInstance = $('#' + id).children('.adsk-viewing-viewer');
    if(elemInstance.length > 0) elemInstance.hide();

    $('#' + id).attr('data-link', link);

    let elemProcessing = $('#' + id + '-processing')

    if(elemProcessing.length === 0) {
        appendViewerProcessing(id, false);
    } else {
        elemProcessing.show();
        $('#' + id + '-message').hide();
    }

    $.get('/plm/get-viewables', { 
        'link'          : link, 
        'fileId'        : fileId, 
        'filename'      : filename, 
        'extensionsIn'  : extensionsIn, 
        'extensionsEx'  : extensionsEx 
    }, function(response) {

        if($('#' + id).attr('data-link') !== response.params.link) return;

        if(response.data.length > 0) {

            let foundAssembly = false;

            $('body').removeClass('no-viewer');

            for(let viewable of response.data) {
                if((viewable.name.indexOf('.iam.dwf') > -1) || (viewable.name.indexOf('.ipt.dwf') > -1)) {
                    $('body').removeClass('no-viewer');
                    if(elemInstance.length > 0) elemInstance.show();
                    foundAssembly = true;
                    insertViewerDone(id, viewable, response.data);
                    initViewer(id, viewable, settings);
                    break;
                }
            }

            if(!foundAssembly) {
                if(elemInstance.length > 0) elemInstance.show();
                insertViewerDone(id, response.data[0], response.data);
                initViewer(id, response.data[0], settings);
            }

        } else {

            $('#' + id).hide();
            $('#' + id + '-processing').hide();
            $('#' + id + '-message').css('display', 'flex');
            $('body').addClass('no-viewer');

        }
    });

}
function insertViewerDone(id, viewable, viewables) {}



// Insert Item Status
function insertItemStatus(link, id) {

    $('#' + id).html('');

    $.get('/plm/details', { 'link' : link }, function(response) {
        $('#' + id).html(response.data.currentState.title);
    });

}


// Insert Item Details
function insertItemDetails(link, id, data, excludeSections, excludeFields) {

    if(isBlank(link)) return;
    if(isBlank(id)) id = 'details';

    $('#' + id + '-processing').show();

    getBookmarkStatus();
    insertItemDetailsFields(link, id, null, null, data, false, false, false, excludeSections, excludeFields);

}
function insertItemDetailsFields(link, id, sections, fields, data, editable, hideComputed, hideReadOnly, excludeSections, excludeFields) {

    let requests = [];

    if(isBlank(id)) id = 'details';

    $('#' + id).attr('data-link', link);
    $('#' + id + '-sections').html('');

    if(isBlank(sections) || isBlank(fields)) {
        if(!isBlank(link)) {
            for(workspace of cacheWorkspaces) {
                if(workspace.id === link.split('/')[4]) {
                    if(isBlank(sections)) sections = workspace.sections;
                    if(isBlank(fields)  ) fields   = workspace.fields;
                }
            }
        }
    }

    if(!isBlank(link)) {
        if(isBlank(sections)) requests.push($.get('/plm/sections', { 'link' : link }));
        if(isBlank(fields)  ) requests.push($.get('/plm/fields'  , { 'link' : link }));
        if(isBlank(data)    ) requests.push($.get('/plm/details' , { 'link' : link })); 
    }

    if(requests.length > 0) {

        Promise.all(requests).then(function(responses) {

            if($('#' + id).attr('data-link') !== responses[0].params.link) return;

            let index      = 0;
            let addToCache = true;

            if(isBlank(sections)) sections  = responses[index++].data;
            if(isBlank(fields)  ) fields    = responses[index++].data;
            if(isBlank(data)    ) data      = responses[index++].data;

            for(workspace of cacheWorkspaces) {
                if(workspace.id === link.split('/')[4]) {
                    workspace.sections = sections;
                    workspace.fields = fields;
                    addToCache = false;
                }
            }

            if(addToCache) {
                cacheWorkspaces.push({
                    'id'                : link.split('/')[4],
                    'sections'          : sections,
                    'fields'            : fields,
                    'editableFields'    : null,
                    'bomViews'          : null
                })
            }

            processItemDetailsFields(id, sections, fields, data, editable, hideComputed, hideReadOnly, excludeSections, excludeFields)

        });

    } else {

        processItemDetailsFields(id, sections, fields, data, editable, hideComputed, hideReadOnly)

    }

}
function processItemDetailsFields(id, sections, fields, data, editable, hideComputed, hideReadOnly, excludeSections, excludeFields) {

    if(typeof id           === 'undefined') id            = 'details';
    if(typeof sections     === 'undefined') sections      = [];
    if(typeof fields       === 'undefined') fields        = [];
    if(typeof data         === 'undefined') data          = [];
    if(typeof editable     === 'undefined') editable      = false;
    if(typeof hideComputed === 'undefined') hideComputed  = false;
    if(typeof hideReadOnly === 'undefined') hideReadOnly  = false;

    if(isBlank(excludeSections)) excludeSections = [];
    if(isBlank(excludeFields)  ) excludeFields   = [];
   
    let elemParent = $('#' + id + '-sections');
        elemParent.html('');

    $('#' + id + '-processing').hide();
   
    for(section of sections) {

        let sectionId   = section.__self__.split('/')[6];
        let isNew       = true;
        let className   = 'expanded'

        if(excludeSections.indexOf(sectionId) === -1) {

            for(cacheSection of cacheSections) {
                if(cacheSection.urn === section.urn) {
                    isNew = false;
                    className = cacheSection.className;
                }
            }

            if(isNew) {
                cacheSections.push({
                    'urn' : section.urn, 'className' : 'expanded'
                })
            }

            let elemSection = $('<div></div>');
                elemSection.attr('data-urn', section.urn);
                elemSection.addClass('section');
                elemSection.addClass(className);
                elemSection.html(section.name);
                elemSection.appendTo(elemParent);
                elemSection.click(function() {
                    
                    $(this).next().toggle();
                    $(this).toggleClass('expanded');
                    $(this).toggleClass('collapsed');

                    for(cacheSection of cacheSections) {
                        if(cacheSection.urn === $(this).attr('data-urn')) {
                            cacheSection.className = $(this).hasClass('expanded') ? 'expanded' : 'collapsed';
                        }
                    }

                });

            let elemFields = $('<div></div>');
                elemFields.addClass('section-fields');
                elemFields.attr('data-id', section.__self__.split('/')[6]);
                elemFields.appendTo(elemParent);

            if(className !== 'expanded') elemFields.toggle();

            for(sectionField of section.fields) {

                if(!excludeFields.includes(sectionField.link.split('/')[8])) {

                    if(sectionField.type === 'MATRIX') {
                        for(matrix of section.matrices) {
                            if(matrix.urn === sectionField.urn) {
                                for(matrixFields of matrix.fields) {
                                    for(matrixField  of matrixFields) {
                                        if(matrixField !== null) {
                                            for(wsField of fields) {
                                                if(wsField.urn === matrixField.urn)
                                                    insertField(wsField, data, elemFields, hideComputed, hideReadOnly, editable);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        for(wsField of fields) {
                            if(wsField.urn === sectionField.urn)
                                insertField(wsField, data, elemFields, hideComputed, hideReadOnly, editable);
                        }
                    }
                    
                }
            }

            if(elemFields.children().length === 0) {
                elemFields.hide();
                elemSection.hide();
            }

        }

    }

    insertItemDetailsDone(id);
    processItemDetailsFieldsDone(id);

}
function insertItemDetailsDone(id) {}
function processItemDetailsFieldsDone(id) {}
function insertField(field, itemData, elemParent, hideComputed, hideReadOnly, editable, hideLabel) {

    if(typeof hideComputed === 'undefined') hideComputed = false;  // hide computed fields
    if(typeof hideReadOnly === 'undefined') hideReadOnly = false;  // hide read only fields
    if(typeof editable     === 'undefined')     editable = false;  // display editable
    if(typeof hideLabel    === 'undefined')    hideLabel = false;  // return value only, without label field

    if(field.visibility !== 'NEVER') {

        if(field.editability !== 'NEVER' || !hideReadOnly) {

            if(!field.formulaField || !hideComputed) {

                let value    = null;
                let urn      = field.urn.split('.');
                let fieldId  = urn[urn.length - 1];
                let readonly = (!editable || field.editability === 'NEVER' || (field.editability !== 'ALWAYS' && (typeof itemData === 'undefined')) || field.formulaField);

                let elemField = $('<div></div>');
                    elemField.addClass('field');
                    // elemField.appendTo(elemParent);

                let elemLabel = $('<div></div>');
                    elemLabel.addClass('field-label');
                    elemLabel.html(field.name);
                    elemLabel.appendTo(elemField);

                let elemValue = $('<div></div>');
                let elemInput = $('<input>');

                if(!isBlank(itemData)) {
                    for(nextSection of itemData.sections) {
                        for(itemField of nextSection.fields) {
                            if(itemField.hasOwnProperty('urn')) {
                                urn = itemField.urn.split('.');
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
                        elemValue.addClass('string');
                        elemValue.append(elemInput);
                        if(value !== null) elemInput.val(value);
                        break;

                    case 'Single Line Text':
                        if(field.formulaField) {
                            elemValue.addClass('computed');
                            elemValue.addClass('no-scrollbar');
                            elemValue.html($('<div></div>').html(value).text());
                        } else {
                            if(value !== null) elemInput.val(value);
                            if(field.fieldLength !== null) {
                                elemInput.attr('maxlength', field.fieldLength);
                                elemInput.css('max-width', field.fieldLength * 8 + 'px');
                            }
                            elemValue.addClass('string');
                            elemValue.append(elemInput);
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
                        elemValue.addClass('integer');
                        elemValue.append(elemInput);
                        if(value !== null) elemInput.val(value);
                        break;
                        
                    case 'Float':
                    case 'Money':
                        elemValue.addClass('float');
                        elemValue.append(elemInput);
                        if(value !== null) elemInput.val(value);
                        break;

                    case 'Date':
                        elemInput.attr('type', 'date');
                        elemValue.addClass('date');
                        elemValue.append(elemInput);
                        if(value !== null) elemInput.val(value);
                        break;
                        
                    case 'Check Box':
                        elemInput.attr('type', 'checkbox');
                        elemValue.addClass('checkbox');
                        elemValue.append(elemInput);
                        if(value !== null) if(value === 'true') elemInput.attr('checked', true);
                        break;

                    case 'Single Selection':
                        if(editable) {
                            elemInput = $('<select>');
                            elemValue.addClass('picklist');
                            elemValue.append(elemInput);
                            let elemOptionBlank = $('<option></option>');
                                elemOptionBlank.attr('value', null);
                                elemOptionBlank.appendTo(elemInput);
                            getOptions(elemInput, field.picklist, fieldId, 'select', value);
                        } else {
                            elemValue = $('<div></div>');
                            elemValue.addClass('string');
                            if(field.type.link.split('/')[4] === '23') elemValue.addClass('link');
                            if(value !== null) {
                                elemValue.html(value.title);
                                if(field.type.link === '/api/v3/field-types/23') {
                                    elemValue.attr('onclick', 'openItemByURN("' + value.urn + '")');
                                    elemValue.attr('data-item-link', value.link);
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
                                        elemOption.addClass('field-multi-picklist-item');
                                        elemOption.html(optionValue.title);
                                        elemOption.appendTo(elemValue);
                                        elemOption.click(function() { openItemByLink($(this).attr('data-link')); });
                                }
                            }
                        }
                        break;

                    case 'Filtered':
                        if(editable) {
                            
                            elemValue.addClass('filtered-picklist');
                            elemValue.append(elemInput);
                            elemInput.attr('data-filter-list', field.picklist);
                            elemInput.attr('data-filter-field', field.picklistFieldDefinition.split('/')[8]);
                            elemInput.addClass('filtered-picklist-input');
                            elemInput.click(function() {
                                getFilteredPicklistOptions($(this));
                            });
                            
                            if(value !== null) elemInput.val(value);
                            
                            let elemList = $('<div></div>');
                                elemList.addClass('filtered-picklist-options');
                                elemList.appendTo(elemValue);
                            
                            let elemIcon = $('<div></div>');
                                elemIcon.addClass('icon');
                                elemIcon.addClass('icon-close');
                                elemIcon.addClass('xxs');
                                elemIcon.appendTo(elemValue);
                                elemIcon.click(function() {
                                    clearFilteredPicklist($(this));
                                });

                        } else {
                            elemValue = $('<div></div>');
                            elemValue.addClass('string');
                            elemValue.addClass('link');
                            if(value !== null) {
                                elemValue.html(value.title);
                                if(field.type.link === '/api/v3/field-types/23') {
                                    elemValue.attr('onclick', 'openItemByURN("' + value.urn + '")');
                                    elemValue.attr('data-item-link', value.link);
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

                            getOptions(elemInput, field.picklist, fieldId, 'select', value);

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
                        getImage(elemValue, value);
                        break;

                    case 'Radio Button':
                        if(editable) {
                            elemValue = $('<div></div>');
                            elemValue.addClass('radio');
                            getOptions(elemValue, field.picklist, fieldId, 'radio', value);
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

                    let elemText = $('<div></div>');
                        elemText.addClass('field-unit');
                        elemText.html(field.unitOfMeasure);
                        elemText.appendTo(elemValue);

                }
                
                if(hideLabel) {
                    if(elemParent !== null) elemValue.appendTo(elemParent); 
                    return elemValue;
                } else {
                    elemValue.appendTo(elemField);
                    if(elemParent !== null) elemField.appendTo(elemParent);
                    return elemField;
                }

            }

        }
    }

}
function getImage(elemParent, value) {

    if(isBlank(value)) return;

    $.get( '/plm/image', { 'link' : value.link }, function(response) {
                            
        let elemImage = $("<img class='thumbnail' src='data:image/png;base64," + response.data + "'>");
            elemImage.appendTo(elemParent);
                            
    });

}
function getOptions(elemParent, link, fieldId, type, value) {

    for(let picklist of cachePicklists) {
        if(picklist.link === link) {
            insertOptions(elemParent, picklist.data, fieldId, type, value);
            return;
        }
    }

    $.get( '/plm/picklist', { 'link' : link, 'limit' : 100, 'offset' : 0 }, function(response) {

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
                    'link' : link,
                    'data' : response.data
                });
            }

            insertOptions(elemParent, response.data, fieldId, type, value);
        }
    });

}
function insertOptions(elemParent, data, fieldId, type, value) {

    for(let option of data.items) {
       
        if(type === 'radio') {

            let index = $('.radio').length + 1;

            let elemRadio = $('<div></div>');
                elemRadio.addClass('radio-option');
                // elemRadio.attr('name', 'radio-' + index);
                elemRadio.attr('name', fieldId + '-' + index);
                elemRadio.appendTo(elemParent);

            let elemInput = $('<input>');
                elemInput.attr('type', 'radio');
                elemInput.attr('id', option.link);
                elemInput.attr('value', option.link);
                // elemInput.attr('name', 'radio-' + index);
                elemInput.attr('name', fieldId + '-' + index);
                elemInput.appendTo(elemRadio);

            let elemLabel = $('<label></label>');
                elemLabel.addClass('radio-label');
                // elemLabel.attr('for', option.link);
                elemLabel.attr('for', fieldId + '-' + index);
                elemLabel.html(option.title);
                elemLabel.appendTo(elemRadio);

            if(typeof value !== 'undefined') {
                if(value !== null) {
                    if(!value.hasOwnProperty('link')) {
                        if(value === option.title) elemInput.prop('checked', true);
                    } else if(value.link === option.link) {
                        elemInput.prop('checked', true);
                    }
                }
            }

        } else if(type === 'select') {

            let elemOption = $('<option></option>');
                elemOption.attr('id', option.link);
                elemOption.attr('value', option.link);
                elemOption.attr('displayValue', option.title);
                elemOption.html(option.title);
                elemOption.appendTo(elemParent);

            if(typeof value !== 'undefined') {
                if(value !== null) {
                    if(!value.hasOwnProperty('link')) {
                        if(value === option.title) elemOption.attr('selected', true);
                    } else if(value.link === option.link) {
                        elemOption.attr('selected', true);
                    }   
                }
            }

        }
    
    }
}
function getFilteredPicklistOptions(elemClicked) {

    closeAllFilteredPicklists();

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
    
    $.get( '/plm/filtered-picklist', { 'link' : elemClicked.parent().attr('data-link'), 'filters' : filters, 'limit' : 100, 'offset' : 0 }, function(response) {
        elemClicked.removeClass('filter-list-refresh');
        if(!response.error) {
            for(item of response.data.items) {
                let elemOption = $('<div></div>');
                    elemOption.html(item)    ;
                    elemOption.appendTo(elemList);
                    elemOption.click(function() {
                        $(this).parent().hide();
                        $(this).parent().prev().val($(this).html());
                    });
            }
            elemList.show();
        }
    });   

}
function clearFilteredPicklist(elemClicked) {
    
    closeAllFilteredPicklists();
    elemClicked.siblings('input').val('');

}
function closeAllFilteredPicklists() {

    $('.filtered-picklist-options').html('').hide();

}
function clearFields(id) {

    $('#' + id).find('.field-value').each(function() {
        $(this).children().val('');
    });

    $('#' + id).find('.radio-option').each(function() {
        $(this).children('input').first().prop('checked', false);
    });

}


// Get controls for ediable fields of given workspace
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

                    case 'Float': 
                    case 'Integer': 
                    case 'Single Line Text': 
                        elemControl = $('<input>');
                        break;

                    case 'Radio Button': 
                    case 'Single Selection': 
                        elemControl = $('<select>');
                        elemControl.addClass('picklist');

                        let elemOptionBlank = $('<option></option>');
                            elemOptionBlank.attr('value', null);
                            elemOptionBlank.appendTo(elemControl);

                        getOptions(elemControl, field.picklist, fieldId, 'select', '');

                        break;

                }

                result.push({
                    'id'      : fieldId,
                    // 'title'   : sectionField.title,
                    'type'    : field.type.title,
                    'control' : elemControl
                });

            }
        }

    }

    return result;

}


// Insert Create Dialog
function insertCreateForm(id, wsId, params) {

    if(isBlank(id)  ) return;
    if(isBlank(wsId)) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let hideReadOnly    = true;             // Hide header with setting this to false
    let sectionsIn      = [];    // Set the header text
    let sectionsEx      = [];    // Set the header text
    let fieldsIn        = [];    // Set the header text
    let fieldsEx        = [];    // Set the header text

    if( isBlank(params)             )       params = {};
    if(!isBlank(params.hideReadOnly)) hideReadOnly = params.hideReadOnly;
    if(!isBlank(params.sectionsIn)  )   sectionsIn = params.sectionsIn;
    if(!isBlank(params.sectionsEx)  )   sectionsEx = params.sectionsEx;
    if(!isBlank(params.fieldsIn)    )     fieldsIn = params.fieldsIn;
    if(!isBlank(params.fieldsEx)    )     fieldsEx = params.fieldsEx;

    let paramsForm = {
        id           : id,
        sections     : [],
        fields       : [],
        hideReadOnly : hideReadOnly,
        sectionsIn   : sectionsIn,
        sectionsEx   : sectionsEx,
        fieldsIn     : fieldsIn,
        fieldsEx     : fieldsEx,
    }

    wsId = wsId.toString();
    
    for(let workspace of cacheWorkspaces) {
        if(workspace.id === wsId) {
            if(!isBlank(workspace.sections)) paramsForm.sections = workspace.sections;
            if(!isBlank(workspace.fields)  ) paramsForm.fields   = workspace.fields;
        }
    }
    
    if((paramsForm.sections.length === 0) || (paramsForm.fields.length === 0)) {

        let requests = [
            $.get('/plm/sections', { 'wsId' : wsId } ),
            $.get('/plm/fields',   { 'wsId' : wsId } )
        ]

        Promise.all(requests).then(function(responses) {

            let addToCache = true;

            for(let workspace of cacheWorkspaces) {
                if(workspace.id === wsId) {
                    workspace.sections = responses[0].data;
                    workspace.fields   = responses[0].data;
                    addToCache         = false;
                }
            }

            if(addToCache) {
                cacheWorkspaces.push({
                    'id'        : wsId,
                    'sections'  : responses[0].data,
                    'fields'    : responses[1].data
                });
            }

            paramsForm.sections = responses[0].data;
            paramsForm.fields   = responses[1].data;

            insertCreateFormFields(paramsForm);

        });

    } else insertCreateFormFields(paramsForm);
    
}
function insertCreateFormFields(params) {
  
    $('#' + params.id + '-processing').hide();

    let elemSections = $('#' + params.id + '-sections');
        elemSections.html('');

    for(let section of params.sections) {

        let isNew       = true;
        let className   = 'expanded'

        if(params.sectionsIn.length === 0 || params.sectionsIn.includes(section.name)) {
            if(params.sectionsEx.length === 0 || !params.sectionsEx.includes(section.name)) {

                for(let cacheSection of cacheSections) {
                    if(cacheSection.urn === section.urn) {
                        isNew = false;
                        className = cacheSection.className;
                    }
                }

                if(isNew) {
                    cacheSections.push({
                        'urn' : section.urn, 'className' : 'expanded'
                    })
                }

                let elemSection = $('<div></div>')
                    .attr('data-urn', section.urn)
                    .addClass('section')
                    .addClass(className)
                    .html(section.name)
                    .click(function() {
                        $(this).next().toggle();
                        $(this).toggleClass('expanded');
                        $(this).toggleClass('collapsed');
                        for(let cacheSection of cacheSections) {
                            if(cacheSection.urn === $(this).attr('data-urn')) {
                                cacheSection.className = $(this).hasClass('expanded') ? 'expanded' : 'collapsed';
                            }
                        }

                    });

                let elemFields = $('<div></div>')
                    .addClass('section-fields')
                    .attr('data-id', section.__self__.split('/')[6]);

                if(className !== 'expanded') elemFields.toggle();

                for(let sectionField of section.fields) {

                    let fieldId = sectionField.link.split('/')[8];

                    if(params.fieldsIn.length === 0 || params.fieldsIn.includes(fieldId)) {
                        if(params.fieldsEx.length === 0 || !params.fieldsEx.includes(fieldId)) {

                            if(sectionField.type === 'MATRIX') {
                                for(let matrix of section.matrices) {
                                    if(matrix.urn === sectionField.urn) {
                                        for(let matrixFields of matrix.fields) {
                                            for(let matrixField  of matrixFields) {
                                                if(matrixField !== null) {
                                                    for(let wsField of params.fields) {
                                                        if(wsField.urn === matrixField.urn) {
                                                            let matrixFieldId = matrixField.link.split('/')[8];
                                                            if(params.fieldsIn.length === 0 || params.fieldsIn.includes(matrixFieldId)) {
                                                                if(params.fieldsEx.length === 0 || !params.fieldsEx.includes(matrixFieldId)) {
                                                                    insertField(wsField, null, elemFields, params.hideComputed, params.hideReadOnly, true);
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
                                for(let wsField of params.fields) {
                                    if(wsField.urn === sectionField.urn)
                                        insertField(wsField, null, elemFields, params.hideComputed, params.hideReadOnly, true);
                                }
                            }
                                
                        }
                    }
                }

                if(elemFields.children().length > 0) {
                    elemSection.appendTo(elemSections);
                    elemFields.appendTo(elemSections);
                }

            }
        }

    }

    $('#' + params.id + '-sections').show();
    $('#' + params.id + '-processing').hide();

}
function submitCreateForm(wsId, elemParent, idMarkup, callback) {

    let params = { 
        'wsId'     : wsId,
        'sections' : getSectionsPayload(elemParent) 
    };

    if(!isBlank(idMarkup)) {

        let elemMarkupImage = $('#' + idMarkup);

        if(elemMarkupImage.length > 0) {
            params.image = {
                'fieldId' : elemMarkupImage.attr('data-field-id'),
                'value'   : elemMarkupImage[0].toDataURL('image/jpg')
            }
        }

    }

    $.post({
        url : '/plm/create', 
        contentType : "application/json",
        data : JSON.stringify(params)
    }, function(response) {
        callback(response);
    });

}
function submitEdit(link, elemParent, callback) {

    let params = { 
        'link'     : link,
        'sections' : getSectionsPayload(elemParent) 
    };

    // console.log(params);

    $.get('/plm/edit', params, function(response) {
        callback(response);
    });

}
function getSectionsPayload(elemParent) {

    let sections = [];

    elemParent.find('.section-fields').each(function() {

        let section = {
            'id'        : $(this).attr('data-id'),
            'fields'    : []
        };

        $(this).find('.field.editable').each(function() {

            let elemField = $(this).children('.field-value').first();
            let fieldData = getFieldValue(elemField);
            
            // if(!elemField.hasClass('multi-picklist')) {
                if(fieldData.value !== null) {
                    if(typeof fieldData.value !== 'undefined') {
                        if(fieldData.value !== '') {
                            section.fields.push({
                                'fieldId'   : fieldData.fieldId,
                                'link'      : fieldData.link,
                                'value'     : fieldData.value,
                                'type'      : fieldData.type,
                                'title'     : fieldData.title,
                                'typeId'    : fieldData.typeId,
                            });
                        }
                    }
                }
            // }

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
        'fieldId'   : elemField.attr('data-id'),
        'link'      : elemField.attr('data-link'),
        'title'     : elemField.attr('data-title'),
        'typeId'    : elemField.attr('data-type-id'),
        'value'     : value,
        'display'   : value,
        'type'      : 'string'
    }

    if(elemField.hasClass('paragraph')) {
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



// Insert Details
function insertDetails(link, params) {

    if(isBlank(link)) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let id              = 'details';    // ID of the DOM element where the history should be inserted
    let header          = true;         // Can be used to suppress addition of the panel header element
    let headerLabel     = 'Details';    // Set the header label
    let headerToggle    = false;        // Enable header toggles
    let inline          = false;        // Display the grid inline with other elements
    let reload          = false;        // Enable reload button for the history panel
    let hideComputed    = false;        // Hide computed fields
    let hideReadOnly    = false;        // Hide read only fields
    let hideLabels      = false;        // Hide field labels
    let suppressLinks   = false;        // When set to true, linking pick lists will not be shown as links, preventing users from opening the native PLM user interface
    let editable        = false;        // Display form in edit mode
    let compactDisplay  = false;        // Enable compact display
    let sectionsIn      = [];           // Define list of columns to include by fieldId; columns not included in this list will not be shown at all. Keep empty to show all columns.
    let sectionsEx      = [];           // Define list of columns to exclude by fieldId; columns in this list will not be shown at all. Keep empty to show all columns.
    let fieldsIn        = [];           // Define list of columns to include by fieldId; columns not included in this list will not be shown at all. Keep empty to show all columns.
    let fieldsEx        = [];           // Define list of columns to exclude by fieldId; columns in this list will not be shown at all. Keep empty to show all columns.

    if( isBlank(params)               )         params = {};
    if(!isBlank(params.id)            )             id = params.id;
    if(!isBlank(params.header)        )         header = params.header;
    if(!isBlank(params.headerLabel)   )    headerLabel = params.headerLabel;
    if(!isBlank(params.headerToggle)  )   headerToggle = params.headerToggle;
    if(!isBlank(params.inline)        )         inline = params.inline;
    if(!isBlank(params.reload)        )         reload = params.reload;
    if(!isBlank(params.hideComputed)  )   hideComputed = params.hideComputed;
    if(!isBlank(params.hideReadOnly)  )   hideReadOnly = params.hideReadOnly;
    if(!isBlank(params.hideLabels)    )     hideLabels = params.hideLabels;
    if(!isBlank(params.suppressLinks) )  suppressLinks = params.suppressLinks;
    if(!isBlank(params.editable)      )      columnsIn = params.editable;
    if(!isBlank(params.compactDisplay)) compactDisplay = params.compactDisplay;
    if(!isBlank(params.sectionsIn)    )     sectionsIn = params.sectionsIn;
    if(!isBlank(params.sectionsEx)    )     sectionsEx = params.sectionsEx;
    if(!isBlank(params.fieldsIn)      )       fieldsIn = params.fieldsIn;
    if(!isBlank(params.fieldsEx)      )       fieldsEx = params.fieldsEx;

    settings.details[id]                = {};
    settings.details[id].hideComputed   = hideComputed;
    settings.details[id].hideReadOnly   = hideReadOnly;
    settings.details[id].hideLabels     = hideLabels;
    settings.details[id].suppressLinks  = suppressLinks;
    settings.details[id].editable       = editable;
    settings.details[id].sectionsIn     = sectionsIn;
    settings.details[id].sectionsEx     = sectionsEx;
    settings.details[id].fieldsIn       = fieldsIn;
    settings.details[id].fieldsEx       = fieldsEx;

    let elemParent = $('#' + id)
        .addClass('details')
        .html('');

    if(header) {
        
        let elemHeader = genPanelHeader(id, headerToggle, headerLabel);
            elemHeader.appendTo(elemParent);   

        if(reload) {

            let elemToolbar = $('<div></div>').appendTo(elemHeader)
                .addClass('panel-toolbar')
                .attr('id', id + '-toolbar');

            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-refresh')
                .attr('id', id + '-reload')
                .attr('title', 'Reload this view')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    insertDetailsData(id);
                });

        }
    }

    let elemContent = $('<div></div>').appendTo(elemParent)
        .attr('id', id + '-content')
        .attr('data-link', link)
        .addClass('grid-content')
        .addClass('no-scrollbar');

    if(compactDisplay) elemContent.addClass('compact')
    if(!inline) elemContent.addClass('panel-content')

    appendProcessing(id, true);
    insertDetailsData(id);

}
function insertDetailsData(id) {

    let timestamp   = new Date().getTime();
    let elemContent = $('#' + id + '-content');
    let link        = elemContent.attr('data-link');
    let requests    = [ $.get('/plm/details', { 'link' : link, 'timestamp' : timestamp }) ];
    let sections    = null;
    let fields      = null;

    $('#' + id + '-content').hide();
    $('#' + id + '-processing').show();

    elemContent.attr('data-timestamp', timestamp).html('');

    for(let workspace of cacheWorkspaces) {
        if(workspace.id === link.split('/')[4]) {
            sections = workspace.sections;
            fields   = workspace.fields;
        }
    }

    if(isBlank(sections)) requests.push($.get('/plm/sections', { 'link' : link }));
    if(isBlank(fields)  ) requests.push($.get('/plm/fields'  , { 'link' : link }));

    Promise.all(requests).then(function(responses) {

        if(responses[0].params.timestamp === $('#' + id + '-content').attr('data-timestamp')) {
            if(responses[0].params.link === $('#' + id + '-content').attr('data-link')) {

                $('#' + id + '-processing').hide();
                elemContent.show();

                let elemParent   = $('#' + id + '-content');
                let data         = responses[0].data;
                let sectionsIn   = settings.details[id].sectionsIn;
                let sectionsEx   = settings.details[id].sectionsEx;
                let fieldsIn     = settings.details[id].fieldsIn;
                let fieldsEx     = settings.details[id].fieldsEx;

                if(responses.length > 1) sections  = responses[1].data;
                if(responses.length > 2) fields    = responses[2].data;

                if(responses.length > 1) {
                    cacheWorkspaces.push({
                        'id'                : responses[0].params.link.split('/')[4],
                        'sections'          : sections,
                        'fields'            : fields,
                        'editableFields'    : null,
                        'bomViews'          : null
                    })
                }

                cacheSections = [];

                console.log(sectionsEx);

                for(let section of sections) {

                    let sectionId   = section.__self__.split('/')[6];
                    let isNew       = true;
                    let className   = 'expanded'

                    console.log(section.name);

                    if(sectionsIn.length === 0 || sectionsIn.includes(section.name)) {
                        if(sectionsEx.length === 0 || !sectionsEx.includes(section.name)) {

                            for(let cacheSection of cacheSections) {
                                if(cacheSection.urn === section.urn) {
                                    isNew = false;
                                    className = cacheSection.className;
                                }
                            }
            
                            if(isNew) {
                                cacheSections.push({
                                    'urn' : section.urn, 'className' : 'expanded'
                                })
                            }
            
                            let elemSection = $('<div></div>').appendTo(elemParent)
                                .attr('data-urn', section.urn)
                                .addClass('section')
                                .addClass(className)
                                .html(section.name)
                                .appendTo(elemParent)
                                .click(function() {
                                    
                                    $(this).next().toggle();
                                    $(this).toggleClass('expanded');
                                    $(this).toggleClass('collapsed');
                
                                    for(let cacheSection of cacheSections) {
                                        if(cacheSection.urn === $(this).attr('data-urn')) {
                                            cacheSection.className = $(this).hasClass('expanded') ? 'expanded' : 'collapsed';
                                        }
                                    }
                
                                });
            
                            let elemFields = $('<div></div>').appendTo(elemParent)
                                .addClass('section-fields')
                                .attr('data-id', sectionId);
            
                            if(className !== 'expanded') elemFields.toggle();
            
                            for(let sectionField of section.fields) {
                
                                let fieldId = sectionField.link.split('/')[8];

                                if(fieldsIn.length === 0 || fieldsIn.includes(fieldId)) {
                                    if(fieldsEx.length === 0 || !sectionsEx.includes(fieldId)) {
                                        if(sectionField.type === 'MATRIX') {
                                            for(let matrix of section.matrices) {
                                                if(matrix.urn === sectionField.urn) {
                                                    for(let matrixFields of matrix.fields) {
                                                        for(let matrixField  of matrixFields) {
                                                            if(matrixField !== null) {
                                                                for(let wsField of fields) {
                                                                    if(wsField.urn === matrixField.urn)
                                                                    insertDetailsField(id, wsField, data, elemFields);
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        } else {
                                            for(let wsField of fields) {
                                                if(wsField.urn === sectionField.urn)
                                                    insertDetailsField(id, wsField, data, elemFields);
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

                insertItemDetailsDone(id, data, sections, fields);

            }
        }
    });

}
function insertDetailsDone(id, data, sections, fields) {}
function insertDetailsField(id, field, data, elemFields) {

    let hideComputed  = settings.details[id].hideComputed;
    let hideReadOnly  = settings.details[id].hideReadOnly;
    let hideLabels    = settings.details[id].hideLabels;
    let suppressLinks = settings.details[id].suppressLinks;
    let editable      = settings.details[id].editable;

    if(field.visibility === 'NEVER') return;
    if((field.editability === 'NEVER') && hideReadOnly) return;
    if(field.formulaField  && hideComputed) return;

    let value    = null;
    let urn      = field.urn.split('.');
    let fieldId  = urn[urn.length - 1];
    let readonly = (!editable || field.editability === 'NEVER' || (field.editability !== 'ALWAYS' && (typeof itemData === 'undefined')) || field.formulaField);

    let elemField = $('<div></div').addClass('field');
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
            elemValue.addClass('string');
            elemValue.append(elemInput);
            if(value !== null) elemInput.val(value);
            break;

        case 'Single Line Text':
            if(field.formulaField) {
                elemValue.addClass('computed');
                elemValue.addClass('no-scrollbar');
                elemValue.html($('<div></div>').html(value).text());
            } else {
                if(value !== null) elemInput.val(value);
                if(field.fieldLength !== null) {
                    elemInput.attr('maxlength', field.fieldLength);
                    elemInput.css('max-width', field.fieldLength * 8 + 'px');
                }
                elemValue.addClass('string');
                elemValue.append(elemInput);
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
            elemValue.addClass('integer');
            elemValue.append(elemInput);
            if(value !== null) elemInput.val(value);
            break;
            
        case 'Float':
        case 'Money':
            elemValue.addClass('float');
            elemValue.append(elemInput);
            if(value !== null) elemInput.val(value);
            break;

        case 'Date':
            elemInput.attr('type', 'date');
            elemValue.addClass('date');
            elemValue.append(elemInput);
            if(value !== null) elemInput.val(value);
            break;
            
        case 'Check Box':
            elemInput.attr('type', 'checkbox');
            elemValue.addClass('checkbox');
            elemValue.append(elemInput);
            if(value !== null) if(value === 'true') elemInput.attr('checked', true);
            break;

        case 'Single Selection':
            if(editable) {
                elemInput = $('<select>');
                elemValue.addClass('picklist');
                elemValue.append(elemInput);
                let elemOptionBlank = $('<option></option>');
                    elemOptionBlank.attr('value', null);
                    elemOptionBlank.appendTo(elemInput);
                getOptions(elemInput, field.picklist, fieldId, 'select', value);
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
                            elemOption.addClass('field-multi-picklist-item');
                            elemOption.html(optionValue.title);
                            elemOption.appendTo(elemValue);
                            elemOption.click(function() { openItemByLink($(this).attr('data-link')); });
                    }
                }
            }
            break;

        case 'Filtered':
            if(editable) {
                
                elemValue.addClass('filtered-picklist');
                elemValue.append(elemInput);
                elemInput.attr('data-filter-list', field.picklist);
                elemInput.attr('data-filter-field', field.picklistFieldDefinition.split('/')[8]);
                elemInput.addClass('filtered-picklist-input');
                elemInput.click(function() {
                    getFilteredPicklistOptions($(this));
                });
                
                if(value !== null) elemInput.val(value);
                
                let elemList = $('<div></div>');
                    elemList.addClass('filtered-picklist-options');
                    elemList.appendTo(elemValue);
                
                let elemIcon = $('<div></div>');
                    elemIcon.addClass('icon');
                    elemIcon.addClass('icon-close');
                    elemIcon.addClass('xxs');
                    elemIcon.appendTo(elemValue);
                    elemIcon.click(function() {
                        clearFilteredPicklist($(this));
                    });

            } else {
                elemValue = $('<div></div>');
                elemValue.addClass('string');
                elemValue.addClass('link');
                if(value !== null) {
                    elemValue.html(value.title);
                    if(field.type.link === '/api/v3/field-types/23') {
                        elemValue.attr('onclick', 'openItemByURN("' + value.urn + '")');
                        elemValue.attr('data-item-link', value.link);
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

                getOptions(elemInput, field.picklist, fieldId, 'select', value);

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
            getImage(elemValue, value);
            break;

        case 'Radio Button':
            if(editable) {
                elemValue = $('<div></div>');
                elemValue.addClass('radio');
                getOptions(elemValue, field.picklist, fieldId, 'radio', value);
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

        let elemText = $('<div></div>');
            elemText.addClass('field-unit');
            elemText.html(field.unitOfMeasure);
            elemText.appendTo(elemValue);

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


// Insert attachments as tiles or table
function insertAttachments(link, params) {

    if(isBlank(link)) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let id           = 'attachments';    // id of DOM element where the attachments will be inseerted
    let header       = true;             // Hide header with setting this to false
    let headerLabel  = 'Attachments';    // Set the header text
    let headerToggle = false;            // Enable header toggles
    let reload       = false;            // Enable reload button for the attachments list
    let download     = true;             // Enable file download
    let upload       = false;            // Enable file uploads
    let uploadLabel  = 'Upload File';    // File upload button label
    let layout       = 'tiles';          // Content layout (tiles, list or table)
    let inline       = false;            // Display the attachments inline with other elements
    let size         = 'm';              // layout size (xxs, xs, s, m, l, xl, xxl)
    let fileVersion  = true;             // Display version of each attachment
    let fileSize     = true;             // Display size of each attachment
    let extensionsIn = '';               // Defines list of file extensions to be included ('.pdf,.doc')
    let extensionsEx = '';               // Defines list of file extensions to be excluded ('.dwf,.dwfx')
    let split        = false;

    if( isBlank(params)            )       params = {};
    if(!isBlank(params.id)          )           id = params.id;
    if(!isBlank(params.header)      )       header = params.header;
    if(!isBlank(params.headerLabel) )  headerLabel = params.headerLabel;
    if(!isBlank(params.headerToggle)) headerToggle = params.headerToggle;
    if(!isBlank(params.reload)      )       reload = params.reload;
    if(!isBlank(params.download)    )     download = params.download;
    if(!isBlank(params.upload)      )       upload = params.upload;
    if(!isBlank(params.layout)      )       layout = params.layout;
    if(!isBlank(params.inline)      )       inline = params.inline;
    if(!isBlank(params.size)        )         size = params.size;
    if(!isBlank(params.fileVersion) )  fileVersion = params.fileVersion;
    if(!isBlank(params.fileSize)    )     fileSize = params.fileSize;
    if(!isBlank(params.extensionsIn)) extensionsIn = params.extensionsIn;
    if(!isBlank(params.extensionsEx)) extensionsEx = params.extensionsEx;
    if(!isBlank(params.split)       )        split = params.split;
    
    if(params.hasOwnProperty('uploadLabel') ) uploadLabel = params.uploadLabel;

    let timestamp = new Date().getTime();

    let elemParent = $('#' + id)
        .addClass('attachments')
        .attr('data-link', link)
        .attr('data-timestamp', timestamp)
        .html('');

    settings.attachments[id] = {};
    settings.attachments[id].fileVersion  = fileVersion;
    settings.attachments[id].fileSize     = fileSize;
    settings.attachments[id].split        = split;
    settings.attachments[id].download     = download;
    settings.attachments[id].extensionsIn = (extensionsIn === '') ? [] : extensionsIn.split(',');
    settings.attachments[id].extensionsEx = (extensionsEx === '') ? [] : extensionsEx.split(',');

    if(header) {

        let elemHeader = $('<div></div>', {
            id : id + '-header'
        }).appendTo(elemParent).addClass('panel-header');

        if(headerToggle) {

            $('<div></div>').appendTo(elemHeader)
                .addClass('panel-header-toggle')
                .addClass('icon')
                .addClass('icon-collapse');

            elemHeader.addClass('with-toggle');
            elemHeader.click(function() {
                togglePanelHeader($(this));
            });

        }

        $('<div></div>').appendTo(elemHeader)
            .addClass('panel-title')
            .attr('id', id + '-title')
            .html(headerLabel);

        let elemToolbar = $('<div></div>')
            .addClass('panel-toolbar')
            .attr('id', id + '-toolbar');

        if(reload) {

            elemToolbar.appendTo(elemHeader);
            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-refresh')
                .attr('id', id + '-reload')
                .attr('title', 'Reload this list')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    fileUploadDone(id);
                });

        }

        if(upload) {

            elemToolbar.appendTo(elemHeader);

            let elemUpload = $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('icon-upload')
                .addClass('disabled')
                .attr('id', id + '-upload')
                .attr('title', uploadLabel)
                .html(uploadLabel)
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    clickAttachmentsUpload($(this));
                });

            if(isBlank(uploadLabel)) {
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

    } else { elemParent.addClass('no-header'); }
    
    appendProcessing(id, false);
    appendNoDataFound(id, 'icon-no-data', 'No attachments');

    let elemContent  = $('<div></div>').appendTo(elemParent)
        .attr('id', id + '-list')
        .addClass('attachments-list')
        .addClass('no-scrollbar')
        .addClass(layout);

    if(!inline) elemContent.addClass('panel-content')
    if(!isBlank(size)) elemContent.addClass(size);

    $('#' + id + '-no-data').hide();

    if(download) {
        if($('#frame-download').length === 0) {
            $('<frame>').appendTo($('body'))
                .attr('id', 'frame-download')
                .attr('name', 'frame-download')
                .css('display', 'none');
        }  
    }

    insertAttachmentsData(id, timestamp, link, false);  

}
function getFileGrahpic(attachment) {

    let elemGrahpic = $("<div class='attachment-graphic'></div>");

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
function insertAttachmentsData(id, timestamp, link, update) {

    let payload = {
        'link'      : link,
        'timestamp' : timestamp
    }

    let elemList    = $('#' + id + '-list');      
    let elemUpload  = $('#' + id + '-upload');
    let isTable     = elemList.hasClass('table');

    if(!update) elemList.html(''); 
    if(elemUpload.length > 0) elemUpload.addClass('disabled');

    let requests = [
        $.get('/plm/attachments', payload),
        $.get('/plm/permissions', { 'link': link })
    ];

    $('#' + id + '-list').hide();
    $('#' + id + '-processing').show();

    Promise.all(requests).then(function(responses) {

             if(responses[0].data.statusCode === 403) return;
        else if(responses[0].data.statusCode === 404) return;

        if(responses[0].params.timestamp === $('#' + id).attr('data-timestamp')) {
            if(responses[0].params.link === link) {

                $('#' + id + '-processing').hide();

                let attachments = responses[0].data;
                let currentIDs  = [];

                elemList.find('.attachment').each(function() {

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

                for(let attachment of attachments) {

                    if(currentIDs.indexOf(attachment.id) > -1) continue;

                    let extension = attachment.type.extension;
                    let included  = true;

                    if(settings.attachments[id].extensionsIn.length > 0) {
                        if(settings.attachments[id].extensionsIn.indexOf(extension) < 0) included = false;
                    }
                    if(settings.attachments[id].extensionsEx.length > 0) {
                        if(settings.attachments[id].extensionsEx.indexOf(extension) !== -1) included = false;
                    }

                    if(!included) continue;

                    let date = new Date(attachment.created.timeStamp);

                    let elemAttachment = $('<div></div>').appendTo(elemList)
                        .addClass('attachment')
                        .addClass('tile')
                        .attr('data-file-id', attachment.id)
                        .attr('data-url', attachment.url)
                        .attr('data-file-link', attachment.selfLink)
                        .attr('data-extension', attachment.type.extension);

                    if(update) {
                        elemAttachment.addClass('highlight');
                        elemAttachment.prependTo(elemList);
                    } else {
                        elemAttachment.appendTo(elemList);
                    }

                    getFileGrahpic(attachment).appendTo(elemAttachment);

                    let elemAttachmentDetails = $('<div></div>').appendTo(elemAttachment)
                        .addClass('attachment-details');

                    let elemAttachmentName = $('<div></div>').appendTo(elemAttachmentDetails)
                        .addClass('attachment-name');

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
                        .addClass('attachment-summary');

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
                        .addClass('attachment-user')
                        .addClass('nowrap')
                        .html('Created by ' + attachment.created.user.title);

                    $('<div></div>').appendTo(elemAttachmentSummary)
                        .addClass('attachment-date')
                        .addClass('nowrap')
                        .html( date.toLocaleString());

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
                            });
                        }
                    }

                }

                if(elemList.children('.attachment').length === 0) $('#' + id + '-no-data').css('display', 'flex');
                                                             else $('#' + id + '-no-data').hide();

                if(hasPermission(responses[1].data, 'add_attachments')) {
                    if(elemUpload.length > 0) elemUpload.removeClass('disabled');
                }

                let mode = (elemList.hasClass('table')) ? 'block' : 'flex';
                elemList.css('display', mode);
                
                if(isTable) {
                    let elemTable = $('<div></div').appendTo(elemList)
                    .addClass('attachments-table');
                    $('.attachment').appendTo(elemTable);
                }
                
                insertAttachmentsDone(id, responses[0], update);

            }
        }

    });

}
function insertAttachmentsDone(id, data, update) {}
function clickAttachmentsUpload(elemClicked) {

    if(elemClicked.hasClass('disabled')) return;

    let id          = elemClicked.attr('id').split('-upload')[0];
    let elemParent  = $('#' + id);
    let link        = elemParent.attr('data-link');

    let urlUpload = '/plm/upload/';
        urlUpload += link.split('/')[4] + '/';
        urlUpload += link.split('/')[6];

    $('#uploadForm').attr('action', urlUpload);   
    $('#select-file').val('');
    $('#select-file').click();

}
function selectFileForUpload(id) {

    if($('#select-file').val() === '') return;

    $('#' + id + '-list').hide();
    $('#' + id + '-processing').show();
    $('#' + id + '-no-data').hide();
    
    $('#uploadForm').submit();

}
function fileUploadDone(id) {

    let timestamp   = new Date().getTime();
    let elemParent  = $('#' + id);
    let link        = elemParent.attr('data-link');

    elemParent.attr('data-timestamp', timestamp);

    insertAttachmentsData(id, timestamp, link, true);

}



// Insert BOM tree with selected controls
function insertBOM(link , params) {

    //  Set defaults for optional parameters
    // --------------------------------------
    let id              = 'bom';     // id of DOM element where the BOM will be inseerted
    let title           = 'BOM';     // Title being shown on top of the BOM display
    let bomViewName     = '';        // Name of the BOM view in PLM to use (if no value is provided, the first view will be used)
    let collapsed       = false;     // When enabled, the BOM will be collapsed at startup
    let multiSelect     = false;     // Enables selection of multiple items and adds buttons to select / deselect all elements as well as checkboxes
    let deselect        = true;      // Adds button to deselect selected element (not available if multiSelect is enabled)
    let reset           = false;     // Reset the BOM view to its default layout
    let openInPLM       = true;      // Adds button to open selected element in PLM
    let goThere         = false;     // Adds button to open the same view for the selected element
    let toggles         = true;      // Enables expand all / collapse all buttons on top of BOM
    let views           = false;     // Adds drop down menu to select from the available PLM BOM views
    let search          = true;      // Adds quick filtering using search input on top of BOM
    let position        = true;      // When set to true, the position / find number will be displayed
    let quantity        = false;     // When set to true, the quantity column will be displayed
    let hideDetails     = true;      // When set to true, detail columns will be skipped, only the descriptor will be shown
    let headers         = true;      // When set to false, the table headers will not be shown
    let counters        = true;      // When set to true, a footer will inidicate total items, selected items and filtered items
    let revisionBias    = 'release'; // Set BOM configuration to expand [release, working, changeOrder, allChangeOrder]
    let depth           = 10;        // BOM Levels to expand
    let showRestricted  = true;      // When set to true, red lock icons will be shown if an item's BOM contains items that are not accessilbe for the user due to access permissions
    let selectItems     = {};
    let getFlatBOM      = false;     // Retrieve Flat BOM at the same time (i.e. to get total quantities)


    if(isBlank(link)) return;
    if(isBlank(params)) params = {};

    if(!isBlank(params.id)              )             id = params.id;
    if(!isEmpty(params.title)           )          title = params.title;
    if(!isBlank(params.bomViewName)     )    bomViewName = params.bomViewName;
    if(!isBlank(params.collapsed)       )      collapsed = params.collapsed;
    if(!isBlank(params.multiSelect)     )    multiSelect = params.multiSelect;
    if(!isBlank(params.deselect)        )       deselect = params.deselect;
    if(!isBlank(params.reset)           )          reset = params.reset;
    if(!isBlank(params.openInPLM)       )      openInPLM = params.openInPLM;
    if(!isBlank(params.goThere)         )        goThere = params.goThere;
    if(!isBlank(params.toggles)         )        toggles = params.toggles;
    if(!isBlank(params.views)           )          views = params.views;
    if(!isBlank(params.search)          )         search = params.search;
    if(!isBlank(params.position)        )       position = params.position;
    if(!isBlank(params.quantity)        )       quantity = params.quantity;
    if(!isBlank(params.hideDetails)     )  { hideDetails = params.hideDetails } else { hideDetails = ((bomViewName === '') && (views === false)); }
    if(!isBlank(params.headers)         )      { headers = params.headers } else { headers = !hideDetails; }
    if(!isBlank(params.counters)        )       counters = params.counters;
    if(!isBlank(params.revisionBias)    )   revisionBias = params.revisionBias;
    if(!isBlank(params.depth)           )          depth = params.depth;
    if(!isBlank(params.showRestricted)  ) showRestricted = params.showRestricted;
    if(!isBlank(params.selectItems)     )    selectItems = params.selectItems;
    if(!isBlank(params.getFlatBOM)      )     getFlatBOM = params.getFlatBOM;

    let elemBOM = $('#' + id);
        elemBOM.attr('data-link', link);
        elemBOM.attr('data-select-mode', (multiSelect) ? 'multi' : 'single');
        elemBOM.addClass('bom');
        elemBOM.html('');

    settings.bom[id] = {};
    settings.bom[id].collapsed          = collapsed;
    settings.bom[id].position           = position;
    settings.bom[id].quantity           = quantity;
    settings.bom[id].hideDetails        = hideDetails;
    settings.bom[id].revisionBias       = revisionBias;
    settings.bom[id].depth              = depth;
    settings.bom[id].showRestricted     = showRestricted;
    settings.bom[id].selectItems        = selectItems;
    settings.bom[id].endItemFieldId     = null;
    settings.bom[id].endItemValue       = null;
    settings.bom[id].getFlatBOM         = getFlatBOM;
    settings.bom[id].fieldURNPartNumber = '';
    settings.bom[id].fieldURNQuantity   = '';
    settings.bom[id].fieldURNEndItem    = '';

    if(!isBlank(params.endItem)) {
        if(!isBlank(params.endItem.fieldId)) settings.bom[id].endItemFieldId = params.endItem.fieldId;
        if(!isBlank(params.endItem.value  )) settings.bom[id].endItemValue   = params.endItem.value;
    }

    let elemHeader = $('<div></div>').appendTo(elemBOM)
        .addClass('panel-header')
        .attr('id', id + '-header');

    $('<div></div>').appendTo(elemHeader)
        .addClass('panel-title')
        .attr('id', id + '-title')
        .html(title);

    let elemToolbar = $('<div></div>').appendTo(elemHeader)
        .addClass('panel-toolbar')
        .attr('id', id + '-toolbar');

    if(multiSelect) {

        $('<div></div>').appendTo(elemToolbar)
            .addClass('button')
            .addClass('icon')
            .addClass('icon-select-all')
            .addClass('xs')
            .attr('id', id + '-select-all')
            .attr('title', 'Select all')
            .click(function() {
                clickBOMSelectAll($(this));
            });

        $('<div></div>').appendTo(elemToolbar)
            .addClass('button')
            .addClass('icon')
            .addClass('icon-deselect-all')
            .addClass('xs')
            .addClass('bom-multi-select-action')
            .attr('id', id + '-deselect-all')
            .attr('title', 'Deselect all')
            .click(function() {
                clickBOMDeselectAll($(this));
            });
    
    } else if(deselect) {

        $('<div></div>').appendTo(elemToolbar)
            .addClass('button')
            .addClass('icon')
            .addClass('icon-deselect')
            .addClass('xs')
            .addClass('bom-single-select-action')
            .attr('id', id + '-deselect')
            .attr('title', 'Deselect BOM item')
            .hide()
            .click(function() {
                clickBOMDeselectAll($(this));
            });

    }

    if(openInPLM) {

        $('<div></div>').appendTo(elemToolbar)
            .addClass('button')
            .addClass('icon')
            .addClass('icon-open')
            .addClass('xs')
            .addClass('bom-open-in-plm')
            .addClass('bom-single-select-action')
            .attr('title', 'Open the selected item in PLM')
            .click(function() {
                clickBOMOpenInPLM($(this));
            });

    }

    if(goThere) {

        $('<div></div>').appendTo(elemToolbar)
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

    if(toggles) {

        $('<div></div>').appendTo(elemToolbar)
            .addClass('button')
            .addClass('icon')
            .addClass('xs')
            .attr('id', id + '-action-expand-all')
            .attr('title', 'Expand all BOM tree nodes')
            .html('unfold_more')
            .click(function() {
                clickBOMExpandAll($(this));
            });

        $('<div></div>').appendTo(elemToolbar)
            .addClass('button')
            .addClass('icon')
            .addClass('xs')
            .attr('id', id + '-action-collapse-all')
            .attr('title', 'Collapse all BOM tree nodes')
            .html('unfold_less')
            .click(function() {
                clickBOMCollapseAll($(this));
            });

    }

    let elemSelect = $('<select></select>').appendTo(elemToolbar)
        .addClass('bom-view-selector')
        .addClass('button')
        .attr('id', id + '-view-selector')
        .hide()
        .change(function() {
            changeBOMView(id);
        });

    if(search) {

        let elemSearch = $('<div></div>').appendTo(elemToolbar)
            .addClass('button')
            .addClass('with-icon')
            .addClass('icon-search-list');

        $('<input></input>').appendTo(elemSearch)
            .attr('placeholder', 'Search')
            .attr('id', id + '-search-input')
            .addClass('bom-search-input')
            .keyup(function() {
                searchInBOM(id, $(this));
            });

    }

    if(reset) {

        $('<div></div>').appendTo(elemToolbar)
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

    $('<div></div>').appendTo(elemBOM)
        .attr('id', id + '-processing')
        .addClass('processing')
        .append($('<div class="bounce1"></div>'))
        .append($('<div class="bounce2"></div>'))
        .append($('<div class="bounce2"></div>'));

    let elemContent = $('<div></div>').appendTo(elemBOM)
        .addClass('panel-content')
        .addClass('bom-content')
        .attr('id', id + '-content');

    let elemBOMTable = $('<table></table').appendTo(elemContent)
        .addClass('bom-table')
        .addClass('fixed-header')
        .attr('id', id + '-table');

    let elemBOMTableHead = $('<thead></thead>').appendTo(elemBOMTable)
        .addClass('bom-thead')
        .attr('id', id + '-thead');

    if(!headers) elemBOMTableHead.hide();

    $('<tbody></tbody>').appendTo(elemBOMTable)
        .attr('id', id + '-tbody')
        .addClass('bom-tbody');

    let elemBOMCounters = $('<div></div>').appendTo(elemBOM)
        .attr('id', id + '-bom-counters')
        .addClass('bom-counters')
        .hide();

    if(counters) {

        $('<div></div>').appendTo(elemBOMCounters)
            .attr('id', id + '-bom-counter-total')
            .addClass('bom-counter-total');
        
        $('<div></div>').appendTo(elemBOMCounters)
            .attr('id', id + '-bom-counter-unique')
            .addClass('bom-counter-unique');
        
        $('<div></div>').appendTo(elemBOMCounters)
            .attr('id', id + '-bom-counter-filtered')
            .addClass('bom-counter-filtered');
        
        $('<div></div>').appendTo(elemBOMCounters)
            .attr('id', id + '-bom-counter-selected')
            .addClass('bom-counter-selected');      

    } else elemBOM.addClass('no-bom-counters');

    insertBOMDone(id);

    let bomViews        = null;
    let fields          = null
    let requests        = [];

    for(let workspace of cacheWorkspaces) {
        if(workspace.id === link.split('/')[4]) {
            bomViews        = workspace.bomViews;
            fields          = workspace.fields;
        }
    }

    if(isBlank(bomViews)) requests.push($.get('/plm/bom-views-and-fields', { 'link' : link }));
    if(isBlank(fields))   if(!hideDetails) requests.push($.get('/plm/fields', { 'wsId' : link.split('/')[4] }))

    Promise.all(requests).then(function(responses) {

        for(let response of responses) {
            if(response.url.indexOf('/bom-views-and-fields') === 0) {
                bomViews = response.data;
            } else if(response.url.indexOf('/fields') === 0) {
                fields = response.data;
            }
        }

        if(responses.length > 0) {

            let addToCache = true;

            for(let workspace of cacheWorkspaces) {
                if(workspace.id === link.split('/')[4]) {
                    workspace.bomViews  = bomViews;
                    if(!hideDetails) {
                        workspace.fields = fields;
                    }
                    addToCache = false;
                }
            }

            if(addToCache) {
                cacheWorkspaces.push({
                    'id'        : link.split('/')[4],
                    'sections'  : null,
                    'fields'    : fields,
                    'bomViews'  : bomViews
                });
            }

        }

        for(let bomView of bomViews) {

            $('<option></option>').appendTo(elemSelect)
                .html(bomView.name)
                .attr('value', bomView.id);

            if(!isBlank(bomViewName)) {
                if(bomView.name === bomViewName) {
                    elemSelect.val(bomView.id);
                }
            }

        }

        if(views) elemSelect.show();

        changeBOMView(id);

    });

}
function insertBOMDone(id) {}
function changeBOMView(id) {

    let elemBOM             = $('#' + id);
    let link                = elemBOM.attr('data-link');
    let bomViewId           = $('#' + id + '-view-selector').val();
    let elemProcessing      = $('#' + id + '-processing');
    let elemBOMTableBody    = $('#' + id + '-tbody');
    let selectedItems       = [];
    let bomView;

    elemProcessing.show();
    elemBOMTableBody.html('');

    settings.bom[id].indexEdge = 0;

    let params = {
        'link'          : link,
        'depth'         : settings.bom[id].depth,
        'revisionBias'  : settings.bom[id].revisionBias,
        'viewId'        : bomViewId
    }

    for(let workspace of cacheWorkspaces) {
        if(workspace.id === link.split('/')[4]) {
            for(view of workspace.bomViews) {
                if(view.id === Number(bomViewId)) bomView = view;
            }
        }
    }

    for(let field of bomView.fields) {

        let urnField = field.__self__.urn;

        switch(field.fieldId) {
            
            case config.viewer.fieldIdPartNumber        : settings.bom[id].fieldURNPartNumber  = urnField; break;
            case 'QUANTITY'                             : settings.bom[id].fieldURNQuantity    = urnField; break;
            case settings.bom[id].endItemFieldId        : settings.bom[id].fieldURNEndItem     = urnField; break;
            case settings.bom[id].selectItems.fieldId   : settings.bom[id].fieldURNSelectItems = urnField; break;

        }

    }

    let requests = [$.get('/plm/bom', params)];

    if(settings.bom[id].getFlatBOM) requests.push($.get('/plm/bom-flat', params));

    Promise.all(requests).then(function(responses) {

        setBOMHeaders(id, bomView.fields);
        insertNextBOMLevel(id, elemBOMTableBody, responses[0].data, responses[0].data.root, 1, selectedItems, bomView.fields);
        enableBOMToggles(id);
        updateBOMCounters(id);

        if(settings.bom[id].collapsed) clickBOMCollapseAll($('#' + id + '-toolbar'));

        if(!elemBOM.hasClass('no-bom-counters')) { $('#' + id + '-bom-counters').show(); }

        if(settings.bom[id].getFlatBOM) changeBOMViewDone(id, bomView.fields, responses[0].data, selectedItems, responses[1].data);
        else                            changeBOMViewDone(id, bomView.fields, responses[0].data, selectedItems, []);
        
        elemProcessing.hide();

    });

}
function changeBOMViewDone(id, fields, bom, selectedItems, flatBOM) {}
function setBOMHeaders(id, fields) {

    let elemBOMTableHead = $('#'+  id + '-thead');
        elemBOMTableHead.html('');

    let elemBOMTableHeadRow = $('<tr></tr>');
        elemBOMTableHeadRow.appendTo(elemBOMTableHead);

    $('<th></th>').appendTo(elemBOMTableHeadRow).html('').addClass('bom-color');
    $('<th></th>').appendTo(elemBOMTableHeadRow).html('Item');

    if(settings.bom[id].quantity) {
        
        $('<th></th>').appendTo(elemBOMTableHeadRow)
            .html('Qty');
    
    }

    if(settings.bom[id].showRestricted) {
        $('<th></th>').appendTo(elemBOMTableHeadRow).html('').addClass('bom-column-locks');
    }

    if(!settings.bom[id].hideDetails) {
        for(field of fields) {
            $('<th></th>').appendTo(elemBOMTableHeadRow)
                .html(field.displayName)
                .addClass('bom-column-' + field.fieldId.toLowerCase());
        }
    }

}
function insertNextBOMLevel(id, elemTable, bom, parent, parentQuantity, selectedItems, fields) {

    let result    = { hasChildren : false, hasRestricted : false};
    let firstLeaf = true;

    for(let i = settings.bom[id].indexEdge; i < bom.edges.length; i++) {

        let edge = bom.edges[i];

        if(edge.parent === parent) {

            if(i === settings.bom[id].indexEdge + 1) settings.bom[id].indexEdge = i;

            let node;
            let bomQuantity = getBOMEdgeValue(edge, settings.bom[id].fieldURNQuantity, null, 0);

            for(let bomNode of bom.nodes) {
                if(bomNode.item.urn === edge.child) {
                    node = bomNode;
                    break;
                }
            }

            if(typeof node.restricted === 'undefined') {

                node.restricted    = false;
                node.totalQuantity = bomQuantity * parentQuantity;

                for(let field of node.fields) {

                    if('context' in field) {
                        node.restricted = true;
                    }

                    switch(field.metaData.urn) {

                        case settings.bom[id].fieldURNPartNumber:
                            node.partNumber = field.value;
                            break;

                        case settings.bom[id].fieldURNEndItem:
                            node.endItem = field.value;
                            break;

                        case settings.bom[id].fieldURNSelectItems:
                            node.selectItems = field.value.toLowerCase();
                            break;

                    }

                }

            } else node.totalQuantity += bomQuantity * parentQuantity;

            if(node.restricted) {

                result.hasRestricted = true;

            } else {

                result.hasChildren  = true;
                let urnEdgeChild    = edge.child;
                let isEndItem       = false;

                let elemRow = $('<tr></tr>').appendTo(elemTable)
                    .attr('data-number',      edge.itemNumber)
                    .attr('data-part-number', node.partNumber)
                    .attr('data-quantity',    node.quantity)
                    .attr('data-number',      edge.itemNumber)
                    // .attr('data-dmsId',       node.item.link.split('/')[6])
                    .attr('data-link',        node.item.link)
                    .attr('data-urn',         edge.child)
                    .attr('data-title',       node.item.title)
                    .attr('data-edgeId',      edge.edgeId)
                    .attr('data-edge-Link',   edge.edgeLink)
                    .attr('data-level',       edge.depth)
                    .addClass('bom-level-' +  edge.depth)
                    .addClass('bom-item')
                    .click(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        clickBOMItem(e, $(this));
                        toggleBOMItemActions($(this));
                    })
        

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

                if(settings.bom[id].quantity) {

                    $('<td></td>').appendTo(elemRow)
                        .addClass('bom-quantity')
                        .html(bomQuantity);

                }

                let elemCellLocks = $('<td></td>')
                    .addClass('bom-column-icon')
                    .addClass('bom-column-locks');

                if(settings.bom[id].showRestricted) elemCellLocks.appendTo(elemRow);

                if(!settings.bom[id].hideDetails) {
                    for(let field of fields) {

                        let value = ''

                        if(field.fieldTab === 'STANDARD_BOM') value = getBOMEdgeValue(edge, field.__self__.urn, null, '');
                        else value = getBOMCellValue(edge.child, field.__self__.urn, bom.nodes);

                        $('<td></td>').appendTo(elemRow)
                            .html(value)
                            .addClass('bom-column-' + field.fieldId.toLowerCase());

                    }
                }

                if(!isBlank(settings.bom[id].selectItems.values)) {

                    if(settings.bom[id].selectItems.values.indexOf(node.selectItems) > -1) {

                        let selectItem = true;

                        for(let selectedItem of selectedItems) {
                            if(selectedItem.node.item.link === node.item.link) {
                                selectItem = false;
                                break;
                            }
                        }

                        if(selectItem) {
                            selectedItems.push({
                                'node' : node
                            })
                        }

                    }

                }

                if(settings.bom[id].fieldURNEndItem !== '') {
                    isEndItem = (settings.bom[id].endItemValue.toString().toLowerCase() === node.endItem.toString().toLowerCase());
                }

                let itemBOM = (isEndItem) ? { hasChildren : false, hasRestricted : false } : insertNextBOMLevel(id, elemTable, bom, urnEdgeChild, bomQuantity * parentQuantity, selectedItems, fields);

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
                            elemNext.removeClass('bom-hidden');
                            if(e.shiftKey) {
                                elemNext.removeClass('collapsed');
                            }
                        }
                    }
                } else {
                    elemNext.addClass('bom-hidden');
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
function updateBOMCounters(id) {

    let elemBOM     = $('#' + id + '-tbody');
    let counters    = [0, 0, 0, 0];
    let links       = [];

    elemBOM.children('.bom-item').each(function() {
        
        let elemItem = $(this);
        let itemLink = elemItem.attr('data-link');

        counters[0]++;

        if(links.indexOf(itemLink) < 0) {
            counters[1]++;
            links.push(itemLink);
        }

        if(elemItem.hasClass('result')  ) counters[2]++;
        if(elemItem.hasClass('selected')) counters[3]++;

    });

    $('#' + id + '-bom-counter-total'   ).html(counters[0] + ' rows');
    $('#' + id + '-bom-counter-unique'  ).html(counters[1] + ' unique items');

    let elemCounterFiltered = $('#' + id + '-bom-counter-filtered');
    let elemCounterSelected = $('#' + id + '-bom-counter-selected');

    if(counters[2] === 0) {
        elemCounterFiltered.removeClass('not-empty').html(''); 
    } else {
        elemCounterFiltered.addClass('not-empty')
        if(counters[2] === 1) elemCounterFiltered.html(counters[2] + ' item matches');
        else elemCounterFiltered.html(counters[2] + ' items match');
    }
    if(counters[3] === 0) {
        elemCounterSelected.removeClass('not-empty').html(''); 
    } else {
        elemCounterSelected.addClass('not-empty');
        if(counters[3] === 1)elemCounterSelected.html(counters[3] + ' item selected');
        else elemCounterSelected.html(counters[3] + ' items selected');
    }

}
function toggleBOMItemActions(elemClicked) {

    let elemBOM             = elemClicked.closest('.bom');
    let actionsMultiSelect  = elemBOM.find('.bom-multi-select-action');
    let actionsSingleSelect = elemBOM.find('.bom-single-select-action');

    if(elemBOM.find('.bom-item.selected').length === 1) actionsSingleSelect.show(); else actionsSingleSelect.hide();
    if(elemBOM.find('.bom-item.selected').length   > 0)  actionsMultiSelect.show(); else  actionsMultiSelect.hide();

}
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
    updateBOMCounters(elemBOM.attr('id'));

    clickBOMDeselectAllDone(elemClicked);

}
function clickBOMDeselectAllDone(elemClicked) {}
function clickBOMExpandAll(elemClicked) {

    let elemBOM     = elemClicked.closest('.bom');
    let id          = elemBOM.attr('id');
    let elemContent = $('#' + id + '-tbody');
    let elemInput   = $('#' + id + '-search-input');
    let filterValue = elemInput.val().toLowerCase();

    if(!isBlank(filterValue)) {
        searchInBOM(id, elemInput);
    } else {
        elemContent.children().removeClass('bom-hidden').removeClass('collapsed');
    }

}
function clickBOMCollapseAll(elemClicked) {

    let elemBOM     = elemClicked.closest('.bom');
    let id          = elemBOM.attr('id');
    let elemContent = $('#' + id + '-tbody');

    elemContent.children().each(function() {
        if($(this).children('th').length === 0) {
            if(!$(this).hasClass('bom-level-1')) {
                $(this).addClass('bom-hidden');
            }
            if($(this).hasClass('node')) $(this).addClass('collapsed');
        }
    });

}
function searchInBOM(id, elemInput) {

    let elemTable   = $('#' + id + '-tbody');
    let filterValue = elemInput.val().toLowerCase();
    let parents     = [];

    if(filterValue === '') {

        elemTable.children().each(function() {
            $(this).removeClass('bom-hidden').removeClass('result');
        });
        elemTable.children('.node').each(function() {
            $(this).removeClass('collapsed').removeClass('result-parent');
        });

    } else {

        elemTable.children('tr').each(function() {

            let cellValue = $(this).attr('data-title').toLowerCase();
            let matches   = (cellValue.indexOf(filterValue) > -1);
            let level     = Number($(this).attr('data-level'));
            let isNode    = $(this).hasClass('node');
            
            if(level <= parents.length) {
                parents.splice(level - 1);
            }

            if(matches) {
             
                $(this).removeClass('bom-hidden').addClass('result');

                for(let parent of parents) parent.removeClass('bom-hidden').removeClass('collapsed').addClass('result-parent');

            } else {

                $(this).addClass('bom-hidden').removeClass('result').removeClass('result-parent');

            }

            if(isNode) parents.push($(this));

        });

    }

    updateBOMCounters(id);

}
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
    
    if(settings.bom[id].collapsed) {
        clickBOMCollapseAll($('#' + id + '-toolbar'));
    } else {
        clickBOMExpandAll($('#' + id + '-toolbar'));
    }

    $('#' + id + '-search-input').val('');

    toggleBOMItemActions(elemClicked);
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
function clickBOMItem(e, elemClicked) {
    
    let elemBOM    = elemClicked.closest('.bom');
    let selectMode = elemBOM.attr('data-select-mode');

    if(selectMode == 'single') elemClicked.siblings().removeClass('selected');

    elemClicked.toggleClass('selected');

    clickBOMItemDone(e, elemClicked);
    updateBOMCounters(elemBOM.attr('id'));
    
}
function clickBOMItemDone(e, elemClicked) {}
function getBOMItemChhildren(elemClicked) {


    let level     = Number(elemClicked.attr('data-level'));
    let levelNext = level - 1;
    let elemNext  = elemClicked;
    let children  = [];

    do {

        elemNext  = elemNext.next();
        levelNext = Number(elemNext.attr('data-level'));

        if(levelNext > level) {
            children.push(elemNext);
        }

    } while(levelNext > level);

    return children;

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
            result.items.push($(this));
            level = nextLevel;
        }
    });

    return result;

}
function bomDisplayItem(elemItem) {

    let level   = Number(elemItem.attr('data-level'));
    
    expandBOMParents(level - 1, elemItem);
    
    let elemBOM = elemItem.closest('.bom-content');
    let top     = elemItem.position().top - (elemBOM.innerHeight() / 2);
    
    elemBOM.animate({ scrollTop: top }, 500);

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


// Insert Flat BOM with selected controls
function insertFlatBOM(link , params) {

    //  Set defaults for optional parameters
    // --------------------------------------
    let id           = 'flat-bom';  // id of DOM element where the BOM will be inseerted
    let title        = 'Flat BOM';  // Title being shown on top of the BOM display
    let bomViewName  = '';          // BOM view of PLM to display (if no value is provided, the first view will be used)
    let multiSelect  = false;       //  Adds buttons to select / deselect all elements as well as checkboxes
    let openInPLM    = true;        //  Adds button to open selected element in PLM
    let goThere      = false;       //  Adds button to open the same view for the selected element
    let views        = false;       //  Adds drop down menu to select from the available PLM BOM views
    let search       = true;        //  Adds quick filtering using search input on top of BOM
    let position     = true;        //  When set to true, the position / find number will be displayed
    let descriptor   = true;        //  When set to true, the descriptor will be displayed before the table columns
    let quantity     = false;       //  When set to true, the quantity column will be displayed
    let hideDetails  = false;       //  When set to true, detail columns will be skipped, only the descriptor will be shown
    let headers      = true;        //  When set to false, the table headers will not be shown
    let revisionBias = 'release';   // Set BOM configuration to expand [release, working, changeOrder, allChangeOrder]
    let depth        = 10;          // BOM Levels to expand
    let showMore     = false;       //  When set to true, adds controls to access the item details pages for each BOM entry
    let editable     = false;       //  When set to true, enables modifications in editable fields
    let filterEmpty  = false;       //  When set to true, adds filter for rows with empty input cells 
    let classNames   = [];          //  Array of class names that will be assigned to each BOM row (enables specific styling and event listeners)


    if(isBlank(link)) return;
    if(isBlank(params)) params = {};

    if(!isBlank(params.id)          )            id = params.id;
    if(!isEmpty(params.title)       )         title = params.title;
    if(!isBlank(params.bomViewName) )   bomViewName = params.bomViewName;
    if(!isBlank(params.multiSelect) )   multiSelect = params.multiSelect;
    if(!isBlank(params.openInPLM)   )     openInPLM = params.openInPLM;
    if(!isBlank(params.goThere)     )       goThere = params.goThere;
    if(!isBlank(params.views)       )         views = params.views;
    if(!isBlank(params.search)      )        search = params.search;
    if(!isBlank(params.position)    )      position = params.position;
    if(!isBlank(params.descriptor)  )    descriptor = params.descriptor;
    if(!isBlank(params.quantity)    )      quantity = params.quantity;
    if(!isBlank(params.headers)     )       headers = params.headers;
    if(!isBlank(params.revisionBias))  revisionBias = params.revisionBias;
    if(!isBlank(params.depth)       )         depth = params.depth;
    if(!isBlank(params.showMore)    )      showMore = params.showMore;
    if(!isBlank(params.editable)    )      editable = params.editable;
    if(!isBlank(params.filterEmpty) )   filterEmpty = params.filterEmpty;
    if(!isBlank(params.hideDetails) ) { hideDetails = params.hideDetails } else { hideDetails = ((bomViewName === '') && (views === false)); }
    if(!isBlank(params.classNames)  )    classNames = params.classNames;

    let elemBOM = $('#' + id);
        elemBOM.attr('data-link', link);
        elemBOM.attr('data-position', position);
        elemBOM.attr('data-descriptor', descriptor);
        elemBOM.attr('data-quantity', quantity);
        elemBOM.attr('data-editable', editable);
        elemBOM.attr('data-show-more', showMore);
        elemBOM.attr('data-hide-details', hideDetails);
        elemBOM.addClass('flat-bom');
        elemBOM.html('');

    settings.flatBOM[id] = {};
    settings.flatBOM[id].revisionBias   = revisionBias;
    settings.flatBOM[id].depth          = depth;        

    if(!isBlank(classNames)) elemBOM.attr('data-class-names', classNames);

    let elemHeader = $('<div></div>');
        elemHeader.addClass('panel-header');
        elemHeader.attr('id', id + '-header');
        elemHeader.appendTo(elemBOM);

    let elemTitle = $('<div></div>');
        elemTitle.addClass('panel-title');
        elemTitle.attr('id', id + '-title');
        elemTitle.html(title);
        elemTitle.appendTo(elemHeader);

    let elemToolbar = $('<div></div>');
        elemToolbar.addClass('panel-toolbar');
        elemToolbar.attr('id', id + '-toolbar');
        elemToolbar.appendTo(elemHeader);


    $('<div></div>').appendTo(elemToolbar)
        .addClass('button') 
        .addClass('with-icon') 
        .addClass('icon-filter') 
        .addClass('flat-bom-counter') 
        .html('0 rows selected')
        .hide()
        .click(function() {
            $(this).toggleClass('selected');
            filterFlatBOMByCounter($(this));
        });

    if(multiSelect) {

        $('<div></div>').appendTo(elemToolbar)
            .addClass('button')
            .addClass('icon')
            .addClass('icon-select-all')
            .addClass('xs')
            .attr('id', id + '-select-all')
            .attr('title', 'Select all')
            .click(function() {
                clickFlatBOMSelectAll($(this));
            });

            $('<div></div>').appendTo(elemToolbar)
            .addClass('button')
            .addClass('icon')
            .addClass('icon-deselect-all')
            .addClass('xs')
            .addClass('flat-bom-multi-select-action')
            .attr('id', id + '-deselect-all')
            .attr('title', 'Deselect all')
            .click(function() {
                clickFlatBOMDeselectAll($(this));
            });

    }

    if(openInPLM) {

        $('<div></div>').appendTo(elemToolbar)
            .addClass('button')
            .addClass('icon')
            .addClass('icon-open')
            .addClass('xs')
            .addClass('flat-bom-open-in-plm')
            .addClass('flat-bom-single-select-action')
            .attr('title', 'Open the selected item in PLM')
            .click(function() {
                clickFlatBOMOpenInPLM($(this));
            });

    }

    if(goThere) {

        $('<div></div>').appendTo(elemToolbar)
            .addClass('button')
            .addClass('icon')
            .addClass('icon-go-there')
            .addClass('xs')
            .addClass('flat-bom-go-there')
            .addClass('flat-bom-single-select-action')
            .attr('title', 'Open this view for the selected item')
            .click(function() {
                clickFlatBOMGoThere($(this));
            });

    }

    if(editable) {

        let elemSave = $('<div></div>');
            elemSave.addClass('button');
            elemSave.addClass('default');
            elemSave.html('Save');
            elemSave.hide();
            elemSave.attr('id', id + '-save');
            elemSave.appendTo(elemToolbar);
            elemSave.click(function() {
                clickFlatBOMSave($(this));
            });

        if(filterEmpty) {
            
            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-filter-empty')
                .addClass('flat-bom-filter-empty')
                .attr('title', 'Focus on rows having inputs without values')
                .click(function() {
                    clickFlatBOMFilterEmpty($(this));
                });

        }

    }

    let elemSelect = $('<select></select>').appendTo(elemToolbar)
        .addClass('flat-bom-view-selector')
        .addClass('button')
        .attr('id', id + '-view-selector')
        .hide()
        .change(function() {
            changeFlatBOMView(id);
        });

    if(search) {

        let elemSearch = $('<div></div>');
            elemSearch.addClass('button');
            elemSearch.addClass('with-icon');
            elemSearch.addClass('icon-search-list');
            elemSearch.appendTo(elemToolbar);

        let elemSearchInput = $('<input></input>');
            elemSearchInput.attr('placeholder', 'Search');
            elemSearchInput.attr('data-id', id);
            elemSearchInput.addClass('flat-bom-search-input')
            elemSearchInput.appendTo(elemSearch);
            elemSearchInput.keyup(function() {
                searchInFlatBOM(id, $(this));
            });

    }

    let elemProcessing = $('<div></div>');
        elemProcessing.attr('id', id + '-processing');
        elemProcessing.addClass('processing');
        elemProcessing.append($('<div class="bounce1"></div>'));
        elemProcessing.append($('<div class="bounce2"></div>'));
        elemProcessing.append($('<div class="bounce2"></div>'));
        elemProcessing.appendTo(elemBOM);
    
    let elemContent = $('<div></div>');
        elemContent.addClass('panel-content');
        elemContent.attr('id', id + '-content');
        elemContent.appendTo(elemBOM);

    let elemBOMTable = $('<table></table>');
        elemBOMTable.addClass('flat-bom-table');
        elemBOMTable.addClass('fixed-header');
        elemBOMTable.attr('id', id + '-table');
        elemBOMTable.appendTo(elemContent);

    let elemBOMTableHead = $('<thead></thead>').appendTo(elemBOMTable)
        .addClass('flat-bom-thead')
        .attr('id', id + '-thead');

    if(!headers) elemBOMTableHead.hide();

    $('<tbody></tbody>').appendTo(elemBOMTable)
        .addClass('flat-bom-tbody')
        .attr('id', id + '-tbody');


    insertFlatBOMDone(id);

    let bomViews        = null;
    let fields          = null
    let editableFields  = null;
    let requests        = [];
    let addToCache      = true;

    for(let workspace of cacheWorkspaces) {
        if(workspace.id === link.split('/')[4]) {
            bomViews        = workspace.bomViews;
            fields          = workspace.fields;
            editableFields  = workspace.editableFields;
            addToCache      = false;
        }
    }

    if(isBlank(bomViews)) requests.push($.get('/plm/bom-views-and-fields', { 'link' : link }));
    if(isBlank(fields))   if(!hideDetails) requests.push($.get('/plm/fields', { 'wsId' : link.split('/')[4] }))

    Promise.all(requests).then(function(responses) {

        for(let response of responses) {
            if(response.url.indexOf('/bom-views-and-fields') === 0) {
                bomViews = response.data;
            } else if(response.url.indexOf('/fields') === 0) {
                fields = response.data;
               // editableFields = getEditableFields(fields);
            }
        }

        // if(responses.length > 0) {
        //     for(let workspace of cacheWorkspaces) {
        //         if(workspace.id === link.split('/')[4]) {
        //             workspace.bomViews           = bomViews;
        //             if(!hideDetails) {
        //                 workspace.fields         = fields;
        //                 workspace.editableFields = editableFields;
        //             }
        //             addToCache                  = false;
        //         }
        //     }
        // }

        if(addToCache) {
            cacheWorkspaces.push({
                'id'                : link.split('/')[4],
                'sections'          : null,
                'fields'            : fields,
                // 'editableFields'    : editableFields,
                'editableFields'    : [],
                'bomViews'          : bomViews
            });
        } else if(responses.length > 0) {
            for(let workspace of cacheWorkspaces) {
                if(workspace.id === link.split('/')[4]) {
                    workspace.bomViews           = bomViews;
                    if(!hideDetails) {
                        workspace.fields         = fields;
                        // workspace.editableFields = editableFields;
                    }
                    addToCache                  = false;
                }
            }
        }

        for(let bomView of bomViews) {

            let elemOption = $('<option></option>');
                elemOption.html(bomView.name);
                elemOption.attr('value', bomView.id);
                elemOption.appendTo(elemSelect);

            if(!isBlank(bomViewName)) {
                if(bomView.name === bomViewName) {
                    elemSelect.val(bomView.id);
                }
            }

        }

        if(views) elemSelect.show();

        changeFlatBOMView(id);

    });

}
function insertFlatBOMDone(id) {}
function clickFlatBOMSave(elemButton) {

    console.log('clickFlatBOMSave');

    $('#overlay').show();

    let elemTable = elemButton.closest('.flat-bom');

    $.get('/plm/sections', { 'link' : elemTable.attr('data-link') }, function(response) {
        saveFlatBOMChanges(elemButton, response.data);
    });


}
function saveFlatBOMChanges(elemButton, sections) {

    console.log('saveFlatBOMChanges');

    let elemTable   = elemButton.closest('.flat-bom');
    let listChanges = elemTable.find('.flat-bom-item.changed')

    if(listChanges.length === 0) {

        elemButton.hide();
        saveFlatBOMChangesDone();

    } else {

        let requests = [];
        let elements = [];

        listChanges.each(function() {

            if(requests.length < requestsLimit) {

                let elemItem = $(this);

                let params = { 
                    'link'     : elemItem.attr('data-link'),
                    'sections' : []
                };      
        
                console.log(elemItem.children('.changed'));

                elemItem.children('.changed').each(function() {
                    // let elemField = getFieldValue($(this));
                    // console.log(elemField);
                    // addFieldToPayload(params.sections, sections, null, elemField.fieldId, elemField.value, false);
                    // addFieldToPayload(params.sections, sections, null, elemField.fieldId, elemField.value, false);
                    addFieldToPayload(params.sections, sections, $(this), null, null, false);
                });

                console.log(params);

                requests.push($.get('/plm/edit', params));
                elements.push(elemItem);

            }

        });

        Promise.all(requests).then(function(responses) {

            for(element of elements) {
                element.removeClass('changed');
                element.children().removeClass('changed');
            }
            saveFlatBOMChanges(elemButton, sections);

        });

    }


}
function saveFlatBOMChangesDone() {
    $('#overlay').hide();
}
function clickFlatBOMFilterEmpty(elemClicked) {

    elemClicked.toggleClass('selected');

    let elemFlatBOM = elemClicked.closest('.flat-bom');
    let id          = elemFlatBOM.attr('id');
    let elemTBody   = $('#' + id + '-tbody');

    if(elemClicked.hasClass('selected')) {

        elemTBody.children().show();

        elemTBody.children().each(function() {

            let elemRow = $(this);
            let hide    = true;

            elemRow.find('input').each(function() {
                if($(this).val() === '') hide = false;
            });
            elemRow.find('select').each(function() {
                if($(this).val() === '') hide = false;
            });

            if(hide) elemRow.hide();
            
        });

    } else {
        elemTBody.children().show();
    }

    clickFlatBOMFilterEmptyDone(elemClicked);

}
function clickFlatBOMFilterEmptyDone(elemClicked) {}
function changeFlatBOMView(id) {

    let elemBOM             = $('#' + id);
    let position            = (elemBOM.attr('data-position'    ).toLowerCase() === 'true');
    let descriptor          = (elemBOM.attr('data-descriptor'  ).toLowerCase() === 'true');
    let quantity            = (elemBOM.attr('data-quantity'    ).toLowerCase() === 'true');
    let editable            = (elemBOM.attr('data-editable'    ).toLowerCase() === 'true');
    let showMore            = (elemBOM.attr('data-show-more'   ).toLowerCase() === 'true');
    let hideDetails         = (elemBOM.attr('data-hide-details').toLowerCase() === 'true');
    let classNames          = elemBOM.attr('data-class-names');
    let link                = elemBOM.attr('data-link');
    let bomViewId           = $('#' + id + '-view-selector').val();
    let elemProcessing      = $('#' + id + '-processing');
    let elemBOMTableBody    = $('#' + id + '-tbody');

    if(isBlank(classNames)) classNames = [];

    elemProcessing.show();
    elemBOMTableBody.html('');

    let params = {
        'link'          : link,
        'depth'         : settings.flatBOM[id].depth,
        'revisionBias'  : settings.flatBOM[id].revisionBias,
        'viewId'        : bomViewId
    }

    let editableFields     = [];
    let fieldURNPartNumber = '';
    let bomView;

    for(let workspace of cacheWorkspaces) {
        if(workspace.id === link.split('/')[4]) {
            editableFields = workspace.editableFields;
            if(!isBlank(workspace.bomViews)) {
                for(let view of workspace.bomViews) {
                    if(view.id === Number(bomViewId)) bomView = view;
                }
            }
        }
    }

    sortArray(bomView.fields, 'displayOrder', 'integer');

    let requests = [$.get('/plm/bom-flat', params)];

    for(let field of bomView.fields) {
        if(field.fieldId === config.viewer.fieldIdPartNumber) fieldURNPartNumber = field.__self__.urn;
        if(editable) {
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

        setFlatBOMHeaders(id, position, descriptor, quantity, editable, showMore, hideDetails, bomView.fields)

        let count    = 1;
        let response = responses[0];

        for(let i = 1; i < responses.length; i++) {
            let isNew = true;
            for(let picklist of cachePicklists) {
                if(picklist.link === responses[i].params.link) {
                    isNew = false;
                    continue;
                }
            }
            if(isNew) {
                cachePicklists.push({
                    'link' : responses[i].params.link,
                    'data' : responses[i].data
                })
            }
        }

        let editableFields = [];

        for(item of response.data) {

            let itemLink    = item.item.link;
            let title       = item.item.title;
            let qty         = Number(item.totalQuantity).toFixed(2);
            let partNumber  = getFlatBOMCellValue(response.data, itemLink, fieldURNPartNumber, 'title');
    
            if(partNumber === '') partNumber = title.split(' - ')[0];

            let elemRow = $('<tr></tr>');
                elemRow.addClass('flat-bom-item');
                elemRow.appendTo(elemBOMTableBody);
                elemRow.attr('data-link', item.item.link);
                elemRow.attr('data-title', item.item.title);
                elemRow.attr('data-part-number', partNumber);
                elemRow.click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    clickFlatBOMItem(e, $(this));
                    toggleFlatBOMItemActions($(this));
                    // updateFlatBOMCounter($(this).closest('.flat-bom'));
                });

            for(className of classNames) elemRow.addClass(className);

            if(editable) {

                $('<td></td>').appendTo(elemRow)
                    .html('<div class="icon icon-check-box xxs"></div>')
                    .addClass('flat-bom-check')
                    .click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        clickFlatBOMCheckbox(e, $(this));
                        updateFlatBOMCounter($(this).closest('.flat-bom'));
                    });

                editableFields = getEditableFields(bomView.fields);

            }

            if(position  ) $('<td></td>').appendTo(elemRow).addClass('flat-bom-number').html(count++);
            if(descriptor) $('<td></td>').appendTo(elemRow).addClass('flat-bom-descriptor').html(title);                
            if(quantity  ) $('<td></td>').appendTo(elemRow).addClass('flat-bom-qty').html(qty);

            if(!hideDetails) {

                for(field of bomView.fields) {

                    let value       = getFlatBOMCellValue(response.data, itemLink, field.__self__.urn, 'title');
                    let isEditable  = false;
                    let elemRowCell = $('<td></td>');

                    elemRowCell.appendTo(elemRow); 
                    elemRowCell.addClass('flat-bom-column-' + field.fieldId.toLowerCase());

                    for(let editableField of editableFields) {

                        if(field.fieldId === editableField.id) {

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

                                switch (editableField.type) {
        
                                    case 'Single Selection':
                                        value = getFlatBOMCellValue(response.data, itemLink, field.__self__.urn, 'link');
                                        elemControl.val(value);
                                        break;
        
                                    default:
                                        elemControl.val(value);
                                        break;
        
                                }
        
                                isEditable = true;
                            }
        
                        }
        
                    }

                    if(!isEditable) elemRowCell.html($('<div></div>').html(value).text());

                }
            }

            if(showMore) {

                let elemRowActions = $('<td></td>');
                    elemRowActions.addClass('flat-bom-actions');
                    elemRowActions.appendTo(elemRow);

                let elemShowMore = $('<span></span>');
                    elemShowMore.addClass('flat-bom-show-more');
                    elemShowMore.addClass('icon');
                    elemShowMore.addClass('icon-chevron-right');
                    elemShowMore.appendTo(elemRowActions);
                    elemShowMore.click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        clickFlatBOMShowMore($(this));
                    });

            }

        }

        elemProcessing.hide();
        changeFlatBOMViewDone(id);

    });

}
function changeFlatBOMViewDone(id) {}
function searchInFlatBOM(id, elemInput) {

    let elemTable   = $('#' + id + '-tbody');
    let filterValue = elemInput.val().toLowerCase();

    elemTable.children('tr').removeClass('result');

    if(filterValue === '') {

        elemTable.children().each(function() {
            $(this).show();
        });

    } else {

        elemTable.children().each(function() {
            $(this).hide();
        });

        elemTable.children().each(function() {

            let elemRow = $(this);
            let unhide  = false;

            elemRow.children().each(function() {

                if($(this).children('.image').length === 0) {
        
                    let text = $(this).html().toLowerCase();
        
                    if($(this).children('input').length === 1) text = $(this).children('input').val().toLowerCase();
                    else if($(this).children('textarea').length === 1) text = $(this).children('textarea').val().toLowerCase();
        
                    if(text.indexOf(filterValue) > -1) {
        
                        unhide = true;
        
                    }
                }
        
            });

            if(unhide) elemRow.show();

        });

    }

}
function setFlatBOMHeaders(id, position, descriptor, quantity, editable, showMore, hideDetails, fields) {

    let elemBOMTableHead = $('#'+  id + '-thead');
        elemBOMTableHead.html('');

    let elemBOMTableHeadRow = $('<tr></tr>');
        elemBOMTableHeadRow.appendTo(elemBOMTableHead);

    if(editable) {

        let elemBOMTableHeadCheck = $('<th></th>');
            elemBOMTableHeadCheck.html('<div id="' + id + '-select-all" class="flat-bom-select-all icon icon-check-box xxs"></div>');
            elemBOMTableHeadCheck.appendTo(elemBOMTableHeadRow);
            elemBOMTableHeadCheck.click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                clickSelectAllFlatBOM($(this));
            });

    }

    if(position  ) $('<th></th>').appendTo(elemBOMTableHeadRow).addClass('flat-bom-number').html('Nr');
    if(descriptor) $('<th></th>').appendTo(elemBOMTableHeadRow).addClass('flat-bom-descriptor').html('Item');
    if(quantity  ) $('<th></th>').appendTo(elemBOMTableHeadRow).addClass('flat-bom-qty').html('Qty');

    if(!hideDetails) {

        for(field of fields) {
            let elemBOMTableHeadCell = $('<th></th>');
                elemBOMTableHeadCell.html(field.displayName);
                elemBOMTableHeadCell.addClass('flat-bom-column-' + field.fieldId.toLowerCase());
                elemBOMTableHeadCell.appendTo(elemBOMTableHeadRow);   
                
            if('displayLength' in field) {
                // elemBOMTableHeadCell.css('max-width', field.displayLength + 'ch');
                // elemBOMTableHeadCell.css('min-width', field.displayLength + 'ch');
                // elemBOMTableHeadCell.css(    'width', field.displayLength + 'ch');
            }

        }

    }

    if(showMore) {

        let elemBOMTableHeadShowMore = $('<th></th>');
            elemBOMTableHeadShowMore.html('');
            elemBOMTableHeadShowMore.appendTo(elemBOMTableHeadRow);

    }

}
function clickSelectAllFlatBOM(elemClicked) {

    let elemCheckbox = elemClicked.children();
        elemCheckbox.toggleClass('icon-check-box');
        elemCheckbox.toggleClass('icon-check-box-checked');

    let elemTable = elemClicked.closest('table');

    if(elemCheckbox.hasClass('icon-check-box')) elemTable.find('.flat-bom-item').removeClass('selected');
    else elemTable.find('.flat-bom-item').addClass('selected');

    clickSelectAllFlatBOMDone(elemClicked);

}
function clickSelectAllFlatBOMDone(elemClicked) {}
function clickFlatBOMItem(e, elemClicked) {

    elemClicked.toggleClass('selected').siblings().removeClass('selected');

    clickFlatBOMItemDone(e, elemClicked);

}
function clickFlatBOMItemDone(e, elemClicked) {}
function clickFlatBOMCheckbox(e, elemClicked) {

    elemClicked.closest('.flat-bom-item').toggleClass('selected');
    toggleFlatBOMItemActions(elemClicked);
    clickFlatBOMCheckboxDone(e, elemClicked);

}
function clickFlatBOMCheckboxDone(e, elemClicked) {}
function clickFlatBOMShowMore(elemClicked) {

    let elemItem        = elemClicked.closest('.bom-item');

    $('#bom-list').addClass('invisible');
    $('#bom-item-details').removeClass('invisible');
    $('#button-bom-reset').hide();
    $('#button-bom-back').removeClass('hidden');
    $('#bom-item-details-header').html(elemItem.attr('data-title'));
    $('#bom-item-details-sections').html('');

    insertItemDetailsFields(elemItem.attr('data-link'), 'bom-item-details',  null, null, null, false, false, false);

}
function changedFlatBOMValue(elemControl) {

    let elemBOM = elemControl.closest('.flat-bom');
    let id      = elemBOM.attr('id');
    let index   = elemControl.parent().index();
    let value   = elemControl.val();

    $(id + '-save').show();

    elemControl.parent().addClass('changed');
    elemControl.closest('tr').addClass('changed');

    $('#' + id + '-save').show();

    $('.flat-bom-item.selected').each(function() {
        $(this).addClass('changed');
        $(this).children().eq(index).addClass('changed');
        $(this).children().eq(index).children().first().val(value);
    });

}
function toggleFlatBOMItemActions(elemClicked) {

    let elemBOM             = elemClicked.closest('.flat-bom');
    let actionsMultiSelect  = elemBOM.find('.flat-bom-multi-select-action');
    let actionsSingleSelect = elemBOM.find('.flat-bom-single-select-action');

    if(elemBOM.find('.flat-bom-item.selected').length === 1) actionsSingleSelect.show(); else actionsSingleSelect.hide();
    if(elemBOM.find('.flat-bom-item.selected').length   > 0) actionsMultiSelect.show();  else actionsMultiSelect.hide();

}
function clickFlatBOMSelectAll(elemClicked) {

    let elemBOM = elemClicked.closest('.flat-bom');

    elemBOM.find('.flat-bom-item').addClass('selected');

    updateFlatBOMCounter(elemBOM);
    toggleFlatBOMItemActions(elemClicked);
    clickFlatBOMSelectAllDone(elemClicked);

}
function clickFlatBOMSelectAllDone(elemClicked) {}
function clickFlatBOMDeselectAll(elemClicked) {

    let elemBOM     = elemClicked.closest('.flat-bom');
    let elemCounter = elemClicked.siblings('.flat-bom-counter');

    elemBOM.find('.flat-bom-item').removeClass('selected');
    elemCounter.removeClass('selected');

    updateFlatBOMCounter(elemBOM);
    toggleFlatBOMItemActions(elemClicked);
    clickFlatBOMDeselectAllDone(elemClicked);

}
function clickFlatBOMDeselectAllDone(elemClicked) {}
function updateFlatBOMCounter(elemBOM) {

    console.log('updateFlatBOMCounter');

    let count       = elemBOM.find('.flat-bom-item.selected').length;
    let elemCounter = elemBOM.find('.flat-bom-counter');

    elemCounter.html(count + ' rows selected');

    if(count > 0) {
        elemCounter.show(); 
    } else {
        // elemCounter.hide();
        elemCounter.removeClass('filter-selected');
    }

    filterFlatBOMByCounter(elemCounter);

}
function filterFlatBOMByCounter(elemCounter, enforce) {

    if(isBlank(enforce)) enforce = false;

    let elemBOM   = elemCounter.closest('.flat-bom');
    let elemTBody = elemBOM.find('tbody');

    if((elemCounter).hasClass('selected')) {
        elemTBody.children().hide();
        elemTBody.children('.selected').show();
        
    } else {
        elemTBody.children().show();
    }

    if(enforce) elemTBody.children().show();

}
function clickFlatBOMOpenInPLM(elemClicked) {

    let elemBOM   = elemClicked.closest('.flat-bom');
    let elemItem  = elemBOM.find('.flat-bom-item.selected').first();
    
    openItemByLink(elemItem.attr('data-link'));

}
function clickFlatBOMGoThere(elemClicked) {

    let elemBOM   = elemClicked.closest('.flat-bom');
    let elemItem  = elemBOM.find('.flat-bom-item.selected').first();

    if(elemItem.length > 0) {
        
        let link        = elemItem.attr('data-link').split('/');
        let location    = document.location.href.split('?');
        let params      = location[1].split('&');

        let url = location[0] + '?';

        for(param of params) {
            if(param.toLowerCase().indexOf('dmsid=') === 0) {
                url += '&dmsid=' + link[6];
            } else url += '&' + param;
        }

        document.location.href = url;

    } 

}



// Insert Where Used immediate parents
function insertParents(link, id, icon, enableExpand) {

    if(isBlank(link         )) return;
    if(isBlank(id           ))           id = 'parents';
    if(isBlank(icon         ))         icon = 'account_tree';
    if(isBlank(enableExpand )) enableExpand = false;

    let timestamp = new Date().getTime();

    let elemList = $('#' + id + '-list');
        elemList.attr('data-timestamp', timestamp);
        elemList.html('');

    let elemProcessing = $('#' + id + '-processing')
        elemProcessing.show();

    let params = {
        'link'      : link,
        'depth'     : 1,
        'timestamp' : timestamp
    }

    $.get('/plm/where-used', params, function(response) {

        if(response.params.timestamp === $('#' + id + '-list').attr('data-timestamp')) {
            if(response.params.link === link) {
        
                elemProcessing.hide();

                for(let edge of response.data.edges) {

                    let urnParent = edge.child;
                    let quantity  =  0;

                    for(let node of response.data.nodes) {

                        console.log(urnParent);
                        console.log(node.item.urn);

                        if(urnParent === node.item.urn){ 

                            console.log('hier');

                            for(field of node.fields) {
                                if(field.title === 'QUANTITY') quantity = field.value;
                            }

                            let elemTile = genTile(node.item.link, '', '', icon, node.item.title, 'Quantity: ' + quantity);
                                elemTile.appendTo(elemList);
                                elemTile.addClass('parent');
                                elemTile.click(function(e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    clickParentItem($(this));
                                });

                            if(enableExpand) {

                                let elemToggle = $('<div></div>');
                                    elemToggle.addClass('icon');
                                    elemToggle.addClass('icon-expand');
                                    elemToggle.addClass('tile-toggle');
                                    elemToggle.prependTo(elemTile);
                                    elemToggle.click(function(e) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        clickParentItemToggle(id, $(this));
                                    });
                                    
                            }

                        }
                    }
                }

                if(response.data.totalCount === 0) {
                    $('<div>No parents found</div>').appendTo(elemList)
                        .css('margin', 'auto');
                }

                insertParentsDone(id);

            }     
        }

    });
    
}
function insertParentsDone(id) {}
function clickParentItem(elemClicked) { openItemByLink(elemClicked.attr('data-link')); }
function clickParentItemToggle(id, elemClicked) { 

    let elemParent = elemClicked.closest('.tile');
        elemParent.toggleClass('expanded');

    if(elemParent.hasClass('expanded')) {

        if(elemParent.nextUntil('.parent').length === 0) {
        
        let linkParent  = elemParent.attr('data-link');
        let idBOM       = 'bom-' + linkParent.split('/')[6];
        let elemBOM     = $('<div></div>');
        
        elemBOM.attr('id', idBOM);
        elemBOM.addClass('child');
        elemBOM.insertAfter(elemParent);
        
        insertBOM(linkParent, {
            'id'        : idBOM,
            'title'     : '',
            'toggles'   : true,
            'search'    : true
        });

        } else {
            elemParent.nextUntil('.parent').show();
        }

    } else {
        
        elemParent.nextUntil('.parent').hide();

    }

}


// Insert Where Used root items
function insertRoots(link, id, icon) {

    if(isBlank(link)) return;
    if(isBlank(id)  ) id   = 'roots';
    if(isBlank(icon)) icon = 'account_tree';

    let timestamp = new Date().getTime();

    let elemList = $('#' + id + '-list');
        elemList.attr('data-timestamp', timestamp);
        elemList.html('');
        elemList.hide();

    let elemProcessing = $('#' + id + '-processing')
        elemProcessing.show();

    let params = {
        'link'      : link,
        'depth'     : 10,
        'timestamp' : timestamp
    }

    let elemTable = $('<table></table>');
        elemTable.attr('id', '#' + id + '-table');
        elemTable.appendTo(elemList);

    let elemTHead = $('<thead></thead>');
        elemTHead.attr('id', '#' + id + '-thead');
        elemTHead.appendTo(elemTable);

    let elemTHeadRow = $('<tr></tr>');
        elemTHeadRow.append('<th>Top Level Item</th>');
        elemTHeadRow.append('<th>Status</th>');
        elemTHeadRow.append('<th>Quantity</th>');
        elemTHeadRow.append('<th>Hierarchy</th>');
        elemTHeadRow.appendTo(elemTHead);

    let elemTBody = $('<tbody></tbody>');
        elemTBody.attr('id', '#' + id + '-tbody');
        elemTBody.appendTo(elemTable);

    $.get('/plm/where-used', params, function(response) {
    
        if(response.params.timestamp === $('#' + id + '-list').attr('data-timestamp')) {
            if(response.params.link === link) {
    
                elemList.show();
                elemProcessing.hide();

                if(isBlank(response.data.edges)) return;

                for(edge of response.data.edges) {
        
                    if(!edge.hasOwnProperty('edgeLink')) {
        
                        let urn = edge.child;
        
                        for(node of response.data.nodes) {
        
                            if(urn === node.item.urn) {
        
                                let lifecycle = '';
                                let quantity  = '';
        
                                for(field of node.fields) {
                                         if(field.title === 'QUANTITY' ) quantity  = field.value;
                                    else if(field.title === 'LIFECYCLE') lifecycle = field.value;
                                }
        
                                let elemItem = $('<td></td>');
                                    elemItem.html(node.item.title);
                                    elemItem.attr('data-link', node.item.link);
                                    elemItem.addClass('roots-item');
                                    elemItem.click(function(e) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        clickRootItem($(this));
                                    });
        
                                let elemChildren = $('<td></td>');

                                let elemRow = $('<tr></tr>');
                                    elemRow.append(elemItem);
                                    elemRow.append('<td class="roots-lifecycle">' + lifecycle + '</td>');
                                    elemRow.append('<td class="roots-quantity">' + quantity + '</td>');
                                    elemRow.append(elemChildren);
                                    elemRow.appendTo(elemTable);
                                    elemRow.attr('data-urn', node.item.urn);
        
                                getRootChildren(elemChildren, response.data.edges, response.data.nodes, node.item.urn, 1);
        
                            }
                        }
                    }
                }
            }           
        }           
    });
    
}
function getRootChildren(elemChildren, edges, nodes, parent, level) {

    for(edge of edges) {

        if(parent === edge.child) {

            let elemParent = $('<div></div>');
                elemParent.addClass('roots-parent');

            let elemParentPath = $('<div></div>');
                elemParentPath.addClass('roots-parent-path');
                elemParentPath.appendTo(elemParent);
                
            for(let i = level - 1; i > 0; i--) { elemParentPath.append('<span class="icon roots-parent-path-icon">trending_flat</span>'); }

            for(node of nodes) {
                if(parent === node.item.urn) {
                    elemParent.attr('data-urn', node.item.urn);
                    elemParent.attr('data-link', node.item.link);
                    elemParentPath.append(node.item.title);
                    elemParent.click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        clickRootsPathItem($(this));
                    });
                }
            }

            elemChildren.append(elemParent);
            getRootChildren(elemChildren, edges, nodes, edge.parent, level+1);

        }

    }

}
function clickRootItem(elemClicked) { openItemByLink(elemClicked.attr('data-link')); }
function clickRootsPathItem(elemClicked) { openItemByLink(elemClicked.attr('data-link')); }


// Insert BOM children which are new or have been changed
function insertChildrenChanged(link, id, wsIdChangeProcess, icon) {


    console.log('insertChildrenChanged');
    console.log(link);

    if(isBlank(link)) return;
    if(isBlank(wsIdChangeProcess)) return;
    if(isBlank(icon)) icon = 'settings';

    console.log(wsIdChangeProcess);

    $.get('/plm/related-items', { 'link' : link, 'relatedWSID' : wsIdChangeProcess }, function(response) {

        console.log(response);

        if(response.params.link  !== link) return;

        let elemList  = $('#' + id);
            elemList.html('');

        for(relatedItem of response.data) {

            let elemTile = genTile(relatedItem.link, '', '', icon, relatedItem.title);
                elemTile.appendTo(elemList);
                elemTile.click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    clickChildrenChangedItem($(this));
            });
                
        }

        insertChildrenChangedDone(id);
        
    });

}
function insertChildrenChangedDone(id) {}
function clickChildrenChangedItem(elemClicked) {}



// Insert Grid table
function insertGrid(link, params) {

    if(isBlank(link)) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let id                  = 'grid';   // ID of the DOM element where the history should be inserted
    let header              = true;     // Can be used to suppress addition of the panel header element
    let headerLabel         = 'Grid';   // Set the header label
    let headerToggle        = false;    // Enable header toggles
    let reload              = true;     // Enable reload button for the history panel
    let rotate              = false;    // Rotate the table display by 90 degrees
    let inline              = false;    // Display the grid inline with other elements
    let columnsIn           = [];       // Define list of columns to include by fieldId; columns not included in this list will not be shown at all. Keep empty to show all columns.
    let columnsEx           = [];       // Define list of columns to exclude by fieldId; columns in this list will not be shown at all. Keep empty to show all columns.

    if( isBlank(params)             )       params = {};
    if(!isBlank(params.id)          )           id = params.id;
    if(!isBlank(params.header)      )       header = params.header;
    if(!isBlank(params.headerLabel) )  headerLabel = params.headerLabel;
    if(!isBlank(params.headerToggle)) headerToggle = params.headerToggle;
    if(!isBlank(params.reload)      )       reload = params.reload;
    if(!isBlank(params.rotate)      )       rotate = params.rotate;
    if(!isBlank(params.inline)      )       inline = params.inline;
    if(!isBlank(params.columnsIn)   )    columnsIn = params.columnsIn;
    if(!isBlank(params.columnsEx)   )    columnsEx = params.columnsEx;

    settings.workflowHistory[id]           = {};
    settings.workflowHistory[id].rotate    = rotate;
    settings.workflowHistory[id].columnsIn = columnsIn;
    settings.workflowHistory[id].columnsEx = columnsEx;

    let elemParent = $('#' + id)
        .addClass('grid')
        .html('');

    if(header) {
        
        let elemHeader = genPanelHeader(id, headerToggle, headerLabel);
            elemHeader.appendTo(elemParent);   

        if(reload) {

            let elemToolbar = $('<div></div>').appendTo(elemHeader)
                .addClass('panel-toolbar')
                .attr('id', id + '-toolbar');

            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-refresh')
                .attr('id', id + '-reload')
                .attr('title', 'Reload this view')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    insertGridData(id);
                });

        }
    }

    let elemContent = $('<div></div>').appendTo(elemParent)
        .attr('id', id + '-content')
        .attr('data-link', link)
        .addClass('grid-content')
        .addClass('no-scrollbar');

    if(!inline) elemContent.addClass('panel-content')

    appendProcessing(id, true);
    appendNoDataFound(id, 'icon-no-data', 'No Data');

    insertGridData(id);

}
function insertGridData(id) {

    $('#' + id + '-processing').show();

    let elemContent = $('#' + id + '-content');
    let link        = elemContent.attr('data-link');
    let requests    = [
        $.get('/plm/grid', { 'link' : link }),
        $.get('/plm/grid-columns', { 'wsId' : link.split('/')[4] })
    ];

    elemContent.html('');

    Promise.all(requests).then(function(responses) {

        let fields      = responses[1].data.fields;
        let columnsIn   = settings.workflowHistory[id].columnsIn;
        let columnsEx   = settings.workflowHistory[id].columnsEx;
        let columns     = [];

        for(let field of fields) {
            let fieldId = field.__self__.split('/').pop();
            if(columnsIn.length === 0 || columnsIn.includes(fieldId)) {
                if(columnsEx.length === 0 || !columnsEx.includes(fieldId)) {
                    columns.push(field);
                }
            }
        }

        $('#' + id + '-processing').hide();

        if(responses[0].data.length > 0 ) {

            let elemTable       = $('<table></table>').appendTo(elemContent).addClass('grid')
            let elemTableBody   = $('<tbody></tbody>').appendTo(elemTable);
            let elemTableHead   = $('<tr></tr>').appendTo(elemTableBody).addClass('fixed')

            if(!settings.workflowHistory[id].rotate) {

                elemTable.addClass('row-hovering');
                elemTable.addClass('fixed-header');

                for(let column of columns) {
                    $('<th></th>').appendTo(elemTableHead).html(column.name);
                }

                for(row of responses[0].data) {

                    let elemTableRow = $('<tr></tr>').appendTo(elemTableBody)
                        .click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            clickGridRow($(this), e);
                        });

                    for(let field of row.rowData) {
                        if(field.title === 'Row Id') {
                            elemTableRow.attr('data-link', field.__self__);
                        }
                    }

                    for(let column of columns) {

                        let fieldId = column.__self__.split('/').pop();
                        let value   = getGridRowValue(row, fieldId, '', 'title');

                        $('<td></td>').appendTo(elemTableRow).html(value);
                    }

                }

            } else {

                elemTable.addClass('rotated');

                for(let column of columns) {

                    let elemTableRow = $('<tr></tr>').appendTo(elemTableBody)
                        .click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            clickGridRow($(this), e);
                        });

                    $('<th></th>').appendTo(elemTableRow).html(column.name);

                    for(let row of responses[0].data) {

                        let fieldId = column.__self__.split('/').pop();
                        let value   = getGridRowValue(row, fieldId, '', 'title');

                        $('<td></td>').appendTo(elemTableRow).html(value);

                    }

                }

            }

        }

        insertGridDone(id, responses[0].data, responses[1].data);

    });

}
function insertGridDone(id, data, columns) {}
function clickGridRow(elemClicked, e) {}


// Insert related processes
function insertChangeProcesses(link, params) {

    if(isBlank(link)) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let id                  = 'processes';     // ID of the DOM element where the processes list & create form will be inserted
    let header              = true;            // Hide header with setting this to false
    let headerLabel         = 'Processes';     // Sets the header label (if header is enabled)
    let headerToggle        = false;           // Enables collapsing and expanding the panel
    let reload              = true;            // Enable reload button for the processes list
    let size                = 'l';             // Layout size (xxs, xs, s, m, l, xl, xxl)
    let icon                = 'icon-workflow'; // Icon to be displayed in each tile
    let inline              = false;           // Display the processes list with other elements
    let workspacesIn        = [];              // List of workspace to be included, identified by workspace IDs (example: ['82'])
    let workspacesEx        = [];              // List of workspace to be excluded, identified by workspace ID (example: ['83','84'])
    let createWSID          = '';              // Enable creation of new records by providing the given workspace ID in which new records should be created
    let createSectionsIn    = [];              // If creation of new records is enabled (using parameter createWSID), this list can be used to select the sections to be shown in the create dialog (example: ['Header','Details'])
    let createSectionsEx    = [];              // If creation of new records is enabled (using parameter createWSID), this list can be used to hide sections in the create dialog (example: ['Review'])
    let createFieldsIn      = [];              // If creation of new records is enabled (using parameter createWSID), this list can be used to select the fields to be shown in the create dialog (example: ['Title','Description'])
    let createFieldsEx      = [];              // If creation of new records is enabled (using parameter createWSID), this list can be used to hide fields in the create dialog. Fields of this list will not be shown (example: ['Closing Comment']).


    if( isBlank(params)                 )           params = {};
    if(!isBlank(params.id)              )               id = params.id;
    if(!isBlank(params.header)          )           header = params.header;
    if(!isEmpty(params.headerLabel)     )      headerLabel = params.headerLabel;
    if(!isBlank(params.headerToggle)    )     headerToggle = params.headerToggle;
    if(!isBlank(params.reload)          )           reload = params.reload;
    if(!isBlank(params.size)            )             size = params.size;
    if(!isBlank(params.icon)            )             icon = params.icon;
    if(!isBlank(params.workspacesIn)    )     workspacesIn = params.workspacesIn;
    if(!isBlank(params.workspacesEx)    )     workspacesEx = params.workspacesEx;
    if(!isBlank(params.createWSID)      )       createWSID = params.createWSID;
    if(!isBlank(params.createSectionsIn)) createSectionsIn = params.createSectionsIn;
    if(!isBlank(params.createSectionsEx)) createSectionsEx = params.createSectionsEx;
    if(!isBlank(params.createFieldsIn)  )   createFieldsIn = params.createFieldsIn;
    if(!isBlank(params.createFieldsEx)  )   createFieldsEx = params.createFieldsEx;

    settings.processes[id]                  = {};
    settings.processes[id].icon             = icon;
    settings.processes[id].workspacesIn     = workspacesIn;
    settings.processes[id].workspacesEx     = workspacesEx;
    settings.processes[id].createWSID       = createWSID;
    settings.processes[id].createSectionsIn = createSectionsIn;
    settings.processes[id].createSectionsEx = createSectionsEx;
    settings.processes[id].createFieldsIn   = createFieldsIn;
    settings.processes[id].createFieldsEx   = createFieldsEx;

    let elemParent = $('#' + id).addClass('processes').html('');

    if(header) {
        
        let elemHeader = genPanelHeader(id, headerToggle, headerLabel);
            elemHeader.appendTo(elemParent);   

        let elemToolbar = $('<div></div>').addClass('panel-toolbar').attr('id', id + '-toolbar');

        if(reload) {

            elemToolbar.appendTo(elemHeader);

            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-refresh')
                .attr('id', id + '-reload')
                .attr('title', 'Reload this view')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    insertChangeProcessesData(id);
                });

        }

        if(!isBlank(createWSID)) {

            elemToolbar.appendTo(elemHeader);

            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .attr('id', id + '-create')
                .attr('title', 'Create new process')
                .html('Create')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleProcessCreateForm(id, true);
                });

            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('processes-action-create')
                .attr('id', id + '-cancel')
                .attr('title', 'Cancel process creation')
                .html('Cancel')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleProcessCreateForm(id, false);
                });

            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('processes-action-create')
                .addClass('default')
                .attr('id', id + '-save')
                .attr('title', 'Submit form and create process')
                .html('Save')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    submitProcessCreateForm(id);
                });

            let elemSections = $('<div></div>').appendTo(elemParent)
                .attr('id', id + '-sections')
                .attr('data-wsid', createWSID)
                .attr('data-link', link)
                .addClass('form')
                .addClass('no-scrollbar')
                .addClass(getSurfaceLevel($('body')));

            if(!inline) elemSections.addClass('panel-content')

        }
    }

    let elemList = $('<div></div>').appendTo(elemParent)
        .attr('id', id + '-list')
        .attr('data-link', link)
        .addClass('tiles')
        .addClass('list')
        .addClass(size)
        .addClass(getSurfaceLevel($('body')))
        .addClass('processes-content')
        .addClass('no-scrollbar');

    if(!inline) elemList.addClass('panel-content')

    appendProcessing(id, true);
    appendNoDataFound(id, 'icon-no-data', 'No Processes');
    insertChangeProcessesData(id);

}
function toggleProcessCreateForm(id, visible) {

    let elemToolbar  = $('#' + id + '-toolbar');
    let elemList     = $('#' + id + '-list');
    let elemNoData   = $('#' + id + '-no-data');
    let elemSections = $('#' + id + '-sections');

    if(visible) {

        $('#' + id + '-processing').show();
        
        elemToolbar.children().hide();
        elemToolbar.children('.processes-action-create').show();

        elemSections.html('').show();
        elemList.hide();
        elemNoData.hide();

        insertCreateForm(id, settings.processes[id].createWSID, {
            sectionsIn : settings.processes[id].createSectionsIn,
            sectionsEx : settings.processes[id].createSectionsEx,
            fieldsIn   : settings.processes[id].createFieldsIn,
            fieldsEx   : settings.processes[id].createFieldsEx
        });

    } else {
        
        elemToolbar.children().show();
        elemToolbar.children('.processes-action-create').hide();

        elemSections.hide();

        if(elemList.children().length === 0) {
            elemNoData.show();
        } else {
            elemList.show();
        }

    }

    elemToolbar.show();

    toggleProcessCreateFormDone(id);

}
function toggleProcessCreateFormDone(id) {}
function submitProcessCreateForm(id) {

    if(!validateForm($('#' + id + '-sections'))) return;

    $('#' + id + '-toolbar').hide();
    $('#' + id + '-sections').hide();
    $('#' + id + '-list').hide();
    $('#' + id + '-no-data').hide();
    $('#' + id + '-processing').show();

    viewerCaptureScreenshot(null, function() {

        submitCreateForm(settings.processes[id].createWSID, $('#' + id + '-sections'), 'viewer-markup-image', function(response) {
               
            let link    = $('#' + id + '-list').attr('data-link');
            let newLink = response.data.split('.autodeskplm360.net')[1];
                
            $.get('/plm/add-managed-items', { 'link' : newLink, 'items' : [ link ] }, function(response) {
                toggleProcessCreateForm(id, false)
                createProcessDone(id, response);
            });

        });

    });

}
function createProcessDone(id, reponse) {

    insertChangeProcessesData(id);

}
function insertChangeProcessesData(id) {

    $('#' + id + '-processing').show();
    $('#' + id + '-no-data').hide();

    let timestamp    = new Date().getTime();
    let elemList    = $('#' + id + '-list');
    let link         = elemList.attr('data-link');
    let workspacesIn = settings.processes[id].workspacesIn;
    let workspacesEx = settings.processes[id].workspacesEx;

    elemList.attr('data-timestamp', timestamp)
        .html('')
        .hide();

    let params = {
        'link'      : link,
        'timestamp' : timestamp
    }

    $.get('/plm/changes', params, function(response) {

        if(response.params.link === link) {
            if(response.params.timestamp === $('#' + id + '-list').attr('data-timestamp')) {

                     if(response.data.statusCode === 403) return;
                else if(response.data.statusCode === 404) return;

                $('#' + id + '-processing').hide();

                for(let process of response.data) {
                    process.sort = process['last-workflow-history'].created
                }

                sortArray(response.data, 'sort', 'date', 'descending');

                for(let process of response.data) {

                    let processWSID = process.item.link.split('/')[4];

                    if(workspacesIn.length === 0 || workspacesIn.includes(processWSID)) {
                        if(workspacesEx.length === 0 || !workspacesEx.includes(processWSID)) {

                            let user = process['first-workflow-history'].user.title;
                            let date = process['first-workflow-history'].created;

                            let elemProcess = $('<div></div>').appendTo(elemList)
                                .addClass('animation')
                                .addClass('process')
                                .addClass('tile')
                                .attr('data-link', process.item.link)
                                .attr('data-urn', process.item.urn)
                                .click(function(e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    clickChangeProcess($(this));
                                });
                    
                            $('<div></div>').appendTo(elemProcess).addClass('tile-image');
                    
                            let elemProcessDetails = $('<div></div>').appendTo(elemProcess).addClass('tile-details');
                    
                            $('<div></div>').appendTo(elemProcessDetails).addClass('tile-title');
                            $('<div></div>').appendTo(elemProcessDetails).addClass('tile-subtitle');
                    
                            let elemProcessData = $('<div></div>').appendTo(elemProcessDetails).addClass('tile-data');
                            
                            $('<div></div>').appendTo(elemProcessData).addClass('process-creator');
                            $('<div></div>').appendTo(elemProcessData).addClass('process-status');
                                
                            $.get('/plm/details', { 'link' : process.item.link}, function(response) {
                    
                                $('.process').each(function() {
                                    let elemProcess = $(this);
                                    if(elemProcess.attr('data-link') === process.item.link) {
                        
                                        elemProcess.removeClass('animation');
                        
                                        let linkImage   = getFirstImageFieldValue(response.data.sections);
                                        let elemImage   = elemProcess.find('.tile-image').first();
                        
                                        getImageFromCache(elemImage, { 'link' : linkImage }, settings.processes[id].icon, function() {});
                    
                                        date = date.split('T')[0].split('-');
                                        let creationDate = new Date(date[0], date[1], date[2]);
                        
                                        elemProcess.find('.tile-title').first().html(response.data.title);
                                        elemProcess.find('.tile-subtitle').first().html(response.data.workspace.title);
                                        elemProcess.find('.process-status').first().html('Status : ' + response.data.currentState.title);
                                        elemProcess.find('.process-creator').first().html('Created by ' + user + ' on ' + creationDate.toLocaleDateString());
                        
                                    }
                                });
                            });

                        }
                    }
                }

                if(elemList.children().length === 0) {
                    $('#' + id + '-no-data').css('display', 'flex');
                } else {
                    $('#' + id + '-no-data').hide();
                    elemList.show();
                }

                insertChangeProcessesDone(id, response.data);

            }
        }
    });
    
}
function insertChangeProcessesDone(id, data) {}
function clickChangeProcess(elemClicked, e) { openItemByLink(elemClicked.attr('data-link')); }


// Insert Relationship Items
function insertRelationships(link, id) {

    if(typeof id === 'undefined') id = 'relationships';

    let elemParent = $('#' + id + '-list');
        elemParent.html('');

    $('#' + id + '-processing').show();

    $.get('/plm/relationships', { 'link' : link }, function(response) {
    
        if(response.params.link === link) {
    
            $('#' + id + '-processing').hide();
    
            elemParent.show();

            for(relationship of response.data) {

                let elemTile = genTile(relationship.item.link, '', '', 'link', relationship.item.title, relationship.workspace.title);
                    elemTile.appendTo(elemParent);
                    elemTile.click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        openItemByLink($(this).attr('data-link'));
                    });

            }
    
        }           
    });
    
}


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

}


// Insert managed items
function insertManagedItems(link, id, icon) {

    if(isBlank(link)) return;
    if(isBlank(id)  ) id = 'managed-items';
    if(isBlank(icon)) icon = '';

    let elemParent = $('#' + id + '-list');
        elemParent.html('');

    $('#' + id + '-processing').show();

    $.getJSON('/plm/manages', { 'link' : link }, function(response) {
        
        $('#' + id + '-processing').hide();

        for(affectedItem of response.data) {

            let elemTile = genTile(affectedItem.item.link, '', '', icon, affectedItem.item.title);
                elemTile.appendTo(elemParent);
                elemTile.click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    clickManagedItem($(this));
                });

        }

        insertManagedItemsDone(id);
        
    });

}
function insertManagedItemsDone(id) {}
function clickManagedItem(elemClicked) {}


// Insert Workflow History
function insertWorkflowHistory(link, params) {

    if(isBlank(link)) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let id                  = 'workflow-history';   // ID of the DOM element where the history should be inserted
    let header              = true;                 // Can be used to suppress addition of the panel header element
    let headerLabel         = 'Workflow History';   // Set the header label
    let headerToggle        = false;                // Enable header toggles
    let reload              = true;                 // Enable reload button for the history panel
    let showNextTransitions = true;                 // If set to true, the list of possible next actions will be shown on top of the history entries
    let finalStates         = ['Complete', 'Completed', 'Closed', 'Done'];  // This list may be used to define the final states of workflows. These final states will be shown with a different icon.
    let transitionsIn       = [];                   // List of transitions that will be included in the history log and next transitions list. Transitions not included in this list will not be shown.
    let transitionsEx       = ['Cancel', 'Delete']; // List of transitions that will be excluded in the history log and next transitions list. Transitions included in this list will not be shown.

    if( isBlank(params)                    )              params = {};
    if(!isBlank(params.id)                 )                  id = params.id;
    if(!isBlank(params.header)             )              header = params.header;
    if(!isBlank(params.headerLabel)        )         headerLabel = params.headerLabel;
    if(!isBlank(params.headerToggle)       )        headerToggle = params.headerToggle;
    if(!isBlank(params.reload)             )              reload = params.reload;
    if(!isBlank(params.showNextTransitions)) showNextTransitions = params.showNextTransitions;
    if(!isBlank(params.finalStates)        )         finalStates = params.finalStates;
    if(!isBlank(params.transitionsIn)      )       transitionsIn = params.transitionsIn;
    if(!isBlank(params.transitionsEx)      )       transitionsEx = params.transitionsEx;

    settings.workflowHistory[id]                     = {};
    settings.workflowHistory[id].showNextTransitions = showNextTransitions;
    settings.workflowHistory[id].finalStates         = finalStates;
    settings.workflowHistory[id].transitionsIn       = transitionsIn;
    settings.workflowHistory[id].transitionsEx       = transitionsEx;

    let elemParent = $('#' + id)
        .addClass('workflow-history')
        .html('');

    if(header) {

        let elemHeader = $('<div></div>', {
            id : id + '-header'
        }).appendTo(elemParent).addClass('panel-header');
    
        if(headerToggle) {
    
            $('<div></div>').appendTo(elemHeader)
                .addClass('panel-header-toggle')
                .addClass('icon')
                .addClass('icon-collapse');
    
            elemHeader.addClass('with-toggle');
            elemHeader.click(function() {
                togglePanelHeader($(this));
            });
    
        }

        $('<div></div>').appendTo(elemHeader)
            .addClass('panel-title')
            .attr('id', id + '-title')
            .html(headerLabel);

        if(reload) {

            let elemToolbar = $('<div></div>').appendTo(elemHeader)
                .addClass('panel-toolbar')
                .attr('id', id + '-toolbar');

            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-refresh')
                .attr('id', id + '-reload')
                .attr('title', 'Reload this view')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    insertWorkflowHistoryData(id);
                });

        }

    }

    if(!header) { elemParent.addClass('no-header'); }

    appendProcessing(id, true);

    $('<div></div>').appendTo(elemParent)
        .attr('id', id + '-content')
        .attr('data-link', link)
        .addClass('panel-content')
        .addClass('workflow-history-content')
        .addClass('no-scrollbar');

    insertWorkflowHistoryData(id);

}

function insertWorkflowHistoryData(id) {

    $('#' + id + '-processing').show();

    let elemContent = $('#' + id + '-content');
    let link        = elemContent.attr('data-link');
    let requests    = [ 
        $.get('/plm/workflow-history', { 'link' : link }),
        $.get('/plm/details', { 'link' : link })
    ];

    elemContent.html('');

    if(settings.workflowHistory[id].showNextTransitions) requests.push($.get('/plm/transitions', { 'link' : link }));

    Promise.all(requests).then(function(responses) {

        $('#' + id + '-processing').hide();

        let index         = 1;
        let transitionsIn = settings.workflowHistory[id].transitionsIn;
        let transitionsEx = settings.workflowHistory[id].transitionsEx;
        let currentStatus = responses[1].data.currentState.title;

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
                        .addClass('workflowh-history-event');

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

        insertWorkflowHistoryDone(id, responses[0].data, responses[1].data);

    });

}
function insertWorkflowHistoryDone(id, dataHistory, dataItem) {}


// Set options of defined select element to trigger workflow action
function insertWorkflowActions(link, params) {

    if(isBlank(link)) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let id               = 'workflow-actions';  // id of DOM element where the actions menu will be inserted
    let label            = 'Select Action';     // Label that will be shown in the select control
    let hideIfEmpty      = true;                // If set to true, the select control will be hidden if there are not workflow actions available
    let disableAtStartup = false;               // If set to true, the select control will be disabled until the available actions have been retrieved

    if( isBlank(params)                 )           params = {};
    if(!isBlank(params.id)              )               id = params.id;
    if(!isBlank(params.label)           )            label = params.label;
    if(!isBlank(params.hideIfEmpty)     )      hideIfEmpty = params.hideIfEmpty;
    if(!isBlank(params.disableAtStartup)) disableAtStartup = params.disableAtStartup;

    let elemActions = $('#' + id)
        .attr('data-link', link)
        .html('')
        .change(function() {
            clickWorkflowAction($(this));
        });

    if(disableAtStartup) elemActions.addClass('disabled').attr('disabled', '')

    $('<option></option>')
        .attr('value', '')
        .attr('hidden', '')
        .attr('selected', '')
        .html(label)
        .appendTo(elemActions);

    $.get('/plm/transitions', { 'link' : link }, function(response) {

        for(action of response.data) {

            $('<option></option>').appendTo(elemActions)
                .attr('value', action.__self__)
                .html(action.name);

        }

        if(response.data.length > 0) {
            elemActions.show();
            elemActions.removeClass('disabled');
            elemActions.removeAttr('disabled');
        } else if(hideIfEmpty) {
            elemActions.hide();
        }

        insertWorkflowActionsDone(id, response);

    });

}
function insertWorkflowActionsDone(id, data) {}
function clickWorkflowAction(elemClicked) {

    $('#overlay').show();

    let link       = elemClicked.attr('data-link');
    let transition = elemClicked.val();

    $.get('/plm/transition', { 'link' : link, 'transition' : transition }, function(response) {
        $('#overlay').hide();
        clickWorkflowActionDone(link, tranistion, response);
    });

}
function clickWorkflowActionDone(link, transition, data) {}


// Togggle item bookmark
function getBookmarkStatus(link, id) {

    if(typeof id === 'undefined') id = 'bookmark';

    let elemBookmark = $('#' + id);

    if(elemBookmark.length === 0) return;

    elemBookmark.removeClass('active');
    
    if(typeof link === 'undefined') link = elemBookmark.closest('.panel').attr('data-link');

    elemBookmark.attr('data-link', link);

    $.get('/plm/bookmarks', function(response) {
        for(bookmark of response.data.bookmarks) {
            if(bookmark.item.link === link) {
                elemBookmark.addClass('active');
            }
        }
    });

}
function toggleBookmark(elemBookmark) {

    if(typeof elemBookmark === 'undefined') elemBookmark = $('#bookmark');
    if(elemBookmark.length === 0) return;
    
    let dmsId = elemBookmark.attr('data-link').split('/')[6];

    if(elemBookmark.hasClass('active')) {
        $.get('/plm/remove-bookmark', { 'dmsId' : dmsId }, function () {
            elemBookmark.removeClass('active');
        });
    } else {
        $.get('/plm/add-bookmark', { 'dmsId' : dmsId, 'comment' : ' ' }, function () {
            elemBookmark.addClass('active');
        });
    }

}


// Set tab labels and toggle visibility based on user permission
function insertTabLabels(tabs) {

    $('#tabItemDetails'  ).hide();
    $('#tabAttachments'  ).hide();
    $('#tabWorkflow'     ).hide();
    $('#tabGrid'         ).hide();
    $('#tabProject'      ).hide();
    $('#tabRelationships').hide();
    $('#tabChangeLog'    ).hide();

    for(let tab of tabs) {

        let label = (tab.name === null) ? tab.key : tab.name;

        switch(tab.workspaceTabName) {
            case 'ITEM_DETAILS'         : $('#tabItemDetails'  ).html(label).show(); break;
            case 'PART_ATTACHMENTS'     : $('#tabAttachments'  ).html(label).show(); break;
            case 'WORKFLOW_ACTIONS'     : $('#tabWorkflow'     ).html(label).show(); break;
            case 'PART_GRID'            : $('#tabGrid'         ).html(label).show(); break;
            case 'PROJECT_MANAGEMENT'   : $('#tabProject'      ).html(label).show(); break;
            case 'RELATIONSHIPS'        : $('#tabRelationships').html(label).show(); break;
            case 'PART_HISTORY'         : $('#tabChangeLog'    ).html(label).show(); break;
        }

    }

}