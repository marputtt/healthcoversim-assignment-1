import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { money, request, useResource } from './api.js';
import { PageStatus } from './App.jsx';

export default function QuoteDetail() {
  const { id } = useParams();
  const state = useResource(`/api/quotes/${id}`);
  const [pending, setPending] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const navigate = useNavigate();
  if (state.loading || state.error) return <PageStatus {...state} />;
  const q = state.data;
  const b = q.breakdown;
  async function remove() {
    if (!window.confirm(`Delete the quote for ${q.customer_name}? This cannot be undone.`)) return;
    setPending(true);
    setDeleteError('');
    try {
      await request(`/api/quotes/${q.id}`, { method: 'DELETE' });
      navigate('/quotes');
    } catch (error) { setDeleteError(error.message); setPending(false); }
  }
  return <>
    <Link className="back-link" to="/quotes">← All quotes</Link>
    <div className="page-heading detail-heading"><div><p className="eyebrow">Quote #{q.id} · {q.cover_type} cover</p><h1>{q.customer_name}</h1><p>{q.hospital_cover} hospital · {q.extras_cover} extras · {q.payment_frequency} payment</p></div><div className="detail-actions"><Link className="button secondary" to={`/quotes/${q.id}/edit`}>Edit quote</Link><button type="button" className="text-button danger" onClick={remove} disabled={pending}>{pending ? 'Deleting…' : 'Delete quote'}</button></div></div>
    {deleteError && <p className="error-banner" role="alert">{deleteError}</p>}
    <section className={`estimate-grid ${q.payment_frequency === 'Monthly' ? 'monthly-grid' : ''}`} aria-label="Premium estimates">
      <div className="estimate"><p>Monthly premium</p><strong>{money(b.monthly_premium_cents)}</strong><small>per month, before any yearly discount</small></div>
      <div className="estimate"><p>Yearly before discount</p><strong>{money(b.yearly_before_discount_cents)}</strong><small>monthly premium × 12</small></div>
      {q.payment_frequency === 'Yearly' && <div className="estimate final-estimate"><p>Yearly after {b.annual_discount_applied_percent}% discount</p><strong>{money(b.yearly_after_discount_cents)}</strong><small>your final yearly estimate</small></div>}
    </section>
    {q.payment_frequency === 'Monthly' && <p className="payment-note">You selected Monthly payment. The annual-payment discount is not applied.</p>}
    {b.warnings.length > 0 && <aside className="warning-box" role="status"><h2>Unknown cover history</h2>{b.warnings.map(warning => <p key={warning}>{warning}</p>)}</aside>}
    <div className="detail-grid">
      <section className="panel breakdown"><h2>Premium breakdown</h2><dl>
        <div><dt>Hospital cover<small>{q.hospital_cover} · loading included per applicant</small></dt><dd>{money(b.hospital_total_cents)}</dd></div>
        <div><dt>Extras cover<small>{q.extras_cover} · {b.applicants.length} adult{b.applicants.length === 1 ? '' : 's'}</small></dt><dd>{money(b.extras_total_cents)}</dd></div>
        {q.cover_type === 'Family' && <div><dt>Family upgrade fee<small>Added once, per month</small></dt><dd>{money(b.family_fee_cents)}</dd></div>}
        <div className="subtotal"><dt>Monthly total</dt><dd>{money(b.monthly_premium_cents)}</dd></div>
        <div><dt>Yearly before discount<small>Monthly total × 12</small></dt><dd>{money(b.yearly_before_discount_cents)}</dd></div>
        {q.payment_frequency === 'Yearly' && <div><dt>Annual-payment discount<small>{b.annual_discount_applied_percent}% of the yearly amount</small></dt><dd>−{money(b.discount_amount_cents)}</dd></div>}
        <div className="final-line"><dt>Final {b.final_period.toLowerCase()} payment</dt><dd>{money(b.final_premium_cents)}</dd></div>
      </dl></section>
      <section className="panel explanation"><h2>Calculation</h2><p>{b.explanation}</p><div className="lhc-statement">{b.lhc_statement}</div><p className="hint">The simulator uses simplified pricing and LHC rules.</p></section>
    </div>
    <section className="panel applicant-panel"><div className="section-heading"><div><h2>Hospital cover, per applicant</h2><p>{q.hospital_cover} base price: {money(b.applicants[0].hospital_base_cents)} per adult per month.</p></div></div><div className="table-scroll"><table className="applicant-table"><thead><tr><th scope="col">Applicant</th><th scope="col">Age</th><th scope="col">Cover history</th><th scope="col">LHC loading</th><th scope="col">Hospital / month</th></tr></thead><tbody>{b.applicants.map(a => <tr key={a.applicant_number}><th scope="row">Applicant {a.applicant_number}</th><td>{a.age}</td><td>{a.cover_history}</td><td>{a.lhc_loading_percent}%</td><td className="amount">{money(a.hospital_premium_cents)}</td></tr>)}</tbody></table></div></section>
    {q.notes && <section className="notes-section"><h2>Notes</h2><p>{q.notes}</p></section>}
    <p className="saved-date">Created {new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(q.created_at))}</p>
  </>;
}
