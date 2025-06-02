$(document).ready(function() {

    getSystemAdminSession(function(response) {

        if(response) {

            insertMenu();
            appendOverlay(true);
            insertUsers({
                columnsIn       : ['First Name', 'Last Name', 'Last Login'],
                hideHeaderLabel : true,
                search          : true,
                layout          : 'list',
                contentSizes    : ['m', 's', 'xs','xxs'],
                onClickItem     : function(elemClicked) { selectUser(elemClicked); }
            });

        }

    });

});



// Retrieve select user's MOW
function selectUser(elemClicked) {

    insertMOW({
        userId              : elemClicked.attr('data-link'),
        headerLabel         : elemClicked.attr('data-title'),
        filterByWorkspace   : true,
        filterByDueDate     : true,
        openInPLM           : false,
        search              : true,
        reload              : true,
        onClickItem         : function(elemClicked) { selectMOWEntry(elemClicked); },
        onDblClickItem      : function(elemClicked) { openItemByLink(elemClicked.attr('data-link'));}
    })

}



// Retrieve selected process details
function selectMOWEntry(elemClicked) {

    insertDetails(elemClicked.attr('data-link'), {
        id              : 'item',
        headerLabel     : 'descriptor',
        bookmark        : true,
        editable        : true,
        collapseContents : true,
        toggles         : true,
        openInPLM       : true,
        workflowActions : true
    });

}