let colorModelSelected          = new THREE.Vector4(0.02, 0.58, 0.84, 0.5);
let colorModelHighlighted       = new THREE.Vector4(0.9, 0.1, 0.1, 0.5);
let newInstance                 = true;
let ghosting                    = true;
let disableViewerSelectionEvent = false;
let viewerDone                  = false;
let dataInstances               = [];
let markupStyle                 = {};

let viewer, markup, markupsvg, curViewerState, restoreMarkupSVG, restoreMarkupState, baseStrokeWidth;
let splitPartNumberBy, splitPartNumberIndexes, splitPartNumberSpacer;

let vectorRange  = [ 
    new THREE.Vector4(206/255, 101/255, 101/255, 0.8),
    new THREE.Vector4(224/255, 175/255,  75/255, 0.8), 
    new THREE.Vector4(225/255, 225/255,  84/255, 0.8), 
    new THREE.Vector4(144/255, 216/255,  71/255, 0.8), 
    new THREE.Vector4( 59/255, 210/255,  59/255, 0.8), 
    new THREE.Vector4( 59/255, 197/255, 128/255, 0.8), 
    new THREE.Vector4( 59/255, 186/255, 186/255, 0.8), 
    new THREE.Vector4(104/255, 158/255, 212/255, 0.8), 
    new THREE.Vector4( 81/255, 120/255, 200/255, 0.8), 
    new THREE.Vector4(156/255, 107/255, 206/255, 0.8), 
    new THREE.Vector4(212/255, 103/255, 212/255, 0.8), 
    new THREE.Vector4(206/255,  92/255, 149/255, 0.8)
]; 

let viewerBGColors = {
    'light' : {
        'level-1' : [255, 255, 255],
        'level-2' : [245, 245, 245],
        'level-3' : [238, 238, 238],
        'level-4' : [217, 217, 217],
        'level-5' : [204, 204, 204]
    },
    'dark' : {
        'level-1' : [69, 79, 97],
        'level-2' : [59, 68, 83],
        'level-3' : [46, 52, 64],
        'level-4' : [34, 41, 51],
        'level-5' : [26, 31, 38]
    },
    'black' : {
        'level-1' : [83, 83, 83],
        'level-2' : [71, 71, 71],
        'level-3' : [55, 55, 55],
        'level-4' : [42, 42, 42],
        'level-5' : [32, 32, 32]
    }
}


