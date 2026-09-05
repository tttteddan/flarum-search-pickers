/**
 * Search modal: make the 筛选项 (gambit options) list collapsible. An injected
 * `fas fa-caret-up` icon in the section header toggles it; collapsed by
 * default, remembered per browser tab.
 *
 * Moved here from `teddan/tweaks` because it and the pickers are the same
 * surface and have to agree: the collapsed rule hides every
 * `.SearchModal-options > li` that isn't the header, which would hide a picker
 * row too. Whenever a picker is on screen the list is force-expanded (and the
 * toggle hidden) — the user just asked for that row, so there is nothing to
 * collapse.
 *
 * Done with plain DOM + a MutationObserver rather than by patching
 * `SearchModal`, so it keeps working regardless of how that component's
 * internals change. Styling lives in resources/less/forum.less.
 */

const KEY = 'flarumSearchFilterCollapse.expanded';
const TOGGLE_CLASS = 'SearchFilterCollapse-toggle';

function isExpanded(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch (e) {
    return false;
  }
}

function setExpanded(value: boolean): void {
  try {
    sessionStorage.setItem(KEY, value ? '1' : '0');
  } catch (e) {
    /* ignore */
  }
}

function apply(): void {
  const lists = document.querySelectorAll('.SearchModal-options');
  if (!lists.length) return;

  const expanded = isExpanded();

  lists.forEach((list) => {
    // A picker row is an active interaction — never collapse it away.
    const hasPicker = !!list.querySelector('.SearchGambitPicker');

    list.classList.toggle('is-expanded', expanded || hasPicker);
    list.classList.toggle('has-picker', hasPicker);

    const header = list.querySelector(':scope > .Dropdown-header');
    if (header && !header.querySelector('.' + TOGGLE_CLASS)) {
      const icon = document.createElement('i');
      icon.className = 'fas fa-caret-up ' + TOGGLE_CLASS;
      icon.setAttribute('role', 'button');
      icon.setAttribute('tabindex', '0');
      header.appendChild(icon);
    }
  });
}

function onToggle(e: Event): void {
  const target = e.target as HTMLElement | null;
  if (!target || !target.closest) return;
  if (!target.closest('.SearchModal-options > .Dropdown-header .' + TOGGLE_CLASS)) return;

  e.preventDefault();
  e.stopPropagation();
  setExpanded(!isExpanded());
  apply();
}

export default function searchFilterCollapse(): void {
  document.addEventListener('click', onToggle, true);
  document.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') onToggle(e);
    },
    true
  );

  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(() => apply()).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  apply();
}
