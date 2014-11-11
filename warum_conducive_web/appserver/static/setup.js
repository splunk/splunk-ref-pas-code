require.config({
    paths: {
        'kvstore': '../app/kvstore_backbone/lib/kvstore',
        "jquery-serialize-object": "../app/warum_conducive_web/jquery-serialize-object"
    }
});

// Make Splunk ready
require(['splunkjs/mvc/simplexml/ready!'], function() {
    require(
    [
        'underscore',
        'jquery-serialize-object',
        'kvstore'
    ], function() {

        //Multiple field handling
        var max_fields      = 10; //maximum input boxes allowed
        var wrapper         = $(".input_fields_wrap"); //Fields wrapper
        var add_button      = $(".add_field_button"); //Add button ID

        var _ = require('underscore');
        var standard_input = 
            _.template("<div><input type=\"text\" name=\"<%= name%>[]\"/><a href=\"#\" class=\"remove_field\"> Remove</a></div>");
        
        var policies_input =
            _.template("<div>Name: <input type=\"text\" name=\"policies[][name]\"/> Code: <input type=\"text\" name=\"policies[][code]\"/> Weight: <input type=\"text\" name=\"policies[][weight]\"/> <a href=\"#\" class=\"remove_field\">Remove</a></div>");



        $(add_button).click(function(e){ //on add input button click
            e.preventDefault();
            parent = $(this).parent('h3').parent('div');
            field_count = parent.children('div').length
            if(field_count < max_fields){ //max input box allowed
                name = parent[0].id;
                if (name == "policies")
                    parent.append(policies_input({id: field_count}));
                else
                    parent.append(standard_input({name: name}));
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

                    //populate multi-values for arrays
                    //TODO: encapsulate code
                    divisions = setup_information.divisions;
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

                    policies = setup_information.policies;
                    $.each(policies,function (index,value) {
                        wrapper = $("#policies");
                        if (index == 0)
                        {
                            wrapper.children('div').first().children('input')[0].value = value.name;
                            wrapper.children('div').first().children('input')[1].value = value.code;
                            wrapper.children('div').first().children('input')[2].value = value.weight;
                        }
                        else {
                            $(wrapper)
                                .append(policies_input({id: 0}));
                            wrapper.children('div').last().children('input')[0].value = value.name;
                            wrapper.children('div').last().children('input')[1].value = value.code;
                            wrapper.children('div').last().children('input')[2].value = value.weight;
                        }
                    });

                    locations = setup_information.locations;
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

            frm = $(document.setup_form);
            setup_form = frm.serializeObject();

            model_save.save({
                divisions: setup_form.divisions,
                locations: setup_form.locations,
                policies: setup_form.policies
            })
            .then(function() {
              console.log('Model saved with id ' + model.id);
              $('#saveModal').modal();
            }); 
        });
    });
});