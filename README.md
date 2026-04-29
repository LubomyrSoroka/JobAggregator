# JobAggregator

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

### Lint with [ESLint](https://eslint.org/)

## Salary Estimation Logic

For consistent sorting across different salary types, JobHunter normalizes all values to a **Gross Yearly Equivalent**.

### Methodology
- **Hourly**: Calculated as `Rate × 2080`. This assumes a standard full-time workload of 40 hours per week for 52 weeks.
- **Weekly**: Calculated as `Rate × 52`.
- **Monthly**: Calculated as `Rate × 12`.

This approach provides a uniform benchmark for comparing jobs across varying payment structures, prioritizing total earning potential. 


### Debugging Scrapers

If the scraper is running on the background, you can find a file for the scraper's code by inspecting the extension 
For Firefox, go to about:debugging#/runtime/this-firefox and click on Inspect for the "Background Scraper" extension. Then, in the debug menu, you should find the scraper's code in the Debugger tab. The name of the file will be scraper-<scraper-name>.js.

Clicking on run should also make the file appear within the browser's dev tools, however, then it may be harder to set breakpoints before hand.

### Edting Scrapers

For easier editing, you should install the native-messaging component of this app (which requires the extension installed to use). To ensure native-messaging words, simply download native-messaging/install.cjs with node (e.g. if you are in that directory, then just write node install.cjs).

Without using native-messaging, the other approach would be to use an <input type="file"> to load the file in. You can then refersh it continously by clicking on button within the editor. However this approach has limitations: 
1. If you refresh the page after selecting the file, you will need to manually select it from the file picker.
2. When running scrapers, you cannot make them directly access the files (by using native messaging). With this approach, you will need to manually link the file again or copy and paste.
3. If you want to edit on the page itself, you would need to then either 1. copy-and-paste back to the original document or 2. Allow the user to download their code (which they can they use to overwrite the original file)

The obvious downside of the current approach is that it requires the user to install both the extension and native-messaging.

An alternative approach would be to use window.showOpenFilePicker. But this would only work on Google Chrome (and not Firefox). But, it wouldn't require the user to install anything.
