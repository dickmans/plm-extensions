const express       = require('express');
const router        = express.Router();
const axios         = require('axios');
const querystring   = require('querystring');
const fs            = require('fs');
const fileUpload    = require('express-fileupload');
const FormData      = require('form-data');
const { Console }   = require('console');
const pathUploads   = 'uploads/';
const urlGraphQL    = 'https://developer.api.autodesk.com/mfg/v3/graphql/public';

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

    let params = [];

    if((typeof req.body !== 'undefined')) {
        if(JSON.stringify(req.body).length > 2) {
            params = req.body;
        } else params = req.query;
    } else params = req.query;

    let result = {
        params    : params,
        url       : req.url,
        data      : [],
        status    : '',
        message   : '',
        error     : error       
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

    console.log(url);

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



/* ----- GET MODEL PROPERTIES ----- */
router.post('/properties', function(req, res, next) {
    
    console.log(' ');
    console.log('  /properties');
    console.log(' --------------------------------------------');
    console.log('  req.body.modelId = ' + req.body.modelId);
    console.log();


    axios.post(urlGraphQL, {
        query : `query GetModelProperties($modelId: ID!) {
            model(modelId: $modelId) {
                id
                name{
                    value
                }

                component{
                    id
                    customProperties {
                    results {
                        value
                        displayValue
                        definition {
                            id
                            name
                            specification
                            isHidden
                            isReadOnly
                            isArchived
                            description
                            propertyBehavior
                            units {
                                id
                                name
                            }
                        }
                    }
                }
                baseProperties {
                    results {
                        value
                        displayValue
                        definition {
                            id
                            name
                            specification
                            isHidden
                            isReadOnly
                            isArchived
                            description
                            propertyBehavior
                            units {
                                id
                                name
                            }
                        }
                    }
                }
            }
        }
        }`,
        variables : {
            modelId : req.body.modelId
        }
    },{
         headers: req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);      
    });
    
});



/* ----- GET MODEL DETAILS ----- */
router.post('/model', function(req, res, next) {
    
    console.log(' ');
    console.log('  /details');
    console.log(' --------------------------------------------');
    console.log('  req.body.modelId = ' + req.body.modelId);
    console.log();


    axios.post(urlGraphQL, {
        query : `query GetModel($modelId: ID!) {
                model(modelId: $modelId) {
                    id
                    name {
                        value
                    }
                    designItem{
                        id
                        name
                        extensionType
                    }
                    thumbnail {
                        status
                        signedUrl
                    }
                    component {
                        id
                        name {
                            value
                        }
                        partNumber {
                            value
                        }
                        description {
                            value
                        }
                    }
                }
            }`,
        variables : {
            modelId : req.body.modelId
        }

    // `query GetHubs {
    //        hubs{
    //            results {
    //                id
    //                name
    //                alternativeIdentifiers{
    //                    dataManagementAPIHubId
    //                }
    //            }
    //        }
    //  }`

    },{
         headers: req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);      
    });
    
});



/* ----- GET COMPONENT DETAILS ----- */
router.post('/component', function(req, res, next) {
    
    console.log(' ');
    console.log('  /component');
    console.log(' --------------------------------------------');
    console.log('  req.body.componentId = ' + req.body.componentId);
    console.log();


    axios.post(urlGraphQL, {
        query : `query GetComponent($componentId: ID!) {
            component (componentId: $componentId) {
                id
                name {
                    value
                }
                itemNumber {
                    id
                    schema {
                        id
                        name
                    }
                }
                lifecycle {
                    itemUrl
                    itemUrn
                    itemState {
                        value
                    }
                    eco {
                        id
                        ecoUrl
                        affectedByProperty {
                            name
                            value
                        }
                    }
                    state {
                        value
                    }
                }     
                customProperties {
                    results {
                        value
                        displayValue
                        definition {
                            id
                            name
                            specification
                            isHidden
                            isReadOnly
                            isArchived
                            description
                            localizedName
                            propertyBehavior
                            units {
                                id
                                name
                            }
                        }
                    }
                }
                baseProperties {
                    results {
                        name
                        value
                        displayValue
                        definition {
                            id
                            name
                            specification
                            isHidden
                            isReadOnly
                            isArchived
                            description
                            localizedName
                            propertyBehavior
                            units {
                                id
                                name
                            }
                        }
                    }
                }   
                bomStructureTypeProperty {
                    value
                    name
                    definition {
                    id
                    name
                    propertyBehavior
                    }
                }        
                hasChildren
                isTip

            }
        }`,
        variables : {
            componentId : req.body.componentId
        }
    },{
         headers: req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);      
    });
    
});



