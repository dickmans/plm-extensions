/* Contains code generataed by AI */

const express      = require('express');
const router        = express.Router();
const fs            = require('fs');
const path          = require('path');
const os            = require('os');
const axios         = require('axios');
const { execSync, spawn } = require('child_process');
const { validatePLMSystemAdmin } = require('./landing');
const plm           = require('./plm');
const consoleBuffer = require('../lib/console-buffer');

const ROOT             = path.join(__dirname, '..');
const STORAGE_ROOT     = path.join(ROOT, 'storage');
const SECRET_KEY_TEST  = /secret|password|token|key|credential|auth/i;
const GITHUB_REPO      = 'dickmans/plm-extensions';
const GITHUB_BRANCH    = 'main';
const DEPLOY_INFO_PATH = path.join(ROOT, '.deploy-info.json');


/* ------------------------------------------------------------------------------
    ACCESS CONTROL
    Every /monitoring/api/* call requires
    (1) a valid PLM session, 
    (2) membership in the Administration [SYSTEM] group, and 
    (3) the server-side monitoring token 
    (set once per browser session via POST /monitoring/api/auth).
   ------------------------------------------------------------------------------ */
async function requireSystemAdmin(req, res, next) {

    if(!req.session.hasOwnProperty('headers') || !req.session.headers.hasOwnProperty('token')) {
        return res.status(401).json({ error : 'PLM login required.' });
    }

    let isSystemAdmin = await validatePLMSystemAdmin(req);

    if(!isSystemAdmin) {
        return res.status(403).json({ error : 'This feature requires membership in the Administration [SYSTEM] group.' });
    }

    next();

}
function requireMonitoringSecret(req, res, next) {

    if(req.session.monitoringAuthed) return next();

    res.status(401).json({ error : 'Monitoring secret required.' });

}

router.use(requireSystemAdmin);

router.post('/auth', function(req, res) {

    let configured = req.app.locals.monitoringSecret;

    if(!configured) return res.status(503).json({ error : 'No monitoring secret is configured. Set monitoringSecret in your environment file (or MONITORING_SECRET) to enable this page.' });

    if(!req.body || (req.body.secret !== configured)) return res.status(401).json({ error : 'Invalid secret.' });

    req.session.monitoringAuthed = true;
    req.session.save();

    res.json({ ok : true });

});
router.post('/logout', function(req, res) {

    req.session.monitoringAuthed = false;
    res.json({ ok : true });

});

router.use(requireMonitoringSecret);



/* ------------------------------------------------------------------------------
    GET ALL STARTUP SETTINGS
   ------------------------------------------------------------------------------ */
router.get('/startup-settings', function(req, res) {

    res.json({
        environment : req.app.locals.environment,
        settings    : req.app.locals.settings,
    });

});



/* ------------------------------------------------------------------------------
    STARTUP INFO (same output printed to the console by bin/www on boot)
   ------------------------------------------------------------------------------ */
router.get('/startup-info', function(req, res) {

    res.json({ data : req.app.locals.startupInfo || '' });

});



/* ------------------------------------------------------------------------------
    ACTIVE USER SESSIONS
   ------------------------------------------------------------------------------ */
router.get('/sessions', function(req, res) {

    let store = req.app.locals.sessionStore;

    store.all(function(error, sessions) {

        if(error) return res.status(500).json({ error : 'Failed to read the session store.' });

        let list = Object.keys(sessions || {}).map(function(sid) {

            let data     = sessions[sid] || {};
            let userInfo = data.userInfo ||  {};

            return {
                userName         : userInfo.displayName || '-',
                email            : userInfo.email || '-',
                current          : (sid === req.sessionID),
                plmLoggedIn      : !!(data.headers && data.headers.token),
                loginType        : data.loginType || null,
                monitoringAuthed : !!data.monitoringAuthed,
                cacheEntries     : Array.isArray(data.cache) ? data.cache.length : 0,
                cacheSize        : Buffer.byteLength(JSON.stringify(data.cache), 'utf8'),
                expires          : (data.cookie && data.cookie.expires) ? data.cookie.expires : null
            };

        });

        res.json({ count : list.length, sessions : list });

    });

});



