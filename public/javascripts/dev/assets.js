let chart;
// let title           = 'Activity Dashboard';
let enableMarkup    = false;
let fieldIdsMarkup  = [];
let wsConfig        = { 
    'id'                    : null,
    'sections'              : [],
    'excludedSections'      : [],
    'workflowHistory'       : {},
    'fields'                : [],
    'progress'              : null,
    'icon'                  : 'account_tree',
    'fieldIdSubtitle'       : '',
    'fieldIdItem'           : '',
    'tableauName'           : '',
    'tableauLink'           : '',
    'imageFieldsPrefix'     : 'MARKUP_'
}
let wsConfigBrowser = {
    'id' : '95',
    'viewName' : 'Product Browser',
    'tableau'               : ''
}

const locations = [
    '1600 Amphitheatre Parkway, Mountain View, CA',
    '2300 Traverwood Dr. Ann Arbor, MI',
    '76 Ninth Avenue, New York, NY'
];


$(document).ready(function() {

    for(profile of config.dashboard) {

        if(wsId === profile.wsId.toString()) {

            wsConfig.id          = profile.wsId.toString();
            wsConfig.progress    = profile.progress;
            wsConfig.fieldIdItem = profile.fieldIdItem;
            wsConfig.tableauName = (profile.title.length < 31) ? profile.title : 'Process Dashboard';

            if(!isBlank(profile.icon)) wsConfig.icon = profile.icon;
            if(!isBlank(profile.title)) title = profile.title;
            if(!isBlank(profile.fieldIdSubtitle)) wsConfig.fieldIdSubtitle = profile.fieldIdSubtitle;
            if(!isBlank(profile.workflowHistory)) wsConfig.workflowHistory = profile.workflowHistory;
            if(!isBlank(profile.imageFieldsPrefix)) wsConfig.imageFieldsPrefix = profile.imageFieldsPrefix;

        }

    }


    //AIzaSyCZZ4kX1V8kdHPFELU20cEPeNPKULZrujw

    // $('#header-title').html(title);

    // document.title = title;

    appendProcessing('workflow-history', false);
    appendProcessing('details', false);
    appendProcessing('attachments', false);

    appendNoDataFound('list');
    initMap();

    // appendOverlay(false);

    // setUIEvents();
    // setStatusColumns();
    // setCalendars();
    // setChart();

    // getInitialData();

});




function initMap() {

    console.log('here');

    var locations = [
        // 'Seattle',
        {lat:48.70944696926009, lng: 8.74084482656071, fi:'1100'},
        {lat: -34.397, lng: 150.644},
        {lat: -37.8136, lng: 144.9631},
        {lat: -17.481991883862754, lng : -61.47059973251195}
    ];

    // console.log(document.getElementById('map'));


    // const priceTag = document.createElement("div");

    // priceTag.className = "price-tag";
    // priceTag.textContent = "$2.5M"


    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 2,
      center: locations[0],
      mapId: 'DEMO_MAP_ID'
    });


//     // Create a pin element.

console.log(locations);


    for (let i = 0; i < locations.length; i++) {
    // for (let i = 0; i < 1; i++) {

        console.log(locations[i]);

        let pin = new google.maps.marker.PinElement({
            scale: 1.5,
            background: "#F7D32F",
            id : 10
        });
        

        let marker = new google.maps.marker.AdvancedMarkerElement({
            map : map,
            position: locations[i],
            // map: map,
            content : pin.element,
            gmpClickable: true,
            title : 'A-1111'
            // dmsid : '1234'
            // content: priceTag
        });
        
        marker.addListener("click", (e) => {
        // }).addListener("click", ({fi}) => {
        // }).addListener("click", ({ e, domEvent, latLng }) => {
                // map.setZoom(8);
                // // console.log(domEvent);
                // console.log(latLng);
                console.log(e.latLng.lat);
                console.log(e.latLng.lng);
                console.log(e);
                console.log(marker.title);
                // console.log(fi);
                // console.log(this);
                // console.log(this.position);
                // map.setCenter(marker.position);
              });
    }

$('.GMAMP-maps-pin-view').click(function() {
    console.log('hier');
});

    // google.maps.marker.addListener("click", () => {
    //     // map.setZoom(8);
    //     console.log(marker.position);
    //     map.setCenter(marker.position);
    //   });



    // let geocoder = new google.maps.Geocoder();
    // codeAddress(geocoder, map, pin);
}


