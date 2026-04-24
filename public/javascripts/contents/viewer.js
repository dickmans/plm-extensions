
let viewers             = [];
let viewersSyncDisabled = false;


let markup, markupsvg, restoreMarkupSVG, restoreMarkupState, baseStrokeWidth;
let conversionAttempts, conversionDelay;
let splitPartNumberBy, splitPartNumberIndexes, splitPartNumberSpacer;

const colorModelSelected    = new THREE.Vector4(0.02, 0.58, 0.84, 0.5);
const colorModelHighlighted = new THREE.Vector4(0.9, 0.1, 0.1, 0.5);

const vectorRange = [ 
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

const viewerBGColors = {
    light : {
        'level-1' : [255, 255, 255],
        'level-2' : [245, 245, 245],
        'level-3' : [238, 238, 238],
        'level-4' : [217, 217, 217],
        'level-5' : [204, 204, 204]
    },
    dark : {
        'level-1' : [69, 79, 97],
        'level-2' : [59, 68, 83],
        'level-3' : [46, 52, 64],
        'level-4' : [34, 41, 51],
        'level-5' : [26, 31, 38]
    },
    black : {
        'level-1' : [83, 83, 83],
        'level-2' : [71, 71, 71],
        'level-3' : [55, 55, 55],
        'level-4' : [42, 42, 42],
        'level-5' : [32, 32, 32]
    }
}


$(document).ready(function() {

    conversionAttempts = common.viewer.conversionAttempts || 10;
    conversionDelay    = common.viewer.conversionDelay    || 2000;

    splitPartNumberBy      = (isBlank(common.viewer.splitPartNumberBy))      ? ''  : common.viewer.splitPartNumberBy;
    splitPartNumberIndexes = (isBlank(common.viewer.splitPartNumberIndexes)) ? [0] : common.viewer.splitPartNumberIndexes;
    splitPartNumberSpacer  = (isBlank(common.viewer.splitPartNumberSpacer))  ? ''  : common.viewer.splitPartNumberSpacer; 

});


// Launch Viewer
function initViewer(id, link, viewables, params) {

    if(isBlank(id)       ) id     = 'viewer';
    if(isBlank(params)   ) params = {};
    if(isBlank(viewables)) { viewerShowErrorMessage(id, 'No viewable found'); return; }

    if(!Array.isArray(viewables)) viewables = [viewables];

    if(viewables.length === 0) { viewerShowErrorMessage(id, 'No viewable found'); return; }

    let viewerInstance = getViewerInstance(id);

    if(viewerInstance === null) {
        viewerInstance = {
            viewer             : null,
            id                 : id,
            startupCompleted   : false,
            restoreMarkupState : '',
            markupStyle        : { 'stroke-color' : '#ev5555' },
            settings           : {
                backgroundColor    : [255, 255, 255, 255, 255, 255],
                antiAliasing       : true,
                ambientShadows     : true,
                groundReflection   : false,
                groundShadow       : true,
                cacheInstances     : common.viewer.cacheInstances ?? true,
                cacheBoundingBoxes : common.viewer.cacheBoundingBoxes ?? false,
                lightPreset        : 4
            }            
        };
        viewers.push(viewerInstance);
    }

    console.log(id);

    viewerInstance.link               = link;
    viewerInstance.viewable           = null;
    viewerInstance.viewables          = viewables;
    viewerInstance.features           = params.features;
    viewerInstance.dataInstances      = [],
    viewerInstance.hiddenInstances    = [],
    viewerInstance.disableSelectEvent = false;
    viewerInstance.objectTreeCreated  = false;
    viewerInstance.geometryLoaded     = false;
    viewerInstance.instanceDataSet    = false;

    console.log(viewerInstance);

    let surfaceLevel = getSurfaceLevel($('#' + id)).split('surface-')[1];
    
    if(!isBlank(params.backgroundColor)) viewerInstance.settings.backgroundColor = params.backgroundColor;
    else if(surfaceLevel === 'level-0')  viewerInstance.settings.backgroundColor = common.viewer.backgroundColor;
    else                                 viewerInstance.settings.backgroundColor = viewerBGColors[theme][surfaceLevel];
    
    if(Array.isArray(viewerInstance.settings.backgroundColor)) {
        if(viewerInstance.settings.backgroundColor.length === 3) {
            viewerInstance.settings.backgroundColor.push(viewerInstance.settings.backgroundColor[0]);
            viewerInstance.settings.backgroundColor.push(viewerInstance.settings.backgroundColor[1]);
            viewerInstance.settings.backgroundColor.push(viewerInstance.settings.backgroundColor[2]);
        }
    } else {
        viewerInstance.settings.backgroundColor = [viewerInstance.settings.backgroundColor, viewerInstance.settings.backgroundColor, viewerInstance.settings.backgroundColor, viewerInstance.settings.backgroundColor, viewerInstance.settings.backgroundColor, viewerInstance.settings.backgroundColor];
    }
    
    if(!isBlank(params.antiAliasing      )) viewerInstance.settings.antiAliasing       = params.antiAliasing;       else if(!isBlank(common.viewer.antiAliasing      )) viewerInstance.settings.antiAliasing       = common.viewer.antiAliasing;
    if(!isBlank(params.ambientShadows    )) viewerInstance.settings.ambientShadows     = params.ambientShadows;     else if(!isBlank(common.viewer.ambientShadows    )) viewerInstance.settings.ambientShadows     = common.viewer.ambientShadows;
    if(!isBlank(params.groundReflection  )) viewerInstance.settings.groundReflection   = params.groundReflection;   else if(!isBlank(common.viewer.groundReflection  )) viewerInstance.settings.groundReflection   = common.viewer.groundReflection;
    if(!isBlank(params.groundShadow      )) viewerInstance.settings.groundShadow       = params.groundShadow;       else if(!isBlank(common.viewer.groundShadow      )) viewerInstance.settings.groundShadow       = common.viewer.groundShadow;
    if(!isBlank(params.lightPreset       )) viewerInstance.settings.lightPreset        = params.lightPreset;        else if(!isBlank(common.viewer.lightPreset       )) viewerInstance.settings.lightPreset        = common.viewer.lightPreset;
    if(!isBlank(params.cacheInstances    )) viewerInstance.settings.cacheInstances     = params.cacheInstances;     else if(!isBlank(common.viewer.cacheInstances    )) viewerInstance.settings.cacheInstances     = common.viewer.cacheInstances;
    if(!isBlank(params.cacheBoundingBoxes)) viewerInstance.settings.cacheBoundingBoxes = params.cacheBoundingBoxes; else if(!isBlank(common.viewer.cacheBoundingBoxes)) viewerInstance.settings.cacheBoundingBoxes = common.viewer.cacheBoundingBoxes;
    
    $('#' + id).addClass('no-viewer-cube');
    $('#' + id + '-processing'      ).removeClass('hidden');
    $('#' + id + '-message'         ).addClass('hidden');
    $('#' + id + '-conversion-error').addClass('hidden');
    $('#' + id + '-file-browser'    ).remove();
    
    viewerInstance.viewable = getPrimaryViewable(viewables);

    convertViewable(viewerInstance, params, 1);

}
function getPrimaryViewable(viewables) {

    if(viewables.length === 1) return viewables[0];

    for(let viewable of viewables) if(viewable.primary) return viewable;

    return null;

}
function convertViewable(viewerInstance, params, attempt) {

    let viewable = viewerInstance.viewable;

    if((viewable.status === 'FAILED') && (attempt > conversionAttempts)) {
        $('#' + viewerInstance.id + '-processing').addClass('hidden');
        $('#' + viewerInstance.id + '-conversion-error').removeClass('hidden');
        $('#' + viewerInstance.id + '-conversion-error-filename').html(viewable.name);
        return;
    } 

    $('#' + viewerInstance.id + '-processing').removeClass('hidden');
    $('#' + viewerInstance.id).hide();

    let elemProcessingMessage = $('#' + viewerInstance.id + '-processing-message').html('Getting Viewables');

    if(viewable.status === 'DONE') {
        elemProcessingMessage.html('');
        launchViewer(viewerInstance, params);
        return;
    } else if(viewable.status === 'PENDING') {
        elemProcessingMessage.html('Downloading ' + viewable.name);
        setTimeout(function () {
            $.get('/plm/get-viewable', { 
                link         : viewerInstance.link,
                attachmentId : viewable.id,
                forceUpdate  : false,
                isPDF        : (viewable.type === 'Adobe PDF'),
                filename     : viewable.filename,
                thumbnail    : viewable.thumbnail
            }, function(response) {
                viewable.status = response.data.status;
                convertViewable(viewerInstance, params, attempt + 1);
            });
        }, conversionDelay);
    } else {
        elemProcessingMessage.html('Converting ' + viewable.name);
        setTimeout(function () {
            $.get('/plm/get-viewable', { 
                link         : viewerInstance.link,
                attachmentId : viewable.id,
                forceUpdate  : (viewable.status === 'FAILED'),
                isPDF        : (viewable.type === 'Adobe PDF'),
                filename     : viewable.filename,
                thumbnail    : viewable.thumbnail
            }, function(response) {
                viewable.status = response.data.status;
                convertViewable(viewerInstance, params, attempt + 1);
            });
        }, conversionDelay);
    }

}
function launchViewer(viewerInstance, params) {

    let viewable = viewerInstance.viewable;

    $('#' + viewerInstance.id + '-processing').addClass('hidden');

    if((!viewerInstance.startupCompleted) || (params.restartViewer)) {

        console.log('viewer new');

        let options = {
            logLevel : 0,
            env      : 'AutodeskProduction',
            api      : 'derivativeV2',  // for models uploaded to EMEA change this option to 'derivativeV2_EU'
            // region : 'EMEA',
            // api         : 'derivativeV2_EU',  // for models uploaded to EMEA change this option to 'derivativeV2_EU'
            // env: 'AutodeskProduction2',
            // api: 'streamingV2',   // for models uploaded to EMEA change this option to 'streamingV2_EU'
            getAccessToken  : function(onTokenReady) {
                var token = viewable.token;
                var timeInSeconds = 3600; 
                onTokenReady(token, timeInSeconds);
            }
        }; // see https://aps.autodesk.com/en/docs/viewer/v7/reference/globals/TypeDefs/InitOptions/

        Autodesk.Viewing.Initializer(options, function() {

            let elemViewer     = document.getElementById(viewerInstance.id);
            let viewerFeatures = viewerInstance.features;
                
            viewerInstance.viewer = new Autodesk.Viewing.GuiViewer3D(elemViewer, { 
                modelBrowserExcludeRoot    : false,
                modelBrowserStartCollapsed : true
            });

            viewerInstance.viewer.panelId = viewerInstance.id;   // required by viewer events to identify the right instance

            viewerInstance.viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT,       onViewerToolbarCreated   );
            viewerInstance.viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT,       onViewerGeometryLoaded   );
            viewerInstance.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT,   onViewerObjectTreeCreated);
            viewerInstance.viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT,     onViewerSelectionChanged );
            viewerInstance.viewer.addEventListener(Autodesk.Viewing.VIEWER_STATE_RESTORED_EVENT, onViewerStateRestored    );

            if(params.syncViewpoint) {
                viewerInstance.viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT , (event) => {
                    syncViewpoint(event);
                });
            }
            if(params.syncExplosion) {
                viewerInstance.viewer.addEventListener(Autodesk.Viewing.EXPLODE_CHANGE_EVENT , (event) => {
                    syncExplosion(event);
                });
            }

            let startedCode = viewerInstance.viewer.start();
            if (startedCode > 0) {
                console.error('Failed to create a Viewer: WebGL not supported.');
                return;
            }      

            if(!isBlank(viewerFeatures.contextMenu)) {
                if(!viewerFeatures.contextMenu) viewerInstance.viewer.setContextMenu(null);
            }

            $('#' + viewerInstance.id).show();

            loadViewableInViewer(viewerInstance);
                
        });
    
    } else {
        
    console.log('viewer reset');
    console.log(viewerInstance.id);

        viewerLeaveMarkupMode({ id : viewerInstance.id });
        viewerUnloadAllModels({ id : viewerInstance.id });
        $('#' + viewerInstance.id).show();
        loadViewableInViewer(viewerInstance)

    }  
    
}
function loadViewableInViewer(viewerInstance) {

    let viewable       = viewerInstance.viewable;
    let viewer         = viewerInstance.viewer;
    let viewerSettings = viewerInstance.settings;

    if(viewable.type === 'Adobe PDF') {
        viewer.loadExtension('Autodesk.PDF').then( () => {
            viewer.setBackgroundColor(viewerSettings.backgroundColor[0], viewerSettings.backgroundColor[1], viewerSettings.backgroundColor[2], viewerSettings.backgroundColor[3], viewerSettings.backgroundColor[4], viewerSettings.backgroundColor[5]);
            viewer.loadModel(viewable.link, viewer, function(doc) {
                viewerInstance.startupCompleted = true;
                initViewerDone(viewerInstance.id);
                setViewerFeatures(viewerInstance);
            }, onDocumentLoadFailure);
        });
    } else {

        Autodesk.Viewing.Document.load('urn:'+ viewable.urn, function(doc) {

            viewer.setGhosting(true);
            viewer.setGroundReflection(viewerSettings.groundReflection);
            viewer.setGroundShadow(viewerSettings.groundShadow);
            viewer.setQualityLevel(viewerSettings.ambientShadows, viewerSettings.antiAliasing);
            viewer.setLightPreset(viewerSettings.lightPreset);
            viewer.setEnvMapBackground(false);
            viewer.setProgressiveRendering(true);                    

            onDocumentLoadSuccess(viewerInstance, doc);

        }, onDocumentLoadFailure);

    }

}
function viewerShowErrorMessage(id, text) {

    let elemMessage = $('#' + id + '-message');
    let elemText    = elemMessage.find('.text');

    elemText.html(text);
    elemMessage.removeClass('hidden');

    $('#' + id + '-processing').addClass('hidden');

}
function onDocumentLoadSuccess(viewerInstance, doc) {     
    
    let elemInstance = $('#' + viewerInstance.id).children('.adsk-viewing-viewer');
    
    if(elemInstance.length > 0) elemInstance.show();

    let viewableGeometry = doc.getRoot().getDefaultGeometry();
    
    if(viewableGeometry) {

        let viewerSettings = viewerInstance.settings;

        viewerInstance.viewer.loadDocumentNode(doc, viewableGeometry).then(function(result) {
        // viewer.loadDocumentNode(doc, viewable, {globalOffset: {x:0,y:0,z:0}}).then(function(result) {
            viewerInstance.viewer.setBackgroundColor(viewerSettings.backgroundColor[0], viewerSettings.backgroundColor[1], viewerSettings.backgroundColor[2], viewerSettings.backgroundColor[3], viewerSettings.backgroundColor[4], viewerSettings.backgroundColor[5]);
            viewerInstance.startupCompleted = true;
            initViewerDone(viewerInstance.id);
        }).catch(function(err) {
            console.log(err);
        });
    }

}
function onDocumentLoadFailure() {
    console.error('Failed launching viewer');
}
function initViewerDone(id) {
    $('#' + id + '-progress').addClass('hidden');
}
function onViewerToolbarCreated(event) {  
    event.target.toolbar.setVisible(false); 
}
function onViewerGeometryLoaded(event) {

    let panelId        = event.target.panelId;
    let viewerInstance = getViewerInstance(panelId);

    event.target.geometryLoaded   = true;
    viewerInstance.geometryLoaded = true;

    processViewerFeaturesAndData(viewerInstance);

}
function onViewerObjectTreeCreated(event) {

    let panelId        = event.target.eventTarget.panelId;
    let viewerInstance = getViewerInstance(panelId);

    viewerInstance.objectTreeCreated = true;

    processViewerFeaturesAndData(viewerInstance); 

}
function processViewerFeaturesAndData(viewerInstance) {

    if(!viewerInstance.geometryLoaded   ) return;
    if(!viewerInstance.objectTreeCreated) return;

    setViewerFeatures    (viewerInstance);
    setViewerInstanceData(viewerInstance);

}
function setViewerFeatures(viewerInstance) {

    // let panelId        = event.target.panelId;
    // let viewerInstance = viewers[panelId];
    let viewer = viewerInstance.viewer;

    if(viewer.model === null) return;

    if(Object.keys(viewerInstance.features).length === 0) {
        viewer.toolbar.setVisible(true);
        return;
    }

    let selectionToolbarFeatures = [];
    let showViewsToolbar         = false;
    let selectFiles              = false;

    for(let feature of Object.keys(viewerInstance.features)) {

        if(viewerInstance.features[feature] === false) {

            let elemParent = null;
            let controlId  = '';

            switch(feature) {

                case 'orbit'        : elemParent = viewer.toolbar.getControl('navTools');       controlId = 'toolbar-orbitTools'            ; break;
                case 'firstPerson'  : elemParent = viewer.toolbar.getControl('navTools');       controlId = 'toolbar-bimWalkTool'           ; break;
                case 'camera'       : elemParent = viewer.toolbar.getControl('navTools');       controlId = 'toolbar-cameraSubmenuTool'     ; break;
                case 'measure'      : elemParent = viewer.toolbar.getControl('modelTools');     controlId = 'toolbar-measurementSubmenuTool'; break;
                case 'section'      : elemParent = viewer.toolbar.getControl('modelTools');     controlId = 'toolbar-sectionTool'           ; break;
                case 'explodedView' : elemParent = viewer.toolbar.getControl('modelTools');     controlId = 'toolbar-explodeTool'           ; break;
                case 'modelBrowser' : elemParent = viewer.toolbar.getControl('settingsTools');  controlId = 'toolbar-modelStructureTool'    ; break;
                case 'properties'   : elemParent = viewer.toolbar.getControl('settingsTools');  controlId = 'toolbar-propertiesTool'        ; break;
                case 'settings'     : elemParent = viewer.toolbar.getControl('settingsTools');  controlId = 'toolbar-settingsTool'          ; break;
                case 'fullscreen'   : elemParent = viewer.toolbar.getControl('settingsTools');  controlId = 'toolbar-fullscreenTool'        ; break;

            }

            if(elemParent !== null) {
                if(controlId !== '') {
                    let elemControl = elemParent.getControl(controlId);
                    elemParent.removeControl(elemControl);
                }
            }
                    
        } else {

            if(feature === 'markup') {

                viewerAddMarkupControls(viewerInstance); 
            
            } else if(feature === 'selectFile') {

                selectFiles = viewerInstance.features[feature]; 

            } else if(viewer.model.is3d()) {

                switch(feature) {
                    
                    case 'hide'      : selectionToolbarFeatures.push(feature); break;
                    case 'ghosting'  : selectionToolbarFeatures.push(feature); viewerInstance.ghosting  =  true; break;
                    case 'highlight' : selectionToolbarFeatures.push(feature); viewerInstance.highlight = false; break;
                    case 'single'    : selectionToolbarFeatures.push(feature); break;
                    case 'fitToView' : selectionToolbarFeatures.push(feature); break;
                    case 'reset'     : selectionToolbarFeatures.push(feature); break;
                    case 'views'     : showViewsToolbar = true;      break;

                }

            }

        }      
    }

    if(viewer.model.is2d()) {

        $('#' + viewerInstance.id + '-customSelectionToolbar').hide();
        $('#' + viewerInstance.id + '-customViewsToolbar'    ).hide();

    } else {

        addCustomSelectionToolbar(viewerInstance, selectionToolbarFeatures);
        if(showViewsToolbar) viewerAddViewsToolbar(viewerInstance);

    }

    if(!isBlank(viewerInstance.features.cube)) {
        if(viewerInstance.features.cube) $('#' + viewerInstance.id).removeClass('no-viewer-cube');
    }

    if(selectFiles) insertFileBrowser(viewerInstance);
    viewer.toolbar.setVisible(true);

}
function setViewerInstanceData(viewerInstance) {

    // let panelId        = event.target.panelId;
    // let viewerInstance = viewers[panelId];
    let viewerSettings = viewerInstance.settings;

    viewerInstance.dataInstances = [];

    if(viewerInstance.viewer.model.is2d()) return;

    let instanceTree = viewerInstance.viewer.model.getInstanceTree();
    let promises     = [];

    for(let i = 1; i < instanceTree.objectCount; i++) promises.push(getPropertiesAsync(viewerInstance.viewer, i));

    Promise.all(promises).then(function(instances) {

        for(let instance of instances) {
            if(!isBlank(instance.name)) {
                let partNumber = getInstancePartNumber(instance);
                if(partNumber !== null) {
                    instance.partNumber  = partNumber;
                    instance.parents     = [];
                    instance.boundingBox = {};
                    if(viewerSettings.cacheBoundingBoxes) {
                        viewerInstance.viewer.select(instance.dbId);
                        instance.boundingBox = viewerInstance.viewer.utilities.getBoundingBox();
                    }
                    viewerInstance.dataInstances.push(instance);
                }
            }
        }

        if(viewerSettings.cacheBoundingBoxes) viewerInstance.viewer.clearSelection();

        viewerInstance.instanceDataSet = true;

        extendViewerInstanceData(viewerInstance);
        onViewerLoadingDone     (viewerInstance);

    });

}
const getPropertiesAsync = (viewer, id) => {
    
    return new Promise((resolve, reject) => {
        viewer.getProperties(id, (result) => {
            resolve(result)
        }, (error) => {
            reject(error)
       });
    });
 
}
function extendViewerInstanceData(viewerInstance) {

    if(!viewerInstance.settings.cacheInstances) return;

    let instancesCount = [];

    for(let instance of viewerInstance.dataInstances) {
        instance.isPattern = true;
        for(let property of instance.properties) {
            if(property.attributeName === 'BOMType') {
                instance.isPattern = false;
                break;
            }
        }
    }

    for(let instance of viewerInstance.dataInstances) {
        
        getComponentPath(viewerInstance, instance.dbId, instance.parents);
        
        let parentPartNumbers = instance.parents.filter(a => a.partNumber.indexOf('Pattern') < 0);
            // parentPartNumbers = parentPartNumbers.filter(a => ((a.name.indexOf(':') > 0) || (a.name.indexOf('.') > 0)));

        // let split = instance.name.split(':');

        if(typeof instancesCount[instance.partNumber] === 'undefined') instancesCount[instance.partNumber] = 1; else instancesCount[instance.partNumber]++;

        instance.instanceId   = instancesCount[instance.partNumber];
        instance.path         =  instance.parents.map(function(parent) { return parent.partNumber }).join('|');
        instance.pathNumbers  = parentPartNumbers.map(function(parent) { return parent.partNumber }).join('|');
        instance.instancePath =  instance.parents.map(function(parent) { return parent.name       }).join('|');

        // if(split.length === 1) {
        //     instance.pathNumbers += '|' + instance.partNumber;
        // } else instance.instanceId = Number(split.pop());

    }

}
function getInstancePartNumber(instance) {

    for(let partNumberPropery of common.viewer.numberProperties) {
        for(let property of instance.properties) {
            // if(partNumberPropery === property.attributeName) {
            if(partNumberPropery === property.displayName) {
                let partNumber = property.displayValue.split(':')[0];
                if(splitPartNumberBy !== '') {
                    let split = partNumber.split(splitPartNumberBy);
                    partNumber = split[0];
                    for(let i = 1; i < splitPartNumberIndexes.length; i++) {
                        partNumber += splitPartNumberSpacer + split[i];
                    }
                }
                // console.log(partNumber);
                return partNumber.trim();
            }
        }
    }
    
    return null;

}
function getComponentPath(viewerInstance, id, componentPath) {

    for(let instance of viewerInstance.dataInstances) {
        if(instance.dbId === id) {

            if(!instance.isPattern) {
                componentPath.unshift({
                    partNumber : instance.partNumber,
                    name       : instance.name
                });
            }
                
            for(let property of instance.properties) {
                if(property.attributeName === 'parent') {
                    getComponentPath(viewerInstance, property.displayValue, componentPath);
                }
            }

        }
    }

}
function onViewerLoadingDone(viewerInstance) {}


