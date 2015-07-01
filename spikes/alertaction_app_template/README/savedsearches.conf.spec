# Add as many param entries here as correspond to user input options
# in your Alert Action HTML.  Each key string will correspond to
# each input element's "name" parameter.  For example:
# In alertaction.html:
#   <input id="example_input" type="text" name="action.alertaction_template.param.example_input" />
#
# And the corresponding entry in savedsearches.conf.spec:
#   action.alertaction_template.param.example_input = <string>

# Enable/disable alertaction notification
action.<alertaction_name> = [0|1]

action.<alertaction_name>.param.<key> = <type> (e.g. <string>)
