# 자원 관리 시스템 (Resource Management System)

사내 자산, 회의실, 법인차량 등의 자원을 통합 관리하는 웹 기반 시스템입니다.

## 기술 스택

### Backend
- **Framework:** Spring Boot 2.7.x
- **Language:** Java 17
- **Database:** H2 (개발), PostgreSQL/MySQL (운영)
- **Security:** Spring Security + JWT
- **Build Tool:** Maven

### Frontend
- **Framework:** React 18
- **State Management:** Redux Toolkit
- **UI Library:** Material-UI (MUI) v5
- **HTTP Client:** Axios
- **Date Handling:** Day.js
- **Form Handling:** React Hook Form

---

## 주요 기능

### 1. 사용자 인증 및 권한 관리

#### 권한 체계
| 권한 | 설명 | 주요 기능 |
|------|------|----------|
| **USER** | 일반 사용자 | 자산 조회, 회의실/차량 예약, 권한 신청 |
| **ASSET_ADMIN** | 자산 관리자 | USER 권한 + 자산 등록/수정/삭제/업로드 |
| **SYSTEM_ADMIN** | 시스템 관리자 | 모든 기능 (사용자/부서/권한/메뉴 관리 포함) |

#### 기능
- 회원가입 / 로그인 / 로그아웃
- JWT 기반 인증 (Access Token + Refresh Token)
- 비밀번호 변경
- 권한 신청 및 승인/반려
- 권한 변경 시 자동 토큰 갱신

### 2. 자산 관리

#### 자산 카테고리
- IT 장비 (노트북, 모니터, 키보드, 마우스 등)
- 가구 (책상, 의자, 캐비넷 등)
- 차량 (법인차량)
- 기타

#### 기능
- 자산 목록 조회 (카테고리별 필터링, 검색, 페이징)
- 자산 등록/수정/삭제 (ASSET_ADMIN 이상)
- 엑셀 업로드를 통한 대량 등록
- 엑셀 템플릿 다운로드
- 자산 목록 엑셀 내보내기

### 3. 회의실 예약

#### 보기 모드
- **일별 보기:** 특정 날짜의 모든 회의실 예약 현황 (시간 스케줄러)
- **주별 보기:** 특정 회의실의 주간 예약 현황 (월~금, 시간 스케줄러)

#### 기능
- 날짜/시간대별 예약 현황 조회
- 회의실 예약 등록/수정/취소
- 빈 시간대 클릭으로 빠른 예약
- 드래그로 연속 시간대 선택 예약
- 일별 보기에서 날짜 텍스트 클릭 시 달력 팝업으로 날짜 선택
- 회의실 등록/수정/삭제 (SYSTEM_ADMIN 전용, 탭 상단에 목록 표시)
- 주별 보기 날짜 범위 이동 (`<` `>` 버튼)

### 4. 법인차량 예약

#### 보기 모드
- **일별 보기:** 특정 날짜의 모든 차량 예약 현황
- **주별 보기:** 특정 차량의 주간 예약 현황 (일~토, 시간 스케줄러)
- **월별 보기:** 특정 차량의 월간 예약 현황 (캘린더 형태)

#### 기능
- 차량 예약 등록/수정/취소
- 운전자, 사용목적, 목적지 기록
- 이용 안내 표시 (운행 전/후 km 사진 제출 등)
- 일별 보기에서 날짜 텍스트 클릭 시 달력 팝업으로 날짜 선택
- 차량 등록/수정/삭제 (SYSTEM_ADMIN 전용, 탭 상단에 목록 표시)
- 주별/월별 보기 날짜 범위 이동

### 5. 사용자 관리 (SYSTEM_ADMIN 전용)

- 사용자 목록 조회 (검색, 필터링, 페이징)
- 사용자 정보 수정
- 사용자 권한 변경
- 비밀번호 초기화

### 6. 부서 관리 (SYSTEM_ADMIN 전용)

- 부서 목록 조회
- 부서 등록/수정/삭제

### 7. 권한 신청 관리 (SYSTEM_ADMIN 전용)

- 대기중/승인됨/반려됨 신청 목록 조회
- 권한 신청 승인/반려
- 대기중 신청 건수 배지 표시

### 8. 메뉴 관리 (SYSTEM_ADMIN 전용)

- 메뉴 트리 구조 관리
- 메뉴 등록/수정/삭제
- 권한별 메뉴 접근 설정

### 9. 마이페이지

- 내 정보 조회/수정
- 비밀번호 변경
- 내 예약 정보 (회의실, 차량)
- 권한 신청 및 신청 이력 조회

