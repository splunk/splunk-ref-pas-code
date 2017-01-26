# Script to install Splunk add-ons
if [ -z "$SPLUNK_HOME" ]; then
    echo "Please set SPLUNK_HOME"
    exit 1
fi

echo ===
echo Creating symbolic links to Splunk Reference Solution add-ons in $SPLUNK_HOME
echo ===

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.."
cd $SCRIPT_DIR/appserver/addons
ln -sv $PWD/* $SPLUNK_HOME/etc/apps
