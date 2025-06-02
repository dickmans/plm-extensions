$(document).ready(function() {

    let elemColumns = $('<div></div>').appendTo($('#content')).attr('id', 'applications');

    for(let column of menu) {

        let elemColumn = $('<div></div>').appendTo(elemColumns)
        let first      = true;

        for(let category of column) {

            let elemTitle = $('<div></div>').appendTo(elemColumn)
                .addClass('menu-title')
                .html(category.label);

            if(!first) elemTitle.css('margin-top', '78px');

            let elemCommands = $('<div></div>').appendTo(elemColumn)
                .addClass('menu-commands');

            for(let command of category.commands) {

                let elemCommand = $('<div></div>').appendTo(elemCommands)
                    .addClass('menu-command')
                    .attr('data-url', command.url)
                    .click(function(e) {
                        clickMenuCommand($(this));
                    });

                $('<div></div>').appendTo(elemCommand)
                    .addClass('menu-command-icon')
                    .addClass('icon')
                    .addClass(command.icon);

                let elemCommandName = $('<div></div>').appendTo(elemCommand)
                    .addClass('menu-command-name');

                $('<div></div>').appendTo(elemCommandName)
                    .addClass('menu-command-title')
                    .html(command.title);

                $('<div></div>').appendTo(elemCommandName)
                    .addClass('menu-command-subtitle')
                    .html(command.subtitle);

            }

            first = false;

        }
    }

});