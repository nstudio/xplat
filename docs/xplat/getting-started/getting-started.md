# Getting Started

Everything starts with a [Nx workspace](https://nx.dev).

```bash
npx create-nx-workspace myworkspace
```

**Note:** We recommend the following options when creating your Nx workspace:

- Choose `Apps` preset
- Use `Nx` cli

We find this provides opportunities for broader use cases while also allowing you to setup your workspace the way you want which may include using `xplat` app generators (which we'll install in a moment) which leverage those from Nx however enhances a few to work best for xplat tooling.

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

# Generate supporting architecture

After installing xplat tools, your default schematic collection should now be set to `@nstudio/xplat`.

The most common use case is to use the supporting xplat architecture. Initialize your workspace with the platforms you intend to develop apps with:

```
nx g init
```

You will be prompted for which platforms to generate support for. You can optionally pass a collection of platforms:

```
nx g init --platforms web,nativescript
```

# Generate apps

```
nx g app
```

**Note:** If you're using an Nx workspace with any angular presets you may need to replace `nx` with `ng`. This also applies to the `nx serve appname` step.

Follow the prompts to generate the type of app you'd like:

<img src="assets/img/xplat-api-app-gen.gif">

If you would like to set your default schematics to anything other than `@nstudio/xplat` you can always execute app generators via the more verbose style:

```
nx g @nstudio/xplat:app
```

## Serving Application

Run `nx serve appname` to serve the newly generated application!
