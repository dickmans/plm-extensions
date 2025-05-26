let colorModelSelected          = new THREE.Vector4(0.02, 0.58, 0.84, 0.5);
let colorModelHighlighted       = new THREE.Vector4(0.9, 0.1, 0.1, 0.5);
let newInstance                 = true;
let ghosting                    = true;
let disableViewerSelectionEvent = false;
let viewerId                    = 'viewer';
let viewerDone                  = false;
let viewerGeometryLoaded        = false;
let viewerObjectTreeCreated     = false;
let viewerFiles                 = [];
let dataInstances               = [];
let hiddenInstances             = [];
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

let viewerSettings = {
    backgroundColor  : [255, 255, 255, 255, 255, 255],
    antiAliasing     : true,
    ambientShadows   : true,
    groundReflection : false,
    groundShadow     : true,
    lightPreset      : 4
}

// Launch Viewer
function initViewer(id, viewables, params) {

    if( isBlank(viewables)) return;
    if(!isBlank(id)       ) viewerId = id;
    if( isBlank(params)   ) params   = {};

    if(!Array.isArray(viewables)) viewables = [viewables];

    viewerFiles             = viewables;
    viewerGeometryLoaded    = false;
    viewerObjectTreeCreated = false;

    let surfaceLevel = getSurfaceLevel($('#' + viewerId)).split('surface-')[1];
    viewerSettings.backgroundColor = viewerBGColors[theme][surfaceLevel];

    if(!isBlank(params.backgroundColor)) {
        viewerSettings.backgroundColor = params.backgroundColor;
    } else if(surfaceLevel === 'level-0') {
        viewerSettings.backgroundColor = config.viewer.backgroundColor;
    }

    if(Array.isArray(viewerSettings.backgroundColor)) {
        if(viewerSettings.backgroundColor.length === 3) {
            viewerSettings.backgroundColor.push(viewerSettings.backgroundColor[0]);
            viewerSettings.backgroundColor.push(viewerSettings.backgroundColor[1]);
            viewerSettings.backgroundColor.push(viewerSettings.backgroundColor[2]);
        }
    } else {
        viewerSettings.backgroundColor = [viewerSettings.backgroundColor, viewerSettings.backgroundColor, viewerSettings.backgroundColor, viewerSettings.backgroundColor, viewerSettings.backgroundColor, viewerSettings.backgroundColor];
    }

    if(!isBlank(params.antiAliasing)) {
        viewerSettings.antiAliasing = params.antiAliasing;
    } else if(!isBlank(config.viewer.antiAliasing)) {
        viewerSettings.antiAliasing = config.viewer.antiAliasing;
    }
    if(!isBlank(params.ambientShadows)) {
        viewerSettings.ambientShadows = params.ambientShadows;
    } else if(!isBlank(config.viewer.ambientShadows)) {
        viewerSettings.ambientShadows = config.viewer.ambientShadows;
    }
    if(!isBlank(params.groundReflection)) {
        viewerSettings.groundReflection = params.groundReflection;
    } else if(!isBlank(config.viewer.groundReflection)) {
        viewerSettings.groundReflection = config.viewer.groundReflection;
    }
    if(!isBlank(params.groundShadow)) {
        viewerSettings.groundShadow = params.groundShadow;
    } else if(!isBlank(config.viewer.groundShadow)) {
        viewerSettings.groundShadow = config.viewer.groundShadow;
    }
    if(!isBlank(params.lightPreset)) {
        viewerSettings.lightPreset = params.lightPreset;
    } else if(!isBlank(config.viewer.lightPreset)) {
        viewerSettings.lightPreset = config.viewer.lightPreset;
    }

    $('body').addClass('no-viewer-cube');
    $('#' + viewerId + '-message').hide();
    $('#' + viewerId + '-processing').hide();
    $('#' + viewerId).show();
    $('#' + viewerId + '-file-browser').remove();

    dataInstances = [];

    let options = {
        logLevel    : 1,
        env         : 'AutodeskProduction',
        api         : 'derivativeV2',  // for models uploaded to EMEA change this option to 'derivativeV2_EU'
        // region : 'EMEA',
        // api         : 'derivativeV2_EU',  // for models uploaded to EMEA change this option to 'derivativeV2_EU'
        // env: 'AutodeskProduction2',
        // api: 'streamingV2',   // for models uploaded to EMEA change this option to 'streamingV2_EU'
        getAccessToken  : function(onTokenReady) {
            var token = viewables[0].token;
            var timeInSeconds = 3600; 
            onTokenReady(token, timeInSeconds);
        }
    }; // see https://aps.autodesk.com/en/docs/viewer/v7/reference/globals/TypeDefs/InitOptions/

    if((typeof viewer === 'undefined') || (params.restartViewer)) { 

        splitPartNumberBy      = (isBlank(config.viewer.splitPartNumberBy))      ? ''  : config.viewer.splitPartNumberBy;
        splitPartNumberIndexes = (isBlank(config.viewer.splitPartNumberIndexes)) ? [0] : config.viewer.splitPartNumberIndexes;
        splitPartNumberSpacer  = (isBlank(config.viewer.splitPartNumberSpacer))  ? ''  : config.viewer.splitPartNumberSpacer;

        Autodesk.Viewing.Initializer(options, function() {

            var htmlDiv = document.getElementById(viewerId);
            viewer = new Autodesk.Viewing.Private.GuiViewer3D(htmlDiv, { 
                modelBrowserExcludeRoot     : false,
                modelBrowserStartCollapsed  : true
            });

            viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT,       onViewerToolbarCreated   );
            viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT,       onViewerGeometryLoaded   );
            viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT,   onObjectTreeCreated      );
            viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT,     onViewerSelectionChanged );
            viewer.addEventListener(Autodesk.Viewing.VIEWER_STATE_RESTORED_EVENT, onViewerRestore          );

            var startedCode = viewer.start();
            if (startedCode > 0) {
                console.error('Failed to create a Viewer: WebGL not supported.');
                return;
            }      
            
            if(!isBlank(viewerFeatures.contextMenu)) {
                if(!viewerFeatures.contextMenu) viewer.setContextMenu(null);
            }

            if(viewables[0].type === 'Adobe PDF') {
                viewer.loadExtension('Autodesk.PDF').then( () => {
                    viewerFeatures.markup = true;
                    viewer.setBackgroundColor(viewerSettings.backgroundColor[0], viewerSettings.backgroundColor[1], viewerSettings.backgroundColor[2], viewerSettings.backgroundColor[3], viewerSettings.backgroundColor[4], viewerSettings.backgroundColor[5]);
                    viewer.loadModel(viewables[0].link, viewer, onPDFLoadSuccess, onDocumentLoadFailure);
                });

            } else {
                Autodesk.Viewing.Document.load('urn:'+ viewables[0].urn, onDocumentLoadSuccess, onDocumentLoadFailure);
            }
            
        });
    
    } else {

        viewerUnloadAllModels();
        newInstance = false;
        Autodesk.Viewing.Document.load('urn:'+ viewables[0].urn, onDocumentLoadSuccess, onDocumentLoadFailure);

    } 
    
}
function onPDFLoadSuccess(doc) {

    viewerDone = true;
    setViewerFeatures();
}
function onDocumentLoadSuccess(doc) {

    viewer.setGhosting(true);
    viewer.setGroundReflection(viewerSettings.groundReflection);
    viewer.setGroundShadow(viewerSettings.groundShadow);
    viewer.setQualityLevel(viewerSettings.ambientShadows, viewerSettings.antiAliasing);
    viewer.setLightPreset(viewerSettings.lightPreset);
    viewer.setEnvMapBackground(false);
    viewer.setProgressiveRendering(true);

    let viewable = doc.getRoot().getDefaultGeometry();
    
    if (viewable) {
        viewer.loadDocumentNode(doc, viewable).then(function(result) {
        // viewer.loadDocumentNode(doc, viewable, {globalOffset: {x:0,y:0,z:0}}).then(function(result) {
            // viewer.hideAll
            viewer.setBackgroundColor(viewerSettings.backgroundColor[0], viewerSettings.backgroundColor[1], viewerSettings.backgroundColor[2], viewerSettings.backgroundColor[3], viewerSettings.backgroundColor[4], viewerSettings.backgroundColor[5]);
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
    viewerGeometryLoaded = true;
    if(viewerObjectTreeCreated) processViewerFeaturesAndData();
}
function onObjectTreeCreated() {
    viewerObjectTreeCreated = true;
    if(viewerGeometryLoaded) processViewerFeaturesAndData(); 
}
function processViewerFeaturesAndData() {
    setViewerFeatures();
    setViewerInstancedData();
}
function onViewerLoadingDone() {}
function setViewerFeatures() {

    if(viewer.model === null) return;

    if (Object.keys(viewerFeatures).length === 0) {
        viewer.toolbar.setVisible(true);
        return;
    }

    let selectionToolbarFeatures = [];
    let viewsToolbar             = false;
    let selectFiles              = false;

    for(let viewerFeature of Object.keys(viewerFeatures)) {

        if(viewerFeatures[viewerFeature] === false) {

            let elemParent = null;
            let controlId  = '';

            switch(viewerFeature) {

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

            if(viewerFeature === 'markup') {

                viewerAddMarkupControls(); 
            
            } else if(viewerFeature === 'selectFile') {

                selectFiles = viewerFeatures[viewerFeature]; 

            } else if(viewer.model.is3d()) {

                switch(viewerFeature) {
                    
                    case 'hide'      : selectionToolbarFeatures.push(viewerFeature); break;
                    case 'ghosting'  : selectionToolbarFeatures.push(viewerFeature); break;
                    case 'highlight' : selectionToolbarFeatures.push(viewerFeature); break;
                    case 'single'    : selectionToolbarFeatures.push(viewerFeature); break;
                    case 'fitToView' : selectionToolbarFeatures.push(viewerFeature); break;
                    case 'reset'     : selectionToolbarFeatures.push(viewerFeature); break;
                    case 'views'     : viewsToolbar = true;      break;

                }

            }

        }      
    }

    if(viewer.model.is2d()) {

        $('#customSelectionToolbar').hide();
        $('#my-custom-toolbar-views').hide();

    } else {

        addCustomSelectionToolbar(selectionToolbarFeatures);
        if(viewsToolbar) viewerAddViewsToolbar();

    }

    if(!isBlank(viewerFeatures.cube)) {
        if(viewerFeatures.cube) $('body').removeClass('no-viewer-cube');
    }

    if(selectFiles) insertFileBrowser();
    viewer.toolbar.setVisible(true);

}
function insertFileBrowser() {

    let elemFileBrowser = $('#viewer-file-browser');

    if(viewerFiles.length > 1) {

        let fileBrowserToolbar = new Autodesk.Viewing.UI.ControlGroup('customFileBrowserToolbar');
            viewer.toolbar.addControl(fileBrowserToolbar);

        let button = addCustomControl(fileBrowserToolbar, 'button-file-browser', 'icon-folder', 'Switch viewable file');
            button.onClick = function() { 
                $('#viewer-file-browser').css('display', 'flex');
            };

        if(elemFileBrowser.length === 0) {

            elemFileBrowser = $('<div></div>').appendTo($('#viewer'))
                .attr('id', 'viewer-file-browser');

            let elemFileBrowserPanel = $('<div></div>').appendTo(elemFileBrowser)
                .addClass('surface-level-1')
                .attr('id', 'viewer-file-browser-panel');

            let elemFilesHeader = $('<div></div>').appendTo(elemFileBrowserPanel)
                .attr('id', 'viewer-file-browser-header');

            $('<div></div>').appendTo(elemFilesHeader)
                .attr('id', 'viewer-file-browser-title')
                .html('Select Viewing File')

            $('<div></div>').appendTo(elemFilesHeader)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-close')
                .click(function() {
                    $('#viewer-file-browser').hide();
                })
           
            let elemFilesList = $('<div></div>').appendTo(elemFileBrowserPanel)
                .addClass('tiles')    
                .addClass('list')    
                .addClass('xl')    
                .attr('id', 'viewer-file-browser-list');

            for(let viewerFile of viewerFiles) {

                let elemFile = $('<div></div>').appendTo(elemFilesList)
                    .addClass('tile')
                    .click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        $(this).siblings().removeClass('selected');
                        $(this).addClass('selected');
                        $('#viewer-file-browser').hide();
                        viewerSwitchFile($(this).index());
                    })

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

            elemFilesList.children('.tile').first().addClass('selected');

        }
    }

}

function setViewerInstancedData() {

    dataInstances = [];

    if(viewer.model.is2d()) return;

    let instanceTree    = viewer.model.getInstanceTree();
    let promises        = [];

    for(let i = 1; i < instanceTree.objectCount; i++) promises.push(getPropertiesAsync(i));

    Promise.all(promises).then(function(instances) {
        for(let instance of instances) {
            if(!isBlank(instance.name)) {
                let partNumber = getInstancePartNumber(instance);
                if(partNumber !== null) {
                    instance.partNumber = partNumber;
                    dataInstances.push(instance);
                }
            }
        }

        for(let instance of dataInstances) {
            instance.path = getInstanceParents(instance);
            let pathShort = '';
            if(instance.path.indexOf('|') > 0) {
                let split = instance.path.split('|');
                if(split.pop() !== instance.partNumber) instance.path += '|' + instance.partNumber;
                pathShort = instance.path.substring(split[0].length + 1);
            }
            instance.pathShort = pathShort;
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
function getInstancePartNumber(instance) {

    for(let partNumberPropery of config.viewer.numberProperties) {
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
                return partNumber;
            }
        }
    }
    
    return null;

}
function getInstanceParents(instance) {

    let result = '';

    for(let property of instance.properties) {
        if(property.attributeName === 'parent') {
            for(let dataInstance of dataInstances) {
                if(dataInstance.dbId === property.displayValue) {
                    let parents = getInstanceParents(dataInstance);
                    if(parents !== '') parents += '|';
                    result = parents + dataInstance.partNumber;
                    break;
                }
            }
            break;
        }
    }
    
    return result;

}
function setViewerInstancedDataDone() {
    onViewerLoadingDone();
}



// Switch to other file
function viewerSwitchFile(index) {

    let viewerFile = viewerFiles[index];

    newInstance = false;

    viewer.toolbar.setVisible(false);
    viewerUnloadAllModels();

    viewerDone  = false;

    if(viewerFile.type === 'Adobe PDF') {

        viewer.loadExtension('Autodesk.PDF').then( () => {
            viewerFeatures.markup = true;
            viewer.setBackgroundColor(viewerSettings.backgroundColor[0], viewerSettings.backgroundColor[1], viewerSettings.backgroundColor[2], viewerSettings.backgroundColor[3], viewerSettings.backgroundColor[4], viewerSettings.backgroundColor[5]);
            viewer.loadModel(viewerFile.link, viewer, onPDFLoadSuccess, onDocumentLoadFailure);
        });    

    } else {

        Autodesk.Viewing.Document.load('urn:' + viewerFile.urn, function(doc) {
            
            let viewable = doc.getRoot().getDefaultGeometry();
            
            if (viewable) {
                viewer.loadDocumentNode(doc, viewable, {globalOffset: {x:0,y:0,z:0}}).then(function(result) {
                    viewer.setBackgroundColor(viewerSettings.backgroundColor[0], viewerSettings.backgroundColor[1], viewerSettings.backgroundColor[2], viewerSettings.backgroundColor[3], viewerSettings.backgroundColor[4], viewerSettings.backgroundColor[5]);
                    viewerDone = true;
                }).catch(function(err) {
                    console.log(err);
                });
            }
                
                
        });
            
    }

}



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

    hideSelectedInstance(event);
    onViewerSelectionChangedDone(partNumbers, event);

}
function onViewerSelectionChangedDone(partNumbers, event) {}




// Get part number of selected component
function viewerGetSelectedPartNumber(event, callback) {

    if(event.dbIdArray.length === 1) {

        viewer.getProperties(event.dbIdArray[0], function(data) {

            let partNumber = data.name.split(':')[0];
            let match      = false;

            for(let partNumberProperty of config.viewer.numberProperties) {
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



// Select / deselect items in the viewer
function viewerSelectModel(partNumber, params) {

    viewerSelectModels([partNumber], params);

}
function viewerSelectModels(partNumbers, params) {

    if(!isViewerStarted()) return;
    if(viewer.model.is2d()) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let isolate     = true;    // Enable isolation of selected component(s)
    let ghosting    = false;   // Enforce ghosting of hidden components
    let fitToView   = true;    // Zoom in / out to fit selection into view 
    let highlight   = true;    // Highlight given partNumber(s) by defined color (colorModelSelected)
    let resetColors = true;    // Reset colors of all componente before highlighting the partNumber(s)
    let keepHidden  = true;    // Keep selectively hidden components hidden
    let usePath     = false;   // If list of paths is provided instead of part numbers
    let color       = colorModelSelected; 


    if( isBlank(params)            )      params = {};
    if(!isBlank(params.isolate)    )     isolate = params.isolate;
    if(!isBlank(params.ghosting)   )    ghosting = params.ghosting;
    if(!isBlank(params.fitToView)  )   fitToView = params.fitToView;
    if(!isBlank(params.highlight)  )   highlight = params.highlight;
    if(!isBlank(params.resetColors)) resetColors = params.resetColors;
    if(!isBlank(params.keepHidden) )  keepHidden = params.keepHidden;
    if(!isBlank(params.usePath)    )     usePath = params.usePath;
    if(!isBlank(params.color)      )       color = params.color;

    disableViewerSelectionEvent = true;

    if(!keepHidden) {
        hiddenInstances = [];
        updateHiddenInstancesControls();
        updateHiddenInstancesList();
    }

    let dbIds = [];
    
    if(isolate)     viewer.hideAll();
    if(resetColors) viewer.clearThemingColors();

    if(!isBlank(viewerFeatures.highlight)) {
        if(viewerFeatures.highlight) {
            let toolbar = $('#customSelectionToolbar');
            if(toolbar.length > 0) {
                highlight = toolbar.hasClass('highlight-on');
            }
        }
    }

    for(let dataInstance of dataInstances) {
        
        let isSelected     = false;
        let instanceNumber =  (usePath) ? dataInstance.pathShort : dataInstance.partNumber;
        
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

    for(instance of hiddenInstances) viewer.hide(instance.dbId);

    viewerSetGhosting(ghosting);
    if(fitToView) viewer.fitToView(dbIds);

    disableViewerSelectionEvent = false;

}
function viewerSelectAll(params) {

    if(!isViewerStarted()) return;
    if(viewer.model.is2d()) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let fitToView   = true;     // Zoom in / out to fit selection into view 
    let highlight   = true;     // Highlight given partNumber(s) by defined color (colorModelSelected)
    let resetColors = true;     // Reset colors of all componente before highlighting the partNumber(s)
    let keepHidden  = true;     // Keep selectively hidden components hidden
    let color       = colorModelSelected; 

    if( isBlank(params)            )      params = {};
    if(!isBlank(params.fitToView)  )   fitToView = params.fitToView;
    if(!isBlank(params.highlight)  )   highlight = params.highlight;
    if(!isBlank(params.resetColors)) resetColors = params.resetColors;
    if(!isBlank(params.keepHidden) )  keepHidden = params.keepHidden;
    if(!isBlank(params.color)      )       color = params.color;

    disableViewerSelectionEvent = true;
    viewer.showAll();

    if(!keepHidden) {
        hiddenInstances = [];
        updateHiddenInstancesControls();
        updateHiddenInstancesList();
    }
    
    if(resetColors) viewer.clearThemingColors();

    if(highlight) {
        for(let dataInstance of dataInstances) {
            viewer.setThemingColor(dataInstance.dbId, color, null, true );
        }
    }

    for(instance of hiddenInstances) viewer.hide(instance.dbId);

    if(fitToView) viewer.setViewFromFile();

    disableViewerSelectionEvent = false;

}
function viewerSelectInstances(dbIds, params) {

    if(!isViewerStarted()) return;
    if(viewer.model.is2d()) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let isolate     = true;    // Enable isolation of selected component(s)
    let ghosting    = false;   // Enforce ghosting of hidden components
    let fitToView   = true;    // Zoom in / out to fit selection into view 
    let highlight   = true;    // Highlight given partNumber(s) by defined color (colorModelSelected)
    let resetColors = true;    // Reset colors of all componente before highlighting the partNumber(s)
    let keepHidden  = true;    // Keep selectively hidden components hidden
    let color       = colorModelSelected; 

    if( isBlank(params)            )      params = {};
    if(!isBlank(params.isolate)    )     isolate = params.isolate;
    if(!isBlank(params.ghosting)   )    ghosting = params.ghosting;
    if(!isBlank(params.fitToView)  )   fitToView = params.fitToView;
    if(!isBlank(params.highlight)  )   highlight = params.highlight;
    if(!isBlank(params.resetColors)) resetColors = params.resetColors;
    if(!isBlank(params.keepHidden) )  keepHidden = params.keepHidden;
    if(!isBlank(params.color)      )       color = params.color;

    disableViewerSelectionEvent = true;

    if(!keepHidden) {
        hiddenInstances = [];
        updateHiddenInstancesControls();
        updateHiddenInstancesList();
    }    

    if(isolate)     viewer.hideAll();
    if(resetColors) viewer.clearThemingColors();
    
    for(let dbId of dbIds) {
        dbId = Number(dbId);
        if(hiddenInstances.indexOf(dbId < 0)) {
            viewer.show(dbId);
            if(highlight) viewer.setThemingColor(dbId, color, null, true );
        }
    }
    
    viewerSetGhosting(ghosting);
    if(fitToView) viewer.fitToView(dbIds);

    disableViewerSelectionEvent = false;

}
function viewerHighlightInstances(partNumber, ids, params) {
    
    // Select all occurences of a partNumber and highlight defined instance IDs

    if(!isViewerStarted()) return;
    if(isBlank(partNumber)) return;
    if(isBlank(ids)) return;
    if(viewer.model.is2d()) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let isolate         = true;    // Enable isolation of selected component(s)
    let ghosting        = false;   // Enforce ghosting of hidden components
    let fitToView       = true;    // Zoom in / out to fit selection into view 
    let resetColors     = true;    // Reset colors of all componente before highlighting the partNumber(s)
    let keepHidden      = true;    // Keep selectively hidden components hidden
    let color           = colorModelSelected; 
    let colorHighlight  = colorModelHighlighted; 


    if( isBlank(params)               )         params = {};
    if(!isBlank(params.isolate)       )        isolate = params.isolate;
    if(!isBlank(params.ghosting)      )       ghosting = params.ghosting;
    if(!isBlank(params.fitToView)     )      fitToView = params.fitToView;
    if(!isBlank(params.resetColors)   )    resetColors = params.resetColors;
    if(!isBlank(params.keepHidden)    )     keepHidden = params.keepHidden;
    if(!isBlank(params.color)         )          color = params.color;
    if(!isBlank(params.colorHighlight)) colorHighlight = params.colorHighlight;

    disableViewerSelectionEvent = true;

    if(!keepHidden) {
        hiddenInstances = [];
        updateHiddenInstancesControls();
        updateHiddenInstancesList();
    }    
    
    let dbIds   = [];

    if(isolate)     viewer.hideAll();
    if(resetColors) viewer.clearThemingColors();

    for(let dbId of ids) {
        for(let dataInstance of dataInstances) {
            if(dataInstance.partNumber === partNumber) {
                if(hiddenInstances.indexOf(dbId < 0)) {
                    dbIds.push(dataInstance.dbId);
                    viewer.show(dataInstance.dbId);
                }
            }
        }
    }

    for(let dbId of dbIds) {
        viewer.setThemingColor(Number(dbId), colorModelSelected, null, true );
    }
    for(let dbIdHighlight of ids) {
        viewer.setThemingColor(Number(dbIdHighlight), colorModelHighlighted, null, true );
    }
     
    viewerSetGhosting(ghosting);
    if(fitToView) viewer.fitToView(dbIds);
    
    disableViewerSelectionEvent = false;

}
function viewerResetSelection(params) {

    if(!isViewerStarted()) return;
    if(viewer.model.is2d()) return;

    disableViewerSelectionEvent = true;

    //  Set defaults for optional parameters
    // --------------------------------------
    let fitToView   = true;     // Zoom in / out to fit all into view
    let resetView   = false;    // Reset view to initial view from file
    let resetColors = true;     // Highlight given partNumber(s) by defined color (colorModelSelected)
    let keepHidden  = true;     // Keep selectively hidden components hidden
    let showAll     = true;     // Show all components

    if( isBlank(params)            )      params = {};
    if(!isBlank(params.fitToView)  )   fitToView = params.fitToView;
    if(!isBlank(params.resetView)  )   resetView = params.resetView;
    if(!isBlank(params.resetColors)) resetColors = params.resetColors;
    if(!isBlank(params.keepHidden) )  keepHidden = params.keepHidden;
    if(!isBlank(params.showAll)    )     showAll = params.showAll;

    if(showAll) viewer.showAll();
    viewer.clearSelection();

    if(keepHidden) {
        for(let instance of hiddenInstances) {
            viewer.hide(instance.dbId);
        }
    } else { 
        hiddenInstances = [];
        updateHiddenInstancesControls();
        updateHiddenInstancesList();
    }
    
         if(resetColors) viewer.clearThemingColors();
         if(resetView  ) viewer.setViewFromFile();
    else if(fitToView  ) viewer.fitToView();

    disableViewerSelectionEvent = false;

}



// Set Component Colors
function viewerSetColor(partNumber, params) {

    viewerSetColors([partNumber], params);

}
function viewerSetColors(partNumbers, params) {

    if(!isViewerStarted()) return;
    if(viewer.model.is2d()) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let isolate     = false;   // Enable isolation of selected component(s)
    let ghosting    = false;   // Enforce ghosting of hidden components
    let fitToView   = false;   // Zoom in / out to fit selection into view 
    let resetColors = true;    // Reset colors of all componente before highlighting the partNumber(s)
    let usePath     = false;   // If list of paths is provided instead of part numbers
    let keepHidden  = true;    // Keep selectively hidden components hidden
    let unhide      = true;    // Unhide component if it is currently hidden
    let color       = colorModelSelected; 


    if( isBlank(params)            )      params = {};
    if(!isBlank(params.isolate)    )     isolate = params.isolate;
    if(!isBlank(params.ghosting)   )    ghosting = params.ghosting;
    if(!isBlank(params.fitToView)  )   fitToView = params.fitToView;
    if(!isBlank(params.resetColors)) resetColors = params.resetColors;
    if(!isBlank(params.usePath)    )     usePath = params.usePath;
    if(!isBlank(params.keepHidden) )  keepHidden = params.keepHidden;
    if(!isBlank(params.unhide)     )      unhide = params.unhide;
    if(!isBlank(params.color)      )       color = new THREE.Vector4(params.color[0], params.color[1], params.color[2], params.color[3]);

    let dbIds  = [];

    if(isolate)     viewer.hideAll();
    if(resetColors) viewer.clearThemingColors();

    if(!keepHidden) {
        hiddenInstances = [];
        updateHiddenInstancesControls();
        updateHiddenInstancesList();
    }

    for(let dataInstance of dataInstances) {
        let instanceNumber =  (usePath) ? dataInstance.pathShort : dataInstance.partNumber;
        for(let partNumber of partNumbers) {
            if(instanceNumber === partNumber) {
                if(hiddenInstances.indexOf(dataInstance.dbId < 0)) {
                    dbIds.push(dataInstance.dbId);
                    if(unhide) viewer.show(dataInstance.dbId);
                    viewer.setThemingColor(dataInstance.dbId, color, null, true );
                }
            }
        }
    }

    viewerSetGhosting(ghosting);
    if(fitToView) viewer.fitToView(dbIds);

}
function viewerSetColorToAll(color) {

    if(!isViewerStarted()) return;
    if(viewer.model.is2d()) return;

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
    if(viewer.model.is2d()) return;

    viewer.clearThemingColors();

}



// Hide / unhide elements from viewer
function viewerHideModel(partNumber, params) {

    viewerHideModels([partNumber], params);

}
function viewerHideModels(partNumbers, params) {

    if(!isViewerStarted()) return;
    if(viewer.model.is2d()) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let ghosting    = true;   // Enforce ghosting of hidden components
    let usePath     = false;   // If list of paths is provided instead of part numbers

    if( isBlank(params)         )   params = {};
    if(!isBlank(params.ghosting)) ghosting = params.ghosting;
    if(!isBlank(params.usePath) )  usePath = params.usePath;

    for(let dataInstance of dataInstances) {
        let instanceNumber =  (usePath) ? dataInstance.pathShort : dataInstance.partNumber;
        for(let partNumber of partNumbers) {
            if(instanceNumber === partNumber) {
                viewer.hide(dataInstance.dbId);
                if(usePath) break;
            }
        }

    }

    viewerSetGhosting(ghosting);

}
function viewerUnhideModel(partNumber, params) {

    viewerUnhideModels([partNumber], params);

}
function viewerUnhideModels(partNumbers, params) {

    if(!isViewerStarted()) return;
    if(viewer.model.is2d()) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let fitToView   = true;    // Zoom in / out to fit selection into view 
    let highlight   = true;    // Highlight given partNumber(s) by defined color (colorModelSelected)
    let resetColors = true;    // Reset colors of all componente before highlighting the partNumber(s)
    let usePath     = false;   // If list of paths is provided instead of part numbers
    let color       = colorModelSelected; 


    if( isBlank(params)            )      params = {};
    if(!isBlank(params.fitToView)  )   fitToView = params.fitToView;
    if(!isBlank(params.highlight)  )   highlight = params.highlight;
    if(!isBlank(params.resetColors)) resetColors = params.resetColors;
    if(!isBlank(params.usePath)    )     usePath = params.usePath;
    if(!isBlank(params.color)      )       color = new THREE.Vector4(params.color[0], params.color[1], params.color[2], params.color[3]);

    let dbIds = [];
    
    if(resetColors) viewer.clearThemingColors();

    for(let dataInstance of dataInstances) {
        let instanceNumber =  (usePath) ? dataInstance.pathShort : dataInstance.partNumber;
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

    if(!isViewerStarted()) return;
    if(viewer.model.is2d()) return;

    //  Set defaults for optional parameters
    // --------------------------------------
    let fitToView   = true;    // Zoom in / out to fit selection into view 
    let resetColors = true;    // Reset colors of all componente before highlighting the partNumber(s)
    let keepHidden  = true;    // Keep selectively hidden components hidden


    if( isBlank(params)            )      params = {};
    if(!isBlank(params.fitToView)  )   fitToView = params.fitToView;
    if(!isBlank(params.resetColors)) resetColors = params.resetColors;
    if(!isBlank(params.keepHidden) )  keepHidden = params.keepHidden;

    if(!keepHidden) {
        hiddenInstances = [];
        updateHiddenInstancesControls();
        updateHiddenInstancesList();
    }

    if(resetColors) viewer.clearThemingColors();

    viewer.showAll();

    for(let instance of hiddenInstances) viewer.hide(instance.dbId);

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
    if(viewer.model.is2d()) return;

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
    if(viewer.model.is2d()) return;

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
            result = dataInstance.partNumber + ';xx' + dataInstance.name;
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
function getComponentParents(id) {

    let result = []

    getComponentParent(result, id);

    return result;

}
function getComponentParent(parents, id) {

    for(let dataInstance of dataInstances) {
        if(dataInstance.dbId === id) {

            parents.push({
                'dbId'       : id,
                'partNumber' : dataInstance.partNumber,
                'name'       : dataInstance.name
            });

            for(let property of dataInstance.properties) {
                if(property.attributeName === 'parent') {
                    getComponentParent(parents, property.displayValue);
                }
            }

        }
    }

}
function viewerGetSelectedComponentPaths() {

    if(!isViewerStarted()) return [];
    if(viewer.model.is2d()) return;

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



// Custom Controls: Add Selection Toolbar
function addCustomSelectionToolbar(selectionToolbarFeatures) {

    let elemToolbar = $('#customSelectionToolbar');

    if(elemToolbar.length > 0) {
        elemToolbar.show();
        return;
    }

    let selectToolbar = new Autodesk.Viewing.UI.ControlGroup('customSelectionToolbar');
    
    viewer.toolbar.addControl(selectToolbar);

    if(selectionToolbarFeatures.includes('hide')     ) viewerAddHideSelected(selectToolbar);
    if(selectionToolbarFeatures.includes('ghosting') ) viewerAddGhostingToggle(selectToolbar);
    if(selectionToolbarFeatures.includes('highlight')) viewerAddHighlightToggle(selectToolbar);
    if(selectionToolbarFeatures.includes('single')   ) viewerAddFitFirstInstance(selectToolbar);
    if(selectionToolbarFeatures.includes('fitToView')) viewerAddFitToView(selectToolbar);
    if(selectionToolbarFeatures.includes('reset')    ) viewerAddResetButton(selectToolbar);

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
function viewerAddHideSelected(toolbar) {

    let buttonHide = addCustomControl(toolbar, 'button-toggle-hide-selected', 'icon-remove', 'Hide selected components');
        buttonHide.onClick = function(e) { 

            e.preventDefault();
            e.stopPropagation();

            let enabled     = $('#customSelectionToolbar').hasClass('hide-selectd');
            let selected    = viewer.getSelection().length;

            if(!enabled && selected > 0) {
                for(let dbId of viewer.getSelection()) {
                    hideInstance(dbId);
                }
            } else if(enabled) {
                $('#customSelectionToolbar').toggleClass('hide-selectd');
                $('#hidden-instances-toggle').addClass('icon-chevron-down').removeClass('icon-chevron-up');
            } else if(selected === 0) {
                $('#customSelectionToolbar').toggleClass('hide-selectd');
            }

            updateHiddenInstancesControls();

        };

    let elemHiddenInstances = $('<div></div>').appendTo($('#viewer'))
        .attr('id', 'hidden-instances')
        .hide();

    let elemHiddenInstancesLabel = $('<div></div>').appendTo(elemHiddenInstances)
        .attr('id', 'hidden-instances-label');

    $('<div></div>').appendTo(elemHiddenInstancesLabel)
        .attr('id', 'hidden-instances-counter');

    $('<div></div>').appendTo(elemHiddenInstancesLabel)
        .attr('id', 'hidden-instances-text');

    $('<div></div>').appendTo(elemHiddenInstances)
        .attr('id', 'hidden-instances-undo')
        .addClass('button')
        .addClass('icon')
        .addClass('icon-undo')
        .attr('title', 'Unhide last component')
        .click(function() {
            viewer.show(hiddenInstances[hiddenInstances.length - 1].dbId);
            hiddenInstances.pop()
            updateHiddenInstancesControls();
            updateHiddenInstancesList();

        });

    $('<div></div>').appendTo(elemHiddenInstances)
        .attr('id', 'hidden-instances-toggle')
        .addClass('button')
        .addClass('icon')
        .addClass('icon-chevron-down')
        .attr('title', 'Toggle list of hidden components')
        .click(function() {
            $(this).toggleClass('icon-chevron-down').toggleClass('icon-chevron-up');
            updateHiddenInstancesList();
        });

    $('<div></div>').appendTo(elemHiddenInstances)
        .attr('id', 'hidden-instances-clear')
        .addClass('button')
        .addClass('icon')
        .addClass('icon-close')
        .attr('title', 'Unhide all components')
        .click(function() {
            for(let instance of hiddenInstances) viewer.show(instance.dbId);
            hiddenInstances = [];
            updateHiddenInstancesControls();
            updateHiddenInstancesList();
        });

}
function viewerHideSelected(event) {

    let toolbar = $('#customSelectionToolbar');

    if(toolbar.length > 0) {
        if(toolbar.hasClass('hide-selectd')) {
            hideSelectedInstance(event);
            return true;
        }
    }
    
    return false;
}
function hideSelectedInstance(event) {

    let toolbar = $('#customSelectionToolbar');

    if(toolbar.length > 0) {
        if(toolbar.hasClass('hide-selectd')) {

            if(hiddenInstances.length === 0) $('#hidden-instances-toggle').addClass('icon-chevron-down').removeClass('icon-chevron-up');

            for(let dbId of event.dbIdArray) {
                hideInstance(dbId)
            }

            updateHiddenInstancesControls();
            updateHiddenInstancesList();

        }
    }
    
}
function hideInstance(dbId) {

    viewer.hide(dbId);

    for(let instance of dataInstances) {
        if(instance.dbId === dbId) {
            hiddenInstances.push({
                dbId        : dbId,
                partNumber  : instance.partNumber,
                name        : instance.name
            });
            break;
        }
    }

}
function updateHiddenInstancesControls() {

    $('#hidden-instances-counter').html(hiddenInstances.length);

    if(hiddenInstances.length === 1) $('#hidden-instances-text').html('hidden component');
    else $('#hidden-instances-text').html('hidden components');

    if(hiddenInstances.length === 0) {
        $('#hidden-instances').hide();
    } else {
        $('#hidden-instances').css('display', 'flex');
    }

}
function updateHiddenInstancesList() {

    if($($('#hidden-instances-toggle')).hasClass('icon-chevron-down')) {

        $('#hidden-instances-list').remove();

    } else {
        
        let elemHiddenInstancesList = $('#hidden-instances-list');

        if(elemHiddenInstancesList.length === 0) {
            elemHiddenInstancesList = $('<div></div>').appendTo($('#viewer'))
            .attr('id', 'hidden-instances-list')
            .addClass('no-scrollbar');
        } else {
            elemHiddenInstancesList.html('');
        }
     
        for(let instance of hiddenInstances) {

            let elemHiddenInstance = $('<div></div>').appendTo(elemHiddenInstancesList)
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
                    for(let index = 0; index < hiddenInstances.length; index++) {
                        if(hiddenInstances[index].dbId == $(this).parent().attr('data-id')) {
                            viewer.show(hiddenInstances[index].dbId);
                            hiddenInstances.splice(index, 1);
                            break;
                        }
                    }
                    updateHiddenInstancesControls();
                    updateHiddenInstancesList();
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
function viewerAddGhostingToggle(toolbar) {

    let buttonEnableGosting = addCustomControl(toolbar, 'button-toggle-ghosting-enable', 'icon-hide', 'Click to enable ghosting mode');
        buttonEnableGosting.onClick = function(e) { 
            viewer.setGhosting(true);
            $('#customSelectionToolbar').addClass('ghosting');
        };

    let buttonDisableGosting = addCustomControl(toolbar, 'button-toggle-ghosting-disable', 'icon-show', 'Click to disable ghosting mode');
        buttonDisableGosting.onClick = function(e) { 
            viewer.setGhosting(false);
            $('#customSelectionToolbar').removeClass('ghosting');
        };

    toolbar.addClass('ghosting');

}
function viewerSetGhosting(value) {

    let ghosting = value; 

    if(!isBlank(viewerFeatures.ghosting)) {
        if(viewerFeatures.ghosting) {
            let toolbar  = $('#customSelectionToolbar');
            if(toolbar.length > 0) {
                ghosting = (toolbar.hasClass('ghosting'));
            }
        }
    }

    viewer.setGhosting(ghosting);

}


// Custom Controls : Highlight Toggle
function viewerAddHighlightToggle(toolbar) {

    let buttonOff = addCustomControl(toolbar, 'button-toggle-highlight-off', 'icon-highlight', 'Enable selection hihglight by color');
        buttonOff.onClick = function(e) { 
            toggleSelectionHighlight(true);
            $('#customSelectionToolbar').addClass('highlight-on');
            $('#customSelectionToolbar').removeClass('highlight-off');
        };

    let buttonOn = addCustomControl(toolbar, 'button-toggle-highlight-on', 'icon-highlight', 'Disable selection highlight by color');
        buttonOn.onClick = function(e) { 
            toggleSelectionHighlight(false);
            $('#customSelectionToolbar').removeClass('highlight-on');
            $('#customSelectionToolbar').addClass('highlight-off');
        };

    toolbar.addClass('highlight-off');

}
function toggleSelectionHighlight(enabled) {

    viewer.clearThemingColors();

    if(!enabled) return;

    let allVisible = true;

    for(let dataInstance of dataInstances) {
        if(!viewer.isNodeVisible(dataInstance.dbId)) {
            allVisible = false;
            break;
        }
    }

    if(allVisible) return;

    for(let dataInstance of dataInstances) {
        if(viewer.isNodeVisible(dataInstance.dbId)) {
            viewer.setThemingColor(dataInstance.dbId, colorModelSelected, null, true );
        }
    }

}


// Custom Controls : Fit first instance to view
function viewerAddFitFirstInstance(toolbar) {

    let buttionFitFirst = addCustomControl(toolbar, 'button-fit-first', 'icon-first', 'Fit first instance to view');
        buttionFitFirst.onClick = function() { 

            let dbIdFirst = [];

            for(let dataInstance of dataInstances) {
                if(dataInstance.selected === true) {
                    if(!isBlank(dataInstance.name)) {
                        if(dbIdFirst.length === 0) {
                            dbIdFirst.push(dataInstance.dbId);
                        }
                    }
                }
            }

            viewer.fitToView(dbIdFirst);
            
        };
        
}


// Custom Controls : Fit (selection) to view
function viewerAddFitToView(toolbar) {

    let buttionFitToView = addCustomControl(toolbar, 'button-fit-to-view', 'icon-viewer', 'Fit (selected) components to view');
        buttionFitToView.onClick = function() { 

            let dbIds = [];

            for(let dataInstance of dataInstances) {
                if(viewer.isNodeVisible(dataInstance.dbId)) {
                    dbIds.push(dataInstance.dbId);
                }
            }

            viewer.fitToView(dbIds);

        };
        
}


// Custom Controls : Reset Button
function viewerAddResetButton(toolbar) {


    let buttonReset = addCustomControl(toolbar, 'button-reset-selection', 'icon-reset', 'Reset selection and show all models');
        buttonReset.onClick = function() { 
            viewerClickReset();
        };
        
}
function viewerClickReset() {
    viewer.showAll();
    hiddenInstances = [];
    updateHiddenInstancesControls();
    updateHiddenInstancesList();
    viewerResetColors();
    viewerClickResetDone();
}
function viewerClickResetDone() {

    $('.bom-item').removeClass('selected');
    $('.flat-bom-item').removeClass('selected');

}


// Custom Controls : Standard Views Toolbar
function viewerAddViewsToolbar() {

    let elemToolbar = $('#my-custom-toolbar-views');

    if(elemToolbar.length > 0) { elemToolbar.show(); return; }

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


// Custom Controls : Markups
function viewerAddMarkupControls() {

    // if(typeof includeSaveButton === 'undefined') includeSaveButton = false;

    let elemToolbar       =  $('#' + viewerId + '-custom-markup-toolbar');
    let includeSaveButton = ($('#' + viewerId + '-markups-list').length > 0);

    if(elemToolbar.length > 0) { elemToolbar.show(); return; }

    let elemMarkupToolbar = $('<div></div>').appendTo($('#' + viewerId))
        .attr('id', viewerId + '-markup-toolbar')
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

    if(includeSaveButton) {
        addMarkupActionControl(elemMarkupGroupActions, true, 'undo', 'markup.undo();', 'Undo');
        addMarkupActionControl(elemMarkupGroupActions, true, 'redo', 'markup.redo();', 'Redo');
        addMarkupActionControl(elemMarkupGroupActions, true, 'delete', 'markup.clear();', 'Clear all markups');
        addMarkupActionControl(elemMarkupGroupActions, true, 'close', 'viewerLeaveMarkupMode();', 'Close markup toolbar');
        addMarkupActionControl(elemMarkupGroupActions, false, 'Save', 'viewerSaveItemMarkup();', 'Save markup');
        elemMarkupGroupActions.addClass('with-save-button');
    } else {
        addMarkupActionControl(elemMarkupGroupActions, true, 'undo', 'markup.undo();', 'Undo');
        addMarkupActionControl(elemMarkupGroupActions, true, 'redo', 'markup.redo();', 'Redo');
        addMarkupActionControl(elemMarkupGroupActions, false, 'Clear', 'markup.clear();', 'Clear all markups');
        addMarkupActionControl(elemMarkupGroupActions, false, 'Close', 'viewerLeaveMarkupMode();', 'Close markup toolbar');
    }

    $('<canvas>').appendTo($('body')).attr('id', 'viewer-markup-image').addClass('hidden');

    let newToolbar = new Autodesk.Viewing.UI.ControlGroup(viewerId + '-custom-markup-toolbar');
    // let newButton  = addCustomControl(newToolbar, 'my-markup-button', 'icon-markup', 'Markup');
    let newButton  = addCustomControl(newToolbar, viewerId + '-markup-button', 'icon-markup', 'Markup');
    
    newButton.addClass('viewer-markup-button');
    newButton.addClass('enable-markup');
    newButton.onClick = function() {

        if(restoreMarkupState !== '') {

            markupsvg = restoreMarkupSVG;
            viewer.restoreState(restoreMarkupState, null, true);

        }

        markup.enterEditMode();
        markup.show();

        // let markupsId   = viewerId.split('-viewer')[0] + '-markups-list';
        let elemMarkups = $('#' + viewerId + '-markups-list');

        if(elemMarkups.length > 0) {
            if(elemMarkups.children('.selected').length === 0) {
                let placeholders = elemMarkups.children('.placeholder');
                if(placeholders.length === 0) elemMarkups.children().first().addClass('selected');
                else placeholders.first().addClass('selected');
            }
        }

        baseStrokeWidth = markup.getStyle()['stroke-width'];
            
        if($('#' + viewerId + '-markup-toolbar').hasClass('set-defaults')) {
            $('.viewer-markup-toggle.color').first().click();
            $('.viewer-markup-toggle.width').first().click();
            $('.viewer-markup-toggle.shape').first().click();
            $('#viewer-markup-toolbar').removeClass('set-defaults');
        } else {
            $('.viewer-markup-toggle.color.selected').click();
            $('.viewer-markup-toggle.width.selected').click();
            $('.viewer-markup-toggle.shape.selected').click();
        }
        
        $('#' + viewerId + '-markup-toolbar').toggleClass('hidden');

        let elemNoteControl = $('#' + viewerId+ '-note-toolbar');

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

    if(!isViewerStarted()) return;

    let elemNoteControl = $('#' + viewerId + '-note-toolbar');

    if(elemNoteControl.length > 0) {
        elemNoteControl.toggleClass('hidden');
        closedViewerMarkup(markup.generateData(), viewer.getState());
    }

    $('#' + viewerId + '-markup-toolbar').addClass('hidden');

    if(typeof markup === 'undefined') return;

    markup.leaveEditMode();
    markup.hide();

    setViewerFeatures();

    restoreMarkupSVG   = '';
    restoreMarkupState = '';

    $('#' + viewerId + '-markups-list').children('.selected').removeClass('selected');


}
function viewerSaveItemMarkup() {

    let fieldId  = $('#' + viewerId + '-markups-list').find('.markup.selected').first().attr('id');
    let linkItem = $('#' + viewerId).closest('.item').attr('data-link');

    $('#overlay').show();

    viewerCaptureScreenshot(fieldId, function() {

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
function viewerCaptureScreenshot(id, callback) {
   
    if(!isViewerStarted()) callback();

    if(isBlank(id)) id = 'viewer-markup-image';

    if($('#' + id).length === 0) {

        callback();
        
    } else {

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


// Markup restore
function onViewerRestore(event) {
     
    markup.unloadMarkupsAllLayers();
    
    if(markupsvg !== '') {
        markup.show();
        markup.loadMarkups(markupsvg, 'review');
        
    }
    
}