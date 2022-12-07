// Library file to contain reusable methods for various UIs
let picklists = [];
let cacheSections = [];


// Insert Item Details (created for client.js)
function insertItemDetails(elemParent, sections, fields, data, editable, hideComputed, hideReadOnly) {

    elemParent.html('');

    if(editable === null) editable = true;
    if(hideComputed === null) hideComputed = false;
    if(hideReadOnly === null) hideReadOnly = false;

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
                                            insertField(wsField, elemFields, hideComputed, hideReadOnly, data, editable);
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                for(wsField of fields) {
                    if(wsField.urn === sectionField.urn)
                        insertField(wsField, elemFields, hideComputed, hideReadOnly, data, editable);
                }
            }
        }

        if(elemFields.children().length === 0) {
            elemFields.hide();
            elemSection.hide();
        }

    }

}


// Insert field to match PLM field
function insertField(field, elemParent, hideComputed, hideReadOnly, itemData, editable) {

    if(field.visibility !== 'NEVER') {

        if(field.editability !== 'NEVER' || !hideReadOnly) {

            if(!field.formulaField || !hideComputed) {

                let value    = null;
                let urn      = field.urn.split('.');
                let fieldId  = urn[urn.length - 1];
                let readonly = (!editable || field.editability === 'NEVER' || (field.editability !== 'ALWAYS' && (typeof itemData === 'undefined')) || field.formulaField);

                let elemInput = $('<div></div>');
                    elemInput.addClass('field');
                    elemInput.appendTo(elemParent);

                let elemLabel = $('<div></div>');
                    elemLabel.addClass('field-label');
                    elemLabel.html(field.name);
                    elemLabel.appendTo(elemInput);

                let elemValue = $('<input>');

                if(itemData !== null) { if(typeof itemData !== 'undefined') {
                    for(nextSection of itemData.sections) {
                        for(itemField of nextSection.fields) {
                            urn = itemField.urn.split('.');
                            let itemFieldId = urn[urn.length - 1];
                            if(fieldId === itemFieldId) {
                                value = itemField.value;
                                break;
                            }
                        }
                    }
                }}

                switch(field.type.title) {

                    case 'Single Line Text':
                        if(field.formulaField) {
                            elemValue = $('<div></div>');
                            elemValue.addClass('computed');
                            elemValue.html($('<div></div>').html(value).text());
                        } else {
                            elemValue = $('<input>');
                            elemValue.addClass('string');
                            if(value !== null) elemValue.val(value);
                            if(field.fieldLength !== null) {
                                elemValue.attr('maxlength', field.fieldLength);
                                elemValue.css('max-width', field.fieldLength * 8 + 'px');
                            }
                        }
                        break;

                    case 'Auto Number':
                        elemValue = $('<input>');
                        elemValue.addClass('string');
                        if(value !== null) elemValue.val(value);
                        break;

                    case 'Paragraph':
                        elemValue = $('<textarea></textarea>');
                        if(value !== null) elemValue.val(value);
                        break;

                    case 'URL':
                        if(editable) {
                            if(value !== null) elemValue.val(value);
                        } else {
                            elemValue = $('<div></div>');
                            elemValue.addClass('link');
                            if(value !== '') {
                                elemValue.attr('onclick', 'openURL("' + value + '")');
                                elemValue.html(value);
                            }
                        }
                        break;

                    case 'Integer':
                        elemValue = $('<input>');
                        elemValue.addClass('integer');
                        if(value !== null) elemValue.val(value);
                        break;
                        
                    case 'Float':
                    case 'Money':
                        elemValue = $('<input>');
                        elemValue.addClass('float');
                        if(value !== null) elemValue.val(value);
                        break;

                    case 'Date':
                        elemValue = $('<input>');
                        elemValue.attr('type', 'date');
                        elemValue.addClass('date');
                        if(value !== null) elemValue.val(value);
                        break;
                        
                    case 'Check Box':
                        elemValue.attr('type', 'checkbox');
                        elemValue.addClass('checkbox');
                        if(value !== null) if(value === 'true') elemValue.attr('checked', true);
                        break;

                    // case 'Multiple Selection':
                    //     console.log(field);
                    //     break;

                    case 'Single Selection':
                        if(editable) {
                            elemValue = $('<select>');
                            elemValue.addClass('picklist');

                            let elemOptionBlank = $('<option></option>');
                            elemOptionBlank.attr('value', null);
                            elemOptionBlank.appendTo(elemValue);

                            getOptions(elemValue, field.picklist, fieldId, 'select', value);
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

                    case 'Image':
                        elemValue = $('<div></div>');
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

                    case 'BOM UOM Pick List':
                        if(editable) {
                            
                            elemValue = $('<select>');
                            elemValue.addClass('picklist');

                            let elemOptionBlank = $('<option></option>');
                                elemOptionBlank.attr('value', null);
                                elemOptionBlank.appendTo(elemValue);

                            getOptions(elemValue, field.picklist, fieldId, 'select', value);

                        } else {
                            elemValue = $('<div></div>');
                            elemValue.addClass('string');
                            if(value !== null) {
                                elemValue.html(value.title);
                                if(field.type.link === '/api/v3/field-types/28') {
                                    elemValue.attr('data-item-link', value.link);
                                }
                            }
                            if(field.type.link === '/api/v3/field-types/28') elemValue.addClass('bom-uom');
                        }
                        break;

                    default:
                        console.log('Unhandled field type : ' + field.type.title);
                        break;

                }

                elemValue.addClass('field-value');
                elemValue.attr('data-id', fieldId);
                elemValue.attr('data-link', field.__self__);
                elemValue.appendTo(elemInput);

                if(readonly) {
                    elemValue.attr('readonly', true);
                    elemValue.attr('disabled', true);
                } else {
                    elemInput.addClass('editable');
                }

                if(field.unitOfMeasure !== null) {
                    
                    elemInput.addClass('with-text');

                    let elemText = $('<div></div>');
                        elemText.addClass('field-text');
                        elemText.html(field.unitOfMeasure);
                        elemText.appendTo(elemInput);

                } 

                if(field.fieldValidators !== null) {
                    for(validator of field.fieldValidators) {
                        if(validator.validatorName === 'required') {
                            elemInput.addClass('required');
                        } else if(validator.validatorName === 'dropDownSelection') {
                            elemInput.addClass('required');
                        } else if(validator.validatorName === 'maxlength') {
                            elemValue.attr('maxlength', validator.variables.maxlength);
                        }
                    }
                }

            }
        }
    }

}
function getImage(elemParent, value) {

    if(value === null) return;
                        
    $.get( '/plm/image', { 'link' : value.link }, function(response) {
                            
        let elemImage = $("<img class='thumbnail' src='data:image/png;base64," + response.data + "'>");
            elemImage.appendTo(elemParent);
                            
    });

}
function getOptions(elemParent, link, fieldId, type, value) {

    for(picklist of picklists) {
        if(picklist.link === link) {
            insertOptions(elemParent, picklist.data, fieldId, type, value);
            return;
        }
    }

    $.get( '/plm/picklist', { 'link' : link, 'limit' : 100, 'offset' : 0 }, function(response) {
        if(!response.error) {
            picklists.push({
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

            let elemRadio = $('<div></div>');
                elemRadio.addClass('radio-option');
                elemRadio.appendTo(elemParent);

            let elemInput = $('<input>');
                elemInput.attr('type', 'radio');
                elemInput.attr('id', option.link);
                elemInput.attr('value', option.link);
                elemInput.attr('name', fieldId);
                elemInput.appendTo(elemRadio);

            let elemLabel = $('<label></label>');
                elemLabel.addClass('radio-label');
                elemLabel.attr('for', option.link);
                elemLabel.html(option.title);
                elemLabel.appendTo(elemRadio);

            if(value !== null) {
                if(value.link === option.link) elemInput.attr('checked', true);
            }

        } else if(type === 'select') {

            let elemOption = $('<option></option>');
                elemOption.attr('id', option.link);
                elemOption.attr('value', option.link);
                elemOption.html(option.title);
                elemOption.appendTo(elemParent);

            if(value !== null) {
                if(value.link === option.link) elemOption.attr('selected', true);
            }

        }
    
    }
}



// Clear all input controls
// used by Change Impact Analysis
function clearAllFields(id) {

    let elemParent = $('#' + id);

    elemParent.find('.field-value').each(function() {
        $(this).val('');
    });

}


// Set value of input control to match database value
// used by Change Impact Analysis
function setFieldValue(field) {

    let fieldId = field.__self__.split('/')[8];

    $('.field-value').each(function() {

        if($(this).attr('data-id') === fieldId) {

            let value = field.value;

            if(typeof field.value === 'object') value = field.value.link;

            $(this).val(value);

        }

    });


}


// Get input value to update database
function getFieldInternalValue(elemInput) {

    if(elemInput.hasClass('picklist')) {
        return {
            'link' : elemInput.val()
        }
    } else return elemInput.val();

}


// Parse details page to create record (created for client.js)
function submitCreateForm(wsId, elemParent, callback) {

    let params = { 
        'wsId'     : wsId,
        'sections' : getSectionsPayload(elemParent) 
    };

    $.post({
        url : '/plm/create', 
        contentType : "application/json",
        data : JSON.stringify(params)
    }, function(response) {

        callback(response);

        // if(idDialog === 'create-project') {
        //     console.log('link to open projcéct : ' + data);
        //     openProject(data);
        // } else {

        // }
    });

}
function submitEdit(link, elemParent, callback) {

    let params = { 
        'link'     : link,
        'sections' : getSectionsPayload(elemParent) 
    };

    console.log(params);

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

            let elemValue   = $(this).children('.field-value').first();
            let value       = elemValue.val();
            let fieldId     = elemValue.attr('data-id');
            let type        = 'string';

            if(elemValue.find('.radio-option').length > 0) {
                if($('input[name="' + fieldId + '"]:checked').length > 0) {
                    if($('input[name="' + fieldId + '"]:checked').val() !== '') {
                        value = {
                            'link' : $('input[name="' + fieldId + '"]:checked').val()
                        };
                    } else value = null;
                } else value = null;
            } else if(elemValue.hasClass('picklist')) {
                if(elemValue.val() === '') {
                    value = null;
                } else {
                    value = {
                        'link' : elemValue.val()
                    };
                    type ='picklist';
                }
            } else if(elemValue.hasClass('float')) {
                if(value === '') value = null; else value = parseFloat(value);
                type = 'float';
            } else if(elemValue.hasClass('integer')) {
                if(value === '') value = null; else value = Number(value);
                type = 'integer';
            } else if(elemValue.hasClass('checkbox')) {
                value = (value === 'on') ? 'true' : 'false';
            }

            if(value !== null) {
                if(typeof value !== 'undefined') {
                    if(value !== '') {
                        section.fields.push({
                            'fieldId'   : fieldId,
                            'value'     : value,
                            'type'      : type
                        });
                    }
                }
            }

        });

        if(section.fields.length > 0) sections.push(section);

    });

    return sections;

}





