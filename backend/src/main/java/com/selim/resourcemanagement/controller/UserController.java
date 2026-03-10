package com.selim.resourcemanagement.controller;

import com.selim.resourcemanagement.dto.ApiResponse;
import com.selim.resourcemanagement.dto.UserDto;
import com.selim.resourcemanagement.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @GetMapping
    public ApiResponse<?> getUsers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(userService.getUsers(name, departmentId, role, page, size));
    }

    @GetMapping("/me")
    public ApiResponse<?> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.success(userService.getCurrentUser(userDetails.getUsername()));
    }

    @PutMapping("/me")
    public ApiResponse<?> updateProfile(@AuthenticationPrincipal UserDetails userDetails,
                                         @RequestBody UserDto.UpdateRequest request) {
        return ApiResponse.success(userService.updateProfile(userDetails.getUsername(), request));
    }

    @PutMapping("/me/password")
    public ApiResponse<?> changePassword(@AuthenticationPrincipal UserDetails userDetails,
                                          @RequestBody UserDto.PasswordChangeRequest request) {
        userService.changePassword(userDetails.getUsername(), request);
        return ApiResponse.success("비밀번호가 변경되었습니다.");
    }

    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @GetMapping("/{id}")
    public ApiResponse<?> getUser(@PathVariable Long id) {
        return ApiResponse.success(userService.getUserById(id));
    }

    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @PutMapping("/{id}")
    public ApiResponse<?> updateUser(@PathVariable Long id,
                                      @RequestBody UserDto.UpdateRequest request) {
        return ApiResponse.success("사용자 정보가 수정되었습니다.", userService.updateUser(id, request));
    }

    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @PutMapping("/{id}/role")
    public ApiResponse<?> updateRole(@PathVariable Long id,
                                      @RequestBody UserDto.RoleUpdateRequest request) {
        userService.updateUserRole(id, request.getRole());
        return ApiResponse.success("권한이 변경되었습니다.");
    }

    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @PostMapping("/{id}/password/reset")
    public ApiResponse<?> resetPassword(@PathVariable Long id,
                                         @RequestBody UserDto.PasswordResetRequest request) {
        userService.resetPassword(id, request.getNewPassword());
        return ApiResponse.success("비밀번호가 초기화되었습니다.");
    }
}
