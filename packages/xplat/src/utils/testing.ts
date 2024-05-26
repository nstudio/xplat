import { join } from 'path';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { Tree, Rule } from '@angular-devkit/schematics';

const testRunner = new SchematicTestRunner(
  '@nstudio/xplat',
  join(__dirname, '../../collection.json')
);

const migrationTestRunner = new SchematicTestRunner(
  '@nstudio/xplat/migrations',
  join(__dirname, '../../migrations.json')
);

export function runSchematic(schematicName: string, options: any, tree: Tree) {
  return testRunner.runSchematic(schematicName, options, tree);
}

export function callRule(rule: Rule, tree: Tree) {
  return testRunner.callRule(rule, tree).toPromise();
}

export function runMigration(migrationName: string, options: any, tree: Tree) {
  return migrationTestRunner
    .runSchematic(migrationName, options, tree);
}
