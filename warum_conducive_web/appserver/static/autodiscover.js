/*
 * Shim to allow components developed using Splunk's Django framework
 * to be autodiscovered and instantiated on Simple XML dashboards automatically.
 * 
 * Specifically <div class="splunk-view" data-require="..." data-options="..."/>
 * tags are automatically instantiated with this shim.
 */

require.config({
    paths: {
        "app": "../app"
    }
});

require(['splunkjs/ready!'], function(){
    // The splunkjs/ready! loader script will automatically instantiate all elements
    // declared in the dashboard's HTML.
});
