// Insert user's MY OUTSTANDING WORK (filter for defined workspaces if needed)
function insertMOW(params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'mow' : params.id;

    settings.mow[id] = getPanelSettings('', params, {
        headerLabel : 'My Outstanding Work',
        layout      : 'table'
    }, [
        [ 'filterByDueDate'  , false ],
        [ 'filterByStatus'   , false ],
        [ 'filterByWorkspace', false ],
        [ 'userId'           , ''    ]
    ]);

    settings.mow[id].load = function() { insertMOWData(id); }

    genPanelTop(id, settings.mow[id], 'mow');
    genPanelHeader(id, settings.mow[id]);
    genPanelOpenSelectedInPLMButton(id, settings.mow[id]);
    genPanelSelectionControls(id, settings.mow[id]);
    genPanelFilterToggle(id, settings.mow[id], 'filterByDueDate', 'due', 'Due Tasks');
    genPanelFilterSelect(id, settings.mow[id], 'filterByStatus', 'status', 'All States');
    genPanelFilterSelect(id, settings.mow[id], 'filterByWorkspace', 'workspace', 'All Workspaces');
    genPanelSearchInput(id, settings.mow[id]);
    genPanelResizeButton(id, settings.mow[id]);
    genPanelReloadButton(id, settings.mow[id]);
    genPanelContents(id, settings.mow[id]);

    insertMOWDone(id);

    settings.mow[id].load();

}
function insertMOWData(id) {

    settings.mow[id].timestamp = startPanelContentUpdate(id);

    $.get('/plm/mow', { 
        timestamp : settings.mow[id].timestamp,
        userId    : settings.mow[id].userId
     }, function(response) {

        if(stopPanelContentUpdate(response, settings.mow[id])) return;

        settings.mow[id].columns = [];

        let items           = [];
        let listStates      = [];
        let listWorkspaces  = [];
        let enableDueToggle = false;
        let columns         = [
            { displayName : 'Due Date'      , fieldId : 'due'      },
            { displayName : 'Item'          , fieldId : 'item'      },
            { displayName : 'Workspace'     , fieldId : 'workspace' },
            { displayName : 'State'         , fieldId : 'current'   },
            { displayName : 'State Set On'  , fieldId : 'date'      },
            { displayName : 'State Set By'  , fieldId : 'user'      }
        ]

        for(let column of columns) {
            if(includePanelTableColumn(column.fieldId, column.displayName, settings.mow[id], settings.mow[id].columns.length)) {
                settings.mow[id].columns.push(column);
            }
        }

        for(let item of response.data.outstandingWork) {

            let dateClass   = '';
            let date        = '';
            let dueFilter   = '';
            let workspace   = item.workspace.title;
            
            if((settings.mow[id].workspacesIn.length === 0) || ( settings.mow[id].workspacesIn.includes(workspace))) {
                if((settings.mow[id].workspacesEx.length === 0) || (!settings.mow[id].workspacesEx.includes(workspace))) {

                    if(!listStates.includes(item.workflowStateName)) listStates.push(item.workflowStateName);
                    if(!listWorkspaces.includes(workspace)) listWorkspaces.push(workspace);

                    if(item.hasOwnProperty('milestoneDate')) {
                            let targetDate = new Date(item.milestoneDate);
                            date = targetDate.toLocaleDateString();
                            dateClass = 'in-time';
                            if(settings.mow[id].filters) elemDue.show();
                    }
                    if(item.hasOwnProperty('milestoneStatus')) {
                        if(item.milestoneStatus === 'CRITICAL') {
                            dateClass       = 'late';
                            dueFilter       = 'yes';
                            enableDueToggle = true;
                        }
                    }

                    items.push({
                        link        : item.item.link,
                        image       : '',
                        title       : item.item.title,
                        subtitle    : workspace,
                        details     : '',
                        partNumber  : item.item.title.split(' - ')[0],
                        status      : item.workflowStateName,
                        data        : [
                            { fieldId : 'due'        , value : date, classNames : ['mow-date', dateClass]},
                            { fieldId : 'item'       , value : item.item.title },
                            { fieldId : 'workspace'  , value : workspace },
                            { fieldId : 'current'    , value : item.workflowStateName },
                            { fieldId : 'date'       , value : date },
                            { fieldId : 'user'       , value : item.workflowUser.title }
                        ],
                        filters : [
                            { key : 'due', value : dueFilter },
                            { key : 'status', value : item.workflowStateName },
                            { key : 'workspace', value : workspace },
                        ],
                        quantity    : '',
                        classNames  : []
                    });

                }
            }

        }

        if(enableDueToggle) $('#' + id + '-filter-due').show();

        sortArray(listStates, 0);
        sortArray(listWorkspaces, 0);
        setPanelFilterOptions(id, 'status', listStates);
        setPanelFilterOptions(id, 'workspace', listWorkspaces);
        finishPanelContentUpdate(id, settings.mow[id], items);
        insertMOWDataDone(id, response);

    });

}
function insertMOWDone(id) {}
function insertMOWDataDone(id, data) {}



// Insert user's RECENTLY VIEWED ITEMS (filter for defined workspaces if needed)
function insertRecentItems(params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'recents' : params.id;

    settings.recents[id] = getPanelSettings('', params, {
        headerLabel : 'Recently Viewed Items',
        layout      : 'list',
        tileIcon    : 'icon-history',
        contentSize : 'xs'
    },[
        [ 'filterByWorkspace', false ]
    ]);

    settings.recents[id].load = function() { insertRecentItemsData(id); }

    genPanelTop(id, settings.recents[id], 'recents');
    genPanelHeader(id, settings.recents[id]);
    genPanelOpenSelectedInPLMButton(id, settings.recents[id]);
    genPanelSelectionControls(id, settings.recents[id]);
    genPanelFilterSelect(id, settings.recents[id], 'filterByWorkspace', 'workspace', 'All Workspaces');
    genPanelSearchInput(id, settings.recents[id]);
    genPanelResizeButton(id, settings.recents[id]);
    genPanelReloadButton(id, settings.recents[id]);
    
    genPanelContents(id, settings.recents[id]);

    insertRecentItemsDone(id);
    
    settings.recents[id].load();

}
function insertRecentItemsData(id) {

    settings.recents[id].timestamp = startPanelContentUpdate(id);

    $.get('/plm/recent', { timestamp : settings.recents[id].timestamp }, function(response) {

        if(stopPanelContentUpdate(response, settings.recents[id])) return;

        settings.recents[id].columns = [];

        let items           = [];
        let listWorkspaces  = [];
        let columns         = [
            { displayName : 'Item'          , fieldId : 'item'      },
            { displayName : 'Workspace'     , fieldId : 'workspace' }
        ]

        for(let column of columns) {
            if(includePanelTableColumn(column.displayName, settings.recents[id], settings.recents[id].columns.length)) {
                settings.recents[id].columns.push(column);
            }
        }

        for(let item of response.data.recentlyViewedItems) {

            let workspace   = item.workspace.title;
            let workspaceId = item.workspace.link.split('/')[4];

            if(includePanelWorkspace(settings.recents[id], workspace, workspaceId)) {

                if(!listWorkspaces.includes(workspace)) listWorkspaces.push(workspace);

                items.push({
                    link        : item.item.link,
                    image       : '',
                    title       : item.item.title,
                    subtitle    : workspace,
                    details     : '',
                    partNumber  : item.item.title.split(' - ')[0],
                    data        : [
                        { fieldId : 'item'       , value : item.item.title },
                        { fieldId : 'workspace'  , value : workspace }
                    ],
                    filters : [
                        { key : 'workspace', value : workspace }
                    ],
                    quantity    : '',
                    classNames  : []
                });                        

            }

        }

        sortArray(listWorkspaces, 0);
        setPanelFilterOptions(id, 'workspace', listWorkspaces);
        finishPanelContentUpdate(id, settings.recents[id], items);
        insertRecentItemsDataDone(id, response);

    });

}
function insertRecentItemsDone(id) {}
function insertRecentItemsDataDone(id, data) {}



