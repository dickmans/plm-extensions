let maxRequests = 5;
let workspaces = [];
let dataUsers  = [];
let users      = [];
let views      = [];


$(document).ready(function() {

    setUIEvents();
    appendOverlay(true);

    getWorkspaces();

});

function setUIEvents() {

    $('#workspaces').on('change', function() {
        console.log('1');
    })


    // Start Processing
    $('#start').click(function() {
        if($(this).hasClass('disabled')) return;
        startProcessing();
    });
    $('#stop').click(function() {
        if($(this).hasClass('disabled')) return;
        addLogStopped(); 
        endProcessing();
    });

}


// Get Tenant Information
function getWorkspaces() {

    workspaces = [];
    iWorkspace = 0;

    
    let requests = [
        $.get('/plm/scripts'),
        $.get('/plm/workspaces')
    ];


    Promise.all(requests).then(function(responses) {

        // let scripts    = responses[0].data;
        let workspaces = responses[1].data.items;
        let scripts = [];



        // console.log(scripts.scripts);
        console.log(responses[0].data);
        console.log(responses[1].data);
        console.log(workspaces);



        for(let script of responses[0].data.scripts) {


            if(script.scriptType === 'VALIDATION') scripts.push(script);

        }

        console.log(scripts);

        sortArray(scripts, 'uniqueName');
        sortArray(workspaces, 'title');

        for(let workspace of workspaces) {
            $('<option></option>').appendTo($('#workspaces'))
                .html(workspace.title)
                .attr('value', workspace.link);
        }


    });


    // $('#workspaces').html('');

    // $.get('/plm/scripts', { bulk : false }, function(response) {

    //     console.log(response);

    //     let scripts = response.data;

    // $.get('/plm/workspaces', { bulk : false }, function(response) {

    //     console.log(response);

    //     sortArray(workspaces, 'title');

    //     for(let workspace of response.data.items) {
    //         $('<option></option>').appendTo($('#workspaces'))
    //             .html(workspace.title)
    //             .attr('value', workspace.link);
    //     }


    //     // getWorkspaceViews(0);

    // });
    // });

}
function getWorkspaceViews(iWorkspace) {

    if(iWorkspace < workspaces.length) {

        let requests = [];
        let limit    = iWorkspace + maxRequests;

        if(limit > workspaces.length -1) limit = workspaces.length;

        for(iWorkspace; iWorkspace < limit; iWorkspace++) {
            requests.push($.get('/plm/tableaus', {
                link   : workspaces[iWorkspace].link,
                title  : workspaces[iWorkspace].title 
            }));
        }

        Promise.all(requests).then(function(responses) {

            for(let response of responses) {
                for(let view of response.data) {

                    let elemNew = $('<div></div>').appendTo($('#views-list'))
                        .addClass('surface-level-3')
                        .addClass('view')
                        .attr('data-sort',response.params.title + ' ' + view.title)
                        .attr('data-link', view.link)
                        .attr('data-workspace', response.params.title)
                        .on('dblclick', function() {
                            let ws = $(this).attr('data-workspace');
                            $('.view').each(function() {
                                if($(this).attr('data-workspace') === ws) {
                                    $(this).addClass('selected');
                                }
                            });
                            updateCounters();
                        })
                        .click(function() {
                            $(this).toggleClass('selected');
                            if(!$(this).hasClass('selected')) {
                                $(this).children('.default-view').addClass('icon-radio-unchecked').removeClass('icon-radio-checked');
                            }
                            updateCounters();
                        });
                    
                    $('<div></div>').appendTo(elemNew)
                        .addClass('icon')
                        .addClass('icon-check-box')
                        .addClass('surface-level-4');
        
                    $('<div></div>').appendTo(elemNew)
                        .addClass('label')
                        .addClass('workspace-name')
                        .html(response.params.title);

                    $('<div></div>').appendTo(elemNew)
                        .addClass('label')
                        .addClass('view-name')
                        .html(view.title);
        
                    $('<div></div>').appendTo(elemNew)
                        .addClass('with-icon')
                        .addClass('icon-toggle-off')
                        .addClass('default-view')
                        .html('Default')
                        .click(function(e) {

                            e.preventDefault();
                            e.stopPropagation();

                            let elemView  = $(this).parent();
                            let workspace = elemView.attr('data-workspace');
                                
                            elemView.toggleClass('is-default')
                            
                            if(elemView.hasClass('is-default')) elemView.addClass('selected');

                            elemView.siblings().each(function() {
                                if($(this).attr('data-workspace') === workspace) {
                                    $(this).removeClass('is-default');
                                }
                            });

                        });

                }
            }

            getWorkspaceViews(iWorkspace);

        });

    } else {
        $('#overlay').hide();
    }

}
function getCharts() {

    $('#charts-list').html('');

    $.get('/plm/charts-available', {}, function(response) {      

        for(let chart of response.data) chart.workspace = chart.workspace.title;

        sortArray(response.data, 'title');
        sortArray(response.data, 'workspace');

        for(let chart of response.data) {

            let elemNew = $('<div></div>').appendTo($('#charts-list'))
                .addClass('surface-level-3')
                .addClass('chart')
                .attr('data-sort', chart.title)
                .attr('data-workspace', chart.workspace)
                .attr('data-link', chart.__self__)
                .on('dblclick', function() {
                    let ws = $(this).attr('data-workspace');
                    $('.chart').each(function() {
                        if($(this).attr('data-workspace') === ws) {
                            $(this).addClass('selected');
                        }
                    });
                    updateCounters();
                })
                .click(function() {
                    $(this).toggleClass('selected');
                    updateCounters();
                });
            
            $('<div></div>').appendTo(elemNew)
                .addClass('icon')
                .addClass('icon-check-box')
                .addClass('surface-level-4');

            $('<div></div>').appendTo(elemNew)
                .addClass('label')
                .html(chart.workspace);

            $('<div></div>').appendTo(elemNew)
                .addClass('label')
                .html(chart.title);

            $('<div></div>').appendTo(elemNew)
                .addClass('icon')
                .addClass('icon-bar-chart')
                .addClass('filled');

        }

    });

}


