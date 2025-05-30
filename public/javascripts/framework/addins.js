let isolate = false;


// Confirm successful login
function loginCompleted() {

    console.log('--> START loginCompleted()');

    if(typeof chrome.webview === 'undefined') return;

    chrome.webview.postMessage('Login successful');

}


// Insert actions into tile lists
function genAddinTilesActions(elemContent) {

    elemContent.children('.tile').each(function() {
        genAddinTileActions($(this));
    });

}
function genAddinTileActions(elemTile) {

    let elemActions = $('<div></div>').appendTo(elemTile).addClass('tile-actions');

    console.log(host);
    
    switch(elemTile.attr('data-type')) {

        case 'vault-folder': 
            if(host === 'inventor') {
                genAddinTileAction(elemActions, 'gotoVaultFolder', 'icon-folder', 'Navigate to folder in Vault'); 
            } else {
                genAddinTileAction(elemActions, 'gotoVaultFolder', 'icon-folder', 'Navigate to folder in Vault'); 
            }
            break;

        case 'vault-file': 
        case 'vault-item': 
            if(host === 'inventor') {
                genAddinTileAction(elemActions, 'gotoVaultFile', 'icon-folder-open', 'Go To Folder'); 
                genAddinTileAction(elemActions, 'gotoVaultItem', 'icon-open'       , 'Go To Item'); 
                genAddinTileAction(elemActions, 'addComponent' , 'icon-select'     , 'Place Component'); 
                genAddinTileAction(elemActions, 'openComponent', 'icon-product'    , 'Open Component'); 
            } else {
                genAddinTileAction(elemActions, 'gotoVaultFile', 'icon-folder-open', 'Go To Folder'); 
                genAddinTileAction(elemActions, 'gotoVaultItem', 'icon-open'       , 'Go To Item'); 
                genAddinTileAction(elemActions, 'addComponent' , 'icon-select'     , 'Insert into CAD'); 
                genAddinTileAction(elemActions, 'openComponent', 'icon-product'    , 'Open in CAD'); 
            }
            break;

        case 'vault-eco':
            if(host === 'inventor') {    
            } else {
                genAddinTileAction(elemActions, 'gotoVaultECO', 'icon-select', 'Navigate to ECO in Vault');
            }
            break;

        default:
            genAddinPLMItemTileActions(elemActions);
            break;

    }

}
function genAddinPLMItemTileActions(elemActions) {

    console.log(host);

    if(host === 'inventor') {   
        genAddinTileAction(elemActions, 'selectComponent' , 'icon-select-circle', 'Select in Window'); 
        genAddinTileAction(elemActions, 'isolateComponent', 'icon-3d'           , 'Isolate in Window'); 
        genAddinTileAction(elemActions, 'addComponent'    , 'icon-select'       , 'Place Component'); 
        genAddinTileAction(elemActions, 'openComponent'   , 'icon-product'      , 'Open Component');  
    } else {
        // genAddinTileAction(elemActions, 'gotoVaultFile', 'icon-product', 'Navigate to file in Vault');
        // genAddinTileAction(elemActions, 'gotoVaultItem', 'icon-item'   , 'Navigate to item in Vault');
        // genAddinTileAction(elemActions, 'addComponent' , 'icon-create' , 'Add to active window');
        // genAddinTileAction(elemActions, 'openComponent', 'icon-clone'  , 'Open in new window');
        genAddinTileAction(elemActions, 'gotoVaultFile', 'icon-folder-open', 'Go To Folder'); 
        genAddinTileAction(elemActions, 'gotoVaultItem', 'icon-open'       , 'Go To Item'); 
        genAddinTileAction(elemActions, 'addComponent' , 'icon-select'     , 'Insert into CAD'); 
        genAddinTileAction(elemActions, 'openComponent', 'icon-product'    , 'Open in CAD'); 
    }

}
function genAddinTileAction(elemActions, action, icon, tooltip) {

    elemActions.addClass('addin-actions');

    let elemAction = $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('filled')
        .addClass(icon)
        .attr('title', tooltip)
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            invokeAddinAction([$(this)], action);
        });

    return elemAction;

}
async function invokeAddinAction(elements, action) {

    console.log('--> START invokeAddinAction()');
    
    let selection = getSelectionData(elements);

    console.log(' action     : ' + action);
    console.log(' parameters : ' + selection.toString());
    
    switch(action) {

        case 'addComponent'     : chrome.webview.postMessage("addComponent:"     + selection.toString()); break;
        case 'openComponent'    : chrome.webview.postMessage("openComponent:"    + selection.toString()); break;
        case 'gotoVaultFolder'  : chrome.webview.postMessage("gotoVaultFolder:"  + selection.toString()); break;
        case 'gotoVaultFile'    : chrome.webview.postMessage("gotoVaultFile:"    + selection.toString()); break;
        case 'gotoVaultItem'    : chrome.webview.postMessage("gotoVaultItem:"    + selection.toString()); break;
        case 'gotoVaultECO'     : chrome.webview.postMessage("gotoVaultECO:"     + selection.toString()); break;
        case 'selectComponent'  : chrome.webview.postMessage("selectComponent:"  + selection.toString()); break;
        case 'isolateComponent' : chrome.webview.postMessage("isolateComponent:" + selection.toString()); break;

    }

}
function getSelectionData(elements) {

    let selection = [];

    for(let element of elements) {

        let selected     = '';
        let elemSelected = element.closest('.content-item');

        if(elemSelected.hasClass('vault-folder')) {

            selected = 'folder;' + elemSelected.attr('data-id') + ';' + elemSelected.attr('data-name') + ';' + elemSelected.attr('data-path');

        } else if(elemSelected.hasClass('vault-file')) {

            selected = 'file;' + elemSelected.attr('data-id') + ';' + elemSelected.attr('data-name') + ';' + elemSelected.attr('data-folder');

        } else if(elemSelected.hasClass('vault-item')) {

            selected = 'item;' + elemSelected.attr('data-id') + ';' + elemSelected.attr('data-name') + ';';

        } else {

            let partNumber = elemSelected.attr('data-part-number') || elemSelected.attr('data-title').split(' - ')[0];

            selected = 'plm-item;' + partNumber + ';' + elemSelected.attr('data-title') + ';' + elemSelected.attr('data-link');

        }

        selection.push(selected);

    }

    return selection;

}


