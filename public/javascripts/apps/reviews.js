let selectDefaults  = true;


$(document).ready(function() {  

    applicationFeatures.viewer = config.reviews.viewerFeatures;
    
    appendProcessing('panel-pending', false);
    appendProcessing('panel-completed', false);
    appendProcessing('panel-all', false);
    appendProcessing('comments', false);
    appendProcessing('actions', false);
    appendViewerProcessing();
    appendOverlay();

    getTasksWorkspace();
    getSectionIds(config.reviews.workspaces.reviews);
    setUIEvents();
    // setMarkupColors();
    
});


function setUIEvents() {


    // Tiles / List Controls
    $('#main-tabs').children().click(function() {
        resetTiles($(this));
        switch($(this).attr('id')) {
            case 'tab-reviews-pending'  : getReviewsPending();   break;
            case 'tab-reviews-completed': getReviewsCompleted(); break;
            case 'tab-reviews-all'      : getReviewsAll();       break;
        }
    });
    $('#main-tabs').children().first().click();
    $('#filter').on('change paste keyup', function() {
        filterTiles('filter', 'list-pending');
        filterTiles('filter', 'list-completed');
        filterTiles('filter', 'list-all');
    });


    // Close current Design Review, return to previous page
    $('#review-close').click(function() { 
        closeReview();
     });
     

    // Save findings button
    $('#button-save-comments').click(function() {
        saveComments();        
    });


    // BOM list controls
    $('#button-bom-reset').click(function() {
        if($('.bom-item.selected').length > 0) {
            $('#button-bom-reset').addClass('disabled');
            $('.bom-item.selected').removeClass('selected');
            viewerResetSelection();
        }
    });
    $('#button-bom-back').click(function() {
        $('#bom-list').removeClass('invisible');
        $('#bom-item-details').addClass('invisible');
        $('#button-bom-back').addClass('hidden');
        $('#button-bom-reset').show();
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

    if(isBlank(config.reviews.workspaces.tasks.id)) {

        $.get( '/plm/related-workspaces', {
            wsId : config.reviews.workspaces.reviews.id,
            view : '16'
        }, function(response) {
            if(response.data.length > 0) {
                let link = response.data[0].link.split('/');
                config.reviews.workspaces.tasks.id = link[link.length - 1];
                getSectionIds(config.reviews.workspaces.tasks);
            }
        });

    } else {
        
        getSectionIds(config.reviews.workspaces.tasks);

    }

}


// Determine sectionIDs for later update and creation requests
function getSectionIds(workspace) {

    $.get( '/plm/sections', { 'wsId' : workspace.id }, function(response) { 
        for(section of response.data) {
            for(wsSection of workspace.sections) {
                if(section.name === wsSection.name) {
                    let urn = section.urn.split(".");
                    wsSection.id = urn[urn.length - 1];
                    break;
                }
            }
        }
    });

}



// Handling list of tiles
function resetTiles(elemClicked) {

    elemClicked.addClass('selected');
    elemClicked.siblings().removeClass('selected');
    $('#tiles').html('');
    $('#empty').hide();
    $('#list-processing').show();

}


// Get list of Design Reviews
function getReviewsPending() {
    let filter = [ { field: 'WF_CURRENT_STATE', type: 1, comparator : 3, value : config.reviews.workspaces.reviews.states[2] } ];
    getReviews(filter, 'pending');
}
function getReviewsCompleted() {
    let filter = [ 
        { field: 'WF_CURRENT_STATE', type: 1, comparator : 5, value : config.reviews.workspaces.reviews.states[0] }, 
        { field: 'WF_CURRENT_STATE', type: 1, comparator : 5, value : config.reviews.workspaces.reviews.states[1] }, 
        { field: 'WF_CURRENT_STATE', type: 1, comparator : 5, value : config.reviews.workspaces.reviews.states[2] } 
    ];
    getReviews(filter, 'completed');
}
function getReviewsAll() {
    let filter = [ 
        { field: 'WF_CURRENT_STATE', type: 1, comparator : 5, value : config.reviews.workspaces.reviews.states[0] }, 
        { field: 'WF_CURRENT_STATE', type: 1, comparator : 5, value : config.reviews.workspaces.reviews.states[1] }
    ];
    getReviews(filter, 'all');
}
function getReviews(statusFilter, id) {

    statusFilter.push({
        field       : config.reviews.fieldIdItem,
        type        : 0,
        comparator  : 21,
        value       : '' 
    });
    
    let params = {
        wsId : config.reviews.workspaces.reviews.id,
        fields : [
            'TITLE', 
            'TYPE', 
            'TARGET_REVIEW_DATE',
            config.reviews.fieldIdItem,
            config.reviews.fieldIdImage,
            'WF_CURRENT_STATE',
            'DESCRIPTOR'
        ],
        sort : ['TITLE'],
        filter : statusFilter,
        selectedTab : $('#main-tabs').find('.selected').attr('id')
    }

    let elemTiles = $('#list-' + id);
        elemTiles.html('');

    let elemProcessing = $('#panel-' + id).find('.processing').first();
        elemProcessing.show();

    $.get( '/plm/search', params, function(response) {

        elemProcessing.hide();
        
        let selectedTab = $('#main-tabs').find('.selected').attr('id');

        if(selectedTab !== response.params.selectedTab) return;
        
        if(response.data.row.length === 0) {
            
            elemTiles.hide();
            $('#empty').show();
            
        } else {
            
            $.each(response.data.row, function(){
                
                let elemData = getItemData(params.fields, this.fields.entry);
                let image    = '/api/v2/workspaces/' + config.reviews.workspaces.reviews.id + '/items/' + this.dmsId + '/field-values/' + config.reviews.fieldIdImage + '/image/' + elemData[config.reviews.fieldIdImage];
                let elemTile = genTile('', '', image, 'rate_review', elemData[config.reviews.fieldIdItem], elemData.TITLE);
                    elemTile.appendTo(elemTiles);
                    elemTile.attr('data-link', '/api/v3/workspaces/' + config.reviews.workspaces.reviews.id + '/items/' + this.dmsId);
                    elemTile.attr('data-wsId', config.reviews.workspaces.reviews.id);
                    elemTile.attr('data-dmsId', this.dmsId);
                    elemTile.attr('data-descriptor', elemData.DESCRIPTOR);
                    elemTile.click(function() {
                        openSelectedItem($(this));
                    });
                
                appendTileDetails(elemTile, [
                    [''                       , elemData.DESCRIPTOR          , false],
                    ['with-icon icon-type'    , elemData.TYPE                , false],
                    ['with-icon icon-calendar', elemData.TARGET_REVIEW_DATE  , false],
                    ['with-icon icon-status'  , elemData.WF_CURRENT_STATE    , false]
                ]);

            });
            
        }
        
    });
    
}
function getItemData(fields, values) {
    
    var result = {};
    
    for(field of fields) { result[field] = '';  }
    
    for(value of values) {

        let fieldData  = value.fieldData;
        let fieldValue = '';
        
              if(fieldData.hasOwnProperty('formattedValue')) fieldValue = fieldData.formattedValue;
         else if(fieldData.hasOwnProperty('value')) fieldValue = fieldData.value;
        else fieldValue = fieldData.label;
        
        result[value.key] = fieldValue;
        
    }
    
    return result;
    
}


// Display selected Design Review
function openSelectedItem(elemSelected) {
    
    let descriptor = elemSelected.attr('data-descriptor');
    let link       = elemSelected.attr('data-link');

    $('#panel').attr('data-link', link);
    $('#list').hide();
    $('#header-subtitle').html(descriptor).show();

    $('#review').show();
    $('#review-close').removeClass('hidden');
    $('#review-finish').removeClass('hidden').addClass('disabled');

    viewerUnloadAllModels();
    viewerLeaveMarkupMode();

    $('#viewer-empty').hide();
    $('#viewer-processing').show();
    $('#viewer-markup-toolbar').addClass('hidden');
    $('#panel').find('.processing').show();

    $('#comments-data').hide();
    $('#files-list').html('');
    $('#bom-list').html('');
    $('#actions-list').html('');

    // $('.panel-toggles').children().first().click();

    $('#panel-title').html(elemSelected.find('.tile-title').html());
    $('#panel-subtitle').html(elemSelected.find('.tile-subtitle').html());

    setDetails();
    getTransitions();
    setActions(false);
    insertAttachments(link, { 
        'id'        : 'files',
        'header'    : true, 
        'headerLabel' : '',
        'layout'    : 'list',
        'size'      : 'l', 
        'upload'    : true, 
    });

    
}
function setDetails() {
    
    $.get('/plm/details', { 'link' : $('#panel').attr('data-link') }, function(response) {
        
        let linkItem = getSectionFieldValue(response.data.sections, config.reviews.fieldIdItem, 'link');

        $('#requirements').val($('<div></div>').html(getSectionFieldValue(response.data.sections, 'REQUIREMENTS', '')).text());
        $('#issues'      ).val($('<div></div>').html(getSectionFieldValue(response.data.sections, 'ISSUES',       '')).text());
        $('#concerns'    ).val($('<div></div>').html(getSectionFieldValue(response.data.sections, 'CONCERNS',     '')).text());
        $('#alternatives').val($('<div></div>').html(getSectionFieldValue(response.data.sections, 'ALTERNATIVES', '')).text());
        $('#deficiencies').val($('<div></div>').html(getSectionFieldValue(response.data.sections, 'DEFICIENCIES', '')).text());

        insertViewer(linkItem);
        insertBOM(linkItem, { 
            'id'        : 'bom',
            title       : '',
            hideDetails : true,
            bomViewName : config.reviews.bomViewName,
            openInPLM   : false,
            reset       : true,
            quantity    : true
        });
        
        $('#comments-data').show();
        $('#comments-processing').hide();
        
    });
    
}
function getTransitions() {

    $.get( '/plm/transitions', { 'link' : $('#panel').attr('data-link') }, function(response) {
        for(transition of response.data) {
            if(transition.customLabel.toUpperCase() === config.reviews.transitionId) {
                $('#review-finish').removeClass('disabled');
                $('#review-finish').addClass('default');
                $('#review-finish').attr('data-link', transition.__self__);
            }
        }
    });
    
}


function setActions(update) {

    if(config.reviews.workspaces.tasks.id === null) return;

    let params = {
        wsId : config.reviews.workspaces.tasks.id,
        fields : [
            'NUMBER', 
            'TITLE', 
            'DESCRIPTION',
            'TARGET_COMPLETION_DATE',
            'ASSIGNEE',
            'MARKUP',
            'MARKUPSVG',
            'MARKUPSTATE',
            'WF_CURRENT_STATE'
        ],
        sort : ['NUMBER'],
        filter : [ { field: 'DESIGN_REVIEW', type: 0, comparator : 15, value : $('#header-subtitle').html() } ]
    }

    $.get('/plm/search/', params, function(response) {

        if(response.error) {
            showErrorMessage('Error', 'Failed to load list of actions');
        } else {

            let currentActions    = [];
            let elemParent       = $('#actions-list');
        
            elemParent.children('.action').each(function() {
                $(this).removeClass('highlight');
                currentActions.push($(this).attr('data-dmsId')); 
            });

            if(response.data.row.length > 0) {
                
                $.each(response.data.row, function(){

                    $('#actions-progress').hide();

                    var elemData = getItemData(params.fields, this.fields.entry);
                        elemData.dmsId = this.dmsId;

                    setAction(update, currentActions, elemParent, elemData, update);

                });

                if(update) {
                    $('#button-action-cancel').click();
                    $('#actions-progress').hide();
                }
            
            }
        
        }

        $('#actions-processing').hide();
        setActionsImages();
        
    });
    
}
function setAction(update, currentActions, elemActions, data, update) {
        
    let classAction  = '';
    var isNew        = true;
    
    switch(data.WF_CURRENT_STATE) {
            
        case config.reviews.workspaces.tasks.states[0]:
        case config.reviews.workspaces.tasks.states[1]:
            classAction = 'new';
            break; 
            
        case config.reviews.workspaces.tasks.states[2]:
        case config.reviews.workspaces.tasks.states[3]:
            classAction = 'pending';
            break;
      
        case config.reviews.workspaces.tasks.states[4]:
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
            elemAction.addClass('tile');
            elemAction.attr('data-dmsId', data.dmsId);
            elemAction.attr('data-wsid', config.reviews.workspaces.tasks.id);
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

        if(data.MARKUP !== "") {
            elemAction.attr('data-imageid', data.MARKUP);
        }
        
        let elemActionTitle = $("<div class='action-detail action-title'></div>"); 
            elemActionTitle.append(data.TITLE);
            elemActionTitle.addClass('nowrap');
            elemActionTitle.appendTo(elemActionDetails);

        let elemActionDescription = $("<div class='action-detail action-description'></div>"); 
            elemActionDescription.append(data.DESCRIPTION);
            elemActionDescription.appendTo(elemActionDetails);

        let elemActionDate = $("<div class='action-detail'></div>"); 
            elemActionDate.addClass('with-icon');
            elemActionDate.addClass('icon-calendar');
            elemActionDate.append(data.TARGET_COMPLETION_DATE);
            elemActionDate.appendTo(elemActionDetails);

        let elemActionAssignee = $("<div class='action-detail'></div>"); 
            elemActionAssignee.addClass('with-icon');
            elemActionAssignee.addClass('icon-user');
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
                    fieldId : "MARKUP"
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

    $('#comments-data').hide();
    $('#comments-processing').show();

    let params = { 
        link       : $('#panel').attr('data-link'),
        sections   : [{
            id     : config.reviews.workspaces.reviews.sections[0].id,
            fields : [
                { 'fieldId' : 'REQUIREMENTS', 'value' : $('#requirements').val() },
                { 'fieldId' : 'ISSUES'      , 'value' : $('#issues').val()       },
                { 'fieldId' : 'CONCERNS'    , 'value' : $('#concerns').val()     },
                { 'fieldId' : 'ALTERNATIVES', 'value' : $('#alternatives').val() },
                { 'fieldId' : 'DEFICIENCIES', 'value' : $('#deficiencies').val() }
            ]
        }]
    }

    $.get('/plm/edit', params, function() {
        $('#comments-data').show();
        $('#comments-processing').hide();
    });

}


// Close review and retrun to list of tiles
function closeReview() {

    $('#list').show();
    $('#review').hide();
    $('#review-close').addClass('hidden');
    $('#review-finish').addClass('hidden').removeClass('default');
    $('#header-subtitle').hide();

}


// Get flat BOM of selected Vault Item to init viewer
function clickBOMItemDone(e, elemClicked) {

    if(elemClicked.hasClass('selected')) {
        let partNumber = elemClicked.attr('data-part-number');
        viewerSelectModel(partNumber);
    }

}
function clickBOMDeselectAllDone(elemClicked) {
    viewerResetSelection();
}
function clickBOMResetDone(elemClicked) {
    viewerResetSelection();
}



// Forge Viewer interaction
function initViewerDone() {

    $('#viewer-markup-image').attr('data-field-id', 'MARKUP');

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
    
    $('#actions-processing').show();
    $('#action-create').hide();

    let markupSVG = $("#viewer-markup-toolbar").hasClass("hidden") ? '' : markup.generateData();

    let params = { 
        'wsId' : config.reviews.workspaces.tasks.id,
        'sections' : [{
            'id' : config.reviews.workspaces.tasks.sections[0].id,
            'fields' : [
                { 'fieldId' : 'TITLE', 'value' : $('#input-task').val() },
                { 'fieldId' : 'DESCRIPTION', 'value' : $('#input-details').val() },
                { 'fieldId' : 'MARKUPSTATE', 'value' : JSON.stringify(viewer.getState()) },
                { 'fieldId' : 'MARKUPSVG', 'value' : markupSVG },
                { 'fieldId' : 'DESIGN_REVIEW', 'value' : {
                    'link'  : $('#panel').attr('data-link') 
                }}
            ] 
        },{
            'id' : config.reviews.workspaces.tasks.sections[1].id,
            'fields' : [
                { 'fieldId' : 'TARGET_COMPLETION_DATE', 'value' : $("#input-end").val() }
            ]             
        }],
        'image' : {
            'fieldId' : config.reviews.fieldIdMarkup,
            'value' : $('canvas#action-image')[0].toDataURL("image/jpg")
        }
    };

    $.post({
        url : '/plm/create', 
        contentType : "application/json",
        data : JSON.stringify(params)
    }, function() {
        $('#actions-processing').hide();
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


// Finish Design Review
function transitionDesignReview() {

    $('#dialog').hide();
    $('#overlay').show();

    let params = { 
        'link'       : $('#panel').attr('data-link'), 
        'transition' : $('#review-finish').attr('data-link'),
        'comment'    : 'Closed by Design Review Portal'
    }

    $.get( '/plm/transition', params, function() {
        $('#review-close').click();
        $('#overlay').hide();
        $('#main-tabs').find('.selected').click();
    });
    
}