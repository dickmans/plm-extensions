let dataEBOM    = {};
let dataMBOM    = {};
let edgesEBOM   = [];
let edgesMBOM   = [];
let colsEBOM    = [];
let colsMBOM    = [];

let descriptor;
let wsIdEBOM, wsIdMBOM, dmsIdEBOM, dmsIdMBOM;
let itemDropped, itemDragged;


$(document).ready(function() {
    
    getDetails();
        
    $("#dialog-cancel").click(function() {
        hideDialog();
    });
    $("#submit").click(function() {
        moveDraggedItem();
        hideDialog();
    });
    
    $("#add-all").click(function() {
//        alert("los");
        console.log("#add-all : " + $(".item-action-add:visible").length);
//        alert($(".item-action-add:visible").length);
        $(".item-action-add:visible").click();
    });
    $("#cancel").click(function() {
        window.close();
    });    
    $("#save").click(function() {
        console.log(" START SAVE");
        showProcessing();
        createNewItem();
    });
    
    $(".dialog-toggle").click(function() {
        $(this).addClass("selected");
        $(this).siblings().removeClass("selected"); 
    });
    
    $(".bar").click(function() {
        setStatusBarFilter($(this));
    })
    
    $("#mbom-add-name").keypress(function (e) {
        insertNewOperation(e);
    });
    $("#mbom-add-code").keypress(function (e) {
        insertNewOperation(e);
    });
    
    $("#split-qty").click(function() {
        $(this).select();
    });
    
});


// Get product details & BOM data
function getDetails() {
    
    $.get('/plm/details', { 'wsId' : wsId, 'dmsId' : dmsId }, function(data) {
    
        descriptor = data.root.title;
        
        $("#descriptor").html(descriptor);

        for(section of data.sections) {
            
            for(field of section.fields) {
                
                let fieldURN    = field.urn;
                let fieldSplit  = fieldURN.split(".");
                let fieldID     = fieldSplit[fieldSplit.length - 1];
                
                 if(fieldID === "EBOM") {
                     let paramsEBOM = field.value.link.split("/");
                     wsIdEBOM       = paramsEBOM[4];
                     dmsIdEBOM      = paramsEBOM[6];
                 } else if(fieldID === "MBOM") {
                     if(field.value !== null) {
                        let paramsMBOM  = field.value.link.split("/");
                        wsIdMBOM        = paramsMBOM[4];
                        dmsIdMBOM       = paramsMBOM[6];
                     }
                 }
                
            }
        }
        
        if(typeof dmsIdEBOM === "undefined") dmsIdEBOM = dmsId;
        if(typeof  wsIdEBOM === "undefined")  wsIdEBOM = wsId;
        
        createMBOMRoot(descriptor, function() {
            
            getBOMView(wsId, viewIDEBOM, function(dataEBOMView) {

                getBOMView(wsIdMBOM, viewIDMBOM, function(dataMBOMView) {

                    getBOM(wsIdEBOM, dmsIdEBOM, viewIDEBOM, function(ebom) {

                        dataEBOM = ebom;
                        edgesEBOM = dataEBOM.edges;
                        edgesEBOM.sort(function(a, b){return a.itemNumber - b.itemNumber});

                        getBOM(wsIdMBOM, dmsIdMBOM, viewIDMBOM, function(mbom) {

                            dataMBOM = mbom;
                            edgesMBOM = dataMBOM.edges;
                            edgesMBOM.sort(function(a, b){return a.itemNumber - b.itemNumber});

                            for(field of dataEBOMView) { colsEBOM.push({ fieldId : field.fieldId, viewDefFieldId : field.viewDefFieldId.toString() }); }
                            for(field of dataMBOMView) { colsMBOM.push({ fieldId : field.fieldId, viewDefFieldId : field.viewDefFieldId.toString() }); }

                            initEditor();

                        });
                    });

                });
            });
            
        });
        
    });
    
}
function createMBOMRoot(descriptor, callback) {
    
//    console.log(" createMBOMRoot : START");
//    console.log(" createMBOMRoot : dmsIdMBOM = " + dmsIdMBOM);
//    console.log(" createMBOMRoot : wsIdMBOM  = " + wsIdMBOM);
    
    if(typeof dmsIdMBOM !== "undefined") {
        
        callback();
        
    } else {
    
        $.get('/fields/' + wsIdRoot, {}, function(data) {
        
            for(field of data.fields) {

                let urn     = field.urn.split(".");
                let fieldID = urn[urn.length - 1];

                if(fieldID === "MBOM") {
                    let fieldDef = field.picklistFieldDefinition.split("/");
                    wsIdMBOM = fieldDef[4];
                }

            }
        
            if(typeof wsIdMBOM !== "undefined") {
            
                var params = {
                    title       : descriptor,
                    wsIdEBOM    : wsIdEBOM,
                    dmsIdEBOM   : dmsIdEBOM,
                    number      : "",
                    isBOM       : "true"
                }
            
                $.post('/create/' + wsIdMBOM, params, function(data) {
                    let urnNew = data.urn.split(".");
                    dmsIdMBOM = urnNew[urnNew.length - 1];
                    callback();
                }); 
            
            }
        });   
    }
    
}
function getBOMView(wsId, viewId, callback) {
    
   console.log(" getBOMView START");
   console.log(" getBOMView wsId   = " + wsId);
   console.log(" getBOMView viewId = " + viewId);
    
    //$.get('/viewdef/' + wsId + "/" + viewId, {}, function(data) {
    $.get('/plm/bomview', { 'wsId' : wsId, 'viewId' : viewId }, function(data) {
        callback(data);
    });    
    
}
function getBOM(wsId, dmsId, viewId, callback) {

//    console.log(" getBOM START");
//    console.log(" getBOM wsId   = " + wsId);
//    console.log(" getBOM dmsId  = " + dmsId);
//    console.log(" getBOM viewId = " + viewId);
    
    $.get('/bom/' + wsId + "/" + dmsId + "/" + viewId, {}, function(data) {
        callback(data);
    });    
    
}
function initEditor() {
    
    setEBOM($("#ebom"), dataEBOM.root, 1, null);
    setMBOM($("#mbom"), dataMBOM.root, "", 1, null);
    
    
    // Insert manual record
//    $("input").keypress(function (e) {
//        if (e.which == 13) {
//            insertNewItem($(this));
//        }
//    });

    
    // update Status Bar
    setStatusBar();
    
    
    $("#loading").hide();
    $("#ebom").show();
    $("#ebom-title").show();
    $("#spacer").show();
    $("#mbom").show();
    $("#mbom-add").show();
    $("#mbom-title").show();
    $(".bar").show();
    
}
function setStatusBar() {
    
    let countAdditional = 0;
    let countDifferent  = 0;
    let countMatch      = 0;
    
    let listEBOM = [];
    let listMBOM = [];
    let qtysEBOM = [];
    let qtysMBOM = [];
    
    $("#ebom").find(".item").each(function() {
        if(!$(this).hasClass("root")) {
            let urn = $(this).attr("data-urn");
            $(this).removeClass("additional");
            $(this).removeClass("different");
            $(this).removeClass("match");
            $(this).removeClass("neutral");
            if(listEBOM.indexOf(urn) === -1) {
                listEBOM.push(urn);
                qtysEBOM.push($(this).attr("data-qty"));
            }
        }
    });
    $("#mbom").find(".item").each(function() {
        if(!$(this).hasClass("root")) {
            if(!$(this).hasClass("operation")) {
                if(!$(this).hasClass("mbom-itm")) {
                    let urn = $(this).attr("data-urn");
                    
                         let urnEBOM = $(this).attr("data-urn-ebom");
                
                if(typeof urnEBOM !== 'undefined') urn = urnEBOM;
                    
                    
                    $(this).removeClass("additional");
                    $(this).removeClass("different");
                    $(this).removeClass("match");
                    $(this).removeClass("neutral");
                    let index = listMBOM.indexOf(urn);
                    //let qty = $(this).attr("data-qty");
                    let qty = $(this).find(".item-qty-input").val();
                    if(index === -1) {
                        listMBOM.push(urn);
                        qtysMBOM.push(qty);
                    } else {
                        qtysMBOM[index] += qty;
                    }
                }
            }
        }
    });
    
    $("#ebom").find(".item").each(function() {
//        if(!$(this).hasClass("root")) {
        if(!$(this).hasClass("item-has-bom")) {
            let urn = $(this).attr("data-urn");
            let index = listMBOM.indexOf(urn); 
            let qty = qtysEBOM[listEBOM.indexOf(urn)];
            if(listMBOM.indexOf(urn) === -1) {
                countAdditional++;
                $(this).addClass("additional");
            } else if(qtysMBOM[index] === qty) {
                $(this).addClass("match");
                countMatch++;
            } else {
                $(this).addClass("different");
                countDifferent++;
            }
            
        }
    });
    $("#mbom").find(".item").each(function() {
        if($(this).hasClass("mbom-item")) {
            $(this).addClass("unique");
        } else if(!$(this).hasClass("root")) {
            if(!$(this).hasClass("operation")) {
                let urn = $(this).attr("data-urn");
                
                let urnEBOM = $(this).attr("data-urn-ebom");
                
                if(typeof urnEBOM !== 'undefined') urn = urnEBOM;
                
                let index = listEBOM.indexOf(urn); 
                let qty = qtysMBOM[listMBOM.indexOf(urn)];
                if(index === -1) {
                    countAdditional++;
                    $(this).addClass("additional");
                } else if(qtysEBOM[index] === qty) {
                    $(this).addClass("match");
                } else {
                    $(this).addClass("different");
                }
            }
        }
    });
    
    $("#status-additional").css("flex", countAdditional + ' 1 0%');
    $("#status-different").css("flex", countDifferent + ' 1 0%');
    $("#status-match").css("flex", countMatch + ' 1 0%');
    
    if(countAdditional === 0) $("#status-additional").css("border-width", "0px");  else $("#status-additional").css("border-width", "5px");
    if(countDifferent === 0) $("#status-different").css("border-width", "0px");  else $("#status-different").css("border-width", "5px");
    if(countMatch === 0) $("#status-match").css("border-width", "0px");  else $("#status-match").css("border-width", "5px");
    
}


