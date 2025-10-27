// ------------------------------------------------------------------------------------------------------
//  Provide the URL of your extensions server to use per defaul below
//  Users can change this URL using the options dialog of the extension
//  Anyway, the URLs will only work if they are also listed in 'host_permissions' in manifest.json

let serverUrl = 'http://localhost:8080';

//  Do not mofify the code below this line
// ------------------------------------------------------------------------------------------------------



let commands    = [];
let buttons     = [];
let workspaces  = {};
let maxLevel    = 0;
let customStyle = false;


// Retrieve command and button settings from UX Server based on settings.js (see exports.chrome)
chrome.runtime.sendMessage({ action: 'fetchData', url : serverUrl + '/services/chrome' }, (response) => {
    if (response.success) {
        commands    = response.data.commands;
        buttons     = response.data.buttons;
        workspaces  = response.data.workspaces;
        customStyle = response.data.customStyle;
    } else {
        console.log('Error getting extensions settings from ' + serverUrl + '/services/chrome');
        console.log(response.error);
    }
});
chrome.storage.sync.get(['serverUrl'], (result) => {

    if(result.serverUrl) serverUrl = result.serverUrl;

});



// Add commands to Hamburger Menu
window.addEventListener('click', (e) =>  {
    
    if('hamburger-menu-icon' === e.target.className) {

        let elemMenuIcon       = e.target;
        let elemMenuContent    = document.getElementsByClassName('hamburger-menu-content')[0];
        let extensionsEnabled  = elemMenuIcon.getAttribute('plm-extensions');
        let elemParent         = document.getElementsByClassName('hig__flyout-v1__panel-container')[0];
        let iconAdministration = document.getElementById('AdministrationMenuIcon');

        if(iconAdministration === null) return;

        for(let command of commands) insertExtensionsCommand(elemMenuContent.firstChild, command);

        if(extensionsEnabled !== null) return;

        elemParent.addEventListener('click', (e) => {
            updateMenuExtensions(e);
        });

        elemMenuContent.firstChild.style.display = 'flex';
        elemMenuContent.firstChild.style.setProperty('flex-direction', 'column');

        elemMenuIcon.setAttribute('plm-extensions', 'enabled');

        fromLevel = 0;

    } 

});

function insertExtensionsCommand(elemMenu, command) {

    let elemButton = document.getElementById('plm-extensions-' + command.id);

    if(elemButton === null) {

        elemButton = document.createElement('a');
        elemButton.id = 'plm-extensions-' + command.id;
        elemButton.classList.add('plm-extensions-command');
        elemButton.setAttribute('href', serverUrl + command.url);
        elemButton.style.setProperty('order', command.order);

        if(customStyle) {
            elemButton.style.setProperty('background', '#f1f1f1');
            elemButton.style.setProperty('border-top', '1px solid white');
            elemButton.style.setProperty('color', 'white');
        }

        let elemButtonItem = document.createElement('div');
            elemButtonItem.className = 'hamburger-menu-item';

        let elemButtonIcon = document.createElement('div');
            elemButtonIcon.classList.add('zmdi');
            elemButtonIcon.classList.add(command.icon);
            elemButtonIcon.style.setProperty('font-size', '23px');
            elemButtonIcon.style.setProperty('margin-right', '10px');
            elemButtonIcon.style.setProperty('position', 'relative');
            elemButtonIcon.style.setProperty('text-align', 'center');
            elemButtonIcon.style.setProperty('top', '-1px');
            elemButtonIcon.style.setProperty('max-width', '23px');
            elemButtonIcon.style.setProperty('min-width', '23px');
            elemButtonIcon.style.setProperty('width', '23px');

        let elemButtonText = document.createElement('p');
            elemButtonText.textContent = command.label;

        elemButtonItem.appendChild(elemButtonIcon);
        elemButtonItem.appendChild(elemButtonText);
        elemButton.appendChild(elemButtonItem);

    }
    
    elemMenu.appendChild(elemButton);
    elemButton.style.display = 'block';
    elemButton.style.setProperty('animation', 'none');

}

