import {
  ensureProject,
  uniq,
  generateXplatArchitecture,
  EPlatform,
  generateApp,
  runE2e
} from "../utils";

describe("web e2e", () => {
  beforeEach(() => {
    ensureProject();
    generateXplatArchitecture(EPlatform.Web);
  });

  it("should pass protractor tests", () => {
    const webapp = uniq("web");

    expect(generateApp(EPlatform.Web, webapp, "--addHeadlessE2e")).toBeTruthy();
    expect(runE2e(webapp, "--configuration=ci")).toBeTruthy();
  });

  it("should pass cypress tests", () => {
    const webapp = uniq("web");

    expect(generateApp(EPlatform.Web, webapp, "--addHeadlessE2e --e2eTestRunner cypress")).toBeTruthy();
    expect(runE2e(webapp, "--headless")).toBeTruthy();
  });
});
