$(document).ready(function() {

    setUIEvents();
    appendOverlay();
    // getWSConfig();
    // insertMOW('mow', 'Change Tasks');
    // insertMOW('mow');
    // getChangeTasks();
    // insertViewSelector(80, 'views');


    insertWorkspaceItems('95', 'products', 'Grundrissaufbauten', ['wide', 's'], true, null, 'IMAGE', 'TITLE', 'DESCRIPTION', [], null, ['ENGINEERING_BOM']);
    // insertWorkspaceItems('95', 'products', 'Grundrissaufbauten', ['wide', 'xl'], true, null, 'IMAGE', 'TITLE', 'DESCRIPTION', [
    //     ['with-icon icon-type'    , 'PRODUCT_CATEGORY', true],
    //     ['with-icon icon-calendar', 'PRODUCT_YEAR'    , true]
    // ]);

    

});



function setUIEvents() {

    $('#close').click(function() {
        $('#products').show();
        $('#details').hide();
        $('.screen').addClass('surface-level-1');
        $('.screen').removeClass('surface-level-2');
    });

    $('#context').click(function() {
        $(this).toggleClass('selected');
    });

}


function clickWorkspaceItem(elemClicked) {

    let link = elemClicked.attr('data-link');

    $('#products').hide();
    $('#details').show();
    $('#modules').html('');
    $('#details').attr('data-link', link);
    $('#details').attr('data-link-bom', elemClicked.attr('data-engineering_bom'));
    $('#details').find('.panel-title').html(elemClicked.attr('data-title'));
    $('.screen').removeClass('surface-level-1');
    $('.screen').addClass('surface-level-2');

    $('.tabs').children().first().click();

    insertBOM(elemClicked.attr('data-engineering_bom'), null, '', 'Konfigurationsmanagement', null, null, true, false);

    console.log(elemClicked.attr('data-engineering_bom'));

    if(typeof chrome.webview === 'undefined') {
        $('#viewer').show();
        if($('body').hasClass('blue-theme')) insertViewer(elemClicked.attr('data-engineering_bom'), [59,68,83]);
        else insertViewer(elemClicked.attr('data-engineering_bom'), [245,245,245]);
    } 

}
function changeBOMViewDone(id) {

    insertTableActions(id);
    setProductModules(id);

    if(typeof chrome.webview === 'undefined') {
        $('.bom-item').click(function() {
            let partNumber = $(this).attr('data-part-number');
            console.log(partNumber);
            if($(this).hasClass('selected')) {
                viewerSelectModel(partNumber, true);
            } else {
                viewerResetSelection(true);
            }
        });
    } 

    
}

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
                    elemModuleTitle.html(elemItem.attr('data-title'));
                    elemModuleTitle.appendTo(elemModule);
                    elemModuleTitle.click(function() {
                        openItemByLink(elemItem.attr('data-link'));
                    });

                let elemModuleAction = $('<div></div>');
                    elemModuleAction.addClass('button');
                    elemModuleAction.addClass('default');
                    elemModuleAction.addClass('with-icon');
                    elemModuleAction.addClass('icon-link');
                    elemModuleAction.html('Variante hinzufügen')
                    elemModuleAction.appendTo(elemModule);
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
        insertTileAction($(this));
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


function clickModuleAddVariant(elemClicked) {

    $('#overlay').show();

    getActiveDocument().then(partNumber => {

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

            // addFieldToPayload(paramsEBOM.sections, wsEBOM.sections, null, config.mbom.fieldIdLastSync, value);

            console.log(params);

            let requests = [
                $.get('/plm/bom-add', params),
                $.get('/plm/edit', paramsEdit)

            ];

            console.log(paramsEdit);

            Promise.all(requests).then(function(responses) {

            // });
        
            // $.get('/plm/bom-add', params, function(responses[0]) {

                console.log(responses[0]);

                $('#modules').html('');
                insertBOM($('#details').attr('data-link-bom'), null, '', 'Konfigurationsmanagement', null, null, true, false);
                $('#overlay').hide();
                
            });
        
        });


    });

}