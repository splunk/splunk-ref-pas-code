import sys
import os

from splunklib.modularinput import *
import httplib2

from apiclient import errors
from apiclient.discovery import build
from datetime import datetime, timedelta
from oauth2client.file import Storage
from oauth2client.client import OAuth2WebServerFlow

import pprint

class MyScript(Script):

    def get_scheme(self):
        # Setup scheme.
        scheme = Scheme("Google Drive Activity Stream")
        scheme.description = "Streams activity events from Google Drive"
        scheme.use_external_validation = True

        #Add arguments
        clientid_argument = Argument("client_id")
        clientid_argument.data_type = Argument.data_type_string
        clientid_argument.description = "OAuth Client ID from Google Developers Console"
        clientid_argument.required_on_create = True
        scheme.add_argument(clientid_argument)

        clientsecret_argument = Argument("client_secret")
        clientsecret_argument.data_type = Argument.data_type_string
        clientsecret_argument.description = "OAuth Client Secret from Google Developers Console"
        clientsecret_argument.required_on_create = True
        scheme.add_argument(clientsecret_argument)

        return scheme

    def stream_events(self, inputs, ew):
        # Splunk Enterprise calls the modular input, 
        # streams XML describing the inputs to stdin,
        # and waits for XML on stdout describing events.
        for input_name,input_item in inputs.inputs.iteritems():
            ew.log("INFO","Starting input")
            CLIENT_ID = input_item["client_id"]
            CLIENT_SECRET = input_item["client_secret"]
            INTERVAL = input_item["interval"]
            ew.log("INFO", 'client_id=%s client_secret=%s interval=%s' % (CLIENT_ID,CLIENT_SECRET,INTERVAL))
            OAUTH_SCOPE = 'https://www.googleapis.com/auth/admin.reports.audit.readonly'

			# Redirect URI for installed apps
            REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'

            ew.log("INFO","Getting credentials")
            ew.log("INFO",os.path.expandvars('$SPLUNK_HOME/bin/google_drive_creds'))
            storage = Storage(os.path.expandvars('$SPLUNK_HOME/bin/google_drive_creds'))
            credentials = storage.get()

            # Create an httplib2.Http object and authorize it with our credentials
            http = httplib2.Http()

            #TODO: Fix cert validation - THIS IS BAD
            http.disable_ssl_certificate_validation = True
            http = credentials.authorize(http)
            reports_service = build('admin', 'reports_v1', http=http)

            dtnow = datetime.now()
            dtutcnow = datetime.utcnow()
            delta = dtnow - dtutcnow
            hh,mm = divmod((delta.days * 24*60*60 + delta.seconds + 30) // 60, 60)
            timezone = "%+03d:%02d" % (hh, mm)

            now = datetime.now().replace(second=0, microsecond=0)
            begin = now - timedelta(seconds=int(INTERVAL))
            start_time = begin.isoformat('T') + timezone
            end_time = now.isoformat('T') + timezone


            activity_stream = []
            page_token = None
            params = {'applicationName': 'drive', 'userKey': 'all', 'startTime': start_time, 'endTime' : end_time}
            while True:
                try:
                    if page_token:
                        param['pageToken'] = page_token
                    current_page = reports_service.activities().list(**params).execute()
                    if current_page.get('items'):
                        activity_stream.extend(current_page['items'])
                    page_token = current_page.get('nextPageToken')
                    if not page_token:
                        break
                except errors.HttpError as error:
                    ew.log("ERROR",'An error occurred: %s' % error)
                    break
            for activity in activity_stream:
                time = activity["id"]["time"]
                email = activity["actor"]["email"]
                ip_address = activity.get("ipAddress")
                for event in activity["events"]:
                    event_type = event["type"]
                    event_name = event["name"]
                    parameters = ""
                    for parameter in event["parameters"]:
                        value = parameter.get("value")
                        if value == None:
                            value = parameter.get("boolValue")
                        parameters += '%s="%s" ' % (parameter["name"], value)
                    raw_event = Event()
                    raw_event.stanza = input_name
                    raw_event.data = '%s email=%s src=%s type=%s event=%s %s' % (time,email,ip_address,event_type,event_name,parameters)
                    ew.write_event(raw_event)

if __name__ == "__main__":
    sys.exit(MyScript().run(sys.argv))