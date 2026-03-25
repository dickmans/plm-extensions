let yourTasks = [];
let weeks     = [];
let wsConfig  = {};
let user      = {};

let paramsTaskSummary = {
    id              : 'summary',
    layout          : 'tabs',
    bookmark        : true,
    openInPLM       : true,
    reload          : true,
    hideCloseButton : true,
    contents   : [{ 
        type   : 'details', 
        params : { 
            id         : 'task-details',
            hideHeader : true,
        }
    },{ 
        type   : 'attachments', 
        params : { 
            id         : 'task-attachments', 
            editable   : true,
            hideHeader : true,
        } 
    },{ 
        type   : 'grid', 
        params : { 
            id         : 'task-grid', 
            editable   : true,
            hideHeader : true,
            rotate     : false,
        } 
    },{ 
        type   : 'relationships', 
        params : { 
            id         : 'task-relationships',
            hideHeader : true,
        }
    },{ 
        type   : 'change-log', 
        params : { 
            id         : 'task-change-log',
            hideHeader : true,
        }
    }]
}


$(document).ready(function() {

    appendOverlay(true);
    setUIEvents();
    insertMenu();

    wsConfig.workspaceId = config.workspaceId || common.workspaceIds.engineeringProjectTasks;
    wsConfig.fieldIDs    = config.fieldIDs;

    let requests = [
        $.get('/plm/workspace-workflow-transitions', { wsId : wsConfig.workspaceId, useCache : true }),
        $.get('/plm/workspace-scripts', { wsId : wsConfig.workspaceId, useCache : true }),
        $.get('/plm/sections', { wsId : wsConfig.workspaceId, useCache : true }),
        $.get('/plm/me', { useCache : true })
    ];

    getFeatureSettings('worklist', requests, function(responses) {

        let transitions = {}

        wsConfig.sections = responses[2].data;
        user.fullName     = responses[3].data.fullName;
        user.number       = responses[3].data.userNumber;

        for(let transition of responses[0].data) {

            switch(transition.customLabel) {
                case config.transitions.accept.id : transitions.accept = transition; break;
                case config.transitions.return.id : transitions.return = transition; break;
                case config.transitions.finish.id : transitions.finish = transition; break;
            }

            for(let step of config.yourTasks.transitions) {
                if(step.id === transition.customLabel) step.link = transition.__self__
            }

        }

        for(let script of responses[1].data.scripts) {
            if(script.uniqueName === config.actionScriptName) {
                wsConfig.scriptId = script.__self__.split('/').pop()
            }
        }

        if(isBlank(wsConfig.scriptId)) {
            showStartupError({
                title : 'Server Configuration Error',
                details : 'The configuration settings for this application are not valid as there is no script defined for the task efforts rollup',
                instructions : 'Contact your administrator and let him review the settings of application worklist . A valid script name must be defined in setting <strong>actionScriptName</strong>, matching an on demand script of the tasks workspace with id <strong>' + wsConfig.workspaceId + '</strong>.'
            });
            return;
        }

        insertNewTasks(wsConfig.workspaceId, transitions, {
            reload         : true,
            // search         : true,
            openOnDblClick : true,
            headerLabel    : 'Requested Tasks',
            // singleToolbar  : 'actions',
            groupBy        : config.fieldIDs.root,
            onClickItem    : function(elemClicked) { insertItemSummary(elemClicked.attr('data-link'), paramsTaskSummary); }
        });

        insertYourTasks(config.yourTasks.filters, {
            reload    : true,
            search    : true,
            openInPLM : true,
            afterCompletion : function(id, data) { setGlobalToolbarActions(data); }
        });

    });

});



