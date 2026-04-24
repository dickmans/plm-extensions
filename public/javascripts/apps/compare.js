let bomComparisonCounters = {}
let dataItemVersions      = [];
let links                 = {};
let bomFinishedLoading    = {};
let syncScrollBOM         = '';

const idViewerLeft   = 'viewerLeft';
const idViewerRight  = 'viewerRight';
const idBOMLeft      = 'bomLeft';
const idBOMRight     = 'bomRight';
const idDetailsLeft  = 'detailsLeft';
const idDetailsRight = 'detailsRight';
const classNames     = {
    match             : 'bom-comparison-match',
    differentQuantity : 'bom-comparison-different-quantity',
    differentRevision : 'bom-comparison-different-revision',
    differentNumber   : 'bom-comparison-different-number',
    missing           : 'bom-comparison-missing',
    placeholder       : 'bom-comparison-placeholder'
}

let paramsDetailsLeft, paramsDetailsRight, paramsBOMRight;


$(document).ready(function() {
    
    appendOverlay();
    setUIEvents();

    let compareWith = urlParameters.comparewith  || '';
    let compareSelf = (compareWith === 'self') ? true : (compareWith === urlParameters.dmsid);
    let requests    = [ 
        $.get('/plm/details', { link : urlParameters.link }),
        $.get('/plm/versions'  , { link : urlParameters.link }) 
    ];
    
    getFeatureSettings('bomcompare', requests, function(responses) {

        dataItemVersions         = responses[1];
        links.left               = urlParameters.link;
        bomFinishedLoading.left  = false;
        bomFinishedLoading.right = false;

        if(compareSelf) {
            let versionsCount = responses[1].data.versions.length;
            if(versionsCount > 1) {
                let workingId = responses[1].data.versions[0].__self__.split('/').pop();
                if(workingId === urlParameters.dmsId) {
                    if(dataItemVersions.data.versions.length > 1) {
                        compareWith = responses[1].data.versions[1].__self__.split('/').pop();
                    }
                } else compareWith = workingId;
            } else compareWith = '';
        }
        
        $('#header-subtitle').html(responses[0].data.title);

        paramsDetailsLeft    = config.panels.insertDetailsLeft;
        paramsDetailsLeft.id = idDetailsLeft;    

        paramsDetailsRight    = config.panels.insertDetailsRight;
        paramsDetailsRight.id = idDetailsRight;  
       
        paramsBOMRight                  = config.panels.insertBOMRight;
        paramsBOMRight.id               = idBOMRight;
        paramsBOMRight.collapseContents = true;
        paramsBOMRight.onClickItem      = function(elemClicked) { clickBOMItem(elemClicked, 'Right'); };
        paramsBOMRight.afterCompletion  = function(id) { bomFinishedLoading.right = true; afterBOMCompletion(id, idBOMLeft); };   
        
        insertViewer(urlParameters.link, {
            id            : idViewerLeft,
            viewerId      : 0,
            syncViewpoint : true,
            syncExplosion : true,
            features      : config.viewerFeatures
        });
        
        let paramsBOMLeft = config.panels.insertBOMLeft;
            paramsBOMLeft.id               = idBOMLeft;
            paramsBOMLeft.collapseContents = true;
            paramsBOMLeft.onClickItem      = function(elemClicked) { clickBOMItem(elemClicked, 'Left'); };
            paramsBOMLeft.afterCompletion  = function(id) { bomFinishedLoading.left = true; afterBOMCompletion(id, idBOMRight); };

        insertBOM(urlParameters.link, paramsBOMLeft);  

        insertDetails(urlParameters.link, paramsDetailsLeft);

        if(compareWith !== '') openComparisonItem('/api/v3/workspaces/' + common.workspaceIds.items + '/items/' + compareWith);
        else $('body').removeClass('no-selector');

        let paramSearch = config.panels.insertSearch;
            paramSearch.id           = 'search';
            paramSearch.workspaceIds = [ common.workspaceIds.items ];
            paramSearch.onClickItem  = function(elemClicked) { openSelectedItem(elemClicked); }

        insertSearch(paramSearch);

        let paramRevisions = config.panels.insertRevisions;
            paramRevisions.onClickItem = function(elemClicked) { openSelectedItem(elemClicked); }

        insertRevisions(urlParameters.link, paramRevisions);

        let paramsRecentItems = config.panels.insertRecentItems;
            paramsRecentItems.workspacesIn = [ common.workspaceIds.items ],
            paramsRecentItems.onClickItem  = function(elemClicked) { openSelectedItem(elemClicked); }

        insertRecentItems(paramsRecentItems);

        let paramsBookmarks = config.panels.insertBookmarks;
            paramsBookmarks.workspacesIn = [ common.workspaceIds.items ],
            paramsBookmarks.onClickItem  = function(elemClicked) { openSelectedItem(elemClicked); }        

        insertBookmarks(paramsBookmarks);

    });

});

