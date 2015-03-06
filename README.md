# Splunk Reference App - PAS - Code Repo 
### Version 1.0.1

Splunk Enterprise is an analytic environment that uses a distributed
map-reduce architecture to efficiently index, search, and process very large time-varying data sets.

The Splunk Developer Platform enables developers to take advantage of the same underlying technologies that power the core product to build exciting new apps and solutions that are enabled by capabilities unique to Splunk Enterprise.

The Splunk Reference App - PAS teaches you how to develop apps for Splunk. Here, you can explore the evolution of the reference app along with some additional engineering artifacts, like tests, deployment considerations, and tradeoff discussions.

The accompanying Splunk Developer Guide for Building Apps presents a documentary of how the team went about building this reference app. The guide is currently available as an early preview at <http://splunk.github.io/splunk-dev-guide>. We welcome your feedback on both the app and the guide.

### What Does This App Do?
The PAS app is intended to enable an organization to monitor various document repositories (current and future). Managers and auditors can use the app to see who has viewed, modified, deleted, or downloaded documents or other artifacts from various sources. 


### Requirements
Here's what you need to get going with the Splunk Reference App - PAS.

#### Splunk Enterprise

If you haven't already installed Splunk Enterprise, download it at 
<http://www.splunk.com/download>. For more information about installing and 
running Splunk Enterprise and system requirements, see the
[Installation Manual](http://docs.splunk.com/Documentation/Splunk/latest/Installation). 

#### The main PAS app
Clone this repo. You can put the pas_ref_app folder with its content directly in the $SPLUNK_HOME/etc/apps folder. We recommend you clone it to some other working folder and create a symlink to the *pas_ref_app* in the $SPLUNK_HOME/etc/apps folder. 

* Unix/MacOS: `ln -s {PATH_TO_REPOSITORY}/pas_ref_app/ $SPLUNK_HOME/etc/apps/pas_ref_app`
* Windows: `mklink /D $SPLUNK_HOME\etc\apps\pas_ref_app {PATH_TO_REPOSITORY}\pas_ref_app\`

#### Getting data in
There are several ways for you to feed data into the PAS app.

* Ingest your own data. Just make sure those sources are tagged with "change" and "audit", 
* Use the eventgen app, if you want a simulated data flow. Get it from <http://bit.ly/splunkeventgen>, or 
* Consume the test data set provided in the [test repo](http://github.com/splunk/splunk-ref-pas-test/tree/master/tests/pas_sample_data). 

#### Install dependencies

The reference app relies on data provider add-ons. Three simulated data providers (file add-on, documents app add-on, database add-on) and one real data provider (Google Drive Data Provider add-on) are made available. Install at least one data provider. You'll find the install scripts for Unix/MacOS and Windows in the [/bin](tree/master/pas_ref_app/bin) folder. 

For the Google Drive data provider installation and configuration, see specific instructions in the [Google Drive addon folder](tree/master/pas_ref_app/appserver/addons/googledrive_addon).

The reference app uses a lookup table which could have been produced by an HR system process. For demonstration purposes, we have encapsulated it in the [HR info addon folder](tree/master/pas_ref_app/appserver/addons/pas_hr_info). 

(Optional) Certain reference app functionality requires an identity provider. We have used a [simulated identity provider](tree/master/pas_simulated_users_addon). 

#### Configure user access

Create a new user that belongs to the **pasadmin** or **pasuser** role, and log in as this new user. 

Alternatively, add index **'pas'** to the default searchable indexes by going to **Splunk Settings** -> **Access controls** -> **Role** -> **admin** -> **Indexes searched by default** and adding **'pas'** into the list of default search indexes.

Note: if you are using a Splunk Free license, integrated role-based access control is not available.Thus, you will not be able to add new users or roles and should use the alternative method of adding the pas to the list of indexes searched by default.


#### Configure the app using the Setup page
Specify at least one department that you want to surface on the Summary dashboard.

## Usage
For usage see the _About_ page of the app.

## Community and Feedback
Questions, comments, suggestions? To provide feedback about this release, to get help with any problems, or to stay connected with other developers building on Splunk please visit the <http://answers.splunk.com>community site. 

File any issues on [GitHub](https://github.com/splunk/splunk-ref-pas-code/issues).

Community contributions via pull requests are welcomed! Go to the 
[Open Source](http://dev.splunk.com/view/opensource/SP-CAAAEDM) page for more information. 

* Email: devinfo@splunk.com
* Blog: <http://blogs.splunk.com/dev>
* Twitter: [@splunkdev](http://twitter.com/splunkdev)

## License

The Splunk Reference App - PAS is licensed under the Apache License 2.0. Details can be found in the LICENSE file.
