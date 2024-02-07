// Display records of defined workspace
// List items of defined workspace in options dialog
function insertWorkspaceItems(wsId, params) {



    //  Set defaults for optional parameters
    // --------------------------------------
    let id                  = 'list';   // id of DOM element where the list will be inseerted
    let title               = '';       // Title being shown on top of the list
    let classNames          = [];       // Array of class names that will be assigned to the tiles list (enables specific styling and event listeners)
    let search              = true;     // Adds quick filtering using search input on top of the list
    let icon                = 'label';  // Tile icon to use
    let fieldIdImage        = '';       // ID of field to use as tile image
    let fieldIdTitle        = '';       // ID of field to use as tile title
    let fieldIdSubtitle     = '';       // ID of field to use as tile subtitle
    let fieldIdsDetails     = [];       // List of field IDs to be displayed as tile details
    let fieldIdsAttributes  = [];       // List of field IDs whose values will be stored in the DOM attributes of the tiles to allow for further user interactions
    let sortBy              = 'title';  // Field ID to use for sorting
    let groupBy             = '';       // Field ID to use for grouping of items (leave blank to disable grouping)

    let bulk = false;

    if(isBlank(wsId)) return;
    if(isBlank(params)) params = {};

    if(!isBlank(params.id)                )                   id = params.id;
    if(!isEmpty(params.title)             )                title = params.title;
    if(!isBlank(params.classNames)        )           classNames = params.classNames;
    if(!isBlank(params.search)            )               search = params.search;
    if(!isBlank(params.icon)              )                 icon = params.icon;
    if(!isBlank(params.fieldIdImage)      ) {       fieldIdImage = params.fieldIdImage;        bulk = true; }
    if(!isBlank(params.fieldIdTitle)      ) {       fieldIdTitle = params.fieldIdTitle;        bulk = true; }
    if(!isBlank(params.fieldIdSubtitle)   ) {    fieldIdSubtitle = params.fieldIdSubtitle;     bulk = true; }
    if(!isBlank(params.fieldIdsDetails)   ) {    fieldIdsDetails = params.fieldIdsDetails;     bulk = true; }
    if(!isBlank(params.fieldIdsAttributes)) { fieldIdsAttributes = params.fieldIdsAttributes;  bulk = true; }
    if(!isBlank(params.sortBy)            )               sortBy = params.sortBy;
    if(!isBlank(params.groupBy)           )              groupBy = params.groupBy;

    let elemList = $('#' + id);
        elemList.addClass('workspace-items');
        elemList.html('');

    if(elemList.length === 0) {
        showErrorMessage('View Definition Error', 'Could not find view element with id "' + id + '". Please contact your administrator');
        return;
    }

    let surfaceLevel = getSurfaceLevel(elemList);

    let elemHeader = $('<div></div>');
        elemHeader.addClass('panel-header');
        elemHeader.attr('id', id + '-header');
        elemHeader.appendTo(elemList);

    $('<div></div>').appendTo(elemHeader)
        .addClass('panel-title')
        .attr('id', id + '-title')
        .html(title);

    let elemToolbar = $('<div></div>');
        elemToolbar.addClass('panel-toolbar');
        elemToolbar.attr('id', id + '-toolbar');
        elemToolbar.appendTo(elemHeader);

    if(search) {

        let elemSearch = $('<div></div>');
            elemSearch.addClass('button');
            elemSearch.addClass('with-icon');
            elemSearch.addClass('icon-search-list');
            elemSearch.addClass('panel-toolbar-search');
            elemSearch.appendTo(elemToolbar);

        let elemSearchInput = $('<input></input>');
            elemSearchInput.attr('placeholder', 'Search');
            elemSearchInput.attr('id', id + '-search-input');
            elemSearchInput.addClass('panel-toolbar-search-input');
            elemSearchInput.addClass('workspace-items-search-input')
            elemSearchInput.appendTo(elemSearch);
            elemSearchInput.keyup(function() {
                searchInWorkspaceItems(id, $(this));
            });

    }

    let elemProcessing = $('<div></div>');
        elemProcessing.attr('id', id + '-processing');
        elemProcessing.addClass('processing');
        elemProcessing.append($('<div class="bounce1"></div>'));
        elemProcessing.append($('<div class="bounce2"></div>'));
        elemProcessing.append($('<div class="bounce2"></div>'));
        elemProcessing.appendTo(elemList);

    let elemContent = $('<div></div>');
        elemContent.addClass('panel-content');
        elemContent.attr('id', id + '-content');
        elemContent.appendTo(elemList);

    if(isBlank(groupBy)) {
        elemContent.addClass('tiles');
        elemContent.addClass(surfaceLevel);
        for(let className of classNames) elemContent.addClass(className);
    } else {
        elemContent.addClass('workspace-items-groups');
    }


    $.get('/plm/items', { 'wsId' : wsId, 'bulk' : bulk }, function(response) {

        elemContent.html('');

        if(bulk) {

            if(sortBy === 'title') {
                sortArray(response.data.items, 'title', 'string', 'ascending');
            } else {
                for(item of response.data.items) {
                    item.sortKey = getSectionFieldValue(item.sections, sortBy, '', 'title');
                }
                sortArray(response.data.items, 'sortKey', 'string', 'ascending');
            }

            if(!isBlank(groupBy)) {
                for(item of response.data.items) {
                    if(groupBy === 'status') {
                        item.groupKey = item.currentState.title;
                    } else {
                        item.groupKey = getSectionFieldValue(item.sections, groupBy, '', 'title');
                    }
                }
                sortArray(response.data.items, 'groupKey', 'string', 'ascending');
            }

            let groupName = null;
            let elemGroupList;

            for(item of response.data.items) {

                if(!isBlank(groupBy)) {

                    if(groupName !== item.groupKey) {

                        let elemGroup = $('<div></div>');
                            elemGroup.addClass('workspace-items-group');
                            elemGroup.appendTo(elemContent);

                        let elemGroupName = $('<div></div>');
                            elemGroupName.addClass('workspace-items-group-name');
                            elemGroupName.html(item.groupKey);
                            elemGroupName.appendTo(elemGroup);                            

                        elemGroupList = $('<div></div>');
                        elemGroupList.addClass('workspace-items-group-list');
                        elemGroupList.addClass('tiles');
                        elemGroupList.addClass(surfaceLevel);
                        elemGroupList.appendTo(elemGroup);

                        for(let className of classNames) elemGroupList.addClass(className);

                    }

                    groupName = item.groupKey;

                }

                let image    = (fieldIdImage === '') ? null : getSectionFieldValue(item.sections, fieldIdImage, '', 'link');
                let title    = getSectionFieldValue(item.sections, fieldIdTitle, '', 'title');
                let subtitle = (fieldIdSubtitle === '') ? null : getSectionFieldValue(item.sections, fieldIdSubtitle, '', 'title');
                let details  = [];

                let elemTile = genTile(item.__self__, '', image, icon, title, subtitle);
                    if(isBlank(groupBy)) elemTile.appendTo(elemContent); else elemTile.appendTo(elemGroupList);
                    elemTile.click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        clickWorkspaceItem(e, $(this));
                    });


                for(let fieldidDetail of fieldIdsDetails) {

                    details.push([
                        fieldidDetail[0],
                        getSectionFieldValue(item.sections, fieldidDetail[1], '', 'title'),
                        fieldidDetail[2]
                    ]);

                
                }

                for(let fieldAttribute of fieldIdsAttributes) {

                    elemTile.attr('data-' + fieldAttribute.toLowerCase(), getSectionFieldValue(item.sections, fieldAttribute, '', 'link'),)

                }

                if(details.length > 0) appendTileDetails(elemTile, details);

            }


        } else {

            sortArray(response.data.items, 'descriptor', 'string', 'ascending');

            for(item of response.data.items) {

                let elemTile = genTile(item.__self__, '', '', icon, item.descriptor, item.workspaceLongName);
                    // elemTile.appendTo(elemList);
                    elemTile.click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        clickWorkspaceItem(e, $(this));
                    });

                if(isBlank(groupBy)) elemTile.appendTo(elemContent); else elemTile.appendTo(elemGroupList);

            }

        }

        elemProcessing.hide();
        insertWorkspaceItemsDone(id);

    });

}
function insertWorkspaceItemsDone(id) {}
function searchInWorkspaceItems(id, elemInput) {

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
            let value = $(this).find('.tile-title').html().toLowerCase();
            if(value.indexOf(filterValue) > -1) $(this).show();
        });

        elemContent.children('.workspace-items-group').each(function() {
            $(this).find('.tile').each(function() {
                let value = $(this).find('.tile-title').html().toLowerCase();
                if(value.indexOf(filterValue) > -1) {
                    $(this).show();
                    $(this).closest('.workspace-items-group').show();
                }
            });
        });

    }    

}
function clickWorkspaceItem(e, elemClicked) {

    elemClicked.toggleClass('selected');
    elemClicked.siblings().removeClass('selected');

}