// Insert user's BOOKMARKED ITEMS (filter for defined workspaces if needed)
function insertBookmarks(params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'bookmarks' : params.id;

    settings.bookmarks[id] = getPanelSettings('', params, {
        headerLabel : 'Bookmarks',
        layout      : 'list',
        tileImage   : true,
        contentSize : 'xs'
    }, [
        [ 'filterByWorkspace', false ]
    ]);

    settings.bookmarks[id].load = function() { insertBookmarksData(id); }

    genPanelTop(id, settings.bookmarks[id], 'bookmarks');
    genPanelHeader(id, settings.bookmarks[id]);
    genPanelOpenSelectedInPLMButton(id, settings.bookmarks[id]);
    genPanelSelectionControls(id, settings.bookmarks[id]);
    genPanelFilterSelect(id, settings.bookmarks[id], 'filterByWorkspace', 'workspace', 'All Workspaces');
    genPanelSearchInput(id, settings.bookmarks[id]);
    genPanelResizeButton(id, settings.bookmarks[id]);
    genPanelReloadButton(id, settings.bookmarks[id]);
    
    genPanelContents(id, settings.bookmarks[id]);

    insertBookmarksDone(id);

    settings.bookmarks[id].load();

}
function insertBookmarksData(id) {

    settings.bookmarks[id].timestamp = startPanelContentUpdate(id);

    $.get('/plm/bookmarks', { timestamp : settings.bookmarks[id].timestamp, useCache : settings.bookmarks[id].useCache }, function(response) {

        if(stopPanelContentUpdate(response, settings.bookmarks[id])) return;

        settings.bookmarks[id].columns = [];

        let items           = [];
        let listWorkspaces  = [];
        let columns         = [
            { displayName : 'Item'          , fieldId : 'item'      },
            { displayName : 'Workspace'     , fieldId : 'workspace' },
            { displayName : 'Comment'       , fieldId : 'comment'   }
        ]

        for(let column of columns) {
            if(includePanelTableColumn(column.displayName, settings.bookmarks[id], settings.bookmarks[id].columns.length)) {
                settings.bookmarks[id].columns.push(column);
            }
        }

        for(let item of response.data.bookmarks) {

            let workspace = item.workspace.title;
            let workspaceId = item.workspace.link.split('/')[4];

            if(includePanelWorkspace(settings.bookmarks[id], workspace, workspaceId)) {

                if(!listWorkspaces.includes(workspace)) listWorkspaces.push(workspace);

                items.push({
                    link        : item.item.link,
                    image       : '',
                    title       : item.item.title,
                    subtitle    : workspace,
                    details     : '',
                    partNumber  : item.item.title.split(' - ')[0],
                    data        : [
                        { fieldId : 'item'       , value : item.item.title },
                        { fieldId : 'workspace'  , value : workspace },
                        { fieldId : 'comment'    , value : item.message }
                    ],
                    filters : [
                        { key : 'workspace', value : workspace }
                    ],
                    quantity    : '',
                    classNames  : []
                });

            }
        }

        sortArray(listWorkspaces, 0);
        setPanelFilterOptions(id, 'workspace', listWorkspaces);
        finishPanelContentUpdate(id, settings.bookmarks[id], items);
        insertBookmarksDataDone(id, response);

    });

}
function insertBookmarksDone(id) {}
function insertBookmarksDataDone(id, data) {}



// Insert user's WORKSPACE VIEWS for given workspace (optionally add BOOKMARKS & RECENTS in same control)
function insertWorkspaceViews(wsId, params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'workspace-views' : params.id;

    settings.workspaceViews[id] = getPanelSettings('', params, {
        headerLabel     : '',
        layout          : 'table',
        contentSize     : 'm',
        tileTitle       : 'DESCRIPTOR',
        tileSubtitle    : 'WF_CURRENT_STATE'
    }, [
        [ 'viewSelector'        ,   true ],
        [ 'startupView'         ,     '' ],
        [ 'includeMOW'          ,  false ],
        [ 'includeBookmarks'    ,  false ],
        [ 'includeRecents'      ,  false ],
        [ 'pagination'          ,   true ],
        [ 'page'                ,      1 ],
        [ 'limit'               ,     25 ],
        [ 'groupBy'             ,     '' ],
        [ 'tileImageFieldId'    ,     '' ],
        [ 'workspacesIn'        , [wsId] ]
    ]);

    settings.workspaceViews[id].wsId = wsId;
    settings.workspaceViews[id].mode = 'initial';
    settings.workspaceViews[id].load = function() { changeWorkspaceView(id);     }
    settings.workspaceViews[id].next = function() { insertWorkspaceViewData(id); }

    genPanelTop(id, settings.workspaceViews[id], 'workspace-views');
    genPanelHeader(id, settings.workspaceViews[id]);
    genPanelOpenSelectedInPLMButton(id, settings.workspaceViews[id]);
    genPanelSelectionControls(id, settings.workspaceViews[id]);

    let elemToolbar = genPanelToolbar(id, settings.workspaceViews[id], 'controls');

    $('<select></select>').appendTo(elemToolbar)
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

    genPanelSearchInput( id, settings.workspaceViews[id]);
    genPanelResizeButton(id, settings.workspaceViews[id]);
    genPanelReloadButton(id, settings.workspaceViews[id]);
    
    setWorkspaceViewsSelector(id);
    
    genPanelContents(id, settings.workspaceViews[id]).addClass(getSurfaceLevel($('#' + id)));
    genPanelPaginationControls(id, settings.workspaceViews[id]);

}
function setWorkspaceViewsSelector(id) {

    let elemSelect = $('#' + id + '-view-selector');

    let requests = [
        $.get('/plm/tableaus'  , { 'wsId' : settings.workspaceViews[id].wsId }),
        $.get('/plm/workspaces', { } )
    ]

    Promise.all(requests).then(function(responses) {

        if(settings.workspaceViews[id].viewSelector) elemSelect.show();

        if(responses[0].error) {

            showErrorMessage('Error when accessing workspace with id ' + settings.workspaceViews[id].wsId, responses[0].data.message);

        } else {

            let elemTitle                           = $('#' + id + '-title');
            let selectDefault                       = true;
            settings.workspaceViews[id].workspace   = getWorkspaceName(settings.workspaceViews[id].wsId, responses[1]);

            if(isBlank(settings.workspaceViews[id].headerLabel)) {
                elemTitle.html('');
                $('<div></div>').appendTo(elemTitle)
                    .attr('id',  id + '-title-main')
                    .addClass('panel-title-main')
                    .html(settings.workspaceViews[id].workspace);
            }

                 if(settings.workspaceViews[id].includeMOW       && (settings.workspaceViews[id].startupView.toLowerCase() === 'mow')      ) { selectDefault = false; elemSelect.val('mow'); }
            else if(settings.workspaceViews[id].includeBookmarks && (settings.workspaceViews[id].startupView.toLowerCase() === 'bookmarks')) { selectDefault = false; elemSelect.val('bookmarks'); }
            else if(settings.workspaceViews[id].includeRecents   && (settings.workspaceViews[id].startupView.toLowerCase() === 'recents')  ) { selectDefault = false; elemSelect.val('recents'); }

            for(let tableau of responses[0].data) {

                let  = $('<option></option>').appendTo(elemSelect)
                    .html(tableau.title)
                    .attr('value', tableau.link);

                if(selectDefault) {
                    if(settings.workspaceViews[id].startupView.toLowerCase() === tableau.title.toLowerCase()) {
                        elemSelect.val(tableau.link);
                    } else if(settings.workspaceViews[id].startupView.toLowerCase() === '') {
                        if(!isBlank(tableau.type)) {
                            if(tableau.type.toLowerCase() === 'default') {
                                elemSelect.val(tableau.link);
                            }
                        }
                    }
                }

            }

            if(settings.workspaceViews[id].includeMOW)       $('<option></option>').appendTo(elemSelect).html('My Outstanding Work').attr('value', 'mow');       
            if(settings.workspaceViews[id].includeBookmarks) $('<option></option>').appendTo(elemSelect).html('My Bookmarks').attr('value', 'bookmarks');
            if(settings.workspaceViews[id].includeRecents)   $('<option></option>').appendTo(elemSelect).html('Recently Viewed').attr('value', 'recents');
    
            insertWorkspaceViewsDone(id, responses[0]);
            settings.workspaceViews[id].load();

        }

    });

}
function changeWorkspaceView(id) {

    let elemSelect  = $('#' + id + '-view-selector');
    let linkView    = elemSelect.val();
    let params      = { 
        id              : id + '-content', 
        hideHeader      : true, 
        openInPLM       : settings.workspaceViews[id].openInPLM,
        onItemClick     : settings.workspaceViews[id].onItemClick,
        onItemDblClick  : settings.workspaceViews[id].onItemDblClick,
        workspacesIn    : [settings.workspaceViews[id].wsId]
     }

           if(linkView === 'mow'      ) {         insertMOW(params);      
    } else if(linkView === 'bookmarks') {   insertBookmarks(params);  
    } else if(linkView === 'recents'  ) { insertRecentItems(params);  
    } else { 
        insertWorkspaceViewData(id); 
    }

}
function insertWorkspaceViewData(id) {

    settings.workspaceViews[id].timestamp = startPanelContentUpdate(id, settings.workspaceViews[id].mode);
    settings.workspaceViews[id].link      = $('#' + id + '-view-selector').val();

    let params = { 
        link      : settings.workspaceViews[id].link, 
        page      : settings.workspaceViews[id].page,
        size      : settings.workspaceViews[id].limit,
        timestamp : settings.workspaceViews[id].timestamp
    };

    let requests = [ $.get('/plm/tableau-data', params )];

    if(settings.workspaceViews[id].mode === 'initial') {
        requests.push($.get('/plm/tableau-columns', { link : settings.workspaceViews[id].link} ));
    }

    Promise.all(requests).then(function(responses) {

        if(settings.workspaceViews[id].mode === 'initial') {

            if(stopPanelContentUpdate(responses[0], settings.workspaceViews[id])) return;

            for(let column of responses[1].data) {
                if(!isBlank(column.displayOrder)) {
                    if(!isBlank(column.field.urn)) {
                        let fieldId = column.field.urn.split('.').pop();
                        if(includePanelTableColumn(fieldId, column.field.title, settings.workspaceViews[id], settings.workspaceViews[id].columns.length)) {
                            settings.workspaceViews[id].columns.push({
                                displayName : column.field.title,
                                fieldId     : fieldId
                            });    
                        }
                    }
                }
            }
        }

        let items = [];

        for(let row of responses[0].data.items) {0

            let item = genPanelContentItem(settings.workspaceViews[id], { link : row.item.link} );

            for(let column of  settings.workspaceViews[id].columns) {
                for(let field of row.fields) {
                    if(field.id === column.fieldId) {
                        item.data.push({
                            fieldId : field.id,
                            value   : field.value
                        });
                    }
                }
            }

            for(let field of row.fields) {

                if(field.id === settings.workspaceViews[id].tileTitle   ) item.title      = field.value;
                if(field.id === settings.workspaceViews[id].tileSubtitle) item.subtitle   = field.value;
                if(field.id === settings.workspaceViews[id].tileImage   ) item.image      = field.value;
                if(field.id === settings.workspaceViews[id].groupBy       ) item.group      = field.value;
                if(field.id === config.items.fieldIdNumber                     ) item.partNumber = field.value;

                if(settings.workspaceViews[id].additionalData.includes(field.id)) {
                    item.attributes.push({
                        key : field.id.toLowerCase(),
                        value : field.value
                    });
                }

                for(let detail of item.details) if(detail.id === field.id) detail.value = field.value;

            }

            items.push(item);
    
        }

        finishPanelContentUpdate(id, settings.workspaceViews[id], items);
        setPanelPaginationControls(id, settings.workspaceViews[id], responses[0].data.total);
        changeWorkspaceViewDone(id, responses[0]);

    });

}
function insertWorkspaceViewsDone(id, data) {}
function changeWorkspaceViewDone(id, data) {}