// Launch Viewer
function initViewer(id, data, color) {

    if(isBlank(data)) return;
    if(isBlank(id)  ) id = 'viewer';

    if((typeof color !== 'undefined') && (color !== null) && (color !== '')) {
        if(Array.isArray(color)) config.viewer.backgroundColor = color;
        else config.viewer.backgroundColor = [color, color, color];
        
    } else {
        let surfaceLevel = getSurfaceLevel($('#' + id)).split('surface-')[1];
        config.viewer.backgroundColor = viewerBGColors[theme][surfaceLevel];
    }

    $('body').addClass('no-viewer-cube');
    $('#' + id + '-message').hide();
    $('#' + id + '-processing').hide();
    $('#' + id).show();

    dataInstances = [];

    var options = {
        logLevel    : 1,
        env         : 'AutodeskProduction',
        api         : 'derivativeV2',  // for models uploaded to EMEA change this option to 'derivativeV2_EU'
        getAccessToken  : function(onTokenReady) {
            var token = data.token;
            var timeInSeconds = 3600; 
            onTokenReady(token, timeInSeconds);
        }
    }; // see https://aps.autodesk.com/en/docs/viewer/v7/reference/globals/TypeDefs/InitOptions/

    if(typeof viewer === 'undefined') { 

        splitPartNumberBy      = (isBlank(config.viewer.splitPartNumberBy))      ? ''  : config.viewer.splitPartNumberBy;
        splitPartNumberIndexes = (isBlank(config.viewer.splitPartNumberIndexes)) ? [0] : config.viewer.splitPartNumberIndexes;
        splitPartNumberSpacer  = (isBlank(config.viewer.splitPartNumberSpacer))  ? ''  : config.viewer.splitPartNumberSpacer;

        Autodesk.Viewing.Initializer(options, function() {

            var htmlDiv = document.getElementById(id);
            viewer = new Autodesk.Viewing.Private.GuiViewer3D(htmlDiv, { 
                modelBrowserExcludeRoot     : false,
                modelBrowserStartCollapsed  : true
            });

            viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, onViewerToolbarCreated);
            viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, onViewerGeometryLoaded);
            viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, onViewerSelectionChanged);
            viewer.addEventListener(Autodesk.Viewing.VIEWER_STATE_RESTORED_EVENT, onViewerRestore);

            var startedCode = viewer.start();
            if (startedCode > 0) {
                console.error('Failed to create a Viewer: WebGL not supported.');
                return;
            }

            Autodesk.Viewing.Document.load('urn:'+ data.urn, onDocumentLoadSuccess, onDocumentLoadFailure);
            
        });
    
    } else {

        viewerUnloadAllModels();
        newInstance = false;
        Autodesk.Viewing.Document.load('urn:'+ data.urn, onDocumentLoadSuccess, onDocumentLoadFailure);

    } 
    
}
function onDocumentLoadSuccess(doc) {

    viewer.setGhosting(true);
    viewer.setGroundShadow(config.viewer.groundShadow);
    viewer.setGroundReflection(config.viewer.setGroundReflection);
    viewer.setProgressiveRendering(true);

    let viewable = doc.getRoot().getDefaultGeometry();

    if (viewable) {
        // viewer.loadDocumentNode(doc, viewable).then(function(result) {
        viewer.loadDocumentNode(doc, viewable, {globalOffset: {x:0,y:0,z:0}}).then(function(result) {
            viewer.setBackgroundColor(config.viewer.backgroundColor[0], config.viewer.backgroundColor[1], config.viewer.backgroundColor[2], config.viewer.backgroundColor[0], config.viewer.backgroundColor[1], config.viewer.backgroundColor[2]);
            viewerDone = true;
            initViewerDone();
        }).catch(function(err) {
            console.log(err);
        });
    }
}
function onDocumentLoadFailure() {
    console.error('Failed fetching manifest');
}
function initViewerDone() {
    $('#viewer-progress').hide();
}
function onViewerToolbarCreated(event) {  
    event.target.toolbar.setVisible(false); 
}
function onViewerGeometryLoaded() {
    setViewerFeatures();
    setViewerInstancedData();
}
function setViewerFeatures() {

    if (typeof features === 'undefined') {
        viewer.toolbar.setVisible(true);
        return;
    }

    if(isBlank(features)) return;
    if(isBlank(features.viewer)) return;

    for(let feature of Object.keys(features.viewer)) {

        if(features.viewer[feature] === false) {

            let elemParent = null;
            let controlId  = '';

            switch(feature) {

                case 'orbit'        : elemParent = viewer.toolbar.getControl('navTools');       controlId = 'toolbar-orbitTools'; break;
                case 'firstPerson'  : elemParent = viewer.toolbar.getControl('navTools');       controlId = 'toolbar-bimWalkTool'; break;
                case 'camera'       : elemParent = viewer.toolbar.getControl('navTools');       controlId = 'toolbar-cameraSubmenuTool'; break;
                case 'measure'      : elemParent = viewer.toolbar.getControl('modelTools');     controlId = 'toolbar-measurementSubmenuTool'; break;
                case 'section'      : elemParent = viewer.toolbar.getControl('modelTools');     controlId = 'toolbar-sectionTool'; break;
                case 'explodedView' : elemParent = viewer.toolbar.getControl('modelTools');     controlId = 'toolbar-explodeTool'; break;
                case 'modelBrowser' : elemParent = viewer.toolbar.getControl('settingsTools');  controlId = 'toolbar-modelStructureTool'; break;
                case 'properties'   : elemParent = viewer.toolbar.getControl('settingsTools');  controlId = 'toolbar-propertiesTool'; break;
                case 'settings'     : elemParent = viewer.toolbar.getControl('settingsTools');  controlId = 'toolbar-settingsTool'; break;
                case 'fullscreen'   : elemParent = viewer.toolbar.getControl('settingsTools');  controlId = 'toolbar-fullscreenTool'; break;

            }
            if(elemParent !== null) {
                if(controlId !== '') {
                    let elemControl = elemParent.getControl(controlId);
                    elemParent.removeControl(elemControl);
                }
            }
                    
        } else {

            switch(feature) {
                
                case 'markup'   : viewerAddMarkupControls(); break;
                case 'reset'    : viewerAddResetButton();    break;
                case 'ghosting' : viewerAddGhostingToggle(); break;
                case 'views'    : viewerAddViewsToolbar();   break;

            }

        }      
    }

    if(!isBlank(features.viewer.cube)) {
        if(features.viewer.cube) $('body').removeClass('no-viewer-cube');
    }

    viewer.toolbar.setVisible(true);

}
function setViewerInstancedData() {

    let instanceTree    = viewer.model.getInstanceTree();
    let promises        = [];

    for(let i = 1; i < instanceTree.objectCount; i++) promises.push(getPropertiesAsync(i));

    Promise.all(promises).then(function(instances) {
        for(let instance of instances) {
            let partNumber = getInstancePartNumber(instance);
            if(partNumber !== null) {
                instance.partNumber = partNumber;
                dataInstances.push(instance);
            }
        }
        setViewerInstancedDataDone();
    });

}
const getPropertiesAsync = (id) => {
    
    return new Promise((resolve, reject) => {
        viewer.getProperties(id, (result) => {
            resolve(result)
        }, (error) => {
            reject(error)
       });
    });
 
}
function getInstancePartNumber(item) {

    for(let partNumberPropery of config.viewer.partNumberProperties) {
        for(property of item.properties) {
            if(partNumberPropery === property.attributeName) {
                let partNumber = property.displayValue.split(':')[0];
                if(splitPartNumberBy !== '') {
                    let split = partNumber.split(splitPartNumberBy);
                    partNumber = split[0];
                    for(let i = 1; i < splitPartNumberIndexes.length; i++) {
                        partNumber += splitPartNumberSpacer + split[i];
                    }
                }
                return partNumber;
            }
        }
    }
    
    return null;

}
function setViewerInstancedDataDone() {}



// Resize Viewer
function viewerResize(delay) {

    if(!viewerDone) return;

    if(typeof delay === 'undefined') delay = 250;

    setTimeout(function() { viewer.resize(); }, delay);

}



// Validate viewer finished loading
function isViewerStarted() {
 
    if(!viewerDone) return false;
    if(typeof viewer === 'undefined') return false;
    if(!viewer.started) return false;

    return true;

}



// Event listener for user selecting geometry in the viewer
function onViewerSelectionChanged(event) {

    if(disableViewerSelectionEvent) return;
    if(dataInstances.length  === 0) return;

    let partNumbers = [];

    for(let dataInstance of dataInstances) {
        for(let dbId of event.dbIdArray) {
            if(dataInstance.dbId === dbId) {
                partNumbers.push(dataInstance.partNumber);
            }
        }
    }

    onViewerSelectionChangedDone(partNumbers, event);

}
function onViewerSelectionChangedDone(partNumbers, event) {}




