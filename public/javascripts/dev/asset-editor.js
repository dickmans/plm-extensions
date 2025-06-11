let urlParameters = getURLParameters();
let links = {};


$(document).ready(function() {

    setUIEvents();

    $.get('/plm/details', { link : urlParameters.link}, function(response) {

        links.ebom = getSectionFieldValue(response.data.sections, 'EBOM', '', 'link');

        insertBOM(links.ebom, {
            search : true,
            path : true,
            counters : true,
            viewerSelection : true,
            onClickItem : function(elemClicked) { console.log('Selected item : ' + elemClicked.attr('data-link')); }
        });

        insertViewer(links.ebom);

    });

});


// Set UI controls
function setUIEvents() {}