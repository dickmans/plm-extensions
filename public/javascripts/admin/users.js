let maxRequests = 5;
let workspaces  = [];
let dataGroups  = null;
let dataUsers   = null;
let users       = [];
let views       = [];
let assignments = { remove : [], add : [] };
let deleteViews = false;
let iProgress   = 0;


$(document).ready(function() {

    getSystemAdminSession(function(response) {

        if(response) {

            $('.dialog-processing').show();

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

    // Main Toolbar Actions
    $('#show-new-single-user').click(function() {
        $('#overlay').show();
        $('#new-single-user').show();
    });    
    $('#show-new-multi-users').click(function() {
        $('#overlay').show();
        $('#new-multi-users').show();
    });    
    $('#show-users-groups-grid').click(function() {
        $('#overlay').show();
        $('#users-groups-grid').show();
    });    


    // Groups & Users Selection
    $('.groups-select-all').click(function() {
        let elemList = $(this).closest('.list-header').next('.list');
        elemList.children(':visible').addClass('selected');
        if(elemList.attr('id') == 'groups') updateCounters();
    });
    $('.groups-deselect-all').click(function() {
        let elemList = $(this).closest('.list-header').next('.list');
        elemList.children().removeClass('selected');
        if(elemList.attr('id') == 'groups') updateCounters();
    });
    $('.groups-filter').keyup(function() {
        let filterValue = $(this).val().toLowerCase();
        let elemList = $(this).closest('.list-header').next('.list');
        elemList.children().each(function() {
            let cellValue = $(this).attr('data-sort').toLowerCase();
            let matches   = (cellValue.indexOf(filterValue) > -1);
            if($(this).hasClass('selected')) matches = true;
            if(matches) $(this).show(); else $(this).hide();
        });
    });
    $('#users-select-all').click(function() {
        $('#users').children(':visible').addClass('selected').removeClass('last');
        updateCounters();
    });
    $('#users-deselect-all').click(function() {
        $('#users').children().removeClass('selected').removeClass('last');
        updateCounters();
    });
    $('#users-filter-new').click(function() {
        $(this).toggleClass('active');
        filterUsers();
        updateCounters();
    });
    $('#users-filter').keyup(function() {
        filterUsers();
    });
    $('#users-group-filter').on('change', function() {
        filterUsers();
    });


    // Group Assignment
    $('#assignment-remove-all').click(function() {
        $('.group-assignment').find('.button-group-remove').each(function() { $(this).click(); })
    });
    $('#assignment-reset-all').click(function() {
        $('.group-assignment').find('.button-group-keep').each(function() { $(this).click(); })
    });
    $('#assignment-add-all').click(function() {
        $('.group-assignment').find('.button-group-add').each(function() { $(this).click(); })
    });
    $('#assignment-filter').keyup(function() {
        let filterValue = $(this).val().toLowerCase();
        $('#assignment-list').children().each(function() {
            let value = $(this).find('.group-name').html().toLowerCase();
            let matches   = (value.indexOf(filterValue) > -1);
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


    // User Creation Dialogs
    $('.click-close-dialog').click(function() {
        $('#overlay').hide();
        $(this).closest('.dialog').hide();
    });
    $('#new-single-user-next').click(function() {
        createNewUser(true);
    });
    $('#new-single-user-save').click(function() {
        createNewUser(false);
    });
    $('#new-multi-users-submit').click(function() {
        iProgress = 0;
        $('.multi-users-row').removeClass('failed');
        $('.user-creation-error').remove();
        createNewUsers();
    });


    // Users Group Assignment Grid
    $('#users-groups-grid-apply').click(function() {
        updateUserGroupsAssignments(false);
    });
    $('#users-groups-grid-save').click(function() {
        updateUserGroupsAssignments(true);
    });

}


// Get Tenant Information
function getUsers() {

    $('#users').html('');

    dataUsers = null;

    $.get('/plm/users', { 
        bulk       : false,
        activeOnly : true, 
        mappedOnly : false
    }, function(response) {

        dataUsers = [];

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
                        .attr('data-email', user.email)
                        .attr('data-login', '')
                        .click(function(e) {
                            
                            let elemUser = $(this);
                                elemUser.toggleClass('selected').removeClass('last');
                                
                            if(elemUser.hasClass('selected')) {

                                if(e.shiftKey) {

                                    let lastPrev = elemUser.prevAll('.last').length;
                                    let lastNext = elemUser.nextAll('.last').length;

                                         if(lastPrev > 0) elemUser.prevUntil('.last').addClass('selected');
                                    else if(lastNext > 0) elemUser.nextUntil('.last').addClass('selected');

                                }

                                elemUser.addClass('last');
                            }
                            elemUser.siblings().removeClass('last');
                            updateCounters();

                        });
                    
                    $('<div></div>').appendTo(elemNew)
                        .addClass('icon')
                        .addClass('icon-check-box')
                        .addClass('user-checkbox')
                        .addClass('surface-level-4');

                    $('<div></div>').appendTo(elemNew)
                        .addClass('label')
                        .addClass('user-name')
                        .html(user.displayName)
                        .attr('title', user.email);

                    let elemLogin = $('<div></div>').appendTo(elemNew)
                        .addClass('user-login')
                        .attr('title', 'Last Login Date');

                    if(!isBlank(user.lastLoginTime)) {
                        
                        let lastLogin = user.lastLoginTime.split('T')[0].split('-');

                        $('<div></div>').appendTo(elemLogin).addClass('user-login-y').html(lastLogin[0]);
                        $('<div></div>').appendTo(elemLogin).addClass('user-login-s').html('-');
                        $('<div></div>').appendTo(elemLogin).addClass('user-login-m').html(lastLogin[1]);
                        $('<div></div>').appendTo(elemLogin).addClass('user-login-s').html('-');
                        $('<div></div>').appendTo(elemLogin).addClass('user-login-y').html(lastLogin[2]);

                        elemNew.attr('data-login', user.lastLoginTime.split('T')[0])
                        elemNew.addClass('existing');

                    } else elemNew.addClass('new');

                    let elemIcon = $('<div></div>').appendTo(elemNew)
                        .addClass('icon')
                        .addClass('user-icon');

                    if(isBlank(user.lastLoginTime)) {
                        elemIcon.attr('title', 'This user never logged in to PLM yet');
                        elemIcon.addClass('icon-contains').css('color', 'var(--color-yellow-500)');
                    } else {
                        elemIcon.attr('title', 'Last Login at ' + user.lastLoginTime);
                        elemIcon.addClass('icon-user').addClass('filled');
                    }

                }
            }

        }

        insertUsersGroupsGrid();

    })

}
function getGroups() {

    $('#groups').html('');
    $('#users-group-filter').children().remove();

    $('<option></option>').appendTo($('#users-group-filter'))
        .attr('value', '--')
        .html('- Display users of all groups -');    

    dataGroups = null;

    $.get('/plm/groups', { bulk : true }, function(response) {

        for(let group of response.data.items) {

            for(let index = group.users.length - 1; index >= 0; index--) {
                let user = group.users[index];
                if(user.tenantAdmin) group.users.splice(index, 1);
                else if(!user.userActive) group.users.splice(index, 1);
                else if(!user.regularUser) group.users.splice(index, 1);
                else if(userAccount.email === user.email) group.users.splice(index, 1);
            }

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
                .addClass('group-count')
                .html(group.users.length);

            $('<div></div>').appendTo(elemNew)
                .addClass('icon')
                .addClass('icon-group')
                .addClass('group-icon')
                .addClass('filled');

            $('<option></option>').appendTo($('#users-group-filter'))
                .attr('value', group.__self__)
                .html(group.shortName + ' (' + group.users.length + ')');

        }

        dataGroups = response.data.items;

        insertGroupAssignment()
        insertGroupSelector();
        insertGroupColumns();
        insertUsersGroupsGrid();

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
        // $('#overlay').hide();
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
function insertGroupAssignment() {

    let elemParent = $('#assignment-list ').html('');

    for(let group of dataGroups) {

        let elemRow = $('<div></div>').appendTo(elemParent)
            .addClass('surface-level-2')
            .addClass('group-assignment')
            .addClass('action-keep')
            .attr('data-urn', group.urn)
            .attr('data-link', group.__self__)
            .attr('data-sort', group.shortName)
            .click(function() {});
        
        $('<div></div>').appendTo(elemRow)
            .addClass('with-icon')
            .addClass('button')
            .addClass('icon-remove')
            .addClass('button-group-remove')
            .html('Remove')
            .click(function(e) {
                clickGroupAssignment(e, $(this), 'action-remove');
                updateCounters();
            })

        $('<div></div>').appendTo(elemRow)
            .addClass('with-icon')
            .addClass('button')
            .addClass('icon-check')
            .addClass('button-group-keep')
            .html('Skip')
            .click(function(e) {
                clickGroupAssignment(e, $(this), 'action-keep');
                updateCounters();
            })

        $('<div></div>').appendTo(elemRow)
            .addClass('with-icon')
            .addClass('button')
            .addClass('icon-create')
            .addClass('button-group-add')
            .html('Add')
            .click(function(e) {
                clickGroupAssignment(e, $(this), 'action-add');
                updateCounters();
            })

        $('<div></div>').appendTo(elemRow)
            .addClass('label')
            .addClass('group-name')
            .html(group.shortName);

    } 

}
function clickGroupAssignment(e, elemClicked, className) {

    e.preventDefault();
    e.stopPropagation();

    elemClicked.parent().removeClass('selected')
        .removeClass('action-remove')
        .removeClass('action-keep')
        .removeClass('action-add');

    elemClicked.parent().addClass(className);

}
function insertGroupSelector() {

    $('#new-single-user-processing').hide();

    let elemParent = $('#new-single-user-groups-list').html('');

    for(let group of dataGroups) {

        let elemNew = $('<div></div>').appendTo(elemParent)
            .addClass('surface-level-2')
            .addClass('group')
            .attr('data-urn', group.urn)
            .attr('data-link', group.__self__)
            .attr('data-sort', group.shortName)
            .click(function() {
                $(this).toggleClass('selected');
                updateCounters();
            });
        
        $('<div></div>').appendTo(elemNew)
            .addClass('icon')
            .addClass('icon-check-box')
            .addClass('surface-level-2');

        $('<div></div>').appendTo(elemNew)
            .addClass('label')
            .addClass('group-name')
            .html(group.shortName);

        $('<div></div>').appendTo(elemNew)
            .addClass('label')
            .addClass('group-description')
            .html(group.longName);

        $('<div></div>').appendTo(elemNew)
            .addClass('label')
            .addClass('group-count')
            .html(group.users.length);

        $('<div></div>').appendTo(elemNew)
            .addClass('icon')
            .addClass('icon-group')
            .addClass('group-icon')
            .addClass('filled');

    } 

}
function insertGroupColumns() {

    $('#new-multi-users-processing').hide();

    let elemTHead = $('#new-multi-users-thead').html('');
    let elemTHRow = $('<tr></td>').appendTo(elemTHead);

    $('<th></th>').appendTo(elemTHRow).addClass('mail-column').html('You can type a single mail address or paste a list of multiple addresses in the fields below. In the latter case, separate the addresses by semicolon to create multiple rows in one step.')
    // $('<th></th>').appendTo(elemTHRow).addClass('actions-column');

    for(let group of dataGroups) {

        let elemTH = $('<th></th>').appendTo(elemTHRow)
            .addClass('group-column')
            .attr('data-urn', group.urn)
            .attr('data-link', group.__self__)
            .attr('data-sort', group.shortName);
            
        let elemContent = $('<div></div>').appendTo(elemTH)
            .addClass('group-column-content');

        let elemWrapper = $('<div></div>').appendTo(elemContent)
            .addClass('group-column-wrapper');

        $('<div></div>').appendTo(elemWrapper)
            .addClass('icon')
            .addClass('icon-select-all')
            .addClass('group-column-toggle')
            .click(function(e) {
                
                let elemIcon = $(this);
                let elemCell = $(this).closest('th');
                let index    = elemCell.index() + 1;

                elemIcon.toggleClass('selected-all');

                $('#new-multi-users-tbody').children().each(function() {
                    let elemUpdate = $(this).find('td:nth-child(' + index + ')');

                    if(elemIcon.hasClass('selected-all')) elemUpdate.children().first().addClass('icon-check-box-checked').removeClass('icon-check-box');
                    else elemUpdate.children().first().removeClass('icon-check-box-checked').addClass('icon-check-box');

                });
            })

        $('<div></div>').appendTo(elemWrapper).addClass('group-column-name').html(group.shortName);
        $('<div></div>').appendTo(elemWrapper).addClass('group-column-users').html(group.users.length);


    } 

    $('#new-multi-users-tbody').html('');

    insertMultiUsersRow();

}
function insertMultiUsersRow(value, insertAfter) {

    let elemTBody = $('#new-multi-users-tbody');
    let elemRow     = $('<tr></tr>').appendTo(elemTBody).addClass('multi-users-row');
    let elemMail    = $('<td></td>').appendTo(elemRow).addClass('mail-column');
    let elemActions = $('<div></div>').appendTo(elemMail).addClass('actions-column').addClass('row-actions');

    if(isBlank(value)) value = '';

    if(typeof insertAfter !== 'undefined') elemRow.insertAfter(insertAfter);

    $('<input></input>').prependTo(elemMail)
        .val(value)
        .addClass('user-mail-input')
        .attr('placeholder', 'Enter valid Mail Address')
        .on('keyup', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                insertMultiUsersRow('', $(this).closest('tr'));
            }
        })
        .on('paste', function(e) {
            let elemInput = $(this);
            catchPaste(e, this, function(clipData) {
                console.log('1');
                console.log(clipData);
                clipData = clipData.trim();
                let users = clipData.split(';');
                if(users.length === 1) users = clipData.split(',');
                if(users.length === 1) users = clipData.split(' ');
                // if(users.length === 0) users = clipData.split('\r\n');
                console.log(users.length);
                if(users.length === 1) users = clipData.split(/\r\n/);
                console.log(users);
                if(users.length > 0) {
                    elemInput.val(users[0]);
                    for(let index = 1; index < users.length; index++) insertMultiUsersRow(users[index].trim());
                }

            });
        })
        .focus();

    $('<div></div>').appendTo(elemActions)
        .addClass('button')    
        .addClass('icon')
        .addClass('icon-delete')
        .attr('title', 'Delete this row')
        .click(function() {
            $(this).closest('tr').remove();
            if($('#new-multi-users-tbody').children().length === 0) insertMultiUsersRow();
        });  

    $('<div></div>').appendTo(elemActions)
        .addClass('button')    
        .addClass('icon')
        .addClass('icon-clone')
        .attr('clone', 'Clone this row')
        .click(function() {
            insertMultiUsersRow('', $(this).closest('tr'));
            applyGroupSelection($(this).closest('tr'), 'next');
        });   

    $('<div></div>').appendTo(elemActions)
        .addClass('button')    
        .addClass('icon')
        .addClass('icon-paste-below')
        .attr('title', 'Apply the group selection to all rows below')
        .click(function() {
            applyGroupSelection($(this).closest('tr'), 'all');
        });   

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-select-all')
        .attr('title', 'Deselect all groups')
        .click(function() {
            let elemRow = $(this).closest('tr');
            elemRow.find('.icon-check-box').click();
        });    

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-deselect-all')
        .attr('title', 'Select all groups')
        .click(function() {
            let elemRow = $(this).closest('tr');
            elemRow.find('.icon-check-box-checked').click();
        });    

    for(let group of dataGroups) {
        let elemCell = $('<td></td>').appendTo(elemRow).addClass('group-toggle');
        $('<div></div>').appendTo(elemCell)
            .addClass('icon')
            .addClass('icon-check-box')
            .click(function() {
                $(this).toggleClass('icon-check-box').toggleClass('icon-check-box-checked');
            });
    }

}
function applyGroupSelection(elemRow, range) {

    let selected = [];
    let elemNext = elemRow.nextAll('tr');

    if(range == 'next') elemNext = elemRow.next('tr');

    if(elemNext.length === 0) return;

    elemRow.find('.icon-check-box-checked').each(function() {
        selected.push($(this).parent().index());
    });

    elemNext.each(function() {

        let elemNextRow = $(this);

        elemNextRow.find('.icon-check-box-checked').each(function() {
            $(this).removeClass('icon-check-box-checked').addClass('icon-check-box');
        });

        elemNextRow.children().each(function() {
            let index =   $(this).index();
            if(selected.includes(index)) $(this).children().addClass('icon-check-box-checked').removeClass('icon-check-box');
        });

    });

}
function catchPaste(evt, elem, callback) {

    // Copied from https://stackoverflow.com/questions/9494283/jquery-how-to-get-the-pasted-content/21043738

    if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(callback);
    } else if (evt.originalEvent && evt.originalEvent.clipboardData) {
        callback(evt.originalEvent.clipboardData.getData('text'));
    } else if (evt.clipboardData) {
        callback(evt.clipboardData.getData('text/plain'));
    } else if (window.clipboardData) {
        callback(window.clipboardData.getData('Text'));
    } else {
        setTimeout(function() {
            callback(elem.value)
        }, 100);
    }

}
function insertUsersGroupsGrid() {

    if(isBlank(dataUsers )) return;
    if(isBlank(dataGroups)) return;

    let elemTHead = $('#users-groups-grid-thead').html('');
    let elemTBody = $('#users-groups-grid-tbody').html('');
    let elemTHRow = $('<tr></tr>').appendTo(elemTHead);

    $('#users-groups-grid-processing').hide();

    let elemFirst  = $('<th></th>').appendTo(elemTHRow)
        .addClass('user-group-name')
        .addClass('users-groups-grid-first')
        .attr('colspan', '3');

    let elemSelect = $('<select></select>').appendTo(elemFirst)
        .addClass('button')
        .attr('id', 'users-groups-grid-filter')
        .on('change', function() {
            filterUserGroupsRows();
        });

    $('<option></option>').appendTo(elemSelect).attr('value', 'all').html('All Users');
    $('<option></option>').appendTo(elemSelect).attr('value', 'cha').html('Show Changed Users Only');
    $('<option></option>').appendTo(elemSelect).attr('value', 'new').html('Show New Users Only');
    $('<option></option>').appendTo(elemSelect).attr('value', 'sel').html('Show Selected Users Only');
    $('<option></option>').appendTo(elemSelect).attr('value', 'nog').html('Show Users Without Groups Only');
    $('<option></option>').appendTo(elemSelect).attr('value', 'noc').html('Hide Changed Users');
    $('<option></option>').appendTo(elemSelect).attr('value', 'old').html('Hide New Users');
    $('<option></option>').appendTo(elemSelect).attr('value', 'des').html('Hide Selected Users');

    for(let group of dataGroups) {

        let elemTH = $('<th></th>').appendTo(elemTHRow)
            .addClass('group-column')
            .attr('data-urn', group.urn)
            .attr('data-link', group.__self__)
            .attr('data-sort', group.shortName);
            
        let elemContent = $('<div></div>').appendTo(elemTH)
            .addClass('group-column-content');

        let elemWrapper = $('<div></div>').appendTo(elemContent)
            .addClass('group-column-wrapper');

        $('<div></div>').appendTo(elemWrapper)
            .addClass('group-column-filter')
            .addClass('icon')
            .addClass('icon-starts-with')
            .attr('title', 'Filter for users assigned to this group')
            .click(function() {

                $(this).toggleClass('active');

                let isActive = $(this).hasClass('active');

                $('.icon-starts-with').removeClass('active');
                $('#users-groups-grid-tbody').children().removeClass('hidden');

                if(isActive) {

                    $(this).addClass('active');

                    let elemCell = $(this).closest('th');
                    let index    = elemCell.index() + 3;

                    $('#users-groups-grid-tbody').children().each(function() {
                        
                        let elemParent = $(this).find('td:nth-child(' + index + ')');
                        let isSelected = elemParent.find('.icon-check').length > 0;

                        if(!isSelected) elemParent.closest('tr').addClass('hidden');

                    });
                    
                }

            });

        $('<div></div>').appendTo(elemWrapper)
            .addClass('icon')
            .addClass('icon-select-all')
            .addClass('group-column-toggle')
            .attr('title', 'Select / deselect all')
            .click(function(e) {
                
                let elemIcon = $(this);
                let index    = $(this).closest('th').index() + 3;

                elemIcon.toggleClass('selected-all');

                let select = elemIcon.hasClass('selected-all');

                $('#users-groups-grid-tbody').children().each(function() {

                    let elemCell = $(this).find('td:nth-child(' + index + ')');
                    toggleUserGroupAssignment(elemCell, select); 

                });
            })

        $('<div></div>').appendTo(elemWrapper).addClass('group-column-name').html(group.shortName);
        $('<div></div>').appendTo(elemWrapper).addClass('group-column-users').html(group.users.length);

    }

    for(let user of dataUsers) {

        let elemRow = $('<tr></tr>').appendTo(elemTBody);
            elemRow.attr('data-id', user.userId);

        if(isBlank(user.lastLoginTime)) elemRow.addClass('new');

        let elemCheckbox = $('<td></td>').appendTo(elemRow).addClass('user-group-checkbox');

        $('<div></div>').appendTo(elemCheckbox)
            .addClass('icon')
            .addClass('icon-check-box')
            .click(function() {
                $(this).toggleClass('icon-check-box').toggleClass('icon-check-box-checked');
            });

        $('<td></td>').appendTo(elemRow).html(user.displayName).addClass('user-group-name');

        $('<td></td>').appendTo(elemRow)
            .addClass('icon')
            .addClass('icon-ends-with')
            .addClass('user-groups-filter')
            .attr('title', 'Filter for groups assigned to this user')
            .click(function() {

                $(this).toggleClass('active');

                let isActive = $(this).hasClass('active');

                $('.icon-ends-with').removeClass('active');
                $('.group-column').removeClass('hidden');
                $('.user-group-toggle').removeClass('hidden');

                if(isActive) {

                    $(this).addClass('active');

                    let elemRow = $(this).closest('tr');
                    
                    $('.group-column').each(function() {
                        
                        let elemColumn = $(this);
                        let index      = elemColumn.index() + 3;
                        let elemCell   = elemRow.find('td:nth-child(' + index + ')');
                        let isSelected = elemCell.find('.icon-check').length > 0;

                        if(!isSelected) {
                            
                            elemColumn.addClass('hidden');

                            $('#users-groups-grid-tbody').children().each(function() {
                                let elemCellToggle = $(this).find('td:nth-child(' + index + ')');
                                    elemCellToggle.addClass('hidden');
                            });
   
                        }

                    });
    
                }

            });

        for(let group of dataGroups) {

            let elemCell   = $('<td></td>').appendTo(elemRow).addClass('user-group-toggle');
            let elemIcon   = $('<div></div>').appendTo(elemCell).addClass('user-group-toggle-icon').addClass('icon')

            for(let groupUser of group.users) {
                if(user.userId === groupUser.userId) {
                    elemCell.addClass('assigned');
                    elemIcon.addClass('icon-check');
                }
            }

            if(!elemCell.hasClass('assigned')) elemIcon.addClass('icon-radio-unchecked')

            elemCell.click(function(e) {
                clickUserGroupToggle(e, $(this));
            });
                
        }
    }

}
function clickUserGroupToggle(e, elemClicked) {

    let elemLast = $('.user-group-toggle.last').first();

    if((e.shiftKey) && (elemLast.length > 0)) {

        let selected = elemLast.find('.icon-check').length > 0;
        let xStart   = elemLast.index();
        let yStart   = elemLast.closest('tr').index();
        let xEnd     = elemClicked.index();
        let yEnd     = elemClicked.closest('tr').index();

        if(xStart > xEnd) { xStart = xEnd; xEnd = elemLast.index();}
        if(yStart > yEnd) { yStart = yEnd; yEnd = elemLast.closest('tr').index(); }

        for(let iCol = xStart; iCol <= xEnd; iCol++) {
            for(let iRow = yStart; iRow <= yEnd; iRow++) {
                let elemRow  = $('#users-groups-grid-tbody tr').eq(iRow);
                let elemCell = elemRow.find('td').eq(iCol);
                if(!elemRow.hasClass('hidden')) {
                    if(!elemCell.hasClass('hidden')) {
                        toggleUserGroupAssignment(elemCell, selected);                
                    }
                }
            }
        }

    } else {

        let select = elemClicked.find('.icon-check').length === 0;
        toggleUserGroupAssignment(elemClicked, select);

    }

    $('.user-group-toggle').removeClass('last');
    elemClicked.addClass('last');

}
function toggleUserGroupAssignment(elemCell, select) {

    elemCell.removeClass('changed');

    let elemIcon   = elemCell.children().first();
    let isAssigned = elemCell.hasClass('assigned');

    if(select) elemIcon.addClass('icon-check').removeClass('icon-radio-unchecked');
            else elemIcon.removeClass('icon-check').addClass('icon-radio-unchecked');

    if(isAssigned) { if(elemIcon.hasClass('icon-radio-unchecked')) elemCell.addClass('changed'); }
              else { if(elemIcon.hasClass('icon-check'          )) elemCell.addClass('changed'); }

}
function filterUserGroupsRows() {

    let elemTBody = $('#users-groups-grid-tbody');
    let value     = $('#users-groups-grid-filter').val();

    elemTBody.children().show();

    switch(value) {

        case 'cha':
            elemTBody.children().each(function() { if($(this).find('.changed').length === 0) $(this).hide(); });
            break;

        case 'new':
            elemTBody.children().hide();
            elemTBody.children('.new').show();
            break;

        case 'sel':
            elemTBody.children().each(function() { if($(this).find('.icon-check-box-checked').length === 0) $(this).hide(); });
            break;            

        case 'nog':
            elemTBody.children().each(function() { if($(this).find('.assigned').length > 0) $(this).hide(); });
            break;            

        case 'noc':
            elemTBody.children().each(function() { if($(this).find('.changed').length > 0) $(this).hide(); });
            break;

        case 'old':
            elemTBody.children().show();
            elemTBody.children('.new').hide();
            break;

        case 'des':
            elemTBody.children().each(function() { if($(this).find('.icon-check-box-checked').length > 0) $(this).hide(); });
            break;   

    }

}
function filterUsers() {

    let filterNew   = $('#users-filter-new').hasClass('active');
    let filterValue = $('#users-filter').val().toLowerCase();
    let filterGroup = $('#users-group-filter').val();

    $('#users').children().show();

    $('#users').children().each(function() {
        let cellValue = $(this).attr('data-sort').toLowerCase() + $(this).attr('data-email').toLowerCase() + $(this).attr('data-login').toLowerCase();
        let matches   = (cellValue.indexOf(filterValue) > -1);
        if($(this).hasClass('selected')) matches = true;
        if(matches) $(this).show(); else $(this).hide();
    });

    if(filterNew) $('#users').find('.existing').hide();

    if(filterGroup !== '--') {

        for(let group of dataGroups) {

            if(group.__self__ === filterGroup) {

                $('#users').children().each(function() {

                    let elemUser = $(this);
                    let hide     = true;

                    for(let user of group.users) {

                        if(user.userId === elemUser.attr('data-id')) hide = false;

                    }

                    console.log(hide);

                    if(hide) elemUser.hide();

                });

            }
        }
    }

}



// Update tab counters
function updateCounters() {

    let countGroups      = $('#groups').children('.selected').length;
    let countUsers       = $('#users').children('.selected').length;
    let countWorkspaces  = $('#views-list').children('.selected').length;
    let countCharts      = $('#charts-list').children('.selected').length;
    let countAssignments = $('.group-assignment.action-remove').length + $('.group-assignment.action-add').length;
    let valueTheme       = $('#theme').find('.button.default').attr('data-value');

    $('#toolbar-text').hide();

    if(countGroups > 0) {
        $('#count-groups').html(countGroups + ' group(s)').show();
        $('#toolbar-text').show();
    } else $('#count-groups').hide();

    if(countUsers > 0) {
        $('#count-users').html(countUsers + ' user(s)').show();
        $('#toolbar-text').show();
    } else $('#count-users').hide();

    if(countWorkspaces > 0) {
        $('#count-workspaces').html(countWorkspaces + ' view(s)').show();
        $('#toolbar-text').show();
    } else $('#count-workspaces').hide();

    if(countCharts > 0) {
        $('#count-charts').html(countCharts + ' chart(s)').show();
        $('#toolbar-text').show();
    } else $('#count-charts').hide();

    if(countAssignments > 0) {
        $('#count-assignments').html(countAssignments + ' assignment(s)').show();
        $('#toolbar-text').show();
    } else $('#count-assignments').hide();

    if(valueTheme !== '') {
        $('#count-theme').html(valueTheme.toUpperCase() + ' theme').show();
        $('#toolbar-text').show();
    } else $('#count-theme').hide();
 
}


// User Creation
function createNewUser(addAnother) {

    $('#new-single-user-processing').show();
    $('#new-single-user-status').removeClass('success').removeClass('error').html('');

    let params = {
        mail   : $('#mail').val(),
        groups : []
    }

    $('#new-single-user-groups-list').find('.group.selected').each(function() {
        params.groups.push($(this).attr('data-urn'));
    });

    $.post('/plm/add-user', params, function(response) {

        $('#new-single-user-processing').hide();
        $('#mail').focus().select();

        if(response.error) {

            $('#new-single-user-status').html('Error when adding user ' + params.mail + ':</br>' + response.message).addClass('error');

        } else {

            $('#new-single-user-status').html('User ' + params.mail + ' has been added</br>with ' + params.groups.length + ' roles').addClass('success');

            if(!addAnother) {
                $('#overlay').hide();
                $('.dialog').hide();
                getGroups();
                getUsers();
            } 

        }

    });

}
function createNewUsers() {

    $('#new-multi-users-processing').show();

    let requests = [];

    $('#new-multi-users-tbody').children().each(function() {

        if(requests.length <= maxRequests) {

            let elemRow = $(this);
            let mail    = elemRow.find('.user-mail-input').val();

            if(!elemRow.hasClass('failed')) {

                if(!isBlank(mail)) {

                    let params = {
                        index  : iProgress,
                        mail   : mail,
                        groups : []
                    }

                    elemRow.find('.icon-check-box-checked').each(function() {
                        
                        let elemCell = $(this).closest('td');
                        let index    = elemCell.index() + 1;
                        let elemHead = $('#new-multi-users-thead').find('th:nth-child(' + index + ')');

                        params.groups.push(elemHead.attr('data-urn'));

                    });

                    console.log(params);

                    elemRow.attr('data-index', iProgress++);
                    requests.push($.post('/plm/add-user', params));

                }
            }

        }

    });

    Promise.all(requests).then(function(responses) {

        for(let response of responses) {

            let index = response.params.index;

            $('#new-multi-users-tbody').children().each(function() {
            
                let elemRow = $(this);
                if(elemRow.attr('data-index') == index) {
                    if(response.error) {
                        elemRow.addClass('failed');
                        let elemCell = elemRow.children().first();
                        $('<div></div>').prependTo(elemCell)
                            .addClass('user-creation-error')
                            .addClass('icon')
                            .addClass('icon-important')
                            .attr('title', response.message);
                    } else elemRow.remove();
                }
            });

        }

        if(responses.length === 0) {

            $('#new-multi-users-processing').hide();
    
            if($('#new-multi-users-tbody').find('.failed').length === 0) {

                getGroups();
                getUsers();
                $('#overlay').hide();
                $('.dialog').hide();
            
            }

        } else createNewUsers();

    });

}



// Users Groups Assignment
function updateUserGroupsAssignments(close) {

    $('#users-groups-grid-processing').show();

    let changes = [];

    iProgress = 0;

    $('#users-groups-grid-tbody').children().each(function() {

        let elemRow     = $(this);
        let elemChanges = elemRow.children('.changed');
        let hasChanged  = elemChanges.length > 0;

        if(hasChanged) {

            let change = {
                userId  : elemRow.attr('data-id'),
                elemRow : $(this),
                add     : [],
                remove  : []
            };

            elemChanges.each(function() {

                let elemChange = $(this);
                let index      = elemChange.index() - 1;
                let selected   = elemChange.find('.icon-check').length > 0;
                let elemGroup  = $('#users-groups-grid-thead').find('th:nth-child(' + index + ')');

                if(selected) {
                    change.add.push(elemGroup.attr('data-urn'));
                } else {
                    change.remove.push(elemGroup.attr('data-link').split('/').pop());
                }

            });

            changes.push(change);

        }

    });

    applyUsersGroupsChanges(changes, close);

    $('#users-groups-grid-tbody').find('.changed').removeClass('changed');

}
function applyUsersGroupsChanges(changes, close) {

    if(iProgress < changes.length) {

        let change   = changes[iProgress];
        let requests = [];
        let elemRow  = change.elemRow;

        if(change.add.length > 0) requests.push($.post('/plm/assign-groups', { userId : change.userId, groups : change.add}));

        for(let groupdId of change.remove) requests.push($.post('/plm/unassign-group', { userId : change.userId, groupId : groupdId}));

        Promise.all(requests).then(function(responses) {
            iProgress++;
            elemRow.find('.changed').removeClass('changed');
            applyUsersGroupsChanges(changes, close);
        });


    } else {

        getUsers();
        getGroups();

        // $('#users-groups-grid-processing').hide();

        if(close) {
            $('.dialog').hide();
            $('#overlay').hide();
        }

    }

}


// Apply changes
function startProcessing() {

    $('#console-content').html('');
    $('#views-confirm').addClass('disabled');
    $('#stop').removeClass('disabled');
    $('#start').addClass('disabled');

    groups             = [];
    users              = [];
    views              = [];
    assignments.remove = [];
    assignments.add    = [];
    stopped            = false;
    deleteViews        = $('#views-confirm').hasClass('icon-toggle-on');

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

    $('.group-assignment.action-remove').each(function() { assignments.remove.push($(this).attr('data-link')); });
    $('.group-assignment.action-add'   ).each(function() { assignments.add.push(   $(this).attr('data-urn' )); });

    addLogEntry('User profiles to be updated : ' + users.length, '');

    if(users.length > 0) {
        sortArray(users,  'name');
        setAssignments();
    } else {
        addLogEnd();        
        endProcessing();        
    }
}
function endProcessing() {

    $('#views-confirm').removeClass('disabled');
    $('#stop').addClass('disabled');
    $('#start').removeClass('disabled');

    if((assignments.remove.length > 0) || (assignments.add.length > 0)) {
        getUsers();
        getGroups();
    }


}


// #1 Apply Workspace Views
function setAssignments() {

    if(stopped) return;

    addLogSeparator();

    if((assignments.remove.length === 0) && (assignments.add.length === 0)) {

        addLogEntry('Skipping Group Assignment Update', 'head');
        setWorkspaceViews();

    } else {

        addLogEntry('Seeting Groups (remove ' + assignments.remove.length + ', add ' + assignments.add.length + ')', 'head');
        addLogSpacer();

        if(assignments.add.length > 0) assignGroups(0);
        else removeGroups(0);

    }

}
function assignGroups(index) {

    if(stopped) return;

    if(index < users.length) {

        let requests = [];
        let limit    = index + maxRequests;

        if(limit > users.length) limit = users.length;

        for(index; index < limit; index++) {

            let user   = users[index];
            let params = {
                userId : user.userId,
                groups : assignments.add
            }

            addLogEntry(user.name, 'count', index + 1);
            requests.push($.post('/plm/assign-groups', params));

        }

        Promise.all(requests).then(function(responses) {
            console.log(responses);
            assignGroups(index + 1);
        });
 
    } else {
        if(assignments.remove.length > 0) removeGroups(0);
        else setWorkspaceViews();
    }

}
function removeGroups(index) {

    if(stopped) return

    if(index < users.length) {

        let requests = [];
        let user     = users[index];

        if(assignments.add.length === 0) addLogEntry(user.name, 'count', index + 1);

        for(let group of assignments.remove) {
            requests.push($.post('/plm/unassign-group', {
                userId  : user.userId,
                groupId : group.split('/').pop()
            }));
        }

        Promise.all(requests).then(function(responses) {
            removeGroups(index + 1);
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
        setTheme();
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
        setTheme();
    }

}


// #4 Apply Theme
function setTheme() {

    if(stopped) return;

    addLogSeparator();
    
    let value = $('#theme').find('.default').attr('data-value');

    if(value === '') {
        addLogEntry('Skipping Themes Update', 'head');
        addLogEnd();
        endProcessing();
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

        limit += index;

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
        addLogEnd();
        endProcessing();
    }

}