// Input controls to add new items to MBOM
function addInput(elemParent) {

    var elemAdd = $("<div></div>");
        elemAdd.addClass("item-add");
        elemAdd.appendTo(elemParent);
    
    var elemInputName = $("<input></input>");
        elemInputName.attr("placeholder", "Type new component name");
        elemInputName.addClass("item-input");
        elemInputName.addClass("name");
        elemInputName.appendTo(elemAdd);
    
    var elemInputQty = $("<input></input>");
        elemInputQty.attr("placeholder", "Quantity");
        elemInputQty.addClass("item-input");
        elemInputQty.addClass("quantity");
        elemInputQty.appendTo(elemAdd);

    
    listenForInput(elemInputName);
    listenForInput(elemInputQty);
    
}
function listenForInput(elemInput) {
    
    elemInput.keypress(function (e) {
        if (e.which == 13) {
            insertNewItem($(this));
        }
    });
    
}
function insertNewItem(elemInput) {
      
    
    let title = "";
    let qty = "1";
    
    if(elemInput.hasClass("quantity")) {
        qty = elemInput.val();
        title = elemInput.prev().val();
        elemInput.prev().focus();
    } else {
        qty = elemInput.next().val();
        console.log(elemInput.val());
        title = elemInput.val();
        if(qty === "") qty = "1";
    }
    
    elemInput.val("");
    elemInput.siblings().val("");
    
    let elemBOM = elemInput.parent().prev();
    
    let elemNode = $("<div></div>");
        elemNode.addClass("item");
        elemNode.addClass("leaf");
        elemNode.addClass("new");
        elemNode.addClass("unique");
        elemNode.addClass("mbom-item");
        elemNode.attr("data-urn", "");
        elemNode.appendTo(elemBOM);
        
    let elemNodeHead = $("<div></div>");
        elemNodeHead.addClass("item-head");
        elemNodeHead.appendTo(elemNode);
    
    let elemNodeToggle = $("<div></div>");
        elemNodeToggle.addClass("item-toggle");
        elemNodeToggle.appendTo(elemNodeHead);
    
    let elemNodeIcon = $("<div></div>");
        elemNodeIcon.addClass("item-icon");
        elemNodeIcon.html("<i class='zmdi zmdi-wrench''></i>");
        elemNodeIcon.appendTo(elemNodeHead);
    
    let elemNodeTitle = $("<div></div>");
        elemNodeTitle.addClass("item-title");
//        elemNodeTitle.addClass("with-number");
        elemNodeTitle.html(title);
        elemNodeTitle.attr("data-urn", "");
        elemNodeTitle.appendTo(elemNodeHead);
    
    let elemNodeQty = $("<div></div>");
        elemNodeQty.addClass("item-qty");
        elemNodeQty.appendTo(elemNodeHead);
//        elemNodeQty.html(qty);

    let elemQtyInput = $("<input></input>");
        elemQtyInput.attr("type", "number");
        elemQtyInput.addClass("item-qty-input");
        elemQtyInput.val(qty);
        elemQtyInput.appendTo(elemNodeQty);
    
    
    let elemNodeCode = $("<div></div>");
        elemNodeCode.addClass("item-code");
//        elemNodeCode.html(code);
        elemNodeCode.appendTo(elemNodeHead);
    
    let elemNodeStatus = $("<div></div>");
        elemNodeStatus.addClass("item-status");
        elemNodeStatus.appendTo(elemNodeHead);
    
    
    let elemNodeActions = $("<div></div>");
        elemNodeActions.addClass("item-actions");
        elemNodeActions.appendTo(elemNodeHead);
    
        
//    let elemNodeNumber = $("<input></input>");
//        elemNodeNumber.addClass("number");
//        elemNodeNumber.appendTo(elemNodeHead);
    
//    let elemNodeAction = $("<div></div>");
//        elemNodeAction.addClass("item-action");
//        elemNodeAction.addClass("delete");
//        elemNodeAction.html("-");
//        elemNodeAction.appendTo(elemNodeHead);
//        elemNodeAction.click(function() {
//            $(this).closest(".item").remove();
//            setInsertActions();
//        });
    
    
    elemNodeHead.attr("data-qty", qty);
    elemNodeTitle.attr("data-qty", qty);
    elemNode.attr("data-qty", qty);
    
    
    let elemAction = addAction("Remove", elemNodeActions);
        elemAction.click(function() {
            $(this).closest(".item").remove();
//            setStatusBar();
        });
    
    setDraggable(elemNode);
    
    
//    elemInput.val("");    
        
}
function insertNewOperation(e) {
    
    if (e.which == 13) {
        
        
        if(($("#mbom-add-name").val() === "") || ($("#mbom-add-code").val() === "")) {
            alert("You have to provide both a title and a code for the new operation");
            return;
        }
        
        let elemNew = getBOMNode(2, "", $("#mbom-add-name").val(), "", $("#mbom-add-code").val(), "", "", "mbom", false);
            elemNew.attr("data-parent", "");
            elemNew.addClass("new");
            elemNew.addClass("operation");
            elemNew.addClass("neutral");
            elemNew.find(".item-icon").children().addClass("zmdi-time");
        
        let elemBOM = $("#mbom").children().first().children(".item-bom").first();
            elemBOM.append(elemNew);
        
        $("#mbom-add-name").val("");
        $("#mbom-add-code").val("");
        $("#mbom-add-name").focus();
        
    }
    
}


