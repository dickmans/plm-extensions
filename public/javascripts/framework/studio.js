let itemLinks = [
    '/api/v3/workspaces/57/items/14669',
    '/api/v3/workspaces/57/items/14669',
    '/api/v3/workspaces/57/items/14669',
    '/api/v3/workspaces/57/items/14669'
]


$(document).ready(function() {

    setUIEvents();
    setLibrary('navigation'    , 'Navigation'    , 'icon-folder' );
    setLibrary('creation'      , 'Item Creation' , 'icon-create' );
    setLibrary('items'         , 'Item Data'     , 'icon-product');
    setLibrary('classification', 'Classification', 'icon-book'   );
    setLibrary('admin'         , 'Administration', 'icon-service');

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
    } else {
        $('.panel-type').first().click();
    }

});


function setUIEvents() {

    $('#toggle-panels').click(function() {
        $('body').toggleClass('no-panels');
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
    });
    $('#toggle-descriptions').click(function() {
        $('body').toggleClass('no-descriptions');
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
    });
    $('#toggle-json').click(function() {
        $('body').toggleClass('no-json');
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
    });
    $('#toggle-layout').click(function() {
        $('body').toggleClass('wide');
    });

    $('#settings-fold').click(function() {
        $('.settings-category').addClass('icon-expand').removeClass('icon-collapse');
        $('.panel-option').addClass('hidden');
    });
    $('#settings-unfold').click(function() {
        $('.settings-category').removeClass('icon-expand').addClass('icon-collapse');
        $('.panel-option').removeClass('hidden');
    }); 
    $('#settings-run').click(function() {
        runPanel();
    });

    $('#json-copy').click(function() {
        copySettingsJSON($(this));
    });

}
function copySettingsJSON(elemButton) {

    let text = $('#json-string').val();

    let showCopied = function() {
        elemButton.removeClass('icon-clipboard-add').addClass('icon-checkmark').addClass('copied');
        setTimeout(function() {
            elemButton.removeClass('icon-checkmark').removeClass('copied').addClass('icon-clipboard-add');
        }, 1200);
    }

    if(navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showCopied).catch(function() {
            copyViaTextareaSelection();
            showCopied();
        });
    } else {
        copyViaTextareaSelection();
        showCopied();
    }

}
function copyViaTextareaSelection() {

    // Fallback for browsers/contexts without the async clipboard API: select the
    // JSON textarea and use the legacy copy command.
    let elemTextarea = document.getElementById('settings-json-string');
    if(elemTextarea === null) return;
    elemTextarea.focus();
    elemTextarea.select();
    try { document.execCommand('copy'); } catch(e) { /* ignore */ }
    if(window.getSelection) window.getSelection().removeAllRanges();

}


function setLibrary(category, header, icon) {

    let elemParent = $('#library-list');
    let listTypes  = registry.panelTypes[category];

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
                updateURLParameter(null, 'panel', $(this).attr('data-id'), true);
                selectPanelType($(this));
            });

        $('<div></div>').appendTo(elemPanelType)
            .addClass('panel-icon')            
            .addClass('icon')            
            .addClass('filled')            
            .addClass(icon);

        $('<div></div>').appendTo(elemPanelType)
            .addClass('panel-title')            
            .html(panelType.id);

        $('<div></div>').appendTo(elemPanelType)
            .addClass('panel-description')            
            .html(panelType.description);

        // if(urlParameters.panel === panelType.id) elemPanelType.click();

    }

}


