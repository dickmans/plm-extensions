// Insert user's MY OUTSTANDING WORK (filter for defined workspaces if needed)
function insertMOW(params) {

    //  Set defaults for optional parameters
    // --------------------------------------
    let id           = 'mow';                   // id of DOM element where the list will be inserted
    let header       = true;                    // Hide header with setting this to false
    let headerLabel  = 'My Outstanding Work';   // Set the header text
    let headerToggle = false;                   // Enable header toggles
    let reload       = true;                    // Enable reload button for the list
    let search       = true;                    // Enable search within the list
    let icon         = 'mow';                   // Sets the icon to be displayed for each tile
    let size         = 'm';                     // layout size (xxs, xs, s, m, l, xl, xxl)
    let workspacesIn = [];                      // List of workspace IDs to be included. Items from other workspaces will not be shown.
    let workspacesEx = [];                      // List of workspace IDs to be excluded. Items of these workspaces will not be shown.

    if( isBlank(params)             )       params = {};
    if(!isBlank(params.id)          )           id = params.id;
    if(!isBlank(params.header)      )       header = params.header;
    if(!isBlank(params.headerLabel) )  headerLabel = params.headerLabel;
    if(!isBlank(params.headerToggle)) headerToggle = params.headerToggle;
    if(!isBlank(params.reload)      )       reload = params.reload;
    if(!isBlank(params.search)      )       search = params.search;
    if(!isBlank(params.icon)        )         icon = params.icon;
    if(!isBlank(params.size)        )         size = params.size;
    if(!isBlank(params.workspacesIn)) workspacesIn = params.workspacesIn;
    if(!isBlank(params.workspacesEx)) workspacesEx = params.workspacesEx;

    settings.mow[id]              = {};
    settings.mow[id].icon         = icon;
    settings.mow[id].workspacesIn = workspacesIn;
    settings.mow[id].workspacesEx = workspacesEx;

    let elemParent = $('#' + id)
        .addClass('mow')
        .html('')
        .show();

    if(header) {

        let elemHeader = $('<div></div>', {
            id : id + '-header'
        }).appendTo(elemParent).addClass('panel-header');
    
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
    
        let elemToolbar = $('<div></div>')
            .addClass('panel-toolbar')
            .attr('id', id + '-toolbar');
    
        if(reload) {

            elemToolbar.appendTo(elemHeader);
            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-refresh')
                .attr('id', id + '-reload')
                .attr('title', 'Reload this list')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    insertMOWData(id);
                });

        }

        if(search) {

            elemToolbar.appendTo(elemHeader);

            let elemSearch = $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('with-icon')
                .addClass('icon-search-list');

            $('<input></input>').appendTo(elemSearch)
                .attr('placeholder', 'Search')
                .attr('id', id + '-search-input')
                .addClass('mow-search-input')
                .keyup(function() {
                    searchInMOW(id, $(this));
                });

        }
    
    
    } else { elemParent.addClass('no-header'); }

    appendProcessing(id, false);
    appendNoDataFound(id, 'icon-no-data', 'No Entries');

    $('#' + id + '-no-data').hide();

    $('<div></div>').appendTo(elemParent)
        .attr('id', id + '-list')
        .addClass('panel-content')
        .addClass('mow-list')
        .addClass('no-scrollbar')
        .addClass(size);

    insertMOWData(id);

}
function insertMOWData(id) {

    let timestamp  = new Date().getTime();
    let elemParent = $('#' + id)
    let elemList   = $('#' + id + '-list');  
    let elemSearch = $('#' + id + '-search-input')

    elemParent.attr('data-timestamp', timestamp);
    elemList.hide();

    if(elemSearch.length > 0) elemSearch.val('');

    $('#' + id + '-processing').show();

    $.get('/plm/mow', { 'timestamp' : timestamp }, function(response) {

        if(response.params.timestamp === $('#' + id).attr('data-timestamp')) {

            elemList.html('');
            
            let elemTable = $('<div></div>').appendTo(elemList) 
                .attr('id', id + '-table')
                .addClass('mow-table');

            let counter = 0;

            for(item of response.data.outstandingWork) {

                let dateClass   = '';
                let date        = '';
                let workspace   = item.workspace.title;
                let workspaceId = item.workspace.link.split('/')[4];

                if((settings.mow[id].workspacesIn.length === 0) || ( settings.mow[id].workspacesIn.includes(workspaceId))) {
                    if((settings.mow[id].workspacesEx.length === 0) || (!settings.mow[id].workspacesEx.includes(workspaceId))) {

                        counter++;

                        if(item.hasOwnProperty('milestoneDate')) {
                            let targetDate = new Date(item.milestoneDate);
                            date = targetDate.toLocaleDateString();
                            dateClass = 'in-time';
                        }
                        if(item.hasOwnProperty('milestoneStatus')) {
                            if(item.milestoneStatus === 'CRITICAL') dateClass = 'late';
                        }

                        let elemItem = $('<div></div>').appendTo(elemTable)
                            .addClass('mow-row')
                            .attr('data-link', item.item.link)
                            .attr('data-title', item.item.title)
                            .click(function(e) { 
                                e.preventDefault();
                                e.stopPropagation();
                                clickMOWItem($(this), e);
                            });

                        $('<div></div>').appendTo(elemItem)
                            .addClass('mow-icon')
                            .addClass('icon')
                            .addClass('icon-' + settings.mow[id].icon);

                        $('<div></div>').appendTo(elemItem)
                            .addClass('link')
                            .addClass('nowrap')
                            .addClass('mow-descriptor')
                            .html(item.item.title);

                        $('<div></div>').appendTo(elemItem)
                            .addClass('mow-date')
                            .addClass(dateClass)
                            .html(date);

                        $('<div></div>').appendTo(elemItem)
                            .addClass('mow-status')
                            .addClass('nowrap')
                            .html(item.workflowStateName);
                            
                        $('<div></div>').appendTo(elemItem)
                            .addClass('mow-workspace')
                            .addClass('nowrap')
                            .html(workspace);

                    }
                }

            }

            elemList.show();
            $('#' + id + '-processing').hide();
            $('#' + id + '-mow-ounter').html(counter);
            if(counter === 0) $('#' + id + '-no-data').show();
            insertMOWDone(id, response);

        }

    });

}
function insertMOWDone(id, data) {}
function clickMOWItem(elemClicked, e) {
    openItemByLink(elemClicked.attr('data-link'));
}
function searchInMOW(id, elemInput) {

    let elemTable   = $('#' + id + '-table');
    let filterValue = elemInput.val().toLowerCase();

    if(filterValue === '') {
       
        elemTable.children().show();

    } else {

        elemTable.children().hide();

        elemTable.children().each(function() {

            let elemRow = $(this);
            let unhide  = false;

            elemRow.children().each(function() {
                let text = $(this).html().toLowerCase();
                if(text.indexOf(filterValue) > -1) unhide = true;
            });

            if(unhide) elemRow.show();

        });

    }

}



