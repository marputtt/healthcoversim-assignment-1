import test from 'node:test';
import assert from 'node:assert/strict';
import { validateQuoteInput } from '../shared/quoteInput.js';
import { calculateQuote } from '../server/pricing.js';

const single = {
  customer_name: 'Jamie Lee', cover_type: 'Single',
  applicant1_age: 30, applicant1_cover_history: 'No',
  applicant2_age: null, applicant2_cover_history: null,
  hospital_cover: 'Basic', extras_cover: 'Basic',
  payment_frequency: 'Monthly', annual_discount: 0, notes: '',
};
const family = {
  ...single, cover_type: 'Family', applicant1_age: 40,
  applicant2_age: 35, applicant2_cover_history: 'Yes',
  hospital_cover: 'Silver', extras_cover: 'Standard',
  payment_frequency: 'Yearly', annual_discount: 5,
};

test('worked example calculates separate costs and the annual-only discount', () => {
  const result = calculateQuote(family);
  assert.deepEqual(result.applicants.map(a => a.lhc_loading_percent), [20, 0]);
  assert.deepEqual(result.applicants.map(a => a.hospital_premium_cents), [19200, 16000]);
  assert.equal(result.hospital_total_cents, 35200);
  assert.equal(result.extras_total_cents, 9000);
  assert.equal(result.family_fee_cents, 3000);
  assert.equal(result.monthly_premium_cents, 47200);
  assert.equal(result.yearly_before_discount_cents, 566400);
  assert.equal(result.yearly_after_discount_cents, 538080);
  assert.equal(result.discount_amount_cents, 28320);
  assert.equal(result.final_premium_cents, 538080);
  assert.equal(result.final_period, 'Yearly');
  assert.equal(result.lhc_statement, 'Lifetime Health Cover loading applies only to hospital cover. It does not apply to extras cover.');
  assert.ok(result.explanation.length > 0);
});

