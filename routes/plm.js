const express       = require('express');
const router        = express.Router();
const axios         = require('axios');
const querystring   = require('querystring');
const fs            = require('fs');
const fileUpload    = require('express-fileupload');
const FormData      = require('form-data');
const { Console }   = require('console');
const pathUploads   = 'uploads/';

router.use(fileUpload());

let indexRequest = 0;


function getCustomHeaders(req) {

    let headers = {
        'Content-Type'  : 'application/json',
        'Accept'        : 'application/json',
        'X-Tenant'      : req.session.tenant,
        'token'         : req.session.headers.token,
        'Authorization' : req.session.headers.Authorization       
    }

    return headers;

}
function runPromised(url, headers) {

    return axios.get(url, {
        'headers' : headers
    }).then(function(response) {
        return response.data;
    }).catch(function(error) {
        console.log('error');
        console.log(error);
    });

}
function sortArray(array, key, type) {

    if(typeof type === 'undefine') type = 'string';

    if(type.toLowerCase === 'string') {

        array.sort(function(a, b){
            var nameA=a[key].toLowerCase(), nameB=b[key].toLowerCase()
            if (nameA < nameB) //sort string ascending
               return -1 
            if (nameA > nameB)
               return 1
            return 0 //default return value (no sorting)
        });

    } else {

        array.sort(function(a, b){
            var nameA=a[key], nameB=b[key]
            if (nameA < nameB) //sort string ascending
                return -1 
            if (nameA > nameB)
                return 1
            return 0 //default return value (no sorting)
        });

    }

}
function sendResponse(req, res, response, error) {

    let result = {
        'url'       : req.url,
        'params'    : (Object.keys(req.body).length === 0) ? req.query : req.body,
        'data'      : [],
        'status'    : '',
        'message'   : '',
        'error'     : error       
    }

    if(error) {

        console.log();
        console.log(' ERROR REQUESTING ' + req.url);

        if(typeof response !== 'undefined') {
            if(typeof response.message !== 'undefined') {
                console.log(response.message);
                result.message = response.message;
            }
            if(typeof response.data !== 'undefined') {
                if(response.data.length > 0) {
                    if(typeof response.data === 'string') result.message = response.data;
                    else if(Array.isArray(response.data)) {
                        if('message' in response.data[0]) result.message = response.data[0].message;
                    }
                }
            }
        }

    }

    if(typeof response !== 'undefined') {
        let keys = Object.keys(response);
        if(keys.indexOf('status') > -1) result.status = response.status;
        if(keys.indexOf('data') > -1) result.data = response.data;
    }

    res.json(result);

}