// Insert user's RECENTLY VIEWED ITEMS (filter for defined workspaces if needed)
function insertRecentItems(params) {

    //  Set defaults for optional parameters
    // --------------------------------------
    let id           = 'recents';               // id of DOM element where the list will be inserted
    let header       = true;                    // Hide header with setting this to false
    let headerLabel  = 'Recently Viewed Items'; // Set the header text
    let headerToggle = false;                   // Enable header toggles
    let reload       = true;                    // Enable reload button for the list
    let icon         = 'icon-history';          // Sets the icon to be displayed for each tile
    let images       = true;                    // Display first image field as tile image
    let size         = 'xs';                    // layout size (xxs, xs, s, m, l, xl, xxl)
    let workspacesIn = [];                      // List of workspace IDs to be included. Items from other workspaces will not be shown.
    let workspacesEx = [];                      // List of workspace IDs to be excluded. Items of these workspaces will not be shown.

    if( isBlank(params)             )       params = {};
    if(!isBlank(params.id)          )           id = params.id;
    if(!isBlank(params.header)      )       header = params.header;
    if(!isBlank(params.headerLabel) )  headerLabel = params.headerLabel;
    if(!isBlank(params.headerToggle)) headerToggle = params.headerToggle;
    if(!isBlank(params.reload)      )       reload = params.reload;
    if(!isBlank(params.icon)        )         icon = params.icon;
    if(!isBlank(params.images)      )       images = params.images;
    if(!isBlank(params.size)        )         size = params.size;
    if(!isBlank(params.workspacesIn)) workspacesIn = params.workspacesIn;
    if(!isBlank(params.workspacesEx)) workspacesEx = params.workspacesEx;

    settings.recents[id]              = {};
    settings.recents[id].icon         = icon;
    settings.recents[id].images       = images;
    settings.recents[id].workspacesIn = workspacesIn;
    settings.recents[id].workspacesEx = workspacesEx;

    let elemParent = $('#' + id)
        .addClass('recents')
        .html('')        
        .show();

    if(header) {

        let elemHeader = $('<div></div>', {
            id : id + '-header'
        }).appendTo(elemParent).addClass('panel-header');
    
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
    
        let elemToolbar = $('<div></div>')
            .addClass('panel-toolbar')
            .attr('id', id + '-toolbar');
    
        if(reload) {

            elemToolbar.appendTo(elemHeader);
            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-refresh')
                .attr('id', id + '-reload')
                .attr('title', 'Reload this list')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    insertRecentItemsData(id);
                });

        }
    
    
    } else { elemParent.addClass('no-header'); }

    appendProcessing(id, false);
    appendNoDataFound(id, 'icon-no-data', 'No Entries');

    $('#' + id + '-no-data').hide();

    $('<div></div>').appendTo(elemParent)
        .attr('id', id + '-list')
        .addClass('recents-list')
        .addClass('no-scrollbar')
        .addClass('panel-content')
        .addClass('tiles')
        .addClass('list')
        .addClass(size);

    insertRecentItemsData(id);

}
function insertRecentItemsData(id) {

    let timestamp  = new Date().getTime();
    let elemParent = $('#' + id)
    let elemList   = $('#' + id + '-list');  

    elemParent.attr('data-timestamp', timestamp);
    elemList.hide();

    $('#' + id + '-processing').show();
    $('#' + id + '-no-data').hide();

    $.get('/plm/recent', { 'timestamp' : timestamp }, function(response) {

        if(response.params.timestamp === $('#' + id).attr('data-timestamp')) {

            elemList.html('');

            let counter = 0;

            for(recent of response.data.recentlyViewedItems) {

                let workspaceId = Number(recent.item.link.split('/')[4]);

                if((settings.recents[id].workspacesIn.length === 0) || ( settings.recents[id].workspacesIn.includes(workspaceId))) {
                    if((settings.recents[id].workspacesEx.length === 0) || (!settings.recents[id].workspacesEx.includes(workspaceId))) {

                        counter++;

                        let elemTile = genTile(recent.item.link, '', '', settings.recents[id].icon, recent.item.title, recent.workspace.title);
                            elemTile.appendTo(elemList);
                            elemTile.click(function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                clickRecentItem($(this), e);
                            });

                        if(settings.recents[id].images) getTileImage(elemTile, settings.recents[id].icon);

                    }
                }

            }

            elemList.show();
            $('#' + id + '-processing').hide();
            $('#' + id + '-counter').html(counter);
            if(counter === 0) $('#' + id + '-no-data').show();
            insertRecentItemsDone(id, response);
            
        }

    });

}
function getTileImage(elemTile, icon) {

    let linkTile = elemTile.attr('data-link');

    if(isBlank(linkTile)) return;

    $.get('/plm/details', { 'link' : linkTile}, function(response) {

        let linkImage  = getFirstImageFieldValue(response.data.sections);

        if(isBlank(linkImage)) return;

        let elemTileImage = elemTile.find('.tile-image').first();
        getImageFromCache(elemTileImage, { 'link' : linkImage }, icon, function() {});

    });
    
}
function insertRecentItemsDone(id, data) {}
function clickRecentItem(elemClicked) {
    openItemByLink(elemClicked.attr('data-link'));
}



// Insert user's BOOKMARKED ITEMS (filter for defined workspaces if needed)
function insertBookmarks(params) {

    //  Set defaults for optional parameters
    // --------------------------------------
    let id           = 'bookmarks';         // id of DOM element where the list will be inserted
    let header       = true;                // Hide header with setting this to false
    let headerLabel  = 'Bookmarked Items';  // Set the header text
    let headerToggle = false;               // Enable header toggles
    let reload       = true;                // Enable reload button for the list
    let tileCounter  = false;               // A counter can be displayed in each tile instead of an icon to let users remember given search results easieer
    let icon         = 'icon-bookmark';     // Sets the icon to be displayed for each tile
    let images       = false;               // Display first image field as tile image
    let size         = 'm';                 // layout size (xxs, xs, s, m, l, xl, xxl)
    let workspacesIn = [];                  // List of workspace IDs to be included. Items from other workspaces will not be shown.
    let workspacesEx = [];                  // List of workspace IDs to be excluded. Items of these workspaces will not be shown.

    if( isBlank(params)             )       params = {};
    if(!isBlank(params.id)          )           id = params.id;
    if(!isBlank(params.header)      )       header = params.header;
    if(!isBlank(params.headerLabel) )  headerLabel = params.headerLabel;
    if(!isBlank(params.headerToggle)) headerToggle = params.headerToggle;
    if(!isBlank(params.reload)      )       reload = params.reload;
    if(!isBlank(params.tileCounter) )  tileCounter = params.tileCounter;
    if(!isBlank(params.icon)        )         icon = params.icon;
    if(!isBlank(params.images)      )       images = params.images;
    if(!isBlank(params.size)        )         size = params.size;
    if(!isBlank(params.workspacesIn)) workspacesIn = params.workspacesIn;
    if(!isBlank(params.workspacesEx)) workspacesEx = params.workspacesEx;

    settings.bookmarks[id]              = {};
    settings.bookmarks[id].tileCounter  = tileCounter;
    settings.bookmarks[id].icon         = icon;
    settings.bookmarks[id].images       = images;
    settings.bookmarks[id].workspacesIn = workspacesIn;
    settings.bookmarks[id].workspacesEx = workspacesEx;    

    let elemParent = $('#' + id)
        .addClass('bookmarks')
        .html('')
        .show();

    if(header) {

        let elemHeader = $('<div></div>', {
            id : id + '-header'
        }).appendTo(elemParent).addClass('panel-header');
    
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
    
        let elemToolbar = $('<div></div>')
            .addClass('panel-toolbar')
            .attr('id', id + '-toolbar');
    
        if(reload) {

            elemToolbar.appendTo(elemHeader);
            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-refresh')
                .attr('id', id + '-reload')
                .attr('title', 'Reload this list')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    insertBookmarksData(id);
                });

        }
    
    
    } else { elemParent.addClass('no-header'); }

    appendProcessing(id, false);
    appendNoDataFound(id, 'icon-no-data', 'No Bookmarks');

    $('#' + id + '-no-data').hide();

    $('<div></div>').appendTo(elemParent)
        .attr('id', id + '-list')
        .addClass('bookmarks-list')
        .addClass('no-scrollbar')
        .addClass('panel-content')
        .addClass('tiles')
        .addClass('list')
        .addClass(size);

    insertBookmarksData(id);
}
function insertBookmarksData(id) {

    let timestamp  = new Date().getTime();
    let elemParent = $('#' + id)
    let elemList   = $('#' + id + '-list');  

    elemParent.attr('data-timestamp', timestamp);
    elemList.hide();

    $('#' + id + '-processing').show();

    $.get('/plm/bookmarks', { 'timestamp' : timestamp }, function(response) {

        if(response.params.timestamp === $('#' + id).attr('data-timestamp')) {

            elemList.html('');

            let counter = 0;

            for(bookmark of response.data.bookmarks) {

                let workspaceId = Number(bookmark.item.link.split('/')[4]);

                if((settings.bookmarks[id].workspacesIn.length === 0) || ( settings.bookmarks[id].workspacesIn.includes(workspaceId))) {
                    if((settings.bookmarks[id].workspacesEx.length === 0) || (!settings.bookmarks[id].workspacesEx.includes(workspaceId))) {

                        counter++;

                        let elemTile = genTile(bookmark.item.link, '', '', settings.bookmarks[id].icon, bookmark.item.title, bookmark.workspace.title);
                            elemTile.appendTo(elemList);
                            elemTile.click(function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                clickBookmarkItem($(this), e);
                            });

                        if(settings.bookmarks[id].tileCounter) {
                            let elemImage = elemTile.find('.tile-image');
                            elemImage.html('');
    
                            $('<div></div>').appendTo(elemImage)
                                .addClass('tile-counter')
                                .html(counter);
                        }

                        if(settings.bookmarks[id].images) getTileImage(elemTile, settings.bookmarks[id].icon);

                    }
                }

            }

            elemList.show();
            $('#' + id + '-processing').hide();
            $('#' + id + '-bookmarks-ounter').html(counter);
            if(counter === 0) $('#' + id + '-no-data').show();
            insertBookmarksDone(id, response);

        }

    });

}
function insertBookmarksDone(id, data) {}
function clickBookmarkItem(elemClicked, e) {
    openItemByLink(elemClicked.attr('data-link'));
}



