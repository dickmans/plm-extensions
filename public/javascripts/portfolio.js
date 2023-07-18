let workspaces  = [];


$(document).ready(function() {   
    
    appendProcessing('landing', false);
    appendProcessing('search', false);
    appendProcessing('products', false);
    appendProcessing('product-bom', false);
    appendViewerProcessing();
    appendOverlay();

    getBrowserLanguage();
    setLabels();
    setUIEvents();
    getWorkspaceIds(function() {
        getTabNames();
        getProductCatgories();
        getRecentProducts();
        getProductLines();
        getBookmarkProducts();
    });

});


// Set UI Labels
function setLabels() {

    $('#landing-title').html(config.portfolio.hierarchy[0]);
    $('#lines-back').html(config.portfolio.hierarchy[0]);
    $('#lines-header').html(config.portfolio.hierarchy[1]);
    $('#products-back').html(config.portfolio.hierarchy[1]);
    $('#products-header').html(config.portfolio.hierarchy[2]);

}


// Set UI Controls
function setUIEvents() {

    // LANDING
    $('#landing-prev').click(function() {
        if($('.nav.selected').prev('.nav').length > 0) {
            $('.nav.selected').removeClass('selected').prev().addClass('selected');
            $('.dot.selected').removeClass('selected').prev().addClass('selected');
            // $('.nav.selected');
        }
    });
    $('#landing-next').click(function() {
        if($('.nav.selected').next('.nav').length > 0) {
            $('.nav.selected').removeClass('selected').next().addClass('selected');
            $('.dot.selected').removeClass('selected').next().addClass('selected');
        }
    });
    $('#landing-dot-recents').click(function() {
        $('#landing-recents').addClass('selected');
        $('#landing-lines').removeClass('selected');
        $('#landing-pinned').removeClass('selected');
        $(this).addClass('selected').siblings().removeClass('selected');
    });
    $('#landing-dot-lines').click(function() {
        $('#landing-recents').removeClass('selected');
        $('#landing-lines').addClass('selected');
        $('#landing-pinned').removeClass('selected');
        $(this).addClass('selected').siblings().removeClass('selected');
    });
    $('#landing-dot-pinned').click(function() {
        $('#landing-recents').removeClass('selected');
        $('#landing-lines').removeClass('selected');
        $('#landing-pinned').addClass('selected');
        $(this).addClass('selected').siblings().removeClass('selected');
    });
    $('#header-search').keypress(function (e) {
        if (e.which == 13) {
            searchProducts();
        }
    });
    $('#header-search-icon').click(function() {
        searchProducts();
    });


    // PRODUCT LINES
    $('#lines-back').click(function() {
        $('#landing').show();
        $('#lines').hide();
    });

    // PRODUCTS
    $('#products-back').click(function() {
        $('#lines').show();
        $('#products').hide();
    });


    // PRODUCT
    $('#product-close').click(function() {
        $('#product').hide();
    });
    $('.tab').click(function() {
        $(this).toggleClass('collapsed');
        $(this).next().toggle();
    });
    $('.product-action').click(function() {
        $(this).addClass('selected');
        $(this).siblings().removeClass('selected');
        let elemSelected = $('#' + $(this).attr('data-id'));
            elemSelected.show().siblings('.product-panel').hide();
    });


    // HEADER
    $('#search-close').click(function() {
        $('#search').hide();
    });

}


// Retrieve workspace information
function getWorkspaceIds(callback) {

    $.get('/plm/workspaces', {}, function(response) {
        for(level of config.portfolio.hierarchy) {
            for(workspace of response.data.items) {
                if(workspace.title === level) {
                    workspaces.push({
                        'wsId'  : workspace.link.split('/')[4],
                        'title' : workspace.title
                    })
                }
            }
        }
        callback();
    });

}


// Get Products workspace configuration details
function getTabNames() {

    $.get('/plm/tabs', { 'wsId' : workspaces[2].wsId }, function(response) {

        for(tab of response.data) {

            let label = (tab.name !== null) ? tab.name : tab.key;

            switch(tab.actionName) {
                case '/partAttachment'   : $('#product-files-tab'   ).html(label); break;
                case '/gridDetails'      : $('#product-variants-tab').html(label); break;
                case '/milestonesDetails': $('#product-timeline-tab').html(label); break;
            }

        }

    });

}


