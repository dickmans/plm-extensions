$(document).ready(function() {

    setUIEvents();
    setLibrary('navigation'    , 'Navigation'    , 'icon-folder' );
    setLibrary('items'         , 'Item Data'     , 'icon-product');
    setLibrary('classification', 'Classification', 'icon-book'   );
    
    $('.panel-type').first().click();

    if(!isBlank(urlParameters.panel)) {
        $('.panel-type').each(function() {
            if($(this).attr('data-id') == urlParameters.panel) {
                $(this).click();
                if(!isBlank(urlParameters.run)) {
                    if(urlParameters.run == 'true') {
                        runPanel();
                    }
                }
            }
        });
    }

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
            setPanelTypeInputsAndOptions(panelType);
        }
    }

}
function setPanelTypeInputsAndOptions(panelType) {

    $('#settings-title'      ).html(panelType.title);
    $('#settings-description').html(panelType.description);
    $('#settings-function'   ).html(panelType.function);

    let elemInputs  = $('#settings-inputs' ).html('');
    let elemOptions = $('#settings-options').html('');

    if(!panelType.hasOwnProperty('inputs')) $('#settings-inputs').addClass('hidden');
    else if(panelType.inputs.length  === 0) $('#settings-inputs').addClass('hidden');
    else                                    $('#settings-inputs').removeClass('hidden');

    for(let panelInput of panelType.inputs) {

        let elemInput = $('<div></div>').appendTo(elemInputs)
            .addClass('panel-input');

        $('<div></div>').appendTo(elemInput)
            .addClass('panel-input-title')
            .html(panelInput.title);

        if(panelInput.required) elemInput.addClass('required');

        switch(panelInput.type) {

            case 'string':
                let elemString = $('<input></input>').appendTo(elemInput)
                    .addClass('panel-input-control')
                if(panelInput.hasOwnProperty('default')) elemString.val(panelInput.default);
                break;

            case 'textarea':
                let elemTextarea = $('<textarea></textarea>').appendTo(elemInput)
                    .addClass('panel-input-control')
                if(panelInput.hasOwnProperty('default')) elemTextarea.val(panelInput.default);
                break;

        }

        $('<div></div>').appendTo(elemInput)
            .addClass('nowrap')
            .addClass('panel-input-description')
            .html(panelInput.description);

    }

    insertCommonOptions(panelType, 'Header Options', headerOptions);
    insertCommonOptions(panelType, 'Content Options', contentOptions);

    // for(let panelOption of panelType.options) {
    //     let commonSetting = commonOptions[panelOption[0]];
    //     let defaultValue  = ((panelOption.length > 1)) ? panelOption[1] : (commonSetting.hasOwnProperty('default')) ? commonSetting.default : null;
    //     insertPanelOptionControl('common', commonSetting, defaultValue, commonSetting.options);
    // }

    // if(panelType.hasOwnProperty('special')) {
    //     for(let specialSetting of panelType.special) {
    //         insertPanelOptionControl('special', specialSetting, specialSetting.default,specialSetting.options);
    //     }
    // }

    setJSONString();

}
function insertCommonOptions(panelType, title, options) {

    $('<div></div>').appendTo($('#settings-options'))
        .addClass('settings-category')
        .html(title)

    let keys = Object.keys(options);

    for(let key of keys) {

        let option = options[key];

        if(panelType.options.includes(key)) {

            let defaultValue  =  (option.hasOwnProperty('default')) ? option.default : null;
            if(panelType.defaults.hasOwnProperty(key)) defaultValue = panelType.defaults[key]; 
            insertCommonOptionControl('common', key, option, defaultValue);

        }

    }

}
function insertCommonOptionControl(className, key, commonOption, defaultValue) {

    let elemOptions = $('#settings-options');

    let elemOption = $('<div></div>').appendTo(elemOptions)
        .addClass('panel-option')
        .addClass('panel-' + className);

    $('<div></div>').appendTo(elemOption)
        .addClass('panel-option-title')
        .html(commonOption.title);

    let elemControl;

    switch(commonOption.type) {

        case 'string':
            elemControl = $('<input></input>').appendTo(elemOption)
                .on('keyup', function() {setJSONString(); })
            if(defaultValue !== null) elemControl.val(defaultValue);
            break;

        case 'integer':
            elemControl = $('<input></input>').appendTo(elemOption)
                .attr('type', 'number')
                .on('keyup', function() {setJSONString(); })
            if(defaultValue !== null) elemControl.val(defaultValue);
            break;

        case 'textarea':
            elemControl = $('<textarea></textarea>').appendTo(elemOption)
                .on('keyup', function() {setJSONString(); })
            if(input.hasOwnProperty('default')) elemTextarea.val(input.default);
            break;

        case 'boolean':
            elemControl = $('<div></div>').appendTo(elemOption)
                .addClass('panel-option-checkbox')
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
            elemControl = $('<select></select>').appendTo(elemOption)
                .on('change', function() {setJSONString(); })
                
            for(let option of commonOption.list) {
                $('<option></option>').appendTo(elemControl).attr('value', option).html(option);
            }
            if(defaultValue !== null) elemControl.val(defaultValue);
            break;


    }

    elemControl.attr('data-id', key).addClass('panel-option-control').addClass('button');

    $('<div></div>').appendTo(elemOption)
        .addClass('panel-option-description')
        .addClass('nowrap')
        .attr('title', commonOption.description)
        .html(commonOption.description);

}


function runPanel() {

    let functionName = $('#settings-function').html();
    let count        = $('.panel-input-control').length;
    let params       = { id : 'panel' }

    $('.panel-option-control').each(function() {
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

    $('.panel-option-control').each(function() {
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