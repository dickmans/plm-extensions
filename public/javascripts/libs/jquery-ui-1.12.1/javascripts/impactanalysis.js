let viewer;
let managedItems = [];


$(document).ready(function() {   

    setUIEvents();
    getChangeOrderDetails();
    getManagedItems();

});


// UI functionality
function setUIEvents() {
    
    $("#details-show-more").click(function() {
        $(this).hide();
        $(this).siblings().show();
        $(".section-title").fadeIn();
        $(".section").fadeIn();
        $("#details-list").addClass("more");
    });
    
    $("#details-show-less").click(function() {
        $(this).hide();
        $(this).siblings().show();
        $(".section").hide();
        $(".section-title").hide();
        $(".section").first().show();
        $("#details-list").removeClass("more");
    });  
    
    $(".tab").click(function() {
        $(".tab").removeClass("selected");
        $(this).addClass("selected");
        let tabId = $(this).attr("tab-id");
        $(".content").hide();
        $("#"+ tabId).show();
    });

    $(".tab").first().click();

}
function reset() {
   
    $(".counter").html('');
    $(".counter").hide();
    $(".loading").show();

    // $(".processing").show();
    $(".section").remove();
    $(".content-table").children().remove();
    // $(".content-table").hide();
    // $(".counter").html("0");

    $("#message").hide();
    // $(".content").show();

    $("#details-show-more").show();
    $("#details-show-less").hide();
    
    $("#equipments-table").append("<tr><th>Name</th><th>REV</th><th>Status</th><th>BOM Items</th></tr>");
    $("#orders-table").append("<tr><th>Name</th><th>REV</th><th>Status</th><th>BOM Items</th></tr>");
    
}
function getItemLink(title, urn, tag) {
    
    if(tag === null) tag = 'td';
    if(typeof tag === 'undefined') tag = 'td';

    let params  = urn.split(".");
    let wsId    = params[params.length - 2];
    let urnLink = urn;
        urnLink = urnLink.replace(/:/g, "%60");
        urnLink = urnLink.replace(/\./g, ",");
    
    let link = $("<a></a>");
        link.attr("target", "_blank");
        link.attr("href", "https://" + tenant + ".autodeskplm360.net/plm/workspaces/" + wsId + "/items/itemDetails?view=full&tab=details&mode=view&itemId=" + urnLink);
        link.html(title);
    
    let elemLink = $('<' + tag + '></' + tag + '>');
        elemLink.append(link);
    
    return elemLink;
                    
}
function getFieldItemLink(value) {
    
    let params  = value.urn.split(".");
    let wsId    = params[params.length - 2];
    let urnLink = value.urn;
        urnLink = urnLink.replace(/:/g, "%60");
    
    let link = $("<a></a>");
        link.css("display", "block");
        link.attr("target", "_blank");
        link.attr("href", "https://" + tenant + ".autodeskplm360.net/plm/workspaces/" + wsId + "/items/itemDetails?view=full&tab=details&mode=view&itemId=" + urnLink);
        link.html(value.title);
    
    return link;
                    
}
function setCounter(id, value) {

    let elemCounter = $('#' + id + '-counter');

    elemCounter.html(value);
    elemCounter.siblings().hide();

    if(value > 0) elemCounter.show();
    else elemCounter.hide();

}


// Get report header and tab label
function getChangeOrderDetails() {
    
    $.getJSON("/plm/details", { wsId : wsId, dmsId: dmsId}, function(details) {

        for(section of details.sections) {
            for(field of section.fields) {
                let urn = field.urn.split(".");
                if(urn[urn.length -1] === 'DESCRIPTION') {
                    $("#description").html(decodeHtml(field.value));
                    break;
                }
            }
        }

        $("#descriptor").html(details.title);
        $("#processing").hide();

    });    
}
function decodeHtml(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}


