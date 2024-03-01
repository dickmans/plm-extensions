let rules       = { 'features' : [], 'configurations' : [] };
let wsProducts  = { 'sections' : [] };


let testData = {"features":[{"link":"/api/v3/workspaces/307/items/15863","paths":[]},{"link":"/api/v3/workspaces/307/items/15871","paths":[]},{"link":"/api/v3/workspaces/307/items/15862","paths":[]},{"link":"/api/v3/workspaces/307/items/15867","paths":["CAD_30000000|test1","CAD_30000000|test2"]},{"link":"/api/v3/workspaces/307/items/15864","paths":[]},{"link":"/api/v3/workspaces/307/items/15870","paths":["CAD_30000000|CAD_30000045:1|CAD_30000047:3","CAD_30000000|CAD_30000000|CAD_30000045:1|CAD_30000046:1"]},{"link":"/api/v3/workspaces/307/items/15872","paths":["CAD_30000000|CAD_30000205:1"]}],"configurations":[{"name":"alle einser","features":["/api/v3/workspaces/307/items/15867","/api/v3/workspaces/307/items/15862","/api/v3/workspaces/307/items/15870"]},{"name":"3er","features":["/api/v3/workspaces/307/items/15870","/api/v3/workspaces/307/items/15871","/api/v3/workspaces/307/items/15872"]},{"name":"ddd","features":["/api/v3/workspaces/307/items/15867","/api/v3/workspaces/307/items/15868","/api/v3/workspaces/307/items/15862","/api/v3/workspaces/307/items/15864"]},{"name":"Basis","features":["/api/v3/workspaces/307/items/15862","/api/v3/workspaces/307/items/15870"]}]}


$(document).ready(function() {

    setUIEvents();
    appendOverlay();

    if($('body').hasClass('standalone')) {
        // $('#bom').insertAfter($('.tabs'));
        // $('#tab-bom').addClass('selected');
    }

    insertWorkspaceItems('95', {
        'id'                : 'products', 
        'title'             : 'Grundrissaufbauten', 
        'classNames'        : ['wide', 's'], 
        'fieldIdImage'      : 'IMAGE', 
        'fieldIdTitle'      : 'TITLE', 
        'fieldIdSubtitle'   : 'DESCRIPTION', 
        'fieldIdsAttributes' : ['ENGINEERING_BOM', 'MANUFACTURING_BOM', 'MODULES', 'FEATURES_OPTIONS']
    });   

    if(dmsId !== '') {

        $('#products').hide();
        $('#overlay').show();

        $.get('/plm/details', { 'link' : '/api/v3/workspaces/95/items/' + dmsId}, function(response) {
            
            let title               = response.data.title;
            let link                = response.params.link;
            let linkEBOM            = getSectionFieldValue(response.data.sections, 'ENGINEERING_BOM', '', 'link');
            let linkMBOM            = getSectionFieldValue(response.data.sections, 'MANUFACTURING_BOM', '', 'link');
            let linkModules         = getSectionFieldValue(response.data.sections, 'MODULES', '', 'link');
            let linkFeaturesOptions = getSectionFieldValue(response.data.sections, 'FEATURE_OPTIONS', '', 'link');

            openProduct(title, link, linkEBOM, linkMBOM, linkModules, linkFeaturesOptions);

            $('#overlay').hide();
        });

    }

});


