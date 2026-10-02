const express = require('express');
const fs      = require('fs');
const router  = express.Router();


/* ---------------------------------------
    SMART PRINTER CONTROL
   --------------------------------------- */

// let minTemperature = 23;

// let statusPrinter = {
//     'jobss'         : 5,
//     'jobsm'         : 2,
//     'jobsl'         : 1,
//     'supplies'      : 100,
//     'temperature'   : minTemperature,
//     'wp1'           : 90,
//     'wp2'           : 82,
//     'wp3'           : 100
//     // 'wp1'           : Math.floor(Math.random() * 100) + 1,
//     // 'wp2'           : Math.floor(Math.random() * 100) + 1,
//     // 'wp3'           : Math.floor(Math.random() * 100) + 1
// }

// init();

// async function init() {
//     do {
//         await sleep(1000);
//         statusPrinter.temperature -= 0.1;
//         if(statusPrinter.temperature < minTemperature) statusPrinter.temperature = minTemperature;
//     } while(true)
// }  
// function sleep(ms) {
//     return new Promise((resolve) => {
//         setTimeout(resolve, ms);
//     });
// }

// router.get('/get-printer-status', function(req, res, next) {
//     res.send(statusPrinter);
// });

// router.get('/submit-print-job', function(req, res, next) {

//     // console.log(req.query.type);

//     switch(req.query.type) {

//         case 'small':
//             statusPrinter.jobss++;
//             statusPrinter.supplies-=0.8;
//             statusPrinter.temperature+=0.87;
//             statusPrinter.wp1 -= 2;
//             statusPrinter.wp2 -= 2.2;
//             statusPrinter.wp3 -= 3.2;
//             break;

//         case 'medium':
//             statusPrinter.jobsm++;
//             statusPrinter.supplies-=1.4;
//             statusPrinter.temperature+=1.5;
//             statusPrinter.wp1 -= 2;
//             statusPrinter.wp2 -= 2.2;
//             statusPrinter.wp3 -= 3.2;
//             break;

//         case 'large':
//             statusPrinter.jobsl++;
//             statusPrinter.supplies-=3.1;
//             statusPrinter.temperature+=2.1;
//             statusPrinter.wp1 -= 2;
//             statusPrinter.wp2 -= 2.2;
//             statusPrinter.wp3 -= 3.2;
//             break;

//     }

//     if(statusPrinter.supplies < 0) statusPrinter.supplies = 0;

//     if(statusPrinter.temperature > 80) statusPrinter.temperature = 80;

//     res.send(statusPrinter);

// });

// router.get('/resupply', function(req, res, next) {
//     statusPrinter.supplies = 100;
//     res.send(statusPrinter);
// });



// Get Chrome Extensions configuration settings
router.get('/chrome', function(req, res, next) {

    console.log(' ');
    console.log('  /chrome');
    console.log(' --------------------------------------------');
    console.log('  # commands = ' + req.app.locals.chrome.commands.length);
    console.log('  # buttons  = ' + req.app.locals.chrome.buttons.length);
    console.log();

    res.json(req.app.locals.chrome);
    
});


// Download Chrome Extensions installation files
router.get('/chrome-installer', function(req, res, next) {

    let path = 'chrome';

    let response = {
        path  : path,
        files : [],
        url   : '/services/chrome-installer'
    };    

    let redirectUri = req.app.locals.redirectUri;
    let baseURL     = redirectUri.split('/callback')[0];

    if(fs.existsSync(path)) {
        fs.readdir(path, function (err, files) {
            files.forEach(function (file) {
                let filePath = path + '/' + file;
                if(!fs.lstatSync(filePath).isDirectory()) {
                    if(file.indexOf('.') > 0) {

                        let suffix   = file.split('.')[1];
                        let encoding = (suffix == 'png') ? 'base64' : 'utf8';
                        let data     = '';

                        if(encoding === 'utf8') {
                            data = fs.readFileSync(path + '/' + file, 'utf8');
                            data = data.replaceAll('http://localhost:8080', baseURL);
                        } else {
                            data = fs.readFileSync(path + '/' + file);
                            data = data.toString("base64");
                        }

                        response.files.push({
                            name     : file,
                            data     : data,
                            encoding : encoding
                        });

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


module.exports = router;