// Insert user's MY OUTSTANDING WORK (filter for defined workspaces if needed)
function insertMOW(params) {

    const id = getPanelSettings('insertMOW', params);

    genPanelElements(id);
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
            { displayName : 'Due Date'      , fieldId : 'due'       },
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
        finishPanelContentUpdate(id, items);
        insertMOWDataDone(id, response);

    }).catch(function(error) {
        showTimeoutError();
    });

}
function insertMOWDone(id) {}
function insertMOWDataDone(id, data) {}



// Insert user's RECENTLY VIEWED ITEMS (filter for defined workspaces if needed)
function insertRecentItems(params) {

    const id = getPanelSettings('insertRecentItems', params);

    genPanelElements(id);
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
            if(includePanelTableColumn(column.fieldId, column.displayName, settings[id], settings[id].columns.length)) {
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
        finishPanelContentUpdate(id, items);
        insertRecentItemsDataDone(id, response);

    });

}
function insertRecentItemsDone(id) {}
function insertRecentItemsDataDone(id, data) {}



// Insert user's BOOKMARKED ITEMS (filter for defined workspaces if needed)
function insertBookmarks(params) {

    const id = getPanelSettings('insertBookmarks', params);

    genPanelElements(id);
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
            if(includePanelTableColumn(column.fieldId, column.displayName, settings[id], settings[id].columns.length)) {
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
        finishPanelContentUpdate(id, items);
        insertBookmarksDataDone(id, response);

    });

}
function insertBookmarksDone(id) {}
function insertBookmarksDataDone(id, data) {}



// Insert user's WORKSPACE VIEWS for given workspace (optionally add BOOKMARKS & RECENTS in same control)
function insertWorkspaceViews(wsId, params) {

    const id = getPanelSettings('insertWorkspaceViews', params);

    genPanelElements(id);

    console.log(settings[id]);

    settings[id].wsId = wsId;
    settings[id].load = function() { changeWorkspaceView(id);     }
    settings[id].next = function() { insertWorkspaceViewData(id); }

    let elemToolbar = genPanelToolbar(id, 'controls');

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

    setWorkspaceViewsSelector(id);
    
    $('#' + id + '-panel-content').addClass(getSurfaceLevel($('#' + id)));

    insertWorkspaceViewsDone(id);

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
                        key   : field.id.toLowerCase(),
                        value : field.value
                    });
                }

                for(let detail of item.details) if(detail.id === field.id) detail.value = field.value;

            }

            items.push(item);
    
        }

        finishPanelContentUpdate(id, items);
        setPanelPaginationControls(id, responses[0].data.total);
        changeWorkspaceViewDone(id, responses[0]);

    });

}
function insertWorkspaceViewsDone(id, data) {}
function changeWorkspaceViewDone(id, data) {}