### 10. 대시보드

- 환영 메시지 및 현재 권한 표시
- 오늘의 회의실/차량 예약 현황
- 최근 자산 목록
- 권한 신청 대기 건수 (SYSTEM_ADMIN)

---

## 프로젝트 구조

```
resource-management-system/
├── backend/
│   ├── src/main/java/com/selim/resourcemanagement/
│   │   ├── config/           # 설정 (Security, Exception Handler 등)
│   │   ├── controller/       # REST API 컨트롤러
│   │   ├── dto/              # 요청/응답 DTO
│   │   ├── entity/           # JPA 엔티티
│   │   ├── repository/       # JPA 레포지토리
│   │   ├── security/         # JWT 관련 클래스
│   │   └── service/          # 비즈니스 로직
│   ├── pom.xml               # Maven 설정
│   └── start-backend.bat     # Backend 기동 스크립트 (Windows)
│
├── frontend/
│   ├── src/
│   │   ├── components/       # 공통 컴포넌트 (Layout 등)
│   │   ├── pages/            # 페이지 컴포넌트
│   │   ├── services/         # API 서비스
│   │   ├── store/            # Redux 스토어
│   │   └── utils/            # 유틸리티 함수
│   ├── package.json          # npm 설정
│   └── start-frontend.bat    # Frontend 기동 스크립트 (Windows)
│
└── docs/                     # 문서
    ├── 01_화면설계서.md
    ├── 03_컴포넌트명세서.md
    └── 05_기동가이드.md
```

---

## API 엔드포인트

### 인증 (Auth)
| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| POST | `/api/auth/register` | 회원가입 | 공개 |
| POST | `/api/auth/login` | 로그인 | 공개 |
| POST | `/api/auth/logout` | 로그아웃 | 인증 |
| POST | `/api/auth/refresh` | 토큰 갱신 | 공개 |
| PUT | `/api/auth/password/change` | 비밀번호 변경 | 인증 |

### 사용자 (Users)
| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/api/users` | 사용자 목록 | SYSTEM_ADMIN |
| GET | `/api/users/me` | 현재 사용자 정보 | 인증 |
| GET | `/api/users/{id}` | 사용자 상세 | 인증 |
| PUT | `/api/users/{id}` | 사용자 수정 | 인증 |
| PUT | `/api/users/{id}/role` | 권한 변경 | SYSTEM_ADMIN |
| POST | `/api/users/{id}/password/reset` | 비밀번호 초기화 | SYSTEM_ADMIN |

### 부서 (Departments)
| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/api/departments` | 부서 목록 (활성) | 공개 |
| GET | `/api/departments/all` | 부서 전체 목록 | SYSTEM_ADMIN |
| POST | `/api/departments` | 부서 등록 | SYSTEM_ADMIN |
| PUT | `/api/departments/{id}` | 부서 수정 | SYSTEM_ADMIN |
| DELETE | `/api/departments/{id}` | 부서 삭제 | SYSTEM_ADMIN |

### 권한 신청 (Permission Requests)
| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| POST | `/api/permission-requests` | 권한 신청 | 인증 |
| GET | `/api/permission-requests` | 신청 목록 | SYSTEM_ADMIN |
| GET | `/api/permission-requests/my` | 내 신청 목록 | 인증 |
| GET | `/api/permission-requests/pending/count` | 대기 건수 | SYSTEM_ADMIN |
| PUT | `/api/permission-requests/{id}/approve` | 승인 | SYSTEM_ADMIN |
| PUT | `/api/permission-requests/{id}/reject` | 반려 | SYSTEM_ADMIN |

### 자산 (Assets)
| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/api/assets` | 자산 목록 | 인증 |
| GET | `/api/assets/{id}` | 자산 상세 | 인증 |
| POST | `/api/assets` | 자산 등록 | ASSET_ADMIN+ |
| PUT | `/api/assets/{id}` | 자산 수정 | ASSET_ADMIN+ |
| DELETE | `/api/assets/{id}` | 자산 삭제 | ASSET_ADMIN+ |
| DELETE | `/api/assets/batch` | 자산 일괄 삭제 | ASSET_ADMIN+ |
| POST | `/api/assets/upload` | 엑셀 업로드 | ASSET_ADMIN+ |
| GET | `/api/assets/template/{category}` | 템플릿 다운로드 | ASSET_ADMIN+ |
| GET | `/api/assets/export` | 엑셀 내보내기 | 인증 |

### 회의실 (Meeting Rooms)
| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/api/meeting-rooms` | 회의실 목록 | 인증 |
| POST | `/api/meeting-rooms` | 회의실 등록 | SYSTEM_ADMIN |
| PUT | `/api/meeting-rooms/{id}` | 회의실 수정 | SYSTEM_ADMIN |
| DELETE | `/api/meeting-rooms/{id}` | 회의실 삭제 | SYSTEM_ADMIN |

