// Library file to contain reusable methods for various UI components
let cachePicklists  = []; // keys: link, data
let cacheSections   = [];
let cacheWorkspaces = [];
let urnsBOMFields   = [];
let username        = '';
let requestsLimit   = 5;



// Set user profile picture
function insertAvatar() {

    let elemAvatar = $('#header-avatar');

    if(elemAvatar.length === 0) return;

    $.get( '/plm/me', {}, function(response) {

        username = response.data.displayName;
        
        let elemAvatar = $('#header-avatar');
            elemAvatar.addClass('no-icon');
            elemAvatar.html('');
            elemAvatar.attr('title', response.data.displayName + ' @ ' + tenant);
            elemAvatar.css('background', 'url(' + response.data.image.large + ')');
            elemAvatar.css('background-position', 'center');
            elemAvatar.css('background-size', elemAvatar.css('height'));

    });

}


// Insert APS Viewer
function insertViewer(link, color) {

    if(isBlank(link)) return;
    if(typeof color === 'undefined') color = 255;

    let elemInstance = $('#viewer').children('.adsk-viewing-viewer');
    if(elemInstance.length > 0) elemInstance.hide();

    $('#viewer-processing').show();
    $('#viewer').attr('data-link', link);1433

    $.get('/plm/get-viewables', { 'link' : link }, function(response) {

        if($('#viewer').attr('data-link') !== response.params.link) return;

        if(response.data.length > 0) {

            let foundAssembly = false;

            $('body').removeClass('no-viewer');

            for(viewable of response.data) {
                if((viewable.name.indexOf('.iam.dwf') > -1) || (viewable.name.indexOf('.ipt.dwf') > -1)) {
                    $('body').removeClass('no-viewer');
                    if(elemInstance.length > 0) elemInstance.show();
                    foundAssembly = true;
                    insertViewerCallback(viewable);
                    initViewer(viewable, color);
                    break;
                }
            }

            if(!foundAssembly) {
                if(elemInstance.length > 0) elemInstance.show();
                insertViewerCallback(response.data[0]);
                initViewer(response.data[0], color);
            }

        } else {

            $('#viewer').hide();
            $('#viewer-processing').hide();
            $('#viewer-message').css('display', 'flex');
            $('body').addClass('no-viewer');

        }
    });

}
function insertViewerCallback() {}


