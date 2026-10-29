// 화면(카드 내용)과 서버(api/pixabay.js)가 함께 쓰는 제주 로컬 IP 목록.
// query 는 Pixabay 검색어예요. 서버가 이 목록 안의 주제만 로그인 없이 허용해요.
export const TOPICS = [
  {
    id: 'jeju', ko: '제주', emoji: '🏝️', query: 'Jeju Island',
    desc: '화산섬 제주의 풍경이에요.', jeju: '혼저 옵서예 (어서 오세요)'
  },
  {
    id: 'oreum', ko: '오름', emoji: '🌋', query: 'Jeju oreum volcanic cone',
    desc: '한라산 둘레에 솟은 작은 화산들이에요. 360여 개가 있고, 오름마다 풍경과 오르는 시간이 달라요.',
    jeju: '오름 = 작은 산·언덕'
  },
  {
    id: 'olle', ko: '올레길', emoji: '🥾', query: 'Jeju Olle trail coast',
    desc: '섬을 따라 이어 걷는 길이에요. 바다를 끼고 걷는 구간이 많아요.',
    jeju: '올레 = 집으로 들어가는 좁은 골목'
  },
  {
    id: 'citrus', ko: '감귤', emoji: '🍊', query: 'tangerine orchard',
    desc: '겨울이 제철이에요. 한라봉, 천혜향, 레드향처럼 품종마다 맛과 시기가 달라요.',
    jeju: '혼저 먹읍서 (어서 드세요)'
  },
  {
    id: 'haenyeo', ko: '해녀', emoji: '🤿', query: 'haenyeo Korean woman diver',
    desc: '숨을 참고 바다에 들어가 해산물을 따는 제주의 여성들이에요. 해녀 문화는 유네스코 인류무형문화유산이에요.',
    jeju: '물질 = 바다에서 해산물을 따는 일'
  },
  {
    id: 'hareubang', ko: '돌하르방', emoji: '🗿', query: 'Dol hareubang statue',
    desc: '제주의 현무암으로 만든 할아버지 모양 돌 석상이에요. 마을을 지켜 주는 수호신이라고 해요.',
    jeju: '하르방 = 할아버지'
  },
  {
    id: 'hallasan', ko: '한라산', emoji: '⛰️', query: 'Hallasan mountain',
    desc: '해발 1,947m로 남한에서 가장 높은 산이에요. 제주의 화산섬과 용암동굴은 유네스코 세계자연유산이에요.',
    jeju: '은하수를 잡아당길 만큼 높다는 뜻이라고 전해져요'
  },
  {
    id: 'seongsan', ko: '성산일출봉', emoji: '🌅', query: 'Seongsan Ilchulbong sunrise',
    desc: '바다 위에 솟은 화산 분화구예요. 해돋이 명소로 유명해요.',
    jeju: '일출봉 = 해가 뜨는 봉우리'
  },
  {
    id: 'pony', ko: '제주 조랑말', emoji: '🐴', query: 'Jeju pony horse',
    desc: '키가 작고 튼튼한 제주의 말이에요. 제주마는 천연기념물이에요.',
    jeju: '제주마는 천연기념물이에요'
  }
];