function setUIEvents() {

    $('#close').click(function() {
        $('#products').show();
        $('#details').hide();
        $('#viewer').hide();
        $('#header-toggle-ebom').hide();
        $('.screen').addClass('surface-level-1');
        $('.screen').removeClass('surface-level-2');

        viewerUnloadAllModels();

    });

    $('#context').click(function() {
        $(this).toggleClass('selected');
    });

    $('#save-configuration').click(function() {
        let configuration = {
            'name' : $('#input-configuration').val(),
            'features': []
        }
        $('#features-tbody').children('.selected').each(function() {
            configuration.features.push($(this).attr('data-link'));
        });
        rules.configurations.push(configuration);
        $('#input-configuration').val('');
        $('#select-configuration').append('<option value="' + configuration.name + '">' + configuration.name + '</option>');
        $('#select-configuration').val(configuration.name);
        $('.configuration-action').show();
        saveRules();
    });
    $('#select-configuration').change(function() {
        let name = $('#select-configuration').val();
        let features = [];
        for(let configuration of rules.configurations) {
            if(configuration.name === name) {
                features = configuration.features;
            }
        }
        $('#features-tbody').children('.leaf').each(function() {
            $(this).removeClass('selected');
            for(let feature of features) {
                if(feature === $(this).attr('data-link')) {
                    $(this).addClass('selected');
                // } else {
                    // $(this).removeClass('selected');
                }
            }
        });
        $('.configuration-action').show();

        if(name === '') $('.configuration-action').hide();
        
    });
    $('#update-configuration').click(function() {
        let name  = $('#select-configuration').val();
        let index = -1;
        for(let configuration of rules.configurations) {
            if(configuration.name === name) {
                configuration.features = [];
                $('#features-tbody').children('.leaf').each(function() {
                    if($(this).hasClass('selected')) {
                        configuration.features.push($(this).attr('data-link'));
                    }
                });
            }
        }
        saveRules();
        
    });    
    $('#delete-configuration').click(function() {
        let name  = $('#select-configuration').val();
        let index = -1;

        for(let i = 0; i < rules.configurations.length; i++) {
            if(rules.configurations[i].name === name) {
                index = i;
            }
        }
        if(index > -1) {
            rules.configurations.splice(index, 1);
        }
        $('#select-configuration').children().each(function() {
            if($(this).attr('value') === name) $(this).remove();
        });
        $('#select-configuration').val('');
        $('.configuration-action').hide();

        saveRules();
        
    });

    $('#modules-open').click(function() {
        openItemByLink($('#bom-modules').attr('data-link'));
    }); 

    $('#header-toggle-ebom').click(function() {
        $('body').toggleClass('fixed-ebom');
        $('#bom-title').toggle();
        if($('body').hasClass('fixed-ebom')) { 
            $('#bom').insertAfter($('.tabs')); 
            $('#tab-bom').click();
        }
        else { $('#bom').appendTo($('.tab-group-main').first()); }
        viewerResize();
    })


}


// Add tile actions
function insertWorkspaceItemsDone(id) {

    // if(!$('body').hasClass('standalone')) return;

    $('#' + id + '-content').children().each(function() {

        $('<div></div>').appendTo($(this))
            .addClass('button')
            .addClass('icon')
            .addClass('icon-open')
            .addClass('tile-action')
            .click(function(e) {
                e.preventDefault;
                e.stopPropagation();
                let elemTile = $(this).closest('.tile');
                window.open(document.location.href + '&dmsId=' + elemTile.attr('data-link').split('/')[6]);
            });

    });

}


// Click on product to open its BOM and configuration management
function clickWorkspaceItem(e, elemClicked) {

    let title               = elemClicked.attr('data-title');
    let link                = elemClicked.attr('data-link');
    let linkEBOM            = elemClicked.attr('data-engineering_bom');
    let linkMBOM            = elemClicked.attr('data-manufacturing_bom');
    let linkModules         = elemClicked.attr('data-modules');
    let linkFeaturesOptions = elemClicked.attr('data-features_options');

    openProduct(title, link, linkEBOM, linkMBOM, linkModules, linkFeaturesOptions);

}