// Set UI controls
function setUIEvents() {

    // Global header toolbar buttons
    $('#filter-project').change(function() { applyGlobalFilters(); });
    $('#filter-tasks'  ).change(function() { applyGlobalFilters(); });
    $('#toggle-new-tasks').click(function() {
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
        $('body').toggleClass('no-new-tasks');
    });
    $('#toggle-summary').click(function() {
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
        $('body').toggleClass('no-summary');
    });

}
function setGlobalToolbarActions(data) {

    let elemToolbar = $('#your-tasks-controls');
    let elemSaveAll = $('#save-your-tasks-changes');

    if(elemSaveAll.length === 0) {

        $('<div></div>').prependTo(elemToolbar)
            .addClass('button')
            .addClass('default')
            .addClass('disabled')
            .attr('id', 'save-your-tasks-changes')
            .attr('disabled', 'disabled')
            .html('Save Changes')
            .click(function() {
                saveAllChanges();
            });

    }

    let listProjects = [];

    for(let task of yourTasks) {
        if(!listProjects.includes(task.root)) listProjects.push(task.root);
        listProjects.sort();
    }

    let elemFilterProject = $('#filter-project');

    for(let project of listProjects) {
        $('<option></option>').appendTo(elemFilterProject).attr('value', project).html(project);
    }

    elemFilterProject.removeClass('disabled').removeAttr('disabled');
    $('#filter-tasks').removeClass('disabled').removeAttr('disabled');

}
function applyGlobalFilters() {

    let filterProject  = $('#filter-project').val();
    let filterTasks    = $('#filter-tasks').val();
    let timeline       = { start : 10000, end : -100000 };
    let dateNow        = new Date();
    let dateRangeStart = new Date();
    let dateRangeEnd   = new Date();

    dateRangeStart.setDate(dateRangeStart.getDate() - (    dateRangeStart.getDay() -1));
      dateRangeEnd.setDate(  dateRangeEnd.getDate() + (8 - dateRangeEnd.getDay()));

    dateRangeStart.setHours(0, 0, 0, 0);
    dateRangeEnd.setHours(0, 0, 0, 0);  
    
    switch(filterTasks) {

        case 'due':
            dateRangeStart.setDate(dateRangeStart.getDate() - 10000);
            break;

        case 'next-week':
            dateRangeStart.setDate(dateRangeStart.getDate() + 7);
            dateRangeEnd.setDate  (  dateRangeEnd.getDate() + 7);
            break;

        case 'previous-week':
            dateRangeStart.setDate(dateRangeStart.getDate() - 7);
            dateRangeEnd.setDate  (  dateRangeEnd.getDate() - 7);
            break;

        case '3-6':
            dateRangeStart.setDate(dateRangeStart.getDate() - (3 * 7));
            dateRangeEnd.setDate  (  dateRangeEnd.getDate() + (6 * 7));
            break;                   

        case '6-12':
            dateRangeStart.setDate(dateRangeStart.getDate() - (6 * 7));
            dateRangeEnd.setDate  (  dateRangeEnd.getDate() + (12 * 7));
            break;                   

        case '6-26':
            dateRangeStart.setDate(dateRangeStart.getDate() - (6 * 7));
            dateRangeEnd.setDate  (  dateRangeEnd.getDate() + (26 * 7));
            break;                   

        case 'this-month':
            dateRangeStart.setDate(dateNow.getDate() - dateNow.getDate() + 1);
            dateRangeEnd = new Date(dateNow.getFullYear(), dateNow.getMonth() + 1, 1);
            break;
        
        case 'next-month':
            dateRangeStart = new Date(dateNow.getFullYear(), dateNow.getMonth() + 1, 1);
            dateRangeEnd   = new Date(dateNow.getFullYear(), dateNow.getMonth() + 2, 1);
            break;

        case 'previous-month':
            dateRangeStart = new Date(dateNow.getFullYear(), dateNow.getMonth() + -1, 1);
            dateRangeEnd   = new Date(dateNow.getFullYear(), dateNow.getMonth() +  0, 1);
            break;

        case 'this-year':
            dateRangeStart = new Date(dateNow.getFullYear(),  0, 1);
            dateRangeEnd   = new Date(dateNow.getFullYear(), 12, 1);
            break;                             

        case 'next-year':
            dateRangeStart = new Date(dateNow.getFullYear() + 0,  1, 1);
            dateRangeEnd   = new Date(dateNow.getFullYear() + 1, 12, 1);
            break;

    }    


    $('#new-tasks').find('.tiles-group-title').each(function() {

        let elemGroupTitle = $(this);
        let elemGroup      = elemGroupTitle.closest('.tiles-group');

        if(filterProject === 'all') elemGroup.removeClass('hidden');
        else if(elemGroupTitle.html() === filterProject) elemGroup.removeClass('hidden'); 
        else elemGroup.addClass('hidden');

    });   
    
    $('#new-tasks').find('.content-item').each(function() {
        
        let visible   = false;
        let elemTask  = $(this);
        let timestamp = Number(elemTask.attr('data-tdue'));

        if(timestamp >= dateRangeStart.getTime()) {
            if(timestamp <= dateRangeEnd.getTime()) {
                visible = true;
            }
        }

        if(filterTasks === 'all') visible = true;

        if(visible) elemTask.removeClass('hidden'); else elemTask.addClass('hidden');

    });


    $('#your-tasks').find('.content-item').each(function() {

        let elemTask = $(this);
        let visible  = true;
        let task     = yourTasks[elemTask.index()];

        if(filterProject !== 'all') {
            visible = (elemTask.attr('data-root') === filterProject);
        }
        
        if(visible) {
            if(filterTasks !== 'all') {
                     if(task.tStart >   dateRangeEnd.getTime()) visible = false;
                else if(task.tEnd   < dateRangeStart.getTime()) visible = false;
            }
        }

        if(visible) {
            elemTask.removeClass('hidden'); 
            if(task.wStart < timeline.start) timeline.start = task.wStart;
            if(task.wEnd   > timeline.end  ) timeline.end   = task.wEnd;
        } else elemTask.addClass('hidden');

    }); 

   timeline.start--;
   timeline.end++;

    for(let index in weeks) {

        let visible   = false;
        let elemsWeek = $('.timeline-week.week-' + index);

        if(index >= timeline.start) {
            if(index <= timeline.end) {
                visible = true;
            }
        }        

        if(visible) elemsWeek.removeClass('hidden'); else elemsWeek.addClass('hidden');

    }

}


