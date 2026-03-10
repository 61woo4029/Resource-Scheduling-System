# API 명세서 (API Specification)

## 1. 개요

### 1.1 기본 정보
- **Base URL**: `http://localhost:8080/api`
- **인증 방식**: JWT Bearer Token
- **Content-Type**: `application/json`

### 1.2 공통 응답 형식
```json
{
  "success": true,
  "message": "처리 완료 메시지",
  "data": { ... }
}
```

### 1.3 에러 응답 형식
```json
{
  "success": false,
  "message": "에러 메시지",
  "data": null
}
```

### 1.4 인증 헤더
```
Authorization: Bearer {accessToken}
```

---

## 2. 인증 API (Auth)

### 2.1 회원가입
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "hong@selim.kr",
  "password": "password123!",
  "name": "홍길동",
  "departmentId": 1,
  "position": "과장",
  "phone": "010-1234-5678"
}
```

**유효성 검사:**
| 필드 | 규칙 |
|------|------|
| email | @selim.kr 도메인만 허용 |
| password | 8자 이상, 소문자+숫자+특수문자 조합 |
| phone | 010-XXXX-XXXX 형식 |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다.",
  "data": {
    "user_id": 1,
    "email": "hong@selim.kr",
    "name": "홍길동",
    "department": "경영지원팀"
  }
}
```

---

### 2.2 로그인
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "hong@selim.kr",
  "password": "password123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": 1,
      "email": "hong@selim.kr",
      "name": "홍길동",
      "department": "경영지원팀",
      "position": "과장",
      "role": "USER",
      "phone": "010-1234-5678"
    }
  }
}
```

---

### 2.3 로그아웃
```
POST /api/auth/logout
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "로그아웃되었습니다."
}
```

---

### 2.4 토큰 갱신
```
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": 1,
      "email": "hong@selim.kr",
      "name": "홍길동",
      "department": "경영지원팀",
      "position": "과장",
      "role": "USER",
      "phone": "010-1234-5678"
    }
  }
}
```

---

### 2.5 비밀번호 변경
```
PUT /api/auth/password/change
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123!",
  "newPassword": "newPassword456!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "비밀번호가 변경되었습니다."
}
```

---

## 3. 사용자 API (Users)

### 3.1 사용자 목록 조회 (SYSTEM_ADMIN)
```
GET /api/users?search={keyword}&department={id}&role={role}&page={page}&size={size}
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| search | string | X | 이름/이메일 검색어 |
| department | number | X | 부서 ID |
| role | string | X | USER, ASSET_ADMIN, SYSTEM_ADMIN |
| page | number | X | 페이지 번호 (0부터 시작) |
| size | number | X | 페이지 크기 (기본 20) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "userId": 1,
        "email": "hong@selim.kr",
        "name": "홍길동",
        "department": "경영지원팀",
        "position": "과장",
        "role": "USER",
        "isActive": true
      }
    ],
    "pagination": {
      "currentPage": 0,
      "totalPages": 5,
      "totalItems": 100,
      "pageSize": 20
    }
  }
}
```

---

### 3.2 현재 사용자 정보 조회
```
GET /api/users/me
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "hong@selim.kr",
    "name": "홍길동",
    "department": "경영지원팀",
    "departmentId": 1,
    "position": "과장",
    "role": "USER",
    "phone": "010-1234-5678",
    "isActive": true
  }
}
```

---

### 3.3 사용자 정보 수정
```
PUT /api/users/{id}
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "name": "홍길동",
  "departmentId": 2,
  "position": "차장",
  "phone": "010-9876-5432"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "사용자 정보가 수정되었습니다.",
  "data": { ... }
}
```

---

### 3.4 사용자 권한 변경 (SYSTEM_ADMIN)
```
PUT /api/users/{id}/role
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "role": "ASSET_ADMIN"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "권한이 변경되었습니다."
}
```

---

### 3.5 비밀번호 초기화 (SYSTEM_ADMIN)
```
POST /api/users/{id}/password/reset
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "new_password": "tempPassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "비밀번호가 초기화되었습니다."
}
```

---

## 4. 부서 API (Departments)

### 4.1 부서 목록 조회 (활성 부서만)
```
GET /api/departments
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "departmentId": 1,
      "departmentName": "경영지원팀",
      "departmentCode": "MGMT",
      "parentDepartment": null,
      "isActive": true
    },
    {
      "departmentId": 2,
      "departmentName": "IT팀",
      "departmentCode": "IT",
      "parentDepartment": {
        "departmentId": 1,
        "departmentName": "경영지원팀"
      },
      "isActive": true
    }
  ]
}
```

---

### 4.2 부서 전체 목록 조회 (SYSTEM_ADMIN)
```
GET /api/departments/all
Authorization: Bearer {accessToken}
```

---

### 4.3 부서 등록 (SYSTEM_ADMIN)
```
POST /api/departments
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "departmentName": "개발팀",
  "departmentCode": "DEV",
  "parentDepartmentId": 2,
  "isActive": true
}
```

---

### 4.4 부서 수정 (SYSTEM_ADMIN)
```
PUT /api/departments/{id}
Authorization: Bearer {accessToken}
```

---

### 4.5 부서 삭제 (SYSTEM_ADMIN)
```
DELETE /api/departments/{id}
Authorization: Bearer {accessToken}
```

---

## 5. 권한 신청 API (Permission Requests)

### 5.1 권한 신청
```
POST /api/permission-requests
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "requestedRole": "ASSET_ADMIN",
  "requestReason": "자산 관리 업무 수행을 위해 필요합니다."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "권한 신청이 완료되었습니다.",
  "data": {
    "requestId": 1,
    "requestedRole": "ASSET_ADMIN",
    "status": "PENDING"
  }
}
```

---

### 5.2 권한 신청 목록 조회 (SYSTEM_ADMIN)
```
GET /api/permission-requests?status={status}
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| 파라미터 | 값 | 설명 |
|---------|-----|------|
| status | PENDING | 대기중 |
| status | APPROVED | 승인됨 |
| status | REJECTED | 반려됨 |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "requestId": 1,
      "user": {
        "userId": 2,
        "name": "김철수",
        "department": "IT팀",
        "currentRole": "USER"
      },
      "requestedRole": "ASSET_ADMIN",
      "requestReason": "자산 관리 업무 수행",
      "status": "PENDING",
      "requestedAt": "2024-12-15T10:30:00",
      "processedAt": null,
      "rejectionReason": null
    }
  ]
}
```

---

### 5.3 내 권한 신청 목록 조회
```
GET /api/permission-requests/my
Authorization: Bearer {accessToken}
```

---

### 5.4 대기중 신청 건수 조회 (SYSTEM_ADMIN)
```
GET /api/permission-requests/pending/count
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

