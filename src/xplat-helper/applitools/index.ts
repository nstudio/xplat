import { Schema as HelperOptions } from "../schema";
import { isTesting } from "../../utils";

export * from './web/support';

export function applitools_logNote(options: HelperOptions) {
  if (!isTesting()) {
    console.log(`Applitools support added for: ${options.target}`);
    console.log(`Ensure your APPLITOOLS_API_KEY environment variable is set: https://applitools.com/tutorials/cypress.html#step-by-step-guide-run-the-demo-app`);
  }
}