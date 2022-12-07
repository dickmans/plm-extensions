let wsIdTasks       = null;
let selectedWSID    = null;
let selectedDMSID   = null;
let workspaces      = {};
let selectDefaults  = true;

let viewId;

let isiPad   = navigator.userAgent.match(/iPad/i)   != null;
let isiPhone = navigator.userAgent.match(/iPhone/i) != null;

let sectionIds = {
    'reviews' : [ { 'name' : 'Review Findigs', 'id'   : 346 } ],
    'tasks'   : [ { 'name' : 'Definition', 'id' : 354 }, { 'name' : 'Schedule','id'   : 355 } ]
}


$(document).ready(function() {  
    
    getTasksWorkspace();
    getSectionIds(wsId, sectionIds.reviews);
    setUIEvents();
    selectFirstTabs();
    setMarkupColors();
    
});


function setUIEvents() {


    // Tiles / List Controls
    $('#main-tabs').children().click(function() {
        resetTiles($(this));
        switch($(this).attr('id')) {
            case 'tab-reviews-pending': getReviewsPending(); break;
            case 'tab-reviews-completed': getReviewsCompleted(); break;
            case 'tab-reviews-all': getReviewsAll(); break;
        }
    });
    $('#filter').on("change paste keyup", function() {
        filterTiles();        
    });


    // Close current Design Review, return to previous page
    $('#review-close').click(function() { 
        closeReview();
     });


    // Review Panel Toggles
    $('.panel-toggles').children().click(function() {
        
        $('#panel').children('.toggle').hide();
        
        var elemSelected = $(this);
            elemSelected.siblings().removeClass('selected');
            elemSelected.addClass('selected');
        
        $('#' + elemSelected.attr('data-id')).show();
        
    });
    

    // Save findings button
    $("#button-save-comments").click(function() {
        saveComments();        
    });


    // File upload capabilities
    $("#button-upload").click(function() {
    
        let urlUpload = "/plm/upload/";
            urlUpload += selectedWSID + "/";
            urlUpload += selectedDMSID;
    
        $("#uploadForm").attr("action", urlUpload);    
        $("#select-file").click();
        
    }); 
    $("#select-file").change(function() {
        $("#files-list").hide();
        $("#files-progress").show();
        $("#uploadForm").submit();
    });
    $('#frame-download').on('load', function() {
        $("#files-list").show();
        $("#files-progress").hide();
        setAttachments(true);
    });


    // BOM list controls
    $('#button-bom-reset').click(function() {
        if($('.bom-item.selected').length > 0) {
            $('#button-bom-reset').addClass('disabled');
            $('.bom-item.selected').removeClass('selected');
            resetViewerSelection();
        }
    });
    $('#button-bom-back').click(function() {
        $('#bom-list').removeClass('invisible');
        $('#bom-item-details').addClass('invisible');
        $('#button-bom-back').addClass('hidden');
        $('#button-bom-reset').show();
    });


    // Viewer Markup Toolbar
    $(".markup-toggle").click(function() {
        $(this).siblings().removeClass("selected"); 
        $(this).addClass("selected"); 
    });
    $(".markup-toggle.color").click(function() {
        markupStyle["stroke-color"] = "#" + $(this).attr("data-color");
        markup.setStyle(markupStyle);
    });
    $(".markup-toggle.shape").click(function() {
        setMarkupShape($(this).attr("data-shape"));
    });  
    $("#viewer-markup-close").click(function() {
        $("#viewer-markup-toolbar").toggleClass("hidden");
        viewerLeaveMarkupMode();
    });


    // Actions buttions
    $('#button-action-create').click(function() {
        removeHighlights();
        captureScreenshot();
        $('#actions').find('.button').toggle();
        $('#action-create').show();
        $('#actions-list').hide();
        $('.image-action').css('display', 'flex');
    });
    $('#button-action-submit').click(function() {
        if(validateForm()) {
            submitCreateForm();
        }
    });
    $('#button-action-cancel').click(function() {
        $('#actions').find('.button').toggle();
        $('#action-create').hide();
        $('#actions-list').show();
        $('.image-action').css('display', 'none');
        $('#action-create').find('input').val('');
        $('#action-create').find('textarea').val('');
        $('#action-image').attr('src', '');
        $('#action-thumbnail').attr('src', '');
        
    });
    $('#image-delete').click(function () {
        $('#action-image').attr('src', '');
        $('#action-image').hide();
        $('#action-thumbnail').attr('src', '');
    });
    $('#image-refresh').click(function () {
        captureScreenshot();
        $('#action-image').show();
    });


    
    // Finish Design Review
    $('#review-finish').click(function() {
        $('#overlay').show();
        $('#dialog').show();
    });
    $('#dialog-yes').click(function() {
        transitionDesignReview();
    });
    $('#dialog-no').click(function() {
        $('#overlay').hide();
        $('#dialog').hide();
    });
    
}


