#!/bin/bash

# this script will generate the splunk-googledrive-addon-150.tar.gz which you can use to install the googledrive addon on splunk

cd splunk-ref-pas-code-ember/pas_ref_app/appserver/addons

platform=$(uname)

if [ "$platform" = "Darwin" ]
then
    tar cvzf --exclude=googledrive_addon/default/inputs.conf -f splunk-googledrive-addon-150.tar.gz googledrive_addon 
else
    tar cvzf splunk-googledrive-addon-150.tar.gz googledrive_addon --exclude=./googledrive_addon/default/inputs.conf
fi

mv splunk-googledrive-addon-150.tar.gz ../../../..
cd ../../../..