// Insert tasks in defined status with acknowledgement actions
function insertNewTasks(wsId, transitions, params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'new-tasks' : params.id;

    settings[id] = getPanelSettings('', params, {
        headerLabel  : 'New Tasks',
        layout       : 'list',
        contentSize  : 'm',
        groupBy      : config.fieldIDs.root
    }, [
        [ 'wsId'       , wsId],
        [ 'transitions', transitions ],
        [ 'sortBy'     , [ wsConfig.fieldIDs.end ] ],
        [ 'pageSize'   , 1000 ],
        [ 'tileImage'  , false ]
    ]);

    config.filters.newTasks.push({
        field      : wsConfig.fieldIDs.members,
        type       : 0,
        comparator : 38,
        value      : user.fullName
    });

    settings[id].filters = config.filters.newTasks;
    settings[id].load    = function() { insertNewTasksData(id, true); }

    genPanelTop                    (id, 'new-tasks');
    genPanelHeader                 (id, settings[id]);
    genPanelOpenSelectedInPLMButton(id, settings[id]);
    genPanelSearchInput            (id, settings[id]);
    genPanelResizeButton           (id, settings[id]);
    genPanelReloadButton           (id, settings[id]);
    genPanelContents               (id, settings[id]);
    
    insertNewTasksDone(id);
    settings[id].load();

}
function insertNewTasksDone(id) {}
function insertNewTasksData(id) {

    settings[id].timestamp = startPanelContentUpdate(id);

    let params = {
        wsId      : settings[id].wsId,
        filter    : settings[id].filters,
        fields    : [],
        pageSize  : settings[id].pageSize,
        sort      : settings[id].sortBy,
        timestamp : settings[id].timestamp,
        useCache  : settings[id].useCache
    }

    params.fields.push(wsConfig.fieldIDs.root);
    params.fields.push(wsConfig.fieldIDs.id);
    params.fields.push(wsConfig.fieldIDs.title);
    params.fields.push(wsConfig.fieldIDs.description);
    params.fields.push(wsConfig.fieldIDs.priority);
    params.fields.push(wsConfig.fieldIDs.start);
    params.fields.push(wsConfig.fieldIDs.end);
    params.fields.push(wsConfig.fieldIDs.duration);
    params.fields.push(wsConfig.fieldIDs.plannedEffort);
    params.fields.push(wsConfig.fieldIDs.weeklyEffort);

    $.post( '/plm/search', params, function(response) {

        printResponseErrorMessagesToConsole(response);

        if(stopPanelContentUpdate(response, settings[id])) return;

        let items = response.data.row;

        for(let item of items) {

            item.link     = '/api/v3/workspaces/' + settings[id].wsId + '/items/' + item.dmsId;
            item.title    = item.data[wsConfig.fieldIDs.id].value + ' - ' + item.data[wsConfig.fieldIDs.title].value;
            item.subtitle = item.data[wsConfig.fieldIDs.description].value;
            item.details  = [];

            insertTileDetail(item, wsConfig.fieldIDs, 'priority', 'value', 'Priority');
            insertTileDetail(item, wsConfig.fieldIDs, 'duration', 'value', 'Duration', 'days');
            insertTileDetail(item, wsConfig.fieldIDs, 'end', 'displayValue', 'Due Date');
            insertTileDetail(item, wsConfig.fieldIDs, 'plannedEffort', 'displayValue', 'Planned Effort', 'hours');

            if(!isBlank(settings[id].groupBy)) item.group = item.data[settings[id].groupBy].value;

        }

        finishPanelContentUpdate(id, items);

        let elemContent = $('#' + id + '-content');
        let index       = 0;

        elemContent.find('.content-item').each(function() {

            let elemTask    = $(this);
            let item        = items[index++];
            let elemActions = $('<div></div>').appendTo(elemTask).addClass('task-actions');
            let dueString   = item.data[wsConfig.fieldIDs.end].value.split(' ')[0].split('-');
            let dueDate     = new Date(dueString[0], Number(dueString[1]) - 1, Number(dueString[2]));

            elemTask.attr('data-tDue', dueDate.getTime());

            insertNewTaskAction(elemTask, elemActions, settings[id].transitions, 'return');
            insertNewTaskAction(elemTask, elemActions, settings[id].transitions, 'finish');
            insertNewTaskAction(elemTask, elemActions, settings[id].transitions, 'accept');

        });

        insertNewTasksDataDone(id, response);

    });

}
function insertTileDetail(item, fieldIDs, fieldName, property, prefix, suffix) {

    if(!item.data.hasOwnProperty(fieldIDs[fieldName])) return;

    let value = item.data[fieldIDs[fieldName]][property];

    if(!isBlank(suffix)) value += ' (' + suffix + ')';
    
    item.details.push({
        label : prefix,
        value : value
    })

}
function insertNewTaskAction(elemTask, elemParent, transitions, name) {

    let transition = transitions[name];

    if(isBlank(transition)) return;

    let link        = elemTask.attr('data-link');
    let descriptor  = elemTask.attr('data-title');

    let elemAction = $('<div></div>').appendTo(elemParent)
        .addClass('button')
        .addClass('new-task-action-return')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            insertWorkflowTransitionDialog(link, descriptor, 'Task', transition, function() {
                settings['new-tasks'].load();
                settings['your-tasks'].load();
        });
    });


    if(!isBlank(config.transitions[name].icon)) {
        elemAction.addClass('icon');
        elemAction.addClass(config.transitions[name].icon);
        elemAction.attr('title', transition.name);
    } else elemAction.html(transition.name);

         if(name === 'return') elemAction.addClass('red');
    else if(name === 'accept') elemAction.addClass('default');

    return elemAction;

}
function insertNewTasksDataDone(id, response) {}



