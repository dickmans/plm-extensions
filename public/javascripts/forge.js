let backgroundColor      = 255;
let partNumberProperties = ['Part Number', 'Artikelnummer', 'Bauteilnummer', 'Name', 'label'];
let colorModelSelected   = new THREE.Vector4(0.02,0.58, 0.84, 0.5);
let newInstance          = true;
let ghosting             = true;
let disableViewerSelectionEvent = false;

let viewer, markup, markupsvg, curViewerState;


let markupStyle = {
    'stroke-width' : 1.1,
    'font-size' : 10
    // * defaults got disabled in Mar 2019 due to issues with scaling *
    //    "font-size" : 12,
    //    "stroke-width" : 0.005
    //    "stroke-color" : "#FC5A78"
};

let vectorRange  = [ 
    new THREE.Vector4(206/255, 101/255, 101/255, 0.8),
    new THREE.Vector4(224/255,  175/255, 75/255, 0.8), 
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


// Insert viewer in div #viewer
function insertViewer(link) {

    let elemParent = $('#viewer');
        elemParent.html('');

    let elemProgress = $('<div></div>');
        elemProgress.attr('id', 'viewer-progress');
        elemProgress.addClass('progress');
        elemProgress.append($('<div class="bounce1"></div>'));
        elemProgress.append($('<div class="bounce2"></div>'));
        elemProgress.append($('<div class="bounce2"></div>'));
        elemProgress.appendTo(elemParent);

    $.get('/plm/get-viewables', { 'link' : link }, function(response) {

        if(response.data.length > 0) {

            let found = false;

            for(viewable of response.data) {
                if(viewable.name.indexOf('.iam.dwf') > -1) {
                    $('body').removeClass('no-viewer');
                    $('#viewer').html('');
                    initViewer(viewable, 255);
                    found = true;
                    break;
                }
            }

            if(!found) {
                initViewer(response.data[0], 255);
            }

        } else {
            $('#viewer').hide();
            $('body').addClass('no-viewer');

        }
    });

}


// Launch Forge Viewer
function initViewer(data, color, id) {

    if(typeof data === undefined) return;
    else if(data === "") return;

    if(typeof color !== 'undefined') {
        if(color !== null) {
            backgroundColor = color;
        }
    }

    if(typeof id === 'undefined') id = 'viewer';
    else if(id === null) id = 'viewer';

    $('#' + id + '-message').hide();
    $('#' + id).show();
    $('#' + id + '-progress').hide();

    var options = {
        logLevel : 0,
        env: 'AutodeskProduction',
        api: 'derivativeV2',  // for models uploaded to EMEA change this option to 'derivativeV2_EU'
        getAccessToken: function(onTokenReady) {
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
            viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, onSelectionChanged);

            var startedCode = viewer.start();
            if (startedCode > 0) {
                console.error('Failed to create a Viewer: WebGL not supported.');
                return;
            }

            Autodesk.Viewing.Document.load('urn:'+ data.urn, onDocumentLoadSuccess, onDocumentLoadFailure);
            
        });
    
    } else {

        unloadAll();
        newInstance = false;
        Autodesk.Viewing.Document.load('urn:'+ data.urn, onDocumentLoadSuccess, onDocumentLoadFailure);

    } 
    
}
function onDocumentLoadSuccess(doc) {

    viewer.setGhosting(true);
    viewer.setGroundShadow(false);
    viewer.setGroundReflection(false);
    viewer.setProgressiveRendering(true);

    var viewable = doc.getRoot().getDefaultGeometry();

    if (viewable) {
        viewer.loadDocumentNode(doc, viewable).then(function(result) {
            viewer.setBackgroundColor(backgroundColor, backgroundColor, backgroundColor, backgroundColor, backgroundColor, backgroundColor);
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


// Select and focus on selected item
function viewerSelectModel(partNumber, fitToView) {

    viewerSelectModels([partNumber], fitToView);

}
function viewerSelectModels(partNumbers, fitToView) {

    disableViewerSelectionEvent = true;
    viewer.hideAll();

    if(typeof fitToView === 'undefined') fitToView = false;

    let instances   = viewer.model.getInstanceTree();
    let dbIds       = [];

    for(var i = 1; i < instances.objectCount; i++) {

        viewer.model.getProperties(i, function(data) { 

            let partNumberValues = [];

            for(property of data.properties) {
                if(partNumberProperties.indexOf(property.attributeName) > -1) {

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
                            viewer.setThemingColor(data.dbId, colorModelSelected, null, true );
                            if(fitToView) viewer.fitToView(dbIds);
                            break;
                        }
                    }
                }
            }
            
        })
    }

    disableViewerSelectionEvent = false;

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
                if(partNumberProperties.indexOf(property.attributeName) > -1) {

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
function viewerUnhideModel(partNumber) {

    viewerUnhideModels([partNumber]);

}
function viewerUnhideModels(partNumbers) {

    let instances   = viewer.model.getInstanceTree();
    let dbIds       = [];

    for(var i = 1; i < instances.objectCount; i++) {

        viewer.model.getProperties(i, function(data) { 

            let partNumberValues = [];

            for(property of data.properties) {
                if(partNumberProperties.indexOf(property.attributeName) > -1) {

                    let value = property.displayValue;
                        value = value.split(':')[0];

                    partNumberValues.push(value);

                }
            }

            if(partNumberValues.length > 0) {
                for(partNumber of partNumberValues) {
                    for(number of partNumbers) {
                        if(partNumber.indexOf(number) === 0) {
                            viewer.show(data.dbId);
                            break;
                        }
                    }
                }
            }
            
        })
    }

}


// Reset viewer / deselect all
function resetViewerSelection(resetView) {

    viewer.showAll();
    viewer.clearSelection();
    viewer.clearThemingColors();
    
    if(resetView !== null) {
        if(resetView) {
            viewer.setViewFromFile();
        }
    }

}


// Set custom colors for multiple records
function viewerSetColor(partNumber, color, fitToView) {

    viewerSetColors([partNumber], color, fitToView);

}
function viewerSetColors(partNumbers, color, fitToView) {

    if(typeof partNumbers === 'undefined') return;
    if(partNumbers.length === 0) return;

    if(typeof fitToView === 'undefined') fitToView = false;

    let instances   = viewer.model.getInstanceTree();
    let dbIds       = [];

    for(var i = 1; i < instances.objectCount; i++) {

        viewer.model.getProperties(i, function(data) { 

            let partNumberValues = [];

            for(property of data.properties) {
                if(partNumberProperties.indexOf(property.attributeName) > -1) {
                    let value = property.displayValue;
                        value = value.split(':')[0];

                    partNumberValues.push(value);
                }
            }

            if(partNumberValues.length > 0) {
                for(partNumber of partNumberValues) {
                    for(number of partNumbers) {
                        if(partNumber.indexOf(number) > -1) {
                            viewer.setThemingColor(data.dbId,color, null, true);
                            // viewer.show(data.dbId);
                            if(fitToView) viewer.fitToView(dbIds);
                        }
                    }
                }
            }

        })

    }

}


// Reset all custom colors
function viewerResetColors() {

    if(typeof viewer !== 'undefined') {
        if(viewer.started) {
            viewer.clearThemingColors();
        }
    }

}


// Close markup view
function viewerLeaveMarkupMode() {

    if(typeof markup === 'undefined') return;

    markup.leaveEditMode();
    markup.hide();

}


// Close all models currently in viewer
function unloadAll() {

    let models = viewer.impl.modelQueue().getModels();

    for(model of models) viewer.impl.unloadModel(model);

}


// Custom Controls : Ghosting
function viewerAddGhostingToggle() {

    let customToolbar = new Autodesk.Viewing.UI.ControlGroup('custom-toolbar-ghosting');

    let buttonOff = addCustomControl(customToolbar, 'button-toggle-ghosting-off', 'ms-hide', 'Enable ghosting mode');
        buttonOff.onClick = function(e) { 
            viewer.setGhosting(true);
            $('#custom-toolbar-ghosting').addClass('no-ghosting');
            $('#custom-toolbar-ghosting').removeClass('ghosting');
        };

    let buttonOn = addCustomControl(customToolbar, 'button-toggle-ghosting-on', 'ms-show', 'Disable ghosting mode');
        buttonOn.onClick = function(e) { 
            viewer.setGhosting(false);
            $('#custom-toolbar-ghosting').removeClass('no-ghosting');
            $('#custom-toolbar-ghosting').addClass('ghosting');
        };
        
    viewer.toolbar.addControl(customToolbar);
    $('#custom-toolbar-ghosting').addClass('no-ghosting');

}
function addCustomControl(toolbar, id, icon, tooltip) {

    let newButton = new Autodesk.Viewing.UI.Button(id);
        newButton.addClass('material-symbols-sharp');
        newButton.setIcon(icon);
        newButton.setToolTip(tooltip);

    toolbar.addControl(newButton);

    return newButton;

}


// Custom Controls : S  tandard views
function viewerAddViewsToolbar() {

    let newToolbar  = new Autodesk.Viewing.UI.ControlGroup('my-custom-view-toolbar');
    
    addCustomViewControl(newToolbar, 'my-vhome-button', 'home', "ms-home", "Home");
    addCustomViewControl(newToolbar, 'my-view-front-button', 'front', "ms-north-east", "Front View");
    addCustomViewControl(newToolbar, 'my-view-back-button', 'back', "ms-south-west", "Back View");
    addCustomViewControl(newToolbar, 'my-view-left-button', 'left', "ms-east", "Left View");
    addCustomViewControl(newToolbar, 'my-view-right-button', 'right', "ms-west", "Right View");
    addCustomViewControl(newToolbar, 'my-view-top-button', 'top', "ms-south", "Top View");
    addCustomViewControl(newToolbar, 'my-view-bottom-button', 'bottom', "ms-north", "Bottom View");

    viewer.toolbar.addControl(newToolbar);

}
function addCustomViewControl(toolbar, id, view, icon, tooltip) {
    
    var button = new Autodesk.Viewing.UI.Button(id);
        button.addClass('material-symbols-sharp');
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


// Custom Controls : Markup
function viewerAddMarkupControls() {

    let elemMarkupToolbar = $('<div></div>');
        elemMarkupToolbar.attr('id', 'viewer-markup-toolbar');
        elemMarkupToolbar.addClass('hidden');
        elemMarkupToolbar.addClass('set-defaults');
        elemMarkupToolbar.appendTo($('#viewer'));

    let elemMarkupGroupColors = addMarkupControlGroup(elemMarkupToolbar, 'Color');

    addMarkupColorControl(elemMarkupGroupColors, 'FB5A79');
    addMarkupColorControl(elemMarkupGroupColors, 'FBE235');
    addMarkupColorControl(elemMarkupGroupColors, '3694FB');
    // addMarkupColorControl(elemMarkupGroupColors, '8CE5FC');
    addMarkupColorControl(elemMarkupGroupColors, '68E759');


    let elemMarkupGroupWidth = addMarkupControlGroup(elemMarkupToolbar, 'Width');

    addMarkupWidthControl(elemMarkupGroupWidth, '1', 0.5);
    addMarkupWidthControl(elemMarkupGroupWidth, '2', 1);
    addMarkupWidthControl(elemMarkupGroupWidth, '3', 2);
    addMarkupWidthControl(elemMarkupGroupWidth, '4', 3.5);
    addMarkupWidthControl(elemMarkupGroupWidth, '5', 5);

    let elemMarkupGroupShapes = addMarkupControlGroup(elemMarkupToolbar, 'Shape');

    addMarkupShapeControl(elemMarkupGroupShapes, 'arrow', 'trending_flat');
    addMarkupShapeControl(elemMarkupGroupShapes, 'circle', 'radio_button_unchecked');
    addMarkupShapeControl(elemMarkupGroupShapes, 'rectangle', 'crop_square');
    addMarkupShapeControl(elemMarkupGroupShapes, 'cloud', 'water');
    addMarkupShapeControl(elemMarkupGroupShapes, 'freehand', 'draw');
    addMarkupShapeControl(elemMarkupGroupShapes, 'text', 'text_fields');

    let elemMarkupGroupActions = addMarkupControlGroup(elemMarkupToolbar, 'Actions');

    addMarkupActionControl(elemMarkupGroupActions, true, 'undo', 'markup.undo();');
    addMarkupActionControl(elemMarkupGroupActions, true, 'redo', 'markup.redo();');
    addMarkupActionControl(elemMarkupGroupActions, false, 'Clear', 'markup.clear();');
    addMarkupActionControl(elemMarkupGroupActions, false, 'Close', 'viewerLeaveMarkupMode();');


    let elemMarkupImage = $('<canvas>');
        elemMarkupImage.attr('id', 'viewer-markup-image');
        elemMarkupImage.addClass('hidden');
        elemMarkupImage.appendTo($('body'));


    let newToolbar = new Autodesk.Viewing.UI.ControlGroup('my-custom-markup-toolbar');
    let newButton  = addCustomControl(newToolbar, 'my-markup-button', 'ms-markup', 'Markup');

    newButton.onClick = function() {

        markup.enterEditMode();
        markup.show();
            
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

    };

    viewer.toolbar.addControl(newToolbar);
    
    var promise = viewer.loadExtension('Autodesk.Viewing.MarkupsCore');
    
    promise.then(function(extension){ markup = extension; });

}
function addMarkupControlGroup(elemParent, label) {

    let elemGroup = $('<div></div>');
        elemGroup.addClass('viewer-markup-toolbar-group');
        elemGroup.appendTo(elemParent);

    let elemGroupLabel = $('<div></div>');
        elemGroupLabel.addClass('viewer-markup-toolbar-group-label');
        elemGroupLabel.html(label);
        elemGroupLabel.appendTo(elemGroup);

    return elemGroup;

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
        markupStyle['stroke-width'] = $(this).attr('data-width');
        markup.setStyle(markupStyle);
        $(this).siblings().removeClass('selected');
        $(this).addClass('selected');
    });

}
function addMarkupShapeControl(elemParent, shape, icon) {

    let elemControl = $('<div></div>');
        elemControl.addClass('viewer-markup-toggle');
        elemControl.addClass('shape');
        elemControl.addClass('material-symbols-sharp');
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
function addMarkupActionControl(elemParent, icon, content, script) {

    let elemControl = $('<div></div>');
        elemControl.addClass('viewer-markup-button');
        elemControl.html(content);
        elemControl.attr('onclick', script);
        elemControl.appendTo(elemParent);
        
    if(icon) elemControl.addClass('material-symbols-sharp');

}
function viewerLeaveMarkupMode() {

    $('#viewer-markup-toolbar').addClass('hidden');

    if(typeof markup === 'undefined') return;

    markup.leaveEditMode();
    markup.hide();

}
function viewerCaptureScreenshot(callback) {
   
    var screenshot  = new Image();
    var imageWidth  = viewer.container.clientWidth;
    var imageHeight = viewer.container.clientHeight;

    screenshot.onload = function () {
            
        let canvas          = document.getElementById('viewer-markup-image');
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