---

### 5.5 권한 신청 승인 (SYSTEM_ADMIN)
```
PUT /api/permission-requests/{id}/approve
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "권한 신청이 승인되었습니다."
}
```

---

### 5.6 권한 신청 반려 (SYSTEM_ADMIN)
```
PUT /api/permission-requests/{id}/reject
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "rejection_reason": "업무 범위에 해당하지 않습니다."
}
```

---

## 6. 자산 API (Assets)

### 6.1 자산 목록 조회
```
GET /api/assets?category={category}&asset_number={number}&user_name={name}&status={status}&page={page}&size={size}
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| category | string | X | DESKTOP, LAPTOP, SERVER, MONITOR |
| asset_number | string | X | 자산관리번호 검색 |
| user_name | string | X | 사용자명 검색 |
| status | string | X | 사용, 미사용, 폐기 |
| page | number | X | 페이지 번호 |
| size | number | X | 페이지 크기 (기본 20) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "assetId": 1,
        "assetNumber": "IT-2024-001",
        "category": "LAPTOP",
        "userName": "홍길동",
        "status": "사용",
        "purchaseMonth": "2024-01",
        "manufacturer": "Dell",
        "modelName": "Latitude 5520",
        "serialNumber": "ABC123456",
        "os": "Windows 11",
        "cpu": "Intel i7-1185G7",
        "ram": "16GB",
        "ssd": "512GB",
        "hdd": null,
        "notes": null
      }
    ],
    "pagination": {
      "currentPage": 0,
      "totalPages": 5,
      "totalItems": 100,
      "pageSize": 20
    }
  }
}
```

---

### 6.2 자산 등록 (ASSET_ADMIN, SYSTEM_ADMIN)
```
POST /api/assets
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "assetNumber": "IT-2024-002",
  "category": "LAPTOP",
  "userName": "김철수",
  "status": "미사용",
  "purchaseMonth": "2024-12",
  "manufacturer": "HP",
  "modelName": "EliteBook 840",
  "serialNumber": "XYZ789012",
  "os": "Windows 11",
  "cpu": "Intel i5-1235U",
  "ram": "16GB",
  "ssd": "256GB",
  "hdd": null,
  "notes": "신규 입고"
}
```

---

### 6.3 자산 수정 (ASSET_ADMIN, SYSTEM_ADMIN)
```
PUT /api/assets/{id}
Authorization: Bearer {accessToken}
```

---

### 6.4 자산 삭제 (ASSET_ADMIN, SYSTEM_ADMIN)
```
DELETE /api/assets/{id}
Authorization: Bearer {accessToken}
```

---

### 6.5 자산 일괄 삭제 (ASSET_ADMIN, SYSTEM_ADMIN)
```
DELETE /api/assets/batch
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "ids": [1, 2, 3]
}
```

---