/* ------------------------------------------------------------------------------
    SOURCE FILE VIEWER
   ------------------------------------------------------------------------------ */
function redactSource(source) {

    return source.split('\n').map(function(line) {

        if(!SECRET_KEY_TEST.test(line)) return line;

        return line.replace(/(['"`])((?:\\.|(?!\1).)*)\1/g, function(match, quote) {
            return quote + '••••••••' + quote;
        });

    }).join('\n');

}
function resolveFile(scope, name) {

    if(scope === 'settings.js')     return path.join(ROOT, 'settings.js');
    if(scope === 'environment.js')  return path.join(ROOT, 'environment.js');

    if((scope === 'settings') || (scope === 'environments')) {

        if(!name) throw new Error('Missing file name.');

        let dirPath  = path.join(ROOT, scope);
        let safeName = path.basename(name);
        let entries  = fs.readdirSync(dirPath);

        if(!entries.includes(safeName)) throw new Error('File not found.');

        return path.join(dirPath, safeName);

    }

    throw new Error('Unknown scope.');

}
router.get('/file', function(req, res) {

    try {

        let filePath = resolveFile(req.query.scope, req.query.name);
        let stat     = fs.statSync(filePath);
        let content  = fs.readFileSync(filePath, 'utf8');

        res.json({
            path     : path.relative(ROOT, filePath),
            size     : stat.size,
            modified : stat.mtime,
            content  : redactSource(content)
        });

    } catch(error) {

        res.status(400).json({ error : error.message });

    }

});



/* ------------------------------------------------------------------------------
    MEMORY CONSUMPTION
   ------------------------------------------------------------------------------ */
router.get('/memory', function(req, res) {

    let mem = process.memoryUsage();

    res.json({
        process : {
            rss           : mem.rss,
            heapTotal     : mem.heapTotal,
            heapUsed      : mem.heapUsed,
            external      : mem.external,
            uptimeSeconds : Math.round(process.uptime())
        },
        system : {
            totalMem      : os.totalmem(),
            freeMem       : os.freemem(),
            loadAvg       : os.loadavg(),
            cpus          : os.cpus().length,
            platform      : os.platform(),
            hostname      : os.hostname(),
            uptimeSeconds : Math.round(os.uptime())
        }
    });

});



/* ------------------------------------------------------------------------------
    LIVE CONSOLE LOG
   ------------------------------------------------------------------------------ */
router.get('/console', function(req, res) {

    let entries = consoleBuffer.getEntriesSince(req.query.since);

    res.json({
        entries : entries,
        lastSeq : entries.length ? entries[entries.length - 1].seq : (Number(req.query.since) || 0)
    });

});



/* ------------------------------------------------------------------------------
    GET SIZE OF ALL PER-SESSION CACHES (data.cache, cleared by /cache/clear above)
   ------------------------------------------------------------------------------ */
router.get('/cache/size', function(req, res) {

    let store = req.app.locals.sessionStore;

    store.all(function(error, sessions) {

        if(error) return res.status(500).json({ error : 'Failed to read the session store.' });

        let sids = Object.keys(sessions || {});

        let sessionSizes = sids.map(function(sid) {

            let data  = sessions[sid] || {};
            let cache = Array.isArray(data.cache) ? data.cache : [];
            let size  = Buffer.byteLength(JSON.stringify(cache), 'utf8');

            return { sid : sid, entries : cache.length, size : size };

        });

        let totalSize    = sessionSizes.reduce(function(sum, s) { return sum + s.size;    }, 0);
        let totalEntries = sessionSizes.reduce(function(sum, s) { return sum + s.entries; }, 0);

        res.json({ sessions : sessionSizes.length, totalEntries : totalEntries, totalSize : totalSize });

    });

});



/* ------------------------------------------------------------------------------
    CLEAR PER-SESSION DATA CACHES (shared PLM caches + per-session caches)
   ------------------------------------------------------------------------------ */
router.post('/cache/clear', function(req, res) {

    let sharedCleared = plm.clearSharedCaches();
    let store         = req.app.locals.sessionStore;

    store.all(function(error, sessions) {

        if(error) return res.status(500).json({ error : 'Failed to read the session store.' });

        let sids    = Object.keys(sessions || {});
        let pending = sids.length;
        let failed  = 0;

        if(pending === 0) return res.json({ ok : true, sharedCachesCleared : sharedCleared, sessionsCleared : 0 });

        sids.forEach(function(sid) {

            let data  = sessions[sid];
            data.cache = [];

            store.set(sid, data, function(setError) {

                if(setError) failed++;

                pending--;

                if(pending === 0) {
                    res.json({ ok : true, sharedCachesCleared : sharedCleared, sessionsCleared : sids.length - failed });
                }

            });

        });

    });

});



/* ------------------------------------------------------------------------------
    SERVER ENVIRONMENT VARIABLES (redacted)
   ------------------------------------------------------------------------------ */
function redactValue(value) {

    if(typeof value !== 'string') return value;
    if(value.length <= 4) return '••••';

    return value.slice(0, 2) + '••••' + value.slice(-2);

}
router.get('/env', function(req, res) {

    let env = {};

    Object.keys(process.env).sort().forEach(function(key) {
        env[key] = SECRET_KEY_TEST.test(key) ? redactValue(process.env[key]) : process.env[key];
    });

    res.json({ env : env });

});



/* ------------------------------------------------------------------------------
    LIST FILES IN /environments AND /settings
   ------------------------------------------------------------------------------ */
function listDirectory(dirName) {

    let dirPath = path.join(ROOT, dirName);

    return fs.readdirSync(dirPath, { withFileTypes : true })
        .filter(function(entry) { return entry.isFile(); })
        .map(function(entry) {

            let stat = fs.statSync(path.join(dirPath, entry.name));

            return { name : entry.name, size : stat.size, modified : stat.mtime };

        })
        .sort(function(a, b) { return a.name.localeCompare(b.name); });

}
router.get('/directories', function(req, res) {

    res.json({
        environments : listDirectory('environments'),
        settings     : listDirectory('settings')
    });

});



/* ------------------------------------------------------------------------------
    SETTINGS OVERRIDES EDITOR
    Lets admins browse settings.js defaults next to the overrides already
    present in a chosen /settings file, edit the simple (JSON-safe) leaf
    values, and save - writing a sparse override back into that file and
    restarting the server (via relaunchServer, defined further below) so the
    change takes effect without a manual restart.
   ------------------------------------------------------------------------------ */
const SETTINGS_EDITABLE_SECTIONS = ['common', 'applications', 'server', 'chrome'];

function isPlainObject(value) {
    return !!value && (typeof value === 'object') && !Array.isArray(value);
}
function isEditableLeaf(value) {

    let type = typeof value;

    if((type === 'string') || (type === 'number') || (type === 'boolean')) return true;

    return Array.isArray(value) && value.every(function(entry) { return typeof entry === 'string'; });

}
function buildSettingsTree(defaultsNode, overrideNode, basePath) {

    let rows          = [];
    let advancedCount = 0;

    Object.keys(defaultsNode || {}).forEach(function(key) {

        let nodePath      = basePath ? (basePath + '.' + key) : key;
        let defaultValue  = defaultsNode[key];
        let hasOverride   = isPlainObject(overrideNode) && overrideNode.hasOwnProperty(key);
        let overrideValue = hasOverride ? overrideNode[key] : undefined;

        if(typeof defaultValue === 'function') { advancedCount++; return; }

        if(isEditableLeaf(defaultValue)) {

            rows.push({
                path       : nodePath,
                label      : key,
                type       : Array.isArray(defaultValue) ? 'stringArray' : typeof defaultValue,
                default    : defaultValue,
                override   : hasOverride ? overrideValue : null,
                overridden : hasOverride
            });

            return;

        }

        if(isPlainObject(defaultValue)) {

            let child = buildSettingsTree(defaultValue, hasOverride ? overrideValue : null, nodePath);

            rows          = rows.concat(child.rows);
            advancedCount += child.advancedCount;

            return;

        }

        advancedCount++;   // array-of-objects, null, etc. - not editable through this form

    });

    return { rows : rows, advancedCount : advancedCount };

}
function loadFreshModule(filePath) {

    delete require.cache[require.resolve(filePath)];

    return require(filePath);

}

router.get('/settings/tree', function(req, res) {

    try {

        let filePath  = resolveFile('settings', req.query.file);
        let defaults  = loadFreshModule(path.join(ROOT, 'settings.js'));
        let overrides = loadFreshModule(filePath);

        let sections = {};

        SETTINGS_EDITABLE_SECTIONS.forEach(function(section) {
            sections[section] = buildSettingsTree(defaults[section], overrides[section], section);
        });

        res.json({ file : req.query.file, sections : sections });

    } catch(error) {

        res.status(400).json({ error : error.message });

    }

});

function setAtPath(target, dottedPath, value) {

    let keys = dottedPath.split('.');
    let last = keys.pop();
    let node = target;

    keys.forEach(function(key) {
        if(!isPlainObject(node[key])) node[key] = {};
        node = node[key];
    });

    node[last] = value;

}
function unsetAtPath(target, dottedPath) {

    let keys = dottedPath.split('.');
    let last = keys.pop();
    let node = target;

    for(let key of keys) {
        if(!isPlainObject(node[key])) return;
        node = node[key];
    }

    delete node[last];

}
function pruneEmptyObjects(node) {

    Object.keys(node).forEach(function(key) {

        if(!isPlainObject(node[key])) return;

        pruneEmptyObjects(node[key]);

        if(Object.keys(node[key]).length === 0) delete node[key];

    });

}
function serializeSettingsValue(value, indent) {

    let pad      = '    '.repeat(indent);
    let padInner = '    '.repeat(indent + 1);

    if(Array.isArray(value)) {

        if(value.length === 0) return '[]';

        let items = value.map(function(entry) { return padInner + serializeSettingsValue(entry, indent + 1); });

        return '[\n' + items.join(',\n') + '\n' + pad + ']';

    }

    if(isPlainObject(value)) {

        let keys = Object.keys(value);

        if(keys.length === 0) return '{}';

        let items = keys.map(function(key) {

            let safeKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);

            return padInner + safeKey + ' : ' + serializeSettingsValue(value[key], indent + 1);

        });

        return '{\n' + items.join(',\n') + '\n' + pad + '}';

    }

    if(typeof value === 'string') return '\'' + value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'') + '\'';
    if(typeof value === 'function') throw new Error('Function values are not supported by this editor.');

    return JSON.stringify(value);

}
function extractHeaderComment(source) {

    let match = source.match(/^exports\./m);

    return match ? source.slice(0, match.index).replace(/\s+$/, '') : '';

}

