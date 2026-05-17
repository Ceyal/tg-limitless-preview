# GitHub Setup Manual Steps — TG Limitless Preview

Local preview repo is ready at:

`C:\Users\Eyal\Desktop\בוקר טוב GOOD MORNING\Tone_Generator TG\tg-limitless-preview-repo`

Local git commit: **done** (branch `main`).

GitHub CLI (`gh`) was not available in this environment. Complete GitHub Pages setup manually:

## 1. Create GitHub repository

1. Open https://github.com/new
2. Repository name: `tg-limitless-preview`
3. Visibility: **Public** (recommended for free GitHub Pages fixed URL)
4. Do **not** initialize with README, .gitignore, or license (local repo already has content)
5. Create repository

## 2. Push local preview repo

From PowerShell:

```powershell
cd "C:\Users\Eyal\Desktop\בוקר טוב GOOD MORNING\Tone_Generator TG\tg-limitless-preview-repo"
git remote add origin https://github.com/<YOUR_GITHUB_USER>/tg-limitless-preview.git
git branch -M main
git push -u origin main
```

Replace `<YOUR_GITHUB_USER>` with your GitHub username.

## 3. Enable GitHub Pages

1. Open repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / folder: `/ (root)`
4. Save

Wait 1–3 minutes for the first deploy.

## 4. Fixed preview URL

After Pages is enabled:

`https://<YOUR_GITHUB_USER>.github.io/tg-limitless-preview/`

## 5. Future updates

1. Replace `index.html` with newly accepted candidate
2. Copy candidate into `candidates/`
3. Update `VERSION.json`
4. Replace `reports/latest/` with latest 5 review files
5. Commit and push to `main`

## Safety reminders

- Push **only** this preview folder — never the full TG project
- Do not commit secrets, tokens, PERSONAL_MASTER, or reference folders
- Preview is not production, not perfect, not 2027/2033 achieved
