$(document).ready(function() {

    appendOverlay();
    setUIEvents();

    insertItemClassification(urlParameters.link, {
        editable      : true,
        openInPLM     : true,
        reload        : true,
        singleToolbar : 'controls'
    });

});

function setUIEvents() {}