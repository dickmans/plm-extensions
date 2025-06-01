let userAccount         = { displayName : '', groupsAssigned : [] };
let languageId          = '1';
let username            = '';
let isiPad              = navigator.userAgent.match(/iPad/i)   != null;
let isiPhone            = navigator.userAgent.match(/iPhone/i) != null;
let applicationFeatures = {}
let viewerFeatures      = {};
let allWorkspaces       = [];


let settings = {
    create            : {},
    item              : {},
    details           : {},
    images            : {},
    attachments       : {},
    bom               : {},
    partList          : {},
    flatBOM           : {},
    roots             : {},
    parents           : {},
    changes           : {},
    grid              : {},
    managedItems      : {},
    processes         : {},
    relationships     : {},
    sourcing          : {},
    changeLog         : {},
    summary           : {},
    recents           : {},
    bookmarks         : {},
    mow               : {},
    search            : {},
    results           : {},
    viewer            : {},
    workspaceViews    : {},
    workspaceItems    : {},
    workflowHistory   : {},
    pdmFileProperties : {},
    users             : {}
}

const includesAny = (arr, values) => values.some(v => arr.includes(v));


$(document).ready(function() {  
          
         if(theme.toLowerCase() ===  'dark') { $('body').addClass( 'dark-theme'); theme =  'dark'; }
    else if(theme.toLowerCase() === 'black') { $('body').addClass('black-theme'); theme = 'black'; }
    else                                     { $('body').addClass('light-theme'); theme = 'light'; }

    insertAvatar();  
    enableTabs();
    enablePanelToggles();
    // enableOpenInNew();

    $('#header-logo'    ).click(function() { reloadPage(true); });
    $('#header-title'   ).click(function() { reloadPage(false); });
    $('#header-subtitle').click(function() { reloadPage(false); });

});


// Validate System Admin permission
function validateSystemAdminAccess(callback) {

    showStartupDialog();

    $.get('/plm/groups-assigned', {}, function (response) {

        let isSystemAdmin = false;

        for(let group of response.data) {
            if(group.shortName === 'Administration [SYSTEM]') isSystemAdmin = true;
        }

        if(!isSystemAdmin) {
            showErrorMessage('Not Permitted', 'This feature requires system admin privileges');
        } else {
            hideStartupDialog();
        }
        callback(isSystemAdmin);

    });

}


// Login as System Admin if permitted
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
                    showErrorMessage('Login Error', 'Failed to login with system admin privileges. Please review your Admin Client ID and Admin Client Secret in the settings file.');
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
function getFeatureSettings(app, requests, callback) {

    if(isBlank(config[app])) showErrorMessage('Improper Application Configuration', 'Your server configuration does not include the required profile settings to launch this application (config.' + app + '). Please contact your administrator.')
    
    else if(config[app].length === 0) {
        
        $('body').children().removeClass('hidden');
        getFeatureSettingsDone(app);
        callback();

    } else {

        if(!isBlank(config[app].applicationFeatures)) applicationFeatures = config[app].applicationFeatures;
        if(!isBlank(config[app].viewerFeatures))      viewerFeatures      = config[app].viewerFeatures; 

        let includesGroups = false;

        for(let applicationFeature of Object.keys(applicationFeatures)) {
            if(typeof applicationFeatures[applicationFeature] === 'object') {
                includesGroups = true;
                break;
            }
        }
        for(let viewerFeature of Object.keys(viewerFeatures)) {
            if(typeof viewerFeatures[viewerFeature] === 'object') {
                includesGroups = true;
                break;
            }
        }

        if(includesGroups) requests.push($.get('/plm/groups-assigned', { useCache : true }));

        if(requests.length === 0) {

            getFeatureSettingsDone(app);
            callback();

        } else {

            showStartupDialog();

            Promise.all(requests).then(function(responses) {

                if(includesGroups) {
                    for(let group of responses[responses.length - 1].data) userAccount.groupsAssigned.push(group.shortName);
                }

                for(let applicationFeature of Object.keys(applicationFeatures)) {
                    if(typeof applicationFeatures[applicationFeature] === 'object') {
                        console.log(applicationFeatures[applicationFeature]);
                        applicationFeatures[applicationFeature] = includesAny(userAccount.groupsAssigned, applicationFeatures[applicationFeature]);
                    }
                }

                for(let viewerFeature of Object.keys(viewerFeatures)) {
                    if(typeof viewerFeature[viewerFeature] === 'object') {
                        viewerFeature[viewerFeature] = includesAny(userAccount.groupsAssigned, viewerFeature[viewerFeature]);
                    }
                }

                $('body').children().removeClass('hidden');
                getFeatureSettingsDone(app);
                callback(responses);

            });

        }
    }

}
function getFeatureSettingsDone(app) {

    $('#startup').remove();

}


// Retrieve configuration profile from application settings for defined workspace ID
function getProfileSettings(appConfiguration, wsId) {

    let result = {};

    for(let appProfile of appConfiguration) {

        if(wsId === appProfile.wsId.toString()) {
            result = appProfile;
        }

    }

    return result;

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
function hideStartupDialog() {

    $('#startup').remove();
    $('#startup-logo').remove();
    $('body').children().removeClass('hidden');

}


// Insert Main Menu to switch utilities
function insertMenu() {

    if(menu.length === 0) return;

    let curUrl   = document.location.href;
    let showMenu = false;
    let endpoint = curUrl.split('/').pop();
    
    for(let column of menu) {
        for(let category of column) {
            for(let command of category.commands) {
                if(command.url.indexOf('/' + endpoint) === 0) {
                    showMenu = true;
                    break;
                }
            }
        }
    }

    if(!showMenu) return;

    $(document).click(function() { $('#menu').fadeOut(150); })

    $('<div></div>').insertBefore($('#header-logo'))
        .attr('id', 'menu-button')
        .addClass('icon')
        .addClass('icon-menu')
        .addClass('button')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            $('#menu').fadeIn(150);
        });

    let elemMenu = $('<div></div>').appendTo($('body'))
        .attr('id', 'menu')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();     
        })

    $('<div></div>').appendTo(elemMenu)
        .attr('id', 'menu-icon')
        .addClass('icon')
        .addClass('icon-menu')
        .click(function() {
            $('#menu').fadeOut(150);
        });

    let elemColumns = $('<div></div>').appendTo(elemMenu).attr('id', 'menu-columns');

    for(let column of menu) {

        let elemColumn = $('<div></div>').appendTo(elemColumns)
        let first      = true;

        for(let category of column) {

            let elemTitle = $('<div></div>').appendTo(elemColumn)
                .addClass('menu-title')
                .html(category.label);

            if(!first) elemTitle.css('margin-top', '78px');

            let elemCommands = $('<div></div>').appendTo(elemColumn)
                .addClass('menu-commands');

            for(let command of category.commands) {

                let elemCommand = $('<div></div>').appendTo(elemCommands)
                    .addClass('menu-command')
                    .attr('data-url', command.url)
                    .click(function(e) {
                        clickMenuCommand($(this));
                    });

                $('<div></div>').appendTo(elemCommand)
                    .addClass('menu-command-icon')
                    .addClass('icon')
                    .addClass(command.icon);

                let elemCommandName = $('<div></div>').appendTo(elemCommand)
                    .addClass('menu-command-name');

                $('<div></div>').appendTo(elemCommandName)
                    .addClass('menu-command-title')
                    .html(command.title);

                $('<div></div>').appendTo(elemCommandName)
                    .addClass('menu-command-subtitle')
                    .html(command.subtitle);

            }

            first = false;

        }
    }

}
function clickMenuCommand(elemCommand) {

    let url        = elemCommand.attr('data-url');
    let location   = document.location.href.split('?');
    let newParams  = (url.indexOf('?') > -1) ? url.split('?')[1].split('&') : [];
    let keepParams = ['theme']

    if(location.length > 1) {
        
        let curParams = location[1].split('&');

        for(let curParam of curParams) {

            let curName = curParam.split('=')[0];
            let add = keepParams.includes(curName);

            for(let newParam of newParams) {

                let newName = newParam.split('=')[0];

                if(newName.toLowerCase() === curName.toLowerCase()) {
                    add = false;
                    break;
                }

            }

            if(add) {
                url += (url.indexOf('?') > 0) ? '&' : '?';
                url += curParam;
            }

        }
    }

    document.location.href = url;

}


// Reset current page
function reloadPage(ret) {

    if(ret && (document.location.href !== document.referrer)) {
        document.location.href = document.referrer;
    } else {
        document.location.href = document.location.href;
    }

}


// Parse URL options and return JSON
function getURLParameters() {

    let result = {
        link  : '/api/v3/workspaces/' + wsId + '/items/' + dmsId,
        wsId  : wsId,
        dmsId : dmsId
    };

    for(let option of options) {

        let split   = option.split(':');
        let key     = split[0].toLowerCase();
        result[key] = split[1];

    }

    return result;

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

    switch(navigator.language.toLowerCase()) {
        case 'es'   :   languageId = '2'; break;
        case 'es-es':   languageId = '2'; break;
        case 'fr'   :   languageId = '3'; break;
        case 'fr-fr':   languageId = '3'; break;
        case 'de'   :   languageId = '4'; break;
        case 'de-de':   languageId = '4'; break;
    }

}