// Select / deselect items in the viewer
function viewerSelectModel(partNumber, params) {

    viewerSelectModels([partNumber], params);

}
function viewerSelectModels(partNumbers, params) {

    if(!isViewerStarted()) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let isolate     = true;    // Enable isolation of selected component(s)
    let ghosting    = false;   // Enforce ghosting of hidden components
    let fitToView   = true;    // Zoom in / out to fit selection into view 
    let highlight   = true;    // Highlight given partNumber(s) by defined color (colorModelSelected)
    let resetColors = true;    // Reset colors of all componente before highlighting the partNumber(s)
    let color       = colorModelSelected; 


    if( isBlank(params)            )      params = {};
    if(!isBlank(params.isolate)    )     isolate = params.isolate;
    if(!isBlank(params.ghosting)   )    ghosting = params.ghosting;
    if(!isBlank(params.fitToView)  )   fitToView = params.fitToView;
    if(!isBlank(params.highlight)  )   highlight = params.highlight;
    if(!isBlank(params.resetColors)) resetColors = params.resetColors;
    if(!isBlank(params.color)      )       color = params.color;

    disableViewerSelectionEvent = true;
    
    let dbIds = [];
    
    if(isolate)     viewer.hideAll();
    if(resetColors) viewer.clearThemingColors();

    for(let dataInstance of dataInstances) {
        for(let partNumber of partNumbers) {
            if(dataInstance.partNumber === partNumber) {
                dbIds.push(dataInstance.dbId);
                viewer.show(dataInstance.dbId);
                if(highlight) viewer.setThemingColor(dataInstance.dbId, color, null, true );
            }
        }
    }

    if(ghosting)  viewer.setGhosting(true);
    if(fitToView) viewer.fitToView(dbIds);

    disableViewerSelectionEvent = false;

}
function viewerSelectAll(params) {

    if(!isViewerStarted()) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let fitToView   = true;     // Zoom in / out to fit selection into view 
    let highlight   = true;     // Highlight given partNumber(s) by defined color (colorModelSelected)
    let resetColors = true;     // Reset colors of all componente before highlighting the partNumber(s)
    let color       = colorModelSelected; 

    if( isBlank(params)            )      params = {};
    if(!isBlank(params.fitToView)  )   fitToView = params.fitToView;
    if(!isBlank(params.highlight)  )   highlight = params.highlight;
    if(!isBlank(params.resetColors)) resetColors = params.resetColors;
    if(!isBlank(params.color)      )       color = params.color;

    disableViewerSelectionEvent = true;
    viewer.showAll();
    
    if(resetColors) viewer.clearThemingColors();

    if(highlight) {
        for(let dataInstance of dataInstances) {
            viewer.setThemingColor(dataInstance.dbId, color, null, true );
        }
    }

    if(fitToView) viewer.setViewFromFile();

    disableViewerSelectionEvent = false;

}
function viewerSelectInstances(dbIds, params) {

    if(!isViewerStarted()) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let isolate     = true;    // Enable isolation of selected component(s)
    let ghosting    = false;   // Enforce ghosting of hidden components
    let fitToView   = true;    // Zoom in / out to fit selection into view 
    let highlight   = true;    // Highlight given partNumber(s) by defined color (colorModelSelected)
    let resetColors = true;    // Reset colors of all componente before highlighting the partNumber(s)
    let color       = colorModelSelected; 

    if( isBlank(params)            )      params = {};
    if(!isBlank(params.isolate)    )     isolate = params.isolate;
    if(!isBlank(params.ghosting)   )    ghosting = params.ghosting;
    if(!isBlank(params.fitToView)  )   fitToView = params.fitToView;
    if(!isBlank(params.highlight)  )   highlight = params.highlight;
    if(!isBlank(params.resetColors)) resetColors = params.resetColors;
    if(!isBlank(params.color)      )       color = params.color;

    disableViewerSelectionEvent = true;

    if(isolate)     viewer.hideAll();
    if(resetColors) viewer.clearThemingColors();
    
    for(let dbId of dbIds) {
        dbId = Number(dbId);
        viewer.show(dbId);
        if(highlight) viewer.setThemingColor(dbId, color, null, true );
    }
    
    if(ghosting)  viewer.setGhosting(true);
    if(fitToView) viewer.fitToView(dbIds);

    disableViewerSelectionEvent = false;

}
function viewerHighlightInstances(partNumber, dbIds, params) {
    
    // Select all occurences of a partNumber and highlight defined instance IDs

    if(!isViewerStarted()) return;
    if(isBlank(partNumber)) return;
    if(isBlank(ids)) return;

        //  Set defaults for optional parameters
    // --------------------------------------
    let isolate         = true;    // Enable isolation of selected component(s)
    let ghosting        = false;   // Enforce ghosting of hidden components
    let fitToView       = true;    // Zoom in / out to fit selection into view 
    let resetColors     = true;     // Reset colors of all componente before highlighting the partNumber(s)
    let color           = colorModelSelected; 
    let colorHighlight  = colorModelHighlighted; 


    if( isBlank(params)               )         params = {};
    if(!isBlank(params.isolate)       )        isolate = params.isolate;
    if(!isBlank(params.ghosting)      )       ghosting = params.ghosting;
    if(!isBlank(params.fitToView)     )      fitToView = params.fitToView;
    if(!isBlank(params.resetColors)   )    resetColors = params.resetColors;
    if(!isBlank(params.color)         )          color = params.color;
    if(!isBlank(params.colorHighlight)) colorHighlight = params.colorHighlight;

    disableViewerSelectionEvent = true;

    if(isolate)     viewer.hideAll();
    if(resetColors) viewer.clearThemingColors();

    for(let dataInstance of dataInstances) {
        for(let partNumber of partNumbers) {
            if(dataInstance.partNumber === partNumber) {
                dbIds.push(dataInstance.dbId);
                viewer.show(dataInstance.dbId);
                if(!ids.includes(String.valueOf(item.dbId))) viewer.setThemingColor(item.dbId, color, null, true );
            }
        }
    }

    for(let dbId of dbIds) {
        viewer.setThemingColor(Number(dbId), colorHighlight, null, true );
    }
     
    if(ghosting)  viewer.setGhosting(false);
    if(fitToView) viewer.fitToView(dbIds);
    
    disableViewerSelectionEvent = false;

}
function viewerResetSelection(params) {

    if(!isViewerStarted()) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let fitToView   = true;     // Zoom in / out to fit all into view
    let resetColors = true;     // Highlight given partNumber(s) by defined color (colorModelSelected)

    if( isBlank(params)            )      params = {};
    if(!isBlank(params.fitToView)  )   fitToView = params.fitToView;
    if(!isBlank(params.resetColors)) resetColors = params.resetColors;

    viewer.showAll();
    viewer.clearSelection();
    
    if(resetColors) viewer.clearThemingColors();
    if(fitToView  ) viewer.setViewFromFile();

}



