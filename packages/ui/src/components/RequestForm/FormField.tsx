"use client";

import React from "react";
import styles from "./RequestForm.module.css";


interface FormFieldProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  isTextarea?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  icon,
  children,
  isTextarea = false,
}) => {
  return (
    <div
      className={`${styles.field}
        ${isTextarea ? styles.fieldTextarea : ""}`}
    >
      <span className={styles.fieldIcon}>{icon}</span>
      {children}
    </div>
  );
};