# 🍊 제주 로컬 IP (Vite + Supabase + Vercel)

제주의 로컬 IP(오름·올레길·감귤·해녀·돌하르방…)를 Pixabay 사진과 함께 소개하는 사이트예요.
Supabase로 **회원가입 / 로그인**을 하고, 로그인한 회원만 **사진 검색**을 쓸 수 있어요.

## 구조

```
index.html            화면 뼈대
src/main.js           화면 동작, 로그인/회원가입, 사진 검색
src/supabase.js       Supabase 클라이언트
shared/topics.js      제주 로컬 IP 목록 (화면 + 서버 공용)
api/pixabay.js        Vercel 서버 함수 (Pixabay 키는 여기서만 사용, 회원 확인)
vite.config.js        npm run dev 에서도 /api/pixabay 가 동작하게 연결
```

## 환경변수 3개

| 이름 | 어디에 쓰나 | 브라우저에 노출? |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase 주소 | 노출돼도 괜찮음 |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon(public) 키 | 노출돼도 괜찮음 (RLS로 보호) |
| `PIXABAY_API_KEY` | Pixabay 키 | **서버 함수에서만** 사용 |

> ⚠️ Supabase의 `service_role` 키는 절대 쓰지 마세요. 모든 권한이 열려요.

## 1단계. Supabase 값 확인

1. [supabase.com/dashboard](https://supabase.com/dashboard) → 내 프로젝트 선택
2. 상단의 **Connect** 버튼 또는 **Project Settings → API** 로 이동
3. **Project URL** (`https://xxxx.supabase.co`) → `VITE_SUPABASE_URL`
4. **anon / publishable key** → `VITE_SUPABASE_ANON_KEY`

### 이메일 로그인 설정 (Authentication)

- **Authentication → Providers → Email** 이 켜져 있는지 확인해요.
- 처음엔 가입 직후 바로 로그인되길 원하면 **Confirm email** 을 끄세요. (켜 두면 가입 후 메일의 링크를 눌러야 로그인돼요.)
- **Authentication → URL Configuration**
  - **Site URL**: 배포 주소 (예: `https://내프로젝트.vercel.app`)
  - **Redirect URLs** 에 추가: `http://localhost:5173/**`, `https://내프로젝트.vercel.app/**`

## 2단계. Pixabay 키 확인

1. [pixabay.com](https://pixabay.com) 에 가입/로그인
2. [pixabay.com/api/docs](https://pixabay.com/api/docs/) 페이지 중간에 **Your API key** 가 보여요 → `PIXABAY_API_KEY`

## 3단계. 내 컴퓨터에서 실행

[Node.js 18 이상](https://nodejs.org) 설치 후:

```bash
cd jeju-ip
cp .env.example .env.local     # Windows PowerShell: Copy-Item .env.example .env.local
# .env.local 을 열어 값 3개를 채우기
npm install
npm run dev                    # http://localhost:5173
```

## 4단계. GitHub에 올리기

`.env.local` 은 `.gitignore` 에 들어 있어서 올라가지 않아요. 키는 코드에 직접 쓰지 마세요.

## 5단계. Vercel 배포

1. [vercel.com](https://vercel.com) → **Add New → Project** → 이 GitHub 저장소 **Import**
2. (저장소 안에서 `jeju-ip` 폴더만 쓰는 경우) **Root Directory** 를 `jeju-ip` 로 지정
3. Framework Preset 이 **Vite** 로 잡혔는지 확인 (Build: `npm run build`, Output: `dist`)
4. **Environment Variables** 에 3개 등록 (Production / Preview / Development 모두 체크)
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `PIXABAY_API_KEY`
5. **Deploy**
6. 환경변수를 나중에 바꿨다면 **Deployments → Redeploy** 해야 반영돼요. (`VITE_` 값은 빌드할 때 코드에 들어가요.)
7. 배포 주소가 나오면 **Supabase → Authentication → URL Configuration** 의 Site URL / Redirect URLs 를 그 주소로 바꿔요.

## 동작 방식

- 로그인 없이: 제주 로컬 IP 카드와 사진을 볼 수 있어요. (`/api/pixabay?topic=...`, 서버가 정해 둔 주제만 허용)
- 로그인 후: 사진 검색을 쓸 수 있어요. 브라우저가 Supabase 토큰을 보내면 서버 함수가 Supabase에 확인한 뒤 Pixabay에 요청해요. (`/api/pixabay?q=...`)

## Pixabay 이용 시 참고

- 사진마다 촬영자와 Pixabay 링크를 표시해요.
- Pixabay는 이미지를 계속 직접 연결(핫링크)해서 쓰는 것을 권장하지 않아요. 연습용이라 직접 연결하지만, 실제 서비스라면 이미지를 내려받아 직접 호스팅하세요.
- API 결과는 24시간 캐시해요. (서버 함수의 `Cache-Control`)
