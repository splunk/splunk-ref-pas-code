# Add as many param entries here as correspond to user input options
# defined in your Alert Action HTML.  Each key's name will correspond to
# each input element's "name" parameter.  For example:
# In alertaction.html:
#   <input id="example_input" type="text" name="action.alertaction_template.param.example_input" />
#
# And the corresponding entry in savedsearches.conf.spec:
#   action.alertaction_template.param.example_input = <string>

# The values defined here will apply to an individual Alert Action,
# as opposed to values defined in alert_actions.conf.spec, which apply
# to all created Alert Actions of this type.

# TODO: change 'alertaction_template' to the name of your action below.
# Enable/disable alertaction notification
# action.<alertaction_name> = [0|1]
action.alertaction_template = 1

# TODO: Add all alert instance-specific parameters below.
# action.<alertaction_name>.param.<key> = <type> (e.g. <string>)
action.alertaction_template.param.message = <string>
