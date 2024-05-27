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