let urlParameters = getURLParameters();

$(document).ready(function() {

    setUIEvents();

    insertItemSummary(urlParameters.link, {
        id         : 'item',
        bookmark   : true,
        layout     : 'tabs',
        openInPLM  : true,
        reload     : true,
        contents   : [{ 
            type   : 'details', 
            params : { 
                id              : 'item-details', 
                collapsed       : true, 
                editable        : true,
                toggles         : true,
                expandSections  : config.addins.item.expandSections,
                sectionsEx      : config.addins.item.sectionsEx,
                fieldsEx        : config.addins.item.fieldsEx
            } 
        },{ 
            type   : 'attachments', 
            params : { 
                id                  : 'item-attachments',
                editable            : true,
                includeVaultFiles   : true,
                layout              : 'list',
                search              : false,
                filterByType        : true,
                singleToolbar       : 'controls',
                contentSize         : 'm'
            } 
        },{ 
            type   : 'bom', 
            params : { 
                id               : 'item-bom',
                bomViewName      : 'Basic',
                collapseContents : true,
                contentSize      : 'xs',
                counters         : true,
                openInPLM        : true,
                path             : true,
                search           : true,
                toggles          : true,
                onClickItem      : function(elemClicked) { selectBOMItem(elemClicked); },
                afterCompletion  : function(id) { genAddinPLMBOMActions(id); }
            } 
        },{ 
            type   : 'change-processes', 
            params : { 
                id       : 'item-change-processes',
                editable : false,
                search   : true
            } 
        }],

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