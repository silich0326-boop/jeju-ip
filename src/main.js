import './style.css';
import { supabase, configured } from './supabase.js';
import { TOPICS } from '../shared/topics.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let session = null;

/* ---------- 알림 ---------- */
let toastTimer;
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ---------- Pixabay (서버 함수 경유) ---------- */
async function fetchImages({ topic, q, page = 1, perPage = 12 }) {
  const p = new URLSearchParams({ page, per_page: perPage });
  if (topic) p.set('topic', topic); else p.set('q', q);
  const headers = session ? { Authorization: `Bearer ${session.access_token}` } : {};
  const r = await fetch(`/api/pixabay?${p}`, { headers });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || '사진을 불러오지 못했어요.'), { status: r.status });
  return data;
}

/* ---------- 라이트박스 ---------- */
function openLightbox(hit) {
  $('lbImg').src = hit.large || hit.preview;
  $('lbImg').alt = hit.tags || '';
  $('lbCredit').innerHTML = `📷 <a href="${esc(hit.page)}" target="_blank" rel="noopener">${esc(hit.user)}</a> · Pixabay`;
  $('lightbox').showModal();
}
$('lbClose').onclick = () => $('lightbox').close();
$('lightbox').addEventListener('click', e => { if (e.target === $('lightbox')) $('lightbox').close(); });

/* ---------- 제주 로컬 IP 카드 ---------- */
function renderCards() {
  const wrap = $('cards');
  TOPICS.filter(t => t.id !== 'jeju').forEach(t => {
    const el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = `
      <div class="thumb skeleton"></div>
      <div class="body">
        <h3>${t.emoji} ${esc(t.ko)}</h3>
        <p>${esc(t.desc)}</p>
        <p class="jeju">🗣️ ${esc(t.jeju)}</p>
        <p class="credit"></p>
      </div>`;
    wrap.appendChild(el);
    loadCardImage(el, t.id);
  });
}
async function loadCardImage(el, topic) {
  const thumb = el.querySelector('.thumb');
  try {
    let data = await fetchImages({ topic, perPage: 3 });
    if (!data.hits.length) data = await fetchImages({ topic: 'jeju', perPage: 3 });
    const hit = data.hits[0];
    if (!hit) throw new Error('empty');
    thumb.classList.remove('skeleton');
    thumb.innerHTML = `<img src="${esc(hit.preview)}" alt="${esc(hit.tags)}" loading="lazy" />`;
    thumb.onclick = () => openLightbox(hit);
    el.querySelector('.credit').innerHTML = `📷 <a href="${esc(hit.page)}" target="_blank" rel="noopener">${esc(hit.user)}</a> · Pixabay`;
  } catch {
    thumb.classList.remove('skeleton');
    thumb.classList.add('fail');
    thumb.textContent = '사진을 불러오지 못했어요';
  }
}
async function loadHero() {
  try {
    const { hits } = await fetchImages({ topic: 'jeju', perPage: 10 });
    const hit = hits[Math.floor(Math.random() * hits.length)];
    if (hit) $('hero').style.backgroundImage =
      `linear-gradient(180deg, rgba(10,30,45,.35), rgba(10,30,45,.75)), url("${hit.large || hit.preview}")`;
  } catch { /* 배경 사진이 없어도 괜찮아요 */ }
}

/* ---------- 회원 전용 사진 검색 ---------- */
let page = 1, lastQ = '';
function applyLock() {
  const locked = !session;
  $('lock').hidden = !locked;
  $('searchForm').classList.toggle('disabled', locked);
  $('q').disabled = locked;
}
async function runSearch(more = false) {
  const q = more ? lastQ : $('q').value.trim();
  if (!q) return;
  if (!more) { page = 1; lastQ = q; $('results').innerHTML = ''; }
  $('searchMsg').textContent = '찾는 중…';
  $('more').hidden = true;
  try {
    const { hits, total } = await fetchImages({ q, page, perPage: 12 });
    $('searchMsg').textContent = hits.length || more ? '' : `"${q}" 사진을 찾지 못했어요.`;
    hits.forEach(h => {
      const f = document.createElement('figure');
      f.innerHTML = `<img src="${esc(h.preview)}" alt="${esc(h.tags)}" loading="lazy" />
        <figcaption>📷 ${esc(h.user)}</figcaption>`;
      f.querySelector('img').onclick = () => openLightbox(h);
      $('results').appendChild(f);
    });
    $('more').hidden = $('results').children.length >= total || hits.length === 0;
    page += 1;
  } catch (e) {
    if (e.status === 401) { $('searchMsg').textContent = '로그인이 필요해요.'; openAuth('login'); }
    else $('searchMsg').textContent = e.message;
  }
}
$('searchForm').addEventListener('submit', e => { e.preventDefault(); runSearch(false); });
$('more').onclick = () => runSearch(true);

