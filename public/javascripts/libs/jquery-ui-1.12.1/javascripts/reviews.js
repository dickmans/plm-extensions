let wsIdTasks       = null;
let sectionId       = null;
let selectedWSID    = null;
let selectedDMSID   = null;

let viewer, markup, markupsvg, curViewerState;

var selectDefaults = true;

let isiPad   = navigator.userAgent.match(/iPad/i)   != null;
let isiPhone = navigator.userAgent.match(/iPhone/i) != null;


var markupStyle = {
    // * defaults got disabled in Mar 2019 due to issues with scaling *
    //    "font-size" : 12,
    //    "stroke-width" : 0.005
    //    "stroke-color" : "#FC5A78"
};


$(document).ready(function() {  
    
    getTasksWorkspace();
    getSectionId("Review Findings");
    setUIEvents();
    selectFirstTab();
    setMarkupColors();
    
});


// Init
function getTasksWorkspace() {

    $.get( '/plm/related-workspaces', {
        wsId : wsId,
        view : '16'
    }, function(data) {
        if(data.length > 0) {
            let link = data[0].link.split('/');
            wsIdTasks = link[link.length - 1];
        }
    });

}
function getSectionId(title) {

    $.get( '/plm/sections', { 'wsId' : wsId }, function(sections) { 
    
        for(section of sections) {
            if(section.title === title) {
                let urn = section.urn.split(".");
                sectionId = urn[urn.length - 1];
                break;
            }
        }

    });

}
function setUIEvents() {

    // List Controls
    $(".tab").click(function() {
        $(this).addClass("selected");
        $(this).siblings().removeClass("selected");
        $(".tile").remove();
        $("#empty").hide();
        $("#progress").show();
    });
    $("#search").on("change paste keyup", function() {
        
        var filter = $("#search").val();
            filter = filter.toUpperCase();
        
        if(filter === "") {

            $(".tile").removeClass("hidden");
            
        } else {
            
            $(".tile-data").each(function ()  {
                
                var hide = true;
                var content = "";
                
                $(this).find(".filter").each(function() {
                    content += $(this).html();  
                })
                
                
                
                
//                var content = $(this).children(".tile-number").html();
//                    content += $(this).children(".tile-title").html();
//                    content += $(this).children(".tile-geometry").html();
                
                 content = content.toUpperCase();
                
                
                if(content.indexOf(filter) >= 0) hide = false;
                
                if(hide) {
                    $(this).parent().addClass("hidden");
                } else {
                    $(this).parent().removeClass("hidden");
                }
                
            })
        }
        
    });


    // Panel Controls
    $(".panel-tab").click(function() {
        
        //removeHighlights();
        
        if($("#panel").attr("data-state") === "min") { $("#panel-toggle-max").click(); }
        
        $(".panel-content").hide();
        
        var elemSelected = $(this);
            elemSelected.siblings().removeClass("selected");
            elemSelected.addClass("selected");
        
        var idContent = elemSelected.attr("data-elem");
        
        $(".panel-content").hide();
        $("#" + idContent).show();
        
    });
    $("#panel-toggle-min").click(function() {
        $(".panel-toggle").toggleClass("hidden");
        $("#panel").animate({bottom:"100%"});
        $("#panel").attr("data-state", "min");
        $("#viewer").css("right" , "0px");
        $("#viewer-markup-toolbar").css("right" , "0px");
        $("#viewer-reset-toolbar").css("right" , "0px");
        if(typeof viewer !== "undefined") viewer.resize();
    });
    $("#panel-toggle-max").click(function() {
        var bottom = (isiPad) ? "30px" : "0px";
        $(".panel-toggle").toggleClass("hidden");
        $("#panel").animate({bottom : bottom });
        $("#panel").attr("data-state", "max");
        $("#viewer-markup-toolbar").css("right" , $("#panel").outerWidth() + "px");
        $("#viewer").css("right" , $("#panel").outerWidth() + "px");
        $("#viewer-reset-toolbar").css("right" , $("#panel").outerWidth() + "px");
        if(typeof viewer !== "undefined") viewer.resize();
    });


    // Save findings button
    $("#button-save-findings").click(function() {
    
        $("#panel-findings-processing").show();
        
        let params = { 
            wsId     : $('.tile.selected').attr("data-wsId"),
            dmsId    : $('.tile.selected').attr("data-dmsId"),
            sections : [{
                id     : sectionId,
                fields : [
                    { 'fieldId' : 'REQUIREMENTS', 'value' : $("#requirements").val() }
                    // { 'fieldId' : 'ISSUES'      , 'value' : $("#issues").val()       },
                    // { 'fieldId' : 'CONCERNS'    , 'value' : $("#concerns").val()     },
                    // { 'fieldId' : 'ALTERNATIVES', 'value' : $("#alternatives").val() },
                    // { 'fieldId' : 'DEFICIENCIES', 'value' : $("#deficiencies").val() }
                ]
            }]
        }
        
        console.log(params);
        
        $.get('/plm/edit', params, function(result) {
            $("#panel-findings-processing").hide();
        });
        
    });


    // File upload capabilities
    $("#button-upload").click(function() {
    
        console.log("#button-upload change");

        let urlUpload = "/plm/upload/";
            urlUpload += selectedWSID + "/";
            urlUpload += selectedDMSID;
    
        $("#uploadForm").attr("action", urlUpload);    
        $("#select-file").click();
        
    }); 
    $("#select-file").change(function() {
        $("#panel-files-processing").show();
        $("#uploadForm").submit();
    });
    $('#frame-download').on('load', function() {
        $("#panel-files-processing").hide();
        setItemAttachments(true);
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
        markup.leaveEditMode();
        markup.hide();
    });


    // Actions buttions
    $("#button-action-create").click(function() {
        removeHighlights();
        captureScreenshot();
        $("#panel-actions").find(".panel-button").toggle();
        $("#dialog-create-action").fadeIn(100);
        $("#panel-actions .panel-list").fadeOut(100);
    });
    $("#button-action-submit").click(function() {
        if(validateForm()) {
            submitCreateForm();
        }
    });
    $("#button-action-cancel").click(function() {
        $("#panel-actions").find(".panel-button").toggle();
        $("#dialog-create-action").fadeOut(100);
        $("#panel-actions .panel-list").fadeIn(100);
        $("#dialog-create-action").find("input").val("");
        $("#dialog-create-action").find("textarea").val("");
        $("#action-image").attr("src", "");
        $("#action-thumbnail").attr("src", "");
        
    });
    $("#image-delete").click(function () {
        $("#action-image").attr("src", "");
        $("#action-image").hide();
        $("#action-thumbnail").attr("src", "");
    });
    $("#image-refresh").click(function () {
        captureScreenshot();
        $("#action-image").show();
    });


    // Close current item, return to previous page
    $("#header-close").click(function() { 
        $("#list").show();
        $("#item").hide();
     });


    // Finish Design Review
    $("#header-finish").click(function() {
        document.getElementById('dialog-overlay').style.display = 'block';
        document.getElementById('dialog-confirm').style.display = 'block';
    });
    $("#dialog-confirm-no").click(function() {
        document.getElementById('dialog-overlay').style.display = 'none';
        document.getElementById('dialog-confirm').style.display = 'none';
    });
    
}
function selectFirstTab() {
    
    $(".tab").first().click();
    
}
function setMarkupColors() {
    
    $(".markup-toggle.color").each(function() {
        $(this).css("background-color", "#" + $(this).attr("data-color"));
    })
    
}
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


