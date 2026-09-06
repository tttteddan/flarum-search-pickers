# Search Pickers

[![Latest Stable Version](https://img.shields.io/packagist/v/teddan/search-pickers.svg)](https://packagist.org/packages/teddan/search-pickers)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A Flarum extension that turns the "type the exact date / type the tag slug"
friction in the search dropdown into click-to-pick controls, and collapses the
filter list by default so it stays out of the way.

Front-end only — there is no backend. The pickers just write the same gambit
text you would have typed by hand (`created:…`, `tag:…`), so results are
identical to the built-in filters.

Successor to `annonny/flarum-date-filter` (Flarum 1.x), rebuilt for Flarum 2.0.

## Features

- **Date picker** — when you type `created:` in the search box, a calendar row
  appears. Pick a single day or a range on a [flatpickr](https://flatpickr.js.org)
  calendar; the query is filled in for you.
  - Picking one day writes `created:2024-09-01` (matches the whole day). It is
    never written as `created:2024-09-01..2024-09-01`, which Flarum core treats
    as an empty range.
- **Tag picker** — when you type `tag:`, every tag you can see is listed by its
  display name and colour. Click one to filter by it. A filter box appears once
  there are more than eight tags. *(Requires the [Tags](https://github.com/flarum/tags)
  extension; the picker simply doesn't appear without it.)*
- **Collapsed by default** — the search filter list starts collapsed behind a
  caret, remembered per browser tab. It expands automatically while a picker is
  on screen.

Any gambit the extension doesn't handle (`is:`, `author:`, gambits from other
extensions) is left completely untouched.

## Installation

```sh
composer require teddan/search-pickers
```

## Updating

```sh
composer update teddan/search-pickers
php flarum cache:clear
```

## Localization

English and Simplified Chinese (`zh-Hans`) are bundled. Contributions for other
languages are welcome.

## Links

- [Packagist](https://packagist.org/packages/teddan/search-pickers)
- [GitHub](https://github.com/tttteddan/flarum-search-pickers)
- [Discuss](https://discuss.flarum.org/)
- [Report an issue](https://github.com/tttteddan/flarum-search-pickers/issues)

## Credits

- [teddan](https://github.com/tttteddan) — Flarum 2.0 rewrite and the tag /
  collapse features
- [Annonny](https://discuss.flarum.org/u/Annonny) — the original Date Filter
  extension

## License

[MIT](LICENSE)
