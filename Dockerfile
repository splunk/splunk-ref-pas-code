FROM splunk/splunk
COPY apps /var/opt/splunk/etc/apps/
COPY out/work/optional_dependencies /var/opt/splunk/etc/apps/
