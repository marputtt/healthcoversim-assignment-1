import { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router';
import QuoteList from './QuoteList.jsx';
import QuoteForm from './QuoteForm.jsx';
import QuoteDetail from './QuoteDetail.jsx';
import { useResource } from './api.js';

export function PageStatus({ loading, error }) {
  return <div className="page-status" role={error ? 'alert' : 'status'}>
    <h1>{loading ? 'Loading…' : 'Unable to open this page'}</h1>
    <p>{error || 'Your quote will be ready in a moment.'}</p>
    {error && <Link className="button secondary" to="/quotes">Back to quotes</Link>}
  </div>;
}

function EditQuote() {
  const { id } = useParams();
  const state = useResource(`/api/quotes/${id}`);
  return state.loading || state.error ? <PageStatus {...state} /> : <QuoteForm key={id} quote={state.data} />;
}

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.getElementById('main-content')?.focus();
    window.scrollTo(0, 0);
  }, [pathname]);
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/quotes"><span className="brand-mark" aria-hidden="true">HC</span><span>HealthCoverSim<small>Private health cover simulator</small></span></Link>
        <nav aria-label="Main navigation"><Link to="/quotes" aria-current={pathname === '/quotes' ? 'page' : undefined}>All quotes</Link><Link className="button" to="/quotes/new">New quote</Link></nav>
      </div>
    </header>
    <main id="main-content" tabIndex="-1">
      <Routes>
        <Route path="/" element={<Navigate to="/quotes" replace />} />
        <Route path="/quotes" element={<QuoteList />} />
        <Route path="/quotes/new" element={<QuoteForm />} />
        <Route path="/quotes/:id/edit" element={<EditQuote />} />
        <Route path="/quotes/:id" element={<QuoteDetail />} />
        <Route path="*" element={<div className="page-status"><h1>Page not found</h1><Link to="/quotes">Back to quotes</Link></div>} />
      </Routes>
    </main>
    <footer className="site-footer"><span>HealthCoverSim</span><p>Learning simulator only. Not financial advice. All estimates are in AUD.</p></footer>
  </>;
}
