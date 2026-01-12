// Inser PLM Users selector
function insertUsers(params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'users' : params.id;

    settings[id] = getPanelSettings('', params, {
        headerLabel : 'Users',
        contentSize : 'm',
        layout      : 'table'
    }, [ ]);

    settings[id].load = function() { insertUsersData(id); }

    genPanelTop              (id, settings[id], 'users');
    genPanelHeader           (id, settings[id]);
    genPanelSelectionControls(id, settings[id]);
    genPanelSearchInput      (id, settings[id]);
    genPanelResizeButton     (id, settings[id]);
    genPanelReloadButton     (id, settings[id]);
    genPanelContents         (id, settings[id]);

    insertUsersDone(id);

    settings[id].load();

}
function insertUsersDone(id) {}
function insertUsersData(id) {

    settings[id].timestamp = startPanelContentUpdate(id);

    $.get('/plm/users', { 
        bulk       : false,
        activeOnly : true, 
        mappedOnly : true,
        timestamp  : settings[id].timestamp
    }, function(response) {

        if(stopPanelContentUpdate(response, settings[id])) return;
        
        for(let user of response.data.items) {
            user.displayName = (user.displayName === ' ') ? user.email : user.displayName;
        }

        let users = [];

        let columns = [
            { displayName : 'User'         , fieldId : 'user'         },
            { displayName : 'First Name'   , fieldId : 'firstName'    },
            { displayName : 'Last Name'    , fieldId : 'lastName'     },
            { displayName : 'Organization' , fieldId : 'organization' },
            { displayName : 'Address'      , fieldId : 'address'      },
            { displayName : 'City'         , fieldId : 'city'         },
            { displayName : 'Country'      , fieldId : 'country'      },
            { displayName : 'Last Login'   , fieldId : 'lastLogin'    },
            { displayName : 'Image'        , fieldId : 'image'        }
        ]

        for(let column of columns) {
            if(includePanelTableColumn(column.fieldId, column.displayName, settings[id], settings[id].columns.length)) {
                settings[id].columns.push(column);
            }
        }

        sortArray(response.data.items, 'displayName');

        for(let user of response.data.items) {

            if(!user.tenantAdmin) {

                let lastLogin = new Date(user.lastLoginTime);
                let image     = '';
                
                if(!isBlank(user.image)) {
                    image = '<img src="' + user.image.large + '">';
                }

                if(isBlank(user.lastLoginTime)) {
                    lastLogin = 'Never logged in yet';
                } else lastLogin = lastLogin.toLocaleDateString();

                users.push({
                    link      : user.email,
                    imageLink : user.image.large,
                    title     : user.displayName,
                    subtitle  : (isBlank(user.lastLoginTime)) ? lastLogin : 'Last Login at ' + lastLogin,
                    details   : '',
                    data      : [
                        { fieldId : 'user', value : user.displayName},
                        { fieldId : 'firstName', value : user.firstName},
                        { fieldId : 'lastName', value : user.lastName},
                        { fieldId : 'organization', value : user.organization},
                        { fieldId : 'country', value : user.country},
                        { fieldId : 'city', value : user.city},
                        { fieldId : 'address', value : user.address1},
                        { fieldId : 'lastLogin', value : lastLogin},
                        { fieldId : 'image', value : image}
                    ]
                });

            }

        }

        finishPanelContentUpdate(id, settings[id], users);
        insertUsersDataDone(id, response);

    })

}
function insertUsersDataDone(id, response) {};