// Insert attachments as tiles (create for client.js)
function insertAttachments(elemParent, attachments, split) {

    elemParent.html('');

    if(typeof split === 'undefined') split = false;

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

            let elemClicked = $(this).closest('.item');
            let elemAttachment = $(this).closest('.attachment');
            let fileExtension = elemAttachment.attr('data-extension');

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



// Insert related processes (used by explorer.js)
function insertChangeProcesses(elemParent, processes) {

    elemParent.html('');

    for(process of processes) {

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
    
                    // let description = getSectionFieldValue(response.data.sections, 'DESCRIPTION', '');
                    // let priority    = getSectionFieldValue(response.data.sections, 'FLAG', '');
                    let linkImage   = getFirstImageFieldValue(response.data.sections);
                    let elemImage   = elemProcess.find('.tile-image').first();
    
                    getImageFromCache(elemImage, { 'link' : linkImage }, 'schema', function() {});

                    date = date.split('T')[0].split('-');
                    let creationDate = new Date(date[0], date[1], date[2]);
    
                    elemProcess.find('.tile-title').first().html(response.data.workspace.title);
                    elemProcess.find('.tile-subtitle').first().html(response.data.title);
                    // // elemProcess.find('.process-description').first().html(description);
                    // // elemProcess.find('.process-priority').first().html($('<div></div>').html(priority).text());
                    elemProcess.find('.process-status').first().html('Status : ' + response.data.currentState.title);
                    elemProcess.find('.process-creator').first().html('Created by ' + user + ' on ' + creationDate.toLocaleDateString());
    
                }
            });
    
        });

    }

}


