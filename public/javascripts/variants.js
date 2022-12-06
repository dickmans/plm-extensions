let variants = [];
let keysMaster = [];
let keysVariant = [];
let fieldIDsVariant = [];
let masterFields, masterSections, linkVariant, variantFields, variantSections;
let requestsCount = 5;
let wsIdVariants = 302;
let urnPartNumber = '';

$(document).ready(function() {
    
    getDetails();
    // getBOMViews();
    // setViewer();
    insertViewer(link);
    insertBOM(link, 'Bill of Materials');
    setUIEvents();
    
});

function setUIEvents() {

    // Variants list
    $('#variants-close').click(function() {
        $('#variants').hide();
    });

    // BOM View Selector Change
    $('#master-bom-views').change(function() {
        getBOMData();
    });

    // Footer Toolbar
    $('#select-variant').click(function() {
        $('#variants').toggle();
    })
    $('#toggle-viewer').click(function() {
        $('body').toggleClass('no-viewer');
    })
    $('#toggle-details').click(function() {
        $('body').toggleClass('with-details');
    })
    $('#save').click(function() {
        saveChanges();
    })



//     $('#dialog-cancel').click(function() {
//         hideDialog();
//     });
//     $('#submit').click(function() {
//         moveDraggedItem();
//         hideDialog();
//     });

//     $('.dialog-toggle').click(function() {
//         $(this).addClass('selected');
//         $(this).siblings().removeClass('selected'); 
//     });
    

//     // Status bar filtering
//     $('.bar').click(function() {
//         setStatusBarFilter($(this));
//     })
    
//     $('#mbom-add-name').keypress(function (e) {
//         insertNewOperation(e);
//     });
//     $('#mbom-add-code').keypress(function (e) {
//         insertNewOperation(e);
//     });
    
//     $('#split-qty').click(function() {
//         $(this).select();
//     });


//     // Footer Toolbar
//     $('#deselect-all').click(function() {
//         // console.log('#add-all : ' + $('.item-action-add:visible').length);
//         console.log($('#ebom').find('.item.selected').length);
//         $('#ebom').find('.item.selected').each(function() {
//             $(this).find('.item-title').click();
//         });
//         resetViewerSelection(true);
//     });   

}


// Get viewable and init Forge viewer
function onSelectionChanged(event) {

//     if (event.dbIdArray.length === 1) {

//         let updateBOMPanels = true;

//         viewer.getProperties(event.dbIdArray[0], function(data) {

//             let partNumber = data.name.split(':')[0];

//             $('.item.leaf').hide();
//             $('.item.leaf').removeClass('selected');
//             $('.item.leaf').each(function() {
//                 if($(this).attr('data-part-number') === partNumber) { 
//                     $(this).show(); 
//                     $(this).addClass('selected'); 
//                     $(this).parents().show(); 
//                     if(updateBOMPanels) {
//                         setBOMPanels($(this).attr('data-urn'));
//                         updateBOMPanels = false;
//                     }
//                 }
//             });

//         });

//     } else {
//         $('.item.leaf').show();
//         $('.item.selected').removeClass('selected');
//         hideBOMPanels();
//         viewer.clearThemingColors();
//     }

}
function initViewerDone() {}


// Get item master details
function getDetails() {
    
    $.get('/plm/details', { 'wsId' : wsId, 'dmsId' : dmsId }, function(response) {
    
//         descriptor = data.item.root.title;

//         setItemDetails(data.item.urn);
        
        $('#header-subtitle').html(response.data.title);
        variants = getFieldValue(response.data.sections, 'VARIANTS', []);
        setVariantsList();

//         for(section of data.item.sections) {
            
//             for(field of section.fields) {
                
//                 let fieldURN    = field.urn;
//                 let fieldSplit  = fieldURN.split('.');
//                 let fieldID     = fieldSplit[fieldSplit.length - 1];
                
//                  if(fieldID === 'EBOM') {
//                      let paramsEBOM = field.value.link.split('/');
//                      wsIdEBOM       = paramsEBOM[4];
//                      dmsIdEBOM      = paramsEBOM[6];
//                  } else if(fieldID === 'MBOM') {
//                      if(field.value !== null) {
//                         let paramsMBOM  = field.value.link.split('/');
//                         wsIdMBOM        = paramsMBOM[4];
//                         dmsIdMBOM       = paramsMBOM[6];
//                      }
//                  }
                
//             }
//         }
        
//         if(typeof dmsIdEBOM === 'undefined') dmsIdEBOM = dmsId;
//         if(typeof  wsIdEBOM === 'undefined')  wsIdEBOM = wsId;
        
//         createMBOMRoot(descriptor, function() {
            
//             getBOMView(wsId, viewIDEBOM, function(dataEBOMView) {

//                 getBOMView(wsIdMBOM, viewIDMBOM, function(dataMBOMView) {

//                     getBOM(wsIdEBOM, dmsIdEBOM, viewIDEBOM, function(ebom) {

//                         dataEBOM = ebom;
//                         edgesEBOM = dataEBOM.edges;
//                         edgesEBOM.sort(function(a, b){return a.itemNumber - b.itemNumber});

//                         getBOM(wsIdMBOM, dmsIdMBOM, viewIDMBOM, function(mbom) {

//                             dataMBOM = mbom;
//                             edgesMBOM = dataMBOM.edges;
//                             edgesMBOM.sort(function(a, b){return a.itemNumber - b.itemNumber});

//                             for(field of dataEBOMView) { colsEBOM.push({ fieldId : field.fieldId, viewDefFieldId : field.viewDefFieldId.toString() }); }
//                             for(field of dataMBOMView) { colsMBOM.push({ fieldId : field.fieldId, viewDefFieldId : field.viewDefFieldId.toString() }); }

//                             initEditor();

//                         });
//                     });

//                 });
//             });
            
//         });
        
    });
    
}
function getFieldValue(sections, fieldId, defaultValue) {

    for(section of sections) {
        for(field of section.fields) {
            let id = field.urn.split('.')[9];
            if(id === fieldId) {
                return field.value;
            }

        }
    }

    return defaultValue;

}
function setVariantsList() {

    let elemParent = $('#variants-list');
        elemParent.html();

    for(variant of variants) {

        let elemVariant = $('<div></div>')
            elemVariant.attr('data-link', variant.link);
            elemVariant.html(variant.title);
            elemVariant.appendTo(elemParent);
            elemVariant.click(function() {
                selectVariant($(this));
            });

    }

}
function selectVariant(elemClicked) {

    linkVariant = elemClicked.attr('data-link');
    $('#variant-name').html(elemClicked.html());
    $('#variants').hide();

    let params = {
        // 'wsId'          : wsId,
        // 'dmsId'         : dmsId,
        'link'          : linkVariant,
        'depth'         : 10,
        'revisionBias'  : 'release',
        'viewId'        : $('#variant-bom-views').val()
    }

    $.get('/plm/bom', params, function(response) {

        console.log(response);

        $('#bom-tree').children().each(function() {

            let dmsId = $(this).attr('data-dmsid');

            console.log(dmsId);

            $(this).removeClass('match');

            for(edge of response.data.edges) {

                
                console.log(edge.depth);
                

                if(edge.depth === Number($(this).attr('data-level'))) {

                    let edgeDMSID = edge.child.split('.')[5];

                    console.log(edgeDMSID);

                    if(edgeDMSID === dmsId) $(this).addClass('match');

                }

            }

        });


    });

}

// BOM View selectors
function getBOMViews() {

    let promises = [
        $.get('/plm/bom-views-and-fields', { 'wsId' : wsId }),
        $.get('/plm/bom-views-and-fields', { 'wsId' : 302 }),
        $.get('/plm/sections', { 'wsId' : wsId }),
        $.get('/plm/fields', { 'wsId' : wsId }),
        $.get('/plm/sections', { 'wsId' : 302 }),
        $.get('/plm/fields', { 'wsId' : 302 })
    ];

    Promise.all(promises).then(function(responses) {
        setBOMViews(responses[0].data, 'master-bom-views');
        setBOMViews(responses[1].data, 'variant-bom-views');
        masterSections  = responses[2].data;
        masterFields    = responses[3].data;
        variantSections = responses[4].data;
        variantFields   = responses[5].data;
    });

}
function setBOMViews(views, id){ 

    let elemParent = $('#' + id);

    for(view of views) {

        let elemOption = $('<option></option>');
                elemOption.html(view.name);
                elemOption.attr('value', view.id);
                elemOption.appendTo(elemParent);

    }

}



// function getBOMData() {

//     let params = {
//         'wsId'          : wsId,
//         'dmsId'         : dmsId,
//         'depth'         : 10,
//         'revisionBias'  : 'release',
//         'viewId'        : $('#master-bom-views').val()
//     }

//     let promises = [
//         $.get('/plm/bom-view-fields', params),
//         $.get('/plm/bom', params),
//         $.get('/plm/bom-view-fields', {
//             'wsId'          : 302,
//             'viewId'        : $('#variant-bom-views').val()
//         })
//     ];

//     Promise.all(promises).then(function(responses) {

//         console.log(responses[0]);
//         console.log(responses[1]);
//         console.log(responses[2]);

//         setBOMData(responses[0].data, responses[1].data, responses[2].data);

//     });
    
//     // $.get('/plm/bom', params, function(response) {
    
//     //    console.log(response);

//     //     // let elemOption = $('<option></option>');
//     //     //     elemOption.html('aaa');
//     //     //     elemOption.attr('value', 'aaa');
//     //     //     elemOption.appendTo($('#bom-views'));

//     // });

// }