// Display ALL RECORDS of defined workspace
function insertWorkspaceItems(wsId, params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'workspace-items' : params.id;

    settings.workspaceItems[id] = getPanelSettings('', params, {
        headerLabel : 'Workspace Items',
        layout      : 'grid',
        contentSize : 's'
    }, [
        [ 'filter'  , '' ],
        [ 'sortBy'  , 'DESCRIPTOR' ],
        [ 'groupBy' , '' ]
    ]);

    settings.workspaceItems[id].wsId   = wsId;
    settings.workspaceItems[id].load = function() { insertWorkspaceItemsData(id); }

    genPanelTop(id, settings.workspaceItems[id], 'bookmarks');
    genPanelHeader(id, settings.workspaceItems[id]);
    genPanelOpenSelectedInPLMButton(id, settings.workspaceItems[id]);
    genPanelSelectionControls(id, settings.workspaceItems[id]);

    genPanelSearchInput(id, settings.workspaceItems[id]);
    genPanelResizeButton(id, settings.workspaceItems[id]);
    genPanelReloadButton(id, settings.workspaceItems[id]);
    
    genPanelContents(id, settings.workspaceItems[id]);

    settings.workspaceItems[id].load();
    
}
function insertWorkspaceItemsData(id) {

    settings.workspaceItems[id].timestamp = startPanelContentUpdate(id);

    let url = (isBlank(settings.workspaceItems[id].filter)) ? '/plm/items' : '/plm/search-bulk';

    switch(typeof settings.workspaceItems[id].tileImage) {
        case 'boolean': if(settings.workspaceItems[id].tileImage) url = '/plm/search-bulk'; break;
        case 'string' : url = '/plm/search-bulk'; break;
    }

    $.get(url, { 
        timestamp : settings.workspaceItems[id].timestamp, 
        wsId      : settings.workspaceItems[id].wsId,
        query     : (isBlank(settings.workspaceItems[id].filter)) ? '*' : settings.workspaceItems[id].filter,
        useCache  : settings.workspaceItems[id].useCache,
        bulk      : false,
        useCace   : true,
        limit     : 250
    }, function(response) {
        
        if(stopPanelContentUpdate(response, settings.workspaceItems[id])) return;

        let items                           = [];
        let columns                         = []
        settings.workspaceItems[id].columns = [];

        if(!isBlank(settings.workspaceItems[id].tileTitle)) {
            columns.push({
                displayName : 'Item',
                fieldId     : settings.workspaceItems[id].tileTitle 
            }); 
        };

        if(!isBlank(settings.workspaceItems[id].tileSubtitle)) {
            columns.push({
                displayName : '',
                fieldId     : settings.workspaceItems[id].tileSubtitle 
            }); 
        };

        for(let detail of settings.workspaceItems[id].tileDetails) {
            columns.push({
                displayName : detail[1],
                fieldId     : detail[2] 
            });         
        }

        for(let column of columns) {
            if(includePanelTableColumn(column.displayName, settings.workspaceItems[id], settings.workspaceItems[id].columns.length)) {
                settings.workspaceItems[id].columns.push(column);    
            }
        }

        if(!isBlank(settings.workspaceItems[id].sortBy)) {
            for(let item of response.data.items) {
                item.sortKey = getSectionFieldValue(item.sections, settings.workspaceItems[id].sortBy, '', 'title');
            }
            sortArray(response.data.items, 'sortKey', 'string', 'ascending');
        }

        for(let item of response.data.items) {

            let contentItem = genPanelContentItem(settings.workspaceItems[id], {
                link  : item.__self__, 
                title : item.title
            });

            for(let column of  settings.workspaceItems[id].columns) {

                if(column.fieldId === 'DESCRIPTOR') {
                    if(settings.workspaceItems[id].tileTitle    === column.fieldId) contentItem.title    = item.title;
                    if(settings.workspaceItems[id].tileSubtitle === column.fieldId) contentItem.subtitle = item.title;
                    if(settings.workspaceItems[id].groupBy        === column.fieldId) contentItem.group    = item.title;
                    contentItem.data.push({
                        fieldId : column.fieldId,
                        value   : item.title
                    });
                } else if(column.fieldId === 'WF_CURRENT_STATE') {
                    if(settings.workspaceItems[id].tileTitle    === column.fieldId) contentItem.title    = item.currentState.title;
                    if(settings.workspaceItems[id].tileSubtitle === column.fieldId) contentItem.subtitle = item.currentState.title;
                    if(settings.workspaceItems[id].groupBy        === column.fieldId) contentItem.group    = item.currentState.title;
                    contentItem.data.push({
                        fieldId : column.fieldId,
                        value   : item.currentState.title
                    });
                } else {

                    let value = getSectionFieldValue(item.sections, column.fieldId, '', 'title');

                    contentItem.data.push({
                        fieldId : column.fieldId,
                        value   : value
                    });

                }
            }

            for(let section of item.sections) {
                for(let field of section.fields) {

                    let fieldId = field.__self__.split('/').pop();
                    let value   = isBlank(field.value) ? '' : field.value;

                    if(typeof value === 'object') value = value.title;

                    if(fieldId === settings.workspaceItems[id].tileTitle   ) contentItem.title      = value;
                    if(fieldId === settings.workspaceItems[id].tileSubtitle) contentItem.subtitle   = value
                    if(fieldId === settings.workspaceItems[id].tileImage   ) contentItem.imageLink  = (isBlank(field.value)) ? '' : field.value.link;
                    if(fieldId === settings.workspaceItems[id].groupBy     ) contentItem.group      = value;
                    if(fieldId === config.items.fieldIdNumber              ) contentItem.partNumber = value;

                    if(settings.workspaceItems[id].additionalData.includes(fieldId)) {

                        let attributeValue = isBlank(field.value) ? '' : field.value;
                        if(typeof attributeValue === 'object') attributeValue = attributeValue.link;

                        contentItem.attributes.push({
                            key   : fieldId.toLowerCase(),
                            value : attributeValue
                        });
                    }

                    for(let detail of contentItem.details) if(detail.id === fieldId) detail.value = value;

                }
            }

            // console.log(contentItem);

            items.push(contentItem);

        }

        finishPanelContentUpdate(id, settings.workspaceItems[id], items);
        insertWorkspaceItemsDataDone(id, response);

    });

}
function insertWorkspaceItemsDataDone(id, response) {}



