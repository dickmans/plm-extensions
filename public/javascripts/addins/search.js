$(document).ready(function() {

    appendProcessing('search');
    appendProcessing('materials');
    appendProcessing('recents');
    appendProcessing('bookmarks');

    insertWorkspaceViews('views', '57', '', false, 3);

    setUIEvents();

});



function setUIEvents() {

    // Items search tab
    $('#tab-search').click(function() {
        $('#search-input').focus();
    });
    $('#search-input').keypress(function(e) {
        if(e.which == 13) {
            performSearchItems();
        }
    });
    $('#search-submit').click(function() {
        performSearchItems();
    });


    // Materials search tab
    $('#tab-materials').click(function() {
        $('#materials-input').focus();
    });
    $('#materials-input').keypress(function(e) {
        if(e.which == 13) {
            performSearchMaterials();
        }
    });
    $('#materials-submit').click(function() {
        performSearchMaterials();
    });


    // Recents tab
    $('#tab-recents').click(function() {
        insertRecentItems('recents', ['57'], 'view_in_ar');
    });


    // Bookmarks tab
    $('#tab-bookmarks').click(function() {
        insertBookmarks('bookmarks', ['57'], 'view_in_ar');
    });


    $('.tab').first().click();

}


// Perform searches
function performSearchItems() {

    let elemList = $('#search-list');
        elemList.html('');

    $('#search-processing').show();
    $('#search-no-results').hide();

    let params = {
        'wsId'  : 57,
        'query' : $('#search-input').val(),
        'limit' : 30
    }

    $.get('/plm/search-descriptor', params, function(response) {

        if((typeof response.data.items === 'undefined') || (response.data.items.length === 0)) {

            $('#search-no-results').show();

        } else {

            for(record of response.data.items) {

                let elemTile = genTile(record.__self__, '', '', 'view_in_ar', record.descriptor, record.workspaceLongName);
                    elemTile.appendTo(elemList);
                    elemTile.click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        clickSearchResult($(this));
                    });

            }

            // $('#search-list').children().each(function() {
            //     insertTileAction($(this));
            // });

        }

        $('#search-processing').hide();
        insertTileActions('search-list');
        
    });

}


// Search for raw materials
function performSearchMaterials() {

    let elemList = $('#materials-list');
        elemList.html('');

    $('#materials-processing').show();
    $('#materials-no-results').hide();

    let params = {
        'wsId'  : 57,
        'query' : $('#materials-input').val(),
        'limit' : 30
    }

    $.get('/plm/search-descriptor', params, function(response) {

        elemList.html('');

        if((typeof response.data.items === 'undefined') || (response.data.items.length === 0)) {

            $('#materials-no-results').show();

        } else {

            for(record of response.data.items) {

                let elemTile = genTile(record.__self__, '', '', 'view_in_ar', record.descriptor, record.workspaceLongName);
                    elemTile.appendTo(elemList);
                    elemTile.click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        clickSearchResult($(this));
                    });

            }

        }

        $('#materials-processing').hide();
        insertTileActions('materials-list');
        
    });

}
function clickSearchResult(elemClicked) {

    let title = elemClicked.attr('data-title');
    let tabId = elemClicked.closest('.tab-group-main').attr('id');

    if(tabId === 'search') {

        let partNumber = title.split(' - ')[0];
        openComponent(partNumber);

    } else if(tabId === 'materials'){

        selectComponents([title]);

    }

}


function clickWorkspaceViewItem(elemClicked) { openItem(elemClicked); }
function clickRecentItem(elemClicked)        { openItem(elemClicked); }
function clickBookmarkItem(elemClicked)      { openItem(elemClicked); }
function openItem(elemClicked) {

    let title       = elemClicked.attr('data-title');
    let partNumber  = title.split(' - ')[0];

    openComponent(partNumber);

}


function changeWorkspaceViewDone(id) {}
function insertRecentItemsDone(id) { insertTileActions(id + '-recents'); }
function insertBookmarksDone(id) { insertTileActions(id + '-bookmarks'); }