router.post('/settings/save', function(req, res) {

    try {

        let fileName = req.body.file;
        let filePath = resolveFile('settings', fileName);
        let current  = loadFreshModule(filePath);

        // clone before mutating, stripping any function properties the custom
        // file might already contain (this editor never writes functions back)
        let working = JSON.parse(JSON.stringify(current, function(key, value) {
            return (typeof value === 'function') ? undefined : value;
        }));

        let sets   = Array.isArray(req.body.sets)   ? req.body.sets   : [];
        let unsets = Array.isArray(req.body.unsets) ? req.body.unsets : [];

        sets.forEach(function(entry) {

            if(typeof entry.value === 'function') throw new Error('Function values are not supported by this editor.');

            setAtPath(working, entry.path, entry.value);

        });

        unsets.forEach(function(unsetPath) { unsetAtPath(working, unsetPath); });

        Object.keys(working).forEach(function(key) {
            if(isPlainObject(working[key])) pruneEmptyObjects(working[key]);
        });

        let backupDir = path.join(ROOT, 'settings', '.backups');
        if(!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive : true });

        let stamp = new Date().toISOString().replace(/[:.]/g, '-');
        fs.copyFileSync(filePath, path.join(backupDir, fileName + '.' + stamp + '.js'));

        let header = extractHeaderComment(fs.readFileSync(filePath, 'utf8'));

        let body = Object.keys(working).map(function(key) {
            return 'exports.' + key + ' = ' + serializeSettingsValue(working[key], 0) + ';\n';
        }).join('\n');

        fs.writeFileSync(filePath, (header ? header + '\n\n' : '') + body);

        req.app.locals.maintenance = { active : true, startedAt : Date.now(), etaMinutes : 1 };

        res.json({ ok : true, message : 'Settings saved. The server is restarting now.' });

        setTimeout(function() { relaunchServer(req.app); }, 500);

    } catch(error) {

        res.status(400).json({ error : error.message });

    }

});



