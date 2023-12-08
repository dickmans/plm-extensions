$(document).ready(function() {

    setUIEvents();
    // getWSConfig();
    // insertMOW('mow', 'Change Tasks');
    // insertMOW('mow');
    // getChangeTasks();
    // insertViewSelector(80, 'views');


    insertWorkspaceItems('95', 'products', 'Grundrissaufbauten', ['wide', 's'], true, null, 'IMAGE', 'TITLE', 'DESCRIPTION', [], null, ['ENGINEERING_BOM']);
    // insertWorkspaceItems('95', 'products', 'Grundrissaufbauten', ['wide', 'xl'], true, null, 'IMAGE', 'TITLE', 'DESCRIPTION', [
    //     ['with-icon icon-type'    , 'PRODUCT_CATEGORY', true],
    //     ['with-icon icon-calendar', 'PRODUCT_YEAR'    , true]
    // ]);

});



function setUIEvents() {

    $('#close').click(function() {
        $('#products').show();
        $('#details').hide();
        $('.screen').addClass('surface-level-1');
        $('.screen').removeClass('surface-level-2');
    });

}


function clickWorkspaceItem(elemClicked) {

    let link = elemClicked.attr('data-link');

    $('#products').hide();
    $('#details').show();
    $('#details').attr('data-link', link);
    $('#details').find('.panel-title').html(elemClicked.attr('data-title'));
    $('.screen').removeClass('surface-level-1');
    $('.screen').addClass('surface-level-2');

    insertBOM(elemClicked.attr('data-engineering_bom'), null, '');

}