/* ---------- 로그인 / 회원가입 ---------- */
let mode = 'login';
const dlg = $('authDialog');
function setMode(m) {
  mode = m;
  $('tabLogin').classList.toggle('on', m === 'login');
  $('tabSignup').classList.toggle('on', m === 'signup');
  $('pw2Wrap').hidden = m === 'login';
  $('authSubmit').textContent = m === 'login' ? '로그인' : '가입하기';
  $('password').autocomplete = m === 'login' ? 'current-password' : 'new-password';
  $('authMsg').textContent = ''; $('authMsg').className = 'msg';
}
function openAuth(m = 'login') {
  if (!configured) { toast('Supabase 환경변수가 설정되지 않았어요.'); return; }
  setMode(m); dlg.showModal(); $('email').focus();
}
$('tabLogin').onclick = () => setMode('login');
$('tabSignup').onclick = () => setMode('signup');
$('authClose').onclick = () => dlg.close();
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
$('authBtn').onclick = async () => {
  if (session) { await supabase.auth.signOut(); toast('로그아웃했어요.'); } else openAuth('login');
};
$('lockBtn').onclick = () => openAuth('login');

const KO_ERRORS = [
  [/invalid login credentials/i, '이메일 또는 비밀번호가 맞지 않아요.'],
  [/email not confirmed/i, '메일함에서 인증 링크를 먼저 눌러 주세요.'],
  [/already registered|already been registered/i, '이미 가입된 이메일이에요. 로그인해 주세요.'],
  [/at least 6|weak/i, '비밀번호는 6자 이상으로 해 주세요.'],
  [/rate limit|too many/i, '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.'],
  [/invalid.*email|unable to validate email/i, '이메일 형식을 확인해 주세요.']
];
const koError = m => (KO_ERRORS.find(([re]) => re.test(m)) || [, '문제가 생겼어요: ' + m])[1];

function authMessage(text, ok = false) {
  const el = $('authMsg'); el.textContent = text; el.className = 'msg' + (ok ? ' ok' : ' err');
}

$('authForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('email').value.trim(), password = $('password').value;
  if (!email || !password) return authMessage('이메일과 비밀번호를 입력해 주세요.');
  if (password.length < 6) return authMessage('비밀번호는 6자 이상으로 해 주세요.');
  if (mode === 'signup' && password !== $('password2').value) return authMessage('비밀번호 확인이 달라요.');

  $('authSubmit').disabled = true;
  try {
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      dlg.close(); toast('환영해요! 🍊');
    } else {
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { emailRedirectTo: location.origin }
      });
      if (error) throw error;
      // 이미 가입된 이메일이면 Supabase 는 identities 가 빈 사용자를 돌려줘요.
      if (data.user && data.user.identities && data.user.identities.length === 0)
        throw new Error('User already registered');
      if (data.session) { dlg.close(); toast('가입 완료! 환영해요 🍊'); }
      else authMessage('가입 확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요.', true);
    }
  } catch (err) {
    authMessage(koError(err.message || String(err)));
  } finally {
    $('authSubmit').disabled = false;
  }
});

function renderAuth() {
  const email = session?.user?.email;
  $('userEmail').hidden = !email;
  $('userEmail').textContent = email || '';
  $('authBtn').textContent = session ? '로그아웃' : '로그인 / 회원가입';
  applyLock();
}

/* ---------- 시작 ---------- */
async function init() {
  renderCards();
  loadHero();
  if (!configured) { $('envWarn').hidden = false; renderAuth(); return; }
  const { data } = await supabase.auth.getSession();
  session = data.session; renderAuth();
  supabase.auth.onAuthStateChange((_event, s) => { session = s; renderAuth(); });
}
init();
