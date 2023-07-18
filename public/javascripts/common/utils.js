let languageId  = '1';
let isiPad      = navigator.userAgent.match(/iPad/i)   != null;
let isiPhone    = navigator.userAgent.match(/iPhone/i) != null;


$(document).ready(function() {  
        
    insertAvatar();  
    enableTabs();
    enablePanelToggles();
    enableBookmark();
    enableOpenInNew();

    $('#header-logo'    ).click(function() { reloadPage(); });
    $('#header-title'   ).click(function() { reloadPage(); });
    $('#header-subtitle').click(function() { reloadPage(); });

});



// Validate if given variable is null or empty
function isBlank(value) {

    if(typeof value === 'undefined') return true;
    if(       value === null       ) return true;
    if(       value === ''         ) return true;

    return false;

}


// Insert progress indicator
function appendProcessing(id, hidden) {

    if(typeof hidden === 'undefined') hidden = true;

    let elemParent = $('#' + id);

    let elemProcessing = $('<div></div>');
        elemProcessing.addClass('processing');
        elemProcessing.attr('id', id + '-processing');
        elemProcessing.appendTo(elemParent);

    if(hidden) elemProcessing.hide();

    let elemBoune1 = $('<div></div>');
        elemBoune1.addClass('bounce1');
        elemBoune1.appendTo(elemProcessing);

    let elemBoune2 = $('<div></div>');
        elemBoune2.addClass('bounce2');
        elemBoune2.appendTo(elemProcessing);

    let elemBoune3 = $('<div></div>');
        elemBoune3.addClass('bounce3');
        elemBoune3.appendTo(elemProcessing);

}



// Insert overlay with progress indicator
function appendOverlay(hidden) {

    if(typeof hidden === 'undefined') hidden = true;

    let elemOverlay = $('<div></div>');
        elemOverlay.attr('id', 'overlay');
        elemOverlay.appendTo('body');

    let elemProcessing = $('<div></div>');
        elemProcessing.addClass('processing');
        elemProcessing.attr('id', 'overlay-processing');
        elemProcessing.appendTo(elemOverlay);

    let elemBoune1 = $('<div></div>');
        elemBoune1.addClass('bounce1');
        elemBoune1.appendTo(elemProcessing);

    let elemBoune2 = $('<div></div>');
        elemBoune2.addClass('bounce2');
        elemBoune2.appendTo(elemProcessing);

    let elemBoune3 = $('<div></div>');
        elemBoune3.addClass('bounce3');
        elemBoune3.appendTo(elemProcessing);

    if(!hidden) elemOverlay.show();

}



// Insert messaging and process indicator for the viewer
function appendViewerProcessing() {
    
    let elemViewer = $('#viewer');
    
    if(elemViewer.length === 0) return;
    
    let elemWrapper = $('<div></div>');
        elemWrapper.attr('id', 'viewer-processing');
        elemWrapper.insertAfter(elemViewer);

    let elemProcessing = $('<div></div>');
        elemProcessing.addClass('processing');
        elemProcessing.appendTo(elemWrapper);

    let elemBoune1 = $('<div></div>');
        elemBoune1.addClass('bounce1');
        elemBoune1.appendTo(elemProcessing);

    let elemBoune2 = $('<div></div>');
        elemBoune2.addClass('bounce2');
        elemBoune2.appendTo(elemProcessing);

    let elemBoune3 = $('<div></div>');
        elemBoune3.addClass('bounce3');
        elemBoune3.appendTo(elemProcessing);

    let elemMessage = $('<div></div>');
        elemMessage.attr('id', 'viewer-message');
        elemMessage.insertAfter(elemViewer);

    let elemMessageIcon = $('<span></span>');
        elemMessageIcon.addClass('icon');
        elemMessageIcon.html('view_in_ar');
        elemMessageIcon.appendTo(elemMessage);

    let elemMessageText = $('<span></span>');
        elemMessageText.html('No Viewble Found');
        elemMessageText.appendTo(elemMessage);

    let classNames = elemViewer.attr('class');

    if(typeof classNames !== 'undefined') {
        if(classNames !== '') {
            classNames = classNames.split(' ');
            for(className of classNames) {
                elemWrapper.addClass(className);
                elemMessage.addClass(className);
            }
        }
    }

}



