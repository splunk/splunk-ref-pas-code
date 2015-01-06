To use this addon, you need to:
1. Go to Google developers console and create a new project, under APIs&auth->Credentials, create a new credential for installed application, you will get the CLIENT_ID and the CLIENT_SECRET
2. Create a new modular input of "Google Drive Activity Stream": 
1) go to your splunk instance, open "Settings->Data inputs->Google Drive Activity Stream", click "New", input the following information
NAME: warum
CLIENTID: <your CLIENT_ID>
CLIENTSECRET:  <your CLIENT_SECRET>
 
 Click more settings and set interval to 86400 (24 hours), set sourcetype to "google:drive:activity" and index to "pas", then save the configuration.
 
2) Now need to authenticate with Google drive so that Splunk can retrieve data: Open a terminal window, go to the splunk bin directory and run the following command:
	./splunk cmd python ../etc/apps/googledrive_addon/bin/configure_oauth.py 
'<your CLIENT_ID>' '<your CLIENT_SECRET>'
 
This will give you a URL that you can copy and paste into a browser, and you will get a key that you can copy and paste back in the command window to finish the authentication process.

3) Go back to splunk data input you created in step 1) and disable and reenable it
 

