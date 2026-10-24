import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // Optional x402 deps of @coinbase/cdp-sdk (via wallet connectors); not installed or used.
    resolveAlias: {
      "@x402/core/client": "./src/config/empty-module.cjs",
      "@x402/evm": "./src/config/empty-module.cjs",
      "@x402/evm/exact/client": "./src/config/empty-module.cjs",
      "@x402/evm/upto/client": "./src/config/empty-module.cjs",
      "@x402/svm/exact/client": "./src/config/empty-module.cjs",
    },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
