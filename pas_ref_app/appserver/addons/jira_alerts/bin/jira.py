import sys
import json
import urllib2
import requests

# creates outbound message from alert payload contents
# and attempts to send to the specified endpoint
def send_message(payload):
    config = payload.get('configuration')

    ISSUE_REST_PATH = "/rest/api/latest/issue"
    url = config.get('jira_url')
    jira_url = url + ISSUE_REST_PATH
    username = config.get('jira_username')
    password = get_jira_password(payload)

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
    except Exception, e:
        print >> sys.stderr, "ERROR Error sending message: %s" % e
        return False

def get_jira_password(payload):
    SPLUNK_SERVER = payload.get('server_uri')
    password_url = SPLUNK_SERVER + '/servicesNS/nobody/jira_alerts/storage/passwords/%3Ajira_password%3A?output_mode=json'

    headers = {'Authorization': 'Splunk ' + payload.get('session_key')}
    try:
        # attempting to retrieve cleartext password, disabling SSL verification for practical reasons
        result = requests.get(url=password_url, headers=headers, verify=False)
        if result.status_code != 200:
            print >> sys.stderr, "ERROR Error: %s" % str(result.json())
    except Exception, e:
        print >> sys.stderr, "ERROR Error sending message: %s" % e
        return False

    splunk_response = json.loads(result.text)
    jira_password = splunk_response.get("entry")[0].get("content").get("clear_password")

    return jira_password

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--execute":
        try:
            # retrieving message payload from splunk
            raw_payload = sys.stdin.read()
            payload = json.loads(raw_payload)
            send_message(payload)
        except Exception, e:
            print >> sys.stderr, "ERROR Unexpected error: %s" % e
            sys.exit(3)
    else:
        print >> sys.stderr, "FATAL Unsupported execution mode (expected --execute flag)"
        sys.exit(1)