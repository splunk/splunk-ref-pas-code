> Splunk application, compatible with Splunk Enterprise v6.2+

Introduction
------------
Splunk application with KVStore compatible Backbone classes.


How to start working with KVStore backbone library
------------

Assuming that you already defined KVStore collection in your application, using [collections.conf](https://docs.splunk.com/Documentation/Splunk/latest/Admin/Collectionsconf) with name `mycollection`.

* Download latest [kvstore.js](https://raw.githubusercontent.com/splunk/splunk-kvstore-backbone/master/kvstore_backbone/appserver/static/lib/kvstore.js).
* Place it in your application under `appserver/static` folder.
* Define your own Backbone Model and Collection using kvstore library

```
require(
[
  '../app/kvstore_backbone/lib/kvstore'
  'splunkjs/ready!'
], function(kvstore) {

  var MyModel = kvstore.Model.extend({
    collectionName: 'mycollection'
  });

  var MyCollection = kvstore.Collection.extend({
    collectionName: 'mycollection',
    model: MyModel
  });

  var collection = new MyCollection();
  var model = new MyModel({name: 'title'});
  model.save()
    .then(function() {
      console.log('Model saved with id ' + model.id);
      return collection.fetch();
    })
    .then(function() {
      console.log('Collection loaded with ' + collection.length + ' items');
    });
});
```


Build Application from sources
------------

```
git clone git@github.com:splunk/splunk-kvstore-backbone.git
bower install
npm install
grunt build
grunt pack
```

Last command will create a `tar` archive which can be used to install application in Splunk Enterprise.