// Insert standard UI Elements
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
function appendViewerProcessing(id, hidden) {

    if(isBlank(id)) id = 'viewer';
    if(isBlank(hidden)) hidden = true;

    let elemViewer = $('#' + id);
    
    if(elemViewer.length === 0) return;
    
    let elemWrapper = $('<div></div>').insertAfter(elemViewer)
        .attr('id', id + '-processing')
        .addClass('viewer-processing')
        .addClass('viewer');
    
    let elemProcessing = $('<div></div>').appendTo(elemWrapper)
        .addClass('processing');

    $('<div></div>').appendTo(elemProcessing).addClass('bounce1');
    $('<div></div>').appendTo(elemProcessing).addClass('bounce2');
    $('<div></div>').appendTo(elemProcessing).addClass('bounce3');

    let elemMessage = $('<div></div>').insertAfter(elemViewer)
        .attr('id', id + '-message')
        .addClass('viewer-message')
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
function appendOverlay(hidden) {

    if(isBlank(hidden)) hidden = true;

    let elemOverlay = $('#overlay');

    if(elemOverlay.length === 0) {
     
        elemOverlay = $('<div></div>').appendTo('body')
            .attr('id', 'overlay');

        let elemProcessing = $('<div></div>').appendTo(elemOverlay)
            .addClass('processing')
            .attr('id', 'overlay-processing');

        $('<div></div>').appendTo(elemProcessing).addClass('bounce1');
        $('<div></div>').appendTo(elemProcessing).addClass('bounce2');
        $('<div></div>').appendTo(elemProcessing).addClass('bounce3');

    }

    if(!hidden) elemOverlay.show();

}
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

    return elemNoData;

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
function getSurfaceLevel(elem, includeParents) {

    if(isBlank(includeParents)) includeParents = true;

    if(elem.hasClass('surface-level-1')) return 'surface-level-1';
    if(elem.hasClass('surface-level-2')) return 'surface-level-2';
    if(elem.hasClass('surface-level-3')) return 'surface-level-3';
    if(elem.hasClass('surface-level-4')) return 'surface-level-4';
    if(elem.hasClass('surface-level-5')) return 'surface-level-5';

    if(includeParents) {

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

        if(elem.parent().parent().parent().hasClass('surface-level-1')) return 'surface-level-1';
        if(elem.parent().parent().parent().hasClass('surface-level-2')) return 'surface-level-2';
        if(elem.parent().parent().parent().hasClass('surface-level-3')) return 'surface-level-3';
        if(elem.parent().parent().parent().hasClass('surface-level-4')) return 'surface-level-4';
        if(elem.parent().parent().parent().hasClass('surface-level-5')) return 'surface-level-5';

    }

    return 'surface-level-1';

}


// Get surface level for content elements to match the parent class
function getMatchingContentSurfaceLevels(parentLevel) {

    let result = parentLevel;

    switch(parentLevel) {

        case 'surface-level-1': result = 'surface-level-2'; break;
        case 'surface-level-2': result = 'surface-level-3'; break;
        case 'surface-level-3': result = 'surface-level-2'; break;
        case 'surface-level-4': result = 'surface-level-3'; break;
        case 'surface-level-5': result = 'surface-level-4'; break;

    }

    return result;

}


// Set user profile picture
function insertAvatar() {

    let elemAvatar = $('#header-avatar');

    if(elemAvatar.length === 0) return;

    $.get('/plm/me', { useCache : false }, function(response) {

        userAccount.displayName  = response.data.displayName;
        userAccount.email        = response.data.email;
        userAccount.organization = response.data.organization;

        if(isBlank(response.data.image.large)) {

            elemAvatar.addClass('icon').addClass('icon-user').addClass('filled');

        } else {

            elemAvatar.html('')
                .addClass('no-icon')
                .attr('title', response.data.displayName + ' @ ' + tenant)
                .css('background', 'url(' + response.data.image.large + ')')
                .css('background-position', 'center')
                .css('background-size', elemAvatar.css('height'));

        }

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

    elemRowDays.append('<th class="calendar-day-name"></th>');
    elemRowDays.append('<th class="calendar-day-name">Mo</th>');
    elemRowDays.append('<th class="calendar-day-name">Tu</th>');
    elemRowDays.append('<th class="calendar-day-name">We</th>');
    elemRowDays.append('<th class="calendar-day-name">Th</th>');
    elemRowDays.append('<th class="calendar-day-name">Fr</th>');
    elemRowDays.append('<th class="calendar-day-name">Sa</th>');
    elemRowDays.append('<th class="calendar-day-name">Su</th>');
  
    elemTable.addClass('calendar');

    let currentYear     = currentDate.getFullYear();
    let currentMonth    = currentDate.getMonth();
    let firstDay        = new Date(currentYear, currentMonth, 1);
    let lastDay         = new Date(currentYear, currentMonth + 1, 0);
    let currentDay      = firstDay;
    let startDay        = firstDay.getDay() - 1;
    let onejan          = new Date(currentYear, 0, 1);
    let today           = new Date();
    
    while (currentDay <= lastDay) {

        let week = Math.ceil((((currentDay.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
    
        let weekRow = $('<tr></tr>').appendTo(elemBody)
            .addClass('calendar-week')
            .attr('data-week', week);
        
        $('<td></td>').appendTo(weekRow)
            .addClass('calendar-week-number')
            .attr('data-date', currentDay)
            .html(week)

        for (let i = 0; i < 7; i++) {

            let dayCell = $('<td></td>');
            let iDay    = currentDay.getDay();
            
            if(i >= startDay) {
                dayCell.attr('data-date', currentDay);
                dayCell.addClass('calender-week-day-' + i);
                if (currentDay >= firstDay && currentDay <= lastDay) {
                    dayCell.addClass('calendar-day');
                    if((iDay === 0) || (iDay === 6)) dayCell.addClass('calendar-weekend');

                    switch(iDay) {
                        case 0 : dayCell.attr('title', 'Sunday'   ); break;
                        case 1 : dayCell.attr('title', 'Monday'   ); break;
                        case 2 : dayCell.attr('title', 'Tuesday'  ); break;
                        case 3 : dayCell.attr('title', 'Wednesday'); break;
                        case 4 : dayCell.attr('title', 'Thursday' ); break;
                        case 5 : dayCell.attr('title', 'Friday'   ); break;
                        case 6 : dayCell.attr('title', 'Saturday' ); break;
                    }

                    dayCell.attr('data-date', iDay);
                    dayCell.html(currentDay.getDate());
                    if (currentDay.toDateString() === new Date().toDateString()) {
                        dayCell.addClass('calendar-day-current');
                        weekRow.addClass('calendar-week-current');
                    } else if(today.getTime() < currentDay.getTime()) {
                        dayCell.addClass('calendar-future');
                    } else {
                        dayCell.addClass('calendar-past');
                    }
                } else dayCell.addClass('calendar-day-next-month');
                startDay = -1;
                currentDay.setDate(currentDay.getDate() + 1);
            } else dayCell.addClass('calendar-day-prev-month'); 

            dayCell.appendTo(weekRow);
           
        }
    
    }

}


// Generate default settings object for item based and navigation views using genPanel*
function getPanelSettings(link, params, defaults, additional) {

    if(isBlank(defaults.hidePanel)        ) defaults.hidePanel         = false;
    if(isBlank(defaults.hideHeader)       ) defaults.hideHeader        = false;
    if(isBlank(defaults.hideHeaderLabel)  ) defaults.hideHeaderLabel   = false;
    if(isBlank(defaults.headerTopLabel)   ) defaults.headerTopLabel    = '';
    if(isBlank(defaults.headerLabel)      ) defaults.headerLabel       = '';
    if(isBlank(defaults.headerSubLabel)   ) defaults.headerSubLabel    = '';
    if(isBlank(defaults.openInPLM)        ) defaults.openInPLM         = false;
    if(isBlank(defaults.openOnDblClick)   ) defaults.openOnDblClick    = false;
    if(isBlank(defaults.search)           ) defaults.search            = false;
    if(isBlank(defaults.placeholder)      ) defaults.placeholder       = 'Type to search';
    if(isBlank(defaults.editable)         ) defaults.editable          = false;
    if(isBlank(defaults.reload  )         ) defaults.reload            = false;
    if(isBlank(defaults.multiSelect)      ) defaults.multiSelect       = false;
    if(isBlank(defaults.filterBySelection)) defaults.filterBySelection = false;
    if(isBlank(defaults.layout)           ) defaults.layout            = 'list';
    if(isBlank(defaults.number)           ) defaults.number            = true;
    if(isBlank(defaults.collapsePanel)    ) defaults.collapsePanel     = false;
    if(isBlank(defaults.collapseContents) ) defaults.collapseContents  = false;
    if(isBlank(defaults.groupBy)          ) defaults.groupBy           = '';
    if(isBlank(defaults.groupLayout)      ) defaults.groupLayout       = 'column';
    if(isBlank(defaults.additionalData)   ) defaults.additionalData    = [];
    if(isBlank(defaults.contentSize)      ) defaults.contentSize       = 'm';
    if(isBlank(defaults.contentSizes)     ) defaults.contentSizes      = [];
    if(isBlank(defaults.tileIcon)         ) defaults.tileIcon          = 'icon-product';
    if(isBlank(defaults.tileImage)        ) defaults.tileImage         = true;
    if(isBlank(defaults.tileTitle)        ) defaults.tileTitle         = 'DESCRIPTOR';
    if(isBlank(defaults.tileSubtitle)     ) defaults.tileSubtitle      = 'WF_CURRENT_STATE';
    if(isBlank(defaults.tileDetails)      ) defaults.tileDetails       = [];
    if(isBlank(defaults.tableColumnsLimit)) defaults.tableColumnsLimit = 100;
    if(isBlank(defaults.tableTotals)      ) defaults.tableTotals       = false;
    if(isBlank(defaults.tableRanges)      ) defaults.tableRanges       = false;
    if(isBlank(defaults.textNoData)       ) defaults.textNoData        = 'No Entries';
    if(isBlank(defaults.stateColors)      ) defaults.stateColors       = [];
    if(isBlank(defaults.counters)         ) defaults.counters          = false;
    if(isBlank(defaults.useCache)         ) defaults.useCache          = false;
    if(isBlank(defaults.singleToolbar)    ) defaults.singleToolbar     = '';
    if(isBlank(defaults.disconnectLabel)  ) defaults.disconnectLabel   = 'Remove';
    if(isBlank(defaults.disconnectIcon)   ) defaults.disconnectIcon    = 'icon-disconnect';
    if(isBlank(defaults.afterCompletion)  ) defaults.afterCompletion   = function (id) {};

    if(!isBlank(params.contentSizes)) params.contentSize = params.contentSizes[0];

    let settings = {
        link              : link,
        hidePanel         : isBlank(params.hidePanel)         ? defaults.hidePanel : params.hidePanel,
        hideHeader        : isBlank(params.hideHeader)        ? defaults.hideHeader : params.hideHeader,
        hideHeaderLabel   : isBlank(params.hideHeaderLabel)   ? defaults.hideHeaderLabel : params.hideHeaderLabel,
        headerTopLabel    : isBlank(params.headerTopLabel)    ? defaults.headerTopLabel : params.headerTopLabel,
        headerLabel       : isBlank(params.headerLabel)       ? defaults.headerLabel : params.headerLabel,
        headerSubLabel    : isBlank(params.headerSubLabel)    ? defaults.headerSubLabel : params.headerSubLabel,
        headerToggle      : isBlank(params.headerToggle)      ? false : params.headerToggle,
        compactDisplay    : isBlank(params.compactDisplay)    ? false : params.compactDisplay,
        openInPLM         : isBlank(params.openInPLM)         ? defaults.openInPLM : params.openInPLM,
        openOnDblClick    : isBlank(params.openOnDblClick)    ? defaults.openOnDblClick : params.openOnDblClick,
        search            : isBlank(params.search)            ? defaults.search : params.search,
        placeholder       : isBlank(params.placeholder)       ? defaults.placeholder : params.placeholder,
        reload            : isBlank(params.reload)            ? defaults.reload : params.reload,
        editable          : isBlank(params.editable)          ? defaults.editable : params.editable,
        multiSelect       : isBlank(params.multiSelect)       ? defaults.multiSelect : params.multiSelect,
        filterBySelection : isBlank(params.filterBySelection) ? defaults.filterBySelection : params.filterBySelection,
        actions           : isBlank(params.actions)           ? [] : params.actions,
        layout            : isBlank(params.layout)            ? defaults.layout : params.layout,
        collapsePanel     : isBlank(params.collapsePanel)     ? defaults.collapsePanel : params.collapsePanel,
        collapseContents  : isBlank(params.collapseContents)  ? defaults.collapseContents : params.collapseContents,
        groupBy           : isBlank(params.groupBy)           ? defaults.groupBy : params.groupBy,
        groupLayout       : isBlank(params.groupLayout)       ? defaults.groupLayout : params.groupLayout,
        additionalData    : isBlank(params.additionalData)    ? defaults.additionalData : params.additionalData,
        number            : isBlank(params.number)            ? defaults.number : params.number,
        contentSize       : isBlank(params.contentSize)       ? defaults.contentSize  : params.contentSize,
        contentSizes      : isBlank(params.contentSizes)      ? defaults.contentSizes  : params.contentSizes,
        tileIcon          : isBlank(params.tileIcon)          ? defaults.tileIcon  : params.tileIcon,
        tileImage         : isBlank(params.tileImage)         ? defaults.tileImage : params.tileImage,
        tileImageFieldId  : '',
        tileTitle         : isBlank(params.tileTitle)         ? defaults.tileTitle : params.tileTitle,
        tileSubtitle      : isBlank(params.tileSubtitle)      ? defaults.tileSubtitle : params.tileSubtitle,
        tileDetails       : isBlank(params.tileDetails)       ? defaults.tileDetails : params.tileDetails,
        tableHeaders      : isBlank(params.tableHeaders)      ? true : params.tableHeaders,
        tableColumnsLimit : isBlank(params.tableColumnsLimit) ? defaults.tableColumnsLimit : params.tableColumnsLimit,
        tableTotals       : isBlank(params.tableTotals)       ? defaults.tableTotals : params.tableTotals,
        tableRanges       : isBlank(params.tableRanges)       ? defaults.tableRanges : params.tableRanges,
        stateColors       : isBlank(params.stateColors)       ? defaults.stateColors : params.stateColors,
        counters          : isBlank(params.counters)          ? defaults.counters : params.counters,
        useCache          : isBlank(params.useCache)          ? defaults.useCache : params.useCache,
        textNoData        : isBlank(params.textNoData)        ? defaults.textNoData : params.textNoData,
        disconnectLabel   : isBlank(params.disconnectLabel)   ? defaults.disconnectLabel : params.disconnectLabel,
        disconnectIcon    : isBlank(params.disconnectIcon)    ? defaults.disconnectIcon : params.disconnectIcon,
        columnsIn         : isBlank(params.columnsIn)         ? [] : params.columnsIn,
        columnsEx         : isBlank(params.columnsEx)         ? [] : params.columnsEx,
        workspacesIn      : isBlank(params.workspacesIn)      ? [] : params.workspacesIn,
        workspacesEx      : isBlank(params.workspacesEx)      ? [] : params.workspacesEx,
        singleToolbar     : isBlank(params.singleToolbar)     ? defaults.singleToolbar : params.singleToolbar,
        onClickItem       : isBlank(params.onClickItem)       ? null : params.onClickItem,
        onDblClickItem    : isBlank(params.onDblClickItem)    ? null : params.onDblClickItem,
        afterCompletion   : isBlank(params.afterCompletion)   ? defaults.afterCompletion : params.afterCompletion,
        createWorkspaces  : [],
        columns           : [],
    }

    if(isBlank(settings.contentSize)) settings.contentSize = 'xs';

    if(settings.collapsePanel) settings.headerToggle = true;

    if(!isBlank(additional)) {
        for(let entry of additional) {

            let key   = entry[0];
            let value = entry[1];

            // settings[key] = isBlank(params[key]) ? value : params[key]
            settings[key] = isEmpty(params[key]) ? value : params[key]
    
        }
    }

    if(config.printViewSettings) console.log(settings);

    return settings;

}


// Generate and return panel elements
function genPanelTop(id, settings, className) {

    let elemTop = $('#' + id);

    if(elemTop.length === 0) {

        showErrorMessage('View Definition Error', 'Could not find html element with id "' + id + '" in page. Please contact your administrator');
        return null;

    } else {

        elemTop.addClass(className)
            .addClass('panel-top')
            .html('')
            .show();

    }

    settings.dialog = elemTop.hasClass('dialog');

    if(settings.dialog        ) { elemTop.addClass('surface-level-1'); appendOverlay(false); }
    if(settings.compactDisplay) { elemTop.addClass('compact'); }
    if(settings.counters      ) { elemTop.addClass('with-panel-counters'); }
    if(settings.multiSelect   ) { elemTop.addClass('multi-select'); }
    if(settings.hidePanel     ) { elemTop.addClass('hidden'); }
    if(settings.hideHeader    ) { elemTop.addClass('no-header'); }

    if(!isBlank(settings.link)) elemTop.attr('data-link', settings.link);

    return elemTop;

}
function genPanelToolbar(id, settings, name) {

    let suffix = (isBlank(settings.singleToolbar)) ? name : settings.singleToolbar;
        suffix = suffix.toLowerCase();

    let elemToolbar = $('#' + id + '-' + suffix);

    if(elemToolbar.length > 0) return elemToolbar;

    elemToolbar = $('<div></div>').attr('id', id + '-' + suffix);
    
    switch(suffix) {

        case 'controls': 
            elemToolbar.appendTo($('#' + id + '-header')).addClass('panel-controls'); 
            break;

        case 'actions': 
            elemToolbar.appendTo($('#' + id)).addClass('panel-actions'); 
            $('#' + id).addClass('with-panel-actions');
            break;

        case 'footer':
            elemToolbar.appendTo($('#' + id)).addClass('panel-footer'); 
            $('#' + id + '-content').addClass('with-panel-footer');
            break;

    }
    
    return elemToolbar;  

}
function genPanelHeader(id, settings) {

    let elemHeader = $('<div></div>', {
        id : id + '-header'
    }).addClass('panel-header').appendTo($('#' + id));

    if(settings.headerToggle) {

        $('<div></div>').appendTo(elemHeader)
            .addClass('panel-header-toggle')
            .addClass('icon')
            .addClass('icon-collapse');

        elemHeader.addClass('with-toggle');
        elemHeader.click(function() {
            $('body').toggleClass(id + '-panel-header-collapsed');
            togglePanelHeader($(this));
        });

    }

    if(settings.collapsePanel) elemHeader.click();

    let classNameTitle = 'single-line';
    
    let elemTitle = $('<div></div>').appendTo(elemHeader)
        .addClass('panel-title')
        .attr('id', id + '-title');

    if(!isBlank(settings.headerTopLabel)) {
        classNameTitle = 'multi-line';
        $('#' + id).addClass('with-top-title');
        $('<div></div>').appendTo(elemTitle)
            .addClass('panel-title-top')
            .attr('id', id + '-title-top')
            .html(settings.headerTopLabel);
    }
    if(!isBlank(settings.headerLabel)) {
        let label = (settings.headerLabel == 'descriptor') ? '' : settings.headerLabel;
        $('<div></div>').appendTo(elemTitle)
            .addClass('panel-title-main')
            .attr('id', id + '-title-main')
            .html(label);
    }
    if(!isBlank(settings.headerSubLabel)) {
        classNameTitle = 'multi-line';
        $('#' + id).addClass('with-sub-title');
        $('<div></div>').appendTo(elemTitle)
            .addClass('panel-title-sub')
            .attr('id', id + '-title-sub')
            .html(settings.headerSubLabel);
    }

    elemHeader.addClass(classNameTitle);

    if(settings.hideHeaderLabel) $('#' + id).addClass('no-header-title');

    genPanelHeaderCloseButton(id, settings);

}
function genPanelHeaderCloseButton(id, settings) {

    if(!settings.dialog) return;

    if(isBlank(settings.onClickCancel)) settings.onClickCancel = function() {};

    let elemToolbar = genPanelToolbar(id, settings, 'controls');

    let elemCloseButton = $('<div></div>').appendTo(elemToolbar)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-close')
        .addClass('panel-close')
        .attr('id', id + '-close')
        .attr('title', 'Close')
        .click(function() {
            $('#overlay').hide();
            $('#' + id).hide();
            settings.onClickCancel(id);
        });

    return elemCloseButton;

}
function genPanelBookmarkButton(id, settings) {

    if(!settings.bookmark) return;

    let elemButtonBookmark = $('#' + id + '-bookmark');

    if(elemButtonBookmark.length === 0) {

        let elemToolbar = genPanelToolbar(id, settings, 'controls');

        elemButtonBookmark = $('<div></div>').prependTo(elemToolbar)
            .attr('id', id + '-bookmark')
            .addClass('disabled')
            .addClass('button')
            .addClass('icon')
            .addClass('icon-bookmark')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                let elemButton = $(this);
                if(elemButton.hasClass('disabled')) return;
                elemButton.addClass('disabled')
                if(elemButton.hasClass('main')) {
                    $.get('/plm/remove-bookmark', { dmsId : elemButton.attr('data-dmsid') }, function () {
                        elemButton.removeClass('main');
                        elemButton.removeClass('disabled');
                    });
                } else {
                    $.get('/plm/add-bookmark', { dmsId : elemButton.attr('data-dmsid'), comment : ' ' }, function () {
                        elemButton.addClass('main');
                        elemButton.removeClass('disabled');
                    });
                }
            });

    }

    elemButtonBookmark.attr('data-dmsid', settings.link.split('/')[6])
        .removeClass('main')
        .addClass('disabled');

    return elemButtonBookmark;

}
function genPanelCloneButton(id, settings) {

    if(!settings.cloneable) return;

    let elemButtonClone = $('#' + id + '-clone');

    if(elemButtonClone.length > 0) {
        elemButtonClone.addClass('disabled');
        return elemButtonClone;
    }

    let elemToolbar = genPanelToolbar(id, settings, 'controls');

    elemButtonClone = $('<div></div>').appendTo(elemToolbar)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-clone')
        .addClass('disabled')
        .attr('data-link', settings.link)
        .attr('id', id + '-clone')
        .attr('title', 'Clone this record')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            let elemButton = $(this);
            if(elemButton.hasClass('disabled')) return;
            insertClone(elemButton.attr('data-link'), settings);
        });

    return elemButtonClone;

}
function genPanelWorkflowActions(id, settings) {


    if(isBlank(settings.workflowActions)) return;
    if(!settings.workflowActions) return;

    let elemToolbar = genPanelToolbar(id, settings, 'controls');

    let elemWorkflowActions = $('<select></select>').prependTo(elemToolbar)
        .attr('id', id + '-workflow-actions')
        .addClass('item-workflow-actions')
        .addClass('button')
        .hide();
    
    return elemWorkflowActions;

}
function genPanelOpenInPLMButton(id, settings) {

    if(!settings.openInPLM) return;

    let elemButtonOpenInPLM = $('#' + id + '-open');

    if(elemButtonOpenInPLM.length > 0) return elemButtonOpenInPLM;

    let elemToolbar = genPanelToolbar(id, settings, 'controls');

    elemButtonOpenInPLM = $('<div></div>').prependTo(elemToolbar)
        .attr('id', id + '-open')
        .addClass('button')
        .addClass('icon')
        .addClass('icon-open')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            openItemByLink($(this).closest('.panel-top').attr('data-link'));
        });

    return elemButtonOpenInPLM;

}
function genPanelOpenSelectedInPLMButton(id, settings) {

    if(!settings.openInPLM) return;

    let elemToolbar = genPanelToolbar(id, settings, 'controls');

    let elemButtonOpenSelectedInPLM = $('<div></div>').appendTo(elemToolbar)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-open')
        .addClass('xs')
        .addClass('single-select-action')
        .attr('title', 'Open selected item in PLM')
        .click(function(e) {

            e.preventDefault();
            e.stopPropagation();

            let elemContent  = $('#' + id + '-content');
            let elemLast     = elemContent.find('.content-item.last');
            let elemSelected = elemContent.find('.content-item.selected');

            if(elemLast.length > 0) openItemByLink(elemLast.attr('data-link'));
            else if(elemSelected.length > 0) openItemByLink(elemSelected.attr('data-link'));

        });

    return elemButtonOpenSelectedInPLM;

}
function genPanelSelectionControls(id, settings) {

    if(settings.multiSelect) {

        let elemToolbar = genPanelToolbar(id, settings, 'controls');

        $('<div></div>').appendTo(elemToolbar)
            .addClass('button')
            .addClass('icon')
            .addClass('icon-select-all')
            .addClass('xs')
            .attr('id', id + '-select-all')
            .attr('title', 'Select all')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                panelSelectAll(id, $(this));
            });


        $('<div></div>').appendTo(elemToolbar)
            .addClass('button')
            .addClass('icon')
            .addClass('icon-deselect-all')
            .addClass('xs')
            .addClass('multi-select-action')
            .attr('id', id + '-deselect-all')
            .attr('title', 'Deselect all')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                panelDeselectAll(id, $(this));
            });

        if(settings.filterBySelection) {

            $('<div></div>').appendTo(elemToolbar)
                .hide()    
                .addClass('button')
                .addClass('with-icon')
                .addClass('icon-toggle-off')
                .addClass('multi-select-action')
                .html('Selected')
                .attr('id', id + '-filter-selected-only')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    $(this).toggleClass('icon-toggle-off').toggleClass('icon-toggle-on').toggleClass('filled');
                    filterPanelContent(id);
                });

        }
    }

}
function genPanelToggleButtons(id, settings, callbackExpand, callbackCollapse) {

    if(!settings.toggles) return;

    let elemToolbar = genPanelToolbar(id, settings, 'controls');

    $('<div></div>').appendTo(elemToolbar)
        .addClass('button')
        .addClass('icon')
        .addClass('xs')
        .attr('id', id + '-action-expand-all')
        .attr('title', 'Expand All')
        .html('unfold_more')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            callbackExpand($(this));
        });

    $('<div></div>').appendTo(elemToolbar)
        .addClass('button')
        .addClass('icon')
        .addClass('xs')
        .attr('id', id + '-action-collapse-all')
        .attr('title', 'Collapse All')
        .html('unfold_less')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            callbackCollapse($(this));
        });

}
function genPanelFilterSelect(id, settings, property, suffix, label) {

    if(!settings[property]) return;

    let elemToolbar = genPanelToolbar(id, settings, 'controls');

    let elemFilter = $('<select></select>').appendTo(elemToolbar)
        .hide()
        .addClass('button')
        .addClass(id + '-filter')
        .attr('id', id + '-filter-' + suffix)
        .attr('data-label', label)
        .attr('data-key', 'data-filter-' + suffix)
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();     
        })
        .on('change', function(e) {
            e.preventDefault();
            e.stopPropagation();
            filterPanelContent(id);
        });

    return elemFilter;

}
function genPanelFilterToggle(id, settings, property, suffix, label) {

    if(!settings[property]) return;

    let elemToolbar = genPanelToolbar(id, settings, 'controls');

    let elemToggle =  $('<div></div>').appendTo(elemToolbar)
        .hide()    
        .addClass('button')
        .addClass('with-icon')
        .addClass('icon-toggle-off')
        .addClass(id + '-filter-toggle')
        .html(label)
        .attr('id', id + '-filter-'+ suffix)
        .attr('data-key', 'data-filter-' + suffix)
        .attr('data-value', 'yes')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).toggleClass('icon-toggle-off').toggleClass('icon-toggle-on').toggleClass('filled');
            filterPanelContent(id);
        });

    return elemToggle;

}
function genPanelFilterToggleEmpty(id, settings) {

    if(!settings.filterEmpty) return;

    let elemToolbar = genPanelToolbar(id, settings, 'controls');

    let elemToggle = $('<div></div>').appendTo(elemToolbar)
        .addClass('button')
        .addClass('with-icon')
        .addClass('icon-toggle-off')
        .html('Empty Cell')
        .attr('title', 'Focus on rows having empty inputs')
        .attr('id', id + '-filter-empty-only')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).toggleClass('icon-toggle-off').toggleClass('icon-toggle-on').toggleClass('filled');
            filterPanelContent(id);
        });

    return elemToggle;

}
function genPanelSearchInput(id, settings) {

    let elemToolbar = genPanelToolbar(id, settings, 'controls');

    let elemSearch = $('<div></div>').appendTo(elemToolbar)
        .addClass('button')
        .addClass('panel-search')
        .addClass('with-icon')
        .attr('id', id + '-search');

    $('<div></div>').appendTo(elemSearch)
        .addClass('button')
        .addClass('default')
        .addClass('icon')
        .addClass('icon-filter')
        .attr('data-mode', 'filter')
        .attr('id', id + '-filter').click(function() {
            panelToggleSearchMode(id, $(this));
        });

    $('<div></div>').appendTo(elemSearch)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-search')
        .attr('id', id + '-search')
        .attr('data-mode', 'search')
        .click(function() {
            panelToggleSearchMode(id, $(this));
        });

    $('<input></input>').appendTo(elemSearch)
        .attr('placeholder', settings.placeholder)
        .attr('id', id + '-search-input')
        .addClass('panel-search-input')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
        })
        .keyup(function(e) {
            e.preventDefault();
            e.stopPropagation();
            filterPanelContent(id);
        });

    $('<div></div>').appendTo(elemSearch)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-prev')
        .addClass('icon-continue')
        .css('z-index', -1)
        .attr('id', id + '-filter').click(function() {
            panelContinueSearch(id, 'prev');
        });

    $('<div></div>').appendTo(elemSearch)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-next')
        .addClass('icon-continue')
        .css('z-index', -1)
        .attr('id', id + '-filter').click(function() {
            panelContinueSearch(id, 'next');
        });

    if(!settings.search) elemSearch.hide();

    return elemSearch;

}
function panelToggleSearchMode(id, elemClicked) {

    elemClicked.addClass('default');
    elemClicked.siblings('.icon').removeClass('default');
    elemClicked.siblings('.icon-continue').css('z-index', '-1');  

    filterPanelContent(id);

}
function genPanelResizeButton(id, settings) {

    if(settings.contentSizes.length === 0) return;

    let elemButtonResize = $('#' + id + '-resize');

    if(elemButtonResize.length > 0) return elemButtonResize;

    let elemToolbar = genPanelToolbar(id, settings, 'controls');

    elemButtonResize = $('<div></div>').appendTo(elemToolbar)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-resize')
        .attr('id', id + '-resize')
        .attr('title', 'Cycle through alternate display sizes')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            panelResizeContents(id, settings.contentSizes);
        });

    return elemButtonResize;

}
function genPanelReloadButton(id, settings) {

    if(!settings.reload) return;

    let elemButtonReload = $('#' + id + '-reload');

    if(elemButtonReload.length > 0) return elemButtonReload;

    let elemToolbar = genPanelToolbar(id, settings, 'controls');

    elemButtonReload = $('<div></div>').appendTo(elemToolbar)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-refresh')
        .attr('id', id + '-reload')
        .attr('title', 'Reload from database')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            settings.load();
        });

    return elemButtonReload;

}
function genPanelActionButton(id, settings, suffix, label, title, callback) {

    let elemToolbar      = genPanelToolbar(id, settings, 'actions');
    let elemActionButton = $('#' + id + '-action-' + suffix);

    if(elemActionButton.length === 0) {

        elemActionButton = $('<div></div>').appendTo(elemToolbar)
            .addClass('button')
            .addClass('panel-action')
            .attr('id', id + '-action-' + suffix)
            .attr('title', title)
            .html(label)
            .click(function() {
                if($(this).hasClass('disabled')) return;
                callback();
            });

    }

    return elemActionButton;

}
function genPanelRemoveSelectedButton(id, settings, callback) {

    if(!settings.editable) return;

    let elemToolbar = genPanelToolbar(id, settings, 'actions');

    let elemButtonRemoveSelected = $('<div></div>').appendTo(elemToolbar)
        .addClass('red')
        .addClass('button')
        .addClass('with-icon')
        .addClass(settings.disconnectIcon)
        .addClass('xs')
        .addClass('single-select-action')
        .addClass('multi-select-action')
        .html(settings.disconnectLabel)
        .click(function() {
            callback();
        });

    return elemButtonRemoveSelected;

}
function genPanelContents(id, settings) {

    appendProcessing(id, false);

    elemNoData = appendNoDataFound(id, 'icon-no-data', settings.textNoData);
    elemNoData.addClass(settings.layout).hide();

    let elemTop = $('#' + id);

    let elemContent = $('<div></div>').appendTo(elemTop)
        .attr('id', id + '-content')
        .addClass('panel-content')
        .addClass('no-scrollbar')
        .addClass(settings.contentSize);

         if(settings.layout === 'table'  ) elemContent.addClass('table');
    else if(settings.layout === 'gallery') elemContent.addClass('tiles').addClass('gallery');
    else if(settings.layout === 'grid'   ) elemContent.addClass('tiles').addClass('grid');
    else if(settings.layout === 'list'   ) elemContent.addClass('tiles').addClass('list');
    else if(settings.layout === 'row'    ) {
        elemContent.addClass('tiles').addClass('row');
        if(!isBlank(settings.contentSize)) elemNoData.addClass(settings.contentSize);
        switch(settings.contentSize) {
            case 'xxs':
            case 'xs':
            case 's':
            case 'm': elemContent.addClass('wide'); break;
        }
    }

    if(settings.collapsePanel) {
        elemContent.addClass('hidden');
        elemContent.siblings('.no-data').addClass('hidden');
        elemContent.siblings('.processing').addClass('hidden');
    }

    if(settings.counters) {

        let elemCounters = $('<div></div>').appendTo(elemTop)
            .attr('id', id + '-counters')
            .addClass('panel-counters');

        $('<div></div>').appendTo(elemCounters).attr('id', id + '-counter-total'   ).addClass('panel-counter-total'   );

        if(elemTop.hasClass('bom')) {
            $('<div></div>').appendTo(elemCounters).attr('id', id + '-counter-unique'  ).addClass('panel-counter-unique'  );
        }

        $('<div></div>').appendTo(elemCounters).attr('id', id + '-counter-filtered').addClass('panel-counter-filtered');
        $('<div></div>').appendTo(elemCounters).attr('id', id + '-counter-selected').addClass('panel-counter-selected'); 
        
        if(settings.editable) {

            $('<div></div>').appendTo(elemCounters).attr('id', id + '-counter-changed' ).addClass('panel-counter-changed' );

        }

    }

    return elemContent;

}
function genPanelContentItem(settings, params) {

    if(isBlank(params)) params = {};

    if(isBlank(params.link)    ) params.link     = '';
    if(isBlank(params.title)   ) params.title    = ''; else if (isBlank(params.partNumber)) params.partNumber = params.title.split(' - ')[0];
    if(isBlank(params.group)   ) params.group    = '';
    if(isBlank(params.subtitle)) params.subtitle = '';

    let item = {
        link        : params.link,
        partNumber  : params.partNumber,
        imageId     : '',
        imageLink   : '',
        title       : params.title,
        subtitle    : params.subtitle,
        details     : [],
        data        : [],
        attributes  : [],
        status      : '',
        group       : params.group
    };

    if(!isBlank(settings.tileDetails)) {

        for(let detail of settings.tileDetails) {
                    
            item.details.push({
                icon    : detail.icon,
                prefix  : detail.prefix,
                fieldId : detail.fieldId,
                value   : ''
            });
    
        }

    }

    return item;

}
function genPanelFooterActionButton(id, settings, suffix, params, callback) {

    if(isBlank(params)) params = {};
    if(isBlank(params.label)) { params.label = ''; }

    let elemToolbar = genPanelToolbar(id, settings, 'footer');

    let elemActionButton = $('<div></div>').appendTo(elemToolbar)
        .addClass('button')
        .addClass('panel-action')
        .attr('id', id + '-action-' + suffix)
        .click(function(e) {
            callback();
        });

    if(!isBlank(params.title)) elemActionButton.attr('title', params.title);

    if(!isBlank(params.label)) {
        elemActionButton.html(params.label);
        if(!isBlank(params.icon)) {
            elemActionButton.addClass('with-icon');
        }
    } else if(!isBlank(params.icon)) {
        elemActionButton.addClass('icon');
    }

    if(!isBlank(params.icon)) {
        
        elemActionButton.addClass(params.icon);
    }
    
    if(!isBlank(params.hidden)) {
        if(params.hidden) {
            elemActionButton.hide();
        }
    }

    if(!isBlank(params.default)) {
        if(params.default) {
            elemActionButton.addClass('default');
        }
    }

    if(!isBlank(params.disabled)) {
        if(params.disabled) {
            elemActionButton.addClass('disabled');
        }
    }

    return elemActionButton;

}


