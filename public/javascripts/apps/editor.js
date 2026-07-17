let wsConfig       = {};
let links          = { context : '', root : '', side : '' };
let headerSubtitle = '';
let paramsBOM      = {};
let editMode       = 'existing';
let bomPartsList   = [];
let nextId         = 1;


let saveActions = {
    create : {
        label       : 'Creating New Items',
        className   : 'pending-create',
        selector    : '',
        maxRequests : 2,
    },
    edit : {
        label       : 'Updating Existing Items',
        className   : 'pending-edit',
        selector    : '',
        maxRequests : 2,
    },
    remove : {
        label       : 'Removing Items',
        className   : 'pending-remove',
        selector    : '',
        maxRequests : 5,
    },
    link : {
        label       : 'Creating / Updating Links',
        className   : 'link',
        selector    : '',
        maxRequests : 5,
    }
}


$(document).ready(function() {

    if(isBlank) {
        let keys = Object.keys(config);
        config = config[keys[0]];

    } else config = config[urlParameters.config];
    
    config.wsContext          = {};
    config.wsMain.workspaceId = config.wsMain.workspaceId || common.workspaceIds.requirements;

    for(let workspace of config.wsContexts) {
        let workspaceId = common.workspaceIds[workspace.workspace];
        if(urlParameters.wsId == workspaceId) {
            workspace.workspaceId = workspaceId;
            config.wsContext      = workspace;
        }
    }    

    appendOverlay();
    setUIEvents();   
    setAppLabels();
    setAddExistingPanel();

    let requests = [
        $.get('/plm/sections', { wsId : config.wsMain.workspaceId, useCache : true } ),
        $.get('/plm/fields'  , { wsId : config.wsMain.workspaceId, useCache : true } )
    ];

    if(!isBlank(urlParameters.link)) {
        if(urlParameters.wsId != config.wsMain.workspaceId) {
            requests.push($.get('/plm/details',  { link : urlParameters.link }));
            requests.push($.get('/plm/sections', { link : urlParameters.link, useCache : true }));
            links.context = urlParameters.link;
        }
    }

    getFeatureSettings('editor', requests, function(responses) {

        config.wsMain.sections       = responses[0].data;
        config.wsMain.advancedFields = [];
        config.wsMain.picklists      = [];

        let listPicklists     = [];
        let requestsPicklists = [];

        for(let advancedField of config.wsMain.advancedFieldIds) {
            for(let field of responses[1].data) {
                
                let fieldId = field.__self__.split('/').pop();
                
                if(fieldId === advancedField) {

                    if(field.picklist !== null) {
                        if(!listPicklists.includes(field.picklist)) {
                            listPicklists.push(field.picklist);
                        }
                    }

                    config.wsMain.advancedFields.push({
                        fieldId  : fieldId,
                        editable : (field.editability === 'ALWAYS'),
                        type     : field.type.title,
                        def      : field
                    })

                    break;
                
                }

            }
        }

        for(let picklist of listPicklists) requestsPicklists.push($.get('/plm/picklist', { link : picklist }));

        if(links.context !== '') {
            links.root     = getSectionFieldValue(responses[2].data.sections, config.wsContext.fieldIds.link, '', 'link');
            headerSubtitle = responses[2].data.title;
            let newTitle   = responses[2].data.title;
            if(config.wsContext.fieldIds.title !== 'DESCRIPTOR') newTitle = getSectionFieldValue(responses[2].data.sections, config.wsContext.fieldIds.title, '');
            $('#start-descriptor').html(headerSubtitle);
            $('#start-name').val(newTitle);
            config.wsContext.sections = responses[3].data;
        } else {
            links.root = urlParameters.link;
        }

        config.panels.insertDetails.id       = 'side';
        config.panels.insertAttachments.id   = 'side';
        config.panels.insertRelationships.id = 'side';
        config.panels.insertChangeLog.id     = 'side';
            
        Promise.all(requestsPicklists).then(function(responses) {
        
            config.wsMain.picklists = responses;

            if(urlParameters.link === '') openLandingPage();
            else if(links.root    === '') openStartScreen();
            else                          openEditor();

        });

    });

});

function setUIEvents() {


    // Header Toolbar
    $('#header-subtitle').click(function(e) {
             if(links.root    !== '') openItemByLink(links.root);
        else if(links.context !== '') openItemByLink(links.rocontextot);
    });
    $('#button-toggle-navigator').click(function() {
        $('body').toggleClass('no-navigator');
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
    });
    $('#button-toggle-advanced-mode').click(function() {
        $('body').toggleClass('no-advanced-mode');
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
    });
    $('#button-toggle-add-existing').click(function() {
        if($(this).hasClass('disabled')) return;
        $('body').toggleClass('no-add-existing');
        $(this).toggleClass('toggle-on').toggleClass('toggle-off'); 
    });    


    // Start screen confirmation
    $('#start-button').click(function() {

        let elemTitle    = $('#start-name');
        let elemSelected = $('#start-templates').find('.selected').first();
        let valueDraft   = $('#start-paste').val();

        if(hasRequiredInput(elemTitle, 'Title is required')) {

            if(elemSelected.length > 0) editMode = 'template';
            else if(valueDraft !==  '') editMode = 'paste';
            else                        editMode = 'empty';

            links.root = '';

            $('#overlay').show();

            if(editMode === 'template') {

                $('body').addClass('template-mode');
                links.root = elemSelected.attr('data-link');
                openEditor();

            } else {

                let params   = {
                    wsId     : config.wsMain.workspaceId,
                    sections : config.wsMain.sections,
                    fields   : [{ fieldId : 'TITLE', value : $('#start-name').val() }]
                }

                $.post('/plm/create', params, function(response) {

                    printResponseErrorMessagesToConsole(response);

                    links.root = response.data.split('.autodeskplm360.net')[1];

                    // storeRootLinkOnContextItem();
                    openEditor();
    
                });

            }

            

            // if((elemSelected.length === 0) || (valueDraft !== '')) {

            //     $('#overlay').show();

            //     let params   = {
            //         wsId     : config.wsMain.workspaceId,
            //         sections : config.wsMain.sections,
            //         fields   : [{ fieldId : 'TITLE', value : $('#start-name').val() }]
            //     }

            //     $.post('/plm/create', params, function(response) {

            //         printResponseErrorMessagesToConsole(response);

            //         links.root = response.data.split('.autodeskplm360.net')[1];

            //         storeRootLinkOnContextItem();
            //         openEditor();
    
            //     });

            // } else {
            //     links.root = elemSelected.attr('data-link');
            //     // fromTemplate = true;
            //     openEditor();
            // }

        }

    });
    $('#start-name').on('keyup', function() { 
        $(this).removeClass('missing-input'); 
        $(this).next('.missing-text').remove(); 
    });


    // Content Editor
    $('#create').click(function() {
        saveChanges();
    });    
    $('#save').click(function() {
        saveChanges();
    });        
    // $('#auto-save').click(function() {
    //     $(this).toggleClass('toggle-on').toggleClass('toggle-off');
    // });    
    $('#editor-side-panel').on('change', function() {
        toggleSidePanel();
    });
    $('#editor-collapse-all').click(function() {
        $('#editor .editor-item').addClass('collapsed');
        $('#editor .editor-item-toggle').removeClass('icon-minus').addClass('icon-plus');
    });
    $('#editor-expand-all').click(function() {
        $('#editor .editor-item').removeClass('collapsed');
        $('#editor .editor-item-toggle').removeClass('icon-plus').addClass('icon-minus');
    });


    // Cross Highlight
    $('#editor').mouseover(function(e) {
        const elemItem = $(e.target).closest('.editor-item');
        crossHighlight(elemItem, 'tree', 'pins');
    });    
    $('#editor').mouseleave(function(e) { $('*').removeClass('hover'); });
    $('#pins').mouseover(function(e) {
        const elemItem = $(e.target).closest('.editor-item');
        crossHighlight(elemItem, 'tree', 'editor');
    });    
    $('#pins').mouseleave(function(e) { $('*').removeClass('hover'); });


    // Min / Max Controls
    $('#max-first').click(function() {

        let elemEditor = $('.editor-item.max');
        let elemRef    = elemEditor.prevAll().last();

        if(elemRef.length > 0) {
            elemEditor.removeClass('max').addClass('min');
            elemRef.addClass('max').removeClass('min');
            selectMatchingTreeItem(elemRef);
        }

    });
    $('#max-parent').click(function() {

        let elemEditor = $('.editor-item.max');
        let elemRef    = getParent(elemEditor);

        if(elemRef !== null) {
            elemEditor.removeClass('max').addClass('min');
            elemRef.addClass('max').removeClass('min');
            selectMatchingTreeItem(elemRef);
        }

    });
    $('#max-prev-sibling').click(function() {

        let elemEditor = $('.editor-item.max');
        let elemRef    = getSibling(elemEditor, 'prev');

        if(elemRef !== null) {
            elemEditor.removeClass('max').addClass('min');
            elemRef.addClass('max').removeClass('min');
            selectMatchingTreeItem(elemRef);
        }

    });
    $('#max-prev').click(function() {

        let elemEditor = $('.editor-item.max');
        let elemRef    = elemEditor.prev();

        if(elemRef.length > 0) {
            elemEditor.removeClass('max').addClass('min');
            elemRef.addClass('max').removeClass('min');
            selectMatchingTreeItem(elemRef);
        }

    });
    $('#max-next').click(function() {

        let elemEditor = $('.editor-item.max');
        let elemRef    = elemEditor.next();

        if(elemRef.length > 0) {
            elemEditor.removeClass('max').addClass('min');
            elemRef.addClass('max').removeClass('min');
            selectMatchingTreeItem(elemRef);
        }

    });
    $('#max-next-sibling').click(function() {

        let elemEditor = $('.editor-item.max');
        let elemRef    = getSibling(elemEditor, 'next');

        if(elemRef !== null) {
            elemEditor.removeClass('max').addClass('min');
            elemRef.addClass('max').removeClass('min');
            selectMatchingTreeItem(elemRef);
        }

    });
    $('#max-last').click(function() {

        let elemEditor = $('.editor-item.max');
        let elemRef    = elemEditor.nextAll().last();

        if(elemRef.length > 0) {
            elemEditor.removeClass('max').addClass('min');
            elemRef.addClass('max').removeClass('min');
            selectMatchingTreeItem(elemRef);
        }

    });


    // Pin Controls
    $('#pins-close').click(function() {
        $('body').addClass('no-pins');
        $('.pinned').removeClass('pinned');
        $('.pin').remove();
    });


    // Add Existing
    $('#add-select').on('change', function() {
        setAddExistingPanel();
    });

}
function setAppLabels() {

    $('#start-header').html(config.labels.newTitle);
    $('#header-title').html(config.labels.appTitle);
    $('#button-toggle-add-existing').html(config.labels.addExisting);
    $('#add-title').html(config.labels.addExisting);
    
    document.title = config.labels.appTitle;

}