// Init at startup
function getTasksWorkspace() {

    $.get( '/plm/related-workspaces', {
        wsId : wsId,
        view : '16'
    }, function(response) {
        if(response.data.length > 0) {
            let link = response.data[0].link.split('/');
            wsIdTasks = link[link.length - 1];
            getSectionIds(wsIdTasks, sectionIds.tasks);
        }
    });

}


// Determine sectionIDs for later update and creation requests
function getSectionIds(workspace, sectionId) {

    $.get( '/plm/sections', { 'wsId' : workspace }, function(response) { 
        for(section of response.data) {
            for(item of sectionId) {
                if(section.name === item.name) {
                    let urn = section.urn.split(".");
                    item.id = urn[urn.length - 1];
                    break;
                }
            }
        }
    });

}


// Select first tab in landing page automatically
function selectFirstTabs() {
    
    $('#main-tabs').children().first().click();
    $('.panel-toggles').children().first().click();
    
}


// Set markup colors for markup toolbar in forge viewer
function setMarkupColors() {
    
    $('.markup-toggle.color').each(function() {
        $(this).css('background-color', '#' + $(this).attr('data-color'));
    })
    
}


// Handling list of tiles
function resetTiles(elemClicked) {

    elemClicked.addClass('selected');
    elemClicked.siblings().removeClass('selected');
    $('#tiles').html('');
    $('#empty').hide();
    $('#list-progress').show();

}
function filterTiles() {

    let filter = $('#filter').val().toUpperCase();

    if(filter === '') {

        $('#tiles').children().show();
        
    } else {
        
        $('#tiles').children().each(function ()  {
            
            let content = $(this).find('.tile-title').html();
            
            content += $(this).find('.tile-subtitle').html(); 
            
            $(this).find('.tile-data').children().each(function() {
                content += $(this).html();  
            })
                        
            content = content.toUpperCase();
            
            let hide = (content.indexOf(filter) >= 0) ? false : true;
            
            if(hide) $(this).hide();
            else     $(this).show();
            
        })
    }

}


// Get list of Design Reviews
function getReviewsPending() {
    let filter = [ { field: 'WF_CURRENT_STATE', type: 1, comparator : 3, value : 'In Progress' } ];
    getItems(filter);
}
function getReviewsCompleted() {
    let filter = [ 
        { field: 'WF_CURRENT_STATE', type: 1, comparator : 5, value : 'Planning' }, 
        { field: 'WF_CURRENT_STATE', type: 1, comparator : 5, value : 'Preparation' }, 
        { field: 'WF_CURRENT_STATE', type: 1, comparator : 5, value : 'In Progress' } 
    ];
    getItems(filter);
}
function getReviewsAll() {
    let filter = [ 
        { field: 'WF_CURRENT_STATE', type: 1, comparator : 5, value : 'Planning' }, 
        { field: 'WF_CURRENT_STATE', type: 1, comparator : 5, value : 'Preparation' }
    ];
    getItems(filter);
}
function getItems(statusFilter) {

    statusFilter.push({
        field       : 'VAULT_ITEM',
        type        : 0,
        comparator  : 21,
        value       : '' 
    });
    
    let params = {
        wsId : wsId,
        fields : [
            'TITLE', 
            'TYPE', 
            'TARGET_REVIEW_DATE',
            'VAULT_ITEM',
            'THUMBNAIL',
            'WF_CURRENT_STATE',
            'DESCRIPTOR'
        ],
        sort : ['TITLE'],
        filter : statusFilter,
        selectedTab : $('#main-tabs').find('.selected').attr('id')
    }

    $.get( '/plm/search', params, function(response) {
        
        let selectedTab = $('#main-tabs').find('.selected').attr('id');
        var elemTiles   = $('#tiles');

        if(selectedTab !== response.params.selectedTab) return;
        
        if(response.data.row.length === 0) {
            
             $('#empty').show();
            
        } else {
            
            $.each(response.data.row, function(){
                
                let elemData = getItemData(params.fields, this.fields.entry);
                let image    = '/api/v2/workspaces/' + wsId + '/items/' + this.dmsId + '/field-values/THUMBNAIL/image/' + elemData.THUMBNAIL;
                let elemTile = genTile('', '', image, 'rate_review', elemData.VAULT_ITEM, elemData.TITLE);
                    elemTile.appendTo(elemTiles);
                    elemTile.attr('data-wsId', wsId);
                    elemTile.attr('data-dmsId', this.dmsId);
                    elemTile.attr('data-descriptor', elemData.DESCRIPTOR);
                    elemTile.click(function() {
                        openSelectedItem($(this));
                    });
                
                appendTileDetails(elemTile, [
                    ['', elemData.DESCRIPTOR, false],
                    ['ms ms-type review-type', elemData.TYPE, false],
                    ['ms ms-calendar review-data', elemData.TARGET_REVIEW_DATE, false],
                    ['ms ms-status review-status', elemData.WF_CURRENT_STATE, false]
                ]);

            });
            
        }

        $('#list-progress').hide();
        
    });
    
}
function getItemData(fields, values) {
    
    var result = {};
    
    for(field of fields) { result[field] = "";  }
    
    for(value of values) {

        let fieldData  = value.fieldData;
        let fieldValue = "";
        
            //  if(fieldData.hasOwnProperty("uri")) fieldValue = fieldData.uri;
              if(fieldData.hasOwnProperty("formattedValue")) fieldValue = fieldData.formattedValue;
         else if(fieldData.hasOwnProperty("value")) fieldValue = fieldData.value;
        else fieldValue = fieldData.label;
        
        result[value.key] = fieldValue;
        
    }
    
    return result;
    
}


