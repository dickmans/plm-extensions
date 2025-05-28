let progressUsers       = 0;
let progressWorkspaces  = 0;
let progressLogs        = 0;

let offsetUsers             = 0;
let totalUsers              = 10;
let offsetWorkspaces        = 0;
let offsetSystemLog         = 0;
let totalSystemLog          = -1;
let daysCount               = 0;
let parallelRequestsLog     = 5;
let parallelRequestsCount   = 5;
let logLimit                = 100;
let countEventLogEntries    = 0;
let counterLastLogins = {
    today   : 0,
    week    : 0,
    month   : 0,
    year    : 0,
    days7   : 0,
    days30  : 0,
    days60  : 0,
    days180 : 0,
    days365 : 0
}

let chartUserStatus, chartUserDomain, chartWorkspaceCount, chartTimelineUsers, chartTimelineLastLogins, chartWorkspaceActivities, chartTimelineLogins, chartTimelineEdits, chartTimelineCreation;


// Store data
let users               = [];
let logins              = [];
let loginDates          = [];
let lastLogins          = [];
let workspaces          = [];
let editDates           = [];
let editWorkspaces      = [];
let usersExcluded       = [];
let workspacesExcluded  = [];

let colors = [
    'rgb( 64, 169, 221, 0.8)',
    'rgb(250, 177,  28, 0.8)',
    'rgb(119, 189,  13, 0.8)',
    'rgb(226,  88,  11, 0.8)',
    'rgb(114, 114, 114, 0.8)',
    'rgb(156, 115, 221, 0.8)',
    'rgb(206, 112,  87, 0.8)',
    'rgb( 64, 169, 221, 0.4)',
    'rgb(250, 177,  28, 0.4)',
    'rgb(119, 189,  13, 0.4)',
    'rgb(226,  88,  11, 0.4)',
    'rgb(114, 114, 114, 0.4)',
    'rgb(156, 115, 221, 0.4)',
    'rgb(206, 112,  87, 0.4)'
];

let colorsT = [
    'rgb(64, 169, 221, 0.2)',
    'rgb(250, 177, 28, 0.2)',
    'rgb(119, 189, 13, 0.2)',
    'rgb(226, 88, 11, 0.2)',
    'rgb(114, 114, 114, 0.2)',
    'rgb(156, 115, 221, 0.2)',
    'rgb(206, 112, 87, 0.2)',
    'rgb(64, 169, 221, 0.2)',
    'rgb(250, 177, 28, 0.2)',
    'rgb(119, 189, 13, 0.2)',
    'rgb(226, 88, 11, 0.2)',
    'rgb(114, 114, 114, 0.2)',
    'rgb(156, 115, 221, 0.2)',
    'rgb(206, 112, 87, 0.2)'
];


$(document).ready(function() {   

    appendOverlay(true);
    
    $('#header-subtitle').html(tenant.toUpperCase());

    setOptions();
    insertMenu();

    validateAdminAccess(function(isAdmin) {
        if(!isAdmin) {
            showErrorMessage('Additional Permission Required', 'Access to System Log and user account information requires assignment to group Administration [SYSTEM]');
        } else {
            initCharts();
            setUIEvents();
            getUserData();
        }
    });

});


// Copy settings to options dialog
function setOptions() {

    if(config.insights.maxEventLogEntries < 1) {
        $('#tab-event-log').remove();
    } else {
        $('#select-user').children().first().html('- All Entries (' + config.insights.maxEventLogEntries + ' max) - ');
    }

    $('#maxLogEntries').html(config.insights.maxLogEntries);
    $('#maxEventLogEntries').html(config.insights.maxEventLogEntries);

    for(let userExcluded of config.insights.usersExcluded) {
        $('#usersExcluded').append('<div>' + userExcluded + '</div>');
        usersExcluded.push(userExcluded.toUpperCase());
    }

    for(let workspaceExcluded of config.insights.workspacesExcluded) {
        $('#workspacesExcluded').append('<div>' + workspaceExcluded + '</div>');
        workspacesExcluded.push(workspaceExcluded.toUpperCase());
    }

}



// Verify access to System Logs
function validateAdminAccess(callback) {

    let isAdmin = false;

    $.get('/plm/me', {}, function(response) {

        for(let group of response.data.groups) {
            if(group.shortName === 'Administration [SYSTEM]') isAdmin = true;      
        }

        callback(isAdmin);

    });

}


