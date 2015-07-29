import splunk
import splunk.admin as admin
from generate_jira_dialog import generate_jira_dialog
from jira_helpers import *

PASSWORD_PLACEHOLDER = '*******'
DEFAULT_SETTINGS = ('project_key', 'issue_type', 'priority')

class JiraAlertsInstallHandler(admin.MConfigHandler):
    def __init__(self, *args):
        admin.MConfigHandler.__init__(self, *args)
        self.shouldAutoList = False

    def setup(self):
        self.supportedArgs.addOptArg('*')

    def handleList(self, confInfo):
        jira_settings = get_jira_settings(splunk.getLocalServerInfo(), self.getSessionKey())
        item = confInfo['jira']
        item['jira_url'] = jira_settings.get('jira_url', 'http://your.server/')
        item['jira_username'] = jira_settings.get('jira_username')
        item['jira_password'] = PASSWORD_PLACEHOLDER
        for k in DEFAULT_SETTINGS:
            item['default_' + k] = jira_settings.get(k, '')
        item['import'] = '0'

    def handleEdit(self, confInfo):
        if self.callerArgs.id == 'jira':
            jira_settings = get_jira_settings(splunk.getLocalServerInfo(), self.getSessionKey())
            if 'jira_url' in self.callerArgs:
                jira_settings['jira_url'] = self.callerArgs['jira_url'][0]
            if 'jira_username' in self.callerArgs:
                jira_settings['jira_username'] = self.callerArgs['jira_username'][0]
            if 'jira_password' in self.callerArgs:
                password = self.callerArgs['jira_password'][0]
                if password and password != PASSWORD_PLACEHOLDER:
                    jira_settings['jira_password'] = password
            for k in DEFAULT_SETTINGS:
                if 'default_' + k in self.callerArgs:
                    jira_settings[k] = self.callerArgs['default_' + k][0]
            if not validate_jira_settings(jira_settings):
                raise admin.ArgValidationException, "Error connecting to JIRA server"
            update_jira_settings(jira_settings, splunk.getLocalServerInfo(), self.getSessionKey())
            if 'import' in self.callerArgs and self.callerArgs['import'][0] in ('1', 'true'):
                try:
                    generate_jira_dialog(jira_settings, splunk.getLocalServerInfo(), self.getSessionKey())
                except Exception, e:
                    raise admin.AdminManagerException("Error importing settings from Jira, check server URL and credentials: " + str(e))


admin.init(JiraAlertsInstallHandler, admin.CONTEXT_APP_ONLY)
