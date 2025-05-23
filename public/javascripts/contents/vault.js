// Insert Vault File Properties Folders
function insertPDMFileProperties(link, params) {

    if(isBlank(link)) return;
    if(isBlank(params)) params = {};


    let id = isBlank(params.id) ? 'file-properties' : params.id; 

    //  Set defaults for optional parameters
    // // --------------------------------------
    // let id           = 'file-properties';    // ID of the DOM element where the elements should be inserted
    // let header       = true;                // Hide header with setting this to false
    // let headerLabel = 'Properties';         // Set the header text


    // if( isBlank(params)             )       params = {};
    // if(!isBlank(params.id)          )           id = params.id;
    // if(!isBlank(params.header)      )       header = params.header;
    // if(!isBlank(params.headerLabel) )  headerLabel = params.headerLabel;

    settings.pdmFileProperties[id] = getPanelSettings(link, params, {
        headerLabel : 'Properties',
        layout : 'normal'
    }, [
        // [ 'bookmark'           , false ],
        // [ 'collapsed'          , false ],
        // [ 'hideComputed'       , false ],
        // [ 'hideLabels'         , false ],
        // [ 'hideReadOnly'       , false ],
        // [ 'hideSections'       , false ],
        // [ 'requiredFieldsOnly' , false ],
        // [ 'suppressLinks'      , false ],
        // [ 'toggles'            , false ],
        // [ 'sectionsIn'         , [] ],
        // [ 'sectionsEx'         , [] ],
        // [ 'sectionsOrder'      , [] ],
        // [ 'fieldsIn'           , [] ],
        // [ 'fieldsEx'           , [] ]
    ]);

    settings.pdmFileProperties[id].load = function() { insertPDMFilePropertiesData(id); }



    // settings.pdmFileProperties[id]      = {};
    // settings.pdmFileProperties[id].link = link;

    genPanelTop(id, settings.pdmFileProperties[id], 'vault-file-properties');
    genPanelHeader(id, settings.pdmFileProperties[id]);
    genPanelSearchInput(id, settings.pdmFileProperties[id]);
    genPanelReloadButton(id, settings.pdmFileProperties[id]);

    genPanelContents(id, settings.pdmFileProperties[id]).addClass(settings.pdmFileProperties[id].layout);


    insertPDMFilePropertiesDone(id);

    settings.pdmFileProperties[id].load();

    // let elemTop = $('#' + id)
    //     .addClass('vault-file-properties')
    //     .addClass('panel-top')
    //     .html('');

    // if(header) {

    //     appendPanelHeader(elemTop, id, headerLabel);

    // }

    // appendPanelContent(elemTop, id, ['vault-file-properties-content']);
    // appendProcessing(id, true);

    // insertFilePropertiesDone(id);
    // insertFilePropertiesData(id);

}
function insertPDMFilePropertiesDone(id) {}
function insertPDMFilePropertiesData(id) {

    settings.pdmFileProperties[id].timestamp = startPanelContentUpdate(id);

    // let timestamp   = new Date().getTime();
    // let elemContent = $('#' + id + '-content').html('');

    // elemContent.attr('data-timestamp', timestamp);

    // $('#' + id + '-processing').show();

    $.get('/vault/file-properties', { fileId : settings.pdmFileProperties[id].link, timestamp : settings.pdmFileProperties[id].timestamp }, function(response) {

        if(response.params.timestamp === elemContent.attr('data-timestamp')) {

            $('#' + id + '-processing').hide();
        
            for(let property of response.data.properties) {
                insertFileProperty(elemContent, property.definition.displayName, property.value);
            }

            insertFilePropertiesDataDone(id, response);

        }

    });

}
function insertFileProperty(elemContent, label, value) {

    let elemField = $('<div></div>').appendTo(elemContent).addClass('field');

    $('<div></div>').appendTo(elemField).addClass('field-label').html(label);
    $('<div></div>').appendTo(elemField).addClass('field-value').html(value);

}
function insertFilePropertiesDataDone(id, response) {}



