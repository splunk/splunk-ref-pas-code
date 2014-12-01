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
    // TODO: Add error handling for I/O errors.
    //       No time to fix now since feature freeze in a few hours...
    
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
            title: 'Users with Excessive Accesses',
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
    
    var ViolationTypeModel = KVStore.Model.extend({
        collectionName: 'violation_types'
    });
    
    var ViolationTypeCollection = KVStore.Collection.extend({
        collectionName: 'violation_types',
        model: ViolationTypeModel
    });
    
    var oldSetupModelId;
    
    // Fetch setup data and populate form
    new SetupModel().fetch().then(function(setupDatas, textStatus, jqXHR) {
        new ViolationTypeCollection().fetch().then(function(violationTypes, textStatus, jqXHR) {
            if (setupDatas.length == 0) {
                // Create new model upon save
                oldSetupModelId = "_new";
            } else {
                var setupData = setupDatas[0];
                
                // Update existing model upon save
                oldSetupModelId = setupData._key
                
                // Populate departments in the UI
                departmentsDropdown.val(setupData.departments || []);

                // Populate violation types in the UI
                if (violationTypes.length == 0) {
                    violationTypes = DEFAULT_VIOLATION_TYPES
                }
                _.each(violationTypes, function(violationType) {
                    var rowElement = $(VIOLATION_TYPE_ROW_TEMPLATE())
                        .appendTo($("#violation_types"));
                    
                    $('.name input', rowElement).val(violationType.title);
                    $('.color input', rowElement).val(violationType.color);
                    $('.weight input', rowElement).val(violationType.weight);
                });
            }
            
            // Now that form is loaded, allow it to be saved
            $('#save').removeClass('disabled');
        });
    });
    
    // When save button clicked, update setup configuration
    $("#save").click(function() {
        if ($('#save').hasClass('disabled')) {
            return;
        }
        
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
                departments: departmentsDropdown.val()
            };
            
            var newSetupModel = (oldSetupModelId == "_new")
                ? new SetupModel()
                : new SetupModel({ _key: oldSetupModelId });
            
            newSetupModel.save(newSetupData).then(function() {
                setCollectionData(
                    ViolationTypeCollection,
                    ViolationTypeModel,
                    violationTypes,
                    function() {
                        console.log('Model saved with id ' + newSetupModel.id);
                        window.location.href = "./summary";
                    });
            });
        }
    });

    // Replaces the contents of the specified collection with
    // new models initialized with the specified data.
    function setCollectionData(Collection, Model, modelDatas, done) {
        destroyModelsIn(Collection, function() {
            saveModels(Model, modelDatas, done);
        });
    }
    
    // Destroys all models in the specified KV Store collection.
    function destroyModelsIn(Collection, done) {
        var collection = new Collection();
        collection.fetch().then(function() {
            var modelIndex = collection.models.length - 1;
            
            var deleteLoop = function() {
                if (modelIndex >= 0) {
                    collection.models[modelIndex].destroy().then(function() {
                        modelIndex--;
                        deleteLoop();
                    });
                } else {
                    done();
                }
            };
            deleteLoop();
        });
    }
    
    // Saves all specified models.
    function saveModels(Model, modelDatas, done) {
        var modelIndex = 0;
        
        var saveLoop = function() {
            if (modelIndex < modelDatas.length) {
                new Model().save(modelDatas[modelIndex]).then(function() {
                    modelIndex++;
                    saveLoop();
                });
            } else {
                done();
            }
        };
        saveLoop();
    }
});