// Set Component Colors
function viewerSetColor(partNumber, params) {

    viewerSetColors([partNumber], params);

}
function viewerSetColors(partNumbers, params) {

    if(!isViewerStarted()) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let isolate     = false;   // Enable isolation of selected component(s)
    let ghosting    = false;   // Enforce ghosting of hidden components
    let fitToView   = false;   // Zoom in / out to fit selection into view 
    let resetColors = true;    // Reset colors of all componente before highlighting the partNumber(s)
    let unhide      = true;    // Unhide component if it is currently hidden
    let color       = colorModelSelected; 


    if( isBlank(params)            )      params = {};
    if(!isBlank(params.isolate)    )     isolate = params.isolate;
    if(!isBlank(params.ghosting)   )    ghosting = params.ghosting;
    if(!isBlank(params.fitToView)  )   fitToView = params.fitToView;
    if(!isBlank(params.resetColors)) resetColors = params.resetColors;
    if(!isBlank(params.highlight)  )   highlight = params.highlight;
    if(!isBlank(params.color)      )   color = new THREE.Vector4(params.color[0], params.color[1], params.color[2], params.color[3]);


    let dbIds  = [];

    if(isolate)     viewer.hideAll();
    if(resetColors) viewer.clearThemingColors();

    for(let dataInstance of dataInstances) {
        for(let partNumber of partNumbers) {
            if(dataInstance.partNumber === partNumber) {
                dbIds.push(dataInstance.dbId);
                if(unhide) viewer.show(dataInstance.dbId);
                viewer.setThemingColor(dataInstance.dbId, color, null, true );
            }
        }
    }

    if(ghosting)  viewer.setGhosting(true);
    if(fitToView) viewer.fitToView(dbIds);

}
function viewerSetColorToAll(color) {

    if(!isViewerStarted()) return;

    let vector      = new THREE.Vector4(color[0], color[1], color[2], color[3]);
    let instances   = viewer.model.getInstanceTree();

    for(var i = 0; i < instances.objectCount; i++) {
        viewer.model.getProperties(i, function(data) { 
            viewer.setThemingColor(data.dbId, vector, null, true);
        })
    }

}
function viewerResetColors() {

    if(!isViewerStarted()) return;

    viewer.clearThemingColors();

}



// Hide / unhide elements from viewer
function viewerHideModel(partNumber) {

    viewerHideModels([partNumber]);

}
function viewerHideModels(partNumbers) {

    if(!isViewerStarted()) return;

    for(let dataInstance of dataInstances) {
        for(let partNumber of partNumbers) {
            if(dataInstance.partNumber === partNumber) {
                viewer.hide(dataInstance.dbId);
            }
        }
    }

}
function viewerUnhideModel(partNumber, fitToView) {

    viewerUnhideModels([partNumber], fitToView);

}
function viewerUnhideModels(partNumbers, params) {

    if(!isViewerStarted()) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let fitToView   = true;    // Zoom in / out to fit selection into view 
    let highlight   = true;    // Highlight given partNumber(s) by defined color (colorModelSelected)
    let resetColors = true;    // Reset colors of all componente before highlighting the partNumber(s)
    let color       = colorModelSelected; 


    if( isBlank(params)            )      params = {};
    if(!isBlank(params.fitToView)  )   fitToView = params.fitToView;
    if(!isBlank(params.highlight)  )   highlight = params.highlight;
    if(!isBlank(params.resetColors)) resetColors = params.resetColors;
    if(!isBlank(params.color)      )       color = new THREE.Vector4(params.color[0], params.color[1], params.color[2], params.color[3]);

    let dbIds = [];
    
    if(resetColors) viewer.clearThemingColors();

    for(let dataInstance of dataInstances) {
        for(let partNumber of partNumbers) {
            if(dataInstance.partNumber === partNumber) {
                dbIds.push(dataInstance.dbId);
                viewer.show(dataInstance.dbId);
                if(highlight) viewer.setThemingColor(dataInstance.dbId, color, null, true );
            }
        }
    }

    if(fitToView) viewer.fitToView(dbIds);

}
function viewerUnhideAll(params) {

    if(!isViewerStarted()) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let fitToView   = true;    // Zoom in / out to fit selection into view 
    let resetColors = true;    // Reset colors of all componente before highlighting the partNumber(s)


    if( isBlank(params)            )      params = {};
    if(!isBlank(params.fitToView)  )   fitToView = params.fitToView;
    if(!isBlank(params.resetColors)) resetColors = params.resetColors;

    if(resetColors) viewer.clearThemingColors();

    viewer.showAll();

    if(fitToView) viewer.setViewFromFile();
}




