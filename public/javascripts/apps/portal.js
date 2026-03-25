let paramsDetails     = {}
let paramsAttachments = {}
let linkSelected      = '';
let wsConfig          = { workspaceId : '' };

$(document).ready(function() {
    
    setUIEvents();
    insertMenu();

    wsConfig.workspaceId = config.workspaceId || common.workspaceIds.items;
    wsConfig.bomViewName = config.panels.insertDetails.bomViewName || common.workspaces.items.defaultBOMView;

    let requests = [
        $.get('/plm/sections' , { wsId : wsConfig.workspaceId, useCache : config.panels.insertDetails.useCache || true }),
        $.get('/plm/fields'   , { wsId : wsConfig.workspaceId, useCache : config.panels.insertDetails.useCache || true }),
        $.get('/plm/bom-views', { wsId : wsConfig.workspaceId, useCache : config.panels.insertBOM.useCache     || true })
    ];

    getFeatureSettings('portal', requests, function(responses) {

        wsConfig.sections = responses[0].data;
        wsConfig.fields   = responses[1].data;

        getBOMViewDefinition(responses[2].data.bomViews, wsConfig.bomViewName, wsConfig);

        let paramsSearch = config.panels.insertSearch;
            paramsSearch.workspacesIn = [wsConfig.workspaceId];
            paramsSearch.onClickItem  = function(elemClicked) { clickTile(elemClicked); };

        insertSearch(paramsSearch);

        let paramsRecentItems = config.panels.insertRecentItems;
            paramsRecentItems.workspacesIn    = [wsConfig.workspaceId];
            paramsRecentItems.afterCompletion = function(id) { openMostRecentItem(); };
            paramsRecentItems.onClickItem     = function(elemClicked) { clickTile(elemClicked); };

        insertRecentItems(paramsRecentItems);

        paramsDetails     = config.panels.insertDetails;
        paramsAttachments = config.panels.insertAttachments;

        if(!isBlank(urlParameters.link)) {

            $('#toggle-search').click();
            $('#toggle-bom').click();

            linkSelected = urlParameters.link;

            $.get('/plm/descriptor', { link : linkSelected }, function(response) {
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

    $('#toggle-details').click(function() {
        $('body').toggleClass('no-details');
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
        if(!settings['recents'].isReload) {
            if(isBlank(urlParameters.link)) {
                let elemMostRecent = $('#recents').find('.content-item').first();
                if(elemMostRecent.length > 0) clickTile(elemMostRecent);
            }
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

    let paramsBOM = config.panels.insertBOM;
        paramsBOM.bomViewId = wsConfig.bomViewId;
        paramsBOM.onClickItem = function(elemClicked) { onClickBOMItem(elemClicked); }

    insertDetails(linkSelected, paramsDetails, wsConfig);
    insertAttachments(linkSelected, paramsAttachments);
    insertBOM(linkSelected, paramsBOM);

}

function onClickBOMItem(elemClicked) {

    let link = elemClicked.attr('data-link');

    if(elemClicked.hasClass('selected')) { 

        let partNumber = elemClicked.attr('data-part-number');
        if(isBlank) partNumber = elemClicked.attr('data-title').split(' - ')[0];
        viewerSelectModel(partNumber, {
            isolate   : true,
            ghosting  : true,
            highlight : true
        });

        insertDetails(link, paramsDetails, wsConfig);
        insertAttachments(link, paramsAttachments);

    } else {

        viewerResetSelection();
        insertDetails(linkSelected, paramsDetails, wsConfig);
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
        treeResetPath('bom');
        insertDetails(linkSelected, paramsDetails);
        insertAttachments(linkSelected, paramsAttachments);
        viewerResetSelection();
    }

    updatePanelCalculations('bom');

}