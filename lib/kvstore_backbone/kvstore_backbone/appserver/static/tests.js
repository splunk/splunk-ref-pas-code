require.config({
    paths: {
        'app': '../app',
        'mocha': '../app/kvstore_backbone/components/mocha',
        'chai': '../app/kvstore_backbone/components/chai',
        'kvstore': '../app/kvstore_backbone/lib/kvstore'
    },
    shim: {
        'mocha': {
            deps: ['jquery'],
            init: function () {
              this.mocha.setup('bdd');
              return this.mocha;
            }
        },
        'chai': {
            deps: ['jquery']
        }
    }
});

require(['splunkjs/mvc/simplexml/ready!'], function() {
    // Prepare Splunk and Test framework
    require(['mocha', 'splunkjs/ready!'], function(mocha) {
        // Load tests
        require(
        [
            'app/kvstore_backbone/tests/model-tests',
            'app/kvstore_backbone/tests/collection-tests'
        ], function() {
            mocha.run();
        });
    });
});