// If no dmsId is specified, open standard landing page 
function openLandingPage() {

    console.log('openLandingPage');

    $('#landing').show();
    $('#start'  ).hide();
    $('#main'   ).hide();

    $('body').addClass('landing');

    let filters =  [{"field" : "TITLE","type" : "0","comparator" : "not-blank" ,"value" : ""}]

    insertWorkspaceViews(config.wsMain.workspaceId, {
        id          : 'landing',
        headerLabel : 'Requirements',
        reload      : true,
        onClickItem: function(elemClicked) {
            links.root = elemClicked.attr('data-link');
            openEditor();
        }
    });

}


// If there is no specification available, open the start screen with template selection
function openStartScreen() {

    $('#landing').hide();
    $('#start'  ).show();
    $('#main'   ).hide();

    $('body').removeClass('landing');

    $('#start-name').focus();

    let params = config.panels.insertTemplates;
    
    params.id = 'start-templates-list';

    insertResults(config.wsMain.workspaceId, null, params);

}


/* ----------------- AI generated code -------------------------- */
function parseDraft() {

    const pastedText = $('#start-paste').val();

    if(pastedText === '') return null;

    const text = pastedText
        .replace(/\r\n?/g, "\n")
        .replace(/\u00a0/g, " ")
        .trim();

    // Matches headings like:
    // 1 TITLE
    // 3.1 TITLE
    // 6.5.5 TITLE
    // const headingRegex = /^(\d+(?:\.\d+)*)\s+([^\n]+)$/gm;
    const headingRegex = /^(\d+(?:\.\d+)*)[ \t]+([A-ZÄÖÜ0-9][^\n]*)$/gmi;
    const matches      = [...text.matchAll(headingRegex)];

    return matches.map((match, index) => {

        const start = match.index + match[0].length;
        const end   = matches[index + 1]?.index ?? text.length;

        return {
            number : match[1],
            title  : match[2].trim(),
            level  : match[1].split(".").length,
            // body   : text.slice(start, end).trim()
            body   : genHTMLFromWord(text.slice(start, end).trim())
        };

    });

}
function genHTMLFromWord(text) {
    const lines = text
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);

    let html = "";
    let inList = false;

    for (const line of lines) {

        // Bullet list
        if (/^[•●−-]\s*/.test(line)) {
            
            if (!inList) {
                html += "<ul>";
            inList = true;
            }

            html += `<li>${escapeHtml(
                line.replace(/^[•●−-]\s*/, "")
            )}</li>`;

            continue;
    
        }

        if(inList) {
        html += "</ul>";
        inList = false;
        }

        // Table row (tab separated)
        if (line.includes("\t")) {
            const cells = line
                .split("\t")
                .map(cell =>
                    `<div class="editor-table-cell">${escapeHtml(cell.trim())}</div>`
                )
                .join("");

            html += `<div class="editor-table-row">${cells}</div>`;
            continue;
        }

        html += `<p>${escapeHtml(line)}</p>`;
    
    }

    if (inList) {
        html += "</ul>";
    }

    return html;

}
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
/* -------------------------------------------------------------- */