// Insert actions into BOM table
function genAddinPLMBOMActions(id) {

    $('#' + id + '-tbody').children().each(function() {

        let elemFirstCol = $(this).children('.bom-first-col');
        let elemActions  = $('<div></div>').appendTo(elemFirstCol).addClass('table-actions');

        genAddinPLMItemTileActions(elemActions);
    
    });

}


// Get current active document to be added to BOM
async function getActiveDocument(context) {

    console.log('GetActiveDocument START');

    if(isBlank(context)) context = '-';

    console.log(context);

    if(typeof chrome.webview === 'undefined') return;
    

    const plmAddin = chrome.webview.hostObjects.plmAddin;
    let partNumber = await plmAddin.getActiveDocument(context);

    console.log(partNumber);

    if(isBlank(partNumber)) partNumber = '01-0712';

    return partNumber;

}



// function insertTileActions(id) {

//     let btnAssign = false;
//     let btnSelect = false;
//     let btnOpen   = false;
//     let btnAdd    = false;
//     let btnPLM    = false;

//     switch(id) {

//         case 'search-list':
//             btnSelect = true;
//             btnOpen   = true;
//             btnAdd    = true;
//             btnPLM    = true;
//             break;
        
//         case 'managed-items-list':
//             btnSelect = true;
//             btnOpen   = true;
//             btnAdd    = true;
//             btnPLM    = true;
//             break;

//         case 'materials-list':
//             btnAssign = true;
//             btnSelect = true;
//             btnPLM    = true;
//             break;


//     }

//     $('#' + id).children('.tile').each(function() {
//         insertTileAction($(this), btnAssign, btnSelect, btnOpen, btnAdd, btnPLM);
//     });

// }
// function insertTileAction(elemTile, btnAssign, btnSelect, btnOpen, btnAdd, btnPLM) {

