// Workaround the css! plugin's inability to understand '..' in
// require'd module names by defining a path that embeds the '..'
// so that css! doesn't see it.
require.config({
    paths: {
        "pas_ref_app": "../app/pas_ref_app"
    }
});

require([
    "splunkjs/ready!",
    "splunkjs/mvc/simplexml/ready!",
    "pas_ref_app/components/calendarheatmap/calendarheatmap",
    "jquery",
    "splunkjs/mvc/searchmanager"
], function(
    mvc,
    ignored,
    CalendarHeatMap,
    $,
    SearchManager
) {
    // Update both "default" and "submitted" tokens at the same time so that
    // everything on the page gets updated appropriately.
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
    
    linkTrendChartToZoomChart();
    createCalendarHeatmap();
    
    function linkTrendChartToZoomChart() {
        var zoomChart = mvc.Components.get("zoom_chart");
        var zoomSearch = mvc.Components.get("zoom_search");
        
        zoomChart.on("selection", function(e) {
            // Prevent the zoom chart from automatically zooming to the selection
            e.preventDefault();
            
            // Update trend chart's time range
            tokens.set({
                "trendTime.earliest": e.startValue,
                "trendTime.latest": e.endValue
            });
        });
        
        // Propagate times from global -> trend continuously
        tokens.set({
            "trendTime.earliest": tokens.get("time.earliest"),
            "trendTime.latest": tokens.get("time.latest")
        });
        tokens.on("change:time.earliest change:time.latest", function(model, value) {
            tokens.set({
                "trendTime.earliest": tokens.get("time.earliest"),
                "trendTime.latest": tokens.get("time.latest")
            });
        });
    }
    
    function createCalendarHeatmap() {
        new CalendarHeatMap({
            id: "activity_levels",
            managerid: "activity_levels_search",
            domain: "month",
            subDomain: "x_day",
            el: $("#activity_levels")
        }).render();
    }
});
