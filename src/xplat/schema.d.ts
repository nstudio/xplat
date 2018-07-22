export interface Schema {
  /**
   * Target platforms
   */
  platforms?: string;
  /**
   * npm scope - auto detected from nx.json but can specify your own name
   */
  npmScope?: string;
  /**
   * The prefix to apply to generated selectors.
   */
  prefix?: string;
  /**
   * Only if not present yet
   */
  onlyIfNone?: boolean;
  /**
   * Use sample feature setup
   */
  sample?: boolean;
  /**
   * Skip formatting
   */
  skipFormat?: boolean;
}
