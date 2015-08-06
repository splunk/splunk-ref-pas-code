import splunk
import requests
import json
import sys
import unittest
from xml.dom import minidom
from jira_helpers import *

'''
    This unit test checks:
        * The validity of a sample JSON payload intended to
          be sent to JIRA.

        * The ability of the JIRA Add-on to pull a JIRA username
          & password from the indicated Splunk instance.

    Asserts that necessary default values have been changed
    and for the existence of required keys.
    
    Set values for SPLUNK_URL, SPLUNK_USERNAME & SPLUNK_PASSWORD
    prior to executing unit tests.
'''
class TestJiraClass(unittest.TestCase):
    SPLUNK_URL = ""
    SPLUNK_USERNAME = ""
    SPLUNK_PASSWORD = ""

    @classmethod
    def setUpClass(cls):
        if cls.SPLUNK_URL is "" or cls.SPLUNK_USERNAME is "" or cls.SPLUNK_PASSWORD is "":
            print >> sys.stdout, "Please set Splunk configuration bits before executing test script."
            sys.exit(1)

        try:
            # loading sample payload JSON
            with open('jira_test.json') as data_file:
                cls.payload = json.load(data_file)
                cls.config = cls.payload.get('configuration')

            # obtaining splunk session key
            result = requests.post(url=cls.SPLUNK_URL + "/services/auth/login", data={'username':cls.SPLUNK_USERNAME, 'password':cls.SPLUNK_PASSWORD}, headers={}, verify=False)
            cls.session_key = minidom.parseString(result.text).getElementsByTagName('sessionKey')[0].childNodes[0].nodeValue
        except Exception, e:
            print >> sys.stderr, "ERROR Unable to parse JSON file.  Error: %s" % e

class TestJiraPayload(TestJiraClass):
    @classmethod
    def setUpClass(cls):
        super(TestJiraPayload, cls).setUpClass()

    # verifies that a JIRA username has been set in the Splunk instance
    def test_jira_username(self):
        username = get_jira_action_config(self.SPLUNK_URL, self.session_key).get('param.jira_username')
        self.assertNotEqual(username,None)

    # verifies that a JIRA password has been set in the Splunk instance
    def test_jira_password(self):
        self.assertNotEqual(get_jira_password(self.SPLUNK_URL, self.session_key),None)

    # Begin tests for correct values in the sample JSON payload
    def test_app(self):
        self.assertEqual(self.payload.get('app'),"pas_ref_app")

    def test_owner(self):
        self.assertEqual(self.payload.get('owner'),"system")

    def test_results_file(self):
        self.assertEqual(self.payload.get('results_file'),"")

    def test_results_link(self):
        self.assertEqual(self.payload.get('results_link'),"")

    def test_server_host(self):
        self.assertNotEqual(self.payload.get('server_host'),None)

    def test_server_uri(self):
        self.assertNotEqual(self.payload.get('server_uri'),None)

    def test_default_session(self):
        self.assertNotEqual(self.payload.get('session_key'),"SET_SESSION_KEY")

    def test_sid(self):
        self.assertEqual(self.payload.get('sid'),"")

    def test_search_name(self):
        self.assertEqual(self.payload.get('search_name'),"")

    def test_description(self):
        self.assertNotEqual(self.config.get('description'),None)

    def test_issue_type(self):
        self.assertNotEqual(self.config.get('issue_type'),None)

    def test_jira_url(self):
        self.assertNotEqual(self.config.get('jira_url'),"SET_JIRA_URL")

    def test_default_jira_username(self):
        self.assertNotEqual(self.config.get('jira_username'),"SET_USERNAME")

    def test_jira_priority(self):
        self.assertNotEqual(self.config.get('priority'),None)

    def test_jira_project_key(self):
        self.assertNotEqual(self.config.get('jira_username'),"SET_PROJECT_KEY")

    def test_jira_summary(self):
        self.assertNotEqual(self.config.get('summary'),None)

    def test_result(self):
        self.assertEqual(self.payload.get('result'),None)

if __name__ == '__main__':
    unittest.main()