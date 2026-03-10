package com.selim.resourcemanagement.config;

import com.selim.resourcemanagement.entity.*;
import com.selim.resourcemanagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final MeetingRoomRepository meetingRoomRepository;
    private final VehicleRepository vehicleRepository;
    private final MenuRepository menuRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        initDepartments();
        initUsers();
        initMeetingRooms();
        initVehicles();
        initMenus();
        log.info("초기 데이터 로드 완료");
    }

    private void initDepartments() {
        if (departmentRepository.count() == 0) {
            departmentRepository.save(Department.builder().departmentName("경영지원팀").departmentCode("MGMT").build());
            departmentRepository.save(Department.builder().departmentName("IT개발팀").departmentCode("IT").build());
            departmentRepository.save(Department.builder().departmentName("영업팀").departmentCode("SALES").build());
            departmentRepository.save(Department.builder().departmentName("마케팅팀").departmentCode("MKT").build());
        }
    }

    private void initUsers() {
        if (!userRepository.existsByEmail("admin@selim.kr")) {
            Department dept = departmentRepository.findByIsActiveTrueOrderByDepartmentName().stream().findFirst().orElse(null);
            userRepository.save(User.builder()
                    .email("admin@selim.kr")
                    .passwordHash(passwordEncoder.encode("admin123!"))
                    .name("시스템관리자")
                    .department(dept)
                    .position("관리자")
                    .role("SYSTEM_ADMIN")
                    .build());
        }
        if (!userRepository.existsByEmail("user@selim.kr")) {
            Department dept = departmentRepository.findByIsActiveTrueOrderByDepartmentName().stream().findFirst().orElse(null);
            userRepository.save(User.builder()
                    .email("user@selim.kr")
                    .passwordHash(passwordEncoder.encode("user123!"))
                    .name("일반사용자")
                    .department(dept)
                    .position("사원")
                    .role("USER")
                    .build());
        }
    }

    private void initMeetingRooms() {
        if (meetingRoomRepository.count() == 0) {
            meetingRoomRepository.save(MeetingRoom.builder()
                    .roomName("회의실 A").location("본관 3층").capacity(10)
                    .facilities("프로젝터, 화이트보드").build());
            meetingRoomRepository.save(MeetingRoom.builder()
                    .roomName("회의실 B").location("본관 3층").capacity(6)
                    .facilities("TV 모니터, 화이트보드").build());
            meetingRoomRepository.save(MeetingRoom.builder()
                    .roomName("대회의실").location("본관 4층").capacity(30)
                    .facilities("프로젝터, 화이트보드, 마이크").build());
        }
    }

    private void initVehicles() {
        if (vehicleRepository.count() == 0) {
            vehicleRepository.save(Vehicle.builder()
                    .vehicleType("쏘렌토").vehicleCategory("SUV")
                    .vehicleNumber("123가4567").capacity(5).fuelType("가솔린").build());
            vehicleRepository.save(Vehicle.builder()
                    .vehicleType("K5").vehicleCategory("SEDAN")
                    .vehicleNumber("456나7890").capacity(5).fuelType("가솔린").build());
            vehicleRepository.save(Vehicle.builder()
                    .vehicleType("카니발").vehicleCategory("VAN")
                    .vehicleNumber("789다0123").capacity(9).fuelType("디젤").build());
        }
    }

    private void initMenus() {
        if (menuRepository.count() == 0) {
            menuRepository.save(Menu.builder().menuName("대시보드").menuUrl("/dashboard").displayOrder(1).icon("Dashboard").requiredRoles("USER,ASSET_ADMIN,SYSTEM_ADMIN").build());
            menuRepository.save(Menu.builder().menuName("마이페이지").menuUrl("/mypage").displayOrder(2).icon("Person").requiredRoles("USER,ASSET_ADMIN,SYSTEM_ADMIN").build());
            menuRepository.save(Menu.builder().menuName("자산 관리").menuUrl("/assets").displayOrder(3).icon("Computer").requiredRoles("USER,ASSET_ADMIN,SYSTEM_ADMIN").build());
            menuRepository.save(Menu.builder().menuName("회의실 예약").menuUrl("/meeting-rooms").displayOrder(4).icon("MeetingRoom").requiredRoles("USER,ASSET_ADMIN,SYSTEM_ADMIN").build());
            menuRepository.save(Menu.builder().menuName("법인차량 예약").menuUrl("/vehicles").displayOrder(5).icon("DirectionsCar").requiredRoles("USER,ASSET_ADMIN,SYSTEM_ADMIN").build());
            menuRepository.save(Menu.builder().menuName("사용자 관리").menuUrl("/admin/users").displayOrder(10).icon("People").requiredRoles("SYSTEM_ADMIN").build());
            menuRepository.save(Menu.builder().menuName("부서 관리").menuUrl("/admin/departments").displayOrder(11).icon("Business").requiredRoles("SYSTEM_ADMIN").build());
            menuRepository.save(Menu.builder().menuName("권한 관리").menuUrl("/admin/permissions").displayOrder(12).icon("Security").requiredRoles("SYSTEM_ADMIN").build());
            menuRepository.save(Menu.builder().menuName("메뉴 관리").menuUrl("/admin/menus").displayOrder(13).icon("ViewList").requiredRoles("SYSTEM_ADMIN").build());
        }
    }
}