// Render search results tiles
function genPDMTile(record, params) {

    let elemTile = null;

    if(isBlank(params)) params = {};

    params.number         = (isBlank(params.number       ))  ? ''    : params.number;
    params.tileNumber     = (isBlank(params.tileNumber   ))  ? ''    : params.tileNumber;
    params.displayEntity  = (isBlank(params.displayEntity))  ? false : params.displayEntity;
    params.addTileActions = (isBlank(params.addTileActions)) ? false : params.addTileActions;

    switch(record.entityType) {

        case 'Folder':
            elemTile = genPDMTileFolder(record, params);
            elemTile.addClass('vault-folder')
                .attr('data-id', record.id)
                .attr('data-name', record.name)
                .attr('data-path', record.fullName)
                .attr('data-type', 'vault-folder');
            elemTile.find('.icon-folder').addClass('filled');
            break;

        case 'FileVersion':
            elemTile = genPDMTileFileVersion(record, params);
            elemTile.addClass('vault-file').addClass('component')
                .attr('data-id', record.id)
                .attr('data-name', record.name)
                .attr('data-folder', record.parentFolderId)
                .attr('data-type', 'vault-file');
            break;

        case 'ItemVersion':
            elemTile = genPDMTileItemVersion(record, params);
            elemTile.addClass('vault-item').addClass('component')
                .attr('data-id', record.id)
                .attr('data-name', record.name)
                .attr('data-type', 'vault-item');
            break;

        case 'ChangeOrder':
            elemTile = genPDMTileChangeOrder(record, params);
            elemTile.addClass('vault-eco')
                .attr('data-id', record.id)
                .attr('data-name', record.name)
                .attr('data-type', 'vault-eco');
                
            break;

        default:
            console.log('Entity type of record ' + record.name + ' not supported : ' + record.entityType);
            break;

    }

    if(elemTile !== null) {
        if(params.displayEntity) insertEntityTypeIcon(elemTile);
        if(params.addTileActions) genAddinTileActions(elemTile);
    }

    return elemTile;

}
function genPDMTileFolder(folder, params) {

    params.link     = folder.url;
    params.title    = folder.name;
    params.subtitle = folder.fullName;
    params.tileIcon = 'icon-folder';

    return genSingleTile(params);

}
function genPDMTileFileVersion(file, params) {

    let modification = new Date(file.lastModifiedDate);

    // let subtitle = '<span class="vault-tile-status"><span class="icon icon-status"></span>'
    let subtitle = '<span class="vault-tile-status"'
                 + '<span>' + file.state + '</span></span>'
                 + '<span class="vault-tile-user"><span class="icon icon-user filled"></span>'
                 + '<span>' + file.createUserName + '</span></span>'
                 + '<span class="vault-tile-date"><span>' + modification.toLocaleDateString() + '</span>'
                 + '<span class="icon icon-calendar"></span></span>';

    params.link         = file.url;
    params.title        = file.name + ' [' + file.revision + ']',
    params.subtitle     = subtitle
    params.tileIcon     = 'icon-file';   
    params.imageFile    = file.file.id + '-' + file.version;
    params.details      = 'data';

    return genSingleTile(params);

}
function genPDMTileItemVersion(item, params) {

    let modification = new Date(item.lastModifiedDate);

    // let subtitle = '<span class="vault-tile-status"><span class="icon icon-status"></span>'
    let subtitle = '<span class="vault-tile-status">'
                 + '<span>' + item.state + '</span></span>'
                 + '<span class="vault-tile-user"><span class="icon icon-user filled"></span>'
                 + '<span>' + item.lastModifiedUserName + '</span></span>'
                 + '<span class="vault-tile-date"><span>' + modification.toLocaleDateString() + '</span>'
                 + '<span class="icon icon-calendar"></span></span>';

    let tileParams = {
        image       : item.url,
        number      : params.number,
        tileNumber  : params.tileNumber,
        tileIcon    : 'icon-item',
        title       : item.number + ' ' + item.title + ' [' + item.revision + ']',
        subtitle    : subtitle,
        imageFile   : item.item.id + '-' + item.version,
        details     : 'data'
    }

    return  genSingleTile(tileParams);

}
function genPDMTileChangeOrder(eco, params) {

    params.title    = eco.number + ' ' + eco.title;
    params.subtitle = eco.description;
    params.tileIcon = 'icon-status';
    params.details  = 'data';

    return genSingleTile(params);

}
function insertEntityTypeIcon(elemTile) {

    let elemTitle   = elemTile.find('.tile-title');
    let elemEntity  = $('<div></div>').prependTo(elemTitle).addClass('tile-entity');
    let elemIcon    = $('<span></span>').appendTo(elemEntity).addClass('icon');
    let elemLabel   = $('<span></span>').appendTo(elemEntity);

    if(elemTile.hasClass('vault-folder')) { 
        elemIcon.addClass('icon-folder').addClass('filled'); 
        elemLabel.html('Folder'); 
    } else if(elemTile.hasClass('vault-file')) { 
        elemIcon.addClass('icon-product'); 
        elemLabel.html('File'); 
    } else if(elemTile.hasClass('vault-item')) { 
        elemIcon.addClass('icon-item'); 
        elemLabel.html('Item'); 
    } else if(elemTile.hasClass('vault-eco')) { 
        elemIcon.addClass('icon-status'); 
        elemLabel.html('Item'); 
    }

}