// Insert user's MY OUTSTANDING WORK (filter for defined workspaces if needed)
function insertMOW(id, includeWorkspaceIds, icon) {

    if(isBlank(id)) id = 'mow';
    if(isBlank(includeWorkspaceIds)) includeWorkspaceIds = [];
    if(isBlank(icon)) icon = 'icon-mow';

    let elemList = $('#' + id + '-mow');
        elemList.html('');

    $('#' + id + '-processing').show();

    $.get( '/plm/mow', {}, function(response) {

        let data    = response.data;
        let counter = 0;

        for(item of data.outstandingWork) {

            let dateClass   = '';
            let date        = '';
            let workspace   = item.workspace.title;
            let workspaceId = item.workspace.link.split('/')[4];

            if((includeWorkspaceIds.length === 0) || (includeWorkspaceIds.includes(workspaceId))) {

                counter++;

                if(item.hasOwnProperty('milestoneDate')) {
                    let targetDate = new Date(item.milestoneDate);
                    date = targetDate.toLocaleDateString();
                    dateClass = 'in-time';
                }
                if(item.hasOwnProperty('milestoneStatus')) {
                    if(item.milestoneStatus === 'CRITICAL') dateClass = 'late';
                }

                let elemItem = $('<div></div>');
                    elemItem.addClass('mow-row');
                    elemItem.attr('data-link', item.item.link);
                    elemItem.attr('data-title', item.item.title);

                let elemItemIcon = $('<div></div>');
                    elemItemIcon.addClass('mow-icon');
                    elemItemIcon.addClass('icon');
                    elemItemIcon.addClass(icon);
                    elemItemIcon.appendTo(elemItem);

                let elemItemTitle = $('<div></div>');
                    elemItemTitle.addClass('link');
                    elemItemTitle.addClass('nowrap');
                    elemItemTitle.addClass('mow-descriptor');
                    elemItemTitle.appendTo(elemItem);

                let elemItemDate = $('<div></div>');
                    elemItemDate.addClass('mow-date');
                    elemItemDate.addClass(dateClass);
                    elemItemDate.appendTo(elemItem);

                let elemItemStatus = $('<div></div>');
                    elemItemStatus.addClass('mow-status');
                    elemItemStatus.addClass('nowrap');
                    elemItemStatus.html(item.workflowStateName);
                    elemItemStatus.appendTo(elemItem);
                    
                let elemItemWorkspace = $('<div></div>');
                    elemItemWorkspace.addClass('mow-workspace');
                    elemItemWorkspace.addClass('nowrap');
                    elemItemWorkspace.appendTo(elemItem);

                elemItemTitle.html(item.item.title);;
                elemItemWorkspace.html(workspace);
                elemItemDate.html(date);

                elemItem.appendTo(elemList);
                elemItem.click(function(e) { 
                    e.preventDefault();
                    e.stopPropagation();
                    clickMOWItem($(this));
                });

            }

        }

        elemList.show();
        $('#' + id + '-processing').hide();
        $('#' + id + '-mow-ounter').html(counter);
        insertMOWDone(id);

    });

}
function insertMOWDone(id) {}
function clickMOWItem(elemClicked) {}