// Insert SEARCH panel scoped to a single workspace.
function insertWorkspaceSearch(wsId, params) {

    const id = getPanelSettings('insertWorkspaceSearch', params, { wsId : wsId } );

    genPanelElements(id);

    settings[id].load = function() { resetSearch(id, true); }
    settings[id].next = function() { insertWorkspaceSearchData(id, true); }    

    if(!settings[id].searchReturnFields.includes('DESCRIPTOR')) {
        settings[id].searchReturnFields.unshift('DESCRIPTOR');
    }

    if(!isBlank(settings[id].groupBy)) {
        if(!settings[id].searchReturnFields.includes(settings[id].groupBy)) {
            settings[id].searchReturnFields.push(settings[id].groupBy);
        }
    }

    if(typeof settings[id].tileImage == 'string') {
        settings[id].tileImageFieldId = settings[id].tileImage;
        if(!settings[id].searchReturnFields.includes(settings[id].tileImage)) {
            settings[id].searchReturnFields.push(settings[id].tileImage);
        }
    } else if(settings[id].tileImage === true) {
        if(!isBlank(settings[id].tileImageFieldId)) {
            if(!settings[id].searchReturnFields.includes(settings[id].tileImageFieldId)) {
                settings[id].searchReturnFields.push(settings[id].tileImageFieldId);
            }
        }
    }

    if(typeof settings[id].tileTitle == 'string') {
        if(!isBlank(settings[id].tileTitle)) {
            if(!settings[id].searchReturnFields.includes(settings[id].tileTitle)) {
                settings[id].searchReturnFields.push(settings[id].tileTitle);
            }
        }
    } else if(typeof settings[id].tileTitle == 'object') {
        for(let tileTitle of settings[id].tileTitle) {
            if(!settings[id].searchReturnFields.includes(tileTitle)) {
                settings[id].searchReturnFields.push(tileTitle);
            }
        }
    }

    if(typeof settings[id].tileSubtitle == 'string') {
        if(!isBlank(settings[id].tileSubtitle)) {
            if(!settings[id].searchReturnFields.includes(settings[id].tileSubtitle)) {
                settings[id].searchReturnFields.push(settings[id].tileSubtitle);
            }
        }
    } else if(typeof settings[id].tileSubtitle == 'object') {
        for(let tileSubtitle of settings[id].tileSubtitle) {
            if(!settings[id].searchReturnFields.includes(tileSubtitle)) {
                settings[id].searchReturnFields.push(tileSubtitle);
            }
        }
    }

    if(!isBlank(settings[id].tileDetails)) {
        for(let tileDetail of settings[id].tileDetails) {
            if(!isBlank(tileDetail.fieldId)) {
                if(!settings[id].searchReturnFields.includes(tileDetail.fieldId)) {
                    settings[id].searchReturnFields.push(tileDetail.fieldId);
                }
            }
        }
    }

    if(!isBlank(settings[id].fieldsIn)) {
        for(let fieldId of settings[id].fieldsIn) {
            if(!settings[id].searchReturnFields.includes(fieldId)) {
                settings[id].searchReturnFields.push(fieldId);
            }
        }
    }

    if(settings[id].filterByStatus) {
        if(!settings[id].searchReturnFields.includes('WF_CURRENT_STATE')) {
            settings[id].searchReturnFields.push('WF_CURRENT_STATE');
        }
    }

    if(settings[id].stateColors.length > 0) {
        if(!settings[id].searchReturnFields.includes('WF_CURRENT_STATE')) {
            settings[id].searchReturnFields.push('WF_CURRENT_STATE');
        }
    }

    genPanelToolbar(id, 'actions');

    $('<input></input>').appendTo($('#' + id + '-actions'))
        .attr('placeholder', settings[id].searchInputLabel)
        .attr('id', id + '-search-content-input')
        .addClass('search-content-input')
        .click(function(e){
            e.preventDefault();
            e.stopPropagation();
        })
        .keypress(function(e) {
            if(e.which == 13) {
                settings[id].page   = 1;
                settings[id].offset = 0;
                settings[id].mode   = 'initial';
                insertWorkspaceSearchData(id, false);
            }
        });

    let elemButton = $('<div></div>').appendTo($('#' + id + '-actions'))
        .attr('id', id + '-search-content-button')
        .addClass('search-content-button')
        .addClass('button')
        .addClass('default')
        .addClass('disabled')
        .html(settings[id].searchButtonLabel)
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            settings[id].page   = 1;
            settings[id].offset = 0;
            settings[id].mode   = 'initial';
            insertWorkspaceSearchData(id, false);
        });

    if(!isBlank(settings[id].searchButtonIcon)) elemButton.addClass('with-icon').addClass(settings[id].searchButtonIcon);

    insertWorkspaceSearchDone(id);

    settings[id].load();

}
function insertWorkspaceSearchDone(id) {}
function getWorkspaceSearchFieldType(fieldId) {
    switch(fieldId) {
        case 'DESCRIPTOR'      : return '15';
        case 'WF_CURRENT_STATE': return '1';
        default                : return '0';
    }
}
function insertWorkspaceSearchData(id, isNext) {

    settings[id].timestamp = startPanelContentUpdate(id, settings[id].mode);

    let query  = $('#' + id + '-search-content-input').val();
    let filter = [];

    for(let fieldId of settings[id].searchInFields) {
        filter.push({
            field      : fieldId,
            type       : getWorkspaceSearchFieldType(fieldId),
            comparator : settings[id].searchForExactMatch ? '=' : 'contains',
            value      : query
        });
    }

    for(let baseFilter of settings[id].searchBaseFilters) filter.push(baseFilter);

    let logicClause = settings[id].searchLogicClause;
    if(isBlank(settings[id].searchLogicClause)) {
        settings[id].searchLogicClause = (settings[id].searchFields.length > 1 && settings[id].searchBaseFilters.length === 0) ? 'OR' : 'AND';
    }

    let params = {
        wsId               : settings[id].wsId,
        filter             : filter,
        fields             : settings[id].searchReturnFields,
        sort               : (typeof settings[id].sortBy === 'string') ? [settings[id].sortBy] : settings[id].sortBy,
        pageNo             : settings[id].page,
        pageSize           : settings[id].limit,
        searchLogicClause  : settings[id].searchLogicClause,
        searchLatestOnly   : settings[id].searchLatestOnly,
        searchReleasedOnly : settings[id].searchReleasedOnly,
        searchWorkingOnly  : settings[id].searchWorkingOnly,
        hideWorking        : settings[id].hideWorking,
        timestamp          : settings[id].timestamp,
        useCache           : settings[id].useCache,
        tileImage          : settings[id].tileImage,
        tileImageFieldId   : settings[id].tileImageFieldId
    }

    let requests = [
        $.post('/plm/search', params),
        $.get( '/plm/fields',  { wsId : settings[id].wsId, useCache : settings[id].useCache } ),
    ];

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings[id])) return;

        let items      = [];
        let listStates = [];

        settings[id].columns = [];

        for(let fieldId of settings[id].searchReturnFields) {
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

            let stateName = '';

            let contentItem = genPanelContentItem(settings[id], {
                link : '/api/v3/workspaces/' + settings[id].wsId + '/items/' + row.dmsId
            })

            contentItem.filters = [];

            if(settings[id].filterByStatus) {
                stateName = row.data.WF_CURRENT_STATE.displayValue;
                if(!listStates.includes(stateName)) listStates.push(stateName);
                contentItem.filters.push({
                    key : 'status', value : stateName
                })

            }

            if(settings[id].tileImage === true) contentItem.imageFile = row.imageFile

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
                if(field.key === 'DESCRIPTOR'                 ) contentItem.descriptor = field.fieldData.value;
                if(field.key === 'WF_CURRENT_STATE'           ) contentItem.status     = field.fieldData.value;

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

        sortArray(listStates, 0);
        setPanelFilterOptions(id, 'status', listStates);
        finishPanelContentUpdate(id, items);
        $('#' + id + '-search-content-input').focus();

        // The v1 /plm/search response carries no total count, so derive the
        // pagination state from the page fill: a full page implies there may be more.
        let pageRows = responses[0].data.row.length;
        let shown    = $('#' + id + '-content').find('.content-item').length;
        setPanelPaginationControls(id, (pageRows >= settings[id].limit) ? shown + 1 : shown);

        if(!isNext) {
            if(settings[id].autoClick) {
                if($('#' + id + '-content').find('.content-item').length > 0) {
                    $('#' + id + '-content').find('.content-item').first().click();
                }
            }
        }

        insertWorkspaceSearchDataDone(id, responses, isNext);

    });

}
function insertWorkspaceSearchDataDone(id, data, isNext) {}



