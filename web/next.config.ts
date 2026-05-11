import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** 避免 Turbopack 打包进过时 Prisma Client，导致运行时缺少新字段（如 passwordHash） */
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
