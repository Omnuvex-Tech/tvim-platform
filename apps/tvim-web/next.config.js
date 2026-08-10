/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@repo/ui"],
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