// Insert Create Dialog
function insertCreateForm(wsId, id, hideReadOnly, excludeSections, excludeFields) {

    console.log('insertCreateForm');

    if(isBlank(wsId)            ) return;
    if(isBlank(id)              )               id = 'create';
    if(isBlank(hideReadOnly)    )    hideReadOnly  = true;
    if(isBlank(excludeSections)) excludeSections = [];

    let sections = [];
    let fields   = [];
    
    for(workspace of cacheWorkspaces) {
        if(workspace.id === wsId) {
            if(isBlank(sections)) sections = workspace.sections;
            if(isBlank(fields)  ) fields   = workspace.fields;
        }
    }

    console.log(sections);
    
    if(sections.length === 0) {

        let requests = [
            $.get('/plm/sections', { 'wsId' : wsId }),
            $.get('/plm/fields', { 'wsId' : wsId })
        ]

        Promise.all(requests).then(function(responses) {

            console.log(responses);

            cacheWorkspaces.push({
                'id'        : wsId,
                'sections'  : requests[0].data,
                'fields'    : requests[1].data
            });

            insertItemDetailsFields('', id, responses[0].data, responses[1].data, null, true, true, hideReadOnly, excludeSections, excludeFields)

        });

    } else {

        insertItemDetailsFields('', id, sections, fields, null, true, true, hideReadOnly, excludeSections, excludeFields)
    
    }
}


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
                        for(validator of field.fieldValidators) {
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

    for(picklist of cachePicklists) {
        if(picklist.link === link) {
            insertOptions(elemParent, picklist.data, fieldId, type, value);
            return;
        }
    }

    $.get( '/plm/picklist', { 'link' : link, 'limit' : 100, 'offset' : 0 }, function(response) {
        if(!response.error) {
            cachePicklists.push({
                'link' : link,
                'data' : response.data
            });
            insertOptions(elemParent, response.data, fieldId, type, value);
        }
    });

}
function insertOptions(elemParent, data, fieldId, type, value) {

    for(option of data.items) {
        
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


    for(field of fields) {

        if(field.editability === 'ALWAYS') {

            let elemControl = null;

            switch(field.type.title) {

                case 'Check Box': 
                    elemControl = $('<input>');
                    elemControl.attr('type', 'checkbox');

                case 'Integer': 
                case 'Single Line Text': 
                    elemControl = $('<input>');
                    break;

                case 'Single Selection': 
                    elemControl = $('<select>');
                    elemControl.addClass('picklist');

                    let elemOptionBlank = $('<option></option>');
                        elemOptionBlank.attr('value', null);
                        elemOptionBlank.appendTo(elemControl);

                    getOptions(elemControl, field.picklist, field.__self__.split('/')[8], 'select', '');

                    break;

            }

            result.push({
                'id'      : field.__self__.split('/')[8],
                // 'title'   : sectionField.title,
                'type'    : field.type.title,
                'control' : elemControl
            });
        }

    }

    return result;

}


// Parse details page to create record (created for client.js)
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
        if(elemInput.val() === '') {
            result.value = null;
        } else {
            result.value = {
                'link' : elemInput.val()
            };
            result.type ='picklist';
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


// Insert attachments as tiles
function insertAttachments(link, id, split) {

    if(isBlank(id))       id = 'attachments';
    if(isBlank(split)) split = false;

    $('#' + id + '-processing').show();
    $('#' + id + '-no-data').addClass('hidden');

    let attachments = [];
    let timestamp   = new Date().getTime();
    let elemList  = $('#' + id + '-list');
        elemList.attr('data-timestamp', timestamp);
        elemList.html('');

    if($('#frame-download').length === 0) {

        let elemFrame = $('<frame>');
            elemFrame.attr('id', 'frame-download');
            elemFrame.attr('name', 'frame-download');
            elemFrame.css('display', 'none');
            elemFrame.appendTo($('body'));

    }  

    let params = {
        'link'      : link,
        'timestamp' : timestamp
    }

    $.get('/plm/attachments', params, function(response) {

             if(response.data.statusCode === 403) return;
        else if(response.data.statusCode === 404) return;

        if(response.params.timestamp === $('#' + id + '-list').attr('data-timestamp')) {
            if(response.params.link === link) {

                $('#' + id + '-processing').hide();

                attachments = response.data;

                if(attachments.length === 0) $('#' + id + '-no-data').removeClass('hidden');

                for(let attachment of attachments) {

                    let date = new Date(attachment.created.timeStamp);

                    let elemAttachment = $('<div></div>');
                        elemAttachment.addClass('attachment');
                        elemAttachment.addClass('tile');
                        elemAttachment.attr('data-file-id', attachment.id);
                        elemAttachment.attr('data-url', attachment.url);
                        elemAttachment.attr('data-file-link', attachment.selfLink);
                        elemAttachment.attr('data-extension', attachment.type.extension);
                        elemAttachment.appendTo(elemList);

                    let elemAttachmentGraphic = getFileGrahpic(attachment);
                        elemAttachmentGraphic.appendTo(elemAttachment);

                    let elemAttachmentDetails = $('<div></div>');
                        elemAttachmentDetails.addClass('attachment-details');
                        elemAttachmentDetails.appendTo(elemAttachment);

                    let elemAttachmentName = $('<div></div>');
                        elemAttachmentName.addClass('attachment-name');
                        elemAttachmentName.appendTo(elemAttachmentDetails);

                    if(!split) {

                        elemAttachmentName.addClass('nowrap');
                        elemAttachmentName.html(attachment.name);

                    } else {

                        let filename   = attachment.name.split('.');
                        let filePrefix = '';

                        for(let i = 0; i < filename.length - 1; i++) filePrefix += filename[i];

                        let elemAttachmentPrefix = $('<div></div>');
                            elemAttachmentPrefix.addClass('attachment-name-prefix');
                            elemAttachmentPrefix.addClass('nowrap');
                            elemAttachmentPrefix.html(filePrefix);
                            elemAttachmentPrefix.appendTo(elemAttachmentName);

                        let elemAttachmentSuffix = $('<div></div>');
                            elemAttachmentSuffix.addClass('attachment-name-suffix');
                            // elemAttachmentSuffix.addClass('nowrap');
                            elemAttachmentSuffix.html('.' + filename[filename.length - 1]);
                            elemAttachmentSuffix.appendTo(elemAttachmentName);

                    }

                    let elemAttachmentUser = $('<div></div>');
                        elemAttachmentUser.addClass('attachment-user');
                        elemAttachmentUser.addClass('nowrap');
                        elemAttachmentUser.html('Created by ' + attachment.created.user.title);
                        elemAttachmentUser.appendTo(elemAttachmentDetails);            

                    let elemAttachmentDate = $('<div></div>');
                        elemAttachmentDate.addClass('attachment-date');
                        elemAttachmentDate.addClass('nowrap');
                        elemAttachmentDate.html( date.toLocaleString());
                        elemAttachmentDate.appendTo(elemAttachmentDetails);

                    elemAttachment.click(function() {

                        let elemClicked    = $(this).closest('.item');
                        let elemAttachment = $(this).closest('.attachment');
                        let fileExtension  = elemAttachment.attr('data-extension');

                        let params = {
                            'wsId'      : elemClicked.attr('data-wsid'),
                            'dmsId'     : elemClicked.attr('data-dmsid'),
                            'fileId'    : elemAttachment.attr('data-file-id'),
                            'fileLink'  : elemAttachment.attr('data-file-link')
                        }

                        $.getJSON( '/plm/download', params, function(response) {

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
                                
                    });

                }

                insertAttachmentsDone(id, response.data);

            }
        }

    });

    return attachments.length;

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
function insertAttachmentsDone(id, data) {}


// Insert BOM with selected controls
function insertBOM(link , params) {

    //  Set defaults for optional parameters
    // --------------------------------------
    let id          = 'bom';    // id of DOM element where the BOM will be inseerted
    let title       = 'BOM';    // Title being shown on top of the BOM display
    let bomViewName = '';       // BOM view of PLM to display (if no value is provided, the first view will be used)
    let multiSelect = false;    //  Adds buttons to select / deselect all elements as well as checkboxes
    let reset       = false;    //  Adds button to deselect selected elements
    let openInPLM   = true;     //  Adds button to open selected element in PLM
    let goThere     = false;    //  Adds button to open the same view for the selected element
    let toggles     = true;     //  Enables expand all / collapse all buttons on top of BOM
    let views       = false;    //  Adds drop down menu to select from the available PLM BOM views
    let search      = true;     //  Adds quick filtering using search input on top of BOM
    let position    = true;     //  When set to true, the position / find number will be displayed
    let quantity    = false;    //  When set to true, the quantity column will be displayed
    let hideDetails = false;    //  When set to true, detail columns will be skipped, only the descriptor will be shown
    let headers     = true;     //  When set to false, the table headers will not be shown
    let getFlatBOM  = false;    //  Retrieve Flat BOM at the same time (i.e. to get total quantities)
    let endItem     = null;


    if(isBlank(link)) return;
    if(isBlank(params)) params = {};

    if(!isBlank(params.id)         )            id = params.id;
    if(!isEmpty(params.title)      )         title = params.title;
    if(!isBlank(params.bomViewName))   bomViewName = params.bomViewName;
    if(!isBlank(params.multiSelect))   multiSelect = params.multiSelect;
    if(!isBlank(params.reset)      )         reset = params.reset;
    if(!isBlank(params.openInPLM)  )     openInPLM = params.openInPLM;
    if(!isBlank(params.goThere)    )       goThere = params.goThere;
    if(!isBlank(params.toggles)    )       toggles = params.toggles;
    if(!isBlank(params.views)      )         views = params.views;
    if(!isBlank(params.search)     )        search = params.search;
    if(!isBlank(params.position)   )      position = params.position;
    if(!isBlank(params.quantity)   )      quantity = params.quantity;
    if(!isBlank(params.hideDetails)) { hideDetails = params.hideDetails } else { hideDetails = ((bomViewName === '') && (views === false)); }
    if(!isBlank(params.headers)    )     { headers = params.headers } else { headers = !hideDetails; }
    if(!isBlank(params.getFlatBOM) )    getFlatBOM = params.getFlatBOM;

    let elemBOM = $('#' + id);
        elemBOM.attr('data-link', link);
        elemBOM.attr('data-position', position);
        elemBOM.attr('data-quantity', quantity);
        elemBOM.attr('data-hide-details', hideDetails);
        elemBOM.attr('data-get-flat-bom', getFlatBOM);
        elemBOM.attr('data-select-mode', (multiSelect) ? 'multi' : 'single');
        elemBOM.attr('data-enditem', endItem);
        elemBOM.addClass('bom');
        elemBOM.html('');

    if(!isBlank(params.endItem)) {
        if(!isBlank(params.endItem.fieldId)) elemBOM.attr('data-enditem-fieldId', params.endItem.fieldId);
        if(!isBlank(params.endItem.value  )) elemBOM.attr('data-enditem-value'  , params.endItem.value  );
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
    
    }


    if(reset) {

        $('<div></div>').appendTo(elemToolbar)
            .addClass('button')
            .addClass('icon')
            .addClass('icon-deselect')
            .addClass('xs')
            .addClass('bom-single-select-action')
            .attr('id', id + '-action-reset')
            .attr('title', 'Deselect BOM item')
            .hide()
            .click(function() {
                clickBOMReset($(this));
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

        let elemSearchInput = $('<input></input>');
            elemSearchInput.attr('placeholder', 'Search');
            elemSearchInput.addClass('bom-search-input')
            elemSearchInput.appendTo(elemSearch);
            elemSearchInput.keyup(function() {
                searchInBOM(id, $(this));
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

    let elemBOMTable = $('<table></table');
        elemBOMTable.addClass('bom-table');
        elemBOMTable.addClass('fixed-header');
        elemBOMTable.attr('id', id + '-table');
        elemBOMTable.appendTo(elemContent);

    let elemBOMTableHead = $('<thead></thead>');
        elemBOMTableHead.addClass('bom-thead');
        elemBOMTableHead.attr('id', id + '-thead');
        elemBOMTableHead.appendTo(elemBOMTable);

    if(!headers) elemBOMTableHead.hide();

    let elemBOMTableBody = $('<tbody></tbody>');
        elemBOMTableBody.addClass('bom-tbody');
        elemBOMTableBody.attr('id', id + '-tbody');
        elemBOMTableBody.appendTo(elemBOMTable);        

    insertBOMDone(id);

    let bomViews        = null;
    let fields          = null
    let requests        = [];

    for(workspace of cacheWorkspaces) {
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
                // editableFields = getEditableFields(fields);
            }
        }

        let addToCache = true;

        if(responses.length > 0) {
            for(workspace of cacheWorkspaces) {
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

        if(addToCache) {
            cacheWorkspaces.push({
                'id'                : link.split('/')[4],
                'sections'          : null,
                'fields'            : fields,
                // 'editableFields'    : editableFields,
                'bomViews'          : bomViews
            });
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

        changeBOMView(id);

    });

}
function insertBOMDone(id) {}
function changeBOMView(id) {

    let elemBOM             = $('#' + id);
    let position            = (elemBOM.attr('data-position'    ).toLowerCase() === 'true');
    let quantity            = (elemBOM.attr('data-quantity'    ).toLowerCase() === 'true');
    let hideDetails         = (elemBOM.attr('data-hide-details').toLowerCase() === 'true');
    let getFlatBOM          = (elemBOM.attr('data-get-flat-bom').toLowerCase() === 'true');
    let fieldIdEndItem      = (typeof elemBOM.attr('data-enditem-fieldId') === 'undefined') ? '' : elemBOM.attr('data-enditem-fieldId');
    let valueEndItem        = (typeof elemBOM.attr('data-enditem-value') === 'undefined') ? '' : elemBOM.attr('data-enditem-value');
    let link                = elemBOM.attr('data-link');
    let bomViewId           = $('#' + id + '-view-selector').val();
    let elemProcessing      = $('#' + id + '-processing');
    let elemBOMTableBody    = $('#' + id + '-tbody');

    elemProcessing.show();
    elemBOMTableBody.html('');

    let params = {
        'link'          : link,
        'depth'         : 10,
        'revisionBias'  : 'release',
        'viewId'        : bomViewId
    }

    let fieldURNQuantity    = '';
    let fieldURNPartNumber  = '';
    let fieldURNEndItem     = '';
    let bomView;

    for(workspace of cacheWorkspaces) {
        if(workspace.id === link.split('/')[4]) {
            for(view of workspace.bomViews) {
                if(view.id === Number(bomViewId)) bomView = view;
            }
        }
    }

    for(field of bomView.fields) {
             if(field.fieldId === config.viewer.fieldIdPartNumber) fieldURNPartNumber = field.__self__.urn;
        else if(field.fieldId === 'QUANTITY') fieldURNQuantity = field.__self__.urn;
        else if(field.fieldId === fieldIdEndItem) fieldURNEndItem = field.__self__.urn;
    }

    let requests = [$.get('/plm/bom', params)];

    if(getFlatBOM) requests.push($.get('/plm/bom-flat', params));

    Promise.all(requests).then(function(responses) {

        setBOMHeaders(id, quantity, hideDetails, bomView.fields);
        insertNextBOMLevel(responses[0].data, elemBOMTableBody, responses[0].data.root, position, quantity, hideDetails, bomView.fields, fieldURNPartNumber, fieldURNQuantity, fieldURNEndItem, valueEndItem);
        enableBOMToggles(id);

        if(getFlatBOM) changeBOMViewDone(id, bomView.fields, responses[0].data, responses[1].data);
        else           changeBOMViewDone(id, bomView.fields, responses[0].data);
        
        elemProcessing.hide();

    });

}
function changeBOMViewDone(id) {}
function setBOMHeaders(id, quantity, hideDetails, fields) {

    let elemBOMTableHead = $('#'+  id + '-thead');
        elemBOMTableHead.html('');

    let elemBOMTableHeadRow = $('<tr></tr>');
        elemBOMTableHeadRow.appendTo(elemBOMTableHead);

    $('<th></th>').appendTo(elemBOMTableHeadRow).html('').addClass('bom-color');
    $('<th></th>').appendTo(elemBOMTableHeadRow).html('Item');

    if(quantity) {
        
        $('<th></th>').appendTo(elemBOMTableHeadRow)
            .html('Qty');
    
    }

    if(!hideDetails) {
        for(field of fields) {
            $('<th></th>').appendTo(elemBOMTableHeadRow)
                .html(field.displayName)
                .addClass('bom-column-' + field.fieldId.toLowerCase());
        }
    }

}
function insertNextBOMLevel(bom, elemTable, parent, position, quantity, hideDetails, fields, fieldURNPartNumber, fieldURNQuantity, fieldURNEndItem, valueEndItem) {

    let result    = false;
    let firstLeaf = true;

    for(edge of bom.edges) {

        if(edge.parent === parent) {

            result = true;

            let partNumber   = getBOMCellValue(edge.child, fieldURNPartNumber, bom.nodes);
            let rowQuantity  = getBOMEdgeValue(edge, fieldURNQuantity, null, 0);

            let elemRow = $('<tr></tr>');
                elemRow.attr('data-number', edge.itemNumber);
                elemRow.attr('data-part-number', partNumber);
                elemRow.attr('data-quantity', rowQuantity);
                elemRow.attr('data-number', edge.itemNumber);
                elemRow.addClass('bom-item');
                elemRow.appendTo(elemTable);
                elemRow.click(function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    clickBOMItem(e, $(this));
                    toggleBOMItemActions($(this));
                })
    
            for(node of bom.nodes) {
                if(node.item.urn === edge.child) {
                    elemRow.attr('data-dmsId',      node.item.link.split('/')[6]);
                    elemRow.attr('data-link',       node.item.link);
                    elemRow.attr('data-urn',        edge.child);
                    elemRow.attr('data-title',      node.item.title);
                    elemRow.attr('data-edgeId',     edge.edgeId);
                    elemRow.attr('data-edge-Link',  edge.edgeLink);
                    elemRow.attr('data-level',      edge.depth);
                    elemRow.addClass('bom-level-' + edge.depth);
                }
            }

            let elemColor = $('<td></td>').appendTo(elemRow)
                .addClass('bom-color');

            let elemCell = $('<td></td>').appendTo(elemRow)
                .addClass('bom-first-col');

            if(position) {

                let elemCellNumber = $('<span></span>');
                    elemCellNumber.addClass('bom-number');
                    elemCellNumber.html(edge.depth + '.' + edge.itemNumber);
                    elemCellNumber.appendTo(elemCell);

            }

            let elemCellTitle = $('<span></span>');
                elemCellTitle.addClass('bom-title');
                elemCellTitle.html(getBOMItemTitle(edge.child, bom.nodes));
                elemCellTitle.appendTo(elemCell);


            if(quantity) {

                $('<td></td>').appendTo(elemRow)
                    .addClass('bom-quantity')
                    .html(rowQuantity);

            }

            if(!hideDetails) {
                for(let field of fields) {

                    let value = ''

                    if(field.fieldTab === 'STANDARD_BOM') value = getBOMEdgeValue(edge, field.__self__.urn, null, '');
                    else value = getBOMCellValue(edge.child, field.__self__.urn, bom.nodes);

                    $('<td></td>').appendTo(elemRow)
                        .html(value)
                        .addClass('bom-column-' + field.fieldId.toLowerCase());

                }
            }

            let isEndItem = false;

            if(fieldURNEndItem !== '') {
                let cellEndItem = getBOMCellValue(edge.child, fieldURNEndItem, bom.nodes);
                if(valueEndItem === cellEndItem) {
                    isEndItem = true;
                }
            }

            let hasChildren = (isEndItem) ? false : insertNextBOMLevel(bom, elemTable, edge.child, position, quantity, hideDetails, fields, fieldURNPartNumber, fieldURNQuantity, fieldURNEndItem, valueEndItem);

            elemRow.children().first().each(function() {
                
                if(hasChildren) {

                    $('<span></span>').prependTo(elemCell)
                        .addClass('bom-nav')
                        .addClass('icon')
                        .addClass('expanded');

                    elemRow.addClass('node');

                } else {

                    elemRow.addClass('leaf');
                    if(firstLeaf) elemRow.addClass('first-leaf');
                    firstLeaf = false;

                }

            });

        }

    }

    return result;

}
function getBOMItemTitle(id, nodes) {

    for(node of nodes) {
        if(node.item.urn === id) {
            return node.item.title;
        }
    }

    return '';
    
}
function enableBOMToggles(id) {

    $('#' + id).find('.bom-nav').click(function(e) {
    
        e.stopPropagation();
        e.preventDefault();

        let elemItem  = $(this).closest('tr');
        let level     = Number(elemItem.attr('data-level'));
        let levelNext = level - 1;
        let levelHide = level + 2;
        let elemNext  = $(this).closest('tr');
        let doExpand  = $(this).hasClass('collapsed');

        if(e.shiftKey) levelHide = 100;

        $(this).toggleClass('collapsed');
        
        do {

            elemNext  = elemNext.next();
            levelNext = Number(elemNext.attr('data-level'));

            if(levelNext > level) {
                if(doExpand) {
                    if(levelHide > levelNext) {
                        elemNext.show();
                        if(e.shiftKey) elemNext.find('.bom-nav').removeClass('collapsed');
                    }
                } else {
                    elemNext.hide();
                    elemNext.find('.bom-nav').addClass('collapsed');
                }
            }

        } while(levelNext > level);

    });

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

}
function clickBOMDeselectAll(elemClicked) {

    let elemBOM = elemClicked.closest('.bom');

    elemBOM.find('.bom-item').removeClass('selected');

    toggleBOMItemActions(elemClicked);

}
function clickBOMExpandAll(elemClicked) {

    let elemBOM     = elemClicked.closest('.bom');
    let id          = elemBOM.attr('id');
    let elemContent = $('#' + id + '-tbody');

    elemContent.find('tr').each(function() {
        $(this).show();
        $(this).find('.bom-nav').removeClass('collapsed');
    });

}
function clickBOMCollapseAll(elemClicked) {

    let elemBOM     = elemClicked.closest('.bom');
    let id          = elemBOM.attr('id');
    let elemContent = $('#' + id + '-tbody');

    elemContent.find('tr').each(function() {
        if($(this).children('th').length === 0) {
            if(!$(this).hasClass('bom-level-1')) {
                $(this).hide();
            }
        }
        $(this).find('.bom-nav').addClass('collapsed');
    });

}
function searchInBOM(id, elemInput) {

    // let id          = elemInput.attr('data-id');
    let elemTable   = $('#' + id + '-tbody');
    let filterValue = elemInput.val().toLowerCase();

    elemTable.children('tr').removeClass('result');

    if(filterValue === '') {

        elemTable.children().each(function() {
            $(this).show();
        });

    } else {

        $('i.collapsed').removeClass('collapsed').addClass('expanded');
        elemTable.children().each(function() {
            $(this).hide();
        });

        elemTable.children().each(function() {

            let cellValue = $(this).children('.bom-first-col').html().toLowerCase();

            if(cellValue.indexOf(filterValue) > -1) {
             
                $(this).show();
                $(this).addClass('result');
             
                let level = Number($(this).attr('data-level'));
                unhideBOMParents(level - 1, $(this));

            }

        });

    }

}
function unhideBOMParents(level, elem) {

    elem.prevAll().each(function() {

        let prevLevel = Number($(this).attr('data-level'));

        if(level === prevLevel) {
            level--;
            $(this).show();
        }

    });

}
function clickBOMReset(elemClicked) {

    let elemContent = elemClicked.closest('.bom').find('.bom-tbody');
        elemContent.find('tr.selected').removeClass('selected');

    toggleBOMItemActions(elemClicked);
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

    clickBOMItemDone(elemClicked);
    
}
function clickBOMItemDone(elemClicked) {}
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



function insertFlatBOM(link , params) {

    //  Set defaults for optional parameters
    // --------------------------------------
    let id          = 'flat-bom';   // id of DOM element where the BOM will be inseerted
    let title       = 'Flat BOM';   // Title being shown on top of the BOM display
    let bomViewName = '';           // BOM view of PLM to display (if no value is provided, the first view will be used)
    let multiSelect = false;        //  Adds buttons to select / deselect all elements as well as checkboxes
    let openInPLM   = true;         //  Adds button to open selected element in PLM
    let goThere     = false;        //  Adds button to open the same view for the selected element
    let views       = false;        //  Adds drop down menu to select from the available PLM BOM views
    let search      = true;         //  Adds quick filtering using search input on top of BOM
    let hideDetails = false;        //  When set to true, detail columns will be skipped, only the descriptor will be shown
    let headers     = true;         //  When set to false, the table headers will not be shown
    let showMore    = false;        //  When set to true, adds controls to access the item details pages for each BOM entry
    let editable    = false;        //  When set to true, enables modifications in editable fields
    let classNames  = [];           //  Array of class names that will be assigned to each BOM row (enables specific styling and event listeners)


    if(isBlank(link)) return;
    if(isBlank(params)) params = {};

    if(!isBlank(params.id)         )            id = params.id;
    if(!isEmpty(params.title)      )         title = params.title;
    if(!isBlank(params.bomViewName))   bomViewName = params.bomViewName;
    if(!isBlank(params.multiSelect))   multiSelect = params.multiSelect;
    if(!isBlank(params.openInPLM)  )     openInPLM = params.openInPLM;
    if(!isBlank(params.goThere)    )       goThere = params.goThere;
    if(!isBlank(params.views)      )         views = params.views;
    if(!isBlank(params.search)     )        search = params.search;
    if(!isBlank(params.headers)    )       headers = params.headers;
    if(!isBlank(params.showMore)   )      showMore = params.showMore;
    if(!isBlank(params.editable)   )      editable = params.editable;
    if(!isBlank(params.hideDetails)) { hideDetails = params.hideDetails } else { hideDetails = ((bomViewName === '') && (views === false)); }
    if(!isBlank(params.classNames) )    classNames = params.classNames;


    let elemBOM = $('#' + id);
        elemBOM.attr('data-link', link);
        elemBOM.attr('data-editable', editable);
        elemBOM.attr('data-show-more', showMore);
        elemBOM.attr('data-hide-details', hideDetails);
        elemBOM.addClass('flat-bom');
        elemBOM.html('');

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
        // .hide()
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

    for(workspace of cacheWorkspaces) {
        if(workspace.id === link.split('/')[4]) {
            bomViews        = workspace.bomViews;
            fields          = workspace.fields;
            editableFields  = workspace.editableFields;
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
                editableFields = getEditableFields(fields);
            }
        }

        let addToCache = true;

        if(responses.length > 0) {
            for(workspace of cacheWorkspaces) {
                if(workspace.id === link.split('/')[4]) {
                    workspace.bomViews           = bomViews;
                    if(!hideDetails) {
                        workspace.fields         = fields;
                        workspace.editableFields = editableFields;
                    }
                    addToCache                  = false;
                }
            }
        }

        if(addToCache) {
            cacheWorkspaces.push({
                'id'                : link.split('/')[4],
                'sections'          : null,
                'fields'            : fields,
                'editableFields'    : editableFields,
                'bomViews'          : bomViews
            });
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
        $('#overlay').hide();

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
                    let elemField = getFieldValue($(this));
                    console.log(elemField);
                    addFieldToPayload(params.sections, sections, null, elemField.fieldId, elemField.value, false);
                });

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
function changeFlatBOMView(id) {

    let elemBOM             = $('#' + id);
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
        'depth'         : 10,
        'revisionBias'  : 'release',
        'viewId'        : bomViewId
    }

    let editableFields     = [];
    let fieldURNPartNumber = '';
    let bomView;

    for(workspace of cacheWorkspaces) {
        if(workspace.id === link.split('/')[4]) {
            editableFields = workspace.editableFields;
            for(view of workspace.bomViews) {
                if(view.id === Number(bomViewId)) bomView = view;
            }
        }
    }

    for(field of bomView.fields) {
        if(field.fieldId === config.viewer.fieldIdPartNumber) fieldURNPartNumber = field.__self__.urn;
    }

    $.get('/plm/bom-flat', params, function(response) {

        setFlatBOMHeaders(id, editable, showMore, hideDetails, bomView.fields)

        let count = 1;

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
                    updateFlatBOMCounter($(this).closest('.flat-bom'));
                });

            for(className of classNames) elemRow.addClass(className);

            if(editable) {

                $('<td></td>').appendTo(elemRow)
                    .html('<div class="icon icon-check-box xxs"></div>')
                    .addClass('flat-bom-check');

            }

            let elemRowNumber = $('<td></td>');
                elemRowNumber.html(count++);
                elemRowNumber.addClass('flat-bom-number');
                elemRowNumber.appendTo(elemRow);        
                
            let elemRowTitle = $('<td></td>');
                elemRowTitle.html(title)
                elemRowTitle.addClass('flat-bom-title');
                elemRowTitle.appendTo(elemRow);   

            $('<td></td>').appendTo(elemRow)
                .html(qty)
                .addClass('flat-bom-qty');

            if(!hideDetails) {

                for(field of bomView.fields) {

                    let value       = getFlatBOMCellValue(response.data, itemLink, field.__self__.urn, 'title');
                    let isEditable  = false;
                    let elemRowCell = $('<td></td>');


                    elemRowCell.appendTo(elemRow); 
                    elemRowCell.addClass('flat-bom-column-' + field.fieldId.toLowerCase());

                    for(editableField of editableFields) {

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
function setFlatBOMHeaders(id, editable, showMore, hideDetails, fields) {

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

    let elemBOMTableHeadNumber = $('<th></th>');
        elemBOMTableHeadNumber.html('Nr');
        elemBOMTableHeadNumber.appendTo(elemBOMTableHeadRow);

    let elemBOMTableHeadItem = $('<th></th>');
        elemBOMTableHeadItem.html('Item');
        elemBOMTableHeadItem.appendTo(elemBOMTableHeadRow);

    let elemBOMTableHeadQty = $('<th></th>');
        elemBOMTableHeadQty.html('Qty');
        elemBOMTableHeadQty.appendTo(elemBOMTableHeadRow); 

    if(!hideDetails) {

        for(field of fields) {
            let elemBOMTableHeadCell = $('<th></th>');
                elemBOMTableHeadCell.html(field.displayName);
                elemBOMTableHeadCell.appendTo(elemBOMTableHeadRow);       
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

}
function clickFlatBOMItem(e, elemClicked) {

    elemClicked.toggleClass('selected');

}
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

    let count       = elemBOM.find('.flat-bom-item.selected').length;
    let elemCounter = elemBOM.find('.flat-bom-counter');

    elemCounter.html(count + ' Zeilen gewählt');

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
function insertGrid(link, id, rotate) {

    // used by portfolio.js

    if(typeof id === 'undefined') id = 'grid';
    if(typeof rotate === 'undefined') rotate = false;

    $('#' + id + '-processing').show();

    let elemParent = $('#' + id + '-list');
        elemParent.html('');

    let requests = [
        $.get('/plm/grid', { 'link' : link }),
        $.get('/plm/grid-columns', { 'wsId' : link.split('/')[4] })
    ];

    Promise.all(requests).then(function(responses) {

        let columns = responses[1].data.fields;

        if(responses[0].data.length > 0 ) {

            let elemTable = $('<table></table>');
                elemTable.addClass('grid');
                elemTable.appendTo(elemParent);
        
            let elemTableBody = $('<tbody></tbody>');
                elemTableBody.appendTo(elemTable);

            let elemTableHead = $('<tr></tr>');
                elemTableHead.appendTo(elemTableBody);


            if(!rotate) {

                for(column of columns) {

                    let elemTableHeadCell = $('<th></th>');
                        elemTableHeadCell.html(column.name);
                        elemTableHeadCell.appendTo(elemTableHead);
                    
                }

                for(row of responses[0].data) {

                    let elemTableRow = $('<tr></tr>');
                        elemTableRow.appendTo(elemTableBody);

                    for(column of columns) {

                        let value = '';

                        for(field of row.rowData) {
                            if(field.title === column.name) {
                                value = field.value;
                            }
                        }

                        let elemTableCell = $('<td></td>');
                            elemTableCell.html(value);
                            elemTableCell.appendTo(elemTableRow);
                    }

                }

            } else {

                for(column of columns) {

                    elemTable.addClass('rotated');

                    let elemTableRow = $('<tr></tr>');
                        elemTableRow.appendTo(elemTableBody);

                    let elemTableHeadCell = $('<th></th>');
                        elemTableHeadCell.html(column.name);
                        elemTableHeadCell.appendTo(elemTableRow);

                    for(row of responses[0].data) {

                        let value = '';

                        for(field of row.rowData) {
                            if(field.title === column.name) {
                                value = field.value;
                            }
                        }

                        let elemTableCell = $('<td></td>');
                            elemTableCell.html(value);
                            elemTableCell.appendTo(elemTableRow);
                    }

                }

            }

        }

    });

}


// Insert related processes
function insertChangeProcesses(link, id, icon) {

    if(isBlank(link)) return;
    if(isBlank(id)  )   id = 'processes';
    if(isBlank(icon)) icon = 'schema';

    let elemParent = $('#' + id + '-list');
        elemParent.html('');
        elemParent.closest('.panel').attr('data-link', link);

    let elemProcessing = $('#' + id + '-processing');
        elemProcessing.show();

    $.get('/plm/changes', { 'link' : link }, function(response) {

             if(response.data.statusCode === 403) return;
        else if(response.data.statusCode === 404) return;

        if(response.params.link === link) {

            elemProcessing.hide();
            elemParent.show();

            for(process of response.data) {
                process.sort = process['last-workflow-history'].created
            }

            sortArray(response.data, 'sort', 'date', 'descending');

            for(process of response.data) {
        
                let link = process.item.link;
                let user = process['first-workflow-history'].user.title;
                let date = process['first-workflow-history'].created;
        
                let elemProcess = $('<div></div>');
                    elemProcess.addClass('animation');
                    elemProcess.addClass('process');
                    elemProcess.addClass('tile');
                    elemProcess.attr('data-link', link);
                    elemProcess.attr('data-urn', process.item.urn);
                    elemProcess.appendTo(elemParent);
                    elemProcess.click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        clickChangeProcess($(this));
                    });
        
                let elemProcessImage = $('<div></div>');
                    elemProcessImage.addClass('tile-image');
                    elemProcessImage.appendTo(elemProcess);
        
                let elemProcessDetails = $('<div></div>');
                    elemProcessDetails.addClass('tile-details');
                    elemProcessDetails.appendTo(elemProcess);
        
                let elemProcessWorkspace = $('<div></div>');
                    elemProcessWorkspace.addClass('tile-title');
                    elemProcessWorkspace.appendTo(elemProcessDetails);
        
                let elemProcessDescriptor = $('<div></div>');
                    elemProcessDescriptor.addClass('tile-subtitle');
                    elemProcessDescriptor.appendTo(elemProcessDetails);
        
                let elemProcessData = $('<div></div>');
                    elemProcessData.addClass('tile-data');
                    elemProcessData.appendTo(elemProcessDetails);
        
                let elemProcessCreator = $('<div></div>');
                    elemProcessCreator.addClass('process-creator');
                    elemProcessCreator.appendTo(elemProcessData);
        
                let elemProcessStatus = $('<div></div>');
                    elemProcessStatus.addClass('process-status');
                    elemProcessStatus.appendTo(elemProcessData);
        
                $.get('/plm/details', { 'link' : link}, function(response) {
        
                    $('.process').each(function() {
                        let elemProcess = $(this);
                        if(elemProcess.attr('data-link') === link) {
            
                            elemProcess.removeClass('animation');
            
                            let linkImage   = getFirstImageFieldValue(response.data.sections);
                            let elemImage   = elemProcess.find('.tile-image').first();
            
                            getImageFromCache(elemImage, { 'link' : linkImage }, icon, function() {});
        
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
    });

}
function clickChangeProcess(elemClicked) { openItemByURN(elemClicked.attr('data-urn')); }


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
function insertWorkflowHistory(link, id, currentStatus, currentStatusId, excludedTransitions, finalStates, showNextTransitions) {

    if(isBlank(id                 )) id                  = 'workflow-history';
    if(isBlank(excludedTransitions)) excludedTransitions = [];
    if(isBlank(finalStates        )) finalStates         = [];
    if(isBlank(showNextTransitions)) showNextTransitions = false;

    let elemParent = $('#' + id + '-events');
        elemParent.html('');

    $('#' + id + '-processing').show();

    if(showNextTransitions && isBlank(currentStatusId)) {
        
        $.get('/plm/details', { 'link' : link }, function(response) {
            currentStatusId = response.data.currentState.link.split('/').pop();
            insertWorkflowHistory(link, id, currentStatus, currentStatusId, excludedTransitions, finalStates, showNextTransitions);
        });

    } else {

        let requests = [
            $.get('/plm/workflow-history', { 'link' : link })
        ];

        if(showNextTransitions) requests.push($.get('/plm/transitions', { 'link' : link }));

        Promise.all(requests).then(function(responses){

            $('#' + id + '-processing').hide();

            if(showNextTransitions) {
                if(!finalStates.includes(currentStatus)) {

                    let elemNextActions = $('<div></div>');
                        elemNextActions.addClass('workflow-next');

                    let elemNextActionsTitle = $('<div></div>');
                        elemNextActionsTitle.html('Next Step');
                        elemNextActionsTitle.addClass('workflow-next-title');
                        elemNextActionsTitle.appendTo(elemNextActions);

                    for(next of responses[1].data) {

                        if(!excludedTransitions.includes(next.name)) {
                    
                            let elemAction = $('<div></div>');
                                elemAction.addClass('with-icon');
                                elemAction.addClass('icon-arrow-right');
                                elemAction.addClass('workflow-next-action');
                                elemAction.html(next.name);
                                elemAction.appendTo(elemNextActions);

                        }

                    }

                    if(elemNextActions.children().length > 1) elemNextActions.appendTo(elemParent);
                    if(elemNextActions.children().length > 2) elemNextActionsTitle.html('Possible Next Steps');

                }
            }

            let index = 1;

            //Workflow History
            for(action of responses[0].data.history) {

                if(!excludedTransitions.includes(action.workflowTransition.title)) {

                    let timeStamp = new Date(action.created);
                    let icon = (index++ === responses[0].data.history.length) ? 'icon-start' : 'icon-check';

                    if((index === 2) && finalStates.includes(currentStatus)) icon = 'icon-finish';

                    let elemAction = $('<div></div>');
                        elemAction.addClass('workflowh-history-event')
                        elemAction.appendTo(elemParent);

                    let elemActionAction = $('<div></div>');
                        elemActionAction.addClass('workflow-history-action');
                        elemActionAction.appendTo(elemAction);

                    let elemActionActionIcon = $('<div></div>');
                        elemActionActionIcon.addClass('workflow-history-action-icon');
                        elemActionActionIcon.addClass('icon');
                        elemActionActionIcon.addClass(icon);
                        elemActionActionIcon.addClass('filled');
                        elemActionActionIcon.appendTo(elemActionAction);

                    let elemActionActionText = $('<div></div>');
                        elemActionActionText.addClass('workflow-history-action-text');
                        elemActionActionText.html(action.workflowTransition.title);
                        elemActionActionText.appendTo(elemActionAction);

                    let elemActionDescription = $('<div></div>');
                        elemActionDescription.addClass('workflow-history-comment');
                        elemActionDescription.html(action.comments);
                        elemActionDescription.appendTo(elemAction);

                    let elemActionUser = $('<div></div>');
                        elemActionUser.addClass('workflow-history-user');
                        elemActionUser.html(action.user.title);
                        elemActionUser.appendTo(elemAction);

                    let elemActionDate = $('<div></div>');
                        elemActionDate.addClass('workflow-history-date');
                        elemActionDate.html(timeStamp.toLocaleDateString());
                        elemActionDate.appendTo(elemAction);

                }

            }

        });

    }
}


// Set options of defined select element to trigger workflow action
function insertWorkflowActions(link, id, hideEmpty) {

    if(isBlank(id)) id = 'workflow-actions';
    if(isBlank(hideEmpty)) hideEmpty = false;

    let elemActions = $('#' + id);
        elemActions.addClass('disabled');
        elemActions.attr('disabled', '');
        elemActions.attr('data-link', link);
        elemActions.html('');

    let label = elemActions.attr('label');

    if(isBlank(label)) label = 'Worfklow Actions';

    let elemLabel = $('<option></option>');
        elemLabel.attr('value', '');
        elemLabel.attr('hidden', '');
        elemLabel.attr('selected', '');
        elemLabel.html(label);
        elemLabel.appendTo(elemActions);

    if(typeof link === 'undefined') return;
    if(       link === ''         ) return;

    $.get('/plm/transitions', { 'link' : link }, function(response) {

        for(action of response.data) {

            let elemAction = $('<option></option>');
                elemAction.attr('value', action.__self__);
                elemAction.html(action.name);
                elemAction.appendTo(elemActions);

        }

        if(response.data.length > 0) {
            elemActions.show();
            elemActions.removeClass('disabled');
            elemActions.removeAttr('disabled');
        } else if(hideEmpty) {
            elemActions.hide();
        }

    });

}


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


// Set tab labels
function insertTabLabels(tabs) {

    $('#tabItemDetails').hide();
    $('#tabAttachments').hide();
    $('#tabWorkflow').hide();
    $('#tabGrid').hide();
    $('#tabProject').hide();
    $('#tabRelationships').hide();
    $('#tabChangeLog').hide();

    for(tab of tabs) {

        let label = (tab.name === null) ? tab.key : tab.name;

        switch(tab.workspaceTabName) {
            case 'ITEM_DETAILS'         : $('#tabItemDetails').html(label).show(); break;
            case 'PART_ATTACHMENTS'     : $('#tabAttachments').html(label).show(); break;
            case 'WORKFLOW_ACTIONS'     : $('#tabWorkflow').html(label).show(); break;
            case 'PART_GRID'            : $('#tabGrid').html(label).show(); break;
            case 'PROJECT_MANAGEMENT'   : $('#tabProject').html(label).show(); break;
            case 'RELATIONSHIPS'        : $('#tabRelationships').html(label).show(); break;
            case 'PART_HISTORY'         : $('#tabChangeLog').html(label).show(); break;
        }

    }

}