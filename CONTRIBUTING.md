## Want to help?

We greatly appreciate your help! You will be attributed to the contributor list and from our team to yours we love you.

## Building and testing locally

After cloning the project: 

```
npm i --ignore-scripts
```

You can publish the schematic locally to test against any Nx workspace using [verdaccio](https://www.npmjs.com/package/verdaccio):

```
npm i -g verdaccio
verdaccio  // to start the private local npm registry
```

1. Publish the schematic to `verdaccio` with the following:

```
npm run build
npm publish --registry http://localhost:4873
```

2. Setup a fresh Nx workspace to test with:

```
create-nx-workspace myworkspace
```

3. Open the workspace and add `.npmrc` to root with the following:

```
@nstudio:registry=http://localhost:4873
```

4. You can now install your schematic changes with:

```
npm i @nstudio/schematics -D --registry http://localhost:4873 --force
```

Anytime you make further changes to the schematic just rebuild/republish:

```
npm run build
npm publish --registry http://localhost:4873
// then repeat Step #4 to install latest 
```

If you get this error:

```
npm ERR! code EPUBLISHCONFLICT
npm ERR! publish fail Cannot publish over existing version.
npm ERR! publish fail Update the 'version' field in package.json and try again.
npm ERR! publish fail 
npm ERR! publish fail To automatically increment version numbers, see:
npm ERR! publish fail     npm help version
```

You can simply unpublish and publish like this:

```
npm unpublish --registry http://localhost:4873 --force
npm publish --registry http://localhost:4873
```

### Unit Tests

```
npm test
```

All tests must pass. Please add tests for any new functionality.

## Pull Requests

Please follow the following guidelines:

* Make sure unit tests pass
* Update your commit message to follow the guidelines below

### Commit Message Guidelines

Commit message should follow the following format:

```
type(scope): subject
BLANK LINE
body
```

#### Type

The type must be one of the following:

* build
* feat
* fix
* refactor
* style
* docs
* test

#### Scope

The scope must be one of the following:

* generators
* admin
* scripts
* electron
* ionic
* nativescript
* nest
* elements
* helpers

#### Subject

The subject must contain a description of the change.

#### Example

```
feat(generators): add electron app 

`ng generate app.electron myapp` adds an electron app
```

## Migrations

If you are introducing a change that would require the users to upgrade their workspace, add a migration to `src/migrations`.

Migrations are named in the following fashion: `update-major-minor-patch.ts` (e.g., update-6-1-12.ts) which would be a migration for version 6.1.12. Always follow semantic versioning when introducing changes. If your changes would introduce a breaking change then bump to next major version.