# application

Add applications.

## Usage

```bash
nx generate application ...

```

## Options

### --framework

Type: `string`

Frontend framework.

### --groupByName

Default: `false`

Type: `boolean`

Group by app name (appname-platform) instead of the default (platform-appname)

### --name

Alias(es): n

Type: `string`

The name of the app.

### --npmScope

Alias(es): wn

Type: `string`

The npm scope to use.

### --platforms

Type: `string`

Platforms.

### --prefix

Alias(es): p

Type: `string`

The prefix to apply to generated selectors.

### --routing

Default: `true`

Type: `boolean`

Use root routing module.

### --setupSandbox

Default: `false`

Type: `boolean`

Setup app as a sandbox for the workspace.

### --skipInstall

Default: `false`

Type: `boolean`

Skip installing dependencies.

### --target

Type: `string`

The target to use with this generator.

### --useXplat

Type: `boolean`

Generate xplat supporting architecture
