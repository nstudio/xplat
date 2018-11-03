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
     * Whether to create xplat structure
     */
    xplat?: boolean;
    /**
     * The prefix to apply to generated selectors.
     */
    prefix?: string;
    /**
     * Use sample feature setup
     */
    sample?: boolean;
    /**
     * Skip installing dependencies
     */
    skipInstall?: boolean;
}