// Insert basic SEARCH capability
function insertSearch(params) {    
    
    const id = getPanelSettings('insertSearch', params);

    genPanelElements(id);

    settings[id].load = function() { resetSearch(id, true); }
    settings[id].next = function() { insertSearchData(id, true); }

    genPanelToolbar(id, 'actions');

    $('<input></input>').appendTo($('#' + id + '-actions'))
        .attr('placeholder', settings[id].searchInputLabel)
        .attr('id', id + '-search-content-input')
        .addClass('search-content-input')
        .click(function(e){
            e.preventDefault();
            e.stopPropagation();
        })
        .keypress(function(e) {
            if(e.which == 13) {
                settings[id].mode = 'initial';
                insertSearchData(id, false);
            }
        });

    let elemButton = $('<div></div>').appendTo($('#' + id + '-actions'))
        .attr('id', id + '-search-content-button')
        .addClass('search-content-button')
        .addClass('button')
        .addClass('default')
        .addClass('disabled')
        .html(settings[id].searchButtonLabel)
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            resetSearch(id, false);
            settings[id].mode = 'initial';
            insertSearchData(id, false);
        });

    if(!isBlank(settings[id].searchButtonIcon)) elemButton.addClass('with-icon').addClass(settings[id].searchButtonIcon);

    getWorkspaceIdsFromNames(settings[id], function(workspaceIds) {
        settings[id].workspaceIds = workspaceIds;
        settings[id].load();
    });

    insertSearchDone(id);

}
function insertSearchDone(id) {}
function resetSearch(id, resetInput) {

    if(resetInput) $('#' + id + '-search-content-input').val('').focus();
    
    $('.search-filter'        ).hide();
    $('#' + id + '-search'    ).hide();
    $('#' + id + '-content'   ).hide();
    $('#' + id + '-processing').hide();
    $('#' + id + '-no-data'   ).hide();
    $('#' + id + '-search-content-button').removeClass('disabled');

}
function insertSearchData(id, isNext) {

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
    if(settings[id].searchForExactMatch   ) params.wildcard   = false;

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
        finishPanelContentUpdate(id, items);
        setPanelPaginationControls(id, response.data.totalCount);
        $('#' + id + '-search-content-input').focus();


        if(!isNext) {
            if(settings[id].autoClick) {
                if($('#' + id + '-content').find('.content-item').length > 0) {
                    $('#' + id + '-content').find('.content-item').first().click();
                }
            }
        }

        insertSearchDataDone(id, response, isNext);

    });

}
function insertSearchDataDone(id, data, isNext) {}
function clickSearchResult(elemClicked, e) {
    openItemByLink(elemClicked.attr('data-link'));
}



