let now                = new Date();
let bomItems           = [];
let wsItems            = { id : '', sections : [], fields : [], picklists : [], viewId : '' };
let wsProblemReports   = { id : '', sections : [], fields : [] };
let wsSupplierPackages = { id : '', sections : [], fields : [] };
let kpis               = [];
let kpiFilters         = [];
let partNumbers        = [];
let workspaces         = [];
let relatedWorkspaces  = [];
let bomViewName        = 'Details';
let paramsBOM          = {};
let paramsDetails      = {};
let paramsAttachments  = {};
let paramsProcesses    = {};
let paramsCreateSupplierPackage = {}
let context = {}
 

$(document).ready(function() {

    let createWorkspaceIds = config.workspaces.problemReports.workspaceId   || common.workspaceIds.problemReports;
    

    urlParameters.bom           = urlParameters.link;
    bomViewName                 = config.panels.insertBOM.bomViewName || bomViewName;
    paramsDetails               = config.panels.insertDetails         || {};
    paramsAttachments           = config.panels.insertAttachments     || {};
    paramsProcesses             = config.panels.insertChangeProcesses || {};
    paramsCreateSupplierPackage = config.panels.createSupplierPackage || {};
    wsProblemReports.id         = config.workspaces.problemReports.workspaceId   || common.workspaceIds.problemReports;
    wsSupplierPackages.id       = config.workspaces.supplierPackages.workspaceId || common.workspaceIds.supplierPackages;
    
    paramsBOM = config.panels.insertBOM;
    paramsBOM.useCache = paramsBOM.useCache || true;

    paramsProcesses.createWorkspaceIds        = [createWorkspaceIds];
    paramsProcesses.createViewerImageFields   = [config.workspaces.problemReports.fieldIdImage];
    paramsProcesses.createContextItem         = urlParameters.link;
    paramsProcesses.createContextItemField    = config.workspaces.problemReports.fieldIdAffectedItem;
    paramsProcesses.createConnectAffectedItem = true;

    paramsCreateSupplierPackage.id                = 'create-connect';
    paramsCreateSupplierPackage.contextItemsField = 'SHARED_ITEMS';

    let requests = [ $.get('/plm/workspaces', {})];

    appendProcessing('dashboard', false);
    appendProcessing('bom', false);
    appendProcessing('details', false);
    appendViewerProcessing();
    appendOverlay(true);
    insertMenu();

    if(!isBlank(urlParameters.fieldidebom)) requests.push($.get('/plm/details', { link : urlParameters.link}));
    
    getFeatureSettings('explorer', requests, function(responses) {

        workspaces = responses[0].data;
        
        if(!isBlank(urlParameters.fieldidebom)) {
            urlParameters.bom = getSectionFieldValue(responses[0].data.sections, urlParameters.fieldidebom, '');
            wsItems.id = urlParameters.bom.split('/')[4];
        } else if(isBlank(urlParameters.wsid)) {
            wsItems.id = common.workspaceIds.items;
        } else {
            wsItems.id = urlParameters.wsid;
        }

        showStartupDialog();

        getInitialData(function() {        
            if(!isBlank(urlParameters.dmsid)) {
                openItem(urlParameters.bom);
            } else {
                $('#startup').remove();
                $('body').removeClass('screen-startup');
                $('body').children().removeClass('hidden');
                openLandingPage();
            }
        });

    });

    setUIEvents();

});

