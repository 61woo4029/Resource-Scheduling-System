# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 프로젝트 개요

사내 자산·회의실·법인차량을 통합 관리하는 웹 애플리케이션.

- **백엔드**: Spring Boot 2.7.18 / Java 17 / PostgreSQL / JWT (`backend/`)
- **프론트엔드**: React 18 / MUI v7 / Redux Toolkit / React Router v7 (`frontend/`)
- 기획 스펙 문서: 루트의 `01_화면설계서.md` ~ `05_기동가이드.md`

---

## 실행 명령어

### 백엔드

```bash
cd backend
mvn spring-boot:run          # 개발 서버 실행 (port 8080)
mvn package -DskipTests      # 빌드
mvn test                     # 전체 테스트
mvn test -Dtest=UserServiceTest          # 단일 테스트 클래스 실행
mvn test -Dtest=UserServiceTest#testXxx  # 단일 테스트 메서드 실행
```

**DB 전제조건**: `application.properties`는 PostgreSQL(`localhost:5432/resource_management`)을 기본으로 사용. 테스트는 H2 인메모리(`src/test/resources/application.properties`)를 사용하므로 별도 DB 불필요.

### 프론트엔드

```bash
cd frontend
npm install
npm start    # 개발 서버 (port 3000)
npm test     # 테스트 (watch 모드)
npm run build
```

---

## 아키텍처

### 백엔드 패키지 구조 (`com.selim.resourcemanagement`)

```
config/      SecurityConfig, GlobalExceptionHandler, DataInitializer
controller/  REST API 엔드포인트 (URL: /api/*)
dto/         요청·응답 DTO (각 도메인별 Inner static class로 구성)
entity/      JPA 엔티티
repository/  Spring Data JPA
security/    JwtTokenProvider, JwtAuthenticationFilter, CustomUserDetailsService
service/     비즈니스 로직
```

**API 응답 포맷**: 모든 응답은 `ApiResponse<T>`로 래핑됨.
```json
{ "success": true, "message": "...", "data": { ... } }
```
프론트엔드에서 항상 `res.data.data`로 실제 데이터에 접근.

**권한 체계**: `USER` < `ASSET_ADMIN` < `SYSTEM_ADMIN`. 컨트롤러에서 `@PreAuthorize` 또는 SecurityConfig의 `antMatchers`로 제어.

**엔티티 Lombok 주의사항**: `@Builder` + `@AllArgsConstructor` + `@Builder.Default` 조합 사용 시, `@Builder.Default` 필드(예: `status = "CONFIRMED"`)가 의도대로 동작하지 않을 수 있음. 서비스 레이어 builder 호출 시 해당 필드를 명시적으로 설정할 것.

**초기 데이터**: 앱 기동 시 `DataInitializer`가 기본 계정·부서·회의실·차량·메뉴를 자동 생성.
- admin@selim.kr / admin123! (SYSTEM_ADMIN)
- user@selim.kr / user123! (USER)

### 프론트엔드 구조

```
src/
  App.js              라우팅 정의, ProtectedRoute 포함
  theme.js            MUI 커스텀 테마
  components/
    Layout.js         사이드바(260px) + 메인 영역, 반응형(모바일 AppBar)
    ErrorBoundary.js  각 페이지 래핑
  pages/              페이지 컴포넌트 (1파일 = 1페이지)
  services/api.js     Axios 인스턴스 + 모든 API 메서드, 토큰 자동 갱신 인터셉터
  store/
    index.js          Redux store
    authSlice.js      login/logout/updateTokens/updateUser
```

**인증 흐름**: 로그인 시 `accessToken`·`refreshToken`을 localStorage에 저장. Axios 인터셉터가 401 응답 시 refresh 엔드포인트를 호출해 자동 갱신. 갱신 실패 시 로그아웃 후 `/login`으로 리다이렉트.

**스케줄러 표 패턴** (회의실·법인차량 공통):
- `TIME_SLOTS`: 08:00 ~ 19:30 (30분 단위 문자열 배열)
- 예약 셀은 `rowSpan`으로 시간 범위 표시. 시작 슬롯만 셀 렌더링, 중간 슬롯은 `null` 반환.
- 시간 문자열 비교는 항상 `"HH:mm"` 형식을 전제로 함. 백엔드 응답의 `startTime`/`endTime`은 프론트에서 `normalizeTime()` (VehicleReservation.js)으로 정규화 처리.

**API 호출**: `src/services/api.js`에 모든 메서드 집중. 새 API 추가 시 이 파일에만 추가하고 각 페이지에서 import해서 사용.

---

## 주요 API-프론트엔드 매핑 주의사항

- `PUT /api/users/me` → `userApi.updateProfile(data)`
- `PUT /api/users/me/password` → `userApi.changePassword(data)`
- `VehicleDto.ReservationResponse`에 flat `vehicleId` / `userId` 필드가 있음 (nested `vehicle.vehicleId`와 별도)
- `MeetingRoomDto.ReservationResponse`에도 flat `roomId` / `userId` 필드 있음
- `PermissionRequestDto.Response`는 flat 구조: `userName`, `departmentName`, `currentRole`, `reason`, `adminComment`
