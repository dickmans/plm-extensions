let isolate = false;

$(document).ready(function() {

    // if(!isBlank(options)) {
    //     if(options[0].toLowerCase() === 'dark') $('body').addClass('blue-theme')
    // }

    // if(typeof chrome.webview !== 'undefined') plmAddin  = chrome.webview.hostObjects.plmAddin;

    if(typeof chrome.webview === 'undefined') $('body').addClass('standalone');

});


// Select parts in Inventor
function select3D(partNumbers) {

    console.log('select3D START');
    console.log('select3D isolate : ' + isolate);
    console.log(partNumbers);

    if(isolate) isolateComponents(partNumbers);
    else selectComponents(partNumbers);
}
async function selectComponents(partNumbers) {

    console.log('selectComponents START');
    console.log(partNumbers);

    if(typeof chrome.webview === 'undefined') return;

    const plmAddin  = chrome.webview.hostObjects.plmAddin;
    await plmAddin.selectComponents(partNumbers);

}
async function isolateComponents(partNumbers) {

    console.log('isolateComponents START');
    console.log(partNumbers);

    if(typeof chrome.webview === 'undefined') return;

    const plmAddin  = chrome.webview.hostObjects.plmAddin;
    await plmAddin.isolateComponents(partNumbers);

}


// Enable Inventor to highlighting items
function addinSelect(partNumbers) {

    console.log('addinSelect START');
    console.log(partNumbers);

    if($('#tab-bom').length > 0) {

        if(!$('#tab-bom').hasClass('selected')) {
            $('#tab-bom').click();
        }

        $('#bom-flat-tbody').children().each(function() {
            let elemItem   = $(this);
            let partNumber = elemItem.attr('data-part-number');
            if(partNumbers.includes(partNumber)) { elemItem.addClass('selected') } else { elemItem.removeClass('selected'); }
        });

        updateFlatBOMCounter();

    }

}

// Enable Inventor to open raw material search
function addinSelectRawMaterial(bodyName) {

    console.log('addinSelectRawMaterial START');

    $(document).ready(function() {

        if(!$('#tab-materials').hasClass('selected')) $('#tab-materials').click();

        console.log(bodyName);

        if(isBlank(bodyName)) {

            insertRecentItems('materials', ['57']);

        } else {

            $('#materials-input').val(bodyName);
            $('#materials-submit').click();

        }

    });

    return true;

}

// Add selected item to current Inventor session
async function addComponent(partNumber) {

    console.log('addComponent START');
    console.log(partNumber);

    if(typeof chrome.webview === 'undefined') return;

    const plmAddin  = chrome.webview.hostObjects.plmAddin;
    await plmAddin.addComponent(partNumber.toString());

}

// Open selected item in new Inventor window
async function openComponent(partNumber) {

    console.log('openComponent START');
    console.log(partNumber);

    if(typeof chrome.webview === 'undefined') return;

    const plmAddin  = chrome.webview.hostObjects.plmAddin;
    await plmAddin.openComponent(partNumber.toString());

}




async function updateProperties(data) {

    console.log('updateProperties START');
    console.log(data);

    const plmAddin = chrome.webview.hostObjects.plmAddin;
    await plmAddin.updateProperties(data.toString());
    // TODO muss als string ausgegeben werden

}


async function getActiveDocument() {

    console.log('GetActiveDocument START');

    if(typeof chrome.webview === 'undefined') return;

    const plmAddin = chrome.webview.hostObjects.plmAddin;
    let partNumber = await plmAddin.getActiveDocument('-');

    console.log(partNumber);

    return partNumber;

}


// Get list of part numbers locked in Inventor to prevent changes in PLM
async function getComponentsLocked(partNumbers) {

    console.log('getComponentsLocked START');
    console.log(partNumbers);

    const plmAddin  = chrome.webview.hostObjects.plmAddin;
    let itemsLocked = await plmAddin.getComponentsLocked(partNumbers);

    console.log(itemsLocked);
    return itemsLocked;

}


async function setLifecycleState(name, state) {

    console.log('isolateComponents START');
    console.log(name);
    console.log(state);

    const plmAddin = chrome.webview.hostObjects.plmAddin;
    await plmAddin.setLifecycleState(name, state);

}

// function addinSelect(partNumbers) {