// Insert advanced SEARCH results
function insertResults(wsId, filters, params) {

    const inputs = {
        wsId    : wsId,
        filters : filters || params.filters || []
    };

    const id = getPanelSettings('insertResults', params, inputs);

    genPanelElements(id);

    if(!settings[id].searchReturnFields.includes('DESCRIPTOR')) {
        settings[id].searchReturnFields.unshift('DESCRIPTOR');
    }

    if(!isBlank(settings[id].groupBy)) {
        if(!settings[id].searchReturnFields.includes(settings[id].groupBy)) {
            settings[id].searchReturnFields.push(settings[id].groupBy);
        }
    }

    if(!isBlank(settings[id].additionalData)) {
        for(let additionalData of settings[id].additionalData) {
            if(!settings[id].searchReturnFields.includes(additionalData)) {
                settings[id].searchReturnFields.push(additionalData);
            }
        }
    }

    if(typeof settings[id].tileImage == 'string') {
        settings[id].tileImageFieldId = settings[id].tileImage;
        if(!settings[id].searchReturnFields.includes(settings[id].tileImage)) {
            settings[id].searchReturnFields.push(settings[id].tileImage);
        }      
    } else if(settings[id].tileImage === true) {
        if(!isBlank(settings[id].tileImageFieldId)) {
            if(!settings[id].searchReturnFields.includes(settings[id].tileImageFieldId)) {
                settings[id].searchReturnFields.push(settings[id].tileImageFieldId);
            }
        }    
    }

    if(typeof settings[id].tileTitle == 'string') {
        if(!isBlank(settings[id].tileTitle)) {
            if(!settings[id].searchReturnFields.includes(settings[id].tileTitle)) {
                settings[id].searchReturnFields.push(settings[id].tileTitle);
            }
        }
    } else if(typeof settings[id].tileTitle == 'object') {
        for(let tileTitle of settings[id].tileTitle) {
            if(!settings[id].searchReturnFields.includes(tileTitle)) {
                settings[id].searchReturnFields.push(tileTitle);
            }
        }
    }

    if(typeof settings[id].tileSubtitle == 'string') {
        if(!isBlank(settings[id].tileSubtitle)) {
            if(!settings[id].searchReturnFields.includes(settings[id].tileSubtitle)) {
                settings[id].searchReturnFields.push(settings[id].tileSubtitle);
            }
        }
    } else if(typeof settings[id].tileSubtitle == 'object') {
        for(let tileSubtitle of settings[id].tileSubtitle) {
            if(!settings[id].searchReturnFields.includes(tileSubtitle)) {
                settings[id].searchReturnFields.push(tileSubtitle);
            }
        }
    }

    if(!isBlank(settings[id].tileDetails)) {
        for(let tileDetail of settings[id].tileDetails) {
            if(!isBlank(tileDetail.fieldId)) {
                if(!settings[id].searchReturnFields.includes(tileDetail.fieldId)) {
                    settings[id].searchReturnFields.push(tileDetail.fieldId);
                }
            }
        }
    }

    if(!isBlank(settings[id].fieldsIn)) {
        for(let fieldId of settings[id].fieldsIn) {
            if(!settings[id].searchReturnFields.includes(fieldId)) {
                settings[id].searchReturnFields.push(fieldId);
            }
        }
    }
    
    if(settings[id].filterByStatus) {
        if(!settings[id].searchReturnFields.includes('WF_CURRENT_STATE')) {
            settings[id].searchReturnFields.push('WF_CURRENT_STATE');
        } 
    }

    if(settings[id].stateColors.length > 0) {
        if(!settings[id].searchReturnFields.includes('WF_CURRENT_STATE')) {
            settings[id].searchReturnFields.push('WF_CURRENT_STATE');
        }
    }

    if(settings[id].editable) {

        let elemToolbar = genPanelToolbar(id, 'controls');

        $('<div></div>').prependTo(elemToolbar)
            .addClass('button')
            .addClass('default')
            .addClass('panel-action')
            .attr('id', id + '-action-save')
            .attr('title', 'Save changes')
            .html('Save')
            .hide()
            .click(function() {
                savePanelTableChanges(id);
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
        wsId               : settings[id].wsId,
        filter             : settings[id].filters,
        fields             : settings[id].searchReturnFields,
        sort               : settings[id].sortBy,
        searchLogicClause  : settings[id].searchLogicClause,
        searchLatestOnly   : settings[id].searchLatestOnly,
        searchReleasedOnly : settings[id].searchReleasedOnly,
        searchWorkingOnly  : settings[id].searchWorkingOnly,
        hideWorking        : settings[id].hideWorking,        
        timestamp          : settings[id].timestamp,
        useCache           : settings[id].useCache,
        tileImage          : settings[id].tileImage,
        tileImageFieldId   : settings[id].tileImageFieldId,
    }

    let requests = [
        $.post( '/plm/search', params),
        $.get( '/plm/fields',  { wsId : settings[id].wsId, useCache : settings[id].useCache } ),
    ];

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings[id])) return;

        let items      = [];
        let listStates = [];

        settings[id].columns = [];

        for(let fieldId of settings[id].searchReturnFields) {
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

            let stateName = '';

            let contentItem = genPanelContentItem(settings[id], {
                link : '/api/v3/workspaces/' + settings[id].wsId + '/items/' + row.dmsId
            })

            contentItem.filters = [];

            if(settings[id].filterByStatus) {
                stateName = row.data.WF_CURRENT_STATE.displayValue;
                if(!listStates.includes(stateName)) listStates.push(stateName);
                contentItem.filters.push({
                    key : 'status', value : stateName
                })

            }

            if(settings[id].tileImage === true) contentItem.imageFile = row.imageFile
            
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

        sortArray(listStates, 0);
        setPanelFilterOptions(id, 'status', listStates);
        finishPanelContentUpdate(id, items);

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



// Insert tasks in defined status with acknowledgement actions
function insertNewTasks(wsId, filters, params) {

    if(isBlank(params)) params = {};
    
    const id = isBlank(params.id) ? 'new-tasks' : params.id;

    getPanelSettings('insertNewTasks', id, params);

    settings[id].layout = 'list';

    genPanelElements(id, 'new-tasks');

    insertNewTasksDone(id);
    settings[id].load();

}
function insertNewTasksDone(id) {}
function insertNewTasksData(id) {

    settings[id].timestamp = startPanelContentUpdate(id);

    let params = {
        wsId      : settings[id].wsId,
        filter    : settings[id].filters,
        fields    : [],
        pageSize  : settings[id].pageSize,
        sort      : settings[id].sortBy,
        timestamp : settings[id].timestamp,
        useCache  : settings[id].useCache
    }

    params.fields.push(settings[id].fieldIDs.root);
    params.fields.push(settings[id].fieldIDs.id);
    params.fields.push(settings[id].fieldIDs.title);
    params.fields.push(settings[id].fieldIDs.description);
    params.fields.push(settings[id].fieldIDs.priority);
    params.fields.push(settings[id].fieldIDs.start);
    params.fields.push(settings[id].fieldIDs.end);
    params.fields.push(settings[id].fieldIDs.duration);
    params.fields.push(settings[id].fieldIDs.plannedEffort);
    params.fields.push(settings[id].fieldIDs.weeklyEffort);

    $.post( '/plm/search', params, function(response) {

        printResponseErrorMessagesToConsole(response);

        if(stopPanelContentUpdate(response, settings[id])) return;

        let items = response.data.row;

        for(let item of items) {

            const subtitle = (item.data.hasOwnProperty(settings[id].fieldIDs.description)) ? item.data[settings[id].fieldIDs.description].value : '';

            item.link     = '/api/v3/workspaces/' + settings[id].wsId + '/items/' + item.dmsId;
            item.title    = item.data[settings[id].fieldIDs.id].value + ' - ' + item.data[settings[id].fieldIDs.title].value;
            item.subtitle = subtitle;
            item.details  = [];

            insertNewTaskDetail(item, settings[id].fieldIDs, 'priority', 'value', 'Priority');
            insertNewTaskDetail(item, settings[id].fieldIDs, 'duration', 'value', 'Duration', 'days');
            insertNewTaskDetail(item, settings[id].fieldIDs, 'end', 'displayValue', 'Due Date');
            insertNewTaskDetail(item, settings[id].fieldIDs, 'plannedEffort', 'displayValue', 'Planned Effort', 'hours');

            if(!isBlank(settings[id].groupBy)) item.group = item.data[settings[id].groupBy].value;

        }

        finishPanelContentUpdate(id, items);

        let elemContent = $('#' + id + '-content');
        let index       = 0;

        elemContent.find('.content-item').each(function() {

            let elemTask    = $(this);
            let item        = items[index++];
            let elemActions = $('<div></div>').appendTo(elemTask).addClass('task-actions');
            let dueDate     = new Date();

            if(item.data.hasOwnProperty(settings[id].fieldIDs.end)) {
                const dueString = item.data[settings[id].fieldIDs.end].value.split(' ')[0].split('-');
                dueDate         = new Date(dueString[0], Number(dueString[1]) - 1, Number(dueString[2]));
            }

            elemTask.attr('data-tDue', dueDate.getTime());
            elemTask.addClass('new-task');

            if(settings[id].hasOwnProperty('transitions')) {
                if(typeof settings[id].transitions !== 'undefined') {
                    for(let transition of settings[id].transitions) {
                        insertNewTaskAction(elemTask, elemActions, transition);    
                    }
                }
            }

        });

        insertNewTasksDataDone(id, response);

    });

}
function insertNewTaskDetail(item, fieldIDs, fieldName, property, prefix, suffix) {

    if(!item.data.hasOwnProperty(fieldIDs[fieldName])) return;

    let value = item.data[fieldIDs[fieldName]][property];

    if(!isBlank(suffix)) value += ' (' + suffix + ')';
    
    item.details.push({
        label : prefix,
        value : value
    })

}
function insertNewTaskAction(elemTask, elemParent, transition) {

    if(isBlank(transition)) return;

    let link        = elemTask.attr('data-link');
    let descriptor  = elemTask.attr('data-title');

    let elemAction = $('<div></div>').appendTo(elemParent)
        .addClass('button')
        .addClass('new-task-action-return')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            insertWorkflowTransitionDialog(link, descriptor, 'Task', transition, function() {
                settings['new-tasks'].load();
                settings['your-tasks'].load();
        });
    });


    if(!isBlank(transition.icon)) {
        elemAction.addClass('icon');
        elemAction.addClass(transition.icon);
        elemAction.attr('title', transition.title || transition.id);
    } else elemAction.html(transition.title || transition.id);
    
    if(!isBlank(transition.class)) { elemAction.addClass(transition.class); }

    return elemAction;

}
function insertNewTasksDataDone(id, response) {}