function setUIEvents() {

    // Header Toolbar
    $('#select-version').change(function() {
        selectItemVersion();
    });
    $('#button-toggle-recents').click(function() {
        $('body').toggleClass('no-recents');
        $(this).toggleClass('toggle-on').toggleClass('toggle-off').toggleClass('filled');
    });
    $('#button-toggle-search').click(function() {
        $('body').toggleClass('no-search');
        $(this).toggleClass('toggle-on').toggleClass('toggle-off').toggleClass('filled');

    });
    $('#button-home').click(function() {
        // $('body').addClass('screen-landing').removeClass('screen-main');
        

        openLandingPage();
    });
    $('#button-toggle-dashboard').click(function() {
        $('body').toggleClass('no-dashboard');
        viewerResize();
    });
    $('#button-toggle-layout').click(function() {

        let elemBody = $('body')

             if(elemBody.hasClass('layout-1')) elemBody.addClass('layout-2').removeClass('layout-1');
        else if(elemBody.hasClass('layout-2')) elemBody.addClass('layout-3').removeClass('layout-2');
        else if(elemBody.hasClass('layout-3')) elemBody.addClass('layout-4').removeClass('layout-3');
        else if(elemBody.hasClass('layout-4')) elemBody.addClass('layout-1').removeClass('layout-4');

        toggleBOMLayout();
        viewerResize();
    });
    $('#button-toggle-attachments').click(function() {
        $('body').toggleClass('with-attachments');
        viewerResize();
    });
    $('#button-toggle-details').click(function() {
        $('body').toggleClass('with-details');
        if($('body').hasClass('with-details')) {
            $('body').addClass('with-panel');
            $('body').removeClass('with-processes');
        } else {
            $('body').removeClass('with-panel');
        }
        viewerResize();
    });
    $('#button-toggle-processes').click(function() {
        $('body').toggleClass('with-processes');
        if($('body').hasClass('with-processes')) {
            $('body').addClass('with-panel');
            $('body').removeClass('with-details');
        } else {
            $('body').removeClass('with-panel');
        }
        viewerResize();
    });

  
    // Dashboard
    $('#collapse-all-kpis').click(function() {
        $('.kpi').each(function() {
            if(!$(this).hasClass('collapsed')) $(this).find('.kpi-header').click();
        });
    });
    $('#expand-all-kpis').click(function() {
        $('.kpi').each(function() {
            if($(this).hasClass('collapsed')) $(this).find('.kpi-header').click();
        });
    });
    $('#dashboard-reset').click(function() {
        $('.kpi-value.selected').removeClass('selected');
        $('#dashboard-reset').addClass('hidden');
        applyKPIFilters();
    });
    $('#dashboard-refresh').click(function() {
        refreshKPIs();
    });


    // Create Connect Dialog
    $('#create-connect-cancel').click(function() {
        $('#overlay').hide();
        $('#create-connect').hide();
    });
    $('#create-connect-confirm').click(function() {
        
        if(!validateForm($('#create-connect-sections'))) return;

        $('#create-connect').hide();

        submitCreate(wsSupplierPackages.id, $('#create-connect-sections'), null, {}, function(response ) {
            $('#overlay').hide();
        });
        
    });

}
function toggleBOMLayout() {

    if($('body').hasClass('layout-1')) {

        $('#bom-thead').children('tr').each(function() {
            $(this).children('th').each(function() {
                if($(this).index() > 2) $(this).addClass('hidden');
            });
        });

        $('#bom-tbody').children('tr').each(function() {
            $(this).children('td').each(function() {
                if($(this).index() > 2) $(this).addClass('hidden');
            });
        });

    } else {

        $('#bom-thead').find('th.hidden').removeClass('hidden');
        $('#bom-tbody').find('td.hidden').removeClass('hidden');

    }

}
function selectBOMItem(elemClicked) {

    $('#create-process').show();
    $('#cancel-process').hide();
    $('#save-process').hide();
    $('#processes-details').hide();
    
    let partNumbers = [];

    if(!elemClicked.hasClass('selected')) {
        paramsProcesses.createContextItem = urlParameters.link;

        insertAttachments($('#viewer').attr('data-link'), paramsAttachments);
        insertDetails(context.link, paramsDetails, {
            sections  : wsItems.sections,
            fields    : wsItems.fields,
            picklists : wsItems.picklists
        });
        insertChangeProcesses(context.link, paramsProcesses);

    } else {      

        partNumbers.push(elemClicked.attr('data-part-number'));

        let linkSelected   = elemClicked.attr('data-link');

        $('#details').attr('data-link', linkSelected);
        
        paramsProcesses.createContextItem = elemClicked.attr('data-link');

        insertDetails(linkSelected, paramsDetails, {
            sections  : wsItems.sections,
            fields    : wsItems.fields,
            picklists : wsItems.picklists
        });
        insertAttachments(linkSelected, paramsAttachments);
        insertChangeProcesses(linkSelected, paramsProcesses);
        
    }

}