/* ------------------------------------------------------------------------------
    STORAGE STATISTICS
   ------------------------------------------------------------------------------ */
function walk(dirPath) {

    let files = [];

    fs.readdirSync(dirPath, { withFileTypes : true }).forEach(function(entry) {

        let fullPath = path.join(dirPath, entry.name);

        if(entry.isDirectory())     files = files.concat(walk(fullPath));
        else if(entry.isFile())     files.push(fullPath);

    });

    return files;

}
function listStorageFolders() {

    return fs.readdirSync(STORAGE_ROOT, { withFileTypes : true })
        .filter(function(entry) { return entry.isDirectory(); })
        .map(function(entry) { return entry.name; });

}

router.get('/storage', function(req, res) {

    let folders = listStorageFolders();

    let report = folders.map(function(folder) {

        let files     = walk(path.join(STORAGE_ROOT, folder));
        let totalSize = 0;
        let oldest    = null;
        let newest    = null;

        files.forEach(function(file) {

            let stat = fs.statSync(file);
            totalSize += stat.size;

            if(!oldest || (stat.mtime < oldest)) oldest = stat.mtime;
            if(!newest || (stat.mtime > newest)) newest = stat.mtime;

        });

        return { folder : folder, fileCount : files.length, totalSize : totalSize, oldest : oldest, newest : newest };

    });

    res.json({
        folders    : report,
        totalFiles : report.reduce(function(sum, r) { return sum + r.fileCount;  }, 0),
        totalSize  : report.reduce(function(sum, r) { return sum + r.totalSize;  }, 0)
    });

});



