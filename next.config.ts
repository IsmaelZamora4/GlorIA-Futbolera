import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/partidos/:path*", destination: "/home/partidos/:path*", permanent: false },
      { source: "/competiciones/:path*", destination: "/home/competiciones/:path*", permanent: false },
      { source: "/configuracion/:path*", destination: "/home/configuración/:path*", permanent: false },
      { source: "/metodologia/:path*", destination: "/home/metodología/:path*", permanent: false },
      { source: "/bank/:path*", destination: "/home/bank/:path*", permanent: false },
      { source: "/posiciones/:path*", destination: "/home/posiciones/:path*", permanent: false },
      { source: "/partido/:path*", destination: "/home/partido/:path*", permanent: false },
      { source: "/home/configuracion/:path*", destination: "/home/configuración/:path*", permanent: false },
      { source: "/home/metodologia/:path*", destination: "/home/metodología/:path*", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "crests.football-data.org" },
      { protocol: "https", hostname: "thumb.wikimedia.org" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
