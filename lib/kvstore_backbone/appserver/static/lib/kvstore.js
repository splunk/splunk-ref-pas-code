/**
 * @file KVStore library.
 */
define(function(require, exports, module) {
'use strict';

var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var mvcUtils = require('splunkjs/mvc/utils');
var splunkdUtils = require('util/splunkd_utils');

var defaultOwner = 'nobody';

/**
 * KVStore Model and Collection Backbone extended classes.
 * @exports kvstore
 * @requires jquery
 * @requires underscore
 * @requires backbone
 * @requires splunkjs/mvc/utils
 * @requires util/splunkd_utils
 */
exports = {};

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
     * Constructs backbone model compatible with KVStore REST API.
     * @constructs
     * @augments Backbone.Model
     * @param {object}  [attributes]  see {@link http://backbonejs.org/#Model-constructor|Backbone.Model.prototype.constructor}
     * @param {object}  [options]     see {@link http://backbonejs.org/#Model-constructor|Backbone.Model.prototype.constructor},
     *                                you may specify namespace {app: 'x', owner: 'y'} as an option
     * @example
     * // Define Model class for specific collection
     * var MyModel = kvstore.Model.extend({
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
     * // Save new model with custom key (specify key but force state to be new)
     * var model = new MyModel({ name: 'Model name', _key: 'model1' }, { isNew: true });
     * model.save()
     *   .done(function() {
     *     console.log('Model saved, key = ' + model.id);
     *   });
     */
    initialize: function(attributes, options) {
      if (options) {
        if (options.isNew) {
          this._isNew = true;
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
     * to allow saving new models with custom key by forcing isNew status to be true.
     * You can specify isNew status as an option when you create new model or by calling this method with true value.
     * @param [value] {boolean} force isNew status to be true
     * @return {boolean} returns whether this model is new
     */
    isNew: function(value) {
      if (!_.isUndefined(value)) {
        if (value) {
          this._isNew = true;
        } else {
          delete this._isNew;
        }
      }
      if (this._isNew) {
        return true;
      } else {
        return Backbone.Model.prototype.isNew.apply(this, arguments);
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
     * If you need to save new model with custom _key you can specify { isNew: true } in options to treat save this model as new. <br>
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

      // Support all kind of syntax 
      // (see default Backbone.Model.save implementation)
      /*jshint -W041 */
      var attrs;      
      if (key == null || typeof key === 'object') { 
        attrs = key;
        options = value;
      } else {
        (attrs = {})[key] = value;
      }
      /*jshint +W041 */

      if (!this.isNew() && !this._isNew) {
        // Send save request as POST not PUT
        options = _.extend({type: 'POST'}, options);
      }

      if (this._isNew) {
        this._isNew = true;
        options = _.clone(options) || {};
        var model = this;
        var success = options.success;
        options.success = function() {
          model.isNew(false);
          if (success) {
            success.apply(this, arguments);
          }
        };
      }

      return Backbone.Model.prototype.save.call(this, attrs, options);
    },

    /**
     * Overrides {@link http://backbonejs.org/#Model-destroy|Backbone.Model.prototype.destroy} method to support 
     * empty KVStore response on success. <br>
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
        opts = options;
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
        return $.Deferred().reject(null,  null, new Error('Model with empty string as a _key cannot be fetched'));
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
     * var MyModel = kvstore.Model.extend({
     *     collectionName: 'mycollection'
     *   });
     * var MyCollection = kvstore.Collection.extend({
     *     collectionName: 'mycollection',
     *     model: MyModel
     *   });
     *
     * // Fetch collection with parameters
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