function setBOMData(columnsMaster, bom, columnsVariant) {

    let elemRoot = $('#bom-tree');
        elemRoot.html('');

    let elemHeader = $('<tr></tr>');
        elemHeader.appendTo(elemRoot);

    keysMaster  = [];
    keysVariant = [];

    


    for(column of columnsMaster) {
        
        if(column.fieldId === 'PART_NUMBER') urnPartNumber = column.__self__.urn;

        keysMaster.push(column.__self__.urn);

        let elemHeaderCell = $('<th></th>');
            elemHeaderCell.html(column.displayName);
            elemHeaderCell.appendTo(elemHeader);

    }

    let elemHeaderMatch = $('<th></th>');
        elemHeaderMatch.html('Status');
        elemHeaderMatch.appendTo(elemHeader);

    for(column of columnsVariant) {
        
        keysVariant.push(column.__self__.urn);
        fieldIDsVariant.push(column.fieldId);

        let elemHeaderCell = $('<th></th>');
            elemHeaderCell.html(column.displayName);
            elemHeaderCell.addClass('cell-variant');
            elemHeaderCell.appendTo(elemHeader);

    }

    insertNextBOMLevel(bom, elemRoot, 'urn:adsk.plm:tenant.workspace.item:ADSKDICKMANS.57.11026');

    updateStatusBar();

    $('.bom-nav').click(function(e) {

        e.stopPropagation();
        e.preventDefault();

        let elemItem  = $(this).closest('tr');
        let level     = Number(elemItem.attr('data-level'));
        let levelNext = level - 1;
        let levelHide = 10000;
        let elemNext  = $(this).closest('tr');
        let doExpand  = $(this).hasClass('collapsed');

        $(this).toggleClass('collapsed');
        
        do {

            elemNext  = elemNext.next();
            levelNext = Number(elemNext.attr('data-level'));

            if(levelNext > level) {

                if(doExpand) {

                    if(levelHide > levelNext) {

                        elemNext.show();

                        let elemToggle = elemNext.children().first().find('i.bom-nav');

                        if(elemToggle.length > 0) {
                            if(elemToggle.hasClass('collapsed')) {
                                levelHide = levelNext + 1;
                            }
                        }

                    }

                } else {
                    elemNext.hide();
                }

            }
        } while(levelNext > level);


    });

    $('tr').click(function() {

        if($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            resetViewerSelection(true);
            $('body').removeClass('with-details');
        } else {
            $('tr.selected').removeClass('selected');
            $(this).addClass('selected');
            setItemDetails($(this).attr('data-link'));
            viewerSelectModel($(this).attr('data-part-number'), true);
        }
        
    });

}
function insertNextBOMLevel(bom, elemRoot, parent) {

    let result = false;

    for(edge of bom.edges) {

        if(edge.parent === parent) {

            result = true;

            let elemRow = $('<tr></tr>');
                elemRow.attr('data-link-variant', '-');
                elemRow.attr('data-number', edge.itemNumber);
                elemRow.attr('data-part-number', getBOMCellValue(edge.child, urnPartNumber, bom.nodes));
                elemRow.attr('data-qty', '1');
                elemRow.attr('data-status', 'match');
                elemRow.appendTo(elemRoot);
    
            for(node of bom.nodes) {
                if(node.item.urn === edge.child) {
                    elemRow.attr('data-dmsId',      node.item.link.split('/')[6]);
                    elemRow.attr('data-link',       node.item.link);
                    elemRow.attr('data-edgeId',     edge.edgeId);
                    elemRow.attr('data-edgeLink',   edge.edgeLink);
                    elemRow.attr('data-level',      edge.depth);
                    elemRow.addClass('bom-level-' + edge.depth);
                }
            }

            for(key of keysMaster) {
                let elemCell = $('<td></td>');
                    elemCell.appendTo(elemRow);
                    elemCell.html(getBOMCellValue(edge.child, key, bom.nodes));
            }

            let elemCellStatus = $('<td></td>');
                elemCellStatus.addClass('cell-status');
                elemCellStatus.appendTo(elemRow);

            for(key of keysVariant) {

                let elemCell = $('<td></td>');
                    elemCell.addClass('cell-variant');
                    elemCell.appendTo(elemRow);

                let elemInput = $('<input>');
                    elemInput.attr('data-value', '');
                    elemInput.appendTo(elemCell);
                    elemInput.keypress(function (e) {
                        updateValue($(this), e);
                    });

            }

            let hasChildren = insertNextBOMLevel(bom, elemRoot, edge.child);

            elemRow.children().first().each(function() {
                
                $(this).addClass('bom-first-col');

                if(hasChildren) {

                    let elemNav = $('<i></i>');
                        elemNav.addClass('bom-nav');
                        elemNav.addClass('zmdi');
                        elemNav.addClass('expanded');
                        elemNav.prependTo($(this));

                }

            });

        }

    }

    return result;


}
// function getBOMItemLink(id, nodes) {

//     for(node of nodes) {
//         if(node.item.urn === id) {
//             return node.item.link;
//         }
//     }

//     return '';
    
// }

function updateValue(elemInput, e) {

    if (e.which == 13) {
    
        if(elemInput.attr('data-value') !== elemInput.val()) {
            elemInput.parent().addClass('changed');
            elemInput.closest('tr').attr('data-status', 'changed');
            updateStatusBar();
        }
    
    }


}
function updateStatusBar() {

    let counters = [0, 0];

    $('tr').each(function() {
        switch($(this).attr('data-status')) {

            case 'changed': 
                counters[1]++;
                break;

            default:
                counters[0]++;
                break;

        }    
    });

    // $('#status-additional').css('flex', countAdditional + ' 1 0%');
    $('#status-changed').css('flex', counters[1] + ' 1 0%');
    $('#status-match').css('flex', counters[0] + ' 1 0%');
    
    if(counters[2] === 0) $('#status-additional').css('border-width', '0px');  else $('#status-additional').css('border-width', '5px');
    if(counters[1] === 0) $('#status-changed').css('border-width', '0px');  else $('#status-changed').css('border-width', '5px');
    if(counters[0] === 0) $('#status-match').css('border-width', '0px');  else $('#status-match').css('border-width', '5px');

}


function setItemDetails(link) {

    $('#details-process').show();

    let elemParent = $('#sections');
        elemParent.html('');

    $.get('/plm/details', { 'link' : link }, function(response) {
        insertItemDetails(elemParent, masterSections, masterFields, response.data, false, false, false);
        $('#details-process').hide();
    });

}


// Apply Changes to PLM
function saveChanges() {

    $('#overlay').show();

    $('tr').addClass('pending');

    createNewItems();


}
function createNewItems() {

    console.log('createNewItems START');

    let promises = [];

    // console.log($('tr.pending').length);

    $('tr.pending').each(function() {
       
        let elemItem = $(this);

        if((elemItem.attr('data-link-variant') === '-') && (elemItem.find('td.changed').length > 0)) {
            if(promises.length < requestsCount) {

                let sections = [];
                let index = 0;

                elemItem.find('.cell-variant').each(function() {

                    let elemInput = $(this).find('input');
                    let fieldId = fieldIDsVariant[index];
                    let sectionId = getSectionIdOfField(fieldId);
                    index++;

                    if(sectionId !== '') {

                    let sectionExists = false;

                    for(section of sections) {

                        if(section.id === sectionId) {
                            sectionExists = true;
                            section.fields.push({
                                'fieldId' : fieldId,
                                'value' : elemInput.val()
                            })
                        }

                    }

                    if(!sectionExists) {
                        sections.push({
                            'id' : sectionId,
                            'fields' : [
                                {
                                    'fieldId' : fieldId,
                                    'value' : elemInput.val()
                                }
                            ]
                        })
                    }
                }

                });

                // console.log(sections);

                promises.push($.post('/plm/create', {
                    'wsId'     : wsIdVariants,
                    'sections' : sections,
                    'index'    : elemItem.index(),
                    'edgeId'   : elemItem.attr('data-edgeid')
                }));

                elemItem.removeClass('pending');
                elemItem.addClass('processing');
                elemItem.addClass('new');

                //elemItem.removeClass('pending');
            }
        } else {
            elemItem.removeClass('pending');
        }
        
    });

    console.log(promises.length);

    if(promises.length > 0) {

        Promise.all(promises).then(function(responses) {
            
            for(response of responses) {
                console.log(response);

                let link = response.data.split('.autodeskplm360.net')[1];

                console.log(link);

                $('tr.processing').each(function() {
       
                    console.log('aha');

                    let elemItem = $(this);

                    console.log(elemItem.attr('data-edgeid'));

                    if(elemItem.attr('data-edgeid') === response.params.edgeId) {
                        elemItem.attr('data-link-new', link);
                        elemItem.attr('data-link', link);
                        elemItem.removeClass('processing');
                    }

                });

                // let elemItem = $('tr.pending:eq(' + response.params.index + ')');
                //     elemItem.attr('data-link-new', link);
                    

            }

            console.log('next chunck');

           createNewItems();
        });

    } else {

        $('tr').addClass('pending');
        updateItems();

    }


}
function updateItems() {

    console.log('updateItems START');

    let promises = [];

    // console.log($('tr.pending').length);

    $('tr.pending').each(function() {
       
        let elemItem = $(this);

        // console.log($(this).index());
       
        // console.log(elemItem.attr('data-link-variant'));
        // console.log(elemItem.find('td.changed').length);

        if((elemItem.attr('data-link-variant') !== '-') && (elemItem.find('td.changed').length > 0)) {
            if(promises.length < requestsCount) {
                let sections = [];
                let index = 0;

                elemItem.find('.cell-variant').each(function() {

                    let elemInput = $(this).find('input');
                    let fieldId = fieldIDsVariant[index];
                    let sectionId = getSectionIdOfField(fieldId);
                    index++;

                    if(sectionId !== '') {

                    let sectionExists = false;

                    for(section of sections) {

                        if(section.id === sectionId) {
                            sectionExists = true;
                            section.fields.push({
                                'fieldId' : fieldId,
                                'value' : elemInput.val()
                            })
                        }

                    }

                    if(!sectionExists) {
                        sections.push({
                            'id' : sectionId,
                            'fields' : [
                                {
                                    'fieldId' : fieldId,
                                    'value' : elemInput.val()
                                }
                            ]
                        })
                    }
                }

                });

                console.log(sections);

                promises.push($.get('/plm/edit', {
                    'wsId'     : wsIdVariants,
                    'sections' : sections,
                    'index'    : elemItem.index(),
                    'edgeId'   : elemItem.attr('data-edgeid')
                }));

                elemItem.removeClass('update');
                elemItem.addClass('processing');
                elemItem.addClass('update');

                //elemItem.removeClass('pending');
            }
        } else {
            elemItem.removeClass('pending');
        }
        
    });

    console.log(promises.length);

    if(promises.length > 0) {

        Promise.all(promises).then(function(responses) {
            
            for(response of responses) {
                console.log(response);

                // let link = response.data.split('.autodeskplm360.net')[1];

                // console.log(link);

                // $('tr.processing').each(function() {
       
                //     console.log('aha');

                //     let elemItem = $(this);

                //     console.log(elemItem.attr('data-edgeid'));

                //     if(elemItem.attr('data-edgeid') === response.params.edgeId) {
                //         elemItem.attr('data-link-new', link);
                //         elemItem.removeClass('processing');
                //     }

                // });

                // let elemItem = $('tr.pending:eq(' + response.params.index + ')');
                //     elemItem.attr('data-link-new', link);
                    

            }

            console.log('next chunck to update');

            updateItems();
        });

    } else {

        //$('tr').addClass('connect');
        connectItems();

    }
}
    