// Display EBOM information
function setEBOM(elemParent, urn, level, qty) {
    
    let descriptor  = getDescriptor(dataEBOM, urn);
    let category    = getNodeProperty(dataEBOM, urn, colsEBOM, "CATEGORY", "");
    let code        = getNodeProperty(dataEBOM, urn, colsEBOM, "OPERATION_CODE", "");
    let icon        = getWorkspaceIcon(urn, level);
    let endItem     = getNodeProperty(dataEBOM, urn, colsEBOM, "END_ITEM", "");
    let ignoreMBOM  = getNodeProperty(dataEBOM, urn, colsEBOM, "IGNORE_IN_MBOM", "");
    let hasMBOM     = getNodeURN(dataEBOM, urn, colsEBOM, "MBOM", "");
    let isLeaf      = isEBOMLeaf(level, urn, hasMBOM, endItem);
    
    if(ignoreMBOM !== "true") {
    
        let elemNode = getBOMNode(level, urn, descriptor, category, code, icon, qty, "ebom", isLeaf);
            elemNode.appendTo(elemParent);
            
        if(hasMBOM !== "") elemNode.attr("data-urn-mbom", hasMBOM);

        if(level === 1) elemNode.addClass("root");
        else elemNode.addClass("leaf");
        
   }
    
}
function isEBOMLeaf(level, urn, hasMBOM, endItem) {
    
    if(level === 1) return false;
    if(hasMBOM !== "") return true;
    if(endItem === "true") return true;
    
    for(edgeEBOM of edgesEBOM) {
        if(edgeEBOM.parent === urn) {
            if(getNodeProperty(dataEBOM, edgeEBOM.child, colsEBOM, "IGNORE_IN_MBOM", "") !== true) {
                return  false;   
            }
        }
    }
        
    return true;
    
}
function getBOMNode(level, urn, descriptor, category, code, icon, qty, bomType, isLeaf) {
    
    let elemNode = $("<div></div>");
        elemNode.addClass("item");
        elemNode.attr("category", category);
        elemNode.attr("data-code", code);
        elemNode.attr("data-urn", urn);
    
    let elemNodeHead = $("<div></div>");
        elemNodeHead.addClass("item-head");
        elemNodeHead.appendTo(elemNode);
    
    let elemNodeToggle = $("<div></div>");
        elemNodeToggle.addClass("item-toggle");
        elemNodeToggle.appendTo(elemNodeHead);
    
    let elemNodeIcon = $("<div></div>");
        elemNodeIcon.addClass("item-icon");
        elemNodeIcon.html("<i class='zmdi " + icon + "'></i>");
        elemNodeIcon.appendTo(elemNodeHead);
    
    let elemNodeTitle = $("<div></div>");
        elemNodeTitle.addClass("item-title");
        elemNodeTitle.appendTo(elemNodeHead);
    
    let elemNodeDescriptor = $("<span></span>");
        elemNodeDescriptor.addClass("item-descriptor");
        elemNodeDescriptor.html(descriptor);
        elemNodeDescriptor.appendTo(elemNodeTitle);
    
    let elemNodeLink = $("<i class='zmdi zmdi-open-in-new'></i>");
        elemNodeLink.addClass("item-link");
        elemNodeLink.appendTo(elemNodeTitle);
        elemNodeLink.click(function(event) {

            event.stopPropagation();
            event.preventDefault();
            
            let elemItem = $(this).closest(".item");
            let urn      = elemItem.attr("data-urn");
            
            if(urn === "") {

                alert("Item does not exist yet. Save your changes to the database first.");
                
            } else {
            
                let data     = urn.split(":")[3].split(".");

                let url  = 'https://' + data[0] + '.autodeskplm360.net';
                    url += '/plm/workspaces/' + data[1];
                    url += '/items/itemDetails?view=full&tab=details&mode=view&itemId=urn%60adsk,plm%60tenant,workspace,item%60';
                    url += data[0] + "," + data[1] + "," + data[2];

                window.open(url, '_blank');
                
            }
            
        });
    
    let elemNodeQty = $("<div></div>");
        elemNodeQty.addClass("item-qty");
        elemNodeQty.appendTo(elemNodeHead);
    
    let elemQtyInput = $("<input></input>");
        elemQtyInput.attr("type", "number");
        elemQtyInput.addClass("item-qty-input");
        elemQtyInput.appendTo(elemNodeQty);
    
    let elemNodeCode = $("<div></div>");
        elemNodeCode.addClass("item-code");
        elemNodeCode.html(code);
        elemNodeCode.appendTo(elemNodeHead);
    
    let elemNodeStatus = $("<div></div>");
        elemNodeStatus.addClass("item-status");
        elemNodeStatus.appendTo(elemNodeHead);
    
    let elemNodeActions = $("<div></div>");
        elemNodeActions.addClass("item-actions");
        elemNodeActions.appendTo(elemNodeHead);
    
    if(qty !== null) {
        elemQtyInput.val(qty);
        elemNodeHead.attr("data-qty", qty);
        elemNodeTitle.attr("data-qty", qty);
        elemNode.attr("data-qty", qty);
    };
    
    if(category !== "") elemNode.addClass("category-" + category);
    
    if(bomType === "ebom") {
    
//        setClickable(elemNodeTitle);
        
        elemQtyInput.attr('disabled', 'disabled');
        
//        if(level === 2) {
//        
//            let elemActionAdd = addAction("Add", elemNodeActions);
//                elemActionAdd.addClass("item-action-add");
//                elemActionAdd.click(function() {
//                    insertFromEBOMToMBOM($(this));
//                });
//
//            let elemActionUpdate = addAction("Update", elemNodeActions);
//                elemActionUpdate.addClass("item-action-update");
//                elemActionUpdate.click(function() {
//                    updateFromEBOMToMBOM($(this));
//                });
//            
//        }
        
        if(!isLeaf) {
            
            
            elemNode.addClass("item-has-bom");
        
            let elemNodeBOM = $("<div></div>");
                elemNodeBOM.addClass("item-bom");
                elemNodeBOM.appendTo(elemNode);
    
            for(edgeEBOM of edgesEBOM) {
                if(edgeEBOM.depth === level) {
                    if(edgeEBOM.parent === urn) { 
                        let childQty = Number(getEdgeProperty(edgeEBOM, colsEBOM, "QUANTITY", "0.0"));

    //                    childQty = precisionRound(childQty, -1);

                        setEBOM(elemNodeBOM, edgeEBOM.child, level + 1, childQty);
                    }
                }
            }
        
//        if(level > 1) addBOMToggle(elemNodeHead);
        
//            let elemNodeToggle = elemNode.find(".item-toggle");
        
            if(level > 1) addBOMToggle(elemNodeToggle);
            
            
        } else {
            
            setClickable(elemNodeTitle);
            
            let elemActionAdd = addAction("Add", elemNodeActions);
                elemActionAdd.addClass("item-action-add");
                elemActionAdd.click(function() {
                    insertFromEBOMToMBOM($(this));
                });

            let elemActionUpdate = addAction("Update", elemNodeActions);
                elemActionUpdate.addClass("item-action-update");
                elemActionUpdate.click(function() {
                    updateFromEBOMToMBOM($(this));
                });
            
        }
        
    } else {
        
        elemQtyInput.keypress(function (e) {
            if (e.which == 13) {
                setStatusBar();
            }
        });
        
        
        let elemAction = addAction("Remove", elemNodeActions);
            elemAction.click(function() {
                $(this).closest(".item").remove();
                setStatusBar();
            });
        
        
        if(isLeaf) {
        

            
            $("#ebom").find(".item").each(function() {
            
                var urnEBOM = $(this).attr("data-urn");
                var catEBOM = $(this).attr("category");
                if(urnEBOM === urn) {
                    if(typeof urnEBOM !== "undefined") {
                        elemNode.addClass(catEBOM);
                    }
                }
            
            });
            
            setDraggable(elemNode);        
        
        } else {
            
            let elemNodeBOM = $("<div></div>");
                elemNodeBOM.addClass("item-bom");
                elemNodeBOM.appendTo(elemNode);

            if(level === 2)  {
                elemNode.addClass("column");
                setDroppable(elemNode);
//                addInput(elemNode);
            }
            
            addInput(elemNode);

            if(level > 1) addBOMToggle(elemNodeToggle);
            
        }
    }
    
    return elemNode;
    
}
function getEdgeProperty(edge, cols, fieldId, defValue) {
    
    let id = getViewFieldId(cols, fieldId);
    
    for(field of edge.fields) {
        
        let fieldArray  = field.metaData.urn.split(".");
        let fieldIdent  = fieldArray[fieldArray.length - 1];
        
        if(fieldIdent === id) return field.value;
    }
    
    return defValue;
    
}
function getNodeProperty(list, urn, cols, fieldId, defValue) {

    let id = getViewFieldId(cols, fieldId);
  
    if(id === "") return defValue;
    
    for(node of list.nodes) {
        
        if(node.item.urn === urn) {
            
            for(field of node.fields) {
                
                let fieldArray  = field.metaData.urn.split(".");
                let fieldID     = fieldArray[fieldArray.length - 1];
                
                
                if(id === fieldID) {
                    if(typeof field.value === "object") {
                        return field.value.title;
                    } else {
                        return field.value;    
                    }
                }
                
            }
            
            return defValue;
            
        }
        
    }
    
    return defValue;
    
}
function getNodeURN(list, urn, cols, fieldId, defValue) {

    let id = getViewFieldId(cols, fieldId);
  
    if(id === "") return defValue;
    
    for(node of list.nodes) {
        
        if(node.item.urn === urn) {
            
            for(field of node.fields) {
                
                let fieldArray  = field.metaData.urn.split(".");
                let fieldID     = fieldArray[fieldArray.length - 1];
                
                
                if(id === fieldID) {
                    if(typeof field.value === "object") {
                        return field.value.urn;
                    } else {
                        return field.value;    
                    }
                }
                
            }
            
            return defValue;
            
        }
        
    }
    
    return defValue;
    
}
function getViewFieldId(cols, fieldId) {
    
    for(col of cols) {
        if(col.fieldId === fieldId) return col.viewDefFieldId;
    }
    
    return "";
    
}
function insertFromEBOMToMBOM(elemAction) {
    
//    console.log(" insertFromEBOMToMBOM START");
    
    let elemItem    = elemAction.closest(".item");
    let code        = elemItem.attr("data-code");
    let category    = elemItem.attr("category");
    let elemTarget  = $("#mbom").find(".root");
    
    if($(".operation").length > 0) {
        
        let operationMatch = false;
        
        $(".operation").each(function() {
            if(!operationMatch) {
                let operationCode = $(this).attr("data-code");
                if(operationCode === code) {
                    operationMatch = true;
                    elemTarget = $(this); 
                }
            };
        });
        
    }
    
//    $("#mbom").find(".operation").each(function() {
//        let operationCode = $(this).attr("data-code");
//        if(operationCode === code) elemTarget = $(this); 
//    });
//    }

//    if((elemTarget === null) || (elemTarget.length === 0)) {
//        if(category !== "") {
//            if(elemTarget === null) {
//                elemTarget = $("#mbom").find(".operation." + category);
//            }
//        }
//    }

//    if((elemTarget === null) || (elemTarget.length === 0)) {   
//        elemTarget = $("#mbom").find(".operation").first();
//    }
    
    if(elemTarget !== null) {   
        
//        console.log("insertFromEBOMToMBOM elemTarget : " + elemTarget);

        let clone = elemItem.clone(true, true);
            clone.find(".item-action").remove();
            clone.appendTo(elemTarget.find(".item-bom").first());
        
        let elemQtyInput = clone.find(".item-qty-input");
            elemQtyInput.removeAttr("disabled");
            elemQtyInput.keypress(function (e) {
                if (e.which == 13) {
                    setStatusBar();
                }
            });
        
        let elemAction = addAction("Remove", clone.find(".item-actions"));
            elemAction.click(function() {
                $(this).closest(".item").remove();
                setStatusBar();
            });
        
        setDraggable(clone);
    }
    
    setStatusBar();

}
function updateFromEBOMToMBOM(elemAction) {
    
    let elemItem    = elemAction.closest(".item");
    let urn         = elemItem.attr("data-urn");
    let qty         = elemItem.attr("data-qty");
    
    let listMBOM = $("#mbom").find("[data-urn='" + urn + "']");
    
    if(listMBOM.length === 1) {
        listMBOM.attr("data-qty", qty);
        listMBOM.find(".item-qty-input").val(qty);
        setStatusBar();
    }
    
}



