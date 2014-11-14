require.config({
    paths: {
        'kvstore': '../app/kvstore_backbone/lib/kvstore',
        "jquery-serialize-object": "../app/warum_conducive_web/jquery-serialize-object"
    }
});

require([
    'splunkjs/mvc/simplexml/ready!',
    'underscore',
    'jquery-serialize-object',
    'kvstore'
], function(ignored, _, ignored, KVStore) {

    //Multiple field handling
    var max_fields      = 10; //maximum input boxes allowed
    var wrapper         = $(".input_fields_wrap"); //Fields wrapper
    var add_button      = $(".add_field_button"); //Add button ID

    var standard_input = 
        _.template(
            "<div class='control-group'>" +
                "<input type=\"text\" name=\"<%= name%>[]\"/>" +
                "<a href=\"#\" class=\"remove_field\"> Remove</a>" +
            "</div>");
    
    var policies_input =
        _.template(
            "<div class='policy'>"+
                "<div class='control-group' style='float:left'>Name: <input type=\"text\" name=\"policies[][name]\"/></div> " +
                "<div class='control-group' style='float:left'>Code: <input type=\"text\" name=\"policies[][code]\"/></div>" +
                "<div class='control-group' style='float:left'>Weight: <input type=\"text\" name=\"policies[][weight]\"/></div>" +
                "<a href=\"#\" class=\"remove_field\">Remove</a>" +
                "<div style='clear:both'></div>" +
            "</div>");

    $(add_button).click(function(e){ //on add input button click
        e.preventDefault();
        parent = $("#" + this.id.split("_")[0]);
        field_count = parent.children('div').length
        if (field_count < max_fields) { //max input box allowed
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
                    $(wrapper).append(standard_input({name: wrapper[0].id }));
                    $(wrapper).children('div').last().children('input').val(value);
                });

                policies = setup_information.policies;
                $.each(policies,function (index,value) {
                    wrapper = $("#policies");
                    $(wrapper)
                        .append(policies_input({id: 0}));
                    wrapper.children('div').last().children('div').children('input')[0].value = value.name;
                    wrapper.children('div').last().children('div').children('input')[1].value = value.code;
                    wrapper.children('div').last().children('div').children('input')[2].value = value.weight;
                });

                locations = setup_information.locations;
                $.each(locations,function (index,value) {
                    wrapper = $("#locations");
                    $(wrapper).append(standard_input({name: wrapper[0].id }));
                    $(wrapper).children('div').last().children('input').val(value);
                });
            }
            else {
                //There is no data in the KV Store
                $("#_key").val("_new");
            }
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            // nothing
        });

    $("#save").click(function (e) {
        // Clear previous validation error markers
        $('input').parent('div').removeClass("error");
        
        // Validate form fields and mark those in error
        var someEmpty = $('.control-group').children('input').filter(function(){
            return !$.trim(this.value);
        }).parent('div').addClass("error").length > 0;

        var notNumbers = $('[name="policies[][weight]"').filter(function(){
            return !$.isNumeric(this.value);
        }).parent('div').addClass("error").length > 0;
        
        if (someEmpty) {
            window.alert("Some required fields have been left blank.");
        } else if (notNumbers) {
            window.alert("Some specified policy weights are not numbers.");
        } else {
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
                window.location.href = "./summary";
            }); 
        }
    });
});