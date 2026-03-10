# RealtimeKit UI

This is a monorepo for all of Cloudflare RealtimeKit UI packages.

Here is a short description for all the packages:

| Path                                             | Description                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| [`packages/core`](./packages/core)               | The main source code for all Stencil components. You will write code primarily in this directory. |
| [`packages/react`](./packages/react-library)     | The React UI Kit wrapper package                                                                  |
| [`packages/angular`](./packages/angular-library) | The Angular UI Kit wrapper package                                                                |
| [`packages/vue`](./packages/vue-library)         | The Vue UI Kit wrapper package                                                                    |

You can find some core documentation about UI Kit [here](./packages/core/docs).

## Running the UI Kit

```
npm run build
npm run dev
```

## Contributing

To get started, you need to first make changes in the `packages/core` directory.
You can find the code for each component in [packages/core/src/components](./packages/core/src/components).

You need to `cd` into `packages/core` directory and run `npm start`.

After your changes are made, you need to `cd` to the root and then run `npm run build`, so that the wrapper code also gets updated.

Take a look at out [contributing guidelines](./CONTRIBUTING.md) before you start contributing!
