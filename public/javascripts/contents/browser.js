function insertBrowser(id, tabs, params) {

    if(isBlank(id    )) id     = 'browser';
    if(isBlank(tabs  )) tabs   = [];
    if(isBlank(params)) params = {};

    if(isBlank(params.enableDragging )) params.enableDragging  = true;
    if(isBlank(params.enableDetails  )) params.enableDetails   = false;
    if(isBlank(params.settingsDetails)) params.settingsDetails = {}

    let elemBrowser = $('#' + id);
        elemBrowser.html('').show();
        
    let elemTabs = $('<div></div>').appendTo(elemBrowser)
        .attr('id', id + '-tabs')
        .addClass('tabs')
        .addClass('browser-tabs');

    let elemContents = $('<div></div>').appendTo(elemBrowser)
        .attr('id', id + '-contents')
        .addClass('browser-contents');

    let index         = 1;
    let surfaceLevel = getSurfaceLevel(elemBrowser);

    for(let tab of tabs) {

        let elemTab = $('<div></div>').appendTo(elemTabs)
            .html(tab.label)
            .click(function() {
                clickBrowserTab($(this));
            });

        if(!isBlank(tab.icon)) elemTab.addClass('with-icon').addClass(tab.icon);
        if(isBlank(tab.settings)) tab.settings = {};
        if(isBlank(tab.id)) {
            if(isBlank(tab.settings.id)) tab.id = 'browser-tab-' + index++;
            else tab.id = tab.settings.id;
        }

        if(isBlank(tab.settings.id)) tab.settings.id = tab.id;

        tab.settings.hideHeaderLabel = true;

        if(params.enableDetails) {
            tab.settings.onClickItem =function(elemClicked) { insertDetails(elemClicked.attr('data-link'), params.settingsDetails); };
        }

        if(params.enableDragging) {
            tab.settings.afterCompletion = function(id, data) { 
                $('#' + id).find('.content-item').each(function() {
                    $(this).attr('draggable', 'true')
                        // .attr('ondragstart', params.ondragstart)
                        // .attr('ondragend', params.ondragend);
                        .attr('ondragstart', 'dragStartHandler(event)')
                        .attr('ondragend', 'dragEndHandler(event)');
                });
            }
        }

        $('<div></div>').appendTo(elemContents)
            .attr('id', tab.id)
            .addClass(surfaceLevel);
            
        insertBrowserTabContent(tab);

    }

    elemTabs.children().first().click();

}
function clickBrowserTab(elemTab) {

    elemTab.addClass('selected');
    elemTab.siblings().removeClass('selected');

    let elemContents = elemTab.parent().next().children();

    elemContents.each(function() { $(this).addClass('hidden') });
    elemTab.parent().next().children(':eq(' + elemTab.index() + ')').removeClass('hidden');

}
function insertBrowserTabContent(tab) {

    switch(tab.type) {

        case 'bookmarks':
            insertBookmarks(tab.settings);
            break;

        case 'recents':
            insertRecentItems(tab.settings)
            break;

        case 'results':
            insertResults(tab.wsId, tab.filters, tab.settings);
            break;

        case 'search':
            tab.settings.hideHeader = true;
            insertSearch(tab.settings)
            break;

        case 'views':
            insertWorkspaceViews(tab.wsId, tab.settings);
            break;

    }

}