# Weather Intelligence

A React and Vite weather app that searches for a city using Open-Meteo's public
geocoding API, then displays current conditions, a seven-day forecast, a high/low
temperature chart, and a simple planning recommendation. No API key is required.

## Requirements

Run the Node.js and Docker commands below from **Ubuntu WSL**, as required by the
assignment. Use Docker Engine inside WSL; Docker Desktop is not part of this workflow.

- Node.js LTS and npm installed in Ubuntu WSL
- Docker Engine installed and running in Ubuntu WSL
- Internet access to Open-Meteo

Check the environment from the WSL terminal:

```bash
pwd
node -v
npm -v
docker --version
docker ps
```

Keep the project in the WSL Linux filesystem (for example, `~/projects/weather-intelligence`),
not under `/mnt/c`.

## Run locally

From the project directory in Ubuntu WSL:

```bash
npm ci
npm run dev
```

Open the URL Vite prints in the terminal (default: http://localhost:3000). The app
loads Chennai initially. Search for another city to refresh current conditions and
the forecast.

## Build and run with Docker

From the project directory in Ubuntu WSL:

```bash
docker build -t weather-intelligence .
docker run --rm --name weather-intelligence -p 8080:8080 weather-intelligence
```

Open http://localhost:8080. The container's Nginx server provides a health endpoint
at http://localhost:8080/health, which returns `ok`.

Stop the container with `Ctrl+C`.

## Container configuration

- `Dockerfile` uses Node.js to install locked dependencies and build the static Vite
  app, then copies only the build output into an Nginx runtime image.
- `.dockerignore` excludes local dependencies, generated output, Git metadata, and
  local environment files from the build context.
- `nginx.conf` serves the single-page app on port 8080, supports client-side routes,
  and provides `/health`.

## Validation checklist

Run these checks in Ubuntu WSL and retain genuine terminal/browser evidence:

1. Search for Chennai and a second valid city; confirm location, current conditions,
   recommendation, all seven forecast days, and the temperature chart appear.
2. Search for a made-up city; confirm a clear city-not-found message appears.
3. Refresh the browser while the Docker container is running; confirm the app loads.
4. Open `/health`; confirm the response is `ok`.

### Validation performed for this update

On 2026-10-31 in Ubuntu 22.04 on WSL 2:

- `npm ci` and `npm run build` completed successfully.
- `docker build -t weather-intelligence .` completed successfully, and the container
  served the app on port 8080.
- Browser checks passed for Chennai and London, including the seven-day forecast and
  high/low chart. A made-up city displayed the city-not-found message.
- `http://localhost:8080/health` returned `ok`.

The images currently in `evidence/` were supplied with the project and show the earlier
five-day UI without the chart. They are not evidence of the updated seven-day chart; capture
fresh screenshots from the final app before submission. Google AI Studio creation evidence
and the app link are separate learner-owned rubric items; do not claim them based on these
local files.

## Troubleshooting

- If weather cannot load, check internet access and retry; the app uses the public
  Open-Meteo geocoding and forecast APIs directly from the browser.
- If Docker is unavailable, confirm Docker Engine is installed and running inside
  Ubuntu WSL with `docker ps`. Follow the assignment's WSL/Docker setup guide if needed.
- If port 8080 is already in use, publish another host port, for example
  `docker run --rm -p 8081:8080 weather-intelligence`, then open
  http://localhost:8081.
