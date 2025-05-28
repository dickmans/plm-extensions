let chart;
let title           = 'Activity Dashboard';
let enableMarkup    = false;
let fieldIdsMarkup  = [];
let wsConfig        = { 
    id                    : null,
    className             : '',
    sections              : [],
    excludedSections      : [],
    workflowHistory       : {},
    fields                : [],
    progress              : null,
    icon                  : 'account_tree',
    fieldIdSubtitle       : '',
    fieldIdItem           : '',
    tableauName           : '',
    tableauLink           : '',
    markupsImageFieldsPrefix     : 'MARKUP_'
}
let wsConfigBrowser = {
    id       : '95',
    viewName : 'Product Browser',
    tableau  : ''
}


$(document).ready(function() {

    for(let profile of config.dashboard) {

        if(wsId === profile.wsId.toString()) {

            wsConfig.id              = profile.wsId.toString();
            wsConfig.className       = profile.className;
            wsConfig.contents        = profile.contents;
            wsConfig.progress        = profile.progress;
            wsConfig.fieldIdViewable = profile.fieldIdViewable;
            wsConfig.tableauName     = (profile.title.length < 31) ? profile.title : 'Process Dashboard';

            if(!isBlank(profile.icon)) wsConfig.icon = profile.icon;
            if(!isBlank(profile.title)) title = profile.title;
            if(!isBlank(profile.fieldIdSubtitle)) wsConfig.fieldIdSubtitle = profile.fieldIdSubtitle;
            if(!isBlank(profile.workflowHistory)) wsConfig.workflowHistory = profile.workflowHistory;
            if(!isBlank(profile.markupsImageFieldsPrefix)) wsConfig.markupsImageFieldsPrefix = profile.markupsImageFieldsPrefix;

        }

    }

    insertMenu();

    if(isBlank(wsConfig.id)) {

        $('body').addClass('no-profile');
        sortArray(config.dashboard, 'title');

        for(let profile of config.dashboard) {

            let icon = (isBlank(profile.icon)) ? 'icon-workflow' : profile.icon;
        
            let elemProfile = $('<div></div>').appendTo($('.screen-list'))
                .addClass('screen-list-tile')
                .addClass('surface-level-4')
                .attr('data-id', profile.wsId)
                .click(function() {

                    let location = document.location.href.split('?');
                    let params   = (location.length === 1) ? [] : location[1].split('&');
                    let url      = location [0] + '?'

                    url += 'wsId='+$(this).attr('data-id');

                    for(let param of params) {
                        if(param.toLowerCase().indexOf('wsid') < 0) url += '&' + param;
                    }
                    
                    document.location.href = url;

                });

            $('<div></div>').appendTo(elemProfile)
                .addClass('screen-list-tile-icon')
                .addClass('icon')
                .addClass(icon);
                
            $('<div></div>').appendTo(elemProfile)
                .addClass('screen-list-tile-title')
                .html(profile.title);

        }

    } else {

        $('#header-title').html(title);

        document.title = title;

        appendNoDataFound('list');

        appendOverlay(false);

        setUIEvents();
        setStatusColumns();
        setCalendars();
        setChart();

        getInitialData();

    }

});


// Set UI controls
function setUIEvents() {

    // View Selector
    $('#view').change(function() {
        setSelectedView();
    });

}


// Set UI Elements
function setStatusColumns() {

    let elemParent = $('#progress')

    for(let state of wsConfig.progress) {

        let elemState = $('<div></div>').appendTo(elemParent);

        $('<div></div>').appendTo(elemState)
            .html(state.label)
            .css('background-color', state.color)
            .addClass('progress-title');
        
        $('<div></div>').appendTo(elemState)
            .addClass('progress-column')
            .addClass('list')
            .addClass('surface-level-2')
            .addClass('tiles')
            .addClass('l')
            .attr('data-states', state.states)
            .attr('data-label', state.label)
            .attr('data-color', state.color);

    }

}
function setCalendars() {

    let currentDate = new Date();

    insertCalendarMonth('calendar-month-1', currentDate);

    currentDate.setMonth(currentDate.getMonth() - 1);

    insertCalendarMonth('calendar-month-2', currentDate);

    currentDate.setMonth(currentDate.getMonth() - 1);

    insertCalendarMonth('calendar-month-3', currentDate);

    $('.calendar-day').click(function() {
        selectCalendarDay($(this));
    });
    $('.calendar-week').click(function() {
        selectCalendarWeek($(this));
    });

}
function setChart() {

    Chart.defaults.borderColor       = chartThemes[theme].axisColor;
    Chart.defaults.color             = chartThemes[theme].fontColor;
    Chart.defaults.scale.grid.color  = chartThemes[theme].gridColor;

    let ctx = document.getElementById('chart').getContext('2d');

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                { data: [], backgroundColor: config.colors.red,    label : 'Age (days since process creation)' },
                { data: [], backgroundColor: config.colors.yellow, label : 'Last Update (days since last modification)' }
            ]
        },
        options: {
            indexAxis: 'y',
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                x: { stacked : true, beginAtZero : true },
                y: { stacked : true, grid : { display : false }}
            }
        }
    });

}


