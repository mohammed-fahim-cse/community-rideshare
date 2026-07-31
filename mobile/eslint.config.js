// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // HTML-entity escaping doesn't apply to React Native's Text content — there's no
      // markup being parsed, just a JS string.
      "react/no-unescaped-entities": "off",
    },
  },
]);
