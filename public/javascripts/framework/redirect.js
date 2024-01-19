$(document).ready(function() {
    
    var newURL  = "https://developer.api.autodesk.com/authentication/v2/authorize";
        newURL += "?response_type=code";
        newURL += "&scope=data:read";
        newURL += "&client_id=" + clientId;
        newURL += "&redirect_uri=" + redirectUri;
        newURL += "&state=" + appUrl;

    window.location = newURL;
    
});