// Retrieve Workspace Details, BOM and details
function getInitialData(callback) {

    let requests = [
        $.get('/plm/bom-views-and-fields' , { wsId : wsItems.id, useCache : paramsBOM.useCache     || true }),
        $.get('/plm/sections'             , { wsId : wsItems.id, useCache : paramsDetails.useCache || true }),
        $.get('/plm/fields'               , { wsId : wsItems.id, useCache : paramsDetails.useCache || true }),
        // $.get('/plm/details'              , { link : urlParameters.bom })
    ];

    if(!isBlank(wsProblemReports.id)) {
        requests.push($.get('/plm/sections', { wsId : wsProblemReports.id, useCache : paramsProcesses.useCache || true }));
        requests.push($.get('/plm/fields'  , { wsId : wsProblemReports.id, useCache : paramsProcesses.useCache || true }));
    }

    if(!isBlank(wsSupplierPackages.id)) {
        requests.push($.get('/plm/sections', { wsId : wsSupplierPackages.id, useCache : paramsCreateSupplierPackage.useCache || true }));
        requests.push($.get('/plm/fields'  , { wsId : wsSupplierPackages.id, useCache : paramsCreateSupplierPackage.useCache || true }));
    }

    Promise.all(requests).then(function(responses) {

        for(let view of responses[0].data) {
            if(view.name === bomViewName) {
                wsItems.viewId = view.id;
                wsItems.viewColumns = view.fields;
            }
        }

        if(wsItems.viewId === '') showErrorMessage('Error in configuration. Could not find BOM view "' + bomViewName + '"');

        wsItems.sections = responses[1].data;
        wsItems.fields   = responses[2].data;

        if(!isBlank(wsProblemReports.id)) {
            wsProblemReports.sections = responses[3].data;
            wsProblemReports.fields   = responses[4].data;
        }

        if(!isBlank(wsSupplierPackages.id)) {
            wsSupplierPackages.sections = responses[5].data;
            wsSupplierPackages.fields   = responses[6].data;
        }

        callback();

    });

}


// Open landing page if no item is defined and when clicking the home button
function openLandingPage() {

    document.title = documentTitle;
    window.history.replaceState(null, null, '/explorer?theme=' + theme);

    $('#header-subtitle').hide();
    $('body').addClass('screen-landing').removeClass('screen-main');

    if($('body').hasClass('home-pending')) {

        insertRecentItems({
            headerLabel  : 'Recently Viewed',
            reload       : true,
            contentSize  : 'xs',
            workspacesIn : [ wsItems.id ],
            onClickItem : function(elemClicked) { openSelectedItem(elemClicked); }
        });

        insertSearch({
            autoClick    : false,
            contentSize  : 'xs',
            images       : true,
            limit        : 50,
            workspaceIds : [ wsItems.id ],
            tileCounter  : true,
            onClickItem  : function(elemClicked) { openSelectedItem(elemClicked); }
        });

        insertWorkspaceViews(wsItems.id, {
            id          : 'products',
            fieldsEx    : [ 'Image', 'PDM Status' ],
            headerLabel : 'Items Workspace',
            number      : true,
            search      : true,
            pagination  : true,
            reload      : true,
            limit       : 50,
            onClickItem : function(elemClicked) { openSelectedItem(elemClicked); },
            tableColumnsLimit : 10
        });

        insertBookmarks({
            headerLabel  : 'Bookmarks',
            reload       : true,
            contentSize  : 'xs',
            workspacesIn : [ wsItems.id ],
            onClickItem  : function(elemClicked) { openSelectedItem(elemClicked); }
        });

    }

    $('body').removeClass('home-pending');

}


