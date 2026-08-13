import Image from "next/image";
import type { ImageProps } from "next/image";

/**
 * next/image throws at render time when a src points at a host that is not in
 * `images.remotePatterns`, which would take down whatever page rendered it.
 * Product and category art comes back from the api as absolute urls, so the
 * host is data rather than something the code controls: anything on the
 * configured host is optimized, and anything else degrades to a plain <img>
 * instead of failing the render.
 */
const allowedHost = (() => {
    try {
        return new URL(process.env.NEXT_PUBLIC_API_URL ?? "https://admin.tvim.az").hostname;
    } catch {
        return "admin.tvim.az";
    }
})();

export const isOptimizableSrc = (src: unknown): boolean => {
    if (typeof src !== "string") return true;
    return isOptimizable(src.trim());
};

const isOptimizable = (src: string) => {
    // The optimizer answers 400 for svg unless `dangerouslyAllowSVG` is on, and
    // turning that on to raster vector icons would be a loss twice over. Blog
    // and menu icons come back as svg, so they stay plain <img>.
    if (/\.svgx?(\?|#|$)/i.test(src)) return false;

    if (src.startsWith("/")) return true;

    try {
        const url = new URL(src);
        return url.protocol === "https:" && url.hostname === allowedHost;
    } catch {
        return false;
    }
};

/**
 * The optimizer url next/image would have produced, for the cases it cannot
 * cover itself — chiefly `<picture>` art direction, where two different crops
 * are chosen by media query rather than by width.
 *
 * `width` has to be one of next's configured deviceSizes/imageSizes or the
 * optimizer answers 400, so callers pass values from those lists.
 */
export const optimizedImageSrc = (src: string, width: number, quality = 75) => {
    const source = src.trim();
    if (!source || !isOptimizable(source)) return source;

    return `/_next/image?url=${encodeURIComponent(source)}&w=${width}&q=${quality}`;
};

/** `srcSet` string across the given widths, or "" when the src cannot be optimized. */
export const optimizedSrcSet = (src: string, widths: number[], quality = 75) => {
    const source = src.trim();
    if (!source || !isOptimizable(source)) return "";

    return widths.map((width) => `${optimizedImageSrc(source, width, quality)} ${width}w`).join(", ");
};

export type RemoteImageProps = Omit<ImageProps, "src"> & {
    src: string | null | undefined;
};

export function RemoteImage({ src, alt, width, height, sizes, className, ...rest }: RemoteImageProps) {
    const source = typeof src === "string" ? src.trim() : "";
    if (!source) return null;

    if (!isOptimizable(source)) {
        return (
            <img
                src={source}
                alt={typeof alt === "string" ? alt : ""}
                width={typeof width === "number" ? width : undefined}
                height={typeof height === "number" ? height : undefined}
                className={className}
                loading={rest.priority ? "eager" : "lazy"}
            />
        );
    }

    return (
        <Image
            src={source}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            className={className}
            {...rest}
        />
    );
}
