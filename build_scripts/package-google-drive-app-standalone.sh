#/bin/bash

cd splunk-ref-pas-code-ember/pas_ref_app/appserver/addons
tar cvzf googledrive_addon.tar.gz googledrive_addon --exclude=./googledrive_addon/default/inputs.conf

# For Mac OS X comment the previous tar command and uncomment the following line
# tar cvzf --exclude=googledrive_addon/default/inputs.conf -f googledrive_addon.tar.gz googledrive_addon 

mv googledrive_addon.tar.gz ../../../..