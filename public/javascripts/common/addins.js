async function selectComponents(partNumbers) {

    console.log('selectComponents START');
    console.log(partNumbers);

	const plmAddin = chrome.webview.hostObjects.plmAddin;
    await plmAddin.selectComponents(partNumbers);

}

async function addComponent(partNumber) {

    console.log('addComponent START');
    console.log(partNumber);

    const plmAddin = chrome.webview.hostObjects.plmAddin;
    await plmAddin.addComponent(partNumber);

}

async function openComponent(partNumber) {

    console.log('openComponent START');
    console.log(partNumber);

    const plmAddin = chrome.webview.hostObjects.plmAddin;
    await plmAddin.openComponent(partNumber);

}

async function updateProperties(data) {

    console.log('updateProperties START');
    console.log(data);

    const plmAddin = chrome.webview.hostObjects.plmAddin;
    await plmAddin.updateProperties(data);

}

async function getComponentsLocked(partNumbers) {

    console.log('getComponentsLocked START');
    console.log(partNumbers);

    const plmAddin = chrome.webview.hostObjects.plmAddin;
    await plmAddin.getComponentsLocked(partNumbers);

}

async function isolateComponents(partNumbers) {

    console.log('isolateComponents START');
    console.log(partNumbers);

    const plmAddin = chrome.webview.hostObjects.plmAddin;
    await plmAddin.isolateComponents(partNumbers);

}

async function setLifecycleState(name, state) {

    console.log('isolateComponents START');
    console.log(name);
    console.log(state);

    const plmAddin = chrome.webview.hostObjects.plmAddin;
    await plmAddin.setLifecycleState(name, state);

}

function addinSelect(partNumbers) {


    $('.item').each(function() {
        let elemItem   = $(this);
        let partNumber = elemItem.attr('data-part-number');
        if(partNumbers.includes(partNumber)) { elemItem.addClass('selected') } else { elemItem.removeClass('selected'); }
    });

}


function addinClose() {

    return true;

}