function openProduct(title, link, linkEBOM, linkMBOM, linkModules, linkFeaturesOptions) {

    $('#products').hide();
    $('#details').show();
    $('#modules').html('');
    $('#details').attr('data-link', link);
    $('#details').attr('data-link-bom', linkEBOM);
    $('#details').attr('data-part-number', '');
    $('#details').find('.panel-title').html(title);
    $('.screen').removeClass('surface-level-1');
    $('.screen').addClass('surface-level-2');
    $('#select-configuration').children().remove();
    $('#select-configuration').append('<option></option>');
    $('.configuration-action').hide();

    if($('body').hasClass('standalone')) {
        // $('#tab-bom').click();
        $('#header-toggle-ebom').css('display', 'flex');
        // console.log($('#tab-bom').length);
        $('#header-subtitle').html(title).show();
    } else {
        $('.tabs').children().first().click();
    }

    let titleEBOM = $('body').hasClass('standalone') ? 'EBOM' : '';


    getContextPartNumber(linkEBOM);
    getProductConfigurationRules(link, linkFeaturesOptions);
    insertBOM(linkEBOM, {
        'title'       : titleEBOM,
        'bomViewName' : 'Konfigurationsmanagement',
        'multiSelect' : true
    });
    insertBOM(linkMBOM, {
        'id'          : 'mbom',
        'title'       : '',
        'multiSelect' : true
    });
    insertBOM(linkModules, {
        'id'          : 'bom-modules',
        'bomViewName' : 'Konfigurationsmanagement'
    });

    if(typeof chrome.webview === 'undefined') {
        $('#viewer').show();
        insertViewer(linkEBOM, viewerBGColors[theme].level2);
    } 

}
function getContextPartNumber(linkEBOM) {

    $.get('/plm/details' , { 'link' : linkEBOM }, function(response) {

        let partNumber = getSectionFieldValue(response.data.sections, 'NUMBER', '');
        $('#details').attr('data-part-number', partNumber);

    });

}
function getProductConfigurationRules(link, linkFeatures) {

    let requests = [
        $.get('/plm/details' , { 'link' : link }),
        $.get('/plm/sections', { 'link' : link })
    ]

    Promise.all(requests).then(function(responses) {

        let rulesData = getSectionFieldValue(responses[0].data.sections, 'RULES', null);

        if(!isBlank(rulesData)) rules = JSON.parse(rulesData);
        
        wsProducts.sections = responses[1].data;

        for(let configuration of rules.configurations) {
            $('<option></option>').appendTo($('#select-configuration'))
                .attr('value', configuration.name)
                .html(configuration.name);
        }

        // insertBOM(linkFeatures, 'features', '', 'Addin', true, false, true, false, true, false, false, false, false);
        insertBOM(linkFeatures, {
            'id'            : 'features',
            'title'         : '',
            'bomViewName'   : 'Addin',
            'headers'       : false,
            'reset'         : true,
            'position'      : false
        });

    });

}


// Viewer setup
function initViewerDone() {

    viewerAddGhostingToggle();
    viewerAddResetButton();
    viewerAddViewsToolbar();
    viewerAddMarkupControls();

}



