
$(document).ready(function() {

    setUIEvents();

    let workspaceId = config.addins.project.workspaceId;

    insertResults(workspaceId, [{
        field       : 'WF_CURRENT_STATE',       
        type        : 1,
        comparator  : 5,
        value       : config.addins.project.stateCompleted
    }], {
        id          : 'projects',
        headerLabel : config.addins.project.headerLabelProjects,
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
            link   : config.addins.project.fieldIdBOM,
            params : { 
                id               : 'project-bom',
                headerLabel      : config.addins.project.tabNameBOM,
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
                headerLabel     : config.addins.project.tabNameDetails,
                sectionsEx      : config.addins.project.projectDetailsSectionsEx,
                fieldsEx        : ['TIMELINE'],
                expandSections  : config.addins.project.projectDetailsExpandSections, 
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