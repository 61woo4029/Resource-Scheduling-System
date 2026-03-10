package com.selim.resourcemanagement.service;

import com.selim.resourcemanagement.dto.PageResponse;
import com.selim.resourcemanagement.dto.PermissionRequestDto;
import com.selim.resourcemanagement.entity.PermissionRequest;
import com.selim.resourcemanagement.entity.User;
import com.selim.resourcemanagement.repository.PermissionRequestRepository;
import com.selim.resourcemanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionRequestService {

    private final PermissionRequestRepository permissionRequestRepository;
    private final UserRepository userRepository;

    @Transactional
    public PermissionRequestDto.Response createRequest(String email, PermissionRequestDto.CreateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        PermissionRequest pr = PermissionRequest.builder()
                .user(user)
                .requestedRole(request.getRequestedRole())
                .requestReason(request.getReason())
                .status("PENDING")
                .build();

        return toDto(permissionRequestRepository.save(pr));
    }

    @Transactional(readOnly = true)
    public PageResponse<PermissionRequestDto.Response> getRequests(String status, int page, int size) {
        Page<PermissionRequest> prs = permissionRequestRepository
                .findByStatusOrderByRequestedAtDesc(status, PageRequest.of(page, size));
        return PageResponse.of(prs.map(this::toDto));
    }

    @Transactional(readOnly = true)
    public List<PermissionRequestDto.Response> getMyRequests(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return permissionRequestRepository.findByUserOrderByRequestedAtDesc(user)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getPendingCount() {
        return permissionRequestRepository.countByStatus("PENDING");
    }

    @Transactional
    public void approveRequest(Long id, String approverEmail, String adminComment) {
        PermissionRequest pr = permissionRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("신청을 찾을 수 없습니다."));

        User approver = userRepository.findByEmail(approverEmail)
                .orElseThrow(() -> new IllegalArgumentException("승인자를 찾을 수 없습니다."));

        pr.setStatus("APPROVED");
        pr.setApprovedBy(approver);
        pr.setAdminComment(adminComment);
        pr.setProcessedAt(LocalDateTime.now());
        permissionRequestRepository.save(pr);

        // 사용자 권한 변경
        User requestUser = pr.getUser();
        requestUser.setRole(pr.getRequestedRole());
        userRepository.save(requestUser);
    }

    @Transactional
    public void rejectRequest(Long id, String adminComment) {
        PermissionRequest pr = permissionRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("신청을 찾을 수 없습니다."));

        pr.setStatus("REJECTED");
        pr.setAdminComment(adminComment);
        pr.setProcessedAt(LocalDateTime.now());
        permissionRequestRepository.save(pr);
    }

    private PermissionRequestDto.Response toDto(PermissionRequest pr) {
        return PermissionRequestDto.Response.builder()
                .requestId(pr.getRequestId())
                .userId(pr.getUser().getUserId())
                .userName(pr.getUser().getName())
                .departmentName(pr.getUser().getDepartment() != null ? pr.getUser().getDepartment().getDepartmentName() : null)
                .currentRole(pr.getUser().getRole())
                .requestedRole(pr.getRequestedRole())
                .reason(pr.getRequestReason())
                .status(pr.getStatus())
                .adminComment(pr.getAdminComment())
                .createdAt(pr.getRequestedAt())
                .processedAt(pr.getProcessedAt())
                .build();
    }
}
