// Insert Classification Browser
function insertClasses(params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'classes' : params.id;

    settings[id] = getPanelSettings('', params, {
        headerLabel : 'Classes',
        placeholder : 'Filter clases' ,
        contentSize : 'm'
    }, [
        [ 'depth'          , 10    ],
        [ 'path'           , false ],
        [ 'toggles'        , false ],
        [ 'hideNumber'     , true  ],
        [ 'hideTableHeader', true  ],
        [ 'topClassName'   , ''    ],
        [ 'topClassId'     , ''    ]
    ]);

    settings[id].load         = function() { insertClassesData(id); }
    settings[id].layout       = 'tree';
    settings[id].skipRootItem = true;

    genPanelTop              (id, 'classes');
    genPanelHeader           (id);
    genPanelSelectionControls(id);
    genPanelToggleButtons    (id, 
        function() {   expandAllNodes(id); }, 
        function() { collapseAllNodes(id); }
    ); 

    genPanelResizeButton(id);
    genPanelSearchInput (id);
    genPanelResetButton (id);
    genPanelReloadButton(id);
    genPanelContents(id);

    insertClassesDone(id);

    settings[id].load();

}
function insertClassesData(id) {

    settings[id].timestamp = startPanelContentUpdate(id);

    let requests = [
        $.get('/plm/classes'     , { useCache : settings[id].useCache, timestamp : settings[id].timestamp}),
        $.get('/plm/classes-tree', { useCache : settings[id].useCache})
    ];

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings[id])) return;

        let items        = [];
        let contentItems = [];

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
                phantom         : classification.ext.abstract,
                path            : '',
                level           : -1,
                domProperties   : [{
                    key : 'NAME', value : classification.name
                }]
            }
                
            items.push(contentItem);

        }

        setClassLevels(settings[id], responses[1].data, items, items[0], 0, items[0].id, '');
        buildClassesTree(items, contentItems, items[0]);
        filterRootClassTree(settings[id], contentItems);
        finishPanelContentUpdate(id, contentItems, null, responses[0].data);

    });

}
function setClassLevels(panelSettings, hierarchy, items, item, level, parentId, path) {

    let separator = (path === '') ? '' : '.';
    let children  = hierarchy[item.id];

    item.level    = level;
    item.path     = path;
    item.parentId = parentId;
    item.children = [];

    path += separator + item.title;

    if(level < panelSettings.depth) {

        for(let child of children) {

            for(let nextItem of items) {
                if(nextItem.id == child) {
                    item.children.push({
                        title : nextItem.title,
                        id   : nextItem.id
                    });
                    setClassLevels(panelSettings, hierarchy, items, nextItem, level + 1, item.id, path);
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
function filterRootClassTree(panelSettings, contentItems) {

    if(isBlank(panelSettings.topClassId)) {
        if(isBlank(panelSettings.topClassName)) {
            return;   
        }
    }

    let rootStart = -1;
    let rootEnd   = -1;
    let rootLevel = -1;

    for(let index in contentItems) {

        let contentItem = contentItems[index];

        if(contentItem.id == panelSettings.topClassId) {
            rootStart = Number(index);
            rootLevel = contentItem.level;
        } else if(contentItem.title === panelSettings.topClassName) {
            rootStart = Number(index);
            rootLevel = contentItem.level;
        } else if(rootStart > -1) {
            if(rootEnd === -1) {
                if(contentItem.level <= rootLevel) {
                    rootEnd = Number(index);
                    break;
                }
            }
        }

    }    

    for(let index = contentItems.length; index >= 0; index--) {

        if(index >= rootEnd) contentItems.splice(index, 1); 
        else if(index < rootStart) contentItems.splice(index, 1); 
        else contentItems[index].level = Number(contentItems[index].level) - rootLevel;

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

    settings[id] = getPanelSettings('', params, {
        contentSize : 'm',
        headerLabel : 'Class Items'
    }, [
        [ 'layout'           , 'table'        ],
        [ 'sortSelection'    , true           ],
        [ 'filterByStatus'   , false          ],
        [ 'filterByWorkspace', false          ],        
        [ 'fields'           , ['DESCRIPTOR'] ],
        [ 'query'            , ''             ],
        [ 'pagination'       , true           ],
        [ 'limit'            , 20             ],
        [ 'referenceItem'    , null           ],
        [ 'referenceData'    , {}             ],
    ]);

    settings[id].load      = function() { insertClassData(id); }
    settings[id].next      = function() { insertClassData(id); }
    settings[id].classId   = (typeof classId === 'string') ? classId.split('/').pop() : classId;
    settings[id].className = className;

    genPanelTop                     (id, 'classContents');
    genPanelHeader                  (id);
    genPanelOpenSelectedInPLMButton (id);
    genPanelSelectionControls       (id);
    genPanelFilterSelect            (id, 'filterByStatus', 'status', 'All States');
    genPanelFilterSelect            (id, 'filterByWorkspace', 'workspace', 'All Workspaces');    
    genPanelResizeButton            (id);
    genPanelSearchInput             (id);
    genPanelResetButton             (id);
    genPanelReloadButton            (id);
    genPanelContents                (id);
    genPanelPaginationControls      (id);

    let elemToolbar = genPanelToolbar(id, 'controls');

    if(settings[id].sortSelection) {

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
                settings[id].sort = $('#' + id + '-sort-by').val();
                settings[id].load();
            });

        elemSort.append($('<option></option>').attr('value', 'score asc').html('Sort by relevance'));
        elemSort.append($('<option></option>').attr('value', 'itemDescriptor asc').html('Sort by Descriptor (ascending)'));
        elemSort.append($('<option></option>').attr('value', 'itemDescriptor desc').html('Sort by Descriptor (decending)'));
        elemSort.append($('<option></option>').attr('value', 'createdOn asc').html('Sort by Creation Date (ascending)'));
        elemSort.append($('<option></option>').attr('value', 'createdOn desc').html('Sort by Creation Date (decending)'));
        elemSort.append($('<option></option>').attr('value', 'lastModifiedOn asc').html('Sort by Last Modification Date (ascending)'));
        elemSort.append($('<option></option>').attr('value', 'lastModifiedOn desc').html('Sort by Last Modification Date (decending)'));

    }

    insertClassDone(id);

    settings[id].load();

}
function insertClassData(id) {

    settings[id].timestamp = startPanelContentUpdate(id, settings[id].mode);

    let params = { 
        className : settings[id].className, 
        classId   : settings[id].classId, 
        query     : settings[id].query,
        sort      : settings[id].sort,
        page      : settings[id].page,
        limit     : settings[id].limit,
        offset    : settings[id].offset,
        timestamp : settings[id].timestamp
    };

    let requests = [
        $.get('/plm/search-class', params),
        $.get('/plm/class-properties', { 
            classId   : settings[id].classId, 
            timestamp : settings[id].timestamp,
            useCache  : true
        })
    ];

    console.log(params);

    Promise.all(requests).then(function(responses) {

        console.log(responses);

        if(stopPanelContentUpdate(responses[0], settings[id])) return;

        let items           = [];
        let listFields      = [];
        let tileDetails     = [];
        let listStates      = [];
        let listWorkspaces  = [];

        for(let fieldId of settings[id].fields) {
            if(includePanelTableColumn(fieldId, '', settings[id], settings[id].columns.length)) {

                switch(fieldId) {

                    case 'DESCRIPTOR'      : settings[id].columns.push({ displayName : 'Descriptor', fieldId : 'DESCRIPTOR'      }); break;
                    case 'WORKSPACE'       : settings[id].columns.push({ displayName : 'Workspace' , fieldId : 'WORKSPACE'       }); break;
                    case 'REVISION'        : settings[id].columns.push({ displayName : 'Revision'  , fieldId : 'REVISION'        }); break;
                    case 'LIFECYCLE'       : settings[id].columns.push({ displayName : 'Lifecycle' , fieldId : 'LIFECYCLE'       }); break;
                    case 'WF_CURRENT_STATE': settings[id].columns.push({ displayName : 'Status'    , fieldId : 'WF_CURRENT_STATE'}); break;

                    default : settings[id].columns.push({
                        displayName : fieldId,
                        fieldId     : fieldId
                    }); break;

                }

            }
        }

        for(let property of responses[1].data) {
            if(!listFields.includes(property.name)) {
                settings[id].columns.push({
                    displayName : property.displayName,
                    fieldId     : '0CWS_' + property.name
                });
                tileDetails.push({
                    fieldId : '0CWS_' + property.name,
                    label   : property.displayName
                });
                listFields.push(property.name);
            }
        }

        if(settings[id].referenceItem !== null) {
            let index = 0;
            for(let item of responses[0].data.items) {
                if(item.__self__ === settings[id].referenceItem.__self__) {
                    responses[0].data.items.splice(index, 1);
                    break;
                }
                index++;
            }
            responses[0].data.items.unshift(settings[id].referenceItem);
        }

        for(let item of responses[0].data.items) {

            if(item.hasOwnProperty('title')) {

                let contentItem = genPanelContentItem(settings[id], { link : item.__self__ });
                let workspace   = item.workspace.title;
                let status      = item.workflowStateName || '';

                if(!isBlank(item.lifecycle)) status = item.lifecycle.title;

                if(!listStates.includes(status)) listStates.push(status);
                if(!listWorkspaces.includes(workspace)) listWorkspaces.push(workspace);            

                for(let column of  settings[id].columns) {

                    let value = '';

                    switch(column.fieldId) {

                        case 'DESCRIPTOR' : value = item.title; contentItem.title = item.title; break;
                        case 'WORKSPACE'  : value = item.workspace.title; break;
                        case 'REVISION'   : value = item.versionId; break;
                        case 'LIFECYCLE'  : value = item.lifecycle.title; contentItem.subtitle = item.lifecycle.title; break;
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

        console.log(items);

        sortArray(listStates, 0);
        sortArray(listWorkspaces, 0);
        setPanelFilterOptions(id, 'status', listStates);
        setPanelFilterOptions(id, 'workspace', listWorkspaces);
        genPanelContentTileDetails(items, tileDetails);
        finishPanelContentUpdate(id, items);
        setPanelPaginationControls(id, responses[0].data.totalCount);

        if(!isBlank(settings[id].referenceItem)) {
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

    settings[id] = getPanelSettings('', params, {
        contentSize : 'm',
        headerLabel : 'Filters',
        textNoData  : 'No properties found for the selected class'
    }, [
        [ 'idContents'    , 'contents'     ],
        [ 'layout'        , 'table'        ],
        [ 'fields'        , ['DESCRIPTOR'] ],
        [ 'advancedFilter', true           ],
        [ 'pagination'    , true           ],
        [ 'limit'         , 25             ]
    ]);

    settings[id].load      = function() { insertClassFiltersData(id); }
    settings[id].classId   = (typeof classId === 'string') ? classId.split('/').pop() : classId;
    settings[id].className = className;

    genPanelTop         (id, 'class');
    genPanelHeader      (id);
    genPanelSearchInput (id, settings[id]);
    genPanelContents    (id, settings[id]);

    let elemButton = genPanelActionButton(id, 'apply', 'Apply', 'Apply the defined filters', function() {
        applyClassFilters(id);
    });

    elemButton.addClass('default').addClass('with-icon').addClass('icon-start');
    elemButton.parent().addClass(id + '-actions');

    insertClassFiltersDone(id);

    settings[id].load();

}
function insertClassFiltersData(id) {

    settings[id].timestamp = startPanelContentUpdate(id);

    let params = {
        classId   : settings[id].classId, 
        timestamp : settings[id].timestamp, 
        useCache  : settings[id].useCache
    }

    $('#' + id + '-controls').children('.panel-action').hide();
    $('#' + id + '-actions' ).children('.panel-action').hide();

    $.get('/plm/class-properties', params, function(response) {

        if(response.params.timestamp == settings[id].timestamp) {
            if(response.error) {
                $('#' + id + '-no-data').show();
                $('#' + id + '-processing').hide();
                $('#' + id + '-controls').children('.panel-action').hide();
                return;
            }
        }
        
        if(stopPanelContentUpdate(response, settings[id])) return;
        
        $('#' + id + '-controls'  ).children('.panel-action').show();
        $('#' + id + '-actions'   ).children('.panel-action').show();
        $('#' + id + '-no-data'   ).hide();
        $('#' + id + '-processing').hide();

        settings[id].fields = [];

        let listExisting = [];

        for(let field of response.data) {
            if(!listExisting.includes(field.name)) {
                settings[id].fields.push(field)
                listExisting.push(field.name)
            }
        }

        sortArray(settings[id].fields, 'displayName', 'string');

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

        insertClassPropertySelector(id, elemSection1, settings[id].fields);

        $('<div></div>').appendTo(elemSection1)
            .addClass('class-filters')  
            .addClass('no-scrollbar');

        let elemSection2 = $('<div></div>').appendTo(elemContent)
            .addClass('panel-section')
            .addClass('filter-section-and')

        $('<div></div>').appendTo(elemSection2)
            .addClass('panel-section-title')   
            .html('AND Conditions');

        $('<div></div>').appendTo(elemSection2)
            .addClass('panel-section-subtitle')
            .html('All of the following conditions must be met');

        insertClassPropertySelector(id, elemSection2, settings[id].fields);
        
        $('<div></div>').appendTo(elemSection2)
            .addClass('class-filters')            

        if(settings[id].advancedFilter) {

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
            
        }

        elemContent.show();

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

    for(let field of settings[id].fields) {
        
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

    let query   = '(CLASS:CLASS_PATH=' + settings[id].className + ')';
    let filters = $('#' + id + '-content').find('.class-filter');
    
    if(filters.length > 0) {
    
        query = '((CLASS:SYSTEM_NAME="' + settings[id].className + '"+AND+(' ;

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

        query += ')))';

    }

    // if(query !== '') query = '(CLASS:SYSTEM_NAME=' + settings[id].className + ')+AND+(' + query + ')';
    
    if(settings[id].advancedFilter) {
        let advanced = $('#' + id + '-content').find('.panel-section-textarea').first().val().trim();
        if(!isBlank(advanced)) { query += '+AND+' + advanced; }
    }    
    
    let idContents       = settings[id].idContents;
    let settingsContents = settings[idContents];

    settingsContents.query = query;
    settingsContents.load();

}
function insertClassFiltersDone(id) {}
function insertClassFiltersDataDone(id) {}



// Insert Item Classification
function insertItemClassification(link, params) {

    if(isBlank(link)) return;
    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'classification' : params.id;
    
    settings[id] = getPanelSettings(link, params, {
        headerLabel    : 'descriptor',
        headerSubLabel : 'Classifcation Data',
        textNoData     : 'No Classification Data Available'
    }, [
        [ 'bookmark'           , false  ],
        [ 'hideLabels'         , false  ],
        [ 'hideReadOnly'       , false  ],
        [ 'hideSections'       , true   ],
        [ 'requiredFieldsOnly' , false  ],
        [ 'saveButtonLabel'    , 'Save' ],
    ]);

    settings[id].load = function() { insertItemClassificationData(id); }

    genPanelTop            (id, 'details');
    genPanelHeader         (id);
    genPanelBookmarkButton (id);
    genPanelOpenInPLMButton(id);
    genPanelReloadButton   (id);
    genPanelContents       (id).addClass(settings[id].layout).addClass('sections');

    if(settings[id].editable) {

        genPanelFooterActionButton(id, 'save', {

            label   : settings[id].saveButtonLabel,
            title   : 'Save changes to PLM',
            default : true

        }, function() { 

            appendOverlay(false);
            submitClassificationEdit(id, function() {
                $('#overlay').hide();
            });

        });

    }

    insertItemClassificationDone(id);

    settings[id].load();

}
function insertItemClassificationDone(id) {}
function insertItemClassificationData(id) {

    settings[id].timestamp = startPanelContentUpdate(id);

    let requests = [ 
        $.get('/plm/details' , { link : settings[id].link, timestamp : settings[id].timestamp }),
        $.get('/plm/sections', { wsId : settings[id].link.split('/')[4], useCache : settings[id].useCache }),
        $.get('/plm/fields'  , { wsId : settings[id].link.split('/')[4], useCache : settings[id].useCache })
    ];

    if((settings[id].bookmark) ) requests.push($.get('/plm/bookmarks'  , { link : settings[id].link }));
    if((settings[id].cloneable)) requests.push($.get('/plm/permissions', { link : settings[id].link }));

    Promise.all(requests).then(function(responses) {

        if(stopPanelContentUpdate(responses[0], settings[id])) return;

        let section       = getClassificationData(responses[0].data);
        let sectionConfig = getClassificationSection(responses[1].data);
        let elemContent   = $('#' + id + '-content');
        let topClassId    = sectionConfig.sectionUrn;

        elemContent.addClass('classification-content');

        settings[id].sectionConfig = sectionConfig;
        settings[id].sections      = responses[1].data;
        settings[id].classId       = section.classificationId;
        settings[id].descriptor    = responses[0].data.title;
        settings[id].sectionsIn    = [section.title];      

        let elemClassification = $('<div></div>').appendTo(elemContent).addClass('classification-header').addClass('classification-data').addClass('surface-level-2');
        let elemButton         = $('<div></div>').addClass('button').addClass('default').addClass('classification-change').html('Change Class').click(function() { selectNewClassification(); });

        $('<div></div>').appendTo(elemClassification).addClass('classification-label').html('Top Level Class');
        $('<div></div>').appendTo(elemClassification).addClass('classification-value').html(getSectionFieldValue(responses[0].data.sections, 'TOP_LEVEL_CLASS', '')).addClass('class-top');
        $('<div></div>').appendTo(elemClassification).addClass('classification-label').html('Class Path');
        $('<div></div>').appendTo(elemClassification).addClass('classification-value').html(getSectionFieldValue(responses[0].data.sections, 'CLASS_PATH', '')).addClass('class-path');
        $('<div></div>').appendTo(elemClassification).addClass('classification-label').html('Class Name');
        $('<div></div>').appendTo(elemClassification).addClass('classification-value').html(getSectionFieldValue(responses[0].data.sections, 'CLASS_NAME', '')).addClass('class-name');
        $('<div></div>').appendTo(elemClassification).addClass('classification-label');
        $('<div></div>').appendTo(elemClassification).addClass('classification-value').append(elemButton);
        $('<div></div>').appendTo(elemClassification).addClass('classification-label').addClass('class-new').addClass('hidden').html('Select New Class');
        $('<div></div>').appendTo(elemClassification).addClass('classification-value').addClass('class-new').addClass('hidden').attr('id', id + '-classification-tree')    ;   

        insertClasses({
            id               : id + '-classification-tree',
            headerLabel      : 'Select New Class',
            placeholder      : 'Search',
            topClassId       : topClassId,
            contentSize      : 's',
            hideHeader       : true,
            hidePanel        : true,
            collapseContents : true,
            search           : true,
            toggles          : true,
            useCache         : true,
            singleToolbar    : 'actions',
            onClickItem      : function(elemClicked) { enableNewClassificationSubmit(elemClicked); },
            afterCompletion  : function(id) { addNewClassificationButtons(id); }
        });            
        
        let requestsClass = [ $.get('/plm/class-fields', { classId : section.classificationId, useCache : settings[id].useCache}) ];

        if(settings[id].editable) requestsClass.push($.get('/plm/class-properties', { classId : section.classificationId, useCache : settings[id].useCache}));

        Promise.all(requestsClass).then(function(responsesClass) {

            for(let field of section.fields) {
                let fieldId = field.urn.split('.').pop();
                for(let wsField of responsesClass[0].data.fields) {
                    let wsFieldId = wsField.urn.split('.').pop();
                    if(fieldId === wsFieldId) {
                        field.defaultValue            = wsField.defaultValue;
                        field.editability             = wsField.editability;
                        field.picklist                = wsField.picklist;
                        field.picklistFieldDefinition = wsField.picklistFieldDefinition;
                        field.validators              = wsField.validators;
                    }
                }
            }

            responses[0].data.sections = [section];

            setPanelBookmarkStatus(id, responses);

            insertDetailsFields(id, settings[id].sections, responses[2].data, responses[0].data, settings[id], false, false, function() {
                if(settings[id].editable) {
                    setClassificationFieldsConstraints(id, responsesClass[0].data.fields);
                    insertClassificationFieldsPicklistValues(id, responsesClass[1]);
                }
                finishPanelContentUpdate(id);
                insertDetailsDataDone(id, responses[0].data);
            });

        });

    });

}
function setClassificationFieldsConstraints(id, fields) {

    let elemContent = $('#' + id + '-content');

    elemContent.find('.field-editable').each(function() {

        let elemField = $(this);
        let fieldId   = elemField.attr('data-id');

        for(let field of fields) {

            if(fieldId === field.__self__.split('/').pop()) {

                let fieldType = field.type.link.split('/').pop();

                if(fieldType == '2') {
                    elemField.find('input').attr('type', 'number');
                }
            
                if(field.hasOwnProperty('fieldValidators')) {
                    if(field.fieldValidators !== null) {
                        if(field.fieldValidators[0].validatorName === 'required') {
                            elemField.closest('.field').addClass('required');
                        }
                    }
                }

            }
        }
    });

}
function insertClassificationFieldsPicklistValues(id, properties) {

    let elemContent = $('#' + id + '-content');

    elemContent.find('.field-editable.field-type-single-select').each(function() {

        let elemField   = $(this);
        let fieldId     = elemField.attr('data-id');
        let elemOptions = elemField.find('.picklist-options');

        for(let property of properties.data) {

            if(fieldId === '0CWS_' + property.name) {

                for(let option of property.picklist) {

                    let elemOption = $('<div></div>').appendTo(elemOptions)
                        .addClass('picklist-option')
                        .addClass('picklist-option-result')
                        .attr('id', option.link)
                        .attr('value', option.link)
                        .attr('displayValue', option.title)
                        .click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            selectPicklistValue($(this));
                        });     
            
                    $('<div></div>').appendTo(elemOption)
                        .addClass('picklist-option-title')
                        .html(option.title);
        
                }
            }
        }

    });

}
function selectNewClassification() {

    $('.classification-header').addClass('pos-abs-max');
    $('.button.classification-change').addClass('hidden');
    $('.class-new').removeClass('hidden');

}
function addNewClassificationButtons(id) {

    let elemParent = $('#' + id + '-actions');

    $('<div></div>').prependTo(elemParent)
        .addClass('button')
        .html('Cancel')
        .click(function() { 
            endNewClassification();
        });

    $('<div></div>').prependTo(elemParent)
        .addClass('button')
        .addClass('default')
        .addClass('disabled')
        .html('Confirm')
        .click(function() {
            submitNewClassification($(this));
        });

}
function submitNewClassification(elemClicked) { 

    if(elemClicked.hasClass('disabled')) return;

    let elemContent  = elemClicked.closest('.panel-content');
    let elemTop      = elemContent.closest('.panel-top');
    let elemTree     = elemClicked.closest('.tree');
    let elemSelected = elemTree.find('.content-item.selected');
    let classId      = elemSelected.attr('data-link').split('/')[1];
    let className    = elemSelected.find('.tree-title').html();
    let classPath    = getTreeItemPath(elemSelected, ' / ');
    let id           = elemTop.attr('id');

    elemContent.find('.class-path').html(classPath.string);
    elemContent.find('.class-name').html(className);
    
    $('#overlay').show();

    let requestsClass = [ $.get('/plm/class-fields', { classId : classId, useCache : settings[id].useCache}) ];

    if(settings[id].editable) requestsClass.push($.get('/plm/class-properties', { classId : classId, useCache : settings[id].useCache}));

    Promise.all(requestsClass).then(function(responses) {

        endNewClassification();
        $('#' + id + '-content').find('.section-fields').remove();
        $('#overlay').hide();

        for(let field of responses[0].data.fields) {
            field.value  = field.defaultValue || null;
            field.title = field.name;
            field.link  = field.__self__;
        }

        let data = {
            sections : [{
                link               : '/' + settings[id].sectionConfig.__self__,
                classificationId   : classId,
                classificationName : settings[id].sectionConfig.name,
                fields             : responses[0].data.fields
            }]
        };

        settings[id].classId = classId;
        settings[id].sectionConfig.fields = responses[0].data.fields;

        insertDetailsFields(id, settings[id].sections, responses[0].data.fields, data, settings[id], false, false, function() {
            if(settings[id].editable) {
                setClassificationFieldsConstraints(id, responses[0].data.fields);
                insertClassificationFieldsPicklistValues(id, responses[1]);
            }
        });

    });

}
function endNewClassification() {

    $('.classification-header').removeClass('pos-abs-max');
    $('.button.classification-change').removeClass('hidden');
    $('.class-new').addClass('hidden');    

}
function enableNewClassificationSubmit(elemClicked) {

    let elemParent    = elemClicked.closest('.panel-top');
    let countSelected = elemParent.find('tr.content-item.selected').length;

    if(countSelected > 0) elemParent.find('.disabled').removeClass('disabled');
    else $('#classification-classification-tree-actions').children('.default').addClass('disabled');

}
function submitClassificationEdit(id, callback) {

    let elemParent = $('#' + id + '-content');

    elemParent.find('.field-value').each(function() { $(this).addClass('field-locked'); });

    if(!validateForm(elemParent)) {

        showErrorMessage('Error', 'Field validations are not met');
        callback();

    } else {

        let params = { 
            link     : settings[id].link,
            sections : [settings[id].sectionConfig],
            fields   : getFieldValues(elemParent),
            classId  : settings[id].classId
        };

        if(params.fields.length === 0) callback();
        else {
            $.post('/plm/edit', params, function(response) {
                printResponseErrorMessagesToConsole(response);
                elemParent.find('.field-value.changed').removeClass('changed');
                callback(response);
            });
        }
    }
        
}



// Insert contents of item's class to identify similar items
function insertSimilarItems(link, params, data) {

    if(isBlank(link  )) return;
    if(isBlank(params)) params = {};
    if(isBlank(data  )) data   = { details : null, classes : null };

    let id = isBlank(params.id) ? 'similar' : params.id;
    let labelFiltersToggle = params.labelFiltersToggle || 'Filters';

    settings[id] = getPanelSettings(link, params, {
    }, [
    ]);

    let elemTop      = genPanelTop (id, 'similar');
    let surfaceLevel = Number(getSurfaceLevel(elemTop, false, true));

    $('body').addClass('no-filters-panel');

    $('<div></div>').appendTo(elemTop)
        .addClass('surface-level-' + surfaceLevel)
        .addClass('similar-contents')
        .addClass('pos-abs-top')
        .attr('id', id + '-contents');

    let elemFilters = $('<div></div>').appendTo(elemTop)
        .addClass('surface-level-' + (surfaceLevel + 1))
        .addClass('similar-filters')
        .addClass('pos-abs-bottom')
        .attr('id', id + '-filters');

    $('<div></div>').appendTo(elemFilters)
        .addClass('surface-level-' + (surfaceLevel + 1))
        .addClass('similar-filters-toggle')
        .attr('id', id + '-filters-toggle')
        .html(labelFiltersToggle)
        .click(function() {
            $('body').toggleClass('no-filters-panel');
        });

    $('<div></div>').appendTo(elemFilters)
        .addClass('surface-level-' + (surfaceLevel + 1))
        .addClass('similar-filters-list')
        .attr('id', id + '-filters-list');

    let requests = [];

    if(data.details === null) requests.push($.get('/plm/details' , { link : link }));
    if(data.classes === null) requests.push($.get('/plm/classes' , { useCache : settings[id].useCache }));

    Promise.all(requests).then(function(responses) {

        if(data.details === null) data.details = responses[0].data;
        if(data.classes === null) data.classes = responses[1].data.classifications;

        let classData = getClassificationData(data.details);
        let classPath = getSectionFieldValue(data.details.sections, 'CLASS_PATH', '');
        let classId   = classData.classificationId;
        let className = classData.classificationName;

        let paramsContents = {
            id                : id + '-contents',
            headerLabel       : params.headerLabel || classPath,
            referenceItem     : link,
            layout            : params.layout,
            contentSizes      : params.contentSizes,
            singleToolbar     : params.singleToolbar,
            fields            : params.fields,
            sortSelection     : params.sortSelection,
            filterByStatus    : params.filterByStatus,
            filterByWorkspace : params.filterByWorkspace,
            reload            : params.reload,
            search            : params.search,
            openInPLM         : params.openInPLM,
        };
        let paramsFilters = {
            id             : id + '-filters-list',
            idContents     : id + '-contents',
            hideHeader     : true,
            advancedFilter : params.advancedFilter
        };

        for(let classification of data.classes) {
            if(classification.id == classId) {
                className = classification.name;
                break;
            }
        }

        insertClassContents(classId, className, paramsContents);
        insertClassFilters (classId, className, paramsFilters );        

    });

}