// Add & unload models to session
function viewerAddModel(model) {
    
    viewerAddModels([model]);

}
function viewerAddModels(models) {

    for(let model of models) addModel(model);

}
function addModel(model) {

    if(!isViewerStarted()) return;

    // see https://aps.autodesk.com/blog/loading-multiple-models-forge-viewer-v7 about transformation
    
    if(typeof model.offsetX === 'undefined') model.offsetX = 0;
    if(typeof model.offsetY === 'undefined') model.offsetY = 0;
    if(typeof model.offsetZ === 'undefined') model.offsetZ = 0;

    if(typeof model.angleX === 'undefined') model.angleX = 0;
    if(typeof model.angleY === 'undefined') model.angleY = 0;
    if(typeof model.angleZ === 'undefined') model.angleZ = 0;

    Autodesk.Viewing.Document.load('urn:'+ model.urn, function(doc) {


        // const rotation = new THREE.Matrix4().makeRotationY(0);
        // const rotation = new THREE.Matrix4().makeRotationX(Number(model.angleX)).makeRotationY(Number(model.angleY)).makeRotationZ(Number(model.angleZ));
        // const rotation = new THREE.Matrix4().makeRotationX(Number(model.angleX));
        // const rotation = new THREE.Matrix4().makeRotationY(Number(model.angleY));
        // const rotation = new THREE.Matrix4().makeRotationZ(Number(model.angleZ));
        // const translation = new THREE.Matrix4().makeTranslation(0, 0, 0);
        // const rotation = new THREE.Matrix4().makeRotationX(Number(model.angleX));// works
        const rotation = new THREE.Matrix4().makeRotationX(Number(model.angleX)).makeRotationY(Number(model.angleY));
        const translation = new THREE.Matrix4().makeTranslation(Number(model.offsetX), Number(model.offsetY), Number(model.offsetZ));
        // const translation = new THREE.Matrix4();

        // console.log(Number(model.offsetX) + ',' + Number(model.offsetY) + ',' + Number(model.offsetZ) + '    /     ' + Number(model.angleX) + ',' + Number(model.angleY) + ',' + Number(model.angleZ));
        // console.log(Number(model.angleY));
        // console.log(Number(model.angleZ));

        var viewable = doc.getRoot().getDefaultGeometry();
        viewer.loadDocumentNode(doc, viewable, {
            preserveView: false,
            // keepCurrentModels: true,
            // placementTransform: (new THREE.Matrix4()).setPosition({x:-1000,y:1000,z:0}),
            // placementTransform: (new THREE.Matrix4()).makeRotationY(90).makeRotationZ(90).setPosition({x:-1000,y:1000,z:0}),
            // placementTransform: (new THREE.Matrix4()).makeRotationX(Number(model.angleX)).makeRotationY(Number(model.angleY)).makeRotationZ(Number(model.angleZ)).setPosition({x:Number(model.offsetX), y:Number(model.offsetY), z:Number(model.offsetZ)}),
            // placementTransform: translation,   // works
            // placementTransform: rotation, // fails
            // placementTransform: new THREE.Matrix4().makeRotationX(Number(model.angleX)), // works
            // placementTransform: new THREE.Matrix4().makeRotationX(Number(model.angleX)).makeTranslation(Number(model.offsetX), Number(model.offsetY), Number(model.offsetZ)), // fails
            placementTransform: rotation.multiply(translation), // works
            keepCurrentModels: true,
            globalOffset: {x:0,y:0,z:0}
        }).then(function(result) {
            // viewer.showAll();
        }).catch(function(err) {
            console.log(err);
        });

    }, onDocumentLoadFailure);

}
function viewerUnloadModel(urn) {

    viewerUnloadModels([urn]);

}
function viewerUnloadModels(urns) {

    for(let urn of urns) unloadModel(urn);

}
function unloadModel(urn) {

    if(!isViewerStarted()) return;

    let models = viewer.impl.modelQueue().getModels();

    for(let model of models) {
        if(model.myData.urn === urn) viewer.unloadModel(model);
    }

}
function viewerUnloadAllModels() {

    if(!isViewerStarted()) return;

    let models = viewer.impl.modelQueue().getModels();

    for(let model of models) viewer.impl.unloadModel(model);

}



// Get paths / instances of defined part numbers
function viewerGetComponentsInstances(partNumbers) {

    if(!isViewerStarted()) return [];

    let result = [];
        
    for(let partNumber of partNumbers) {
        result.push({
            'partNumber' : partNumber,
            'instances'  : viewerGetComponentInstances(partNumber)
        });
    };

    return result;

}
function viewerGetComponentInstances(partNumber) {

    if(!isViewerStarted()) return [];

    let result = [];

    for(let dataInstance of dataInstances) {
        if(dataInstance.partNumber === partNumber) {
            result.push({
                'dbId' : dataInstance.dbId,
                'path' : getComponentPath(dataInstance.dbId)  
            });
        }
    }

    return result;

}
function getComponentPath(id) {

    let result = ';'

    for(let dataInstance of dataInstances) {
        if(dataInstance.dbId === id) {
            result = dataInstance.partNumber + ';' + dataInstance.name;
            for(let property of dataInstance.properties) {
                if(property.attributeName === 'parent') {
                    let partNumber = getComponentPath(property.displayValue);
                    result = partNumber.split('.iam')[0] + '|' + result;
                }
            }

        }
    }

    return result;

}
function viewerGetSelectedComponentPaths() {

    if(!isViewerStarted()) return [];

    let result = [];

    for(let selection of viewer.getSelection()) {

        let componentPath   = getComponentPath(selection).split('|');
        let newPath         = '';

        for(let index = 0; index <= componentPath.length - 1; index++) {

            let segment = componentPath[index];

            if(segment.indexOf('Component Pattern') < 0) {
                if(newPath !== '') newPath += '|';
                newPath += segment;
            }

        }

        result.push(newPath);

    }

    return result;

}