// Insert user's BOOKMARKED ITEMS (filter for defined workspaces if needed)
function insertBookmarks(id, includeWorkspaces, icon) {

    if(isBlank(id)) id = 'bookmarks';
    if(isBlank(includeWorkspaces)) includeWorkspaces = [];
    if(isBlank(icon)) icon = 'star';

    let timestamp = new Date().getTime();
    let elemList  = $('#' + id + '-bookmarks');
        elemList.attr('data-timestamp', timestamp);
        elemList.html('');

    $('#' + id + '-processing').show();

    $.get('/plm/bookmarks', { 'timestamp' : timestamp }, function(response) {

        if(response.params.timestamp === $('#' + id + '-bookmarks').attr('data-timestamp')) {

            let counter = 0;

            for(bookmark of response.data.bookmarks) {

                let wsId = bookmark.item.link.split('/')[4];

                if((includeWorkspaces.length === 0) || (includeWorkspaces.includes(wsId))) {

                    counter++;

                    let elemTile = genTile(bookmark.item.link, '', '', icon, bookmark.item.title, bookmark.workspace.title);
                        elemTile.appendTo(elemList);
                        elemTile.click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            clickBookmarkItem($(this));
                        });

                }

            }

            elemList.show();
            $('#' + id + '-processing').hide();
            $('#' + id + '-bookmarks-ounter').html(counter);
            insertBookmarksDone(id);

        }

    });

}
function insertBookmarksDone(id) {}
function clickBookmarkItem(elemClicked) {}



