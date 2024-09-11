$(document).ready(function() {
    
    let link = '/api/v3/workspaces/86/items/15433';

    let requests = [
        $.get('/plm/descriptor', { link : link }),
        $.get('/plm/details', { link : link }),
        $.get('/plm/grid', { link : link }),
        $.get('/plm/relationships', { link : link })
        // $.get('/plm/blabla', { link : '/api/v3/workspaces/57/items/17611' })
    ]


    // Read PLM data
    // $.get('/plm/descriptor', { link : link }, function(response) {
    //     console.log(response);
    //     $.get('/plm/details', { link : link }, function(response) {
    //         console.log(response);
    //     });
    //     $.get('/plm/grid', { link : link }, function(response) {
    //         console.log(response);
    //     });
    //     $.get('/plm/relationships', { link : link }, function(response) {
    //         console.log(response);
    //     });
    // });

    Promise.all(requests).then(function(responses) {
        console.log(responses);
    });





    // add relationship
    let params = {
        'link'          : link, 
        'relatedId'     : '16514',
        'description'   : 'beschreibung',
        'type'          : 'bi'
    }
    $.get('/plm/add-relationship', params, function(response) {
        console.log(response);
    });



    // add BOM Row
     params = {
        linkParent : '/api/v3/workspaces/57/items/17611',
        linkChild  : '/api/v3/workspaces/57/items/17612',
    }
    $.get('/plm/bom-add', params, function(response) {
        console.log(response);
    });


    // Create new item
    params = { 
        'wsId' : '57',
        'sections' : [{
            'id' : 203,
            'fields' : [
                { fieldId : 'NUMBER', value : 'SAP-0004712' },
                { fieldId : 'TITLE', value : 'Weiterer Erfolg' }
            ]             
        },{
            'id' : 709,
            'fields' : [
                { fieldId : 'PDM_CATEGORY', value : 'Hase' }
            ]            
        }]
    };

    $.post({
        url : '/plm/create', 
        contentType : "application/json",
        data : JSON.stringify(params)
    }, function(response) {
        console.log(response);
    });




});