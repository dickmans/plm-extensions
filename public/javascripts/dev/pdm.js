$(document).ready(function() {

    setUIEvents();

    insertVaultBrowser();
    insertVaultEngineeringChangeOrders();
    insertVaultGroups();
    insertVaultRoles();
    insertVaultUsers();
    insertVaultSystemOptions();

});



function setUIEvents() {

    $('#designs-dashboard').click(function() {
        $(this).addClass('default');
        $(this).siblings('.button').removeClass('default');
        $('#header-subtitle').html('Designs Management');
        $('body').addClass('screen-designs').removeClass('screen-search').removeClass('screen-changes').removeClass('screen-admin');
    });
    $('#search-dashboard').click(function() {
        $(this).addClass('default');
        $(this).siblings('.button').removeClass('default');
        $('#header-subtitle').html('Search');
        $('body').removeClass('screen-designs').addClass('screen-search').removeClass('screen-changes').removeClass('screen-admin');
    });
    $('#changes-dashboard').click(function() {
        $(this).addClass('default');
        $(this).siblings('.button').removeClass('default');
        $('#header-subtitle').html('Change Management');
        $('body').removeClass('screen-designs').removeClass('screen-search').addClass('screen-changes').removeClass('screen-admin');
    });
    $('#admin-dashboard').click(function() {
        $(this).addClass('default');
        $(this).siblings('.button').removeClass('default');
        $('#header-subtitle').html('Administration');
        $('body').removeClass('screen-landidesignsng').removeClass('screen-search').removeClass('screen-changes').addClass('screen-admin');
    });


    $('#search-text').keyup(function() {

        let timestamp   = new Date().getTime();
        let elemContent = $('#search-list').html('');

        elemContent.attr('timestamp', timestamp);
        elemContent.attr('query', $(this).val());

        let params = { 
            query     : $(this).val(),
            timestamp : timestamp
        }



        $.get('/vault/search', params, function(response)  {

            let elemList = $('#search-list');

            if(elemContent.attr('timestamp') === response.params.timestamp) {
            if(elemContent.attr('query') === response.params.query) {
                console.log(response);

                let items = [];
                let counter = 1;

                for(result of response.data.results) {
                    
                    // items.push({
                    //     link : result.url,
                    //     partNumber : result.name,
                    //     title : result.name,
                    //     subtitle : result.category
                    // });

                    for(let result of response.data.results) {
                        genPDMTile(result, { number : true, displayEntity : true, tileNumber : counter++}).appendTo(elemList);
                    }

                }

                console.log(items);

                // genTilesList('search', items, { tileIcon : 'icon-product', layout : 'grid'});

            }
            }

            
        });

    });


    // $('#server').click(function() { getServerInfo(); });
    // $('#root-folders').click(function() { getRootFolders(); });
    // $('#files').click(function() { getFiles(); });
    // $('#search').click(function() { searchEntities(); });

}


function getServerInfo() {

    $('#overlay').show();
    $('#list').html('');

    $.get('/vault/server-info', {}, function(response) {

        $('#overlay').hide();
        $('#header-subtitle').html('Server Information');
        $('#list').html(response.data.name);
    
    });

}


function getVaults() {

    $('#overlay').show();
    $('#list').html('');
    
    $.get('/vault/vaults', {}, function(response) {

        $('#overlay').hide();
        $('#header-subtitle').html('Vaults');

        for(let vault of response.data.results) {
            $('#list').append('<div>' + vault.name + '</div>');
        }

    });

}


