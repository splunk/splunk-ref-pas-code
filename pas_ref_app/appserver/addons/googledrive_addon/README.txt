To use this add-on, you need to:
1. Go to the Google developers console and create a new project, under APIs&auth->Credentials, create a new credential for the installed application, you will get the CLIENT_ID and the CLIENT_SECRET.
2. Create a new modular input named "Google Drive Activity Stream": 
	2.1) Go to your Splunk instance, open "Settings->Data inputs->Google Drive Activity Stream", click "New", and fill in a name (and optionally a description).
 
 	Click "More Settings" and set the interval to 86400 (24 hours), set the sourcetype to "google:drive:activity" and, then save the configuration.
 
	2.2) Now need to authenticate with Google Drive so that Splunk Enterprise can retrieve data: Open a terminal window, go to the Splunk bin directory and run the following command:
		./splunk cmd python ../etc/apps/googledrive_addon/bin/configure_oauth.py 
		'<your input name>' '<your CLIENT_ID>' '<your CLIENT_SECRET>'
 
	This will give you a URL that you can copy and paste into a browser, and you will get a key that you can copy and paste back into the command window to finish the authentication process.

	2.3) Go back to the Google Drive Activity Stream data input you created in step 1) and disable and reenable it.
