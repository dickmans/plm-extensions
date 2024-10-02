let userAccount         = { displayName : '', groupsAssigned : [] };
let languageId          = '1';
let username            = '';
let isiPad              = navigator.userAgent.match(/iPad/i)   != null;
let isiPhone            = navigator.userAgent.match(/iPhone/i) != null;
let applicationFeatures = {}


let settings = {
    create          : {},
    item            : {},
    details         : {},
    attachments     : {},
    bom             : {},
    flatBOM         : {},
    grid            : {},
    relationships   : {},
    processes       : {},
    recents         : {},
    bookmarks       : {},
    mow             : {},
    search          : {},
    results         : {},
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


// Validate System Admin privileges
function getSystemAdminSession(callback) {

    showStartupDialog();

    $.get('/plm/groups-assigned', {}, function (response) {

        let isSystemAdmin = false;

        for(let group of response.data) {
            if(group.shortName === 'Administration [SYSTEM]') isSystemAdmin = true;
        }

        if(!isSystemAdmin) {
            showErrorMessage('Not Permitted', 'This feature requires system admin privileges');
            callback(isSystemAdmin);
        } else {
            $.get('/plm/login-admin', {}, function (response) {
                if(response.error) {
                    showErrorMessage('Login Error', 'Failed to login with system admin privileges. Please review your Admin Client ID settings.');
                } else {
                    $('#startup').fadeOut();
                    $('body').children().removeClass('hidden');
                    callback(true);
                }
            });
        }

    });

}


// Get list of disabled features
function getApplicationFeatures(app, requests, callback) {

    if(isBlank(config[app])) showErrorMessage('Improper Application Configuration', 'Your server configuration does not include the required profile settings to launch this application (config.' + app + '). Please contact your administrator.')
    
    if(!isBlank(config[app].applicationFeatures)) applicationFeatures        = config[app].applicationFeatures;
    if(!isBlank(config[app].viewerFeatures))      applicationFeatures.viewer = config[app].viewerFeatures; 
    if( isBlank(applicationFeatures.viewer))      applicationFeatures.viewer = {};

    // if(applicationFeatures.viewer.length === 0) {

    //     getApplicationFeaturesDone(app);
    //     callback();
        
    // } else {

    let includesGroups = false;

    for(let applicationFeature of Object.keys(applicationFeatures)) {
        if(applicationFeature !== 'viewer') {
            if(typeof applicationFeatures[applicationFeature] === 'object') {
                includesGroups = true;
                break;
            }
        } else {
            for(let viewerFeature of Object.keys(applicationFeatures.viewer)) {
                if(typeof applicationFeatures.viewer[viewerFeature] === 'object') {
                    includesGroups = true;
                    break;
                }
            }
        }
    }

    if(includesGroups) requests.push($.get('/plm/groups-assigned', {}));

    // }

    if(requests.length === 0) {

        getApplicationFeaturesDone(app);
        callback();

    } else {

        showStartupDialog();

        if(isBlank(config[app].length === 0)) {
            $('body').children().removeClass('hidden');
            getApplicationFeaturesDone(app);
            callback();
        } else {

            Promise.all(requests).then(function(responses) {

                for(let group of responses[responses.length - 1].data) userAccount.groupsAssigned.push(group.shortName);

                for(let applicationFeature of Object.keys(applicationFeatures)) {
                    if(applicationFeature !== 'viewer') {
                        if(typeof applicationFeatures[applicationFeature] === 'object') {
                            applicationFeatures[applicationFeature] = includesAny(userAccount.groupsAssigned, applicationFeatures[applicationFeature]);
                        }
                    } else {
                        for(let viewerFeature of Object.keys(applicationFeatures.viewer)) {
                            if(typeof applicationFeatures.viewer[viewerFeature] === 'object') {
                                applicationFeatures.viewer[viewerFeature] = includesAny(userAccount.groupsAssigned, applicationFeatures.viewer[viewerFeature]);
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

}
function getApplicationFeaturesDone(app) {

    $('#startup').remove();

}


// Startup Dialog Elements
function showStartupDialog() {

    $('body').children().addClass('hidden');

    $('<div></div>').appendTo('body')
        .attr('id', 'startup')
        .addClass(getSurfaceLevel($('body')));

    $('<div></div>').appendTo($('#startup'))
        .attr('id', 'startup-logo');

}


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

    let elemProcessing = $('<div></div>').appendTo(elemParent)
        .addClass('processing')
        .attr('id', id + '-processing');

    if(hidden) elemProcessing.hide();

    $('<div></div>').addClass('bounce1').appendTo(elemProcessing);
    $('<div></div>').addClass('bounce2').appendTo(elemProcessing);
    $('<div></div>').addClass('bounce3').appendTo(elemProcessing);

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
        .html('No Viewable Found');

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

    let elemOverlay = $('#overlay');

    if(elemOverlay.length > 0) return;

    elemOverlay = $('<div></div>').appendTo('body')
        .attr('id', 'overlay');

    let elemProcessing = $('<div></div>').appendTo(elemOverlay)
        .addClass('processing')
        .attr('id', 'overlay-processing');

    $('<div></div>').appendTo(elemProcessing).addClass('bounce1');
    $('<div></div>').appendTo(elemProcessing).addClass('bounce2');
    $('<div></div>').appendTo(elemProcessing).addClass('bounce3');

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

        if(isBlank(groupName)) return;

        $('.' + groupName).addClass('hidden');

        $(this).children().click(function() {
            clickTab($(this));
        });

        if(!$(this).hasClass('no-auto-select')) $(this).children().first().click();

    });

    // $('.tabs').children().click(function() {
    //     clickTab($(this));
    // });

    // $('.tabs').each(function() {
    //     if(!$(this).hasClass('no-auto-select')) $(this).children().first().click();
    // });

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


// Append further fields to HTML tile
function appendTileDetails(elemTile, data) {

    let elemDetails = elemTile.find('.tile-details').first();
    let elemData    = $('<div></div>').appendTo(elemDetails).addClass('tile-data');

    for(let field of data) {

        let elemAppend = $('<div></div>').html(field[1]);

        if(field[0] !== '') {
            let classNames = field[0].split(' ');
            for(let className of classNames) elemAppend.addClass(className);
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


// Generate list of tiles
function genTilesList(id, items, params) {

    let elemGroupList;
    let counter     = 0;
    let groupName   = null;
    let elemList    = $('#' + id + '-list');

    elemList.addClass('tiles');
    elemList.addClass(params.tileSize);

         if(params.layout === 'list') elemList.addClass('list');
    else if(params.layout === 'grid') elemList.addClass('wide');

    if(!isBlank(params.groupBy)) {
        sortArray(items, 'groupKey', 'string', 'ascending');
    }

    for(let item of items) {

        counter++;

        if(!isBlank(params.groupBy)) {

            if(groupName !== row.groupKey) {

                let elemGroup = $('<div></div>').appendTo(elemList)
                    .addClass('list-group');

                $('<div></div>').appendTo(elemGroup)
                    .addClass('list-group-name')
                    .html(row.groupKey);

                elemGroupList = $('<div></div>').appendTo(elemGroup)
                    .addClass('list-group-list')
                    .addClass('tiles')
                    .addClass(params.tileSize)
                    .addClass(params.surfaceLevel);

                if(params.layout === 'list') elemGroupList.addClass('wide')

            }

            groupName = row.groupKey;

        }

        // let image    = (settings.workspaceViews[id].fieldIdImage === '') ? null : getWorkspaceViewRowValue(row, settings.workspaceViews[id].fieldIdImage, '', 'link');
        // let details  = [];

        let elemTile = genSingleTile({
            link        : item.link, 
            icon        : params.tileIcon, 
            counter     : counter, 
            partNumber  : item.partNumber,
            image       : item.image, 
            title       : item.title, 
            subtitle    : item.subtitle,
            details     : item.details
        });

        if(isBlank(params.groupBy)) elemTile.appendTo(elemList); else elemTile.appendTo(elemGroupList);

        elemTile.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            clickListItem($(this), e);
            toggleListItemActions($(this));
        });

            // if(settings.bookmarks[id].tileCounter) {
            //     let elemImage = elemTile.find('.tile-image');
            //     elemImage.html('');

            //     $('<div></div>').appendTo(elemImage)
            //         .addClass('tile-counter')
            //         .html(counter);
            // }

        // for(let fieldidDetail of settings.workspaceViews[id].fieldIdsDetails) {
        //     details.push([
        //         fieldidDetail[0],
        //         getWorkspaceViewRowValue(row, fieldidDetail[1], '', 'title'),
        //         fieldidDetail[2]
        //     ]);
        // }

        // for(let fieldAttribute of settings.workspaceViews[id].fieldIdsAttributes) {
        //     elemTile.attr('data-' + fieldAttribute.toLowerCase(), getWorkspaceViewRowValue(row, fieldAttribute, '', 'link'),)
        // }

        // if(details.length > 0) appendTileDetails(elemTile, details);

    }

}
function genSingleTile(params) {

    if(isBlank(params)) params = {};
    if(isBlank(params.icon)) params.icon = 'icon-product';

    let elemTile        = $('<div></div>').addClass('tile').addClass('list-item');
    let elemTileImage   = $('<div></div>').appendTo(elemTile).addClass('tile-image');
    let elemTileDetails = $('<div></div>').appendTo(elemTile).addClass('tile-details');
    let elemTitle       = $('<div></div>').appendTo(elemTileDetails).addClass('tile-title');

    if(!isBlank(params.link)) elemTile.attr('data-link', params.link);
    if(!isBlank(params.partNumber)) elemTile.attr('data-part-number', params.partNumber);
    
    if(!isBlank(params.title)) { 
        elemTile.attr('data-title', params.title); 
        elemTitle.html(params.title); 
    }

    if(!isBlank(params.subtitle)) {
        $('<div></div>')
            .addClass('tile-subtitle')
            .html(params.subtitle)
            .appendTo(elemTileDetails);
    }

    if(!isBlank(params.details)) {
        $('<div></div>')
            .addClass('tile-data')
            .html(params.details)
            .appendTo(elemTileDetails);
    }

    if(isBlank(params.image)) {
        if(isBlank(params.counter)) {
            $('<span></span>').appendTo(elemTileImage)
                .addClass('icon')
                .addClass(params.icon);
        } else {
            $('<div></div>').appendTo(elemTileImage)
                .addClass('tile-counter')
                .html(params.counter);
        }
    } else getImageFromCache(elemTileImage, { 'link' : params.image }, params.icon, function() {});

    return elemTile;

}



// Generate single tile HTML
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



// Generate HTML Table & interactions
function genTable(id, params, items) {

    if(isBlank(params.multiSelect)) params.multiSelect = false;
    if(isBlank(params.editable)   )    params.editable = false;
    if(isBlank(params.position)   )    params.position = false;
    if(isBlank(params.descriptor) )  params.descriptor = false;
    if(isBlank(params.quantity)   )    params.quantity = false;
    if(isBlank(params.hideDetails)) params.hideDetails = false;

    let elemList = $('#' + id + '-list');
        elemList.html('').show();

    let elemTable = $('<table></table>').appendTo(elemList)
        .addClass('list-table')
        .addClass('fixed-header')
        .attr('id', id + '-table');

    let elemTHead = $('<thead></thead>').appendTo(elemTable)
        .addClass('list-thead')
        .attr('id', id + '-thead');

    if(!params.tableHeaders) { elemTHead.hide(); } else { genTableHeaders(id, elemTHead, params); }

    let editableFields = getEditableFields(params.columns);

    let elemTBody = $('<tbody></tbody>').appendTo(elemTable)
        .addClass('list-tbody')
        .attr('id', id + '-tbody');

    genTableRows(elemTBody, params, items, editableFields);

    updateListCalculations(id);

}
function genTableHeaders(id, elemTHead, params) {

    let elemTHeadRow = $('<tr></tr>').appendTo(elemTHead);

    if(params.editable || params.multiSelect) {

        let elemToggleAll = $('<div></div>')
            .attr('id', id + '-select-all')
            .addClass('list-select-all')
            .addClass('icon')
            .addClass('icon-check-box')
            .addClass('xxs')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                clickListToggleAll($(this));
            });


        $('<th></th>').appendTo(elemTHeadRow).append(elemToggleAll);

    }

    if(params.number    ) $('<th></th>').appendTo(elemTHeadRow).addClass('list-number').html('Nr');
    if(params.descriptor) $('<th></th>').appendTo(elemTHeadRow).addClass('list-descriptor').html('Item');
    if(params.quantity  ) $('<th></th>').appendTo(elemTHeadRow).addClass('list-quantity').html('Qty');

    if(!params.hideDetails) {

        for(let column of params.columns) {
            
            $('<th></th>').appendTo(elemTHeadRow)
                .html(column.displayName)
                .addClass('list-column-' + column.fieldId.toLowerCase());

        }

    }

    if(params.totals) genTableTotals(elemTHead, params);
    if(params.ranges) genTableRanges(elemTHead, params);

}
function genTableTotals(elemTHead, params) {

    let elemTotals = $('<tr></tr>').addClass('list-totals').appendTo(elemTHead);

    if(params.editable || params.multiSelect) $('<th></th>').appendTo(elemTotals); 
    if(params.number    ) $('<th></th>').appendTo(elemTotals)
    if(params.descriptor) $('<th></th>').appendTo(elemTotals).html('Totals');
    if(params.quantity  ) $('<th></th>').appendTo(elemTotals).html(0).addClass('list-total').attr('data-id', 'quantity');

    if(!params.hideDetails) {

        for(let column of params.columns) {
            
            let type     = column.type.title;
            let elemCell = $('<th></th>').appendTo(elemTotals);

            if((type === 'Integer') || (type === 'Float')) {
                elemCell.html(0);
                elemCell.addClass('list-total')
                elemCell.attr('data-id', column.fieldId)
            }
            
        }

    }

}
function genTableRanges(elemTHead, params) {

    let elemRanges = $('<tr></tr>').addClass('list-ranges').appendTo(elemTHead);

    if(params.editable || params.multiSelect) $('<th></th>').appendTo(elemRanges); 
    if(params.number    ) $('<th></th>').appendTo(elemRanges)
    if(params.descriptor) $('<th></th>').appendTo(elemRanges).html('Range');
    if(params.quantity  ) $('<th></th>').appendTo(elemRanges).html(0).addClass('list-range').attr('data-id', 'quantity');

    if(!params.hideDetails) {

        for(let column of params.columns) {
            
            let type     = column.type.title;
            let elemCell = $('<th></th>').appendTo(elemRanges);

            if((type === 'Integer') || (type === 'Float')) {
                elemCell.addClass('list-range')
                elemCell.attr('data-id', column.fieldId)
            }
            
        }

    }

}
function genTableRows(elemTBody, params, items, editableFields) {

    let count = 1;

    for(let item of items) {

        let quantity = Number(item.quantity).toFixed(2);

        let elemRow = $('<tr></tr>').appendTo(elemTBody)
            .addClass('list-item')
            .attr('data-link', item.link)
            .attr('data-title', item.title)
            .attr('data-part-number', item.partNumber)
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                clickListItem($(this), e);
                toggleListItemActions($(this));
                // updateListCounters($(this).closest('.item'));
            });

        if(params.editable || params.multiSelect) {

            $('<td></td>').appendTo(elemRow)
                .html('<div class="icon icon-check-box xxs"></div>')
                .addClass('item-check')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    clickListItemSelect($(this));
                })
    
        }

        if(params.number    ) $('<td></td>').appendTo(elemRow).addClass('list-item-number').html(count++);
        if(params.descriptor) $('<td></td>').appendTo(elemRow).addClass('list-item-descriptor').html(item.title);                
        if(params.quantity  ) $('<td></td>').appendTo(elemRow).addClass('list-item-quantity').html(quantity);

        if(!params.hideDetails) {

            for(let column of params.columns) {

                let isEditable  = false;
                let value       = '';
                let elemRowCell = $('<td></td>').appendTo(elemRow)
                    .attr('data-id', column.fieldId)
                    .addClass('list-column-' + column.fieldId.toLowerCase());

                for(let field of item.data) {
                    if(field.fieldId === column.fieldId) {
                        value = field.value;

                        if(params.editable) {
                    
                    for(let editableField of editableFields) {

                        if(field.fieldId === editableField.id) {
            
                            if(!isBlank(editableField.control)) {
                        
                                let elemControl = editableField.control.clone();
                                    elemControl.appendTo(elemRowCell)
                                    .attr('data-id', editableField.id)
                                    .click(function(e) {
                                        e.stopPropagation();
                                    })
                                    .change(function() {
                                        changedListValue($(this));
                                    });

                                switch (editableField.type) {
                                    
                                    case 'Single Selection':
                                    // case 'Radio Button':
                                        // console.log(field);
                                        // value = getFlatBOMCellValue(response.data, itemLink, field.__self__.urn, 'link');
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
                    }
                }

                }

                if(!isEditable) elemRowCell.html($('<div></div>').html(value).text());

            }
        }
    }

}
function clickListOpenInPLM(elemClicked) {

    let elemList  = elemClicked.closest('.panel-top');
    let elemItem  = elemList.find('.list-item.selected').first();
    
    openItemByLink(elemItem.attr('data-link'));

}
function clickListDeselectAll(elemClicked) {

    let elemTop  = elemClicked.closest('.panel-top');

    elemTop.find('.list-item').removeClass('selected');

    toggleListItemActions(elemClicked);
    updateListCalculations(elemTop.attr('id'));
    clickListDeselectAllDone(elemClicked);

}
function clickListDeselectAllDone(elemClicked) {}
function clickListFilterEmptyInputs(elemClicked) {

    elemClicked.toggleClass('selected');

    let elemTop     = elemClicked.closest('.panel-top');
    let id          = elemTop.attr('id');
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

    updateListCalculations(elemTop.attr('id'));
    clickFlatBOMFilterEmptyDone(elemClicked);

}
function clickListFilterSelected(elemClicked) {

    elemClicked.toggleClass('selected');

    let elemTop         = elemClicked.closest('.panel-top');
    let id              = elemTop.attr('id');
    let elemTBody       = $('#' + id + '-tbody');
    let countVisible    = elemTBody.children(':visible').length;
    let countSelected   = elemTBody.children('.selected').length;
    let applyFilter     = ((elemClicked.hasClass('selected')) || (countVisible !== countSelected));

    if(applyFilter) {
        elemTBody.children().hide();
        elemTBody.children('.selected').show();
        elemClicked.addClass('selected');
    } else {
        elemTBody.children().show();
    }

    updateListCalculations(elemTop.attr('id'));

}
function searchInList(id, elemInput) {

    let elemTable   = $('#' + id + '-tbody');
    let filterValue = elemInput.val().toLowerCase();

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
function toggleListItemActions(elemClicked) {

    let elemParent          = elemClicked.closest('.panel-top');
    let elemToggleAll       = elemParent.find('.list-select-all');
    let actionsMultiSelect  = elemParent.find('.list-multi-select-action');
    let actionsSingleSelect = elemParent.find('.list-single-select-action');
    let countSelected       = elemParent.find('.list-item.selected').length;
    let countAll            = elemParent.find('.list-item').length;

    if(countSelected === 0) { actionsSingleSelect.hide(); actionsMultiSelect.hide(); }
    if(countSelected === 1) actionsSingleSelect.show(); else actionsSingleSelect.hide();
    if(countSelected   > 0)  actionsMultiSelect.show(); else  actionsMultiSelect.hide();

    if(elemToggleAll.length === 0) return;

    if(countSelected === countAll) elemToggleAll.removeClass('icon-check-box').addClass('icon-check-box-checked');
    else                           elemToggleAll.addClass('icon-check-box').removeClass('icon-check-box-checked');


}
function clickListToggleAll(elemClicked) {

    let elemTop = elemClicked.closest('.panel-top');

    elemClicked.toggleClass('icon-check-box').toggleClass('icon-check-box-checked');

    if(elemClicked.hasClass('icon-check-box-checked')) {
        elemTop.find('.list-item').addClass('selected');
    } else {
        elemTop.find('.list-item').removeClass('selected');
    }

    toggleListItemActions(elemClicked);
    updateListCalculations(elemTop.attr('id'));
    clickListToggleAllDone(elemClicked);

}
function clickListToggleAllDone(elemClicked) {}
function clickListItemSelect(elemCheckbox, e) {

    let elemTop     = elemCheckbox.closest('.panel-top');
    let elemClicked = elemCheckbox.closest('.list-item');
    
    elemClicked.toggleClass('selected');

    if(!elemTop.hasClass('multi-select')) elemClicked.siblings().removeClass('selected');
    updateListCalculations(elemTop.attr('id'));
    toggleListItemActions(elemClicked);
    clickListItemSelectDone(elemClicked, e);

}
function clickListItemDone(elemClicked, e) {}
function clickListItem(elemClicked, e) {

    let elemTop  = elemClicked.closest('.panel-top');

    elemClicked.toggleClass('selected');

    if(elemClicked.hasClass('selected')) elemClicked.addClass('last'); else elemClicked.removeClass('last');

    if(!elemTop.hasClass('multi-select')) elemClicked.siblings().removeClass('selected').removeClass('last');
    updateListCalculations(elemTop.attr('id'));
    clickListItemDone(elemClicked, e);

}
function clickListItemDone(elemClicked, e) {}
function updateListCalculations(id) {

    let elemTop         = $('#' + id);
    let totals          = elemTop.find('.list-total');
    let ranges          = elemTop.find('.list-range');
    let countTotal      = elemTop.find('.list-item').length;
    let countSelected   = elemTop.find('.list-item.selected').length;
    let countVisible    = elemTop.find('.list-item:visible').length;
    let countChanged    = elemTop.find('.list-item.changed').length;

    totals.each(function() {
        
        let elemCellTotal   = $(this);
        let index           = elemCellTotal.index();
        let total           = 0;

        $('.list-item:visible').each(function() {
            if((countSelected === 0) || ($(this).hasClass('selected'))) {
                let value    = null;
                let elemCell = $(this).children().eq(index);
                if(elemCell.hasClass('list-item-quantity')) {
                    value = Number(elemCell.html());
                } else {
                    let fieldData = getFieldValue(elemCell);
                    if(!isBlank(fieldData.value)) {
                        value = Number(fieldData.value);
                    }
                }
                if(value !== null) total += value;
            }
        })

        elemCellTotal.html(total);

    });

    ranges.each(function() {
        
        let elemCellRange   = $(this);
        let index           = elemCellRange.index();
        let min             = '';
        let max             = '';

        $('.list-item:visible').each(function() {
            if((countSelected === 0) || ($(this).hasClass('selected'))) {
                let value    = null;
                let elemCell = $(this).children().eq(index);
                if(elemCell.hasClass('list-item-quantity')) {
                    value = Number(elemCell.html());
                } else {
                    let fieldData = getFieldValue(elemCell);
                    if(!isBlank(fieldData.value)) {
                        value = Number(fieldData.value);
                    }
                }
                if(value !== null) {
                    if(min === '') min = value
                    else if(value < min) min = value;
                    if(max === '') max = value;
                    else if(value > max) max = value;
                }
            }
        })

        elemCellRange.html(min + ' - ' + max);

    });

    let elemCounterTotal    = $('#' + id + '-list-counter-total');
    let elemCounterFiltered = $('#' + id + '-list-counter-filtered');
    let elemCounterSelected = $('#' + id + '-list-counter-selected');
    let elemCounterChanged  = $('#' + id + '-list-counter-changed');

    elemCounterTotal.html(countTotal + ' rows in total');

    if(countTotal !== countVisible) {
        elemCounterFiltered.html(countVisible + ' rows shown').addClass('not-empty');
    } else { elemCounterFiltered.html('').removeClass('not-empty'); } 

    if(countSelected > 0) {
        elemCounterSelected.html(countSelected + ' rows selected').addClass('not-empty');
    } else { elemCounterSelected.html('').removeClass('not-empty'); } 

    if(countChanged > 0) {
        elemCounterChanged.html(countChanged + ' rows changed').addClass('not-empty');
    } else { elemCounterChanged.html('').removeClass('not-empty'); } 

}
function changedListValue(elemControl) {

    let elemTop = elemControl.closest('.panel-top');
    let id      = elemTop.attr('id');
    let index   = elemControl.parent().index();
    let value   = elemControl.val();

    console.log(id);

    $(id + '-save').show();

    elemControl.parent().addClass('changed');
    elemControl.closest('tr').addClass('changed');

    $('#' + id + '-save').show();

    $('.list-item.selected').each(function() {
        $(this).addClass('changed');
        $(this).children().eq(index).addClass('changed');
        $(this).children().eq(index).children().first().val(value);
    });

    updateListCalculations(id);

}
function clickListSave(elemButton) {

    $('#overlay').show();

    let elemTop = elemButton.closest('.panel-top');

    $.get('/plm/sections', { 'wsId' : elemTop.attr('data-wsid') }, function(response) {
        saveListChanges(elemTop, elemButton, response.data);
    });


}
function saveListChanges(elemTop, elemButton, sections) {

    let listChanges = elemTop.find('.list-item.changed')

    if(listChanges.length === 0) {

        elemButton.hide();
        updateListCalculations(elemTop.attr('id'));
        saveListChangesDone(elemButton);

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
        
                elemItem.children('.changed').each(function() {
                    addFieldToPayload(params.sections, sections, $(this), null, null, false);
                });

                console.log(params);

                requests.push($.get('/plm/edit', params));
                elements.push(elemItem);

            }

        });

        Promise.all(requests).then(function(responses) {

            for(let element of elements) {
                element.removeClass('changed');
                element.children().removeClass('changed');
            }
            $('#overlay').hide();
            saveListChanges(elemTop, elemButton, sections);

        });

    }


}
function saveListChangesDone(elemClicked) {}



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



// Display create form to trigger item creation
function showCreateForm(wsId, params) {

    if(isBlank(wsId)) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let id              = 'create';     // ID of the DOM element where the history should be inserted
    let header          = true;         // Hide header (and toolbar) by setting this to false
    let headerLabel     = 'Create New'; // Set the header text
    let headerToggle    = false;        // Enable header toggles
    let compactDisplay  = false;        // Optimizes CSS settings for a compact display
    let dialog          = true;         // Display create from in a dialog instead of a panel element
    let hideComputed    = true;         // Hide item details computed fields
    let hideReadOnly    = true;         // Hide item details read only fields
    let hideLabels      = false;        // Hide item details field labels
    let fieldValues     = [];           // Set default values for new records by providing an array of key value pairs consisting of fieldId, value displayValue
    let sectionsIn      = [];           // Define list of columns to include by fieldId; columns not included in this list will not be shown at all. Keep empty to show all columns.
    let sectionsEx      = [];           // Define list of columns to exclude by fieldId; columns in this list will not be shown at all. Keep empty to show all columns.
    let fieldsIn        = [];           // Define list of columns to include by fieldId; columns not included in this list will not be shown at all. Keep empty to show all columns.
    let fieldsEx        = [];           // Define list of columns to exclude by fieldId; columns in this list will not be shown at all. Keep empty to show all columns.

    if( isBlank(params)                )          params = {};
    if(!isBlank(params.id)             )              id = params.id;
    if(!isBlank(params.header)         )          header = params.header;
    if(!isBlank(params.headerLabel)    )     headerLabel = params.headerLabel;
    if(!isBlank(params.headerToggle)   )    headerToggle = params.headerToggle;
    if(!isBlank(params.dialog)         )          dialog = params.dialog;
    if(!isBlank(params.compactDisplay) )  compactDisplay = params.compactDisplay;
    if(!isBlank(params.hideComputed)   )    hideComputed = params.hideComputed;
    if(!isBlank(params.hideReadOnly)   )    hideReadOnly = params.hideReadOnly;
    if(!isBlank(params.hideLabels)     )      hideLabels = params.hideLabels;
    if(!isBlank(params.sectionsIn)     )      sectionsIn = params.sectionsIn;
    if(!isBlank(params.sectionsEx)     )      sectionsEx = params.sectionsEx;
    if(!isBlank(params.fieldsIn)       )        fieldsIn = params.fieldsIn;
    if(!isBlank(params.fieldsEx)       )        fieldsEx = params.fieldsEx;
    if(!isBlank(params.fieldValues)    )     fieldValues = params.fieldValues;

    settings.create[id]                = {};
    settings.create[id].derived        = [];
    settings.create[id].hideComputed   = hideComputed;
    settings.create[id].hideReadOnly   = hideReadOnly;
    settings.create[id].hideLabels     = hideLabels;
    settings.create[id].sectionsIn     = sectionsIn;
    settings.create[id].sectionsEx     = sectionsEx;
    settings.create[id].fieldsIn       = fieldsIn;
    settings.create[id].fieldsEx       = fieldsEx;
    settings.create[id].editable       = true;

    appendOverlay(true);
    
    let elemTop = $('#' + id)
        .addClass('panel-top')
        .addClass('surface-level-1')
        .addClass('create');

    let prevWSID   = elemTop.attr('data-workspace-id');
    let elemFooter = $('<div></div>')
        .attr('id', id + '-footer')
        .addClass('create-footer');

    if(!isBlank(prevWSID)) {
        if(prevWSID = wsId.toString()) {
            if(dialog) $('#overlay').show();
            $('#' + id + '-processing').hide();
            $('#' + id + '-sections').show();
            $('#' + id + '-footer').show();
            clearFields(id);
            showCreateFormSetFieldValues($('#' + id + '-sections'), fieldValues);
            showCreateFormDone(id, [], []);
            elemTop.show();
            return;
        }
    }

    if(compactDisplay) elemTop.addClass('compact')

    elemTop.attr('data-workspace-id', wsId);
    elemTop.show();

    $('#overlay').show();

    appendProcessing(id, false);

    let elemSections = $('<div></div>').appendTo(elemTop)
        .attr('id', id + '-sections')
        .addClass('create-sections')
        .addClass('panel-content');

    let elemButtonCancel = $('<div></div>').appendTo(elemFooter)
        .addClass('button')
        .addClass('create-cancel')
        .html('Cancel')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeCreateForm(id);
        });

    let elemButtonSubmit = $('<div></div>').appendTo(elemFooter)
        .addClass('button')
        .addClass('default')
        .addClass('create-submit')
        .html('Submit')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            clickCreateFormSubmit(id);           
        });

    if(dialog) {
        header       = true;
        headerToggle = false;
        elemTop.addClass('with-footer');
        elemFooter.appendTo(elemTop);
        elemButtonSubmit.appendTo(elemFooter);
        elemButtonCancel.appendTo(elemFooter);
    }

    if(header) {

        let elemHeader = $('<div></div>', {
            id : id + '-header'
        }).prependTo(elemTop).addClass('panel-header');

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

        let elemToolbar = $('<div></div>').appendTo(elemHeader)
            .addClass('panel-toolbar')
            .attr('id', id + '-toolbar');

        if(dialog) {

            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-close')
                .attr('id', id + '-close')
                .attr('title', 'Close')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    closeCreateForm(id);
                });

        } else {
            elemButtonCancel.appendTo(elemToolbar);
            elemButtonSubmit.appendTo(elemToolbar);
        }
    }

    let requests = [
        $.get('/plm/sections', { 'wsId' : wsId }),
        $.get('/plm/fields'  , { 'wsId' : wsId })
    ];

    Promise.all(requests).then(function(responses) {
        insertDetailsFields(id, responses[0].data, responses[1].data, null, settings.create[id], function() {
            showCreateFormSetFieldValues(elemSections, fieldValues);
            showCreateFormDone(id, responses[0].data, responses[1].data);
        });
    });

}
function showCreateFormSetFieldValues(elemSections, fieldValues) {

    if(isBlank(fieldValues)) return;
    if(fieldValues.length === 0 ) return;

    elemSections.find('.field-value').each(function() {

        let elemField = $(this);
        let fieldId   = elemField.attr('data-id');

        if(!isBlank(fieldId)) {

            for(let fieldValue of fieldValues) {

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

                    }
                }
            }
        }

    });

}
function showCreateFormDone(id, sections, fields) {}
function closeCreateForm(id) {

    $('#' + id).hide();
    $('#overlay').hide();

    closeCreateFormDone(id);

}
function closeCreateFormDone(id) {}
function clickCreateFormSubmit(id) {

    let wsId = $('#' + id).attr('data-workspace-id');

    if(!validateForm($('#' + id + '-sections'))) {
        showErrorMessage('Error', 'Field validations faild');
        return;
    }

    $('#' + id + '-sections').hide();
    $('#' + id + '-footer').hide();
    $('#' + id + '-processing').show();

    submitCreateForm(wsId, $('#' + id + '-sections'), null, function(response) {
        let link = response.data.split('.autodeskplm360.net')[1];
        submitCreateFormDone(id, link);
    });

}
function submitCreateFormDone(id, link) {

    $('#' + id).hide();
    $('#overlay').hide();
    
    openItemByLink(link);

}



