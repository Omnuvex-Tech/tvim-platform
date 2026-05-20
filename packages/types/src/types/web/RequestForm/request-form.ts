export interface RequestFormData {
  name: string;
  phone: string;
  file: File | null;
  description: string;
}

export interface RequestFormSubmitResult {
  message?: string;
  ok?: boolean;
}

export interface RequestFormPlaceholders {
  name?: string;
  phone?: string;
  file?: string;
  description?: string;
}

export interface RequestFormField {
  id?: number | string;
  type?: string;
  sort_order?: number | string;
  name?: string;
  information?: string;
  is_required?: boolean;
  send_text_mail?: boolean;
  options?: unknown[];
}

export interface RequestFormSubmitConfig {
  method?: string;
  path: string;
}

export interface RequestFormProps {
  heading?: string;
  subheading?: string;
  placeholders?: RequestFormPlaceholders;
  fields?: RequestFormField[];
  submitConfig?: RequestFormSubmitConfig;
  submitLabel?: string;
  consentText?: string;
  onSubmit?: (data: RequestFormData) => void | RequestFormSubmitResult | Promise<void | RequestFormSubmitResult>;
  className?: string;
}
