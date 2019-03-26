import { supportedPlatforms, supportedHelpers } from './general';

export const errorMissingPrefix = `Missing --prefix flag. It's a good practice to specify a 2-3 character prefix for use with your project's component selectors and certain shared class/module names. Example: ng g xplat --prefix=foo`;

export const errorXplat = `You have the xplat tools installed but have yet to generate it. Before generating apps you should generate xplat first. Example: ng g xplat --prefix=foo`;

export function unsupportedPlatformError(platform: string) {
  return `${platform} is not a supported platform. Currently supported: ${supportedPlatforms}`
}

export function unsupportedHelperError(helper: string) {
  return `${helper} is not a supported helper. Currently supported: ${supportedHelpers}`
}

export function helperTargetError(helper: string) {
  return `The xplat-helper "${helper}" requires the --target flag.`
}

export function helperMissingPlatforms() {
  return `Missing platforms argument. Example: ng g xplat-helper imports --platforms=nativescript`;
}

export function missingArgument(argName: string, description: string = '', example: string = '') {
  return `Missing ${argName} argument. ${description} ${example ? 'Example: ' + example : ''}`;
}

export function noPlatformError() {
  return `You must specify which platforms you wish to generate support for. For example: ng g xplat --prefix=foo --platforms=${supportedPlatforms.join(',')}`
}

export function platformAppPrefixError() {
  return `Normally a platform identifier prefixes the project name in xplat. It's possible you may not have generated your app with xplat tools. Please generate your app with xplat or prefix your app's name with the platform it's intended for. For example: web-viewer, nativescript-viewer, ionic-viewer, etc.`
}

export function generatorError(type: string) {
  return `If this is a project/app specific ${type}, please specify project names to generate the ${type} for with --projects=name,name2,etc. If you want to generate the ${type} for use across many projects/apps, just specify the platforms you wish to build the ${type} for with --platforms=web,nativescript,etc.${type !== 'feature' ? ' and the feature you want them a part of with --feature=foo' : ''}`;
}

export function generateOptionError(type: string, missingFeature?: boolean) {
  const exampleCommand = `ng g ${type} my-${type} --feature=foo --platforms=web,nativescript`;
  if (missingFeature) {
    return `You did not specify the name of the feature you'd like your ${type} to be a part of. For example: ${exampleCommand}`;
  } else {
    return `You did not specify the name of the ${type} you'd like to generate. For example: ${exampleCommand}`;
  }
}

export function needFeatureModuleError(modulePath: string, featureName: string, optionName: string, isOnlyProject?: boolean) {
  if (optionName) {
    optionName = ` ${isOnlyProject ? '--projects=' : '--platforms='}${optionName} --onlyModule`;
  } else {
    optionName = '';
  }
  return `${modulePath} does not exist. Create the feature module first. For example: ng g feature ${featureName}${optionName}`;
}

export function optionsMissingError(error: string) {
  return `Options missing. ${error} Currently supported platforms: ${supportedPlatforms}`;
}