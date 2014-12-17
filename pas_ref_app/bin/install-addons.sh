# Script to install Splunk add-ons

echo ===
echo Creating symbolic links to Splunk Reference Solution add-ons in $SPLUNK_HOME
echo ===

cd ../appserver/addons
ln -sv $PWD/* $SPLUNK_HOME/etc/apps