// Display MBOM information
function setMBOM(elemParent, urn, urnParent, level, qty) {
    
    let descriptor  = getDescriptor(dataMBOM, urn);
    let category    = getNodeProperty(dataMBOM, urn, colsMBOM, "TYPE", "");
    let code        = getNodeProperty(dataMBOM, urn, colsMBOM, "OPERATION_CODE", "");
    let isOperation = getNodeProperty(dataMBOM, urn, colsMBOM, "IS_OPERATION", "");
    let hasEBOM     = getNodeURN(dataMBOM, urn, colsMBOM, "EBOM", "");
    let wsId        = getWorkspaceId(urn);
    let icon        = getWorkspaceIcon(urn, level);
    let isLeaf      = isMBOMLeaf(urn, wsId, level, code);
    let edge        = getEdge(urn, urnParent);
    let edges       = [];

    console.log(" > isOperation = " + isOperation);
    console.log(" > hasEBOM = " + hasEBOM);
    
    
    if(wsId === wsIdEBOM) code = getNodeProperty(dataEBOM, urn, colsEBOM, "OPERATION_CODE", "");

    
    let elemNode = getBOMNode(level, urn, descriptor, category, code, icon, qty, "mbobm", isLeaf);
//        elemNode.addClass("neutral");
        elemNode.attr("data-parent", urnParent);
        elemNode.attr("data-edge", edge);
        elemNode.attr("data-edges", "");
        elemNode.appendTo(elemParent);
    
    
    
    if(hasEBOM !== "") {
        elemNode.attr("data-urn-ebom", hasEBOM);
        elemNode.attr("data-urn-mbom", urn);
        
        $("#ebom").find(".leaf").each(function() {
            
            let urnEBOM = $(this).attr("data-urn");
            
            if(urnEBOM === hasEBOM) {
                
                let titleEBOM = $(this).find(".item-title").first().html();
                let codeEBOM = $(this).find(".item-code").first().html();
                
                elemNode.find(".zmdi").first().addClass("zmdi-settings").removeClass("zmdi-wrench");
                elemNode.find(".item-title").first().html(titleEBOM);
                elemNode.find(".item-code").first().html(codeEBOM);
                elemNode.removeClass("mbom-item");
                icon = "zmdi-settings";
                isLeaf = true;
                
            }
            
        });
        
        
    }
    
         if(level === 1) elemNode.addClass("root");
    else if(isOperation) {
        elemNode.addClass("neutral");
        elemNode.addClass("operation");
    }
//    else if(level === 2) elemNode.addClass("operation");
//                    else elemNode.addClass("leaf");

    if(icon === "zmdi-wrench") elemNode.addClass("mbom-item");
    
    if(!isLeaf) {
        
        let elemNodeBOM = elemNode.find(".item-bom").first();
        for(edgeMBOM of edgesMBOM) {
            if(edgeMBOM.depth === level) {
                if(edgeMBOM.parent === urn) {
                    edges.push(edgeMBOM.edgeId);
                    let childQty = getEdgeProperty(edgeMBOM, colsMBOM, "QUANTITY", "0.0");
                    childQty = parseInt(childQty);
                    setMBOM(elemNodeBOM, edgeMBOM.child, urn, level + 1, childQty);
                }
            }
        }
        
        
        elemNode.attr("data-edges", edges.toString());
        
    } else {
        
        elemNode.addClass("leaf");
           
    }
    
//    if(level === 1) 
    
}
function isMBOMLeaf(urn, wsId, level, code) {
    
    if(level === 1) return false;
    
//    if(level === 2) return false;
    if(level === 3) return true;
    
    if(wsId === wsIdMBOM) {
        if(code !== null) return false;
    } else {
        return true;
    }
    
    
    for(edgeMBOM of edgesMBOM) {
        if(edgeMBOM.parent === urn) return false;
    }
    
    return true;
    
}
function getWorkspaceId(urn) {
    
    let params = urn.split(".");
    
    return params[params.length - 2];
    
}
function getWorkspaceIcon(urn, level) {
    
    let temp = urn.split(".");
    let wsId = temp[temp.length - 2];
    
    if(wsId === wsIdEBOM) return "zmdi-settings";
    else if(wsId ===  wsIdMBOM) {
        if(level < 3) { return "zmdi-time"; } 
        else { return "zmdi-wrench"; }
    } else { return ""; }
    
}
function addAction(label, elemParent) {
    
    let elemAction = $("<div></div>");
        elemAction.addClass("item-action");
        elemAction.html(label);
        elemAction.appendTo(elemParent);
    
    return elemAction;

}


