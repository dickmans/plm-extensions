let maxRequests                 = 5;
let indexAlternatives           = 1;
let indexViewable               = 1;
let initialViewable;

let wsProducts = {
    'id'        : wsId,
    'sections'  : [],
    'fields'    : [],
    'columns'   : [],
    'tableaus'  : []   
}
let wsConfigurationFeatures = {
    'id'        : '',
    'sections'  : [],
    'fields'    : [],
    'columns'   : [],
    'tableaus'  : []
}

let fieldIsOption       = { 'fieldId' : 'SINGLE_OPTION', 'value' : 'true' }
let productFeatures     = [];
let productOptions      = [];
let inclusions          = [];
let exclusions          = [];
let viewables           = [];
let engineeringItems          = [];
let checkForViewables   = [];
let listOptionals       = [];
let listAlternatives    = [];



$(document).ready(function() {
    
    wsConfigurationFeatures.id = config.configurator.wsIdConfigurationFeatures;

    $('#product').attr('data-link', '/api/v3/workspaces/' + wsId + '/items/' + dmsId);

    appendProcessing('product', false);
    appendProcessing('features', false);
    appendProcessing('options', false);
    appendOverlay();

    getInitialData();
    setUIEvents();

});


function setUIEvents() {


    // Feature Editor
    $('#toggle-features').click(function() {
        openFeaturesEditor();
    });
    $('#create-feature').click(function() {
        openFeatureEditor();
    });
    $('#feature-option-insert').click(function() {
        insertNewFeatureOption();
    });
    $('#feature-editor-cancel').click(function() {
        closeFeatureEditor(false);
    });
    $('#feature-editor-done').click(function() {
        closeFeatureEditor(true);
    });


    // Add Option
    $('#option-insert').click(function() {
        insertNewOption();
    });


    // Rules Editor
    $('#toggle-rules').click(function() {
        openRulesEditor();
    });

    // BOM Assignment
    $('#toggle-bom').click(function() {
        openBOMAssignment();
        insertViewer($('#bom').attr('data-link'));
    });
    $('#navigator-apply').click(function() {
        applySelectedFeatures();
    });
    $('#navigator-reset').click(function() {
        resetSelectedFeatures();
    });


    // Main Toolbar
    $('#save').click(function() {
        save();
    });

}



// Get data to startup dialog
function getInitialData() {

    let promises = [
        $.get('/plm/details' , { 'wsId' : wsId, 'dmsId' : dmsId }),
        $.get('/plm/sections', { 'wsId' : wsId }),
        $.get('/plm/fields'  , { 'wsId' : wsId }),
        $.get('/plm/sections', { 'wsId' : wsConfigurationFeatures.id }),
    ];

    Promise.all(promises).then(function(responses) {
    
        $('#header-subtitle').html(responses[0].data.title);
        insertItemDetailsFields('product', '', responses[1].data, responses[2].data, responses[0].data, false, false, false);

        wsProducts.sections              = responses[1].data;
        wsConfigurationFeatures.sections = responses[3].data;

        let features    = getSectionFieldValue(responses[0].data.sections, config.configurator.fieldIdFeatures, []);
        let options     = getSectionFieldValue(responses[0].data.sections, config.configurator.fieldIdOptions , []);
        let valueEx     = getSectionFieldValue(responses[0].data.sections, config.configurator.fieldIdExclusions, '');
        let valueIn     = getSectionFieldValue(responses[0].data.sections, config.configurator.fieldIdInclusions, '');
        let bomRoot     = getSectionFieldValue(responses[0].data.sections, config.configurator.fieldIdBOM, '');

        exclusions = (valueEx === '') ? [] : JSON.parse(valueEx);
        inclusions = (valueIn === '') ? [] : JSON.parse(valueIn);

        if(bomRoot === '') {
            showErrorMessage('Related BOM could not be found');
        } else {
            insertBOM('bom', 'BOM', bomRoot, config.configurator.bomViewName, false, true, false);
        }

        setProductFeatures(features);
        setProductOptions(options);
    
    });
    
}
function setProductFeatures(features) {

    let requests = [];

    for(feature of features) {
        requests.push($.get('/plm/details', { 'link' : feature.link }));
        requests.push($.get('/plm/grid'   , { 'link' : feature.link }));
    }

    Promise.all(requests).then(function(responses) {

        $('#features-processing').hide();

        for(let index = 0; index < responses.length; index+=2) {

            let response    = responses[index];
            let options     = responses[index+1];
            let className   = (response.data.currentState.title === config.configurator.stateFeatureApproved) ? 'approved' : 'draft';
            let id          = getSectionFieldValue(response.data.sections, 'ID', '');
            let title       = getSectionFieldValue(response.data.sections, 'TITLE', '');
            let description = getSectionFieldValue(response.data.sections, 'DESCRIPTION', '');
            let elemFeature = insertFeature(id, title, description, className);
            let elemOptions = elemFeature.find('.feature-options');

            elemFeature.attr('data-link', response.params.link);

            for(row of options.data) {

                let optionId          = getGridRowValue(row, 'ID', '');
                let optionTitle       = getGridRowValue(row, 'TITLE', '');
                let optionDescription = getGridRowValue(row, 'DESCRIPTION', '');

                insertFeatureOption(elemOptions ,optionId, optionTitle, optionDescription);
            }

        }

    });

}
function setProductOptions(options) {

    let requests = [];

    for(option of options) requests.push($.get('/plm/details', { 'link' : option.link }));

    Promise.all(requests).then(function(responses) {

        $('#options-processing').hide();
        $('#options-add').show();

        for(response of responses) {

            let className   = (response.data.currentState.title === config.configurator.stateFeatureApproved) ? 'approved' : 'draft';
            let id          = getSectionFieldValue(response.data.sections, 'ID', '');
            let title       = getSectionFieldValue(response.data.sections, 'TITLE', '');
            let description = getSectionFieldValue(response.data.sections, 'DESCRIPTION', '');
            let elemOption  = insertOption(className, id, title, description);

            elemOption.attr('data-link', response.params.link);

        }

    });

}


