export interface Schema {
  name: string;
  /**
   * Target feature
   */
  feature?: string;
  /**
   * Target apps
   */
  projects?: string;
  /**
   * Target platforms
   */
  platforms?: string;
  /**
   * Schematic processing helpers
   */
  needsIndex?: boolean;
  /**
   * Skip formatting
   */
  skipFormat?: boolean;
}