// Insert BOM Tree with controls
/*function insertBOM(link, title) {

    let elemBOM = $('#bom');
        elemBOM.attr('data-link', link);

    let elemHeader = $('<div></div>');
        elemHeader.addClass('panel-header');
        elemHeader.appendTo(elemBOM);

    let elemTitle = $('<div></div>');
        elemTitle.attr('id', 'bom-title');
        elemTitle.addClass('panel-title');
        elemTitle.html(title);
        elemTitle.appendTo(elemHeader);

    let elemToolbar = $('<div></div>');
        elemToolbar.attr('id', 'bom-toolbar');
        elemToolbar.addClass('panel-toolbar');
        elemToolbar.appendTo(elemHeader);

    let elemSelect = $('<select></select>');
        elemSelect.attr('id', 'bom-view-selector');
        elemSelect.appendTo(elemToolbar);
        elemSelect.change(function() {
            console.log('setting bom data');
            getBOMData('bom', 'bom-view-selector');
        });

    let elemProcess = $('<div></div>');
        elemProcess.attr('id', 'bom-process');
        elemProcess.addClass('loading');
        elemProcess.append($('<div class="bounce1"></div>'));
        elemProcess.append($('<div class="bounce2"></div>'));
        elemProcess.append($('<div class="bounce2"></div>'));
        elemProcess.appendTo(elemBOM);

    let elemTree = $('<div></div>');
        elemTree.attr('id', 'bom-tree');
        elemTree.appendTo(elemBOM);

    let elemTable = $('<table></table');
        elemTable.attr('id', 'bom-table');
        elemTable.attr('cellspacing', 0);
        elemTable.appendTo(elemBOM);

    $.get('/plm/bom-views-and-fields', { 'link' : link }, function(response) {

        for(view of response.data) {

            let elemOption = $('<option></option>');
                elemOption.html(view.name);
                elemOption.attr('value', view.id);
                elemOption.appendTo(elemSelect);

        }

        setBOMDisplay('bom', 'bom-view-selector');

    });

}
function setBOMDisplay(idBOM, idSelector) {

    $('#' + idBOM).find('.loading').show();

    let elemRoot = $('#bom-table');
        elemRoot.html('');

    let params = {
        'link'          : $('#' + idBOM).attr('data-link'),
        'depth'         : 10,
        'revisionBias'  : 'release',
        'viewId'        : $('#' + idSelector).val()
    }

    console.log(params);

    let promises = [ $.get('/plm/bom', params) ];

    if(!$('#bom').hasClass('basic')) promises.push($.get('/plm/bom-view-fields', params));

    Promise.all(promises).then(function(responses) {

        console.log(responses[0]);
        //console.log(responses[1]);

        $('#' + idBOM).find('.loading').hide();

        // setBOMDisplay(responses[0].data, responses[1].data);

        console.log($('#bom').hasClass('basic'));

        if ($('#bom').hasClass('basic')) {

            console.log('insertBOMTree GO');

            insertBOMTree(responses[0].data, elemRoot);
    
        } else {
    
            insertHeader();
        }
    
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
    
        elemRoot.find('tr').click(function() {
            selectBOMItem($(this));
        });

    });

// }
// function setBOMDisplay(fields, bom) {





}
function insertBOMTree(bom, elemRoot) {

    console.log('insertBOMTree START');

    insertNextBOMLevel(bom, elemRoot, 'urn:adsk.plm:tenant.workspace.item:' + tenant.toUpperCase() + '.' + wsId + '.' + dmsId);
    
}
function insertNextBOMLevel(bom, elemRoot, parent) {

    console.log('insertNextBOMLevel START');

    let result = false;

    for(edge of bom.edges) {

        if(edge.parent === parent) {

            result = true;

            // let isSparePart = getBOMCellValue(edge.child, urns.isSparePart, bom.nodes);
            let partNumber  = getBOMCellValue(edge.child, urns.partNumber, bom.nodes);
            let link        = getBOMNodeLink(edge.child, bom.nodes);

            console.log(partNumber);
            console.log(link);

            // console.log(bom);

            let elemRow = $('<tr></tr>');
                elemRow.attr('data-number', edge.itemNumber);
                elemRow.attr('data-part-number', partNumber);
                elemRow.attr('data-qty', '1');
                elemRow.attr('data-status', 'match');
                elemRow.appendTo(elemRoot);
    
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

            let hasChildren = insertNextBOMLevel(bom, elemRoot, edge.child, flatBom);

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
*/



