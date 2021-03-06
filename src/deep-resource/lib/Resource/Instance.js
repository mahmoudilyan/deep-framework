/**
 * Created by AlexanderC on 6/10/15.
 */

'use strict';

import {MissingActionException} from './Exception/MissingActionException';
import {Action} from './Action';

/**
 * Resource instance
 */
export class Instance {
  /**
   * @param {String} name
   * @param {Object} rawActions
   */
  constructor(name, rawActions) {
    this._name = name;
    this._rawActions = rawActions;
    this._actions = null;
    this._localBackend = false;
    this._isBackend = false;
    this._cache = null;
    this._security = null;
  }

  /**
   * @returns {Object}
   */
  get security() {
    return this._security;
  }

  /**
   * @param {Object} security
   */
  set security(security) {
    this._security = security;
  }

  /**
   * @returns {String}
   */
  get name() {
    return this._name;
  }

  /**
   * @returns {Object}
   */
  get cache() {
    return this._cache;
  }

  /**
   * @param {Object} cache
   */
  set cache(cache) {
    this._cache = cache;
  }

  /**
   * @returns {Boolean}
   */
  get localBackend() {
    return this._localBackend;
  }

  /**
   * @param {Boolean} state
   */
  set localBackend(state) {
    this._localBackend = state;
  }

  /**
   * @returns {Boolean}
   */
  get isBackend() {
    return this._isBackend;
  }

  /**
   * @param {Boolean} state
   */
  set isBackend(state) {
    this._isBackend = state;
  }

  /**
   * @returns {Object}
   */
  get actions() {
    if (this._actions === null) {
      this._actions = {};

      for (let actionName in this._rawActions) {
        if (!this._rawActions.hasOwnProperty(actionName)) {
          continue;
        }

        let actionMetadata = this._rawActions[actionName];

        this._actions[actionName] = new Action(
          this,
          actionName,
          actionMetadata.type,
          actionMetadata.methods,
          actionMetadata.source,
          actionMetadata.region,
          actionMetadata.forceUserIdentity
        );
      }
    }

    return this._actions;
  }

  /**
   * @param {String} actionName
   * @returns {boolean}
   */
  has(actionName) {
    return this.actions.hasOwnProperty(actionName);
  }

  /**
   * @param actionName
   * @returns {Action}
   */
  action(actionName) {
    if (!this.has(actionName)) {
      throw new MissingActionException(this.name, actionName);
    }

    return this.actions[actionName];
  }

  /**
   * @param {String} actionName
   * @param {*} args
   */
  request(actionName, ...args) {
    return this.action(actionName).request(...args);
  }
}