function setUIEvents() {

    $('#toggle-sync-viewers').click(function() {
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
        viewersSyncDisabled = $(this).hasClass('toggle-off');
    });
    $('#toggle-details').click(function() {
        $('body').toggleClass('no-details-panels');
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
    });

    $('#viewer-size').click(function() {
        $('body').removeClass('viewer-size-normal')
            .removeClass('viewer-size-large')
            .removeClass('viewer-size-small')
            .removeClass('viewer-size-float')
            .removeClass('viewer-size-none');
        $('body').addClass('viewer-size-' + $(this).val());
        viewerResize(250);
    });    

    $('#open-selector').click(function() {
        $('body').toggleClass('no-selector');
    });

    $('#panel-tabs div').click(function() {
        $(this).addClass('selected').siblings().removeClass('selected');
        let id = $(this).attr('data-content-id');
        let elemContent = $('#' + id);
        elemContent.removeClass('hidden').siblings().addClass('hidden');
    });

    $('#panel-tabs div').first().click();

    $('.button.counter'           ).click(function(e) { clickCounter(    $(this)); });
    $('.button.counter .icon-prev').click(function(e) { clickPrevNext(e, $(this)); });
    $('.button.counter .icon-next').click(function(e) { clickPrevNext(e, $(this)); });

    $('#hide-matches').click(function(e) {
        e.stopPropagation();
        $('body').toggleClass('hide-matches');
        if($('body').hasClass('hide-matches')) { $('.' + classNames.match).addClass('hidden'); }
        else $('.' + classNames.match).removeClass('hidden');
        collapseAllNodes(idBOMLeft);
        collapseAllNodes(idBOMRight);
    });

    $('#apply-colors').click(function() {
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
        if($(this).hasClass('toggle-off')) {
            viewerResetColors({ id : idViewerLeft });
            viewerResetColors({ id : idViewerRight });  
        } else applyViewerColors();
    });

}


// Open comparison for selected item (or item defined by URL)
function openSelectedItem(elemClicked) {

    let link = elemClicked.attr('data-link');
    openComparisonItem(link);

}
function openComparisonItem(link) {

    $('body').addClass('no-selector');

    $('*').removeClass(classNames.match);
    $('*').removeClass(classNames.differentNumber);
    $('*').removeClass(classNames.differentQuantity);
    $('*').removeClass(classNames.differentRevision);   
    $('*').removeClass(classNames.missing);   
    
    $('.' + classNames.placeholder).remove();

    updateURLParameter(null, 'compareWith', link.split('/').pop(), true);
    
    links.right              = link;
    bomFinishedLoading.right = false;

    insertViewer(link, {
        id            : idViewerRight,
        viewerId      : 1,
        syncViewpoint : true,
        syncExplosion : true,
        features      : config.viewerFeatures
    });

    insertBOM(link, paramsBOMRight);

    insertDetails(link, paramsDetailsRight);

}


