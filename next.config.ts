import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      }
    ]
  },
  // Backward-compatibility for the production route restructure
  // (public / internal-EHS / owner / developer areas).
  async redirects() {
    return [
      { source: "/auth/login", destination: "/login", permanent: false },
      { source: "/dashboard", destination: "/ehs/dashboard", permanent: false },
      { source: "/dashboard/verification", destination: "/ehs/verification", permanent: false },
      { source: "/dashboard/reports/:reportNo", destination: "/ehs/reports/:reportNo", permanent: false },
      { source: "/ehs/reports", destination: "/ehs/dashboard", permanent: false },
      { source: "/actions", destination: "/owner/actions", permanent: false },
      { source: "/actions/:assignmentId", destination: "/owner/actions/:assignmentId", permanent: false },
      { source: "/whatsapp/simulator", destination: "/dev/whatsapp-simulator", permanent: false },
      { source: "/whatsapp/production", destination: "/dev/whatsapp-setup", permanent: false }
    ];
  }
};

export default nextConfig;
