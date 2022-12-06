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
    
    getData();

});



// Retrieve information from PLM
function getData() {

    $.get('/plm/search-bulk', { 
        'wsId'   : wsId,
        'limit'  : 100,
        'offset' : 0,
        'query'  : '*'
    }, function(response) {

        response.data.items.sort(function(a, b){
            var nameA=a.title.toLowerCase(), nameB=b.title.toLowerCase()
            if (nameA < nameB) 
                return -1 
            if (nameA > nameB)
                return 1
            return 0 
        });


        let projectNames = [];
        for(project of response.data.items) {
            projectNames.push(project.title);
        }

        let chartHeight = 80 + (response.data.items.length * 24);

        $('.chart-graphic').css('height', chartHeight + 'px');

        setStatusTable(response.data.items);
        setKPIsTable(response.data.items);
        setGatesTimeline('gates', response.data.items, projectNames);
        setEfforts('efforts', response.data.items, projectNames);
        setDeviations('deviations', response.data.items, projectNames);
        // setBuffers('buffers', data.items, projectNames);

        $('.dashboard').children().show();
        $('#overlay').hide();

    });

}


// Set Project Status Report table
function setStatusTable(projects) {

    let elemTable = $('#table-status');

    for(project of projects) {

        let elemRow = $('<tr></tr>');
            elemRow.appendTo(elemTable);
            elemRow.attr('data-urn', project.urn);
            elemRow.click(function() {
                let urn = $(this).attr('data-urn');
                openItemByURN(urn);
            });

        let elemCellName = $('<td></td>');
            elemCellName.html(project.title);
            elemCellName.appendTo(elemRow);

        let elemCell1 = $('<td></td>');
            elemCell1.append(getProjectStatus(project, 'STATUS_REPORT_1'));
            elemCell1.appendTo(elemRow);
        
        let elemCell2 = $('<td></td>');
            elemCell2.append(getProjectStatus(project, 'STATUS_REPORT_2'));
            elemCell2.appendTo(elemRow);
        
        let elemCell3 = $('<td></td>');
            elemCell3.append(getProjectStatus(project, 'STATUS_REPORT_3'));
            elemCell3.appendTo(elemRow);
        
        let elemCell4 = $('<td></td>');
            elemCell4.append(getProjectStatus(project, 'STATUS_REPORT_4'));
            elemCell4.appendTo(elemRow);

    }

}
function getProjectStatus(data, fieldId) {

    let status = getProjectProperty(data, fieldId);
    let style = 'bg-gray';

    if(status.length > 0) status = status.substring(0, 1);

    switch (status) {

        case '1':
            style = 'bg-dark-green';
            break;

        case '2':
            style = 'bg-green';
            break;

        case '3':
            style = 'bg-orange';
            break;

        case '4':
            style = 'bg-red';
            break;

    }

    let elemStatus = $('<div></div>');
        elemStatus.addClass('project-status');
        elemStatus.addClass(style);
        elemStatus.html(status);

    return elemStatus;

}


// Set KPIs
function setKPIsTable(projects) {

    let elemTable = $('#table-kpis');

    for(project of projects) {

        let elemRow = $('<tr></tr>');
            elemRow.appendTo(elemTable);
            elemRow.attr('data-urn', project.urn);
            elemRow.click(function() {
                let urn = $(this).attr('data-urn');
                openItemByURN(urn);
            });

        let elemCellName = $('<td></td>');
            elemCellName.html(project.title);
            elemCellName.appendTo(elemRow);

        let elemCell1 = $('<td></td>');
            elemCell1.append(getProjectProperty(project, 'PROGRESS'));
            elemCell1.appendTo(elemRow);
        
        let elemCell2 = $('<td></td>');
            elemCell2.append(getProjectProperty(project, 'BUDGET_CONSUMPTION'));
            elemCell2.appendTo(elemRow);
        
        let elemCell3 = $('<td></td>');
            elemCell3.append(getProjectProperty(project, 'CURRENT_PHASE_PROGRESS'));
            elemCell3.appendTo(elemRow);
        
        // let elemCell4 = $('<td></td>');
        //     elemCell4.append(getProjectStatus(project, 'STATUS_REPORT_4'));
        //     elemCell4.appendTo(elemRow);

    }

}