// Once both BOMs finished loading, start comparison
function afterBOMCompletion(id, idOther) {

    $('#' + id + '-action-expand-all').click(function() { expandAllNodes(idOther); });
    $('#' + id + '-action-collapse-all').click(function() { collapseAllNodes(idOther); });

    if(bomFinishedLoading.left  === false) return;
    if(bomFinishedLoading.right === false) return;

    compareBOMs();
    setBOMComparisonEvents();

}
function compareBOMs() {

    let elemTBodySource = $('#' + idBOMLeft  + '-tbody');
    let elemTBodyTarget = $('#' + idBOMRight + '-tbody');

    let elemSource = elemTBodySource.children('.content-item').first();
    let elemTarget = elemTBodyTarget.children('.content-item').first();

    compareBOMRow(elemSource, elemTarget);
    setBOMComparionsCounters();

}
function compareBOMRow(elemSource, elemTarget) {

    let levelSource = elemSource.attr('data-level-path');
    let levelTarget = elemTarget.attr('data-level-path');

    if(levelSource === levelTarget) {
        if(elemSource.attr('data-root-link') === elemTarget.attr('data-root-link')) {
            if(elemSource.attr('data-revision') === elemTarget.attr('data-revision')) {
                if(elemSource.attr('data-quantity') === elemTarget.attr('data-quantity')) {
                    result = 'match';
                } else { result = 'different-quantity'; }
            } else { result = 'different-revision'; }
        } else { result = 'different-root'; }

        switch (result) {

            case 'different-root':
                elemSource.addClass(classNames.differentNumber);
                elemTarget.addClass(classNames.differentNumber);
                // elemSource = elemSource.next();
                // elemTarget = elemTarget.next();
                // bomComparisonCounters.mmRoot++;
                break;

            case 'different-quantity':
                elemSource.addClass(classNames.differentQuantity);
                elemTarget.addClass(classNames.differentQuantity);
                // elemSource = elemSource.next();
                // elemTarget = elemTarget.next();
                // bomComparisonCounters.mmQuantity++;
                break;

            case 'different-revision':
                elemSource.addClass(classNames.differentRevision);
                elemTarget.addClass(classNames.differentRevision);
                // elemSource = elemSource.next();
                // elemTarget = elemTarget.next();
                // bomComparisonCounters.mmRevision++;
                break;

            case 'match':
                elemSource.addClass(classNames.match);
                elemTarget.addClass(classNames.match);

                // bomComparisonCounters.match++;
                break;

        }

        elemSource = elemSource.next();
        elemTarget = elemTarget.next();

    } else {
    
        let lowerLevel = getLowerLevel(levelSource, levelTarget);

        if(lowerLevel === 'source') {

            // elemSource.addClass('bom-comparison-missing');
            insertBOMComparisonPlaceholder(elemSource, elemTarget);
            
            elemSource = elemSource.next();


            // let elemPlaceholder = $('<tr></tr>').insertBefore(elemTarget)
            //     .addClass('content-item')
            //     .addClass('bom-comparison-placeholder');

            // $('<td></td>').appendTo(elemPlaceholder)
            //     .attr('colspan', elemTarget.children().length);

        } else {

            insertBOMComparisonPlaceholder(elemTarget, elemSource);

           elemTarget = elemTarget.next();

            // let elemPlaceholder = $('<tr></tr>').insertBefore(elemSource)
            //     .addClass('content-item')
            //     .addClass('bom-comparison-placeholder');

            // $('<td></td>').appendTo(elemPlaceholder)
            //     .attr('colspan', elemSource.children().length);
        }

    }

    if(elemSource.length === 0) {
        if(elemTarget.length > 0) {
            do {
                let elemAfter = $('#' + idBOMLeft + '-tbody').children().last();
                insertBOMComparisonPlaceholder(elemTarget, null, elemAfter);
                elemTarget = elemTarget.next();
            } while (elemTarget.length > 0);
        }
        collapseAllNodes(idBOMLeft);
        collapseAllNodes(idBOMRight);
        return;
    } else if (elemTarget.length === 0) {
        if(elemSource.length > 0) {
            do {
                let elemAfter = $('#' + idBOMRight + '-tbody').children().last();
                insertBOMComparisonPlaceholder(elemSource, null, elemAfter);
                elemSource = elemSource.next();
            } while (elemSource.length > 0);
        }
        collapseAllNodes(idBOMLeft);
        collapseAllNodes(idBOMRight);
        return;
    }

    compareBOMRow(elemSource, elemTarget);

}
function getLowerLevel(levelSource, levelTarget) {

    if(typeof levelSource === 'undefined') return 'target';
    if(typeof levelTarget === 'undefined') return 'source';
        
    let levelsSource = levelSource.split('.');
    let levelsTarget = levelTarget.split('.');

    for(let index in levelsSource) {

        if(levelsTarget.length > index) {
            
            let source = Number(levelsSource[index]);
            let target = Number(levelsTarget[index]);

            if(source < target) return 'source';
            if(target < source) return 'target';
            
        }
    }

}
function insertBOMComparisonPlaceholder(elemReference, elemBefore, elemAfter) {

    elemReference.addClass(classNames.missing);

    const level = elemReference.attr('data-level');
            
    let elemPlaceholder = $('<tr></tr>')
        .addClass('content-item')
        .addClass(classNames.placeholder)
        .addClass(classNames.missing)
        .addClass('level-' + level)
        .attr('data-level', level);

    $('<td></td>').appendTo(elemPlaceholder)
        .addClass('tree-color');

    $('<td></td>').appendTo(elemPlaceholder)
        .addClass('tree-placeholder')
        .attr('colspan', elemReference.children().length - 1);

    if(elemBefore !== null) elemPlaceholder.insertBefore(elemBefore); else elemPlaceholder.insertAfter(elemAfter);

}



