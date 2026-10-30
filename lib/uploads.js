/* ------------------------------------------------------------------------------
    Shared handling of file uploads (used by routes/plm.js and routes/aps.js)

    - Limits the size and number of uploaded files
    - Streams uploads to temporary files instead of holding them in memory
    - Stores every request in its own folder below /uploads, so that uploads
      of different users never overwrite each other even if file names match
    - Removes temporary files and upload folders when the request is finished
   ------------------------------------------------------------------------------ */

const crypto     = require('crypto');
const fs         = require('fs');
const path       = require('path');
const fileUpload = require('express-fileupload');

const UPLOAD_ROOT     = path.resolve(__dirname, '..', 'uploads');
const TEMP_ROOT       = path.join(UPLOAD_ROOT, 'tmp');
const MAX_FILE_SIZE   = 200 * 1024 * 1024;     // 200 MB per file
const MAX_FILE_COUNT  = 100;                   // files per request
const FOLDER_PATTERN  = /^[a-f0-9]{32}$/;


// Nothing is in flight while the server starts: remove leftovers of interrupted uploads
function removeLeftovers() {

    fs.mkdirSync(TEMP_ROOT, { recursive : true });

    for(let entry of fs.readdirSync(UPLOAD_ROOT)) {
        if(entry === 'tmp' || FOLDER_PATTERN.test(entry)) {
            fs.rmSync(path.join(UPLOAD_ROOT, entry), { recursive : true, force : true });
        }
    }

    fs.mkdirSync(TEMP_ROOT, { recursive : true });

}
removeLeftovers();


/* ------------------------------------------------------------------------------
    uploadMiddleware()
    Replacement for fileUpload(). Temporary files are deleted when the response
    is finished (files already moved to an upload folder are not affected).
   ------------------------------------------------------------------------------ */
function uploadMiddleware() {

    const parser = fileUpload({
        limits          : { fileSize : MAX_FILE_SIZE, files : MAX_FILE_COUNT },
        abortOnLimit    : true,
        responseOnLimit : 'File exceeds the maximum upload size of ' + (MAX_FILE_SIZE / 1024 / 1024) + ' MB',
        useTempFiles    : true,
        tempFileDir     : TEMP_ROOT
    });

    return function(req, res, next) {

        parser(req, res, function(error) {

            if(req.files) {
                res.on('close', function() {
                    for(let file of getFiles(req.files)) {
                        if(file.tempFilePath) fs.rm(file.tempFilePath, { force : true }, function() {});
                    }
                });
            }

            next(error);

        });

    };

}


/* ------------------------------------------------------------------------------
    getUploadedFiles(req)
    Returns the list of valid files sent in form field 'newFiles' (empty if none)
   ------------------------------------------------------------------------------ */
function getUploadedFiles(req) {

    return (req.files) ? getFiles({ newFiles : req.files.newFiles }) : [];

}
function getFiles(files) {

    let result = [];

    for(let key of Object.keys(files)) {
        for(let file of [].concat(files[key])) {
            if(file && typeof file.mv === 'function') result.push(file);
        }
    }

    return result;

}


/* ------------------------------------------------------------------------------
    saveUploadedFiles(res, files)
    Moves the files to a new folder below /uploads that is removed when the
    response is finished. Resolves with a list of { name, path }.
   ------------------------------------------------------------------------------ */
function saveUploadedFiles(res, files) {

    return Promise.resolve().then(function() {

        let folder = path.join(UPLOAD_ROOT, crypto.randomBytes(16).toString('hex'));

        res.on('close', function() {
            fs.rm(folder, { recursive : true, force : true }, function() {});
        });

        fs.mkdirSync(folder, { recursive : true });

        let saved = files.map(function(file) {

            let name = path.basename(String(file.name)).replace(/[\x00-\x1f\x7f]/g, '');

            if(name === '' || name === '.' || name === '..') throw new Error('Invalid file name');

            return { name : name, path : path.join(folder, name), file : file };

        });

        return Promise.all(saved.map(function(entry) {
            return entry.file.mv(entry.path);
        })).then(function() {
            return saved.map(function(entry) { return { name : entry.name, path : entry.path }; });
        });

    });

}


module.exports.uploadMiddleware  = uploadMiddleware;
module.exports.getUploadedFiles  = getUploadedFiles;
module.exports.saveUploadedFiles = saveUploadedFiles;
module.exports.MAX_FILE_SIZE     = MAX_FILE_SIZE;
