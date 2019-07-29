export interface Schema {
  /**
   * The name of the app.
   */
  name: string;
  directory?: string;
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
   * Use root routing file
   */
  routing?: boolean;
  /**
   * Set this app up as a sandbox for the workspace
   */
  setupSandbox?: boolean;
  /**
   * Generate xplat supporting architecture
   */
  useXplat?: boolean;
  /**
   * Skip installing dependencies
   */
  skipInstall?: boolean;
  /**
   * Add {N} CLI to devDependencies
   */
  addCliDependency?: boolean;
}