/* ----- GET COMPONENT BOM ----- */
router.post('/component-bom', function(req, res, next) {
    
    console.log(' ');
    console.log('  /component-bom');
    console.log(' --------------------------------------------');
    console.log('  req.body.componentId = ' + req.body.componentId);
    console.log('  req.body.revisionBias = ' + req.body.revisionBias);
    console.log();


    axios.post(urlGraphQL, {
        query : `query CDE_BOM_GetComponentStructure($componentId: ID!, $composition: BOMCompositionEnum!, $time: DateTime, $cursor: String, $fetchBomStructureType: Boolean = false) {
                component(componentId: $componentId, composition: $composition, time: $time) {
                    ...ComponentStructure
                    ...BomRelations
                }
            }

            fragment OverrideableProperty on Property {
                name
                value
                displayValue
                definition {
                 id
                }
            }

            fragment ComponentStructure on Component {
                id
                timestamp
                composition
                hasChildren
                componentState
                baseProperties {
                    results {
                        name
                        displayValue
                    }
                }
                name {
                    value
                }
                version {
                    id
                    description
                    releaseState
                }
                isTip
                isWritableByUser
                bomStructureTypeProperty @include(if: $fetchBomStructureType) {
                    value
                    displayValue
                }
            }

            fragment BomRelations on Component {
                bomRelations(depth: 1, pagination: {cursor: $cursor}) {
                    pagination {
                        cursor
                    }
                    results {
                        id
                        quantityProperty {
                            ...OverrideableProperty
                        }
                        sequenceNumber
                        fromComponent {
                            id
                        }
                        toComponent {
                            ...ComponentStructure
                        }
                        toComponentState
                    }
            }
        }`,
        // query : `query GetBomRelationsWithState($componentId: ID!, $composition: BOMCompositionEnum!, $time: DateTime, $cursor: String) {
        //     component(componentId: $componentId, composition: $composition, time: $time) {
        //         ComponentStructure bomRelations(depth: 1, pagination: { cursor: $cursor }) {
        //             pagination {
        //                 cursor
        //             } 
        //             results {
        //                 id
        //                 sequenceNumber
        //                 fromComponent {
        //                     id 
        //                     componentState
        //                 }
        //                 toComponent {
        //                     ComponentStructure
        //                 } 
        //                 toComponentState

        //             }

        //         }

        //     }

        //     }

        // fragment ComponentStructure on Component {
        //     id
        //     timestamp
        //     composition
        //     hasChildren
        //     componentState
        //     name {
        //         value
        //     } 
        //     isTip 
        // }`,
        variables : {
            componentId : req.body.componentId,
            composition : req.body.revisionBias,
            cursor : null,
            fetchBomStructureType :  true,
            time : null
        }
    },{
         headers: req.session.headers
    }).then(function(response) {
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);      
    });



            // query : `query GetComponent($componentId: ID!) {
        //     component (componentId: $componentId) {
        //         id
        //         name {
        //             value
        //         }
        //         description {
        //             displayValue
        //         }
        //         materialName {
        //             displayValue
        //         }
        //         partNumber {
        //             displayValue
        //         }
        //         itemNumber {
        //             id
        //             schema {
        //                 id
        //                 name
        //             }
        //         }
        //         lifecycle {
        //             itemUrl
        //             itemUrn
        //             itemState {
        //                 value
        //             }
        //             eco {
        //                 id
        //                 ecoUrl
        //                 affectedByProperty {
        //                     name
        //                     value
        //                 }
        //             }
        //             state {
        //                 value
        //             }
        //         }     
        //         revision {
        //             createdOn
        //             effectiveOn
        //             lastModifiedOn
        //         }
        //         componentState
        //         customProperties {
        //             results {
        //                 value
        //                 displayValue
        //                 definition {
        //                     id
        //                     name
        //                     specification
        //                     isHidden
        //                     isReadOnly
        //                     isArchived
        //                     description
        //                     localizedName
        //                     propertyBehavior
        //                     units {
        //                         id
        //                         name
        //                     }
        //                 }
        //             }
        //         }
        //         baseProperties {
        //             results {
        //                 name
        //                 value
        //                 displayValue
        //                 definition {
        //                     id
        //                     name
        //                     specification
        //                     isHidden
        //                     isReadOnly
        //                     isArchived
        //                     description
        //                     localizedName
        //                     propertyBehavior
        //                     units {
        //                         id
        //                         name
        //                     }
        //                 }
        //             }
        //         }   
        //         allProperties {
        //             results {
        //                 name
        //                 displayValue
        //                 definition {
        //                     isReadOnly
        //                     localizedName
        //                     units {
        //                         id
        //                         name
        //                     }
        //                 }
        //             }
        //         }
        //         bomStructureTypeProperty {
        //             value
        //             name
        //             definition {
        //             id
        //             name
        //             propertyBehavior
        //             }
        //         }      
        //         version {
        //             id
        //         }  
        //         hasChildren
        //         isTip



        //     }
    
});