// Display ALL RECORDS of defined workspace
function insertWorkspaceItems(wsId, params) {

    //  Set defaults for optional parameters
    // --------------------------------------
    let id                  = 'list';           // id of DOM element where the list will be inserted
    let header              = true;             // Hide header with setting this to false
    let headerLabel         = 'Items';          // Set the header text
    let headerToggle        = false;            // Enable header toggles
    let reload              = true;             // Enable reload button for the list
    let search              = true;             // Adds quick filtering using search input on top of the list
    let icon                = 'icon-settings';  // Tile icon to use if no image is available
    let size                = 's';              // layout size (xxs, xs, s, m, l, xl, xxl)
    let filter              = '';               // Define optional filters by providing the matching query string (copy the full query string from advanced search)
    let sortBy              = '';               // Field ID to use for sorting (if parameter is omitted, items will be sorted by descriptor automatically)
    let groupBy             = '';               // Field ID to use for grouping of items (leave blank to disable grouping)
    let fieldIdImage        = '';               // ID of field to use as tile image
    let fieldIdTitle        = '';               // ID of field to use as tile title
    let fieldIdSubtitle     = '';               // ID of field to use as tile subtitle
    let fieldIdsDetails     = [];               // List of field IDs to be displayed as tile details
    let fieldIdsAttributes  = [];               // List of field IDs whose values will be stored in the DOM attributes of the tiles to allow for further user interactions

    if(isBlank(wsId)) return;
    if(isBlank(params)) params = {};

    if(!isBlank(params.id)                )                 id = params.id;
    if(!isBlank(params.header)            )             header = params.header;
    if(!isBlank(params.headerLabel)       )        headerLabel = params.headerLabel;
    if(!isBlank(params.headerToggle)      )       headerToggle = params.headerToggle;
    if(!isBlank(params.reload)            )             reload = params.reload;
    if(!isBlank(params.search)            )             search = params.search;
    if(!isBlank(params.icon)              )               icon = params.icon;
    if(!isBlank(params.size)              )               size = params.size;
    if(!isBlank(params.filter)            )             filter = params.filter;
    if(!isBlank(params.sortBy)            )             sortBy = params.sortBy;            
    if(!isBlank(params.groupBy)           )            groupBy = params.groupBy;           
    if(!isBlank(params.fieldIdImage)      )       fieldIdImage = params.fieldIdImage;      
    if(!isBlank(params.fieldIdTitle)      )       fieldIdTitle = params.fieldIdTitle;      
    if(!isBlank(params.fieldIdSubtitle)   )    fieldIdSubtitle = params.fieldIdSubtitle;   
    if(!isBlank(params.fieldIdsDetails)   )    fieldIdsDetails = params.fieldIdsDetails;   
    if(!isBlank(params.fieldIdsAttributes)) fieldIdsAttributes = params.fieldIdsAttributes;


    let elemParent = $('#' + id)
        .addClass('workspace-items')
        .html('');

    if(elemParent.length === 0) {
        showErrorMessage('View Definition Error', 'Could not find view element with id "' + id + '" in page. Please contact your administrator');
        return;
    }

    let surfaceLevel = getSurfaceLevel(elemParent);

    settings.workspaceItems[id]                     = {};
    settings.workspaceItems[id].wsId                = wsId;
    settings.workspaceItems[id].filter              = filter;
    settings.workspaceItems[id].icon                = icon;
    settings.workspaceItems[id].size                = size;
    settings.workspaceItems[id].filter              = filter;
    settings.workspaceItems[id].sortBy              = sortBy;
    settings.workspaceItems[id].groupBy             = groupBy;
    settings.workspaceItems[id].fieldIdImage        = fieldIdImage;
    settings.workspaceItems[id].fieldIdTitle        = fieldIdTitle;
    settings.workspaceItems[id].fieldIdSubtitle     = fieldIdSubtitle;
    settings.workspaceItems[id].fieldIdsDetails     = fieldIdsDetails;
    settings.workspaceItems[id].fieldIdsAttributes  = fieldIdsAttributes;
    settings.workspaceItems[id].surfaceLevel        = surfaceLevel;

    if(header) {

        let elemHeader = $('<div></div>', {
            id : id + '-header'
        }).appendTo(elemParent).addClass('panel-header');
    
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
    
        let elemToolbar = $('<div></div>')
            .addClass('panel-toolbar')
            .attr('id', id + '-toolbar');
    
        if(reload) {

            elemToolbar.appendTo(elemHeader);
            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-refresh')
                .attr('id', id + '-reload')
                .attr('title', 'Reload this list')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    insertWorkspaceItemsData(id);
                });

        }

        if(search) {

            elemToolbar.appendTo(elemHeader);

            let elemSearch = $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('with-icon')
                .addClass('icon-search-list');

            $('<input></input>').appendTo(elemSearch)
                .attr('placeholder', 'Search')
                .attr('id', id + '-search-input')
                .addClass('workspace-items-search-input')
                .click(function(e){
                    e.preventDefault();
                    e.stopPropagation();
                })
                .keyup(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    searchInTiles(id, $(this));
                });

        }
    
    
    } else { elemParent.addClass('no-header'); }

    appendProcessing(id, false);
    appendNoDataFound(id, 'icon-no-data', 'No Entries');

    $('#' + id + '-no-data').hide();

    let elemList = $('<div></div>').appendTo(elemParent)
        .attr('id', id + '-list')
        .addClass('workspace-items-list')
        .addClass('panel-content')
        .addClass('no-scrollbar')
        .addClass('tiles')
        .addClass('wide')
        .addClass(size);

    if(isBlank(groupBy)) {
        elemList.addClass('tiles');
        elemList.addClass(surfaceLevel);
    } else {
        elemList.addClass('workspace-items-groups');
    }

    insertWorkspaceItemsData(id);

}
function insertWorkspaceItemsData(id) {

    let timestamp  = new Date().getTime();
    let elemParent = $('#' + id)
    let elemList   = $('#' + id + '-list');  
    let url         = (isBlank(settings.workspaceItems[id].filter)) ? '/plm/items' : '/plm/search-bulk';

    elemParent.attr('data-timestamp', timestamp);
    elemList.hide();

    $('#' + id + '-processing').show();

    $.get(url, { 
        'timestamp' : timestamp, 
        'wsId'      : settings.workspaceItems[id].wsId,
        'query'     : settings.workspaceItems[id].filter,
        'bulk'      : true
    }, function(response) {

        if(response.params.timestamp === $('#' + id).attr('data-timestamp')) {

            elemList.html('');

            let counter = 0;

            for(item of response.data.items) {
                item.sortKey = getSectionFieldValue(item.sections, settings.workspaceItems[id].sortBy, '', 'ttile');
            }
            sortArray(response.data.items, 'sortKey', 'string', 'ascending');

            if(!isBlank(settings.workspaceItems[id].groupBy)) {
                for(item of response.data.items) {
                    if(settings.workspaceItems[id].groupBy === 'status') {
                        item.groupKey = item.currentState.title;
                    } else {
                        item.groupKey = getSectionFieldValue(item.sections, settings.workspaceItems[id].groupBy, '', 'title');
                    }
                }
                sortArray(response.data.items, 'groupKey', 'string', 'ascending');
            }

            let groupName = null;
            let elemGroupList;

            for(let item of response.data.items) {

                counter++;

                if(!isBlank(settings.workspaceItems[id].groupBy)) {

                    if(groupName !== item.groupKey) {

                        let elemGroup = $('<div></div>');
                            elemGroup.addClass('workspace-items-group');
                            elemGroup.appendTo(elemList);

                        $('<div></div>').appendTo(elemGroup)
                            .addClass('workspace-items-group-name')
                            .html(item.groupKey);

                        elemGroupList = $('<div></div>').appendTo(elemGroup)
                            .addClass('workspace-items-group-list')
                            .addClass('tiles')
                            .addClass('wide')
                            .addClass(settings.workspaceItems[id].surfaceLevel)
                            .addClass(settings.workspaceItems[id].size);

                    }

                    groupName = item.groupKey;

                }

                let image    = (settings.workspaceItems[id].fieldIdImage === '') ? null : getSectionFieldValue(item.sections, settings.workspaceItems[id].fieldIdImage, '', 'link');
                let title    = getSectionFieldValue(item.sections, settings.workspaceItems[id].fieldIdTitle, '', 'title');
                let subtitle = (settings.workspaceItems[id].fieldIdSubtitle === '') ? null : getSectionFieldValue(item.sections, settings.workspaceItems[id].fieldIdSubtitle, '', 'title');
                let details  = [];

                let elemTile = genTile(item.__self__, '', image, settings.workspaceItems[id].icon, title, subtitle);
                    if(isBlank(settings.workspaceItems[id].groupBy)) elemTile.appendTo(elemList); else elemTile.appendTo(elemGroupList);
                    elemTile.click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        clickWorkspaceItem($(this), e);
                    });


                for(let fieldidDetail of settings.workspaceItems[id].fieldIdsDetails) {
                    details.push([
                        fieldidDetail[0],
                        getSectionFieldValue(item.sections, fieldidDetail[1], '', 'title'),
                        fieldidDetail[2]
                    ]);
                }

                for(let fieldAttribute of settings.workspaceItems[id].fieldIdsAttributes) {
                    if(!isBlank(fieldAttribute)) {
                        elemTile.attr('data-' + fieldAttribute.toLowerCase(), getSectionFieldValue(item.sections, fieldAttribute, '', 'link'),)
                    }
                }

                if(details.length > 0) appendTileDetails(elemTile, details);

            }

            
            elemList.show();
            $('#' + id + '-processing').hide();
            $('#' + id + '-workspace-items-counter').html(counter);
            if(counter === 0) $('#' + id + '-no-data').show();
            insertWorkspaceItemsDone(id, response);
        
        }

    });

}
function insertWorkspaceItemsDone(id, response) {}
function clickWorkspaceItem(elemClicked, e) {

    elemClicked.toggleClass('selected');
    elemClicked.siblings().removeClass('selected');

    openItemByLink(elemClicked.attr('data-link'));

}