/* ----- GET WORKSPACE TABS ----- */
router.get('/tabs', function(req, res, next) {
    
    console.log(' ');
    console.log('  /tabs');
    console.log(' --------------------------------------------');
    console.log('  req.query.wsId = ' + req.query.wsId);

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.query.wsId + '/tabs';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- GET WORKSPACE SECTIONS ----- */
router.get('/sections', function(req, res, next) {
    
    console.log(' ');
    console.log('  /sections');
    console.log(' --------------------------------------------');
    console.log('  req.query.wsId = ' + req.query.wsId);
    console.log('  req.query.link = ' + req.query.link);
    console.log();

    let wsId = req.query.wsId;

    if(typeof wsId === 'undefined') {
        if(typeof req.query.link !== 'undefined') {
            wsId = req.query.link.split('/')[4];
        }
    }

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/sections';
    let headers = getCustomHeaders(req);
        headers.Accept = 'application/vnd.autodesk.plm.sections.bulk+json';

    axios.get(url, {
        headers : headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- GET WORKSPACE FIELDS ----- */
router.get('/fields', function(req, res, next) {

    console.log(' ');
    console.log('  /fields');
    console.log(' --------------------------------------------');
    console.log('  req.query.wsId = ' + req.query.wsId);
    console.log('  req.query.link = ' + req.query.link);

    let wsId = req.query.wsId;

    if(typeof wsId === 'undefined') {
        if(typeof req.query.link !== 'undefined') {
            wsId = req.query.link.split('/')[4];
        }
    }

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/fields';
    
    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, { 'data' : response.data.fields, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });

});


/* ----- GET PICKLIST ----- */
router.get('/picklist', function(req, res, next) {

    console.log(' ');
    console.log('  /picklist');
    console.log(' --------------------------------------------');
    console.log('  req.query.link = ' + req.query.link);
    console.log('  req.query.limit = ' + req.query.limit);
    console.log('  req.query.offset = ' + req.query.offset);
    console.log('  req.query.filter = ' + req.query.filter);
    console.log();

    let limit  = (typeof req.query.limit === 'undefined')  ? 100 : req.query.limit;
    let offset = (typeof req.query.offset === 'undefined') ?   0 : req.query.offset;
    let filter = (typeof req.query.filter === 'undefined') ?  '' : req.query.filter;

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net' + req.query.link + '?asc=title&limit=' + limit + '&offset=' + offset + '&filter=' + filter;
    
    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        if(response.data === "") response.data = { 'items' : [] };
        sendResponse(req, res, response, false);
    }).catch(function (error) {
        sendResponse(req, res, error.response, true);
    });

});


/* ----- GET FILTERED PICKLIST ----- */
router.get('/filtered-picklist', function(req, res, next) {

    console.log(' ');
    console.log('  /filtered-picklist');
    console.log(' --------------------------------------------');
    console.log('  req.query.link    = ' + req.query.link);
    console.log('  req.query.limit   = ' + req.query.limit);
    console.log('  req.query.offset  = ' + req.query.offset);
    console.log('  req.query.filters = ' + req.query.filters);
    console.log();

    let limit   = (typeof req.query.limit   === 'undefined') ? 100 : req.query.limit;
    let offset  = (typeof req.query.offset  === 'undefined') ?   0 : req.query.offset;
    let filters = (typeof req.query.filters === 'undefined') ?  [] : req.query.filters;

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net' + req.query.link + '/options?';
    
    for(let filter of filters) {
        url += filter[0];
        url += '=';
        // url += encodeURIComponent(filter[1]);
        url += filter[1].replace(/ /g, '+');
        url += '&';
    }
    
    // if(filters.length > 0) url += '&';

    url += 'limit=' + limit + '&offset=' + offset + '&filter=';
    
    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        if(response.data === "") response.data = { 'items' : [] };
        sendResponse(req, res, response, false);
    }).catch(function (error) {
        sendResponse(req, res, error.response, true);
    });

});


/* ----- RELATED WORKSPACES ----- */
router.get('/related-workspaces', function(req, res, next) {
    
    console.log(' ');
    console.log('  /related-workspaces');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId   = ' + req.query.wsId);
    console.log('  req.query.view   = ' + req.query.view);
    console.log();
    
    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.query.wsId + '/views/' + req.query.view + '/related-workspaces';
    
    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        let result = (response.data.hasOwnProperty('workspaces')) ? response.data.workspaces : [];
        sendResponse(req, res, { 'data' : result, 'status' : response.status }, false);
    }).catch(function(error) {
        console.log(error);
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- LINKED TO / MANAGING WORKSPACES ----- */
router.get('/linked-workspaces', function(req, res, next) {
    
    console.log(' ');
    console.log('  /linked-workspaces');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId   = ' + req.query.wsId);
    console.log();
    
    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.query.wsId + '/views/11/linkedto-workspaces';
    
    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        let result = (response.data.hasOwnProperty('workspaces')) ? response.data.workspaces : [];
        sendResponse(req, res, { 'data' : result, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- CREATE NEW ITEM ----- */
router.post('/create', function(req, res) {
   
    console.log(' ');
    console.log('  /create');
    console.log(' --------------------------------------------');
    console.log('  req.body.wsId       = ' + req.body.wsId);
    console.log('  req.body.sections   = ' + req.body.sections);
    console.log('  req.body.image      = ' + req.body.image);
    console.log(' ');

    let prefix   = '/api/v3/workspaces/' + req.body.wsId;
    let url      = 'https://' + req.session.tenant + '.autodeskplm360.net' + prefix + '/items';
    let sections = [];

    for(section of req.body.sections) {

        let sect = {
            'link'   : (typeof section.link === 'undefined') ? prefix + '/sections/' + section.id : section.link,
            'fields' : []
        }

        
        for(field of section.fields) {
            
            let value = field.value;
            let type  = (typeof field.type === 'undefined') ? 'string' : field.type.toLowerCase();
            
            if(type === 'integer') value = parseInt(field.value);

            sect.fields.push({
                '__self__'  : prefix + '/views/1/fields/' + field.fieldId,
                'value'     : value
            });
        }

        sections.push(sect);

        // console.log(sect);

    }
    
    axios.post(url, {
        'sections' : sections
    }, { headers : req.session.headers }).then(function (response) {
        if(typeof req.body.image !== 'undefined') {
            uploadImage(req, response.headers.location, function() {
                sendResponse(req, res, { 'data' : response.headers.location }, false);
            });
        } else {
            sendResponse(req, res, { 'data' : response.headers.location }, false);
        }
    }).catch(function (error) {
        sendResponse(req, res, error.response, true);
    });


});
function uploadImage(req, url, callback) {
    
    console.log(' ');
    console.log('  uploadImage');
    console.log(' --------------------------------------------');
    console.log('  req.body.image.fieldId  = ' + req.body.image.fieldId);
    console.log('  url                     = ' + url);
    console.log();
   
    axios.get(url, {
        headers : req.session.headers
    }).then(function (response) {

       let formData = new FormData();
       let data     = req.body.image.value.replace(/^data:image\/\w+;base64,/, '');
       let stream   = new Buffer.from(data, 'base64');
   
       formData.append(req.body.image.fieldId, stream, {
           contentType: 'application/octet-stream'
       }); 
       
       formData.append('itemDetail', JSON.stringify(response.data), {
           filename: 'blob',
           contentType: 'application/json'
       });
       
       let headers = Object.assign({
           'Authorization' : req.session.headers.Authorization
       }, formData.getHeaders());
       
       axios.put(url, formData, {
           headers : headers
       }).then(function (response) {        
           if(response.status === 204) {
               console.log('   Image upload successful');
           } else {
              console.log('   Status code : ' + response.status); 
           }
           callback();
       }).catch(function (error) {
           console.log(' #ERROR# while uploading image file');
           console.log(error);
       });
               
    }).catch(function (error) {
        console.log(' #ERROR# getting Item Details');
        console.log(error.data);    
    });
   
}


/* ----- CLONE EXISTING ITEM ----- */
router.post('/clone', function(req, res) {
   
    console.log(' ');
    console.log('  /clone');
    console.log(' --------------------------------------------');
    console.log('  req.body.link       = ' + req.body.link);
    console.log('  req.body.sections   = ' + req.body.sections);
    console.log();

    let wsId            = req.body.link.split('/')[4];
    let prefix          = '/api/v3/workspaces/' + wsId;
    let url             = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items'
    let sections        = [];
    let formData        = new FormData();
    let cloneOptions    = [ 'ITEM_DETAILS' ];
    // 'cloneOptions'      : [ 'ITEM_DETAILS', 'PART_GRID', 'PART_ATTACHMENTS' ],


    for(section of req.body.sections) {

        let sect = {
            'link'   : (typeof section.link === 'undefined') ? prefix + '/sections/' + section.id : section.link,
            'fields' : []
        }

        for(field of section.fields) {
            
            let value = field.value;
            let type  = (typeof field.type === 'undefined') ? 'string' : field.type.toLowerCase();
            
            if(type === 'integer') value = parseInt(field.value);

            sect.fields.push({
                '__self__'      : prefix + '/views/1/fields/' + field.fieldId,
                'value'         : value,
                'urn'           : 'urn:adsk.plm:tenant.workspace.view.field:' + req.session.tenant.toUpperCase() + '.' + wsId + '.1.' + field.fieldId,
                'fieldMetadata' : null,
                'dataTypeId'    : field.typeId,
                'title'         : field.title
            });

        }

        sections.push(sect);

    }

    let params = {
        'sourceItemId'  : req.body.link.split('/')[6],
        'cloneOptions'  : cloneOptions,
        'hasPivotFields': false,
        'item'          : {
            'sections'  : sections
        }
    };

    formData.append('itemDetail', JSON.stringify(params), {
        filename    : 'blob',
        contentType : 'application/json'
    });

    let headers = getCustomHeaders(req);
        headers['content-type'] = formData.getHeaders()['content-type'];
        headers.Accept = 'application/vnd.autodesk.plm.meta+json';
    
    axios.post(url, formData, { headers : headers }).then(function (response) {
        console.log(response)
        sendResponse(req, res, { 'data' : response.headers.location }, false);
    }).catch(function (error) {
        sendResponse(req, res, error.response, true);
    });


});


/* ----- ARCHIVE ITEM ----- */
router.get('/archive', function(req, res, next) {
    
    console.log(' ');
    console.log('  /archive');
    console.log(' --------------------------------------------'); 
    console.log('  req.query.wsId    = ' + req.query.wsId);
    console.log('  req.query.dmsId   = ' + req.query.dmsId);
    console.log('  req.query.link    = ' + req.query.link);
    console.log(); 
    

    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url  = 'https://' + req.session.tenant + '.autodeskplm360.net' + url;
        url += '?deleted=true';

    axios.patch(url, {}, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- UNARCHIVE ITEM ----- */
router.get('/unarchive', function(req, res, next) {
    
    console.log(' ');
    console.log('  /archive');
    console.log(' --------------------------------------------'); 
    console.log('  req.query.wsId    = ' + req.query.wsId);
    console.log('  req.query.dmsId   = ' + req.query.dmsId);
    console.log('  req.query.link    = ' + req.query.link);
    console.log(); 


    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url  = 'https://' + req.session.tenant + '.autodeskplm360.net' + url;
        url += '?deleted=false';

    axios.patch(url, {}, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- DETERMINE IF ITEM IS ARCHIVED ----- */
router.get('/is-archived', function(req, res, next) {
    
    console.log(' ');
    console.log('  /is-archived');
    console.log(' --------------------------------------------'); 
    console.log('  req.query.wsId    = ' + req.query.wsId);
    console.log('  req.query.dmsId   = ' + req.query.dmsId);
    console.log('  req.query.link    = ' + req.query.link);
    console.log(); 


    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url  = 'https://' + req.session.tenant + '.autodeskplm360.net' + url;

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, { 'data' : response.data.deleted, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- ITEM DETAILS UPDATE ----- */
router.get('/edit', function(req, res) {

    console.log(' ');
    console.log('  /edit');
    console.log(' --------------------------------------------');
    console.log('  req.query.wsId       = ' + req.query.wsId);
    console.log('  req.query.dmsId      = ' + req.query.dmsId);
    console.log('  req.query.link       = ' + req.query.link);
    console.log('  req.query.sections   = ' + req.query.sections);
    console.log();

    let prefix   = (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
    let url      = 'https://' + req.session.tenant + '.autodeskplm360.net' + prefix;
    let sections = [];
    let wsId     = req.query.wsId;
    let dmsId    = req.query.dmsId;

    if (typeof req.query.link !== 'undefined') {
        wsId  = req.query.link.split('/')[4];
        dmsId = req.query.link.split('/')[6];
    }

    for(let section of req.query.sections) {

        let sectionId =  (typeof section.link === 'undefined') ? section.id : section.link.split('/')[6];

        let sect = {
            'link'   : prefix + '/views/1/sections/' + sectionId,
            'fields' : []
        }

        for(field of section.fields) {

            let value = field.value;
            let type  = (typeof field.type === 'undefined') ? 'String' : field.type;

            type = type.toLowerCase();

            if(type === 'integer') {
                value = parseInt(field.value);
            } else if(type === 'multi-linking-picklist') {
                value = [];
                for(link of field.value) value.push({'link' : link});
            } else if(type === 'single selection') {
                value = { 'link' : value };
            } else if(type === 'picklist') {
                if(value === '') value = null;
            }

            sect.fields.push({
                '__self__'  : prefix + '/views/1/fields/' + field.fieldId,
                'urn'       : 'urn:adsk.plm:tenant.workspace.item.view.field:' + req.session.tenant.toUpperCase() + '.' + wsId + '.' + dmsId + '.1.' + field.fieldId,
                'value'     : value
            });

        }

        sections.push(sect);

    }

    axios.patch(url, {
        'sections' : sections
    }, { headers : req.session.headers }).then(function (response) {
        sendResponse(req, res, response, false);
    }).catch(function (error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- ITEM DESCRIPTOR ----- */
router.get('/descriptor', function(req, res, next) {
    
    console.log(' ');
    console.log('  /descriptor');
    console.log(' --------------------------------------------');
    console.log('  req.query.wsId   = ' + req.query.wsId);
    console.log('  req.query.dmsId  = ' + req.query.dmsId);
    console.log('  req.query.link   = ' + req.query.link);
    console.log(' ');
        
    let url = (typeof req.query.link !== 'undefined') ? req.query.link : 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
    
    if(url.indexOf('/api/v3') === 0) url = 'https://' + req.session.tenant + '.autodeskplm360.net' + url;

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, { 'data' : response.data.title, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- ITEM CHANGE SUMMARY ----- */
router.get('/change-summary', function(req, res, next) {
    
    console.log(' ');
    console.log('  /change-summary');
    console.log(' --------------------------------------------');
    console.log('  req.query.wsId   = ' + req.query.wsId);
    console.log('  req.query.dmsId  = ' + req.query.dmsId);
    console.log('  req.query.link   = ' + req.query.link);
    console.log(' ');
        
    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url = 'https://' + req.session.tenant + '.autodeskplm360.net' + url + '/audit';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- ITEM DETAILS ----- */
router.get('/details', function(req, res, next) {
    
    console.log(' ');
    console.log('  /details');
    console.log(' --------------------------------------------');
    console.log('  req.query.wsId  = ' + req.query.wsId);
    console.log('  req.query.dmsId = ' + req.query.dmsId);
    console.log('  req.query.link  = ' + req.query.link);
    console.log();

    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url = 'https://' + req.session.tenant + '.autodeskplm360.net' + url;

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- DERIVED FIELD VALUES ----- */
router.get('/derived', function(req, res, next) {
    
    console.log(' ');
    console.log('  /derived');
    console.log(' --------------------------------------------');
    console.log('  req.query.pivotItemId    = ' + req.query.pivotItemId);
    console.log('  req.query.wsId           = ' + req.query.wsId);
    console.log('  req.query.fieldId        = ' + req.query.fieldId);
    console.log();

    let  url = 'https://' + req.session.tenant + '.autodeskplm360.net'
        + '/api/v3/workspaces/' + req.query.wsId + '/views/1/pivots/' + req.query.fieldId
        + '?pivotItemId=' + req.query.pivotItemId;

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- GET ITEM IMAGE ----- */
router.get('/image', function(req, res) {
   
    console.log(' ');
    console.log('  /image');
    console.log(' --------------------------------------------');
    console.log('  req.query.wsId    = ' + req.query.wsId);
    console.log('  req.query.dmsId   = ' + req.query.dmsId);
    console.log('  req.query.fieldId = ' + req.query.fieldId);
    console.log('  req.query.imageId = ' + req.query.imageId);
    console.log('  req.query.link    = ' + req.query.link);
    console.log();
   
    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v2/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId + '/field-values/' + req.query.fieldId + '/image/' + req.query.imageId;
        url = 'https://' + req.session.tenant + '.autodeskplm360.net' + url;

    axios.get(url, { 
        responseType     : 'arraybuffer',
        responseEncoding : 'binary',
        headers : {
            'Authorization' : req.session.headers['Authorization'],
            'Accept'        : 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
        }
    }).then(function (response) {
        sendResponse(req, res, { 'data' : response.data.toString('base64'), 'status' : response.status }, false);
    }).catch(function (error) {
        sendResponse(req, res, error.response, true);   
    });
   
});


/* ----- GET ITEM IMAGE USING CACHE ----- */
router.get('/image-cache', function(req, res) {
   
    console.log(' ');
    console.log('  /image-cache');
    console.log(' --------------------------------------------');
    console.log('  req.query.wsId    = ' + req.query.wsId);
    console.log('  req.query.dmsId   = ' + req.query.dmsId);
    console.log('  req.query.fieldId = ' + req.query.fieldId);
    console.log('  req.query.imageId = ' + req.query.imageId);
    console.log('  req.query.link    = ' + req.query.link);
    console.log();
   
    let wsId     = (typeof req.query.wsId    !== 'undefined') ? req.query.wsId    : req.query.link.split('/')[4];
    let dmsId    = (typeof req.query.dmsId   !== 'undefined') ? req.query.dmsId   : req.query.link.split('/')[6];
    let fieldId  = (typeof req.query.fieldId !== 'undefined') ? req.query.fieldId : req.query.link.split('/')[8];
    let imageId  = (typeof req.query.imageId !== 'undefined') ? req.query.imageId : req.query.link.split('/')[10];
    let link     = (typeof req.query.link    !== 'undefined') ? req.query.link    : '/api/v2/workspaces/' + wsId + '/items/' + dmsId + '/field-values/' + fieldId + '/image/' + imageId;

    let url      = 'https://' + req.session.tenant + '.autodeskplm360.net' + link;
    let fileName = wsId + '-' + dmsId + '-' + fieldId + '-' + imageId + '.jpg';

    fs.stat('public/cache/' + fileName, function(err, stat) {
    
        if(err === null) {
            
            sendResponse(req, res, { 'data' : { 'url' : 'cache/' + fileName } }, false);

        } else if(err.code == 'ENOENT') {

            axios.get(url, { 
                responseType     : 'arraybuffer',
                responseEncoding : 'binary',
                headers : {
                    'Authorization' : req.session.headers['Authorization'],
                    'Accept'        : 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
                }
            }).then(function (response) {
                fs.appendFileSync('public/cache/' + fileName, response.data);
                sendResponse(req, res, { 'data' : { 'url' : 'cache/' + fileName }  }, false);
            }).catch(function (error) {
                sendResponse(req, res, error.response, true);   
            });

        } else {
            console.log('Some other error: ', err.code);
            sendResponse(req, res, 'Undefined error', true);  
        }

    });
   
});


/* ----- UPLOAD ITEM IMAGE ----- */
router.post('/upload-image', function(req, res) {
   
    console.log(' ');
    console.log('  /upload-image');
    console.log(' --------------------------------------------');
    console.log('  req.body.link            = ' + req.body.link);
    console.log('  req.body.image.fieldId   = ' + req.body.image.fieldId);
    console.log(' ');

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net' + req.body.link;

    uploadImage(req, url, function() {
        sendResponse(req, res, { 'data' : 'success' }, false);
    });

});


/* ----- GET GRID DATA ----- */
router.get('/grid', function(req, res, next) {
    
    console.log(' ');
    console.log('  /grid');
    console.log(' --------------------------------------------'); 
    console.log('  req.query.wsId    = ' + req.query.wsId);
    console.log('  req.query.dmsId   = ' + req.query.dmsId);
    console.log('  req.query.link    = ' + req.query.link);
    console.log(); 
    

    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url  = 'https://' + req.session.tenant + '.autodeskplm360.net' + url;
        url += '/views/13/rows';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        let result = (response.data === '') ? [] : response.data.rows;
        sendResponse(req, res, { 'data' : result, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- ADD GRID ROW ----- */
router.get('/add-grid-row', function(req, res, next) {
    
    console.log(' ');
    console.log('  /add-grid-row');
    console.log(' --------------------------------------------'); 
    console.log('  req.query.wsId    = ' + req.query.wsId);
    console.log('  req.query.dmsId   = ' + req.query.dmsId);
    console.log('  req.query.link    = ' + req.query.link);
    console.log('  req.query.data    = ' + req.query.data);
    console.log(); 
    
    let wsId = (typeof req.query.wsId !== 'undefined') ? req.query.wsId : req.query.link.split('/')[4];

    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url  = 'https://' + req.session.tenant + '.autodeskplm360.net' + url;
        url += '/views/13/rows';

    let rowData = [];

    for(let field of req.query.data) {
        rowData.push({
            '__self__' : '/api/v3/workspaces/' + wsId + '/views/13/fields/' + field.fieldId,
            'value' : field.value
        });
    }

    axios.post(url, {
        'rowData' : rowData
    }, {
        headers : req.session.headers
    }).then(function(response) {
        let result = (response.data === '') ? [] : response.data.rows;
        sendResponse(req, res, { 'data' : result, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- ADD GRID ROWS ----- */
// router.get('/add-grid-rows', function(req, res, next) {
    
//     console.log(' ');
//     console.log('  /add-grid-row');
//     console.log(' --------------------------------------------'); 
//     console.log('  req.query.wsId    = ' + req.query.wsId);
//     console.log('  req.query.dmsId   = ' + req.query.dmsId);
//     console.log('  req.query.link    = ' + req.query.link);
//     console.log('  req.query.data    = ' + req.query.data);
//     console.log(); 
    

//     let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
//         url  = 'https://' + req.session.tenant + '.autodeskplm360.net' + url;
//         url += '/views/13/rows';

//     let rowData = [];

//     for(field of req.query.data) {

//         rowData.push({
//             '__self__' : '/api/v3/workspaces/' + req.query.wsId + '/views/13/fields/' + field.fieldId,
//             'value' : field.value
//         });

//     }


//     console.log(rowData);


//     let rows = [];

//     let headers = getCustomHeaders(req);
//         headers['Accept'] = 'application/vnd.autodesk.plm.grid.rows.bulk+json';


//     axios.post(url, rows, {
//         headers : headers
//     }).then(function(response) {
//         let result = (response.data === '') ? [] : response.data.rows;
//         sendResponse(req, res, { 'data' : result, 'status' : response.status }, false);
//     }).catch(function(error) {
//         sendResponse(req, res, error.response, true);
//     });
    
// });


/* ----- UPDATE GRID ROW ----- */
router.get('/update-grid-row', function(req, res, next) {
    
    console.log(' ');
    console.log('  /update-grid-row');
    console.log(' --------------------------------------------'); 
    console.log('  req.query.wsId    = ' + req.query.wsId);
    console.log('  req.query.dmsId   = ' + req.query.dmsId);
    console.log('  req.query.link    = ' + req.query.link);
    console.log('  req.query.rowId   = ' + req.query.rowId);
    console.log('  req.query.data    = ' + req.query.data);
    console.log(); 
    
    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url  = 'https://' + req.session.tenant + '.autodeskplm360.net' + url;
        url += '/views/13/rows/' + req.query.rowId;

    let rowData = [];

    for(let field of req.query.data) {

        rowData.push({
            '__self__' : '/api/v3/workspaces/' + req.query.wsId + '/views/13/fields/' + field.fieldId,
            'value' : field.value
        });

    }

    axios.put(url, {
        'rowData' : rowData
    }, {
        headers : req.session.headers
    }).then(function(response) {
        let result = (response.data === '') ? [] : response.data.rows;
        sendResponse(req, res, { 'data' : result, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- REMOVE GRID ROW ----- */
router.get('/remove-grid-row', function(req, res, next) {
    
    console.log(' ');
    console.log('  /remove-grid-row');
    console.log(' --------------------------------------------'); 
    console.log('  req.query.link    = ' + req.query.link);
    console.log(); 

    let url  = 'https://' + req.session.tenant + '.autodeskplm360.net' + req.query.link;
    
    axios.delete(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- GET ALL GRID COLUMNS ----- */
router.get('/grid-columns', function(req, res, next) {
    
    console.log(' ');
    console.log('  /grid-columns');
    console.log(' --------------------------------------------'); 
    console.log('  req.query.wsId    = ' + req.query.wsId);
    console.log(); 
    
    let url  = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.query.wsId + '/views/13/fields';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- RELATIONSHIPS ----- */
router.get('/relationships', function(req, res, next) {
    
    console.log(' ');
    console.log('  /relationships');
    console.log(' --------------------------------------------'); 
    console.log('  req.query.wsId    = ' + req.query.wsId);
    console.log('  req.query.dmsId   = ' + req.query.dmsId);
    console.log('  req.query.link    = ' + req.query.link);
    console.log(); 
    
    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url  = 'https://' + req.session.tenant + '.autodeskplm360.net' + url;
        url += '/views/10';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- ADD RELATIONSHIP ----- */
router.get('/add-relationship', function(req, res, next) {
    
    console.log(' ');
    console.log('  /add-relationship');
    console.log(' --------------------------------------------'); 
    console.log('  req.query.wsId        = ' + req.query.wsId);
    console.log('  req.query.dmsId       = ' + req.query.dmsId);
    console.log('  req.query.link        = ' + req.query.link);
    console.log('  req.query.relatedId   = ' + req.query.relatedId);
    console.log('  req.query.description = ' + req.query.description);
    console.log('  req.query.type        = ' + req.query.type);
    console.log(); 
    
    let urlBase     = (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
    let url         = 'https://' + req.session.tenant + '.autodeskplm360.net' + urlBase + '/views/10';
    let description = (typeof req.query.description !== 'undefined') ? req.query.description : '';
    let type        = (typeof req.query.type !== 'undefined') ? req.query.type.toLowerCase() : 'bi';
    let direction   = (type === 'bi') ? 'Bi-Directional' : 'Uni-Directional';

    let headers = getCustomHeaders(req);
        headers['content-location'] = urlBase + '/views/10/linkable-items/' + req.query.relatedId;
    
    let params = {
        'description' : description,
        'direction' : {
            'type' : direction
        }
    };

    axios.post(url, params, {
        headers : headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- UPDATE RELATIONSHIP ----- */
router.get('/update-relationship', function(req, res, next) {
    
    console.log(' ');
    console.log('  /update-relationship');
    console.log(' --------------------------------------------'); 
    console.log('  req.query.link        = ' + req.query.link);
    console.log('  req.query.description = ' + req.query.description);
    console.log(); 

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net' + req.query.link;
    
    axios.put(url, {
        'description' : req.query.description
    },{
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- REMOVE RELATIONSHIP ----- */
router.get('/remove-relationship', function(req, res, next) {
    
    console.log(' ');
    console.log('  /remove-relationship');
    console.log(' --------------------------------------------'); 
    console.log('  req.query.link        = ' + req.query.link);
    console.log(); 

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net' + req.query.link;
    
    axios.delete(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- AFFECTED ITEMS ----- */
router.get('/manages', function(req, res, next) {
    
    console.log(' ');
    console.log('  /manages');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId   = ' + req.query.wsId);
    console.log('  req.query.dsmId  = ' + req.query.dsmId);
    console.log('  req.query.link   = ' + req.query.link);
    

    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url = 'https://' + req.session.tenant + '.autodeskplm360.net' + url + '/views/11';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        let result = (response.data === '') ? [] : response.data.affectedItems;
        sendResponse(req, res, { 'data' : result, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- COLUMNS OF MANAGED ITEMS TAB ----- */
router.get('/managed-fields', function(req, res, next) {
    
    console.log(' ');
    console.log('  /managed-fields');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId  = ' + req.query.wsId);
    console.log();

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.query.wsId + '/views/11/fields';
    
    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        let result = (response.data === '') ? [] : response.data.fields;
        sendResponse(req, res, { 'data' : result, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- ADD MANAGED ITEMS ----- */
router.get('/add-managed-items', function(req, res, next) {

    console.log(' ');
    console.log('  /add-managed-items');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId   = ' + req.query.wsId);
    console.log('  req.query.dmsId  = ' + req.query.dmsId);
    console.log('  req.query.link   = ' + req.query.link);
    console.log('  req.query.items  = ' + req.query.items);

    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url = 'https://' + req.session.tenant + '.autodeskplm360.net' + url + '/affected-items';

    let custHeaders = getCustomHeaders(req);
        custHeaders.Accept = 'application/vnd.autodesk.plm.affected.items.bulk+json';

    axios.post(url, req.query.items, {
        headers : custHeaders
    }).then(function(response) {

        let error = false;

        if(typeof response.data !== undefined) {
            if(typeof response.message === 'undefined') response.message = [];
            if(response.data !== '') {
                for(entry of response.data) {
                    if(entry.result === 'FAILED') {
                        error = true;
                        response.message.push(entry.errorMessage);
                    }
                }
            }
        }

        sendResponse(req, res, response, error);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- UPDATE MANAGED ITEM COLUMNS ----- */
router.get('/update-managed-item', function(req, res, next) {
    
    console.log(' ');
    console.log('  /update-managed-item');
    console.log(' --------------------------------------------');  
    console.log('  req.query.link       = ' + req.query.link);
    console.log('  req.query.fields     = ' + req.query.fields);
    console.log('  req.query.transition = ' + req.query.transition);

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net' + req.query.link;
    
    let params = {
        'linkedFields' : req.query.fields
    }

    if(typeof req.query.transition !== undefined) {
        if(req.query.transition !== '') {
            params.targetTransition = { 'link' : req.query.transition }
        }
    }

    axios.put(url, params,{
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- REMOVE MANAGED ITEM ----- */
router.get('/remove-managed-item', function(req, res, next) {

    console.log(' ');
    console.log('  /remove-managed-items');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId   = ' + req.query.wsId);
    console.log('  req.query.dmsId  = ' + req.query.dmsId);
    console.log('  req.query.link   = ' + req.query.link);
    console.log('  req.query.itemId = ' + req.query.itemId);

    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url = 'https://' + req.session.tenant + '.autodeskplm360.net' + url + '/views/11/affected-items/' + req.query.itemId;

    axios.delete(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, error);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- RELATED CHANGES ----- */
router.get('/changes', function(req, res, next) {
    
    console.log(' ');
    console.log('  /changes');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId  = ' + req.query.wsId);
    console.log('  req.query.dmsId = ' + req.query.dmsId);
    console.log('  req.query.link  = ' + req.query.link);
    console.log();
    
    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
    url = 'https://' + req.session.tenant + '.autodeskplm360.net' + url + '/views/2';
    
    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        if(response.data === '') response.data = [];
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- ATTACHMENTS ----- */
router.get('/attachments', function(req, res, next) {
    
    console.log(' ');
    console.log('  /attachments');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId  = ' + req.query.wsId);
    console.log('  req.query.dmsId = ' + req.query.dmsId);
    console.log('  req.query.link  = ' + req.query.link);

    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url = 'https://' + req.session.tenant + '.autodeskplm360.net' + url + '/attachments?asc=name';
    
    let headers = getCustomHeaders(req);
        headers.Accept = 'application/vnd.autodesk.plm.attachments.bulk+json';

    axios.get(url, {
        headers : headers
    }).then(function(response) {
        let result = (response.data === '') ? [] : response.data.attachments;
        sendResponse(req, res, { 'data' : result, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- ATTACHMENT DOWNLOAD ----- */
router.get('/download', function(req, res, next) {
   
    console.log(' ');
    console.log('  /download');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId       = ' + req.query.wsId);
    console.log('  req.query.dmsId      = ' + req.query.dmsId);
    console.log('  req.query.link       = ' + req.query.link);
    console.log('  req.query.fileLink   = ' + req.query.fileLink);
    console.log('  req.query.fileId     = ' + req.query.fileId);

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net';

    if(typeof req.query.fileLink !== 'undefined') {
        url += req.query.fileLink;
    } else {
        let link = (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
            link += '/attachments/' + req.query.fileId;
        url += link;
    }

   axios.get(url, {
        headers : req.session.headers 
    }).then(function (response) {
        sendResponse(req, res, response, false);
    }).catch(function (error) {
        sendResponse(req, res, error.response, true);
    });

});


/* ----- ATTACHMENT UPLOAD ----- */
router.post('/upload/:wsId/:dmsId', function(req, res) {
   
    console.log(' ');
    console.log('  /upload');
    console.log(' --------------------------------------------');  
    console.log('  req.params.wsId       = ' + req.params.wsId);
    console.log('  req.params.dmsId      = ' + req.params.dmsId);
    console.log('  req.params.folderName = ' + req.params.folderName);
    console.log();

    if (!req.files)
        sendResponse(req, res, { 'data' : [], 'status' : 400 }, false);
    //    return res.status(400).send('No files were uploaded.');

    let files = [];
    let folderName = (typeof req.params.folderName === 'undefined') ? '' : req.params.folderName;

    if(Array.isArray(req.files.newFiles)) {
        files = req.files.newFiles;
    } else files.push(req.files.newFiles);
  
    let promises = [];

    for(let file of files) {
        promises.push(file.mv(pathUploads + file.name));
    }

    Promise.all(promises).then(function() {

        console.log('   > Moved files to folder uploads');
           
        getAttachments(req, function(attachmentsList) {
            processFiles(req, res, attachmentsList, folderName, files);
        });
       
    });
   
});
function processFiles(req, res, attachmentsList, folderName, files) {
    
    if(files.length === 0) {
        sendResponse(req, res, { 'data' : 'success' }, false);
    } else {
        parseAttachments(req, pathUploads + files[0].name, files[0].name, attachmentsList, folderName, function() {
            fs.unlinkSync(pathUploads + files[0].name);
            files.splice(0, 1);
            processFiles(req, res, attachmentsList, folderName, files);
        });
    }

}
function getAttachments(req, callback) {
   
    console.log('   > Getting list of existing attachments');

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.params.wsId + '/items/' + req.params.dmsId + '/attachments?asc=name';
   
    let headers = getCustomHeaders(req);
        headers['Accept'] = 'application/vnd.autodesk.plm.attachments.bulk+json';
   
    axios.get(url, {
        headers : headers
    }).then(function (response) {
        callback(response.data);
    }).catch(function (error) {
        console.log(' > ERROR');
        console.log(error.message);
    });  
   
}
function parseAttachments(req, path, fileName, attachmentsList, folderName, callback) {
   
    console.log('   > Checking list of attachments');
   
    let folderId    = '';
    let fileId      = '';

    if(attachmentsList !== '') {
        if(typeof attachmentsList !== 'undefined') {
        
            let attachments = attachmentsList.attachments;
            
            for(attachment of attachments) {
                if(attachment.name === fileName) {
                    fileId = attachment.id;
                } 
                if(attachment.folder !== null) {
                    if(attachment.folder.name === folderName) {
                        folderId = { id : attachment.folder.id };
                    }
                }
            }
        
        }
    }

    if(fileId !== '') {
        createVersion(req, folderId, fileId, path, fileName, function() {
            callback();
        });
    } else if(folderName === '') {
        createFile(req, null, path, fileName, function() {
            callback();
        });
    } else if(folderId === '') {
        createFolder(req, folderName, function(data) {
            createFile(req, {'id':data}, path, fileName, function() {
                callback();
            });
        });
    } else {
        createFile(req, folderId, path, fileName, function() {
            callback();
        });
    }
   
}
function createFolder(req, folderName, callback) {
   
   console.log('   > Creating folder ' + folderName);
       
   let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.params.wsId + '/items/' + req.params.dmsId + '/folders';
   
   axios.post(url, {
       'folderName' : folderName 
   },{
       headers : req.session.headers
   }).then(function (response) {
       
       let location    = response.headers.location;
       let temp        = location.split('/');
       let folderId    = temp[temp.length - 1];
       
       callback(folderId);
   }).catch(function (error) {
       console.log(error.message);
   }); 
   
}
function createFile(req, folderId, path, fileName, callback) {
   
    console.log('   > Creating file record');

    let stats = fs.statSync(path);
    let url   = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.params.wsId + '/items/' + req.params.dmsId + '/attachments';
   
    
    req.session.headers.Accept = 'application/json';
    
    if(folderId === '') folderId = null;
    
    console.log('     url       = ' + url);
    console.log('     fileName  = ' + fileName);
    console.log('     folderId  = ' + folderId);
    console.log('     size      = ' + stats.size);
   
    axios.post(url, {
        'description'   : fileName,
        'name'          : fileName,
        'resourceName'  : fileName,
        'folder'        : folderId,
        'size'          : stats.size
    },{
       headers : req.session.headers
    }).then(function (response) {
        prepareUpload(req, response.data, function() {
            uploadFile(req, path, response.data, function(fileId) {
                setStatus(req, fileId, function() {
                    callback();
                });
            });          
        });
    }).catch(function (error) {
        console.log(error.message);
    }); 
   
}
function createVersion(req, folderId, fileId, path, fileName, callback) {
   
   console.log('   > Creating new version as file exists already');
   
   let stats   = fs.statSync(path);
   let url     = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.params.wsId + '/items/' + req.params.dmsId + '/attachments/' + fileId;
   
   if(folderId === '') folderId = null;
   
   axios.post(url, {
       'description'   : fileName,
       'fileName'      : fileName,
       'name'          : fileName,
       'resourceName'  : fileName,
       'folder'        : folderId,
       'fileTypeString': 'file/type',
       'size'          : stats['size']
   },{
       headers : req.session.headers
   }).then(function (response) {
       prepareUpload(req, response.data, function() {
           uploadFile(req, path, response.data, function(fileId) {
               setStatus(req, fileId, function() {
                   callback();
               });
           });
       });
   }).catch(function (error) {
       console.log(error.message);
   });    
   
}
function prepareUpload(req, fileData, callback) {
   
   console.log('   > Preparing file upload to S3');

   axios({
       method  : 'options',
       url     :  fileData.url, 
       headers : {
           'Accept'            : '*/*',
           'Accept-Encoding'   : 'gzip, deflate, br',
           'Accept-Language'   : 'en-US,en;q=0.9,de;q=0.8,en-GB;q=0.7',
           'Access-Control-Request-Headers': 'content-type,x-amz-meta-filename',
           'Access-Control-Request-Method' : 'PUT',
           'Host'              : 'plm360-aws-useast.s3.amazonaws.com',
           'Origin'            : 'https://' + req.session.tenant + '.autodeskplm360.net',
           'Sec-Fetch-Mode'    : 'cors',
           'Sec-Fetch-Site'    : 'cross-site'
       }
   }).then(function (response) {
       callback();
   }).catch(function (error) {
       console.log(error.message);
   }); 
   
}
function uploadFile(req, path, fileData, callback) {
   
    console.log('   > Uploading file now');

    let headers = fileData.extraHeaders;
        
    headers['Accept']           = '*/*',
    headers['Accept-Encoding']  = 'gzip, deflate, br',
    headers['Accept-Language']  = 'en-US,en;q=0.9,de;q=0.8,en-GB;q=0.7',
    headers['Host']             = 'plm360-aws-useast.s3.amazonaws.com',
    headers['Origin']           = 'https://' + req.session.tenant + '.autodeskplm360.net',
    headers['Sec-Fetch-Mode']   = 'cors',
    headers['Sec-Fetch-Site']   = 'cross-site';

    axios.put(fileData.url, fs.readFileSync(path), {
       headers : headers
    }).then(function (response) {
       callback(fileData.id);
    }).catch(function (error) {
       console.log(error.message);
    }); 
   
}
function setStatus(req, fileId, callback) {
   
    console.log('   > Setting Status in PLM');
   
    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.params.wsId + '/items/' + req.params.dmsId + '/attachments/' + fileId;
   
    axios.patch(url, {
       status : {
           'name' : 'CheckIn'
       }
    },{
       headers : req.session.headers
    }).then(function (response) {
       callback();
    }).catch(function (error) {
        console.log(error.message);
    }); 
   
}


/* ----- LIST ALL VIEWABLE ATTACHMENTS ----- */
// removed in jan 2023, use get viewables instead
// router.get('/list-viewables', function(req, res, next) {

//     console.log(' ');
//     console.log('  /list-viewables');
//     console.log(' --------------------------------------------');  
//     console.log('  req.query.wsId  = ' + req.query.wsId);
//     console.log('  req.query.dmsId = ' + req.query.dmsId);
//     console.log('  req.query.link  = ' + req.query.link);
//     console.log();

//     let url  = 'https://' + req.session.tenant + '.autodeskplm360.net';
//         url += (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
//         url += '/attachments?asc=name';
 
//     let headers = getCustomHeaders(req);
//         headers.Accept = 'application/vnd.autodesk.plm.attachments.bulk+json';
    
//     axios.get(url, {
//         headers : headers
//     }).then(function(response) {
//         let result = [];
//         if(response.data !== '') {
//             for(attachment of response.data.attachments) {
//                 if(attachment.type.extension !== null) {
//                     if(attachment.type.extension.endsWith('dwf') || attachment.type.extension.endsWith('dwfx')) {
//                         result.push(attachment);
//                     }
//                 }
//             }
//         }
//         sendResponse(req, res, { 'data' : result, 'status' : response.status }, false);
//     }).catch(function(error) {
//         sendResponse(req, res, error.response, true);
//     });
    
// });


/* ----- INIT VIEWER FOR DEFINED ATTACHMENT ----- */
router.get('/get-viewable', function(req, res, next) {
    
    console.log(' ');
    console.log('  /get-viewable');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId           = ' + req.query.wsId);
    console.log('  req.query.dmsId          = ' + req.query.dmsId);
    console.log('  req.query.attachmentId   = ' + req.query.attachmentId);
    console.log('  req.query.link           = ' + req.query.link);
    console.log();

    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url = 'https://' + req.session.tenant + '.autodeskplm360.net' + url;

    if(url.indexOf('/attachments/') === -1) url += '/attachments/' + req.query.attachmentId;

    let headers = getCustomHeaders(req);
        headers.Accept = 'application/vnd.autodesk.plm.attachment.viewable+json';
    
    getViewerData(req, res, url, headers, false);

});
function getViewerData(req, res, url, headers, enforce) {

    let suffix = '';

    if(enforce) suffix = '?force=true';

    axios.get(url + suffix, {
        headers : headers
    }).then(function(response) {

        if(response.data.status === 'FAILED') {
            console.log('  Conversion of viewable failed, enforcing update with next request');
            getViewerData(req, res, url, headers, true);
        } else if(response.data.status === 'DONE') {
            sendResponse(req, res, {
                'data' : {
                    'urn'       : response.data.fileUrn,
                    'token'     : req.session.headers.token                
                }
            }, false);
        } else {
            setTimeout(function() {
                console.log('  Conversion of viewable pending - waiting for 2 seconds');
                getViewerData(req, res, url, headers, false);
            }, 2000);
        }

    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
}


/* ----- GET ALL VIEWABLES  TO INIT FORGE VIEWER ----- */
router.get('/get-viewables', function(req, res, next) {
    
    // same as list viewables, but also includes request to translate viewable if needed

    console.log(' ');
    console.log('  /get-viewables');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId           = ' + req.query.wsId);
    console.log('  req.query.dmsId          = ' + req.query.dmsId);
    console.log('  req.query.link           = ' + req.query.link);
    console.log('  req.query.fileId         = ' + req.query.fileId);
    console.log('  req.query.filename       = ' + req.query.filename);
    console.log('  req.query.extensionsIn   = ' + req.query.extensionsIn);
    console.log('  req.query.extensionsEx   = ' + req.query.extensionsEx);
    
    let link         = (typeof req.query.link === 'undefined') ? '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId : req.query.link;
    let url          = 'https://' + req.session.tenant + '.autodeskplm360.net' + link + '/attachments?asc=name';
    let fileId       = (typeof req.query.fileId       === 'undefined') ? '' : req.query.fileId;
    let filename     = (typeof req.query.filename     === 'undefined') ? '' : req.query.filename;
    let extensionsIn = (typeof req.query.extensionsIn === 'undefined') ? ['dwf', 'dwfx', 'ipt', 'stp', 'step', 'sldprt', 'nwd', 'rvt'] : req.query.extensionsIn;
    let extensionsEx = (typeof req.query.extensionsEx === 'undefined') ? [] : req.query.extensionsEx;

    let headers = getCustomHeaders(req);
        headers.Accept = 'application/vnd.autodesk.plm.attachments.bulk+json';

    axios.get(url, {
        headers : headers
    }).then(function(response) {

        let viewables = [];

        if(response.data !== '') {

            for(let i = 0; i < response.data.attachments.length; i++) {

                let attachment = response.data.attachments[i];

                if(attachment.type.extension !== null) {

                    let include     = false;
                    let extension   = attachment.type.extension.toLowerCase().split('.').pop();

                    if(fileId === '' || fileId === attachment.id) {
                        if(filename === '' || filename === attachment.resourceName) {
                            if(extensionsIn.length === 0 || extensionsIn.includes(extension)) {
                                if(extensionsEx.length === 0 || !extensionsEx.includes(extension)) {
                                    include = true;
                                }
                            }
                        }
                    }

                    if(include) {
                        viewables.push({
                            'id'            : attachment.id,
                            'description'   : attachment.description,
                            'version'       : attachment.version,
                            'name'          : attachment.resourceName,
                            'user'          : attachment.created.user.title,
                            'type'          : attachment.type.fileType,
                            'extension'     : attachment.type.extension,
                            'status'        : '',
                            'fileUrn'       : '',
                            'thumbnail'     : attachment.thumbnails.large,
                            'token'         : req.session.headers.token
                        });
                    }
                }

            }

            headers.Accept = 'application/vnd.autodesk.plm.attachment.viewable+json';
            getViewables(req, res, headers, link, viewables, 1);

        } else {
            sendResponse(req, res, { 'data' : [] , 'status' : response.status }, false);
        }

    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});
function getViewables(req, res, headers, link, viewables, attempt) {

    let requests = [];

    for(let viewable of viewables) {

        if(viewable.status !== 'DONE') {
            let url = 'https://' + req.session.tenant  + '.autodeskplm360.net' + link + '/attachments/' + viewable.id;
            if(viewable.status === 'FAILED') url += '?force=true';
            requests.push(runPromised(url, headers));
        }
    }

    Promise.all(requests).then(function(responses) {

        let success = true;

        for(let viewable of viewables) {

            for(let response of responses) {

                if((viewable.name === response.fileName) || ((viewable.name + viewable.extension) === response.fileName)) {
                    if(response.status !== 'DONE') {
                        success = false;
                        break
                    }
                    viewable.status = response.status;
                    viewable.urn = response.fileUrn;
                }
            }
        }

        if(success) {
            sendResponse(req, res, { 'data' : viewables }, false);
        } else if(attempt > 2) {
            for(let index = viewables.length - 1; index >= 0; index--) {
                if(viewables[index].status !== 'DONE') {
                    viewables.splice(index, 1);
                }
            }
            if(viewables.length > 0) sendResponse(req, res, { 'data' : viewables }, false);
            else  sendResponse(req, res, {}, true);
        } else {
            setTimeout(function() {
                getViewables(req, res, headers, link, viewables, ++attempt);
            }, 2000);
        }
    }).catch(function(error) {
        sendResponse(req, res, error.response, true,);
    });

}


/* ----- BOM VIEWS LIST ----- */
router.get('/bom-views', function(req, res, next) {
        
    console.log(' ');
    console.log('  /bom-views');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId   = ' + req.query.wsId);
    console.log('  req.query.link   = ' + req.query.link);
    console.log();
    
    let wsId = (typeof req.query.link !== 'undefined') ? req.query.link.split('/')[4] : req.query.wsId;
    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/views/5';
    
    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, { 'data' : response.data.bomViews, 'status' : response.status }, false, 'bom-views');
    }).catch(function(error) {
        sendResponse(req, res, error.response, true, 'bom-views');
    });
    
});


/* ----- BOM VIEWS DETAILS ----- */
router.get('/bom-views-and-fields', function(req, res, next) {
        
    console.log(' ');
    console.log('  /bom-views-and-fields');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId   = ' + req.query.wsId);
    console.log('  req.query.link   = ' + req.query.link);
    
    let wsId = (typeof req.query.link !== 'undefined') ? req.query.link.split('/')[4] : req.query.wsId;
    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/views/5';
    
    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {

        let requestsBasics  = [];
        let requestsFields  = [];

        for(bomView of response.data.bomViews) {
            requestsBasics.push(runPromised('https://' + req.session.tenant + '.autodeskplm360.net' + bomView.link, req.session.headers));
            requestsFields.push(runPromised('https://' + req.session.tenant + '.autodeskplm360.net' + bomView.link + '/fields', req.session.headers));
        }

        Promise.all(requestsBasics).then(function(responses) {

            let result = responses;
            let index = 0;

            Promise.all(requestsFields).then(function(responses) {

                for(entry of result) {
                    entry.fields = responses[index++];
                }

                sortArray(result, 'name', 'string');
                sendResponse(req, res, { 'data' : result }, false);


            }).catch(function(error) {
                sendResponse(req, res, error.response, true);
            });

        }).catch(function(error) {
            sendResponse(req, res, error.response, true);
        });

    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- BOM VIEW COLUMNS ----- */
router.get('/bom-view-fields', function(req, res, next) {
        
    console.log(' ');
    console.log('  /bom-view-fields');
    console.log(' --------------------------------------------');  
    console.log('  req.query.link   = ' + req.query.link);
    console.log('  req.query.wsId   = ' + req.query.wsId);
    console.log('  req.query.viewId = ' + req.query.viewId);
   
    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/views/5/viewdef/' + req.query.viewId;
        url = 'https://' + req.session.tenant + '.autodeskplm360.net' + url + '/fields';
    
    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- BOM DATA ----- */
router.get('/bom', function(req, res, next) {
        
    console.log(' ');
    console.log('  /bom');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId           = ' + req.query.wsId);
    console.log('  req.query.dmsId          = ' + req.query.dmsId);
    console.log('  req.query.link           = ' + req.query.link);
    console.log('  req.query.depth          = ' + req.query.depth);
    console.log('  req.query.revisionBias   = ' + req.query.revisionBias);
    console.log('  req.query.viewId         = ' + req.query.viewId);
    
    let revisionBias    = (typeof req.query.revisionBias !== 'undefined') ? req.query.revisionBias : 'release';
    let depth           = (typeof req.query.depth !== 'undefined') ? req.query.depth : 10;
    let link            = (typeof req.query.link  !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
    let rootId          = (typeof req.query.link  !== 'undefined') ? req.query.link.split('/')[6] : req.query.dmsId;
    let url             = 'https://' + req.session.tenant + '.autodeskplm360.net' + link + '/bom?depth=' + depth + '&revisionBias=' + revisionBias + '&rootId=' + rootId + '&viewDefId=' + req.query.viewId;
    let headers         = getCustomHeaders(req);

    headers.Accept = 'application/vnd.autodesk.plm.bom.bulk+json';

    axios.get(url, {
        headers : headers
    }).then(function(response) {
        sortArray(response.data.edges, 'itemNumber', '');
        sortArray(response.data.edges, 'depth', '');
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- FLAT BOM DATA ----- */
router.get('/bom-flat', function(req, res, next) {
        
    console.log(' ');
    console.log('  /bom-flat');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId           = ' + req.query.wsId);
    console.log('  req.query.dmsId          = ' + req.query.dmsId);
    console.log('  req.query.link           = ' + req.query.link);
    console.log('  req.query.revisionBias   = ' + req.query.revisionBias);  // release
    console.log('  req.query.viewId         = ' + req.query.viewId);
    console.log();
    
    let link    = (typeof req.query.link   !== 'undefined') ? req.query.link  : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
    let dmsId   = (typeof req.query.dmsId  !== 'undefined') ? req.query.dmsId : link.split('/')[6];
    let url     = 'https://' + req.session.tenant + '.autodeskplm360.net' + link + '/bom-items?revisionBias=' + req.query.revisionBias + '&rootId=' + dmsId + '&viewDefId=' + req.query.viewId;

    let headers = getCustomHeaders(req);
        headers['accept'] = 'application/vnd.autodesk.plm.bom.flat.bulk+json';

    axios.get(url, {
        headers : headers
    }).then(function(response) {
        let result = [];
        if(response.data !== '') result = response.data.flatItems;
        sendResponse(req, res, { 'data' : result, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    

    

});


/* ----- GET BOM ITEM / EDGE ----- */
router.get('/bom-item', function(req, res, next) {
    
    console.log(' ');
    console.log('  /bom-item');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId   = ' + req.query.wsId);
    console.log('  req.query.dmsId  = ' + req.query.dmsId);
    console.log('  req.query.edgeId = ' + req.query.edgeId);
    console.log('  req.query.link   = ' + req.query.link);
    console.log();

    let url = (typeof req.query.link !== 'undefined') ? req.query.link : 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId + '/bom-items/' + req.query.edgeId;

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- ADD BOM ITEM ----- */
router.get('/bom-add', function(req, res, next) {
    
    console.log(' ');
    console.log('  /bom-add');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsIdParent  = ' + req.query.wsIdParent);
    console.log('  req.query.wsIdChild   = ' + req.query.wsIdChild);
    console.log('  req.query.dmsIdParent = ' + req.query.dmsIdParent);
    console.log('  req.query.dmsIdChild  = ' + req.query.dmsIdChild);
    console.log('  req.query.linkParent  = ' + req.query.linkParent);
    console.log('  req.query.linkChild   = ' + req.query.linkChild);
    console.log('  req.query.quantity    = ' + req.query.quantity);
    console.log('  req.query.pinned      = ' + req.query.pinned);
    console.log('  req.query.number      = ' + req.query.number);
    console.log('  req.query.fields      = ' + req.query.fields);
    console.log();
    
    let linkParent = (typeof req.query.linkParent !== 'undefined') ? req.query.linkParent : '/api/v3/workspaces/' + req.query.wsIdParent + '/items/' + req.query.dmsIdParent;
    let linkChild  = (typeof  req.query.linkChild !== 'undefined') ? req.query.linkChild  : '/api/v3/workspaces/' + req.query.wsIdChild  + '/items/' + req.query.dmsIdChild;
    let quantity   = (typeof   req.query.quantity === 'undefined') ? 1 : req.query.quantity;
    let isPinned   = (typeof     req.query.pinned === 'undefined') ? false : req.query.pinned;
    
    let url = 'https://' + req.session.tenant + '.autodeskplm360.net' + linkParent + '/bom-items';
    
    let params = {
        'quantity'  : quantity,
        'isPinned'  : isPinned,
        'item'      : { 
            'link'  : linkChild
        }
    };

    if(typeof req.query.number !== 'undefined') params.itemNumber = req.query.number;

    if(typeof req.query.fields !== 'undefined') {

        if(req.query.fields.length > 0) {

            params.fields = [];

            for(field of req.query.fields) {

                params.fields.push({
                    'metaData' : {
                        'link' : field.link
                    },
                    'value' : field.value
                });

            }
        }

    }

    axios.post(url, params, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, { 'data' : response.headers.location, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- UPDATE BOM ITEM ----- */
router.get('/bom-update', function(req, res, next) {
    
    console.log(' ');
    console.log('  /bom-update');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsIdParent  = ' + req.query.wsIdParent);
    console.log('  req.query.wsIdChild   = ' + req.query.wsIdChild);
    console.log('  req.query.dmsIdParent = ' + req.query.dmsIdParent);
    console.log('  req.query.dmsIdChild  = ' + req.query.dmsIdChild);
    console.log('  req.query.edgeId      = ' + req.query.edgeId);
    console.log('  req.query.qty         = ' + req.query.qty);
    console.log('  req.query.pinned      = ' + req.query.pinned);
    console.log('  req.query.number      = ' + req.query.number);
    console.log('  req.query.fields      = ' + req.query.fields);
    console.log();

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.query.wsIdParent + '/items/' + req.query.dmsIdParent + '/bom-items/' + req.query.edgeId;

    let isPinned = (typeof req.query.pinned === 'undefined') ? false : req.query.pinned;

    let params = {
        'quantity'  : req.query.qty,
        'isPinned'  : isPinned,
        'item'      : { 
            'link'  : '/api/v3/workspaces/' + req.query.wsIdChild + '/items/' + req.query.dmsIdChild
        }
    };

    if(typeof req.query.number !== 'undefined') params.itemNumber = req.query.number;
    
    if(typeof req.query.fields !== 'undefined') {

        if(req.query.fields.length > 0) {

            params.fields = [];


            for(field of req.query.fields) {

                params.fields.push({
                    'metaData' : {
                        'link' : field.link
                    },
                    'value' : field.value
                });

            }
        }

    }

    axios.patch(url, params, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, { 'data' : true, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- REMOVE BOM ITEM ----- */
router.get('/bom-remove', function(req, res, next) {
    
    console.log(' ');
    console.log('  /bom-remove');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId   = ' + req.query.wsId);
    console.log('  req.query.dmsId  = ' + req.query.dmsId);
    console.log('  req.query.edgeId = ' + req.query.edgeId);
    console.log();

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId + '/bom-items/' + req.query.edgeId;

    axios.delete(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, { 'data' : true, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- STANDARD WHERE USED ----- */
router.get('/where-used', function(req, res, next) {
        
    console.log(' ');
    console.log('  /whereused');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId   = ' + req.query.wsId);
    console.log('  req.query.dmsId  = ' + req.query.dmsId);
    console.log('  req.query.link   = ' + req.query.link);
    console.log('  req.query.depth  = ' + req.query.depth);

    let depth = (typeof req.query.depth !== 'undefined') ? req.query.depth : 10;
    
    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url = 'https://' + req.session.tenant + '.autodeskplm360.net' + url + '/where-used?depth=' + depth;

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        let result = {
            'edges'      : [],
            'nodes'      : [],
            'totalCount' : 0
        };
        if(response.data !== '') result = response.data;
        sendResponse(req, res, { 'data' : result, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- WHERE USED PARENTS ONLY----- */
router.get('/parents', function(req, res, next) {
    
    console.log(' ');
    console.log('  /parents');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId  = ' + req.query.wsId);
    console.log('  req.query.dmsId = ' + req.query.dmsId);
    
    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId + '/where-used?limit=100&offset=0';
    
    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        let result = [];
        if(response.data !== '') result = response.data.edges;
        sendResponse(req, res, { 'data' : result, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- RELATED ITEMS CHANGED ----- */
router.get('/related-items', function(req, res, next) {
    
    console.log(' ');
    console.log('  /related-items');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId        = ' + req.query.wsId);
    console.log('  req.query.dmsId       = ' + req.query.dmsId);
    console.log('  req.query.link        = ' + req.query.link);
    console.log('  req.query.relatedWSID = ' + req.query.relatedWSID);
    console.log();
    
    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url = 'https://' + req.session.tenant + '.autodeskplm360.net' + url + '/related-items?includeChildren=all&includeItems=workingVersionHasChanged&includeParents=none&limit=100&offset=0&relatedWorkspaceId=' + req.query.relatedWSID + '&revisionBias=working';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        let result = [];
        if(response.data !== '') result = response.data.items;
        sendResponse(req, res, { 'data' : result, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- PROJECT TAB ENTRIES ----- */
router.get('/project', function(req, res, next) {
    
    console.log(' ');
    console.log('  /project');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId        = ' + req.query.wsId);
    console.log('  req.query.dmsId       = ' + req.query.dmsId);
    console.log('  req.query.link        = ' + req.query.link);
    console.log();
    
    let url =  (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url = 'https://' + req.session.tenant + '.autodeskplm360.net' + url + '/views/16';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- CHANGE LOG ----- */
router.get('/logs', function(req, res, next) {
    
    console.log(' ');
    console.log('  /logs');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId  = ' + req.query.wsId);
    console.log('  req.query.dmsId = ' + req.query.dmsId);
    console.log('  req.query.link = ' + req.query.link);

    let url  = 'https://' + req.session.tenant + '.autodeskplm360.net';
        url += (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url += '/logs?desc=timeStamp&limit=500&offset=0';
    
    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        let result = [];
        if(response.data !== '') result = response.data.items;
        sendResponse(req, res, { 'data' : result, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- ITEM VERSIONS ----- */
router.get('/versions', function(req, res, next) {
        
    console.log(' ');
    console.log('  /versions');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId   = ' + req.query.wsId);
    console.log('  req.query.dmsId  = ' + req.query.dmsId);
    console.log('  req.query.link   = ' + req.query.link);
    console.log();
    
    let link = (typeof req.query.link === 'undefined') ? '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId : req.query.link;
    let url  = 'https://' + req.session.tenant + '.autodeskplm360.net' + link + '/versions';
    
    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- GET AVAILABLE WORKFLOW TRANSITIONS ----- */
router.get('/transitions', function(req, res, next) {
    
    console.log(' ');
    console.log('  /transitions');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId       = ' + req.query.wsId);
    console.log('  req.query.dmsId      = ' + req.query.dmsId);
    console.log('  req.query.link       = ' + req.query.link);
    console.log();

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net';
        url += (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url += '/workflows/1/transitions';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- PERFORM WORKFLOW TRANSITION ----- */
router.get('/transition', function(req, res, next) {
    
    console.log(' ');
    console.log('  /transition');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId       = ' + req.query.wsId);
    console.log('  req.query.dmsId      = ' + req.query.dmsId);
    console.log('  req.query.link       = ' + req.query.link);
    console.log('  req.query.transition = ' + req.query.transition);
    console.log('  req.query.comment    = ' + req.query.comment);
    console.log();

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net';
        url += (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url += '/workflows/1/transitions';

    let custHeaders = getCustomHeaders(req);
        custHeaders['content-location'] = req.query.transition;

    axios.post(url, {
        'comment' : req.query.commment
    },{
        'headers' : custHeaders
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        if(error.statusCode === 303) {
            sendResponse(req, res, error.response, false);
        } else {
            sendResponse(req, res, error.response, true);
        }
    });
    
});


/* ----- GET WORKFLOW HISTORY ----- */
router.get('/workflow-history', function(req, res, next) {
    
    console.log(' ');
    console.log('  /workflow-history');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId       = ' + req.query.wsId);
    console.log('  req.query.dmsId      = ' + req.query.dmsId);
    console.log('  req.query.link       = ' + req.query.link);
    console.log();

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net';
        url += (typeof req.query.link !== 'undefined') ? req.query.link : '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId;
        url += '/workflows/1/history';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        if(error.statusCode === 303) {
            sendResponse(req, res, error.response, false);
        } else {
            sendResponse(req, res, error.response, true);
        }
    });
    
});


/* ----- MY OUTSTANDING WORK ----- */
router.get('/mow', function(req, res, next) {
    
    console.log(' ');
    console.log('  /mow');
    console.log(' --------------------------------------------');  
    console.log('  ');
    
    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/users/@me/outstanding-work';
    
    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- BOOKMARKS ----- */
router.get('/bookmarks', function(req, res, next) {
    
    console.log(' ');
    console.log('  /bookmarks');
    console.log(' --------------------------------------------');  
    console.log('  ');
    
    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/users/@me/bookmarks';
    
    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        if(response.data === '') response.data = { 'bookmarks' : [] };
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- ADD BOOKMARK ----- */
router.get('/add-bookmark', function(req, res, next) {
    
    console.log(' ');
    console.log('  /add-bookmark');
    console.log(' --------------------------------------------');  
    console.log('  req.query.dmsId   = ' + req.query.dmsId);
    console.log('  req.query.comment = ' + req.query.comment);
    console.log('  ');
    
    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/users/@me/bookmarks';
    
    let params = {
        'dmsId' : req.query.dmsId,
        'comment' : (typeof req.query.comment === 'undefined') ? ' ' : req.query.comment
    }

    axios.post(url, params, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- REMOVE BOOKMARK ----- */
router.get('/remove-bookmark', function(req, res, next) {
    
    console.log(' ');
    console.log('  /remove-bookmark');
    console.log(' --------------------------------------------');  
    console.log('  req.query.dmsId   = ' + req.query.dmsId);
    console.log('  ');
    
    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/users/@me/bookmarks/' + req.query.dmsId;
    
    axios.delete(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- RECENT ITEMS ----- */
router.get('/recent', function(req, res, next) {
    
    console.log(' ');
    console.log('  /recent');
    console.log(' --------------------------------------------');  
    console.log('  ');
    
    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/users/@me/recently-viewed';
    
    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- WORKSPACE ITEMS ----- */
router.get('/items', function(req, res) {
   
    console.log(' ');
    console.log('  /items');
    console.log(' --------------------------------------------');
    console.log('  req.query.wsId   = ' + req.query.wsId);
    console.log('  req.query.bulk   = ' + req.query.bulk); 
    console.log();

    let url         = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.query.wsId + '/items';
    let bulk        = (typeof req.query.bulk !== 'undefined') ? (req.query.bulk.toLowerCase() === 'true') : false;
    let custHeaders = getCustomHeaders(req);

    if(bulk) custHeaders['Accept'] = 'application/vnd.autodesk.plm.items.bulk+json';

    axios.get(url, { 
        'headers' : custHeaders
    }).then(function (response) {
        if(response.data === '') response.data = { 'items' : []};
        sendResponse(req, res, response, false); 
    }).catch(function (error) {
        sendResponse(req, res, error.response, true);
    });
   
});


/* ----- SEARCH ----- */
router.get('/search', function(req, res) {
   
    console.log(' ');
    console.log('  /search');
    console.log(' --------------------------------------------');
    console.log('  req.query.wsId   = ' + req.query.wsId);
    console.log('  req.query.latest = ' + req.query.latest);
    console.log('  req.query.sort   = ' + req.query.sort);
    console.log('  req.query.fields = ' + req.query.fields);
    console.log('  req.query.filter = ' + req.query.filter);
    console.log();

   let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/rest/v1/workspaces/' + req.query.wsId + '/items/search';
   
   let params = {
       'pageNo'        : 1,
       'pageSize'      : 100,
       'logicClause'   : 'AND',
       'fields'        : [],
       'filter'        : [],
       'sort'          : []
   };
   
   setBodyFields(params, req.query.fields);
   setBodySort(params, req.query.sort);
   setBodyFilter(params, req.query.filter);

    if(typeof req.query.latest !== 'undefined') {
        if(req.query.latest) {
            params.filter.push({ 
                'fieldID'       : 'LC_RELEASE_LETTER',
                'fieldTypeID'   : '10',
                'filterType'    : { 'filterID' : 20 },
                'filterValue'   : 'true'      
            }); 
        }
    }

    axios.post(url, params, { 
        headers : req.session.headers
    }).then(function (response) {
        let result = { row : [] };
        if(response.data !== undefined) {
            if(response.data !== '') {
                result = response.data;
            }
        }
        sendResponse(req, res, { 'data' : result, 'status' : response.status }, false);
    }).catch(function (error) {
        sendResponse(req, res, error.response, true);
    });
   
});
function setBodyFields(body, fields) {
   
//    console.log('/setBodyFields : START');
   
   if(fields === null) return;
   
   for(var i = 0; i < fields.length; i++) {

       var fieldID = fields[i];
       var fieldTypeID = getFieldType(fieldID);
       
       var field = {
           'fieldID' : fieldID,
           'fieldTypeID' : fieldTypeID   
       }
       
       body.fields.push(field);
       
   }
   
}
function getFieldType(fieldID) {
   
   var fieldType = 0;
   
   switch(fieldID) {
           
       case 'WF_CURRENT_STATE':
           fieldType = 1;
           break;
    
       case 'DESCRIPTOR':
           fieldType = 15;
           break;
           
   }
   
   return fieldType;
   
}
function setBodySort(body, sorts) {
   
   if(sorts === null) return;
   
   for(var i = 0; i < sorts.length; i++) {

       var sort = {
           'fieldID'           : sorts[i],
           'fieldTypeID'       : 0,
           'sortDescending'    : false    
       }

       if(sort.fieldID === 'DESCRIPTOR') sort.fieldTypeID = 15;
       
       body.sort.push(sort);
       
   }
   
}
function setBodyFilter(body, filters) {
   
//    console.log(' > START setBodyFilter');
   
   body.filter = [];
   
   for(var i = 0; i < filters.length; i++) {

       var filter = {
           'fieldID'       : filters[i].field,
           'fieldTypeID'   : filters[i].type,
           'filterType'    : { 'filterID' : filters[i].comparator },
           'filterValue'   : filters[i].value         
       }
       
       body.filter.push(filter);
       
   }
   
}


/* ----- SEARCH DESCRIPTOR ----- */
router.get('/search-descriptor', function(req, res, next) {
    
    console.log(' ');
    console.log('  /search-descriptor');
    console.log(' --------------------------------------------'); 
    console.log('  req.query.wsId       = ' + req.query.wsId);
    console.log('  req.query.query      = ' + req.query.query);
    console.log('  req.query.limit      = ' + req.query.limit);
    console.log('  req.query.offset     = ' + req.query.offset); 
    console.log('  req.query.bulk       = ' + req.query.bulk); 
    console.log('  req.query.page       = ' + req.query.page); 
    console.log('  req.query.revision   = ' + req.query.revision); 
    console.log('  req.query.wildcard   = ' + req.query.wildcard); 
    console.log();

    let limit       = (typeof req.query.limit    === 'undefined') ?   100    : req.query.limit;
    let offset      = (typeof req.query.offset   === 'undefined') ?   0      : req.query.offset;
    let bulk        = (typeof req.query.bulk     === 'undefined') ?  'false' : req.query.bulk;
    let page        = (typeof req.query.page     === 'undefined') ?   '1'    : req.query.page;
    let revision    = (typeof req.query.revision === 'undefined') ?   '1'    : req.query.revision;
    let wildcard    = (typeof req.query.wildcard === 'undefined') ?   true   : (req.query.wildcard.toLowerCase() === 'true');

    let url    = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/search-results?limit=' + limit + '&offset=' + offset + '&page=' + page + '&revision=' + revision + '&query=';
    let values = req.query.query.split(' ');
    
    if(values.length > 1) {
        let query  = '';
        for(value of values) {
            if(value !== '-') {
                if(query !== '') query += '+OR+'
                if(!isNaN(value)) query += 'itemDescriptor%3D*' + value + '*'
                else query += 'itemDescriptor%3D' + value
            }
        }
        url += '(' + query + ')';
    } else if(!wildcard) {
        url += 'itemDescriptor%3D%22' + req.query.query + '%22';
    } else {
        url += 'itemDescriptor%3D*' + req.query.query + '*';
    }

    if(typeof req.query.wsId !== 'undefined') url += '+AND+(workspaceId%3D' + req.query.wsId + ')';

    let headers = getCustomHeaders(req);

    if(bulk !== 'false') headers.Accept = 'application/vnd.autodesk.plm.items.bulk+json';

    axios.get(url, {
        'headers' : headers
    }).then(function(response) {
        if(response.data === "") response.data = { 'items' : [] }
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- SEARCH BULK ----- */
router.get('/search-bulk', function(req, res, next) {
    
    console.log(' ');
    console.log('  /search-bulk');
    console.log(' --------------------------------------------'); 
    console.log('  req.query.wsId       = ' + req.query.wsId);
    console.log('  req.query.query      = ' + req.query.query);
    console.log('  req.query.limit      = ' + req.query.limit);
    console.log('  req.query.offset     = ' + req.query.offset); 
    console.log('  req.query.bulk       = ' + req.query.bulk); 
    console.log('  req.query.page       = ' + req.query.page); 
    console.log('  req.query.revision   = ' + req.query.revision); 
    console.log();

    let limit       = (typeof req.query.limit    === 'undefined') ?   100 : req.query.limit;
    let offset      = (typeof req.query.offset   === 'undefined') ?     0 : req.query.offset;
    let bulk        = (typeof req.query.bulk     === 'undefined') ?  true : req.query.bulk;
    let page        = (typeof req.query.page     === 'undefined') ?   '1' : req.query.page;
    let revision    = (typeof req.query.revision === 'undefined') ?   '1' : req.query.revision;

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/search-results?limit=' + limit + '&offset=' + offset + '&page=' + page + '&revision=' + revision + '&query=' + req.query.query;
    
    if(typeof req.query.wsId !== 'undefined') url += '+AND+(workspaceId%3D' + req.query.wsId + ')';

    let headers = getCustomHeaders(req);

    if(bulk) headers.Accept = 'application/vnd.autodesk.plm.items.bulk+json';

    axios.get(url, {
        headers : headers
    }).then(function(response) {

        if(response.data === "") response.data = { 'items' : [] }

        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- LIST OF TABLEAUS ----- */
router.get('/tableaus', function(req, res, next) {
    
    console.log(' ');
    console.log('  /tableaus');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId  = ' + req.query.wsId);
    
    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.query.wsId + '/tableaus';
    
    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        let result = [];
        if(response.data !== '') result = response.data.tableaus;
        sendResponse(req, res, { 'data' : result, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- CREATE INITIAL TABLEAU ----- */
router.get('/tableau-init', function(req, res, next) {
    
    console.log(' ');
    console.log('  /tableau-init');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId  = ' + req.query.wsId);
    
    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.query.wsId + '/tableaus';
    
    axios.post(url, {}, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- CREATE BASE VIEW ----- */
router.get('/tableau-add', function(req, res, next) {
    
    console.log(' ');
    console.log('  /tableau-add');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId    = ' + req.query.wsId);
    console.log('  req.query.name    = ' + req.query.name);
    console.log('  req.query.columns = ' + req.query.columns);
    
    let title       = (typeof req.query.name === 'undefined') ? 'New View' : req.query.name;
    let columns     = (typeof req.query.columns === 'undefined') ? ['descriptor', 'created_on', 'last_modified_on'] : req.query.columns;
    let url         = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.query.wsId + '/tableaus';
    let urlFields   = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + req.query.wsId + '/fields';
    let index       = 0;
    let params      = {
        'name'          : title,
        'createdDate'   : new Date(),
        'isDefault'     : false,
        'columns'       : []
    };

    if(title.length > 30) {

        console.log();
        console.log('  ERROR : Tableau name must not exceed 30 characters');
        console.log();
        sendResponse(req, res, { 'status' : 500, 'message' : 'Tableau name must not exceed 30 characters' }, true);

    } else {

        axios.get(urlFields, {
            headers : req.session.headers
        }).then(function(response) {

            for(column of columns) {

                let col = {
                    'displayOrder' : index++,
                    'field' : {},
                    'group' : {}
                }

                switch(column.toLowerCase()) {

                    case 'descriptor':
                        col.field.title     = 'Item Descriptor';
                        col.field.__self__  = '/api/v3/workspaces/' + req.query.wsId + '/views/0/fields/DESCRIPTOR';
                        col.field.urn       = '';
                        col.field.type      = { 'link' : '/api/v3/field-types/4' }
                        col.group           = { 'label' : 'ITEM_DESCRIPTOR_FIELD' };
                        break;

                    case 'created_on':
                        col.field.title     = 'Created On';
                        col.field.__self__  = '/api/v3/workspaces/' + req.query.wsId + '/views/0/fields/CREATED_ON';
                        col.field.urn       = '';
                        col.field.type      = { 'link' : '/api/v3/field-types/3' };
                        col.group           = { 'label' : 'LOG_FIELD' };
                        break;

                    case 'last_modified_on':
                        col.field.title     = 'Last Modified On';
                        col.field.__self__  = '/api/v3/workspaces/' + req.query.wsId + '/views/0/fields/LAST_MODIFIED_ON';
                        col.field.urn       = '';
                        col.field.type      = { 'link' : '/api/v3/field-types/3' };
                        col.group           = { 'label' : 'LOG_FIELD' };
                        break;

                    case 'wf_current_state':
                        col.field.title     = 'Currrent State';
                        col.field.__self__  = '/api/v3/workspaces/' + req.query.wsId + '/views/0/fields/WF_CURRENT_STATE';
                        col.field.urn       = '';
                        col.field.type      = { 'link' : '/api/v3/field-types/3' };
                        col.group           = { 'label' : 'WORKFLOW_FIELD' };
                        break;

                    default:
                        for(field of response.data.fields) {
                            let fieldId = field.__self__.split('/')[8];
                            if(fieldId === column) {
                                col.field.title     = field.name;
                                col.field.__self__  = field.__self__;
                                col.field.urn       = '';
                                col.field.type      = { 'link' : field.type.link };
                                col.group           = { 'label' : 'ITEM_DETAILS_FIELD' };
                            }
                        }
                        break;
                }

                params.columns.push(col);

            }
        
            let headers = getCustomHeaders(req);
                headers['Content-Type'] = 'application/vnd.autodesk.plm.meta+json';

            axios.post(url, params, {
                headers : headers
            }).then(function(response) {
                sendResponse(req, res, response, false);
            }).catch(function(error) {
                sendResponse(req, res, error.response, true);
            });

        });

    }
    
});


/* ----- TABLEAU COLUMNS ----- */
router.get('/tableau-columns', function(req, res, next) {
    
    console.log(' ');
    console.log('  /tableau-columns');
    console.log(' --------------------------------------------');  
    console.log('  req.query.link  = ' + req.query.link);
    
    let url = 'https://' + req.session.tenant + '.autodeskplm360.net'  + req.query.link;
    
    let headers = getCustomHeaders(req);
        headers.Accept = 'application/vnd.autodesk.plm.meta+json';
    
    axios.get(url, {
        headers : headers
    }).then(function(response) {
        if(response.data !== '') result = response.data.columns;
        sendResponse(req, res, { 'data' : result, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- TABLEAU DATA ----- */
router.get('/tableau-data', function(req, res, next) {
    
    console.log(' ');
    console.log('  /tableau-data');
    console.log(' --------------------------------------------');  
    console.log('  req.query.link  = ' + req.query.link);
    console.log('  req.query.page  = ' + req.query.page);
    console.log('  req.query.size  = ' + req.query.size);
    
    let page = (typeof req.query.page === 'undefined') ?  '1' : req.query.page;
    let size = (typeof req.query.size === 'undefined') ? '50' : req.query.size;

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net'  + req.query.link + '?page=' + page + '&size=' + size;
    
    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        let result = [];
        if(response.data !== '') result = response.data.items;
        if(typeof result === 'undefined') result = [];
        sendResponse(req, res, { 'data' : result, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- ALL REPORTS ----- */
router.get('/reports', function(req, res, next) {
    
    console.log(' ');
    console.log('  /reports');
    console.log(' --------------------------------------------');  
    console.log();

   let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/rest/v1/reports';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });

});


/* ----- REPORT ----- */
router.get('/report', function(req, res, next) {
    
    console.log(' ');
    console.log('  /report');
    console.log(' --------------------------------------------');  
    console.log('  req.query.reportId  = ' + req.query.reportId);
    console.log();

   let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/rest/v1/reports/' + req.query.reportId;

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });

});


/* ----- GET USERS ----- */
router.get('/users', function(req, res, next) {
    
    console.log(' ');
    console.log('  /users');
    console.log(' --------------------------------------------');  
    console.log('  req.query.offset  = ' + req.query.offset);
    console.log();

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/users?limit=100&activeOnly=false&sort=displayName&mappedOnly=false&offset=' + req.query.offset;

    let headers = getCustomHeaders(req);
        headers.Accept = 'application/vnd.autodesk.plm.users.bulk+json';

    axios.get(url, {
        headers : headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });

});


/* ----- GET USER PROFILE ----- */
router.get('/me', function(req, res, next) {
    
    console.log(' ');
    console.log('  /me');
    console.log(' --------------------------------------------');  
    console.log(new Date());
    console.log();

    let timerStart = new Date();

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/users/@me';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        let timerEnd = new Date();
        let timerDiff = timerEnd.getTime() - timerStart.getTime();
        if(req.app.locals.debugMode) console.log(timerDiff);
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });

});


/* ----- GET WORKSPACE DATA ----- */
router.get('/workspace', function(req, res, next) {
    
    console.log(' ');
    console.log('  /workspace');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId  = ' + req.query.wsId);
    console.log('  req.query.link  = ' + req.query.link);
    console.log();

    let wsId = (typeof req.query.wsId === 'undefined') ? req.query.link.split('/')[4] : req.query.wsId;
    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId;

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });

});



/* ----- GET WORKSPACES ----- */
router.get('/workspaces', function(req, res, next) {
    
    console.log(' ');
    console.log('  /workspaces');
    console.log(' --------------------------------------------');  
    console.log('  req.query.offset  = ' + req.query.offset);
    console.log('  req.query.limit   = ' + req.query.limit);
    console.log();

    if(typeof req.query.offset === 'undefined') req.query.offset = 0;
    if(typeof req.query.limit === 'undefined') req.query.limit = 500;

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces?offset=' + req.query.offset + '&limit=' + req.query.limit;

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });

});


/* ----- GET WORKSPACE COUNTER ----- */
router.get('/workspace-counter', function(req, res, next) {
    
    console.log(' ');
    console.log('  /workspace-counter');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId = ' + req.query.wsId);
    console.log();

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/search-results?limit=1&offset=0&query=workspaceId%3D' + req.query.wsId;

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });

});


/* ----- GET ID OF DEFINED WORKSPACE ----- */
router.get('/get-workspace-id', function(req, res, next) {
    
    console.log(' ');
    console.log('  /workspaces');
    console.log(' --------------------------------------------');  
    console.log('  req.query.name   = ' + req.query.name);
    console.log('  req.query.offset = ' + req.query.offset);
    console.log('  req.query.limit  = ' + req.query.limit);
    console.log();

    if(typeof req.query.offset === 'undefined') req.query.offset = 0;
    if(typeof req.query.limit  === 'undefined') req.query.limit  = 500;

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/workspaces?offset=' + req.query.offset + '&limit=' + req.query.limit;

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {

        let result = { 'data' : -1 }

        for(workspace of response.data.items) {
            if(workspace.title === req.query.name) {
                result.data = Number(workspace.link.split('/')[4]);
            }
        }

        sendResponse(req, res, result, false);

    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });

});


/* ----- GET ASSIGNED GROUPS ----- */
router.get('/groups-assigned', function(req, res, next) {
    
    console.log(' ');
    console.log('  /groups-assigned');
    console.log(' --------------------------------------------');  
    console.log();

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/users/@me'

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, { 'data' : response.data.groups, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });

});


/* ----- GET WORKSPACE PERMISSIONS ----- */
router.get('/permissions', function(req, res, next) {
    
    console.log(' ');
    console.log('  /permissions');
    console.log(' --------------------------------------------');  
    console.log('  req.query.wsId  = ' + req.query.wsId);
    console.log('  req.query.dmsId = ' + req.query.dmsId);
    console.log('  req.query.link  = ' + req.query.link);
    console.log();

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net'

    if(typeof req.query.link === 'undefined') {
        url += '/api/v3/workspaces/' + req.query.wsId;
        if(typeof req.query.dmsId !== 'undefined') {
            url += '/items/' + req.query.dmsId;
        }     
    } else {
        url += req.query.link;
    }

    url += '/users/@me/permissions';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, { 'data' : response.data.permissions, 'status' : response.status }, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });

});


/* ----- SYSTEM-LOG ----- */
router.get('/system-logs', function(req, res, next) {
    
    console.log(' ');
    console.log('  /system-logs');
    console.log(' --------------------------------------------');  
    console.log('  req.query.offset  = ' + req.query.offset);
    console.log('  req.query.limit   = ' + req.query.limit);
    console.log();

    let url = 'https://' + req.session.tenant + '.autodeskplm360.net/api/v3/tenants/' + req.session.tenant.toUpperCase() + '/system-logs?offset=' + req.query.offset + '&limit=' + req.query.limit;

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });

});


module.exports = router;