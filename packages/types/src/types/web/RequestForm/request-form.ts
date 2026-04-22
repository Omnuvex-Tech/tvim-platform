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