// Set defaults for chart.js & init user interactions
function initCharts() {

    Chart.defaults.borderColor       = chartThemes[theme].axisColor;
    Chart.defaults.color             = chartThemes[theme].fontColor;
    Chart.defaults.scale.grid.color  = chartThemes[theme].gridColor;
    
    chartUserStatus = new Chart($('#status'), {
        type : 'doughnut',
        data : {
            labels : ['Active', 'Inactive', 'Deleted'],
            datasets: [{
                data            : [0,0,0],
                backgroundColor : [ config.colors.green, config.colors.yellow, config.colors.red ],
                borderWidth     : 0
            }]
        },
        options : {
            plugins : {
                legend : {
                    display  : true,
                    position : 'bottom'
                }
            },
            maintainAspectRatio : false,
            responsive          : true
        }
    });
    
    chartUserDomain = new Chart($('#domains'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor : config.colors.blue
            }]
        },
        options: {
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins : {
                legend : {
                    display  : false
                }
            },
            responsive: true
        }
    });
    
    chartTimelineLastLogins = new Chart($('#timelineLastLogins'), {
        type : 'bar',
        data : {
            datasets : [{
                label           : 'Days since last login',
                backgroundColor : config.colors.blue,
                minBarLength    : 1,
                data            : []
            }]
        },
        options : {
            animation : {
                duration : 0
            },
            maintainAspectRatio : false,
            indexAxis           : 'y',
            legend : {
                display : false
            },
            scales : {
                y : {                   
                    type    : 'category',
                    labels  : []
                }
            },
            plugins : {
                legend : {
                    display : false
                },
                zoom : {
                    pan : {
                        enabled : true,
                        mode : 'y'
                    },
                    zoom : {
                        wheel : {
                            enabled : true,
                            modifierKey : 'ctrl'
                        },
                        mode : 'y'
                    }
                }
            }
        }
    });

    chartTimelineLogins = new Chart($('#timelineLogins'), {
        type : 'bar',
        data : {
            datasets : [{
                label           : 'Logins',
                data            : [],
                backgroundColor : '#ef9b12',
                lineTension     : 0
            },{
                label           : 'Users not logging in',
                data            : [],
                backgroundColor : '#f7cc93',
                lineTension     : 0
            }]
        },
        options : {
            animation : {
                duration : 0
            },
            maintainAspectRatio : false,
            scales : {
                x : {
                    stacked : true,
                    type    : 'time',
                    time    : {
                        unit: 'day'
                    }
                }, 
                y : {
                    stacked : true,
                    ticks   : {
                        beginAtZero : true
                    }
                }
            },
            plugins : {
                legend : {
                    display : true,
                    position : 'bottom'
                },
                zoom : {
                    pan : {
                        enabled : true,
                        mode : 'x'
                    },
                    zoom : {
                        wheel : {
                            enabled : true,
                            modifierKey : 'ctrl'
                        },
                        mode : 'x'
                    }
                }
            }
        }
    });

    chartTimelineUsers = new Chart($('#timelineUsers'), {
        type: 'bubble',
        data: {
            datasets: [{
                label           : 'Login',
                backgroundColor : 'rgba(238, 136, 34, 0.2)',
                borderColor     : 'rgba(238, 136, 34, 1)',
                data            : []
            },{
                label           : 'Create',
                backgroundColor : 'rgba(50, 188, 173, 0.2)',
                borderColor     : 'rgba(50, 188, 173, 1)',
                data            : []
            },{
                label           : 'Edit',
                backgroundColor : 'rgba(24, 88, 168, 0.2)',
                borderColor     : 'rgba(24, 88, 168, 1)',
                data            : []   
            },{
                label           : 'Workflow Action',
                backgroundColor : 'rgba(135, 188, 64, 0.2)',
                borderColor     : 'rgba(135, 188, 64, 1)',
                data            : []    
            },{
                label           : 'Milestones',
                backgroundColor : 'rgba(221, 34, 34, 0.2)',
                borderColor     : 'rgba(221, 34, 34, 1)',
            },{
                label           : 'Attachments',
                backgroundColor : 'rgba(167, 0, 99, 0.2)',
                borderColor     : 'rgba(167, 0, 99, 1)',
                data            : []
            }]
        },
        options : {
            animation : {
                duration : 0
            },
            maintainAspectRatio: false,
            responsive : true, 
            clip : 0,
            scales : {  
                x : {
                    type : 'time',
                    time: {
                        unit : 'day'
                    }
                },
                y : {
                    type   : 'category',
                    labels : []
                }
            },
            plugins : {
                legend : {
                    display : true,
                    position : 'bottom'
                },
                zoom : {
                    pan : {
                        enabled : true,
                        mode : 'xy'
                    },
                    zoom : {
                        wheel : {
                            enabled : true,
                            modifierKey : 'ctrl'
                        },
                        mode : 'xy'
                    }
                }
            }            
        }
    });
    
    chartWorkspaceActivities = new Chart($('#workspaceActivities'), {
        type: 'bar',
        data: {
            labels : [],
            datasets: [
                { label : 'Create'      , data : [], backgroundColor: 'rgba(50,  188, 173, 0.6)' },
                { label : 'Edit'        , data : [], backgroundColor: 'rgba(24,   88, 168, 0.6)' },
                { label : 'Workflow'    , data : [], backgroundColor: 'rgba(135, 188,  64, 0.6)' },
                { label : 'Milestones'  , data : [], backgroundColor: 'rgba(221,  34,  34, 0.6)' },
                { label : 'Attachments' , data : [], backgroundColor: 'rgba(167,   0,  99, 0.6)' },
            ]
        },
        options: {
            animation : {
                duration : 0
            },
            maintainAspectRatio : false,
            responsive : true,
            scales: {
                x : {
                    stacked : true 
                },
                y: {
                    stacked : true,
                    ticks: {
                        beginAtZero: true
                    }
                }
            },
            plugins : {
                legend : {
                    display : true,
                    position : 'bottom'
                },
                zoom : {
                    pan : {
                        enabled : true,
                        mode : 'x'
                    },
                    zoom : {
                        wheel : {
                            enabled : true,
                            modifierKey : 'ctrl'
                        },
                        mode : 'x'
                    }
                }
            }
        }
    }); 

    chartWorkspaceCount = new Chart($('#workspaces'), {
        type : 'bar',
        data : {
            labels : [],
            datasets : [{
                backgroundColor : '#6a9728',
                label : 'Workspace Item Count',
                data  : []
            }]
        },
        options : {
            animation : {
                duration : 0
            },
            maintainAspectRatio : false,
            indexAxis           : 'y',
            responsive          : true,
            scales : {
                y : {
                    ticks : {
                        beginAtZero : true
                    }
                }
            },
            plugins : {
                legend : {
                    display  : false
                },
                zoom : {
                    limits: {
                        y: {min: 0}
                    },
                    pan : {
                        enabled : true,
                        mode : 'y'
                    },
                    zoom : {
                        wheel : {
                            enabled : true,
                            modifierKey : 'ctrl'
                        },
                        mode : 'y'
                    }
                }
            }
        }
    });
    
    chartTimelineCreation = new Chart($('#timelineCreation'), {
        type : 'line',
        data : {
            datasets : []
        },
        options : {
            animation : {
                duration : 0
            },
            maintainAspectRatio : false,
            scales : {
                x : {
                    type : 'time',
                    time : {
                        unit : 'day'
                    }
                },
                y : {
                    ticks : {
                        beginAtZero : true
                    }
                }
            },
            plugins : {
                legend : {
                    display : true,
                    position : 'right'
                },
                zoom : {
                    pan : {
                        enabled : true,
                        mode : 'xy'
                    },
                    zoom : {
                        wheel : {
                            enabled : true,
                            modifierKey : 'ctrl'
                        },
                        mode : 'xy'
                    }
                }
            }        
        }
    });
    
    chartTimelineEdits = new Chart($('#timelineEdits'), {
        type : 'bar',
        data : {
            labels   : [],
            datasets : [],
        },
        options : {
            animation : {
                duration : 0
            },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    stacked : true,
                    ticks: {
                        beginAtZero: true,
                    }
                },
                x: {
                    stacked : true,
                    type: 'time'
                    ,
                    time: {
                        unit: 'day'
                    }
                }
            },
            plugins : {
                legend : {
                    display : true,
                    position : 'right'
                },
                zoom : {
                    pan : {
                        enabled : true,
                        mode : 'x'
                    },
                    zoom : {
                        wheel : {
                            enabled : true,
                            modifierKey : 'ctrl'
                        },
                        mode : 'x'
                    }
                }
            }        
        }
    });

    $('#resetTimelineLastLogins').click(function() { chartTimelineLastLogins.resetZoom(); })
    $('#resetTimelineLogins').click(function() { chartTimelineLogins.resetZoom(); })
    $('#resetTimelineUsers').click(function() { chartTimelineUsers.resetZoom(); })
    $('#resetWorkspaceActivities').click(function() { chartWorkspaceActivities.resetZoom(); })
    $('#resetWorkspaceCount').click(function() { chartWorkspaceCount.resetZoom(); })
    $('#resetTimelineCreation').click(function() { chartTimelineCreation.resetZoom(); })
    $('#resetTimelineEdits').click(function() { chartTimelineEdits.resetZoom(); })
    
}
function setUIEvents() {
    

    // Control for options review
    $('#options').click(function() {
        $('#overlay').show();
        $('#options-dialog').show();
    });
    $('#options-close').click(function() {
        $('#options-dialog').hide();
        $('#overlay').hide();
    });


    // User Interactions in Last Login panel
    $('#sortTimelineLastLogin').click(function() {
        $(this).toggleClass('default').toggleClass('icon-toggle-on').toggleClass('icon-toggle-off');
        updateLastLoginChart();
    });
    $('#timelineLastLoginsCounters').children().click(function() {
        $(this).toggleClass('selected');
        $(this).siblings().removeClass('selected');
        updateLastLoginChart();
    });

    // Filter Event Log for selected user
    $('#select-user').on('change', function() {
        
        let valueSelected = this.value;

        if(valueSelected === '*') {

            $('tr.user').removeClass('hidden');

        } else {

            $('#events').find('tr.user').each(function() {
                let name = $(this).children().first().html();
                if(name === valueSelected) {
                    $(this).removeClass('hidden');
                } else {
                    $(this).addClass('hidden');
                }
            });

        }
        
    })

    $('#timelineLastLoginsFilter').on('change', function() {
        
        let valueSelected = this.value;

        // console.log(valueSelected);

        // if(valueSelected === '*') {

        //     $('tr.user').removeClass('hidden');

        // } else {

        //     $('#events').find('tr.user').each(function() {
        //         let name = $(this).children().first().html();
        //         if(name === valueSelected) {
        //             $(this).removeClass('hidden');
        //         } else {
        //             $(this).addClass('hidden');
        //         }
        //     });

        // }
        
    })
    
}


