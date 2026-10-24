import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // Dependensi opsional x402 dari @coinbase/cdp-sdk (lewat konektor wallet), tidak dipasang dan tidak dipakai.
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
