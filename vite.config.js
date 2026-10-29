import { defineConfig, loadEnv } from 'vite';

// 개발 서버(npm run dev)에서도 배포 환경처럼 /api/pixabay 가 동작하도록 연결해요.
function apiDev() {
  return {
    name: 'api-dev',
    configureServer(server) {
      server.middlewares.use('/api/pixabay', async (req, res) => {
        try {
          const { default: handler } = await server.ssrLoadModule('/api/pixabay.js');
          req.query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams);
          res.status = code => { res.statusCode = code; return res; };
          res.json = body => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(body)); };
          await handler(req, res);
        } catch (e) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: String(e.message || e) }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  // .env.local 의 값(PIXABAY_API_KEY 포함)을 서버 함수가 읽을 수 있게 process.env 에 넣어요.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return { plugins: [apiDev()] };
});