// Display selected Design Review
function openSelectedItem(elemSelected) {
    
    let descriptor = elemSelected.attr('data-descriptor');
     selectedWSID  = elemSelected.attr('data-wsId');
     selectedDMSID = elemSelected.attr('data-dmsId');

     $('#panel').attr('data-wsId' , elemSelected.attr('data-wsId' ));
     $('#panel').attr('data-dmsId', elemSelected.attr('data-dmsId'));

    $('#list').hide();

    $('#header-subtitle').html(descriptor).show();

    $('#review').show();
    $('#review-close').show();
    $('#review-finish').show().addClass('disabled');

    $("#viewer").hide();
    $("#viewer-empty").hide();
    $("#viewer-progress").show();
    $('#viewer-markup-toolbar').addClass('hidden');

    viewerLeaveMarkupMode();

    //$('#panel').find('.progress').show();

    $('#comments-data').hide();
    $('#files-list').html('');
    $('#bom-list').html('');
    $('#actions-list').html('');

    $('.panel-toggles').children().first().click();

    let reviewType = (elemSelected.find('.review-type').length > 0) ? elemSelected.find('.review-type').html() : '';
    let reviewStatus = (elemSelected.find('.review-status').length > 0) ? elemSelected.find('.review-status').html() : '';

    let elemPanelHeaderSub = $('#panel-header-sub');
        elemPanelHeaderSub.html('');

    if(reviewType !== '') elemPanelHeaderSub.html('<span>' + reviewType + '</span>').show();
    if(reviewStatus !== '') elemPanelHeaderSub.append($('<span>' + reviewStatus + '</span>')).show();

    $('#panel-header-main').html(elemSelected.find('.tile-title').html());

    setDetails();
    getTransitions();
    setAttachments(false);
    setActions(false);
    
}
function setDetails() {
    
    $.get('/plm/details', { wsId : selectedWSID, dmsId : selectedDMSID }, function(response) {
        
        let vaultItem = null;

        for(section of response.data.sections) {

            for(field of section.fields) {

                let link    = field.__self__.split('/');
                let fieldId = link[link.length - 1];
                let value   = (field.value === null) ? '' : field.value;

                switch(fieldId) {
                        
                    case 'TARGET_REVIEW_DATE':
                        // if(value !== "") {
                        //     let targetDate = new Date();
                        //         targetDate.setTime(Date.parse(value));
                        //     elemSubtitle.prepend(targetDate.toDateString()).prepend('<i class="icon zmdi zmdi-calendar"></i>');
                        // }
                        // break;

                    case 'ISSUES':
                        $('#issues').html(value);
                        break;  
                    
                    case 'REQUIREMENTS':
                        $('#requirements').html(value);
                        break;  

                    case 'CONCERNS':
                        $('#concerns').html(value);
                        break;           

                    case 'ALTERNATIVES':
                        $('#alternatives').html(value);
                        break;  

                    case 'DEFICIENCIES':
                        $('#deficiencies').html(value);
                        break;

                    case 'VAULT_ITEM':
                        vaultItem = value;
                        break;

                }
            }

        }

        getViewables(vaultItem);
        insertFlatBOM('bom-list', 'bom-progress', vaultItem.link, true, []);
        
        $('#comments-data').show();
        $('#comments-progress').hide();
        
    });
    
}
function getTransitions() {
    
    $.get( '/plm/transitions', { wsId : $('#panel').attr('data-wsid'), dmsId : $('#panel').attr('data-dmsid') }, function(response) {
       
        for(transition of response.data) {
            if(transition.name.toUpperCase() === 'CLOSE REVIEW') {
                $('#review-finish').removeClass('disabled');
                $('#review-finish').attr('data-link', transition.__self__);
            }
        }
    });
    
}
function setAttachments(update) {

    if(selectedDMSID === null) return;
    
    $.get( '/plm/attachments', { wsId : selectedWSID, dmsId : selectedDMSID }, function(response) {
        
        $('#files-list').html('');
        $("#files-progress").hide();

        insertAttachments($('#files-list'), response.data, false);        
        
    });
        
}