// Open by id or click in landing page
function openSelectedItem(elemClicked) { 
    $('#overlay').show();
    openItem(elemClicked.attr('data-link')); 
}
function openItem(link) {

    setCacheStatusIndicator('pending');
    $('#select-version').children().remove();

    let requests = [ $.get('/plm/versions', { link : link }) ]

    if(paramsProcesses.editable) {
        if(relatedWorkspaces.length === 0) {
            requests.push($.get('/plm/linked-workspaces', { link : link, useCache : paramsProcesses.useCache || true }));
        }
    }
    
    Promise.all(requests).then(function(responses) {
        
        $('#overlay').hide();
        $('#startup').remove();
        $('body').removeClass('screen-startup');
        $('body').children().removeClass('hidden');
        $('body').addClass('screen-main').removeClass('screen-landing');

        for(let version of responses[0].data.versions) {

            let label = (isBlank(version.version)) ? version.status : 'Rev ' + version.version;

            if(version.version === 'OBS') label = 'OBSOLETE';

             $('<option></option>').appendTo($('#select-version'))
                .attr('value', version.item.link)
                .attr('data-title', version.item.title)
                .attr('data-status', version.status)
                .html(label);

        }

        if(responses.length > 1) relatedWorkspaces = responses[1].data;

        $('#select-version').val(link);
        selectItemVersion();

    });

}
function selectItemVersion() {

    let linkVersion = $('#select-version').val();
    let split       = linkVersion.split('/');
    let selOption   = $('#select-version').find(':selected');
    let title       = selOption.attr('data-title');
    let status      = selOption.attr('data-status');

    window.history.replaceState(null, null, '/explorer?wsid=' + split[4] + '&dmsid=' + split[6] + '&theme=' + theme);
    
    document.title = title;
    context.title  = title;
    context.link   = linkVersion;

    $('#header-subtitle').html(title).show();
    $('#details').attr('data-link', linkVersion);
    $('#bom-table-tree').html('');
    $('#bom-table-flat').html('');
    $('.kpi').remove();
    $('#dashboard-processing').show();
    $('#bom-processing').show();

    kpis     = [];
    bomItems = [];     

    let requests = [ 
        $.get('/plm/permissions', { link : linkVersion }),
        $.get('/plm/details'    , { link : linkVersion }) 
    ];

    if(wsItems.picklists.length === 0) {

        let picklistsDetails = getFieldsPicklists({
            fields   : wsItems.fields,
            editable : paramsDetails.editable || false,
            fieldsIn : paramsDetails.fieldsIn || [],
            fieldsEx : paramsDetails.fieldsEx || [],
        });

        let picklistsBOM = getFieldsPicklists({
            fields   : wsItems.viewColumns,
            editable : paramsBOM.editable || false,
            fieldsIn : paramsBOM.fieldsIn || [],
            fieldsEx : paramsBOM.fieldsEx || [],
        });

        let picklistsAll = picklistsDetails.concat(picklistsBOM.filter(item => !picklistsDetails.includes(item)));

        for(let picklist of picklistsAll) {
            requests.push($.get('/plm/picklist', { 
                link      : picklist, 
                useCache  : paramsDetails.useCache,
                requestor : 'explorer.js / selectItemVersion()'
            }));
        }

    }

    Promise.all(requests).then(function(responses) {

        for(let index = 2; index < responses.length; index++) wsItems.picklists.push(responses[index].data);

        let editDetails = hasPermission(responses[0].data, 'edit_items');
        let editBOM     = hasPermission(responses[0].data, 'edit_bom');       

        paramsBOM.bomViewName        = bomViewName;
        paramsBOM.bomViewId          = wsItems.viewId;
        paramsBOM.singleToolbar      = 'controls';
        paramsBOM.includeBOMPartList = true;
        paramsBOM.revisionBias       = (status === 'WORKING') ? 'working' : 'release';
        paramsBOM.onClickItem        = function(elemClicked) { selectBOMItem(elemClicked); }
        paramsBOM.afterCompletion    = function(id, data) { 
            getBOMKPIs(id, data); 
            toggleBOMLayout();
            insertSupplierPackageCreationButton();
        }

        if(!editDetails) paramsDetails.editable = false;
        if(!editBOM    ) paramsBOM.editable     = false;
        
        viewerLeaveMarkupMode();
        insertBOM(linkVersion, paramsBOM, {
            details     : responses[1].data,
            viewColumns : wsItems.viewColumns,
            sections    : wsItems.sections,
            picklists   : wsItems.picklists,
            workspaces  : workspaces
        });
        insertViewer(linkVersion);
        insertDetails(linkVersion, paramsDetails, {
            sections    : wsItems.sections,
            fields      : wsItems.fields,
            picklists   : wsItems.picklists,
            permissions : responses[0].data,
        });
        insertAttachments(linkVersion, paramsAttachments, { permissions : responses[0].data });
        insertChangeProcesses(linkVersion, paramsProcesses, {
            permissions       : responses[0].data,
            workspaces        : workspaces,
            relatedWorkspaces : relatedWorkspaces
        });

    });

}


