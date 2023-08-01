// Library file to contain reusable methods for various UI components
let cachePicklists  = []; // keys: link, data
let cacheSections   = [];
let cacheWorkspaces = [];
let urnsBOMFields   = [];
let username        = '';



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

    if(typeof color === 'undefined') color = 255;

    let elemInstance = $('#viewer').children('.adsk-viewing-viewer');
    if(elemInstance.length > 0) elemInstance.hide();

    $('#viewer-processing').show();
    $('#viewer').attr('data-link', link);

    $.get('/plm/get-viewables', { 'link' : link }, function(response) {

        if($('#viewer').attr('data-link') !== response.params.link) return;

        if(response.data.length > 0) {

            let foundAssembly = false;

            $('body').removeClass('no-viewer');

            for(viewable of response.data) {
                if(viewable.name.indexOf('.iam.dwf') > -1) {
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


// Insert Item Details
function insertItemDetails(link, data) {

    if(typeof link === 'undefined') return;
    if(link === '') return;

    // let selectedWSID    = link.split('/')[4];
    // let params          = { 'link' : link };
    // let promises        = [ $.get('/plm/details', params) ];
    // let sections        = [];
    // let fields          = [];

    $('#details').attr('data-link', link);
    $('#details-processing').show();
    $('#details-sections').html('');

    getBookmarkStatus();
        
    // for(workspace of cacheWorkspaces) {
    //     if(workspace.id === selectedWSID) {
    //         sections = workspace.sections;
    //         fields   = workspace.fields;
    //     }
    // }
    
    // if(sections.length === 0) {
    //     promises.push($.get('/plm/sections', params));
    //     promises.push($.get('/plm/fields',   params));
    // }
    
    // Promise.all(promises).then(function(responses) {

        // if(sections.length === 0) {
        //     sections = responses[1].data;
        //     fields   = responses[2].data;
        //     cacheWorkspaces.push({
        //         'id'        : selectedWSID,
        //         'sections'  : sections,
        //         'fields'    : fields
        //     })
        // }

        // $('#details-processing').hide();
        // $('#details-sections').show();

        // insertItemDetailsFields('details-sections', link, sections, fields, responses[0].data, false, false, false);
        insertItemDetailsFields('details', link, null, null, data, false, false, false);

    // });

}
function insertItemDetailsFields(id, link, sections, fields, data, editable, hideComputed, hideReadOnly) {

    let requests = [];

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
                    'id'        : link.split('/')[4],
                    'sections'  : sections,
                    'fields'    : fields
                })
            }

            processItemDetailsFields(id, sections, fields, data, editable, hideComputed, hideReadOnly)

        });

    } else {

        processItemDetailsFields(id, sections, fields, data, editable, hideComputed, hideReadOnly)

    }

}
function processItemDetailsFields(id, sections, fields, data, editable, hideComputed, hideReadOnly) {

    if(typeof id           === 'undefined') id            = 'details';
    if(typeof sections     === 'undefined') sections      = [];
    if(typeof fields       === 'undefined') fields        = [];
    if(typeof data         === 'undefined') data          = [];
    if(typeof editable     === 'undefined') editable      = false;
    if(typeof hideComputed === 'undefined') hideComputed  = false;
    if(typeof hideReadOnly === 'undefined') hideReadOnly  = false;
   
    let elemParent = $('#' + id + '-sections');
        elemParent.html('');

    $('#' + id + '-processing').hide();
   
    for(section of sections) {

        let isNew       = true;
        let className   = 'expanded'

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

        if(elemFields.children().length === 0) {
            elemFields.hide();
            elemSection.hide();
        }

    }

}
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
                        console.log(value);
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
        $(this).val('');
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
            
            if(!elemField.hasClass('multi-picklist')) {
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
            }

        });

        if(section.fields.length > 0) sections.push(section);

    });

    return sections;

}
function getFieldValue(elemField) {

    let elemInput = elemField.find('input');
    let value     = (elemInput.length > 0) ? elemInput.val() : '';

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
    } else if(elemField.hasClass('picklist')) {
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

    if(typeof id    === 'undefined') id    = 'attachments';
    if(typeof split === 'undefined') split = false;

    $('#' + id + '-processing').show();

    let elemParent = $('#' + id + '-list');
        elemParent.html('');

    if($('#frame-download').length === 0) {

        let elemFrame = $('<frame>');
            elemFrame.attr('id', 'frame-download');
            elemFrame.attr('name', 'frame-download');
            elemFrame.css('display', 'none');
            elemFrame.appendTo($('body'));

    }  

    let attachments = [];

    $.get('/plm/attachments', { 'link' : link }, function(response) {

             if(response.data.statusCode === 403) return;
        else if(response.data.statusCode === 404) return;

        $('#' + id + '-processing').hide();

        attachments = response.data;

        for(attachment of attachments) {

            let date = new Date(attachment.created.timeStamp);

            let elemAttachment = $('<div></div>');
                elemAttachment.addClass('attachment');
                elemAttachment.attr('data-file-id', attachment.id);
                elemAttachment.attr('data-url', attachment.url);
                elemAttachment.attr('data-file-link', attachment.selfLink);
                elemAttachment.attr('data-extension', attachment.type.extension);
                elemAttachment.appendTo(elemParent);

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

                let filename = attachment.name.split('.');

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

                console.log(params);

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

        insertAttachmentsDone();

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
function insertAttachmentsDone() {}


// Insert BOM Tree with controls
// - quantity (true/false) shows or supresses bom quantity display
// - reset (true/false) enables or disables reset button above BOM
// - toggles (true/false) enables or disables toggles to collapse or expand nodes using buttons on top of the BOM
// - toggles (true/false) enables or disables view selector on top of the BOM
function insertBOM(id, title, link , defaultView, quantity, reset, toggles, views) {

    // used by configurator.js, variants.js
    // add property data-default-value to div to set default view by name

    if(typeof id            === 'undefined')          id = 'bom';
    if(typeof toggles       === 'undefined')     toggles = false;
    if(typeof quantity      === 'undefined')    quantity = false;
    if(typeof reset         === 'undefined')       reset = false;
    if(typeof views         === 'undefined')       views = false;
    if(typeof defaultView   === 'undefined') defaultView = elemBOM.attr('data-default-view');
    

    let elemBOM = $('#' + id);
        elemBOM.attr('data-link', link);
        elemBOM.addClass('panel');
        elemBOM.html('');

    let elemHeader = $('<div></div>');
        elemHeader.addClass('panel-header');
        elemHeader.appendTo(elemBOM);

    let elemTitle = $('<div></div>');
        elemTitle.attr('id', id + '-title');
        elemTitle.addClass('panel-title');
        elemTitle.html(title);
        elemTitle.appendTo(elemHeader);

    let elemToolbar = $('<div></div>');
        elemToolbar.attr('id', id + '-toolbar');
        elemToolbar.addClass('panel-toolbar');
        elemToolbar.appendTo(elemHeader);


    if(reset) {

        let elemReset = $('<div></div>');
            elemReset.addClass('button');
            elemReset.addClass('icon');
            elemReset.addClass('xs');
            elemReset.attr('id', id + '-action-reset');
            elemReset.html('block');
            elemReset.appendTo(elemToolbar);
            elemReset.click(function() {
                bomReset($(this));
            });

    }

    if(toggles) {

        let elemExpand = $('<div></div>');
            elemExpand.addClass('button');
            elemExpand.addClass('icon');
            elemExpand.addClass('xs');
            elemExpand.attr('id', id + '-action-expand-all');
            elemExpand.attr('title', 'Expand all BOM tree nodes');
            elemExpand.html('unfold_more');
            elemExpand.appendTo(elemToolbar);
            elemExpand.click(function() {
                bomExpandAll($(this));
            });

        let elemCollapse = $('<div></div>');
            elemCollapse.addClass('button');
            elemCollapse.addClass('icon');
            elemCollapse.addClass('xs');
            elemCollapse.attr('id', id + '-action-collapse-all');
            elemCollapse.attr('title', 'Collapse all BOM tree nodes');
            elemCollapse.html('unfold_less');
            elemCollapse.appendTo(elemToolbar);
            elemCollapse.click(function() {
                bomCollapseAll($(this));
            });

    }

    let elemSelect = $('<select></select>');
        elemSelect.attr('id', id + '-view-selector');
        elemSelect.addClass('bom-view-selector');
        elemSelect.appendTo(elemToolbar);
        elemSelect.change(function() {
            setBOMDisplay(id);
        });

    let elemProcess = $('<div></div>');
        elemProcess.attr('id', id + '-processing');
        elemProcess.addClass('processing');
        elemProcess.append($('<div class="bounce1"></div>'));
        elemProcess.append($('<div class="bounce2"></div>'));
        elemProcess.append($('<div class="bounce2"></div>'));
        elemProcess.appendTo(elemBOM);

    let elemContent = $('<div></div>');
        elemContent.attr('id', id + '-content');
        elemContent.addClass('panel-content');
        elemContent.appendTo(elemBOM);

    let elemTree = $('<div></div>');
        elemTree.attr('id', id + '-tree');
        elemTree.appendTo(elemContent);

    let elemTable = $('<table></table');
        elemTable.attr('id', id + '-table');
        elemTable.attr('cellspacing', 0);
        elemTable.attr('data-link', link);
        elemTable.attr('data-show-quantity', quantity);
        elemTable.appendTo(elemContent);

    $.get('/plm/bom-views-and-fields', { 'link' : link }, function(response) {

        for(view of response.data) {

            let elemOption = $('<option></option>');
                elemOption.html(view.name);
                elemOption.attr('value', view.id);
                elemOption.appendTo(elemSelect);

            if(typeof defaultView !== undefined) {
                if(view.name === defaultView) {
                    elemSelect.val(view.id);
                }
            }

        }

        if(views === false) elemSelect.hide();

        setBOMDisplay(id);

    });

}
function setBOMDisplay(id) {

    $('#' + id).show();
    
    let elemTable = $('#' + id + '-table');
        elemTable.html('');
        
    let link         = elemTable.attr('data-link').split('/')

    let params = {
        'wsId'          : link[4],
        'dmsId'         : link[6],
        'depth'         : 10,
        'revisionBias'  : 'release',
        'viewId'        : $('#' + id + '-view-selector').val()
    }

    let promises = [ 
        $.get('/plm/bom-view-fields', params),
        $.get('/plm/bom'            , params),
        $.get('/plm/bom-flat'       , params)
    ];

    Promise.all(promises).then(function(responses) {

        urnsBOMFields = [];

        for(field of responses[0].data) {

            if(field.fieldId === 'QUANTITY') urnsBOMFields.quantity = field.__self__.urn;
            else if(field.fieldId === config.viewer.fieldIdPartNumber) urnsBOMFields.partNumber = field.__self__.urn;

        }

        $('#' + id + '-processing').hide();

        insertNextBOMLevel(responses[1].data, elemTable, responses[1].data.root);
    
        $('#' + id).find('.bom-tree-nav').click(function(e) {
    
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

                            if(e.shiftKey) elemNext.find('.bom-tree-nav').removeClass('collapsed');
    
                            // let elemToggle = elemNext.children().first().find('i.bom-nav');
    
                            // if(elemToggle.length > 0) {
                            //     if(elemToggle.hasClass('collapsed')) {
                            //         // elemToggle.hasClass('collapsed').removeClass('collapsed');
                            //         levelHide = levelNext + 1;
                            //     }
                            // }
    
                        }
    
                    } else {
                        elemNext.hide();
                    }
    
                }
            } while(levelNext > level);
    
    
        });
    
        elemTable.find('tr').click(function(e) {
            selectBOMItem(e, $(this));
        });

        bomDisplayDone(id);

    });

}
function insertNextBOMLevel(bom, elemTable, parent) {

    let result = false;

    for(edge of bom.edges) {

        if(edge.parent === parent) {

            result = true;

            let partNumber  = getBOMCellValue(edge.child, urnsBOMFields.partNumber, bom.nodes);
            let quantity    = getBOMEdgeValue(edge, urnsBOMFields.quantity, null, 0);

            let elemRow = $('<tr></tr>');
                elemRow.attr('data-number', edge.itemNumber);
                elemRow.attr('data-part-number', partNumber);
                elemRow.attr('data-quantity', quantity);
                elemRow.attr('data-number', edge.itemNumber);
                elemRow.appendTo(elemTable);
    
            for(node of bom.nodes) {
                if(node.item.urn === edge.child) {
                    elemRow.attr('data-dmsId',      node.item.link.split('/')[6]);
                    elemRow.attr('data-link',       node.item.link);
                    elemRow.attr('data-edgeId',     edge.edgeId);
                    elemRow.attr('data-edge-Link',  edge.edgeLink);
                    elemRow.attr('data-level',      edge.depth);
                    elemRow.addClass('bom-level-' + edge.depth);
                }
            }

            let elemCell = $('<td></td>');
                elemCell.appendTo(elemRow);

            let elemCellNumber = $('<span></span>');
                elemCellNumber.addClass('bom-tree-number');
                elemCellNumber.html(edge.depth + '.' + edge.itemNumber);
                elemCellNumber.appendTo(elemCell);

            let elemCellTitle = $('<span></span>');
                elemCellTitle.addClass('bom-tree-title');
                elemCellTitle.html(getBOMItemTitle(edge.child, bom.nodes));
                elemCellTitle.appendTo(elemCell);

            let showQuantity = elemTable.attr('data-show-quantity');

            if(showQuantity) {

                let elemCellQuantity = $('<td></td>');
                    elemCellQuantity.addClass('bom-quantity');
                    elemCellQuantity.html(quantity);
                    elemCellQuantity.appendTo(elemRow);

            }

            let hasChildren = insertNextBOMLevel(bom, elemTable, edge.child);

            elemRow.children().first().each(function() {
                
                $(this).addClass('bom-first-col');

                if(hasChildren) {

                    let elemNav = $('<span></span>');
                        elemNav.addClass('bom-tree-nav');
                        elemNav.addClass('icon');
                        elemNav.addClass('expanded');
                        elemNav.prependTo($(this));

                    elemRow.addClass('node');

                }

                let elemColor = $('<span></span>');
                    elemColor.addClass('bom-tree-color');
                    elemColor.prependTo($(this));

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
function bomReset(elemClicked) {

    let elemToolbar = elemClicked.closest('.panel-toolbar');
    let elemContent = elemToolbar.nextAll('.panel-content');

    elemContent.find('tr.selected').click();

}
function bomExpandAll(elemClicked) {

    let elemToolbar = elemClicked.closest('.panel-toolbar');
    let elemContent = elemToolbar.nextAll('.panel-content');

    elemContent.find('tr').each(function() {
        $(this).show();
        $(this).find('.bom-tree-nav').removeClass('collapsed');
    });

}
function bomCollapseAll(elemClicked) {

    let elemToolbar = elemClicked.closest('.panel-toolbar');
    let elemContent = elemToolbar.nextAll('.panel-content');

    elemContent.find('tr').each(function() {
        if($(this).children('th').length === 0) {
            if(!$(this).hasClass('bom-level-1')) {
                $(this).hide();
            }
        }
        $(this).find('.bom-tree-nav').addClass('collapsed');
    });

}


// Insert Flat BOM into given domId
function insertFlatBOM(id, link, bomViewName, fieldIdPartNumber, showMore, classNames) {

    let elemParent = $('#' + id + '-list');
        elemParent.html('');

    if(link === null) return;
    if(link === ''  ) return;

    if(typeof fieldIdPartNumber === 'undefined') fieldIdPartNumber = null;
    
    let elemProgress = $('#' + id + '-processing');
        elemProgress.show();

    let params = {
        'link'          : link,
        'revisionBias'  : 'release'
    }

    if((typeof bomViewName === 'undefined') || (bomViewName === null) || (bomViewName === '')) {
        
        $.get('/plm/bom-views', params, function(response) {
            let view = response.data[0].link.split('/');
            params.viewId = view[view.length - 1];
            insertFlatBOMTable(params, elemParent, elemProgress, null, showMore, classNames);
        });

    } else {

        $.get('/plm/bom-views-and-fields', params, function(response) {
            for(view of response.data) {
                if(view.name === bomViewName) {

                    params.viewId = view.id;

                    let fieldURNPartNumber = null;

                    for(field of view.fields) {
                        if(field.fieldId === fieldIdPartNumber) fieldURNPartNumber = field.__self__.urn;
                    }

                    insertFlatBOMTable(params, elemParent, elemProgress, fieldURNPartNumber, showMore, classNames);

                }
            }
        });

    }

}
function insertFlatBOMTable(params, elemParent, elemProgress, fieldURNPartNumber, showMore, classNames) {

    $.get('/plm/bom-flat', params, function(response) {

        for(item of response.data) {

            let itemLink   = item.item.link.split('/');
            let partNumber = (fieldURNPartNumber === null) ? item.item.title.split(' - ')[0] : getFlatBOMCellValue(response.data, item.item.link, fieldURNPartNumber);

            let elemItem = $('<div></div>');
                elemItem.addClass('bom-item');
                elemItem.appendTo(elemParent);
                elemItem.attr('data-wsid' , itemLink[itemLink.length - 3]);
                elemItem.attr('data-dmsid', itemLink[itemLink.length - 1]);
                elemItem.attr('data-link', item.item.link);
                elemItem.attr('data-title', item.item.title);
                elemItem.attr('data-part-number', partNumber);
                elemItem.click(function(e) {
                    selectBOMItem(e, $(this));
                });

            for(className of classNames) elemItem.addClass(className);

            let elemItemTitle = $('<div></div>');
                elemItemTitle.addClass('bom-item-title');
                elemItemTitle.html(item.item.title);
                elemItemTitle.appendTo(elemItem);

            let elemItemQty = $('<div></div>');
                elemItemQty.addClass('bom-item-qty');
                elemItemQty.html(item.totalQuantity);
                elemItemQty.appendTo(elemItem);

            let elemItemActions = $('<div></div>');
                elemItemActions.addClass('bom-item-actions');
                elemItemActions.appendTo(elemItem);

            if(showMore) {

                let elemItemMore = $('<span></span>');
                    elemItemMore.addClass('bom-show-more');
                    elemItemMore.addClass('icon');
                    elemItemMore.addClass('icon-chevron-right');
                    elemItemMore.appendTo(elemItemActions);
                    elemItemMore.click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        showMoreBOMItem($(this));
                    });

            }

        }

        elemProgress.hide();

    });

}
function selectBOMItem(e, elemSelected) {}
function showMoreBOMItem(elemClicked) {

    let elemItem        = elemClicked.closest('.bom-item');

    $('#bom-list').addClass('invisible');
    $('#bom-item-details').removeClass('invisible');
    $('#button-bom-reset').hide();
    $('#button-bom-back').removeClass('hidden');
    $('#bom-item-details-header').html(elemItem.attr('data-title'));
    $('#bom-item-details-sections').html('');

    insertItemDetailsFields('bom-item-details',  elemItem.attr('data-link'),  null, null, null, false, false, false);

}


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
function insertChangeProcesses(link, id) {

    // Used by explorer.js and services.js

    if(typeof id === 'undefined') id = 'processes';

    let elemParent = $('#' + id + '-list');
        elemParent.html('');
        elemParent.closest('.panel').attr('data-link', link);

    $('#' + id + '-processing').show();

    $.get('/plm/changes', { 'link' : link }, function(response) {

             if(response.data.statusCode === 403) return;
        else if(response.data.statusCode === 404) return;

        if(response.params.link === link) {

            $('#' + id + '-processing').hide();

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
                    elemProcess.attr('data-link', link);
                    elemProcess.attr('data-urn', process.item.urn);
                    elemProcess.appendTo(elemParent);
                    elemProcess.click(function() {
                        openItemByURN($(this).attr('data-urn'));
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
            
                            getImageFromCache(elemImage, { 'link' : linkImage }, 'schema', function() {});
        
                            date = date.split('T')[0].split('-');
                            let creationDate = new Date(date[0], date[1], date[2]);
            
                            elemProcess.find('.tile-title').first().html(response.data.workspace.title);
                            elemProcess.find('.tile-subtitle').first().html(response.data.title);
                            elemProcess.find('.process-status').first().html('Status : ' + response.data.currentState.title);
                            elemProcess.find('.process-creator').first().html('Created by ' + user + ' on ' + creationDate.toLocaleDateString());
            
                        }
                    });
                });
            }
        }
    });

}


