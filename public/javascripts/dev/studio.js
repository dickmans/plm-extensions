$(document).ready(function() {

    setUIEvents();
    setLibrary('navigation'    , 'Navigation'    , 'icon-folder' );
    setLibrary('items'         , 'Item Data'     , 'icon-product');
    setLibrary('classification', 'Classification', 'icon-book'   );
    
    $('.panel-type').first().click();

});


function setUIEvents() {

    $('#toggle-layout').click(function() {
        $('body').toggleClass('wide');
    });

    $('#run').click(function() {
        runPanel();
    });

}


function setLibrary(category, header, icon) {

    let elemParent = $('#library-list');
    let listTypes  = panelTypes[category];

    $('<div></div>').appendTo(elemParent)
        .addClass('panel-section')            
        .addClass('button')            
        .addClass('with-icon')            
        .addClass('icon-chevron-down')            
        .html(header)
        .click(function() {
            $(this).toggleClass('icon-chevron-down').toggleClass('icon-chevron-right');
            $(this).nextUntil('.panel-section').toggleClass('hidden');
        });

    for(let panelType of listTypes) {

        let elemPanelType = $('<div></div>').appendTo(elemParent)
            .addClass('panel-type')
            .attr('id', 'panel-type-' + panelType.id)
            .attr('data-id', panelType.id)
            .attr('data-category', category)
            .click(function() {
                selectPanelType($(this));
            });

        $('<div></div>').appendTo(elemPanelType)
            .addClass('panel-icon')            
            .addClass('icon')            
            .addClass(icon);

        $('<div></div>').appendTo(elemPanelType)
            .addClass('panel-title')            
            .html(panelType.title);

        $('<div></div>').appendTo(elemPanelType)
            .addClass('panel-description')            
            .html(panelType.description);

    }

}