// Opens selected Requirements Structure Editor
function openEditor() {

    $('#overlay').hide();
    $('#landing').hide();
    $('#start'  ).hide();
    $('#main'   ).show();

    $('body').removeClass('landing');

    paramsBOM                 = config.panels.insertBOM;
    paramsBOM.id              = 'tree';
    paramsBOM.bomViewName     = config.wsMain.bomViewName;
    paramsBOM.onClickItem     = function(elemClicked) { selectBOMItem( elemClicked); };
    paramsBOM.afterCompletion = function(id, data)    { afterBOMCompletion(id, data); };

    if((editMode !== 'template')) {

        paramsBOM.dragable    = true;
        paramsBOM.onDragStart = 'onTreeDragStart(event)';
        paramsBOM.onDragEnd   = 'onTreeDragEnd(event)';

        paramsBOM.dropable    = true;
        paramsBOM.onDragEnter = 'onTreeDragEnter(event)';
        paramsBOM.onDragOver  = 'onTreeDragOver(event)';
        paramsBOM.onDragLeave = 'onTreeDragLeave(event)';
        paramsBOM.onDrop      = 'onTreeDrop(event)';

    } else {

        $('#button-toggle-add-existing').addClass('disabled');

    }

    let requests = [];

    if(links.root !== '') {
        if(editMode === 'existing') {
            if(!isBlank(urlParameters.working)) {
                requests.push($.get('/plm/versions', { link : links.root }));
                paramsBOM.revisionBias = 'working';
            }
        }
        if(headerSubtitle === '') {
            requests.push($.get('/plm/descriptor', { link : links.root }));
        }
    }

    Promise.all(requests).then(function(responses) {

        if(!isBlank(urlParameters.working) && (editMode === 'existing')) {

            let response   = getResponseFromResponses(responses, '/plm/versions'  , links.root);
            headerSubtitle = getResponseFromResponses(responses, '/plm/descriptor', links.root);

            for(let version of response.data.versions) {
                if((version.status === 'WORKING') || (version.status === 'UNRELEASED')) {
                    links.root = version.item.link;
                    headerSubtitle = version.item.title;
                    break;
                }
            }

        } else if(headerSubtitle === '') {

            let response = getResponseFromResponses(responses, '/plm/descriptor', links.root);

            headerSubtitle = response.data;

        }
        
        $('#header-subtitle').html(headerSubtitle);
        document.title = 'EDIT ' + headerSubtitle;

        insertBOM(links.root, paramsBOM);
        setSidePanel(links.root);

    });

}
function afterBOMCompletion(id, data) {

    $('#tree-tbody').mouseover(function(e) {

        const elemItem = $(e.target).closest('.content-item');
        
        crossHighlight(elemItem, 'editor', 'pins');
     
    });

    // $('#editor-content').mouseover(function(e) {

    //     let elemMatch = getMatch($(e.target).closest('.editor-item'));

    //     elemMatch.addClass('hover');
    //     elemMatch.siblings().removeClass('hover');
     
    // });

    $('#tree-tbody').mouseleave(function(e) { $('*').removeClass('hover'); });
    // $('#editor-content').mouseleave(function(e) { $('*').removeClass('hover'); });


    bomPartsList = data.bomPartsList;

    if(bomPartsList.length == 1) {

        const draftList = parseDraft();

        console.log(draftList);

        if(draftList !== null) {
            for(let item of draftList) {
                bomPartsList.push({
                    link       : '',
                    number     : '',
                    revision   : 'WIP',
                    linkParent : '',
                    edgeId     : '',
                    level      : item.level,
                    details    : {
                        TITLE       : item.title,
                        DESCRIPTION : item.body
                    }
                });
            }
        } else {
            bomPartsList.push({
                link       : '',
                number     : '',
                revision   : 'WIP',
                linkParent : '',
                edgeId     : '',
                level      : 1,
                details    : {
                    TITLE       : '',
                    DESCRIPTION : ''
                }
            });   
        }

        console.log(bomPartsList);

    }

    for(let index = 1; index < bomPartsList.length; index++) {
        
        let bomPart  = bomPartsList[index];
        let elemItem = $('#tree').find('.tree-item').eq(nextId - 1);
        
        elemItem.addClass('id-' + nextId);
        elemItem.attr('data-id', nextId);
        insertContentEditorElement(null, bomPart.link, bomPart.number, bomPart.revision, bomPart.linkParent, bomPart.edgeId, bomPart.level, bomPart.details);

    }

    setNumbersAndLevels();

    if(editMode === 'template') {

        $('#tree-tbody').find('.content-item').each(function() {

            $(this).attr('draggable', false);

            let elemActionIcon = $('<div></div>')
                .addClass('tree-template-action')
                .addClass('template-action')
                .addClass('action-clone');

            $('<td></td>').appendTo($(this)).append(elemActionIcon)
                .addClass('tree-template-action-icon');

        });

    }

}
function insertContentEditorElement(elemPrevious, link, number, revision, parent, edge, level, data) {

    let elemEditorContent = $('#editor-content');

    let elemTop = $('<div></div>')
        .addClass('editor-item')
        .addClass('level-' + level)
        .addClass('id-' + nextId)
        .attr('data-id', nextId++)
        .attr('data-level' , level)
        .attr('data-link'  , link   || '')
        .attr('data-number', number || '')
        .attr('data-parent', parent || '')
        .attr('data-edgeid'  , edge   || '')
        .click(function() {
            setSidePanel($(this).attr('data-link'));
                    // .click(function() {
            selectMatchingTreeItem($(this));
        // })
        });

    if(elemPrevious === null) elemTop.appendTo(elemEditorContent); else elemTop.insertAfter(elemPrevious);

    let elemHeader = $('<div></div>').appendTo(elemTop)
        .addClass('editor-item-header');

    let elemChangeIndicator = $('<div></div>').appendTo(elemHeader)
        .addClass('editor-item-change-inidcator'); 

    $('<div></div>').appendTo(elemHeader)
        .addClass('editor-item-toggle')
        .addClass('icon')
        .addClass('icon-minus');

    enableEditorItemToggle(elemTop);

    if(editMode === 'template') {

        let elemTemplateAction = $('<select></select>')
            .addClass('editor-template-action')
            .addClass('template-action')
            .addClass('button')
            .addClass('action-clone')
            .on('change', function() {
                setTemplateActionStyle($(this));
            });

        elemTemplateAction.append($('<option value="clone">Clone</option>'));
        elemTemplateAction.append($('<option value="reuse">Reuse</option>'));
        elemTemplateAction.append($('<option value="remove">Remove</option>'));

        elemTemplateAction.appendTo(elemHeader);

    }

    let elemNumber = $('<div></div>').appendTo(elemHeader)
        .addClass('editor-item-number')
        .html(number);

    if(data === null) { 
        data = {}; 
        setChanged(elemTop);
    } else {

        let isReused = (data[config.wsMain.bomFieldReuse] == 'true');

        if(isReused) {
            $('<div></div>').appendTo(elemHeader)
                .addClass('editor-item-reused')
                .addClass('icon')
                .addClass('icon-join')
                .attr('title', 'Reused');
        }
    }        

    let elemTitle = $('<input></input>').appendTo(elemHeader)
        .addClass('editor-item-title')
        .attr('placeholder', 'Enter Requirement Title')
        .val(data.TITLE || '')
        .on('keyup', function() {
            if($(this).val() === '') $(this).addClass('missing'); else $(this).removeClass('missing');
            updateTreeItemTitle($(this));
            updatePin($(this));
            setChanged($(this).closest('.editor-item'));
        });

    let elemActions = $('<div></div>').appendTo(elemHeader)
        .addClass('editor-item-actions');

    insertContentEditorElementAction(elemActions, 'up', 'Move up within same level', 'icon-move-up');
    insertContentEditorElementAction(elemActions, 'do', 'Move down within same level', 'icon-move-down');        
    insertContentEditorElementAction(elemActions, 'le','Outdent', 'icon-outdent');
    insertContentEditorElementAction(elemActions, 'ri', 'Indent', 'icon-indent');

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-pin')
        .click(function(e) {
            e.stopPropagation();
            togglePin($(this));
        });

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-maximize')
        .click(function(e) {
            e.stopPropagation();
            $('.editor-item').removeClass('collapsed');
            selectMatchingTreeItem($(this).closest('.editor-item'));
            maxEditorItem($(this));
        });

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-open')
        .click(function(e) { 
            e.stopPropagation();
            openItemByLink($(this).closest('.editor-item').attr('data-link')); 
        });

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-delete')
        .click(function(e) {
            e.stopPropagation();
            deleteContentEditorElement($(this));
        });      

    let elemRevision = $('<div></div>').appendTo(elemHeader)
        .addClass('editor-item-revision')
        .html(revision);     

    setLockedStatus(elemTop, elemTitle, revision, data); 
    setReusedStatus(elemTop, elemTitle, revision, data); 

    let elemContents = $('<div></div>').appendTo(elemTop)
        .addClass('editor-item-contents');    

    let elemDescription = $('<div></div>').appendTo(elemContents)
        .addClass('editor-item-description');

    let elemInput = insertRichTextEditor(elemDescription, data.DESCRIPTION || '', null, 'editor-item');

    elemInput.on('keyup', function() {
        setChanged($(this).closest('.editor-item'));
        updatePin($(this));
    });

    insertAdvancedFields(elemTop, data);

    if(elemTop.hasClass('locked')) {
        elemTop.find('input').attr('disabled', 'disabled');
        elemTop.find('textarea').attr('disabled', 'disabled');
        elemTop.find('.rte-input').attr('contenteditable', 'false');
        elemTop.find('.rte-toolbar').addClass('hidden');
    }

    let elemParent = getParent(elemTop);
    let insertNext = true;

    if(elemParent === null) {
        if(bomPartsList[0].revision !== 'WIP') insertNext = false;
    } else if (elemParent.hasClass('locked'))  insertNext = false;

    if(insertNext) insertContentEditorAddNext(elemTop); else $('<div></div>').appendTo(elemTop).addClass('editor-item-spacer');

    if(isBlank(link)) {
        setChanged(elemTop);
        insertMatchingBOMTreeNode(elemTop, elemPrevious);
    }

    return elemTop;

}
function setLockedStatus(elemEditor, elemTitle, revision, data) {

    let isLocked  = (editMode === 'template') ? true : false;
    let lockValue = data[config.wsMain.itemsLocked.fieldId] || '';

    if(revision !== '') {
        if(revision !== 'WIP') { 
            isLocked = true;

        }
    }  

    if(!isLocked) {
        isLocked = (lockValue == config.wsMain.itemsLocked.value);
    }

    if(isLocked) {
        
        elemEditor.addClass('locked'); 

        $('<div></div>').insertBefore(elemTitle)
            .attr('title', config.wsMain.itemsLocked.title || '')
            .addClass('editor-item-lock')
            .addClass('icon')
            .addClass('filled')
            .addClass('icon-lock')
            .addClass('surface-level-2');

    }

    elemEditor.attr('data-lock-value', lockValue);

    return isLocked;

}
function unlockEditorItem(elemEditor) {

    elemEditor.removeClass('locked');

    elemEditor.find('.editor-item-lock').remove();

    elemEditor.find('.editor-item-lock').remove();
    elemEditor.find('input').removeAttr('disabled');
    elemEditor.find('textarea').removeAttr('disabled');
    elemEditor.find('.editor-item-advanced select').removeAttr('disabled');
    elemEditor.find('.rte-input').attr('contenteditable', true);    
    elemEditor.find('.rte-toolbar').removeClass('hidden');

}
function setReusedStatus(elemEditor, elemTitle, revision, data) {

    const reuseValue = data[config.wsMain.itemsReused.fieldId] || '';
    const isReused   = (reuseValue == config.wsMain.itemsReused.value);

    if(isReused) setEditorItemReused(elemEditor);

    return isReused;

}
function setEditorItemReused(elemEditor) {

    elemEditor.addClass('reused'); 

    const elemTitle = elemEditor.find('.editor-item-title');

    $('<div></div>').insertBefore(elemTitle)
        .attr('title', config.wsMain.itemsReused.title || '')
        .addClass('editor-item-reuse')
        .addClass('icon')
        .addClass('filled')
        .addClass('icon-join')
        .addClass('surface-level-2');

}
function insertContentEditorElementAction(elemToolbar, direction, title, icon) {

    let elemButton = $('<div></div>').appendTo(elemToolbar)
        .addClass('button')
        .addClass('icon')
        .addClass(icon)
        .attr('title', title)
        .attr('data-direction', direction)
        .click(function(e) {
            e.stopPropagation();
            moveContentEditorElement($(this));
        });

    return elemButton;

}
function insertAdvancedFields(elemTop, data) {

    let elemAdvanced = $('<div></div>').appendTo(elemTop)
        .addClass('editor-item-advanced');

    let formSettings = {
        editable : true
    };

    for(let field of config.wsMain.advancedFields) {

        let value      = data[field.fieldId] || '';
        let isEditable = field.editable;
        let elemField = $('<div></div>').appendTo(elemAdvanced)
            .addClass('field')
            .addClass('content-item')
            .attr('id', 'field-' + field.id)

        let elemValue = $('<div></div>').attr('data-class-id', field.classId || '');       
    
        $('<div></div>').appendTo(elemField).addClass('field-label').html(field.def.name);

        field.def.hasValue = true;
        field.def.setValue = value;

            // if(isEditable) {

                // if(field.def.type.title === 'Radio Button') {
                //     field.def.type.title = 'Single Selection';
                // }

                // column.id = column.fieldId;
                // let data = [{ id : column.fieldId, value : getBOMCellValue(edge.child, column.__self__.urn, bom.nodes, 'title')}];
        insertField(formSettings, elemValue, field.def, null, [], false, false);

        elemValue.addClass('field-value');
        elemValue.appendTo(elemField);
        elemValue.children().on('keyup', function() {
            setChanged($(this).closest('.editor-item'));
        });        

    }

}
function insertContentEditorAddNext(elemTop) {

    let elemAddNext = $('<div></div>').appendTo(elemTop)
        .addClass('editor-item-insert-next')
        .click(function() {

            let elemPrevious = $(this).closest('.editor-item');
            let elemNext     = elemPrevious.next();
            let level        = elemPrevious.attr('data-level');

            if(elemNext.length > 0) {
                let levelNext = elemNext.attr('data-level');
                if(levelNext >= level) level = levelNext;
            }

            let elemTop = insertContentEditorElement(elemPrevious, null, '', 'WIP', null, null, level, null);

            $('.tree-item').removeClass('selected');
            setNumbersAndLevels();

            elemTop.find('.editor-item-title').focus();
            elemTop.get(0).scrollIntoView({ behavior : 'smooth', block: 'nearest', inline: 'start' });

        });

    $('<div></div>').appendTo(elemAddNext)
        .addClass('editor-item-insert-next-button')
        .addClass('with-icon')
        .addClass('icon-create')
        .html('Click to insert next');
        
    $('<div></div>').appendTo(elemAddNext).addClass('editor-item-insert-next-line');

    elemAddNext.attr('ondragenter', 'onDragEnter(event)' );
    elemAddNext.attr('ondragover' , 'onDragOver(event)'  );
    elemAddNext.attr('ondragleave', 'onDragLeave(event)' );
    elemAddNext.attr('ondrop'     , 'onEditorDrop(event)');

}
function enableEditorItemToggle(elemEditor) {

    let elemToggle = elemEditor.find('.editor-item-toggle').first();
        
    elemToggle.click(function(e) {
        e.stopPropagation();
        $(this).toggleClass('icon-minus').toggleClass('icon-plus');
        $(this).closest('.editor-item').toggleClass('collapsed')
    }); 

}
function setTemplateActionStyle(elemSelect) {

    let elemChanged = elemSelect.closest('.editor-item');
    let newAction   = elemSelect.val();
    let listParents = getParents(elemChanged);
    let listFamily  = getFamily(elemChanged);

    for(let elemParent of listParents) {

        let elemAction = elemParent.find('.editor-template-action');

        if(newAction === 'remove') {

            if(elemAction.val() === 'reuse') {

                elemAction.val('clone');
                elemAction.removeClass('action-reuse');
                elemAction.addClass('action-clone');

            }

        } else if(newAction === 'clone') {

            if(elemAction.val() !== 'clone') {

                elemAction.val('clone');
                elemAction.removeClass('action-reuse');
                elemAction.removeClass('action-remove');
                elemAction.addClass('action-clone');

            }

        } else if(newAction === 'reuse') {

            if(elemAction.val() === 'remove') {

                elemAction.val('clone');
                elemAction.removeClass('action-reuse');
                elemAction.removeClass('action-remove');
                elemAction.addClass('action-clone');

            }

        }

    }

    if(newAction === 'clone') {
        setTemplateActionOfNode(newAction, elemChanged);
    } else {
        for(let elemList of listFamily) {
            setTemplateActionOfNode(newAction, elemList);
        }
    }

}
function setTemplateActionOfNode(newAction, elemEditor) {

    let elemAction = elemEditor.find('.editor-template-action');
    let elemItem   = getMatchById(elemEditor);

    elemAction.removeClass('action-clone');
    elemAction.removeClass('action-reuse');
    elemAction.removeClass('action-remove');

    elemAction.addClass('action-' + newAction);
    elemAction.val(newAction);

    let treeAction = elemItem.find('.template-action').first();

    treeAction.removeClass('action-clone');
    treeAction.removeClass('action-reuse');
    treeAction.removeClass('action-remove');

    treeAction.addClass('action-' + newAction);  

}


