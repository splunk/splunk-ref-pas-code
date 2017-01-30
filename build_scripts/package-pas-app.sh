#!/bin/bash

print_usage()
{
    echo "Usage: ${0} [-h|-c]"
    echo "  -h: print help (this message)"
    echo "  -c: build app for cloud install"
}

cleanup()
{
    if [ -e working_tree ]
    then
        rm -rf working_tree
    fi
}


INSTALL_TYPE=normal
while getopts "ch" opt; do
    case $opt in
        c)
            INSTALL_TYPE=cloud
            ;;
        h)
            print_usage
            ;;
        \?)
            echo "Invalid option: -$OPTARG" >&2
            ;;
    esac
done

cleanup
git clone --recursive --depth 1 https://github.com/splunk/splunk-ref-pas-code-ember.git working_tree
VERSION=`grep version working_tree/pas_ref_app/default/app.conf | sed 's/.*=\s*\([1-9\.]*\)/\1/' | tr -d '[:space:]'`
cp -r working_tree/pas_ref_app output_tree

if [ "${INSTALL_TYPE}" = "cloud" ]
then
    # This uses a program called 'xmlstarlet' to modify the views with xslt. On a mac, 'brew install xmlstarlet'.
    echo "Building app for cloud deployment"
    filename="splunk-reference-app-pas-${VERSION}-cloud.spl"

    sed -i '' -e 's/\(tag=pas\)/index=pas \1/' `grep -rl 'tag=pas' working_tree | xargs`
    sed -i '' -e 's/state[[:space:]]*=[[:space:]]enabled/state = disabled/' working_tree/pas_ref_app/appserver/addons/eventgen/default/app.conf
    rm working_tree/pas_ref_app/appserver/addons/eventgen/local/app.conf
    xml ed --inplace -u "//input[@id = 'timerange']/default/earliestTime" -v '@y' working_tree/pas_ref_app/default/data/ui/views/summary.xml

    # GitHub has a SVN bridge.  We can use that to be a bit more surgical about the code we pull.
    svn export https://github.com/splunk/splunk-ref-pas-test-ember/trunk/tests/pas_sample_data working_tree/pas_ref_app/appserver/addons/pas_sample_data
    svn export https://github.com/splunk/splunk-ref-pas-test-ember/trunk/tests/PythonTest/UpdateTestdataDatetime.py working_tree/UpdateTestdataDatetime.py
    python working_tree/UpdateTestdataDatetime.py working_tree/pas_ref_app/appserver/addons/pas_sample_data/data/testdata.log
else
    echo "Building app for normal Splunk deployment"
    filename="splunk-reference-app-pas-${VERSION}.spl"
fi

cd working_tree
tar cvzf ../${filename} --exclude '.*' pas_ref_app
cleanup
