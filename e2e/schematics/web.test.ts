import {
  ensureProject,
  uniq,
  generateXplatArchitecture,
  EPlatform,
  generateApp,
  runE2e,
  npmInstall
} from '../utils';

describe('web e2e', () => {
  beforeEach(() => {
    ensureProject();
    generateXplatArchitecture(EPlatform.Web);
  });

  it('should pass protractor tests', () => {
    const webapp = uniq('web');

    expect(
      generateApp(
        EPlatform.Web,
        webapp,
        '--addHeadlessE2e --framework=angular --style=scss --unit-test-runner karma --e2eTestRunner protractor'
      )
    ).toBeTruthy();
    expect(npmInstall()).toBeTruthy();
    expect(runE2e(webapp, '--configuration=ci')).toBeTruthy();
  });

  it('should pass cypress tests', () => {
    const webapp = uniq('web');

    expect(
      generateApp(
        EPlatform.Web,
        webapp,
        '--addHeadlessE2e --e2eTestRunner cypress'
      )
    ).toBeTruthy();
    expect(npmInstall()).toBeTruthy();
    expect(runE2e(webapp, '--headless')).toBeTruthy();
  });
});