// Insert Vault File Bill of Materials
function insertFileBOM(link, params) {


    //  Set defaults for optional parameters
    // --------------------------------------
    let id                  = 'file-bom';   // ID of the DOM element where the elements should be inserted
    let header              = true;         // Hide header with setting this to false
    let headerLabel         = 'Uses';       // Set the header text
    let expandLimit         = 100;
    let expandRecurse       = true;
    let expandFull          = false;
    let toggles             = true;      // Enables expand all / collapse all buttons on top of BOM
    let collapsed           = false;     // When enabled, the BOM will be collapsed at startup
    let search              = true;      // Adds quick filtering using search input on top of BOM
    let searchPlacholder    = 'Search';
    let position            = true;      // When set to true, the position / find number will be displayed
    let quantity            = false;     // When set to true, the quantity column will be displayed
    let hideDetails         = true;      // When set to true, detail columns will be skipped, only the descriptor will be shown
    let headers             = true;      // When set to false, the table headers will not be shown
    let path                = true;      // Display path of selected component in BOM, enabling quick navigation to parent(s)
    let counters            = true;      // When set to true, a footer will inidicate total items, selected items and filtered items
    let selectItems         = {};
    let columns             = ['Number', 'Version', 'Category Name', 'Lifecycle Definition'];


    if( isBlank(params)                 )           params = {};
    if(!isBlank(params.id)              )               id = params.id;
    if(!isBlank(params.header)          )           header = params.header;
    if(!isBlank(params.headerLabel)     )      headerLabel = params.headerLabel;
    if(!isBlank(params.expandLimit)     )      expandLimit = params.expandLimit;
    if(!isBlank(params.expandRecurse)   )    expandRecurse = params.expandRecurse;
    if(!isBlank(params.expandFull)      )       expandFull = params.expandFull;
    if(!isBlank(params.toggles)         )          toggles = params.toggles;
    if(!isBlank(params.collapsed)       )        collapsed = params.collapsed;
    if(!isBlank(params.search)          )           search = params.search;
    if(!isBlank(params.searchPlacholder)) searchPlacholder = params.searchPlacholder;
    if(!isBlank(params.position)        )         position = params.position;
    if(!isBlank(params.quantity)        )         quantity = params.quantity;
    if(!isBlank(params.hideDetails)     )      hideDetails = params.hideDetails 
    if(!isBlank(params.headers)         )        { headers = params.headers } else { headers = !hideDetails; }
    if(!isBlank(params.path)            )             path = params.path;
    if(!isBlank(params.counters)        )         counters = params.counters;
    if(!isBlank(params.selectItems)     )      selectItems = params.selectItems;
    if(!isBlank(params.columns)         )          columns = params.columns;

    if(search) headers = true;

    settings.pdmFileBOM[id]                 = {};
    settings.pdmFileBOM[id].link            = link;
    settings.pdmFileBOM[id].expandLimit     = expandLimit;
    settings.pdmFileBOM[id].expandRecurse   = expandRecurse;
    settings.pdmFileBOM[id].expandFull      = expandFull;
    settings.pdmFileBOM[id].collapsed       = collapsed;
    settings.pdmFileBOM[id].position        = position;
    settings.pdmFileBOM[id].quantity        = quantity;
    settings.pdmFileBOM[id].hideDetails     = hideDetails;
    settings.pdmFileBOM[id].selectItems     = selectItems;
    settings.pdmFileBOM[id].columns         = columns;
    settings.pdmFileBOM[id].properties      = [];


    let elemTop = $('#' + id)
        .addClass('vault-file-bom')
        .addClass('panel-top')
        .html('');

    if(header) appendPanelHeader(elemTop, id, headerLabel);
    if(toggles) appendPanelHeaderTreeToggles(id);

    if(search) {
        appendPanelHeaderSearch(id, searchPlacholder, ['bom-search-input'], function() {
            clickBOMCollapseAll($(this));
        });
    }


    let elemContent = appendPanelContent(elemTop, id, ['vault-file-bom-content']);

    let elemBOMTable = $('<table></table').appendTo(elemContent)
        .addClass('bom-table')
        .addClass('fixed-header')
        .attr('id', id + '-table');

    let elemBOMTableHead = $('<thead></thead>').appendTo(elemBOMTable)
        .addClass('bom-thead')
        .attr('id', id + '-thead');

    if(!headers) elemBOMTableHead.hide();

    $('<tbody></tbody>').appendTo(elemBOMTable)
        .attr('id', id + '-tbody')
        .addClass('bom-tbody');

    if(path) {
        $('<div></div>').appendTo(elemTop)
            .attr('id', id + '-bom-path')
            .addClass('bom-path-empty')
            .addClass('bom-path')
            .hide();

        elemTop.addClass('with-bom-path');
    }

    let elemBOMCounters = $('<div></div>').appendTo(elemTop)
        .attr('id', id + '-bom-counters')
        .addClass('bom-counters')
        .hide();

    if(counters) {

        $('<div></div>').appendTo(elemBOMCounters)
            .attr('id', id + '-bom-counter-total')
            .addClass('bom-counter-total');
        
        $('<div></div>').appendTo(elemBOMCounters)
            .attr('id', id + '-bom-counter-unique')
            .addClass('bom-counter-unique');
        
        $('<div></div>').appendTo(elemBOMCounters)
            .attr('id', id + '-bom-counter-filtered')
            .addClass('bom-counter-filtered');
        
        $('<div></div>').appendTo(elemBOMCounters)
            .attr('id', id + '-bom-counter-selected')
            .addClass('bom-counter-selected');      

    } else elemTop.addClass('no-bom-counters');

    appendProcessing(id, true);

    insertFileBOMDone(id);
    insertFileBOMData(id);

}
function insertFileBOMDone(id) {}
function insertFileBOMData(id) {

    let elemTop             = $('#' + id);
    let elemBOMTableBody    = $('#' + id + '-tbody');
    let selectedItems       = [];

    $('#' + id + '-processing').show();

    let params = { 
        link        : settings.pdmFileBOM[id].link ,
        limit       : settings.pdmFileBOM[id].expandLimit,
        recurse     : settings.pdmFileBOM[id].expandRecurse,
        fullModels  : settings.pdmFileBOM[id].expandFull
    }

    let requests = [ $.get('/vault/file-bom', params)]

    if(settings.pdmFileBOM[id].expandFull) requests.push($.get('/vault/property-definitions', {  }));

    Promise.all(requests).then(function(responses) {

        $('#' + id + '-processing').hide();
    
        for(let file of responses[0].data.results) file.sort = file.childFile.name;

        sortArray(responses[0].data.results, 'sort', 'String', 'ascending');

        if(settings.pdmFileBOM[id].expandFull) {

            for(let file of responses[0].data.results) {
                for(let property of file.childFile.properties) {
                    for(let definition of responses[1].data.results) {
                        if(definition.id === property.propertyDefinitionId) {

                            property.displayName = definition.displayName;
                            property.dataType    = definition.dataType;
                            break;

                        }
                    }
                }
            }

            for(let column of settings.pdmFileBOM[id].columns) {
                for(let definition of responses[1].data.results) {
                    if(column === definition.displayName) {
                        settings.pdmFileBOM[id].properties.push(definition);
                    }
                }
            }

        }

        setFileBOMHeaders(id);
        insertNextFileBOMLevel(id, elemBOMTableBody, responses[0].data.results, settings.pdmFileBOM[id].link.split('/').pop(), 1, 1, selectedItems);
        enableBOMToggles(id);
        updateBOMCounters(id);

        if(settings.pdmFileBOM[id].collapsed) clickBOMCollapseAll($('#' + id + '-toolbar'));

        if(!elemTop.hasClass('no-bom-counters')) { $('#' + id + '-bom-counters').show(); }
        insertFileBOMDataDone(id, responses[0], selectedItems);

    });

}
function insertFileBOMDataDone(id, response, selectedItems) {}
function setFileBOMHeaders(id) {

    let elemBOMTableHead    = $('#'+  id + '-thead').html('');
    let elemBOMTableHeadRow = $('<tr></tr>').appendTo(elemBOMTableHead).attr('id', id + '-thead-row');

    $('<th></th>').appendTo(elemBOMTableHeadRow).html('').addClass('bom-color');
    $('<th></th>').appendTo(elemBOMTableHeadRow).html('File');

    if(settings.pdmFileBOM[id].quantity) {
        $('<th></th>').appendTo(elemBOMTableHeadRow)
            .addClass('bom-quantity')
            .html('Qty');
    }

    if(!settings.pdmFileBOM[id].hideDetails) {
        for(let property of settings.pdmFileBOM[id].properties) {
            $('<th></th>').appendTo(elemBOMTableHeadRow)
                .html(property.displayName)
                .addClass('bom-column-' + property.id);
        }
    }

}
// function insertNextBOMLevel(id, elemTable, fileBOM, parent, parentQuantity, selectedItems, fields) {
function insertNextFileBOMLevel(id, elemTable, fileBOM, parentId, parentQuantity, level, selectedItems) {

    let result    = { hasChildren : false,};
    let firstLeaf = true;
    let index     = 1;

    for(let file of fileBOM) {

        if(file.parentFile.id === parentId) {

            let bomQuantity = 1;

            // for(let bomNode of bom.nodes) {
            //     if(bomNode.item.urn === edge.child) {
            //         node = bomNode;
            //         break;
            //     }
            // }

            file.totalQuantity = bomQuantity * parentQuantity;

            // if((typeof node.restricted === 'undefined') || (node.restricted === false)) {

                // node.restricted    = false;
                

                // for(let field of node.fields) {

                //     // if('context' in field) {
                //     //     node.restricted = true;
                //     // }

                //     let fieldValue = (typeof field.value === 'object') ? field.value.title : field.value;

                //     switch(field.metaData.urn) {

                //         case settings.bom[id].fieldURNPartNumber:
                //             node.partNumber = fieldValue;
                //             break;

                //         case settings.bom[id].fieldURNEndItem:
                //             node.endItem = fieldValue;
                //             break;

                //         case settings.bom[id].fieldURNSelectItems:
                //             node.selectItems = fieldValue;
                //             edge.selectItems = fieldValue;
                //             break;

                //     }

                // }

                // if(!isBlank(settings.bom[id].fieldURNSelectItems)) {
                //     for(let fieldEdge of edge.fields) {
                //         if(fieldEdge.metaData.urn === settings.bom[id].fieldURNSelectItems) {
                //             edge.selectItems = (typeof fieldEdge.value === 'object') ? fieldEdge.value.title : fieldEdge.value;
                //             node.selectItems = edge.selectItems;
                //         }
                //     }
                // }

            // } else node.totalQuantity += bomQuantity * parentQuantity;


            result.hasChildren  = true;
            let isEndItem       = false;

            let elemRow = $('<tr></tr>').appendTo(elemTable)
                .attr('data-number',      file.childFile.name)
                .attr('data-part-number', file.childFile.name)
                .attr('data-quantity',    bomQuantity)
                .attr('data-number',      file.childFile.name)
                .attr('data-link',        file.childFile.url)
                .attr('data-link-file',        file.childFile.file.url)
                .attr('data-title',       file.childFile.name)
                .attr('data-level',       level)
                .addClass('tree-level-' +  level)
                .addClass('bom-item')
                .click(function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFileBOMItemActions($(this));
                    clickFileBOMItem($(this), e);
                })
        

            let elemColor = $('<td></td>').appendTo(elemRow).addClass('bom-color');
            let elemCell  = $('<td></td>').appendTo(elemRow).addClass('bom-first-col');

            if(settings.pdmFileBOM[id].position) {

                $('<span></span>').appendTo(elemCell)
                    .addClass('bom-number')
                    .html(level + '.' + index++);

            }

            $('<span></span>').appendTo(elemCell)
                .addClass('bom-descriptor')
                .html(file.childFile.name);

            if(settings.pdmFileBOM[id].quantity) {

                $('<td></td>').appendTo(elemRow)
                    .addClass('bom-quantity')
                    .html(bomQuantity);

            }

            if(!settings.pdmFileBOM[id].hideDetails) {

                for(let property of settings.pdmFileBOM[id].properties) {

                    let value = ''

                    for(let fileProperty of file.childFile.properties) {

                        if(fileProperty.propertyDefinitionId === property.id) {
                            
                            if (typeof fileProperty.value === 'boolean') value = (fileProperty.value) ? 'Yes' : 'No'
                            else value = fileProperty.value;
                            break;
                        }

                    }

                    $('<td></td>').appendTo(elemRow)
                        .html(value)
                        .addClass('bom-column-' + property.id);

                }
            }

            if(!isBlank(settings.pdmFileBOM[id].selectItems.values)) {
                if(!isBlank(edge.selectItems)) {
                    if(settings.bom[id].selectItems.values.indexOf(edge.selectItems.toLowerCase()) > -1) {

                        let selectItem = true;

                        if(settings.bom[id].selectUnique) {
                            for(let selectedItem of selectedItems) {
                                if(selectedItem.node.item.link === node.item.link) {
                                    selectItem = false;
                                    break;
                                }
                            }
                        }

                        if(selectItem) {
                            selectedItems.push({
                                'node' : node,
                                'edge' : edge
                            })
                        }
                    }
                }
            }

            let bomItem = (isEndItem) ? { hasChildren : false } : insertNextFileBOMLevel(id, elemTable, fileBOM, file.childFile.url.split('/').pop(), bomQuantity * parentQuantity, level + 1, selectedItems);

            if(!bomItem.hasChildren) {

                elemRow.addClass('leaf');
                if(firstLeaf) elemRow.addClass('first-leaf');
                firstLeaf = false;

            } else {

                $('<span></span>').prependTo(elemCell)
                    .addClass('bom-nav')
                    .addClass('icon')

                elemRow.addClass('node');

            }
        }
    }

    return result;

}
function searchInFileBOM(id, elemInput) {

    let elemTable   = $('#' + id + '-tbody');
    let filterValue = elemInput.val().toLowerCase();
    let parents     = [];

    if(filterValue === '') {

        elemTable.children().each(function() {
            $(this).removeClass('bom-hidden').removeClass('result');
        });
        elemTable.children('.node').each(function() {
            $(this).removeClass('collapsed').removeClass('result-parent');
        });

    } else {

        elemTable.children('tr').each(function() {

            let cellValue = $(this).attr('data-title').toLowerCase();
            let matches   = (cellValue.indexOf(filterValue) > -1);
            let level     = Number($(this).attr('data-level'));
            let isNode    = $(this).hasClass('node');
            
            if(level <= parents.length) {
                parents.splice(level - 1);
            }

            if(matches) {
             
                $(this).removeClass('bom-hidden').addClass('result');

                for(let parent of parents) parent.removeClass('bom-hidden').removeClass('collapsed').addClass('result-parent');

            } else {

                $(this).addClass('bom-hidden').removeClass('result').removeClass('result-parent');

            }

            if(isNode) parents.push($(this));

        });

    }

    updateBOMCounters(id);

}
function toggleFileBOMItemActions(elemClicked) {

elemClicked.toggleClass('selected');
elemClicked.siblings().removeClass('selected');

}
function clickFileBOMItem(elemClicked, e) {}



