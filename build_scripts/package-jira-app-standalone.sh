#!/bin/bash
# this script will generate splunk-jira-alerts-150.tar.gz which you can use to install jira alert addon on splunk

cd splunk-ref-pas-code-ember/pas_ref_app/appserver/addons
tar cvzf splunk-jira-alerts-150.tar.gz jira_alerts
mv splunk-jira-alerts-150.tar.gz ../../../..
cd ../../../..