function updateMenuExtensions(e) {

    let mainCategories  = ['Workspaces', 'Advanced Tools', 'Administration'];
    let listCommands    = document.getElementsByClassName('plm-extensions-command');
    let countBack       = document.getElementsByClassName('hamburger-menu-header-item').length;
    let countNext       = document.getElementsByClassName('menu-arrow-icon').length;
    let elemClicked     = e.target;
    let elemParent      = e.target.parentElement;
    let clickedId       = elemClicked.id;
    let clickedClasses  = elemClicked.classList;
    let parentClasses   = elemParent.classList;
    let clickedLabel    = elemParent.getElementsByTagName('p')[0];
    let isLevel1        = (countNext > 1) || mainCategories.includes(clickedLabel.innerHTML);
    let display         = 'none';
    
    let clickedExtensionsCommand = elemClicked.closest('.plm-extensions-command');

    if(clickedExtensionsCommand) return;

    if(countBack === 1) {
        if(isLevel1) {
            if((clickedId === 'BackMenuIcon') || clickedClasses.contains('hamburger-menu-header-item') || parentClasses.contains('hamburger-menu-header-item')) {
                display = 'block';
            } else maxLevel = 2;
        }
    } else {
        maxLevel = 1;
    }

    let animDirection   = (maxLevel === 2) ? 'backwardSlide' : 'forwardSlide';

    for(let elemCommand of listCommands) {
        elemCommand.style.display = display;
        elemCommand.style.setProperty('animation', '0.3s ease 0s 1 normal forwards running ' + animDirection);
    }

}



// Add buttons to Item Headers
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.id === 'itemviewer-item-header' || (node.querySelector && node.querySelector('#itemviewer-item-header'))) {
                onItemHeaderAdded();
            }
        });
    });
});

observer.observe(document, { childList: true, subtree: true });

function onItemHeaderAdded() {

    if(buttons.length === 0) {

        chrome.runtime.sendMessage({ action: 'fetchData', url : serverUrl + '/services/chrome' }, (response) => {
            if (response.success) {
                buttons    = response.data.buttons;
                workspaces = response.data.workspaces;
                insertItemHeaderButtons();
            } else {
                console.log('Error getting extensions settings from ' + serverUrl + '/services/chrome');
                console.log(response.error);
            }
        });

    } else insertItemHeaderButtons();

}

function insertItemHeaderButtons() {

    const elemHeader  = document.getElementById('itemviewer-item-header');
    const elemButtons = document.getElementsByClassName('plm-extensions-button');
    
    if (elemHeader) {
        if (elemButtons.length === 0) {
            
            let wsId        = Number(document.location.href.split('/')[5]);
            let elemToolbar = document.createElement('div');

            elemToolbar.style.display = 'flex';
            elemToolbar.style.setProperty('gap', '6px');
            elemToolbar.style.setProperty('position', 'absolute');
            elemToolbar.style.setProperty('right', '30px');

            for(let button of buttons) {

                let validWorkspaces = [];

                for(let ws of button.workspaces) validWorkspaces.push(workspaces[ws]);

                if(validWorkspaces.includes(wsId)) {

                    let elemButton = document.createElement('button');

                    elemButton.className = 'plm-extensions-button';
                    elemButton.id        = 'plm-extensions-button-' + button.id;

                    elemButton.style.setProperty('border-radius', '3px');
                    elemButton.style.setProperty('line-height', '20px');
                    elemButton.style.setProperty('margin-top', '2px');

                    if(typeof button.icon === 'undefined') {
                        elemButton.textContent = button.label;
                        elemButton.style.setProperty('padding', '4px 14px');
                    } else {
                        elemButton.classList.add('zmdi');
                        elemButton.classList.add(button.icon);
                        elemButton.style.setProperty('font-size', '20px');
                        elemButton.style.setProperty('padding', '4px 8px');
                        elemButton.style.setProperty('max-width', '40px');
                        elemButton.style.setProperty('min-width', '40px');
                        elemButton.style.setProperty('width', '40px');
                        elemButton.setAttribute('title', button.label);
                    }

                    if(customStyle) {
                        elemButton.style.setProperty('background', 'var(--color-bg)');
                        elemButton.style.setProperty('border', '1px solid var(--color-bg)');
                    } else {
                        elemButton.style.setProperty('background', 'transparent');
                        elemButton.style.setProperty('border', '1px solid var(--button-border-color)');
                    }

                    elemButton.onclick = function() {

                        let location   = document.location.href.split('/');
                        let parameters = document.location.href.split('?')[1].split(',');
                        let wsId       = location[5];
                        let dmsId      = parameters.pop();
                        let url        = serverUrl + button.url + 'wsId=' + wsId + '&dmsid=' + dmsId;

                        window.open(url);

                    }

                    elemToolbar.appendChild(elemButton);
                    elemHeader.appendChild(elemToolbar);

                }

            }
        }
    }

}