/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {describe, expect, it} from '@angular/core/testing/src/testing_internal';

import {RequestOptions} from '../src/base_request_options';
import {ContentType} from '../src/enums';
import {HttpHeaders} from '../src/client/headers';
import {ArrayBuffer, Request} from '../src/static_request';

export function main() {
  describe('Request', () => {
    describe('detectContentType', () => {
      it('should return ContentType.NONE', () => {
        const req = new Request(new RequestOptions({url: 'test', method: 'GET', body: null}));

        expect(req.detectContentType()).toEqual(ContentType.NONE);
      });

      it('should return ContentType.JSON', () => {
        const req = new Request(new RequestOptions({
          url: 'test',
          method: 'GET',
          body: null,
          headers: new HttpHeaders({'content-type': 'application/json'})
        }));

        expect(req.detectContentType()).toEqual(ContentType.JSON);
      });

      it('should return ContentType.FORM', () => {
        const req = new Request(new RequestOptions({
          url: 'test',
          method: 'GET',
          body: null,
          headers: new HttpHeaders({'content-type': 'application/x-www-form-urlencoded'})
        }));

        expect(req.detectContentType()).toEqual(ContentType.FORM);
      });

      it('should return ContentType.FORM_DATA', () => {
        const req = new Request(new RequestOptions({
          url: 'test',
          method: 'GET',
          body: null,
          headers: new HttpHeaders({'content-type': 'multipart/form-data'})
        }));

        expect(req.detectContentType()).toEqual(ContentType.FORM_DATA);
      });

      it('should return ContentType.TEXT', () => {
        const req = new Request(new RequestOptions({
          url: 'test',
          method: 'GET',
          body: null,
          headers: new HttpHeaders({'content-type': 'text/plain'})
        }));

        expect(req.detectContentType()).toEqual(ContentType.TEXT);
      });

      it('should return ContentType.BLOB', () => {
        const req = new Request(new RequestOptions({
          url: 'test',
          method: 'GET',
          body: null,
          headers: new HttpHeaders({'content-type': 'application/octet-stream'})
        }));

        expect(req.detectContentType()).toEqual(ContentType.BLOB);
      });

      it('should not create a blob out of ArrayBuffer', () => {
        const req = new Request(new RequestOptions({
          url: 'test',
          method: 'GET',
          body: new ArrayBuffer(1),
          headers: new HttpHeaders({'content-type': 'application/octet-stream'})
        }));

        expect(req.detectContentType()).toEqual(ContentType.ARRAY_BUFFER);
      });
    });

    it('should return empty string if no body is present', () => {
      const req = new Request(new RequestOptions({
        url: 'test',
        method: 'GET',
        body: null,
        headers: new HttpHeaders({'content-type': 'application/json'})
      }));

      expect(req.text()).toEqual('');
    });

    it('should return empty string if body is undefined', () => {
      const reqOptions = new RequestOptions(
          {url: 'test', method: 'GET', headers: new HttpHeaders({'content-type': 'application/json'})});
      delete reqOptions.body;
      const req = new Request(reqOptions);

      expect(req.text()).toEqual('');
    });
  });
}
