<h1 align="center">Cross-platform (xplat) tools for Nx workspaces</h1>
<p align="center"><img src="https://raw.githubusercontent.com/nstudio/xplat/master/xplat-logo.png" align="center" width="400"></p>
<div align="center">

[![Build Status](https://travis-ci.org/nstudio/xplat.svg?branch=master)](https://travis-ci.org/nstudio/xplat)
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

```
npx create-nx-workspace@latest
```

At the prompts:

> provide a name

> choose `empty`

```
npm i @nstudio/xplat -D
```

You are now ready to create apps:

```
nx g app
```

## App generation examples

The additional app generators can be used as follows:

### Electron

Electron app generator can use any web app in the workspace as it's target.

If you don't have a web app yet, create one first:

```
nx g app sample
```

> choose `web`

You can now use the web app as the Electron target:

```
nx g app desktop --target=web-sample
```

> choose `electron`

Develop with:

```
npm run start.electron.desktop
```

### Ionic

```
nx g app sample
```

> choose `ionic`

Develop in browser with:

```
nx serve ionic-sample
```

Build Ionic app:

```
nx build ionic-sample
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
nx g app mobile
```

> choose `nativescript`

A. **iOS**

```
nx run nativescript-mobile:ios
```

B. **Android**

```
nx run nativescript-mobile:android
```

## Documentation

- [Getting Started](https://nstudio.io/xplat/getting-started)
- [Fundamentals](https://nstudio.io/xplat/fundamentals)
- [API Documentation](https://nstudio.io/xplat/api)
- [Design Doc](https://t.co/z2lRxOBFAg)
- [Wiki](https://github.com/nstudio/xplat/wiki/FAQ)

## Talks

- [Super Powered, Server Rendered Progressive Native Apps](https://www.youtube.com/watch?v=EqqNexmu3Ug) by [Nathan Walker](http://github.com/NathanWalker) and [Jeff Whelpley](https://github.com/jeffwhelpley)
- [ngAir 172 - xplat (cross-platform) tools for Nx workspaces with Nathan Walker](https://www.youtube.com/watch?v=0I8D25nab5c)

## Recommended extra tooling

- [VS Code](https://code.visualstudio.com/)
- [Nx Console for VS Code](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console)

## Example repos for different scenarios

- Ionic + Web: https://github.com/nstudio/xplat-sample-ionic-web
- Electron + Web with routing: https://github.com/nstudio/xplat-sample-electron-routing

## Real world apps built with xplat

### Portable North Pole

- Web: https://www.portablenorthpole.com/en/home
- iOS: https://itunes.apple.com/us/app/id902026228?mt=8
- Android: https://play.google.com/store/apps/details?id=com.ugroupmedia.pnp14&hl=en

### My PreSonus

- Web: http://my.presonus.com/
- iOS: https://apps.apple.com/us/app/mypresonus/id1282534772
- Android: https://play.google.com/store/apps/details?id=com.presonus.mypresonus&hl=en_US

### Sweet

- Web: https://sweet.io/
- iOS: https://apps.apple.com/us/app/sweet/id1452120535
- Android: https://play.google.com/store/apps/details?id=io.sweet.app&hl=en_US

## Context

- [Why it's Hard to Decide on Technologies](https://medium.com/@adamklein_66511/why-its-hard-to-decide-on-technologies-9d67b6adf157) by [Adam Klein](https://github.com/adamkleingit)

## Contributing

Please see our [guidelines for contributing](https://github.com/nstudio/xplat/blob/master/CONTRIBUTING.md).

| [<img alt="NathanWalker" src="https://avatars.githubusercontent.com/u/457187?v=4&s=117" width="117">](https://github.com/NathanWalker) | [<img alt="dungahk" src="https://avatars.githubusercontent.com/u/10074819?v=4&s=117" width="117">](https://github.com/dungahk) | [<img alt="pegaltier" src="https://avatars.githubusercontent.com/u/2479323?v=4&s=117" width="117">](https://github.com/pegaltier) | [<img alt="m-abs" src="https://avatars.githubusercontent.com/u/1348705?v=4&s=117" width="117">](https://github.com/m-abs) | [<img alt="sr3dna" src="https://avatars.githubusercontent.com/u/15936818?v=4&s=117" width="117">](https://github.com/sr3dna) | [<img alt="mbaljeetsingh" src="https://avatars.githubusercontent.com/u/872762?v=4&s=117" width="117">](https://github.com/mbaljeetsingh) |
| :------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------: |
|                                            [NathanWalker](https://github.com/NathanWalker)                                             |                                             [dungahk](https://github.com/dungahk)                                              |                                             [pegaltier](https://github.com/pegaltier)                                             |                                             [m-abs](https://github.com/m-abs)                                             |                                             [sr3dna](https://github.com/sr3dna)                                              |                                            [mbaljeetsingh](https://github.com/mbaljeetsingh)                                             |

| [<img alt="dopsonbr" src="https://avatars.githubusercontent.com/u/5340660?v=4&s=117" width="117">](https://github.com/dopsonbr) | [<img alt="AgentEnder" src="https://avatars.githubusercontent.com/u/6933928?v=4&s=117" width="117">](https://github.com/AgentEnder) | [<img alt="davecoffin" src="https://avatars.githubusercontent.com/u/1245462?v=4&s=117" width="117">](https://github.com/davecoffin) | [<img alt="dmitryr117" src="https://avatars.githubusercontent.com/u/5959314?v=4&s=117" width="117">](https://github.com/dmitryr117) | [<img alt="kamilmysliwiec" src="https://avatars.githubusercontent.com/u/23244943?v=4&s=117" width="117">](https://github.com/kamilmysliwiec) | [<img alt="madmath03" src="https://avatars.githubusercontent.com/u/6967675?v=4&s=117" width="117">](https://github.com/madmath03) |
| :-----------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------: |
|                                             [dopsonbr](https://github.com/dopsonbr)                                             |                                             [AgentEnder](https://github.com/AgentEnder)                                             |                                             [davecoffin](https://github.com/davecoffin)                                             |                                             [dmitryr117](https://github.com/dmitryr117)                                             |                                             [kamilmysliwiec](https://github.com/kamilmysliwiec)                                              |                                             [madmath03](https://github.com/madmath03)                                             |

| [<img alt="miguelramos" src="https://avatars.githubusercontent.com/u/495720?v=4&s=117" width="117">](https://github.com/miguelramos) | [<img alt="n0mer" src="https://avatars.githubusercontent.com/u/1862997?v=4&s=117" width="117">](https://github.com/n0mer) |
| :----------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------: |
|                                            [miguelramos](https://github.com/miguelramos)                                             |                                             [n0mer](https://github.com/n0mer)                                             |