// Insert basic SEARCH capability
function insertSearch(params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'search' : params.id;

    settings.search[id] = getPanelSettings('', params, {
        headerLabel  : 'Search',
        placeholder  : 'Filter results' ,
        layout       : 'list',
        contentSize  : 'xs',
        tileTitle    : 'Descriptor',
        tileSubtitle : 'Workspace'
    }, [
        [ 'inputLabel'          , 'Enter search critieria' ],
        [ 'buttonIcon'          , 'icon-search' ],
        [ 'buttonLabel'         , 'Search' ],
        [ 'limit'               , 25 ],
        [ 'baseQuery'           , '' ],
        [ 'groupBy'             , '' ],
        [ 'sortBy'              , '' ],
        [ 'workspaceIds'        , [] ],
        [ 'exactMatch'          , false ],
        [ 'autoClick'           , false ],
        [ 'filterByOwner'       , true ],
        [ 'filterByWorkspace'   , true ]
    ]);

    settings.search[id].load = function() { resetSearch(id, true); }

    genPanelTop(id, settings.search[id], 'search');
    genPanelHeader(id, settings.search[id]);
    genPanelOpenSelectedInPLMButton(id, settings.search[id]);
    genPanelSelectionControls(id, settings.search[id]);
    genPanelFilterSelect(id, settings.search[id].filterByOwner, 'owner', 'All Owners');
    genPanelFilterSelect(id, settings.search[id].filterByWorkspace, 'workspace', 'All Workspaces');
    genPanelSearchInput(id, settings.search[id]).hide();
    genPanelResizeButton(id, settings.search[id]);
    genPanelReloadButton(id, settings.search[id]);

    genPanelToolbar(id, settings.search[id], 'actions');

    $('<input></input>').appendTo($('#' + id + '-actions'))
        .attr('placeholder', settings.search[id].inputLabel)
        .attr('id', id + '-search-content-input')
        .addClass('search-content-input')
        // .hide()
        .click(function(e){
            e.preventDefault();
            e.stopPropagation();
        })
        .keypress(function(e) {
            if(e.which == 13) {
                insertSearchData(id);
            }
        });

    let elemButton = $('<div></div>').appendTo($('#' + id + '-actions'))
        .attr('id', id + '-search-content-button')
        .addClass('search-content-button')
        .addClass('button')
        .addClass('default')
        .addClass('disabled')
        // .hide()
        .html(settings.search[id].buttonLabel)
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            resetSearch(id, false);
            insertSearchData(id);
        });

    if(!isBlank(settings.search[id].buttonIcon)) elemButton.addClass('with-icon').addClass(settings.search[id].buttonIcon);

    genPanelContents(id, settings.search[id]);

    getWorkspaceIdsFromNames(settings.search[id], function(workspaceIds) {
        settings.search[id].workspaceIds = workspaceIds;
        settings.search[id].load();
    });

    insertSearchDone(id);


}
function insertSearchDone(id) {}
function resetSearch(id, resetInput) {

    if(resetInput) $('#' + id + '-search-content-input').val('').focus();
    
    $('.search-filter').hide();
    $('#' + id + '-search').hide();
    $('#' + id + '-content').hide();
    $('#' + id + '-processing').hide();
    $('#' + id + '-no-data').hide();
    $('#' + id + '-no-data').hide();
    $('#' + id + '-search-content-button').removeClass('disabled');

}
function insertSearchData(id) {

    settings.search[id].timestamp = startPanelContentUpdate(id);

    let params = {
        query     : $('#' + id + '-search-content-input').val(),
        limit     : settings.search[id].limit,
        timestamp : settings.search[id].timestamp
    }

    if(!isBlank(settings.search[id].baseQuery)   ) params.query     += '+AND+' + settings.search[id].baseQuery;
    if(!isBlank(settings.search[id].workspaceIds)) params.workspaces = settings.search[id].workspaceIds;
    if(settings.search[id].exactMatch            ) params.wildcard   = false;

    $.post('/plm/search-descriptor', params, function(response) {

        if(stopPanelContentUpdate(response, settings.search[id])) return;
            
        let items           = [];
        let listWorkspaces  = [];
        let listOwners      = [];

        settings.search[id].columns = [];

        let columns = [
            { displayName : 'Descriptor', fieldId : 'descriptor' },
            { displayName : 'Category'  , fieldId : 'category'   },
            { displayName : 'Creator'   , fieldId : 'creator'    },
            { displayName : 'Owner'     , fieldId : 'owner'      },
            { displayName : 'Workspace' , fieldId : 'workspaceLongName'  }
        ]; 

        for(let column of columns) {
            if(includePanelTableColumn(column.displayName, settings.search[id], settings.search[id].columns.length)) {
                settings.search[id].columns.push(column);    
            }
        }

        for(let record of response.data.items) {

            if(!listOwners.includes(record.owner)) listOwners.push(record.owner);
            if(!listWorkspaces.includes(record.workspaceLongName)) listWorkspaces.push(record.workspaceLongName);

            record.tileTitle    = '';
            record.tileSubitle  = '';
            record.group        = (settings.search[id].groupBy === '') ? '' : record[settings.search[id].groupBy];

            for(let column of columns) {

                if(settings.search[id].tileTitle === column.displayName) record.tileTitle = record[column.fieldId];
                if(settings.search[id].tileSubtitle === column.displayName) record.tileSubitle = record[column.fieldId];

            }

            let contentItem = genPanelContentItem(settings.search[id], {
                link     : record.__self__,
                title    : record.tileTitle,
                subtitle : record.tileSubitle,
                group    : record.group
            });

            contentItem.data = [
                { fieldId : 'descriptor', value : record.descriptor,},
                { fieldId : 'category'  , value : record.category },
                { fieldId : 'creator'   , value : record.creator },
                { fieldId : 'owner'     , value : record.owner },
                { fieldId : 'workspaceLongName' , value : record.workspaceLongName }
            ],

            contentItem.filters = [
                { key : 'owner', value : record.owner },
                { key : 'workspace', value : record.workspaceLongName }
            ]

            items.push(contentItem);

        }

        // if(response.data.items.length === 0) {
        //     $('#' + id + '-no-data').show();
        //     $('#' + id + '-content').hide();
        // } else {
        //     if(settings.search[id].search) $('#' + id + '-search').show();
        //     if(settings.search[id].autoClick) {
        //         $('#' + id + '-content').find('.content-item').first().click();
        //     }
        // }

        // if(response.data.items.length < response.data.totalCount) {

        //     $('<div></div>').appendTo($('#' + id + '-content'))
        //         .addClass('search-content-status')
        //         .html('Showing ' + response.data.items.length + ' out of ' + response.data.totalCount + ' total matches');

        // }

        sortArray(listOwners, 0);
        sortArray(listWorkspaces, 0);
        
        setPanelFilterOptions(id, 'owner', listOwners);
        setPanelFilterOptions(id, 'workspace', listWorkspaces);
        finishPanelContentUpdate(id, settings.search[id], items);

        if(settings.search[id].autoClick) {
            if($('#' + id + '-content').find('.content-item').length === 1) {
                $('#' + id + '-content').find('.content-item').first().click();
            }
        }


        insertSearchDataDone(id, response);

    });

}
function insertSearchDataDone(id, data) {}
function clickSearchResult(elemClicked, e) {
    openItemByLink(elemClicked.attr('data-link'));
}



