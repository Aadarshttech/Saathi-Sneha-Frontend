/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: { serverComponentsExternalPackages: ['@prisma/client'] },
  images: { domains: ['sahayata-documents.s3.ap-south-1.amazonaws.com'] },
}
module.exports = nextConfig
