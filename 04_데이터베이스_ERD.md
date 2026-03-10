# 데이터베이스 ERD (Entity Relationship Diagram)

## 1. ERD 다이어그램

```
+------------------+       +------------------+       +------------------+
|   departments    |       |      users       |       | permission_      |
|------------------|       |------------------|       | requests         |
| PK department_id |<------| FK department_id |       |------------------|
|    dept_name     |       | PK user_id       |------>| FK user_id       |
|    dept_code     |       |    email         |       | PK request_id    |
| FK parent_dept_id|----+  |    password_hash |       |    requested_role|
|    is_active     |    |  |    name          |       |    request_reason|
|    created_at    |    |  |    position      |       |    status        |
|    updated_at    |    |  |    phone         |       | FK approved_by   |----+
+------------------+    |  |    role          |       |    rejection_    |    |
         |              |  |    is_active     |       |    reason        |    |
         +--------------+  |    created_at    |       |    requested_at  |    |
                          |    updated_at    |       |    processed_at  |    |
                          |    last_login    |       +------------------+    |
                          +------------------+                               |
                                   |                                         |
                                   +-----------------------------------------+
                                   |
        +-------------+------------+------------+------------+
        |             |            |            |            |
        v             v            v            v            v
+------------------+  |  +------------------+  |  +------------------+
|     assets       |  |  | room_reservations|  |  |vehicle_          |
|------------------|  |  |------------------|  |  |reservations      |
| PK asset_id      |  |  | PK reservation_id|  |  |------------------|
|    asset_number  |  |  | FK room_id       |  |  | PK reservation_id|
|    category      |  |  | FK user_id       |--+  | FK vehicle_id    |
|    user_name     |  |  |    user_phone    |     | FK user_id       |----+
|    status        |  |  |    reservation_  |     |    driver_name   |    |
|    purchase_month|  |  |    date          |     |    reservation_  |    |
|    manufacturer  |  |  |    start_time    |     |    date          |    |
|    model_name    |  |  |    end_time      |     |    start_time    |    |
|    serial_number |  |  |    meeting_title |     |    end_time      |    |
|    os            |  |  |    attendee_count|     |    purpose       |    |
|    cpu           |  |  |    notes         |     |    destination   |    |
|    ram           |  |  |    status        |     |    notes         |    |
|    ssd           |  |  |    created_at    |     |    status        |    |
|    hdd           |  |  |    updated_at    |     |    created_at    |    |
|    notes         |  |  +------------------+     |    updated_at    |    |
| FK created_by    |--+           |               +------------------+    |
| FK updated_by    |--+           |                        |              |
| FK deleted_by    |--+           v                        v              |
|    is_deleted    |     +------------------+     +------------------+    |
|    created_at    |     |  meeting_rooms   |     |    vehicles      |    |
|    updated_at    |     |------------------|     |------------------|    |
|    deleted_at    |     | PK room_id       |     | PK vehicle_id    |    |
+------------------+     |    room_name     |     |    vehicle_type  |    |
                         |    location      |     |    vehicle_      |    |
                         |    capacity      |     |    category      |    |
                         |    facilities    |     |    vehicle_number|    |
                         |    available_    |     |    capacity      |    |
                         |    hours         |     |    status        |    |
                         |    status        |     |    is_active     |    |
                         |    is_active     |     |    created_at    |    |
                         |    created_at    |     |    updated_at    |    |
                         |    updated_at    |     +------------------+    |
                         +------------------+                             |
                                                                          |
+------------------+                                                      |
|      menus       |                                                      |
|------------------|                                                      |
| PK menu_id       |                                                      |
|    menu_name     |                                                      |
|    menu_url      |                                                      |
| FK parent_menu_id|----+                                                 |
|    display_order |    |                                                 |
|    icon          |    |                                                 |
|    required_roles|    |                                                 |
|    is_active     |    |                                                 |
|    created_at    |    |                                                 |
|    updated_at    |    |                                                 |
+------------------+    |                                                 |
         |              |                                                 |
         +--------------+                                                 |
                                                                          |
                                                                          |
         +----------------------------------------------------------------+
```

---

## 2. 테이블 상세 명세