// Insert advanced SEARCH results
function insertResults(wsId, filters, params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'results' : params.id;

    settings.results[id] = getPanelSettings('', params, {
        headerLabel  : 'Results',
        layout       : 'table',
        contentSize  : 'xs',
        tileTitle    : 'DESCRIPTOR',
        tileSubtitle : ''
    }, [
        [ 'wsId'            , wsId ],
        [ 'filters'         , filters ],
        [ 'fields'          , ['DESCRIPTOR'] ],
        [ 'sortBy'          , ['DESCRIPTOR'] ],
        [ 'groupBy'         , '' ],
        [ 'autoClick'       , false ],
        [ 'editable'        , false ],
        [ 'filterEmpty'     , false ],
        [ 'tileImageFieldId', ''    ],
        [ 'tileSubtitle'    , ''    ]
    ]);

    if(!settings.results[id].fields.includes('DESCRIPTOR')) {
        settings.results[id].fields.unshift('DESCRIPTOR');
    }

    if(!isBlank(settings.results[id].groupBy)) {
        if(!settings.results[id].fields.includes(settings.results[id].groupBy)) {
            settings.results[id].fields.push(settings.results[id].groupBy);
        }
    }

    if(!isBlank(settings.results[id].additionalData)) {
        for(let additionalData of settings.results[id].additionalData) {
            if(!settings.results[id].fields.includes(additionalData)) {
                settings.results[id].fields.push(additionalData);
            }
        }
    }

    if(typeof settings.results[id].tileImage == 'string') {
        settings.results[id].tileImageFieldId = settings.results[id].tileImage;
        if(!settings.results[id].fields.includes(settings.results[id].tileImage)) {
            settings.results[id].fields.push(settings.results[id].tileImage);
        }      
    }

    if(typeof settings.results[id].tileTitle == 'string') {
        if(!isBlank(settings.results[id].tileTitle)) {
            if(!settings.results[id].fields.includes(settings.results[id].tileTitle)) {
                settings.results[id].fields.push(settings.results[id].tileTitle);
            }
        }
    } else if(typeof settings.results[id].tileTitle == 'object') {
        for(let tileTitle of settings.results[id].tileTitle) {
            if(!settings.results[id].fields.includes(tileTitle)) {
                settings.results[id].fields.push(tileTitle);
            }
        }
    }

    if(typeof settings.results[id].tileSubtitle == 'string') {
        if(!isBlank(settings.results[id].tileSubtitle)) {
            if(!settings.results[id].fields.includes(settings.results[id].tileSubtitle)) {
                settings.results[id].fields.push(settings.results[id].tileSubtitle);
            }
        }
    } else if(typeof settings.results[id].tileSubtitle == 'object') {
        for(let tileSubtitle of settings.results[id].tileSubtitle) {
            if(!settings.results[id].fields.includes(tileSubtitle)) {
                settings.results[id].fields.push(tileSubtitle);
            }
        }
    }

    if(!isBlank(settings.results[id].tileDetails)) {
        for(let tileDetail of settings.results[id].tileDetails) {
            if(!isBlank(tileDetail.fieldId)) {
                if(!settings.results[id].fields.includes(tileDetail.fieldId)) {
                    settings.results[id].fields.push(tileDetail.fieldId);
                }
            }
        }
    }

    if(!isBlank(settings.results[id].fieldsIn)) {
        for(let fieldId of settings.results[id].fieldsIn) {
            if(!settings.results[id].fields.includes(fieldId)) {
                settings.results[id].fields.push(fieldId);
            }
        }
    }

    if(settings.results[id].stateColors.length > 0) {
        if(!settings.results[id].fields.includes('WF_CURRENT_STATE')) {
            settings.results[id].fields.push('WF_CURRENT_STATE');
        }
    }

    settings.results[id].load = function() { insertResultsData(id, true); }

    genPanelTop(id, settings.results[id], 'results');
    genPanelHeader(id, settings.results[id]);
    genPanelOpenSelectedInPLMButton(id, settings.results[id]);
    genPanelSelectionControls(id, settings.results[id]);
    genPanelFilterToggleEmpty(id, settings.results[id]);
    genPanelSearchInput(id, settings.results[id]);
    genPanelResizeButton(id, settings.results[id]);
    genPanelReloadButton(id, settings.results[id]);

    genPanelContents(id, settings.results[id]);

    if(settings.results[id].editable) {

        let elemToolbar = genPanelToolbar(id, settings.results[id], 'controls');

        $('<div></div>').prependTo(elemToolbar)
            .addClass('button')
            .addClass('default')
            .addClass('panel-action')
            .attr('id', id + '-action-save')
            .attr('title', 'Save changes')
            .html('Save')
            .hide()
            .click(function() {
                savePanelTableChanges(id, settings.results[id]);
            });
        
    }
    
    insertResultsDone(id);
    settings.results[id].load();

}
function insertResultsData(id) {

    settings.results[id].timestamp = startPanelContentUpdate(id);

    let elemCounters =  $('#' + id + '-content-counters');
    
    if(elemCounters.length > 0) elemCounters.children().each(function() { $(this).html('').removeClass('not-empty'); })

    let params = {
        wsId        : settings.results[id].wsId,
        filter      : settings.results[id].filters,
        fields      : settings.results[id].fields,
        sort        : settings.results[id].sortBy,
        timestamp   : settings.results[id].timestamp,
        useCache    : settings.results[id].useCache
    }

    let requests = [
        $.post( '/plm/search', params),
        $.get( '/plm/fields',  { wsId : settings.results[id].wsId} ),
    ];

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.results[id])) return;

        let items = [];

        settings.results[id].columns = [];

        for(let fieldId of settings.results[id].fields) {
            if(includePanelTableColumn(fieldId, '', settings.results[id], settings.results[id].columns.length)) {
                if(fieldId === 'DESCRIPTOR') {
                    settings.results[id].columns.push({
                        'displayName' : 'Descriptor',
                        'fieldId'     : 'DESCRIPTOR'
                    });
                } else if(fieldId === 'WF_CURRENT_STATE') {
                    settings.results[id].columns.push({
                        'displayName' : 'Current Status',
                        'fieldId'     : 'WF_CURRENT_STATE'
                    });
                } else {
                    for(let workspaceField of responses[1].data) {
                        let workspaceFieldId = workspaceField.__self__.split('/').pop();
                        if(fieldId === workspaceFieldId) {
                            // field.displayName = field.name;
                            // field.fieldId = column;
                            settings.results[id].columns.push({
                                displayName : workspaceField.name,
                                fieldId : workspaceFieldId,
                            });
                        }
                    }  
                }  
            }
        }

        for(let row of responses[0].data.row) {

            let contentItem = genPanelContentItem(settings.results[id], {
                link : '/api/v3/workspaces/' + settings.results[id].wsId + '/items/' + row.dmsId
            })

            if(typeof settings.results[id].tileTitle == 'object') {
                contentItem.tileTitles = [];
                for(let tileTitle of settings.results[id].tileTitle) {
                    contentItem.tileTitles[tileTitle] = '';
                }
            }
            if(typeof settings.results[id].tileSubtitle == 'object') {
                contentItem.tileSubtitles = [];
                for(let tileSubtitle of settings.results[id].tileSubtitle) {
                    contentItem.tileSubtitles[tileSubtitle] = '';
                }
            }

            for(let field of row.fields.entry) {

                if(field.key === config.items.fieldIdNumber           ) contentItem.partNumber = field.fieldData.value;
                if(field.key === settings.results[id].tileImageFieldId) contentItem.imageId    = field.fieldData.value;
                if(field.key === settings.results[id].groupBy         ) contentItem.group      = field.fieldData.value;
                if(field.key === 'DESCRIPTOR'                         ) contentItem.descriptor = field.fieldData.value;
                if(field.key === 'WF_CURRENT_STATE'                   ) contentItem.status     = field.fieldData.value;

                if(typeof settings.results[id].tileTitle == 'string') {
                    if(field.key === settings.results[id].tileTitle) contentItem.title = field.fieldData.value;
                } else if(typeof settings.results[id].tileTitle == 'object') {
                    for(let tileTitle of settings.results[id].tileTitle) {
                        if(field.key === tileTitle) contentItem.tileTitles[tileTitle] = field.fieldData.value;
                    }
                }

                if(typeof settings.results[id].tileSubtitle == 'string') {
                    if(field.key === settings.results[id].tileSubtitle) contentItem.subtitle = field.fieldData.value;
                } else if(typeof settings.results[id].tileSubtitle == 'object') {
                    for(let tileSubtitle of settings.results[id].tileSubtitle) {
                        if(field.key === tileSubtitle) contentItem.tileSubtitles[tileSubtitle] = field.fieldData.value;
                    }
                } 

                for(let tileDetail of contentItem.details) {
                    if(field.key === tileDetail.fieldId) {
                        tileDetail.value = field.fieldData.value;
                    }
                }

                if(settings.results[id].additionalData.includes(field.key)) {
                    contentItem.attributes.push({
                        key   : field.key.toLowerCase(),
                        value : field.fieldData.value
                    });
                }

                for(let column of settings.results[id].columns) {

                    if(field.key === column.fieldId) {

                        let value = field.fieldData.value;
                        let type  = field.fieldData.dataType;

                        switch(type) {

                            case 'Check Box':
                                value = (field.fieldData.value === 't');
                                break;

                            case 'Date':
                                value = field.fieldData.formattedValue;
                                break;

                        }
                    
                        contentItem.data.push({
                            fieldId : column.fieldId,
                            value   : value
                        });

                        break;
                    }

                }

            }

            if(typeof settings.results[id].tileTitle == 'object') {
                for(let tileTitle of settings.results[id].tileTitle) {
                    if(contentItem.tileTitles[tileTitle] !== '') {
                        contentItem.title = contentItem.tileTitles[tileTitle];
                        break;
                    }
                }
            }
            if(typeof settings.results[id].tileSubtitle == 'object') {
                for(let tileSubtitle of settings.results[id].tileSubtitle) {
                    if(contentItem.tileSubtitles[tileSubtitle] !== '') {
                        contentItem.subtitle = contentItem.tileSubtitles[tileSubtitle];
                        break;
                    }
                }
            }

            items.push(contentItem);

        }

        finishPanelContentUpdate(id, settings.results[id], items);

        if(settings.results[id].autoClick) {
            if($('#' + id + '-content').find('.content-item').length > 0) {
                $('#' + id + '-content').find('.content-item').first().click();
            }
        }

        insertResultsDataDone(id, responses);

    });

}
function insertResultsDone(id) {}
function insertResultsDataDone(id, data) {}



