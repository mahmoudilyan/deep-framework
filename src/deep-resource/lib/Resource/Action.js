/**
 * Created by mgoria on 8/4/15.
 */

'use strict';

import {UnknownMethodException} from './Exception/UnknownMethodException';
import {Request} from './Request';
import {LocalRequest} from './LocalRequest';

/**
 * Resource action
 */
export class Action {
  /**
   * @param {Instance} resource
   * @param {String} name
   * @param {String} type
   * @param {Array} methods
   * @param {String} source
   * @param {String} region
   * @param {Boolean} forceUserIdentity
   */
  constructor(resource, name, type, methods, source, region, forceUserIdentity) {
    this._resource = resource;
    this._name = name;
    this._type = type;
    this._methods = methods;
    this._source = source;
    this._region = region;
    this._forceUserIdentity = forceUserIdentity;
  }

  /**
   * @param {Object} payload
   * @param {String} method
   */
  request(payload = {}, method = null) {
    method = method || (this._methods.length > 0 ? this._methods[0] : Instance.HTTP_VERBS[0]);

    if (this._methods.length > 0 && this._methods.indexOf(method) === -1) {
      throw new UnknownMethodException(method, this._methods);
    }

    let RequestImplementation = this._resource.localBackend ? LocalRequest : Request;
    let requestObject = new RequestImplementation(this, payload, method);

    if (this._resource.cache) {
      requestObject.cacheImpl = this._resource.cache;
    }

    return requestObject;
  }

  /**
   * @returns {Boolean}
   */
  get forceUserIdentity() {
    return this._forceUserIdentity;
  }

  /**
   * @returns {Instance}
   */
  get resource() {
    return this._resource;
  }

  /**
   * @returns {String}
   */
  get name() {
    return this._name;
  }

  /**
   * @returns {String}
   */
  get type() {
    return this._type;
  }

  /**
   * @returns {Array}
   */
  get methods() {
    return this._methods;
  }

  /**
   * @returns {String}
   */
  get source() {
    return this._source;
  }

  /**
   * @returns {String}
   */
  get region() {
    return this._region;
  }

  /**
   * @returns {Array}
   */
  static get HTTP_VERBS() {
    return ['GET', 'POST', 'DELETE', 'HEAD', 'PUT', 'OPTIONS', 'PATCH'];
  }

  /**
   * @returns {String}
   */
  static get LAMBDA() {
    return 'lambda';
  }

  /**
   * @returns {String}
   */
  static get EXTERNAL() {
    return 'external';
  }
}
