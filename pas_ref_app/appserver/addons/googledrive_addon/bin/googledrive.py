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
    # Any output to STDERR will be captured and appended to splunkd.log and
    # will be available in Splunk. For more details, check out
    # 'Set up logging' in the 'Modular inputs' section of the
    # 'Developing Views and Apps for Splunk Web' guide.

    # Don't get bit- remember that even though we are logging out debug
    # here, Splunk will only index (by default) info or above. 

    logging.root
    logging.root.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(levelname)s %(message)s')
    handler = logging.StreamHandler(stream=sys.stderr)
    handler.setFormatter(formatter)
    logging.root.addHandler(handler)

    # The commented section below shows a good way to log to a separate
    # file that Splunk will pick up and index. In this way you can start
    # your development logging to debug and watching what's happening in
    # Splunk, and then easily switch to best practices as shown above.

    # logger = logging.getLogger('googledrive')
    # logger.propagate = False
    # logger.setLevel(logging.DEBUG)

    # file_handler = logging.handlers.RotatingFileHandler(
    #                 make_splunkhome_path(['var', 'log', 'splunk', 
    #                                       'googledrive.log']),
    #                                     maxBytes=25000000, backupCount=5)

    # formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
    # file_handler.setFormatter(formatter)

    # logger.addHandler(file_handler)

    return logging.getLogger('googledrive')

logger = setup_logger()

# Inherit from splunklib.modularinput.Script- does a lot of the heavy lifing
# for us.
class MyScript(Script):
    def get_scheme(self):
        # This scheme allows for customization of the input. Any arguments
        # we define here will be prompted for when the end user sets up the
        # input- the values they provide will then be provided on the second
        # argument of `stream_events` below (in the 'inputs' property).

        # Note that if it's an optional field (as our description is below)
        # the field will not show if the end user didn't provide a value.

        scheme = Scheme("Google Drive Activity Stream")
        scheme.description = "Streams activity events from Google Drive"
        scheme.use_external_validation = True

        # Add arguments.  In this case we are just asking for an optional
        # 'description' argument that will be saved, but won't be used.
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

        for input_stanza,input_item in inputs.inputs.iteritems():
            input_type, input_name = input_stanza.split('://')
            logger.info("Processing inputs for %s", input_name)

            INTERVAL = input_item["interval"]
            OAUTH_SCOPE = 'https://www.googleapis.com/auth/admin.reports.audit.readonly'

            # Redirect URI for installed apps
            REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'

            logger.debug("Getting credentials")

            # We are saving a credential file for each named input.
            credentials_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), input_name + "_google_drive_creds")
            logger.debug("Path to OAuth2 Credentials: " + credentials_path)

            # If we don't find the authentication file, log an error and continue on to the next input (if any)
            if not(os.path.isfile(credentials_path)):
                logger.error("Google Drive modular input %s is not fully configured- please read README.txt for details", input_name)
                break

            storage = Storage(credentials_path)
            credentials = storage.get()

            # Create an httplib2.Http object and authorize it with our credentials
            http = httplib2.Http()

            #TODO: Fix cert validation
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
            logger.info("Start Time: " + start_time + ", End Time: " + end_time)

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
                    raw_event.stanza = input_stanza
                    raw_event.data = '%s email=%s src=%s type=%s event=%s %s' % (time,email,ip_address,event_type,event_name,parameters)
                    ew.write_event(raw_event)
        logger.debug("Finished processing!")

if __name__ == "__main__":
    sys.exit(MyScript().run(sys.argv))