// Get list of Design Reviews
function getReviewsPending() {
    let filter = [ { field: "WF_CURRENT_STATE", type: 1, comparator : 3, value : "In Progress" } ];
    getItems(filter);
}
function getReviewsCompleted() {
    let filter = [ 
        { field: "WF_CURRENT_STATE", type: 1, comparator : 5, value : "Planning" }, 
        { field: "WF_CURRENT_STATE", type: 1, comparator : 5, value : "Preparation" }, 
        { field: "WF_CURRENT_STATE", type: 1, comparator : 5, value : "In Progress" } 
    ];
    getItems(filter);
}
function getReviewsAll() {
    let filter = [ 
        { field: "WF_CURRENT_STATE", type: 1, comparator : 5, value : "Planning" }, 
        { field: "WF_CURRENT_STATE", type: 1, comparator : 5, value : "Preparation" }
    ];
    getItems(filter);
}
function getItems(statusFilter) {

    statusFilter.push({
        field       : "VAULT_ITEM",
        type        : 0,
        comparator  : 21,
        value       : "" 
    });
    
    let params = {
        wsId : wsId,
        fields : [
            "TITLE", 
            "TYPE", 
            "TARGET_REVIEW_DATE",
            "VAULT_ITEM",
            "THUMBNAIL",
            "WF_CURRENT_STATE",
            "DESCRIPTOR"
        ],
        sort : ["TITLE"],
        filter : statusFilter
    }

    $.get( '/plm/search', params, function( data ) {
        
        if(data === null) {
            
             $("#empty").show();
            
        } else {
            
            var elemTiles   = $("#tiles");
            var now         = new Date();

            $.each(data.row, function(){
                var elemData = getItemData(params.fields, this.fields.entry);
                appendTile(elemTiles, this.dmsId, wsId, elemData);
            });

            $(".tile").click(function() {
                openSelectedItem($(this));
            });
            
            setImages();

        }

        $("#progress").hide();
        
    });
    
}
function getItemData(fields, values) {
    
    var result = {};
    
    for(field of fields) { result[field] = "";  }
    
    for(value of values) {

        let fieldData  = value.fieldData;
        let fieldValue = "";
        
             if(fieldData.hasOwnProperty("uri")) fieldValue = fieldData.uri;
        else if(fieldData.hasOwnProperty("formattedValue")) fieldValue = fieldData.formattedValue;
        else fieldValue = fieldData.label;
        
        result[value.key] = fieldValue;
        
    }
    
    return result;
    
}
function appendTile(elemTiles, dmsId, wsId, data) {
    
//    console.log("> appendTile : START");
    
    var elemTile    = $("<div></div>");
    var elemImage   = $("<div class='tile-image'></div>");
    var elemData    = $("<div class='tile-data'></div>");
    
    var elemNumber   = $("<div class='tile-number'></div>");
    var elemTitle    = $("<div class='tile-title'></div>");
    var elemGeometry = $("<div class='tile-geometry'></div>");
    var elemDate     = $("<div class='tile-date'></div>");
    var elemStatus   = $("<div class='tile-status'></div>");
    
    elemTile.attr("data-dmsId", dmsId);
    elemTile.attr("data-wsId", wsId);
    // elemTile.attr("data-urn", data.URN);
    elemTile.attr("data-descriptor", data.DESCRIPTOR);
    elemTile.addClass("tile");
    
    elemImage.html('<i class="zmdi zmdi-cloud-outline"></i>');
    
    let thumbnail  = data.THUMBNAIL;
    
    if(thumbnail !== "") {
        let temp = thumbnail.split("?imageid=");
        elemTile.attr("data-imageid", temp[1]);
    }
    
    elemNumber.addClass("filter");
    elemNumber.html(data.TYPE);
    elemTitle.addClass("filter");
    elemTitle.html(data.TITLE);
    
    elemGeometry.append('<i class="zmdi zmdi-shape zmdi-hc-fw"></i>');
    elemGeometry.append("<span class='filter'>" + data.VAULT_ITEM + "<span>"); 
    
    elemDate.append('<i class="zmdi zmdi-calendar zmdi-hc-fw"></i>');
    elemDate.append("<span class='filter'>" + data.TARGET_REVIEW_DATE + "<span>"); 
    
    elemStatus.append('<i class="zmdi zmdi-traffic zmdi-hc-fw"></i>');
    elemStatus.append("<span class='filter'>" + data.WF_CURRENT_STATE + "<span>"); 
    
    elemData.append(elemNumber);
    elemData.append(elemTitle);
    elemData.append(elemGeometry);
    elemData.append(elemDate);
    elemData.append(elemStatus);
    
    elemTile.append(elemImage);
    elemTile.append(elemData);  
    elemTile.appendTo(elemTiles);
    
}
function setImages() {
 
    $(".tile").each(function() {
                
        let image = $(this).attr("data-imageid");
                
        if (typeof image !== 'undefined') {
            if(image !== "") {

                let params = {
                    dmsId   : $(this).attr("data-dmsid"),
                    wsId    : $(this).attr("data-wsid"),
                    imageId : $(this).attr("data-imageid"),
                    fieldId : "THUMBNAIL"
                }
                
                $.get( '/plm/image', params, function( data ) {
                    
                    let elemImage = $("<img class='tile-preview' src='data:image/png;base64," + data + "'>");
                    
                    let elemGraphic = $(".tile[data-dmsid=" + params.dmsId + "]").find(".tile-image").first();
                        elemGraphic.html("");
                        elemGraphic.append(elemImage);
                    
                });
            }
        }
    });
        
}


