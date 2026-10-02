const express        = require('express');
const path           = require('path');
const fs             = require('fs');
const serveIndex     = require('serve-index');
const router         = express.Router();
const excludeFolders = ['__failed', '__success', '__skipped'];
const { validatePLMSession } = require('./landing');

const STORAGE_ROOT = path.resolve(__dirname, '..', 'storage');


// Cached and exported files require a valid PLM login
router.use(validatePLMSession, express.static(STORAGE_ROOT), serveIndex(STORAGE_ROOT, { icons: true }));


/* ------------------------------------------------------------------------------
    resolveStoragePath(...segments)
    Joins the segments below /storage and returns the path relative to the
    server root (e.g. 'storage/exports/abc'), or null if the result would leave
    /storage (e.g. segments containing '..') or any segment is not a string.
   ------------------------------------------------------------------------------ */
function resolveStoragePath(...segments) {

    for(let segment of segments) {
        if(typeof segment !== 'string') return null;
        if(segment.indexOf('\0') >= 0 ) return null;
    }

    let full = path.resolve(STORAGE_ROOT, ...segments);

    if(full !== STORAGE_ROOT && !full.startsWith(STORAGE_ROOT + path.sep)) return null;

    return 'storage' + full.substring(STORAGE_ROOT.length).split(path.sep).join('/');

}


/* ------------------------------------------------------------------------------
    LIST ALL FOLDERS IN /STORAGE
   ------------------------------------------------------------------------------ */
router.get('/folders', validatePLMSession, function(req, res, next) {

    console.log(' ');
    console.log('  /storage/folders');
    console.log(' --------------------------------------------');
    console.log('  req.query.path    = ' + req.query.path);
    console.log();

    let path = resolveStoragePath(req.query.path);

    if(path === null) return res.status(400).json({ error : true, message : 'Invalid path' });

    let response = {
        path    : path,
        folders : [],
        url     : '/storage/folders'
    };

    if(fs.existsSync(path)) {
        console.log('1');
        fs.readdir(path, function (err, files) {
            console.log('2');
            files.forEach(function (file) {
                console.log('3');
                if(fs.lstatSync(path + '/' + file).isDirectory()) {
                    response.folders.push(file);
                }
            });
            console.log('4');
            res.json(response);

        });
    } else { res.json(response); }

});


/* ------------------------------------------------------------------------------
    LIST ALL FILES IN DEFINED FOLDER WITHIN /STORAGE
   ------------------------------------------------------------------------------ */
router.get('/files', validatePLMSession, function(req, res, next) {

    console.log(' ');
    console.log('  /storage/files');
    console.log(' --------------------------------------------');
    console.log('  req.query.path  = ' + req.query.path);
    console.log('  req.query.limit = ' + req.query.limit);
    console.log();

    let limit = (typeof req.query.limit === 'undefined') ? 100 : req.query.limit;
    let path  = resolveStoragePath(req.query.path);

    if(path === null) return res.status(400).json({ error : true, message : 'Invalid path' });

    let response = {
        path       : path,
        files      : [],
        totalCount : 0,
        url        : '/storage/files'
    };

    if(fs.existsSync(path)) {
        fs.readdir(path, function (err, files) {
            files.forEach(function (file) {
                if(!fs.lstatSync(path + '/' + file).isDirectory()) {
                    if(file.indexOf('.') > 0) {
                        if(response.files.length < limit) {
                            response.files.push(file);
                        }
                        response.totalCount++;
                    }
                }
            });
            res.json(response);
        });
    } else { 
        response.error   = true;
        response.message = 'Folder does not exist';
        res.json(response); 
    }

});


/* ------------------------------------------------------------------------------
    LIST ALL FILES & FOLDERS IN DEFINED FOLDER WITHIN /STORAGE
   ------------------------------------------------------------------------------ */
router.get('/contents', validatePLMSession, function(req, res, next) {

    console.log(' ');
    console.log('  /storage/contents');
    console.log(' --------------------------------------------');
    console.log('  req.query.path  = ' + req.query.path);
    console.log('  req.query.limit = ' + req.query.limit);
    console.log();

    let limit = (typeof req.query.limit === 'undefined') ? 100 : req.query.limit;
    let path  = resolveStoragePath(req.query.path);

    if(path === null) return res.status(400).json({ error : true, message : 'Invalid path' });

    let response = {
        path                : path,
        files               : [],
        folders             : [],
        contents            : [],
        totalCountFiles     : 0,
        totalCountFolders   : 0,
        totalCountAll       : 0
    };

    if(fs.existsSync(path)) {

        let contents = fs.readdirSync(path, {
            withFileTypes: true
        });

        for(let content of contents) {

            if(content.isDirectory()) {
                if(!excludeFolders.includes(content.name)) {
                    
                    response.totalCountFolders++;
                    response.totalCountAll++;
                    
                    if(response.contents.length < limit) {
                    
                        response.folders.push(content.name);
                        
                        let contentsFolder = fs.readdirSync(path + '/' + content.name, {
                            withFileTypes: true
                        });

                        let folderFiles = [];

                        for(let contentFolder of contentsFolder) {
                            if(!contentFolder.isDirectory()) {
                                if(contentFolder.name.indexOf('.') > 0) {
                                    response.totalCountAll++;
                                    response.totalCountFiles++;
                                    folderFiles.push({
                                        type : 'file',
                                        name : contentFolder.name
                                    });
                                }
                            }
                        }

                        response.contents.push({
                            type  : 'folder',
                            name  : content.name,
                            files : folderFiles
                        });

                    }
                }

            } else if(content.name.indexOf('.') > 0) {
                response.totalCountFiles++;
                if(response.contents.length < limit) {
                    response.files.push(content.name);
                    response.contents.push({
                        type : 'file',
                        name : content.name
                    });
                }
            }

        }

        res.json(response);

    } else { 
        response.error   = true;
        response.message = 'Requested folder defined by path property does not exist';
        res.json(response); 
    }

});


module.exports = router;
module.exports.resolveStoragePath = resolveStoragePath;