function selectPanelType(elemClicked) {

    let id        = elemClicked.attr('data-id');
    let category  = elemClicked.attr('data-category');
    let listTypes = registry.panelTypes[category];

    $('.panel-type').removeClass('selected');
    elemClicked.addClass('selected');

    for(let panelType of listTypes) {
        if(panelType.id === id) {
            setPanelTypeInputsAndOptions(panelType);
            runPanel();
        }
    }

}
function setPanelTypeInputsAndOptions(panelType) {

    $('#settings-title'      ).html(panelType.id         );
    $('#settings-description').html(panelType.description);
    $('#settings-usage'      ).html(panelType.usage      );

    let elemOptions = $('#settings-options').html('');
    const excluded = panelType.excluded || [];

    for(let panelInput of panelType.inputs) {

        let elemInput = $('<div></div>').appendTo(elemOptions)
            .addClass('panel-input');

        $('<div></div>').appendTo(elemInput)
            .addClass('panel-input-title')
            .html(panelInput.title);

        if(panelInput.required) elemInput.addClass('required');

        switch(panelInput.type) {

            case 'array':
            case 'string':
                let elemString = $('<input></input>').appendTo(elemInput)
                    .addClass('panel-input-control')
                if(panelInput.hasOwnProperty('default')) elemString.val(panelInput.default);
                break;

            case 'textarea':
                let elemControl = $('<textarea></textarea>').appendTo(elemInput)
                    .addClass('panel-input-control');
                if(panelInput.hasOwnProperty('default')) {
                    if(typeof panelInput.default === 'object') {
                        elemControl.val(JSON.stringify(panelInput.default));
                        elemControl.addClass('json');
                    } else {
                        elemControl.val(panelInput.default);
                    }
                }
                break;

        }

        $('<div></div>').appendTo(elemInput)
            .addClass('nowrap')
            .addClass('panel-input-description')
            .html(panelInput.description);

    }

    insertPanelFieldIDs(panelType);

    insertPanelOptions(panelType, registry.panelStandardOptions.header       , 'Panel Header & Appearance'     , null);
    insertPanelOptions(panelType, registry.panelData                         , 'Panel Data Retrieval'           , panelType.data);
    insertPanelOptions(panelType, registry.panelFilters                      , 'Interactive Filters'           , panelType.filters);
    // insertPanelOptions(panelType, registry.panelAdditionalOptions.data       , 'Data Retrieval'                , panelType.additional);
    // insertPanelOptions(panelType, registry.panelAdditionalOptions.log        , 'Change Log'                    , panelType.additional);
    
    insertPanelOptions(panelType, registry.panelStandardOptions.controls      , 'Panel Header Actions'                 , null);
    // insertPanelOptions(panelType, registry.panelStandardOptions.accessibility, 'Accessibility'                 , null);
    insertPanelOptions(panelType, registry.panelStandardOptions.contents      , 'Panel Contents'                , null);
    insertPanelOptions(panelType, registry.panelAdditionalOptions.sorting    , 'Sorting'                       , panelType.additional);
    
    if(!excluded.includes('layout')) {
        insertPanelOptions(panelType, registry.panelStandardOptions.table, 'Table Displays'                 , null);
        insertPanelOptions(panelType, registry.panelStandardOptions.tiles, 'Tiles Displays'                 , null);
    }
    
    insertPanelOptions(panelType, registry.panelAdditionalOptions.create   , 'Item Creation'                 , panelType.additional);
    insertPanelOptions(panelType, registry.panelAdditionalOptions.sections , 'Item Details Sections & Fields', panelType.additional);
    insertPanelOptions(panelType, registry.panelAdditionalOptions.files    , 'Attachment Options'            , panelType.additional);    
    insertPanelOptions(panelType, registry.panelAdditionalOptions.grid     , 'Grid Options'                  , panelType.additional);    
    insertPanelOptions(panelType, registry.panelAdditionalOptions.tree     , 'Tree Options'                  , panelType.additional);
    insertPanelOptions(panelType, registry.panelAdditionalOptions.history  , 'Workflow History Options'      , panelType.additional);
    insertPanelOptions(panelType, registry.panelAdditionalOptions.summary  , 'Item Summary Options'          , panelType.additional);       
    insertPanelOptions(panelType, registry.panelAdditionalOptions.dnd      , 'Drag & Drop Features'          , panelType.additional);    
    insertPanelOptions(panelType, registry.panelAdditionalOptions.classes  , 'Classification Features'       , panelType.additional);    
    insertPanelOptions(panelType, registry.panelAdditionalOptions.others   , 'Additional Options'            , panelType.additional);    
    // insertPanelOptions(panelType, registry.panelStandardOptions.tiles        , 'Tile Displays'                 , null);
    // insertPanelOptions(panelType, registry.panelStandardOptions.others       , 'Others'                        , null);

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
function insertPanelFieldIDs(panelType) {

    if(!panelType.hasOwnProperty('fieldIDs')) return;
    if(panelType.fieldIDs.length === 0) return;

    let elemOptions = $('#settings-options');

    let elemCategory = $('<div></div>').appendTo($('#settings-options'))
        .addClass('settings-category')
        .addClass('button')
        .addClass('with-icon')
        .addClass('icon-collapse')
        .html('FieldIDs')
        .click(function() {
            $(this).toggleClass('icon-expand').toggleClass('icon-collapse');
            $(this).nextUntil('.settings-category').toggleClass('hidden');
        });

    for(let fieldId of panelType.fieldIDs) {

        let elemOption = $('<div></div>').appendTo(elemOptions)
            .addClass('panel-option')
            .addClass('panel-field');

        $('<div></div>').appendTo(elemOption)
            .addClass('panel-option-title')
            .html(fieldId.key);

        let elemControl = $('<input></input>').appendTo(elemOption)
            .attr('type', 'fieldId')
            .val(fieldId.default)
            .attr('data-id', fieldId.key)
            .addClass('panel-option-control')
            .addClass('button')
            .on('keyup', function() {setJSONString(); });

        $('<div></div>').appendTo(elemOption)
            .addClass('panel-option-description')
            .addClass('nowrap')
            .attr('title', fieldId.description)
            .html(fieldId.description);

    }

}
function insertPanelOptions(panelType, options, title, validOptions) {

    let elemCategory = $('<div></div>').appendTo($('#settings-options'))
        .addClass('settings-category')
        .addClass('button')
        .addClass('with-icon')
        .addClass('icon-collapse')        
        .html(title)
        .click(function() {
            $(this).toggleClass('icon-expand').toggleClass('icon-collapse');
            $(this).nextUntil('.settings-category').toggleClass('hidden');
        });

    let append = false;
    let keys   = Object.keys(options);

    for(let key of keys) {

        let option = options[key];
        let valid  = (typeof validOptions === 'undefined') ? false : ((validOptions === null) || (validOptions.includes(key)));
        
        if(valid) {
            if(typeof panelType.excluded !== 'undefined') {
                valid = !panelType.excluded.includes(key);
            }
        }

        if(valid) {

            let defaultValue  =  (option.hasOwnProperty('default')) ? option.default : null;
            if(panelType.defaults.hasOwnProperty(key)) defaultValue = panelType.defaults[key]; 
            insertCommonOptionControl('common', key, option, defaultValue);
            append = true;

        }

    }

    if(!append) elemCategory.remove();

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

        case 'array':
        case 'string':
            elemControl = $('<input></input>').appendTo(elemOption)
                .attr('type', commonOption.type)
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
            if(defaultValue !== null) {
                if(typeof defaultValue === 'object') {
                    defaultValue = JSON.stringify(defaultValue);
                    elemControl.addClass('json');
                }
                elemControl.val(defaultValue);
            }
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

    $('.panel').html('');
    $('.panel').attr('class', 'surface-level-1 panel');

    let functionName = $('#settings-title').html();
    let count        = $('.panel-input-control').length;
    let params       = { }

    $('.panel-option-control').each(function() {

        let elemControl = $(this);
        let type        = elemControl.attr('type');
        let id          = elemControl.attr('data-id');

        switch(type) {

            case 'checkbox':
                params[id] = elemControl.hasClass('icon-check-box-checked');
                break;

            case 'array':
                if($(this).val() !== '') {
                    params[id] = $(this).val().split(',');
                } else params[id] = [];
                break;                

            case 'fieldId':
                if(!params.hasOwnProperty('fieldIDs')) params.fieldIDs = {};
                params.fieldIDs[id] = $(this).val();
                break;

            default :
                if($(this).val() !== '') {
                    if($(this).hasClass('json')) {
                        params[id] = JSON.parse($(this).val());
                    } else params[id] = $(this).val();                    
                }
                break;

        }

    });

    $('.panel').attr('id', params.id);
    
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
        let type        = elemControl.attr('type');
        let id          = elemControl.attr('data-id');
        let value       = ($(this).val() || '').trim();

        switch(type) {
            case 'checkbox':
                params[id] = elemControl.hasClass('icon-check-box-checked');
                break;

            case 'array':
                if(value !== '') {
                    if(value.startsWith('{')) {
                        params[id] = [ value ];
                    } else if(isJSON(value)) {
                        params[id] = [ JSON.parse(value) ];
                    } else params[id] = value.split(',');
                } else params[id] = [];   
                break;                 

            case 'fieldId':
                if(!params.hasOwnProperty('fieldIDs')) params.fieldIDs = {};
                params.fieldIDs[id] = value;
                break;

            default :
                if($(this).val() !== '') {
                    if($(this).hasClass('json')) {
                        params[id] = JSON.parse($(this).val());
                    } else params[id] = $(this).val();
                }
                break;

        }
    })

    params = sortJSON(params);

    $('#json-string').html(JSON.stringify(params, undefined, 4));

}


 //   { "state":"Sales", "color":"#009c00" }
 //   { "state":"Sales", "color":"#009c00" }, { "state":"Sales", "color":"#009c00" }