// Vercel 서버 함수: Pixabay 키를 브라우저에 노출하지 않기 위해 여기서만 사용해요.
//  - ?topic=<id>        : shared/topics.js 에 있는 주제만, 로그인 없이 허용
//  - ?q=<검색어>         : 로그인한 회원만 (Authorization: Bearer <Supabase access token>)
import { TOPICS } from '../shared/topics.js';

const clamp = (n, lo, hi, d) => Number.isFinite(+n) ? Math.min(hi, Math.max(lo, +n)) : d;

async function isMember(req) {
  const url = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!url || !anon || !token) return false;
  const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
  return r.ok;
}

export default async function handler(req, res) {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return res.status(500).json({ error: 'PIXABAY_API_KEY 환경변수가 없어요.' });

  const { topic, q } = req.query;
  let query, cache = 'public, s-maxage=86400, stale-while-revalidate=604800';
  if (topic) {
    const t = TOPICS.find(x => x.id === topic);
    if (!t) return res.status(400).json({ error: '알 수 없는 주제예요.' });
    query = t.query;
  } else if (q) {
    if (!(await isMember(req))) return res.status(401).json({ error: '로그인이 필요해요.' });
    query = String(q).slice(0, 100);
    cache = 'private, max-age=3600';
  } else {
    return res.status(400).json({ error: 'topic 또는 q 가 필요해요.' });
  }

  const params = new URLSearchParams({
    key, q: query, image_type: 'photo', safesearch: 'true',
    lang: /[가-힣]/.test(query) ? 'ko' : 'en',
    per_page: String(clamp(req.query.per_page, 3, 40, 12)),
    page: String(clamp(req.query.page, 1, 20, 1))
  });
  const r = await fetch(`https://pixabay.com/api/?${params}`);
  if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ error: 'Pixabay 요청에 실패했어요.' });
  const data = await r.json();

  res.setHeader('Cache-Control', cache);
  res.status(200).json({
    total: data.totalHits,
    hits: data.hits.map(h => ({
      id: h.id, preview: h.webformatURL, large: h.largeImageURL,
      user: h.user, page: h.pageURL, tags: h.tags
    }))
  });
}
