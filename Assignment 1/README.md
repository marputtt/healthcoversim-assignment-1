# HealthCoverSim

Cloud Web Class Assignment 1 — **Marsya Putra**.

A local health insurance quote simulator built with React, Node.js/Express, SQLite and plain CSS. It supports creating, listing, viewing, editing and deleting quotes. The quote detail explains the hospital premium for each adult, extras, Family fee and annual-payment discount. All amounts are AUD.

## Install

Use **Node.js 22.23.1 or newer on a supported Node LTS release**, with npm. The `.nvmrc` records the version used for verification. SQLite runs inside the app; there is no separate database server to install.

From GitHub:

```sh
git clone https://github.com/marputtt/healthcoversim-assignment-1.git
cd "healthcoversim-assignment-1/Assignment 1"
npm ci
npm run db:init
```

The repository is private, so cloning requires an account with access. For the source ZIP, extract it and open a terminal inside the extracted `HealthCoverSim` folder, then run `npm ci` and `npm run db:init`.

All commands below run inside the application folder, which contains `package.json`.

## Run locally

Use two terminals in the application folder.

Terminal 1 — backend:

```sh
npm run dev:server
```

Terminal 2 — frontend:

```sh
npm run dev:client
```

Open **http://127.0.0.1:5173/quotes**. The backend runs at **http://127.0.0.1:3001**. Vite forwards `/api` requests to the backend. Stop each process with Ctrl+C.

For a built application served by Express, stop the development backend first, then run:

```sh
npm run build
npm start
```

Open **http://127.0.0.1:3001/quotes**. Only one server is needed in this mode. Build before starting Express so it can find the frontend files.

If port 3001 is occupied, use `PORT=3002 npm run dev:server` and `PORT=3002 npm run dev:client` in their respective terminals. For the built app, use `PORT=3002 npm start` and open port 3002. The frontend development port remains 5173.

## Database creation and persistence

`server/db.js` creates the `data/` directory and `data/quotes.sqlite`, then runs `CREATE TABLE IF NOT EXISTS`. Both `npm run db:init` and backend startup use this setup. Restarting or initialising again preserves saved quotes.

There is **one application table: `quotes`**. SQLite also maintains its internal ID sequence. Quote inputs are stored; premiums are recalculated on the backend whenever a quote is returned, so editing cannot leave a stale stored total.

| Column | Purpose |
| --- | --- |
| `id` | Automatically generated primary key |
| `customer_name` | Required customer name |
| `cover_type` | Single, Couple or Family |
| `applicant1_age` | Whole-number age from 18 to 100 |
| `applicant1_cover_history` | Yes, No or Not sure |
| `applicant2_age` | Required for Couple/Family; NULL for Single |
| `applicant2_cover_history` | Required for Couple/Family; NULL for Single |
| `hospital_cover` | None, Basic, Bronze, Silver or Gold |
| `extras_cover` | None, Basic, Standard or Premium |
| `payment_frequency` | Monthly or Yearly |
| `annual_discount` | Percentage from 0 to 10; stored as 0 for Monthly |
| `notes` | Optional text, empty by default |
| `created_at` | Automatically generated UTC creation time |

The table has SQLite type, range and selection constraints. API writes use prepared statements. Database files are excluded from Git and the submission ZIP. To use another database location, start the backend with `DATABASE_PATH=/absolute/path/quotes.sqlite npm run dev:server` (or `npm start` for the built app).

## How quotes are calculated

Base prices are per adult, per month:

| Hospital cover | None | Basic | Bronze | Silver | Gold |
| --- | ---: | ---: | ---: | ---: | ---: |
| Price | $0 | $90 | $120 | $160 | $220 |

| Extras cover | None | Basic | Standard | Premium |
| --- | ---: | ---: | ---: | ---: |
| Price | $0 | $25 | $45 | $70 |

1. Single counts one adult. Couple and Family count two adults.
2. For each adult, LHC loading is `(age − 30) × 2%` when the adult is older than 30, their history is **No**, and hospital cover is selected. Otherwise loading is 0%. The assignment simulator has no loading cap.
3. Each hospital premium is `hospital base × (1 + loading / 100)`. Add the adults' hospital premiums together.
4. Extras are `extras base × adult count`. LHC never increases extras.
5. Family adds **$30 per month once** for dependent children. Children's ages are not requested. Couple has no Family fee.
6. Monthly premium is hospital total + extras total + Family fee. Yearly before discount is monthly × 12.
7. For Yearly payment, apply the selected 0–10% discount to the yearly amount. Monthly payment receives no annual discount and its monthly base remains unchanged.

