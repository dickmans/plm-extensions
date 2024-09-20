$(document).ready(function() {
    
    setUIEvents();

    getApplicationFeatures('portal', [], function() {});

    insertSearch({ 
        autoClick : config.portal.autoClick,
        workspace : config.portal.workspace,
        size : 'xs'
    });

    insertRecentItems({ 
        headerLabel  : 'Recent Items',
        size         : 'xs',
        workspacesIn : [ config.portal.workspace ]
    });

    if(!isBlank(wsId) && !isBlank(dmsId)) {

        $('#toggle-search').click();
        $('#toggle-bom').click();
        openItem('/api/v3/workspaces/' + wsId + '/items/' + dmsId);

    }

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

function clickSearchResult(elemClicked, e) { openItem(elemClicked.attr('data-link')); }
function clickRecentItem(elemClicked,   e) { openItem(elemClicked.attr('data-link')); }

function openItem(link) {

    $('.item-panel').show();

    $.get('/plm/descriptor', { 'link' : link }, function(response) {
        $('#header-subtitle').html(response.data);
    });

    insertBOM(link, {
        compactDisplay : true
    });

    insertViewer(link);

    insertDetails(link, {
        hideComputed : true,
        sectionsEx   : config.portal.sectionsExcluded,
        sectionsIn   : config.portal.sectionsIncluded,
        fieldsEx     : config.portal.fieldsExcluded,
        fieldsIn     : config.portal.fieldsIncluded
    });

    insertAttachments(link, {
        layout : 'list',
        size   : 's'
    });

}


function clickBOMItemDone(elemClicked) {

    if(elemClicked.hasClass('selected')) { 
        let partNumber = elemClicked.attr('data-part-number');
        if(isBlank) partNumber = elemClicked.attr('data-title').split(' - ')[0];
        viewerSelectModel(partNumber, {
            isolate : true,
            ghosting : true,
            highlight : true
        });
    } else {
        viewerResetSelection();
    }

}
