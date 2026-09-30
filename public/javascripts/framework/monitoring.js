let monitoringUnlocked      = false;
let monitoringIntervals     = { base : null, memory : null, cache : null, console : null };
let monitoringDirectories   = { settings : [], environments : [] };
let files                   = { environment : '', custom : '' }
let consoleLogSeq           = 0;
let memoryHistory           = [];
let cacheHistory            = [];
const CONSOLE_LOG_MAX_LINES = 2000;  // Set maximum of console panel entries
const CHART_HISTORY_MAX     = 60;   // 120 x 5s = 10 minutes
const GITHUB_BRANCH_LABEL   = 'main';

let chartMemoryMini     = null;
let chartCacheMini      = null;
let chartStorageMini    = null;
let chartMemoryDetail   = null;
let chartStorageDetail  = null;
let chartStorageHistory = null;


$(document).ready(function() {

    appendOverlay(true);
    setUIEvents();
    insertMenu();
    checkMonitoringLock();

});


function setUIEvents() {

    // Gate
    $('#unlock').click(unlockMonitoring);
    $('#secret').on('keyup', function(event) { if(event.key === 'Enter') unlockMonitoring(); });


    // Header Toolbar
    $('#reload').click(function() { refreshBasePanels(); refreshKeyPanels();});
    $('#lock-application').click(lockMonitoring);
    $('#toggle-console').click(function() {
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
        $('body').toggleClass('no-console');
    });


    // Dashboard Elements
    $('#card-variables').click(function() { showDetailsDialog(); showEnvironmentVariables(); });
    $('#card-sessions' ).click(function() { showDetailsDialog(); showActiveSessions();       });
    $('#card-memory'   ).click(function() { showDetailsDialog(); showMemoryConsumption();    });
    $('#card-storage'  ).click(function() { showStorageDialog();                             });

    $('#action-server-restart').click(function() { 
        showConfirmationDialog({
            idParent : 'dashboard',
            title    : 'Confirm Restart',
            message  : 'Do you really want to proceed? All user sessions will drop and users may have to login. This page will refresh automatically.',
            onConfirm : function() { $('#overlay').show(); restartServer() }
        })
    });

    $('#action-clear-caches').click(clearSessionCaches);


    // File Viewers
    $('#view-environment-js').click(function() { showDetailsDialog(); viewServerFile('environments'  ); });
    $('#file-custom'        ).click(function() { showDetailsDialog(); viewServerFile('settings'); });
    $('#view-settings-js'   ).click(function() { showDetailsDialog(); viewServerFile('settings.js'   ); });
    

    // Settings Editor
    $('#edit-settings-js').click(openSettingsEditor);
    $('#settings-dialog-content').on('change', '.mon-settings-toggle', function() {
        $(this).closest('.settings-editor-row').find('.settings-editor-input').prop('disabled', !$(this).is(':checked'));
    });
    $('#settings-dialog-content').on('input', '#settings-editor-filter', function() {
        let term = $(this).val().toLowerCase();
        $('#details-dialog-content .settings-editor-row').each(function() {
            $(this).toggle($(this).data('path').toLowerCase().indexOf(term) !== -1);
        });
    });    
    $('#settings-editor-save').click(triggerSettingsSave);
    $('.close-dialog').click(function () {$(this).closest('.dialog').hide(); $('#overlay').hide(); });
    

    // Storage Management
    $('#storage-cleanup-preset-6' ).click(function() { applyCleanupPreset(180); });
    $('#storage-cleanup-preset-12').click(function() { applyCleanupPreset(365); });
    $('#cleanup-folder').change(previewCleanup);
    $('#cleanup-days').keyup(previewCleanup);
    $('#cleanup-size').keyup(previewCleanup);
    $('#storage-cleanup-confirm').click(confirmCleanup);
    $('#storage-dialog-refresh').click(updateStorageDialog);

}
function showDetailsDialog() {

    $('#details-dialog').show();
    $('#overlay').show();

}
// function setMonitoringEvents() {

    //   $('#action-update-deploy').click(triggerDeployUpdate);
    // $('.details-toggle').click(function() { openDetail($(this).attr('data-target')); });
    // $('.file-toggle').click(function() { viewServerFile($(this).attr('data-scope'), $(this).closest('.mon-card')); });
    
// }


/* ------------------------------------------------------------------------------
    LOCK / UNLOCK MONITORING PAGE
   ------------------------------------------------------------------------------ */
