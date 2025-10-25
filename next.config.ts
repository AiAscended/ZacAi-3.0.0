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
      "@": path.resolve(__dirname, "src"),
      app: path.resolve(__dirname, "src/app"),
      components: path.resolve(__dirname, "src/components"),
      ui: path.resolve(__dirname, "src/components/ui"),
      hooks: path.resolve(__dirname, "src/hooks"),
      lib: path.resolve(__dirname, "src/lib"),
      ai: path.resolve(__dirname, "src/ai"),
      "ai-engine": path.resolve(__dirname, "src/ai/engine"),
      "ai-domains": path.resolve(__dirname, "src/ai/domains"),
      "ai-orchestration": path.resolve(__dirname, "src/ai/orchestration"),
      "ai-shared": path.resolve(__dirname, "src/ai/shared"),
      api: path.resolve(__dirname, "src/api")
    }
    return config
  }
}

export default nextConfig
