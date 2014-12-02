// If the app hasn't been setup, redirect to the setup page
require([
    'splunkjs/mvc/simplexml/ready!',
    '../app/warum_conducive_web/components/kvstore_backbone/kvstore'
], function(
    ignored,
    KVStore
) {
    var isExemptFromSetupCheck = (window.location.href.indexOf('setup') !== -1);
    
    if (!isExemptFromSetupCheck) {
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
    }
});