// Start & finish update of panel contents to display right contents
function startPanelContentUpdate(id) {

    let elemSearch   = $('#' + id + '-search-input');
    let elemSelects  = $('.' + id + '-filter');
    let elemToggles  = $('.' + id + '-filter-toggle');
    let elemCounters = $('#' + id + '-counters');

    if(elemSelects.length > 0) {

        elemSelects.each(function() {

            let elemSelect = $(this);
            let label      = elemSelect.attr('data-label');
            
            elemSelect.children().remove();
            elemSelect.hide();
            
            if(!isBlank(label)) {
                $('<option></option>').appendTo(elemSelect)
                    .attr('value', 'all')
                    .html(label);
            }

        });
    }

    if(elemSearch.length > 0) elemSearch.val('');

    if(elemToggles.length > 0) {
        elemToggles.each(function() { 
            $(this).removeClass('icon-toggle-on')
                .removeClass('filled')
                .addClass('icon-toggle-off')
                .hide();
        })
    }

    if(elemCounters.length > 0) elemCounters.children().each(function() {
        $(this).html('').removeClass('not-empty');
    })

    $('#' + id).find('.single-select-action').hide();
    $('#' + id).find('.multi-select-action').hide();
    $('#' + id + '-actions').children('.panel-action').hide();
    $('#' + id + '-action-create').show().addClass('disabled');
    $('#' + id + '-content').html('').hide();
    $('#' + id + '-processing').show();
    $('#' + id + '-no-data').hide();    

    return new Date().getTime();

}
function stopPanelContentUpdate(response, settings) {

    settings.columns = [];

    if(response.params.timestamp != settings.timestamp) return true;
    // if(response.params.link      !== settings.link     ) return true;

    if(response.status === 403) {
        showErrorMessage('No Permission', 'Current user does not have access to the given tab of this workspace');
        return true;
    } else if((response.status !== 200) && (response.status !== 204)) {
        showErrorMessage('Error ' + response.status, 'Failed to retrieve data from PLM for panel ' + settings.headerLabel + '. Please contact your administrator.');
        return true;
    }    

    return false;

}
function setPanelBookmarkStatus(id, settings, responses) {

    if(!settings.bookmark) return;

    $('#' + id + '-bookmark').removeClass('disabled').removeClass('main');

    for(let response of responses) {
        if(response.url.indexOf('/bookmarks?') === 0) {
            for(let bookmark of response.data.bookmarks) {
                if(bookmark.item.link === response.params.link) {
                    $('#' + id + '-bookmark').addClass('main');
                }
            }
            break;
        }
    }

}
function setPanelCloneStatus(id, settings, responses) {

    if(!settings.cloneable) return;

    for(let response of responses) {
        if(response.url.indexOf('/permissions?') === 0) {
            if(hasPermission(response.data, 'add_items')) {
                $('#' + id + '-clone').removeClass('disabled');
                return;
            }
        }
    }

}
function includePanelTableColumn (name, settings, counter) {

    if(settings.tableColumnsLimit > counter) {
        if((settings.columnsIn.length === 0) || ( settings.columnsIn.includes(name))) {
            if((settings.columnsEx.length === 0) || (!settings.columnsEx.includes(name))) {
                return true;
            }
        }
    }

    return false;

}
function includePanelWorkspace (settings, name, id) {

    let included = false;
    let excluded = true;

    if(settings.workspacesIn.length === 0) {
        included = true;
    } else {
        for(let workspace of settings.workspacesIn) {
            if(workspace == name) { included = true; break; }
            if(workspace ==   id) { included = true; break; }
        }
    }

    if(settings.workspacesEx.length === 0) {
        excluded = false;
    } else {
        for(let workspace of settings.workspacesEx) {
            if(workspace == name) { excluded = true; break; }
            if(workspace ==   id) { excluded = true; break; }
        }
    }

    return (!excluded && included);

}
function setPanelFilterOptions(id, suffix, values) {

    let elemSelect = $('#' + id + '-filter-' + suffix);
    
    if(elemSelect.length === 0) return;

    if(!isBlank(values)) {

        for(let value of values) {

            $('<option></option').appendTo(elemSelect)
                .attr('value', value)
                .html(value);

        }

    }

    if(elemSelect.children().length > 2) elemSelect.show();

}
function setPanelContentActions(id, settings, responses) {

    if(!settings.editable) return;
    if(isBlank(responses)) return;

    let dataPermissions     = [];
    let dataWorkspaces      = [];
    let requestsPermissions = [];
    let showActions         = false;

    for(let response of responses) {
             if(response.url.indexOf('/permissions')       === 0) dataPermissions = response.data;
        else if(response.url.indexOf('/linked-workspaces') === 0) dataWorkspaces  = response.data;
    }

    if(!hasPermission(dataPermissions, 'edit_items')) {
        $('#' + id).removeClass('with-panel-actions');
        $('#' + id + '-actions').hide();
        return;
    }

    for(let workspace of dataWorkspaces) {
        let workspaceId = workspace.link.split('/').pop();
        if((settings.workspacesIn.length === 0) || ( settings.workspacesIn.includes(workspace) || ( settings.workspacesIn.includes(workspaceId)))) {
            if((settings.workspacesEx.length === 0) || (!settings.workspacesEx.includes(workspace) && !settings.workspacesEx.includes(workspaceId))) {
                requestsPermissions.push($.get('/plm/permissions', { link : workspace.link}))
            }
        }
    }

    Promise.all(requestsPermissions).then(function(responses) {
        for(let response of responses) {
            if(hasPermission(response.data, 'add_items')) {
                $('#' + id + '-action-create').removeClass('disabled');
                // showActions = true;
                settings.createWorkspaceIds.push(response.params.link.split('/')[4]);
            }
        }
        // if(showActions) $('#' + id).addClass('with-panel-actions'); else $('#' + id).removeClass('with-panel-actions');
    });

}
function finishPanelContentUpdate(id, settings, items, linkNew, data) {

    if(isBlank(data)) data = {};

    // Set dynamic panel header
    if(!isBlank(settings.headerLabel)) {
        if(settings.headerLabel == 'descriptor') {
            if(!isBlank(settings.descriptor)) {
                $('#' + id + '-title-main').html(settings.descriptor);
            }
        }
    }

    if(!isBlank(items)) {
        if(settings.layout === 'table') {                 
            genTable(id, items, settings);
        } else {
            genTilesList(id, items, settings);
        }
    }

    let elemContent = $('#' + id + '-content');

    $('#' + id + '-processing').hide();

    if(elemContent.find('.content-item').length > 0) {
        elemContent.show();
    } else {
        elemContent.hide();
        $('#' + id + '-no-data').show();
    }

    highlightNewPanelContent(id, linkNew);

    if(settings.counters) updatePanelCalculations(id);
    if(!isBlank(settings.afterCompletion)) settings.afterCompletion(id, data);

}
function highlightNewPanelContent(id, linkNew) {

    if(isBlank(linkNew)) return;

    $('#' + id + '-content').find('.content-item').each(function() {
        if($(this).attr('data-link') === linkNew) $(this).addClass('highlight');
    });

}


