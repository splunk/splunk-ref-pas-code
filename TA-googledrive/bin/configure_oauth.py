#!/usr/bin/python

import httplib2
import fileinput
import sys
import xml.etree.cElementTree as ET

from oauth2client.file import Storage
from oauth2client.client import OAuth2WebServerFlow

tree = ET.parse(sys.stdin)
root = tree.getroot()
configuration = tree.getroot().find("configuration").find("stanza").findall("param")
CLIENT_ID = configuration[0].text
CLIENT_SECRET = configuration[1].text

sys.stdin = open('/dev/tty')

# Check https://developers.google.com/admin-sdk/reports/v1/guides/authorizing for all available scopes
OAUTH_SCOPE = 'https://www.googleapis.com/auth/admin.reports.audit.readonly'

# Redirect URI for installed apps
REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'

storage = Storage('google_drive_creds')

# Run through the OAuth flow and retrieve credentials
flow = OAuth2WebServerFlow(CLIENT_ID, CLIENT_SECRET, OAUTH_SCOPE, REDIRECT_URI)
authorize_url = flow.step1_get_authorize_url()
print 'Go to the following link in your browser: ' + authorize_url
code = raw_input('Enter verification code: ').strip()
credentials = flow.step2_exchange(code)
storage.put(credentials)