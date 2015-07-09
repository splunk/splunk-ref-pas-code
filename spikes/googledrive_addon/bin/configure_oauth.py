import splunk.admin as admin
import splunk.entity as entity
import splunk.rest
import splunk.util
import httplib2, urllib, os, time
import urllib, json
import logging
import logging.handlers
import httplib2
import fileinput
import sys
from splunk.appserver.mrsparkle.lib.util import make_splunkhome_path

# set our path to this particular application directory (which is suppose to be <appname>/bin)
app_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(app_dir)
from oauth2client.file import Storage
from oauth2client.client import OAuth2WebServerFlow

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
        redirect_uri = 'urn:ietf:wg:oauth:2.0:oob'
        oauth_scope = 'https://www.googleapis.com/auth/admin.reports.audit.readonly'

        try:
            client_id = self.args.get('client_id')
            client_secret = self.args.get('client_secret')
            auth_code = self.args.get('auth_code')

            storage = Storage(app_dir + os.path.sep + 'google_drive_creds')

            flow = OAuth2WebServerFlow(client_id, client_secret, oauth_scope, redirect_uri)
            credentials = flow.step2_exchange(auth_code)
            logger.debug("Obtained OAuth2 credentials!")
            storage.put(credentials)
        except Exception, e:
                logger.exception(e)
                self.response.write(e)

    # listen to all verbs
    handle_GET = handle_DELETE = handle_PUT = handle_VIEW = handle_POST
