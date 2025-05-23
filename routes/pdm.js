const express       = require('express');
const router        = express.Router();
const axios         = require('axios');
// const querystring   = require('querystring');
const fs            = require('fs');


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

function sendResponse(req, res, response, error) {

    if(typeof req.body === 'undefined') req.body = {};

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


/* ----- GET SERVER INFO ----- */
router.get('/server-info', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/server-info');
    console.log(' --------------------------------------------');
    console.log('  ');

    let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/server-info';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- GET ALL SYSTEM-OPTIONS ----- */
router.get('/system-options', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/system-options');
    console.log(' --------------------------------------------');
    console.log('  ');

    let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/system-options';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        console.log(error);
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- GET AVAILABLE VAULTS ----- */
router.get('/vaults', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/vaults');
    console.log(' --------------------------------------------');
    console.log('  ');

    let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        req.session.vaultId = response.data.results[0].id;
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        console.log(error);
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- GET & SET VAULT ID ----- */
router.get('/id', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/id');
    console.log(' --------------------------------------------');
    console.log('  ');

    let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults';

    if(req.app.locals.vaultName === '') {

        let result = {
            success : false,
            message : 'Vault name has not been defined in server settings file'
        }
        res.json(result);

    } else if(req.app.locals.vaultGatewayLink === '') {

        let result = {
            success : false,
            message : 'Vault Gateway has not been defined in server settings file'
        }
        res.json(result);

    } else if((typeof req.session.vaultId !== 'undefined') && (req.session.vaultId !== '')) {

        let result = {
            success : true,
            message : 'Connected to Vault ' + req.app.locals.vaultName + ' already'
        }
        res.json(result);

    } else {

        axios.get(url, {
            headers : req.session.headers
        }).then(function(response) {

            let result = {
                success : false,
                message : 'Could not connect to vault ' + req.app.locals.vaultName
            }

            for(let vault of response.data.results) {
                if(vault.name === req.app.locals.vaultName) {
                    result.success = true;
                    result.message = 'Connected to vault ' + req.app.locals.vaultName;
                    req.session.vaultId = vault.id;
                }
            }
            
            res.json(result);

        }).catch(function(error) {
            console.log(error);
            sendResponse(req, res, error.response, true);
        });

    }
    

});



/* ----- VALIDATE SERVER ACCESS ----- */
router.get('/connect', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/connect');
    console.log(' --------------------------------------------');
    console.log('  ');

    let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/server-info';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        let result = { 
            success : true, 
            version : '' 
        };
        if(response.status !== 200) {
            result.success = false;
        } else {
            result.version = response.data.productVersion;
        }
        res.json(result);
    }).catch(function(error) {
        sendResponse(req, res, error.response, false);
    });
    
});



/* ----- GET ACCESS TOKEN ----- */
router.get('/token', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/token');
    console.log(' --------------------------------------------');
    console.log('  req.query.fileId  = ' + req.query.fileId);
    console.log('  ');

    let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/server-info';

    // console.log(req.session.headers);


// '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/file-versions';


    let result = { 
        success : true, 
        token   : req.session.headers.token,
        gateway : req.app.locals.vaultGatewayLink,
        link    : req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/file-versions/' + req.query.fileId + '/svf/bubble.json'
    };
    
    // console.log(result);
    
    // url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/file-versions/' + req.query.fileId + '/svf/bubble.json';
    
    // console.log(url);

    res.json(result);

    // axios.get(url, {
    //     headers : req.session.headers
    // }).then(function(response) {

    //     console.log();
    //     console.log('-----');
        
    //     console.log(response);
    //     console.log();
    // //     let result = { 
    // //         success : true, 
    // //         version : '' 
    // //     };
    // //     if(response.status !== 200) {
    // //         result.success = false;
    // //     } else {
    // //         result.version = response.data.productVersion;
    // //     }
    // //     res.json(result);
    // }).catch(function(error) {
    //     console.log(error.response);
    //     // sendResponse(req, res, error.response, true);
    // });
    
});
/* ----- GET ACCESS TOKEN ----- */
router.get('/viewing-file', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/viewing-file');
    console.log(' --------------------------------------------');
    console.log('  req.query.fileId  = ' + req.query.fileId);
    console.log('  ');

    // let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/server-info';

    // console.log(req.session.headers);


// '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/file-versions';


    // let result = { 
    //     success : true, 
    //     token   : req.session.headers.token,
    //     gateway : req.app.locals.vaultGatewayLink,
    //     link    : req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/file-versions/' + req.query.fileId + '/svf/bubble.json'
    // };
    
    // console.log(result);
    
    // let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/file-versions/' + req.query.fileId + '/svf/bubble.json';
    let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/file-version/' + req.query.fileId + '/svf/bubble.json';
    // let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/file-versions/' + req.query.fileId;
    
    console.log(url);
    console.log(req.session.headers);

    // res.json(result);

    let custHeaders = {
        'Accept' : 'application/json',
        'Authorization' : req.session.headers.Authorization
    }

    console.log(custHeaders);

    axios.get(url, {
        // headers : req.session.headers
        headers : custHeaders
    }).then(function(response) {

        console.log();
        console.log('-----');
        
        console.log(response);
        console.log();
    //     let result = { 
    //         success : true, 
    //         version : '' 
    //     };
    //     if(response.status !== 200) {
    //         result.success = false;
    //     } else {
    //         result.version = response.data.productVersion;
    //     }
    //     res.json(result);
    }).catch(function(error) {
        console.log(error.response);
        // sendResponse(req, res, error.response, true);
    });
    
});