Prices are calculated in cents. The discounted yearly amount is rounded once to the nearest cent, and the displayed discount amount is the difference between the yearly totals.

**Lifetime Health Cover loading applies only to hospital cover. It does not apply to extras cover.**

**Not sure** applies no loading and displays a warning for the relevant applicant that the estimate may be inaccurate. This option can be chosen independently for each adult.

### Worked example

Create Family cover with Applicant 1 **40 / No**, Applicant 2 **35 / Yes**, **Silver** hospital, **Standard** extras, **Yearly** payment and a **5%** annual discount.

| Calculation | Result |
| --- | ---: |
| Applicant 1 LHC: (40 − 30) × 2% | 20% |
| Applicant 1 hospital: $160 × 1.20 | $192.00 |
| Applicant 2 LHC / hospital | 0% / $160.00 |
| Hospital total | $352.00 |
| Extras: $45 × 2 | $90.00 |
| Family fee | $30.00 |
| Monthly: $352 + $90 + $30 | **$472.00** |
| Yearly before: $472 × 12 | **$5,664.00** |
| Annual discount: $5,664 × 5% | $283.20 |
| Yearly after discount | **$5,380.80** |

Changing only payment to Monthly keeps **$472.00 per month** and removes the annual discount. Changing Applicant 1 history to Not sure reduces hospital to $320, giving **$440 monthly** and **$5,280 yearly before discount**, with a warning.

## Validation and API

The form and backend both validate required fields, selection values, whole-number ages 18–100 and discounts 0–10%. Couple/Family require both adults. Single clears Applicant 2 fields; Monthly clears the annual discount. Notes are optional. Invalid requests do not create or update a quote.

| Method | Endpoint | Result |
| --- | --- | --- |
| GET | `/api/quotes` | List saved quotes |
| POST | `/api/quotes` | Create and calculate a quote; 201 |
| GET | `/api/quotes/:id` | Quote inputs and calculated breakdown |
| PUT | `/api/quotes/:id` | Update inputs and recalculate |
| DELETE | `/api/quotes/:id` | Delete quote; 204 |

Invalid input returns 400 with field messages. Missing quotes return 404. Malformed JSON returns 400; request bodies larger than 32 KB return 413. The app displays loading, error and empty states, and asks for confirmation before deletion.

## Verification

Run:

```sh
npm test
npm run build
```

On 4 October 2026, **55 automated checks passed**: pricing and validation, API CRUD, persistence after reopening SQLite, invalid writes, malformed JSON and parameterised SQL handling. A fresh checkout also passed `npm ci`, database initialisation, all 55 tests and the production build. The built server returned the React page on direct quote routes and served the API correctly. These checks passed after relocating the app into `Assignment 1/`. The database integrity check returned `ok` and confirmed one application table.

Browser checks covered create/list/detail/edit/delete, the worked example, Monthly updates, Not sure warnings, missing Applicant 2, Single extras-only cover, direct detail reload and narrow/wide layouts. Dropdown arrows and form wording were revised following the owner's feedback.

The implementation covers the software portions of the rubric: CRUD and persistence, premium explanation, calculation and validation, and the interface. The submission portions still require the owner's recorded video, marker access to the private repository and LMS upload. A script is provided in [Video Script.md](Video%20Script.md). These checks do not predict a mark.

## Limitation

This uses fixed assignment prices and simplified LHC rules. It does not include insurer-specific prices, rebates, policy eligibility or the full real-world LHC rules. It is a learning simulator and is not financial advice.

## Assistance statement

OpenAI Codex assisted with assignment analysis, implementation, automated tests, browser checks, documentation and the video script. Marsya Putra reviewed the project scope and interface, requested simpler wording and aligned dropdowns, and chose to keep the project to one quote table. The automated and browser checks above were performed with Codex assistance.

The owner's personal code and calculation review, and video recording, are still pending. Before submitting, the owner should complete those checks and update this statement with the specific work personally verified or implemented. No unperformed personal implementation or testing is claimed here.
