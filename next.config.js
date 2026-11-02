/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Native and engine-backed packages must not be bundled by webpack.
    serverComponentsExternalPackages: ["@libsql/client", "libsql", "@prisma/client", "@prisma/adapter-libsql", "mammoth"],
  },
};

module.exports = nextConfig;
