import withBundleAnalyzer from '@next/bundle-analyzer'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    // @react-pdf/renderer must NOT be bundled by webpack (breaks internal classes).
    // Runs as native Node.js module server-side; Next.js handles it as ESM client-side.
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
}

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default bundleAnalyzer(nextConfig)