// After comparison, set UI events to sync BOM interactions
function setBOMComparisonEvents() {

    syncBOMScrolling(idBOMLeft, idBOMRight);
    syncBOMScrolling(idBOMRight, idBOMLeft);

    syncBOMHovering(idBOMLeft, idBOMRight);
    syncBOMHovering(idBOMRight, idBOMLeft);
    
    syncBOMToggles(idBOMLeft, idBOMRight);
    syncBOMToggles(idBOMRight, idBOMLeft);

} 
function syncBOMScrolling(idSource, idTarget) {

    $('#' + idSource + '-content').on('scroll', function() {
        if(syncScrollBOM === '') {
            syncScrollBOM = idSource;
            $('#' + idTarget + '-content').scrollTop($('#' + idSource + '-content').scrollTop());
        }
        syncScrollBOM = '';
    });

}
function syncBOMHovering(idSource, idTarget) {

    $('#' + idSource + '-tbody').children().mouseover(function() {
        let index = $(this).index();
        $('#' + idTarget + '-tbody').children('.hovering').removeClass('hovering');
        $('#' + idTarget + '-tbody').children(':eq(' + index + ')').addClass('hovering');        
    });

    $('#' + idSource + '-content' ).mouseleave(function() { $('*').removeClass('hovering'); })

} 
function syncBOMToggles(idSource, idTarget) {

    $('#' + idSource + '-tbody').find('.tree-nav').click(function() {

        let elemClicked = $(this).closest('.content-item');
        let index       = elemClicked.index();
        let elemMatch   = $('#' + idTarget + '-tbody').children(':eq(' + index + ')');

        if(elemClicked.hasClass('collapsed')) elemMatch.addClass('collapsed'); else elemMatch.removeClass('collapsed');

        $('#' + idSource + '-tbody').children('.content-item').each(function() {
            let isHidden = $(this).hasClass('hidden');
            index        = $(this).index();
            elemMatch    = $('#' + idTarget + '-tbody').children(':eq(' + index + ')');
            if(isHidden) elemMatch.addClass('hidden'); else elemMatch.removeClass('hidden');
        });
        
    });

}


