$(document).ready(function() {

    let link = '/api/v3/workspaces/' + wsId + '/items/' + dmsId;

    setUIEvents();

    insertItemSummary(link, {
        id       : 'item',
        bookmark : true,
        contents : [
            { 
                type      : 'details', 
                className : 'surface-level-1', 
                params : { 
                    id        : 'item-details', 
                    collapsed : true, 
                    editable  : true,
                    toggles   : true,
                    expanded  : ['Basic'],
                    fieldsEx  : ['ACTIONS']
                } 
            },{ 
                type      : 'attachments', 
                className : 'surface-level-1', 
                params : { 
                    id                  : 'item-attachments',
                    editable            : true,
                    includeVaultFiles   : true,
                    layout              : 'list',
                    search              : true,
                    filterByType        : true,
                    singleToolbar       : 'controls',
                    contentSize         : 'm'
                } 
            },{ 
                type      : 'bom', 
                className : 'surface-level-1', 
                params : { 
                    bomViewName    : 'Basic',
                    collapsed      : true,
                    id             : 'item-bom',
                    search         : true,
                    toggles        : true,
                    onLoadComplete : function(id) { genPLMItemsAddinActions(id); }
                } 
            },{ 
                type      : 'change-processes', 
                className : 'surface-level-1', 
                params : { 
                    id     : 'item-change-processes',
                    search : true
                } 
            }
        ],
        layout     : 'tabs',
        openInPLM  : true,
        reload     : true,
    });    

});

function setUIEvents() {}