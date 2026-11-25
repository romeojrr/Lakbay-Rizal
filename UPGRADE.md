# Upgrading Lakbay Rizal to v2.3

This upgrade adds:
- longer stories in chapters
- close-up talking portraits
- harder quizzes
- XP, ranks and achievements
- Rizal as your guide
- save-code backups
- a Filipino language option
- the VT323 font
- a new layout and more animation

## 1. Save your current work
In your project folder, run:
```
git add .
git commit -m "Before v2.3 upgrade"
```

## 2. Copy the upgrade files in
Unzip `lakbay-rizal-v2.3-upgrade.zip` **into your project folder**. That is the same folder where you run `claude`. Allow it to replace `SRS.md` and `CLAUDE.md`.

It only adds or replaces these files:
- `SRS.md`, `CLAUDE.md`, `UPGRADE.md`
- `content/stops.v3.json`, `content/guide.json`, `content/gamification.json`
- the five files in `content/i18n/`
- `assets/portraits/`: 24 portrait sheets
- `art-tools/portraits.py`
- `prompts/U1.md` to `prompts/U8.md`

Your code in `src/` and `public/` is not touched. Claude Code moves the new files in during U2 and U3.

## 3. Run the eight upgrade steps
Start Claude Code in the project folder:
```
claude
/model opus
/effort high
```
Then, for each step from U1 to U8:
1. Press **Shift+Tab** until you see **plan mode**.
2. Open `prompts/U1.md` (then U2, U3 and so on). Copy everything under the line and paste it.
3. Read the plan. Approve it, or ask for changes.
4. Let it build. Then test with `npm run dev` (set `INCLUDE_DRAFTS=true` so the draft stops show).
5. If it works, commit:
   ```
   git add .
   git commit -m "U1 done"
   ```
6. Type `/clear` and go on to the next step.

If something breaks, describe what you see, for example "the portrait doesn't blink on mobile". You can also undo everything since the last commit with `git checkout .`.

## 4. What the team still needs to check
SRS §13 lists everything. The most important items:
- **Facts.** Every stop is still `draft`. Check each one against two sources, then set it to `verified`. The `verifyNotes` on each stop say what to check.
- **Filipino.** Claude wrote the Filipino text as a draft. A fluent teacher should review the files in `content/i18n/` and then change `"status": "draft"` to `"reviewed"`.
- **Dramatized lines.** A teacher should approve the imagined lines. Lines marked `recorded` are Rizal's real words, taken from public-domain books.
- **Portraits.** Compare Rizal, Teodora, Blumentritt, Luna, Viola and Seiko with old photographs. To change one, edit `art-tools/portraits.py` and run it again.
