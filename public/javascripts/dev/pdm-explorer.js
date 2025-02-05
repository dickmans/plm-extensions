// let maxRequests         = 5;
// let urns                = { 'partNumber' : '' }
// let now                 = new Date();
// let bomItems            = [];
// let editableFields      = [];
// let indexSelected       = -1;
// let multiSelect         = { 'wsId' : '', 'links' : [], 'common': [], 'varies' : [], 'partNumbers': [] };
// let wsItems             = { 'id' : wsId, 'sections' : [], 'fields' : [], 'viewId' : '' };
// let wsProblemReports    = { 'id' : ''  , 'sections' : [], 'fields' : [] };
// let wsSupplierPackages  = { 'id' : ''  , 'sections' : [], 'fields' : [] };


// let link;
// let bomKPIData = [];
let treeItems  = [];

// /AutodeskDM/Services/api/vault/v2/vaults/101/file-versions/62032

// let paramsAttachments = { 
//     'size'          : 's', 
//     'upload'        : true, 
//     'extensionsEx'  : '.dwf,.dwfx' 
// }
// let paramsProcesses = { 
//     'headerLabel'    : 'Change Processes', 
//     'createWSID'     : '' ,
//     'fieldIdMarkup'  : ''
// }
// let context = {}
 

$(document).ready(function() {

    // let vaultId = '101';

    console.log(vaultId);
    
    let link = '/AutodeskDM/Services/api/vault/v2/vaults/' + vaultId + '/file-versions/' + fileId;

    // 62032 root
    // 61988 sub
    //120028

    $.get('/vault/token', { fileId : fileId }, function(response) {
    // $.get('/vault/viewing-file', { fileId : fileId }, function(response) {
        console.log(response);
        insertPDMViewer(response, fileId);
    });



    //     appendViewerProcessing();
    //     appendOverlay(false);
    // insertKPIsPanel();
    // setHeaderTitle(link);
    // insertPDMFileProperties(link);
    // insertFileBOM(link, {
    //     expandLimit : 500,
    //     expandFull  : true,
    //     hideDetails : false,
    //     columns     : ['Version', 'Category Name', 'Has Markup', 'Lifecycle Definition', 'Material']
    // });
    // // insertViewer('/api/v3/workspaces/57/items/14552');
    // // insertPDMViewerLocal(link);
    // // insertPDMViewerStream(link);
    // insertPDMViewerEXP(link);
    // // insertPDMViewerTC(link);

    // $.get('/vault/property-definitions', { vaultId : vaultId }, function(response)  {
    //     console.log(response);
    // });



//     getApplicationFeatures('explorer', [], function(responses) {

//         getInitialData(function() {

//             $('#overlay').hide();
//             $('body').removeClass('screen-startup');

//             if(!isBlank(dmsId)) {
//                 openItem(link);
//             } else {
//                 $('body').addClass('screen-landing');
//             }
//         });

//     });

    setUIEvents();

});

function insertPDMViewer(data, fileId) {

    console.log(fileId);

    var options = {
        env: 'AutodeskProduction',
        // Refer to the notes below for the usage of accessToken and getAccessToken.
        getAccessToken: function(onGetAccessToken) {
            var accessToken = data.token; // Replace with your access token
            var expireTimeSeconds = 3600;
            onGetAccessToken(accessToken, expireTimeSeconds);
        },
        accessToken: data.token
    };

    Autodesk.Viewing.Initializer(options, function() {
        var viewerDiv = document.getElementById('viewer');
        viewer = new Autodesk.Viewing.GuiViewer3D(viewerDiv);
        var startedCode = viewer.start();
        if (startedCode > 0) {
            console.error('Failed to create a Viewer: WebGL not supported.');
            return;
        }
        console.log('Initialization complete, loading a document.');
        loadDocument(data, fileId);
    });
    
}
function loadDocument(data, fileId) {
    // var documentUrl = '/file-version/{id}/content'; // For PDF files
    // or
    // var documentUrl = '/file-version/{id}/svf/bubble.json'; // For DWF/DWFX files
    var documentUrl = '/file-version/' + fileId + '/svf/bubble.json'; // For DWF/DWFX files

    var documentUrl = data.link;

    console.log(documentUrl);

    Autodesk.Viewing.Document.load(documentUrl, function(doc) {
        console.log(doc);
        var items = doc.getRoot().search({'type':'geometry'});
        if (items.length === 0) {
            console.error('Document contains no viewables.');
            return;
        }
        console.log('5');
        viewer.loadDocumentNode(doc, items[0]);
    }, function(errorMsg) {
        console.error('Loading document failed: ' + errorMsg);
    // }, {
    //     /*
    //     1) This additional option allows you to override the access token for a specific document retrieved from another system.
    //     2) The accessToken provided in Autodesk.Viewing.Initializer(options) will be ignored
    //     */
    //     headers: {
    //         'Authorization': 'Bearer ' + data.token // Pass the access token in the request header
    //     }
    });
}


// Interactive controls
function setUIEvents() {

    $('#button-toggle-kpis').click(function() {
        $('body').toggleClass('no-kpis');
        $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
        viewerResize();
    });

    $('#button-toggle-properties').click(function() {
        $('body').toggleClass('no-properties');
        $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
        viewerResize();
    });

}



// Get file data to set header title
function setHeaderTitle(link) {

    $.get('/vault/file-properties', {link : link}, function(response) {
        $('#header-subtitle').html(response.data.name);
    });  

}


