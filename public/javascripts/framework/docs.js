$(document).ready(function() {

    $('#gallery').click(function() {
        document.location.href = document.location.href.split('/docs')[0] + '/gallery';
    })
    $('#studio').click(function() {
        document.location.href = document.location.href.split('/docs')[0] + '/studio';
    })

    $('.nav-header').click(function() {
        $(this).toggleClass('collapsed');
        $(this).next().toggle();
        $(this).next().next().toggle();
        // $('.doc-content').hide();
        // $('#' + $(this).attr('data-id')).show();
        // $('#doc-contents').animate({ scrollTop: 0 }, 250);
    });

    $('.nav-content').click(function() {
        $('.nav-content').removeClass('selected');
        $(this).addClass('selected');
        $('.doc-content').hide();
        setParamsList($(this));
        $('#' + $(this).attr('data-id')).show();
        $('#doc-contents').animate({ scrollTop: 0 }, 250);
    });

    $('span.ref').click(function() {
        let id = $(this).attr('data-id')
        $('.nav-content').removeClass('selected');
        $('.nav-content').each(function() {
            if($(this).attr('data-id') === id) $(this).addClass('selected');
        });
        $('.doc-content').hide();
        $('#' + id).show();
        $('#doc-contents').animate({ scrollTop: 0 }, 250);
    });

    $('.nav-content').first().click();

    $('.page-top').click(function() {

        let elemMain  = $(this).closest('.doc-content').find('.main');
   
        elemMain.animate({ scrollTop: 0 }, 500);

    });

    $('.page-parameters').click(function() {

        let elemMain  = $(this).closest('.doc-content').find('.main');
        let elemTable = elemMain.find('table.parameters');
   
        elemTable.get(0).scrollIntoView({ behavior : 'smooth' });

    });

    $('.page-examples').click(function() {
        
        let elemMain  = $(this).closest('.doc-content').find('.main');
        let elemTable = elemMain.find('table.examples');

        elemTable.get(0).scrollIntoView({ behavior : 'smooth' });

    });

    updateLinks();

});


function setParamsList(elemClicked) {

    const id   = elemClicked.attr('data-id');
    const name = elemClicked.attr('data-name');

    if(typeof name === 'undefined') return;

    const panelType = getRegistryPanelType(name);

    if(panelType === null) return;

    let elemPage  = $('#' + id);
    let elemTable = elemPage.find('table.parameters').first();

    if(elemTable.length === 0) return;

    elemTable.html('');

    let elemTHead = $('<thead></thead>').appendTo(elemTable);
    let elemTHRow = $('<tr></tr>').appendTo(elemTable);
    let elemTBody = $('<tbody></tbody>').appendTo(elemTable);

    $('<th></th>').appendTo(elemTHRow).html('Parameter');
    $('<th></th>').appendTo(elemTHRow).html('Description');
    $('<th></th>').appendTo(elemTHRow).html('Type');
    $('<th></th>').appendTo(elemTHRow).html('Default Value');
        
    insertPanelParameters(elemTBody, panelType, registry.panelStandardOptions.header);
    insertPanelParameters(elemTBody, panelType, registry.panelStandardOptions.controls);
    insertPanelParameters(elemTBody, panelType, registry.panelStandardOptions.contents);
    
    insertExtraPanelParameters(elemTBody, panelType, panelType.data,       registry.panelData);
    insertExtraPanelParameters(elemTBody, panelType, panelType.filters,    registry.panelFilters);
    insertExtraPanelParameters(elemTBody, panelType, panelType.additional, registry.panelAdditionalOptions);

}

function insertPanelParameters(elemTBody, panelType, parameters) {

    let keys     = Object.keys(parameters);
    let excluded = panelType.excluded || [];
 
    for(let key of keys) {

        if(!excluded.includes(key)) {

            let elemRow   = $('<tr></tr>').appendTo(elemTBody).addClass('dynamic-parameter');
            let parameter = parameters[key];
            let value     = panelType.defaults[key] || parameter.default;

            $('<td></td>').appendTo(elemRow).html(key);
            $('<td></td>').appendTo(elemRow).html(parameter.description);
            $('<td></td>').appendTo(elemRow).html(parameter.type).addClass('nowrap');
            $('<td></td>').appendTo(elemRow).html(value).addClass('nowrap');         

        }

    }

}
function insertExtraPanelParameters(elemTBody, panelType, panelParameters, registryParameters) {

    if(typeof panelParameters === 'undefined') return;

    console.log(panelParameters);
    console.log(registryParameters);

    let keysRegistry = Object.keys(registryParameters);
    let excluded     = panelType.excluded || [];
 
    for(let keyPanel of panelParameters) {

        if(keysRegistry.includes(keyPanel)) {

            let elemRow   = $('<tr></tr>').appendTo(elemTBody).addClass('dynamic-parameter');
            let parameter = registryParameters[keyPanel];
            let value     = panelType.defaults[keyPanel] || parameter.default;
                    
            $('<td></td>').appendTo(elemRow).html(keyPanel);
            $('<td></td>').appendTo(elemRow).html(parameter.description);
            $('<td></td>').appendTo(elemRow).html(parameter.type).addClass('nowrap');
            $('<td></td>').appendTo(elemRow).html(value).addClass('nowrap');         
                    
        }

    }

}


function updateLinks() {

    let location = document.location.href.split('/docs');

    $('a.button').each(function() {

        let href = $(this).attr('href');

        if(href.indexOf('youtu.be') < 0) {

            let url = location[0] + '/' + href;
            if($(this).html() === '') $(this).html(url);
            let concat = (url.indexOf('?') > -1) ? '&' : '?';
            if(location.length > 1)url += concat + location[1];
            $(this).attr('href', url);
            
        }

    });

    $('.code').each(function() {

        let text = $(this).html();
        text = text.replace(/LOCATION/g, location[0]);
        $(this).html(text);

    });

    $('.url').each(function() {
        $(this).html(location[0]);
    });

}