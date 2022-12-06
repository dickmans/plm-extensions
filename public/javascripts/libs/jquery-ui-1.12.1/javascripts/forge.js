// Forge Viewer
function initViewer(data) {
    
    // console.log(" > initViewer START");

    if(typeof data === undefined) return;
    else if(data === "") return;
        
    $("#viewer-message").hide();
    $("#viewer").show();
    $("#viewer-progress").hide();

    var options = {
        env: 'AutodeskProduction',
        api: 'derivativeV2',  // for models uploaded to EMEA change this option to 'derivativeV2_EU'
        getAccessToken: function(onTokenReady) {
            var token = data.token;
            var timeInSeconds = 3600; // Use value provided by Forge Authentication (OAuth) API
            onTokenReady(token, timeInSeconds);
        }
    };

    Autodesk.Viewing.Initializer(options, function() {

        var htmlDiv = document.getElementById('viewer');
        viewer = new Autodesk.Viewing.GuiViewer3D(htmlDiv);
        viewer.addEventListener(Autodesk.Viewing.VIEWER_STATE_RESTORED_EVENT, onViewerRestore);
        var startedCode = viewer.start();
        if (startedCode > 0) {
            console.error('Failed to create a Viewer: WebGL not supported.');
            return;
        }

        Autodesk.Viewing.Document.load('urn:'+ data.urn, onDocumentLoadSuccess, onDocumentLoadFailure);

    });
    
}
function onDocumentLoadSuccess(doc) {

    // viewer.setBackgroundColor(240, 240, 240, 240, 240, 240);
    // viewer.setBackgroundColor(255,255,255,255,255,255);
    viewer.setGhosting(true);
    viewer.setGroundShadow(false);
    viewer.setGroundReflection(false);
    viewer.setProgressiveRendering(true);

    var viewable = doc.getRoot().getDefaultGeometry();

    if (viewable) {
        viewer.loadDocumentNode(doc, viewable).then(function(result) {
             viewer.setBackgroundColor(255, 255, 255, 255, 255, 255);
            // viewer.setBackgroundColor(244, 244, 244, 244, 244, 244);
            // console.log('Viewable Loaded!');
            //setViewerToolbar();
        }).catch(function(err) {
            // console.log('Viewable failed to load.');
            console.log(err);
        });
    }
}
function onDocumentLoadFailure() {
    console.error('Failed fetching Forge manifest');
}

function onViewerRestore(event) {
     
    markup.unloadMarkupsAllLayers();
    
    if(markupsvg !== "") {
        markup.show();
        markup.loadMarkups(markupsvg, "review");
        
    }
    
}