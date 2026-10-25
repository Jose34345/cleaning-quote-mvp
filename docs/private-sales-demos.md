# Three personalized private demos — configurations, NOT live links

**All three are planned, not deployed or shared.** No private `/preview/[token]` URL has been created because this new application has no isolated database and no deployed hostname. After setup, create these records using `scripts/create-business.ts` with fictional demonstration pricing and `scripts/create-preview.ts`. Do not use any real company's logo, assume endorsement, or forward lead information.

### 1) Blue Daisy Maids — Austin, TX
- Public context: https://www.bluedaisymaids.com/contact/
- Observed quote path: form/phone inquiry. Private concept should emphasize giving the visitor a preliminary range, then sending a complete intake packet to the owner.
- Personalization: service names Standard, Deep, Move; ZIP coverage configured only if business later supplies real coverage. Demo uses fictional ZIP/allowed values, not service assertions.
- Prospective objection: existing quote workflow works; owner may not want to commit to approximate prices.
- Command after dedicated DB setup: `npm run business:create -- --slug blue-daisy-concept --name "Blue Daisy Maids (unaffiliated demo)" --email <internal-test-address> --pricing scripts/example-pricing.json`, then `npm run business:preview -- --slug blue-daisy-concept`.

### 2) Gessica Cleaning Services — Austin, TX
- Public context: https://gessicacleaningservices.com/
- Observed quote path: long intake form requesting numerous details. Private concept should demonstrate shorter first-step intake, with extra details confirmed later.
- Prospective objection: their current detailed workflow may be essential for precise bids. Our lightweight form may under-qualify requests.
- Generate private link with `--slug gessica-concept` once configured. Use illustrative prices only.

### 3) Cleaned Fresh — Raleigh, NC
- Public context: https://www.cleanedfresh.com/
- Observed quote path: a specialist returns a personalized estimate within one business day. Demonstrate immediate preliminary range with continued human approval for final quote.
- Prospective objection: their estimates span residential and commercial, but our MVP only supports residential. Avoid claiming fit for commercial use.
- Generate private link with `--slug cleaned-fresh-concept` once configured. Use illustrative prices only.

## Safety and consent
- Distinct private 64-hex tokens are generated through Node crypto; only SHA-256 hashes are stored in `preview_links` and each link expires in 7 days.
- `noindex` and `robots.txt` block indexing, but private links are **bearer secrets**: anyone with the token can view the fictional demo before expiry.
- Every demo page clearly states no affiliation or endorsement; no personal lead capture or notification occurs.