function connectItems() {

    console.log('connectItems START');

    let promises = [];

    $('tr.new').each(function() {

        if(promises.length < requestsCount) {

            let elemItem    = $(this);
            let linkParent  = getParentItemLink(elemItem);
            let linkItem    = elemItem.attr('data-link');
            let params      = {
                'wsIdParent'    : linkParent.split('/')[4],
                'wsIdChild'     : linkItem.split('/')[4],
                'dmsIdParent'   : linkParent.split('/')[6],
                'dmsIdChild'    : linkItem.split('/')[6],
                'qty'           : elemItem.attr('data-qty'),
                'pinned'        : true,
                'number'        : elemItem.attr('data-number')
            }

            console.log(linkParent);
            console.log(linkItem);
            console.log(params);

            promises.push($.get('/plm/bom-add', params));

            elemItem.removeClass('new');
            elemItem.addClass('processing');

        }
        
    });

    console.log(promises.length);

    if(promises.length > 0) {

        Promise.all(promises).then(function(responses) {
            
            for(response of responses) {
                console.log(response);

                // let link = response.data.split('.autodeskplm360.net')[1];

                // console.log(link);

                // $('tr.processing').each(function() {
       
                //     console.log('aha');

                //     let elemItem = $(this);

                //     console.log(elemItem.attr('data-edgeid'));

                //     if(elemItem.attr('data-edgeid') === response.params.edgeId) {
                //         elemItem.attr('data-link-new', link);
                //         elemItem.removeClass('processing');
                //     }

                // });

                // let elemItem = $('tr.pending:eq(' + response.params.index + ')');
                //     elemItem.attr('data-link-new', link);
                    

            }

            console.log('next chunck to update');

            updateItems();
        });

    } else {

        //$('tr').addClass('connect');
        saveEnd();

    }

}
function saveEnd() {

    console.log('saveEnd START');

    $('tr').each(function() {
        $(this).removeClass('pending').removeClass('new').removeClass('update');
    });
    $('#overlay').hide();

}
function getParentItemLink(elemItem) {

    let elemPrev;
    let levelItem = Number(elemItem.attr('data-level'));
    let levelPrev = levelItem;

    do  {

        if(elemItem.prev().length > 0) {

            elemPrev = elemItem.prev();
            levelPrev = Number(elemPrev.attr('data-level'));

        } else {

            levelPrev = -1;

        }


    } while (levelPrev >= levelItem)

    if(levelPrev > -1) {



        return elemPrev.attr('data-link');

    } else {

        return linkVariant;

    }


    // if(elemPrev.length > 0) {

        
    //     let levelPrev = Number(elemPrev.attr('data-level'));
    
    //     do while (levelPrev === levelItem) {   

    //         elemPrev = elemPrev.prev();
    //         levelPrev = Number(elemPrev.attr('data-level'));

    //     } 



    // }




}


function getSectionIdOfField(fieldId) {

    for(section of variantSections) {
        for(field of section.fields) {
            let id = field.link.split('/')[8];
            if(id === fieldId) {
                return section.__self__.split('/')[6];
            }
        }
    }

    return '';

}


// function createMBOMRoot(descriptor, callback) {

//     if(typeof dmsIdMBOM !== 'undefined') {
        
//         callback();
        
//     } else {
    
//         $.get('/plm/fields', { 'wsId' : wsId }, function(data) {
        
//             for(field of data.fields) {

//                 let urn     = field.urn.split('.');
//                 let fieldID = urn[urn.length - 1];

//                 if(fieldID === 'MBOM') {
//                     let fieldDef = field.picklistFieldDefinition.split('/');
//                     wsIdMBOM = fieldDef[4];
//                 }

//             }
        
//             if(typeof wsIdMBOM !== 'undefined') {

//                 let params = { 
//                     'wsId' : wsIdMBOM,
//                     'sections' : [{
//                         'id' : sectionIdMBOM1,
//                         'fields' : [
//                             { 'fieldId' : 'TITLE', 'value' : descriptor }
//                             // { 'fieldId' : 'DESCRIPTION', 'value' : $('#input-details').val() },
//                             // { 'fieldId' : 'MARKUPSTATE', 'value' : JSON.stringify(viewer.getState()) },
//                             // { 'fieldId' : 'MARKUPSVG', 'value' : markupSVG },
//                             // { 'fieldId' : 'DESIGN_REVIEW', 'value' : {
//                             //     'link' : '/api/v3/workspaces/' + selectedWSID + '/items/' + selectedDMSID
//                             // }}
//                         ] 
//                     },{
//                         'id' : sectionIdMBOM2,
//                         'fields' : [
//                             { 'fieldId' : 'EBOM', 'value' : {
//                                 'link' : '/api/v3/workspaces/' + wsId + '/items/' + dmsId
//                             }},
//                             { 'fieldId' : 'IS_OPERATION', 'value' : true }
//                         ]             
//                     }]
//                  };

//                 $.post({
//                     url : '/plm/create', 
//                     contentType : 'application/json',
//                     data : JSON.stringify(params)
//                 }, function(data) {
//                     let linkNew = data.split('/');
//                     dmsIdMBOM = linkNew[linkNew.length - 1];
//                     callback();
//                 }); 
            
//             }
//         });   
//     }
    
// }
   
    
// }
// function getBOM(wsId, dmsId, viewId, callback) {
    
//     let params = {
//         'wsId'          : wsId,
//         'dmsId'         : dmsId,
//         'viewDefId'     : viewId,
//         'depth'         : 5,
//         'revisionBias'  : 'release'
//     };

//     $.get('/plm/bom', params, function(data) {
//         callback(data);
//     });    
    
// }
// function initEditor() {
    
//     $('#ebom').find('.loading').hide();
//     $('#mbom').find('.loading').hide();

//     setEBOM($('#ebom-tree'), dataEBOM.root, 1, null);
//     setMBOM($('#mbom-tree'), dataMBOM.root, '', 1, null);

//     setTotalQuantities();
//     setStatusBar();

//     $('.bar').show();
    
// }
// function setStatusBar() {
    
//     let countAdditional = 0;
//     let countDifferent  = 0;
//     let countMatch      = 0;
    
//     let listEBOM = [];
//     let listMBOM = [];
//     let qtysEBOM = [];
//     let qtysMBOM = [];

//     let listRed     = [];
//     let listYellow  = [];
//     let listGreen   = [];
    
//     $('#ebom').find('.item').each(function() {
//         if(!$(this).hasClass('item-has-bom')) {
//             let urn = $(this).attr('data-urn');
//             $(this).removeClass('additional');
//             $(this).removeClass('different');
//             $(this).removeClass('match');
//             $(this).removeClass('neutral');
//             $(this).removeClass('enable-update');
//             if(listEBOM.indexOf(urn) === -1) {
//                 listEBOM.push(urn);
//                 qtysEBOM.push(Number($(this).attr('data-total-qty')));
//             }
//         }
//     });

//     $('#mbom').find('.item').each(function() {
//         if(!$(this).hasClass('root')) {
//             if(!$(this).hasClass('operation')) {
//                 if(!$(this).hasClass('mbom-item')) {

//                     $(this).removeClass('additional');
//                     $(this).removeClass('different');
//                     $(this).removeClass('match');
//                     $(this).removeClass('neutral');

//                     let urn     = $(this).attr('data-urn');
//                     let urnEBOM = $(this).attr('data-urn-ebom');
                
//                     if(typeof urnEBOM !== 'undefined') urn = urnEBOM;

//                     let index = listMBOM.indexOf(urn);
//                     //let qty = $(this).attr('data-qty');
//                     let qty   = Number($(this).find('.item-qty-input').val());

//                     if(index === -1) {
//                         listMBOM.push(urn);
//                         qtysMBOM.push(qty);
//                     } else {
//                         qtysMBOM[index] += qty;
//                     }
//                 }
//             }
//         }
//     });
    
//     $('#ebom').find('.item').each(function() {
// //        if(!$(this).hasClass('root')) {
//         let partNumber = $(this).attr('data-part-number');
//         if(!$(this).hasClass('item-has-bom')) {
//             let urn     = $(this).attr('data-urn');
//             let index   = listMBOM.indexOf(urn); 
//             let qty     = qtysEBOM[listEBOM.indexOf(urn)];
//             if(listMBOM.indexOf(urn) === -1) {
//                 countAdditional++;
//                 if(listRed.indexOf(partNumber) === -1) listRed.push(partNumber);
//                 $(this).addClass('additional');
//             } else if(qtysMBOM[index] === qty) {
//                 $(this).addClass('match');
//                 countMatch++;
//                 if(listGreen.indexOf(partNumber) === -1) listGreen.push(partNumber);
//             } else {
//                 $(this).addClass('different');
//                 countDifferent++;
//                 if(listYellow.indexOf(partNumber) === -1) listYellow.push(partNumber);
//                 if($(this).attr('data-instance-qty') === $(this).attr('data-total-qty')) {  

//                     let countMBOMInstances = 0;

//                     $('#mbom').find('.item').each(function() {

//                         let urnMBOM = $(this).attr('data-urn');
//                         if(urn === urnMBOM) {
//                             countMBOMInstances++;
//                         }

//                     });

//                     if(countMBOMInstances === 1) $(this).addClass('enable-update');
//                 }
//             }
            
//         }
//     });
//     $('#mbom').find('.item').each(function() {
//         if($(this).hasClass('mbom-item')) {
//             $(this).addClass('unique');
//         } else if(!$(this).hasClass('root')) {
//             if(!$(this).hasClass('operation')) {
                
//                 let urn     = $(this).attr('data-urn');
//                 let urnEBOM = $(this).attr('data-urn-ebom');
                
//                 if(typeof urnEBOM !== 'undefined') urn = urnEBOM;
                
//                 let index   = listEBOM.indexOf(urn); 
//                 let qty     = qtysMBOM[listMBOM.indexOf(urn)];

//                 if(index === -1) {
//                     countAdditional++;
//                     $(this).addClass('additional');
//                 } else if(qtysEBOM[index] === qty) {
//                     $(this).addClass('match');
//                 } else {
//                     $(this).addClass('different');
//                 }
//             }
//         }
//     });
    
//     $('#status-additional').css('flex', countAdditional + ' 1 0%');
//     $('#status-different').css('flex', countDifferent + ' 1 0%');
//     $('#status-match').css('flex', countMatch + ' 1 0%');
    
