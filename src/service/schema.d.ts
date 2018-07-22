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
   * Skip formatting
   */
  skipFormat?: boolean;
}