// Handle Multiple Viewer Instances
function getViewerInstance(id) {

    if(viewers.length === 0) return null;

    if(isBlank(id)) return viewers[0];

    for(let viewerInstance of viewers) {
        if(viewerInstance.id === id) return viewerInstance;
    }
    
    return null;

}
function getViewerInstanceRunning(id, requires3D) {

    if(isBlank(requires3D)) requires3D = true;

    if(viewers.length === 0) return [ null, null, false ];

    let viewerInstance = null;

    if(isBlank(id)) {
        viewerInstance = viewers[0];
    } else {
        for(let instance of viewers) {
            if(instance.id === id) viewerInstance = instance;
        }
    }

    if(viewerInstance === null) return [ null, null, false ];
    if(!viewerInstance.startupCompleted) return [ null, null, false ];
    if(typeof viewerInstance.viewer === 'undefined') return [ null, null, false ];
    
    let proceed = (requires3D) ?  (!viewerInstance.viewer.model.is2d()) : true;

    return [ viewerInstance, viewerInstance.viewer, proceed ];

}
function getEventViewerInstance(event) {

    if(event.target === null) return null;

    if(event.target.hasOwnProperty('panelId')) {
        return getViewerInstance(event.target.panelId);
    }

    let elemEvent = $(event.target);

    if(elemEvent.length === 0) return null;

    let elemViewer = elemEvent.closest('.viewer');

    if(elemViewer.length === 0) return null;;

    let viewerId = elemViewer.attr('id');

    if(isBlank(viewerId)) return null;

    return getViewerInstance(viewerId);

}
function getRootViewerInstance(elemClicked) {

    let elemViewer = elemClicked.closest('.viewer');
    let viewerId   = elemViewer.attr('id');

    return getViewerInstance(viewerId);

}


