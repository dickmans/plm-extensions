let listItems = [];
let wsConfig  = {}


$(document).ready(function() {
    
    setUIEvents();
    insertResults('277', [{
        field       : 'ID',       
        type        : 0,
        comparator  : 21,
        value       : ''
    }],{
        id              : 'items',
        headerLabel     : 'Assets List',
        layout          : 'list',
        onClickItem     : function(elemClicked) { clickItem(elemClicked); },
        afterCompletion : function(id) { afterItemsCompletion(id); }
    });

});

function setUIEvents() { 

    $('#toggle-details').click(function() {
        $(this).toggleClass('filled').toggleClass('icon-toggle-on').toggleClass('icon-toggle-off');
        $('body').toggleClass('no-details');
    });

    $('#block-earliest').click(function() {
        autoAssign('earliest');
    });
    $('#block-latest').click(function() {
        autoAssign('latest');
    });
    $('#block-sequence').click(function() {
        autoAssign('sequence');
    });

}


// Once the list of items got loaded, extend the tile display
function afterItemsCompletion(id) {

    $('#' + id + '-content').children().each(function() {

        let elemTile = $(this);

        listItems.push({
            title : elemTile.attr('data-title'),
            link  : elemTile.attr('data-link')
        });

        $('<div></div>').appendTo(elemTile)
            .addClass('tile-slot')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                removeFromSlot($(this));
            });

    });

    insertCalendar();

}


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