function checkMonitoringLock() {

    $.get('/monitoring/api/memory', {}, function() {

        monitoringUnlocked = true;
        $('#gate').addClass('hidden').siblings().removeClass('hidden');
        showDashboard();

    }).fail(function() {

        monitoringUnlocked = false;
        $('#gate').removeClass('hidden').siblings().addClass('hidden');
        
        $('#secret').val('').focus();

    });

}
function unlockMonitoring() {

    let secret = $('#secret').val();

    $('#gate-error').text('');

    $.ajax({
        url         : '/monitoring/api/auth',
        method      : 'POST',
        contentType : 'application/json',
        data        : JSON.stringify({ secret : secret })
    }).done(function() {

        monitoringUnlocked = true;
        $('#gate').addClass('hidden').siblings().removeClass('hidden');
        showDashboard();

    }).fail(function(response) {

        let message = (response.responseJSON && response.responseJSON.error) ? response.responseJSON.error : 'Could not unlock the monitoring page.';
        $('#gate-error').text(message);

    });

}
function lockMonitoring() {

    $.post('/monitoring/api/logout', {}, function() {

        monitoringUnlocked = false;

        if(monitoringIntervals.base   ) clearInterval(monitoringIntervals.base    );
        if(monitoringIntervals.memory ) clearInterval(monitoringIntervals.memory );
        if(monitoringIntervals.cache  ) clearInterval(monitoringIntervals.cache  );
        if(monitoringIntervals.console) clearInterval(monitoringIntervals.console);

        $('#gate').removeClass('hidden').siblings().addClass('hidden');
        $('#secret').val('').focus();

    });

}


/* ------------------------------------------------------------------------------
    SHOW DASHBOARD
   ------------------------------------------------------------------------------ */
function showDashboard() {

    initMonitoringCharts();

    refreshBasePanels();
    loadMemory();
    loadCacheSize();
    loadConsoleLog();

    loadStartupInfo();    
    loadEnvironmentVariables();
    loadFileNames();

    refreshKeyPanels();
    
}
function refreshKeyPanels() {

    if(monitoringIntervals.base) clearInterval(monitoringIntervals.base);
    monitoringIntervals.base = setInterval(refreshBasePanels, 30000);

    if(monitoringIntervals.memory) clearInterval(monitoringIntervals.memory);
    monitoringIntervals.memory = setInterval(loadMemory, 5000);

    if(monitoringIntervals.cache) clearInterval(monitoringIntervals.cache);
    monitoringIntervals.cache = setInterval(loadCacheSize, 5000);

    if(monitoringIntervals.console) clearInterval(monitoringIntervals.console);
    monitoringIntervals.console = setInterval(loadConsoleLog, 2000);

}
function initMonitoringCharts() {

    if(chartMemoryMini || (typeof Chart === 'undefined')) return;

    Chart.defaults.borderColor      = chartThemes[theme].axisColor;
    Chart.defaults.color            = chartThemes[theme].fontColor;
    Chart.defaults.scale.grid.color = chartThemes[theme].gridColor;

    chartMemoryMini = new Chart($('#chart-memory-mini'), {
        type : 'line',
        data : {
            labels   : [],
            datasets : [{
                label           : 'Heap Used',
                data            : [],
                borderColor     : colors.red,
                backgroundColor : colors.red,
                borderWidth     : 4,
                pointRadius     : 0,
                tension         : 0.2
            }]
        },
        options : {
            animation           : { duration : 0 },
            maintainAspectRatio : false,
            responsive          : true,
            scales : {
                x : { display : false },
                y : { display : false, beginAtZero : true }
            },
            plugins : {
                legend  : { display : false },
                tooltip : { enabled : false }
            }
        }
    });

    chartCacheMini = new Chart($('#chart-cache-mini'), {
        type : 'line',
        data : {
            labels   : [],
            datasets : [{
                label           : 'Cache Size',
                data            : [],
                borderColor     : colors.blue,
                backgroundColor : colors.blue,
                borderWidth     : 4,
                pointRadius     : 0,
                tension         : 0.2
            }]
        },
        options : {
            animation           : { duration : 0 },
            maintainAspectRatio : false,
            responsive          : true,
            scales : {
                x : { display : false },
                y : { display : false, beginAtZero : true }
            },
            plugins : {
                legend  : { display : false },
                tooltip : { enabled : false }
            }
        }
    });

    chartStorageMini = new Chart($('#chart-storage-mini'), {
        type : 'bar',
        data : {
            labels   : [],
            datasets : [{
                data            : [],
                backgroundColor : '#faa21b',
                borderWidth     : 0
            }]
        },
        options : {
            animation           : { duration : 0 },
            maintainAspectRatio : false,
            responsive          : true,
            indexAxis           : 'y',
            plugins : {
                legend : { display : false }
            },
            scales : {
                x : { display : false },
                y : { display : true, grid : { display : false } }
            }
        }
    });

}
function loadStartupInfo() {

    $.get('/monitoring/api/startup-info', {}, function(response) {

        const startupInfo = response.data.split(';');

        for(let line of startupInfo) {
            $('<pre></pre>').appendTo($('#card-startup-content')).html(escapeHtml(line)).addClass('code');
        }

    });

}
function loadEnvironmentVariables() {

    $.get('/monitoring/api/env', {}, function(response) {
        $('#env-variables-count').text(Object.keys(response.env).length);
    });

}
function loadFileNames() {

    $.get('/monitoring/api/startup-settings', {}, function(response) {
        let environment   = response.environment.split('/').pop();
        files.environment = response.environment;
        files.custom      = response.settings;
        $('#file-environment').html(environment);
        $('#file-custom').html(response.settings);
        $('#edit-settings-js').html('Edit ' + response.settings).removeClass('hidden');
    });

}
// function loadDirectories() {

    // $.get('/monitoring/api/directories', {}, function(response) {

    //     monitoringDirectories = response;

    //     setFileSelector('#environments-file', response.environments, 'Select Environment File');
    //     setFileSelector('#settings-file'    , response.settings    , 'Select Settings File');

    // });

