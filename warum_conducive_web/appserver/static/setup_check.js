require.config({
    paths: {
        'kvstore': '../app/kvstore_backbone/lib/kvstore'
    }
});

// Make Splunk ready
require(['splunkjs/mvc/simplexml/ready!'], function() {
    require(
    [
        'kvstore'
    ], function() {
        var KVStore = require('kvstore');

        var RiSetupModel = KVStore.Model.extend({
            collectionName: 'ri_setup_coll'
        });

        var model = new RiSetupModel();
        model.fetch()
            .done(function(data, textStatus, jqXHR) {
                if (data.length == 0)
                {
                    //Setup hasn't been done yet.
                    alert("You need to perform setup before coming to this page.");
                    window.location.href = "./setup";
                }
            });
    });
});