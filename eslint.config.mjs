import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // テストファイルは lint 対象だが node 環境ルールを緩和
    "__tests__/**",
  ]),
  {
    rules: {
      // console.log を警告（console.error は許可）
      "no-console": ["warn", { allow: ["error", "warn"] }],
      // 未使用変数をエラー
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // any 型は警告
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;
