require([
    "splunkjs/ready!",
    "splunkjs/mvc/simplexml/ready!"
    // TODO: Migrate the calendar heatmap too
    //"../app/warum_conducive_web/components/calendarheatmap/calendarheatmap"
], function(
    mvc,
    ignored/*,
    CalendarHeatMap*/
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
        e.preventDefault();
        var time_value = {
            "earliest_time": e.startValue,
            "latest_time": e.endValue
        };
        
        // TODO: Extract prefix of these searches to postprocess prefix.
        zoomSearch.search.set(time_value);
        topDocumentsSearch.search.set(time_value);
        topEventsSearch.search.set(time_value);
        
        tokens.set("earliest_time", e.startValue);
        tokens.set("latest_time", e.endValue);
    });
    
    // TODO: Following token propagation scenarios are not behaving as expected:
    // * Change global range should update ALL panels. Currently missing bottom two panels.
    // * Change zoom range should update only the trend range. Current updating bottom two panels.
    
    // Initially propagate times from global -> zoom, trend
    tokens.set("trendTime.earliest", tokens.get("time.earliest"));
    tokens.set("zoomTime.earliest", tokens.get("time.earliest"));
    tokens.set("trendTime.latest", tokens.get("time.latest"));
    tokens.set("zoomTime.latest", tokens.get("time.latest"));
    
    // Propagate times from global -> zoom, trend
    tokens.on("change:time.earliest", function(model, value) {
        tokens.set("trendTime.earliest", value);
        tokens.set("zoomTime.earliest", value);
    });
    tokens.on("change:time.latest", function(model, value) {
        tokens.set("trendTime.latest", value);
        tokens.set("zoomTime.latest", value);
    });
    
    // Propagate times from zoom -> trend 
    tokens.on("change:zoomTime.earliest", function(model, value) {
        tokens.set("trendTime.earliest", value);
    });
    tokens.on("change:zoomTime.latest", function(model, value) {
        tokens.set("trendTime.latest", value);
    });
});