function insertPDMViewerLocal(link) {

    // const MODEL_URL = 'https://petrbroz.s3-us-west-1.amazonaws.com/svf-samples/sports-car/0.svf';
    
    // Autodesk.Viewing.Initializer({ env : 'Local' }, async function () {
    //     const viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('viewer'));
    //     viewer.start(MODEL_URL);
    // });

}
function insertPDMViewerStream(link) {

    const MODEL_URL = 'http://localhost:8080/vault/viewable/101/104313/0.svf';


    // Autodesk.Viewing.Initializer({ env : 'Local' }, async function () {
    //     const viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('viewer'));
    //     // viewer.start(MODEL_URL);
    //     viewer.start();
    //     viewer.loadModel(MODEL_URL);

    //         // Autodesk.Viewing.Document.load(MODEL_URL, onDocumentLoadSuccess, onDocumentLoadFailure);
    // });


let options = {};


var htmlDiv = document.getElementById('viewer');

viewer = new Autodesk.Viewing.Private.GuiViewer3D(htmlDiv);


    Autodesk.Viewing.Initializer(
            options, () => {
                // Tslint:disable-next-line:no-console
                console.log('Forge Viewer has finished initializing.')
        
                viewer.start()
            //   this.viewer.impl.setFPSTargets(1, 5, 15) // Fix for progressive rendering
                // set the viewr to dark theme (Grey Room: 3)
            //   this.viewer.setLightPreset(savedSettings.lightPreset)
            //   this.viewer.setGhosting(savedSettings.ghosting)
            //   this.viewer.hideLines(!savedSettings.lineRendering)
            //   if(this.props.urn.toLowerCase().includes('bubble.json')) {
                // Adds a URL parameter that will be used in all data load requests.
            // const resourceUrl = new URL(url)
            //         resourceUrl.searchParams.forEach((val, key) => {
            //         Autodesk.Viewing.endpoint.addQueryParam(key, val)
            //         });


                    // console.log(resourceUrl);

                // if urn contains bubble.json we should use different APi
                // Autodesk.Viewing.Document.load(resourceUrl.origin + resourceUrl.pathname, (viewerDocument) => {
                Autodesk.Viewing.Document.load(MODEL_URL, (viewerDocument) => {
                    const defaultModel = viewerDocument.getRoot().getDefaultGeometry()
                    this.viewer.loadDocumentNode(viewerDocument, defaultModel)
                }, (errorCode) => {
                    console.error('Unable to load document in LMV Viewer. ErrorCode: ' + errorCode)
                })
            //   } else{
                // for PDF, we need to load model directly
                // this.viewer.loadModel(this.props.urn, {})
            //   }
            //   this.start = new Date().getTime()
        
                // hook to MODEL Loaded event listener
            //   this.viewer.addEventListener(Autodesk.Viewing.MODEL_LAYERS_LOADED_EVENT, this.modalLoadEventHandler)
            //   this.viewer.addEventListener(Autodesk.Viewing.PREF_CHANGED_EVENT, this.prefChangedEventHandler)
            })            

        

}
function insertPDMViewerEXP(link) {

    console.log('insertPDMViewerEXP START');

    $.get('/vault/session', { link : link }, function(response) {
            
        console.log(response);
        console.log(link);

        var viewerApp;
        var options = {
            env: 'AutodeskProduction',
            useADP: false,
            accessToken: response.data.token, // remove scheme and get only token
            useCredentials: true,
        };
        // var documentId = '/AutodeskDM/Services/api/vault/v2/vaults/1/file-versions/9496/svf/bubble.json';
        let linkFile = 'https://e475f532.vg.autodesk.com/svf/bubble.json';
        console.log(linkFile);
        Autodesk.Viewing.Initializer(options, function onInitialized(){
            // viewerApp = new Autodesk.Viewing.ViewingApplication('viewer');
            viewerApp = new Autodesk.Viewing.GuiViewer3D(document.getElementById('viewer'));
            // viewerApp.registerViewer(viewerApp.k3D, Autodesk.Viewing.Private.GuiViewer3D);
            // viewerApp.loadDocument(linkFile, onDocumentLoadSuccess, onDocumentLoadFailure);
            Autodesk.Viewing.Document.load(linkFile, onDocumentLoadSuccess, onDocumentLoadFailure);
        });

        function onDocumentLoadSuccess(doc) {

            // We could still make use of Document.getSubItemsWithProperties()
            // However, when using a ViewingApplication, we have access to the **bubble** attribute,
            // which references the root node of a graph that wraps each object from the Manifest JSON.
            var viewables = viewerApp.bubble.search({'type':'geometry'});
            if (viewables.length === 0) {
                console.error('Document contains no viewables.');
                return;
            }

            // Choose any of the avialble viewables
            viewerApp.selectItem(viewables[0].data, onItemLoadSuccess, onItemLoadFail);
        }

        function onDocumentLoadFailure(viewerErrorCode) {
            console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
        }

        function onItemLoadSuccess(viewer, item) {
            console.log('onItemLoadSuccess()!');
            console.log(viewer);
            console.log(item);

            // Congratulations! The viewer is now ready to be used.
            console.log('Viewers are equal: ' + (viewer === viewerApp.getCurrentViewer()));
        }

        function onItemLoadFail(errorCode) {
            console.error('onItemLoadFail() - errorCode:' + errorCode);
        }
    });

}
function insertPDMViewerTC(link) {

    $.get('/vault/session', { link : link }, function(response) {
            
        console.log(response);


        const options = {
            // config3d,
            // Env: 'AutodeskProduction',
            // GetAccessToken: this.props.onTokenRequest,
        env: 'AutodeskProduction', // inorder to pass accesstoken the env shouldnot be local
        // useADP: false,
        accessToken: response.data.token, // remove scheme and get only token
        // useCredentials: true, // if accesstoken needs to be passed for each request set to true. For decals, this is needed
        // useCookie: false,
        // productId: 'Autodesk_Vault_Thin_Client'
    }


    // const options = {
    //     env: 'AutodeskProduction', 
    //     accessToken: response.data.token,
    // }

        $.get('/vault/file-visualization-attachment', { link : link }, function(response) {
                
            console.log(response);

            let linkatt =  response.data.url;

            $.get('/vault/viewable', { link : linkatt}, function(response) {
                
                console.log(response);
                console.log(options);

                var htmlDiv = document.getElementById('viewer');

                viewer = new Autodesk.Viewing.Private.GuiViewer3D(htmlDiv, { 
                            modelBrowserExcludeRoot     : false,
                            modelBrowserStartCollapsed  : true
                        });


                        let url = 'https://e475f532.vg.autodesk.com' + link + '/svf/bubble.json?allowSync=true&ext=.dwfx'

                        console.log(url);

                        Autodesk.Viewing.Initializer(options, function() {

                            var htmlDiv = document.getElementById('viewer');
                            viewer = new Autodesk.Viewing.Private.GuiViewer3D(htmlDiv, { 
                                modelBrowserExcludeRoot     : false,
                                modelBrowserStartCollapsed  : true
                            });
                
 
                
                            var startedCode = viewer.start();
                            if (startedCode > 0) {
                                console.error('Failed to create a Viewer: WebGL not supported.');
                                return;
                            }
                
                            let url = 'https://e475f532.vg.autodesk.com' + link + '/svf/bubble.json?allowSync=true&ext=.dwfx'

                            Autodesk.Viewing.Document.load(url, onDocumentLoadSuccess, onDocumentLoadFailure);
                            
                        });



                        // Autodesk.Viewing.Initializer(
                        //     options, () => {
                        //         // Tslint:disable-next-line:no-console
                        //         console.log('Forge Viewer has finished initializing.')
                        
                        //         viewer.start()
                        //     //   this.viewer.impl.setFPSTargets(1, 5, 15) // Fix for progressive rendering
                        //         // set the viewr to dark theme (Grey Room: 3)
                        //     //   this.viewer.setLightPreset(savedSettings.lightPreset)
                        //     //   this.viewer.setGhosting(savedSettings.ghosting)
                        //     //   this.viewer.hideLines(!savedSettings.lineRendering)
                        //     //   if(this.props.urn.toLowerCase().includes('bubble.json')) {
                        //         // Adds a URL parameter that will be used in all data load requests.
                        //     // const resourceUrl = new URL(url)
                        //     //         resourceUrl.searchParams.forEach((val, key) => {
                        //     //         Autodesk.Viewing.endpoint.addQueryParam(key, val)
                        //     //         });


                        //             // console.log(resourceUrl);

                        //         // if urn contains bubble.json we should use different APi
                        //         // Autodesk.Viewing.Document.load(resourceUrl.origin + resourceUrl.pathname, (viewerDocument) => {
                        //         Autodesk.Viewing.Document.load(url, (viewerDocument) => {
                        //             const defaultModel = viewerDocument.getRoot().getDefaultGeometry()
                        //             this.viewer.loadDocumentNode(viewerDocument, defaultModel)
                        //         }, (errorCode) => {
                        //             console.error('Unable to load document in LMV Viewer. ErrorCode: ' + errorCode)
                        //         })
                        //     //   } else{
                        //         // for PDF, we need to load model directly
                        //         // this.viewer.loadModel(this.props.urn, {})
                        //     //   }
                        //     //   this.start = new Date().getTime()
                        
                        //         // hook to MODEL Loaded event listener
                        //     //   this.viewer.addEventListener(Autodesk.Viewing.MODEL_LAYERS_LOADED_EVENT, this.modalLoadEventHandler)
                        //     //   this.viewer.addEventListener(Autodesk.Viewing.PREF_CHANGED_EVENT, this.prefChangedEventHandler)
                        //     })                        


            });

        });

    });

    // $.get('/vault/viewable', { link : link }, function(response) {
    //         console.log(response);

    // });


    
    //         const MODEL_URL = 'https://petrbroz.s3-us-west-1.amazonaws.com/svf-samples/sports-car/0.svf';
    // //         const MODEL_URL = 'http://localhost:8080/vault/viewable/101/38851/0.svf';
    
    // // //     const MODEL_URL = $.get('/vault/file-viewable', { link : link });

    // const MODEL_URL = 'http://localhost:8080/cache/seat.svf';




    // $.get('/vault/session', { link : link }, function(response) {
    //     console.log(response);
    //     var htmlDiv = document.getElementById('viewer');

    //     const options = {
    //         // config3d,
    //         // Env: 'AutodeskProduction',
    //         // GetAccessToken: this.props.onTokenRequest,
    //         env: 'AutodeskProduction', // inorder to pass accesstoken the env shouldnot be local
    //         useADP: false,
    //         accessToken: response.data.token, // remove scheme and get only token
    //         useCredentials: true, // if accesstoken needs to be passed for each request set to true. For decals, this is needed
    //         useCookie: false,
    //         productId: 'Autodesk_Vault_Thin_Client'
    //       }


    //       console.log('1');

    //     viewer = new Autodesk.Viewing.Private.GuiViewer3D(htmlDiv, { 
    //         modelBrowserExcludeRoot     : false,
    //         modelBrowserStartCollapsed  : true
    //     });

    //     console.log('2');

    //       Autodesk.Viewing.Initializer(
    //         options, () => {
    //           // Tslint:disable-next-line:no-console
    //           console.log('Forge Viewer has finished initializing.')
      
    //           viewer.start()
    //         //   this.viewer.impl.setFPSTargets(1, 5, 15) // Fix for progressive rendering
    //           // set the viewr to dark theme (Grey Room: 3)
    //         //   this.viewer.setLightPreset(savedSettings.lightPreset)
    //         //   this.viewer.setGhosting(savedSettings.ghosting)
    //         //   this.viewer.hideLines(!savedSettings.lineRendering)
    //         //   if(this.props.urn.toLowerCase().includes('bubble.json')) {
    //             // Adds a URL parameter that will be used in all data load requests.
    //         const resourceUrl = new URL('https://e475f532.vg.autodesk.com' + link)
    //                 resourceUrl.searchParams.forEach((val, key) => {
    //                 Autodesk.Viewing.endpoint.addQueryParam(key, val)
    //                 });
    //             // if urn contains bubble.json we should use different APi
    //             Autodesk.Viewing.Document.load(resourceUrl.origin + resourceUrl.pathname, (viewerDocument) => {
    //               const defaultModel = viewerDocument.getRoot().getDefaultGeometry()
    //               this.viewer.loadDocumentNode(viewerDocument, defaultModel)
    //             }, (errorCode) => {
    //               console.error('Unable to load document in LMV Viewer. ErrorCode: ' + errorCode)
    //             })
    //         //   } else{
    //             // for PDF, we need to load model directly
    //             // this.viewer.loadModel(this.props.urn, {})
    //         //   }
    //         //   this.start = new Date().getTime()
      
    //           // hook to MODEL Loaded event listener
    //         //   this.viewer.addEventListener(Autodesk.Viewing.MODEL_LAYERS_LOADED_EVENT, this.modalLoadEventHandler)
    //         //   this.viewer.addEventListener(Autodesk.Viewing.PREF_CHANGED_EVENT, this.prefChangedEventHandler)
    //         })




    // });


//     $.get('http://localhost:8080/vault/viewable/101/38851/1.svf', function(response) {
//         console.log(response);
//     });

//     // $.get('/vault/file-viewable', { link : link }, function(response) {
//     //     console.log(response);
    

//     // });

//     let id = 'viewer';


//     let options = {
//         // logLevel    : 1,
//         env         : 'AutodeskProduction',
//         useCredentials: true
//         // api         : 'derivativeV2',  // for models uploaded to EMEA change this option to 'derivativeV2_EU'
//         // // env: 'AutodeskProduction2',
//         // // api: 'streamingV2',   // for models uploaded to EMEA change this option to 'streamingV2_EU'
//         // getAccessToken  : function(onTokenReady) {
//         //     var token = viewables[0].token;
//         //     var timeInSeconds = 3600; 
//         //     onTokenReady(token, timeInSeconds);
//         // }
//     }; // see https://aps.autodesk.com/en/docs/viewer/v7/reference/globals/TypeDefs/InitOptions/


// http://localhost:8080/cache/1.svf
//         const MODEL_URL = 'https://petrbroz.s3-us-west-1.amazonaws.com/svf-samples/sports-car/0.svf';
// //         const MODEL_URL = 'http://localhost:8080/vault/viewable/101/38851/0.svf';

// // //     const MODEL_URL = $.get('/vault/file-viewable', { link : link });

//     Autodesk.Viewing.Initializer({ env : 'Local' }, async function () {
//         const viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('viewer'));
//         // viewer.start(MODEL_URL);
//         viewer.start();
//          viewer.loadModel(MODEL_URL);
//     });



    // Autodesk.Viewing.Initializer({ env : 'Local' }, async function() {

    //     console.log('Forge Viewer has finished initializing.')

    //     var htmlDiv = document.getElementById(id);
    //     viewer = new Autodesk.Viewing.Private.GuiViewer3D(htmlDiv, { 
    //         modelBrowserExcludeRoot     : false,
    //         modelBrowserStartCollapsed  : true
    //     });


    //     console.log('2');

    //     // viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, onViewerToolbarCreated);
    //     // viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, onViewerGeometryLoaded);
    //     // viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, onViewerSelectionChanged);
    //     // viewer.addEventListener(Autodesk.Viewing.VIEWER_STATE_RESTORED_EVENT, onViewerRestore);

    //     var startedCode = viewer.start();
    //     if (startedCode > 0) {
    //         console.error('Failed to create a Viewer: WebGL not supported.');
    //         return;
    //     }

    //     console.log('3');
    //     console.log(link);

    //     // const resourceUrl = new URL('https://e475f532.vg.autodesk.com' + link)
    //     // resourceUrl.searchParams.forEach((val, key) => {
    //     //   Autodesk.Viewing.endpoint.addQueryParam(key, val)
    //     // });

    //     console.log('4');
    //     // console.log(resourceUrl);








    //     // Autodesk.Viewing.Document.load('urn:'+ viewables[0].urn, onDocumentLoadSuccess, onDocumentLoadFailure);

    //     Autodesk.Viewing.Document.load(resourceUrl.origin + resourceUrl.pathname, (viewerDocument) => {
    //         const defaultModel = viewerDocument.getRoot().getDefaultGeometry()
    //         this.viewer.loadDocumentNode(viewerDocument, defaultModel)
    //       }, (errorCode) => {
    //         console.error('Unable to load document in LMV Viewer. ErrorCode: ' + errorCode)
    //       });


        
    // });



//     const MODEL_URL = $.get('/vault/file-viewable', { link : link });

//     Autodesk.Viewing.Initializer({ env : 'Local' }, async function () {
//         const viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('viewer'));
//         viewer.start(MODEL_URL);
// //          viewer.loadModel(MODEL_URL);
//     });


    // Autodesk.Viewing.Initializer(options, function() {

    //     console.log('Forge Viewer has finished initializing.')

    //     var htmlDiv = document.getElementById(id);
    //     viewer = new Autodesk.Viewing.Private.GuiViewer3D(htmlDiv, { 
    //         modelBrowserExcludeRoot     : false,
    //         modelBrowserStartCollapsed  : true
    //     });


    //     console.log('2');

    //     // viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, onViewerToolbarCreated);
    //     // viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, onViewerGeometryLoaded);
    //     // viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, onViewerSelectionChanged);
    //     // viewer.addEventListener(Autodesk.Viewing.VIEWER_STATE_RESTORED_EVENT, onViewerRestore);

    //     var startedCode = viewer.start();
    //     if (startedCode > 0) {
    //         console.error('Failed to create a Viewer: WebGL not supported.');
    //         return;
    //     }

    //     console.log('3');
    //     console.log(link);

    //     const resourceUrl = new URL('https://e475f532.vg.autodesk.com' + link)
    //     resourceUrl.searchParams.forEach((val, key) => {
    //       Autodesk.Viewing.endpoint.addQueryParam(key, val)
    //     });

    //     console.log('4');
    //     console.log(resourceUrl);








    //     // Autodesk.Viewing.Document.load('urn:'+ viewables[0].urn, onDocumentLoadSuccess, onDocumentLoadFailure);

    //     // Autodesk.Viewing.Document.load(resourceUrl.origin + resourceUrl.pathname, (viewerDocument) => {
    //     //     const defaultModel = viewerDocument.getRoot().getDefaultGeometry()
    //     //     this.viewer.loadDocumentNode(viewerDocument, defaultModel)
    //     //   }, (errorCode) => {
    //     //     console.error('Unable to load document in LMV Viewer. ErrorCode: ' + errorCode)
    //     //   });


        
    // });


    // var options = {
    //         // logLevel    : 1,
    //     env         : 'AutodeskProduction',
    //     api         : 'derivativeV2',  // for models uploaded to EMEA change this option to 'derivativeV2_EU'
    //         // env: 'AutodeskProduction2',
    //         // api: 'streamingV2',   // for models uploaded to EMEA change this option to 'streamingV2_EU'
    //     getAccessToken  : function(onTokenReady) {
    //         var token = viewables[0].token;
    //         var timeInSeconds = 3600; 
    //             onTokenReady(token, timeInSeconds);
    //     }
    // }; // see https://aps.autodesk.com/en/docs/viewer/v7/reference/globals/TypeDefs/InitOptions/
    
    // if(typeof viewer === 'undefined') { 
    
            // splitPartNumberBy      = (isBlank(config.viewer.splitPartNumberBy))      ? ''  : config.viewer.splitPartNumberBy;
            // splitPartNumberIndexes = (isBlank(config.viewer.splitPartNumberIndexes)) ? [0] : config.viewer.splitPartNumberIndexes;
            // splitPartNumberSpacer  = (isBlank(config.viewer.splitPartNumberSpacer))  ? ''  : config.viewer.splitPartNumberSpacer;
    
        // Autodesk.Viewing.Initializer(options, function() {
        //     var htmlDiv = document.getElementById(id);
        //     viewer = new Autodesk.Viewing.Private.GuiViewer3D(htmlDiv, { 
        //         modelBrowserExcludeRoot     : false,
        //         modelBrowserStartCollapsed  : true
        //     });
    
        //         // viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, onViewerToolbarCreated);
        //         // viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, onViewerGeometryLoaded);
        //         // viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, onViewerSelectionChanged);
        //         // viewer.addEventListener(Autodesk.Viewing.VIEWER_STATE_RESTORED_EVENT, onViewerRestore);
    
        //     var startedCode = viewer.start();
        //     if (startedCode > 0) {
        //         console.error('Failed to create a Viewer: WebGL not supported.');
        //         return;
        //     }
    
        //     Autodesk.Viewing.Document.load('urn:'+ viewables[0].urn, onDocumentLoadSuccess, onDocumentLoadFailure);
                
        // });


// EXAMPLE TO LOAD HOSTED SVF
// SEE https://stackoverflow.com/questions/64849209/how-to-view-a-local-stored-svf-files-using-the-forge-viewer

//         const MODEL_URL = 'https://petrbroz.s3-us-west-1.amazonaws.com/svf-samples/sports-car/0.svf;

//         Autodesk.Viewing.Initializer({ env : 'Local' }, async function () {
//             const viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('viewer'));
//             viewer.start(MODEL_URL);
// //          viewer.loadModel(MODEL_URL);
//         });
    
    
        
    // } else {
    
            // // viewerUnloadAllModels();
            // newInstance = false;
            // Autodesk.Viewing.Document.load('urn:'+ viewables[0].urn, onDocumentLoadSuccess, onDocumentLoadFailure);
    
    // } 
}
        
