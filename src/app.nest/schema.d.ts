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
   * Skip installing dependencies
   */
  skipInstall?: boolean;
  /**
   * Skip formatting files
   */
  skipFormat?: boolean;
}