/* ------------------------------------------------------------------------------
    STORAGE GROWTH OVER THE LAST 12 MONTHS
    There is no persisted history of storage size over time, so this is
    reconstructed from each file's modification date - a reasonable proxy as
    long as files are not commonly backdated. Files older than the 12 month
    window are folded into the starting baseline.
   ------------------------------------------------------------------------------ */
router.get('/storage/history', function(req, res) {

    let now    = new Date();
    let months = [];

    for(let i = 11; i >= 0; i--) {

        let d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ year : d.getFullYear(), month : d.getMonth(), label : d.toLocaleString('en-US', { month : 'short', year : 'numeric' }) });

    }

    let windowStart  = new Date(months[0].year, months[0].month, 1);
    let baselineSize = 0;
    let addedByMonth = months.map(function() { return 0; });

    listStorageFolders().forEach(function(folder) {

        walk(path.join(STORAGE_ROOT, folder)).forEach(function(file) {

            let stat  = fs.statSync(file);
            let mtime = stat.mtime;

            if(mtime < windowStart) {
                baselineSize += stat.size;
                return;
            }

            let idx = months.findIndex(function(m) { return (mtime.getFullYear() === m.year) && (mtime.getMonth() === m.month); });

            if(idx === -1) { baselineSize += stat.size; return; }

            addedByMonth[idx] += stat.size;

        });

    });

    let cumulativeSize = [];
    let running        = baselineSize;

    addedByMonth.forEach(function(added) {
        running += added;
        cumulativeSize.push(running);
    });

    res.json({
        months         : months.map(function(m) { return m.label; }),
        addedBytes     : addedByMonth,
        cumulativeSize : cumulativeSize,
        baselineSize   : baselineSize
    });

});



