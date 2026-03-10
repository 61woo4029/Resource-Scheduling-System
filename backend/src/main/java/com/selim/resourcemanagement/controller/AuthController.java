package com.selim.resourcemanagement.controller;

import com.selim.resourcemanagement.dto.ApiResponse;
import com.selim.resourcemanagement.dto.AuthDto;
import com.selim.resourcemanagement.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import javax.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<?> register(@Valid @RequestBody AuthDto.RegisterRequest request) {
        return ApiResponse.success("회원가입이 완료되었습니다.", authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthDto.LoginResponse> login(@Valid @RequestBody AuthDto.LoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }

    @PostMapping("/logout")
    public ApiResponse<?> logout() {
        return ApiResponse.success("로그아웃되었습니다.");
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthDto.LoginResponse> refresh(@RequestBody AuthDto.RefreshTokenRequest request) {
        return ApiResponse.success(authService.refreshToken(request.getRefresh_token()));
    }

    @PutMapping("/password/change")
    public ApiResponse<?> changePassword(@AuthenticationPrincipal UserDetails userDetails,
                                          @RequestBody AuthDto.PasswordChangeRequest request) {
        authService.changePassword(userDetails.getUsername(), request);
        return ApiResponse.success("비밀번호가 변경되었습니다.");
    }
}