### 6.6 엑셀 업로드 (ASSET_ADMIN, SYSTEM_ADMIN)
```
POST /api/assets/upload
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Form Data:**
| 필드 | 타입 | 설명 |
|------|------|------|
| file | file | .xlsx, .xls 파일 |
| category | string | DESKTOP, LAPTOP, SERVER, MONITOR |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "자산 업로드가 완료되었습니다.",
  "data": {
    "total": 10,
    "success": 8,
    "failed": 2,
    "errors": [
      { "row": 3, "reason": "자산관리번호 중복" },
      { "row": 7, "reason": "필수 필드 누락" }
    ]
  }
}
```

---

### 6.7 템플릿 다운로드 (ASSET_ADMIN, SYSTEM_ADMIN)
```
GET /api/assets/template/{category}
Authorization: Bearer {accessToken}
```

**Response:** Excel 파일 (application/octet-stream)

---

### 6.8 엑셀 내보내기
```
GET /api/assets/export?category={category}
Authorization: Bearer {accessToken}
```

**Response:** Excel 파일 (application/octet-stream)

---

## 7. 회의실 API (Meeting Rooms)

### 7.1 회의실 목록 조회
```
GET /api/meeting-rooms
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "roomId": 1,
      "roomName": "회의실 A",
      "location": "본관 3층",
      "capacity": 10,
      "facilities": "프로젝터, 화이트보드",
      "availableHours": "08:00-20:00",
      "status": "AVAILABLE"
    }
  ]
}
```

---

### 7.2 회의실 등록 (SYSTEM_ADMIN)
```
POST /api/meeting-rooms
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "roomName": "회의실 C",
  "location": "본관 4층",
  "capacity": 8,
  "facilities": "TV 모니터, 화이트보드",
  "availableHours": "08:00-20:00"
}
```

---

### 7.3 회의실 수정 (SYSTEM_ADMIN)
```
PUT /api/meeting-rooms/{id}
Authorization: Bearer {accessToken}
```

---

### 7.4 회의실 삭제 (SYSTEM_ADMIN)
```
DELETE /api/meeting-rooms/{id}
Authorization: Bearer {accessToken}
```

---

## 8. 회의실 예약 API (Room Reservations)

### 8.1 예약 목록 조회
```
GET /api/room-reservations?viewType={type}&roomId={id}&date={date}&startDate={start}&endDate={end}
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| viewType | string | X | daily, weekly |
| roomId | number | 주별 필수 | 회의실 ID |
| date | date | 일별 필수 | 조회 날짜 (YYYY-MM-DD) |
| startDate | date | 주별 필수 | 시작 날짜 |
| endDate | date | 주별 필수 | 종료 날짜 |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "reservationId": 1,
      "room": {
        "roomId": 1,
        "roomName": "회의실 A",
        "location": "본관 3층"
      },
      "user": {
        "userId": 1,
        "name": "홍길동",
        "phone": "010-1234-5678"
      },
      "reservationDate": "2024-12-15",
      "startTime": "09:00",
      "endTime": "10:00",
      "meetingTitle": "주간 회의",
      "attendeeCount": 5,
      "notes": null,
      "status": "CONFIRMED"
    }
  ]
}
```

---

### 8.2 내 예약 목록 조회
```
GET /api/room-reservations/my
Authorization: Bearer {accessToken}
```

---

### 8.3 예약 등록
```
POST /api/room-reservations
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "roomId": 1,
  "reservationDate": "2024-12-16",
  "startTime": "14:00",
  "endTime": "15:30",
  "meetingTitle": "프로젝트 킥오프 미팅",
  "attendeeCount": 8,
  "notes": "외부 참석자 포함"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "회의실 예약이 완료되었습니다.",
  "data": {
    "reservationId": 5,
    ...
  }
}
```

---

### 8.4 예약 수정
```
PUT /api/room-reservations/{id}
Authorization: Bearer {accessToken}
```

---

### 8.5 예약 취소
```
DELETE /api/room-reservations/{id}
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "예약이 취소되었습니다."
}
```

---

## 9. 차량 API (Vehicles)

### 9.1 차량 목록 조회
```
GET /api/vehicles
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "vehicleId": 1,
      "vehicleType": "쏘렌토",
      "vehicleCategory": "SUV",
      "vehicleNumber": "123가4567",
      "capacity": 5,
      "status": "AVAILABLE"
    }
  ]
}
```

---

### 9.2 차량 등록 (SYSTEM_ADMIN)
```
POST /api/vehicles
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "vehicleType": "K5",
  "vehicleCategory": "SEDAN",
  "vehicleNumber": "456나7890",
  "capacity": 5
}
```

---

### 9.3 차량 수정 (SYSTEM_ADMIN)
```
PUT /api/vehicles/{id}
Authorization: Bearer {accessToken}
```

