let wsConfig    = {}
let weeks       = [];
let activities  = [];
let groups      = [];
let resources   = [];
let plans       = [];
let weeksCount  = 10;
let permissions = {};

let paramsDetailsActivity = {
    expandSections : ['Header'],
    headerLabel    : 'descriptor',
    contentSize    : 's',
    bookmark       : true,
    openInPLM      : true,
    toggles        : true,
    useCache       : true
}

let paramsDetailsResource = {
    headerLabel    : 'descriptor',
    toggles        : true,
    useCache       : true
}

let paramsItemSummaryPlan = {

    id        : 'details',
    reload    : true,
    openInPLM : true,
    hideCloseButton : true,
    contents  : [
        {type : 'grid'   , params : { hideHeader : true, editable : false } },
        {type : 'details', params : { hideHeader : true,  } }
    ]

}

let paramsItemSummaryAssignment = {
    id              : 'details',
    reload          : true,
    openInPLM       : true,
    hideCloseButton : true,
    contents  : [
        {type : 'grid'       , params : { hideHeader : true, editable : true, hideButtonLabels : true } },
        {type : 'details'    , params : { hideHeader : true, } },
        {type : 'attachments', params : { hideHeader : true, editable : true} }
    ]
}


$(document).ready(function() {

    appendOverlay(true);
    appendProcessing('activities', false);
    appendProcessing('resources', false);
    setUIEvents();
    insertMenu();
    setHeaders();

    let requests = [
        $.get('/plm/permissions' , { wsId : config.projects.workspaceId   }),
        $.get('/plm/permissions' , { wsId : config.plans.workspaceId      }),
        $.get('/plm/sections'    , { wsId : config.activities.workspaceId })
    ];

    getFeatureSettings('resources', requests, function(responses) {

        permissions.projects = responses[0].data;
        permissions.plans    = responses[1].data;
        wsConfig.activities  = { sections : responses[2].data }

        if(hasPermission, permissions.projects, 'add_items') $('#button-create-project').removeClass('hidden');
        if(hasPermission, permissions.plans   , 'add_items') $('#button-create-plan'   ).removeClass('hidden');

        setWeeks();
        insertWeekColumns($('#activities-header'));
        insertWeekColumns($('#resources-header'));
        getInitialData();
        
    });

});

function setUIEvents() { 

    // Global Toolbar Buttons
    $('#select-group').on('change', function() {
        applyFilter('activities-filter', 'activities', true);
        applyFilter('resources-filter' , 'resources', false);
    });
    $('#toggle-review-assignments').click(function() {
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
        $('body').toggleClass('mode-allocate').toggleClass('mode-review');
    });
    $('#button-create-project').click(function() {
        insertCreate([], [config.projects.workspaceId], { 
            id            : 'create-project',  
            headerLabel   : config.projects.labelCreateButton,
            sectionsIn    : config.projects.sectionsIn,
            showInDialog  : true,
            afterCreation : function(id, link, data) { console.log(data); }
        });
    });
    $('#button-create-plan').click(function() {
        insertCreate([], [config.plans.workspaceId], { 
            id            : 'create-plan',  
            headerLabel   : 'Create Resource Plan',
            sectionsEx    : ['KPIs'],
            showInDialog  : true,
            getDetails    : true,
            afterCreation : function(id, link, data) { console.log(data); }
        });
    });
    $('#toggle-details').click(function() {
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
        $('body').toggleClass('no-details');
    });
    $('#toggle-compact').click(function() {
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
        $('body').toggleClass('compact-on');
    });


    // Toggles for activities and resources
    $('#activities-deselect-all').click(function() {
        $(this).addClass('hidden');
        $('.activity').removeClass('selected');
        $('.activity-selection').removeClass('icon-check-box-checked').addClass('icon-check-box');
        $('#resources').children().removeClass('hidden');
        updateAllocation();
    })
    $('#activities-maximize').click(function() {
        $('body').toggleClass('activities-maximized');
    });  
    $('#activities-filter').keyup(function() {
        applyFilter('activities-filter', 'activities', true);
    });
    $('#activities-collapse').click(function() {
        $('.activities-group-toggle').removeClass('icon-collapse').addClass('icon-expand');
        $('#activities .parent').addClass('hidden');
        $('.activity').addClass('hidden');
    });    
    $('#activities-expand').click(function() {
        $('.activities-group-toggle').addClass('icon-collapse').removeClass('icon-expand');
        $('.activity').removeClass('hidden');
        applyFilter('activities-filter', 'activities');
    });

    $('#resources-maximize').click(function() {
        $('body').toggleClass('resources-maximized');
    });    
    $('#resources-filter').keyup(function() {
        applyFilter('resources-filter' , 'resources', false);
    });    
    $('#resources-collapse').click(function() {
        $('.resources-group-toggle').removeClass('icon-collapse').addClass('icon-expand');
        $('#resources .parent').addClass('hidden');
        $('.resource').addClass('hidden');
    });    
    $('#resources-expand').click(function() {
        $('.resources-group-toggle').addClass('icon-collapse').removeClass('icon-expand');
        $('.resource').removeClass('hidden');
        applyFilter('resources-filter' , 'resources');
    });

    
}