function getRootFolders() {

    $('#overlay').show();
    $('#list').html('');
    
    $.get('/vault/root-folders', { vaultId : vaultId }, function(response) {
        
        $('#overlay').hide();
        $('#header-subtitle').html('Root Folders');

        let elemColumn = $('<div></div>').appendTo($('#list'));

        for(let element of response.data.results) {

            $('<div></div>').appendTo(elemColumn)
                .attr('data-id', element.id)
                .attr('data-link', element.url)
                .addClass('list-item')
                .addClass('with-icon')
                .addClass('icon-folder')
                .html(element.name)
                .click(function() {
                    insertSubFolders($(this));
                    insertFolderContents($(this));
                    insertFolderProperties($(this));
                });
        }

    });

}
function insertFolderProperties(elemClicked) {

    $('#overlay').show();

    let elemDetails = $('#details').html('');

    $.get('/vault/folder-properties', { link : elemClicked.attr('data-link') }, function(response) {
        $('#overlay').hide();
        for(let property of response.data.properties) {
            appendField(elemDetails, property.definition.displayName, property.value);
        }
    });

}
function insertSubFolders(elemClicked) {

    elemClicked.parent().nextAll().remove();
    
    $.get('/vault/subfolders', { link : elemClicked.attr('data-link') }, function(response) {
    
        $('#overlay').hide();

        let elemColumn = $('<div></div>').appendTo($('#list'));

        for(let element of response.data.results) {

            $('<div></div>').appendTo(elemColumn)
                .attr('data-id', element.id)
                .attr('data-link', element.url)
                .addClass('list-item')
                .addClass('with-icon')
                .addClass('icon-folder')
                .html(element.name)
                .click(function() {
                    insertSubFolders($(this));
                    insertFolderContents($(this));
                    insertFolderProperties($(this));
                });
        }


    });

}
function insertFolderContents(elemClicked) {

    $('#overlay').show();
    $('#contents').html('');

    $.get('/vault/folder-contents', { link : elemClicked.attr('data-link'), includeFolders : false }, function(response) {
        
        $('#overlay').hide();

        for(let file of response.data.results) {

            console.log(file);

            $('<div></div>').appendTo($('#contents'))
                .attr('data-id', file.id)    
                .attr('data-link-file', file.url)    
                // .attr('data-link-file-version', file.fileVersion.url)    
                .html(file.name)
                .click(function() {
                    $('#overlay').show();
                    // insertFileThumbnail($(this).attr('data-link-file-version'));
                    insertFileProperties($(this).attr('data-link-file'));
                });

        }

    });

}
function insertFileProperties(link) {

    let elemDetails = $('#details').html('');

    $.get('/vault/file-properties', { link : link }, function(response) {

        $('#overlay').hide();
    
        console.log(response);

        for(let property of response.data.properties) {
            appendField(elemDetails, property.definition.displayName, property.value);
        }

    });

}



function getFiles() {

    $('#list').html('');
    
    $.get('/vault/files', {}, function(response) {
        console.log(response);

        for(let file of response.data.results) {

            let elemFile = $('<div></div>').appendTo($('#list'))
                .attr('data-id', file.id)    
                .attr('data-link-file', file.url)    
                .attr('data-link-file-version', file.fileVersion.url)    
                .html(file.fileVersion.name)
                .click(function() {
                    insertFileThumbnail($(this).attr('data-link-file-version'));
                    insertFileProperties($(this).attr('data-link-file-version'));
                });

        }

    });

}





function appendField(elemParent, label, value) {


    let elemField = $('<div></div>').appendTo(elemParent)
        .addClass('field');

    let elemFieldLabel = $('<div></div>').appendTo(elemField)
        .addClass('field-label')
        .html(label);

    let elemFieldValue = $('<div></div>').appendTo(elemField)
        .addClass('field-value')
        .html(value);

}





function insertFileThumbnail(link) {

    let elemThumbnail = $('#thumbnail').html('');


    $.get('/vault/file-thumbnail', { link : link }, function(response) {
    
        console.log(response);

        let elemImage = $('<img></img>').appendTo(elemThumbnail);


        let dataImage = response.data;

        // console.log(dataImage);
        // let test = dataImage.toString('base64');

        // console.log(test);


        // elemImage.attr('src', 'data:image/jpeg;base64,' + BinaryToBase64(response.data));
        // elemImage.css('background', 'url(data:image/png;base64,' + dataImage + ')');
        elemImage.attr('src', 'data:image/jpeg;base64,' + dataImage);



        // var base64Image = Buffer.from(dataImage, 'binary').toString('base64');

        // elemImage.attr('src', 'data:image/jpeg;base64,' + base64Image);


        // for(let property of response.data.properties) {

        //     appendField(elemDetails, property.definition.displayName, property.value);
        // }


    });

}




function searchEntities() {

    let params = {
        entities : ['File'],
        filters : [
            {
                property : 'Part Number',
                operator : 'Contains',
                value    : 'Supermarket'
            }
        ]
    };

    $.post('/vault/search', params, function(response) {
        console.log(response);
    });

}