// View selector to track existing processes
function setSelectedView() {

    $('#views').children().hide();
    $('#views').addClass('hidden');
    $('#list-no-data').addClass('hidden');

    let view = $('#view').val();
    $('#' + view).css('display', 'flex');

    if($('#' + view).children().length === 0) {
        $('#list-no-data').removeClass('hidden').show();
    } else {
        $('#views').removeClass('hidden');
    }

}


// Retrieve WS configuration & data
function getInitialData() {

    let requests = [
        $.get('/plm/sections'   , { wsId : wsConfig.id, useCache : true }),
        $.get('/plm/fields'     , { wsId : wsConfig.id, useCache : true }),
        $.get('/plm/tableaus'   , { wsId : wsConfig.id, useCache : true }),
        $.get('/plm/permissions', { wsId : wsConfig.id, useCache : true }),
    ];

    Promise.all(requests).then(function(responses) {

        wsConfig.sections    = responses[0].data;
        wsConfig.fields      = responses[1].data;
        wsConfig.permissions = responses[3].data;

        for(let tableau of responses[2].data) {
            if(tableau.title === wsConfig.tableauName) {
                wsConfig.tableauLink = tableau.link;
            }
        }
        
        for(let field of wsConfig.fields) {
            if(!isBlank(field.type)) {
                if(field.type.title === 'Image') {
                    let fieldId = field.__self__.split('/')[8];
                    if(fieldId.indexOf(wsConfig.imageFieldsPrefix) === 0) {
                        enableMarkup = true;
                        fieldIdsMarkup.push(fieldId);
                        let sectionId   = getFieldSectionId(wsConfig.sections, fieldId);
                        if(wsConfig.excludedSections.indexOf(sectionId) === -1) wsConfig.excludedSections.push(sectionId);
                    }
                }
            }
        }
        
        $('#main').removeClass('hidden');
        
        if(!enableMarkup) $('body').addClass('no-markup');
        
        if(hasPermission(wsConfig.permissions, 'add_items')) {
            $('body').removeClass('no-new');
            insertCreate([], [wsConfig.id], {
                id                  : 'new-sections',
                hideHeader          : true,
                hideSections        : true,
                requiredFieldsOnly  : true,
                cancelButton        : false,
                createButtonLabel   : 'Continue',
                createButtonIcon    : 'icon-chevron-right',
                useCache            : true,
                afterCreation       : function(id, link) { openItem(link); }
            });
        }

        if(wsConfig.tableauLink === '') {

            let params = {
                wsId      : wsConfig.id, 
                name      : wsConfig.tableauName,
                columns   : ['descriptor', 'created_on', 'last_modified_on', 'wf_current_state']
            }

            if(!isBlank(wsConfig.fieldIdSubtitle)) params.columns.push(wsConfig.fieldIdSubtitle);

            $.post('/plm/tableau-add', params, function() {
                $.get('/plm/tableaus', { 'wsId' : wsConfig.id }, function(response) {
                    for(let tableau of response.data) {
                        if(tableau.title === wsConfig.tableauName) {
                            wsConfig.tableauLink = tableau.link;
                            getProcesses();
                        }
                    }
                }); 
            }); 

        } else {
            getProcesses();
        }

    });

}
function getProcesses() {

    let requests = [
        $.get('/plm/tableau-data', { link : wsConfig.tableauLink }),
        $.get('/plm/mow'         , {}),
        $.get('/plm/recent'      , {}),
        $.get('/plm/bookmarks'   , {})
    ];

    Promise.all(requests).then(function(responses) {

        $('#overlay').hide();

        let elemTable = $('#calendar-table-body');
            elemTable.html('');

        for(let item of responses[0].data.items) {

            let status     = item.fields[3].value;
            let descriptor = item.fields[0].value;
            let subtitle   = (isBlank(wsConfig.fieldIdSubtitle)) ? '' : item.fields[4].value;
            let elemTile   = genSingleTile({ 
                link       : item.item.link, 
                tileIcon   : wsConfig.icon, 
                title      : descriptor, 
                subtitle   : subtitle,
                status     : status
            }, {
                stateColors : wsConfig.progress
            });
            let valueCreated   = item.fields[1].value;
            let valueModified  = item.fields[2].value;
            let dateNow        = new Date();
            let diffCreated    = 0;
            let diffModified   = 0;
            let dateCreated;

            appendTileDetails(elemTile, [
                ['with-icon icon-start'  , 'Created on ' + item.fields[1].value      , false],
                ['with-icon icon-calendar', 'Last update on ' + item.fields[2].value  , false]
            ]);

            if(!isBlank(valueCreated)) {

                if(valueCreated.indexOf('.') > -1) {
                    let split = valueCreated.split('.');
                    valueCreated = split[1] + '/' + split[0] + '/' + split[2];
 
                }
                dateCreated  = new Date(valueCreated);
                diffCreated  = dateNow.getTime() - dateCreated.getTime();
                diffCreated  = diffCreated / (1000 * 3600 * 24);
                valueCreated = dateCreated.toLocaleDateString();
            }
            
            if(!isBlank(valueModified)) {
                if(valueModified.indexOf('.') > -1) {
                    let split = valueModified.split('.');
                    valueModified = split[1] + '/' + split[0] + '/' + split[2];
                }
                let dateModified = new Date(valueModified);
                diffModified = dateNow.getTime() - dateModified.getTime();
                diffModified = diffModified / (1000 * 3600 * 24);
                valueModified = dateModified.toLocaleDateString();
            }

            if(isBlank(item.fields[2].value)) diffModified = diffCreated;

            $('.progress-column').each(function() {
                let states = $(this).attr('data-states').split(',');
                if(states.indexOf(status) > -1) {
                    elemTile.find('.tile-status').css('background-color', $(this).attr('data-color'));
                    elemTile.find('.tile-status-label').html($(this).attr('data-label'));
                    $(this).append(elemTile.clone());
                }
            });

            elemTile.appendTo($('#all'));

            if(isContained(item.item.link, responses[1].data.outstandingWork)) elemTile.clone().appendTo($('#mow'));
            if(isContained(item.item.link, responses[2].data.recentlyViewedItems)) elemTile.clone().appendTo($('#recents'));
            if(isContained(item.item.link, responses[3].data.bookmarks)) elemTile.clone().appendTo($('#bookmarks'));

            chart.data.labels.push(descriptor.split(' - ')[0]);
            chart.data.datasets[0].data.push(diffCreated);
            chart.data.datasets[1].data.push(diffModified);

            let elemRow = $('<tr></tr>');
                elemRow.appendTo(elemTable);
                elemRow.attr('data-date', dateCreated);
                elemRow.attr('data-link', item.item.link);
                elemRow.click(function() { openItem($(this).attr('data-link')); });

            $('<td></td>').appendTo(elemRow).html(item.fields[0].value);
            $('<td></td>').appendTo(elemRow).html(valueCreated);
            $('<td></td>').appendTo(elemRow).html(valueModified);
            $('<td></td>').appendTo(elemRow).html(status);
                

            $('.calendar-day').each(function() {
                let date = new Date($(this).attr('data-date'));

                if(date.getTime() === dateCreated.getTime()) {
                    $(this).addClass('calendar-highlight');
                }

            });

        }

        setSelectedView();

        $('.tile').click(function() { openItem($(this).attr('data-link')); });
        $('.calendar-day-current').click();

        chart.update();

    });

}
function isContained(link, list) {

    for(listItem of list) {
        if(link === listItem.item.link) return true;
    }

    return false;

}