### 회의실 예약 (Room Reservations)
| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/api/room-reservations` | 예약 목록 | 인증 |
| GET | `/api/room-reservations/my` | 내 예약 목록 | 인증 |
| POST | `/api/room-reservations` | 예약 등록 | 인증 |
| PUT | `/api/room-reservations/{id}` | 예약 수정 | 인증 |
| DELETE | `/api/room-reservations/{id}` | 예약 취소 | 인증 |

### 차량 (Vehicles)
| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/api/vehicles` | 차량 목록 | 인증 |
| POST | `/api/vehicles` | 차량 등록 | SYSTEM_ADMIN |
| PUT | `/api/vehicles/{id}` | 차량 수정 | SYSTEM_ADMIN |
| DELETE | `/api/vehicles/{id}` | 차량 삭제 | SYSTEM_ADMIN |

### 차량 예약 (Vehicle Reservations)
| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/api/vehicle-reservations` | 예약 목록 | 인증 |
| GET | `/api/vehicle-reservations/my` | 내 예약 목록 | 인증 |
| POST | `/api/vehicle-reservations` | 예약 등록 | 인증 |
| PUT | `/api/vehicle-reservations/{id}` | 예약 수정 | 인증 |
| DELETE | `/api/vehicle-reservations/{id}` | 예약 취소 | 인증 |

### 메뉴 (Menus)
| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/api/menus` | 메뉴 목록 | 인증 |
| GET | `/api/menus/tree` | 메뉴 트리 | 인증 |
| GET | `/api/menus/my` | 내 메뉴 | 인증 |
| POST | `/api/menus` | 메뉴 등록 | SYSTEM_ADMIN |
| PUT | `/api/menus/{id}` | 메뉴 수정 | SYSTEM_ADMIN |
| DELETE | `/api/menus/{id}` | 메뉴 삭제 | SYSTEM_ADMIN |

---

## 실행 방법

### 간편 실행 (Windows - 권장)
파일 탐색기에서 배치 파일 더블클릭:
1. `backend\start-backend.bat` - Backend 기동
2. `frontend\start-frontend.bat` - Frontend 기동

### Backend (수동)
```bash
cd backend
mvn spring-boot:run
```
- 기본 포트: 8080

### Frontend (수동)
```bash
cd frontend
npm install
npm start
```
- 기본 포트: 3000

> 상세한 기동/재기동 방법은 `docs/05_기동가이드.md` 참조

---

## 환경 설정

### Backend (application.properties)
```properties
# JWT 설정
jwt.secret=your-secret-key
jwt.access-token-expiration=3600000
jwt.refresh-token-expiration=604800000

# Database 설정
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.username=sa
spring.datasource.password=
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8080/api
```

---

## 주요 화면

1. **로그인/회원가입** - 사용자 인증
2. **대시보드** - 전체 현황 요약
3. **자산 관리** - IT장비, 가구 등 자산 관리
4. **회의실 예약** - 일별/주별 스케줄러
5. **법인차량 예약** - 일별/주별/월별 스케줄러
6. **마이페이지** - 내 정보, 예약 현황, 권한 신청
7. **관리자 메뉴** - 사용자/부서/권한/메뉴 관리

---

## 변경 이력

### 2024-12-16
- 회의실/차량 예약 화면 레이아웃 개선
  - 회의실 목록/차량 목록을 일별/주별/월별 탭 위로 이동 (관리자 영역)
  - 상단 독립 날짜 선택기 제거
  - 일별 보기에서 날짜 텍스트 클릭 시 달력 팝업으로 날짜 선택
  - 달력 아이콘 제거하여 깔끔한 UI
  - 날짜/달력 텍스트 드래그 방지 (userSelect: none)

### 2024-12-15
- 회의실 예약 주별 보기 시간 스케줄러 형태로 변경
- 법인차량 예약 주별 보기 시간 스케줄러 형태로 변경
- 주별 보기 월~금만 표시하도록 수정
- 주별 보기 날짜 범위 이동 버튼 추가
- 권한 승인 후 자동 토큰 갱신 기능 추가
- 마이페이지 접속 시 권한 동기화 기능 추가