// Reset current page
function reloadPage() {

    document.location.href = document.location.href;

}



// Display Error Message on top
function showErrorMessage(message, title) {

    if(typeof title === 'undefined') title = 'Error';

    let elemError = $('<div></div>');
        elemError.attr('id', 'error');
        elemError.appendTo($('body'));
        elemError.click(function() {
            $(this).fadeOut();
        });

    let elemErrorTitle = $('<div></div>');
        elemErrorTitle.addClass('error-title');
        elemErrorTitle.html(title);
        elemErrorTitle.appendTo(elemError);

    let elemErrorMessage = $('<div></div>');
        elemErrorMessage.addClass('error-message');
        elemErrorMessage.html(message);
        elemErrorMessage.appendTo(elemError);

    let elemErrorFooter = $('<div></div>');
        elemErrorFooter.addClass('error-footer');
        elemErrorFooter.html('Click this message to close it');
        elemErrorFooter.appendTo(elemError);

    elemError.fadeIn();

    $('.processing').hide();
    $('#overlay').hide();

}



// Handle tabs
function enableTabs() {

    $('.tabs').siblings('.panel-content').addClass('hidden');

    $('.tabs').children().click(function() {
        selectTab($(this));
    });

    $('.tabs').each(function() {
        if(!$(this).hasClass('no-auto-select')) $(this).children().first().click();
    });

}
function selectTab(elemSelected) {

    let index     = elemSelected.index() + 0;
    let elemPanel = elemSelected.closest('.panel');
    
    elemPanel.find('.panel-content').addClass('hidden');
    elemPanel.find('.panel-content').eq(index).removeClass('hidden');

    elemSelected.addClass('selected').siblings().removeClass('selected');

}



// Handle panel toggles
function enablePanelToggles() {

    $('.panel-toggles').children().click(function() {
        selectToggle($(this));
    });

    $('.panel-toggles').each(function() {
        $(this).children().first().click();
    });

}
function selectToggle(elemSelected) {

    let index     = elemSelected.index() + 0;
    let elemPanel = elemSelected.closest('.panel');
    
    elemPanel.find('.panel-content').addClass('hidden');
    elemPanel.find('.panel-content').eq(index).removeClass('hidden');

    elemSelected.addClass('selected').siblings().removeClass('selected');

}


// Enable open in new for panels
function enableOpenInNew() {

    let elemButton = $('#open');

    if(elemButton.length === 0) return;

    elemButton.click(function() {

        let link = $(this).closest('.panel').attr('data-link');
        openItemByLink(link);

    });

}


// Enable bookmark button
function enableBookmark() {
    
    let elemButton = $('#bookmark');

    if(elemButton.length === 0) return;

    elemButton.click(function() {
        toggleBookmark($(this));
    });

}


// Sort array by defined key
function sortArray(array, key, type, direction) {

    if(typeof type      === 'undefined') type = 'string';
    if(typeof direction === 'undefined') type = 'ascending';

    if(direction === 'ascending') {

        array.sort(function(a, b){

            var nameA=a[key], nameB=b[key];

            if(type.toLowerCase() === 'string') nameA=a[key].toLowerCase(), nameB=b[key].toLowerCase()

            // var nameA=a[key].toLowerCase(), nameB=b[key].toLowerCase()
            if (nameA < nameB) //sort string ascending
                return -1 
            if (nameA > nameB)
                return 1
            return 0 //default return value (no sorting)
        });

    } else {

        array.sort(function(a, b){

            var nameA=a[key], nameB=b[key]

            if(type.toLowerCase() === 'string') nameA=a[key].toLowerCase(), nameB=b[key].toLowerCase()

            if (nameA > nameB) //sort string ascending
                return -1 
            if (nameA < nameB)
                return 1
            return 0 //default return value (no sorting)

        });

    }

}