// Delete functionality
function deleteContentEditorElement(elemClicked) {

    const elemEditor  = elemClicked.closest('.editor-item');
    const elemActions = elemEditor.find('.editor-item-actions');
    const elemItem    = getMatchByIndex(elemEditor);
    const children    = getChildren(elemEditor);

    elemEditor.addClass('deleted');
    elemItem.addClass('deleted');

    deletePin(elemEditor);

    let elemRecover = $('<div></div>').insertAfter(elemActions).addClass('editor-item-recover');        

    $('<div></div>').appendTo(elemRecover)
        .addClass('button')
        .addClass('icon')
        // .addClass('red')
        .addClass('icon-delete-forever')
        .click(function() {
            clearContentEditorElement($(this));
        });
        
    $('<div></div>').appendTo(elemRecover)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-undo')
        .attr('title', 'Undo Delete')
        .click(function() {
            undeleteContentEditorElement($(this));
        });

    for(let child of children) {
        child.addClass('hidden').addClass('deleted');
        getMatchById(child).addClass('hidden').addClass('deleted');
    }

    setNumbersAndLevels();

}
function undeleteContentEditorElement(elemClicked) {

    const elemRecover = elemClicked.closest('.editor-item-recover');
    const elemEditor  = elemClicked.closest('.editor-item');
    const elemItem    = getMatchByIndex(elemEditor);
    const children    = getChildren(elemEditor);

    elemRecover.remove();
    elemEditor.removeClass('deleted');
    elemItem.addClass('deleted');

    for(let child of children) {
        child.removeClass('hidden');
        child.removeClass('deleted');
        getMatchById(child).removeClass('hidden').removeClass('deleted');
    }    

    setNumbersAndLevels();

}
function clearContentEditorElement(elemClicked) {

    let elemEditor  = elemClicked.closest('.editor-item');
    let elemItem    = getMatchByIndex(elemEditor);

    elemEditor.addClass('hidden');
    elemItem.addClass('hidden');

    setNumbersAndLevels();

}
function moveContentEditorElement(elemClicked) {

    let elemTarget = null;
    
    const elemEditor = elemClicked.closest('.editor-item');
    const level      = Number(elemEditor.attr('data-level'));
    const direction  = elemClicked.attr('data-direction');
    const listFamily = getFamily(elemEditor);

    if(direction === 'up') {

        // MOVE UP

        if(elemEditor.prev().length > 0) {

            elemEditor.prevAll().each(function() {
                if(elemTarget === null) {
                    const elemRef  = $(this);
                    const levelRef = Number(elemRef.attr('data-level'));

                    if(levelRef === level) {
                        elemTarget = $(this);
                        return false;
                    } else if(levelRef < level) {
                        return false;
                    }
                }
            });

            if(elemTarget === null) {
                if(level === 1) {
                    elemTarget = $('.editor-item').first();
                }
            }

            if(elemTarget !== null) {

                const idTarget       = elemTarget.attr('data-id');
                const elemItemTarget = $('#tree .id-' + idTarget);

                for(const elemEditorMove of listFamily) {

                    const idMove         = elemEditorMove.attr('data-id');
                    const elemItemMove   = $('#tree .id-' + idMove);

                    elemEditorMove.insertBefore(elemTarget);
                    elemItemMove.insertBefore(elemItemTarget);

                }

            }

            scrollToElement(elemEditor);

        }

    } else if(direction === 'do') {

        // MOVE DOWN

        if(elemEditor.next().length > 0) {

            let skippedNextSibling = false;

            elemEditor.nextAll().each(function() {
                if(elemTarget === null) {

                    const elemRef  = $(this);
                    const levelRef = Number(elemRef.attr('data-level'));
                    
                    if(levelRef === level) {
                        if(skippedNextSibling) {
                            elemTarget = $(this);
                            return false;
                        } else {
                            skippedNextSibling = true;
                        }
                    } else if(levelRef < level) {
                        elemTarget = $(this);   
                        return false;
                    }

                }
            });

            if(elemTarget === null) {
                if(level === 1) {

                    for(const elemEditorMove of listFamily) {

                        const idMove         = elemEditorMove.attr('data-id');
                        const elemItemMove   = $('#tree .id-' + idMove);

                        elemEditorMove.appendTo($('#editor-content'));
                        elemItemMove.appendTo($('#tree-tbody'));

                    }

                }
            } else {

                const idTarget       = elemTarget.attr('data-id');
                const elemItemTarget = $('#tree .id-' + idTarget);

                for(const elemEditorMove of listFamily) {

                    const idMove         = elemEditorMove.attr('data-id');
                    const elemItemMove   = $('#tree .id-' + idMove);

                    elemEditorMove.insertBefore(elemTarget);
                    elemItemMove.insertBefore(elemItemTarget);

                }               

            }

            scrollToElement(elemEditor);

        }

    } else if(direction === 'ri') {

        // MOVE RIGHT

        elemEditor.prevAll().each(function() {
            if(elemTarget === null) {

                const elemRev  = $(this);
                const levelRef = Number(elemRev.attr('data-level'));
                
                if(levelRef === level) {
                    elemTarget = $(this);
                    return false;
                } else if(levelRef < level) {
                    return false;
                }

            }
        });

        if(elemTarget !== null) {

            let index = 0;

            for(const elemEditorMove of listFamily) {

                const id             = elemEditorMove.attr('data-id');
                const levelNew       = Number(elemEditorMove.attr('data-level')) + 1;
                const elemItemMove   = $('#tree .id-' + id);
                

                elemEditorMove.attr('data-level', levelNew);
                  elemItemMove.attr('data-level', levelNew);

                setLevelClass(elemEditorMove, levelNew);
                setLevelClass(elemItemMove  , levelNew);

                if(index === 0) {
                    const elemItemNewParent = treeGetItemParent(elemItemMove);
                    treeToggleItemNodeClass(elemItemNewParent);
                }

                index++;
            
            }

        }

    } else if(direction === 'le') {

        // MOVE LEFT

        elemEditor.prevAll().each(function() {
            if(elemTarget === null) {

                const elemRev  = $(this);
                const levelRef = Number(elemRev.attr('data-level'));
                
                if(levelRef === (level - 1)) {
                    elemTarget = $(this);
                    return false;
                }

            }
        });        

        if(elemTarget !== null) {

            let index = 0;

            for(const elemEditorMove of listFamily) {
                
                const id             = elemEditorMove.attr('data-id');
                const levelNew       = Number(elemEditorMove.attr('data-level')) - 1;
                const elemItemMove   = $('#tree .id-' + id);
                const elemItemParent = treeGetItemParent(elemItemMove);

                elemEditorMove.attr('data-level', levelNew);
                  elemItemMove.attr('data-level', levelNew);

                setLevelClass(elemEditorMove, levelNew);
                setLevelClass(elemItemMove  , levelNew);

                if(index === 0) {
                    treeToggleItemNodeClass(elemItemMove);
                    treeToggleItemNodeClass(elemItemParent);
                }                

                index++;

            }

        } 

    }

    setNumbersAndLevels();

}
function setLevelClass(elem, level) {

    for(let level = 1; level < 100; level++)  elem.removeClass('level-' + level);
    
    elem.addClass('level-' + level);

}
function scrollToElement(elem, behavior) {

    behavior = behavior || 'smooth';

    elem.get(0).scrollIntoView({ behavior : behavior, block: 'start', inline: 'nearest' });

}
function maxEditorItem(elemClicked) {

    let elemEditor = elemClicked.closest('.editor-item');
    let isMax      = elemEditor.hasClass('max');

    if(isMax) {
        
        elemEditor.removeClass('max');
        elemEditor.siblings().removeClass('min');

        $('#editor').removeClass('min-max');

        scrollToElement(elemEditor, 'instant');

    } else {
        
        elemEditor.addClass('max');
        elemEditor.siblings().addClass('min');

        $('#editor').addClass('min-max');

    }



}


