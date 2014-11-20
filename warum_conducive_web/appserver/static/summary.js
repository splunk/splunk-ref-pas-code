// Define a fake require module "bootstrap-tagsinput" that wraps the
// non-require-compatible 3rd-party bootstrap-tagsinput.js JQuery plugin.
require.config({
    paths: {
        "bootstrap-tagsinput": "../app/warum_conducive_web/bootstrap-tagsinput",
    },
    shim: {
        "bootstrap-tagsinput": {
            deps: ["jquery"]
        }
    }
});

require([
    "splunkjs/ready!",
    "splunkjs/mvc/simplexml/ready!",
    "underscore",
    "../app/warum_conducive_web/filter_component",  // depends on bootstrap-tagsinput
    "../app/warum_conducive_web/context",
], function(
    mvc,
    ignored,
    _,
    FilterComponent,
    context
) {
    var trendChart = mvc.Components.getInstance("trend_chart");
    var userTable = mvc.Components.getInstance("user_table");
    var documentTable = mvc.Components.getInstance("document_table");
    
    var tokens = mvc.Components.get("default");
    
    FilterComponent.initialize(mvc);

    var menuData = [
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

    // Setup custom contextual menu that appears when clicking on the tables
    context.init({preventDoubleContext: false});
    context.attachToChart(trendChart, menuData);
    context.attachToTable(userTable, menuData);
    context.attachToTable(documentTable, menuData);
});