// Extend BOM & Features display and add click events to both
function changeBOMViewDone(id) {

    if(id === 'features') {

        // $('#features-action-reset').click(function() {
        //     $('#button-save').hide();
        //     $('#button-load').hide();
        // });

        // $('<div></div>').prependTo($('#features-toolbar'))
        //     .attr('id', 'button-save')
        //     .html('Konfiguration')
        //     .hide()
        //     .addClass('button')
        //     .addClass('with-icon')
        //     .addClass('icon-create');
            
        // Add button to load selected features in CAD
        $('<div></div>').prependTo($('#features-toolbar'))
            .attr('id', 'button-load')
            .html('Load in CAD')
            // .hide()
            .addClass('button')
            .addClass('default')
            .click(function(e) {
                loadInCAD();
            });


        // Add checkboxes to BOM leafs
        $('#' + id).find('.leaf').each(function() {
            $('<span></span>').appendTo($(this).children('.bom-first-col').first())
                .addClass('icon')
                .addClass('icon-check-box');
            $('<span></span>').appendTo($(this).children('.bom-first-col').first())
                .addClass('icon')
                .addClass('icon-check-box-checked');
        });

        $('#' + id).find('.leaf').click(function() {
            if($(this).hasClass('selected') || ($(this).siblings('.selected').length > 0)) {
                $('#button-save').show();
                $('#button-load').show();
            } else {
                $('#button-save').hide();
                $('#button-load').hide();
            }
        });


        // Add Feature Items counter
        $('<th>Items</th>').appendTo($('#' + id + '-thead').children('tr').first());

        $('#' + id + '-tbody').children('.node').each(function() {
            $('<td>Items</td>').appendTo($(this))
                .addClass('feature-items');
        });
        $('#' + id + '-tbody').children('.leaf').each(function() {

            let count = 0;

            for(let feature of rules.features) {
                if(feature.link === $(this).attr('data-link')) count = feature.paths.length;
            }

            $('<td></td>').appendTo($(this))
                .html(count)
                .addClass('feature-items')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFeatureItemsList($(this));
                });

        });


        // Insert BOM table actions
        $('<th>Actions</th>').appendTo($('#' + id + '-thead').children('tr').first());
        $('#' + id + '-tbody').children('.node').each(function() {
            $('<td></td>').appendTo($(this))
                .html('Actions')
                .addClass('bom-tree-actions');
        });
        $('#' + id + '-tbody').children('.leaf').each(function() {

            let elemActions = $('<td></td>').appendTo($(this))
                .addClass('bom-tree-actions');              

            let elemToolbar = $('<div></div>').addClass('feature-actions').appendTo(elemActions);

            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-edit-multiple')
                .attr('title', 'Bearbeitung der zugehörigen Liste an Teilen')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFeatureItemsList($(this));
                });

            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-zoom-in')
                .attr('title', 'Zugehörige Geometrie in 3D auswählen')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    highlightFeatureItems($(this).closest('.bom-item'));
                });
            
            $('<div></div>').appendTo(elemToolbar)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-link-add')
                // .addClass('icon-create')
                .attr('title', 'Gewählte Geometrie mit dieser Option verknüpfen')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    addFeatureItems($(this).closest('.bom-item'));
                });

        });

        // $('<td></t>').appendTo($('#' + id + '-tbody').children('node'));



    } else if(id === 'bom-modules') {
        setProductModules(id);
        highlightModulesInEBOM();
    } else {

        if(id === 'bom') highlightModulesInEBOM();

        insertTableActions(id);
        // setProductModules(id);

        // if(id === '') 

        $('<div></div>').prependTo($('#' + id + '-toolbar'))
            .addClass('button')
            .addClass('icon')
            .addClass('icon-factory')
            .addClass('xs')
            .attr('title', 'MBOM-Editor öffnen')
            .click(function() {
                let urlBase = document.location.href.split('/addins/');
                let link    = $('#bom').attr('data-link').split('/');
                let url     = urlBase[0] + '/mbom?wsId=' + link[4] + '&dmsId=' + link[6] + '&theme=' + theme;
                window.open(url);
            });

        $('<div></div>').prependTo($('#' + id + '-toolbar'))
            .attr('id', 'button-load')
            .html('Load in CAD')
            // .hide()
            .addClass('button')
            .addClass('default')
            .click(function(e) {
                loadInCAD();
            });
    
        // if(typeof chrome.webview === 'undefined') {
        //     $('#' + id).find('.bom-item').click(function() {
        //         // $(this).toggleClass('selected');
        //         // $(this).siblings().removeClass('selected');
        //         let partNumber = $(this).attr('data-part-number');
        //         if($(this).hasClass('selected')) {
        //             viewerSelectModel(partNumber, true);
        //         } else {
        //             viewerResetSelection(true);
        //         }
        //     });
        // } 

    }
    
}
function clickBOMItem(e, elemClicked) {

    let elemBOM = elemClicked.closest('.bom');
    let idBOM   = elemBOM.attr('id');

    // if(idBOM === 'bom') { elemClicked.siblings().removeClass('selected'); }
    elemClicked.toggleClass('selected');

    clickBOMItemDone(elemClicked);

}
function clickBOMItemDone(elemClicked) {

    let elemBOM = elemClicked.closest('.bom');
    let idBOM   = elemBOM.attr('id');

    if(idBOM === 'bom') {
        if(typeof chrome.webview === 'undefined') {
            if(elemClicked.hasClass('selected')) {
                viewerSelectModel(elemClicked.attr('data-part-number'), true);
            } else {
                viewerResetSelection(true);
            }
        }
    }

}
function clickBOMResetDone(elemClicked) {

    let elemBOM = elemClicked.closest('.bom');
    let idBOM   = elemBOM.attr('id');

    if(idBOM === 'bom') {
        if(typeof chrome.webview === 'undefined') {
            viewerResetSelection(true);
        }
    }

}


