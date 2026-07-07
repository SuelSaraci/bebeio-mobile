export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Parse decimal text from the keyboard; accepts both "5.2" and "5,2". */
export function parseDecimalInput(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function validateLogin(fields: { email: string; password: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.email.trim()) errors.email = 'Email is required.';
  else if (!isValidEmail(fields.email)) errors.email = 'Enter a valid email address.';
  if (!fields.password.trim()) errors.password = 'Password is required.';
  return errors;
}

export function validateSignup(fields: {
  name: string;
  email: string;
  password: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.name.trim()) errors.name = 'Name is required.';
  else if (fields.name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';
  if (!fields.email.trim()) errors.email = 'Email is required.';
  else if (!isValidEmail(fields.email)) errors.email = 'Enter a valid email address.';
  if (!fields.password.trim()) errors.password = 'Password is required.';
  else if (fields.password.length < 6) errors.password = 'Password must be at least 6 characters.';
  return errors;
}

export function validateBabyName(name: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!name.trim()) errors.name = "Please enter your baby's name.";
  else if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';
  return errors;
}

export function validateBabyBirth(birthDate: string, birthWeight: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!birthDate) errors.birthDate = 'Please enter the birth date.';
  const w = parseDecimalInput(birthWeight);
  if (!birthWeight.trim()) errors.birthWeight = 'Birth weight is required.';
  else if (w == null || w < 0.5 || w > 6) {
    errors.birthWeight = 'Enter a valid weight between 0.5 and 6 kg.';
  }
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function firstError(errors: FieldErrors): string {
  return Object.values(errors)[0] ?? '';
}

export function clearFieldError(
  errors: FieldErrors,
  field: string,
): FieldErrors {
  if (!errors[field]) return errors;
  const next = { ...errors };
  delete next[field];
  return next;
}