// }
// function setFileSelector(selector, files, text) {

//     let select = $(selector);

//     select.empty();

//     $('<option></option>').appendTo(select)
//         .attr('selected', 'selected')
//         .attr('disabled', 'disabled')
//         .attr('hidden', 'hidden')
//         .val('')
//         .text(text)


//     files.forEach(function(file) {
//         if(file.name !== '.DS_Store') {
//             $('<option></option>').val(file.name).text(file.name).appendTo(select);
//         }
//     });

// }


/* ------------------------------------------------------------------------------
    CONSOLE 
   ------------------------------------------------------------------------------ */
function loadConsoleLog() {

    if(!monitoringUnlocked) return;

    $.get('/monitoring/api/console', { since : consoleLogSeq }, function(response) {

        consoleLogSeq = response.lastSeq;

        if(response.entries.length === 0) return;

        appendConsoleLogEntries(response.entries);

    });

}
function appendConsoleLogEntries(entries) {

    let elemContent = $('#console-content');

    entries.forEach(function(entry) {

        let time = new Date(entry.time).toLocaleTimeString();
        // let line = $('<div></div>')
        //     .addClass('mon-console-line-' + entry.level)
        //     .text('[' + time + '] ' + entry.text);
        addLogEntry('[' + time + '] ' + entry.text, '');

    });

    while(elemContent.children().length > CONSOLE_LOG_MAX_LINES) elemContent.children().first().remove();

}



/* ------------------------------------------------------------------------------
    REFRESH 
   ------------------------------------------------------------------------------ */
function refreshBasePanels() {

    if(!monitoringUnlocked) return;

    loadSessions();
    loadStorage();
    loadDeployStatus();

}
function loadSessions() {

    $.get('/monitoring/api/sessions', {}, function(response) {
        $('#sessions-count').text(response.count);

    });

}
function loadCacheSize() {

    if(!monitoringUnlocked) return;

    $.get('/monitoring/api/cache/size', {}, function(response) {

        $('#cache-size').text(formatBytes(response.totalSize));

        cacheHistory.push({
            time : new Date(),
            size  : response.totalSize
        });

        if(cacheHistory.length > CHART_HISTORY_MAX) cacheHistory.shift();   

        updateCacheMiniChart();     

    });

}
function updateCacheMiniChart() {

    if(!chartCacheMini) return;

    chartCacheMini.data.labels           = cacheHistory.map(function(p) { return p.time; });
    chartCacheMini.data.datasets[0].data = cacheHistory.map(function(p) { return p.size; });
    chartCacheMini.update();

}
function loadMemory() {

    if(!monitoringUnlocked) return;

    $.get('/monitoring/api/memory', {}, function(response) {

        // $('#memory-heap').text(formatBytes(response.process.heapUsed) + ' / ' + formatBytes(response.process.heapTotal));
        $('#server-uptime').text(formatDuration(response.process.uptimeSeconds));
        $('#memory-heap').text(formatBytes(response.process.heapTotal));

        memoryHistory.push({
            time      : new Date(),
            rss       : response.process.rss,
            heapUsed  : response.process.heapUsed,
            heapTotal : response.process.heapTotal
        });

        if(memoryHistory.length > CHART_HISTORY_MAX) memoryHistory.shift();

        updateMemoryMiniChart();

    });

}
function updateMemoryMiniChart() {

    if(!chartMemoryMini) return;

    chartMemoryMini.data.labels             = memoryHistory.map(function(p) { return p.time; });
    chartMemoryMini.data.datasets[0].data   = memoryHistory.map(function(p) { return p.heapUsed; });
    chartMemoryMini.update();

}



/* ------------------------------------------------------------------------------
    COUNTER DETAILS
   ------------------------------------------------------------------------------ */
