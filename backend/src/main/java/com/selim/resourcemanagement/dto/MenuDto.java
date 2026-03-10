package com.selim.resourcemanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

public class MenuDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long menuId;
        private String menuName;
        private String menuUrl;
        private Long parentMenuId;
        private Integer displayOrder;
        private String icon;
        private String requiredRoles;
        private Boolean isActive;
        private List<Response> children;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String menuName;
        private String menuUrl;
        private Long parentMenuId;
        private Integer displayOrder;
        private String icon;
        private String requiredRoles;
    }
}
