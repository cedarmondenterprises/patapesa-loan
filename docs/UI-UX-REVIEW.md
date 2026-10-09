# PataPesa: interface research, teardown and redesign

Reviewed 19 September 2026. Scope: public site, estimator, registration, sign-in, application, customer account, support and staff workspace. This is an expert review of source code and interface behaviour, not a user study or a claim of higher conversion. References are established examples selected for relevant patterns, not a ranking of lenders or financial recommendations.

## Research and what it changes

| Reference                                                                                                                                                                  | Observed pattern                                                                                                                 | PataPesa decision                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Monzo loans](https://monzo.com/loans)                                                                                                                                     | Explains costs, borrower control and help alongside its offer. Includes a representative example and eligibility qualifications. | Show principal, interest, fees and total together. Keep uncertainty beside the action. Do not copy claims about instant approval, no fees or credit scores.                                                   |
| [Nationwide loans](https://www.nationwide.co.uk/loans/)                                                                                                                    | Separates the calculator, personalised quote and application. Helps customers compare amounts and terms.                         | Let people explore before registering and preserve their estimate into the application. Distinguish estimates from final terms.                                                                               |
| [Upstart personal loans](https://www.upstart.com/personal-loans)                                                                                                           | One main rate-check action, a staged process and detailed explanations of costs and credit inquiries.                            | Give each stage a specific action label. Do not imply PataPesa performs a soft credit check or guarantees a decision time.                                                                                    |
| [Equity Kenya borrowing](https://equitygroupholdings.com/ke/borrow/)                                                                                                       | Organises borrowing around customer circumstances and product purpose.                                                           | Use plain Kenyan borrowing language, KES and relevant requirements. A broad bank menu is unnecessary for a three-product service.                                                                             |
| [Kelley Gordon, Nielsen Norman Group](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)                                                                    | Explains hierarchy through contrast, scale and grouping.                                                                         | One dominant decision per section; supporting content is quieter. Use whitespace and rules before adding more panels.                                                                                         |
| [Nick Babich, Designing Efficient Web Forms](https://www.smashingmagazine.com/2017/06/designing-efficient-web-forms/)                                                      | Discusses labels, structure, inputs and actions, drawing on usability practice.                                                  | Persistent labels, logical groups and readable controls. Avoid placeholder-only support inputs and long forms inside a modal.                                                                                 |
| [GOV.UK question pages](https://design-system.service.gov.uk/patterns/question-pages/) and [check answers](https://design-system.service.gov.uk/patterns/check-answers/)   | Task-focused questions and a review before submission.                                                                           | Move loan application to an inline page, focus the step heading and keep a review stage. Existing backend-required registration fields stay available.                                                        |
| [GOV.UK error summary](https://design-system.service.gov.uk/components/error-summary/)                                                                                     | Errors explain what to fix and support recovery.                                                                                 | Explicit rate-loading errors, retry actions, persistent labels and visible incomplete staff refreshes. A comprehensive field-linked server-error summary remains a follow-up.                                 |
| [WCAG contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | Contrast and usable pointer targets are measurable constraints.                                                                  | Target 4.5:1 for normal text; primary controls are at least 44–48px tall. The 44px design target is stricter than the WCAG 2.2 AA 24px minimum, which has exceptions. No claim of full WCAG certification.    |
| [web.dev Core Web Vitals](https://web.dev/articles/vitals)                                                                                                                 | Defines loading, responsiveness and layout-stability measures.                                                                   | Prefer system fonts and CSS; avoid decorative video, new animation packages and third-party font requests. Field targets: p75 LCP ≤2.5s, INP ≤200ms, CLS ≤0.1. Production field measurements remain required. |

Tala and KCB pages were attempted but could not be retrieved. LendingClub redirected to an unverified destination and was excluded. No unavailable page is presented as an inspected reference. Competitor research covered public content, not private authenticated lending flows.

## Teardown: the problems beneath the appearance

| Area                    | Finding in the previous implementation                                                                        | Impact                                                                           | Response                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Brand system            | Navy/blue public colours, green staff colours, orange utility accents and several historical CSS corrections. | Pages look assembled from different systems.                                     | Shared deep-green action palette, warm neutral background and consistent logo treatment.                            |
| Hierarchy               | Repeated numbered headings, large claims and equally prominent controls.                                      | Scanning becomes harder; secondary elements compete with the borrowing decision. | Clear introduction, estimator, preparation and support sequence. Reserve large serif type for introductory content. |
| Estimator integrity     | Hard-coded product defaults survive a failed API request silently.                                            | A current-looking estimate can use stale product data.                           | Remove default rates; explicit loading, unavailable and retry states. Calculate only from returned products.        |
| Estimate continuity     | Homepage sends everyone to registration without passing selected values.                                      | Users must repeat work and may apply for different terms.                        | Carry product ID, amount and term to the application; restore a matching draft.                                     |
| Amount input            | Slider-only interaction.                                                                                      | Difficult to choose an exact amount on a phone.                                  | Add a labelled numeric input, range limits and validation alongside the slider.                                     |
| Application structure   | Long two-step form inside a modal without modal focus containment.                                            | Nested scrolling and difficult keyboard/mobile navigation.                       | Full-page form, focusable step heading and a separate cost summary.                                                 |
| Cost language           | Annual interest shown without distinguishing flat interest from APR.                                          | Users may compare unlike rates.                                                  | Label the existing calculator's flat-rate method explicitly. Do not invent an APR calculation.                      |
| Registration            | Four stages exist, but weak step emphasis and generic campaign sidebar.                                       | A complex personal-information task lacks orientation.                           | Smaller context panel, coherent step header, keyboard focus movement and review preserved.                          |
| Sign-in                 | Continuation to the application is not carried into the registration link.                                    | New users lose the task they were doing.                                         | Registration accepts only the supported loan continuation and returns to the saved draft.                           |
| Account shell           | Public acquisition navigation remains prominent after login.                                                  | Returning customers have irrelevant calls to action.                             | Account-oriented navigation and in-page shortcuts to sections that actually exist.                                  |
| Customer feedback       | Message colour inferred from only the word “failed”.                                                          | Some failure messages appear successful.                                         | Expand failure detection. A typed notice model is preferable in a future state-management cleanup.                  |
| Support                 | Inputs rely on placeholders and submission lacks a busy guard.                                                | Labels disappear during typing; repeated submissions are possible.               | Persistent labels, autocomplete, busy state and announced feedback.                                                 |
| Staff mobile navigation | Desktop navigation becomes several horizontal strips; footer/logout hidden.                                   | Staff tasks are difficult to find on phones.                                     | Collapsible mobile navigation, active-state semantics and accessible logout inside the menu.                        |
| Staff freshness         | Failed secondary queries return null while the header still says live data.                                   | Staff may act on incomplete data without noticing.                               | Explicit partial-refresh warning and retry. Preserve existing records rather than fabricate replacements.           |
| Information pages       | Sparse generic copy and unsupported `prose` styling utility.                                                  | Important process explanations look unfinished.                                  | Explicit information-page styles, substantive process guide and task-based FAQ.                                     |
| Trust                   | Brand styling can imply assurances the product has not established.                                           | A polished UI could mislead.                                                     | No invented licences, customer counts, awards, ratings, testimonials or guaranteed approval times.                  |

## Information architecture and flow

Public navigation: **Loan options / How it works / Help centre**, with Sign in and Get an estimate. Customer navigation: **My account / Loan options / Support**. Staff navigation retains permission-based groups for workspace, lending and operations.

Primary journey:

1. Explore current products and estimate repayment.
2. Continue with the selected amount and term.
3. Complete purpose, repayment source and existing commitments.
4. Review costs and answers.
5. Sign in or create an account if required; return to the tab's saved application.
6. Submit once and receive a reference.
7. Follow identity/application review in the account.
8. For a disbursed loan, use the repayment schedule and payment history.

Explicit states: loading, product unavailable, validation failure, saved draft, signed out, expired session, submitting, submitted, pending review, rejected/needs correction and confirmed payment. Marketing copy must never imply that a pending or submitted record is an approval or settled payment.

A formal offer and agreement-acceptance workflow is **not added by this UI change**. Product/legal owners must define final terms, disclosures and acceptance evidence, followed by separately tested backend enforcement. A review of application answers is not a substitute for a loan agreement. Disbursement controls and existing business rules are unchanged.

## Visual system

| Role                | Decision                                              | Reason                                                                                                         |
| ------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Brand/heading       | `#16332F`                                             | Strong quiet anchor for navigation and key headings.                                                           |
| Primary action/link | `#176B55`                                             | One deliberate action colour; white label contrast is checked.                                                 |
| Main text           | `#202D29`                                             | Softer than pure black while maintaining strong contrast.                                                      |
| Supporting text     | `#56655E`                                             | Readable supporting information, not faint grey.                                                               |
| Page                | `#F7F8F5`                                             | Neutral background separates white working surfaces.                                                           |
| Surface             | `#FFFFFF`                                             | Forms and operational tables remain clear.                                                                     |
| Tinted area         | `#EDF4F0`                                             | Secondary grouping for cost context and selected options.                                                      |
| Borders             | `#DCE2DC`                                             | Structural separators; never the only focus or state signal.                                                   |
| Fonts               | System sans for UI; Georgia for introductory headings | Native performance, consistent numerals, restrained editorial character. No externally hosted font dependency. |
| UI body/control     | 16px default; 14px supporting UI                      | Readability at phone sizes. Dense tables use 13px; review with real staff.                                     |
| Intro headings      | 38–58px desktop; about 30–42px mobile                 | Marketing hierarchy without oversized app headings.                                                            |
| Corners             | 5–8px                                                 | One functional radius family rather than pills on every object.                                                |
| Spacing             | 8px-based rhythm, with 20/24/32px content padding     | Consistent grouping and comfortable touch interaction.                                                         |
| Numbers             | Tabular numerals for costs and metrics                | Stable comparison when values change.                                                                          |
| Motion              | Brief interaction feedback; reduced-motion support    | Avoid animation competing with financial information.                                                          |

The visual choices are design judgments informed by the research, not scientific proof that green or serif headings produce trust. Trust primarily depends on accurate costs, clear terms, reliable actions and reachable support.

## Engineering and release discipline

- Work from the logout fix; do not replace or revert server-tracked sessions.
- No backend financial formula, pricing, eligibility, permissions or payment mutation changes in this redesign.
- Preserve backend product IDs, request IDs and application declarations.
- Treat URL inputs and restored drafts as untrusted: clamp amount and term to current product limits.
- Optional browser storage must not crash registration or the application.
- Keep identity numbers/passwords out of registration drafts.
- Use semantic headings, labels, fieldsets, native disclosures and visible focus.
- Preserve the existing administrative audit and confirmation workflows.
- Keep transactional application space free of advertising placements; advertising administration is unchanged.
- Compare mobile and desktop, unavailable API states and a return from sign-in. Mock data used for tests must be clearly identified in the test record.
- Run frontend/admin type checks, lint, production builds and existing authentication regression tests.
- Keep rollout in a review branch; publish no claim that live production has been tested from this environment.

## Follow-up work requiring additional evidence

1. Moderate task-based sessions with Kenyan first-time borrowers and staff, including lower-end Android devices and slow connections. Measure completion, confusion, errors and recovery, not aesthetic preference alone.
2. Instrument estimate → application → account → submission with consent-respecting events; establish a baseline before comparing conversion.
3. Define a field-error API contract and replace message-text classification with typed error states throughout.
4. Implement a separately specified final-offer/acceptance workflow, if required by the lending product.
5. Consolidate remaining historical CSS and duplicate API-client behaviour incrementally behind regression checks. This change introduces shared tokens and scoped components; it is not a claim that all legacy CSS is removed.
6. Measure actual production Core Web Vitals and perform assistive-technology review. Builds and screenshots do not prove those outcomes.

## Validation record

Final browser verification: 20 September 2026.

The customer and staff portals pass TypeScript checks, lint and production builds. All 48 backend tests across six suites pass, including session and logout regressions.

`scripts/ui-review.cjs` runs Playwright against production builds with explicitly synthetic API fixtures. It checks estimate continuity, application review and refresh recovery, registration return to the application, sign-in return, submission, logout, unavailable rates and retry, mobile menus, staff partial-refresh feedback, and horizontal overflow at 1440, 390 and 320px. No browser runtime errors occurred in that run. These checks do not submit real applications or prove production authentication, payment processing or lending compliance.

Screenshots in `docs/ui-review/` show synthetic products and customer information. Visual inspection identified and corrected footer contrast, overlapping mobile controls and a cramped mobile application heading.

To reproduce, install Playwright and its Chromium browser in your test environment, start the frontend production server on port 3300 and the admin server on port 3301, then run:

```bash
node scripts/ui-review.cjs
```

Set `UI_REVIEW_FRONTEND`, `UI_REVIEW_ADMIN` or `UI_REVIEW_OUTPUT` to override the defaults. Playwright is a development prerequisite for this standalone script, not a new runtime dependency. The checked-in script also supports an optional `CHROMIUM_MODULE` path for environments using `@sparticuz/chromium`.

Release this after the authentication/session fix in PR #24. This review branch is based on that fix and does not revert it. Production deployment and live customer acceptance testing remain outstanding.

### Review screenshots

- [Homepage, desktop](ui-review/home-desktop.png)
- [Registration, 320px](ui-review/registration-320.png)
- [Application, 320px](ui-review/application-320.png)
- [Staff overview, desktop](ui-review/admin-desktop.png)