// function onDocumentLoadSuccess(doc) {

//     // viewer.setGhosting(true);
//     // viewer.setGroundReflection(viewerSettings.groundReflection);
//     // viewer.setGroundShadow(viewerSettings.groundShadow);
//     // viewer.setQualityLevel(viewerSettings.ambientShadows, viewerSettings.antiAliasing);
//     // viewer.setLightPreset(viewerSettings.lightPreset);
//     // viewer.setEnvMapBackground(false);
//     // viewer.setProgressiveRendering(true);

//     let viewable = doc.getRoot().getDefaultGeometry();

//     if (viewable) {
//         // viewer.loadDocumentNode(doc, viewable).then(function(result) {
//         viewer.loadDocumentNode(doc, viewable, {globalOffset: {x:0,y:0,z:0}}).then(function(result) {
//             console.log('here');
//             console.log(result);
//             // viewer.hideAll
//             // viewer.setBackgroundColor(viewerSettings.backgroundColor[0], viewerSettings.backgroundColor[1], viewerSettings.backgroundColor[2], viewerSettings.backgroundColor[3], viewerSettings.backgroundColor[4], viewerSettings.backgroundColor[5]);
//             // viewerDone = true;
//             // initViewerDone();
//         }).catch(function(err) {
//             console.log(err);
//         });
//     }
// }
function onDocumentLoadFailure() {
    console.error('Failed fetching manifest');
}
function initViewerDone() {
    $('#viewer-progress').hide();
}









// Process BOM data for KPIs
function insertFileBOMDataDone(id, data, selectedItems) {

    for(let result of data.data.results) {
        result.properties = result.childFile.properties;
        result.name = result.childFile.name;
        for(let property of result.properties) property.key = property.displayName;
    }

    treeItems = data.data.results;

    for(let treeItem of treeItems) treeItem.link = treeItem.childFile.url;

    insertKPIsPanelData('kpis', config.pdmExplorer.kpis);

}
function clickFileBOMItem(elemClicked, e) {

    let link = elemClicked.attr('data-link') ;

    $.get('/vault/file-viewable', { link : link }, function(response) {
        console.log(response);
    });

    insertFileProperties(link);

}


