## NativeScript custom plugins

Place custom plugins here.

Common use case are `.tgz` npm packed plugins however any custom plugin you create can go here and can be installed into your {N} app targets or in root of workspace if being shared across multiple {N} app targets.

Example in root of workspace `package.json`:

```
"nativescript-custom-plugin": "file:xplat/nativescript/plugins/nativescript-custom-plugin-1.0.0.tgz",
```

This can then be installed/consumed in any NativeScript app target with the following in (for example) `apps/nativescript-sample/package.json`:

```
"nativescript-custom-plugin": "file:../../node_modules/nativescript-custom-plugin",
```