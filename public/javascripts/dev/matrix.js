let links         = {};
let paramsDetails = {};


$(document).ready(function() {
    
    setUIEvents();

    $('#header-title').html(config.title);
    document.title        = config.title;

    links.context = urlParameters.link;

    let requests = [
        $.get('/plm/details', { link : links.context })
    ]

    getFeatureSettings('matrix', requests, function(responses) {

        $('#header-subtitle').html(responses[0].data.title);

        links.tree    = getSectionFieldValue(responses[0].data.sections, config.wsContext.fieldIdTree, '', 'link');
        links.columns = getSectionFieldValue(responses[0].data.sections, config.wsContext.fieldIdColumns);

        let validations = [];

        for(let validation of links.columns) {
            validations.push($.get('/plm/details', { link : validation.link }));
        }
        
        let paramsBOM = config.panels.insertBOM;
            paramsBOM.id = 'tree';
            paramsBOM.multiSelect = 'true';
            paramsBOM.additionalRequests = validations;
            paramsBOM.onClickItem        = function(elemClicked) { selectBOMItem( elemClicked); };
            paramsBOM.afterCompletion    = function(id, data)    { afterBOMCompletion(id, data); };

        insertBOM(links.tree, paramsBOM);

        paramsDetails    = config.panels.insertDetails;
        paramsDetails.id = 'details';

        insertDetails(links.tree, paramsDetails);

    });

});



function setUIEvents() { 

    $('#create-button').click(function() {
        insertCreate(null, ['144'], {
        });
    });

    $('#toggle-details').click(function() {
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
        $('body').toggleClass('no-details');
    });

}


// Insert validation data to table
function afterBOMCompletion(id, data) {

    console.log(data);


    // Insert Status Column
    let elemTHead = $('#tree-thead').children().first();
    
    $('<th></th>').appendTo(elemTHead)
        .addClass('column-status')
        .html('Status');

    $('#tree-tbody').find('.content-item').each(function() {
        $('<td></td>').appendTo($(this)).addClass('column-status');
    });


    // Insert Matrix Columns
    let requests  = [];
    let countCols = $('#tree-tbody').children().first().children().length;
    let sort      = 1;

    for(let column of data.dataAdditional) {
        
        column.sort     = sort++;
        column.number   = getSectionFieldValue(column.data.sections, 'ID', '') + ' (' + getSectionFieldValue(column.data.sections, 'REPETITION', '') + ')';
        column.title    = getSectionFieldValue(column.data.sections, 'TITLE', '');
        column.subtitle = column.data.currentState.title;
    
    }

    sortArray(data.dataAdditional, 'sort', 'integer', 'descending');

    for(let column of data.dataAdditional) {

        requests.push($.get('/plm/grid', { link : column.params.link }));

        let elemHead  = $('<th></th>'  ).appendTo(elemTHead).addClass('column-matrix');
        let elemTitle = $('<div></div>').appendTo(elemHead).addClass('matrix-head').attr('data-link', column.data.__self__)

        $('<div></div>').appendTo(elemTitle).addClass('matrix-number'  ).html(column.number);
        $('<div></div>').appendTo(elemTitle).addClass('matrix-title'   ).html(column.title);
        $('<div></div>').appendTo(elemTitle).addClass('matrix-subtitle').html(column.subtitle);

        $('#tree-tbody').find('.content-item').each(function() {
            $('<td></td>').appendTo($(this)).addClass('column-matrix');
        });     
        
        elemTitle.click(function() {
            selectMatrixColumn($(this));
        });

    }

    Promise.all(requests).then(function(responses) {

        let index = countCols;

        for(let response of responses) {
            for(let row of response.data) {

                let items  = getGridRowValue(row, 'RELATED_REQUIREMENTS', []);
                let result = getGridRowValue(row, 'RESULT', '', 'title');

                for(let item of items) {

                    $('#tree-tbody').find('.content-item').each(function() {

                        let elemTreeItem = $(this);
                        let linkTreeItem = elemTreeItem.attr('data-link');

                        if(item.link === linkTreeItem) {

                            let elemCell = elemTreeItem.children().eq(index);
                                elemCell.html(result);

                            addValueClass(elemCell)

                        }

                    });

                }
            }
            index++;
        }

        $('#tree-tbody').find('.content-item.leaf').each(function() {

            let columns = $(this).children('.column-matrix');
            let result  = '';

            columns.each(function() {
                if(result === '') {
                    if($(this).html() !== '') result = $(this).html();
                }
            });

            if(result === '') result = config.valueMapping.pending;

            let elemCellStatus = $(this).find('.column-status').first();
                elemCellStatus.html(result); 

            addValueClass(elemCellStatus)

        });

        $('#tree-tbody').find('.content-item.node').each(function() {

            let elemNode       = $(this);
            let children       = treeGetItemChildren(elemNode, false);
            let elemCellStatus = $(this).find('.column-status').first();
            let result         = config.valueMapping.success;

            for(let child of children) {
                let failed  = (child.find('.column-status.failed' ).length > 0);
                let pending = (child.find('.column-status.pending').length > 0);
                let partial = (child.find('.column-status.partial').length > 0);

                    if(failed)  result = config.valueMapping.failed;
               else if(partial) result = config.valueMapping.partial;
               else if(pending) result = config.valueMapping.pending;

            }

            elemCellStatus.html(result);
            addValueClass(elemCellStatus);

        });  
    });

}
function addValueClass(elemCell) {

    let result = elemCell.html();

    switch(result) {

        case config.valueMapping.failed  : elemCell.addClass('failed' ); break;
        case config.valueMapping.pending : elemCell.addClass('pending'); break;
        case config.valueMapping.success : elemCell.addClass('success'); break;
        case config.valueMapping.partial : elemCell.addClass('partial'); break;

    }

}


// Display selected tree item details panel
function selectBOMItem(elemClicked) {

    let link          = elemClicked.attr('data-link');
    let isSelected    = elemClicked.hasClass('selected');


    if(isSelected) {

        insertDetails(link, paramsDetails);
       
    } else {

        insertDetails(links.tree, paramsDetails);

    }

}


// Display selected matrix column item
function selectMatrixColum(elemClicked) {

    // console.log($(this).attr('data-link'));

    let link = elemClicked.attr('data-link');

    console.log(link);
    insertItemSummary


}