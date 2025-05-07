let chart;
let title           = 'PLM Browser';
let profileSettings = null;


$(document).ready(function() {

    profileSettings = getProfileSettings(config.browser, wsId);

    setUIEvents();

    // insertFlatBOM('/api/v3/workspaces/57/items/17149', { ranges : false,  counters : true,
    //     totals : true, compactDisplay : true,   
    //      filterSelected : true,
    //       filterEmpty:true, 
    //       bomViewName : 'Service', 
    //       viewSelector : true, 
    //       hideDetails : false, 
    //       number : true, 
    //       descriptor : true, 
    //       tableHeaders: true,
    //        editable : false,
    //         multiSelect : true, 
    //          'quantity' : true , 
    //          'editable' : true}
    //         );


    if(isBlank(profileSettings)) {

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

        if(isBlank(profileSettings.title)) profileSettings.title = title;

        $('#header-title').html(profileSettings.title);

        document.title = profileSettings.title;

        insertRecentItems({ 
            headerLabel     : 'Your Recent Items', 
            size            : 'xxs',
            workspacesIn    : [profileSettings.wsId] 
        });
        
        insertBookmarks({ 
            headerLabel     : 'Your Pinned Items', 
            size            : 'xxs',
            tileCounter     : true,
            workspacesIn    : [profileSettings.wsId] 
        });

        getInitialData();

    }

});


// Set UI controls
function setUIEvents() {


    // Toggle panel with Recents & Bookmarks
    $('#toggle-panel').click(function() { 
        $('body').toggleClass('no-panel'); 
        $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off');
    })


    // Perform Search
    $('#filters-submit').click(function() {
        performSearch();
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

}


// Get workspace configuration
function getInitialData() {

    let promises = [
        $.get('/plm/fields'     , { 'wsId' : profileSettings.wsId })
    ];

    Promise.all(promises).then(function(responses) {
        insertFilters(responses[0].data);
    });

}
function insertFilters(fields) {

    let filtersList = $('#filters-list');

    for(let filter of profileSettings.filters) {
        for(let field of fields) {

            let fieldId = field.__self__.split('/')[8];

            if(fieldId === filter)    {

                let elemFilter = $('<div></div>').appendTo(filtersList)
                    .addClass('filter')
                    .attr('data-id', fieldId)

                $('<div></div>').appendTo(elemFilter)
                    .addClass('filter-name')    
                    .html(field.name);

                let elemFilterValue = $('<div></div>').appendTo(elemFilter)
                    .addClass('filter-value');

                if(!isBlank(field.picklist)) {

                        let elemSelect = $('<select>').appendTo(elemFilterValue)
                            .addClass('button')
                            .addClass('filter-select');

                        $('<option></option>').appendTo(elemSelect)
                        .attr('value', null);


                        getOptions(elemSelect, field.picklist, fieldId, 'select', '');


                } else if(field.type.title === 'Single Line Text') {

                    // let elemToggles = $('<div></div>').appendTo(elemFilterValue)
                    //     .addClass('filter-value-toggles');

                    // $('<div></div>').appendTo(elemToggles)
                    //     .addClass('icon')
                    //     .addClass('icon-equals')
                    //     .addClass('selected');

                    // $('<div></div>').appendTo(elemToggles)
                    //     .addClass('icon')
                    //     .addClass('icon-starts-with');

                    // $('<div></div>').appendTo(elemToggles)
                    //     .addClass('icon')
                    //     .addClass('icon-ends-with');

                    // $('<div></div>').appendTo(elemToggles)
                    //     .addClass('icon')
                    //     .addClass('icon-contains');

                    // $('<div></div>').appendTo(elemToggles)
                    //     .html('empty');

                    // $('<div></div>').appendTo(elemToggles)
                    //     .html('not-empty');


                    elemFilterValue.addClass('filter-text');

                    $('<input>').appendTo(elemFilterValue)
                        .addClass('filter-input-start')
                        .attr('placeholder', 'Starts With');
                    
                    $('<input>').appendTo(elemFilterValue)
                    .addClass('filter-input-contain')
                        .attr('placeholder', 'Contains');
                    
                    $('<input>').appendTo(elemFilterValue)
                        .addClass('filter-input-end')
                        .attr('placeholder', 'Ends With');

                } else if(field.type.title === 'Integer') {

                    elemFilterValue.addClass('filter-numeric');

                    $('<input>').appendTo(elemFilterValue)
                        .addClass('filter-input-min')
                        .attr('placeholder', 'Min');
                    
                    $('<input>').appendTo(elemFilterValue)
                    .addClass('filter-input-match')
                        .attr('placeholder', 'Is');
                    
                    $('<input>').appendTo(elemFilterValue)
                        .addClass('filter-input-max')
                        .attr('placeholder', 'Max');

                }else {
                    console.log(field);
                }

            }  

        }
    }

    $('#filters').find('input').each(function() {
        $(this).keypress(function(e) {
            if(e.which == 13) {
                performSearch();
            }
        });
    });

}


// Perform Search
function performSearch() {

    let filters = [];

    $('.filter-value').each(function() {

        let fieldId = $(this).closest('.filter').attr('data-id');

        $(this).children().each(function() {

            let value = $(this).val();

            if(!isBlank(value)) {

                let comparator = 5;

                if($(this).hasClass('filter-select')) {
                    comparator = 15;
                    value = $(this).children(':selected').text();
                } else if($(this).hasClass('filter-input-start')) {
                    comparator = 3;
                } else if($(this).hasClass('filter-input-contain')) {
                    comparator = 2;
                } else if($(this).hasClass('filter-input-end')) {
                    comparator = 4;
                } else if($(this).hasClass('filter-input-min')) {
                    comparator = 9;
                    value = Number(value) - 1;
                } else if($(this).hasClass('filter-input-max')) {
                    comparator = 10;
                    value = Number(value) + 1;
                }

                filters.push({
                    field       : fieldId,
                    type        : 0,
                    comparator  : comparator,
                    value       : value
                });

            }
        });
    

    });

    profileSettings.fields.push('TITLE');

    insertResults(profileSettings.wsId, filters, {
        sort        : profileSettings.sort,
        fields      : profileSettings.fields,
        openInPLM   : true,
        search      : true,
        hideDetails : false,
        multiSelect : true,
        tableHeaders: true,
        descriptor  : true,
        ranges      : false,
        number      : false,
        editable    : true,
        filterEmpty : true,
        compactDisplay : true,
        filterSelected : true,
        counters    : true,
        totals  : false
    });

}


// Open Selected Item
function clickRecentItem(elemClicked)   { openSelectedItem(elemClicked); }
function clickBookmarkItem(elemClicked) { openSelectedItem(elemClicked); }
function clickListItem(elemClicked)     { openSelectedItem(elemClicked); }
function openSelectedItem(elemClicked)  {
    
    showSummary(elemClicked, {
        statesColors        : profileSettings.statesColors,
        additionalView      : 'relationships',
        openInPLM           : true,
        workflowActions     : true,
        reload              : true,
        editable            : true,
        hideComputed        : true,
        suppressLinks       : true,
        classContents       : 'surface-level-1',
        relationshipsLayout : 'table'
    });

}