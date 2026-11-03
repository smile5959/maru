# 🦆 maru — IoT 스마트홈 컨트롤러

> MQTT over WebSocket 기반의 실시간 IoT 제어 풀스택 프로젝트
>
> 2026년 3월 학습용으로 만들어 직접 운영해 본 프로젝트입니다. 지금은 EC2 서버를 내려 두어 라이브 데모는 없고, 코드와 구성만 공개합니다.

웹 UI에서 버튼을 누르면 AWS EC2의 MQTT 브로커를 거쳐 집 안의 ESP32로 신호가 전달되고, LED의 ON/OFF와 밝기가 제어됩니다. ESP32는 변경된 상태를 다시 발행해 웹 UI에 실시간으로 반영합니다.

웹 프론트엔드와 ESP32 펌웨어를 하나의 저장소에서 함께 관리합니다.

---

## 시스템 아키텍처

```
[Next.js 웹 UI]  ──── 로그인(JWT) ────► [Next.js API Route]
      │                                        │
      │  WebSocket :9001                       └─ MQTT 자격증명을 JWT에 담아 발급
      ▼
[AWS EC2 — Aedes MQTT 브로커]
      │
      │  MQTT :1883
      ▼
[ESP32 DevkitC V1]
      │
      │  GPIO 4 / GPIO 17 (PWM)
      ▼
[LED / 스마트홈 기기]
```

MQTT 자격증명은 클라이언트에 하드코딩하지 않고, 로그인 성공 시 발급되는 JWT의 페이로드로 전달됩니다.

---

## 저장소 구조

```
maru/
├── web/                        Next.js 웹 컨트롤러
│   ├── app/
│   │   ├── page.tsx            메인 제어 UI (MQTT over WebSocket)
│   │   ├── login/page.tsx      로그인 화면
│   │   └── api/auth/login/     JWT 발급 API
│   └── package.json
├── firmware/
│   └── maru_light/
│       ├── maru_light.ino      ESP32 펌웨어
│       └── secrets.h.example   자격증명 템플릿
```

브로커(Aedes)는 EC2에서 직접 운영했으며 이 저장소에 포함되어 있지 않습니다.

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| 인증 | JWT (jsonwebtoken), bcryptjs |
| 통신 | MQTT over WebSocket (mqtt.js) |
| 브로커 | Aedes (Node.js) |
| 하드웨어 | ESP32 DevkitC V1, Arduino (C++) |
| 펌웨어 라이브러리 | WiFiManager, PubSubClient |
| 인프라 | AWS EC2 (Ubuntu 24.04), PM2, GitHub Actions |

---

## 주요 기능

- LED 2채널 독립 제어 (ON/OFF + PWM 밝기 조절)
- ESP32 → 브로커 → 웹 UI 상태 피드백
- 브로커 연결 상태 실시간 표시
- JWT 기반 로그인 및 MQTT 자격증명 보호
- WiFiManager 지원 — 등록된 WiFi 접속 실패 시 `maru-setup` AP를 열어 현장에서 WiFi 재설정
- BOOT 버튼 3초 길게 누르면 WiFi 설정 초기화
- 인터넷만 있으면 어디서든 접속 가능

---

## MQTT 토픽 구조

| 토픽 | 방향 | 페이로드 |
|------|------|---------|
| `home/light/command` | 웹 → ESP32 | `{ "action": "ON" }` / `{ "action": "OFF" }` / `{ "action": "BRIGHTNESS", "value": 0-255 }` |
| `home/light/status` | ESP32 → 웹 | `{ "status": "ON", "brightness": 255 }` |
| `home/light2/command` | 웹 → ESP32 | 위와 동일 (2번 채널) |
| `home/light2/status` | ESP32 → 웹 | 위와 동일 (2번 채널) |

---

## 시작하기

### 1. 웹 컨트롤러

```bash
cd web
npm install
```

`web/.env.local` 파일을 만들고 아래 값을 채웁니다.

```bash
JWT_SECRET=충분히_긴_랜덤_문자열
ADMIN_USERNAME=관리자_아이디
ADMIN_PASSWORD=관리자_비밀번호
MQTT_USERNAME=브로커_계정
MQTT_PASSWORD=브로커_비밀번호
```

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속합니다. 브로커 주소는 `web/app/page.tsx` 상단의 `BROKER_URL` 에서 설정합니다.

### 2. ESP32 펌웨어

자격증명 파일을 템플릿에서 복사한 뒤 본인 값으로 채웁니다.

```bash
cd firmware/maru_light
cp secrets.h.example secrets.h
```

```c
const char* MQTT_SERVER = "브로커_IP";
const char* MQTT_USER   = "브로커_계정";
const char* MQTT_PASS   = "브로커_비밀번호";

const char* WIFI_LIST[][2] = {
  {"WIFI_SSID", "WIFI_비밀번호"},
  {"", ""},
};
const int WIFI_COUNT = 1;
```

Arduino IDE에서 보드를 **ESP32 DevkitC V1** 로 선택하고, `WiFiManager` 와 `PubSubClient` 라이브러리를 설치한 뒤 업로드합니다.

### 하드웨어 연결

| 부품 | 연결 |
|------|------|
| LED 1 | GPIO 4 → 220Ω 저항 → LED → GND |
| LED 2 | GPIO 17 → 220Ω 저항 → LED → GND |
| 리셋 버튼 | 보드 내장 BOOT 버튼 (GPIO 0) |

필요 부품: ESP32 DevkitC V1, 브레드보드, LED 2개, 220Ω 저항 2개, 점퍼케이블

---

## 비밀정보 관리

이 저장소에는 자격증명을 커밋하지 않습니다.

| 항목 | 보관 위치 |
|------|----------|
| 웹 환경 변수 | `web/.env.local` (gitignore) |
| 펌웨어 자격증명 | `firmware/maru_light/secrets.h` (gitignore) |
| EC2 SSH 키 | 로컬 `*.pem` (gitignore) |

---

## 배포

운영 당시에는 `master` 브랜치에 푸시하면 GitHub Actions가 EC2에 SSH로 접속해 웹을 빌드하고 PM2로 재시작했습니다. 서버를 내린 뒤 배포 워크플로는 삭제했습니다.

---

## 로드맵

- [x] MQTT 브로커 구축 (AWS EC2 + Aedes)
- [x] WebSocket 포트 추가 (:9001)
- [x] Next.js 웹 UI 구현
- [x] ESP32 LED 제어
- [x] 실제 LED 연결 (빵판 회로)
- [x] 밝기 조절 (PWM)
- [x] 다중 기기 제어 (2채널)
- [x] MQTT 인증 및 JWT 로그인
- [x] WiFiManager 적용 (동적 WiFi 설정)
- [ ] RGB LED 색상 제어
- [ ] 갸우뚱오리 무드등 IoT 개조
- [ ] 포터블 배터리 모듈 추가
