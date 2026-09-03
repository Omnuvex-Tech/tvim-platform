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
        // admin.tvim.az is pinned to 127.0.0.1 in /etc/hosts so the optimizer
        // fetches images from this machine's own nginx instead of going out to
        // Cloudflare, which challenges the request and answers 403 (all images
        // were blank on 2026-08-28). Next 16 refuses a host that resolves to a
        // private ip unless this is set. It is not a general SSRF opening: the
        // url must still match remotePatterns above, so the only host the
        // optimizer will ever fetch is admin.tvim.az.
        dangerouslyAllowLocalIP: true,
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