// Insert user's WORKSPACE VIEWS for given workspace (optionally add BOOKMARKS & RECENTS in same control)
function insertWorkspaceViews(wsId, params) {

    //  Set defaults for optional parameters
    // --------------------------------------
    let id                  = 'workspace';      // id of DOM element where the list will be inserted
    let header              = true;             // Hide header with setting this to false
    let headerLabel         = 'Items';          // Set the header text
    let headerToggle        = false;            // Enable header toggles
    let reload              = true;             // Enable reload button for the list
    let search              = true;             // Adds quick filtering using search input on top of the list
    let views               = true;             // Enables view selector when set to true
    let layout              = 'table';          // Content layout (tiles, list or table)
    let size                = 's';              // layout size (xxs, xs, s, m, l, xl, xxl)
    let icon                = 'icon-settings';  // Tile icon to use if no image is available
    let groupBy             = '';               // Field ID to use for grouping of items (leave blank to disable grouping)
    let columnLimit         = 25;               // Sets the maximum number of columns being displayed for the selected workspace view
    let includeMOW          = false             // Includes users MY OUTSTANDING VIEW 
    let includeBookmarks    = false             // Includes users BOOKMARKED ITEMS
    let includeRecents      = false             // Includes users RECENTLY VIEWED ITEMS
    let startupView         = '';               // Select default view at startup ('', 'mow', 'bookmarks' or 'recents')
    let fieldIdImage        = '';               // ID of field to use as tile image
    let fieldIdTitle        = '';               // ID of field to use as tile title
    let fieldIdSubtitle     = '';               // ID of field to use as tile subtitle
    let fieldIdsDetails     = [];               // List of field IDs to be displayed as tile details
    let fieldIdsAttributes  = [];               // List of field IDs whose values will be stored in the DOM attributes of the tiles to allow for further user interactions

    if(isBlank(wsId)) return;
    if(isBlank(params)) params = {};

    if(!isBlank(params.id)                )                 id = params.id;
    if(!isBlank(params.header)            )             header = params.header;
    if(!isBlank(params.headerLabel)       )        headerLabel = params.headerLabel;
    if(!isBlank(params.headerToggle)      )       headerToggle = params.headerToggle;
    if(!isBlank(params.reload)            )             reload = params.reload;
    if(!isBlank(params.search)            )             search = params.search;
    if(!isBlank(params.views)             )              views = params.views;
    if(!isBlank(params.layout)            )             layout = params.layout;
    if(!isBlank(params.size)              )               size = params.size;
    if(!isBlank(params.icon)              )               icon = params.icon;
    if(!isBlank(params.columnLimit)       )        columnLimit = params.columnLimit;
    if(!isBlank(params.groupBy)           )            groupBy = params.groupBy;           
    if(!isBlank(params.includeMOW)        )         includeMOW = params.includeMOW;           
    if(!isBlank(params.includeBookmarks)  )   includeBookmarks = params.includeBookmarks;           
    if(!isBlank(params.includeRecents)    )     includeRecents = params.includeRecents;           
    if(!isBlank(params.startupView)       )        startupView = params.startupView;           
    if(!isBlank(params.fieldIdImage)      )       fieldIdImage = params.fieldIdImage;      
    if(!isBlank(params.fieldIdTitle)      )       fieldIdTitle = params.fieldIdTitle;      
    if(!isBlank(params.fieldIdSubtitle)   )    fieldIdSubtitle = params.fieldIdSubtitle;   
    if(!isBlank(params.fieldIdsDetails)   )    fieldIdsDetails = params.fieldIdsDetails;   
    if(!isBlank(params.fieldIdsAttributes)) fieldIdsAttributes = params.fieldIdsAttributes;


    let elemParent = $('#' + id)
        .addClass('workspace-view')
        .html('');

    if(elemParent.length === 0) {
        showErrorMessage('View Definition Error', 'Could not find html element with id "' + id + '" in page. Please contact your administrator');
        return;
    }

    let surfaceLevel = getSurfaceLevel(elemParent);

    if(layout === 'table') groupBy = '';

    settings.workspaceViews[id]                     = {};
    settings.workspaceViews[id].wsId                = wsId.toString();
    settings.workspaceViews[id].icon                = icon;
    settings.workspaceViews[id].layout              = layout;
    settings.workspaceViews[id].size                = size;
    settings.workspaceViews[id].columnLimit         = columnLimit;
    settings.workspaceViews[id].groupBy             = groupBy;
    settings.workspaceViews[id].fieldIdImage        = fieldIdImage;
    settings.workspaceViews[id].fieldIdTitle        = fieldIdTitle;
    settings.workspaceViews[id].fieldIdSubtitle     = fieldIdSubtitle;
    settings.workspaceViews[id].fieldIdsDetails     = fieldIdsDetails;
    settings.workspaceViews[id].fieldIdsAttributes  = fieldIdsAttributes;
    settings.workspaceViews[id].surfaceLevel        = surfaceLevel;


    let elemHeader = $('<div></div>', {
        id : id + '-header'
    }).appendTo(elemParent).addClass('panel-header');

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

    let elemToolbar = $('<div></div>')
        .addClass('panel-toolbar')
        .attr('id', id + '-toolbar');

    let elemSelect = $('<select></select>').appendTo(elemToolbar)
        .attr('id', id + '-view-selector')
        .addClass('workspace-view-selector')
        .addClass('button')
        .hide()
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
        })
        .change(function(e) {
            e.preventDefault();
            e.stopPropagation();
            changeWorkspaceView(id);
        });

    if(reload) {

        elemToolbar.appendTo(elemHeader);
        $('<div></div>').appendTo(elemToolbar)
            .addClass('button')
            .addClass('icon')
            .addClass('icon-refresh')
            .attr('id', id + '-reload')
            .attr('title', 'Reload this view')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                changeWorkspaceView(id);
            });

    }

    if(search) {

        elemToolbar.appendTo(elemHeader);

        let elemSearch = $('<div></div>').appendTo(elemToolbar)
            .addClass('button')
            .addClass('with-icon')
            .addClass('icon-search-list')
            .hide()

        $('<input></input>').appendTo(elemSearch)
            .attr('placeholder', 'Search')
            .attr('id', id + '-search-input')
            .addClass('workspace-view-search-input')
            .click(function(e){
                e.preventDefault();
                e.stopPropagation();
            })
            .keyup(function(e) {
                e.preventDefault();
                e.stopPropagation();
                searchInWorkspaceView(id, $(this));
                searchInMOW(id + '-mow', $(this));
            });

    }
    
    if(!header) { elemParent.addClass('no-header'); }

    appendProcessing(id, true);
    appendNoDataFound(id, 'icon-no-data', 'No Entries');

    $('#' + id + '-no-data').hide();

    let elemList = $('<div></div>').appendTo(elemParent)
        .attr('id', id + '-list')
        .addClass('panel-content')
        .addClass('workspace-view-list')
        .addClass('no-scrollbar')
        .addClass(layout)
        .addClass(size);

    if(layout === 'list') elemList.addClass('list').addClass('wide');

    if(isBlank(groupBy)) {
        elemList.addClass('tiles');
        elemList.addClass(surfaceLevel);
    } else {
        elemList.addClass('workspace-view-groups');
    }

    if(includeMOW) {

        $('<option></option>').appendTo(elemSelect)
            .html('My Outstanding Work')
            .attr('value', 'mow');

        $('<div></div>').appendTo(elemList)
            .addClass('mow-table')
            .addClass(surfaceLevel)
            .attr('id', id + '-mow');

    }

    if(includeBookmarks) {

        $('<option></option>').appendTo(elemSelect)
            .html('My Bookmarks')
            .attr('value', 'bookmarks');

        $('<div></div>').appendTo(elemList)
            .addClass('tiles')
            .addClass('list')
            .addClass('xs')
            .addClass(surfaceLevel)
            .attr('id', id + '-bookmarks');

    }
    
    if(includeRecents) {

        $('<option></option>').appendTo(elemSelect)
            .html('Recently Viewed')
            .attr('value', 'recents');

        $('<div></div>').appendTo(elemList)
            .addClass('tiles')
            .addClass('list')
            .addClass('xs')
            .addClass(surfaceLevel)
            .attr('id', id + '-recents');

    }   

    $.get('/plm/tableaus' , { 'wsId' : settings.workspaceViews[id].wsId }, function(response) {

        if(views) elemSelect.show();

        if(response.error) {

            showErrorMessage('Error when accessing workspace with id ' + settings.workspaceViews[id].wsId, response.data.message);

        } else {

            let selectDefault = true;

                 if(includeMOW       && (startupView.toLowerCase() === 'mow')      ) { selectDefault = false; elemSelect.val('mow'); }
            else if(includeBookmarks && (startupView.toLowerCase() === 'bookmarks')) { selectDefault = false; elemSelect.val('bookmarks'); }
            else if(includeRecents   && (startupView.toLowerCase() === 'recents')  ) { selectDefault = false; elemSelect.val('recents'); }

            for(let tableau of response.data) {

                let  = $('<option></option>').appendTo(elemSelect)
                    .html(tableau.title)
                    .attr('value', tableau.link);

                if(!isBlank(tableau.type) && selectDefault) {
                    if(tableau.type.toLowerCase() === 'default') {
                        elemSelect.val(tableau.link);
                    }
                }
    
            }
    
            insertWorkspaceViewsDone(id, response);
            changeWorkspaceView(id);

        }

    });

}
function insertWorkspaceViewsDone(id, data) {}
function searchInWorkspaceView(id, elemInput) {

    let elemTable   = $('#' + id + '-tbody');
    let filterValue = elemInput.val().toLowerCase();

    elemTable.children('tr').removeClass('result');

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
function changeWorkspaceView(id) {

    let elemList    = $('#' + id + '-list');
    let elemSelect  = $('#' + id + '-view-selector');
    let elemSearch  = $('#' + id + '-search-input').parent();
    let linkView    = elemSelect.val();

    if(elemSearch.length > 0 ) elemSearch.hide();

    elemList.children().hide();

           if(linkView === 'mow'      ) {         insertMOW({ 'id' : id + '-mow'      , 'header' : false, 'workspacesIn' : [settings.workspaceViews[id].wsId] });      
    } else if(linkView === 'bookmarks') {   insertBookmarks({ 'id' : id + '-bookmarks', 'header' : false, 'workspacesIn' : [settings.workspaceViews[id].wsId] });  
    } else if(linkView === 'recents'  ) { insertRecentItems({ 'id' : id + '-recents'  , 'header' : false, 'workspacesIn' : [settings.workspaceViews[id].wsId] });  
    } else { 
        if(elemSearch.length > 0 ) elemSearch.show();
        insertWorkspaceViewData(id); 
    }

}
function insertWorkspaceViewData(id) {

    let timestamp  = new Date().getTime();
    let elemParent = $('#' + id)
    let elemList   = $('#' + id + '-list');  
    let elemSelect = $('#' + id + '-view-selector');
    let linkView   = elemSelect.val();

    elemParent.attr('data-timestamp', timestamp);
    elemList.hide()
    elemList.children('table').remove();
    elemList.children('.tile').remove();
    elemList.children('.workspace-view-group').remove();

    $('#' + id + '-processing').show();

    let requests = [
        $.get('/plm/tableau-columns', { 'link' : linkView, 'timestamp' : timestamp }),
        $.get('/plm/tableau-data'   , { 'link' : linkView, 'timestamp' : timestamp })
    ];

    Promise.all(requests).then(function(responses) {

        if(responses[0].params.timestamp === $('#' + id).attr('data-timestamp')) {

            if(settings.workspaceViews[id].layout === 'table') {

                let elemTable = $('<table></table>').appendTo(elemList)
                    .attr('id', id + '-table')
                    .addClass('workspace-view-table')
                    .addClass('fixed-header');

                let elemTHead = $('<thead></thead>').appendTo(elemTable)
                    .addClass('workspace-view-thead')
                    .attr('id', id + '-thead');

                let elemTBody = $('<tbody></tbody>').appendTo(elemTable)
                    .addClass('workspace-view-tbody')
                    .attr('id', id + '-tbody');

                if(responses[1].data.length > 0) {
                    setWorkspaceViewColumns(id, elemTHead, responses[0].data);
                    setWorkspaceViewRows   (id, elemTBody, responses[1].data);
                }

            } else {

                setWorkspaceViewTiles(id, elemList, responses[1].data);

            }

            $('#' + id + '-processing').hide();
            elemList.show();

            if(responses[1].data.length === 0) $('#' + id + '-no-data').show();

            changeWorkspaceViewDone(id, responses[0], responses[1]);

        }

    });

}
function setWorkspaceViewColumns(id, elemTHead, columns) {

    let index        = 0;
    let elemTHeadRow = $('<tr></tr>').appendTo(elemTHead);

    for(let column of columns) {

        if(!isBlank(column.displayOrder)) {

            if(index < settings.workspaceViews[id].columnLimit) {
                $('<th></th>').appendTo(elemTHeadRow)
                    .addClass('workspace-view-head')
                    .html(column.field.title);

                index++;
            }

        }

    }

}
function setWorkspaceViewRows(id, elemTBody, rows) {
    
    for(let row of rows) {

        let index = 0;

        let elemRow = $('<tr></tr>').appendTo(elemTBody)
            .addClass('workspace-view-item')
            .attr('data-link', row.item.link)
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                clickWorkspaceViewItem($(this), e);
            })

        for(let field of row.fields) {

            if(field.id === 'DESCRIPTOR') elemRow.attr('data-title', field.value);

            let elemCell = $('<td></td>').html($('<div></div>').html(field.value).text());

            if(index < settings.workspaceViews[id].columnLimit) elemCell.appendTo(elemRow);

            index++;

        }

    }

}
function setWorkspaceViewTiles(id, elemList, rows) {

    let elemGroupList;
    let counter = 0;
    let groupName = null;

    if(!isBlank(settings.workspaceViews[id].groupBy)) {
        for(let row of rows) {
            row.groupKey = getWorkspaceViewRowValue(row, settings.workspaceViews[id].groupBy, '', 'title');
        }
        sortArray(rows, 'groupKey', 'string', 'ascending');

    }

    for(let row of rows) {

        counter++;

        if(!isBlank(settings.workspaceViews[id].groupBy)) {

            if(groupName !== row.groupKey) {

                let elemGroup = $('<div></div>').appendTo(elemList)
                    .addClass('workspace-view-group');

                $('<div></div>').appendTo(elemGroup)
                    .addClass('workspace-view-group-name')
                    .html(row.groupKey);

                elemGroupList = $('<div></div>').appendTo(elemGroup)
                    .addClass('workspace-view-group-list')
                    .addClass('tiles')
                    .addClass(settings.workspaceViews[id].size)
                    .addClass(settings.workspaceViews[id].surfaceLevel);

                if(settings.workspaceViews[id].layout === 'list') elemGroupList.addClass('wide')

            }

            groupName = row.groupKey;

        }

        let image    = (settings.workspaceViews[id].fieldIdImage === '') ? null : getWorkspaceViewRowValue(row, settings.workspaceViews[id].fieldIdImage, '', 'link');
        let title    = getWorkspaceViewRowValue(row, settings.workspaceViews[id].fieldIdTitle, '', 'title');
        let subtitle = (settings.workspaceViews[id].fieldIdSubtitle === '') ? null : getWorkspaceViewRowValue(row, settings.workspaceViews[id].fieldIdSubtitle, '', 'title');
        let details  = [];

        let elemTile = genTile(row.item.link, '', image, settings.workspaceViews[id].icon, title, subtitle);
            if(isBlank(settings.workspaceViews[id].groupBy)) elemTile.appendTo(elemList); else elemTile.appendTo(elemGroupList);
            elemTile.click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                clickWorkspaceViewItem($(this), e);
            });


        for(let fieldidDetail of settings.workspaceViews[id].fieldIdsDetails) {
            details.push([
                fieldidDetail[0],
                getWorkspaceViewRowValue(row, fieldidDetail[1], '', 'title'),
                fieldidDetail[2]
            ]);
        }

        for(let fieldAttribute of settings.workspaceViews[id].fieldIdsAttributes) {
            elemTile.attr('data-' + fieldAttribute.toLowerCase(), getWorkspaceViewRowValue(row, fieldAttribute, '', 'link'),)
        }

        if(details.length > 0) appendTileDetails(elemTile, details);

    }

    $('#' + id + '-workspace-view-counter').html(counter);

}
function changeWorkspaceViewDone(id, columns, data) {}
function clickWorkspaceViewItem(elemClicked, e) {

    openItemByLink(elemClicked.attr('data-link'));

}



