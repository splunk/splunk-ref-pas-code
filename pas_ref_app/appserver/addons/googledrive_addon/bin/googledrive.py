import sys
import os

from splunklib.modularinput import *

import logging
import logging.handlers
import httplib2

from apiclient import errors
from apiclient.discovery import build
from datetime import datetime, timedelta
from oauth2client.file import Storage
from oauth2client.client import OAuth2WebServerFlow
from splunk.appserver.mrsparkle.lib.util import make_splunkhome_path

def setup_logger():
    logger = logging.getLogger('googledrive')
    logger.propagate = False
    logger.setLevel(logging.DEBUG)

    file_handler = logging.handlers.RotatingFileHandler(
                    make_splunkhome_path(['var', 'log', 'splunk', 
                                          'googledrive.log']),
                                        maxBytes=25000000, backupCount=5)
    
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
    file_handler.setFormatter(formatter)

    logger.addHandler(file_handler)
    
    return logger

logger = setup_logger()

class MyScript(Script):
    def get_scheme(self):
        # Setup scheme.
        scheme = Scheme("Google Drive Activity Stream")
        scheme.description = "Streams activity events from Google Drive"
        scheme.use_external_validation = True

        #Add arguments
        description_argument = Argument("description")
        description_argument.data_type = Argument.data_type_string
        description_argument.description = "(Optional) A description of the Google Drive input."
        description_argument.required_on_create = False
        scheme.add_argument(description_argument)

        return scheme

    def stream_events(self, inputs, ew):
        logger.debug("In stream_events()")

        # Splunk Enterprise calls the modular input, 
        # streams XML describing the inputs to stdin,
        # and waits for XML on stdout describing events.
        for input_name,input_item in inputs.inputs.iteritems():
            logger.debug("Processing inputs!")
            INTERVAL = input_item["interval"]
            OAUTH_SCOPE = 'https://www.googleapis.com/auth/admin.reports.audit.readonly'

            # Redirect URI for installed apps
            REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'

            logger.debug("Getting credentials")

            credentials_path = os.path.join(os.path.dirname(os.path.abspath(__file__)),"google_drive_creds")
            logger.debug("Path to OAuth2 Credentials: " + credentials_path)
            storage = Storage(credentials_path)
            credentials = storage.get()

            # Create an httplib2.Http object and authorize it with our credentials
            http = httplib2.Http()

            #TODO: Fix cert validation
            http.disable_ssl_certificate_validation = True
            http = credentials.authorize(http)
            logger.debug("Credentials validated successfully!")
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
            logger.debug("Start Time: " + start_time + ", End Time: " + end_time)

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
                except Exception, e:
                    logger.exception(e)
                    break

            for activity in activity_stream:
                logger.debug("Parsing activities!")
                time = activity["id"]["time"]
                email = activity["actor"]["email"]
                ip_address = activity.get("ipAddress")
                for event in activity["events"]:
                    logger.debug("Parsing activity events!")
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
                    
        logger.debug("Finished processing!")

if __name__ == "__main__":
    sys.exit(MyScript().run(sys.argv))