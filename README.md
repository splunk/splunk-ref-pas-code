# Splunk Reference App - PAS - Code Repo 
### Version 0.90 RC

Splunk Enterprise is an analytic environment that uses a distributed
map-reduce architecture to efficiently index, search, and process very large time-varying data sets.

The Splunk Developer Platform enables developers to take advantage of the same underlying technologies that power the core product to build exciting new apps and solutions that are enabled by capabilities unique to Splunk Enterprise.

This The Splunk Reference App - PAS teaches you how to develop apps for Splunk. Here, you can explore the evolution of the reference app along with some additional engineering artifacts, like tests, deployment considerations, and tradeoff discussions.

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
Clone this repo. You can put the pas_ref_app folder with its content directly in the $SPLUNK_HOME/etc/apps folder. We recommend you clone it to some other working folder and create a symlink to the *pas_ref_app* in the $SPLUNK_HOME/etc/apps folder. Use the _ln_ command on Unix/MacOS or the _mklink_ command on Windows.

#### Getting data in
There are several ways for you to feed data into the PAS app.

* Ingest your own data. Just make sure those sources are tagged with "change" and "audit", 

* Use the eventgen app, if you want a simulated data flow. Get it from <http://bit.ly/splunkeventgen>, or 

* Consume the test data set provided in the [test repo](http://github.com/splunk/splunk-ref-pas-test/tree/master/tests/pas_sample_data). 

#### Install dependencies

The reference app relies on data provider add-ons. Three simulated data providers (file add-on, documents app add-on, database add-on) and one real data provider (Google Drive Data Provider add-on) are made available. Install at least one data provider. You'll find the install scripts for Unix/MacOS and Windows in the  _/bin_ folder. For the Google Drive data provider installation and configuration, see specific instructions in the _googledrive_addon/README_ folder.

The reference app uses a lookup table which could have been produced by an HR system process. For demonstration purposes, we have encapsulated it in the _pas_hr_info_ add-on. 

(Optional) Certain reference app functionality requires an identity provider. We have used a [simulated identity provider](https://github.com/splunk/pas-pas-ri-test/tree/master/pas_simulated_users_addon). 

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
