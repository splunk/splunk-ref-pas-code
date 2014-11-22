require.config({
    paths: {
        'kvstore': '../app/kvstore_backbone/lib/kvstore'
    }
});

require([
    'splunkjs/ready!',
    'splunkjs/mvc/simplexml/ready!',
    'underscore',
    'kvstore',
    'splunkjs/mvc/multidropdownview'
], function(mvc, ignored, _, KVStore, MultiDropdownView) {
    var VIOLATION_TYPE_ROW_TEMPLATE =
        _.template(
            "<div class='violation_type'>"+
                "<span class='name'><strong>Name:</strong> <input type=\"text\" disabled/></span> " +
                "<span class='color'><strong>Color:</strong> <input type=\"text\"/ disabled></span> " +
                "<span class='weight'><strong>Weight:</strong> <input type=\"text\"/></span>" +
            "</div>");
    
    var DEFAULT_VIOLATION_TYPES = [
        {
            id: 'Invalid_Time_Access',
            title: 'Off-Hours Access',
            color: 'Yellow',
            weight: 1.2
        },
        {
            id: 'Terminated_Access',
            title: 'Terminated Employee Access',
            color: 'Red',
            weight: 3.0
        },
        {
            id: 'Excessive_Access',
            title: 'Users with Excessive Hourly Accesses',
            color: 'Yellow',
            weight: 1.0
        }
    ];
    
    var departmentsDropdown = new MultiDropdownView({
        managerid: "departments_search",
        labelField: "department",
        valueField: "department",
        el: $("#departments_dropdown")
    }).render();
    
    var SetupModel = KVStore.Model.extend({
        collectionName: 'ri_setup_coll'
    });
    
    // Fetch setup data and populate form
    new SetupModel().fetch()
        .done(function(data, textStatus, jqXHR) {
            if (data.length == 0) {
                // No preexisting setup model exists
                $("#_key").val("_new");
            } else {
                var setupData = data[0];
                
                // Save original model ID in form
                $("#_key").val(setupData._key);
                
                // Populate departments in the UI
                departmentsDropdown.val(setupData.departments || []);

                // Populate violation types in the UI
                var violationTypes = setupData.violationTypes || DEFAULT_VIOLATION_TYPES;
                _.each(violationTypes, function(violationType) {
                    var rowElement = $(VIOLATION_TYPE_ROW_TEMPLATE())
                        .appendTo($("#violation_types"));
                    
                    $('.name input', rowElement).val(violationType.title);
                    $('.color input', rowElement).val(violationType.color);
                    $('.weight input', rowElement).val(violationType.weight);
                });
            }
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            // nothing
        });

    // When save button clicked, update setup configuration
    $("#save").click(function() {
        // Clear previous validation error markers
        $('.violation_type .weight input').parent('span').removeClass("error");
        
        // Validate form fields and mark those in error
        var someEmpty = $('.violation_type .weight input').filter(function() {
            return !$.trim(this.value);
        }).parent('span').addClass("error").length > 0;

        var notNumbers = $('.violation_type .weight input').filter(function() {
            return !$.isNumeric(this.value);
        }).parent('span').addClass("error").length > 0;
        
        if (someEmpty) {
            window.alert("Some required fields have been left blank.");
        } else if (notNumbers) {
            window.alert("Some specified violation type weights are not numbers.");
        } else {
            var oldModelId = $("#_key").val();
            var newModel = (oldModelId == "_new")
                ? new SetupModel()
                : new SetupModel({ _key: oldModelId });

            var violationTypes = [];
            _.each($('.violation_type'), function(violationTypeEl, index) {
                violationTypes.push({
                    id: DEFAULT_VIOLATION_TYPES[index].id,
                    title: DEFAULT_VIOLATION_TYPES[index].title,
                    color: $('.color input', violationTypeEl).val(),
                    weight: $('.weight input', violationTypeEl).val()
                });
            });
            
            var newSetupData = {
                departments: departmentsDropdown.val(),
                // TODO: Delete unused field
                locations: [],
                violationTypes: violationTypes
            };
            
            newModel.save(newSetupData).then(function() {
                console.log('Model saved with id ' + newModel.id);
                window.location.href = "./summary";
            });
        }
    });
});