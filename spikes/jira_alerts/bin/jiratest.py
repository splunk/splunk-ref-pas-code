import sys
import json
import requests
#import base64
#import urllib2

# creates outbound message from alert payload contents
# and attempts to send to the specified endpoint
def send_message():
    url = "http://lappy386:8080/rest/api/latest/issue"
    username = "brian"
    password = "brian"

    # create outbound message body
    body = json.dumps({
        "fields": {
            "project": {
                "key" : "SIM"
            },
            "summary": "Test1",
            "description": "Holy crap you guys, its a test!",
            "issuetype": {
                "id": "3"
            }
        }
    })

    """
    body = json.dumps(dict(
        fields=dict(
            project = dict(
                key = "SIM"
            ),
            assignee = "brian",
            summary = "Test1",
            description = "Holy crap you guys, it"s a test",
            issuetype = dict(
                id = "2"
            )
        )
    ))
    """

    # create outbound request object
    try:
        headers = {"Content-Type": "application/json"}
        result = requests.post(url=url, data=body, headers=headers, auth=(username, password))
        if result.status_code != 200:
            print "ERROR: " + str(result.json())
    except Exception, e:
        print >> sys.stderr, "ERROR Error sending message: %s" % e
        return False

"""
    req = urllib2.Request(url, body)
    req.add_header("Authorization", "Basic " + base64string) 
    req.add_header("Content-Type","application/json")

    try:
        res = urllib2.urlopen(req)
        body = res.read()
        return 200 <= res.code < 300
    except Exception, e:
        print >> sys.stderr, "ERROR Error sending message: %s" % e
        return False
"""

if __name__ == "__main__":
    send_message()
    sys.exit(1)