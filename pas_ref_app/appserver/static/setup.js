require([
    'splunkjs/ready!',
    'splunkjs/mvc/simplexml/ready!',
    'underscore',
    '../app/pas_ref_app/components/kvstore_backbone/kvstore',
    'splunkjs/mvc/multidropdownview'
], function(mvc, ignored, _, KVStore, MultiDropdownView) {
    // TODO: Add error handling for I/O errors.
    //       No time to fix now since feature freeze in a few hours...

    var GOOGLE_SIGN_IN_BASE_URL = "https://accounts.google.com/o/oauth2/auth?redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob&response_type=code&access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fadmin.reports.audit.readonly&client_id=";
    var logService = mvc.createService();
    var currentUser = Splunk.util.getConfigValue("USERNAME");

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
            var setupData;
            if (setupDatas.length == 0) {
                setupData = {
                    departments: [],
                    violationTypes: [],
                    learningTipsEnabled: 'True'
                };

                // Create new model upon save
                oldSetupModelId = "_new";
            } else {
                setupData = setupDatas[0];
                
                // Update existing model upon save
                oldSetupModelId = setupData._key
            }

            // Populate departments in the UI
            departmentsDropdown.val(setupData.departments || []);

            // Populate violation types in the UI
            if (violationTypes.length != DEFAULT_VIOLATION_TYPES.length) {
                violationTypes = DEFAULT_VIOLATION_TYPES
            }
            _.each(violationTypes, function(violationType) {
                var rowElement = $(VIOLATION_TYPE_ROW_TEMPLATE())
                    .appendTo($("#violation_types"));
                
                $('.name input', rowElement).val(violationType.title);
                $('.color input', rowElement).val(violationType.color);
                $('.weight input', rowElement).val(violationType.weight);
            });

            var learningTipsEnabled = (setupData.learningTipsEnabled === 'True');
            $('#learn_more_tips_toggle input').prop('checked', learningTipsEnabled)
            
            // Now that form is loaded, allow it to be saved
            $('#save').removeClass('disabled');
        });
    });

    // Using Splunk JS SDK, perform a runtime check of the eventgen utility installation and
    // provide a corresponding to the user.
    // Implementation alternative: add a button/checkbox to the Setup UI to enable/disable
    // the eventgen app or the eventgen modular input. This approach is more involved and requires issuing a REST API call.
    var service = mvc.createService();
    service.apps()
        .fetch(function(err, apps) {
            if (err) {
                sendDevLog( err);
                console.error(err);
                return;
            }

            // Show the Google Drive app configuration section if the app is present and enabled
            var googleDriveApp = apps.item('googledrive_addon');
            if (googleDriveApp && !googleDriveApp.state().content.disabled) {
                sendDevLog( "Enabling Google Drive Add-on in Setup interface.")
                $('#googleDriveModule').removeClass('hide');
            }

            var eventgenApp = apps.item('eventgen')
            if (eventgenApp) {
                eventgenApp.fetch(function(err, eventgenApp) {
                    if (err) {
                        sendDevLog(err);
                        console.error(err);
                        return;
                    }

                    $('#eventgen-loading').addClass('hide');

                    if (eventgenApp.state().content.disabled) {
                        $('#eventgen-disabled').removeClass('hide');
                    } else if (!eventgenApp.state().content.disabled) {
                        $('#eventgen-success').removeClass('hide');
                    } 
                });
            } else {
                $('#eventgen-loading').addClass('hide');
                $('#eventgen-notinstalled').removeClass('hide');
            }
        });

    // Google Drive OAuth2 Checks
    $("#getAuth").click(function() {
        var clientId = $("#clientId").val();
        var clientSecret = $("#clientSecret").val();

        if(clientId.length == 0) {
            sendUxLog("User didn't enter a Client ID");
            $("#clentIdError").removeClass('hide');
        } else {
            // hiding error prompt since input value is present
            $("#clentIdError").addClass('hide');
        }

        if(clientSecret.length == 0) {
            sendUxLog("User didn't enter a Client Secret");
            $("#clentSecretError").removeClass('hide');
        } else {
            // hiding error prompt since input value is present
            $("#clentSecretError").addClass('hide');
        }

        if(clientId.length > 0 && clientSecret.length > 0) {
            sendUxLog("Opening Google Authentication window for user to obtain Auth Code.");
            window.open(GOOGLE_SIGN_IN_BASE_URL + clientId, "popupWindow", "width=600,height=600,scrollbars=yes");
            $("#codeEntry").removeClass('hide');
            $("#clentIdError").addClass('hide');
            $("#clentSecretError").addClass('hide');
        }
    });
    
    $("#saveAuth").click(function() {
        var client_id = $("#clientId").val()
        var client_secret = $("#clientSecret").val()
        var auth_code = $("#authCode").val()
        if(auth_code.length > 0) {
            // Adding auth token to the KV store
            var oauth2_record = {
                "auth_code": auth_code,
                "client_id" : client_id,
                "client_secret" : client_secret
            }

            // Attempting to exchange auth token for refresh token via call to custom RESTful endpoint
            // Details are located in restmap.conf
            var service = mvc.createService();
            service.post("/services/configure_oauth", oauth2_record,
                function(err, response) {
                    if(null!=response) {
                        $("#codeEntry").addClass('hide');
                        $("#gAuthSuccess").removeClass('hide');
                        $("#gAuthError").addClass('hide');
                    } else {
                        sendDevLog("Token exchange error: " + err.status + ". Message: " + err.error);
                        $("#gAuthError").removeClass('hide');
                        $("#gAuthSuccess").addClass('hide');
                    }
                });
            $("#authEntryError").addClass('hide');
        } else {
            $("#authEntryError").removeClass('hide');
            $("#gAuthSuccess").addClass('hide');
        }
    });

    // When save button clicked, update setup configuration
    $("#save").click(function() {
        if ($(this).hasClass('disabled')) {
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
            sendUxLog("User left required fields blank.");
            window.alert("Some required fields have been left blank.");
        } else if (notNumbers) {
            sendUxLog("User entered invalid violation type number.");
            window.alert("Some specified violation type weights are not numbers.");
        } else {
            var violationTypes = [];
            _.each($('.violation_type'), function(violationTypeEl, index) {
                var viol_id = DEFAULT_VIOLATION_TYPES[index].id;
                var viol_title = DEFAULT_VIOLATION_TYPES[index].title;
                var viol_color = $('.color input', violationTypeEl).val();
                var viol_weight = $('.weight input', violationTypeEl).val();

                sendUxLog("Saving " + viol_title + ": user selected weight: " + viol_weight);
                violationTypes.push({
                    id: viol_id,
                    title: viol_title,
                    color: viol_color,
                    weight: viol_weight
                });
            });

            var tipsEnabled = $('#learn_more_tips_toggle input').prop('checked') ? 'True' : 'False';
            sendUxLog( "Learn more tips checked: " + tipsEnabled)
            var departmentSelection = departmentsDropdown.val();

            var selectedDepartments = "User selected departments: ";
            for (var i=0; i<departmentSelection.length; i++) {
                selectedDepartments += departmentSelection[i] + " ";
            }
            sendUxLog(selectedDepartments);

            var newSetupData = {
                departments: departmentSelection,
                learningTipsEnabled: tipsEnabled
            };

            var newSetupModel = (oldSetupModelId == "_new")
                ? new SetupModel()
                : new SetupModel({ _key: oldSetupModelId });

            $('#error-message').hide();
            newSetupModel.save(newSetupData).then(function() {
                setCollectionData(
                    ViolationTypeCollection,
                    ViolationTypeModel,
                    violationTypes,
                    function() {
                        sendDevLog("Model saved with id " + newSetupModel.id);
                        console.log('Model saved with id ' + newSetupModel.id);
                        window.location.href = "./summary";
                    });
            }, function() {
                $('#error-message').show();
                sendUxLog("Unable to save changes!");
            });
        }
    });

    function sendUxLog(message) {
        sendLog("/services/pas_ux_logs", message);
    }

    function sendDevLog(message) {
        sendLog("/services/pas_dev_logs", message);
    }

    // Sends log messages to a Splunk instance via HTTP Input
    function sendLog(endpoint, message) {
        var log_message = {
            "event":
                {
                    "message": "[User: " + currentUser + "] " + message
                }
            };

        logService.post(endpoint, log_message,
            function(err, response) {
                if(null!=response) {
                    console.log("Logged interaction event successfully.");
                } else {
                    console.log("Error logging interaction event.  Message: " + err.error);
                }
        });
    }

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