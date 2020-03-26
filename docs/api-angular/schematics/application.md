# application

Create an Angular app.

## Usage

```bash
nx generate application ...

```

## Options

### --directory

Type: `string`

The directory of the new app.

### --e2eTestRunner

Default: `cypress`

Type: `string`

Test runner to use for end to end (e2e) tests

### --enableIvy

Default: `false`

Type: `boolean`

Use the Ivy rendering engine.

### --groupByName

Default: `false`

Type: `boolean`

Group by app name (appname-platform) instead of the default (platform-appname).

### --inlineStyle

Alias(es): s

Default: `false`

Type: `boolean`

Specifies if the style will be in the ts file.

### --inlineTemplate

Alias(es): t

Default: `false`

Type: `boolean`

Specifies if the template will be in the ts file.

### --name

Type: `string`

The name of the application.

### --prefix

Alias(es): p

Type: `string`

The prefix to apply to generated selectors.

### --routing

Default: `false`

Type: `boolean`

Generates a routing module.

### --skipFormat

Default: `false`

Type: `boolean`

Skip formatting files

### --skipPackageJson

Default: `false`

Type: `boolean`

Do not add dependencies to package.json.

### --skipTests

Alias(es): S

Default: `false`

Type: `boolean`

Skip creating spec files.

### --style

Default: `css`

Type: `string`

The file extension to be used for style files.

### --tags

Type: `string`

Add tags to the application (used for linting)

### --unitTestRunner

Default: `jest`

Type: `string`

Test runner to use for unit tests

### --useXplat

Default: `true`

Type: `boolean`

Generate xplat supporting architecture

### --viewEncapsulation

Type: `string`

Specifies the view encapsulation strategy.