// Feature Management
function openFeaturesEditor() {
    
    $('body').addClass('mode-features');
    $('body').removeClass('mode-rules');
    $('body').removeClass('mode-bom');

    // $('#features').show();
    // $('#divider-features').show();
    // $('#options').show();
    // $('#rules').hide();
    // $('#bom').hide();

    $('#toggle-features').addClass('selected');
    $('#toggle-rules').removeClass('selected');
    $('#toggle-bom').removeClass('selected');

}
function openFeatureEditor() {

    $('#overlay').show();
    $('#feature-editor').show();

}
function insertFeature(id, title, description, className) {

    if(typeof className === 'undefined') className = 'draft';

    let elemFeature = $('<div></div>');
        elemFeature.addClass('feature');
        elemFeature.addClass(className);
        elemFeature.appendTo($('#features-list'));

    let elemFeatureDetails = $('<div></div>');
        elemFeatureDetails.addClass('feature-details');
        elemFeatureDetails.appendTo(elemFeature);

    let elemFeatureId = $('<div></div>');
        elemFeatureId.addClass('feature-id');
        elemFeatureId.html(id);
        elemFeatureId.appendTo(elemFeatureDetails);      

    let elemFeatureTitle = $('<div></div>');
        elemFeatureTitle.addClass('feature-title');
        elemFeatureTitle.html(title);
        elemFeatureTitle.appendTo(elemFeatureDetails);        

    let elemFeatureDescription = $('<div></div>');
        elemFeatureDescription.addClass('feature-description');
        elemFeatureDescription.html(description);
        elemFeatureDescription.appendTo(elemFeatureDetails);  
        
    let elemFeatureOptions = $('<div></div>');
        elemFeatureOptions.addClass('feature-options');
        elemFeatureOptions.appendTo(elemFeature);

    return elemFeature;

}
function insertNewFeatureOption() {

    insertFeatureOption($('#feature-options-list'), $('#feature-option-id').val(), $('#feature-option-title').val(), $('#feature-option-description').val());
    $('#feature-option-id').val('');
    $('#feature-option-title').val('');
    $('#feature-option-description').val('');

}
function insertFeatureOption(elemParent, id, title, description) {

    let elemOption = $('<div></div>');
        elemOption.addClass('feature-option');
        
        elemOption.appendTo(elemParent);

    let elemOptionName = $('<div></div>');
        elemOptionName.addClass('feature-option-name');
        elemOptionName.appendTo(elemOption); 

    let elemOptionId = $('<div></div>');
        elemOptionId.addClass('feature-option-id');
        elemOptionId.addClass('key');
        elemOptionId.html(id);
        elemOptionId.appendTo(elemOptionName);      

    let elemOptionTitle = $('<div></div>');
        elemOptionTitle.addClass('feature-option-title');
        elemOptionTitle.html(title);
        elemOptionTitle.appendTo(elemOptionName);        

    let elemOptionDescription = $('<div></div>');
        elemOptionDescription.addClass('feature-option-description');
        elemOptionDescription.html(description);
        elemOptionDescription.appendTo(elemOption);    

    return elemOption;


}
function closeFeatureEditor(update) {

    $('#overlay').hide();
    $('#feature-editor').hide();

    if(update) {

        let elemFeature = insertFeature($('#feature-id').val(), $('#feature-title').val(), $('#feature-description').val());
        let elemFeatureOptions = elemFeature.find('.feature-options');

        $('#feature-options-list').children('.feature-option').each(function() {
            $(this).appendTo(elemFeatureOptions);
        });

    }

}


// Options Management
function insertNewOption() {

    insertOption('draft', $('#option-id').val(), $('#option-title').val(), $('#option-description').val());
    $('#option-id').val('');
    $('#option-title').val('');
    $('#option-description').val('');

}
function insertOption(className, id, title, description) {

    let elemOption = $('<div></div>');
        elemOption.addClass('option');
        elemOption.addClass(className);
        elemOption.appendTo($('#options-list'));

    let elemOptionName = $('<div></div>');
        elemOptionName.addClass('option-name');
        elemOptionName.appendTo(elemOption);       

    let elemOptionId = $('<div></div>');
        elemOptionId.addClass('option-id');
        elemOptionId.addClass('key');
        elemOptionId.html(id);
        elemOptionId.appendTo(elemOptionName);      

    let elemOptionTitle = $('<div></div>');
        elemOptionTitle.addClass('option-title');
        elemOptionTitle.html(title);
        elemOptionTitle.appendTo(elemOptionName);        

    let elemOptionDescription = $('<div></div>');
        elemOptionDescription.addClass('option-description');
        elemOptionDescription.html(description);
        elemOptionDescription.appendTo(elemOption);    
        
    return elemOption;

}


