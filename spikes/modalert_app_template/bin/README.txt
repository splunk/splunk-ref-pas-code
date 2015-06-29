Notes on creating an Alert Action script in $SPLUNK_HOME/etc/apps/<your_app>/bin
 * This framework is not intended for scripts that run indefinitely.
    The executed script should terminate after execution is complete.
    IMPORTANT NOTE: Scripts running longer than 5 minutes will be forcibly terminated by Splunk.
    
 * Scripts for different architectures AND Operating Systems can be included.

 * The name of the custom alert script to be executed must match the stanza name
