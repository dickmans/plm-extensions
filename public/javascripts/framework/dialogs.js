function showConfirmationDialog({ 
    idParent  = 'body',
    idDialog  = 'confirmation',
    icon      = 'icon-help-circle', 
    title     = '', 
    message   = 'Do you want to continue?', 
    labelY    = 'Yes', 
    labelN    = 'No',
    hide      = false,
    onConfirm = function() {},
    onCancel  = function() {}
} = {}) {

    const elemParent = $('#' + idParent);

    let elemOverlay = $('<div></div>').appendTo('body')
        .addClass('confirmation-dialog-overlay')
        .addClass('overlay');
        

    let elemDialog = $('<div></div>').appendTo(elemParent)
        .addClass('dialog')
        .addClass('confirmation-dialog')
        .attr('id', idDialog);

    if(icon !== '') {
        $('<div></div>').appendTo(elemDialog)
            .addClass('confirmation-dialog-icon')
            .addClass('icon')
            .addClass('pos-abs-left')
            .addClass(icon);
    } else {
        elemDialog.addClass('no-icon');
    }

    if(title !== '') {
        $('<div></div>').appendTo(elemDialog)
            .addClass('confirmation-dialog-title')
            .html(title);
    }

    if(message !== '') {
        $('<div></div>').appendTo(elemDialog)
            .addClass('confirmation-dialog-message')
            .addClass('no-scrollbar')
            .html(message);
    }
    
    let elemActions = $('<div></div>').appendTo(elemDialog)
        .addClass('confirmation-dialog-actions');

    $('<div></div>').appendTo(elemActions)
        .addClass('confirmation-dialog-confirm')
        .addClass('red')
        .addClass('button')
        .html(labelY)
        .click(function(e) {
            e.stopPropagation();
            removeConfirmationDialog($(this));
            onConfirm();
        });

    $('<div></div>').appendTo(elemActions)
        .addClass('confirmation-dialog-cancel')
        .addClass('default')
        .addClass('button')
        .html(labelN)
        .click(function(e) {
            e.stopPropagation();
            removeConfirmationDialog($(this));
            onCancel();
        });

    if(!hide) { elemDialog.show(); elemOverlay.show().css('display', 'block'); }

    return elemDialog;

}
function removeConfirmationDialog(elemButton) {
    
    $('.confirmation-dialog-overlay').remove();
    elemButton.closest('.confirmation-dialog').remove();

}