// function codeAddress(geocoder, map, pin) {
//     geocoder.geocode({'address': 'zollernstrasse 10 deckenpfronn'}, function(results, status) {
//       if (status === 'OK') {

//         // map.setCenter(results[0].geometry.location);
//         // var marker = new google.maps.Marker({
//         //   map: map,
//         //   position: results[0].geometry.location
//         // });

//         new google.maps.marker.AdvancedMarkerElement({
//                     map : map,
//                     position: results[0].geometry.location,
//             //         position: locations[i],
//             //         // map: map,
//                     content : pin.element
//             //         title : 'A-1111'
//             //         // content: priceTag
//                 });



//       } else {
//         alert('Geocode was not successful for the following reason: ' + status);
//       }
//     });
//   }




// Set UI controls
function setUIEvents() {

    $('#side-nav').children().click(function() {
        $(this).siblings().removeClass('selected');
        $(this).addClass('selected');
    });

    $('#side-nav').children().first().click();



    // Toggle panels
    $('.panel.toggle').find('.panel-header').click(function() {
        $(this).closest('.panel').toggleClass('expanded');
        $(this).closest('.panel').toggleClass('collapsed');
    });

    // View Selector
    $('#view').change(function() {
        setSelectedView();
    });

    // Create new item
    $('#continue').click(function() {

        if(!validateForm($('#new-sections'))) {
            showErrorMessage('Cannot Save', 'Field validations faild');
            return;
        }

        $('#overlay').show();

    
        submitCreateForm(wsConfig.id, $('#new-sections'), '', {}, function(response ) {

            let newLink = response.data.split('.autodeskplm360.net')[1];

            openItem(newLink);
            clearFields('new-sections');

        });

    });

    // Item Toolbar Actions
    $('#workflow-actions').change(function() {
        performWorkflowAction();
    });
    $('#bookmark').click(function() {
        toggleBookmark($(this));
    });
    $('#item-close').click(function() {
        $('#item').hide();
    });

    // Upload File
    $('#button-upload').click(function() {
    
        let link = $('#item').attr('data-link');

        let urlUpload = '/plm/upload/';
            urlUpload += link.split('/')[4] + '/';
            urlUpload += link.split('/')[6];
    
        $('#uploadForm').attr('action', urlUpload);    
        $('#select-file').click();
        
    }); 
    $('#select-file').change(function() {
        $('#attachments-list').hide();
        $('#attachments-processing').show();
        $('#uploadForm').submit();
    });
    $('#frame-download').on('load', function() {
        console.log('hier');
        console.log($('#item').attr('data-link'));
        $('#attachments-list').show();
        $('#attachments-processing').hide();
        insertAttachments($('#item').attr('data-link'));
    });

}


