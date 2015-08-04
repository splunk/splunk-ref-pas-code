Prerequisites:
    * The jira_alerts add-on has been installed to $SPLUNK_HOME/etc/apps
    * The admin or a user with sufficient privileges has completed the initial
      set up of the Alert Action (Settings->Alert Actions->Setup JIRA Ticket Creation).

I. Unit Test Usage:
    1. In shell, navigate to $SPLUNK_HOME/etc/apps/jira_alerts/bin
    2. Open jira_test.py and set Splunk instance bits
    3. In shell, execute "splunk cmd python jira_test.py"

    Expected Result:
        All tests pass.  If a specific tests fails, it will be indicated
        in the output of the script in the shell.

II. Shell-level Invocation
    1. In shell, navigate to $SPLUNK_HOME/etc/apps/jira_alerts/bin
    2. Open jira_test.json and fill in relevant bits.
    3. Execute "cat jira_test.json | splunk cmd python jira.py --execute"

    Expected Result:
        A new issue will have been created in the target JIRA instance.

III. Ad-hoc Search Language Invocation
    In a SplunkWeb Search Dashboard, enter the following (after setting bits
    specific to your JIRA instance):
        | sendalert jira param.jira_url="SET_JIRA_URL" param.jira_username="SET_JIRA_USERNAME" param.priority="High" param.project_key="SET_JIRA_PROJECT_KEY" param.summary="Test Summary" param.issue_type="Task" param.description="Test Description"
        
    Expected Result:
        A new issue will have been created in the target JIRA instance.