## Want to help?

We greatly appreciate your help! You will be attributed to the contributor list and from our team to yours we love you.

## Building and testing locally

Try using `yarn` with: `brew install yarn`

After cloning the project:

```
yarn install
```

You can publish the schematic locally to test against any Nx workspace using [verdaccio](https://www.npmjs.com/package/verdaccio):

```
yarn global add verdaccio

// Then open a new tab and start the private local npm registry:
verdaccio
```

1. Publish the schematic to `verdaccio` with the following:

```
yarn build
yarn publish-local
```

2. Setup a fresh Nx workspace to test with:

```
yarn create-nx-test myworkspace
```

This will setup a fresh Nx workspace at `tmp/myworkspace` and auto open in VS Code. It will already be preconfigured to install @nstudio/xplat tools from a local build.

3. You can now install your schematic changes with:

```
rm -rf node_modules/@nstudio
ng add @nstudio/xplat
```

Anytime you make further changes to the schematic just rebuild/republish:

```
yarn build
// unpublish
yarn publish-local unpublish
// republish
yarn publish-local
```

### Unit Tests

```
yarn test
```

All tests must pass. Please add tests for any new functionality.

### Debugging Tests

Use path to a specific test along with `debug` to start node debug session.
You can then open Google Chrome browser to `chrome://inspect/#devices` to see the Remote Target listed. Choose `Inspect` to open Chrome debugger tools. You can use `debugger;` statements throughout code to create breakpoints.

```
yarn test angular/src/schematics/application/index debug
```

## Pull Requests

Please follow the following guidelines:

- Make sure unit tests pass
- Update your commit message to follow the guidelines below

### Commit Message Guidelines

Commit message should follow the following format:

```
type(scope): subject
BLANK LINE
body
```

#### Type

The type must be one of the following:

- build
- feat
- fix
- refactor
- style
- docs
- test
- chore

#### Scope

The scope must be one of the following:

- generators
- scripts
- angular
- electron
- ionic
- nativescript
- web
- elements
- helpers
- react
- vue
- build
- changelog
- contributing

#### Subject

The subject must contain a description of the change.

#### Example

```
feat(vue): application generator

`ng g @nstudio/vue:app myapp` adds a vue app
```

## Migrations

If you are introducing a change that would require the users to upgrade their workspace, add a migration to the appropriate package.

Migrations are named in the following fashion: `update-major-minor-patch.ts` (e.g., update-8-0-1.ts) which would be a migration for version 8.0.1. Always follow semantic versioning when introducing changes. If your changes would introduce a breaking change then bump to next major version.
