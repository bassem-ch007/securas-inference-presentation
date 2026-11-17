# Securas Inference — Architecture Walkthrough

A dependency-free, static presentation website for a guided tour of the Securas Inference platform.

## Run locally

**Windows** (Python installed):

```powershell
cd securas-inference-presentation
py -m http.server 8000
```

**Linux / macOS:**

```bash
cd securas-inference-presentation
python3 -m http.server 8000
```

Open **http://localhost:8000**.

Alternatively, opening `index.html` directly works in most browsers because the app uses no API calls or imports, but the local server better matches deployment.

## Navigation

- Overview presents the project context and architecture layers.
- Select an item from the sidebar or click a layer card to open the section.
- Use **Right/Left arrow keys** to move between sections and **Escape** for Overview.
- Hash routes (`#/hardware`) work with static hosting such as GitHub Pages.

## Files

- `index.html`: website shell.
- `styles.css`: appearance and responsive layout.
- `app.js`: section definitions, content and navigation.
- `assets/hardware-reference/`: original reference photographs supplied for the hardware topic, preserved but intentionally not displayed yet.

## GitHub repository

Expected remote:

`git@github.com:bassem-ch007/securas-inference-presentation.git`

The repo was **not found** during initial setup. The local Git remote may be configured, but publishing requires the GitHub repository to exist and your local SSH key to have access.

Once created on GitHub, from this folder:

```bash
git add .
git commit -m "Initial static architecture walkthrough"
git push -u origin main
```

If working with the ZIP rather than the preinitialized working folder, initialize it first:

```bash
git init -b main
git remote add origin git@github.com:bassem-ch007/securas-inference-presentation.git
```

Do not commit credentials, tokens, `.env` secrets, or private deployment configs.

## Editing the content

Update the `layers` array near the top of `app.js`: title, summary, focus topics and order. The Overview and placeholder detail sections derive from this data. Hardware content and reference images remain on hold until reviewed together.