// Expand & Collapse all toggles for tree views
function expandAllNodes(id) {

    $('#' + id + '-content').find('.content-item').removeClass('hidden').removeClass('collapsed');
    filterPanelContent(id);
    
}
function collapseAllNodes(id) {

    $('#' + id + '-content').find('.content-item').each(function() {
        if(!$(this).hasClass('level-1')) {
            $(this).addClass('hidden');
        }
        if($(this).hasClass('node')) $(this).addClass('collapsed');
    });
    
}


// Filter panel content based on search input
function filterPanelContent(id) {

    let elemSearchInput  = $('#' + id + '-search-input');
    let searchMode       = elemSearchInput.siblings('.icon.default').attr('data-mode');
    let searchInputValue = elemSearchInput.val().toUpperCase();
    let elemContent      = $('#' + id + '-content');
    let elemNoData       = $('#' + id + '-no-data');
    let toggleSelected   = $('#' + id + '-filter-selected-only');
    let toggleEmpty      = $('#' + id + '-filter-empty-only');
    let toggleFilters    = $('.' + id + '-filter-toggle');
    let selectFilters    = $('.' + id + '-filter');
    let filterSelected   = false;
    let filterEmpty      = false;
    let filters          = [];
    let allHidden        = true;
    let clearAllFilters  = (searchInputValue === '');

    toggleFilters.each(function() {
        let elemToggle = $(this);
        if(elemToggle.hasClass('icon-toggle-on')) {
            filters.push({
                key   : elemToggle.attr('data-key'),
                value : elemToggle.attr('data-value')
            });
            clearAllFilters = false;
        }
    });

    selectFilters.each(function() {
        
        let elemSelect = $(this);
        let selectValue = elemSelect.val();

        if(selectValue !== 'all') {
            filters.push({
                key   : elemSelect.attr('data-key'),
                value : selectValue
            });
            clearAllFilters = false;
        }

    });

    if(toggleSelected.length > 0) {
        if(toggleSelected.hasClass('icon-toggle-on')) {
            filterSelected  = true;
            clearAllFilters = false;
        }  
    }

    if(toggleEmpty.length > 0) {
        if(toggleEmpty.hasClass('icon-toggle-on')) {
            filterEmpty     = true;
            clearAllFilters = false;
        }
    }


    elemContent.find('.content-item').each(function() {

        let elemContentItem = $(this);
        let showContentItem = true;
        let searchMatch     = true;

        elemContentItem.removeClass('result');

        if(filterSelected) {
            if(!elemContentItem.hasClass('selected')) showContentItem = false;
        }

        if(showContentItem) {
            for(let filter of filters) {
                let valueContentItem = elemContentItem.attr(filter.key);
                if(valueContentItem !== filter.value) showContentItem = false;
            }
        }

        if(searchInputValue !== '') {

            let content = '';

            if(elemContentItem.hasClass('tile')) {
                content = elemContentItem.find('.tile-title').html();
                content += elemContentItem.find('.tile-subtitle').html();
                elemContentItem.find('.tile-data').children().each(function() {
                    content += $(this).html();  
                });
            } else {
                elemContentItem.children().each(function() {
                    if($(this).children('.image').length === 0) {
                            if($(this).children('input').length === 1) content += $(this).children('input').val();
                        else if($(this).children('textarea').length === 1) content += $(this).children('textarea').val();
                        else content += $(this).html();
                    }
            
                });

            }

            searchMatch = (content.toUpperCase().indexOf(searchInputValue) >= 0) ? true : false;

        }

        if(showContentItem) {
            if(filterEmpty) {

                let hasEmptyContent = false;

                if(elemContentItem.hasClass('tile')) {
                    hasEmptyContent = (elemContentItem.find('.tile-title').html() === '');
                    if(!hasEmptyContent) hasEmptyContent = (elemContentItem.find('.tile-subtitle').html() === '');
                    if(!hasEmptyContent) {
                        elemContentItem.find('.tile-data').children().each(function() {
                            if($(this).html() === '') hasEmptyContent = true;
                        });
                    }
                } else {
                    elemContentItem.children().each(function() {
                        let elemCell = $(this);
                        if(elemCell.children().length === 0) {
                            hasEmptyContent = (elemCell.html() === '');
                        } else if(elemCell.children('.icon').length < 0) {
                            let fieldData = getFieldValue(elemCell);
                            hasEmptyContent = (isBlank(fieldData.value));
                        }
                    
                    });
                }

                showContentItem = hasEmptyContent;

            }
        }


        if(!showContentItem) {
            elemContentItem.hide(); 
        } else if((searchMode === 'filter') && (!searchMatch)) {
            elemContentItem.hide(); 
        } else {
            elemContentItem.show().removeClass('hidden');
            if(!clearAllFilters) {
                if((searchMode === 'filter') || (searchMatch)) elemContentItem.addClass('result');
            }
            allHidden = false;
        }

    });

    if(allHidden) { elemNoData.show(); elemContent.hide(); } else { elemNoData.hide(); elemContent.show(); }

    if(!allHidden) {
        if(!clearAllFilters) {
            if(!filterSelected) {
                if(elemContent.hasClass('tree')) {
                    
                    let parents = [];

                    elemContent.find('.content-item').each(function() {

                        let elemContentItem = $(this);
                        let level           = Number(elemContentItem.attr('data-level'));
                        let isNode          = elemContentItem.hasClass('node');

                        if(level <= parents.length) parents.splice(level - 1);

                        if(elemContentItem.hasClass('result')) {
                            for(let parent of parents) parent.show().removeClass('collapsed').addClass('result-parent');
                        }
            
                        if(isNode) parents.push($(this));

                    });
                }
            }
        }
    }

    elemContent.find('.content-item').removeClass('search-match');

    if(searchMode === 'search') {
        if(searchInputValue !== '') {
            elemSearchInput.siblings('.icon-continue').css('z-index', '');
            elemContent.find('.content-item.result').first().each(function() {
                $(this).addClass('search-match');
                let top = $(this).position().top - (elemContent.innerHeight() / 2);
                elemContent.animate({ scrollTop: top }, 500);
            });
        } else {
            elemSearchInput.siblings('.icon-continue').css('z-index', '-1');
        }
    }

    updatePanelCalculations(id);

}
function panelContinueSearch(id, direction) {

    let elemContent  = $('#' + id + '-content');
    let elemCurrent  = elemContent.find('.result.search-match');
    let elemContinue = (direction === 'next') ? elemCurrent.nextAll('.result').first() : elemCurrent.prevAll('.result').first();

    if(elemContinue.length > 0) {

        elemContinue.addClass('search-match');
        elemCurrent.removeClass('search-match');
        let top     = elemContinue.position().top - (elemContent.innerHeight() / 2);
                
        elemContent.animate({ scrollTop: top }, 250);

    }

}