// TODO REMOVE
function appendPanelHeader(elemTop, id, headerLabel) {

    let elemHeader = $('<div></div>').appendTo(elemTop)
        .attr('id', id + '-header')
        .addClass('panel-header');

    $('<div></div>').appendTo(elemHeader)
        .addClass('panel-title')
        .attr('id', id + '-title')
        .html(headerLabel);

    $('<div></div>').appendTo(elemHeader)
        .addClass('panel-toolbar')
        .attr('id', id + '-toolbar');

    return elemHeader;

}
function appendPanelContent(elemTop, id, classNames) {

    let elemContent = $('<div></div>').appendTo(elemTop)
        .addClass('panel-content')
        .attr('id', id + '-content');

    for(let className of classNames) elemContent.addClass(className);

    return elemContent;

}


// Insert Vault Root Folders
function insertVaultBrowser(params) {


    //  Set defaults for optional parameters
    // --------------------------------------
    let id           = 'vault-browser';    // ID of the DOM element where the viewer should be inserted
    let header       = true;                    // Hide header with setting this to false
    let headerLabels = ['Explorer','Files','Details'];              // Set the header text

    
    if( isBlank(params)             )       params = {};
    if(!isBlank(params.id)          )           id = params.id;
    if(!isBlank(params.header)      )       header = params.header;
    if(!isBlank(params.headerLabels) )  headerLabels = params.headerLabels;

    let elemRoot = $('#' + id)
        .addClass('vault-browser')
        .html('');

    let elemTopExplorer = $('<div></div>').appendTo(elemRoot)
        .attr('id', id + '-explorer')
        .addClass('vault-browser-explorer')
        .addClass('panel-top')
        .html('');

    let elemTopFiles = $('<div></div>').appendTo(elemRoot)
        .attr('id', id + '-files')
        .addClass('vault-browser-files')
        .addClass('panel-top')
        .html('');
    
    let elemTopDetails = $('<div></div>').appendTo(elemRoot)
        .attr('id', id + '-details')
        .addClass('vault-browser-details')
        .addClass('panel-top')
        .html('');

    if(header) {

        appendPanelHeader(elemTopExplorer, id + '-explorer', headerLabels[0]);
        appendPanelHeader(elemTopFiles,    id + '-files',    headerLabels[1]);
        appendPanelHeader(elemTopDetails,  id + '-details',  headerLabels[2]);

    }

    appendPanelContent(elemTopExplorer, id + '-explorer', ['vault-browser-explorer-content']);
    appendPanelContent(elemTopFiles   , id + '-files'   , ['vault-browser-files-content', 'surface-level-1', 'tiles', 'list', 'xxxs']);
    appendPanelContent(elemTopDetails , id + '-details',  ['vault-browser-details-content', 'surface-level-2']);

    appendProcessing(id + '-explorer', true);
    appendProcessing(id + '-files'   , true);
    appendProcessing(id + '-details' , true);

    let elemToolbarFiles = $('#' + id + '-files-toolbar');

    let elemActionOpenFile = $('<div></div>').appendTo(elemToolbarFiles)
        .addClass('button')
        .addClass('with-icon')
        .addClass('icon-viewer')
        .addClass('single-select-action')
        .attr('title', 'Open selected file')
        .html('Open File')
        .hide()
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            showSelectedFileSummary($(this));
        });

    insertVaultBrowserDone(id);
    insertVaultBrowserData(id + '-explorer');

}
function insertVaultBrowserDone(id) {}
function insertVaultBrowserData(id) {

    let timestamp    = new Date().getTime();
    let elemContent = $('#' + id + '-content');

    $('#' + id + '-processing').show();

    $.get('/vault/root-folders', {}, function(response) {

        let elemColumn = appendVaultBrowserColumn(elemContent);

        $('#' + id + '-processing').hide();

        for(let result of response.data.results) {

            let elemTile = genPDMTile(result);
                elemTile.appendTo(elemColumn)
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    clickVaultBrowserFolder($(this));
                });

        }

        insertVaultBrowserDataDone(id, response.data);

    });

}
function insertVaultBrowserDataDone(id, data) {}
function appendVaultBrowserColumn(elemContent) {

    let elemColumn = $('<div></div>').appendTo(elemContent)
        .addClass('surface-level-1')
        .addClass('tiles')
        .addClass('list')
        .addClass('xxxs');

        console.log(elemColumn.length);

    return elemColumn;

}
function clickVaultBrowserFolder(elemClicked) {

    elemClicked.addClass('selected');
    elemClicked.siblings().removeClass('selected');

    insertVaultBrowserSubfolders(elemClicked);
    insertVaultBrowserFiles(elemClicked);
    clickVaultBrowserFolderDone(elemClicked);

}
function clickVaultBrowserFolderDone(elemClicked) {}
function insertVaultBrowserSubfolders(elemClicked) {

    elemClicked.parent().nextAll().remove();

    let elemContent = elemClicked.closest('.panel-content');

    $.get('/vault/subfolders', { link : elemClicked.attr('data-link') }, function(response) {

        let elemColumn = appendVaultBrowserColumn(elemContent);

        for(let result of response.data.results) {

            let elemTile = genPDMTile(result);
                elemTile.appendTo(elemColumn)
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    clickVaultBrowserFolder($(this));
                });

        }


    });

}
function insertVaultBrowserFiles(elemClicked) {

    let elemBrowser = elemClicked.closest('.vault-browser')    
    let id          = elemBrowser.attr('id');
    let elemContent = $('#' + id + '-files-content').html('');
    
    $('#' + id + '-files-toolbar').children('.single-select-action').hide();
    $('#' + id + '-files-processing').show();

    $.get('/vault/folder-contents', { link : elemClicked.attr('data-link'), includeFolders : true }, function(response) {
        
        console.log(response);

        $('#' + id + '-files-processing').hide();

        for(let result of response.data.results) {


            let elemTile = genPDMTile(result);
                elemTile.appendTo(elemContent)
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    clickVaultBrowserFile($(this));
                });

        }

    });

}
function clickVaultBrowserFile(elemClicked) {

    let elemBrowser = elemClicked.closest('.vault-browser')    
    let id          = elemBrowser.attr('id');

    elemClicked.addClass('selected');
    elemClicked.siblings().removeClass('selected');

    $('#' + id + '-files-toolbar').children('.single-select-action').show();

    insertVaultBrowserFileProperties(elemClicked);
    clickVaultBrowserFileDone(elemClicked);
}
function clickVaultBrowserFileDone(elemClicked) {}
function showSelectedFileSummary(elemClicked) {

    let elemTop = elemClicked.closest('.panel-top')

    let elemSelectedFile = elemTop.find('.tile.selected');

    if(elemSelectedFile.length === 0) return;

    showFileSummary(elemSelectedFile.attr('data-link'));

}
function insertVaultBrowserFileProperties(elemClicked) {

    let elemBrowser = elemClicked.closest('.vault-browser')    
    let id          = elemBrowser.attr('id');
    let elemContent = $('#' + id + '-details-content').html('');

    $('#' + id + '-details-processing').show();

    $.get('/vault/file-properties', { link : elemClicked.attr('data-link') }, function(response) {

        $('#' + id + '-details-processing').hide();
    
        for(let property of response.data.properties) {
            insertVaultBrowserFileProperty(elemContent, property.definition.displayName, property.value);
        }

    });

}
function insertVaultBrowserFileProperty(elemContent, label, value) {

    let elemField = $('<div></div>').appendTo(elemContent).addClass('field');

    $('<div></div>').appendTo(elemField).addClass('field-label').html(label);
    $('<div></div>').appendTo(elemField).addClass('field-value').html(value);

}



