# Flats Money - React Frontend

This is the React frontend for the Flats Money application, built with Vite, React, and TypeScript.

## API Configuration

The application automatically detects whether it's running locally or in a production environment and sets the appropriate API base URL:

- In local development: `http://localhost:5000/api`
- In production (Docker): `https://flatback.mandini.eu/api`

This detection happens in `src/utils/axios.js` and follows this logic:
1. First, it checks for the `VITE_API_BASE_URL` environment variable
2. If not found, it checks if the hostname is localhost or 127.0.0.1
3. Based on these checks, it sets the appropriate baseURL for API requests

### Environment Variables

- `.env` - Contains development environment variables
- `.env.production` - Contains production environment variables
- Docker environment variables are set in `docker-compose.yml`

### Docker Configuration

The Docker image uses the `latest` tag, so it will always use the most recent version without manual updates to the version number.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

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
