let paramsSummary = {
    id       : 'summary',
    contents : [ { 
        type   : 'details', 
        params : {
            id               : 'details-details', 
            collapseContents : true, 
            hideHeader       : true,
            layout           : 'narrow'
        }
    },{
        type   : 'attachments',
        params : { 
            id            : 'details-attachments', 
            contentSize   : 's',
            editable      : true , 
            singleToolbar : 'controls'
        }
    }],
    layout           : 'tabs',
    hideCloseButton  : true,
    openInPLM        : true,
    bookmark         : true,
    saveTabSelection : true
};



$(document).ready(function() {
    
    setUIEvents();
    insertMenu();

    if(urlParameters.link === '') {

        $('#toggle-classes').removeClass('hidden');

        insertClasses({
            collapseContents : true,
            counters         : true,
            path             : true,
            reset            : true,
            search           : true,
            toggles          : true,
            useCache         : true,
            singleToolbar    : 'actions',
            onClickItem      : function(elemClicked) { selectClass(elemClicked); }
        });

    } else {
        
        $('#toggle-classes').remove();
        $('#classes').remove();
        $('body').addClass('no-classes');
        
        let requests = [
            $.get('/plm/details', { link : urlParameters.link}),
            $.get('/plm/classes', { useCache : true})
        ]

        getFeatureSettings('classes', requests, function(responses) {

            $('#header-subtitle').html(responses[0].data.title).removeClass('hidden');

            let data      = getClassificationData(responses[0].data);
            let classId   = data.classificationId;
            let className = data.classificationName;
            let header    = getSectionFieldValue(responses[0].data.sections, 'CLASS_PATH', '');

            for(let classification of responses[1].data.classifications) {
                if(classification.id == classId) {
                    className = classification.name;
                    break;
                }
            }

            if(header === '') header = data.classificationName;

            insertClassContents(classId, className, {
                id                : 'contents',
                headerLabel       : header,
                filterByStatus    : true,
                filterByWorkspace : true,
                reset             : true,
                search            : true,
                openInPLM         : true,
                fields            : config.fieldsIncluded,
                referenceItem     : responses[0].data,
                referenceData     : data,
                onClickItem       : function(elemClicked) { clickClassItem(elemClicked); }
            });

            insertClassFilters(classId, className, {
                id         : 'filters',
                idContents : 'contents'
            });

            insertItemSummary(urlParameters.link, paramsSummary);

        });

    }

});


function setUIEvents() { 

    // Header Toolbar
    $('#toggle-classes').click(function() {
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
        $('body').toggleClass('no-classes');
    })
    $('#toggle-summary').click(function() {
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
        $('body').toggleClass('no-summary');
    })

}


function selectClass(elemClicked) {

    let link      = elemClicked.attr('data-link');
    let classId   = link.split('/').pop();
    let className = elemClicked.attr('data-name');
    let path      = getTreeItemPath(elemClicked, ' / ');

    insertClassContents(classId, className, {
        id                : 'contents',
        headerLabel       : path.path,
        filterByStatus    : true,
        filterByWorkspace : true,
        reset             : true,
        search            : true,
        openInPLM         : true,
        fields            : config.fieldsIncluded,
        onClickItem       : function(elemClicked) { clickClassItem(elemClicked); }
    });

    insertClassFilters(classId, className, {
        id         : 'filters',
        idContents : 'contents'
    });

}


function clickClassItem(elemClicked) {

    let link = elemClicked.attr('data-link');

    insertItemSummary(link, paramsSummary);

}