import { Link } from 'react-router';
import { useResource, money } from './api.js';
import { PageStatus } from './App.jsx';

export default function QuoteList() {
  const state = useResource('/api/quotes');
  if (state.loading || state.error) return <PageStatus {...state} />;
  const quotes = state.data.quotes;
  return <>
    <div className="page-heading list-heading"><div><h1>Quotes</h1><p>Saved health insurance estimates.</p></div><span className="count-label">{quotes.length} saved {quotes.length === 1 ? 'quote' : 'quotes'}</span></div>
    {quotes.length ? <section className="quote-table-wrap" aria-label="Saved quotes"><table className="quote-table">
      <thead><tr><th scope="col">Customer</th><th scope="col">Cover</th><th scope="col">Monthly estimate</th><th scope="col">Payment</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
      <tbody>{quotes.map(quote => <tr key={quote.id}>
        <td><Link className="customer-link" to={`/quotes/${quote.id}`}>{quote.customer_name}</Link><small>Quote #{quote.id}</small></td>
        <td><span className="badge">{quote.cover_type}</span></td>
        <td className="amount">{money(quote.breakdown.monthly_premium_cents)}<small>per month</small></td>
        <td>{quote.payment_frequency}</td>
        <td className="row-actions"><Link to={`/quotes/${quote.id}`} aria-label={`View quote for ${quote.customer_name}`}>View →</Link><Link to={`/quotes/${quote.id}/edit`} aria-label={`Edit quote for ${quote.customer_name}`}>Edit</Link></td>
      </tr>)}</tbody>
    </table></section> : <section className="empty-state"><h2>No saved quotes</h2><p>Create a quote to calculate the monthly and yearly premiums.</p><Link className="button" to="/quotes/new">New quote</Link></section>}
    <p className="list-note">Monthly estimates exclude the annual-payment discount.</p>
  </>;
}
