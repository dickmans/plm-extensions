let chart;
// let title           = 'Activity Dashboard';
let enableMarkup    = false;
let fieldIdsMarkup  = [];
let wsConfig        = { 
    id                    : null,
    sections              : [],
    excludedSections      : [],
    'workflowHistory'       : {},
    'fields'                : [],
    'progress'              : null,
    'icon'                  : 'account_tree',
    'fieldIdSubtitle'       : '',
    'fieldIdItem'           : '',
    'tableauName'           : '',
    'tableauLink'           : '',
    'imageFieldsPrefix'     : 'MARKUP_'
}
let wsConfigBrowser = {
    'id' : '95',
    'viewName' : 'Product Browser',
    'tableau'               : ''
}

const locations = [
    '1600 Amphitheatre Parkway, Mountain View, CA',
    '2300 Traverwood Dr. Ann Arbor, MI',
    '76 Ninth Avenue, New York, NY'
];


$(document).ready(function() {

    setUIEvents();

    getFeatureSettings('assetServices', [], function(responses) {

        console.log(config.assetServices.wsLines.id);

        // insertResults('275', [{
        insertResults(config.assetServices.wsLines.id, [{
            field       : 'ID',
            type        : 0,
            comparator  : 21,
            value       : ''
        }], {
            id               : 'lines',
            headerLabel      : 'Sites & Assets',
            layout           : 'grid',
            contentSize      : 'xxl',
            tileImage        : 'IMAGE',
            tileTitle        : 'TITLE',
            tileSubtitle     : 'DESCRIPTION',
            reload           : true,
            search           : true,
            useCache         : true,
            onClickItem      : function(elemClicked) { seletLine(elemClicked); }
        });

        insertResults(config.assetServices.wsAssetServices.id, [{
            field       : 'ID',
            type        : 0,
            comparator  : 21,
            value       : ''
        }], {
            id               : 'services',
            headerLabel      : 'Your Asset Services',
            layout           : 'list',
            contentSize      : 'm',
            reload           : true,
            useCache         : false,
            onClickItem      : function(elemClicked) { selectAssetService(elemClicked); }
        });

    });


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


    //AIzaSyCZZ4kX1V8kdHPFELU20cEPeNPKULZrujw

    // $('#header-title').html(title);

    // document.title = title;

    // appendProcessing('workflow-history', false);
    // appendProcessing('details', false);
    // appendProcessing('attachments', false);

    // appendNoDataFound('list');
    // initMap();

    // appendOverlay(false);

    // 
    // setStatusColumns();
    // setCalendars();
    // setChart();

    // getInitialData();

});


// Set UI controls
function setUIEvents() {

    $('.icon-toggle-on').click(function() {
        $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
    });

    $('.icon-bom').click(function() {
        // $(this).toggleClass('icon-toggle-on').toggleClass('icon-toggle-off').toggleClass('filled');
        $('body').toggleClass('no-bom').toggleClass('no-spl');
    });
    
   $('#toggle-details').click(function() { $('body').toggleClass('no-details'); viewerResize();});
   $ ('#close-asset-service').click(function() { $('body').removeClass('no-landing'); });

}


function seletLine(elemClicked) {

    let descriptor = elemClicked.attr('data-descriptor');

    $('body').removeClass('no-assets');

    insertResults(config.assetServices.wsAssets.id, [{
        field       : 'LINE',
        type        : 0,
        comparator  : 15,
        value       : descriptor
    }], {
        id               : 'assets',
        headerLabel      : descriptor + ' Assets',
        layout           : 'list',
        useCache         : true,
        onClickItem      : function(elemClicked) { seletLine(elemClicked); }
    });

}


function selectAssetService(elemClicked) {

    $('body').addClass('no-landing');


    $.get('/plm/details', { link : elemClicked.attr('data-link')}, function(response) {

        let linkBOM  = getSectionFieldValue(response.data.sections, 'EBOM', '', 'link');
        let linkSerials  = getSectionFieldValue(response.data.sections, 'SERIAL_NUMBERS_LIST', '', 'link');

        insertItemSummary(response.params.link, {
            bookmark : true,
            contents : [
                // { type : 'workflow-history', className : 'surface-level-1', params : { id : 'request-workflow-history' } },
                { type : 'details'         ,  params : { 
                    id : 'request-details', 
                    collapsed : true, 
                    editable : true,
                    expandSections : ['Asset Details', 'Service Report'],
                    hideHeader : true,
                    suppressLinks : true, 
                    sectionsEx : ['Images']
                }},
                { type : 'grid'            ,  params : { id : 'request-grid', columnsEx : ['Comments', 'Required Tools'], layout : 'list', hideHeader : true} },
                { type : 'managed-items'   ,  params : { 
                        id : 'request-managed',
                        layout : 'list', 
                        hideHeader : false,
                        editable : true,
                        singleToolbar: 'controls',
                        onClickItem : function(elemClicked) { onSelectAssetItem(elemClicked); }
                    }

                },
                { type : 'attachments'     ,  params : { id : 'request-attachments', editable : true, layout : 'list', contentSize : 'm', singleToolbar : 'controls' } },
            ],
            statesColors    : [
                { label : 'New',         color : config.colors.red,    states : ['Received'] },
                { label : 'In Work',     color : config.colors.yellow, states : ['Review', 'Quote Creation'] },
                { label : 'Waiting',     color : config.colors.red,    states : ['Awaiting Response', 'Quote Submitted'] },
                { label : 'Delivery',    color : config.colors.yellow, states : ['Order in process', 'Shipment'] },
                { label : 'Completed',   color : config.colors.green,  states : ['Completed'] }
            ],
            id              : 'summary',
            
            hideCloseButton : true,
            layout          : 'tabs',
            openInPLM       : false,
            reload          : false,
            workflowActions : true
        });

        insertViewer(linkBOM);

        insertBOM(linkBOM, {
            bomViewName : 'Basic',
            search : true,
            viewerSelection : true
        });

        insertBOMPartsList(linkBOM, {
            id          : 'spl',
            bomViewName : 'Service',
            contentSize  : 's',
            headerLabel : 'Spare Parts',
            search      : true,
            selectItems : {
                fieldId : 'SPARE_WEAR_PART',
                values  : ['Yes', 'yes', 'Spare Part']
            },
            viewerSelection : true
        });

        // insertGrid(linkSerials, {
        //     id : 'serials',
        //     editable : true
        // })


    });


}


function onSelectAssetItem(elemClicked) {

    let link = elemClicked.attr('data-link');

    $('body').toggleClass('no-snl');

    viewerResize();

    insertGrid(link, {
        id : 'serials',
        headerLabel : 'Serial Numbers',
        editable : true,
        onClickItem : function(elemClicked) { selectSerialNumber(elemClicked); }

    })

}
function selectSerialNumber(elemClicked) {

    let elemCellDBID = elemClicked.find('.column-INSTANCE_ID');
    
    if(elemCellDBID.length === 0) return;
    
    let elemCellNUMBER = elemClicked.find('.column-ITEM_NUMBER');

    if(elemCellNUMBER.length === 0) return;

    let dbId   =   elemCellDBID.children('input').val();
    let number = elemCellNUMBER.children('input').val();

    viewerHighlightInstances(number, [dbId], { ghosting : false })

}