function setActions(update) {

    if(wsIdTasks === null) return;

    let params = {
        wsId : wsIdTasks,
        fields : [
            'NUMBER', 
            'TITLE', 
            'DESCRIPTION',
            'TARGET_COMPLETION_DATE',
            'ASSIGNEE',
            'IMAGE_1',
            'MARKUPSVG',
            'MARKUPSTATE',
            'WF_CURRENT_STATE'
        ],
        sort : ["NUMBER"],
        filter : [ { field: "DESIGN_REVIEW", type: 0, comparator : 15, value : $('#header-subtitle').html() } ]
    }

    $.get('/plm/search/', params, function(response) {
        
        let currentActions    = [];
        let elemParent       = $("#actions-list");
    
        elemParent.children(".action").each(function() {
            $(this).removeClass("highlight");
            currentActions.push($(this).attr("data-dmsId")); 
        });

        if(response.data.row.length > 0) {
            
            $.each(response.data.row, function(){

                $("#actions-progress").hide();

                var elemData = getItemData(params.fields, this.fields.entry);
                    elemData.dmsId = this.dmsId;

                setAction(update, currentActions, elemParent, elemData, update);

            });

            if(update) {
                $("#button-action-cancel").click();
                $("#actions-progress").hide();
            }
        
        } else {
            $("#actions-progress").hide();
        }
        
        setActionsImages();
        
    });
    
}
function setAction(update, currentActions, elemActions, data, update) {
        
    let classAction  = '';
    var isNew        = true;
    
    switch(data.WF_CURRENT_STATE) {
            
        case 'New':
        case 'Assigned':
        case 'On Hold':
            classAction = 'new';
            break; 
            
        case 'In Work':
        case 'Review':
            classAction = 'pending';
            break;
      
        case 'Complete':
            classAction = 'complete';
            break;
            
    }
    
    for(var i = 0; i < currentActions.length; i++) {
        if(data.dmsId === parseInt(currentActions[i])) {
            isNew = false;
            continue;
        }
    }
    
    if(isNew) {
    
        let elemAction = $('<div></div>');   
            elemAction.addClass('action');
            elemAction.attr('data-dmsId', data.dmsId);
            elemAction.attr('data-wsid', wsIdTasks);
            elemAction.attr('data-MARKUPSVG', data.MARKUPSVG);
            elemAction.attr('data-MARKUPSTATE', data.MARKUPSTATE);
            elemAction.prependTo(elemActions); 
            

        var elemActionImage = $('<div class="action-image"></div>'); 
            elemActionImage.append('<span class="ms ms-3d"></span>');

        var elemActionDetails = $('<div class="action-details"></div>'); 
        
        var elemActionStatus = $('<div class="action-status"></div>'); 
            elemActionStatus.addClass(classAction);

        var elemActionLabel = $('<div class="action-status-label"></div>'); 
            elemActionLabel.append(data.WF_CURRENT_STATE);
            elemActionLabel.appendTo(elemActionStatus);

        if(data.IMAGE_1 !== "") {
            elemAction.attr('data-imageid', data.IMAGE_1);
        }
        
        let elemActionTitle = $("<div class='action-detail action-title'></div>"); 
            elemActionTitle.append(data.TITLE);
            elemActionTitle.addClass('nowrap');
            elemActionTitle.appendTo(elemActionDetails);

        let elemActionDescription = $("<div class='action-detail action-description'></div>"); 
            elemActionDescription.append(data.DESCRIPTION);
            elemActionDescription.appendTo(elemActionDetails);

        let elemActionDate = $("<div class='action-detail action-date left'></div>"); 
            elemActionDate.addClass('ms');
            elemActionDate.addClass('ms-calendar');
            elemActionDate.append(data.TARGET_COMPLETION_DATE);
            elemActionDate.appendTo(elemActionDetails);

        let elemActionAssignee = $("<div class='action-detail action-user left'></div>"); 
            elemActionAssignee.addClass('ms');
            elemActionAssignee.addClass('ms-user');
            elemActionAssignee.append(data.ASSIGNEE);
            elemActionAssignee.appendTo(elemActionDetails);

        elemAction.append(elemActionImage);
        elemAction.append(elemActionDetails);
        elemAction.append(elemActionStatus);
        
        
        elemAction.click(function() {
            selectAction($(this));
        });
        
        if(update) {
            elemAction.addClass("highlight");
            elemActionDetails.addClass("highlight");
        }
        
    }
                       
}
function setActionsImages() {
 
    $(".action").each(function() {

        let image = $(this).attr("data-imageid");
                
        if (typeof image !== 'undefined') {

            if(image !== "") {

                let params = {
                    dmsId   : $(this).attr("data-dmsid"),
                    wsId    : $(this).attr("data-wsid"),
                    imageId : $(this).attr("data-imageid"),
                    fieldId : "IMAGE_1"
                }

                $.get( '/plm/image', params, function(response) {
                    
                    let elemImage = $("<img src='data:image/png;base64," + response.data + "'>");
                    
                    let elemGraphic = $(".action[data-dmsid=" + params.dmsId + "]").find(".action-image").first();
                        elemGraphic.html("");
                        elemGraphic.append(elemImage);
                    
                });
            }
        }

    });
    
}
function selectAction(elemSelected) {
    
    if(elemSelected.hasClass("selected")){
        
        elemSelected.removeClass("selected");
        
        $("#viewer-reset-toolbar").addClass("hidden");
        $("#guiviewer3d-toolbar").removeClass("hidden");
        
        markup.hide();
        markupsvg = "";
        viewer.restoreState(curViewerState);
        
        curViewerState = "";
        
    } else {
        
        if(curViewerState === "") curViewerState = viewer.getState();
        
        elemSelected.siblings().removeClass("selected");
        elemSelected.addClass("selected");
        
        $("#guiviewer3d-toolbar").addClass("hidden");
        $("#viewer-reset-toolbar").removeClass("hidden");
        
        //var markupsvg    = elemSelected.attr("data-MARKUPSVG");
        markupsvg    = elemSelected.attr("data-MARKUPSVG");
        var markupstate  = elemSelected.attr("data-MARKUPSTATE");

        
        var viewerStatePersist = JSON.parse(markupstate);

        if(markupsvg === "") {
            viewer.restoreState(viewerStatePersist, null, false);
            
        } else {
            viewer.restoreState(viewerStatePersist, null, true);
        }

    }
    
}