### 2.1 users (사용자)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|--------|------------|----------|------|
| user_id | BIGINT | PK, AUTO_INCREMENT | 사용자 고유 ID |
| email | VARCHAR(100) | UNIQUE, NOT NULL | 이메일 (로그인 ID) |
| password_hash | VARCHAR(255) | NOT NULL | 암호화된 비밀번호 |
| name | VARCHAR(50) | NOT NULL | 이름 |
| department_id | BIGINT | FK → departments | 소속 부서 |
| position | VARCHAR(50) | | 직급 |
| phone | VARCHAR(20) | | 전화번호 |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'USER' | 권한 (USER, ASSET_ADMIN, SYSTEM_ADMIN) |
| is_active | BOOLEAN | DEFAULT TRUE | 활성 상태 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 수정일시 |
| last_login | DATETIME | | 마지막 로그인 일시 |

**인덱스:**
- PRIMARY KEY (user_id)
- UNIQUE INDEX (email)
- INDEX (department_id)
- INDEX (role)

---

### 2.2 departments (부서)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|--------|------------|----------|------|
| department_id | BIGINT | PK, AUTO_INCREMENT | 부서 고유 ID |
| department_name | VARCHAR(100) | NOT NULL | 부서명 |
| department_code | VARCHAR(20) | | 부서 코드 |
| parent_department_id | BIGINT | FK → departments (자기참조) | 상위 부서 ID |
| is_active | BOOLEAN | DEFAULT TRUE | 활성 상태 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 수정일시 |

**인덱스:**
- PRIMARY KEY (department_id)
- INDEX (parent_department_id)
- INDEX (is_active)

---

### 2.3 permission_requests (권한 신청)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|--------|------------|----------|------|
| request_id | BIGINT | PK, AUTO_INCREMENT | 신청 고유 ID |
| user_id | BIGINT | FK → users, NOT NULL | 신청자 ID |
| requested_role | VARCHAR(20) | NOT NULL | 신청 권한 |
| request_reason | TEXT | NOT NULL | 신청 사유 |
| status | VARCHAR(20) | DEFAULT 'PENDING' | 상태 (PENDING, APPROVED, REJECTED) |
| approved_by | BIGINT | FK → users | 처리자 ID |
| rejection_reason | TEXT | | 반려 사유 |
| requested_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 신청일시 |
| processed_at | DATETIME | | 처리일시 |

**인덱스:**
- PRIMARY KEY (request_id)
- INDEX (user_id)
- INDEX (status)
- INDEX (requested_at)

---

### 2.4 assets (자산)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|--------|------------|----------|------|
| asset_id | BIGINT | PK, AUTO_INCREMENT | 자산 고유 ID |
| asset_number | VARCHAR(30) | UNIQUE, NOT NULL | 자산관리번호 |
| category | VARCHAR(20) | NOT NULL | 카테고리 (DESKTOP, LAPTOP, SERVER, MONITOR) |
| user_name | VARCHAR(100) | NOT NULL | 사용자명 |
| status | VARCHAR(20) | DEFAULT '미사용' | 상태 (사용, 미사용, 폐기) |
| purchase_month | VARCHAR(7) | | 구입년월 (YYYY-MM) |
| manufacturer | VARCHAR(100) | | 제조사 |
| model_name | VARCHAR(100) | | 모델명 |
| serial_number | VARCHAR(100) | UNIQUE | 시리얼 넘버 |
| os | VARCHAR(100) | | 운영체제 |
| cpu | VARCHAR(100) | | 프로세서 |
| ram | VARCHAR(50) | | 메모리 |
| ssd | VARCHAR(50) | | SSD 용량 |
| hdd | VARCHAR(50) | | HDD 용량 |
| notes | TEXT | | 비고 |
| created_by | BIGINT | FK → users | 등록자 ID |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 등록일시 |
| updated_by | BIGINT | FK → users | 수정자 ID |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 수정일시 |
| is_deleted | BOOLEAN | DEFAULT FALSE | 삭제 여부 (논리적 삭제) |
| deleted_by | BIGINT | FK → users | 삭제자 ID |
| deleted_at | DATETIME | | 삭제일시 |

**인덱스:**
- PRIMARY KEY (asset_id)
- UNIQUE INDEX (asset_number)
- UNIQUE INDEX (serial_number)
- INDEX (category)
- INDEX (status)
- INDEX (is_deleted)

---

