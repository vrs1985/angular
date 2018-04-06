/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';

export interface CompilerHost extends ts.CompilerHost {
  getResource(file: string): Promise<string>|undefined;
}

export class NgtscCompilerHost implements CompilerHost {
  constructor(private delegate: ts.CompilerHost) {}

  getSourceFile(
      fileName: string, languageVersion: ts.ScriptTarget,
      onError?: ((message: string) => void)|undefined,
      shouldCreateNewSourceFile?: boolean|undefined): ts.SourceFile|undefined {
    return this.delegate.getSourceFile(
        fileName, languageVersion, onError, shouldCreateNewSourceFile);
  }

  getDefaultLibFileName(options: ts.CompilerOptions): string {
    return this.delegate.getDefaultLibFileName(options);
  }

  writeFile(
      fileName: string, data: string, writeByteOrderMark: boolean,
      onError: ((message: string) => void)|undefined,
      sourceFiles: ReadonlyArray<ts.SourceFile>): void {
    return this.delegate.writeFile(fileName, data, writeByteOrderMark, onError, sourceFiles);
  }

  getCurrentDirectory(): string { return this.delegate.getCurrentDirectory(); }

  getDirectories(path: string): string[] { return this.delegate.getDirectories(path); }

  getCanonicalFileName(fileName: string): string {
    return this.delegate.getCanonicalFileName(fileName);
  }

  useCaseSensitiveFileNames(): boolean { return this.delegate.useCaseSensitiveFileNames(); }

  getNewLine(): string { return this.delegate.getNewLine(); }

  fileExists(fileName: string): boolean { return this.delegate.fileExists(fileName); }

  readFile(fileName: string): string|undefined { return this.delegate.readFile(fileName); }

  getResource(file: string): Promise<string>|undefined {
    throw new Error('Method not implemented.');
  }
}
