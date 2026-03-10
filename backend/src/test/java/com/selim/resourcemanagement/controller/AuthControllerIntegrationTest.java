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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@DisplayName("AuthController 통합 테스트")
class AuthControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private Department dept;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        dept = departmentRepository.save(
                Department.builder().departmentName("개발팀").departmentCode("DEV").build());
    }

    @Test
    @DisplayName("POST /api/auth/login - 로그인 성공 시 토큰 반환")
    void login_success_returnsTokens() throws Exception {
        userRepository.save(User.builder()
                .email("test@test.com")
                .passwordHash(passwordEncoder.encode("test1234!"))
                .name("테스터").department(dept).role("USER").isActive(true).build());

        String body = objectMapper.writeValueAsString(
                new AuthDto.LoginRequest("test@test.com", "test1234!"));

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value("test@test.com"))
                .andReturn();

        String accessToken = objectMapper.readTree(
                result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
        assertThat(accessToken).isNotBlank();
    }

    @Test
    @DisplayName("POST /api/auth/login - 잘못된 비밀번호 시 400 반환")
    void login_wrongPassword_returns400() throws Exception {
        userRepository.save(User.builder()
                .email("test@test.com")
                .passwordHash(passwordEncoder.encode("test1234!"))
                .name("테스터").department(dept).role("USER").isActive(true).build());

        String body = objectMapper.writeValueAsString(
                new AuthDto.LoginRequest("test@test.com", "wrongpassword"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("POST /api/auth/login - 빈 값 요청 시 400 반환 (@Valid)")
    void login_emptyFields_returns400() throws Exception {
        String body = objectMapper.writeValueAsString(
                new AuthDto.LoginRequest("", ""));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("POST /api/auth/register - 회원가입 성공")
    void register_success() throws Exception {
        AuthDto.RegisterRequest req = new AuthDto.RegisterRequest(
                "newuser@test.com", "password123!", "신규유저", dept.getDepartmentId(), "사원", "010-1234-5678");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("newuser@test.com"));
    }

    @Test
    @DisplayName("POST /api/auth/register - 중복 이메일 시 400 반환")
    void register_duplicateEmail_returns400() throws Exception {
        userRepository.save(User.builder()
                .email("dup@test.com")
                .passwordHash(passwordEncoder.encode("pw"))
                .name("기존유저").department(dept).role("USER").isActive(true).build());

        AuthDto.RegisterRequest req = new AuthDto.RegisterRequest(
                "dup@test.com", "password123!", "중복유저", dept.getDepartmentId(), "사원", null);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("POST /api/auth/logout - 항상 성공")
    void logout_success() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
