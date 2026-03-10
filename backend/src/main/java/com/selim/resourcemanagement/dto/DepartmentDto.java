package com.selim.resourcemanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class DepartmentDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long departmentId;
        private String departmentName;
        private String departmentCode;
        private ParentInfo parentDepartment;
        private Long parentDepartmentId;
        private Boolean isActive;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParentInfo {
        private Long departmentId;
        private String departmentName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String departmentName;
        private String departmentCode;
        private Long parentDepartmentId;
        private Boolean isActive;
    }
}