// Parse BOM information
function getDescriptor(data, urn) {
    
    for(node of data.nodes) {
        if(node.item.urn === urn) {
            return node.item.title;
        }
    }
    
    return "";
    
}
function getEdge(urn, urnParent) {
    
    if(urnParent === "") return "";
    
    for(edge of edgesMBOM) {
        if(edge.child === urn) {
            if(edge.parent === urnParent) {
                return edge.edgeId;
            }
        }
    }
    
    return "";
    
}


// Toggles to expand / collapse BOMs
function addBOMToggle(elemParent) {
    
    let elemNodeTogglePlus = $("<div></div>");
        elemNodeTogglePlus.css("display", "none");
        elemNodeTogglePlus.html("<i class='zmdi zmdi-chevron-right'></i>");
        elemNodeTogglePlus.appendTo(elemParent);
        elemNodeTogglePlus.click(function(event) {
            
            if(event.shiftKey) { 
                let elemRoot = $(this).closest(".root");
                elemRoot.find(".zmdi-chevron-right:visible").click();
            } else {
                $(this).closest(".item").find(".item-bom").fadeIn(); 
                $(this).closest(".item").find(".item-add").fadeIn(); 
                $(this).closest(".item").find(".item-input").fadeIn(); 
                $(this).siblings().toggle();
                $(this).toggle();
            };
            
        });
    
    let elemNodeToggleMinus = $("<div></div>");
        elemNodeToggleMinus.html("<i class='zmdi zmdi-chevron-down'></i>");
        elemNodeToggleMinus.appendTo(elemParent);
        elemNodeToggleMinus.click(function(event) {
            
            if(event.shiftKey) { 
                let elemRoot = $(this).closest(".root");
                elemRoot.find(".zmdi-chevron-down:visible").click();
            } else {
                $(this).closest(".item").find(".item-bom").fadeOut(); 
                $(this).closest(".item").find(".item-add").fadeOut(); 
                $(this).closest(".item").find(".item-input").fadeOut(); 
                $(this).siblings().toggle();
                $(this).toggle();
            }
            
        });
    
}


