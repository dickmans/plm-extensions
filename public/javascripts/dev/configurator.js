
let partNumbersOptions      = [];

let features = [];
let variants = [];
let wsConfig = { variants : {} };
let links    = {
    baseItem    : '',
    baseBOM     : '',
    variantItem : '',
    variantBOM  : ''
};


$(document).ready(function() {

    appendOverlay(true);

    setUIEvents();

    getFeatureSettings('configurator', [], function(responses) {   
        
        if(isBlank(dmsId)) {

            insertWorkspaceItems(config.configurator.workspaceBase.workspaceId, { 
                headerLabel         : config.configurator.workspaceBase.tilesTitle,
                size                : 'xl',
                fieldIdImage        : config.configurator.workspaceBase.tiles.image,
                fieldIdTitle        : config.configurator.workspaceBase.tiles.title,
                fieldIdSubtitle     : config.configurator.workspaceBase.tiles.subtitle,
                fieldIdsDetails     : config.configurator.workspaceBase.tiles.details,
                fieldIdsAttributes  :[config.configurator.workspaceBase.bomFieldId],
                sortBy              : config.configurator.workspaceBase.tiles.title,
                icon                : config.configurator.workspaceBase.tiles.icon
            });

        } else {

            openItem('/api/v3/workspaces/' + wsId + '/items/' + dmsId);

        }

    });

});



// User Interactions
function setUIEvents() {


    $('#save').click(function() {

        $('#overlay').show();

        $.get('/plm/details', { link : links.variantItem }, function(response) {

            console.log(links);
            console.log(response);

            links.variantBOM = getSectionFieldValue(response.data.sections, 'ENGINEERING_BOM', '', 'link');
            
            console.log(links);
            console.log(links.variantBOM);
            
            if(links.variantBOM === '') {

                let listFeatures = [];
                let listEdges    = [];
                

                for(let feature of features) {
                    listFeatures.push(feature.node);
                    listEdges.push(feature.edge);

                }
                console.log(listFeatures);

                cloneItems(listFeatures, ['bom'], ['NUMBER'], function(responses) {

                    console.log(responses);

                    for(let response of responses) {
                        for(let feature of features) {
                            if(response.params.link === feature.node) {
                                feature.clone = response.data.split('.autodeskplm360.net')[1];
                            }
                        }
                    }

                    console.log(features);

                    cloneItems([links.baseBOM], ['bom'], ['NUMBER'], function(responses) {
                      
                        let listItems    = [];

                        console.log(responses);
                        
                        links.variantBOM = responses[0].data.split('.autodeskplm360.net')[1];

                        setProductBOMLink();

                        console.log(links);

                        for(let feature of features) {
                            listItems.push(feature.clone);
                        }

                        console.log(listItems);

                        replaceBOMItems(links.variantBOM, listFeatures, listItems, function(response) {
                            console.log(response);

                            let reqNewBOMS = [];

                            for(let feature of features) {
                                reqNewBOMS.push($.get('/plm/bom', { link : feature.clone, depth : 1 }));
                            }
                            
                            Promise.all(reqNewBOMS).then(function(responses) {
                                console.log(responses);

                                let inactive = [];


                                $('#features-list').find('.tile').each(function() {

                                    if(!$(this).hasClass('active')) {
                                        inactive.push($(this).attr('data-link').split('/')[6]);
                                    }

                                });

                                console.log(inactive);

                                let reqRemoval = [];

                                for(let response of responses) {

                                    for(let edge of response.data.edges) {

                                        console.log(edge);

                                        let id = edge.child.split('.').pop();

                                        console.log(id);

                                        if(inactive.includes(id)) {


                                            console.log( edge.edgeLink);

                                            reqRemoval.push($.get('/plm/bom-remove', { edgeLink : edge.edgeLink }))
                                        }


                                    }

                                }

                                console.log(reqRemoval);


                                Promise.all(reqRemoval).then(function(responses) {
                                    $('#overlay').hide();

                                });


                            });


                        });

                        
                    });
                });

            }

        });
        // uploadImage();
        saveConfigurationFeatures();
    });

    $('#save-image').click(function() {
        uploadImage();
    });
    $('#save-views').click(function() {
        uploadImages();
    });

    $('#open-in-plm').click(function() {
        openItemByLink(links.variantItem);
    });

    $('#toggle-bom').click(function() {
        $('body').toggleClass('no-bom');
        $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
        viewerResize(250);
    });

    $('#toggle-details').click(function() {
        $('body').toggleClass('no-details');
        $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
        viewerResize(250);
    });

    $('#close').click(function() {
        $('body').removeClass('editor-mode');
    });

}



