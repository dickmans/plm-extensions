$(document).ready(function() {

    appendProcessing('create');

    let params = {
        'wsId'  : config.search.wsId,
        'limit' : 1,
        'query' : partNumber
    }

    $.get('/plm/search-descriptor', params, function(response) {
        
        $('.processing').hide();
        $('#search-message').hide();

        if(response.data.items.length > 0) {

            let link = response.data.items[0].__self__;

            let url  = window.location.href.split('?')[0];
                url += '?dmsId=' + link.split('/')[6];
                url += '&wsId='  + link.split('/')[4];

            if(theme !== '') url += '&theme=' + theme;

            window.location = url;

        } else {

            console.log(document.location.href);

            if(document.location.href.indexOf('/addins/') < 0) showErrorMessage('Error when searching item', 'Could find matching item when searching for ' + partNumber + ' in field ' + config.search.fieldId);
            else $('#create-message').show();

        }

    })

    setUIEvents();


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