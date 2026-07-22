function insertAPSBOM(link , params, data) {

    if(isBlank(link  )) return;
    if(isBlank(params)) params = {};
    if(isBlank(data  )) data   = {};

    let id = isBlank(params.id) ? 'aps-bom' : params.id;

    settings[id] = getPanelSettings('insertAPSBOM', params, {}, [
        [ 'link', link ]
    ]);

settings[id].workspaces = { items : [] };
settings[id].hideDescriptor = true;
        // settings[id].workspaces         = data.workspaces         || [];
    settings[id].load = function() { insertAPSBOMData(id); }

    console.log(settings[id]);

    genPanelTop                    (id, 'bom').addClass('tree');
    genPanelHeader                 (id);
    genPanelOpenSelectedInPLMButton(id);
    genPanelSelectionControls      (id);    

    genPanelToggleButtons(id, 
        function() {   expandAllNodes(id); }, 
        function() { collapseAllNodes(id); }
    );    

    genPanelResizeButton(id);
    genPanelSearchInput (id);
    genPanelResetButton (id);
    genPanelReloadButton(id);    
    genPanelContents    (id);

    insertAPSBOMDone(id);

    settings[id].load();

}
function insertAPSBOMDone(id) {}

function insertAPSBOMData(id) {

    settings[id].timestamp = startPanelContentUpdate(id);

    let params = {
        link      : settings[id].link,
        timestamp : settings[id].timestamp
    }

    $.get('/plm/details', params, function(response) {

        console.log(response);

        if(stopPanelContentUpdate(response, settings[id])) return;

        let modelId = response.data.modelId;

        console.log(modelId);

        params = {
            modelId   : response.data.modelId,
            timestamp : settings[id].timestamp
        }
        
        $.post('/aps/bom', params, function(response) {

if(stopPanelContentUpdate(response, settings[id])) return;


            console.log(response);

            settings[id].columns = [{
                included : true,
                displayName : 'Name',
                fieldId : 'name'
            }];

            let elemBOM = $('#' + id);
            let elemContent = $('#' + id + '-content');
            let elemTable = $('<table></table>').appendTo(elemContent)
                .attr('id', id + '-table')
                .addClass('bom-table')
                .addClass('tree-table')
                .addClass('fixed-header');    
                
            genBOMHeaders(id, elemTable);    
            genBOMRows(id, elemTable, response.data.bomPartsList);
            genTreePath(id);
            enableTreeToggles(id);                
        
            if(settings[id].collapseContents) collapseAllNodes(id);

                    if(!elemBOM.hasClass('no-bom-counters')) { $('#' + id + '-bom-counters').show(); }

                    insertAPSBOMDataDone(id);
                    finishPanelContentUpdate(id, null, null, { bomPartsList : response.data.bomPartsList });



        });    
    });    

}
function insertAPSBOMDataDone(id) {}