// Update tab counters
function updateCounters() {

    let countGroups     = $('#groups').children('.selected').length;
    let countUsers      = $('#users').children('.selected').length;
    let valueTheme      = $('#theme').find('.button.default').attr('data-value');
    let countWorkspaces = $('#views-list').children('.selected').length;
    let countCharts     = $('#charts-list').children('.selected').length;

    $('#toolbar-text').hide();

    if(countGroups > 0) {
        $('#count-groups').html(countGroups + ' group(s)').show();
        $('#toolbar-text').show();
    } else $('#count-groups').hide();

    if(countUsers > 0) {
        $('#count-users').html(countUsers + ' user(s)').show();
        $('#toolbar-text').show();
    } else $('#count-users').hide();

    if(valueTheme !== '') {
        $('#count-theme').html(valueTheme.toUpperCase() + ' theme').show();
        $('#toolbar-text').show();
    } else $('#count-theme').hide();

    if(countWorkspaces > 0) {
        $('#count-workspaces').html(countWorkspaces + ' view(s)').show();
        $('#toolbar-text').show();
    } else $('#count-workspaces').hide();

    if(countCharts > 0) {
        $('#count-charts').html(countCharts + ' chart(s)').show();
        $('#toolbar-text').show();
    } else $('#count-charts').hide();
 
}


// Apply changes
function startProcessing() {

    $('#console-content').html('');
    $('#stop').removeClass('disabled');
    $('#start').addClass('disabled');

    groups  = [];
    users   = [];
    views   = [];
    stopped = false;

    addLogSeparator();
    addLogEntry('Getting list of users', 'head');

    $('#groups').children('.selected').each(function() {
        groups.push({
            name : $(this).attr('data-sort'),
            link : $(this).attr('data-link'),
        })
    });

    for(let dataUser of dataUsers) {

        let add = false;

        for(let userGroup of dataUser.groups) {
            for(let group of groups) {
                if(group.link === userGroup.link) {
                    add = true;
                    break;
                }
            }
        }
        
        if(!add) {
            $('#users').children('.selected').each(function() {
                if($(this).attr('data-id') === dataUser.userId) {
                    add = true;
                }
            });
        }

        if(add) {
            users.push({
                name   : dataUser.displayName,
                eMail  : dataUser.email,
                userId : dataUser.userId
            });
        }

    }

    addLogEntry('User profiles to be updated : ' + users.length, '');

    if(users.length > 0) {
        sortArray(users,  'name');
        setTheme();
    } else addLogEnd();        
}
function endProcessing() {

    $('#stop').addClass('disabled');
    $('#start').removeClass('disabled');

}


