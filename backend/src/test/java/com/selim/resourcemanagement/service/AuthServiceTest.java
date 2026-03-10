package com.selim.resourcemanagement.service;

import com.selim.resourcemanagement.dto.AuthDto;
import com.selim.resourcemanagement.entity.Department;
import com.selim.resourcemanagement.entity.User;
import com.selim.resourcemanagement.repository.DepartmentRepository;
import com.selim.resourcemanagement.repository.UserRepository;
import com.selim.resourcemanagement.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService 단위 테스트")
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock DepartmentRepository departmentRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtTokenProvider jwtTokenProvider;

    @InjectMocks AuthService authService;

    private Department dept;
    private User user;

    @BeforeEach
    void setUp() {
        dept = Department.builder().departmentId(1L).departmentName("개발팀").build();
        user = User.builder()
                .userId(1L).email("user@test.com").passwordHash("encoded_pw")
                .name("홍길동").department(dept).role("USER").isActive(true).build();
    }

    // ---- register ----

    @Test
    @DisplayName("회원가입 성공")
    void register_success() {
        AuthDto.RegisterRequest req = new AuthDto.RegisterRequest(
                "new@test.com", "password123!", "신규유저", 1L, "사원", "010-1234-5678");

        given(userRepository.existsByEmail("new@test.com")).willReturn(false);
        given(departmentRepository.findById(1L)).willReturn(Optional.of(dept));
        given(passwordEncoder.encode("password123!")).willReturn("encoded");
        User saved = User.builder().userId(2L).email("new@test.com").name("신규유저")
                .department(dept).role("USER").isActive(true).build();
        given(userRepository.save(any(User.class))).willReturn(saved);

        Object result = authService.register(req);

        assertThat(result).isNotNull();
        then(userRepository).should().save(any(User.class));
    }

    @Test
    @DisplayName("중복 이메일 회원가입 실패")
    void register_duplicateEmail_throws() {
        AuthDto.RegisterRequest req = new AuthDto.RegisterRequest(
                "user@test.com", "password123!", "홍길동", 1L, "사원", null);

        given(userRepository.existsByEmail("user@test.com")).willReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이미 사용중인 이메일");
    }

    @Test
    @DisplayName("존재하지 않는 부서로 회원가입 실패")
    void register_deptNotFound_throws() {
        AuthDto.RegisterRequest req = new AuthDto.RegisterRequest(
                "new@test.com", "password123!", "홍길동", 99L, "사원", null);

        given(userRepository.existsByEmail("new@test.com")).willReturn(false);
        given(departmentRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("존재하지 않는 부서");
    }

    // ---- login ----

    @Test
    @DisplayName("로그인 성공 - 토큰 반환")
    void login_success() {
        AuthDto.LoginRequest req = new AuthDto.LoginRequest("user@test.com", "password123!");

        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("password123!", "encoded_pw")).willReturn(true);
        given(jwtTokenProvider.generateAccessToken(anyString(), anyString())).willReturn("access-token");
        given(jwtTokenProvider.generateRefreshToken(anyString())).willReturn("refresh-token");
        given(userRepository.save(any())).willReturn(user);

        AuthDto.LoginResponse res = authService.login(req);

        assertThat(res.getAccessToken()).isEqualTo("access-token");
        assertThat(res.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(res.getUser().getEmail()).isEqualTo("user@test.com");
    }

    @Test
    @DisplayName("존재하지 않는 이메일 로그인 실패")
    void login_emailNotFound_throws() {
        AuthDto.LoginRequest req = new AuthDto.LoginRequest("notfound@test.com", "pw");

        given(userRepository.findByEmail("notfound@test.com")).willReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이메일 또는 비밀번호");
    }

    @Test
    @DisplayName("비밀번호 불일치 로그인 실패")
    void login_wrongPassword_throws() {
        AuthDto.LoginRequest req = new AuthDto.LoginRequest("user@test.com", "wrong");

        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("wrong", "encoded_pw")).willReturn(false);

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이메일 또는 비밀번호");
    }

    @Test
    @DisplayName("비활성화 계정 로그인 실패")
    void login_inactiveUser_throws() {
        User inactiveUser = User.builder()
                .userId(2L).email("inactive@test.com").passwordHash("encoded_pw")
                .name("비활성").role("USER").isActive(false).build();
        AuthDto.LoginRequest req = new AuthDto.LoginRequest("inactive@test.com", "pw");

        given(userRepository.findByEmail("inactive@test.com")).willReturn(Optional.of(inactiveUser));
        given(passwordEncoder.matches(anyString(), anyString())).willReturn(true);

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("비활성화된 계정");
    }

    // ---- changePassword ----

    @Test
    @DisplayName("비밀번호 변경 성공")
    void changePassword_success() {
        AuthDto.PasswordChangeRequest req = new AuthDto.PasswordChangeRequest("oldPw!", "newPw123!");

        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("oldPw!", "encoded_pw")).willReturn(true);
        given(passwordEncoder.encode("newPw123!")).willReturn("new_encoded");
        given(userRepository.save(any())).willReturn(user);

        assertThatCode(() -> authService.changePassword("user@test.com", req))
                .doesNotThrowAnyException();

        assertThat(user.getPasswordHash()).isEqualTo("new_encoded");
    }

    @Test
    @DisplayName("현재 비밀번호 불일치 시 변경 실패")
    void changePassword_wrongCurrent_throws() {
        AuthDto.PasswordChangeRequest req = new AuthDto.PasswordChangeRequest("wrongPw", "newPw123!");

        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("wrongPw", "encoded_pw")).willReturn(false);

        assertThatThrownBy(() -> authService.changePassword("user@test.com", req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("현재 비밀번호");
    }
}
