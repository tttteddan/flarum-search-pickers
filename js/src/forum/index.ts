import app from 'flarum/forum/app';
import applyGambitPickers from './overrides/gambitPickers';
import searchFilterCollapse from './searchFilterCollapse';

app.initializers.add('teddan/search-pickers', () => {
  applyGambitPickers();
  searchFilterCollapse();
});