// Calendar selection events
function selectCalendarDay(elemClicked) {

    if(elemClicked.hasClass('selected')) {
        $('.calendar-day-current').click();
        return;
    }

    let dateClicked = new Date(elemClicked.attr('data-date'));

    $('#calendar').find('.selected').removeClass('selected');

    elemClicked.addClass('selected');

    $('#calendar-table-body').children().each(function() {

        let dateRow = new Date($(this).attr('data-date'));

        if(dateRow.getTime() === dateClicked.getTime()) $(this).show(); else $(this).hide();

    });

}
function selectCalendarWeek(elemClicked) {

    if(elemClicked.hasClass('selected')) {
        $('.calendar-day-current').click();
        return;
    }    

    let dateClicked = new Date(elemClicked.attr('data-date'));
    let dateEnd     = new Date(elemClicked.attr('data-date'));
    
    dateEnd.setDate(dateEnd.getDate() + 7);

    $('#calendar').find('.selected').removeClass('selected');

    elemClicked.addClass('selected');

    $('#calendar-table-body').children().each(function() {

        let dateRow = new Date($(this).attr('data-date'));
        $(this).hide();
    
        if(dateRow.getTime() >= dateClicked.getTime()) {
            if(dateRow.getTime() <= dateEnd.getTime()) {
                $(this).show(); 
            }
        }
    
    });

}