// Get viewable and init Forge viewer
function onViewerSelectionChanged(event) {

    if(viewerHideSelected(event)) return;

    let found = false;

    if(viewer.getSelection().length === 0) {

        return;

    } else {

        viewer.getProperties(event.dbIdArray[0], function(data) {

            for(property of data.properties) {

                if(common.viewer.numberProperties.indexOf(property.displayName) > -1) {

                    let partNumber = property.displayValue;

                    $('tr').each(function() {
                        if(!found) {
                            if($(this).attr('data-part-number') === partNumber) {
                                found = true;
                                $(this).click();
                            }
                        }
                    });

                    if(!found) {
                        if(partNumber.indexOf(':') > -1 ) {
                            partNumber = property.displayValue.split(':')[0];
                            $('tr').each(function() {
                                if(!found) {
                                    if($(this).attr('data-part-number') === partNumber) {
                                        found = true;
                                        $(this).click();
                                    }
                                }
                            });
                        }
                    }

                }

            }

        });

    }

}
function initViewerDone() {
    
    $('#viewer-markup-image').attr('data-field-id', config.workspaces.problemReports.fieldIdImage);

}


// Add Button to BOM tree for Supplier Package creation
function insertSupplierPackageCreationButton() {

    let elemToolbar = $('#bom-controls');

    $('<div></div>').prependTo(elemToolbar)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-send')
        .addClass('multi-select-action')
        .attr('title', 'Create new Supplier Package for selected item')
        .click(function() {
            
            paramsCreateSupplierPackage.contextItems = [];

            $('#bom-tbody').find('.selected').each(function() {
                let link = $(this).attr('data-link');
                if(!paramsCreateSupplierPackage.contextItems.includes(link)) 
                    paramsCreateSupplierPackage.contextItems.push(link);
            });

            insertCreate([], [common.workspaceIds.supplierPackages], paramsCreateSupplierPackage);
        });

}