// Insert user's RECENTLY VIEWED ITEMS (filter for defined workspaces if needed)
function insertRecentItems(id, includeWorkspaces, icon) {

    if(isBlank(id)) id = 'recents';
    if(isBlank(includeWorkspaces)) includeWorkspaces = [];
    if(isBlank(icon)) icon = 'history';

    let timestamp = new Date().getTime();
    let elemList  = $('#' + id + '-recents');
        elemList.attr('data-timestamp', timestamp);
        elemList.html('');

    $('#' + id + '-processing').show();

    $.get('/plm/recent', { 'timestamp' : timestamp }, function(response) {

        if(response.params.timestamp === $('#' + id + '-recents').attr('data-timestamp')) {

            let counter = 0;

            for(recent of response.data.recentlyViewedItems) {

                let wsId = recent.item.link.split('/')[4];

                if((includeWorkspaces.length === 0) || (includeWorkspaces.includes(wsId))) {

                    counter++;

                    let elemTile = genTile(recent.item.link, '', '', icon, recent.item.title, recent.workspace.title);
                        elemTile.appendTo(elemList);
                        elemTile.click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            clickRecentItem($(this));
                        });

                }

            }

            elemList.show();
            $('#' + id + '-processing').hide();
            $('#' + id + '-recents-ounter').html(counter);
            insertRecentItemsDone(id);
            
        }

    });

}
function insertRecentItemsDone(id) {}
function clickRecentItem(elemClicked) {}