// #1 Apply Theme
function setTheme() {

    if(stopped) return;

    addLogSeparator();
    
    let value = $('#theme').find('.default').attr('data-value');

    if(value === '') {
        addLogEntry('Skipping Themes Update', 'head');
        setWorkspaceViews();
    } else {
        addLogEntry('Setting ' + value + ' theme', 'head');
        updateUserTheme(0);
    }

}
function updateUserTheme(index) {

    if(stopped) return;

    if(index < users.length) {

        let requests    = [];
        let remaining   = users.length - index;
        let limit       = (remaining > maxRequests) ? maxRequests : remaining;

        for(let i = index; i < limit; i++) {

            let user = users[i];

            requests.push($.get('/plm/preference', { 
                property  : 'theme', 
                value     : $('#theme').find('.default').attr('data-value'),
                user      : user.eMail
            }));

            addLogEntry(user.name, 'count', ++index);

        }

        Promise.all(requests).then(function() {
            updateUserTheme(index);
        });
 
    } else {
        setWorkspaceViews();
    }

}


// #2 Apply Workspace Views
function setWorkspaceViews() {

    if(stopped) return;

    addLogSeparator();

    let enforced = ($('#views-force').hasClass('icon-toggle-on')) ? '' : 'not';

    $('#views-list').children('.selected').each(function() { views.push({
        default   : $(this).hasClass('is-default'),
        title     : $(this).find('.view-name').html(),
        link      : $(this).attr('data-link'),
        wsId      : $(this).attr('data-link').split('/')[4],
        workspace : $(this).attr('data-workspace'),
        force     : $('#views-force').hasClass('icon-toggle-on'),
        hasMatch  : false
    }); })

    if(views.length === 0) {

        addLogEntry('Skipping Workspaces Views Update', 'head');
        setCharts();

    } else {

        addLogEntry('Setting Workspace Views (' + views.length + ')', 'head');
        addLogEntry('Update of existing views will ' + enforced + ' be enforced', '');
        addLogSpacer();

        if($('.view.is-default').length > 0) {

            addLogEntry('The following views will be set as default views:', '');
            $('.view.is-default').each(function() {
                addLogEntry($(this).find('.workspace-name').html() + ' | ' + $(this).find('.view-name').html(), 'notice');
            });
            addLogSpacer();

        }

        addLogEntry('Getting configuration of views to be copied:', '');
        getTableaus(0);

    }

}
function getTableaus(index) {

    if(stopped) return;

    if(index < views.length) {

        let requests   = [];
        let remaining  = views.length - index;
        let limit      = (remaining < maxRequests) ? remaining : maxRequests;
        
        limit += index;

        for(let i = index; i < limit; i++) {
            let view = views[i];
            requests.push($.get('/plm/tableau-columns', { link : view.link }));
            addLogEntry(view.title, 'notice');
        }

        Promise.all(requests).then(function(responses) {
            for(let response of responses) {
                views[index++].columns = response.data;
            }
            getTableaus(index);
        });

    } else {

        addLogSpacer();
        addLogEntry('Starting update of user workspace views', '');
        addLogSpacer();
        updateUserWorkspaceViews(0, 0);

    }

}
function updateUserWorkspaceViews(indexUser, indexView) {

    if(stopped) return

    if(indexUser < users.length) {
        
        if(indexView < views.length) {
            
            let user     = users[indexUser];
            let requests = [];
            let params   = {
                user : user.eMail,
                wsId : views[indexView].wsId
            }

            if(indexView === 0) addLogEntry(user.name, 'count', indexUser + 1);

            $.get('/plm/tableaus', params, function(response) {

                if(response.status === 403) {

                    addLogEntry('Error copying view ' + views[indexView].workspace + ' | ' + views[indexView++].title, 'error');

                } else {

                    for(let curView of response.data) {
                        for(let view of views) {
                            if(view.wsId === params.wsId) {
                                if(curView.title === view.title) {
                                    view.hasMatch = true;
                                    if(view.force) {
                                        let paramsUpdate = {
                                            link         : curView.link,
                                            name         : view.title,
                                            columns      : view.columns,
                                            default      : view.default,
                                            showDeleted  : false,
                                            user         : user.eMail
                                        };
                                        requests.push($.post('/plm/tableau-update', paramsUpdate));
                                        addLogEntry('Updating existing view ' + view.title, 'notice');
                                    } else {
                                        addLogEntry('Skipping existing view ' + view.title, 'notice');
                                    }
                                }
                            }
                        }
                    }

                    for(let view of views) {
                        if(view.wsId === params.wsId) {
                            indexView++;
                            if(!view.hasMatch) {
                                let paramsCreate = {
                                    wsId         : view.wsId,
                                    name         : view.title,
                                    columns      : view.columns,
                                    default      : view.default,
                                    showDeleted  : false,
                                    user         : user.eMail
                                };
                                requests.push($.post('/plm/tableau-clone', paramsCreate))
                                addLogEntry('Creating view ' + view.title, 'notice');
                            }
                        }
                    }   
                }            

                Promise.all(requests).then(function() {
                    updateUserWorkspaceViews(indexUser, indexView);
                });

            });

        } else {
            for(let view of views) view.hasMatch = false;
            updateUserWorkspaceViews(indexUser + 1, 0);
        }
 
    } else {
        setCharts();
    }

}