// Enable item filtering & preview
function setClickable(elemClicked) {
    
    elemClicked.click(function() {
        
        let elemItem = $(this).closest(".item");
        let urn      = elemItem.attr("data-urn");
        
        if(elemItem.hasClass("selected")) {
            
            $(".item").removeClass("selected");
            $(".item").show();
            $(".item-input").show();
            
        } else if(elemItem.hasClass("leaf")) {

            $(".leaf").hide();
            $(".item-input").hide();
            $(".operation").hide();
            
//            console.log(urn);
            
            $(".leaf").each(function() {
                
                console.log($(this).attr("data-urn"));
                
                if($(this).attr("data-urn") === urn) {
                    console.log(" got item to show");
                    $(this).show();
                    $(this).addClass("selected");
                    unhideParent($(this).parent());
                } else if($(this).attr("data-urn-bom") === urn) {
                    console.log(" got item to show");
                    $(this).show();
                    $(this).addClass("selected");
                    unhideParent($(this).parent());
                }else if($(this).attr("data-urn-ebom") === urn) {
                    console.log(" got item to show");
                    $(this).show();
                    $(this).addClass("selected");
                    unhideParent($(this).parent());
                }
                
            })
            
        }
        
    });
    
}
function unhideParent(elemVisible) {
    
    console.log("unhideParent START");
    
    let parent = elemVisible.closest(".item");
    
    if(parent.length > 0) {
        parent.show();
//        parent.closest(".item");
        unhideParent(parent.parent());
    }
    
}


// Drag & Drop functions
function setDraggable(elem) {
    
    elem.draggable({ 
        snap        : false,
        containment : "#mbom",
        scroll      : false,
        helper      : "clone"
    });
    
}
function setDroppable(elem) {
    
    elem.droppable({
    
        classes: {
            "ui-droppable-hover": "drop-hover"
        },
        drop: function( event, ui ) {

            itemDropped = $(this).find(".item-bom");
            itemDragged = ui.draggable;
            
            let prevBOM  = itemDragged.closest(".item-bom");
            let prevItem = prevBOM.closest(".item");
            let newItem  = itemDropped.closest(".item");
            
            if(prevItem.attr("data-urn") !== newItem.attr("data-urn")) {

                let qty = $(ui.helper).find(".item-qty-input").val();
                    qty = Number(qty);

                if(qty > 1) {

                    $("#split-qty").val(qty);
                    $("#total-qty").html(qty);
                    $("#item-to-move").html(itemDragged.find(".item-title").html());
                    showDialog();

                } else {
                    addDraggedItemToBOM();
                }
                
            }
            
        }
    });
    
}
function showDialog() {
    
    $("#overlay").show();
    $("#dialog").show();
    
}
function hideDialog() {
    
    $("#overlay").hide();
    $("#dialog").hide();
    
}
function moveDraggedItem() {
    
    if(!$("#option-all").hasClass("selected")) {
   
        let qtySplit = Number($("#split-qty").val());
        let qtyTotal = Number($("#total-qty").html());
        
        
        if(qtySplit !== qtyTotal) {
        
            let qtyNew =  qtyTotal - qtySplit
        
            itemDragged.find(".item-qty-input").val(qtyNew);
//            itemDragged.attr("data-qty", qtyNew);
        
        
            let itemClone = itemDragged.clone();
    //            itemClone.appendTo(itemDropped);
                itemClone.attr("data-qty", qtySplit);
                itemClone.find(".item-qty-input").val(qtySplit);
                itemClone.css("position", "relative").css("left", "").css("right", "").css("top", ""); 
                setDraggable(itemClone);
        
            itemDragged = itemClone;
  
        }
    }
    
    addDraggedItemToBOM();
    
}
function addDraggedItemToBOM() {
    
    if(!itemExistsInBOM()) {
        itemDragged.appendTo(itemDropped);
        itemDragged.css("position", "relative").css("left", "").css("right", "").css("top", "");       
    }
    
}
function itemExistsInBOM() {
    
    let exists = false;
    
    itemDropped.children(".item").each(function() {
        
        
        if(!exists) {
        
        if($(this).attr("data-urn") === itemDragged.attr("data-urn")) {
            
            
            console.log("existing item");
            
            let qtyNew = $(this).attr("data-qty");
            
            let qtyAdd  = itemDragged.attr("data-qty");
//            let qtyNew  = elemQty.html();
            
//            if(qtyAdd === "") qtyAdd = "0";
//            if(qtyNew === "") qtyNew = "0";
            
            qtyNew  = parseInt(qtyAdd) + parseInt(qtyNew);
            
//            elemQty.html(qtyNew);
            
            $(this).attr("data-qty", qtyNew);
            $(this).find(".item-qty").html(qtyNew);
            
            itemDragged.remove();
            exists = true;
            
            console.log("und weiter");
        } 
        } 
    });
    
    
//    console.log("new item");
    
    return exists;
    
}


// Filtering
function setStatusBarFilter(elemClicked) {
    
    $(".item.leaf").show();
    
    if(elemClicked.hasClass("selected")) {
        
        $(".bar").removeClass("selected");
        
    } else {
        
        $(".bar").removeClass("selected");
        elemClicked.addClass("selected");
        
        let selectedFilter = elemClicked.attr("data-filter");
        
        $(".item.leaf").each(function() {
            if(!$(this).hasClass("item-has-bom")) { 
                if(!$(this).hasClass(selectedFilter)) $(this).hide(); 
            }
        });
        
    }
    
}


