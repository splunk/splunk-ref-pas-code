    require.config({
        paths: {
            "tagmanager": "../app/warum_conducive_web/tagmanager",
            "filter_component": "../app/warum_conducive_web/filter_component"
        },
        shim: {
            "filter_component": {
                deps: [
                    "splunkjs/mvc/timerangeview",
                    "splunkjs/mvc/radiogroupview",
                    "splunkjs/mvc/textinputview",
                    "../app/warum_conducive_web/context",
                    "tagmanager"
                ]
            },
            "tagmanager": {
                deps: ["jquery"]
            }
        }
    });
require(
  [
    "splunkjs/ready!", 
    "underscore", 
    "splunkjs/mvc/chartview",
    "splunkjs/mvc/singleview",
    "filter_component"
  ], function(mvc, _) {
    var tokens = mvc.Components.getInstance("default");

    context.init({preventDoubleContext: false});
    generateFilterComponent(mvc);

    var ChartView = require("splunkjs/mvc/chartview");
    var SingleView = require("splunkjs/mvc/singleview");
    
    // TODO: Fix the naming conventions
    var timepicker = mvc.Components.getInstance("timepicker"); 
    // TODO: Rename to "trendChart"
    var barchart = mvc.Components.getInstance("trend_chart");
    // TODO: Rename to "trendSearch"
    var search = mvc.Components.getInstance(barchart.settings.get("managerid"));
    // TODO: Rename "policy_single" to something better
    var single = mvc.Components.getInstance("policy_single");
    var singlesearch = mvc.Components.getInstance(single.settings.get("managerid"));
    var user_table = mvc.Components.getInstance("user_table");
    var document_table = mvc.Components.getInstance("document_table");
    // TODO: Restore postprocess prefix for the following 2 searches,
    //       and update the base search's timerange instead of the
    //       timerange of the final two derived searches.
    var usersSearch = mvc.Components.getInstance(user_table.settings.get("managerid"));
    var documentSearch = mvc.Components.getInstance(document_table.settings.get("managerid"));

    tokens.set("command", "*");

    timepicker.on("change", function() {
        search.search.set(timepicker.val());
        usersSearch.search.set(timepicker.val());
        documentSearch.search.set(timepicker.val());
        singlesearch.search.set(timepicker.val());
    });

    // barchart.on("click:chart", function(e) {
    //     e.preventDefault();
    //     earliest = parseFloat(e.rowContext["row._time"]);
    //     span = parseFloat(e._span);
    //     latest = earliest + span;
    //     tokens.set("command", e.name2);
    //     tokens.set("earliest_time",earliest);
    //     tokens.set("latest_time",latest);
    //     $("#filter_header").show();
    // });

    barchart.on("click:legend", function(e) {
        e.preventDefault();
        tokens.set("command", e.name2);
        $("#filter_header").show();
    });

    // user_table.on("click:row", function(e) {
    //     e.preventDefault();
    //     username = e.data["row.user"];
    //     earliest_time = tokens.get("earliest_time");
    //     latest_time = tokens.get("latest_time");
    //     window.location.href = "../user_details?username=" + username + "&earliest_time=" + earliest_time + "&latest_time=" + latest_time;
    // });

    // $("#reset_filter").click(function(e) {
    //     tokens.set("command", "*");
    //     $("#filter_header").hide();
    // });

    // document_table.on("click:row", function(e) {
    //     e.preventDefault();
    //     document_name = e.data["row.object"];
    //     earliest_time = tokens.get("earliest_time");
    //     latest_time = tokens.get("latest_time");
    //     window.location.href = "../document_details?document=" + document_name + "&earliest_time=" + earliest_time + "&latest_time=" + latest_time;
    // });

            var menu_data = [
            {
                text: 'Include', 
                splunk_action: 'include'
            },
            {
                text: 'Exclude', 
                splunk_action: 'exclude'
                
            },
            {
                text: 'Drilldown', 
                splunk_action: 'drilldown',
                search: "index=* sourcetype=Events $criteria$ | table _time Event_ID User_Name, Computer_Name, Application, Operation, Email_Domain, DNS_Hostname, Source_Directory, Source_File_Extension, Destination_Directory, Destination_File_Extension"
            }
        ];

        var chart_column = "command";

        context.attachToChart(barchart, menu_data);
        context.attachToTable(user_table, menu_data);
        context.attachToTable(document_table, menu_data);

});

