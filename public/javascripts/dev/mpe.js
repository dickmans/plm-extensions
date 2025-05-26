let wsConfig        = {};
let links           = {};
let viewIds         = {};
let urlParameters   = getURLParameters();


$(document).ready(function() {

    wsConfig.id = 340;

    setUIEvents();

    getInitialData();

    // getFeatureSettings('assetServices', [], function(responses) {

    //     console.log(config.assetServices.wsLines.id);

    //     // insertResults('275', [{
    //     insertResults(config.assetServices.wsLines.id, [{
    //         field       : 'ID',
    //         type        : 0,
    //         comparator  : 21,
    //         value       : ''
    //     }], {
    //         id               : 'lines',
    //         headerLabel      : 'Sites & Assets',
    //         layout           : 'grid',
    //         contentSize      : 'xxl',
    //         tileImage        : 'IMAGE',
    //         tileTitle        : 'TITLE',
    //         tileSubtitle     : 'DESCRIPTION',
    //         reload           : true,
    //         search           : true,
    //         useCache         : true,
    //         onClickItem      : function(elemClicked) { seletLine(elemClicked); }
    //     });

    //     insertResults(config.assetServices.wsAssetServices.id, [{
    //         field       : 'ID',
    //         type        : 0,
    //         comparator  : 21,
    //         value       : ''
    //     }], {
    //         id               : 'services',
    //         headerLabel      : 'Your Asset Services',
    //         layout           : 'list',
    //         contentSize      : 'm',
    //         reload           : true,
    //         useCache         : false,
    //         onClickItem      : function(elemClicked) { selectAssetService(elemClicked); }
    //     });

    // });


    // for(profile of config.dashboard) {

    //     if(wsId === profile.wsId.toString()) {

    //         wsConfig.id          = profile.wsId.toString();
    //         wsConfig.progress    = profile.progress;
    //         wsConfig.fieldIdItem = profile.fieldIdItem;
    //         wsConfig.tableauName = (profile.title.length < 31) ? profile.title : 'Process Dashboard';

    //         if(!isBlank(profile.icon)) wsConfig.icon = profile.icon;
    //         if(!isBlank(profile.title)) title = profile.title;
    //         if(!isBlank(profile.fieldIdSubtitle)) wsConfig.fieldIdSubtitle = profile.fieldIdSubtitle;
    //         if(!isBlank(profile.workflowHistory)) wsConfig.workflowHistory = profile.workflowHistory;
    //         if(!isBlank(profile.imageFieldsPrefix)) wsConfig.imageFieldsPrefix = profile.imageFieldsPrefix;

    //     }

    // }

});


// Set UI controls
function setUIEvents() {

    $('#assembly-save').click(function() {
        saveAssembly();
    });

//     $('.icon-toggle-on').click(function() {
//         $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
//     });

//     $('.icon-bom').click(function() {
//         // $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
//         $('body').toggleClass('no-bom').toggleClass('no-spl');
//     });
    
//    $('#toggle-details').click(function() { $('body').toggleClass('no-details'); viewerResize();});
//    $ ('#close-asset-service').click(function() { $('body').removeClass('no-landing'); });

}


function getInitialData() {

    $.get('/plm/details', { link : urlParameters.link }, function(response) {

        console.log(response);

        $('#header-subtitle').html(response.data.title);

        let ebom   = getSectionFieldValue(response.data.sections, 'EBOM', '', 'link');
        links.mp   = getSectionFieldValue(response.data.sections, 'MANUFACTURING_PROCESS', '', 'link');
        links.item = urlParameters.link;

        console.log(ebom);

        

        insertViewer(ebom);
        insertBOM(urlParameters.link, {
            id          : 'tree',
            headerLabel : 'Manufacturing Process Definition',
            bomViewName : 'MPE',
            path        : true,
            openInPLM   : true,
            search      : true,
            toggles     : true,
            columnsIn   : ['Quantity', 'Type'],
            onClickItem : function(elemClicked) { selectMBOMNode(elemClicked); },
            viewerSelection : true,
            additionalRequests : [
                $.get('/plm/bom-views-and-fields', { link : urlParameters.link, useCache : settings.useCache })
            ]
            // afterCompletion : function() { console.log('1'); }
        });
        // insertGrid(mprc, {
        // });

        $.get('/plm/sections', { wsId : wsConfig.id }, function(response) {

            wsConfig.sections = response.data;

        });

        $.get('/plm/bom', { link : urlParameters.link }, function(response) {

            console.log(response);
            // let mbom = getBOMPartsList({
            //     // viewFields : wsEBOM.viewColumns
            // }, response.data);
            // console.log(mbom);
        });

        

    });

}