function selectKPI(elemKPI) {

    console.log('here');
    console.log(treeItems);

    let id          = elemKPI.attr('data-kpi-id');
    let key          = elemKPI.attr('data-kpi-key');
    let isSelected  = elemKPI.hasClass('selected');
    let kpiData     = null;

    console.log(id);

    $('.kpi').removeClass('selected');
    // $('.kpi-value').removeClass('selected');
    // $('#bom').addClass('no-colors');
    // $('#flat-bom').addClass('no-colors');
    $('.bom-color').each(function() { $(this).css('background', '') });
    // $('.flat-bom-number').each(function() { $(this).css('background', '') });

    if(isSelected) return; 
        
    for(kpi of config.pdmExplorer.kpis) {
        if(kpi.id === id) {
            kpiData = kpi.data;
            break;
        }
    }

    if(kpiData === null) return;

    // $('#bom').removeClass('no-colors');
    // $('#flat-bom').removeClass('no-colors');
    elemKPI.addClass('selected');

    // console.log(kpiData);

    // viewerResetColors();

    elemKPI.find('.kpi-value').each(function() {
    
        let filter      = $(this).attr('data-filter');
        let color       = '';
        let vector      = null;
        let partNumbers = [];

        for(let entry of kpiData) {
            if(entry.value.toString() === filter) {
                color  = entry.color;
                vector = entry.vector;
                break;
            }
        }

        // console.log(filter);
        // console.log(color);

        $('#file-bom-tbody').children().each(function() {
            
            let value   = null;
            let link     = $(this).attr('data-link');



            for(let treeItem of treeItems) {

                // console.log(' >>>> ' + treeItem.url);
                if(treeItem.link === link) {

                    // console.log('found math');
                    for(let property of treeItem.properties) {
                        if(property.key === key) {
                            value = property.kpiValue;
                            // console.log('found vlue');
                            // console.log(value === filter);
                        }
                    }
                }
            }

            // console.log(value);

            if(value === filter) {
                // partNumbers.push($(this).attr('data-part-number'));
                $(this).find('.bom-color').css('background', color);
            }

        });

        // $('#bom-table-flat').find('tr').each(function() {

        //     let value   = null;
        //     let urn     = $(this).attr('data-urn');

        //     for (bomItem of bomItems) {
        //         if(bomItem.urn === urn) {
        //             value = bomItem[id];
        //         }
        //     }

        //     if(value === filter) {
        //         $(this).children('.flat-bom-number').first().css('background', color);
        //     }

        // });

        // viewerSetColors(partNumbers, { 
        //     'color' : vector ,
        //     'resetColors' : false
        // });

    });




}
function selectKPIValue(elemClicked, e) {

    console.log('selectKPIValue');

    let isSelected = elemClicked.hasClass('selected');
    
    if(!e.shiftKey) $('.kpi-value').removeClass('selected');

    if(isSelected) elemClicked.removeClass('selected');
    else           elemClicked.addClass('selected');
        
    applyTreeFilter();
    
}
function applyTreeFilter() {
    
    let partNumbers = [];
    let filters     = [];
    let counter     = 0;

    console.log(treeItems);
    
    $('.kpi-value.selected').each(function() {

        let id      = $(this).closest('.kpi').attr('data-kpi-id');
        let key      = $(this).closest('.kpi').attr('data-kpi-key');
        let value   = $(this).attr('data-filter');
        let isNew   = true;

        for(let filter of filters) {
            if(filter.id === id) {
                filter.values.push(value);
                isNew = false;
            }
        }

        if(isNew) filters.push({
            'id'     : id,
            key     : key,
            'values' : [value]
        });

    });

    console.log(filters);
    
    viewerResetSelection(true);
    
    $('#file-bom-tbody').children().each(function() {

        let isVisible   = true;
        let link     = $(this).attr('data-link');

        for(let treeItem of treeItems) {
            if(treeItem.link === link) {
                for(let filter of filters) {
                    for(let property of treeItem.properties) {
                        if(property.key === filter.key) {
                            console.log('match');
                            value = property.kpiValue;
                            if(filter.values.indexOf(value) < 0) isVisible = false;
                            // console.log('found vlue');
                            // console.log(value === filter);
                        }
                    }
                }



                // for(let filter of filters) {
                //     let value = bomItem[filter.id];
                //     if(filter.values.indexOf(value) < 0) isVisible = false;
                // }
                break;
            }
        }

        console.log(isVisible);

        if(isVisible) {
            $(this).show().removeClass('hidden');
            // counter++;
            // partNumbers.push($(this).attr('data-part-number'));
        } else $(this).hide().addClass('hidden');;

    });
    
    
    
    // if($('.kpi-value.selected').length > 0) {
    //     $('#dashboard').removeClass('no-toolbar');
    //     $('#dashboard-counter').html(counter + ' matches');
    //     if(counter === 1) $('#dashboard-counter').html('1 match');
    // } else {
    //     $('#dashboard').addClass('no-toolbar');
    // }

    // if(filters.length === 0) viewerResetColors();
    // else viewerSelectModels(partNumbers);
    
}




// function getBOMKPIData(bomItems, kpis, key) {

//     for(let bomItem of bomItems) {

//         let newBOMData = {
//             name : bomItem.name
//         }

//         for(let kpi of kpis) {

//             if(!isBlank(kpi[key])) {

//                 // console.log(kpi[key]);
            
//                 for(let property of bomItem.childFile.properties) {
                    
//                     if(property.displayName === kpi.property) {

//                         let kpiValue = property.value;

//                         if(kpi.type === 'non-empty') {
//                             kpiValue = (kpiValue === '' ) ? 'No' : 'Yes';
//                         } else if(kpi.type === 'days') {
//                             if(kpiValue === '') kpiValue = '-'
//                             else {
//                                 let day  = kpiValue.split(' ')[0].split('-');
//                                 let date = new Date(day[0], day[1], day[2].split('T')[0]);
//                                 var diff = now.getTime() - date.getTime();
//                                 kpiValue = diff / (1000 * 3600 * 24);
//                                 kpiValue = Math.round(kpiValue, 0);
//                                 kpiValue = kpiValue + ' days ago';
//                             }
//                         } else if(kpi.type === 'value') {
//                             kpiValue = (kpiValue === '' ) ? '-' : kpiValue;
//                         }

//                         newBOMData[kpi.id] = kpiValue;
//                         parseKPI(kpi, kpiValue);

//                     }
//                 }
//             }
//         }

//         bomKPIData.push(newBOMData);
//     }

//     console.log(bomKPIData);

// }
// function parseKPI(kpi, value) {

//     let isNew = true;

//     for(let entry of kpi.data) {
//         if(entry.value === value) {
//             entry.count++;
//             isNew = false;
//             break;
//         }
//     }

//     if(isNew) kpi.data.push({ 
//         'value'     : value, 
//         'count'     : 1, 
//         'color'     : config.colors.list[ kpi.data.length % config.colors.list.length ],
//         'vector'    : config.vectors.list[kpi.data.length % config.vectors.list.length] 
//     });

// }
// function insertKPI(kpi) {

//     let elemDashboard = $('#dashboard-panel');
    
//     let elemKPI = $('<div></div>');
//         elemKPI.attr('data-kpi-id', kpi.id);
//         elemKPI.addClass('kpi');
//         elemKPI.appendTo(elemDashboard);
//         elemKPI.click(function() {
//             $(this).toggleClass('collapsed');
//             $(this).find('.kpi-values').toggle();
//         });

//     let elemKPISelect = $('<div></div>');
//         elemKPISelect.addClass('kpi-selector');
//         elemKPISelect.appendTo(elemKPI);
//         elemKPISelect.click(function(e) {
//             e.preventDefault();
//             e.stopPropagation();
//             selectKPI($(this).parent());
//         });

//     let elemKPIHeader = $('<div></div>');
//         elemKPIHeader.addClass('kpi-header');
//         elemKPIHeader.html(kpi.title);
//         elemKPIHeader.appendTo(elemKPI);

//     let elemKPIValues = $('<div></div>');
//         elemKPIValues.addClass('kpi-values');
//         elemKPIValues.addClass(kpi.style);
//         elemKPIValues.appendTo(elemKPI);

//     if(kpi.style === 'bars') {

//         let sort = (typeof kpi.sort === 'undefined') ? 'count' : kpi.sort;

//         sortArray(kpi.data, sort, 'number', 'descending');

//         let max = 1; 

//         for(entry of kpi.data) {
//             if(entry.count > max) max = entry.count;
//         }

//         kpi.max = max;

//     }

//     for(entry of kpi.data) {

//         let color =  entry.color;
//         let label = (entry.value === '') ? '-' : entry.value;

//         let elemKPIValue = $('<div></div>');
//             elemKPIValue.attr('data-filter', entry.value);
//             elemKPIValue.addClass('kpi-value');
//             elemKPIValue.appendTo(elemKPIValues);
//             elemKPIValue.click(function(e) {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 selectKPIValue(e, $(this));
//             });
    
//         let elemKPILabel = $('<div></div>');
//             elemKPILabel.addClass('kpi-label');
//             elemKPILabel.html(label);
//             elemKPILabel.appendTo(elemKPIValue);

//         let elemKPICounter = $('<div></div>');
//             elemKPICounter.addClass('kpi-counter');
//             elemKPICounter.html(entry.count);
//             elemKPICounter.appendTo(elemKPIValue);

//         if(kpi.style === 'bars') {
//             let width = entry.count * 100 / kpi.max;
//             elemKPIValue.css('background', 'linear-gradient(90deg, ' + color + ' 0 ' + width + '%, var(--color-surface-level-1) ' + width + '% 100%)');
//         } else {
//             elemKPILabel.css('border-color', entry.color);
//         }

//     }

// }



// // Retrieve Workspace Details, BOM and details
// function getInitialData(callback) {

//     let requests = [
//         $.get('/plm/bom-views-and-fields'   , { 'wsId' : wsItems.id }),
//         $.get('/plm/details'                , { 'wsId' : wsItems.id, 'dmsId' : dmsId }),
//         $.get('/plm/sections'               , { 'wsId' : wsItems.id }),
//         $.get('/plm/fields'                 , { 'wsId' : wsItems.id }),
//         $.get('/plm/sections'               , { 'wsId' : wsProblemReports.id }),
//         $.get('/plm/fields'                 , { 'wsId' : wsProblemReports.id })
//     ];

