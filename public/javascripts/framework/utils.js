let userAccount     = { displayName : '', groupsAssigned : [] };
let languageId      = '1';
let username        = '';
let isiPad          = navigator.userAgent.match(/iPad/i)   != null;
let isiPhone        = navigator.userAgent.match(/iPhone/i) != null;


let settings = {
    details         : {},
    attachments     : {},
    bom             : {},
    flatBOM         : {},
    grid            : {},
    processes       : {},
    recents         : {},
    bookmarks       : {},
    mow             : {},
    workspaceViews  : {},
    workspaceItems  : {},
    workflowHistory : {}
}

const includesAny = (arr, values) => values.some(v => arr.includes(v));


$(document).ready(function() {  
          
         if(theme.toLowerCase() ===  'dark') { $('body').addClass( 'dark-theme'); theme =  'dark'; }
    else if(theme.toLowerCase() === 'black') { $('body').addClass('black-theme'); theme = 'black'; }
    else                                     { $('body').addClass('light-theme'); theme = 'light'; }

    insertAvatar();  
    enableTabs();
    enablePanelToggles();
    enableBookmark();
    enableOpenInNew();

    $('#header-logo'    ).click(function() { reloadPage(true); });
    $('#header-title'   ).click(function() { reloadPage(false); });
    $('#header-subtitle').click(function() { reloadPage(false); });

});


// Get list of disabled features
function getApplicationFeatures(app, requests, callback) {

    $('body').children().addClass('hidden');

    $('<div></div>').appendTo('body')
        .attr('id', 'startup')
        .addClass(getSurfaceLevel($('body')));

    $('<div></div>').appendTo($('#startup'))
        .attr('id', 'startup-logo');

    if(isBlank(config[app].features)) {
        $('body').children().removeClass('hidden');
        getApplicationFeaturesDone(app);
        callback();
    } else {

        requests.unshift($.get('/plm/groups-assigned', {}));

        Promise.all(requests).then(function(responses) {

        // $.get('/plm/groups-assigned', {}, function(response) {
            
            let settingsFeatures = config[app].features;
            
            for(let group of responses[0].data) userAccount.groupsAssigned.push(group.shortName);

            for(let feature of Object.keys(features)) {
                if(feature !== 'viewer') {
                    for(let settingFeature of Object.keys(settingsFeatures)) {
                        if(feature === settingFeature) {
                            if(typeof settingsFeatures[settingFeature] === 'object') {
                                features[feature] = includesAny(userAccount.groupsAssigned, settingsFeatures[settingFeature]);
                            } else features[feature] = settingsFeatures[settingFeature];
                        }
                    }
                }
            }

            if(!isBlank(features.viewer)) {
                if(!isBlank(settingsFeatures.viewer)) {
                    for(let feature of Object.keys(features.viewer)) {
                        for(let settingFeature of Object.keys(settingsFeatures.viewer)) {
                            if(feature === settingFeature) {
                                if(typeof settingsFeatures.viewer[settingFeature] === 'object') {
                                    features.viewer[feature] = includesAny(userAccount.groupsAssigned, settingsFeatures.viewer[settingFeature]);
                                } else features.viewer[feature] = settingsFeatures.viewer[settingFeature];
                            }
                        }
                    }
                }
            }          

            $('body').children().removeClass('hidden');
            getApplicationFeaturesDone(app);
            callback(responses);

        });
    }

}
function getApplicationFeaturesDone(app) {}


// Validate if given variable is null or empty
function isBlank(value) {

    if(typeof value === 'undefined') return true;
    if(       value === null       ) return true;
    if(       value === ''         ) return true;

    return false;

}
function isEmpty(value) {

    if(typeof value === 'undefined') return true;
    if(       value === null       ) return true;

    return false;

}


