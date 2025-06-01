// Inser PLM Users selector
function insertUsers(params) {

    if(isBlank(params)) params = {};

    let id = isBlank(params.id) ? 'users' : params.id;

    let panelSettings = getPanelSettings('', params, {
        headerLabel : 'Users',
        contentSize : 'm',
        layout      : 'table'
    }, [ ]);

    settings.users[id] = panelSettings;
    settings.users[id].load = function() { insertUsersData(id); }

    genPanelTop(id, panelSettings, 'users');
    genPanelHeader(id, panelSettings);
    genPanelSelectionControls(id, panelSettings);
    genPanelSearchInput(id, panelSettings);
    genPanelResizeButton(id, panelSettings);
    genPanelReloadButton(id, panelSettings);
    genPanelContents(id, panelSettings);

    insertUsersDone(id);

    panelSettings.load();

}
function insertUsersDone(id) {}
function insertUsersData(id) {

    let panelSettings = settings.users[id];
        panelSettings.timestamp = startPanelContentUpdate(id);

    $.get('/plm/users', { 
        bulk       : false,
        activeOnly : true, 
        mappedOnly : true,
        timestamp  : panelSettings.timestamp
    }, function(response) {

        if(stopPanelContentUpdate(response, panelSettings)) return;
        
        for(let user of response.data.items) {
            user.displayName = (user.displayName === ' ') ? user.email : user.displayName;
        }

        let users = [];

        let columns = [
            { displayName : 'User'         , fieldId : 'user'        },
            { displayName : 'First Name'   , fieldId : 'firstName'   },
            { displayName : 'Last Name'    , fieldId : 'lastName'    },
            { displayName : 'Organization' , fieldId : 'organization'},
            { displayName : 'Address'      , fieldId : 'address'     },
            { displayName : 'City'         , fieldId : 'city'        },
            { displayName : 'Country'      , fieldId : 'country'     },
            { displayName : 'Last Login'   , fieldId : 'lastLogin'   },
            { displayName : 'Image'        , fieldId : 'image'       }
        ]

        for(let column of columns) {
            if(includePanelTableColumn(column.displayName, panelSettings, panelSettings.columns.length)) {
                panelSettings.columns.push(column);
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

                users.push({
                    link      : user.email,
                    imageLink : user.image.large,
                    title     : user.displayName,
                    subtitle  : 'Last Login at ' + lastLogin.toLocaleDateString(),
                    details   : '',
                    data      : [
                        { fieldId : 'user', value : user.displayName},
                        { fieldId : 'firstName', value : user.firstName},
                        { fieldId : 'lastName', value : user.lastName},
                        { fieldId : 'organization', value : user.organization},
                        { fieldId : 'country', value : user.country},
                        { fieldId : 'city', value : user.city},
                        { fieldId : 'address', value : user.address1},
                        { fieldId : 'lastLogin', value : lastLogin.toLocaleDateString()},
                        { fieldId : 'image', value : image}
                    ]
                });

            }

        }

        finishPanelContentUpdate(id, panelSettings, users);
        insertUsersDataDone(id, response);

    })

}
function insertUsersDataDone(id, response) {};