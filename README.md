# FLAT MONEY

React + TypeScript + Vite app.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Deployment to GitHub Pages

This repo is configured to deploy the Vite build to GitHub Pages using GitHub Actions.

How to enable:
- In GitHub, go to Settings → Pages.
- Set Source to GitHub Actions.
- Push to the default branch (main or master). The workflow .github/workflows/deploy.yml will build and deploy.

Notes:
- Vite base is configured for production to use relative paths (./), which works on project pages.
- A 404.html is included to support SPA routes.
- A .nojekyll file is published to disable Jekyll processing.

### Troubleshooting
- If you see in the Actions log: "Canceling since a higher priority waiting request for pages exists", it means another (newer) Pages deployment was queued and this one was canceled. This is expected with Pages concurrency. Simply wait for the latest workflow run to finish. Pushing multiple commits quickly will cancel older runs in favor of the newest.
- The workflow is configured to cancel older in-progress runs automatically (concurrency: group: pages, cancel-in-progress: true). This helps ensure the latest commit deploys. If a run gets canceled, there is nothing to fix; just check the most recent run.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