### 2.5 meeting_rooms (회의실)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|--------|------------|----------|------|
| room_id | BIGINT | PK, AUTO_INCREMENT | 회의실 고유 ID |
| room_name | VARCHAR(100) | NOT NULL | 회의실명 |
| location | VARCHAR(100) | | 위치 |
| capacity | INT | NOT NULL | 수용 인원 |
| facilities | TEXT | | 시설 (프로젝터, 화이트보드 등) |
| available_hours | VARCHAR(50) | DEFAULT '08:00-20:00' | 이용 가능 시간 |
| status | VARCHAR(20) | DEFAULT 'AVAILABLE' | 상태 (AVAILABLE, MAINTENANCE, UNAVAILABLE) |
| is_active | BOOLEAN | DEFAULT TRUE | 활성 상태 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 수정일시 |

**인덱스:**
- PRIMARY KEY (room_id)
- INDEX (status)
- INDEX (is_active)

---

### 2.6 room_reservations (회의실 예약)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|--------|------------|----------|------|
| reservation_id | BIGINT | PK, AUTO_INCREMENT | 예약 고유 ID |
| room_id | BIGINT | FK → meeting_rooms, NOT NULL | 회의실 ID |
| user_id | BIGINT | FK → users, NOT NULL | 예약자 ID |
| user_phone | VARCHAR(20) | | 예약자 연락처 |
| reservation_date | DATE | NOT NULL | 예약 날짜 |
| start_time | TIME | NOT NULL | 시작 시간 |
| end_time | TIME | NOT NULL | 종료 시간 |
| meeting_title | VARCHAR(200) | NOT NULL | 회의 제목 |
| attendee_count | INT | | 참석 인원 |
| notes | TEXT | | 비고 |
| status | VARCHAR(20) | DEFAULT 'CONFIRMED' | 상태 (CONFIRMED, CANCELLED) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 수정일시 |

**인덱스:**
- PRIMARY KEY (reservation_id)
- INDEX (room_id)
- INDEX (user_id)
- INDEX (reservation_date)
- INDEX (status)
- COMPOSITE INDEX (room_id, reservation_date, start_time)

---

### 2.7 vehicles (차량)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|--------|------------|----------|------|
| vehicle_id | BIGINT | PK, AUTO_INCREMENT | 차량 고유 ID |
| vehicle_type | VARCHAR(50) | NOT NULL | 차량 종류 (쏘렌토, K5 등) |
| vehicle_category | VARCHAR(20) | NOT NULL | 차량 분류 (SEDAN, SUV, VAN) |
| vehicle_number | VARCHAR(20) | UNIQUE, NOT NULL | 차량 번호 |
| capacity | INT | NOT NULL | 승차 인원 |
| status | VARCHAR(20) | DEFAULT 'AVAILABLE' | 상태 (AVAILABLE, RESERVED, MAINTENANCE, UNAVAILABLE) |
| is_active | BOOLEAN | DEFAULT TRUE | 활성 상태 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 수정일시 |

**인덱스:**
- PRIMARY KEY (vehicle_id)
- UNIQUE INDEX (vehicle_number)
- INDEX (status)
- INDEX (is_active)

---

### 2.8 vehicle_reservations (차량 예약)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|--------|------------|----------|------|
| reservation_id | BIGINT | PK, AUTO_INCREMENT | 예약 고유 ID |
| vehicle_id | BIGINT | FK → vehicles, NOT NULL | 차량 ID |
| user_id | BIGINT | FK → users, NOT NULL | 예약자 ID |
| driver_name | VARCHAR(50) | NOT NULL | 운전자명 |
| reservation_date | DATE | NOT NULL | 예약 날짜 |
| start_time | TIME | NOT NULL | 시작 시간 |
| end_time | TIME | NOT NULL | 종료 시간 |
| purpose | VARCHAR(200) | NOT NULL | 사용 목적 |
| destination | VARCHAR(200) | | 목적지 |
| notes | TEXT | | 비고 |
| status | VARCHAR(20) | DEFAULT 'CONFIRMED' | 상태 (CONFIRMED, CANCELLED, COMPLETED) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 수정일시 |

**인덱스:**
- PRIMARY KEY (reservation_id)
- INDEX (vehicle_id)
- INDEX (user_id)
- INDEX (reservation_date)
- INDEX (status)
- COMPOSITE INDEX (vehicle_id, reservation_date, start_time)

---

### 2.9 menus (메뉴)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|--------|------------|----------|------|
| menu_id | BIGINT | PK, AUTO_INCREMENT | 메뉴 고유 ID |
| menu_name | VARCHAR(100) | NOT NULL | 메뉴명 |
| menu_url | VARCHAR(200) | | 메뉴 URL |
| parent_menu_id | BIGINT | FK → menus (자기참조) | 상위 메뉴 ID |
| display_order | INT | DEFAULT 0 | 표시 순서 |
| icon | VARCHAR(50) | | 아이콘 이름 |
| required_roles | TEXT | | 접근 가능 권한 (콤마 구분) |
| is_active | BOOLEAN | DEFAULT TRUE | 활성 상태 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 수정일시 |

