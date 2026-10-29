import { PRODUCTS } from '../shared/products.js';
import cartSql from '../supabase/cart.sql?raw';

const won = n => n.toLocaleString('ko-KR') + '원';
const MAX_QTY = 99;

export function initCart({ supabase, getSession, openAuth, toast, esc, fetchImages }) {
  const $ = id => document.getElementById(id);
  const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
  const topicHits = {};
  const thumbs = {};          // 상품 id -> 사진 주소 (장바구니 목록에서 재사용)
  let items = [];             // { id, product_id, quantity }

  const loadTopic = topic => (topicHits[topic] ??= fetchImages({ topic, perPage: 12 }).then(d => d.hits).catch(() => []));

  /* ---------- 상품 목록 ---------- */
  function renderProducts() {
    const grid = $('products');
    grid.innerHTML = '';
    PRODUCTS.forEach(p => {
      const el = document.createElement('article');
      el.className = 'card product';
      el.innerHTML = `
        <div class="thumb skeleton"></div>
        <div class="body">
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.desc)}</p>
          <p class="price">${won(p.price)}</p>
          <button class="btn primary add" data-id="${esc(p.id)}">🛒 담기</button>
          <p class="credit"></p>
        </div>`;
      grid.appendChild(el);
      loadTopic(p.topic).then(hits => {
        const thumb = el.querySelector('.thumb');
        thumb.classList.remove('skeleton');
        const hit = hits.length ? hits[p.img % hits.length] : null;
        if (!hit) { thumb.classList.add('fail'); thumb.textContent = p.emoji; return; }
        thumbs[p.id] = hit.preview;
        thumb.innerHTML = `<img src="${esc(hit.preview)}" alt="${esc(p.name)}" loading="lazy" />`;
        el.querySelector('.credit').innerHTML =
          `📷 <a href="${esc(hit.page)}" target="_blank" rel="noopener">${esc(hit.user)}</a> · Pixabay`;
        render();
      });
    });
    grid.addEventListener('click', e => {
      const b = e.target.closest('.add');
      if (b) add(b.dataset.id);
    });
  }

  /* ---------- 장바구니 화면 ---------- */
  function render() {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    $('cartCount').textContent = count;
    $('cartCount').hidden = count === 0;

    const body = $('cartBody');
    if (!getSession()) body.innerHTML = '<p class="empty">로그인하면 장바구니를 쓸 수 있어요.</p>';
    else if (!items.length) body.innerHTML = '<p class="empty">장바구니가 비어 있어요. 🍊</p>';
    else body.innerHTML = items.map(i => {
      const p = byId[i.product_id];
      if (!p) return '';
      const img = thumbs[p.id] ? `<img src="${esc(thumbs[p.id])}" alt="" />` : esc(p.emoji);
      return `
        <div class="row" data-id="${esc(i.id)}">
          <div class="rthumb">${img}</div>
          <div class="rinfo"><b>${esc(p.name)}</b><span>${won(p.price)}</span></div>
          <div class="qty">
            <button data-act="dec" aria-label="하나 빼기">−</button>
            <span>${i.quantity}</span>
            <button data-act="inc" aria-label="하나 더하기">+</button>
          </div>
          <div class="sub">${won(p.price * i.quantity)}</div>
          <button class="del" data-act="del" aria-label="삭제">🗑</button>
        </div>`;
    }).join('');

    const total = items.reduce((s, i) => s + (byId[i.product_id]?.price || 0) * i.quantity, 0);
    $('cartTotal').textContent = won(total);
    $('cartFoot').hidden = !items.length;
  }

  /* ---------- 테이블이 없을 때 안내 ---------- */
  const isMissingTable = e => e && (e.code === 'PGRST205' || e.code === '42P01' ||
    /could not find the table|does not exist/i.test(e.message || ''));

  function setupPanel() {
    $('cartSql').value = cartSql;
    const ref = (import.meta.env.VITE_SUPABASE_URL || '').match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1];
    $('sqlOpen').href = ref ? `https://supabase.com/dashboard/project/${ref}/sql/new` : 'https://supabase.com/dashboard';
    $('cartSetup').hidden = false;
  }
  $('sqlCopy').onclick = async () => {
    try { await navigator.clipboard.writeText(cartSql); toast('SQL을 복사했어요. SQL Editor에 붙여 넣고 Ctrl+Enter!'); }
    catch { $('cartSql').select(); document.execCommand('copy'); toast('SQL을 복사했어요.'); }
  };
  $('cartRetry').onclick = () => refresh(true);

  function fail(e) {
    if (isMissingTable(e)) { setupPanel(); openCart(); }
    else toast('장바구니 오류: ' + (e.message || e));
  }

  /* ---------- Supabase 읽기/쓰기 ---------- */
  async function refresh(announce = false) {
    if (!supabase || !getSession()) { items = []; render(); return; }
    const { data, error } = await supabase.from('cart_items')
      .select('id, product_id, quantity').order('created_at');
    if (error) {
      items = []; render();
      if (isMissingTable(error)) { if (announce) toast('아직 테이블이 없어요. SQL을 실행했는지 확인해 주세요.'); setupPanel(); }
      else toast('장바구니를 불러오지 못했어요: ' + error.message);
      return;
    }
    $('cartSetup').hidden = true;
    items = data; render();
    if (announce) toast('테이블을 확인했어요! 이제 담을 수 있어요 🛒');
  }

  async function add(productId) {
    if (!getSession()) { toast('로그인하면 담을 수 있어요.'); openAuth('login'); return; }
    const ex = items.find(i => i.product_id === productId);
    const { error } = ex
      ? await supabase.from('cart_items').update({ quantity: Math.min(MAX_QTY, ex.quantity + 1) }).eq('id', ex.id)
      : await supabase.from('cart_items').insert({ product_id: productId, quantity: 1 });
    if (error) { if (error.code !== '23505') return fail(error); }
    else toast(`${byId[productId].name} 담았어요 🛒`);
    await refresh();
  }
  async function setQty(id, qty) {
    const { error } = qty < 1
      ? await supabase.from('cart_items').delete().eq('id', id)
      : await supabase.from('cart_items').update({ quantity: Math.min(MAX_QTY, qty) }).eq('id', id);
    if (error) return fail(error);
    await refresh();
  }
  async function clearAll() {
    const s = getSession(); if (!s) return;
    const { error } = await supabase.from('cart_items').delete().eq('user_id', s.user.id);
    if (error) return fail(error);
    await refresh();
  }

  $('cartBody').addEventListener('click', e => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const id = b.closest('.row').dataset.id;
    const it = items.find(i => i.id === id);
    if (!it) return;
    if (b.dataset.act === 'inc') setQty(id, it.quantity + 1);
    if (b.dataset.act === 'dec') setQty(id, it.quantity - 1);
    if (b.dataset.act === 'del') setQty(id, 0);
  });
  $('cartClear').onclick = clearAll;

  /* ---------- 열고 닫기 ---------- */
  function openCart() { if (!$('cartDialog').open) $('cartDialog').showModal(); }
  $('cartBtn').onclick = async () => {
    if (!getSession()) { toast('로그인하면 장바구니를 쓸 수 있어요.'); openAuth('login'); return; }
    openCart(); await refresh();
  };
  $('cartClose').onclick = () => $('cartDialog').close();
  $('cartDialog').addEventListener('click', e => { if (e.target === $('cartDialog')) $('cartDialog').close(); });

  render();
  return { renderProducts, refresh };
}
