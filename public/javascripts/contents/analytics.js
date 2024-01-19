let chartThemes = {
    'light' : {
        fontColor : '#444',
        axisColor : '#000',
        gridColor : '#eeeeee'
    },
    'dark' : {
        fontColor : '#eee',
        axisColor : '#fff',
        gridColor : '#3b4453'
    },
    'black' : {
        fontColor : '#eee',
        axisColor : '#fff',
        gridColor : '#474747'
    }
}


// Insert tiles to allow for selection of report definitions
function insertReportDefinitions(id, selectedReports) {

    if(isBlank(selectedReports)) selectedReports = [];

    $.get('/plm/reports', {}, function(response) {

        let elemReports = $('#' + id);
        let reports     = response.data.reportDefinitionList.list;

        elemReports.html('');

        $('#overlay').hide();

        sortArray(reports, 'name', 'string', 'ascending');

        for(report of reports) {

            if(report.hasOrphanFields) {

                console.log(' !!! Report has orphan fields / errors: ' + report.name);

            } else {

                let description = (typeof report.description === 'undefined') ? '&nbsp;' : report.description;
                let icon        = 'table';

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
                        clickReportDefinition($(this));
                    });

                if(selectedReports.indexOf(report.name) > -1) elemTile.addClass('selected');

            }

        }

        insertReportDefinitionsDone(elemReports, selectedReports);

    });
}
function insertReportDefinitionsDone(elemReports, selectedReports) {}
function clickReportDefinition(elemClicked) {}


// Insert panel to visualise report data
function insertReport(id, reportId) {

    let elemReport = $('<div></div>').appendTo($('#' + id))
        .addClass('report')
        .attr('data-id', reportId);

    $.get('/plm/report', { 'reportId' : reportId }, function(response) {

        let elemHead = $('<div></div>').appendTo(elemReport)
            .addClass('report-head');
        
        $('<div></div>').appendTo(elemHead)
            .addClass('report-title')
            .html(response.data.reportDefinition.name);
        
        $('<div></div>').appendTo(elemHead)
            .addClass('report-close')
            .addClass('icon')
            .addClass('icon-close')
            .click(function() {
                closeReport($(this).closest('.report'));
            });

        $('<div></div>').appendTo(elemReport)
            .addClass('report-subtitle')
            .html(response.data.reportDefinition.description);

        if(response.data.reportDefinition.isChartReport) {
            insertReportChart('chart-' + reportId, elemReport, response.data);
        } else { 
            insertReportTable(elemReport, response.data);
        }

        $('#overlay').fadeOut();

    });

}
function insertReportTable(elemReport, data) {

    elemReport.addClass('table');

    let wsId = data.reportDefinition.workspaceId;

    let elemTable = $('<table></table>').appendTo(elemReport)
        .addClass('hovering-enabled')
        .addClass('report-table')
        .appendTo(elemReport);
    
    let elemTableHead = $('<thead></thead>').appendTo(elemTable)
        .addClass('report-thead');

    let elemTableHeader = $('<tr></tr>').appendTo(elemTableHead)
        .addClass('report-thead-row');

    let elemTableBody = $('<tbody></tbody>').appendTo(elemTable)
        .addClass('report-tbody');

    for(column of data.reportResult.columnKey) {

        $('<th></th>').appendTo(elemTableHeader)
            .html(column.label);

    }

    for(row of data.reportResult.row) {

        let elemRow = $('<tr></tr>').appendTo(elemTableBody)
            .attr('data-dmsId', row.dmsId)
            .attr('data-wsId', wsId)
            .click(function() {
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
function insertReportChart(idChart, elemReport, data) {

    elemReport.addClass('chart');

    if(typeof data.reportResult === 'undefined') {

        $('<div></div>').appendTo(elemReport)
            .addClass('report-no-data')
            .html('No data available');

    } else {

        let elemParent = $('<div></div>').appendTo(elemReport)
            .addClass('wrapper');

        $('<canvas></canvas>').appendTo(elemParent)
            .attr('id', idChart);
    
        let type    = 'doughnut';
        let legend  = true;
        let axis    = false;
    
        switch(data.reportDefinition.reportChart.type) {
    
            case 'COLUMN':   type = 'bar';  legend = false; axis = true;  break;
            case 'LINE':     type = 'line'; legend = false; axis = true;  break;
            case 'PIE':      type = 'pie';  legend = true;  axis = false; break;
            case 'MSCOLUMN': type = 'pie';  legend = true;  axis = false; break;
    
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
            type : type,
            data : {
                labels  : labels,
                datasets: [{
                    data            : values,
                    backgroundColor : config.colors.list,
                    borderWidth     : 1
                }]
            },
            options: {
                maintainAspectRatio : false,
                responsive : true,
                plugins : {
                    legend : {
                        display  : legend,
                        labels   : {
                            color : chartThemes[theme].fontColor
                        },
                        position : 'right'
                    }
                },
                scales: {
                    x: {
                        border : {
                            display : axis,
                            width   : 2,
                            color   : chartThemes[theme].axisColor
                        },
                        display : axis,
                        grid : {
                            color : chartThemes[theme].gridColor
                        },
                        ticks : {
                            color : chartThemes[theme].fontColor
                        }
                    },
                    y: {
                        border : {
                            display : axis,
                            width   : 2,
                            color   : chartThemes[theme].axisColor
                        },
                        display : axis,
                        grid : {
                            color : chartThemes[theme].gridColor
                        },
                        ticks : {
                            color : chartThemes[theme].fontColor
                        }
                    }
                }
            }
        });



    }

}