// Apply changes to database when clicking Save
function showProcessing() {
    $("#overlay").show();
    $("#processing").show();
}
function hideProcessing() {
    $("#overlay").hide();
    $("#processing").hide();
}
function createNewItem() {
    
    console.log(" createNewItem START");
    console.log(" createNewItem .new.lenth : " + $(".new").length);
    
    if($(".new").length > 0) {
        
        var wsIdNew     = wsIdMBOM;
        var elemFirst   =  $(".new").first();
        var elemParent  = elemFirst.parent().closest(".item");
        
        var params = {
            title       : elemFirst.find(".item-descriptor").html(),
            number      : elemFirst.find(".number").val(),
            code        : elemFirst.find(".item-code").html(),
            operation   : elemFirst.hasClass("operation")
        }
                
        console.log(params);
        
        $.post('/create/' + wsIdNew, params, function(data) {
            
            let paramsParent = elemParent.attr("data-urn").split(".");
            let paramsChild = data.urn.split(".");
            
            elemFirst.attr("data-urn", data.urn);
            elemFirst.find(".item-title").attr("data-urn", data.urn);
            elemFirst.find(".item-descriptor").html(data.descriptor);
            
            let paramsAdd = {
                wsIdParent  : paramsParent[paramsParent.length - 2],
                wsIdChild   : paramsChild[paramsChild.length - 2],
                dmsIdParent : paramsParent[paramsParent.length - 1], 
                dmsIdChild  : paramsChild[paramsChild.length - 1]
            }
            
            elemFirst.removeClass("new");
            createNewItem(); 
            
        });        
        
    } else { 
        
        console.log(" createNewItem #mbom .item-bom.length : " + $("#mbom .item-bom").children().length);
        console.log(" createNewItem .operation .item-bom.length : " + $(".operation .item-bom").children().length);
        
//        $(".edge").addClass("pending");
        $("#mbom .item-bom").children().addClass("pending");
        $(".operation .item-bom").children().addClass("pending");
        $(".operation").addClass("pending");
        console.log();
        console.log(" createNewItem : START DELETE EDGES");
        deleteOperations(); 
        
    }
    
}
function deleteOperations() {
    
    console.log(" deleteOperations START");
    
    let elemParent = $("#mbom").children().first();
    let listEdges     = elemParent.attr("data-edges");
        
    console.log(listEdges);
        
    if(typeof listEdges !== "undefined") {
            
        let edges   = listEdges.split(",");
        let remove  = "";
        let index   = -1;
            
        console.log(" deleteEdges : edges = " + edges);
            
        for(edge of edges) {
                
            if(remove === "") {
                    
                index++;
                let keep = false;

                elemParent.children(".item-bom").children(".operation").each(function()  {
                   if($(this).attr("data-edge") === edge) {
                       keep = true;
                   } 
                });
                    
                
                if(!keep) remove = edge;
                    
            }
                
        }
            
        console.log(" deleteEdges : deleteOperations = " + remove);
        console.log(" deleteEdges : deleteOperations = " + index);
            
        if(remove === "") {
                
            deleteEdges();    
                
        } else {
                
            let paramsSplit = elemParent.attr("data-urn").split(".");
                
            let params = {
                wsId   : paramsSplit[paramsSplit.length - 2],
                dmsId  : paramsSplit[paramsSplit.length - 1],
                edgeId : remove
            }
                
            console.log(" deleteOperations : params = " + params);
                
            $.post("/remove", params, function(data) {
                    
                    
                console.log(" deleteOperations : /remove SUCCESS");
                    
                    //edges = edges.splice(index, 1);
                edges.splice(index, 1);
                    
                    
                console.log(" deleteOperations : new edges = " + edges);
                console.log(" deleteOperations : new edges = " + edges.toString());
                    
                elemParent.attr("data-edges", edges.toString());
                    
                    //elemColumn.removeClass("pending");
               deleteOperations();
            });
        }
            
            
            
    } else {
        deleteEdges();
    }
            
}
function deleteEdges() {
    
    console.log(" deleteEdges operations pending : " + $(".operation.pending").length);
    
    if($(".operation.pending").length > 0) {
        
        let elemOperation = $(".operation.pending").first();
        let listEdges     = elemOperation.attr("data-edges");
        
        console.log(listEdges);
        
        if(typeof listEdges !== "undefined") {
            
            let edges   = listEdges.split(",");
            let remove  = "";
            let index   = -1;
            
            console.log(" deleteEdges : edges = " + edges);
            
            for(edge of edges) {
                
                if(remove === "") {
                    
                    index++;
                
                    console.log(" deleteEdges : edge = " + edge);
                    console.log(" deleteEdges : .ite-bom .item length = " + elemOperation.children(".item-bom").children(".item").length);

                    let keep = false;

                    elemOperation.children(".item-bom").children(".item").each(function()  {
                       if($(this).attr("data-edge") === edge) {
                           keep = true;
                       } 
                    });
                    
                
                
                    if(!keep) {
                        remove = edge;
                    }
                    
                }
                
            }
            
            console.log(" deleteEdges : remove = " + remove);
            console.log(" deleteEdges : index = " + index);
            
            if(remove === "") {
                
                elemOperation.removeClass("pending");
                deleteEdges();    
                
            } else {
                
                let paramsSplit = elemOperation.attr("data-urn").split(".");
                
                let params = {
                    wsId   : paramsSplit[paramsSplit.length - 2],
                    dmsId  : paramsSplit[paramsSplit.length - 1],
                    edgeId : remove
                }
                
                console.log(" deleteEdges : params = " + params);
                
                $.post("/remove", params, function(data) {
                    
                    
                    console.log(" deleteEdges : /remove SUCCESS");
                    
                    //edges = edges.splice(index, 1);
                    edges.splice(index, 1);
                    
                    
                    console.log(" deleteEdges : new edges = " + edges);
                    console.log(" deleteEdges : new edges = " + edges.toString());
                    
                    elemOperation.attr("data-edges", edges.toString());
                    
                    //elemColumn.removeClass("pending");
                    deleteEdges();
                });
            }
            
            
            
        } else {
            elemOperation.removeClass("pending");
            deleteEdges();
        }
        
        
//        let urnParent   = elemItem.attr("data-parent");
//        let urnBOM      = elemItem.closest("item").attr("data-urn");
//        
//        console.log("urnParent = " + urnParent);
//        console.log("urnBOM    = " + urnBOM);
//        
//        let paramsChild = elemItem.attr("data-urn").split(".");
//        let paramsParent = urnBOM.split(".");
//        
//        if(urnParent !== urnBOM) {
//            
//            $.post("/add/253/" +  paramsParent[paramsParent  .length - 1] + "/" + paramsChild[paramsChild.length - 1], {}, function(data) {
//                $.post("/remove/", {}, function(data) {
//                    elemItem.removeClass("pending");
//                    syncMBOM();
//                });
//            });
//        }
    } else {
        
        console.log();
        console.log(" deleteEdges : START ADDBOMROWS");
        $(".operation").addClass("pending");
        addBOMRows();
        
    }
            
}
function addBOMRows() {
    
    console.log("addBOMRows START");
    console.log("addBOMRows $(.operation.pending).length : " + $(".operation.pending").length);
    console.log("addBOMRows $(.item.pending).length : " + $(".item.pending").length);
    
//    if($(".operation.pending").length > 0) {
//        
//        
//        
//        
//        let elemOperation    = $(".operation.pending").first();
//        
//        console.log("addBOMRows elemOperation.attr('data-urn')  : " + elemOperation.attr("data-urn")) ;
//        
//        
//        if(elemOperation.attr("data-urn") === "") {
//            addBOMRow(elemOperation);
//        } else {
//            elemOperation.removeClass("pending");
//            addBOMRows();
//        }
//        
//    } else
        
        
    if($(".item.pending").length > 0) {
        
        
        addBOMRow($(".item.pending").first())
        
      /*  let isNew       = false;
        let elemItem    = $(".item.pending").first();
        let elemParent  = elemItem.parent().closest(".item");
        let dataParent  = elemItem.attr("data-parent");
        let urnParent   = elemParent.attr("data-urn");
        let dbQty       = elemItem.attr("data-qty");
        let edQty       = elemItem.find(".item-qty-input").first().val();
        
        if(typeof dataParent === "undefined") {
            isNew = true;
        } else if(dataParent !== urnParent) {
            isNew = true;
        }
        
        
        console.log("addBOMRows isNew = " + isNew);
//         
//        
//        
//        
//        
//        
//        let urnBOM      = elemItem.closest("item").attr("data-urn");
//        
//        console.log("urnParent = " + urnParent);
//        console.log("urnBOM    = " + urnBOM);
//        
////        let itemURN = elemItem.attr("data-urn");
//      
        
//        console.log(" addBOMRows : dbQty =  " + dbQty);
//        console.log(" addBOMRows : edQty =  " + edQty);
//        console.log(" addBOMRows : isNew =  " + isNew);
//        console.log(" addBOMRows : " + elemItem.attr("data-urn"));
        
        let paramsChild  = elemItem.attr("data-urn").split(".");
        let paramsParent = elemParent.attr("data-urn").split(".");
        let urnMBOM      = elemItem.attr('data-urn-mbom');
        
        if(typeof urnMBOM !== 'undefined') paramsChild = elemItem.attr("data-urn-mbom").split(".");
        
        let paramsAdd = {
            wsIdParent  : paramsParent[paramsParent.length - 2],
            wsIdChild   : paramsChild[paramsChild.length - 2],
            dmsIdParent : paramsParent[paramsParent.length - 1], 
            dmsIdChild  : paramsChild[paramsChild.length - 1],
            qty         : edQty
        }
        
        
//        if(urnParent !== urnBOM) {
        if(isNew) {
            
            console.log(paramsAdd);
            
            $.post("/add", paramsAdd, function(edgeId) {
                console.log(" addBOMRows /add SUCCESS");
                
                
                paramsAdd.edgeId = edgeId;
                
                
                elemItem.attr("data-edge", edgeId);
                elemItem.attr("data-parent", urnParent);
                
                
                let edges = elemParent.attr("data-edges").split(",");
                edges.push(edgeId);
                
                elemParent.attr("data-edges", edges.toString());
                
                $.post("/update", paramsAdd, function() {
                    console.log(" addBOMRows /update SUCCESS");
                    elemItem.removeClass("pending");
                    addBOMRows();
                });
            });
            
        } else if(edQty !== dbQty) {
                  
            console.log("new qty");
            
            paramsAdd.edgeId = elemItem.attr("data-edge");
            
            $.post("/update", paramsAdd, function() {
                console.log(" addBOMRows /update SUCCESS");
                elemItem.removeClass("pending");
                addBOMRows();
            });
                  
        } else {
         
            elemItem.removeClass("pending");
            addBOMRows();
            
        }*/
        
    } else {
        setSyncDate();
    }
    
}
function addBOMRow(elemItem) {
    
//    console.log("addBOMRow START");
    
    let isNew        = false;
    let elemParent   = elemItem.parent().closest(".item");
    let dataParent   = elemItem.attr("data-parent");
    let urnParent    = elemParent.attr("data-urn");
    let dbQty        = elemItem.attr("data-qty");
    let edQty        = elemItem.find(".item-qty-input").first().val();
    let paramsChild  = elemItem.attr("data-urn").split(".");
    let paramsParent = elemParent.attr("data-urn").split(".");
    let urnMBOM      = elemItem.attr('data-urn-mbom');
        
    if(typeof dataParent === "undefined") {
        isNew = true;
    } else if(dataParent !== urnParent) {
        isNew = true;
    }
        
    if(typeof urnMBOM !== 'undefined') paramsChild = elemItem.attr("data-urn-mbom").split(".");

    let paramsAdd = {
        wsIdParent  : paramsParent[paramsParent.length - 2],
        wsIdChild   : paramsChild[paramsChild.length - 2],
        dmsIdParent : paramsParent[paramsParent.length - 1], 
        dmsIdChild  : paramsChild[paramsChild.length - 1],
        qty         : edQty
    }

    if(isNew) {

        console.log(paramsAdd);

        $.post("/add", paramsAdd, function(edgeId) {
            
            console.log(" addBOMRows /add SUCCESS");

            paramsAdd.edgeId = edgeId;

            elemItem.attr("data-edge", edgeId);
            elemItem.attr("data-parent", urnParent);

            console.log(elemParent);
            
            
            if(typeof elemParent.attr("data-edges") === 'undefined') {
                
                elemParent.attr("data-edges", edgeId);
                
            } else {
            
                let edges = elemParent.attr("data-edges").split(",");
                    edges.push(edgeId);

                elemParent.attr("data-edges", edges.toString());
                
            }

            $.post("/update", paramsAdd, function() {
                console.log(" addBOMRows /update SUCCESS");
                elemItem.removeClass("pending");
                addBOMRows();
            });
            
        });

    } else if(edQty !== dbQty) {

//        console.log("new qty");

        paramsAdd.edgeId = elemItem.attr("data-edge");

        $.post("/update", paramsAdd, function() {
//            console.log(" addBOMRows /update SUCCESS");
            elemItem.removeClass("pending");
            addBOMRows();
        });

    } else {
        elemItem.removeClass("pending");
        addBOMRows();
    }
        
}
function setSyncDate() {
    
    let params = {
        workspaceId  : wsIdMBOM,
        dmsId        : dmsIdMBOM
    }
    
    $.post("/finalize", params, function() {
        hideProcessing(); 
    });   
    
}