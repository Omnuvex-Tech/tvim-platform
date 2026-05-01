"use client";
import React from "react";

export type SpinnerProps = {
    /** size in pixels */
    size?: number;
    strokeWidth?: number;
    className?: string;
    color?: string;
};

export default function Spinner({ size = 24, strokeWidth = 1.5, className = "", color = "currentColor" }: SpinnerProps) {
    return (
        <svg
            className={`animate-spin ${className}`}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
            <path className="opacity-75" fill={color} d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
    );

}