// Set Gates Timeline Chart
function setGatesTimeline(id, projects, projectNames) {

    let elemChart = $('<canvas></canvas>');
        elemChart.attr('id', id + '-chart');
        elemChart.appendTo($('#' + id));

    let ctx = document.getElementById(id + '-chart').getContext('2d');

    let chart = new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: [{
                label : "G1",
                backgroundColor: chartColors[0],
                data: []
            },{
                label : "G2",
                backgroundColor: chartColors[1],
                data: []
            },{
                label : "G3",
                backgroundColor: chartColors[2],
                data: []
            },{
                label : "G4",
                backgroundColor: chartColors[3],
                data: []
            },{
                label : "G5",
                backgroundColor: chartColors[4],
                data: []
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins : {
                legend : {
                    display : true,
                    position : 'right'
                }
            },
            scales: {
                y:{
                    type: 'category',
                    labels : projectNames
                },
                x: {
                    type: 'time',
                    time: {
                        unit: 'week'
                    }
                }
            }
        }
    });

    for(project of projects) {

        for(let i = 1; i <= 5; i++) {

            let value = getProjectProperty(project, 'PLANNED_COMPLETION_GATE_' + i);

            if(value !== '') {

                let day = value.split('-');
                let eventDate = new Date(day[0], day[1]-1, day[2]); 

                chart.data.datasets[i-1].data.push({
                    x : eventDate.getTime(),
                    y : project.title,
                    r : 7
                });

            }

        }

    }

    chart.update();

}


// Set Project Efforts Chart
function setEfforts(id, projects, projectNames) {

    let elemChart = $('<canvas></canvas>');
        elemChart.attr('id', id + '-chart');
        elemChart.appendTo($('#' + id));

    let ctx = document.getElementById(id + '-chart').getContext('2d');

    let chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels : projectNames,
            datasets: [{
                label : "Phase Specification",
                backgroundColor: chartColors[0],
                data: [],
            },{
                label : "Phase Concept",
                backgroundColor: chartColors[1],
                data: []
            },{
                label : "Phase Development",
                backgroundColor: chartColors[2],
                data: []
            },{
                label : "Phase Validation",
                backgroundColor: chartColors[3],
                data: []
            },{
                label : "Phase Production",
                backgroundColor: chartColors[4],
                data: []
            }]
        },
        options: {
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins : {
                legend : {
                    display : true,
                    position : 'right'
                },
            },
            scales: {
                y: {
                    stacked: true
                },
                x: {
                    stacked: true
                }
            }
        }
    });

    for(project of projects) {

        for(let i = 1; i <= 5; i++) {

            let value = getProjectProperty(project, 'PLANNED_EFFORT_PHASE_' + i, 0);

            if(value !== '') {
                chart.data.datasets[i-1].data.push(value);
            }

        }

    }

    chart.update();

}


