$(document).ready(function() {   

    appendOverlay(false);
    setUIEvents();
    insertMenu();
    insertReportDefinitions('list', config.reports.startupReportNames);

});


function setUIEvents() {
    
    $('#add').click(function() {
        $('#overlay').show();
        $('.dialog').show();
    });

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


// Select additional reports if needed
function insertReportDefinitionsDone(elemReports, selectedReports) {

    if(elemReports.children('.selected').length === 0) {
        elemReports.children().each(function() {
            if($(this).index() < config.reports.startupReportCount) $(this).addClass('selected');
        })
    }

    setReports();

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
        
        let reportId  = $(this).attr('data-id');
        let visible   = false;
        
        $('.report').each(function() {
            let id = $(this).attr('data-id');
            if(reportId === id) {
                visible = true;
            }
        });

        if(!visible) {
            waitForReport = true;
            insertReport('reports', reportId);
        }

    });

    if(!waitForReport) {
        $('#overlay').hide();
    }


}


// Remove report from dashboard
function closeReport(elemReport) {

    let id = elemReport.attr('data-id');

    $('.tile.selected').each(function() {
        let definitionId   = $(this).attr('data-id');
        if(definitionId === id) $(this).removeClass('selected');
    });

    elemReport.remove();

}