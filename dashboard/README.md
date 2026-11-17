# Securas Control — standalone presentation demo

This folder reproduces the **actual admin interface** from `bassem-ch007/securas-inference/control/ui` with a browser-only mock API. It runs without login, FastAPI, PostgreSQL, Ansible, LiteLLM, Docker or a reachable inference host.

## Run

From the presentation repository root:

```bash
python3 -m http.server 8000
```

On Windows: `py -m http.server 8000`.

Visit **http://localhost:8000/dashboard/** (the trailing slash matters with `python -m http.server`). The presentation's `#/dashboard` section provides an entry point as well.

## Navigation

The sidebar includes **Overview, Workers, Models, Profiles, Operations, Users, Groups, Grants, API Keys**. Mocked actions simulate model installation/copy, profile check/up/down, access administration and key generation; operation logs appear in the normal UI. All changes reset on refresh.

## Sources and truthfulness

- `app.js` and `app.css`: copies adapted from the private Securas Inference production admin UI.
- `mock-api.js`: example data shaped for the production API, **not a live snapshot**.
- Real catalog/profile names and host allocations come from `docs/reference/current-production-inventory.md` at the time this demo was built.
- Worker photographs use the presentation repo's existing `assets/hardware-reference/` files.
- User records and API keys are fictitious. Runtime utilization, temperatures, capacity and operations are simulated.
- No real key or credential is present, no requests to inference/production services, and no state persists.
- Do not deploy this demo as a production admin app: it intentionally bypasses authentication.

## How it works

`mock-api.js` intercepts **only** `/api/v1/` browser fetch calls and returns local JSON responses that the original interface expects. Other static file requests remain ordinary browser requests. No dependency installation or bundling required.