//     if(isBlank(btnAssign)   ) btnAssign = false;
//     if(isBlank(btnSelect)   ) btnSelect = false;
//     if(isBlank(btnOpen)     )   btnOpen = false;
//     if(isBlank(btnAdd)      )    btnAdd = false;
//     if(isBlank(btnPLM)      )    btnPLM = false;

//     console.log(btnPLM);

//     let elemActions = $('<div></div>');
//         elemActions.addClass('tile-actions');
//         // elemActions.appendTo(elemTile.children('.tile-details'));
//         elemActions.appendTo(elemTile);


//     if(btnAssign) {

//         $('<div></div>').appendTo(elemActions)
//             .addClass('button')
//             .addClass('icon')
//             .addClass('icon-raw-material')
//             .attr('title', 'Material dem gewählten Körper zuweisen')
//             .click(function(e) {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 assignMaterial($(this).closest('.tile').attr('data-title'));
//             });

//     }

//     if(btnSelect) {

//         let elemAction4 = $('<div></div>');
//             elemAction4.addClass('button');
//             elemAction4.addClass('icon');
//             elemAction4.addClass('icon-zoom-in');
//             elemAction4.attr('title', 'Im Fenster auswählen');
//             elemAction4.appendTo(elemActions);
//             elemAction4.click(function(e) {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 select3D([$(this).closest('.tile').attr('data-title').split(' -')[0]]);
//             });

//     }

//     if(btnOpen) {

//         let elemAction3 = $('<div></div>');
//             elemAction3.addClass('button');
//             elemAction3.addClass('icon');
//             elemAction3.addClass('icon-new-window');
//             elemAction3.attr('title', 'In neuem Fenster öffnen');
//             elemAction3.appendTo(elemActions);
//             elemAction3.click(function(e) {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 openComponent([$(this).closest('.tile').attr('data-title').split(' -')[0]]);
//             });

//     }
    
//     if(btnAdd) {

//         $('<div></div>').appendTo(elemActions)
//             .addClass('button')
//             .addClass('icon')
//             .addClass('icon-create')
//             .attr('title', 'In der aktiven Sitzung hinzuladen')
//             .click(function(e) {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 addComponents([$(this).closest('.tile').attr('data-title').split(' -')[0]]);
//             });

//     }

//     if(btnPLM) {

//         $('<div></div>').appendTo(elemActions)
//             .addClass('button')
//             .addClass('icon')
//             .addClass('icon-open')
//             .attr('title', 'In PLM ansehen')
//             .click(function(e) {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 openItemByLink($(this).closest('.tile').attr('data-link'));
//             });

//     }

// }

// function insertAddinTileActions(elemTile) {

//     let elemDetails = elemTile.find('.tile-details');
//     let elemActions = $('<div></div>').appendTo(elemDetails).addClass('tile-actions');

//     if(elemTile.hasClass('component')) {

//         insertAddinTileAction(elemActions, 'icon-select', 'Select in active window').click(function(e) {
//             e.preventDefault();
//             e.stopPropagation();
//             invokeAddinAction([$(this)], 'select');
//         });

//         insertAddinTileAction(elemActions, 'icon-zoom-in', 'Isolate in active window').click(function(e) {
//             e.preventDefault();
//             e.stopPropagation();
//             invokeAddinAction([$(this)], 'isolate');
//         });

//         insertAddinTileAction(elemActions, 'icon-clone', 'Open in new window').click(function(e) {
//             e.preventDefault();
//             e.stopPropagation();
//             invokeAddinAction([$(this)], 'open');
//         });

//         insertAddinTileAction(elemActions, 'icon-create', 'Add to active window').click(function(e) {
//             e.preventDefault();
//             e.stopPropagation();
//             invokeAddinAction([$(this)], 'add');
//         });

//     } else if(elemTile.hasClass('vault-folder')) {}

// }
// function insertAddinTileAction(elemActions, icon, tooltip) {

//     let elemAction = $('<div></div>').appendTo(elemActions)
//         .addClass('button')
//         .addClass('icon')
//         .addClass(icon)
//         .attr('title', tooltip);

