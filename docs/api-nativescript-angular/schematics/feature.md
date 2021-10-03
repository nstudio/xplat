# feature [hidden]

Create a NativeScript Angular feature module configured for xplat projects and shared code.

## Usage

```bash
nx generate feature ...

```

## Options

### --adjustSandbox

Default: `false`

Type: `boolean`

Automatically add a button to link to the feature route. Supported on NativeScript only right now. Requires flags: --onlyProject --routing

### --createBase

Default: `false`

Type: `boolean`

Create base component for maximum code sharing.

### --directory

Type: `string`

Create this feature within a directory inside the features area.

### --name

Type: `string`

Feature name

### --onlyModule

Default: `false`

Type: `boolean`

Generate just the module and ignore the default component.

### --onlyProject

Default: `false`

Type: `boolean`

Generate for specified projects only and ignore shared code.

### --projects

Type: `string`

Project names

### --routing

Default: `false`

Type: `boolean`

Whether to generate routing support or not (Only when used with --onlyProject).

### --skipFormat

Default: `false`

Type: `boolean`

Skip formatting files