// Insert end user dashboard for comprehensive task management
function insertYourTasks(filters, params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'your-tasks' : params.id;

    settings[id] = getPanelSettings('', params, {
        headerLabel  : 'Your Tasks In Work',
        contentSize  : 'custom',
        layout       : 'list'
    }, [
        [ 'wsId'     , wsConfig.workspaceId    ],
        [ 'fieldIDs' , config.fieldIDs         ],
        [ 'sortBy'   , [ config.fieldIDs.end ] ]
    ]);    

    filters.push({
        field      : config.fieldIDs.assignee,
        type       : 0,
        comparator : 15,
        value      : user.fullName
    });

    settings[id].filters = filters;
    settings[id].load = function() { insertYourTasksData(id); }

    genPanelTop                    (id, id);
    genPanelHeader                 (id, settings[id]);
    genPanelOpenSelectedInPLMButton(id, settings[id]);
    genPanelSearchInput            (id, settings[id]);
    genPanelResizeButton           (id, settings[id]);
    genPanelReloadButton           (id, settings[id]);

    genPanelContents(id, settings[id]);

    insertYourTasksDone(id);
    settings[id].load();

}
function insertYourTasksDone(id) {}
function insertYourTasksData(id) {

    settings[id].timestamp = startPanelContentUpdate(id);

    let params = {
        wsId      : settings[id].wsId,
        fields    : [],
        filter    : settings[id].filters,
        sort      : [wsConfig.fieldIDs.end],
        timestamp : settings[id].timestamp
    }

    let keys = Object.keys(wsConfig.fieldIDs);

    for(let key of keys) params.fields.push(wsConfig.fieldIDs[key]);

    $.post('/plm/search', params, function(response) {

        printResponseErrorMessagesToConsole(response);

        if(stopPanelContentUpdate(response, settings[id])) return;
    
        getTimelineWeeks(response.data.row, wsConfig.fieldIDs);

        let elemContent = $('#' + id + '-content');
        let elemTable   = $('<table></table>').appendTo(elemContent).attr('id', id + '-table');
        let elemTHead   = $('<thead></thead>').appendTo(elemTable  ).attr('id', id + '-thead');
        let elemTHRow   = $('<tr></tr>      ').appendTo(elemTHead  ).attr('id', id + '-throw');
        let elemTBody   = $('<tbody></tbody>').appendTo(elemTable  ).attr('id', id + '-tbody');        

        insertYourTasksHeaders(elemTHRow);
        

        for(let row of response.data.row) {

            let task = {
                dmsId         : row.dmsId,
                link          : '/api/v3/workspaces/' + wsConfig.workspaceId + '/items/' + row.dmsId,
                root          : row.data[wsConfig.fieldIDs.root].value,
                id            : row.data[wsConfig.fieldIDs.id].value,
                title         : row.data[wsConfig.fieldIDs.title].value,
                description   : row.data[wsConfig.fieldIDs.description].value,
                start         : row.data[wsConfig.fieldIDs.start].displayValue,
                end           : row.data[wsConfig.fieldIDs.end].displayValue,
                progress      : Number(row.data[wsConfig.fieldIDs.progress].value),
                lastComment   : row.data[wsConfig.fieldIDs.lastComment].value,
                lastUpdate    : row.data[wsConfig.fieldIDs.lastUpdate].displayValue,
                actualEffort  : (typeof row.data[wsConfig.fieldIDs.actualEffort ] === 'undefined') ? 0.0 : Number(row.data[wsConfig.fieldIDs.actualEffort ].displayValue),
                plannedEffort : (typeof row.data[wsConfig.fieldIDs.plannedEffort] === 'undefined') ? 0.0 : Number(row.data[wsConfig.fieldIDs.plannedEffort].displayValue),
                startEffort   : (typeof row.data[wsConfig.fieldIDs.startEffort  ] === 'undefined') ? 0.0 : Number(row.data[wsConfig.fieldIDs.startEffort  ].displayValue),
                weeklyEffort  : (typeof row.data[wsConfig.fieldIDs.weeklyEffort ] === 'undefined') ? 0.0 : Number(row.data[wsConfig.fieldIDs.weeklyEffort ].displayValue),
                endEffort     : (typeof row.data[wsConfig.fieldIDs.endEffort    ] === 'undefined') ? 0.0 : Number(row.data[wsConfig.fieldIDs.endEffort    ].displayValue),
                tStart        : row.tStart,
                tEnd          : row.tEnd,
                wStart        : row.wStart,
                wEnd          : row.wEnd,
            };

            yourTasks.push(task);

            let elemTask = $('<tr></tr>').appendTo(elemTBody)
                .addClass('content-item')
                .addClass('hover')
                .attr('data-link', task.link)
                .attr('data-root', task.root);

            $('<td></td>').appendTo(elemTask)
                .addClass('root')
                .addClass('nowrap')
                .html(task.root);

            $('<td></td>').appendTo(elemTask)
                .addClass('id')
                .addClass('nowrap')
                .html(task.id);

            $('<td></td>').appendTo(elemTask)
                .addClass('title')
                .addClass('nowrap')
                .html(task.title);

            insertTaskSeparator(elemTask);                

            $('<td></td>').appendTo(elemTask)
                .addClass('description')
                .addClass('nowrap')
                .addClass('plain-paragraph-field')
                .html(task.description);

            insertTaskSchedule(elemTask, task);
            insertTaskSeparator(elemTask);
            insertTaskProgressControls(elemTask, task);
            insertTaskSeparator(elemTask);
            insertTaskEffortControls(elemTask);
            insertTaskSeparator(elemTask);
            insertTaskTimeline(elemTask, task);

            setTaskEvents(elemTask);
   
        }

        setTableEvents();
        updateProgressBarsOfAllTasks();
        finishPanelContentUpdate(id, [], null, response.data);
        selectWeek($('.timeline-week.week-now').first());

    });
 
}
function getTimelineWeeks(activities, fieldIDs) {

    weeks = [];

    let tMin  = new Date().getTime();
    let tMax  = new Date().getTime();

    for(let activity of activities) {

        let start = getSearchResultFieldValue(activity, fieldIDs.start, '');
        let end   = getSearchResultFieldValue(activity, fieldIDs.end  , '');

        activity.tStart = -1;
        activity.tEnd   = -1;

        if(!isBlank(start)) {
            if(!isBlank(end)) {

                activity.tStart = getDateFromString(start).getTime();
                activity.tEnd   = getDateFromString(end).getTime();

                if(activity.tStart < tMin) tMin = activity.tStart;
                if(activity.tEnd   > tMax) tMax = activity.tEnd;

            }
        }

    }

    let now   = new Date();
    let mon   = new Date(tMin);
    let day   = mon.getDay() - 1;
    let index = 0;

    mon.setDate(mon.getDate() - day - 7);

    tMax += 604800000;

    do {

        let start         = new Date(mon.getTime());
        let end           = new Date(mon.getTime());
        // let friday        = new Date(mon.getTime());
        let startSearch   = new Date(mon.getTime());
        let endSearch     = new Date(mon.getTime());
        let startOfYear   = new Date(end.getFullYear(), 0, 1);
        let dayDifference = Math.floor((end - startOfYear) / (24 * 60 * 60 * 1000));
        let week          = Math.ceil((dayDifference + startOfYear.getDay() + 1) / 7);
        let className     = 'week-future';


        end.setDate(end.getDate() + 7);
        // friday.setDate(friday.getDate() + 4);
        endSearch.setDate(endSearch.getDate() + 7);
        startSearch.setDate(startSearch.getDate() - 1);

        if(end.getTime() < now.getTime()) className = 'week-past';
        else if((start.getTime() - now.getTime()) < 100) className = 'week-now';

        weeks.push({
            index       : index++,
            start       : start.getTime(),
            end         : end.getTime(),
            year        : end.getFullYear(),
            number      : week,
            label       : start.getDate() + '.' + (start.getMonth() + 1) + '.',
            class       : className,
            startString : start.getFullYear() + '/' + (start.getMonth() + 1) + '/' + start.getDate(),
            startSearch : startSearch.getFullYear() + '/' + (startSearch.getMonth() + 1) + '/' + startSearch.getDate(),
            endSearch   : endSearch.getFullYear() + '/' + (endSearch.getMonth() + 1) + '/' + endSearch.getDate(),
            endString   : end.getFullYear() + '/' + (end.getMonth() + 1) + '/' + end.getDate(),
            moString    : mon.getFullYear() + '/' + (mon.getMonth() + 1) + '/' + mon.getDate(),
            current     : (className === 'week-now')
        })

        mon.setDate(mon.getDate() + 7);

    } while (mon.getTime() < tMax);

    for(let activity of activities) {
        activity.wStart = -1;
        activity.wEnd   = -1;
        for(let week of weeks) {
            if(activity.tStart >= week.start) {
                if(activity.tStart <= week.end) {
                    activity.wStart = week.index;
                }
            }
            if(activity.tEnd >= week.start) {
                if(activity.tEnd <= week.end) {
                    activity.wEnd = week.index;
                }
            }
        }
    }

    return weeks;

}
function insertYourTasksHeaders(elemTHRow) {

    let id  = 'your-tasks';
    
    $('<th></th>').appendTo(elemTHRow).html('Project').addClass('root');
    $('<th></th>').appendTo(elemTHRow).html('ID').addClass('id');
    $('<th></th>').appendTo(elemTHRow).html('Task').addClass('title');
    $('<th></th>').appendTo(elemTHRow).addClass('separator');    
    $('<th></th>').appendTo(elemTHRow).html('Description');
    $('<th></th>').appendTo(elemTHRow).html('Schedule');
    $('<th></th>').appendTo(elemTHRow).addClass('separator');
    $('<th></th>').appendTo(elemTHRow).html('Progress');
    $('<th></th>').appendTo(elemTHRow).html('Last Update').addClass('th-sub').addClass('last-update');
    $('<th></th>').appendTo(elemTHRow).addClass('separator');
    
    let elemTHEfforts = $('<th></th>').appendTo(elemTHRow).addClass('efforts');
    let elemTHTop     = $('<div></div>').appendTo(elemTHEfforts).addClass('th-top');
    let elemTHSub     = $('<div></div>').appendTo(elemTHEfforts).addClass('th-sub');

    $('<div></div>').appendTo(elemTHTop).html('Efforts');

    $('<div></div>').appendTo(elemTHTop)
    .addClass('button')
    .addClass('icon')
    .addClass('icon-chevron-left')
    .addClass('efforts-prev')
    .click(function() {
        switchWeek($(this));
    });

    $('<div></div>').appendTo(elemTHTop).html('').addClass('efforts-week');

    $('<div></div>').appendTo(elemTHTop)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-chevron-right')
        .addClass('efforts-next')
        .click(function() {
            switchWeek($(this));
        });

    let elemCounters = $('<div></div>').appendTo(elemTHSub).addClass('grid-counters');

    $('<div></div>').appendTo(elemCounters).attr('id', 'effort-total-actual')
    $('<div></div>').appendTo(elemCounters).html('Actual');
    $('<div></div>').appendTo(elemCounters).attr('id', 'effort-total-planned');
    $('<div></div>').appendTo(elemCounters).html('Planned');

    $('<th></th>').appendTo(elemTHRow).addClass('separator');

    for(let index in weeks) {

        let week = weeks[index];
        
        let elemWeek = $('<th></th>').appendTo(elemTHRow)
            .addClass('timeline-week')
            .addClass(week.class)
            .addClass('week-' + index)
            .attr('data-index', index)
            .click(function() {
                selectWeek($(this));
            });
        
        $('<div></div>').appendTo(elemWeek)
            .addClass('th-main')
            .html(week.number);

        $('<div></div>').appendTo(elemWeek)
            .addClass('th-sub')
            .html(week.label);

    }

}
function insertTaskSchedule(elemTask, task) {

    let elemCell = $('<td></td>').appendTo(elemTask).addClass('task-schedule');

    $('<div></div>').appendTo(elemCell).addClass('date').html(task.start);
    $('<div></div>').appendTo(elemCell).addClass('char').html('▶')
    $('<div></div>').appendTo(elemCell).addClass('date').html(task.end);

}
function insertTaskSeparator(elemTask) {

    $('<td></td>').appendTo(elemTask).addClass('separator');

}
function insertTaskProgressControls(elemTask, task) {

    let elemCell   = $('<td></td>').appendTo(elemTask).addClass('cell-progress-controls');
    let elemGrid   = $('<div></div>').appendTo(elemCell).addClass('grid-progress');
    let elemSelect = $('<select></select>').appendTo(elemGrid)
        .addClass('task-progress')
        .addClass('task-progress-input')
        .addClass('button');

    $('<option></option>').appendTo(elemSelect)
        .html('0 %')
        .attr('data-progress', 0)
        .addClass('progress-selector');

    for(let index in config.yourTasks.transitions) insertTaskProgressSelector(elemSelect, Number(index), task);

    $('<input></input>').appendTo(elemGrid)
        .addClass('task-comment')
        .addClass('comment')
        .addClass('task-progress-input')
        .addClass('button')
        .attr('placeholder', 'Enter comment')
        .val(task.lastComment);

    $('<div></div>').appendTo(elemGrid).addClass('task-progress-bar');
    $('<td></td>').appendTo(elemTask).addClass('last-update').html(task.lastUpdate);

}
function insertTaskProgressSelector(elemParent, index, task) {

    let transition   = config.yourTasks.transitions[index];
    let tranistionId = transition.link.split('/').pop();

    $('<option></option>').appendTo(elemParent)
        .html(transition.value + ' %')
        .addClass('progress-selector')
        .attr('data-progress', transition.value)
        .attr('value', transition.value)
        .attr('data-transition', tranistionId);

    if(transition.value == task.progress) elemParent.val(transition.value);

}
function insertTaskEffortControls(elemTask) {

    let elemCell = $('<td></td>'  ).appendTo(elemTask).addClass('cell-effort-controls');
    let elemGrid = $('<div></div>').appendTo(elemCell).addClass('grid-efforts');

    insertTaskEffortInput(elemGrid, 'Mo');
    insertTaskEffortInput(elemGrid, 'Tu');
    insertTaskEffortInput(elemGrid, 'We');
    insertTaskEffortInput(elemGrid, 'Th');
    insertTaskEffortInput(elemGrid, 'Fr');

    $('<input></input>').appendTo(elemGrid)
        .attr('placeholder', 'Enter Comment')
        .addClass('task-effort-control')
        .addClass('task-effort-comment')
        .addClass('comment');

    $('<div></div>').appendTo(elemGrid).addClass('planned-effort');

    let elemBar = $('<div></div>').appendTo(elemGrid).addClass('task-effort-bar');

    setLinearGradient(elemBar, '135', 0, 'green', '--color-surface-level-1');

}
function insertTaskEffortInput(elemGrid, day) {

    $('<input></input>').appendTo(elemGrid)
        .attr('placeholder', day)
        .attr('type', 'number')
        .addClass('task-effort-' + day.toLowerCase())
        .addClass('task-effort-control')
        .addClass('task-effort-input');

}
function insertTaskTimeline(elemTask, task) {
   
    if((task.wStart < 0) || (task.wEnd < 0)) {
        for(let week of weeks) {
            $('<td></td>').appendTo(elemTask)
            .addClass('timeline-week')
            .addClass('week-' + week.index)
            .addClass(week.class);
        }
    } else {

        for(let week of weeks) {

            let elemCell = $('<td></td>').addClass('timeline-week').addClass(week.class).addClass('week-' + week.index);

                 if(week.index  <  task.wStart) elemCell.appendTo(elemTask);
            else if(week.index  >  task.wEnd  ) elemCell.appendTo(elemTask);
            else if(week.index === task.wStart) {

                elemCell.appendTo(elemTask).addClass('timeline-bar').attr('colspan', (task.wEnd - task.wStart) + 1);

                // let progress      = Number(getSearchResultFieldValue(task, wsConfig.fieldIDs.progress, 0));
                // // let actualEffort  = task.data[config.fieldIDs.actualEffort];
                // let plannedEffort = task.data[config.fieldIDs.plannedEffort];

                // actualEffort  = (typeof actualEffort === 'undefined') ? 0 : actualEffort.displayValue;
                // plannedEffort = (typeof plannedEffort === 'undefined') ? 0 : plannedEffort.displayValue;
 
                // let percentage = (plannedEffort === 0) ? 0 : (actualEffort * 100 / plannedEffort);
                
                $('<div></div>').appendTo(elemCell)
                    .addClass('timeline-bar-progress')
                    .html('Progress');
                    // .css('background', 'linear-gradient(90deg, var(--color-yellow-500) 0%, var(--color-yellow-500) ' + progress + '%, var(--color-yellow-800) ' + (progress + 5) + '%, var(--color-yellow-800)  100%)');

                 $('<div></div>').appendTo(elemCell)
                    .addClass('timeline-bar-effort')
                    .html('Effort');

                // setLinearGradient(elemBarEffort, '135', percentage, 'green', '--color-green-800');

            }

        }

    }

}
function setTaskEvents(elemTask) {

    elemTask.click(function() {

        let isSelected = $(this).hasClass('selected');

        if(isSelected) {
            $(this).removeClass('selected');
        } else {
            insertItemSummary($(this).attr('data-link'), paramsTaskSummary);
            $(this).addClass('selected');
        }

        $(this).siblings().removeClass('selected');

    });


    elemTask.find('select').click(function(e) {
        e.stopPropagation();
    });


    elemTask.find('select').change(function(e) {

        updateProgressBarsOfTask($(this).closest('.content-item'));

        let elemSelect   = $(this);
            elemSelect.addClass('changed');
            elemSelect.next().focus().select();

        toggleSaveButton();

    });


    elemTask.find('input').click(function(e) {

        e.preventDefault();
        e.stopPropagation();

    });


    elemTask.find('input.comment').on('keyup', function(e) {

        $(this).addClass('changed');
        toggleSaveButton();

    });


    elemTask.find('.grid-efforts input.task-effort-input').on('keyup', function(e) {

        let elemInput   = $(this);
        let elemTask    = $(this).closest('.content-item');

        if(elemInput.val() != elemInput.attr('data-value')) {
            elemInput.addClass('changed'); 
        } else {
            elemInput.removeClass('changed');
        }
        
        toggleSaveButton();
        updateThisWeekActualEfforts();
        updateEffortBarsOfTask(elemTask);

    });

}
function setTableEvents() {

    let elemTable      = $('#your-tasks-table');
    let elemsSeparator = elemTable.find('.separator');

    elemsSeparator.hover(function() {
        let index = $(this).index();
        elemTable.find('tr').each(function() {
            $(this).children().eq(index).addClass('hover');
        });
    });

    elemsSeparator.mouseout(function() {
        let index = $(this).index();
        elemTable.find('tr').each(function() {
            $(this).children().eq(index).removeClass('hover');
        });
    });

    elemsSeparator.click(function() {

        let elemSeparator  = $(this);
        let elemColumns    = elemSeparator.prevUntil('.separator');
        let indexSeparator = $(this).index();
        let elemHeader     = elemTable.find('th').eq(indexSeparator);
        let isCollapsed    = elemHeader.hasClass('collapsed');
        let indexColumns   = [];

        elemColumns.each(function() {
            indexColumns.push($(this).index());
        });

        elemTable.find('tr').each(function() {
            let elemRow = $(this);
            elemRow.children().eq(indexSeparator).toggleClass('collapsed');
            for(let index of indexColumns) {
                let elemCell = elemRow.children().eq(index);
                if(isCollapsed) elemCell.removeClass('hidden'); else elemCell.addClass('hidden');
            }
        });


    });

}