// Get managed items of Change Order
function getManagedItems() {
    
    $.getJSON("/plm/manages", function(data) {

        $("#nav-counter").html(data.affectedItems.length);
        $("#nav-list").html("");
        
        for(var i = 0; i < data.affectedItems.length; i++) {
            
            var affectedItem    = data.affectedItems[i];
            var itemData        = affectedItem.item.link.split("/");
            var transition      = (affectedItem.hasOwnProperty("targetTransition")) ? affectedItem.targetTransition.title : " - not defined -";
            let revision        = "";
            let fromRelease     = (affectedItem.hasOwnProperty("fromRelease")) ? affectedItem.fromRelease : "";
            let toRelease       = (affectedItem.hasOwnProperty("toRelease")) ? affectedItem.toRelease : "";
            
            if(fromRelease !== "") {
                revision = "from Rev " + fromRelease + " to Rev " + toRelease;    
            } else if(toRelease !== "") {
                revision = "Release as Rev " + toRelease;           
            } else {
                revision = " - not defined -"          
            }

            managedItems.push(affectedItem.item.urn);

            var elem = $("<div></div>");
                elem.addClass("nav-item");
                elem.addClass("unread");
                elem.attr("data-wsid", itemData[4]);
                elem.attr("data-dmsid", itemData[6]);
                elem.attr("data-link", affectedItem.item.link);
                elem.append("<div class='nav-item-header'>" + affectedItem.item.title + "</div>");
            
            if(affectedItem.hasOwnProperty("transitions")) {
                elem.append("<div class='nav-item-detail'>Revision: " + revision + "</div>");
                elem.append("<div class='nav-item-detail'>Transition: " + transition + "</div>");                
            }
                
            elem.appendTo("#nav-list").fadeIn();
            
        }
        
        $(".nav-item").click(function() {
            
            $(this).addClass("selected");
            $(this).siblings().removeClass("selected");
            $(this).removeClass("unread");

            reset();
            
            let wsId  = $(this).attr("data-wsid");
            let dmsId = $(this).attr("data-dmsid");
            
            let params = {
                'wsId'  : $(this).attr("data-wsid"),
                'dmsId' : $(this).attr("data-dmsid")
            }
            
            
            
            getViewables(params);
            getBOM(params);
            getItemDetails(params);
            
            
            getChangeLog(params);
            getRootParents(params);
            getAttachments(params);
            getChangeProcesses(params);
            
        });
        
        $(".nav-item").first().click();
        
    });  
    
}


