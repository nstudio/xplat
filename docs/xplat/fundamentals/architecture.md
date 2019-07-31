# Fundamentals

Using xplat allows you to add [Electron](https://electronjs.org/), [Ionic](https://ionicframework.com/) and [NativeScript](https://www.nativescript.org/) apps into your Nx workspace. These apps can be paired with a frontend framework or not.

For instance, when you generate an [Ionic](https://ionicframework.com/) app with no framework it will add a [Stencil](https://stenciljs.com/) based app to your workspace. If Angular is chosen it will be preconfigured to work with Angular instead. All Ionic app flavors are preconfigured to work with [Capacitor](https://capacitor.ionicframework.com/) for mobile development.

When you generate a [NativeScript](https://www.nativescript.org/) app with no framework it will add a standard TypeScript based NativeScript app with `.xml` view files. However when paired with Angular as the frontend framework it will generate a [NativeScript for Angular](https://github.com/NativeScript/nativescript-angular).

All apps are generated with a xplat supporting architecture by default however **you can use the app generators standalone without the supporting layer** by adding the `--useXplat=false` flag to any of the generators.

## Supporting xplat architecture layer

In addition to adding extra app generators to Nx it also provides optional supporting architecture to help scale some of these tech stack combinations.

The xplat architecture layer presents an opinionated and proven scalable approach to mixing cross-platform development into your Nx workspace. This approach is broken down into primarily 4 conceptually focused areas which distill various common reusable patterns often found in wide variety of forms throughout a large majority of apps (no matter the language or deployment target):

- `core`: foundation layer required to the fundamental operation of the app.
- `features`: additive features which are often lazy loaded or simply not part of the app's main boot cycle.
- `scss`: the style layer providing opportunities to share style definitions across multiple apps in the workspace.
- `utils`: various handy/helpful utilities. Often a collection of pure functions however could be simply constants or any other utility helpful to the monorepo, it's libraries and apps.

Each area is similarly represented across different platform integrations and also represented in the lowest layer `libs` providing a consistent and predictable mental approach to building across a variety of platform/framework combinations. For example:

- _when needing_ to build http business rules (like header modifications, logging specifics for debugging requests/responses, or error handling rules) which generally all apps in the workspace need to use, you could build this in `libs/core` since most http handling could be built in a platform agnostic way. This effectively allows everything in the workspace to use the rules you engineer once across all platform layers.
- _when needing_ various data formatters, validators, date parsers and other utlities these could also be engineered once in `libs/utils`.
- _when needing_ various browser specific behavior like material, bootstrap or other web specific plugins those can be integrated in `xplat/web` since they are web specific.
- _when needing_ to build reusable Ionic components and services specific to Ionic api's those can be built in `xplat/ionic` since they are specific to Ionic.
- _when needing_ to integrate with NativeScript's api's like `Page`, `device`, `ImageSource` for iOS/Android development those can be built in `xplat/nativescript`.
- etc.

The xplat layer is intended to be mixed with any other Nx library building approach therefore you are not limited to sticking to just that approach. It's intended to be expanded and built aside and/or on top of.

## Getting the most out of the xplat layer

The xplat layer is intended to be focused purely on scaling the desired platforms you are mixing into Nx in a more predictable way. This approach provides advantages as the project scales over time by allowing team specialists to focus in on various platform target integrations via xplat's developer modes. In addition it provides opportunities to prototype or even pivot into entirely new directions while minimizing the fear/pain to do so by helping isolate platform concerns into respective areas rather than intertangled throughout the codebase.

Since the xplat layer is aimed at isolating platform concerns we have found that isolating `libs` to platform _agnostic_ code structures lends itself well to it's scalable design. This means that you can reserve `libs` for libraries that serve any of the apps in the workspace disregarding any platform specific behavior. This is often things like data handling (remote api integrations, http handling, etc.), state management, low level services and various structures that help faciliate the entire workspace development.

It is our hope that this layer helps give your team peace of mind in your monorepo development knowing that you are not building into a corner by helping to avoid platform entanglement.

## Generate xplat layer

To generate the xplat layer at anytime, run:

```bash
nx generate @nstudio/xplat:init
```

You can follow the prompts to add the layers you desire.

For example, running:

```
nx generate @nstudio/xplat:init --platforms web,nativescript
```

Will create the following:

```
<workspace name>/
├── README.md
├── apps/
├── libs
│   ├── core
│   │   ├── base/
│   │   ├── core.module.ts
│   │   ├── environments/
│   │   ├── index.ts
│   │   ├── models/
│   │   └── services/
│   ├── features
│   │   ├── index.ts
│   │   └── ui/
│   ├── scss
│   │   ├── _index.scss
│   │   ├── _variables.scss
│   │   └── package.json
│   └── utils
│       ├── angular.ts
│       ├── index.ts
│       ├── objects.ts
│       └── platform.ts
├── nx.json
├── package.json
├── references.d.ts
├── tools/
├── tsconfig.json
├── tslint.json
├── workspace.json
├── xplat
│   ├── nativescript
│   │   ├── core/
│   │   ├── features/
│   │   ├── index.ts
│   │   ├── plugins/
│   │   ├── scss/
│   │   └── utils/
│   └── web
│       ├── core/
│       ├── features/
│       ├── index.ts
│       └── scss/
```
