/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';

/**
 * Result type of visiting a node that's typically an entry in a list, which allows specifying that
 * nodes should be added before the visited node in the output.
 */
export type VisitListEntryResult<B extends ts.Node, T extends B> = {
  node: T,
  before?: B[]
};

/**
 * Visit a node with the given visitor and return a transformed copy.
 */
export function visit<T extends ts.Node>(
    node: T, visitor: Visitor, context: ts.TransformationContext): T {
  return visitor._visit(node, context);
}

/**
 * Abstract base class for visitors, which processes certain nodes specially to allow insertion
 * of other nodes before them.
 */
export abstract class Visitor {
  /**
   * Maps statements to an array of statements that should be inserted before them.
   */
  private _before = new Map<ts.Statement, ts.Statement[]>();

  /**
   * Visit a class declaration, returning at least the transformed declaration and optionally other
   * nodes to insert before the declaration.
   */
  visitClassDeclaration(node: ts.ClassDeclaration):
      VisitListEntryResult<ts.Statement, ts.ClassDeclaration> {
    return {node};
  }

  private _visitClassDeclaration(node: ts.ClassDeclaration, context: ts.TransformationContext):
      ts.ClassDeclaration {
    const result = this.visitClassDeclaration(node);
    const visited = ts.visitEachChild(result.node, child => this._visit(child, context), context);
    if (result.before !== undefined) {
      // Record that some nodes should be inserted before the given declaration. The declaration's
      // parent's _visit call is responsible for performing this insertion.
      this._before.set(visited, result.before);
    }
    return visited;
  }

  /**
   * Visit types of nodes which don't have their own explicit visitor.
   */
  visitOtherNode<T extends ts.Node>(node: T): T { return node; }

  private _visitOtherNode<T extends ts.Node>(node: T, context: ts.TransformationContext): T {
    return ts.visitEachChild(
        this.visitOtherNode(node), child => this._visit(child, context), context);
  }

  /**
   * @internal
   */
  _visit<T extends ts.Node>(node: T, context: ts.TransformationContext): T {
    // First, visit the node. visitedNode starts off as `null` but should be set after visiting
    // is completed.
    let visitedNode: T|null = null;
    if (ts.isClassDeclaration(node)) {
      visitedNode = this._visitClassDeclaration(node, context) as typeof node;
    } else {
      visitedNode = this._visitOtherNode(node, context);
    }

    // If the visited node has a `statements` array then process them, maybe replacing the visited
    // node and adding additional statements.
    if (hasStatements(visitedNode)) {
      visitedNode = this._maybeProcessStatements(visitedNode);
    }

    return visitedNode;
  }

  private _maybeProcessStatements<T extends ts.Node&{statements: ts.NodeArray<ts.Statement>}>(
      node: T): T {
    // Shortcut - if every statement doesn't require nodes to be prepended, this is a no-op.
    if (node.statements.every(stmt => !this._before.has(stmt))) {
      return node;
    }

    // There are statements to prepend, so clone the original node.
    const clone = ts.getMutableClone(node);

    // Build a new list of statements and patch it onto the clone.
    const newStatements: ts.Statement[] = [];
    clone.statements.forEach(stmt => {
      if (this._before.has(stmt)) {
        newStatements.push(...(this._before.get(stmt) !as ts.Statement[]));
        this._before.delete(stmt);
      }
      newStatements.push(stmt);
    });
    clone.statements = ts.createNodeArray(newStatements, node.statements.hasTrailingComma);
    return clone;
  }
}

function hasStatements(node: ts.Node): node is ts.Node&{statements: ts.NodeArray<ts.Statement>} {
  const block = node as{statements?: any};
  return block.statements !== undefined && Array.isArray(block.statements);
}
