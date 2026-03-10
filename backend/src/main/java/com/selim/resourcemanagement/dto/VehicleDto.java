package com.selim.resourcemanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class VehicleDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long vehicleId;
        private String vehicleType;
        private String vehicleCategory;
        private String vehicleNumber;
        private Integer capacity;
        private String fuelType;
        private String notes;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String vehicleType;
        private String vehicleCategory;
        private String vehicleNumber;
        private Integer capacity;
        private String fuelType;
        private String notes;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReservationResponse {
        private Long reservationId;
        private Long vehicleId;
        private Long userId;
        private VehicleInfo vehicle;
        private UserInfo user;
        private String reservationDate;
        private String startTime;
        private String endTime;
        private String driverName;
        private String purpose;
        private String destination;
        private String notes;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehicleInfo {
        private Long vehicleId;
        private String vehicleType;
        private String vehicleNumber;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long userId;
        private String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReservationCreateRequest {
        private Long vehicleId;
        private String reservationDate;
        private String startTime;
        private String endTime;
        private String driverName;
        private String purpose;
        private String destination;
        private String notes;
    }
}
