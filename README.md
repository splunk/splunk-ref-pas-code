# Splunk Reference App - PAS - Code Repo 
### Version 0.81 RC

Splunk Enterprise is an analytic environment that uses a distributed
map-reduce architecture to efficiently index, search, and process very large 
time-varying data sets.

The Splunk Developer Platform enables developers to take advantage of the same underlying technologies that power the core product to build exciting new apps and solutions that are enabled by Splunk's unique capabilities.

This reference app will help you to learn how to develop apps for Splunk. Here you can explore the evolution of the reference app along with some of the additional engineering artefacts (tests, deployment considerations, tradeoff discussions).

The Splunk Developer Guide for Building Apps will offer a documentary of how the team went about building this reference app. The guide is currently available as an early preview from <http://splunk.github.io/splunk-dev-guide>. We welcome your feedback on both the app and the guide.

### What Does This App Do?
The PAS app is intended to enable an organization to monitor various document repositories (current and future). Managers and auditors can use the app to see who has looked at, updated, modified, deleted, or downloaded documents or other artefacts from various sources. 


### Requirements

Here's what you need to get going with the Splunk Reference App - PAS.

#### Splunk

If you haven't already installed Splunk, download it at 
<http://www.splunk.com/download>. For more information about installing and 
running Splunk and system requirements, see the
[Splunk Installation Manual](http://docs.splunk.com/Documentation/Splunk/latest/Installation). 

#### The main PAS app
Clone this repo. You can put it directly in a folder insider $SPLUNK_HOME/etc/apps. We recommend you do it in some other working folder and create a symlink to the *pas_ref_app* in the $SPLUNK_HOME/etc/apps. Use the *ln* command on Unix/MacOS or the *mklink* command on Windows.

#### Getting data in
There are several ways for you to feed data into PAS.
1) Ingest your own data, just make sure those sources are tagged with "change" and "audit".
2) Use the eventgen app, if you want a simulated data flow. Get it from <http://bit.ly/splunkeventgen>
3) Consume the test data set provided in the test repo <https://github.com/splunk/splunk-ref-pas-test/tree/master/tests/pas_sample_data>. 

#### Install dependencies

The reference app relies on data provider add-ons. Three simulated data providers (file add-on, documents app add-on, database add-on) and one real data provider (Google Drive Data Provider add-on) are made avaialable. Install at least one data provider. You'll find the nstall scripts for Unix/MacOS and Windows under */bin*. For the Google Drive data provider installation and configuration, see specific instructions under the *googledrive_addon/README*

The reference app uses a lookup table which could have been produced by an HR system process. For the demo purposes, we have encapsulated it in the pas_hr_info add-on. 

(Optionally) Certain functionality of the reference app requires an identity provider. We have used a simulated identity provider which you can download from https://github.com/splunk/pas-pas-ri-test/tree/master/pas_simulated_users_addon. 

#### Configure the app via Setup page
Specify at least one department which you want to surface up on the Summary dashboard.

## Usage
For usage see the *About* page.

## Community
Questions, comments, suggestions? To provide feedback about this release, to get help with any problems, or to stay connected with other developers building on Splunk please visit <http://answers.splunk.com>community site. 
 
Email: devinfo@splunk.com
Blog: <http://blogs.splunk.com/dev>
Twitter: @splunkdev