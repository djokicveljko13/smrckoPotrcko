import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lock Turbopack to this folder (avoids picking up a lockfile in the user home dir).
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
