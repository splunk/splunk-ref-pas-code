# Different types of packages
## Standalone packaging (same as book)
The current on-prem version of Splunk does not handle bundled dependencies. As a result, we build a bundle similar to
what we described in the book.
## Partitioned
An app package built by slim can be partitioned into different pieces for custom distribution to forwarders, indexers
and search heads.  When run through the 'partition' command, slim will create one app package for search heads, one 
for indexers, and one for each forwarder group defined in the app manifest.
## One-click installer
When packaged with 'slim package', slim gathers all dependencies listed in the app.manifest and packages them into a
.dependencies directory in the top level of the package.  When deployed using the normal app installation tools in 
Splunk Enterprise, that directory will be ignored.  When installed from SplunkBase in the cloud self-service installer,
all needed dependencies will be installed with the app.
# App Manifest
The app manifest at app.manifest is a json file with information about the app.  In our case we mostly want to define
dependencies to allow for simpler deployment to a clustered architecture and one-click deployment in the cloud. 
## Generation
To create your manifest, ensure that your app folder follows naming standards, that your app.conf has a `[package]` stanza 
including an id that matches your folder name and a `[launcher]` stanza with `author` and `version`.  Then run
`slim generate-manifest -o {app folder}/app.manifest {app folder}`.  Slim will pre-populate many fields, but you will
want to edit the app.manifest to fill in the details of your app.
## Dependencies
For PAS, we mostly want to define dependencies.  In our case we have a number of apps which define the data generation
for our demo app.  In the main pas\_ref\_app, we define each of those dependencies.
# Folder naming
In order for slim to find our project, our app directory needs to match the name given in the app.manifest, which
needs to match the 'id' value in `[package]` in the app.conf.  Note that if you supply a group in the app.manifest
info.id section you will need to name your directory to have your group name as a prefix, separated by a hyphen.
For example, if your app name is myapp and your group is mygroup, your app folder will need to be named mygroup-myapp.
# Repository
Slim uses a repository to resolve local dependencies.  By default this is placed under your home directory, 
but in many cases it may make sense to manage your repository explicitly.  In the makefile provided in the 
PAS respository, we use an out/repository directory.  We then build each of our apps so that all of the dependencies 
are built before the main PAS app.