// Commonly used utilities
function setLinearGradient(elemBar, angle, progress, color, background) {

    if(isBlank(background)) background = '--color-surface-level-2';

    if(progress >= 100) angle = '90';

    elemBar.css('background', 'linear-gradient(' + angle + 'deg, var(--color-' + color + '-600) 0%, var(--color-' + color + '-600) ' + progress + '%, var(' + background + ') ' + progress + '%, var(' + background + ') 100%)');

}
function toggleSaveButton() {

    if(($('input.changed').length > 0) || ($('select.changed').length > 0)) {
        $('#save-your-tasks-changes').removeClass('disabled').removeAttr('disabled');
    } else {
        $('#save-your-tasks-changes').addClass('disabled').attr('disabled', 'disabled');
    }

}


// Progrs KPIs
function updateProgressBarsOfAllTasks() {

    $('#your-tasks').find('.content-item').each(function() {
        updateProgressBarsOfTask($(this));
    });

}
function updateProgressBarsOfTask(elemTask) {

    let elemSelect   = elemTask.find('select.task-progress').first();
    let progress     = elemSelect.find(":selected").attr('data-progress');
    let elemBar      = elemSelect.siblings('.task-progress-bar').first();
    let elemTimeline = elemTask.find('.timeline-bar-progress').first();

    setLinearGradient(elemBar     , '135', progress, 'yellow', '--color-surface-level-1');
    // setLinearGradient(elemTimeline, '45', progress, 'yellow', '--color-yellow-900');
    setLinearGradient(elemTimeline, '60', progress, 'yellow', '--color-surface-level-2');

}