// Save user comments
function saveComments() {

    $("#comments-data").hide();
    $("#comments-progress").show();

    let params = { 
        wsId     : $('#panel').attr("data-wsId"),
        dmsId    : $('#panel').attr("data-dmsId"),
        sections : [{
            id     : sectionIds.reviews[0].id,
            fields : [
                { 'fieldId' : 'REQUIREMENTS', 'value' : $("#requirements").val() },
                { 'fieldId' : 'ISSUES'      , 'value' : $("#issues").val()       },
                { 'fieldId' : 'CONCERNS'    , 'value' : $("#concerns").val()     },
                { 'fieldId' : 'ALTERNATIVES', 'value' : $("#alternatives").val() },
                { 'fieldId' : 'DEFICIENCIES', 'value' : $("#deficiencies").val() }
            ]
        }]
    }
    
    console.log(params);

    $.get('/plm/edit', params, function(result) {
        $("#comments-data").show();
        $("#comments-progress").hide();
    });

}


// Close review and retrun to list of tiles
function closeReview() {

    $('#list').show();
    $('#review').hide();
    $('#review-close').hide();
    $('#review-finish').hide();
    $('#header-subtitle').hide();

}


// Get viewables of selected Vault Item to init viewer
function getViewables(vaultItem) {

    if(vaultItem === null) return;
    if(vaultItem === ''  ) return;

    $.get('/plm/list-viewables', { 'link' : vaultItem.link }, function(response) {

        if(response.data.length > 0) {

            let viewLink = response.data[0].selfLink;

            $.get( '/plm/get-viewable', { 'link' : viewLink } , function(response) {
                if(response.params.link !== viewLink) return;
                initViewer(response.data, 240);
            });

        }

    });

}
function initViewerDone(newInstance) {
    if(newInstance) {
        setViewerToolbar();
    // } else {
    //     viewerLeaveMarkupMode();
    }
}


