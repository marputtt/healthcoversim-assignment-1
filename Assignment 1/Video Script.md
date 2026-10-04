# HealthCoverSim Video Script

**Presenter: Marsya Putra · Target: about 4 minutes · Required duration: 3–5 minutes**

Record the working app with readable text and audible narration. This is a recording script, not the submitted video. Practise the actions once, then adjust pauses to stay within the required duration.

## Before recording

- Start the app and open `/quotes`. Create a fresh demonstration quote during the recording; avoid deleting other saved quotes.
- Keep this script beside the browser. Use the example values below; the amounts must match the screen.
- Record the screen and your own narration. Review the final recording for duration, sound and completion of every required action.

## 0:00–0:20 — Introduction and list

**On screen:** Show Quotes, then click **New quote**.

> Hello, I am Marsya Putra. This is HealthCoverSim, my Cloud Web Class Assignment 1. It uses React for the interface, Express for the backend, and SQLite to store quotes in one table. I will create a quote, explain its calculation, edit it, and delete it.

## 0:20–1:20 — Create Family quote

**On screen:** Enter:

| Field | Value |
| --- | --- |
| Customer name | Assignment Demo |
| Cover type | Family |
| Applicant 1 age / hospital cover history | 40 / No |
| Applicant 2 age / hospital cover history | 35 / Yes |
| Hospital cover level | Silver |
| Extras cover level | Standard |
| Payment frequency | Yearly |
| Annual-payment discount (%) | 5 |
| Notes | Video demonstration |

Click **Save quote**. Show the resulting detail.

> I am choosing Family cover. This counts two adults and adds a thirty-dollar monthly fee for dependent children. The simulator does not ask for children's ages.
>
> Applicant one is forty and has no previous hospital cover. Applicant two is thirty-five and has previous cover. I will select Silver hospital cover, Standard extras, and Yearly payment with a five-percent discount. Saving stores the inputs, and the backend calculates the estimate.

## 1:20–2:00 — Explain LHC and annual discount

**On screen:** Show **Hospital cover, per applicant**, then **Premium breakdown** and the three premium totals. Scroll slowly enough to read the amounts.

> Silver hospital cover costs one hundred and sixty dollars per adult per month. Applicant one's LHC loading is forty minus thirty, multiplied by two percent. That gives twenty percent, so this applicant's hospital premium is one hundred and ninety-two dollars. Applicant two has zero loading and pays one hundred and sixty dollars.
>
> Hospital cover totals three hundred and fifty-two dollars. Extras are forty-five dollars for each adult, so ninety dollars altogether. LHC applies only to hospital, not extras. Adding the thirty-dollar Family fee gives four hundred and seventy-two dollars monthly.
>
> Multiplying by twelve gives five thousand, six hundred and sixty-four dollars before discount. The five-percent annual discount saves two hundred and eighty-three dollars and twenty cents. The final yearly estimate is five thousand, three hundred and eighty dollars and eighty cents.

## 2:00–2:40 — Edit to Monthly

**On screen:** Click **Edit quote**, change **Payment frequency** to **Monthly**, click **Save changes**. Show monthly total and payment note.

> I will now edit the same saved quote and change payment to Monthly. The annual discount field disappears because that discount is only for Yearly payment.
>
> After saving, the monthly estimate is still four hundred and seventy-two dollars. The annual-payment discount is not applied. Editing updates the existing record and recalculates its breakdown.

## 2:40–3:20 — Unknown history

**On screen:** Click **Edit quote**, change **Applicant 1 hospital cover history** to **Not sure**, save. Show **Unknown cover history** and updated amounts.

> Next, I will change applicant one's hospital cover history to Not sure. The simulator applies zero loading and warns that the quote may be inaccurate. It does not assume the applicant has no previous cover.
>
> Hospital cover is now three hundred and twenty dollars. Extras and the Family fee stay the same, giving four hundred and forty dollars monthly and five thousand, two hundred and eighty dollars yearly before discount.

## 3:20–3:40 — Validation

**On screen:** Edit, clear **Applicant 2 age**, click **Save changes**, show the field error, then **Cancel**.

> Family cover requires both adults. If I remove applicant two's age, the form rejects the update and explains the missing field. The backend also validates input, so an invalid direct API request cannot change the saved quote.

## 3:40–4:00 — Delete and finish

**On screen:** Click **Delete quote**, confirm, then show the quote list without Assignment Demo.

> Finally, I will delete this demonstration quote and confirm the deletion. It is removed from the saved list. This completes create, view, update and delete. HealthCoverSim follows the assignment's simplified rules and is a learning simulator, not financial advice. Thank you.

## Recording checklist

- [ ] Recording is 3–5 minutes and narration is audible.
- [ ] Create, list/detail, edit/update and delete are visible.
- [ ] The worked example shows $472, $5,664 and $5,380.80.
- [ ] Per-applicant LHC, separate extras, Family fee and yearly discount are explained.
- [ ] Monthly change and Not sure warning are visible.
- [ ] Recording has been played back before submission.