// Modules display and functions
function setProductModules(id) {

    let counter     = 1;
    let levelModule = -10;
    let elemTemplate = $('<div></div>');
        elemTemplate.addClass('module');


    $('#' + id + '-tbody').children().each(function() {
    
        let isModule = false;
        let elemItem = $(this);
        let level    = Number($(this).attr('data-level'));

        $(this).children().each(function() {
            
            if($(this).html() === '/api/v3/lookups/CUSTOM_LOOKUP_ITEM_TYPES/options/134') {
                
                isModule = true;
                counter = 1;
                elemItem.addClass('module');

                elemModule = elemTemplate.clone();
                elemModule.attr('data-link', elemItem.attr('data-link'));
                elemModule.appendTo($('#modules'));

                let elemModuleTitle = $('<div></div>');
                    elemModuleTitle.addClass('module-title');
                    elemModuleTitle.addClass('with-icon');
                    elemModuleTitle.addClass('icon-collapse');
                    elemModuleTitle.html(elemItem.attr('data-title'));
                    elemModuleTitle.appendTo(elemModule);
                    elemModuleTitle.click(function() {
                        // openItemByLink(elemItem.attr('data-link'));
                        clickModuleTitle($(this));
                    });

                let elemModuleToolbar = $('<div></div>').appendTo(elemModule)
                    .addClass('module-toolbar');

                $('<div></div>').appendTo(elemModuleToolbar)
                    .addClass('button')
                    .addClass('with-icon')
                    .addClass('icon-rules')
                    .html('Regeleditor')
                    .addClass('toggle-module-grid')
                    .attr('title', 'Stellt die Zuordnung der einzelnen Ausprägungen zu Merkmalsoptionen dar')
                    .click(function() {
                        // toggleModuleGrid($(this));
                    });
                $('<div></div>').appendTo(elemModuleToolbar)
                    .addClass('button')
                    .addClass('icon')
                    .addClass('icon-table')
                    .addClass('toggle-module-grid')
                    .attr('title', 'Stellt die Zuordnung der einzelnen Ausprägungen zu Merkmalsoptionen dar')
                    .click(function() {
                        toggleModuleGrid($(this));
                    });

                let elemModuleAction = $('<div></div>');
                    elemModuleAction.addClass('button');
                    elemModuleAction.addClass('default');
                    elemModuleAction.addClass('with-icon');
                    elemModuleAction.addClass('icon-link');
                    elemModuleAction.html('Variante')
                    elemModuleAction.attr('data-context-descriptor', elemItem.attr('data-title').split('[REV')[0]);
                    elemModuleAction.attr('title', 'Fügt die ausgewählte Geometrie als weitere Modulausprägung zu diesem Modul hinzu');
                    elemModuleAction.appendTo(elemModuleToolbar);
                    elemModuleAction.click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        clickModuleAddVariant($(this));
                    });

            }

        });

        if(isModule) {
            levelModule = level;
        } else if(level <= levelModule) {
                levelModule = -10;
        } else if(level === (levelModule +1)) {

            elemItem.addClass('variant');
            // let elemVariant = $('<div></div>');
            // elemVariant.html(elemItem.attr('data-title'));
            
            let elemVariant = genTile(elemItem.attr('data-link'), '', '', 'check_box_outline_blank', elemItem.attr('data-title'));
            // let elemVariant = genTile(elemItem.attr('data-link'), '', '', 'radio_button_partial', elemItem.attr('data-title'));
            // let elemVariant = genTile(elemItem.attr('data-link'), '', '', 'counter_' + counter++, elemItem.attr('data-title'));
            // let elemVariant = genTile(elemItem.attr('data-link'), '', '', 'view_in_ar', elemItem.attr('data-title'));
                // elemVariant.insertAfter(elemModule);
                elemVariant.appendTo($('#modules'));

        }
    
    });

    $('#modules').children('.tile').each(function() {
        insertTileAction($(this), false, true, true, true, true);
    });

    $('.tile-image').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        let elemTile = $(this).closest('.tile');
        elemTile.toggleClass('selected');
        if(elemTile.hasClass('selected')) {
            elemTile.children().first().find('.icon').html('check_box');
        }else {
            elemTile.children().first().find('.icon').html('check_box_outline_blank');
        }
    });

}
function clickModuleTitle(elemClicked) {

    let elemModule = elemClicked.closest('.module');

    elemModule.toggleClass('collapsed');
    elemClicked.toggleClass('icon-collapse');
    elemClicked.toggleClass('icon-expand');

    if(elemModule.hasClass('collapsed')) elemModule.nextUntil('.module').hide();
    else elemModule.nextUntil('.module').show();

}
function highlightModulesInEBOM() {

    console.log('highlightModulesInEBOM START');

    $('#bom').find('.bom-item').each(function() {
        let elemItem = $(this);
        elemItem.removeClass('module');
        elemItem.removeClass('variant');
        let linkItem = elemItem.attr('data-link');
        $('#modules').find('.moduel').each(function() {
            let linkModule = $(this).attr('data-link');
            if(linkModule === linkItem) elemItem.addClass('module');
        });
        $('#modules').find('.tile').each(function() {
            let linkVariant = $(this).attr('data-link');
            if(linkVariant === linkItem) elemItem.addClass('variant');
        });
    });


}
function toggleModuleGrid(elemClicked) {

    console.log('toggleModuleGrid START');

    elemClicked.toggleClass('selected');

    console.log(elemClicked.hasClass('selected'));

    let elemModule   = elemClicked.closest('.module');

    if(elemClicked.hasClass('selected')) {

        let variants     = [];
        let features     = [];
        
        let elemVariants = elemModule.nextUntil('.module');

        // console.log(elemVariants.length);

        elemVariants.each(function() {
            $(this).hide();
            let descriptor = $(this).attr('data-title').split(' - ');
            variants.push({
                'partNumber' : descriptor[0],
                'title'      : descriptor[1],
                'features'   : []
            });
        });


        for(let feature of rules.features) {

            let name        = '';

            $('#features-tbody').children().each(function() {
                if(feature.link === $(this).attr('data-link')) name = $(this).find('.bom-column-title').html();
            });

            console.log(name);

            for(let path of feature.paths) {
                let partPath    = path.split('|');
                let partName    = partPath[partPath.length - 1];
                let partNumber  = partName.split(':')[0];
                let instance    = (partName.split(':').length > 1) ? partName.split(':')[1] : '';
                
                console.log(partNumber);

                for(let variant of variants) {
                    if(partNumber === variant.partNumber) {
                        console.log('found feature match');
                        variant.features.push({
                            'link' : feature.link,
                            'name' : name,
                            'instance' : instance
                        })
                    }
                }

            }

        }

        let elemGrid = $('<div></div>').insertAfter(elemModule)
            .addClass('module-grid');

        elemGrid.append($('<div></div>'));

        for(let variant of variants) {
            for (let feature of variant.features) {
                if(features.indexOf(feature.name) <= 0) {
                    features.push(feature.name);
                    $('<div></div>').appendTo(elemGrid)
                        .addClass('module-grid-feature')
                        .html(feature.name);
                }

            }
        }

        for(let variant of variants) {
            
            $('<div></div>').appendTo(elemGrid)
                .addClass('module-grid-variant')
                .html(variant.partNumber + '<br/>' + variant.title);

            for(let feature of features) {

                let elemGridCell = $('<div></div>').appendTo(elemGrid)
                    .addClass('module-grid-cell');

                for(variantFeature of variant.features) {
                    if(variantFeature.name === feature) {
                        elemGridCell.addClass('module-grid-link')
                            .addClass('with-icon')
                            .addClass('icon-link')
                            .html(':' + variantFeature.instance)
                    }
                }

            }

        }

        elemGrid.css('grid-template-columns', '200px repeat(' + features.length + ', auto)')
        elemGrid.css('grid-template-rows', '36px repeat(' + variants.length + ', 36px)')

    } else {

        let elemNext = elemModule.next();

        console.log(elemNext.length);
        console.log(elemNext.hasClass('module-grid'));

        if(elemNext.hasClass('module-grid')) elemNext.remove();

        let elemVariants = elemModule.nextUntil('.module');

        console.log(elemVariants.length);

        elemVariants.show();


    }


}
function clickModuleAddVariant(elemClicked) {

    $('#overlay').show();

    getActiveDocument(elemClicked.attr('data-context-descriptor')).then(partNumber => {

    // let partNumber = 'CAD_30000153';
        
        console.log(partNumber);

        let linkParent = elemClicked.closest('.module').attr('data-link');

        console.log(linkParent);
        
        $.get('/plm/search-descriptor', { 'query' : partNumber }, function(response) {

            console.log(response);
        
            let params = {
        
                'linkParent' : linkParent,
                'linkChild' : response.data.items[0].__self__
    
            }

            let paramsEdit = { 
                'link' : response.data.items[0].__self__, 
                'sections'   : [{
                    'id' : '203',
                    'fields' : [{
                        'fieldId' : 'TYPE',
                        'value' : {
                            'link' : "/api/v3/lookups/CUSTOM_LOOKUP_ITEM_TYPES/options/133"
                        }}
                    ]
                }] 
            }

            let requests = [
                $.get('/plm/bom-add', params),
                $.get('/plm/edit', paramsEdit)

            ];

            Promise.all(requests).then(function(responses) {

                $('#modules').html('');

                insertBOM($('#bom-modules').attr('data-link'), {
                    'id'          : 'bom-modules',
                    'bomViewName' : 'Konfigurationsmanagement'
                });


                // insertBOM($('#details').attr('data-link-bom'), {
                //     'title' : '',
                //     'bomViewName' : 'Konfigurationsmanagement'
                // });
                $('#overlay').hide();
                
            });
        
        });


    });

}


