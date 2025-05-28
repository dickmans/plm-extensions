$(document).ready(function() {
    
    setUIEvents();
    insertMenu();

    getFeatureSettings('portal', [], function() {

        insertSearch({ 
            autoClick    : config.portal.autoClick,
            inputLabel   : 'Enter part number',
            limit        : 15,
            number       : true,
            contentSize  : 'xs',
            tileSubtitle : 'Owner',
            search       : false,
            workspacesIn : config.portal.workspacesIn,
            onClickItem  : function(elemClicked) { openItem(elemClicked); }
        });

        insertRecentItems({ 
            headerLabel  : 'Recent Items',
            search       : false,
            reload       : true,
            contentSize  : 'xs',
            workspacesIn : config.portal.workspacesIn,
            onClickItem  : function(elemClicked) { openItem(elemClicked); },
        });

        if(!isBlank(wsId) && !isBlank(dmsId)) {

            $('#toggle-search').click();
            $('#toggle-bom').click();
            openItem('/api/v3/workspaces/' + wsId + '/items/' + dmsId);

        }

    });

});


function setUIEvents() {

    $('#toggle-search').click(function() {
        $('body').toggleClass('no-search');
        $(this).toggleClass('icon-toggle-off').toggleClass('icon-toggle-on').toggleClass('filled');
        viewerResize();
    });

    $('#toggle-bom').click(function() {
        $('body').toggleClass('no-bom');
        $(this).toggleClass('icon-toggle-off').toggleClass('icon-toggle-on').toggleClass('filled');
        viewerResize();
    });

    $('#toggle-attachments').click(function() {
        $('body').toggleClass('no-attachments');
        $(this).toggleClass('icon-toggle-off').toggleClass('icon-toggle-on').toggleClass('filled');
    });

}

function openItem(elemClicked) {

    let link  = elemClicked.attr('data-link');
    let title = elemClicked.attr('data-title');

    $('.item-panel').show();
    $('#header-subtitle').html(title);

    document.title = title;

    insertBOM(link, {
        reload              : false,
        openInPLM           : true,
        toggles             : true,
        search              : true,
        path                : true,
        counters            : true,
        tableColumnsLimit   : 1
    });

    insertViewer(link);

    insertDetails(link, {
        collapseContents    : true,
        hideComputed        : true,
        openInPLM           : true,
        toggles             : true,
        suppressLinks       : true,
        expandSections      : config.portal.expandSections,
        sectionsEx          : config.portal.sectionsExcluded,
        sectionsIn          : config.portal.sectionsIncluded,
        sectionsOrder       : config.portal.sectionsOrder,
        fieldsEx            : config.portal.fieldsExcluded,
        fieldsIn            : config.portal.fieldsIncluded
    });

    insertAttachments(link, {
        headerLabel : 'Files',
        editable    : false,
        layout      : 'list',
        reload      : false,
        contentSize : 's'
    });

}


function clickBOMItem(elemClicked) {

    if(elemClicked.hasClass('selected')) { 

        let partNumber = elemClicked.attr('data-part-number');
        if(isBlank) partNumber = elemClicked.attr('data-title').split(' - ')[0];
        viewerSelectModel(partNumber, {
            isolate   : true,
            ghosting  : true,
            highlight : true
        });

    } else {

        viewerResetSelection();

    }

}
