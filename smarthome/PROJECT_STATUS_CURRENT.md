# Smart Home AI — Current Authoritative Status

**Updated:** 2026-07-16  
**Canonical evidence:** `research/results/canonical/canonical_results.json`

This file is the current project summary. Historical handoff/progress files do
not override this document, the canonical evidence JSON, or
`docs/CANONICAL_DOCUMENT_MAP.md`.

## Implemented in the current source

### Mobile app and user experience

- React Native/Expo app with dashboard, rooms/devices, quota, forecast,
  assistant/chat and account flows.
- Shared design tokens, semantic icons, accessibility labels/states, responsive
  layouts and inline authentication errors.
- Secure token storage, show/hide password, keyboard configuration for
  login/chat and hidden bottom tabs while the keyboard is open. The current
  Android `KeyboardAvoidingView` path still fails its frontend contract and
  requires regression correction before it is called verified.
- Explicit loading, success and error states for user-facing actions.

### Backend, security and PLC software contract

- Server-side sessions with logout revocation, expiry and suspended-user checks;
  bearer-only user API authentication and a separate telemetry credential.
- Home-scoped RBAC, configured CORS origins, login rate limiting, audit logging
  and fail-closed telemetry ingestion.
- Serialized PLC I/O, independent status-feedback verification, physical-device
  home isolation, idempotent repeated commands and per-device scene results.
- Collector retry backoff; mock fallback is not persisted as real telemetry in
  automatic mode.
- SQLite and PostgreSQL-compatible stores behind the Flask Backend. The app does
  not access the database or PLC directly.

### Forecast service and research pipeline

- Real-model Python forecast contract and an explicitly sample-only Node server.
- Model artifact manifest verification by SHA-256/size, request-size limits,
  malformed-timestamp rejection, unsupported-model rejection and explicit
  sample-source metadata.
- Canonical result generation, reproducible figures, a hardware trial
  collector/analyzer and evidence-safe paper/thesis working drafts.
- Real retraining is deliberately not simulated: the endpoint returns HTTP 501.

## Verification run on 2026-07-16

- TypeScript/JavaScript lint gate: passed.
- Python compilation gate: passed.
- Backend security/control tests: 16/16 passed.
- Forecast contracts: 6 Python tests and 2 Node tests passed.
- Research baseline/statistics tests: 5/5 passed.
- Admin audit tests: 5/5 passed; room-presentation unit tests: 3/3 passed.
- Frontend contract: **16/20 passed**. Four regressions remain: room screens do
  not consume the shared room-presentation helper/accessibility labels; some
  room text is not valid accented Vietnamese; login/chat do not follow the one
  approved Android keyboard path; and RoomsScreen does not consume the shared
  AppTheme tokens.

The forecast runtime also reports serialization-version warnings for XGBoost
and scikit-learn artifacts. Contracts pass, but artifacts should be exported in
the pinned runtime format before a production claim.

## Current canonical forecast evidence

- Dataset used in the current run: UCI Individual Household Electric Power
  Consumption; 507,970 raw rows, 8,761 hourly rows and 8,401 supervised rows.
- Evaluation: expanding rolling origin, 2 folds, seeds 42 and 3407; 0.2 kW MAPE
  denominator floor.
- Best recorded model: XGBoost — MAE 0.4855 kW, RMSE 0.6475 kW, MAPE 66.24%,
  R² 0.2219 and mean inference time 0.1776 ms/sample.
- XGBoost improves MAE over Seasonal Naive 24h by about 9.8%, but improves over
  Random Forest by only about 1.2%. The present evidence supports a preliminary
  public-dataset benchmark, not a claim of dominant or locally validated AI.

Evidence flags remain:

- `publicDatasetBenchmark = true`
- `localMfm384Benchmark = false`
- `realHardwareLatency = false`
- `automaticLoadShedding = false`

## Academic artifact readiness

- Canonical paper: `outputs/20260712-smart-home-research/HEMS_Paper_Canonical.docx`.
  It is a concise evidence-safe working draft, not yet submission-ready.
- Canonical thesis:
  `outputs/20260712-smart-home-research/Smart_Home_Thesis_CTUT_Appendix_II.docx`.
  It remains a working draft with missing author/advisor metadata, incomplete
  subsections, duplicated results and stale wording.
- The three current figures are readable but insufficient as the complete
  evidence set. Architecture and provenance figures explain the design; the
  aggregate MAE/RMSE chart does not prove app-to-PLC response or local accuracy.
- Required additions: command-feedback sequence, app loading/success/error/
  timeout evidence, actual-vs-predicted forecasting, per-horizon errors and
  real-hardware latency distributions when genuine measurements exist.

## Deliberately disabled, incomplete or unproven

- Automatic load shedding is hard-disabled by a safety gate.
- Physical PLC/MFM384 latency and load-shedding trials are pending.
- Local Cần Thơ forecast accuracy is pending genuine MFM384 data.
- SMS/push notification and software lockout/tagout are not established by the
  current canonical evidence and must not be presented as implemented.
- LoRA/Unsloth remains a research direction until model artifacts, training
  logs, runtime configuration and reproducible evaluation are preserved.
- Multi-worker PLC access is prohibited; the current server requires one worker.
- A successfully built test APK is not automatically a production release;
  release signing, target-device testing and production network configuration
  remain separate gates.

## Evidence policy

`research/results/canonical/canonical_results.json` is the authority for
experimental claims. A claim whose evidence flag is `false` must be described
as a limitation, implementation status or future work. Software contract tests
must not be substituted for physical measurements.

## Required before thesis/paper submission

- Fill all author, student, advisor, faculty and program metadata.
- Complete the empty research-question, requirements and test-scenario sections.
- Remove duplicated result paragraphs and repair punctuation/numbering issues.
- Reconcile the related-work table with the bibliography and verify every DOI or
  bibliographic record against a primary source.
- Add the minimum persuasive figures listed above and regenerate the canonical
  DOCX/PDF outputs only after the text and evidence are frozen.
- Increase the forecast evaluation to at least 5 rolling folds with multiple
  seeds; add horizon-wise errors and actual-vs-predicted plots.

## Required before real-load operation

- Verified electrical schematic and TIA Portal project.
- Critical-load classification, physical interlock and manual override.
- Safe test load, emergency-stop procedure and recovery test.
- At least 30 valid hardware trials per condition with preserved raw logs.
- Approved evidence gate for any automatic control claim.

Passing software tests does not make this prototype production-ready or
electrically certified.