//     if(countAdditional === 0) $('#status-additional').css('border-width', '0px');  else $('#status-additional').css('border-width', '5px');
//     if(countDifferent === 0) $('#status-different').css('border-width', '0px');  else $('#status-different').css('border-width', '5px');
//     if(countMatch === 0) $('#status-match').css('border-width', '0px');  else $('#status-match').css('border-width', '5px');
    
//     if(viewerStatusColors) {
//         viewerSetColors(listRed     , new THREE.Vector4(1,   0, 0, 0.5));
//         viewerSetColors(listYellow  , new THREE.Vector4(1, 0.5, 0, 0.5));
//         viewerSetColors(listGreen   , new THREE.Vector4(0,   1, 0, 0.5));
//     } else {
//         viewerResetColors();
//     }

// }


// // Input controls to add new items to MBOM
// function addInput(elemParent) {

//     var elemAdd = $('<div></div>');
//         elemAdd.addClass('item-add');
//         elemAdd.appendTo(elemParent);
    
//     var elemInputName = $('<input></input>');
//         elemInputName.attr('placeholder', 'Type new component name');
//         elemInputName.addClass('item-input');
//         elemInputName.addClass('name');
//         elemInputName.appendTo(elemAdd);
    
//     var elemInputQty = $('<input></input>');
//         elemInputQty.attr('placeholder', 'Qty');
//         elemInputQty.addClass('item-input');
//         elemInputQty.addClass('quantity');
//         elemInputQty.appendTo(elemAdd);

    
//     listenForInput(elemInputName);
//     listenForInput(elemInputQty);
    
// }
// function listenForInput(elemInput) {
    
//     elemInput.keypress(function (e) {
//         if (e.which == 13) {
//             insertNewItem($(this));
//         }
//     });
    
// }
// function insertNewItem(elemInput) {
      
    
//     let title = '';
//     let qty = '1';
    
//     if(elemInput.hasClass('quantity')) {
//         qty = elemInput.val();
//         title = elemInput.prev().val();
//         elemInput.prev().focus();
//     } else {
//         qty = elemInput.next().val();
//         console.log(elemInput.val());
//         title = elemInput.val();
//         if(qty === '') qty = '1';
//     }
    
//     elemInput.val('');
//     elemInput.siblings().val('');
    
//     let elemBOM = elemInput.parent().prev();
    
//     let elemNode = $('<div></div>');
//         elemNode.addClass('item');
//         elemNode.addClass('leaf');
//         elemNode.addClass('new');
//         elemNode.addClass('unique');
//         elemNode.addClass('mbom-item');
//         elemNode.attr('data-urn', '');
//         elemNode.appendTo(elemBOM);
        
//     let elemNodeHead = $('<div></div>');
//         elemNodeHead.addClass('item-head');
//         elemNodeHead.appendTo(elemNode);
    
//     let elemNodeToggle = $('<div></div>');
//         elemNodeToggle.addClass('item-toggle');
//         elemNodeToggle.appendTo(elemNodeHead);
    
//     let elemNodeIcon = $('<div></div>');
//         elemNodeIcon.addClass('item-icon');
//         elemNodeIcon.html('<i class="zmdi zmdi-wrench"></i>');
//         elemNodeIcon.appendTo(elemNodeHead);
    
//     let elemNodeTitle = $('<div></div>');
//         elemNodeTitle.addClass('item-title');
// //        elemNodeTitle.addClass('with-number');
//         elemNodeTitle.html(title);
//         elemNodeTitle.attr('data-urn', '');
//         elemNodeTitle.appendTo(elemNodeHead);
    
//     let elemNodeQty = $('<div></div>');
//         elemNodeQty.addClass('item-qty');
//         elemNodeQty.appendTo(elemNodeHead);
// //        elemNodeQty.html(qty);

//     let elemQtyInput = $('<input></input>');
//         elemQtyInput.attr('type', 'number');
//         elemQtyInput.addClass('item-qty-input');
//         elemQtyInput.val(qty);
//         elemQtyInput.appendTo(elemNodeQty);
    
    
//     let elemNodeCode = $('<div></div>');
//         elemNodeCode.addClass('item-code');
// //        elemNodeCode.html(code);
//         elemNodeCode.appendTo(elemNodeHead);
    
//     let elemNodeStatus = $('<div></div>');
//         elemNodeStatus.addClass('item-status');
//         elemNodeStatus.appendTo(elemNodeHead);
    
    
//     let elemNodeActions = $('<div></div>');
//         elemNodeActions.addClass('item-actions');
//         elemNodeActions.appendTo(elemNodeHead);
    
        
// //    let elemNodeNumber = $('<input></input>');
// //        elemNodeNumber.addClass('number');
// //        elemNodeNumber.appendTo(elemNodeHead);
    
// //    let elemNodeAction = $('<div></div>');
// //        elemNodeAction.addClass('item-action');
// //        elemNodeAction.addClass('delete');
// //        elemNodeAction.html('-');
// //        elemNodeAction.appendTo(elemNodeHead);
// //        elemNodeAction.click(function() {
// //            $(this).closest('.item').remove();
// //            setInsertActions();
// //        });
    
    
//     elemNodeHead.attr('data-qty', qty);
//     elemNodeTitle.attr('data-qty', qty);
//     elemNode.attr('data-qty', qty);
    
//     insertMBOMActions(elemNodeActions);
//     setDraggable(elemNode);
        
// }
// function insertNewOperation(e) {
    
//     if (e.which == 13) {
        
//         // if(($('#mbom-add-name').val() === '') || ($('#mbom-add-code').val() === '')) {
//         //     alert('You have to provide both a title and a code for the new operation');
//         //     return;
//         // }

//         let elemNew = getBOMNode(2, '', $('#mbom-add-name').val(), '', '', $('#mbom-add-code').val(), '', '', 'mbom', false);
//             elemNew.attr('data-parent', '');
//             elemNew.addClass('new');
//             elemNew.addClass('operation');
//             elemNew.addClass('neutral');
//             elemNew.find('.item-icon').children().addClass('zmdi-time');
        
//         let elemBOM = $('#mbom-tree').children().first().children('.item-bom').first();
//             elemBOM.append(elemNew);
        
//         $('#mbom-add-name').val('');
//         $('#mbom-add-code').val('');
//         $('#mbom-add-name').focus();
        
//     }
    
// }


// // Display EBOM information
// function setEBOM(elemParent, urn, level, qty) {
    
//     let descriptor  = getDescriptor(dataEBOM, urn);
//     let partNumber  = getNodeProperty(dataEBOM, urn, colsEBOM, 'NUMBER', '');
//     let category    = getNodeProperty(dataEBOM, urn, colsEBOM, 'CATEGORY', '');
//     let code        = getNodeProperty(dataEBOM, urn, colsEBOM, 'OPERATION_CODE', '');
//     let icon        = getWorkspaceIcon(urn, level);
//     let endItem     = getNodeProperty(dataEBOM, urn, colsEBOM, 'END_ITEM', '');
//     let ignoreMBOM  = getNodeProperty(dataEBOM, urn, colsEBOM, 'IGNORE_IN_MBOM', '');
//     let hasMBOM     = getNodeURN(dataEBOM, urn, colsEBOM, 'MBOM', '');
//     let isLeaf      = isEBOMLeaf(level, urn, hasMBOM, endItem);

//     if(ignoreMBOM !== 'true') {
    
//         let elemNode = getBOMNode(level, urn, descriptor, partNumber, category, code, icon, qty, 'ebom', isLeaf);
//             elemNode.appendTo(elemParent);
            
//         if(hasMBOM !== '') elemNode.attr('data-urn-mbom', hasMBOM);

//         if(level === 1) elemNode.addClass('root');
//         else elemNode.addClass('leaf');
        
//     }
    
// }
// function isEBOMLeaf(level, urn, hasMBOM, endItem) {
    
//     if(level === 1) return false;
//     if(hasMBOM !== '') return true;
//     if(endItem === 'true') return true;
    
//     for(edgeEBOM of edgesEBOM) {
//         if(edgeEBOM.parent === urn) {
//             if(getNodeProperty(dataEBOM, edgeEBOM.child, colsEBOM, 'IGNORE_IN_MBOM', '') !== true) {
//                 return  false;   
//             }
//         }
//     }
        
//     return true;
    
// }
// function getBOMNode(level, urn, descriptor, partNumber, category, code, icon, qty, bomType, isLeaf) {
    
//     let elemNode = $('<div></div>');
//         elemNode.addClass('item');
//         elemNode.attr('category', category);
//         elemNode.attr('data-code', code);
//         elemNode.attr('data-urn', urn);
//         elemNode.attr('data-part-number', partNumber);
    
//     let elemNodeHead = $('<div></div>');
//         elemNodeHead.addClass('item-head');
//         elemNodeHead.appendTo(elemNode);
    
//     let elemNodeToggle = $('<div></div>');
//         elemNodeToggle.addClass('item-toggle');
//         elemNodeToggle.appendTo(elemNodeHead);
    
//     let elemNodeIcon = $('<div></div>');
//         elemNodeIcon.addClass('item-icon');
//         elemNodeIcon.html('<i class="zmdi ' + icon + '"></i>');
//         elemNodeIcon.appendTo(elemNodeHead);
    
//     let elemNodeTitle = $('<div></div>');
//         elemNodeTitle.addClass('item-title');
//         elemNodeTitle.appendTo(elemNodeHead);
//         elemNodeTitle.attr('title', descriptor);
    
//     let elemNodeDescriptor = $('<span></span>');
//         elemNodeDescriptor.addClass('item-descriptor');
//         elemNodeDescriptor.html(descriptor);
//         elemNodeDescriptor.appendTo(elemNodeTitle);

//     let elemNodeLink = $('<i class="zmdi zmdi-open-in-new"></i>');
//         elemNodeLink.addClass('item-link');
//         elemNodeLink.attr('title', 'Click to open given item in PLM in a new browser tab');
//         elemNodeLink.appendTo(elemNodeTitle);
//         elemNodeLink.click(function(event) {

//             event.stopPropagation();
//             event.preventDefault();
            
//             let elemItem = $(this).closest('.item');
//             let urn      = elemItem.attr('data-urn');
            
//             if(urn === '') {

//                 alert('Item does not exist yet. Save your changes to the database first.');
                
//             } else {
            
//                 let data     = urn.split(':')[3].split('.');

