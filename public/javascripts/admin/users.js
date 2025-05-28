let maxRequests = 5;
let workspaces  = [];
let dataUsers   = [];
let users       = [];
let views       = [];
let deleteViews = false;


$(document).ready(function() {

    getSystemAdminSession(function(response) {

        if(response) {

            setUIEvents();
            insertMenu();
            appendOverlay(true);

            getWorkspaces();
            getUsers();
            getGroups();
            getCharts();

        }

    });

});

function setUIEvents() {

    // Groups & Users Selection
    $('#groups-select-all').click(function() {
        $('#groups').children(':visible').addClass('selected');
        updateCounters();
    });
    $('#groups-deselect-all').click(function() {
        $('#groups').children().removeClass('selected');
        updateCounters();
    });
    $('#groups-filter').keyup(function() {
        let filterValue = $(this).val().toLowerCase();
        $('#groups').children().each(function() {
            let cellValue = $(this).attr('data-sort').toLowerCase();
            let matches   = (cellValue.indexOf(filterValue) > -1);
            if($(this).hasClass('selected')) matches = true;
            if(matches) $(this).show(); else $(this).hide();
        });
    });
    $('#users-select-all').click(function() {
        $('#users').children(':visible').addClass('selected');
        updateCounters();
    });
    $('#users-deselect-all').click(function() {
        $('#users').children().removeClass('selected');
        updateCounters();
    });
    $('#users-filter').keyup(function() {
        let filterValue = $(this).val().toLowerCase();
        $('#users').children().each(function() {
            let cellValue = $(this).attr('data-sort').toLowerCase();
            let matches   = (cellValue.indexOf(filterValue) > -1);
            if($(this).hasClass('selected')) matches = true;
            if(matches) $(this).show(); else $(this).hide();
        });
    });


    // Theme Options
    $('#theme').find('.button').click(function() {
        $(this).addClass('default');
        $(this).siblings().removeClass('default');
        updateCounters();
    });


    // Workspace Views buttons
    $('#views-select-all').click(function() {
        $('#views-list').children(':visible').addClass('selected');
        updateCounters();
    });
    $('#views-deselect-all').click(function() {
        $('#views-list').children().removeClass('selected').removeClass('is-default');
        updateCounters();
    });
    $('#views-filter').keyup(function() {
        let filterValue = $(this).val().toLowerCase();
        $('#views-list').children().each(function() {
            let cellValue1 = $(this).attr('data-sort').toLowerCase();
            let cellValue2 = $(this).attr('data-workspace').toLowerCase();
            let matches   = (cellValue1.indexOf(filterValue) > -1);
            if($(this).hasClass('selected')) matches = true;
            if(!matches) matches   = (cellValue2.indexOf(filterValue) > -1);
            if(matches) $(this).show(); else $(this).hide();
        });
    });
    $('#views-force').click(function() {
        $(this).toggleClass('icon-toggle-on')
            .toggleClass('icon-toggle-off')
            .toggleClass('filled');

    });
    $('#views-my-defaults').click(function() {
        $('.is-my-default').each(function() {
            if(!$(this).hasClass('is-default')) {
                $(this).find('.default-view').click();
            }
        });
    });    
    $('#views-clear-defaults').click(function() {
        $('.is-default').each(function() {
            $(this).find('.default-view').click();
        });
    });    
    $('.views-delete-check').click(function() {
        $('#views-check-box').toggleClass('icon-check-box').toggleClass('icon-check-box-checked');
        $('#views-confirm').toggleClass('hidden')
            .removeClass('icon-toggle-on')
            .removeClass('filled')
            .addClass('icon-toggle-off');
    });
    $('#views-confirm').click(function() {
        if($('#views-confirm').hasClass('disabled')) return;
        $('#views-confirm').toggleClass('icon-toggle-on')
            .toggleClass('icon-toggle-off')
            .toggleClass('filled');
    })


    // Charts buttons
    $('#charts-my-defaults').click(function() {
        $('.is-pinned').each(function() {
            $(this).addClass('selected');
        });
    });  
    $('#charts-select-all').click(function() {
        $('#charts-list').children(':visible').addClass('selected');
        updateCounters();
    });
    $('#charts-deselect-all').click(function() {
        $('#charts-list').children().removeClass('selected').removeClass('is-default');
        updateCounters();
    });
    $('#charts-filter').keyup(function() {
        let filterValue = $(this).val().toLowerCase();
        $('#charts-list').children().each(function() {
            let cellValue1 = $(this).attr('data-sort').toLowerCase();
            let cellValue2 = $(this).attr('data-workspace').toLowerCase();
            let matches   = (cellValue1.indexOf(filterValue) > -1);
            if($(this).hasClass('selected')) matches = true;
            if(!matches) matches   = (cellValue2.indexOf(filterValue) > -1);
            if(matches) $(this).show(); else $(this).hide();
        });
    });


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
function getUsers() {

    $('#users').html('');

    $.get('/plm/users', { 
        bulk       : false,
        activeOnly : true, 
        mappedOnly : true
    }, function(response) {

        for(let user of response.data.items) {
            user.displayName = (user.displayName === ' ') ? user.email : user.displayName;
        }

        sortArray(response.data.items, 'displayName');

        for(let user of response.data.items) {

            if(!user.tenantAdmin) {

                if(userAccount.email !== user.id) {

                    dataUsers.push(user);

                    let elemNew = $('<div></div>').appendTo($('#users'))
                        .addClass('surface-level-3')
                        .attr('data-sort', user.displayName)
                        .attr('data-id', user.userId)
                        .attr('data-email', user.eMail)
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
                        .html(user.displayName);

                    $('<div></div>').appendTo(elemNew)
                        .addClass('icon')
                        .addClass('icon-user')
                        .addClass('filled');

                }
            }

        }

    })

}
function getGroups() {

    $('#groups').html('');

    $.get('/plm/groups', { tenant : $('#target-tenant').val(), bulk : false }, function(response) {

        for(let group of response.data.items) {

            let elemNew = $('<div></div>').appendTo($('#groups'))
                .addClass('surface-level-3')
                .attr('data-link', group.__self__)
                .attr('data-sort', group.shortName)
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
                .html(group.shortName);

            $('<div></div>').appendTo(elemNew)
                .addClass('icon')
                .addClass('icon-group')
                .addClass('filled');

        }

    });

}
function getWorkspaces() {

    workspaces = [];
    iWorkspace = 0;

    $('#views-list').html('');

    $.get('/plm/workspaces', { bulk : false }, function(response) {

        for(let workspace of response.data.items) {
            workspaces.push({
                link  : workspace.link,
                title : workspace.title
            })
        }

        sortArray(workspaces, 'title');
        getWorkspaceViews(0);

    });

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
                        
                    if(!isBlank(view.type)) {
                        if(view.type === 'DEFAULT') elemNew.addClass('is-my-default');
                    }

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

    let requests = [
        $.get('/plm/charts-available', {}),
        $.get('/plm/charts-pinned', {})
    ];

    Promise.all(requests).then(function(responses) {

        for(let chart of responses[0].data) chart.workspace = chart.workspace.title;

        sortArray(responses[0].data, 'title');
        sortArray(responses[0].data, 'workspace');

        for(let chart of responses[0].data) {

            let reportId = chart.report.link.split('/').pop();

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

            for(let pinnedChart of responses[1].data.dashboardReportList.list) {
                if(pinnedChart.id == reportId) {
                    elemNew.addClass('is-pinned');
                }
            }
            
            $('<div></div>').appendTo(elemNew)
                .addClass('icon')
                .addClass('icon-check-box')
                .addClass('surface-level-4');

            $('<div></div>').appendTo(elemNew)
                .addClass('label')
                .addClass('report-name')
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
    $('#views-confirm').addClass('disabled');
    $('#stop').removeClass('disabled');
    $('#start').addClass('disabled');

    groups      = [];
    users       = [];
    views       = [];
    stopped     = false;
    deleteViews = $('#views-confirm').hasClass('icon-toggle-on');

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

        if(userAccount.email === dataUser.id) add = false;

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
    } else {
        addLogEnd();        
        endProcessing();        
    }
}
function endProcessing() {

    $('#views-confirm').removeClass('disabled');
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

        Promise.all(requests).then(function(responses) {
            for(let response of responses) {
                if(response.error) {
                    let message = (response.status === 401) ? 'Could not login as system admin, please review adminClientId and adminClientSecret in your settings file.': response.data.message;
                    showErrorMessage('Error when setting theme', message);
                    stopped = true;
                    endProcessing();
                    return;
                }
            }
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
                        let isAdditional = true;
                        for(let view of views) {
                            if(view.wsId === params.wsId) {
                                if(curView.title === view.title) {
                                    view.hasMatch = true;
                                    isAdditional  = false;
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
                        if(isAdditional) {
                            if(deleteViews) {
                                requests.push($.post('/plm/tableau-delete', {
                                    link : curView.link,
                                    user : user.eMail
                                }));
                                addLogEntry('Deleting existing view ' + curView.title, 'notice');
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

        $.get('/plm/charts-pinned', { user : user.eMail }, function(response) {

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