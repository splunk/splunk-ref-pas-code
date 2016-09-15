require([
    "splunkjs/ready!",
    "splunkjs/mvc/simplexml/ready!",
    "jquery",
    "underscore"
], function(
    mvc,
    ignored,
    $,
    _
) {
    var PROVIDER_STAT_BOX_TEMPLATE = _.template(
        '<div class="provider_box">' +
        '    <div class="provider_title"><%= provider_title %></div>' +
        '    <div class="event_count"><%= event_count %></div>' +
        '</div>');
    
    var view = $("#provider_stats");
    view.html("Loading data providers...");
    
    var providerStatsSearch = mvc.Components.get("provider_stats_search");
    providerStatsSearch.data("results", {
        // HACK: By default, no "data" event is fired when no results are
        //       found. Override so that it does fire in this case.
        condition: function(manager) {
            return (manager.job.properties() || {}).isDone;
        }
    }).on("data", function(resultsModel) {
        var rows = resultsModel.data().rows;
        if (rows.length === 0) {
            view.html("No data providers found or there's been no activity.");
        } else {
            view.html("");
            _.each(rows, function(row) {
                var sourcetype = row[0];
                var count = row[1];
                
                view.append($(PROVIDER_STAT_BOX_TEMPLATE({
                    provider_title: sourcetype,
                    event_count: count
                })));
            });
        }
    });
});
