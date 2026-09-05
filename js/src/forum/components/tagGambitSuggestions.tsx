import app from 'flarum/forum/app';
import classList from 'flarum/common/utils/classList';
import type Mithril from 'mithril';

import type { GambitValueApplier } from '../overrides/gambitPickers';

let loadStarted = false;
let loadDone = false;

/**
 * Local filter text, kept out of the query string entirely — it only narrows
 * which rows this list shows, it never touches `tag:`'s value. Reset once a tag
 * is picked so the picker starts blank next time.
 */
let filterText = '';

/** Only bother with a filter box once the list gets long. */
const FILTER_THRESHOLD = 8;

/**
 * The picker shown when the search token is `tag:` (in any language): every
 * visible tag, by display name and colour, in one scrollable box (~8 rows tall)
 * — nothing is hidden behind a "type to see more". Clicking a tag writes its
 * *slug* into the query.
 *
 * The rows live inside a single `Dropdown-message` `<li>` so they can share one
 * scroll container. That does take them out of `SearchModal`'s arrow-key
 * rotation (which only walks direct `.Dropdown-menu > li` children) — the
 * trade for being able to show a forum's full tag list without stretching the
 * dropdown to the floor.
 *
 * Soft dependency on `flarum/tags`: returns `null` (→ stock suggestions) unless
 * `app.tagList` is present. Nothing is imported from `flarum/tags` — the tag
 * models are read straight out of the store.
 */
export default function tagGambitSuggestions(apply: GambitValueApplier): Mithril.Children[] | null {
  const tagList = (app as any).tagList;
  if (!tagList || typeof tagList.load !== 'function') return null;

  const tags: any[] = (app.store.all('tags') as any[]) || [];

  if (!tags.length) {
    if (!loadStarted) {
      loadStarted = true;
      tagList
        .load()
        .then(() => {
          loadDone = true;
          m.redraw();
        })
        .catch(() => {
          loadStarted = false;
        });
    }

    // Loaded and there genuinely are no tags — hand back to the stock list.
    if (loadDone) return null;

    return [<li className="Dropdown-message SearchGambitPicker-loading">{app.translator.trans('teddan-search-pickers.forum.tag.loading')}</li>];
  }

  const sorted = tags.slice().sort((a, b) => {
    const ac = a.isChild() ? 1 : 0;
    const bc = b.isChild() ? 1 : 0;
    if (ac !== bc) return ac - bc;
    return (a.position() ?? 0) - (b.position() ?? 0);
  });

  const needle = filterText.trim().toLowerCase();
  const matched = needle ? sorted.filter((tag) => tag.name().toLowerCase().includes(needle)) : sorted;

  return [
    <li className="Dropdown-message SearchGambitPicker SearchGambitPicker--tag">
      {sorted.length > FILTER_THRESHOLD && (
        <input
          type="text"
          className="FormControl SearchGambitPicker-tagFilter"
          value={filterText}
          placeholder={app.translator.trans('teddan-search-pickers.forum.tag.filter_placeholder') as string}
          onkeydown={(e: KeyboardEvent) => {
            // Never let Enter here bubble into `SearchModal`'s <form onsubmit>.
            if (e.key === 'Enter') e.preventDefault();
          }}
          oninput={(e: Event) => {
            filterText = (e.target as HTMLInputElement).value;
            m.redraw();
          }}
        />
      )}

      <div className="SearchGambitPicker-tagList">
        {matched.map((tag) => {
          const color: string | null = tag.color();

          return (
            <button
              type="button"
              className="SearchGambitPicker-tagRow"
              onclick={() => {
                filterText = '';
                apply(tag.slug(), true);
              }}
            >
              <span
                className={classList(
                  'TagLabel',
                  'SearchGambitPicker-tagLabel',
                  color && 'colored',
                  color && contrastClass(color),
                  tag.isChild() && 'TagLabel--child'
                )}
                style={color ? { '--tag-bg': color } : undefined}
              >
                <span className="TagLabel-text">
                  <span className="TagLabel-name">{tag.name()}</span>
                </span>
              </span>
            </button>
          );
        })}

        {!matched.length && <div className="SearchGambitPicker-empty">{app.translator.trans('teddan-search-pickers.forum.tag.no_matches')}</div>}
      </div>
    </li>,
  ];
}

/**
 * Mirror of core's `textContrastClass` (YIQ brightness) without pulling in the
 * `isDark` helper, which reads a CSS custom property we'd have to guarantee.
 */
function contrastClass(hex: string): string {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (h.length < 6) return 'text-contrast--unchanged';

  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  return yiq < 128 ? 'text-contrast--light' : 'text-contrast--dark';
}
