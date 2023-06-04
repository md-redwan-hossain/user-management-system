import validator from "validator";

export function passwordValidation(value: string): boolean {
  if (
    validator.default.isLength(value, { min: 8, max: 128 }) &&
    validator.default.isStrongPassword(value, {
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    })
  ) {
    return true;
  }
  return false;
}

export function stringTrim(value: string): string {
  // eslint-disable-next-line
  value = validator.default.trim(value);
  if (value) return value;
  return "";
}
export function validateEmailAndNormalize(value: string): string {
  // eslint-disable-next-line
  if(validator.default.isEmail(value)){
    // eslint-disable-next-line
    value = validator.default.normalizeEmail(value, {
      all_lowercase: true,
      gmail_remove_dots: false
    }) as string;
    return value;
  }
  return "";
}