// Features tab functionality
function toggleFeatureItemsList(elemClicked) {

    let elemFeature = elemClicked.closest('tr');
    let linkFeature = elemFeature.attr('data-link');
    let elemNext    = elemFeature.next();
    let count       = 0;

    if(elemNext.hasClass('feature-items')) {
        elemNext.remove();
    } else {

        elemNext = $('<tr></tr>').insertAfter(elemFeature)
            .attr('data-level', '2')
            .addClass('feature-items');

        let elemCell = $('<td></td>');
            elemCell.attr('colspan', 5);
            elemCell.appendTo(elemNext);

        let elemList = $('<div></div>');
            elemList.addClass('feature-items-list');
            elemList.appendTo(elemCell);

        for(let feature of rules.features) {
            if(feature.link === linkFeature) {

                count = feature.paths;

                for(let path of feature.paths) {
                    
                    let split       = path.split('|');
                    let partNumber  = split[split.length - 1];
                    let title       = getTitleFromEBOM(partNumber.split(':')[0]);

                    let elemItem = $('<div></div>').appendTo(elemList)
                        .addClass('feature-item')
                        .attr('data-path', path);
                        
                    let elemItemDetails = $('<div></div>').appendTo(elemItem)
                        .addClass('feature-item-details');
                        // .attr('data-path', path);

                    $('<div></div>').appendTo(elemItemDetails)
                        .addClass('feature-item-part-number')
                        .html(partNumber);

                    $('<div></div>').appendTo(elemItemDetails)
                        .addClass('feature-item-title')
                        .html(title);                        
                   
                    $('<div></div>').appendTo(elemItemDetails)
                        .addClass('feature-item-path')
                        .html(path.replaceAll('|', ' / '));

                    let elemActions = $('<div></div>').appendTo(elemItem)
                        .addClass('table-actions')
                        .addClass('feature-item-actions');

                    $('<div></div>').appendTo(elemActions)
                        .addClass('feature-item-highlight')
                        .addClass('button')
                        .addClass('icon')
                        .addClass('icon-zoom-in')
                        .click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            select3D([$(this).closest('.feature-item').attr('data-path')]);
                        });
                   
                    $('<div></div>').appendTo(elemActions)
                        .addClass('feature-item-delete')
                        .addClass('button')
                        .addClass('icon')
                        .addClass('icon-remove')
                        .click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            removeFeatureItem($(this));
                        });

                }

            }


        }

        if(count === 0) {

            $('<div></div>').appendTo(elemList)
                .addClass('feature-items-list-empty')
                .html('Keine Teile zugeordnet');

        }

    }

}
function getTitleFromEBOM(partNumber) {

    let result = '';

    // console.log(partNumber);

    $('#bom-tbody').children().each(function() {
        // console.log($(this).attr('data-part-number'));
        if($(this).attr('data-part-number') === partNumber) {
            let title = $(this).attr('data-title').split(' - ')[1];
            result = title.split('[REV')[0];
        }
    })

    return result;

}
function addFeatureItems(elemFeature) {

    $('#overlay').show();

    if($('body').hasClass('standalone')) {

        viewerGetSelectedComponentPaths().then(function(selectedComponentPaths) {
            addSelectedFeatureItems(elemFeature, selectedComponentPaths)
        });

    } else {

        // let selectedComponentPaths = '["test1", "Test2"]';
        // let selectedComponentPaths = '[]';
        // let selectedComponentPaths = '["CAD_30000000|test1","CAD_30000000|test2"]';

        getSelectedComponentPaths().then(selectedComponentPaths => {

            $('#overlay').hide();

            console.log(selectedComponentPaths);

            if(selectedComponentPaths === '[]') {

                showErrorMessage('Invalid Selection', 'Make sure to select valid components in Inventor');

            } else {

                selectedComponentPaths = selectedComponentPaths.replaceAll('[', '');
                selectedComponentPaths = selectedComponentPaths.replaceAll(']', '');
                selectedComponentPaths = selectedComponentPaths.replaceAll('"', '');

                selectedComponentPaths = selectedComponentPaths.split(',');

                addSelectedFeatureItems(elemFeature, selectedComponentPaths);

            }

        
        });

    }

}

