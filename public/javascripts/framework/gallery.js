let profiles = [{ 
    },{
        headerLabel  : 'Fixed Label',
        headerToggle : true
    },{
        openInPLM           : true,
        openOnDblClick      : true,
        reload              : true
    },{ 
        openInPLM           : true,
        openOnDblClick      : true,
        search              : true,
        reload              : true,
        filterByDueDate     : true,
        filterByOwner       : true,
        filterByStatus      : true,
        filterByWorkspace   : true
    },{
        openInPLM       : true,
        openOnDblClick  : true,
        search          : true,
        layout          : 'list' ,   
        tileSize        : 'xxl',
        tileTitle       : 'DESCRIPTOR',
        tileSubtitle    : 'DESCRIPTION',
        tileDetails     : [{
            icon    : 'icon-tag',
            fieldId : 'TYPE',
            prefix  : 'PR Type'
        }, {
            icon    : 'icon-select',
            fieldId : 'SOURCE',
            prefix  : 'PR Source'
        }],
        stateColors : [
            { color : '#222222', state : 'Create'                    , label : 'New'            },
            { color : '#faa21b', state : 'Review'                    , label : 'Review'         },
            { color : '#6a9728', state : 'Completed'                 , label : 'Complete'       },
            { color : '#dd2222', state : 'Change Request in progress', label : 'CR in progress' }
        ]
    },{
        layout : 'list'
    },{
        layout : 'grid',
    },{
        layout : 'table',
    },{
        search           : true,
        openInPLM        : true,
        reload           : true,
        workflowActions  : true,
        bookmark         : true,
        collapseContents : true,
        expandSections   : ['Basic', 'Procurement'],
        sectionsIn       : ['Basic', 'Procurement'],
        sectionsOrder    : ['Procurement', 'Basic'],
        fieldsEx         : ['Actions'],
        toggles          : true
    }
];

let linkEmberPrinter  = '/api/v3/workspaces/57/items/14669';
let linkAssembly      = '/api/v3/workspaces/57/items/14966';
let linkSubComponent  = '/api/v3/workspaces/57/items/14847';
let linkChangeOrder1  = '/api/v3/workspaces/84/items/15032';
let linkChangeOrder2  = '/api/v3/workspaces/84/items/17479';
let linkProblemReport = '/api/v3/workspaces/82/items/14183';

$(document).ready(function() {
    
    $('<option></option>').appendTo($('#profiles')).attr('value', 0).html('Default');
    $('<option></option>').appendTo($('#profiles')).attr('value', 1).html('Fixed label and toggles');
    $('<option></option>').appendTo($('#profiles')).attr('value', 2).html('Enable open in PLM and reload');
    $('<option></option>').appendTo($('#profiles')).attr('value', 3).html('Additional controls');
    $('<option></option>').appendTo($('#profiles')).attr('value', 4).html('Complex Tiles');
    $('<option></option>').appendTo($('#profiles')).attr('value', 5).html('Layout : List');
    $('<option></option>').appendTo($('#profiles')).attr('value', 6).html('Layout : Grid');
    $('<option></option>').appendTo($('#profiles')).attr('value', 7).html('Layout : Table');
    $('<option></option>').appendTo($('#profiles')).attr('value', 8).html('Details Tab Adjustments');
    
    setUIEvents();

});


