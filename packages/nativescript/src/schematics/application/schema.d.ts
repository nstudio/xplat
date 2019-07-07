export interface Schema {
  /**
   * The name of the app.
   */
  name: string;
  /**
   * npm scope - auto detected from nx.json but can specify your own name
   */
  npmScope?: string;
  /**
   * The prefix to apply to generated selectors.
   */
  prefix?: string;
  /**
   * Group by app name (appname-platform) instead of the default (platform-appname)
   */
  groupByName?: boolean;
  /**
   * Set this app up as a sandbox for the workspace
   */
  setupSandbox?: boolean;
  /**
   * Skip installing dependencies
   */
  skipInstall?: boolean;
  /**
   * Add {N} CLI to devDependencies
   */
  addCliDependency?: boolean;
}