//     return elemAction;

// }




// Select or isolate parts in Inventor
// function select3D() {


//     let numbers = [
//         {
//             entityType     : 'file',
//             id             : '174166',
//             name           : '01-1918.dwg',
//             parentFolderId : '173998'
//         },
//         {
//             entityType     : 'item',
//             id             : '174181',
//             name           : '01-1918',
//             parentFolderId : ''
//         }

//     ];


//     console.log('select3D START');
//     // console.log('select3D isolate : ' + isolate);
//     console.log(numbers);

//     if(typeof chrome.webview === 'undefined') {
//         // let selectNumbers = [];
//         // for(let selectNumber of partNumbers) {
//         //     let numbers = selectNumber.split('|');
//         //     let number = numbers[numbers.length - 1];
//         //     selectNumbers.push(number.split(':')[0]);
//         // }
//         // viewerSelectModels(selectNumbers, false, true);
//         // $('#bom-tbody').children().each(function() {
//         //     let partNumber = $(this).attr('data-part-number');
//         //     if(selectNumbers.indexOf(partNumber) < 0) $(this).removeClass('selected');
//         //     else $(this).addClass('selected');
//         // });
//     // } else if(isolate) isolateComponents(partNumbers);
//     } else selectComponents(numbers);
// }
// async function selectComponents() {

//     let numbers = [
//         {
//             entityType     : 'file',
//             id             : '174166',
//             name           : '01-1918.dwg',
//             parentFolderId : '173998'
//         },
//         {
//             entityType     : 'item',
//             id             : '174181',
//             name           : '01-1918',
//             parentFolderId : ''
//         }

//     ];


//     numbers = [
//         "file;174166,01-1918.dwg;173998",
//         "item;174181,01-1918;"
//     ];

//     console.log('selectComponents STARTING');
//     console.log(numbers.length);
//     console.log(numbers);
//     if(typeof chrome.webview === 'undefined') {

//     } else  {

//         const plmAddin = chrome.webview.hostObjects.plmAddin;
//         await plmAddin.selectComponents(numbers);

//     }

// }
// async function isolateComponents(partNumbers) {

//     console.log('isolateComponents START');
//     console.log(partNumbers.length);
//     console.log(partNumbers);

//     if(typeof chrome.webview === 'undefined') return;

//     const plmAddin = chrome.webview.hostObjects.plmAddin;
//     await plmAddin.isolateComponents(partNumbers);

// }


// Vault Integration
// async function gotoVaultFolder(partNumbers) {

//     console.log('gotoVaultFolder START');

//     alert('gotoVaultFolder START');

//     if(typeof chrome.webview === 'undefined') alert('webview does not exist');
//     else alert('webview exists');

//     if(typeof window.hostObjects                === 'undefined') alert('window.hostObjects does not exist');
//     if(typeof window.plmAddin                   === 'undefined') alert('window.plmAddin does not exist');
//     if(typeof window.webview                    === 'undefined') alert('window.webview does not exist');
//     if(typeof window.JavascriptObjectRepository === 'undefined') alert('window.JavascriptObjectRepository does not exist');
//     if(typeof JavascriptObjectRepository        === 'undefined') alert('JavascriptObjectRepository does not exist');
//     // if(typeof window.hostObjects === 'undefined') alert('window.hostObjects does not exist');
//     // if(typeof window.hostObjects === 'undefined') alert('window.hostObjects does not exist');


//     if(typeof chrome.webview === 'undefined') return;

//     const plmAddin = chrome.webview.hostObjects.plmAddin;
//     await plmAddin.isolateComponents(partNumbers);

// }



// Enable Inventor to highlighting items
// function addinSelect(partNumbers) {

//     console.log('addinSelect START');
//     console.log(partNumbers);

//     if($('#tab-bom').length > 0) {

//         if(!$('#tab-bom').hasClass('selected')) {
//             $('#tab-bom').click();
//         }