function setUIEvents() {

    $('#header-toolbar').children('.button').click(function() {

        if($(this).attr('id') === 'toggle-theme') {
            $('body').toggleClass('dark-theme').toggleClass('light-theme');
            return;
        }

        $(this).addClass('default');
        $(this).siblings('.button').removeClass('default');

        let id  = $(this).attr('data-id');
        let div = $('#' + id);
        
        div.show();
        div.siblings('.screen').hide();

        if(id === 'home'     ) setHome();
        if(id === 'views'    ) setViews();
        if(id === 'find'     ) setSearch();
        if(id === 'item-1'   ) setItem1();
        if(id === 'item-2'   ) setItem2();
        if(id === 'item-3'   ) setItem3();
        if(id === 'item-4'   ) setItem4();
        if(id === 'summary'  ) setSummary();
        if(id === 'lists'    ) setLists();
        if(id === 'grids'    ) setGrids();
        if(id === 'galleries') setGalleries();
        if(id === 'rows'     ) setRows();
        if(id === 'files'    ) setFiles();
        if(id === 'tabs'     ) setTabs();
        if(id === 'edit'     ) setEdit();

    });

    $('#profiles').on('change', function() {
        $('#header-toolbar').children('.default').click();
    });

    $('#showcreate').click(function() {
        insertCreate(['Problem Reports', 'Change Orders', 'Change Requests'], null, { 
            id : 'create-dialog',  hideComputed : true, openInPLM : true,
            toggles : true,
            collapsed: true
        });
    })

    $('#showclone').click(function() {
        insertClone(['Problem Reports', 'Change Orders', 'Change Requests'], null, { 
            id : 'create-dialog',  hideComputed : true, openInPLM : true,
            toggles : true,
            collapsed: true
        });
    })

    $('#header-toolbar').children('.button').first().click();

}