function selectPanelType(elemClicked) {

    let id        = elemClicked.attr('data-id');
    let category  = elemClicked.attr('data-category');
    let listTypes = panelTypes[category];

    $('.panel-type').removeClass('selected');
    elemClicked.addClass('selected');

    for(let panelType of listTypes) {
        if(panelType.id === id) {
            setPanelTypeInputsAndSettings(panelType);
        }
    }

}
function setPanelTypeInputsAndSettings(panelType) {

    $('#settings-title'      ).html(panelType.title);
    $('#settings-description').html(panelType.description);
    $('#settings-function'   ).html(panelType.function);

    let elemInputs = $('#settings-inputs').html('');

    for(let input of panelType.inputs) {

        let elemInput = $('<div></div>').appendTo(elemInputs)
            .addClass('panel-input');

        $('<div></div>').appendTo(elemInput)
            .addClass('panel-input-title')
            .html(input.title);

        if(input.required) elemInput.addClass('required');

        switch(input.type) {

            case 'string':
                let elemString = $('<input></input>').appendTo(elemInput)
                    .addClass('panel-input-control')
                if(input.hasOwnProperty('default')) elemString.val(input.default);
                break;

            case 'textarea':
                let elemTextarea = $('<textarea></textarea>').appendTo(elemInput)
                    .addClass('panel-input-control')
                if(input.hasOwnProperty('default')) elemTextarea.val(input.default);
                break;

        }

        $('<div></div>').appendTo(elemInput)
            .addClass('panel-input-description')
            .html(input.description);

    }

    for(let panelSetting of panelType.common) {
        let commonSetting = commonSettings[panelSetting[0]];
        let defaultValue  = ((panelSetting.length > 1)) ? panelSetting[1] : (commonSetting.hasOwnProperty('default')) ? commonSetting.default : null;
        insertPanelSettingControl('common', commonSetting, defaultValue, commonSetting.options);
    }

    if(panelType.hasOwnProperty('special')) {
        for(let specialSetting of panelType.special) {
            insertPanelSettingControl('special', specialSetting, specialSetting.default,specialSetting.options);
        }
    }

    setJSONString();

}
function insertPanelSettingControl(className, panelSetting, defaultValue, listOptions) {

    let elemInputs = $('#settings-inputs');

    let elemSetting = $('<div></div>').appendTo(elemInputs)
        .addClass('panel-setting')
        .addClass('panel-' + className);

    $('<div></div>').appendTo(elemSetting)
        .addClass('panel-setting-title')
        .html(panelSetting.title);

    let elemControl;

    switch(panelSetting.type) {

        case 'string':
            elemControl = $('<input></input>').appendTo(elemSetting)
                .on('keyup', function() {setJSONString(); })
            if(defaultValue !== null) elemControl.val(defaultValue);
            break;

        case 'integer':
            elemControl = $('<input></input>').appendTo(elemSetting)
                .attr('type', 'number')
                .on('keyup', function() {setJSONString(); })
            if(defaultValue !== null) elemControl.val(defaultValue);
            break;

        case 'textarea':
            elemControl = $('<textarea></textarea>').appendTo(elemSetting)
                .on('keyup', function() {setJSONString(); })
            if(input.hasOwnProperty('default')) elemTextarea.val(input.default);
            break;

        case 'boolean':
            elemControl = $('<div></div>').appendTo(elemSetting)
                .addClass('panel-setting-checkbox')
                .addClass('icon')
                .addClass('icon-check-box')
                .attr('type', 'checkbox')
                .click(function() {
                    $(this).toggleClass('icon-check-box').toggleClass('icon-check-box-checked');
                    setJSONString();
                });
            // elemCheckbox = $('<input></input>').appendTo(elemControl).addClass('button')
            // .attr('type', 'checkbox');
                

            if(defaultValue !== null) {
                if(defaultValue === true) elemControl.addClass('icon-check-box-checked').removeClass('icon-check-box')
            }
            break;

        case 'select':
            elemControl = $('<select></select>').appendTo(elemSetting)
                .on('change', function() {setJSONString(); })
                
            for(let option of listOptions) {
                $('<option></option>').appendTo(elemControl).attr('value', option).html(option);
            }
            if(defaultValue !== null) elemControl.val(defaultValue);
            break;


    }

    elemControl.attr('data-id', panelSetting.id).addClass('panel-setting-control').addClass('button');

    $('<div></div>').appendTo(elemSetting)
        .addClass('panel-setting-description')
        .addClass('nowrap')
        .attr('title', panelSetting.description)
        .html(panelSetting.description);

}


function runPanel() {

    let functionName = $('#settings-function').html();
    let count        = $('.panel-input-control').length;
    let params       = { id : 'panel' }

    $('.panel-setting-control').each(function() {
        let elemControl = $(this);
        let type = elemControl.attr('type');
        switch(type) {
            case 'checkbox':
                params[$(this).attr('data-id')] = elemControl.hasClass('icon-check-box-checked');
                break;

            default :
                if($(this).val() !== '') {
                    params[$(this).attr('data-id')] = $(this).val();
                }
                break;
        }
    })
    
    setJSONString();

    if(count === 0) {
        window[functionName](
            params
        )
    } else if(count === 1) {
        window[functionName](
            $('.panel-input-control').eq(0).val(), 
            params
        )
    } else if(count === 2) {
        window[functionName](
            $('.panel-input-control').eq(0).val(),
            $('.panel-input-control').eq(1).val(),
            params
        )
    }

}
function setJSONString() {

    let params = {}

    $('.panel-setting-control').each(function() {
        let elemControl = $(this);
        let type = elemControl.attr('type');
        switch(type) {
            case 'checkbox':
                params[$(this).attr('data-id')] = elemControl.hasClass('icon-check-box-checked');
                break;

            default :
                if($(this).val() !== '') {
                    params[$(this).attr('data-id')] = $(this).val();
                }
                break;
        }
    })

    $('#settings-json-string').html(JSON.stringify(params, undefined, 4));

}