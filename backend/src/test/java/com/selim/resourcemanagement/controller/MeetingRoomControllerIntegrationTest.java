package com.selim.resourcemanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.selim.resourcemanagement.dto.AuthDto;
import com.selim.resourcemanagement.dto.MeetingRoomDto;
import com.selim.resourcemanagement.entity.Department;
import com.selim.resourcemanagement.entity.MeetingRoom;
import com.selim.resourcemanagement.entity.User;
import com.selim.resourcemanagement.repository.DepartmentRepository;
import com.selim.resourcemanagement.repository.MeetingRoomRepository;
import com.selim.resourcemanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@DisplayName("MeetingRoom 통합 테스트")
class MeetingRoomControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired MeetingRoomRepository meetingRoomRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private String userToken;
    private MeetingRoom room;

    @BeforeEach
    void setUp() throws Exception {
        userRepository.deleteAll();
        meetingRoomRepository.deleteAll();

        Department dept = departmentRepository.save(
                Department.builder().departmentName("개발팀").departmentCode("DEV").build());

        userRepository.save(User.builder()
                .email("user@test.com").passwordHash(passwordEncoder.encode("user1234!"))
                .name("테스터").department(dept).phone("010-1111-2222")
                .role("USER").isActive(true).build());

        room = meetingRoomRepository.save(MeetingRoom.builder()
                .roomName("회의실A").location("3층").capacity(10)
                .facilities("TV").status("AVAILABLE").build());

        userToken = login("user@test.com", "user1234!");
    }

    private String login(String email, String password) throws Exception {
        String body = objectMapper.writeValueAsString(new AuthDto.LoginRequest(email, password));
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Test
    @DisplayName("GET /api/meeting-rooms - 회의실 목록 조회")
    void getRooms_success() throws Exception {
        mockMvc.perform(get("/api/meeting-rooms")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("POST /api/room-reservations - 예약 생성 성공")
    void createReservation_success() throws Exception {
        MeetingRoomDto.ReservationCreateRequest req = new MeetingRoomDto.ReservationCreateRequest(
                room.getRoomId(), "2026-04-01", "09:00", "10:00", "팀 회의", 5, null);

        mockMvc.perform(post("/api/room-reservations")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.meetingTitle").value("팀 회의"))
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"));
    }

    @Test
    @DisplayName("POST /api/room-reservations - 시간 중복 시 400 반환")
    void createReservation_conflict_returns400() throws Exception {
        MeetingRoomDto.ReservationCreateRequest req = new MeetingRoomDto.ReservationCreateRequest(
                room.getRoomId(), "2026-04-02", "14:00", "15:00", "첫 번째 예약", 3, null);

        // 첫 번째 예약
        mockMvc.perform(post("/api/room-reservations")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        // 동일 시간대 두 번째 예약
        MeetingRoomDto.ReservationCreateRequest conflict = new MeetingRoomDto.ReservationCreateRequest(
                room.getRoomId(), "2026-04-02", "14:00", "15:00", "중복 예약", 2, null);

        mockMvc.perform(post("/api/room-reservations")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(conflict)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("해당 시간대에 이미 예약이 있습니다."));
    }

    @Test
    @DisplayName("GET /api/room-reservations/my - 내 예약 목록 조회")
    void getMyReservations_success() throws Exception {
        mockMvc.perform(get("/api/room-reservations/my")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("DELETE /api/room-reservations/{id} - 예약 취소 성공")
    void cancelReservation_success() throws Exception {
        // 예약 생성
        MeetingRoomDto.ReservationCreateRequest req = new MeetingRoomDto.ReservationCreateRequest(
                room.getRoomId(), "2026-04-03", "10:00", "11:00", "취소할 예약", 2, null);

        MvcResult createResult = mockMvc.perform(post("/api/room-reservations")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk()).andReturn();

        Long reservationId = objectMapper.readTree(
                createResult.getResponse().getContentAsString())
                .path("data").path("reservationId").asLong();

        // 취소
        mockMvc.perform(delete("/api/room-reservations/" + reservationId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