// Parse BOM data to derive KPIs
function getBOMKPIs(id, data) {

    kpis = [];

    for(let kpi of config.kpis) {
        for(let field of settings[id].columns) {
            if(field.fieldId === kpi.fieldId) {
                let newKPI = Object.assign({}, kpi);
                newKPI.fieldType = field.type.title;
                kpis.push(newKPI);
            }
        }
    }
    
    for(let kpi of kpis) {
        for(let entry of kpi.data) {
            entry.count = 0;
        }
    }

    let index = 0;

    for(let bomItem of data.bomPartsList) {

        if(index > 0) {
        
            bomItem.kpis = {};

            for(let kpi of kpis) {

                let kpiValue = bomItem.details[kpi.fieldId];
                let kpiLabel = kpiValue;
                let digits   = kpi.digits  || 2;

                if(kpi.hasOwnProperty('digits')) kpi.fieldType = 'Float';

                if(kpiValue !== null) {

                    if(typeof kpiValue === 'object') kpiValue = kpiValue.title;

                        if(kpi.type === 'non-empty') {
                        if(kpiValue === null) kpiValue = 'No';
                        else kpiValue = (kpiValue === '' ) ? 'No' : 'Yes';
                        kpiLabel = kpiValue;
                    } else if(kpi.type ==  'days'     ) {
                        if(kpiValue === '') {
                            kpiLabel = '-';
                        } else if(kpiValue === null) {
                            kpiLabel = '-';
                        } else {
                            let day  = kpiValue.split(' ')[0].split('-');
                            let date = new Date(day[0], day[1], day[2].split('T')[0]);
                            var diff = now.getTime() - date.getTime();
                            kpiValue = diff / (1000 * 3600 * 24);
                            kpiValue = Math.round(kpiValue, 0);
                            kpiLabel = kpiValue + ' days ago';
                        }
                    } else if(kpi.type === 'value'    ) {
                        if(kpi.fieldType === 'Float') kpiLabel = parseFloat(kpiValue).toFixed(digits);
                        else kpiLabel = (kpiValue === '' ) ? '-' : kpiValue;
                    }

                    if(kpiValue === ''  ) kpiValue = '-';

                } else kpiValue = '-';

                bomItem.kpis[kpi.id] = kpiValue;
                parseKPI(kpi, kpiValue, kpiLabel);

            }
        }

        bomItems.push(bomItem);
        index++;

    }

    $('#dashboard-panel').html('');

    $('<span></span>').appendTo($('#dashboard-panel'))
        .html('Click the KPI values and bars below to filter the BOM and viewer for the matching items. Keep [SHIFT] pressed to select multiple values from the same and / or different KPIs to combine the filters. Deselect a single value by clicking it again. Once a value is selected, the reset button in the top toolbar can be used to clear all selections at once.')
        .attr('title', 'Click this text to remove it')
        .click(function() { $(this).remove(); });

    for(let kpi of kpis) insertKPI(kpi);

    $('#dashboard-processing').hide();

}
function parseKPI(kpi, value, label) {

    let isNew = true;

    for(let entry of kpi.data) {
        if(entry.value == value) {
            entry.count++;
            isNew = false;
            break;
        }
    }

    if(isNew) kpi.data.push({ 
        value     : value, 
        label     : label,
        count     : 1, 
        color     : colors.list[ kpi.data.length % colors.list.length ],
        vector    : colors.vectors.list[kpi.data.length % colors.vectors.list.length] 
    });

}
function insertKPI(kpi) {

    let elemDashboard = $('#dashboard-panel');
    
    let elemKPI = $('<div></div>').appendTo(elemDashboard)
        .attr('data-kpi-id', kpi.id)
        .addClass('kpi');

    $('<div></div>').appendTo(elemKPI)
        .addClass('kpi-selector')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            selectKPI($(this).parent());
        });

    $('<div></div>').appendTo(elemKPI)
        .addClass('kpi-header')
        .html(kpi.title)
        .click(function() {
            $(this).parent().toggleClass('collapsed');
            $(this).parent().find('.kpi-values').toggle();
        });

    let elemKPIValues = $('<div></div>').appendTo(elemKPI)
        .addClass('kpi-values')
        .addClass(kpi.style);
        

    if(kpi.style === 'bars') {

        let sortBy        = kpi.sortBy        || 'count';
        let sortDirection = kpi.sortDirection || 'descending';

        sortBy        = sortBy.toLowerCase();
        sortDirection = sortDirection.toLowerCase();

        sortArray(kpi.data, sortBy, kpi.fieldType, sortDirection);

        let max = 1; 

        for(let entry of kpi.data) {
            if(entry.count > max) max = entry.count;
        }

        kpi.max = max;

    }

    for(let entry of kpi.data) {

        let color  = entry.color;
        let label  = entry.label || entry.value;

        if(typeof color === 'string') {
            if(color.indexOf('#')  < 0) color = colors[color]; 
        } else color = colors.list[color];

        entry.color = color;

        if(label === '') label = '-';

        let elemKPIValue = $('<div></div>').appendTo(elemKPIValues)
            .attr('data-filter', entry.value)
            .addClass('kpi-value')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                selectKPIValue(e, $(this));
            });
    
        let elemKPILabel = $('<div></div>').appendTo(elemKPIValue)
            .addClass('kpi-label')
            .html(label);

        $('<div></div>').appendTo(elemKPIValue)
            .addClass('kpi-counter')
            .html(entry.count);

        if(kpi.style === 'bars') {
            let width = entry.count * 100 / kpi.max;
            elemKPIValue.css('background', 'linear-gradient(90deg, ' + color + ' 0 ' + width + '%, var(--color-surface-level-1) ' + width + '% 100%)');
        } else {
            elemKPILabel.css('border-color', color);
        }

    }

}


