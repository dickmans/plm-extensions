let hierarchy   = ['Product Categories', 'Product Lines', 'Products'];
let workspaces  = [];
let gridColumns = [];
let languageId  = '1';


$(document).ready(function() {   
    
    getBrowserLanguage();
    setLabels();
    setUIEvents();
console.log(new Date());

    getWorkspaceIds(function() {
        getTabNames();
        getGridColumns();
        getRecentProducts();
        getProductCatgories();
        getProductCatgoriesTableau();
        getProductCatgoriesSearchV1();
        getProductLines();
        getBookmarkProducts();
    });

});


// Determine browser language
function getBrowserLanguage() {

    switch(navigator.language.toLowerCase()) {
        case 'es'   :   languageId = '2'; break;
        case 'es-es':   languageId = '2'; break;
        case 'fr'   :   languageId = '3'; break;
        case 'fr-fr':   languageId = '3'; break;
        case 'de'   :   languageId = '4'; break;
        case 'de-de':   languageId = '4'; break;
    }

}


// Set UI Labels
function setLabels() {

    $('#landing-title').html(hierarchy[0]);
    $('#lines-back').html(hierarchy[0]);
    $('#lines-header').html(hierarchy[1]);
    $('#products-back').html(hierarchy[1]);
    $('#products-header').html(hierarchy[2]);

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
    $('#product-open').click(function() {
        openItemByURN($('#product').attr('data-urn'));
    });
    $('#product-bookmark').click(function() {
        let dmsId = $('#product').attr('data-urn').split('.')[5];
        if($('#product-bookmark').hasClass('active')) {
            $.get('/plm/remove-bookmark', { 'dmsId' : dmsId }, function (response) {
                setBookmark($('#product').attr('data-urn'), 'product-bookmark');
            });
        } else {
            $.get('/plm/add-bookmark', { 'dmsId' : dmsId, 'comment' : ' ' }, function (response) {
                setBookmark($('#product').attr('data-urn'), 'product-bookmark');
            });
        }


    });
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

    $('#header-logo').click(function () { goHome(); });
    $('#header-title').click(function () { goHome(); });
    $('#search-close').click(function () {
        $('#search').hide();
    });

}


// Restore Landing page
function goHome() {

    $('#landing').show();
    $('.screen').hide();
    $('#search').hide();

}