// Insert Classification Browser
function insertClasses(params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'classes' : params.id;

    settings.classes[id] = getPanelSettings('', params, {
        headerLabel : 'Classes',
        placeholder : 'Filter clases' ,
        contentSize : 'm'
    }, [
        [ 'depth'          , 10    ],
        [ 'path'           , false ],
        [ 'toggles'        , false ],
        [ 'hideNumber'     , true  ],
        [ 'hideTableHeader', true  ]
    ]);

    settings.classes[id].load         = function() { insertClassesData(id); }
    settings.classes[id].layout       = 'tree';
    settings.classes[id].skipRootItem = true;

    genPanelTop(id, settings.classes[id], 'classes');
    genPanelHeader(id, settings.classes[id]);
    genPanelSelectionControls(id, settings.classes[id]);

    genPanelToggleButtons(id, settings.classes[id], 
        function() {   expandAllNodes(id); }, 
        function() { collapseAllNodes(id); }
    );

    genPanelResizeButton(id, settings.classes[id]);
    genPanelSearchInput(id, settings.classes[id]);
    genPanelResetButton(id, settings.classes[id]);
    genPanelReloadButton(id, settings.classes[id]);
    
    genPanelContents(id, settings.classes[id]);

    if(settings.classes[id].path) {

        $('<div></div>').appendTo($('#' + id))
            .attr('id', id + '-tree-path')
            .addClass('tree-path-empty')
            .addClass('tree-path')
            .addClass('no-scrollbar');

        let elemTreeGoTo = $('<div></div>').appendTo($('#' + id))
            .attr('id', id + '-tree-goto')
            .addClass('tree-go-to');

        $('<div></div>').appendTo(elemTreeGoTo)
            .attr('id', id + '-tree-go-to-top')
            .addClass('tree-go-to-top')
            .addClass('button')
            .addClass('icon')
            .addClass('icon-top')
            .attr('title', 'Scroll to top')
            .click(function() {
                treeScrollToTop(id);
            });

        $('<div></div>').appendTo(elemTreeGoTo)
            .attr('id', id + '-tree-go-to-bottom')
            .addClass('tree-go-to-bottom')
            .addClass('button')
            .addClass('icon')
            .addClass('icon-bottom')
            .attr('title', 'Scroll to bottom')
            .click(function() {
                treeScrollToBottom(id);
            });

        $('#' + id).addClass('with-tree-path');

    } 

    insertClassesDone(id);

    settings.classes[id].load();

}
function insertClassesData(id) {

    settings.classes[id].timestamp = startPanelContentUpdate(id);

    let requests = [
        $.get('/plm/classes'     , { useCache : settings.classes[id].useCache, timestamp : settings.classes[id].timestamp}),
        $.get('/plm/classes-tree', { useCache : settings.classes[id].useCache})
    ];

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.classes[id])) return;

        let items = [];

        for(let classification of responses[0].data.classifications) {

            let contentItem = {
                id              : classification.id,
                link            : classification.__self__,
                name            : classification.name,
                title           : classification.displayName,
                description     : classification.description,
                propertiesCount : classification.propertyInstances.size,
                properties      : classification.effectiveSchema,
                childrenCount   : classification.children.size,
                hasChildren     : (classification.children.size > 0),
                path            : '',
                level           : -1,
                domProperties   : [{
                    key : 'NAME', value : classification.name
                }]
            }

            items.push(contentItem);

        }

        let contentItems = [];

        setClassLevels(settings.classes[id], responses[1].data, items, items[0], 0, items[0].id, '');
        buildClassesTree(items, contentItems, items[0]);
        finishPanelContentUpdate(id, settings.classes[id], contentItems, null, responses[0].data);

    });

}
function setClassLevels(settings, hierarchy, items, item, level, parentId, path) {

    let separator = (path === '') ? '' : '.';
    let children  = hierarchy[item.id];

    item.level    = level;
    item.path     = path;
    item.parentId = parentId;
    item.children = [];

    path += separator + item.title;

    if(level < settings.depth) {

        for(let child of children) {

            for(let nextItem of items) {
                if(nextItem.id == child) {
                    item.children.push({
                        title : nextItem.title,
                        id   : nextItem.id
                    });
                    setClassLevels(settings, hierarchy, items, nextItem, level + 1, item.id, path);
                }
            }

        }

        sortArray(item.children, 'title');

    } else item.hasChildren = false;

}
function buildClassesTree(items, contentItems, item) {

    contentItems.push(item);

    for(let child of item.children) {
        for(let subItem of items) {
            if(child.id == subItem.id) {
                buildClassesTree(items, contentItems, subItem);
            }
        }
    }

}
function insertClassesDone(id) {}
function insertClassesDataDone(id, data) {}



