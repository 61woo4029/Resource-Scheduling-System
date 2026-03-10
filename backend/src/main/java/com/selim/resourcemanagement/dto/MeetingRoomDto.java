package com.selim.resourcemanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

public class MeetingRoomDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long roomId;
        private String roomName;
        private String location;
        private Integer capacity;
        private String facilities;
        private String availableHours;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String roomName;
        private String location;
        private Integer capacity;
        private String facilities;
        private String availableHours;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReservationResponse {
        private Long reservationId;
        private Long roomId;
        private Long userId;
        private RoomInfo room;
        private UserInfo user;
        private String reservationDate;
        private String startTime;
        private String endTime;
        private String meetingTitle;
        private Integer attendeeCount;
        private String notes;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomInfo {
        private Long roomId;
        private String roomName;
        private String location;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long userId;
        private String name;
        private String phone;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReservationCreateRequest {
        private Long roomId;
        private String reservationDate;
        private String startTime;
        private String endTime;
        private String meetingTitle;
        private Integer attendeeCount;
        private String notes;
    }
}