// File Browser
function insertFileBrowser(viewerInstance) {

    let elemFileBrowser = $('#' + viewerInstance.id + '-file-browser');
    let elemFileToolbar = $('#' + viewerInstance.id + '-customFileBrowserToolbar');

    if(viewerInstance.viewables.length > 1) {

        if(elemFileToolbar.length === 0) {

            let fileBrowserToolbar = new Autodesk.Viewing.UI.ControlGroup(viewerInstance.id + 'customFileBrowserToolbar');
                viewerInstance.viewer.toolbar.addControl(fileBrowserToolbar);

            let button = addCustomControl(fileBrowserToolbar, viewerInstance.id + 'button-file-browser', 'icon-folder', 'Switch viewable file');
                button.onClick = function(event) { 
                    let viewerInstance = getEventViewerInstance(event);
                    $('#' + viewerInstance.id + '-viewer-file-browser').css('display', 'flex');
                };

        } else elemFileToolbar.show();

        elemFileToolbar.appendTo($('#guiviewer3d-toolbar'));

        if(elemFileBrowser.length === 0) {

            elemFileBrowser = $('<div></div>').appendTo($('#' + viewerInstance.id))
                .attr('id', viewerInstance.id + '-viewer-file-browser')
                .addClass('viewer-file-browser');

            let elemFileBrowserPanel = $('<div></div>').appendTo(elemFileBrowser)
                .addClass('viewer-file-browser-panel')
                .addClass('surface-level-1')
                .attr('id', 'viewer-file-browser-panel');

            let elemFilesHeader = $('<div></div>').appendTo(elemFileBrowserPanel)
                .attr('id', viewerInstance.id + '-viewer-file-browser-header')
                .addClass('viewer-file-browser-header');

            $('<div></div>').appendTo(elemFilesHeader)
                .attr('id', viewerInstance.id + '-viewer-file-browser-title')
                .addClass('viewer-file-browser-title')
                .html('Select Viewing File');

            $('<div></div>').appendTo(elemFilesHeader)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-close')
                .click(function() {
                    $(this).closest('.viewer-file-browser').hide();
                });
           
            let elemFilesList = $('<div></div>').appendTo(elemFileBrowserPanel)
                .addClass('tiles')    
                .addClass('list')    
                .addClass('xl')    
                .addClass('viewer-file-browser-list')    
                .attr('id', viewerInstance.id + '-viewer-file-browser-list');

            for(let viewerFile of viewerInstance.viewables) {

                let elemFile = $('<div></div>').appendTo(elemFilesList)
                    .attr('data-id', viewerFile.id)
                    .attr('data-name', viewerFile.name)
                    .addClass('tile')
                    .click(function(event) {
                        event.preventDefault();
                        event.stopPropagation();
                        $(this).siblings().removeClass('selected');
                        $(this).addClass('selected');
                        $(this).closest('.viewer-file-browser').hide();
                        viewerSwitchFile($(this));
                    });

                if(viewerInstance.viewable.id == viewerFile.id) elemFile.addClass('selected');

                let elemFileThumbnail = $('<div></div>').appendTo(elemFile)
                    .addClass('tile-image');

                if(viewerFile.type === 'Adobe PDF') {
                    elemFileThumbnail.addClass('icon').addClass('icon-pdf');
                } else {                    
                    $('<img></img>').appendTo(elemFileThumbnail)
                        .attr('src', viewerFile.thumbnail);
                }

                let elemFileDetails = $('<div></div>').appendTo(elemFile)
                    .addClass('tile-details');

                $('<div></div>').appendTo(elemFileDetails)
                    .addClass('tile-title')
                    .html(viewerFile.name);
                
                $('<div></div>').appendTo(elemFileDetails)
                    .html('User : ' + viewerFile.user);
                
                $('<div></div>').appendTo(elemFileDetails)
                    .html('Version : ' + viewerFile.version);
                
                let creationDate = new Date(viewerFile.timestamp);

                $('<div></div>').appendTo(elemFileDetails)
                    .html('Date : ' + creationDate.toLocaleString());

            }

        }

    } else if(elemFileToolbar.length > 0) elemFileToolbar.hide();

}
function viewerSwitchFile(elemClicked) {

    let viewableId     = elemClicked.attr('data-id');
    let viewerInstance = getRootViewerInstance(elemClicked);

    for(let viewable of viewerInstance.viewables) {
        if(viewable.id == viewableId) {
            viewerInstance.viewable = viewable;
            break;
        }
    }

    viewerInstance.objectTreeCreated = false;
    viewerInstance.geometryLoaded    = false;

    viewerInstance.viewer.toolbar.setVisible(false);

    convertViewable(viewerInstance, {}, 1);


    // if(viewable.type === 'Adobe PDF') {

    //     console.log(viewable);

    //     viewerInstance.viewer.loadExtension('Autodesk.PDF').then( () => {
    //         viewerFeatures.markup = true;
    //         viewerInstance.viewer.setBackgroundColor(
    //             viewerInstance.settings.backgroundColor[0], 
    //             viewerInstance.settings.backgroundColor[1], 
    //             viewerInstance.settings.backgroundColor[2], 
    //             viewerInstance.settings.backgroundColor[3], 
    //             viewerInstance.settings.backgroundColor[4],
    //             viewerInstance.settings.backgroundColor[5]
    //         );
    //         viewerInstance.viewer.loadModel(viewable.link, viewer, onPDFLoadSuccess, onDocumentLoadFailure);
    //     });    

    // } else {

    //     Autodesk.Viewing.Document.load('urn:'+ viewable.urn, function(doc) {
    //         onDocumentLoadSuccess(viewerInstance, doc);
    //     }, onDocumentLoadFailure);
            
    // }

}


// Resize Viewer
function viewerResize(delay) {

    if(typeof delay === 'undefined') delay = 250;

    for(let viewerInstance of viewers) {
        if(viewerInstance.startupCompleted) {
            setTimeout(function() { viewerInstance.viewer.resize(); }, delay);
        }
    }

}


// Validate viewer finished loading
// TODO : REMOVE
function isViewerStarted(id) {

    if(viewers.length === 0) return false;

    let viewerInstance = getViewerInstance(id);

    if(viewerInstance === null) return false;
    if(!viewerInstance.startupCompleted) return false;
    if(typeof viewerInstance.viewer === 'undefined') return false;
    
    return true;
    
}
function isViewerInstanceStarted(viewerInstance) {
    
    if(viewerInstance === null) return false;
    if(!viewerInstance.startupCompleted) return false;
    if(typeof viewerInstance.viewer === 'undefined') return false;

    return true;

}


// When multiple viewer instance are aviailable, their viewpoints can be synced
function syncViewpoint(event) {

    if(viewersSyncDisabled) return;
    if(viewers.length < 2) return;

    if(event.target.geometryLoaded === null) return;
    if(event.target.geometryLoaded !== true) return;
    if(event.target.syncingViewPoint) { event.target.syncingViewPoint = false; return; }

    let sourceId   = event.target.panelId;
    let sourceView = event.target.navigation;
    const position = sourceView.getPosition();
    const target   = sourceView.getTarget();
    const camera   = sourceView.getCameraUpVector();

    for(let viewerInstance of viewers) {
        if(viewerInstance.id !== sourceId) {
            let viewer = viewerInstance.viewer;
            if(viewer !== null) {
                viewer.syncingViewPoint = true;
                viewer.navigation.setView(position, target);
                viewer.navigation.setCameraUpVector(camera);
            }
        }
    }

}