// Get flakt BOM of selected Vault Item to init viewer
function selectBOMItem(elemClicked) {

    elemClicked.removeClass('unread');
    
    if(elemClicked.hasClass('selected')) {

        elemClicked.removeClass('selected');
        resetViewerSelection();

    } else {

        $('.bom-item').removeClass('selected');
        elemClicked.addClass('selected');

        let partNumber = elemClicked.attr('data-part-number');
        
        viewerResetColors();
        viewerSelectModel(partNumber, true);

    }

    if($('.bom-item.selected').length === 0) {
        $('#button-bom-reset').addClass('disabled');
        // $('#button-bom-reset').attr('disabled', 'disabled');
    } else {
        $('#button-bom-reset').removeClass('disabled');
        // $('#button-bom-reset').removeAttribute('disabled');
    }

}
function showMoreBOMItem(elemClicked) {

    $('#bom-list').addClass('invisible');
    $('#bom-item-details').removeClass('invisible');

    let elemItem = elemClicked.closest('.bom-item');
    let dataWSID = elemItem.attr('data-wsid');
    let params   = { 'wsId' : dataWSID, 'dmsId' : elemItem.attr('data-dmsid') };
    let promises = [ $.get('/plm/details', params) ];

    $('#button-bom-reset').hide();
    $('#button-bom-back').removeClass('hidden');
    $('#panel-bom-details-header').html(elemItem.attr('data-title'));
    $('#panel-bom-details-fields').html('');

    if(!workspaces.hasOwnProperty(dataWSID)) {
        promises.push($.get('/plm/sections', params));
        promises.push($.get('/plm/fields',   params));
    }

    Promise.all(promises).then(function(responses) {
        
        if(!workspaces.hasOwnProperty(dataWSID)) {
            workspaces[dataWSID] = {
                'sections' : responses[1].data,
                'fields'   : responses[2].data
            };
        }

        insertItemDetails($('#panel-bom-details-fields'),  workspaces[dataWSID].sections,  workspaces[dataWSID].fields, responses[0].data, false, false, false);

    });

}


// Forge Viewer interaction
function onSelectionChanged(event) {}


// Forge Viewer
function setViewerToolbar() {

    // console.log(" > setViewerToolbar START");

//     var toolbar         = viewer.toolbar;
//     var toolbarSettings = toolbar.getControl('settingsTools');
//     var toolbarPages    = new Autodesk.Viewing.UI.ControlGroup('my-custom-pages-toolbar');
    var toolbarView     = new Autodesk.Viewing.UI.ControlGroup('my-custom-view-toolbar');
//     var toolbarMax      = new Autodesk.Viewing.UI.ControlGroup('my-custom-max-toolbar');
    
// //    addCustomControl(toolbarPages, 'my-prev-button', 'prev', "zmdi-chevron-left", "Prev");
// //    addCustomControl(toolbarPages, 'my-next-button', 'next', "zmdi-chevron-right", "Next");
    
    addCustomControl(toolbarView, 'my-vhome-button', 'home', "ms-home", "Home");
    addCustomControl(toolbarView, 'my-view-front-button', 'front', "ms-north-east", "Front View");
    addCustomControl(toolbarView, 'my-view-back-button', 'back', "ms-south-west", "Back View");
    addCustomControl(toolbarView, 'my-view-left-button', 'left', "ms-east", "Left View");
    addCustomControl(toolbarView, 'my-view-right-button', 'right', "ms-west", "Right View");
    addCustomControl(toolbarView, 'my-view-top-button', 'top', "ms-south", "Top View");
    addCustomControl(toolbarView, 'my-view-bottom-button', 'bottom', "ms-north", "Bottom View");
    
    addMarkupToolbar();
    
    viewer.toolbar.addControl(toolbarView);
    
    var promise = viewer.loadExtension('Autodesk.Viewing.MarkupsCore'); // async fetch from server
    
    promise.then(function(extension){
        markup = extension;
        console.log('aha');
        addToolbarLabel("modelTools", "Analysis");
        addToolbarLabel("settingsTools", "Details");
        addToolbarLabel("my-custom-view-toolbar", "Views");
        addToolbarLabel("measureTools", "Measure");  
    });

    
    $("#button-action-create").show();

}
function addCustomControl(toolbar, id, view, icon, tooltip) {
    
    // console.log(" > addCustomControl : START");

    var button = new Autodesk.Viewing.UI.Button(id);
        button.addClass('material-symbols-sharp');
        button.setIcon(icon);
        button.setToolTip(tooltip);
    
    if(view === "home") {
        button.onClick = function(e) { viewer.setViewFromFile(); };
    } else if(view === "prev") {
        button.onClick = function(e) {
            loadPrevViewable();
        }
    } else if(view === "next") {
        button.onClick = function(e) {
            loadNextViewable();
        }
    } else {
        button.onClick = function(e) { 
            let viewcuiext = viewer.getExtension('Autodesk.ViewCubeUi');
                viewcuiext.setViewCube(view);
        };
    }
    
    toolbar.addControl(button);
    
}
function addToolbarLabel(id, label) {

    var elemToolbar = $("#" + id);
    
    var elemLabel = $("<div></div>");
        elemLabel.html(label);
        elemLabel.addClass("toolbar-label");
        elemLabel.appendTo(elemToolbar);
    
}
function addMarkupToolbar () {
    
    let button = new Autodesk.Viewing.UI.Button('my-markup-button');
        button.addClass('material-symbols-sharp');
        button.setIcon('ms-markup');
        button.setToolTip('Markup');
        button.onClick = function() {

            markup.enterEditMode();
            markup.show();
            // markup.setStyle(markupStyle);
            
            if(selectDefaults) {
                $('.markup-toggle.color').first().click();
                $('.markup-toggle.shape').first().click();
//                $(".markup-toggle.thickness").first().click();
                selectDefaults = false;
            } else {
                $(".markup-toggle.shape.selected").click();
            }
            
            
//            $("#viewer-markup-toolbar").show();
            $("#viewer-markup-toolbar").toggleClass("hidden");
        };

    
    var toolbarMarkup = new Autodesk.Viewing.UI.ControlGroup('my-custom-markup-toolbar');
        toolbarMarkup.addControl(button);
    
    viewer.toolbar.addControl(toolbarMarkup)
    
    addToolbarLabel("my-custom-markup-toolbar", "Markup");
    
}
function loadPrevViewable() {
    
    viewer.tearDown();
    viewer.setUp(viewer.config);
    viewer.loadDocumentNode(doc, viewables[--indexViewable]);   
    
    onLoadModelSuccess();
    
}
function loadNextViewable() {
    
    viewer.tearDown();
    viewer.setUp(viewer.config);
    viewer.loadDocumentNode(doc, viewables[++indexViewable]);
    
    onLoadModelSuccess();

}
function onViewerRestore(event) {
     
    markup.unloadMarkupsAllLayers();
    
    if(markupsvg !== "") {
        markup.show();
        markup.loadMarkups(markupsvg, "review");
        
    }
    
}


