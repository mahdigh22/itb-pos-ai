import createNextIntlPlugin from 'next-intl/plugin';
import type {NextConfig} from 'next';

const withNextIntl = createNextIntlPlugin();
 
const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};
 
export default withNextIntl(nextConfig);