// Init charts for users and retrieve data in multiple chunks. Once done, proceed with setWorkspacesCharts
function getUserData() {
    
    if(offsetUsers < totalUsers) {
        getUserDataChunk(function() {
            getUserData(); 
        });
    } else {
        setLastLoginsChart();
        setWorkspacesCharts();
    }
    
}
function getUserDataChunk(callback) {    
    
    $.get('/plm/users', { 'offset' : offsetUsers }, function(response) {

        totalUsers   = response.data.totalCount;
        offsetUsers += response.data.items.length;
        
        for(let user of response.data.items) {

            if(isBlank(user.displayName)) user.displayName = user.email;

            let displayName = user.displayName;
            let status      = user.userStatus;
            let email       = user.email;
            let domain      = email.split('@')[1];

            if(notExcluded(displayName)) {
            
                // users by domain
                if(status === 'Active') {

                    let isNew = true;

                    for(let i = 0; i < chartUserDomain.data.labels.length; i++) {
                        if(chartUserDomain.data.labels[i] === domain) {
                            isNew = false;
                            chartUserDomain.data.datasets[0].data[i]++;
                            break;
                        }
                    }

                    if(isNew) {
                        chartUserDomain.data.labels.push(domain);
                        chartUserDomain.data.datasets[0].data.push(1);
                    }

                    $('#select-user').append('<option value="' + displayName + '">' + displayName + '</option>');

                    users.push({
                        userId        : user.userId,
                        displayName   : user.displayName,
                        urn           : user.urn,
                        lastLogin     : user.lastLoginTime
                    });

                    if(!isBlank(user.lastLoginTime)) {
                        lastLogins.push({
                            displayName     : user.displayName,
                            lastLoginTime   : user.lastLoginTime,
                            filter          : [false, false, false, false, false, false, false, false, false]
                        });
                    }

                    $('#summary-active').html(users.length);

                }

                // get users by status
                switch(status) {

                    case 'Active':
                        chartUserStatus.data.datasets[0].data[0]++; 
                        break;   

                    case 'Inactive':
                        chartUserStatus.data.datasets[0].data[1]++; 
                        break;    

                    case 'Deleted':
                        chartUserStatus.data.datasets[0].data[2]++; 
                        break;

                }
                
            }   
            
        }
        
        chartUserDomain.update();
        chartUserStatus.update();
        
        $('#users-count').html(users.length);
        
        progressUsers = Math.round((offsetUsers * 100 / totalUsers), 0);

        updateProgress();
        callback();
        
    });
    
}
function notExcluded(userName) {
    
    if(userName === 'Tenant Admin') return false;

    userName = userName.toUpperCase();
    
    for(let userExcluded of config.insights.usersExcluded) {
        userExcluded = userExcluded.toUpperCase();
        if(userExcluded === userName) return false;
    }
    
    return true;
    
}
function setLastLoginsChart() {
    
    sortArray(lastLogins, 'lastLoginTime', 'string', 'ascending');

    let now         = new Date();
    let startWeek   = now.getDay();
    let startMonth  = now.getDate();
    let startYear   = new Date(1900 + now.getYear(),0,0,0,0,0);

    startYear.setDate(startYear.getDate() + 1);

    let diffYear = (now - startYear) / 86400000;
    
    for(let lastLogin of lastLogins) {

        let diff = addLastLogin(lastLogin);

        if(diff <           1) { lastLogin.filter[0] = true; counterLastLogins.today++;   }
        if(diff <=  startWeek) { lastLogin.filter[1] = true; counterLastLogins.week++;    }
        if(diff <= startMonth) { lastLogin.filter[2] = true; counterLastLogins.month++;   }
        if(diff <    diffYear) { lastLogin.filter[3] = true; counterLastLogins.year++;    }
        if(diff <=          7) { lastLogin.filter[4] = true; counterLastLogins.days7++;   }
        if(diff <=         30) { lastLogin.filter[5] = true; counterLastLogins.days30++;  }
        if(diff <=         60) { lastLogin.filter[6] = true; counterLastLogins.days60++;  }
        if(diff <=        180) { lastLogin.filter[7] = true; counterLastLogins.days180++; }
        if(diff <=        365) { lastLogin.filter[8] = true; counterLastLogins.days365++; }

        lastLogin.diff = diff;

    }

    $('#logins-today'  ).html(counterLastLogins.today);
    $('#logins-week'   ).html(counterLastLogins.week);
    $('#logins-month'  ).html(counterLastLogins.month);
    $('#logins-year'   ).html(counterLastLogins.year);
    $('#logins-days7'  ).html(counterLastLogins.days7);
    $('#logins-days30' ).html(counterLastLogins.days30);
    $('#logins-days60' ).html(counterLastLogins.days60);
    $('#logins-days180').html(counterLastLogins.days180);
    $('#logins-days365').html(counterLastLogins.days365);

    updateLastLoginChart();
    
}
function addLastLogin(user) {
    
    let lastLogin   = user.lastLoginTime;
    let now         = new Date();
    let login       = new Date(lastLogin.split('T')[0]);
    
    login.setHours(0,0,0,0);
      now.setHours(0,0,0,0);
    
    let diff = (now.getTime() - login.getTime()) / 86400000;
        diff = Math.round(diff, 0);
    
    return diff;
    
}
function updateLastLoginChart() {

    let sortKey  = $('#sortTimelineLastLogin').hasClass('default') ? 'displayName' : 'lastLoginTime';
    let selected = $('#timelineLastLoginsCounters').children('.selected');
    let filter   = (selected.length === 0) ? null : selected.index();

    sortArray(lastLogins, sortKey, 'string', 'ascending');

    chartTimelineLastLogins.options.scales.y.labels = [];
    chartTimelineLastLogins.data.datasets[0].data   = [];

    for(let lastLogin of lastLogins) {
        if((isBlank(filter)) || lastLogin.filter[filter]) {
            chartTimelineLastLogins.options.scales.y.labels.push(lastLogin.displayName);
            chartTimelineLastLogins.data.datasets[0].data.push(lastLogin.diff);
        }
    }

    chartTimelineLastLogins.update();
    chartTimelineLastLogins.resetZoom();

}



