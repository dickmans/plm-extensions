let wsIdTasks       = null;
let sectionId       = null;
let selectedWSID    = null;
let selectedDMSID   = null;

let viewer, markup, markupsvg, curViewerState;

var selectDefaults = true;

let isiPad   = navigator.userAgent.match(/iPad/i)   != null;
let isiPhone = navigator.userAgent.match(/iPhone/i) != null;


$(document).ready(function() {  
    
    $.get( '/plm/hubs', {}, function(hubs) {
        
        console.log(hubs);

        for(hub of hubs) {

            if(hub.attributes.name === "Team EE") {
                getProjects(hub.id);
            }

        }

    });
    
});



function getProjects(id) {

    console.log(' > getProjects START');
    console.log('   id = ' + id);

    $.get( '/plm/projects', { 'hub' : id }, function(projects) {
        
        
        console.log(projects);

        for(project of projects) {

            if(project.attributes.name === "Testing") {
                getProjectDetails(project.links.self.href);
            }

        }

        

    });

}

function getProjectDetails(link) {

    console.log(' > getProjectDetails START');
    console.log('   link = ' + link);

    $.get( '/plm/project', { 'link' : link }, function(data) {
        
        console.log(" getProjectDetailsData:");
        console.log(data);        

    });

}