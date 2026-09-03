// Name fields accept letters, spaces and separators, but never digits.
const DIGIT_PATTERN = /\p{N}/gu;

export const sanitizeNameInput = (value: string) => String(value ?? "").replace(DIGIT_PATTERN, "");