/* ------------------------------------------------------------------------------
    STORAGE CLEANUP (by folder, by age, by size cap)
   ------------------------------------------------------------------------------ */
router.post('/storage/cleanup', function(req, res) {

    let folder         = req.body.folder || 'all';
    let olderThanDays   = req.body.olderThanDays  ? Number(req.body.olderThanDays)  : null;
    let maxTotalSizeMB  = req.body.maxTotalSizeMB ? Number(req.body.maxTotalSizeMB) : null;
    let dryRun          = (req.body.dryRun !== false);

    let allFolders = listStorageFolders();
    let folders    = (folder === 'all') ? allFolders : allFolders.filter(function(f) { return f === folder; });

    if(folders.length === 0) return res.status(400).json({ error : 'Unknown storage folder.' });

    let candidates = [];

    folders.forEach(function(f) {

        walk(path.join(STORAGE_ROOT, f)).forEach(function(file) {

            let stat = fs.statSync(file);
            candidates.push({ path : file, size : stat.size, mtime : stat.mtime });

        });

    });

    let toDelete = candidates.filter(function(c) {

        if(!olderThanDays) return true;

        return ((Date.now() - c.mtime.getTime()) / 86400000) >= olderThanDays;

    });

    if(maxTotalSizeMB) {

        let totalAll = candidates.reduce(function(sum, c) { return sum + c.size; }, 0);
        let maxBytes = maxTotalSizeMB * 1024 * 1024;
        let excess   = totalAll - maxBytes;

        if(excess <= 0) {
            toDelete = [];
        } else {

            toDelete.sort(function(a, b) { return a.mtime - b.mtime; });

            let removed  = 0;
            let selected = [];

            for(let c of toDelete) {

                selected.push(c);
                removed += c.size;

                if(removed >= excess) break;

            }

            toDelete = selected;

        }

    }

    let bytesToFree = toDelete.reduce(function(sum, c) { return sum + c.size; }, 0);

    if(dryRun) {
        return res.json({ dryRun : true, filesMatched : toDelete.length, bytesToFree : bytesToFree });
    }

    let deleted = 0;
    let failed  = 0;

    toDelete.forEach(function(c) {

        try { fs.unlinkSync(c.path); deleted++; }
        catch(error) { failed++; }

    });

    res.json({ dryRun : false, filesDeleted : deleted, filesFailed : failed, bytesFreed : bytesToFree });

});



/* ------------------------------------------------------------------------------
    RESTART SERVER
   ------------------------------------------------------------------------------ */
router.post('/restart', function(req, res) {

    req.app.locals.maintenance = { active : true, startedAt : Date.now(), etaMinutes : 1 };

    res.json({ ok : true, message : 'The server is restarting now.' });

    setTimeout(function() { relaunchServer(req.app); }, 500);

});



/* ------------------------------------------------------------------------------
    DEPLOYMENT - check GitHub, show last deploy, pull + relaunch
   ------------------------------------------------------------------------------ */
