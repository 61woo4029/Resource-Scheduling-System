package com.selim.resourcemanagement.service;

import com.selim.resourcemanagement.dto.VehicleDto;
import com.selim.resourcemanagement.entity.Vehicle;
import com.selim.resourcemanagement.entity.VehicleReservation;
import com.selim.resourcemanagement.entity.User;
import com.selim.resourcemanagement.repository.VehicleRepository;
import com.selim.resourcemanagement.repository.VehicleReservationRepository;
import com.selim.resourcemanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final VehicleReservationRepository vehicleReservationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<VehicleDto.Response> getVehicles() {
        return vehicleRepository.findByIsActiveTrueOrderByVehicleType()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public VehicleDto.Response createVehicle(VehicleDto.CreateRequest request) {
        Vehicle vehicle = Vehicle.builder()
                .vehicleType(request.getVehicleType())
                .vehicleCategory(request.getVehicleCategory() != null ? request.getVehicleCategory() : "")
                .vehicleNumber(request.getVehicleNumber())
                .capacity(request.getCapacity() != null ? request.getCapacity() : 0)
                .fuelType(request.getFuelType())
                .notes(request.getNotes())
                .status(request.getStatus() != null ? request.getStatus() : "AVAILABLE")
                .build();
        return toDto(vehicleRepository.save(vehicle));
    }

    @Transactional
    public VehicleDto.Response updateVehicle(Long id, VehicleDto.CreateRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("차량을 찾을 수 없습니다."));
        if (request.getVehicleType() != null) vehicle.setVehicleType(request.getVehicleType());
        if (request.getVehicleCategory() != null) vehicle.setVehicleCategory(request.getVehicleCategory());
        if (request.getVehicleNumber() != null) vehicle.setVehicleNumber(request.getVehicleNumber());
        if (request.getCapacity() != null) vehicle.setCapacity(request.getCapacity());
        if (request.getFuelType() != null) vehicle.setFuelType(request.getFuelType());
        if (request.getNotes() != null) vehicle.setNotes(request.getNotes());
        if (request.getStatus() != null) vehicle.setStatus(request.getStatus());
        return toDto(vehicleRepository.save(vehicle));
    }

    @Transactional
    public void deleteVehicle(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("차량을 찾을 수 없습니다."));
        vehicle.setIsActive(false);
        vehicleRepository.save(vehicle);
    }

    @Transactional(readOnly = true)
    public List<VehicleDto.ReservationResponse> getReservations(String viewType, Long vehicleId, String date, String startDate, String endDate) {
        if ("weekly".equals(viewType) && startDate != null && endDate != null) {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            if (vehicleId != null) {
                Vehicle vehicle = vehicleRepository.findById(vehicleId)
                        .orElseThrow(() -> new IllegalArgumentException("차량을 찾을 수 없습니다."));
                return vehicleReservationRepository
                        .findByVehicleAndReservationDateBetweenAndStatusOrderByReservationDateAscStartTimeAsc(vehicle, start, end, "CONFIRMED")
                        .stream().map(this::toReservationDto).collect(Collectors.toList());
            } else {
                return vehicleReservationRepository.findByReservationDateBetweenAndStatus(start, end, "CONFIRMED")
                        .stream().map(this::toReservationDto).collect(Collectors.toList());
            }
        } else {
            LocalDate localDate = date != null ? LocalDate.parse(date) : LocalDate.now();
            return vehicleReservationRepository.findByReservationDateAndStatusOrderByStartTime(localDate, "CONFIRMED")
                    .stream().map(this::toReservationDto).collect(Collectors.toList());
        }
    }

    @Transactional(readOnly = true)
    public List<VehicleDto.ReservationResponse> getMyReservations(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return vehicleReservationRepository.findByUserOrderByReservationDateDescStartTimeDesc(user)
                .stream().map(this::toReservationDto).collect(Collectors.toList());
    }

    @Transactional
    public VehicleDto.ReservationResponse createReservation(VehicleDto.ReservationCreateRequest request, String email) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new IllegalArgumentException("차량을 찾을 수 없습니다."));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        LocalDate date = LocalDate.parse(request.getReservationDate());

        List<VehicleReservation> conflicts = vehicleReservationRepository.findConflicting(
                vehicle, date, request.getStartTime(), request.getEndTime());
        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException("해당 시간대에 이미 예약이 있습니다.");
        }

        VehicleReservation reservation = VehicleReservation.builder()
                .vehicle(vehicle).user(user)
                .driverName(request.getDriverName())
                .reservationDate(date)
                .startTime(request.getStartTime()).endTime(request.getEndTime())
                .purpose(request.getPurpose())
                .destination(request.getDestination())
                .notes(request.getNotes())
                .status("CONFIRMED")
                .build();

        return toReservationDto(vehicleReservationRepository.save(reservation));
    }

    @Transactional
    public VehicleDto.ReservationResponse updateReservation(Long id, VehicleDto.ReservationCreateRequest request, String email) {
        VehicleReservation reservation = vehicleReservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("예약을 찾을 수 없습니다."));

        if (!reservation.getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException("본인의 예약만 수정할 수 있습니다.");
        }

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new IllegalArgumentException("차량을 찾을 수 없습니다."));
        LocalDate date = LocalDate.parse(request.getReservationDate());

        List<VehicleReservation> conflicts = vehicleReservationRepository.findConflictingExclude(
                vehicle, date, request.getStartTime(), request.getEndTime(), id);
        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException("해당 시간대에 이미 예약이 있습니다.");
        }

        reservation.setVehicle(vehicle);
        reservation.setReservationDate(date);
        reservation.setStartTime(request.getStartTime());
        reservation.setEndTime(request.getEndTime());
        reservation.setDriverName(request.getDriverName());
        reservation.setPurpose(request.getPurpose());
        reservation.setDestination(request.getDestination());
        reservation.setNotes(request.getNotes());

        return toReservationDto(vehicleReservationRepository.save(reservation));
    }

    @Transactional
    public void cancelReservation(Long id, String email) {
        VehicleReservation reservation = vehicleReservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("예약을 찾을 수 없습니다."));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        boolean isAdmin = "SYSTEM_ADMIN".equals(user.getRole());

        if (!isAdmin && !reservation.getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException("본인의 예약만 취소할 수 있습니다.");
        }

        reservation.setStatus("CANCELLED");
        vehicleReservationRepository.save(reservation);
    }

    private VehicleDto.Response toDto(Vehicle v) {
        return VehicleDto.Response.builder()
                .vehicleId(v.getVehicleId()).vehicleType(v.getVehicleType())
                .vehicleCategory(v.getVehicleCategory()).vehicleNumber(v.getVehicleNumber())
                .capacity(v.getCapacity()).fuelType(v.getFuelType()).notes(v.getNotes())
                .status(v.getStatus()).build();
    }

    private VehicleDto.ReservationResponse toReservationDto(VehicleReservation r) {
        return VehicleDto.ReservationResponse.builder()
                .reservationId(r.getReservationId())
                .vehicleId(r.getVehicle().getVehicleId())
                .userId(r.getUser().getUserId())
                .vehicle(VehicleDto.VehicleInfo.builder()
                        .vehicleId(r.getVehicle().getVehicleId())
                        .vehicleType(r.getVehicle().getVehicleType())
                        .vehicleNumber(r.getVehicle().getVehicleNumber())
                        .build())
                .user(VehicleDto.UserInfo.builder()
                        .userId(r.getUser().getUserId())
                        .name(r.getUser().getName())
                        .build())
                .reservationDate(r.getReservationDate().toString())
                .startTime(r.getStartTime()).endTime(r.getEndTime())
                .driverName(r.getDriverName()).purpose(r.getPurpose())
                .destination(r.getDestination()).notes(r.getNotes()).status(r.getStatus())
                .build();
    }
}
