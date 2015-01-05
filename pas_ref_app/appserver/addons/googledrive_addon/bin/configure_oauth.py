#!/usr/bin/python

import httplib2
import fileinput
import sys
import logging
from oauth2client.file import Storage
from oauth2client.client import OAuth2WebServerFlow

if len(sys.argv)!=3: 
        print "Usage:./splunk cmd python ../etc/apps/googledrive_addon/bin/configure_oauth.py CLIENT_ID CLIENT_SECRET" 
        sys.exit()

CLIENT_ID = sys.argv[1]
CLIENT_SECRET = sys.argv[2]

# Check https://developers.google.com/admin-sdk/reports/v1/guides/authorizing for all available scopes
OAUTH_SCOPE = 'https://www.googleapis.com/auth/admin.reports.audit.readonly'

# Redirect URI for installed apps
REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'

storage = Storage('google_drive_creds')

# Run through the OAuth flow and retrieve credentials
logging.basicConfig(filename='debug.log',level=logging.DEBUG)
flow = OAuth2WebServerFlow(CLIENT_ID, CLIENT_SECRET, OAUTH_SCOPE, REDIRECT_URI)
authorize_url = flow.step1_get_authorize_url()
print 'Go to the following link in your browser: '
print  authorize_url
code = raw_input('Enter verification code: ').strip()
credentials = flow.step2_exchange(code)
storage.put(credentials)
print "OAuth succeed"
