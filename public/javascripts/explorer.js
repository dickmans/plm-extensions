let fields, sections, viewId;
let urnPartNumber = '';
let urns = {
    'partNumber' : ''
}

let colorGreen  = '#6a9728';
let colorYellow = '#faa21b';
let colorRed    = '#dd2222';

let viewerDone  = false;
let now         = new Date();


let kpiVectors  = [ new THREE.Vector4(205/255,  101/255, 101/255, 0.8), new THREE.Vector4(225/255, 225/255, 84/255, 0.8), new THREE.Vector4(59/255, 210/255, 59/255, 0.8) ]; // red yellow green


let kpis = [{
    'id'        : 'lifecycle',
    'title'     : 'Item Lifecycle',
    'fieldId'   : 'LIFECYCLE',
    'urn'       : '',
    'type'      : 'value',
    'style'     : 'counters',
    'data'      : [
        { 'value' : 'Working',    'count' : 0, 'color' : colorRange[0], 'vector' : kpiVectors[0] },
        { 'value' : 'Production', 'count' : 0, 'color' : colorRange[4], 'vector' : kpiVectors[2] }
    ]
},{
    'id'        : 'change',
    'title'     : 'Pending Change',
    'fieldId'   : 'WORKING_CHANGE_ORDER',
    'urn'       : '',
    'type'      : 'non-empty',
    'style'     : 'counters',
    'data'      : [
        { 'value' : 'Yes', 'count' : 0, 'color' : colorRange[0], 'vector' : kpiVectors[0]},
        { 'value' : 'No' , 'count' : 0, 'color' : colorRange[4], 'vector' : kpiVectors[2] }
    ]
},{
    'id'        : 'category',
    'title'     : 'Vault Category',
    'fieldId'   : 'CATEGORY',
    'urn'       : '',
    'type'      : 'value',
    'style'     : 'bars',
    'data'      : []
},{
    'id'        : 'lead-time',
    'title'     : 'Lead Time',
    'fieldId'   : 'LEAD_TIME',
    'urn'       : '',
    'type'      : 'value',
    'style'     : 'bars',
    'data'      : []
},{
    'id'        : 'make-or-buy',
    'title'     : 'Make or Buy',
    // 'fieldId'   : 'MAKE_OR_BUY',
    'fieldId'   : 'MAKE_BUY',
    'urn'       : '',
    'type'      : 'value',
    'style'     : 'counters',
    'data'      : [
        { 'value' : 'Buy' , 'count' : 0, 'color' : colorRange[0], 'vector' : kpiVectors[0] },
        { 'value' : '-'   , 'count' : 0, 'color' : colorRange[2], 'vector' : kpiVectors[1] },
        { 'value' : 'Make', 'count' : 0, 'color' : colorRange[4], 'vector' : kpiVectors[2] }
    ]
},{
    'id'        : 'vendor',
    'title'     : 'Vendor',
    'fieldId'   : 'VENDOR',
    'urn'       : '',
    'type'      : 'value',
    'style'     : 'bars',
    'data'      : []
},{
    'id'        : 'spare-part',
    'title'     : 'Spare Part',
    // 'fieldId'   : 'IS_SPARE_PART',
    'fieldId'   : 'SPAREWEAR_PART',
    'urn'       : '',
    'type'      : 'value',
    'style'     : 'counters',
    'data'      : [
        { 'value' : '-' , 'count' : 0, 'color' : colorRange[0], 'vector' : kpiVectors[0] },
        { 'value' : 'Wear Part'  , 'count' : 0, 'color' : colorRange[2], 'vector' : kpiVectors[1] },
        { 'value' : 'Spare Part', 'count' : 0, 'color' : colorRange[4], 'vector' : kpiVectors[2] }
    ]
},{
    'id'        : 'material',
    'title'     : 'Material',
    'fieldId'   : 'MATERIAL',
    'urn'       : '',
    'type'      : 'value',
    'style'     : 'bars',
    'data'      : []
},{
    'id'        : 'vendor',
    'title'     : 'Vendor',
    'fieldId'   : 'VENDOR',
    'urn'       : '',
    'type'      : 'value',
    'style'     : 'bars',
    'data'      : []
},{
    'id'        : 'folder',
    'title'     : 'Vault Folder',
    'fieldId'   : 'FOLDER',
    'urn'       : '',
    'type'      : 'value',
    'style'     : 'bars',
    'data'      : []
},{
    'id'        : 'last-update',
    'title'     : 'Last Updated By',
    'fieldId'   : 'LAST_UPDATED_BY',
    'urn'       : '',
    'type'      : 'value',
    'style'     : 'bars',
    'data'      : []
},{
    'id'        : 'last-update',
    'title'     : 'Last Modification',
    'fieldId'   : 'LAST_UPDATED',
    'urn'       : '',
    'type'      : 'days',
    'sort'      : 'value',
    'style'     : 'bars',
    'data'      : []
}];