// Application Startup & Data Retrieval
function setHeaders() {

    // $('#header-subtitle').html(config.subtitle);
    $('#activities-header-title').html(config.headers.activities);
    $('#resources-header-title').html(config.headers.resources);  

}
function setWeeks() {

    weeksCount = config.weeks.past + config.weeks.future + 1;

    let now = new Date();
    let mon = new Date();
    let day = mon.getDay() - 1;

    now.setDate(now.getDate() - day);
    mon.setDate(mon.getDate() - (7 * config.weeks.past) - day);

    mon = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate());

    for(let index = 0; index < weeksCount; index++) {

        let start         = new Date(mon.getTime());
        let end           = new Date(mon.getTime());
        let startOfYear   = new Date(end.getFullYear(), 0, 1);
        let dayDifference = Math.floor((end - startOfYear) / (24 * 60 * 60 * 1000));
        let week          = Math.ceil((dayDifference + startOfYear.getDay() + 1) / 7);
        let className     = 'week-future';

        end.setDate(end.getDate() + 7);

        if(end.getTime() < now.getTime()) className = 'week-past';
        else if((start.getTime() - now.getTime()) < 100) className = 'week-now';

        weeks.push({
            start       : start.getTime(),
            end         : end.getTime(),
            year        : end.getFullYear(),
            number      : week,
            label       : start.getDate() + '.' + (start.getMonth() + 1) + '.',
            class       : className,
            startString : start.getFullYear() + '-' + (start.getMonth() + 1) + '-' + start.getDate(),
            endString   : end.getFullYear() + '-' + (end.getMonth() + 1) + '-' + end.getDate()
        })

        mon.setDate(mon.getDate() + 7);

    }

}
function insertWeekColumns(elemParent) {
    
    for(let week of weeks) {

        let elemColumn = $('<div></div>').appendTo(elemParent)
            .addClass('column')
            .addClass('week')
            .addClass(week.class);

        $('<div></div>').appendTo(elemColumn)
            .addClass('week-number')
            .html(week.number);

        $('<div></div>').appendTo(elemColumn)
            .addClass('week-label')
            .html(week.label);

    }

}
function getInitialData() {

    let paramsSearchResources = { wsId : config.resources.workspaceId, fields : [
        config.resources.fieldIDs.account,
        config.resources.fieldIDs.title,
        config.resources.fieldIDs.group,
        config.resources.fieldIDs.capacity,
    ]};

    let paramsSearchGroups = { wsId : config.groups.workspaceId, fields : [
        config.groups.fieldIDs.title
    ]};

    let paramsSearchPlans = { wsId : config.plans.workspaceId, fields : [
        config.plans.fieldIDs.group,
        config.plans.fieldIDs.week,
        config.plans.fieldIDs.start,
        config.plans.fieldIDs.end
    ], grid : [
        config.plans.grid.resource,
        config.plans.grid.capacity
    ],
    filter : [{
        comparator : 18, // after
        field      : config.plans.fieldIDs.end,
        type       : 0,
        value      : weeks[0].startString          
    },{
        comparator : 19, // before
        field      : config.plans.fieldIDs.start,
        type       : 0,
        value      : weeks[weeks.length -1].endString    
    },{
        comparator : 21, // not blank
        field      : config.plans.grid.resource,
        type       : 2,
        value      : ''
    }]};

    let paramsSearchActivities = { wsId : config.activities.workspaceId, fields : [
        config.activities.fieldIDs.title,
        config.activities.fieldIDs.start,
        config.activities.fieldIDs.end,
        config.activities.fieldIDs.type,
        config.activities.fieldIDs.root,
        config.activities.fieldIDs.parent,
        config.activities.fieldIDs.group,
        config.activities.fieldIDs.resource,
        config.activities.fieldIDs.effortWS,
        config.activities.fieldIDs.effortWA,
        config.activities.fieldIDs.effortWE,
        config.activities.fieldIDs.progress,
        config.activities.fieldIDs.status
    ], filter : [{
        comparator : 18, // after
        field      : config.activities.fieldIDs.end,
        type       : 0 ,
        value      : weeks[0].startString          
    },{
        comparator : 19, // before
        field      : config.activities.fieldIDs.start,
        type       : 0 ,
        value      : weeks[weeks.length -1].endString       
    }]};

    if(!isBlank(config.activities.hideActivitiesInStates)) {
        for(let status of config.activities.hideActivitiesInStates) {
            paramsSearchActivities.filter.push({
                comparator :  5,
                field      : 'WF_CURRENT_STATE',
                type       : 1 ,
                value      : status
            });
        }
    }

    let requests = [
        $.post( '/plm/search', paramsSearchResources  ),
        $.post( '/plm/search', paramsSearchGroups      ),
        $.post( '/plm/search', paramsSearchPlans      ),
        $.post( '/plm/search', paramsSearchActivities ),
        $.get ( '/plm/picklist' , { link : '/api/v3/lookups/CUSTOM_LOOKUP_ALL_USERS_VIEW', useCache : true } )
    ]    

    Promise.all(requests).then(function(responses) {

        let linksPlans = [];
        let listGroups = [];

        for(let row of responses[0].data.row) {

            let title  = getSearchResultFieldValue(row, config.resources.fieldIDs.title, '');
            let group  = getSearchResultFieldValue(row, config.resources.fieldIDs.group, '');
            let userLink   = '';

            for(let user of responses[4].data.items) {
                if(title === user.title) {
                    userLink = user.link
                }
            }

            resources.push({
                link     : '/api/v3/workspaces/' + config.resources.workspaceId + '/items/' + row.dmsId,
                user     : userLink,
                title    : title,
                class    : getClassName('resource', title),
                group    : group,
                capacity : getSearchResultFieldValue(row, config.resources.fieldIDs.capacity, 0),
            });

            if(!listGroups.includes(group)) listGroups.push(group);

        }        

        for(let row of responses[1].data.row) {

            let title = getSearchResultFieldValue(row, config.groups.fieldIDs.title, '');

            if(listGroups.includes(title)) {           
                groups.push({
                    link  : '/api/v3/workspaces/' + config.groups.workspaceId + '/items/' + row.dmsId,
                    title : title,
                    class : getClassName('group', title)
                });
            }

        }

        for(let row of responses[2].data.row) {

            let link  = '/api/v3/workspaces/' + config.plans.workspaceId + '/items/' + row.dmsId;
            let index = linksPlans.indexOf(link);
            let plan  = (index < 0) ? {} : plans[index];

            if(index < 0) {

                linksPlans.push(link);

                plan.link      = link;
                plan.group     = getSearchResultFieldValue(row, config.plans.fieldIDs.group, '');
                plan.start     = getSearchResultFieldValue(row, config.plans.fieldIDs.start, '');
                plan.end       = getSearchResultFieldValue(row, config.plans.fieldIDs.end  , '');
                plan.week      = Number(getSearchResultFieldValue(row, config.plans.fieldIDs.week, 0));
                plan.year      = Number(plan.end.split('-')[0])
                plan.resources = [];

                plans.push(plan);

            }

            plan.resources.push({
                title    : getSearchResultFieldValue(row, config.plans.grid.resource  , ''),
                capacity : Number(getSearchResultFieldValue(row, config.plans.grid.capacity  , 0)),
            });
            
        }

        for(let row of responses[3].data.row) {

            activities.push({
                link     : '/api/v3/workspaces/' + config.activities.workspaceId + '/items/' + row.dmsId,
                title    : getSearchResultFieldValue(row, config.activities.fieldIDs.title, ''),
                start    : getDateDetails(getSearchResultFieldValue(row, config.activities.fieldIDs.start, '')),
                end      : getDateDetails(getSearchResultFieldValue(row, config.activities.fieldIDs.end  , '')),
                type     : getSearchResultFieldValue(row, config.activities.fieldIDs.type, ''),
                root     : getSearchResultFieldValue(row, config.activities.fieldIDs.root, ''),
                parent   : getSearchResultFieldValue(row, config.activities.fieldIDs.parent, ''),
                group    : getSearchResultFieldValue(row, config.activities.fieldIDs.group, ''),
                resource : getSearchResultFieldValue(row, config.activities.fieldIDs.resource, ''),
                effortWS : Number(getSearchResultFieldValue(row, config.activities.fieldIDs.effortWS, '')),
                effortWA : Number(getSearchResultFieldValue(row, config.activities.fieldIDs.effortWA, '')),
                effortWE : Number(getSearchResultFieldValue(row, config.activities.fieldIDs.effortWE, '')),
                progress : Number(getSearchResultFieldValue(row, config.activities.fieldIDs.progress, 0)),
                status   : getSearchResultFieldValue(row, config.activities.fieldIDs.status, ''),
            });

        }        

        $('#activities-processing').remove();
        $('#resources-processing').remove();

        sortArray(activities, 'parent');
        sortArray(groups, 'title');
        sortArray(resources, 'title');    
        
        for(let group of groups) {
            $('<option></option>').appendTo($('#select-group')).attr('value', group.title).html(group.title);
        }
        
        insertResources();
        insertActivities();
        updateAllocation();
        updateAssignments();
        setActivitiesEvents();
        setResourcesEvents();

    });

}
function getDateDetails(value) {

    let split = value.split(' ')[0].split('-');
    let month = Number(split[1]) - 1;
    let date  = new Date(split[0], month, split[2]);

    return {
        year  : Number(split[0]),
        month : Number(split[1]),
        day   : Number(split[2]),
        time  : date.getTime()
    };

}
function getClassName(prefix, title) {

    title = title.toLowerCase();
    title = title.trim();
    title = title.replace(/ /g, '-');
    title = title.replace(/,/g, '');
    title = prefix + '-' + title;

    return title;

}


