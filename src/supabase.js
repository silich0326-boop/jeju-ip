import { createClient } from '@supabase/supabase-js';

// 값 앞뒤의 공백·따옴표를 지우고, https:// 가 빠졌으면 붙여 줘요.
const clean = v => String(v ?? '').trim().replace(/^["']+|["']+$/g, '').trim();
let url = clean(import.meta.env.VITE_SUPABASE_URL);
const anon = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);
if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;

export let configError = '';
let client = null;
if (url && anon) {
  try {
    client = createClient(url, anon);
  } catch (e) {
    configError = `Supabase 주소(VITE_SUPABASE_URL)가 올바르지 않아요. https://프로젝트ID.supabase.co 형태여야 해요.`;
    console.error(e);
  }
}

// 환경변수가 없거나 잘못돼도 사진·상품 화면은 계속 보이도록 null 을 허용해요.
export const supabase = client;
export const configured = Boolean(client);
