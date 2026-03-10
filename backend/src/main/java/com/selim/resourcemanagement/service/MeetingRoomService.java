package com.selim.resourcemanagement.service;

import com.selim.resourcemanagement.dto.MeetingRoomDto;
import com.selim.resourcemanagement.entity.MeetingRoom;
import com.selim.resourcemanagement.entity.RoomReservation;
import com.selim.resourcemanagement.entity.User;
import com.selim.resourcemanagement.repository.MeetingRoomRepository;
import com.selim.resourcemanagement.repository.RoomReservationRepository;
import com.selim.resourcemanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MeetingRoomService {

    private final MeetingRoomRepository meetingRoomRepository;
    private final RoomReservationRepository roomReservationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<MeetingRoomDto.Response> getRooms() {
        return meetingRoomRepository.findByIsActiveTrueOrderByRoomName()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public MeetingRoomDto.Response createRoom(MeetingRoomDto.CreateRequest request) {
        MeetingRoom room = MeetingRoom.builder()
                .roomName(request.getRoomName())
                .location(request.getLocation())
                .capacity(request.getCapacity())
                .facilities(request.getFacilities())
                .availableHours(request.getAvailableHours() != null ? request.getAvailableHours() : "08:00-20:00")
                .status(request.getStatus() != null ? request.getStatus() : "AVAILABLE")
                .build();
        return toDto(meetingRoomRepository.save(room));
    }

    @Transactional
    public MeetingRoomDto.Response updateRoom(Long id, MeetingRoomDto.CreateRequest request) {
        MeetingRoom room = meetingRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("회의실을 찾을 수 없습니다."));
        if (request.getRoomName() != null) room.setRoomName(request.getRoomName());
        if (request.getLocation() != null) room.setLocation(request.getLocation());
        if (request.getCapacity() != null) room.setCapacity(request.getCapacity());
        if (request.getFacilities() != null) room.setFacilities(request.getFacilities());
        if (request.getStatus() != null) room.setStatus(request.getStatus());
        return toDto(meetingRoomRepository.save(room));
    }

    @Transactional
    public void deleteRoom(Long id) {
        MeetingRoom room = meetingRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("회의실을 찾을 수 없습니다."));
        room.setIsActive(false);
        meetingRoomRepository.save(room);
    }

    @Transactional(readOnly = true)
    public List<MeetingRoomDto.ReservationResponse> getReservations(String viewType, Long roomId, String date, String startDate, String endDate) {
        if ("weekly".equals(viewType) && roomId != null) {
            MeetingRoom room = meetingRoomRepository.findById(roomId)
                    .orElseThrow(() -> new IllegalArgumentException("회의실을 찾을 수 없습니다."));
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            return roomReservationRepository
                    .findByRoomAndReservationDateBetweenAndStatusOrderByReservationDateAscStartTimeAsc(room, start, end, "CONFIRMED")
                    .stream().map(this::toReservationDto).collect(Collectors.toList());
        } else {
            LocalDate localDate = date != null ? LocalDate.parse(date) : LocalDate.now();
            return roomReservationRepository.findByReservationDateAndStatusOrderByStartTime(localDate, "CONFIRMED")
                    .stream().map(this::toReservationDto).collect(Collectors.toList());
        }
    }

    @Transactional(readOnly = true)
    public List<MeetingRoomDto.ReservationResponse> getMyReservations(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return roomReservationRepository.findByUserOrderByReservationDateDescStartTimeDesc(user)
                .stream().map(this::toReservationDto).collect(Collectors.toList());
    }

    @Transactional
    public MeetingRoomDto.ReservationResponse createReservation(MeetingRoomDto.ReservationCreateRequest request, String email) {
        MeetingRoom room = meetingRoomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new IllegalArgumentException("회의실을 찾을 수 없습니다."));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        LocalDate date = LocalDate.parse(request.getReservationDate());

        List<RoomReservation> conflicts = roomReservationRepository.findConflicting(
                room, date, request.getStartTime(), request.getEndTime());
        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException("해당 시간대에 이미 예약이 있습니다.");
        }

        RoomReservation reservation = RoomReservation.builder()
                .room(room).user(user).userPhone(user.getPhone())
                .reservationDate(date)
                .startTime(request.getStartTime()).endTime(request.getEndTime())
                .meetingTitle(request.getMeetingTitle())
                .attendeeCount(request.getAttendeeCount())
                .notes(request.getNotes())
                .build();

        return toReservationDto(roomReservationRepository.save(reservation));
    }

    @Transactional
    public MeetingRoomDto.ReservationResponse updateReservation(Long id, MeetingRoomDto.ReservationCreateRequest request, String email) {
        RoomReservation reservation = roomReservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("예약을 찾을 수 없습니다."));

        if (!reservation.getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException("본인의 예약만 수정할 수 있습니다.");
        }

        MeetingRoom room = meetingRoomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new IllegalArgumentException("회의실을 찾을 수 없습니다."));
        LocalDate date = LocalDate.parse(request.getReservationDate());

        List<RoomReservation> conflicts = roomReservationRepository.findConflictingExclude(
                room, date, request.getStartTime(), request.getEndTime(), id);
        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException("해당 시간대에 이미 예약이 있습니다.");
        }

        reservation.setRoom(room);
        reservation.setReservationDate(date);
        reservation.setStartTime(request.getStartTime());
        reservation.setEndTime(request.getEndTime());
        reservation.setMeetingTitle(request.getMeetingTitle());
        reservation.setAttendeeCount(request.getAttendeeCount());
        reservation.setNotes(request.getNotes());

        return toReservationDto(roomReservationRepository.save(reservation));
    }

    @Transactional
    public void cancelReservation(Long id, String email) {
        RoomReservation reservation = roomReservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("예약을 찾을 수 없습니다."));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        boolean isAdmin = "SYSTEM_ADMIN".equals(user.getRole());

        if (!isAdmin && !reservation.getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException("본인의 예약만 취소할 수 있습니다.");
        }

        reservation.setStatus("CANCELLED");
        roomReservationRepository.save(reservation);
    }

    private MeetingRoomDto.Response toDto(MeetingRoom room) {
        return MeetingRoomDto.Response.builder()
                .roomId(room.getRoomId()).roomName(room.getRoomName())
                .location(room.getLocation()).capacity(room.getCapacity())
                .facilities(room.getFacilities()).availableHours(room.getAvailableHours())
                .status(room.getStatus()).build();
    }

    private MeetingRoomDto.ReservationResponse toReservationDto(RoomReservation r) {
        return MeetingRoomDto.ReservationResponse.builder()
                .reservationId(r.getReservationId())
                .roomId(r.getRoom().getRoomId())
                .userId(r.getUser().getUserId())
                .room(MeetingRoomDto.RoomInfo.builder()
                        .roomId(r.getRoom().getRoomId())
                        .roomName(r.getRoom().getRoomName())
                        .location(r.getRoom().getLocation())
                        .build())
                .user(MeetingRoomDto.UserInfo.builder()
                        .userId(r.getUser().getUserId())
                        .name(r.getUser().getName())
                        .phone(r.getUserPhone())
                        .build())
                .reservationDate(r.getReservationDate().toString())
                .startTime(r.getStartTime()).endTime(r.getEndTime())
                .meetingTitle(r.getMeetingTitle())
                .attendeeCount(r.getAttendeeCount())
                .notes(r.getNotes()).status(r.getStatus())
                .build();
    }
}