// Insertion of Resources and Activities
function insertResources() {

    for(let group of groups) {

        insertGroup(group);

        for(let resource of resources) {
            if(resource.group === group.title) insertGroupResource(group, resource);
        }

    }

}
function insertGroup(group) {

    let elemRow = $('<div></div>').appendTo($('#resources'))
        .addClass('row')
        .addClass('node')
        .addClass('root')
        .addClass(getClassName('group', group.class))
        .addClass('resources-group');

    let elemResourcesGroup = $('<div></div>').appendTo(elemRow)
        .addClass('fixed-width')
        .addClass('group-header');

    $('<div></div>').appendTo(elemResourcesGroup)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-collapse')
        .addClass('row-toggle')
        .addClass('resources-group-toggle')
        .click(function(e) {
            toggleRows(e, $(this), '.root');
        });

    $('<div></div>').appendTo(elemResourcesGroup)
        .addClass('group-title')
        .html(group.title);

    for(let week of weeks) {
    
        let elemCell = $('<div></div>').appendTo(elemRow)
            .addClass('column')
            .addClass('allocation')
            .addClass('group')
            .addClass(week.class);

        for(let plan of plans) {

            if(plan.group === group.title) {
                if(plan.week == week.number) {
                    elemCell.attr('data-link', plan.link)
                        .addClass('icon')
                        .addClass('icon-list')
                        .addClass('with-link')
                        .click(function() {
                            openResourcePlan($(this));
                        });
                }
            }

        }

    }

    return elemRow;

}
function insertGroupResource(group, resource) {

    let elemRow  = $('<div></div>').appendTo($('#resources'))
        .addClass('row')
        .addClass('node')
        .addClass('parent')
        .addClass('resource')  
        .addClass(group.class)
        .addClass(resource.class)
        .attr('data-link', resource.link)
        .attr('data-link-user', resource.user)
        .attr('data-resource', resource.title)
        .attr('data-group', group.title);

    resource.index = elemRow.index();
      
    let elemResource = $('<div></div>').appendTo(elemRow).addClass('fixed-width');
    let weekIndex    = 0;

    $('<div></div>').appendTo(elemResource)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-collapse')
        .addClass('row-toggle')
        .click(function(e) {
            toggleRows(e, $(this), '.node');
        });

    $('<div></div>').appendTo(elemResource)
        .addClass('resource-icon')
        .addClass('icon')
        .addClass('icon-user')
        .addClass('filled');

    $('<div></div>').appendTo(elemResource)
        .addClass('resource-title')
        .html(resource.title);

    let elemActions = $('<div></div>').appendTo(elemResource)
        .addClass('resource-actions');

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('resource-action-assign')
        .html('Assign');

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('resource-action-unassign')
        .html('Unassign');
        
    for(let week of weeks) {
        
        let capacity = getCapacity(resource, week);

        $('<div></div>').appendTo(elemRow)
            .addClass('column')
            .addClass('allocation')
            .addClass('cell')
            .addClass(week.class)
            .attr('data-week', weekIndex++)
            .attr('data-capacity', capacity);
            // .addClass('week-' + weekIndex++);
            

        // elemAllocation.css('background', 'linear-gradient(to top, var(--color-status-yellow) 0%, var(--color-status-yellow) ' + plan.percent + '%, var(--color-surface-level-1) ' + plan.percent + '%)');
        // elemAllocation.css('background', 'linear-gradient(to top, var(--color-blue-700) 0%, var(--color-blue-500) ' + plan.percent + '%, var(--color-surface-level-1) ' + plan.percent + '%)');

        // if(plan.dmsId !== '') {
        //     if(plan.availability < 0) elemAllocation.addClass('exceeded');
        //     else elemAllocation.css('background', 'linear-gradient(to top, var(--color-blue-700) 0%, var(--color-blue-600) ' + plan.percent + '%, var(--color-surface-level-1) ' + plan.percent + '%)');
        //     elemAllocation.html(plan.availability + '/' + plan.capacity)
        //     .addClass('with-link')
        //     .attr('data-availability', plan.availability)
        //     .attr('data-capacity', plan.capacity)
        //     .attr('data-percent', plan.percent)
        //     .attr('data-link', '/api/v3/workspaces/' + config.plans.workspaceId + '/items/' + plan.dmsId);
        //     // elemAllocation.click(function() {
        //     //     openItemByLink($(this).attr('data-link'));
        //     // });
        // } else {
        //     elemAllocation.html('--/--');
        // }

    }


}
function getCapacity(resource, week) {

    for(let plan of plans) {
        if(plan.year === week.year) {
            if(plan.week === week.number) {
                for(let planResource of plan.resources) {
                    if(resource.title === planResource.title) return planResource.capacity;
                }
            }
        }
    }

    return Number(resource.capacity);

}
function insertActivities() {

    let rootName   = '';
    let parentName = '';

    for(let activity of activities) {

        rootName   = insertActivityRoot(rootName, activity);
        parentName = insertActivityParent(parentName, activity);

        let elemRow  = $('<div></div>').appendTo($('#activities'))
            .addClass('row')
            .addClass('activity')
            .addClass(getClassName('group', activity.group))
            .addClass(getClassName('resource', activity.resource))
            .attr('data-effort-start', activity.effortWS)
            .attr('data-effort-all', activity.effortWA)
            .attr('data-effort-end', activity.effortWE)
            .attr('data-group', activity.group)
            .attr('data-resource', activity.resource)
            .attr('data-progress', activity.progress)
            .attr('data-link', activity.link);

        // let elemGroup = elemRow.prevAll('.activities-group').first();
        
        let elemActivity = $('<div></div>').appendTo(elemRow)
            .addClass('fixed-width')
            .addClass('check');

        $('<div></div>').appendTo(elemActivity)
            .addClass('activity-selection')
            .addClass('icon')
            .addClass('icon-check-box');

        $('<div></div>').appendTo(elemActivity)
            .addClass('activity-title')
            .html(activity.title);

        $('<div></div>').appendTo(elemActivity)
            .addClass('activity-status')
            .addClass('nowrap')
            .html(activity.status);
        
        let elemStart = $('<div></div>').appendTo(elemActivity).addClass('activity-start');
        $('<div></div>').appendTo(elemActivity).addClass('icon').addClass('activity-range');
        let elemEnd   = $('<div></div>').appendTo(elemActivity).addClass('activity-end'  );

        insertActivityDate(elemStart, activity.start);
        insertActivityDate(elemEnd  , activity.end);
    
        $('<div></div>').appendTo(elemActivity)
            .addClass('activity-group')
            .addClass('nowrap')
            .html(activity.group);

        $('<div></div>').appendTo(elemActivity)
            .addClass('activity-resource')
            .addClass('nowrap')
            .html(activity.resource);

        if(isBlank(activity.resource)) elemRow.addClass('alert'); else elemRow.addClass('check');

        activity.start.weekIndex = -1;
        activity.end.weekIndex   = -1;
        activity.duration        = 0;

        insertActivityTimeline(activity, elemRow);

    }

}
function insertActivityRoot(rootName, activity) {

    if(rootName === activity.root) return rootName;

    let elemRoot = $('<div></div>').appendTo($('#activities'))
        .addClass('row')
        .addClass('node')
        .addClass('root');

    let elemHeader = $('<div></div>').appendTo(elemRoot)
        .addClass('fixed-width')
        .addClass('activities-parent-header')
        .click(function(e) {
            toggleRows(e, $(this), '.root');
        });

    $('<div></div>').appendTo(elemHeader)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-collapse')
        .addClass('row-toggle')
        .addClass('activities-group-toggle')
        .click(function(e) {
            toggleRows(e, $(this), '.root');
        });

    $('<div></div>').appendTo(elemHeader)
        .addClass('activities-parent-title')
        .html(activity.root);
        

    for(let week of weeks) {

        $('<div></div>').appendTo(elemRoot)
            .addClass('column')
            .addClass('timeline');

    }

    return activity.root;

}
function insertActivityParent(parentName, activity) {

    if(parentName === activity.parent) return parentName;

    let elemParent = $('<div></div>').appendTo($('#activities'))
        .addClass('row')
        .addClass('node')
        .addClass('parent');

    let elemParentHeader = $('<div></div>').appendTo(elemParent)
        .addClass('fixed-width')
        .addClass('activities-parent-header')
        .click(function(e) {
            toggleRows(e, $(this), '.node');
        });

    $('<div></div>').appendTo(elemParentHeader)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-collapse')
        .addClass('row-toggle')
        .addClass('activities-group-toggle')
        .click(function(e) {
            toggleRows(e, $(this), '.node');
        });

    let elemParentColumns = $('<div></div>').appendTo(elemParentHeader)
        .addClass('activities-parent-columns');

    $('<div></div>').appendTo(elemParentColumns)
        .addClass('activities-parent-title')
        .html(activity.parent);

    $('<div></div>').appendTo(elemParentColumns)
        .addClass('activity-group')
        .html(config.activities.labels.group);

    $('<div></div>').appendTo(elemParentColumns)
        .addClass('activity-resource')
        .html(config.activities.labels.resource);

    for(let week of weeks) {

        $('<div></div>').appendTo(elemParent)
            .addClass('column')
            .addClass('timeline');

    }

    return activity.parent;

}
function insertActivityDate(elemDate, date) {

    $('<input></input>').appendTo(elemDate)
        .attr('type', 'date')
        .addClass('activity-date-input')
        .val(date.year + '-' + String(date.month).padStart(2, '0') + '-' + String(date.day).padStart(2, '0'));
        
    elemDate.addClass('activity-date');

    return;


    $('<div></div>').appendTo(elemDate).addClass('date-day').html(date.day);
    $('<div></div>').appendTo(elemDate).addClass('date-dot').html('.');
    $('<div></div>').appendTo(elemDate).addClass('date-month').html(date.month);
    $('<div></div>').appendTo(elemDate).addClass('date-dot').html('.');
    $('<div></div>').appendTo(elemDate).addClass('date-year').html(date.year);

}
function insertActivityTimeline(activity, elemRow) {

    let weekIndex  = 0;
    let isActivity = elemRow.hasClass('activity');
    let elemParent = elemRow.prevAll('.parent').first();
    let elemRoot   = elemRow.prevAll('.root').first();

    for(let week of weeks) {

        let comparison = compareActivityTimeline(activity, week);
        let blankCell  = (comparison === 'before') || (comparison === 'after');

        if(weekIndex === (weeks.length - 1)) {
            if(comparison === 'in') comparison = 'endsIn';
        }

        if(!blankCell) {
            if(activity.start.weekIndex < 0) {
                activity.start.weekIndex = weekIndex;
            }
            if(comparison !== 'in') {
                if(comparison !== 'startsIn') {
                    if(activity.end.weekIndex < 0) {
                        activity.end.weekIndex = weekIndex;
                        activity.duration      = (weekIndex - activity.start.weekIndex + 1);

}
                        let effort = '';
                        // let color = (activity.resource === '') ? 'red' : 'green';
                        
                        let elemTimelineBar = $('<div></div>').appendTo(elemRow)
                            .addClass('bar')
                            .addClass('timeline')
                            .css('flex', activity.duration + ' 1 0px')
                            .attr('data-week-start', activity.start.weekIndex)
                            .attr('data-week-end', activity.end.weekIndex)
                            .attr('data-class-start', 'week-' + activity.start.weekIndex)
                            .attr('data-class-end', 'week-' + activity.end.weekIndex)
                            .attr('draggable', 'true')
                            .attr('ondragstart', 'dragStartHandler(event)')
                            .attr('ondragend', 'dragEndHandler(event)');

                            elemRow.attr('data-week-start', activity.start.weekIndex);
                            elemRow.attr('data-week-end', activity.end.weekIndex);

                        updateTimelineBarColor(elemTimelineBar);

                        // if(activity.progress == 0) {
                        //     elemTimelineBar.css('background', 'var(--color-' + color + '-700)');
                        // } else if(activity.progress >= 100) {
                        //     elemTimelineBar.css('background', 'var(--color-green-900)');
                        // } else {
                        //     // elemTimelineBar.css('background', 'linear-gradient(45deg, var(--color-yellow-900) 0%, var(--color-yellow-900) ' + activity.progress + '%, var(--color-yellow-700) ' + (activity.progress + 10) + '%, var(--color-yellow-700) 100%)');
                        //     // elemTimelineBar.css('background', 'linear-gradient(45deg, var(--color-yellow-900) 0%, var(--color-yellow-900) ' + activity.progress + '%, var(--color-yellow-700) ' + (activity.progress + 10) + '%, var(--color-yellow-700) 100%)');
                        //     elemTimelineBar.css('background', 'linear-gradient(45deg, var(--color-' + color + '-900) 0%, var(--color-' + color + '-900) ' + activity.progress + '%, var(--color-' + color + '-700) ' + (activity.progress + 10) + '%, var(--color-' + color + '-700) 100%)');
                        // }
                        // elemTimelineBar.css('background', 'linear-gradient(90deg, var(--color-blue-900) 0%, var(--color-blue-900) ' + activity.progress + '%, var(--color-blue-700) ' + activity.progress + '%, var(--color-blue-700) 100%)');
                        // elemTimelineBar.css('background', 'linear-gradient(90deg, var(--color-blue-900) 0%, var(--color-blue-900) ' + activity.progress + '%, var(--color-blue-800) ' + (activity.progress + 10) + '%, var(--color-blue-800) 100%)');

                        if(!isBlank(activity.effortWA)) effort = Math.round(activity.effortWA * 10) / 10;

                        $('<div></div>').appendTo(elemTimelineBar)
                            .addClass('timeline-week-start')
                            .html(activity.effortWS);

                        $('<input></input>').appendTo(elemTimelineBar).val(effort).on('change', function() {
                            updateActivityEfforts($(this));
                        });

                        $('<div></div>').appendTo(elemTimelineBar)
                            .addClass('timeline-week-end')
                            .html(activity.effortWE);

                        let span = activity.end.weekIndex - activity.start.weekIndex

                             if(span === 0) elemTimelineBar.addClass('one-week');
                        else if(span === 1) elemTimelineBar.addClass('two-weeks');
                                       else elemTimelineBar.addClass('multiple-weeks');

                }
            }

            // let elemGroupColumn = elemGroup.find('.column').eq(weekIndex);
            //     elemGroupColumn.addClass('in-use');

        } else {
            $('<div></div>').appendTo(elemRow)
                .addClass('column')
                .addClass('cell')
                .addClass('timeline')
                .addClass(week.class)
                .addClass('blank');
        }

        if(isActivity) {
            if(elemParent.length > 0) {
                let elemParentColumn = elemParent.find('.column').eq(weekIndex);
                let elemRootColumn = elemRoot.find('.column').eq(weekIndex);
                if(!blankCell) {
elemRootColumn.addClass('with-activity');
elemParentColumn.addClass('with-activity');
                } 
            }
        }

        weekIndex++;
        
    }

}
function updateTimelineBarColor(elemTimelineBar) {

    if(elemTimelineBar.length == 0) return;
    
    let elemActivity = elemTimelineBar.closest('.row');
    let progress     = Number(elemActivity.attr('data-progress'));
    let resource     = elemActivity.attr('data-resource');
    let color        = (isBlank(resource)) ? 'red' : 'green';
    let background   = '';

    if(progress == 0) {
        background = 'var(--color-status-' + color + ')';      
    } else if(progress >= 100) {
        background = 'var(--color-green-900)';
    } else {
        background = 'linear-gradient(60deg, var(--color-' + color + '-800) 0%, var(--color-' + color + '-800) ' + progress + '%, var(--color-status-' + color + ') ' + (progress + 10) + '%, var(--color-status-' + color + ') 100%)';
    }

    elemTimelineBar.css('background', background);

}
function compareActivityTimeline(activity, week) {

    if(activity.end.time   < week.start) return 'before'  ;
    if(activity.start.time > week.end  ) return 'after'   ;
    if(activity.end.time   < week.end  ) return 'endsIn'  ;
    if(activity.start.time > week.start) return 'startsIn';

    return 'in';

}
function openResourcePlan(elemClicked) {

    showSidePanel();

    let link = elemClicked.attr('data-link');

    if(isBlank(link)) return;

    insertItemSummary(link, paramsItemSummaryPlan);

}
function showSidePanel() {

    $('#toggle-details').addClass('toggle-on').removeClass('toggle-off');
    $('body').removeClass('no-details');

}
function updateActivityEfforts(elemInput) {

    $('#overlay').show();

    let elemActivity = elemInput.closest('.activity');
    let paramsEdit   = { 
        link        : elemActivity.attr('data-link'), 
        sections    : wsConfig.activities.sections,
        getDetails  : true,
        fields      : [
            { fieldId : config.activities.fieldIDs.totalEffort,  value : null            } ,
            { fieldId : config.activities.fieldIDs.weeklyEffort, value : elemInput.val() }
        ],
    }   

    $.post('/plm/edit', paramsEdit, function(response) {
        $('#overlay').hide();
    });

}


