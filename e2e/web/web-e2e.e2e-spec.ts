import {
  ensureProject,
  uniq,
  generateXplatArchitecture,
  EPlatform,
  generateApp,
  runE2e
} from "../utils";

describe("web e2e", () => {
  it("should pass protractor tests", () => {
    ensureProject();
    const webapp = uniq("web");

    expect(generateXplatArchitecture(EPlatform.Web)).toBeTruthy();
    expect(generateApp(EPlatform.Web, webapp, "--addHeadlessE2e")).toBeTruthy();
    expect(runE2e(webapp, "ci")).toBeTruthy();
  });
});