// BOM selection event
function clickBOMItem(elemClicked, side) {

    const link       = elemClicked.attr('data-link');
    const isSelected = elemClicked.hasClass('selected');
    const syncView   = $('#toggle-sync-viewers').hasClass('toggle-on');
    const index      = elemClicked.index();
    const idBOMOther = (side === 'Left') ? idBOMRight : idBOMLeft;
    const fitLeft    = (side === 'Left')  || (!syncView);
    const fitRight   = (side === 'Right') || (!syncView);

    $('.tree-item').removeClass('selected');

    if(isSelected) {

        let elemOther = $('#' + idBOMOther).find('.content-item:eq(' + index + ')');
        let linkLeft  = link;
        let linkRight = link;
        let pathLeft  = elemClicked.attr('data-number-path');
        let pathRight = elemClicked.attr('data-number-path');

        elemClicked.addClass('selected');

        if(elemOther.length === 0) {

            viewerSelectModel(pathLeft, {
                id      : idViewerLeft,
                usePath : true
            });   

        } else {

            if(side === 'Left') {
                linkRight = elemOther.attr('data-link');
                pathRight = elemOther.attr('data-number-path');
            } else {
                linkLeft = elemOther.attr('data-link');
                pathLeft = elemOther.attr('data-number-path');
            }


            elemOther.addClass('selected');

            viewerSelectModel(pathLeft, {
                id        : idViewerLeft,
                fitToView : fitLeft,
                usePath   : true,
            });

            viewerSelectModel(pathRight, {
                id        : idViewerRight,
                fitToView : fitRight,
                usePath   : true,
            });

            insertDetails(linkLeft , paramsDetailsLeft);
            insertDetails(linkRight, paramsDetailsRight);

        }

    } else {
        insertDetails(links.left , paramsDetailsLeft);
        insertDetails(links.right, paramsDetailsRight);
        viewerResetSelection({ id : idViewerLeft  });
        viewerResetSelection({ id : idViewerRight });
    }

}


