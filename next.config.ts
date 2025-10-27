import withPWA from "next-pwa";

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https" as const,
        hostname: "randomuser.me",
      },
      {
        protocol: "https" as const,
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

// enable PWA support
const config = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
})(nextConfig);

export default config;