// Init charts for workspaces: Once done, proceed with setTimelineCharts
function setWorkspacesCharts() {
    
    $.get('/plm/workspaces', { 
        offset : 0,
        limit  : 500
    }, function(response) {

        $('#workspaces-count').html(response.data.totalCount);

        let iWorkspace = 0;
        
        for(let workspace of response.data.items) {
            
            let name = workspace.title.toUpperCase();
            let temp = workspace.urn.split('.');
            
            if(!workspacesExcluded.includes(name)) {
                workspaces.push({
                    label   : workspace.title,
                    id      : temp[temp.length - 1],
                    color   : colors[iWorkspace%colors.length],
                    colorT  : colorsT[iWorkspace%colorsT.length],
                    items   : 0
                });
                iWorkspace++;
            }

        }
        
        workspaces.sort(function(a, b){
            var nameA=a.label.toLowerCase(), nameB=b.label.toLowerCase()
            if (nameA < nameB) //sort string ascending
                return -1 
            if (nameA > nameB)
                return 1
            return 0 //default return value (no sorting)
        });
        
        for(let workspace of workspaces) {

            chartWorkspaceActivities.data.datasets[0].data.push(0);
            chartWorkspaceActivities.data.datasets[1].data.push(0);
            chartWorkspaceActivities.data.datasets[2].data.push(0);
            chartWorkspaceActivities.data.datasets[3].data.push(0);
            chartWorkspaceActivities.data.datasets[4].data.push(0);

            chartWorkspaceActivities.data.labels.push(workspace.label);

        }
        
        setTimelineCharts();
        getWorkspaceCounts();
        
    });
    
} 
function getWorkspaceCounts() {
    
    if(offsetWorkspaces < workspaces.length) {
        
        let requests  = [];
        
        for(let i = 0; i < parallelRequestsCount; i++) {
            if((offsetWorkspaces + i) < workspaces.length) {
                requests.push(getWorkspaceCount(offsetWorkspaces + i));
            }
        }
        
        Promise.all(requests).then(function(responses) {

            offsetWorkspaces += parallelRequestsCount;
            progressWorkspaces = Math.round(((offsetWorkspaces + 1) * 100 / workspaces.length), 0);
            updateProgress();
            getWorkspaceCounts();
            
        });
        
    } else {

        sortArray(workspaces, 'items', 'integer', 'descending');

        for(let workspace of workspaces) {
            chartWorkspaceCount.data.labels.push(workspace.label);
            chartWorkspaceCount.data.datasets[0].data.push(workspace.items);
        }

        chartWorkspaceCount.update();

    }
    
}
function getWorkspaceCount(index) {
    
    return new Promise(function(resolve, reject) {
        $.get('/plm/workspace-counter', { 'wsId' : workspaces[index].id, 'index' : index }, function(response) {
            workspaces[index].items = (response.data === '') ? 0 : response.data.totalCount;
            return resolve(response.data.totalCount);
        });
    });

} 