// Insert basic SEARCH capability
function insertSearch(params) {

    //  Set defaults for optional parameters
    // --------------------------------------
    let id           = 'search';            // id of DOM element where the list will be inserted
    let header       = true;                // Hide header with setting this to false
    let headerLabel  = 'Search';            // Set the header text
    let headerToggle = false;               // Enable header toggles
    let placeholder  = 'Enter search critieria'; // Provide placeholder text for search input
    let buttonLabel  = 'Submit';            // Set the search button text
    let reset        = true;                // Enable reset button
    let tileCounter  = false;               // When enabled, a counter will be displayed instead of the icon
    let icon         = 'icon-checkmark';    // Sets the icon to be displayed for each tile
    let images       = false;               // Display first image field as tile image
    let size         = 'm';                 // layout size (xxs, xs, s, m, l, xl, xxl)
    let limit        = 50;                  // Set maximum limit of search results
    let workspace    = '';                  // Set workspace for the search
    let baseQuery    = '';                  // Set base query string to be appended
    let exactMatch   = false;               // If set to true, no wildcards will be added
    let autoClick    = false;               // Trigger click on first result in case of one single hit only

    if( isBlank(params)             )       params = {};
    if(!isBlank(params.id)          )           id = params.id;
    if(!isBlank(params.header)      )       header = params.header;
    if(!isBlank(params.headerLabel) )  headerLabel = params.headerLabel;
    if(!isBlank(params.headerToggle)) headerToggle = params.headerToggle;
    if(!isBlank(params.placeholder) )  placeholder = params.placeholder;
    if(!isBlank(params.buttonLabel) )  buttonLabel = params.buttonLabel;
    if(!isBlank(params.reset)       )        reset = params.reset;
    if(!isBlank(params.tileCounter) )  tileCounter = params.tileCounter;
    if(!isBlank(params.icon)        )         icon = params.icon;
    if(!isBlank(params.images)      )       images = params.images;
    if(!isBlank(params.size)        )         size = params.size;
    if(!isBlank(params.limit)       )        limit = params.limit;
    if(!isBlank(params.workspace)   )    workspace = params.workspace;
    if(!isBlank(params.baseQuery)   )    baseQuery = params.baseQuery;
    if(!isBlank(params.exactMatch)  )   exactMatch = params.exactMatch;
    if(!isBlank(params.autoClick)   )    autoClick = params.autoClick;

    settings.search[id]             = {};
    settings.search[id].tileCounter = tileCounter;
    settings.search[id].icon        = icon;
    settings.search[id].images      = images;
    settings.search[id].limit       = limit;
    settings.search[id].workspace   = workspace;    
    settings.search[id].baseQuery   = baseQuery;    
    settings.search[id].exactMatch  = exactMatch;    
    settings.search[id].autoClick   = autoClick;    

    let elemParent = $('#' + id)
        .addClass('search')
        .html('')
        .show();

    if(header) {

        let elemHeader = $('<div></div>', {
            id : id + '-header'
        }).appendTo(elemParent).addClass('panel-header');
    
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
    
        let elemToolbar = $('<div></div>')
            .addClass('panel-toolbar')
            .attr('id', id + '-toolbar');
    
        if(reset) {

            elemToolbar.appendTo(elemHeader);
            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-refresh')
                .attr('id', id + '-reset')
                .attr('title', 'Reset the search panel')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    resetSearch(id);
                });

        }
    
    } else { elemParent.addClass('no-header'); }


    $('#' + id + '-no-data').hide();

    let elemListToolbar = $('<div></div>').appendTo(elemParent)
        .attr('id', id + '-list-toolbar')
        .addClass('search-list-toolbar');

    $('<input></input>').appendTo(elemListToolbar)
        .attr('placeholder', placeholder)
        .attr('id', id + '-search-list-input')
        .addClass('search-list-input')
        .click(function(e){
            e.preventDefault();
            e.stopPropagation();
        })
        .keypress(function(e) {
            if(e.which == 13) {
                insertSearchData(id);
            }
        });

    $('<div></div>').appendTo(elemListToolbar)
        .attr('id', id + '-search-list-button')
        .addClass('search-list-button')
        .addClass('button')
        .addClass('default')
        .html(buttonLabel)
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            insertSearchData(id);
        });

    $('<div></div>').appendTo(elemParent)
        .attr('id', id + '-list')
        .addClass('search-list')
        .addClass('no-scrollbar')
        .addClass('panel-content')
        .addClass('tiles')
        .addClass('list')
        .addClass(size);

    appendProcessing(id, true);
    appendNoDataFound(id, 'icon-no-data', 'No Search Results');

    insertSearchDone(id);

}
function insertSearchDone(id) {}
function resetSearch(id) {

    $('#' + id + '-search-list-input').val('').focus();
    $('#' + id + '-list').hide();
    $('#' + id + '-processing').hide();
    $('#' + id + '-no-data').hide();

}
function insertSearchData(id) {

    let timestamp  = new Date().getTime();
    let elemParent = $('#' + id)
    let elemList   = $('#' + id + '-list');  

    elemParent.attr('data-timestamp', timestamp);
    elemList.hide();

    $('#' + id + '-no-data').hide();
    $('#' + id + '-processing').show();

    let params = {
        'query'     : $('#' + id + '-search-list-input').val(),
        'limit'     : settings.search[id].limit,
        'timestamp' : timestamp
    }


    if(!isBlank(settings.search[id].baseQuery)) params.query += '+AND+' + settings.search[id].baseQuery;
    if(!isBlank(settings.search[id].workspace)) params.wsId = settings.search[id].workspace;
    if(settings.search[id].exactMatch) params.wildcard = false;

    $.get('/plm/search-descriptor', params, function(response) {

        if(response.params.timestamp === $('#' + id).attr('data-timestamp')) {

            elemList.html('').show();

            $('#' + id + '-processing').hide();
            
            if((typeof response.data.items === 'undefined') || (response.data.items.length === 0)) {

                $('#' + id + '-no-data').show();
            
            } else {

                elemList.show();

                let counter = 1;

                for(record of response.data.items) {

                    let elemTile = genTile(record.__self__, '', '',  settings.search[id].icon, record.descriptor, record.workspaceLongName);
                        elemTile.appendTo(elemList);
                        elemTile.click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            clickSearchResult($(this), e);
                        });

                    if(settings.search[id].tileCounter) {
                        let elemImage = elemTile.find('.tile-image');
                        elemImage.html('');

                        $('<div></div>').appendTo(elemImage)
                            .addClass('tile-counter')
                            .html(counter++);
                    }
                
                    if((response.data.items.length === 1) && (settings.search[id].autoClick)) {
                        elemTile.click();
                    } else if(settings.search[id].images) getTileImage(elemTile, settings.search[id].icon);

                }

                if(response.data.items.length < response.data.totalCount) {

                    $('<div></div>').appendTo(elemList)
                        .addClass('search-list-status')
                        .html('Showing ' + response.data.items.length + ' out of ' + response.data.totalCount + ' total matches');

                }
            }

            insertSearchDataDone(id, response);

        }

    });

}
function insertSearchDataDone(id, data) {}
function clickSearchResult(elemClicked, e) {
    openItemByLink(elemClicked.attr('data-link'));
}