// Insert Vault Engineering Change Orders
function insertVaultEngineeringChangeOrders(params) {

    //  Set defaults for optional parameters
    // --------------------------------------
    let id           = 'vault-ecos';                // ID of the DOM element where the viewer should be inserted
    let header       = true;                        // Hide header with setting this to false
    let headerLabel  = 'Engineering Change Orders'; // Set the header text

    
    if( isBlank(params)             )       params = {};
    if(!isBlank(params.id)          )           id = params.id;
    if(!isBlank(params.header)      )       header = params.header;
    if(!isBlank(params.headerLabel) )  headerLabel = params.headerLabel;


    let elemTop = $('#' + id)
        .addClass('panel-top')
        .html('');


    if(header) {

        let elemHeader = $('<div></div>', {
            id : id + '-header'
        }).appendTo(elemTop).addClass('panel-header');

        $('<div></div>').appendTo(elemHeader)
        .addClass('panel-title')
        .attr('id', id + '-title')
        .html(headerLabel);

    }

        
    $('<div></div>').appendTo(elemTop)
        .addClass('panel-content')
        .addClass('tiles')
        .addClass('list')
        .addClass('m')
        .attr('id', id + '-vault-ecos');

    appendProcessing(id, true);
    insertVaultEngineeringChangeOrdersDone(id);
    insertVaultEngineeringChangeOrdersData(id);

}
function insertVaultEngineeringChangeOrdersDone(id) {}
function insertVaultEngineeringChangeOrdersData(id) {

    let timestamp    = new Date().getTime();
    let elemContent = $('#' + id + '-vault-ecos');

    $('#' + id + '-processing').show();

    $.get('/vault/change-orders', {}, function(response) {

        let index = 1;
        
        $('#' + id + '-processing').hide();

        for(let result of response.data.results) {

            let elemTile = genPDMTile(result, {});
                elemTile.appendTo(elemContent);

        }

        insertVaultEngineeringChangeOrdersDataDone(id, response.data);

    });

}
function insertVaultEngineeringChangeOrdersDataDone(id, data) {}



