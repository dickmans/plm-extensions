
$(document).ready(function() {

    appendOverlay(true);
    appendProcessing('basic-search');

    // let elemList = $('<ul></ul>').appendTo($('#basic-list'));

    // if(typeof chrome.webview                    === 'undefined') elemList.append('<li>1 chrome.webview does not exist</li>');
    // if(typeof window.hostObjects                === 'undefined') elemList.append('<li>2 window.hostObjects does not exist</li>');
    // if(typeof window.plmAddin                   === 'undefined') elemList.append('<li>3 window.plmAddin does not exist</li>');
    // if(typeof window.webview                    === 'undefined') elemList.append('<li>4 window.webview does not exist</li>');
    // if(typeof window.JavascriptObjectRepository === 'undefined') elemList.append('<li>5 window.JavascriptObjectRepository does not exist</li>');
    // if(typeof window.JavaScriptInterop          === 'undefined') elemList.append('<li>6 window.JavaScriptInterop does not exist</li>');
    // if(typeof JavaScriptInterop                 === 'undefined') elemList.append('<li>7 JavaScriptInterop does not exist</li>');
    // if(typeof JavascriptObjectRepository        === 'undefined') elemList.append('<li>8 JavascriptObjectRepository does not exist</li>');


    

    // $('#basic-list').append($('<button onclick="document.location.href = document.location.href">Reload</button>'));
    // $('#basic-list').append($('<button onclick="test01();">CefSharp</button>'));
    // $('#basic-list').append($('<button onclick="test02();">gotoVaultFolder</button>'));

    
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

        if($('#basic-list').attr('data-timestamp') == response.params.timestamp) {

            $('#basic-search-processing').hide();

            if(response.data.results.length === 0) {

                $('#basic-no-results').show();
    
            } else {

                for(let result of response.data.results) {
                    let elemTile = genPDMTile(result, {
                        tileNumber : elemList.children().length + 1
                    });
                    if(elemTile !== null) elemTile.appendTo(elemList);
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