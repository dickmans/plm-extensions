
$(document).ready(function() {

    setUIEvents();

    insertResults('213', [{
        field       : 'WF_CURRENT_STATE',       
        type        : 1,
        comparator  : 5,
        value       : 'Completed'
    }], {
        id          : 'projects',
        headerLabel : 'Engineering Projects',
        reload      : true,
        search      : true,
        layout      : 'list',
        contentSize : 'm',
        onClickItem : function(elemClicked) { openProject(elemClicked); }
    });

});

function setUIEvents() {}


function openProject(elemClicked) {

    let link = elemClicked.attr('data-link');

    insertItemSummary(link, {
        id              : 'project',
        layout          : 'tabs',
        openInPLM       : true,
        reload          : true,
        toggleBodyClass : 'display-project',
        contents        : [{ 
            type   : 'bom', 
            link   : 'DELIVERABLE_4',
            params : { 
                id               : 'project-bom',
                headerLabel      : 'BOM',
                collapseContents : true,
                search           : true,
                toggles          : true,
                afterCompletion  : function(id) { genAddinPLMBOMActions(id); }
            } 
        },{ 
            type   : 'attachments', 
            params : { 
                id                  : 'project-attachments',
                editable            : true,
                layout              : 'list',
                filterByType        : true,
                singleToolbar       : 'controls',
                includeRelatedFiles : true,
                contentSize         : 'm'
            } 
        },{ 
            type   : 'details', 
            params : { 
                id              : 'project-details', 
                hideHeader      : true,
                headerLabel     : 'Details',
                sectionsEx      : ['Project Schedule', 'Closure'],
                fieldsEx        : ['TIMELINE'],
                expandSections  : ['Task Details', 'Header', 'Details'], 
                editable        : false
            } 

        }],
        statesColors : [
            { label : 'Planning',    color : '#ffa600', states : ['Planning'] },
            { label : 'Approval',    color : '#ffa600', states : ['Approval'] },
            { label : 'In Work',     color : '#ee4444', states : ['In Work']  },
            { label : 'Completed',   color : '#8fc844', states : ['Completed', 'Capture Lessons Learned'] }
        ]
    });  

}