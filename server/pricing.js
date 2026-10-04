const HOSPITAL = { None: 0, Basic: 9000, Bronze: 12000, Silver: 16000, Gold: 22000 };
const EXTRAS = { None: 0, Basic: 2500, Standard: 4500, Premium: 7000 };
const money = cents => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100);

// Called only with validated inputs; all base prices are per adult, per month.
export function calculateQuote(input) {
  const count = input.cover_type === 'Single' ? 1 : 2;
  const base = HOSPITAL[input.hospital_cover];
  const warnings = [];
  const applicants = Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    const age = input[`applicant${n}_age`];
    const history = input[`applicant${n}_cover_history`];
    const loading = base > 0 && history === 'No' && age > 30 ? (age - 30) * 2 : 0;
    if (history === 'Not sure') {
      warnings.push(`Applicant ${n}: Cover history is unknown. LHC loading has not been applied. This quote may be inaccurate.`);
    }
    return {
      applicant_number: n, age, cover_history: history,
      lhc_loading_percent: loading, hospital_base_cents: base,
      hospital_premium_cents: base * (100 + loading) / 100,
    };
  });
  const hospital = applicants.reduce((sum, a) => sum + a.hospital_premium_cents, 0);
  const extras = EXTRAS[input.extras_cover] * count;
  const fee = input.cover_type === 'Family' ? 3000 : 0;
  const monthly = hospital + extras + fee;
  const yearly = monthly * 12;
  const discount = input.payment_frequency === 'Yearly' ? input.annual_discount : 0;
  const after = input.payment_frequency === 'Yearly' ? Math.round(yearly * (100 - discount) / 100) : null;
  return {
    applicants,
    hospital_total_cents: hospital, extras_total_cents: extras, family_fee_cents: fee,
    monthly_premium_cents: monthly, yearly_before_discount_cents: yearly,
    annual_discount_applied_percent: discount, yearly_after_discount_cents: after,
    discount_amount_cents: after === null ? 0 : yearly - after,
    final_premium_cents: after === null ? monthly : after,
    final_period: input.payment_frequency,
    warnings,
    lhc_statement: 'Lifetime Health Cover loading applies only to hospital cover. It does not apply to extras cover.',
    explanation: `${count} adult${count === 1 ? '' : 's'} ${count === 1 ? 'is' : 'are'} counted. Hospital cover is calculated separately for each adult using their own LHC loading. Extras cover is ${money(EXTRAS[input.extras_cover])} per adult per month. ${fee ? 'Family cover adds $30.00 per month once for dependent children. ' : ''}These amounts add up to ${money(monthly)} per month. The yearly amount before discount is the monthly premium multiplied by 12. ${after === null ? 'Monthly payment receives no annual-payment discount.' : `Yearly payment applies a ${discount}% discount to the yearly amount, giving ${money(after)} for the year.`}`,
  };
}