// When multiple viewer instance are aviailable, their explosion scale can be synced
function syncExplosion(event) {

    if(viewersSyncDisabled) return;
    if(viewers.length < 2) return;

    if(event.target.geometryLoaded === null) return;
    if(event.target.geometryLoaded !== true) return;
    if(event.target.syncExplosion) { event.target.syncExplosion = false; return; } 

    let sourceId = event.target.panelId;
    let scale    = event.target.getExplodeScale();

    for(let viewerInstance of viewers) {

        if(viewerInstance.id !== sourceId) {
            let viewer = viewerInstance.viewer;
            if(viewer !== null) {
                viewer.syncExplosion = true;
                viewer.explode(scale);
            }
        }
    }

}


// Event listener for user selecting geometry in the viewer
function onViewerSelectionChanged(event) {

    let panelId        = event.target.panelId;
    let viewerInstance = getViewerInstance(panelId);

    if(!viewerInstance.instanceDataSet            ) return;
    if( viewerInstance.disableSelectEvent         ) return;
    if( viewerInstance.dataInstances.length  === 0) return;

    let partNumbers = [];

    for(let dataInstance of viewerInstance.dataInstances) {
        for(let dbId of event.dbIdArray) {
            if(dataInstance.dbId === dbId) {
                partNumbers.push(dataInstance.partNumber);
            }
        }
    }

    viewerHideSelected(event);

    onViewerSelectionChangedDone(viewerInstance, partNumbers, event);

}
function onViewerSelectionChangedDone(viewerInstance, partNumbers, event) {}


// Select / deselect items in the viewer
function viewerSelectModel(partNumber, params) {

    viewerSelectModels([partNumber], params);

}
function viewerSelectModels(partNumbers, params) {

    if(isBlank(params)) params = {};

    let [ viewerInstance, viewer, proceed ] = getViewerInstanceRunning(params.id, true);

    if(!proceed) return;


    //  Set defaults for optional parameters
    // --------------------------------------
    let isolate     = params.isolate     ?? true;  // Enable isolation of selected component(s)
    let ghosting    = params.ghosting    ?? false; // Enforce ghosting of hidden components
    let fitToView   = params.fitToView   ?? true;  // Zoom in / out to fit selection into view 
    let highlight   = params.highlight   ?? true;  // Highlight given partNumber(s) by defined color (colorModelSelected)
    let resetColors = params.resetColors ?? true;  // Reset colors of all componente before highlighting the partNumber(s)
    let keepHidden  = params.keepHidden  ?? true;  // Keep selectively hidden components hidden
    let usePath     = params.usePath     ?? false; // If list of paths is provided instead of part numbers
    let color       = colorModelSelected; 

    if(viewerInstance.hasOwnProperty('highlight')) highlight = viewerInstance.highlight;

    viewerInstance.disableSelectEvent = true;

    if(!keepHidden) {
        viewerInstance.hiddenInstances = [];
        updateHiddenInstancesControls(viewerInstance);
        updateHiddenInstancesList(viewerInstance);
    }

    let dbIds = [];
    
    if(isolate)     viewer.hideAll();
    if(resetColors) viewer.clearThemingColors();

    for(let dataInstance of viewerInstance.dataInstances) {
        
        let isSelected     = false;
        // let instanceNumber =  (usePath) ? dataInstance.pathShort : dataInstance.partNumber;
        let instanceNumber =  (usePath) ? dataInstance.path : dataInstance.partNumber;

        for(let partNumber of partNumbers) {
            if(instanceNumber === partNumber) {
                dbIds.push(dataInstance.dbId);
                viewer.show(dataInstance.dbId);
                isSelected = true;
                if(highlight) viewer.setThemingColor(dataInstance.dbId, color, null, true );
            }
        }
        dataInstance.selected = isSelected;
    }

    for(let hiddenInstance of viewerInstance.hiddenInstances) viewer.hide(hiddenInstance.dbId);

    viewerSetGhosting(viewerInstance, ghosting);
    if(fitToView) viewer.fitToView(dbIds);

    viewerInstance.disableSelectEvent = false;

}
function viewerSelectAll(params) {

    if(isBlank(params)) params = {};
    let [ viewerInstance, viewer, proceed ] = getViewerInstanceRunning(params.id, true);
    if(!proceed) return;


    //  Set defaults for optional parameters
    // --------------------------------------
    let fitToView   = params.fitToView   ?? true;  // Zoom in / out to fit selection into view 
    let highlight   = params.highlight   ?? true;  // Highlight given partNumber(s) by defined color (colorModelSelected)
    let resetColors = params.resetColors ?? true;  // Reset colors of all componente before highlighting the partNumber(s)
    let keepHidden  = params.keepHidden  ?? true;  // Keep selectively hidden components hidden
    let color       = params.color       ?? colorModelSelected; 

    viewerInstance.disableSelectEvent = true;
    viewer.showAll();

    if(!keepHidden) {
        viewerInstance.hiddenInstances = [];
        updateHiddenInstancesControls(viewerInstance);
        updateHiddenInstancesList(viewerInstance);
    }
    
    if(resetColors) viewer.clearThemingColors();

    if(highlight) {
        for(let dataInstance of viewerInstance.dataInstances) {
            viewer.setThemingColor(dataInstance.dbId, color, null, true );
        }
    }

    for(let instance of viewerInstance.hiddenInstances) viewer.hide(instance.dbId);

    if(fitToView) viewer.setViewFromFile();

    viewerInstance.disableSelectEvent = false;

}
function viewerSelectInstances(dbIds, params) {

    if(isBlank(params)) params = {};
    let [ viewerInstance, viewer, proceed ] = getViewerInstanceRunning(params.id, true);
    if(!proceed) return;


    //  Set defaults for optional parameters
    // --------------------------------------
    let isolate     = params.isolate     ?? true;  // Enable isolation of selected component(s)
    let ghosting    = params.ghosting    ?? false; // Enforce ghosting of hidden components
    let fitToView   = params.fitToView   ?? true;  // Zoom in / out to fit selection into view 
    let highlight   = params.highlight   ?? true;  // Highlight given partNumber(s) by defined color (colorModelSelected)
    let resetColors = params.resetColors ?? true;  // Reset colors of all componente before highlighting the partNumber(s)
    let keepHidden  = params.keepHidden  ?? true;  // Keep selectively hidden components hidden
    let color       = params.color       ?? colorModelSelected; 

    viewerInstance.disableSelectEvent = true;

    if(!keepHidden) {
        viewerInstance.hiddenInstances = [];
        updateHiddenInstancesControls(viewerInstance);
        updateHiddenInstancesList(viewerInstance);
    }   

    if(isolate)     viewer.hideAll();
    if(resetColors) viewer.clearThemingColors();
    
    for(let dbId of dbIds) {
        dbId = Number(dbId);
        if(viewerInstance.hiddenInstances.indexOf(dbId < 0)) {
            viewer.show(dbId);
            if(highlight) viewer.setThemingColor(dbId, color, null, true );
        }
    }
    
    viewerSetGhosting(viewerInstance, ghosting);
    if(fitToView) viewer.fitToView(dbIds);

   viewerInstance.disableSelectEvent = false;

}
function viewerHighlightInstances(partNumber, dbIds, instancePaths, params) {
    
    // Select all occurences of a partNumber and highlight defined instance IDs

    if(isBlank(partNumber)) return;
    if(isBlank(dbIds     )) { if(isBlank(instancePaths)) return; else dbIds = []; }
    if(isBlank(params    )) params = {};

    let [ viewerInstance, viewer, proceed ] = getViewerInstanceRunning(params.id, true);

    if(!proceed) return;


    //  Set defaults for optional parameters
    // --------------------------------------
    let isolate         = params.isolate        ?? true;  // Enable isolation of selected component(s)
    let ghosting        = params.ghosting       ?? false; // Enforce ghosting of hidden components
    let fitToView       = params.fitToView      ?? true;  // Zoom in / out to fit selection into view 
    let resetColors     = params.resetColors    ?? true;  // Reset colors of all componente before highlighting the partNumber(s)
    let keepHidden      = params.keepHidden     ?? true;  // Keep selectively hidden components hidden
    let color           = params.color          ?? colorModelSelected; 
    let colorHighlight  = params.colorHighlight ?? colorModelHighlighted; 

    viewerInstance.disableSelectEvent = true;

    if(!keepHidden) {
        viewerInstance.hiddenInstances = [];
        updateHiddenInstancesControls(viewerInstance);
        updateHiddenInstancesList(viewerInstance);
    } 
    
    let matchingdbIds = [];

    if(isolate)     viewer.hideAll();
    if(resetColors) viewer.clearThemingColors();

    if(dbIds.length === 0) {
        if(!isBlank(instancePaths)) {
            for(let instancePath of instancePaths) {
                for(let dataInstance of viewerInstance.dataInstances) {
                    if(dataInstance.instancePath === instancePath) {
                        dbIds.push(dataInstance.dbId);
                    }
                }
            }
        }
    }

    for(let dbId of dbIds) {
        for(let dataInstance of viewerInstance.dataInstances) {
            if(dataInstance.partNumber === partNumber) {
                if(viewerInstance.hiddenInstances.indexOf(dbId < 0)) {
                    matchingdbIds.push(dataInstance.dbId);
                    viewer.show(dataInstance.dbId);
                }
            }
        }
    }

    for(let dbId of matchingdbIds) {
        viewer.setThemingColor(Number(dbId), color, null, true );
    }
    for(let dbIdHighlight of dbIds) {
        viewer.setThemingColor(Number(dbIdHighlight), colorHighlight, null, true );
    }
     
    viewerSetGhosting(viewerInstance, ghosting);
    if(fitToView) viewer.fitToView(matchingdbIds);
    
    viewerInstance.disableSelectEvent = false;

}
function viewerResetSelection(params) {

    if(isBlank(params)) params = {};

    let [ viewerInstance, viewer, proceed ] = getViewerInstanceRunning(params.id, true);

    if(!proceed) return;


    //  Set defaults for optional parameters
    // --------------------------------------
    let fitToView   = params.fitToView   || true;   // Zoom in / out to fit all into view
    let resetView   = params.resetView   || false;  // Reset view to initial view from file
    let resetColors = params.resetColors || true;   // Highlight given partNumber(s) by defined color (colorModelSelected)
    let keepHidden  = params.keepHidden  || true;   // Keep selectively hidden components hidden
    let showAll     = params.showAll     || true;   // Show all components

    viewerInstance.disableSelectEvent = true;

    if(showAll) viewer.showAll();
    viewer.clearSelection();

    if(keepHidden) {
        for(let instance of viewerInstance.hiddenInstances) {
            viewer.hide(instance.dbId);
        }
    } else { 
        viewerInstance.hiddenInstances = [];
        updateHiddenInstancesControls(viewerInstance);
        updateHiddenInstancesList(viewerInstance);
    }
    
         if(resetColors) viewer.clearThemingColors();
         if(resetView  ) viewer.setViewFromFile();
    else if(fitToView  ) viewer.fitToView();

    viewerInstance.disableSelectEvent = false;

}