// Set UI Elements
function setStatusColumns() {

    let elemParent = $('#progress')

    for(state of wsConfig.progress) {

        let elemState = $('<div></div>');
            elemState.appendTo(elemParent);

        let elemStateTitle = $('<div></div>');
            elemStateTitle.html(state.label);
            elemStateTitle.css('background-color', state.color);
            elemStateTitle.addClass('progress-title');
            elemStateTitle.appendTo(elemState);
        
        let elemStateList = $('<div></div>');
            elemStateList.addClass('progress-column');
            elemStateList.addClass('list');
            elemStateList.addClass('surface-level-2');
            elemStateList.addClass('tiles');
            elemStateList.addClass('l');
            elemStateList.attr('data-states', state.states);
            elemStateList.attr('data-label', state.label);
            elemStateList.attr('data-color', state.color);
            elemStateList.appendTo(elemState);

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
    $('#list-no-data').addClass('hidden');

    let view = $('#view').val();
    $('#' + view).css('display', 'flex');

    if($('#' + view).children().length === 0) $('#list-no-data').removeClass('hidden');

}


// Retrieve WS configuration & data
function getInitialData() {

    let promises = [
        $.get('/plm/sections' , { 'wsId' : wsConfig.id }),
        $.get('/plm/fields'   , { 'wsId' : wsConfig.id }),
        $.get('/plm/tableaus' , { 'wsId' : wsConfig.id }),
    ];

    Promise.all(promises).then(function(responses) {

        wsConfig.sections = responses[0].data;
        wsConfig.fields   = responses[1].data;

        for(tableau of responses[2].data) {
            if(tableau.title === wsConfig.tableauName) {
                wsConfig.tableauLink = tableau.link;
            }
        }

        for(field of wsConfig.fields) {
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

        if(!enableMarkup) $('body').addClass('no-markup');

        insertItemDetailsFields('', 'new', wsConfig.sections, wsConfig.fields, null, true, true, true, wsConfig.excludedSections);

        $('#new-sections').find('.field.required').each(function() {
            $(this).css('display', 'flex');
        });
        $('#new-sections').find('.field.editable').each(function() {
            if($(this).children('.field-value').attr('data-id') === wsConfig.fieldIdItem) $(this).css('display', 'flex');
        });

        if(wsConfig.tableauLink === '') {

            let params = {
                'wsId'      : wsConfig.id, 
                'name'      : wsConfig.tableauName,
                'columns'   : ['descriptor', 'created_on', 'last_modified_on', 'wf_current_state']
            }

            if(!isBlank(wsConfig.fieldIdSubtitle)) params.columns.push(wsConfig.fieldIdSubtitle);

            $.post('/plm/tableau-add', params, function(response) {
                $.get('/plm/tableaus', { 'wsId' : wsConfig.id }, function(response) {
                    for(tableau of response.data) {
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
        $.get('/plm/tableau-data', { 'link' : wsConfig.tableauLink }),
        $.get('/plm/mow', {}),
        $.get('/plm/recent', {}),
        $.get('/plm/bookmarks', {})
    ];

    Promise.all(requests).then(function(responses) {

        $('#overlay').hide();

        // if(responses[1].data.outstandingWork.length     === 0) $('#mow-no-data').removeClass('hidden');
        // if(responses[2].data.recentlyViewedItems.length === 0) $('#recents-no-data').removeClass('hidden');
        // if(responses[3].data.bookmarks.length           === 0) $('#bookmarks-no-data').removeClass('hidden');

        let elemTable = $('#calendar-table-body');
            elemTable.html('');

        for(item of responses[0].data.items) {

            let status          = item.fields[3].value;
            let descriptor      = item.fields[0].value;
            let subtitle        = (isBlank(wsConfig.fieldIdSubtitle)) ? '' : item.fields[4].value;
            let elemTile        = genTile(item.item.link, '', '', wsConfig.icon, descriptor, subtitle);
            let valueCreated    = item.fields[1].value;
            let valueModified   = item.fields[2].value;
            let statusColor     = 'transparent';
            let dateNow         = new Date();
            let diffCreated     = 0;
            let diffModified    = 0;
            let dateCreated;

            appendTileDetails(elemTile, [
                ['with-icon icon-start'  , 'Created on ' + item.fields[1].value      , false],
                ['with-icon icon-calendar', 'Last update on ' + item.fields[2].value  , false]
            ]);

            let elemTileStatus = $('<div></div>');
                elemTileStatus.appendTo(elemTile);
                elemTileStatus.addClass('tile-status');
                elemTileStatus.css('background-color', statusColor);
            
            let elemTileStatusLabel = $('<div></div>');
                elemTileStatusLabel.appendTo(elemTileStatus);
                elemTileStatusLabel.addClass('tile-status-label');

            if(!isBlank(valueCreated)) {

                if(valueCreated.indexOf('.') > -1) {
                    let split = valueCreated.split('.');
                    valueCreated = split[1] + '/' + split[0] + '/' + split[2];
 
                }
                dateCreated  = new Date(valueCreated);
                diffCreated = dateNow.getTime() - dateCreated.getTime();
                diffCreated = diffCreated / (1000 * 3600 * 24);
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
                    elemTileStatus.css('background-color', $(this).attr('data-color'));
                    elemTileStatusLabel.html($(this).attr('data-label'));
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

            let elemCellTitle = $('<td></td>');
                elemCellTitle.html(item.fields[0].value);
                elemCellTitle.appendTo(elemRow);

            let elemCellCreatedOn = $('<td></td>');
                elemCellCreatedOn.html(valueCreated);
                elemCellCreatedOn.appendTo(elemRow);

            let elemCellModifiedOn = $('<td></td>');
                elemCellModifiedOn.html(valueModified);
                elemCellModifiedOn.appendTo(elemRow);

            let elemCellStatus = $('<td></td>');
                elemCellStatus.html(status);
                elemCellStatus.appendTo(elemRow);

            $('.calendar-day').each(function() {
                let date = new Date($(this).attr('data-date'));

                if(date.getTime() === dateCreated.getTime()) {
                    $(this).addClass('calendar-highlight');
                }

            });


        }

        setSelectedView();

        $('.tile').click(function() { openItem($(this).attr('data-link')); });

        // $('#chart').css('height', response.data.length * 32 + 'px');
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


// Retrieve browser data
function getBrowserData() {

    let elemList = $('#browser-list');

    $.get('/plm/tableau-data', { 'link' : wsConfigBrowser.tableau, 'size' : 500 }, function(response) {


        for(let item of response.data.items) {

            let title = '';
            let subtitle = '';
            let image = '';
    
            for(field of item.fields) {
                if(field.id === 'NUMBER') title = field.value;
                else if(field.id === 'TITLE') subtitle = field.value;
                else if(field.id === 'IMAGE') {
                    // image = field.value;
                    let temp = item.item.link.split('/');
                    image = '/api/v2/workspaces/' + temp[4] + '/items/' + temp[6] + '/field-values/' + field.id + '/image/' + field.value;
                }
            }

            console.log(image);

            let elemTile = genTile(item.item.link, '', image, 'folder', title, subtitle);
            elemTile.appendTo(elemList);
        }

        // let elemTable = $('#calendar-table-body');
        //     elemTable.html('');

        // for(item of response.data) {

        //     let status          = item.fields[3].value;
        //     let descriptor      = item.fields[0].value.split(' - ');
        //     let elemTile        = genTile(item.item.link, '', '', wsConfig.icon, descriptor[0], descriptor[1]);
        //     let valueCreated    = item.fields[1].value;
        //     let valueModified   = item.fields[2].value;
        //     let dateNow         = new Date();
        //     let diffCreated     = 0;
        //     let diffModified    = 0;
        //     let dateCreated;
            
        //     if(!isBlank(valueCreated)) {
        //         dateCreated  = new Date(valueCreated);
        //         diffCreated = dateNow.getTime() - dateCreated.getTime();
        //         diffCreated = diffCreated / (1000 * 3600 * 24);
        //         valueCreated = dateCreated.toLocaleDateString();
        //     }
            
        //     if(!isBlank(valueModified)) {
        //         let dateModified = new Date(valueModified);
        //         diffModified = dateNow.getTime() - dateModified.getTime();
        //         diffModified = diffModified / (1000 * 3600 * 24);
        //         valueModified = dateModified.toLocaleDateString();
        //     }

        //     if(isBlank(item.fields[2].value)) diffModified = diffCreated;

        //     $('.progress-column').each(function() {
        //         let states = $(this).attr('data-states').split(',');
        //         if(states.indexOf(status) > -1) {
        //             $(this).append(elemTile);
        //         }
        //     });

        //     elemTile.click(function() { openItem($(this).attr('data-link')); });

        //     chart.data.labels.push(descriptor[0]);
        //     chart.data.datasets[0].data.push(diffCreated);
        //     chart.data.datasets[1].data.push(diffModified);

        //     let elemRow = $('<tr></tr>');
        //         elemRow.appendTo(elemTable);
        //         elemRow.attr('data-date', dateCreated);
        //         elemRow.attr('data-link', item.item.link);
        //         elemRow.click(function() { openItem($(this).attr('data-link')); });

        //     let elemCellTitle = $('<td></td>');
        //         elemCellTitle.html(item.fields[0].value);
        //         elemCellTitle.appendTo(elemRow);

        //     let elemCellCreatedOn = $('<td></td>');
        //         elemCellCreatedOn.html(valueCreated);
        //         elemCellCreatedOn.appendTo(elemRow);

        //     let elemCellModifiedOn = $('<td></td>');
        //         elemCellModifiedOn.html(valueModified);
        //         elemCellModifiedOn.appendTo(elemRow);

        //     let elemCellStatus = $('<td></td>');
        //         elemCellStatus.html(status);
        //         elemCellStatus.appendTo(elemRow);

        //     $('.calendar-day').each(function() {
        //         let date = new Date($(this).attr('data-date'));

        //         if(date.getTime() === dateCreated.getTime()) {
        //             $(this).addClass('calendar-highlight');
        //         }

        //     });


        // }

        // $('#chart').css('height', response.data.length * 32 + 'px');
        // $('.calendar-day-current').click();

        // chart.update();

    });

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

    $('#item-descriptor').html('');
    $('#item-status').html('');
    $('#workflow-history-events').html('');
    $('#markup-list').html('');
    $('#summary').find('span').html('');
    $('#item').attr('data-link', link);
    $('#item').show();
    $('#workflow-history-processing').show();
    $('#details-processing').show();
    $('body').addClass('no-viewer');

    viewerUnloadAllModels();
    insertWorkflowActions(link, null, true);

    $.get('/plm/details', { 'link' : link }, function(response) {

        $('#item-descriptor').html(response.data.title);
        $('#overlay').hide();
        
        let status      = response.data.currentState.title;
        let linkItem    = getSectionFieldValue(response.data.sections, wsConfig.fieldIdItem, '', 'link');
        let elemStatus  = $('#item-status');
        let statusId    = response.data.currentState.link.split('/').pop();

        insertWorkflowHistory(link, null, status, statusId, wsConfig.workflowHistory.excludedTransitions, wsConfig.workflowHistory.finalStates, wsConfig.workflowHistory.showNextActions);
        insertViewer(linkItem);
        
        for(state of wsConfig.progress) {
            if(state.states.indexOf(status) > -1) {
                elemStatus.html(state.label);
                elemStatus.css('background-color', state.color);
            }
        }

        if(enableMarkup) {
            for(fieldId of fieldIdsMarkup) {

                let elemMarkup = $('<canvas></canvas>');
                    elemMarkup.attr('id', fieldId);
                    elemMarkup.attr('data-fieldid', fieldId);
                    elemMarkup.addClass('markup');
                    elemMarkup.addClass('placeholder');
                    elemMarkup.appendTo($('#markup-list'));
                    elemMarkup.click(function() {
                        selectMarkup($(this));
                    });

                let value = getSectionFieldValue(response.data.sections, fieldId, '', 'link');

                if(value !== '') {

                    $.get('/plm/image-cache', {
                        'link' : value,
                        'fieldId' : fieldId
                    }, function(response) {


                        console.log(response);

                        $('#' + response.params.fieldId).removeClass('placeholder');

                        let canvas = document.getElementById(response.params.fieldId);
                            canvas.width = 200;
                            canvas.height = 100;

                        let ctx  = canvas.getContext('2d');
                        let img = new Image();
                            img.src = response.data.url;
                            img.onload = function() {
                                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            };
                    
                    });

                }
            }
        }

    });

    $.get('/plm/change-summary', { 'link' : link }, function(response) {
    
        let dateCreated  = new Date(response.data.createdOn);
        let dateModified = '';
        let userModified = '';

        if(!isBlank(response.data.lastModifiedOn)) dateModified = new Date(response.data.lastModifiedOn).toLocaleDateString();
        if(!isBlank(response.data.lastModifiedBy)) userModified = response.data.lastModifiedBy.displayName;

        $('#created-by').html(response.data.createdBy.displayName);
        $('#created-on').html(dateCreated.toLocaleDateString());
        $('#modified-by').html(userModified);
        $('#modified-on').html(dateModified);

        $('#overlay').hide();

    });

    getBookmarkStatus(link);
    insertAttachments(link);
    insertItemDetailsFields(link, 'details', wsConfig.sections, wsConfig.fields, null, true, false, false, wsConfig.excludedSections);

}


// Perform Workflow Transitions
function performWorkflowAction() {

    $('#overlay').show();

    let link = $('#item').attr('data-link');

    $.get('/plm/transition', { 'link' : link, 'transition' : $('#workflow-actions').val()}, function() {
        $('#overlay').hide();
        openItem(link);
    });

}

// Viewer
function selectMarkup(elemClicked) {

    elemClicked.siblings().removeClass('selected');
    elemClicked.toggleClass('selected');
    if(elemClicked.hasClass('selected')) {
        if($('#viewer-markup-toolbar').hasClass('hidden')) {
            $('#my-markup-button').click();
        }
    } else if(!$('#viewer-markup-toolbar').hasClass('hidden')) {
        viewerLeaveMarkupMode();
    }


}
function initViewerDone() {

    if(enableMarkup) viewerAddMarkupControls(true);

}
function viewerSaveMarkup() {

    let fieldId = $('.markup.selected').first().attr('id');

    $('#overlay').show();

    viewerCaptureScreenshot(fieldId, function() {

        let elemMarkupImage = $('#' + fieldId);

        let params = { 
            'link'      : $('#item').attr('data-link'),
            'image'     : {
                'fieldId' : fieldId,
                'value'   : elemMarkupImage[0].toDataURL('image/jpg')
            }
        };

        $.post({
            url         : '/plm/upload-image', 
            contentType : 'application/json',
            data        : JSON.stringify(params)
        }, function() {
            $('#overlay').hide();
            elemMarkupImage.removeClass('placeholder');
        });

    });

}