// Utilities
function getMatchById(elemRef) {

    const id        = elemRef.attr('data-id');
    const className = '.id-' + id;
    const isItem    = elemRef.hasClass('tree-item');
    const idRoot    = (isItem) ? 'editor' : 'tree';

    return $('#' + idRoot + ' ' + className);

}
function getMatchByIndex(elemRef) {

    let index     = elemRef.index();
    let className = (elemRef.hasClass('editor-item')) ? 'content-item' : 'editor-item';

    return $('.' + className).eq(index);

}
function getParent(elemEditor) {

    let level       = Number(elemEditor.attr('data-level'));
    let levelParent = level - 1;

    if(levelParent >= 1) {

        let className  = 'level-' + levelParent;
        let elemParent = elemEditor.prevAll('.' + className).first();

        if(elemParent.length > 0) return elemParent;

    }

    return null;

}
function getParents(elemEditor) {

    let level       = Number(elemEditor.attr('data-level'));
    let levelParent = level - 1;
    let parents     = [];

    elemEditor.prevAll('.editor-item').each(function() {

        let elemPrev = $(this);
        let levelPrev = Number(elemPrev.attr('data-level'));

        if(levelParent === levelPrev) {
            parents.push(elemPrev);
            levelParent--;
        }

    });

    return parents;

}
function getFamily(elemEditor) {

    let level     = Number(elemEditor.attr('data-level'));
    let className = 'level-' + level;
    let result    = [ elemEditor ];

    elemEditor.nextAll().each(function() {

        const elemRef  = $(this);
        const levelRef = Number(elemRef.attr('data-level'));

        if(levelRef > level) result.push(elemRef);
        else return false;
 
    });

    return result;

}
function getChildren(elemEditor) {

    let level     = Number(elemEditor.attr('data-level'));
    let className = 'level-' + level;
    let result    = [];

    elemEditor.nextAll().each(function() {

        const elemRef  = $(this);
        const levelRef = Number(elemRef.attr('data-level'));

        if(levelRef > level) result.push(elemRef);
        else return false;
 
    });

    return result;

}
function getSibling(elemEditor, direction) {

    let level     = Number(elemEditor.attr('data-level'));
    let className = 'level-' + level;

    if(direction === 'next') {

        let elemRef = elemEditor.nextAll('.' + className).first();
        if(elemRef.length > 0) return elemRef;

    } else if(direction === 'prev') {

        let elemRef = elemEditor.prevAll('.' + className).first();
        if(elemRef.length > 0) return elemRef;

    }

    return null;

}
function setChanged(elemChanged) {

    const id = elemChanged.attr('data-id');

    $('.id-' + id).addClass('changed');

    treeSetItemChanged($('#tree .id-' + id));

}
function crossHighlight(elemHovered, context1, context2) {

    if(elemHovered === null) return;
    if(elemHovered.length === 0) { $('*').removeClass('hover'); return; }

    const id = elemHovered.attr('data-id');

    $('#' + context1).find('.hover').removeClass('hover');
    $('#' + context2).find('.hover').removeClass('hover');

    $('#' + context1 + ' .id-' + id).addClass('hover');
    $('#' + context2 + ' .id-' + id).addClass('hover');

}


