# xplat and Nx

xplat **is not** a replacement for Nx. It's a collection of cross platform tools which expand what you can do today within Nx. This includes various app generators for [Electron](https://electronjs.org/), [Ionic](https://ionicframework.com/) and [NativeScript](https://www.nativescript.org/). It also provides **optional** supporting architecture to accompany these various tech stacks with a proven scalable setup to jump start your development.

## How?

Nx is a concise and extensible setup for monorepo codebases. xplat provides a suite of schematics including app generators for platforms not currently supported directly in Nx as well as tooling to allow various platforms/framework combinations to work well together in a monorepo like Nx.

What does xplat add?

- [Electron](https://electronjs.org/) app generator
- [Ionic](https://ionicframework.com/) app generator
- [NativeScript](https://www.nativescript.org/) app generator

Each app generator can be used with or without a frontend framework. This means you could, for example:

- generate an Electron app targeting a purely web component based app or could use an Angular app.
- generate an Ionic app using Stencil with Capacitor or use Angular.
- generate a NativeScript app using a pure vanilla setup with `.xml` view files or with a frontend framework like Angular.
- and more...

In addition it adds _optional_ supporting architecture to provide a great starting base to scale a number of platform combinations.

Read the [fundamentals](/xplat/fundamentals/architecture) to learn more about the xplat supporting architecture layer.
