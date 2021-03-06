/**
 * Created by AlexanderC on 5/25/15.
 */
'use strict';

import {Interface} from '../../OOP/Interface';
import {Response} from './Response';
import {ErrorResponse} from './ErrorResponse';
import {Request} from './Request';
import {InvalidCognitoIdentityException} from './Exception/InvalidCognitoIdentityException';
import {MissingUserContextException} from './Exception/MissingUserContextException';

/**
 * Lambda runtime context
 */
export class Runtime extends Interface {
  /**
   * @param {Object} kernel
   */
  constructor(kernel) {
    super(['handle']);

    this._kernel = kernel;
    this._request = null;
    this._context = null;

    this._loggedUserId = null;
    this._forceUserIdentity = false;
    this._contextSent = false;

    this._fillDenyMissingUserContextOption();
  }

  /**
   * @returns {Object}
   */
  get context() {
    return this._context;
  }

  /**
   * @returns {Boolean}
   */
  get contextSent() {
    return this._contextSent;
  }

  /**
   * @returns {String}
   */
  get loggedUserId() {
    return this._loggedUserId;
  }

  /**
   * @returns {Boolean}
   */
  get forceUserIdentity() {
    return this._forceUserIdentity;
  }

  /**
   * @returns {Object}
   */
  get kernel() {
    return this._kernel;
  }

  /**
   * @returns {Function}
   */
  get lambda() {
    let _this = this;

    return function(event, context) {
      _this.run(event, context);
    };
  }

  /**
   * @param {Object} event
   * @param {Object} context
   * @returns {Runtime}
   */
  run(event, context) {

    // @todo: move to constructor
    this._context = context;

    this._addExceptionListener();
    
    this._request = new Request(event);
    
    this._fillUserContext();

    if (!this._loggedUserId && this._forceUserIdentity) {
      throw new MissingUserContextException();
    }

    this.handle(this._request);

    return this;
  }

  /**
   * @private
   */
  _addExceptionListener() {
    process.once('uncaughtException', (error) => {
      this.createError(error).send();
    });
  }

  /**
   * @param {String|Error|*} error
   */
  createError(error) {
    return new ErrorResponse(this, error);
  }

  /**
   * @param {Object} data
   */
  createResponse(data) {
    return new Response(this, data);
  }

  /**
   * @returns {Request}
   */
  get request() {
    return this._request;
  }

  /**
   * @returns {Object}
   */
  get securityService() {
    return this.kernel.get('security');
  }

  /**
   * @private
   */
  _fillDenyMissingUserContextOption() {
    if (this._kernel.config.hasOwnProperty('forceUserIdentity')) {
      this._forceUserIdentity = this._kernel.config.forceUserIdentity;
    }
  }

  /**
   * Retrieves logged user id from lambda context
   *
   * @private
   */
  _fillUserContext() {
    if (this._context &&
      this._context.hasOwnProperty('identity') &&
      this._context.identity.hasOwnProperty('cognitoIdentityPoolId') &&
      this._context.identity.hasOwnProperty('cognitoIdentityId')
    ) {
      let identityPoolId = this._context.identity.cognitoIdentityPoolId;

      if (this.securityService.identityPoolId !== identityPoolId) {
        throw new InvalidCognitoIdentityException(identityPoolId);
      }

      // inject lambda context into security service
      // and instantiate security token without loading credentials
      this.securityService.warmupBackendLogin(this._context);

      this._loggedUserId = this._context.identity.cognitoIdentityId;
    }
  }
}