// Custom Controls: Reset Button
function viewerAddResetButton() {

    let customToolbar = new Autodesk.Viewing.UI.ControlGroup('custom-toolbar-reset');

    let buttonReset = addCustomControl(customToolbar, 'button-reset-selection', 'icon-deselect', 'Reset selection and show all models');
        buttonReset.onClick = function() { 
            viewerClickReset();
        };
        
    viewer.toolbar.addControl(customToolbar);

}
function viewerClickReset() {
    viewer.showAll();
    viewerResetColors();
    viewerClickResetDone();
}
function viewerClickResetDone() {

    $('.bom-item').removeClass('selected');
    $('.flat-bom-item').removeClass('selected');

}


// Custom Controls : Ghosting Toggle
function viewerAddGhostingToggle() {

    let newToolbar = new Autodesk.Viewing.UI.ControlGroup('my-custom-toolbar-ghosting');

    let buttonOff = addCustomControl(newToolbar, 'button-toggle-ghosting-off', 'icon-hide', 'Enable ghosting mode');
        buttonOff.onClick = function(e) { 
            viewer.setGhosting(true);
            $('#my-custom-toolbar-ghosting').addClass('no-ghosting');
            $('#my-custom-toolbar-ghosting').removeClass('ghosting');
        };

    let buttonOn = addCustomControl(newToolbar, 'button-toggle-ghosting-on', 'icon-show', 'Disable ghosting mode');
        buttonOn.onClick = function(e) { 
            viewer.setGhosting(false);
            $('#my-custom-toolbar-ghosting').removeClass('no-ghosting');
            $('#my-custom-toolbar-ghosting').addClass('ghosting');
        };

    viewer.toolbar.addControl(newToolbar);

    $('#my-custom-toolbar-ghosting').addClass('no-ghosting');

}
function addCustomControl(toolbar, id, icon, tooltip) {

    let newButton = new Autodesk.Viewing.UI.Button(id);
        newButton.addClass('icon');
        newButton.setIcon(icon);
        newButton.setToolTip(tooltip);

    toolbar.addControl(newButton);

    return newButton;

}


// Custom Controls : Standard Views Toolbar
function viewerAddViewsToolbar() {

    let newToolbar  = new Autodesk.Viewing.UI.ControlGroup('my-custom-toolbar-views');
    
    addCustomViewControl(newToolbar, 'my-view-home-button'  , 'home'  , 'icon-home', 'Home');
    addCustomViewControl(newToolbar, 'my-view-front-button' , 'front' , 'icon-north-east', 'Front View');
    addCustomViewControl(newToolbar, 'my-view-back-button'  , 'back'  , 'icon-south-west', 'Back View');
    addCustomViewControl(newToolbar, 'my-view-left-button'  , 'left'  , 'icon-east', 'Left View');
    addCustomViewControl(newToolbar, 'my-view-right-button' , 'right' , 'icon-west', 'Right View');
    addCustomViewControl(newToolbar, 'my-view-top-button'   , 'top'   , 'icon-south', 'Top View');
    addCustomViewControl(newToolbar, 'my-view-bottom-button', 'bottom', 'icon-north', 'Bottom View');

    viewer.toolbar.addControl(newToolbar);

}
function addCustomViewControl(toolbar, id, view, icon, tooltip) {
    
    var button = new Autodesk.Viewing.UI.Button(id);
        button.addClass('icon');
        button.setIcon(icon);
        button.setToolTip(tooltip);
    
    if(view === "home") {
        button.onClick = function(e) { viewer.setViewFromFile(); };
    } else {
        button.onClick = function(e) { 
            let viewcuiext = viewer.getExtension('Autodesk.ViewCubeUi');
                viewcuiext.setViewCube(view);
        };
    }
    
    toolbar.addControl(button);
    
}


// Custom Controls : Notes
function viewerAddNoteControls() {

    let elemNoteToolbar = $('<div></div>');
        elemNoteToolbar.attr('id', 'viewer-note-toolbar');
        elemNoteToolbar.addClass('hidden');
        elemNoteToolbar.appendTo($('#viewer'));

    let elemNoteGroup = addMarkupControlGroup(elemNoteToolbar, 'markup-toolbar-note', 'Note');

    let elemInput = $('<textarea></textarea>');
        elemInput.addClass('viewer-note');
        elemInput.attr('id', 'viewer-note');
        elemInput.appendTo(elemNoteGroup);

}


