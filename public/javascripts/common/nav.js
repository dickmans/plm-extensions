// Display records of defined workspace
// List items of defined workspace in options dialog
function insertWorkspaceItems(wsId, id, title, classNames, search, icon, fieldIdImage, fieldIdTitle, fieldIdSubtitle, fieldIdsDetails, sortBy, fieldIdsAttributes) {

    let bulk = false;

    if(isBlank(wsId              )) return;
    if(isBlank(id                ))                 id = 'list';
    if(isBlank(title             ))              title = '';
    if(isBlank(classNames        ))         classNames = [];
    if(isBlank(icon              ))               icon = 'label';
    if(isBlank(search            ))             search = true;
    if(isBlank(fieldIdImage      ))       fieldIdImage = '';    else bulk = true;
    if(isBlank(fieldIdTitle      ))       fieldIdTitle = '';    else bulk = true;
    if(isBlank(fieldIdSubtitle   ))    fieldIdSubtitle = '';    else bulk = true;
    if(isBlank(fieldIdsDetails   ))    fieldIdsDetails = [];    else bulk = true; 
    if(isBlank(fieldIdsAttributes)) fieldIdsAttributes = [];    else bulk = true; 
    if(isBlank(sortBy            ))              sortBy = 'title';

    let elemList = $('#' + id);
        elemList.addClass('workspace-items');
        elemList.html('');

    let elemHeader = $('<div></div>');
        elemHeader.addClass('panel-header');
        elemHeader.attr('id', id + '-header');
        elemHeader.appendTo(elemList);

    let elemTitle = $('<div></div>');
        elemTitle.addClass('panel-title');
        elemTitle.attr('id', id + '-title');
        elemTitle.html(title);
        elemTitle.appendTo(elemHeader);

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
        elemContent.addClass('tiles');
        elemContent.attr('id', id + '-content');
        elemContent.appendTo(elemList);

    for(let className of classNames) elemContent.addClass(className);

    $.get('/plm/items', { 'wsId' : wsId, 'bulk' : bulk }, function(response) {

        elemContent.html('');

        if(bulk) {

            if(sortBy === 'title') {
                sortArray(response.data.items, 'title', 'string', 'ascending');
            } else {
                for(item of response.data.items) {
                    item.sortKey = getSectionFieldValue(item.sections, sortBy, '', 'title');
                }
                sortArray(response.data.items, sortKey, 'string', 'ascending');
            }

            for(item of response.data.items) {

                let image    = (fieldIdImage === '') ? null : getSectionFieldValue(item.sections, fieldIdImage, '', 'link');
                let title    = getSectionFieldValue(item.sections, fieldIdTitle, '', 'title');
                let subtitle = (fieldIdSubtitle === '') ? null : getSectionFieldValue(item.sections, fieldIdSubtitle, '', 'title');
                let details  = [];

                let elemTile = genTile(item.__self__, '', image, icon, title, subtitle);
                    elemTile.appendTo(elemContent);
                    elemTile.click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        clickWorkspaceItem($(this));
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
                    elemTile.appendTo(elemList);
                    elemTile.click(function() {
                        e.preventDefault();
                        e.stopPropagation();
                        clickWorkspaceItem($(this));
                    });

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
        elemContent.children().show();
    } else {
        elemContent.children().hide();
        elemContent.children().each(function() {
            let value = $(this).find('.tile-title').html().toLowerCase();
            if(value.indexOf(filterValue) > -1) $(this).show();
        });
    }    

}
function clickWorkspaceItem(elemClicked) {}


// Insert user's MY OUTSTANDING WORK (filter for defined workspaces if needed)
function insertMOW(id, includeWorkspaces) {

    if(isBlank(id)) id = 'mow';
    if(isBlank(includeWorkspaces)) includeWorkspaces = [];

    let elemList = $('#' + id + '-list');
        elemList.html('');

    $('#' + id + '-processing').show();

    $.get( '/plm/mow', {}, function(response) {

        let data    = response.data;
        let counter = 0;

        $('#' + id + '-processing').hide();

        for(item of data.outstandingWork) {

            let dateClass   = '';
            let date        = '';
            let workspace   = item.workspace.title;

            if((includeWorkspaces.length === 0) || (includeWorkspaces.includes(workspace))) {

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

                let elemItemTitle = $('<div></div>');
                    elemItemTitle.addClass('link');
                    elemItemTitle.addClass('nowrap');
                    elemItemTitle.addClass('mow-descriptor');
                    elemItemTitle.appendTo(elemItem);

                let elemItemWorkspace = $('<div></div>');
                    elemItemWorkspace.addClass('mow-workspace');
                    elemItemWorkspace.addClass('nowrap');
                    elemItemWorkspace.appendTo(elemItem);

                let elemItemDate = $('<div></div>');
                    elemItemDate.addClass('mow-date');
                    elemItemDate.addClass(dateClass);
                    elemItemDate.appendTo(elemItem);

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

        $('#' + id + '-counter').html(counter);
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

    let elemList = $('#' + id + '-list');
        elemList.html('');

    $('#' + id + '-processing').show();

    $.get('/plm/bookmarks', {}, function(response) {

        for(bookmark of response.data.bookmarks) {

            let wsId = bookmark.item.link.split('/')[4];

            if((includeWorkspaces.length === 0) || (includeWorkspaces.includes(wsId))) {

                let elemTile = genTile(bookmark.item.link, '', '', icon, bookmark.item.title, bookmark.workspace.title);
                    elemTile.appendTo(elemList);
                    elemTile.click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        clickBookmarkItem($(this));
                    });

            }

        }

        $('#' + id + '-processing').hide();
        insertBookmarksDone(id);

    });

}
function insertBookmarksDone(id) {}
function clickBookmarkItem(elemClicked) {}



// Insert user's RECENTLY VIEWED ITEMS (filter for defined workspaces if needed)
function insertRecentItems(id, includeWorkspaces, icon) {

    if(isBlank(id)) id = 'recents';
    if(isBlank(includeWorkspaces)) includeWorkspaces = [];
    if(isBlank(icon)) icon = 'history';

    let elemList = $('#' + id + '-list');
        elemList.html('');

    $('#' + id + '-processing').show();

    $.get('/plm/recent', {}, function(response) {

        for(recent of response.data.recentlyViewedItems) {

            let wsId = recent.item.link.split('/')[4];

            if((includeWorkspaces.length === 0) || (includeWorkspaces.includes(wsId))) {

                let elemTile = genTile(recent.item.link, '', '', icon, recent.item.title, recent.workspace.title);
                    elemTile.appendTo(elemList);
                    elemTile.click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        clickRecentItem($(this));
                    });

            }

        }

        $('#' + id + '-processing').hide();
        insertRecentItemsDone(id);

    });

}
function insertRecentItemsDone(id) {}
function clickRecentItem(elemClicked) {}



// Insert user's WORKSPACE VIEWS for given workspace
function insertWorkspaceViews(id, workspaceId, title, search, limit) {

    if(isBlank(workspaceId)) return;
    if(isBlank(id))     id      = 'views';
    if(isBlank(title))  title   = '';
    if(isBlank(search)) search  = false;
    if(isBlank(limit))   limit  = 100;

    let elemViews = $('#' + id);
        elemViews.attr('data-limit', limit);
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
        elemSelect.appendTo(elemToolbar);
        elemSelect.change(function() {
            changeWorkspaceView(id);
        });

    if(search) {

        let elemFilter = $('<div></div>');
            elemFilter.addClass('button');
            elemFilter.addClass('with-icon');
            elemFilter.addClass('icon-filter');
            elemFilter.appendTo(elemToolbar);

        let elemFilterInput = $('<input></input>');
            elemFilterInput.attr('placeholder', 'Search');
            elemFilterInput.attr('data-id', id);
            elemFilterInput.addClass('workspace-view-search-input')
            elemFilterInput.appendTo(elemFilter);
            elemFilterInput.keyup(function() {
                searchInWorkspaceView($(this));
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
        elemTable.addClass('fixed-header');
        elemTable.appendTo(elemContent);

    let elemTableHead = $('<thead></thead>');
        elemTableHead.attr('id', id + '-thead');
        elemTableHead.appendTo(elemTable);

    let elemTableBody = $('<tbody></tbody>');
        elemTableBody.attr('id', id + '-tbody');
        elemTableBody.appendTo(elemTable);

    let elemEmpty = $('<div></div>');
        elemEmpty.attr('id', id + '-empty');
        elemEmpty.addClass('panel-content');
        elemEmpty.hide();
        elemEmpty.append('<div class="icon icon-info"></div>');
        elemEmpty.append('<p>No data for this view</p>');
        elemEmpty.appendTo(elemViews);

    insertWorkspaceViewsDone(id);

    $.get('/plm/tableaus' , { 'wsId' : workspaceId }, function(response) {

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

        }

        changeWorkspaceView(id);

    });

}
function insertWorkspaceViewsDone(id) {}
function changeWorkspaceView(id) {

    $('#' + id + '-processing').show();
    $('#' + id + '-empty').hide();

    let timestamp   = new Date().getTime();
    let elemParent  = $('#' + id);
    let elemSelect  = $('#' + id + '-view-selector');
    let elemTHead   = $('#' + id + '-thead');
    let elemTBody   = $('#' + id + '-tbody');
    let linkView    = elemSelect.val();
    let limit       = Number(elemParent.attr('data-limit'));

    elemSelect.attr('data-timestamp', timestamp);
    elemTHead.html('');
    elemTBody.html('');

    let requests = [
        $.get('/plm/tableau-columns', { 'link' : linkView, 'timestamp' : timestamp }),
        $.get('/plm/tableau-data'   , { 'link' : linkView, 'timestamp' : timestamp })
    ];

    Promise.all(requests).then(function(responses) {

        if(responses[0].params.timestamp === $('#' + id + '-view-selector').attr('data-timestamp')) {

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
function changeWorkspaceViewDone(id) {}
function setWorkspaceViewColumns(elemTHead, columns, limit) {

    let index = 0;

    let elemTHeadRow = $('<tr></tr>');
        elemTHeadRow.appendTo(elemTHead);

    for(column of columns) {

        if(!isBlank(column.displayOrder)) {

            if(index < limit) {
                let elemTHeadCell = $('<th></th>');
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
                elemCell.html(field.value);

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