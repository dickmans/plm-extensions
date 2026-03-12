$(document).ready(function() {

    let layout = 'table';

    if(window.innerWidth < 900) layout = 'grid';
    if(window.innerWidth < 500) layout = 'list';

    layout = 'list';

    insertSimilarItems(urlParameters.link, {
        id                 : 'similar',
        layout             : layout,
        contentSizes       : ['l', 'm', 'xs'],
        singleToolbar      : 'actions',
        fields             : ['DESCRIPTOR', 'REVISION', 'LIFECYCLE'],
        sortSelection      : false,
        filterByStatus     : true,
        filterByWorkspace  : true,
        reload             : true,
        search             : true,
        openInPLM          : true,
        useCache           : true,
        advancedFilter     : false,
        labelFiltersToggle : 'Filters'
    });

});