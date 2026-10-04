export const OPTIONS = {
  cover_type: ['Single', 'Couple', 'Family'],
  hospital_cover: ['None', 'Basic', 'Bronze', 'Silver', 'Gold'],
  extras_cover: ['None', 'Basic', 'Standard', 'Premium'],
  payment_frequency: ['Monthly', 'Yearly'],
  history: ['Yes', 'No', 'Not sure'],
};

export function validateQuoteInput(raw) {
  const errors = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { input: null, errors: { form: 'Please provide a quote object.' } };
  }
  const customer_name = typeof raw.customer_name === 'string' ? raw.customer_name.trim() : '';
  if (!customer_name) errors.customer_name = 'Enter a customer name.';
  for (const field of ['cover_type', 'hospital_cover', 'extras_cover', 'payment_frequency']) {
    if (!OPTIONS[field].includes(raw[field])) errors[field] = 'Select a valid option.';
  }
  const applicantCount = raw.cover_type === 'Single' ? 1 : 2;
  for (let i = 1; i <= applicantCount; i++) {
    const age = raw[`applicant${i}_age`];
    if (!Number.isInteger(age) || age < 18 || age > 100) {
      errors[`applicant${i}_age`] = `Applicant ${i}: enter a whole-number age from 18 to 100.`;
    }
    if (!OPTIONS.history.includes(raw[`applicant${i}_cover_history`])) {
      errors[`applicant${i}_cover_history`] = `Applicant ${i}: select a hospital cover history.`;
    }
  }
  const discount = raw.annual_discount === undefined && raw.payment_frequency === 'Monthly' ? 0 : raw.annual_discount;
  if (typeof discount !== 'number' || !Number.isFinite(discount) || discount < 0 || discount > 10) {
    errors.annual_discount = 'Enter an annual discount from 0 to 10%.';
  }
  if (raw.notes !== undefined && typeof raw.notes !== 'string') errors.notes = 'Notes must be text.';
  if (Object.keys(errors).length) return { input: null, errors };
  return {
    errors,
    input: {
      customer_name,
      cover_type: raw.cover_type,
      applicant1_age: raw.applicant1_age,
      applicant1_cover_history: raw.applicant1_cover_history,
      applicant2_age: applicantCount === 2 ? raw.applicant2_age : null,
      applicant2_cover_history: applicantCount === 2 ? raw.applicant2_cover_history : null,
      hospital_cover: raw.hospital_cover,
      extras_cover: raw.extras_cover,
      payment_frequency: raw.payment_frequency,
      annual_discount: raw.payment_frequency === 'Yearly' ? discount : 0,
      notes: (raw.notes ?? '').trim(),
    },
  };
}