// Insert end user dashboard for comprehensive task management
function insertTasksManager(wsId, filters, params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'tasks-manager' : params.id;

    getPanelSettings('insertTasksManager', id, params);
    genPanelElements(id, 'tasks-manager');    

    insertTasksManagerDone(id);
    settings[id].load();

}
function insertTasksManagerDone(id) {}
function insertTasksManagerData(id) {

    settings[id].timestamp = startPanelContentUpdate(id);

    let params = {
        wsId      : settings[id].wsId,
        fields    : [],
        filter    : settings[id].filters,
        sort      : [settings[id].fieldIDs.end],
        timestamp : settings[id].timestamp
    }

    let keys = Object.keys(settings[id].fieldIDs);

    for(let key of keys) params.fields.push(settings[id].fieldIDs[key]);

    let requests = [
        $.post('/plm/search', params),
        $.get('/plm/workspace-workflow-transitions', { wsId : settings[id].wsId, useCache : settings[id].useCache })
    ];

    Promise.all(requests).then(function(responses) {

        printResponseErrorMessagesToConsole(responses[0]);

        if(stopPanelContentUpdate(responses[0], settings[id])) return;
    
        getTimelineWeeks(responses[0].data.row, settings[id].fieldIDs);

        let elemContent = $('#' + id + '-content');
        let elemTable   = $('<table></table>').appendTo(elemContent).attr('id', id + '-table');
        let elemTHead   = $('<thead></thead>').appendTo(elemTable  ).attr('id', id + '-thead');
        let elemTHRow   = $('<tr></tr>      ').appendTo(elemTHead  ).attr('id', id + '-throw');
        let elemTBody   = $('<tbody></tbody>').appendTo(elemTable  ).attr('id', id + '-tbody');        

        tasksManagerInsertHeaders(elemTHRow);

        if(settings[id].hasOwnProperty('transitions')) {
            if(typeof settings[id].transitions !== 'undefined') {
                for(let transition of settings[id].transitions) {
                    for(let transitionDef of responses[1].data) {
                        if(transition.id === transitionDef.customLabel) {
                            transition.link = transitionDef.__self__;
                        }
                    }
                }
            }
        }

        for(let row of responses[0].data.row) {

            let task = {
                dmsId         : row.dmsId,
                link          : '/api/v3/workspaces/' + settings[id].wsId + '/items/' + row.dmsId,
                root          : row.data[settings[id].fieldIDs.root].value,
                id            : row.data[settings[id].fieldIDs.id].value,
                title         : row.data[settings[id].fieldIDs.title].value,
                description   : getSearchResultFieldValue(row, settings[id].fieldIDs.description),
                start         : getSearchResultFieldValue(row, settings[id].fieldIDs.start, '', 'displayValue'),
                end           : getSearchResultFieldValue(row, settings[id].fieldIDs.end, '', 'displayValue'),
                progress      : Number(row.data[settings[id].fieldIDs.progress].value),
                // lastComment   : row.data[settings[id].fieldIDs.lastComment].value,
                lastComment   : getSearchResultFieldValue(row, settings[id].fieldIDs.lastComment),
                lastUpdate    : getSearchResultFieldValue(row, settings[id].fieldIDs.lastUpdate, '', 'displayValue'),
                // lastUpdate    : row.data[settings[id].fieldIDs.lastUpdate].displayValue,
                actualEffort  : (typeof row.data[settings[id].fieldIDs.actualEffort ] === 'undefined') ? 0.0 : Number(row.data[settings[id].fieldIDs.actualEffort ].displayValue),
                plannedEffort : (typeof row.data[settings[id].fieldIDs.plannedEffort] === 'undefined') ? 0.0 : Number(row.data[settings[id].fieldIDs.plannedEffort].displayValue),
                startEffort   : (typeof row.data[settings[id].fieldIDs.startEffort  ] === 'undefined') ? 0.0 : Number(row.data[settings[id].fieldIDs.startEffort  ].displayValue),
                weeklyEffort  : (typeof row.data[settings[id].fieldIDs.weeklyEffort ] === 'undefined') ? 0.0 : Number(row.data[settings[id].fieldIDs.weeklyEffort ].displayValue),
                endEffort     : (typeof row.data[settings[id].fieldIDs.endEffort    ] === 'undefined') ? 0.0 : Number(row.data[settings[id].fieldIDs.endEffort    ].displayValue),
                tStart        : row.tStart,
                tEnd          : row.tEnd,
                wStart        : row.wStart,
                wEnd          : row.wEnd,
            };

            // yourTasks.push(task);

            let elemTask = $('<tr></tr>').appendTo(elemTBody)
                .addClass('content-item')
                .addClass('hover')
                .attr('data-link', task.link)
                .attr('data-root', task.root);

            $('<td></td>').appendTo(elemTask)
                .addClass('root')
                .addClass('nowrap')
                .html(task.root);

            $('<td></td>').appendTo(elemTask)
                .addClass('id')
                .addClass('nowrap')
                .html(task.id);

            $('<td></td>').appendTo(elemTask)
                .addClass('title')
                .addClass('nowrap')
                .html(task.title);

            insertTaskManagerSeparator(elemTask);                

            $('<td></td>').appendTo(elemTask)
                .addClass('description')
                .addClass('nowrap')
                .addClass('plain-paragraph-field')
                .html(task.description);

            insertTaskManagerSchedule(elemTask, task);
            insertTaskManagerSeparator(elemTask);
            insertTaskManagerProgressControls(id, elemTask, task);
            insertTaskManagerSeparator(elemTask);
            insertTaskManagerEffortControls(elemTask);
            insertTaskManagerSeparator(elemTask);
            insertTaskManagerTimeline(elemTask, task);

            setTaskEvents(elemTask);
   
        }

        setTableEvents();
        tasksManagerUpdateProgressBarsOfAllTasks(id);
        finishPanelContentUpdate(id, [], null, responses[0].data);
        selectWeek($('.timeline-week.week-now').first());

    });
 
}
function getTimelineWeeks(activities, fieldIDs) {

    weeks = [];

    let tMin  = new Date().getTime();
    let tMax  = new Date().getTime();

    for(let activity of activities) {

        let start = getSearchResultFieldValue(activity, fieldIDs.start, '');
        let end   = getSearchResultFieldValue(activity, fieldIDs.end  , '');

        activity.tStart = -1;
        activity.tEnd   = -1;

        if(!isBlank(start)) {
            if(!isBlank(end)) {

                activity.tStart = getDateFromString(start).getTime();
                activity.tEnd   = getDateFromString(end).getTime();

                if(activity.tStart < tMin) tMin = activity.tStart;
                if(activity.tEnd   > tMax) tMax = activity.tEnd;

            }
        }

    }

    let now   = new Date();
    let mon   = new Date(tMin);
    let day   = mon.getDay() - 1;
    let index = 0;

    mon.setDate(mon.getDate() - day - 7);

    tMax += 604800000;

    do {

        let start         = new Date(mon.getTime());
        let end           = new Date(mon.getTime());
        // let friday        = new Date(mon.getTime());
        let startSearch   = new Date(mon.getTime());
        let endSearch     = new Date(mon.getTime());
        let startOfYear   = new Date(end.getFullYear(), 0, 1);
        let dayDifference = Math.floor((end - startOfYear) / (24 * 60 * 60 * 1000));
        let week          = Math.ceil((dayDifference + startOfYear.getDay() + 1) / 7);
        let className     = 'week-future';


        end.setDate(end.getDate() + 7);
        // friday.setDate(friday.getDate() + 4);
        endSearch.setDate(endSearch.getDate() + 7);
        startSearch.setDate(startSearch.getDate() - 1);

        if(end.getTime() < now.getTime()) className = 'week-past';
        else if((start.getTime() - now.getTime()) < 100) className = 'week-now';

        weeks.push({
            index       : index++,
            start       : start.getTime(),
            end         : end.getTime(),
            year        : end.getFullYear(),
            number      : week,
            label       : start.getDate() + '.' + (start.getMonth() + 1) + '.',
            class       : className,
            startString : start.getFullYear() + '/' + (start.getMonth() + 1) + '/' + start.getDate(),
            startSearch : startSearch.getFullYear() + '/' + (startSearch.getMonth() + 1) + '/' + startSearch.getDate(),
            endSearch   : endSearch.getFullYear() + '/' + (endSearch.getMonth() + 1) + '/' + endSearch.getDate(),
            endString   : end.getFullYear() + '/' + (end.getMonth() + 1) + '/' + end.getDate(),
            moString    : mon.getFullYear() + '/' + (mon.getMonth() + 1) + '/' + mon.getDate(),
            current     : (className === 'week-now')
        })

        mon.setDate(mon.getDate() + 7);

    } while (mon.getTime() < tMax);

    for(let activity of activities) {
        activity.wStart = -1;
        activity.wEnd   = -1;
        for(let week of weeks) {
            if(activity.tStart >= week.start) {
                if(activity.tStart <= week.end) {
                    activity.wStart = week.index;
                }
            }
            if(activity.tEnd >= week.start) {
                if(activity.tEnd <= week.end) {
                    activity.wEnd = week.index;
                }
            }
        }
    }

    return weeks;

}
function tasksManagerInsertHeaders(elemTHRow) {

    let id  = 'your-tasks';
    
    $('<th></th>').appendTo(elemTHRow).html('Project').addClass('root');
    $('<th></th>').appendTo(elemTHRow).html('ID').addClass('id');
    $('<th></th>').appendTo(elemTHRow).html('Task').addClass('title');
    $('<th></th>').appendTo(elemTHRow).addClass('separator');    
    $('<th></th>').appendTo(elemTHRow).html('Description');
    $('<th></th>').appendTo(elemTHRow).html('Schedule');
    $('<th></th>').appendTo(elemTHRow).addClass('separator');
    $('<th></th>').appendTo(elemTHRow).html('Progress');
    $('<th></th>').appendTo(elemTHRow).html('Last Update').addClass('th-sub').addClass('last-update');
    $('<th></th>').appendTo(elemTHRow).addClass('separator');
    
    let elemTHEfforts = $('<th></th>').appendTo(elemTHRow).addClass('efforts');
    let elemTHTop     = $('<div></div>').appendTo(elemTHEfforts).addClass('th-top');
    let elemTHSub     = $('<div></div>').appendTo(elemTHEfforts).addClass('th-sub');

    $('<div></div>').appendTo(elemTHTop).html('Efforts');

    $('<div></div>').appendTo(elemTHTop)
    .addClass('button')
    .addClass('icon')
    .addClass('icon-chevron-left')
    .addClass('efforts-prev')
    .click(function() {
        switchWeek($(this));
    });

    $('<div></div>').appendTo(elemTHTop).html('').addClass('efforts-week');

    $('<div></div>').appendTo(elemTHTop)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-chevron-right')
        .addClass('efforts-next')
        .click(function() {
            switchWeek($(this));
        });

    let elemCounters = $('<div></div>').appendTo(elemTHSub).addClass('grid-counters');

    $('<div></div>').appendTo(elemCounters).attr('id', 'effort-total-actual')
    $('<div></div>').appendTo(elemCounters).html('Actual');
    $('<div></div>').appendTo(elemCounters).attr('id', 'effort-total-planned');
    $('<div></div>').appendTo(elemCounters).html('Planned');

    $('<th></th>').appendTo(elemTHRow).addClass('separator');

    for(let index in weeks) {

        let week = weeks[index];
        
        let elemWeek = $('<th></th>').appendTo(elemTHRow)
            .addClass('timeline-week')
            .addClass(week.class)
            .addClass('week-' + index)
            .attr('data-index', index)
            .click(function() {
                selectWeek($(this));
            });
        
        $('<div></div>').appendTo(elemWeek)
            .addClass('th-main')
            .html(week.number);

        $('<div></div>').appendTo(elemWeek)
            .addClass('th-sub')
            .html(week.label);

    }

}
function insertTaskManagerSchedule(elemTask, task) {

    let elemCell = $('<td></td>').appendTo(elemTask).addClass('task-schedule');

    $('<div></div>').appendTo(elemCell).addClass('date').html(task.start);
    $('<div></div>').appendTo(elemCell).addClass('char').html('▶')
    $('<div></div>').appendTo(elemCell).addClass('date').html(task.end);

}
function insertTaskManagerSeparator(elemTask) {

    $('<td></td>').appendTo(elemTask).addClass('separator');

}
function insertTaskManagerProgressControls(id, elemTask, task) {

    let elemCell   = $('<td></td>').appendTo(elemTask).addClass('cell-progress-controls');
    let elemGrid   = $('<div></div>').appendTo(elemCell).addClass('grid-progress');
    let elemSelect = $('<select></select>').appendTo(elemGrid)
        .addClass('task-progress')
        .addClass('task-progress-input')
        .addClass('button');

    $('<option></option>').appendTo(elemSelect)
        .html('0 %')
        .attr('data-progress', 0)
        .addClass('progress-selector');

    for(let index in settings[id].transitions) insertTaskProgressSelector(id, elemSelect, Number(index), task);

    $('<input></input>').appendTo(elemGrid)
        .addClass('task-comment')
        .addClass('comment')
        .addClass('task-progress-input')
        .addClass('button')
        .attr('placeholder', 'Enter comment')
        .val(task.lastComment);

    $('<div></div>').appendTo(elemGrid).addClass('task-progress-bar');
    $('<td></td>').appendTo(elemTask).addClass('last-update').html(task.lastUpdate);

}
function insertTaskProgressSelector(id, elemParent, index, task) {

    let transition   = settings[id].transitions[index];
    let tranistionId = transition.link.split('/').pop();

    $('<option></option>').appendTo(elemParent)
        .html(transition.value + ' %')
        .addClass('progress-selector')
        .attr('data-progress', transition.value)
        .attr('value', transition.value)
        .attr('data-transition', tranistionId);

    if(transition.value == task.progress) elemParent.val(transition.value);

}
function insertTaskManagerEffortControls(elemTask) {

    let elemCell = $('<td></td>'  ).appendTo(elemTask).addClass('cell-effort-controls');
    let elemGrid = $('<div></div>').appendTo(elemCell).addClass('grid-efforts');

    insertTaskEffortInput(elemGrid, 'Mo');
    insertTaskEffortInput(elemGrid, 'Tu');
    insertTaskEffortInput(elemGrid, 'We');
    insertTaskEffortInput(elemGrid, 'Th');
    insertTaskEffortInput(elemGrid, 'Fr');

    $('<input></input>').appendTo(elemGrid)
        .attr('placeholder', 'Enter Comment')
        .addClass('task-effort-control')
        .addClass('task-effort-comment')
        .addClass('comment');

    $('<div></div>').appendTo(elemGrid).addClass('planned-effort');

    let elemBar = $('<div></div>').appendTo(elemGrid).addClass('task-effort-bar');

    tasksManagerSetLinearGradient(elemBar, '135', 0, 'green', '--color-surface-level-1');

}
function insertTaskEffortInput(elemGrid, day) {

    $('<input></input>').appendTo(elemGrid)
        .attr('placeholder', day)
        .attr('type', 'number')
        .addClass('task-effort-' + day.toLowerCase())
        .addClass('task-effort-control')
        .addClass('task-effort-input');

}
function insertTaskManagerTimeline(elemTask, task) {
   
    if((task.wStart < 0) || (task.wEnd < 0)) {
        for(let week of weeks) {
            $('<td></td>').appendTo(elemTask)
            .addClass('timeline-week')
            .addClass('week-' + week.index)
            .addClass(week.class);
        }
    } else {

        for(let week of weeks) {

            let elemCell = $('<td></td>').addClass('timeline-week').addClass(week.class).addClass('week-' + week.index);

                 if(week.index  <  task.wStart) elemCell.appendTo(elemTask);
            else if(week.index  >  task.wEnd  ) elemCell.appendTo(elemTask);
            else if(week.index === task.wStart) {

                elemCell.appendTo(elemTask).addClass('timeline-bar').attr('colspan', (task.wEnd - task.wStart) + 1);

                // let progress      = Number(getSearchResultFieldValue(task, wsConfig.fieldIDs.progress, 0));
                // // let actualEffort  = task.data[config.fieldIDs.actualEffort];
                // let plannedEffort = task.data[config.fieldIDs.plannedEffort];

                // actualEffort  = (typeof actualEffort === 'undefined') ? 0 : actualEffort.displayValue;
                // plannedEffort = (typeof plannedEffort === 'undefined') ? 0 : plannedEffort.displayValue;
 
                // let percentage = (plannedEffort === 0) ? 0 : (actualEffort * 100 / plannedEffort);
                
                $('<div></div>').appendTo(elemCell)
                    .addClass('timeline-bar-progress')
                    .html('Progress');
                    // .css('background', 'linear-gradient(90deg, var(--color-yellow-500) 0%, var(--color-yellow-500) ' + progress + '%, var(--color-yellow-800) ' + (progress + 5) + '%, var(--color-yellow-800)  100%)');

                 $('<div></div>').appendTo(elemCell)
                    .addClass('timeline-bar-effort')
                    .html('Effort');

                // tasksManagerSetLinearGradient(elemBarEffort, '135', percentage, 'green', '--color-green-800');

            }

        }

    }

}
function setTaskEvents(elemTask) {

    elemTask.click(function() {

        let isSelected = $(this).hasClass('selected');

        if(isSelected) {
            $(this).removeClass('selected');
        } else {
            insertItemSummary($(this).attr('data-link'), paramsTaskSummary);
            $(this).addClass('selected');
        }

        $(this).siblings().removeClass('selected');

    });


    elemTask.find('select').click(function(e) {
        e.stopPropagation();
    });


    elemTask.find('select').change(function(e) {

        updateProgressBarsOfTask($(this).closest('.content-item'));

        let elemSelect   = $(this);
            elemSelect.addClass('changed');
            elemSelect.next().focus().select();

        toggleSaveButton();

    });


    elemTask.find('input').click(function(e) {

        e.preventDefault();
        e.stopPropagation();

    });


    elemTask.find('input.comment').on('keyup', function(e) {

        $(this).addClass('changed');
        toggleSaveButton();

    });


    elemTask.find('.grid-efforts input.task-effort-input').on('keyup', function(e) {

        let elemInput   = $(this);
        let elemTask    = $(this).closest('.content-item');

        if(elemInput.val() != elemInput.attr('data-value')) {
            elemInput.addClass('changed'); 
        } else {
            elemInput.removeClass('changed');
        }
        
        toggleSaveButton();
        updateThisWeekActualEfforts();
        updateEffortBarsOfTask(elemTask);

    });

}
function setTableEvents() {

    let elemTable      = $('#your-tasks-table');
    let elemsSeparator = elemTable.find('.separator');

    elemsSeparator.hover(function() {
        let index = $(this).index();
        elemTable.find('tr').each(function() {
            $(this).children().eq(index).addClass('hover');
        });
    });

    elemsSeparator.mouseout(function() {
        let index = $(this).index();
        elemTable.find('tr').each(function() {
            $(this).children().eq(index).removeClass('hover');
        });
    });

    elemsSeparator.click(function() {

        let elemSeparator  = $(this);
        let elemColumns    = elemSeparator.prevUntil('.separator');
        let indexSeparator = $(this).index();
        let elemHeader     = elemTable.find('th').eq(indexSeparator);
        let isCollapsed    = elemHeader.hasClass('collapsed');
        let indexColumns   = [];

        elemColumns.each(function() {
            indexColumns.push($(this).index());
        });

        elemTable.find('tr').each(function() {
            let elemRow = $(this);
            elemRow.children().eq(indexSeparator).toggleClass('collapsed');
            for(let index of indexColumns) {
                let elemCell = elemRow.children().eq(index);
                if(isCollapsed) elemCell.removeClass('hidden'); else elemCell.addClass('hidden');
            }
        });


    });

}
function tasksManagerSetLinearGradient(elemBar, angle, progress, color, background) {

    if(isBlank(background)) background = '--color-surface-level-2';

    if(progress >= 100) angle = '90';

    elemBar.css('background', 'linear-gradient(' + angle + 'deg, var(--color-' + color + '-600) 0%, var(--color-' + color + '-600) ' + progress + '%, var(' + background + ') ' + progress + '%, var(' + background + ') 100%)');

}
function tasksManagerUpdateProgressBarsOfAllTasks(id) {

    $('#' + id).find('.content-item').each(function() {

        let elemTask     = $(this);
        let elemSelect   = elemTask.find('select.task-progress').first();
        let progress     = elemSelect.find(":selected").attr('data-progress');
        let elemBar      = elemSelect.siblings('.task-progress-bar').first();
        let elemTimeline = elemTask.find('.timeline-bar-progress').first();

        tasksManagerSetLinearGradient(elemBar     , '135', progress, 'yellow', '--color-surface-level-1');
        // tasksManagerSetLinearGradient(elemTimeline, '45', progress, 'yellow', '--color-yellow-900');
        tasksManagerSetLinearGradient(elemTimeline, '60', progress, 'yellow', '--color-surface-level-2');

    });

}