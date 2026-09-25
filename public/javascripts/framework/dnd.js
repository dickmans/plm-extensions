// Drop Zone functionality used by multiple panels
function insertDropZone(params) {

    const id       = params.id       || 'drop-zone';
    const parent   = params.parent   || null;
    const label    = params.label    || 'Click or drop files here to upload';
    const hidden   = params.hidden   ?? false;
    const multiple = params.multiple ?? true;
    const prepend  = params.prepend  ?? false;
    let elemZone   = $('#' + id);

    if(elemZone.length === 0) {
        elemZone = $('<div></div>');
        elemZone.attr('id', id);
        
        if(parent !== null) {
            if(prepend) elemZone.prependTo(parent);
            else        elemZone.appendTo(parent);
        }

    }
    
    if(hidden) elemZone.addClass('hidden');
    
    elemZone.addClass('drop-zone')
        .addClass('button')
        .attr('title', label)
        .attr('ondragenter', 'dragEnterDropZone(event)')
        .attr('ondragover' , 'dragEnterDropZone(event)')
        .attr('ondragleave', 'dragLeaveDropZone(event)');
    
    elemZone.on('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(e.target).closest('.drop-zone').removeClass('drag-hover');
        if($(this).hasClass('upload-in-progress')) return;
        params.onDrop(e);
    });
    
    elemZone.click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        if($(this).hasClass('upload-in-progress')) return;
        $(this).children('.drop-zone-input').first().click();
    });

    $('<div></div>').appendTo(elemZone)
        .attr('id', id + '-content')
        .addClass('drop-zone-content')
        .html(label);

    let elemInput = $('<input></input>').appendTo(elemZone)
        .attr('id', id + '-input')
        .attr('type', 'file')
        .attr('hidden', 'hidden')
        .addClass('drop-zone-input')
        .click(function(e) {
            e.stopPropagation();
        })
        .on('change', function(e) {
            e.stopPropagation();
            params.onDrop(e);
        });     

    if(multiple) elemInput.attr('multiple', 'multiple');

    $('<div></div>').appendTo(elemZone)
        .attr('id', id + '-icon')
        .addClass('drop-zone-icon')
        .addClass('icon');

    $('<div></div>').appendTo(elemZone)
        .attr('id', id + '-message')
        .addClass('drop-zone-message');

    let elemProcessing = appendProcessing(id, true);

    elemProcessing.addClass('drop-zone-processing');

    return elemZone;

}

function dragEnterDropZone(e) {
        
    e.preventDefault();
    e.stopPropagation();

    const dropZone = $(e.target).closest('.drop-zone');

    dropZone.addClass('drag-hover');

}

function dragLeaveDropZone(e) {
        
    e.preventDefault();
    e.stopPropagation();

    const dropZone = $(e.target).closest('.drop-zone');

    dropZone.removeClass('drag-hover');

}

function setDropZoneProgress(id, countTotal, countPending, sizeTotal, sizePending) {

    let elemZone       = $('#' + id + '-drop-zone');
    let elemMessage    = elemZone.find('.drop-zone-message');
    let elemProcessing = $('#' + id + '-drop-zone-processing');
    let progress       = 100 - (sizePending * 100 / sizeTotal);

    if(countPending > 0) {

        elemZone.addClass('upload-in-progress');
        elemMessage.html('Uploading Files');
        elemProcessing.css('display', 'flex');
        elemZone.css('background', 'linear-gradient(90deg, var(--color-blue-800) 0 ' + progress + '%, var(--color-blue-900) ' + progress + '% 100%) !important');
        elemMessage.html('Uploading ' + countPending + ' of ' + countTotal + ' files ( ' +  formatFileSize(sizePending) + ' left )');

    } else {

        elemZone.removeClass('upload-in-progress');
        elemZone.css('background', 'none');
        elemMessage.html('');
        elemProcessing.css('display', 'none');

    }

}