const cases = [
  ['age 30 has no loading', {}, 0, 11500, 138000],
  ['age 31 starts at 2 percent', { applicant1_age: 31, extras_cover: 'None' }, 2, 9180, 110160],
  ['prior cover removes loading', { applicant1_age: 40, applicant1_cover_history: 'Yes', hospital_cover: 'Silver', extras_cover: 'Standard' }, 0, 20500, 246000],
  ['extras-only has no loading', { applicant1_age: 70, hospital_cover: 'None', extras_cover: 'Premium' }, 0, 7000, 84000],
  ['unknown history is not charged loading', { applicant1_age: 40, applicant1_cover_history: 'Not sure', hospital_cover: 'Gold', extras_cover: 'None' }, 0, 22000, 264000],
  ['simulator has no real-world loading cap', { applicant1_age: 100, hospital_cover: 'Gold', extras_cover: 'None' }, 140, 52800, 633600],
  ['explicit None options produce zero base price', { hospital_cover: 'None', extras_cover: 'None' }, 0, 0, 0],
];
for (const [name, change, loading, monthly, yearly] of cases) {
  test(name, () => {
    const result = calculateQuote({ ...single, ...change });
    assert.equal(result.applicants[0].lhc_loading_percent, loading);
    assert.equal(result.monthly_premium_cents, monthly);
    assert.equal(result.yearly_before_discount_cents, yearly);
  });
}
test('couple uses each loading independently without a family fee', () => {
  const result = calculateQuote({ ...family, cover_type: 'Couple', applicant2_cover_history: 'No' });
  assert.deepEqual(result.applicants.map(a => a.lhc_loading_percent), [20, 10]);
  assert.equal(result.hospital_total_cents, 36800);
  assert.equal(result.monthly_premium_cents, 45800);
  assert.equal(result.family_fee_cents, 0);
});
test('monthly quotes do not use a supplied annual discount', () => {
  const result = calculateQuote({ ...family, payment_frequency: 'Monthly' });
  assert.equal(result.monthly_premium_cents, 47200);
  assert.equal(result.yearly_after_discount_cents, null);
  assert.equal(result.discount_amount_cents, 0);
  assert.equal(result.annual_discount_applied_percent, 0);
  assert.equal(result.final_premium_cents, 47200);
});
test('unknown histories produce separate warnings even without hospital cover', () => {
  const result = calculateQuote({ ...family, hospital_cover: 'None', applicant1_cover_history: 'Not sure', applicant2_cover_history: 'Not sure' });
  assert.equal(result.monthly_premium_cents, 12000);
  assert.equal(result.warnings.length, 2);
  assert.match(result.warnings[0], /Applicant 1.*inaccurate/);
  assert.match(result.warnings[1], /Applicant 2.*inaccurate/);
  assert.deepEqual(result.applicants.map(a => a.lhc_loading_percent), [0, 0]);
});
test('decimal annual discounts round once and line items reconcile', () => {
  const result = calculateQuote({ ...single, applicant1_age: 31, extras_cover: 'None', payment_frequency: 'Yearly', annual_discount: 5.25 });
  assert.equal(result.yearly_before_discount_cents, 110160);
  assert.equal(result.yearly_after_discount_cents, 104377);
  assert.equal(result.discount_amount_cents, 5783);
});
for (const [discount, expected] of [[0, 566400], [10, 509760]]) {
  test(`annual discount ${discount}% is accepted at boundary`, () => {
    assert.equal(calculateQuote({ ...family, annual_discount: discount }).yearly_after_discount_cents, expected);
  });
}
for (const [tier, cents] of [['None', 0], ['Basic', 9000], ['Bronze', 12000], ['Silver', 16000], ['Gold', 22000]]) {
  test(`hospital ${tier} uses the specified per-adult price`, () => {
    assert.equal(calculateQuote({ ...single, hospital_cover: tier, extras_cover: 'None' }).monthly_premium_cents, cents);
  });
}
for (const [tier, cents] of [['None', 0], ['Basic', 2500], ['Standard', 4500], ['Premium', 7000]]) {
  test(`extras ${tier} uses the specified per-adult price`, () => {
    assert.equal(calculateQuote({ ...single, hospital_cover: 'None', extras_cover: tier }).monthly_premium_cents, cents);
  });
}
test('validation trims names and removes inactive or untrusted fields', () => {
  const result = validateQuoteInput({ ...single, customer_name: '  Jamie Lee  ', applicant2_age: 90, applicant2_cover_history: 'No', annual_discount: 5, premium: -1 });
  assert.deepEqual(result.errors, {});
  assert.equal(result.input.customer_name, 'Jamie Lee');
  assert.equal(result.input.applicant2_age, null);
  assert.equal(result.input.applicant2_cover_history, null);
  assert.equal(result.input.annual_discount, 0);
  assert.equal('premium' in result.input, false);
});
const invalid = [
  ['blank name', { customer_name: '   ' }, 'customer_name'],
  ['missing cover type', { cover_type: '' }, 'cover_type'],
  ['invalid hospital tier', { hospital_cover: 'Platinum' }, 'hospital_cover'],
  ['missing extras selection', { extras_cover: '' }, 'extras_cover'],
  ['missing cover history', { applicant1_cover_history: '' }, 'applicant1_cover_history'],
  ['invalid payment', { payment_frequency: 'Weekly' }, 'payment_frequency'],
  ...[-1, 0, 17, 101, 30.5, '', null, '30', false].map(age => [`invalid age ${String(age)}`, { applicant1_age: age }, 'applicant1_age']),
  ...[-1, 10.01, '5', '', Infinity, NaN].map(discount => [`invalid discount ${String(discount)}`, { annual_discount: discount }, 'annual_discount']),
  ['non-text notes', { notes: 123 }, 'notes'],
  ['missing second age', { cover_type: 'Couple', applicant2_cover_history: 'Yes' }, 'applicant2_age'],
  ['missing second history', { cover_type: 'Family', applicant2_age: 35 }, 'applicant2_cover_history'],
];
for (const [name, change, field] of invalid) {
  test(`validation rejects ${name}`, () => {
    const result = validateQuoteInput({ ...single, ...change });
    assert.equal(result.input, null);
    assert.ok(result.errors[field]);
  });
}
test('age boundaries and decimal discounts remain valid', () => {
  for (const age of [18, 100]) assert.deepEqual(validateQuoteInput({ ...family, applicant1_age: age, annual_discount: 5.255 }).errors, {});
});
test('malformed input objects are rejected without throwing', () => {
  for (const body of [null, [], false, 'quote']) {
    const result = validateQuoteInput(body);
    assert.equal(result.input, null);
    assert.ok(result.errors.form);
  }
});
