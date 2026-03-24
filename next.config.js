/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent webpack from bundling native/binary packages
  serverExternalPackages: ["better-sqlite3", "@libsql/client", "libsql"],
};

module.exports = nextConfig;
