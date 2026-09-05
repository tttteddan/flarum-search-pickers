import app from 'flarum/forum/app';
import { override } from 'flarum/common/extend';
import type Mithril from 'mithril';

import dateGambitPicker from '../components/dateGambitPicker';
import tagGambitSuggestions from '../components/tagGambitSuggestions';

export type GambitValueApplier = (value: string, done?: boolean) => void;

/**
 * Replace the "SEARCH OPTIONS" list with a click-to-pick UI whenever the token
 * under the cursor is a `created:` / `tag:` gambit (in any language). Anything
 * else falls straight through to the original implementation.
 *
 * `GambitsAutocomplete` lives in the code-split chunk that also carries
 * `SearchModal`, so we patch it through the string-path form of `override()`:
 * `flarum.reg.onLoad` re-runs our patch every time the module is (re)registered,
 * including when that chunk finally loads. Patching an eager import here would
 * only ever touch a stale copy.
 *
 * The method has no stable extension contract; if a future core refactor changes
 * its internals the `try/catch` degrades to the stock suggestion list rather
 * than breaking search.
 */
export default function applyGambitPickers(): void {
  override(
    'flarum/common/utils/GambitsAutocomplete' as any,
    'suggestions' as any,
    function (this: any, original: (query: string) => Mithril.Children[], query: any): Mithril.Children[] {
      // `suggestions()` is where core records the current query for a later
      // `suggest()` call. We short-circuit before `original` runs, so mirror that
      // one side effect ourselves.
      this.query = String(query ?? '');

      let custom: Mithril.Children[] | null = null;

      try {
        custom = buildPicker.call(this, this.query);
      } catch (e) {
        custom = null;
      }

      return custom ?? original(query);
    }
  );
}

/**
 * `this` is the `GambitsAutocomplete` instance. We only touch its documented
 * surface: `resource`, `jqueryInput()` and `suggest()`.
 */
function buildPicker(this: any, query: string): Mithril.Children[] | null {
  // Find the whitespace-delimited token the cursor sits in — the same thing
  // core's `AutocompleteReader` does with `/\S+$/`, inlined to avoid importing
  // another chunk-split internal.
  const $input = typeof this.jqueryInput === 'function' ? this.jqueryInput() : null;
  const el: HTMLInputElement | undefined = $input && $input[0];
  const cursor: number = (el && typeof el.selectionStart === 'number' ? el.selectionStart : null) ?? query.length;

  const before = query.slice(0, cursor);
  const match = before.match(/(\S+)$/);
  if (!match) return null;

  const rawToken = match[1];
  const tokenStart = cursor - rawToken.length;

  let token = rawToken.toLowerCase();
  let prefix = 0;
  if (token.startsWith('-')) {
    prefix = 1;
    token = token.slice(1);
  }

  const colon = token.indexOf(':');
  if (colon === -1) return null;

  const key = token.slice(0, colon);
  const currentValue = token.slice(colon + 1);
  const valueStart = tokenStart + prefix + colon + 1;

  const gambits: any[] = app.search.gambits.for(this.resource) || [];
  const gambit = gambits.find((g) => {
    const suggestionKey = typeof g.suggestion === 'function' ? g.suggestion()?.key : undefined;
    return typeof suggestionKey === 'string' && suggestionKey.toLowerCase() === key;
  });

  if (!gambit || typeof gambit.filterKey !== 'function') return null;

  const apply: GambitValueApplier = (value, done) => {
    // A trailing space ends the token, closing the picker and bringing back the
    // normal suggestion list. Date keeps the picker open until both ends are
    // set; tag closes on the single pick.
    this.suggest(done ? value + ' ' : value, currentValue, valueStart);
  };

  switch (gambit.filterKey()) {
    case 'created':
      return [dateGambitPicker(currentValue, apply)];

    case 'tag':
      return tagGambitSuggestions(apply);

    default:
      return null;
  }
}
