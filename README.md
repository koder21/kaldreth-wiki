# Kaldreth Wiki

This folder is a separate static website, not part of the Godot client.

## What it contains

- `index.html` for the page shell
- `styles.css` for the responsive UI
- `app.js` for client-side search, spoilers, and calculators
- `data/wiki-data.json` for generated game data
- `scripts/export_wiki_data.py` for regenerating the JSON from the game source files

## How to deploy

Serve or publish the `wiki/` folder by itself on any static host:

- GitHub Pages
- Netlify
- Cloudflare Pages
- any plain file host

The wiki does not depend on the Godot build at runtime. The game lives under `client/`, so this site stays separate unless you intentionally link to it later.

## Regenerate data

Run:

```bash
python3 wiki/scripts/export_wiki_data.py
```

Then publish the updated `wiki/data/wiki-data.json` with the site.