// Pin Functionality
function togglePin(elemClicked) {

    let elemEditor = elemClicked.closest('.editor-item');
    let id         = elemEditor.attr('data-id');
    
    elemEditor.toggleClass('pinned');

    if(elemEditor.hasClass('pinned')) {

        $('body').removeClass('no-pins');

        elemEditor.addClass('pinned');

        let elemPin = elemEditor.clone().appendTo($('#pins-content'));
            elemPin.find('.editor-item-insert-next').remove();
            elemPin.addClass('pin');

        elemPin.find('input'     ).on('keyup', function() { pinUpdateEditor($(this)); updateTreeItemTitle($(this)); });
        elemPin.find('.rte-input').on('keyup', function() { pinUpdateEditor($(this)); });

        enableEditorItemToggle(elemPin);
            
        let elemActions = elemPin.find('.editor-item-actions');
            elemActions.children().remove();
            
        // let elemHeader = elemPin.find('.editor-item-header');

        let elemSelect = $('<div></div>').appendTo(elemActions)
            .addClass('button')
            .addClass('icon')
            .addClass('icon-select')
            .attr('title', 'Scrolls to the matching item in the Content Editor')
            .click(function() {
                selectPin($(this));
            });
            
        let elemUnpin = $('<div></div>').appendTo(elemActions)
            .addClass('filled')
            .addClass('active')
            .addClass('button')
            .addClass('icon')
            .addClass('icon-pin')
            .attr('title', 'Click to remove this item from the list of pinned items')
            .click(function() {
                removePin($(this));
            });

    } else {

        $('.pin').each(function() {

            let elemPin = $(this);
            let nextId = elemPin.attr('data-id');

            if(id == nextId) $(this).remove();

        });

        if($('.pin').length === 0) $('body').addClass('no-pins');

    }

}
function selectPin(elemClicked) {

    const elemEditor = elemClicked.closest('.editor-item');
    const id         = elemEditor.attr('data-id');
    const className  = 'id-' + id;

    console.log(className);

    $('#editor-content').children().removeClass('hover');

    $('#editor-content').find('.' + className).each(function() {

        // let nextId = $(this).attr('data-id');
        // if(id == nextId) {
            scrollToElement($(this));
            // $(this).addClass('hover');
        // }

    });



}
function removePin(elemClicked) {

    let elemEditor = elemClicked.closest('.editor-item');
    let id         = elemEditor.attr('data-id');

    elemEditor.remove();

    $('#editor-content').children('.editor-item').each(function() {

        let nextId = $(this).attr('data-id');
        if(id == nextId) $(this).removeClass('pinned');

    });

    if($('.pin').length === 0) $('body').addClass('no-pins');
    
}
function updatePin(elemControl) {

    let elemEditor = elemControl.closest('.editor-item');
    let id         = elemEditor.attr('data-id');
    let elemPin    = $('#pins .id-' + id);

    if(elemPin.length === 0) return;

    elemPin.find('.editor-item-title').val(elemEditor.find('.editor-item-title').val());
    elemPin.find('.rte-input').html(elemEditor.find('.rte-input').html());
    

        // let nextId = $(this).attr('data-id');
        // if(id == nextId) {
    // /        scrollToElement($(this));
    //  /   }

    // });    

}
function pinUpdateEditor(elemControl) {

    let elemPin = elemControl.closest('.editor-item');
    let id         = elemPin.attr('data-id');
    let elemEditor    = $('#editor .id-' + id);

    if(elemEditor.length === 0) return;

    elemEditor.find('.editor-item-title').val(elemPin.find('.editor-item-title').val());
    elemEditor.find('.rte-input').html(elemPin.find('.rte-input').html());
    
    setChanged(elemEditor);
    
}
function deletePin(elemEditor) {

    const id = elemEditor.attr('data-id');
    let elemPin = $('#pins .id-' + id);

    if(elemPin.length > 0) elemPin.remove();
    
}


// Side Panel Functionality
function toggleSidePanel() {

    let sidePanel = $('#editor-side-panel').val();
    if(sidePanel === 'hide') {
        $('body').addClass('no-side'); 
    } else {
        $('body').removeClass('no-side'); 
        setSidePanel(links.side);
    }

}
function setSidePanel(link) {

    let sidePanel = $('#editor-side-panel').val();
    let sideMode  = $('#side').attr('data-mode');
    
    if(link === '') return;

    if(link === links.side) {
        if(sidePanel === sideMode) {
            return;
        }
    }

    links.side = link;

    $('#side').attr('data-mode', sidePanel);

    switch(sidePanel) {

        case 'details': 
            insertDetails(links.side, config.panels.insertDetails);
            break;

        case 'files': 
            insertAttachments(links.side, config.panels.insertAttachments);
            break;

        case 'items': 
            insertRelationships(links.side, config.panels.insertRelationships);
            break;

        case 'log': 
            insertChangeLog(links.side, config.panels.insertChangeLog);
            break;

    }

}


// Tree Functionality
function updateTreeItemTitle(elemInput) {

    const elemEditor = elemInput.closest('.editor-item');
    const id         = elemEditor.attr('data-id');
    const elemItem   = $('#tree .id-' + id);

    elemItem.find('.tree-column-title').html(elemInput.val());

}
function insertMatchingBOMTreeNode(elemEditor, elemPrevious) {

    let elemTBody = $('#tree-tbody');
    let elemItem = genTreeRow('tree',  {
        level : elemEditor.attr('data-level'),
        title : elemEditor.find('.editor-item-title').val()
    });

    elemItem.find('.tree-title').addClass('tree-column-title');
    elemItem.attr('data-id', elemEditor.attr('data-id'));
    elemItem.addClass('id-' + elemEditor.attr('data-id'));

    if((typeof elemPrevious === 'undefined') ||  (elemPrevious === null) || (elemPrevious.length === 0)) {
        elemItem.appendTo(elemTBody);
    } else {
        const idPrevious       = elemPrevious.attr('data-id');
        const elemTreePrevious = $('#tree-tbody').find('.id-' + idPrevious).first();
        elemItem.insertAfter(elemTreePrevious);
    }
    $('#tree-content').show();
    $('#tree-no-data').hide();

    // let index    = elemPrevious.index();
    // let elemItem = $('#tree-tbody').children().eq(index);
    // let elemNew  = elemItem.clone();

    // elemNew.attr('data-link', '');
    // elemNew.find('.tree-column-title').html('');
    // elemNew.insertAfter(elemItem)
    // elemItem.click(function(e) {
    //     clickContentItem(e, $(this));
    // });

}
function selectBOMItem(elemClicked) {

    let link  = elemClicked.attr('data-link');
    let index = elemClicked.index();

    elemClicked.removeClass('selected');

    setSidePanel(link);

    let isMax     = ($('.editor-item.max').length > 0);
    let elemEditor = $('.editor-item').eq(index);

    if(isMax) {
        $('.editor-item').removeClass('max').addClass('min');
        elemEditor.addClass('max').removeClass('min');
    } else scrollToElement(elemEditor);

}
function selectMatchingTreeItem(elemEditor) {

    // $('.tree-item').removeClass('selected');

    let id       = elemEditor.attr('data-id');
    let elemItem = $('#tree-tbody').find('.id-' + id).first();

    treeDisplayItem(elemItem);

    // elemItem.addClass('selected');

}


// Tree Drag & Drop Functionality
function onTreeDragStart(e) {

    $('.dragged').removeClass('dragged');
    $('.drag-hover').removeClass('drag-hover');
    // $('.tree-item').removeClass('selected');
    
    let elemDragged = $(e.target);
        elemDragged.addClass('dragged');
        elemDragged.attr('expand-on-drop', false);

    let elemItem = elemDragged;

    const isNode      = elemDragged.hasClass('node');
    const isCollapsed = elemDragged.hasClass('collapsed');

    if(isNode) {
        if(!isCollapsed) {
            elemDragged.find('.tree-nav').click();
            elemDragged.attr('expand-on-drop', true);
        }
    }

    e.dataTransfer.setData('text/plain', elemDragged.attr('data-id'));

}
function onTreeDragEnd(e) {

    $('.drag-hover').removeClass('.drag-hover');

    const elemDragged = $(e.target);
    const expand      = elemDragged.attr('expand-on-drop');

    if(expand) elemDragged.find('.tree-nav').click();

}
function onTreeDragEnter(e) {

    e.preventDefault();
    e.stopPropagation();

    let elemTarget = $(e.target);

    if(!elemTarget.hasClass('tree-item')) elemTarget = elemTarget.closest('.tree-item');

    elemTarget.addClass('drag-hover');

}
function onTreeDragOver(e) {

    e.preventDefault();
    e.stopPropagation();

    let elemTarget = $(e.target);

    if(!elemTarget.hasClass('tree-item')) elemTarget = elemTarget.closest('.tree-item');

    elemTarget.addClass('drag-hover');

}
function onTreeDragLeave(e) {

    $('.drag-hover').removeClass('drag-hover');

}
function onTreeDrop(e) {

    e.preventDefault();
    e.stopPropagation();

    const elemTarget       = $(e.target).closest('.tree-item');
    const isNode           = elemTarget.hasClass('node');
    const elemDragged      = $('.dragged').first();
    const elemItem         = elemDragged.closest('.tree-item');
    const levelBase        = elemItem.attr('data-level');
    const levelTarget      = (isNode) ? Number(elemTarget.attr('data-level')) + 1 : elemTarget.attr('data-level');
    const levelDiff        = levelTarget - levelBase;
    const listFamily       = getFamily(elemItem);
    const prevParent       = getParent(elemItem);

    let elemParent = $(e.target).closest('.tree-item');

    // for(let index = (listFamily.length - 1); index >= 0; index--) {
    for(let elemItem of listFamily) {

        const levelNew         = Number(elemItem.attr('data-level')) + levelDiff;
        const elemEditor       = getMatchById(elemItem);
        const elemEditorParent = getMatchById(elemParent);

        console.log(elemEditor.length);
        console.log(elemEditor.hasClass('tree-item'));
        console.log(elemEditor.hasClass('editor-item'));

          elemItem.attr('data-level', levelNew);
        elemEditor.attr('data-level', levelNew);

          elemItem.insertAfter(elemParent);
        elemEditor.insertAfter(elemEditorParent);

        if(prevParent !== null) treeToggleItemNodeClass(prevParent);

        setLevelClass(elemItem  , levelNew);
        setLevelClass(elemEditor, levelNew);

        elemParent = elemItem;

    }

    $('.dragged'   ).removeClass('dragged');
    $('.drag-hover').removeClass('drag-hover');

    setNumbersAndLevels();

}


