/**
 * @file Unit tests for KVStore Model class.
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

describe('Model', function() {
  var TestModel = KVStore.Model.extend({
    collectionName: 'test'
  });

  var TestColllection = KVStore.Collection.extend({
    collectionName: 'test',
    model: TestModel
  });

  function cleanCollectionAsync(done) {
    $.ajax(
      new TestColllection().url(),
      {
        type: 'DELETE'
      })
      .done(function(data, textStatus, jqXHR) {
        done();
      }).fail(function(jqXHR, textStatus, errorThrown) {
        done(errorThrown);
      });
  }

  // Before each test clean collection
  beforeEach(cleanCollectionAsync);

  // After all tests clean collection
  after(cleanCollectionAsync);

  describe('isNew', function() {
    it('returns true without key', function() {
      var model = new TestModel({ });
      expect(model.isNew()).to.be.true;
    });

    it('returns false with key', function() {
      var model = new TestModel({ _key: 'x44582602dbbb628d0223e70' });
      expect(model.isNew()).to.be.false;
    });

    it('returns true when isNew specified in options', function() {
      var model = new TestModel({ _key: 'x44582602dbbb628d0223e70' }, { isNew: true });
      expect(model.isNew()).to.be.true;
    });

    it('returns true when isNew is set', function() {
      var model = new TestModel({ _key: 'x44582602dbbb628d0223e70' });
      model.isNew(true);
      expect(model.isNew()).to.be.true;
    });

    it('returns false when isNew is unset', function() {
      var model = new TestModel({ _key: 'x44582602dbbb628d0223e70' });
      model.isNew(true);
      model.isNew(false);
      expect(model.isNew()).to.be.false;
    });
  });

  describe('url', function() {
    it('generates right path with default namespace and unset id', function() {
      var model = new TestModel();
      expect(model.url()).to.equal(
        splunkdUtils.fullpath('storage/collections/data/test', 
          { owner: 'nobody', app: mvcUtils.getCurrentApp() }));
    });

    it('generates right path with default namespace and specified id', function() {
      var model = new TestModel({ _key: 'x44582602dbbb628d0223e70' });
      expect(model.url()).to.equal(
        splunkdUtils.fullpath('storage/collections/data/test/x44582602dbbb628d0223e70', 
          { owner: 'nobody', app: mvcUtils.getCurrentApp() }));
    });

    it('generates right path with custom namespace and unset id', function() {
      var namespace = { owner: 'admin', app: 'not_this_app' };
      var model = new TestModel({}, { namespace: namespace });
      expect(model.url()).to.equal(
        splunkdUtils.fullpath('storage/collections/data/test', namespace));
    });

    it('generates right path with custom namespace and specified id', function() {
      var namespace = { owner: 'admin', app: 'not_this_app' };
      var model = new TestModel({ _key: 'x44582602dbbb628d0223e70' }, { namespace: namespace });
      expect(model.url()).to.equal(
        splunkdUtils.fullpath('storage/collections/data/test/x44582602dbbb628d0223e70', namespace));
    });
  });

  it('creates a copy of namespace object passed to constructor', function() {
    var namespace = { owner: 'admin' };
    var model = new TestModel({}, { namespace: namespace });
    expect(model.namespace).to.not.be.equal(namespace);
    expect(model.namespace).to.deep.equal(namespace);
  });

  it('cannot be loaded if does not exist', function(done) {
    var model = new TestModel({ _key: 'x44582602dbbb628d0223e70' });
    model.fetch()
      .done(function(data, textStatus, jqXHR) {
        done(new Error('Model should not exist on server'));
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        expect(jqXHR.status).to.equal(404);
        done();
      });
  });

  it('does not change options object on save', function(done) {
    var model = new TestModel();
    var options = {};
    model.save({}, options)
      .done(function(data, textStatus, jqXHR) {
        expect(options).to.be.empty;
        done();
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        done(errorThrown);
      });
  });

  it('does not change options object on destroy', function(done) {
    var model = new TestModel({ _key: 'x44582602dbbb628d0223e70' });
    var options = {};
    model.destroy(options)
      .done(function(data, textStatus, jqXHR) {
        done(new Error('Fail expected'));
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        expect(options).to.be.empty;
        done();
      });
  });

  it('does not change options object on fetch', function(done) {
    var model = new TestModel({ _key: 'x44582602dbbb628d0223e70' });
    var options = {};
    model.destroy(options)
      .done(function(data, textStatus, jqXHR) {
        done(new Error('Fail expected'));
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        expect(options).to.be.empty;
        done();
      });
  });

  it('does not drop collection when model is new', function(done) {
    var emptyModel = new TestModel();
    var savedModel = new TestModel({ name: 'a' });
    var copyModel = new TestModel();

    savedModel.save()
      .then(function(data, textStatus, jqXHR) {
        var dfd = new $.Deferred();

        expect(emptyModel.destroy({
          success: function(model, response, options) {
            dfd.resolve();
          },
          error: function(model, response, options)  {
            dfd.reject();
          }
        })).to.be.false;

        return dfd;
      })
      .then(function(data, textStatus, jqXHR) {
        copyModel.set('_key', savedModel.id);
        return copyModel.fetch();
      })
      .done(function(data, textStatus, jqXHR) {
        expect(copyModel.toJSON()).to.deep.equal(savedModel.toJSON());
        done();
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        done(errorThrown);
      });
  });

  it('does not allow to save with empty string as a key', function(done) {
    var model = new TestModel({ _key: '' });

    model.save()
      .done(function(data, textStatus, jqXHR) {
        done(new Error('Should not allow to save with empty string'));
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        expect(jqXHR).to.be.null;
        expect(textStatus).to.be.null;
        expect(errorThrown).to.be.not.null;
        done();
      });
  });

  it('does not allow to delete with empty string as a key', function(done) {
    var model = new TestModel({ _key: '' });

    model.destroy()
      .done(function(data, textStatus, jqXHR) {
        done(new Error('Should not allow to delete with empty string'));
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        expect(jqXHR).to.be.null;
        expect(textStatus).to.be.null;
        expect(errorThrown).to.be.not.null;
        done();
      });
  });

  it('does not allow to fetch with empty string as a key', function(done) {
    var model = new TestModel({ _key: '' });

    model.fetch()
      .done(function(data, textStatus, jqXHR) {
        done(new Error('Should not allow to fetch with empty string'));
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        expect(jqXHR).to.be.null;
        expect(textStatus).to.be.null;
        expect(errorThrown).to.be.not.null;
        done();
      });
  });

  it('allows to use success handler on save', function(done) {
    var model = new TestModel();
    var options = { success: successHandler };
    model.save({}, options)
      .fail(function(jqXHR, textStatus, errorThrown) {
        done(errorThrown);
      });

    function successHandler(savedModel, resp, userOptions) {
      expect(options.success).to.be.equal(successHandler);
      expect(savedModel).to.be.equal(model);
      done();
    }
  });

  it('allows to use success handler on destroy', function(done) {
    var model = new TestModel();
    var options = { success: successHandler };
    model.save()
      .then(function() {
        return model.destroy(options);
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        done(errorThrown);
      });

    function successHandler(destroyedModel, resp, userOptions) {
      expect(options.success).to.be.equal(successHandler);
      expect(destroyedModel).to.be.equal(model);
      done();
    }
  });

  it('does not change options object on destroy', function(done) {
    var model = new TestModel({ _key: 'x44582602dbbb628d0223e70' });
    var options = {};
    model.destroy(options)
      .done(function(data, textStatus, jqXHR) {
        done(new Error('Fail expected'));
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        expect(options).to.be.empty;
        done();
      });
  });

  it('does not change options object on fetch', function(done) {
    var model = new TestModel({ _key: 'x44582602dbbb628d0223e70' });
    var options = {};
    model.destroy(options)
      .done(function(data, textStatus, jqXHR) {
        done(new Error('Fail expected'));
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        expect(options).to.be.empty;
        done();
      });
  });

  describe('with non default namespace', function() {
    var currentUser = SplunkConfig.USERNAME;
    var model;

    function cleanCurrentUserCollectionAsync(done) {
      $.ajax(
        new TestColllection(null, { namespace: { owner: currentUser } }).url(),
        {
          type: 'DELETE'
        })
        .done(function(data, textStatus, jqXHR) {
          done();
        }).fail(function(jqXHR, textStatus, errorThrown) {
          done(errorThrown);
        });
    }

    // Insert one model before each test
    beforeEach(function(done) {
      cleanCurrentUserCollectionAsync(function() {
        model = new TestModel({name: 'test'}, { namespace: { owner: currentUser } });
        model.save()
          .done(function(data, textStatus, jqXHR) {
            expect(model.id).to.be.a('string');
            expect(model.id).to.be.not.empty;
            expect(model.isNew()).to.be.false;

            done();
          })
          .fail(function(jqXHR, textStatus, errorThrown) {
            done(errorThrown);
          });
      });
    });

    // After all tests clean collection
    after(cleanCurrentUserCollectionAsync);

    // Verify that inserted model exists on server
    it('can be created', function(done) {
      var modelCopy = new TestModel({ _key: model.id }, { namespace: { owner: currentUser } });
      modelCopy.fetch()
        .done(function(data, textStatus, jqXHR) {
          expect(modelCopy.toJSON()).to.deep.equal(model.toJSON());
          done();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          done(errorThrown);
        });
    });

    // Verify that we can delete model from server
    it('can be destroyed', function(done) {
      model.destroy()
        .then(function(data, textStatus, jqXHR) {
          return model.fetch();
        }, {
          error: function(jqXHR, textStatus, errorThrown) {
            done(errorThrown);
          }
        })
        .done(function(data, textStatus, jqXHR) {
          done(new Error('Model has not been deleted from server'));
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          expect(jqXHR.status).to.equal(404);
          done();
        });
    });

    // Verify that model can be updated on server
    it('can be saved', function(done) {
      var modelCopy = new TestModel({ _key: model.id }, { namespace: { owner: currentUser } });

      model.save({ new_property: 'new_value' })
        .then(function(data, textStatus, jqXHR) {
          return modelCopy.fetch();
        })
        .done(function(data, textStatus, jqXHR) {
          expect(modelCopy.toJSON()).to.deep.equal(model.toJSON());
          expect(modelCopy.get('new_property')).to.be.equal('new_value');
          done();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          done(errorThrown);
        });
    });

    it('cannot be read from other namespaces', function(done) {
      var modelUser = new TestModel(
        { _key: model.id }
      );
      modelUser.fetch()
        .done(function() {
          done(new Error('nobody should not be able to get access to the user specific data'));
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          expect(jqXHR.status).to.equal(404);
          done();
        });
    });
  });

  describe('saved on server', function() {
    var model;

    // Insert one model before each test
    beforeEach(function(done) {
      model = new TestModel({name: 'test'});
      model.save()
        .done(function(data, textStatus, jqXHR) {
          expect(model.id).to.be.a('string');
          expect(model.id).to.be.not.empty;
          expect(model.isNew()).to.be.false;

          done();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          done(errorThrown);
        });
    });

    // Verify that inserted model exists on server
    it('can be created', function(done) {
      var modelCopy = new TestModel({ _key: model.id });
      modelCopy.fetch()
        .done(function(data, textStatus, jqXHR) {
          expect(modelCopy.toJSON()).to.deep.equal(model.toJSON());
          done();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          done(errorThrown);
        });
    });

    // Verify that we can delete model from server
    it('can be destroyed', function(done) {
      model.destroy()
        .then(function(data, textStatus, jqXHR) {
          return model.fetch();
        }, {
          error: function(jqXHR, textStatus, errorThrown) {
            done(errorThrown);
          }
        })
        .done(function(data, textStatus, jqXHR) {
          done(new Error('Model has not been deleted from server'));
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          expect(jqXHR.status).to.equal(404);
          done();
        });
    });

    // Verify that model can be updated on server
    it('can be saved', function(done) {
      var modelCopy = new TestModel({ _key: model.id });

      model.save({ new_property: 'new_value' })
        .then(function(data, textStatus, jqXHR) {
          return modelCopy.fetch();
        })
        .done(function(data, textStatus, jqXHR) {
          expect(modelCopy.toJSON()).to.deep.equal(model.toJSON());
          expect(modelCopy.get('new_property')).to.be.equal('new_value');
          done();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          done(errorThrown);
        });
    });
  });

  describe('with custom key', function() {
    var customKeyValue = 'userDefined';

    it('can be saved', function(done) {
      var model = new TestModel({ name: 'test', _key: customKeyValue }, { isNew: true });
      model.save({})
        .done(function(data, textStatus, jqXHR) {
          expect(model.id).to.be.a('string');
          expect(model.id).to.be.not.empty;
          expect(model.id).to.equal(customKeyValue);
          expect(model.isNew()).to.be.false;

          done();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          done(errorThrown);
        });
    });

    it('does not change options object on save', function(done) {
      var model = new TestModel({ _key: 'custom_key' }, { isNew: true });
      var options = { };
      model.save({}, options)
        .done(function(data, textStatus, jqXHR) {
          expect(options).to.be.empty;
          done();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          done(errorThrown);
        });
    });

    it('allows to use success handler on save', function(done) {
      var model = new TestModel({ _key: 'custom_key' }, { isNew: true });
      var options = { success: successHandler };
      model.save({}, options)
        .fail(function(jqXHR, textStatus, errorThrown) {
          done(errorThrown);
        });

      function successHandler(savedModel, resp, userOptions) {
        expect(options.success).to.be.equal(successHandler);
        expect(savedModel).to.be.equal(model);
        done();
      }
    });

    it('handles duplicates and does not allow to save them', function(done) {
      var model = new TestModel({ name: 'test', _key: customKeyValue }, { isNew: true });
      var modelDuplicate = new TestModel({ name: 'test2', _key: customKeyValue }, { isNew: true });
      var modelSaved = new TestModel({ _key: customKeyValue });
      model.save({})
        .then(function(data, textStatus, jqXHR) {
          return modelDuplicate.save();
        })
        .done(function(data, textStatus, jqXHR) {
          done(new Error('Should not allow to save duplicates'));
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          expect(modelDuplicate.isNew()).to.be.true;

          modelSaved.fetch()
            .done(function(data, textStatus, jqXHR) {
              expect(model.toJSON()).to.deep.equal(modelSaved.toJSON());
              done();
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
              done(errorThrown);
            });
        });
    });
  });
});

});
