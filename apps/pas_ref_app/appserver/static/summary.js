// Define a fake require module "bootstrap-tagsinput" that wraps the
// non-require-compatible 3rd-party bootstrap-tagsinput.js JQuery plugin.
require.config({
    paths: {
        "bootstrap-tagsinput": "../app/pas_ref_app/bootstrap-tagsinput",
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
    "../app/pas_ref_app/filter_component",  // depends on bootstrap-tagsinput
    "../app/pas_ref_app/context",
], function(
    mvc,
    ignored,
    _,
    FilterComponent,
    context
) { 
    // Setup a custom contextual menu that appears when clicking on
    // the Trend chart, the Top Users table, and the Top Documents table.
    // 
    // The contextual menu emits "click:menu" events on the root
    // document object when menuitems are selected.
    setupPopupMenus();
    
    // Listen for "click:menu" events and take the appropriate action,
    // usually adding items to the custom Filter Criteria panel.
    FilterComponent.initialize(mvc);
    
    function setupPopupMenus() {
        var trendChart = mvc.Components.getInstance("trend_chart");
        var userTable = mvc.Components.getInstance("user_table");
        var documentTable = mvc.Components.getInstance("document_table");
        
        var includeExcludeMenu = [
            {
                text: 'Include', 
                splunk_action: 'include'
            },
            {
                text: 'Exclude', 
                splunk_action: 'exclude'
            },
        ];
        
        var includeExcludeDrilldownMenu = _.clone(includeExcludeMenu);
        includeExcludeDrilldownMenu.push({
            text: 'Drilldown', 
            splunk_action: 'drilldown',
            search: "index=* sourcetype=Events $criteria$ | table _time Event_ID User_Name, Computer_Name, Application, Operation, Email_Domain, DNS_Hostname, Source_Directory, Source_File_Extension, Destination_Directory, Destination_File_Extension"
        })

        context.init({preventDoubleContext: false});
        context.attachToChart(trendChart, includeExcludeMenu);
        context.attachToTable(userTable, includeExcludeDrilldownMenu);
        context.attachToTable(documentTable, includeExcludeMenu);
    }
});
