This eventgen app is created from Splunk's original eventgen application.

https://github.com/coccyx/eventgen

To run this app, setup Splunk's eventgen app on your Splunk instance using below tutorial.

https://github.com/coccyx/eventgen/blob/master/README/Tutorial.md

This eventgen app is configured to create sample data on filesystem for dendogram visualization development.

To run this app use below python command.

$SPLUNK_HOME/bin/splunk cmd python $SPLUNK_HOME/etc/apps/eventgen/bin/eventgen.py $SPLUNK_HOME/etc/apps/dendogram_eventgen/local/eventgen.conf

