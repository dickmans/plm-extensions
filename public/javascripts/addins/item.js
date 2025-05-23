let urlParameters = getURLParameters();

$(document).ready(function() {

    setUIEvents();

    insertItemSummary(urlParameters.link, {
        id         : 'item',
        bookmark   : true,
        layout     : 'tabs',
        openInPLM  : true,
        reload     : true,
        contents   : [{ 
            type   : 'details', 
            params : { 
                id              : 'item-details', 
                collapsed       : true, 
                editable        : true,
                toggles         : true,
                expandSections  : config.addins.item.expandSections,
                sectionsEx      : config.addins.item.sectionsEx,
                fieldsEx        : config.addins.item.fieldsEx
            } 
        },{ 
            type   : 'attachments', 
            params : { 
                id                  : 'item-attachments',
                editable            : true,
                includeVaultFiles   : true,
                layout              : 'list',
                search              : false,
                filterByType        : true,
                singleToolbar       : 'controls',
                contentSize         : 'm'
            } 
        },{ 
            type   : 'bom', 
            params : { 
                id               : 'item-bom',
                bomViewName      : 'Basic',
                collapseContents : true,
                contentSize      : 'xs',
                counters         : true,
                openInPLM        : true,
                path             : true,
                search           : true,
                toggles          : true,
                afterCompletion  : function(id) { genAddinPLMBOMActions(id); }
            } 
        },{ 
            type   : 'change-processes', 
            params : { 
                id       : 'item-change-processes',
                editable : false,
                search   : true
            } 
        }],

    });    

});

function setUIEvents() {}