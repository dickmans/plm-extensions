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
            type   : 'parents', 
            params : { 
                id                : 'parents',
                headerLabel       : 'Parents',
                search            : true,
                openInPLM         : true,
                displayParentsBOM : true,
                afterCompletion   : function(id) { afterParentsCompletion(id); },
                afterParentBOMCompletion   : function(id) { afterParentBOMCompletion(id); }
            }
        },{ 
            type   : 'root-parents', 
            params : { 
                id              : 'root-parents', 
                headerLabel     : 'Root Parents',
                afterCompletion : function(id) { afterRootParentsCompletion(id); }
            } 
        },{ 
            type   : 'relationships', 
            params : { 
                id                : 'relationships',
                headerLabel       : 'Relationships',
                openInPLM         : true,
                filterByWorkspace : true,
            }
        }]
    }); 

});


function setUIEvents() {}


// Add Addin actions to the view contents
function afterParentsCompletion(id) {

    genAddinTilesActions($('#' + id + '-content'));

}
function afterParentBOMCompletion(id) {

    genAddinPLMBOMActions(id);

}
function afterRootParentsCompletion(id) {

    let elemContent = $('#' + id + '-content');

    elemContent.find('.roots-parent-path').each(function() {

        let elemPath = $(this);

        elemPath.parent().addClass('plm-item');

        let elemActions = $('<div></div>').appendTo(elemPath).addClass('path-actions');

        genAddinPLMItemTileActions(elemActions);

    });

}