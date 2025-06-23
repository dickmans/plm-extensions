const express        = require('express');
const axios          = require('axios');
const querystring    = require('querystring');
const fs             = require('fs');
const router         = express.Router();
const excludeFolders = ['__failed', '__success', '__skipped'];



/* ---------------------------------------
    SMART PRINTER CONTROL
   --------------------------------------- */

let minTemperature = 23;

let statusPrinter = {
    'jobss'         : 5,
    'jobsm'         : 2,
    'jobsl'         : 1,
    'supplies'      : 100,
    'temperature'   : minTemperature,
    'wp1'           : 90,
    'wp2'           : 82,
    'wp3'           : 100
    // 'wp1'           : Math.floor(Math.random() * 100) + 1,
    // 'wp2'           : Math.floor(Math.random() * 100) + 1,
    // 'wp3'           : Math.floor(Math.random() * 100) + 1
}

init();

async function init() {
    do {
        await sleep(1000);
        statusPrinter.temperature -= 0.1;
        if(statusPrinter.temperature < minTemperature) statusPrinter.temperature = minTemperature;
    } while(true)
}  
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

router.get('/get-printer-status', function(req, res, next) {
    res.send(statusPrinter);
});

router.get('/submit-print-job', function(req, res, next) {

    console.log(req.query.type);

    switch(req.query.type) {

        case 'small':
            statusPrinter.jobss++;
            statusPrinter.supplies-=0.8;
            statusPrinter.temperature+=0.87;
            statusPrinter.wp1 -= 2;
            statusPrinter.wp2 -= 2.2;
            statusPrinter.wp3 -= 3.2;
            break;

        case 'medium':
            statusPrinter.jobsm++;
            statusPrinter.supplies-=1.4;
            statusPrinter.temperature+=1.5;
            statusPrinter.wp1 -= 2;
            statusPrinter.wp2 -= 2.2;
            statusPrinter.wp3 -= 3.2;
            break;

        case 'large':
            statusPrinter.jobsl++;
            statusPrinter.supplies-=3.1;
            statusPrinter.temperature+=2.1;
            statusPrinter.wp1 -= 2;
            statusPrinter.wp2 -= 2.2;
            statusPrinter.wp3 -= 3.2;
            break;

    }

    console.log('here');

    if(statusPrinter.supplies < 0) statusPrinter.supplies = 0;

    console.log('here');

    if(statusPrinter.temperature > 80) statusPrinter.temperature = 80;

    console.log('here');

    res.send(statusPrinter);

});

router.get('/resupply', function(req, res, next) {
    statusPrinter.supplies = 100;
    res.send(statusPrinter);
});



// Get list of folders in /storage
router.get('/storage/folders', function(req, res, next) {

    console.log(' ');
    console.log('  /storage/folders');
    console.log(' --------------------------------------------');
    console.log('  req.query.path    = ' + req.query.path);
    console.log();

    let path = 'storage/' + req.query.path;

    let response = {
        path    : path,
        folders : []
    };

    if(fs.existsSync(path)) {
        fs.readdir(path, function (err, files) {
            files.forEach(function (file) {
                if(fs.lstatSync(path + '/' + file).isDirectory()) {
                    response.folders.push(file);
                }
            });
            res.json(response);

        });
    } else { res.json(response); }

});



// Get list of files in defined foleder within /storage
router.get('/storage/files', function(req, res, next) {

    console.log(' ');
    console.log('  /storage/files');
    console.log(' --------------------------------------------');
    console.log('  req.query.path  = ' + req.query.path);
    console.log('  req.query.limit = ' + req.query.limit);
    console.log();

    let limit = (typeof req.query.limit === 'undefined') ? 100 : req.query.limit;
    let path  = 'storage/' + req.query.path;

    let response = {
        path       : path,
        files      : [],
        totalCount : 0
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



// Get list of files and folders in defined foleder within /storage
router.get('/storage/contents', function(req, res, next) {

    console.log(' ');
    console.log('  /storage/contents');
    console.log(' --------------------------------------------');
    console.log('  req.query.path  = ' + req.query.path);
    console.log('  req.query.limit = ' + req.query.limit);
    console.log();

    let limit = (typeof req.query.limit === 'undefined') ? 100 : req.query.limit;
    let path  = 'storage/' + req.query.path;

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