function changeBOMViewDone(id, settings, bomData, selectedItems, dataFlatBOM, dataAdditional) {

    // console.log(settings);
    console.log(bomData);
    console.log(dataAdditional);

    viewIds.item = settings.viewId;

    // console.log(viewIds);

    wsConfig.fieldUrnMP = '';

    for(let bomView of dataAdditional[0].data) {
        console.log(bomView);
        if(bomView.name === 'MPE') {
            for(let field of bomView.fields) {
                console.log(field);
                if(field.fieldId === 'MANUFACTURING_PROCESS') {
                    wsConfig.fieldUrnMP = field.__self__.urn;
                }
            }
        }
    }

    console.log(wsConfig.fieldUrnMP);

    let elemTHeadRow = $('#' + id + '-thead-row');

    $('<th></th>').appendTo(elemTHeadRow).addClass('column-icon').html('Icon');
    $('<th></th>').appendTo(elemTHeadRow).addClass('column-status');
    $('<th></th>').appendTo(elemTHeadRow).addClass('column-process').html('Manufacturing Process');

    $('#' + id + '-tbody').children().each(function() {

        let elemRow    = $(this);
        let type       = elemRow.find('.bom-column-type').html();
        let isAssembly = (type === 'Process');
        let elemIcon   = $('<div></div>').addClass('icon');
        let link       = $(this).attr('data-link');

        if(isAssembly) {
            elemRow.addClass('assembly');
            elemRow.attr('data-link-mp', '');
            elemIcon.addClass('icon-type');
        } else {
            elemRow.addClass('component');
            elemIcon.addClass('icon-product');
        }

        $('<td></td>').appendTo(elemRow)
            .addClass('column-icon')
            .append(elemIcon);

        $('<td></td>').appendTo(elemRow)
            .addClass('column-status')
            .addClass('status-red')
            .html('<div></div>');

        let elemCellProcess = $('<td></td>').appendTo(elemRow)
            .addClass('column-process');

        for(let node of bomData.nodes) {
            if(node.item.link === link) {
                console.log('1');
                let mp = getBOMNodeValue(node, wsConfig.fieldUrnMP, 'title');
                console.log(mp);
                elemCellProcess.html(mp);
            }
        }

    });

    openManufacturingProcess();

}


function selectMBOMNode(elemClicked) {

    let isAssembly = elemClicked.hasClass('assembly');

    console.log(isAssembly);

    if(isAssembly) {

        links.item = elemClicked.attr('data-link');
        links.mp   = elemClicked.attr('data-link-mp');

        if(isBlank(links.mp)) {
            createManufacturingProcess(elemClicked);
        } else {
            openManufacturingProcess();
        }

    } else {

        // insertDetails(elemClicked.attr('data-link'), {
        //     id : 'panel',
        //     openInPLM : true,
        //     expandSections : ['Basic'],
        //     toggles : true
        // })

        $('#assembly').hide();
        $('#component').show();

        insertItemSummary(elemClicked.attr('data-link'), {
            id       : 'component',
            bookmark : true,
            contents : [
                { type : 'sourcing'   , params : { id : 'component-sourcing', hideHeader : true, filterBySupplier : true} },
                { type : 'details'    , params : { id : 'component-details', expandSections : ['Basic'], toggles : true } },
                { type : 'attachments', params : { id : 'component-attachments', editable : true , singleToolbar : 'controls'} },
            ],
            layout       : 'tabs',
            hideCloseButton    : true,
            openInPLM    : true,
            reload       : true
        });

    }

}
function insertItemSummaryDataDone(id) {

    // $('#component-tabs').prepend($('<div>Sources</div>'));
    $('#component-tabs').prepend($('<div>Process</div>'));

}


function createManufacturingProcess(elemClicked) {

    console.log('createManufacturingProcess START');

    let params = {
        wsId      : wsConfig.id,
        sections  : []
    };

    addFieldToPayload(params.sections, wsConfig.sections, null, 'TITLE', 'MP of ' + elemClicked.attr('data-title').split(' [REV:')[0] );

    console.log(params);

    $.post({
        url         : '/plm/create', 
        contentType : 'application/json',
        data        : JSON.stringify(params)
    }, function(response) {
        if(response.error) {
            showErrorMessage('Error', 'Error while creating Manufacturing Process. Please review your server configuration.');
        } else {
            links.mp = response.data.split('.autodeskplm360.net')[1];
            elemClicked.attr('data-link-mp', links.mp);
            openManufacturingProcess();
            // callback();
        }
    }); 


}


// Display Assembly panel with MP controls
function openManufacturingProcess() {

    // console.log(links); 
    // console.log(viewIds); 

    let requests = [
        $.get('/plm/details', { link : links.mp }),
        $.get('/plm/bom'    , { link : links.mp, depth : 1 }),
        $.get('/plm/bom'    , { link : links.item, depth : 1,  viewId : viewIds.item })
    ];

    Promise.all(requests).then(function(responses) {

        console.log(responses);

        $('#assembly-name').html(responses[0].data.title);
        $('#assembly-instructions-text').val(getSectionFieldValue(responses[0].data.sections, 'INSTRUCTIONS', ''));
        
        $('#assembly').show();
        $('#component').hide();
        
    });

}



// Update Manufacturing Process
function saveAssembly() {

    console.log('saveAssembly');
    console.log(links);

    let params = { 
        link     : links.mp,
        sections : []
    };

    addFieldToPayload(params.sections, wsConfig.sections, null, 'INSTRUCTIONS', $('#assembly-instructions-text').val());

    console.log(params);

    $.post('/plm/edit', params, function(response) {
        console.log(response);
    });

}