// Retrieve Landing Page Data
function getProductCatgories() {

    $.get('/plm/search-bulk', { 'query' : '*', 'wsId' : workspaces[0].wsId }, function(response) {

        $('#landing-processing').hide();

        let elemParent = $('#landing-lines-tiles');
            elemParent.html('');

        for(item of response.data.items) {

            let imageIds   = getMarketingImages(item.sections);
            let title      = getSectionFieldValue(item.sections, 'MARKETING_NAME_' + languageId, '');
            let subtitle   = getSectionFieldValue(item.sections, 'MARKETING_TEXT_' + languageId, '');
            let image      = getSectionFieldValue(item.sections, 'IMAGE', '');

            if(title    === '') title    = getSectionFieldValue(item.sections, 'MARKETING_NAME_1', '');
            if(subtitle === '') subtitle = getSectionFieldValue(item.sections, 'MARKETING_TEXT_1', '');

            let elemTile = genTile(item.__self__, item.urn, image, 'folder', title, subtitle);
                elemTile.appendTo(elemParent);
                elemTile.click(function() {
                    selectProductCategory($(this));
                });

            if(imageIds.length > 0) elemTile.attr('data-imageIds', imageIds);

        }

    });

}
function selectProductCategory(elemClicked) {

    let idParent = elemClicked.attr('data-link');

    $('#landing').hide();
    $('#lines').show();
    $('#lines').find('.tile').hide();

    $('#lines').find('.tile').each(function() {
        if($(this).attr('data-parent') === idParent) $(this).show();
    });

    $('#lines-image').html('').hide();
    $('#lines-images').html('').hide();
    $('#lines-title').html(elemClicked.find('.tile-title').html());
    $('#lines-text').html(elemClicked.find('.tile-subtitle').html());

    let elemImage = elemClicked.find('img');

    if(elemImage.length > 0) {
        elemImage.clone().appendTo($('#lines-image'));
        $('#lines-image').show();
    }

    setMarketingImages(elemClicked, $('#lines-images'));

}
function setMarketingImages(elemClicked, elemParent) {

    elemParent.html('').hide();

    let value = elemClicked.attr('data-imageIds');

    if(typeof value !== 'undefined') {

        let imageIds = elemClicked.attr('data-imageIds').split(',');
    
        for(imageId of imageIds) {
    
            let elemDiv = $('<div></div>');
                elemDiv.appendTo(elemParent);
                
            getImageFromCache(elemDiv, { 'link' : imageId }, 'image', function(elemImage) {

                let url = elemImage.attr('src');
                let elemMain = elemImage.closest('.screen-images').prev().find('img');
                let urlMain = elemMain.attr('src');
                
                elemMain.attr('src', url);
                elemImage.attr('src', urlMain);       

            });
    
        }

        elemParent.show();

    }

}


// Retrieve recently viewed and bookmarked products
function getRecentProducts() {

    let links = [];

    $('#landing-tiles-recents').html('');

    $.get('/plm/recent', {}, function(response) {

        for(item of response.data.recentlyViewedItems) {
            let workspace = item.workspace.link.split('/')[4];
            if(workspace === workspaces[2].wsId) links.push(item.item.link);
        }

        for(link of links) {
            $.get('/plm/details', { 'link' : link }, function(response) {
                addProductTile(response.data, $('#landing-tiles-recents'));
            });
        }

    });

}
function getBookmarkProducts() {

    let links = [];

    $('#landing-tiles-pinned').html('');

    $.get('/plm/bookmarks', {}, function(response) {



        for(item of response.data.bookmarks) {
            let workspace = item.workspace.link.split('/')[4];
            if(workspace === workspaces[2].wsId) links.push(item.item.link);
        }

        for(link of links) {
            $.get('/plm/details', { 'link' : link }, function(response) {
                addProductTile(response.data, $('#landing-tiles-pinned'));
            });
        }

    });

}
function searchProducts() {
    
    $('#search').show();
    $('#search-results').html('');
    $('#search-processing').show();

    let params = {
        'wsId'      : workspaces[2].wsId,
        'offset'    : 0,
        'limit'     : 20,
        'query'     : $('#header-search').val()
    }

    let elemParent = $('#search-results');
        elemParent.html('');

    $.get('/plm/search-bulk', params, function(response) {
        for(item of response.data.items) {
            addProductTile(item, elemParent)
        }
        $('#search-processing').hide();
    });
    
}
function addProductTile(item, elemParent) {

    let title       = getSectionFieldValue(item.sections, 'MARKETING_NAME_' + languageId, '');
    let subtitle    = getSectionFieldValue(item.sections, 'MARKETING_TEXT_' + languageId, '');
    let image       = getSectionFieldValue(item.sections, 'IMAGE', '');

    if(title === '') title = getSectionFieldValue(item.sections, 'MARKETING_NAME_1', '');
    if(subtitle  === '') subtitle  = getSectionFieldValue(item.sections, 'MARKETING_TEXT_1', '');

    let imageIds = getMarketingImages(item.sections);

    let elemTile = genTile(item.__self__, item.urn, image, 'stars', title, subtitle);
        elemTile.appendTo(elemParent);
        elemTile.addClass('product');
        elemTile.attr('data-title', item.title);
        elemTile.attr('data-imageIds', imageIds);
        elemTile.click(function() {
            selectProduct($(this));
    });

}