// Init timeline charts
function setTimelineCharts() {
    
    chartTimelineUsers.options.scales.y.labels.push(' ');
    for(let user of users) {
        let userName = user.displayName;
        if(userName !== ' ') chartTimelineUsers.options.scales.y.labels.push(userName);
    }
    chartTimelineUsers.options.scales.y.labels.push(' ');
    chartTimelineUsers.update();

    getSystemLogs();
    
}
function getSystemLogs() {
    
    if(totalSystemLog < 0) {

        $.get('/plm/system-logs', { 
            offset : 0,
            limit  : 1
        }, function(response) {
        
            totalSystemLog = response.data.totalCount;

            if(totalSystemLog > config.insights.maxLogEntries) {
                totalSystemLog = config.insights.maxLogEntries;
                $('#entries-label').html('Log entries to process (limited per settings)');
            }
            if(logLimit > config.insights.maxLogEntries) logLimit = config.insights.maxLogEntries;

            $('#entries-count').html(totalSystemLog);

            getSystemLogs();

        });
        
    } else if(offsetSystemLog < totalSystemLog) {
        
        let requests = [];
        
        for(let i = 0; i < parallelRequestsLog; i++) {
            let offSetNew = offsetSystemLog + (i * logLimit);
            if(offSetNew < totalSystemLog) {
                requests.push($.get('/plm/system-logs', { offset : offSetNew, limit  : logLimit }));
            }
        }
        
        Promise.all(requests).then(function(responses) {
            if(totalSystemLog === 3) {
                totalSystemLog = responses.data[0].totalCount;
                offsetSystemLog += logLimit;
            } else {
                offsetSystemLog += (parallelRequestsLog * logLimit);
            }

            for(let response of responses) processSystemLog(response);

            progressLogs = Math.round((offsetSystemLog * 100 / totalSystemLog), 0);
            updateProgress();
            getSystemLogs();
            
        });
        
    } else {

        adjustBubbleChartScale();

    }      

}
function processSystemLog(response) {
    
    let events  = response.data.items;
    let now     = new Date();

    for(let event of events) {

        let urn       = event.user.urn;
        let userIndex = -1;
        let date      = new Date(event.timestamp);
        let eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 1);
        let age       = Math.round(((now - date) / 1000 / 60 / 60 / 24), 0);

        for(let i = 0; i < users.length; i++) {
            if(users[i].urn === urn) {
                userIndex = i;
                break;
            }
        }

        if(userIndex > -1) {
            
            let userName = users[userIndex].displayName;

            if(age > daysCount) {
                daysCount = age;
                $('#days-count').html(daysCount);
                $('#summary-days').html(daysCount);
            }

            switch(event.action) {

                case 'Log In':
                    addUserActivity(0, userName, eventDate);
                    if(logins.indexOf(userName) === -1) {
                        logins.push(userName);
                        $('#summary-logins').html(logins.length);
                        updateSummary();
                    }
                    addUserLogin(userName, eventDate);
                    addEventLog(event, date);
                    break;

                case 'Create Item':
                    addUserActivity(1, userName, eventDate);
                    addWorkspaceCreation(event, eventDate);
                    addEventLog(event, date);
                    break;    

                case 'Edit Item':
                case 'Delete Item':
                case 'Delete Linked Item':
                case 'Undelete Item':
                case 'Edit Grid':
                case 'Add rows into grid':
                case 'Delete rows from grid':
                case 'Add Project Item':
                case 'Delete Project Item':
                case 'Add Linked Item':
                case 'Edit Linked Item':
                case 'Add item to BOM':
                case 'Edit BOM':
                case 'Delete item from BOM':
                case 'Add Relationship':
                case 'Edit Relationship':
                case 'Delete Relationship':
                case 'Release item':
                case 'Edit Project Item':
                    addUserActivity(2, userName, eventDate);
                    addWorkspaceEdit(event, eventDate, 1);
                    addEventLog(event, date);
                    break;   

                case 'Workflow Action':
                    addUserActivity(3, userName, eventDate);
                    addWorkspaceEdit(event, eventDate, 2);
                    addEventLog(event, date);
                    break;  

                case 'Add Milestone':
                case 'Edit Milestone':
                case 'Delete Milestone':
                    addUserActivity(4, userName, eventDate);
                    addWorkspaceEdit(event, eventDate, 3);
                    addEventLog(event, date);
                    break;    

                case 'Add Attachment':
                case 'Edit Attachment':
                case 'Delete Attachment':
                case 'Download Attachment':
                case 'Download Zip File':
                case 'Download Zip File via parent item':
                case 'Download Related Attachment':
                case 'Upload New Version':
                case 'Checkout Attachment':
                    addUserActivity(5, userName, eventDate);
                    addWorkspaceEdit(event, eventDate, 4);
                    addEventLog(event, date);
                    break;        

                case 'Profile Sync With Oxygen':
                case 'Update using Import Tool':
                case 'Log Out':
                case 'Add User':
                case 'Modify User':
                case 'Delete User':
                case 'Add Group':
                case 'Delete Group':
                case 'Modify Group':
                case 'Add Role':
                case 'Modify Role':
                case 'Delete Role':
                case 'Add Permission':
                case 'Delete Permission':
                case 'Change Additional Owners':
                case 'Import New Item using Import Tool':
                case 'Change Owner':
                case 'Indexing Workspace':
                case 'Add markup':
                case 'Edit Personal Details':
                    break;

                default :
                    console.log(event.action);
                    break;

            } 
        }

    }
        
    chartWorkspaceActivities.update();
    chartTimelineCreation.update();
    chartTimelineEdits.update();

}
function adjustBubbleChartScale() {

    let datasets = chartTimelineUsers.data.datasets;
    let rMax     = 0;
    let rRef     = 1500 / (totalUsers + 2);

    for(let dataset of datasets) {
        for(let dataPoint of dataset.data) {
            if(dataPoint.r > rMax) rMax = dataPoint.r;
        }
    }

    let multiplier = 1 / (rMax / rRef) ;

    for(let dataset of datasets) {
        for(let dataPoint of dataset.data) {
            dataPoint.r = dataPoint.r * multiplier;
        }
    }       
    
    chartTimelineUsers.update();

}


