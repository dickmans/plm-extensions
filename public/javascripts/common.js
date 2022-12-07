let colorRange = ['#CE6565', '#E0AF4B', '#E1E154', '#90D847', '#3BD23B', '#3BC580', '#3BBABA', '#689ED4', '#5178C8', '#9C6BCE', '#D467D4', '#CE5C95'];

$(document).ready(function() {  
        
    setAvatar();

});



// Set user profile picture
function setAvatar() {

    let elemAvatar = $('#header-avatar');

    if(elemAvatar.length === 0) return;

    $.get( '/plm/me', {}, function(response) {

        let elemAvatar = $('#header-avatar');
            elemAvatar.addClass('no-icon');
            elemAvatar.html('');
            elemAvatar.css('background', 'url(' + response.data.image.medium + ')');
            elemAvatar.css('background-position', 'center');
            elemAvatar.css('background-size', '42px');

    });

}



// Sort array by defined key
function sortArray(array, key, type, direction) {

    if(typeof type      === 'undefined') type = 'string';
    if(typeof direction === 'undefined') type = 'ascending';

    if(direction === 'ascending') {

        array.sort(function(a, b){

            var nameA=a[key], nameB=b[key];

            if(type.toLowerCase() === 'string') nameA=a[key].toLowerCase(), nameB=b[key].toLowerCase()

            // var nameA=a[key].toLowerCase(), nameB=b[key].toLowerCase()
            if (nameA < nameB) //sort string ascending
                return -1 
            if (nameA > nameB)
                return 1
            return 0 //default return value (no sorting)
        });

    } else {

        array.sort(function(a, b){

            var nameA=a[key], nameB=b[key]

            if(type.toLowerCase() === 'string') nameA=a[key].toLowerCase(), nameB=b[key].toLowerCase()

            if (nameA > nameB) //sort string ascending
                return -1 
            if (nameA < nameB)
                return 1
            return 0 //default return value (no sorting)

        });

    }

}