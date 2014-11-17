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
    
    loadProviderInformation(function(providerTitleForSourcetype) {
        view.html("Looking for events...");
        
        var providerStatsSearch = mvc.Components.get("provider_stats_search");
        providerStatsSearch.data("results").on("data", function(resultsModel) {
            var rows = resultsModel.data().rows;
            if (rows.length === 0) {
                view.html("No data providers found.");
            } else {
                view.html("");
                _.each(rows, function(row) {
                    var sourcetype = row[0];
                    var count = row[1];
                    var providerTitle = providerTitleForSourcetype[sourcetype];
                    
                    view.append($(PROVIDER_STAT_BOX_TEMPLATE({
                        provider_title: providerTitle,
                        event_count: count
                    })));
                });
            }
        });
    });

    // TODO: Decomplect this. Probably by using async.map()
    //       to simplify parallel fetching logic.
    function loadProviderInformation(callback) {
        // Get access to Splunk objects via the JavaScript SDK
        var service = mvc.createService();
        
        // Look for apps that contain a warum_provider.conf file
        var appsCollection = service.apps();
        appsCollection.fetch(function(err) {
            if (err) {
                view.html("Error loading providers.");
                console.error(err);
                return;
            }
            
            var providerTitleForSourcetype = {};
            
            var apps = appsCollection.list();
            var numAppsLeft = apps.length;
            _.each(apps, function(app) {
                if (app.properties().disabled) {
                    // Avoid querying information about disabled apps because
                    // it causes JS errors.
                    finishedCheckingApp();
                    return;
                }
                
                var configFileCollection = service.configurations({
                    owner: "nobody",
                    app: app.name,
                    sharing: "app"
                });
                configFileCollection.fetch(function(err) {
                    if (err) {
                        finishedCheckingApp();
                    } else {
                        var configFile = configFileCollection.item("warum_provider");
                        if (!configFile) {
                            // Assume config file is missing, meaning that this app
                            // does not represent a Warum provider
                            finishedCheckingApp();
                        } else {
                            configFile.fetch(function(err, config) {
                                var providerStanza = configFile.item("provider");
                                var stanzaContent = providerStanza.properties();
                                
                                providerTitleForSourcetype[stanzaContent.sourcetype] = stanzaContent.title;
                                finishedCheckingApp();
                            });
                        }
                    }
                });
            });
            
            function finishedCheckingApp() {
                numAppsLeft--;
                if (numAppsLeft === 0) {
                    callback(providerTitleForSourcetype);
                }
            }
        });
    }
});