function showEnvironmentVariables() {
    
    $('#details-dialog-title').text('Environment Variables');
    $('#details-dialog-content').html('Loading…');

    $.get('/monitoring/api/env', {}, function(response) {

        let rows = Object.keys(response.env).map(function(key) {
            return '<tr><td>' + escapeHtml(key) + '</td><td>' + escapeHtml(String(response.env[key])) + '</td></tr>';
        }).join('');

        $('#details-dialog-content').html(
            '<table class="mon-table"><thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>' + rows + '</tbody></table>'
        );

    });

}
function showActiveSessions() {

    $('#details-dialog-title').text('Active Sessions');
    $('#details-dialog-content').html('Loading…');

    $.get('/monitoring/api/sessions', {}, function(response) {

        let rows = response.sessions.map(function(s) {

            return '<tr class="' + (s.current ? 'current' : '') + '">' +
                '<td>' + s.userName + '</td>' +
                '<td>' + s.email + '</td>' +
                '<td>' + (s.plmLoggedIn ? 'Yes' : 'No') + '</td>' +
                '<td>' + (s.loginType || '—') + '</td>' +
                '<td>' + s.cacheEntries + '</td>' +
                '<td>' + formatBytes(s.cacheSize) + '</td>' +
                '<td>' + (s.expires ? new Date(s.expires).toLocaleString() : '—') + '</td>' +
            '</tr>';
        }).join('');

        $('#details-dialog-content').html(
            '<table class="mon-table"><thead><tr>' +
            '<th>User</th><th>E-Mail</th><th>PLM Login</th><th>Login Type</th><th>Cache Entries</th><th>Cache Size</th><th>Expires</th>' +
            '</tr></thead><tbody>' + rows + '</tbody></table>'
        );

    });

}
function showMemoryConsumption() {

    $('#details-dialog-title').text('Memory Consumption');
    $('#details-dialog-content').html('Loading…');

    $.get('/monitoring/api/memory', {}, function(response) {

        $('#details-dialog-content').html(
            '<div id="memory-grid"><div id="memory-chart"><div class="memory-chart-box"><canvas id="chart-memory-detail"></canvas></div>' +
            '<p class="mon-hint">Heap used and RSS, sampled every 5 seconds for as long as this page stays open (last ' + memoryHistory.length + ' sample(s)).</p></div>' +
            '<div id="memory-process"><h4>Process</h4>' +
            '<div>RSS: ' + formatBytes(response.process.rss) + '</div>' +
            '<div>Heap Used: ' + formatBytes(response.process.heapUsed) + '</div>' +
            '<div>Heap Total: ' + formatBytes(response.process.heapTotal) + '</div>' +
            '<div>External: ' + formatBytes(response.process.external) + '</div>' +
            '<div>Uptime: ' + formatDuration(response.process.uptimeSeconds) + '</div></div>' +
            '<div id="memory-system"><h4>System</h4>' +
            '<div>Free: ' + formatBytes(response.system.freeMem) + '</div>' +
            '<div>Total: ' + formatBytes(response.system.totalMem) + '</div>' +
            '<div>Load average: ' + response.system.loadAvg.map(function(n) { return n.toFixed(2); }).join(', ') + '</div>' +
            '<div>CPUs: ' + response.system.cpus + '</div>' +
            '<div>Host: ' + response.system.hostname + ' (' + response.system.platform + ')</div>' + 
            '<div>Uptime: ' + formatDuration(response.system.uptimeSeconds) + '</div></div></div>'
        );

        if(chartMemoryDetail) chartMemoryDetail.destroy();

        chartMemoryDetail = new Chart($('#chart-memory-detail'), {
            type : 'line',
            data : {
                labels   : memoryHistory.map(function(p) { return p.time.toLocaleTimeString(); }),
                datasets : [
                    {
                        label           : 'RSS',
                        data            : memoryHistory.map(function(p) { return p.rss; }),
                        borderColor     : colors.green,
                        backgroundColor : colors.green,
                        pointRadius     : 0,
                        tension         : 0.2
                    },
                    {
                        label           : 'Heap Used',
                        data            : memoryHistory.map(function(p) { return p.heapUsed; }),
                        borderColor     : colors.blue,
                        backgroundColor : colors.blue,
                        pointRadius     : 0,
                        tension         : 0.2
                    }
                ]
            },
            options : {
                maintainAspectRatio : false,
                responsive          : true,
                scales : {
                    y : {
                        beginAtZero : true,
                        ticks : { callback : function(value) { return formatBytes(value); } }
                    }
                },
                plugins : {
                    legend : { display : true, position : 'bottom' },
                    tooltip : {
                        callbacks : { label : function(ctx) { return ctx.dataset.label + ': ' + formatBytes(ctx.parsed.y); } }
                    }
                }
            }
        });

    });

}



/* ------------------------------------------------------------------------------
    RESTART SERVER
   ------------------------------------------------------------------------------ */