//     if(!isBlank(config.explorer.wsIdSupplierPackages)) {
//         requests.push($.get('/plm/sections', { 'wsId' : wsSupplierPackages.id }));
//         requests.push($.get('/plm/fields'  , { 'wsId' : wsSupplierPackages.id }));
//     }

//     Promise.all(requests).then(function(responses) {

//         for(view of responses[0].data) {
//             if(view.name === config.explorer.bomViewName) {
//                 wsItems.viewId = view.id;
//                 wsItems.viewColumns = view.fields;
//             }
//         }

//         if(wsItems.viewId === '') showErrorMessage('Error in configuration. Could not find BOM view "' + config.explorer.bomViewName + '"');

//         wsItems.sections            = responses[2].data;
//         wsItems.fields              = responses[3].data;
//         wsProblemReports.sections   = responses[4].data;
//         wsProblemReports.fields     = responses[5].data;
//         editableFields              = getEditableFields(wsItems.fields);

//         if(!isBlank(config.explorer.wsIdSupplierPackages)) {
//             wsSupplierPackages.sections = responses[6].data;
//             wsSupplierPackages.fields   = responses[7].data;
//         } else {
//             $('#send-selected').remove();
//         }

//         callback();

//     });

// }



// // Open by id or click in landing page
// function clickRecentItem(elemClicked)        { openSelectedItem(elemClicked); }
// function clickSearchResult(elemClicked)      { openSelectedItem(elemClicked); }
// function clickWorkspaceViewItem(elemClicked) { openSelectedItem(elemClicked); }
// function clickBookmarkItem(elemClicked)      { openSelectedItem(elemClicked); }
// function openSelectedItem(elemClicked)       { openItem(elemClicked.attr('data-link'), elemClicked.attr('data-title')); }
// function openItem(link, title) {

//     let split = link.split('/');

//     window.history.replaceState(null, null, '/explorer?wsid=' + split[4] + '&dmsid=' + split[6] + '&theme=' + theme);

//     $('body').addClass('screen-main').removeClass('screen-landing');
//     $('#details').attr('data-link', link);
//     $('#header-subtitle').html('');
//     $('#bom-table-tree').html('');
//     $('.kpi').remove();
//     $('#dashboard-processing').show();
//     $('#bom-processing').show();

//     context.link = link;
    
//     if(isBlank(title)) {
//         $.get('/plm/descriptor', { 'link' : link}, function(response) {
//             $('#header-subtitle').html(response.data);
//             document.title = documentTitle + ': ' + response.data;
//             context.title = response.data;
//         });
//     } else {
//         $('#header-subtitle').html(title);
//         document.title = documentTitle + ': ' + title;
//         context.title = title;
//     }

//     for(let kpi of config.explorer.kpis) {
//         kpi.data = [];
//     }

//     viewerLeaveMarkupMode();
//     getBOMData(link);
//     insertViewer(link);
//     setItemDetails(link);
//     insertAttachments(link, paramsAttachments);
//     insertChangeProcesses(link, paramsProcesses);

// }




// // Get viewable and init Forge viewer
// function onViewerSelectionChanged(event) {

//     if(viewerHideSelected(event)) return;

//     let found = false;

//     if(viewer.getSelection().length === 0) {

//         return;

//     } else {

//         viewer.getProperties(event.dbIdArray[0], function(data) {

//             for(property of data.properties) {

//                 if(config.viewer.partNumberProperties.indexOf(property.displayName) > -1) {

//                     let partNumber = property.displayValue;

//                     $('tr').each(function() {
//                         if(!found) {
//                             if($(this).attr('data-part-number') === partNumber) {
//                                 found = true;
//                                 $(this).click();
//                             }
//                         }
//                     });

//                     if(!found) {
//                         if(partNumber.indexOf(':') > -1 ) {
//                             partNumber = property.displayValue.split(':')[0];
//                             $('tr').each(function() {
//                                 if(!found) {
//                                     if($(this).attr('data-part-number') === partNumber) {
//                                         found = true;
//                                         $(this).click();
//                                         // if(!$(this).hasClass('selected')) {

//                                         // }
                                        
//                                     }
//                                 }
//                             });
//                         }
//                     }

//                 }

//             }

//         });

//     }

// }
// function initViewerDone() {
    
//     $('#viewer-markup-image').attr('data-field-id', config.explorer.fieldIdProblemReportImage);

// }



// // Insert Selected item's data
// function getBOMData(link) {
    
//     let params = {
//         'link'          : link,
//         'depth'         : 10,
//         'revisionBias'  : revisionBias,
//         'viewId'        : wsItems.viewId
//     }

//     let promises = [
//         $.get('/plm/bom', params),
//         $.get('/plm/bom-flat', params)
//     ];

//     Promise.all(promises).then(function(responses) {

//         // Drop KPIs not contained in BOM View
//         for(var i = config.explorer.kpis.length - 1; i >= 0; i--) {

//             let keep = false;

//             for(field of wsItems.viewColumns) {
//                 if(field.fieldId === config.explorer.kpis[i].fieldId) {
//                     keep = true;
//                     break;
//                 }
//             }

//             if(!keep) config.explorer.kpis.splice(i, 1);

//         }

//         $('#dashboard-processing').hide();
//         $('#bom-processing').hide();
//         setFlatBOMHeader();
//         setBOMData(responses[0].data, responses[1].data);

//     });

// }
// function setFlatBOMHeader() {

//     let elemFlatBOMTHead = $('<thead></thead>');
//         elemFlatBOMTHead.appendTo($('#bom-table-flat'));

//     let elemFlatBOMHead = $('<tr></tr>');
//         elemFlatBOMHead.appendTo(elemFlatBOMTHead);
    
//     let elemFlatBOMHeadCheck = $('<th></th>');
//         elemFlatBOMHeadCheck.html('<div id="flat-bom-select-all" class="icon flat-bom-check-box xxs"></div>');
//         elemFlatBOMHeadCheck.appendTo(elemFlatBOMHead);
//         elemFlatBOMHeadCheck.click(function() {
//             toggleSelectAll();
//         });

//     let elemFlatBOMHeadNumber = $('<th></th>');
//         elemFlatBOMHeadNumber.html('Nr');
//         elemFlatBOMHeadNumber.addClass('sticky');
//         elemFlatBOMHeadNumber.appendTo(elemFlatBOMHead);

//     let elemFlatBOMHeadItem = $('<th></th>');
//         elemFlatBOMHeadItem.html('Item');
//         elemFlatBOMHeadItem.addClass('sticky');
//         elemFlatBOMHeadItem.appendTo(elemFlatBOMHead);

//     let elemFlatBOMHeadQty = $('<th></th>');
//         elemFlatBOMHeadQty.html('Qty');
//         elemFlatBOMHeadQty.appendTo(elemFlatBOMHead); 

//     for(kpi of config.explorer.kpis) {
//         let elemFlatBOMHeadCell = $('<th></th>');
//             elemFlatBOMHeadCell.html(kpi.title);
//             elemFlatBOMHeadCell.appendTo(elemFlatBOMHead);       
//     }
   
//     let elemFlatBOMTBody = $('<tbody></tbody>');
//         elemFlatBOMTBody.attr('id', 'bom-table-flat-tbody');
//         elemFlatBOMTBody.appendTo($('#bom-table-flat'));

// }
// function setBOMData(bom, flatBom) {

//     let elemRoot = $('#bom-table-tree');
//         elemRoot.html('');

//     for(field of wsItems.viewColumns) {
//         if(field.fieldId === config.viewer.fieldIdPartNumber) urns.partNumber = field.__self__.urn;
//         else {
//             for(kpi of config.explorer.kpis) {
//                 if(field.fieldId === kpi.fieldId) {
//                     kpi.urn = field.__self__.urn;
//                 }
//             }
//         }
//     }

//     insertNextBOMLevel(bom, elemRoot, bom.root, flatBom);
//     insertFlatBOM(flatBom);

//     for(kpi of config.explorer.kpis) insertKPI(kpi);

//     $('#items-processing').hide();

//     enableBOMToggles('bom');

//     $('#bom-table-tree').children('tr').click(function(e) {
//         selectBOMItem(e, $(this));
//     });

//     $('tr.flat-bom-row').click(function(e) {
//         selectBOMItem(e, $(this));
//     });

// }
// function insertNextBOMLevel(bom, elemRoot, parent, flatBom) {

//     let result = false;

//     for(edge of bom.edges) {

//         if(edge.parent === parent) {

//             result = true;

//             let title       = getBOMItem(edge.child, bom.nodes);
//             let partNumber  = getBOMCellValue(edge.child, urns.partNumber , bom.nodes);
//             let link        = getBOMNodeLink(edge.child, bom.nodes);
//             let newBOMItem  = { 'urn' : edge.child, 'part-number' : partNumber };
//             let newItem     = true;

//             if(partNumber === '') partNumber = title.split(' - ')[0];

//             let elemRow = $('<tr></tr>');
//                 elemRow.attr('data-number', edge.itemNumber);
//                 elemRow.attr('data-part-number', partNumber);
//                 elemRow.attr('data-title', title);
//                 elemRow.attr('data-qty', '1');
//                 elemRow.addClass('bom-item');
//                 elemRow.appendTo(elemRoot);
    
//             for(let kpi of config.explorer.kpis) {

//                 let kpiValue = getBOMCellValue(edge.child, kpi.urn, bom.nodes, 'title');

