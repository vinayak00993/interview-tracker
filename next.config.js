/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prevent webpack from bundling native/binary packages
    serverComponentsExternalPackages: ["better-sqlite3", "@libsql/client", "libsql", "mammoth"],
  },
};

module.exports = nextConfig;