// Insert Relationship Items (used by explorer.js)
function insertRelationships(elemParent, relationships) {

    // Used by services.js

    elemParent.html('');

    if(relationships.length === 0) return;

    for(relationship of relationships) {
        relationship.sort = relationship['item'].title;
    }

    sortArray(relationships, 'sort', 'string', 'descending');

    for(relationship of relationships) {

        let link    = relationship.item.link;
        let status  = relationship.state.title;
       // let user = process['first-workflow-history'].user.title;
       // let date = process['first-workflow-history'].created;

        let elemItem = $('<div></div>');
            elemItem.addClass('animation');
            elemItem.addClass('relationship');
            elemItem.attr('data-link', link);
            elemItem.attr('data-urn', relationship.item.urn);
            elemItem.appendTo(elemParent);
            elemItem.click(function() {
                openItemByURN($(this).attr('data-urn'));
            });

        let elemItemImage = $('<div></div>');
            elemItemImage.addClass('tile-image');
            elemItemImage.appendTo(elemItem);

        let elemItemDetails = $('<div></div>');
            elemItemDetails.addClass('tile-details');
            elemItemDetails.appendTo(elemItem);

        let elemItemWorkspace = $('<div></div>');
            elemItemWorkspace.addClass('tile-title');
            elemItemWorkspace.appendTo(elemItemDetails);

        let elemItemDescriptor = $('<div></div>');
            elemItemDescriptor.addClass('tile-subtitle');
            elemItemDescriptor.appendTo(elemItemDetails);

        let elemItemData = $('<div></div>');
            elemItemData.addClass('tile-data');
            elemItemData.appendTo(elemItemDetails);

        let elemItemStatus = $('<div></div>');
                elemItemStatus.addClass('tile-status');
                elemItemStatus.appendTo(elemItemData);

        let elemItemDescription = $('<div></div>');
            elemItemDescription.addClass('tile-description');
            elemItemDescription.appendTo(elemItemData);


        $.get('/plm/details', { 'link' : link}, function(response) {

            $('.relationship').each(function() {
                
                let elemItem = $(this);

                if(elemItem.attr('data-link') === link) {
    
                    elemItem.removeClass('animation');
    
                    // let description = getSectionFieldValue(response.data.sections, 'DESCRIPTION', '');
                    // let priority    = getSectionFieldValue(response.data.sections, 'FLAG', '');
                    let linkImage   = getFirstImageFieldValue(response.data.sections);
                    let elemImage   = elemItem.find('.tile-image').first();
    
                    getImageFromCache(elemImage, { 'link' : linkImage }, 'schema', function() {});

                    // date = date.split('T')[0].split('-');
                    // let creationDate = new Date(date[0], date[1], date[2]);
    
                    elemItem.find('.tile-title').first().html(response.data.workspace.title);
                    elemItem.find('.tile-subtitle').first().html(response.data.title);
                    elemItem.find('.tile-description').first().html(getSectionFieldValue(response.data.sections, 'DESCRIPTION', ''));
                    // // elemProcess.find('.process-description').first().html(description);
                    // // elemProcess.find('.process-priority').first().html($('<div></div>').html(priority).text());
                    elemItem.find('.tile-status').first().html('Status : ' + status);
                    // elemItem.find('.process-creator').first().html('Created by ' + user + ' on ' + creationDate.toLocaleDateString());
    
                }
            });
    
        });

    }

}


// Set options of defined select element to trigger workflow action
function insertWorkflowActions(link, hideEmpty) {

    if(typeof hideEmpty === 'undefined') hideEmpty = false;

    let elemActions = $('#workflow-actions');
        elemActions.addClass('disabled');
        elemActions.attr('disabled', '');
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
function getBookmarkStatus(elemBookmark) {

    if(typeof elemBookmark === 'undefined') elemBookmark = $('#bookmark');
    if(elemBookmark.length === 0) return;

    elemBookmark.removeClass('active');

    let link = elemBookmark.closest('.panel').attr('data-link');

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
    
    let dmsId = elemBookmark.closest('.panel').attr('data-link').split('/')[6];

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