// Update Numbers
function setNumbersAndLevels() {

    let numbers  = [];
    // let position = 0;

    $('#editor-content .editor-item').each(function() {
    // $('#editor-content .editor-item').not('.deleted').each(function() {

        const elemItem   = $(this);
        const id         = elemItem.attr('data-id');
        const elemNumber = elemItem.find('.editor-item-number');
        const itemLevel  = Number(elemItem.attr('data-level'));
        const nextLevel  = (numbers.length < itemLevel);
        const index      = elemItem.index();
        const elemPin    = $('#pins .id-' + id);

        if(elemItem.hasClass('deleted')) {

            elemNumber.html('');

        } else {

            if(nextLevel) {
                numbers.push(1);
                position = 1;
            // } else if(numbers.length === itemLevel) {
            //     numbers[itemLevel - 1]++;
            //     position = numbers[itemLevel - 1];
            } else {
                numbers[itemLevel - 1]++
                position = numbers[itemLevel - 1];
                numbers.splice(itemLevel);
                // console.log('going up');
            }

            const result = numbers.join(".");

            elemNumber.html(result);
            elemItem.attr('data-position', position);

            $('#tree-tbody').children().eq(index).find('.tree-number').html(result);
            if(elemPin.length > 0) elemPin.find('.editor-item-number').html(result);

        }

    });

}


// Add Existing
function setAddExistingPanel() {

    const value = $('#add-select').val();

    $('#add .panel-content').addClass('hidden');

    let params = {};

    switch(value) {
        case 'search'    : params = config.panels.insertWorkspaceSearch; break;
        case 'views'     : params = config.panels.insertWorkspaceViews;  break;
        case 'bookmarks' : params = config.panels.insertBookmarks;       break;
        case 'recents'   : params = config.panels.insertRecentItems;     break;
    }    

    params.hideHeader   = true;
    params.dragable     = (editMode !== 'template');;
    params.onDragStart  = params.onDragStart;
    params.onDragEnd    = params.onDragEnd    || 'onAddDragEnd(event)';
    params.tileTitle    = params.tileTitle    || 'DESCRIPTOR';
    params.tileSubtitle = params.tileSubtitle || 'DESCRIPTION';
    params.workspacesIn = params.workspacesIn || [ config.wsMain.workspaceName ];

    switch(value) {
        case 'search'    : setAddExistingSearchPanel   (params); break;
        case 'views'     : setAddExistingViewsPanel    (params); break;
        case 'bookmarks' : setAddExistingBookmarksPanel(params); break;
        case 'recents'   : setAddExistingRecentsPanel  (params); break;
    }

}
function setAddExistingSearchPanel(params) {

    params.id     = 'add-search';
    params.wsId   = params.workspaceId || config.wsMain.workspaceId;
    params.latest = true;

    insertWorkspaceSearch(params.wsId, params);

    $('#add-search').removeClass('hidden');

}
function setAddExistingViewsPanel(params) {

    params.id            = 'add-views';
    params.workspaceId   = config.wsMain.workspaceId;
    params.layout        = 'list';
    params.singleToolbar = 'actions';

    insertWorkspaceViews(config.wsMain.workspaceId, params);

    $('#add-views').removeClass('hidden');

}
function setAddExistingBookmarksPanel(params) {

    params.id = 'add-bookmarks';

    insertBookmarks(params);

    $('#add-bookmarks').removeClass('hidden');

}
function setAddExistingRecentsPanel(params) {

    params.id = 'add-recents';

    insertRecentItems(params);

    $('#add-recents').removeClass('hidden');

}


// Search Panel Functionality
function onAddDragStart(e) {
    console.log('drag start');
}
function onAddDragEnd(e) {
}
function onEditorDrop(e) {

    e.preventDefault();
    e.stopPropagation();

    const elemTarget      = $(e.target).closest('.editor-item-insert-next');
    const elemPrevious    = elemTarget.closest('.editor-item');
    const elemNext        = elemPrevious.next();
    const elemDragged     = $('.dragged').first();
    const elemContentItem = elemDragged.closest('.content-item');
    const link            = elemContentItem.attr('data-link');
    
    let levelPrev = Number(elemPrevious.attr('data-level'));
    let levelNext = levelPrev;

    if(elemNext.length > 0) levelNext = Number(elemNext.attr('data-level'));

    let level = (levelNext > levelPrev) ? (levelPrev + 1) : levelPrev;

    $('#overlay').show();
    
    $.get('/plm/details', { link : link }, function(response) {
        
        $('#overlay').hide();

        const revision = (response.data.versionId === 'w') ? 'WIP' : response.data.versionId;

        let data = {
            TITLE       : getSectionFieldValue(response.data.sections, 'TITLE', ''),
            DESCRIPTION : getSectionFieldValue(response.data.sections, 'DESCRIPTION', ''),
        }

        for(let advancedField of config.wsMain.advancedFields) {
            data[advancedField.fieldId] = getSectionFieldValue(response.data.sections, advancedField.fieldId, '');
        }

        data[config.wsMain.itemsLocked.fieldId] = getSectionFieldValue(response.data.sections, config.wsMain.itemsLocked.fieldId, '', 'title');
        data[config.wsMain.itemsReused.fieldId] = getSectionFieldValue(response.data.sections, config.wsMain.itemsReused.fieldId, '', 'title');

        let elemTop = insertContentEditorElement(elemPrevious, link, '', revision, '', '', level, data);

        if(data[config.wsMain.itemsReused.fieldId] != config.wsMain.itemsReused.value) {

            elemTop.addClass('pending-reuse');

        }

        // setChanged(getParent(elemTop));
        insertMatchingBOMTreeNode(elemTop, elemPrevious);
        setNumbersAndLevels();

    });

    $('.dragged'   ).removeClass('dragged'   ).addClass('pending-set-reuse');
    $('.drag-hover').removeClass('drag-hover');

}



