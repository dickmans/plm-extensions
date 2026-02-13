$(document).ready(function() {

    setUIEvents();
    appendProcessing('create');

    if(!isBlank(urlParameters.level)) {
        $('body').removeClass('surface-level-2').addClass('surface-level-' + urlParameters.level);
    }

    //  http://localhost:8080/addins/item?number=002771&level=1
    //  http://localhost:8080/service?number=002771&level=1
    //  http://localhost:8080/service?number=3D-25-000035&wsid=95&level=1&reference=ENGINEERING_BOM&level=1
    
    if(urlParameters.number === '') { 

        $('#create-message').show();
        $('.processing').hide();

    } else {

        let params = {
            wsId     : urlParameters.wsid || common.workspaceIds.items,
            limit    : 1,
            query    : urlParameters.number,
            wildcard : false
        }

        console.log(params);

        if(!isBlank(urlParameters.reference)) params.bulk = true;

        $.post('/plm/search-descriptor', params, function(response) {

            if(response.data.items.length > 0) {

                let data = response.data.items[0];
                let link = response.data.items[0].__self__;
                let url  = window.location.href.split('?')[0];
                
                if(isBlank(urlParameters.reference)) {

                    url += '?dmsId=' + link.split('/')[6];
                    url += '&wsId='  + link.split('/')[4];

                } else {

                    let reference = getSectionFieldValue(data.sections, urlParameters.reference, '', 'link');

                    url += '?dmsId='        + reference.split('/')[6];
                    url += '&wsId='         + reference.split('/')[4];
                    url += '&dmsidcontext=' +      link.split('/')[6];
                    url += '&wsidcontext='  +      link.split('/')[4];

                }
                    
                if(!isBlank(options)) url += '&options=' + options;

                if(!isBlank(urlParameters.type))  url += '&type='  + urlParameters.type;
                if(!isBlank(urlParameters.host))  url += '&host='  + urlParameters.host;
                if(!isBlank(urlParameters.theme)) url += '&theme=' + urlParameters.theme;

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
        // insertCreateForm(config.search.wsId, 'create', true);
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