// Set Component Colors
function viewerSetColor(partNumber, params) {

    viewerSetColors([partNumber], params);

}
function viewerSetColors(partNumbers, params) {

    if(isBlank(params)) params = {};

    let [ viewerInstance, viewer, proceed ] = getViewerInstanceRunning(params.id, true);

    if(!proceed) return;
    

    //  Set defaults for optional parameters
    // --------------------------------------
    let isolate     = params.isolate     ?? false;  // Enable isolation of selected component(s)
    let ghosting    = params.ghosting    ?? false; // Enforce ghosting of hidden components
    let fitToView   = params.fitToView   ?? false;  // Zoom in / out to fit selection into view 
    let resetColors = params.resetColors ?? true;  // Reset colors of all componente before highlighting the partNumber(s)
    let keepHidden  = params.keepHidden  ?? true;  // Keep selectively hidden components hidden
    let unhide      = params.unhide      ?? true; // If list of paths is provided instead of part numbers
    let usePath     = params.usePath     ?? false; // If list of paths is provided instead of part numbers
    let color       = colorModelSelected;   

    if(!isBlank(params.color)) color = new THREE.Vector4(params.color[0], params.color[1], params.color[2], params.color[3]);

    let dbIds  = [];

    if(isolate)     viewer.hideAll();
    if(resetColors) viewer.clearThemingColors();

    if(!keepHidden) {
        viewerInstance.hiddenInstances = [];
        updateHiddenInstancesControls(viewerInstance);
        updateHiddenInstancesList(viewerInstance);
    }

    for(let dataInstance of viewerInstance.dataInstances) {
        // let instanceNumber =  (usePath) ? dataInstance.pathShort : dataInstance.partNumber;
        let instanceNumber =  (usePath) ? dataInstance.path : dataInstance.partNumber;
        for(let partNumber of partNumbers) {
            if(instanceNumber === partNumber) {
                if(viewerInstance.hiddenInstances.indexOf(dataInstance.dbId < 0)) {
                    dbIds.push(dataInstance.dbId);
                    if(unhide) viewer.show(dataInstance.dbId);
                    viewer.setThemingColor(dataInstance.dbId, color, null, true );
                }
            }
        }
    }

    viewerSetGhosting(viewerInstance, ghosting);
    if(fitToView) viewer.fitToView(dbIds);

}
function viewerSetColorToAll(color, params) {

    if(isBlank(color )) return;
    if(isBlank(params)) params = {};

    let [ viewerInstance, viewer, proceed ] = getViewerInstanceRunning(params.id, true);

    if(!proceed) return;

    let vector      = new THREE.Vector4(color[0], color[1], color[2], color[3]);
    let instances   = viewer.model.getInstanceTree();

    for(var i = 0; i < instances.objectCount; i++) {
        viewer.model.getProperties(i, function(data) { 
            viewer.setThemingColor(data.dbId, vector, null, true);
        })
    }

}
function viewerResetColors(params) {

    if(isBlank(params)) params = {};

    let [ viewerInstance, viewer, proceed ] = getViewerInstanceRunning(params.id, true);

    if(!proceed) return;

    viewer.clearThemingColors();

}


// Hide / unhide elements from viewer
function viewerHideAll(params) {

    if(isBlank(params)) params = {};

    let [ viewerInstance, viewer, proceed ] = getViewerInstanceRunning(params.id, true);

    if(!proceed) return;

    viewer.hideAll();

}
function viewerHideModel(partNumber, params) {

    viewerHideModels([partNumber], params);

}
function viewerHideModels(partNumbers, params) {

    if(isBlank(params)) params = {};

    let [ viewerInstance, viewer, proceed ] = getViewerInstanceRunning(params.id, true);

    if(!proceed) return;


    //  Set defaults for optional parameters
    // --------------------------------------
    let ghosting    = params.ghosting ?? true;   // Enforce ghosting of hidden components
    let usePath     = params.usePath  ?? false;  // If list of paths is provided instead of part numbers


    for(let dataInstance of viewerInstance.dataInstances) {
        // let instanceNumber =  (usePath) ? dataInstance.pathShort : dataInstance.partNumber;
        let instanceNumber =  (usePath) ? dataInstance.path : dataInstance.partNumber;
        for(let partNumber of partNumbers) {
            if(instanceNumber === partNumber) {
                viewer.hide(dataInstance.dbId);
                if(usePath) break;
            }
        }

    }

    viewerSetGhosting(viewerInstance, ghosting);

}
function viewerUnhideModel(partNumber, params) {

    viewerUnhideModels([partNumber], params);

}
function viewerUnhideModels(partNumbers, params) {

    if(isBlank(params)) params = {};

    let [ viewerInstance, viewer, proceed ] = getViewerInstanceRunning(params.id, true);

    if(!proceed) return;


    //  Set defaults for optional parameters
    // --------------------------------------
    let fitToView   = params.fitToView   ?? true;  // Zoom in / out to fit selection into view 
    let highlight   = params.highlight   ?? true;  // Highlight given partNumber(s) by defined color (colorModelSelected)
    let resetColors = params.resetColors ?? true;  // Reset colors of all componente before highlighting the partNumber(s)
    let usePath     = params.usePath     ?? false; // If list of paths is provided instead of part numbers
    let color       = colorModelSelected; 

    if(!isBlank(params.color)) color = new THREE.Vector4(params.color[0], params.color[1], params.color[2], params.color[3]);

    let dbIds = [];
    
    if(resetColors) viewer.clearThemingColors();

    for(let dataInstance of viewerInstance.dataInstances) {
        // let instanceNumber =  (usePath) ? dataInstance.pathShort : dataInstance.partNumber;
        let instanceNumber =  (usePath) ? dataInstance.path : dataInstance.partNumber;
        for(let partNumber of partNumbers) {
            if(instanceNumber === partNumber) {
                dbIds.push(dataInstance.dbId);
                viewer.show(dataInstance.dbId);
                if(highlight) viewer.setThemingColor(dataInstance.dbId, color, null, true );
                if(usePath) break;
            }
        }
    }

    if(fitToView) viewer.fitToView(dbIds);

}
function viewerUnhideAll(params) {

    if(isBlank(params)) params = {};

    let [ viewerInstance, viewer, proceed ] = getViewerInstanceRunning(params.id, true);

    if(!proceed) return;


    //  Set defaults for optional parameters
    // --------------------------------------
    let fitToView   = params.fitToView   ?? true;  // Zoom in / out to fit selection into view 
    let resetColors = params.resetColors ?? true;  // Reset colors of all componente before highlighting the partNumber(s)
    let keepHidden  = params.keepHidden  ?? true;  // Keep selectively hidden components hidden


    if(!keepHidden) {
        viewerInstance.hiddenInstances = [];
        updateHiddenInstancesControls(viewerInstance);
        updateHiddenInstancesList(viewerInstance);
    }

    if(resetColors) viewer.clearThemingColors();

    viewer.showAll();

    for(let instance of viewerInstance.hiddenInstances) viewer.hide(instance.dbId);

    if(fitToView) viewer.setViewFromFile();
}


// Add & unload models to session
// function viewerAddModel(model) {
    
//     viewerAddModels([model]);

// }
// function viewerAddModels(models) {

//     for(let model of models) addModel(model);

// }
// function addModel(model) {

//     if(!isViewerStarted()) return;

//     // see https://aps.autodesk.com/blog/loading-multiple-models-forge-viewer-v7 about transformation
    
//     if(typeof model.offsetX === 'undefined') model.offsetX = 0;
//     if(typeof model.offsetY === 'undefined') model.offsetY = 0;
//     if(typeof model.offsetZ === 'undefined') model.offsetZ = 0;

//     if(typeof model.angleX === 'undefined') model.angleX = 0;
//     if(typeof model.angleY === 'undefined') model.angleY = 0;
//     if(typeof model.angleZ === 'undefined') model.angleZ = 0;

//     Autodesk.Viewing.Document.load('urn:'+ model.urn, function(doc) {


//         // const rotation = new THREE.Matrix4().makeRotationY(0);
//         // const rotation = new THREE.Matrix4().makeRotationX(Number(model.angleX)).makeRotationY(Number(model.angleY)).makeRotationZ(Number(model.angleZ));
//         // const rotation = new THREE.Matrix4().makeRotationX(Number(model.angleX));
//         // const rotation = new THREE.Matrix4().makeRotationY(Number(model.angleY));
//         // const rotation = new THREE.Matrix4().makeRotationZ(Number(model.angleZ));
//         // const translation = new THREE.Matrix4().makeTranslation(0, 0, 0);
//         // const rotation = new THREE.Matrix4().makeRotationX(Number(model.angleX));// works
//         const rotation = new THREE.Matrix4().makeRotationX(Number(model.angleX)).makeRotationY(Number(model.angleY));
//         const translation = new THREE.Matrix4().makeTranslation(Number(model.offsetX), Number(model.offsetY), Number(model.offsetZ));
//         // const translation = new THREE.Matrix4();

//         // console.log(Number(model.offsetX) + ',' + Number(model.offsetY) + ',' + Number(model.offsetZ) + '    /     ' + Number(model.angleX) + ',' + Number(model.angleY) + ',' + Number(model.angleZ));
//         // console.log(Number(model.angleY));
//         // console.log(Number(model.angleZ));

//         var viewable = doc.getRoot().getDefaultGeometry();
//         viewer.loadDocumentNode(doc, viewable, {
//             preserveView: false,
//             // keepCurrentModels: true,
//             // placementTransform: (new THREE.Matrix4()).setPosition({x:-1000,y:1000,z:0}),
//             // placementTransform: (new THREE.Matrix4()).makeRotationY(90).makeRotationZ(90).setPosition({x:-1000,y:1000,z:0}),
//             // placementTransform: (new THREE.Matrix4()).makeRotationX(Number(model.angleX)).makeRotationY(Number(model.angleY)).makeRotationZ(Number(model.angleZ)).setPosition({x:Number(model.offsetX), y:Number(model.offsetY), z:Number(model.offsetZ)}),
//             // placementTransform: translation,   // works
//             // placementTransform: rotation, // fails
//             // placementTransform: new THREE.Matrix4().makeRotationX(Number(model.angleX)), // works
//             // placementTransform: new THREE.Matrix4().makeRotationX(Number(model.angleX)).makeTranslation(Number(model.offsetX), Number(model.offsetY), Number(model.offsetZ)), // fails
//             placementTransform: rotation.multiply(translation), // works
//             keepCurrentModels: true,
//             globalOffset: {x:0,y:0,z:0}
//         }).then(function(result) {
//             // viewer.showAll();
//         }).catch(function(err) {
//             console.log(err);
//         });

//     }, onDocumentLoadFailure);

// }
// function viewerUnloadModel(urn) {

//     viewerUnloadModels([urn]);

// }
// function viewerUnloadModels(urns) {

//     for(let urn of urns) unloadModel(urn);

// }
// function unloadModel(urn) {

