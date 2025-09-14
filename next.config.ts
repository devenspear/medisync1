import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/**'],
  },
  outputFileTracingExcludes: {
    '/api/**/*': [
      './node_modules/@next/swc-linux-x64-gnu/**',
      './node_modules/@next/swc-linux-x64-musl/**',
      './node_modules/@img/sharp-libvips-linuxmusl-x64/**',
      './node_modules/@img/sharp-libvips-linux-x64/**',
      './node_modules/tone/build/**',
      './node_modules/tone/Tone/**',
      './node_modules/standardized-audio-context/build/**',
      './node_modules/standardized-audio-context/src/**',
      './node_modules/framer-motion/dist/**',
      './node_modules/motion-dom/dist/**',
      './node_modules/tailwindcss/peers/**',
      './node_modules/tailwindcss/node_modules/**',
      './node_modules/tailwindcss/lib/**',
    ],
  },
  serverExternalPackages: ['sharp', 'tone'],
};

export default nextConfig;