function restartServer() {

    $('#server-restart-status').text('Restarting...');

    $.post('/monitoring/api/restart', {}, function(response) {

        $('#server-restart-status').text('Restart initiated');

        setTimeout(function() { document.location.href = document.location.href; }, 4000);

    }).fail(function() {

        $('#server-restart-status').text('Failed');

    });

}



/* ------------------------------------------------------------------------------
    CLEAR CACHE
   ------------------------------------------------------------------------------ */
function clearSessionCaches() {

    $('#cache-status').text('Clearing…');

    $.post('/monitoring/api/cache/clear', {}, function(response) {

        $('#cache-status').text('Cleared ' + response.sessionsCleared + ' session(s)');

        setTimeout(function() { $('#cache-status').text(''); }, 4000);

    }).fail(function() {

        $('#cache-status').text('Failed');

    });

}



/* ------------------------------------------------------------------------------
    SERVER FILES VIEWER
   ------------------------------------------------------------------------------ */
function viewServerFile(scope) {

    let name = null;

    if(scope === 'settings'    ) name = files.custom;
    if(scope === 'environments')  name = files.environment;

    $('#details-dialog-title').text(scope + (name ? ' / ' + name : ''));
    $('#details-dialog-content').html('Loading…');

    $.get('/monitoring/api/file', { scope : scope, name : name }, function(response) {

        $('#details-dialog-content').html(
            '<div class="file-meta">' + response.path + ' — ' + formatBytes(response.size) + ' — ' + new Date(response.modified).toLocaleString() + '</div>' +
            '<pre class="code">' + escapeHtml(response.content) + '</pre>'
        );

    }).fail(function(response) {

        $('#details-dialog-content').text((response.responseJSON && response.responseJSON.error) || 'Could not load file.');

    });

}



/* ------------------------------------------------------------------------------
    SETTINGS OVERRIDES EDITOR
   ------------------------------------------------------------------------------ */
let settingsEditorState = { file : null };