function openItem(link) {

    resetEditor();

    $.get('/plm/details', { link : link }, function(response) {

        links.baseProduct = getSectionFieldValue(response.data.sections, config.configurator.fieldIdVariantBaseProduct);
        links.variantBOM  = getSectionFieldValue(response.data.sections, config.configurator.fieldIdVariantBOM);

        $('#header-descriptor').html(response.data.title);

        $.get('/plm/details', { link : links.baseProduct }, function(response) {

            links.baseBOM = getSectionFieldValue(response.data.sections, config.configurator.workspaceBase.bomFieldId);

            openEditor();

        });



    });

    
}



// Open editor for selected base item
function clickWorkspaceItem(elemClicked, e) {

    $('#header-descriptor').html(elemClicked.attr('data-title'));

    links.baseItem = elemClicked.attr('data-link');
    links.baseBOM  = elemClicked.attr('data-' + config.configurator.workspaceBase.bomFieldId.toLowerCase());
    let baseTitle  = elemClicked.attr('data-title');

    elemClicked.siblings().removeClass('selected');
    elemClicked.toggleClass('selected');

    if(elemClicked.hasClass('selected')) $('body').removeClass('no-variants'); else $('body').addClass('no-variants');
    $('#header-descriptor').html(baseTitle);

    features = [];
    variants = [];

    insertVariants(baseTitle);

    insertBOM(links.baseBOM, {
        bomViewName : config.configurator.workspaceBase.bomView,
        collapsed   : true,
        hideDetails : true,
        selectItems : {
            fieldId : config.configurator.fieldIdConfigurationType,
            values : [
                config.configurator.configurationTypeValues.feature,
                config.configurator.configurationTypeValues.alternative,
                config.configurator.configurationTypeValues.option
            ]
        },
        selectUnique : false
        // additionalRequests : [ $.get('/plm/grid', { link : links.variantItem}) ]
    });

}
function insertVariants(title) {

    let filters = [{
        field       : 'PRODUCT_LINE',
        type        : 0,
        comparator  : 2,
        value       : title
    }];

    let params = {
        id              : 'variants',
        headerLabel     : 'Variants of ' + title,
        fields          : ['ENGINEERING_BOM', 'TITLE', 'DESCRIPTION'],
        layout          : 'tiles',
        // tileImage       : 'IMAGE',
        tileTitle       : 'NUMBER',
        tileSubtitle    : 'TITLE',
        tileDetails     : 'DESCRIPTION',
        contentSize     : 'xl',
        tableCounters   : false
    }

    insertResults(config.configurator.workspaceVariant.workspaceId, filters, params);

}
function insertResultsDone(id) {

    let elemComparison = $('#variants-comparison');

    if(elemComparison.length === 0) {
        elemComparison = $('<div></div>').appendTo($('#' + id))
            .attr('id', 'variants-comparison')
            .addClass('panel-content');
    }

    let elemButtonMaximize = $('#maximize-variants');

    if(elemButtonMaximize.length === 0) {
        elemButtonMaximize = $('<div></div>').prependTo($('#' + id + '-toolbar'))
            .addClass('button')
            .addClass('icon')
            .addClass('icon-maximize')
            .attr('title', 'Maximize / Minimize this panel')
            .click(function() {
                $(this).toggleClass('icon-maximize').toggleClass('icon-minimize')
                $('body').toggleClass('feature-comparison-max');
            });
    }

    let elemButtonToggle = $('#toggle-variants-features');

    if(elemButtonToggle.length === 0) {
        elemButtonToggle = $('<div></div>').prependTo($('#' + id + '-toolbar'))
            .addClass('button')
            .addClass('with-icon')
            .addClass('icon-toggle-off')
            .html('Compare Features')
            .click(function() {
                $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
                $('body').toggleClass('no-feature-comparison');
            });
    }

    let elemButtonNew = $('#new-variant');

    if(elemButtonNew.length === 0) {
        elemButtonNew = $('<div></div>').prependTo($('#' + id + '-toolbar'))
            .addClass('button')
            .addClass('default')
            .html('New Product')
            .click(function() {
                showCreateForm(config.configurator.workspaceVariant.workspaceId, {
                    headerLabel : 'Create New Variant',
                    sectionsIn : config.configurator.workspaceVariant.createSectionsIn,
                    fieldValues : [{
                        fieldId      : 'PRODUCT_LINE',
                        value        : links.baseItem,
                        displayValue : $('#header-subtitle').html()
                }]
                });
            });
    }

}
function insertResultsDataDone(id,data) {

    for(let variant of data[0].data.row) {
        variants.push({
            link : variant.link,
            title : variant.title
        })
    }

    insertVariantsComparison();

}
function submitCreateFormDone(id, link) {
    links.variantItem = link;
    $('#' + id).hide();
    $('#overlay').hide();
    openEditor();
}
function clickListItem(elemClicked) {
    links.variantItem = elemClicked.attr('data-link');
    openEditor();
}
 


