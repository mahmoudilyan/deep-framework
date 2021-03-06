/**
 * Created by AlexanderC on 6/10/15.
 */

'use strict';

import {Response} from './Response';

/**
 * Response object
 */
export class LambdaResponse extends Response {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);

    // assure calling the very first!
    this._fillStatusCode();

    let responsePayload = this._decodePayload();

    this._fillData(responsePayload);
    this._fillError(responsePayload);
  }

  /**
   * @param {Object|null} responsePayload
   * @private
   */
  _fillData(responsePayload) {
    if (responsePayload &&
      !this._request.async &&
      !responsePayload.hasOwnProperty('errorMessage')) {

      this._data = responsePayload;
    }
  }

  /**
   * @param {Object|null} responsePayload
   * @private
   */
  _fillError(responsePayload) {
    if (this._rawError) {
      this._error = this._rawError;
    } else if (!this._request.async) {
      if (!responsePayload) {
        this._error = new Error('There is no error nor payload in Lambda response');
      } else if (responsePayload.hasOwnProperty('errorMessage')) {
        this._error = LambdaResponse.getPayloadError(responsePayload);
      }
    } else if (this._statusCode !== 202) { // check for failed async invocation
      this._error = new Error('Unknown async invocation error');
    }
  }

  /**
   * @private
   */
  _fillStatusCode() {
    this._statusCode = parseInt(this._rawData.StatusCode || this._rawData.Status || 500);
  }

  /**
   * @returns {Object|null}
   * @private
   */
  _decodePayload() {
    if (typeof this._rawData === 'object' &&
      this._rawData.hasOwnProperty('Payload')) {
      let payload = this._rawData.Payload;

      return typeof payload === 'string' ? JSON.parse(payload) : payload;
    }

    return null;
  }

  /**
   * @param {Object} payload
   * @returns {Error|null}
   */
  static getPayloadError(payload) {
    if (payload.errorMessage) {

      // check for error object (on context.failed called)
      if (!payload.hasOwnProperty('errorType') &&
        !payload.hasOwnProperty('errorStack')) {

        let rawErrorObj = null;

        try {
          rawErrorObj = JSON.parse(payload.errorMessage);
          rawErrorObj = rawErrorObj || {
              errorMessage: 'Unknown error occurred.',
              errorStack: null,
              errorType: 'UnknownError'
            };

          rawErrorObj.errorMessage = rawErrorObj.errorMessage || 'Unknown error occurred.';
          rawErrorObj.errorType = rawErrorObj.errorType || 'UnknownError';
        } catch (e) {
        }

        payload = rawErrorObj || {
            errorMessage: payload.errorMessage,
            errorStack: null,
            errorType: 'UnknownError'
          };
      } else {
        payload.errorType = payload.errorType || 'UnknownError';
      }

      let errorObj = new Error(payload.errorMessage);

      errorObj.constructor.name = payload.errorType;

      Object.defineProperty(errorObj, 'stack', {
        value: payload.errorStack,
      });

      return errorObj;
    }

    return null;
  }
}
