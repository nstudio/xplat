# elements

Create custom elements for the web with Angular.

## Usage

```bash
ng generate elements ...

```

## Options

### barrel

Type: `string`

The barrel in your workspace that contains the components you'd like to create as custom elements.

### builderModule

Type: `string`

Update builder files to use a different Angular Element module. Used in isolation with no other options.

### components

Type: `string`

Comma delimited list of components from your barrel to create as custom elements.

### name

Type: `string`

The name of the custom element module.

### prefix

Type: `string`

A unique prefix to add to each custom element. Defaults to workspace selector setting.

### skipFormat

Default: `false`

Type: `boolean`

Skip formatting files