//         $('#flat-bom-tbody').children().each(function() {
//             let elemItem   = $(this);
//             let partNumber = elemItem.attr('data-part-number');
//             if(partNumbers.includes(partNumber)) { elemItem.addClass('selected') } else { elemItem.removeClass('selected'); }
//         });

//         // toggleFlatBOMItemActions($('#flat-bom-tbody'));
//         updateFlatBOMCounter($('#flat-bom'));

//     }

// }



// Enable Inventor to open raw material search
// function addinSelectRawMaterial(bodyName) {

//     console.log('addinSelectRawMaterial START');

//     $(document).ready(function() {

//         if(!$('#tab-materials').hasClass('selected')) $('#tab-materials').click();

//         console.log(bodyName);

//         if(isBlank(bodyName)) {

//             insertRecentItems('materials', ['57']);

//         } else {

//             $('#materials-input').val(bodyName);
//             $('#materials-submit').click();

//         }

//     });

//     return true;

// }

// Add selected item to current Inventor session
// async function addComponents(partNumbers) {

//     console.log('addComponents START');
//     console.log(partNumbers.length);
//     console.log(partNumbers);

//     if(typeof chrome.webview === 'undefined') return;

//     const plmAddin = chrome.webview.hostObjects.plmAddin;
//     await plmAddin.addComponents(partNumbers);

// }

// Open selected item in new Inventor window
// async function openComponent(partNumber) {

//     console.log('openComponent START');
//     console.log(partNumber);

//     if(typeof chrome.webview === 'undefined') return;

//     const plmAddin  = chrome.webview.hostObjects.plmAddin;
//     await plmAddin.openComponent(partNumber.toString());

// }




// async function updateProperties(data) {

//     console.log('updateProperties START');
//     console.log(data);

//     const plmAddin = chrome.webview.hostObjects.plmAddin;
//     await plmAddin.updateProperties(data.toString());
//     // TODO muss als string ausgegeben werden

// }





// Get currently selected components including their path to assign them to a given configuration feature option
// async function getSelectedComponentPaths() {

//     console.log('getSelectedComponentPaths START');

//     if(typeof chrome.webview === 'undefined') {

//         console.log('Standalone');



        
//         // return await viewerGetSelectedComponentPaths();
//         //  viewerGetSelectedComponentPaths().then(function(data) {
//             // console.log('hier');
//             // return data;
//         // });

//     } else {

//         console.log('plugin starten');

//         const plmAddin = chrome.webview.hostObjects.plmAddin;
//         let selectedComponentPaths = await plmAddin.getSelectedComponentPaths('-');
    
//         console.log(selectedComponentPaths);
    
//         return selectedComponentPaths;


//         // return new Promise(function(resolve, reject) {

//         //     const plmAddin = chrome.webview.hostObjects.plmAddin;
//         //     let selectedComponentPaths = plmAddin.getSelectedComponentPaths();
        
//         //     console.log(selectedComponentPaths);
        
//         //     resolve(selectedComponentPaths);
    
//         // });

//     }

// }


// Get list of part numbers locked in Inventor to prevent changes in PLM
// async function getComponentsLocked(partNumbers) {

//     console.log('getComponentsLocked START');
//     console.log(partNumbers);

//     const plmAddin  = chrome.webview.hostObjects.plmAddin;
//     let itemsLocked = await plmAddin.getComponentsLocked(partNumbers);

//     console.log(itemsLocked);
//     return itemsLocked;

// }


// async function setLifecycleState(name, state) {

//     console.log('setLifecycleState START');
//     console.log(name);
//     console.log(state);

//     const plmAddin = chrome.webview.hostObjects.plmAddin;
//     await plmAddin.setLifecycleState(name, state);

// }

// function addinSelect(partNumbers) {


//     $('.item').each(function() {
//         let elemItem   = $(this);
//         let partNumber = elemItem.attr('data-part-number');
//         if(partNumbers.includes(partNumber)) { elemItem.addClass('selected') } else { elemItem.removeClass('selected'); }
//     });

// }

// function setDirty(data) {

//     console.log('setDirty START');

//     chrome.webview.hostObjects.plmAddin.IsChanged = data;

// }