let bomItems    = [];


$(document).ready(function() {
    
    let link = '/api/v3/workspaces/' + wsId + '/items/' + dmsId;

    getDetails();
    getWSConfig();
    getRequestWSConfig();
    setViewer();
    setUIEvents();
    setAttachments(link);
    setProcesses(link);
    
});

function setUIEvents() {

    // Header Toolbar
    $('#button-toggle-dashboard').click(function() {
        $('body').toggleClass('no-dashboard');
        setTimeout(function() { viewer.resize(); }, 250);
    });
    $('#button-toggle-bom').click(function() {
        $('body').toggleClass('no-bom-tree');
        setTimeout(function() { viewer.resize(); }, 250);
    });
    $('#button-toggle-attachments').click(function() {
        $('body').toggleClass('no-attachments');
        setTimeout(function() { viewer.resize(); }, 250);
    });
    $('#button-toggle-details').click(function() {
        $('body').toggleClass('with-details');
        if($('body').hasClass('with-details')) {
            $('body').addClass('with-panel');
            $('body').removeClass('with-processes');
        } else {
            $('body').removeClass('with-panel');
        }
        setTimeout(function() { viewer.resize(); }, 250);
    });
    $('#button-toggle-processes').click(function() {
        $('body').toggleClass('with-processes');
        if($('body').hasClass('with-processes')) {
            $('body').addClass('with-panel');
            $('body').removeClass('with-details');
        } else {
            $('body').removeClass('with-panel');
        }
        setTimeout(function() { viewer.resize(); }, 250);
    });

  
    // Dashboard
    $('#collapse-all-kpis').click(function() {
        $('.kpi').each(function() {
            if(!$(this).hasClass('collapsed')) $(this).click();
        });
    });
    $('#expand-all-kpis').click(function() {
        $('.kpi').each(function() {
            if($(this).hasClass('collapsed')) $(this).click();
        });
    });
    $('#dashboard-reset').click(function() {
        $('.kpi-value.selected').removeClass('selected');
        applyFilters();
    });


    // BOM Tree Actions
    $('#go-there').click(function() {
        let link = $('tr.selected').attr('data-link').split('/');
        // console.log(elemSelected.attr('data-link'));
        // console.log(document.location.href);
        // 
        // http://localhost:8080/explorer?wsId=79&dmsId=11143
        let url = document.location.href.split('?')[0];
            url += '?';
            url += 'wsId=' + link[4];
            url += '&dmsId=' + link[6];

        document.location.href = url;
        //$('tr.selected').click();
        //resetViewerSelection(true);
    });
    $('#bom-reset').click(function() {
        $('tr.selected').click();
        resetViewerSelection(true);
    });
    $('#bom-search-input').keyup(function() {
        filterBOMTree();
    });


    // Item Details Actions
    $('#bookmark').click(function() {
        toggleBookmark($(this), $('#details').attr('data-link').split('/')[6]);
    });
    $('#open').click(function() {
        openItemByLink($('#details').attr('data-link'));
    });
    $('#save').click(function() {
        saveChanges();
    });

}