//                 if(kpi.type === 'non-empty') {
//                     kpiValue = (kpiValue === '' ) ? 'No' : 'Yes';
//                 } else if(kpi.type === 'days') {
//                     if(kpiValue === '') kpiValue = '-'
//                     else {
//                         let day  = kpiValue.split(' ')[0].split('-');
//                         let date = new Date(day[0], day[1], day[2].split('T')[0]);
//                         var diff = now.getTime() - date.getTime();
//                         kpiValue = diff / (1000 * 3600 * 24);
//                         kpiValue = Math.round(kpiValue, 0);
//                         kpiValue = kpiValue + ' days ago';
//                     }
//                 } else if(kpi.type === 'value') {
//                     kpiValue = (kpiValue === '' ) ? '-' : kpiValue;
//                 }

//                 newBOMItem[kpi.id] = kpiValue;
//                 parseKPI(kpi, kpiValue);
    
//             }

//             for(bomItem of bomItems) {

//                 if(bomItem.urn === edge.child) { newItem = false; break; }
//             }

//             if(newItem) bomItems.push(newBOMItem);

//             for(node of bom.nodes) {
//                 if(node.item.urn === edge.child) {
//                     elemRow.attr('data-dmsId',      node.item.link.split('/')[6]);
//                     elemRow.attr('data-link',       node.item.link);
//                     elemRow.attr('data-urn',        edge.child);
//                     elemRow.attr('data-edgeId',     edge.edgeId);
//                     elemRow.attr('data-edgeLink',   edge.edgeLink);
//                     elemRow.attr('data-level',      edge.depth);
//                     elemRow.addClass('bom-level-' + edge.depth);
//                 }
//             }
//             $('<td></td>').appendTo(elemRow)
//                 .addClass('bom-color');

//             let elemCell = $('<td></td>').appendTo(elemRow)
//                 .addClass('bom-first-col');

//             let elemCellNumber = $('<span></span>');
//                 elemCellNumber.addClass('bom-number');
//                 elemCellNumber.html(edge.depth + '.' + edge.itemNumber);
//                 elemCellNumber.appendTo(elemCell);

//             let elemCellTitle = $('<span></span>');
//                 elemCellTitle.addClass('bom-title');
//                 elemCellTitle.html(title);
//                 elemCellTitle.appendTo(elemCell);

//             let hasChildren = insertNextBOMLevel(bom, elemRoot, edge.child, flatBom);

//             elemRow.children().first().each(function() {
                
//                 if(hasChildren) {

//                     let elemNav = $('<span></span>');
//                         elemNav.addClass('bom-nav');
//                         elemNav.addClass('icon');
//                         elemNav.addClass('expanded');
//                         elemNav.prependTo(elemCell);

//                     elemRow.addClass('node');

//                 }

//                 let elemColor = $('<span></span>');
//                     elemColor.addClass('bom-color');
//                     elemColor.prependTo($(this));

//             });

//         }

//     }

//     return result;

// }
// function getBOMItem(id, nodes) {

//     for(node of nodes) {
//         if(node.item.urn === id) {
//             return node.item.title;
//         }
//     }

//     return '';
    
// }
// function getBOMNodeLink(id, nodes) {
//     for(node of nodes) {
//         if(node.item.urn === id) {
//             return node.item.link;
//         }
//     }
//     return '';
// }
// function filterBOMTree() {

//     $('tr.result').removeClass('result');
//     $('.bom-nav.collapsed').removeClass('collapsed');

//     let filterValue = $('#bom-search-input').val().toLowerCase();

//     if(filterValue === '') {

//         $('#bom-table-tree').children().each(function() {
//             $(this).show();
//         });
//         $('.flat-bom-item').each(function() {
//             $(this).parent().show();
//         });

//     } else {

//         $('.bom-nav.collapsed').removeClass('collapsed').addClass('expanded');
        
//         $('#bom-table-tree').children().each(function() {
//             $(this).hide();
//         });
//         $('.flat-bom-item').each(function() {
//             $(this).parent().hide();
//         });

//         $('#bom-table-tree').children().each(function() {

//             let cellValue = $(this).children('.bom-first-col').html().toLowerCase();

//             if(cellValue.indexOf(filterValue) > -1) {
             
//                 $(this).show();
//                 $(this).addClass('result');
             
//                 let level = Number($(this).attr('data-level'));
//                 unhideParents(level - 1, $(this));

//             }

//         });

//         $('.flat-bom-row').each(function() {

//             let elemRow   = $(this);

//             elemRow.children().each(function() {
//                 let cellValue = $(this).html().toLowerCase();
//                 if(cellValue.indexOf(filterValue) > -1) {
//                     elemRow.show();
//                 }
//             });

//         });

//     }

// }
// function unhideParents(level, elem) {

//     elem.prevAll().each(function() {

//         let prevLevel = Number($(this).attr('data-level'));

//         if(level === prevLevel) {
//             level--;
//             $(this).show();
//         }

//     });

// }
// function selectBOMItem(e, elemClicked) {

//     $('#create-process').show();
//     $('#cancel-process').hide();
//     $('#save-process').hide();
//     $('#processes-details').hide();
    
//     let partNumbers = [];

//     if(elemClicked.hasClass('selected')) {
        
//         paramsProcesses.createContext.link  = context.link;
//         paramsProcesses.createContext.title = context.title;

//         elemClicked.removeClass('selected');
        
//         viewerResetSelection();
//         insertAttachments($('#viewer').attr('data-link'), paramsAttachments);
//         insertChangeProcesses(context.link, paramsProcesses);

//         // if($('.flat-bom-row.selected').length === 0) {

//         //     $('.bom-action').hide();
            
//         //     insertAttachments('/api/v3/workspaces/' + wsId + '/items/' + dmsId);
//         //     insertChangeProcesses('/api/v3/workspaces/' + wsId + '/items/' + dmsId, 'processes');
//         //     viewerResetSelection(true);
            
//         //     multiSelect.wsId        = '';
//         //     multiSelect.links       = [];
//         //     multiSelect.common      = [];
//         //     multiSelect.varies      = [];
//         //     multiSelect.partNumbers = [];
            
//         //     indexSelected = -1;
            
//         // } else if(e.shiftKey) {

//         //     // let partNumbers = [];
//         //     $('.flat-bom-row.selected').each(function() {
//         //         partNumbers.push($(this).attr('data-part-number'));
//         //     });
//         //     viewerSelectModels(partNumbers, true);
//         //     viewerResetColors();

//         // } else {
//         //     elemClicked.click();
//         // }

//     } else {      

//         if(e.shiftKey) {

//             if(indexSelected > -1) {
//                 let increment = (indexSelected < elemClicked.index()) ? 1 : -1;
//                 do {
//                     $('.flat-bom-row').eq(indexSelected).addClass('selected');
//                     indexSelected += increment;
//                 } while (indexSelected !== elemClicked.index());
//             }
//             $('.flat-bom-row.selected').each(function() {
//                 partNumbers.push($(this).attr('data-part-number'));
//             });
//             viewerSelectModels(partNumbers);

//         } else if(e.ctrlKey || event.metaKey) {

//             $('.flat-bom-row.selected').each(function() {
//                 partNumbers.push($(this).attr('data-part-number'));
//             });
//             viewerSelectModels(partNumbers);

//         } else {
            
//             $('#bom-table-tree').children().removeClass('selected');
//             $('.flat-bom-row').removeClass('selected');
//             // viewerResetColors();
//             // viewerSelectModels(multiSelect.partNumbers, true);
            
//         }

//         elemClicked.addClass('selected');
//         partNumbers.push(elemClicked.attr('data-part-number'));

//         indexSelected = elemClicked.index();

//         let linkSelected   = elemClicked.attr('data-link');

//         $('#details').attr('data-link', linkSelected);
//         $('.bom-action').show();
//         $('#go-there').show();
        
//         paramsProcesses.createContext.title = elemClicked.attr('data-title');
//         paramsProcesses.createContext.link  = linkSelected;
        
//         viewerSelectModels(partNumbers);
//         setItemDetails(linkSelected);
//         insertAttachments(linkSelected, paramsAttachments);
//         insertChangeProcesses(linkSelected, paramsProcesses);
        
//     }

// }
// function toggleSelectAll() {
 
//     let elemControl = $('#flat-bom-select-all');
//         elemControl.toggleClass('selected');

//     if(elemControl.hasClass('selected')) {
//         $('.flat-bom-row').addClass('selected');
//         viewerSelectAll();
//     } else {
//         $('.flat-bom-row').removeClass('selected');
//         viewerResetSelection(true);
//     }

// }
// function insertFlatBOM(flatBom) {

//     let elemParent = $('#bom-table-flat-tbody');
//     let count      = 1;

//     for(item of flatBom) {

//         let link        = item.item.link.toString();
//         let urn         = item.item.urn;
//         let title       = item.item.title;
//         let qty         = Number(item.totalQuantity).toFixed(2);
//         let partNumber  = getFlatBOMCellValue(flatBom, link, urns.partNumber, 'title');

//         if(partNumber === '') partNumber = title.split(' - ')[0];

//         let elemRow = $('<tr></tr>');
//             elemRow.attr('data-link', link);
//             elemRow.attr('data-urn', urn);
//             elemRow.attr('data-part-number', partNumber);
//             elemRow.addClass('flat-bom-row');
//             elemRow.appendTo(elemParent);

//         let elemRowCheck = $('<td></td>');
//             elemRowCheck.html('<div class="icon flat-bom-check-box xxs"></div>');
//             elemRowCheck.addClass('flat-bom-check');
//             elemRowCheck.appendTo(elemRow);

//         let elemRowNumber = $('<td></td>');
//             elemRowNumber.html(count++);
//             elemRowNumber.addClass('flat-bom-number');
//             elemRowNumber.appendTo(elemRow);

//         let elemRowItem = $('<td></td>');
//             elemRowItem.html(title)
//             elemRowItem.addClass('flat-bom-item');
//             elemRowItem.appendTo(elemRow);

//         let elemRowQty = $('<td></td>');
//             elemRowQty.html(qty);
//             elemRowQty.addClass('flat-bom-qty');
//             elemRowQty.appendTo(elemRow);

