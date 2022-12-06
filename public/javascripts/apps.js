$(document).ready(function() {

    $(document).on([
        'webkitAnimationEnd',
        'mozAnimationEnd',
        'MSAnimationEnd',
        'oanimationend',
        'animationend'
        ].join(' '), function(e) {
            e.target.classList.add('active')
    });

    $('#job-small').click(function() {
        submitJob($(this), 'small');
    });
    $('#job-medium').click(function() {
        submitJob($(this), 'medium');
    });
    $('#job-large').click(function() {
        submitJob($(this), 'large');
    });

    $('#resupply').click(function() {
        if($('#resupply').hasClass('active')) {
            $('#resupply').removeClass('active');
            $('#resupply').hide();
            $.get('/extensions/resupply', function(response) {
                $('#resupply').show();
            });
        }
    });

});


function submitJob(elemClicked, type) {

    if(elemClicked.hasClass('active')) {

        elemClicked.removeClass('active');
        elemClicked.hide();
        $.get('/extensions/submit-print-job?type=' + type, function(response) {
            elemClicked.show();
        });

    }

}