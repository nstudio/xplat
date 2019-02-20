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
     * Skip refactoring code to support the helper where supported.
     */
    skipRefactor?: boolean;
}