/* ----- GET ALL GROUPS ----- */
router.get('/groups', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/groups');
    console.log(' --------------------------------------------');
    console.log('  ');

    let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/groups';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        console.log(error);
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- GET ALL ROLES ----- */
router.get('/roles', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/roles');
    console.log(' --------------------------------------------');
    console.log('  ');

    let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/roles';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        console.log(error);
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- GET ALL USERS ----- */
router.get('/users', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/users');
    console.log(' --------------------------------------------');
    console.log('  ');

    let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/users';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        console.log(error);
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- GET ALL PROPERTY DEFINITIONS ----- */
router.get('/property-definitions', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/property-definitions');
    console.log(' --------------------------------------------');
    console.log('  req.query.entity  = ' + req.query.entity);
    console.log('  ');

    let url    = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/property-definitions';
    let params = {};

    if(typeof req.query.entity !== 'undefined') {

        let entity = req.query.entity.toLowerCase();

        switch(entity) {
            case 'folder'       : params['filter[entityClassId]'] = 'FLDR'; break;
            case 'file'         : params['filter[entityClassId]'] = 'FILE'; break;
            case 'item'         : params['filter[entityClassId]'] = 'ITEM'; break;
            case 'eco'          : params['filter[entityClassId]'] = 'CO'; break;
            case 'change'       : params['filter[entityClassId]'] = 'CO'; break;
            case 'change order' : params['filter[entityClassId]'] = 'CO'; break;
            case 'co'           : params['filter[entityClassId]'] = 'CO'; break;
        }

    }

    axios.get(url, {
        params  : params,
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        console.log(error);
        sendResponse(req, res, error.response, true);
    });
    
});




/* ----- GET ALL PROJECTS ----- */
// router.get('/projects', function(req, res, next) {
    
//     console.log(' ');
//     console.log('  /vault/projects');
//     console.log(' --------------------------------------------');
//     console.log('  req.session.vaultId  = ' + req.session.vaultId);
//     console.log('  ');

//     let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/search';

//     console.log(req.session.headers);
//     console.log(url);

//     let params = {
//         entityTypesToSearch : ['Folder'],
//         searchSubFolders    : false,
//         searchCriterias : [{
//             propertyDefinitionUrl : '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/property-definitions/29',
//             // operator : 'IsExactly',
//             // searchString : '$/'
//             operator : 'IsExactly',
//             searchString : '$/Designs',
//             searchSubFolders : true
//         }]
//         // searchCriterias : [{
//         //     propertyDefinitionUrl : 'fullName',
//         //     operator : 'Contains',
//         //     searchString : 'Designs'
//         // }]
//         // fullName
//         // foldersToSearch : ['$']
//     };

//     console.log(params);

//     axios.post(url, params, {
//         headers : req.session.headers
//     }).then(function(response) {
//         sendResponse(req, res, response, false);
//     }).catch(function(error) {
//         console.log(error);
//         sendResponse(req, res, error.response, true);
//     });
    
// });



/* ----- PERFORM SEARCH ----- */
// router.get('/search', function(req, res, next) {
    
//     console.log(' ');
//     console.log('  /vault/search');
//     console.log(' --------------------------------------------');
//     console.log('  req.session.vaultId  = ' + req.session.vaultId);
//     console.log('  req.query.query    = ' + req.query.query);
//     console.log('  ');

//     let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/search'
//         + '?q=' + req.query.query + '*';

//     console.log(url);

//     axios.get(url, {
//         headers : req.session.headers
//     }).then(function(response) {
//         sendResponse(req, res, response, false);
//     }).catch(function(error) {
//         console.log(error);
//         sendResponse(req, res, error.response, true);
//     });
    


// });



/* ----- GET IMAGES USING CACHE ----- */
router.get('/image-cache', function(req, res) {
   
    console.log(' ');
    console.log('  /image-cache');
    console.log(' --------------------------------------------');
    console.log('  req.query.link     = ' + req.query.link);
    console.log('  req.query.fileName = ' + req.query.fileName);
    console.log();
   
    let url  = req.app.locals.vaultGatewayLink  + req.query.link + '/thumbnail';
    let path = 'public/cache/' + req.query.fileName + '.jpg';

    fs.stat('public/cache/' + req.query.fileName, function(err, stat) {

        if(err === null) {
            
            sendResponse(req, res, { 'data' : { 'url' : path } }, false);

        } else if(err.code == 'ENOENT') {

            axios.get(url, {
                headers          : req.session.headers,
                responseType     : 'arraybuffer',
                responseEncoding : 'binary'
            }).then(function(response) {
                fs.appendFileSync(path , response.data);
                sendResponse(req, res, { 'data' : { 'url' : '/cache/' + req.query.fileName + '.jpg' } }, false);
            }).catch(function(error) {
                sendResponse(req, res, error.response, true);
            });

        } else {
            console.log('Some other error: ', err.code);
            sendResponse(req, res, 'Undefined error', true);  
        }

    });
   
});



/* ----- PERFORM BASIC SEARCH (AND CONTINUE) ----- */
router.get('/search', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/search');
    console.log(' --------------------------------------------');
    console.log('  req.query.query             = ' + req.query.query);
    console.log('  req.query.placeholder       = ' + req.query.placeholder);
    console.log('  req.query.latestOnly        = ' + req.query.latestOnly);
    console.log('  req.query.releasedFilesOnly = ' + req.query.releasedFilesOnly);
    console.log('  req.query.releasedItemsOnly = ' + req.query.releasedItemsOnly);
    console.log('  req.query.extended          = ' + req.query.extended);
    console.log('  req.query.limit             = ' + req.query.limit);
    console.log('  req.query.sort              = ' + req.query.sort);
    console.log('  ');

    let placeholder       = (typeof req.query.placeholder       === 'undefined') ?   true : req.query.placeholder;
    let latestOnly        = (typeof req.query.latestOnly        === 'undefined') ?   true : req.query.latestOnly;
    let releasedFilesOnly = (typeof req.query.releasedFilesOnly === 'undefined') ?  false : req.query.releasedFilesOnly;
    let releasedItemsOnly = (typeof req.query.releasedItemsOnly === 'undefined') ?  false : req.query.releasedItemsOnly;
    let extended          = (typeof req.query.extended          === 'undefined') ?  false : req.query.extended;
    let limit             = (typeof req.query.limit             === 'undefined') ?    100 : req.query.limit;
    let sort              = (typeof req.query.sort              === 'undefined') ? 'Name' : req.query.sort;
    
    let query = (placeholder) ? '*' + req.query.query + '*' : req.query.query;
    
    let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/search-results'
        + '?limit=' + limit
        + '&sort=' + sort
        + '&q=' + query;


    let params = {
        'option[latestOnly]'        : latestOnly,
        'option[releasedFilesOnly]' : releasedFilesOnly,
        'option[releasedItemsOnly]' : releasedItemsOnly,
        'option[extendedModels]'    : extended
    }

    axios.get(url, {
        params  : params,
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        console.log(error);
        sendResponse(req, res, error.response, true);
    });
    
});
router.get('/continue-search', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/continue-search');
    console.log(' --------------------------------------------');;
    console.log('  req.query.next = ' + req.query.next);
    console.log('  ');

    let url = req.app.locals.vaultGatewayLink + req.query.next;

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        console.log(error);
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- PERFORM FILE SEARCH ----- */
router.get('/search-files', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/search-files');
    console.log(' --------------------------------------------');
    console.log('  req.query.query              = ' + req.query.query);
    console.log('  req.query.extended           = ' + req.query.extended);
    console.log('  req.query.properties         = ' + req.query.properties);
    console.log('  req.query.category           = ' + req.query.category);
    console.log('  req.query.checkedOutBy       = ' + req.query.checkedOutBy);
    console.log('  req.query.createdBy          = ' + req.query.createdBy);
    console.log('  req.query.state              = ' + req.query.state);
    console.log('  req.query.latestOnly         = ' + req.query.latestOnly);
    console.log('  req.query.releasedFilesOnly  = ' + req.query.releasedFilesOnly);
    console.log('  req.query.limit              = ' + req.query.limit);
    console.log('  req.query.sort               = ' + req.query.sort);
    console.log('  ');

    let extended          = (typeof req.query.extended          === 'undefined') ?  false : req.query.extended;
    let properties        = (typeof req.query.properties        === 'undefined') ?  'all' : req.query.properties;
    let category          = (typeof req.query.category          === 'undefined') ?     '' : req.query.category;
    let checkedOutBy      = (typeof req.query.checkedOutBy      === 'undefined') ?     '' : req.query.checkedOutBy;
    let createdBy         = (typeof req.query.createdBy         === 'undefined') ?     '' : req.query.createdBy;
    let state             = (typeof req.query.state             === 'undefined') ?     '' : req.query.state;
    let latestOnly        = (typeof req.query.latestOnly        === 'undefined') ?   true : req.query.latestOnly;
    let releasedFilesOnly = (typeof req.query.releasedFilesOnly === 'undefined') ?  false : req.query.releasedFilesOnly;
    let limit             = (typeof req.query.limit             === 'undefined') ?    100 : req.query.limit;
    let sort              = (typeof req.query.sort              === 'undefined') ? 'Name' : req.query.sort;
    
    let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/file-versions';

    let params = {
        limit                       : limit,
        sort                        : sort,
        q                           : req.query.query,
        'option[extendedModels]'    : extended,
        'option[latestOnly]'        : latestOnly,
        'option[releasedFilesOnly]' : releasedFilesOnly,
        'option[propDefIds]'        : properties
    }

    if('' !== category) params['option[CategoryName]']      = category;
    if('' !== category) params['option[CheckoutUserName]']  = checkedOutBy;
    if('' !== category) params['option[CreateUserName]']    = createdBy;
    if('' !== category) params['option[State]']             = state;

    axios.get(url, {
        params  : params,
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        console.log(error);
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- PERFORM ITEM SEARCH ----- */
router.get('/search-items', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/search-items');
    console.log(' --------------------------------------------');
    console.log('  req.query.query              = ' + req.query.query);
    console.log('  req.query.properties         = ' + req.query.properties);
    console.log('  req.query.latestOnly         = ' + req.query.latestOnly);
    console.log('  req.query.releasedItemsOnly  = ' + req.query.releasedItemsOnly);
    console.log('  req.query.limit              = ' + req.query.limit);
    console.log('  req.query.sort               = ' + req.query.sort);
    console.log('  ');

    let properties        = (typeof req.query.properties        === 'undefined') ?  'all' : req.query.properties;
    let latestOnly        = (typeof req.query.latestOnly        === 'undefined') ?   true : req.query.latestOnly;
    let releasedItemsOnly = (typeof req.query.releasedItemsOnly === 'undefined') ?  false : req.query.releasedItemsOnly;
    let limit             = (typeof req.query.limit             === 'undefined') ?    100 : req.query.limit;
    let sort              = (typeof req.query.sort              === 'undefined') ? 'Name' : req.query.sort;
    
    let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/item-versions';

    let params = {
        limit                       : limit,
        sort                        : sort,
        q                           : req.query.query,
        'option[latestOnly]'        : latestOnly,
        'option[releasedItemsOnly]' : releasedItemsOnly,
        'option[propDefIds]'        : properties
    }

    axios.get(url, {
        params  : params,
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        error.response.data.results = [];
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- PERFORM ADVANCED SEARCH ----- */
router.get('/search-advanced', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/search-advanced');
    console.log(' --------------------------------------------');
    console.log('  req.query.query    = ' + req.query.query);
    console.log('  req.query.limit    = ' + req.query.limit);
    console.log('  req.query.entities = ' + req.query.entities);
    console.log('  ');

    // console.log('aa');

    let limit = (typeof req.query.limit === 'undefined') ? 5 : req.query.limit;
    let latestOnly        = (typeof req.query.latestOnly        === 'undefined') ?  true : req.query.latestOnly;
    let releasedFilesOnly = (typeof req.query.releasedFilesOnly === 'undefined') ? false : req.query.releasedFilesOnly;
    let releasedItems     = (typeof req.query.releasedItems     === 'undefined') ? false : req.query.releasedItems;
    let extended          = (typeof req.query.extended          === 'undefined') ? false : req.query.extended;
    // let url   = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/advanced-search';
    let url   = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + ':advanced-search';
    // let url   = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/search-advanced';
    // let url   = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/search';
        // + '?limit=' + limit;
        // + '?q=' + req.query.query + '*';

    console.log(url);
    // https://c37cf4d3.vg.autodesk.com/AutodeskDM/Services/api/vault/v2/vaults/118:advanced-search
    // https://c37cf4d3.vg.autodesk.com/AutodeskDM/Services/api/vault/v2/vaults/118:advanced-search
    //              http://10.41.110.49/AutodeskDM/Services/api/vault/v2/vaults/101:advanced-search


    // console.log(req.query.entities);
    // console.log(req.query.query);


    let entities = (typeof req.query.entities === 'undefined') ? ['File'] : req.query.entities;
    
    
    console.log(entities);
    // [ 'File' ]


    console.log(req.query.query);
    // [ { property: '9', operator: 'Contains', value: '22' } ]


    let searchCriterias = [];

    for(let query of req.query.query) {

        searchCriterias.push({
            propertyDefinitionUrl: '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/property-definitions/' + query.property,
            // operator: query.operator,
            operator: 'IsExactly',
            searchString: query.value
        })

    }

    console.log(searchCriterias);
    /*
    [ { 
    propertyDefinitionUrl: '/AutodeskDM/Services/api/vault/v2/vaults/118/property-definitions/9',
    operator: 'IsExactly',
    searchString: '22'
    }] 
     */


    // operator
    // string
    // required
    // Represents the operator used for the search
    // Allowed values:
    // Unknown
    // Contains
    // DoesNotContain
    // IsExactly
    // IsEmpty
    // :
    // File
    // Folder
    // Item
    // ChangeOrder

    // let data = {
    //     // entityTypesToSearch : entities,
    //     // entityTypesToSearch : ['File'],
    //     entityTypesToSearch : ['File'],
    //     searchCriterias     : searchCriterias,
    //     foldersToSearch: [
    //         '/AutodeskDM/Services/api/vault/v2/vaults/118/folders/1'
    //     //     '/AutodeskDM/Services/api/vault/v2/vaults/118/folders/2'
    //       ],
    //     sortCriterias: [
    //         {
    //           "propertyDefinitionUrl": "/AutodeskDM/Services/api/vault/v2/vaults//property-definitions/9",
    //           "ascending": true
    //         }
    //       ]
    // }

    // let params = {
    //     limit : limit
    // }


/*

http://10.41.110.49/AutodeskDM/Services/api/vault/v2/vaults/101:advanced-search
?cursorState=&option%5BsearchSubFolders%5D=false&option%5BreleasedFilesOnly%5D=false&option%5BreleasedItemsOnly%5D=false&option%5BlatestOnly%5D=true&option%5BextendedModels%5D=true&option%5BpropDefIds%5D=all

*/


    let data = {
        "entityTypesToSearch":["Item"],
        "searchCriterias":[{
                "propertyDefinitionUrl":"/AutodeskDM/Services/api/vault/v2/vaults/" + req.session.vaultId + "/property-definitions/56",
                "operator":"Contains",
                "searchString":"1918"
        }],
        "sortCriterias":[{
            "propertyDefinitionUrl":"/AutodeskDM/Services/api/vault/v2/vaults/" + req.session.vaultId + "/property-definitions/30",
            "ascending":true
        }]
    }

    console.log(data);
    /*
    {
    entityTypesToSearch: [ 'File' ],
    searchCriterias: [
        {
        propertyDefinitionUrl: '/AutodeskDM/Services/api/vault/v2/vaults/118/property-definitions/9',
        operator: 'IsExactly',
        searchString: '22'
        }
    ]
    }
    */


    // console.log(params);
    //  { limit: '3' }


    let params = {
        // 'cursorState' : '1',
        // 'limit' : limit,
        // 'option[latestOnly]'        : latestOnly,
        // 'option[releasedFilesOnly]' : releasedFilesOnly,
        // 'option[releasedItemsOnly]' : releasedItems,
        // 'option[extendedModels]'    : extended
        cursorState : ''
        // 'option[searchSubFolders]': false,
        // 'option[releasedFilesOnly]': false,
        // 'option[releasedItemsOnly]': false,
        // 'option[latestOnly]': true,
        // 'option[extendedModels]': true,
        // 'option[propDefIds]': 'all'
    }
    console.log(params);


// url += "?cursorState=&option%5BsearchSubFolders%5D=false&option%5BreleasedFilesOnly%5D=false&option%5BreleasedItemsOnly%5D=false&option%5BlatestOnly%5D=true&option%5BextendedModels%5D=true&option%5BpropDefIds%5D=all";


    // axios({
    //     method: 'POST',
    //     url: url,
    //     // data : data,
    //     // params: {limit: '20'},
    //     // params : params,
    //     headers: req.session.headers
    // axios.post({
    axios({
        // url, 
        // { data : data}, {
        method: 'POST',
        url: url,
        data : data,
        // params: {limit: '20'},
        params : params,
        headers: req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        console.log(error);
        console.log(error.response.data);
        console.log(error.response.status);
        sendResponse(req, res, error.response, true);
    });


// const options = {
//     // url, 
//     // { data : data}, {
//     method: 'POST',
//     url: url,
//     data : data,
//     // params: {limit: '20'},
//     params : params,
//     headers: req.session.headers
// };

//     try {
//         const { data } = axios.request(options);
//         console.log(data);
//       } catch (error) {
//         console.error(error);
//       }
    
});



/* ----- GET ROOT FOLDERS ----- */
router.get('/root-folders', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/root-folders');
    console.log(' --------------------------------------------');
    console.log('  req.session.vaultId  = ' + req.session.vaultId);
    console.log('  ');

    let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/folders/1/sub-folders';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        console.log(error);
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- GET FOLDER SUBFOLDERS ----- */
router.get('/subfolders', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/subfolders');
    console.log(' --------------------------------------------');
    console.log('  req.query.link  = ' + req.query.link);
    console.log('  ');

    let url = req.app.locals.vaultGatewayLink + req.query.link + '/sub-folders';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        console.log(error);
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- GET FOLDER CONTENTS ----- */
router.get('/folder-contents', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/folder-contents');
    console.log(' --------------------------------------------');
    console.log('  req.query.link  = ' + req.query.link);
    console.log('  req.query.includeFolders  = ' + req.query.includeFolders);
    console.log('  ');


    let includeFolders = (typeof req.query.includeFolders === 'undefined') ? true : req.query.includeFolders;

    let url = req.app.locals.vaultGatewayLink + req.query.link + '/contents';
        url += '?includeFolders=' + includeFolders;

        console.log(url);


    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        console.log(error);
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- GET FOLDER PROPERTIES ----- */
router.get('/folder-properties', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/folder-properties');
    console.log(' --------------------------------------------');
    console.log('  req.query.link  = ' + req.query.link);
    console.log('  ');

    let url = req.app.locals.vaultGatewayLink + req.query.link;

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- GET ALL FILES ----- */
router.get('/files', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/files');
    console.log(' --------------------------------------------');
    console.log('  ');

    let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/files';

    console.log(req.session.headers);

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- GET FILE PROPERTIES ----- */
router.get('/file-properties', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/file-properties');
    console.log(' --------------------------------------------');
    console.log('  req.query.link   = ' + req.query.link);
    console.log('  req.query.fileId = ' + req.query.fileId);
    console.log('  ');


    // console.log(vaultId);

    let link = (typeof req.query.link !== 'undefined') ? req.query.link : '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/file-versions/' + req.query.fileId;
    let url = req.app.locals.vaultGatewayLink + link;

    console.log(url);

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- GET FILE THUMBNAIL ----- */
router.get('/file-thumbnail', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/file-thumbnail');
    console.log(' --------------------------------------------');
    console.log('  req.query.url  = ' + req.query.url);
    console.log('  ');

    let url = req.app.locals.vaultGatewayLink + req.query.url + '/thumbnail';

    axios.get(url, {
        headers          : req.session.headers,
        responseType     : 'arraybuffer',
        responseEncoding : 'binary'
    }).then(function(response) {

        fs.appendFileSync('public/cache/raw.jpg' , response.data);
        // response.data = Buffer.from(response.data, 'binary').toString('base64');

        // fs.appendFileSync('public/cache/rw.jpg' , response.data);

        // console.log(test);

        response.data = response.data.toString('base64');

        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- GET FILE VISUALIZATION ATTACHMENT ----- */
router.get('/file-visualization-attachment', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/file-visualization-attachment');
    console.log(' --------------------------------------------');
    console.log('  req.query.link  = ' + req.query.link);
    console.log('  ');

    let url = req.app.locals.vaultGatewayLink + req.query.link + '/visualization-attachment';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        console.log(error);
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- DOWNLOAD FILE ----- */
router.get('/download', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/download');
    console.log(' --------------------------------------------');
    console.log('  req.query.link  = ' + req.query.link);
    console.log('  ');
    
    let url = req.app.locals.vaultGatewayLink + req.query.link + '/signedurl';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        response.data.link = req.app.locals.vaultGatewayLink + response.data.url;
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- GET FILE VIEWABLE ----- */
router.get('/session', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/session');
    console.log(' --------------------------------------------');
    console.log('  ');

    console.log(req.session);
    sendResponse(req, res, { data : req.session.headers }, false);
    
});
router.get('/viewable', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/viewable');
    console.log(' --------------------------------------------');
    console.log('  req.query.link  = ' + req.query.link);
    console.log('  ');

    // let url = req.app.locals.vaultGatewayLink + req.query.link + '/svf/bubble.json?allowSync=true&ext=.dwfx';
    // let url = req.app.locals.vaultGatewayLink + req.query.link + '/svf/bubble.json?ext=.dwfx';
    // let url = req.app.locals.vaultGatewayLink + req.query.link + '/svf/bubble.json?domain=http%3A%2F%2F10.41.110.49&ext=.dwf&allowSync=true';
    // let url = req.app.locals.vaultGatewayLink + req.query.link + '/svf/1/0.pf?domain=http%3A%2F%2F10.41.110.49&ext=.dwf&allowSync=true';
    let url = req.app.locals.vaultGatewayLink + req.query.link + '/svf/bubble.json?allowSync=true&ext=.dwfx';
    // // let url = req.app.locals.vaultGatewayLink + req.query.link + '/content?allowSync=false';


    // FUNKTOINIERT
    // https://e475f532.vg.autodesk.com/AutodeskDM/Services/api/vault/v2/vaults/101/file-versions/38851/svf/1/0.pf?domain=http%3A%2F%2F10.41.110.49&ext=.dwf&allowSync=true


    // console.log(req.session);
    // sendResponse(req, res, { data : req.session.headers }, false);

    // console.log(url);
    // console.log(req.session.headers);

//https://51630d9c.vg-stg.autodesk.com/AutodeskDM/Services/api/vault/v2/vaults/101/file-versions/61985/visualization-attachment
//                                    /AutodeskDM/Services/api/vault/v2/vaults/101/file-versions/{id}/visualization-attachment


    ///AutodeskDM/Services/api/vault/v2
// /vaults/{vaultId}/file-versions/{id}/visualization-attachment

    // let headers = getCustomHeaders(req);
    //     headers.Accept = 'application/octet-stream, application/json';

    // console.log(headers);

    // let params = { 
    //     id : "38005",
    //     name : 'Motor.iam'
    // };

    // let fileName = '1.pf';

    axios.get(url, {
        
        headers : req.session.headers
    }).then(function(response) {

        console.log(response.data);

        // console.log(response.data);

        // fs.appendFileSync('public/cache/' + fileName, response.data);

    //     // // response.data = Buffer.from(response.data, 'binary').toString('base64');

    //     // // console.log(test);

        sendResponse(req, res,response, false);

    //     // res.send(response.data);

    }).catch(function(error) {
        console.log(error);
        sendResponse(req, res, error.response, true);
    });
    
});
router.get('/file-viewable', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/file-viewable');
    console.log(' --------------------------------------------');
    console.log('  req.query.link  = ' + req.query.link);
    console.log('  ');

    // let url = req.app.locals.vaultGatewayLink + req.query.link + '/svf/bubble.json?allowSync=true&ext=.dwfx';
    // let url = req.app.locals.vaultGatewayLink + req.query.link + '/svf/bubble.json?ext=.dwfx';
    // let url = req.app.locals.vaultGatewayLink + req.query.link + '/svf/bubble.json?domain=http%3A%2F%2F10.41.110.49&ext=.dwf&allowSync=true';
    let url = req.app.locals.vaultGatewayLink + req.query.link + '/svf/1/0.pf?domain=http%3A%2F%2F10.41.110.49&ext=.dwf&allowSync=true';
    // let url = req.app.locals.vaultGatewayLink + req.query.link + '/svf/bubble.json';
    // let url = req.app.locals.vaultGatewayLink + req.query.link + '/content?allowSync=false';

    console.log(url);
    // console.log(req.session.headers);

//https://51630d9c.vg-stg.autodesk.com/AutodeskDM/Services/api/vault/v2/vaults/101/file-versions/61985/visualization-attachment
//                                    /AutodeskDM/Services/api/vault/v2/vaults/101/file-versions/{id}/visualization-attachment


    ///AutodeskDM/Services/api/vault/v2
// /vaults/{vaultId}/file-versions/{id}/visualization-attachment

    // let headers = getCustomHeaders(req);
    //     headers.Accept = 'application/octet-stream, application/json';

    // console.log(headers);

    // let params = { 
    //     id : "38005",
    //     name : 'Motor.iam'
    // };

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {

        console.log(response);

        // response.data = Buffer.from(response.data, 'binary').toString('base64');

        // console.log(test);

        // sendResponse(req, res, response, false);

        res.send(response.data);

    }).catch(function(error) {
        console.log(error);
        sendResponse(req, res, error.response, true);
    });
    
});

router.get('/viewable/:vaultId/:fileVersionId/:fileName', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/viewable');
    console.log(' --------------------------------------------');
    console.log('  req.params.vaultId  = ' + req.params.vaultId);
    console.log('  req.params.fileVersionId  = ' + req.params.fileVersionId);
    console.log('  req.params.fileName  = ' + req.params.fileName);
    console.log('  ');

    let fileName = req.params.fileName;


// 'https://e475f532.vg.autodesk.com/AutodeskDM/Services/api/vault/v2/vaults/101/file-versions/38851/svf/1/0.pf?domain=http%3A%2F%2F10.41.110.49&ext=.dwf&allowSync=true',


    // let url = req.app.locals.vaultGatewayLink + req.query.link + '/svf/bubble.json?allowSync=true&ext=.dwfx';
    // let url = req.app.locals.vaultGatewayLink + req.query.link + '/svf/bubble.json?ext=.dwfx';
    // let url = req.app.locals.vaultGatewayLink + req.query.link + '/svf/bubble.json?domain=http%3A%2F%2F10.41.110.49&ext=.dwf&allowSync=true';
    // let url = req.app.locals.vaultGatewayLink + req.query.link + '/svf/1/0.pf?domain=http%3A%2F%2F10.41.110.49&ext=.dwf&allowSync=true';
    // let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.params.vaultId + '/file-versions/' + req.params.fileVersionId + '/svf/1/' + fileName + '?domain=http%3A%2F%2F10.41.110.49&ext=.dwf&allowSync=true';
    // let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.params.vaultId + '/file-versions/' + req.params.fileVersionId + '/svf/1/' + fileName + '?ext=.dwf&allowSync=true';
    let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.params.vaultId + '/file-versions/' + req.params.fileVersionId + '/svf/1/' + fileName + '?ext=.dwf';
    // let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.params.vaultId + '/file-versions/' + req.params.fileVersionId + '/svf/1/0.pf?domain=http%3A%2F%2F10.41.110.49&ext=.dwf&allowSync=true';
    // let url = req.app.locals.vaultGatewayLink + req.query.link + '/svf/bubble.json';
    // let url = req.app.locals.vaultGatewayLink + req.query.link + '/content?allowSync=false';

    console.log(url);
    // console.log(req.session.headers);

//https://51630d9c.vg-stg.autodesk.com/AutodeskDM/Services/api/vault/v2/vaults/101/file-versions/61985/visualization-attachment
//                                    /AutodeskDM/Services/api/vault/v2/vaults/101/file-versions/{id}/visualization-attachment


    ///AutodeskDM/Services/api/vault/v2
// /vaults/{vaultId}/file-versions/{id}/visualization-attachment

    // let headers = getCustomHeaders(req);
    //     headers.Accept = 'application/octet-stream, application/json';

    // console.log(headers);

    // let params = { 
    //     id : "38005",
    //     name : 'Motor.iam'
    // };

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {

        // console.log(response);

        // response.data = Buffer.from(response.data, 'binary').toString('base64');

        // console.log(test);

        // sendResponse(req, res, response, false);

        // res.raw(response.data);

        
        // if(fileName === '0.svf')  res.json({});
        // else {

        console.log(fileName);

        // console.log(response);

        console.log('----1------');

        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-disposition': 'attachment; filename=' + fileName
          });
          res.write(response.data);
          res.end();

          console.log('----2------');

        // }


    }).catch(function(error) {
        console.log(error);
        sendResponse(req, res, error.response, true);
    });
    
});



/* ----- GET FILE BOM ----- */
router.get('/file-bom', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/file-bom');
    console.log(' --------------------------------------------');
    console.log('  req.query.link     = ' + req.query.link);
    console.log('  req.query.limit    = ' + req.query.limit);
    console.log('  req.query.recurse  = ' + req.query.recurse);
    console.log('  req.query.fullModels  = ' + req.query.fullModels);
    console.log('  ');

    let limit       = (typeof req.query.limit      === 'undefined') ? 100   : req.query.limit;
    let recurse     = (typeof req.query.recurse    === 'undefined') ? false : req.query.recurse;
    let fullModels  = (typeof req.query.fullModels === 'undefined') ? false : req.query.fullModels;
    
    let url = req.app.locals.vaultGatewayLink + req.query.link + '/uses'

    let params = {
        limit                : limit,
        'option[recurse]'    : recurse,
        'option[fullModels]' : fullModels,
    }

    axios.get(url, {
        params  : params,
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});





/* ----- GET ITEM FILES ----- */
router.get('/item-files', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/item-files');
    console.log(' --------------------------------------------');
    console.log('  req.query.itemId = ' + req.query.itemId);
    console.log('  req.query.link   = ' + req.query.link);
    console.log('  ');

    let link = (typeof req.query.link === 'undefined') ? '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/item-versions/' + req.query.itemId : req.query.link;
    let url  = req.app.locals.vaultGatewayLink + link + '/associated-files';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});




/* ----- GET CHANGE ORDERS ----- */
router.get('/change-orders', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/change-orders');
    console.log(' --------------------------------------------');
    console.log('  ');

    let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/change-orders';

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


/* ----- GET CHANGE ORDER ----- */
router.get('/change-order', function(req, res, next) {
    
    console.log(' ');
    console.log('  /vault/change-order');
    console.log(' --------------------------------------------');
    console.log('  req.query.id  = ' + req.query.id);
    console.log('  ');

    let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults/' + req.session.vaultId + '/change-orders/' + req.query.id;

    axios.get(url, {
        headers : req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);
    });
    
});


module.exports = router;