// Set Buffer Consumption
function setBuffers(id, projects, projectNames) {

    let elemChart = $('<canvas></canvas>');
        elemChart.attr('id', id + '-chart');
        elemChart.appendTo($('#' + id));

    let ctx = document.getElementById(id + '-chart').getContext('2d');

    let chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [

                {
                    label : 'okay',
                    type : 'line',
                    borderColor : '#8e5ea2',
                    data : [10, 80, 50, 50],
                    fill : false
                },
                {
                    label : 'nokay',
                    type : 'line',
                    borderColor : '#8e5ea2',
                    data : [10, 80, 100, 100],
                    fill : false
                }

                // {
                //     label : ['a'],
                //     backgroundColor: "rgba(255,221,50,0.2)",
                //     borderColor: "rgba(255,221,50,1)",
                //     data: [{
                //     x : 100,
                //     y : 50,
                //     r : 10
                //     }]
                // },
                // {
                //     label : ['b'],
                //     backgroundColor: "rgba(255,221,50,0.2)",
                //     borderColor: "rgba(255,221,50,1)",
                //     data: [{
                //     x : 50,
                //     y : 20,
                //     r : 10
                //     }]
                // },
                // {
                //     label : ['c'],
                //     backgroundColor: "rgba(255,221,50,0.2)",
                //     borderColor: "rgba(255,221,50,1)",
                //     data: [{
                //     x : 10,
                //     y : 5,
                //     r : 10
                //     }]
                // }



            ]
        },
        options: {
            maintainAspectRatio: false,
            plugins : {
                legend : {
                    display : false
                }
            },
            scales: {
                y: { 
                    scaleLabel: {
                      display: true,
                      labelString: "Buffers"
                    }
                },
                x: { 
                    scaleLabel: {
                      display: true,
                      labelString: "Progress"
                    }
                }
            }
        }
    });

    for(project of projects) {

        let base        = 0;
        let progress    = getProjectProperty(project, 'CURRENT_PHASE_PERCENT_COMPLETE', 0);
        let totalBuffer = getTotalBuffer(project);
        let remBuffer   = getRemainingBuffer(project);
        let conBuffer   = totalBuffer - remBuffer;

        switch(project.currentState.title) {

            case 'Planning':
            case 'Project Approval':
            case 'Specification':
            case 'G1':
                base = 0;
                break;

            case 'Concept':
            case 'G2':
                base = 100;
                break;

            case 'Development':
            case 'G3':
                base = 200;
                break;

            case 'Validation':
            case 'G4':
                base = 300;
                break;

            case 'Production':
            case 'G5':
                base = 400;
                break;

        }

        let yValue = conBuffer * 100 / totalBuffer;

        let dataset = {
            label : project.title,
            backgroundColor: '#ffa600',
            // borderColor: "rgba(255,221,50,1)",
            data : [{
                x : base + Number(progress),
                y : yValue,
                r : 10,
                label : project.title
            }]
        }

        chart.data.datasets.push(dataset);

    }

    chart.update();

}
function getTotalBuffer(project) {

    let result = 0;

    for(let i = 0; i <= 5; i++) {

        result += getProjectProperty(project, 'DURATION_REVIEW_' + i, 0);

    }

    return result;

}
function getRemainingBuffer(project) {

    let result = 0;

    for(let i = 1; i <= 5; i++) {

        let planPhase   = getProjectProperty(project, 'PLANNED_COMPLETION_PHASE_' + i, null);
        let expPhase    = getProjectProperty(project, 'EXPECTED_COMPLETION_PHASE_' + i, null);
        let planGate    = getProjectProperty(project, 'PLANNED_COMPLETION_GATE_' + i, null);
        let expGate     = getProjectProperty(project, 'EXPECTED_COMPLETION_GATE_' + i, null);

        if(expPhase !== '') planPhase = expPhase;
        if(expGate !== '') planGate = expGate;

        let dayPhase = planPhase.split('-');
        let datePhase = new Date(dayPhase[0], dayPhase[1]-1, dayPhase[2]); 

        let dayGate = planGate.split('-');
        let dateGate = new Date(dayGate[0], dayGate[1]-1, dayGate[2]); 

        do {
            datePhase.setDate(datePhase.getDate() + 1);
            if(datePhase.getDay() > 0) {
                if(datePhase.getDay() < 6) {
                    result++;
                }
            }
        } while(dateGate.getTime() > datePhase.getTime());


        // result += getProjectProperty(project, 'DURATION_REVIEW_' + i, 0);

    }

    return result;


}


