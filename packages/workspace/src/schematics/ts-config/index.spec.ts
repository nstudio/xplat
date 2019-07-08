import { Tree } from '@angular-devkit/schematics';
import { createEmptyWorkspace, getFileContent } from '@nstudio/workspace/testing';
import { runSchematic } from '../../utils/testing';
import { Schema as ConfigOptions } from './schema';

describe('ts-config schematic', () => {
  let appTree: Tree;
  const defaultOptions: ConfigOptions = {};

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  it('should modify root tsconfig for web,nativescript', async () => {
    const options: ConfigOptions = { ...defaultOptions };

    const tree = await runSchematic('ts-config', options, appTree);
    const tsConfig = getFileContent(tree, 'tsconfig.json');
    expect(tsConfig.indexOf(`@testing/nativescript`)).toBe(95);
    expect(tsConfig.indexOf(`xplat/nativescript/index.ts`)).toBe(130);
    expect(tsConfig.indexOf(`@testing/web`)).toBe(250);
    expect(tsConfig.indexOf(`xplat/web/index.ts`)).toBe(276);
  });
});
