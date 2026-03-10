package com.selim.resourcemanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.selim.resourcemanagement.dto.AuthDto;
import com.selim.resourcemanagement.entity.Department;
import com.selim.resourcemanagement.entity.User;
import com.selim.resourcemanagement.repository.DepartmentRepository;
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
@DisplayName("보안(접근제어) 통합 테스트")
class SecurityIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private String userToken;
    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        userRepository.deleteAll();
        Department dept = departmentRepository.save(
                Department.builder().departmentName("개발팀").departmentCode("DEV").build());

        userRepository.save(User.builder()
                .email("user@test.com").passwordHash(passwordEncoder.encode("user1234!"))
                .name("일반유저").department(dept).role("USER").isActive(true).build());

        userRepository.save(User.builder()
                .email("admin@test.com").passwordHash(passwordEncoder.encode("admin1234!"))
                .name("관리자").department(dept).role("SYSTEM_ADMIN").isActive(true).build());

        userToken = login("user@test.com", "user1234!");
        adminToken = login("admin@test.com", "admin1234!");
    }

    private String login(String email, String password) throws Exception {
        String body = objectMapper.writeValueAsString(new AuthDto.LoginRequest(email, password));
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Test
    @DisplayName("인증 없이 보호된 API 접근 시 401 반환")
    void unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("일반 사용자가 /api/users 접근 시 403 반환")
    void normalUser_accessAdminApi_returns403() throws Exception {
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("접근 권한이 없습니다."));
    }

    @Test
    @DisplayName("관리자는 /api/users 접근 가능")
    void admin_accessAdminApi_returns200() throws Exception {
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("일반 사용자가 자산 생성 시 403 반환")
    void normalUser_createAsset_returns403() throws Exception {
        String body = objectMapper.writeValueAsString(
                java.util.Map.of("assetName", "테스트 자산", "category", "LAPTOP"));

        mockMvc.perform(post("/api/assets")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("일반 사용자는 자신의 정보 조회 가능")
    void normalUser_getOwnProfile_returns200() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("user@test.com"));
    }

    @Test
    @DisplayName("인증 없이 /api/auth/** 접근 가능")
    void authEndpoints_noAuthRequired() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("유효하지 않은 JWT 토큰으로 접근 시 401 반환")
    void invalidToken_returns401() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer invalid.token.here"))
                .andExpect(status().isUnauthorized());
    }
}