// Timeline to display project completioin deviation
function setDeviations(id, projects, projectNames) {

    let elemChart = $('<canvas></canvas>');
        elemChart.attr('id', id + '-chart');
        elemChart.appendTo($('#' + id));

    let ctx = document.getElementById(id + '-chart').getContext('2d');

    let chart = new Chart(ctx, {
        // type: 'bar',
        type: 'bar',
        data: {
            labels : projectNames,
            datasets: [
                    {
                    // label : "1",
                    backgroundColor: '#ffa600',
                    // borderColor:'rgba(238, 136, 34, 1)',
                    data : [
                        // [10, 30], [4, 20], [10, 20], [10, 30], [4, 20], [10, 20], [10, 30], [4, 20], [10, 20]
                        // [1623621600000, 1723641600000]
                    ]
                //     data: [[10, 30], [4, 20], [10, 20]],
                // // },{
                // //     label : "2",
                // //     backgroundColor: "rgba(238, 136, 34, 0.2)",
                // //     borderColor:'rgba(238, 136, 34, 1)',
                // //     data: [[5, 10]]
                // // },{
                // //     label : "3",
                // //     backgroundColor: "rgba(180, 136, 34, 0.2)",
                // //     borderColor:'rgba(238, 136, 34, 1)',
                // //     data: [[10, 10]]
                }
            ]
            },
            options: {
                // responsive: true,
                maintainAspectRatio: false,
                indexAxis : 'y',
                plugins : {
                    legend : {
                        display : false
                    }
                },
                scales: {
                    y:{
                    },
                    x: {
                        min : 1623621600000,
                        type: 'time',
                        time: {
                            unit: 'week'
                        }
                    }
                }
            }
        });

let index = 1;

    for(project of projects) {

        // for(let i = 1; i <= 5; i++) {
    
        let plan = getProjectProperty(project, 'PLANNED_COMPLETION_GATE_5');
        let exp = getProjectProperty(project, 'EXPECTED_COMPLETION_GATE_5');
    
        if(exp === '') exp = plan;

        let dayPlan = plan.split('-');
        let datePlan = new Date(dayPlan[0], dayPlan[1]-1, dayPlan[2]); 

        let dayExp = exp.split('-');
        let dateExp = new Date(dayExp[0], dayExp[1]-1, dayExp[2]);

                // if(value !== '') {
                //     chart.data.datasets[i-1].data.push(value);
                // }
    
            // }


        // chart.data.datasets[0].data.push([{
        //     x : datePlan.getTime()}, {
        //     x : dateExp.getTime()
        
        // }]


        chart.data.datasets[0].data.push(
            

            // {
            //     x: {
            //         min : datePlan.getTime(),
            //         max : dateExp.getTime()
            //     }
            // }

            // [{
            //     x: datePlan.getTime()
            // },{
            //     x: dateExp.getTime()
            // }]
            
             [datePlan.getTime(), dateExp.getTime()]



            // {
            //     // y : project.title,
            //     y : 5,
            // x: [datePlan.getTime(), dateExp.getTime()]
            // }


            // y : project.title,
            // x :[

                // dayPlan[0] + '-' + (dayPlan[1]-1) + '-' + dayPlan[2],
                // dayExp[0] + '-' + (dayExp[1]-1) + '-' + dayExp[2]

            // x : datePlan.getTime(),
            // y : dateExp.getTime()
        
            // ]
        // }


            // [ datePlan.getTime(), dateExp.getTime() ]
        //     {
        //     label : project.title,
        //     data : [ datePlan.getTime(), dateExp.getTime() ]
        // })
        );
    
    }
    
    chart.update();  

}


// Retrieve project field data by browsing sections data
function getProjectProperty(data, fieldId, empty) {

    for(section of data.sections) {
        for(field of section.fields) {

            let urn = field.urn.split('.');

            if(fieldId === urn[urn.length -1]) {

                if(field.value === null) return '';
                if(typeof field.value === 'object') return field.value.title;

                return field.value;
            }

        }
    }

    if(typeof empty !== 'undefined') return empty;

    return '';

}