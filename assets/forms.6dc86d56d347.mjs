import { validateInquiry, fieldLabels, requestTypes, submissionError } from './validation.bd84e95400c4.mjs';

export function initializeForm() {
  const form = document.querySelector('[data-inquiry-form]');
  if (!(form instanceof HTMLFormElement)) return null;
  const request = form.elements.namedItem('request_type');
  const caseFields = form.querySelector('[data-case-fields]');
  const summary = document.getElementById('form-errors');
  const errorMessage = document.getElementById('form-error-message');
  const errorList = document.getElementById('form-error-list');
  const success = document.querySelector('[data-form-success]');
  const submit = form.querySelector('button[type="submit"]');
  const label = form.querySelector('[data-submit-label]');
  const status = form.querySelector('[data-submit-status]');
  const defaultLabel = label.textContent;
  let pending = false;

  function updateCaseFields() {
    const materialsOnly = request.value === 'materials';
    caseFields.hidden = materialsOnly;
    caseFields.querySelectorAll('input, textarea').forEach((input) => { input.disabled = materialsOnly; });
  }
  function clearErrors() {
    summary.hidden = true;
    errorMessage.textContent = '';
    errorList.replaceChildren();
    form.querySelectorAll('[aria-invalid]').forEach((field) => field.removeAttribute('aria-invalid'));
    form.querySelectorAll('.field-error').forEach((message) => { message.hidden = true; message.textContent = ''; });
  }
  function showErrors(message, errors = {}) {
    clearErrors();
    errorMessage.textContent = message;
    for (const [name, text] of Object.entries(errors)) {
      if (!Object.hasOwn(fieldLabels, name)) continue;
      const field = form.elements.namedItem(name);
      const fieldError = document.getElementById(`${name}-error`);
      if (!field || field.disabled || !fieldError) continue;
      field.setAttribute('aria-invalid', 'true');
      fieldError.textContent = text;
      fieldError.hidden = false;
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${name}`;
      link.textContent = `${fieldLabels[name]}: ${text}`;
      link.addEventListener('click', (event) => { event.preventDefault(); field.focus(); });
      item.append(link);
      errorList.append(item);
    }
    errorList.hidden = errorList.childElementCount === 0;
    summary.hidden = false;
    summary.focus();
  }
  function showForm() {
    success.hidden = true;
    form.hidden = false;
  }
  const setIntent = (intent) => {
    if (!requestTypes.includes(intent) || pending) return;
    showForm();
    request.value = intent;
    updateCaseFields();
    clearErrors();
  };
  request.addEventListener('change', updateCaseFields);
  document.querySelector('[data-form-reset]')?.addEventListener('click', () => {
    showForm();
    clearErrors();
    updateCaseFields();
    form.elements.namedItem('name').focus();
  });
  form.addEventListener('input', (event) => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) return;
    if (field.hasAttribute('aria-invalid')) {
      field.removeAttribute('aria-invalid');
      const message = document.getElementById(`${field.name}-error`);
      if (message) { message.hidden = true; message.textContent = ''; }
    }
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(form);
    if (String(data.get('_gotcha') || '').trim()) {
      showErrors('Your inquiry could not be sent. Please contact the practice by email or phone.');
      return;
    }
    const { values, errors, valid } = validateInquiry(Object.fromEntries(data));
    if (!valid) { showErrors('Complete or correct the following fields.', errors); return; }
    clearErrors();
    // Trim user input; omit case information when only requesting materials.
    for (const [name, value] of Object.entries(values)) {
      if (values.request_type === 'materials' && ['message', 'jurisdiction'].includes(name)) data.delete(name);
      else data.set(name, value);
    }
    const subjects = { case: 'Case inquiry', materials: 'CV and fee schedule request', both: 'Case inquiry and materials request' };
    data.set('_subject', `Crux Neurology - ${subjects[values.request_type]}`);
    pending = true;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    label.textContent = 'Sending...';
    status.textContent = 'Sending your inquiry.';
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(form.action, {
        method: 'POST', body: data, headers: { Accept: 'application/json' }, signal: controller.signal,
      });
      let payload = null;
      try { payload = await response.json(); } catch { /* No confirmation without a valid service response. */ }
      if (!response.ok || !payload || payload.ok === false || payload.errors?.length) {
        const fieldErrors = {};
        if (Array.isArray(payload?.errors)) {
          for (const item of payload.errors) {
            if (Object.hasOwn(fieldLabels, item.field)) fieldErrors[item.field] = `Check ${fieldLabels[item.field].toLowerCase()} and try again.`;
          }
        }
        showErrors(submissionError(response.status), fieldErrors);
        return;
      }
      form.reset();
      updateCaseFields();
      form.hidden = true;
      success.hidden = false;
      success.focus({ preventScroll: true });
      success.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    } catch (error) {
      const message = error instanceof DOMException && error.name === 'AbortError'
        ? 'Delivery could not be confirmed before the request timed out. Your entries are still here. Contact the practice directly before resubmitting to avoid a duplicate inquiry.'
        : 'A connection error prevented confirmation. Your entries are still here. Check your connection and try again, or contact the practice directly.';
      showErrors(message);
    } finally {
      window.clearTimeout(timer);
      pending = false;
      submit.disabled = false;
      form.removeAttribute('aria-busy');
      label.textContent = defaultLabel;
      status.textContent = '';
    }
  });
  // Enable custom accessible validation only after the submission handler exists.
  form.noValidate = true;
  updateCaseFields();
  return { setIntent };
}