// #3 Apply Charts
function setCharts() {

    if(stopped) return;

    addLogSeparator();

    let count = $('#charts-list').children('.selected').length;

    if(count === 0) {
        addLogEntry('Skipping Dashboard Charts Update', 'head');
        addLogEnd();
        endProcessing();
    } else {
        if(count > 9) {
            addLogEntry('The PLM dashboard allows for a maximum of 9 charts only', '');
            addLogEntry('Only the first 9 of the ' + count + ' selected charts will be added', '');
            addLogEntry('The following charts will be ignored:','');

            let index = 0;

            $('#charts-list').children('.selected').each(function() {
                if(index++ >= 9) {
                    addLogEntry($(this).attr('data-sort'),'notice');
                }
            });
            addLogSpacer();

            count = 9;
        }
        addLogEntry('Setting Dashboard Charts (' + count + ')', 'head');
        updateUserCharts(0);
    }

}
function updateUserCharts(index) {

    if(stopped) return;

    if(index < users.length) {

        let user     = users[index];
        let requests = [];
        let iChart   = 1;

        addLogEntry(user.name, 'count', index + 1);

        $.get('/plm/charts-pinned', { user : user.eMail}, function(response) {

            let count = response.data.dashboardReportList.list.length;

            addLogEntry('Charts in dashboard before : ' + count, 'notice');
            
            $('#charts-list').children('.selected').each(function() {

                let link = $(this).attr('data-link');

                if(requests.length < 9) {
                    requests.push($.get('/plm/chart-set', { 
                        title : $(this).attr('data-sort'),
                        index : iChart++, 
                        link : link, 
                        eMail : user.eMail, 
                        userId : user.userId
                    }));
                }

            });

            for(iChart; iChart <= count; iChart++) requests.push($.get('/plm/chart-set', { index : iChart, eMail : user.eMail, userId : user.userId}));

            Promise.all(requests).then(function(responses) {
                for(let response of responses) {
                    if(response.error) addLogEntry('Error adding chart ' + response.params.title, 'error');
                    else addLogEntry('Added chart ' + response.params.title, 'success');
                }
                updateUserCharts(++index);
            });

        });

    } else {
        addLogEnd();
        endProcessing();
    }

}