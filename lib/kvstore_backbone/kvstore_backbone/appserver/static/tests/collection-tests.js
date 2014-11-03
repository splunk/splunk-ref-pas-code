/**
 * @file Unit tests for KVStore Collection class.
 */
define(function(require) {
'use strict';

var $ = require('jquery');
var _ = require('underscore');
var expect = require('chai').expect;
var KVStore = require('kvstore');

var mvcUtils = require('splunkjs/mvc/utils');
var splunkdUtils = require('util/splunkd_utils');
var SplunkConfig = require('splunk.config');

describe('Collection', function() {
  var TestModel = KVStore.Model.extend({
    collectionName: 'test'
  });

  var TestColllection = KVStore.Collection.extend({
    collectionName: 'test',
    model: TestModel
  });

  var records = [];
  for (var i = 0; i < 100; i++) {
    records.push({ _key: i.toString(), number: i, str: 'name' + i, _user: 'nobody' });
  }

  // 1 clean collection (default namespace)
  // 2 populate collection with sample data
  before(function(done) {
    var url = new TestColllection().url();
    $.ajax(
      url,
      {
        type: 'DELETE'
      })
      .then(function(data, textStatus, jqXHR) {
        return $.ajax(
          url + '/batch_save',
          {
            contentType: 'application/json',
            data: JSON.stringify(records),
            type: 'POST'
          });
      })
      .done(function(data, textStatus, jqXHR) {
        done();
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        done(errorThrown);
      });
  });

  after(function(done) {
    var url = new TestColllection().url();
    $.ajax(
      url,
      {
        type: 'DELETE'
      })
      .done(function(data, textStatus, jqXHR) {
        done();
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        done(errorThrown);
      });
  });

  describe('with default namespace', function() {

    it('can be fetched', function(done) {
      var collection = new TestColllection();
      collection.fetch()
        .done(function(data, textStatus, jqXHR) {
          expect(collection.length).to.equal(records.length);
          expect(collection.toJSON()).to.deep.have.members(records);
          done();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          done(errorThrown);
        });
    });

    it('can be fetched with sort', function(done) {
      var collection0 = new TestColllection();
      var collection1 = new TestColllection();
      collection0.fetch({
        data: $.param({
          sort: 'number'
        })
      })
        .then(function(data, textStatus, jqXHR) {
          return collection1.fetch({
            data: $.param({
              sort: 'number:-1'
            })
          });
        })
        .done(function(data, textStatus, jqXHR) {
          expect(collection0.length).to.equal(collection1.length);
          for (var i = 0; i < collection0.length; i++) {
            expect(collection0.at(i).toJSON()).to.deep.equal(collection1.at(collection0.length - i - 1).toJSON());
          }
          done();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          done(errorThrown);
        });
    });

    it('can be fetched with projection', function(done) {
      var collection = new TestColllection();
      collection.fetch({
        data: $.param({
          fields: '_key,number'
        })
      })
        .done(function(data, textStatus, jqXHR) {
          expect(collection.length).to.equal(data.length);
          var loadedData = collection.toJSON();
          for (var i = 0; i < collection.length; i++) {
            expect(loadedData[i]).to.have.keys(['_key', 'number', '_user']);
          }
          done();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          done(errorThrown);
        });
    });

    it('can be fetched data with pagination', function(done) {
      var collection = new TestColllection();
      collection.fetch({
        data: $.param({
          skip: 10,
          limit: 10,
          sort: 'number'
        })
      })
        .done(function(data, textStatus, jqXHR) {
          expect(collection.length).to.equal(10);
          var loadedData = collection.toJSON();
          for (var i = 0; i < loadedData.length; i++) {
            expect(loadedData[i]).to.deep.equal(records[i + 10]);
          }
          done();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          done(errorThrown);
        });
    });

    it('can be fetched with query', function(done) {
      var collection = new TestColllection();
      collection.fetch({
        data: $.param({
          query: JSON.stringify({ '$and': [ { number: { '$gte': 10 } }, { number: { '$lt': 20 } } ] }),
          sort: 'number'
        })
      })
        .done(function(data, textStatus, jqXHR) {
          expect(collection.length).to.equal(10);
          var loadedData = collection.toJSON();
          for (var i = 0; i < loadedData.length; i++) {
            expect(loadedData[i]).to.deep.equal(records[i + 10]);
          }
          done();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          done(errorThrown);
        });
    });
  });

  describe('with custom namespace', function() {
    var currentUser = SplunkConfig.USERNAME;

    var userRecords = [];
    for (var i = 0; i < 100; i++) {
      userRecords.push({ _key: i.toString(), number: i, str: 'name' + i, _user: currentUser });
    }

    // 1 clean collection
    // 2 populate collection with sample data
    before(function(done) {
      var url = new TestColllection(null, { namespace: { owner: currentUser } }).url();
      $.ajax(
        url,
        {
          type: 'DELETE'
        })
        .then(function(data, textStatus, jqXHR) {
          return $.ajax(
            url + '/batch_save',
            {
              contentType: 'application/json',
              data: JSON.stringify(userRecords),
              type: 'POST'
            });
        })
        .done(function(data, textStatus, jqXHR) {
          done();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          done(errorThrown);
        });
    });

    after(function(done) {
      var url = new TestColllection(null, { namespace: { owner: currentUser } }).url();
      $.ajax(
        url,
        {
          type: 'DELETE'
        })
        .done(function(data, textStatus, jqXHR) {
          done();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          done(errorThrown);
        });
    });

    it('can be fetched only for current user', function(done) {
      var collection = new TestColllection(null, { namespace: { owner: currentUser } });
      collection.fetch()
        .done(function(data, textStatus, jqXHR) {
          expect(collection.length).to.equal(records.length);
          expect(collection.toJSON()).to.deep.have.members(userRecords);
          done();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          done(errorThrown);
        });
    });

    it('can be fetched with projection and right user', function(done) {
      var collection = new TestColllection(null, { namespace: { owner: currentUser } });
      collection.fetch({
        data: $.param({
          fields: '_key,number'
        })
      })
        .done(function(data, textStatus, jqXHR) {
          expect(collection.length).to.equal(data.length);
          var loadedData = collection.toJSON();
          for (var i = 0; i < collection.length; i++) {
            expect(loadedData[i]).to.have.keys(['_key', 'number', '_user']);
            expect(loadedData[i]).to.have.property('_user')
              .that.is.a('string')
              .that.equals(currentUser);
          }
          done();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          done(errorThrown);
        });
    });

    it('can be fetched and marked as not new', function(done) {
      var collection = new TestColllection(null, { namespace: { owner: currentUser } });
      collection.fetch({
        data: $.param({
          limit: 1
        })
      })
        .done(function(data, textStatus, jqXHR) {
          for (var i = 0; i < collection.length; i++) {
            expect(collection.at(i).isNew()).to.be.false;
          }
          done();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          done(errorThrown);
        });
    });
  });
});

});