function openSettingsEditor() {

    $('.dialog').hide();
    $('#overlay').show();
    $('#settings-dialog').show();

    settingsEditorState = { file : files.custom };

    $('#settings-dialog-title').text('Edit Overrides — settings/' + files.custom);
    $('#settings-dialog-content').html('Loading…');

    $.get('/monitoring/api/settings/tree', { file : files.custom }, function(response) {

        $('#settings-dialog-content').html(renderSettingsEditorHtml(response.sections));

    }).fail(function(response) {

        $('#settings-dialog-content').text((response.responseJSON && response.responseJSON.error) || 'Could not load settings.');

    });

}
function renderSettingsEditorHtml(sections) {

    let sectionsHtml = Object.keys(sections).map(function(sectionKey) {

        let section   = sections[sectionKey];
        let bodyHtml  = (sectionKey === 'applications') ? renderApplicationsSection(section.rows) : renderSettingsRowsTable(section.rows);
        let advanced  = section.advancedCount
            ? '<p class="settings-editor-hint">' + section.advancedCount + ' advanced setting(s) in this section are structural or contain code and are not editable here</p>'
            : '';

        return '<details class="mon-settings-section"><summary>' + sectionKey + ' (' + section.rows.length + ')</summary>' + bodyHtml + advanced + '</details>';

    }).join('');

    return (
        '<p class="settings-editor-instructions">Check the option "Override" for the settings to change and copy to <strong>settings/' + settingsEditorState.file + '</strong>. When you save the changes, the server will restart automatically. During server restart, all users will briefly see a maintenance page.</p>' +
        '<div id="mon-settings-filter" class="button with-icon icon-search"><input type="text" id="settings-editor-filter" class="input" placeholder="Type to filter the list of setting"></div>' +
        sectionsHtml
    );

}
function renderApplicationsSection(rows) {

    let byApp = {};

    rows.forEach(function(row) {

        let appId = row.path.split('.')[1] || '(other)';

        if(!byApp[appId]) byApp[appId] = [];

        byApp[appId].push(row);

    });

    return Object.keys(byApp).sort().map(function(appId) {

        return '<details class="mon-settings-app"><summary>' + appId + ' (' + byApp[appId].length + ')</summary>' + renderSettingsRowsTable(byApp[appId]) + '</details>';

    }).join('');

}
function renderSettingsRowsTable(rows) {

    if(rows.length === 0) return '<p class="mon-hint">No editable settings in this section.</p>';

    return (
        '<table class="mon-table settings-table"><thead><tr><th>Override</th><th>Setting</th><th>Default</th><th>Value</th></tr></thead><tbody>' +
        rows.map(renderSettingsRow).join('') +
        '</tbody></table>'
    );

}
function renderSettingsRow(row) {

    let value      = row.overridden ? row.override : row.default;
    let toggled    = row.overridden ? 'checked' : '';
    let disabled   = row.overridden ? '' : 'disabled';
    let inputHtml;

    if(row.type === 'boolean') {
        inputHtml = '<input type="checkbox" class="settings-editor-input" ' + (value ? 'checked' : '') + ' ' + disabled + '>';
    } else if(row.type === 'number') {
        inputHtml = '<input type="number" class="settings-editor-input" value="' + escapeHtml(String(value)) + '" ' + disabled + '>';
    } else if(row.type === 'stringArray') {
        inputHtml = '<input type="text" class="settings-editor-input" value="' + escapeHtml(value.join(', ')) + '" placeholder="comma-separated" ' + disabled + '>';
    } else {
        inputHtml = '<input type="text" class="settings-editor-input" value="' + escapeHtml(String(value)) + '" ' + disabled + '>';
    }

    return (
        '<tr class="settings-editor-row" data-path="' + row.path + '" data-type="' + row.type + '" data-overridden="' + row.overridden + '">' +
            '<td class="settings-editor-override"><input type="checkbox" class="mon-settings-toggle" ' + toggled + '></td>' +
            '<td>' + escapeHtml(row.path) + '</td>' +
            '<td class="settings-editor-default">' + escapeHtml(formatSettingValue(row.default)) + '</td>' +
            '<td class="settings-editor-value">' + inputHtml + '</td>' +
        '</tr>'
    );

}
function formatSettingValue(value) {

    if(Array.isArray(value)) return value.join(', ');
    if(typeof value === 'boolean') return value ? 'true' : 'false';

    return String(value);

}
function collectSettingsChanges() {

    let sets   = [];
    let unsets = [];

    $('#settings-dialog-content .settings-editor-row').each(function() {

        let row           = $(this);
        let rowPath       = row.data('path');
        let type          = row.data('type');
        let wasOverridden = row.data('overridden') === true;
        let checked       = row.find('.mon-settings-toggle').is(':checked');

        if(!checked) {
            if(wasOverridden) unsets.push(rowPath);
            return;
        }

        let field = row.find('.settings-editor-value');
        let value;

             if(type === 'boolean')     value = field.is(':checked');
        else if(type === 'number')      value = Number(field.val());
        else if(type === 'stringArray') value = field.val().split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
        else                            value = field.val();

        sets.push({ path : rowPath, value : value });

    });

    return { sets : sets, unsets : unsets };

}
function triggerSettingsSave() {

    let payload = collectSettingsChanges();

    if((payload.sets.length === 0) && (payload.unsets.length === 0)) {
        window.alert('No overrides are enabled - nothing to save.');
        return;
    }

    if(!window.confirm('Save these overrides into settings/' + settingsEditorState.file + ' and restart the server now? All users will briefly see a maintenance page.')) return;

    payload.file = settingsEditorState.file;

    $('#settings-editor-save').prop('disabled', true);
    $('#settings-editor-status').text('Saving…');

    $.ajax({
        url         : '/monitoring/api/settings/save',
        method      : 'POST',
        contentType : 'application/json',
        data        : JSON.stringify(payload)
    }).done(function() {

        $('#settings-editor-status').text('Restarting…');
        waitForServerRestart();

    }).fail(function(response) {

        window.alert((response.responseJSON && response.responseJSON.error) || 'Save failed.');

        $('#settings-editor-save').prop('disabled', false);
        $('#settings-editor-status').text('');

    });

}



/* ------------------------------------------------------------------------------
    STORAGE
   ------------------------------------------------------------------------------ */
