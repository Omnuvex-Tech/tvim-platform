"use client";

import React from "react";
import styles from "./RequestForm.module.css";

interface SendButtonProps {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}

const Spinner = () => (
  <svg className={styles.spinnerSvg} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10"
      stroke="currentColor" strokeWidth="3"
      strokeLinecap="round" strokeDasharray="31.4 31.4" />
  </svg>
);

export const SendButton: React.FC<SendButtonProps> = ({
  loading,
  disabled,
  onClick,
}) => {
  return (
    <button
      type="button"
      className={styles.sendBtn}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
    >
      {loading ? <Spinner /> : "Göndər"}
    </button>
  );
};