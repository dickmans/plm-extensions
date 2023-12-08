$(document).ready(function() {

    // let data = [{
    //     "partNumber" : "CAD_30000012",
    //     "properties" : [
    //         { "key" : "Title",          "value" : "Neuer Name" },
    //         { "key" : "Description",    "value" : "Neue Beschreibung" },
    //         { "key" : "MODEL_YEAR",     "value" : "2024" }
    //     ]
    // }];

    // $("#button-1").click(function() { selectComponents([]); });
    // $("#button-2").click(function() { selectComponents(["CAD_30000012"]); });
    // $("#button-3").click(function() { selectComponents(["CAD_30000012", "CAD_30000052"]); });
    // $("#button-4").click(function() { addComponent("CAD_00019779"); });
    // $("#button-5").click(function() { openComponent("CAD_30000012"); });
    // $("#button-6").click(function() { updateProperties(data); });
    // $("#button-7").click(function() { getComponentsLocked(["CAD_30000012","CAD_30000014","CAD_30000052"]); });
    // $("#button-8").click(function() { isolateComponents(["CAD_30000012", "CAD_30000052"]); });
    // $("#button-9").click(function() { setLifecycleState("CO-000012", "Review"); });
    // $("#button-10").click(function() { setDirty(true); });
    // $("#button-11").click(function() { setDirty(false); });

    // $(".item").click(function() {

    //     $(this).toggleClass("selected");

    //     let partNumbers = [];

    //     $(".item").each(function() {
    //         if($(this).hasClass("selected")) partNumbers.push($(this).attr("data-part-number"));
    //     });

    //     selectComponents(partNumbers);

    // });



    setUIEvents();
    getWSConfig();
    insertMOW('mow', 'Change Tasks');
    // insertMOW('mow');
    // getChangeTasks();
    insertViewSelector(80, 'views');

});



function setUIEvents() {


    // View Selector
    $('#view').change(function() {
        setSelectedView();
    });

    $('#close-task').click(function() {
        $('#tasks').show();
        $('#task').hide();  
    })

}


function getWSConfig() {



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