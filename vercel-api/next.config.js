/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Allow API routes to coexist with existing serverless functions
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  },
  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://dfm-mu.vercel.app'
  }
}

module.exports = nextConfig
