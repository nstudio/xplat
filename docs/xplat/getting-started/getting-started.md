# Getting Started

Everything starts with a [Nx workspace](https://nx.dev).

```bash
npx create-nx-workspace myworkspace
```

# Install Nrwl cli

Having Nrwl's cli installed globally will enhance usability of the tooling:

**Using `npm`**

```
npm install -g @nrwl/cli
```

**Using `yarn`**

```
yarn global add @nrwl/cli
```

# xplat install options

**Using `npm`**

```bash
npm install --save-dev @nstudio/xplat
```

**Using `yarn`**

```bash
yarn add --dev @nstudio/xplat
```

**If using Nx already configured with Angular preset**

```bash
ng add @nstudio/xplat
```

# Generate apps

After installing xplat tools, your default schematic collection should now be set to `@nstudio/xplat` allowing you to execute the following:

```
nx generate app
```

**Note:** If you're using an Nx workspace with any angular presets you may need to replace `nx` with `ng`. This also applies to the `nx serve appname` step.

Follow the prompts to generate the type of app you'd like:

<img src="assets/img/xplat-api-app-gen.gif">

If you would like to set your default schematics to anything other than `@nstudio/xplat` you can always execute app generators via the more verbose style:

```
nx generate @nstudio/xplat:app
```

## Serving Application

Run `nx serve appname` to serve the newly generated application!
