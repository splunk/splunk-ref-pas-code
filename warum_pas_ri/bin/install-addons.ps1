# Windows script to install Splunk add-ons
# ----------------------------------------

#  
# Make sure your %SPLUNK_HOME% environment variable is set to the right Splunk installation
#
# You need to run the script from an elevated shell (Right-click the Command Prompt shortcut, Run As Administrator).
# Run from inside \bin directory the following:
# powershell ./install-addons.ps1
#
# If you are running the script from an elevated shell and still getting errors, check the permissions on the directory and make sure there aren't any explicit Deny permissions set for the Administrators group.
# Note: Make sure directory add-ins do not already exist in etc/apps

# TODO: Sign the script
# For dev testing, enabled running unsigned scripts with:
# powershell Set-ExecutionPolicy Unrestricted
# NOTE: YOU SHOULD NEVER DO THIS IN PRODUCTION!
#
# TODO: Replace Write-Host with  [CmdletBinding()] and -Verbose mode
# TODO: Provide better error handling in case the links are already present




function createSymLinks ($source, $destination) 
{

 Write-Host "Creating symbolic links to Splunk Reference Solution add-ons in" $env:SPLUNK_HOME "\etc\apps" -foregroundcolor black -backgroundcolor white 

     $children = Get-ChildItem $source

     for ($i=0; $i -lt $children.Count; $i++) {
      $dest=$destination+"\"+$children[$i]
      # Write-Host destination="$dest" source = $children[$i].FullName addon= $children[$i]
      # Write-Host Creating... -foregroundcolor green
      cmd /c mklink /d  $dest $children[$i].FullName 
     }
         
}

cd ..\appserver

#Write-Host "Press any key to continue ..."
#$x = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

createSymLinks -source addons -destination $env:SPLUNK_HOME\etc\apps
