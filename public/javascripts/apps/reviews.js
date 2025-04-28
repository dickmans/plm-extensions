let selectDefaults  = true;
let selectedLink    = '';


$(document).ready(function() {  
    
    appendProcessing('panel-pending', false);
    appendProcessing('panel-completed', false);
    appendProcessing('panel-all', false);
    appendProcessing('comments', false);
    appendViewerProcessing();
    appendOverlay();
    
    getFeatureSettings('reviews', [], function(responses) {
        
        getTasksWorkspace();
        getSectionIds(config.reviews.workspaces.reviews);
        setUIEvents();
        // setMarkupColors();

    });
    
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


    // Toggle panel on left side
    $('#toggle-panel').click(function() { 
        $(this).toggleClass('filled').toggleClass('icon-toggle-on').toggleClass('icon-toggle-off');
        $('body').toggleClass('no-panel');
        viewerResize(200);
     });

     
    // Close current Design Review, return to previous page
    $('#review-close').click(function() { 
        closeReview();
     });
     

    // Save findings button
    $('#button-save-comments').click(function() {
        saveComments();        
    });


    // Actions buttions
    // $('#image-refresh').click(function () {
    //     captureScreenshot();
    //     $('#action-image').show();
    // });


    
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



// function onViewerLoadingDone() {
//     $('#button-action-create').removeClass('disabled');
// }




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

    $.post( '/plm/search', params, function(response) {

        elemProcessing.hide();
        
        let selectedTab = $('#main-tabs').find('.selected').attr('id');

        if(selectedTab !== response.params.selectedTab) return;
        
        if(response.data.row.length === 0) {
            
            elemTiles.hide();
            $('#empty').show();
            
        } else {
            
            $.each(response.data.row, function(){
                
                let elemData = getItemData(params.fields, this.fields.entry);
                let elemTile = genSingleTile({
                    link : '',
                    imageLink : '/api/v2/workspaces/' + config.reviews.workspaces.reviews.id + '/items/' + this.dmsId + '/field-values/' + config.reviews.fieldIdImage + '/image/' + elemData[config.reviews.fieldIdImage],
                    tileIcon : 'icon-product',
                    title : elemData[config.reviews.fieldIdItem],
                    subtitle : elemData.TITLE
                });
                    
                elemTile.appendTo(elemTiles)
                    .attr('data-link', '/api/v3/workspaces/' + config.reviews.workspaces.reviews.id + '/items/' + this.dmsId)
                    .attr('data-wsId', config.reviews.workspaces.reviews.id)
                    .attr('data-dmsId', this.dmsId)
                    .attr('data-descriptor', elemData.DESCRIPTOR)
                    .click(function() {
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

    selectedLink = link;

    $('#panel').attr('data-link', link);
    $('#list').hide();
    $('#header-subtitle').html(descriptor).show();

    $('#review').show();
    $('#header-toolbar').children('.button').removeClass('hidden');
    $('#review-finish').addClass('disabled');

    viewerUnloadAllModels();
    viewerLeaveMarkupMode();

    $('#viewer-empty').hide();
    $('#viewer-processing').show();
    $('#viewer-markup-toolbar').addClass('hidden');
    $('#panel').find('.processing').show();

    $('#comments-data').hide();

    // $('.panel-toggles').children().first().click();

    $('#panel-title').html(elemSelected.find('.tile-title').html());
    $('#panel-subtitle').html(elemSelected.find('.tile-subtitle').html());

    setDetails();
    getTransitions();
    // setActions(false);
    
    insertAttachments(link, { 
        id              : 'files',
        hideHeaderLabel : true, 
        editable        : true,
        reload          : true,
        layout          : 'list',
        singleToolbar   : 'controls',
        contentSize     : 'm'
    });
    insertResults(config.reviews.workspaces.tasks.id, [{ 
        field       : 'DESIGN_REVIEW', 
        type        : 0, 
        comparator  : 15, 
        value       : $('#header-subtitle').html() 
    }],{
        id              : 'actions',
        hideHeaderLabel : true,
        openOnDblClick  : true,
        openInPLM       : true,
        reload          : true,
        search          : true,
        layout          : 'list',
        contentSize     : 'xl',
        tileTitle       : 'DESCRIPTOR',
        tileSubtitle    : 'DESCRIPTION',
        tileDetails     : [ {icon : 'icon-calendar', fieldId : 'TARGET_COMPLETION_DATE'}],
        stateColors     : [
            { color : '#dd2222', state : 'Assigned', label : 'New'     },
            { color : '#ed8d16', state : 'In Work' , label : 'In Work' },
            { color : '#6a9728', states : ['Review', 'Complete'], label : 'Complete' }
        ],
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
        sortBy           : ['NUMBER'],
        tileImageFIeldId : 'MARKUP',
        afterCompletion  : function(id) { insertCreateActionButton(id); }
    })

    
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
            id               : 'bom',
            hideHeaderLabel  : true,
            openInPLM        : true,
            search           : true,
            toggles          : true,
            bomViewName      : config.reviews.bomViewName,
            collapseContents : true,
            path             : true,
            counters         : true,
            onClickItem      : function(elemClicked) { onClickBOMItem(elemClicked); }
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


// function selectAction(elemSelected) {
    
//     if(elemSelected.hasClass("selected")){
        
//         elemSelected.removeClass("selected");
        
//         $("#viewer-reset-toolbar").addClass("hidden");
//         $("#guiviewer3d-toolbar").removeClass("hidden");
        
//         markup.hide();
//         markupsvg = "";
//         viewer.restoreState(curViewerState);
        
//         curViewerState = "";
        
//     } else {
        
//         if(curViewerState === "") curViewerState = viewer.getState();
        
//         elemSelected.siblings().removeClass("selected");
//         elemSelected.addClass("selected");
        
//         $("#guiviewer3d-toolbar").addClass("hidden");
//         $("#viewer-reset-toolbar").removeClass("hidden");
        
//         //var markupsvg    = elemSelected.attr("data-MARKUPSVG");
//         markupsvg    = elemSelected.attr("data-MARKUPSVG");
//         var markupstate  = elemSelected.attr("data-MARKUPSTATE");

        
//         var viewerStatePersist = JSON.parse(markupstate);

//         if(markupsvg === "") {
//             viewer.restoreState(viewerStatePersist, null, false);
            
//         } else {
//             viewer.restoreState(viewerStatePersist, null, true);
//         }

//     }
    
// }





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

    $.post('/plm/edit', params, function() {
        $('#comments-data').show();
        $('#comments-processing').hide();
    });

}


function insertCreateActionButton(id) {

    genPanelActionButton(id, { singleToolbar : 'controls' }, 'create', 'Create Action', 'Create new actions', function() {

        insertCreate(null, [config.reviews.workspaces.tasks.id], {
            id                  : 'create-task',
            headerLabel         : 'Create new Design Review Task',
            fieldsIn            : [ 'TITLE', 'DESCRIPTION',  'TARGET_COMPLETION_DATE', 'MARKUP' ],
            // fieldsIn            : [ 'TITLE', 'DESCRIPTION', 'DESIGN_REVIEW', 'TARGET_COMPLETION_DATE', 'MARKUP' ],
            hideSections        : true,
            // contextId           : 'create-task',
            // contextItem         : $('#panel').attr('data-link'),
            // contextItemFields   : [ 'DESIGN_REVIEW' ],

            fieldValues       : [{
                fieldId       : 'DESIGN_REVIEW',
                value         :  selectedLink
                // value         : selectedId
            }],
            viewerImageFields   : [ 'MARKUP' ],
            afterCreation       : function(createId, createLink, id) { afterChangeTaskCreation(createId, createLink, id); }
        });


    }).addClass('default');



}
function afterChangeTaskCreation(createId, link, id) {

    settings.results['actions'].load();
    $('#actions-action-create').removeClass('disabled');
    
}

// Close review and retrun to list of tiles
function closeReview() {

    $('#list').show();
    $('#review').hide();
    $('#header-toolbar').children('.button').addClass('hidden');
    $('#review-finish').removeClass('default');
    $('#header-subtitle').hide();

}


// Forge Viewer interaction
function initViewerDone() {

    $('#viewer-markup-image').attr('data-field-id', 'MARKUP');

}


// Click BOM Item
function onClickBOMItem(elemClicked) {

    let partNumber = elemClicked.attr('data-part-number');

    if(elemClicked.hasClass('selected')) {
        if(!isBlank(partNumber)) viewerSelectModel(partNumber);
    } else viewerResetSelection();

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
    

// }
function removeHighlights() {
    
    $("#panel").find(".highlight").removeClass("highlight");
    
}


// Finish Design Review
function transitionDesignReview() {

    $('#dialog').hide();
    $('#overlay').show();

    let params = { 
        link       : selectedLink, 
        transition : $('#review-finish').attr('data-link'),
        comment    : 'Closed by Design Review Portal'
    }
    $.get('/plm/transition', params, function(response) {
        if(response.error) showErrorMessage('Error while finishing review', response.data.message);
        closeReview();
        $('#overlay').hide();
        $('#main-tabs').find('.selected').click();
    });
    
}