// Insert advanced SEARCH results
function insertResults(wsId, filters, params) {

    //  Set defaults for optional parameters
    // --------------------------------------
    let id              = 'results';        // id of DOM element where the list will be inserted
    let header          = true;             // Hide header (and toolbar) by setting this to false
    let headerLabel     = 'Results';        // Set the header text
    let headerToggle    = false;            // Enable header toggles
    let compactDisplay  = false;            // Optimizes CSS settings for a compact display
    let openInPLM       = true;             // Adds button to open selected element in PLM
    let reload          = true;             // Enable reload button for the list
    let search          = true;             // Adds quick filtering using search input on top of list
    let placeholder     = 'Search';         // Set placeholder text for quick filtering input
    let layout          = 'table';          // Content layout (tiles, list or table)
    let tileSize        = 's';              // Tile size (xxs, xs, s, m, l, xl, xxl)
    let tileIcon        = 'icon-product';   // Tile icon to use if no image is available
    let tileCounter     = false;            // When enabled, a counter will be displayed instead of the icon
    let tileSubtitle    = '';               // When enabled, a counter will be displayed instead of the icon
    let tilesGroupBy    = '';               // Field ID to use for grouping of items (leave blank to disable grouping)
    let multiSelect     = false;            // Enables selection of multiple items
    let editable        = false;            // When set to true, enables modifications in editable fields
    let filterEmpty     = false;            // When set to true, adds filter for rows with empty input cells 
    let filterSelected  = false;            // When set to true, adds filter for selected rows
    let tableHeaders    = true;             // When set to false, the table headers will not be shown
    let number          = true;             // When set to true, a counter will be displayed as first column
    let descriptor      = true;             // When set to true, the descriptor will be displayed as first table column
    let hideDetails     = false;            // When set to true, detail columns will be skipped, only the descriptor will be shown
    let tableCounters   = true;             // Display counters at bottom to indicate total, selected, filtered and modified items
    let totals          = false;            // Enable automatic total calculation for numeric columns, based on selected (or all) items
    let ranges          = false;            // Enable automatic range indicators for numeric columns, based on selected (or all) items
    let fields          = [];               // Set columns to be display by providing an array of fieldIds
    let sort            = [];               // Determines sorting of rows by providing an array of fieldIds


    if(isBlank(wsId)) return;
    if(isBlank(filters)) return;

    if( isBlank(params)               )         params = {};
    if(!isBlank(params.id)            )             id = params.id;
    if(!isBlank(params.header)        )         header = params.header;
    if(!isBlank(params.headerLabel)   )    headerLabel = params.headerLabel;
    if(!isBlank(params.headerToggle)  )   headerToggle = params.headerToggle;
    if(!isBlank(params.compactDisplay)) compactDisplay = params.compactDisplay;
    if(!isBlank(params.openInPLM)     )      openInPLM = params.openInPLM;
    if(!isBlank(params.reload)        )         reload = params.reload;
    if(!isBlank(params.search)        )         search = params.search;
    if(!isBlank(params.placeholder)   )    placeholder = params.placeholder;
    if(!isBlank(params.layout)        )         layout = params.layout;
    if(!isBlank(params.tileSize)      )       tileSize = params.tileSize;
    if(!isBlank(params.tileIcon)      )       tileIcon = params.tileIcon;
    if(!isBlank(params.tileCounter)   )    tileCounter = params.tileCounter;
    if(!isBlank(params.tileSubtitle)  )   tileSubtitle = params.tileSubtitle;
    if(!isBlank(params.tilesGroupBy)  )   tilesGroupBy = params.tilesGroupBy;
    if(!isBlank(params.multiSelect)   )    multiSelect = params.multiSelect;
    if(!isBlank(params.editable)      )       editable = params.editable;
    if(!isBlank(params.filterEmpty)   )    filterEmpty = params.filterEmpty;
    if(!isBlank(params.filterSelected)) filterSelected = params.filterSelected;
    if(!isBlank(params.tableHeaders)  )   tableHeaders = params.tableHeaders;
    if(!isBlank(params.number)        )         number = params.number;
    if(!isBlank(params.descriptor)    )     descriptor = params.descriptor;
    if(!isBlank(params.hideDetails)   )    hideDetails = params.hideDetails;
    if(!isBlank(params.tableCounters) )  tableCounters = params.tableCounters;
    if(!isBlank(params.totals)        )         totals = params.totals;
    if(!isBlank(params.ranges)        )         ranges = params.ranges;
    if(!isBlank(params.fields)        )         fields = params.fields;
    if(!isBlank(params.sort)          )           sort = params.sort; 

    if(sort.length   === 0) sort.push(filters[0].field);
    if(fields.length === 0) for(let field of filters) { fields.push(field.field); }


    settings.results[id]                = {};
    settings.results[id].layout         = layout;
    settings.results[id].tileSize       = tileSize;
    settings.results[id].tileIcon       = tileIcon;
    settings.results[id].tileCounter    = tileCounter;
    settings.results[id].tileSubtitle   = tileSubtitle;
    settings.results[id].tilesGroupBy   = tilesGroupBy;
    settings.results[id].multiSelect    = multiSelect;
    settings.results[id].editable       = editable;  
    settings.results[id].tableHeaders   = tableHeaders; 
    settings.results[id].number         = number;  
    settings.results[id].descriptor     = descriptor;  
    settings.results[id].hideDetails    = hideDetails;  
    settings.results[id].totals         = totals;  
    settings.results[id].ranges         = ranges;  
    settings.results[id].wsId           = wsId; 
    settings.results[id].filters        = filters;    
    settings.results[id].fields         = fields;
    settings.results[id].sort           = sort;

    settings.results[id].fields.unshift('DESCRIPTOR');

    console.log(openInPLM);


    let elemTop = $('#' + id)
        .addClass('panel-top')
        .addClass('list-top')
        .addClass('results')
        .attr('data-wsid', wsId)
        .html('');

    if(multiSelect) elemTop.addClass('multi-select');
    if(compactDisplay) elemTop.addClass('compact');
    if(layout.toLowerCase() !== 'table') tableCounters = false;
    if(tableCounters) elemTop.addClass('with-counters');

    if(header) {

        let elemHeader = $('<div></div>', {
            id : id + '-header'
        }).appendTo(elemTop).addClass('panel-header');

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

        if(openInPLM) {

            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-open')
                .addClass('xs')
                .addClass('list-open-in-plm')
                .addClass('list-single-select-action')
                .attr('title', 'Open the selected item in PLM')
                .click(function() {
                    clickListOpenInPLM($(this));
                });
    
        }            

        if(filterSelected) {
                
            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-check-box-checked')
                .addClass('list-filter-selected')
                .addClass('list-single-select-action')
                .addClass('list-multi-select-action')
                .attr('title', 'Focus on selected rows')
                .click(function() {
                    clickListFilterSelected($(this));
                });

        }

        $('<div></div>').appendTo(elemToolbar)
            .addClass('button')
            .addClass('icon')
            .addClass('icon-deselect-all')
            .addClass('xs')
            .addClass('list-multi-select-action')
            .addClass('list-single-select-action')
            .attr('id', id + '-deselect-all')
            .attr('title', 'Deselect all')
            .click(function() {
                clickListDeselectAll($(this));
            });

        if(editable) {

            appendOverlay(true);

            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('default')
                .html('Save')
                .hide()
                .attr('id', id + '-save')
                .click(function() {
                    clickListSave($(this));
                });

            if(filterEmpty) {
                
                $('<div></div>').appendTo(elemToolbar)
                    .addClass('button')
                    .addClass('icon')
                    .addClass('icon-filter-empty')
                    .addClass('list-filter-empty')
                    .attr('title', 'Focus on rows having empty inputs')
                    .click(function() {
                        clickListFilterEmptyInputs($(this));
                    });

            }

        } 

        if(reload) {

            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-refresh')
                .attr('id', id + '-reload')
                .attr('title', 'Reload this list')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    insertResultsData(id);
                });

        }

        $('<div></div>').appendTo(elemToolbar)
            .addClass('button') 
            .addClass('with-icon') 
            .addClass('icon-filter') 
            .addClass('flat-bom-counter') 
            .html('0 rows selected')
            .hide()
            .click(function() {
                $(this).toggleClass('selected');
                filterFlatBOMByCounter($(this));
            }); 
        
        if(search) {

            let elemSearch = $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('with-icon')
                .addClass('icon-search-list');

            $('<input></input>').appendTo(elemSearch)
                .attr('placeholder', placeholder)
                .attr('id', id + '-search-input')
                .addClass('list-search-input')
                .keyup(function() {
                    searchInList(id, $(this));
                });

        }

    } else { elemTop.addClass('no-header'); }

    appendProcessing(id, false);
    appendNoDataFound(id, 'icon-no-data', 'No Results');

    $('<div></div>').appendTo(elemTop)
        .attr('id', id + '-list')
        .addClass('panel-content')
        .addClass('panel-list')
        .addClass('no-scrollbar');

    let elemCounters = $('<div></div>').appendTo(elemTop)
        .attr('id', id + '-list-counters')
        .addClass('list-counters')
        .hide();

    if(tableCounters) {

        $('<div></div>').appendTo(elemCounters)
            .attr('id', id + '-list-counter-total')
            .addClass('list-counter-total');
        
        $('<div></div>').appendTo(elemCounters)
            .attr('id', id + '-list-counter-filtered')
            .addClass('list-counter-filtered');
        
        $('<div></div>').appendTo(elemCounters)
            .attr('id', id + '-list-counter-selected')
            .addClass('list-counter-selected');      

        $('<div></div>').appendTo(elemCounters)
            .attr('id', id + '-list-counter-changed')
            .addClass('list-counter-changed');

        elemCounters.show();

    } 

    insertResultsDone(id);
    insertResultsData(id);

}
function insertResultsDone(id) {}
function insertResultsData(id) {

    let elemParent  = $('#' + id);
    let timestamp   = new Date().getTime();
    let elemList    = $('#' + id + '-list');
    
    elemParent.attr('data-timestamp', timestamp);
    elemList.html('').hide();

    $('#' + id + '-processing').show();

    let params = {
        wsId        : settings.results[id].wsId,
        filter      : settings.results[id].filters,
        fields      : settings.results[id].fields,
        sort        : settings.results[id].sort,
        timestamp   : timestamp
    }

    let requests = [
        $.get( '/plm/search', params),
        $.get( '/plm/fields', { 'wsId' : settings.results[id].wsId }),
    ]

    Promise.all(requests).then(function(responses) {

        if(responses[0].params.timestamp === $('#' + id).attr('data-timestamp')) {

            let items   = responses[0].data.row;
            let columns = [];
                
            for(let column of settings.results[id].fields) {
                for(let field of responses[1].data) {
                    let fieldId = field.__self__.split('/').pop();
                    if(column === fieldId) {
                        field.displayName = field.name;
                        field.fieldId = column;
                        columns.push(field);
                    }
                }
            }

            settings.results[id].columns = columns;

            for(let item of items) {

                item.link       = '/api/v3/workspaces/' + settings.results[id].wsId + '/items/' + item.dmsId;
                item.title      = '';
                item.subtitle   = '';
                item.partNumber = '';
                item.data       = [];
                item.quantity   = '';

                for(let column of settings.results[id].columns) {

                    let value = '';

                    for(let field of item.fields.entry) {

                        if(field.key === 'DESCRIPTOR') item.title = field.fieldData.formattedValue;
                        if(field.key === config.viewer.fieldIdPartNumber) item.partNumber = field.fieldData.value;
                        if(field.key === settings.results[id].tileSubtitle) item.subtitle = field.fieldData.value;
                        if(field.key === settings.results[id].tilesGroupBy) item.groupKey = field.fieldData.value;

                        if(field.key === column.fieldId) {
                            value = field.fieldData.value;
                            break;
                        }


                    }

                    item.data.push({
                        fieldId : column.fieldId,
                        value   : value
                    });

                }

            }

            if(settings.results[id].layout === 'table') {                
                
                genTable(id ,settings.results[id], items);
                
            } else {

                genTilesList(id, items, settings.results[id]);

            }

            if(items.length === 0) $('#' + id + '-no-data').show();
            $('#' + id + '-processing').hide();
            elemList.show();
            insertResultsDataDone(id, responses);

        }

    });

}
function insertResultsDataDone(id, data) {}