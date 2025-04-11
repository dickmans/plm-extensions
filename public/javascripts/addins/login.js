$(document).ready(function() {

    appendProcessing('validation', false);
    validateVaultConnection();

});


function validateVaultConnection() {

    $.get('/vault/id', {}, function(response) {

        if(response.success) {
            $.get('/vault/connect', {}, function(response) {
                if(response.success) {
                    loginCompleted();
                } else {
                    $('#validation').hide();
                    $('#error-2').removeClass('hidden');
                }
            });
        } else {
            $('#validation').hide();
            $('#error-1').removeClass('hidden');
        }

    });

}