// Insert progress indicator
function appendProcessing(id, hidden) {

    if(isBlank(hidden)) hidden = true;

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


// Insert messaging and process indicator for the viewer
function appendViewerProcessing(id, hidden) {
    
    if(isBlank(id)) id = 'viewer';
    if(isBlank(hidden)) hidden = true;

    let elemViewer = $('#' + id);
    
    if(elemViewer.length === 0) return;
    
    let elemWrapper = $('<div></div>').insertAfter(elemViewer)
        .attr('id', 'viewer-processing')
        .addClass('viewer');
    
    let elemProcessing = $('<div></div>').appendTo(elemWrapper)
        .addClass('processing');

    $('<div></div>').appendTo(elemProcessing).addClass('bounce1');
    $('<div></div>').appendTo(elemProcessing).addClass('bounce2');
    $('<div></div>').appendTo(elemProcessing).addClass('bounce3');

    let elemMessage = $('<div></div>').insertAfter(elemViewer)
        .attr('id', 'viewer-message')
        .addClass('viewer');

    $('<span></span>').appendTo(elemMessage)
        .addClass('icon')
        .html('view_in_ar');

    $('<span></span>').appendTo(elemMessage)
        .html('No Viewble Found');

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


// Insert no data found messaage
function appendNoDataFound(id, icon, text) {

    if(typeof icon === 'undefined') icon = 'icon-no-data';
    if(typeof text === 'undefined') text = 'No data found';

    let elemParent = $('#' + id);

    let elemNoData = $('<div></div>').appendTo(elemParent)
        .addClass('no-data')
        .attr('id', id + '-no-data')
        .hide();
        
    $('<div></div>').appendTo(elemNoData)
        .addClass('no-data-icon')
        .addClass('icon')
        .addClass('filled')
        .addClass(icon);

    $('<div></div>').appendTo(elemNoData)
        .addClass('no-data-text')
        .html(text);

}


// Reset current page
function reloadPage(ret) {

    if(ret && (document.location.href !== document.referrer)) {
        document.location.href = document.referrer;
    } else {
        document.location.href = document.location.href;
    }

}


// Display Error & Success Message
function showErrorMessage(title, message) {

    if(isBlank(message)) { message = title; title = 'Error' };

    showMessage('error', title, message);

}
function showSuccessMessage(title, message) {

    if(isBlank(message)) { message = title; title = 'Success' };

    showMessage('success', title, message);

}
function showMessage(type, title, message) {

    let elemMessage = $('#message');

    if(elemMessage.length === 0) elemMessage = $('<div></div>').appendTo($('body'));

    elemMessage.html('');

    elemMessage.attr('id', 'message')
        .addClass('message')
        .addClass(type)
        .click(function() {
            $(this).fadeOut();
        });

    $('<div></div>').appendTo(elemMessage)
        .addClass('message-title')
        .html(title);

    $('<div></div>').appendTo(elemMessage)
        .addClass('message-text')
        .html(message);

    $('<div></div>').appendTo(elemMessage)
        .addClass('message-footer')
        .html('Click this message to close it');

    elemMessage.fadeIn();

    $('.processing').hide();
    $('#overlay').hide();

}


// Get CSS class defining the element's surface level
function getSurfaceLevel(elem) {

    if(elem.hasClass('surface-level-1')) return 'surface-level-1';
    if(elem.hasClass('surface-level-2')) return 'surface-level-2';
    if(elem.hasClass('surface-level-3')) return 'surface-level-3';
    if(elem.hasClass('surface-level-4')) return 'surface-level-4';
    if(elem.hasClass('surface-level-5')) return 'surface-level-5';

    if(elem.parent().hasClass('surface-level-1')) return 'surface-level-1';
    if(elem.parent().hasClass('surface-level-2')) return 'surface-level-2';
    if(elem.parent().hasClass('surface-level-3')) return 'surface-level-3';
    if(elem.parent().hasClass('surface-level-4')) return 'surface-level-4';
    if(elem.parent().hasClass('surface-level-5')) return 'surface-level-5';

    if(elem.parent().parent().hasClass('surface-level-1')) return 'surface-level-1';
    if(elem.parent().parent().hasClass('surface-level-2')) return 'surface-level-2';
    if(elem.parent().parent().hasClass('surface-level-3')) return 'surface-level-3';
    if(elem.parent().parent().hasClass('surface-level-4')) return 'surface-level-4';
    if(elem.parent().parent().hasClass('surface-level-5')) return 'surface-level-5';

    return 'surface-level-0';

}


// Set user profile picture
function insertAvatar() {

    let elemAvatar = $('#header-avatar');

    if(elemAvatar.length === 0) return;

    $.get('/plm/me', {}, function(response) {

        userAccount.displayName  = response.data.displayName;
        userAccount.email        = response.data.email;
        userAccount.organization = response.data.organization;
        
        elemAvatar.html('')
            .addClass('no-icon')
            .attr('title', response.data.displayName + ' @ ' + tenant)
            .css('background', 'url(' + response.data.image.large + ')')
            .css('background-position', 'center')
            .css('background-size', elemAvatar.css('height'));

        insertAvatarDone(response.data);


    });

}
function insertAvatarDone(data) {}


// Panel Header collapse / expand
function togglePanelHeader(elemClicked) {

    let elemToggle = elemClicked.find('.panel-header-toggle');
    elemToggle.toggleClass('icon-collapse').toggleClass('icon-expand');

    elemClicked.siblings().toggleClass('hidden');
    elemClicked.toggleClass('collapsed');

    elemClicked.parent().find('.highlight').removeClass('highlight');

}


// Handle tabs
function enableTabs() {

    $('.tabs').each(function() {
        let groupName = $(this).attr('data-tab-group');
        $('.' + groupName).addClass('hidden');
    });

    $('.tabs').children().click(function() {
        clickTab($(this));
    });

    $('.tabs').each(function() {
        if(!$(this).hasClass('no-auto-select')) $(this).children().first().click();
    });

}
function clickTab(elemClicked) {

    let index     = elemClicked.index() + 0;
    let elemTabs  = elemClicked.closest('.tabs');
    let groupName = elemTabs.attr('data-tab-group');

    $('.' + groupName).addClass('hidden');
    $('.' + groupName).eq(index).removeClass('hidden');

    elemClicked.addClass('selected').siblings().removeClass('selected');

}


// Handle panel toggles
function enablePanelToggles() {

    $('.panel-toggles').children().click(function() {
        clickPanelToggle($(this));
    });

    $('.panel-toggles').each(function() {
        $(this).children().first().click();
    });

}
function clickPanelToggle(elemSelected) {
    
    let id = elemSelected.attr('data-id');
    
    if(isBlank(id)) {
        
        let index     = elemSelected.index() + 0;
        let elemPanel = elemSelected.closest('.panel');
            elemPanel.find('.panel-content').addClass('hidden');
            elemPanel.find('.panel-content').eq(index).removeClass('hidden');

    }  else {
    
        $('#' + id).removeClass('hidden');

        elemSelected.siblings().each(function() {
            let idSibling = $(this).attr('data-id');
            if(!isBlank(idSibling)) $('#' + idSibling).addClass('hidden');
        })

    }

    elemSelected.addClass('selected').siblings().removeClass('selected');

}


// Insert Calendar Controls
function insertCalendarMonth(id, currentDate) {
    
    let elemCalendar    = $('#' + id);
    let elemTable       = $('<table></table>');
    let elemHead        = $('<thead></thead>');
    let elemRowMonth    = $('<tr></tr>');
    let elemRowDays     = $('<tr></tr>');
    let elemMonthName   = $('<th></th>');
    let elemBody        = $('<tbody></tbody;>');

    elemCalendar.append(elemTable);
       elemTable.append(elemHead);
       elemTable.append(elemBody);
        elemHead.append(elemRowMonth);
        elemHead.append(elemRowDays);

    elemRowMonth.append(elemMonthName);
    elemMonthName.attr('colspan', 8);
    elemMonthName.addClass('calendar-month-name');
    elemMonthName.html(currentDate.toLocaleString('default', { month: 'long' }));

    elemRowDays.append('<th></th>');
    elemRowDays.append('<th>Mo</th>');
    elemRowDays.append('<th>Tu</th>');
    elemRowDays.append('<th>We</th>');
    elemRowDays.append('<th>Th</th>');
    elemRowDays.append('<th>Fr</th>');
    elemRowDays.append('<th>Sa</th>');
    elemRowDays.append('<th>Su</th>');
  
    elemTable.addClass('calendar');

    let currentYear     = currentDate.getFullYear();
    let currentMonth    = currentDate.getMonth();
    let firstDay        = new Date(currentYear, currentMonth, 1);
    let lastDay         = new Date(currentYear, currentMonth + 1, 0);
    let currentDay      = firstDay;
    let startDay        = firstDay.getDay() - 1;
    let onejan          = new Date(currentYear, 0, 1);
    
    while (currentDay <= lastDay) {

        let week = Math.ceil((((currentDay.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
    
        let weekRow = $('<tr></tr>');
            weekRow.appendTo(elemBody);
        
        let weekCell = $('<td></td>');
            weekCell.addClass('calendar-week');
            weekCell.attr('data-date', currentDay);
            weekCell.html(week);
            weekCell.appendTo(weekRow);

        for (let i = 0; i < 7; i++) {

            let dayCell = $('<td></td>');
            let iDay    = currentDay.getDay();
            
            if(i >= startDay) {

                dayCell.attr('data-date', currentDay);
                if (currentDay >= firstDay && currentDay <= lastDay) {
                    if((iDay === 0) || (iDay === 6)) dayCell.addClass('calendar-weekend');
                    dayCell.html(currentDay.getDate());
                    if (currentDay.toDateString() === new Date().toDateString()) {
                        dayCell.addClass('calendar-day-current');
                        weekRow.addClass('calendar-week-current');
                    }
                }
                startDay = -1;
                currentDay.setDate(currentDay.getDate() + 1);
            }   

            dayCell.appendTo(weekRow);
            dayCell.addClass('calendar-day');

        }
    
    }

}


// Enable open in new for panels
function enableOpenInNew() {

    let elemButton = $('#open');

    if(elemButton.length === 0) return;

    elemButton.click(function() {

        let link = $(this).closest('.panel').attr('data-link');

        if($(this).closest('.panel').length === 0) link = $(this).closest('.screen').attr('data-link');

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

    if(typeof type      === 'undefined') type      = 'string';
    if(typeof direction === 'undefined') direction = 'ascending';

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


// Generate and return Panel Header
function genPanelHeader(id, headerToggle, headerLabel) {

    let elemHeader = $('<div></div>', {
        id : id + '-header'
    }).addClass('panel-header');

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

    return elemHeader;

}


// Generate Tile HTML
function genTile(link, urn, image, icon, title, subtitle) {

    let elemTile = $('<div></div>')
        .addClass('tile')
        .attr('data-title', title);

    if(link !== '') elemTile.attr('data-link', link);
    if(urn  !== '') elemTile.attr('data-urn',  urn );

    let elemTileImage   = $('<div></div>').appendTo(elemTile).addClass('tile-image');
    let elemTileDetails = $('<div></div>').appendTo(elemTile).addClass('tile-details');

    $('<div></div>').appendTo(elemTileDetails)
        .addClass('tile-title')
        .html(title);

    if(typeof subtitle !== 'undefined') {
        $('<div></div>')
            .addClass('tile-subtitle')
            .html(subtitle)
            .appendTo(elemTileDetails);
    }
        
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


// Search in list of tiles
function searchInTiles(id, elemInput) {

    let elemContent = $('#' + id + '-list');
    let filterValue = elemInput.val().toLowerCase();

    if(isBlank(filterValue)) {
        
        elemContent.children('.tile').show();
        elemContent.children('.workspace-items-group').show();
        elemContent.children('.workspace-items-group').find('.tile').show();

    } else {
        
        elemContent.children('.tile').hide();
        elemContent.children('.workspace-items-group').hide();
        elemContent.children('.workspace-items-group').find('.tile').hide();

        elemContent.children('.tile').each(function() {
            let elemTile = $(this);
            elemTile.find('.tile-details').children().each(function() {
                let value = $(this).html().toLowerCase();
                if(value.indexOf(filterValue) > -1) elemTile.show();
            });
        });

        elemContent.children('.workspace-items-group').each(function() {
            $(this).find('.tile').each(function() {
                let elemTile = $(this);
                elemTile.find('.tile-details').children().each(function() {
                    let value = $(this).html().toLowerCase();
                    if(value.indexOf(filterValue) > -1) {
                        elemTile.show();
                        $(this).closest('.workspace-items-group').show();
                    }
                });
            });
        });

    }    

}


// Retrieve configuration profile from settings based on workspace ID
function getProfileSettings(profiles, wsId) {

    let result = {};

    for(profile of profiles) {

        if(wsId === profile.wsId.toString()) {
            result = profile;
        }

    }

    return result;

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



// Get V1 search result field value
function getSearchResultFieldValue(item, fieldId, defaultValue) {

    if(isBlank(defaultValue)) defaultValue = ''; 

    for(field of item.fields.entry) {
        if(field.key === fieldId) {
            switch(field.fieldData.dataType) {
                case 'Image':
                    return field.fieldData.uri;
                default:
                    return field.fieldData.value;
            }
        }
    }

    return defaultValue;

}



// Get Workspace view record field value
function getWorkspaceViewRowValue(row, fieldId, defaultValue, property) {

    if(isBlank(row)) return defaultValue;

    for(let field of row.fields) {
        if(field.id === fieldId) {

            let value = field.value;

            if(isBlank(value)) return defaultValue;


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



// Retrieve field value from item's sections data
function getSectionFieldValue(sections, fieldId, defaultValue, property) {

    if(typeof sections === 'undefined') return defaultValue;
    if(sections === null) return defaultValue;

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

    if(urn === '') return '';

    for(let node of nodes) {
        if(node.item.urn === urn) {

            for(let field of node.fields) {
                if((field.metaData.urn === key) || (field.metaData.link === key)) {

                    if(field.value === null) { return '';
                    } else if(typeof field.value === 'object') {
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
function getBOMNodeValue(node, key, property) {

    for(let field of node.fields) {
        if((field.metaData.urn === key) || (field.metaData.link === key)) {

            if(field.value === null) { return '';
            } else if(typeof field.value === 'object') {
                if(typeof property === 'undefined') return field.value.link;
                else return field.value[property];
            } else if(typeof field.value !== 'undefined') {
                return field.value;
            } else {
                return '';
            }

        }
    }

    return '';
    
}
function getFlatBOMCellValue(flatBom, link, key, property) {

    for(let item of flatBom) {

        if(item.item.link === link) {

            for(let field of item.occurrences[0].fields) {
                
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

    if(typeof defaultValue === 'undefined') defaultValue = '';

    for(let field of edge.fields) {
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
function getBOMNodeLink(id, nodes) {
    for(let node of nodes) {
        if(node.item.urn === id) {
            return node.item.link;
        }
    }
    return '';
}



// Validate if there are restricted columns in the BOM to validate item access permissions
function hasBOMRestrictedFields(urn, nodes) {

    if(urn === '') return '';

    for(let node of nodes) {
        if(node.item.urn === urn) {

            for(let field of node.fields) {
                if('context' in field) {

                    if(field.context === 'SECURITY') return true;

                }
            }
        }
    }

    return false;
    
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

    $('<span></span>').appendTo(elemParent)
        .addClass('icon')
        .addClass(icon);

    if(typeof params === 'undefined')  return;
    if(params === null)  return;

    if(typeof params.link === 'undefined') {
        if(typeof params.dmsId === 'undefined') return;
        else if(params.dmsId === '') return;
    } else if(params.link === '') { return; 
    } else if(params.link === null) return;

    $.get('/plm/image-cache', params, function(response) {

        elemParent.html('');

        let src = response.data.url;

        if(document.location.href.indexOf('/addins/') > -1) src = '../' + src;

        $('<img>').appendTo(elemParent)
            .attr('src', src)
            .click(function() {
                onclick($(this));
            });

    });

}


// Add new field to sections payload, adds given section if new
function addFieldToPayload(payload, sections, elemField, fieldId, value, skipEmpty) {

    if(isBlank(skipEmpty)) skipEmpty = true;

    if(skipEmpty) {
        if(isBlank(value)) {
            if(isBlank(elemField)) {
                return;
            }   
        }
    }

    let sectionId   = null;
    let isNew       = true;
    let fieldData   = {};

    if(!isBlank(elemField)) {
        fieldData  = getFieldValue(elemField);
        sectionId  = getFieldSectionId(sections, fieldData.fieldId);
    } else {
        sectionId  = getFieldSectionId(sections, fieldId);
        fieldData  = {
            'fieldId' : fieldId,
            'value'   : value
        };
    }

    if(sectionId === -1) return;

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


// Determin if given permission is granted
function hasPermission(permissions, id) {

    for(let permission of permissions) {
        if(permission.name === 'permission.shortname.' + id) return true;
    }

    return false;

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