//     if(!isViewerStarted()) return;

//     let models = viewer.impl.modelQueue().getModels();

//     for(let model of models) {
//         if(model.myData.urn === urn) viewer.unloadModel(model);
//     }

// }
function viewerUnloadAllModels(params) {

    if(isBlank(params)) params = {};

    let [ viewerInstance, viewer, proceed ] = getViewerInstanceRunning(params.id, false);

    if(!proceed) return;    

    let models = viewer.impl.modelQueue().getModels();

    for(let model of models) viewer.impl.unloadModel(model);

}


// Get part number of selected component
function viewerGetSelectedPartNumber(event, callback) {

    let viewerInstance = getEventViewerInstance(event);

    if(event.dbIdArray.length === 1) {

        viewerInstance.viewer.getProperties(event.dbIdArray[0], function(data) {

            let partNumber = data.name.split(':')[0];
            let match      = false;

            for(let partNumberProperty of common.viewer.numberProperties) {
                if(!match) {
                    for(let property of data.properties) {
                        if(property.displayName === partNumberProperty) {
                            partNumber = property.displayValue;
                            if(partNumber.indexOf(':') > -1) { partNumber = partNumber.split(':')[0]; }
                            match = true;
                            break;
                        }
                    }
                }
            }

            callback(partNumber);

        });

    } else return '';

}


// Get paths / instances of defined part numbers
function viewerGetComponentsInstances(partNumbers, params) {

    if(isBlank(params)) params = {};

    let [ viewerInstance, viewer, proceed ] = getViewerInstanceRunning(params.id, true);

    if(!proceed) return;

    let result = [];

    for(let partNumber of partNumbers) {
        result.push({
            partNumber : partNumber,
            instances  : viewerGetComponentInstances(viewerInstance, partNumber)
        });
    };

    return result;

}
function viewerGetComponentInstances(viewerInstance, partNumber) {

    let result = [];

    for(let dataInstance of viewerInstance.dataInstances) {
        if(dataInstance.partNumber === partNumber) {

            result.push({
                dbId         : dataInstance.dbId,
                path         : dataInstance.path,
                pathNumbers  : dataInstance.pathNumbers,
                instanceId   : dataInstance.instanceId,
                instancePath : dataInstance.instancePath,
                boundingBox  : dataInstance.boundingBox
            });

        }
    }

    sortArray(result, 'instanceId', 'integer');

    return result;

}
// function getComponentPath(id) {

//     let result = '|'

//     for(let dataInstance of dataInstances) {
//         if(dataInstance.dbId === id) {
//             console.log(dataInstance.name);
//             result = dataInstance.partNumber + ';' + dataInstance.name;
//             // result = dataInstance.name;
//             for(let property of dataInstance.properties) {
//                 if(property.attributeName === 'parent') {
//                     let partNumber = getComponentPath(property.displayValue);
//                     result = partNumber.split('.iam')[0] + '|' + result;
//                 }
//             }

//         }
//     }
//     // for(let dataInstance of dataInstances) {
//     //     if(dataInstance.dbId === id) {
//     //         console.log(dataInstance.name);
//     //         result = dataInstance.partNumber + ';xx' + dataInstance.name;
//     //         for(let property of dataInstance.properties) {
//     //             if(property.attributeName === 'parent') {
//     //                 let partNumber = getComponentPath(property.displayValue);
//     //                 result = partNumber.split('.iam')[0] + '|' + result;
//     //             }
//     //         }

//     //     }
//     // }

//     return result;

// }
function viewerGetComponentParents(event) {

    let id             = event.dbIdArray[0];
    let viewerInstance = getEventViewerInstance(event);
    let result         = []

    if(viewerInstance === null) return;

    getComponentParent(viewerInstance, result, id);

    return result;

}
function getComponentParent(viewerInstance, parents, id) {

    for(let dataInstance of viewerInstance.dataInstances) {
        if(dataInstance.dbId === id) {

            parents.push({
                dbId       : id,
                partNumber : dataInstance.partNumber,
                name       : dataInstance.name
            });

            for(let property of dataInstance.properties) {
                if(property.attributeName === 'parent') {
                    getComponentParent(viewerInstance, parents, property.displayValue);
                }
            }

        }
    }

}
// function viewerGetSelectedComponentPaths() {

//     if(!isViewerStarted()) return [];
//     if(viewer.model.is2d()) return;

//     let result = [];

//     for(let selection of viewer.getSelection()) {

//         let componentPath   = getComponentPath(selection).split('|');
//         let newPath         = '';

//         for(let index = 0; index <= componentPath.length - 1; index++) {

//             let segment = componentPath[index];

//             if(segment.indexOf('Component Pattern') < 0) {
//                 if(newPath !== '') newPath += '|';
//                 newPath += segment;
//             }

//         }

//         result.push(newPath);

//     }

//     return result;

// }


// Custom Controls: Add Selection Toolbar
function addCustomSelectionToolbar(viewerInstance, selectionToolbarFeatures) {

    let elemToolbar = $('#' + viewerInstance.id + '-customSelectionToolbar');

    if(elemToolbar.length > 0) {
        elemToolbar.show();
        return;
    }

    let selectToolbar = new Autodesk.Viewing.UI.ControlGroup(viewerInstance.id + '-customSelectionToolbar');

    selectToolbar.addClass('customSelectionToolbar');
    
    viewerInstance.viewer.toolbar.addControl(selectToolbar);

    if(selectionToolbarFeatures.includes('hide')     ) viewerAddHideSelected    (viewerInstance.id, selectToolbar);
    if(selectionToolbarFeatures.includes('ghosting') ) viewerAddGhostingToggle  (viewerInstance.id, selectToolbar);
    if(selectionToolbarFeatures.includes('highlight')) viewerAddHighlightToggle (viewerInstance.id, selectToolbar);
    if(selectionToolbarFeatures.includes('single')   ) viewerAddFitFirstInstance(selectToolbar);
    if(selectionToolbarFeatures.includes('fitToView')) viewerAddFitToView       (selectToolbar);
    if(selectionToolbarFeatures.includes('reset')    ) viewerAddResetButton     (selectToolbar);

}
function addCustomControl(toolbar, id, icon, tooltip) {

    let newButton = new Autodesk.Viewing.UI.Button(id);
        newButton.addClass('icon');
        newButton.setIcon(icon);
        newButton.setToolTip(tooltip);

    toolbar.addControl(newButton);

    return newButton;

}


// Custom Controls : Controls to hide selected components
function viewerAddHideSelected(id, toolbar) {

    let buttonHide = addCustomControl(toolbar, id + '-button-toggle-hide-selected', 'icon-remove', 'Hide selected components');
        buttonHide.addClass('button-toggle-hide-selected');
        buttonHide.onClick = function(event) { 

            event.preventDefault();
            event.stopPropagation();

            let viewerInstance = getEventViewerInstance(event);
            let elemEvent      = $(event.target);
            let elemViewer     = elemEvent.closest('.viewer');
            let elemToolbar    = elemEvent.closest('.customSelectionToolbar');
            let elemToggle     = elemViewer.find('.hidden-instances-toggle');
            let enabled        = elemToolbar.hasClass('hide-selected');
            let selected       = viewerInstance.viewer.getSelection().length;

            if(!enabled && selected > 0) {
                elemToolbar.addClass('hide-selected')
                for(let dbId of viewerInstance.viewer.getSelection()) {
                    hideInstance(viewerInstance, dbId);
                }
            } else if(enabled) {
                elemToolbar.toggleClass('hide-selected');
                elemToggle.addClass('icon-chevron-down').removeClass('icon-chevron-up');
            } else if(selected === 0) {
                elemToolbar.toggleClass('hide-selected');
            }

            updateHiddenInstancesControls(viewerInstance);

        };

    let elemHiddenInstances = $('<div></div>').appendTo($('#' + id))
        .attr('id', id + '-hidden-instances')
        .addClass('hidden-instances')
        .hide();

    let elemHiddenInstancesLabel = $('<div></div>').appendTo(elemHiddenInstances)
        .attr('id', id + '-hidden-instances-label')
        .addClass('hidden-instances-label');

    $('<div></div>').appendTo(elemHiddenInstancesLabel)
        .attr('id', id + '-hidden-instances-counter')
        .addClass('hidden-instances-counter');

    $('<div></div>').appendTo(elemHiddenInstancesLabel)
        .attr('id', id + '-hidden-instances-text')
        .addClass('hidden-instances-text');

    $('<div></div>').appendTo(elemHiddenInstances)
        .attr('id', id + '-hidden-instances-undo')
        .addClass('hidden-instances-undo')
        .addClass('button')
        .addClass('icon')
        .addClass('icon-undo')
        .attr('title', 'Unhide last component')
        .click(function() {
            let viewerInstance = getRootViewerInstance($(this));
            let hiddenInstances = viewerInstance.hiddenInstances;
            viewerInstance.viewer.show(hiddenInstances[hiddenInstances.length - 1].dbId);
            viewerInstance.hiddenInstances.pop()
            updateHiddenInstancesControls(viewerInstance);
            updateHiddenInstancesList(viewerInstance);

        });

    $('<div></div>').appendTo(elemHiddenInstances)
        .attr('id', id + '-hidden-instances-toggle')
        .addClass('hidden-instances-toggle')
        .addClass('button')
        .addClass('icon')
        .addClass('icon-chevron-down')
        .attr('title', 'Toggle list of hidden components')
        .click(function() {
            $(this).toggleClass('icon-chevron-down').toggleClass('icon-chevron-up');
            let viewerInstance = getRootViewerInstance($(this));
            updateHiddenInstancesList(viewerInstance);
        });

    $('<div></div>').appendTo(elemHiddenInstances)
        .attr('id', id + '-hidden-instances-clear')
        .addClass('hidden-instances-clear')
        .addClass('button')
        .addClass('icon')
        .addClass('icon-close')
        .attr('title', 'Unhide all components')
        .click(function() {
            let viewerInstance = getRootViewerInstance($(this));
            for(let instance of viewerInstance.hiddenInstances) viewerInstance.viewer.show(instance.dbId);
            viewerInstance.hiddenInstances = [];
            updateHiddenInstancesControls(viewerInstance);
            updateHiddenInstancesList(viewerInstance);
        });

}
function viewerHideSelected(event) {

    let panelId = event.target.panelId;
    let toolbar = $('#' + panelId + '-customSelectionToolbar');

    if(toolbar.length > 0) {
        if(toolbar.hasClass('hide-selected')) {

            let viewerInstance   = getViewerInstance(panelId);
            let elemHiddenToggle = $('#' + panelId + '-hidden-instances-toggle');

            if(viewerInstance.hiddenInstances.length === 0) elemHiddenToggle.addClass('icon-chevron-down').removeClass('icon-chevron-up');

            for(let dbId of event.dbIdArray) {
                hideInstance(viewerInstance, dbId)
            }

            updateHiddenInstancesControls(viewerInstance);
            updateHiddenInstancesList(viewerInstance);

            return true;
        }
    }
    
    return false;
}
function hideInstance(viewerInstance, dbId) {

    viewerInstance.viewer.hide(dbId);

    for(let instance of viewerInstance.dataInstances) {
        if(instance.dbId === dbId) {
            viewerInstance.hiddenInstances.push({
                dbId        : dbId,
                partNumber  : instance.partNumber,
                name        : instance.name
            });
            break;
        }
    }

}
function updateHiddenInstancesControls(viewerInstance) {

    let elemHiddenInstances = $('#' + viewerInstance.id + '-hidden-instances');
    let elemHiddenText      = $('#' + viewerInstance.id + '-hidden-instances-text');

    $('#' + viewerInstance.id + '-hidden-instances-counter').html(viewerInstance.hiddenInstances.length);

    if(viewerInstance.hiddenInstances.length === 1) elemHiddenText.html('hidden component');
    else                                            elemHiddenText.html('hidden components');

    if(viewerInstance.hiddenInstances.length === 0)  elemHiddenInstances.hide();
    else                                             elemHiddenInstances.css('display', 'flex');

}
function updateHiddenInstancesList(viewerInstance) {

    let elemHiddenToggle = $('#' + viewerInstance.id + '-hidden-instances-toggle');
    let elemHiddenList   = $('#' + viewerInstance.id + '-hidden-instances-list');

    if(elemHiddenToggle.hasClass('icon-chevron-down')) {

        elemHiddenList.remove();

    } else {
        
        if(elemHiddenList.length === 0) {
            elemHiddenList = $('<div></div>').appendTo($('#' + viewerInstance.id))
            .attr('id', viewerInstance.id + '-hidden-instances-list')
            .addClass('hidden-instances-list')
            .addClass('no-scrollbar');
        } else {
            elemHiddenList.html('');
        }
     
        for(let instance of viewerInstance.hiddenInstances) {

            let elemHiddenInstance = $('<div></div>').appendTo(elemHiddenList)
                .addClass('hidden-instance')
                .attr('data-id', instance.dbId);

            let elemHiddenInstanceLabel = $('<div></div>').appendTo(elemHiddenInstance)
                .addClass('hidden-instance-label');

            $('<div></div>').appendTo(elemHiddenInstanceLabel)
                .addClass('hidden-instance-number')
                .html(instance.partNumber);

            $('<div></div>').appendTo(elemHiddenInstanceLabel)
                .addClass('hidden-instance-name')
                .html(instance.name);

            $('<div></div>').appendTo(elemHiddenInstance)
                .addClass('hidden-instance-remove')
                .addClass('button')
                .addClass('icon')
                .addClass('icon-close')
                .attr('title', 'Unhide this component')
                .click(function() {
                    for(let index = 0; index < viewerInstance.hiddenInstances.length; index++) {
                        if(viewerInstance.hiddenInstances[index].dbId == $(this).parent().attr('data-id')) {
                            viewerInstance.viewer.show(viewerInstance.hiddenInstances[index].dbId);
                            viewerInstance.hiddenInstances.splice(index, 1);
                            break;
                        }
                    }
                    updateHiddenInstancesControls(viewerInstance);
                    updateHiddenInstancesList(viewerInstance);
                });

        }

    }

}
function resetHiddenInstances() {

    hiddenInstances = [];
    updateHiddenInstancesControls();
    updateHiddenInstancesList();

}


