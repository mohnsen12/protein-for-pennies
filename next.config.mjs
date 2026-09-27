/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  // GitHub Pages mode: static export under a basePath (project pages live at /<repo>/).
  // Local dev and a future Vercel deploy run WITHOUT these env vars and stay unaffected.
  ...(process.env.GITHUB_PAGES
    ? {
        output: "export",
        basePath: process.env.NEXT_PUBLIC_BASE_PATH,
        assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH,
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