// Effort KPIs
function updateThisWeekActualEfforts() {

    let totalThisWeekActual = 0;

    $('input.task-effort-input').each(function() {

        totalThisWeekActual += ($(this).val() === '') ? 0 : Number($(this).val());

    });

    $('#effort-total-actual').html(totalThisWeekActual.toFixed(1));

}
function updateEffortBarsOfAllTasks() {

    $('#your-tasks').find('.content-item').each(function() {
        updateEffortBarsOfTask($(this));
    });

}
function updateEffortBarsOfTask(elemTask) {

    let task         = yourTasks[elemTask.index()];
    let elemBar      = elemTask.find('.task-effort-bar');
    let elemTimeline = elemTask.find('.timeline-bar-effort').first();
    let inputsTotal  = 0;
    let percentWeek  = 0;
    let percenTotal  = 0;
    let actualTotal  = 0;

    elemTask.find('.task-effort-input').each(function() {
        inputsTotal += ($(this).val() === '') ? 0 : Number($(this).val());
    });

    if(task.currentWeekPlannedEffort == 0) {
        if(inputsTotal > 0) percentWeek = 110;
    } else percentWeek = (inputsTotal * 100 / task.currentWeekPlannedEffort);

    let colorWeek = (percentWeek < 105) ? 'green' : 'red';

    actualTotal = inputsTotal + task.actualEffort - task.currentWeekActualEffort;

    if(task.plannedEffort == 0) {
        if(actualTotal > 0) percenTotal = 110;
    } else percenTotal = (actualTotal * 100 / task.plannedEffort);  
    
    let colorTotal = (percenTotal < 105) ? 'green' : 'red';

    setLinearGradient(elemBar     , '120', percentWeek, colorWeek, '--color-surface-level-1');
    // setLinearGradient(elemTimeline, '120', percenTotal, colorTotal, '--color-green-900'     );
    setLinearGradient(elemTimeline, '120', percenTotal, colorTotal, '--color-surface-level-2');

}



