$(document).ready(function() {

    appendOverlay(true);
    setUIEvents();
    setAddinEvents();

    let summaryContents = config.item.tabs;
        
    for(let content of summaryContents) {
        if(content.type === 'bom') {
            content.params.onClickItem     = function(elemClicked) { selectBOMItem(elemClicked); };
            content.params.afterCompletion = function(id) { genAddinPLMBOMActions(id); }
        }
    }

    insertItemSummary(urlParameters.link, {
        id              : 'item',
        bookmark        : true,
        openInPLM       : true,
        reload          : true,
        summaryLayout   : 'tabs',
        summaryContents : summaryContents
    });    

});

function setUIEvents() {}


// Add button to BOM toolbar for isolation of selected item
function insertBOMDone() {

    if(host.toLowerCase() === 'inventor') {

        let elemToolbar = $('#item-bom-controls');

        $('<div></div>').prependTo(elemToolbar)
            .addClass('button')
            .addClass('with-icon')
            .addClass('icon-check-box')
            .attr('id', 'item-bom-isolate-toggle')
            .html('Isolate')
            .click(function() {
                $(this).toggleClass('main').toggleClass('icon-check-box').toggleClass('icon-check-box-checked');
            });

    }

}


// Upon item selection in BOM, select / isolate components in Inventor
function selectBOMItem(elemClicked) {

    if(host.toLowerCase() === 'inventor') {

        let isolate = $('#item-bom-isolate-toggle').hasClass('main');

        if(isolate) invokeAddinAction([elemClicked], 'isolateComponent');
        else invokeAddinAction([elemClicked], 'selectComponent');

    }

}


// Highlight item based on CAD/PDM selection
function selectComponent(number) {

    $('#item-tabs').children().eq(2).click();
    bomDisplayItemByPartNumber(number, true, true);

}