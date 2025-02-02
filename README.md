<h1 align="center">Cross-platform (xplat) tools for Nx workspaces</h1>
<p align="center"><img src="https://raw.githubusercontent.com/nstudio/xplat/master/xplat-logo.png" align="center" width="400"></p>
<div align="center">

[![License](https://img.shields.io/npm/l/@nstudio/schematics.svg?style=flat-square)]()
[![NPM Version](https://badge.fury.io/js/%40nstudio%2Fschematics.svg)](https://www.npmjs.com/@nstudio/schematics)

</div>
<hr>

**xplat** is an added value pack for [Nx](https://nrwl.io/nx) which provides additional app generators and optional supporting architecture for different platform/framework combinations.

## Currently supported platforms

- [Electron](https://electronjs.org/)
  > Build cross platform desktop apps with JavaScript, HTML, and CSS.
- [Ionic](https://ionicframework.com/)
  > Build amazing apps in one codebase, for any platform, with the web.
- [NativeScript](https://www.nativescript.org/)
  > Build rich iOS and Android apps with direct access to native api's from JavaScript directly.

## Quickstart

Note: Nx 19.x.x compatible.

```sh
npx create-nx-workspace@19

✔ Where would you like to create your workspace? · {your-workspace-name}

# Choose "None"

? Which stack do you want to use? … 
None:          Configures a minimal structure without specific frameworks or technologies.

# Choose "Integrated"

? Package-based or integrated? … 
Integrated:    Nx creates a workspace structure most suitable for building apps.
```

### Init workspace

Install the @nx/js plugin.

```sh
npm install @nx/js -D
```

Now initialize -- This will ensure a `tsconfig.base.json` is created to begin building your workspace.

```sh
npx nx g @nx/js:init
```

### Install the tools:

```
npm install @nstudio/xplat -D
```

You are now ready to create apps:

```
npx nx g @nstudio/xplat:app
```

## App generation examples

The additional app generators can be used as follows:

### Electron

Electron app generator can use any web app in the workspace as it's target.

If you don't have a web app yet, create one first:

```
npx nx g @nstudio/xplat:app sample
```

> choose `web`

You can now use the web app as the Electron target:

```
npx nx g @nstudio/xplat:app desktop --target=web-sample
```

> choose `electron`

Develop with:

```
npm run start.electron.desktop
```

### Ionic

```
npx nx g @nstudio/xplat:app sample
```

> choose `ionic`

Develop in browser with:

```
npx nx serve ionic-sample
```

Build Ionic app:

```
npx nx build ionic-sample
```

A. **Capacitor iOS** - Prepare for development

```
npm run prepare.ionic.sample.ios
```

You can now open in Xcode for further development:

```
npm run open.ionic.sample.ios
```

B. **Capacitor Android** - Prepare for development

```
npm run prepare.ionic.sample.android
```

You can now open in Android Studio for further development:

```
npm run open.ionic.sample.android
```

### NativeScript

```
nx g @nstudio/xplat:app mobile
```

> choose `nativescript`

A. **iOS**

```
npx nx run nativescript-mobile:ios
```

B. **Android**

```
npx nx run nativescript-mobile:android
```

## Talks

- [Super Powered, Server Rendered Progressive Native Apps](https://www.youtube.com/watch?v=EqqNexmu3Ug) by [Nathan Walker](http://github.com/NathanWalker) and [Jeff Whelpley](https://github.com/jeffwhelpley)
- [ngAir 172 - xplat (cross-platform) tools for Nx workspaces with Nathan Walker](https://www.youtube.com/watch?v=0I8D25nab5c)

## Recommended extra tooling

- [VS Code](https://code.visualstudio.com/)
- [Nx Console for VS Code](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console)

## Example repos for different scenarios

- Ionic + Web: https://github.com/nstudio/xplat-sample-ionic-web
- Electron + Web with routing: https://github.com/nstudio/xplat-sample-electron-routing

## Context

- [Why it's Hard to Decide on Technologies](https://medium.com/@adamklein_66511/why-its-hard-to-decide-on-technologies-9d67b6adf157) by [Adam Klein](https://github.com/adamkleingit)

