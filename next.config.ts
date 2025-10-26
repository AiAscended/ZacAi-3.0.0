/** @type {import('next').NextConfig} */
import path from "path"

const nextConfig = {
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
  images: { unoptimized: false },
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react"]
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "."),
      app: path.resolve(__dirname, "app"),
      components: path.resolve(__dirname, "components"),
      ui: path.resolve(__dirname, "components/ui"),
      hooks: path.resolve(__dirname, "hooks"),
      lib: path.resolve(__dirname, "lib"),
    }
    return config
  }
}

export default nextConfig
