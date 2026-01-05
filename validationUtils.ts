export interface ValidationResult<T> {
  value?: T;
  error?: string;
}

const parseNumber = (raw: string): number => {
  return Number.parseFloat(raw.trim());
};

export const validateAmount = (
  raw: string,
  options?: { min?: number; allowZero?: boolean }
): ValidationResult<number> => {
  const parsed = parseNumber(raw);
  if (!Number.isFinite(parsed)) {
    return { error: 'Please enter a valid number.' };
  }

  const min = options?.min ?? 0;
  const allowZero = options?.allowZero ?? false;
  if (parsed < min || (!allowZero && parsed === 0)) {
    return { error: 'Please enter a valid, positive amount.' };
  }

  return { value: parsed };
};

export const validateDate = (raw: string): ValidationResult<string> => {
  if (!raw.trim()) {
    return { error: 'Please select a date.' };
  }

  const parsed = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { error: 'Please select a valid date.' };
  }

  return { value: raw };
};

export const validateRequiredText = (raw: string, label: string): ValidationResult<string> => {
  if (!raw.trim()) {
    return { error: `Please add a ${label}.` };
  }

  return { value: raw.trim() };
};
