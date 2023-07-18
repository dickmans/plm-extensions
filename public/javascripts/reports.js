let startupReports = [];
let startupCount   = 3;

$(document).ready(function() {   

    startupReports = config.reports.startupReportNames;
    startupCount = config.reports.startupReportCount;

    appendOverlay(false);
    setUIEvents();
    getReports();

});


// Set buttons
function setUIEvents() {

     $('.button.cancel').click(function() {
        $('#overlay').hide();
        $('.dialog').hide();
    });

    $('#submit').click(function() {
        setReports();
        $('.dialog').hide();
    });

    $('.clear').click(function() {
        $('.tiles').children().removeClass('selected');
    });

}


// Retrieve list of reports in PLM
function getReports() {

    $.get('/plm/reports', {}, function(response) {

        let elemReports = $('#list');
        let reports     = response.data.reportDefinitionList.list;

        $('#overlay').hide();

        sortArray(reports, 'name', 'string', 'ascending');

        for(report of reports) {

            if(report.hasOrphanFields) {

                console.log(' !!! Report has orphan fields / errors: ' + report.name);

            } else {

                let description = (typeof report.description === 'undefined') ? '&nbsp;' : report.description;
                let icon = 'table';

                if(report.isChartReport) {

                    switch(report.reportChart.type) {

                        case 'COLUMN'       : icon = 'bar_chart'; break;
                        case 'LINE'         : icon = 'show_chart'; break;
                        case 'MSCOLUMN'     : icon = 'grouped_bar_chart'; break;
                        case 'MSAREA'       : icon = 'stacked_line_chart'; break;
                        case 'PIE'          : icon = 'incomplete_circle'; break;
                        case 'DOUGHNUT'     : icon = 'donut_small'; break;
                        case 'STACKEDCOLUMN': icon = 'stacked_bar_chart'; break;
                        default             : icon = 'incomplete_circle'; break;

                    }

                }

                let elemTile = genTile('', '', '', icon, report.name, description);
                    elemTile.appendTo(elemReports);
                    elemTile.attr('data-id', report.id);
                    elemTile.click(function() {
                        $(this).toggleClass('selected');
                    });

                if(startupReports.indexOf(report.name) > -1) elemTile.addClass('selected');

            }

        }

        if(elemReports.children('.selected').length === 0) {
            elemReports.children().each(function() {
                if($(this).index() < startupCount) $(this).addClass('selected');
            })
        }

        setReports();

    });

}


