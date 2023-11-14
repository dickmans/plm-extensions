$(document).ready(function() {

    let params = {
        'wsId'  : config.search.wsId,
        'limit' : 1,
        'query' : partNumber
    }

    $.get('/plm/search-descriptor', params, function(response) {
        
        if(response.data.items.length > 0) {

            let link = response.data.items[0].__self__;

            let url  = window.location.href.split('?')[0];
                url += '?dmsId=' + link.split('/')[6];
                url += '&wsId='  + config.search.wsId;

            window.location = url;

        } else {

            showErrorMessage('Could find matching item when searching for ' + partNumber + ' in field ' + config.search.fieldId, 'Error when searching item');

        }
    })

});