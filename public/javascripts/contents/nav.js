// Insert user's MY OUTSTANDING WORK (filter for defined workspaces if needed)
function insertMOW(params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'mow' : params.id;

    settings[id] = getPanelSettings('', params, {
        headerLabel : 'My Outstanding Work',
        layout      : 'table'
    }, [
        [ 'filterByDueDate'  , false ],
        [ 'filterByStatus'   , false ],
        [ 'filterByWorkspace', false ],
        [ 'userId'           , ''    ],
        [ 'timeout'          , 5000  ]
    ]);

    settings[id].load = function() { insertMOWData(id); }

    genPanelTop(id, settings[id], 'mow');
    genPanelHeader(id, settings[id]);
    genPanelOpenSelectedInPLMButton(id, settings[id]);
    genPanelSelectionControls(id, settings[id]);
    genPanelFilterToggle(id, settings[id], 'filterByDueDate', 'due', 'Due Tasks');
    genPanelFilterSelect(id, settings[id], 'filterByStatus', 'status', 'All States');
    genPanelFilterSelect(id, settings[id], 'filterByWorkspace', 'workspace', 'All Workspaces');
    genPanelSearchInput(id, settings[id]);
    genPanelResizeButton(id, settings[id]);
    genPanelReloadButton(id, settings[id]);
    genPanelContents(id, settings[id]);

    insertMOWDone(id);

    settings[id].load();

}
function insertMOWData(id) {

    settings[id].timestamp = startPanelContentUpdate(id);

    $.get({
        url     : '/plm/mow',
        timeout : settings[id].timeout,
        data    : { 
            timestamp : settings[id].timestamp,
            userId    : settings[id].userId
        }
    }, function(response) {

        if(stopPanelContentUpdate(response, settings[id])) return;

        settings[id].columns = [];

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
            if(includePanelTableColumn(column.fieldId, column.displayName, settings[id], settings[id].columns.length)) {
                settings[id].columns.push(column);
            }
        }

        for(let item of response.data.outstandingWork) {

            let dateClass   = '';
            let date        = '';
            let dueFilter   = '';
            let workspace   = item.workspace.title;
            
            if((settings[id].workspacesIn.length === 0) || ( settings[id].workspacesIn.includes(workspace))) {
                if((settings[id].workspacesEx.length === 0) || (!settings[id].workspacesEx.includes(workspace))) {

                    if(!listStates.includes(item.workflowStateName)) listStates.push(item.workflowStateName);
                    if(!listWorkspaces.includes(workspace)) listWorkspaces.push(workspace);

                    if(item.hasOwnProperty('milestoneDate')) {
                            let targetDate = new Date(item.milestoneDate);
                            date = targetDate.toLocaleDateString();
                            dateClass = 'in-time';
                            if(settings[id].filters) elemDue.show();
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
        finishPanelContentUpdate(id, settings[id], items);
        insertMOWDataDone(id, response);

    }).catch(function(error) {
        showTimeoutError();
    });

}
function insertMOWDone(id) {}
function insertMOWDataDone(id, data) {}



// Insert user's RECENTLY VIEWED ITEMS (filter for defined workspaces if needed)
function insertRecentItems(params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'recents' : params.id;

    settings[id] = getPanelSettings('', params, {
        headerLabel : 'Recently Viewed Items',
        layout      : 'list',
        tileIcon    : 'icon-history',
        contentSize : 'xs'
    },[
        [ 'filterByWorkspace', false ]
    ]);

    settings[id].load = function() { insertRecentItemsData(id); }

    genPanelTop                    (id, settings[id], 'recents');
    genPanelHeader                 (id, settings[id]);
    genPanelOpenSelectedInPLMButton(id, settings[id]);
    genPanelSelectionControls      (id, settings[id]);
    genPanelFilterSelect           (id, settings[id], 'filterByWorkspace', 'workspace', 'All Workspaces');
    genPanelSearchInput            (id, settings[id]);
    genPanelResizeButton           (id, settings[id]);
    genPanelReloadButton           (id, settings[id]);
    genPanelContents               (id, settings[id]);

    insertRecentItemsDone(id);
    
    settings[id].load();

}
function insertRecentItemsData(id) {

    settings[id].timestamp = startPanelContentUpdate(id);

    $.get('/plm/recent', { timestamp : settings[id].timestamp }, function(response) {

        if(stopPanelContentUpdate(response, settings[id])) return;

        settings[id].columns = [];

        let items           = [];
        let listWorkspaces  = [];
        let columns         = [
            { displayName : 'Item'          , fieldId : 'item'      },
            { displayName : 'Workspace'     , fieldId : 'workspace' }
        ]

        for(let column of columns) {
            if(includePanelTableColumn(column.displayName, settings[id], settings[id].columns.length)) {
                settings[id].columns.push(column);
            }
        }

        for(let item of response.data.recentlyViewedItems) {

            let workspace   = item.workspace.title;
            let workspaceId = item.workspace.link.split('/')[4];

            if(includePanelWorkspace(settings[id], workspace, workspaceId)) {

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
        finishPanelContentUpdate(id, settings[id], items);
        insertRecentItemsDataDone(id, response);

    });

}
function insertRecentItemsDone(id) {}
function insertRecentItemsDataDone(id, data) {}



// Insert user's BOOKMARKED ITEMS (filter for defined workspaces if needed)
function insertBookmarks(params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'bookmarks' : params.id;

    settings[id] = getPanelSettings('', params, {
        headerLabel : 'Bookmarks',
        layout      : 'list',
        tileImage   : true,
        contentSize : 'xs'
    }, [
        [ 'filterByWorkspace', false ]
    ]);

    settings[id].load = function() { insertBookmarksData(id); }

    genPanelTop(id, settings[id], 'bookmarks');
    genPanelHeader(id, settings[id]);
    genPanelOpenSelectedInPLMButton(id, settings[id]);
    genPanelSelectionControls(id, settings[id]);
    genPanelFilterSelect(id, settings[id], 'filterByWorkspace', 'workspace', 'All Workspaces');
    genPanelSearchInput(id, settings[id]);
    genPanelResizeButton(id, settings[id]);
    genPanelReloadButton(id, settings[id]);
    
    genPanelContents(id, settings[id]);

    insertBookmarksDone(id);

    settings[id].load();

}
function insertBookmarksData(id) {

    settings[id].timestamp = startPanelContentUpdate(id);

    $.get('/plm/bookmarks', { timestamp : settings[id].timestamp, useCache : settings[id].useCache }, function(response) {

        if(stopPanelContentUpdate(response, settings[id])) return;

        settings[id].columns = [];

        let items           = [];
        let listWorkspaces  = [];
        let columns         = [
            { displayName : 'Item'          , fieldId : 'item'      },
            { displayName : 'Workspace'     , fieldId : 'workspace' },
            { displayName : 'Comment'       , fieldId : 'comment'   }
        ]

        for(let column of columns) {
            if(includePanelTableColumn(column.displayName, settings[id], settings[id].columns.length)) {
                settings[id].columns.push(column);
            }
        }

        for(let item of response.data.bookmarks) {

            let workspace = item.workspace.title;
            let workspaceId = item.workspace.link.split('/')[4];

            if(includePanelWorkspace(settings[id], workspace, workspaceId)) {

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
        finishPanelContentUpdate(id, settings[id], items);
        insertBookmarksDataDone(id, response);

    });

}
function insertBookmarksDone(id) {}
function insertBookmarksDataDone(id, data) {}



// Insert user's WORKSPACE VIEWS for given workspace (optionally add BOOKMARKS & RECENTS in same control)
function insertWorkspaceViews(wsId, params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'workspace-views' : params.id;

    settings[id] = getPanelSettings('', params, {
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
        [ 'limit'               ,     25 ],
        [ 'groupBy'             ,     '' ],
        [ 'tileImageFieldId'    ,     '' ],
        [ 'workspacesIn'        , [wsId] ]
    ]);

    settings[id].wsId = wsId;
    settings[id].load = function() { changeWorkspaceView(id);     }
    settings[id].next = function() { insertWorkspaceViewData(id); }

    genPanelTop(id, settings[id], 'workspace-views');
    genPanelHeader(id, settings[id]);
    genPanelOpenSelectedInPLMButton(id, settings[id]);
    genPanelSelectionControls(id, settings[id]);

    let elemToolbar = genPanelToolbar(id, settings[id], 'controls');

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

    genPanelSearchInput( id, settings[id]);
    genPanelResizeButton(id, settings[id]);
    genPanelReloadButton(id, settings[id]);
    
    setWorkspaceViewsSelector(id);
    
    genPanelContents(id, settings[id]).addClass(getSurfaceLevel($('#' + id)));
    genPanelPaginationControls(id, settings[id]);

}
function setWorkspaceViewsSelector(id) {

    let elemSelect = $('#' + id + '-view-selector');

    let requests = [
        $.get('/plm/tableaus'  , { 'wsId' : settings[id].wsId }),
        $.get('/plm/workspaces', { } )
    ]

    Promise.all(requests).then(function(responses) {

        if(settings[id].viewSelector) elemSelect.show();

        if(responses[0].error) {

            showErrorMessage('Error when accessing workspace with id ' + settings[id].wsId, responses[0].data.message);

        } else {

            let elemTitle                           = $('#' + id + '-title');
            let selectDefault                       = true;
            settings[id].workspace   = getWorkspaceName(settings[id].wsId, responses[1]);

            if(isBlank(settings[id].headerLabel)) {
                elemTitle.html('');
                $('<div></div>').appendTo(elemTitle)
                    .attr('id',  id + '-title-main')
                    .addClass('panel-title-main')
                    .html(settings[id].workspace);
            }

                 if(settings[id].includeMOW       && (settings[id].startupView.toLowerCase() === 'mow')      ) { selectDefault = false; elemSelect.val('mow'); }
            else if(settings[id].includeBookmarks && (settings[id].startupView.toLowerCase() === 'bookmarks')) { selectDefault = false; elemSelect.val('bookmarks'); }
            else if(settings[id].includeRecents   && (settings[id].startupView.toLowerCase() === 'recents')  ) { selectDefault = false; elemSelect.val('recents'); }

            for(let tableau of responses[0].data) {

                let  = $('<option></option>').appendTo(elemSelect)
                    .html(tableau.title)
                    .attr('value', tableau.link);

                if(selectDefault) {
                    if(settings[id].startupView.toLowerCase() === tableau.title.toLowerCase()) {
                        elemSelect.val(tableau.link);
                    } else if(settings[id].startupView.toLowerCase() === '') {
                        if(!isBlank(tableau.type)) {
                            if(tableau.type.toLowerCase() === 'default') {
                                elemSelect.val(tableau.link);
                            }
                        }
                    }
                }

            }

            if(settings[id].includeMOW)       $('<option></option>').appendTo(elemSelect).html('My Outstanding Work').attr('value', 'mow');       
            if(settings[id].includeBookmarks) $('<option></option>').appendTo(elemSelect).html('My Bookmarks').attr('value', 'bookmarks');
            if(settings[id].includeRecents)   $('<option></option>').appendTo(elemSelect).html('Recently Viewed').attr('value', 'recents');
    
            insertWorkspaceViewsDone(id, responses[0]);
            settings[id].load();

        }

    });

}
function changeWorkspaceView(id) {

    let elemSelect  = $('#' + id + '-view-selector');
    let linkView    = elemSelect.val();
    let params      = { 
        id              : id + '-content', 
        hideHeader      : true, 
        openInPLM       : settings[id].openInPLM,
        onItemClick     : settings[id].onItemClick,
        onItemDblClick  : settings[id].onItemDblClick,
        workspacesIn    : [settings[id].wsId]
     }

           if(linkView === 'mow'      ) {         insertMOW(params);      
    } else if(linkView === 'bookmarks') {   insertBookmarks(params);  
    } else if(linkView === 'recents'  ) { insertRecentItems(params);  
    } else { 
        insertWorkspaceViewData(id); 
    }

}
function insertWorkspaceViewData(id) {

    settings[id].timestamp = startPanelContentUpdate(id, settings[id].mode);
    settings[id].link      = $('#' + id + '-view-selector').val();

    let params = { 
        link      : settings[id].link, 
        page      : settings[id].page,
        size      : settings[id].limit,
        timestamp : settings[id].timestamp
    };

    let requests = [ $.get('/plm/tableau-data', params )];

    if(settings[id].mode === 'initial') {
        requests.push($.get('/plm/tableau-columns', { link : settings[id].link} ));
    }

    Promise.all(requests).then(function(responses) {

        if(settings[id].mode === 'initial') {

            if(stopPanelContentUpdate(responses[0], settings[id])) return;

            for(let column of responses[1].data) {
                if(!isBlank(column.displayOrder)) {
                    if(!isBlank(column.field.urn)) {
                        let fieldId = column.field.urn.split('.').pop();
                        if(includePanelTableColumn(fieldId, column.field.title, settings[id], settings[id].columns.length)) {
                            settings[id].columns.push({
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

            let item = genPanelContentItem(settings[id], { link : row.item.link} );

            for(let column of  settings[id].columns) {
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

                if(field.id === settings[id].tileTitle   ) item.title    = field.value;
                if(field.id === settings[id].tileSubtitle) item.subtitle = field.value;
                if(field.id === settings[id].tileImage   ) item.image    = field.value;
                if(field.id === settings[id].groupBy     ) item.group    = field.value;
                if(field.id === common.workspaces.items.fieldIdNumber) item.partNumber = field.value;

                if(settings[id].additionalData.includes(field.id)) {
                    item.attributes.push({
                        key : field.id.toLowerCase(),
                        value : field.value
                    });
                }

                for(let detail of item.details) if(detail.id === field.id) detail.value = field.value;

            }

            items.push(item);
    
        }

        finishPanelContentUpdate(id, settings[id], items);
        setPanelPaginationControls(id, settings[id], responses[0].data.total);
        changeWorkspaceViewDone(id, responses[0]);

    });

}
function insertWorkspaceViewsDone(id, data) {}
function changeWorkspaceViewDone(id, data) {}



// Display ALL RECORDS of defined workspace
function insertWorkspaceItems(wsId, params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'workspace-items' : params.id;

    settings[id] = getPanelSettings('', params, {
        headerLabel : 'Workspace Items',
        layout      : 'grid',
        contentSize : 's'
    }, [
        [ 'filter'  , '' ],
        [ 'sortBy'  , 'DESCRIPTOR' ],
        [ 'groupBy' , '' ]
    ]);

    settings[id].wsId   = wsId;
    settings[id].load = function() { insertWorkspaceItemsData(id); }

    genPanelTop(id, settings[id], 'bookmarks');
    genPanelHeader(id, settings[id]);
    genPanelOpenSelectedInPLMButton(id, settings[id]);
    genPanelSelectionControls(id, settings[id]);

    genPanelSearchInput(id, settings[id]);
    genPanelResizeButton(id, settings[id]);
    genPanelReloadButton(id, settings[id]);
    
    genPanelContents(id, settings[id]);

    settings[id].load();
    
}
function insertWorkspaceItemsData(id) {

    settings[id].timestamp = startPanelContentUpdate(id);

    let url = (isBlank(settings[id].filter)) ? '/plm/items' : '/plm/search-bulk';

    switch(typeof settings[id].tileImage) {
        case 'boolean': if(settings[id].tileImage) url = '/plm/search-bulk'; break;
        case 'string' : url = '/plm/search-bulk'; break;
    }

    $.get(url, { 
        timestamp : settings[id].timestamp, 
        wsId      : settings[id].wsId,
        query     : (isBlank(settings[id].filter)) ? '*' : settings[id].filter,
        useCache  : settings[id].useCache,
        bulk      : false,
        useCace   : true,
        limit     : 250
    }, function(response) {
        
        if(stopPanelContentUpdate(response, settings[id])) return;

        let items                           = [];
        let columns                         = []
        settings[id].columns = [];

        if(!isBlank(settings[id].tileTitle)) {
            columns.push({
                displayName : 'Item',
                fieldId     : settings[id].tileTitle 
            }); 
        };

        if(!isBlank(settings[id].tileSubtitle)) {
            columns.push({
                displayName : '',
                fieldId     : settings[id].tileSubtitle 
            }); 
        };

        for(let detail of settings[id].tileDetails) {
            columns.push({
                displayName : detail[1],
                fieldId     : detail[2] 
            });         
        }

        for(let column of columns) {
            if(includePanelTableColumn(column.displayName, settings[id], settings[id].columns.length)) {
                settings[id].columns.push(column);    
            }
        }

        if(!isBlank(settings[id].sortBy)) {
            for(let item of response.data.items) {
                item.sortKey = getSectionFieldValue(item.sections, settings[id].sortBy, '', 'title');
            }
            sortArray(response.data.items, 'sortKey', 'string', 'ascending');
        }

        for(let item of response.data.items) {

            let contentItem = genPanelContentItem(settings[id], {
                link  : item.__self__, 
                title : item.title
            });

            for(let column of  settings[id].columns) {

                if(column.fieldId === 'DESCRIPTOR') {
                    if(settings[id].tileTitle    === column.fieldId) contentItem.title    = item.title;
                    if(settings[id].tileSubtitle === column.fieldId) contentItem.subtitle = item.title;
                    if(settings[id].groupBy        === column.fieldId) contentItem.group    = item.title;
                    contentItem.data.push({
                        fieldId : column.fieldId,
                        value   : item.title
                    });
                } else if(column.fieldId === 'WF_CURRENT_STATE') {
                    if(settings[id].tileTitle    === column.fieldId) contentItem.title    = item.currentState.title;
                    if(settings[id].tileSubtitle === column.fieldId) contentItem.subtitle = item.currentState.title;
                    if(settings[id].groupBy        === column.fieldId) contentItem.group    = item.currentState.title;
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

                    if(fieldId === settings[id].tileTitle   ) contentItem.title      = value;
                    if(fieldId === settings[id].tileSubtitle) contentItem.subtitle   = value
                    if(fieldId === settings[id].tileImage   ) contentItem.imageLink  = (isBlank(field.value)) ? '' : field.value.link;
                    if(fieldId === settings[id].groupBy     ) contentItem.group      = value;
                    if(fieldId === common.workspaces.items.fieldIdNumber              ) contentItem.partNumber = value;

                    if(settings[id].additionalData.includes(fieldId)) {

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

        finishPanelContentUpdate(id, settings[id], items);
        insertWorkspaceItemsDataDone(id, response);

    });

}
function insertWorkspaceItemsDataDone(id, response) {}



// Insert basic SEARCH capability
function insertSearch(params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'search' : params.id;

    settings[id] = getPanelSettings('', params, {
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

    settings[id].load = function() { resetSearch(id, true); }
    settings[id].next = function() { insertSearchData(id); }

    genPanelTop                    (id, settings[id], 'search');
    genPanelHeader                 (id, settings[id]);
    genPanelOpenSelectedInPLMButton(id, settings[id]);
    genPanelSelectionControls      (id, settings[id]);
    genPanelFilterSelect           (id, settings[id].filterByOwner, 'owner', 'All Owners');
    genPanelFilterSelect           (id, settings[id].filterByWorkspace, 'workspace', 'All Workspaces');
    genPanelSearchInput            (id, settings[id]).hide();
    genPanelResizeButton           (id, settings[id]);
    genPanelReloadButton           (id, settings[id]);
    genPanelContents               (id, settings[id]);
    genPanelPaginationControls     (id, settings[id]);

    genPanelToolbar(id, settings[id], 'actions');

    $('<input></input>').appendTo($('#' + id + '-actions'))
        .attr('placeholder', settings[id].inputLabel)
        .attr('id', id + '-search-content-input')
        .addClass('search-content-input')
        .click(function(e){
            e.preventDefault();
            e.stopPropagation();
        })
        .keypress(function(e) {
            if(e.which == 13) {
                settings[id].mode = 'initial';
                insertSearchData(id);
            }
        });

    let elemButton = $('<div></div>').appendTo($('#' + id + '-actions'))
        .attr('id', id + '-search-content-button')
        .addClass('search-content-button')
        .addClass('button')
        .addClass('default')
        .addClass('disabled')
        .html(settings[id].buttonLabel)
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            resetSearch(id, false);
            settings[id].mode = 'initial';
            insertSearchData(id);
        });

    if(!isBlank(settings[id].buttonIcon)) elemButton.addClass('with-icon').addClass(settings[id].buttonIcon);

     getWorkspaceIdsFromNames(settings[id], function(workspaceIds) {
        settings[id].workspaceIds = workspaceIds;
        settings[id].load();
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

    settings[id].timestamp = startPanelContentUpdate(id, settings[id].mode);

    let params = {
        query     : $('#' + id + '-search-content-input').val(),
        limit     : settings[id].limit,
        page      : settings[id].page,
        offset    : settings[id].offset,
        timestamp : settings[id].timestamp
    }

    if(!isBlank(settings[id].baseQuery)   ) params.query     += '+AND+' + settings[id].baseQuery;
    if(!isBlank(settings[id].workspaceIds)) params.workspaces = settings[id].workspaceIds;
    if(settings[id].exactMatch            ) params.wildcard   = false;

    $.post('/plm/search-descriptor', params, function(response) {

        if(stopPanelContentUpdate(response, settings[id])) return;
            
        let items           = [];
        let listWorkspaces  = [];
        let listOwners      = [];

        let columns = [
            { displayName : 'Descriptor', fieldId : 'descriptor' },
            { displayName : 'Category'  , fieldId : 'category'   },
            { displayName : 'Creator'   , fieldId : 'creator'    },
            { displayName : 'Owner'     , fieldId : 'owner'      },
            { displayName : 'Workspace' , fieldId : 'workspaceLongName'  }
        ]; 

        for(let column of columns) {
            if(includePanelTableColumn(column.displayName, settings[id], settings[id].columns.length)) {
                settings[id].columns.push(column);    
            }
        }

        for(let record of response.data.items) {

            if(!listOwners.includes(record.owner)) listOwners.push(record.owner);
            if(!listWorkspaces.includes(record.workspaceLongName)) listWorkspaces.push(record.workspaceLongName);

            record.tileTitle    = '';
            record.tileSubitle  = '';
            record.group        = (settings[id].groupBy === '') ? '' : record[settings[id].groupBy];

            for(let column of columns) {

                if(settings[id].tileTitle === column.displayName) record.tileTitle = record[column.fieldId];
                if(settings[id].tileSubtitle === column.displayName) record.tileSubitle = record[column.fieldId];

            }

            let contentItem = genPanelContentItem(settings[id], {
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

        sortArray(listOwners, 0);
        sortArray(listWorkspaces, 0);  
        setPanelFilterOptions(id, 'owner', listOwners);
        setPanelFilterOptions(id, 'workspace', listWorkspaces);
        finishPanelContentUpdate(id, settings[id], items);
        setPanelPaginationControls(id, settings[id], response.data.totalCount);

        if(settings[id].autoClick) {
            if($('#' + id + '-content').find('.content-item').length > 0) {
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

    settings[id] = getPanelSettings('', params, {
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

    if(!settings[id].fields.includes('DESCRIPTOR')) {
        settings[id].fields.unshift('DESCRIPTOR');
    }

    if(!isBlank(settings[id].groupBy)) {
        if(!settings[id].fields.includes(settings[id].groupBy)) {
            settings[id].fields.push(settings[id].groupBy);
        }
    }

    if(!isBlank(settings[id].additionalData)) {
        for(let additionalData of settings[id].additionalData) {
            if(!settings[id].fields.includes(additionalData)) {
                settings[id].fields.push(additionalData);
            }
        }
    }

    if(typeof settings[id].tileImage == 'string') {
        settings[id].tileImageFieldId = settings[id].tileImage;
        if(!settings[id].fields.includes(settings[id].tileImage)) {
            settings[id].fields.push(settings[id].tileImage);
        }      
    }

    if(typeof settings[id].tileTitle == 'string') {
        if(!isBlank(settings[id].tileTitle)) {
            if(!settings[id].fields.includes(settings[id].tileTitle)) {
                settings[id].fields.push(settings[id].tileTitle);
            }
        }
    } else if(typeof settings[id].tileTitle == 'object') {
        for(let tileTitle of settings[id].tileTitle) {
            if(!settings[id].fields.includes(tileTitle)) {
                settings[id].fields.push(tileTitle);
            }
        }
    }

    if(typeof settings[id].tileSubtitle == 'string') {
        if(!isBlank(settings[id].tileSubtitle)) {
            if(!settings[id].fields.includes(settings[id].tileSubtitle)) {
                settings[id].fields.push(settings[id].tileSubtitle);
            }
        }
    } else if(typeof settings[id].tileSubtitle == 'object') {
        for(let tileSubtitle of settings[id].tileSubtitle) {
            if(!settings[id].fields.includes(tileSubtitle)) {
                settings[id].fields.push(tileSubtitle);
            }
        }
    }

    if(!isBlank(settings[id].tileDetails)) {
        for(let tileDetail of settings[id].tileDetails) {
            if(!isBlank(tileDetail.fieldId)) {
                if(!settings[id].fields.includes(tileDetail.fieldId)) {
                    settings[id].fields.push(tileDetail.fieldId);
                }
            }
        }
    }

    if(!isBlank(settings[id].fieldsIn)) {
        for(let fieldId of settings[id].fieldsIn) {
            if(!settings[id].fields.includes(fieldId)) {
                settings[id].fields.push(fieldId);
            }
        }
    }

    if(settings[id].stateColors.length > 0) {
        if(!settings[id].fields.includes('WF_CURRENT_STATE')) {
            settings[id].fields.push('WF_CURRENT_STATE');
        }
    }

    settings[id].load = function() { insertResultsData(id, true); }

    genPanelTop(id, settings[id], 'results');
    genPanelHeader(id, settings[id]);
    genPanelOpenSelectedInPLMButton(id, settings[id]);
    genPanelSelectionControls(id, settings[id]);
    genPanelFilterToggleEmpty(id, settings[id]);
    genPanelSearchInput(id, settings[id]);
    genPanelResizeButton(id, settings[id]);
    genPanelReloadButton(id, settings[id]);

    genPanelContents(id, settings[id]);

    if(settings[id].editable) {

        let elemToolbar = genPanelToolbar(id, settings[id], 'controls');

        $('<div></div>').prependTo(elemToolbar)
            .addClass('button')
            .addClass('default')
            .addClass('panel-action')
            .attr('id', id + '-action-save')
            .attr('title', 'Save changes')
            .html('Save')
            .hide()
            .click(function() {
                savePanelTableChanges(id, settings[id]);
            });
        
    }
    
    insertResultsDone(id);
    settings[id].load();

}
function insertResultsData(id) {

    settings[id].timestamp = startPanelContentUpdate(id);

    let elemCounters =  $('#' + id + '-content-counters');
    
    if(elemCounters.length > 0) elemCounters.children().each(function() { $(this).html('').removeClass('not-empty'); })

    let params = {
        wsId        : settings[id].wsId,
        filter      : settings[id].filters,
        fields      : settings[id].fields,
        sort        : settings[id].sortBy,
        timestamp   : settings[id].timestamp,
        useCache    : settings[id].useCache
    }

    let requests = [
        $.post( '/plm/search', params),
        $.get( '/plm/fields',  { wsId : settings[id].wsId} ),
    ];

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings[id])) return;

        let items = [];

        settings[id].columns = [];

        for(let fieldId of settings[id].fields) {
            if(includePanelTableColumn(fieldId, '', settings[id], settings[id].columns.length)) {
                if(fieldId === 'DESCRIPTOR') {
                    settings[id].columns.push({
                        'displayName' : 'Descriptor',
                        'fieldId'     : 'DESCRIPTOR'
                    });
                } else if(fieldId === 'WF_CURRENT_STATE') {
                    settings[id].columns.push({
                        'displayName' : 'Current Status',
                        'fieldId'     : 'WF_CURRENT_STATE'
                    });
                } else {
                    for(let workspaceField of responses[1].data) {
                        let workspaceFieldId = workspaceField.__self__.split('/').pop();
                        if(fieldId === workspaceFieldId) {
                            // field.displayName = field.name;
                            // field.fieldId = column;
                            settings[id].columns.push({
                                displayName : workspaceField.name,
                                fieldId : workspaceFieldId,
                            });
                        }
                    }  
                }  
            }
        }

        for(let row of responses[0].data.row) {

            let contentItem = genPanelContentItem(settings[id], {
                link : '/api/v3/workspaces/' + settings[id].wsId + '/items/' + row.dmsId
            })

            if(typeof settings[id].tileTitle == 'object') {
                contentItem.tileTitles = [];
                for(let tileTitle of settings[id].tileTitle) {
                    contentItem.tileTitles[tileTitle] = '';
                }
            }
            if(typeof settings[id].tileSubtitle == 'object') {
                contentItem.tileSubtitles = [];
                for(let tileSubtitle of settings[id].tileSubtitle) {
                    contentItem.tileSubtitles[tileSubtitle] = '';
                }
            }

            for(let field of row.fields.entry) {

                if(field.key === common.workspaces.items.fieldIdNumber) contentItem.partNumber = field.fieldData.value;
                if(field.key === settings[id].tileImageFieldId) contentItem.imageId    = field.fieldData.value;
                if(field.key === settings[id].groupBy         ) contentItem.group      = field.fieldData.value;
                if(field.key === 'DESCRIPTOR'                         ) contentItem.descriptor = field.fieldData.value;
                if(field.key === 'WF_CURRENT_STATE'                   ) contentItem.status     = field.fieldData.value;

                if(typeof settings[id].tileTitle == 'string') {
                    if(field.key === settings[id].tileTitle) contentItem.title = field.fieldData.value;
                } else if(typeof settings[id].tileTitle == 'object') {
                    for(let tileTitle of settings[id].tileTitle) {
                        if(field.key === tileTitle) contentItem.tileTitles[tileTitle] = field.fieldData.value;
                    }
                }

                if(typeof settings[id].tileSubtitle == 'string') {
                    if(field.key === settings[id].tileSubtitle) contentItem.subtitle = field.fieldData.value;
                } else if(typeof settings[id].tileSubtitle == 'object') {
                    for(let tileSubtitle of settings[id].tileSubtitle) {
                        if(field.key === tileSubtitle) contentItem.tileSubtitles[tileSubtitle] = field.fieldData.value;
                    }
                } 

                for(let tileDetail of contentItem.details) {
                    if(field.key === tileDetail.fieldId) {
                        if(field.fieldData.dataType == 'Date') {
                            tileDetail.value = convertDateToLocaleDate(field.fieldData.value);
                        } else tileDetail.value = field.fieldData.value;
                    }
                }

                if(settings[id].additionalData.includes(field.key)) {
                    contentItem.attributes.push({
                        key   : field.key.toLowerCase(),
                        value : field.fieldData.value
                    });
                }

                for(let column of settings[id].columns) {

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

            if(typeof settings[id].tileTitle == 'object') {
                for(let tileTitle of settings[id].tileTitle) {
                    if(contentItem.tileTitles[tileTitle] !== '') {
                        contentItem.title = contentItem.tileTitles[tileTitle];
                        break;
                    }
                }
            }
            if(typeof settings[id].tileSubtitle == 'object') {
                for(let tileSubtitle of settings[id].tileSubtitle) {
                    if(contentItem.tileSubtitles[tileSubtitle] !== '') {
                        contentItem.subtitle = contentItem.tileSubtitles[tileSubtitle];
                        break;
                    }
                }
            }

            items.push(contentItem);

        }

        finishPanelContentUpdate(id, settings[id], items);

        if(settings[id].autoClick) {
            if($('#' + id + '-content').find('.content-item').length > 0) {
                $('#' + id + '-content').find('.content-item').first().click();
            }
        }

        insertResultsDataDone(id, responses);

    });

}
function insertResultsDone(id) {}
function insertResultsDataDone(id, data) {}