function git(args) {
    return execSync('git ' + args, { cwd : ROOT, encoding : 'utf8' }).trim();
}
function getDirtyFiles() {

    let output = git('status --porcelain');

    if(output === '') return [];

    return output.split('\n').map(function(line) { return line.slice(3).trim(); });

}
function readDeployInfo() {

    if(!fs.existsSync(DEPLOY_INFO_PATH)) return null;

    try { return JSON.parse(fs.readFileSync(DEPLOY_INFO_PATH, 'utf8')); }
    catch(error) { return null; }

}
function writeDeployInfo(commit) {

    fs.writeFileSync(DEPLOY_INFO_PATH, JSON.stringify({
        commit     : commit,
        deployedAt : new Date().toISOString()
    }, null, 2));

}

router.get('/deploy/status', async function(req, res) {

    let local;

    try {

        local = {
            commit  : git('rev-parse HEAD'),
            subject : git('log -1 --format=%s'),
            date    : git('log -1 --format=%cI')
        };

    } catch(error) {
        return res.status(500).json({ error : 'This server is not a git checkout: ' + error.message });
    }

    let remote      = null;
    let remoteError = null;

    try {

        let response = await axios.get('https://api.github.com/repos/' + GITHUB_REPO + '/commits/' + GITHUB_BRANCH, {
            headers : { 'Accept' : 'application/vnd.github+json', 'User-Agent' : 'plm-extensions-monitoring' },
            timeout : 5000
        });

        remote = {
            sha     : response.data.sha,
            subject : response.data.commit.message.split('\n')[0],
            date    : response.data.commit.committer.date
        };

    } catch(error) {
        remoteError = 'Could not reach GitHub (' + ((error.response && error.response.status) || error.code) + ').';
    }

    res.json({
        local       : local,
        remote      : remote,
        remoteError : remoteError,
        upToDate    : remote ? (remote.sha === local.commit) : null,
        dirty       : getDirtyFiles(),
        lastDeploy  : readDeployInfo(),
        maintenance : req.app.locals.maintenance
    });

});

function relaunchServer(app) {

    let launched = false;

    function launchChild() {

        if(launched) return;
        launched = true;

        try {

            let logsDir = path.join(ROOT, 'logs');
            if(!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

            let out = fs.openSync(path.join(logsDir, 'deploy.log'), 'a');

            fs.writeSync(out, '\n---- relaunching ' + new Date().toISOString() + ' ----\n');

            let child = spawn(process.execPath, process.execArgv.concat(process.argv.slice(1)), {
                cwd      : ROOT,
                detached : true,
                stdio    : ['ignore', out, out],
                env      : process.env
            });

            child.unref();

        } catch(error) {
            fs.appendFileSync(path.join(ROOT, 'logs', 'deploy.log'), 'Relaunch failed: ' + error.message + '\n');
        }

        setTimeout(function() { process.exit(0); }, 300);

    }

    if(app.locals.httpServer) app.locals.httpServer.close(launchChild);
    else launchChild();

    // safety net: never wait more than a few seconds for existing connections to drain
    setTimeout(launchChild, 5000);

}

router.post('/deploy/update', function(req, res) {

    let dirty = getDirtyFiles();

    if(dirty.length > 0) {
        return res.status(409).json({ error : 'The working tree has uncommitted changes. Commit, stash or discard them before updating.', files : dirty });
    }

    req.app.locals.maintenance = { active : true, startedAt : Date.now(), etaMinutes : 10 };

    try {

        git('fetch origin ' + GITHUB_BRANCH);
        git('merge --ff-only origin/' + GITHUB_BRANCH);

        let newCommit = git('rev-parse HEAD');

        writeDeployInfo(newCommit);

        res.json({ ok : true, commit : newCommit, message : 'Update pulled. The server is restarting now.' });

        setTimeout(function() { relaunchServer(req.app); }, 500);

    } catch(error) {

        req.app.locals.maintenance.active = false;
        res.status(500).json({ error : 'Update failed: ' + error.message });

    }

});



module.exports = router;
