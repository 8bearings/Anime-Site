# Anime Finder

## Overview

Anime Finder is a web application built using React and TypeScript that allows users to search for and discover anime shows. The application provides a full-featured browsing experience — search with live autocomplete, browse by season or top lists, filter and sort results, view full detail pages, and save favorites for easy access later.

## Features

- **Live Search Autocomplete**: A debounced dropdown (≥3 characters) shows matching titles with thumbnails as you type. Picks a result or press Enter to search.
- **Browse Modes**: Switch between This Season, Airing, Popular, Upcoming, Top Rated, and a custom Season picker via pill-style tab navigation.
- **Filters & Sort**: Collapse the "Need Some Direction?" panel to sort by score/popularity/date, filter by status and type, set score range (min/max sliders), and filter by release year range.
- **Anime Detail Pages**: Each show has a dedicated route (`/anime/:id`) with full info — poster, synopsis, genres, studios, score, episode count, airing status, streaming services, and click-to-play trailer.
- **Random Anime Button**: Discover a surprise show instantly with the new Random anime button, which loads a fresh random detail page on each click.
- **Trailer Embeds**: YouTube trailers play inline (click-to-play thumbnail → `<iframe>`) inside both expanded cards and the detail page.
- **Favorite Anime**: Click the ♥ icon on any card or detail page to save a show. Favorites persist in `localStorage` and are accessible on the Favorites page.
- **Share Anime**: Copy a share link for any show. Old `?id=` share URLs auto-redirect to the proper detail route.
- **Streaming Services**: Available streaming platforms are listed on each expanded card and detail page (fetched from Tenra's `/anime/:id/streaming`).
- **Infinite Scroll**: Results load in pages as you scroll down, with skeleton cards shown while loading.
- **Responsive Design**: Mobile-friendly layout with adapted grid, card sizes, and detail page at 600px and below.

## Technologies Used

- **React 18** + **TypeScript** + **Vite** — SPA build toolchain
- **React Router v6** — client-side routing with GitHub Pages deep-link support
- **CSS** (no UI framework) — Oswald + Inter fonts via Google Fonts
- **Tenrai API v1** (`https://api.tenrai.org/v1`) — unofficial MyAnimeList REST API, no auth required

## Getting Started

```bash
git clone https://github.com/8bearings/Anime-Site.git
cd Anime-Site/AnimeSite
npm install
npm run dev
```

The dev server starts at `http://localhost:5173/Anime-Site`.

## Usage

- **Searching**: Type in the search bar — a dropdown of suggestions appears after 3 characters. Select one or press Enter / click Search to run a full search.
- **Browsing**: Click any pill tab at the top (This Season, Airing, Popular, etc.) to switch feed modes. Use Season ▾ to browse a specific season/year.
- **Filtering**: Open the "Need Some Direction?" panel to apply sort, status, type, score, and year filters.
- **Card details**: Click any card to expand inline (synopsis, genres, score, streaming, trailer). Click "Details →" to go to the full detail page.
- **Favoriting**: Click ♥ on a card or the detail page to save/unsave. View all saved shows on the Favorites page.
- **Random Discovery**: Use the Random anime button below the “Need Some Direction?” panel to jump directly to a random anime detail page without refreshing.

## Deployment

Deployed to GitHub Pages via `npm run deploy` (`gh-pages -d dist`). The app lives at `https://8bearings.github.io/Anime-Site`.

Deep links (e.g. `/Anime-Site/anime/123`) are handled by a custom `public/404.html` redirect + `basename="/Anime-Site"` on the router.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the [Tenrai API](https://tenrai.org/) for providing the data used in this application.
