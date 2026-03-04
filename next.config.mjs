/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: ".",
  },

  // rewrite the clean dashboard url to the actual folder path
  // so the existing layout.jsx under /page/dashboard is executed.
  // this lets you keep all of your current links and logic while
  // allowing users to visit /dashboard directly.
  async rewrites() {
    return [
      {
        source: "/dashboard/:path*",
        destination: "/page/dashboard/:path*",
      },
    ];
  },
};

export default nextConfig;
