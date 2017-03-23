/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ReadyState, RequestMethod, ResponseContentType, ResponseType} from './enums';
import {HttpHeaders} from './headers';
import {Request} from './static_request';
import {HttpUrlParams} from './url_search_params';

/**
 * Abstract class from which real backends are derived.
 *
 * The primary purpose of a `ConnectionBackend` is to create new connections to fulfill a given
 * {@link Request}.
 *
 * @experimental
 */
export abstract class ConnectionBackend { abstract createConnection(request: any): Connection; }

/**
 * Abstract class from which real connections are derived.
 *
 * @experimental
 */
export abstract class Connection {
  readyState: ReadyState;
  request: Request;
  response: any;  // TODO: generic of <Response>;
}

/**
 * An XSRFStrategy configures XSRF protection (e.g. via headers) on an HTTP request.
 *
 * @experimental
 */
export abstract class XSRFStrategy { abstract configureRequest(req: Request): void; }

/**
 * Interface for options to construct a RequestOptions, based on
 * [RequestInit](https://fetch.spec.whatwg.org/#requestinit) from the Fetch spec.
 *
 * @experimental
 */
export interface RequestOptionsArgs {
  url?: string;
  method?: string|RequestMethod;
  /** @deprecated from 4.0.0. Use params instead. */
  search?: string|HttpUrlParams|{[key: string]: any | any[]};
  params?: string|HttpUrlParams|{[key: string]: any | any[]};
  headers?: HttpHeaders;
  body?: any;
  withCredentials?: boolean;
  responseType?: ResponseContentType;
}

/**
 * Required structure when constructing new Request();
 */
export interface RequestArgs extends RequestOptionsArgs { url: string; }

/**
 * Interface for options to construct a Response, based on
 * [ResponseInit](https://fetch.spec.whatwg.org/#responseinit) from the Fetch spec.
 *
 * @experimental
 */
export interface ResponseOptionsArgs {
  body?: string|Object|FormData|ArrayBuffer|Blob;
  status?: number;
  statusText?: string;
  headers?: HttpHeaders;
  type?: ResponseType;
  url?: string;
}
