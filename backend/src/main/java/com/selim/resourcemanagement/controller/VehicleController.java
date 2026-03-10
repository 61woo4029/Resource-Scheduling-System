package com.selim.resourcemanagement.controller;

import com.selim.resourcemanagement.dto.ApiResponse;
import com.selim.resourcemanagement.dto.VehicleDto;
import com.selim.resourcemanagement.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping("/api/vehicles")
    public ApiResponse<?> getVehicles() {
        return ApiResponse.success(vehicleService.getVehicles());
    }

    @PostMapping("/api/vehicles")
    public ApiResponse<?> createVehicle(@RequestBody VehicleDto.CreateRequest request) {
        return ApiResponse.success("차량이 등록되었습니다.", vehicleService.createVehicle(request));
    }

    @PutMapping("/api/vehicles/{id}")
    public ApiResponse<?> updateVehicle(@PathVariable Long id, @RequestBody VehicleDto.CreateRequest request) {
        return ApiResponse.success("차량이 수정되었습니다.", vehicleService.updateVehicle(id, request));
    }

    @DeleteMapping("/api/vehicles/{id}")
    public ApiResponse<?> deleteVehicle(@PathVariable Long id) {
        vehicleService.deleteVehicle(id);
        return ApiResponse.success("차량이 삭제되었습니다.");
    }

    @GetMapping("/api/vehicle-reservations")
    public ApiResponse<?> getReservations(
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        String viewType = (startDate != null) ? "weekly" : "daily";
        return ApiResponse.success(vehicleService.getReservations(viewType, vehicleId, date, startDate, endDate));
    }

    @GetMapping("/api/vehicle-reservations/my")
    public ApiResponse<?> getMyReservations(@AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.success(vehicleService.getMyReservations(userDetails.getUsername()));
    }

    @PostMapping("/api/vehicle-reservations")
    public ApiResponse<?> createReservation(@RequestBody VehicleDto.ReservationCreateRequest request,
                                             @AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.success("차량 예약이 완료되었습니다.",
                vehicleService.createReservation(request, userDetails.getUsername()));
    }

    @PutMapping("/api/vehicle-reservations/{id}")
    public ApiResponse<?> updateReservation(@PathVariable Long id,
                                             @RequestBody VehicleDto.ReservationCreateRequest request,
                                             @AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.success("예약이 수정되었습니다.",
                vehicleService.updateReservation(id, request, userDetails.getUsername()));
    }

    @DeleteMapping("/api/vehicle-reservations/{id}")
    public ApiResponse<?> cancelReservation(@PathVariable Long id,
                                             @AuthenticationPrincipal UserDetails userDetails) {
        vehicleService.cancelReservation(id, userDetails.getUsername());
        return ApiResponse.success("예약이 취소되었습니다.");
    }
}
