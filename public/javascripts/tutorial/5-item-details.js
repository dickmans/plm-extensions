$(document).ready(function() {

    $('#toggle-mow').click(function() {
        $('body').toggleClass('no-mow');
    });
    
    insertMOW({
        headerLabel: 'Your Change Responsibility',
        size : 'xs',
        workspacesIn : ['82','83','84']
    });

    insertWorkspaceViews('57');

});

function clickMOWItem(elemClicked) { openSelectedItem(elemClicked); }
function  clickWorkspaceViewItem(elemClicked, e) { openSelectedItem(elemClicked); }

function openSelectedItem(elemClicked) {

    let link = elemClicked.attr('data-link');

    insertDetails(link);
    insertAttachments(link);

}