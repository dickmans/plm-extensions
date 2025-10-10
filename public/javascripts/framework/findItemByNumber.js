$(document).ready(function() {

    setUIEvents();
    appendProcessing('create');

    if(number === '') { 

        $('#create-message').show();
        $('.processing').hide();

    } else {

        let params = {
            wsId     : config.items.wsId,
            limit    : 1,
            query    : number,
            wildcard : false
        }

        $.post('/plm/search-descriptor', params, function(response) {

            if(response.data.items.length > 0) {

                $('.processing').hide();
                $('#search-message').hide();

                let link = response.data.items[0].__self__;

                let url  = window.location.href.split('?')[0];
                    url += '?dmsId='      + link.split('/')[6];
                    url += '&wsId='       + link.split('/')[4];
                    url += '&descriptor=' + response.data.items[0].descriptor;
                    
                if(!isBlank(options)) url += '&options=' + options;
                if(!isBlank(host))    url += '&host='    + host;

                if(theme !== '') url += '&theme=' + theme;

                window.location = url;

            } else if(options.includes('autoCreate')) {

                console.log('Item not found in PLM, searching in Vault ...');

                $.get('/vault/basic-search', {
                    query       : number,
                    placeholder : false,
                    extended    : true,
                    limit       : 1
                }, function(response) {

                    if(response.data.results.length === 0) {

                        $('.processing').hide();
                        $('#search-message').hide();
                        $('.copyFromVaultFailed').show();
                        itemNotFound();

                    } else {
                        console.log('Copying item from Vault');
                    }

                });
            } else {
                $('.processing').hide();
                $('#search-message').hide();
                // $('.copyFromVaultFailed').hide();
                itemNotFound();

            }

        })


    }

});

function setUIEvents() {

    $('#create-action').click(function() {
        $('#create-processing').show();
        insertCreateForm(config.search.wsId, 'create', true);
        $('#create-title').html($(this).html());
        $('#search-screen').hide();
        $('#create-screen').show();
    });

    $('#create-cancel').click(function() {
        $('#search-screen').show();
        $('#create-screen').hide();
    });

}


function itemNotFound() {

    if(document.location.href.indexOf('/addins/') < 0) showErrorMessage('Error when searching item', 'Could find matching item when searching for ' + number);
    else $('#create-message').show();

}