// KPI Selection & Filtering
function selectKPI(elemClicked) {
    
    let id         = elemClicked.attr('data-kpi-id');
    let isSelected = elemClicked.hasClass('selected');
    let kpiData    = null;
    
    $('.kpi').removeClass('selected');
    $('.tree-color').each(function() { $(this).css('background', '') });
    viewerResetColors();

    if(isSelected) return; 
        
    for(let kpi of kpis) {
        if(kpi.id === id) {
            kpiData = kpi.data;
            break;
        }
    }

    if(kpiData === null) return;

    elemClicked.addClass('selected');

    elemClicked.find('.kpi-value').each(function() {
    
        let filter      = $(this).attr('data-filter');
        let color       = '';
        let vector      = null;
        let partNumbers = [];

        for(let entry of kpiData) {
            if(entry.value == filter) {
                color  = entry.color;
                vector = entry.vector;
                break;
            }
        }

        $('#bom-tbody').children().each(function() {
            
            let value  = null;
            let link   = $(this).attr('data-link');
            let isNode = $(this).hasClass('node');

            for (let bomItem of bomItems) {
                if(bomItem.link === link) {
                    value = bomItem.kpis[id].toString();
                }
            }

            if(value == filter) {
                if(!isNode) partNumbers.push($(this).attr('data-part-number'));
                $(this).find('.tree-color').css('background', color);
            }

        });

        if(vector !== null) {
            if(typeof vector === 'string') vector = colors.vectors[vector]; 
            else if(typeof vector === 'number') vector = colors.vectors.list[vector]; 
        }

        viewerSetColors(partNumbers, { 
            color       : vector,
            resetColors : false
        });

    });

}
function selectKPIValue(e, elemClicked) {

    let isSelected = elemClicked.hasClass('selected');
    
    if(!e.shiftKey) $('.kpi-value').removeClass('selected');

    if(isSelected) elemClicked.removeClass('selected');
    else           elemClicked.addClass('selected');
    
    if($('.kpi-value.selected').length > 0) $('#dashboard-reset').removeClass('hidden'); else $('#dashboard-reset').addClass('hidden');

    applyKPIFilters();

}
function applyKPIFilters() {

    kpiFilters  = [];
    partNumbers = [];

    $('.kpi-value.selected').each(function() {

        let id    = $(this).closest('.kpi').attr('data-kpi-id');
        let value = $(this).attr('data-filter');
        let isNew = true;

        for(let filter of kpiFilters) {
            if(filter.id === id) {
                filter.values.push(value);
                isNew = false;
            }
        }

        if(isNew) kpiFilters.push({
            id     : id,
            values : [value]
        });

    });

    viewerResetSelection(true);
    filterPanelContent('bom');

    if(!config.kpiDrillDown) return;

    for(let kpi of kpis) {
        kpi.max = 0;
        for(let entry of kpi.data) {
            entry.count = 0;
            
        }
    }

    let bomMatches = [];

    for(let bomItem of bomItems) {
        if(bomItem.hasOwnProperty('kpis')) {
            let isMatch = true;
            for(let kpiFilter of kpiFilters) {
                let value = bomItem.kpis[kpiFilter.id].toString();
                if(kpiFilter.values.indexOf(value) < 0) isMatch = false;
            }
            if(isMatch) bomMatches.push(bomItem);
        }
    }

    for(let bomMatch of bomMatches) {
        for(let kpi of kpis) {
            let value = bomMatch.kpis[kpi.id].toString();
            for(let entry of kpi.data) {
                if(value == entry.value) {
                    entry.count++;
                    if(entry.count > kpi.max) kpi.max = entry.count;
                }
            }
        }
    }

    $('.kpi-counter').html(0);

    $('.kpi-values').each(function() {

        let elemValues = $(this);
        let kpiId      = elemValues.parent().attr('data-kpi-id');

        for(let kpi of kpis) {

            if(kpi.id === kpiId) {

                for(let entry of kpi.data) {

                    if(elemValues.hasClass('counters')) {

                        elemValues.children().each(function() {
                            let elemValue = $(this);
                            if(elemValue.attr('data-filter') === entry.value) {
                                elemValue.find('.kpi-counter').html(entry.count);
                            }
                        });

                    } else {

                        elemValues.children().each(function() {
                            let elemValue = $(this);
                            if(elemValue.attr('data-filter') == entry.value) {
                                elemValue.find('.kpi-counter').html(entry.count);
                                let percent = (kpi.max === 0) ? 0 : (entry.count * 100 / kpi.max);
                                elemValue.css('background', 'linear-gradient(90deg, ' + entry.color + ' 0% ' + percent + '%, var(--color-surface-level-1) ' + percent + '% 100%)');
                            }
                        });                        

                    }
                }

            }

        }

    });

    if(kpiFilters.length === 0) viewerResetColors();
    else viewerSelectModels(partNumbers);

}
function applyAdditionalContentItemFilter(elemContentItem, showContentItem) {

    if(!showContentItem) return -1;
    if(kpiFilters.length === 0) return 0;

    let link = elemContentItem.attr('data-link');

    for(let bomItem of bomItems) {
        if(bomItem.link === link) {
            for(let kpiFilter of kpiFilters) {
                let value = bomItem.kpis[kpiFilter.id].toString();
                if(kpiFilter.values.indexOf(value) < 0) showContentItem = false;
            }
        }
    }

    if(showContentItem) {
        partNumbers.push(elemContentItem.attr('data-part-number'));
    }

    return showContentItem;

}
function refreshKPIs() {

    let params = {
        link            : settings['bom'].link,
        depth           : settings['bom'].depth,
        revisionBias    : settings['bom'].revisionBias,
        viewId          : settings['bom'].viewId,
        getBOMPartsList : true
    }

    $('#dashboard-panel').addClass('hidden');
    $('#dashboard-processing').show();

    $.get('/plm/bom', params, function(response) {

        bomItems = [];

        for(let kpi of kpis) {
            for(data of kpi.data) {
                data.count = 0;
            }
        };

        getBOMKPIs('bom', response.data); 
        
        $('#dashboard-panel').removeClass('hidden');
        $('#dashboard-processing').hide();

    });
    
}
function refreshKPI(kpi) {

    let elemDashboard = $('#dashboard-panel');

    if(kpi.style === 'bars') {

        let sort = (typeof kpi.sort === 'undefined') ? 'count' : kpi.sort;

        sortArray(kpi.data, sort, 'number', 'descending');

        let max = 1; 

        for(entry of kpi.data) {
            if(entry.count > max) max = entry.count;
        }

        kpi.max = max;

    }

    elemDashboard.children('.kpi').each(function() {
        
        let elemKPI = $(this);
        let id = elemKPI.attr('data-kpi-id');

        if(id === kpi.id) {
        
            let elemKPISelector = $(this).children('.kpi-selector').first();

            if(elemKPI.hasClass('selected')) {
                elemKPI.removeClass('selected');
                elemKPISelector.click();
            }
            
        let elemKPIValues = $(this).children('.kpi-values').first();
        elemKPIValues.html('');

        for(entry of kpi.data) {

            let color =  entry.color;
            let label = (entry.value === '') ? '-' : entry.value;
    
            let elemKPIValue = $('<div></div>').appendTo(elemKPIValues)
                .attr('data-filter', entry.value)
                .addClass('kpi-value')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    selectKPIValue(e, $(this));
                });
        
            let elemKPILabel = $('<div></div>').appendTo(elemKPIValue)
                .addClass('kpi-label')
                .html(label);

    
            $('<div></div>').appendTo(elemKPIValue)
                .addClass('kpi-counter')
                .html(entry.count);
    
            if(kpi.style === 'bars') {
                let width = entry.count * 100 / kpi.max;
                elemKPIValue.css('background', 'linear-gradient(90deg, ' + color + ' 0 ' + width + '%, var(--color-surface-level-1) ' + width + '% 100%)');
            } else {
                elemKPILabel.css('border-color', entry.color);
            }
    
        }
    }

    });
    
}


// Reset BOM selection
function panelResetDone(id, elemClicked) {
    viewerResetSelection(true);
    $('#dashboard-reset').click();
}