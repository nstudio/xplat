import { supportedHelpers, stringUtils } from './general';
import { supportedPlatforms, supportedFrameworks } from '@nstudio/xplat-utils';

export const errorMissingPrefix = `Missing --prefix flag. It's a good practice to specify a 2-3 character prefix for use with your project's component selectors and certain shared class/module names. Example: nx g @nstudio/xplat:init --prefix=foo`;

export const errorXplat = `You have the xplat tools installed but have yet to generate it. Before generating apps you should generate xplat first. Example: nx g @nstudio/xplat:init --prefix=foo`;

export function unsupportedPlatformError(platform: string) {
  return `${platform} is currently not a supported platform. Supported at the moment: ${supportedPlatforms}. Please request support for this platform if you'd like and/or submit a PR which we would greatly appreciate.`;
}

export function unsupportedPlatformErrorWithNxNote(
  platform: string,
  generator: string
) {
  return `"${platform}" in xplat currently does not support the "${generator}" generator. However it would be awesome to have a "${generator}" generator for "${platform}". Please add an issue to https://github.com/nstudio/xplat/issues with some details of how you'd like it to work for "${platform}" and we'll look into adding to a future release.`;
}

export function noXplatLayerNote(platform: string) {
  return `Generating "${platform}" app in your workspace. Just so you know, "${platform}" does not have an xplat supporting architecture layer yet. If you'd like to see "${platform}" with an xplat layer in future, please add an issue to https://github.com/nstudio/xplat/issues with some details of how you'd like it to work and we'll look into adding to a future release.`;
}

export function unsupportedFrameworkError(framework: string) {
  return `${framework} is currently not a supported framework. Supported at the moment: ${supportedFrameworks.map(
    (f) => stringUtils.capitalize(f)
  )}. Please request support for this framework if you'd like and/or submit a PR which we would greatly appreciate.`;
}

export function unsupportedHelperError(helper: string) {
  return `${helper} is not a supported helper. Currently supported: ${supportedHelpers}`;
}

export function helperTargetError(helper: string) {
  return `The helper "${helper}" requires the --target flag.`;
}

export function helperMissingPlatforms() {
  return `Missing platforms argument. Example: nx g @nstudio/xplat:helpers imports --platforms=nativescript`;
}

export function missingArgument(
  argName: string,
  description: string = '',
  example: string = ''
) {
  return `Missing ${argName} argument. ${description} ${
    example ? 'Example: ' + example : ''
  }`;
}

export function noPlatformError() {
  return `You must specify which platforms you wish to generate support for. For example: nx g @nstudio/xplat:init --prefix=foo --platforms=${supportedPlatforms.join(
    ','
  )}`;
}

export function platformAppPrefixError() {
  return `Normally a platform identifier prefixes the project name in xplat. It's possible you may not have generated your app with xplat tools. Please generate your app with xplat or prefix your app's name with the platform it's intended for. For example: web-viewer, nativescript-viewer, ionic-viewer, etc.`;
}

export function generatorError(type: string) {
  return `If this is a project/app specific ${type}, please specify project names to generate the ${type} for with --projects=name,name2,etc. If you want to generate the ${type} for use across many projects/apps, just specify the platforms you wish to build the ${type} for with --platforms=web,nativescript,etc.${
    type !== 'feature'
      ? ' and the feature you want them a part of with --feature=foo'
      : ''
  }`;
}

export function generateOptionError(type: string, missingFeature?: boolean) {
  const exampleCommand = `nx g ${type} my-${type} --feature=foo --platforms=web,nativescript`;
  if (missingFeature) {
    return `You did not specify the name of the feature you'd like your ${type} to be a part of. For example: ${exampleCommand}`;
  } else {
    return `You did not specify the name of the ${type} you'd like to generate. For example: ${exampleCommand}`;
  }
}

export function needFeatureModuleError(
  modulePath: string,
  featureName: string,
  optionName: string,
  isOnlyProject?: boolean
) {
  // let platforms = '';
  if (optionName) {
    // const optionParts = optionName.split('-');
    // platforms =
    optionName = ` ${
      isOnlyProject ? '--projects=' : '--platforms='
    }${optionName} --onlyModule`;
  } else {
    optionName = '';
  }
  return `${modulePath} does not exist. Create the feature module first. For example: nx g @nstudio/angular:feature ${featureName}${optionName}`;
}

export function optionsMissingError(error: string) {
  return `Options missing. ${error} Currently supported platforms: ${supportedPlatforms}`;
}

export function noteAboutXplatSetupWithFramework(
  framework: string,
  platform: string
) {
  return `You currently have "${framework}" set as your default frontend framework and have already generated xplat support for "${platform}". A command is coming soon to auto reconfigure your workspace to later add baseline platform support for those which have previously been generated prepaired with a frontend framework.`;
}
