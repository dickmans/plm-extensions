$(document).ready(function() {

    appendProcessing('parents');
    appendProcessing('relationships');
    appendProcessing('processes');
    appendProcessing('roots');

    setUIEvents();

});


function setUIEvents() {

    $('#tab-parents'      ).click(function() {         insertParents(link); });
    $('#tab-relationships').click(function() {   insertRelationships(link); });
    $('#tab-processes'    ).click(function() { insertChangeProcesses(link); });
    $('#tab-roots'        ).click(function() {           insertRoots(link); });
    $('#tab-mbom'         ).click(function() {            insertMBOM(link); });

    $('.tab').last().click();

}


function clickMOWItem(elemClicked) {

    $('#tasks').hide();
    $('#task').show();

    let link = elemClicked.attr('data-link');

    $('#task-title').html(elemClicked.attr('data-title'));

    insertItemDetails(link, 'task');
    insertManagedItems(link, 'managed-items', 'view_in_ar');

}

function clickManagedItem(elemClicked) {

    let title = elemClicked.attr('data-title');
    let partNumber = title.split(' - ')[0];

    console.log(partNumber);

    openComponent(partNumber);

}


function setSelectedView() {

    $('#views').children().hide();
    $('#list-no-data').addClass('hidden');

    let view = $('#view').val();
    $('#' + view).css('display', 'flex');

    if($('#' + view).children().length === 0) $('#list-no-data').removeClass('hidden');

}


function insertViewSelector(wsId, id, includeBookmarks, includeMOW) {

    if(isBlank(includeBookmarks)) includeBookmarks = false;
    if(isBlank(includeMOW)      ) includeMOW       = false;

    let elemParent = $('#' + id + '-list');
        elemParent.html('');

    $.get('/plm/tableaus', { 'wsId' : wsId}, function(response) {
        // console.log(response);

        for(tableau of response.data) {
            let elemView = $('<div></div>');
                elemView.addClass('workspace-view-selector');
                elemView.attr('data-link', tableau.link);
                elemView.html(tableau.title);
                elemView.appendTo(elemParent);
        }

        $('.workspace-view-selector').click(function() {
            insertWorkspaceView($(this).attr('data-link'));
            // let elemView = $(this);
            //     console.log(elemView.attr('data-link'));
        });

    });


}

function insertWorkspaceView(link, id) {

    let elemParent = $('#tasks-list');
        elemParent.html('');

    let requests = [
        $.get('/plm/tableau-columns', { 'link' : link}),
        $.get('/plm/tableau-data'   , { 'link' : link})
    ];

    Promise.all(requests).then(function(responses) {
        console.log(responses[0]);
        console.log(responses[1]);

        for(item of responses[1].data) {

            let elemRow = $('<div></div>');
                elemRow.html('1');
                elemRow.appendTo(elemParent);

        }

    });

    // $.get('/plm/tableau-data', { 'link' : link}, function(response) {
    //     console.log(response);
    // });

}