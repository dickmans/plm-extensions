
$(document).ready(function() {


    setUIEvents();

    let requests = [ $.get('/plm/descriptor', { link : urlParameters.link}) ];

    getFeatureSettings('passports', requests, function(responses) {

        $('#header-subtitle').html(responses[0].data);



        let paramsDetails = {
            sectionsEx : [ 'Header'],
            toggles : true
        }

        paramsDetails.id = 'details';

        let paramsViewer = {

            features : {
                contextMenu   : false,
                cube          : false,
                orbit         : false,
                firstPerson   : false,
                camera        : false,
                measure       : true,
                section       : false,
                explodedView  : true,
                modelBrowser  : false,
                properties    : false,
                settings      : false,
                fullscreen    : false,
                markup        : false,
                hide          : false,
                ghosting      : false,
                highlight     : false,
                single        : false,
                fitToView     : false,
                reset         : false,
                views         : true,
                selectFile    : false
            }
            
        }

        paramsViewer.id = 'viewer';

        let paramsAttachments = {
            contentSize : 'l',
            layout : 'row',
            headerLabel : 'Files',
            extensionsEx:  [ "dwf"    ],

        }

        paramsAttachments.id = 'files';

        insertDetails(urlParameters.link, paramsDetails);
        insertViewer(urlParameters.link, paramsViewer);
        insertAttachments(urlParameters.link, paramsAttachments);

    });


});


// Set UI controls
function setUIEvents() {

}