// Get Context Item Deetails
function getDetails() {
    
    $.get('/plm/details', { 'wsId' : wsId, 'dmsId' : dmsId }, function(response) {
        
        $('#header-subtitle').html(response.data.title);
        getBookmarkStatus($('#bookmark'), response.data.urn);
        $('#details').attr('data-urn', response.data.urn);

    });
    
}
function getFieldValue(sections, fieldId, defaultValue) {

    for(section of sections) {
        for(field of section.fields) {
            let id = field.urn.split('.')[9];
            if(id === fieldId) {
                return field.value;
            }

        }
    }

    return defaultValue;

}


// Get viewable and init Forge viewer
function setViewer() {

    $.get('/plm/get-viewables', { 'wsId' : wsId, 'dmsId' : dmsId }, function(response) {

        if(response.data.length > 0) {

            let found = false;

            for(viewable of response.data) {
                if(viewable.name.indexOf('.iam.dwf') > -1) {
                    initViewer(viewable, 255);
                    found = true;
                    break;
                }
            }

            if(!found) initViewer(response.data[0], 255);

        } else {
            $("#viewer").hide();
        }
    });

}
function onSelectionChanged(event) {

    let found = false;

    if(viewer.getSelection().length === 0) {

        return;

    } else {

        viewer.getProperties(event.dbIdArray[0], function(data) {

            for(property of data.properties) {

                if(partNumberProperties.indexOf(property.displayName) > -1) {

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
                                        // if(!$(this).hasClass('selected')) {

                                        // }
                                        
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
    viewerDone = true;
    viewerAddMarkupControls();   
    viewerAddGhostingToggle();
    viewerAddViewsToolbar();
}


// Retrieve Workspace Details, BOM and details
function getWSConfig() {

    let promises = [
        $.get('/plm/bom-views-and-fields', { 'wsId' : wsId }),
        $.get('/plm/sections', { 'wsId' : wsId }),
        $.get('/plm/fields', { 'wsId' : wsId }),
    ];

    Promise.all(promises).then(function(responses) {

        for(view of responses[0].data) {
            if(view.name === 'Explorer') {
                viewId = view.id;
            }
        }

        sections  = responses[1].data;
        fields    = responses[2].data;

        getBOMData(viewId);
        setItemDetails('/api/v3/workspaces/' + wsId + '/items/' + dmsId);

    });

}
function getBOMData(viewId) {

    
    let params = {
        'wsId'          : wsId,
        'dmsId'         : dmsId,
        'depth'         : 10,
        // 'revisionBias'  : 'allChangeOrder',
        // 'revisionBias'  : 'changeOrder',
        // 'revisionBias'  : 'release',
        'revisionBias'  : 'working',
        'viewId'        : viewId
    }

    let promises = [
        $.get('/plm/bom-view-fields', params),
        $.get('/plm/bom', params),
        $.get('/plm/bom-flat', params)
    ];

    Promise.all(promises).then(function(responses) {

        // Drop KPIs not contained in BOM View
        for(var i = kpis.length - 1; i >= 0; i--) {

            let keep = false;

            for(field of responses[0].data) {
                if(field.fieldId === kpis[i].fieldId) {
                    keep = true;
                    break;
                }
            }

            if(!keep) kpis.splice(i, 1);

        }

        $('#dashboard-process').hide();
        $('#bom-process').hide();
        setFlatBOMHeader();
        setBOMData(responses[0].data, responses[1].data, responses[2].data);

    });

}
function setFlatBOMHeader() {

    let elemFlatBOMTHead = $('<thead></thead>');
        elemFlatBOMTHead.appendTo($('#bom-table-flat'));

    let elemFlatBOMHead = $('<tr></tr>');
        elemFlatBOMHead.appendTo(elemFlatBOMTHead);

    let elemFlatBOMHeadNumber = $('<th></th>');
        elemFlatBOMHeadNumber.html('Nr');
        elemFlatBOMHeadNumber.addClass('sticky');
        elemFlatBOMHeadNumber.appendTo(elemFlatBOMHead);

    let elemFlatBOMHeadItem = $('<th></th>');
        elemFlatBOMHeadItem.html('Item');
        elemFlatBOMHeadItem.addClass('sticky');
        elemFlatBOMHeadItem.appendTo(elemFlatBOMHead);

    let elemFlatBOMHeadQty = $('<th></th>');
        elemFlatBOMHeadQty.html('Qty');
        elemFlatBOMHeadQty.appendTo(elemFlatBOMHead); 

    for(kpi of kpis) {
        let elemFlatBOMHeadCell = $('<th></th>');
            elemFlatBOMHeadCell.html(kpi.title);
            elemFlatBOMHeadCell.appendTo(elemFlatBOMHead);       
    }
   
    let elemFlatBOMTBody = $('<tbody></tbody>');
        elemFlatBOMTBody.attr('id', 'bom-table-flat-tbody');
        elemFlatBOMTBody.appendTo($('#bom-table-flat'));

}
function setBOMData(fields, bom, flatBom) {

    let elemRoot = $('#bom-table-tree');
        elemRoot.html('');

    for(field of fields) {
        if(field.fieldId === 'NUMBER') urns.partNumber = field.__self__.urn;
        else {
            for(kpi of kpis) {
                if(field.fieldId === kpi.fieldId) {
                    kpi.urn = field.__self__.urn;
                    break;
                }
            }
        }
    }

    // insertNextBOMLevel(bom, elemRoot, 'urn:adsk.plm:tenant.workspace.item:' + tenant.toUpperCase() + '.' + wsId + '.' + dmsId, flatBom);
    insertNextBOMLevel(bom, elemRoot, bom.root, flatBom);
    insertFlatBOM(flatBom);

    // console.log(kpis);

    for(kpi of kpis) insertKPI(kpi);

    $('#items-process').hide();


    $('.bom-tree-nav').click(function(e) {

        e.stopPropagation();
        e.preventDefault();

        let elemItem  = $(this).closest('tr');
        let level     = Number(elemItem.attr('data-level'));
        let levelNext = level - 1;
        let levelHide = 10000;
        let elemNext  = $(this).closest('tr');
        let doExpand  = $(this).hasClass('collapsed');

        $(this).toggleClass('collapsed');
        
        do {

            elemNext  = elemNext.next();
            levelNext = Number(elemNext.attr('data-level'));

            if(levelNext > level) {

                if(doExpand) {

                    if(levelHide > levelNext) {

                        elemNext.show();

                        let elemToggle = elemNext.children().first().find('.bom-tree-nav');

                        if(elemToggle.length > 0) {
                            if(elemToggle.hasClass('collapsed')) {
                                levelHide = levelNext + 1;
                            }
                        }

                    }

                } else {
                    elemNext.hide();
                }

            }
        } while(levelNext > level);

    });

    $('tr').click(function() {

        selectBOMItem($(this));
        
    });

}
function insertNextBOMLevel(bom, elemRoot, parent, flatBom) {

    let result = false;

    for(edge of bom.edges) {

        if(edge.parent === parent) {

            result = true;

            let partNumber  =  getBOMCellValue(edge.child, urns.partNumber , bom.nodes);
            let link        =  getBOMNodeLink(edge.child, bom.nodes);
            let newBOMItem  = { 'urn' : edge.child, 'part-number' : partNumber };
            let newItem     = true;

            let elemRow = $('<tr></tr>');
                elemRow.attr('data-number', edge.itemNumber);
                elemRow.attr('data-part-number', partNumber);
                elemRow.attr('data-qty', '1');
                elemRow.appendTo(elemRoot);
    
            for(kpi of kpis) {

                let kpiValue = getBOMCellValue(edge.child, kpi.urn, bom.nodes, 'title');

                if(kpi.type === 'non-empty') {
                    kpiValue = (kpiValue === '' ) ? 'No' : 'Yes';
                } else if(kpi.type === 'days') {
                    if(kpiValue === '') kpiValue = '-'
                    else {
                        let day  = kpiValue.split(' ')[0].split('-');
                        let date = new Date(day[0], day[1], day[2]);
                        var diff = now.getTime() - date.getTime();
                        kpiValue = diff / (1000 * 3600 * 24);
                        kpiValue = Math.round(kpiValue, 0);
                        kpiValue = kpiValue + ' days ago';
                    }
                } else if(kpi.type === 'value') {
                    kpiValue = (kpiValue === '' ) ? '-' : kpiValue;
                }

                newBOMItem[kpi.id] = kpiValue;
                parseKPI(kpi, kpiValue);
    
            }

            for(bomItem of bomItems) {

                if(bomItem.urn === edge.child) { newItem = false; break; }
            }

            if(newItem) bomItems.push(newBOMItem);

            for(node of bom.nodes) {
                if(node.item.urn === edge.child) {
                    elemRow.attr('data-dmsId',      node.item.link.split('/')[6]);
                    elemRow.attr('data-link',       node.item.link);
                    elemRow.attr('data-urn',       edge.child);
                    elemRow.attr('data-edgeId',     edge.edgeId);
                    elemRow.attr('data-edgeLink',   edge.edgeLink);
                    elemRow.attr('data-level',      edge.depth);
                    elemRow.addClass('bom-level-' + edge.depth);
                }
            }

            // for(key of keysMaster) {
            //     let elemCell = $('<td></td>');
            //         elemCell.appendTo(elemRow);
            //         elemCell.html(getBOMCellValue(edge.child, key, bom.nodes));
            // }


            let elemCell = $('<td></td>');
                elemCell.appendTo(elemRow);

            let elemCellNumber = $('<span></span>');
                elemCellNumber.addClass('bom-tree-number');
                elemCellNumber.html(edge.depth + '.' + edge.itemNumber);
                elemCellNumber.appendTo(elemCell);

            let elemCellTitle = $('<span></span>');
                elemCellTitle.addClass('bom-tree-title');
                elemCellTitle.html(getBOMItem(edge.child, bom.nodes));
                elemCellTitle.appendTo(elemCell);

            let hasChildren = insertNextBOMLevel(bom, elemRoot, edge.child, flatBom);

            elemRow.children().first().each(function() {
                
                $(this).addClass('bom-first-col');

                if(hasChildren) {

                    let elemNav = $('<span></span>');
                        elemNav.addClass('bom-tree-nav');
                        elemNav.addClass('material-symbols-sharp');
                        elemNav.addClass('expanded');
                        elemNav.prependTo($(this));

                    elemRow.addClass('node');

                }

                let elemColor = $('<span></span>');
                    elemColor.addClass('bom-tree-color');
                    elemColor.prependTo($(this));

            });

        }

    }

    return result;

}
function getBOMItem(id, nodes) {

    for(node of nodes) {
        if(node.item.urn === id) {
            return node.item.title;
        }
    }

    return '';
    
}
function getBOMNodeLink(id, nodes) {
    for(node of nodes) {
        if(node.item.urn === id) {
            return node.item.link;
        }
    }
    return '';
}
function filterBOMTree() {

    $('tr.result').removeClass('result');

    let filterValue = $('#bom-search-input').val().toLowerCase();

    if(filterValue === '') {

        $('#bom-table-tree').children().each(function() {
            $(this).show();
        });
        $('.flat-bom-item').each(function() {
            $(this).parent().show();
        });

    } else {

        $('i.collapsed').removeClass('collapsed').addClass('expanded');
        
        $('#bom-table-tree').children().each(function() {
            $(this).hide();
        });
        $('.flat-bom-item').each(function() {
            $(this).parent().hide();
        });

        $('#bom-table-tree').children().each(function() {

            let cellValue = $(this).children().first().html().toLowerCase();

            if(cellValue.indexOf(filterValue) > -1) {
             
                $(this).show();
                $(this).addClass('result');
             
                let level = Number($(this).attr('data-level'));
                unhideParents(level - 1, $(this));

            }

        });

        $('.flat-bom-item').each(function() {

            let elemRow   = $(this).parent();
            let cellValue = $(this).html().toLowerCase();

            console.log(cellValue);

            if(cellValue.indexOf(filterValue) > -1) {
                elemRow.show();
            }

        });

    }

}
function unhideParents(level, elem) {

    elem.prevAll().each(function() {

        let prevLevel = Number($(this).attr('data-level'));

        if(level === prevLevel) {
            level--;
            $(this).show();
        }

    });

}
function selectBOMItem(elemClicked) {

    if(elemClicked.hasClass('selected')) {
        $('.bom-action').hide();
        elemClicked.removeClass('selected');
        resetViewerSelection(true);
        setAttachments('/api/v3/workspaces/' + wsId + '/items/' + dmsId);
        setProcesses('/api/v3/workspaces/' + wsId + '/items/' + dmsId);
    } else {
        viewerResetColors();
        $('.bom-action').show();
        $('#go-there').show();
        $('tr.selected').removeClass('selected');
        elemClicked.addClass('selected');
        setItemDetails(elemClicked.attr('data-link'));
        setAttachments(elemClicked.attr('data-link'));
        setProcesses(elemClicked.attr('data-link'));
        getBookmarkStatus($('#bookmark'), elemClicked.attr('data-urn'));
        viewerSelectModel(elemClicked.attr('data-part-number'), true);;
    }

}
function insertFlatBOM(flatBom) {

    let elemParent = $('#bom-table-flat-tbody');
    let count      = 1;

    for(item of flatBom) {

        let link        = item.item.link.toString();
        let qty         = Number(item.totalQuantity).toFixed(2);
        let partNumber  = getFlatBOMCellValue(flatBom, link, urns.partNumber, 'title');

        let elemRow = $('<tr></tr>');
            elemRow.attr('data-link', item.item.link);
            elemRow.attr('data-urn', item.item.urn);
            elemRow.attr('data-part-number', partNumber);
            elemRow.addClass('flat-bom-row');
            elemRow.appendTo(elemParent);

        let elemRowNumber = $('<td></td>');
            elemRowNumber.html(count++);
            elemRowNumber.addClass('flat-bom-number');
            elemRowNumber.appendTo(elemRow);

        let elemRowItem = $('<td></td>');
            elemRowItem.html(item.item.title)
            elemRowItem.addClass('flat-bom-item');
            elemRowItem.appendTo(elemRow);

        let elemRowQty = $('<td></td>');
            elemRowQty.html(qty);
            elemRowQty.addClass('flat-bom-qty');
            elemRowQty.appendTo(elemRow);

        for(kpi of kpis) {

            let value = getFlatBOMCellValue(flatBom, link, kpi.urn, 'title');

            let elemRowCell = $('<td></td>');
                elemRowCell.html(value);
                elemRowCell.appendTo(elemRow);      
                
        }

    }

}
function parseKPI(kpi, value) {

    let isNew = true;

    for(entry of kpi.data) {
        if(entry.value === value) {
            entry.count++;
            isNew = false;
            break;
        }
    }

    if(isNew) kpi.data.push({ 
        'value'     : value, 
        'count'     : 1, 
        'color'     : colorRange[kpi.data.length % colorRange.length], 
        'vector'    : vectorRange[kpi.data.length % kpiVectors.length] 
    });

}
function insertKPI(kpi) {

    let elemDashboard = $('#dashboard-panel');
    
    let elemKPI = $('<div></div>');
        elemKPI.attr('data-kpi-id', kpi.id);
        elemKPI.addClass('kpi');
        elemKPI.appendTo(elemDashboard);
        elemKPI.click(function() {
            $(this).toggleClass('collapsed');
            $(this).find('.kpi-values').toggle();
        });

    let elemKPISelect = $('<div></div>');
        elemKPISelect.addClass('kpi-selector');
        elemKPISelect.appendTo(elemKPI);
        elemKPISelect.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            selectKPI($(this).parent());
        });

    let elemKPIHeader = $('<div></div>');
        elemKPIHeader.addClass('kpi-header');
        elemKPIHeader.html(kpi.title);
        elemKPIHeader.appendTo(elemKPI);

    let elemKPIValues = $('<div></div>');
        elemKPIValues.addClass('kpi-values');
        elemKPIValues.addClass(kpi.style);
        elemKPIValues.appendTo(elemKPI);

    if(kpi.style === 'bars') {

        let sort = (typeof kpi.sort === 'undefined') ? 'count' : kpi.sort;

        sortArray(kpi.data, sort, 'number');

        let max = 1; 

        for(entry of kpi.data) {
            if(entry.count > max) max = entry.count;
        }

        kpi.max = max;

    }

    for(entry of kpi.data) {

        let color =  entry.color;
        let label = (entry.value === '') ? '-' : entry.value;



        let elemKPIValue = $('<div></div>');
            elemKPIValue.attr('data-filter', entry.value);
            elemKPIValue.addClass('kpi-value');
            elemKPIValue.appendTo(elemKPIValues);
            elemKPIValue.click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                selectKPIValue(e, $(this));
            });
    
        let elemKPILabel = $('<div></div>');
            elemKPILabel.addClass('kpi-label');
            elemKPILabel.html(label);
            elemKPILabel.appendTo(elemKPIValue);

        let elemKPICounter = $('<div></div>');
            elemKPICounter.addClass('kpi-counter');
            elemKPICounter.html(entry.count);
            elemKPICounter.appendTo(elemKPIValue);

        if(kpi.style === 'bars') {
            let width = entry.count * 100 / kpi.max;
            elemKPIValue.css('background', 'linear-gradient(90deg, ' + color + ' 0 ' + width + '%, white ' + width + '% 100%)');
        } else {
            elemKPILabel.css('border-color', entry.color);
        }

    }

}


// KPI Handling
function selectKPI(elemClicked) {

    viewerResetColors();

    let id          = elemClicked.attr('data-kpi-id');
    let isSelected  = elemClicked.hasClass('selected');
    let kpiData     = null;

    $('.kpi').removeClass('selected');
    // $('.kpi-value').removeClass('selected');
    $('#bom-tree').addClass('no-colors');
    $('#flat-bom').addClass('no-colors');
    $('.flat-bom-number').each(function() { $(this).css('background', '') });

    if(isSelected) return; 
        
    for(kpi of kpis) {
        if(kpi.id === id) {
            kpiData = kpi.data;
            break;
        }
    }

    if(kpiData === null) return;

    $('#bom-tree').removeClass('no-colors');
    $('#flat-bom').removeClass('no-colors');
    elemClicked.addClass('selected');

    elemClicked.find('.kpi-value').each(function() {
    
        let filter      = $(this).attr('data-filter');
        let color       = '';
        let vector      = null;
        let partNumbers = [];

        for(entry of kpiData) {
            if(entry.value === filter) {
                color  = entry.color;
                vector = entry.vector;
                break;
            }
        }
    
        $('#bom-table-tree').children().each(function() {
            
            let value   = null;
            let urn     = $(this).attr('data-urn');

            for (bomItem of bomItems) {
                if(bomItem.urn === urn) {
                    value = bomItem[id];
                }
            }

            if(value === filter) {
                partNumbers.push($(this).attr('data-part-number'));
                $(this).find('.bom-tree-color').css('background', color);
            }

        });

        $('#bom-table-flat').find('tr').each(function() {

            let value   = null;
            let urn     = $(this).attr('data-urn');

            for (bomItem of bomItems) {
                if(bomItem.urn === urn) {
                    value = bomItem[id];
                }
            }

            if(value === filter) {
                $(this).children().first().css('background', color);
            }

        });

        viewerSetColors(partNumbers, vector);

    });

}
function selectKPIValue(e, elemClicked) {

    let isSelected = elemClicked.hasClass('selected');
    
    if(!e.shiftKey) $('.kpi-value').removeClass('selected');

    if(isSelected) elemClicked.removeClass('selected');
    else           elemClicked.addClass('selected');
    
    // $('.kpi').removeClass('selected');

    applyFilters();

}
function applyFilters() {

    let partNumbers = [];
    let filters     = [];
    let counter     = 0;

    $('.kpi-value.selected').each(function() {

        let id      = $(this).closest('.kpi').attr('data-kpi-id');
        let value   = $(this).attr('data-filter');
        let isNew   = true;

        for(filter of filters) {
            if(filter.id === id) {
                filter.values.push(value);
                isNew = false;
            }
        }

        if(isNew) filters.push({
            'id' : id,
            'values' : [value]
        });

    });

    resetViewerSelection(true);
    
    $('#bom-table-tree').children().each(function() {

        let isVisible   = true;
        let urn         = $(this).attr('data-urn');

        for(bomItem of bomItems) {
            if(bomItem.urn === urn) {
                for(filter of filters) {
                    let value = bomItem[filter.id];
                    if(filter.values.indexOf(value) < 0) isVisible = false;
                }
                break;
            }
        }

        if(isVisible) {
            $(this).show().removeClass('hidden');
            counter++;
            partNumbers.push($(this).attr('data-part-number'));
        } else $(this).hide().addClass('hidden');;

    });


    $('.flat-bom-row').each(function() {

        let isVisible   = true;
        let urn         = $(this).attr('data-urn');

        for(bomItem of bomItems) {
            if(bomItem.urn === urn) {
                for(filter of filters) {
                    let value = bomItem[filter.id];
                    if(filter.values.indexOf(value) < 0) isVisible = false;
                }
                break;
            }
        }

        if(isVisible) $(this).show().removeClass('hidden');
        else          $(this).hide().addClass('hidden');

    });

    if($('.kpi-value.selected').length > 0) {
        $('#dashboard').removeClass('no-toolbar');
        $('#dashboard-counter').html(counter + ' matches');
        if(counter === 1) $('#dashboard-counter').html('1 match');
    } else {
        $('#dashboard').addClass('no-toolbar');
    }

    console.log(filters.length);

    if(filters.length === 0) viewerResetColors();
    else viewerSelectModels(partNumbers);

}


// Retrieve required details of workspace Spare Parts Requests
function getRequestWSConfig() {

    $.get('/plm/get-workspace-id', { 'name' : 'Spare Parts Requests' }, function(response) {
        wsIdRequests = response.data;
        $.get('/plm/sections', { 'wsId' : wsIdRequests }, function(response) {
            if(response.data.length > 0) {
                sectionIdRequests = response.data[0].urn.split('.')[5];
            }
        });
    });

}



function setItemDetails(link) {

    $('#details').attr('data-link', link);
    $('#details-process').show();

    let elemParent = $('#sections');
        elemParent.html('');

    $.get('/plm/details', { 'link' : link }, function(response) {
        insertItemDetails(elemParent, sections, fields, response.data, true, false, false);
        $('#details-process').hide();
    });

}



// Display selected item's attachments
function setAttachments(link) {

    $('#attachments-process').show();

    let elemParent = $('#attachments-list');
        elemParent.html('');

    $.get('/plm/attachments', { 'link' : link }, function(response) {
        insertAttachments(elemParent, response.data, true);
        $('#attachments-process').hide();
    });

}

// Save Item Details Changes
function saveChanges() {
    $('#overlay').show();
    submitEdit($('#details').attr('data-link'), $('#sections'), function(response) {
        $('#overlay').hide();
    });
}


// Display selected item's Change Processes
function setProcesses(link) {

    $('#processes-process').show();

    let elemParent = $('#processes-list');
        elemParent.attr('data-source', link);
        elemParent.html('');

    $.get('/plm/changes', { 'link' : link }, function(response) {
        
        if(response.params.link === $('#processes-list').attr('data-source')) {

            insertChangeProcesses($('#processes-list'), response.data);
            $('#processes-process').hide();

        }

    });

}