export interface Schema {
    /**
     * Comma-delimited list of helpers to generate.
     */
    name: string;
    /**
     * Target platforms to generate helpers for.
     */
    platforms?: string;
    /**
     * Optional target when adding helpers
     */
    target?: string;
    /**
     * Skip refactoring code to support the helper where supported.
     * TODO
     *     "skipRefactor": {
      "type": "boolean",
      "description": "Skip refactoring code to support the helper where supported.",
      "default": false
    }
     */
    // skipRefactor?: boolean;
}
