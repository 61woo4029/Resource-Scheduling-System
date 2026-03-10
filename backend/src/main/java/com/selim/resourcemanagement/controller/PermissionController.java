package com.selim.resourcemanagement.controller;

import com.selim.resourcemanagement.dto.ApiResponse;
import com.selim.resourcemanagement.dto.PermissionRequestDto;
import com.selim.resourcemanagement.service.PermissionRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/permission-requests")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionRequestService permissionRequestService;

    @PostMapping
    public ApiResponse<?> createRequest(@AuthenticationPrincipal UserDetails userDetails,
                                         @RequestBody PermissionRequestDto.CreateRequest request) {
        return ApiResponse.success("권한 신청이 완료되었습니다.",
                permissionRequestService.createRequest(userDetails.getUsername(), request));
    }

    @GetMapping
    public ApiResponse<?> getRequests(
            @RequestParam(defaultValue = "PENDING") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(permissionRequestService.getRequests(status, page, size));
    }

    @GetMapping("/my")
    public ApiResponse<?> getMyRequests(@AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.success(permissionRequestService.getMyRequests(userDetails.getUsername()));
    }

    @GetMapping("/pending/count")
    public ApiResponse<?> getPendingCount() {
        return ApiResponse.success(PermissionRequestDto.CountResponse.builder()
                .count(permissionRequestService.getPendingCount()).build());
    }

    @PutMapping("/{id}/approve")
    public ApiResponse<?> approveRequest(@PathVariable Long id,
                                          @AuthenticationPrincipal UserDetails userDetails,
                                          @RequestBody(required = false) PermissionRequestDto.ActionRequest request) {
        String comment = request != null ? request.getAdminComment() : null;
        permissionRequestService.approveRequest(id, userDetails.getUsername(), comment);
        return ApiResponse.success("권한 신청이 승인되었습니다.");
    }

    @PutMapping("/{id}/reject")
    public ApiResponse<?> rejectRequest(@PathVariable Long id,
                                         @RequestBody(required = false) PermissionRequestDto.ActionRequest request) {
        String comment = request != null ? request.getAdminComment() : null;
        permissionRequestService.rejectRequest(id, comment);
        return ApiResponse.success("권한 신청이 반려되었습니다.");
    }
}
