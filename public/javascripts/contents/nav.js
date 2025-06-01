// Insert user's MY OUTSTANDING WORK (filter for defined workspaces if needed)
function insertMOW(params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'mow' : params.id;

    settings.mow[id] = getPanelSettings('', params, {
        headerLabel : 'My Outstanding Work',
        layout      : 'table'
    }, [
        [ 'filterByDueDate'  , false ],
        [ 'filterByWorkspace', false ],
        [ 'userId'           , ''    ]
    ]);

    settings.mow[id].load = function() { insertMOWData(id); }

    genPanelTop(id, settings.mow[id], 'mow');
    genPanelHeader(id, settings.mow[id]);
    genPanelOpenSelectedInPLMButton(id, settings.mow[id]);
    genPanelSelectionControls(id, settings.mow[id]);
    genPanelFilterToggle(id, settings.mow[id], 'filterByDueDate', 'due', 'Due Tasks');
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
            if(includePanelTableColumn(column.displayName, settings.mow[id], settings.mow[id].columns.length)) {
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
                            { key : 'workspace', value : workspace }
                        ],
                        quantity    : '',
                        classNames  : []
                    });

                }
            }

        }

        if(enableDueToggle) $('#' + id + '-filter-due').show();

        sortArray(listWorkspaces, 0);
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
    genPanelFilterSelect(id, settings.recents[id].filterByWorkspace, 'workspace', 'All Workspaces');
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
        [ 'viewSelector'        , true  ],
        [ 'startupView'         , ''    ],
        [ 'includeMOW'          , false ],
        [ 'includeBookmarks'    , false ],
        [ 'includeRecents'      , false ],
        [ 'columnLimit'         , 20 ],
        [ 'groupBy'             , '' ],
        [ 'tileImageFieldId'    , '' ],
        [ 'workspacesIn'        , [wsId] ]
    ]);

    settings.workspaceViews[id].wsId = wsId;
    settings.workspaceViews[id].load = function() { changeWorkspaceView(id); }

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

    genPanelSearchInput(id, settings.workspaceViews[id]);
    genPanelResizeButton(id, settings.workspaceViews[id]);
    genPanelReloadButton(id, settings.workspaceViews[id]);
    
    setWorkspaceViewsSelector(id);

    genPanelContents(id, settings.workspaceViews[id]).addClass(getSurfaceLevel($('#' + id)));

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

    settings.workspaceViews[id].timestamp = startPanelContentUpdate(id);
    settings.workspaceViews[id].link      = $('#' + id + '-view-selector').val();

    let requests = [
        $.get('/plm/tableau-columns', { link : settings.workspaceViews[id].link , timestamp : settings.workspaceViews[id].timestamp }),
        $.get('/plm/tableau-data'   , { link : settings.workspaceViews[id].link , timestamp : settings.workspaceViews[id].timestamp })
    ];

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings.workspaceViews[id])) return;

        let items = [];

        for(let column of responses[0].data) {
            if(!isBlank(column.displayOrder)) {
                if(includePanelTableColumn(column.field.title, settings.workspaceViews[id], settings.workspaceViews[id].columns.length)) {
                    settings.workspaceViews[id].columns.push({
                        displayName : column.field.title,
                        fieldId     : column.field.__self__.split('/').pop()    
                    });    
                }
            }
        }

        for(let row of responses[1].data.items) {

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
        changeWorkspaceViewDone(id, responses[0], responses[1].data);

    });

}
function insertWorkspaceViewsDone(id, data) {}
function changeWorkspaceViewDone(id, columns, data) {}



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

    $.get('/plm/search-descriptor', params, function(response) {

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
        [ 'tileImageFIeldId', '' ]
    ]);

    if(!settings.results[id].fields.includes('DESCRIPTOR')) {
        settings.results[id].fields.unshift('DESCRIPTOR');
    }

    if(!isBlank(settings.results[id].groupBy)) {
        if(!settings.results[id].fields.includes(settings.results[id].groupBy)) {
            settings.results[id].fields.push(settings.results[id].groupBy);
        }
    }

    if(typeof settings.results[id].tileImage == 'string') {
        settings.results[id].tileImageFieldId = settings.results[id].tileImage;
        if(!settings.results[id].fields.includes(settings.results[id].tileImage)) {
            settings.results[id].fields.push(settings.results[id].tileImage);
        }      
    }

    if(!isBlank(settings.results[id].tileTitle)) {
        if(!settings.results[id].fields.includes(settings.results[id].tileTitle)) {
            settings.results[id].fields.push(settings.results[id].tileTitle);
        }
    }

    if(!isBlank(settings.results[id].tileSubtitle)) {
        if(!settings.results[id].fields.includes(settings.results[id].tileSubtitle)) {
            settings.results[id].fields.push(settings.results[id].tileSubtitle);
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
        
        $('<div></div>').prependTo($('#' + id + '-toolbar'))
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

        for(let column of settings.results[id].fields) {
            if(includePanelTableColumn(column, settings.results[id], settings.results[id].columns.length)) {
                if(column === 'DESCRIPTOR') {
                    settings.results[id].columns.push({
                        'displayName' : 'Descriptor',
                        'fieldId'     : 'DESCRIPTOR'
                    });
                } else if(column === 'WF_CURRENT_STATE') {
                    settings.results[id].columns.push({
                        'displayName' : 'Current Status',
                        'fieldId'     : 'WF_CURRENT_STATE'
                    });
                } else {
                    for(let field of responses[1].data) {
                        let fieldId = field.__self__.split('/').pop();
                        if(column === fieldId) {
                            field.displayName = field.name;
                            field.fieldId = column;
                            settings.results[id].columns.push(field);
                        }
                    }  
                }  
            }
        }

        for(let row of responses[0].data.row) {

            let contentItem = genPanelContentItem(settings.results[id], {
                link : '/api/v3/workspaces/' + settings.results[id].wsId + '/items/' + row.dmsId
            })

            for(let field of row.fields.entry) {

                if(field.key === config.items.fieldIdNumber           ) contentItem.partNumber = field.fieldData.value;
                if(field.key === settings.results[id].tileImageFieldId) contentItem.imageId    = field.fieldData.value;
                if(field.key === settings.results[id].tileTitle       ) contentItem.title      = field.fieldData.value;
                if(field.key === settings.results[id].tileSubtitle    ) contentItem.subtitle   = field.fieldData.value;
                if(field.key === settings.results[id].groupBy         ) contentItem.group      = field.fieldData.value;
                if(field.key === 'DESCRIPTOR'                         ) contentItem.descriptor = field.fieldData.value;
                if(field.key === 'WF_CURRENT_STATE'                   ) contentItem.status     = field.fieldData.value;

                for(let tileDetail of contentItem.details) {
                    if(field.key === tileDetail.fieldId) {
                        tileDetail.value = field.fieldData.value;
                    }
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