---

### 9.4 차량 삭제 (SYSTEM_ADMIN)
```
DELETE /api/vehicles/{id}
Authorization: Bearer {accessToken}
```

---

## 10. 차량 예약 API (Vehicle Reservations)

### 10.1 예약 목록 조회
```
GET /api/vehicle-reservations?viewType={type}&vehicleId={id}&date={date}&startDate={start}&endDate={end}
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| viewType | string | X | daily, weekly, monthly |
| vehicleId | number | 주별/월별 필수 | 차량 ID |
| date | date | 일별 필수 | 조회 날짜 |
| startDate | date | 주별/월별 필수 | 시작 날짜 |
| endDate | date | 주별/월별 필수 | 종료 날짜 |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "reservationId": 1,
      "vehicle": {
        "vehicleId": 1,
        "vehicleType": "쏘렌토",
        "vehicleNumber": "123가4567"
      },
      "user": {
        "userId": 1,
        "name": "홍길동"
      },
      "reservationDate": "2024-12-15",
      "startTime": "09:00",
      "endTime": "18:00",
      "driverName": "홍길동",
      "purpose": "부산 출장",
      "destination": "부산 해운대구",
      "notes": null,
      "status": "CONFIRMED"
    }
  ]
}
```

---

### 10.2 내 예약 목록 조회
```
GET /api/vehicle-reservations/my
Authorization: Bearer {accessToken}
```

---

### 10.3 예약 등록
```
POST /api/vehicle-reservations
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "vehicleId": 1,
  "reservationDate": "2024-12-17",
  "startTime": "08:00",
  "endTime": "19:00",
  "driverName": "김철수",
  "purpose": "고객사 방문",
  "destination": "서울 강남구",
  "notes": "주차비 정산 예정"
}
```

---

### 10.4 예약 수정
```
PUT /api/vehicle-reservations/{id}
Authorization: Bearer {accessToken}
```

---

### 10.5 예약 취소
```
DELETE /api/vehicle-reservations/{id}
Authorization: Bearer {accessToken}
```

---

## 11. 메뉴 API (Menus)

### 11.1 메뉴 목록 조회
```
GET /api/menus
Authorization: Bearer {accessToken}
```

---

### 11.2 메뉴 트리 조회
```
GET /api/menus/tree
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "menuId": 1,
      "menuName": "대시보드",
      "menuUrl": "/dashboard",
      "icon": "Dashboard",
      "displayOrder": 1,
      "requiredRoles": "USER,ASSET_ADMIN,SYSTEM_ADMIN",
      "children": []
    },
    {
      "menuId": 10,
      "menuName": "관리",
      "menuUrl": null,
      "icon": "Settings",
      "displayOrder": 10,
      "requiredRoles": "SYSTEM_ADMIN",
      "children": [
        {
          "menuId": 11,
          "menuName": "사용자 관리",
          "menuUrl": "/admin/users",
          ...
        }
      ]
    }
  ]
}
```

---

### 11.3 내 메뉴 조회
```
GET /api/menus/my
Authorization: Bearer {accessToken}
```

권한에 따라 접근 가능한 메뉴만 반환

---

### 11.4 메뉴 등록 (SYSTEM_ADMIN)
```
POST /api/menus
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "menuName": "새 메뉴",
  "menuUrl": "/new-menu",
  "parentMenuId": null,
  "displayOrder": 5,
  "icon": "Star",
  "requiredRoles": "USER,ASSET_ADMIN,SYSTEM_ADMIN"
}
```

---

### 11.5 메뉴 수정 (SYSTEM_ADMIN)
```
PUT /api/menus/{id}
Authorization: Bearer {accessToken}
```

---

### 11.6 메뉴 삭제 (SYSTEM_ADMIN)
```
DELETE /api/menus/{id}
Authorization: Bearer {accessToken}
```

---

## 12. 에러 코드

### 12.1 HTTP 상태 코드
| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 400 | 잘못된 요청 (유효성 검사 실패) |
| 401 | 인증 실패 (토큰 만료/유효하지 않음) |
| 403 | 권한 없음 |
| 404 | 리소스를 찾을 수 없음 |
| 409 | 충돌 (중복 데이터) |
| 500 | 서버 내부 오류 |

### 12.2 비즈니스 에러 메시지
| 상황 | 메시지 |
|------|--------|
| 로그인 실패 | "이메일 또는 비밀번호가 올바르지 않습니다." |
| 이메일 중복 | "이미 사용중인 이메일입니다." |
| 자산번호 중복 | "이미 등록된 자산관리번호입니다." |
| 예약 시간 중복 | "해당 시간대에 이미 예약이 있습니다." |
| 권한 부족 | "접근 권한이 없습니다." |
| 본인 예약만 수정 | "본인의 예약만 수정/취소할 수 있습니다." |
