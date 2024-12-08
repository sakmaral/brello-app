import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import path from "path";
import tseslint from "typescript-eslint";

const __dirname = path.resolve();

// Setup compatibility layer for legacy eslint plugins
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

function legacyPlugin(name, alias = name) {
  const plugin = compat.plugins(name)[0]?.plugins?.[alias];

  if (!plugin) {
    throw new Error(`Unable to resolve plugin ${name} and/or alias ${alias}`);
  }

  return plugin; // Removed fixupPluginRules as it's not needed
}

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      effector: legacyPlugin("eslint-plugin-effector", "effector"),
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          fixStyle: "inline-type-imports",
          prefer: "type-imports",
        },
      ],
      // Naming conventions
      "effector/enforce-store-naming-convention": "error",
      "effector/enforce-effect-naming-convention": "error",
      "effector/enforce-gate-naming-convention": "error",

      // Code structure and patterns
      "effector/keep-options-order": "error",
      "effector/mandatory-scope-binding": "error",
      "effector/no-ambiguity-target": "error",
      "effector/no-duplicate-clock-or-source-array-values": "error",
      // "effector/no-duplicate-on": "error",
      "effector/no-forward": "error",
      "effector/no-getState": "error",
      "effector/no-guard": "error",
      "effector/no-patronum-debug": "error",
      "effector/no-unnecessary-combination": "error",
      "effector/no-unnecessary-duplication": "error",
      "effector/no-useless-methods": "error",
      "effector/no-watch": "error",
      "effector/prefer-sample-over-forward-with-mapping": "error",
      "effector/prefer-useUnit": "error",
      "effector/require-pickup-in-persist": "error",
      "effector/strict-effect-handlers": "error",
    },
  },
);