function addEventLog(event, date) {

    if(countEventLogEntries >= config.insights.maxEventLogEntries) return;
    if(countEventLogEntries > 50000) return;

    let elemCellDesc = $('<td></td>');
    let elemCellLink = $('<td></td>').addClass('nowrap');

    if(event.hasOwnProperty('item')) {
        
        let link = event.item.link.split('/');
        let url  = 'https://' + tenant + '.autodeskplm360.net/plm/workspaces/' + link[4] + '/items/itemDetails?view=full&tab=details&mode=view&itemId=urn%60adsk,plm%60tenant,workspace,item%60' + tenant.toUpperCase() + ',' + link[4] + ',' + link[6] + '&cached=false';
        
        $('<a></a>').appendTo(elemCellLink)
            .attr('target', '_blank')
            .attr('href', url)
            .html(event.item.title);
        
    } else { elemCellLink.append('-'); }
    
    if(event.description === null) {
        
        for(let detail of event.details) {
        
            if(elemCellDesc.html() !== '') elemCellDesc.append('<br/>');
            
            elemCellDesc.append(detail.fieldName + " was changed from '" + detail.oldValue + "' to '" + detail.newValue + "'");
            
        }
        
    } else { elemCellDesc.append(event.description); }
    
    let elemEvent = $('<tr></tr>').appendTo('#events')
        .addClass('user')
        .append("<td class='nowrap'>" + event.user.title + "</td>")
        .append("<td class='nowrap'>" + event.action + "</td>")
        .append("<td class='nowrap'>" + date.toLocaleString() + "</td>")
        .append(elemCellLink)
        .append(elemCellDesc);
    
    countEventLogEntries++;

    let selectedName = $('#select-user').val();
    
    if(selectedName !== '*') {
        if(selectedName !== event.user.title) {
            elemEvent.addClass('hidden');
        }
    }
    
}
function addUserLogin(userName, eventDate) {
    
    let exists = false;
    let time = eventDate.getTime()
    
    for(loginDate of loginDates) {
        if(loginDate.time === time) {
            if(loginDate.userName === userName) {
                return;
            }
        }
    }
    
    loginDates.push({
        'time' : time,
        'userName' : userName
    })
    
    for(var i = 0;  i < chartTimelineLogins.data.datasets[1].data.length; i++) {
        var record = chartTimelineLogins.data.datasets[1].data[i];
        if(record.x === time) {
            exists = true;
            record.y--;
            chartTimelineLogins.data.datasets[0].data[i].y++;
            break;
        }
    }
    
    if(!exists) {
        chartTimelineLogins.data.datasets[0].data.push({
            x : time,
            y : 1
        });        
        chartTimelineLogins.data.datasets[1].data.push({
            x : time,
            y : users.length - 1
        });
    }
    
    chartTimelineLogins.update();
    
}
function addUserActivity(index, userName, eventDate) {
    
    let exists   = false;
    let datasets = chartTimelineUsers.data.datasets[index].data;
    
    for(let dataset of datasets) {
        if(dataset.y === userName) {
            if(dataset.x === eventDate.getTime()) {
                exists = true;
                dataset.r = dataset.r + 1;
                break;
            }
        }
    }

    if(!exists) {
        datasets.push({
            x : eventDate.getTime(),
            y : userName,
            r : 1
        });
    }

    //chartTimelineUsers.update();
    
}
function addWorkspaceCreation(event, eventDate) {
    
    let itemLink    = event.item.link;
    let itemData    = itemLink.split('/');
    let wsId        = itemData[itemData.length - 3];
    let exists      = false;
    let newDataset  = true;
    let wsName      = '';
    let color       = '#bbb';
    let index       = -1;
    let dayBefore   =  new Date(eventDate.getTime());
        dayBefore.setDate(dayBefore.getDate() - 1);
    
    
    for(var i = 0; i < workspaces.length; i++) {
        var workspace = workspaces[i];
        if(wsId === workspace.id) {
            wsName = workspace.label;
            color = workspace.color;
            index = i;
        }
    }
    
    for(dataset of chartTimelineCreation.data.datasets) {
        
        if(dataset.label === wsName) {
            newDataset = false;
            for(record of dataset.data) {  
                if(record.x.getTime() >= eventDate.getTime()) {
                    record.y = record.y + 1;
                }
                if(record.x.getTime() === eventDate.getTime()) {
                    exists = true;
                }
            }
            if(!exists) {
                dataset.data.push({
                    x : eventDate,
                    y : 1
                });
                dataset.data.push({
                    x : dayBefore,
                    y : 0
                });
            }
        }

    }
    
    if(newDataset) {
        let now = new Date();
        let endDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,1);
        
        var newData = [];
        
        if(endDay.getTime() !== eventDate.getTime()) {
            newData.push({
                x : endDay,
                y : 1
            })   ;
        }
        newData.push({
            x : eventDate,
            y : 1
        })
        newData.push({
            x : dayBefore,
            y : 0
        })
        
        chartTimelineCreation.data.datasets.push({
            label           : wsName,
            data            : newData,
            backgroundColor : color,
            borderColor     : color,
            borderWidth     : 1,
            lineTension     : 0
        });
        
    }
    
    chartWorkspaceActivities.data.datasets[0].data[index]++;
    
} 
function addWorkspaceEdit(event, eventDate, indexDataset) {
    
    let itemLink    = event.item.link;
    let itemData    = itemLink.split('/');
    let wsId        = itemData[itemData.length - 3];
    let exists      = false;
    let wsName      = '';
    let color       = '#bbb';
    let index       = -1;
    
    for(var i = 0; i < workspaces.length; i++) {
        var workspace = workspaces[i];
        if(wsId === workspace.id) {
            wsName = workspace.label;
            color = workspace.color;
            index = i;
        }
    }
    
    let newDate = (editDates.indexOf(eventDate.getTime()) === -1);
    let newWorkspace = (editWorkspaces.indexOf(wsName) === -1);
    
    if(newDate) editDates.push(eventDate.getTime());
    if(newWorkspace) editWorkspaces.push(wsName);
    

    if(newDate) {
        for(dataset of chartTimelineEdits.data.datasets) {
            dataset.data.push({
                x : eventDate.getTime(),
                y : 0
            })
        }
    }
    
    if(newWorkspace) {
        
        let newData = [];
        
        for(editDate of editDates) {
            newData.push({
                x : editDate,
                y : 0
            })
        }
        
        chartTimelineEdits.data.datasets.push({
            label : wsName,
            data : newData,
            backgroundColor : color
        });
        
    }
    
    for(dataset of chartTimelineEdits.data.datasets) {
        
        if(dataset.label === wsName) {
            for(record of dataset.data) {            
                if(record.x === eventDate.getTime()) {
                    record.y = record.y + 1;
                    break;
                }
            }
        }

    }
    
    chartWorkspaceActivities.data.datasets[indexDataset].data[index]++;
    
} 



