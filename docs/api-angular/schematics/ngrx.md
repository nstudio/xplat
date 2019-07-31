# ngrx

Create a ngrx store.

## Usage

```bash
nx generate ngrx ...

```

## Options

### --feature

Type: `string`

Generate inside and attach to target feature.

### --module

Alias(es): m

Type: `string`

Allows specification of the declaring module.

### --name

Type: `string`

State name

### --platforms

Type: `string`

If you need platform specific state you can specify them here. By default state is generated in /libs since it often is ordinarily platform agnostic.

### --projects

Type: `string`

Generate only for specified target projects.

### --root

Default: `false`

Type: `boolean`

Flag to setup the root state or feature state.

### --skipFormat

Default: `false`

Type: `boolean`

Skip formatting files