//                 let url  = 'https://' + data[0] + '.autodeskplm360.net';
//                     url += '/plm/workspaces/' + data[1];
//                     url += '/items/itemDetails?view=full&tab=details&mode=view&itemId=urn%60adsk,plm%60tenant,workspace,item%60';
//                     url += data[0] + ',' + data[1] + ',' + data[2];

//                 window.open(url, '_blank');
                
//             }
            
//         });

//     let elemNodeFilter = $('<i class="zmdi zmdi-filter-list"></i>');
//         elemNodeFilter.addClass('item-link');
//         elemNodeFilter.attr('title', 'Click to toggle filter for this component in viewer, EBOM and MBOM');
//         elemNodeFilter.appendTo(elemNodeTitle);
//         elemNodeFilter.click(function(event) {

//             event.stopPropagation();
//             event.preventDefault();

//             selectBOMItem($(this), true);
            
//         });

//     let elemNodeQty = $('<div></div>');
//         elemNodeQty.addClass('item-qty');
//         elemNodeQty.appendTo(elemNodeHead);
    
//     let elemQtyInput = $('<input></input>');
//         elemQtyInput.attr('type', 'number');
//         elemQtyInput.attr('title', 'Quantity');
//         elemQtyInput.addClass('item-qty-input');
//         elemQtyInput.appendTo(elemNodeQty);
    
//     let elemNodeCode = $('<div></div>');
//         elemNodeCode.addClass('item-code');
//         elemNodeCode.html(code);
//         elemNodeCode.attr('title', 'Operation Code');
//         elemNodeCode.appendTo(elemNodeHead);
    
//     let elemNodeStatus = $('<div></div>');
//         elemNodeStatus.addClass('item-status');
//         elemNodeStatus.attr('title', 'EBOM / MBOM match indicator\r\n- Green : match\r\n- Red : missing in MBOM\r\n- Orange : quantity mismatch');
//         elemNodeStatus.appendTo(elemNodeHead);
    
//     let elemNodeActions = $('<div></div>');
//         elemNodeActions.addClass('item-actions');
//         elemNodeActions.appendTo(elemNodeHead);
    
//     if(qty !== null) {
//         elemQtyInput.val(qty);
//         elemNodeHead.attr('data-qty', qty);
//         elemNodeTitle.attr('data-qty', qty);
//         elemNode.attr('data-qty', qty);
//     };
    
//     if(category !== '') elemNode.addClass('category-' + category);
    
//     if(bomType === 'ebom') {
    
// //        setClickable(elemNodeTitle);
        
//         elemQtyInput.attr('disabled', 'disabled');
        
// //        if(level === 2) {
// //        
// //            let elemActionAdd = addAction('Add', elemNodeActions);
// //                elemActionAdd.addClass('item-action-add');
// //                elemActionAdd.click(function() {
// //                    insertFromEBOMToMBOM($(this));
// //                });
// //
// //            let elemActionUpdate = addAction('Update', elemNodeActions);
// //                elemActionUpdate.addClass('item-action-update');
// //                elemActionUpdate.click(function() {
// //                    updateFromEBOMToMBOM($(this));
// //                });
// //            
// //        }


//         elemNodeIcon.attr('title', 'EBOM item managed in Vault Items & BOMs workspace');
//         elemNodeTitle.click(function() {
//             selectBOMItem($(this), false);
//         });
        
//         if(!isLeaf) {
            
            
//             elemNode.addClass('item-has-bom');
        
//             let elemNodeBOM = $('<div></div>');
//                 elemNodeBOM.addClass('item-bom');
//                 elemNodeBOM.appendTo(elemNode);
    
//             for(edgeEBOM of edgesEBOM) {
//                 if(edgeEBOM.depth === level) {
//                     if(edgeEBOM.parent === urn) { 
//                         let childQty = Number(getEdgeProperty(edgeEBOM, colsEBOM, 'QUANTITY', '0.0'));

//     //                    childQty = precisionRound(childQty, -1);

//                         setEBOM(elemNodeBOM, edgeEBOM.child, level + 1, childQty);
//                     }
//                 }
//             }
        
// //        if(level > 1) addBOMToggle(elemNodeHead);
        
// //            let elemNodeToggle = elemNode.find('.item-toggle');
        
//             if(level > 1) addBOMToggle(elemNodeToggle);

//             let elemActionAdd = addAction('Add', elemNodeActions);
//                 elemActionAdd.addClass('item-action-add');
//                 elemActionAdd.click(function() {
//                     addBOMItems($(this));
//                 });
            
            
//         } else {



//             // let elemNodeTotalQty = $('<div></div>');
//             //     elemNodeTotalQty.addClass('item-total-qty');
//             //     elemNodeTotalQty.insertAfter(elemNodeQty);
//             //     elemNodeTotalQty.html(qty);
            
//             let elemActionAdd = addAction('Add', elemNodeActions);
//                 elemActionAdd.addClass('item-action-add');
//                 elemActionAdd.attr('title', 'Add this component with matching quantity to MBOM on right hand side');
//                 elemActionAdd.click(function() {
//                     insertFromEBOMToMBOM($(this));
//                 });

//             let elemActionUpdate = addAction('Update', elemNodeActions);
//                 elemActionUpdate.addClass('item-action-update');
//                 elemActionUpdate.click(function() {
//                     updateFromEBOMToMBOM($(this));
//                 });


            
//         }
        
//     } else {
        
//         elemQtyInput.keyup(function (e) {
//            // if (e.which == 13) {
//                 // $(this).closest('.item').attr('data-qty', $(this).val());
//                 $(this).closest('.item').attr('data-instance-qty', $(this).val());
//                 setStatusBar();
//                 setBOMPanels($(this).closest('.item').attr('data-urn'));
//             //}
//         });
//         elemQtyInput.attr('title', 'Set quantity of this component');
        
//         insertMBOMActions(elemNodeActions);
        
//                 if(isLeaf) {
        

            
//             $('#ebom').find('.item').each(function() {
            
//                 var urnEBOM = $(this).attr('data-urn');
//                 var catEBOM = $(this).attr('category');
//                 if(urnEBOM === urn) {
//                     if(typeof urnEBOM !== 'undefined') {
//                         elemNode.addClass(catEBOM);
//                     }
//                 }
            
//             });
            
//             setDraggable(elemNode);        

//             elemNode.click(function() {
//                 selectBOMItem($(this), false);
//             });
        
//         } else {
            
//             let elemNodeBOM = $('<div></div>');
//                 elemNodeBOM.addClass('item-bom');
//                 elemNodeBOM.appendTo(elemNode);

//             if(level === 2)  {
//                 elemNode.addClass('column');
//                 setDroppable(elemNode);
// //                addInput(elemNode);
//             }
            
//             addInput(elemNode);

//             if(level > 1) addBOMToggle(elemNodeToggle);
            
//         }
//     }
    
//     return elemNode;
    
// }
// function getEdgeProperty(edge, cols, fieldId, defValue) {
    
//     let id = getViewFieldId(cols, fieldId);
    
//     for(field of edge.fields) {
        
//         let fieldArray  = field.metaData.urn.split('.');
//         let fieldIdent  = fieldArray[fieldArray.length - 1];
        
//         if(fieldIdent === id) return field.value;
//     }
    
//     return defValue;
    
// }
// function getNodeProperty(list, urn, cols, fieldId, defValue) {

//     let id = getViewFieldId(cols, fieldId);
  
//     if(id === '') return defValue;
    
//     for(node of list.nodes) {
        
//         if(node.item.urn === urn) {
            
//             for(field of node.fields) {
                
//                 let fieldArray  = field.metaData.urn.split('.');
//                 let fieldID     = fieldArray[fieldArray.length - 1];
                
                
//                 if(id === fieldID) {
//                     if(typeof field.value === 'object') {
//                         return field.value.title;
//                     } else {
//                         return field.value;    
//                     }
//                 }
                
//             }
            
//             return defValue;
            
//         }
        
//     }
    
//     return defValue;
    
// }
// function getNodeURN(list, urn, cols, fieldId, defValue) {

//     let id = getViewFieldId(cols, fieldId);
  
//     if(id === '') return defValue;
    
//     for(node of list.nodes) {
        
//         if(node.item.urn === urn) {
            
//             for(field of node.fields) {
                
//                 let fieldArray  = field.metaData.urn.split('.');
//                 let fieldID     = fieldArray[fieldArray.length - 1];
                
                
//                 if(id === fieldID) {
//                     if(typeof field.value === 'object') {
//                         return field.value.urn;
//                     } else {
//                         return field.value;    
//                     }
//                 }
                
//             }
            
//             return defValue;
            
//         }
        
//     }
    
//     return defValue;
    
// }
// function getViewFieldId(cols, fieldId) {
    
//     for(col of cols) {
//         if(col.fieldId === fieldId) return col.viewDefFieldId;
//     }
    
//     return '';
    
// }
// function insertFromEBOMToMBOM(elemAction) {
    
// //    console.log(' insertFromEBOMToMBOM START');
    
//     let elemItem    = elemAction.closest('.item');
//     let code        = elemItem.attr('data-code');
//     let category    = elemItem.attr('category');
//     let elemTarget  = $('#mbom').find('.root');
    
//     if($('.operation').length > 0) {
        
//         let operationMatch = false;
        
//         $('.operation').each(function() {
//             if(!operationMatch) {
//                 let operationCode = $(this).attr('data-code');
//                 if(operationCode === code) {
//                     operationMatch = true;
//                     elemTarget = $(this); 
//                 }
//             };
//         });
        
//     }
    
//     if(elemTarget !== null) {   
        
//         let clone = elemItem.clone(true, true);
//             clone.appendTo(elemTarget.find('.item-bom').first());
        
//         let elemQtyInput = clone.find('.item-qty-input');
//             elemQtyInput.removeAttr('disabled');
//             elemQtyInput.keyup(function (e) {
//                 //if (e.which == 13) {
//                     // $(this).closest('.item').attr('data-qty', $(this).val());
//                     $(this).closest('.item').attr('data-instance-qty', $(this).val());
//                     setStatusBar();
//                     setBOMPanels($(this).closest('.item').attr('data-urn'));
//                 //}
//             });

//         let elemActions = clone.find('.item-actions');
//             elemActions.html('');

//         insertMBOMActions(elemActions);
//         setDraggable(clone);

//     }
    
//     setStatusBar();

// }
// function updateFromEBOMToMBOM(elemAction) {
    
//     let elemItem    = elemAction.closest('.item');
//     let urn         = elemItem.attr('data-urn');
//     let qty         = elemItem.attr('data-instance-qty');
    