// Save all changes when clicking the Save button
function saveChanges() {

    printTimer('saveChanges START');

    setNumbersAndLevels();
    resetSaveActions();
    hideMessage(); 

    $('*').removeClass('missing');

    console.log(editMode);

    $('#editor .editor-item').each(function() {

        const elemItem = $(this);
        
        if(editMode === 'template') {

            const action = elemItem.find('.template-action').val();

                   if(action === 'remove') {
                const id = elemItem.attr('data-id');
                $('.id-' + id).remove();
            } else if(action === 'clone' ) {
                elemItem.addClass(saveActions.create.className);
                elemItem.addClass(saveActions.link.className);
            } else if(action === 'reuse' ) {
                
                let elemParent = getParent($(this));
                let keepLocked = (elemItem.attr('data-lock-value') == config.wsMain.itemsLocked.value);
                let isReused   = elemItem.hasClass('reused');
                let add        = false;

                if(elemParent === null) {
                    add = true;
                } else {
                    let actionParent = elemParent.find('.template-action').val();
                    if(actionParent === 'clone') add = true;

                }
                if(add) {
                    elemItem.addClass(saveActions.link.className).addClass('pending-reuse');
                }

                if(!keepLocked) {
                    if(isReused) {
                        unlockEditorItem(elemItem);
                    } else {
                        elemItem.addClass(saveActions.edit.className).addClass('pending-reuse');
                    }
                }
            }

        } else {

            const link          = elemItem.attr('data-link');
            const linkPLMParent = elemItem.attr('data-parent');
            const number        = elemItem.attr('data-number');
            const position      = elemItem.attr('data-position');
            const elemTitle     = elemItem.find('.editor-item-title');
            const linkDOMParent = getParentLink(elemItem);
            
            if(elemItem.hasClass('deleted')) {

                if(link === '') {
                    const id = $(this).attr('data-id');
                    $('.id-' + id).remove();
                } else elemItem.addClass(saveActions.remove.className);

            } else {

                if(elemTitle.val() === '') { 
                    elemTitle.addClass('missing');
                }

                if(link === '') {

                    elemItem.addClass(saveActions.create.className);
                    elemItem.addClass(saveActions.link.className);

                } else {
                    if(elemItem.hasClass('pending-reuse')) {
                        elemItem.addClass(saveActions.edit.className);
                    } else if(elemItem.hasClass('changed')) {
                        elemItem.addClass(saveActions.edit.className);
                    }
                    if(elemItem.attr('data-edgeid') === '') {
                        elemItem.addClass(saveActions.link.className);
                    } else if(isBlank(linkPLMParent)) {
                        elemItem.addClass(saveActions.link.className);
                    } else if(linkPLMParent !== linkDOMParent) {
                        elemItem.addClass(saveActions.link.className);
                    } else if(number !== position) {
                        elemItem.addClass(saveActions.link.className);
                    }
                }

            }
        }

    });    

    if($('.missing').length > 0) {
        const elemMissing = $('.missing').first();
        scrollToElement(elemMissing);
        elemMissing.focus();
        // showErrorMessage('Missing Data', 'Cannot save changes as titles are missing');
        return;
    }    

    createRootItem(function() {
        showSaveDialog();
        createNewItems(saveActions.create);
    });

}
function createRootItem(callback) {

    $('#overlay').show();

    if(editMode === 'existing') {
        
        callback();

    } else {

        let elemSource = bomPartsList[0];

        let params = {
            wsId     : config.wsMain.workspaceId,
            sections : config.wsMain.sections,
            fields   : []
        }

        params.fields.push({ fieldId : 'TITLE'      , value : $('#start-name').val()         });
        params.fields.push({ fieldId : 'DESCRIPTION', value : elemSource.details.DESCRIPTION });

        for(let defaultValue of config.wsMain.newDefaultValues) {
            params.fields.push({ fieldId : defaultValue[0], value : defaultValue[1] });     
        }

        $.post('/plm/create', params, function(response) {

            printResponseErrorMessagesToConsole(response);

            links.root = response.data.split('.autodeskplm360.net')[1];

            storeRootLinkOnContextItem();
            callback();

        });

    }

}
function storeRootLinkOnContextItem() {

    if(!isBlank(links.context)) {
        $.post('/plm/edit', {
            link     : links.context,
            sections : config.wsContext.sections,
            fields   : [{
                fieldId : config.wsContext.fieldIds.link,
                value   : links.root
            }]
        });
    }

}
function createNewItems(action) {

    let pending  = updateSaveProgressBar(action);
    let requests = [];
    let elements = [];

    if(pending.length === 0) { editExistingItems(saveActions.edit); }
    else {
        
        pending.each(function() {

            if(requests.length < action.maxRequests) {

                let elemItem     = $(this);
                let elemAdvanced = elemItem.find('.editor-item-advanced');
                let params       = {
                    wsId     : config.wsMain.workspaceId,
                    sections : config.wsMain.sections,
                    fields   : []
                }

                params.fields.push({ fieldId : 'TITLE', value : elemItem.find('.editor-item-title').val() });
                params.fields.push({ fieldId : 'DESCRIPTION', value : elemItem.find('.rte-input').html() });

                elemAdvanced.find('.field-editable.changed').each(function() {
                    const fieldValue = getFieldValue($(this));
                    params.fields.push({ fieldId : fieldValue.fieldId, value : fieldValue.value });
                });

                requests.push($.post('/plm/create', params));
                elements.push(elemItem);                

            }

        });

        Promise.all(requests).then(function(responses) {

            for(let response of responses) {
                if(response.error) {
                    showErrorMessage('Error', response.data.message);
                    endSaveProcessing();
                }
            }

            for(let element of elements) {
                unlockEditorItem(element);
                element.find('.editor-item-reuse').remove();
            }            

            storeNewItemLinks(action, elements, responses);
            createNewItems(action); 

        });

    }

}
function editExistingItems(action) {      
    
    // console.log('editExistingItems START');
    
    let pending  = updateSaveProgressBar(action);
    let requests = [];

    if(pending.length === 0) { removeBOMItems(saveActions.remove); }
    else {

        pending.each(function() {

            if(requests.length < action.maxRequests) {

                let elemItem     = $(this);
                let keepLocked   = (elemItem.attr('data-lock-value') == config.wsMain.itemsLocked.value);
                let setReuse     = elemItem.hasClass('pending-reuse');
                let hasChanged   = elemItem.hasClass('changed');
                let elemAdvanced = elemItem.find('.editor-item-advanced');
                let params       = {
                    link     : elemItem.attr('data-link'),
                    sections : config.wsMain.sections,
                    fields   : []
                }

                if(!keepLocked) {
                    if(setReuse) {

                        params.fields.push({ fieldId : config.wsMain.itemsReused.fieldId, value : config.wsMain.itemsReused.value });
                        setEditorItemReused(elemItem);
                        unlockEditorItem(elemItem);

                    } 
                    if(hasChanged) {

                        params.fields.push({ fieldId : 'TITLE', value : elemItem.find('.editor-item-title').val() });
                        params.fields.push({ fieldId : 'DESCRIPTION', value : elemItem.find('.rte-input').html() });

                        elemAdvanced.find('.field-editable.changed').each(function() {
                            const fieldValue = getFieldValue($(this));
                            params.fields.push({ fieldId : fieldValue.fieldId, value : fieldValue.value });
                        });

                    }
                }

                if(params.fields.length > 0) {
                    requests.push($.post('/plm/edit', params));
                }
                elemItem.removeClass(action.className).removeClass('changed').removeClass('pending-reuse');

            }

        });

        Promise.all(requests).then(function(responses) { editExistingItems(action); });

    }
    
}
function removeBOMItems(action) {

    console.log('removeBOMItems START');

    let pending  = updateSaveProgressBar(action);
    let requests = [];

    if(pending.length === 0) { editBOMLinks(saveActions.link); }
    else {
        
        pending.each(function() {

            if(requests.length < action.maxRequests) {

                let elemItem   = $(this);
                let link       = elemItem.attr('data-link');
                let linkParent = elemItem.attr('data-parent');
 
                if(!isBlank(linkParent)) {
                    requests.push($.post('/plm/bom-remove', {
                        link   : linkParent,
                        edgeId : elemItem.attr('data-edgeid')
                    }));
                }

                // if(link !== '') {
                //     requests.push($.get('/plm/archive', { link : link }) );
                // }

                let elemMatch = getMatchByIndex(elemItem);
                    elemMatch.remove();

                elemItem.remove();

            }

        });

        Promise.all(requests).then(function() { removeBOMItems(action); });        

    }

}  
function editBOMLinks(action) {

    let pending  = updateSaveProgressBar(action);
    let requests = [];
    let elements = [];

    if(pending.length === 0) {        
        
        endSaveProcessing();
        treeResetItemsChanged('tree');
        updateAfterTemplateProcessing();
        $('*').removeClass('pending-reuse');
        $('.editor-item.changed').removeClass('changed');
        $('#tree .tree-item').each(function() { $(this).attr('draggable', true); });

    } else {
        
        pending.each(function() {

            if(requests.length < action.maxRequests) {

                const elemItem      = $(this);
                const link          = elemItem.attr('data-link');
                const edgeId        = elemItem.attr('data-edgeid');
                const linkPLMParent = elemItem.attr('data-parent');
                const number        = elemItem.attr('data-number');
                const position      = elemItem.attr('data-position');
                const linkDOMParent = getParentLink(elemItem);
                let params = {
                    linkParent : linkDOMParent,
                    linkChild  : link,
                    number     : position,
                    pinned     : false
                };

                if(linkPLMParent === linkDOMParent) {
                    if(position !== number) {
                
                        params.edgeId     = edgeId,

                        requests.push($.post('/plm/bom-update', params));

                        elemItem.removeClass(action.className);
                        elemItem.attr('data-number', position);

                    }
                } else {

                    requests.push($.post('/plm/bom-add', params));
                    elements.push(elemItem);

                    if(editMode !== 'template') {
                        if(!isBlank(linkPLMParent)) {
                            requests.push($.post('/plm/bom-remove', {
                                link   : linkPLMParent,
                                edgeId : edgeId
                            }));
                        }
                    }

                }
            }
        });

        Promise.all(requests).then(function(responses) {

            for(let response of responses) {
                if(response.error) {
                    showErrorMessage('Error', response.data.message);
                    endSaveProcessing();
                }
            }

            storeNewBOMEdgeId(action, elements, responses);
            editBOMLinks(action);

        });
    }

}
function getParentLink(elemItem) {

    if(elemItem.attr('data-level') === '1') return links.root;
    else {

        let level = Number(elemItem.attr('data-level'));
        let link  = '';

        elemItem.prevAll().each(function() {

            let elemRef  = $(this);
            let levelRef = Number(elemRef.attr('data-level'));

            if(levelRef < level) {
                link = elemRef.attr('data-link');
                return false;
            }

        });

        return link;

    }

}
function updateAfterTemplateProcessing() {

    $('.tree-template-action-icon').remove();
    $('.editor-template-action').remove();
    $('body').removeClass('template-mode');
    $('#button-toggle-add-existing').removeClass('disabled');

    if((editMode === 'template')) {
    
        $('.tree-item').each(function() {

            let elemItem = $(this);

            elemItem.attr( 'draggable'  , paramsBOM.dragable       );
            elemItem.attr( 'ondragstart', 'onTreeDragStart(event)' );
            elemItem.attr( 'ondragend'  , 'onTreeDragEnd(event)'   );
            elemItem.attr( 'ondragenter', 'onTreeDragEnter(event)' );
            elemItem.attr( 'ondragover' , 'onTreeDragOver(event)'  );
            elemItem.attr( 'ondragleave', 'onTreeDragLeave(event)' );
            elemItem.attr( 'ondrop'     , 'onTreeDrop(event)'      );

        });
    }

    editMode = 'existing';

}