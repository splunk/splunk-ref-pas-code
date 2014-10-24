require.config({
    paths: {
        'kvstore': 'http://localhost:8001/dj/static/kvstore_backbone/lib/kvstore'
    }
});

// Make Splunk ready
require(['splunkjs/mvc/simplexml/ready!'], function() {
    require(
    [
        'kvstore'
    ], function() {
        var KVStore = require('kvstore');

        var RiSetupColl = KVStore.Model.extend({
            collectionName: 'ri_setup_coll'
        });

        var model = new RiSetupColl();
        // model.save({
        //     "divisions" : { "names" : ["Engineering","Marketing"]},
        //     "locations" : { "names" : ["New York","Miami","Seattle","San Francisco"]},
        //     "code" : {
        //         "name" : "My Code Name",
        //         "weight" : 100,
        //         "policies" : ["Policy1","Policy2","Policy3"]
        //     }
        // });

        model.fetch()
            .done(function(data, textStatus, jqXHR) {
                if (data)
                {
                    setup_information = data[0];
                    $("#_key").val(setup_information._key);
                    $("#divisions_names").val(setup_information.divisions.names.join(","));
                    $("#locations_names").val(setup_information.locations.names.join(","));
                    $("#code_name").val(setup_information.code.name);
                    $("#code_weight").val(setup_information.code.weight);
                    $("#code_policies").val(setup_information.code.policies.join(","));

                }
              })
          .fail(function(jqXHR, textStatus, errorThrown) {
          });

        $("#save").click(function (e) {
            var model_save = new RiSetupColl({_key: $("#_key").val() });
            model_save.save({
                divisions: { names: $("#divisions_names").val().split(",")},
                locations: { names: $("#locations_names").val().split(",")},
                code: {
                    name: $("#code_name").val(),
                    weight: $("#code_weight").val(),
                    policies: $("#code_policies").val().split(",")

                }
            }); 
        });
    });
});