// Display Selected File Details
function showFileSummary(link, params) {

    if(isBlank(link)) return;


    //  Set defaults for optional parameters
    // --------------------------------------
    // let link = elemClicked.attr('data-link');
    let id           = 'file';    // ID of the DOM element where the viewer should be inserted
    let surfaceLevel = '2'

    console.log(link);


    if( isBlank(params)             )       params = {};
    if(!isBlank(params.id)          )           id = params.id;
    if(!isBlank(params.surfaceLevel)) surfaceLevel = params.surfaceLevel;

    let elemFile        = $('#' + id);
    let elemFileHeader  = $('#' + id + '-header');
    let elemFileDetails = $('#' + id + '-details');
    let elemFileBOM     = $('#' + id + '-bom');
    let elemFileViewer  = $('#' + id + '-viewer');
    let elemFileItems   = $('#' + id + '-items');

    if(elemFile.length === 0) {

        elemFile = $('<div></div>').appendTo($('body'))
            .addClass('screen')
            .addClass('surface-level-' + surfaceLevel)
            .attr('id', 'file')
            .append(elemFileHeader)
            .append(elemFileDetails)
            .append(elemFileBOM)
            .append(elemFileViewer)
            .append(elemFileItems);


        elemFileHeader = $('<div></div>').appendTo(elemFile).attr('id', 'file-header');
        elemFileDetails = $('<div></div>').appendTo(elemFile).attr('id', 'file-details');
        elemFileBOM = $('<div></div>').appendTo(elemFile).attr('id', 'file-bom');
        elemFileViewer = $('<div></div>').appendTo(elemFile).attr('id', 'file-viewer');
        elemFileItems = $('<div></div>').appendTo(elemFile).attr('id', 'file-items');


        appendPanelHeader(elemFileDetails, id + '-details', 'Details');
        appendPanelHeader(elemFileDetails, id + '-bom', 'Uses');
        
        appendPanelContent(elemFileDetails, id + '-details', []);
        appendPanelContent(elemFileDetails, id + '-bom', []);
        
        appendProcessing(id + '-details', true);
        appendProcessing(id + '-bom', true);


    }

    $('.screen').hide();

    elemFile.show();

    insertFileSummaryBOM(link, id);
    insertFileSummaryProperties(link, id);


}
function insertFileSummaryBOM(link, id) {

    let elemContent = $('#' + id + '-bom-content').html('');

    $('#' + id + '-bom-processing').show();

    $.get('/vault/file-bom', { link : link, fullModels : false, recurse : true }, function(response) {

        console.log(response);

        $('#' + id + '-bom-processing').hide();
    
        for(let property of response.data.properties) {
            insertFileSummaryProperty(elemContent, property.definition.displayName, property.value);
        }

    });

}
function insertFileSummaryProperties(link, id) {

    let elemContent = $('#' + id + '-details-content').html('');

    $('#' + id + '-details-processing').show();

    $.get('/vault/file-properties', { link : link }, function(response) {

        $('#' + id + '-details-processing').hide();
    
        for(let property of response.data.properties) {
            insertFileSummaryProperty(elemContent, property.definition.displayName, property.value);
        }

    });

}
function insertFileSummaryProperty(elemContent, label, value) {

    let elemField = $('<div></div>').appendTo(elemContent).addClass('field');

    $('<div></div>').appendTo(elemField).addClass('field-label').html(label);
    $('<div></div>').appendTo(elemField).addClass('field-value').html(value);

}