// Insert Class Contents
function insertClassContents(classId, className, params) {

    if(isBlank(params)) params = {};

    if(isBlank(classId))   { console.log('insertClassContents() invoked without parameter classId'  ); return; }
    if(isBlank(className)) { console.log('insertClassContents() invoked without parameter className'); return; }

    let id = isBlank(params.id) ? 'contents' : params.id;

    settings.classContents[id] = getPanelSettings('', params, {
        contentSize : 'm',
        headerLabel : 'Class Items'
    }, [
        [ 'layout'           , 'table'        ],
        [ 'filterByStatus'   , false          ],
        [ 'filterByWorkspace', false          ],        
        [ 'fields'           , ['DESCRIPTOR'] ],
        [ 'query'            , ''             ],
        [ 'pagination'       , true           ],
        [ 'limit'            , 20             ],
        [ 'referenceItem'    , null           ],
        [ 'referenceData'    , {}             ],
    ]);

    settings.classContents[id].load      = function() { insertClassData(id); }
    settings.classContents[id].next      = function() { insertClassData(id); }
    settings.classContents[id].classId   = (typeof classId === 'string') ? classId.split('/').pop() : classId;
    settings.classContents[id].className = className;

    genPanelTop                     (id, settings.classContents[id], 'classContents');
    genPanelHeader                  (id, settings.classContents[id]);
    genPanelOpenSelectedInPLMButton (id, settings.classContents[id]);
    genPanelSelectionControls       (id, settings.classContents[id]);
    genPanelFilterSelect            (id, settings.classContents[id], 'filterByStatus', 'status', 'All States');
    genPanelFilterSelect            (id, settings.classContents[id], 'filterByWorkspace', 'workspace', 'All Workspaces');    
    genPanelResizeButton            (id, settings.classContents[id]);
    genPanelSearchInput             (id, settings.classContents[id]);
    genPanelResetButton             (id, settings.classContents[id]);
    genPanelReloadButton            (id, settings.classContents[id]);
    genPanelContents                (id, settings.classContents[id]);
    genPanelPaginationControls      (id, settings.classContents[id]);

    let elemToolbar = genPanelToolbar(id, settings.classContents[id], 'controls');

    let elemSort = $('<select></select>').prependTo(elemToolbar)
        .addClass('button')
        .addClass(id + '-sort-by')
        .attr('id', id + '-sort-by')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();     
        })
        .on('change', function(e) {
            e.preventDefault();
            e.stopPropagation();
            settings.classContents[id].sort = $('#' + id + '-sort-by').val();
            settings.classContents[id].load();
        });

    elemSort.append($('<option></option>').attr('value', 'score asc').html('Sort by relevance'));
    elemSort.append($('<option></option>').attr('value', 'itemDescriptor asc').html('Sort by Descriptor (ascending)'));
    elemSort.append($('<option></option>').attr('value', 'itemDescriptor desc').html('Sort by Descriptor (decending)'));
    elemSort.append($('<option></option>').attr('value', 'createdOn asc').html('Sort by Creation Date (ascending)'));
    elemSort.append($('<option></option>').attr('value', 'createdOn desc').html('Sort by Creation Date (decending)'));
    elemSort.append($('<option></option>').attr('value', 'lastModifiedOn asc').html('Sort by Last Modification Date (ascending)'));
    elemSort.append($('<option></option>').attr('value', 'lastModifiedOn desc').html('Sort by Last Modification Date (decending)'));

    insertClassDone(id);

    settings.classContents[id].load();

}
function insertClassData(id) {

    settings.classContents[id].timestamp = startPanelContentUpdate(id, settings.classContents[id].mode);

    let params = { 
        className : settings.classContents[id].className, 
        classId   : settings.classContents[id].classId, 
        query     : settings.classContents[id].query,
        sort      : settings.classContents[id].sort,
        page      : settings.classContents[id].page,
        limit     : settings.classContents[id].limit,
        offset    : settings.classContents[id].offset,
        timestamp : settings.classContents[id].timestamp
    };

    let requests = [
        $.get('/plm/search-class', params),
        $.get('/plm/class-properties', { 
            classId   : settings.classContents[id].classId, 
            timestamp : settings.classContents[id].timestamp,
            useCache  : true
        })
    ];

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.classContents[id])) return;

        let items           = [];
        let listFields      = [];
        let listStates      = [];
        let listWorkspaces  = [];

        for(let fieldId of settings.classContents[id].fields) {
            if(includePanelTableColumn(fieldId, '', settings.classContents[id], settings.classContents[id].columns.length)) {

                switch(fieldId) {

                    case 'DESCRIPTOR'      : settings.classContents[id].columns.push({ displayName : 'Descriptor', fieldId : 'DESCRIPTOR'      }); break;
                    case 'WORKSPACE'       : settings.classContents[id].columns.push({ displayName : 'Workspace' , fieldId : 'WORKSPACE'       }); break;
                    case 'REVISION'        : settings.classContents[id].columns.push({ displayName : 'Revision'  , fieldId : 'REVISION'        }); break;
                    case 'LIFECYCLE'       : settings.classContents[id].columns.push({ displayName : 'Lifecycle' , fieldId : 'LIFECYCLE'       }); break;
                    case 'WF_CURRENT_STATE': settings.classContents[id].columns.push({ displayName : 'Status'    , fieldId : 'WF_CURRENT_STATE'}); break;

                    default : settings.classContents[id].columns.push({
                        displayName : fieldId,
                        fieldId     : fieldId
                    }); break;

                }

            }
        }

        for(let property of responses[1].data) {
            if(!listFields.includes(property.name)) {
                settings.classContents[id].columns.push({
                    displayName : property.displayName,
                    fieldId     : '0CWS_' + property.name
                });
                listFields.push(property.name);
            }
        }

        if(settings.classContents[id].referenceItem !== null) {
            let index = 0;
            for(let item of responses[0].data.items) {
                if(item.__self__ === settings.classContents[id].referenceItem.__self__) {
                    responses[0].data.items.splice(index, 1);
                    break;
                }
                index++;
            }
            responses[0].data.items.unshift(settings.classContents[id].referenceItem);
        }

        for(let item of responses[0].data.items) {

            if(item.hasOwnProperty('title')) {

                let contentItem = genPanelContentItem(settings.classContents[id], { link : item.__self__ });
                let workspace   = item.workspace.title;
                let status      = item.workflowStateName || '';

                if(!isBlank(item.lifecycle)) status = item.lifecycle.title;

                if(!listStates.includes(status)) listStates.push(status);
                if(!listWorkspaces.includes(workspace)) listWorkspaces.push(workspace);            

                for(let column of  settings.classContents[id].columns) {

                    let value = '';

                    switch(column.fieldId) {

                        case 'DESCRIPTOR' : value = item.title; break;
                        case 'WORKSPACE'  : value = item.workspace.title; break;
                        case 'REVISION'   : value = item.versionId; break;
                        case 'LIFECYCLE'  : value = item.lifecycle.title; break;
                        // case 'WF_CURRENT_STATE': value = item.lifecycle.title; break;

                        default : 
                            value = getSectionFieldValue(item.sections, column.fieldId, '', 'title');
                            if(column.fieldId === column.displayName) {
                                let field = getSectionField(item.sections, column.fieldId);
                                if(!isBlank(field)) column.displayName = field.title;
                            }
                            break;

                    }

                    contentItem.data.push({
                        fieldId : column.fieldId,
                        value   : value
                    });

                    contentItem.filters = [
                        { key : 'status'   , value : status    },
                        { key : 'workspace', value : workspace },
                    ];

                }            

                items.push(contentItem);

            }

        }

        sortArray(listStates, 0);
        sortArray(listWorkspaces, 0);
        setPanelFilterOptions(id, 'status', listStates);
        setPanelFilterOptions(id, 'workspace', listWorkspaces);
        finishPanelContentUpdate(id, settings.classContents[id], items);
        setPanelPaginationControls(id, settings.classContents[id], responses[0].data.totalCount);

        if(!isBlank(settings.classContents[id].referenceItem)) {
            let elemFirst = $('#' + id).find('.content-item').first();
            if(elemFirst.length > 0) elemFirst.addClass('reference');
        }

        insertClassDataDone(id, responses);

    });

}
function insertClassDone(id) {}
function insertClassDataDone(id, data) {}