function addSelectedFeatureItems(elemFeature, selectedComponentPaths) {

    for(let path of selectedComponentPaths) {

        let partNumber = path.split('|')[0];

        if(partNumber.indexOf('.') > -1) partNumber = partNumber.split('.')[0];

        if(partNumber !== $('#details').attr('data-part-number')) {
            $('#overlay').hide();
            showErrorMessage('Context does not match', 'The selected components in CAD cannot be added as they belong to context item ' + partNumber + ' while the features are managed in context of item ' + $('#details').attr('data-part-number') + '.');
            return;
        }

    }

    let elemCounter     = elemFeature.find('.feature-items').first();
    let count           = Number(elemCounter.html());
    let isNewFeature    = true;

    for(let rule of rules.features) {
        if(rule.link === elemFeature.attr('data-link')) {
         
            isNewFeature = false;
            
            for(let componentPath of selectedComponentPaths) {
                
                let isNewPath = true;

                for(let path of rule.paths) {
                    if(path === componentPath) {
                        isNewPath = false;
                    }
                }

                if(isNewPath) {
                    rule.paths.push(componentPath);
                }
            }

            count = rule.paths.length;

        }
    }

    if(isNewFeature) {

        rules.features.push({
            'link'  : elemFeature.attr('data-link'),
            'paths' : selectedComponentPaths
        });

        count = selectedComponentPaths.length;
    }
 
    saveRules();

    elemCounter.html(count);

}
function removeFeatureItem(elemClicked) {

    let elemFeatureItem  = elemClicked.closest('.feature-item');
    let elemFeature      = elemFeatureItem.closest('.feature-items').prev();
    let elemFeatureCount = elemFeature.find('.feature-items').first();
    let linkFeature      = elemFeature.attr('data-link');
    let path             = elemFeatureItem.attr('data-path');

    for (let feature of rules.features) {
        if(feature.link === linkFeature) {
            let index = feature.paths.indexOf(path);
            feature.paths.splice(index, 1);
            elemFeatureCount.html(feature.paths.length);
        }
    }

    elemFeatureItem.remove();

    saveRules();

    // let params = { 
    //     'link'      : $('#details').attr('data-link'), 
    //     'sections'  : [] 
    // }

    // addFieldToPayload(params.sections, wsProducts.sections, null, 'RULES', JSON.stringify(rules));

    // $.get('/plm/edit', params, function(response) {
    //     $('#overlay').hide();
    // });

}
function highlightFeatureItems(elemFeature) {

    let linkFeature = elemFeature.attr('data-link');

    for (let feature of rules.features) {
        if(feature.link === linkFeature) {
            select3D(feature.paths);
        }
    }

}
function loadInCAD() {

    console.log('loadInCAD START');

    let paths = [];

    $('#features-tbody').children('.selected').each(function() {
        let linkFeature = $(this).attr('data-link');
        for(let feature of rules.features) {
            if(feature.link === linkFeature) {
                for(let path of feature.paths) {
                    if(paths.indexOf(path) < 0) paths.push(path);
                }
            }
        }
    });

    console.log(paths);

    if(paths.length > 0) {
        addComponents(paths);
    }

}
function saveRules() {

    $('#overlay').show();

    let params = { 
        'link'      : $('#details').attr('data-link'), 
        'sections'  : [] 
    }

    addFieldToPayload(params.sections, wsProducts.sections, null, 'RULES', JSON.stringify(rules));

    $.get('/plm/edit', params, function(response) {
        $('#overlay').hide();
    });

}