// Insert Vault User Groups
function insertVaultGroups(params) {

    //  Set defaults for optional parameters
    // --------------------------------------
    let id           = 'vault-groups';      // ID of the DOM element where the viewer should be inserted
    let header       = true;                // Hide header with setting this to false
    let headerLabel  = 'Groups';            // Set the header text

    
    if( isBlank(params)             )       params = {};
    if(!isBlank(params.id)          )           id = params.id;
    if(!isBlank(params.header)      )       header = params.header;
    if(!isBlank(params.headerLabel) )  headerLabel = params.headerLabel;


    let elemTop = $('#' + id)
        .addClass('panel-top')
        .html('');


    if(header) {

        let elemHeader = $('<div></div>', {
            id : id + '-header'
        }).appendTo(elemTop).addClass('panel-header');

        $('<div></div>').appendTo(elemHeader)
        .addClass('panel-title')
        .attr('id', id + '-title')
        .html(headerLabel);

    }

        
    $('<div></div>').appendTo(elemTop)
        .addClass('panel-content')    
        .attr('id', id + '-vault-groups');

    appendProcessing(id, true);
    insertVaultGroupsDone(id);
    insertVaultGroupsData(id);

}
function insertVaultGroupsDone(id) {}
function insertVaultGroupsData(id) {

    let timestamp    = new Date().getTime();
    let elemContent = $('#' + id + '-vault-groups');

    $('#' + id + '-processing').show();

    $.get('/vault/groups', {}, function(response) {
        
        $('#' + id + '-processing').hide();

        sortArray(response.data.results, 'name', 'ascending');

        for(let group of response.data.results) {
            $('<div></div>').appendTo(elemContent)
                .html(group.name);
        }

        insertVaultGroupsDataDone(id, response.data);

    });

}
function insertVaultGroupsDataDone(id, data) {}



