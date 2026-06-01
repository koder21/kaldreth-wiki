# Kaldreth Wiki Architecture

## Goal

Build a deployable, static game wiki that can ship to any normal web host without requiring a database or server runtime.

## Approach

- Use the existing GDScript data files as the source of truth.
- Export the game data into a single JSON payload during a build step.
- Serve the wiki as static HTML, CSS, and JavaScript.
- Keep all search, filtering, spoiler toggles, and calculators client-side.

## Why static

- Easy to host on GitHub Pages, Netlify, Cloudflare Pages, or any plain file host.
- No database migration or backend deployment to manage.
- Works well for game data that is mostly read-only.

## Data model

The exporter reads the literal data tables from:

- `client/data/ItemData.gd`
- `client/data/SkillData.gd`
- `client/data/QuestData.gd`
- `client/data/FactionData.gd`
- `client/data/BossDungeonData.gd`
- `client/data/PatchNotesData.gd`
- `client/data/AchievementData.gd`
- `client/data/TitleData.gd`
- `client/data/MilestoneData.gd`
- `client/data/AutoPassiveData.gd`
- `client/data/SkillTreeData.gd`
- `client/autoload/GameState.gd` for monster definitions and combat reward tables

The wiki then derives:

- item provenance and lore from source hints, drops, recipes, and quest links
- NPC pages from quest giver dialogue
- efficiency tables from XP, action time, item price, and loot values
- combat efficiency estimates from monster gold, drops, and the in-game combat XP distribution formula

## User-facing features

- Search across every entity type
- Category filters for items, monsters, quests, NPCs, skills, factions, titles, achievements, dungeons, and patch notes
- Spoiler-safe reveal controls for story and boss content
- Skill calculators for XP/hour and gp/hour
- Combat estimates for loot value, XP split, and configurable kills/hour comparisons

## Hosting notes

This layout can be deployed as-is to any static host. The generated JSON is checked into the repo so the hosted wiki does not depend on the game client at runtime.
