// Workaround the css! plugin's inability to understand '..' in
// require'd module names by defining a path that embeds the '..'
// so that css! doesn't see it.
require.config({
    paths: {
        "warum_conducive_web": "../app/warum_conducive_web"
    }
});

require([
    "splunkjs/ready!",
    "splunkjs/mvc/simplexml/ready!",
    "warum_conducive_web/components/calendarheatmap/calendarheatmap",
    "jquery",
    "splunkjs/mvc/searchmanager"
], function(
    mvc,
    ignored,
    CalendarHeatMap,
    $,
    SearchManager
) {
    var zoomChart = mvc.Components.get("zoom_chart");
    var zoomSearch = mvc.Components.get("zoom_search");
    var topDocumentsSearch = mvc.Components.get("top_documents_search");
    var topEventsSearch = mvc.Components.get("top_events_search");
    
    // TODO: Does this need to include "submitted" as well?
    //       I don't think so. Recommend collapse to defaultTokens only.
    var defaultTokens = mvc.Components.get("default");
    var submittedTokens = mvc.Components.get("submitted");
    var tokens = {
        get: function(tokenName) {
            return defaultTokens.get(tokenName);
        },
        
        set: function(tokenName, tokenValue) {
            defaultTokens.set(tokenName, tokenValue);
            submittedTokens.set(tokenName, tokenValue);
        },
        
        on: function(eventName, callback) {
            defaultTokens.on(eventName, callback);
        }
    };
    
    zoomChart.on("selection", function(e) {
        // Prevent the zoom chart from automatically zooming to the selection
        e.preventDefault();
        
        // Update trend chart's time range
        tokens.set({
            "trendTime.earliest": e.startValue,
            "trendTime.latest": e.endValue
        });
    });
    
    // TODO: Following token propagation scenarios are not behaving as expected:
    // * Change global range should update ALL panels. Currently missing bottom two panels.
    // * Change zoom range should update only the trend range. Current updating bottom two panels.
    
    // Initially propagate times from global -> zoom, trend
    tokens.set("trendTime.earliest", tokens.get("time.earliest"));
    tokens.set("trendTime.latest", tokens.get("time.latest"));
    
    // Propagate times from global -> zoom, trend
    tokens.on("change:time.earliest", function(model, value) {
        tokens.set("trendTime.earliest", value);
    });
    tokens.on("change:time.latest", function(model, value) {
        tokens.set("trendTime.latest", value);
    });
    
    var activity_levels_search = new SearchManager({
        "id": "activity_levels_search",
        "earliest_time": mvc.tokenSafe("$earliest_time$"),
        "latest_time": mvc.tokenSafe("$latest_time$"),
        "cancelOnUnload": true,
        "status_buckets": 0,
        "search": mvc.tokenSafe("index=warum user=$user$ | timechart span=1d count"),
        "auto_cancel": 90,
        "preview": true,
        "runWhenTimeIsUndefined": false
    });
    
    var activity_levels = new CalendarHeatMap({
        id: "activity_levels",
        managerid: "activity_levels_search",
        domain: "month",
        subDomain: "x_day",
        el: $("#activity_levels")
    }).render();
});
