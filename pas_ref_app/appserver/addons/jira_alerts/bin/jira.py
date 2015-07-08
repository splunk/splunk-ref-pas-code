import sys
import json
import urllib2
import requests

# creates outbound message from alert payload contents
# and attempts to send to the specified endpoint
def send_message(config):
    ISSUE_REST_PATH = "/rest/api/latest/issue"
    url = config.get('jira_url')
    jira_url = url + ISSUE_REST_PATH
    username = config.get('username')
    password = config.get('password')

    # create outbound JSON message body
    body = json.dumps({
        "fields": {
            "project": {
                "key" : config.get('project_key')
            },
            "summary": config.get('summary'),
            "description": config.get('description'),
            "issuetype": {
                "id": config.get('issue_type')
            }
        }
    })

    # create outbound request object
    try:
        headers = {"Content-Type": "application/json"}
        result = requests.post(url=jira_url, data=body, headers=headers, auth=(username, password))
        if result.status_code != 200:
            print >> sys.stderr, "ERROR: %s" % str(result.json())
    except Exception, e:
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