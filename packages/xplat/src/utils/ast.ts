import { insertChange } from '@nx/js';
import { findNodes } from 'nx/src/utils/typescript';
import * as ts from 'typescript';
import { Tree } from '@nx/devkit';
import { Tree as NgTree } from '@angular-devkit/schematics';
import { actionToFileChangeMap } from './general';

export function addGlobal(
  tree: Tree,
  source: ts.SourceFile,
  modulePath: string,
  statement: string,
  isExport?: boolean,
) {
  if (isExport) {
    const allExports = findNodes(source, ts.SyntaxKind.ExportDeclaration);
    // console.log('allExports:', allExports.length);
    if (allExports.length > 0) {
      const lastExport = allExports[allExports.length - 1];
      // console.log('lastExport.end:', lastExport.end);
      return [insertChange(tree, source, modulePath, lastExport.end, `\n${statement}\n`)];
    } else {
      return [insertChange(tree, source, modulePath, 0, `${statement}\n`)];
    }
  } else {
    const allImports = findNodes(source, ts.SyntaxKind.ImportDeclaration);
    if (allImports.length > 0) {
      const lastImport = allImports[allImports.length - 1];
      return [
        insertChange(tree, source, modulePath, lastImport.end + 1, `\n${statement}\n`),
      ];
    } else {
      return [insertChange(tree, source, modulePath, 0, `${statement}\n`)];
    }
  }
}
export function insert(host: NgTree, modulePath: string, changes: any[]) {
  if (changes.length < 1) {
    return;
  }

  // sort changes so that the highest pos goes first
  const orderedChanges = changes.sort((a, b) => b.order - a.order) as any;

  const recorder = host.beginUpdate(modulePath);
  for (const change of orderedChanges) {
    // console.log('change.type:', change, ' -change.kind:', change.kind)
    let type = change.type;
    if (change.kind === 'c' || change.kind === 'o') {
      type = actionToFileChangeMap[change.kind];
    }
    if (type == 'insert') {
      recorder.insertLeft(change.pos, change.toAdd);
    } else if (type == 'remove') {
      recorder.remove(change.pos - 1, change.toRemove.length + 1);
    } else if (type == 'replace') {
      recorder.remove(change.pos, change.oldText.length);
      recorder.insertLeft(change.pos, change.newText);
    } else if (type === 'noop') {
      // do nothing
    } else {
      throw new Error(`Unexpected Change '${change.constructor.name}'`);
    }
  }
  host.commitUpdate(recorder);
}