// Determine browser language
function getBrowserLanguage() {

    // used by portfolio.js

    switch(navigator.language.toLowerCase()) {
        case 'es'   :   languageId = '2'; break;
        case 'es-es':   languageId = '2'; break;
        case 'fr'   :   languageId = '3'; break;
        case 'fr-fr':   languageId = '3'; break;
        case 'de'   :   languageId = '4'; break;
        case 'de-de':   languageId = '4'; break;
    }

}


// Generate Tile HTML
function genTile(link, urn, image, icon, title, subtitle) {

    // used by portfolio.js

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

    // used by reviews.js

    let elemDetails = elemTile.find('.tile-details').first();

    let elemData = $('<div></div>');
        elemData.addClass('tile-data');
        elemData.appendTo(elemDetails);

    for(field of data) {

        let elemAppend = $('<div></div>');
            elemAppend.html(field[1]);



        if(field[0] !== '') {
            let classNames = field[0].split(' ');
            for(className of classNames) elemAppend.addClass(className);
        //     elemAppend.html(field[1]);
        // } else {

        //     let elemIcon = $('<span></span>');
        //         elemIcon.addClass('tile-data-icon');
        //         elemIcon.addClass('icon');
        //         elemIcon.addClass(field[0]);
        //         elemIcon.appendTo(elemAppend);

        //     let elemText = $('<span></span>');
        //         elemText.addClass('tile-data-text');
        //         elemText.html(field[1]);
        //         elemText.appendTo(elemAppend);

        }

        if((field[1] !== '' ) || field[2]) elemAppend.appendTo(elemData);
    
    }
}




// Filter list or tiles while typing
function filterTiles(idFilter, idTiles) {

    let filter = $('#' + idFilter).val().toUpperCase();

    if(filter === '') {

        $('#' + idTiles).children().show();
        
    } else {
        
        $('#' + idTiles).children().each(function ()  {
            
            let content  = $(this).find('.tile-title').html();
                content += $(this).find('.tile-subtitle').html(); 
            
            $(this).find('.tile-data').children().each(function() {
                content += $(this).html();  
            })
                        
            content = content.toUpperCase();
            
            let hide = (content.indexOf(filter) >= 0) ? false : true;
            
            if(hide) $(this).hide();
            else     $(this).show();
            
        });

    }

}
function filterList(value, elemList) {

    // used by mbom.js, client.js

    elemList.children().each(function() {

        let text = $(this).html().toLowerCase();

        if(text.indexOf(value) > -1) $(this).show();
        else $(this).hide();

    });

}
function filterTableColumns(value, idTable) {

    let elemTable = $('#' + idTable);

    elemTable.find('th').hide();
    elemTable.find('td').hide();

    value = value.toLowerCase();

    elemTable.find('.item-descriptor').each(function() {

        let text = $(this).html().toLowerCase();

        if(text.indexOf(value) > -1) {

            let index = $(this).parent().attr('data-index');
            $('.item-' + index).show();

        }

    });

    elemTable.find('td').each(function() {

        if($(this).children('.image').length === 0) {

            let text = $(this).html().toLowerCase();

            if($(this).children('input').length === 1) text = $(this).children('input').val().toLowerCase();
            else if($(this).children('textarea').length === 1) text = $(this).children('textarea').val().toLowerCase();

            if(text.indexOf(value) > -1) {

                let index = $(this).index();
                    index = elemTable.find('th').eq(index).attr('data-index');

                $('.item-' + index).show();

            }
        }

    });

    elemTable.find('td.first-col').show();
    elemTable.find('th').first().show();

}