// Set Efforts columns upon week selection (when switching or clicking)
function switchWeek(elemClicked) {

    if(elemClicked.hasClass('disabled')) return;

    let elemSelected  = $('th.timeline-week.selected');
    let elemReference = (elemSelected.length === 0) ? $('th.timeline-week.week-now') : elemSelected;
    let elemSwitched  = elemClicked.hasClass('icon-chevron-left') ? elemReference.prev() : elemReference.next();

    selectWeek(elemSwitched);

}
function selectWeek(elemClicked) {

    $('#overlay').show();

    let elemTHWeek = $('.efforts-week');
    let index      = elemClicked.attr('data-index');
    let week       = weeks[index];
    let panelTop   = elemClicked.closest('.panel-top');
    let countPrev = elemClicked.prevAll('.timeline-week').length;
    let countNext = elemClicked.nextAll('.timeline-week').length;

    elemClicked.addClass('selected');
    elemClicked.siblings().removeClass('selected');

    elemTHWeek.html('W' + week.number + ' - ' + week.label + week.year);

    if(countPrev === 0)  $('.efforts-prev').addClass('disabled'); else $('.efforts-prev').removeClass('disabled');
    if(countNext === 0)  $('.efforts-next').addClass('disabled'); else $('.efforts-next').removeClass('disabled');

    insertTaskEffortsOfWeek(index);

}
function insertTaskEffortsOfWeek(index) {

    $('.task-effort-input').addClass('disabled');
    $('.planned-effort').html('---');

    toggleSaveButton();

    let week = weeks[index];
    let id   = 'your-tasks'

    let params = {
        wsId   : wsConfig.workspaceId,
        fields : ['DESCRIPTOR'],
        grid   : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'COMMENT', 'DATE', 'USER_ACCOUNT', 'ROW_ID'],
        filter : settings[id].filters.slice()
    }

    params.filter.push({
        comparator : 'after',
        field      : 'DATE',
        type       : 2,
        value      : week.startSearch
    });

    params.filter.push({        
        comparator : 'before',
        field      : 'DATE',
        type       : 2,
        value      : week.endSearch          
    });

    params.filter.push({        
        comparator : 15, // equals
        field      : 'USER_ACCOUNT',
        type       : 2 ,
        value      : userAccount.fullName          
    });


    $('.task-effort-control').each(function() { 
        $(this).removeClass('changed').val('');
    });    

    for(let task of yourTasks) {
        task.effortRowId              = '';
        task.currentWeekPlannedEffort = 0;
        task.currentWeekActualEffort  = 0;
    }

    $.post('/plm/search', params, function(response) {

        $('#overlay').hide();

        let plannedTotal = 0;

        $('#your-tasks').find('.content-item').each(function() {

            let elemTask = $(this);
            let task     = yourTasks[elemTask.index()];
            
            task.effortRowId = '';
            task.moString    = week.moString;

            setPlanneWeeklyEffort(elemTask, task, index);
                    
            plannedTotal += Number(task.currentWeekPlannedEffort);

            // elemTask.find('.task-effort-control').each(function() { 
            //     $(this).removeClass('changed').val('');
            // });

            for(let row of response.data.row) {
                if(row.dmsId == task.dmsId) {

                    task.effortRowId = row.data.ROW_ID.value;

                    let inputTotals = 0;

                    inputTotals += setEffortInputValue(elemTask, row, 'mo', 'MONDAY');
                    inputTotals += setEffortInputValue(elemTask, row, 'tu', 'TUESDAY');
                    inputTotals += setEffortInputValue(elemTask, row, 'we', 'WEDNESDAY');
                    inputTotals += setEffortInputValue(elemTask, row, 'th', 'THURSDAY');
                    inputTotals += setEffortInputValue(elemTask, row, 'fr', 'FRIDAY');

                    elemTask.find('input.task-effort-comment').html(getSearchResultFieldValue(row, 'COMMENT', ''));
                    task.currentWeekActualEffort = inputTotals;

                }
            }

        });

        $('#effort-total-planned').html(plannedTotal.toFixed(1));

        updateThisWeekActualEfforts();
        updateEffortBarsOfAllTasks();

    });

}
function setPlanneWeeklyEffort(elemTask, task, index) {

    let elemPlanned   = elemTask.find('.planned-effort');
    let plannedEffort = '0.0';

         if(task.wEnd   == index) plannedEffort = task.endEffort;
    else if(task.wStart == index) plannedEffort = task.startEffort;
    else if(task.wStart <  index) {
         if(task.wEnd   >  index) {
            plannedEffort = task.weeklyEffort;
        }
    }

    task.currentWeekPlannedEffort = Number(plannedEffort);

    let text = parseFloat(plannedEffort).toFixed(1);

    elemPlanned.html(text);

}
function setEffortInputValue(elemTask, row, day, fieldId) {

    let elemInput = elemTask.find('input.task-effort-' + day.toLowerCase());

    if(elemInput.length === 0) return 0;

    let value = getSearchResultFieldValue(row, fieldId, null);

    if(value !== null) {
        elemInput.val(value);
        elemInput.attr('data-value', value);
        return Number(value);
    } return 0;

}



