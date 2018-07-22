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
   * Only generate for specified projects and ignore shared code
   */
  onlyProject?: boolean;
  /**
   * Target platforms 
   */
  platforms?: string;
  /**
   * Ignore base component generation
   */
  ignoreBase?: boolean;
  /**
   * Schematic processing helpers
   */
  needsIndex?: boolean;
  /**
   * Skip formatting
   */
  skipFormat?: boolean;
  
}