// Rules Editor
function openRulesEditor() {
    
    $('body').removeClass('mode-features');
    $('body').addClass('mode-rules');
    $('body').removeClass('mode-bom');

    // $('#features').hide();
    // $('#divider-features').hide();
    // $('#options').hide();
    // $('#rules').show();
    // $('#bom').hide();

    $('#toggle-features').removeClass('selected');
    $('#toggle-rules').addClass('selected');
    $('#toggle-bom').removeClass('selected');

    setRulesTable();

}
function setRulesTable() {

    let elemTable = $('#rules-table');
        elemTable.html('');

    let elemTHead = $('<thead></thead>');
        elemTHead.appendTo(elemTable);

    let elemTHeadRow = $('<tr></tr>');
        elemTHeadRow.attr('id', 'thead-row');
        elemTHeadRow.appendTo(elemTHead);
        elemTHeadRow.append($('<th colspan="2" id="thead-cell"></th>'));
        
    let elemTBody = $('<tbody></tbody>');
        elemTBody.attr('id', 'tbody');
        elemTBody.appendTo(elemTable);

    $('#features-list').children().each(function() {

        let feature         = $(this).find('.feature-details').first().clone();
        let featureOptions  = $(this).find('.feature-options');

        featureOptions.children().each(function() {

            let elemRow = $('<tr></tr>');
                elemRow.appendTo(elemTBody);

            if($(this).index() === 0) {

                let elemRowFeature = $('<td></td>');
                    elemRowFeature.appendTo(elemRow);
                    elemRowFeature.append(feature);
                    elemRowFeature.addClass('rowspan');
                    elemRowFeature.attr('rowspan', featureOptions.children().length);
                    elemRowFeature.click(function() {
                        setRulesTableColumns($(this));
                    });

            }

            let elemRowFeatureOption = $('<td></td>');
                elemRowFeatureOption.appendTo(elemRow);
                elemRowFeatureOption.append($(this).clone());

        });

    });

    let elemRowOptions;

    $('#options-list').children().each(function() {

        let elemRow = $('<tr></tr>');
            elemRow.appendTo(elemTBody);

        if($(this).index() === 0) {

            elemRowOptions = $('<td></td>');
            elemRowOptions.appendTo(elemRow);
            elemRowOptions.append(config.configurator.labelSingleOptions);
            elemRowOptions.addClass('rowspan');
            elemRowOptions.css('font-weight', 'bold');
            elemRowOptions.css('padding', '12px');
            elemRowOptions.attr('rowspan', $('#options-list').children().length);
            elemRowOptions.click(function() {
                setRulesTableColumns($(this));
            });

        }

        let elemRowOption = $('<td></td>');
            elemRowOption.appendTo(elemRow);
            elemRowOption.append($(this).clone());

    });

    elemRowOptions.click();

}
function setRulesTableColumns(elemClicked) {

    let elemTHeadCell   = $('#thead-cell');
    let elemTHeadRow    = $('#thead-row');
    let elemTBody       = $('#tbody');

    $('th.dynamic').remove();
    $('td.rule').remove();

    if(typeof elemClicked === 'undefined') elemClicked = elemTBody.children().last().children().first();

    elemTHeadCell.html(elemClicked.html());

    let count = Number(elemClicked.attr('rowspan'));
    let elemRow = elemClicked.parent();

    for(let index = 0; index < count; index++) {

        let elemCol = elemRow.children().first().children().first().clone();

        if(index === 0) elemCol = elemRow.children().first().next().children().first().clone();

        let keyCol  = elemCol.find('.key').html();

        let elemHeader = $('<th></th>');
            elemHeader.appendTo(elemTHeadRow);
            elemHeader.append(elemCol);
            elemHeader.addClass('dynamic');

        elemTBody.children().each(function() {

            let keyRow = $(this).find('.key').html();

            let elemCell = $('<td></td>');
                elemCell.appendTo($(this));
                elemCell.addClass('rule');
                elemCell.attr('data-elem-row', keyRow);
                elemCell.attr('data-elem-col', keyCol);

            let elemToggles = $('<div></div>');
                elemToggles.addClass('rule-toggles');
                elemToggles.appendTo(elemCell);

            let elemToggleExcluded = $('<div></div>');
                elemToggleExcluded.addClass('xxs');
                elemToggleExcluded.addClass('icon');
                elemToggleExcluded.addClass('icon-block');
                elemToggleExcluded.appendTo(elemToggles);
                elemToggleExcluded.click(function() {
                    setRule($(this), 'excluded');
                });

            let elemToggleStandard = $('<div></div>');
                elemToggleStandard.addClass('xxs');
                elemToggleStandard.addClass('icon');
                elemToggleStandard.addClass('icon-check');
                elemToggleStandard.appendTo(elemToggles);
                elemToggleStandard.click(function() {
                    setRule($(this), 'standard');
                });

            let elemToggleIncluded = $('<div></div>');
                elemToggleIncluded.addClass('xxs');
                elemToggleIncluded.addClass('icon');
                elemToggleIncluded.addClass('icon-link');
                elemToggleIncluded.appendTo(elemToggles);
                elemToggleIncluded.click(function() {
                    setRule($(this), 'included');
                });

            setRuleClass(elemCell, keyRow, keyCol);

        });

        elemRow = elemRow.next();

    }

}
function setRule(elemClicked, rule) {

    let elemParent = elemClicked.closest('td');
        elemParent.removeClass('excluded');
        elemParent.removeClass('standard');
        elemParent.removeClass('included');
        elemParent.addClass(rule);

    inclusions = [];
    exclusions = [];

    $('.rule.excluded').each(function() {
        exclusions.push([$(this).attr('data-elem-row'), $(this).attr('data-elem-col')]);
    });
    $('.rule.included').each(function() {
        inclusions.push([$(this).attr('data-elem-row'), $(this).attr('data-elem-col')]);
    });

}
function setRuleClass(elemCell, keyRow, keyCol) {

    let className = 'standard';

    if(keyRow === keyCol) {
        elemCell.addClass('cross');
        elemCell.html('');
        return;
    }

    for(exclusion of exclusions) {
        if(exclusion[0] === keyRow) {
            if(exclusion[1] === keyCol) {
                className = 'excluded';
            }
        }
        if(exclusion[1] === keyRow) {
            if(exclusion[0] === keyCol) {
                className = 'excluded';
            }
        }
    }
    for(inclusion of inclusions) {
        if(inclusion[0] === keyRow) {
            if(inclusion[1] === keyCol) {
                className = 'included';
            }
        }
        if(inclusion[1] === keyRow) {
            if(inclusion[0] === keyCol) {
                className = 'included';
            }
        }
    }

    elemCell.addClass(className);

}



