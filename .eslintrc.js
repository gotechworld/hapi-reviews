module.exports = {
  "env": {
    "browser": false,
    "es6": true,
    "node": true
  },
  "extends": ["@hapi/eslint-config-hapi"],
  "parser": "babel-eslint",
  "parserOptions": {
    "ecmaVersion": 2018,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true,
      "modules": true,
      "experimentalObjectRestSpread": true
    }
  },
  "rules": {
    "prefer-destructuring": ["error", { "object": true, "array": false }],
    "linebreak-style": ["error", "unix"],
    "no-console": 0,
    "arrow-parens": ["error", "as-needed"],
    indent: ["error", 2],
    quotes: ["error", "double"],
    "@hapi/hapi/scope-start": "off",
  }
};