// Display selected variant in edit mode
function openEditor() {

    resetEditor();

    insertDetails(links.variantItem, {
        collapsed : true,
        layout          : 'narrow',
        editable        : true,
        reload          : true,
        openInPLM       : false,
        sectionsEx      : ['Milestones & Checklists', 'Product Assessment', 'Product Marketing']
    });

    // insertBOM(links.baseBOM, {
    //     bomViewName : config.configurator.workspaceBase.bomView,
    //     hideDetails : true,
    //     selectItems : {
    //         fieldId : config.configurator.fieldIdConfigurationType,
    //         values : [
    //             config.configurator.configurationTypeValues.feature,
    //             config.configurator.configurationTypeValues.alternative,
    //             config.configurator.configurationTypeValues.option
    //         ]
    //     },
    //     selectUnique : false,
    //     additionalRequests : [ $.get('/plm/grid', { link : links.variantItem}) ]
    // });

    insertViewer(links.baseBOM);

    $.get('/plm/descriptor', { link : links.variantItem}, function(response) {
        $('#header-description').html(response.data);
    });
    $.get('/plm/sections', { link : links.variantItem}, function(response) {
        wsConfig.variants.sections = response.data;
    });

}
function resetEditor() {

    $('body').toggleClass('editor-mode');
    
    // $('#features-list').html('');

}
function insertDetailsDataDone(id, sections, fields, data) {

    console.log(data);

    links.variantBOM = getSectionFieldValue(data.sections, 'ENGINEERING_BOM', '', 'link');

    console.log(links);

}
function clickBOMItemDone(elemClicked, e) {

    let partNumber = elemClicked.attr('data-part-number');

    if(elemClicked.hasClass('selected')) {
        viewerSetColor(partNumber, { 
            color     : config.vectors.red,
            fitToView : true,
            unhide    : false
        });
    } else viewerResetColors();

}
function changeBOMViewDone(id, fields, bom, selectedItems, dataFlatBOM, dataAdditional) {

    let elemTop = $('#features-list')
    // let selectedOptions = [];
    let elemFeatureAlternatives;
    let elemFeatureOptions;

    elemTop.html('');

    // Get currently selected options from variant's grid
    // for(let row of dataAdditional[0].data) {
    //     for(let field of row.rowData) {
    //         let fieldId = field.__self__.split('/').pop();
    //         if(fieldId === 'OPTION') {
    //             if(!isBlank(field.value)) selectedOptions.push(field.value.link);
    //         }
    //     }
    // }

    for(let selectedItem of selectedItems) {

        if(selectedItem.edge.selectItems.toLowerCase() === config.configurator.configurationTypeValues.feature.toLowerCase()) {

            let linkFeature = selectedItem.node.item.link;
            let title = selectedItem.node.item.title;

            if(title.indexOf( '[' )) title = title.split( '[' )[0];
            if(title.indexOf(' - ')) title = title.split(' - ')[1];

            features.push({
                node         : selectedItem.node.item.link,
                edge         : selectedItem.edge.edgeId,
                item         : '',
                title        : title,
                options      : []
            });

            console.log(features);
            // console.log(features.length);
            // console.log(features[0].node);
            // console.log(features[0].title);

            
            $('.bom-item').each(function() {
                if($(this).attr('data-link') === linkFeature) {
                    $(this).addClass('feature');
                }
            });
                    
            let elemFeature = $('<div></div>').appendTo(elemTop)
                .attr('data-link', linkFeature)
                .addClass('feature-header')
                .addClass('with-icon')
                .addClass('icon-chevron-down')
                .click(function() {
                    elemFeature.next().toggle();
                    elemFeature.next().next().toggle();
                    $(this).toggleClass('icon-chevron-down').toggleClass('icon-chevron-right');
                });

            $('<div></div>').appendTo(elemFeature)
                .html(title)
                .addClass('feature-title');

            elemFeatureAlternatives = $('<div></div>').appendTo(elemTop)
                .addClass('feature-list-alternatives')
                .addClass('tiles')
                .addClass('list')
                .addClass('xs');

            elemFeatureOptions = $('<div></div>').appendTo(elemTop)
                .addClass('feature-list-options')
                .addClass('tiles')
                .addClass('list')
                .addClass('xs');

            // console.log(features);

        } else {

            let link        = selectedItem.node.item.link;
            let edgeLink    = selectedItem.edge.edgeLink;
            let title       = selectedItem.node.item.title.split(' - ');
            let className   = 'option';
            let elemOption;
            

            let feature = features[features.length - 1];

            // console.log(feature);

            feature.options.push({
                link     : link,
                title   : title,
                type    : selectedItem.edge.selectItems
            });

            if(selectedItem.edge.selectItems.toLowerCase() === config.configurator.configurationTypeValues.option.toLowerCase()) {


                elemOption = genTile(link, '', '', 'icon-check-box', title[0], title[1])
                    .appendTo(elemFeatureOptions)
                    .addClass('data-type-option');
                    // .click(function() {
                    //     $(this).toggleClass('selected');

                    //     if($(this).hasClass('selected')) {

                    //         viewerSelectModel($(this).attr('data-path'), {
                    //             usePath : true
                    //         });
                    //     } else {
                    //         viewerResetSelection({ fitToView : true });
                    //     }
                    // });

                // elemOption.find('.tile-image').click(function(e) {
                    
                    // e.preventDefault();
                    // e.stopPropagation();

                    // let elemTile = $(this).closest('.tile');

                    // elemTile.toggleClass('active');
            
                            // let pnHide = [];
                            // let elemTile = $(this).closest('.tile');
                            //     elemTile.toggleClass('active');
                            //     elemTile.siblings().each(function() {
                            //         let elemSibling = $(this);
                            //         pnHide.push(elemSibling.attr('data-title'));
                            //         elemSibling.removeClass('active');
                            //     });
                            

                    // if(elemTile.hasClass('active')) {

                    //     viewerUnhideModel(elemTile.attr('data-path'), { usePath : true, fitToView: false });
                    //     } else {
                    //     viewerHideModel(elemTile.attr('data-path'), { usePath : true, fitToView: false, ghosting : false });
                    // }

                            // viewerHideModels(pnHide);
                            // let elemPartNumberSelected = elemTile.attr('data-title');
            
                            //     console.log(elemPartNumberSelected);
            
                            // viewerUnhideModel(elemPartNumberSelected, {
                            //     fitToView : false
                            // });
            
            
            
                // });


                

            }  else if(selectedItem.node.selectItems.toLowerCase() === config.configurator.configurationTypeValues.alternative.toLowerCase()) {               

                elemOption = genTile(link, '', '', 'icon-radio-unchecked', title[0], title[1])
                    .appendTo(elemFeatureAlternatives)
                    .addClass('data-type-alternative');
                    // .click(function() {
                    //     viewerSelectModel($(this).attr('data-path'), {
                    //         usePath : true
                    //     });
                    // });

                // elemOption.find('.tile-image').click(function(e) {
                
                //     e.preventDefault();
                //     e.stopPropagation();

                //     let elemTile = $(this).closest('.tile');

                //     elemTile.toggleClass('active');
                //     elemTile.siblings().removeClass('active');
                // });


                // className = 'variant';

            }       
            
            
            // elemOption.find('.tile-image').click(function(e) {
            elemOption.click(function(e) {
                
                e.preventDefault();
                e.stopPropagation();

                $('.last').removeClass('last');

                let elemTile = $(this).closest('.tile');
                    elemTile.toggleClass('active');
                    elemTile.addClass('last');
                

                if(elemTile.hasClass('data-type-alternative')) {
                    elemTile.siblings().each(function() {
                        $(this).removeClass('active');
                        // viewerHideModel($(this).attr('data-path'), { usePath : true, fitToView: false, ghosting : false });
                    });
                }

                // if(elemTile.hasClass('active')) {
                //     updateViewer();
                //     // viewerUnhideModel(elemTile.attr('data-path'), { usePath : true, fitToView: false, ghosting : false });
                // } else {
                //     viewerHideModel(elemTile.attr('data-path'), { usePath : true, fitToView: false, ghosting : false });
                // }

                updateViewer();


            });


            $('.bom-item').each(function() {
                if($(this).attr('data-edge-link') === edgeLink) {
                    $(this).addClass(className);

                    // console.log(getBOMItemPath($(this)));

                    let bomPath = getBOMItemPath($(this)).string;

                    elemOption.attr('data-path', bomPath);

                    partNumbersOptions.push(bomPath);
                }
            });

            // if(selectedOptions.includes(link)) elemOption.click();

            // let elemOption = $('<div></div>').appendTo(elemFeatureOptions)
            //     .html(selectedItem.node.item.title);


            



            // elemOption.find('.tile-image').click(function(e) {
            //     e.preventDefault();
            //     e.stopPropagation();

            //     let pnHide = [];
            //     let elemTile = $(this).closest('.tile');
            //         elemTile.toggleClass('active');
            //         elemTile.siblings().each(function() {
            //             let elemSibling = $(this);
            //             pnHide.push(elemSibling.attr('data-title'));
            //             elemSibling.removeClass('active');
            //         });
                
            //     viewerHideModels(pnHide);
            //     let elemPartNumberSelected = elemTile.attr('data-title');

            //         console.log(elemPartNumberSelected);

            //     viewerUnhideModel(elemPartNumberSelected, {
            //         fitToView : false
            //     });



            // });

        }

    }

    insertVariantsComparison();

    onViewerLoadingDone();
    // viewerHideModels(partNumbersOptions);


}
function onViewerLoadingDone() {
    viewerHideModels(partNumbersOptions, {
        usePath  : true,
        ghosting : false
    });
    viewerResize(250);
}
function insertVariantsComparison() {
    
    if(features.length === 0) return;
    if(variants.length === 0) return;

    let requests = [];

    let elemTop = $('#variants-comparison');
        elemTop.html('');

    let elemTable = $('<table></table>').appendTo(elemTop);
    let elemTHead = $('<tbody></thead>').appendTo(elemTable);
    let elemTHRow = $('<tr></tr>').appendTo(elemTHead);
    let elemTBody = $('<tbody></tbody>').appendTo(elemTable);
    
    elemTable.addClass('fixed-header');
    elemTHRow.append($('<th style="background : none;"></th>'));

    for(let variant of variants) {
    
        let title = variant.title.split(' - ');

        let elemHead = $('<th></th>').appendTo(elemTHRow)
            .attr('data-link', variant.link)
            .addClass('variants-comparison-head')
            .click(function(){
                clickListItem($(this));
            });

        $('<div></div>').appendTo(elemHead)
            .html(title[0])
            .addClass('variants-comparison-title');
        
        $('<div></div>').appendTo(elemHead)
            .html(title[1])
            .addClass('variants-comparison-subtitle');

        requests.push($.get('/plm/grid', { link : variant.link}));

    }

    Promise.all(requests).then(function(responses) {

        console.log(responses);

        let index = 0;

        for(let response of responses) {

            variants[index++].grid = response.data;

        }

        console.log(variants);

        for(let feature of features) {

            let elemFeature = $('<tr></tr>').appendTo(elemTBody);

            $('<td></td>').appendTo(elemFeature)
                .attr('colspan', variants.length + 1)
                .addClass('variants-comparison-feature')
                .html(feature.title);

            for(let option of feature.options) {

                let elemOption = $('<tr></tr>').appendTo(elemTBody);

                $('<td></td>').appendTo(elemOption)
                    .html(option.title);


                for(let variant of variants) {
                    
                    let elemCell = $('<td></td>').appendTo(elemOption)
                        .addClass('variant-option');

                    let className = 'not-selected';

                    for(let row of variant.grid) {
                        for(let field of row.rowData) {
                            let fieldId = field.__self__.split('/').pop();
                            if(fieldId === 'OPTION') {
                                if(!isBlank(field.value)) {
                                    console.log(field.value.link + ' ||| '  + option.link);
                                    if(field.value.link === option.link) {
                                        className = 'selected'
                                        let elemIcon = $('<div></div>').appendTo(elemCell)
                                            .addClass('icon')
                                            .addClass('icon-check')
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    elemCell.addClass(className);

                }

            }
        }
    });

}


// When features get selected, update viewer to match selection
function updateViewer() {

    let pathsHighlight = [];
    // let pathsHidden    = [];
    let pathLast       = '';

    $('#features-list').find('.tile').each(function() {

        let elemTile = $(this);
        let dataPath = elemTile.attr('data-path');

        if(elemTile.hasClass('active')) {
            viewerUnhideModel(dataPath, { usePath : true, fitToView: false, ghosting : false });
            if(elemTile.hasClass('last')) {

                pathLast = dataPath;

                // viewerSetColor(config.vectors.yellow);
            } else {
                pathsHighlight.push(dataPath);

                // viewerSetColor(config.vectors.blue);
            }
        } else {
            viewerHideModel(dataPath, { usePath : true, fitToView: false, ghosting : false });
        }

    });

    // viewerResetColors();
    viewerSetColors(pathsHighlight, { resetColors: true, usePath : true, fitToView: false, unhide : false});

    if(pathLast !== '') viewerSetColor(pathLast, { resetColors : false, usePath : true, fitToView: false, unhide : false, color : config.vectors.yellow });

}


// Select existing configuration
function clickListItemDone(elemClicked, e) {

    let link    = elemClicked.attr('data-link');
    let options = [];

    // linkVariant = link;

    insertDetails(link);
    insertAttachments(link);

    $('#overlay').show();

    $.get('/plm/grid', { link : linkVariant }, function(response) {

        $('#overlay').hide();
        $('#features-list').find('.tile').removeClass('active');

        viewerResetColors();
        viewerHideModels(partNumbersOptions);

        for(let row of response.data) {

            let option = getGridRowValue(row, 'OPTION', '', 'link');
            options.push(option);

        }

        $('#features-list').find('.tile').each(function() {
            let link = $(this).attr('data-link');
            if(options.includes(link)) $(this).find('.icon').click();
        });

    });

}



// Post processing after creation of new configuration
function submitCreateFormDone22(id, link) {

    linkVariant = link;
    let requests      = [];

    console.log(link);

    $('#features-list').find('.tile.active').each(function() {

        let elemOption  = $(this) ;
        let elemFeature = elemOption.parent().prev('.feature-header');
        let linkFeature = elemFeature.attr('data-link');
        let linkOption  = elemOption.attr('data-link');

        requests.push($.post('/plm/add-grid-row', {
            link : linkVariant,
            'data' : [
                { fieldId : 'FEATURE', value : { link : linkFeature } },
                { fieldId : 'OPTION' , value : { link : linkOption  } }
            ]
        }));
    });

    Promise.all(requests).then(function(responses) {
        openItemByLink(link);
        console.log(responses);
        // setConfigurationsList();
        $('#overlay').hide();
        
    });

}


// Perform Save Operations
function saveConfigurationFeatures() {
    
    // $('#button-save-features').hide();

    if(links.variantItem === '') return;

    let configurationFeatures = [];

    $('#features-list').find('.tile.active').each(function() {

        let elemOption  = $(this) ;
        let elemFeature = elemOption.parent().prev();
        let linkFeature = elemFeature.attr('data-link');
        let linkOption  = elemOption.attr('data-link');

        configurationFeatures.push([
            { fieldId : 'FEATURE', value : { link : linkFeature } },
            { fieldId : 'OPTION' , value : { link : linkOption  } }
        ]);

    });

    updateGridData(links.variantItem, 'FEATURE', configurationFeatures, true, function() {
        // $('#overlay').hide();
    });

}
function setProductBOMLink() {


    let params = { 
        link     : links.variantItem,
        sections : []
    };

    addFieldToPayload(params.sections, wsConfig.variants.sections, null, 'ENGINEERING_BOM', { 'link' : links.variantBOM });

    console.log(params);

    $.post('/plm/edit', params, function(response) {
        console.log(response);
    });

}


// Upload viewer screenshot as image
function uploadImage() {

    let elemImage   = $('#viewer-markup-image');




    $('#overlay').show();


    viewerCaptureScreenshot('viewer-markup-image', function() {
    // viewerCapturePerspective('perspective', 'viewer-markup-image', function() {

        // values.push(elemImage[0].toDataURL('image/jpg'));
    
        let value = elemImage[0].toDataURL('image/jpg');

        let params = { 
            link     : links.variantItem,
            sections : []
        };

        addFieldToPayload(params.sections, wsConfig.variants.sections, null, 'IMAGE'  , value);

        $.post('/plm/edit', params, function(response) {
            $('#overlay').hide();
        });

    });

    // });

}
function uploadImages() {

    let elemImage   = $('#viewer-markup-image');
    let values      = [];

    $('#overlay').show();

    // viewerCapturePerspective('perspective', 'viewer-markup-image', function() {

        // values.push(elemImage[0].toDataURL('image/jpg'));

        viewerCapturePerspective('top', 'viewer-markup-image', function() {

            values.push(elemImage[0].toDataURL('image/jpg'));

            viewerCapturePerspective('bottom', 'viewer-markup-image', function() {

                values.push(elemImage[0].toDataURL('image/jpg'));

                viewerCapturePerspective('right', 'viewer-markup-image', function() {

                    values.push(elemImage[0].toDataURL('image/jpg'));
    
                    viewerCapturePerspective('left', 'viewer-markup-image', function() {
    
                        values.push(elemImage[0].toDataURL('image/jpg'));

                        let params = { 
                            link     : links.variantItem,
                            sections : []
                        };
                
                        // addFieldToPayload(params.sections, wsConfig.variants.sections, null, 'IMAGE'  , values[0]);
                        addFieldToPayload(params.sections, wsConfig.variants.sections, null, 'IMAGE_1', values[1]);
                        addFieldToPayload(params.sections, wsConfig.variants.sections, null, 'IMAGE_2', values[2]);
                        addFieldToPayload(params.sections, wsConfig.variants.sections, null, 'IMAGE_3', values[3]);
                        addFieldToPayload(params.sections, wsConfig.variants.sections, null, 'IMAGE_4', values[4]);
                
                        $.post('/plm/edit', params, function(response) {
                            $('#overlay').hide();
                        });
    
                     });
                });
            });
        });
    // });

}