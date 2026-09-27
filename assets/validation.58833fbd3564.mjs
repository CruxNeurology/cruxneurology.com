/** Pure validation shared by the browser and Node tests. No patient data is logged. */
export const limits = Object.freeze({ name: 100, organization: 160, email: 254, phone: 40, jurisdiction: 120, message: 3000 });
export const fieldLabels = Object.freeze({ name: 'Full name', organization: 'Firm or organization', email: 'Professional email', phone: 'Phone', jurisdiction: 'State or jurisdiction', message: 'Clinical issues' });
export function normalizeFields(input) {
  const result = {};
  for (const field of Object.keys(fieldLabels)) result[field] = String(input[field] ?? '').trim();
  return result;
}
export function validateInquiry(input) {
  const values = normalizeFields(input);
  const errors = {};
  if (!values.name) errors.name = 'Enter your full name.';
  if (!values.organization) errors.organization = 'Enter your firm or organization.';
  if (!values.email) errors.email = 'Enter your professional email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter an email address with a complete domain, such as name@firm.com.';
  for (const [field, limit] of Object.entries(limits)) {
    if (values[field].length > limit) errors[field] = `Use ${limit} characters or fewer.`;
  }
  return { values, errors, valid: Object.keys(errors).length === 0 };
}
export function submissionError(status) {
  if (status === 429) return 'Too many requests were received. Please wait before trying again, or contact the practice by email or phone.';
  if (status === 400 || status === 422) return 'The form service could not accept this inquiry. Review your details and try again, or contact the practice directly.';
  return 'Your inquiry could not be sent. Your entries are still here. Try again, or use the email or phone number shown beside the form.';
}