// Show selected process in main window
function openItem(link) {

    insertItemSummary(link, {
        bookmark        : true,
        className       : wsConfig.className,
        contents        : wsConfig.contents,
        openInPLM       : true,
        reload          : true,
        layout          : 'dashboard',
        statesColors    : wsConfig.progress,
        surfaceLevel    : '3',
        workflowActions : true
    });


    // viewerUnloadAllModels();
    // insertWorkflowActions(link);

    //     if(enableMarkup) {
    //         for(fieldId of fieldIdsMarkup) {

    //             let elemMarkup = $('<canvas></canvas>');
    //                 elemMarkup.attr('id', fieldId);
    //                 elemMarkup.attr('data-fieldid', fieldId);
    //                 elemMarkup.addClass('markup');
    //                 elemMarkup.addClass('placeholder');
    //                 elemMarkup.appendTo($('#markup-list'));
    //                 elemMarkup.click(function() {
    //                     selectMarkup($(this));
    //                 });

    //             let value = getSectionFieldValue(response.data.sections, fieldId, '', 'link');

    //             if(value !== '') {

    //                 $.get('/plm/image-cache', {
    //                     'link' : value,
    //                     'fieldId' : fieldId
    //                 }, function(response) {

    //                     $('#' + response.params.fieldId).removeClass('placeholder');

    //                     let canvas = document.getElementById(response.params.fieldId);
    //                         canvas.width = 200;
    //                         canvas.height = 100;

    //                     let ctx  = canvas.getContext('2d');
    //                     let img = new Image();
    //                         img.src = response.data.url;
    //                         img.onload = function() {
    //                             ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    //                         };
                    
    //                 });

    //             }
    //         }
    //     }

    // });


}


// // Viewer
// function selectMarkup(elemClicked) {

//     elemClicked.siblings().removeClass('selected');
//     elemClicked.toggleClass('selected');
//     if(elemClicked.hasClass('selected')) {
//         if($('#viewer-markup-toolbar').hasClass('hidden')) {
//             $('#my-markup-button').click();
//         }
//     } else if(!$('#viewer-markup-toolbar').hasClass('hidden')) {
//         viewerLeaveMarkupMode();
//     }


// }
// function initViewerDone() {

//     if(enableMarkup) viewerAddMarkupControls(true);

//     if($('body').hasClass('no-viewer')) { $('#attachments-list').addClass('l').removeClass('xs');}
//                                    else { $('#attachments-list').addClass('xs').removeClass('l');}

// }
// function viewerSaveMarkup() {

//     let fieldId = $('.markup.selected').first().attr('id');

//     $('#overlay').show();

//     viewerCaptureScreenshot(fieldId, function() {

//         let elemMarkupImage = $('#' + fieldId);

//         let params = { 
//             'link'      : $('#item').attr('data-link'),
//             'image'     : {
//                 'fieldId' : fieldId,
//                 'value'   : elemMarkupImage[0].toDataURL('image/jpg')
//             }
//         };

//         $.post({
//             url         : '/plm/upload-image', 
//             contentType : 'application/json',
//             data        : JSON.stringify(params)
//         }, function() {
//             $('#overlay').hide();
//             elemMarkupImage.removeClass('placeholder');
//         });

//     });

// }