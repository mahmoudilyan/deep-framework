/**
 * Created by AlexanderC on 6/15/15.
 */

'use strict';

import Kernel from 'deep-kernel';
import Vogels from 'vogels';
import {ExtendModel} from './Vogels/ExtendModel';
import {ModelNotFoundException} from './Exception/ModelNotFoundException';
import Validation from 'deep-validation';
import Utils from 'util';
import {FailedToCreateTableException} from './Exception/FailedToCreateTableException';
import {FailedToCreateTablesException} from './Exception/FailedToCreateTablesException';
import {AbstractDriver} from './Local/Driver/AbstractDriver';

/**
 * Vogels wrapper
 */
export class DB extends Kernel.ContainerAware {
  /**
   * @param {Array} models
   * @param {Object} tablesNames
   */
  constructor(models = [], tablesNames = {}) {
    super();

    // @todo: set retries in a smarter way...
    Vogels.AWS.config.maxRetries = 3;

    this._tablesNames = tablesNames;
    this._validation = new Validation(models);
    this._models = this._rawModelsToVogels(models);

    // @todo: remove?
    this._localDbProcess = null;
  }

  /**
   * @returns {Validation}
   */
  get validation() {
    return this._validation;
  }

  /**
   * @returns {Vogels[]}
   */
  get models() {
    return this._models;
  }

  /**
   * @param {String} modelName
   * @returns {Boolean}
   */
  has(modelName) {
    return typeof this._models[modelName] !== 'undefined';
  }

  /**
   * @param {String} modelName
   * @returns {Vogels}
   */
  get(modelName) {
    if (!this.has(modelName)) {
      throw new ModelNotFoundException(modelName);
    }

    return this._models[modelName];
  }

  /**
   * @param {String} modelName
   * @param {Function} callback
   * @param {Object} options
   * @returns {DB}
   */
  assureTable(modelName, callback, options = {}) {
    if (!this.has(modelName)) {
      throw new ModelNotFoundException(modelName);
    }

    options = Utils._extend(DB.DEFAULT_TABLE_OPTIONS, options);
    options[modelName] = options;

    Vogels.createTables(options, function(error) {
      if (error) {
        throw new FailedToCreateTableException(modelName);
      }

      callback();
    }.bind(this));

    return this;
  }

  /**
   * @param {Function} callback
   * @param {Object} options
   * @returns {DB}
   */
  assureTables(callback, options = {}) {
    let allModelsOptions = {};
    let allModelNames = [];

    for (let modelName in this._models) {
      if (!this._models.hasOwnProperty(modelName)) {
        continue;
      }

      allModelsOptions[modelName] = Utils._extend(DB.DEFAULT_TABLE_OPTIONS, options);
      allModelNames.push(modelName);
    }

    Vogels.createTables(allModelsOptions, function(error) {
      if (error) {
        throw new FailedToCreateTablesException(allModelNames, error);
      }

      callback();
    }.bind(this));

    return this;
  }

  /**
   * Booting a certain service
   *
   * @param {Kernel} kernel
   * @param {Function} callback
   */
  boot(kernel, callback) {
    this._validation.boot(kernel, function() {
      this._validation.immutable = true;

      this._tablesNames = kernel.config.tablesNames;
      this._models = this._rawModelsToVogels(kernel.config.models);

      if (this._localBackend) {
        this._enableLocalDB(callback);
      } else {
        callback();
      }
    }.bind(this));
  }

  /**
   * @param {Object} driver
   * @returns {DB}
   * @private
   */
  _setVogelsDriver(driver) {
    Vogels.dynamoDriver(driver);

    return this;
  }

  /**
   * @param {Function} callback
   * @param {String} driver
   * @param {Number} tts
   * @returns {AbstractDriver}
   */
  static startLocalDynamoDBServer(callback, driver = 'LocalDynamo', tts = AbstractDriver.DEFAULT_TTS) {
    let LocalDBServer = require('./Local/DBServer').DBServer;

    let server = LocalDBServer.create(driver);

    server.start(callback, tts);

    return server;
  }

  /**
   * @param {Function} callback
   * @private
   */
  _enableLocalDB(callback) {
    this._setVogelsDriver(
      new Vogels.AWS.DynamoDB({
        endpoint: new Vogels.AWS.Endpoint(`http://localhost:${DB.LOCAL_DB_PORT}`),
        accessKeyId: 'fake',
        secretAccessKey: 'fake',
        region: 'us-east-1',
      })
    );

    this.assureTables(callback);
  }

  /**
   * @returns {Object}
   */
  static get DEFAULT_TABLE_OPTIONS() {
    return {
      readCapacity: 5,
      writeCapacity: 5,
    };
  }

  /**
   * @param {Array} rawModels
   * @returns {Object}
   */
  _rawModelsToVogels(rawModels) {
    let models = {};

    for (let modelKey in rawModels) {
      if (!rawModels.hasOwnProperty(modelKey)) {
        continue;
      }

      let backendModels = rawModels[modelKey];

      for (let modelName in backendModels) {
        if (!backendModels.hasOwnProperty(modelName)) {
          continue;
        }

        models[modelName] = new ExtendModel(Vogels.define(
          modelName,
          this._wrapModelSchema(modelName)
        )).inject();
      }
    }

    return models;
  }

  /**
   * @param {String} name
   * @returns {Object}
   * @private
   */
  _wrapModelSchema(name) {
    return {
      hashKey: 'Id',
      timestamps: true,
      tableName: this._tablesNames[name],
      schema: this._validation.get(name),
    };
  }

  /**
   * @returns {Number}
   */
  static get LOCAL_DB_PORT() {
    return AbstractDriver.DEFAULT_PORT;
  }
}