// Product Data Assignment
function openBOMAssignment() {
    
    $('body').removeClass('mode-features');
    $('body').removeClass('mode-rules');
    $('body').addClass('mode-bom');

    $('#toggle-features').removeClass('selected');
    $('#toggle-rules').removeClass('selected');
    $('#toggle-bom').addClass('selected');

    let elemTableHead = $('#navigator-table-head');
        elemTableHead.html('');

    let elemTableBody = $('#navigator-table-body');
        elemTableBody.html('');

    $('#features-list').children().each(function() {

        let elemTableRowFeatures = $('<tr></tr>');
            elemTableRowFeatures.addClass('category');
            elemTableRowFeatures.appendTo(elemTableBody);
        
        let elemCategoryFeatures = $('<td></td>');        
            elemCategoryFeatures.html($(this).find('.feature-title').html());
            elemCategoryFeatures.appendTo(elemTableRowFeatures);
            elemCategoryFeatures.addClass('sticky');

        $(this).find('.feature-options').children().each(function() {

            let elemTableRow = $('<tr></tr>');
                elemTableRow.addClass('category-feature');
                elemTableRow.attr('data-id', $(this).find('.feature-option-id').html());
                elemTableRow.appendTo(elemTableBody);
                elemTableRow.click(function(e) {
                    selectNavigatorOption($(this));
                });

            let elemOption = $('<td></td>');
                elemOption.addClass('navigator-feature');
                elemOption.addClass('sticky');
                elemOption.addClass('with-icon');
                elemOption.html($(this).find('.feature-option-title').html());
                elemOption.appendTo(elemTableRow);

        });

    });

    let elemTableRow = $('<tr></tr>');
        elemTableRow.addClass('category');
        elemTableRow.appendTo(elemTableBody);
        
    let elemCategory = $('<td></td>');
        elemCategory.html(config.configurator.labelSingleOptions);
        elemCategory.appendTo(elemTableRow);
        elemCategory.addClass('sticky');
        
    $('#options-list').children().each(function() {

        let elemTableRow = $('<tr></tr>');
            elemTableRow.appendTo(elemTableBody);
            elemTableRow.addClass('category-option');
            elemTableRow.attr('data-id', $(this).find('.option-id').html());
            elemTableRow.click(function(e) {
                selectNavigatorOption($(this));
            });

        let elemOption = $('<td></td>');
            elemOption.addClass('navigator-feature');
            elemOption.addClass('sticky');
            elemOption.addClass('with-icon');
            elemOption.html($(this).find('.option-title').html());
            elemOption.appendTo(elemTableRow);

    });

    insertModuleVariantOptions();
    insertOptionals();

}
function setBOMDisplay(id) {

    // override standard setBOMDisplay of ui.js

    $('#' + id + '-processing').show();

    let elemRoot = $('#' + id + '-table');
        elemRoot.html('');

    let link = $('#' + id).attr('data-link').split('/')

    let params = {
        'wsId'          : link[4],
        'dmsId'         : link[6],
        'depth'         : 10,
        'revisionBias'  : 'release',
        'viewId'        : $('#' + id + '-view-selector').val()
    }

    let promises = [ 
        $.get('/plm/bom-view-fields', params),
        $.get('/plm/bom', params),
        $.get('/plm/bom-flat', params)
    ];

    Promise.all(promises).then(function(responses) {

        urnsBOMFields = [];

        for(field of responses[0].data) {
            switch(field.fieldId) {
                case 'PART_NUMBER'  : urnsBOMFields.partNumber  = field.__self__.urn; break;
                case 'VIEWABLE'     : urnsBOMFields.viewable    = field.__self__.urn; break;
                case config.configurator.fieldIdBOMType : urnsBOMFields.itemType    = field.__self__.urn; break;
                case 'OFFSET_X'     : urnsBOMFields.offsetX     = field.__self__.urn; break;
                case 'OFFSET_Y'     : urnsBOMFields.offsetY     = field.__self__.urn; break;
                case 'OFFSET_Z'     : urnsBOMFields.offsetZ     = field.__self__.urn; break;
                case 'ANGLE_X'      : urnsBOMFields.angleX      = field.__self__.urn; break;
                case 'ANGLE_Y'      : urnsBOMFields.angleY      = field.__self__.urn; break;
                case 'ANGLE_Z'      : urnsBOMFields.angleZ      = field.__self__.urn; break;
            }
        }

        $('#' + id + '-processing').hide();

        // if ($('#bom').hasClass('basic')) {

            insertNextBOMLevel(responses[1].data, elemRoot, responses[1].data.root);

        // } else {
    
        //     insertHeader();
        // }
    
        $('.bom-tree-nav').click(function(e) {
    
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
    
        elemRoot.children().click(function(e) {
            selectBOMItem(e, $(this));
        });

        bomDisplayDone();

    });

}
function insertNextBOMLevel(bom, elemRoot, parent) {

    // override standard insertNextBOMLevel of ui.js

    let result = false;

    for(edge of bom.edges) {

        if(edge.parent === parent) {

            result = true;

            // let partNumber  = getBOMCellValue(edge.child, urnsBOMFields.partNumber, bom.nodes);
            // let partNumber  = getBOMEdgeValue(edge, urnsBOMFields.partNumber);
            let viewable    = getBOMEdgeValue(edge, urnsBOMFields.viewable);
            let offsetX     = getBOMEdgeValue(edge, urnsBOMFields.offsetX, null, 0);
            let offsetY     = getBOMEdgeValue(edge, urnsBOMFields.offsetY, null, 0);
            let offsetZ     = getBOMEdgeValue(edge, urnsBOMFields.offsetZ, null, 0);
            let angleX      = getBOMEdgeValue(edge, urnsBOMFields.angleX, null, 0);
            let angleY      = getBOMEdgeValue(edge, urnsBOMFields.angleY, null, 0);
            let angleZ      = getBOMEdgeValue(edge, urnsBOMFields.angleZ, null, 0);
            let itemType    = getBOMEdgeValue(edge, urnsBOMFields.itemType, 'title', '');
            let title       = getBOMItemTitle(edge.child, bom.nodes);
            let link        = '';
            let wsIdParent  = parent.split('.')[4];
            let wsIdChild   = edge.child.split('.')[4];
            let partNumber  = title.split(' - ')[0];

            let elemRow = $('<tr></tr>');
                elemRow.attr('data-number', edge.itemNumber);
                elemRow.attr('data-part-number', partNumber);
                elemRow.attr('data-item-type', itemType);
                elemRow.attr('data-viewable', viewable);
                elemRow.attr('data-qty', '1');
                elemRow.appendTo(elemRoot);
     
            for(node of bom.nodes) {
                if(node.item.urn === edge.child) {
                    elemRow.attr('data-dmsId',      node.item.link.split('/')[6]);
                    elemRow.attr('data-link',       node.item.link);
                    elemRow.attr('data-edgeId',     edge.edgeId);
                    elemRow.attr('data-edgeLink',   edge.edgeLink);
                    elemRow.attr('data-level',      edge.depth);
                    elemRow.addClass('bom-level-' + edge.depth);
                    link = node.item.link;
                }
            }

            let elemCell = $('<td></td>');
                elemCell.appendTo(elemRow);

            let elemCellNumber = $('<span></span>');
                elemCellNumber.addClass('bom-tree-number');
                elemCellNumber.html(edge.depth + '.' + edge.itemNumber);
                elemCellNumber.appendTo(elemCell);

            let elemCellTitle = $('<span></span>');
                elemCellTitle.addClass('bom-tree-title');
                elemCellTitle.html(title);
                elemCellTitle.appendTo(elemCell);


            let elemCellActions = $('<td></td>');
                elemCellActions.appendTo(elemRow);

            // let elemCellQuantity = $('<span></span>');
            // elemCellQuantity.addClass('bom-tree-title');
            // elemCellQuantity.html(getBOMItem(edge.child, bom.nodes));
            //     elemCellelemCellQuantityTitle.appendTo(elemCell);


            // if(elemRow.prev().attr('data-item-type') === 'Modul') {

            // } else {

            // let hasChildren = (itemType === 'Modul') ? inserVariants(bom, elemRoot, edge.child) : insertNextBOMLevel(bom, elemRoot, edge.child);
            let hasChildren = false;
            
            
            indexAlternatives++;

            if(itemType === config.configurator.valueAlternatives) {

                elemRow.addClass('alternatives');
                let moduleVariants = inserVariants(bom, elemRoot, edge.child);
                hasChildren = (moduleVariants.length > 0);
                listAlternatives.push({
                    'title'   : title,
                    'link'    : link,
                    'options' : moduleVariants
                });

            } else {

                if(wsIdParent !== config.configurator.wsIdEningeeringItems) {
                    if(wsIdChild === config.configurator.wsIdEningeeringItems) checkForViewables.push({
                        'link'      : link, 
                        'title'     : title, 
                        'variant'   : (itemType === 'Optional'),
                        'offsetX'   : offsetX,
                        'offsetY'   : offsetY,
                        'offsetZ'   : offsetZ,
                        'angleX'    : angleX,
                        'angleY'    : angleY,
                        'angleZ'    : angleZ,
                    });
                }

                if(itemType === config.configurator.valueOptional) {
                    
                    elemRow.addClass('optional');
                    elemRow.addClass('invisible');
                    elemRow.addClass('variant');

                    let elemCellActionHide = $('<div>Unload</div>');
                        elemCellActionHide.addClass('button');
                        elemCellActionHide.addClass('action-unload');
                        elemCellActionHide.appendTo(elemCellActions);
                        elemCellActionHide.click(function() {
                            unloadItem($(this).closest('tr'));
                        });
        
                    let elemCellActionUnhide = $('<div>Load</div>');
                        elemCellActionUnhide.addClass('button');
                        elemCellActionUnhide.addClass('action-load');
                        elemCellActionUnhide.appendTo(elemCellActions);
                        elemCellActionUnhide.click(function() {
                            loadItem($(this).closest('tr'));
                    });

                    listOptionals.push({
                        'title'   : title,
                        'link'    : link
                    });

                } else {

                    hasChildren = insertNextBOMLevel(bom, elemRoot, edge.child);

                }

            }

            elemRow.children().first().each(function() {
                
                $(this).addClass('bom-first-col');

                if(hasChildren) {

                    let elemNav = $('<span></span>');
                        elemNav.addClass('bom-tree-nav');
                        elemNav.addClass('icon');
                        elemNav.addClass('expanded');
                        elemNav.prependTo($(this));

                    elemRow.addClass('node');

                }

                let elemColor = $('<span></span>');
                    elemColor.addClass('bom-tree-color');
                    elemColor.prependTo($(this));

            });

        }

    }

    return result;

}
function inserVariants(bom, elemRoot, parent) {

    // let result = false;
    let moduleVariants = [];

    for(edge of bom.edges) {

        if(edge.parent === parent) {

            result = true;

            // let partNumber  = getBOMEdgeValue(edge, urnsBOMFields.partNumber);
            let viewable    = getBOMEdgeValue(edge, urnsBOMFields.viewable);
            let offsetX        = getBOMEdgeValue(edge, urnsBOMFields.offsetX, null, 0);
            let offsetY        = getBOMEdgeValue(edge, urnsBOMFields.offsetY, null, 0);
            let offsetZ        = getBOMEdgeValue(edge, urnsBOMFields.offsetZ, null, 0);
            let angleX        = getBOMEdgeValue(edge, urnsBOMFields.angleX, null, 0);
            let angleY        = getBOMEdgeValue(edge, urnsBOMFields.angleY, null, 0);
            let angleZ        = getBOMEdgeValue(edge, urnsBOMFields.angleZ, null, 0);
            let itemType    = getBOMCellValue(edge.child, urnsBOMFields.itemType, bom.nodes, 'title');
            let link        = '';
            let title       = getBOMItemTitle(edge.child, bom.nodes);
            let wsIdParent  = parent.split('.')[4];
            let wsIdChild   = edge.child.split('.')[4];
            let partNumber = title.split(' - ')[0];

            let elemRow = $('<tr></tr>');
                elemRow.attr('data-number', edge.itemNumber);
                elemRow.attr('data-part-number', partNumber);
                elemRow.attr('data-item-type', itemType);
                elemRow.attr('data-viewable', viewable);
                elemRow.attr('data-qty', '1');
                elemRow.addClass('variant');
                elemRow.addClass('invisible');
                elemRow.addClass('module-' + indexAlternatives);
                elemRow.attr('module-id', indexAlternatives);
                elemRow.appendTo(elemRoot);
    
            for(node of bom.nodes) {
                if(node.item.urn === edge.child) {
                    elemRow.attr('data-dmsId',      node.item.link.split('/')[6]);
                    elemRow.attr('data-link',       node.item.link);
                    elemRow.attr('data-edgeId',     edge.edgeId);
                    elemRow.attr('data-edgeLink',   edge.edgeLink);
                    elemRow.attr('data-level',      edge.depth);
                    elemRow.addClass('bom-level-' + edge.depth);
                    link = node.item.link;
                }
            }

            if(wsIdParent !== config.configurator.wsIdEningeeringItems) {
                if(wsIdChild === config.configurator.wsIdEningeeringItems) checkForViewables.push({
                    'link'      : link, 
                    'title'     : title, 
                    'variant'   : true,
                    'offsetX'   : offsetX,
                    'offsetY'   : offsetY,
                    'offsetZ'   : offsetZ,
                    'angleX'    : angleX,
                    'angleY'    : angleY,
                    'angleZ'    : angleZ,
                });
            }

            moduleVariants.push({
                'title' : title,
                'link'  : link
            });

            let elemCell = $('<td></td>');
                elemCell.appendTo(elemRow);

            let elemColor = $('<span></span>');
                elemColor.addClass('bom-tree-color');
                elemColor.prependTo(elemCell);

            let elemCellNumber = $('<span></span>');
                elemCellNumber.addClass('bom-tree-number');
                elemCellNumber.html(edge.depth + '.' + edge.itemNumber);
                elemCellNumber.appendTo(elemCell);

            let elemCellTitle = $('<span></span>');
                elemCellTitle.addClass('bom-tree-title');
                elemCellTitle.html(title);
                elemCellTitle.appendTo(elemCell);

            let elemCellActions = $('<td></td>');
                elemCellActions.appendTo(elemRow);

            elemRow.addClass('has-viewable');

            let elemCellActionLoad = $('<div>Load</div>');
                elemCellActionLoad.addClass('button');
                elemCellActionLoad.addClass('action-load');
                elemCellActionLoad.appendTo(elemCellActions);
                elemCellActionLoad.click(function() {
                    loadItem($(this).closest('tr'));
                });

            let elemCellActionUnload = $('<div>Unload</div>');
                elemCellActionUnload.addClass('button');
                elemCellActionUnload.addClass('action-unload');
                elemCellActionUnload.appendTo(elemCellActions);
                elemCellActionUnload.click(function() {
                    unloadItem($(this).closest('tr'));
                });

            // let elemCellQuantity = $('<span></span>');
            // elemCellQuantity.addClass('bom-tree-title');
            // elemCellQuantity.html(getBOMItem(edge.child, bom.nodes));
            //     elemCellelemCellQuantityTitle.appendTo(elemCell);

            // let hasChildren = insertNextBOMLevel(bom, elemRoot, edge.child);

            elemRow.children().first().each(function() {
                
                $(this).addClass('bom-first-col');

            //     if(hasChildren) {

            //         let elemNav = $('<span></span>');
            //             elemNav.addClass('bom-tree-nav');
            //             elemNav.addClass('material-symbols-sharp');
            //             elemNav.addClass('expanded');
            //             elemNav.prependTo($(this));

            //         elemRow.addClass('node');

            //     }

            //     let elemColor = $('<span></span>');
            //         elemColor.addClass('bom-tree-color');
            //         elemColor.prependTo($(this));

            });

        }

    }

    return moduleVariants;

}
function bomDisplayDone() {

    insertModuleVariantOptions();
    insertOptionals();

    $('#bom-table').children().each(function() {

        let viewable = $(this).attr('data-viewable');
        
        if(typeof viewable !== 'undefined') {
            if(viewable !== '') {
                if(!$(this).hasClass('variant')) {
                    viewables.push(viewable);
                    $(this).addClass('visible');
                    // if(linkInitialViewable === '') linkInitialViewable = $(this).attr('data-link');
                }
            }
        }
        
    });

    if(checkForViewables.length === 0) {

        insertViewer($('#bom').attr('data-link'));

    } else {

        for(viewable of checkForViewables) {
            let wsIdViewable = viewable.link.split('.')[4];
            if(wsIdViewable !== config.configurator.wsIdEningeeringItems) engineeringItems.push(viewable);
        }
    
        addViewables();

    }

}
function insertModuleVariantOptions() {

    let elemTableHead = $('#navigator-table-head');
        elemTableHead.html('');

    let elemTableBody = $('#navigator-table-body');

    let elemTableHeadRow = $('<tr></tr>');
        elemTableHeadRow.appendTo(elemTableHead);
        elemTableHeadRow.html('<th class="top-left"></th>');

    for(module of listAlternatives) {

        let titleMain = module.title.split(' - ')[0];
        let titleSub  = module.title.split(' [REV')[0];
            titleSub  = titleSub.substring(titleMain.length + 3);

        let elemTableHeadCell = $('<th></th>');
            elemTableHeadCell.html(titleMain + '</br>' + titleSub);
            elemTableHeadCell.appendTo(elemTableHeadRow);

        let elemCell = $('<td></td>');
            elemCell.click(function(e) { e.stopPropagation; e.preventDefault; })

        let elemSelect = $('<select></select>');
            elemSelect.addClass('feature-selector');
            elemSelect.appendTo(elemCell);
            elemSelect.append($('<option></option>'));

        for(option of module.options) {

            let elemOption = $('<option></option>');
                elemOption.html(option.title);
                elemOption.attr('value', option.link);
                elemOption.appendTo(elemSelect);

        }

        elemTableBody.children('.category').each(function() {
            $(this).append($('<td></td>'));
        });
        elemTableBody.children('.category-feature').each(function() {
            $(this).append(elemCell.clone());
        });
        elemTableBody.children('.category-option').each(function() {
            $(this).append(elemCell.clone());
        });

    }

}
function insertOptionals() {

    let elemTableBody     = $('#navigator-table-body');
    let elemTableHeadRow  = $('#navigator-table-head').children().first();
    let elemTableHeadCell = $('<th></th>');
        elemTableHeadCell.html('Optional Components');
        elemTableHeadCell.appendTo(elemTableHeadRow);

    let elemCell = $('<td></td>');
        elemCell.click(function(e) { e.stopPropagation; e.preventDefault; })

    let elemSelect = $('<select></select>');
        elemSelect.addClass('feature-selector');
        elemSelect.appendTo(elemCell);
        elemSelect.append($('<option></option>'));

    for(option of listOptionals) {

        let elemOption = $('<option></option>');
            elemOption.html(option.title);
            elemOption.attr('value', option.link);
            elemOption.appendTo(elemSelect);

    }

    elemTableBody.children('.category').each(function() {
        $(this).append($('<td></td>'));
    });
    elemTableBody.children('.category-feature').each(function() {
        $(this).append(elemCell.clone());
    });
    elemTableBody.children('.category-option').each(function() {
        $(this).append(elemCell.clone());
    });

}
function addViewables() {

    if(engineeringItems.length > 0) {

        let requests = [];
        let limit    = (engineeringItems.length > maxRequests) ? maxRequests : engineeringItems.length;

        for(let i = 0; i < limit; i++) {
            requests.push($.get('/plm/get-viewables', engineeringItems[i]));
        }

        Promise.all(requests).then(function(responses) {

            for(let i = 0; i < responses.length; i++) {
                
                let response = responses[i];

                if(response.data.length > 0) {
                    viewables.push({ 
                        'link'      : response.params.link, 
                        'urn'       : response.data[0].urn, 
                        'variant'   : response.params.variant,
                        'offsetX'   : response.params.offsetX,
                        'offsetY'   : response.params.offsetY,
                        'offsetZ'   : response.params.offsetZ,
                        'angleX'    : response.params.angleX,
                        'angleY'    : response.params.angleY,
                        'angleZ'    : response.params.angleZ
                    });

                    if(typeof initialViewable === 'undefined') {
                    if(response.params.variant === 'false') {
                            initialViewable = response.data[0];
                            initViewer(initialViewable, 255);
                        }
                    }

                }
            
            }
            engineeringItems.splice(0, limit);
            addViewables();

        });

    }

}
function selectNavigatorOption(elemClicked) {

    elemClicked.toggleClass('selected');

    $('tr.conflict').removeClass('conflict');

    if(elemClicked.hasClass('category-feature')) {
        elemClicked.prevUntil('.category').removeClass('selected');
        elemClicked.nextUntil('.category').removeClass('selected');
    }

    for(exclusion of exclusions) {

        let elemFeature1 = getFeatureByID(exclusion[0]);
        let elemFeature2 = getFeatureByID(exclusion[1]);

        if(elemFeature1 !== null) {
            if(elemFeature2 !== null) {
                if(elemFeature1.hasClass('selected')) {
                    if(elemFeature2.hasClass('selected')) {
                        elemFeature1.addClass('conflict');
                        elemFeature2.addClass('conflict');
                    }
                }
            }
        }

        

    }

    // if(elemClicked.hasClass('icon-radio-checked')) { elemClicked.removeClass('icon-radio-checked').addClass('icon-radio-unchecked'); }
    // else if(elemClicked.hasClass('icon-radio-unchecked')) { elemClicked.addClass('icon-radio-checked').removeClass('icon-radio-unchecked'); }
    // else if(elemClicked.hasClass('icon-box-checked')) { elemClicked.removeClass('icon-box-checked').addClass('icon-box-unchecked'); }
    // else if(elemClicked.hasClass('icon-box-unchecked')) { elemClicked.addClass('icon-box-checked').removeClass('icon-box-unchecked'); }

}
function getFeatureByID(id) {

    let result;

    $('#navigator-table-body').children().each(function() {
        if($(this).attr('data-id') === id){
            result = $(this);
        } 
    });

    return result;

}



// Apply selected features to update BOM and view
function applySelectedFeatures() {

    let listSelected = [];

    $('.category-feature.selected').each(function() {

        $(this).find('.feature-selector').each(function() {
            
            listSelected.push($(this).val());

        });

    });

    $('.category-option.selected').each(function() {

        $(this).find('.feature-selector').each(function() {
            
            listSelected.push($(this).val());

        });

    });

    $('.variant').each(function() {

        let linkVariant = $(this).attr('data-link');

        if(listSelected.indexOf(linkVariant) >= 0) {

            if($(this).hasClass('invisible')) {
                $(this).find('.button.action-load').click();
            };

        } else if($(this).hasClass('visible')) {
            $(this).find('.button.action-unload').click();
        }

    });

}
function resetSelectedFeatures() {

    $('#navigator-table-body').find('tr.selected').removeClass('selected');
    applySelectedFeatures();
    $('#button-reset-selection').click();

}



// BOM interactions (item selection and buttons to load/unload a design)
function selectBOMItem(e, elemClicked) {

    let partNumber = elemClicked.attr('data-part-number');

    // viewerSelectModel(partNumber, false);
    viewerSelectModelNew(partNumber, false);

}
function loadItem(elemClicked) {

    let moduleId    = elemClicked.attr('module-id');
    let link        = elemClicked.attr('data-link');

    if(moduleId !== null) {

        $('.visible.module-' + moduleId).each(function() {

            $(this).removeClass('visible').addClass('invisible');
            let linkModuleVariant = $(this).attr('data-link');

            for(viewable of viewables) {
                if(viewable.link === linkModuleVariant) {
                    viewerUnloadModel(viewable.urn);
                }
            }

        });

    }

    elemClicked.addClass('visible');
    elemClicked.removeClass('invisible');

    for(viewable of viewables) {
        if(viewable.link === link) {
            viewerAddModel(viewable);
        }
    }

}
function unloadItem(elemClicked) {

    elemClicked.removeClass('visible');
    elemClicked.addClass('invisible');

    let link = elemClicked.attr('data-link');

    for(viewable of viewables) {
        if(viewable.link === link) {
            viewerUnloadModel(viewable.urn);
            viewerResetSelection();
        }
    }

}



// APS Viewer
function initViewerDone() {

    viewerAddGhostingToggle(true);
    viewerAddResetButton();

    
    // load base geometry to viewer (= all Vault items having viewable and not being Optional/Alternative)
    if(indexViewable < viewables.length) {

        let list = [];

        for(let i = 1; i < viewables.length; i++) {
            if(viewables[i].variant === 'false') {
                if(initialViewable.urn !== viewables[i].urn) {
                    list.push(viewables[i]);
                }
            }
        }

        viewerAddModels(list);

    }   

}



// Save data to PLM
function save() {

    $('#overlay').show();

    $('#features-list').children().each(function() {
        if((typeof $(this).attr('data-link') === 'undefined') || ($(this).attr('data-link') === '')) $(this).addClass('pending-creation') ;
        else $(this).addClass('pending-update') ;
    });

    $('#options-list').children().each(function() {
        if((typeof $(this).attr('data-link') === 'undefined') || ($(this).attr('data-link') === '')) $(this).addClass('pending-creation') ;
        else $(this).addClass('pending-update') ;
    });

    productFeatures = [];
    productOptions  = [];

    console.log(' >> Start creation of new features');

    createNewFeatures();

}
function createNewFeatures() {

    let pending = $('.feature.pending-creation').length;

    if(pending > 0) {
        
        let requests = [];
        let elements = [];

        $('.feature.pending-creation').each(function() {

            if(requests.length < maxRequests) {

                let elemFeature = $(this);
                let id          = elemFeature.find('.feature-id').html();
                let title       = elemFeature.find('.feature-title').html();
                let description = elemFeature.find('.feature-description').html();
                
                let params = {
                    'wsId' : wsConfigurationFeatures.id,
                    'sections' : [{
                        'link' : wsConfigurationFeatures.sections[0].__self__,
                        'fields' : [
                            { 'fieldId' : 'ID', 'value' : id },
                            { 'fieldId' : 'TITLE', 'value' : title },
                            { 'fieldId' : 'DESCRIPTION', 'value' : description }
                        ]        
                    }]
                };

                requests.push($.post('/plm/create', params));
                elements.push(elemFeature);

            }

        });

        Promise.all(requests).then(function(responses) {

            requests  = [];
            let index = 0;

            for(response of responses) {

                let link = response.data.split('.autodeskplm360.net')[1];

                let elemItem = elements[index++];
                    elemItem.attr('data-link', link);
                    elemItem.removeClass('pending-creation');
                    elemItem.addClass('pending-options-creation');

            }

            createNewFeatures(); 

        });
     
    } else { 
        
        console.log(' >> Start creation of new feature options');
        createNewFeatureOptions();
        
    }

}
function createNewFeatureOptions() {

    let pending = $('.feature.pending-options-creation').length;

    if(pending > 0) {
        
        let requests    = [];
        let elemFeature = $('.feature.pending-options-creation').first();
        let sort        = 1;

        elemFeature.find('.feature-option').each(function() {
              
            let id          = $(this).find('.feature-option-id').html();
            let title       = $(this).find('.feature-option-title').html();
            let description = $(this).find('.feature-option-description').html();

            let params = {
                'wsId' : wsConfigurationFeatures.id,
                'link' : elemFeature.attr('data-link'),
                'data' : [
                    { 'fieldId' : 'SORT', 'value' : sort++ },
                    { 'fieldId' : 'ID', 'value' : id },
                    { 'fieldId' : 'TITLE', 'value' : title },
                    { 'fieldId' : 'DESCRIPTION', 'value' : description }
                ]
            }

            requests.push($.get('/plm/add-grid-row', params));
            elemFeature.removeClass('pending-options-creation');

        });

        Promise.all(requests).then(function(responses) {

            createNewFeatureOptions(); 

        });
     
    } else { 
        
        console.log(' >> Start creation of new options');
        createNewOptions();
        
    }

}
function createNewOptions() {

    let pending = $('.pending-creation').length;

    if(pending > 0) {
        
        let requests = [];
        let elements = [];

        $('.pending-creation').each(function() {

            if(requests.length < maxRequests) {

                let elemOption  = $(this);
                let id          = elemOption.find('.option-id').html();
                let title       = elemOption.find('.option-title').html();
                let description = elemOption.find('.option-description').html();
                
                let params = {
                    'wsId' : wsConfigurationFeatures.id,
                    'sections' : [{
                        'link' : wsConfigurationFeatures.sections[0].__self__,
                        'fields' : [
                            { 'fieldId' : 'ID', 'value' : id },
                            { 'fieldId' : 'TITLE', 'value' : title },
                            { 'fieldId' : 'DESCRIPTION', 'value' : description },
                            fieldIsOption
                        ]       
                    }]
                };

                requests.push($.post('/plm/create', params));
                elements.push(elemOption);

            }

        });

        Promise.all(requests).then(function(responses) {

            requests = [];

            for(response of responses) {
                requests.push($.get('/plm/descriptor', {
                    'link' : response.data.split('.autodeskplm360.net')[1]
                }));
            }

            Promise.all(requests).then(function(responses) {

                let index = 0;

                for(response of responses) {

                    let elemItem = elements[index++];
                        elemItem.attr('data-link', response.params.link);
                        elemItem.removeClass('pending-creation');



                    

                    // let elemHead = elemItem.children().first();
                    //     elemHead.find('.item-descriptor').html(response.data);    
                    
                    // if(elemHead.find('.item-descriptor').length === 0) elemHead.find('.item-title').html(response.data);

                }

                createNewOptions(); 

            });

        });
     
    } else { 

        console.log(' >> Start update of options');
        updateProduct();
        
    }

}
function updateOptions() {

    let pending = $('.pending-update').length;

    if(pending > 0) {

        let requests = [];
        let elements = [];

        $('.pending-update').each(function() {

            // if(requests.length < maxRequests) {

            //     let elemOption  = $(this);
            //     let id          = elemOption.find('.option-id').html();
            //     let title       = elemOption.find('.option-title').html();
                
            //     // if(elemItem.find('.item-descriptor').length === 0) title = elemItem.find('.item-title').html();


            //     console.log(wsConfigurationFeatures);

            //     let params = {
            //         'wsId' : wsConfigurationFeatures.id,
            //         'sections' : [{
            //             'link' : wsConfigurationFeatures.sections[0].__self__,
            //             'fields' : [
            //                 { 'fieldId' : 'ID', 'value' : id },
            //                 { 'fieldId' : 'TITLE', 'value' : title },
            //                 fieldIsOption
            //             ] 
            //         // },{
            //         //     'id' : sectionIdMBOM,
            //         //     'fields' : [
            //         //         { 'fieldId' : 'OPERATION_CODE', 'value' : elemItem.find('.item-code').html() }
            //         //         // { 'fieldId' : 'IS_OPERATION'  , 'value' : elemItem.hasClass('operation')     }
            //         //     ]             
            //         }]
            //     };

            //     console.log(params);

            //     // params.sections[1].fields.push(fieldTypeProcess);
            //     requests.push($.post('/plm/create', params));
            //     elements.push(elemOption);

            // }


            productOptions.push($(this).attr('data-link'));

        });



    } else {

        updateProduct();

    }

}
function updateProduct() {

    console.log(' >> Updating product');

    $('#features-list').children().each(function() {
        productFeatures.push($(this).attr('data-link'));
    })

    $('#options-list').children().each(function() {
        productOptions.push($(this).attr('data-link'));
    })

    let params = {
        'wsId'       : wsProducts.id,
        'dmsId'      : dmsId,
        'sections'   : [{
            'id'     : getFieldSectionId(wsProducts.sections, config.configurator.fieldIdFeatures),
            'fields' : []
        }]
    }

    if(productFeatures.length > 0) params.sections[0].fields.push({
        'fieldId' : config.configurator.fieldIdFeatures, 'value' : productFeatures, 'type' : 'multi-linking-picklist'
    });
    if(productOptions.length > 0) params.sections[0].fields.push({
        'fieldId' : config.configurator.fieldIdOptions, 'value' : productOptions, 'type' : 'multi-linking-picklist'
    });

    params.sections[0].fields.push({'fieldId' : config.configurator.fieldIdExclusions, 'value' : JSON.stringify(exclusions)});
    params.sections[0].fields.push({'fieldId' : config.configurator.fieldIdInclusions, 'value' : JSON.stringify(inclusions)});

    $.get('/plm/edit', params, function(response) {
        $('#overlay').hide();
    });   

}