// Custom Controls : Ghosting Toggle
function viewerAddGhostingToggle(id, toolbar) {

    let buttonEnableGosting = addCustomControl(toolbar, id + '-button-toggle-ghosting-enable', 'icon-hide', 'Click to enable ghosting mode');
        buttonEnableGosting.addClass('button-toggle-ghosting-enable');
        buttonEnableGosting.onClick = function(event, id) { 
            let viewerInstance = getEventViewerInstance(event);
            viewerInstance.viewer.setGhosting(true);
            viewerInstance.ghosting = true;
            $('#' + viewerInstance.id + '-customSelectionToolbar').addClass('ghosting');
        };

    let buttonDisableGosting = addCustomControl(toolbar, id + '-button-toggle-ghosting-disable', 'icon-show', 'Click to disable ghosting mode');
        buttonDisableGosting.addClass('button-toggle-ghosting-disable');
        buttonDisableGosting.onClick = function(event) { 
            let viewerInstance = getEventViewerInstance(event);
            viewerInstance.viewer.setGhosting(false);
            viewerInstance.ghosting = false;
            $('#' + viewerInstance.id + '-customSelectionToolbar').removeClass('ghosting');            
        };

    toolbar.addClass('ghosting');

}
function viewerSetGhosting(viewerInstance, value) {

    let ghosting = value; 

    if(viewerInstance.hasOwnProperty('ghosting')) ghosting = viewerInstance.ghosting;

    viewerInstance.viewer.setGhosting(ghosting);

}


// Custom Controls : Highlight Toggle
function viewerAddHighlightToggle(id, toolbar) {

    let buttonOff = addCustomControl(toolbar, id + '-button-toggle-highlight-off', 'icon-highlight', 'Enable selection hihglight by color');
        buttonOff.addClass('button-toggle-highlight-off');
        buttonOff.onClick = function(event) { 
            let viewerInstance = getEventViewerInstance(event);
            toggleSelectionHighlight(viewerInstance, true);
            $('#' + viewerInstance.id + '-customSelectionToolbar').addClass('highlight-on');
            $('#' + viewerInstance.id + '-customSelectionToolbar').removeClass('highlight-off');
        };

    let buttonOn = addCustomControl(toolbar, id + '-button-toggle-highlight-on', 'icon-highlight', 'Disable selection highlight by color');
        buttonOn.addClass('button-toggle-highlight-on');
        buttonOn.onClick = function(event) { 
            let viewerInstance = getEventViewerInstance(event);
            toggleSelectionHighlight(viewerInstance, false);
            $('#' + viewerInstance.id + '-customSelectionToolbar').removeClass('highlight-on');
            $('#' + viewerInstance.id + '-customSelectionToolbar').addClass('highlight-off');
        };

    toolbar.addClass('highlight-off');

}
function toggleSelectionHighlight(viewerInstance, enabled) {

    viewerInstance.viewer.clearThemingColors();
    viewerInstance.highlight = enabled;

    if(!enabled) return;

    let allVisible = true;

    for(let dataInstance of viewerInstance.dataInstances) {
        if(!viewerInstance.viewer.isNodeVisible(dataInstance.dbId)) {
            allVisible = false;
            break;
        }
    }

    if(allVisible) return;

    for(let dataInstance of viewerInstance.dataInstances) {
        if(viewerInstance.viewer.isNodeVisible(dataInstance.dbId)) {
            viewerInstance.viewer.setThemingColor(dataInstance.dbId, colorModelSelected, null, true );
        }
    }

}


// Custom Controls : Fit first instance to view
function viewerAddFitFirstInstance(toolbar) {

    let buttionFitFirst = addCustomControl(toolbar, 'button-fit-first', 'icon-first', 'Fit first instance to view');
        buttionFitFirst.onClick = function(event) { 

            let dbIdFirst      = [];
            let viewerInstance = getEventViewerInstance(event);

            for(let dataInstance of viewerInstance.dataInstances) {
                if(dataInstance.selected === true) {
                    if(!isBlank(dataInstance.name)) {
                        if(dbIdFirst.length === 0) {
                            dbIdFirst.push(dataInstance.dbId);
                        }
                    }
                }
            }

            viewerInstance.viewer.fitToView(dbIdFirst);
            
        };
        
}


// Custom Controls : Fit (selection) to view
function viewerAddFitToView(toolbar) {

    let buttionFitToView = addCustomControl(toolbar, 'button-fit-to-view', 'icon-viewer', 'Fit (selected) components to view');
        buttionFitToView.onClick = function(event) { 

            let dbIds          = [];
            let viewerInstance = getEventViewerInstance(event);

            for(let dataInstance of viewerInstance.dataInstances) {
                if(viewerInstance.viewer.isNodeVisible(dataInstance.dbId)) {
                    dbIds.push(dataInstance.dbId);
                }
            }

            viewerInstance.viewer.fitToView(dbIds);

        };
        
}


// Custom Controls : Reset Button
function viewerAddResetButton(toolbar) {

    let buttonReset = addCustomControl(toolbar, 'button-reset-selection', 'icon-reset', 'Reset selection and show all models');
        buttonReset.onClick = function(event) { 
            viewerClickReset(event);
        };
        
}
function viewerClickReset(event) {

    let viewerInstance = getEventViewerInstance(event);

    if(viewerInstance === null) return;

    viewerInstance.viewer.showAll();
    viewerInstance.viewer.setViewFromFile();
    viewerInstance.hiddenInstances = [];

    updateHiddenInstancesControls(viewerInstance);
    updateHiddenInstancesList(viewerInstance);
    viewerResetColors(viewerInstance.id);
    viewerResetSelection(viewerInstance.id);
    viewerClickResetDone(viewerInstance);
}
function viewerClickResetDone(viewerInstance) {

    $('.tree-item'    ).removeClass('selected');
    $('.bom-item'     ).removeClass('selected');
    $('.flat-bom-item').removeClass('selected');

}


// Custom Controls : Standard Views Toolbar
function viewerAddViewsToolbar(viewerInstance) {

    let elemToolbar = $('#' + viewerInstance.id + '-customViewsToolbar');

    if(elemToolbar.length > 0) { elemToolbar.show(); return; }

    let newToolbar = new Autodesk.Viewing.UI.ControlGroup(viewerInstance.id + '-customViewsToolbar');

    newToolbar.addClass('customViewsToolbar');
    
    addCustomViewControl(viewerInstance, newToolbar, 'my-view-home-button', 'home', 'icon-home', 'Home');

    if(!isiPad) {

        addCustomViewControl(viewerInstance, newToolbar, 'my-view-front-button' , 'front' , 'icon-north-east', 'Front View');
        addCustomViewControl(viewerInstance, newToolbar, 'my-view-back-button'  , 'back'  , 'icon-south-west', 'Back View');
        addCustomViewControl(viewerInstance, newToolbar, 'my-view-left-button'  , 'left'  , 'icon-east', 'Left View');
        addCustomViewControl(viewerInstance, newToolbar, 'my-view-right-button' , 'right' , 'icon-west', 'Right View');
        addCustomViewControl(viewerInstance, newToolbar, 'my-view-top-button'   , 'top'   , 'icon-south', 'Top View');
        addCustomViewControl(viewerInstance, newToolbar, 'my-view-bottom-button', 'bottom', 'icon-north', 'Bottom View');

    }

    viewerInstance.viewer.toolbar.addControl(newToolbar);

}
function addCustomViewControl(viewerInstance, toolbar, id, view, icon, tooltip) {
    
    var button = new Autodesk.Viewing.UI.Button(viewerInstance.id + '-' + id);
        button.addClass('icon');
        button.setIcon(icon);
        button.setToolTip(tooltip);
    
    if(view === 'home') {
        button.onClick = function(e) { viewerInstance.viewer.setViewFromFile(); };
    } else {
        button.onClick = function(e) { 
            viewerInstance.viewer.getExtension('Autodesk.ViewCubeUi', function(viewCubeExtension) {
                viewCubeExtension.setViewCube(view);
            });
        };
    }
    
    toolbar.addControl(button);
    
}


