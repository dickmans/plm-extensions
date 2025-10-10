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


function getCustomHeaders(req) {

    let headers = {
        'Content-Type'  : 'application/json',
        'Accept'        : 'application/json',
        'token'         : req.session.headers.token,
        'Authorization' : req.session.headers.Authorization       
    }

    return headers;

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


/* ----- GET AVAILABLE HUBS ----- */
router.get('/hubs', function(req, res, next) {
    
    console.log(' ');
    console.log('  /hubs');
    console.log(' --------------------------------------------');
    console.log();

    let url = 'https://developer.api.autodesk.com/project/v1/hubs';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- GET HUB PROJECTS ----- */
router.get('/projects', function(req, res, next) {
    
    console.log(' ');
    console.log('  /projects');
    console.log(' --------------------------------------------');
    console.log('  req.query.hub = ' + req.query.hub);
    console.log();

    let url = 'https://developer.api.autodesk.com/project/v1/hubs/' + req.query.hub + '/projects';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- GET PROJECT TOP FOLDERS ----- */
router.get('/top-folders', function(req, res, next) {
    
    console.log(' ');
    console.log('  /top-folders');
    console.log(' --------------------------------------------');
    console.log('  req.query.hub     = ' + req.query.hub);
    console.log('  req.query.project = ' + req.query.project);
    console.log();

    let url = 'https://developer.api.autodesk.com/project/v1/hubs/' + req.query.hub + '/projects/' + req.query.project + '/topFolders';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- GET FOLDER CONTENTS ----- */
router.get('/folder', function(req, res, next) {
    
    console.log(' ');
    console.log('  /folder');
    console.log(' --------------------------------------------');
    console.log('  req.query.project = ' + req.query.project);
    console.log('  req.query.folder  = ' + req.query.folder);
    console.log();

    let url = 'https://developer.api.autodesk.com/data/v1/projects/' + req.query.project + '/folders/' + req.query.folder + '/contents';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- GET ITEM VERSIONS ----- */
router.get('/item-versions', function(req, res, next) {
    
    console.log(' ');
    console.log('  /item-versions');
    console.log(' --------------------------------------------');
    console.log('  req.query.project = ' + req.query.project);
    console.log('  req.query.item    = ' + req.query.item);
    console.log();

    let url = 'https://developer.api.autodesk.com/data/v1/projects/' + req.query.project + '/items/' + req.query.item + '/versions';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- UPLOAD NEW FILE ----- */
router.post('/upload', function(req, res) {
    
    console.log(' ');
    console.log('  /upload');
    console.log(' --------------------------------------------');
    console.log('  req.query.project  = ' + req.query.project);
    console.log('  req.query.folder   = ' + req.query.folder);
    console.log();

    let files    = [];
    let promises = [];

    if(Array.isArray(req.files.newFiles)) {
        files = req.files.newFiles;
    } else files.push(req.files.newFiles);

    for(let file of files) {
        promises.push(file.mv(pathUploads + file.name));
    }

    console.log('  > received ' + files.length + ' file(s)');

    Promise.all(promises).then(function() {

        let filename = files[0].name;
        let path     = pathUploads + filename;

        createStorage(req, res, filename, function(response) {

            let storageId   = response.data.data.id;
            let data        = storageId.split('urn:adsk.objects:os.object:')[1].split('/');
            let urlSigned   = 'https://developer.api.autodesk.com/oss/v2/buckets/' + data[0] + '/objects/' + data[1] + '/signeds3upload';

            genS3URL(req, res, urlSigned, function(response) {

                let uploadKey = response.data.uploadKey;

                uploadFile(req, res, response.data.urls, path, function() {
                    completeUpload(req, res, urlSigned, uploadKey, function(response) {
                        createFirstVersion(req, res, filename, storageId, function(response) {
                            
                            console.log('  > Finished Upload');
                            console.log();

                            sendResponse(req, res, response, false);

                        });
                    });
                });

            });

        });

    });
    
});
function createStorage(req, res, filename, callback) {

    console.log('  > creating storage');

    let url = 'https://developer.api.autodesk.com/data/v1/projects/' + req.query.project + '/storage';

    let params = {
        data : {
            type        : 'objects',
            attributes  : {
                name : filename
            },
            relationships : {
                target : {
                    data : { 
                        type    : 'folders', 
                        id      : req.query.folder 
                    }
                }
            }
        }
    }

    let headers = getCustomHeaders(req);
        headers.Accept = 'application/vnd.api+json';

    axios.post(url, params, {
        headers : headers
    }).then(function(response) {
        callback(response);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });

}
function genS3URL(req, res, urlSigned, callback) {

    console.log('  > requesting S3 URL');

    axios.get(urlSigned, {
        headers : {
            'Authorization' : req.session.headers.Authorization
        }
    }).then(function(response) {
        callback(response);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });

}
function uploadFile(req, res, urls, path, callback) {

    console.log('  > Uploading file ' + path);

    let url = urls[0];

    axios.put(url, fs.readFileSync(path)).then(function(response) {
        callback(response);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });

}
function completeUpload(req, res, urlSigned, uploadKey, callback) {

    console.log('  > Completing upload');

    axios.post(urlSigned, {
        'uploadKey' : uploadKey
    },{
        headers : req.session.headers
    }).then(function(response) {
        callback(response);
    }).catch(function(error) {
        console.log(error);
        sendResponse(req, res, error.response, true);
    });


}
function createFirstVersion(req, res, filename, storageId, callback) {

    console.log('  > Creating first version');

    let headers = getCustomHeaders(req);
        headers.Accept          = 'application/vnd.api+json';
        headers['Content-Type'] = 'application/vnd.api+json';

    let url = 'https://developer.api.autodesk.com/data/v1/projects/' + req.query.project + '/items';

    let params =  {
        data : {
            type : "items",
            attributes : {
                displayName : filename,
                extension   : {
                    type    : "items:autodesk.bim360:File",
                    version : "1.0"
                }
            },
            relationships: {
                tip : {
                    data : {
                        type : "versions", 
                        id   : "1"
                    }
                },
                parent : {
                    data : {
                        type : "folders",
                        id   : req.query.folder
                    }
                }
            }
        },
        included : [{
            type        : "versions",
            id          : "1",
            attributes  : {
                name : filename,
                extension : {
                    type    : "versions:autodesk.bim360:File",
                    version : "1.0"
                }
            },
            relationships : {
                storage : {
                    data : {
                        type : "objects",
                        id   : storageId
                    }
                }
            }
        }]
    };

    axios.post(url, params, {
        headers : headers
    }).then(function(response) {
        callback(response);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });

}



/* ----- ADD XREF ----- */
router.get('/add-xref', function(req, res) {
    
    console.log(' ');
    console.log('  /add-xref');
    console.log(' --------------------------------------------');
    console.log('  req.query.project        = ' + req.query.project);
    console.log('  req.query.file           = ' + req.query.file);
    // console.log('  req.query.version        = ' + req.query.version);
    console.log('  req.query.xrefs          = ' + req.query.xrefs);
    console.log('  req.query.xrefId         = ' + req.query.xrefId);
    console.log('  req.query.xrefVersion    = ' + req.query.xrefVersion);
    console.log();

    // let url = 'https://developer.api.autodesk.com/data/v1/projects/' + req.query.project + '/versions?copyFrom=' + req.query.file + '?version=' + req.query.version;
    let url = 'https://developer.api.autodesk.com/data/v1/projects/' + req.query.project + '/versions?copyFrom=' + req.query.file;

    console.log(url);

    // url = encodeURIComponent(url);

    // console.log(url);

    let params = {
        data : {
            type : 'versions',
            relationships : {
                refs : {
                    data : []
                    // data : [{ 
                    //     type    : 'versions', 
                    //     id      : req.query.xrefId + '?version=' + req.query.xrefVersion,
                    //     meta    : {
                    //         refType     : 'xrefs',
                    //         direction   : 'from',
                    //         extension   : {
                    //             type    : 'xrefs:autodesk.core:Xref',
                    //             version : '1.1',
                    //             data : {
                    //                 nestedType : 'overlay'
                    //             }
                    //         }
                    //     }
                    // }]
                }
            }
        }
    }

    console.log(params);

    for(let xref of req.query.xrefs) {

        params.data.relationships.refs.data.push({
            type    : 'versions', 
            id      : xref,
            meta    : {
                refType     : 'xrefs',
                direction   : 'from',
                extension   : {
                    type    : 'xrefs:autodesk.core:Xref',
                    version : '1.1',
                    data : {
                        nestedType : 'overlay'
                    }
                }
            }           
        });

    }

    console.log(params);
    console.log(params.data.relationships.refs.data);

    // let headers = getCustomHeaders(req);
    //     headers.Accept = 'application/vnd.api+json';

    axios.post(url, params, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        console.log(error);
        console.log(error.response.data);
        sendResponse(req, res, error.response, true);
    });

    // let files    = [];
    // let promises = [];

    // if(Array.isArray(req.files.newFiles)) {
    //     files = req.files.newFiles;
    // } else files.push(req.files.newFiles);

    // for(let file of files) {
    //     promises.push(file.mv(pathUploads + file.name));
    // }

    // console.log('  > received ' + files.length + ' file(s)');

    // Promise.all(promises).then(function() {

    //     let filename = files[0].name;
    //     let path     = pathUploads + filename;

    //     createStorage(req, res, filename, function(response) {

    //         let storageId   = response.data.data.id;
    //         let data        = storageId.split('urn:adsk.objects:os.object:')[1].split('/');
    //         let urlSigned   = 'https://developer.api.autodesk.com/oss/v2/buckets/' + data[0] + '/objects/' + data[1] + '/signeds3upload';

    //         genS3URL(req, res, urlSigned, function(response) {

    //             let uploadKey = response.data.uploadKey;

    //             uploadFile(req, res, response.data.urls, path, function() {
    //                 completeUpload(req, res, urlSigned, uploadKey, function(response) {
    //                     createFirstVersion(req, res, filename, storageId, function(response) {
                            
    //                         console.log('  > Finished Upload');
    //                         console.log();

    //                         sendResponse(req, res, response, false);

    //                     });
    //                 });
    //             });

    //         });

    //     });

    // });
    
});



module.exports = router;