/* ----- GET BOM TREE ----- */
router.post('/bom', function(req, res, next) {
    
    
    console.log(' ');
    console.log('  /bom');
    console.log(' --------------------------------------------');
    console.log('  req.body.modelId = ' + req.body.modelId);
    console.log();


    axios.post(urlGraphQL, {
        query : `query GetModel($modelId: ID!) {
                model(modelId: $modelId) {
                    id
                    name {
                        value
                        displayValue
                    }
                    designItem{
                        id
                        name
                        extensionType
                    }
                    thumbnail {
                        status
                        signedUrl
                    }
                    assemblyRelations {
                        results {
                            createdOn
                            fromModel {
                                id
                                name {
                                    name
                                    displayValue
                                }
                            }
                            toModel {
                                id
                                name {
                                    name
                                    displayValue
                                }
                            }
                        }
                    }
                }
            }`,
        variables : {
            modelId : req.body.modelId
        }
    },{
         headers: req.session.headers
    }).then(function(response) {
        let bomPartsList = getBOMPartsList(response.data, [], false);
        response.data.bomPartsList = bomPartsList;
        sendResponse(req, res, response, false);
    }).catch(function(error) {
        sendResponse(req, res, error.response, true);      
    });
    
});

function getBOMPartsList(data, fields, hideRoot) {

    console.log('getBOMPartsList START');

    if(isBlank(hideRoot)) hideRoot = false;

    let parts   = [];

    // for(let field of fields) {
    //     if(field.fieldId === 'QUANTITY') {
    //         urns.quantity = field.__self__.urn;
    //     } else if(field.fieldId === 'NUMBER') {
    //         urns.partNumber = field.__self__.urn;
    //     }
    //     if(!isBlank(selectItems)) {
    //         if(field.fieldId === selectItems.fieldId) urns.selectItems = field.__self__.urn;
    //     }
    // }

    let node = { 
        quantity      : '0',
        partNumber    : data.data.model.name.displayValue,
        linkParent    : '',
        level         : 0,
        link : '/////////',
        parent        : '',
        parents       : [],
        fields        : [],
        edgeId        : null,
        number        : null,
        numberPath    : '',
        details       : {},
        totalQuantity : 0,
        hasChildren   : false
    }

    node.path = node.partNumber;

    console.log(node.path);

    // for(let relationship of data.nodes) {
    //     if(bomNode.item.urn === urnRoot) {
    //         insertBOMPartDetails(fields, node, bomNode, null);
    //         break;
    //     }
    // }

    if(!hideRoot) parts.push(node);

    getBOMParts(fields, data.data.model, data.data.model.id, parts, 1.0, 1, '', [node.partNumber]);

    console.log(parts);

    return parts;

}
function getBOMParts(fields, model, parentId, parts, quantity, level, numberPath, parents) {

    let result = { hasChildren : false };

    let number = 1;

    for(let relationship of model.assemblyRelations.results) {

        // let edge = edges[i];



        if(relationship.fromModel.id === parentId) {

            console.log('found rel');

            // if(i === iEdge + 1) iEdge = i;

            let node = { 
                id : relationship.toModel.id,
                quantity    : 0,
                partNumber  : relationship.toModel.name.displayValue,
                // linkParent  : edge.edgeLink.split('/bom-items')[0],
                level       : level,
                parent      : parents[parents.length - 1],
                parents     : parents.slice(),
                fields      : [],
                link : '/////////',
                // edgeId      : edge.edgeId,
                number      : number++,
                numberPath  : numberPath + number,
                details     : { name :relationship.toModel.name.displayValue }
            }

            console.log('next');

            node.totalQuantity = node.quantity * quantity;

            // node.path = node.parents.map(function(parent) {
            //     return parent;
            // }).join('|') + '|' + node.partNumber;

            result.hasChildren = true;

            // for(let bomNode of nodes) {

            //     if(bomNode.item.urn === edge.child) {
            //         insertBOMPartDetails(fields, node, bomNode, edge);
            //         break;
            //     }
            // }

            // if(!isBlank(selectItems)) {      
            //     if(selectItems.hasOwnProperty('values')) {
            //         let selectValue = getBOMCellValue(edge.child, urns.selectItems, nodes);
            //         if(selectValue === '') selectValue = getBOMEdgeValue(edge, urns.selectItems, 'title', '');
            //         if(selectItems.values.includes(selectValue)) parts.push(node);
            //     } else parts.push(node);
            // } else {
                parts.push(node);
            // }

            console.log(parts.length);

            let nextParents = parents.slice();
                nextParents.push(node.partNumber);

        console.log(nextParents);

                // fields, model, parentId, parts, quantity, level, numberPath, parents

    console.log(node.id);

            // let nodeBOM = getBOMParts(fields, selectItems, iEdge, urns, parts, edge.child, edges, nodes, node.totalQuantity, level + 1, numberPath + edge.itemNumber + '.', nextParents);
            let nodeBOM = getBOMParts(fields, model, node.id, parts, node.totalQuantity, level + 1, numberPath + '1' + '.', nextParents);

            node.hasChildren = nodeBOM.hasChildren;

        }

    }

    return result;

}
function isBlank(value) {

    if(typeof value === 'undefined') return true;
    if(       value === null       ) return true;
    if(       value === ''         ) return true;

    return false;

}


module.exports = router;