// Update resource availability based on activity assignment
function updateAllocation() {

    let selection = [];

    $('.activity.selected').each(function() { selection.push($(this).attr('data-link')); });
    $('*').removeClass('exceeded');

    for(let resource of resources) {

        let elemResource;
        let indexWeek    = 0;
        let assignments  = [];
        let requested    = [];

        $('#resources').children('.resource').each(function() {
            if($(this).attr('data-resource') === resource.title) elemResource = $(this);
        });

        for(let activity of activities) {

            if(activity.resource === resource.title) {

                assignments.push({
                    link     : activity.link,
                    title    : activity.title,
                    status   : activity.status,
                    parent   : activity.parent,
                    start    : activity.start,
                    end      : activity.end,
                    duration : activity.duration,
                    progress : activity.progress,
                    effortWS : Number(activity.effortWS),
                    effortWA : Number(activity.effortWA),
                    effortWE : Number(activity.effortWE),
                    sort1    : activity.parent, 
                    sort2    : activity.end.weekIndex, 
                    sort3    : activity.start.weekIndex
                });

            } else if(selection.includes(activity.link)) {

                requested.push({
                    link     : activity.link,
                    title    : activity.title,
                    start    : activity.start.weekIndex,
                    end      : activity.end.weekIndex,
                    effortWS : Number(activity.effortWS),
                    effortWA : Number(activity.effortWA),
                    effortWE : Number(activity.effortWE),
                });

            }

        }

        for(let week of weeks) {

            let elemAllocation = elemResource.find('.allocation').eq(indexWeek);
            let capacity       = elemAllocation.attr('data-capacity');
            let colorIndex     = (week.class === 'week-now') ? '800' : '700';
            let values         = getAllocation(assignments, requested, selection, capacity, indexWeek);
            let percentages    = {}
            
            if(values.available > 0) {
                
                elemAllocation.html(values.available)

                percentages.assigned = (values.assigned * 100 / capacity);
                percentages.available = (values.available * 100 / capacity);
                percentages.requested  = percentages.assigned + (values.requested * 100 / capacity);
                percentages.allocated = percentages.requested + (values.allocated * 100 / capacity);

                // percentages.allocated = (values.allocated * 100 / capacity);
                // percentages.available = (values.available * 100 / capacity);
                // percentages.assigned  = percentages.available + (values.assigned * 100 / capacity);
                // percentages.requested = percentages.assigned + (values.requested * 100 / capacity);
                
                // if(elemResource.attr('data-resource') === 'Dickmans, Sven') {
                //     console.log(percentages);
                // }

                let background = 'linear-gradient(to top, '
                    + 'var(--color-green-'  + colorIndex + ') 0%, '
                    + 'var(--color-green-'  + colorIndex + ') ' + percentages.assigned  + '%, '
                    + 'var(--color-yellow-' + colorIndex + ') ' + percentages.assigned  + '%, '
                    + 'var(--color-yellow-' + colorIndex + ') ' + percentages.requested + '%, '
                    + 'var(--color-blue-'   + colorIndex + ') ' + percentages.requested + '%, '
                    + 'var(--color-blue-'   + colorIndex + ') ' + percentages.available + '%, '
                    + 'transparent '                            + percentages.available + '%, '
                    + 'transparent  100%'
                // let background = 'linear-gradient(to top, '
                //     + 'var(--color-blue-'   + colorIndex + ') 0%, '
                //     + 'var(--color-blue-'   + colorIndex + ') ' + percentages.available + '%, '
                //     + 'var(--color-green-'  + colorIndex + ') ' + percentages.available + '%, '
                //     + 'var(--color-green-'  + colorIndex + ') ' + percentages.assigned  + '%, '
                //     + 'var(--color-yellow-' + colorIndex + ') ' + percentages.assigned  + '%, '
                //     + 'var(--color-yellow-' + colorIndex + ') ' + percentages.requested + '%, '
                //     + 'transparent ' + percentages.requested + '%, '
                //     + 'transparent  100%'

                elemAllocation.css('background', background);


                // if(week.class === 'week-now') {
                //     elemAllocation.css('background', 'linear-gradient(to top, var(--color-blue-900) 0%, var(--color-blue-900) ' + availability + '%, ' + colorAllocated + ' ' + availability + '%, ' + colorAllocated + ' 100%)');
                // } else elemAllocation.css('background', 'linear-gradient(to top, var(--color-blue-800) 0%, var(--color-blue-800) ' + availability + '%, ' + colorAllocated + ' ' + availability + '%, ' + colorAllocated + ' 100%)');

            } else if(values.available < 0) {

                elemAllocation.html('0');
                elemAllocation.addClass('exceeded')
                    .css('background', '');

            }

            indexWeek++;

        }

        resource.assignments = assignments;

    }

}
function getAllocation(assignments, requested, selection, capacity, indexWeek) {

    let result = {
        allocated : 0,
        assigned  : 0,
        requested : 0,
        available : 0
    }

    // let allocation = 0;

    for(let assignment of assignments) {

        if(assignment.start.weekIndex <= indexWeek) {
            if(assignment.end.weekIndex >= indexWeek) {
                // if(assignment.end === indexWeek) allocation += assignment.effortWE;
                // else if(assignment.start === indexWeek) allocation += assignment.effortWS;
                // else allocation += assignment.effortWA;

                let isSelected = selection.includes(assignment.link);
                let key = (isSelected) ? 'assigned' : 'allocated';


                if(assignment.end.weekIndex === indexWeek) result[key] += assignment.effortWE;
                else if(assignment.start.weekIndex === indexWeek) result[key] += assignment.effortWS;
                else result[key] += assignment.effortWA;
            }
        }

    }

    for(let request of requested) {

        if(request.start <= indexWeek) {
            if(request.end >= indexWeek) {
                // if(assignment.end === indexWeek) allocation += assignment.effortWE;
                // else if(assignment.start === indexWeek) allocation += assignment.effortWS;
                // else allocation += assignment.effortWA;

                if(request.end === indexWeek) result.requested += request.effortWE;
                else if(request.start === indexWeek) result.requested += request.effortWS;
                else result.requested += request.effortWA;
            }
        }

    }

    result.available = capacity - result.allocated - result.assigned - result.requested;

    result.allocated = result.allocated.toFixed(1);
    result.assigned  = result.assigned.toFixed(1);
    result.requested = result.requested.toFixed(1);
    result.available = result.available.toFixed(1);

    // return Number(allocation);
    return result;

}
function updateAssignments() {

    $('*').removeClass('assigned');

    for(let resource of resources) {

        let elemResource;

        $('#resources').children('.resource').each(function() {
            if($(this).attr('data-resource') === resource.title) elemResource = $(this);
        });

        sortArray(resource.assignments, 'sort1', 'string', 'descending');
        sortArray(resource.assignments, 'sort2', 'integer', 'descending');
        sortArray(resource.assignments, 'sort3', 'integer', 'descending');

        for(let assignment of resource.assignments) {

            $('.activity').each(function() {
                if($(this).attr('data-link') === assignment.link) $(this).addClass('assigned');
            });

            // elemResource.addClass('assigned');

            let elemRow = $('<div></div>').insertAfter(elemResource)
                .addClass('row')
                .addClass('assignment')
                .attr('data-progress', assignment.progress)
                .attr('data-resource', resource.title)
                .attr('data-link', assignment.link)
                .click(function() {
                    showSidePanel();
                    insertItemSummary($(this).attr('data-link'), paramsItemSummaryAssignment); 
                });

            let elemActivity = $('<div></div>').appendTo(elemRow)
                .addClass('fixed-width');
                
            $('<div></div>').appendTo(elemActivity)
                .addClass('activity-title')
                .html(assignment.parent);

            $('<div></div>').appendTo(elemActivity)
                .addClass('activity-title')
                .html(assignment.title);

            $('<div></div>').appendTo(elemActivity)
                .addClass('activity-status')
                .addClass('nowrap')
                .html(assignment.status);            

            // let elemStart = $('<div></div>').appendTo(elemActivity).addClass('activity-start');
            // $('<div></div>').appendTo(elemActivity).addClass('icon').addClass('activity-range');
            // let elemEnd   = $('<div></div>').appendTo(elemActivity).addClass('activity-end'  );

            // insertActivityDate(elemStart, assignment.start);
            // insertActivityDate(elemEnd  , assignment.end);

            let elemActions = $('<div></div>').appendTo(elemActivity)
                .addClass('assignment-actions');

            $('<div></div>').appendTo(elemActions)
                .addClass('button')
                .addClass('assignment-action-unassign')
                .html('Unassign')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    removeAssignment($(this));
                });        
            // $('<div></div>').appendTo(elemActivity)
            //     .addClass('activity-group')
            //     .addClass('nowrap')
            //     .html(assignment.group);

            // $('<div></div>').appendTo(elemActivity)
            //     .addClass('activity-resource')
            //     .addClass('nowrap')
            //     .html(assignment.resource);

            insertActivityTimeline(assignment, elemRow);

        }

    }

}
function removeAssignment(elemClicked) {

    $('#overlay').show();

    let elemAssignment = elemClicked.closest('.assignment');
    let linkActivity   = elemAssignment.attr('data-link');
    let paramsEdit     = { 
        link        : linkActivity, 
        sections    : wsConfig.activities.sections,
        fields      : [
            { fieldId : config.activities.fieldIDs.resource, value : null }
        ]
    }  

    $.post('/plm/edit', paramsEdit, function() {

        $('#overlay').hide();

        for(let activity of activities) {
            if(activity.link === linkActivity) {
                activity.resource = '';
            }
        }

        $('.activity').each(function() {
            if($(this).attr('data-link') === linkActivity) {

                let elemActivity = $(this);

                elemActivity.removeClass('assigned');


                let classNames = elemActivity.attr('class').split(' ');

                for(let className of classNames) {
                    if(className.indexOf('resource-') === 0) elemActivity.removeClass(className);
                }
        
                elemActivity.attr('data-resource', '').addClass('alert');
                elemActivity.find('.activity-resource').html('');

            }
        });
         
        updateAllocation();

        console.log(resources);

        elemAssignment.remove();
        // updateAssignments();

    });

}
function updateResourceActions() {

    let countSelected = $('.activity.selected').length;

    if(countSelected === 1) {
        let assignee = $('.activity.selected').attr('data-resource')
        $('.resource').each(function() {
            
            let elemResource = $(this);
            let resource    = elemResource.attr('data-resource');

            if(resource === assignee) 
                elemResource.removeClass('match').addClass('assigned');
            else elemResource.addClass('match').removeClass('assigned');
            
        });
    } else if(countSelected > 1) {
        $('.resource').addClass('match').removeClass('assigned');
    } else {
        $('.resource').removeClass('match');
    }   

}