// Get viewables of selected Vault Item to init viewer
function getViewables(params) {

    // if(vaultItem === null) return;
    // if(vaultItem === '') return;

    // let link = vaultItem.link.split('/');

    // let params = {
    //     wsId    : link[4],
    //     dmsId   : link[6]
    // }

    $.get( '/plm/viewables', params, function(viewables) {

        if(viewables.length > 0) {



            for(viewable of viewables) {

                console.log(viewable);

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


// Display Change Log
function getChangeLog(params) {
    
    $.getJSON("/plm/logs", params, function(logs) {
        
        let counter     = 0;
        let elemTable   = $("#logs-table");
        
        console.log(logs);

        for(log of logs.items) {
            
            counter++;


            let elemDesc = $("<td>" + log.description + "</td>");

            if(log.description === null) {

                elemDesc = $("<td></td>");

                if(log.details.length > 0) {

                    let elemChanges = $("<table></table>");
                    let elemChange = $("<tr></tr>");
                        elemChange.appendTo(elemChanges);
                        elemChange.append('<td>' + log.details[0].fieldName + ' changed from<td>');
                        elemChange.append('<td> ' + log.details[0].oldValue + '<td>');
                        // elemChange.append('<td><i class="zmdi zmdi-arrow-right"></i\><td>');
                        elemChange.append('<td>to<td>');
                        elemChange.append('<td> ' + log.details[0].newValue + '<td>');

                    elemDesc.append(elemChanges);
                    
                }

            }


            let timeStamp = new Date(log.timeStamp);
                
            var elemRow = $("<tr></tr>");
                elemRow.append("<td>" + timeStamp.toDateString() + "</td>");
                elemRow.append("<td>" + log.user.title + "</td>");
                elemRow.append("<td>" + log.action.shortName + "</td>");
                elemRow.append(elemDesc);
                elemRow.appendTo(elemTable);

            // let description = log.description;

            // if(log.description === null) {

            //     if(log.details.length > 0) {

            //         let elemChange = $("<table></table>");
            //         let elemRow = $("<tr></tr>");
            //             elemRow.appendto(elemChange);
            //             elemRow.append('<td>Changed field ' + log.details[0].fieldName + '<td>');
            //             elemRow.append('<td> ' + log.details[0].oldValue + '<td>');
            //             elemRow.append('<td><i class="zmdi zmdi-arrow-right"></i><td>');
            //             elemRow.append('<td> ' + log.details[0].newValue + '<td>');

            //         elemRow.append("<td></td>");

            //     } else {
            //         elemRow.append("<td></td>");
            //     }

            // } else {
            //     elemRow.append("<td>" + log.description + "</td>");
            // }



                
        }
        
        if(counter > 0) elemTable.prepend("<tr><th>Date</th><th>User</th><th>Action</th><th>Description</th></tr>");
        elemTable.siblings().hide();
        elemTable.show();
        
        $("#logs-counter").html(counter);
        
    });
    
}


// Get details of selected item
function getItemDetails(params) {
    
    $.getJSON("/plm/details", params, function(data) {
        
//        console.log(data);
        
        let elemList = $("#details-list");
        
        elemList.children().hide();
        
        for(section of data.sections) {
        
            var elemSection = $("<div></div>");
                elemSection.addClass("section");
                elemSection.appendTo(elemList);
            
            var elemSectionTitle = $("<div></div>");
                elemSectionTitle.addClass("section-title");
                elemSectionTitle.html(section.title);
                elemSectionTitle.appendTo(elemSection);
            
            var elemSectionContent = $("<div></div>");
                elemSectionContent.addClass("section-content");
                elemSectionContent.appendTo(elemSection);
        
            for(field of section.fields) {
            
                var elemField = $("<div></div>");
                var elemLabel = $("<div></div>");
                var elemValue = $("<div></div>");

                elemField.addClass("field");
                elemLabel.addClass("field-label");
                elemValue.addClass("field-value");
                
                let fieldValue  = field.value;
                
                if(field.urn.indexOf("1.ARTICLE_NUMBER") > 0) getStockInformation(field.Value);

                if(fieldValue === null) {
                    elemValue.html("");
                } else if(typeof fieldValue === "object" ) {
                    if(Array.isArray(fieldValue)) {
                        for(value of field.value) {
                            elemValue.append(getFieldItemLink(value));
                        }       
                    } else {
                         elemValue.append(getFieldItemLink(field.value));
                    }
                } else {
                    elemValue.html(field.value);
                }
                
                elemLabel.html(field.title);

                elemField.append(elemLabel).append(elemValue);
                elemField.appendTo(elemSectionContent);

            
            }
        }
        
        //$(".section").first().show();
        
    });
    
}


// Get Bill of Materials
function getBOM(params) {

    $.get( '/plm/bomviews', params, function(views) {

        let link = views.bomViews[0].link;
        let view = link.split("/");

        // params.depth        = 1;
        params.revisionBias = 'release';
        params.viewDefId    = view[view.length - 1];

        //$.get( '/plm/bom', params, function(bom) {
        $.get( '/plm/bom-items', params, function(bom) {

            let counter     = 0;
            let elemTable   = $("#bom-table");
            
console.log(bom);

            for(item of bom.flatItems) {
                
                counter++;
                    
                var elemRow = $("<tr></tr>");
                    elemRow.append(getItemLink(item.item.title, item.item.urn));
                    // elemRow.append("<td>" + node.item.title + "</td>");
                    // elemRow.append("<td>" + log.user.title + "</td>");
                    // elemRow.append("<td>" + log.description + "</td>");
                    elemRow.appendTo(elemTable);
                    
            }
            
            elemTable.prepend("<tr><th>Item</th></tr>");
            // elemTable.siblings().hide();
            // elemTable.show();
            
            setCounter("bom", counter);

        });

    });

}


// Get Root Parents
function getRootParents(params) {
    
    params.depth = 20;

    $.getJSON("/plm/whereused", params, function(whereused) {
        
        let counter     = 0;
        let elemTable   = $("#roots-table");

        if(whereused !== '') {

            for(edge of whereused.edges) {
                
                if(!edge.hasOwnProperty("edgeLink")) {

                    for(node of whereused.nodes) {

                        if(edge.child === node.item.urn) {

                            counter++;

                            let lifecycle = '';
                            let quantity  = '';

                            for(field of node.fields) {
                                if(field.title === 'QUANTITY') quantity = field.value;
                                else if(field.title === 'LIFECYCLE') lifecycle = field.value;
                            }

                            let elemChildren = $('<td></td>');
                            
                            getChilrden(elemChildren, whereused.edges, whereused.nodes, node.item.urn, 1);

                            let elemRow = $("<tr></tr>");
                                elemRow.append(getItemLink(node.item.title, node.item.urn));
                                elemRow.append("<td>" + lifecycle + "</td>");
                                elemRow.append("<td>" + quantity + "</td>");
                                elemRow.append(elemChildren);
                                elemRow.appendTo(elemTable);

                        }

                    }
                }
            }
        }

        if(counter > 0) elemTable.prepend("<tr><th>Item</th><th>Status</th><th>Quantity</th><th>Hiearchy</th></tr>");
        
        setCounter('roots', counter);

    });
    
}
function getChilrden(elemChildren, edges, nodes, parent, level) {

    for(edge of edges) {

        if(parent === edge.child) {

            let result = $('<div></div>');

            if(managedItems.indexOf(parent) < 0) result.append('<i class="zmdi zmdi-minus-circle"></i>');
            else result.append('<i class="zmdi zmdi-check-circle"></i>');

            for(let i = level - 1; i > 0; i--) { result.append('<i class="zmdi zmdi-long-arrow-right"></i>'); }

            for(node of nodes) {
                if(parent === node.item.urn) {
                    result.append(getItemLink(node.item.title, node.item.urn, 'span'));
                }
            }

            elemChildren.append(result);
            getChilrden(elemChildren, edges, nodes, edge.parent, level+1);

        }

    }

}


// Get item attachments
function getAttachments(params) {
    
    $.getJSON("/plm/attachments", params, function(attachments) {
        
        let counter     = 0;
        let elemTable   = $("#attachments-table");

        for(attachment of attachments) {
            
            counter++;

            let timeStamp = new Date(attachment.created.timeStamp);
                
            let elemRow = $("<tr></tr>");
                elemRow.append("<td>" + getFileIcon(attachment) + "</td>");                
                elemRow.append("<td><a target='_blank' href='" + attachment.url + "' >" + attachment.name + "</a></td>");
                elemRow.append("<td>" + attachment.resourceName + "</td>");
                elemRow.append("<td>" + attachment.version + "</td>");
                elemRow.append("<td>" + timeStamp.toLocaleString() + "</td>");
                elemRow.append("<td>" + attachment.created.user.title + "</td>");
                elemRow.append("<td>" + attachment.description + "</td>");
                elemRow.append("<td>" + attachment.type.fileType + "</td>");
                elemRow.appendTo(elemTable);
                
        }
        
        if(counter > 0) elemTable.prepend("<tr><th></th><th>File Name</th><th>Title</th><th>Version</th><th>Date</th><th>User</th><th>Description</th><th>Type</th></tr>");
        
        setCounter('attachments', counter);
        
    });
    
}


// Get related Change Requests
function getChangeProcesses(params) {

    $.getJSON("/plm/changes", params, function(processes) {
        
        let counter = 0;
        let elemTable = $("#changes-table");
        
        for(process of processes) {
         
            let dateCreate = new Date(process['first-workflow-history'].created);
            let dateUpdate = new Date(process['last-workflow-history'].created);
            
            counter++;
                
            let elemRow = $("<tr></tr>");
                elemRow.append(getItemLink(process.item.title, process.item.urn));
                elemRow.append("<td>" + process['workflow-state'].title + "</td>");
                elemRow.append("<td>" + dateCreate.toLocaleString() + "</td>");
                elemRow.append("<td>" + process['last-workflow-history'].user.title + "</td>");
                elemRow.append("<td>" + dateUpdate.toLocaleString() + "</td>");
                elemRow.append("<td>" + process['first-workflow-history'].user.title + "</td>");
                elemRow.appendTo(elemTable);
                
        }
        
        if(counter > 0) elemTable.prepend("<tr><th>Name</th><th>Status</th><th>Last Action Date</th><th>By User</th><th>Creation Date</th><th>Created By</th></tr>");
        
        setCounter('changes', counter);
        
    });
    
}