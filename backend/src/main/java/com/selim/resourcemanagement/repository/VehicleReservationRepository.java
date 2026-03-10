package com.selim.resourcemanagement.repository;

import com.selim.resourcemanagement.entity.Vehicle;
import com.selim.resourcemanagement.entity.VehicleReservation;
import com.selim.resourcemanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface VehicleReservationRepository extends JpaRepository<VehicleReservation, Long> {

    List<VehicleReservation> findByReservationDateAndStatusOrderByStartTime(LocalDate date, String status);

    List<VehicleReservation> findByVehicleAndReservationDateBetweenAndStatusOrderByReservationDateAscStartTimeAsc(
            Vehicle vehicle, LocalDate startDate, LocalDate endDate, String status);

    List<VehicleReservation> findByReservationDateBetweenAndStatus(LocalDate startDate, LocalDate endDate, String status);

    List<VehicleReservation> findByUserOrderByReservationDateDescStartTimeDesc(User user);

    @Query("SELECT r FROM VehicleReservation r WHERE r.vehicle = :vehicle " +
           "AND r.reservationDate = :date AND r.status = 'CONFIRMED' " +
           "AND r.startTime < :endTime AND r.endTime > :startTime")
    List<VehicleReservation> findConflicting(@Param("vehicle") Vehicle vehicle,
                                              @Param("date") LocalDate date,
                                              @Param("startTime") String startTime,
                                              @Param("endTime") String endTime);

    @Query("SELECT r FROM VehicleReservation r WHERE r.vehicle = :vehicle " +
           "AND r.reservationDate = :date AND r.status = 'CONFIRMED' " +
           "AND r.startTime < :endTime AND r.endTime > :startTime " +
           "AND r.reservationId != :excludeId")
    List<VehicleReservation> findConflictingExclude(@Param("vehicle") Vehicle vehicle,
                                                     @Param("date") LocalDate date,
                                                     @Param("startTime") String startTime,
                                                     @Param("endTime") String endTime,
                                                     @Param("excludeId") Long excludeId);

    List<VehicleReservation> findByUserAndReservationDateGreaterThanEqualAndStatusOrderByReservationDateAsc(
            User user, LocalDate date, String status);
}