// Forge Viewer Screenshots
function captureScreenshot() {
   
    var screenshot  = new Image();
    var thumbnail   = new Image();
    var imageWidth  = viewer.container.clientWidth;
    var imageHeight = viewer.container.clientHeight;
//    var thumbWidth  = viewer.container.clientWidth * 200 / viewer.container.clientHeight;
//    var thumbHeight = 200;    
    var thumbWidth  = viewer.container.clientWidth * 110 / viewer.container.clientHeight;
    var thumbHeight = 110; 

    console.log(imageWidth);
    console.log(imageHeight);
    
//    if(imageWidth > 1000) {
//        imageWidth = 1000;
//        imageHeight = viewer.container.clientHeight * 1000 / viewer.container.clientWidth;
//    }
//    
//    if(imageHeight > 1000) {
//        imageHeight = 1000;
//        imageWidth = viewer.container.clientWidth * 1000 / viewer.container.clientHeight;
//    }
    
    screenshot.onload = function () {
        
//        var canvas          = document.getElementById('action-image');
//            canvas.width    = viewer.container.clientWidth;
//            canvas.height   = viewer.container.clientHeight;
//        
//        var context = canvas.getContext('2d');
//            context.clearRect(0, 0, canvas.width, canvas.height);
//            context.drawImage(screenshot, 0, 0, canvas.width, canvas.height);      
        
        var canvas          = document.getElementById('action-image');
//            canvas.width    = imageWidth;
//            canvas.height   = imageHeight;  
            canvas.width    = viewer.container.clientWidth;
            canvas.height   = viewer.container.clientHeight;
        
        var context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(screenshot, 0, 0, canvas.width, canvas.height); 
        
        if(!$("#viewer-markup-toolbar").hasClass("hidden")) markup.renderToCanvas(context);
        
    }
        
    thumbnail.onload = function () {
        
        var canvast          = document.getElementById('action-thumbnail');
            canvast.width    = thumbWidth;
            canvast.height   = thumbHeight;
        
        var context = canvast.getContext('2d');
            context.clearRect(0, 0, canvast.width, canvast.height);
            context.drawImage(thumbnail, 0, 0, canvast.width, canvast.height);
        
//        if(!$("#viewer-markup-toolbar").hasClass("hidden")) markup.renderToCanvas(context);
        
    }

    viewer.getScreenShot(imageWidth, imageHeight, function (blobURL) {
//        //$("#action-image").attr("src", blobURL);
        screenshot.src = blobURL;
        
        
//            viewer.getScreenShot(thumbWidth, thumbHeight, function (blobURLt) {
//        thumbnail.src = blobURLt;
//    });
        
    });
    
//    viewer.getScreenShot(thumbWidth, thumbHeight, function (blobURL) {
//        thumbnail.src = blobURL;
//    });
    
}
function submitCreateForm() {
    
    $('#actions-progress').show();
    $('#action-create').hide();

    let markupSVG = $("#viewer-markup-toolbar").hasClass("hidden") ? '' : markup.generateData();

    let params = { 
        'wsId' : wsIdTasks,
        'sections' : [{
            'id' : sectionIds.tasks[0].id,
            'fields' : [
                { 'fieldId' : 'TITLE', 'value' : $('#input-task').val() },
                { 'fieldId' : 'DESCRIPTION', 'value' : $('#input-details').val() },
                { 'fieldId' : 'MARKUPSTATE', 'value' : JSON.stringify(viewer.getState()) },
                { 'fieldId' : 'MARKUPSVG', 'value' : markupSVG },
                { 'fieldId' : 'DESIGN_REVIEW', 'value' : {
                    'link' : '/api/v3/workspaces/' + selectedWSID + '/items/' + selectedDMSID
                }}
            ] 
        },{
            'id' : sectionIds.tasks[1].id,
            'fields' : [
                { 'fieldId' : 'TARGET_COMPLETION_DATE', 'value' : $("#input-end").val() }
            ]             
        }],
        'image' : {
            'fieldId' : 'IMAGE_1',
            'value' : $('canvas#action-image')[0].toDataURL("image/jpg")
        }
    };

    console.log($('canvas#action-image')[0].toDataURL("image/jpg"));

    console.log(params);

    $.post({
        url : '/plm/create', 
        contentType : "application/json",
        data : JSON.stringify(params)
    }, function(data) {
        $('#actions-progress').hide();
        $('#action-create').show();
        setActions(true);
    });
        
}
function removeHighlights() {
    
    $("#panel").find(".highlight").removeClass("highlight");
    
}
function validateForm() {
    
    var result = true;
    
   $('input,textarea,select').filter('[required]').each(function() {
       
       var value = $(this).val();$
       
       if(value === "") {
           
           $(this).addClass("required-empty");
           $("<div class='validation-error'>Input is required</div>").insertAfter($(this));
           result = false;
           
       }
       
   });
    
    return result;
    
}


