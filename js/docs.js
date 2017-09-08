var shiftWindow = function () {
    scrollBy(0, -85)
};

$(function () {
    if (window.location.hash) {
        shiftWindow();
    }

    var doc = $('html, body');
    var canPushState = false;
    if (typeof history.pushState === "function") {
        // Yup, have it
        canPushState = true;
    }

    try {
        window.prettyPrint && prettyPrint();
    }
    catch (ex) {
        console.log(ex.message);
    }

    $(document)
        .on('click', '.dropdown-menu a[href^="#"]', function (e) {
            e.preventDefault();

            var target = $(this).attr('href');
            var offset = 75;

            if (target && $(target).offset()) {
                offset = $(target).offset().top - 85;
            }

            doc.animate({
                scrollTop: offset
            }, 'slow', function () {
                if (canPushState) {
                    history.pushState(null, null, target);
                }
            });
        });
});