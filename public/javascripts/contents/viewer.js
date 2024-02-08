let colorModelSelected          = new THREE.Vector4(0.02, 0.58, 0.84, 0.5);
let newInstance                 = true;
let ghosting                    = true;
let disableViewerSelectionEvent = false;
let viewerDone                  = false;

let viewer, dmu, markup, markupsvg, curViewerState, restoreMarkupSVG, restoreMarkupState, baseStrokeWidth;

let markupStyle = {};

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
        'level1' : [255, 255, 255],
        'level2' : [245, 245, 245],
        'level3' : [238, 238, 238],
        'level4' : [217, 217, 217],
        'level5' : [204, 204, 204]
    },
    'dark' : {
        'level1' : [69, 79, 97],
        'level2' : [59, 68, 83],
        'level3' : [46, 52, 64],
        'level4' : [34, 41, 51],
        'level5' : [26, 31, 38]
    },
    'black' : {
        'level1' : [83, 83, 83],
        'level2' : [71, 71, 71],
        'level3' : [55, 55, 55],
        'level4' : [42, 42, 42],
        'level5' : [32, 32, 32]
    }
}


// Launch Forge Viewer
function initViewer(data, color, id) {

    if(typeof data === undefined) return;
    else if(data === '') return;

    if(typeof color !== 'undefined') {
        if(color !== null) {
            if(Array.isArray(color)) config.viewer.backgroundColor = color;
            else config.viewer.backgroundColor = [color, color, color];
        }
    }

    if(typeof id === 'undefined') id = 'viewer';
    else if(id === null) id = 'viewer';

    $('#' + id + '-message').hide();
    $('#' + id + '-processing').hide();
    $('#' + id).show();

    var options = {
        logLevel    : 0,
        env         : 'AutodeskProduction',
        api         : 'derivativeV2',  // for models uploaded to EMEA change this option to 'derivativeV2_EU'
        getAccessToken  : function(onTokenReady) {
            var token = data.token;
            var timeInSeconds = 3600; // Use value provided by Forge Authentication (OAuth) API
            onTokenReady(token, timeInSeconds);
        }
    };

    if(typeof viewer === 'undefined') { 

        Autodesk.Viewing.Initializer(options, function() {

            var htmlDiv = document.getElementById(id);
            viewer = new Autodesk.Viewing.Private.GuiViewer3D(htmlDiv, { modelBrowserStartCollapsed: true, startCollapsed: true });
            viewer.addEventListener(Autodesk.Viewing.VIEWER_STATE_RESTORED_EVENT, onViewerRestore);
            viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, onViewerSelectionChanged);

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

    var viewable = doc.getRoot().getDefaultGeometry();

    if (viewable) {
        // viewer.loadDocumentNode(doc, viewable).then(function(result) {
        viewer.loadDocumentNode(doc, viewable, {globalOffset: {x:0,y:0,z:0}}).then(function(result) {
            viewer.setBackgroundColor(config.viewer.backgroundColor[0], config.viewer.backgroundColor[1], config.viewer.backgroundColor[2], config.viewer.backgroundColor[0], config.viewer.backgroundColor[1], config.viewer.backgroundColor[2]);
            viewerDone = true;
            initViewerDone(newInstance);
        }).catch(function(err) {
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
function initViewerDone() {
    $('#viewer-progress').hide();
}
function onViewerSelectionChanged(event) {}



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



// Launch Forge Aggregated View
// function initDMU(data, color, id) {

//     if(typeof data === undefined) return;
//     else if(data === "") return;

//     if(typeof color !== 'undefined') {
//         if(color !== null) {
//             backgroundColor = color;
//         }
//     }

//     if(typeof id === 'undefined') id = 'viewer';
//     else if(id === null) id = 'viewer';

//     $('#' + id + '-message').hide();
//     $('#' + id).show();
//     $('#' + id + '-progress').hide();

//     var options = {
//         logLevel : 0,
//         env: 'AutodeskProduction',
//         api: 'derivativeV2',  // for models uploaded to EMEA change this option to 'derivativeV2_EU'
//         getAccessToken: function(onTokenReady) {
//             var token = data.token;
//             var timeInSeconds = 3600; // Use value provided by Forge Authentication (OAuth) API
//             onTokenReady(token, timeInSeconds);
//         }
//     };

//     if(typeof dmu === 'undefined') { 

//         dmu = new Autodesk.Viewing.AggregatedView();

//         Autodesk.Viewing.Initializer(options, function onInitialized() {
//             // Get the Viewer DIV
//             var htmlDiv = document.getElementById(id);
        
//             // Initialize the AggregatedView view
//             dmu.init(htmlDiv, options).then(function () {
//                 Autodesk.Viewing.Document.load('urn:'+ data.urn, (doc) => {
//                     var nodes = doc.getRoot().search({ type: 'geometry' });
//                     dmu.setNodes(nodes[0]);
//                 }, (errorCode, errorMsg, messages) => {});
//             });
//         });




//         // var htmlDiv = document.getElementById(id);

//         // await dmu.init(htmlDiv, options)

//         // Autodesk.Viewing.Initializer(options, function() {

            
            
//         //     dmu.addEventListener(Autodesk.Viewing.VIEWER_STATE_RESTORED_EVENT, onViewerRestore);
//         //     dmu.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, onSelectionChanged);

//         //     var startedCode = dmu.start();
//         //     if (startedCode > 0) {
//         //         console.error('Failed to create a Viewer: WebGL not supported.');
//         //         return;
//         //     }

//         //     Autodesk.Viewing.Document.load('urn:'+ data.urn, onDocumentLoadSuccess, onDocumentLoadFailure);
            
//         // });
    
//     } else {

//         // unloadAll();
//         // newInstance = false;
//         // Autodesk.Viewing.Document.load('urn:'+ data.urn, onDocumentLoadSuccess, onDocumentLoadFailure);

//     } 
    
// }
// function insertModels(list) {

//     console.log(list);

// let tasks = [];

//     for(item of list) {

//         // models.forEach( md => tasks.push( loadManifest( md.urn ) ) );
//         // docs.push(Autodesk.Viewing.Document.load('urn:' + item));
//         tasks.push(loadManifest('urn:' + item));

//     }

//     console.log(tasks.length);
//     console.log(tasks);

//     Promise.all(tasks).then( docs =>  Promise.resolve( docs.map( doc => {
//       const bubbles = doc.getRoot().search({type:'geometry', role: '3d'});
//       const bubble = bubbles[0];
//       if( !bubble ) return null;

//       return bubble;
//     }))).then( bubbles => dmu.setNodes( bubbles ) );
// // });


//     // console.log(docs.length);
//     // console.log(docs);

//     // const bubbleNodes = [];
//     // // docs is an array of loaded documents
//     // docs.forEach((doc) => {
//     //     var nodes = doc.getRoot().search({ type: 'geometry' });
//     //     bubbleNodes.push(nodes[0]);
//     // });
//     // dmu.setNodes(bubbleNodes);

// }

// function loadManifest( documentId ) {
//     return new Promise(( resolve, reject ) => {
//     //   const onDocumentLoadSuccess = ( doc ) => {
//     //     doc.downloadAecModelData(() => resolve(doc));
//     //   };
//       Autodesk.Viewing.Document.load( documentId, function() {
//         return resolve();
//       }, reject );
//     });
//   }









// Add & unload models to session
function viewerAddModel(model) {
    viewerAddModels([model]);
    // }]);
}
function viewerAddModels(models) {
    for(model of models) addModel(model);
}
// function addModel(urn, transX, transY, transZ, rotX, rotY, rotZ) {
function addModel(model) {

    // see https://aps.autodesk.com/blog/loading-multiple-models-forge-viewer-v7 about transformation
    
    if(typeof model.offsetX === 'undefined') model.offsetX = 0;
    if(typeof model.offsetY === 'undefined') model.offsetY = 0;
    if(typeof model.offsetZ === 'undefined') model.offsetZ = 0;

    if(typeof model.angleX === 'undefined') model.angleX = 0;
    if(typeof model.angleY === 'undefined') model.angleY = 0;
    if(typeof model.angleZ === 'undefined') model.angleZ = 0;

    // console.log(model);

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
    for(urn of urns) unloadModel(urn);
}
function unloadModel(urn) {

    let models = viewer.impl.modelQueue().getModels();

    for(model of models) {
        if(model.myData.urn === urn) viewer.unloadModel(model);
    }

}


// Close all models currently in viewer
function viewerUnloadAllModels() {

    if(viewer === null) return;
    if(typeof viewer === 'undefined') return;

    let models = viewer.impl.modelQueue().getModels();

    for(model of models) viewer.impl.unloadModel(model);

}


// Select and focus on selected item
function viewerSelectModel(partNumber, fitToView, highlight) {

    viewerSelectModels([partNumber], fitToView, highlight);

}
function viewerSelectModels(partNumbers, fitToView, highlight) {

    if(!isViewerStarted()) return;

    if(typeof fitToView === 'undefined') fitToView = false;
    if(typeof highlight === 'undefined') highlight = true;

    disableViewerSelectionEvent = true;
    viewer.hideAll();
    
    if(highlight) viewer.clearThemingColors();

    let instances   = viewer.model.getInstanceTree();
    let dbIds       = [];
    let promises    = [];

    for(let i = 1; i < instances.objectCount; i++) promises.push(getPropertiesAsync(i));

    Promise.all(promises).then(function(items) {

        for(let item of items) {

            let itemPartNumber = getItemPartNumber(item);

            for(let partNumber of partNumbers) {
                if(partNumber === itemPartNumber) {
                    dbIds.push(item.dbId);
                    viewer.show(item.dbId);
                    if(highlight) viewer.setThemingColor(item.dbId, colorModelSelected, null, true );
                }
            }
        }

        if(fitToView) viewer.fitToView(dbIds);
        disableViewerSelectionEvent = false;

    });

}
function viewerSelectModelNew(selected, fitToView) {

    let partNumbers = [selected];
    let dbIds = [];

    disableViewerSelectionEvent = true;
    viewer.hideAll();

    if(typeof fitToView === 'undefined') fitToView = false;

    // let instances   = viewer.model.getInstanceTree();
//     let dbIds       = [];


// let dbId = 1;


// for(var i = 1; i < instances.objectCount; i++) {

//     for(model of viewer.getAllModels()) {

//         model.getProperties(i, function(data) { 
//         data.dbId = dbId++;
//         });

//     }
// }


    // let models = viewer.getAllModels();

    let models = viewer.getAllModels();


    for(let x = 0; x < models.length; x++) {

        let model = models[x];
        let instances   = model.getInstanceTree();

        for(var i = 1; i < instances.objectCount; i++) {
                
            model.getProperties(i, function(data) { 

                let partNumberValues = [];

                for(property of data.properties) {
                    if(config.viewer.partNumberProperties.indexOf(property.attributeName) > -1) {

                        let value = property.displayValue;
                            value = value.split(':')[0];

                        partNumberValues.push(value);

                    }
                }

                if(partNumberValues.length > 0) {
                    for(partNumber of partNumberValues) {
                        for(number of partNumbers) {
                            if(partNumber.indexOf(number) === 0) {
                                dbIds.push(data.dbId);  
                                viewer.show(data.dbId, model);
                                viewer.setThemingColor(data.dbId, config.viewer.colorModelSelected, model, true );
                                if(fitToView) viewer.fitToView(dbIds);
                                break;
                            }
                        }
                    }
                }
                
            })
        }
    }

    disableViewerSelectionEvent = false;

}
function viewerSelectAll(fitToView) {

    disableViewerSelectionEvent = true;
    
    if(typeof fitToView === 'undefined') fitToView = true;
    
    viewer.showAll();
    
    let dbIds  = [];
    let models = viewer.getAllModels();

    for(let x = 0; x < models.length; x++) {

        let model     = models[x];
        let instances = model.getInstanceTree();

        for(var i = 1; i < instances.objectCount; i++) {
                
            model.getProperties(i, function(data) { 

                dbIds.push(data.dbId);  
                viewer.setThemingColor(data.dbId, colorModelSelected, model, true);
                
            })
        }
    }

    if(fitToView) viewer.setViewFromFile();

    disableViewerSelectionEvent = false;

}
function viewerSelectIDs(dbIds, fitToView) {

    if(!viewerDone) return;
    if(typeof fitToView === 'undefined') fitToView = false;

    disableViewerSelectionEvent = true;
    viewer.hideAll();
    viewer.clearThemingColors();

    for(let dbId of dbIds) {
        dbId = Number(dbId);
        viewer.show(dbId);
        viewer.setThemingColor(dbId, colorModelSelected, null, true );
    }
    
    if(fitToView) viewer.fitToView(dbIds);

    disableViewerSelectionEvent = false;

}
function getItemPartNumber(item) {

    for(let partNumberPropery of config.viewer.partNumberProperties) {
        for(property of item.properties) {
            if(partNumberPropery === property.attributeName) return property.displayValue.split(':')[0];
        }
    }
    
    return null;

}



// Hide given model item
function viewerHideModel(partNumber) {

    viewerHideModels([partNumber]);

}
function viewerHideModels(partNumbers) {

    let instances   = viewer.model.getInstanceTree();
    let dbIds       = [];

    disableViewerSelectionEvent = true;

    for(var i = 1; i < instances.objectCount; i++) {

        viewer.model.getProperties(i, function(data) { 

            let partNumberValues = [];

            for(property of data.properties) {
                if(config.viewer.partNumberProperties.indexOf(property.attributeName) > -1) {

                    let value = property.displayValue;
                        value = value.split(':')[0];

                    partNumberValues.push(value);

                }
            }

            if(partNumberValues.length > 0) {
                for(partNumber of partNumberValues) {
                    for(number of partNumbers) {
                        if(partNumber.indexOf(number) === 0) {
                            viewer.hide(data.dbId);
                            break;
                        }
                    }
                }
            }
            
        })
    }

    disableViewerSelectionEvent = false;

}


// Unhide given model item
function viewerUnhideModel(partNumber, fitToView) {

    viewerUnhideModels([partNumber], fitToView);

}
function viewerUnhideModels(partNumbers, fitToView) {

    if(typeof fitToView === 'undefined') fitToView = false;

    let instances   = viewer.model.getInstanceTree();
    let dbIds       = [];

    for(var i = 1; i < instances.objectCount; i++) {

        viewer.model.getProperties(i, function(data) { 

            let partNumberValues = [];

            for(property of data.properties) {
                if(config.viewer.partNumberProperties.indexOf(property.attributeName) > -1) {

                    let value = property.displayValue;
                        value = value.split(':')[0];

                    partNumberValues.push(value);

                }
            }

            if(partNumberValues.length > 0) {
                for(partNumber of partNumberValues) {
                    for(number of partNumbers) {
                        if(partNumber.indexOf(number) === 0) {
                            dbIds.push(data.dbId);
                            viewer.show(data.dbId);
                            if(fitToView) viewer.fitToView(dbIds);
                            break;
                        }
                    }
                }
            }
            
        })
    }

}



// Reset viewer / deselect all
function viewerResetSelection(resetView, resetColors) {

    if(!isViewerStarted()) return;

    if(typeof resetView   === 'undefined') resetView   = true;
    if(typeof resetColors === 'undefined') resetColors = true;

    viewer.showAll();
    viewer.clearSelection();
    
    if(resetColors) viewer.clearThemingColors();
    if(resetView  ) viewer.setViewFromFile();

}



// Get paths / instances of defined part numbers
async function viewerGetComponentsInstances(partNumbers, propertyName) {

    if(!viewerDone) return;

    return new Promise(function(resolve, reject) {
        
        let instances   = viewer.model.getInstanceTree();
        let promises    = [];
        let result      = [];
        
        for(let i = 1; i < instances.objectCount; i++) {
            promises.push(getPropertiesAsync(i));
        }

        Promise.all(promises).then(function(items) {

            if(isBlank(propertyName)) {
                if(items.length > 0) {
                    for(let partNumberPropery of config.viewer.partNumberProperties) {
                        if(propertyName === '') {
                            for(let property of items[0].properties) {
                                if(partNumberPropery === property.attributeName) {
                                    propertyName = property.attributeName;
                                    continue;
                                }
                            }
                        }
                    }
                }
            }

            for(let partNumber of partNumbers) {
                result.push({
                    'partNumber' : partNumber,
                    'instances'  : viewerGetComponentInstances(partNumber, propertyName, items)
                });
            };

            resolve(result);

        });

    });

}
function viewerGetComponentInstances(partNumber, propertyName, items) {

    let result = [];

    for(let item of items) {

        let propertyPartNumber = item.properties.find((e) => e.attributeName == propertyName);

        if(typeof propertyPartNumber !== 'undefined') {

            let itemPartNumber = propertyPartNumber.displayValue;
            let propertyParent = item.properties.find((e) => e.attributeName == 'parent');

            if(typeof propertyParent !== 'undefined') {
                if(itemPartNumber === partNumber) {
                    result.push({
                        'dbId' : item.dbId,
                        'path' : getComponentPath(items, item.dbId)  
                    });
                }
            }

        }

    }

    return result;

}



// Get selected models
async function viewerGetSelectedComponentPaths() {

    return new Promise(function(resolve, reject) {
        
        let instances   = viewer.model.getInstanceTree();
        let promises    = [];
        let result      = [];

        for(let i = 1; i < instances.objectCount; i++) {
            promises.push(getPropertiesAsync(i));
        }

        Promise.all(promises).then(function(responses) {

            let items = responses;

            for(selection of viewer.getSelection()) {
                
                // result.push(getComponentPath(items, selection));

                let componentPath   = getComponentPath(items, selection).split('|');
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

            resolve(result);

        });

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
// const getPropertiesAsync = (id) => {
    
//     return new Promise((resolve, reject) => {
//         viewer.getProperties(id, (result) => {
//             resolve(result)
//         }, (error) => {
//             reject(error)
//        });
//     });
 
// }
function getComponentPath(items, id) {

    let result = ';'

    for(let item of items) {
        if(item.dbId === id) {
            result = item.name;
            for(property of item.properties) {
                if(property.attributeName === 'parent') {
                    let partNumber = getComponentPath(items, property.displayValue);
                    result = partNumber.split('.iam')[0] + '|' + result;
                }
            }

        }
    }

    return result;

}



// Set custom colors for multiple records
function viewerSetColor(partNumber, color, fitToView, unhide) {

    viewerSetColors([partNumber], color, fitToView, unhide);

}
function viewerSetColors(partNumbers, color, fitToView, unhide) {

    if(typeof viewer === 'undefined') return;
    if(typeof partNumbers === 'undefined') return;
    if(partNumbers.length === 0) return;

    if(typeof fitToView === 'undefined') fitToView = false;
    if(typeof unhide    === 'undefined') unhide     = true;

    let vector      = null;
    let instances   = viewer.model.getInstanceTree();
    let dbIds       = [];

    if(color !== null) vector = new THREE.Vector4(color[0], color[1], color[2], color[3]);

    for(var i = 1; i < instances.objectCount; i++) {

        viewer.model.getProperties(i, function(data) { 

            let partNumberValues = [];

            for(property of data.properties) {
                if(config.viewer.partNumberProperties.indexOf(property.attributeName) > -1) {
                    let value = property.displayValue;
                        value = value.split(':')[0];

                    partNumberValues.push(value);
                }
            }

            if(partNumberValues.length > 0) {
                for(partNumber of partNumberValues) {
                    for(number of partNumbers) {
                        if(partNumber.indexOf(number) > -1) {
                            viewer.setThemingColor(data.dbId, vector, null, true);
                            if(unhide) viewer.show(data.dbId);
                            if(fitToView) viewer.fitToView(dbIds);
                        }
                    }
                }
            }

        })

    }

}


// Set same color to all elements
function viewerSetColorToAll(color) {

    let vector      = new THREE.Vector4(color[0], color[1], color[2], color[3]);
    let instances   = viewer.model.getInstanceTree();

    for(var i = 1; i < instances.objectCount; i++) {
        viewer.model.getProperties(i, function(data) { 
            viewer.setThemingColor(data.dbId, vector, null, true);
        })
    }

}


// Reset all custom colors
function viewerResetColors() {

    if(!isViewerStarted()) return;

    viewer.clearThemingColors();

}


// Close markup view
// function viewerLeaveMarkupMode() {

//     if(typeof markup === 'undefined') return;

//     markup.leaveEditMode();
//     markup.hide();

// }



// Custom Controls: Reset
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
function clickBOMResetDone() {}



// Custom Controls : Ghosting
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


// Custom Controls : Standard views
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


// Custom Controls : Note
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



// Custom Controls : Markup
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


function viewerCaptureScreenshot(id, callback) {
   
    if(isBlank(id)) id = 'viewer-markup-image';

    var screenshot  = new Image();
    var imageWidth  = viewer.container.clientWidth;
    var imageHeight = viewer.container.clientHeight;

    screenshot.onload = function () {
            
        let canvas          = document.getElementById(id);
        // let canvas          = document.getElementById('viewer-markup-image');
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