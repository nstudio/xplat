import { statSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { ensureDirSync } from "fs-extra";
import * as path from "path";

export enum EPlatform {
  Web = 1,
  NativeScript = 2,
  Ionic = 4,
  Electron = 8,
  Nest = 16
}

const projectName: string = "proj";

export function uniq(prefix: string) {
  return `${prefix}${Math.floor(Math.random() * 10000000)}`;
}

export function runCLI(
  command?: string,
  opts = {
    silenceError: false
  }
): string {
  try {
    console.log("Running ng", command);
    return execSync(`./node_modules/.bin/ng ${command}`, {
      cwd: `./tmp/${projectName}`
    })
      .toString()
      .replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        ""
      );
  } catch (e) {
    if (opts.silenceError) {
      return e.stdout.toString();
    } else {
      console.log(e.stdout.toString(), e.stderr.toString());
      throw e;
    }
  }
}

export function directoryExists(filePath: string): boolean {
  try {
    return statSync(filePath).isDirectory();
  } catch (err) {
    return false;
  }
}

export function cleanup() {
  execSync(`rm -rf ./tmp/${projectName}`);
}

export function runNgNew(command?: string, silent?: boolean): string {
  const buffer = execSync(
    `../node_modules/.bin/ng new ${projectName} --no-interactive ${command}`,
    {
      cwd: `./tmp`,
      ...(silent ? { stdio: ["ignore", "ignore", "ignore"] } : {})
    }
  );
  return buffer ? buffer.toString() : null;
}

function copyNodeModule(path: string, name: string) {
  execSync(`rm -rf tmp/${path}/node_modules/${name}`);
  execSync(`cp -a node_modules/${name} tmp/${path}/node_modules/${name}`);
}

export function getCwd(): string {
  return process.cwd();
}

export function updateFile(f: string, content: string): void {
  ensureDirSync(path.dirname(path.join(getCwd(), "tmp", projectName, f)));
  writeFileSync(path.join(getCwd(), "tmp", projectName, f), content);
}

function publishXplatPackage() {
  execSync("npm pack");
}

function installXplatPackage() {
  execSync(
    "npm i ../../nstudio-schematics-$(fx ../../package.json .version).tgz",
    {
      cwd: `./tmp/${projectName}`
    }
  );
}

function npmInstall() {
  execSync("npm i", {
    cwd: `./tmp/${projectName}`
  });
}

export function newProject(): void {
  cleanup();
  if (!directoryExists(`./tmp/${projectName}_backup`)) {
    runNgNew(`--collection=@nrwl/schematics --npmScope=${projectName}`, true);
    npmInstall();
    execSync(`mv ./tmp/${projectName} ./tmp/${projectName}_backup`);
  }
  execSync(`cp -a ./tmp/${projectName}_backup ./tmp/${projectName}`);
}

function isPlatform(platforms: EPlatform, platform: EPlatform) {
  return platforms & platform;
}

export function generateXplatArchitecture(platforms: EPlatform) {
  publishXplatPackage();
  installXplatPackage();
  const platformsArg = `--platforms=${
    isPlatform(platforms, EPlatform.Web) ? "web," : ""
  }${isPlatform(platforms, EPlatform.NativeScript) ? "nativescript," : ""}${
    isPlatform(platforms, EPlatform.Ionic) ? "ionic," : ""
  }${isPlatform(platforms, EPlatform.Electron) ? "electron," : ""}${
    isPlatform(platforms, EPlatform.Nest) ? "nest," : ""
  }`;

  const cmd = `generate xplat --prefix=${projectName} ${platformsArg}`;
  return runCLI(cmd);
}

function getPlatformId(platform: EPlatform) {
  switch (platform) {
    case EPlatform.NativeScript:
      return "nativescript";
    case EPlatform.Ionic:
      return "ionic";
    case EPlatform.Electron:
      return "electron";
    case EPlatform.Nest:
      return "nest";
    default:
      return "";
  }
}

export function generateApp(platform: EPlatform, appName: string, args = "") {
  const plat = getPlatformId(platform);
  const cmd = `generate app${plat ? "." + plat : ""} ${appName} ${args}`;
  return runCLI(cmd);
}

function getPlatformName(appName: string, platform: EPlatform, e2e = false) {
  const plat = getPlatformId(platform);
  return `${plat || "web"}-${appName}${e2e ? "-e2e" : ""}`;
}

export function runE2e(appName: string, args = "") {
  const cmd = `e2e ${getPlatformName(appName, EPlatform.Web, true)} ${args}`;
  return runCLI(cmd);
}

export function ensureProject(): void {
  if (!directoryExists(`./tmp/${projectName}`)) {
    newProject();
  }
}