// Open item in new tab based on URN, LINK or IDs provided
function openItemByURN(urn) {
    
    let data  = urn.split(':')[3].split('.');

    let url  = 'https://' + data[0] + '.autodeskplm360.net';
        url += '/plm/workspaces/' + data[1];
        url += '/items/itemDetails?view=full&tab=details&mode=view&itemId=urn%60adsk,plm%60tenant,workspace,item%60';
        url += data[0] + ',' + data[1] + ',' + data[2];

    window.open(url, '_blank');

}
function openItemByLink(link) {

    if(link === '') return;
    
    let data  = link.split('/');

    let url  = 'https://' + tenant + '.autodeskplm360.net';
        url += '/plm/workspaces/' + data[4];
        url += '/items/itemDetails?view=full&tab=details&mode=view&itemId=urn%60adsk,plm%60tenant,workspace,item%60';
        url += tenant.toUpperCase() + ',' + data[4] + ',' + data[6];

    window.open(url, '_blank');

}
function openItemByID(wsId, dmsId) {
    
    let url  = 'https://' + tenant + '.autodeskplm360.net';
        url += '/plm/workspaces/' + wsId;
        url += '/items/itemDetails?view=full&tab=details&mode=view&itemId=urn%60adsk,plm%60tenant,workspace,item%60';
        url += tenant + ',' + wsId + ',' + dmsId;

    window.open(url, '_blank');

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



// Retrieve field value from item's sections data
function getSectionFieldValue(sections, fieldId, defaultValue, property) {

    // Used by mbom.js

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

                    if(Array.isArray(value)) return value;
                    else if(typeof property === 'undefined') return field.value.link;
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



// Functions to handle BOM requests data
function getBOMCellValue(urn, key, nodes, property) {

    // used by configuratorjs, explorer.js, service.js, variants.js

    if(urn === '') return '';

    for(node of nodes) {
        if(node.item.urn === urn) {
            for(field of node.fields) {
                if((field.metaData.urn === key) || (field.metaData.link === key)) {
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
function getBOMEdgeValue(edge, key, property, defaultValue) {

    // used by configurator.js

    if(typeof defaultValue === 'undefined') defaultValue = '';

    for(field of edge.fields) {
        if(field.metaData.urn === key) {
            if(typeof field.value === 'object') {
                if(typeof property === 'undefined') return field.value.link;
                else return field.value[property];
            } else if(typeof field.value !== 'undefined') {
                return field.value;
            } else {
                return defaultValue;
            }
        }
    }

    return defaultValue;
    
}


// Retrieve field value from item's grid row data
function getGridRowValue(row, fieldId, defaultValue, property) {

    // used by configurator.js

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


// Retrieve field value from tableau data
function getTableauFieldValue(row, fieldId, defaultValue, property) {

    if(typeof row === 'undefined') return defaultValue;
    if(row === null)   return defaultValue;

    for(field of row.fields) {

        if(field.id === fieldId) {

            let value = field.value;

            if(typeof value === 'undefined') return defaultValue;
            if(value === null) return defaultValue;

            return field.value;

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
        elemIcon.addClass('icon');
        elemIcon.html(icon);
        elemIcon.appendTo(elemParent);

    if(typeof params === 'undefined')  return;
    if(params === null)  return;

    if(typeof params.link === 'undefined') {
        if(typeof params.dmsId === 'undefined') return;
        else if(params.dmsId === '') return;
    } else if(params.link === '') { return; 
    } else if(params.link === null) return;

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


// Add new field to sections payload, adds given section if new
function addFieldToPayload(payload, sections, elemField, fieldId, value) {

    if(isBlank(value)) {
        if(isBlank(elemField)) {
            return;
        }   
    }

    let sectionId   = getFieldSectionId(sections, fieldId);
    let isNew       = true;
    let fieldData   = {
        'fieldId' : fieldId,
        'value'   : value
    };

    if(!isBlank(elemField)) fieldData = getFieldValue(elemField);

    for(section of payload) {
        if(section.id === sectionId) {
            isNew = false;
            section.fields.push(fieldData);
        }
    }

    if(isNew) {
        payload.push({
            'id'    : sectionId,
            'fields': [fieldData]
        })
    }

}



// Convert URN to link
function convertURN2Link(urn) {

    if(isBlank(urn)) return '';

    let values = urn.split('.');

    return '/api/v3/workspaces/' + values[4] + '/items/' + values[5];


}



// Decode paragraph html tags
function decodeHtml(html) {
    var txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}