//     let listMBOM = $('#mbom').find('[data-urn="' + urn + '"]');
    
//     if(listMBOM.length === 1) {
//         // listMBOM.attr('data-qty', qty);
//         listMBOM.find('.item-qty-input').val(qty);
//         setStatusBar();

//         if(elemItem.hasClass('selected')) setBOMPanels(urn);
//     }
    
// }




// // Display MBOM information
// function setMBOM(elemParent, urn, urnParent, level, qty) {
    
//     let descriptor  = getDescriptor(dataMBOM, urn);
//     let partNumber  = getNodeProperty(dataMBOM, urn, colsMBOM, 'NUMBER', '');
//     let category    = getNodeProperty(dataMBOM, urn, colsMBOM, 'TYPE', '');
//     let code        = getNodeProperty(dataMBOM, urn, colsMBOM, 'OPERATION_CODE', '');
//     let isOperation = getNodeProperty(dataMBOM, urn, colsMBOM, 'IS_OPERATION', '');
//     let hasEBOM     = getNodeURN(dataMBOM, urn, colsMBOM, 'EBOM', '');
//     let wsId        = getWorkspaceId(urn);
//     let icon        = getWorkspaceIcon(urn, level);
//     let isLeaf      = isMBOMLeaf(urn, wsId, level, code);
//     let edge        = getEdge(urn, urnParent);
//     let edges       = [];
//     let itemNumber  = getItemNumber(urn, urnParent);

//     // console.log(' > isOperation = ' + isOperation);
//     // console.log(' > hasEBOM = ' + hasEBOM);
    
    
//     if(wsId === wsIdEBOM) {
//         code = getNodeProperty(dataEBOM, urn, colsEBOM, 'OPERATION_CODE', '');
//         partNumber = getNodeProperty(dataEBOM, urn, colsEBOM, 'NUMBER', '');
//     }

    
//     let elemNode = getBOMNode(level, urn, descriptor, partNumber, category, code, icon, qty, 'mbobm', isLeaf);
// //        elemNode.addClass('neutral');
//         elemNode.attr('data-parent', urnParent);
//         elemNode.attr('data-edge', edge);
//         elemNode.attr('data-edges', '');
//         elemNode.attr('data-number', itemNumber);
//         elemNode.attr('data-number-db', itemNumber);
//         elemNode.appendTo(elemParent);
    
    
    
//     if(hasEBOM !== '') {
//         elemNode.attr('data-urn-ebom', hasEBOM);
//         elemNode.attr('data-urn-mbom', urn);
        
//         $('#ebom').find('.leaf').each(function() {
            
//             let urnEBOM = $(this).attr('data-urn');
            
//             if(urnEBOM === hasEBOM) {
                
//                 let titleEBOM = $(this).find('.item-title').first().html();
//                 let codeEBOM = $(this).find('.item-code').first().html();
                
//                 elemNode.find('.zmdi').first().addClass('zmdi-settings').removeClass('zmdi-wrench');
//                 elemNode.find('.item-title').first().html(titleEBOM);
//                 elemNode.find('.item-code').first().html(codeEBOM);
//                 elemNode.removeClass('mbom-item');
//                 icon = 'zmdi-settings';
//                 isLeaf = true;
                
//             }
            
//         });
        
        
//     }
    
//     if(level === 1) {
//         elemNode.addClass('root');
//         // if(wsId !== wsIdEBOM) elemNode.addClass('operation');
//     } else if(isOperation) {
//         if(level === 2) {
//             elemNode.addClass('neutral');
//             elemNode.addClass('operation');
//         }
//     }
// //    else if(level === 2) elemNode.addClass('operation');
// //                    else elemNode.addClass('leaf');

//     if(icon === 'zmdi-wrench') {
//         elemNode.attr('title', 'This is a manufacturing specific item being managed in the Items & BOMS workspace');
//         elemNode.addClass('mbom-item');
//     }
    
//     if(!isLeaf) {
        
//         let elemNodeBOM = elemNode.find('.item-bom').first();
//         for(edgeMBOM of edgesMBOM) {
//             if(edgeMBOM.depth === level) {
//                 if(edgeMBOM.parent === urn) {
//                     edges.push(edgeMBOM.edgeId);
//                     let childQty = getEdgeProperty(edgeMBOM, colsMBOM, 'QUANTITY', '0.0');
//                     childQty = parseInt(childQty);
//                     setMBOM(elemNodeBOM, edgeMBOM.child, urn, level + 1, childQty);
//                 }
//             }
//         }
        
        
//         elemNode.attr('data-edges', edges.toString());
        
//     } else {
        
//         elemNode.addClass('leaf');
           
//     }
    
// //    if(level === 1) 
    
// }
// function isMBOMLeaf(urn, wsId, level, code) {
    
//     if(level === 1) return false;
    
// //    if(level === 2) return false;
//     if(level === 3) return true;
    
//     if(wsId === wsIdMBOM) {
//         if(code !== null) return false;
//     } else {
//         return true;
//     }
    
    
//     for(edgeMBOM of edgesMBOM) {
//         if(edgeMBOM.parent === urn) return false;
//     }
    
//     return true;
    
// }
// function getWorkspaceId(urn) {
    
//     let params = urn.split('.');
    
//     return params[params.length - 2];
    
// }
// function getWorkspaceIcon(urn, level) {
    
//     let temp = urn.split('.');
//     let wsId = temp[temp.length - 2];
    
//     if(wsId === wsIdEBOM) return 'zmdi-settings';
//     else if(wsId ===  wsIdMBOM) {
//         if(level < 3) { return 'zmdi-time'; } 
//         else { return 'zmdi-wrench'; }
//     } else { return ''; }
    
// }
// function addAction(label, elemParent) {
    
//     let elemAction = $('<div></div>');
//         elemAction.addClass('item-action');
//         elemAction.html(label);
//         elemAction.appendTo(elemParent);
    
//     return elemAction;

// }
// function addActionIcon(icon, elemParent) {
    
//     let elemAction = $('<div></div>');
//         elemAction.addClass('item-action');
//         elemAction.addClass('icon');
//         elemAction.addClass('zmdi');
//         elemAction.addClass(icon);
//         // elemAction.html(label);
//         elemAction.appendTo(elemParent);
    
//     return elemAction;

// }
// function insertMBOMActions(elemActions) {

//     elemActions.html('');

//     let elemActionRemove = addActionIcon('zmdi-close', elemActions);
//         elemActionRemove.attr('title', 'Remove this component instance from MBOM');
//         elemActionRemove.click(function() {
//             $(this).closest('.item').remove();
//             setStatusBar();
//         });

//     let elemActionUp = addActionIcon('zmdi-long-arrow-up', elemActions);
//         elemActionUp.attr('title', 'Move this component up in MBOM');
//         elemActionUp.click(function(event) {
        
//             event.stopPropagation();
//             event.preventDefault();
            
//             let elemItem    = $(this).closest('.item');
//             let elemPrev    = elemItem.prev();
//             let elemNumber  = elemItem.attr('data-number');

//             elemItem.insertBefore(elemPrev);
//             elemItem.attr('data-number', elemPrev.attr('data-number'));

//             if(typeof elemNumber === 'undefined') {
//                 let prevNumber = elemPrev.attr('data-number');
//                 if(typeof prevNumber !== 'undefined') elemNumber = Number(prevNumber) + 1;
//             }

//             elemPrev.attr('data-number', elemNumber);

//         });

//     let elemActionDown = addActionIcon('zmdi-long-arrow-down', elemActions);
//         elemActionDown.attr('title', 'Move this component down in MBOM');
//         elemActionDown.click(function(event) {

//             event.stopPropagation();
//             event.preventDefault();
            
//             let elemItem    = $(this).closest('.item');
//             let elemNext    = elemItem.next();
//             let elemNumber  = elemItem.attr('data-number');
//             let nextNumber  = elemNext.attr('data-number');
            
//             if(elemNext.length > 0) {

//                 if(typeof nextNumber === 'undefined') {
//                     nextNumber = Number(elemNumber) + 1;
//                 }

//                 elemItem.insertAfter(elemNext);
//                 elemItem.attr('data-number', nextNumber);
//                 elemNext.attr('data-number', elemNumber);

//             }

//         });

// }


// // Parse BOM information
// function getDescriptor(data, urn) {
    
//     for(node of data.nodes) {
//         if(node.item.urn === urn) {
//             return node.item.title;
//         }
//     }
    
//     return '';
    
// }
// function getEdge(urn, urnParent) {
    
//     if(urnParent === '') return '';
    
//     for(edge of edgesMBOM) {
//         if(edge.child === urn) {
//             if(edge.parent === urnParent) {
//                 return edge.edgeId;
//             }
//         }
//     }
    
//     return '';
    
// }
// function getItemNumber(urn, urnParent) {
    
//     if(urnParent === '') return -1;
    
//     for(edge of edgesMBOM) {
//         if(edge.child === urn) {
//             if(edge.parent === urnParent) {
//                 return edge.itemNumber;
//             }
//         }
//     }
    
//     return -1;

// }


// // Toggles to expand / collapse BOMs
// function addBOMToggle(elemParent) {
    
//     let elemNodeTogglePlus = $('<div></div>');
//         elemNodeTogglePlus.css('display', 'none');
//         elemNodeTogglePlus.html('<i class="zmdi zmdi-chevron-right"></i>');
//         elemNodeTogglePlus.appendTo(elemParent);
//         elemNodeTogglePlus.click(function(event) {
            
//             if(event.shiftKey) { 
//                 let elemRoot = $(this).closest('.root');
//                 elemRoot.find('.zmdi-chevron-right:visible').click();
//             } else {
//                 $(this).closest('.item').find('.item-bom').fadeIn(); 
//                 $(this).closest('.item').find('.item-add').fadeIn(); 
//                 $(this).closest('.item').find('.item-input').fadeIn(); 
//                 $(this).siblings().toggle();
//                 $(this).toggle();
//             };
            
//         });
    
//     let elemNodeToggleMinus = $('<div></div>');
//         elemNodeToggleMinus.html('<i class="zmdi zmdi-chevron-down"></i>');
//         elemNodeToggleMinus.appendTo(elemParent);
//         elemNodeToggleMinus.click(function(event) {
            