// Custom Controls : Markup Controls
function viewerAddMarkupControls(includeSaveButton) {

    if(typeof includeSaveButton === 'undefined') includeSaveButton = false;

    let elemMarkupToolbar = $('<div></div>');
        elemMarkupToolbar.attr('id', 'viewer-markup-toolbar');
        elemMarkupToolbar.addClass('hidden');
        elemMarkupToolbar.addClass('set-defaults');
        elemMarkupToolbar.appendTo($('#viewer'));

    let elemMarkupGroupColors = addMarkupControlGroup(elemMarkupToolbar, 'markup-toolbar-colors', 'Color');

    // addMarkupColorControl(elemMarkupGroupColors, 'FB5A79');
    // addMarkupColorControl(elemMarkupGroupColors, 'FBE235');
    // addMarkupColorControl(elemMarkupGroupColors, '68E759');
    // addMarkupColorControl(elemMarkupGroupColors, '3694FB');
    addMarkupColorControl(elemMarkupGroupColors, 'eb5555');
    addMarkupColorControl(elemMarkupGroupColors, 'faa21b');
    addMarkupColorControl(elemMarkupGroupColors, '87b340');
    addMarkupColorControl(elemMarkupGroupColors, '0696d7');
    // addMarkupColorControl(elemMarkupGroupColors, '8CE5FC');


    let elemMarkupGroupWidth = addMarkupControlGroup(elemMarkupToolbar, 'markup-toolbar-sizes', 'Width');

    addMarkupWidthControl(elemMarkupGroupWidth, '1', 2);
    addMarkupWidthControl(elemMarkupGroupWidth, '2', 4);
    addMarkupWidthControl(elemMarkupGroupWidth, '3', 8);
    addMarkupWidthControl(elemMarkupGroupWidth, '4', 16);
    addMarkupWidthControl(elemMarkupGroupWidth, '5', 28);
    addMarkupWidthControl(elemMarkupGroupWidth, '6', 48);

    let elemMarkupGroupShapes = addMarkupControlGroup(elemMarkupToolbar, 'markup-toolbar-shapes', 'Shape');

    addMarkupShapeControl(elemMarkupGroupShapes, 'arrow', 'trending_flat');
    addMarkupShapeControl(elemMarkupGroupShapes, 'circle', 'radio_button_unchecked');
    addMarkupShapeControl(elemMarkupGroupShapes, 'rectangle', 'crop_square');
    addMarkupShapeControl(elemMarkupGroupShapes, 'cloud', 'water');
    addMarkupShapeControl(elemMarkupGroupShapes, 'freehand', 'draw');
    addMarkupShapeControl(elemMarkupGroupShapes, 'text', 'text_fields');

    let elemMarkupGroupActions = addMarkupControlGroup(elemMarkupToolbar, 'markup-toolbar-actions', 'Actions');

    if(includeSaveButton) {
        addMarkupActionControl(elemMarkupGroupActions, true, 'undo', 'markup.undo();', 'Undo');
        addMarkupActionControl(elemMarkupGroupActions, true, 'redo', 'markup.redo();', 'Redo');
        addMarkupActionControl(elemMarkupGroupActions, true, 'delete', 'markup.clear();', 'Clear all markups');
        addMarkupActionControl(elemMarkupGroupActions, true, 'close', 'viewerLeaveMarkupMode();', 'Close markup toolbar');
        addMarkupActionControl(elemMarkupGroupActions, false, 'Save', 'viewerSaveMarkup();', 'Save markup');
        elemMarkupGroupActions.addClass('with-save-button');
    } else {
        addMarkupActionControl(elemMarkupGroupActions, true, 'undo', 'markup.undo();', 'Undo');
        addMarkupActionControl(elemMarkupGroupActions, true, 'redo', 'markup.redo();', 'Redo');
        addMarkupActionControl(elemMarkupGroupActions, false, 'Clear', 'markup.clear();', 'Clear all markups');
        addMarkupActionControl(elemMarkupGroupActions, false, 'Close', 'viewerLeaveMarkupMode();', 'Close markup toolbar');
    }

    let elemMarkupImage = $('<canvas>');
        elemMarkupImage.attr('id', 'viewer-markup-image');
        elemMarkupImage.addClass('hidden');
        elemMarkupImage.appendTo($('body'));


    let newToolbar = new Autodesk.Viewing.UI.ControlGroup('my-custom-markup-toolbar');
    let newButton  = addCustomControl(newToolbar, 'my-markup-button', 'icon-markup', 'Markup');

    newButton.onClick = function() {

        if(restoreMarkupState !== '') {

            markupsvg = restoreMarkupSVG;
            viewer.restoreState(restoreMarkupState, null, true);

        }

        markup.enterEditMode();
        markup.show();

        if($('#markup-list').children('.selected').length === 0) {
            let placeholders = $('#markup-list').children('.placeholder');
            if(placeholders.length === 0) $('#markup-list').children().first().addClass('selected');
            else placeholders.first().addClass('selected');
        }

        baseStrokeWidth = markup.getStyle()['stroke-width'];
            
        if($('#viewer-markup-toolbar').hasClass('set-defaults')) {
            $('.viewer-markup-toggle.color').first().click();
            $('.viewer-markup-toggle.width').first().click();
            $('.viewer-markup-toggle.shape').first().click();
            $('#viewer-markup-toolbar').removeClass('set-defaults');
        } else {
            $('.viewer-markup-toggle.color.selected').click();
            $('.viewer-markup-toggle.width.selected').click();
            $('.viewer-markup-toggle.shape.selected').click();
        }
        
        $('#viewer-markup-toolbar').toggleClass('hidden');

        let elemNoteControl = $('#viewer-note-toolbar');

        if(elemNoteControl.length > 0) elemNoteControl.toggleClass('hidden');

    };

    viewer.toolbar.addControl(newToolbar);
    
    var promise = viewer.loadExtension('Autodesk.Viewing.MarkupsCore');
    
    promise.then(function(extension){ markup = extension; });

}
function addMarkupControlGroup(elemParent, id, label) {

    let elemGroup = $('<div></div>');
        elemGroup.addClass('viewer-markup-toolbar-group');
        elemGroup.appendTo(elemParent);

    let elemGroupLabel = $('<div></div>');
        elemGroupLabel.addClass('viewer-markup-toolbar-group-label');
        elemGroupLabel.html(label);
        elemGroupLabel.appendTo(elemGroup);

    let elemGroupToolbar = $('<div></div>');
        elemGroupToolbar.addClass('viewer-markup-toolbar-group-toolbar');
        elemGroupToolbar.attr('id', id);
        // elemGroupActions.html(label);
        elemGroupToolbar.appendTo(elemGroup);

    return elemGroupToolbar;

}
function addMarkupColorControl(elemParent, color) {

    let elemControl = $('<div></div>');
        elemControl.addClass('viewer-markup-toggle');
        elemControl.addClass('color');
        elemControl.css('background', '#' + color);
        elemControl.attr('data-color', color);
        elemControl.appendTo(elemParent);

    elemControl.click(function() {
        markupStyle['stroke-color'] = '#' + $(this).attr('data-color');
        markup.setStyle(markupStyle);
        $(this).siblings().removeClass('selected');
        $(this).addClass('selected');
    });

}
function addMarkupWidthControl(elemParent, label, width) {

    let elemControl = $('<div></div>');
        elemControl.addClass('viewer-markup-toggle');
        elemControl.addClass('width');
        elemControl.html(label);
        elemControl.attr('data-width', width);
        elemControl.appendTo(elemParent);

    elemControl.click(function() {
        markupStyle['stroke-width'] = baseStrokeWidth * Number($(this).attr('data-width'));
        markupStyle['font-size'] = baseStrokeWidth * 5 * Number($(this).attr('data-width'));
        markup.setStyle(markupStyle);
        $(this).siblings().removeClass('selected');
        $(this).addClass('selected');
    });

}
function addMarkupShapeControl(elemParent, shape, icon) {

    let elemControl = $('<div></div>');
        elemControl.addClass('viewer-markup-toggle');
        elemControl.addClass('shape');
        elemControl.addClass('icon');
        elemControl.attr('data-shape', shape);
        elemControl.html(icon);
        elemControl.appendTo(elemParent);

    elemControl.click(function() {

        let shape = $(this).attr('data-shape');
        let mode;

        switch (shape) {

            case 'arrow':       mode = new Autodesk.Viewing.Extensions.Markups.Core.EditModeArrow(markup);      break;
            case 'circle':      mode = new Autodesk.Viewing.Extensions.Markups.Core.EditModeCircle(markup);     break;
            case 'cloud':       mode = new Autodesk.Viewing.Extensions.Markups.Core.EditModeCloud(markup);      break;
            case 'freehand':    mode = new Autodesk.Viewing.Extensions.Markups.Core.EditModeFreehand(markup);   break;
            case 'rectangle':   mode = new Autodesk.Viewing.Extensions.Markups.Core.EditModeRectangle(markup);  break;
            case 'text':        mode = new Autodesk.Viewing.Extensions.Markups.Core.EditModeText(markup);       break;
            case 'polycloud':   mode = new Autodesk.Viewing.Extensions.Markups.Core.EditModePolycloud(markup);  break;
            case 'polyline':    mode = new Autodesk.Viewing.Extensions.Markups.Core.EditModePolyline(markup);   break;
        }

        markup.changeEditMode(mode);
        markup.setStyle(markupStyle);
        $(this).siblings().removeClass('selected');
        $(this).addClass('selected');

    });

}
function addMarkupActionControl(elemParent, icon, content, script, tooltip) {

    let elemControl = $('<div></div>');
        elemControl.html(content);
        elemControl.attr('onclick', script);
        elemControl.appendTo(elemParent);

    if(typeof tooltip !== 'undefined') elemControl.attr('title', tooltip);
        
    if(icon) {
        elemControl.addClass('icon');
        elemControl.addClass('viewer-markup-toggle');
    } else {
        elemControl.addClass('viewer-markup-button');
    }

}
function viewerLeaveMarkupMode() {

    let elemNoteControl = $('#viewer-note-toolbar');

    if(elemNoteControl.length > 0) {
        elemNoteControl.toggleClass('hidden');
        closedViewerMarkup(markup.generateData(), viewer.getState());
    }

    $('#viewer-markup-toolbar').addClass('hidden');

    if(typeof markup === 'undefined') return;

    markup.leaveEditMode();
    markup.hide();

    restoreMarkupSVG   = '';
    restoreMarkupState = '';

    $('#markup-list').children('.selected').removeClass('selected');


}
function viewerSaveMarkup() {}

// Capture screenshot with markup for image upload
function viewerCaptureScreenshot(id, callback) {
   
    if(!isViewerStarted()) return;

    if(isBlank(id)) id = 'viewer-markup-image';

    var screenshot  = new Image();
    var imageWidth  = viewer.container.clientWidth;
    var imageHeight = viewer.container.clientHeight;

    screenshot.onload = function () {
            
        let canvas          = document.getElementById(id);
            canvas.width    = viewer.container.clientWidth;
            canvas.height   = viewer.container.clientHeight;

        let context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(screenshot, 0, 0, canvas.width, canvas.height); 
            
        if(!$('#viewer-markup-toolbar').hasClass('hidden')) {
            markup.renderToCanvas(context, function() {
                callback();
            });
        } else {
            callback();
        }
            
    }
            
    viewer.getScreenShot(imageWidth, imageHeight, function (blobURL) {
        screenshot.src = blobURL;
    });

}

// Markup restore
function onViewerRestore(event) {
     
    markup.unloadMarkupsAllLayers();
    
    if(markupsvg !== '') {
        markup.show();
        markup.loadMarkups(markupsvg, 'review');
        
    }
    
}