// Retrieve data for first level of navigation
function getProductLines() {

    $.get('/plm/search-bulk', { 'query' : '*', 'wsId' : workspaces[1].wsId }, function(response) {

        let elemParent = $('#lines-tiles');
            elemParent.html('');

        for(item of response.data.items) {

            let imageIds    = getMarketingImages(item.sections);
            let title       = getSectionFieldValue(item.sections, 'MARKETING_NAME_' + languageId, '');
            let subtitle    = getSectionFieldValue(item.sections, 'MARKETING_TEXT_' + languageId, '');
            let image       = getSectionFieldValue(item.sections, 'IMAGE', '');

            if(title === '') title = getSectionFieldValue(item.sections, 'MARKETING_NAME_1', '');
            if(subtitle  === '') subtitle  = getSectionFieldValue(item.sections, 'MARKETING_TEXT_1', '');

            let elemTile = genTile(item.__self__, item.urn, image, 'folder', title, subtitle);
                elemTile.attr('data-parent', getSectionFieldValue(item.sections, 'PRODUCT_CATEGORY', ''));
                elemTile.attr('data-title', item.title);
                elemTile.appendTo(elemParent);
                elemTile.click(function() {
                    selectProductLine($(this));
                });

            if(imageIds.length > 0) elemTile.attr('data-imageIds', imageIds);

        }

    });

}
function selectProductLine(elemClicked) {

    $('#lines').hide();
    $('#products').show();
    $('#products-processing').show();

    $('#products-image').html('').hide();
    $('#products-images').html('').show();
    $('#products-line').html($('#lines-title').html());
    $('#products-title').html(elemClicked.find('.tile-title').html());
    $('#products-text').html(elemClicked.find('.tile-subtitle').html());

    let elemImage = elemClicked.find('img');

    if(elemImage.length > 0) {
        elemImage.clone().appendTo($('#products-image'));
        $('#products-image').show();
    }

    setMarketingImages(elemClicked, $('#products-images'));

    let parentName = elemClicked.attr('data-title');
    let elemParent = $('#products-tiles');
        elemParent.html('');

    let params = {
        'wsId'      : workspaces[2].wsId,
        'offset'    : 0,
        'limit'     : 20,
        'query'     : 'ITEM_DETAILS:PRODUCT_LINE%3D%22' + parentName + '%22'
    }

    $.get('/plm/search-bulk', params, function(response) {

        $('#products-processing').hide();

        for(item of response.data.items) {
            addProductTile(item, elemParent)
        }

    });

}
function getMarketingImages(sections) {

    let result = [];

    for(var i = 1; i < 5; i++) {
        let imageId = getSectionFieldValue(sections, 'IMAGE_' + i, '');
        if(imageId !== '') result.push(imageId);
    }

    return result;

}