// Insert Class Filters
function insertClassFilters(classId, className, params) {

    if(isBlank(params)) params = {};

    if(isBlank(classId)) { console.log('insertClassFilters() invoked without parameter classId'  ); return; }

    let id = isBlank(params.id) ? 'classFilters' : params.id;

    settings.classFilters[id] = getPanelSettings('', params, {
        contentSize : 'm',
        headerLabel : 'Filters'
    }, [
        [ 'idContents' , 'contents'     ],
        [ 'layout'     , 'table'        ],
        [ 'fields'     , ['DESCRIPTOR'] ],
        [ 'pagination' , true           ],
        [ 'limit'      , 25             ]
    ]);

    settings.classFilters[id].load      = function() { insertClassFiltersData(id); }
    settings.classFilters[id].classId   = (typeof classId === 'string') ? classId.split('/').pop() : classId;
    settings.classFilters[id].className = className;

    genPanelTop         (id, settings.classFilters[id], 'class');
    genPanelHeader      (id, settings.classFilters[id]);
    genPanelSearchInput (id, settings.classFilters[id]);
    genPanelContents    (id, settings.classFilters[id]);

    genPanelActionButton(id, { singleToolbar : 'controls'}, 'apply', 'Apply', 'Apply the defined filters', function() {
        applyClassFilters(id);
    }).addClass('default').addClass('with-icon').addClass('icon-start');

    insertClassFiltersDone(id);

    settings.classFilters[id].load();

}
function insertClassFiltersData(id) {

    settings.classFilters[id].timestamp = startPanelContentUpdate(id);

    let params = {
        classId   : settings.classFilters[id].classId, 
        timestamp : settings.classFilters[id].timestamp, 
        useCache  : true
    }

    $.get('/plm/class-properties', params, function(response) {

        if(stopPanelContentUpdate(response, settings.classFilters[id])) return;

        settings.classFilters[id].fields = [];

        let listExisting = [];

        for(let field of response.data) {
            if(!listExisting.includes(field.name)) {
                settings.classFilters[id].fields.push(field)
                listExisting.push(field.name)
            }
        }

        sortArray(settings.classFilters[id].fields, 'displayName', 'string');

        let elemContent = $('#' + id + '-content');
            elemContent.addClass('with-panel-sections');

        let elemSection1 = $('<div></div>').appendTo(elemContent)
            .addClass('panel-section')
            .addClass('filter-section-or')
            
        $('<div></div>').appendTo(elemSection1)
            .addClass('panel-section-title')       
            .html('OR Conditions');    

        $('<div></div>').appendTo(elemSection1)
            .addClass('panel-section-subtitle')
            .html('Any of the following conditions must be met');

        insertClassPropertySelector(id, elemSection1, settings.classFilters[id].fields);

        $('<div></div>').appendTo(elemSection1)
            .addClass('class-filters')  

        let elemSection2 = $('<div></div>').appendTo(elemContent)
            .addClass('panel-section')
            .addClass('filter-section-and')

        $('<div></div>').appendTo(elemSection2)
            .addClass('panel-section-title')   
            .html('AND Conditions');

        $('<div></div>').appendTo(elemSection2)
            .addClass('panel-section-subtitle')
            .html('All of the following conditions must be met');

        insertClassPropertySelector(id, elemSection2, settings.classFilters[id].fields);
        
        $('<div></div>').appendTo(elemSection2)
            .addClass('class-filters')            


        let elemSection3 = $('<div></div>').appendTo(elemContent)
            .addClass('panel-section')
            .addClass('filter-section-advanced')

        $('<div></div>').appendTo(elemSection3)
            .addClass('panel-section-title')   
            .html('Advanced');

         $('<div></div>').appendTo(elemSection3)
            .addClass('panel-section-subtitle')
            .html('Provide any filter for your custom conditions. This filter condition will be added using AND to the above conditions.');    

        $('<textarea></textarea>').appendTo(elemSection3)
            .addClass('panel-section-textarea')
            .addClass('class-filter-advanced')
            .attr('placeholder', 'Type basic text or property filter conditions. Example: P1000 AND CLASS:TITLE=Value')
            .keypress(function(e) {
                if (e.keyCode == 13) {
                    e.preventDefault();
                    applyClassFilters(id);
                }
            });         

        elemContent.show();
        $('#' + id + '-no-data').hide();
        $('#' + id + '-processing').hide();

        insertClassFiltersDataDone(id);
                
    });

}
function insertClassPropertySelector(id, elemParent, fields) {

    let elemSelect = $('<select></select>').appendTo(elemParent)
        .addClass('button')
        .addClass('class-property-selector')
        .change(function() {
            insertClassPropertyFilter(id, $(this));
            $(this).val('--');
        });

    $('<option></option>').appendTo(elemSelect)
        .attr('value', '--')
        .html('Select Property');

    for(let field of fields) {
        $('<option></option>').appendTo(elemSelect)
            .attr('value', field.name)
            .html(field.displayName);
    }

}
function insertClassPropertyFilter(id, elemSelect) {

    let value      = elemSelect.val();
    let elemParent = elemSelect.next();

    for(let field of settings.classFilters[id].fields) {
        
        if(field.name === value) {

            let elemClassFilter = $('<div></div>').appendTo(elemParent)
                .addClass('class-filter')
                .attr('data-type', field.type)
                .attr('data-name', field.name);

            $('<div></div>').appendTo(elemClassFilter)
                .addClass('class-filter-property')
                .html(field.displayName);                      

            let elemComparator = $('<select></select>').appendTo(elemClassFilter)
                .addClass('button')
                .addClass('class-filter-comparator');

            switch(field.type) {

                case 'number':

                    $('<option></option>').appendTo(elemComparator).attr('value', 'is').html('=');
                    $('<option></option>').appendTo(elemComparator).attr('value', 'in').html('≠');
                    $('<option></option>').appendTo(elemComparator).attr('value', 'gt').html('>');
                    $('<option></option>').appendTo(elemComparator).attr('value', 'al').html('≦');
                    $('<option></option>').appendTo(elemComparator).attr('value', 'lt').html('<');
                    $('<option></option>').appendTo(elemComparator).attr('value', 'am').html('≧');
                    
                    elemComparator.addClass('class-filter-symbol');

                    $('<input></input>').appendTo(elemClassFilter)
                        .addClass('class-filter-input')
                
                    break;

                case 'text':

                    $('<option></option>').appendTo(elemComparator).attr('value', 'is').html('is');
                    $('<option></option>').appendTo(elemComparator).attr('value', 'sw').html('starts with');
                    $('<option></option>').appendTo(elemComparator).attr('value', 'ew').html('ends with');
                    $('<option></option>').appendTo(elemComparator).attr('value', 'ct').html('contains');
                    
                    $('<input></input>').appendTo(elemClassFilter)
                        .addClass('class-filter-input')
                
                    break;

                case 'picklist':

                    $('<option></option>').appendTo(elemComparator).attr('value', 'is').html('is');
                    elemComparator.hide();

                    let elemValue = $('<select></select>').appendTo(elemClassFilter)
                        .addClass('button')
                        .addClass('class-filter-input')
                        .addClass('class-filter-picklist');

                    for(let value of field.picklist) {

                        $('<option></option>').appendTo(elemValue).attr('value', value.title).html(value.title);

                    }

                    break;

            }

            $('<div></div>').appendTo(elemClassFilter)
                .addClass('button')
                .addClass('icon')        
                .addClass('icon-delete')
                .click(function() {
                    $(this).closest('.class-filter').remove();
                });    

            break;

        }

    }


}
function applyClassFilters(id) {

    let query    = '(CLASS:SYSTEM_NAME=' + settings.classFilters[id].className + ')';
    let advanced = $('#' + id + '-content').find('.panel-section-textarea').first().val().trim();
    let filters  = $('#' + id + '-content').find('.class-filter');

    if(!isBlank(advanced)) { query += '+AND+' + advanced; }
    
    if(filters.length > 0) {
    
        query += '+AND+(';

        filters.each(function() {

            let elemFilter     = $(this);
            let type           = elemFilter.attr('data-type');
            let elemSection    = elemFilter.closest('.panel-section');
            let elemComparator = elemFilter.find('.class-filter-comparator');
            let elemInput      = elemFilter.find('.class-filter-input');
            let comparator     = '=';
            let condition      = (elemSection.hasClass('filter-section-or')) ? 'OR' : 'AND';

            switch(elemComparator.val()) {

                case 'is': comparator = '='; break;
                case 'gt': comparator = '>'; break;
                case 'lt': comparator = '<'; break;
                case 'am': comparator = '>='; break;
                case 'al': comparator = '<='; break;

            }

            if(elemFilter.index() > 0) query += '+' + condition + '+';

            query += 'CLASS:' + elemFilter.attr('data-name');
            query += comparator; 

            if(type === 'number') {
                query += Number(elemInput.val());
            } else {
                
                query += '"' + elemInput.val() + '"';
            }

        });

        query += ')';

    }

    let idContents = settings.classFilters[id].idContents;
    let settingsContents = settings.classContents[idContents];

    settingsContents.query = query;
    settingsContents.load();

}
function insertClassFiltersDone(id) {}
function insertClassFiltersDataDone(id) {}