// Add selected reports to dashboard
function setReports() {

    $('.report').each(function() {
        
        let elemReport  = $(this);
        let reportId    = $(this).attr('data-id');
        let keep        = false;
        
        $('.report-definition.selected').each(function() {
            let definitionId = $(this).attr('data-id');
            if(reportId === definitionId) {
                keep = true;
            }
        });

        if(!keep) elemReport.remove();

    });

    let waitForReport = false;

    $('.tile.selected').each(function() {
        
        let definitionId   = $(this).attr('data-id');
        let visible        = false;
        
        $('.report').each(function() {
            let reportId = $(this).attr('data-id');
            if(definitionId === reportId) {
                visible = true;
            }
        });

        if(!visible) {
            waitForReport = true;
            insertReport(definitionId);
        }

    });

    if(!waitForReport) {
        $('#overlay').hide();
    }
    
    $('#add').click(function() {
        $('#overlay').show();
        $('.dialog').show();
    });

}
function insertReport(id) {

    let elemReports = $('#reports');

    let elemReport = $('<div></div>');
        elemReport.addClass('report');
        elemReport.attr('data-id', id);
        elemReport.appendTo(elemReports);

    $.get('/plm/report', { 'reportId' : id }, function(response) {

        let elemHead = $('<div></div>');
            elemHead.addClass('report-head');
            elemHead.appendTo(elemReport);
        
        let elemTitle = $('<div></div>');
            elemTitle.addClass('report-title');
            elemTitle.html(response.data.reportDefinition.name);
            elemTitle.appendTo(elemHead);
        
        let elemClose = $('<div></div>');
            elemClose.addClass('report-close');
            elemClose.addClass('icon');
            elemClose.addClass('icon-close');
            elemClose.appendTo(elemHead);        
            elemClose.click(function() {
                closeReport($(this).closest('.report'));
            });

        let elemSubtitle = $('<div></div>');
            elemSubtitle.addClass('report-subtitle');
            elemSubtitle.html(response.data.reportDefinition.description);
            elemSubtitle.appendTo(elemReport);



        if(response.data.reportDefinition.isChartReport) {
            insertChart('chart' + id, elemReport, response.data);
        } else { 
            insertTable(elemReport, response.data);
        }

        $('#overlay').fadeOut();

    });


}
function insertTable(elemReport, data) {

    elemReport.addClass('table');

    let wsId = data.reportDefinition.workspaceId;

    let elemTable = $('<table></table>');
        elemTable.addClass('hovering-enabled');
        elemTable.appendTo(elemReport);
    
    let elemTableHead = $('<thead></thead>');
        elemTableHead.appendTo(elemTable);
    
    let elemTableBody = $('<tbody></tbody>');
        elemTableBody.appendTo(elemTable);

    let elemTableHeader = $('<tr></tr>');
        elemTableHeader.appendTo(elemTableHead);

    for(column of data.reportResult.columnKey) {

        let elemHead = $('<th></th>');
            elemHead.html(column.label);
            elemHead.appendTo(elemTableHeader);

    }

    for(row of data.reportResult.row) {

        let elemRow = $('<tr></tr>');
            elemRow.appendTo(elemTableBody);
            elemRow.attr('data-dmsId', row.dmsId);
            elemRow.attr('data-wsId', wsId);
            elemRow.click(function() {
                openItemByID(elemRow.attr('data-wsId'), elemRow.attr('data-dmsId'));
            });

        for(column of data.reportResult.columnKey) {
        
            let value = '';
            let image = '';

            for(field of row.fields.entry) {
                if(field.key === column.value) {
                    value = field.fieldData.value;

                    if(field.fieldData.dataType === 'Image') image = field.fieldData.uri;

                    break;
                }
            }

            let elemCell = $('<td></td>');
                elemCell.appendTo(elemRow);

            if(image === '') {
                elemCell.html(value);
            } else {

                let elemImage = $('<img>');
                    elemImage.attr('src', image);
                    elemImage.appendTo(elemCell);

            } 
        
        }

    }

    elemTable.DataTable( {
        colReorder   : true,
        fixedHeader  : true,
        fixedColumns : true,
        info         : false,
        paging       : true
    });

}
function insertChart(idChart, elemReport, data) {

    elemReport.addClass('chart');

    if(typeof data.reportResult === 'undefined') {

        let elemMessage = $('<div></div>');
            elemMessage.addClass('no-data');
            elemMessage.html('No data available');
            elemMessage.appendTo(elemReport);

    } else {

        let elemParent = $('<div></div>');
            elemParent.addClass('wrapper');
            elemParent.appendTo(elemReport);

        let elemChart = $('<canvas></canvas>');
            elemChart.attr('id', idChart);
            elemChart.appendTo(elemParent);
    
        let type    = 'doughnut';
        let legend  = true;
    
        switch(data.reportDefinition.reportChart.type) {
    
            case 'COLUMN':
                type   = 'bar';
                legend = false;
                break;
    
            case 'LINE':
                type = 'line';
                legend = false;
                break;
    
            case 'PIE':
                type = 'pie';
                legend = true;
                break;
    
            case 'MSCOLUMN':
                type = 'pie';
                legend = true;
                break;
    
        }

        var ctx = document.getElementById(idChart).getContext('2d');

        let labels = [];
        let values = [];
        let styles = [];
        let index  = 0;

        for(row of data.reportResult.row) {

            let value = 0;

            if(row.fields.entry.length > 1) value = row.fields.entry[1].fieldData.value;

            labels.push(row.fields.entry[0].fieldData.value);
            values.push(value);
            styles.push(config.colors.list[index++]);

        }

        var myChart = new Chart(ctx, {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: config.colors.list,
                    borderWidth: 1
                }]
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                legend : {
                    display : legend,
                    position : 'right'
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

    }

}
function closeReport(elemReport) {

    let id = elemReport.attr('data-id');

    $('.tile.selected').each(function() {
        let definitionId   = $(this).attr('data-id');
        if(definitionId === id) $(this).removeClass('selected');
    });

    elemReport.remove();

}