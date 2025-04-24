# Flats Money

A React application for managing apartment buildings, floors, and payments.

## Features

- Manage buildings, floors, and apartments
- Track payments and deposits
- Generate reports

## Technologies

- React 19
- TypeScript
- Vite
- Docker
- GitHub Actions for CI/CD

## Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions. When you push to the main branch, the application will be automatically built and deployed to GitHub Pages.

### Manual Deployment

You can also deploy the application manually using the following commands:

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Deploy to GitHub Pages
npm run deploy
```

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
