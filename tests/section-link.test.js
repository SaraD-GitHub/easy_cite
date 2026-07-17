const assert = require('node:assert');
const { buildSectionLink } = require('../assets/js/scripts.js');

// typical section link
assert.strictEqual(
  buildSectionLink({
    origin: 'https://example.com',
    pathname: '/easy_cite/',
    styleguide: 'apa',
    tabPaneId: 'sgt-2',
    dataBsTarget: '#subtype-7',
  }),
  'https://example.com/easy_cite/?styleguide=apa&tab=stn-2&accordion=subtype-7'
);

// first chapter / first section (index 0)
assert.strictEqual(
  buildSectionLink({
    origin: 'https://example.com',
    pathname: '/easy_cite/',
    styleguide: 'chicagoa',
    tabPaneId: 'sgt-0',
    dataBsTarget: '#subtype-0',
  }),
  'https://example.com/easy_cite/?styleguide=chicagoa&tab=stn-0&accordion=subtype-0'
);

// param order must be styleguide, tab, accordion
const url = buildSectionLink({
  origin: 'https://x',
  pathname: '/',
  styleguide: 's',
  tabPaneId: 'sgt-5',
  dataBsTarget: '#subtype-9',
});
assert.ok(url.indexOf('styleguide=') < url.indexOf('tab=') && url.indexOf('tab=') < url.indexOf('accordion='),
  'params must be in order styleguide, tab, accordion');

console.log('section-link: all assertions passed');
