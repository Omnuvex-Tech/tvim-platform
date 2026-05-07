import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "../../lib/utils";
import "./breadcrumb.css";

export type BreadcrumbItem = {
    label: string;
    href?: string;
    isCurrent?: boolean;
};

export type BreadcrumbProps = {
    items: BreadcrumbItem[];
    className?: string;
    separator?: ReactNode;
    showTitle?: boolean;
    pageTitle?: string;
    titleClassName?: string;
};

const Breadcrumb = ({
    items,
    className,
    separator,
    showTitle = false,
    pageTitle,
    titleClassName,
}: BreadcrumbProps) => {
    if (!Array.isArray(items) || items.length === 0) {
        return null;
    }

    return (
        <div className="w-full bg-white mt-3">
            <nav aria-label="Breadcrumb" className={cn("mx-auto max-w-[1280px] px-1 lg:px-2", className)}>
                <ul className="breadcrumb">
                    {items.map((item, index) => {
                        const isLast = index === items.length - 1;
                        const isCurrent = item.isCurrent || isLast;

                        return (
                            <li key={`${item.label}-${index}`} className={cn(separator ? "inline-flex items-center" : "") }>
                                {item.href && !isCurrent ? (
                                    <Link href={item.href} className="breadcrumb-previous hover:text-[#2050f5]">
                                        {item.label}
                                    </Link>
                                ) : (
                                    <span className={isCurrent ? "breadcrumb-current" : "breadcrumb-previous"}>{item.label}</span>
                                )}
                                {separator && !isLast ? <span className="px-[5px] text-[#ccc]">{separator}</span> : null}
                            </li>
                        );
                    })}
                </ul>

                {showTitle && pageTitle ? (
                    <h1 className={cn("breadcrumb-page-title", titleClassName)}>{pageTitle}</h1>
                ) : null}
            </nav>
        </div>
    );
};

export { Breadcrumb };
