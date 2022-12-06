let chartColors = [
    'rgb(64, 169, 221, 0.8)',
    'rgb(250, 177, 28, 0.8)',
    'rgb(119, 189, 13, 0.8)',
    'rgb(226, 88, 11, 0.8)',
    'rgb(114, 114, 114, 0.8)',
    'rgb(156, 115, 221, 0.8)',
    'rgb(206, 112, 87, 0.8)',
    'rgb(64, 169, 221, 0.4)',
    'rgb(250, 177, 28, 0.4)',
    'rgb(119, 189, 13, 0.4)',
    'rgb(226, 88, 11, 0.4)',
    'rgb(114, 114, 114, 0.4)',
    'rgb(156, 115, 221, 0.4)',
    'rgb(206, 112, 87, 0.4)'
];


$(document).ready(function() {   
    
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
        $('#overlay .progress').show();
        $('.dialog').hide();
    });

    $('.clear').click(function() {
        $('.tiles').children().removeClass('selected');
    });

}


// Retrieve list of reports in PLM
function getReports() {

    $.get('/plm/reports', { }, function(response) {

        let elemReports = $('#list');
        let index       = 0;
        let reports     = response.data.reportDefinitionList.list;

        reports.sort(function(a, b){
            var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase()
            if (nameA < nameB) 
                return -1 
            if (nameA > nameB)
                return 1
            return 0 
        });

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
                        case 'PIE'          : icon = 'pie_chart'; break;
                        case 'DOUGHNUT'     : icon = 'donut_small'; break;
                        case 'STACKEDCOLUMN': icon = 'stacked_bar_chart'; break;
                        default             : icon = 'pie_chart'; break;

                    }

                }

                let elemTile = genTile('', '', '', icon, report.name, description);
                    elemTile.appendTo(elemReports);
                    elemTile.attr('data-id', report.id);
                    elemTile.click(function() {
                        $(this).toggleClass('selected');
                    });

                if(index < 3) { elemTile.addClass('selected'); index++; }

            }

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
                //break;
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
                // break;
            }
        });

        if(!visible) {
            waitForReport = true;
            insertReport(definitionId);
        }

    });

    if(!waitForReport) {
        $('#overlay .progress').hide();
        $('#overlay').hide();
    }
    
    $('#add').click(function() {
        $('#overlay').show();
        $('.dialog').show();
    });

}
function insertReport(id) {

    let elemReports = $('#reports');

    $.get('/plm/report', { 'reportId' : id }, function(response) {

        let elemReport = $('<div></div>');
            elemReport.addClass('report');
            elemReport.attr('data-id', id);
            elemReport.appendTo(elemReports);

        let elemTitle = $('<div></div>');
            elemTitle.addClass('report-title');
            elemTitle.html(response.data.reportDefinition.name);
            elemTitle.appendTo(elemReport);

        let elemSubtitle = $('<div></div>');
            elemSubtitle.addClass('report-subtitle');
            elemSubtitle.html(response.data.reportDefinition.description);
            elemSubtitle.appendTo(elemReport);

        if(response.data.reportDefinition.isChartReport) {
            insertChart('chart' + id, elemReport, response.data);
        } else { 
            insertTable(elemReport, response.data);
        }

        $('#overlay .progress').fadeOut();
        $('#overlay').fadeOut();

    });


}
function insertTable(elemReport, data) {

    elemReport.addClass('table');

    let wsId = data.reportDefinition.workspaceId;

    let elemTable = $('<table></table>');
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
            elemRow.attr('data-dmsid', row.dmsId);
            elemRow.click(function() {
                window.open('https://' + tenant + '.autodeskplm360.net/plm/workspaces/' + wsId + '/items/itemDetails?view=full&tab=details&mode=view&itemId=urn%60adsk,plm%60tenant,workspace,item%60ADSKTSESVEND,' + wsId + ',' + elemRow.attr('data-dmsid'));
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
        colReorder: true,
        fixedHeader : true,
        fixedColumns : true,
        info : false,
        paging : false
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
        let colors = [];
        let index  = 0;

        for(row of data.reportResult.row) {

            let value = 0;

            if(row.fields.entry.length > 1) value = row.fields.entry[1].fieldData.value;

            labels.push(row.fields.entry[0].fieldData.value);
            values.push(value);
            colors.push(chartColors[index++]);

        }

        var myChart = new Chart(ctx, {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                        // backgroundColor: [
                        //     'rgba(255, 99, 132, 0.2)',
                        //     'rgba(54, 162, 235, 0.2)',
                        //     'rgba(255, 206, 86, 0.2)',
                        //     'rgba(75, 192, 192, 0.2)',
                        //     'rgba(153, 102, 255, 0.2)',
                        //     'rgba(255, 159, 64, 0.2)'
                        // ],
                        // borderColor: [
                        //     'rgba(255, 99, 132, 1)',
                        //     'rgba(54, 162, 235, 1)',
                        //     'rgba(255, 206, 86, 1)',
                        //     'rgba(75, 192, 192, 1)',
                        //     'rgba(153, 102, 255, 1)',
                        //     'rgba(255, 159, 64, 1)'
                        // ],
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