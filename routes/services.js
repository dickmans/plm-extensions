const express       = require('express');
const axios         = require('axios');
const querystring   = require('querystring');
const router        = express.Router();



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


module.exports = router;