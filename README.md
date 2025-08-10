# SSHot - Puppeteer 기반 웹 스크린샷 서버

URL을 입력받아 웹페이지의 스크린샷을 캡처한 후 `screenshots/` 디렉토리에 WebP로 저장하고 파일명을 반환하는 Node.js 서버입니다.

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 서버 실행
```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 모드
npm start
```

서버는 `PORT` 환경 변수를 사용해서 구동됩니다. 기본값은 3000입니다.

## API 사용법

### 스크린샷 캡처

**POST** `/api/capture`

**Request Body:**
```json
{
  "url": "https://example.com",
  "width": 1920,
  "height": 1080,
  "scale": 1,
  "quality": 80,
  "fullPage": true,
  "filename": "my_screenshot"
}
```

**옵션 설명:**
- `url` (필수): 캡처할 웹페이지 URL
- `width` (선택): 뷰포트 너비 (기본값: 1920)
- `height` (선택): 뷰포트 높이 (기본값: 1080)
- `scale` (선택): 디바이스 스케일 팩터 (기본값: 1)
- `quality` (선택): WebP 품질 0-100 (기본값: 80)
- `fullPage` (선택): 전체 페이지 캡처 여부 (기본값: false)
- `filename` (선택): 파일명 (기본값: 타임스탬프 추가하여 자동 생성)

**Response:**
```json
{
  "success": true,
  "message": "스크린샷이 성공적으로 캡처되었습니다",
  "filename": "my_screenshot.webp",
  "timestamp": 1703123456789,
  "options": {
    "width": 1920,
    "height": 1080,
    "scale": 1,
    "quality": 80,
    "fullPage": true,
    "filename": "my_screenshot"
  }
}
```

## 예시 사용법

### 기본 사용 (모든 옵션 기본값)
```bash
curl -X POST http://localhost:3000/api/capture \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com"}'
```

### 옵션 사용
```bash
curl -X POST http://localhost:3000/api/capture \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://google.com",
    "width": 1366,
    "height": 768,
    "quality": 90,
    "filename": "google_homepage",
    "fullPage": false
  }'
```

### JavaScript 사용
```javascript
const response = await fetch('http://localhost:3000/api/capture', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://google.com',
    width: 1920,
    height: 1080,
    quality: 85,
    fullPage: true,
    filename: 'google_screenshot'
  })
});

const result = await response.json();
console.log('캡처된 파일명:', result.filename);
console.log('사용된 옵션:', result.options);
```
