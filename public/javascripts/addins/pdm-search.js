
$(document).ready(function() {

    appendOverlay(true);
    appendProcessing('basic-search');  
    setUIEvents();

});


function setUIEvents() {

    $('#basic-input').focus();
    $('#basic-input').keypress(function(e) {
        if(e.which == 13) {
            performBasicSearch();
        }
    });
    $('#basic-submit').click(function() { performBasicSearch(false); });    
    $('#basic-next'  ).click(function() { performBasicSearch(true);  });

}



// Perform Basic Search
function performBasicSearch(next) {

    let timestamp = new Date().getTime();
    let elemInput = $('#basic-input');
    let elemList  = $('#basic-list');
    let value     = elemInput.val();
    let url       = '/vault/search';
    let params    = { timestamp : timestamp };

    if(value === '') return;

    if(!next) {
        elemList.html(''); 
        params.query       = value,
        params.placeholder = true,
        params.extended    = false,
        params.limit       = 20,
        params.timestamp   = timestamp
    } else {
        url = '/vault/continue-search'
        params.next = elemList.attr('data-next');
    }

    elemList.attr('data-timestamp', timestamp);
    elemList.hide();

    $('#basic-search-processing').show();
    $('#basic-no-results').hide();
    $('#basic-footer').addClass('hidden');
    $('#basic-next').hide();

    $.get(url, params, function(response)  {   
        
        if(timestamp == response.params.timestamp) {

            $('#basic-search-processing').hide();

            if(response.data.results.length === 0) {

                $('#basic-no-results').show();
    
            } else {

                for(let result of response.data.results) {
                    if(result.entityType !== 'Folder') {
                        let elemTile = genPDMTile(result, {
                            tileNumber : elemList.children().length + 1,
                            addTileActions : true
                        });
                        if(elemTile !== null) elemTile.appendTo(elemList);
                    }
                }

                var counter = elemList.children().length;
                let nextUrl = (isBlank(response.data.pagination.nextUrl)) ? '' : response.data.pagination.nextUrl;

                elemList.attr('data-next', nextUrl);
                elemList.show();
                $('#basic-total').html(counter + ' of ' + response.data.pagination.totalResults + ' total results');
                $('#basic-footer').removeClass('hidden');

                if(!isBlank(nextUrl)) $('#basic-next').show();

            }

        }
        
    });

}