// Clone single item using standard application features
function cloneItem(link, options, fieldsToReset, callback) {

    if(isBlank(fieldsToReset)) fieldsToReset = [];

    let params = {
        link     : link,
        options  : ['ITEM_DETAILS'],
        sections : []
    }

    if(options.indexOf('bom'        ) > -1) params.options.push('BOM_LIST');
    if(options.indexOf('grid'       ) > -1) params.options.push('PART_GRID');
    if(options.indexOf('attachments') > -1) params.options.push('PART_ATTACHMENTS');


    $.get('/plm/details', { link : link }, function(response) {

        for(let section of response.data.sections) {

            let linkBase    = section.link.split('/items/')[0];
            let linkSection = linkBase + section.link.split('/views/1')[1];

            let sect = {
                'link'   : linkSection,
                'fields' : []
            }

            if(section.hasOwnProperty('classificationId')) sect.classificationId = section.classificationId;

            for(let field of section.fields) {

                let fieldId = field.__self__.split('/')[10];

                if(fieldsToReset.includes(fieldId)) field.value = '';

                sect.fields.push({
                    fieldId         : fieldId,
                    fieldMetadata   : null,
                    title           : field.title,
                    typeId          : Number(field.type.link.split('/')[4]),
                    value           : field.value
                });

            }
            params.sections.push(sect);

        }

        $.post('/plm/clone', params, function(response) {
            console.log(response);
            callback(response);
        });

    });

}