// User Interaction in Activities Grid
function setActivitiesEvents() {

    $('.activity').click(function() {
        $(this).toggleClass('selected');
        $(this).siblings().removeClass('selected');
        if($('.activity.selected').length > 0) $('#activities-deselect-all').removeClass('hidden'); else $('#activities-deselect-all').addClass('hidden');
        insertDetails($(this).attr('data-link'), paramsDetailsActivity); 
        filterMatchingResources($(this));
        updateAllocation();
    });

    $('.activity-selection').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).toggleClass('icon-check-box').toggleClass('icon-check-box-checked');
        let isSelected = $(this).hasClass('icon-check-box-checked');
        let elemActivity = $(this).closest('.activity');
        if(isSelected) elemActivity.addClass('selected'); else elemActivity.removeClass('selected');
        if($('.icon-check-box-checked').length > 0) $('.resource').addClass('match'); else $('.resource').removeClass('match');
        if($('.activity.selected').length > 0) $('#activities-deselect-all').removeClass('hidden'); else $('#activities-deselect-all').addClass('hidden');
        updateAllocation();
    });

}
function filterMatchingResources(elemActivity) {

    if($('body').hasClass('mode-review')) return;

    let group     = elemActivity.attr('data-group');
    let resource  = elemActivity.attr('data-resource') || '';
    let className = getClassName('group', group);
    let effortWS  = Number(elemActivity.attr('data-effort-start'));
    let effortWA  = Number(elemActivity.attr('data-effort-all'));
    let effortWE  = Number(elemActivity.attr('data-effort-end'));

    $('.resource').removeClass('selected');
    $('*').removeClass('match').removeClass('assigned');

    if(!elemActivity.hasClass('selected')) {
        $('#resources').children().removeClass('hidden');
        $('#resources').find('.column').removeClass('match');
        
    } else {

        if(isBlank(group)) {
            $('#resources').children().removeClass('hidden');
        } else {
            $('#resources').children().addClass('hidden');
            $('#resources').children('.' + className).removeClass('hidden');
        }

        let iStart = Number(elemActivity.attr('data-week-start'));
        let iEnd   = Number(elemActivity.attr('data-week-end'  ));
               

        $('.resource').each(function() {

            let elemResource = $(this);
            let isAssigned   = (resource === elemResource.attr('data-resource'));
            // let iColumn      = iStart; 

            if(isAssigned) {
                elemResource.addClass('assigned');
            } else elemResource.addClass('match');


            // do {

            //     let elemAllocation = elemResource.find('.column').eq(iColumn);
            //     // elemAllocation.css('background', 'red');
            // // $('.resources-group').each(function() {
            // //     $(this).find('.column').eq(iStart).addClass('match');
            // // });
            //     iColumn++;

            // } while (iColumn <= iEnd);


        });

        let iNext = iStart;  

        do {

            $('#resources-header').find('.column').eq(iNext).addClass('match');
            $('.resources-group').each(function() {
                // $(this).find('.column').eq(iNext).addClass('match');
            });
            iNext++;

        } while (iNext <= iEnd);

    }


}