// Calculated panel counters in case of relevant events
function updatePanelCalculations(id) {

    let elemTop         = $('#' + id);
    let totals          = elemTop.find('.table-total');
    let ranges          = elemTop.find('.table-range');
    let countTotal      = elemTop.find('.content-item').length;
    let countSelected   = elemTop.find('.content-item.selected').length;
    let countResults    = elemTop.find('.content-item.result').length;
    let countChanged    = elemTop.find('.content-item.changed').length;
    let countUnique     = 0;
    let links           = [];

    totals.each(function() {
        
        let elemCellTotal   = $(this);
        let index           = elemCellTotal.index();
        let total           = 0;

        elemTop.find('.content-item:visible').each(function() {
            if((countSelected === 0) || ($(this).hasClass('selected'))) {
                let value    = null;
                let elemCell = $(this).children().eq(index);
                if(elemCell.children().length === 0) {
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

        $('.content-item:visible').each(function() {
            if((countSelected === 0) || ($(this).hasClass('selected'))) {
                let value    = null;
                let elemCell = $(this).children().eq(index);
                if(elemCell.children().length === 0) {
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

    if(!elemTop.hasClass('with-panel-counters')) return;

    let elemCounterTotal    = $('#' + id + '-counter-total');
    let elemCounterUnique   = $('#' + id + '-counter-unique');
    let elemCounterFiltered = $('#' + id + '-counter-filtered');
    let elemCounterSelected = $('#' + id + '-counter-selected');
    let elemCounterChanged  = $('#' + id + '-counter-changed');

    elemCounterTotal.html(countTotal + ' total');

    if(countResults > 0) {
        elemCounterFiltered.html(countResults + ' match').addClass('not-empty');
    } else { elemCounterFiltered.html('').removeClass('not-empty'); } 

    if(countSelected > 0) {
        elemCounterSelected.html(countSelected + ' selected').addClass('not-empty');
    } else { elemCounterSelected.html('').removeClass('not-empty'); } 

    if(elemCounterChanged.length > 0) {
        if(countChanged > 0) {
            elemCounterChanged.html(countChanged + ' changed').addClass('not-empty');
        } else { elemCounterChanged.html('').removeClass('not-empty'); } 
    }

    if(elemCounterUnique.length > 0) {
        elemTop.find('.content-item').each(function() {
            let link = $(this).attr('data-link');
            if(!links.includes(link)) { links.push(link); countUnique++; }
        });
        elemCounterUnique.html(countUnique + ' unique');
    }

}


// Panel Selection Controls
function panelSelectAll(id, elemClicked) {

    $('#' + id + '-content').find('.content-item').addClass('selected');
    $('#' + id + '-content').find('.content-select-all').addClass('icon-check-box-checked').removeClass('icon-check-box');

    togglePanelToolbarActions(elemClicked);
    updatePanelCalculations(id);
    panelSelectAllDone(elemClicked);

}
function panelSelectAllDone(elemClicked) {}
function panelDeselectAll(id, elemClicked) {

    $('#' + id + '-content').find('.content-item').removeClass('selected');
    $('#' + id + '-content').find('.content-select-all').removeClass('icon-check-box-checked').addClass('icon-check-box');

    togglePanelToolbarActions(elemClicked);
    updatePanelCalculations(id);
    panelDeselectAllDone(elemClicked);

}
function panelDeselectAllDone(elemClicked) {}



// Save changes in editable table
function savePanelTableChanges(id, settings) {

    appendOverlay(false);

    $.get('/plm/sections', { wsId : settings.wsId, link : settings.link }, function(response) {
        console.log(response);
        saveListChanges(id, response.data);
    });


}
function saveListChanges(id, sections) {

    let elemTop     = $('#' + id);
    let listChanges = elemTop.find('.content-item.changed')

    if(listChanges.length === 0) {

        $('#' + id + '-save').hide();
        updatePanelCalculations(elemTop.attr('id'));
        savePanelTableChangesDone(id);
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
        
                elemItem.children('.changed').each(function() {
                    addFieldToPayload(params.sections, sections, $(this), null, null, false);
                });

                console.log(params);

                requests.push($.post('/plm/edit', params));
                elements.push(elemItem);

            }

        });

        Promise.all(requests).then(function(responses) {

            for(let element of elements) {
                element.removeClass('changed');
                element.children().removeClass('changed');
            }

            saveListChanges(id, sections);

        });

    }

}
function savePanelTableChangesDone(id) {}



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

    let elemContent = $('#' + id + '-content');
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


// Cycle through defined content sizes
function panelResizeContents(id, contentSizes) {

    let elemContent = $('#' + id + '-content');

    for(let index = 0; index < contentSizes.length; index++) {
        if(elemContent.hasClass(contentSizes[index])) {
            elemContent.removeClass(contentSizes[index]);
            let indexNew = (index + 1) % contentSizes.length;
            elemContent.addClass(contentSizes[indexNew]);
            return;
        }
    }

}


// Generate list of tiles
function genTilesList(id, items, settings) {

    let elemGroupList;
    let number      = 1;
    let groupName   = null;
    let elemContent = $('#' + id + '-content');

    if(!isBlank(settings.groupBy)) {
        sortArray(items, 'group', 'string', 'ascending');
        elemContent.addClass('contains-groups');
    }

    if(!isBlank(settings.groupLayout)) elemContent.addClass(settings.groupLayout);

    for(let item of items) {

        if(!isBlank(settings.groupBy)) {

            if(groupName !== item.group) {

                let elemGroup = $('<div></div>').appendTo(elemContent)
                    .addClass('tiles-group');

                $('<div></div>').appendTo(elemGroup)
                    .addClass('tiles-group-title')
                    .html(isBlank(item.group) ? 'n/a' : item.group);

                elemGroupList = $('<div></div>').appendTo(elemGroup)
                    .addClass('tiles-group-list')
                    .addClass('tiles')
                    .addClass(settings.layout)
                    .addClass(settings.contentSize)
                    .addClass(settings.surfaceLevel)
                    .addClass(getSurfaceLevel(elemContent));

                if(settings.layout === 'list') elemGroupList.addClass('list')
                else if(settings.layout === 'grid') elemGroupList.addClass('wide');

            }

            groupName = item.group;

        }

        if(item.partNumber === '') item.partNumber = item.title.split(' - ')[0];

        // if(!isBlank(item.image)) {

        //     if(item.image.indexOf('/') < 0) {

        //         item.image = '/api/v2/' 
        //             + item.link.split('/v3/')[1] 
        //             + '/field-values/' 
        //             + settings.fieldIdTileImage 
        //             + '/image/' 
        //             + item.image;
        //     }

        // }

        // let image    = (settings.workspaceViews[id].fieldIdImage === '') ? null : getWorkspaceViewRowValue(row, settings.workspaceViews[id].fieldIdImage, '', 'link');
        // let details  = [];

        let elemTile = genSingleTile({
            link        : item.link, 
            descriptor  : item.descriptor, 
            tileIcon    : settings.tileIcon, 
            tileNumber  : number++, 
            number      : settings.number, 
            partNumber  : item.partNumber,
            imageId     : item.imageId, 
            imageLink   : item.imageLink, 
            title       : item.title, 
            subtitle    : item.subtitle,
            details     : item.details,
            attributes  : item.attributes,
            status      : item.status
        }, settings).appendTo(elemContent);
        
        if(!isBlank(settings.groupBy) && (settings.groupLayout === 'horizontal')) elemTile.appendTo(elemGroupList);

        if(!isBlank(item.filters)) {
            for(let filter of item.filters) {
                elemTile.attr('data-filter-' + filter.key, filter.value);
            }
        }

        elemTile.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            clickContentItem($(this), e);
            togglePanelToolbarActions($(this));
            updatePanelCalculations(id);
            if(!isBlank(settings.onClickItem)) settings.onClickItem($(this));
            if(!isBlank(settings.viewerSelection)) {
                if(settings.viewerSelection) selectInViewer(id);
            }
        }).dblclick(function(e) {
            e.preventDefault();
            e.stopPropagation();
            if(!isBlank(settings.onDblClickItem)) settings.onDblClickItem($(this));
            else if(settings.openOnDblClick) openItemByLink($(this).attr('data-link'));
        });

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

    addTilesListImages(id, settings); 

}
function genSingleTile(params, settings) {

    if(isBlank(settings)) settings = {};
    if(isBlank(params  ))   params = {};
    if(isBlank(params.tileIcon)) params.tileIcon = 'icon-product';

    let elemTile        = $('<div></div>').addClass('tile').addClass('content-item');
    let elemTileImage   = $('<div></div>').appendTo(elemTile).addClass('tile-image');
    let elemTileDetails = $('<div></div>').appendTo(elemTile).addClass('tile-details');
    let elemTitle       = $('<div></div>').appendTo(elemTileDetails).addClass('tile-title');

    if(!isBlank(params.link)) elemTile.attr('data-link', params.link);
    if(!isBlank(params.partNumber)) elemTile.attr('data-part-number', params.partNumber);
    
    if(!isBlank(params.descriptor)) { 
        elemTile.attr('data-descriptor', params.descriptor); 
    }

    if(!isBlank(params.title)) { 
        elemTile.attr('data-title', params.title); 
        elemTitle.html(params.title); 
    }

    if(!isBlank(params.subtitle)) {
        $('<div></div>')
            .addClass('tile-subtitle')
            .addClass('no-scrollbar')
            .html(params.subtitle)
            .appendTo(elemTileDetails);
    }

    if(!isBlank(params.details)) {

        let elemData = $('<div></div>').appendTo(elemTileDetails).addClass('tile-data');
        
        for(let detail of params.details) {
            let elemDetails = $('<div></div>').appendTo(elemData);
            if(!isBlank(detail.icon)) elemDetails.addClass('with-icon').addClass(detail.icon).html(detail.value);
            else if(!isBlank(detail.prefix)) elemDetails.html(detail.prefix + ': ' + detail.value);
        }
            
    }

    if(!isBlank(params.attributes)) {
       for(let attribute of params.attributes) {
        let value = (typeof attribute.value === 'object') ? attribute.value.link : attribute.value;
        elemTile.attr('data-' + attribute.key, value);
       }
    }

    if(!isBlank(settings.stateColors)) {

        if(settings.stateColors.length > 0) {

            if(isBlank(params.status)) params.status = '';

            let color = 'transparent';
            let label = params.status;

            for(let stateColor of settings.stateColors) {
                if(!isBlank(stateColor.state)) {
                    if(!isBlank(params.status)) {
                        if(stateColor.state.toLowerCase() === params.status.toLowerCase()) {
                            color = stateColor.color;
                            if(!isBlank(stateColor.label)) label = stateColor.label;
                        }
                    }
                } else if(!isBlank(stateColor.states)) {
                    if(stateColor.states.includes(params.status)) {
                        color = stateColor.color;
                        if(!isBlank(stateColor.label)) label = stateColor.label;
                    }
                }
            }

            let elemTileStatus = $('<div></div>').appendTo(elemTile)
                .addClass('tile-status')
                .css('background-color', color);
                
            $('<div></div>').appendTo(elemTileStatus)
                .addClass('tile-status-label')
                .html(label);

        }

    }


    // TODO : REMOVE
    // if(!isBlank(params.status)) {

    //     if(isBlank(params.status.color)) params.status.color = 'transparent';

    //     let elemTileStatus = $('<div></div>').appendTo(elemTile)
    //         .addClass('tile-status')
    //         .css('background-color', params.status.color);
            
    //     $('<div></div>').appendTo(elemTileStatus)
    //         .addClass('tile-status-label')
    //         .html(params.status.label);

    // }

    if(isBlank(params.imageId) && isBlank(params.imageLink)) elemTile.addClass('no-image');
    
    if(params.imageLink.indexOf('https://images.profile.autodesk.com') === 0) {
        $('<img>').appendTo(elemTileImage)
            .attr('src', params.imageLink);
    } else if(params.number) {
        $('<div></div>').appendTo(elemTileImage)
            .addClass('tile-counter')
            .html(params.tileNumber);
    } else {
        $('<span></span>').appendTo(elemTileImage)
        .addClass('icon')
        .addClass(params.tileIcon);
    }
    
    appendImageFromCache(elemTileImage, settings, params, function() {});

    return elemTile;

}
function addTilesListImages(id, settings) {

    if(typeof settings.tileImage === 'string') return;
    if(typeof settings.tileImage === 'boolean') {
        if(!settings.tileImage) return;
    }

    $('#' + id + '-content').find('.tile.no-image').each(function() {
        let elemTile = $(this);
        $.get('/plm/details', { link : elemTile.attr('data-link'), useCache : true }, function(response) {
            let linkImage   = getFirstImageFieldValue(response.data.sections);
            let elemImage   = elemTile.find('.tile-image').first();
            appendImageFromCache(elemImage, settings, { 
                imageLink   : linkImage, 
                number      : settings.number,
                icon        : settings.tileIcon,
                link        : response.params.link
            }, function() {});
        });
    });

}
function addTilesListChevrons(id, settings, callback) {

    if(!settings.expand) return;

    $('#' + id + '-content').children('.tile').each(function() {
        
        let elemTile = $(this);
        
        $('<div></div>').prependTo(elemTile)
            .addClass('icon')
            .addClass('icon-expand')
            .addClass('tile-toggle')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).toggleClass('icon-expand').toggleClass('icon-collapse');
                callback($(this));
            })
            .dblclick(function(e) {
                e.preventDefault();
                e.stopPropagation();
            });

    });

}



// Generate single tile HTML
// function genTile(link, urn, image, icon, title, subtitle) {

//     let elemTile = $('<div></div>')
//         .addClass('tile')
//         .attr('data-title', title);

//     if(link !== '') elemTile.attr('data-link', link);
//     if(urn  !== '') elemTile.attr('data-urn',  urn );

//     let elemTileImage   = $('<div></div>').appendTo(elemTile).addClass('tile-image');
//     let elemTileDetails = $('<div></div>').appendTo(elemTile).addClass('tile-details');

//     $('<div></div>').appendTo(elemTileDetails)
//         .addClass('tile-title')
//         .html(title);

//     if(typeof subtitle !== 'undefined') {
//         $('<div></div>')
//             .addClass('tile-subtitle')
//             .html(subtitle)
//             .appendTo(elemTileDetails);
//     }
        
//     getImageFromCache(elemTileImage, { 'link' : image }, icon, '', function() {});

//     return elemTile;

// }



// Generate HTML Table & interactions
function genTable(id, items, settings) {

    if(isBlank(settings.multiSelect)) settings.multiSelect = false;
    if(isBlank(settings.editable)   ) settings.editable    = false;
    if(isBlank(settings.position)   ) settings.position    = false;
    if(isBlank(settings.descriptor) ) settings.descriptor  = false;
    if(isBlank(settings.quantity)   ) settings.quantity    = false;
    if(isBlank(settings.hideDetails)) settings.hideDetails = false;

    let elemContent = $('#' + id + '-content');
        elemContent.html('').show();

    let elemTable = $('<table></table>').appendTo(elemContent)
        .addClass('content-table')
        .addClass('fixed-header')
        .addClass('row-hovering')
        .attr('id', id + '-table');

    let elemTHead = $('<thead></thead>').appendTo(elemTable)
        .addClass('content-thead')
        .attr('id', id + '-thead');

    if(!settings.tableHeaders) { elemTHead.hide(); } else { genTableHeaders(id, elemTHead, settings); }

    let editableFields = (settings.editable) ? getEditableFields(settings.columns) : [];

    let elemTBody = $('<tbody></tbody>').appendTo(elemTable)
        .addClass('content-tbody')
        .attr('id', id + '-tbody');

    genTableRows(id, elemTBody, settings, items, editableFields);

    updateListCalculations(id);

}
function genTableHeaders(id, elemTHead, params) {

    let elemTHeadRow = $('<tr></tr>').appendTo(elemTHead);

    if(params.editable && params.multiSelect) {

        let elemToggleAll = $('<div></div>')
            .attr('id', id + '-select-all')
            .addClass('content-select-all')
            .addClass('icon')
            .addClass('icon-check-box')
            .addClass('xxs')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                clickTableToggleAll($(this));
            });


        $('<th></th>').appendTo(elemTHeadRow).append(elemToggleAll);

    }

    if(params.number    ) $('<th></th>').appendTo(elemTHeadRow).addClass('content-column-number').html('Nr');
    if(params.descriptor) $('<th></th>').appendTo(elemTHeadRow).addClass('content-column-descriptor').html('Item');
    if(params.quantity  ) $('<th></th>').appendTo(elemTHeadRow).addClass('content-column-quantity').html('Qty');

    if(!params.hideDetails) {

        for(let column of params.columns) {
            
            $('<th></th>').appendTo(elemTHeadRow)
                .html(column.displayName)
                .addClass('content-column-' + column.fieldId.toLowerCase());

        }

    }

    if(params.tableTotals) genTableTotals(elemTHead, params);
    if(params.tableRanges) genTableRanges(elemTHead, params);

}
function clickTableToggleAll(elemClicked) {

    let elemTop = elemClicked.closest('.panel-top');

    elemClicked.toggleClass('icon-check-box').toggleClass('icon-check-box-checked');

    if(elemClicked.hasClass('icon-check-box-checked')) {
        elemTop.find('.content-item').addClass('selected');
    } else {
        elemTop.find('.content-item').removeClass('selected');
    }

    togglePanelToolbarActions(elemClicked);
    updateListCalculations(elemTop.attr('id'));
    clickListToggleAllDone(elemClicked);

}
function genTableTotals(elemTHead, params) {

    let elemTotals = $('<tr></tr>').addClass('table-totals').appendTo(elemTHead);

    if(params.editable || params.multiSelect) $('<th></th>').appendTo(elemTotals); 
    if(params.number    ) $('<th></th>').appendTo(elemTotals)
    if(params.descriptor) $('<th></th>').appendTo(elemTotals).html('Totals');
    if(params.quantity  ) $('<th></th>').appendTo(elemTotals).html(0).addClass('table-total').attr('data-id', 'quantity');

    if(!params.hideDetails) {

        for(let column of params.columns) {

            let elemCell = $('<th></th>').appendTo(elemTotals);

            if(!isBlank(column.type)) {
                if((column.type.title === 'Integer') || (column.type.title === 'Float')) {
                    elemCell.html(0);
                    elemCell.addClass('table-total')
                    elemCell.attr('data-id', column.fieldId)
                }
            }
            
        }

    }

}
function genTableRanges(elemTHead, params) {

    let elemRanges = $('<tr></tr>').addClass('table-ranges').appendTo(elemTHead);

    if(params.editable || params.multiSelect) $('<th></th>').appendTo(elemRanges); 
    if(params.number    ) $('<th></th>').appendTo(elemRanges)
    if(params.descriptor) $('<th></th>').appendTo(elemRanges).html('Range');
    if(params.quantity  ) $('<th></th>').appendTo(elemRanges).html(0).addClass('table-range').attr('data-id', 'quantity');

    if(!params.hideDetails) {

        for(let column of params.columns) {
            
            let elemCell = $('<th></th>').appendTo(elemRanges);

            if(!isBlank(column.type)) {

                if((column.type.title === 'Integer') || (column.type.title === 'Float')) {
                    elemCell.addClass('table-range')
                    elemCell.attr('data-id', column.fieldId)
                }
            }
            
        }

    }

}
function genTableRows(id, elemTBody, settings, items, editableFields) {

    let count = 1;

    for(let item of items) {

        let quantity = Number(item.quantity).toFixed(2);

        let elemRow = $('<tr></tr>').appendTo(elemTBody)
            .addClass('content-item')
            .attr('data-link', item.link)
            .attr('data-title', item.title)
            .attr('data-part-number', item.partNumber)
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                clickContentItem($(this), e);
                togglePanelToolbarActions($(this));
                updatePanelCalculations(id);
                if(!isBlank(settings.onClickItem)) settings.onClickItem($(this));
                if(!isBlank(settings.viewerSelection)) {
                    if(settings.viewerSelection) selectInViewer(id);
                }
            }).dblclick(function(e) {
                e.preventDefault();
                e.stopPropagation();
                if(!isBlank(settings.onDblClickItem)) settings.onDblClickItem($(this));
                else if(settings.openOnDblClick) openItemByLink($(this).attr('data-link'));
            });

        if(settings.editable && settings.multiSelect) {

            $('<td></td>').appendTo(elemRow)
                .html('<div class="icon icon-check-box xxs"></div>')
                .addClass('content-item-check-box')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    clickContentItemSelect($(this));
                })
    
        }

        if(settings.number    ) $('<td></td>').appendTo(elemRow).addClass('content-column-number').html(count++);
        if(settings.descriptor) $('<td></td>').appendTo(elemRow).addClass('content-column-descriptor').html(item.title);                
        if(settings.quantity  ) $('<td></td>').appendTo(elemRow).addClass('content-column-quantity').html(quantity);

        if(!settings.hideDetails) {

            for(let column of settings.columns) {

                let isEditable  = false;
                let value       = '';
                let elemRowCell = $('<td></td>').appendTo(elemRow)
                    .attr('data-id', column.fieldId)
                    .addClass('list-column-' + column.fieldId.toLowerCase());

                for(let field of item.data) {
                    
                    if(field.fieldId === column.fieldId) {
                        
                        value = field.value;

                        if(settings.editable) {

                            for(let editableField of editableFields) {
                                
                                if(field.fieldId === editableField.id) {

                                    if(!isBlank(editableField.control)) {
                                
                                        let elemControl = editableField.control.clone();
                                            elemControl.appendTo(elemRowCell)
                                            .attr('data-id', editableField.id)
                                            .click(function(e) {
                                                e.stopPropagation();
                                                $(this).select();
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

                        if(!isBlank(field.classNames)) {
                            for(let className of field.classNames) elemRowCell.addClass(className);
                        }

                        break;
                   
                    }

                }

                if(!isEditable) elemRowCell.html($('<div></div>').html(value).text());

            }
        }

        if(!isBlank(item.filters)) {
            for(let filter of item.filters) {
                elemRow.attr('data-filter-' + filter.key, filter.value);
            }
        }

        if(!isBlank(item.classNames)) {
            for(let className of item.classNames) elemRow.addClass(className);
        }

    }

}
function panelTableCellValueChanged(elemControl) {

    let elemTop = elemControl.closest('.panel-top');
    let id      = elemTop.attr('id');
    let index   = elemControl.parent().index();
    let value   = elemControl.val();

    console.log(id);

    elemControl.parent().addClass('changed');
    elemControl.closest('tr').addClass('changed');

    $('#' + id + '-save').show();

    elemTop.find('.content-item.selected').each(function() {
        $(this).addClass('changed');
        $(this).children().eq(index).addClass('changed');
        $(this).children().eq(index).children().first().val(value);
    });

    updateListCalculations(id);
    updatePanelCalculations(id);

}
function togglePanelToolbarActions(elemClicked) {

    let elemParent          = elemClicked.closest('.panel-top');
    let elemToggleAll       = elemParent.find('.list-select-all');
    let actionsMultiSelect  = elemParent.find('.multi-select-action');
    let actionsSingleSelect = elemParent.find('.single-select-action');
    let countSelected       = elemParent.find('.content-item.selected').length;
    let countSelectedLast   = elemParent.find('.content-item.selected.last').length;
    let countAll            = elemParent.find('.content-item').length;

         if(countSelected     === 1 ) { actionsSingleSelect.show();  }
    else if(countSelectedLast === 1 ) { actionsSingleSelect.show();  }
    else                              { actionsSingleSelect.hide();  }
    
    if(countSelected   > 0)  actionsMultiSelect.show(); else actionsMultiSelect.hide();

    if(elemToggleAll.length === 0) return;

    if(countSelected === countAll) elemToggleAll.removeClass('icon-check-box').addClass('icon-check-box-checked');
    else                           elemToggleAll.addClass('icon-check-box').removeClass('icon-check-box-checked');


}


// function togglePanelToolbarActions(elemClicked) {

//     let elemParent          = elemClicked.closest('.panel-top');
//     let elemToggleAll       = elemParent.find('.list-select-all');
//     let actionsMultiSelect  = elemParent.find('.multi-select-action');
//     let actionsSingleSelect = elemParent.find('.single-select-action');
//     let countSelected       = elemParent.find('.content-item.selected').length;
//     let countSelectedLast   = elemParent.find('.content-item.selected.last').length;
//     let countAll            = elemParent.find('.content-item').length;

//          if(countSelected     === 1 ) { actionsSingleSelect.show();  }
//     else if(countSelectedLast === 1 ) { actionsSingleSelect.show();  }
//     else                              { actionsSingleSelect.hide();  }
    
//     if(countSelected   > 0)  actionsMultiSelect.show(); else actionsMultiSelect.hide();

//     if(elemToggleAll.length === 0) return;

//     if(countSelected === countAll) elemToggleAll.removeClass('icon-check-box').addClass('icon-check-box-checked');
//     else                           elemToggleAll.addClass('icon-check-box').removeClass('icon-check-box-checked');


// }

function clickListToggleAllDone(elemClicked) {}
function clickContentItemSelect(elemCheckbox, e) {

    let elemTop     = elemCheckbox.closest('.panel-top');
    let elemClicked = elemCheckbox.closest('.content-item');
    
    elemClicked.toggleClass('selected');

    if(!elemTop.hasClass('multi-select')) elemClicked.siblings().removeClass('selected');
    updateListCalculations(elemTop.attr('id'));
    togglePanelToolbarActions(elemClicked);
    clickContentItemSelectDone(elemClicked, e);

}
function clickContentItemDone(elemClicked, e) {}
function clickContentItem(elemClicked, e) {

    let elemTop  = elemClicked.closest('.panel-top');

    elemClicked.toggleClass('selected');
    elemClicked.siblings().removeClass('last');

    if(elemClicked.hasClass('selected')) elemClicked.addClass('last'); else elemClicked.removeClass('last');

    if(!elemTop.hasClass('multi-select')) elemClicked.siblings().removeClass('selected').removeClass('last');
    // updateListCalculations(elemTop.attr('id'));
    clickContentItemDone(elemClicked, e);

}
function clickContentItemDone(elemClicked, e) {}
function updateListCalculations(id) {

    let elemTop         = $('#' + id);
    let totals          = elemTop.find('.list-total');
    let ranges          = elemTop.find('.list-range');
    let countTotal      = elemTop.find('.content-item').length;
    let countSelected   = elemTop.find('.content-item.selected').length;
    let countVisible    = elemTop.find('.content-item:visible').length;
    let countChanged    = elemTop.find('.content-item.changed').length;

    totals.each(function() {
        
        let elemCellTotal   = $(this);
        let index           = elemCellTotal.index();
        let total           = 0;

        $('.content-item:visible').each(function() {
            if((countSelected === 0) || ($(this).hasClass('selected'))) {
                let value    = null;
                let elemCell = $(this).children().eq(index);
                if(elemCell.hasClass('content-item-quantity')) {
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

        $('.content-item:visible').each(function() {
            if((countSelected === 0) || ($(this).hasClass('selected'))) {
                let value    = null;
                let elemCell = $(this).children().eq(index);
                if(elemCell.hasClass('content-item-quantity')) {
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

    let elemCounterTotal    = $('#' + id + '-content-counter-total');
    let elemCounterFiltered = $('#' + id + '-content-counter-filtered');
    let elemCounterSelected = $('#' + id + '-content-counter-selected');
    let elemCounterChanged  = $('#' + id + '-content-counter-changed');

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

    $('.content-item.selected').each(function() {
        $(this).addClass('changed');
        $(this).children().eq(index).addClass('changed');
        $(this).children().eq(index).children().first().val(value);
    });

    updateListCalculations(id);

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

    elemList.children().each(function() {

        let text = $(this).html().toLowerCase();

        if(text.indexOf(value) > -1) $(this).show();
        else $(this).hide();

    });

}



// Save Dialogs with progress bars
function resetSaveActions() {

    let index = 1;

    for(let key of Object.keys(saveActions)) {
        $('.' + saveActions[key].className).removeClass(saveActions[key].className);
        saveActions[key].index = index++;
        saveActions[key].count = 0;
    }

}
function showSaveDialog(id) {



    if(isBlank(id)) id = 'dialog-save';

    let elemDialog = $('#' + id);

    if(elemDialog.length === 0) {

        elemDialog = $('<div></div>').appendTo($('body'))
            .addClass('dialog')
            .attr('id', id);

        $('<div></div>').appendTo(elemDialog)
            .addClass('dialog-header')    
            .html('Saving Changes');

        let elemContent = $('<div></div>').appendTo(elemDialog)
            .addClass('dialog-content');

        let elemFooter = $('<div></div>').appendTo(elemDialog)
            .addClass('dialog-footer');

        $('<div></div>').appendTo(elemFooter)
            .addClass('button')
            .addClass('default')
            // .addClass('disabled')
            .addClass('confirm-save')
            .css('float', 'unset')
            .css('margin', 'auto')
            .css('width', '50%')
            .attr('id', 'confirm-save')
            .html('Close')
            .click(function() {
                if($(this).hasClass('disabled')) return;
                else {
                    $('#overlay').hide();
                    $(this).closest('.dialog').hide();
                }
            });

        for(let key of Object.keys(saveActions)) {     
            
            let saveAction = saveActions[key];

            let elemStep = $('<div></div>').appendTo(elemContent)
                .addClass('step')
                .attr('id', 'step-1' + saveAction.index);

            $('<div></div>').appendTo(elemStep)
                .addClass('step-label')
                .attr('id', 'step-label-' + saveAction.index)
                .html(saveAction.label);

            let elemStepProgress = $('<div></div>').appendTo(elemStep)
                .addClass('step-progress');
            
            $('<div></div>').appendTo(elemStepProgress)
                .addClass('step-bar')
                .attr('id', 'step-bar-' + saveAction.index)
            
            $('<div></div>').appendTo(elemStep)
                .addClass('step-counter')
                .attr('id', 'step-counter-' + saveAction.index);

        }

    }

    $('.step-bar').addClass('transition-stopper')
    $('.step-bar').css('width', '0%');
    $('#overlay').show();
    elemDialog.find('.confirm-save').addClass('disabled').removeClass('default');
    elemDialog.find('.in-work').removeClass('in-work');
    $('#step-1').addClass('in-work');
    $('.step-bar').removeClass('transition-stopper');

    for(let key of Object.keys(saveActions)) {
        saveActions[key].count = $('.' + saveActions[key].className).length;
        $('#step-counter-' + saveActions[key].index).html('0 of ' + saveActions[key].count);
        $('#step-label-'   + saveActions[key].index).html(saveActions[key].label);
    }

    elemDialog.show();

}
function updateSaveProgressBar(action) {

    let pending  = $(action.selector + '.' + action.className);
    let progress = (action.count - pending.length) * 100 / action.count;

    $('#step-bar-'     + action.index).css('width', progress + '%');
    $('#step-counter-' + action.index).html((action.count - pending.length) + ' of ' + action.count);

    if(pending.length === 0) {

        let elemStep = $('#step-bar-' + action.index).closest('.step');

        $('#step-bar-' + action.index).css('width', '100%');
        elemStep.removeClass('in-work');
        elemStep.next().addClass('in-work');
        $('#step-counter-' + action.index).html(action.count + ' of ' + action.count);

    }

    return pending;

}
function storeNewItemLinks(action, elements, responses) {

    let index = 0;

    for(let element of elements) {
        
        let link = responses[index++].data.split('.autodeskplm360.net')[1];
        
        element.attr('data-link', link);
        element.removeClass(action.className);

    }

}
function storeNewBOMEdgeId(action, elements, responses) {

    let index = 0;

    for(let element of elements) {
        
        let edgeId = responses[index++].data.split('/bom-items/')[1];
        
        element.attr('data-edgeid', edgeId);
        element.removeClass(action.className);

    }

}
function endSaveProcessing(id) {

    if(isBlank(id)) id = 'dialog-save';

    let elemDialog = $('#' + id);

    elemDialog.find('.confirm-save').removeClass('disabled').addClass('default');
    elemDialog.find('.in-work').removeClass('in-work');    

}




// Tableau Management
function setTableau(wsId, name, columns, filters) {

    $.get('/plm/tableaus', { wsId : wsId }, function(response) {

        let exists = false;

        let params = {
            wsId    : wsId,
            name    : name,
            columns : columns,
            filters : filters
        }

        for(let tableau of response.data) {
            if(tableau.title === name) {
                params.link = tableau.link;
                exists      = true;
                continue;
            }
        }

        if(exists) {
            $.post('/plm/tableau-update', params, function(response) {
                return params.link;
            });
        } else {
            $.post('/plm/tableau-add', params, function(response) {
                return response.data;
            });
        }

    });

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
                    reqBOMAdditions.push($.post('/plm/bom-add', { 
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


// Generate item url for opening the matching record
function genItemURL(params) {

    if(isBlank(params.wsId) ) params.wsId  = params.link.split('/')[4];
    if(isBlank(params.dmsId)) params.dmsId = params.link.split('/')[6];
    if(isBlank(params.tab)  ) params.tab   = 'detail';

    let url  = 'https://' + tenant + '.autodeskplm360.net';
        url += '/plm/workspaces/' + params.wsId;
        url += '/items/itemDetails?view=full&tab=' + params.tab + '&mode=view&itemId=urn%60adsk,plm%60tenant,workspace,item%60';
        url += tenant.toUpperCase() + ',' + params.wsId + ',' + params.dmsId;

    return url;

}



// Get workspace name based on workspace id and vice versa
function getWorkspaceIdsFromNames(settings, callback) {

    if(settings.workspaceIds.length > 0) {

        callback(settings.workspaceIds);

    } else {

        if(allWorkspaces.length === 0) {

            $.get('/plm/workspaces', function(response) {
                for(let workspace of response.data.items) {
                    allWorkspaces.push({
                        id          : workspace.link.split('/')[4],
                        link        : workspace.link,
                        title       : workspace.title,
                        category    : workspace.category,
                        systemName : workspace.systemName
                    });
                }
                callback(matchWorkspaceIds(settings.workspacesIn));
            });

        } else callback(matchWorkspaceIds(settings.workspacesIn));

    }

}
function matchWorkspaceIds(listNames) {

    let workspaceIds = [];

    for(let name of listNames) {
        for(let workspace of allWorkspaces) {
            if(name == workspace.title) {
                workspaceIds.push(workspace.id);
                break;
            }
        }
    }

    return workspaceIds;

}
function getWorkspaceName(wsId, response) {

    let result = '';

    for(let workspace of response.data.items) {
        if(workspace.link.split('/')[4] === wsId) {
            result = workspace.title;
            break;
        }
    }

    return result;

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
function getFlatBOMNodeValue(node, key, property) {

    for(let occurence of node.occurrences) {
        for(let field of occurence.fields) {
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
function getBOMPartsList(settings, data) {

    let parts  = [];
    let fields = settings.viewFields || settings.columns;

    settings.iEdge = 0;
    settings.urns  = [];

    for(let field of fields) {
        if(field.fieldId === 'QUANTITY') {
            settings.urns.quantity = field.__self__.urn;
        } else if(field.fieldId === config.items.fieldIdNumber) {
            settings.urns.partNumber = field.__self__.urn;
        }
        if(!isBlank(settings.selectItems)) {
            if(field.fieldId === settings.selectItems.fieldId) settings.urns.selectItems = field.__self__.urn;
        }
    }

    getBOMParts(settings, parts, data.root, data.edges, data.nodes, 1.0, 1, '', []);

    return parts;

}
function getBOMParts(settings, parts, parent, edges, nodes, quantity, level, numberPath, path) {

    let result = { hasChildren : false };
    let fields = settings.viewFields || settings.columns;

    for(let i = settings.iEdge; i < edges.length; i++) {

        let edge = edges[i];

        if(edge.parent === parent) {

            if(i === settings.iEdge + 1) settings.iEdge = i;

            let node = { 
                quantity    : getBOMEdgeValue(edge, settings.urns.quantity, null, 0),
                partNumber  : getBOMCellValue(edge.child, settings.urns.partNumber, nodes),
                linkParent  : edge.edgeLink.split('/bom-items')[0],
                parent      : path[path.length - 1],
                level       : level,
                path        : path.slice(),
                fields      : [],
                edgeId      : edge.edgeId,
                number      : edge.itemNumber,
                numberPath  : numberPath + edge.itemNumber,
                details     : {}
            }

            node.path.push(node.partNumber);
            node.totalQuantity = node.quantity * quantity;

            result.hasChildren = true;

            for(let bomNode of nodes) {

                if(bomNode.item.urn === edge.child) {

                    node.link   = bomNode.item.link;
                    node.title  = bomNode.item.title;
                    node.root   = bomNode.rootItem.link;

                    for(let field of fields) {

                        let fieldData = {
                            fieldId     : field.fieldId,
                            name        : field.name,
                            displayName : field.displayName,
                            urn         : field.__self__.urn,
                            value       : ''
                        }
                        
                        node.details[field.fieldId] = null;

                        for(let nodeField of bomNode.fields) {
                            if(nodeField.metaData.urn === fieldData.urn) {
                                fieldData.value = nodeField.value;
                                node.details[field.fieldId] = nodeField.value;
                            }
                        }
                        
                        node.fields.push(fieldData);

                    }

                    break;

                }
            }

            if(!isBlank(settings.selectItems)) {
                if(settings.selectItems.hasOwnProperty('values')) {
                    let selectValue = getBOMCellValue(edge.child, settings.urns.selectItems, nodes);
                    if(settings.selectItems.values.includes(selectValue)) parts.push(node);
                } else parts.push(node);
            } else {
                parts.push(node);
            }

            let nodeBOM = getBOMParts(settings, parts, edge.child, edges, nodes, node.totalQuantity, level + 1, numberPath + edge.itemNumber + '.', node.path);

            node.hasChildren = nodeBOM.hasChildren;

        }

    }

    return result;

}
function getBOMRollUpValues(bom, rollUps, nodeId, edge) {

    let result = [];

    for(let rollUp of rollUps) {

        let value = 0.0;

        switch(rollUp.fieldTab) {

            case 'CUSTOM_BOM':
                if(nodeId === bom.root) {
                    for(let bomEdge of bom.edges) {
                        if(bomEdge.parent === bom.root) {
                            let rowValue = getBOMEdgeValue(bomEdge, rollUp.urn, null, 0.0);
                            value += parseFloat(rowValue);
                        }
                    }
                } else value = getBOMEdgeValue(edge, rollUp.urn, null, 0.0);
                break;

            default: 
                value = getBOMCellValue(nodeId, rollUp.urn, bom.nodes);
                break;

        }

        if(isBlank(value))      value = '0.00';
        else if(value ===  '0') value = '0.00';
        else if(value ===    0) value = '0.00';
        else if(value ===  0.0) value = '0.00';
        else if(value === 0.00) value = '0.00';
        else value = Math.round(value * 100) / 100;

        result.push(value);

    }

    return result;

}




function onSerialNumberClick(elemClicked) {

    if(elemClicked.hasClass('selected')) {
        let partNumber = elemClicked.attr('data-part-number');
        viewerSelectModel(partNumber);
    } else {
        viewerResetSelection();
    }

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

                if(isBlank(property)) { return field.value.link;
                } else if(property == 'title') { 
                    let result = field.value.title;
                    if(!isBlank(field.value.version)) result += ' ' + field.value.version;
                    return result;
                } else return field.value[property];
                
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

    if(isBlank(fields)) return;

    for(let field of fields) {
        if(field.type.title === 'Image') {
            return field.fieldId;
        }
    }

    return '';

}


// Retrieve all image field ID
function getAllImageFieldIDs(fields) {

    if(isBlank(fields)) return;

    let imageFields = [];

    for(let field of fields) {
        if(field.type.title === 'Image') {
            imageFields.push(field.__self__.split('/').pop());
        }
    }

    return imageFields;

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
function appendImageFromCache(elemParent, settings, params, onclick) {
    
    if(isBlank(params)) return;
    if(isBlank(params.replace)) params.replace = true;
    if(isBlank(params.link   )) params.link    = '/plm';

    if(elemParent.children().length === 0) {
    
        if(isBlank(params.number)) {
            $('<span></span>').appendTo(elemParent)
                .addClass('icon')
                .addClass(params.icon);
        } else {
            $('<div></div>').appendTo(elemParent)
                .addClass('tile-counter')
                .html(params.number);
        }

    }

    if(isBlank(params.imageLink)) {
        if(isBlank(params.imageId)) {
            return;
        }
    }

    let urlBase = (params.link.indexOf('/vault/') > -1) ? '/vault' : '/plm';

    $.get(urlBase + '/image-cache', {
        link        : params.link,
        imageId     : params.imageId,
        imageLink   : params.imageLink,
        fieldId     : settings.tileImageFieldId
    }, function(response) {

        if(response.error) return;

        let src = response.data.url;

        if(document.location.href.indexOf('/addins/') > -1) src = '../' + src;

        let elemImage = $('<img>').attr('src', src).on('load', function() {
            if(params.replace) elemParent.html('');
            elemParent.append($(this));
        });

        if(typeof onclick !== 'undefined') {
            elemImage.click(function() {
                onclick($(this))
            });
        }

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
            if(item.addToGrid) requests.push($.post('/plm/add-grid-row', { link : link, data : item}))

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