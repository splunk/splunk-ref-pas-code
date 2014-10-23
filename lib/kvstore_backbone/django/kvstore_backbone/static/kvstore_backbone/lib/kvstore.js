define(function(require, exports, module) {
'use strict';

var _ = require('underscore');
var Backbone = require('backbone');
var mvcUtils = require('splunkjs/mvc/utils');
var splunkdUtils = require('util/splunkd_utils');

var defaultOwner = 'nobody';

/**
 * KVStore Model and Collection Backbone extended classes.
 * @exports kvstore
 * @requires underscore
 * @requires backbone
 * @requires splunkjs/mvc/utils
 * @requires util/splunkd_utils
 */
var exports = {};

function getDefaultNamespace() {
  return {
    owner: defaultOwner,
    app: mvcUtils.getCurrentApp()
  };
}

function constructUrl(collectionName, namespace) {
  namespace = namespace || {};
  return splunkdUtils.fullpath(
      'storage/collections/data/' + encodeURI(collectionName), 
      {
        owner: namespace.owner || defaultOwner,
        app: namespace.app || mvcUtils.getCurrentApp()
      });
}

exports.Model = Backbone.Model.extend(
  /** @lends module:kvstore~Model.prototype */
  {
    defaults: {
      _user: 'nobody'
    },

    /**
     * Overrides {@link http://backbonejs.org/#Model-idAttribute|Backbone.Model.prototype.idAttribute} to
     * specify default KVStore id field.
     * @default
     */
    idAttribute: "_key",

    /**
     * KVStore collection name.
     * @type {string}
     * @abstract
     * @default
     */
    collectionName: null,

    /**
     * Splunk namespace { owner: 'x', app: 'y' }.
     * @type {(object|function)}
     * @default function returns namespace { owner: 'nobody', app: '{current application}' }
     */
    namespace: getDefaultNamespace,

    /**
     * Specify to true if you need to specify document keys on client side.
     * This property allows to override standard behavior
     * for {@link http://backbonejs.org/#Model-isNew|Backbone.Model.prototype.isNew} 
     * (which returns true only when key has not been specified).
     * @type {boolean}
     * @default
     */
    customKey: false,

    /** 
     * Constructs backbone model compatible with KVStore REST API.
     * @constructs
     * @augments Backbone.Model
     * @param {object}  [attributes]  see {@link http://backbonejs.org/#Model-constructor|Backbone.Model.prototype.constructor}
     * @param {object}  [options]     see {@link http://backbonejs.org/#Model-constructor|Backbone.Model.prototype.constructor},
     *                                you may specify namespace {app: 'x', owner: 'y'} as an option
     * @example
     * // Define Model class for specific collection
     * var MyModel = kvstore.Model.extends({
     *     collectionName: 'mycollection'
     *   });
     *
     * // Save model
     * var model = new MyModel({ name: 'Model name' });
     * model.save()
     *   .done(function() {
     *     console.log('Model saved, key = ' + model.id);
     *   });
     * 
     * // Load model with specific key
     * var model = new MyModel({ _key: '5447fb752dbbb628d0224132' });
     * model.fetch()
     *   .done(function() {
     *     console.log('Model loaded, name = ' + model.get('name'));
     *   });
     *
     * // Destroy model with specific key
     * var model = new MyModel({ _key: '5447fb752dbbb628d0224132' });
     * model.destroy()
     *   .done(function() {
     *     console.log('Model delete from server);
     *   });
     *
     * @example
     * // Define Model class for specific collection
     * // In this example we will manage key on client side
     * var MyModelWithCustomKey = kvstore.Model.extends({
     *     collectionName: 'mycollection',
     *     customKey: true
     *   });
     *
     * // Save new model
     * var model = new MyModelWithCustomKey({ name: 'Model name', _key: 'model1' });
     * model.save()
     *   .done(function() {
     *     console.log('Model saved, key = ' + model.id);
     *   });
     * 
     * // Load model with specific key 
     * var model = new MyModelWithCustomKey({ _key: 'model1' }, {isNew: false});
     * model.fetch()
     *   .done(function() {
     *     console.log('Model loaded, name = ' + model.get('name'));
     *   });
     *
     * // Destroy model with specific key
     * var model = new MyModelWithCustomKey({ _key: 'model1' }, {isNew: false});
     * model.destroy()
     *   .done(function() {
     *     console.log('Model delete from server);
     *   });
     */
    initialize: function(attributes, options) {
      if (options) {
        if (!_.isUndefined(options.isNew)) {
          this.isNew(options.isNew);
        } else if (this.customKey && options.collection && options.xhr) {
          // if this Model has been loaded from server (options.xhr) 
          // using collection.fetch method (options.collection)
          // mark this model as not new in case of this.customKey
          this.isNew(false);
        }
        var namespace = options.namespace;
        if (options.collection && options.collection.namespace) {
          namespace = _.extend(namespace || {}, options.collection.namespace);
        }
        if (!_.isUndefined(namespace)) {
          this.namespace = _.clone(namespace);
          if (!_.isUndefined(this.namespace.owner)) {
            this.set('_user', this.namespace.owner);
          }
        }
      }
      return Backbone.Model.prototype.initialize.apply(this, arguments);
    },

    /**
     * Overrides {@link http://backbonejs.org/#Model-isNew|Backbone.Model.prototype.isNew} method 
     * to add support for {@link module:kvstore~Model#customKey|customKey}.
     * @param {boolean} [value] set isNew value 
     *                          (setter works only when {@link module:kvstore~Model#customKey|customKey} is true)
     * @return {boolean} returns whether this model is new
     */
    isNew: function(value) {
      if (this.customKey) {
        if (!_.isUndefined(value)) {
          this._isNew = value;
        }
        return _.isUndefined(this._isNew) ? true : this._isNew;
      } else {
        if (!_.isUndefined(value)) {
          console.warn('value is ignored for models with auto-generated keys');
        }
        return Backbone.Model.prototype.isNew.call(this);
      }
    },

    /**
     * Overrides {@link http://backbonejs.org/#Model-urlRoot|Backbone.Model.prototype.urlRoot} method.
     * @method
     * @return {string} url to KVStore collection constructed using 
     *                  {@link module:kvstore~Model#collectionName|collectionName} and 
     *                  {@link module:kvstore~Model#namespace|namespace}
     */
    urlRoot: function() {
      return constructUrl(this.collectionName, _.result(this, 'namespace'));
    },

    /**
     * Overrides {@link http://backbonejs.org/#Model-save|Backbone.Model.prototype.save} method to support 
     * proper KVStore updates using POST requests instead of PUT (can be overridden with options).<br>
     * This method handles {@link module:kvstore~Model#isNew|isNew} value 
     * when {@link module:kvstore~Model#customKey|customKey} set to true. <br>
     * On success response it sets false to {@link module:kvstore~Model#isNew|isNew}.<br>
     * Rejects operation when {@link http://backbonejs.org/#Model-id|Model.prototype.id} is empty string.
     * @method
     * @param [key]     {(string|object)} see {@link http://backbonejs.org/#Model-save|Backbone.Model.prototype.save}
     * @param [value]   {(string|object)} see {@link http://backbonejs.org/#Model-save|Backbone.Model.prototype.save}
     * @param [options] {object}          see {@link http://backbonejs.org/#Model-save|Backbone.Model.prototype.save}
     * @return {object} see {@link http://api.jquery.com/category/deferred-object/|jQuery Deferred Object}
     */
    save:  function(key, value, options) {
      if (this.id === '') {
        return $.Deferred().reject(null, null, new Error('Model with empty string as a _key cannot be saved'));
      }

      var forceKeyUpdate = this.customKey && this.isNew();

      // Support all kind of syntax 
      // (see default Backbone.Model.save implementation)
      var attrs;
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = value;
      } else {
        (attrs = {})[key] = value;
      }

      if (!this.isNew()) {
        // Send save request as POST not PUT
        options = _.extend({type: 'POST'}, options);
      } else if (forceKeyUpdate) {
        options = _.clone(options);
      }

      if (forceKeyUpdate) {
        options = options || {};
        var success = options.success;
        var model = this;
        options.success = function() {
          model.isNew(false);
          if (success) {
            success.apply(this, arguments);
          }
        }
      }

      return Backbone.Model.prototype.save.call(this, attrs, options);
    },

    /**
     * Overrides {@link http://backbonejs.org/#Model-destroy|Backbone.Model.prototype.destroy} method to support 
     * empty KVStore response on success. <br>
     * This method handles {@link module:kvstore~Model#isNew|isNew} value 
     * when {@link module:kvstore~Model#customKey|customKey} set to true. <br>
     * On success response it sets true to {@link module:kvstore~Model#isNew|isNew}. <br>
     * Rejects operation when {@link http://backbonejs.org/#Model-id|Model.prototype.id} is empty string.
     * @method
     * @param [key]     {(string|object)} see {@link http://backbonejs.org/#Model-save|Backbone.Model.prototype.destroy}
     * @param [value]   {(string|object)} see {@link http://backbonejs.org/#Model-save|Backbone.Model.prototype.destroy}
     * @param [options] {object}          see {@link http://backbonejs.org/#Model-save|Backbone.Model.prototype.destroy}
     * @return {object} see {@link http://api.jquery.com/category/deferred-object/|jQuery Deferred Object}
     */
    destroy: function(options) {
      if (this.id === '') {
        return $.Deferred().reject(null, null, new Error('Model with empty string as a _key cannot be destroyed'));
      }

      var forceKeyUpdate = this.customKey && !this.isNew();
      // KVStore does not return anything when model
      // is destroyed on server side, let's force Backbone to
      // not parse response as JSON.
      var opts;
      if (!options || !options.dataType) {
        opts = { dataType: 'text' };
        if (options) {
          opts = _.extend(opts, options);
        }
      } else {
        opts = forceKeyUpdate ? _.clone(options) : options;
      }
      if (forceKeyUpdate) {
        opts = opts || {};
        var success = opts.success;
        var model = this;
        opts.success = function() {
          model.isNew(true);
          if (success) {
            success.apply(this, arguments);
          }
        }
      }
      return Backbone.Model.prototype.destroy.call(this, opts);
    },

    /**
     * Overrides {@link http://backbonejs.org/#Model-save|Backbone.Model.prototype.fetch}.<br>
     * Rejects operation when {@link http://backbonejs.org/#Model-id|Model.prototype.id} is empty string.
     * @method
     * @param [key]     {(string|object)} see {@link http://backbonejs.org/#Model-save|Backbone.Model.prototype.fetch}
     * @param [value]   {(string|object)} see {@link http://backbonejs.org/#Model-save|Backbone.Model.prototype.fetch}
     * @param [options] {object}          see {@link http://backbonejs.org/#Model-save|Backbone.Model.prototype.fetch}
     * @return {object} see {@link http://api.jquery.com/category/deferred-object/|jQuery Deferred Object}
     */
    fetch: function() {
      if (this.id === '') {
        return $.Deferred().reject(null,  null, new Error('Model with empty string as a _key cannot be destroyed'));
      }
      return Backbone.Model.prototype.fetch.apply(this, arguments);
    }
  }
);


exports.Collection = Backbone.Collection.extend(
  /** @lends module:kvstore~Collection.prototype */
  {
    /**
     * KVStore collection name.
     * @type {string}
     * @abstract
     * @default
     */
    collectionName: null,

    /**
     * Splunk namespace { owner: 'x', app: 'y' }.
     * @type {(object|function)}
     * @default function returns namespace { owner: 'nobody', app: '{current application}' }
     */
    namespace: getDefaultNamespace,

    /** 
     * Constructs backbone collection compatible with KVStore REST API.
     * @constructs 
     * @augments Backbone.Collection
     * @param {array}   [models]    see {@link http://backbonejs.org/#Collection-constructor|Backbone Collection constructor}
     * @param {object}  [options]   see {@link http://backbonejs.org/#Collection-constructor|Backbone Collection constructor},
     *                              you may specify namespace {app: 'x', owner: 'y'} as an option
     * @example
     * // Define Model and Collection for specific collection
     * var MyModel = kvstore.Model.extends({
     *     collectionName: 'mycollection'
     *   });
     * var MyCollection = kvstore.Collection.extends({
     *     collectionName: 'mycollection',
     *     model: MyModel
     *   });
     *
     * // Save new model
     * var collection = new MyCollection();
     * collection.fetch({
     *      data: $.param({
     *        skip: 10,
     *        limit: 10,
     *        sort: 'name',
     *        query: JSON.stringify({ name: { '$gte': 'A' } })
     *      })
     *   })
     *   .done(function() {
     *     console.log('Collection loaded, length = ' + collection.length);
     *   });
     */
    initialize: function(models, options) {
      if (options) {
        if (!_.isUndefined(options.namespace)) {
          this.namespace = _.clone(options.namespace);
        }
      }
      return Backbone.Collection.prototype.initialize.apply(this, arguments);
    },

    /**
     * Overrides {@link http://backbonejs.org/#Collection-url}.
     * @return {string} url to KVStore collection constructed using 
     *                  {@link module:kvstore~Collection#collectionName|collectionName} and 
     *                  {@link module:kvstore~Collection#namespace|namespace}
     */
    url: function() {
      return constructUrl(this.collectionName, _.result(this, 'namespace'));
    }
  }
);


return exports;

});