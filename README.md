# ComaMasters Ranking Portal

Static website for publishing cumulative rankings from Tonamel tournament results.

## Quick publish steps (GitHub Pages)

1. Create a new GitHub repository (example: `comamasters-ranking`).
2. Commit and push this folder.
3. In GitHub, open `Settings > Pages`.
4. Set `Build and deployment` source to `GitHub Actions`.
5. Wait for the workflow `Deploy static site to GitHub Pages` to finish.

## Public URL patterns

- User site: `https://<username>.github.io/`
- Project site: `https://<username>.github.io/<repository>/`

## Admin usage

1. Open `Admin > Add tournament result`.
2. Paste rows in this format:
   `rank,player_name,points,team_name(optional)`
3. Add one line per player result.
4. The site updates `Overall Ranking` and `Tournament Results` automatically.
5. Use `Export JSON` for backup and `Import JSON` for restore.