**인덱스:**
- PRIMARY KEY (menu_id)
- INDEX (parent_menu_id)
- INDEX (display_order)
- INDEX (is_active)

---

## 3. 테이블 관계 요약

| 관계 | 유형 | 설명 |
|------|------|------|
| departments → departments | 1:N (자기참조) | 상위-하위 부서 관계 |
| departments → users | 1:N | 부서 - 소속 사용자 |
| users → permission_requests | 1:N | 사용자 - 권한 신청 |
| users → permission_requests (approved_by) | 1:N | 관리자 - 처리한 신청 |
| users → assets | 1:N | 등록자/수정자/삭제자 |
| users → room_reservations | 1:N | 예약자 - 회의실 예약 |
| users → vehicle_reservations | 1:N | 예약자 - 차량 예약 |
| meeting_rooms → room_reservations | 1:N | 회의실 - 예약 |
| vehicles → vehicle_reservations | 1:N | 차량 - 예약 |
| menus → menus | 1:N (자기참조) | 상위-하위 메뉴 관계 |

---

## 4. Enum 타입 정의

### 4.1 User.Role
```java
public enum Role {
    USER,           // 일반 사용자
    ASSET_ADMIN,    // 자산 관리자
    SYSTEM_ADMIN    // 시스템 관리자
}
```

### 4.2 Asset.Category
```java
public enum Category {
    DESKTOP,   // 데스크탑
    LAPTOP,    // 노트북
    SERVER,    // 서버
    MONITOR    // 모니터
}
```

### 4.3 MeetingRoom.Status
```java
public enum Status {
    AVAILABLE,      // 이용 가능
    MAINTENANCE,    // 점검 중
    UNAVAILABLE     // 이용 불가
}
```

### 4.4 RoomReservation.Status
```java
public enum Status {
    CONFIRMED,   // 확정
    CANCELLED    // 취소됨
}
```

### 4.5 Vehicle.Category
```java
public enum Category {
    SEDAN,   // 세단
    SUV,     // SUV
    VAN      // 승합차
}
```

### 4.6 Vehicle.Status
```java
public enum Status {
    AVAILABLE,      // 이용 가능
    RESERVED,       // 예약 중
    MAINTENANCE,    // 점검 중
    UNAVAILABLE     // 이용 불가
}
```

### 4.7 VehicleReservation.Status
```java
public enum Status {
    CONFIRMED,   // 확정
    CANCELLED,   // 취소됨
    COMPLETED    // 완료
}
```

### 4.8 PermissionRequest.Status
```java
public enum Status {
    PENDING,    // 대기중
    APPROVED,   // 승인됨
    REJECTED    // 반려됨
}
```

---

## 5. DDL 스크립트 (PostgreSQL/MySQL 호환)