// Retrieve workspace information
function getWorkspaceIds(callback) {

    $.get('/plm/workspaces', {}, function(response) {
        for(level of hierarchy) {
            for(workspace of response.data.items) {
                if(workspace.title === level) {
                    workspaces.push({
                        'wsId' : workspace.link.split('/')[4],
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
function getGridColumns() {

    $.get('/plm/grid-columns', { 'wsId' : workspaces[2].wsId }, function(response) {
        gridColumns = response.data.fields;
    });

}


function getProductCatgoriesSearchV1() {


    // statusFilter.push({
    //     field       : "VAULT_ITEM",
    //     type        : 0,
    //     comparator  : 21,
    //     value       : "" 
    // });
    
    let params = {
        wsId : workspaces[0].wsId,
        fields : [
            "TITLE", 
            "IMAGE",
            // "DESCRIPTOR",
            "MARKETING_NAME_1",
            "MARKETING_TEXT_1"
        ],
        sort : ["TITLE"],
        filter : [{
            'field' : 'TITLE',
            'tpye' : 0,
            'comparator' : 21,
            'value' : ''
        }]
    }



    $.get('/plm/search', params, function(response) {
        console.log(response);
        console.log(' >>> #3 Done');
        console.log(new Date().getTime());
        
    });
}


function getProductCatgoriesTableau() {

    $.get('/plm/tableau-data', { 'link' : '/api/v3/workspaces/109/tableaus/1204' }, function(response) {

        console.log(response);

        console.log(' >>> #2 Done');
        console.log(new Date().getTime());
    });

}


// Retrieve Landing Page Data
function getProductCatgories() {

    $.get('/plm/search-bulk', { 'query' : '*', 'wsId' : workspaces[0].wsId }, function(response) {

        console.log(' >>> #1 Done');
        console.log(new Date().getTime());

        $('#landing-progress').hide();

        let elemParent = $('#landing-lines-tiles');
            elemParent.html('');

        for(item of response.data.items) {

            let imageIds = getMarketingImages(item.sections);
            let title    = getSectionFieldValue(item.sections, 'MARKETING_NAME_' + languageId, '');
            let text     = getSectionFieldValue(item.sections, 'MARKETING_TEXT_' + languageId, '');

            if(title === '') title = getSectionFieldValue(item.sections, 'MARKETING_NAME_1', '');
            if(text  === '') text  = getSectionFieldValue(item.sections, 'MARKETING_TEXT_1', '');

            let elemTile = $('<div></div>');
                elemTile.addClass('tile');
                elemTile.attr('data-link', item.__self__);
                elemTile.attr('data-urn', item.urn);
                elemTile.appendTo(elemParent);
                elemTile.click(function() {
                    selectProductCategory($(this));
                });

            let elemTileImage = $('<div></div>');
                elemTileImage.addClass('tile-image');
                elemTileImage.appendTo(elemTile);

            let elemTileTitle = $('<div></div>');
                elemTileTitle.addClass('tile-title');
                elemTileTitle.html(title);
                elemTileTitle.appendTo(elemTile);

            let elemTileText = $('<div></div>');
                elemTileText.addClass('tile-text');
                elemTileText.html(text);
                elemTileText.appendTo(elemTile);

            if(imageIds.length > 0) elemTile.attr('data-imageIds', imageIds);

            let valueImage = getSectionFieldValue(item.sections, 'IMAGE', '');
                
            getImageFromCache(elemTileImage, { 'link' : valueImage }, 'zmdi-folder-outline');

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
    $('#lines-text').html(elemClicked.find('.tile-text').html());

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
                
            getSmallImageFromCache(elemDiv, { 'link' : imageId }, 'zmdi-wallpaper');
    
        }

        elemParent.show();

    }


}
function getSmallImageFromCache(elemParent, params, icon) {

    let elemIcon = $('<i></i>');
        elemIcon.addClass('zmdi');
        elemIcon.addClass(icon);
        elemIcon.appendTo(elemParent);

    if(typeof params.link === 'undefined') {
        if(typeof params.dmsId === 'undefined') return;
        else if(params.dmsId === '') return;
    } else if(params.link === '') return;

    $.get('/plm/image-cache', params, function(response) {

        elemParent.html('');

        let elemImage = $('<img>');
            elemImage.attr('src', response.data.url);
            elemImage.appendTo(elemParent);
            elemImage.click(function() {
                let url = $(this).attr('src');
                let elemMain = $(this).closest('.screen-images').prev().find('img');
                let urlMain = elemMain.attr('src');

                elemMain.attr('src', url);
                $(this).attr('src', urlMain);
            });

    });

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
    $('#search-progress').show();

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
        $('#search-progress').hide();
    });
    
}
function addProductTile(item, elemParent) {

    let title = getSectionFieldValue(item.sections, 'MARKETING_NAME_' + languageId, '');
    let text  = getSectionFieldValue(item.sections, 'MARKETING_TEXT_' + languageId, '');

    if(title === '') title = getSectionFieldValue(item.sections, 'MARKETING_NAME_1', '');
    if(text  === '') text  = getSectionFieldValue(item.sections, 'MARKETING_TEXT_1', '');

    let elemText = $('<span></span>').html(text).text();
    let imageIds = getMarketingImages(item.sections);

    let elemTile = $('<div></div>');
        elemTile.addClass('tile');
        elemTile.addClass('product');
        elemTile.attr('data-link', item.__self__);
        elemTile.attr('data-urn', item.urn);
        elemTile.attr('data-title', item.title);
        elemTile.attr('data-imageIds', imageIds);
        elemTile.appendTo(elemParent);
        elemTile.click(function() {
            selectProduct($(this));
        });

    let elemTileImage = $('<div></div>');
        elemTileImage.addClass('tile-image');
        elemTileImage.appendTo(elemTile);

    let elemTileTitle = $('<div></div>');
        elemTileTitle.addClass('tile-title');
        elemTileTitle.html(title);
        elemTileTitle.appendTo(elemTile);

    let elemTileText = $('<div></div>');
        elemTileText.addClass('tile-text');
        elemTileText.append(elemText);
        elemTileText.appendTo(elemTile);

    let valueImage = getSectionFieldValue(item.sections, 'IMAGE', '');
        
    getImageFromCache(elemTileImage, { 'link' : valueImage }, 'zmdi-wallpaper');

}


// Retrieve data for first level of navigation
function getProductLines() {

    $.get('/plm/search-bulk', { 'query' : '*', 'wsId' : workspaces[1].wsId }, function(response) {

        let elemParent = $('#lines-tiles');
            elemParent.html('');

        for(item of response.data.items) {

            let imageIds = getMarketingImages(item.sections);
            let title    = getSectionFieldValue(item.sections, 'MARKETING_NAME_' + languageId, '');
            let text     = getSectionFieldValue(item.sections, 'MARKETING_TEXT_' + languageId, '');

            if(title === '') title = getSectionFieldValue(item.sections, 'MARKETING_NAME_1', '');
            if(text  === '') text  = getSectionFieldValue(item.sections, 'MARKETING_TEXT_1', '');

            let elemTile = $('<div></div>');
                elemTile.addClass('tile');
                elemTile.attr('data-link', item.__self__);
                elemTile.attr('data-urn', item.urn);
                elemTile.attr('data-title', item.title);
                elemTile.attr('data-parent', getSectionFieldValue(item.sections, 'PRODUCT_CATEGORY', ''));
                elemTile.appendTo(elemParent);
                elemTile.click(function() {
                    selectProductLine($(this));
                });
                
            let elemTileData = $('<div></div>');
                elemTileData.addClass('tile-data');
                elemTileData.appendTo(elemTile);
        
            let elemTileTitle = $('<div></div>');
                elemTileTitle.addClass('tile-title');
                elemTileTitle.html(title);
                elemTileTitle.appendTo(elemTileData);

            let elemTileText = $('<div></div>');
                elemTileText.addClass('tile-text');
                elemTileText.html(text);
                elemTileText.appendTo(elemTileData);

            let elemTileImage = $('<div></div>');
                elemTileImage.addClass('tile-image');
                elemTileImage.appendTo(elemTile);

            if(imageIds.length > 0) elemTile.attr('data-imageIds', imageIds);

            let valueImage = getSectionFieldValue(item.sections, 'IMAGE', '');
                
            getImageFromCache(elemTileImage, { 'link' : valueImage }, 'zmdi-folder-outline');

        }

    });

}
function selectProductLine(elemClicked) {

    $('#lines').hide();
    $('#products').show();
    $('#products-progress').show();

    $('#products-image').html('').hide();
    $('#products-images').html('').show();
    $('#products-line').html($('#lines-title').html());
    $('#products-title').html(elemClicked.find('.tile-title').html());
    $('#products-text').html(elemClicked.find('.tile-text').html());

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

        $('#products-progress').hide();

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

    let urn = elemClicked.attr('data-urn');

    $('#product-category').html('').addClass('animation');
    $('#product-line').html('').addClass('animation');
    $('#product-title').html('').addClass('animation');
    $('#product-text').html('').addClass('animation').show();

    $('#viewer').hide();
    $('#no-viewer').addClass('processing').show();
    $('#gallery').hide();
    $('#product').show();
    $('#product').attr('data-urn', urn);
    $('#product-bom-progress').show();
    $('#product-bom-list').html('');
    $('#product-toolbar').children().first().click();
    $('#product').removeClass('has-viewable');

    let link =  elemClicked.attr('data-link');

    setBookmark(urn, 'product-bookmark');
    setProductDetails(link);
    setProductAttachments(link);
    setProductVariants(link);

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
        if(line !== '') line = line.split(' - ')[1];
        if(title === '') title = getSectionFieldValue(response.data.sections, 'MARKETING_NAME_1', '');
        if(text  === '') text  = getSectionFieldValue(response.data.sections, 'MARKETING_TEXT_1', ''); 

        let elemText = $('<span></span>').html(text).text();

        $('#product-category').html(category).removeClass('animation');
        $('#product-line').html(line).removeClass('animation');
        $('#product-title').html(title).removeClass('animation');

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

        let imageIds = getMarketingImages(response.data.sections);
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
                            // $('#gallery-image').siblings().hide();
                            // $('#viewer').hide();
                            // $('#no-viewer').hide();
                            $('#gallery').hide();
                            elemClicked.removeClass('selected');
                        } else {
                            elemClicked.addClass('selected');
                            elemClicked.siblings().removeClass('selected');
                            $('#gallery').show();
                            $('#gallery-image').attr('src', elemClicked.find('img').attr('src')).show();
                          //  $('#gallery').hide();
                        }
                    });
                    
                getImageFromCache(elemDiv, { 'link' : imageId }, 'zmdi-wallpaper', function(elemClicked) {

                    // $('#gallery').show();

                    // let elemParent = elemClicked.parent();

                    // //elemClicked.toggleClass('selected');
                    // //elemParent.toggleClass('selected');

                    // if(elemParent.hasClass('selected')) {
                    //     // $('#gallery-image').siblings().hide();
                    //     // $('#viewer').hide();
                    //     // $('#no-viewer').hide();
                    //     $('#gallery').hide();
                    //     elemParent.removeClass('selected');
                    // } else {
                    //     elemParent.addClass('selected');
                    //     elemParent.siblings().removeClass('selected');
                    //     $('#gallery').show();
                    //     $('#gallery-image').attr('src', elemClicked.attr('src')).show();
                    //   //  $('#gallery').hide();
                    // }

                });
        
            }
            // console.log(elemParent.find('img').length);

            // elemParent.find('img').click(function() {
            //     // let elemClicked = $(this);
            //     console.log('bild click');
            //     $('#viewer-image').attr('src', $(this).attr('src')).show();
            // });

        }


        let ebom = getSectionFieldValue(response.data.sections, 'ENGINEERING_BOM', '');
        // console.log(bom);

        if(ebom !== '') {
            $('#viewer').show();
            $('#no-viewer').hide();
            setProductViewer(ebom);
            setProductBOM(ebom);
        } else {
            $('#product-bom-progress').hide();
            $('#no-viewer').removeClass('processing').show();
        }

    });

}
function setProductAttachments(link) {

    let elemParent = $('#product-files-list');
        elemParent.html('');

    $.get('/plm/attachments', { 'link' : link }, function(response) {
        insertAttachments(elemParent, response.data);
    });

}
function setProductVariants(link) {

    $('#product-variants').hide();
    $('#product-variants-list').html('');

    $.get('/plm/grid', { 'link' : link }, function(response) {
        if(response.data.length > 0 ) {

            let elemTable = $('<table></table>');
                elemTable.appendTo($('#product-variants-list'));
            
            let elemTableBody = $('<tbody></tbody>');
                elemTableBody.appendTo(elemTable);

            let elemTableHead = $('<tr></tr>');
                elemTableHead.appendTo(elemTableBody);

            for(column of gridColumns) {

                let elemTableHeadCell = $('<th></th>');
                    elemTableHeadCell.html(column.name);
                    elemTableHeadCell.appendTo(elemTableHead);
                
            }

            for(row of response.data) {

                let elemTableRow = $('<tr></tr>');
                    elemTableRow.appendTo(elemTableBody);

                for(column of gridColumns) {

                    let value = '';

                    for(field of row.rowData) {
                        if(field.title === column.name) {
                            value = field.value;
                        }
                    }

                    let elemTableCell = $('<td></td>');
                        elemTableCell.html(value);
                        elemTableCell.appendTo(elemTableRow);
                }

            }

            $('#product-variants').show();

        }
    });

}
function setProductViewer(link) {

    $.get( '/plm/list-viewables', { 'link' : link }, function(response) {

        if(response.params.link !== link) return;

        if(response.data.length > 0) {

            $('#product').addClass('has-viewable');

            let viewLink = response.data[0].selfLink;

            $.get( '/plm/get-viewable', { 'link' : viewLink } , function(response) {
                if(response.params.link !== viewLink) return;
                $('#viewer').show();
                initViewer(response.data, 240);
            });

        }

    });

}
function initViewerDone() {
    // alert('10');
    // alert($('#viewer').length);
    // $('#viewer').show();
    // $('#viewer').css('z-index', '10000');
}
function onSelectionChanged(event) {}
function setProductBOM(link) {


    let elemBOM = $('#product-bom-list');
        elemBOM.html('');

    // if(vaultItem === null) return;
    // if(vaultItem === '') return;

    // let link = ebom.split('/');

    let params = {
        'wsId'          : link.split('/')[4],
        'dmsId'         : link.split('/')[6],
        'revisionBias'  : 'release'
    }

    $.get('/plm/bom-views', params, function(response) {

        console.log(response);

        let view = response.data[0].link.split('/');

        params.viewDefId = view[view.length - 1];

        $.get('/plm/bom-flat', params, function(response) {

            // let elemBOM = $('#product-bom-list');

            for(item of response.data) {

                let itemLink = item.item.link.split('/');
                let partNumber = item.item.title.split(' - ')[0];

                let elemItem = $('<div></div>');
                    elemItem.addClass('bom-item');
                    elemItem.addClass('unread');
                    elemItem.appendTo(elemBOM);
                    elemItem.attr('data-wsid' , itemLink[itemLink.length - 3]);
                    elemItem.attr('data-dmsid', itemLink[itemLink.length - 1]);
                    elemItem.attr('data-link', item.item.link);
                    elemItem.attr('data-title', item.item.title);
                    elemItem.attr('data-part-number', partNumber);
                    elemItem.click(function() {
                        selectBOMItem($(this));
                    });

                let elemItemTitle = $('<div></div>');
                    elemItemTitle.addClass('bom-item-title');
                    elemItemTitle.html(item.item.title);
                    elemItemTitle.appendTo(elemItem);

                let elemItemQty = $('<div></div>');
                    elemItemQty.addClass('bom-item-qty');
                    elemItemQty.html(item.totalQuantity);
                    elemItemQty.appendTo(elemItem);

                let elemItemActions = $('<div></div>');
                    elemItemActions.addClass('bom-item-actions');
                    elemItemActions.appendTo(elemItem);

                let elemItemMore = $('<i></i>');
                    elemItemMore.addClass('zmdi');
                    elemItemMore.addClass('zmdi-chevron-right');
                    elemItemMore.appendTo(elemItemActions);
                    // elemItemMore.click(function(e) {
                    //     e.preventDefault();
                    //     e.stopPropagation();
                    //     showMore($(this));
                    // });

            }

            $('#product-bom-progress').hide();

        });
    });

}
function selectBOMItem(elemClicked) {

    elemClicked.removeClass('unread');
    
    if(elemClicked.hasClass('selected')) {

        elemClicked.removeClass('selected');
        resetViewerSelection();

    } else {

        $('.bom-item').removeClass('selected');
        elemClicked.addClass('selected');

        let partNumber = elemClicked.attr('data-part-number');
        
        viewerResetColors();
        viewerSelectModel(partNumber, true);

    }

    if($('.bom-item.selected').length === 0) {
        $('#button-bom-reset').addClass('disabled');
        // $('#button-bom-reset').attr('disabled', 'disabled');
    } else {
        $('#button-bom-reset').removeClass('disabled');
        // $('#button-bom-reset').removeAttribute('disabled');
    }

}