// Custom Controls : Markups
function viewerAddMarkupControls(viewerInstance) {

    // if(typeof includeSaveButton === 'undefined') includeSaveButton = false;

    let elemToolbar       =  $('#' + viewerInstance.id + '-custom-markup-toolbar');
    let includeSaveButton = ($('#' + viewerInstance.id + '-markups-list').length > 0);

    if(elemToolbar.length > 0) { elemToolbar.show(); return; }

    let elemMarkupToolbar = $('<div></div>').appendTo($('#' + viewerInstance.id))
        .attr('id', viewerInstance.id + '-markup-toolbar')
        .addClass('viewer-markup-toolbar')
        .addClass('hidden')
        .addClass('set-defaults');

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

    addMarkupActionControl(elemMarkupGroupActions, true, 'undo', 'undo', 'Undo');
    addMarkupActionControl(elemMarkupGroupActions, true, 'redo', 'redo', 'Redo');

    if(includeSaveButton) {
        addMarkupActionControl(elemMarkupGroupActions, true, 'delete', 'clear', 'Clear all markups');
        addMarkupActionControl(elemMarkupGroupActions, true, 'close' , 'exit' , 'Close markup toolbar');
        addMarkupActionControl(elemMarkupGroupActions, false, 'Save' , 'save' , 'Save markup');
        elemMarkupGroupActions.addClass('with-save-button');
    } else {
        addMarkupActionControl(elemMarkupGroupActions, false, 'Clear', 'clear', 'Clear all markups');
        addMarkupActionControl(elemMarkupGroupActions, false, 'Close', 'exit' , 'Close markup toolbar');
    }

    $('<canvas>').appendTo($('body')).attr('id', viewerInstance.id + '-markup-image').addClass('hidden');

    let newToolbar = new Autodesk.Viewing.UI.ControlGroup(viewerInstance.id + '-custom-markup-toolbar');
    // let newButton  = addCustomControl(newToolbar, 'my-markup-button', 'icon-markup', 'Markup');
    let newButton  = addCustomControl(newToolbar, viewerInstance.id + '-markup-button', 'icon-markup', 'Markup');
    
    newButton.addClass('viewer-markup-button');
    newButton.addClass('enable-markup');
    newButton.onClick = function() {

        let viewerInstance = getRootViewerInstance($(this));
        var promise        = viewerInstance.viewer.loadExtension('Autodesk.Viewing.MarkupsCore');

        promise.then(function(extension){  

            viewerInstance.markup = extension; 

            if(viewerInstance.restoreMarkupState !== '') {

                markupsvg = restoreMarkupSVG;
                viewerInstance.viewer.restoreState(viewerInstance.restoreMarkupState, null, true);

            }

            viewerInstance.markup.enterEditMode();
            viewerInstance.markup.show();

            let elemMarkupsList = $('#' + viewerInstance.id + '-markups-list');

            if(elemMarkupsList.length > 0) {
                if(elemMarkupsList.children('.selected').length === 0) {
                    let placeholders = elemMarkupsList.children('.placeholder');
                    if(placeholders.length === 0) elemMarkupsList.children().first().addClass('selected');
                    else placeholders.first().addClass('selected');
                }
            }

            baseStrokeWidth = viewerInstance.markup.getStyle()['stroke-width'];

            let elemMarkupToolbar = $('#' + viewerInstance.id + '-markup-toolbar');
                
            if(elemMarkupToolbar.hasClass('set-defaults')) {
                elemMarkupToolbar.find('.viewer-markup-toggle.color').first().click();
                elemMarkupToolbar.find('.viewer-markup-toggle.width').first().click();
                elemMarkupToolbar.find('.viewer-markup-toggle.shape').first().click();
                elemMarkupToolbar.removeClass('set-defaults');
            } else {
                elemMarkupToolbar.find('.viewer-markup-toggle.color.selected').click();
                elemMarkupToolbar.find('.viewer-markup-toggle.width.selected').click();
                elemMarkupToolbar.find('.viewer-markup-toggle.shape.selected').click();
            }
            
            elemMarkupToolbar.toggleClass('hidden');
        
        });

    };

    viewerInstance.viewer.toolbar.addControl(newToolbar);


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

    $('<div></div>').appendTo(elemParent)
        .addClass('viewer-markup-toggle')
        .addClass('color')
        .css('background', '#' + color)
        .attr('data-color', color)
        .click(function() {
            let viewerInstance = getRootViewerInstance($(this));
            viewerInstance.markupStyle['stroke-color'] = '#' + $(this).attr('data-color');
            viewerInstance.markup.setStyle(viewerInstance.markupStyle);
            $(this).siblings().removeClass('selected');
            $(this).addClass('selected');
        });

}
function addMarkupWidthControl(elemParent, label, width) {

    $('<div></div>').appendTo(elemParent)
        .addClass('viewer-markup-toggle')
        .addClass('width')
        .html(label)
        .attr('data-width', width)
        .click(function() {
            let viewerInstance = getRootViewerInstance($(this));
            viewerInstance.markupStyle['stroke-width'] = baseStrokeWidth * 1 * Number($(this).attr('data-width'));
            viewerInstance.markupStyle['font-size'   ] = baseStrokeWidth * 5 * Number($(this).attr('data-width'));
            viewerInstance.markup.setStyle(viewerInstance.markupStyle);
            $(this).siblings().removeClass('selected');
            $(this).addClass('selected');
        });

}
function addMarkupShapeControl(elemParent, shape, icon) {

    $('<div></div>').appendTo(elemParent)
        .addClass('viewer-markup-toggle')
        .addClass('shape')
        .addClass('icon')
        .attr('data-shape', shape)
        .html(icon)
        .click(function() {

            let viewerInstance = getRootViewerInstance($(this));
            let markup         = viewerInstance.markup;
            let shape          = $(this).attr('data-shape');
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

            viewerInstance.markup.changeEditMode(mode);
            viewerInstance.markup.setStyle(viewerInstance.markupStyle);
            $(this).siblings().removeClass('selected');
            $(this).addClass('selected');

        });

}
function addMarkupActionControl(elemParent, icon, content, action, tooltip) {

    let elemControl = $('<div></div>').appendTo(elemParent)
        .html(content)
        .attr('data-action', action)
        .click(function() {

            let viewerInstance = getRootViewerInstance($(this));

            switch(action) {

                case 'undo'  : viewerInstance.markup.undo();  break;
                case 'redo'  : viewerInstance.markup.redo();  break;
                case 'clear' : viewerInstance.markup.clear(); break;
                case 'exit'  : viewerLeaveMarkupMode({ id : viewerInstance.id }); break;
                case 'save'  : viewerSaveItemMarkup(viewerInstance.id); break;

            }

        });

    if(typeof tooltip !== 'undefined') elemControl.attr('title', tooltip);
        
    if(icon) {
        elemControl.addClass('icon');
        elemControl.addClass('viewer-markup-toggle');
    } else {
        elemControl.addClass('viewer-markup-button');
    }

}
function viewerLeaveMarkupMode(params) {

    if(isBlank(params)) params = {};

    let [ viewerInstance, viewer, proceed ] = getViewerInstanceRunning(params.id, true);

    if(!proceed) return;    

    let elemNoteControl = $('#' + viewerInstance.id + '-note-toolbar');

    // if(elemNoteControl.length > 0) {
    //     elemNoteControl.toggleClass('hidden');
    //     closedViewerMarkup(markup.generateData(), viewer.getState());
    // }

    $('#' + viewerInstance.id + '-markup-toolbar').addClass('hidden');

    if(typeof viewerInstance.markup === 'undefined') return;

    viewerInstance.markup.leaveEditMode();
    viewerInstance.markup.hide();

    viewerInstance.viewer.unloadExtension('Autodesk.Viewing.MarkupsCore');

    setViewerFeatures(viewerInstance);

    viewerInstance.restoreMarkupSVG   = '';
    viewerInstance.restoreMarkupState = '';

    $('#' + viewerInstance.id + '-markups-list').children('.selected').removeClass('selected');


}
function viewerSaveItemMarkup(viewerId) {

    let fieldId  = $('#' + viewerId + '-markups-list').find('.markup.selected').first().attr('id');
    let linkItem = $('#' + viewerId).closest('.item').attr('data-link');

    $('#overlay').show();

    viewerCaptureScreenshot('viewer', fieldId, function() {

        let elemMarkupImage = $('#' + fieldId);

        let params = { 
            link      : linkItem,
            image     : {
                fieldId : fieldId,
                value   : elemMarkupImage[0].toDataURL('image/jpg')
            }
        };

        $.post({
            url         : '/plm/upload-image', 
            contentType : 'application/json',
            data        : JSON.stringify(params)
        }, function() {
            $('#overlay').hide();
            elemMarkupImage.removeClass('placeholder');
        });

    });

}


// Capture screenshot with markup for image upload
function viewerCaptureScreenshot(viewerId, canvasId, callback) {

    let [ viewerInstance, viewer, proceed ] = getViewerInstanceRunning(viewerId, false);

    if(!proceed) {
        callback();
    } else {

        if(isBlank(canvasId)) canvasId = 'viewer-markup-image';

        if($('#' + canvasId).length === 0) {

            callback();
            
        } else {

            var screenshot  = new Image();
            var imageWidth  = viewer.container.clientWidth;
            var imageHeight = viewer.container.clientHeight;

            screenshot.onload = function () {
                    
                let canvas        = document.getElementById(canvasId);
                    canvas.width  = viewer.container.clientWidth;
                    canvas.height = viewer.container.clientHeight;

                let context = canvas.getContext('2d');
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.drawImage(screenshot, 0, 0, canvas.width, canvas.height); 
                    
                if(!$('#' + viewerId + '-markup-toolbar').hasClass('hidden')) {
                    viewerInstance.markup.renderToCanvas(context, function() {
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
    }

}


// Capture screenshot with markup for image upload
function viewerCapturePerspective(view, id, callback) {

    let screenshot  = new Image();
    let imageWidth  = viewer.container.clientWidth;
    let imageHeight = viewer.container.clientHeight;
    let viewcuiext  = viewer.getExtension('Autodesk.ViewCubeUi');

    screenshot.onload = function () {
           
        let canvas          = document.getElementById(id);
            canvas.width    = viewer.container.clientWidth;
            canvas.height   = viewer.container.clientHeight;

        let context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(screenshot, 0, 0, canvas.width, canvas.height); 

        callback();
                
    }

    if((view === 'home') || (view === 'perspective')) {
        viewer.setViewFromFile();
    } else  viewcuiext.setViewCube(view)

    setTimeout(() => {
        viewer.getScreenShot(imageWidth, imageHeight, function (blobURL) {
            screenshot.src = blobURL;
        });
    }, 800);

}


function onViewerStateRestored(event) {
    
    // Markup restore
    
    if(typeof markup === 'undefined') return;
     
    markup.unloadMarkupsAllLayers();
    
    if(markupsvg !== '') {
        markup.show();
        markup.loadMarkups(markupsvg, 'review');
        
    }
    
}