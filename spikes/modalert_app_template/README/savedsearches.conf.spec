# Add as many param entries here as correspond to user input options
# in your modular alert HTML.  Each key string will correspond to
# each input element's "name" parameter.  For example:
# In modalert.html:
#   <input id="example_input" type="text" name="action.modalert_template.param.example_input" />
#
# And the corresponding entry in savedsearches.conf.spec:
#   action.modalert_template.param.example_input = <string>

# Enable/disable modalert notification
action.<modalert_name> = [0|1]

action.<modalert_name>.param.<key> = <type> (e.g. <string>)