// Clone multiple items using standard application features
function cloneItems(links, options, fieldsToReset, callback) {

    if(isBlank(fieldsToReset)) fieldsToReset = [];

    let reqDetails   = [];
    let cloneOptions = ['ITEM_DETAILS'];

    if(options.indexOf('bom'        ) > -1) cloneOptions.push('BOM_LIST');
    if(options.indexOf('grid'       ) > -1) cloneOptions.push('PART_GRID');
    if(options.indexOf('attachments') > -1) cloneOptions.push('PART_ATTACHMENTS');

    for(let link of links) reqDetails.push($.get('/plm/details', { link : link }));

    Promise.all(reqDetails).then(function(responses) {

        let reqClones    = [];
        
        for(let response of responses) {

            let params = {
                link     : response.params.link,
                options  : cloneOptions,
                sections : []
            }

            for(let section of response.data.sections) {

                let linkBase    = section.link.split('/items/')[0];
                let linkSection = linkBase + section.link.split('/views/1')[1];

                let sect = {
                    'link'   : linkSection,
                    'fields' : []
                }

                if(section.hasOwnProperty('classificationId')) sect.classificationId = section.classificationId;

                for(let field of section.fields) {

                    let fieldId = field.__self__.split('/')[10];

                    if(fieldsToReset.includes(fieldId)) field.value = '';

                    sect.fields.push({
                        fieldId         : fieldId,
                        fieldMetadata   : null,
                        title           : field.title,
                        typeId          : Number(field.type.link.split('/')[4]),
                        value           : field.value
                    });

                }
                
                params.sections.push(sect);

            }

            reqClones.push($.post('/plm/clone', params));



        }

        Promise.all(reqClones).then(function(responses) {
            console.log(responses);
            callback(responses);
        });

    });

}



