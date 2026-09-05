<?php

/*
 * This file is part of teddan/search-pickers.
 *
 * Adds visual date-range and tag pickers to the Flarum search dropdown.
 * Front-end only; it drives core's built-in `created` and tags' `tag` gambits.
 */

use Flarum\Extend;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/resources/less/forum.less'),

    new Extend\Locales(__DIR__.'/locale'),
];