// Login summary
function updateSummary() {
    
    var widthLogins = logins.length * 100 / users.length;
    var widthNoLogins = 100 - widthLogins;
    
    $('#summary-bar-logins').css('background', '#ef9b12');
    $('#summary-bar-logins').css('width', widthLogins + '%');
    $('#summary-bar-nologin').css('background', '#f7cc93');
    $('#summary-bar-nologin').css('width', widthNoLogins + '%');
}

function updateProgress() {
    
    let value = 0;
    
    if(progressUsers < progressWorkspaces) {
        if(progressUsers < progressLogs) {
            value = progressUsers;
        } else {
            value = progressLogs;
        } 
    } else {
        if(progressWorkspaces < progressLogs) {
            value = progressWorkspaces;
        } else {
            value = progressLogs;
        } 
    }

    if(value < 1) value = 1;
    
    let progress = Math.round(value * 180 / 100, 0);

    $('#progress-bar-complete').css('width', value + '%').attr('title', value + '% completed');
    $('#progress-bar-pending').css('left', (value - 20) + '%').attr('title', value + '% completed');
    $('#percent').html(value + '%');
    $('.rotate').css('transform', 'rotate(' + progress.toString() + 'deg)');

    if(totalSystemLog > 0) {
        if(totalSystemLog < offsetSystemLog) $('#processed-count').html(totalSystemLog); else $('#processed-count').html(offsetSystemLog);
    }
    
    if(value === 100) {
        $('#progress-bar-complete').remove();
        $('#progress-bar-pending').remove();
        $('#processing').hide();
    }
    
}