function loadStorage() {

    $.get('/monitoring/api/storage', {}, function(response) {

        $('#storage-total').text(formatBytes(response.totalSize));

        if(chartStorageMini) {

            chartStorageMini.data.labels           = response.folders.map(function(f) { return f.folder; });
            chartStorageMini.data.datasets[0].data = response.folders.map(function(f) { return f.totalSize; });
            chartStorageMini.update();

        }

        setCleanupFolders(response.folders);

    });

}
function setCleanupFolders(folders) {

    let select   = $('#cleanup-folder');
    let previous = select.val();

    select.empty();
    $('<option></option>').val('all').text('All folders').appendTo(select);

    folders.forEach(function(f) {
        $('<option></option>').val(f.folder).text(f.folder).appendTo(select);
    });

    if(previous && (select.find('option[value="' + previous + '"]').length > 0)) select.val(previous);

}
function showStorageDialog() {

    $('.dialog').hide();
    $('#overlay').show();
    $('#storage-dialog').show();

    updateStorageDialog();

}
function updateStorageDialog() {

    $.when(
        $.get('/monitoring/api/storage', {}),
        $.get('/monitoring/api/storage/history', {})
    ).done(function(storageResult, historyResult) {

        let response = storageResult[0];
        let history  = historyResult[0];

        let rows = response.folders.map(function(f) {
            return '<tr>' +
                '<td>' + f.folder + '</td>' +
                '<td>' + f.fileCount + '</td>' +
                '<td>' + formatBytes(f.totalSize) + '</td>' +
                '<td>' + (f.oldest ? new Date(f.oldest).toLocaleDateString() : '—') + '</td>' +
                '<td>' + (f.newest ? new Date(f.newest).toLocaleDateString() : '—') + '</td>' +
            '</tr>';
        }).join('');

        $('#storage-dialog-folders-list'  ).html('<table class="mon-table"><thead><tr><th>Folder</th><th>Files</th><th>Size</th><th>Oldest</th><th>Newest</th></tr></thead><tbody>' + rows + '</tbody></table>');
        $('#storage-dialog-chart-sizes'   ).html('<div class="storage-chart-box"><canvas id="chart-storage-detail" ></canvas></div>');
        $('#storage-dialog-chart-timeline').html('<div class="storage-chart-box"><canvas id="chart-storage-history"></canvas></div>');

        if(chartStorageDetail) chartStorageDetail.destroy();

        chartStorageDetail = new Chart($('#chart-storage-detail'), {
            type : 'bar',
            data : {
                labels   : response.folders.map(function(f) { return f.folder; }),
                datasets : [{
                    data            : response.folders.map(function(f) { return f.totalSize; }),
                    backgroundColor : '#faa21b',
                }]
            },
            options : {
                maintainAspectRatio : false,
                responsive          : true,
                indexAxis           : 'y',
                plugins : {
                    legend  : { display : false },
                    tooltip : { callbacks : { label : function(ctx) { return formatBytes(ctx.parsed.y); } } }
                },
                scales : {
                    x : {  display : true, beginAtZero : true, ticks : { callback : function(value) { return formatBytes(value); } } }
                }
            }
        });

        if(chartStorageHistory) chartStorageHistory.destroy();

        chartStorageHistory = new Chart($('#chart-storage-history'), {
            type : 'line',
            data : {
                labels   : history.months,
                datasets : [{
                    label           : 'Cumulative Size',
                    data            : history.cumulativeSize,
                    borderColor     : colors.blue,
                    backgroundColor : colors.blue,
                    fill            : false,
                    tension         : 0.2
                }]
            },
            options : {
                maintainAspectRatio : false,
                responsive          : true,
                plugins : {
                    legend  : { display : false },
                    title   : { display : true, text : 'Storage Growth (last 12 months, by file date)' },
                    tooltip : { callbacks : { label : function(ctx) { return formatBytes(ctx.parsed.y); } } }
                },
                scales : {
                    y : { beginAtZero : true, ticks : { callback : function(value) { return formatBytes(value); } } }
                }
            }
        });

    });

}
function applyCleanupPreset(days) {

    $('#cleanup-folder').val('all');
    $('#cleanup-days').val(days);
    $('#cleanup-size').val('');

    previewCleanup();

}
function cleanupPayload() {

    return {
        folder         : $('#cleanup-folder').val(),
        olderThanDays  : $('#cleanup-days').val() || null,
        maxTotalSizeMB : $('#cleanup-size').val() || null
    };

}
function previewCleanup() {

    let payload = cleanupPayload();
    payload.dryRun = true;

    $('#storage-cleanup-result').text('Checking…');

    $.ajax({
        url         : '/monitoring/api/storage/cleanup',
        method      : 'POST',
        contentType : 'application/json',
        data        : JSON.stringify(payload)
    }).done(function(response) {

        $('#storage-cleanup-result').text(response.filesMatched + ' file(s), ' + formatBytes(response.bytesToFree) + ' would be freed.');

    }).fail(function(response) {

        $('#cleanup-result').text((response.responseJSON && response.responseJSON.error) || 'Preview failed.');

    });

}
function confirmCleanup() {

    let payload = cleanupPayload();

    if(!window.confirm('Permanently delete the previewed files from /storage/' + payload.folder + '? This cannot be undone.')) return;

    payload.dryRun = false;

    $.ajax({
        url         : '/monitoring/api/storage/cleanup',
        method      : 'POST',
        contentType : 'application/json',
        data        : JSON.stringify(payload)
    }).done(function(response) {

        loadStorage();
        updateStorageDialog();
        $('#storage-cleanup-result').text('Deleted ' + response.filesDeleted + ' file(s), freed ' + formatBytes(response.bytesFreed) + '.');        
        
    }).fail(function(response) {

        $('#cleanup-result').text((response.responseJSON && response.responseJSON.error) || 'Cleanup failed.');

    });

}



/* ------------------------------------------------------------------------------
    DETAIL PANEL - SESSIONS / MEMORY / STORAGE
   ------------------------------------------------------------------------------ */
// function openDetail(target) {

    // $('#mon-detail').addClass('open');

        //  if(target === 'sessions')     renderSessionsDetail();
    // else if(target === 'deploy'  )     renderDeployDetail();

// }



