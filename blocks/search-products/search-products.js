// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'Big Mac®', description: 'Two 100% beef patties, cheese, lettuce, onion, pickles and the unbeatable Big Mac sauce.', image_url: 'https://www.mcdonalds.com.sg/sites/default/files/2023-02/1200x1200_MOP_BBPilot_BigMac_0.png', price: '558 Cal.', category: 'Burgers' },
  { name: 'Triple Cheeseburger', description: 'Three beef patties layered with melty cheese.', image_url: 'https://www.mcdonalds.com.sg/sites/default/files/2024-12/%5BBE%5D%201200x1200_MOP_TripleCB.png', category: 'Burgers' },
  { name: 'Quarter Pounder® with Cheese', description: 'A quarter pound of 100% beef topped with cheese.', image_url: 'https://www.mcdonalds.com.sg/sites/default/files/2023-02/1200x1200_MOP_BBPilot_QPC.png', category: 'Burgers' },
  { name: 'Double Quarter Pounder® with Cheese', description: 'Two quarter-pound beef patties with cheese.', image_url: 'https://www.mcdonalds.com.sg/sites/default/files/2023-02/1200x1200_MOP_BBPilot_QPCDbl.png', category: 'Burgers' },
  { name: 'Cheeseburger', description: 'A classic beef patty with a slice of melty cheese.', image_url: 'https://www.mcdonalds.com.sg/sites/default/files/2023-02/1200x1200_MOP_BBPilot_Cheeseburger_1.png', category: 'Burgers' },
  { name: 'McCrispy®', description: 'A crispy chicken fillet in a soft potato bun.', image_url: 'https://www.mcdonalds.com.sg/sites/default/files/2025-10/1200x1200_MOP_McCrispy_Sgl_nobg_1.png', category: 'Burgers' },
  { name: 'McSpicy®', description: 'The signature fiery, crispy chicken thigh fillet burger.', image_url: 'https://www.mcdonalds.com.sg/sites/default/files/2023-02/1200x1200_MOP_BBPilot_McSpicy.png', category: 'Burgers' },
  { name: 'Double McSpicy®', description: 'Two fiery, crispy chicken thigh fillets.', image_url: 'https://www.mcdonalds.com.sg/sites/default/files/2023-02/1200x1200_MOP_BBPilot_McSpicyDbl.png', category: 'Burgers' },
  { name: 'Filet-O-Fish®', description: 'A steamed fish fillet with cheese and tartar sauce.', image_url: 'https://www.mcdonalds.com.sg/sites/default/files/2023-02/1200x1200_MOP_BBPilot_FOF.png', category: 'Burgers' },
  { name: 'McChicken®', description: 'A tender chicken patty with a savoury sauce.', image_url: 'https://www.mcdonalds.com.sg/sites/default/files/2023-02/1200x1200_MOP_BBPilot_McChicken.png', category: 'Burgers' },
];

// Brand palette from BuildWidgetRequest.
const PALETTE = ['#ffbc0d', '#db0007'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m; }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

const ACCENT = PALETTE[0] || '#2563eb';
const CARD_COLORS = ['#378ef0', '#9256d9', '#0fb5ae', '#e68619', '#d83790', '#2dca72', '#4046ca', '#72b340'];

export default async function decorate(block, bridge) {
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.products — bare array outputSchema; key derived from actionName "search_products"
      items = structuredContent?.products || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderItems(block, items, bridge);

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

function renderItems(block, items, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'search-products-wrapper';

  const track = document.createElement('div');
  track.className = 'search-products-track';

  (items || []).slice(0, 10).forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'search-products-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'search-products-image';

    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };
    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.loading = 'lazy';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => { if (img.parentNode) img.parentNode.replaceChild(colorDiv(), img); };
      imageContainer.appendChild(img);
    } else {
      imageContainer.appendChild(colorDiv());
    }
    card.appendChild(imageContainer);

    const info = document.createElement('div');
    info.className = 'search-products-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'search-products-badge';
      badge.textContent = item.category;
      badge.style.cssText = `background:${ACCENT};`;
      info.appendChild(badge);
    }

    const title = document.createElement('h3');
    title.className = 'search-products-title';
    title.textContent = item.name || '';
    info.appendChild(title);

    if (item.price) {
      const price = document.createElement('span');
      price.className = 'search-products-price';
      price.textContent = item.price;
      info.appendChild(price);
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'search-products-cta';
    btn.textContent = 'View Details';
    btn.style.cssText = `background:${ACCENT};`;
    if (bridge) {
      btn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${item.name}`);
      });
    }
    info.appendChild(btn);

    card.appendChild(info);
    track.appendChild(card);
  });

  wrapper.appendChild(track);

  const fade = document.createElement('div');
  fade.className = 'search-products-fade';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);

  const mkArrow = (dir) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `search-products-arrow search-products-arrow-${dir}`;
    b.setAttribute('aria-label', dir === 'left' ? 'Scroll left' : 'Scroll right');
    b.textContent = dir === 'left' ? '◀' : '▶';
    const scrollBy = () => {
      const card = track.querySelector('.search-products-card');
      const amount = card ? card.offsetWidth + 16 : 236;
      track.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    };
    b.addEventListener('click', scrollBy);
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollBy(); }
    });
    return b;
  };
  const leftArrow = mkArrow('left');
  const rightArrow = mkArrow('right');
  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  const updateArrows = () => {
    const maxScroll = track.scrollWidth - track.clientWidth - 1;
    leftArrow.style.display = track.scrollLeft <= 1 ? 'none' : 'flex';
    rightArrow.style.display = track.scrollLeft >= maxScroll ? 'none' : 'flex';
    fade.style.display = track.scrollLeft >= maxScroll ? 'none' : 'block';
  };
  track.addEventListener('scroll', updateArrows);
  requestAnimationFrame(updateArrows);

  block.appendChild(wrapper);
}