//             if(event.shiftKey) { 
//                 let elemRoot = $(this).closest('.root');
//                 elemRoot.find('.zmdi-chevron-down:visible').click();
//             } else {
//                 $(this).closest('.item').find('.item-bom').fadeOut(); 
//                 $(this).closest('.item').find('.item-add').fadeOut(); 
//                 $(this).closest('.item').find('.item-input').fadeOut(); 
//                 $(this).siblings().toggle();
//                 $(this).toggle();
//             }
            
//         });
    
// }


// // Calculate total quantities
// function setTotalQuantities() {

//     let urns = [];
//     let qtys = [];

//     $('#ebom').find('.item-qty-input').each(function() {

//         let elemQtyInput = $(this);

//         if(elemQtyInput.parent().parent().siblings().length === 0) {
            
//             let totalQuantity   = Number(elemQtyInput.val());
//             let elemItem        = elemQtyInput.closest('.item');
//             let urn             = elemItem.attr('data-urn');

//             elemQtyInput.parents('.item-has-bom').each(function() {
//                 if(this.hasAttribute('data-qty')) {
//                     totalQuantity = totalQuantity * Number($(this).attr('data-qty'));
//                 }
//             })

//             elemItem.attr('data-instance-qty', totalQuantity);
//             elemQtyInput.val(totalQuantity);

//             if(urns.indexOf(urn) === -1) {
//                 urns.push(urn);
//                 qtys.push(totalQuantity);
//             } else {
//                 qtys[urns.indexOf(urn)] += totalQuantity;
//             }

//         }
//     });

//     $('#ebom').find('.item-qty-input').each(function() {
    
//         let elemItem = $(this).closest('.item');
//         let urn = elemItem.attr('data-urn');

//         elemItem.attr('data-total-qty', qtys[urns.indexOf(urn)]);

//     });

// }


// // Enable item filtering & preview
// // function setClickable(elemClicked) {
// function selectBOMItem(elemClicked, filter) {
    
//     let elemItem = elemClicked.closest('.item');

//     if(filter) {
//         if(elemItem.hasClass('filter')) deselectItem(elemItem);
//         else selectItem(elemItem, filter);
//     } else {
//         if(elemItem.hasClass('selected'))  deselectItem(elemItem);
//         else selectItem(elemItem, filter);
//     }

// }
// function selectItem(elemItem, filter) {      
    
//     let urn = elemItem.attr('data-urn');
//     let isSelected = elemItem.hasClass('selected');
    
//     if(elemItem.hasClass('leaf')) {

//         setStatusBar();

//         if(filter) {
//             viewer.setGhosting(false);
//             $('.leaf').hide();
//             $('.item-input').hide();
//             $('.operation').hide();
//             $('.item.filter').removeClass('filter');
//             elemItem.addClass('filter');
//         } else {
//             viewer.setGhosting(true);
//         }

//         $('.item').removeClass('selected');


//         $('.leaf').each(function() {
            
//             if($(this).attr('data-urn') === urn) {
//                 $(this).show();
//                 $(this).addClass('selected');
//                 unhideParent($(this).parent());
//             } else if($(this).attr('data-urn-bom') === urn) {
//                 console.log(' got item to show');
//                 $(this).show();
//                 $(this).addClass('selected');
//                 unhideParent($(this).parent());
//             }else if($(this).attr('data-urn-ebom') === urn) {
//                 console.log(' got item to show');
//                 $(this).show();
//                 $(this).addClass('selected');
//                 unhideParent($(this).parent());
//             }

//         });

//         if(!isSelected) {
//             viewerSelectModel(elemItem.attr('data-part-number'));
//             setItemDetails(urn);
//             setBOMPanels(urn);
//             $('#ebom').addClass('bom-panel-on');
//             $('#mbom').addClass('bom-panel-on');
//         }

//     }
    
// }
// function deselectItem(elemItem) {

//     $('.item').removeClass('selected');
//     $('.item').removeClass('filter');
//     $('.item').show();
//     $('.item-input').show();

//     $('#ebom').removeClass('bom-panel-on');
//     $('#mbom').removeClass('bom-panel-on');

//     resetViewerSelection();
//     hideBOMPanels();
//     setStatusBar();

// }
// function unhideParent(elemVisible) {
    
//     let parent = elemVisible.closest('.item');
    
//     if(parent.length > 0) {
//         parent.show();
// //        parent.closest('.item');
//         unhideParent(parent.parent());
//     }
    
// }
// function setItemDetails(urn) {

//     // move to plm.js

//     $('#details').find('.loading').show();

//     let elemSections = $('#sections')
//         elemSections.html('');

//     let temp = urn.split('.');

//     let params = {
//         'wsId'  : temp[4],
//         'dmsId' : temp[5]
//     }

//     $.get('/plm/details', params, function(data) {

//         $('#details').find('.loading').hide();

//         for(section of data.item.sections) {

//             let elemSection = $('<div></div>');
//                 elemSection.addClass('section');
//                 elemSection.html(section.title);
//                 elemSection.appendTo(elemSections);

//             for(field of section.fields) {

//                 if(!field.hasOwnProperty('formulaField')) {
//                     if(field.type.title !== 'URL') {

//                         let elemField = $('<div></div>');
//                             elemField.addClass('field');
//                             elemField.appendTo(elemSections);

//                         let elemFieldLabel = $('<div></div>');
//                             elemFieldLabel.addClass('field-label');
//                             elemFieldLabel.html(field.title);
//                             elemFieldLabel.appendTo(elemField);

//                         let elemFieldValue = $('<div></div>');
//                             elemFieldValue.addClass('field-value');
//                             elemFieldValue.appendTo(elemField); 

//                         if(field.type.title === 'Image') {
                            

//                             // "urn:adsk.plm:tenant.workspace.item.view.field:ADSKTSESVEND.79.14520.1.THUMBNAIL"

//                             // // let imageSRC = field.value.link;
//                             // let temp1 = field.urn.split(':');
//                             // let temp2 = temp1[3].split('.');
//                             // let tenant = temp2[0].toLowerCase();

//                             // let imageSRC = 'https://' + tenant + '.autodeskplm360.net' + field.value.link

//                             let elemFieldImage = $('<img>');
//                                 elemFieldImage.appendTo(elemFieldValue);


//                                 // console.log('  req.query.wsId    = ' + req.query.wsId);
//                                 // console.log('  req.query.dmsId   = ' + req.query.dmsId);
//                                 // console.log('  req.query.fieldId = ' + req.query.fieldId);
//                                 // console.log('  req.query.imageId = ' + req.query.imageId);


//                             // let paramsImage = {
//                             //     'wsId' : 
//                             // }

//                             let link = field.value.link.split('/');

//                             // "/api/v2/workspaces/79/items/14520/field-values/THUMBNAIL/image/1588"

//                             params.fieldId = link[8];
//                             params.imageId = link[10];

//                             $.get('/plm/image', params, function(data) {
//                                 // elemFieldImage.attr('src', image);
//                                 elemFieldImage.attr('src', 'data:image/png;base64,' + data);
//                             });


//                         } else {
//                             elemFieldValue.html(field.value);           
//                         }

//                     }
//                 }

//             }

//         }

//     });

// }


// // BOM Panels with total quantities
// function setBOMPanels(urn) {

//     $('.bom-panel').show();
//     $('.panel-toggle').removeClass('panel-off');

//     let qtyEBOM = 0;
//     let qtyMBOM = 0;

//     $('#ebom').find('.item').each(function() {
//         if($(this).attr('data-urn') === urn) {
//             qtyEBOM = Number($(this).attr('data-total-qty'));
//             $('#ebom-total-qty').html(qtyEBOM);
//         }
//     });

//     $('#mbom').find('.item').each(function() {
//         if($(this).attr('data-urn') === urn) {
//             // qtyMBOM += Number($(this).attr('data-instance-qty'));
//             qtyMBOM += Number($(this).find('.item-qty-input').val());
//         }
//     });

//     $('#mbom-total-qty').html(qtyMBOM + ' (' + (qtyMBOM-qtyEBOM) + ')');



// }
// function hideBOMPanels() {
//     $('.bom-panel').hide();
//     $('.panel-toggle').addClass('panel-off');
// }


// // Drag & Drop functions
// function setDraggable(elem) {
    
//     elem.draggable({ 
//         snap        : false,
//         containment : '#mbom',
//         scroll      : false,
//         helper      : 'clone'
//     });
    
// }
// function setDroppable(elem) {
    
//     elem.droppable({
    
//         classes: {
//             'ui-droppable-hover': 'drop-hover'
//         },
//         drop: function( event, ui ) {

//             itemDropped = $(this).find('.item-bom');
//             itemDragged = ui.draggable;
            
//             let prevBOM  = itemDragged.closest('.item-bom');
//             let prevItem = prevBOM.closest('.item');
//             let newItem  = itemDropped.closest('.item');
            
//             if(prevItem.attr('data-urn') !== newItem.attr('data-urn')) {

//                 let qty = $(ui.helper).find('.item-qty-input').val();
//                     qty = Number(qty);

//                 if(qty > 1) {

//                     $('#split-qty').val(qty);
//                     $('#total-qty').html(qty);
//                     $('#item-to-move').html(itemDragged.find('.item-title').html());
//                     showDialog();

//                 } else {
//                     addDraggedItemToBOM();
//                 }
                
//             }
            
//         }
//     });
    
// }
// function showDialog() {
    
//     $('#overlay').show();
//     $('#dialog').show();
    
// }
// function hideDialog() {
    
//     $('#overlay').hide();
//     $('#dialog').hide();
    
// }
// function moveDraggedItem() {
    
//     if(!$('#option-all').hasClass('selected')) {
   
//         let qtySplit = Number($('#split-qty').val());
//         let qtyTotal = Number($('#total-qty').html());
        
//         if(qtySplit !== qtyTotal) {
        
//             let qtyNew =  qtyTotal - qtySplit
        
//             itemDragged.find('.item-qty-input').val(qtyNew);
//             itemDragged.attr('data-instance-qty', qtyNew);
// //            itemDragged.attr('data-qty', qtyNew);
        
        
//             let itemClone = itemDragged.clone();
//     //            itemClone.appendTo(itemDropped);
//                 itemClone.attr('data-qty', qtySplit);
//                 itemClone.attr('data-instance-qty', qtySplit);
//                 itemClone.find('.item-qty-input').val(qtySplit);
//                 itemClone.css('position', 'relative').css('left', '').css('right', '').css('top', ''); 

//             let elemActions = itemClone.find('.item-actions');
            
//             insertMBOMActions(elemActions);
//             setDraggable(itemClone);
        
//             itemDragged = itemClone;
  
//         }
//     }
    
//     addDraggedItemToBOM();
//     setStatusBar();
    
