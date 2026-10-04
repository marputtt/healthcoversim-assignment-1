import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { OPTIONS, validateQuoteInput } from '../../shared/quoteInput.js';
import { request } from './api.js';

const EMPTY = {
  customer_name: '', cover_type: 'Single',
  applicant1_age: '', applicant1_cover_history: '',
  applicant2_age: '', applicant2_cover_history: '',
  hospital_cover: '', extras_cover: '',
  payment_frequency: 'Monthly', annual_discount: 0, notes: '',
};

export default function QuoteForm({ quote }) {
  const [values, setValues] = useState({ ...EMPTY, ...quote });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  const multiple = values.cover_type !== 'Single';
  function change(name, value) {
    setValues(previous => ({
      ...previous, [name]: value,
      ...(name === 'cover_type' && value === 'Single' ? { applicant2_age: '', applicant2_cover_history: '' } : {}),
      ...(name === 'payment_frequency' && value === 'Monthly' ? { annual_discount: 0 } : {}),
    }));
    setErrors(previous => ({ ...previous, [name]: undefined }));
  }
  function field(name, label, { options, type = 'text', hint, min, max, step } = {}) {
    const attributes = {
      id: name, name, value: values[name] ?? '', required: name !== 'notes',
      onChange: event => change(name, event.target.value),
      'aria-invalid': Boolean(errors[name]),
      'aria-describedby': [hint && `${name}-hint`, errors[name] && `${name}-error`].filter(Boolean).join(' ') || undefined,
    };
    return <div className="field">
      <label htmlFor={name}>{label}</label>
      {options ? <select {...attributes}><option value="">Select an option</option>{options.map(option => <option key={option}>{option}</option>)}</select>
        : type === 'textarea' ? <textarea {...attributes} rows="3" />
          : <input {...attributes} type={type} min={min} max={max} step={step} autoComplete={name === 'customer_name' ? 'name' : undefined} />}
      {hint && <small id={`${name}-hint`} className="hint">{hint}</small>}
      {errors[name] && <small id={`${name}-error`} className="field-error">{errors[name]}</small>}
    </div>;
  }
  async function save(event) {
    event.preventDefault();
    if (pending) return;
    const payload = { ...values };
    for (const name of ['applicant1_age', 'applicant2_age', 'annual_discount']) {
      payload[name] = values[name] === '' || values[name] === null ? null : Number(values[name]);
    }
    const result = validateQuoteInput(payload);
    setErrors(result.errors);
    setSubmitError('');
    if (!result.input) {
      document.getElementById(Object.keys(result.errors)[0])?.focus();
      return;
    }
    setPending(true);
    try {
      const saved = await request(quote ? `/api/quotes/${quote.id}` : '/api/quotes', { method: quote ? 'PUT' : 'POST', body: result.input });
      navigate(`/quotes/${saved.id}`);
    } catch (error) {
      setErrors(error.fields || {});
      setSubmitError(error.message);
    } finally {
      setPending(false);
    }
  }
  return <div className="form-page">
    <Link className="back-link" to={quote ? `/quotes/${quote.id}` : '/quotes'}>← {quote ? 'Back to quote' : 'All quotes'}</Link>
    <div className="page-heading"><h1>{quote ? 'Edit quote' : 'New quote'}</h1><p>Complete the required fields. Notes are optional.</p></div>
    <form noValidate onSubmit={save}>
      <section className="form-section" aria-labelledby="customer-heading">
        <div className="section-heading"><div><h2 id="customer-heading">Customer</h2><p>Single covers one adult. Couple and Family cover two.</p></div></div>
        <div className="field-grid">{field('customer_name', 'Customer name')}{field('cover_type', 'Cover type', { options: OPTIONS.cover_type })}</div>
        {values.cover_type === 'Family' && <p className="info-note">Family includes dependent children. The $30/month family fee is added automatically; children's ages are not needed.</p>}
      </section>
      <section className="form-section" aria-labelledby="applicant-heading">
        <div className="section-heading"><div><h2 id="applicant-heading">Applicants</h2><p>Enter each adult's age and hospital cover history.</p></div></div>
        {[1, ...(multiple ? [2] : [])].map(n => <fieldset key={n} className="applicant-fields"><legend>Applicant {n}</legend><div className="field-grid">
          {field(`applicant${n}_age`, `Applicant ${n} age`, { type: 'number', min: 18, max: 100, step: 1, hint: '18–100 years, whole numbers only.' })}
          {field(`applicant${n}_cover_history`, `Applicant ${n} hospital cover history`, { options: OPTIONS.history, hint: 'Choose Not sure if you do not know.' })}
        </div></fieldset>)}
      </section>
      <section className="form-section" aria-labelledby="cover-heading">
        <div className="section-heading"><div><h2 id="cover-heading">Cover and payment</h2><p>Hospital and extras prices are per adult.</p></div></div>
        <div className="field-grid">
          {field('hospital_cover', 'Hospital cover level', { options: OPTIONS.hospital_cover })}
          {field('extras_cover', 'Extras cover level', { options: OPTIONS.extras_cover })}
          {field('payment_frequency', 'Payment frequency', { options: OPTIONS.payment_frequency })}
          {values.payment_frequency === 'Yearly' && field('annual_discount', 'Annual-payment discount (%)', { type: 'number', min: 0, max: 10, step: 'any', hint: '0–10%. Applies to the yearly total only.' })}
        </div>
        {values.payment_frequency === 'Monthly' && <p className="info-note">Monthly payments do not receive the annual discount.</p>}
        {field('notes', 'Notes (optional)', { type: 'textarea' })}
      </section>
      {submitError && <p role="alert" className="error-banner">{submitError}</p>}
      <div className="form-actions"><p>Save to view the estimate.</p><div><Link className="button secondary" to={quote ? `/quotes/${quote.id}` : '/quotes'}>Cancel</Link><button type="submit" disabled={pending}>{pending ? 'Saving…' : quote ? 'Save changes' : 'Save quote'}</button></div></div>
    </form>
  </div>;
}