// User Interaction in Resources Grid
function setResourcesEvents() {

    $('.resource').click(function() { 
    //     $(this).toggleClass('selected');
    //     $(this).siblings().removeClass('selected');
    //     filterMatchingActivities($(this));
    // });

    // $('.resource-details').click(function(e) { 
    //     e.preventDefault();
    //     e.stopPropagation();
        insertDetails($(this).attr('data-link'), paramsDetailsResource); 
    });


   $('.resource-action-assign').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        assignResource($(this));
    });  

    $('.resource-action-unassign').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        unassignResource($(this));
    });    

    // $('.column.allocation').click(function(e) { 

    //     e.preventDefault();
    //     e.stopPropagation();
        
    //     let link = $(this).attr('data-link');

    //     if(isBlank(link)) {
    //         if(hasPermission, permissions.plans, 'add_items') {
    //             insertCreate([], [config.plans.workspaceId], { 
    //                 id            : 'create-plan',  
    //                 headerLabel   : 'Create Resource Plan',
    //                 sectionsEx    : ['KPIs'],
    //                 showInDialog  : true,
    //                 getDetails    : true,
    //                 fieldValues : [{
    //                     fieldId      : 'TEAM',
    //                     value        : '/api/v3/workspaces/89/items/9782',
    //                     displayValue : 'Manufacturing'
    //                 },{
    //                                             // fieldId      : 'START_DATE',
    //                     // value        : new Date(),
    //                     // START_DATE
    //                 // }
    //                 }],
    //                 afterCreation : function(id, link, data) { console.log(data); }
    //             });
    //         }
    //     } else insertItemSummary(link, paramsItemSummaryPlan); 
    
    // });

    // $('.resource').click(function() { insertDetails($(this).attr('data-link')); });
