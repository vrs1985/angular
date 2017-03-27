/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable} from '@angular/core';

import {RequestMethod, ResponseContentType} from './enums';
import {HttpHeaders} from './client/headers';
import {HttpUrlParams} from './client/url_params';
import {normalizeMethodName} from './http_utils';
import {RequestOptionsArgs} from './interfaces';


/**
 * Creates a request options object to be optionally provided when instantiating a
 * {@link Request}.
 *
 * This class is based on the `RequestInit` description in the [Fetch
 * Spec](https://fetch.spec.whatwg.org/#requestinit).
 *
 * All values are null by default. Typical defaults can be found in the {@link BaseRequestOptions}
 * class, which sub-classes `RequestOptions`.
 *
 * ### Example ([live demo](http://plnkr.co/edit/7Wvi3lfLq41aQPKlxB4O?p=preview))
 *
 * ```typescript
 * import {RequestOptions, Request, RequestMethod} from '@angular/http';
 *
 * var options = new RequestOptions({
 *   method: RequestMethod.Post,
 *   url: 'https://google.com'
 * });
 * var req = new Request(options);
 * console.log('req.method:', RequestMethod[req.method]); // Post
 * console.log('options.url:', options.url); // https://google.com
 * ```
 *
 * @experimental
 */
export class RequestOptions {
  /**
   * Http method with which to execute a {@link Request}.
   * Acceptable methods are defined in the {@link RequestMethod} enum.
   */
  method: RequestMethod|string;
  /**
   * {@link Headers} to be attached to a {@link Request}.
   */
  headers: HttpHeaders;
  /**
   * Body to be used when creating a {@link Request}.
   */
  body: any;
  /**
   * Url with which to perform a {@link Request}.
   */
  url: string;
  /**
   * Search parameters to be included in a {@link Request}.
   */
  params: HttpUrlParams;
  /**
   * @deprecated from 4.0.0. Use params instead.
   */
  get search(): HttpUrlParams { return this.params; }
  /**
   * @deprecated from 4.0.0. Use params instead.
   */
  set search(params: HttpUrlParams) { this.params = params; }
  /**
   * Enable use credentials for a {@link Request}.
   */
  withCredentials: boolean;
  /*
   * Select a buffer to store the response, such as ArrayBuffer, Blob, Json (or Document)
   */
  responseType: ResponseContentType;

  // TODO(Dzmitry): remove search when this.search is removed
  constructor(
      {method, headers, body, url, search, params, withCredentials,
       responseType}: RequestOptionsArgs = {}) {
    this.method = method != null ? normalizeMethodName(method) : null;
    this.headers = headers != null ? headers : null;
    this.body = body != null ? body : null;
    this.url = url != null ? url : null;
    this.params = this._mergeSearchParams(params || search);
    this.withCredentials = withCredentials != null ? withCredentials : null;
    this.responseType = responseType != null ? responseType : null;
  }

  /**
   * Creates a copy of the `RequestOptions` instance, using the optional input as values to override
   * existing values. This method will not change the values of the instance on which it is being
   * called.
   *
   * Note that `headers` and `search` will override existing values completely if present in
   * the `options` object. If these values should be merged, it should be done prior to calling
   * `merge` on the `RequestOptions` instance.
   *
   * ### Example ([live demo](http://plnkr.co/edit/6w8XA8YTkDRcPYpdB9dk?p=preview))
   *
   * ```typescript
   * import {RequestOptions, Request, RequestMethod} from '@angular/http';
   *
   * var options = new RequestOptions({
   *   method: RequestMethod.Post
   * });
   * var req = new Request(options.merge({
   *   url: 'https://google.com'
   * }));
   * console.log('req.method:', RequestMethod[req.method]); // Post
   * console.log('options.url:', options.url); // null
   * console.log('req.url:', req.url); // https://google.com
   * ```
   */
  merge(options?: RequestOptionsArgs): RequestOptions {
    return new RequestOptions({
      method: options && options.method != null ? options.method : this.method,
      headers: options && options.headers != null ? options.headers : new HttpHeaders(this.headers),
      body: options && options.body != null ? options.body : this.body,
      url: options && options.url != null ? options.url : this.url,
      params: options && this._mergeSearchParams(options.params || options.search),
      withCredentials: options && options.withCredentials != null ? options.withCredentials :
                                                                    this.withCredentials,
      responseType: options && options.responseType != null ? options.responseType :
                                                              this.responseType
    });
  }

  private _mergeSearchParams(params: string|HttpUrlParams|
                             {[key: string]: any | any[]}): HttpUrlParams {
    if (!params) return this.params;

    if (params instanceof HttpUrlParams) {
      return params.clone();
    }

    if (typeof params === 'string') {
      return new HttpUrlParams(params);
    }

    return this._parseParams(params);
  }

  private _parseParams(objParams: {[key: string]: any | any[]} = {}): HttpUrlParams {
    const params = new HttpUrlParams();
    Object.keys(objParams).forEach((key: string) => {
      const value: any|any[] = objParams[key];
      if (Array.isArray(value)) {
        value.forEach((item: any) => this._appendParam(key, item, params));
      } else {
        this._appendParam(key, value, params);
      }
    });
    return params;
  }

  private _appendParam(key: string, value: any, params: HttpUrlParams): void {
    if (typeof value !== 'string') {
      value = JSON.stringify(value);
    }
    params.append(key, value);
  }
}

/**
 * Subclass of {@link RequestOptions}, with default values.
 *
 * Default values:
 *  * method: {@link RequestMethod RequestMethod.Get}
 *  * headers: empty {@link Headers} object
 *
 * This class could be extended and bound to the {@link RequestOptions} class
 * when configuring an {@link Injector}, in order to override the default options
 * used by {@link Http} to create and send {@link Request Requests}.
 *
 * ### Example ([live demo](http://plnkr.co/edit/LEKVSx?p=preview))
 *
 * ```typescript
 * import {provide} from '@angular/core';
 * import {bootstrap} from '@angular/platform-browser/browser';
 * import {HTTP_PROVIDERS, Http, BaseRequestOptions, RequestOptions} from '@angular/http';
 * import {App} from './myapp';
 *
 * class MyOptions extends BaseRequestOptions {
 *   search: string = 'coreTeam=true';
 * }
 *
 * bootstrap(App, [HTTP_PROVIDERS, {provide: RequestOptions, useClass: MyOptions}]);
 * ```
 *
 * The options could also be extended when manually creating a {@link Request}
 * object.
 *
 * ### Example ([live demo](http://plnkr.co/edit/oyBoEvNtDhOSfi9YxaVb?p=preview))
 *
 * ```
 * import {BaseRequestOptions, Request, RequestMethod} from '@angular/http';
 *
 * var options = new BaseRequestOptions();
 * var req = new Request(options.merge({
 *   method: RequestMethod.Post,
 *   url: 'https://google.com'
 * }));
 * console.log('req.method:', RequestMethod[req.method]); // Post
 * console.log('options.url:', options.url); // null
 * console.log('req.url:', req.url); // https://google.com
 * ```
 *
 * @experimental
 */
@Injectable()
export class BaseRequestOptions extends RequestOptions {
  constructor() { super({method: RequestMethod.Get, headers: new HttpHeaders()}); }
}
