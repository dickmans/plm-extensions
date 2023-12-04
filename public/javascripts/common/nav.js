// Insert user's My Outstanding Work (filter for defined workspaces if needed)
function insertMOW(id, includeWorkspaces) {

    if(isBlank(id)) id = 'mow';
    if(isBlank(includeWorkspaces)) includeWorkspaces = [];

    let elemList = $('#' + id + '-list');
        elemList.html('');

    $('#' + id + '-processing').show();

    $.get( '/plm/mow', {}, function(response) {

        let data    = response.data;
        let counter = 0;

        $('#' + id + '-processing').hide();

        for(item of data.outstandingWork) {

            let dateClass   = '';
            let date        = '';
            let workspace   = item.workspace.title;

            if((includeWorkspaces.length === 0) || (includeWorkspaces.includes(workspace))) {

                counter++;

                if(item.hasOwnProperty('milestoneDate')) {
                    let targetDate = new Date(item.milestoneDate);
                    date = targetDate.toLocaleDateString();
                    dateClass = 'in-time';
                }
                if(item.hasOwnProperty('milestoneStatus')) {
                    if(item.milestoneStatus === 'CRITICAL') dateClass = 'late';
                }

                let elemItem = $('<div></div>');
                    elemItem.addClass('mow-row');
                    elemItem.attr('data-link', item.item.link);
                    elemItem.attr('data-title', item.item.title);

                let elemItemTitle = $('<div></div>');
                    elemItemTitle.addClass('link');
                    elemItemTitle.addClass('nowrap');
                    elemItemTitle.addClass('mow-descriptor');
                    elemItemTitle.appendTo(elemItem);

                let elemItemWorkspace = $('<div></div>');
                    elemItemWorkspace.addClass('mow-workspace');
                    elemItemWorkspace.addClass('nowrap');
                    elemItemWorkspace.appendTo(elemItem);

                let elemItemDate = $('<div></div>');
                    elemItemDate.addClass('mow-date');
                    elemItemDate.addClass(dateClass);
                    elemItemDate.appendTo(elemItem);

                elemItemTitle.html(item.item.title);;
                elemItemWorkspace.html(workspace);
                elemItemDate.html(date);

                elemItem.appendTo(elemList);
                elemItem.click(function(e) { 
                    e.preventDefault();
                    e.stopPropagation();
                    clickMOWItem($(this));
                });

            }

        }

        $('#' + id + '-counter').html(counter);

    });

}
function clickMOWItem(elemClicked) {}