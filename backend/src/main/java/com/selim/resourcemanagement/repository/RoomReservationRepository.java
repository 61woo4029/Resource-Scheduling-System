package com.selim.resourcemanagement.repository;

import com.selim.resourcemanagement.entity.MeetingRoom;
import com.selim.resourcemanagement.entity.RoomReservation;
import com.selim.resourcemanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface RoomReservationRepository extends JpaRepository<RoomReservation, Long> {

    List<RoomReservation> findByReservationDateAndStatusOrderByStartTime(LocalDate date, String status);

    List<RoomReservation> findByRoomAndReservationDateBetweenAndStatusOrderByReservationDateAscStartTimeAsc(
            MeetingRoom room, LocalDate startDate, LocalDate endDate, String status);

    List<RoomReservation> findByUserOrderByReservationDateDescStartTimeDesc(User user);

    @Query("SELECT r FROM RoomReservation r WHERE r.room = :room " +
           "AND r.reservationDate = :date AND r.status = 'CONFIRMED' " +
           "AND r.startTime < :endTime AND r.endTime > :startTime")
    List<RoomReservation> findConflicting(@Param("room") MeetingRoom room,
                                          @Param("date") LocalDate date,
                                          @Param("startTime") String startTime,
                                          @Param("endTime") String endTime);

    @Query("SELECT r FROM RoomReservation r WHERE r.room = :room " +
           "AND r.reservationDate = :date AND r.status = 'CONFIRMED' " +
           "AND r.startTime < :endTime AND r.endTime > :startTime " +
           "AND r.reservationId != :excludeId")
    List<RoomReservation> findConflictingExclude(@Param("room") MeetingRoom room,
                                                  @Param("date") LocalDate date,
                                                  @Param("startTime") String startTime,
                                                  @Param("endTime") String endTime,
                                                  @Param("excludeId") Long excludeId);

    List<RoomReservation> findByUserAndReservationDateGreaterThanEqualAndStatusOrderByReservationDateAsc(
            User user, LocalDate date, String status);
}
