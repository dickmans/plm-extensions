$(document).ready(function() {

    let data = [{
        "partNumber" : "CAD_30000012",
        "properties" : [
            { "key" : "Title",          "value" : "Neuer Name" },
            { "key" : "Description",    "value" : "Neue Beschreibung" },
            { "key" : "MODEL_YEAR",     "value" : "2024" }
        ]
    }];

    $("#button-1").click(function() { selectComponents([]); });
    $("#button-2").click(function() { selectComponents(["CAD_30000012"]); });
    $("#button-3").click(function() { selectComponents(["CAD_30000012", "CAD_30000052"]); });
    $("#button-4").click(function() { addComponent("CAD_00019779"); });
    $("#button-5").click(function() { openComponent("CAD_30000012"); });
    $("#button-6").click(function() { updateProperties(data); });
    $("#button-7").click(function() { getComponentsLocked(["CAD_30000012","CAD_30000014","CAD_30000052"]); });
    $("#button-8").click(function() { isolateComponents(["CAD_30000012", "CAD_30000052"]); });
    $("#button-9").click(function() { setLifecycleState("CO-000012", "Review"); });

    $(".item").click(function() {

        $(this).toggleClass("selected");

        let partNumbers = [];

        $(".item").each(function() {
            if($(this).hasClass("selected")) partNumbers.push($(this).attr("data-part-number"));
        });

        selectComponents(partNumbers);

    });

});