/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["framer-motion"],
  async redirects() {
    return [
      {
        source: "/library",
        destination: "/app/archive",
        permanent: false,
      },
      {
        source: "/workspace",
        destination: "/app/agents",
        permanent: false,
      },
      {
        source: "/gaps",
        destination: "/app/investigations",
        permanent: false,
      },
      {
        source: "/responsibilities",
        destination: "/app/responsibilities",
        permanent: false,
      },
      {
        source: "/handovers",
        destination: "/app/handovers",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
