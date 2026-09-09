/* ─── ALPHA NICHE THEME — theme.js ─────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  /* ── HEADER SCROLL ───────────────────────────────── */
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── CART DRAWER ─────────────────────────────────── */
  const cartOverlay = document.getElementById('cart-overlay');
  const cartDrawer  = document.getElementById('cart-drawer');
  const cartClose   = document.getElementById('cart-close');
  const cartCount   = document.getElementById('cart-count');

  function openCart() {
    cartOverlay?.classList.add('open');
    cartDrawer?.classList.add('open');
    document.body.style.overflow = 'hidden';
    updateCartUI();
  }

  function closeCart() {
    cartOverlay?.classList.remove('open');
    cartDrawer?.classList.remove('open');
    document.body.style.overflow = '';
  }

  cartOverlay?.addEventListener('click', closeCart);
  cartClose?.addEventListener('click', closeCart);

  document.querySelectorAll('[data-cart-trigger]').forEach(el => {
    el.addEventListener('click', openCart);
  });

  /* ── FETCH CART & UPDATE UI ──────────────────────── */
  async function updateCartUI() {
    try {
      const res  = await fetch('/cart.js');
      const cart = await res.json();
      const count = cart.item_count;

      if (cartCount) {
        cartCount.textContent = count;
        cartCount.classList.toggle('visible', count > 0);
      }

      const body = document.getElementById('cart-body');
      if (!body) return;

      if (count === 0) {
        body.innerHTML = `
          <div class="cart-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <p>Seu carrinho está vazio</p>
          </div>`;
        document.getElementById('cart-subtotal-val').textContent = 'R$ 0,00';
        return;
      }

      body.innerHTML = cart.items.map(item => `
        <div class="cart-item" data-key="${item.key}">
          <img class="cart-item-img" src="${item.image}" alt="${item.product_title}" loading="lazy">
          <div class="cart-item-info">
            <div class="cart-item-brand">${item.vendor}</div>
            <div class="cart-item-name">${item.product_title}</div>
            <div class="cart-item-variant">${item.variant_title !== 'Default Title' ? item.variant_title : ''}</div>
            <div class="cart-item-actions">
              <div class="qty-control">
                <button class="qty-btn" data-key="${item.key}" data-qty="${item.quantity - 1}">−</button>
                <span class="qty-val">${item.quantity}</span>
                <button class="qty-btn" data-key="${item.key}" data-qty="${item.quantity + 1}">+</button>
              </div>
              <span class="cart-item-price">R$ ${(item.final_line_price / 100).toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>
      `).join('');

      const subtotal = document.getElementById('cart-subtotal-val');
      if (subtotal) {
        subtotal.textContent = `R$ ${(cart.total_price / 100).toFixed(2).replace('.', ',')}`;
      }

      // Qty change handlers
      body.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const key = btn.dataset.key;
          const qty = parseInt(btn.dataset.qty);
          await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: key, quantity: qty })
          });
          updateCartUI();
        });
      });

    } catch(e) { console.error('Cart error:', e); }
  }

  /* ── ADD TO CART ─────────────────────────────────── */
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-add-to-cart]');
    if (!btn) return;

    const variantId = btn.dataset.variantId || btn.closest('form')?.querySelector('[name="id"]')?.value;
    if (!variantId) return;

    btn.disabled = true;
    btn.textContent = 'Adicionando...';

    try {
      await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: 1 })
      });
      await updateCartUI();
      openCart();
    } catch(e) {
      console.error(e);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Adicionar ao Carrinho';
    }
  });

  /* ── VARIANT SELECTOR (product page) ─────────────── */
  document.querySelectorAll('.variant-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.variant-options')
         ?.querySelectorAll('.variant-btn')
         .forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      // Update hidden input and price
      const form = btn.closest('form');
      if (form) {
        const variantInput = form.querySelector('[name="id"]');
        if (variantInput) variantInput.value = btn.dataset.variantId;
      }

      const price = btn.dataset.price;
      const priceEl = document.getElementById('product-price');
      if (priceEl && price) {
        priceEl.textContent = `R$ ${(parseInt(price) / 100).toFixed(2).replace('.', ',')}`;
      }
    });
  });

  /* ── BRAND CAROUSEL ──────────────────────────────── */
  const track = document.querySelector('.brands-track');
  if (track) {
    // Duplicate items for seamless loop
    const items = track.innerHTML;
    track.innerHTML = items + items;
  }

  /* ── COLLECTION FILTER (collection page) ─────────── */
  document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      const url = new URL(window.location);
      if (filter === 'all') {
        url.searchParams.delete('filter.p.vendor');
        url.searchParams.delete('filter.p.tag');
      } else if (btn.dataset.filterType === 'vendor') {
        url.searchParams.set('filter.p.vendor', filter);
      } else {
        url.searchParams.set('filter.p.tag', filter);
      }
      url.searchParams.delete('page');
      window.location = url.toString();
    });
  });

  /* ── MOBILE MENU ─────────────────────────────────── */
  const menuBtn = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
  }

  // Initial cart count
  fetch('/cart.js').then(r => r.json()).then(cart => {
    if (cartCount && cart.item_count > 0) {
      cartCount.textContent = cart.item_count;
      cartCount.classList.add('visible');
    }
  }).catch(() => {});

});


/* ---- SEARCH OVERLAY ---- */
(function() {
  const overlay = document.getElementById('search-overlay');
  if (!overlay) return;
  const input = overlay.querySelector('.search-overlay-input');

  function openSearch() {
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input && input.focus(), 50);
  }

  function closeSearch() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-search-trigger]').forEach(btn => {
    btn.addEventListener('click', openSearch);
  });

  const closeBtn = overlay.querySelector('[data-search-close]');
  if (closeBtn) closeBtn.addEventListener('click', closeSearch);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeSearch();
  });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeSearch();
  });
})();
