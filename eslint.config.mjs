import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  // Existing token-driven pages deliberately initialize local UI state after reading
  // the URL. This is not a security or data-integrity violation and is retained
  // during the framework migration; it can be refactored separately.
  { rules: { "react-hooks/set-state-in-effect": "off" } },
];
