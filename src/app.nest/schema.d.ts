export interface Schema {
  /**
   * The name of the app.
   */
  name: string;
  /**
   * Group by app name (appname-platform) instead of the default (platform-appname)
   */
  groupByName?: boolean;
  /**
   * npm scope - auto detected from nx.json but can specify your own name
   */
  npmScope?: string;
  /**
   * Skip installing dependencies
   */
  skipInstall?: boolean;
  /**
   * Skip formatting files
   */
  skipFormat?: boolean;
  /**
   * Add project to angular.json
   */
  angularJson?: boolean;
}