/* ------------------------------------------------------------------------------
    DEPLOYMENT
   ------------------------------------------------------------------------------ */
function loadDeployStatus() {

    $.get('/monitoring/api/deploy/status', {}, function(response) {

        let upToDate = response.upToDate;

        $('#deploy-status')
            .text(upToDate === null ? 'Unknown' : (upToDate ? 'Up to date' : 'Update available'))
            .css('color', upToDate === false ? 'var(--color-red-500)' : '');

        $('#deploy-local').text('Local: ' + response.local.commit.substring(0, 7) + ' — ' + response.local.subject);

        $('#deploy-remote').text(
            response.remote
                ? ('GitHub main: ' + response.remote.sha.substring(0, 7) + ' — ' + response.remote.subject)
                : ('GitHub: ' + (response.remoteError || 'unavailable'))
        );

        $('#deploy-last-deploy').text(
            response.lastDeploy
                ? ('Last deployment: ' + new Date(response.lastDeploy.deployedAt).toLocaleString() + ' (' + response.lastDeploy.commit.substring(0, 7) + ')')
                : 'Last deployment: not deployed via this panel yet'
        );

        $('#action-update-deploy').prop('disabled', (upToDate !== false) || (response.dirty.length > 0));

    });

}
function renderDeployDetail() {

    $('#details-dialog-title').text('Deployment');
    $('#details-dialog-content').html('Loading…');

    $.get('/monitoring/api/deploy/status', {}, function(response) {

        let dirtyHtml = (response.dirty.length === 0)
            ? '<div>Working tree is clean.</div>'
            : '<div>Uncommitted changes block updates:</div><ul>' + response.dirty.map(function(f) { return '<li>' + escapeHtml(f) + '</li>'; }).join('') + '</ul>';

        $('#details-dialog-content').html(
            '<h4>Local checkout</h4>' +
            '<div>' + response.local.commit + '</div>' +
            '<div>' + escapeHtml(response.local.subject) + '</div>' +
            '<div>' + new Date(response.local.date).toLocaleString() + '</div>' +
            '<h4>GitHub (' + GITHUB_BRANCH_LABEL + ')</h4>' +
            (response.remote
                ? ('<div>' + response.remote.sha + '</div><div>' + escapeHtml(response.remote.subject) + '</div><div>' + new Date(response.remote.date).toLocaleString() + '</div>')
                : ('<div>' + escapeHtml(response.remoteError || 'unavailable') + '</div>')) +
            '<h4>Last deployment via this panel</h4>' +
            (response.lastDeploy
                ? ('<div>' + response.lastDeploy.commit + '</div><div>' + new Date(response.lastDeploy.deployedAt).toLocaleString() + '</div>')
                : '<div>Not deployed via this panel yet.</div>') +
            '<h4>Working tree</h4>' + dirtyHtml
        );

    });

}
function triggerDeployUpdate() {

    if(!window.confirm('Pull the latest code from GitHub main and restart the server now? All users will briefly see a maintenance page.')) return;

    $('#action-update-deploy').prop('disabled', true).text('Updating…');

    $.ajax({
        url    : '/monitoring/api/deploy/update',
        method : 'POST'
    }).done(function(response) {

        $('#deploy-status').text('Restarting…');
        waitForServerRestart();

    }).fail(function(response) {

        let message = (response.responseJSON && response.responseJSON.error) || 'Update failed.';
        let files    = (response.responseJSON && response.responseJSON.files) || [];

        window.alert(message + (files.length ? ('\n\n- ' + files.join('\n- ')) : ''));

        $('#action-update-deploy').prop('disabled', false).text('Update & Restart');

    });

}
function waitForServerRestart() {

    // The new process starts with an empty in-memory session store, so this
    // deliberately checks for *any* HTTP response (even 401/403) rather than
    // a successful, authenticated one - that's the signal the server is back.
    // A full reload re-runs PLM login and the monitoring secret prompt.
    $.ajax({ url : '/', method : 'GET', cache : false }).always(function(jqXHR) {

        if((jqXHR.status === 0) || (jqXHR.status === 503)) {
            setTimeout(waitForServerRestart, 4000);
        } else {
            window.location.reload();
        }

    });

}




/* ------------------------------------------------------------------------------
    HELPERS
   ------------------------------------------------------------------------------ */
function formatBytes(bytes) {

    if(!bytes) return '0 B';

    let units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let index = Math.floor(Math.log(bytes) / Math.log(1024));

    return (bytes / Math.pow(1024, index)).toFixed(1) + ' ' + units[index];

}
function formatDuration(seconds) {

    let d = Math.floor(seconds / 86400);
    let h = Math.floor((seconds % 86400) / 3600);
    let m = Math.floor((seconds % 3600) / 60);

    return (d ? d + 'd ' : '') + (h ? h + 'h ' : '') + m + 'm';

}
function escapeHtml(value) {

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

}