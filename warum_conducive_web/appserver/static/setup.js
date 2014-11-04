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

        //Multiple field handling
        var max_fields      = 10; //maximum input boxes allowed
        var wrapper         = $(".input_fields_wrap"); //Fields wrapper
        var add_button      = $(".add_field_button"); //Add button ID
        
        $(add_button).click(function(e){ //on add input button click
            e.preventDefault();
            parent = $(this).parent('div');
            field_count = $(this).parent('div').children('div').children('input').length
            if(field_count < max_fields){ //max input box allowed
                parent.append('<div><input type="text" name="' + parent[0].id + '[]"/> <a href="#" class="remove_field">Remove</a></div>'); //add input box
            }
            else {
                //TODO: Alert on max inputs
            }
        });
        
        $(wrapper).on("click",".remove_field", function(e){ //user click on remove text
            e.preventDefault(); $(this).parent('div').remove();
        })

        var KVStore = require('kvstore');

        var RiSetupModel = KVStore.Model.extend({
            collectionName: 'ri_setup_coll'
        });

        var model = new RiSetupModel();
        model.fetch()
            .done(function(data, textStatus, jqXHR) {
                if (data.length > 0)
                {
                    setup_information = data[0];
                    $("#_key").val(setup_information._key);
                    $("#code_name").val(setup_information.code.name);
                    $("#code_weight").val(setup_information.code.weight);

                    //populate multi-values for arrays
                    //TODO: encapsulate code
                    divisions = setup_information.divisions.names;
                    $.each(divisions,function (index,value) {
                        wrapper = $("#divisions");
                        if (index == 0)
                        {
                            wrapper.children('div').first().children('input').val(value);
                        }
                        else {
                            $(wrapper).append('<div><input type="text" name="' + wrapper[0].id + '[]"/> <a href="#" class="remove_field">Remove</a></div>');
                            $(wrapper).children('div').last().children('input').val(value);
                        }
                    });

                    policies = setup_information.code.policies;
                    $.each(policies,function (index,value) {
                        wrapper = $("#policies");
                        if (index == 0)
                        {
                            wrapper.children('div').first().children('input').val(value);
                        }
                        else {
                            $(wrapper).append('<div><input type="text" name="' + wrapper[0].id  + '[]"/> <a href="#" class="remove_field">Remove</a></div>');
                            $(wrapper).children('div').last().children('input').val(value);
                        }
                    });

                    locations = setup_information.locations.names;
                    $.each(locations,function (index,value) {
                        wrapper = $("#locations");
                        if (index == 0)
                        {
                            wrapper.children('div').first().children('input').val(value);
                        }
                        else {
                            $(wrapper).append('<div><input type="text" name="' + wrapper[0].id + '[]"/> <a href="#" class="remove_field">Remove</a></div>');
                            $(wrapper).children('div').last().children('input').val(value);
                        }
                    });
                }
                else {
                    //There is no data in the KV Store
                    $("#_key").val("_new");
                }
              })
          .fail(function(jqXHR, textStatus, errorThrown) {
          });

        $("#save").click(function (e) {
            var model_save;
            if ($("#_key").val() == "_new") {
                model_save = new RiSetupModel();
            }
            else {
                model_save = new RiSetupModel({_key: $("#_key").val() });
            }

            // Set Multi-value arrays
            divisions = [];
            $("input[name='divisions[]']").each(function() {
                divisions.push($(this).val());
            });

            locations = [];
            $("input[name='locations[]']").each(function() {
                locations.push($(this).val());
            });

            policies = [];
            $("input[name='policies[]']").each(function() {
                policies.push($(this).val());
            });

            model_save.save({
                divisions: { names: divisions},
                locations: { names: locations},
                code: {
                    name: $("#code_name").val(),
                    weight: $("#code_weight").val(),
                    policies: policies
                }
            })
            .then(function() {
              console.log('Model saved with id ' + model.id);
              $('#saveModal').modal();
            }); 
        });
    });
});