// Save data in PLM
function saveAllChanges() {

    let requests = [];

    $('#overlay').show();

    $('#your-tasks').find('.content-item').each(function() {

        let elemTask   = $(this);
        let hasChanged = elemTask.find('.task-effort-control.changed').length > 0;
        let task       = yourTasks[$(this).index()];

        if(hasChanged) {

            let serverURL   = (isBlank(task.effortRowId)) ? '/plm/add-grid-row' : '/plm/update-grid-row';
            let params      = {
                link  : task.link,           
                rowId : task.effortRowId,    
                data  : [
                    { fieldId : 'DATE'        , type : 'date'         , value : task.moString },
                    { fieldId : 'USER_ACCOUNT', type : 'single-select', value : '/api/v3/lookups/CUSTOM_LOOKUP_ALL_USERS_VIEW/options/' + user.number },
                    { fieldId : 'COMMENT'     , type : 'string'       , value : elemTask.find('.task-effort-comment').first().val() },
                    { fieldId : 'MONDAY'      , type : 'integer'      , value : elemTask.find('.task-effort-mo').first().val() },
                    { fieldId : 'TUESDAY'     , type : 'integer'      , value : elemTask.find('.task-effort-tu').first().val() },
                    { fieldId : 'WEDNESDAY'   , type : 'integer'      , value : elemTask.find('.task-effort-we').first().val() },
                    { fieldId : 'THURSDAY'    , type : 'integer'      , value : elemTask.find('.task-effort-th').first().val() },
                    { fieldId : 'FRIDAY'      , type : 'integer'      , value : elemTask.find('.task-effort-fr').first().val() }
                ] 
            }

            requests.push($.post(serverURL, params));
        }

    });

    Promise.all(requests).then(function(responses) {

        $('.task-effort-control').removeClass('changed');

        printResponsesErrorMessagesToConsole(responses);
        updateEffortRollups(responses);

    });


}
function updateEffortRollups(responses) {

    let requests = [];

    for(let response of responses) {

        let link = response.params.link;

        if(response.url === '/add-grid-row') {
            for(let task of yourTasks) {
                if(task.link === link) {
                    task.effortRowId = response.data.split('/').pop();
                    break;
                }
            }
        }

        requests.push($.post('/plm/run-item-script', { link : link, scriptId : wsConfig.scriptId }))

    }

    Promise.all(requests).then(function(responses) {
        printResponsesErrorMessagesToConsole(responses);
        saveProgressUpdates()
    });

}
function saveProgressUpdates() {

    let requests = [];

    $('#your-tasks').find('.content-item').each(function() {

        let elemTask   = $(this);
        let elemGrid   = elemTask.find('.grid-progress');
        let hasChanged = elemGrid.find('.changed').length > 0;
        let task       = yourTasks[elemTask.index()];

        if(hasChanged) {

            let elemSelect   = elemGrid.find('select');
            let elemComment  = elemGrid.find('input');
            let transitionId = elemSelect.find(":selected").attr('data-transition');

            let params = {
                link       : task.link,
                transition : task.link.split('/items/')[0] + '/workflows/1/transitions/' + transitionId,
                comment    : elemComment.val(),
                index      : elemTask.index()
            }

            requests.push($.post('/plm/transition', params));

        }

    });

    Promise.all(requests).then(function(responses) {
        
        printResponsesErrorMessagesToConsole(responses);

        console.log(responses);

        for(let response of responses) {

            let index    = Number(response.params.index);
            let task     =  yourTasks[index];
            let elemTask = $('#your-tasks').find('.content-item').eq(index);

            elemTask.find('.task-progress-input').each(function() { $(this).removeClass('changed'); });
            
            task.lastUpdate = new Date().toLocaleDateString();

            let elemLastUpdate = elemTask.find('.cell-last-update').first();
                elemLastUpdate = new Date().toLocaleDateString();

        }

        $('#overlay').hide();

    });

}