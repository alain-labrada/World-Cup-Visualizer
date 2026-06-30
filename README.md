# World-Cup-Visualizer

Interactive FIFA World Cup radial bracket with drag-and-drop progression between stages:

- Outer ring: Round of 32
- Inner rings: Round of 16, Round of 8, Semifinal, Final
- Center: Cup + winner

## Features

- Uses the 2026 FIFA World Cup Round-of-32 teams and pairings on the outer ring.
- Drag selected winners from one stage into the next stage drop slots.
- Click a team flag in a matchup to mark that team as the winner before dragging.
- Connector lines show each matchup pair and the inward path toward the next round.
- Automatic browser persistence using `localStorage` so your latest bracket is restored on next load.
- `Reset to Round of 32` to restore the official Round-of-32 start state.

## Run Locally

Open `index.html` in your browser.

Alternative design page:

- Open `classic.html` for the classic knockout-board style inspired by social media bracket graphics.

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. In GitHub, go to **Settings -> Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select your default branch (for example, `main`) and folder `/ (root)`.
5. Save and wait for GitHub Pages to publish.

Because this project is static HTML/CSS/JS, it works directly on GitHub Pages with no build step.