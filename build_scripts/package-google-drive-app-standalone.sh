# this script will generate the splunk-googledrive-addon-150.tar.gz which you can use to install the googledrive addon on splunk

pwd/bin/bash

cd splunk-ref-pas-code-ember/pas_ref_app/appserver/addons
tar cvzf splunk-googledrive-addon-150.tar.gz googledrive_addon --exclude=./googledrive_addon/default/inputs.conf

# For Mac OS X comment the previous tar command and uncomment the following line
#tar cvzf --exclude=googledrive_addon/default/inputs.conf -f splunk-googledrive-addon-150.tar.gz googledrive_addon 

mv splunk-googledrive-addon-150.tar.gz ../../../..
cd ../../../..