```sql
-- 부서 테이블
CREATE TABLE departments (
    department_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(20),
    parent_department_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_department_id) REFERENCES departments(department_id)
);

-- 사용자 테이블
CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    department_id BIGINT,
    position VARCHAR(50),
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login DATETIME,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- 권한 신청 테이블
CREATE TABLE permission_requests (
    request_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    requested_role VARCHAR(20) NOT NULL,
    request_reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    approved_by BIGINT,
    rejection_reason TEXT,
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

-- 자산 테이블
CREATE TABLE assets (
    asset_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    asset_number VARCHAR(30) UNIQUE NOT NULL,
    category VARCHAR(20) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT '미사용',
    purchase_month VARCHAR(7),
    manufacturer VARCHAR(100),
    model_name VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    os VARCHAR(100),
    cpu VARCHAR(100),
    ram VARCHAR(50),
    ssd VARCHAR(50),
    hdd VARCHAR(50),
    notes TEXT,
    created_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by BIGINT,
    deleted_at DATETIME,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id),
    FOREIGN KEY (deleted_by) REFERENCES users(user_id)
);

-- 회의실 테이블
CREATE TABLE meeting_rooms (
    room_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    capacity INT NOT NULL,
    facilities TEXT,
    available_hours VARCHAR(50) DEFAULT '08:00-20:00',
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 회의실 예약 테이블
CREATE TABLE room_reservations (
    reservation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    user_phone VARCHAR(20),
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    meeting_title VARCHAR(200) NOT NULL,
    attendee_count INT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'CONFIRMED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES meeting_rooms(room_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 차량 테이블
CREATE TABLE vehicles (
    vehicle_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_type VARCHAR(50) NOT NULL,
    vehicle_category VARCHAR(20) NOT NULL,
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    capacity INT NOT NULL,
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 차량 예약 테이블
CREATE TABLE vehicle_reservations (
    reservation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    driver_name VARCHAR(50) NOT NULL,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose VARCHAR(200) NOT NULL,
    destination VARCHAR(200),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'CONFIRMED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 메뉴 테이블
CREATE TABLE menus (
    menu_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    menu_name VARCHAR(100) NOT NULL,
    menu_url VARCHAR(200),
    parent_menu_id BIGINT,
    display_order INT DEFAULT 0,
    icon VARCHAR(50),
    required_roles TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_menu_id) REFERENCES menus(menu_id)
);

-- 인덱스 생성
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department_id);

CREATE INDEX idx_assets_category ON assets(category);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_deleted ON assets(is_deleted);

CREATE INDEX idx_room_reservations_date ON room_reservations(reservation_date);
CREATE INDEX idx_room_reservations_room ON room_reservations(room_id);
CREATE INDEX idx_room_reservations_composite ON room_reservations(room_id, reservation_date, start_time);

CREATE INDEX idx_vehicle_reservations_date ON vehicle_reservations(reservation_date);
CREATE INDEX idx_vehicle_reservations_vehicle ON vehicle_reservations(vehicle_id);
CREATE INDEX idx_vehicle_reservations_composite ON vehicle_reservations(vehicle_id, reservation_date, start_time);

CREATE INDEX idx_permission_requests_status ON permission_requests(status);
CREATE INDEX idx_permission_requests_user ON permission_requests(user_id);
```

---

## 6. 초기 데이터 (Seed Data)

```sql
-- 부서 초기 데이터
INSERT INTO departments (department_name, department_code) VALUES
('경영지원팀', 'MGMT'),
('IT개발팀', 'IT'),
('영업팀', 'SALES'),
('마케팅팀', 'MKT');

-- 관리자 계정 (비밀번호: admin123!)
INSERT INTO users (email, password_hash, name, department_id, position, role) VALUES
('admin@selim.kr', '$2a$10$...', '시스템관리자', 1, '관리자', 'SYSTEM_ADMIN');

-- 회의실 초기 데이터
INSERT INTO meeting_rooms (room_name, location, capacity, facilities) VALUES
('회의실 A', '본관 3층', 10, '프로젝터, 화이트보드'),
('회의실 B', '본관 3층', 6, 'TV 모니터, 화이트보드'),
('대회의실', '본관 4층', 30, '프로젝터, 화이트보드, 마이크');

-- 차량 초기 데이터
INSERT INTO vehicles (vehicle_type, vehicle_category, vehicle_number, capacity) VALUES
('쏘렌토', 'SUV', '123가4567', 5),
('K5', 'SEDAN', '456나7890', 5),
('카니발', 'VAN', '789다0123', 9);

-- 메뉴 초기 데이터
INSERT INTO menus (menu_name, menu_url, display_order, icon, required_roles) VALUES
('대시보드', '/dashboard', 1, 'Dashboard', 'USER,ASSET_ADMIN,SYSTEM_ADMIN'),
('마이페이지', '/mypage', 2, 'Person', 'USER,ASSET_ADMIN,SYSTEM_ADMIN'),
('자산 관리', '/assets', 3, 'Computer', 'USER,ASSET_ADMIN,SYSTEM_ADMIN'),
('회의실 예약', '/meeting-rooms', 4, 'MeetingRoom', 'USER,ASSET_ADMIN,SYSTEM_ADMIN'),
('법인차량 예약', '/vehicles', 5, 'DirectionsCar', 'USER,ASSET_ADMIN,SYSTEM_ADMIN'),
('사용자 관리', '/admin/users', 10, 'People', 'SYSTEM_ADMIN'),
('부서 관리', '/admin/departments', 11, 'Business', 'SYSTEM_ADMIN'),
('권한 관리', '/admin/permissions', 12, 'Security', 'SYSTEM_ADMIN'),
('메뉴 관리', '/admin/menus', 13, 'ViewList', 'SYSTEM_ADMIN');
```
