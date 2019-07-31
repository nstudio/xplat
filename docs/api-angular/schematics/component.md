# component

Create a component configured for xplat projects and shared code.

## Usage

```bash
nx generate component ...

```

## Options

### --createBase

Default: `false`

Type: `boolean`

Create a base component for maximum cross platform sharing.

### --feature

Type: `string`

Target feature. Default is 'ui' if none specified.

### --name

Type: `string`

Component name

### --onlyProject

Default: `false`

Type: `boolean`

Generate for specified projects only and ignore shared code.

### --platforms

Type: `string`

Target platforms

### --projects

Type: `string`

Target projects

### --skipFormat

Default: `false`

Type: `boolean`

Skip formatting files

### --subFolder

Type: `string`

Group it in a subfolder of the target feature.
