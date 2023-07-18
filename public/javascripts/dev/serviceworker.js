if('serviceWorker' in navigator){
    
    //register the service worker
    navigator.serviceWorker.register('/sw.js').then(function(result){
        console.log('Service Worker Registered');
        console.log('Scope: ' + result.scope);
        // subscribeToPush();
        /*
        if('Notification' in window){
            console.log('Notifications Supported');
            Notification.requestPermission(function(status){
                console.log('Notification Status: ', status);
            });
            var options = {
                body: 'See What\'s New',
                icon: 'android-chrome-192x192.png',
                data: {
                    timestamp: Date.now(),
                    loc: 'index.html#info'
                },
                actions: [
                    {action: 'go', title: 'Go Now'}
                ]
            };
            notify('NCC Computer Science', options);
        }
        */
    }, function(error){
        console.log('Service Worker Regiatration Failed');
        console.log(error);
    });
}else{
    console.log('Service Workers Not Supported');
}