// Product Interactions
function selectProduct(elemClicked) {

    let link = elemClicked.attr('data-link');

    $('#product-category').html('').addClass('animation');
    $('#product-line').html('').addClass('animation');
    $('#product-title').html('').addClass('animation');
    $('#product-text').html('').addClass('animation').show();

    $('#viewer').hide();
    $('#viewer-empty').hide();
    $('#viewer-processing').show();
    
    $('#gallery').hide();
    $('#product').show();
    $('#product').attr('data-link', link);
    $('#product-bom-processing').show();
    $('#product-bom-list').html('');
    $('#product-toolbar').children().first().click();
    $('#product').removeClass('has-viewable');

    getBookmarkStatus();
    setProductDetails(link);
    insertAttachments(link, 'product-files');
    insertGrid(link, 'product-variants');

}
function setProductDetails(link) {

    // $('#product-title').html('');
    // $('#product-text').html('');
    $('#product-images-list').html('');
    $('#product-images').hide();
    $('#product-specification').hide();

    $.get('/plm/details', { 'link' : link }, function(response) {

        let category = getSectionFieldValue(response.data.sections, 'PRODUCT_CATEGORY', '', 'title');
        let line     = getSectionFieldValue(response.data.sections, 'PRODUCT_LINE', '', 'title');
        let title    = getSectionFieldValue(response.data.sections, 'MARKETING_NAME_' + languageId, '');
        let text     = getSectionFieldValue(response.data.sections, 'MARKETING_TEXT_' + languageId, '');

        if(category !== '') category = category.split(' - ')[1];
        if(line     !== '') line     = line.split(' - ')[1];
        if(title    === '') title    = getSectionFieldValue(response.data.sections, 'MARKETING_NAME_1', '');
        if(text     === '') text     = getSectionFieldValue(response.data.sections, 'MARKETING_TEXT_1', ''); 

        let elemText = $('<span></span>').html(text).text();

        $('#product-category').html(category).removeClass('animation');
        $('#product-line'    ).html(line    ).removeClass('animation');
        $('#product-title'   ).html(title   ).removeClass('animation');

        if(text === '') {
            $('#product-text').hide();
        } else {
            $('#product-text').append(elemText).removeClass('animation');
            $('#product-text').show();
        }
        

        for(section of response.data.sections) {

            if(section.hasOwnProperty('classificationId')) {

                $('#product-specification-tab').html(section.classificationName);
                $('#product-specification-list').html('');

                for(field of section.fields) {

                    let elemSpec = $('<div></div>');
                        elemSpec.appendTo($('#product-specification-list'));

                    let elemSpecLabel = $('<div></div>');
                        elemSpecLabel.html(field.title);    
                        elemSpecLabel.addClass('specification-label');
                        elemSpecLabel.appendTo(elemSpec);

                    let value = (field.value === null) ? '' : field.value;

                    if(typeof value === 'object') value = field.value.title;

                    let elemSpecValue = $('<div></div>');
                        elemSpecValue.html(value);
                        elemSpecValue.appendTo(elemSpec);

                }

                $('#product-specification').show();

            }

        }

        let imageIds   = getMarketingImages(response.data.sections);
        let valueImage = getSectionFieldValue(response.data.sections, 'IMAGE', '');

        if(valueImage !== '') imageIds.splice(0, 0, valueImage);
        
        if(imageIds.length > 0) {

            $('#product-images').show();

            let elemParent = $('#product-images-list');

            for(imageId of imageIds) {

                let elemDiv = $('<div></div>');
                    elemDiv.appendTo(elemParent);
                    elemDiv.click(function() {
                        let elemClicked = $(this);
                        if(elemClicked.hasClass('selected')) {
                            $('#gallery').hide();
                            elemClicked.removeClass('selected');
                        } else {
                            elemClicked.addClass('selected');
                            elemClicked.siblings().removeClass('selected');
                            $('#gallery').show();
                            $('#gallery-image').attr('src', elemClicked.find('img').attr('src')).show();
                        }
                    });
                    
                getImageFromCache(elemDiv, { 'link' : imageId }, 'zmdi-wallpaper', function(elemClicked) {});
        
            }

        }


        let ebom = getSectionFieldValue(response.data.sections, 'ENGINEERING_BOM', '');

        if(ebom !== '') {
            $('#viewer').show();
            $('#viewer-empty').hide();
            insertViewer(ebom, 240);
            insertFlatBOM('product-bom', ebom, config.portfolio.bomViewName, config.portfolio.fieldIdPartNumber, false, []);
        } else {
            $('#product-bom-processing').hide();
            $('#viewer-empty').show();
            $('#viewer-progress').hide();
        }

    });

}


// Click BOM Item
function selectBOMItem(e, elemClicked) {

    if(elemClicked.hasClass('selected')) {

        elemClicked.removeClass('selected');
        viewerResetSelection();

    } else {

        $('.bom-item').removeClass('selected');
        elemClicked.addClass('selected');

        let partNumber = elemClicked.attr('data-part-number');
        
        viewerResetColors();
        viewerSelectModel(partNumber, true);

    }

}

// APS Viewer Callbacks
function initViewerDone() {

    viewerAddGhostingToggle();
    viewerAddResetButton();
    viewerAddViewsToolbar();

}
function viewerSelectionResetDone() {

    $('.bom-item').removeClass('selected');
    
}