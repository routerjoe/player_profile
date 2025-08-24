/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Provide a default build id generator so Next's internal call doesn't receive undefined
  generateBuildId: () => null,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.s3.amazonaws.com' },
      // Allow the stub upload host so Hero images using Next/Image can render during demo
      { protocol: 'https', hostname: 'example-cdn.invalid' }
    ]
  }
};
module.exports = nextConfig;