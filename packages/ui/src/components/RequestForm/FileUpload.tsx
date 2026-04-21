"use client";

import React, { useRef } from "react";
import styles from "./RequestForm.module.css";


interface FileUploadProps {
  file: File | null;
  onChange: (file: File | null) => void;
  icon: React.ReactNode;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  file,
  onChange,
  icon,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`${styles.field} ${styles.fieldFile}`}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) =>
        e.key === "Enter" && inputRef.current?.click()
      }
    >
      <span className={styles.fieldIcon}>{icon}</span>
      <span className={styles.fileLabel}>
        {file ? file.name : "Select the file"}
      </span>
      <input
        ref={inputRef}
        type="file"
        className={styles.hiddenInput}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
};