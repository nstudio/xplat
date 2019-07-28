// import { Schema as NrwlAngularSchema } from '@nrwl/angular/src/schematics/application/schema';

export interface Schema {
  //extends NrwlAngularSchema {
  // START from @nrwl/angular package
  // TODO: submit PR to Nx to expose app schema so can be extended from @nrwl/angular
  // Right now the schema.d.ts is not published alongside the schema.json
  name: string;
  skipFormat?: boolean;
  inlineStyle?: boolean;
  inlineTemplate?: boolean;
  viewEncapsulation?: 'Emulated' | 'Native' | 'None';
  routing?: boolean;
  enableIvy?: boolean;
  prefix?: string;
  style?: string;
  skipTests?: boolean;
  directory?: string;
  tags?: string;
  unitTestRunner?: UnitTestRunner;
  e2eTestRunner?: E2eTestRunner;
  // END from @nrwl/angular package

  // xplat additional options
  /**
   * Group by app name (appname-platform) instead of the default (platform-appname)
   */
  groupByName?: boolean;
  /**
   * Generate xplat supporting architecture
   */
  useXplat?: boolean;
  /**
   * Add headless e2e configuration suitable for CI
   */
  addHeadlessE2e?: boolean;
}
