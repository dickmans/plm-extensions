$(document).ready(function() {

    appendProcessing('search');
    appendProcessing('recents');
    appendProcessing('bookmarks');

    insertWorkspaceViews('views', '57', '', false, 3);

    setUIEvents();

});



function setUIEvents() {

    // Search tab
    $('#tab-search').click(function() {
        $('#search-input').focus();
    });
    $('#search-input').keypress(function(e) {
        if(e.which == 13) {
            performSearch();
        }
    });
    $('#search-submit').click(function() {
        performSearch();
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


function performSearch() {

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

            $('#search-list').children().each(function() {
                insertTileActions($(this));
            });

        }

        $('#search-processing').hide();
        
    });

}
function clickSearchResult(elemClicked) {

    let title = elemClicked.attr('data-title');
    let partNumber = title.split(' - ')[0];

    console.log(partNumber);

    openComponent(partNumber);


}

function clickWorkspaceViewItem(elemClicked) {

    let title = elemClicked.attr('data-title');
    let partNumber = title.split(' - ')[0];

    console.log(partNumber);

    openComponent(partNumber);

}



function insertRecentItemsDone(id) {

    $('#recents-list').children().each(function() {
        insertTileActions($(this));
    });

}
function insertBookmarksDone(id) {

    $('#bookmarks-list').children().each(function() {
        insertTileActions($(this));
    });

}
function insertTileActions(elemTile) {

    let elemActions = $('<div></div>');
        elemActions.addClass('tile-actions');
        elemActions.appendTo(elemTile.children('.tile-details'));

    let elemAction2 = $('<div></div>');
        elemAction2.addClass('button');
        elemAction2.addClass('icon');
        elemAction2.addClass('icon-open');
        elemAction2.attr('title', 'In PLM ansehen');
        elemAction2.appendTo(elemActions);
        elemAction2.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            openItemByLink($(this).closest('.tile').attr('data-link'));
        });

    let elemAction4 = $('<div></div>');
        elemAction4.addClass('button');
        elemAction4.addClass('icon');
        elemAction4.addClass('icon-select');
        elemAction4.attr('title', 'Im Fenster auswählen');
        elemAction4.appendTo(elemActions);
        elemAction4.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            select3D([$(this).closest('.tile').attr('data-link')]);
        });

    let elemAction3 = $('<div></div>');
        elemAction3.addClass('button');
        elemAction3.addClass('icon');
        elemAction3.addClass('icon-new-window');
        elemAction3.attr('title', 'In neuem Fenster öffnen');
        elemAction3.appendTo(elemActions);
        elemAction3.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            openComponent([$(this).closest('.tile').attr('data-link')]);
        });
    
    let elemAction1 = $('<div></div>');
        elemAction1.addClass('button');
        elemAction1.addClass('icon');
        elemAction1.addClass('icon-create');
        elemAction1.attr('title', 'In der aktiven Sitzung hinzuladen');
        elemAction1.appendTo(elemActions);
        elemAction1.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            addComponent([$(this).closest('.tile').attr('data-link')]);
        });
    


}