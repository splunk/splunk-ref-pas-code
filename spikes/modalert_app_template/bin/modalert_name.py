"""
This script is intended to show the basic interaction between Splunk,
this script and an endpoint.

The script receives the JSON or XML payload from Splunk, parses out a URL
and a message, builds a message object and then sends the message to the
custom endpoint.

Alert action message payload contents include:
    * Environment Information - splunkd access information (url, session keys, etc)
    * Alert action information - Custom alert keys as defined savedsearches.conf
    * First search result - All extracted field values from the first search
      result (useful in certain situations).

   TODO:
    Write up section on JSON payload structure
    Write up section on logging
"""

import sys
import json
import urllib2

# creates outbound message from alert payload contents
# and attempts to send to the specified endpoint
def send_message(config):
    # retrieve endpoint url
    url = config.get('url')

    # create outbound message body
    body = OrderedDict(
        message=config.get('message')
    )

    # create outbound request object
    req = urllib2.Request(url, body, {"Content-Type": "application/json"})

    try:
        res = urllib2.urlopen(req)
        body = res.read()
        return 200 <= res.code < 300
    except urllib2.HTTPError, e:
        print >> sys.stderr, "ERROR Error sending message: %s" % e
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--execute":
        try:
            # retrieving message payload from splunk
            payload = json.loads(sys.stdin.read())
            config = payload.get('configuration')

            send_message(config)
        except Exception, e:
            print >> sys.stderr, "ERROR Unexpected error: %s" % e
            sys.exit(3)
    else:
        print >> sys.stderr, "FATAL Unsupported execution mode (expected --execute flag)"
        sys.exit(1)