//         for(kpi of config.explorer.kpis) {

//             let value       = getFlatBOMCellValue(flatBom, link, kpi.urn, 'title');
//             let isEditable  = false;
//             let elemRowCell = $('<td></td>');

//             elemRowCell.appendTo(elemRow); 

//             for(editableField of editableFields) {

//                 if(kpi.fieldId === editableField.id) {

//                     if(!isBlank(editableField.control)) {

//                         let elemControl = editableField.control.clone();
//                             elemControl.appendTo(elemRowCell);
//                             elemRowCell.attr('data-id', editableField.id);
//                             elemControl.click(function(e) {
//                                 e.stopPropagation();
//                             });
//                             elemControl.change(function() {
//                                 valueChanged($(this));
//                             });

//                         switch (editableField.type) {

//                             case 'Single Selection':
//                                 elemControl.val(value.link);
//                                 break;

//                             default:
//                                 elemControl.val(value);
//                                 break;

//                         }

//                         isEditable = true;
//                     }

//                 }

//             }

//             if(!isEditable) elemRowCell.html(value);
                         
//         }

//     }

// }
// function valueChanged(elemControl) {

//     let index = elemControl.parent().index();
//     let value = elemControl.val();

//     elemControl.parent().addClass('changed');
//     elemControl.closest('tr').addClass('changed');

//     $('#save-bom-changes').show();

//     $('.flat-bom-row.selected').each(function() {
//         $(this).addClass('changed');
//         $(this).children().eq(index).addClass('changed');
//         $(this).children().eq(index).children().first().val(value);
//     })

// }
// function parseKPI(kpi, value) {

//     let isNew = true;

//     for(let entry of kpi.data) {
//         if(entry.value === value) {
//             entry.count++;
//             isNew = false;
//             break;
//         }
//     }

//     if(isNew) kpi.data.push({ 
//         'value'     : value, 
//         'count'     : 1, 
//         'color'     : config.colors.list[ kpi.data.length % config.colors.list.length ],
//         'vector'    : config.vectors.list[kpi.data.length % config.vectors.list.length] 
//     });

// }
// function insertKPI(kpi) {

//     let elemDashboard = $('#dashboard-panel');
    
//     let elemKPI = $('<div></div>');
//         elemKPI.attr('data-kpi-id', kpi.id);
//         elemKPI.addClass('kpi');
//         elemKPI.appendTo(elemDashboard);
//         elemKPI.click(function() {
//             $(this).toggleClass('collapsed');
//             $(this).find('.kpi-values').toggle();
//         });

//     let elemKPISelect = $('<div></div>');
//         elemKPISelect.addClass('kpi-selector');
//         elemKPISelect.appendTo(elemKPI);
//         elemKPISelect.click(function(e) {
//             e.preventDefault();
//             e.stopPropagation();
//             selectKPI($(this).parent());
//         });

//     let elemKPIHeader = $('<div></div>');
//         elemKPIHeader.addClass('kpi-header');
//         elemKPIHeader.html(kpi.title);
//         elemKPIHeader.appendTo(elemKPI);

//     let elemKPIValues = $('<div></div>');
//         elemKPIValues.addClass('kpi-values');
//         elemKPIValues.addClass(kpi.style);
//         elemKPIValues.appendTo(elemKPI);

//     if(kpi.style === 'bars') {

//         let sort = (typeof kpi.sort === 'undefined') ? 'count' : kpi.sort;

//         sortArray(kpi.data, sort, 'number', 'descending');

//         let max = 1; 

//         for(entry of kpi.data) {
//             if(entry.count > max) max = entry.count;
//         }

//         kpi.max = max;

//     }

//     for(entry of kpi.data) {

//         let color =  entry.color;
//         let label = (entry.value === '') ? '-' : entry.value;

//         let elemKPIValue = $('<div></div>');
//             elemKPIValue.attr('data-filter', entry.value);
//             elemKPIValue.addClass('kpi-value');
//             elemKPIValue.appendTo(elemKPIValues);
//             elemKPIValue.click(function(e) {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 selectKPIValue(e, $(this));
//             });
    
//         let elemKPILabel = $('<div></div>');
//             elemKPILabel.addClass('kpi-label');
//             elemKPILabel.html(label);
//             elemKPILabel.appendTo(elemKPIValue);

//         let elemKPICounter = $('<div></div>');
//             elemKPICounter.addClass('kpi-counter');
//             elemKPICounter.html(entry.count);
//             elemKPICounter.appendTo(elemKPIValue);

//         if(kpi.style === 'bars') {
//             let width = entry.count * 100 / kpi.max;
//             elemKPIValue.css('background', 'linear-gradient(90deg, ' + color + ' 0 ' + width + '%, var(--color-surface-level-1) ' + width + '% 100%)');
//         } else {
//             elemKPILabel.css('border-color', entry.color);
//         }

//     }

// }



// // KPI Handling
// function selectKPI(elemClicked) {

//     viewerResetColors();

//     let id          = elemClicked.attr('data-kpi-id');
//     let isSelected  = elemClicked.hasClass('selected');
//     let kpiData     = null;

//     $('.kpi').removeClass('selected');
//     // $('.kpi-value').removeClass('selected');
//     // $('#bom').addClass('no-colors');
//     // $('#flat-bom').addClass('no-colors');
//     $('.bom-color').each(function() { $(this).css('background', '') });
//     $('.flat-bom-number').each(function() { $(this).css('background', '') });

//     if(isSelected) return; 
        
//     for(kpi of config.explorer.kpis) {
//         if(kpi.id === id) {
//             kpiData = kpi.data;
//             break;
//         }
//     }

//     if(kpiData === null) return;

//     // $('#bom').removeClass('no-colors');
//     // $('#flat-bom').removeClass('no-colors');
//     elemClicked.addClass('selected');

//     viewerResetColors();

//     elemClicked.find('.kpi-value').each(function() {
    
//         let filter      = $(this).attr('data-filter');
//         let color       = '';
//         let vector      = null;
//         let partNumbers = [];

//         for(entry of kpiData) {
//             if(entry.value === filter) {
//                 color  = entry.color;
//                 vector = entry.vector;
//                 break;
//             }
//         }

//         $('#bom-table-tree').children().each(function() {
            
//             let value   = null;
//             let urn     = $(this).attr('data-urn');

//             for (bomItem of bomItems) {
//                 if(bomItem.urn === urn) {
//                     value = bomItem[id];
//                 }
//             }

//             if(value === filter) {
//                 partNumbers.push($(this).attr('data-part-number'));
//                 $(this).find('.bom-color').css('background', color);
//             }

//         });

//         $('#bom-table-flat').find('tr').each(function() {

//             let value   = null;
//             let urn     = $(this).attr('data-urn');

//             for (bomItem of bomItems) {
//                 if(bomItem.urn === urn) {
//                     value = bomItem[id];
//                 }
//             }

//             if(value === filter) {
//                 $(this).children('.flat-bom-number').first().css('background', color);
//             }

//         });

//         viewerSetColors(partNumbers, { 
//             'color' : vector ,
//             'resetColors' : false
//         });

//     });

// }
// function selectKPIValue(e, elemClicked) {

//     let isSelected = elemClicked.hasClass('selected');
    
//     if(!e.shiftKey) $('.kpi-value').removeClass('selected');

//     if(isSelected) elemClicked.removeClass('selected');
//     else           elemClicked.addClass('selected');
    
//     applyFilters();

// }
// function applyFilters() {

//     let partNumbers = [];
//     let filters     = [];
//     let counter     = 0;

//     $('.kpi-value.selected').each(function() {

//         let id      = $(this).closest('.kpi').attr('data-kpi-id');
//         let value   = $(this).attr('data-filter');
//         let isNew   = true;

//         for(filter of filters) {
//             if(filter.id === id) {
//                 filter.values.push(value);
//                 isNew = false;
//             }
//         }

//         if(isNew) filters.push({
//             'id'     : id,
//             'values' : [value]
//         });

//     });

//     viewerResetSelection(true);

//     $('#bom-table-tree').children().each(function() {

//         let isVisible   = true;
//         let urn         = $(this).attr('data-urn');

//         for(bomItem of bomItems) {
//             if(bomItem.urn === urn) {
//                 for(filter of filters) {
//                     let value = bomItem[filter.id];
//                     if(filter.values.indexOf(value) < 0) isVisible = false;
//                 }
//                 break;
//             }
//         }

//         if(isVisible) {
//             $(this).show().removeClass('hidden');
//             counter++;
//             partNumbers.push($(this).attr('data-part-number'));
//         } else $(this).hide().addClass('hidden');;

//     });


//     $('.flat-bom-row').each(function() {

//         let isVisible   = true;
//         let urn         = $(this).attr('data-urn');

//         for(bomItem of bomItems) {
//             if(bomItem.urn === urn) {
//                 for(filter of filters) {
//                     let value = bomItem[filter.id];
//                     if(filter.values.indexOf(value) < 0) isVisible = false;
//                 }
//                 break;
//             }
//         }

//         if(isVisible) $(this).show().removeClass('hidden');
//         else          $(this).hide().addClass('hidden');

//     });

//     if($('.kpi-value.selected').length > 0) {
//         $('#dashboard').removeClass('no-toolbar');
//         $('#dashboard-counter').html(counter + ' matches');
//         if(counter === 1) $('#dashboard-counter').html('1 match');
//     } else {
//         $('#dashboard').addClass('no-toolbar');
//     }

//     if(filters.length === 0) viewerResetColors();
//     else viewerSelectModels(partNumbers);

// }
// function refreshKPIs() {

//     let params = {
//         'wsId'          : wsId,
//         'dmsId'         : dmsId,
//         'depth'         : 10,
//         // 'revisionBias'  : 'allChangeOrder',
//         // 'revisionBias'  : 'changeOrder',
//         'revisionBias'  : 'release',
//         // 'revisionBias'  : 'working',
//         'viewId'        : wsItems.viewId
//     }

