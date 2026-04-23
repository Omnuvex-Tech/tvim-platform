"use client";

import React, { useRef, useState } from "react";
import type { RequestFormData, RequestFormProps } from "@repo/types/types";
import { cn } from "../../lib/utils";

const UserIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 17c0-3 3.1-5.5 7-5.5s7 2.5 7 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 20 20" fill="none">
    <rect x="6" y="2" width="8" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="10" cy="14.5" r=".7" fill="currentColor" />
  </svg>
);

const PaperclipIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 20 20" fill="none">
    <path d="M15.5 9l-5.9 5.9a3.7 3.7 0 01-5.2-5.2l5.9-5.9a2.5 2.5 0 013.5 3.5L8 13.1a1.2 1.2 0 01-1.8-1.8l5.3-5.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EditIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 20 20" fill="none">
    <path d="M13.5 3.5a2 2 0 012.8 2.8L6 16.5H3v-3L13.5 3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const Spinner = () => (
  <svg className="h-[18px] w-[18px] animate-spin" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
  </svg>
);

interface FormFieldProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  isTextarea?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ icon, children, isTextarea = false }) => (
  <div className={cn("flex items-center gap-[18px] rounded-[20px] bg-white p-[10px_18px] transition-shadow h-[62px]", isTextarea && "h-auto min-h-[110px] items-start p-[20px_18px]")}>
    <span className="flex shrink-0 text-[#0d47ff]">{icon}</span>
    {children}
  </div>
);

interface FileUploadProps {
  file: File | null;
  onChange: (file: File | null) => void;
  icon: React.ReactNode;
}

const FileUpload: React.FC<FileUploadProps> = ({ file, onChange, icon }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex h-[62px] cursor-pointer select-none items-center gap-[18px] rounded-[20px] bg-white p-[10px_18px]" onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}>
      <span className="flex shrink-0 text-[#0d47ff]">{icon}</span>
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[17px] font-semibold text-[#202329]">{file ? file.name : "Fayl seç"}</span>
      <input ref={inputRef} type="file" className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </div>
  );
};

interface SendButtonProps {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}

const SendButton: React.FC<SendButtonProps> = ({ loading, disabled, onClick }) => (
  <button type="button" className={cn("flex h-[52px] min-w-[172px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[20px] border-none bg-[#ffdc09] px-9 text-center text-[16px] font-medium text-[#1a1a1a] transition-all hover:opacity-90")} disabled={disabled || loading} onClick={onClick} aria-busy={loading}>
    {loading ? <Spinner /> : <span className="-mt-0.5">Göndər</span>}
  </button>
);

export const RequestForm: React.FC<RequestFormProps> = ({ heading = "Təmir və tikinti üçün lazım olan məhsulları seçməkdə sizə peşəkar dəstək veririk!", subheading = "Bir sorğu göndərin və ən qısa zamanda sizinlə əlaqə saxlayaq.", onSubmit, className = "" }) => {
  const [form, setForm] = useState<RequestFormData>({ name: "", phone: "", file: null, description: "" });
  const [loading, setLoading] = useState(false);

  const set = (field: keyof Omit<RequestFormData, "file">) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onSubmit?.(form);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={cn("relative w-full overflow-hidden", className)}>
      <div className="flex w-full flex-col items-stretch overflow-hidden rounded-[20px] shadow-[0_4px_10px_rgba(0,0,0,0.1)] lg:flex-row" style={{ background: "url(/images/line.svg), linear-gradient(to bottom, rgb(0,61,255), rgb(0,48,201))", backgroundRepeat: "no-repeat, no-repeat", backgroundPosition: "90% bottom, center" }}>
        <div className="flex w-full flex-1 flex-col justify-center gap-4 px-6 pt-[40px] text-white sm:px-8 sm:pt-[60px] md:gap-6 md:px-10 lg:w-1/2 lg:gap-[33px] lg:p-[120px_60px] xl:p-[80px_40px]">
          <h2 className="mb-4 max-w-full text-[26px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[32px] lg:max-w-[95%] lg:text-[clamp(26px,3.3vw,40px)] xl:max-w-[430px]">{heading}</h2>
          <p className="max-w-full text-[15px] font-bold leading-[1.35] opacity-95 md:max-w-full md:text-[16px] lg:max-w-[60%] lg:text-[17px] xl:max-w-[80%]">{subheading}</p>
        </div>

        <div className="flex w-full flex-1 flex-col justify-center gap-[11px] px-6 pb-8 pt-4 sm:px-8 sm:pb-10 md:px-10 lg:w-1/2 lg:p-[48px_48px_48px_0] xl:p-[40px_40px_40px_0]">
          <div className="mx-auto flex w-full max-w-full flex-col gap-4 md:max-w-[480px] lg:max-w-full">
            <FormField icon={<UserIcon />}>
              <input className="min-w-0 flex-1 border-none bg-transparent font-sans text-[17px] font-medium text-[#202329] outline-none placeholder:text-[#999]" type="text" placeholder="Adınız *" value={form.name} onChange={set("name")} autoComplete="name" />
            </FormField>

            <FormField icon={<PhoneIcon />}>
              <input className="min-w-0 flex-1 border-none bg-transparent font-sans text-[17px] font-medium text-[#202329] outline-none placeholder:text-[#999]" type="tel" placeholder="Telefon *" value={form.phone} onChange={set("phone")} autoComplete="tel" />
            </FormField>

            <FileUpload file={form.file} onChange={(file) => setForm((prev) => ({ ...prev, file }))} icon={<PaperclipIcon />} />

            <FormField icon={<EditIcon />} isTextarea>
              <textarea className="min-h-[90px] flex-1 resize-none border-none bg-transparent font-sans text-[17px] font-medium leading-[1.35] text-[#202329] outline-none placeholder:text-[#999]" placeholder="Layihəni təsvir edin... *" value={form.description} onChange={set("description")} rows={3} />
            </FormField>
          </div>

          <div className="mt-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-full text-[14px] leading-[1.3] text-white/85 sm:max-w-[280px] lg:max-w-[300px]">“Göndər” düyməsini klikləməklə, şəxsi məlumatların emalına razılıq verirsiniz.</p>
            <SendButton loading={loading} disabled={false} onClick={handleSubmit} />
          </div>
        </div>
      </div>
    </section>
  );
};
