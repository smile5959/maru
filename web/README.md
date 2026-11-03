# maru-web

maru 프로젝트의 Next.js 웹 컨트롤러입니다. 전체 아키텍처와 하드웨어 구성은 [루트 README](../README.md)를 참고하세요.

## 실행

```bash
npm install
npm run dev
```

`http://localhost:3000` 으로 접속합니다.

## 환경 변수

`.env.local` 파일에 아래 값을 설정합니다.

| 변수 | 설명 |
|------|------|
| `JWT_SECRET` | JWT 서명 키 |
| `ADMIN_USERNAME` | 로그인 아이디 |
| `ADMIN_PASSWORD` | 로그인 비밀번호 |
| `MQTT_USERNAME` | 브로커 계정 — JWT 페이로드로 전달됨 |
| `MQTT_PASSWORD` | 브로커 비밀번호 — JWT 페이로드로 전달됨 |

브로커 주소는 `app/page.tsx` 상단의 `BROKER_URL` 에서 설정합니다.

```ts
const BROKER_URL = 'ws://YOUR_EC2_IP:9001'
```

## 구조

| 경로 | 역할 |
|------|------|
| `app/page.tsx` | 메인 제어 UI, MQTT over WebSocket 연결 |
| `app/login/page.tsx` | 로그인 화면 |
| `app/api/auth/login/route.ts` | 자격증명 검증 후 JWT 발급 |

ESP32 펌웨어는 [`firmware/maru_light`](../firmware/maru_light/maru_light.ino) 에 있습니다.