//     $('.resource').click(function() {

//         if($('.timeline-cell.selected').length === 0) return;

//         let timelineSelection = getTimelineSelection();
//         let selectedPlans = getSelectedPlans($(this), timelineSelection);

//         // console.log(getTimelineSelection());
//         console.log(selectedPlans);

        

//         // let timelineSelection = $('.timeline-cell.selected');

//         // if(timelineSelection.length === 0) return;

//         // let linkActivity              = timelineSelection.first().closest('.timeline-activity').attr('data-link');
//         let linkResource              = $(this).attr('data-link');

       

//         console.log(timelineSelection.activity + ' : ' + linkResource);


//         if(!isBlank(timelineSelection.activity)) {
//             if(!isBlank(linkResource)) {

//                 let requests = [];

//                 let params = { 
//                     link     : timelineSelection.activity,
//                     sections : wsConfig.activities.sections,
//                     fields   : [{  
//                         fieldId : config.activities.fieldIDs.resource, 
//                         value : linkResource
//                     }]
//                 };

//                 console.log(params);

//                 // $.post('/plm/edit', params, function(response) {
//                 //     console.log(response);
//                 // })

//                 requests.push($.post('/plm/edit', params));

//                 let indexTimelineSelection = 0;

//                 for(let plan of selectedPlans) {

//                     let paramsGrid = {
//                         link : plan,
//                         data : [
//                             { fieldId : config.plans.grid.resource , value : { link : linkResource } },
//                             { fieldId : config.plans.grid.allocated, value : timelineSelection.efforts[indexTimelineSelection++] },
//                             { fieldId : config.plans.grid.activity , value : { link : timelineSelection.activity }}
//                         ]
//                     }

//                     console.log(paramsGrid);

//                     requests.push($.post('/plm/add-grid-row', paramsGrid));

//                 }


//                 Promise.all(requests).then(function(responses) {

//                     console.log(responses);

//                     requests = [];

//                     for(let plan of selectedPlans) {

//                         let paramsScript = {
//                             link : plan,
//                             scriptId : config.plans.scriptId,
//                             getDetails : true
//                         }

//                         console.log(paramsScript);

//                         requests.push($.post('/plm/run-item-script', paramsScript));
//                     }

//  Promise.all(requests).then(function(responses) {

// console.log(responses);

//                 });
//                 });


//             }
//         }


//     });

}
function assignResource(elemClicked) {

    $('#overlay').show();

    let elemResource  = elemClicked.closest('.resource');
    let linkResource  = elemResource.attr('data-link-user');
    let linkGroup     = '';
    let requests       = [];
    let listActivities = $('.activity.selected')

    for(let group of groups) {
        if(group.title === elemResource.attr('data-group')) {
            linkGroup = group.link;
            break;
        }
    }      

    listActivities.each(function() {

        let elemActivity  = $(this);

        let paramsEdit  = { 
            link        : elemActivity.attr('data-link'), 
            sections    : wsConfig.activities.sections,
            fields      : [
                { fieldId : config.activities.fieldIDs.group,    value : { link : linkGroup    }},
                { fieldId : config.activities.fieldIDs.resource, value : { link : linkResource }}
            ]
        }  
        
        requests.push($.post('/plm/edit', paramsEdit));

    });


    Promise.all(requests).then(function(responses) {

        $('#overlay').hide();

        let group    = elemResource.attr('data-group'   );
        let resource = elemResource.attr('data-resource'   );

        listActivities.each(function() {

            let elemActivity = $(this);

            for(let activity of activities) {
                if(activity.link === $(this).attr('data-link')) {
                    activity.resource = resource;
                    activity.group    = group;
                    console.log(activity);
                }
            }
      

            let classNames = elemActivity.attr('class').split(' ');

            for(let className of classNames) {

                    if(className.indexOf('group-'   ) === 0) elemActivity.removeClass(className);
                else if(className.indexOf('resource-') === 0) elemActivity.removeClass(className);

            }
            
            elemActivity.addClass(getClassName('group', group))
                .addClass(getClassName('resource', resource))
                .attr('data-resource', resource)
                .attr('data-group', group)
                .removeClass('alert');
                
            elemActivity.find('.activity-resource').html(resource);
            elemActivity.find('.activity-group').html(group);

            let elemTimeline = elemActivity.find('.timeline.bar');
            updateTimelineBarColor(elemTimeline);

        });

        updateAllocation();
        updateAssignments();
        updateResourceActions();

    });

}
function unassignResource() {

    let elemActivity  = $('.activity.selected');
    let linkActivity  = elemActivity.attr('data-link');
    let requests      = [];

    let paramsEdit  = { 
        link        : linkActivity, 
        sections    : wsConfig.activities.sections,
        fields      : [
            { fieldId : config.activities.fieldIDs.resource, value : null }
        ]
    }  

    $('#overlay').show();

    requests.push($.post('/plm/edit', paramsEdit));

    Promise.all(requests).then(function() {

        $('#overlay').hide();

        console.log('1');

        for(let activity of activities) {
            if(activity.link === linkActivity) {
                console.log(activity);
                activity.resource = '';
                console.log(activity);
            }
        }

        console.log(elemActivity.length);

        let classNames = elemActivity.attr('class').split(' ');

        for(let className of classNames) {
            if(className.indexOf('resource-') === 0) elemActivity.removeClass(className);
        }
        
        elemActivity.attr('data-resource', '')
            .addClass('alert');
            
        elemActivity.find('.activity-resource').html('');

        let elemTimeline = elemActivity.find('.timeline.bar');
        updateTimelineBarColor(elemTimeline);
         
        updateAllocation();
        updateAssignments();

    });

}


