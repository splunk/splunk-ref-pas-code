// If the app hasn't been setup, redirect to the setup page
require([
    'splunkjs/mvc/simplexml/ready!',
    '../app/pas_ref_app/components/kvstore_backbone/kvstore'
], function(
    ignored,
    KVStore
) {
    var RiSetupModel = KVStore.Model.extend({
        collectionName: 'ri_setup_coll'
    });

    var isExemptFromSetupCheck = (window.location.href.indexOf('setup') !== -1);
    if (!isExemptFromSetupCheck) {
        var model = new RiSetupModel();
        model.fetch()
            .done(function(data, textStatus, jqXHR) {
                if (data.length == 0) {
                    //Setup hasn't been done yet.
                    alert("You need to perform setup before coming to this page.");
                    window.location.href = "./setup";
                }
            });
    }

    // Show tips if configured to do so
    var model = new RiSetupModel();
    model.fetch()
        .done(function(data, textStatus, jqXHR) {
            if (data.length == 1) {
                var setupData = data[0];
                var learningTipsEnabled = (setupData.learningTipsEnabled === 'True');
                $('.help-hover')[learningTipsEnabled ? 'show' : 'hide']();
            }
        });
});