package com.selim.resourcemanagement.service;

import com.selim.resourcemanagement.dto.PageResponse;
import com.selim.resourcemanagement.dto.UserDto;
import com.selim.resourcemanagement.entity.Department;
import com.selim.resourcemanagement.entity.User;
import com.selim.resourcemanagement.repository.DepartmentRepository;
import com.selim.resourcemanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PageResponse<UserDto.Response> getUsers(String search, Long departmentId, String role, int page, int size) {
        String searchParam = StringUtils.hasText(search) ? search : null;
        String roleParam = StringUtils.hasText(role) ? role : null;

        Page<User> users = userRepository.findUsersWithFilters(
                searchParam, departmentId, roleParam, PageRequest.of(page, size));

        Page<UserDto.Response> dtoPage = users.map(this::toDto);
        return PageResponse.of(dtoPage);
    }

    @Transactional(readOnly = true)
    public UserDto.Response getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return toDto(user);
    }

    @Transactional(readOnly = true)
    public UserDto.Response getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return toDto(user);
    }

    @Transactional
    public UserDto.Response updateUser(Long id, UserDto.UpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (StringUtils.hasText(request.getName())) user.setName(request.getName());
        if (StringUtils.hasText(request.getPosition())) user.setPosition(request.getPosition());
        if (StringUtils.hasText(request.getPhone())) user.setPhone(request.getPhone());
        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 부서입니다."));
            user.setDepartment(dept);
        }

        return toDto(userRepository.save(user));
    }

    @Transactional
    public void updateUserRole(Long id, String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        user.setRole(role);
        userRepository.save(user);
    }

    @Transactional
    public void resetPassword(Long id, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public UserDto.Response updateProfile(String email, UserDto.UpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        if (request.getName() != null && !request.getName().isBlank()) user.setName(request.getName());
        if (request.getPosition() != null && !request.getPosition().isBlank()) user.setPosition(request.getPosition());
        if (request.getPhone() != null && !request.getPhone().isBlank()) user.setPhone(request.getPhone());
        return toDto(userRepository.save(user));
    }

    @Transactional
    public void changePassword(String email, UserDto.PasswordChangeRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("현재 비밀번호가 올바르지 않습니다.");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private UserDto.Response toDto(User user) {
        return UserDto.Response.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .name(user.getName())
                .department(user.getDepartment() != null ? user.getDepartment().getDepartmentName() : null)
                .departmentId(user.getDepartment() != null ? user.getDepartment().getDepartmentId() : null)
                .position(user.getPosition())
                .role(user.getRole())
                .phone(user.getPhone())
                .isActive(user.getIsActive())
                .build();
    }
}
