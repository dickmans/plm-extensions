$(document).ready(function() {

    appendProcessing('task');
    appendProcessing('add');
    appendOverlay();

    setUIEvents();

    insertWorkspaceViews('tasks', '80', 'Änderungsaufgaben', true, 3, true, true);

});


function setUIEvents() {

    $('#close-task').click(function() {
        $('#tasks').show();
        $('#task').hide();  
        // $('.screen').addClass('surface-level-1');
        // $('.screen').removeClass('surface-level-2');
    })

    $('#add-affected-item').click(function() {

        $('#add-root').html('');

        console.log('getting active document');

        getActiveDocument($(this).attr('data-context-descriptor')).then(partNumber => {
        
            // let partNumber = 'CAD_30000096';

            console.log(partNumber);

            let params = {
                'wsId'  : config.search.wsId,
                'limit' : 1,
                'query' : partNumber
            }        

            $.get('/plm/search-descriptor', params, function(response) {
            
                if(response.data.items.length > 0) {

                    console.log(response.data.items[0]);
        
                    let link = response.data.items[0].__self__;

                    let elemTile = genTile(link, '', '', 'view_in_ar', response.data.items[0].descriptor);
                        elemTile.appendTo($('#add-root'));
                        insertTileActions('add-root');

                    // $('#add-title').html(partNumber);
                    $('#add').show();
                    insertChildrenChanged(link, 'add-list', '80');
                    
                } else {
        
                    showErrorMessage('Error when searching item', 'Could not find matching item when searching for ' + partNumber + ' in field ' + config.search.fieldId);
        
                }
            });        

        });

    });

    $('#workflow-actions').change(function() {
        performWorkflowAction($(this));
    });


    $('#add-select').click(function() {
        $('#add-list').children().addClass('selected');
    });
    $('#add-deselect').click(function() {
        $('#add-list').children().removeClass('selected');
    });
    $('#add-cancel').click(function() {
        $('#add').hide();
    });
    $('#add-confirm').click(function() {
        $('#add').hide();

        let items = [ $('#add-root').children().first().attr('data-link') ];

        $('#add-list').children('.selected').each(function() {
            items.push($(this).attr('data-link'));
        });

        console.log(items);

        $.get('/plm/add-managed-items', { 'link' : $('#task').attr('data-link'), 'items' : items }, function(response) {
            console.log(response);
            // $('.is-selected').click();
            insertManagedItems($('#task').attr('data-link'), 'managed-items', 'settings');
        });

    });

}

function insertChildrenChangedDone(id) { 
    insertTileActions(id); 
    $('#' + id).children().addClass('selected');
}
function clickChildrenChangedItem(elemClicked) { elemClicked.toggleClass('selected'); }


function clickMOWItem(elemClicked) { openChangeTask(elemClicked); }
function clickBookmarkItem(elemClicked) { openChangeTask(elemClicked); }
function clickWorkspaceViewItem(elemClicked) { openChangeTask(elemClicked); }

function openChangeTask(elemClicked) {

    $('#tasks').hide();
    $('#task').show();
    $('.screen').removeClass('surface-level-1');
    $('.screen').addClass('surface-level-2');
    
    $('.is-selected').removeClass('is-selected');
    elemClicked.addClass('is-selected');

    let link = elemClicked.attr('data-link');

    $('#task-title').html(elemClicked.attr('data-title'));
    $('#add-affected-item').attr('data-context-descriptor', elemClicked.attr('data-title'));

    insertItemStatus(link, 'task-status');
    insertItemDetails(link, 'task');
    insertManagedItems(link, 'managed-items', 'settings');
    insertAttachments(link);
    insertWorkflowActions(link);
    insertWorkflowHistory(link, 'history');


}
function insertItemDetailsDone(id) {

    $('.linking.field-value').each(function() {
        let elemField = $(this);
        elemField.addClass('surface-level-1');
        let fieldId = elemField.attr('data-id');
        if(fieldId === 'AFFECTED_ITEM') {

            let title = elemField.html();

            if(!isBlank(title)) {

            

                let elemTile = genTile(elemField.attr('data-item-link'), '', '', 'view_in_ar', elemField.html());
                elemField.html('');
                elemField.addClass('tiles');
                elemField.addClass('list');
                elemField.addClass('xxxs');
                elemField.attr('id', 'field-AFFECTED_ITEM');
                elemTile.appendTo(elemField);
                elemTile.css('color', 'white');
                // insertTileActions('field-AFFECTED_ITEM');
                insertTileAction(elemTile, false, true, true, true, true);

            }

        }

       

    });

}
function insertManagedItemsDone() {

    insertTileActions('managed-items-list');

}


function performWorkflowAction(elemAction) {

    $('#overlay').show();

    let link = elemAction.attr('data-link');

    $.get('/plm/transition', { 'link' : link, 'transition' : elemAction.val()}, function(response) {
        $('#overlay').hide();
        $('.is-selected').click();
    });

}



function clickManagedItem(elemClicked) {

    let title = elemClicked.attr('data-title');
    let partNumber = title.split(' - ')[0];

    console.log(partNumber);

    openComponent(partNumber);

}


// function setSelectedView() {

//     $('#views').children().hide();
//     $('#list-no-data').addClass('hidden');

//     let view = $('#view').val();
//     $('#' + view).css('display', 'flex');

//     if($('#' + view).children().length === 0) $('#list-no-data').removeClass('hidden');

// }


// function insertViewSelector(wsId, id, includeBookmarks, includeMOW) {

//     if(isBlank(includeBookmarks)) includeBookmarks = false;
//     if(isBlank(includeMOW)      ) includeMOW       = false;

//     let elemParent = $('#' + id + '-list');
//         elemParent.html('');

//     $.get('/plm/tableaus', { 'wsId' : wsId}, function(response) {
//         // console.log(response);

//         for(tableau of response.data) {
//             let elemView = $('<div></div>');
//                 elemView.addClass('workspace-view-selector');
//                 elemView.attr('data-link', tableau.link);
//                 elemView.html(tableau.title);
//                 elemView.appendTo(elemParent);
//         }

//         $('.workspace-view-selector').click(function() {
//             insertWorkspaceView($(this).attr('data-link'));
//             // let elemView = $(this);
//             //     console.log(elemView.attr('data-link'));
//         });

//     });


// }

// function insertWorkspaceView(link, id) {

//     let elemParent = $('#tasks-list');
//         elemParent.html('');

//     let requests = [
//         $.get('/plm/tableau-columns', { 'link' : link}),
//         $.get('/plm/tableau-data'   , { 'link' : link})
//     ];

//     Promise.all(requests).then(function(responses) {
//         console.log(responses[0]);
//         console.log(responses[1]);

//         for(item of responses[1].data) {

//             let elemRow = $('<div></div>');
//                 elemRow.html('1');
//                 elemRow.appendTo(elemParent);

//         }

//     });

//     // $.get('/plm/tableau-data', { 'link' : link}, function(response) {
//     //     console.log(response);
//     // });

// }