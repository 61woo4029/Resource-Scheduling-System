package com.selim.resourcemanagement.controller;

import com.selim.resourcemanagement.dto.ApiResponse;
import com.selim.resourcemanagement.dto.MenuDto;
import com.selim.resourcemanagement.service.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/menus")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @GetMapping
    public ApiResponse<?> getMenus() {
        return ApiResponse.success(menuService.getMenus());
    }

    @GetMapping("/tree")
    public ApiResponse<?> getMenuTree() {
        return ApiResponse.success(menuService.getMenuTree());
    }

    @GetMapping("/my")
    public ApiResponse<?> getMyMenus(@AuthenticationPrincipal UserDetails userDetails) {
        // role 파싱: ROLE_SYSTEM_ADMIN -> SYSTEM_ADMIN
        String authority = userDetails.getAuthorities().iterator().next().getAuthority();
        String role = authority.startsWith("ROLE_") ? authority.substring(5) : authority;
        return ApiResponse.success(menuService.getMyMenus(role));
    }

    @PostMapping
    public ApiResponse<?> createMenu(@RequestBody MenuDto.CreateRequest request) {
        return ApiResponse.success("메뉴가 등록되었습니다.", menuService.createMenu(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<?> updateMenu(@PathVariable Long id, @RequestBody MenuDto.CreateRequest request) {
        return ApiResponse.success("메뉴가 수정되었습니다.", menuService.updateMenu(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> deleteMenu(@PathVariable Long id) {
        menuService.deleteMenu(id);
        return ApiResponse.success("메뉴가 삭제되었습니다.");
    }
}
