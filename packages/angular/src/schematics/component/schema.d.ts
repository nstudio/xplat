export interface Schema {
  name: string;
  /**
   * Target feature. Default is 'ui' if none specified.
   */
  feature?: string;
  /**
   * Group it in a subfolder of the target feature
   */
  subFolder?: string;
  /**
   * Target apps
   */
  projects?: string;
  /**
   * Only generate for specified projects and ignore shared code
   */
  onlyProject?: boolean;
  /**
   * Target platforms
   */
  platforms?: string;
  /**
   * Create a base component for maximum cross platform sharing
   */
  createBase?: boolean;
  /**
   * Schematic processing helpers
   */
  needsIndex?: boolean;
  /**
   * Skip formatting
   */
  skipFormat?: boolean;
}
