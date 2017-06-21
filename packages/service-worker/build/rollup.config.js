/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import resolve from 'rollup-plugin-node-resolve';

export default {
  entry: '../../../dist/packages-dist/service-worker/@angular/service-worker/build.es5.js',
  dest: '../../../dist/packages-dist/service-worker/bundles/service-worker-build.umd.js',
  format: 'umd',
  exports: 'named',
  moduleName: 'ng.serviceWorker.build',
  plugins: [
    resolve(),
  ],
};
