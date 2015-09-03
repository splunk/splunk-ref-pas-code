import splunk.rest
import splunk.util
import httplib2, os
import json
import logging
import logging.handlers
import fileinput
import sys
from splunk.appserver.mrsparkle.lib.util import make_splunkhome_path

# set our path to this particular application directory (which is suppose to be <appname>/bin)
app_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(app_dir)
from oauth2client.file import Storage
from oauth2client.client import OAuth2WebServerFlow


# Redirect URI for installed apps
REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'
# Check https://developers.google.com/admin-sdk/reports/v1/guides/authorizing for all available scopes
OAUTH_SCOPE = 'https://www.googleapis.com/auth/admin.reports.audit.readonly'

def setup_logger():
    logger = logging.getLogger('configure_oauth')
    logger.propagate = False
    logger.setLevel(logging.DEBUG)

    file_handler = logging.handlers.RotatingFileHandler(
                    make_splunkhome_path(['var', 'log', 'splunk', 
                                          'configure_oauth.log']),
                                        maxBytes=25000000, backupCount=5)

    formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
    file_handler.setFormatter(formatter)

    logger.addHandler(file_handler)
    return logger

logger = setup_logger()

class oauth_exchange(splunk.rest.BaseRestHandler):
    def handle_POST(self):
        try:
            client_id = self.args.get('client_id')
            client_secret = self.args.get('client_secret')
            auth_code = self.args.get('auth_code')
            input_name = self.args.get('input_name')

            storage = Storage(app_dir + os.path.sep + input_name + '_google_drive_creds')

            flow = OAuth2WebServerFlow(client_id, client_secret, OAUTH_SCOPE, REDIRECT_URI)
            credentials = flow.step2_exchange(auth_code)
            logger.debug("Obtained OAuth2 credentials!")
            storage.put(credentials)
        except Exception, e:
                logger.exception(e)
                self.response.write(e)
    handle_POST

class oauth_status(splunk.rest.BaseRestHandler):
    def handle_GET(self):
        try:
            input_name = self.args.get('input_name')
            is_configured = os.path.isfile(app_dir + os.path.sep + input_name + '_google_drive_creds')
            logger.debug("Is Google Drive Add-on Configured: " + str(is_configured))

            state = json.dumps({
                "configured": is_configured
            })

            self.response.write(state)
        except Exception, e:
                logger.exception(e)
                self.response.write(e)
    handle_GET

if __name__ == "__mainly__":
    if len(sys.argv)!=3:
            print "Usage:./splunk cmd python ../etc/apps/googledrive_addon/bin/configure_oauth.py INPUT_NAME CLIENT_ID CLIENT_SECRET"
            sys.exit()

    input_name = sys.argv[1]
    client_id = sys.argv[2]
    client_secret = sys.argv[3]

    storage = Storage(input_name + '_google_drive_creds')

    # Run through the OAuth flow and retrieve credentials
    flow = OAuth2WebServerFlow(client_id, client_secret, OAUTH_SCOPE, REDIRECT_URI)
    authorize_url = flow.step1_get_authorize_url()
    print 'Go to the following link in your browser: '
    print  authorize_url
    code = raw_input('Enter verification code: ').strip()
    credentials = flow.step2_exchange(code)
    storage.put(credentials)
    print "OAuth sign-in succeeded"
