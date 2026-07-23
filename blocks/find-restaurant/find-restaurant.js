// synthetic fixture — no sample data available from Action Planner
// Sample data for standalone/preview mode. In production, data comes dynamically
// from bridge.toolResult. Fields mirror the outputSchema: name, address, hours, services.
const SAMPLE_DATA = [
  {
    name: "McDonald's Bugis Junction",
    address: '200 Victoria St, #01-01, Singapore 188021',
    hours: 'Open 24 Hours',
    services: ['24 Hours', 'McCafé', 'McDelivery'],
  },
  {
    name: "McDonald's Orchard Central",
    address: '181 Orchard Rd, #01-16, Singapore 238896',
    hours: 'Mon–Sun: 7:00 AM – 11:00 PM',
    services: ['Breakfast', 'McCafé', 'Dessert Kiosk'],
  },
  {
    name: "McDonald's Jurong Point",
    address: '1 Jurong West Central 2, #01-58, Singapore 648886',
    hours: 'Open 24 Hours',
    services: ['Drive-Thru', '24 Hours', 'McDelivery'],
  },
];

// Brand palette from BuildWidgetRequest. getThemedCardBg() darkens palette[0]
// to luminance <= 0.12 so white text keeps WCAG AA contrast.
const PALETTE = ['#ffbc0d', '#db0007'];
function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (r, g, b) => 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m; }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let stores;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      stores = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.restaurants — bare array outputSchema; key derived from actionName "find_restaurant"
      stores = structuredContent?.restaurants || [];
    }
  } else {
    stores = SAMPLE_DATA;
  }

  block.textContent = '';
  render(block, stores, bridge);

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}

function pinIcon(color) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', color);
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p1.setAttribute('d', 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z');
  const c1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c1.setAttribute('cx', '12'); c1.setAttribute('cy', '10'); c1.setAttribute('r', '3');
  svg.appendChild(p1); svg.appendChild(c1);
  return svg;
}

function renderEmpty(block, bridge) {
  const card = document.createElement('div');
  card.className = 'find-restaurant-search';
  card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

  const pinWrap = document.createElement('div');
  pinWrap.className = 'find-restaurant-empty-pin';
  pinWrap.appendChild(pinIcon(theme?.fg ?? '#fff'));
  card.appendChild(pinWrap);

  const heading = document.createElement('h3');
  heading.className = 'find-restaurant-empty-title';
  heading.textContent = 'Find a store near you';
  card.appendChild(heading);

  const form = document.createElement('form');
  form.className = 'find-restaurant-form';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'find-restaurant-input';
  input.placeholder = 'Enter ZIP code...';
  input.setAttribute('aria-label', 'Area or postal code');
  form.appendChild(input);

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'find-restaurant-btn';
  btn.textContent = 'Find Nearby';
  form.appendChild(btn);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = input.value.trim();
    if (!val) return;
    if (bridge) bridge.sendMessage(`Find a McDonald's near ${val}`);
  });

  card.appendChild(form);
  block.appendChild(card);
}

function render(block, stores, bridge) {
  if (!stores || stores.length === 0) {
    renderEmpty(block, bridge);
    return;
  }

  const row = document.createElement('div');
  row.className = 'find-restaurant-results';

  stores.slice(0, 2).forEach((store) => {
    const card = document.createElement('div');
    card.className = 'find-restaurant-card';
    card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    const pin = document.createElement('div');
    pin.className = 'find-restaurant-pin';
    pin.appendChild(pinIcon(theme?.fg ?? '#fff'));
    card.appendChild(pin);

    const name = document.createElement('h3');
    name.className = 'find-restaurant-name';
    name.textContent = store.name || '';
    card.appendChild(name);

    if (store.address) {
      const addr = document.createElement('p');
      addr.className = 'find-restaurant-address';
      addr.textContent = store.address;
      card.appendChild(addr);
    }

    if (store.hours) {
      const hours = document.createElement('p');
      hours.className = 'find-restaurant-hours';
      hours.textContent = store.hours;
      card.appendChild(hours);
    }

    if (Array.isArray(store.services) && store.services.length) {
      const chips = document.createElement('div');
      chips.className = 'find-restaurant-chips';
      store.services.slice(0, 4).forEach((s) => {
        const chip = document.createElement('span');
        chip.className = 'find-restaurant-chip';
        chip.textContent = s;
        chips.appendChild(chip);
      });
      card.appendChild(chips);
    }

    if (bridge) {
      const btn = document.createElement('button');
      btn.className = 'find-restaurant-more';
      btn.textContent = 'Details';
      btn.addEventListener('click', () => bridge.sendMessage(`Tell me more about ${store.name}`));
      card.appendChild(btn);
    }

    row.appendChild(card);
  });

  block.appendChild(row);
}