// Insert Vault User Groups
function insertVaultRoles(params) {

    //  Set defaults for optional parameters
    // --------------------------------------
    let id           = 'vault-roles';      // ID of the DOM element where the viewer should be inserted
    let header       = true;               // Hide header with setting this to false
    let headerLabel  = 'Roles';            // Set the header text

    
    if( isBlank(params)             )       params = {};
    if(!isBlank(params.id)          )           id = params.id;
    if(!isBlank(params.header)      )       header = params.header;
    if(!isBlank(params.headerLabel) )  headerLabel = params.headerLabel;


    let elemTop = $('#' + id)
        .addClass('panel-top')
        .html('');

    if(header) {

        let elemHeader = $('<div></div>', {
            id : id + '-header'
        }).appendTo(elemTop).addClass('panel-header');

        $('<div></div>').appendTo(elemHeader)
        .addClass('panel-title')
        .attr('id', id + '-title')
        .html(headerLabel);

    }
        
    $('<div></div>').appendTo(elemTop)
        .addClass('panel-content')    
        .attr('id', id + '-vault-roles');

    appendProcessing(id, true);
    insertVaultRolesDone(id);
    insertVaultRolesData(id);

}
function insertVaultRolesDone(id) {}
function insertVaultRolesData(id) {

    let timestamp    = new Date().getTime();
    let elemContent = $('#' + id + '-vault-roles');

    $('#' + id + '-processing').show();

    $.get('/vault/roles', {}, function(response) {
        
        $('#' + id + '-processing').hide();

        sortArray(response.data.results, 'roleName', 'ascending');

        for(let role of response.data.results) {
            $('<div></div>').appendTo(elemContent)
                .html(role.roleName);
        }

        insertVaultRolesDataDone(id, response.data);

    });

}
function insertVaultRolesDataDone(id, data) {}



// Insert Vault Users
function insertVaultUsers(params) {

    //  Set defaults for optional parameters
    // --------------------------------------
    let id           = 'vault-users';      // ID of the DOM element where the viewer should be inserted
    let header       = true;               // Hide header with setting this to false
    let headerLabel  = 'Users';            // Set the header text

    
    if( isBlank(params)             )       params = {};
    if(!isBlank(params.id)          )           id = params.id;
    if(!isBlank(params.header)      )       header = params.header;
    if(!isBlank(params.headerLabel) )  headerLabel = params.headerLabel;


    let elemTop = $('#' + id)
        .addClass('panel-top')
        .html('');

    if(header) {

        let elemHeader = $('<div></div>', {
            id : id + '-header'
        }).appendTo(elemTop).addClass('panel-header');

        $('<div></div>').appendTo(elemHeader)
        .addClass('panel-title')
        .attr('id', id + '-title')
        .html(headerLabel);

    }
        
    $('<div></div>').appendTo(elemTop)
        .addClass('panel-content')    
        .attr('id', id + '-vault-users');

    appendProcessing(id, true);
    insertVaultUsersDone(id);
    insertVaultUsersData(id);

}
function insertVaultUsersDone(id) {}
function insertVaultUsersData(id) {

    let timestamp    = new Date().getTime();
    let elemContent = $('#' + id + '-vault-users');

    $('#' + id + '-processing').show();

    $.get('/vault/users', {}, function(response) {
        
        $('#' + id + '-processing').hide();

        sortArray(response.data.results, 'name', 'decending');

        for(let user of response.data.results) {
            $('<div></div>').appendTo(elemContent)
                .html(user.name + ' (' + user.email + ')');
        }

        insertVaultRolesDataDone(id, response.data);

    });

}
function insertVaultRolesDataDone(id, data) {}



// Insert Vault Users
function insertVaultSystemOptions(params) {

    //  Set defaults for optional parameters
    // --------------------------------------
    let id           = 'vault-options';    // ID of the DOM element where the viewer should be inserted
    let header       = true;               // Hide header with setting this to false
    let headerLabel  = 'System Options';  // Set the header text

    
    if( isBlank(params)             )       params = {};
    if(!isBlank(params.id)          )           id = params.id;
    if(!isBlank(params.header)      )       header = params.header;
    if(!isBlank(params.headerLabel) )  headerLabel = params.headerLabel;


    let elemTop = $('#' + id)
        .addClass('panel-top')
        .html('');

    if(header) {

        let elemHeader = $('<div></div>', {
            id : id + '-header'
        }).appendTo(elemTop).addClass('panel-header');

        $('<div></div>').appendTo(elemHeader)
        .addClass('panel-title')
        .attr('id', id + '-title')
        .html(headerLabel);

    }
        
    $('<div></div>').appendTo(elemTop)
        .addClass('panel-content')    
        .attr('id', id + '-vault-options');

    appendProcessing(id, true);
    insertVaultSystemOptionsDone(id);
    insertVaultSystemOptionsData(id);

}
function insertVaultSystemOptionsDone(id) {}
function insertVaultSystemOptionsData(id) {

    let timestamp    = new Date().getTime();
    let elemContent = $('#' + id + '-vault-options');

    $('#' + id + '-processing').show();

    $.get('/vault/system-options', {}, function(response) {
        
        $('#' + id + '-processing').hide();

        console.log(response);

        for(let user of response.data.results) {
            $('<div></div>').appendTo(elemContent)
                .html(user.name);
        }

        insertVaultRolesDataDone(id, response.data);

    });

}
function insertVaultRolesDataDone(id, data) {}