//     $('.item').each(function() {
//         let elemItem   = $(this);
//         let partNumber = elemItem.attr('data-part-number');
//         if(partNumbers.includes(partNumber)) { elemItem.addClass('selected') } else { elemItem.removeClass('selected'); }
//     });

// }

function setDirty(data) {

    console.log('setDirty START');

    chrome.webview.hostObjects.plmAddin.IsChanged = data;

}


// Insert actions into tile lists
function insertTileActions(id) {

    $('#' + id).children('.tile').each(function() {
        insertTileAction($(this));
    });

}
function insertTileAction(elemTile) {

    let elemActions = $('<div></div>');
        elemActions.addClass('tile-actions');
        elemActions.appendTo(elemTile.children('.tile-details'));

    let elemAction2 = $('<div></div>');
        elemAction2.addClass('button');
        elemAction2.addClass('icon');
        elemAction2.addClass('icon-open');
        elemAction2.attr('title', 'In PLM ansehen');
        elemAction2.appendTo(elemActions);
        elemAction2.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            openItemByLink($(this).closest('.tile').attr('data-link'));
        });

    let elemAction4 = $('<div></div>');
        elemAction4.addClass('button');
        elemAction4.addClass('icon');
        elemAction4.addClass('icon-select');
        elemAction4.attr('title', 'Im Fenster auswählen');
        elemAction4.appendTo(elemActions);
        elemAction4.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            select3D([$(this).closest('.tile').attr('data-title').split(' -')[0]]);
        });

    let elemAction3 = $('<div></div>');
        elemAction3.addClass('button');
        elemAction3.addClass('icon');
        elemAction3.addClass('icon-new-window');
        elemAction3.attr('title', 'In neuem Fenster öffnen');
        elemAction3.appendTo(elemActions);
        elemAction3.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            openComponent([$(this).closest('.tile').attr('data-title').split(' -')[0]]);
        });
    
    let elemAction1 = $('<div></div>');
        elemAction1.addClass('button');
        elemAction1.addClass('icon');
        elemAction1.addClass('icon-create');
        elemAction1.attr('title', 'In der aktiven Sitzung hinzuladen');
        elemAction1.appendTo(elemActions);
        elemAction1.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            addComponent([$(this).closest('.tile').attr('data-title').split(' -')[0]]);
        });

}


// Insert actions into BOM table
function insertTableActions(id) {

    let elemTHead = $('#' + id + '-thead').children().first();
    $('<th>Actions</th>').insertAfter(elemTHead);

    $('#' + id + '-tbody').children().each(function() {

        let elemFirstCol = $(this).children().first();

        let elemCellActions = $('<td></td>');
            elemCellActions.addClass('bom-tree-actions');
            elemCellActions.insertAfter(elemFirstCol);
            elemCellActions.nextAll().addClass('hidden');

        let elemActions = $('<div></div>');
            elemActions.appendTo(elemCellActions);
            elemActions.nextAll().addClass('hidden');

        let elemAction4 = $('<div></div>');
            elemAction4.addClass('button');
            elemAction4.addClass('icon');
            elemAction4.addClass('icon-select');
            elemAction4.attr('title', 'Im Fenster auswählen');
            elemAction4.appendTo(elemActions);
            elemAction4.click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                select3D([$(this).closest('.bom-item').attr('data-part-number')]);
            });

        let elemAction3 = $('<div></div>');
            elemAction3.addClass('button');
            elemAction3.addClass('icon');
            elemAction3.addClass('icon-new-window');
            elemAction3.attr('title', 'In neuem Fenster öffnen');
            elemAction3.appendTo(elemActions);
            elemAction3.click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                openComponent([$(this).closest('.bom-item').attr('data-part-number')]);
            });
        
        let elemAction1 = $('<div></div>');
            elemAction1.addClass('button');
            elemAction1.addClass('icon');
            elemAction1.addClass('icon-create');
            elemAction1.attr('title', 'In der aktiven Sitzung hinzufügen');
            elemAction1.appendTo(elemActions);
            elemAction1.click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                addComponent([$(this).closest('.bom-item').attr('data-part-number')]);
            });

        let elemAction2 = $('<div></div>');
            elemAction2.addClass('button');
            elemAction2.addClass('icon');
            elemAction2.addClass('icon-open');
            elemAction2.attr('title', 'In PLM ansehen');
            elemAction2.appendTo(elemActions);
            elemAction2.click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                openItemByLink($(this).closest('.bom-item').attr('data-link'));
            });
    
    });

}