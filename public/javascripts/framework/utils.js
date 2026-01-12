let userAccount         = { displayName : '', groupsAssigned : [] };
let urlParameters       = {};
let languageId          = '1';
let username            = '';
let isiPad              = navigator.userAgent.match(/iPad/i)   != null;
let isiPhone            = navigator.userAgent.match(/iPhone/i) != null;
let applicationFeatures = {}
let viewerFeatures      = {};
let allWorkspaces       = [];
let downloadQueue       = [];


let settings = {}

const includesAny = (arr, values) => values.some(v => arr.includes(v));


$(document).ready(function() {  

    urlParameters = getURLParameters();
          
         if(theme.toLowerCase() ===  'dark') { $('body').addClass( 'dark-theme'); theme =  'dark'; }
    else if(theme.toLowerCase() === 'black') { $('body').addClass('black-theme'); theme = 'black'; }
    else                                     { $('body').addClass('light-theme'); theme = 'light'; }

    insertAvatar();  
    enableTabs();
    enablePanelToggles();
    setFormEvents();

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

    if(isBlank(config)) showErrorMessage('Improper Application Configuration', 'Your server configuration does not include the required profile settings to launch this application (config.' + app + '). Please contact your administrator.')
    
    else if(config.length === 0) {
        
        $('body').children().removeClass('hidden');
        getFeatureSettingsDone();
        callback();

    } else {

        if(!isBlank(config.applicationFeatures)) applicationFeatures = config.applicationFeatures;
        if(!isBlank(config.viewerFeatures))      viewerFeatures      = config.viewerFeatures; 

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

            getFeatureSettingsDone();
            callback();

        } else {

            showStartupDialog();

            Promise.all(requests).then(function(responses) {

                if(includesGroups) {
                    for(let group of responses[responses.length - 1].data) userAccount.groupsAssigned.push(group.shortName);
                }

                for(let applicationFeature of Object.keys(applicationFeatures)) {
                    if(typeof applicationFeatures[applicationFeature] === 'object') {
                        applicationFeatures[applicationFeature] = includesAny(userAccount.groupsAssigned, applicationFeatures[applicationFeature]);
                    }
                }

                for(let viewerFeature of Object.keys(viewerFeatures)) {
                    if(typeof viewerFeature[viewerFeature] === 'object') {
                        viewerFeature[viewerFeature] = includesAny(userAccount.groupsAssigned, viewerFeature[viewerFeature]);
                    }
                }

                $('body').children().removeClass('hidden');
                getFeatureSettingsDone();
                callback(responses);

            });

        }
    }

}
function getFeatureSettingsDone() {

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
        endpoint = endpoint.split('?')[0];
    
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

    insertMenuContents(elemMenu, 'menu-columns');

}
function insertMenuContents(elemParent, id) {

    let elemColumns = $('<div></div>').appendTo(elemParent).attr('id', id);

    for(let column of menu) {

        let elemColumn = $('<div></div>').appendTo(elemColumns)
        let first      = true;

        for(let category of column) {

            let elemTitle = $('<div></div>').appendTo(elemColumn)
                .addClass('menu-title')
                .html(category.label);

            if(!first) elemTitle.css('margin-top', '20px');

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

    let elemLastColumn = elemColumns.children().first();

    $('<div></div>').appendTo(elemLastColumn)
        .addClass('button')
        .css('margin', '78px 10px 0px 10px')
        .css('gap', '6px')
        .css('padding', '12px')
        .html('Fusion Manage Home')
        .click(function() {
            document.location.href = 'https://' + tenant + '.autodeskplm360.net';
        });

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
        link       : '',
        wsId       : (typeof wsId       === 'undefined') ? ((typeof  wsid === 'undefined') ? '' :  wsid) :  wsId,
        dmsId      : (typeof dmsId      === 'undefined') ? ((typeof dmsid === 'undefined') ? '' : dmsid) : dmsId,
        descriptor : (typeof descriptor === 'undefined') ? '' : descriptor,
        number     : (typeof number     === 'undefined') ? '' : number,
        type       : (typeof type       === 'undefined') ? '' : type,
    };
    
    if(result.wsId !== '') {
        if(result.dmsId !== '') {
            result.link = '/api/v3/workspaces/' + result.wsId + '/items/' + result.dmsId;
        }
    }

    let params = document.location.href.split('?');

    if(params.length > 1) {

        params = params[1].split('&');

        for(let param of params) {

            let split = param.split('=');
            let key   = split[0].toLowerCase();

            if(key == 'options') {
                let option = split[1].split(':');
                key = option[0].toLowerCase();
                result[key] = option[1];
            } else result[key] = split[1];

        }

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


// Get day of the year
function getDayOfYear(date = new Date()) {
    
    const start = new Date(date.getFullYear(), 0, 1);
    const diff  = date - start;
    
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;

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

    $('<div></div>').appendTo(elemWrapper)
        .addClass('viewer-processing-message')
        .attr('id', id + '-processing-message');

    let elemMessage = $('<div></div>').insertAfter(elemViewer)
        .attr('id', id + '-message')
        .addClass('viewer-message')
        .addClass('viewer')
        .addClass('hidden');

    $('<span></span>').appendTo(elemMessage)
        .addClass('icon')
        .html('view_in_ar');

    $('<span></span>').appendTo(elemMessage)
        .addClass('text')
        .html('No Viewable Found');

    let elemConversionError = $('<div></div>').insertAfter(elemViewer)
        .attr('id', id + '-conversion-error')
        .addClass('viewer-conversion-error')
        .addClass('viewer')
        .addClass('hidden');

    let elemConversionWrapper = $('<div></div>').appendTo(elemConversionError)
        .addClass('viewer-conversion-error-wrapper');

    $('<div></div>').appendTo(elemConversionWrapper)
        .addClass('icon')
        .addClass('filled')
        .addClass('icon-important');

    $('<div></div>').appendTo(elemConversionWrapper)
        .html('Error when converting file');

    $('<div></div>').appendTo(elemConversionWrapper)
        .attr('id', id + '-conversion-error-filename')
        .addClass('viewer-conversion-error-filename');

    $('<div></div>').appendTo(elemConversionWrapper)
        .html('Please try again by refreshing the viewer. If the error remains, please get in touch with your administrator.');

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

    if(!hidden) elemWrapper.removeClass('hidden');

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
function hideMessage() {

    $('#message').remove();

}


// Display Timeout Error
function showTimeoutError() {

    let site = document.location.href.split('/');

    if($('#timeout').length > 0) return;

    $('<div></div>').appendTo('body')
        .attr('id', 'timeout')
        .addClass(getSurfaceLevel($('body')));

    let elemWrapper = $('<div></div>').appendTo($('#timeout'))
        .attr('id', 'timeout-wrapper');

    $('<div></div>').appendTo(elemWrapper)
        .attr('id', 'timeout-icon')
        .addClass('icon')
        .addClass('icon-timeout');

     $('<div></div>').appendTo(elemWrapper)
        .attr('id', 'timeout-title') 
        .html('Requested Timed Out');

     $('<div></div>').appendTo(elemWrapper)
        .attr('id', 'timeout-message') 
        .html('Check your internet connection and validate access to ' + site[0]+'//' + site[2]);

    let elemActions = $('<div></div>').appendTo(elemWrapper)
        .attr('id', 'timeout-actions');

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .html('Close Message')
        .click(function() {
            $('#timeout').remove();
        });
        
    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('default')
        .html('Reload Page')
        .click(function() {
            document.location.href = document.location.href;
        });        
}
function hideStartupDialog() {

    $('#startup').remove();
    $('#startup-logo').remove();
    $('body').children().removeClass('hidden');

}


// Browse responses for errors and print given details to the browser console
function printResponsesErrorMessagesToConsole(responses) {

    let error = false;

    for(let response of responses) {
        if(printResponseErrorMessagesToConsole(response)) {
            error = true;
        }
    }

    return error;
}
function printResponseErrorMessagesToConsole(response) {

    if(!response.error) return false;

    console.log('!! Error when accessing ' + response.url + '. See request response details below.');
    console.log(response);

    return true;

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


// Add event listeners for form controls
function setFormEvents() {

    // Handle picklist controls
    $(document).on('keydown', function(e) {
        if(e.key == 'Escape') {
           $('.picklist').addClass('hidden');
        } else  if(e.key == 'Tab') {
           $('.picklist').addClass('hidden');
       }
    });

    $(document).click(function(e) { 

        let elemClicked        = $(e.target);
        let clickedInPicklist  = (elemClicked.closest('.picklist').length > 0);
        let elemPicklist       = elemClicked.next('.picklist');

        if(elemPicklist.length === 0) {
            if(elemClicked.hasClass('pickklist-open-shortcuts')) {
                elemPicklist = elemClicked.parent().next('.picklist');
            }
        }
        
        if(clickedInPicklist) return;
        else if(elemClicked.is('input')) {
            elemClicked.select();
        }

        $('.picklist').addClass('hidden');

        if(elemPicklist.length > 0) elemPicklist.removeClass('hidden');

    });

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

    if(isBlank(defaults.additionalData)       ) defaults.additionalData        = [];
    if(isBlank(defaults.collapsePanel)        ) defaults.collapsePanel         = false;
    if(isBlank(defaults.collapseContents)     ) defaults.collapseContents      = false;
    if(isBlank(defaults.contentSize)          ) defaults.contentSize           = 'm';
    if(isBlank(defaults.contentSizes)         ) defaults.contentSizes          = [];
    if(isBlank(defaults.counters)             ) defaults.counters              = false;
    if(isBlank(defaults.createButtonIcon)     ) defaults.createButtonIcon      = 'icon-create';
    if(isBlank(defaults.createButtonLabel)    ) defaults.createButtonLabel     = 'Create';
    if(isBlank(defaults.disconnectButtonIcon) ) defaults.disconnectButtonIcon  = 'icon-list-remove';
    if(isBlank(defaults.disconnectButtonLabel)) defaults.disconnectButtonLabel = 'Remove Selected';
    if(isBlank(defaults.editable)             ) defaults.editable              = false;
    if(isBlank(defaults.fieldsEx)             ) defaults.fieldsEx              = [];
    if(isBlank(defaults.fieldsIn)             ) defaults.fieldsIn              = [];
    if(isBlank(defaults.filterBySelection)    ) defaults.filterBySelection     = false;
    if(isBlank(defaults.groupBy)              ) defaults.groupBy               = '';
    if(isBlank(defaults.groupLayout)          ) defaults.groupLayout           = 'column';
    if(isBlank(defaults.hideButtonLabels)     ) defaults.hideButtonLabels      = false;
    if(isBlank(defaults.hideHeader)           ) defaults.hideHeader            = false;
    if(isBlank(defaults.hideHeaderControls)   ) defaults.hideHeaderControls    = false;
    if(isBlank(defaults.hideHeaderLabel)      ) defaults.hideHeaderLabel       = false;
    if(isBlank(defaults.hidePanel)            ) defaults.hidePanel             = false;
    if(isBlank(defaults.headerLabel)          ) defaults.headerLabel           = '';
    if(isBlank(defaults.headerSubLabel)       ) defaults.headerSubLabel        = '';
    if(isBlank(defaults.headerTopLabel)       ) defaults.headerTopLabel        = '';
    if(isBlank(defaults.layout)               ) defaults.layout                = 'list';
    if(isBlank(defaults.multiSelect)          ) defaults.multiSelect           = false;
    if(isBlank(defaults.number)               ) defaults.number                = true;
    if(isBlank(defaults.openInPLM)            ) defaults.openInPLM             = false;
    if(isBlank(defaults.openOnDblClick)       ) defaults.openOnDblClick        = false;
    if(isBlank(defaults.pagination)           ) defaults.pagination            = true;
    if(isBlank(defaults.placeholder)          ) defaults.placeholder           = 'Search';
    if(isBlank(defaults.reload)               ) defaults.reload                = false;
    if(isBlank(defaults.reset)                ) defaults.reset                 = false;
    if(isBlank(defaults.search)               ) defaults.search                = false;
    if(isBlank(defaults.showInDialog)         ) defaults.showInDialog          = false;
    if(isBlank(defaults.singleToolbar)        ) defaults.singleToolbar         = '';
    if(isBlank(defaults.stateColors)          ) defaults.stateColors           = [];
    if(isBlank(defaults.tableColumnsLimit)    ) defaults.tableColumnsLimit     = 100;
    if(isBlank(defaults.tableRanges)          ) defaults.tableRanges           = false;
    if(isBlank(defaults.tableTotals)          ) defaults.tableTotals           = false;
    if(isBlank(defaults.textNoData)           ) defaults.textNoData            = 'No Entries';
    if(isBlank(defaults.tileDetails)          ) defaults.tileDetails           = [];
    if(isBlank(defaults.tileIcon)             ) defaults.tileIcon              = 'icon-product';
    if(isBlank(defaults.tileImage)            ) defaults.tileImage             = true;
    if(isBlank(defaults.tileSubtitle)         ) defaults.tileSubtitle          = 'WF_CURRENT_STATE';
    if(isBlank(defaults.tileTitle)            ) defaults.tileTitle             = 'DESCRIPTOR';
    if(isBlank(defaults.useCache)             ) defaults.useCache              = false;
    if(isBlank(defaults.afterCompletion)      ) defaults.afterCompletion       = function (id) {};

    if(!isBlank(params.contentSizes)) params.contentSize = params.contentSizes[0];

    let panelSettings = {
        link                  : link,
        additionalData        : isBlank(params.additionalData)        ? defaults.additionalData : params.additionalData,
        collapsePanel         : isBlank(params.collapsePanel)         ? defaults.collapsePanel : params.collapsePanel,
        collapseContents      : isBlank(params.collapseContents)      ? defaults.collapseContents : params.collapseContents,
        compactDisplay        : isBlank(params.compactDisplay)        ? false : params.compactDisplay,
        contentSize           : isBlank(params.contentSize)           ? defaults.contentSize : params.contentSize,
        contentSizes          : isBlank(params.contentSizes)          ? defaults.contentSizes : params.contentSizes,
        counters              : isBlank(params.counters)              ? defaults.counters : params.counters,
        createButtonIcon      : isBlank(params.createButtonIcon)      ? defaults.createButtonIcon : params.createButtonIcon,
        createButtonLabel     : isBlank(params.createButtonLabel)     ? defaults.createButtonLabel : params.createButtonLabel,
        disconnectButtonIcon  : isBlank(params.disconnectButtonIcon)  ? defaults.disconnectButtonIcon : params.disconnectButtonIcon,
        disconnectButtonLabel : isBlank(params.disconnectButtonLabel) ? defaults.disconnectButtonLabel : params.disconnectButtonLabel,
        editable              : isBlank(params.editable)              ? defaults.editable : params.editable,
        fieldsEx              : isBlank(params.fieldsEx)              ? defaults.fieldsEx : params.fieldsEx,
        fieldsIn              : isBlank(params.fieldsIn)              ? defaults.fieldsIn : params.fieldsIn,
        filterBySelection     : isBlank(params.filterBySelection)     ? defaults.filterBySelection : params.filterBySelection,
        groupBy               : isBlank(params.groupBy)               ? defaults.groupBy : params.groupBy,
        groupLayout           : isBlank(params.groupLayout)           ? defaults.groupLayout : params.groupLayout,
        hideButtonLabels      : isBlank(params.hideButtonLabels)      ? defaults.hideButtonLabels : params.hideButtonLabels,
        hideHeader            : isBlank(params.hideHeader)            ? defaults.hideHeader : params.hideHeader,
        hideHeaderLabel       : isBlank(params.hideHeaderLabel)       ? defaults.hideHeaderLabel : params.hideHeaderLabel,
        hideHeaderControls    : isBlank(params.hideHeaderControls)    ? defaults.hideHeaderControls : params.hideHeaderControls,
        hidePanel             : isBlank(params.hidePanel)             ? defaults.hidePanel : params.hidePanel,
        headerLabel           : isBlank(params.headerLabel)           ? defaults.headerLabel : params.headerLabel,
        headerSubLabel        : isBlank(params.headerSubLabel)        ? defaults.headerSubLabel : params.headerSubLabel,
        headerToggle          : isBlank(params.headerToggle)          ? false : params.headerToggle,
        headerTopLabel        : isBlank(params.headerTopLabel)        ? defaults.headerTopLabel : params.headerTopLabel,
        layout                : isBlank(params.layout)                ? defaults.layout : params.layout,
        multiSelect           : isBlank(params.multiSelect)           ? defaults.multiSelect : params.multiSelect,
        number                : isBlank(params.number)                ? defaults.number : params.number,
        openInPLM             : isBlank(params.openInPLM)             ? defaults.openInPLM : params.openInPLM,
        openOnDblClick        : isBlank(params.openOnDblClick)        ? defaults.openOnDblClick : params.openOnDblClick,
        pagination            : isBlank(params.pagination)            ? defaults.pagination : params.pagination,
        placeholder           : isBlank(params.placeholder)           ? defaults.placeholder : params.placeholder,
        reload                : isBlank(params.reload)                ? defaults.reload : params.reload,
        reset                 : isBlank(params.reset)                 ? defaults.reset : params.reset,
        search                : isBlank(params.search)                ? defaults.search : params.search,
        showInDialog          : isBlank(params.showInDialog)          ? defaults.showInDialog : params.showInDialog,
        singleToolbar         : isBlank(params.singleToolbar)         ? defaults.singleToolbar : params.singleToolbar,
        stateColors           : isBlank(params.stateColors)           ? defaults.stateColors : params.stateColors,
        tileDetails           : isBlank(params.tileDetails)           ? defaults.tileDetails : params.tileDetails,
        tileIcon              : isBlank(params.tileIcon)              ? defaults.tileIcon  : params.tileIcon,
        tileImage             : isBlank(params.tileImage)             ? defaults.tileImage : params.tileImage,
        tileImageFieldId      : isBlank(params.tileImage)             ? '' : params.tileImage,
        tileSubtitle          : isBlank(params.tileSubtitle)          ? defaults.tileSubtitle : params.tileSubtitle,
        tileTitle             : isBlank(params.tileTitle)             ? defaults.tileTitle : params.tileTitle,
        tableColumnsLimit     : isBlank(params.tableColumnsLimit)     ? defaults.tableColumnsLimit : params.tableColumnsLimit,
        tableHeaders          : isBlank(params.tableHeaders)          ? true : params.tableHeaders,
        tableRanges           : isBlank(params.tableRanges)           ? defaults.tableRanges : params.tableRanges,
        tableTotals           : isBlank(params.tableTotals)           ? defaults.tableTotals : params.tableTotals,
        textNoData            : isBlank(params.textNoData)            ? defaults.textNoData : params.textNoData,
        useCache              : isBlank(params.useCache)              ? defaults.useCache : params.useCache,
        workspacesIn          : isBlank(params.workspacesIn)          ? [] : params.workspacesIn,
        workspacesEx          : isBlank(params.workspacesEx)          ? [] : params.workspacesEx,
        onClickItem           : isBlank(params.onClickItem)           ? null : params.onClickItem,
        onDblClickItem        : isBlank(params.onDblClickItem)        ? null : params.onDblClickItem,
        afterCompletion       : isBlank(params.afterCompletion)       ? defaults.afterCompletion : params.afterCompletion,
        createWorkspaceIds    : [],
        columns               : [],
    }

    // if(isBlank(panelSettings.contentSize)) panelSettings.contentSize = 'xs';

    if(panelSettings.collapsePanel) panelSettings.headerToggle = true;

    if(!isBlank(additional)) {
        for(let entry of additional) {

            let key   = entry[0];
            let value = entry[1];

            // panelSettings[key] = isBlank(params[key]) ? value : params[key]
            panelSettings[key] = isEmpty(params[key]) ? value : params[key]
    
        }
    }

    if(debugMode) console.log(panelSettings);

    panelSettings.mode = 'initial';

    return panelSettings;

}


// Generate and return panel elements
function genPanelTop(id, panelSettings, className) {

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

    if(elemTop.hasClass('dialog')) panelSettings.showInDialog = true;

    if(panelSettings.showInDialog  ) { elemTop.addClass('surface-level-1').addClass('dialog'); appendOverlay(false); }
    if(panelSettings.compactDisplay) { elemTop.addClass('compact'); }
    if(panelSettings.counters      ) { elemTop.addClass('with-panel-counters'); }
    if(panelSettings.multiSelect   ) { elemTop.addClass('multi-select'); }
    if(panelSettings.hidePanel     ) { elemTop.addClass('hidden'); }
    if(panelSettings.hideHeader    ) { elemTop.addClass('no-header'); }

    if(!isBlank(panelSettings.link)) elemTop.attr('data-link', panelSettings.link);

    panelSettings.elemTop = elemTop;
    elemTop.removeClass('with-files-download');

    return elemTop;

}
function genPanelToolbar(id, panelSettings, name) {

    let suffix = (isBlank(panelSettings.singleToolbar)) ? name : panelSettings.singleToolbar;
        suffix = suffix.toLowerCase();

    let elemToolbar = $('#' + id + '-' + suffix);

    if(elemToolbar.length > 0) return elemToolbar;

    elemToolbar = $('<div></div>').attr('id', id + '-' + suffix);
    
    switch(suffix) {

        case 'controls': 
            elemToolbar.appendTo($('#' + id + '-header')).addClass('panel-controls'); 
            if(panelSettings.hideHeaderControls) elemToolbar.addClass('hidden');
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
function genPanelHeader(id, panelSettings) {

    let elemHeader = $('<div></div>', {
        id : id + '-header'
    }).addClass('panel-header').appendTo($('#' + id));

    if(panelSettings.headerToggle) {

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

    if(panelSettings.collapsePanel) elemHeader.click();

    let classNameTitle = 'single-line';
    
    let elemTitle = $('<div></div>').appendTo(elemHeader)
        .addClass('panel-title')
        .attr('id', id + '-title');

    if(!isBlank(panelSettings.headerTopLabel)) {
        classNameTitle = 'multi-line';
        $('#' + id).addClass('with-top-title');
        $('<div></div>').appendTo(elemTitle)
            .addClass('panel-title-top')
            .attr('id', id + '-title-top')
            .html(panelSettings.headerTopLabel);
    }
    if(!isBlank(panelSettings.headerLabel)) {
        let label = (panelSettings.headerLabel == 'descriptor') ? '' : panelSettings.headerLabel;
        $('<div></div>').appendTo(elemTitle)
            .addClass('panel-title-main')
            .attr('id', id + '-title-main')
            .html(label);
    }
    if(!isBlank(panelSettings.headerSubLabel)) {
        classNameTitle = 'multi-line';
        $('#' + id).addClass('with-sub-title');
        $('<div></div>').appendTo(elemTitle)
            .addClass('panel-title-sub')
            .attr('id', id + '-title-sub')
            .html(panelSettings.headerSubLabel);
    }

    elemHeader.addClass(classNameTitle);

    if(panelSettings.hideHeaderLabel) $('#' + id).addClass('no-header-title');

    genPanelHeaderCloseButton(id, panelSettings);

}
function genPanelHeaderCloseButton(id, panelSettings) {

    if(!panelSettings.showInDialog) return;

    if(isBlank(panelSettings.onClickCancel)) panelSettings.onClickCancel = function() {};

    let elemToolbar = genPanelToolbar(id, panelSettings, 'controls');

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
            panelSettings.onClickCancel(id);
        });

    return elemCloseButton;

}
function genPanelBookmarkButton(id, panelSettings) {

    if(!panelSettings.bookmark) return;

    let elemButtonBookmark = $('#' + id + '-bookmark');

    if(elemButtonBookmark.length === 0) {

        let elemToolbar = genPanelToolbar(id, panelSettings, 'controls');

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

    elemButtonBookmark.attr('data-dmsid', panelSettings.link.split('/')[6])
        .removeClass('main')
        .addClass('disabled');

    return elemButtonBookmark;

}
function genPanelCloneButton(id, panelSettings) {

    if(!panelSettings.cloneable) return;

    let elemButtonClone = $('#' + id + '-clone');

    if(elemButtonClone.length > 0) {
        elemButtonClone.addClass('disabled');
        return elemButtonClone;
    }

    let elemToolbar = genPanelToolbar(id, panelSettings, 'controls');

    elemButtonClone = $('<div></div>').appendTo(elemToolbar)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-clone')
        .addClass('disabled')
        .attr('data-link', panelSettings.link)
        .attr('id', id + '-clone')
        .attr('title', 'Clone this record')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            let elemButton = $(this);
            if(elemButton.hasClass('disabled')) return;
            insertClone(elemButton.attr('data-link'), panelSettings);
        });

    return elemButtonClone;

}
function genPanelWorkflowActions(id, panelSettings) {


    if(isBlank(panelSettings.workflowActions)) return;
    if(!panelSettings.workflowActions) return;

    let elemToolbar = genPanelToolbar(id, panelSettings, 'controls');

    let elemWorkflowActions = $('<select></select>').prependTo(elemToolbar)
        .attr('id', id + '-workflow-actions')
        .addClass('item-workflow-actions')
        .addClass('button')
        .hide();
    
    return elemWorkflowActions;

}
function genPanelOpenInPLMButton(id, panelSettings) {

    if(!panelSettings.openInPLM) return;

    let elemButtonOpenInPLM = $('#' + id + '-open');

    if(elemButtonOpenInPLM.length > 0) return elemButtonOpenInPLM;

    let elemToolbar = genPanelToolbar(id, panelSettings, 'controls');

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
function genPanelOpenSelectedInPLMButton(id, panelSettings) {

    if(!panelSettings.openInPLM) return;

    let elemToolbar = genPanelToolbar(id, panelSettings, 'controls');

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
function genPanelSelectionControls(id, panelSettings) {

    if(panelSettings.multiSelect) {

        let elemToolbar = genPanelToolbar(id, panelSettings, 'controls');

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

        if(panelSettings.filterBySelection) {

            $('<div></div>').appendTo(elemToolbar)
                .hide()    
                .addClass('button')
                .addClass('with-toggle')
                .addClass('toggle-off')
                .addClass('multi-select-action')
                .html('Selected')
                .attr('id', id + '-filter-selected-only')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    $(this).toggleClass('toggle-off').toggleClass('toggle-on');
                    filterPanelContent(id);
                });

        }
    }

}
function genPanelToggleButtons(id, panelSettings, callbackExpand, callbackCollapse) {

    if(!panelSettings.toggles) return;

    let elemToolbar = genPanelToolbar(id, panelSettings, 'controls');

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
function genPanelAutoSaveToggle(id, panelSettings) {

    if(!panelSettings.autoSave) return;

    let elemToolbar = genPanelToolbar(id, panelSettings, 'controls');

    let elemToggle =  $('<div></div>').appendTo(elemToolbar)
        .addClass('button')
        .addClass('with-toggle')
        .addClass(id + '-auto-save-toggle')
        .html('Auto Save')
        .attr('id', id + '-auto-save')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).toggleClass('toggle-off').toggleClass('toggle-on').toggleClass('filled');
            panelSettings.autoSave = $(this).hasClass('toggle-on');
        });

    panelSettings.autoSave = false;

    return elemToggle;

}
function genPanelFilterSelect(id, panelSettings, property, suffix, label) {

    if(!panelSettings[property]) return;

    let elemToolbar = genPanelToolbar(id, panelSettings, 'controls');

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
function genPanelFilterToggle(id, panelSettings, property, suffix, label) {

    if(!panelSettings[property]) return;

    let elemToolbar = genPanelToolbar(id, panelSettings, 'controls');

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
function genPanelFilterToggleEmpty(id, panelSettings) {

    if(!panelSettings.filterEmpty) return;

    let elemToolbar = genPanelToolbar(id, panelSettings, 'controls');

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
function genPanelSearchInput(id, panelSettings) {

    let elemToolbar = genPanelToolbar(id, panelSettings, 'controls');

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
        .attr('placeholder', panelSettings.placeholder)
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

    if(!panelSettings.search) elemSearch.hide();

    return elemSearch;

}
function panelToggleSearchMode(id, elemClicked) {

    elemClicked.addClass('default');
    elemClicked.siblings('.icon').removeClass('default');
    elemClicked.siblings('.icon-continue').css('z-index', '-1');  

    filterPanelContent(id);

}
function genPanelResizeButton(id, panelSettings) {

    if(panelSettings.contentSizes.length === 0) return;

    let elemButtonResize = $('#' + id + '-resize');

    if(elemButtonResize.length > 0) return elemButtonResize;

    let elemToolbar = genPanelToolbar(id, panelSettings, 'controls');

    elemButtonResize = $('<div></div>').appendTo(elemToolbar)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-resize')
        .attr('id', id + '-resize')
        .attr('title', 'Cycle through alternate display sizes')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            panelResizeContents(id, panelSettings.contentSizes);
        });

    if(panelSettings.contentSizes.length === 1) elemButtonResize.addClass('hidden');

    return elemButtonResize;

}
function genPanelReloadButton(id, panelSettings) {

    if(!panelSettings.reload) return;

    let elemButtonReload = $('#' + id + '-reload');

    if(elemButtonReload.length > 0) return elemButtonReload;

    let elemToolbar = genPanelToolbar(id, panelSettings, 'controls');

    elemButtonReload = $('<div></div>').appendTo(elemToolbar)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-refresh')
        .attr('id', id + '-reload')
        .attr('title', 'Reload from database')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            panelSettings.load();
        });

    return elemButtonReload;

}
function genPanelResetButton(id, panelSettings) {

    if(!panelSettings.reset) return;

    let elemButtonReset = $('#' + id + '-reset');

    if(elemButtonReset.length > 0) return elemButtonReset;

    let elemToolbar = genPanelToolbar(id, panelSettings, 'controls');

    elemButtonReset = $('<div></div>').appendTo(elemToolbar)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-starts-with')
        .attr('id', id + '-reload')
        .attr('title', 'Reset selection and filters of view')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            panelReset(id, $(this));
        });

    return elemButtonReset;

}
function genPanelActionButton(id, panelSettings, suffix, label, title, callback) {

    let elemToolbar      = genPanelToolbar(id, panelSettings, 'actions');
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
function genPanelCreateButton(id, panelSettings, callback) {

    if(!panelSettings.editable) return;

    if(isBlank(panelSettings.hideButtonCreate)) panelSettings.hideButtonCreate = false;
    if(isBlank(panelSettings.createId)        ) panelSettings.createId         = 'create';

    if(panelSettings.hideButtonCreate) return;

    let elemToolbar = genPanelToolbar(id, panelSettings, 'actions');

    let elemButtonCreate = $('<div></div>').appendTo(elemToolbar)
        .addClass('button')
        .addClass('default')
        .addClass('with-icon')
        .addClass('panel-action-create')
        .addClass(panelSettings.createButtonIcon)
        .attr('id', id + '-action-create')
        .attr('title', 'Create new record and add it to this view')
        .html(panelSettings.createButtonLabel)
        .click(function(e) {
            
            e.preventDefault();
            e.stopPropagation();

            insertCreate(panelSettings.createWorkspaceNames, panelSettings.createWorkspaceIds, {
                id                  : panelSettings.createId,
                headerLabel         : panelSettings.createHeaderLabel,
                hideSections        : panelSettings.createHideSections,
                sectionsIn          : panelSettings.createSectionsIn,
                sectionsEx          : panelSettings.createSectionsEx,
                fieldsIn            : panelSettings.createFieldsIn,
                fieldsEx            : panelSettings.createFieldsEx,
                contextId           : id,
                contextItem         : panelSettings.link,
                contextItems        : panelSettings.createContextItems,
                contextItemField    : panelSettings.createContextItemField,
                contextItemFields   : panelSettings.createContextItemFields,
                viewerImageFields   : panelSettings.createViewerImageFields,
                toggles             : panelSettings.createToggles,
                useCache            : panelSettings.useCache,
                afterCreation       : function(createId, createLink, data, contextId) { callback(createId, createLink, data, contextId); }
            });
            
        });

    return elemButtonCreate;

}
function genPanelDisconnectButton(id, panelSettings, callback) {

    if(!panelSettings.editable) return;

    if(isBlank(panelSettings.hideButtonDisconnect)) panelSettings.hideButtonDisconnect = false;

    if(panelSettings.hideButtonDisconnect) return;

    let elemToolbar = genPanelToolbar(id, panelSettings, 'actions');

    let elemButtonDisconnect = $('<div></div>').appendTo(elemToolbar)
        .addClass('button')
        .addClass('with-icon')
        .addClass('panel-action-remove')
        .addClass(panelSettings.disconnectButtonIcon)
        .addClass('xs')
        .addClass('single-select-action')
        .addClass('multi-select-action')
        .attr('id', id + '-action-disconnect')
        .attr('title', 'Removes the selected elements from the view. The given items will remain in the database.')
        .html(panelSettings.disconnectButtonLabel)
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            callback($(this));
        });

    return elemButtonDisconnect;

}
function genPanelContents(id, panelSettings) {

    appendProcessing(id, false);

    elemNoData = appendNoDataFound(id, 'icon-no-data', panelSettings.textNoData);
    elemNoData.addClass(panelSettings.layout).hide();

    let elemTop = $('#' + id);

    let elemContent = $('<div></div>').appendTo(elemTop)
        .attr('id', id + '-content')
        .addClass('panel-content')
        .addClass('no-scrollbar')
        .addClass(panelSettings.contentSize);

         if(elemTop.hasClass('surface-level-1')) elemContent.addClass('surface-level-1');
    else if(elemTop.hasClass('surface-level-2')) elemContent.addClass('surface-level-2');
    else if(elemTop.hasClass('surface-level-3')) elemContent.addClass('surface-level-3');
    else if(elemTop.hasClass('surface-level-4')) elemContent.addClass('surface-level-4');
    else if(elemTop.hasClass('surface-level-5')) elemContent.addClass('surface-level-5');


         if(panelSettings.layout === 'table'  ) elemContent.addClass('table');
    else if(panelSettings.layout === 'gallery') elemContent.addClass('tiles').addClass('gallery');
    else if(panelSettings.layout === 'grid'   ) elemContent.addClass('tiles').addClass('grid');
    else if(panelSettings.layout === 'list'   ) elemContent.addClass('tiles').addClass('list');
    else if(panelSettings.layout === 'row'    ) {
        elemContent.addClass('tiles').addClass('row');
        if(!isBlank(panelSettings.contentSize)) elemNoData.addClass(panelSettings.contentSize);
        switch(panelSettings.contentSize) {
            case 'xxs':
            case 'xs':
            case 's':
            case 'm': elemContent.addClass('wide'); break;
        }
    }

    if(panelSettings.collapsePanel) {
        elemContent.addClass('hidden');
        elemContent.siblings('.no-data').addClass('hidden');
        elemContent.siblings('.processing').addClass('hidden');
    }

    if(panelSettings.counters) {

        let elemCounters = $('<div></div>').appendTo(elemTop)
            .attr('id', id + '-counters')
            .addClass('panel-counters');

        $('<div></div>').appendTo(elemCounters).attr('id', id + '-counter-total'   ).addClass('panel-counter-total'   );

        if(elemTop.hasClass('bom')) {
            $('<div></div>').appendTo(elemCounters).attr('id', id + '-counter-unique'  ).addClass('panel-counter-unique'  );
        }

        $('<div></div>').appendTo(elemCounters).attr('id', id + '-counter-filtered').addClass('panel-counter-filtered');
        $('<div></div>').appendTo(elemCounters).attr('id', id + '-counter-selected').addClass('panel-counter-selected'); 
        
        if(panelSettings.editable) {

            $('<div></div>').appendTo(elemCounters).attr('id', id + '-counter-changed' ).addClass('panel-counter-changed' );

        }

    }

    return elemContent;

}
function genPanelContentItem(panelSettings, params) {

    if(isBlank(params)) params = {};

    if(isBlank(params.link)    ) params.link     = '';
    if(isBlank(params.edge)    ) params.edge     = '';
    if(isBlank(params.title)   ) params.title    = ''; else if (isBlank(params.partNumber)) params.partNumber = params.title.split(' - ')[0];
    if(isBlank(params.group)   ) params.group    = '';
    if(isBlank(params.subtitle)) params.subtitle = '';

    let item = {
        link        : params.link,
        edge        : params.edge,
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

    if(!isBlank(panelSettings.tileDetails)) {

        for(let detail of panelSettings.tileDetails) {
                    
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
function genPanelFooterActionButton(id, panelSettings, suffix, params, callback) {

    if(isBlank(params)) params = {};
    if(isBlank(params.label)) { params.label = ''; }

    let elemToolbar = genPanelToolbar(id, panelSettings, 'footer');

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
function genPanelPaginationControls(id, panelSettings) {

    if(isBlank(panelSettings.pagination)) return;
    if(!panelSettings.pagination) return;

    panelSettings.offset = 0;
    panelSettings.page   = 1;
    panelSettings.mode   = 'initial';

    let elemPaginationControls = $('<div></div>', {
        id : id + '-pagination-controls'
    }).addClass('panel-pagination-controls').appendTo($('#' + id));

    $('#' + id + '-content').addClass('with-pagination-controls');

    $('<div></div>').appendTo(elemPaginationControls)
        .addClass('pagination-message')
        .attr('id', id + '-pagination-message');

    $('<div></div>').appendTo(elemPaginationControls)
        .addClass('button')
        .addClass('pagination-next')
        .addClass('hidden')
        .attr('id', id + '-pagination-next')
        .attr('title', 'Load next set of records')
        .html('Load Next')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            panelPaginationLoadNext(panelSettings);
        });

}


// Start & finish update of panel contents to display right contents
function startPanelContentUpdate(id, mode) {

    if(isBlank(mode)) mode = 'initial';

    $('#' + id + '-processing').show();
    $('#' + id + '-content').hide();

    let elemPagination     = $('#' + id + '-pagination-controls');

    if(elemPagination.length > 0) elemPagination.addClass('hidden');
    
    if(mode !== 'initial') return new Date().getTime();

    let elemSearch         = $('#' + id + '-search-input');
    let elemSelects        = $('.' + id + '-filter');
    let elemToggles        = $('.' + id + '-filter-toggle');
    let elemFilterSelected = $('#' + id + '-filter-selected-only');
    let elemFilterEmpty    = $('#' + id + '-filter-empty-only');
    let elemCounters       = $('#' + id + '-counters');

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

    if(elemFilterSelected.length > 0) elemFilterSelected.removeClass('toggle-on').addClass('toggle-off');

    if(elemFilterEmpty.length > 0) elemFilterEmpty.removeClass('icon-toggle-on').addClass('icon-toggle-off').removeClass('filled');

    if(elemCounters.length > 0) elemCounters.children().each(function() {
        $(this).html('').removeClass('not-empty');
    })

    $('#' + id).find('.single-select-action').hide();
    $('#' + id).find('.multi-select-action').hide();
    $('#' + id + '-actions').children('.panel-action').hide();
    $('#' + id + '-action-create').show().addClass('disabled');
    $('#' + id + '-content').html('').hide();
    
    $('#' + id + '-no-data').hide();    

    return new Date().getTime();

}
function stopPanelContentUpdate(response, panelSettings) {

    panelSettings.columns = [];

    if(response.params.timestamp != panelSettings.timestamp) return true;
    // if(response.params.link      !== panelSettings.link     ) return true;

    if(response.status === 403) {

        let tabName   = 'given';
        let endpoint  = response.url.split('?')[0];
        let workspace = response.params.link.split('/')[4];

        switch(endpoint) {

            case '/quotes': tabName = 'Sourcing'; break;

        }
    
        showErrorMessage('No Permission', 'Current user does not have access to the ' + tabName + ' tab in workspace ' + workspace);
        return true;

    } else if((response.status !== 200) && (response.status !== 204)) {

        showErrorMessage('Error ' + response.status, 'Failed to retrieve data from PLM for panel ' + panelSettings.headerLabel + '. Please contact your administrator.');
        return true;
        
    }

    if(!isBlank(response.data)) {
        if(!isBlank(response.data.currentState)) {
            panelSettings.elemTop.addClass('status-' + response.data.currentState.title.toUpperCase());
        } else if(!isBlank(response.data.lifecycle)) {
            panelSettings.elemTop.addClass('status-' + response.data.lifecycle.title.toUpperCase());
        }
    }

    return false;

}
function setPanelBookmarkStatus(id, panelSettings, responses) {

    if(!panelSettings.bookmark) return;

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
function setPanelCloneStatus(id, panelSettings, responses) {

    if(!panelSettings.cloneable) return;

    for(let response of responses) {
        if(response.url.indexOf('/permissions?') === 0) {
            if(hasPermission(response.data, 'add_items')) {
                $('#' + id + '-clone').removeClass('disabled');
                return;
            }
        }
    }

}
function includePanelTableColumn (fieldId, fieldName, panelSettings, counter) {

    if(panelSettings.tableColumnsLimit > counter) {
        if((panelSettings.fieldsIn.length === 0) || ( panelSettings.fieldsIn.includes(fieldId)) || ( panelSettings.fieldsIn.includes(fieldName))) {
            if((panelSettings.fieldsEx.length === 0) || ((!panelSettings.fieldsEx.includes(fieldId)) && (!panelSettings.fieldsEx.includes(fieldName)))) {
                return true;
            }
        }
    }

    return false;

}
function includePanelWorkspace (panelSettings, name, id) {

    let included = false;
    let excluded = false;

    if(panelSettings.workspacesIn.length === 0) {
        included = true;
    } else {
        for(let workspace of panelSettings.workspacesIn) {
            if(workspace == name) { included = true; break; }
            if(workspace ==   id) { included = true; break; }
        }
    }

    if(panelSettings.workspacesEx.length === 0) {
        excluded = false;
    } else {
        for(let workspace of panelSettings.workspacesEx) {
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
function setPanelContentActions(id, panelSettings, responses) {

    if(!panelSettings.editable) return;
    if(isBlank(responses)) return;

    let dataPermissions     = [];
    let dataWorkspaces      = [];
    let requestsPermissions = [];
    let showActions         = false;

    for(let response of responses) {
             if(response.url.indexOf('/permissions')        === 0) dataPermissions = response.data;
        else if(response.url.indexOf('/linked-workspaces')  === 0) dataWorkspaces  = response.data;
        else if(response.url.indexOf('/related-workspaces') === 0) dataWorkspaces  = response.data;
    }

    if(!hasPermission(dataPermissions, 'edit_items')) {
        $('#' + id).removeClass('with-panel-actions');
        $('#' + id + '-actions').hide();
        return;
    }

    for(let workspace of dataWorkspaces) {
        let workspaceId = workspace.link.split('/').pop();
        if((panelSettings.workspacesIn.length === 0) || ( panelSettings.workspacesIn.includes(workspace) || ( panelSettings.workspacesIn.includes(workspaceId)))) {
            if((panelSettings.workspacesEx.length === 0) || (!panelSettings.workspacesEx.includes(workspace) && !panelSettings.workspacesEx.includes(workspaceId))) {
                requestsPermissions.push($.get('/plm/permissions', { link : workspace.link}))
            }
        }
    }

    Promise.all(requestsPermissions).then(function(responses) {
        if(panelSettings.createWorkspaceIds.length === 0) {
            for(let response of responses) {
                if(hasPermission(response.data, 'add_items')) {
                    $('#' + id + '-action-create').removeClass('disabled');
                    // showActions = true;
                    panelSettings.createWorkspaceIds.push(response.params.link.split('/')[4]);
                }
            }
        } else {
            let index = 0;
            for(let workspaceId of panelSettings.createWorkspaceIds) {
                workspaceId = workspaceId.toString();
                let keep = false;
                for(let response of responses) {
                    if(hasPermission(response.data, 'add_items')) {
                        let permitted = response.params.link.split('/')[4];
                        if(permitted == workspaceId) {
                            keep = true;
                            break;
                        }
                    }
                }
                if(!keep) {
                    panelSettings.createWorkspaceIds.splice(index, 1);
                } else $('#' + id + '-action-create').removeClass('disabled');
                index++;
            }
        }
        // if(showActions) $('#' + id).addClass('with-panel-actions'); else $('#' + id).removeClass('with-panel-actions');
    });

}
function finishPanelContentUpdate(id, panelSettings, items, linkNew, data) {

    if(isBlank(data)) data = {};

    // Set dynamic panel header
    if(!isBlank(panelSettings.headerLabel)) {
        if(panelSettings.headerLabel == 'descriptor') {
            if(!isBlank(panelSettings.descriptor)) {
                $('#' + id + '-title-main').html(panelSettings.descriptor);
            }
        }
    }

    if(!isBlank(items)) {
        if(panelSettings.layout === 'tree') {                 
            genTree(id, panelSettings, items);
        } else if(panelSettings.layout === 'table') {                 
            genTable(id, items, panelSettings);
        } else {
            genTilesList(id, items, panelSettings);
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

    if(panelSettings.counters) updatePanelCalculations(id);
    if(!isBlank(panelSettings.afterCompletion)) panelSettings.afterCompletion(id, data);

}
function highlightNewPanelContent(id, linkNew) {

    if(isBlank(linkNew)) return;

    $('#' + id + '-content').find('.content-item').each(function() {
        if($(this).attr('data-link') === linkNew) $(this).addClass('highlight');
    });

}
function setPanelPaginationControls(id, panelSettings, total) {

    if(!panelSettings.pagination) return;

    let elemContent           = $('#' + id + '-content');
    let elemPaginatioControls = $('#' + id + '-pagination-controls');
    let elemPaginationNext    = $('#' + id + '-pagination-next');
    let elemPaginationMessage = $('#' + id + '-pagination-message');
    let count                 = elemContent.find('.content-item').length;

    if(count === 0) { elemPaginatioControls.addClass('hidden'); return; } else elemPaginatioControls.removeClass('hidden');
    
    if(elemPaginationNext.length > 0) {
        if(count < total) elemPaginationMessage.html('Showing ' + count + ' of ' + total + ' records');
                     else elemPaginationMessage.html('Showing all ' + total + ' records');
    }

    if(elemPaginationNext.length > 0) {
        if(count >= total) elemPaginationNext.addClass('hidden'); else elemPaginationNext.removeClass('hidden');
    }

}



// Filter panel content based on search input
function filterPanelContent(id) {

    let elemSearchInput  = $('#' + id + '-search-input');
    let searchMode       = elemSearchInput.siblings('.icon.default').attr('data-mode');
    let searchInputValue = elemSearchInput.val().toUpperCase();
    let elemTop          = $('#' + id);
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
    let isTree           = elemTop.hasClass('tree') || elemContent.hasClass('tree');

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
        if(toggleSelected.hasClass('toggle-on')) {
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
                    elemContentItem.children('.column-editable').each(function() {
                        let elemCell = $(this);
                        if(elemCell.children().length === 0) {
                            hasEmptyContent = (elemCell.html() === '');
                        } else if(elemCell.children('.icon').length < 0) {
                            let fieldData = getFieldValue(elemCell);
                            hasEmptyContent = (isBlank(fieldData.value));
                        } else {
                            let elemControl = elemCell.children().first();
                            let value = elemControl.val();
                            if(isBlank(value)) hasEmptyContent = true;
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
                if(isTree) {
                    
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
        elemCounterFiltered.html(countResults + ' matches').addClass('not-empty');
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

    let elemTop            = $('#' + id );
    let elemContent        = $('#' + id + '-content');

    elemContent.find('.content-item').addClass('selected').addClass('checked');
    elemContent.find('.content-select-all').addClass('icon-check-box-checked').removeClass('icon-check-box');

    updatePanelCalculations(id);
    togglePanelToolbarActions(elemClicked);

    if(elemTop.hasClass('bom')) {
        updateBOMPath(elemClicked);
        if(panelSettings.bom[id].viewerSelection) selectInViewer(id);
    }

    panelSelectAllDone(id, elemClicked);

}
function panelSelectAllDone(id, elemClicked) {}
function panelDeselectAll(id, elemClicked) {

    let elemTop            = $('#' + id );
    let elemContent        = $('#' + id + '-content');
    let elemFilterSelected = $('#' + id + '-filter-selected-only');

    elemContent.find('.content-item').removeClass('selected').removeClass('checked').removeClass('highlighted');
    elemContent.find('.content-select-all').removeClass('icon-check-box-checked').addClass('icon-check-box');

    if(elemFilterSelected.length > 0) elemFilterSelected.removeClass('toggle-on').addClass('toggle-off');

    filterPanelContent(id);
    updatePanelCalculations(id);
    togglePanelToolbarActions(elemClicked);

    if(elemTop.hasClass('bom')) {
        updateBOMPath(elemClicked);
        if(panelSettings.bom[id].viewerSelection) selectInViewer(id);
    }

    panelDeselectAllDone(id, elemClicked);

}
function panelDeselectAllDone(id, elemClicked) {}



// Panel reset (selection & filters)
function panelReset(id, elemClicked) {

    let elemTop     = $('#' + id );
    let elemContent = $('#' + id + '-content');
    let elemSearch  = $('#' + id + '-search-input');

    elemContent.find('.content-item').removeClass('result').removeClass('selected').removeClass('hidden');
    
    if(elemSearch.length > 0) elemSearch.val('');

    resetTreePath(id);
    filterPanelContent(id);
    updatePanelCalculations(id);
    togglePanelToolbarActions(elemClicked);

    if(elemTop.hasClass('bom')) {
        updateBOMPath(elemClicked);
        if(panelSettings.bom[id].viewerSelection) selectInViewer(id);
    }

    panelResetDone(id, elemClicked);

}
function panelResetDone(id, elemClicked) {}



// Save changes in editable table
function savePanelTableChanges(id, panelSettings) {

    appendOverlay(false);

    $.get('/plm/sections', { wsId : panelSettings.wsId, link : panelSettings.link }, function(response) {
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



// Generate tree display and functionality
function genTree(id, panelSettings, items) {

    let elemContent = $('#' + id + '-content');
    let elemTable = $('<table></table').appendTo(elemContent)
        .attr('id', id + '-table')
        .addClass('tree-table')
        .addClass('fixed-header');

    let elemTHead = $('<thead></thead>').appendTo(elemTable).attr('id', id + '-thead').addClass('tree-thead');
    let elemTBody = $('<tbody></tbody>').appendTo(elemTable).attr('id', id + '-tbody').addClass('tree-tbody');

    elemContent.closest('.panel-top').addClass('tree');

    genTreeHeaders(elemTHead);
    genTreeRows(id, elemTBody, panelSettings, items)
    enableTreeToggles(id);

    if(panelSettings.hideTableHeader) elemTHead.remove();
    if(panelSettings.collapseContents) collapseAllNodes(id);

    return elemTable;

}
function genTreeHeaders(elemTHead) {
    
    let elemTHRow = $('<tr></tr>').appendTo(elemTHead);

    $('<th></th>').appendTo(elemTHRow)
        .html('Item');

}
function genTreeRows(id, elemTBody, panelSettings, items) {   

    if(isBlank(panelSettings.skipRootItem)) panelSettings.skipRootItem = true;
    if(isBlank(panelSettings.hideNumber  )) panelSettings.hideNumber =  true;

    let index = (panelSettings.skipRootItem) ? 1 : 0;

    for(index; index < items.length; index++) {

        let item = items[index];

        let elemRow = $('<tr></tr>').appendTo(elemTBody)
            .attr('data-part-number', item.partNumber)
            .attr('data-link'       , item.link)
            .attr('data-title'      , item.title)
            .attr('data-title'      , item.title)
            .attr('data-level'      , item.level)
            .addClass('level-' + item.level)
            .addClass('content-item')
            .click(function (e) {
                e.preventDefault();
                e.stopPropagation();
                clickContentItem($(this), e);
                updateTreePath($(this));
                updatePanelCalculations(id);
                if(panelSettings.viewerSelection) selectInViewer(id);
                if(!isBlank(panelSettings.onClickItem)) panelSettings.onClickItem($(this));
            }).dblclick(function(e) {
                e.preventDefault();
                e.stopPropagation();
                if(!isBlank(panelSettings.onDblClickItem)) panelSettings.onDblClickItem($(this));
                else if(panelSettings.openOnDblClick) openItemByLink($(this).attr('data-link'));
            });


        if(!isBlank(item.domProperties)) {
            for(domProperty of item.domProperties) {
                elemRow.attr('data-' + domProperty.key, domProperty.value);
            }
        }

        $('<td></td>').appendTo(elemRow).addClass('tree-color');

        let elemFirstCol = $('<td></td>').appendTo(elemRow).addClass('tree-first-col');

        if(item.hasChildren) {
            $('<span></span>').appendTo(elemFirstCol).addClass('tree-nav').addClass('icon');
            elemRow.addClass('node');
        } else elemRow.addClass('leaf');

        if(!panelSettings.hideNumber) $('<span></span>').appendTo(elemFirstCol).addClass('tree-number');

        $('<span></span>').appendTo(elemFirstCol).addClass('tree-title').html(item.title);

    }

}
function enableTreeToggles(id) {

    $('#' + id).find('.tree-nav').click(function(e) {
    
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

    });

}
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
function getTreeItemPath(elemItem, pathSeparator) {

    if(isBlank(pathSeparator)) pathSeparator = '|'

    let title = elemItem.attr('data-part-number') || elemItem.attr('data-title');
    let level = Number(elemItem.attr('data-level'));
    let link  = elemItem.attr('data-link');

    let result = {
        link   : link,
        links  : [link],
        title  : title,
        level  : level,
        items  : [elemItem],
        titles : [title],
        levels : [level],
        path   : title
    }
    
    elemItem.prevAll('tr').each(function() {

        let elemNext  = $(this);
        let nextLevel = Number(elemNext.attr('data-level'));

        if(nextLevel < level) {

            title = elemNext.attr('data-part-number') || elemNext.attr('data-title');
            result.links.unshift(elemNext.attr('data-link'));
            result.path = title + pathSeparator + result.path;
            result.items.unshift(elemNext);
            result.titles.unshift(title);
            result.levels.unshift(nextLevel);

            level = nextLevel;

        }

    });

    return result;

}
function updateTreePath(elemClicked) {

    let elemTree = elemClicked.closest('.tree');
    let id       = elemTree.attr('id');
    let elemPath = $('#' + id + '-tree-path');

    if(elemPath.length === 0) return;
    
    elemPath.html('').addClass('tree-path-empty');
    
    if(!elemClicked.hasClass('selected')) return;
    
    let path  = getTreeItemPath(elemClicked);
    let index = 0;

    elemPath.removeClass('tree-path-empty');

    for(let item of path.items) {

        let title = item.attr('data-part-number') || item.attr('data-title');

        title = title.split(' - ')[0];

        let elemItem = $('<div></div>').appendTo(elemPath)
            .attr('data-number', item.attr('data-number'))
            .attr('data-index', item.index())
            .html(title);

        if(path.items.length === 1) elemItem.addClass('tree-path-selected-single');

        if(index < path.items.length - 1) {
            elemItem.addClass('tree-path-parent');
            elemItem.click(function() {
                let index = $(this).attr('data-index');
                let elemItem = $('#' + id + '-tbody').find('.content-item').eq(index);
                treeScrollToItem($(this));
                elemItem.click();
            });
        } else {
            elemItem.addClass('tree-path-selected');
            elemItem.click(function() {
                treeScrollToItem($(this));
            });
        }

        index++;

    }

}
function resetTreePath(id) {

    let elemPath = $('#' + id + '-tree-path');

    if(elemPath.length === 0) return;
    
    elemPath.html('').addClass('tree-path-empty');
    
}
function treeScrollToTop(id) {

    let elemTree = $('#' + id + '-content');

    elemTree.animate({ scrollTop: 0 }, 200);

}
function treeScrollToBottom(id) {

    let elemTree = $('#' + id + '-content');
    let elemItem = elemTree.find('.content-item').last();
    let top      = elemItem.position().top;

    elemTree.animate({ scrollTop: top }, 200);

}
function treeScrollToItem(elemClicked) {

    let index    = elemClicked.attr('data-index');
    let panel    = elemClicked.closest('.panel-top');
    let id       = panel.attr('id');
    let elemTree = $('#' + id + '-content');
    let elemItem = $('#' + id + '-tbody').find('.content-item').eq(index);
    let top      = elemTree.innerHeight() / 2;

    top = elemItem.position().top - top;

    elemTree.animate({ scrollTop: top }, 500);

}
function treeToggleDownloadPanelAndColumn(id, downloadFormats) {

    let elemTHRow           = $('#' + id + '-thead-row');
    let elmTHStatus         = elemTHRow.children('.tree-files-download-status');
    let elemTBody           = $('#' + id + '-tbody');
    let elemDownloadOptions = $('#' + id + '-tree-files-download-options');

    if(elmTHStatus.length === 0) {
        elmTHStatus = $('<th></th>').appendTo(elemTHRow).addClass('tree-files-download-status');
        elmTHStatus.html('Files Download');
    }  

    elemTBody.children().each(function() {

        let elemRow  = $(this);
        let elemCell = elemRow.find('.tree-files-download-status');

        if(elemCell.length === 0) {
            $('<td></td>').appendTo(elemRow).addClass('tree-files-download-status');
        }

    });

    if(elemDownloadOptions.length === 0) {

        elemDownloadOptions  = $('<div></div>').appendTo($('#' + id))
            .addClass('hidden')
            .addClass('tree-files-download-panel')
            .addClass('tree-files-download-options')
            .addClass('surface-level-3')
            .attr('id', id + '-tree-files-download-options');

        let elemDownloadProgress = $('<div></div>').appendTo($('#' + id))    
            .addClass('hidden')
            .addClass('tree-files-download-panel')
            .addClass('tree-files-download-progress')
            .attr('id', id + '-tree-files-download-progress');


        // Items Selector
        let elemSelectItems = $('<select></select>')
            .addClass('button')
            .addClass('tree-files-download-selected')
            .append($('<option value="all">All Items</option>'))
            .append($('<option value="selected">Selected Items</option>'))
            .append($('<option value="selected-subs">Selected Items & Sub Components</option>'))
            .append($('<option value="deselected">Deselected Items</option>'))
            .append($('<option value="filtered">Filtered Items</option>'))
            .attr('id', id + '-tree-files-download-selected');   
        
        $('<div></div>').appendTo(elemDownloadOptions)
            .addClass('tree-files-download-options-label')
            .html('Download Files Of'); 
            
        $('<div></div>').appendTo(elemDownloadOptions)
            .addClass('tree-files-download-options-value')
            .append(elemSelectItems);             


        // Date Range Selector
        let elemSelectRange = $('<select></select>')
            .addClass('button')
            .addClass('tree-files-download-range')
            .attr('id', id + '-tree-files-download-range');

        let now = new Date();

        insertDateRangeFilter(elemSelectRange, 'Anytime', 3650);
        insertDateRangeFilter(elemSelectRange, 'Today', 0);
        insertDateRangeFilter(elemSelectRange, 'Yesterday', 1);
        insertDateRangeFilter(elemSelectRange, 'This Week', now.getDay());
        insertDateRangeFilter(elemSelectRange, 'This Month', now.getDate());
        insertDateRangeFilter(elemSelectRange, 'This Year', getDayOfYear());
        insertDateRangeFilter(elemSelectRange, 'Last 30 Days', 30);
        insertDateRangeFilter(elemSelectRange, 'Last 90 Days', 90);
        insertDateRangeFilter(elemSelectRange, 'Last 180 Days', 180);
        insertDateRangeFilter(elemSelectRange, 'Last 365 Days', 365);

        $('<div></div>').appendTo(elemDownloadOptions)
            .addClass('tree-files-download-options-label')
            .html('Last File Change');
        
        $('<div></div>').appendTo(elemDownloadOptions)
            .addClass('tree-files-download-options-value')
            .append(elemSelectRange);


        // File Format Selector
        $('<div></div>').appendTo(elemDownloadOptions)
            .addClass('tree-files-download-options-label')
            .html('Filter File Format');
        
        let elemFormats = $('<div></div>').appendTo(elemDownloadOptions)
            .addClass('tree-files-download-options-value')
            .addClass('tree-files-download-formats')
            .attr('id', id + '-tree-files-download-formats');


        for(let fileFormat of downloadFormats) {
            
            let elemFormat = $('<div></div>').appendTo(elemFormats)
                .addClass('tree-files-download-format')
                .addClass('button')
                .addClass('with-icon')
                .addClass('icon-check-box')
                .attr('data-filter', fileFormat.filter)
                .html(fileFormat.label)
                .click(function() {
                    $(this).toggleClass('icon-check-box').toggleClass('icon-check-box-checked');
                });

            if(!isBlank(fileFormat.tooltip)) elemFormat.attr('title', fileFormat.tooltip);

        }

        $('<input></input>').appendTo(elemFormats)
            .addClass('button')
            .addClass('tree-files-download-format-filter')
            .attr('id', id + '-tree-files-download-format-filter')
            .attr('placeholder', 'Custom')
            .attr('title', 'Provide any text string that must be included in the filename; asterisks (*) will be appended automatically');


        // Download Folder Selector
        let elemSelectFolder = $('<select></select>')
            .addClass('button')
            .attr('id', id + '-tree-files-download-folder-selector');

        $('<option></option>').appendTo(elemSelectFolder)
            .attr('value', 'local-drive')
            .html('Local Drive');            

        for(let folder of settings[id].downloadFolders) {
            $('<option></option>').appendTo(elemSelectFolder)
                .attr('value', folder)
                .html(folder);
        }

        $('<div></div>').appendTo(elemDownloadOptions)
            .addClass('tree-files-download-options-label')
            .html('Download Folder');
        
        $('<div></div>').appendTo(elemDownloadOptions)
            .addClass('tree-files-download-options-value')
            .append(elemSelectFolder);


        // Subfolder Options
        let elemSelectSubfolders = $('<select></select>')
            .addClass('button')
            .addClass('tree-files-download-subfolders')
            .attr('id', id + '-tree-files-download-subfolders');

        $('<option></option>').appendTo(elemSelectSubfolders).attr('value', 'no'  ).html('No');
        $('<option></option>').appendTo(elemSelectSubfolders).attr('value', 'item').html('Yes - per Item');
        $('<option></option>').appendTo(elemSelectSubfolders).attr('value', 'top' ).html('Yes - per Top Level Item');
        $('<option></option>').appendTo(elemSelectSubfolders).attr('value', 'path').html('Yes - matching the BOM Path');

        $('<div></div>').appendTo(elemDownloadOptions)
            .addClass('tree-files-download-options-label')
            .html('Create Sub Folders');
        
        $('<div></div>').appendTo(elemDownloadOptions)
            .addClass('tree-files-download-options-value')
            .append(elemSelectSubfolders);

        
        // File Rename Options
        let elemSelectRename = $('<select></select>')
            .addClass('button')
            .addClass('tree-files-download-rename')
            .attr('id', id + '-tree-files-download-rename');

        $('<option></option>').appendTo(elemSelectRename).attr('value', 'no'  ).html('No');
        $('<option></option>').appendTo(elemSelectRename).attr('value', 'fd'  ).html('Filename Date');
        $('<option></option>').appendTo(elemSelectRename).attr('value', 'df'  ).html('Date Filename');
        $('<option></option>').appendTo(elemSelectRename).attr('value', 'fv'  ).html('Filename Version');
        $('<option></option>').appendTo(elemSelectRename).attr('value', 'fvd' ).html('Filename Version Date');
        $('<option></option>').appendTo(elemSelectRename).attr('value', 'frv' ).html('Filename Revision.Version');
        $('<option></option>').appendTo(elemSelectRename).attr('value', 'frvd').html('Filename Revision.Version Date');
        $('<option></option>').appendTo(elemSelectRename).attr('value', 'd'   ).html('Descriptor');
        $('<option></option>').appendTo(elemSelectRename).attr('value', 'dd'  ).html('Descriptor Date');
        $('<option></option>').appendTo(elemSelectRename).attr('value', 'dv'  ).html('Descriptor Version');
        $('<option></option>').appendTo(elemSelectRename).attr('value', 'dvd' ).html('Descriptor Version Date');
        $('<option></option>').appendTo(elemSelectRename).attr('value', 'drv' ).html('Descriptor Revision.Version');
        $('<option></option>').appendTo(elemSelectRename).attr('value', 'drvd').html('Descriptor Revision.Version Date');

        $('<div></div>').appendTo(elemDownloadOptions)
            .addClass('tree-files-download-options-label')
            .html('Rename Files');
        
        $('<div></div>').appendTo(elemDownloadOptions)
            .addClass('tree-files-download-options-value')
            .append(elemSelectRename);


        $('<div></div>').appendTo(elemDownloadOptions)

        let elemOptionsActions = $('<div></div>').appendTo(elemDownloadOptions)
            .addClass('tree-files-download-options-actions');   
        
        $('<div></div>').appendTo(elemOptionsActions)
            .addClass('button')
            .addClass('with-icon')
            .addClass('icon-start')
            .addClass('default')
            .addClass('tree-files-download-start')
            .html('Start Downloads')
            .click(function(){ 
                startTreeDownload(id);
            });

        let elemProgressCounters = $('<div></div').appendTo(elemDownloadProgress)
            .addClass('pos-abs-left')
            .addClass('surface-level-3')
            .addClass('tree-files-download-counters');

        $('<div></div').appendTo(elemProgressCounters)
            .addClass('tree-files-download-counters-value')
            .attr('id', id + '-tree-files-download-counters-total')
            .html('0');

        $('<div></div').appendTo(elemProgressCounters)
            .addClass('tree-files-download-counters-label')
            .html('Items to process in total');

        $('<div></div').appendTo(elemProgressCounters)
            .addClass('tree-files-download-counters-value')
            .attr('id', id + '-tree-files-download-counters-skipped')
            .html('0');

        $('<div></div').appendTo(elemProgressCounters)
            .addClass('tree-files-download-counters-label')
            .html('Items being skipped');

        $('<div></div').appendTo(elemProgressCounters)
            .addClass('tree-files-download-counters-value')
            .attr('id', id + '-tree-files-download-counters-pending')
            .html('0');

        $('<div></div').appendTo(elemProgressCounters)
            .addClass('tree-files-download-counters-label')
            .html('Items remaining');            
              
        $('<div></div').appendTo(elemProgressCounters)
            .addClass('tree-files-download-counters-value')
            .attr('id', id + '-tree-files-download-counters-files')  
            .html('0');

        $('<div></div').appendTo(elemProgressCounters)
            .addClass('tree-files-download-counters-label')
            .html('Files Downloaded');

        let elemCountersProgress = $('<div></div').appendTo(elemProgressCounters)
            .addClass('tree-files-download-counters-progress-bar')   
            .attr('id', id + '-tree-files-download-counters-progress-bar');   

        $('<div></div').appendTo(elemCountersProgress).addClass('tree-files-download-counters-progress-done').attr('id', id + '-tree-files-download-counters-progress-done');
        $('<div></div').appendTo(elemCountersProgress).addClass('tree-files-download-counters-progress-curr').attr('id', id + '-tree-files-download-counters-progress-curr');
        $('<div></div').appendTo(elemCountersProgress).addClass('tree-files-download-counters-progress-pend').attr('id', id + '-tree-files-download-counters-progress-pend');
        $('<div></div').appendTo(elemCountersProgress).addClass('tree-files-download-counters-progress-text').attr('id', id + '-tree-files-download-counters-progress-text');

        let elemCountersActions = $('<div></div').appendTo(elemProgressCounters)
            .addClass('tree-files-download-counters-actions');   

        $('<div></div>').appendTo(elemCountersActions)
            .addClass('button')
            .addClass('with-icon')
            .addClass('icon-stop')
            .addClass('disabled')
            .addClass('tree-files-download-stop')
            .attr('id', id + '-tree-files-download-stop')
            .html('Stop Downloads')
            .click(function(){ 
                stopTreeDownloads(id);
            });  

        $('<div></div>').appendTo(elemCountersActions)
            .addClass('button')
            .addClass('default')
            .addClass('with-icon')
            .addClass('icon-chevron-left')
            .addClass('tree-files-download-return')
            .addClass('tree-files-download-completion-action')
            .attr('id', id + '-tree-files-download-return')
            .html('Return')
            .click(function(){ 
                returnToTreeDownloadOptions(id);
            }); 

        $('<div></div>').appendTo(elemCountersActions)
            .addClass('button')
            .addClass('with-icon')
            .addClass('icon-close')
            .addClass('tree-files-download-close')
            .addClass('tree-files-download-completion-action')
            .attr('id', id + '-tree-files-download-close')
            .html('Close')
            .click(function(){ 
                closeTreeDownloadPanel(id);
            });   
            
        let elemProgressFiles = $('<div></div').appendTo(elemDownloadProgress)
            .addClass('pos-abs-right')
            .addClass('surface-level-4')
            .addClass('tree-files-download-files');
        
        $('<div></div').appendTo(elemProgressFiles)
            .addClass('tree-files-download-files-header')
            .attr('id', id + '-tree-files-download-files-header')
            .html('File Downloads Completed');

        $('<div></div').appendTo(elemProgressFiles)
            .addClass('tree-files-download-files-list')
            .addClass('no-scrollbar')
            .attr('id', id + '-tree-files-download-files-list');

    }

    $('#' + id + '-tree-files-download-options').toggleClass('hidden');
    $('#' + id).toggleClass('with-files-download');

}
function insertDateRangeFilter(elemSelectRange, label, days) {

    let date = new Date();
        date.setHours(0,0,0,0);
        date.setDate(date.getDate() - days);
    
    elemSelectRange.append($('<option value="' + date.getTime() + '">' + label + '</option>'));

}
async function startTreeDownload(id) {

    if (!window.showDirectoryPicker) {
        alert("Your browser does not support the File System Access API.");
        return;
    }

    try {
        
        let fileHandler =  null;
        let elemTBody   = $('#' + id + '-tbody');
        let selection   = $('#' + id + '-tree-files-download-selected').val();
        let subFolders  = $('#' + id + '-tree-files-download-subfolders').val();
        let items       = [];

        elemTBody.find('.tree-download-complete').removeClass('tree-download-complete');
        elemTBody.find('.tree-files-download-status').html('');
        
        $('#' + id + '-tree-files-download-stop').removeClass('disabled').addClass('red');
        $('#' + id + '-tree-files-download-files-list').html('');
        $('#' + id + '-tree-files-download-files-header').html('Downloading files of ' + $('#' + id + '-tree-files-download-selected').children(':selected').html());
        
        downloadQueue = {
            id         : id,
            requests   : settings[id].downloadRequests || 3,
            folder     : $('#' + id + '-tree-files-download-folder-selector').val(),
            rootFolder : 'downloads/' + $('#' + id + '-tree-files-download-folder-selector').val(),
            subFolders : $('#' + id + '-tree-files-download-subfolders').val(),
            range      : $('#' + id + '-tree-files-download-range').val(),
            pending    : [],
            skipped    : [],
            success    : [],
            failed     : [],
            formats    : [],
            stopped    : false,
            elemTBody  : elemTBody,
            endpoint   : '/plm/export-attachments',
            method     : 'post',
            counters   : {
                total     : 0,
                skipped   : 0,
                completed : 0,
                files     : 0
            }
        };

        $('.tree-files-download-format').each(function() {
            let elemFormat = $(this);
            if(elemFormat.hasClass('icon-check-box-checked')) {
                let filters = elemFormat.attr('data-filter').split(',');
                for(let filter of filters) downloadQueue.formats.push(filter);
            }
        });

        let customFilter = $('#' + id + '-tree-files-download-format-filter').val();

        if(!isBlank(customFilter)) downloadQueue.formats.push(customFilter);

        if(downloadQueue.folder === 'local-drive') {
            downloadQueue.formats  = downloadQueue.formats.toString();
            downloadQueue.endpoint = '/plm/attachments';
            downloadQueue.method   = 'get'
            fileHandler            = await window.showDirectoryPicker() ;
        }

        if(selection === 'all') {
     
            let subFolder = '';

            if(subFolders === 'item') subFolder = settings[id].descriptor;
     
            downloadQueue.pending.push( {
                link      : settings[id].link,
                title     : settings[id].descriptor,
                subFolder : subFolder.trim(),
                version   : getItemRevisionFromDescriptor('title ' + settings[id].version)
            });

        }

        let topLevelFolder = '';
        let bomTreeFolders = [];
        let previousLevel  = 0;

        elemTBody.children().each(function() {

            let elemRow = $(this);
            let link    = elemRow.attr('data-link');
            let valid   = (selection === 'all');
            let level   = Number(elemRow.attr('data-level'));
            let title   = elemRow.attr('data-title').split(' [REV:')[0];

            if(level === 1) topLevelFolder = title;
            if(level > previousLevel) bomTreeFolders.push(title); else { bomTreeFolders.length = (level - 1); bomTreeFolders.push(title); }

            previousLevel = level;

            if(!elemRow.hasClass('tree-download-complete')) {
    
                if(selection === 'selected-subs') {
                    if(elemRow.hasClass('selected')) { 
                        valid = true;
                    } else {
                        let path = getTreeItemPath(elemRow, ';');
                        for(let parent of path.links) {
                            if(downloadQueue.pending.includes(parent)) {
                                valid = true;
                            }
                        }
                    }
                } else if(elemRow.hasClass('selected')) { 
                    if(selection === 'selected') valid = true; 
                } else if(selection === 'deselected') {
                    valid = true; 
                } 

                if(elemRow.hasClass('result')) {
                    if(selection === 'filtered') valid = true;
                }

                if(!items.includes(link)) {
                    if(valid) {
                        if(valid) {
                            
                            if(subFolders !== 'top') {
                                if(subFolders !== 'path') {
                                    items.push(link);
                                }
                            }

                            let subFolder = '';

                                 if(subFolders === 'item') subFolder = elemRow.attr('data-title').split(' [REV:')[0];
                            else if(subFolders === 'top' ) subFolder = topLevelFolder;
                            else if(subFolders === 'path') subFolder = bomTreeFolders.toString().replaceAll(',', '/');

                            downloadQueue.pending.push({
                                link      : link,
                                title     : elemRow.attr('data-title'),
                                version   : getItemRevisionFromDescriptor(elemRow.attr('data-title')),
                                subFolder : subFolder.trim(),
                                index     : elemRow.index()
                            });
                        }
                    } 
                }
            }

            if(!valid) {
                downloadQueue.skipped.push(link);
                downloadQueue.counters.skipped++;
                let elemCell = elemRow.find('.tree-files-download-status');
                if(elemCell.length > 0) {
                    $('<div></div>').appendTo(elemCell)
                        .addClass('tree-file-downloaded')
                        .addClass('with-icon')
                        .addClass('icon-skip')
                        .addClass('filled')
                        .html('Skipped');
                }
            }

        });

        downloadQueue.counters.total = downloadQueue.pending.length;

        $('#' + id + '-tree-files-download-options' ).toggleClass('hidden');
        $('#' + id + '-tree-files-download-progress').toggleClass('hidden');
        $('#' + id + '-tree-files-download-stop').removeClass('hidden');
        $('#' + id + '-tree-files-download-counters-progress-bar').removeClass('hidden');
        $('#' + id + '-tree-files-download-progress').find('.tree-files-download-completion-action').addClass('hidden');
        $('#' + id + '-tree-files-download-counters-total').html(downloadQueue.counters.total);
        $('#' + id + '-tree-files-download-counters-skipped').html(downloadQueue.counters.skipped);
        $('#' + id + '-tree-files-download-counters-files').html('0');
        $('#' + downloadQueue.id + '-tree-files-download-counters-progress-done').css('width', '0%');
        $('#' + downloadQueue.id + '-tree-files-download-counters-progress-curr').css('width', '0%');

        for(let i = 0; i < downloadQueue.requests; i++) processTreeDownloads(fileHandler, downloadQueue);

        // processTreeDownloads(fileHandler, downloadQueue);

    } catch (err) {}

}
async function processTreeDownloads(fileHandler, downloadQueue) {

    $('#' + downloadQueue.id + '-tree-files-download-counters-pending').html(downloadQueue.pending.length);

    if(downloadQueue.stopped) return;

    if(downloadQueue.pending.length === 0) {

        $('#' + downloadQueue.id + '-tree-files-download-counters-progress-bar').addClass('hidden');
        $('#' + downloadQueue.id + '-tree-files-download-stop').addClass('hidden');
        $('#' + downloadQueue.id + '-tree-files-download-progress').find('.tree-files-download-completion-action').removeClass('hidden');

        downloadQueue.stopped = true;

    } else {

        let link      = downloadQueue.pending[0].link;
        let widthDone = (downloadQueue.counters.completed * 100 / downloadQueue.counters.total);
        let widthCurr = (1 * 100 / downloadQueue.counters.total);

        $('#' + downloadQueue.id + '-tree-files-download-counters-progress-done').css('width', widthDone + '%');
        $('#' + downloadQueue.id + '-tree-files-download-counters-progress-curr').css('width', widthCurr + '%');
        $('#' + downloadQueue.id + '-tree-files-download-counters-progress-curr').css('left' , widthDone + '%');

        let params = {
            link          : link,
            title         : downloadQueue.pending[0].title,
            version       : downloadQueue.pending[0].version,
            subFolder     : downloadQueue.pending[0].subFolder,
            index         : downloadQueue.pending[0].index,
            rootFolder    : downloadQueue.rootFolder,
            filenamesIn   : downloadQueue.formats,
            range         : downloadQueue.range,
            rename        : $('#' + downloadQueue.id + '-tree-files-download-rename').val(),
            folderPerItem : false,
            indexFile     : false,
            clearFolder   : false
        }

        
        if((downloadQueue.subFolders === 'top') || (downloadQueue.subFolders === 'path')) {

            if(typeof downloadQueue.pending[0].index !== 'undefined') {

                let elemRow  = downloadQueue.elemTBody.children(':eq(' + downloadQueue.pending[0].index + ')');
                let elemCell = elemRow.find('.tree-files-download-status');

                if(elemCell.length > 0) {
                    elemCell.html('');

                    let elemProcessing = $('<div></div>').appendTo(elemCell)
                        .addClass('tree-files-download-processing')
                        .addClass('processing');

                    $('<div></div>').addClass('bounce1').appendTo(elemProcessing);
                    $('<div></div>').addClass('bounce2').appendTo(elemProcessing);
                    $('<div></div>').addClass('bounce3').appendTo(elemProcessing);
                    
                }

            }

        } else {

            downloadQueue.elemTBody.children().each(function() {
                if(link === $(this).attr('data-link')) {

                    let elemCell = $(this).find('.tree-files-download-status');
                        elemCell.html('');

                    let elemProcessing = $('<div></div>').appendTo(elemCell)
                        .addClass('tree-files-download-processing')
                        .addClass('processing');

                    $('<div></div>').addClass('bounce1').appendTo(elemProcessing);
                    $('<div></div>').addClass('bounce2').appendTo(elemProcessing);
                    $('<div></div>').addClass('bounce3').appendTo(elemProcessing);
                    
                }
            });

        }

        downloadQueue.pending.splice(0,1);

        let response = await $.get({
            method : downloadQueue.method,
            url    : downloadQueue.endpoint
        }, params);

        let elemFiles = $('<div></div>').addClass('tree-files-downloaded');
        let rename    = $('#' + downloadQueue.id + '-tree-files-download-rename').val();


        if(rename !== 'no') {
            for(let attachment of response.data) {

                let date       = attachment.created.timeStamp.split('T')[0];
                let descriptor = response.params.title;
                let split      = descriptor.split(' [REV:');
                let title      = split[0];
                let revision   = response.params.version;
                let index      = attachment.name.lastIndexOf('.');
                let fileName   = attachment.name.substring(0, index);
                let fileSuffix = attachment.name.substring(index);            

                switch(rename) {
                    case 'fd'  : attachment.name = fileName + ' ' + date + fileSuffix; break;
                    case 'df'  : attachment.name = date + ' ' + fileName + fileSuffix; break;
                    case 'fv'  : attachment.name = fileName + ' V' + attachment.version + fileSuffix; break;
                    case 'fvd' : attachment.name = fileName + ' V' + attachment.version + ' ' + date + fileSuffix; break;
                    case 'frv' : attachment.name = fileName + ' ' + revision + '.' + attachment.version + ' ' + date + fileSuffix; break;
                    case 'frvd': attachment.name = fileName + ' ' + revision + '.' + attachment.version + ' ' + date + fileSuffix; break;
                    case 'd'   : attachment.name = title + fileSuffix; break;
                    case 'dv'  : attachment.name = title + ' V' + attachment.version + fileSuffix; break;
                    case 'dd'  : attachment.name = title + ' ' + date + fileSuffix; break;
                    case 'dvd' : attachment.name = title + ' V' + attachment.version + ' ' + date + fileSuffix; break;
                    case 'drv' : attachment.name = title + ' ' + revision + '.' + attachment.version + fileSuffix; break;
                    case 'drvd': attachment.name = title + ' ' + revision + '.' + attachment.version + ' ' + date + fileSuffix; break;
                }

            }
        }

        if(downloadQueue.folder === 'local-drive') {
            for(let attachment of response.data) {
                await saveAttachment(fileHandler, attachment, response.params.subFolder);
            }
        }

        if(response.data.length === 0) {

            $('<div></div>').appendTo(elemFiles)
                .addClass('tree-file-downloaded')
                .addClass('with-icon')
                .addClass('icon-cancel')
                .addClass('filled')
                .attr('title', 'No files found to download')
                .html('No match')

        } else if(response.data.length < 3) {
            
            for(let file of response.data) {
                let suffix = file.name.split('.').pop().toUpperCase();
                $('<div></div>').appendTo(elemFiles)
                    .addClass('tree-file-downloaded')
                    .addClass('with-icon')
                    .addClass('icon-check')
                    .addClass('filled')
                    .attr('title', file.name)
                    .html(suffix);
            }
        
        } else {

            let tooltip = '';

            for(let file of response.data) {
                if(tooltip !== '') tooltip += ', ';
                tooltip += file.name;
            }

            $('<div></div>').appendTo(elemFiles)
                .addClass('tree-file-counter')
                .addClass('tree-file-downloaded')
                .addClass('with-icon')
                .addClass('icon-check')
                .addClass('filled')
                .attr('title', tooltip)
                .html(response.data.length)

        }

        for(let file of response.data) {
            
            let elemList = $('#' + downloadQueue.id + '-tree-files-download-files-list');
            let elemFile = $('<div></div>').appendTo(elemList).html(file.name);

            elemFile.get(0).scrollIntoView({ behavior: "smooth"});

        }

        downloadQueue.counters.completed++;
        downloadQueue.counters.files += response.data.length;

        $('#' + downloadQueue.id + '-tree-files-download-counters-files').html(downloadQueue.counters.files);
        
        if((downloadQueue.subFolders === 'top') || (downloadQueue.subFolders === 'path')) {

            if(typeof response.params.index !== 'undefined') {

                let elemRow  = downloadQueue.elemTBody.children(':eq(' + response.params.index + ')');
                let elemCell = elemRow.find('.tree-files-download-status');

                elemRow.addClass('tree-download-complete');

                if(elemCell.length > 0) {
                    elemCell.html('');
                    elemCell.append(elemFiles.clone());
                }

            }

        } else {

            downloadQueue.elemTBody.children().each(function() {

                let elemRow  = $(this);
                let elemCell = elemRow.find('.tree-files-download-status');
                let linkRow  = elemRow.attr('data-link');

                if(link === linkRow) {
                    elemRow.addClass('tree-download-complete');
                    if(elemCell.length > 0) {
                        elemCell.html('');
                        elemCell.append(elemFiles.clone());
                    }
                }

            });

        }

        downloadQueue.success.push(response.params.link);
        processTreeDownloads(fileHandler, downloadQueue)

    }

}
async function saveAttachment(fileHandler, attachment, folder) {

    let dirHandler = await createDirectory(fileHandler, folder);
    let blob       = await treeDowonloadBinary(attachment.url);
    let fileHandle = await dirHandler.getFileHandle(attachment.name, { create: true });
    let writable   = await fileHandle.createWritable();

    await writable.write(blob);
    await writable.close();

    return true;

}
async function treeDowonloadBinary(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return await response.blob(); 
}
async function createDirectory(fileHandler, path) {

    if(path === '') return fileHandler;

    try {
        const parts = path.split('/').filter(Boolean);
        let dirHandler = fileHandler;
        for (const name of parts) {
            dirHandler = await dirHandler.getDirectoryHandle(name.trim(), { create: true });
        }
        return dirHandler;

    } catch (err) {
        console.error("Failed to create directory:", err.message);
    }
}
function stopTreeDownloads(id) {

    downloadQueue.stopped        = true;
    downloadQueue.pending.length = [];

    $('#' + id + '-tree-files-download-stop'    ).addClass('disabled').removeClass('red');
    $('#' + id + '-tree-files-download-options' ).toggleClass('hidden');
    $('#' + id + '-tree-files-download-progress').toggleClass('hidden');
    $('#' + id + '-tree-files-download-counters-progress-bar').addClass('hidden');

}
function returnToTreeDownloadOptions(id) {

    $('#' + id + '-tree-files-download-options').removeClass('hidden');
    $('#' + id + '-tree-files-download-progress').addClass('hidden');

}
function closeTreeDownloadPanel(id) {

    $('#' + id).removeClass('with-files-download');
    $('#' + id + '-tree-files-download-options').addClass('hidden');
    $('#' + id + '-tree-files-download-progress').addClass('hidden');

}


// Generate list of tiles
function genTilesList(id, items, panelSettings) {

    let elemGroupList;
    let groupName   = null;
    let elemContent = $('#' + id + '-content');
    let countPrev   = elemContent.children('.content-item').length ;
    let count       = countPrev + 1;

    
    if(!isBlank(panelSettings.groupBy)) {
        sortArray(items, 'group', 'string', 'ascending');
        elemContent.addClass('contains-groups');
    }
    
    if(!isBlank(panelSettings.groupLayout)) elemContent.addClass(panelSettings.groupLayout);
    
    if(items.length === 0);

    for(let item of items) {

        if(!isBlank(panelSettings.groupBy)) {

            if(groupName !== item.group) {

                let elemGroup = $('<div></div>').appendTo(elemContent)
                    .addClass('tiles-group');

                $('<div></div>').appendTo(elemGroup)
                    .addClass('tiles-group-title')
                    .html(isBlank(item.group) ? 'n/a' : item.group);

                elemGroupList = $('<div></div>').appendTo(elemGroup)
                    .addClass('tiles-group-list')
                    .addClass('tiles')
                    .addClass(panelSettings.layout)
                    .addClass(panelSettings.contentSize)
                    .addClass(panelSettings.surfaceLevel)
                    .addClass(getSurfaceLevel(elemContent));

                if(panelSettings.layout === 'list') elemGroupList.addClass('list')
                else if(panelSettings.layout === 'grid') elemGroupList.addClass('wide');

            }

            groupName = item.group;

        }

        if(item.partNumber === '') item.partNumber = item.title.split(' - ')[0];

        // if(!isBlank(item.image)) {

        //     if(item.image.indexOf('/') < 0) {

        //         item.image = '/api/v2/' 
        //             + item.link.split('/v3/')[1] 
        //             + '/field-values/' 
        //             + panelSettings.fieldIdTileImage 
        //             + '/image/' 
        //             + item.image;
        //     }

        // }

        // let image    = (panelSettings.workspaceViews[id].fieldIdImage === '') ? null : getWorkspaceViewRowValue(row, panelSettings.workspaceViews[id].fieldIdImage, '', 'link');
        // let details  = [];

        let elemTile = genSingleTile({
            link        : item.link, 
            edge        : item.edge, 
            descriptor  : item.descriptor, 
            tileIcon    : panelSettings.tileIcon, 
            tileNumber  : count++, 
            number      : panelSettings.number, 
            partNumber  : item.partNumber,
            imageId     : item.imageId, 
            imageLink   : item.imageLink, 
            title       : item.title, 
            subtitle    : item.subtitle,
            details     : item.details,
            attributes  : item.attributes,
            status      : item.status
        }, panelSettings).appendTo(elemContent);
        
        if(!isBlank(panelSettings.groupBy) && (panelSettings.groupLayout === 'horizontal')) elemTile.appendTo(elemGroupList);

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
            if(!isBlank(panelSettings.onClickItem)) panelSettings.onClickItem($(this));
            if(!isBlank(panelSettings.viewerSelection)) {
                if(panelSettings.viewerSelection) selectInViewer(id);
            }
        }).dblclick(function(e) {
            e.preventDefault();
            e.stopPropagation();
            if(!isBlank(panelSettings.onDblClickItem)) panelSettings.onDblClickItem($(this));
            else if(panelSettings.openOnDblClick) openItemByLink($(this).attr('data-link'));
        });

        //  if(elemFirst === null) { elemFirst = elemTile;

        // for(let fieldidDetail of panelSettings.workspaceViews[id].fieldIdsDetails) {
        //     details.push([
        //         fieldidDetail[0],
        //         getWorkspaceViewRowValue(row, fieldidDetail[1], '', 'title'),
        //         fieldidDetail[2]
        //     ]);
        // }

        // for(let fieldAttribute of panelSettings.workspaceViews[id].fieldIdsAttributes) {
        //     elemTile.attr('data-' + fieldAttribute.toLowerCase(), getWorkspaceViewRowValue(row, fieldAttribute, '', 'link'),)
        // }

        // if(details.length > 0) appendTileDetails(elemTile, details);

    }

    if(panelSettings.mode !== 'initial') {

        elemContent.show();
        let elemFirstNew = elemContent.children('.content-item:eq(' + countPrev + ')');
            elemFirstNew.get(0).scrollIntoView({ behavior : 'smooth', block: 'start', container : 'nearest' });

    }

    addTilesListImages(id, panelSettings); 

}
function genSingleTile(params, panelSettings) {

    if(isBlank(panelSettings)) panelSettings = {};
    if(isBlank(params  ))   params = {};
    if(isBlank(params.tileIcon )) params.tileIcon  = 'icon-product';
    if(isBlank(params.imageLink)) params.imageLink = '';

    let elemTile        = $('<div></div>').addClass('tile').addClass('content-item');
    let elemTileImage   = $('<div></div>').appendTo(elemTile).addClass('tile-image');
    let elemTileDetails = $('<div></div>').appendTo(elemTile).addClass('tile-details');
    let elemTitle       = $('<div></div>').appendTo(elemTileDetails).addClass('tile-title');

    if(!isBlank(params.link)) elemTile.attr('data-link', params.link);
    if(!isBlank(params.edge)) elemTile.attr('data-edge', params.edge);
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

    if(!isBlank(panelSettings.stateColors)) {

        if(panelSettings.stateColors.length > 0) {

            if(isBlank(params.status)) params.status = '';

            let color = 'transparent';
            let label = params.status;

            for(let stateColor of panelSettings.stateColors) {
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
                .css('background-color', color)
                .attr('title', label);
                
            $('<div></div>').appendTo(elemTileStatus)
                .addClass('tile-status-label')
                .html(label);

            elemTile.addClass('with-status');

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


    if(isBlank(params.imageId)) {
        if(isBlank(params.imageLink)) {
            if(!isBlank(params.link)) {
                if(params.link.indexOf('@') < 0) {
                    elemTile.addClass('no-image');
                }
            }
        }
    } 

    if(params.imageLink.indexOf('https://images.profile.autodesk.com') === 0) {

        $('<img>').appendTo(elemTileImage).attr('src', params.imageLink);
        
    } else {

        if(params.number) {
            $('<div></div>').appendTo(elemTileImage)
                .addClass('tile-counter')
                .html(params.tileNumber);
        } else {
            $('<span></span>').appendTo(elemTileImage)
                .addClass('icon')
                .addClass(params.tileIcon);
        }
    
        appendImageFromCache(elemTileImage, panelSettings, params, function() {});

    }

    return elemTile;

}
function addTilesListImages(id, panelSettings) {

    if(typeof panelSettings.tileImage === 'string') return;
    if(typeof panelSettings.tileImage === 'boolean') {
        if(!panelSettings.tileImage) return;
    }

    $('#' + id + '-content').find('.tile.no-image').each(function() {
        let elemTile = $(this);
        $.get('/plm/details', { link : elemTile.attr('data-link'), useCache : true }, function(response) {
            let linkImage   = getFirstImageFieldValue(response.data.sections);
            let elemImage   = elemTile.find('.tile-image').first();
            appendImageFromCache(elemImage, panelSettings, { 
                imageLink   : linkImage, 
                number      : panelSettings.number,
                icon        : panelSettings.tileIcon,
                link        : response.params.link
            }, function() {});
        });
    });

}
function addTilesListChevrons(id, panelSettings, callback) {

    if(!panelSettings.expand) return;

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


// Generate HTML Table & interactions
function genTable(id, items, panelSettings) {

    if(isBlank(panelSettings.multiSelect)) panelSettings.multiSelect = false;
    if(isBlank(panelSettings.editable)   ) panelSettings.editable    = false;
    if(isBlank(panelSettings.position)   ) panelSettings.position    = false;
    if(isBlank(panelSettings.descriptor) ) panelSettings.descriptor  = false;
    if(isBlank(panelSettings.quantity)   ) panelSettings.quantity    = false;
    if(isBlank(panelSettings.hideDetails)) panelSettings.hideDetails = false;
    if(isBlank(panelSettings.mode       )) panelSettings.mode        = 'initial';

    let elemContent = $('#' + id + '-content');
    let elemTBody   = $('#' + id + '-tbody');

    elemContent.show();

    if(panelSettings.mode === 'initial') {

        elemContent.html('');

        let elemTable = $('<table></table>').appendTo(elemContent)
            .addClass('content-table')
            .addClass('fixed-header')
            .addClass('row-hovering')
            .attr('id', id + '-table');

        let elemTHead = $('<thead></thead>').appendTo(elemTable)
            .addClass('content-thead')
            .attr('id', id + '-thead');

        if(!panelSettings.tableHeaders) { elemTHead.hide(); } else { genTableHeaders(id, elemTHead, panelSettings); }

        elemTBody = $('<tbody></tbody>').appendTo(elemTable)
            .addClass('content-tbody')
            .attr('id', id + '-tbody');

    }

    let editableFields = (panelSettings.editable) ? getEditableFields(panelSettings.columns) : [];

    genTableRows(id, elemTBody, panelSettings, items, editableFields);

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
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                clickTableToggleAll($(this));
            });


        $('<th></th>').addClass('table-check-box').appendTo(elemTHeadRow).append(elemToggleAll);

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
        elemTop.find('.content-item').addClass('checked').addClass('selected');
    } else {
        elemTop.find('.content-item').removeClass('checked').removeClass('selected');
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
function genTableRows(id, elemTBody, panelSettings, items, editableFields) {

    let count = elemTBody.children().length + 1;
    let first = null;

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
                clickContentItemSelect($(this), e);
                togglePanelToolbarActions($(this));
                updatePanelCalculations(id);
                if(!isBlank(panelSettings.onClickItem)) panelSettings.onClickItem($(this));
                if(!isBlank(panelSettings.viewerSelection)) {
                    if(panelSettings.viewerSelection) selectInViewer(id);
                }
            }).dblclick(function(e) {
                e.preventDefault();
                e.stopPropagation();
                if(!isBlank(panelSettings.onDblClickItem)) panelSettings.onDblClickItem($(this));
                else if(panelSettings.openOnDblClick) openItemByLink($(this).attr('data-link'));
            });

        if(!isBlank(item.edge)) elemRow.attr('data-edge', item.edge);
        if(!isBlank(item.root)) elemRow.attr('data-root-link', item.root);

        if(panelSettings.editable && panelSettings.multiSelect) {

            $('<td></td>').appendTo(elemRow)
                .html('<div class="icon icon-check-box xxs"></div>')
                .addClass('content-item-check-box')
                .addClass('table-check-box')
                .click(function(e) {
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

        if(panelSettings.number    ) $('<td></td>').appendTo(elemRow).addClass('content-column-number').html(count++);
        if(panelSettings.descriptor) $('<td></td>').appendTo(elemRow).addClass('content-column-descriptor').html(item.title);                
        if(panelSettings.quantity  ) $('<td></td>').appendTo(elemRow).addClass('content-column-quantity').html(quantity);

        if(!panelSettings.hideDetails) {

            for(let column of panelSettings.columns) {

                let isEditable  = false;
                let value       = '';
                let elemRowCell = $('<td></td>').appendTo(elemRow)
                    .attr('data-id', column.fieldId)
                    .addClass('list-column-' + column.fieldId.toLowerCase());

                for(let field of item.data) {
                    
                    if(field.fieldId === column.fieldId) {
                        
                        value = field.value;

                        if(panelSettings.editable) {

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

        if(first === null) first = elemRow.position().top;

    }

    if(panelSettings.mode !== 'initial') {
        let elemContent = $('#' + id + '-content');
        let top = first - (elemContent.innerHeight() / 2);
        elemContent.animate({ scrollTop: top }, 500);
    }

}
function panelTableCellValueChanged(elemControl) {

    let elemTop = elemControl.closest('.panel-top');
    let id      = elemTop.attr('id');
    let index   = elemControl.parent().index();
    let value   = elemControl.val();

    elemControl.parent().addClass('changed');
    elemControl.closest('tr').addClass('changed');

    $('#' + id + '-save').show();

    elemTop.find('.content-item.checked').each(function() {
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


// Pagination : Load next page
function panelPaginationLoadNext(panelSettings) {

    panelSettings.page++;
    panelSettings.offset += panelSettings.limit;
    panelSettings.mode = 'next';

    if(typeof panelSettings['next'] === 'undefined') panelSettings.load(); else panelSettings.next();

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
function clickContentItemSelect(elemClicked, e) {

    if(elemClicked.hasClass('checked')) elemClicked.addClass('selected'); else elemClicked.toggleClass('selected');
    
    let elemTop    = elemClicked.closest('.panel-top');
    let isSelected = elemClicked.hasClass('selected');;
    // let elemClicked = elemCheckbox.closest('.content-item');

    if(!elemClicked.hasClass('selected')) resetTableSelectAllCheckBox(elemClicked);

    elemTop.find('.content-item').each(function() {
        if(!$(this).hasClass('checked')) {
            $(this).removeClass('selected');
        }
    });

    if(isSelected) elemClicked.addClass('selected');

    // if(!elemTop.hasClass('multi-select')) elemClicked.siblings().removeClass('selected');
    updateListCalculations(elemTop.attr('id'));
    togglePanelToolbarActions(elemClicked);
    clickContentItemSelectDone(elemClicked, e);

}
function clickContentItemSelectDone(elemClicked, e) {}
function clickContentItem(elemClicked, e) {
    
    elemClicked.toggleClass('selected');
    elemClicked.siblings().removeClass('last');
    
    let elemTop    = elemClicked.closest('.panel-top');
    let isSelected = elemClicked.hasClass('selected');

    if(!elemTop.hasClass('multi-select')) elemTop.find('.content-item').removeClass('selected').removeClass('last');

    if(isSelected) elemClicked.addClass('selected').addClass('last');

    // updateListCalculations(elemTop.attr('id'));
    clickContentItemDone(elemClicked, e);

}
function clickContentItemDone(elemClicked, e) {}
function resetTableSelectAllCheckBox(elemRef) {

    let elemPanel = elemRef.closest('.panel-top');
    let elemCheck = elemPanel.find('th.table-check-box');
    let elemChild = elemCheck.children('.icon-check-box-checked');

    if(elemChild.length > 0) elemChild.removeClass('icon-check-box-checked').addClass('icon-check-box');

}
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
function getWorkspaceIdsFromNames(panelSettings, callback) {

    if(panelSettings.workspaceIds.length > 0) {

        callback(panelSettings.workspaceIds);

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
                callback(matchWorkspaceIds(panelSettings.workspacesIn));
            });

        } else callback(matchWorkspaceIds(panelSettings.workspacesIn));

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
                    else if(property === 'object') return field.value;
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



// Retrieve item's classification data
function getClassificationData(data) {

    for(let section of data.sections) {
       if(!isBlank(section.classificationId)) return section;
    }

    return {};

}



// Functions to handle BOM configuration data
function getBOMViewDefinition(data, bomViewName, wsConfig) {

    for(let bomView of data) {
        if(bomView.name == bomViewName) {
            wsConfig.bomViewId     = bomView.id;
            wsConfig.bomViewFields = bomView.fields;
            break;
        }
    }

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
function getBOMPartsList(panelSettings, data) {

    let parts  = [];
    let fields = panelSettings.viewFields || panelSettings.columns;

    panelSettings.iEdge = 0;
    panelSettings.urns  = [];

    for(let field of fields) {
        if(field.fieldId === 'QUANTITY') {
            panelSettings.urns.quantity = field.__self__.urn;
        } else if(field.fieldId === common.workspaces.items.fieldIdNumber) {
            panelSettings.urns.partNumber = field.__self__.urn;
        }
        if(!isBlank(panelSettings.selectItems)) {
            if(field.fieldId === panelSettings.selectItems.fieldId) panelSettings.urns.selectItems = field.__self__.urn;
        }
    }

    let rootPartNumber = getBOMCellValue(data.root, panelSettings.urns.partNumber, data.nodes);

    getBOMParts(panelSettings, parts, data.root, data.edges, data.nodes, 1.0, 1, '', [rootPartNumber]);

    return parts;

}
function getBOMParts(panelSettings, parts, parent, edges, nodes, quantity, level, numberPath, parents) {

    let result = { hasChildren : false };
    let fields = panelSettings.viewFields || panelSettings.columns;

    for(let i = panelSettings.iEdge; i < edges.length; i++) {

        let edge = edges[i];

        if(edge.parent === parent) {

            if(i === panelSettings.iEdge + 1) panelSettings.iEdge = i;

            let node = { 
                quantity    : getBOMEdgeValue(edge, panelSettings.urns.quantity, null, 0),
                partNumber  : getBOMCellValue(edge.child, panelSettings.urns.partNumber, nodes),
                linkParent  : edge.edgeLink.split('/bom-items')[0],
                level       : level,
                parent      : parents[parents.length - 1],
                parents     : parents.slice(),
                fields      : [],
                edgeId      : edge.edgeId,
                number      : edge.itemNumber,
                numberPath  : numberPath + edge.itemNumber,
                details     : {}
            }

            node.totalQuantity = node.quantity * quantity;

            node.path = node.parents.map(function(parent) {
                return parent;
            }).join('|') + '|' + node.partNumber;

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

            if(!isBlank(panelSettings.selectItems)) {
                if(panelSettings.selectItems.hasOwnProperty('values')) {
                    let selectValue = getBOMCellValue(edge.child, panelSettings.urns.selectItems, nodes);
                    if(panelSettings.selectItems.values.includes(selectValue)) parts.push(node);
                } else parts.push(node);
            } else {
                parts.push(node);
            }

            let nextParents = parents.slice();
                nextParents.push(node.partNumber);

            let nodeBOM = getBOMParts(panelSettings, parts, edge.child, edges, nodes, node.totalQuantity, level + 1, numberPath + edge.itemNumber + '.', nextParents);

            node.hasChildren = nodeBOM.hasChildren;

        }

    }

    return result;

}
function extendBOMPartsList(panelSettings, items) {

    let fields = panelSettings.viewFields || panelSettings.columns;
    let result = [];

    for (let item of items) {

        let node = {
            link          : item.node.item.link,
            root          : item.node.rootItem.link,
            title         : item.node.item.title,
            partNumber    : item.node.partNumber,
            totalQuantity : item.node.totalQuantity,
            edge          : item.edge,
            node          : item.node,
            fields        : [],
            details       : {}
        }

        for(let field of fields) {

            let fieldData = {
                fieldId     : field.fieldId,
                name        : field.name,
                displayName : field.displayName,
                urn         : field.__self__.urn,
                value       : ''
            }
            
            node.details[field.fieldId] = null;

            for(let nodeField of item.node.fields) {
                if(nodeField.metaData.urn === fieldData.urn) {
                    fieldData.value = nodeField.value;
                    node.details[field.fieldId] = nodeField.value;
                }
            }
            
            node.fields.push(fieldData);

        }

        result.push(node);

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



// Process bomPartsList structure
function getBOMPartsListChildren(bomPartsList, partNumber, edgeId, levels, includeParent) {

    if(isBlank(bomPartsList )) return;
    if(isBlank(partNumber   )) partNumber    = '';
    if(isBlank(edgeId       )) edgeId        = '';
    if(isBlank(levels       )) levels        = 1;
    if(isBlank(includeParent)) includeParent = true;

    let result = [];
    let level  = -1;

    for(let bomPart of bomPartsList) {

        if(bomPart.edgeId == edgeId) {

            if(includeParent) result.push(bomPart);
            level = bomPart.level;

        } else if(level > -1) {

            if(bomPart.level <= level) {
                return result;
            } else if(bomPart.level = (level + levels)) {
                result.push(bomPart);
            }

        }

    }

    return result;

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
        if(!isBlank(field.type)) {
            if(field.type.title === 'Image') {
                imageFields.push(field.__self__.split('/').pop());
            }
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


// Retrieve field value from item's grid row data
function getGridRowValue(row, fieldId, defaultValue, property) {

    if(isBlank(row)) return defaultValue;

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


// Retrieve field value from managed item's  row data
function getManagedItemFieldValue(data, fieldId, defaultValue) {

    if(isBlank(data)) return defaultValue;

    for(let field of data.linkedFields) {
        let id = field.__self__.split('/').pop();
        if(id === fieldId) {
            return field.value;
        }
    }

    return defaultValue;

}


// Display image from cache, use defined placeholder icon while processing
function appendImageFromCache(elemParent, panelSettings, params, onclick) {
    
    if(isBlank(params)) return;
    if(isBlank(params.replace)) params.replace = true;
    if(isBlank(params.link   )) params.link    = '/plm'; else if(params.link.indexOf('@') > -1) return;

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
        fieldId     : panelSettings.tileImageFieldId
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
function addFieldToPayload(payloadSections, workspaceSections, elemField, fieldId, value, skipEmpty, type) {

    if(isBlank(skipEmpty)) skipEmpty = true;

    if(skipEmpty) {
        if(isBlank(value)) {
            if(isBlank(elemField)) {
                return;
            }   
        }
    }

    let sectionId    = null;
    let isNewSection = true;
    let fieldData    = {};

    if(!isBlank(elemField)) {
        fieldData  = getFieldValue(elemField);
        sectionId  = getFieldSectionId(workspaceSections, fieldData.fieldId);
    } else {
        sectionId  = getFieldSectionId(workspaceSections, fieldId);
        fieldData  = {
            fieldId : fieldId,
            value   : value
        };
        if(!isBlank(type)) fieldData.type = type;
    }

    if(sectionId === -1) return;

    for(let section of payloadSections) {
        if(section.id === sectionId) {
            isNewSection = false;
            section.fields.push(fieldData);
        }
    }

    if(isNewSection) {
        payloadSections.push({
            id     : sectionId,
            fields : [fieldData]
        });
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

                        if(row.update) requests.push($.post('/plm/update-grid-row', { link : link, rowId : row.id, data : item}))

                    }

                }

            } else if(!deleteEmpty) row.hasMatch = true;

            if(!row.hasMatch) requests.push($.post('/plm/remove-grid-row', { link : row.link}))

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


// Convert date value to locale string
function convertDateToLocaleDate(value) {

    if(!isBlank(value)) {

        let valueDate = value.split(' ')[0]
        let splitDate = valueDate.split('-');
        let date      = new Date(splitDate[0], Number(splitDate[1] - 1), splitDate[2]);

        return date.toLocaleDateString();

    }

    return '';

}


// Convert URN to link
function getItemRevisionFromDescriptor(descriptor) {

    if(isBlank(descriptor)) return '';

    let split = descriptor.split(' [REV:');

    if(split.length === 1) return '';

    return split[1].split(']')[0];

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