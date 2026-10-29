import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configured = Boolean(url && anon);
// 환경변수가 없어도 화면이 깨지지 않도록 null 을 허용해요.
export const supabase = configured ? createClient(url, anon) : null;
