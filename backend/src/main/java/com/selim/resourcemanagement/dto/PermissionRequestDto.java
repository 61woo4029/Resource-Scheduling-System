package com.selim.resourcemanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

public class PermissionRequestDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long requestId;
        private Long userId;
        private String userName;
        private String departmentName;
        private String currentRole;
        private String requestedRole;
        private String reason;
        private String status;
        private String adminComment;
        private LocalDateTime createdAt;
        private LocalDateTime processedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String requestedRole;
        private String reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActionRequest {
        private String adminComment;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CountResponse {
        private long count;
    }
}
