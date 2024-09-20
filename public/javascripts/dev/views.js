let iWorkspace  = 0;
let maxRequests = 5;
let workspaces = [];

let stopped = false;


$(document).ready(function() {

    $('#source-tenant').val(tenant);
    $('#target-tenant').val(tenant);

    setUIEvents();
    appendOverlay(false);
    
    getWorkspaces();
    getUsers();
    getGroups();

});


function setUIEvents() {

    $('#source-tenant').keydown(function (e) {
        if (e.keyCode == 13) {
            getViews();
        }
    });
    $('#target-tenant').keydown(function (e) {
        if (e.keyCode == 13) {
            getUsers();
            getGroups();
        }
    });

    $('#console-toggle').click(function() {
        $(this).toggleClass('icon-chevron-right').toggleClass('icon-chevron-left');
        $('body').toggleClass('no-console');
    });



    
    $('#comparison-start').click(function() {
        if($(this).hasClass('disabled')) return;
       startComparison();
    });
    $('#comparison-stop').click(function() {
        if($(this).hasClass('disabled')) return;
        addLogEntry('### Comparison stopped ###', 'stop');
        endComparison();
     });



    $('#open-limitations').click(function() {
        $('#dialog-limitations').show();
        $('#overlay').show();
    }); 
    $('#close-limitations').click(function() {
        $('#dialog-limitations').hide();
        $('#overlay').hide();
    }); 

    $('#comparison-report').click(function() {
        $('#dialog-report').show();
        $('#overlay').show();
    }); 
    $('#close-report').click(function() {
        if($(this).hasClass('disabled')) return;
        $('#dialog-report').hide();
        $('#overlay').hide();
    }); 

}


// Get Tenant Information
function getWorkspaces() {

    workspaces = [];
    iWorkspace = 0;

    $('#views-selected').html('');
    $('#views-all').html('');

    $.get('/plm/workspaces', { tenant : $('#target-source').val(), bulk : false }, function(response) {

        console.log(response);

        for(let workspace of response.data.items) {
            workspaces.push({
                link  : workspace.link,
                title : workspace.title
            })
        }

        sortArray(workspaces, 'title');
        getWorkspaceViews();

    })

}
function getWorkspaceViews() {

    if(iWorkspace < workspaces.length) {

        let requests = [];
        let limit    = iWorkspace + maxRequests;

        if(limit > workspaces.length -1) limit = workspaces.length;

        for(iWorkspace; iWorkspace < limit; iWorkspace++) {

            console.log(iWorkspace);

            requests.push($.get('/plm/tableaus', {
                tenant : $('#target-source').val(), 
                link   : workspaces[iWorkspace].link,
                title  : workspaces[iWorkspace].title 
            }));


        }

        Promise.all(requests).then(function(responses) {

            console.log(responses);

            for(let response of responses) {
                for(let view of response.data) {

                    let elemView = $('<div></div>').appendTo($('#views-all'))
                        .attr('data-link', view.link)
                        .attr('data-sort', response.params.title + ' ' + view.title)
                        .addClass('workspace-view')
                        .click(function() {
                            moveSelectedItem($(this));
                        });
                    
                    $('<div></div>').appendTo(elemView)
                        .html(response.params.title);

                    $('<div></div>').appendTo(elemView)
                        .html(view.title);
        
                }
            }

            getWorkspaceViews();

        });

    } else {

        $('#overlay').hide();

    }

}
function getUsers() {

    $('#users-selected').html('');
    $('#users-all').html('');

    $.get('/plm/users', { tenant : $('#target-tenant').val(), bulk : false }, function(response) {

        console.log(response);

        for(let user of response.data.items) {
            $('<div></div>').appendTo($('#users-all'))
                .attr('data-sort', user.displayName)
                .html(user.displayName)
                .click(function() {
                    moveSelectedItem($(this));
                })
        }

    })

}
function getGroups() {

    $('#groups-selected').html('');
    $('#groups-all').html('');

    $.get('/plm/groups', { tenant : $('#target-tenant').val(), bulk : false }, function(response) {

        console.log(response);

        for(let group of response.data.items) {
            $('<div></div>').appendTo($('#groups-all'))
                .attr('data-sort', group.shortName)
                .html(group.shortName)
                .click(function() {
                    moveSelectedItem($(this));
                })
        }

    })

}


// User selection
function moveSelectedItem(elemClicked) {

    let elemParent  = elemClicked.parent();
    let elemSibling = elemParent.siblings().first();
    let id          = elemSibling.attr('id');

    elemClicked.appendTo(elemSibling);

    $('#' + id + ' [data-sort]').sort(function(a, b) {
        if ($(a).data("sort") < $(b).data("sort")) {
          return -1;
        } else {
          return 1;
        }
      }).appendTo($('#' + id));

}




// Add outputs
function addLogEntry(text, type) {

    if(stopped) return;

    if(isBlank(type)) type = 'std';
    
    let prefix    = '';
    let className = type;

    switch(type) {

        case 'diff'  : prefix = '! '; break;
        case 'match' : prefix = '+ '; break;
        case 'head'  : prefix = ''   ; break;
        case 'stop'  : prefix = ''   ; break;
        default      : prefix = ' - '; break;

    }

    $('<div></div>').appendTo($('#console'))
        .addClass('console-text')
        .addClass(className)
        .html('<span>' + prefix + '</span>' + text);

    let divElement = document.getElementById('console');
        divElement.scrollTop = divElement.scrollHeight;

}
function addLogSeparator() {

    $('<div></div>').appendTo($('#console '))
        .addClass('console-separator')
        .html('----------------------------------------------------------------------------');

    let divElement = document.getElementById('console');
        divElement.scrollTop = divElement.scrollHeight;

}
function addActionEntry(params) {

    let elemParent = $('#actions-' + params.step);

    let elemNew = $('<div></div>').appendTo(elemParent)
        .addClass('action')
        .attr('data-url', params.url);

    let elemText = $('<div></div>').appendTo(elemNew)
        .addClass('button')
        .addClass('action-text')
        .click(function(e) {
            let url  = 'https://' + environments.target.tenantName + '.autodeskplm360.net' + $(this).parent().attr('data-url');
            window.open(url, '_blank');
        });       

    $('<div></div>').appendTo(elemText)
        .addClass('action-instructions')
        .html(params.text);
        $('<div></div>').appendTo(elemNew)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-check-box')
        .addClass('action-icon')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).toggleClass('icon-check-box').toggleClass('icon-check-box-checked').toggleClass('checked');
        });

}