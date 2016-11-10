/* global $, GC */
(function() {

    var root = $("#about-dialog");

    var $dialog = root.closest("#dialog").dialog("option", "close", function() {
        $("#header").unmask();
    });

    // function mask() {
    //     root.mask({
    //         z : 10000000000,
    //         bgcolor : "#FFF",
    //         opacity: 0.8,
    //         html : "Please wait..."
    //     });
    // }

    // Cancel button -----------------------------------------------------------
    root.find(".footer input.cancel").click(function() {
        $dialog.dialog("close");
    });

    // The group selector on the left side
    var loaded = false;
    root.find("#about-view").change(function() {
        var el = $(this),
            id = el.val();
        el.css("height", "auto");
        if(id) {
            $(".about-panel").hide().filter("#" + id).show();
        }
        if (loaded) {
            el.css("height", el.parent()[0].offsetHeight - 8);
        } else {
            root.closest("#dialog").dialog("option", { position : "center" });
            setTimeout(function() {
                el.css("height", el.parent()[0].offsetHeight - 8);
            }, 400);
        }
        loaded = true;
    }).triggerHandler("change");


    $("#header").mask({ z : 1000, bgcolor : "#000", opacity: 0.5 });

    // App version =============================================================
    root.find(".app-ver").html(GC.chartSettings.version.asString());

}());