// }
// function addDraggedItemToBOM() {
    
//     if(!itemExistsInBOM()) {
//         itemDragged.appendTo(itemDropped);
//         itemDragged.css('position', 'relative').css('left', '').css('right', '').css('top', '');       
//     }
    
// }
// function itemExistsInBOM() {
    
//     let exists = false;
    
//     itemDropped.children('.item').each(function() {
        
        
//         if(!exists) {
        
//         if($(this).attr('data-urn') === itemDragged.attr('data-urn')) {
            
            
//             console.log('existing item');
            
//             let qtyNew = $(this).attr('data-qty');
            
//             let qtyAdd  = itemDragged.attr('data-qty');
// //            let qtyNew  = elemQty.html();
            
// //            if(qtyAdd === '') qtyAdd = '0';
// //            if(qtyNew === '') qtyNew = '0';
            
//             qtyNew  = parseInt(qtyAdd) + parseInt(qtyNew);
            
// //            elemQty.html(qtyNew);
            
//             $(this).attr('data-qty', qtyNew);
//             $(this).find('.item-qty').html(qtyNew);
            
//             itemDragged.remove();
//             exists = true;
            
//             console.log('und weiter');
//         } 
//         } 
//     });
    
    
// //    console.log('new item');
    
//     return exists;
    
// }


// // Filtering by Status Bar
// function setStatusBarFilter(elemClicked) {
    
//     $('.item.leaf').show();
    
//     if(elemClicked.hasClass('selected')) {
        
//         $('.bar').removeClass('selected');
//         resetViewerSelection()
        
//     } else {

//         let dbIds = [];
        
//         $('.bar').removeClass('selected');
//         elemClicked.addClass('selected');
        
//         let selectedFilter = elemClicked.attr('data-filter');
        
//         $('.item.leaf').each(function() {
//             if(!$(this).hasClass('item-has-bom')) { 
//                 if(!$(this).hasClass(selectedFilter)) $(this).hide(); 
//                 else dbIds.push($(this).attr('data-part-number'));
//             }
//         });

//         viewerSelectModels(dbIds);
        
//     }
    
// }


// // Apply changes to database when clicking Save
// function showProcessing() {
//     $('#overlay').show();
//     $('#processing').show();
// }
// function hideProcessing() {
//     $('#overlay').hide();
//     $('#processing').hide();
// }
// function createNewItems() {
    
//     console.log(' createNewItems START');
//     console.log(' createNewItems .new.lenth : ' + $('.new').length);
    
//     if($('.new').length > 0) {
        
//         var elemFirst   =  $('.new').first();

//         let title =  elemFirst.find('.item-descriptor').html();

//         if(elemFirst.find('.item-descriptor').length === 0) title =  elemFirst.find('.item-title').html();

//         let params = { 
//             'wsId' : wsIdMBOM,
//             'sections' : [{
//                 'id' : sectionIdMBOM1,
//                 'fields' : [
//                     { 'fieldId' : 'TITLE', 'value' : title }
//                 ] 
//             },{
//                 'id' : sectionIdMBOM2,
//                 'fields' : [
//                     { 'fieldId' : 'OPERATION_CODE', 'value' : elemFirst.find('.item-code').html() },
//                     { 'fieldId' : 'IS_OPERATION', 'value' : elemFirst.hasClass('operation') }
//                 ]             
//             }]
//         };
        
//         $.post('/plm/create', params, function(link) {
            
//             let temp    = link.split('/');
//             let tenant = temp[2].split('.');
//             let urn     = 'urn:adsk.plm:tenant.workspace.item:' + tenant[0].toUpperCase() + '.' + wsIdMBOM + '.' + temp[temp.length - 1];
        
//             $.get('/plm/descriptor', {
//                 'wsId'  : wsIdMBOM,
//                 'dmsId' : temp[temp.length - 1]
//             }, function(descriptor) {

//                 let elemFirstHead = elemFirst.children().first();
                
//                 elemFirst.attr('data-urn', urn);
//                 elemFirstHead.find('.item-title').attr('data-urn', urn);
//                 elemFirstHead.find('.item-descriptor').html(descriptor);    
                
//                 if(elemFirstHead.find('.item-descriptor').length === 0) elemFirstHead.find('.item-title').html(descriptor);
                

//                 elemFirst.removeClass('new');

//                 createNewItems(); 

//             });
            
//         });        
        
//     } else { 
        
//         console.log(' createNewItems #mbom .item-bom.length : ' + $('#mbom .item-bom').children().length);
//         // console.log(' createNewItems .operation .item-bom.length : ' + $('.operation .item-bom').children().length);
        
// //        $('.edge').addClass('pending');
//         $('#mbom .item-bom').addClass('pending');
//         $('#mbom .item-bom').children().addClass('pending');
//         // $('.operation .item-bom').children().addClass('pending');
//         // $('.operation').addClass('pending');
//         console.log();
//         console.log(' createNewItems START DELETE OPERATIONS');
//         deleteBOMItems(); 
        
//     }
    
// }
// function deleteBOMItems() {
    
//     let elemBOM = $('#mbom .item-bom.pending').first();

//     if(elemBOM.length > 0) {

//         let elemParent  = elemBOM.parent();
//         let listEdges   = elemParent.attr('data-edges');

//         if(typeof listEdges !== 'undefined') {

//             let edges   = listEdges.split(',');
//             let remove  = '';
//             let index   = -1;
            
//             for(edge of edges) {
                
//                 if(remove === '') {
                    
//                     index++;

//                     let keep = false;

//                     elemBOM.children('.item').each(function()  {
//                         if($(this).attr('data-edge') === edge) {
//                             keep = true;
//                         } 
//                     });
                    
//                     if(!keep) {
//                         remove = edge;
//                     }
                    
//                 }
                
//             }
            
//             if(remove === '') {
                
//                 elemBOM.removeClass('pending');
//                 deleteBOMItems();    
                
//             } else {
                
//                 let paramsSplit = elemParent.attr('data-urn').split('.');
                
//                 let params = {
//                     'wsId'   : paramsSplit[paramsSplit.length - 2],
//                     'dmsId'  : paramsSplit[paramsSplit.length - 1],
//                     'edgeId' : remove
//                 }
                
//                 $.get('/plm/bom-remove', params, function() {
//                     edges.splice(index, 1);
//                     elemParent.attr('data-edges', edges.toString());
//                     deleteBOMItems();
//                 });
//             }

//         } else {
//             elemBOM.removeClass('pending');
//             deleteBOMItems();
//         }

//     } else {

//         console.log();
//         console.log(' deleteBOMItems : START ADDBOMROWS');
//         addBOMItems();

//     }

// }
// function addBOMItems() {       
        
//     if($('.item.pending').length > 0) {
//         addBOMItem($('.item.pending').first())        
//     } else {
//         setSyncDate();
//     }
    
// }
// function addBOMItem(elemItem) {
    
//     let isNew        = false;
//     let elemParent   = elemItem.parent().closest('.item');
//     let dataParent   = elemItem.attr('data-parent');
//     let urnParent    = elemParent.attr('data-urn');
//     let dbQty        = elemItem.attr('data-qty');
//     let edQty        = elemItem.find('.item-qty-input').first().val();
//     let dbNumber     = elemItem.attr('data-number-db');
//     let edNumber     = elemItem.attr('data-number');
//     let paramsChild  = elemItem.attr('data-urn').split('.');
//     let paramsParent = elemParent.attr('data-urn').split('.');
//     let urnMBOM      = elemItem.attr('data-urn-mbom');
        
//     if(typeof dataParent === 'undefined') {
//         isNew = true;
//     } else if(dataParent !== urnParent) {
//         isNew = true;
//     }
        
//     if(typeof urnMBOM !== 'undefined') paramsChild = elemItem.attr('data-urn-mbom').split('.');

//     let params = {
//         'wsIdParent'  : paramsParent[paramsParent.length - 2],
//         'wsIdChild'   : paramsChild[paramsChild.length - 2],
//         'dmsIdParent' : paramsParent[paramsParent.length - 1], 
//         'dmsIdChild'  : paramsChild[paramsChild.length - 1],
//         'qty'         : edQty,
//         'pinned'      : true
//     }

//     let reqUpdate = (edQty !== dbQty);
    
//     if(dbNumber !== edNumber) {
//         reqUpdate = true;
//         params.number = edNumber;
//     }

//     if(isNew) {

//         console.log(params);

//         $.get('/plm/bom-add', params, function(link) {
            
//             let location = link.split('/');
//             let edgeId   = location[location.length - 1];

//             console.log(' addBOMRows /add SUCCESS');
//             console.log(' addBOMRows /edgeId = ' + edgeId);

//             params.edgeId = edgeId;

//             elemItem.attr('data-edge', edgeId);
//             elemItem.attr('data-parent', urnParent);

//             console.log(elemParent);
            

//             $.get('/plm/bom-item', { 'link' : link }, function(data) {
             
//                 console.log(data);

//                 let itemNumber = data.itemNumber;

//                 if(typeof elemParent.attr('data-edges') === 'undefined') {
                    
//                     elemParent.attr('data-edges', edgeId);
                    
//                 } else {
                
//                     let edges = elemParent.attr('data-edges').split(',');
//                         edges.push(edgeId);

//                     elemParent.attr('data-edges', edges.toString());
                    
//                 }

//                 elemItem.removeClass('pending');
//                 elemItem.attr('data-number', itemNumber);
//                 elemItem.attr('data-number-db', itemNumber);
//                 addBOMItems();
//             });
            
//         });

//     } else if(reqUpdate) {

//         params.edgeId = elemItem.attr('data-edge');

//         $.get('/plm/bom-update', params, function() {
//             elemItem.removeClass('pending');
//             elemItem.attr('data-number-db', edNumber);
//             addBOMItems();
//         });

//     } else {
//         elemItem.removeClass('pending');
//         addBOMItems();
//     }
        
// }
// function setSyncDate() {
    
//     let timestamp = new Date();

//     let params = {
//         'wsId'      : wsIdMBOM,
//         'dmsId'     : dmsIdMBOM,
//         'sections' : [{
//             'id'     : sectionIdMBOM2,
//             'fields' : [
//                 { 'fieldId' : 'LAST_EBOM_SYNC', 'value' : timestamp.getFullYear()  + '-' + (timestamp.getMonth()+1) + '-' + timestamp.getDate() }
//             ]
//         }]
//     }

//     $.get('/plm/edit', params, function() {
//         hideProcessing(); 
//     });   
    
// }