// Functions to handle BOM requests data
function getBOMCellValue(urn, key, nodes, property) {

    // used by explorer.js & service.js

    for(node of nodes) {
        if(node.item.urn === urn) {
            for(field of node.fields) {
                if(field.metaData.urn === key) {
                    if(typeof field.value === 'object') {
                        if(typeof property === 'undefined') return field.value.link;
                        else return field.value[property];
                    } else if(typeof field.value !== 'undefined') {
                        return field.value;
                    } else {
                        return '';
                    }

                }
            }
        }
    }

    return '';
    
}
function getFlatBOMCellValue(flatBom, link, key, property) {

    for(item of flatBom) {

        if(item.item.link === link) {

            for(field of item.occurrences[0].fields) {
                
                if(field.metaData.urn === key) {

                    if(typeof field.value === 'object') {
                        if(typeof property === 'undefined') return field.value.link;
                        else return field.value[property];
                    } else if(typeof field.value !== 'undefined') {
                        return field.value;
                    } else {
                        return '';
                    }

                }
            }
        }
    }

    return '';
    
}



// Insert Flat BOM into given domId
// Used by Design Reviews and Product Portfolio
function insertFlatBOM(idParent, idProgress, link, showMore, classNames) {

    let elemParent = $('#' + idParent);
        elemParent.html('');

    if(link === null) return;
    if(link === '') return;

    let elemProgress = $('#' + idProgress);
        elemProgress.show();
        
    let linkSplit = link.split('/');

    let params = {
        'wsId'          : linkSplit[4],
        'dmsId'         : linkSplit[6],
        'revisionBias'  : 'release'
    }

    $.get('/plm/bom-views', params, function(response) {

        let view = response.data[0].link.split('/');

        params.viewId = view[view.length - 1];

        $.get('/plm/bom-flat', params, function(response) {

            for(item of response.data) {

                let itemLink = item.item.link.split('/');
                let partNumber = item.item.title.split(' - ')[0];

                let elemItem = $('<div></div>');
                    elemItem.addClass('bom-item');
                    elemItem.appendTo(elemParent);
                    elemItem.attr('data-wsid' , itemLink[itemLink.length - 3]);
                    elemItem.attr('data-dmsid', itemLink[itemLink.length - 1]);
                    elemItem.attr('data-link', item.item.link);
                    elemItem.attr('data-title', item.item.title);
                    elemItem.attr('data-part-number', partNumber);
                    elemItem.click(function() {
                        selectBOMItem($(this));
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
                        elemItemMore.addClass('material-symbols-sharp');
                        elemItemMore.html('chevron_right');
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

    });

}



function insertHeader() {
    
    
    

    // for(field of fields) {
    
    //          if(field.fieldId === 'NUMBER')          urns.partNumber     = field.__self__.urn;
    //     else if(field.fieldId === 'THUMBNAIL')       urns.thumbnail      = field.__self__.urn;
    //     else if(field.fieldId === 'IS_SPARE_PART')   urns.isSparePart    = field.__self__.urn;
    //     else if(field.fieldId === 'SPARE_PART')      urns.sparePart      = field.__self__.urn;
    //     else if(field.fieldId === 'MAINTENANCE_KIT') urns.maintenanceKit = field.__self__.urn;
    //     else if(field.fieldId === 'TITLE')           urns.title          = field.__self__.urn;
    //     else if(field.fieldId === 'DESCRIPTION')     urns.description    = field.__self__.urn;
    //     else if(field.fieldId === 'DIMENSIONSSIZE')  urns.dimensions     = field.__self__.urn;
    //     else if(field.fieldId === 'MASS')            urns.mass           = field.__self__.urn;

    // }

    // insertNextBOMLevel(bom, elemRoot, 'urn:adsk.plm:tenant.workspace.item:' + tenant.toUpperCase() + '.' + wsId + '.' + dmsId, flatBom);

    // $('.bom-nav').click(function(e) {

    //     e.stopPropagation();
    //     e.preventDefault();

    //     let elemItem  = $(this).closest('tr');
    //     let level     = Number(elemItem.attr('data-level'));
    //     let levelNext = level - 1;
    //     let levelHide = 10000;
    //     let elemNext  = $(this).closest('tr');
    //     let doExpand  = $(this).hasClass('collapsed');

    //     $(this).toggleClass('collapsed');
        
    //     do {

    //         elemNext  = elemNext.next();
    //         levelNext = Number(elemNext.attr('data-level'));

    //         if(levelNext > level) {

    //             if(doExpand) {

    //                 if(levelHide > levelNext) {

    //                     elemNext.show();

    //                     let elemToggle = elemNext.children().first().find('i.bom-nav');

    //                     if(elemToggle.length > 0) {
    //                         if(elemToggle.hasClass('collapsed')) {
    //                             levelHide = levelNext + 1;
    //                         }
    //                     }

    //                 }

    //             } else {
    //                 elemNext.hide();
    //             }

    //         }
    //     } while(levelNext > level);


    // });

    // $('tr').click(function() {
    //     selectBOMItem($(this));
    // });

}
/*function insertNextBOMLevelremove(bom, elemRoot, parent, flatBom) {

    let result = false;

    for(edge of bom.edges) {

        if(edge.parent === parent) {

            result = true;

            let isSparePart = getBOMCellValue(edge.child, urns.isSparePart, bom.nodes);
            let partNumber  = getBOMCellValue(edge.child, urns.partNumber, bom.nodes);
            let link        = getBOMNodeLink(edge.child, bom.nodes);

            // console.log(bom);

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

                    let stockLabel  = 'In stock';
                    let stockClass  = 'normal';
                    let stockRandom = Math.floor(Math.random() * 3) + 1;

                    if(stockRandom === 2) { stockLabel = 'Low stock'; stockClass = 'low'; }
                    else if(stockRandom === 3) { stockLabel = 'Out of stock'; stockClass = 'none'; }

                    let elemSparePart = $('<div></div>');
                        elemSparePart.addClass('spare-part');
                        elemSparePart.addClass('spare-part-stock-' + stockClass);
                        elemSparePart.attr('data-link', link);
                        elemSparePart.attr('data-part-number', partNumber);
                        elemSparePart.appendTo($('#items-list'));

                    let elemSparePartToggle = $('<div></div>');
                        elemSparePartToggle.addClass('spare-part-toggle');
                        elemSparePartToggle.appendTo(elemSparePart);

                    let elemSparePartCheckEmpty = $('<i></i>');
                        elemSparePartCheckEmpty.addClass('spare-part-check');
                        elemSparePartCheckEmpty.addClass('zmdi');
                        elemSparePartCheckEmpty.addClass('zmdi-square-o');
                        elemSparePartCheckEmpty.appendTo(elemSparePartToggle);

                    let elemSparePartCheck = $('<i></i>');
                        elemSparePartCheck.addClass('spare-part-check');
                        elemSparePartCheck.addClass('zmdi');
                        elemSparePartCheck.addClass('zmdi-check-square');
                        elemSparePartCheck.appendTo(elemSparePartToggle);
                        
                    let elemSparePartImage = $('<div></div>');
                        elemSparePartImage.addClass('spare-part-image');
                        elemSparePartImage.appendTo(elemSparePart);

                    let valueImage = getFlatBOMCellValue(flatBom, link, urns.thumbnail);
                    let linkImage = (valueImage === '') ? '' : valueImage.link;

                    getImageFromCache(elemSparePartImage, { 'link' : linkImage }, 'zmdi-wallpaper', function() {});

                    if(linkImage === '') {
                        $.get('/plm/details', { 'link' : link}, function(response) {
                            linkImage  = getFirstImageFieldValue(response.data.sections);
                            $('.spare-part').each(function() {
                                if($(this).attr('data-link') === link) {
                                    let elemSparePartImage = $(this).find('.spare-part-image').first();
                                    getImageFromCache(elemSparePartImage, { 'link' : linkImage }, 'zmdi-wallpaper', function() {});
                                }
                            });
                        });
                    }

                    let elemSparePartDetails = $('<div></div>');
                        elemSparePartDetails.addClass('spare-part-details');
                        elemSparePartDetails.appendTo(elemSparePart);

                    let elemSparePartNumber = $('<div></div>');
                        elemSparePartNumber.addClass('spare-part-number');
                        elemSparePartNumber.html(getBOMCellValue(edge.child, urns.partNumber, bom.nodes));
                        elemSparePartNumber.appendTo(elemSparePartDetails);
                    
                    let elemSparePartTitle = $('<div></div>');
                        elemSparePartTitle.addClass('spare-part-title');
                        elemSparePartTitle.addClass('nowrap');
                        elemSparePartTitle.html(getBOMCellValue(edge.child, urns.title, bom.nodes));
                        elemSparePartTitle.appendTo(elemSparePartDetails);
                    
                    // let elemSparePartDescription = $('<div></div>');
                    //     elemSparePartDescription.html(getBOMCellValue(edge.child, urns.description, bom.nodes));
                    //     elemSparePartDescription.appendTo(elemSparePartDetails);
                    
                    let elemSparePartDimensions = $('<div></div>');
                        elemSparePartDimensions.html(getBOMCellValue(edge.child, urns.dimensions, bom.nodes));
                        elemSparePartDimensions.appendTo(elemSparePartDetails);
                    
                    let elemSparePartWeight = $('<div></div>');
                        elemSparePartWeight.html(getBOMCellValue(edge.child, urns.mass, bom.nodes));
                        elemSparePartWeight.appendTo(elemSparePartDetails);

                    let elemSparePartSide = $('<div></div>');
                        elemSparePartSide.addClass('spare-part-side');
                        elemSparePartSide.appendTo(elemSparePart);

                    let elemSparePartStock = $('<div></div>');
                        elemSparePartStock.addClass('spare-part-stock');
                        elemSparePartStock.html(stockLabel);
                        elemSparePartStock.appendTo(elemSparePartSide);

                    let elemSparePartShowMe = $('<div></div>');
                        elemSparePartShowMe.addClass('button');
                        elemSparePartShowMe.addClass('spare-part-show');
                        elemSparePartShowMe.html('Zoom');
                        elemSparePartShowMe.appendTo(elemSparePartSide);
                        elemSparePartShowMe.click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            let elemSelected = $(this).closest('.spare-part');
                            let link = elemSelected.attr('data-link');
                            viewerResetColors();
                            viewerSelectModel(elemSelected.attr('data-part-number'), true);
                            $('#bom-reset').show();
                            $('#bom-tree').children().each(function() {
                                if($(this).attr('data-link') === link) $(this).addClass('selected'); else $(this).removeClass('selected');
                            });
                        });

                    $('.wear-part').each(function() {

                        let elemWearPart = $(this);

                        if(elemWearPart.attr('data-part-number') === partNumber) {
                            elemWearPart.attr('data-link', link);
                            elemWearPart.find('.wear-part-descriptor').first().html(partNumber);
                            let elemWearPartImage = elemWearPart.find('.wear-part-image').first();
                            getImageFromCache(elemWearPartImage, { 'link' : linkImage }, 'zmdi-wallpaper', function() {});
                            elemWearPart.click(function() {
                                let link = $(this).attr('data-link');
                                // viewerResetColors();
                                // viewerSelectModel($(this).attr('data-part-number'), true);
                                // $('#bom-reset').show();
                                $('#bom-table').children().each(function() {
                                    console.log($(this).attr('data-link'));
                                    if($(this).attr('data-link') === link) { 
                                        $(this).click();
                                        $(this).get(0).scrollIntoView();
                                    }

                                //     if($(this).attr('data-link') === link) $(this).addClass('selected'); else $(this).removeClass('selected');
                                });

                            });
                        }
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

            let hasChildren = insertNextBOMLevel(bom, elemRoot, edge.child, flatBom);

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


}*/



// Open URL in new tab
function openURL(url) {
    window.open(url);
}



// Open item in new tab based on URN or LINK provided
function openItemByURN(urn) {
    
    let data  = urn.split(':')[3].split('.');

    let url  = 'https://' + data[0] + '.autodeskplm360.net';
        url += '/plm/workspaces/' + data[1];
        url += '/items/itemDetails?view=full&tab=details&mode=view&itemId=urn%60adsk,plm%60tenant,workspace,item%60';
        url += data[0] + ',' + data[1] + ',' + data[2];

    window.open(url, '_blank');

}
function openItemByLink(link) {
    
    let data  = link.split('/');

    let url  = 'https://' + tenant + '.autodeskplm360.net';
        url += '/plm/workspaces/' + data[4];
        url += '/items/itemDetails?view=full&tab=details&mode=view&itemId=urn%60adsk,plm%60tenant,workspace,item%60';
        url += tenant + ',' + data[4] + ',' + data[6];

    console.log(url);

    window.open(url, '_blank');

}


// Togggle item bookmark
function getBookmarkStatus(elemBookmark, urn) {
    $.get('/plm/bookmarks', function(response) {
        for(bookmark of response.data.bookmarks) {
            if(bookmark.item.urn === urn) {
                elemBookmark.addClass('active');
            }
        }
    });
}
function toggleBookmark(elemBookmark, dmsId) {
    console.log(dmsId);
    if(elemBookmark.hasClass('active')) {
        $.get('/plm/remove-bookmark', { 'dmsId' : dmsId }, function (response) {
            elemBookmark.removeClass('active');
        });
    } else {
        $.get('/plm/add-bookmark', { 'dmsId' : dmsId, 'comment' : ' ' }, function (response) {
            elemBookmark.addClass('active');
        });
    }
}



// Retrieve field value from item's sections data
function getSectionFieldValue(sections, fieldId, defaultValue, property) {

    if(typeof sections === 'undefined') return defaultValue;
    if(sections === null)   return defaultValue;

    for(section of sections) {
        for(field of section.fields) {
            let id = field.__self__.split('/')[10];
            if(id === fieldId) {

                let value = field.value;

                if(typeof value === 'undefined') return defaultValue;
                if(value === null) return defaultValue;

                if(typeof value === 'object') {

                    if(typeof property === 'undefined') return field.value.link;
                    else return field.value[property];
                    
                } else if(field.type.title === 'Paragraph') {

                    var txt = document.createElement("textarea");
                        txt.innerHTML = field.value;
                    return txt.value;

                } else {

                    return field.value;
                }

            }

        }
    }

    return defaultValue;

}


// Retrieve section id of given field
function getFieldSectionId(sections, fieldId) {

    let result = -1;

    for(section of sections) {

        for(field of section.fields) {

            if(field.type === 'MATRIX') {
                for(matrix of section.matrices) {
                    for(matrixFields of matrix.fields) {
                        for(matrixField  of matrixFields) {
                            if(matrixField !== null) {

                                let temp = matrixField.link.split('/');
                                let id   = temp[temp.length - 1];
                                            
                                if(id === fieldId) {
                                    result = section.__self__.split('/')[6];
                                    break;
                                }

                            }
                        }
                    }
                }
            } else {

                let temp = field.link.split('/');
                let id   = temp[temp.length - 1];
                    
                if(id === fieldId) {
                    result = section.__self__.split('/')[6];
                    break;
                }
            }
            
                
        }   

    }

    return result;

}


// Retrieve field value from bom's nodes data
function getNodeFieldValue(node, fieldId, defaultValue, property) {

    if(typeof node === 'undefined') return defaultValue;
    if(node === null)   return defaultValue;

    for(field of node.fields) {
        
        let id = field.metaData.link.split('/')[10];

        if(id === fieldId) {

            let value = field.value;

            if(typeof value === 'undefined') return defaultValue;
            if(value === null) return defaultValue;

            // if(typeof value === 'object') {

            //     if(typeof property === 'undefined') return field.value.link;
            //     else return field.value[property];
                
            // } else if(field.type.title === 'Paragraph') {

            //     var txt = document.createElement("textarea");
            //         txt.innerHTML = field.value;
            //     return txt.value;

            // } else {

                return field.value;
            // }

        }

    }

    return defaultValue;

}


// Retrieve first image field value from item's sections data
function getFirstImageFieldValue(sections) {

    if(typeof sections === 'undefined') return '';
    if(sections === null)   return '';

    for(section of sections) {
        for(field of section.fields) {
            if(field.type.title === 'Image') {
                if(field.value !== null) return field.value.link;
            }
        }
    }

    return '';

}


// Display image from cache, use defined placeholder icon while processing
function getImageFromCache(elemParent, params, icon, onclick) {

    let elemIcon = $('<span></span>');
        elemIcon.addClass('material-symbols-sharp');
        elemIcon.html(icon);
        elemIcon.appendTo(elemParent);

    if(typeof params === 'undefined')  return;

    if(typeof params.link === 'undefined') {
        if(typeof params.dmsId === 'undefined') return;
        else if(params.dmsId === '') return;
    } else if(params.link === '') return;

    $.get('/plm/image-cache', params, function(response) {

        elemParent.html('');

        let elemImage = $('<img>');
            elemImage.attr('src', response.data.url);
            elemImage.appendTo(elemParent);
            elemImage.click(function() {
                onclick($(this));
            });

    });

}


// Retrieve field value from item's grid row data
function getGridRowValue(row, fieldId, defaultValue, property) {

    for(var i = 1; i < row.rowData.length; i++) {

        let field   = row.rowData[i];
        let id      = field.__self__.split('/')[10];

        if(id === fieldId) {

            let value = field.value;

            if(typeof value === 'undefined') return defaultValue;
            if(value === null) return defaultValue;

            if(typeof value === 'object') {

                if(typeof property === 'undefined') return field.value.link;
                else return field.value[property];
                
            } else if(field.type.title === 'Paragraph') {

                var txt = document.createElement("textarea");
                    txt.innerHTML = field.value;
                return txt.value;

            } else {

                return field.value;
            }

        }

    }

    return defaultValue;

}


// Get bookmark status of given item
function setBookmark(urn, id) {

    $('#' + id).removeClass('active');

    $.get('/plm/bookmarks', function(response) {
        for(bookmark of response.data.bookmarks) {
            if(bookmark.item.urn === urn) {
                $('#' + id).addClass('active');
            }
        }
    });

}


// Filter list with simple input
function filterList(value, elemList) {

    elemList.children().each(function() {

        let text = $(this).html().toLowerCase();

        if(text.indexOf(value) > -1) $(this).show();
        else $(this).hide();

    });

}


// Generate Tile HTML
function genTile(link, urn, image, icon, title, subtitle) {

    let elemTile = $('<div></div>');
        elemTile.addClass('tile');

    if(link !== '') elemTile.attr('data-link', link);
    if(urn  !== '') elemTile.attr('data-urn', urn);

    let elemTileImage = $('<div></div>');
        elemTileImage.addClass('tile-image');
        elemTileImage.appendTo(elemTile);

    let elemTileDetails = $('<div></div>');
        elemTileDetails.addClass('tile-details');
        elemTileDetails.appendTo(elemTile);

    let elemTileTitle = $('<div></div>');
        elemTileTitle.addClass('tile-title');
        elemTileTitle.html(title);
        elemTileTitle.appendTo(elemTileDetails);

    let elemTileText = $('<div></div>');
        elemTileText.addClass('tile-subtitle');
        elemTileText.html(subtitle);
        elemTileText.appendTo(elemTileDetails);
        
    getImageFromCache(elemTileImage, { 'link' : image }, icon, function() {});

    return elemTile;

}


// Append further fields to HTML tile
function appendTileDetails(elemTile, data) {

    
    
    let elemDetails = elemTile.find('.tile-details').first();
    

    let elemData = $('<div></div>');
        elemData.addClass('tile-data');
        elemData.appendTo(elemDetails);


    for(field of data) {

        let elemAppend = $('<div></div>');
        elemAppend.html(field[1]);
    
        if(field[0] !== '') elemAppend.addClass(field[0]);
        
        if((field[1] !== '' ) || field[2]) elemAppend.appendTo(elemData);
        
    
    }
}


// Reset current page
function resetPage() {

    let location = document.location.href.split('/');

    let url = location[0] + '//' + location[2] + '/mbom';
        url += '?options=' + options;
        url += '&wsId=' + wsId;
        url += '&dmsId=' + dmsId;

    document.location.href = url;

}