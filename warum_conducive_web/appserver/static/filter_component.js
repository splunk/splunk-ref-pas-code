function generateFilterComponent(mvc)
{
  //include dependencies
  var TimeRangeView = require("splunkjs/mvc/timerangeview");
  var RadioGroupView = require("splunkjs/mvc/radiogroupview");
  var TextInputView = require("splunkjs/mvc/textinputview");

  var defaultTokens = mvc.Components.getInstance("default");
  var submittedTokens = mvc.Components.getInstance("submitted");
  
  // Facade that reads & writes to both the "default" and "submitted" token
  // models. This is necessary to send token values to both searches and to
  // other attributes.
  var tokens = {
    get: function(tokenName) {
      return defaultTokens.get(tokenName);
    },
    
    set: function(tokenName, tokenValue) {
      defaultTokens.set(tokenName, tokenValue);
      submittedTokens.set(tokenName, tokenValue);
    }
  };

  //set default for filters
  tokens.set("filter","");
  tokens.set("exclude","");

  var choices = [
      {label: "True", value: "True"},
      {label: "False", value: "False"},
      {label: "Both", value: "*"}
  ];

  //initalize time picker and radio controls
  var timerange = new TimeRangeView({
      id: "timepicker",
      preset: "Last 24 hours",
      dialogOptions: {
          showCustomRealTime: false,
          showPresetsRealTime :false,
          enableCustomAdvancedRealTime: false
      },
      el: $("#timepicker")
  }).render();

  // Event Handling
  $("#reset_filter").on("click", function(e) {
      $("#filter_header").hide();
      tokens.set("filter", "*");
      tokens.set("exclude","*");
  });

        $(document).on("click:menu", function(e) {
            action = e.action;
            if (e.drilldown_search != "") {
                base_search = e.drilldown_search;
                earliest = timerange.val().earliest_time;
                latest = timerange.val().latest_time;
            }
            else {
                base_search = e.splunk_data.component.manager.search.attributes.search + " | " + e.splunk_data.component.manager.settings.attributes.search
                earliest = e.splunk_data.component.manager.search.attributes.data.searchEarliestTime;
                latest = e.splunk_data.component.manager.search.attributes.data.searchLatestTime;
            }

            if (e.splunk_data.data) {
                name = e.splunk_data.data["click.name"];
                value = e.splunk_data.data["click.value"];
            }
            else {
                name = e.splunk_data.name;
                value = e.splunk_data.value;
                //timechart check
                if (name == "_time") {
                  name = "command";
                  value = e.splunk_data.name2;
                }            
            }

            if (action=="include")
                filter(tokens,name,value);
            if (action=="exclude")
                exclude(tokens,name,value);
            if (action=="drilldown")
                drilldown(tokens,base_search,name,value,earliest,latest);
        });

        jQuery("#filter_tags_input").tagsinput({
          itemText: 'text',
          itemValue: 'field_value',
          tagClass: function(item) {
             return (item.action ==  "filter" ? 'label filter' : 'label exclude');
          },
          freeInput: false
        });

        $('#filter_tags_input').on('itemRemoved', function(event) {
            if (event.item.action == "filter") {
                filter_string = tokens.get("filter")
                filter_string = filter_string.replace("FILTER " + event.item.field_name + " is \"" + event.item.field_value + "\"","")
                //if (filter_string == "") filter_string="*";
                tokens.set("filter",filter_string);
            }
            else {
                filter_string = tokens.get("exclude")
                filter_string = filter_string.replace("FILTER " + event.item.field_name + " isNot \"" + event.item.field_value + "\"","")
                //if (filter_string == "") filter_string="*";
                tokens.set("exclude",filter_string);
            }
        });
}

function filter(tokens,field_name,field_value)
{
    var filter_search = "";
    var terms = "FILTER " + field_name + " is \"" + field_value + "\""
    filter_search = tokens.get("filter");
    filter_search += terms;
    tokens.set("filter", filter_search);
    jQuery("#filter_tags_input").tagsinput('add', { "action": "filter" ,"field_name": field_name, "field_value": field_value, "text":terms });
}

function exclude(tokens,field_name,field_value)
{
    var exclude_search = "";
    var terms = "FILTER " + field_name + " isNot \"" + field_value + "\" ";
    exclude_search = tokens.get("exclude");
    if (exclude_search=="*") exclude_search="";
    exclude_search += terms;
    tokens.set("exclude",exclude_search)
    jQuery("#filter_tags_input").tagsinput('add', { "action": "exclude" ,"field_name": field_name, "field_value": field_value,"text": terms });
}
function drilldown(tokens,base_search,field_name,field_value,earliest,latest)
{
    if (field_name == "user") {
        page = "user_details";
    }
    if (field_name == "object") {
        page = "document_details";
    }
    var exclude = tokens.get("exclude");
    var include = tokens.get("filter");
    exclude = exclude.replace("Channel=\"","eventtype=\"egress:");
    include = include.replace("Channel=\"","eventtype=\"egress:");
    var terms = field_name + "=\"" + field_value + "\""
    var search = base_search.replace("$criteria$",terms +" " + include + " " + exclude);
    window.open("../" + page + "?earliest=" + earliest + "&latest=" + latest + "&" + field_name +"=" + field_value,"_blank");
}

