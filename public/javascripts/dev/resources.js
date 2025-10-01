// let listItems = [];
let wsConfig  = {}

let weeks      = [];
let activities = [];
let resources  = [];
let plans      = [];
let weeksCount = 10;

let paramsDetailsActivity = {
    expandSections : ['Header'],
    headerLabel    : 'descriptor',
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

let paramsItemSummaryPlan =  {

    id        : 'details',
    reload    : true,
    contents  : [
        {type : 'grid'   , params : { hideHeader : true} },
        {type : 'details', params : { hideHeader : true} }
    ]

}


$(document).ready(function() {

    appendOverlay(true);

    setUIEvents();
    setWeeks();
    setHeaders();

});


function setUIEvents() { 

    // Global Toolbar Buttons
    $('#toggle-details').click(function() {
        $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
        $('body').toggleClass('no-details');
    });
    $('#toggle-compact').click(function() {
        $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
        $('body').toggleClass('compact-on');
    });
    $('#button-create-plan').click(function() {
        insertCreate([], [config.resources.plans.wsId], { 
            id           : 'create-plan',  
            headerLabel  : 'Create Resource Plan',
            sectionsEx   : ['KPIs'],
            showInDialog : true,
            getDetails : true,
            afterCreation : function(id, link, data) { console.log(data); }
        });

    });


    // Toggles for activities and resources
    $('#activities-expand').click(function() {
        $('.activities-group-toggle').addClass('icon-expand').removeClass('icon-expand');
        $('.activity').show();
    });
    $('#activities-collapse').click(function() {
        $('.activities-group-toggle').removeClass('icon-expand').addClass('icon-expand');
        $('.activity').hide();
    });

    $('#resources-expand').click(function() {
        $('.resources-group-toggle').addClass('icon-expand').removeClass('icon-expand');
        $('.resource').show();
    });
    $('#resources-collapse').click(function() {
        $('.resources-group-toggle').removeClass('icon-expand').addClass('icon-expand');
        $('.resource').hide();
    });

    // $('#block-earliest').click(function() {
    //     autoAssign('earliest');
    // });
    // $('#block-latest').click(function() {
    //     autoAssign('latest');
    // });
    // $('#block-sequence').click(function() {
    //     autoAssign('sequence');
    // });

}
function setWeeks() {

    weeksCount = config.resources.weeks.past + config.resources.weeks.future + 1;

    let now = new Date();
    let mon = new Date();
    let day = mon.getDay() - 1;

    now.setDate(now.getDate() - day);
    mon.setDate(mon.getDate() - (7 * config.resources.weeks.past) - day);

    mon = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate());

    for(let index = 0; index < weeksCount; index++) {

        // console.log(mon.toLocaleDateString());

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
            label       : start.toLocaleDateString(),
            class       : className,
            startString : start.getFullYear() + '-' + (start.getMonth() + 1) + '-' + start.getDate(),
            endString   : end.getFullYear() + '-' + (end.getMonth() + 1) + '-' + end.getDate()
        })

        mon.setDate(mon.getDate() + 7);

    }

    console.log(weeks);

}
function setHeaders() {

    $('#header-subtitle').html(config.resources.subtitle);
    $('#activities-header-title').html(config.resources.headers.activities);
    $('#resources-header-title').html(config.resources.headers.resources);

    insertHeaderWeekColumns($('#activities-header'));
    insertHeaderWeekColumns($('#resources-header'));

}
function insertHeaderWeekColumns(elemParent) {
    
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


// Wait for the user profile being loaded to apply the required filters (ownership)
function insertAvatarDone() {

    let paramsActivities = { wsId : config.resources.activities.wsId, fields : [
        config.resources.activities.fields.title,
        config.resources.activities.fields.start,
        config.resources.activities.fields.end,
        config.resources.activities.fields.type,
        config.resources.activities.fields.group,
        config.resources.activities.fields.resource,
        config.resources.activities.fields.effort,
        config.resources.activities.fields.status
    ], filter : [{
        comparator :  15,
        field      : 'OWNER_USERID',
        type       : 3 ,
        value      : userAccount.displayName
    },{
        comparator : 18, // after
        field      : config.resources.activities.fields.end,
        type       : 0 ,
        value      : weeks[0].startString          
    },{
        comparator : 19, // before
        field      : config.resources.activities.fields.start,
        type       : 0 ,
        value      : weeks[weeks.length -1].endString       
    }]};

    if(!isBlank(config.resources.activities.hideActivitiesInStates)) {
        for(let status of config.resources.activities.hideActivitiesInStates) {
            paramsActivities.filter.push({
                comparator :  5,
                field      : 'WF_CURRENT_STATE',
                type       : 1 ,
                value      : status
            });
        }
    }

    let paramsResources = { wsId : config.resources.resources.wsId, fields : [
        config.resources.resources.fields.title,
        config.resources.resources.fields.group,
    ]};

    let paramsPlans = { wsId : config.resources.plans.wsId, fields : [
        config.resources.plans.fields.group,
        config.resources.plans.fields.week,
        config.resources.plans.fields.start,
        config.resources.plans.fields.end
    ], filter : [{
        comparator : 18, // after
        field      : config.resources.plans.fields.end,
        type       : 0,
        value      : weeks[0].startString          
    },{
        comparator : 19, // before
        field      : config.resources.plans.fields.start,
        type       : 0,
        value      : weeks[weeks.length -1].endString    
    }]};

    for(let i = 1; i <= config.resources.plans.membersCount; i++) {
        paramsPlans.fields.push(config.resources.plans.membersFieldsPrefix.title        + i);
        paramsPlans.fields.push(config.resources.plans.membersFieldsPrefix.capacity     + i);
        paramsPlans.fields.push(config.resources.plans.membersFieldsPrefix.availability + i);
    }

    let requests = [
        $.post( '/plm/search', paramsActivities ),
        $.post( '/plm/search', paramsResources ),
        $.post( '/plm/search', paramsPlans ),
        $.get( '/plm/sections', { wsId : config.resources.activities.wsId} )
    ]

    Promise.all(requests).then(function(responses) {

        // console.log(responses);

        for(let result of responses[0].data.row) {
            activities.push({
                dmsId    : result.dmsId,
                title    : getSearchResultFieldValue(result, config.resources.activities.fields.title, ''),
                start    : getDateDetails(getSearchResultFieldValue(result, config.resources.activities.fields.start, '')),
                end      : getDateDetails(getSearchResultFieldValue(result, config.resources.activities.fields.end  , '')),
                type     : getSearchResultFieldValue(result, config.resources.activities.fields.type, ''),
                group    : getSearchResultFieldValue(result, config.resources.activities.fields.group, ''),
                resource : getSearchResultFieldValue(result, config.resources.activities.fields.resource, ''),
                effort   : getSearchResultFieldValue(result, config.resources.activities.fields.effort, ''),
                status   : getSearchResultFieldValue(result, config.resources.activities.fields.status, ''),
            })
        }

        for(let result of responses[1].data.row) {
            resources.push({
                dmsId : result.dmsId,
                title : getSearchResultFieldValue(result, config.resources.resources.fields.title, ''),
                group : getSearchResultFieldValue(result, config.resources.resources.fields.group, '')
            })
        }

        for(let result of responses[2].data.row) {
            let plan = {
                dmsId : result.dmsId,
                group : getSearchResultFieldValue(result, config.resources.plans.fields.group, ''),
                week  : Number(getSearchResultFieldValue(result, config.resources.plans.fields.week, 0)),
                start : getSearchResultFieldValue(result, config.resources.plans.fields.start, ''),
                end   : getSearchResultFieldValue(result, config.resources.plans.fields.end  , ''),
                resources : []
            };
            for(let i = 1; i <= config.resources.plans.membersCount; i++) {
                plan.resources.push ({
                    title        : getSearchResultFieldValue(result, config.resources.plans.membersFieldsPrefix.title    + i, ''),
                    capacity     : Number(getSearchResultFieldValue(result, config.resources.plans.membersFieldsPrefix.capacity     + i, 0)),
                    availability : Number(getSearchResultFieldValue(result, config.resources.plans.membersFieldsPrefix.availability + i, 0))
                });
            }
            plans.push(plan);
        }

        // console.log(activities);
        // console.log(resources);
        // console.log(plans);

        wsConfig.activities = {
            sections : responses[3].data
        }

        sortArray(activities, 'group');
        sortArray(resources, 'group');

        insertActivities();
        insertResources();

        setActivitiesEvents();
        setTimelineEvents();
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
function insertActivities() {

    let groupName = '';

    for(let activity of activities) {

        groupName = insertActivityGroup(groupName, activity);

        let link         = '/api/v3/workspaces/' + config.resources.activities.wsId + '/items/' + activity.dmsId;
        let elemRow      = $('<div></div>').appendTo($('#activities')).addClass('row').addClass('activity');
        let elemActivity = $('<div></div>').appendTo(elemRow).addClass('fixed-width');
        let elemGroup    = elemRow.prevAll('.activities-group').first();

        elemRow.attr('data-link', link);
        elemActivity.addClass('check');

        $('<div></div>').appendTo(elemActivity).addClass('activity-title').html(activity.title);
        $('<div></div>').appendTo(elemActivity).addClass('activity-status').html(activity.status).addClass('nowrap');
        
        let elemStart = $('<div></div>').appendTo(elemActivity).addClass('activity-start');
        $('<div></div>').appendTo(elemActivity).addClass('icon').addClass('icon-east');
        let elemEnd   = $('<div></div>').appendTo(elemActivity).addClass('activity-end'  );

        insertActivityDate(elemStart, activity.start);
        insertActivityDate(elemEnd  , activity.end);
        
        $('<div></div>').appendTo(elemActivity)
            .addClass('activity-icon')
            .addClass('icon')
            .addClass('filled');

        $('<div></div>').appendTo(elemActivity)
            .addClass('activity-resource')
            .addClass('nowrap')
            .html(activity.resource);

        if(isBlank(activity.resource)) elemRow.addClass('alert'); else elemRow.addClass('check');

        activity.start.weekIndex = -1;
        activity.end.weekIndex   = -1;
        activity.duration        = 0;

        let weekIndex = 0;

        for(let week of weeks) {

            let comparison = compareActivityTimeline(activity, week);
            let blankCell  = (comparison === 'before') || (comparison === 'after')

            if(!blankCell) {
                if(activity.start.weekIndex < 0) {
                    activity.start.weekIndex = weekIndex;
                }
                if(comparison !== 'in') {
                    if(comparison !== 'startsIn') {
                        if(activity.end.weekIndex < 0) {
                            activity.end.weekIndex = weekIndex;
                            activity.duration      = (weekIndex - activity.start.weekIndex + 1);
                            
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

                            $('<input></input>').appendTo(elemTimelineBar).val(activity.effort);
                        }
                    }
                }

                let elemGroupColumn = elemGroup.find('.column').eq(weekIndex);
                    elemGroupColumn.addClass('in-use');

            } else {
                $('<div></div>').appendTo(elemRow)
                    .addClass('column')
                    .addClass('cell')
                    .addClass('timeline')
                    .addClass('blank');
            }

            // console.log(activity.start.weekIndex);

                // if(comparison !== )

            // }

            // if(weekStart === -1) {
            //     if(className !== 'blank') {
            //         weekStart = weekIndex;
            //     }
            // }
            // if(weekStart > -1) {
            //     if(weekEnd === -1) {
            //         if(className === 'blank') {
            //             weekEnd = weekIndex;
            //         } else if(weekIndex === weeks.length) {
            //             // console.log('ende');
            //             weekEnd = weekIndex + 1;

            //         }
            //     }
            // }


            // if(className === 'blank') {




            // } else if(weekEnd > -1) {

            //     let duration = weekEnd - weekStart;
            //     console.log(duration);

            //     $('<div></div>').appendTo(elemRow)
            //         .addClass('column')
            //         .addClass('timeline')
            //         .addClass(className)
            //         .css('flex', duration + '1 0px');

            // }

            // console.log(weekEnd);

            // if(weekEnd > -1) console.log(weekEnd - weekStart);

            // let elemTimelineCell = $('<div></div>').appendTo(elemRow)
            //     .addClass('column')
            //     .addClass('timeline')
            //     .addClass(className);

            // if(className !== 'blank') {

            //     elemTimelineCell.addClass('in-use').attr('data-effort', activity.effort).html(activity.effort);

            //     let iColumn = elemRow.children('.column').length - 1;
            //     let elemGroupColumn = elemGroup.find('.column').eq(iColumn);
            //         elemGroupColumn.addClass('in-use');

            // }

            weekIndex++;

            
        }

        // let elemCell = elemRow.find('.column.timeline').first();

        // let elemTimelineBar = $('<div></div>').appendTo(elemCell)
        //     .addClass('bar')
        //     .addClass('timeline');

    }

}
function insertActivityGroup(groupName, activity) {

    if(groupName !== activity.group) {

        let elemRow = $('<div></div>').appendTo($('#activities'))
            .addClass('row')
            .addClass('activities-group');

        let elemActivitesGroup = $('<div></div>').appendTo(elemRow)
            .addClass('fixed-width')
            .addClass('group-header');

        $('<div></div>').appendTo(elemActivitesGroup)
            .addClass('button')
            .addClass('icon')
            .addClass('icon-collapse')
            .addClass('group-toggle')
            .addClass('activities-group-toggle')
            .click(function() {
                $(this).toggleClass('icon-expand').toggleClass('icon-collapse');
                let elemRow = $(this).closest('.row');
                elemRow.nextUntil('.activities-group').toggle();
            });

        $('<div></div>').appendTo(elemActivitesGroup)
            .addClass('group-title')
            .html(activity.group);

        for(let week of weeks) {

            $('<div></div>').appendTo(elemRow)
                .addClass('column')
                .addClass('timeline');

        }

    }

    return activity.group;

}
function insertActivityDate(elemDate, date) {

    elemDate.addClass('activity-date');

    $('<div></div>').appendTo(elemDate).addClass('date-day').html(date.day);
    $('<div></div>').appendTo(elemDate).addClass('date-dot').html('.');
    $('<div></div>').appendTo(elemDate).addClass('date-month').html(date.month);
    $('<div></div>').appendTo(elemDate).addClass('date-dot').html('.');
    $('<div></div>').appendTo(elemDate).addClass('date-year').html(date.year);

}
function compareActivityTimeline(activity, week) {

    if(activity.end.time   < week.start) return 'before'  ;
    if(activity.start.time > week.end  ) return 'after'   ;
    if(activity.end.time   < week.end  ) return 'endsIn'  ;
    if(activity.start.time > week.start) return 'startsIn';

    return 'in';

}
function insertResources() {

    let groupName = '';

    for(let resource of resources) {

        groupName = insertResourcesGroup(groupName, resource);

        let link         = '/api/v3/workspaces/' + config.resources.resources.wsId + '/items/' + resource.dmsId;
        let elemRow      = $('<div></div>').appendTo($('#resources')).addClass('row').addClass('resource');        
        let elemResource = $('<div></div>').appendTo(elemRow).addClass('fixed-width');
        let weekIndex    = 0;

        elemRow.attr('data-link', link);

        $('<div></div>').appendTo(elemResource).addClass('resource-icon').addClass('icon').addClass('icon-user').addClass('filled');
        $('<div></div>').appendTo(elemResource).addClass('resource-title').html(resource.title);
        
        for(let week of weeks) {
            
            let plan  = getPlanResourceCapacity(resource.title, week);

            let elemAllocation = $('<div></div>').appendTo(elemRow)
                .addClass('column')
                .addClass('allocation')
                .addClass('cell')
                .attr('data-week', weekIndex++);
                // .addClass('week-' + weekIndex++);
                

            // elemAllocation.css('background', 'linear-gradient(to top, var(--color-status-yellow) 0%, var(--color-status-yellow) ' + plan.percent + '%, var(--color-surface-level-1) ' + plan.percent + '%)');
            // elemAllocation.css('background', 'linear-gradient(to top, var(--color-blue-700) 0%, var(--color-blue-500) ' + plan.percent + '%, var(--color-surface-level-1) ' + plan.percent + '%)');

            if(plan.dmsId !== '') {
                if(plan.availability < 0) elemAllocation.addClass('exceeded');
                else elemAllocation.css('background', 'linear-gradient(to top, var(--color-blue-700) 0%, var(--color-blue-600) ' + plan.percent + '%, var(--color-surface-level-1) ' + plan.percent + '%)');
                elemAllocation.html(plan.availability + '/' + plan.capacity)
                .addClass('with-link')
                .attr('data-availability', plan.availability)
                .attr('data-capacity', plan.capacity)
                .attr('data-percent', plan.percent)
                .attr('data-link', '/api/v3/workspaces/' + config.resources.plans.wsId + '/items/' + plan.dmsId);
                // elemAllocation.click(function() {
                //     openItemByLink($(this).attr('data-link'));
                // });
            } else {
                elemAllocation.html('--/--');
            }

        }

    }

}
function insertResourcesGroup(groupName, resource) {

    if(groupName !== resource.group) {

        let elemRow = $('<div></div>').appendTo($('#resources'))
            .addClass('row')
            .addClass('resources-group');

        let elemResourcesGroup = $('<div></div>').appendTo(elemRow)
            .addClass('fixed-width')
            .addClass('group-header');

        $('<div></div>').appendTo(elemResourcesGroup)
            .addClass('button')
            .addClass('icon')
            .addClass('icon-collapse')
            .addClass('group-toggle')
            .addClass('resources-group-toggle')
            .click(function() {
                $(this).toggleClass('icon-expand').toggleClass('icon-collapse');
                let elemRow = $(this).closest('.row');
                elemRow.nextUntil('.resources-group').toggle();
            });

        $('<div></div>').appendTo(elemResourcesGroup)
            .addClass('group-title')
            .html(resource.group);

        for(let week of weeks) {

            $('<div></div>').appendTo(elemRow)
                .addClass('column')
                .addClass('allocation')
                .addClass('group');

        }

    }

    return resource.group;

}
function getPlanResourceCapacity(title, week) {

    for(let plan of plans) {

        if(week.number === plan.week) {
            for(let resource of plan.resources) {
                if(resource.title === title) {
                    return { 
                        dmsId        : plan.dmsId, 
                        capacity     : resource.capacity,
                        availability : resource.availability,
                        percent      : (resource.capacity === 0) ? 0 : (resource.availability * 100 / resource.capacity)
                    };
                }
            }
        }
    }

    return { dmsId : '', capacity : 0, availability : 0, percent : 0};

}



// User Interaction in Activities
function setActivitiesEvents() {

    $('.activity').click(function() { insertDetails($(this).attr('data-link'), paramsDetailsActivity); });
    $('.activity').first().click();

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
            highlightRequiredAvailability(Number($(this).attr('data-week-start')), Number($(this).attr('data-week-end')), effort);
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
function highlightRequiredAvailability(weekStart, weekEnd, effort) {

    $('.column.allocation.cell').each(function() {

        let elemAllocation = $(this);

        let week = Number(elemAllocation.attr('data-week'));

        if(week >= weekStart) {
            if(week <= weekEnd) {
                let availability = elemAllocation.attr('data-availability')
                let capacity     = elemAllocation.attr('data-capacity')
                let percent      = elemAllocation.attr('data-percent')
                if(!isBlank(percent)) {
                    elemAllocation.css('background', 'linear-gradient(to top, var(--color-yellow-700) 0%, var(--color-yellow-600) ' + percent + '%, var(--color-surface-level-1) ' + percent + '%)');
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



// User Interactions in Resources
function setResourcesEvents() {

    $('.resource .fixed-width').click(function() { insertDetails($(this).parent().attr('data-link'), paramsDetailsResource); });
    $('.column.allocation').click(function() { 
        
        let link = $(this).attr('data-link');
        if(!isBlank(link)) insertItemSummary(link, paramsItemSummaryPlan); 
    
    });
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
//                         fieldId : config.resources.activities.fields.resource, 
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
//                             { fieldId : config.resources.plans.grid.resource , value : { link : linkResource } },
//                             { fieldId : config.resources.plans.grid.allocated, value : timelineSelection.efforts[indexTimelineSelection++] },
//                             { fieldId : config.resources.plans.grid.activity , value : { link : timelineSelection.activity }}
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
//                             scriptId : config.resources.plans.scriptId,
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
function getSelectedPlans(elemResource) {

    let indexResource = elemResource.index() + 1;
    console.log(indexResource);

    let elemAllocation = $('#allocations').children(':nth-child(' + indexResource + ')');
    console.log(elemAllocation.length);

    // elemAllocation.remove();

    let timelineSelection = getTimelineSelection();
    let result = [];

    console.log(timelineSelection);
    
    let i = timelineSelection.start;

    for(i; i <= timelineSelection.end; i++) {

        result.push(elemAllocation.children(':nth-child(' + i + ')').attr('data-link'))

    }

    console.log(result.length);
    console.log(result[0].length);

    return result;
    

}


// Once the list of items got loaded, extend the tile display
// function afterItemsCompletion(id) {

//     $('#' + id + '-content').children().each(function() {

//         let elemTile = $(this);

//         listItems.push({
//             title : elemTile.attr('data-title'),
//             link  : elemTile.attr('data-link')
//         });

//         $('<div></div>').appendTo(elemTile)
//             .addClass('tile-slot')
//             .click(function(e) {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 removeFromSlot($(this));
//             });

//     });

//     insertCalendar();

// }


// When users click an item, display its details in the side panel and highlight the matching slot
function clickItem(elemClicked) {

    let link = elemClicked.attr('data-link');

    insertDetails(link, {
        id          : 'item',
        headerLabel : 'descriptor'
    });

    $('#schedule').find('.highlight').removeClass('highlight');

    $('.slot').each(function() {
        if($(this).attr('data-link') === link) {
            $(this).addClass('highlight');
            $(this).closest('.calendar-day').addClass('highlight');
            $(this).closest('.calendar-week').addClass('highlight');
        }
    });

}


// Display months and given slots
function insertCalendar() {

    let date = new Date();
    
    insertCalendarMonth('month-1', date);

    date.setMonth(date.getMonth() + 1);

    insertCalendarMonth('month-2', date);

    date.setMonth(date.getMonth() + 1);

    insertCalendarMonth('month-3', date);

    date.setMonth(date.getMonth() + 1);

    insertCalendarMonth('month-4', date);

    insertSlots();

    $('.calendar-day').click(function() {

        assignSelectedSlot($(this));

    });

}
function insertSlots() {

    let requests  = [];
    let dateStart = new Date();

    dateStart.setDate(dateStart.getDate() - dateStart.getDay());

    let value    = dateStart.getFullYear() + '/' + (dateStart.getMonth() + 1) + '/' + dateStart.getDate();

    requests.push($.post('/plm/search', {
        wsId : '373',
        fields : ['DESCRIPTOR', 'MON_1', 'MON_2', 'MON_3', 'MON_4', 'TUE_1', 'TUE_2', 'TUE_3', 'TUE_4', 'WEEK'],
        sort   : ['DESCRIPTOR'],
        filter : [{
            field       : 'START_DATE',
            type        : 0,
            comparator  : '18',
            value       : value
        }]
    }));
    
    requests.push($.get('/plm/sections', { wsId : '373'}));
    
    Promise.all(requests).then(function(responses) {

        let weeks = responses[0].data.row;
        wsConfig.sections = responses[1].data;

        console.log(wsConfig);
        
        $('.calendar-week').each(function() {
        
            let elemWeek = $(this);
        
            elemWeek.children('.calendar-day').each(function() {

                let elemDay = $(this);
                let date    = elemDay.html();

                elemDay.html('');

                let elemDate = $('<div></div>').appendTo(elemDay)
                    .addClass('day')
                    .html($('<div>' + date + '</div>'));

                let elemSlots = $('<div></div>').appendTo(elemDate)
                    .addClass('slots');

                for(let i = 1; i <= 4; i++) insertSlot(elemWeek, elemDay.attr('data-date'), elemSlots, weeks, i);
                    
            });
        });

    });

}
function insertSlot(elemWeek, date, elemSlots, weeks, index) {

    let className   = 'available';
    let fieldPrefix = '';
    let value       = '';

    let elemSlot = $('<div></div>').appendTo(elemSlots)
        .addClass('slot')
        .addClass('slot-' + index);

    switch(date) {

        case '1': fieldPrefix = 'MON'; break;
        case '2': fieldPrefix = 'TUE'; break;
        case '3': fieldPrefix = 'WED'; break;
        case '4': fieldPrefix = 'THU'; break;
        case '5': fieldPrefix = 'FRI'; break;

    }

    for(let week of weeks) {

        let weekNumber = getSearchResultFieldValue(week, 'WEEK', '');
        let linkWeek   = '/api/v3/workspaces/' +  '373' + '/items/' + week.dmsId;
        let fieldId    = fieldPrefix + '_' + index;

        elemSlot.attr('data-fieldId', fieldId);

        if(weekNumber == elemWeek.attr('data-week')) {

            elemWeek.attr('data-link', linkWeek);
            elemWeek.find('.calendar-week-number').click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                openItemByLink($(this).parent().attr('data-link'));
            });

            value = getSearchResultFieldValue(week, fieldId, '');

            if(!isBlank(value)) {
                className = 'unavailable';
                elemSlot.attr('title', value);
                for(let item of listItems) {
                    if(item.title === value) {
                        setTileSlotInfo(item.link, weekNumber);
                        elemSlot.attr('data-link', item.link);
                        className = 'blocked';
                        break;
                    }
                }
            }


        }
    }
 
    elemSlot.addClass(className);

}
function setTileSlotInfo(linkSlot, weekNumber) {

    $('#items-content').children('.content-item').each(function() {

        let elemTile = $(this);
        let link     = elemTile.attr('data-link'); 

        if(link === linkSlot) {

            let elemSlot = elemTile.find('.tile-slot');
            elemSlot.html(weekNumber);
            elemSlot.addClass('assigned');
            return;

        }

    });


}


// Update Calendar Week in PLM
function assignSelectedSlot(elemClicked) {

    let availableSlot = elemClicked.find('.slot.available').first();
    let selectedItem  = $('#items-content').find('.content-item.selected').first();
    let elemWeek      = availableSlot.closest('.calendar-week');
    let weekNumber    = elemWeek.attr('data-week');
    let linkPrevWeek  = '';
    let fieldIdPrev   = '';

    if(availableSlot.length < 1) return;
    if(selectedItem.length  < 1) return;

    let linkSelected  = selectedItem.attr('data-link');

    $('.slot').each(function() {
        let elemSlot = $(this);
        let linkSlot = elemSlot.attr('data-link');
        if(linkSlot === linkSelected) {
            linkPrevWeek = elemSlot.closest('.calendar-week').attr('data-link');
            fieldIdPrev  = elemSlot.attr('data-fieldId');
            elemSlot.removeAttr('data-link')
                .removeAttr('title')
                .addClass('available')
                .removeClass('blocked');
        }
    });

    availableSlot.addClass('blocked').removeClass('available');
    availableSlot.attr('data-link', linkSelected);
    availableSlot.attr('title', selectedItem.attr('data-title'));

    let requests   = [];
    let paramsNew  = { link: elemWeek.attr('data-link'), sections : [] }
    let paramsPrev = { link: linkPrevWeek, sections : [] }
    
    addFieldToPayload( paramsNew.sections,  wsConfig.sections, null, availableSlot.attr('data-fieldId'), { link : linkSelected } );
    addFieldToPayload( paramsPrev.sections, wsConfig.sections, null, fieldIdPrev                       , { link : linkPrevWeek } );
    
    requests.push($.post('/plm/edit', paramsNew));

    if(!isBlank(linkPrevWeek)) requests.push($.post('/plm/edit', paramsPrev));

    Promise.all(requests).then(function(responses) {

        $('.highlight').removeClass('highlight');

    });

    setTileSlotInfo(linkSelected, weekNumber);

}



function removeFromSlot(elemClicked) {

    let elemTile = elemClicked.closest('.tile');
    let link     = elemTile.attr('data-link');
    let elemSlot = getAssignedSlot(link);

    if(elemSlot.length === 0) return;

    let linkWeek = elemSlot.closest('.calendar-week').attr('data-link');
    let params   = { link: linkWeek, sections : [] }

    addFieldToPayload( params.sections, wsConfig.sections, null, elemSlot.attr('data-fieldId'), null, false );

    $.post('/plm/edit', params, function(response) {

        elemClicked.removeClass('assigned').html('');

        elemSlot.removeAttr('data-link')
            .removeAttr('title')
            .addClass('available')
            .removeClass('blocked');

    });

}
function getAssignedSlot(link) {

    let elemSlot = null;

    $('.slot').each(function() {
        let current  = $(this);
        let assigned = current.attr('data-link');
        if(link === assigned) {
            elemSlot = current;
        }
    });

    return elemSlot;

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