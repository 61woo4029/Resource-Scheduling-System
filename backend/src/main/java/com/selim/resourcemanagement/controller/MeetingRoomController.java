package com.selim.resourcemanagement.controller;

import com.selim.resourcemanagement.dto.ApiResponse;
import com.selim.resourcemanagement.dto.MeetingRoomDto;
import com.selim.resourcemanagement.service.MeetingRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class MeetingRoomController {

    private final MeetingRoomService meetingRoomService;

    @GetMapping("/api/meeting-rooms")
    public ApiResponse<?> getRooms() {
        return ApiResponse.success(meetingRoomService.getRooms());
    }

    @PostMapping("/api/meeting-rooms")
    public ApiResponse<?> createRoom(@RequestBody MeetingRoomDto.CreateRequest request) {
        return ApiResponse.success("회의실이 등록되었습니다.", meetingRoomService.createRoom(request));
    }

    @PutMapping("/api/meeting-rooms/{id}")
    public ApiResponse<?> updateRoom(@PathVariable Long id, @RequestBody MeetingRoomDto.CreateRequest request) {
        return ApiResponse.success("회의실이 수정되었습니다.", meetingRoomService.updateRoom(id, request));
    }

    @DeleteMapping("/api/meeting-rooms/{id}")
    public ApiResponse<?> deleteRoom(@PathVariable Long id) {
        meetingRoomService.deleteRoom(id);
        return ApiResponse.success("회의실이 삭제되었습니다.");
    }

    @GetMapping("/api/room-reservations")
    public ApiResponse<?> getReservations(
            @RequestParam(required = false) String viewType,
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ApiResponse.success(meetingRoomService.getReservations(viewType, roomId, date, startDate, endDate));
    }

    @GetMapping("/api/room-reservations/my")
    public ApiResponse<?> getMyReservations(@AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.success(meetingRoomService.getMyReservations(userDetails.getUsername()));
    }

    @PostMapping("/api/room-reservations")
    public ApiResponse<?> createReservation(@RequestBody MeetingRoomDto.ReservationCreateRequest request,
                                             @AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.success("회의실 예약이 완료되었습니다.",
                meetingRoomService.createReservation(request, userDetails.getUsername()));
    }

    @PutMapping("/api/room-reservations/{id}")
    public ApiResponse<?> updateReservation(@PathVariable Long id,
                                             @RequestBody MeetingRoomDto.ReservationCreateRequest request,
                                             @AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.success("예약이 수정되었습니다.",
                meetingRoomService.updateReservation(id, request, userDetails.getUsername()));
    }

    @DeleteMapping("/api/room-reservations/{id}")
    public ApiResponse<?> cancelReservation(@PathVariable Long id,
                                             @AuthenticationPrincipal UserDetails userDetails) {
        meetingRoomService.cancelReservation(id, userDetails.getUsername());
        return ApiResponse.success("예약이 취소되었습니다.");
    }
}
