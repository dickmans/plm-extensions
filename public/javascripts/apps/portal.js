let paramsDetails     = {}
let paramsAttachments = {}
let linkSelected      = '';

$(document).ready(function() {
    
    setUIEvents();
    insertMenu();

    paramsDetails = {
        collapseContents : true,
        hideComputed     : true,
        openInPLM        : true,
        toggles          : true,
        useCache         : true,
        suppressLinks    : config.suppressLinks,
        expandSections   : config.expandSections,
        sectionsEx       : config.sectionsExcluded,
        sectionsIn       : config.sectionsIncluded,
        sectionsOrder    : config.sectionsOrder,
        fieldsEx         : config.fieldsExcluded,
        fieldsIn         : config.fieldsIncluded,
    };

    paramsAttachments = {
        headerLabel : 'Files',
        editable    : false,
        layout      : 'list',
        reload      : false,
        contentSize : 's'
    }

    getFeatureSettings('portal', [], function() {

        insertSearch({ 
            autoClick    : config.autoClick,
            inputLabel   : config.searchInputText,
            limit        : 10,
            number       : true,
            pagination   : true,
            contentSize  : 'xs',
            tileSubtitle : 'Owner',
            tileImage    : config.searchTileImages,
            search       : false,
            workspacesIn : config.workspacesIn,
            onClickItem  : function(elemClicked) { clickTile(elemClicked); }
        });

        insertRecentItems({ 
            headerLabel     : 'Recent Items',
            search          : false,
            reload          : true,
            contentSize     : 'xs',
            tileImage       : config.searchTileImages,
            workspacesIn    : config.workspacesIn,
            afterCompletion : function(id) { openMostRecentItem(); },
            onClickItem     : function(elemClicked) { clickTile(elemClicked); },
        });

        if(!isBlank(urlParameters.link)) {

            $('#toggle-search').click();
            $('#toggle-bom').click();

            linkSelected = urlParameters.link;

            $.get('/plm/descriptor', { link : linkSelected}, function(response) {
                openItem(response.data);
            });

        }

    });

});


function setUIEvents() {

    $('#toggle-search').click(function() {
        $('body').toggleClass('no-search');
        $(this).toggleClass('toggle-off').toggleClass('toggle-on').toggleClass('filled');
        viewerResize();
    });

    $('#toggle-bom').click(function() {
        $('body').toggleClass('no-bom');
        $(this).toggleClass('toggle-off').toggleClass('toggle-on').toggleClass('filled');
        viewerResize();
    });

    $('#toggle-attachments').click(function() {
        $('body').toggleClass('no-attachments');
        $(this).toggleClass('toggle-off').toggleClass('toggle-on').toggleClass('filled');
    });

}

function openMostRecentItem() {

    if(config.openMostRecent) {
        if(isBlank(urlParameters.link)) {
            let elemMostRecent = $('#recents').find('.content-item').first();
            if(elemMostRecent.length > 0) clickTile(elemMostRecent);
        }
    }

    $('#search-search-content-input').focus();

}

function clickTile(elemClicked) {
    
    $('.content-item').removeClass('selected');
    elemClicked.addClass('selected');

    linkSelected = elemClicked.attr('data-link');
    let title    = elemClicked.attr('data-title');

    
    openItem(title);

}
function openItem(title) {

    $('#main').children().removeClass('hidden');
    $('#header-subtitle').html(title).show();

    document.title = title; 
    insertViewer(linkSelected, {
        extensionsIn : config.viewingFormats || common.viewer.extensionsIncluded
    });

    insertDetails(linkSelected, paramsDetails);
    insertAttachments(linkSelected, paramsAttachments);
    insertBOM(linkSelected, {
        contentSizes        : ['m', 'l', 'xl', 'xs', 's'],
        bomViewName         : common.workspaces.items.defaultBOMView,
        depth               : config.bomLevels,
        downloadFiles       : config.downloadFiles,
        downloadRequests    : config.downloadRequests,
        downloadFormats     : config.downloadFormats,
        counters            : true,
        reload              : false,
        openInPLM           : true,
        path                : true,
        search              : true,
        toggles             : true,
        useCache            : true,
        tableColumnsLimit   : 1
    });

}

function clickBOMItem(elemClicked) {

    let link = elemClicked.attr('data-link');

    if(elemClicked.hasClass('selected')) { 

        let partNumber = elemClicked.attr('data-part-number');
        if(isBlank) partNumber = elemClicked.attr('data-title').split(' - ')[0];
        viewerSelectModel(partNumber, {
            isolate   : true,
            ghosting  : true,
            highlight : true
        });

        insertDetails(link, paramsDetails);
        insertAttachments(link, paramsAttachments);

    } else {

        viewerResetSelection();
        insertDetails(linkSelected, paramsDetails);
        insertAttachments(linkSelected, paramsAttachments);

    }

}

// Select BOM item upon viewer selection
function onViewerSelectionChanged(event) {

    if(viewerHideSelected(event)) return;

    if(disableViewerSelectionEvent) return;

    $('.tree-item').removeClass('selected');

    if (event.dbIdArray.length === 1) {

        let parents  = getComponentParents(event.dbIdArray[0]);
        let index    = parents.length -1;
        let elemItem = null;

        for(index; index >= 0; index--) {

            let parent     = parents[index];
            let partNumber = parent.partNumber;

            if(!isBlank(partNumber)) {
                $('.tree-item').each(function() {
                    if($(this).attr('data-part-number') === partNumber) {
                        elemItem = $(this);
                        return false;
                    }
                });
            }
        }

        if(elemItem != null) {
            elemItem.addClass('selected');
            bomDisplayItem(elemItem);
            insertDetails(elemItem.attr('data-link'), paramsDetails);
            insertAttachments(elemItem.attr('data-link'), paramsAttachments);
        }
        
    } else {
        treeScrollToTop('bom');
        resetBOMPath('bom');
        insertDetails(linkSelected, paramsDetails);
        insertAttachments(linkSelected, paramsAttachments);
        viewerResetSelection();
    }

    updatePanelCalculations('bom');

}