// Insert user's WORKSPACE VIEWS for given workspace
function insertWorkspaceViews(id, workspaceId, title, views, search, limit, includeMOW, includeBookmarks, includeRecents) {

    if(isBlank(workspaceId      )) return;
    if(isBlank(id               ))               id = 'views';
    if(isBlank(title            ))            title = '';
    if(isBlank(views            ))            views = true;
    if(isBlank(search           ))           search = false;
    if(isBlank(limit            ))            limit = 100;
    if(isBlank(includeMOW       ))       includeMOW = false;
    if(isBlank(includeBookmarks )) includeBookmarks = false;
    if(isBlank(includeRecents   ))   includeRecents = false;

    let elemViews = $('#' + id);
        elemViews.attr('data-limit', limit);
        elemViews.attr('data-wsid', workspaceId);
        elemViews.html('');

    let elemHeader = $('<div></div>');
        elemHeader.addClass('panel-header');
        elemHeader.attr('id', id + '-header');
        elemHeader.appendTo(elemViews);

    let elemTitle = $('<div></div>');
        elemTitle.addClass('panel-title');
        elemTitle.attr('id', id + '-title');
        elemTitle.html(title);
        elemTitle.appendTo(elemHeader);

    let elemToolbar = $('<div></div>');
        elemToolbar.addClass('panel-toolbar');
        elemToolbar.attr('id', id + '-toolbar');
        elemToolbar.appendTo(elemHeader);

    let elemSelect = $('<select></select>');
        elemSelect.attr('id', id + '-view-selector');
        elemSelect.addClass('workspace-view-selector');
        elemSelect.addClass('button');
        elemSelect.appendTo(elemToolbar);
        elemSelect.change(function() {
            changeWorkspaceView(id);
        });

    if(!views) elemSelect.hide();

    let elemRefresh = $('<div></div>');
        elemRefresh.addClass('button');
        elemRefresh.addClass('icon');
        elemRefresh.addClass('icon-refresh');
        elemRefresh.attr('id', id + '-refresh');
        elemRefresh.appendTo(elemToolbar);
        elemRefresh.click(function() {
            changeWorkspaceView(id);
        });

    if(search) {

        let elemFilter = $('<div></div>');
            elemFilter.addClass('button');
            elemFilter.addClass('with-icon');
            elemFilter.addClass('icon-search-list');
            elemFilter.appendTo(elemToolbar);

        let elemFilterInput = $('<input></input>');
            elemFilterInput.attr('placeholder', 'Search');
            elemFilterInput.attr('data-id', id);
            elemFilterInput.addClass('workspace-view-search-input')
            elemFilterInput.appendTo(elemFilter);
            elemFilterInput.keyup(function() {
                searchInWorkspaceView(id, $(this));
            });

    }

    let elemProcessing = $('<div></div>');
        elemProcessing.addClass('processing');
        elemProcessing.attr('id', id + '-processing');
        elemProcessing.append($('<div class="bounce1"></div>'));
        elemProcessing.append($('<div class="bounce2"></div>'));
        elemProcessing.append($('<div class="bounce2"></div>'));
        elemProcessing.appendTo(elemViews);

    let elemContent = $('<div></div>');
        elemContent.attr('id', id + '-content');
        elemContent.addClass('panel-content');
        elemContent.appendTo(elemViews);

    let elemTable = $('<table></table>');
        elemTable.attr('id', id + '-table');
        elemTable.addClass('workspace-view-table');
        elemTable.addClass('fixed-header');
        elemTable.appendTo(elemContent);

    let elemTableHead = $('<thead></thead>');
        elemTableHead.addClass('workspace-view-thead');
        elemTableHead.attr('id', id + '-thead');
        elemTableHead.appendTo(elemTable);

    let elemTableBody = $('<tbody></tbody>');
        elemTableBody.addClass('workspace-view-tbody');
        elemTableBody.attr('id', id + '-tbody');
        elemTableBody.appendTo(elemTable);

    let elemEmpty = $('<div></div>');
        elemEmpty.attr('id', id + '-empty');
        elemEmpty.addClass('panel-content');
        elemEmpty.hide();
        elemEmpty.append('<div class="icon icon-info"></div>');
        elemEmpty.append('<p>No data for this view</p>');
        elemEmpty.appendTo(elemViews);

    if(includeMOW) {

        let elemOptionMOW = $('<option></option>');
            elemOptionMOW.html('My Outstanding Work');
            elemOptionMOW.attr('value', 'mow');
            elemOptionMOW.appendTo(elemSelect);

        let elemListMOW = $('<div></div>');
            elemListMOW.addClass('mow-table');
            elemListMOW.attr('id', id + '-mow');
            elemListMOW.appendTo(elemContent);

    }

    if(includeBookmarks) {

        let elemOptionMOW = $('<option></option>');
            elemOptionMOW.html('My Bookmarks');
            elemOptionMOW.attr('value', 'bookmarks');
            elemOptionMOW.appendTo(elemSelect);

        let elemListBookmarks = $('<div></div>');
            elemListBookmarks.addClass('tiles');
            elemListBookmarks.addClass('list');
            elemListBookmarks.addClass('xs');
            elemListBookmarks.attr('id', id + '-bookmarks');
            elemListBookmarks.appendTo(elemContent);
    }
    
    if(includeRecents) {

        let elemOptionRecents = $('<option></option>');
            elemOptionRecents.html('Recently Viewed');
            elemOptionRecents.attr('value', 'recents');
            elemOptionRecents.appendTo(elemSelect);

        let elemListRecents = $('<div></div>');
            elemListRecents.addClass('tiles');
            elemListRecents.addClass('list');
            elemListRecents.addClass('xs');
            elemListRecents.attr('id', id + '-recents');
            elemListRecents.appendTo(elemContent);

    }

    insertWorkspaceViewsDone(id);

    $.get('/plm/tableaus' , { 'wsId' : workspaceId }, function(response) {

        if(response.error) {

            showErrorMessage('Error when accessing workspace with id ' + workspaceId, response.data.message);

        } else {

            for(let tableau of response.data) {

                let elemOption = $('<option></option>');
                    elemOption.html(tableau.title);
                    elemOption.attr('value', tableau.link);
                    elemOption.appendTo(elemSelect);
    
                if(!isBlank(tableau.type)) {
                    if(tableau.type.toLowerCase() === 'default') {
                        elemSelect.val(tableau.link);
                    }
                }
    
                if(includeBookmarks) elemSelect.val('bookmarks');
                if(includeMOW) elemSelect.val('mow');
    
            }
    
            changeWorkspaceView(id);

        }

    });

}
function insertWorkspaceViewsDone(id) {}
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

    $('#' + id + '-empty').hide();
    $('#' + id + '-processing').show();

    let timestamp   = new Date().getTime();
    let elemParent  = $('#' + id);
    let elemContent = $('#' + id + '-content');
    let elemSelect  = $('#' + id + '-view-selector');
    let elemTable   = $('#' + id + '-table');
    let elemTHead   = $('#' + id + '-thead');
    let elemTBody   = $('#' + id + '-tbody');
    let linkView    = elemSelect.val();
    let limit       = Number(elemParent.attr('data-limit'));
    let workspaceId = elemParent.attr('data-wsid');

    elemContent.children().hide();

           if(linkView === 'mow'      ) {         insertMOW(id, [workspaceId]);      
    } else if(linkView === 'bookmarks') {   insertBookmarks(id, [workspaceId]);
    } else if(linkView === 'recents'  ) { insertRecentItems(id, [workspaceId]);
    } else {

        elemSelect.attr('data-timestamp', timestamp);
        elemTHead.html('');
        elemTBody.html('');

        let requests = [
            $.get('/plm/tableau-columns', { 'link' : linkView, 'timestamp' : timestamp }),
            $.get('/plm/tableau-data'   , { 'link' : linkView, 'timestamp' : timestamp })
        ];

        Promise.all(requests).then(function(responses) {

            if(responses[0].params.timestamp === $('#' + id + '-view-selector').attr('data-timestamp')) {

                elemTable.show();
                $('#' + id + '-processing').hide();
                if(responses[1].data.length > 0) {
                    setWorkspaceViewColumns(elemTHead, responses[0].data, limit);
                    setWorkspaceViewRows   (elemTBody, responses[1].data, limit);
                } else {
                    $('#' + id + '-empty').show();
                }

                changeWorkspaceViewDone(id);

            }

        });

    }

}
function changeWorkspaceViewDone(id) {}
function setWorkspaceViewColumns(elemTHead, columns, limit) {

    let index = 0;

    let elemTHeadRow = $('<tr></tr>');
        elemTHeadRow.appendTo(elemTHead);

    for(column of columns) {

        if(!isBlank(column.displayOrder)) {

            if(index < limit) {
                let elemTHeadCell = $('<th></th>');
                    elemTHeadCell.addClass('workspace-view-head');
                    elemTHeadCell.html(column.field.title);
                    elemTHeadCell.appendTo(elemTHeadRow);

                index++;
            }

        }

    }

}
function setWorkspaceViewRows(elemTBody, rows, limit) {
    
    for(row of rows) {

        let index = 0;

        let elemRow = $('<tr></tr>');
            elemRow.addClass('workspace-view-item');
            elemRow.attr('data-link', row.item.link);
            elemRow.appendTo(elemTBody);
            elemRow.click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                clickWorkspaceViewItem($(this));
            })

        for(field of row.fields) {

            let elemCell = $('<td></td>');
                elemCell.html($('<div></div>').html(field.value).text());

            if(field.id === 'DESCRIPTOR') {
                elemRow.attr('data-title', field.value);
                elemCell.addClass('workspace-view-item-descriptor');
            }

            if(index < limit) elemCell.appendTo(elemRow);

            index++;

        }

    }

}
function clickWorkspaceViewItem(elemClicked) {}