let plmAddin;
let isolate     = false;

$(document).ready(function() {

    if(!isBlank(options)) {
        if(options[0].toLowerCase() === 'dark') $('body').addClass('blue-theme')
    }

    if(typeof chrome.webview !== 'undefined') plmAddin  = chrome.webview.hostObjects.plmAddin;

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

	// const plmAddin = chrome.webview.hostObjects.plmAddin;
    await plmAddin.selectComponents(partNumbers);

}
async function isolateComponents(partNumbers) {

    console.log('isolateComponents START');
    console.log(partNumbers);

    if(typeof chrome.webview === 'undefined') return;

    // const plmAddin = chrome.webview.hostObjects.plmAddin;
    await plmAddin.isolateComponents(partNumbers);

}


// Enable hihglight triggered by Inventor
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


async function addComponent(partNumber) {

    console.log('addComponent START');
    console.log(partNumber);

    if(typeof chrome.webview === 'undefined') return;

    // const plmAddin = chrome.webview.hostObjects.plmAddin;
    await plmAddin.addComponent(partNumber);

}


async function openComponent(partNumber) {

    console.log('openComponent START');
    console.log(partNumber);

    if(typeof chrome.webview === 'undefined') return;

    // const plmAddin = chrome.webview.hostObjects.plmAddin;
    await plmAddin.openComponent(partNumber);

}

async function updateProperties(data) {

    console.log('updateProperties START');
    console.log(data);

    // const plmAddin = chrome.webview.hostObjects.plmAddin;
    await plmAddin.updateProperties(data.toString());
    // TODO muss als string ausgegeben werden

}

async function getComponentsLocked(partNumbers) {

    console.log('GetComponentsLocked START');
    console.log(partNumbers);

    // const plmAddin = chrome.webview.hostObjects.plmAddin;
    let itemsLocked = await plmAddin.GetComponentsLocked(partNumbers);

    // TODO itemsLocked = string mit json inhalt


    // let itemsLocked = await plmAddin.getComponentsLocked(partNumbers);
    // var itemsLocked = await plmAddin.getComponentsLocked(partNumbers);
    // var itemsLocked = await plmAddin.getComponentsLocked("42");
    // await plmAddin.getComponentsLocked();
    // let itemsLocked = await plmAddin.getComponentsLocked("");

    console.log(itemsLocked);

}
// function getComponentsLocked(partNumbers) {

//     console.log('getComponentsLocked START');
//     console.log(partNumbers);

//     const plmAddin = chrome.webview.hostObjects.sync.plmAddin;
//     let itemsLocked = plmAddin.getComponentsLocked(partNumbers);
//     // let itemsLocked = await plmAddin.getComponentsLocked(partNumbers);
//     // var itemsLocked = await plmAddin.getComponentsLocked(partNumbers);
//     // var itemsLocked = await plmAddin.getComponentsLocked("42");
//     // await plmAddin.getComponentsLocked();
//     // let itemsLocked = await plmAddin.getComponentsLocked("");

//     console.log(itemsLocked);

// }



async function setLifecycleState(name, state) {

    console.log('isolateComponents START');
    console.log(name);
    console.log(state);

    // const plmAddin = chrome.webview.hostObjects.plmAddin;
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
