export interface RequestFormData {
  name: string;
  phone: string;
  file: File | null;
  description: string;
}

export interface RequestFormPlaceholders {
  name?: string;
  phone?: string;
  file?: string;
  description?: string;
}

export interface RequestFormSubmitConfig {
  method?: string;
  path: string;
}

export interface RequestFormProps {
  heading?: string;
  subheading?: string;
  placeholders?: RequestFormPlaceholders;
  submitConfig?: RequestFormSubmitConfig;
  submitLabel?: string;
  consentText?: string;
  onSubmit?: (data: RequestFormData) => void | Promise<void>;
  className?: string;
}
