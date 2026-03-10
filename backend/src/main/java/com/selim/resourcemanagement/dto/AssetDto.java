package com.selim.resourcemanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

public class AssetDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long assetId;
        private String assetNumber;
        private String category;
        private String userName;
        private String status;
        private String purchaseMonth;
        private String manufacturer;
        private String modelName;
        private String serialNumber;
        private String os;
        private String cpu;
        private String ram;
        private String ssd;
        private String hdd;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String assetNumber;
        private String category;
        private String userName;
        private String status;
        private String purchaseMonth;
        private String manufacturer;
        private String modelName;
        private String serialNumber;
        private String os;
        private String cpu;
        private String ram;
        private String ssd;
        private String hdd;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchDeleteRequest {
        private List<Long> ids;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UploadResponse {
        private int total;
        private int success;
        private int failed;
        private List<ErrorInfo> errors;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ErrorInfo {
        private int row;
        private String reason;
    }
}