// Counters
function setBOMComparionsCounters() {

    let counters = {
        matches   : 0,
        quantity  : 0,
        revision  : 0,
        different : 0,
        missing   : 0
    }

    $('#bomLeft-tbody').children('.content-item').each(function() {

        let elemRow = $(this);

             if(elemRow.hasClass(classNames.match            )) counters.matches++;
        else if(elemRow.hasClass(classNames.differentQuantity)) counters.quantity++;
        else if(elemRow.hasClass(classNames.differentRevision)) counters.revision++;
        else if(elemRow.hasClass(classNames.differentNumber  )) counters.different++;
        else if(elemRow.hasClass(classNames.missing          )) counters.missing++;

    })

    $('#matchingItemsCounter'    ).html(counters.matches  );
    $('#differentQuantityCounter').html(counters.quantity );
    $('#differentRevisionCounter').html(counters.revision );
    $('#differentNumberCounter'  ).html(counters.different);
    $('#missingItemCounter'      ).html(counters.missing  );

}
function clickCounter(elemClicked) {

    viewerResetSelection({ id : idViewerLeft  });
    viewerResetSelection({ id : idViewerRight });    

    elemClicked.toggleClass('active');
    elemClicked.siblings().removeClass('active');

    let isActive         = elemClicked.hasClass('active');
    let classActive      = elemClicked.attr('data-class-name');
    let partNumbersLeft  = [];
    let partNumbersRight = [];

    if(isActive) {

        $('.content-item').hide();
        $('.' + classActive).each(function() {

            $(this).show();
            treeUnhideParents($(this));
            let isLeft = ($(this).closest('.panel-top').attr('id') === idBOMLeft);

            if(isLeft) partNumbersLeft.push($(this).attr('data-number-path'));
            else      partNumbersRight.push($(this).attr('data-number-path'));

        })

        viewerSelectModels(partNumbersLeft, {
            id          : idViewerLeft,
            usePath     : true,
            resetColors : false
        });

        viewerSelectModels(partNumbersRight, {
            id          : idViewerRight,
            fitToView   : false,
            usePath     : true,
            resetColors : false
        });

    } else {

        $('.content-item').show()

    }

}
function clickPrevNext(e, elemClicked) {

    e.preventDefault();
    e.stopPropagation();

    let classActive  = elemClicked.parent().attr('data-class-name');
    let selectNext   = elemClicked.hasClass('icon-next');
    let elemBOMLeft  = $('#' + idBOMLeft);
    let elemSelected = elemBOMLeft.find('.selected');
    let elemResult   = [];
    
    if(elemSelected.length > 0) {

        elemSelected.siblings().removeClass('selected');
        if(!elemSelected.hasClass(classActive)) {
            elemSelected.removeClass('selected');
            elemSelected = [];
        }
    }

    if(elemSelected.length === 0) {

        if(selectNext) elemResult = elemBOMLeft.find('.' + classActive).first();
        else           elemResult = elemBOMLeft.find('.' + classActive).last();

    } else {

        elemSelected.removeClass('selected');

        if(selectNext) {

            elemResult = elemSelected.nextAll('.' + classActive).first();
            if(elemResult.length === 0) elemResult = elemBOMLeft.find('.' + classActive).first().addClass('selected');

        } else {

            elemResult = elemSelected.prevAll('.' + classActive).first();
            if(elemResult.length === 0) elemResult = elemBOMLeft.find('.' + classActive).last().addClass('selected');

        }

    }

    if(elemResult.length > 0) {
        elemResult.addClass('selected');
        let side = (elemResult.closest('.panel-top').hasClass(idBOMLeft)) ?  'Right' : 'Left' ;
        treeScrollToItem(elemResult, 200);
        clickBOMItem(elemResult, side)
    }

}
function applyViewerColors() {

    if($('#apply-colors').hasClass('toggle-off')) return;

    let pathsLeft  = { green : [], yellow : [], red : [] }
    let pathsRight = { green : [], yellow : [], red : [] }

    $('#' + idBOMLeft).find('.leaf').each(function() {
        let elemRow = $(this);
        let path = elemRow.attr('data-number-path');
             if(elemRow.hasClass(classNames.match            )) pathsLeft.green.push(path);
        else if(elemRow.hasClass(classNames.differentQuantity)) pathsLeft.yellow.push(path);
        else if(elemRow.hasClass(classNames.differentRevision)) pathsLeft.yellow.push(path);
        else if(elemRow.hasClass(classNames.differentNumber  )) pathsLeft.red.push(path);
        else if(elemRow.hasClass(classNames.missing          )) pathsLeft.red.push(path);
    });

    $('#' + idBOMRight).find('.leaf').each(function() {
        let elemRow = $(this);
        let path = elemRow.attr('data-number-path');
             if(elemRow.hasClass(classNames.match            )) pathsRight.green.push(path);
        else if(elemRow.hasClass(classNames.differentQuantity)) pathsRight.yellow.push(path);
        else if(elemRow.hasClass(classNames.differentRevision)) pathsRight.yellow.push(path);
        else if(elemRow.hasClass(classNames.differentNumber  )) pathsRight.red.push(path);
        else if(elemRow.hasClass(classNames.missing          )) pathsRight.red.push(path);
    });

    viewerSetColors(pathsLeft.green, {
        id          : idViewerLeft,
        usePath     : true,
        color       : colors.vectors.green,
        resetColors : true
    });
    viewerSetColors(pathsLeft.yellow, {
        id          : idViewerLeft,
        usePath     : true,
        color       : colors.vectors.yellow,
        resetColors : false
    });
    viewerSetColors(pathsLeft.red, {
        id          : idViewerLeft,
        usePath     : true,
        color       : colors.vectors.red,
        resetColors : false
    });

    viewerSetColors(pathsRight.green, {
        id          : idViewerRight,
        usePath     : true,
        color       : colors.vectors.green,
        resetColors : true
    });
    viewerSetColors(pathsRight.yellow, {
        id          : idViewerRight,
        usePath     : true,
        color       : colors.vectors.yellow,
        resetColors : false
    });
    viewerSetColors(pathsRight.red, {
        id          : idViewerRight,
        usePath     : true,
        color       : colors.vectors.red,
        resetColors : false
    });

}