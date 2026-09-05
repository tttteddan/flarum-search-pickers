import app from 'flarum/forum/app';
import flatpickr from 'flatpickr';
import type { Instance as FlatpickrInstance } from 'flatpickr/dist/types/instance';
import type Mithril from 'mithril';

import type { GambitValueApplier } from '../overrides/gambitPickers';

interface Attrs {
  value: string;
  onpick: GambitValueApplier;
}

function iso(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * One calendar-icon row. Clicking it opens a flatpickr range calendar; the
 * chosen value is written straight into the search query, which is where the
 * user reads it back — so there's no text field here to keep in sync.
 *
 * flatpickr runs in `wrap` mode over the whole `<li>`: it takes its value from
 * the hidden `[data-input]`, opens/closes on `[data-toggle]`, and positions the
 * popover against the button (`positionElement`). `appendTo: document.body`
 * keeps the popover out of the dropdown's own scroll-clipping box.
 *
 * It is initialized exactly once, in `oncreate` — every redraw a pick itself
 * triggers leaves the instance (and a half-picked range) alone — and torn down
 * in `onremove`.
 *
 * Two identical dates collapse to a single-day value (`created:X`, never
 * `created:X..X`): core's `CreatedFilter` runs a single date through
 * `whereDate(created_at, '=', ...)` (the whole day), but a range through
 * `whereBetween(created_at, [from, to])` — two bare dates with no time part
 * only match rows created at exactly midnight.
 */
const DateRangeRow: Mithril.ClosureComponent<Attrs> = (initial) => {
  let attrs: Attrs = initial.attrs;
  let fp: FlatpickrInstance | null = null;

  const handleChange = (dates: Date[]) => {
    if (!dates.length) return;

    if (dates.length === 1) {
      attrs.onpick(iso(dates[0]), false);
      return;
    }

    const [a, b] = [iso(dates[0]), iso(dates[1])].sort();
    attrs.onpick(a === b ? a : `${a}..${b}`, true);
  };

  return {
    oncreate(vnode: Mithril.VnodeDOM<Attrs>) {
      attrs = vnode.attrs;

      const root = vnode.dom as HTMLElement;
      const toggle = root.querySelector('[data-toggle]') as HTMLElement;

      const defaultDate = String(attrs.value || '')
        .split('..')
        .filter(Boolean);

      fp = flatpickr(root, {
        mode: 'range',
        wrap: true,
        dateFormat: 'Y-m-d',
        maxDate: 'today',
        appendTo: document.body,
        positionElement: toggle,
        defaultDate: defaultDate.length ? defaultDate : undefined,
        onChange: handleChange,
      });

      // The row only exists because the user just picked `created:` out of the
      // options list, so go straight to the calendar. Deferred a tick: that
      // click is still bubbling towards flatpickr's own document handler, which
      // would read it as an outside-click and close us again.
      setTimeout(() => fp?.open(), 0);
    },

    onremove() {
      fp?.destroy();
      fp = null;
    },

    view(vnode: Mithril.Vnode<Attrs>) {
      attrs = vnode.attrs;

      return (
        <li className="Dropdown-message SearchGambitPicker SearchGambitPicker--date">
          <input type="text" data-input className="SearchGambitPicker-dateValue" tabindex="-1" aria-hidden="true" />
          <button type="button" data-toggle className="SearchGambitPicker-dateToggle">
            <i className="icon fas fa-calendar" aria-hidden="true" />
            <span>{app.translator.trans('teddan-search-pickers.forum.date.toggle')}</span>
          </button>
        </li>
      );
    },
  };
};

export default function dateGambitPicker(value: string, onpick: GambitValueApplier): Mithril.Children {
  return m(DateRangeRow, { value, onpick });
}