// Display selected Design Review
function openSelectedItem(elemSelected) {
    
    $("#list").hide();
    $("#item").show();
    $("#viewer").hide();
    $("#viewer-progress").show();

    $(".panel-tab").first().click();
    $('.tile').removeClass('selected');

    selectedWSID  = elemSelected.attr('data-wsId');
    selectedDMSID = elemSelected.attr('data-dmsId');

    elemSelected.addClass('selected');
    elemSelected.siblings().removeClass('selected');

    setItemDetails();
    setItemAttachments(false);
    setItemActions(false);
    
}
function setItemDetails() {
    
    $.get( '/plm/details', { wsId : selectedWSID, dmsId : selectedDMSID }, function( data ) {
        
        $("#header-title").html(data.title);
    
        let elemSubtitle = $("#header-subtitle");
            elemSubtitle.html("");
            elemSubtitle.append('<i class="zmdi zmdi-traffic"></i>').append(data.currentState.title);
    
        let vaultItem = null;

        for(section of data.sections) {

            for(field of section.fields) {

                let link    = field.__self__.split("/");
                let fieldId = link[link.length - 1];
                let value   = (field.value === null) ? "" : field.value;

                switch(fieldId) {
                        
                    case 'TARGET_REVIEW_DATE':
                        if(value !== "") {
                            let targetDate = new Date();
                                targetDate.setTime(Date.parse(value));
                            elemSubtitle.prepend(targetDate.toDateString()).prepend('<i class="icon zmdi zmdi-calendar"></i>');
                        }
                        break;

                    case 'ISSUES':
                        $("#issues").html(value);
                        break;  
                    
                    case 'REQUIREMENTS':
                        $("#requirements").html(value);
                        break;  

                    case 'CONCERNS':
                        $("#concerns").html(value);
                        break;           

                    case 'ALTERNATIVES':
                        $("#alternatives").html(value);
                        break;  

                    case 'DEFICIENCIES':
                        $("#deficiencies").html(value);
                        break;

                    case 'VAULT_ITEM':
                        vaultItem = value;
                        break;

                }
            }

        }

        getViewables(vaultItem);
        
        $("#panel-findings-processing").hide();
        
     });
    
}
function setItemAttachments(update) {

    if(selectedDMSID === null) return;
    
    $.get( '/plm/attachments', { wsId : selectedWSID, dmsId : selectedDMSID }, function(data) {
        
        // console.log(data);

        var currentFiles    = [];
        var currentVersions = [];
        var currentElements = [];
        var elemFiles       = $("#panel-files .panel-list");
    
        elemFiles.children(".file").each(function() {
            $(this).removeClass("highlight");
            currentFiles.push($(this).attr("data-resource-name")); 
            currentVersions.push($(this).attr("data-file-version")); 
            currentElements.push($(this)); 
        });
        
        if(data.length > 0) {
            for(attachment of data) {
                $("#panel-files").find(".panel-empty").hide();
                $("#panel-files").find(".panel-list").show();
                setItemAttachment(update, currentFiles, currentVersions, currentElements, elemFiles, attachment);
            }
        } else {
            $("#panel-files").find(".panel-empty").show();
            $("#panel-files").find(".panel-list").hide();           
        }
        
        $("#panel-files-processing").hide();
        
    });
        
}
function setItemAttachment(update, currentFiles, currentVersions, currentElements, elemFiles, attachment) {
    
    var fileID      = attachment.id;
    var fileVersion = attachment.version;
    var fileTitle   = attachment.resourceName;
    var isNew       = true;
    var isUpdated   = false;
    var elemPrev    = null;
    
    for(var i = 0; i < currentFiles.length; i++) {
        
        if(fileTitle ===currentFiles[i]) {
            isNew = false;
            isUpdated = (parseInt(fileVersion) !== parseInt(currentVersions[i]));
            if(isUpdated) elemPrev = currentElements[i];
            continue;
        }
    }
    
    if(isNew || isUpdated) {
    
        var fileDesc = (typeof attachment.description === "undefined") ? "" : attachment.description;
        var factor   = Math.pow(10, 2);
        var fileSize = attachment.size / 1024 / 1024
            fileSize = Math.round(fileSize * factor) / factor;

        var fileDate = new Date();
            fileDate.setTime(Date.parse(attachment.created.timeStamp));

        var elemFile = $("<div class='file no-select'></div>");
            elemFile.attr("data-file-id", fileID);
            elemFile.attr("data-file-version", fileVersion);
            elemFile.attr("data-resource-name", fileTitle);
            
        let elemFileIcon = getFileIcon(attachment);
            elemFileIcon.appendTo(elemFile);

        var elemFileName = $("<div class='file-name'>" + attachment.name + "</div>");
//        var elemFileDesc = $("<div class='file-detail'>" + fileDesc + "</div>");
        var elemFileDate = $("<div class='file-detail modified'>Updated " + fileDate.toLocaleDateString() + " " + fileDate.toLocaleTimeString() + "</div>");
        var elemFileUser = $("<div class='file-detail modifier'>by " + attachment.created.user.title + "</div>");
        var elemFileVer  = $("<div class='file-detail version clear'>Version : " + fileVersion + "</div>");
        var elemFileSize = $("<div class='file-detail size'>File size : " + fileSize + " MB</div>");

        var elemFileDetails = $("<div class='file-details'></div>");
            elemFileDetails.append(elemFileName);
//            elemFileDetails.append(elemFileDesc);
            elemFileDetails.append(elemFileDate);
            elemFileDetails.append(elemFileUser);
            elemFileDetails.append(elemFileVer);
            elemFileDetails.append(elemFileSize);
            elemFileDetails.appendTo(elemFile);

        // var elemFileActions = $("<div class='file-actions'></div>");
        //     elemFileActions.appendTo(elemFile);

//        var elemFileDownload = $("<div class='file-action download'><i class='zmdi zmdi-download'></i></div>");
//            elemFileDownload.attr("title", "Download file");
//            elemFileDownload.attr("data-file-id", file.fileID);
//            elemFileDownload.appendTo(elemFileActions);
        
        // var elemFileUpdate = $("<div class='file-action upload'><i class='zmdi zmdi-upload'></i></div>");
        //     elemFileUpdate.attr("title", "Update file");
        //     elemFileUpdate.attr("data-file-id", fileID);
        //     elemFileUpdate.attr("data-file-version", fileVersion);
        //     elemFileUpdate.appendTo(elemFileActions);
        
        elemFile.click(function() {
            // let fileId = $(this).attr("data-file-id");
            let params = {
                'wsId'   : $('.tile.selected').attr('data-wsid'),
                'dmsId'  : $('.tile.selected').attr('data-dmsid'),
                'fileId' : $(this).attr('data-file-id')
            }
            $.getJSON( '/plm/download', params, function(data) {
                if(isiPad || isiPhone) {
                    window.open(data.fileUrl, "_blank");
                } else {
                    document.getElementById('frame-download').src = data.fileUrl;
                }
            });
            
        });
           
        // elemFileUpdate.click(function(event) {
            
        //     event.stopPropagation();
            
        //     var elemFile        = $(this).closest(".file");
        //     var fileId          = elemFile.attr("data-file-id");
        //     var fileVersion     = elemFile.attr("data-file-version");
        //     var resourceName    = elemFile.attr("data-resource-name");
            
        //     var urlUpload = "/flc/update/";
        //         urlUpload += workspaceId + "/";
        //         urlUpload += dmsId + "/";
        //         urlUpload += fileId + "/";
        //         urlUpload += fileVersion + "/";
        //         urlUpload += resourceName;
    
        //     $("#uploadForm").attr("action", urlUpload);
        //     $("#select-file").click();
            
        // });
        

        if(isUpdated) {
            elemFile.insertBefore(elemPrev);
            elemPrev.remove();
        } else {
            elemFile.prependTo(elemFiles);
        }
        
        if(update) elemFile.addClass("highlight");
        
    }
    
}
function getFileIcon(attachment) {

    let elemFileIcon = $("<div class='file-icon'></div>");

    switch (attachment.type.extension) {
    
        case '.jpg':
        case '.jpeg':
        case '.JPG':
        case '.png':
        case '.PNG':
        case '.tiff':
        case '.png':
        case '.dwfx':
            elemFileIcon.append('<img src="' + attachment.thumbnails.small + '">');
            break;

        default:
            let svg = getFileSVG(attachment.type.extension);
            elemFileIcon.append('<img ng-src="' + svg + '" src="' + svg + '">');
            break;
    
    }

    return elemFileIcon;
}
function getFileSVG(extension) {

    let svg;

    switch (extension) {
  
        case '.doc':
        case '.docx':
            svg = "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJhc3NldHMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB3aWR0aD0iMTRweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Ym94PSIwIDAgMTQgMTYiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDE0IDE2IiB4bWw6c3BhY2U9InByZXNlcnZlIj48Zz48cG9seWdvbiBmaWxsPSIjMTI3M0M1IiBwb2ludHM9IjksMCA5LDUgMTQsNSAJIi8+PHBhdGggZmlsbD0iIzEyNzNDNSIgZD0iTTgsMEgwdjE2aDE0VjZIOFYweiBNMTAsMTNIMnYtMWg4VjEzeiBNMTIsMTFIMnYtMWgxMFYxMXogTTEyLDh2MUgyVjhIMTJ6Ii8+PC9nPjwvc3ZnPg==";
            break;
        
        case '.xls':
        case '.xlsx':
            svg = "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJhc3NldHMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxM3B4IiB2aWV3Ym94PSIwIDAgMTYgMTMiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDE2IDEzIiB4bWw6c3BhY2U9InByZXNlcnZlIj48cGF0aCBmaWxsPSIjODZCQjQwIiBkPSJNMCwwdjEzaDE2VjBIMHogTTksMTJINHYtMmg1VjEyeiBNOSw5SDRWN2g1Vjl6IE05LDZINFY0aDVWNnogTTksM0g0VjFoNVYzeiBNMTUsMTJoLTV2LTJoNVYxMnogTTE1LDloLTVWNw0KCWg1Vjl6IE0xNSw2aC01VjRoNVY2eiBNMTUsM2gtNVYxaDVWM3oiLz48L3N2Zz4=";
            break;
     
        case '.pdf':
            svg = "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJhc3NldHMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB3aWR0aD0iMTRweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Ym94PSIwIDAgMTQgMTYiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDE0IDE2IiB4bWw6c3BhY2U9InByZXNlcnZlIj48Zz48cG9seWdvbiBmaWxsPSIjRUI0RDREIiBwb2ludHM9IjksMCA5LDUgMTQsNSAJIi8+PHBhdGggZmlsbD0iI0VCNEQ0RCIgZD0iTTgsNlYwSDB2MTZoMTRWNkg4eiBNMiw1aDR2NEgyVjV6IE0xMCwxM0gydi0xaDhWMTN6IE0xMiwxMUgydi0xaDEwVjExeiBNMTIsOUg3VjhoNVY5eiIvPjwvZz48L3N2Zz4=";
            break;
            
        case 'jpg':
        case 'jpeg':
        case 'JPG':
        case 'png':
        case 'PNG':
        case 'tiff':
            svg = "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJhc3NldHMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB3aWR0aD0iMTVweCIgaGVpZ2h0PSIxNXB4IiB2aWV3Ym94PSIwIDAgMTUgMTUiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDE1IDE1IiB4bWw6c3BhY2U9InByZXNlcnZlIj48cGF0aCBmaWxsPSIjN0I4RkE2IiBkPSJNMSwxaDEzdjExSDFWMXogTTAsMHYxNWgxNVYwSDB6IE0xMCw0LjVDMTAsNS4zLDEwLjcsNiwxMS41LDZDMTIuMyw2LDEzLDUuMywxMyw0LjVDMTMsMy43LDEyLjMsMywxMS41LDMNCglDMTAuNywzLDEwLDMuNywxMCw0LjV6IE0yLDExaDEwTDYsNUwyLDlWMTF6Ii8+PC9zdmc+";
            break;
            
    }
    
    return svg;
    
}
function setItemActions(update) {

    if(wsIdTasks === null) return;

    let descriptor = $('.tile.selected').attr('data-descriptor');

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
        filter : [ { field: "DESIGN_REVIEW", type: 0, comparator : 15, value : descriptor } ]
    }
    
    $.get( '/plm/search/', params, function(data) {
        
        console.log(data);

        var currentActions    = [];
        var elemActions       = $("#panel-actions .panel-list");
    
        elemActions.children(".action").each(function() {
            $(this).removeClass("highlight");
            currentActions.push($(this).attr("data-dmsId")); 
        });
        
        if(data !== null) {
            
            $.each(data.row, function(){

                $("#panel-actions-processing").hide();

                var elemData = getItemData(params.fields, this.fields.entry);
                    elemData.dmsId = this.dmsId;

                setItemAction(update, currentActions, elemActions, elemData, update);

            });

            if(update) {
                $("#button-action-cancel").click();
                $("#panel-actions-processing").hide();
            }
        
        } else {
            $("#panel-actions-processing").hide();
        }
        
        setActionsImages();
        
    });
    
}
function setItemAction(update, currentActions, elemActions, data, update) {
        
    let classAction  = "";
    var isNew = true;
    
    switch(data.WF_CURRENT_STATE) {
            
        case "New":
            classAction ="new";
            break; 
            
        case "Complete":
            classAction = "complete";
            break;
            
        case "Assigned":
        case "In Work":
        case "Review":
            classAction ="pending";
            break;
            
    }
    
    for(var i = 0; i < currentActions.length; i++) {
        if(data.dmsId === parseInt(currentActions[i])) {
            isNew = false;
            continue;
        }
    }
    
    if(isNew) {
    
        var elemAction = $("<div class='action'></div>");   
            elemAction.attr('data-dmsId', data.dmsId);
            elemAction.attr('data-wsid', wsIdTasks);
            elemAction.attr('data-MARKUPSVG', data.MARKUPSVG);
            elemAction.attr('data-MARKUPSTATE', data.MARKUPSTATE);
            elemAction.prependTo(elemActions); 
            

        var elemActionImage   = $("<div class='action-image'></div>"); 
        var elemActionDetails = $("<div class='action-details'></div>"); 
        var elemActionColor   = $("<div class='action-status'></div>"); 
            // elemActionColor.css("background", color);
            elemActionColor.append(data.WF_CURRENT_STATE);
            elemActionColor.addClass(classAction);

        
//        if(data.THUMBNAIL === "") {
            
            elemActionImage.append("<i class='zmdi zmdi-image-o'></i>");
            
//        } else {
//            
//            var elemImage = $("<img src='" + data.THUMBNAIL + "'>");
//                elemImage.appendTo(elemActionImage);
//            
//            elemImage.hover(function() {
//                $(this).css("z-index", 100);  
//                $(this).parent().css("overflow", "initial");  
//            });
//            
//            elemImage.mouseleave(function() {
//                $(this).css("z-index", "");  
//                $(this).parent().css("overflow", "hidden");  
//            });
//
//        }

        
        if(data.IMAGE_1 !== "") {
            let temp = data.IMAGE_1.split("?imageid=");
            elemAction.attr("data-imageid", temp[1]);
        }
        
        var elemActionNumber = $("<div class='action-detail action-number'></div>"); 
            elemActionNumber.append(data.NUMBER);
            elemActionNumber.appendTo(elemActionDetails); 
        
        var elemActionTitle = $("<div class='action-detail action-title'></div>"); 
            elemActionTitle.append(data.TITLE);
            elemActionTitle.appendTo(elemActionDetails);

        var elemActionDescription = $("<div class='action-detail action-description'></div>"); 
            elemActionDescription.append(data.DESCRIPTION);
            elemActionDescription.appendTo(elemActionDetails);

        var elemActionDate = $("<div class='action-detail action-date left'></div>"); 
            elemActionDate.append("<i class='zmdi zmdi-time'></i>");
            elemActionDate.append(data.TARGET_COMPLETION_DATE);
            elemActionDate.appendTo(elemActionDetails);

        var elemActionAssignee = $("<div class='action-detail action-user left'></div>"); 
            elemActionAssignee.append("<i class='zmdi zmdi-account'></i>");
            elemActionAssignee.append(data.ASSIGNEE);
            elemActionAssignee.appendTo(elemActionDetails);

        elemAction.append(elemActionColor);
        elemAction.append(elemActionDetails);
        elemAction.append(elemActionImage);
        
        
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
                
                $.get( '/plm/image', params, function( data ) {
                    
                    let elemImage = $("<img src='data:image/png;base64," + data + "'>");

                    elemImage.hover(function() {
                            $(this).css("z-index", 100);  
                            $(this).parent().css("overflow", "initial");  
                        });

                        elemImage.mouseleave(function() {
                            $(this).css("z-index", "");  
                            $(this).parent().css("overflow", "hidden");  
                        });
                    
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



// Get viewables of selected Vault Item to init viewer
function getViewables(vaultItem) {

    if(vaultItem === null) return;
    if(vaultItem === '') return;

    let link = vaultItem.link.split('/');

    let params = {
        wsId    : link[4],
        dmsId   : link[6]
    }

    $.get( '/plm/viewables', params, function(viewables) {

        if(viewables.length > 0) {



            for(viewable of viewables) {

                if(viewable.resourceName.indexOf(".iam.dwf") > -1) {
                    params.attachmentId = viewable.id;
                }

            }


            //for(viewable of viewables) {
            // params.attachmentId = viewables[0].id;
            $.get( '/plm/viewer', params, function(data) {
                initViewer(data);
            });                
        }

    });

}


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

    viewer.setBackgroundColor(240, 240, 240, 240, 240, 240);
    viewer.setGhosting(true);
    viewer.setGroundShadow(true);
    viewer.setGroundReflection(true);
    viewer.setProgressiveRendering(true);

    var viewable = doc.getRoot().getDefaultGeometry();

    if (viewable) {
        viewer.loadDocumentNode(doc, viewable).then(function(result) {
            // viewer.setBackgroundColor(244, 244, 244, 244, 244, 244);
            // console.log('Viewable Loaded!');
            setViewerToolbar();
        }).catch(function(err) {
            // console.log('Viewable failed to load.');
            console.log(err);
        });
    }
}
function onDocumentLoadFailure() {
    console.error('Failed fetching Forge manifest');
}
function setViewerToolbar() {

    // console.log(" > setViewerToolbar START");

//     var toolbar         = viewer.toolbar;
//     var toolbarSettings = toolbar.getControl('settingsTools');
//     var toolbarPages    = new Autodesk.Viewing.UI.ControlGroup('my-custom-pages-toolbar');
    var toolbarView     = new Autodesk.Viewing.UI.ControlGroup('my-custom-view-toolbar');
//     var toolbarMax      = new Autodesk.Viewing.UI.ControlGroup('my-custom-max-toolbar');
    
//     toolbarSettings.removeControl('toolbar-settingsTool');
    
// //    addCustomControl(toolbarPages, 'my-prev-button', 'prev', "zmdi-chevron-left", "Prev");
// //    addCustomControl(toolbarPages, 'my-next-button', 'next', "zmdi-chevron-right", "Next");
    
    addCustomControl(toolbarView, 'my-vhome-button', 'home', "zmdi-home", "Home");
    addCustomControl(toolbarView, 'my-view-front-button', 'front', "zmdi-arrow-right-top", "Front View");
    addCustomControl(toolbarView, 'my-view-back-button', 'back', "zmdi-arrow-left-bottom", "Back View");
    addCustomControl(toolbarView, 'my-view-left-button', 'left', "zmdi-arrow-right", "Left View");
    addCustomControl(toolbarView, 'my-view-right-button', 'right', "zmdi-arrow-left", "Right View");
    addCustomControl(toolbarView, 'my-view-top-button', 'top', "zmdi-long-arrow-down", "Top View");
    addCustomControl(toolbarView, 'my-view-bottom-button', 'bottom', "zmdi-long-arrow-up", "Bottom View");
    
    addMarkupToolbar();
    
//     if(viewables.length > 1) {
//         if(indexViewable === (viewables.length - 1)) {
//             addCustomControl(toolbarPages, 'my-prev-button', 'prev', "zmdi-chevron-left", "Prev");
//         } else if (indexViewable === 0){
//             addCustomControl(toolbarPages, 'my-next-button', 'next', "zmdi-chevron-right", "Next");
//         } else {
//             addCustomControl(toolbarPages, 'my-prev-button', 'prev', "zmdi-chevron-left", "Prev");
//             addCustomControl(toolbarPages, 'my-next-button', 'next', "zmdi-chevron-right", "Next");
//         }
//         viewer.toolbar.addControl(toolbarPages)
//     }
//     //else 
    viewer.toolbar.addControl(toolbarView);
    
//     viewer.setBackgroundColor( 240, 240, 240, 240, 240, 240 );
    
//     $("#toolbar-fullscreenTool").prependTo($("#my-custom-max-toolbar"));

    var promise = viewer.loadExtension('Autodesk.Viewing.MarkupsCore'); // async fetch from server
    
    promise.then(function(extension){
        markup = extension;
        addToolbarLabel("modelTools", "Analysis");
        addToolbarLabel("settingsTools", "Details");
//         addToolbarLabel("my-custom-pages-toolbar", "Pages");
        addToolbarLabel("my-custom-view-toolbar", "Views");
// //    addToolbarLabel("my-custom-max-toolbar", "Maximize");  
        addToolbarLabel("measureTools", "Measure");  


    });
    
    $("#button-action-create").show();

}
function addCustomControl(toolbar, id, view, icon, tooltip) {
    
    // console.log(" > addCustomControl : START");

    var button = new Autodesk.Viewing.UI.Button(id);
        button.addClass('zmdi');
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
    
    var button = new Autodesk.Viewing.UI.Button('my-markup-button');
        button.onClick = function(e) {
            markup.enterEditMode();
            markup.show();
            // markup.setStyle(markupStyle);
            
            if(selectDefaults) {
                $(".markup-toggle.color").first().click();
                $(".markup-toggle.shape").first().click();
//                $(".markup-toggle.thickness").first().click();
                selectDefaults = false;
            } else {
                $(".markup-toggle.shape.selected").click();
            }
            
            
//            $("#viewer-markup-toolbar").show();
            $("#viewer-markup-toolbar").toggleClass("hidden");
        };
        button.addClass('zmdi');
        button.setIcon("zmdi-comment-text-alt");
        button.setToolTip('Markup');
    
    var toolbarMarkup = new Autodesk.Viewing.UI.ControlGroup('my-custom-markup-toolbar');
        toolbarMarkup.addControl(button);
    
    viewer.toolbar.addControl(toolbarMarkup)
    
    addToolbarLabel("my-custom-markup-toolbar", "Markup");
    
}
function onViewerRestore(event) {
     
    markup.unloadMarkupsAllLayers();
    
    if(markupsvg !== "") {
        markup.show();
        markup.loadMarkups(markupsvg, "review");
        
    }
    
}
function loadPrevViewable() {
    
    viewer.tearDown();
    viewer.setUp(viewer.config);
    viewer.loadDocumentNode(doc, viewables[--indexViewable]);   
    
//    if(indexViewable === 0) {
//        $("#my-prev-button").hide();
//    } else {
//        $("#my-prev-button").show();
//    }
    onLoadModelSuccess();
    
}
function loadNextViewable() {
    
    viewer.tearDown();
    viewer.setUp(viewer.config);
    viewer.loadDocumentNode(doc, viewables[++indexViewable]);
    
    onLoadModelSuccess();

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
    
    $("#panel-actions-processing").show();
    
//    console.log($('canvas#action-image')[0].toDataURL());
//    console.log(JSON.stringify($('canvas#action-image')[0].toDataURL()));
// let params = { 
//     wsId     : $('.tile.selected').attr("data-wsId"),
//     dmsId    : $('.tile.selected').attr("data-dmsId"),
//     sections : [{
//         id     : sectionId,
//         fields : [
//             { 'fieldId' : 'REQUIREMENTS', 'value' : $("#requirements").val() }
//             // { 'fieldId' : 'ISSUES'      , 'value' : $("#issues").val()       },
//             // { 'fieldId' : 'CONCERNS'    , 'value' : $("#concerns").val()     },
//             // { 'fieldId' : 'ALTERNATIVES', 'value' : $("#alternatives").val() },
//             // { 'fieldId' : 'DEFICIENCIES', 'value' : $("#deficiencies").val() }
//         ]
//     }]
// }    


    let markupSVG = $("#viewer-markup-toolbar").hasClass("hidden") ? '' : markup.generateData();

    // console.log(markupSVG);
    // console.log($("#viewer-markup-toolbar").hasClass("hidden"));


    let params = { 
        'wsId' : wsIdTasks,
        'sections' : [{
            'id' : 354,
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
            'id' : 355,
            'fields' : [
                { 'fieldId' : 'TARGET_COMPLETION_DATE', 'value' : $("#input-end").val() }
            ]             
        }],
        'image' : {
            'fieldId' : 'IMAGE_1',
            'value' : $('canvas#action-image')[0].toDataURL("image/jpg")
        }
//         "values" : [
//             { 'fieldId' : "TITLE"                 , 'value' : $("#input-task").val()            },
// //            { 'fieldId' : "TYPE"                  , 'value' : $("#input-type").val()            },
//             { 'fieldId' : "DESCRIPTION"           , 'value' : $("#input-details").val()         },
//             { 'fieldId' : "TARGET_COMPLETION_DATE", 'value' : $("#input-end").val()             },
//             { 'fieldId' : "MARKUPSTATE"           , 'value' : JSON.stringify(viewer.getState()) },
//             { 'fieldId' : "MARKUPSVG"             , 'value' : ""                                }
//         ]

//        "IMAGE"                     : $('canvas#action-image')[0].toDataURL(),
//        "THUMBNAIL"                 : $('canvas#action-thumbnail')[0].toDataURL(),
//        "MARKUPSTATE"               : JSON.stringify(viewer.getState()),
//        "MARKUPSVG"                 : "",
     };
    
    // if(!$("#viewer-markup-toolbar").hasClass("hidden")) {
    //     //params.values.MARKUPSVG = markup.generateData();
    // }
    
    console.log(params);

    $.post({
        url : '/plm/create', 
        contentType : "application/json",
        data : JSON.stringify(params)
    }, function(data) {
        console.log("item created");
        setItemActions(true);
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