//     let promises = [
//         $.get('/plm/bom'     , params),
//         $.get('/plm/bom-flat', params)
//     ];


//     // $('#dashboard-panel').html('');
//     $('#dashboard-panel').addClass('hidden');
//     $('#dashboard-processing').show();

//     Promise.all(promises).then(function(responses) {


//         let bom = responses[0].data;

//         bomItems = [];


//         for(kpi of config.explorer.kpis) {
//             for(data of kpi.data) {
//                 data.count = 0;
//             }
//         };

//         parsetNextBOMLevelKPIs(bom, bom.root);

//         $('#dashboard-panel').removeClass('hidden');
//         $('#dashboard-processing').hide();

        
//         for(kpi of config.explorer.kpis) refreshKPI(kpi);


//     });
    
// }
// function parsetNextBOMLevelKPIs(bom, parent) {

//     for(edge of bom.edges) {

//         if(edge.parent === parent) {

//             let partNumber  = getBOMCellValue(edge.child, urns.partNumber , bom.nodes);
//             // let link        = getBOMNodeLink(edge.child, bom.nodes);
//             let newBOMItem  = { 'urn' : edge.child, 'part-number' : partNumber };
//             let newItem     = true;


//             for(kpi of config.explorer.kpis) {

//                 let kpiValue = getBOMCellValue(edge.child, kpi.urn, bom.nodes, 'title');

//                 if(kpi.type === 'non-empty') {
//                     kpiValue = (kpiValue === '' ) ? 'No' : 'Yes';
//                 } else if(kpi.type === 'days') {
//                     if(kpiValue === '') kpiValue = '-'
//                     else {
//                         let day  = kpiValue.split(' ')[0].split('-');
//                         let date = new Date(day[0], day[1], day[2].split('T')[0]);
//                         var diff = now.getTime() - date.getTime();
//                         kpiValue = diff / (1000 * 3600 * 24);
//                         kpiValue = Math.round(kpiValue, 0);
//                         kpiValue = kpiValue + ' days ago';
//                     }
//                 } else if(kpi.type === 'value') {
//                     kpiValue = (kpiValue === '' ) ? '-' : kpiValue;
//                 }

//                 newBOMItem[kpi.id] = kpiValue;
//                 parseKPI(kpi, kpiValue);

//                 for(bomItem of bomItems) {

//                     if(bomItem.urn === edge.child) { newItem = false; break; }
//                 }
    
//                 if(newItem) bomItems.push(newBOMItem);

                
    
//             }

//             parsetNextBOMLevelKPIs(bom, edge.child);

//         }
//     }

// }
// function refreshKPI(kpi) {

//     let elemDashboard = $('#dashboard-panel');

//     if(kpi.style === 'bars') {

//         let sort = (typeof kpi.sort === 'undefined') ? 'count' : kpi.sort;

//         sortArray(kpi.data, sort, 'number', 'descending');

//         let max = 1; 

//         for(entry of kpi.data) {
//             if(entry.count > max) max = entry.count;
//         }

//         kpi.max = max;

//     }

//     elemDashboard.children('.kpi').each(function() {
        
//         let elemKPI = $(this);
//         let id = elemKPI.attr('data-kpi-id');

//         if(id === kpi.id) {
        
//             let elemKPISelector = $(this).children('.kpi-selector').first();

//             if(elemKPI.hasClass('selected')) {
//                 elemKPI.removeClass('selected');
//                 // selectKPI(elemKPISelector);
//                 elemKPISelector.click();
//             }
            
//         let elemKPIValues = $(this).children('.kpi-values').first();
//         elemKPIValues.html('');

//         for(entry of kpi.data) {

//             let color =  entry.color;
//             let label = (entry.value === '') ? '-' : entry.value;
    
//             let elemKPIValue = $('<div></div>');
//                 elemKPIValue.attr('data-filter', entry.value);
//                 elemKPIValue.addClass('kpi-value');
//                 elemKPIValue.appendTo(elemKPIValues);
//                 elemKPIValue.click(function(e) {
//                     e.preventDefault();
//                     e.stopPropagation();
//                     selectKPIValue(e, $(this));
//                 });
        
//             let elemKPILabel = $('<div></div>');
//                 elemKPILabel.addClass('kpi-label');
//                 elemKPILabel.html(label);
//                 elemKPILabel.appendTo(elemKPIValue);
    
//             let elemKPICounter = $('<div></div>');
//                 elemKPICounter.addClass('kpi-counter');
//                 elemKPICounter.html(entry.count);
//                 elemKPICounter.appendTo(elemKPIValue);
    
//             if(kpi.style === 'bars') {
//                 let width = entry.count * 100 / kpi.max;
//                 elemKPIValue.css('background', 'linear-gradient(90deg, ' + color + ' 0 ' + width + '%, var(--color-surface-level-1) ' + width + '% 100%)');
//             } else {
//                 elemKPILabel.css('border-color', entry.color);
//             }
    
//         }
//     }

//     });
    
    
// }
 


// function setItemDetails(link) {

//     getBookmarkStatus();

//     $('#details-processing').show();
//     $('#details-sections').html('');

//     $.get('/plm/details', { 'link' : link }, function(response) {

//         if($('#details').attr('data-link') !== response.params.link) return;

//         insertItemDetailsFields(link, 'details', wsItems.sections, wsItems.fields, response.data, true, false, false);

//         $('#details-processing').hide();

//         if(multiSelect.links.length < 2) {

//             for(section of response.data.sections) {
//                 for(field of section.fields) {
//                     if(typeof field.value !== 'undefined') {
//                         if(field.value !== null) {
//                             multiSelect.common.push({
//                                 'fieldId' : field.__self__.split('/')[10],
//                                 'value'   : (typeof field.value === 'object') ? field.value.link : field.value
//                             });
//                         }
//                     }
//                 }
//             }

//         } else {

//             // console.log(' > parsing common properties');

//             for(let index = multiSelect.common.length - 1; index >= 0; index--) {

//                 let fieldId = multiSelect.common[index].fieldId;
//                 let keep    = false;

//                 for(section of response.data.sections) {
                
//                     for(field of section.fields) {

                       

                        

//                             let id = field.__self__.split('/')[10];
                            

//                         if(fieldId === id) {

//                             if(field.value !== null) {


//                                 let value = (typeof field.value === 'object') ? field.value.link : field.value;

//                                 // console.log(field);
//                                 // console.log(fieldId);
//                                 // console.log(field.value);
//                                 // console.log(multiSelect.common[index].value);
//                                 if(multiSelect.common[index].value === value) {
//                                     keep = true;
//                                 }
//                                 // console.log(keep);
//                             }

//                         }

//                     }
                
//                 }

//                 if(!keep) {
//                     multiSelect.common.splice(index, 1);
//                     multiSelect.varies.push(fieldId);
//                 }
                    
//             }

//             // console.log(multiSelect);

//             $('#sections').find('.field-value').each(function() {

//                 let id = $(this).attr('data-id');
//                 let reset = true;
//                 for(field of multiSelect.common) {
//                     if(id === field.fieldId) {
//                         // if(field.value === $(this).val()) {
//                             reset = false;
//                         // }
//                     }
//                 }

//                 if(reset) {
//                     if($(this).hasClass('radio')) {
//                         $(this).find('input').each(function() {
//                             $(this).removeAttr('checked');
//                         });
//                     } else $(this).val('');
//                 } 

//             });

//         }

//     });

// }


// // Display create & connect dialog
// function showCreateDialog() {

//     $('#overlay').show();
//     $('#create-connect').show();

//     insertItemDetailsFields('', 'create-connect', wsSupplierPackages.sections, wsSupplierPackages.fields, null, true, true, true);

//     let elemField;

//     $('#create-connect-sections').find('.multi-picklist').each(function() {
//         if($(this).attr('data-id') === 'SHARED_ITEMS') elemField = $(this);
//     });

//     $('#bom-table-tree').children('.selected').each(function() {

//         let elemOption = $('<div></div>');
//             elemOption.attr('data-link', $(this).attr('data-link'));
//             elemOption.html($(this).attr('data-title'));
//             elemOption.appendTo(elemField);
        
//     });

// }



// // Save BOM Changes
// function saveBOMChanges() {

//     $('#overlay').show();
//     saveBOMChange();

// }
// function saveBOMChange() {

//     if($('tr.changed').length === 0) {

//         $('#save-bom-changes').hide();
//         $('#overlay').hide();

//     } else {

//         let requests = [];
//         let elements = [];

//         $('tr.changed').each(function() {

//             if(requests.length < maxRequests) {

//                 let elemItem = $(this);

//                 let params = { 
//                     'link'     : elemItem.attr('data-link'),
//                     'sections' : []
//                 };      
        
//                 elemItem.children('.changed').each(function() {
//                     let elemField = getFieldValue($(this));
//                     addFieldToPayload(params.sections, wsItems.sections, null, elemField.fieldId, elemField.value);
//                 });

//                 requests.push($.post('/plm/edit', params));
//                 elements.push(elemItem);

//             }

//         });

//         Promise.all(requests).then(function(responses) {

//             for(element of elements) {
//                 element.removeClass('changed');
//                 element.children().removeClass('changed');
//             }
//             saveBOMChange();

//         });

//     }

// }


// // Save Item Details Changes
// function saveChanges() {
    
//     $('#overlay').show();
//     saveItem(0);

// }
// function saveItem() {

//     let params = { 
//         'link'     : $('#details').attr('data-link'),
//         'sections' : getSectionsPayload($('#details-sections')) 
//     };

//     $.post('/plm/edit', params, function(response) {
//         if(response.error) {
//             showErrorMessage('Save Failed', response.data.message);
//         }
//         $('#overlay').hide();
//     });

// }