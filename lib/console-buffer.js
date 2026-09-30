/* ------------------------------------------------------------------------------
    Captures everything written via console.log/info/warn/error/debug into an
    in-memory ring buffer, in addition to (not instead of) the real console
    output. This lets the Monitoring page show a live tail of what an admin
    would otherwise only see in the terminal that started the server (see
    routes/monitoring.js -> GET /console).

    start() must run before any other module logs, so app.js requires this
    file as its very first statement.
   ------------------------------------------------------------------------------ */

const util = require('util');

const MAX_ENTRIES = 2000;

let entries = [];
let nextSeq = 1;
let started = false;

function record(level, args) {

    entries.push({
        seq   : nextSeq++,
        time  : new Date().toISOString(),
        level : level,
        text  : util.format.apply(util, args)
    });

    if(entries.length > MAX_ENTRIES) entries = entries.slice(entries.length - MAX_ENTRIES);

}

function start() {

    if(started) return;
    started = true;

    ['log', 'info', 'warn', 'error', 'debug'].forEach(function(level) {

        let original = console[level].bind(console);

        console[level] = function() {
            record(level, arguments);
            original.apply(console, arguments);
        };

    });

}

function getEntriesSince(sinceSeq) {

    let since = Number(sinceSeq) || 0;

    return entries.filter(function(entry) { return entry.seq > since; });

}

module.exports = { start : start, getEntriesSince : getEntriesSince };