function setHome() {

    insertMOW(profiles[$('#profiles').val()]);
    insertBookmarks(profiles[$('#profiles').val()]);
    insertRecentItems(profiles[$('#profiles').val()]);

}
function setViews() {

    insertWorkspaceViews('95', profiles[$('#profiles').val()]);
    insertWorkspaceItems('95', profiles[$('#profiles').val()]);

}
function setSearch() {

    insertSearch(profiles[$('#profiles').val()]);
    insertResults('82', [{
        field       : 'TITLE',       
        type        : 0,
        comparator  : 21,
        value       : ''
    }],profiles[$('#profiles').val()]);

}
function setItem1() {

    insertDetails(linkEmberPrinter, profiles[$('#profiles').val()]);
    insertAttachments(linkEmberPrinter, profiles[$('#profiles').val()]);
    insertGrid(linkChangeOrder1, profiles[$('#profiles').val()]);
    insertWorkflowHistory(linkChangeOrder1, profiles[$('#profiles').val()]);

}
function setItem2() {

    insertViewer(linkEmberPrinter);
    insertBOM(linkEmberPrinter, profiles[$('#profiles').val()]);
    insertFlatBOM(linkEmberPrinter, profiles[$('#profiles').val()]);

}
function setItem3() {

    insertParents(linkSubComponent, profiles[$('#profiles').val()]);
    insertRootParents(linkSubComponent, profiles[$('#profiles').val()]);
    insertBOMChanges(linkAssembly, profiles[$('#profiles').val()]);

}
function setItem4() {

    insertChangeLog(linkEmberPrinter, profiles[$('#profiles').val()]);
    insertRelationships(linkEmberPrinter, profiles[$('#profiles').val()]);
    insertChangeProcesses('/api/v3/workspaces/57/items/14553', profiles[$('#profiles').val()]);
    insertManagedItems(linkChangeOrder1, profiles[$('#profiles').val()]);

}
function setSummary() {

    insertItemSummary(linkProblemReport, {
        id       : 'summary',
        bookmark : true,
        contents : [
            { type : 'workflow-history', className : 'surface-level-2', params : { id : 'summary-workflow-history' } },
            { type : 'details'         , className : 'surface-level-2', params : { id : 'summary-details', collapsed : true, editable : true } },
            { type : 'attachments'     , className : 'surface-level-2', params : { id : 'summary-attachments', editable : true , singleToolbar : 'controls'} },
        ],
        cloneable    : true,
        layout       : 'dashboard',
        openInPLM    : true,
        reload       : true,
        statesColors : [
            { label : 'New',         color : '#dd2222',    states : ['Create'] },
            { label : 'Analysis',    color : '#faa21b', states : ['Review', 'Technical Analysis'] },
            { label : 'Improvement', color : '#faa21b', states : ['CAPA in progress', 'Change Request in progress'] },
            { label : 'Completed',   color : '#6a9728',  states : ['Completed'] }
        ],
        workflowActions : true
    });

}
function setTabs() {

    insertItemSummary(linkProblemReport, {
        id       : 'item-tabs',
        bookmark : true,
        contents : [
            { type : 'details'         , params : { id : 'item-tab-details', collapsed : true, editable : true, toggles : true } },
            { type : 'workflow-history', params : { id : 'item-tab-workflow-history' } },
            { type : 'attachments'     , params : { id : 'item-tab-attachments', editable : true , singleToolbar : 'controls'} },
        ],
        cloneable    : true,
        layout       : 'tabs',
        hideSubtitle : false,
        openInPLM    : true,
        reload       : true,
        statesColors : [
            { label : 'New',         color : '#dd2222', states : ['Create'] },
            { label : 'Analysis',    color : '#faa21b', states : ['Review', 'Technical Analysis'] },
            { label : 'Improvement', color : '#faa21b', states : ['CAPA in progress', 'Change Request in progress'] },
            { label : 'Completed',   color : '#6a9728', states : ['Completed'] }
        ],
        workflowActions : true,
        wrapControls    : false
    });

    insertItemSummary(linkProblemReport, {
        id        : 'item-sections',
        bookmark  : true,
        contents  : [
            { type : 'details'     , params : { id : 'item-section-details', hideSections : true, sectionsIn: ['Details'], headerLabel : 'Datenblatt' } },
            { type : 'grid'        , params : { id : 'item-section-grid' } },
            { type : 'images'      , params : { id : 'item-section-images' , layout : 'row'} },
            { type : 'attachments' , params : { id : 'item-section-attachments', editable : false, tileSize : 'xs' , singleToolbar : 'controls'} },
        ],
        layout       : 'sections',
        hideSubtitle : true,
        openInPLM    : true,
        statesColors : [
            { label : 'New',         color : '#dd2222', states : ['Create'] },
            { label : 'Analysis',    color : '#faa21b', states : ['Review', 'Technical Analysis'] },
            { label : 'Improvement', color : '#faa21b', states : ['CAPA in progress', 'Change Request in progress'] },
            { label : 'Completed',   color : '#6a9728', states : ['Completed'] }
        ],
        surfaceLevel    : '3',
        workflowActions : true
    });

}      
function setLists() {

    insertBookmarks({ id : 'list-xxs', layout : 'list', tileSize : 'xxs', tileImage : true, useCache : true, headerLabel : 'layout:list, tileSize:xxs' });
    insertBookmarks({ id : 'list-xs' , layout : 'list', tileSize :  'xs', tileImage : true, useCache : true, headerLabel : 'layout:list, tileSize:xs'  });
    insertBookmarks({ id : 'list-s'  , layout : 'list', tileSize :   's', tileImage : true, useCache : true, headerLabel : 'layout:list, tileSize:s'   });
    insertBookmarks({ id : 'list-m'  , layout : 'list', tileSize :   'm', tileImage : true, useCache : true, headerLabel : 'layout:list, tileSize:m'   });
    insertBookmarks({ id : 'list-l'  , layout : 'list', tileSize :   'l', tileImage : true, useCache : true, headerLabel : 'layout:list, tileSize:l'   });
    insertBookmarks({ id : 'list-xl' , layout : 'list', tileSize :  'xl', tileImage : true, useCache : true, headerLabel : 'layout:list, tileSize:xl'  });
    insertBookmarks({ id : 'list-xxl', layout : 'list', tileSize : 'xxl', tileImage : true, useCache : true, headerLabel : 'layout:list, tileSize:xxl' });

}
function setGrids() {

    insertBookmarks({ id : 'grid-xxs', layout : 'grid', tileSize : 'xxs', tileImage : true, useCache : true, headerLabel : 'layout:grid, tileSize:xxs' });
    insertBookmarks({ id : 'grid-xs' , layout : 'grid', tileSize :  'xs', tileImage : true, useCache : true, headerLabel : 'layout:grid, tileSize:xs'  });
    insertBookmarks({ id : 'grid-s'  , layout : 'grid', tileSize :   's', tileImage : true, useCache : true, headerLabel : 'layout:grid, tileSize:s'   });
    insertBookmarks({ id : 'grid-m'  , layout : 'grid', tileSize :   'm', tileImage : true, useCache : true, headerLabel : 'layout:grid, tileSize:m'   });
    insertBookmarks({ id : 'grid-l'  , layout : 'grid', tileSize :   'l', tileImage : true, useCache : true, headerLabel : 'layout:grid, tileSize:l'   });
    insertBookmarks({ id : 'grid-xl' , layout : 'grid', tileSize :  'xl', tileImage : true, useCache : true, headerLabel : 'layout:grid, tileSize:xl'  });
    insertBookmarks({ id : 'grid-xxl', layout : 'grid', tileSize : 'xxl', tileImage : true, useCache : true, headerLabel : 'layout:grid, tileSize:xxl' });

}
function setGalleries() {

    insertBookmarks({ id : 'gallery-xxs', layout : 'gallery', tileSize : 'xxs', tileImage : true, useCache : true, headerLabel : 'layout:gallery, tileSize:xxs' });
    insertBookmarks({ id : 'gallery-xs' , layout : 'gallery', tileSize :  'xs', tileImage : true, useCache : true, headerLabel : 'layout:gallery, tileSize:xs'  });
    insertBookmarks({ id : 'gallery-s'  , layout : 'gallery', tileSize :   's', tileImage : true, useCache : true, headerLabel : 'layout:gallery, tileSize:s'   });
    insertBookmarks({ id : 'gallery-m'  , layout : 'gallery', tileSize :   'm', tileImage : true, useCache : true, headerLabel : 'layout:gallery, tileSize:m'   });
    insertBookmarks({ id : 'gallery-l'  , layout : 'gallery', tileSize :   'l', tileImage : true, useCache : true, headerLabel : 'layout:gallery, tileSize:l'   });
    insertBookmarks({ id : 'gallery-xl' , layout : 'gallery', tileSize :  'xl', tileImage : true, useCache : true, headerLabel : 'layout:gallery, tileSize:xl'  });
    insertBookmarks({ id : 'gallery-xxl', layout : 'gallery', tileSize : 'xxl', tileImage : true, useCache : true, headerLabel : 'layout:gallery, tileSize:xxl' });

}
function setRows() {

    insertBookmarks({ id : 'row-xxs', layout : 'row', tileSize : 'xxs', tileImage : true, useCache : true, headerLabel : 'layout:row, tileSize:xxs' });
    insertBookmarks({ id : 'row-xs' , layout : 'row', tileSize :  'xs', tileImage : true, useCache : true, headerLabel : 'layout:row, tileSize:xs'  });
    insertBookmarks({ id : 'row-s'  , layout : 'row', tileSize :   's', tileImage : true, useCache : true, headerLabel : 'layout:row, tileSize:s'   });
    insertBookmarks({ id : 'row-m'  , layout : 'row', tileSize :   'm', tileImage : true, useCache : true, headerLabel : 'layout:row, tileSize:m'   });
    insertBookmarks({ id : 'row-l'  , layout : 'row', tileSize :   'l', tileImage : true, useCache : true, headerLabel : 'layout:row, tileSize:l'   });
    insertBookmarks({ id : 'row-xl' , layout : 'row', tileSize :  'xl', tileImage : true, useCache : true, headerLabel : 'layout:row, tileSize:xl'  });
    insertBookmarks({ id : 'row-xxl', layout : 'row', tileSize : 'xxl', tileImage : true, useCache : true, headerLabel : 'layout:row, tileSize:xxl' });

}
function setFiles() {

    insertAttachments(linkEmberPrinter, { id : 'files-row-xxs', layout : 'row',  tileSize : 'xxs', headerLabel : 'layout:row;tileSize:xxs' });
    insertAttachments(linkEmberPrinter, { id : 'files-row-xs',  layout : 'row',  tileSize : 'xs',  headerLabel : 'layout:row;tileSize:xs'  });
    insertAttachments(linkEmberPrinter, { id : 'files-row-s',   layout : 'row',  tileSize : 's',   headerLabel : 'layout:row;tileSize:s'   });
    insertAttachments(linkEmberPrinter, { id : 'files-row-m',   layout : 'row',  tileSize : 'm',   headerLabel : 'layout:row;tileSize:m'   });
    insertAttachments(linkEmberPrinter, { id : 'files-row-l',   layout : 'row',  tileSize : 'l',   headerLabel : 'layout:row;tileSize:l'   });
    insertAttachments(linkEmberPrinter, { id : 'files-row-xl',  layout : 'row',  tileSize : 'xl',  headerLabel : 'layout:row;tileSize:xl'  });
    insertAttachments(linkEmberPrinter, { id : 'files-row-xxl', layout : 'row',  tileSize : 'xxl', headerLabel : 'layout:row;tileSize:xxl' });

    insertAttachments(linkEmberPrinter, { id : 'files-list-xxs', layout : 'list', tileSize : 'xxs', headerLabel : 'layout:list;tileSize:xxs' });
    insertAttachments(linkEmberPrinter, { id : 'files-list-xs',  layout : 'list', tileSize : 'xs',  headerLabel : 'layout:list;tileSize:xs'  });
    insertAttachments(linkEmberPrinter, { id : 'files-list-s',   layout : 'list', tileSize : 's',   headerLabel : 'layout:list;tileSize:s'   });
    insertAttachments(linkEmberPrinter, { id : 'files-list-m',   layout : 'list', tileSize : 'm',   headerLabel : 'layout:list;tileSize:m'   });
    insertAttachments(linkEmberPrinter, { id : 'files-list-l',   layout : 'list', tileSize : 'l',   headerLabel : 'layout:list;tileSize:l'   });
    insertAttachments(linkEmberPrinter, { id : 'files-list-xl',  layout : 'list', tileSize : 'xl',  headerLabel : 'layout:list;tileSize:xl'  });
    insertAttachments(linkEmberPrinter, { id : 'files-list-xxl', layout : 'list', tileSize : 'xxl', headerLabel : 'layout:list;tileSize:xxl' });

    insertAttachments(linkEmberPrinter, { id : 'files-grid-xxs', layout : 'grid', tileSize : 'xxs', headerLabel : 'layout:grid;tileSize:xxs' });
    insertAttachments(linkEmberPrinter, { id : 'files-grid-xs',  layout : 'grid', tileSize : 'xs',  headerLabel : 'layout:grid;tileSize:xs'  });
    insertAttachments(linkEmberPrinter, { id : 'files-grid-s',   layout : 'grid', tileSize : 's',   headerLabel : 'layout:grid;tileSize:s'   });
    insertAttachments(linkEmberPrinter, { id : 'files-grid-m',   layout : 'grid', tileSize : 'm',   headerLabel : 'layout:grid;tileSize:m'   });
    insertAttachments(linkEmberPrinter, { id : 'files-grid-l',   layout : 'grid', tileSize : 'l',   headerLabel : 'layout:grid;tileSize:l'   });
    insertAttachments(linkEmberPrinter, { id : 'files-grid-xl',  layout : 'grid', tileSize : 'xl',  headerLabel : 'layout:grid;tileSize:xl'  });
    insertAttachments(linkEmberPrinter, { id : 'files-grid-xxl', layout : 'grid', tileSize : 'xxl', headerLabel : 'layout:grid;tileSize:xxl' });

}
function setEdit() {

    insertDetails(linkEmberPrinter, { 
        id : 'itemedit', editable : true , layout : 'narrow', hideComputed : true, openInPLM : true,
        // sectionsIn : [ 'Basic' ],
        bookmark : true,
        toggles : true,
        collapsed: true
    });

    insertCreate(['Problem Reports', 'Change Orders', 'Change Requests'], null, { 
    // insertCreate(['Problem Reports'], { 
        id : 'itemcreate', layout : 'narrow', hideComputed : true, openInPLM : true,
        // sectionsIn : [ 'Basic' ],
        toggles : true,
        collapsed: true
    });

}



