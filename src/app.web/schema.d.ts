import { Framework } from "../utils";

export interface Schema {
  framework?: Framework;
  name: string;
  skipFormat?: boolean;
  inlineStyle?: boolean;
  inlineTemplate?: boolean;
  viewEncapsulation?: "Emulated" | "Native" | "None";
  routing?: boolean;
  prefix?: string;
  style?: string;
  skipTests?: boolean;
  directory?: string;
  tags?: string;
  unitTestRunner?: any;
  e2eTestRunner?: any;

  // xplat additional options
  sample?: boolean;
  /**
   * Group by app name (appname-platform) instead of the default (platform-appname)
   */
  groupByName?: boolean;
  /**
   * Add headless e2e configuration suitable for CI
   */
  addHeadlessE2e?: boolean;
}