// Replace multiple BOM entries with list of new items while keeping link attributes
function replaceBOMItems(link, itemsPrev, itemsNext, callback) {

    console.log(' >> replaceBOMItems START ');
    console.log(link);
    console.log(itemsPrev);
    console.log(itemsNext);
    console.log(' replaceBOMItems CONTINUE ');

    let dataReplacements = [];
    let index            = 0;

    for(let itemPrev of itemsPrev) {

        let idPrev = itemPrev.split('/').pop();
        let idNext = itemsNext[index].split('/').pop();

        dataReplacements.push({
            linkPrev    : itemPrev,
            linkNext    : itemsNext[index++],
            idPrev      : idPrev,
            idNext      : idNext,
            edgeIdPrev  : '',
            quantity    : 1,
            number      : 1
        });

    }

    // Get current parent item BOM
    $.get('/plm/bom', { link : link, depth : 1 }, function(response) {

        let reqEdgesDetails = [];

        console.log(response);

        for(let edge of response.data.edges) {

            let idChild = edge.child.split('.').pop();

            for(let dataReplacement of dataReplacements) {

                // let idOld = itemOld.split('/').pop();

                if(idChild === dataReplacement.idPrev) {

                    reqEdgesDetails.push($.get('/plm/bom-edge', { edgeLink : edge.edgeLink }));
                    break;

                }

            }

        }

        console.log(reqEdgesDetails.length);

        Promise.all(reqEdgesDetails).then(function(responses) {

            console.log(responses);
            let dataEdges       = responses;
            let reqBOMRemovals  = [];
            let indexBOMRemoval = 0;

            for(let response of responses) {


                console.log(response);

                dataReplacements[indexBOMRemoval].quantity = response.data.quantity;
                dataReplacements[indexBOMRemoval].number   = response.data.itemNumber;

                reqBOMRemovals.push($.get('/plm/bom-remove', { edgeLink : response.params.edgeLink }));

                indexBOMRemoval++;

            }

            console.log(reqBOMRemovals.length);

            Promise.all(reqBOMRemovals).then(function(responses) {
                console.log(responses);

                let reqBOMAdditions   = [];
                // let indexNew = 0;

                for(let dataReplacement of dataReplacements) {
                    reqBOMAdditions.push($.get('/plm/bom-add', { 
                        linkParent : link,
                        linkChild  : dataReplacement.linkNext, 
                        quantity   : dataReplacement.quantity, 
                        number     : dataReplacement.number 
                    }));
                }

                Promise.all(reqBOMAdditions).then(function(responses) {

                    console.log(responses);
                    callback(responses);

                });


            })



        });


    });

}



