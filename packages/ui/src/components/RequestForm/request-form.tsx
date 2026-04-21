"use client";

import React, { useState } from "react";
import styles from "./RequestForm.module.css";
import { SendButton } from "./SendButton";
import { FormField } from "./FormField";
import { FileUpload } from "./FileUpload";


export interface RequestFormData {
  name: string;
  phone: string;
  file: File | null;
  description: string;
}

export interface RequestFormProps {
  heading?: string;
  subheading?: string;
  onSubmit?: (data: RequestFormData) => void | Promise<void>;
  className?: string;
}

const UserIcon = () => (
  <svg viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M3 17c0-3 3.1-5.5 7-5.5s7 2.5 7 5.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 20 20" fill="none">
    <rect
      x="6"
      y="2"
      width="8"
      height="16"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle cx="10" cy="14.5" r=".7" fill="currentColor" />
  </svg>
);

const PaperclipIcon = () => (
  <svg viewBox="0 0 20 20" fill="none">
    <path
      d="M15.5 9l-5.9 5.9a3.7 3.7 0 01-5.2-5.2l5.9-5.9a2.5 2.5 0 013.5 3.5L8 13.1a1.2 1.2 0 01-1.8-1.8l5.3-5.3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 20 20" fill="none">
    <path
      d="M13.5 3.5a2 2 0 012.8 2.8L6 16.5H3v-3L13.5 3.5z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const DiagonalLines = () => (
  <div className={styles.lines} aria-hidden="true">
    {Array.from({ length: 7 }).map((_, i) => (
      <span
        key={i}
        className={styles.line}
        style={{ left: `${i * 16 + 2}%` }}
      />
    ))}
  </div>
);

export const RequestForm: React.FC<RequestFormProps> = ({
  heading = "We provide professionally supporting you in choosing products needed for repair and construction!",
  subheading = "Send a request and contact you as soon as possible",
  onSubmit,
  className = "",
}) => {
  const [form, setForm] = useState<RequestFormData>({
    name: "",
    phone: "",
    file: null,
    description: "",
  });

  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const set =
    (field: keyof Omit<RequestFormData, "file">) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!agreed || loading) return;

    setLoading(true);
    try {
      await onSubmit?.(form);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`${styles.section} ${className}`}>
      <DiagonalLines />

      <div className={styles.inner}>
        <div className={styles.left}>
          <h2 className={styles.heading}>{heading}</h2>
          <p className={styles.subheading}>{subheading}</p>
        </div>

        <div className={styles.right}>
          <div className={styles.fields}>
            <FormField icon={<UserIcon />}>
              <input
                className={styles.input}
                type="text"
                placeholder="Your name *"
                value={form.name}
                onChange={set("name")}
                autoComplete="name"
              />
            </FormField>

            <FormField icon={<PhoneIcon />}>
              <input
                className={styles.input}
                type="tel"
                placeholder="Phone *"
                value={form.phone}
                onChange={set("phone")}
                autoComplete="tel"
              />
            </FormField>

            <FileUpload
              file={form.file}
              onChange={(file) => setForm((prev) => ({ ...prev, file }))}
              icon={<PaperclipIcon />}
            />

            <FormField icon={<EditIcon />} isTextarea>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                placeholder="Describe the project ... *"
                value={form.description}
                onChange={set("description")}
                rows={3}
              />
            </FormField>
          </div>

          <div className={styles.footerRow}>
            <label className={styles.agree}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                By clicking, you agree to the processing of personal data
              </span>
            </label>

            <SendButton
              loading={loading}
              disabled={!agreed}
              onClick={handleSubmit}
            />
          </div>
        </div>
      </div>
    </section>
  );
};