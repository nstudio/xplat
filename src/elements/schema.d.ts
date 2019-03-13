export interface Schema {
  name: string;
  /**
   * The barrel in your workspace that contains the components you'd like to create as custom elements.
   */
  barrel: string;
  /**
   * Comma delimited list of components from your barrel to create as custom elements.
   */
  components: string;
  /**
   * Skip creating the app files to preview your built custom elements.
   */
  skipPreviewApp?: boolean;
  /**
   * A unique prefix to add to each custom element. Defaults to provided component selectors 'as is'.
   */
  prefix?: string;
  /**
   * Skip formatting
   */
  skipFormat?: boolean;
  
}