// Open given item in main screen of app, insert given dom elements before if needed
function showSummary(elemClicked, params) {

    //  Set defaults for optional parameters
    // --------------------------------------
    let id              = 'item';        // ID of the DOM element where the history should be inserted
    let statesColors    = [];            // Map workflow or lifecycle state names to colors
    let workflowActions = false;         // Enable reload button for the history panel
    let bookmark        = true;          // Enables bookmark toggle
    let openInPLM       = true;          // Adds button to open selected element in PLM
    let reload          = false;         // Enables reload button for the history panel
    let editable        = false;         // Enables edit capabilities in given panels
    let hideComputed    = false;         // Hide item details computed fields
    let hideReadOnly    = false;         // Hide item details read only fields
    let hideLabels      = false;         // Hide item details field labels
    let suppressLinks   = false;         // When set to true, linking pick lists will not be shown as links, preventing users from opening the native PLM user interface
    let sectionsIn      = [];            // Define list of columns to include by fieldId; columns not included in this list will not be shown at all. Keep empty to show all columns.
    let sectionsEx      = [];            // Define list of columns to exclude by fieldId; columns in this list will not be shown at all. Keep empty to show all columns.
    let fieldsIn        = [];            // Define list of columns to include by fieldId; columns not included in this list will not be shown at all. Keep empty to show all columns.
    let fieldsEx        = [];            // Define list of columns to exclude by fieldId; columns in this list will not be shown at all. Keep empty to show all columns.
    let additionalView  = '';            // Set content of additional view (select from grid or whereUsed)
    let classContents   = 'surface-level-3' // Class to be applied to all item content panels
    let relLayout       = 'tiles'       // Set layout for Relationships from table or tiles


    if( isBlank(params)                )          params = {};
    if(!isBlank(params.id)             )              id = params.id;
    if(!isBlank(params.statesColors)   )    statesColors = params.statesColors;
    if(!isBlank(params.workflowActions)) workflowActions = params.workflowActions;
    if(!isBlank(params.bookmark)       )        bookmark = params.bookmark;
    if(!isBlank(params.openInPLM)      )       openInPLM = params.openInPLM;
    if(!isBlank(params.reload)         )          reload = params.reload;
    if(!isBlank(params.editable)       )        editable = params.editable;
    if(!isBlank(params.hideComputed)   )    hideComputed = params.hideComputed;
    if(!isBlank(params.hideReadOnly)   )    hideReadOnly = params.hideReadOnly;
    if(!isBlank(params.hideLabels)     )      hideLabels = params.hideLabels;
    if(!isBlank(params.suppressLinks)  )   suppressLinks = params.suppressLinks;
    if(!isBlank(params.sectionsIn)     )      sectionsIn = params.sectionsIn;
    if(!isBlank(params.sectionsEx)     )      sectionsEx = params.sectionsEx;
    if(!isBlank(params.fieldsIn)       )        fieldsIn = params.fieldsIn;
    if(!isBlank(params.fieldsEx)       )        fieldsEx = params.fieldsEx;
    if(!isBlank(params.additionalView) )  additionalView = params.additionalView;
    if(!isBlank(params.classContents)  )   classContents = params.classContents;
    if(!isBlank(params.relLayout)      )       relLayout = params.relationshipsLayout;

    settings.item[id]                = {};
    settings.item[id].statesColors   = statesColors;
    settings.item[id].editable       = editable;
    settings.item[id].hideComputed   = hideComputed;
    settings.item[id].hideReadOnly   = hideReadOnly;
    settings.item[id].hideLabels     = hideLabels;
    settings.item[id].suppressLinks  = suppressLinks;
    settings.item[id].sectionsIn     = sectionsIn;
    settings.item[id].sectionsEx     = sectionsEx;
    settings.item[id].fieldsIn       = fieldsIn;
    settings.item[id].fieldsEx       = fieldsEx;
    settings.item[id].additionalView = additionalView;
    settings.item[id].relLayout      = relLayout;

    
    let elemTop = $('#' + id);
    let link    = elemClicked.attr('data-link');

    if(elemTop.length === 0) elemTop.addClass('screen').appendTo('body');

    elemTop.addClass('item');
    elemTop.attr('data-link', link);

    let elemHeader          = $('#' + id + '-header');
    let elemTitle           = $('#' + id + '-title');
    let elemDescriptor      = $('#' + id + '-descriptor');
    let elemSubtitle        = $('#' + id + '-subtitle');
    let elemStatus          = $('#' + id + '-status');
    let elemSummary         = $('#' + id + '-summary');
    let elemToolbar         = $('#' + id + '-toolbar');
    let elemClose           = $('#' + id + '-close');
    let elemContent         = $('#' + id + '-content');
    let elemWorkflowActions = $('#' + id + '-workflow-actions');
    let elemOpenInPLM       = $('#' + id + '-open-in-plm');
    let elemBookmark        = $('#' + id + '-bookmark');
    let elemReload          = $('#' + id + '-reload');
    
    if(elemHeader.length     === 0) { elemHeader     = $('<div></div>').attr('id', id + '-header'    ).addClass('item-header'    ).appendTo(elemTop);     }
    if(elemTitle.length      === 0) { elemTitle      = $('<div></div>').attr('id', id + '-title'     ).addClass('item-title'     ).appendTo(elemHeader);  }
    if(elemDescriptor.length === 0) { elemDescriptor = $('<div></div>').attr('id', id + '-descriptor').addClass('item-descriptor').appendTo(elemTitle);   }
    if(elemSubtitle.length   === 0) { elemSubtitle   = $('<div></div>').attr('id', id + '-subtitle'  ).addClass('item-subtitle'  ).appendTo(elemTitle);   }
    if(elemStatus.length     === 0) { elemStatus     = $('<div></div>').attr('id', id + '-status'    ).addClass('item-status'    ).appendTo(elemSubtitle);}
    if(elemSummary.length    === 0) { elemSummary    = $('<div></div>').attr('id', id + '-summary'   ).addClass('item-summary'   ).appendTo(elemSubtitle);}
    if(elemToolbar.length    === 0) { elemToolbar    = $('<div></div>').attr('id', id + '-toolbar'   ).addClass('item-toolbar'   ).appendTo(elemHeader);  }
    if(elemContent.length    === 0) { elemContent    = $('<div></div>').attr('id', id + '-content'   ).addClass('item-content'   ).appendTo(elemTop);     }

    elemDescriptor.html('');
        elemStatus.html('');
       elemSummary.html('');
       elemContent.html('');

    $('<div></div>').appendTo(elemContent).attr('id', id + '-item-workflow-history').addClass('item-workflow-history');
    $('<div></div>').appendTo(elemContent).attr('id', id + '-item-details').addClass('item-details');
    $('<div></div>').appendTo(elemContent).attr('id', id + '-item-custom').addClass('item-custom');
    $('<div></div>').appendTo(elemContent).attr('id', id + '-item-attachments').addClass('item-attachments');

    elemContent.children().addClass(classContents);

    if(workflowActions) {

        if(elemWorkflowActions.length === 0) {
            elemWorkflowActions = $('<select></select>').appendTo(elemToolbar)
                .attr('id', id + '-workflow-actions')
                .addClass('item-workflow-actions')
                .addClass('button');
        }

    }

    if(bookmark) {

        if(elemBookmark.length === 0) {
            elemBookmark = $('<div></div>').appendTo(elemToolbar)
                .attr('id', id + '-bookmark')
                .addClass('item-bookmark')
                .addClass('button')
                .addClass('icon')
                .addClass('icon-bookmark');
        }
        

    }

    if(openInPLM) {

        if(elemOpenInPLM.length === 0) {
            $('<div></div>').appendTo(elemToolbar)
                .attr('id', id + '-open-in-plm')
                .addClass('button')
                .addClass('icon')
                .addClass('icon-open')
                .addClass('xs')
                .addClass('item-open-in-plm')
                .attr('title', 'Open the selected item in PLM')
                .click(function() {
                    clickItemOpenInPLM($(this));
                });
        }
        

    }

    if(reload) {

        if(elemReload.length === 0) {
            elemReload = $('<div></div>').appendTo(elemToolbar)
                .attr('id', id + '-reload')
                .addClass('item-reload')
                .addClass('button')
                .addClass('icon')
                .addClass('icon-refresh')
                .click(function() {
                    setItemData(id, link);
                });
        }
    }

    if(elemClose.length === 0) { 
        elemClose = $('<div></div>').appendTo(elemToolbar)
            .attr('id', id + '-close')
            .addClass('button')
            .addClass('icon')
            .addClass('icon-close')
            .click(function() {
                $('#' + id).hide();
                $('#' + $('#' + id).attr('data-id-prev-screen')).show();
            });
    }

    showSummaryDone(id);
    setItemData(id, link);

    $('.screen').hide();
    let idPrevScreen = elemClicked.closest('.screen').attr('id');
    elemTop.attr('data-id-prev-screen', idPrevScreen).show();

}
function showSummaryDone(id) {}
function setItemData(id, link) {

    let elemDescriptor = $('#' + id + '-descriptor');
        elemDescriptor.html('');

    let elemStatus = $('#' + id + '-status');
        elemStatus.html('');

    let elemSummary = $('#' + id + '-summary');
        elemSummary.html('');

    $.get('/plm/details', { link : link}, function(response) {

        elemDescriptor.html(response.data.title);

        if(isBlank(response.data.currentState)) {
            elemStatus.hide();
        } else {
            elemStatus.html(response.data.currentState.title);
            elemStatus.css('background-color', '#000');
            for(let statesColor of settings.item[id].statesColors) {
                if(statesColor.states.indexOf(response.data.currentState.title) > -1) {
                    elemStatus.css('background-color', statesColor.color);
                    break;
                }
            }

        }

    });

    $.get('/plm/change-summary', { 'link' : link }, function(response) {

        let dateCreated  = new Date(response.data.createdOn);

        let elemCreatedBy = $('<span></span>')
            .attr('id', '#' + id + '-created-by')
            .addClass('item-created-by')
            .html(response.data.createdBy.displayName);

        let elemCreatedOn = $('<span></span>')
            .attr('id', '#' + id + '-created-on')
            .addClass('item-created-on')
            .html(dateCreated.toLocaleDateString());

        elemSummary.append('Created by ')
            .append(elemCreatedBy)
            .append(' on ')
            .append(elemCreatedOn);


        if(!isBlank(response.data.lastModifiedBy)) {

            let elemModifiedBy = $('<span></span>')
                .attr('id', '#' + id + '-modified-by')
                .addClass('item-modified-by')
                .html(response.data.lastModifiedBy.displayName);

            let elemModifiedOn = $('<span></span>')
                .attr('id', '#' + id + '-modified-on')
                .addClass('item-modified-on')
                .html(new Date(response.data.lastModifiedOn).toLocaleDateString());

            elemSummary.append('. Last modified by ')
                .append(elemModifiedBy)
                .append(' on ')
                .append(elemModifiedOn);

        }

    });

    getBookmarkStatus(link);

    let elemWorkflowActions = $('#' + id + '-workflow-actions');

    if(elemWorkflowActions.length > 0) {
        insertWorkflowActions(link, {
            id : id + '-workflow-actions'
        });
    }

    insertWorkflowHistory(link, {
        id                      : id + '-item-workflow-history',
        'headerLabel'           : 'Activity',
        'reload'                : false,
        'showNextTransitions'   : true,
        'transitionsEx'         : [],
        'finalStates'           : []
    });

    insertDetails(link, { 
        'id'            : id + '-item-details', 
        'reload'        : false ,
        hideComputed    : settings.item[id].hideComputed,
        hideReadOnly    : settings.item[id].hideReadOnly,
        hideLabels      : settings.item[id].hideLabels,
        suppressLinks   : settings.item[id].suppressLinks,
        editable        : settings.item[id].editable,
        layout          : 'compact',
        sectionsIn      : settings.item[id].sectionsIn,
        sectionsEx      : settings.item[id].sectionsEx,
        fieldsIn        : settings.item[id].fieldsIn,
        fieldsEx        : settings.item[id].fieldsEx
    });

    insertAttachments(link, { 
        id          : id + '-item-attachments',
        'size'      : 's', 
        'upload'    : settings.item[id].editable
    });

    switch(settings.item[id].additionalView) {

        case 'grid': 
            insertGrid(link, { 
                id      : id + '-item-custom',
                reload  : false
            });
            break;

        case 'relationships': 
            insertRelationships(link, { 
                id      : id + '-item-custom',
                reload  : false,
                layout  : settings.item[id].relLayout
            });
            break;

        default:
            break;

    }

}
function clickItemOpenInPLM(elemClicked) {
    let elemTop = elemClicked.closest('.item');
    openItemByLink(elemTop.attr('data-link'));
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

    for(let section of sections) {

        for(let field of section.fields) {

            if(field.type === 'MATRIX') {
                for(let matrix of section.matrices) {
                    for(let matrixFields of matrix.fields) {
                        for(let matrixField  of matrixFields) {
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



// Retrieve field object from item's sections data
function getSectionField(sections, fieldId) {

    if(isBlank(sections)) return null;

    for(let section of sections) {
        for(let field of section.fields) {
            let id = field.__self__.split('/')[10];
            if(id === fieldId) {
                return field;
            }
        }
    }

    return null;

}


// Retrieve field value from item's sections data
function getSectionFieldValue(sections, fieldId, defaultValue, property) {

    if(typeof sections === 'undefined') return defaultValue;
    if(sections === null) return defaultValue;

    for(let section of sections) {
        for(let field of section.fields) {
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

    for(let iField = 1; iField < row.rowData.length; iField++) {

        let field   = row.rowData[iField];
        let id      = field.__self__.split('/')[10];

        if(id === fieldId) {

            let value = field.value;

            if(isBlank(value)) return defaultValue;

            if(typeof value === 'object') {

                if(isBlank(property)) return field.value.link;
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



// Retrieve first image field ID
function getFirstImageFieldID(fields) {

    if(typeof fields === 'undefined') return '';
    if(fields === null) return '';

    for(let field of fields) {
        if(field.type.title === 'Image') {
            return field.fieldId;
        }
    }

    return '';

}


// Retrieve first image field value from item's sections data
function getFirstImageFieldValue(sections) {

    if(typeof sections === 'undefined') return '';
    if(sections === null) return '';

    for(let section of sections) {
        for(let field of section.fields) {
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
        console.log(fieldData);
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


// Add all derived fields to payload, adds given section if new
function addDerivedFieldsToPayload(payload, sections, dataDerivedFields) {

    if(isBlank(dataDerivedFields)) return;

    for(let section of dataDerivedFields.sections) {
        for(let field of section.fields) {
            let fieldId = field.__self__.split('/')[8];
            addFieldToPayload(payload, sections, null, fieldId, field.value);
        }
    }

}


// Update grid rows (add, update and delete to match data provided)
function updateGridData(link, key, data, deleteEmpty, callback) {

    for(let item of data) {
        item.addToGrid = true;
        for(let field of item) {
            if(field.fieldId === key) {
                item.valueKey = field.value;
                if(typeof item.valueKey === 'object') item.valueKey = field.value.link;
            }
        }
    }

    $.get('/plm/grid', { link : link }, function(response) {

        let requests = [];

        for(let row of response.data) {

            row.hasMatch    = false;
            row.update      = false;
            row.valueKey    = getGridRowValue(row, key, '');
            row.link        = row.rowData[0].__self__;
            row.id          = row.link.split('/')[10];

            if(!isBlank(row.valueKey)) {

                for(let item of data) {
                    
                    updateRow = false;

                    if(row.valueKey === item.valueKey) {

                        item.addToGrid = false;
                        row.hasMatch   = true;


                        for(let field of item) {
                           
                            let valueGrid = getGridRowValue(row, field.fieldId, '');
                            let itemValue = (typeof field.value === 'object') ? field.value.link : field.value;

                            if(valueGrid !== itemValue) {
                                row.update = true;
                                break;
                            }

                        }

                        if(row.update) requests.push($.get('/plm/update-grid-row', { link : link, rowId : row.id, data : item}))

                    }

                }

            } else if(!deleteEmpty) row.hasMatch = true;

            if(!row.hasMatch) requests.push($.get('/plm/remove-grid-row', { link : row.link}))

        }

        for(let item of data) {
            if(item.addToGrid) requests.push($.get('/plm/add-grid-row', { link : link, data : item}))

        }

        Promise.all(requests).then(function(responses) {
            console.log(responses);
            callback();
        });

    });

}


// Determine if given permission is granted
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