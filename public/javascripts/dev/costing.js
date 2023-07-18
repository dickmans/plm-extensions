let requestLimit = 10;
let optionValues = options.split(',');
let linkSheet = '/api/v3/workspaces/' + wsId + '/items/' + dmsId;
let linkModel = '/api/v3/workspaces/' + optionValues[0] + '/items/' + optionValues[1];
let factories = []; 
let suppliers, indexSegment, rates, selectedSite, linkBOM, bom, grid;
let chartMargin, chartPrevious, chartModels, chartSheets;
// let currentCost = [];

$(document).ready(function() {
    
    getSheetDetails();
    getCADBOM();
    getFactories();
    getSuppliers();
    setUIEvents();
    setCharts();

});


function setCharts() {
    
    chartModels = new Chart($('#chartModels'), {
        type: 'bar',
        data: {
            labels: [ 'This Model' , 'ALLMTN CF8', 'ALLMTN 7'],
            datasets: [
                { data : [1200,1100,1105], label:'Items' , backgroundColor: "rgba(50, 188, 173, 0.6)"},
                { data : [143,124,110], label:'Assembly' , backgroundColor: "rgba(24, 88, 168, 0.6)" },
                { data : [23,45,14], label:'Freight', backgroundColor: "rgba(135, 188, 64, 0.6)" }
            ]
        },
        options: {
            // maintainAspectRatio: false,
            responsive: true,
            legend : {
                display : true,
                position : 'bottom'
            },
            scales: {
                xAxes : [{
                    stacked : true 
                }],
                yAxes: [{
                    stacked : true,
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
    chartSheets = new Chart($('#chartSheets'), {
        type: 'bar',
        data: {
            labels: [ 'This Sheet' , 'Accell Netherlands', 'Accell Bisklet', 'Accell Hunland'],
            datasets: [
                { data : [1200,980,1340,1500], label:'Items' , backgroundColor: "rgba(50, 188, 173, 0.6)"},
                { data : [143,110,99,230], label:'Assembly' , backgroundColor: "rgba(24, 88, 168, 0.6)" },
                { data : [23,11,56,32], label:'Freight', backgroundColor: "rgba(135, 188, 64, 0.6)" }
            ]
        },
        options: {
            // maintainAspectRatio: false,
            responsive: true,
            legend : {
                display : true,
                position : 'bottom'
            },
            scales: {
                xAxes : [{
                    stacked : true 
                }],
                yAxes: [{
                    stacked : true,
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
    chartPrevious = new Chart($('#chartPrevious'), {
        type: 'bar',
        data: {
            labels: [ 'This Model' , 'Prevoius Season'],
            datasets: [
                { data : [1200,1012], label:'Items' , backgroundColor: "rgba(50, 188, 173, 0.6)"},
                { data : [143,87], label:'Assembly' , backgroundColor: "rgba(24, 88, 168, 0.6)" },
                { data : [23,21], label:'Freight', backgroundColor: "rgba(135, 188, 64, 0.6)" }
            ]
        },
        options: {
            // maintainAspectRatio: false,
            responsive: true,
            legend : {
                display : true,
                position : 'bottom'
            },
            scales: {
                xAxes : [{
                    stacked : true 
                }],
                yAxes: [{
                    stacked : true,
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
    chartMargin = new Chart($('#chartMargin'), {
        type: 'bar',
        data: {
            labels: [ 'Margins' ],
            datasets: [
                { data : [34], label:'Dijon' },
                { data : [43], label:'Accell Hunland' },
                { data : [28], label:'Accell Netherlands' },
                { data : [42], label:'Accell Bisiklet' }
            ]
        },
        options: {
            // maintainAspectRatio: false,
            responsive: true,
            legend : {
                display : true,
                position : 'bottom'
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });


}


function setUIEvents() {


    $('#factories').change(function() {
        $('#header-subtitle .button').removeClass('selected');
        recalc();
    });
    $('#header-subtitle .button').click(function() {
        $(this).toggleClass('selected');
        recalc();
    })

    // Tab Controls
    $('#tabs').children().click(function() {
        let id = $(this).attr('data-id');
        $('.content').hide();
        $('#' + id).show();
        $(this).addClass('selected');
        $(this).siblings().removeClass('selected');
    });
    $('#tabs').children().first().click();

    // Dialogs
    $('.col-header').click(function() {
        $('#' + $(this).attr('data-id')).show();
        $(this).addClass('selected');
        $(this).siblings().each(function() {
            $(this).removeClass('selected');
            $('#' + $(this).attr('data-id')).hide();
        });


    });
    $('#nav-select-item').click();
    $('#nav-select-supplier').click();


    // Close dialogs
    $('.dialog-close').click(function() {
        $('.dialog').hide();
        $('#overlay').hide();
    });
    $('.dialog-cancel').click(function() {
        $('.dialog').hide();
        $('#overlay').hide();
    });


    // Saving
    $('#save').click(function() {
        updateModel();
        updateCostSheet();
        //updateCostSheetGrid();
        //saveChanges();
    });

}


function recalc() {

    let totalCost           = 0;
    let totalMaterialCost   = 0;
    let totalAssemblyCost   = 0;
    let totalFreightCost    = 0;
    let freightCostUpcharge = 0;
    let site                = $('#factories').val();
    let siteName            = site.split(';')[0];
    let siteLink            = site.split(';')[1];

    let standardAssemblyCost = 0;
    let standardFreightCost = 0;

    for(factory of factories) {

        // console.log(factory);

        if(factory.__self__ === siteLink) {

            // console.log(factory);

            standardAssemblyCost   = Number(getSectionFieldValue(factory.sections, 'ASSEMBLY_COST_' + indexSegment, '0'));
            standardFreightCost    = Number(getSectionFieldValue(factory.sections, 'FREIGHT_CONVERTED_' + indexSegment, '0'));
            freightCostUpcharge    = Number(getSectionFieldValue(factory.sections, 'CHARGES_' + indexSegment, '0'));

        }

    }

    if(standardAssemblyCost !== 0) $('#include-assembly-cost').show().addClass('visible'); else $('#include-assembly-cost').hide().removeClass('visible');
    if(standardFreightCost !== 0) $('#include-freight-cost').show().addClass('visible'); else $('#include-freight-cost').hide().removeClass('visible');

    $('#standard-assembly-cost').html(standardAssemblyCost);
    $('#standard-freight-cost').html(standardFreightCost);

    if($('#include-assembly-cost').hasClass('selected')) totalAssemblyCost += standardAssemblyCost;
    if($('#include-freight-cost').hasClass('selected')) totalFreightCost += standardFreightCost;

    totalCost =  totalAssemblyCost + totalFreightCost;

    $('tr.section').each(function() {

        let totalCostSection    = 0;
        let elemSection         = $(this);
        let elemNext            = $(this).next();

        do {

            // console.log('in loop');

            if(elemNext.hasClass('row')) {

                let itemCost = calcItemCost(siteName, elemNext);
                totalCost += itemCost;
                totalCostSection += itemCost;
                
                elemNext = elemNext.next();

                if(elemSection.hasClass('section-bom')) totalMaterialCost += itemCost;
                else if(elemSection.hasClass('section-assembly')) totalAssemblyCost += itemCost;
                else totalFreightCost += itemCost;

            }



        } while (elemNext.hasClass('row'));

        // console.log(totalCostSection);
        // console.log(' >>>>>>>>>> ' + elemSection.find('.section-cost').first().length);

        elemSection.find('.section-cost').first().html(roundMoney(totalCostSection));


        //totalMaterialCost += 

    // $('.bom-row').each(function() {

        

    });

    $('#freight-upcharge').html(freightCostUpcharge);
    $('#material-cost').html(roundMoney(totalMaterialCost));
    $('#assembly-cost').html(roundMoney(totalAssemblyCost));
    $('#freight-cost').html(roundMoney(totalFreightCost));
    $('#total-cost').html(roundMoney(totalCost));

    // let targetPrice  = Number($('#target-retail-price').html());
    // let dealerCoeff  = Number($('#dealer-coeff').html());
    let targetCost   = Number($('#target-cost-price').html());
    let targetMargin = Number($('#target-margin').html());
    let retailPrice  = Number($('#dealer-price').html());

    // let targetCost = (targetPrice / dealerCoeff) - ((targetPrice / dealerCoeff) * );

    // $('#target-cost-price').html(targetCost);

    // console.log(targetCost - totalCost);
    // console.log(targetCost);
    // console.log(totalCost);
    // console.log(retailPrice);


    let actualMargin = Number((retailPrice - totalCost) / retailPrice * 100);

    console.log(retailPrice);
    console.log(totalCost);
    console.log(retailPrice - totalCost);
    console.log(actualMargin);
    
    if(targetCost > totalCost) $('#achievement-cost').addClass('low');
    else                       $('#achievement-cost').removeClass('low');

    if(targetMargin <= actualMargin) $('#achievement-margin').addClass('low');
    else                             $('#achievement-margin').removeClass('low');

    // console.log(actualMargin);
    // console.log(targetMargin);
    $('#achievement').removeClass('startup');
    $('#actual-cost').html(roundMoney(totalCost));
    $('#actual-cost-diff').html('( ' + roundMoney(totalCost - targetCost) + ' )');
    $('#actual-margin').html(roundMoney(actualMargin) + '%');
    $('#actual-margin-diff').html('( ' + roundMoney(actualMargin - targetMargin) + ' )');

}
function calcItemCost(siteName, elemRow) {

    // let elemRow = $(this);

    // console.log('calcItemCost START');

    let itemSupplier    = elemRow.attr('data-link-supplier');
    let quantity        = elemRow.find('.row-quantity').val();
    let currency        = elemRow.find('.row-currency').html();
    let currencySelect  = elemRow.find('.select-currency');
    let unitCost        = elemRow.find('.row-unit-cost').val();
    let discount        = elemRow.find('.row-discount').val();
    let landed          = 0;
    let totalCost       = 0;
    let valid           = false;


    if(currencySelect.length > 0) currency = currencySelect.val();

    if(discount === '') { discount = 1; } else { discount = 1 - (Number(discount) / 100); }

    if(quantity !== '') { if(currency !== '') { if(unitCost !== '') {
        valid = true;

        let exchangeRate = 1;

        for(rate of rates) {
            if(rate.to === 'Euro') {
                if(rate.from === currency) {
                    exchangeRate = rate.rate;
                }
            }
        }


        let unitCostConverted = unitCost / exchangeRate * discount;

        for(supplier of suppliers) {

            if(supplier.link === itemSupplier) {

                switch(siteName) {

                    case 'Accell Bisiklet': landed = supplier.site1; break;
                    case 'Accell Hunland': landed = supplier.site2; break;
                    case 'Accell Netherlands': landed = supplier.site3; break;
                    case 'Schweinfurt': landed = supplier.site4; break;
                    case 'Waldsassen': landed = supplier.site5; break;
                    case 'France Loire': landed = supplier.site6; break;
                    case 'Dijon': landed = supplier.site7; break;
                    case 'Third Party': landed = supplier.site8; break;

                }

            }
        }

        landed = 1 + (Number(landed) / 100);

        let landedCost = unitCostConverted * landed;
        totalCost = landedCost * quantity;

        console.log(totalCost);


        elemRow.find('.row-unit-cost-converted').html(roundMoney(unitCostConverted));
        elemRow.find('.row-landed-cost').html(roundMoney(landedCost));
        elemRow.find('.row-total-cost').html(roundMoney(totalCost));


    }}}

    return totalCost;

}
function roundMoney(value) {

// console.log(value);
//     if(typeof value === 'String') value = Number(value);

//     var numValue = (typeof value === 'String') ? Number(value) : value;
    var roundedString = value.toFixed(2);
    return Number(roundedString);

}
function getSheetDetails() {

    // let promises = [
    //     $.get('/plm/details', { 'link' : linkSheet }),
    //     $.get('/plm/grid', { 'link' : linkSheet })
    // ];

    $.get('/plm/details', { 'link' : linkSheet }, function(response) {

        let segment1 = getSectionFieldValue(response.data.sections, 'SEGMENT_1', '', 'title');
        linkBOM  = getSectionFieldValue(response.data.sections, 'BOM', '', 'link');

        $('#brand').html(getSectionFieldValue(response.data.sections, 'BRAND', '', 'title'));
        $('#model-code').html(getSectionFieldValue(response.data.sections, 'MODEL_CODE', ''));
        $('#model-name').html(getSectionFieldValue(response.data.sections, 'MODEL_NAME', ''));
        $('#segment-1').html(getSectionFieldValue(response.data.sections, 'SEGMENT_1', '', 'title'));
        $('#segment-2').html(getSectionFieldValue(response.data.sections, 'SEGMENT_2', '', 'title'));
        $('#target-retail-price').html(getSectionFieldValue(response.data.sections, 'TARGET_RETAIL_PRICE', ''));
        $('#dealer-coeff').html(getSectionFieldValue(response.data.sections, 'TARGET_DEALER_COEFF', ''));
        $('#target-margin').html(getSectionFieldValue(response.data.sections, 'TARGET_MARGIN', ''));
        $('#dealer-price').html(getSectionFieldValue(response.data.sections, 'DEALER_PRICE', ''));
        $('#target-cost-price').html(getSectionFieldValue(response.data.sections, 'TARGET_COST_PRICE', ''));

        if(segment1 === 'E-bike') indexSegment = '1';
        else if(segment1 === 'Speed Pedelec') indexSegment = '';
        else indexSegment = '3';

        let linkSegment = getSectionFieldValue(response.data.sections, 'CATEGORY', '', 'link');

        setSheetData(linkSheet, linkSegment, linkBOM);
        // getCADBOM(getSectionFieldValue(response.data.sections, 'CAD_BOM', '', 'link'));
        getExchangeRates(getSectionFieldValue(response.data.sections, 'EXCHANGE_RATES', '', 'link'));

        let imageLink = getSectionFieldValue(response.data.sections, 'IMAGE', '', 'link');

        getImageFromCache($('#artwork'), { 'link' : imageLink }, 'zmdi-wallpaper', function() {});

    });

}


function getCADBOM() {

    $('#cad-items-progress').show();

    $.get('/plm/details', { 'link' : linkModel }, function(response) {

        let linkCADBOM = getSectionFieldValue(response.data.sections, 'CAD_BOM', '', 'link');

        if(linkCADBOM !== '') {

            $.get('/plm/bom', {
                'link'  : linkCADBOM,
                'depth' : 10,
                'viewId' : 454
            }, function(response) {

                $('#cad-items-progress').hide();
                $('#nav-select-cad-item').show();

                console.log(response);

                for(result of response.data.nodes) {

                    let temp = $('<div></div>');
                    temp.html(getNodeFieldValue(result, '1287', '', ''));
   
                    let elemItem = $('<div></div>');
                        elemItem.html(result.item.title);
                        elemItem.addClass('button');
                        elemItem.attr('data-link', result.item.link);
                        elemItem.attr('data-part-number', getNodeFieldValue(result, '1288', '', ''));
                        elemItem.attr('data-description', temp.text());
                        elemItem.appendTo($('#cad-items-list'));
                        elemItem.click(function() {
                            
                            let elemFocus = $('.focus');
                                elemFocus.attr('data-link', $(this).attr('data-link'));
                                
                                elemFocus.find('input.row-pn-factory').first().val($(this).attr('data-part-number'));
                                elemFocus.find('input.row-description').first().val($(this).attr('data-description'));
                
                            $('#items-close').click();
                
                        });

                }

            });

        }

    });

}


// function getCADBOM(link) {

//     if(link === '') return;

//     $.get( '/plm/bom-views', { 'wsId' : link.split('/')[4] }, function(response) {
    
//         let view = response.data[0];

//         let params = {
//             'link'          : link,
//             'revisionBias'  : 'changeOrder',
//             'viewId'        : view.link.split('/')[8]
//         }
    
//         $.get( '/plm/bom-flat', params, function(response) {

//             for(item of response.data) {

//                 let elemItem = $('<div></div>');
//                     elemItem.attr('data-link', item.item.link);
//                     elemItem.appendTo($('#cad-bom'));

//                 let elemItemAction = $('<div></div>');
//                     elemItemAction.addClass('button');
//                     elemItemAction.html('Select');
//                     elemItemAction.appendTo(elemItem);
//                     elemItemAction.click(function() {
//                         $('.focus').find('.cell-value').first().html($(this).next().html());
//                         $('#cad-bom-close').click();
//                     });

//                 let elemItemDescriptor = $('<div></div>');
//                     elemItemDescriptor.html(item.item.title);
//                     elemItemDescriptor.appendTo(elemItem);


//             }


//         });
    

    
//     });

// }


// Get Library data
function getExchangeRates(link) {

    rates = [];

    $.get('/plm/grid', { 'link' : link }, function(response) {

        for(row of response.data) {
            rates.push({
                'from' : getGridRowValue(row, 'FROM_CURRENCY', '', 'title'),
                'to'   : getGridRowValue(row, 'TO_CURRENCY', '', 'title'),
                'rate' : getGridRowValue(row, 'RATE', '', '')
            });
        }

    });

}
function getFactories() {

    let params = { 
        'wsId'   : 374,
        'limit'  : 1000,
        'offset' : 0,
        'query'  : '*'
    }

    $.get('/plm/search-bulk', params, function(response) {
    
        factories = response.data.items;

        for(result of response.data.items) {

            let elemOption = $('<option></option>');
                elemOption.attr('value', getSectionFieldValue(result.sections, 'NAME', '', 'title') + ';' + result.__self__);
                elemOption.html(result.title);
                elemOption.appendTo($('#factories'));

        }

    });

}
function getSuppliers() {

    let params = { 
        'wsId'   : 375,
        'limit'  : 1000,
        'offset' : 0,
        'query'  : '*'
    }

    suppliers = [];

    $.get('/plm/search-bulk', params, function(response) {
    
        for(supplier of response.data.items) {

            let elemItem = $('<div></div>');
                elemItem.html(supplier.title);
                elemItem.addClass('button');
                elemItem.attr('data-link', supplier.__self__);
                elemItem.attr('data-currency', getSectionFieldValue(supplier.sections, 'CURRENCY', 'Euro', 'title'));
                elemItem.appendTo($('#suppliers-list'));
                elemItem.click(function() {
                    
                    let elemFocus = $('.focus');
                        // elemFocus.find('.cell-value').first().html($(this).html());
                        elemFocus.html($(this).html());
                        elemFocus.closest('tr').find('.row-currency').first().html($(this).attr('data-currency'));
                            
                    let elemRow = elemFocus.closest('.row');
                        elemRow.attr('data-link-supplier', $(this).attr('data-link'));
        
                    $('#suppliers-close').click();
                    recalc();
        
                });
    
            // let elemSelect = $('<div></div>');
            //     elemSelect.addClass('button');
            //     elemSelect.html('Select');
            //     elemSelect.appendTo(elemItem);
            //     elemSelect.click(function() {
                    
            //         let elemFocus = $('.focus');
            //             elemFocus.find('.cell-value').first().html($(this).next().html());
            //             elemFocus.closest('tr').find('.row-currency').first().html($(this).parent().attr('data-currency'));
                    
            //         let elemRow = elemFocus.closest('.row');
            //             elemRow.attr('data-link-supplier', $(this).parent().attr('data-link'));

            //         $('#suppliers-close').click();
            //         recalc();

            //     });
    
            // let elemItemDescriptor = $('<div></div>');
            //     elemItemDescriptor.html(supplier.title);
            //     elemItemDescriptor.appendTo(elemItem);

            suppliers.push({
                'link' : supplier.__self__, 
                'currency' : getSectionFieldValue(supplier.sections, 'CURRENCY', ''),
                'site1' : getSectionFieldValue(supplier.sections, 'LANDED_COST_ACCELL_BISIKLET', ''),
                'site2' : getSectionFieldValue(supplier.sections, 'LANDED_COST_ACCELL_HUNLAND', ''),
                'site3' : getSectionFieldValue(supplier.sections, 'LANDED_COST_ACCELL_NETHERLANDS', ''),
                'site4' : getSectionFieldValue(supplier.sections, 'LANDED_COST_SCHWEINFURT', ''),
                'site5' : getSectionFieldValue(supplier.sections, 'LANDED_COST_WALDSASSEN', ''),
                'site6' : getSectionFieldValue(supplier.sections, 'LANDED_COST_FRANCE_LOIRE', ''),
                'site7' : getSectionFieldValue(supplier.sections, 'LANDED_COST_DIJON', ''),
                'site8' : getSectionFieldValue(supplier.sections, 'LANDED_COST_THIRD_PARTY', '')
            });

        }

    });

}



// Add BOM placeholders based on template
function setSheetData(linkSheet, linkSegment, linkBOM) {

    let requests = [
        $.get('/plm/grid'   , { 'link' : linkSheet }),
        $.get('/plm/details', { 'link' : linkSegment }),
        $.get('/plm/bom'    , { 'link' : linkBOM, 'viewId' : 421 })
    ];

    Promise.all(requests).then(function(responses) {

        grid = responses[0].data;
        bom  = responses[2].data;

        console.log(grid);
        console.log(bom);

        bom.edges.sort(function(a, b){
            var nameA=a.itemNumber, nameB=b.itemNumber
            if (nameA < nameB) //sort string ascending
                return -1 
            if (nameA > nameB)
                return 1
            return 0 //default return value (no sorting)
        });

        if((grid.length === 0) || (bom.nodes.length < 2)) {

            setTemplateSection(responses[1].data.sections[1]);
            setCostTemplate(responses[1].data.sections[2], 'assembly');
            setCostTemplate(responses[1].data.sections[3], 'freight');

        } else {

            setBOMSections(responses[2]);

        }

        recalc();

    });

}
function setTemplateSection(section) {

    // let index = 1;

    for(field of section.fields) {

        if(field.value !== null) {

            let elemBOMSection = getCostSheetSection(field.title);
                elemBOMSection.addClass('data-db-status-new');
                // elemBOMSection.attr('data-sort', index++);
                
            // index += 100;
                

                // let elemBOMSection = $('<tr></tr>');
                //     elemBOMSection.addClass('section');
                //     elemBOMSection.addClass('section-bom');
                    
                //     elemBOMSection.appendTo($('#bom-table-body'));
                //     elemBOMSection.click(function(e) {
                //         if (e.shiftKey) {
                //             if($(this).hasClass('collapsed')) {
                //                 $('.bom-section.collapsed').removeClass('collapsed');
                //                 $('.row').show();
                //             } else {
                //                 $('.bom-section').addClass('collapsed');
                //                 $('.row').hide();
                //             }
                //         } else {
                //             $(this).toggleClass('collapsed');
                //             toggleSection($(this));
                //         }
                //     }); 

                // let elemBOMSectionCell = $('<th></th>');
                //     // elemBOMSectionCell.attr('colspan', 4);
                //     // elemBOMSectionCell.addClass('bom-section');
                //     elemBOMSectionCell.html(field.title);
                //     elemBOMSectionCell.appendTo(elemBOMSection);

                // let elemBOMSectionCells = $('<td></td>');
                //     elemBOMSectionCells.attr('colspan', 15);
                //     elemBOMSectionCells.appendTo(elemBOMSection);

                // let elemBOMSectionCost = $('<td></td>');
                //     elemBOMSectionCost.addClass('section-cost');
                //     elemBOMSectionCost.html('0');
                //     elemBOMSectionCost.appendTo(elemBOMSection);

                // let elemBOMSectionActions = $('<td></td>');
                //     elemBOMSectionActions.appendTo(elemBOMSection);



            let temp = $('<div></div>').html(field.value).text();
            // temp.appendTo($('#contents'));

            $('#contents').hide().html('');
            $('#contents').html(temp);

            // console.log(temp.length);

            // console.log(temp);
            // console.log(temp.children().length);

            $('#contents').find('li').each(function() {
                let elemRow = genCostSheetRow($(this).html(), '', '', '', '', 'N', true);
                elemRow.addClass('data-db-status-new');
                elemRow.addClass('category-bom');
                elemRow.attr('data-section-name', field.title);
                elemRow.appendTo($('#bom-table-body'));
            });

        }

    }


}
function setBOMSections() {

    console.log(bom);

    let bomRootId = linkBOM.split('/')[6];

    for(edge of bom.edges) {

        let parentId = edge.parent.split('.')[5];

        if(parentId === bomRootId) {

            for(node of bom.nodes) {

                if(edge.child === node.item.urn) {

                    let title = '';

                    for(field of node.fields) {
                        if(field.metaData.link === "/api/v3/workspaces/57/views/5/viewdef/421/fields/1219") title = field.value;
                    }


                    let elemBOMSection = getCostSheetSection(title);
                        elemBOMSection.attr('data-edgeId', edge.edgeId);
                        elemBOMSection.attr('data-link', node.item.link);

                    for(row of grid) {

                        let rowId           = row.rowData[0].__self__.split('/')[10];

                        let data = {
                            'section'   : '',
                            'name'      : '',
                            'status'    : 'N',
                            'link'      : '',
                            'edgeId'    : ''
                        }

                        for(field of row.rowData) {

                            switch(field.__self__.split('/')[10]) {

                                case 'SECTION'  : data.section   = field.value; break;
                                case 'ITEM'     : data.name     = field.value; break;
                                case 'STATUS'   : data.status   = field.value; break;
                                case 'ITEM_LINK': data.link     = field.value; break;

                            }

                        }

                        if(data.section === title) {
                            let elemRow = genCostSheetRow(data.name, '', '', rowId, '', data.status, true);
                                elemRow.attr('data-section-name', title);
                                elemRow.appendTo($('#bom-table-body'));

                            if(data.link !== '') {

                                for(node of bom.nodes) {

                                    if(node.item.link === data.link) {
                                        elemRow.attr('data-link', data.link);

                                        for(field of node.fields) {

                                            switch(field.metaData.link.split('/')[10]) {

                                                case '1221'     : elemRow.find('input.row-pn-factory').first().val(field.value); break;
                                                case '1222'     : elemRow.find('input.row-description').first().val(field.value); break;
                                                // case '1222'  : data.section   = field.value; break;
                
                                            }                                           

                                        }

                                        for(edge of bom.edges) {

                                            let idBOM = edge.child.split('.')[5];
                                            let idROW = data.link.split('/')[6];

                                            if(idBOM === idROW) {
                                                elemRow.attr('data-edgeId', edge.edgeId);

                                                for(field of edge.fields) {

                                                    switch(field.metaData.link.split('/')[10]) {

                                                        case '1220'     : elemRow.find('input.row-comments').first().val(field.value); break;
                                                        case '1217'     : 
                                                            let qty = field.value.split('.')[0];
                                                            elemRow.find('input.row-quantity').first().val(qty); 
                                                            break;
                                                        // case '1222'  : data.section   = field.value; break;
                        
                                                    }                                                        

                                                }

                                            }

                                        }


                                    }

                                }

                            }

                        }

                    }

                    continue;
                }

            }

        }

    }



    //         let temp = $('<div></div>').html(field.value).text();
    //         // temp.appendTo($('#contents'));

    //         $('#contents').hide().html('');
    //         $('#contents').html(temp);

    //         // console.log(temp.length);

    //         // console.log(temp);
    //         // console.log(temp.children().length);

    //         $('#contents').find('li').each(function() {
    //             let elemRow = genCostSheetRow($(this).html(), true);
    //             elemRow.addClass('data-db-status-new');
    //             elemRow.attr('data-section-name', field.title);
    //             elemRow.appendTo($('#bom-table-body'));
    //         });

    //     }

    // }


}
function setCostTemplate(section, className) {

    for(field of section.fields) {

        if(field.value !== null) {

            let elemBOMSection = $('<tr></tr>');
                // elemBOMSection.addClass('bom-section');
                elemBOMSection.addClass('section');
                elemBOMSection.addClass('section-' + className);
                elemBOMSection.appendTo($('#cost-table-body'));
                elemBOMSection.click(function(e) {
                    $(this).toggleClass('collapsed');
                    toggleSection($(this));
                }); 

            let elemBOMSectionCell = $('<th></th>');
                elemBOMSectionCell.html(field.title);
                elemBOMSectionCell.appendTo(elemBOMSection);

            let elemBOMSectionCells = $('<td></td>');
                elemBOMSectionCells.attr('colspan', 9);
                elemBOMSectionCells.appendTo(elemBOMSection);

            let elemBOMSectionCost = $('<td></td>');
                elemBOMSectionCost.addClass('section-cost');
                elemBOMSectionCost.html('0');
                elemBOMSectionCost.appendTo(elemBOMSection);

            let elemBOMSectionActions = $('<td></td>');
                elemBOMSectionActions.appendTo(elemBOMSection);



            let temp = $('<div></div>').html(field.value).text();
            // temp.appendTo($('#contents'));

            $('#contents').hide().html('');
            $('#contents').html(temp);

            // console.log(temp.length);

            // console.log(temp);
            // console.log(temp.children().length);

            $('#contents').find('li').each(function() {
                let elemRow = genCostSheetRow($(this).html(), '', '', '', '', 'N', false);

                elemRow.addClass('category-' + className);

                // let elemRow = genCostSheetRow($(this).html(), '', '', '', '', 'N', true);


                elemRow.appendTo($('#cost-table-body'));
            });

        }

    }

}
function getCostSheetSection(title) {

    let elemBOMSection = $('<tr></tr>');
        elemBOMSection.addClass('section');
        elemBOMSection.addClass('section-bom');
        elemBOMSection.appendTo($('#bom-table-body'));
        elemBOMSection.click(function(e) {
            if (e.shiftKey) {
                if($(this).hasClass('collapsed')) {
                    $('.bom-section.collapsed').removeClass('collapsed');
                    $('.row').show();
                } else {
                    $('.bom-section').addClass('collapsed');
                    $('.row').hide();
                }
            } else {
                $(this).toggleClass('collapsed');
                toggleSection($(this));
                }
            }); 

    let elemBOMSectionCell = $('<th></th>');
        elemBOMSectionCell.html(title);
        elemBOMSectionCell.appendTo(elemBOMSection);

    let elemBOMSectionCells = $('<td></td>');
        elemBOMSectionCells.attr('colspan', 16);
        elemBOMSectionCells.appendTo(elemBOMSection);

    let elemBOMSectionCost = $('<td></td>');
        elemBOMSectionCost.addClass('section-cost');
        elemBOMSectionCost.html('0');
        elemBOMSectionCost.appendTo(elemBOMSection);

    let elemBOMSectionActions = $('<td></td>');
        elemBOMSectionActions.appendTo(elemBOMSection);

    return elemBOMSection;

}
function genCostSheetRow(name, link, edgeId, rowId, pnFactory, status, isItem) {

    if(status === '') status = 'N';

    let elemRow = $('<tr></tr>');
        elemRow.attr('data-link', link);
        elemRow.attr('data-edgeId', edgeId);
        elemRow.attr('data-rowId', rowId);
        elemRow.addClass('row');

    let elemCellItem = $('<th></th>');
        elemCellItem.appendTo(elemRow);

    let elemInputItenm = $('<input>');
        elemInputItenm.addClass('row-name');
        elemInputItenm.val(name);
        elemInputItenm.appendTo(elemCellItem);

    if(isItem) {

        // let elemCellCheckBOM = $('<td></td>');
        //     elemCellCheckBOM.appendTo(elemRow);

        let elemCellEdit = $('<td></td>');
            elemCellEdit.appendTo(elemRow);

        let elemCellEditAction = $('<i></i>');
            elemCellEditAction.addClass('zmdi');
            elemCellEditAction.addClass('zmdi-edit');
            elemCellEditAction.appendTo(elemCellEdit);
            elemCellEditAction.click(function() { 
                $('.focus').removeClass('focus');
                $(this).closest('tr').addClass('focus');
                $('#items-list').html('');
                $('#items-progress').show();

                let name = $(this).closest('tr').find('.row-name').first().val();

                    name = encodeURI(name);

                // statusFilter.push({
                //     field       : "VAULT_ITEM",
                //     type        : 0,
                //     comparator  : 21,
                //     value       : "" 
                // });
                
                // let params = {
                //     wsId : wsId,
                //     fields : [
                //         "TITLE", 
                //         "TYPE", 
                //         "TARGET_REVIEW_DATE",
                //         "VAULT_ITEM",
                //         "THUMBNAIL",
                //         "WF_CURRENT_STATE",
                //         "DESCRIPTOR"
                //     ],
                //     sort : ["TITLE"],
                //     filter : statusFilter

                $.get('/plm/search-bulk', {
                    'wsId' : 57,
                    'query' : 'ITEM_DETAILS:TITLE%3D%22' + name + '%22',
                    'limit' : 50,
                    'bulk' : false
                }, function(response) {
                    console.log(response);

                    $('#items-progress').hide();

 


                    for(result of response.data.items) {


                        let temp = $('<div></div>');
                        temp.html(getSectionFieldValue(result.sections, 'DESCRIPTION', '', ''));

                        let elemItem = $('<div></div>');
                            elemItem.html(result.title);
                            elemItem.addClass('button');
                            elemItem.attr('data-link', result.__self__);
                            elemItem.attr('data-part-number', getSectionFieldValue(result.sections, 'PART_NUMBER', '', ''));
                            elemItem.attr('data-description', temp.text());
                            elemItem.appendTo($('#items-list'));
                            elemItem.click(function() {
                                
                                let elemFocus = $('.focus');
                                    elemFocus.attr('data-link', $(this).attr('data-link'));
                                    
                                    elemFocus.find('input.row-pn-factory').first().val($(this).attr('data-part-number'));
                                    elemFocus.find('input.row-description').first().val($(this).attr('data-description'));
                                    // elemFocus.find('.cell-value').first().html($(this).html());
                                    //elemFocus.html($(this).html());
                                    //elemFocus.closest('tr').find('.row-currency').first().html($(this).attr('data-currency'));
                                        
                                // let elemRow = elemFocus.closest('.row');
                                //     elemRow.attr('data-link-supplier', $(this).attr('data-link'));
                    
                                $('#items-close').click();
                                //recalc();
                    
                            });



                        // let elemRow = $('<tr></tr>');
                        //     elemRow.appendTo($('#items-list'));

                        // let elemRowDescriptor = $('<td></td>');
                        //     elemRowDescriptor.html(result.title);
                        //     elemRowDescriptor.appendTo(elemRow);

                        // let elemRowAction = $('<td></td>');
                        //     elemRowAction.appendTo(elemRow);

                        // let elemRowButton = $('<div></div>');
                        //     elemRowButton.addClass('button');
                        //     elemRowButton.html('Select');
                        //     elemRowButton.appendTo(elemRowAction);
                        //     elemRowButton.click(function() {
                        //         $('#items-close').click();
                        //     });


                    }

                });
                // $.get('/plm/search', {
                //     'wsId' : 57,
                //     'fields' : ['NUMBER', 'TITLE', 'DESCRIPTION'],
                //     'sort' : ['TITLE'],
                //     'filter' : [{ field : 'TITLE', type : 0, comparator : 21, value : ''}]
                // }, function(response) {
                //     console.log(response);
                // });

                showDialog('items', $(this)); 
            });

        let elemCellPNFactory = $('<td></td>');
            elemCellPNFactory.appendTo(elemRow);

        let elemCellPNFactoryInput = $('<input>');
            elemCellPNFactoryInput.addClass('row-pn-factory')
            elemCellPNFactoryInput.attr('disabled', 'disabled');
            elemCellPNFactoryInput.val(pnFactory);
            elemCellPNFactoryInput.appendTo(elemCellPNFactory);
            elemCellPNFactoryInput.change(function() {
                $(this).closest('.row').addClass('data-has-changed');
            });



        // let elemCell3D = $('<td></td>');
        //     elemCell3D.appendTo(elemRow);

        // let elemCell3DValue = $('<div></div>');
        //     elemCell3DValue.addClass('cell-value');
        //     elemCell3DValue.appendTo(elemCell3D);

        // let elemCell3DAction = $('<i></i>');
        //     elemCell3DAction.addClass('zmdi');
        //     elemCell3DAction.addClass('zmdi-edit');
        //     elemCell3DAction.appendTo(elemCell3D);
        //     elemCell3DAction.click(function() { 
        //         $('.focus').removeClass('focus');
        //         $(this).closest('td').addClass('focus');
        //         showDialog('cad', $(this)); 
        //     });

    }

    let elemCellDescription = $('<td></td>');
        elemCellDescription.appendTo(elemRow);

    let elemCellDescriptionInput = $('<input>');
        elemCellDescriptionInput.addClass('row-description');
        elemCellDescriptionInput.addClass('cell-value');
        elemCellDescriptionInput.appendTo(elemCellDescription);
        elemCellDescriptionInput.change(function() {
            $(this).closest('.row').addClass('data-has-changed');
        });

    let elemCellStatus = $('<td></td>');
        elemCellStatus.appendTo(elemRow);

    let elemCellStatusControls = $('<div></div>');
        elemCellStatusControls.addClass('cell-status-controls');
        elemCellStatusControls.appendTo(elemCellStatus);

    let elemCellStatusControl1 = $('<div></div>');
        elemCellStatusControl1.addClass('cell-status-control');
        elemCellStatusControl1.addClass('status-new');
        elemCellStatusControl1.html('N');
        elemCellStatusControl1.appendTo(elemCellStatusControls);
        elemCellStatusControl1.click(function() { 
            $(this).closest('.row').addClass('data-has-changed');
            $(this).addClass('selected').siblings().removeClass('selected') 
        });

    if(status === 'N') elemCellStatusControl1.addClass('selected');

    let elemCellStatusControl2 = $('<div></div>');
        elemCellStatusControl2.addClass('cell-status-control');
        elemCellStatusControl2.addClass('status-highlight');
        elemCellStatusControl2.html('H');
        elemCellStatusControl2.appendTo(elemCellStatusControls);
        elemCellStatusControl2.click(function() { 
            $(this).closest('.row').addClass('data-has-changed');
            $(this).addClass('selected').siblings().removeClass('selected') 
        });

    if(status === 'H') elemCellStatusControl2.addClass('selected');

    let elemCellStatusControl3 = $('<div></div>');
        elemCellStatusControl3.addClass('cell-status-control');
        elemCellStatusControl3.addClass('status-done');
        elemCellStatusControl3.html('D');
        elemCellStatusControl3.appendTo(elemCellStatusControls);
        elemCellStatusControl3.click(function() { 
            $(this).closest('.row').addClass('data-has-changed');
            $(this).addClass('selected').siblings().removeClass('selected') 
        });

    if(status === 'D') elemCellStatusControl3.addClass('selected');

    if(isItem) {

        let elemCellSupplierActionCell = $('<td></td>');
            elemCellSupplierActionCell.appendTo(elemRow);

        let elemCellSupplierAction = $('<i></i>');
            elemCellSupplierAction.addClass('zmdi');
            elemCellSupplierAction.addClass('zmdi-edit');
            elemCellSupplierAction.appendTo(elemCellSupplierActionCell);
            elemCellSupplierAction.click(function() { 
                $('.focus').removeClass('focus');
                $(this).closest('td').next().addClass('focus');

                $('#nav-select-source').hide();
                $('#nav-select-supplier').click();

                let linkItem = $(this).closest('tr').attr('data-link');

                console.log(linkItem);

                if(linkItem !== '') {

                    $('#nav-select-source').show().click();
                    $('#sources-progress').show();
                    $('#sources-list').html('');

                    $.get('/plm/grid', { 'link' : linkItem}, function(response) {
                        console.log(response);
                        $('#sources-progress').hide();

                        for(result of response.data) {

                            console.log('1111');

                            let elemSource = $('<tr></tr>');
                                elemSource.attr('data-link', getGridRowValue(result, 'SUPPLIER', '', 'link'));
                                elemSource.appendTo($('#sources-list'));
                                elemSource.click(function() {

                                    let elemFocus = $('.focus');
                                    // elemFocus.find('.cell-value').first().html($(this).html());
                                        elemFocus.html($(this).find('.source-supplier').first().html());
                                        elemFocus.closest('tr').find('.row-supplier-pn').first().val($(this).find('.source-supplier-pn').first().html());
                                        elemFocus.closest('tr').find('.row-lead-time').first().val($(this).find('.source-lead-time').first().html());
                                        elemFocus.closest('tr').find('.row-unit-cost').first().val($(this).find('.source-unit-cost').first().html());
                                        elemFocus.closest('tr').find('.row-discount').first().val($(this).find('.source-discount').first().html());
                                        elemFocus.closest('tr').find('.row-currency').first().html($(this).find('.source-currency').first().html());
                                        
                                    let elemRow = elemFocus.closest('.row');
                                        elemRow.attr('data-link-supplier', $(this).attr('data-link'));
                    
                                    $('#suppliers-close').click();
                                    recalc();


                                });

                            let elemSourceSupplier = $('<td></td>');
                                elemSourceSupplier.addClass('source-supplier');
                                elemSourceSupplier.html(getGridRowValue(result, 'SUPPLIER', '', 'title'));
                                elemSourceSupplier.appendTo(elemSource);

                            let elemSourceSupplierPN = $('<td></td>');
                                elemSourceSupplierPN.addClass('source-supplier-pn');
                                elemSourceSupplierPN.html(getGridRowValue(result, 'SUPPLIER_PN', '', ''));
                                elemSourceSupplierPN.appendTo(elemSource);

                            let elemSourcePreferred = $('<td></td>');
                                elemSourcePreferred.addClass('source-preferred');
                                elemSourcePreferred.html(getGridRowValue(result, 'PREFERRED', '', ''));
                                elemSourcePreferred.appendTo(elemSource);

                            let elemSourceLeadTime = $('<td></td>');
                                elemSourceLeadTime.addClass('source-lead-time');
                                elemSourceLeadTime.html(getGridRowValue(result, 'LEAD_TIME', '', ''));
                                elemSourceLeadTime.appendTo(elemSource);
                            
                            let elemSourceUnitCost = $('<td></td>');
                                elemSourceUnitCost.addClass('source-unit-cost');
                                elemSourceUnitCost.html(getGridRowValue(result, 'UNIT_COST', '', ''));
                                elemSourceUnitCost.appendTo(elemSource);
                            
                            let elemSourceDiscount = $('<td></td>');
                                elemSourceDiscount.addClass('source-discount');
                                elemSourceDiscount.html(getGridRowValue(result, 'DISCOUNT', '', ''));
                                elemSourceDiscount.appendTo(elemSource);
                            
                                let elemSourceSupplierMin = $('<td></td>');
                                elemSourceSupplierMin.addClass('source-min-qty');
                                elemSourceSupplierMin.html(getGridRowValue(result, 'MIN_QTY', '', ''));
                                elemSourceSupplierMin.appendTo(elemSource);

                            let elemSourceSupplierMax = $('<td></td>');
                                elemSourceSupplierMax.addClass('source-max-qty');
                                elemSourceSupplierMax.html(getGridRowValue(result, 'MAX_QTY', '', ''));
                                elemSourceSupplierMax.appendTo(elemSource);

                            let elemSourceCurrency = $('<td></td>');
                                elemSourceCurrency.addClass('source-currency');
                                elemSourceCurrency.html(getGridRowValue(result, 'CURRENCY', '', 'title'));
                                elemSourceCurrency.appendTo(elemSource);



                        }

                    });

                }

                showDialog('suppliers', $(this)); 

            });

        let elemCellSupplier = $('<td></td>');
            elemCellSupplier.addClass('cell-supplier');
            elemCellSupplier.appendTo(elemRow);

        // let elemCellSupplierValue = $('<div></div>');
        //     elemCellSupplierValue.addClass('cell-value');
        //     elemCellSupplierValue.appendTo(elemCellSupplier);



        let elemCellSupplierPN = $('<td></td>');
            elemCellSupplierPN.appendTo(elemRow);

        let elemCellSupplierPNInput = $('<input>');
            elemCellSupplierPNInput.addClass('row-supplier-pn');
            // elemCellSupplierPNInput.val(pnFactory);
            elemCellSupplierPNInput.appendTo(elemCellSupplierPN);
            elemCellSupplierPNInput.change(function() {
                $(this).closest('.row').addClass('data-has-changed');
            });


        let elemCellPartType = $('<td></td>');
            elemCellPartType.appendTo(elemRow);
    
        let elemInputPartType = $('<select></select>');
            elemInputPartType.append($('<option value=""></option>'));
            elemInputPartType.append($('<option value="Catalog">Catalog</option>'));
            elemInputPartType.append($('<option value="Custom">Custom</option>'));
            elemInputPartType.append($('<option value="Own-Developed">Own-Developed</option>'));
            elemInputPartType.appendTo(elemCellPartType);

        let elemCellLeadTime = $('<td></td>');
            elemCellLeadTime.appendTo(elemRow);

        let elemCellLeadTimeInput = $('<input>');
            elemCellLeadTimeInput.addClass('row-lead-time');
            // elemCellSupplierPNInput.val(pnFactory);
            elemCellLeadTimeInput.appendTo(elemCellLeadTime);
            elemCellLeadTimeInput.change(function() {
                $(this).closest('.row').addClass('data-has-changed');
            });

    }


    let elemCellComments = $('<td></td>');
        elemCellComments.appendTo(elemRow);

    let elemCellCommentsInput = $('<input>');
        elemCellCommentsInput.addClass('row-comments');
        elemCellCommentsInput.addClass('cell-value');
        elemCellCommentsInput.appendTo(elemCellComments);
        elemCellCommentsInput.change(function() {
            $(this).closest('.row').addClass('data-has-changed');
        });

    let elemCellUnitCost = $('<td></td>');
        elemCellUnitCost.appendTo(elemRow);

    let elemInputUnitCost = $('<input>');
        elemInputUnitCost.addClass('numeric');
        elemInputUnitCost.addClass('row-unit-cost');
        elemInputUnitCost.appendTo(elemCellUnitCost);
        elemInputUnitCost.change(function() { recalc(); });

    let elemCellDiscount = $('<td></td>');
        elemCellDiscount.appendTo(elemRow);

    let elemInputDiscount = $('<input>');
        elemInputDiscount.addClass('numeric');
        elemInputDiscount.addClass('row-discount');
        elemInputDiscount.appendTo(elemCellDiscount);
        elemInputDiscount.change(function() { recalc(); });

    let elemCellQty = $('<td></td>');
        elemCellQty.appendTo(elemRow);

    let elemInputQty = $('<input>');
        elemInputQty.addClass('numeric');
        elemInputQty.addClass('row-quantity');
        elemInputQty.appendTo(elemCellQty);
        elemInputQty.change(function() { 
            $(this).closest('.row').addClass('data-has-changed');
            recalc(); 
        });

    let elemCellCurrency = $('<td></td>');
        elemCellCurrency.addClass('row-currency');
        elemCellCurrency.appendTo(elemRow);
        
    if(!isItem) {

        let elemCellCurrencyInput = $('<select></select>');
            elemCellCurrencyInput.addClass('select-currency');
            elemCellCurrencyInput.append($('<option value="Euro">Euro</option>'));
            elemCellCurrencyInput.append($('<option value="USD">USD</option>'));
            elemCellCurrencyInput.append($('<option value="RMB">RMB</option>'));
            elemCellCurrencyInput.append($('<option value="JPY">JPY</option>'));
            elemCellCurrencyInput.append($('<option value="GBP">GBP</option>'));
            elemCellCurrencyInput.appendTo(elemCellCurrency);
            elemCellCurrencyInput.change(function(){ recalc(); });

    }


    let elemCellUnitCostConverted = $('<td></td>');
        elemCellUnitCostConverted.addClass('row-unit-cost-converted');
        elemCellUnitCostConverted.appendTo(elemRow);

    let elemCellLandedCost = $('<td></td>');
        elemCellLandedCost.addClass('row-landed-cost');
        elemCellLandedCost.appendTo(elemRow);

    let elemCellTotalCost = $('<td></td>');
        elemCellTotalCost.addClass('row-total-cost');
        elemCellTotalCost.appendTo(elemRow);

    let elemCellActions = $('<td></td>');
        elemCellActions.addClass('row-actions');
        elemCellActions.appendTo(elemRow);

    let elemCellActionAdd = $('<i></i>');
        elemCellActionAdd.addClass('zmdi');
        elemCellActionAdd.addClass('zmdi-plus-circle');
        elemCellActionAdd.appendTo(elemCellActions);
        elemCellActionAdd.click(function() {
            let elemRow = genBOMRow('');
                elemRow.insertAfter($(this).closest('tr'));
        });

    let elemCellActionUp = $('<i></i>');
        elemCellActionUp.addClass('zmdi');
        elemCellActionUp.addClass('zmdi-long-arrow-up');
        elemCellActionUp.appendTo(elemCellActions);
        elemCellActionUp.click(function() {
            let elemRow = $(this).closest('tr');
            let elemRowPrev = elemRow.prev();
                elemRowPrev.insertAfter(elemRow);
        });

    let elemCellActionDown = $('<i></i>');
        elemCellActionDown.addClass('zmdi');
        elemCellActionDown.addClass('zmdi-long-arrow-down');
        elemCellActionDown.appendTo(elemCellActions);
        elemCellActionDown.click(function() {
            let elemRow = $(this).closest('tr');
            let elemRowNext = elemRow.next();
                elemRowNext.insertBefore(elemRow);
        });

    let elemCellActionRemove = $('<i></i>');
        elemCellActionRemove.addClass('zmdi');
        elemCellActionRemove.addClass('zmdi-close-circle');
        elemCellActionRemove.appendTo(elemCellActions);
        elemCellActionRemove.click(function() {
            $(this).closest('tr').remove();
        });

    return elemRow;

}
function toggleSection(elemCurrent) {

    let elemNext = elemCurrent.next();

    if(elemNext.length > 0) {

        if(elemNext.hasClass('row')) {
            elemNext.toggle();
            toggleSection(elemNext);
        }

    }

    // elemNext.next().wsId
    // toggle();

}




// Show dialog to allow for selection
function showDialog(id, elemClicked) {

    // let label = elemClicked.parent().siblings().first().html();
    let label = elemClicked.closest('tr').find('.row-name').first().val();

    $('.dialog-prefix').html(label);

    $('#overlay').show();
    $('#' + id).show();

}


// Update Model Properties
function updateModel() {

    if($('#total-cost').html() === '0') return;

    $.get('/plm/edit', { 'link' : linkModel, 'sections': [{
        'id' : '1563',
        'fields' : [{
            'fieldId' : 'ACTUAL_COST', 'value' : $('#total-cost').html()
        }]
    }]}, function(response) { console.log(response); });

}


// Update Cost Sheet Properties
function updateCostSheet() {

    $('#overlay').show();

    let factory = $('#factories').val().split(';')[1];

    console.log(factory);

    let params = {
        'link' : linkSheet, 
        'sections': [{
            'id' : '1728',
            'fields' : [
                { 'fieldId' : 'ASSEMBLY_FACTORY', 'value' : { 'link' : factory } , 'type' : 'picklist' },
                { 'fieldId' : 'CLEAR_GRID', 'value' : true  }
            ]
        },{
            'id' : '1494',
            'fields' : [
                { 'fieldId' : 'TOTAL_MATERIAL_COST' , 'value' : $('#material-cost').html() },
                { 'fieldId' : 'TOTAL_ASSEMBLY_COST' , 'value' : $('#assembly-cost').html() },
                { 'fieldId' : 'TOTAL_FREIGHT_COST'  , 'value' : $('#freight-cost').html() },
                { 'fieldId' : 'TOTAL_PAINTING_COST' , 'value' : 0.0 }
            ]
        }]
    };

    console.log(params);

    if($('#total-cost').html() !== '0') {
        params.sections.push({
            'id' : '1493',
            'fields' : [
                { 'fieldId' : 'ACTUAL_COST_PRICE'        , 'value' : $('#total-cost').html() }
            ]
        })
    }

    console.log(params);

    $.get('/plm/edit', params, function(response) { 
        console.log(response); 
        $('.row').addClass('to-be-added');
        $('.row').addClass('validiate-new-items');
        $('.row.category-bom').addClass('validate-bom-link');
        $('#overlay').hide();
        console.log($('.section-bom.data-db-status-new').length);
        saveBOMSections();
    });

}


// Create section entries in BOM
function saveBOMSections() {

    let requests = [];
    let index    = 0;

    $('.section-bom.data-db-status-new').each(function() {
        requests.push($.post('/plm/create', {
            'wsId' : 57,
            'sections' : [{
                'id' : 203,
                'fields' : [{
                    'fieldId' : 'TITLE', 'value' : $(this).children().first().html()
                }]
            }]
        }));
        $(this).attr('request-index', index++);
    });

    console.log(requests);

    if(requests.length === 0) {

        createItems();

    } else {

        Promise.all(requests).then(function(responses) {

            // console.log(responses);

            let number = 1;
            let dmsIdParent = linkBOM.split('/')[6];

            requests = [];

            $('.section-bom.data-db-status-new').each(function() {

                $(this).removeClass('data-db-status-new');

                let index       = $(this).attr('request-index');
                let response    = responses[index];
                let link        = response.data.split('.autodeskplm360.net')[1];

                $(this).attr('data-link', link);

                // console.log(response.data);

                requests.push(
                    $.get('/plm/bom-add', {
                        'dmsIdParent'   : dmsIdParent,
                        'dmsIdChild'    : response.data.split('/')[8],
                        'wsIdParent'    : 57,
                        'wsIdChild'     : 57,
                        'qty'           : 1,
                        'number'        : number++
                    })
                );

            });

            // console.log(requests);

            Promise.all(requests).then(function(responses) {

                console.log(responses);
                
                createItems();

            });

        });

    }

}


// Create new item master records
function createItems() {

    if($('.row.validiate-new-items').length > 0) {
        
        let requests = [];

        $('.row.validiate-new-items').each(function() {

            let elemRow = $(this);

            if(requests.length < requestLimit) {

                if(elemRow.attr('data-link') === '') {

                    let itemData    = getItemMasterData(elemRow);
                    let hasItemData = false;

                    // console.log(itemData);
                    // console.log(hasItemData);

                    for(data of itemData) {
                        if(typeof data.value !== 'undefined') {
                            if(data.value !== '') {
                                console.log(data.value);
                                hasItemData = true;
                            }
                        }
                    }

                    // console.log(hasItemData);

                    if(hasItemData) {
                        let params = getItemRequestParams(elemRow);
                        requests.push($.post('/plm/create', params));
                        elemRow.addClass('request-pending');
                        elemRow.attr('request-index', requests.length - 1);
                    }

                }

                elemRow.removeClass('validiate-new-items');

            }

        });

        Promise.all(requests).then(function(responses) {

            $('.request-pending').each(function() {
                let index = $(this).attr('request-index');
                let link = responses[index].data.split('.autodeskplm360.net')[1];
                $(this).attr('data-link', link);
                $(this).removeClass('request-pending');
                $(this).attr('request-index', '');
            });

            createItems();

        });

    } else {
        
        validateBOMLinks();

    }

}
function getItemMasterData(elemRow) {

    let data = [];

    data.push({ 'fieldId' : 'DESCRIPTION', 'value' : elemRow.find('input.row-description').val() });
    data.push({ 'fieldId' : 'SUPPLIER', 'value' : elemRow.find('.cell-supplier').html() });
    data.push({ 'fieldId' : 'SUPPLIER_PN', 'value' : elemRow.find('input.row-supplier-pn').val() });
    data.push({ 'fieldId' : 'LEAD_TIME', 'value' : elemRow.find('input.row-lead-time').val() });
    data.push({ 'fieldId' : 'COMMENTS', 'value' : elemRow.find('input.row-comments').val() });
    data.push({ 'fieldId' : 'UNIT_COST', 'value' : elemRow.find('input.row-unit-cost').val() });
    data.push({ 'fieldId' : 'DISCOUNT', 'value' : elemRow.find('input.row-discount').val() });
    data.push({ 'fieldId' : 'QUANTITY', 'value' : elemRow.find('input.row-quantity').val() });

    // console.log(data);

    return data;

}
function getItemRequestParams(elemRow) {

    let params = {
        'wsId'      : 57,
        'sections'  : [{
            'id'    : 203,
            'fields' : [
                { 'fieldId' : 'TITLE', 'value' : elemRow.find('input.row-name').val() },
                { 'fieldId' : 'DESCRIPTION', 'value' : elemRow.find('input.row-description').val() }
            ]
        }]
    };

    if(elemRow.attr('data-link') !== '') params.link = elemRow.attr('data-link');

    console.log(params);

    return params;

}


// Create BOM Links
function validateBOMLinks() {

    if($('.row.validate-bom-link').length > 0) {

        let requests    = [];       
        
        $('.row.validate-bom-link').each(function() {

            let elemRow = $(this);

            if(elemRow.attr('data-link') !== '') {
                if(elemRow.attr('data-edgeId') === '') {
                
                    if(requests.length < requestLimit) {

                        let paramsBOM = getBOMRequestParams(elemRow);

                        requests.push($.get('/plm/bom-add', paramsBOM));

                        elemRow.addClass('request-pending');
                        elemRow.attr('request-index', requests.length - 1);
                        elemRow.removeClass('validate-bom-link');

                    };

                } else {

                    elemRow.removeClass('validate-bom-link');

                }
            } else {

                elemRow.removeClass('validate-bom-link');
                
            }

            

        });

        if(requests.length > 0) {

            Promise.all(requests).then(function(responses) {

                console.log(responses)

                $('.request-pending').each(function() {
                    let index = $(this).attr('request-index');
                    let edgeId = responses[index].data.split('/bom-items/')[1];
                    $(this).attr('data-edgeId', edgeId);
                    $(this).attr('request-index', '');
                    $(this).removeClass('request-pending');
                });

                validateBOMLinks();


            });

        } else {

            validateBOMLinks();

        }

    } else {

        updateCostSheetGrid();

    }

}
function getBOMRequestParams(elemRow) {
    
    console.log(elemRow);


    let dataChild   = elemRow.attr('data-link').split('/');
    let dmsIdChild  = dataChild[dataChild.length - 1];

    console.log(dmsIdChild);

    let dmsIdParent = elemRow.prevAll('.section-bom').attr('data-link').split('/')[6];

    let params = {
        'dmsIdChild'    : dmsIdChild,
        'dmsIdParent'   : dmsIdParent,
        'wsIdParent'    : 57,
        'wsIdChild'     : 57,     
        'qty'           : (elemRow.find('input.row-quantity').val() === '') ? 0 : elemRow.find('input.row-quantity').val(),
        'fields'        : []
    };

    if(elemRow.attr('data-edgeId') !== '') params.edgeId = elemRow.attr('data-edgeId');

    params.fields.push(
        { 'link' : '/api/v3/workspaces/57/views/5/viewdef/421/fields/1290', 'value' : { 'link' : elemRow.attr('data-link-supplier') }},
        { 'link' : '/api/v3/workspaces/57/views/5/viewdef/421/fields/1289', 'value' : elemRow.find('input.row-supplier-pn').val() },
        { 'link' : '/api/v3/workspaces/57/views/5/viewdef/421/fields/1291', 'value' : elemRow.find('input.row-unit-cost').val() },
        { 'link' : '/api/v3/workspaces/57/views/5/viewdef/421/fields/1292', 'value' : elemRow.find('input.row-discount').val() },
        { 'link' : '/api/v3/workspaces/57/views/5/viewdef/421/fields/1308', 'value' : elemRow.find('input.row-lead-time').val() }
    );

    console.log(params);

    return params;

}


// Save Sheet Layout
function updateCostSheetGrid() {

    console.log($('.row.to-be-added').length);

    if($('.row.to-be-added').length > 0) {
            
        let requests = [];
    
        $('.row.to-be-added').each(function() {
    
            let elemRow = $(this);
    
            if(requests.length < requestLimit) {
    
                requests.push($.get('/plm/add-grid-row', {
                    'link' : linkSheet,
                    'data' : getCostSheetRowData(elemRow)
                }));
    
                elemRow.removeClass('to-be-added');
                    // elemRow.addClass('pending-request');
                    // elemRow.attr('data-pending-request', requests.length - 1);
    
            }
    
        });
    
        console.log(requests);
    
        Promise.all(requests).then(function(responses) {
            updateCostSheetGrid();
        });
    
    } else {
        $('#overlay').hide();
    }

}
function getCostSheetRowData(elemRow) {

    let data = [];

    let category = 'BOM';

    if(elemRow.hasClass('category-assembly')) category = 'ASSEMBLY';
    else if(elemRow.hasClass('category-freight')) category = 'FREIGHT';

    data.push({ 'fieldId' : 'CATEGORY'      , 'value' : category });
    data.push({ 'fieldId' : 'SECTION'       , 'value' : elemRow.attr('data-section-name') });
    data.push({ 'fieldId' : 'ITEM'          , 'value' : elemRow.find('input.row-name').val() });
    //data.push({ 'fieldId' : 'PN_FACTORY'    , 'value' : elemRow.find('input.row-pn-factory').val() });
    data.push({ 'fieldId' : 'STATUS'        , 'value' : elemRow.find('.cell-status-control.selected').first().html() });
    data.push({ 'fieldId' : 'ITEM_LINK'     , 'value' : elemRow.attr('data-link') });

    return data;

}



// Store data in Grid and BOM when clicking Save
// function saveChanges() {

//     $('#overlay').show();
//     $('.row').addClass('validiate-new-items');

//     // Create BOM sections
//     if($('.section-bom.data-db-status-new').length > 0) {
//         saveSections();
//     } else {
//         createItems();
//     }


    




//     // let data = [];
//     // $('.section-bom').each(function() {

//     //     let dataSection = {};
//     //         dataSection.title = $(this).children().first().html();
//     //         dataSection.items = [];
        
//     //     let elemNext = $(this).next();

//     //     do {

//     //         if(elemNext.hasClass('row')) {

//     //             let dataItem = {};
//     //                 dataItem.name       = elemNext.find('.row-name').val();
//     //                 dataItem.status     = elemNext.find('.cell-status-control.selected').html();
//     //                 dataItem.reference  = null;

//     //             dataSection.items.push(dataItem);
                
//     //             elemNext = elemNext.next();

//     //         }

//     //     } while (elemNext.hasClass('row'));

//     //     data.push(dataSection);

//     // });

//     // console.log(data);

//     // let sections = [{
//     //     'id' : 1492,
//     //     'fields' : [
//     //         { 'fieldId' : 'DATA', 'value' : JSON.stringify(data) }
//     //     ]
//     // }];


//     // // 'sections' : [{
//     // //     'id'     : sectionIdMBOM2,
//     // //     'fields' : [
//     // //         { 'fieldId' : 'LAST_EBOM_SYNC', 'value' : timestamp.getFullYear()  + '-' + (timestamp.getMonth()+1) + '-' + timestamp.getDate() }
//     // //     ]
//     // // }]



//     // $.get('/plm/edit', { 'link' : linkSheet, 'sections' : sections}, function(response) {
//     //     $('#overlay').hide();
//     // });


// }
// function saveSections() {

//     let requests = [];

//     $('.section-bom.data-db-status-new').each(function() {
//         requests.push($.post('/plm/create', {
//             'wsId' : 57,
//             'sections' : [{
//                 'id' : 203,
//                 'fields' : [{
//                     'fieldId' : 'TITLE', 'value' : $(this).children().first().html()
//                 }]
//             }]
//         }));
//     });

//     console.log(requests);

//     Promise.all(requests).then(function(responses) {

//         console.log(responses);

//         let number = 1;
//         let dmsIdParent = linkBOM.split('/')[6];

//         requests = [];

//         for(response of responses) {

//             requests.push(
//                 $.get('/plm/bom-add', {
//                     'dmsIdParent' : dmsIdParent,
//                     'dmsIdChild' : response.data.split('/')[8],
//                     'wsIdParent' : 57,
//                     'wsIdChild' : 57,
//                     'qty' : 1,
//                     'number' : number++
//                 })
//             );



//         }

//         console.log(requests);

//         Promise.all(requests).then(function(responses) {
//             console.log(responses);
//             $('.section-bom.data-db-status-new').each(function() {
//                 $(this).removeClass('data-db-status-new');
//             });
            
//             createItems();
//         });

//     });

// }

// function addNewGridRows() {

//     if($('.row.data-db-status-new').length > 0) {
        
//         let requests = [];

//         $('.row.data-db-status-new').each(function() {

//             let elemRow = $(this);

//             if(requests.length <= requestLimit) {

//                 requests.push($.get('/plm/add-grid-row', {
//                     'link' : linkSheet,
//                     'data' : getCostSheetRowData(elemRow)
//                 }));

//                 elemRow.removeClass('data-db-status-new');
//                 // elemRow.addClass('pending-request');
//                 // elemRow.attr('data-pending-request', requests.length - 1);

//             }

//         });

//         console.log(requests);

//         Promise.all(requests).then(function(responses) {

//             console.log(responses);

//             // $('.pending-request').each(function() {
//             //     let index = $(this).attr('data-pending-request');
//             //     let link = responses[index].data.split('.autodeskplm360.net')[1];
//             //     $(this).attr('data-link', link);
//             //     $(this).removeClass('pending-request');
//             //     $(this).attr('data-pending-request', '');
//             // });

//             addNewGridRows();

//         });

        

//     } else {

//         updateGridRows();

//     }

// }
// function updateGridRows() {

//     if($('.row.data-has-changed').length > 0) {
        
//         let requests = [];

//         $('.row.data-has-changed').each(function() {

//             let elemRow = $(this);

//             if(requests.length <= requestLimit) {

//                 requests.push($.get('/plm/update-grid-row', {
//                     'link' : linkSheet,
//                     'rowId' : $(this).attr('data-rowId'),
//                     'data' : getCostSheetRowData(elemRow)
//                 }));


//                 let itemData    = getItemMasterData(elemRow);
//                 let hasItemData = false;

//                 for(data of itemData) {
//                     if(data.value !== '') {
//                         hasItemData = true;
//                     }
//                 }

//                 console.log(hasItemData);

//                 if(hasItemData) {

//                     let itemLink    = elemRow.attr('data-link');
//                     let edgeId      = elemRow.attr('data-edgeId');
//                     let params      = getItemRequestParams(elemRow);

//                     if(itemLink !== '') {

//                         requests.push($.get('/plm/edit', params));


//                         if(edgeId !== '') {

//                             let paramsBOM = getBOMRequestParams(elemRow);

//                                 // let paramsBOM = {
//                                 //     'wsIdParent' : 57,
//                                 //     'wsIdChild' : 57,
//                                 //     'qty' : getItemMasterData[2].value,
//                                 //     'fields' : [
//                                 //         { 'link' : '/api/v3/workspaces/57/views/5/viewdef/421/fields/1220' , 'value' : getItemMasterData[1].value}
//                                 //     ]

//                                 // };

//                             console.log(paramsBOM);

//                             requests.push($.get('/plm/bom-update', paramsBOM));
//                         }

//                     }

//                     // elemRow.addClass('pending-request');
//                     // elemRow.attr('data-pending-request', requests.length - 1);
//                     elemRow.removeClass('data-has-changed');
                    
//                 }

//             }            

//         });

//         console.log(requests);

//         Promise.all(requests).then(function(responses) {

//             console.log(responses);
//             updateGridRows();

//         });

        

//     } else {

//         $('.row').addClass('validate-bom-link');
//         validateBOMLinks();

//         $('#overlay').hide();
//     }

// }




