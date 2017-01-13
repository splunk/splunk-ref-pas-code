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
    var dev_debug_key = "";
    var ux_logging_key = "";

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
                oldSetupModelId = setupData._key;
            }

            // Populate departments in the UI
            departmentsDropdown.val(setupData.departments || []);

            // Populate violation types in the UI
            if (violationTypes.length != DEFAULT_VIOLATION_TYPES.length) {
                violationTypes = DEFAULT_VIOLATION_TYPES;
            }
            _.each(violationTypes, function(violationType) {
                var rowElement = $(VIOLATION_TYPE_ROW_TEMPLATE())
                    .appendTo($("#violation_types"));

                $('.name input', rowElement).val(violationType.title);
                $('.color input', rowElement).val(violationType.color);
                $('.weight input', rowElement).val(violationType.weight);
            });

            var learningTipsEnabled = (setupData.learningTipsEnabled === 'True');
            $('#learn_more_tips_toggle input').prop('checked', learningTipsEnabled);

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
            var googleDriveApp = apps.item('splunk-add-on-google-drive');
            if (googleDriveApp && !googleDriveApp.state().content.disabled) {
                isOauthConfigured(); // checking oauth2 credential state on filesystem
                sendDevLog("Enabling Google Drive Add-on in Setup interface.");
                $('#googleDriveModule').removeClass('hide');
            }

            var eventgenApp = apps.item('eventgen') || apps.item('SA-Eventgen');
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
            $("#gAuthAuthorizing").removeClass('hide');
            $("#gAuthNotConfigured").addClass('hide');
        }
    });
    
    $("#saveAuth").click(function() {
        var client_id = $("#clientId").val();
        var client_secret = $("#clientSecret").val();
        var auth_code = $("#authCode").val();
        var input_name = $("#inputName").val();
        if(auth_code.length > 0) {
            // Creating OAuth2 object for key exchange
            var oauth2_record = {
                "auth_code": auth_code,
                "client_id" : client_id,
                "client_secret" : client_secret,
                "input_name" : input_name
            };

            // name to exchange auth token for refresh token via call to custom RESTful endpoint
            // Details are located in restmap.conf
            var service = mvc.createService();
            service.post("/services/configure_oauth", oauth2_record,
                function(err, response) {
                    $("#gAuthAuthorizing").addClass('hide');
                    if(null!=response) {
                        $("#codeEntry").addClass('hide');
                        $("#gAuthSuccess").removeClass('hide');
                        $("#gAuthError").addClass('hide');
                        $("#gAuthNotConfigured").addClass('hide');
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
            sendUxLog( "Learn more tips checked: " + tipsEnabled);
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
        if(ux_logging_key.length>0) {
            sendLog(message, ux_logging_key);
        } else {
            console.log("UX Logging - No HTTP Input Key has been set!  Event logging disabled.");
        }
    }

    function sendDevLog(message) {
        if(dev_debug_key.length>0) {
            sendLog(message, dev_debug_key);
        } else {
            console.log("Dev Debug - No HTTP Input Key has been set!  Event logging disabled.");
        }
    }

    // Create the XHR object.
    function createCORSRequest(method, url) {
        var xhr = new XMLHttpRequest();
        if ("withCredentials" in xhr) {
            // XHR for Chrome/Firefox/Opera/Safari.
            xhr.open(method, url, true);
        } else if (typeof XDomainRequest != "undefined") {
            // XDomainRequest for IE.
            xhr = new XDomainRequest();
            xhr.open(method, url);
        } else {
            // CORS not supported.
            xhr = null;
        }
        return xhr;
    }

    function sendLog(message, authCode) {
        var http_request = new XMLHttpRequest();
        var http_input_url = "http://lappy386:8088/services/collector";
        // Using lower-level call to XMLHttpRequest due to issues with how
        // JQuery handles CORS requests
        var xhr = createCORSRequest('POST', http_input_url);
        xhr.setRequestHeader('Content-Type', 'text/plain');
        xhr.setRequestHeader('Authorization', 'Splunk ' + authCode);

        var log_message = {
            "event":
                {
                    "username": currentUser,
                    "message": message
                }
            };

            xhr.send(JSON.stringify(log_message));
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

    // Determines whether or not the Google Drive OAuth2
    // credentials have been generated and shows UI element
    // indicating credential status
    function isOauthConfigured() {
        var service = mvc.createService();
        service.get('/services/configure_oauth/status', {check: "configured", input_name: "googledrive_input"},
            function(err, response) {
                if(JSON.parse(response.data).configured==true) {
                    $('#gAuthNotConfigured').addClass('hide');
                    $('#gAuthConfigured').removeClass('hide');
                } else {
                    $('#gAuthConfigured').addClass('hide');
                    $('#gAuthNotConfigured').removeClass('hide');
                }
            });
    }
});