// Markup Toobar Features
function setMarkupShape(shape) {

    switch (shape) {

        case 'arrow':
            var mode = new Autodesk.Viewing.Extensions.Markups.Core.EditModeArrow(markup);
            break;

        case 'circle':
            var mode = new Autodesk.Viewing.Extensions.Markups.Core.EditModeCircle(markup);
            break;

        case 'cloud':
            var mode = new Autodesk.Viewing.Extensions.Markups.Core.EditModeCloud(markup)
            break;

        case 'freehand':
            var mode = new Autodesk.Viewing.Extensions.Markups.Core.EditModeFreehand(markup);
            break;

        case 'rectangle':
            var mode = new Autodesk.Viewing.Extensions.Markups.Core.EditModeRectangle(markup);
            break;

        case 'text':
            var mode = new Autodesk.Viewing.Extensions.Markups.Core.EditModeText(markup);
            break;

        case 'polycloud':
            var mode = new Autodesk.Viewing.Extensions.Markups.Core.EditModePolycloud(markup);
            break;

        case 'polyline':
            var mode = new Autodesk.Viewing.Extensions.Markups.Core.EditModePolyline(markup);
            break;
    }

    markup.changeEditMode(mode);
    markup.setStyle(markupStyle);

}


// Finish Design Review
function transitionDesignReview() {

    $('#dialog').hide();
    $('#overlay .progress').show();

    let params = { 
        'wsId'       : $('#panel').attr('data-wsid'), 
        'dmsId'      : $('#panel').attr('data-dmsid'), 
        'transition' : $('#review-finish').attr('data-link'),
        'comment'    : 'Closed by Design Review Portal'
    }

    $.get( '/plm/transition', params, function(response) {
        $('#review-close').click();
        $('#overlay .progress').hide();
        $('#overlay').hide();
        $('#main-tabs').find('.selected').click();
    });
    
    
}