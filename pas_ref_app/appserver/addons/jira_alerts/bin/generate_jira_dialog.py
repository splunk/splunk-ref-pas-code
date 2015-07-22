import requests
import cgi
from jira_helpers import *

TEMPLATE = '''
<form class="form-horizontal form-complex">
    <div class="control-group">
        <label class="control-label" for="project_key">Project</label>

        <div class="controls">
            <select name="action.jira.param.project_key" id="project_key">
                %(project_choices)s
            </select>
            <span class="help-block">Enter the project key to create Issues under.</span>
        </div>
    </div>
    <div class="control-group">
        <label class="control-label" for="issue_type">Type</label>

        <div class="controls">
            <select name="action.jira.param.issue_type" id="issue_type">
                %(issuetype_choices)s
            </select>
            <span class="help-block">Enter an Issue type.</span>
        </div>
    </div>
    <div class="control-group">
        <label class="control-label" for="jira_priority">Priority</label>

        <div class="controls">
            <select name="action.jira.param.priority" id="jira_priority">
                %(priority_choices)s
            </select>
            <span class="help-block">Select the issue priority.</span>
        </div>
    </div>
    <div class="control-group">
        <label class="control-label" for="summary">Summary</label>

        <div class="controls">
            <input type="text" name="action.jira.param.summary" id="summary" />
            <span class="help-block">Enter a summary of the Issue.</span>
        </div>
    </div>
    <div class="control-group">
        <label class="control-label" for="description">Description</label>

        <div class="controls">
            <textarea name="action.jira.param.description" id="description" style="height: 120px;"></textarea>
            <span class="help-block">
                Enter a description of the issue. This text can include tokens that will resolve to text based on search results.
                <a href="{{SPLUNKWEB_URL_PREFIX}}/help?location=learnmore.alert.action.tokens" target="_blank"
                   title="Splunk help">Learn More <i class="icon-external"></i></a>
            </span>
        </div>
    </div>
</form>
'''

def generate_jira_dialog(jira_settings, server_uri, session_key):
    new_content = TEMPLATE % dict(
        project_choices="\n\t\t".join(map(lambda project: select_choice(value=project.get('key'), label='%(key)s - %(name)s' % project), get_projects(jira_settings))),
        issuetype_choices="\n\t\t".join(map(lambda issuetype: select_choice(value=issuetype.get('name'), label='%(name)s' % issuetype), get_issuetypes(jira_settings))),
        priority_choices="\n\t\t".join(map(lambda issuetype: select_choice(value=issuetype.get('name'), label='%(name)s' % issuetype), get_priorities(jira_settings))),
    )
    update_jira_dialog(new_content, server_uri, session_key)


def get_projects(jira_settings):
    response = requests.get(
        url=jira_url(jira_settings, '/project'),
        auth=(jira_settings.get('jira_username'), jira_settings.get('jira_password')),
        verify=False)
    return response.json()

def get_issuetypes(jira_settings):
    response = requests.get(
        url=jira_url(jira_settings, '/issuetype'),
        auth=(jira_settings.get('jira_username'), jira_settings.get('jira_password')),
        verify=False)
    return response.json()

def get_priorities(jira_settings):
    response = requests.get(
        url=jira_url(jira_settings, '/priority'),
        auth=(jira_settings.get('jira_username'), jira_settings.get('jira_password')),
        verify=False)
    return response.json()


def select_choice(value, label):
    # TODO: XML escape content
    return '<option value="%s">%s</option>' % (cgi.escape(value), cgi.escape(label))

