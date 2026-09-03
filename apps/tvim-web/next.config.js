/** @type {import('next').NextConfig} */
// Every product, category and settings image is served from the admin host at
// its original size — category icons ship as 1MB+ PNGs and render at 11px — so
// they go through next/image rather than straight <img>.
const apiImageHost = (() => {
    try {
        return new URL(process.env.NEXT_PUBLIC_API_URL ?? "https://admin.tvim.az").hostname;
    } catch {
        return "admin.tvim.az";
    }
})();

const nextConfig = {
    transpilePackages: ["@repo/ui"],
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: apiImageHost,
                pathname: "/**",
            },
        ],
        // The source images are oversized rather than numerous, so a long cache
        // on the optimized output keeps the transcode off the request path.
        minimumCacheTTL: 60 * 60 * 24 * 30,
    },
    // The brand list used to live under /product/brands; it is served from
    // /brands now, so the old paths are kept alive as permanent redirects.
    async redirects() {
        return [
            {
                source: "/product/brands",
                destination: "/brands",
                permanent: true,
            },
            {
                source: "/:locale/product/brands",
                destination: "/:locale/brands",
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