// Group controls
function toggleRows(e, elemClicked, selector) {

    e.preventDefault();
    e.stopPropagation();

    let elemToggle = (elemClicked.hasClass('row-toggle')) ? elemClicked : elemClicked.find('.row-toggle').first();

    elemToggle.toggleClass('icon-expand').toggleClass('icon-collapse');
    
    let isHidden = elemToggle.hasClass('icon-expand');
    let listRows = elemToggle.closest('.row').nextUntil(selector);

    listRows.each(function() {
        if(isHidden) $(this).addClass('hidden');
        else {
            $(this).removeClass('hidden');
            let elemToggle  = $(this).find('.row-toggle').first();
            if(elemToggle.length > 0) {
                elemToggle.removeClass('icon-expand').addClass('icon-collapse');
            }       
        }
    });

}
function applyFilter(idFilter, idList, unhideParents) {

    let value     = $('#' + idFilter).val().toLowerCase();
    let group     = $('#select-group').val().toLowerCase();
    let className = getClassName('group', group) || '';

    $('#' + idList).children().each(function() {

        let elemItem = $(this);
        let itemText = elemItem.text().toLowerCase();   
        let hide     = true;

        if(itemText.indexOf(value) >= 0) {
            if((group === 'all') || elemItem.hasClass(className)) {
                hide = false;
                elemItem.removeClass('hidden');
                elemItem.prevAll('.root').removeClass('hidden');
                if(unhideParents) elemItem.prevAll('.parent').removeClass('hidden');
            }
        }

        if(hide) elemItem.addClass('hidden');

    });

}



// User Interactions in Timeline
function setTimelineEvents() {

    $('.timeline.bar').click(function() {

        resetRequiredAvailabilityHighlight()
        
        $(this).toggleClass('selected');
        let isSelected = $(this).hasClass('selected');
        $('.timeline.bar').removeClass('selected');

        if(isSelected) {
            $(this).addClass('selected');
            let effort = $(this).children('input').val();
            // highlightRequiredAvailability(Number($(this).attr('data-week-start')), Number($(this).attr('data-week-end')), effort);
            highlightRequiredAvailability($(this).closest('.activity'));
        }
        // } else resetRequiredAvailabilityHighlight();
        
        // $('.timeline-cell').removeClass('selected');

        // let elemClicked  = $(this);
        // let elemPrevious = elemClicked.prevAll('.in-use');
        // let elemNext     = elemClicked.nextAll('.in-use');

        //  elemClicked.addClass('selected');
        // elemPrevious.addClass('selected');
        //     elemNext.addClass('selected');

        // console.log(elemClicked.closest('.timeline-activity').attr('data-link'));

        // let selectedWeeks = getTimelineSelection();

        // console.log(selectedWeeks);

    });
    // $('.timeline-cell.in-use').click(function() {

    //     $('.timeline-cell').removeClass('selected');

    //     let elemClicked  = $(this);
    //     let elemPrevious = elemClicked.prevAll('.in-use');
    //     let elemNext     = elemClicked.nextAll('.in-use');

    //      elemClicked.addClass('selected');
    //     elemPrevious.addClass('selected');
    //         elemNext.addClass('selected');

    //     console.log(elemClicked.closest('.timeline-activity').attr('data-link'));

    //     let selectedWeeks = getTimelineSelection();

    //     console.log(selectedWeeks);

    // });

}
function resetRequiredAvailabilityHighlight() {

    $('.column.allocation.cell').each(function() {

        let elemAllocation = $(this);
        let availability   = elemAllocation.attr('data-availability');
        let capacity       = elemAllocation.attr('data-capacity');
        let percent        = elemAllocation.attr('data-percent');

        if(availability < 0) elemAllocation.addClass('exceeded');
        else if(!isBlank(percent)) {
            elemAllocation.css('background', 'linear-gradient(to top, var(--color-blue-700) 0%, var(--color-blue-600) ' + percent + '%, var(--color-surface-level-1) ' + percent + '%)');
        } else {
            elemAllocation.css('background', '');
        }

    });

}
// function highlightRequiredAvailability(weekStart, weekEnd, effort) {
function highlightRequiredAvailability(elemActivity) {

    $('*').removeClass('assigned').removeClass('requested');

    let weekStart   = elemActivity.attr('data-week-start');
    let weekEnd     = elemActivity.attr('data-week-end');
    let effortStart = elemActivity.attr('data-effort-start');
    let effortAll   = elemActivity.attr('data-effort-all');
    let effortEnd   = elemActivity.attr('data-effort-end');
    let assignee    = elemActivity.attr('data-resource');

    $('.column.allocation.cell').each(function() {

        let elemAllocation = $(this);
        let elemResource   = $(this).closest('.resource');
        let resourceName   = elemResource.attr('data-resource');
        let isAssigned     = resourceName == assignee;
        let week           = Number(elemAllocation.attr('data-week'));

        if(week >= weekStart) {
            if(week <= weekEnd) {
                
                let availability = elemAllocation.attr('data-availability');
                let capacity     = elemAllocation.attr('data-capacity') || 0;
                let percent      = elemAllocation.attr('data-percent');
                let required     = 100 - (effortAll * 100 / capacity);
                let meetsDemand = (!isBlank(availability));

                if(!isAssigned) elemResource.addClass('requested');

                elemAllocation.addClass('requested');
                
                if(meetsDemand) meetsDemand = ((availability - effortAll) >= 0);

                // console.log(availability, capacity, effortAll, required, meetsDemand);
                if(isAssigned) {
                    elemResource.addClass('assigned');
                    elemAllocation.css('background', 'linear-gradient(to top, var(--color-blue-700) 0%, var(--color-blue-600) ' + required + '%, var(--color-green-600) ' + required + '%,var(--color-green-700) 100%)');
                } else if(!meetsDemand) {
                    elemAllocation.css('background', 'var(--color-status-red)');
                } else if(!isBlank(percent)) {
                    elemAllocation.css('background', 'linear-gradient(to top, var(--color-blue-700) 0%, var(--color-blue-600) ' + required + '%, var(--color-yellow-600) ' + required + '%,var(--color-yellow-700) 100%)');
                } else {
                    elemAllocation.css('background', 'var(--color-surface-level-5)');
                }

            }
        }

    });

}
function getTimelineSelection() {

    let timelineSelection = $('.timeline-cell.selected');
    let timelineStart     = timelineSelection.first().index();
    let timelineEnd       = timelineSelection.last().index();
    let efforts           = [];

    timelineSelection.each(function() { efforts.push($(this).attr('data-effort')); })

    return {
        start    : timelineStart + 1,
        end      : timelineEnd + 1,
        efforts  : efforts,
        activity : timelineSelection.first().closest('.timeline-activity').attr('data-link')
    }

}



// Auto Assignment
function autoAssign(mode) {

    let requests = [];

    $('#items-content').children('.content-item').each(function() {

        let elemItem = $(this);
        let link     = elemItem.attr('data-link');
        let elemSlot = getAssignedSlot(link);

        if(elemSlot !== null) {

            let linkWeek = elemSlot.closest('.calendar-week').attr('data-link');
            let params   = { link: linkWeek, sections : [] }  
            
            addFieldToPayload( params.sections, wsConfig.sections, null, elemSlot.attr('data-fieldId'), null, false );
            
            requests.push($.post('/plm/edit', params));
            
            elemItem.find('.tile-slot').removeClass('assigned').html('');
                
            elemSlot.removeAttr('data-link')
                .removeAttr('title')
                .addClass('available')
                .removeClass('blocked');
            
        }

    });

    Promise.all(requests).then(function(responses) {

        console.log('ho');

        $('#items-content').children('.content-item').each(function() {
        
            let elemSlot = $('.slot.available').first();

            console.log(elemSlot.length);
                elemSlot.addClass('blocked').removeClass('available');

        });



    });

    // removeAllAssignments(function() {
// 
    // });

}
function removeAllAssignments(callback) {

    let requests = 

    callback();


}