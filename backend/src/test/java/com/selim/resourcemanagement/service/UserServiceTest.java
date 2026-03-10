package com.selim.resourcemanagement.service;

import com.selim.resourcemanagement.dto.UserDto;
import com.selim.resourcemanagement.entity.Department;
import com.selim.resourcemanagement.entity.User;
import com.selim.resourcemanagement.repository.DepartmentRepository;
import com.selim.resourcemanagement.repository.UserRepository;
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
@DisplayName("UserService 단위 테스트")
class UserServiceTest {

    @Mock UserRepository userRepository;
    @Mock DepartmentRepository departmentRepository;
    @Mock PasswordEncoder passwordEncoder;

    @InjectMocks UserService userService;

    private Department dept;
    private User user;

    @BeforeEach
    void setUp() {
        dept = Department.builder().departmentId(1L).departmentName("개발팀").build();
        user = User.builder()
                .userId(1L).email("user@test.com").passwordHash("encoded_pw")
                .name("홍길동").department(dept).position("사원").phone("010-1111-2222")
                .role("USER").isActive(true).build();
    }

    @Test
    @DisplayName("이메일로 현재 사용자 조회 성공")
    void getCurrentUser_success() {
        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));

        UserDto.Response res = userService.getCurrentUser("user@test.com");

        assertThat(res.getEmail()).isEqualTo("user@test.com");
        assertThat(res.getName()).isEqualTo("홍길동");
        assertThat(res.getDepartment()).isEqualTo("개발팀");
    }

    @Test
    @DisplayName("존재하지 않는 이메일 조회 시 예외")
    void getCurrentUser_notFound_throws() {
        given(userRepository.findByEmail("none@test.com")).willReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getCurrentUser("none@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("사용자를 찾을 수 없습니다");
    }

    @Test
    @DisplayName("ID로 사용자 조회 성공")
    void getUserById_success() {
        given(userRepository.findById(1L)).willReturn(Optional.of(user));

        UserDto.Response res = userService.getUserById(1L);

        assertThat(res.getUserId()).isEqualTo(1L);
        assertThat(res.getRole()).isEqualTo("USER");
    }

    @Test
    @DisplayName("사용자 역할 변경 성공")
    void updateUserRole_success() {
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(userRepository.save(any())).willReturn(user);

        userService.updateUserRole(1L, "ASSET_ADMIN");

        assertThat(user.getRole()).isEqualTo("ASSET_ADMIN");
        then(userRepository).should().save(user);
    }

    @Test
    @DisplayName("비밀번호 초기화 성공")
    void resetPassword_success() {
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(passwordEncoder.encode("newPass123!")).willReturn("new_encoded");
        given(userRepository.save(any())).willReturn(user);

        userService.resetPassword(1L, "newPass123!");

        assertThat(user.getPasswordHash()).isEqualTo("new_encoded");
    }

    @Test
    @DisplayName("프로필 수정 - 이름, 직급, 전화번호 변경")
    void updateProfile_success() {
        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(userRepository.save(any())).willReturn(user);

        UserDto.UpdateRequest req = new UserDto.UpdateRequest();
        req.setName("김철수");
        req.setPosition("대리");
        req.setPhone("010-9999-8888");

        UserDto.Response res = userService.updateProfile("user@test.com", req);

        assertThat(user.getName()).isEqualTo("김철수");
        assertThat(user.getPosition()).isEqualTo("대리");
        assertThat(user.getPhone()).isEqualTo("010-9999-8888");
    }

    @Test
    @DisplayName("비밀번호 변경 성공")
    void changePassword_success() {
        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("oldPw!", "encoded_pw")).willReturn(true);
        given(passwordEncoder.encode("newPw123!")).willReturn("new_encoded");
        given(userRepository.save(any())).willReturn(user);

        UserDto.PasswordChangeRequest req = new UserDto.PasswordChangeRequest("oldPw!", "newPw123!");

        assertThatCode(() -> userService.changePassword("user@test.com", req))
                .doesNotThrowAnyException();

        assertThat(user.getPasswordHash()).isEqualTo("new_encoded");
    }

    @Test
    @DisplayName("현재 비밀번호 불일치 시 변경 실패")
    void changePassword_wrongCurrent_throws() {
        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("wrongPw", "encoded_pw")).willReturn(false);

        UserDto.PasswordChangeRequest req = new UserDto.PasswordChangeRequest("wrongPw", "newPw123!");

        assertThatThrownBy(() -> userService.changePassword("user@test.com", req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("현재 비밀번호가 올바르지 않습니다");
    }
}
