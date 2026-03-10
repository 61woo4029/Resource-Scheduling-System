package com.selim.resourcemanagement.service;

import com.selim.resourcemanagement.dto.MeetingRoomDto;
import com.selim.resourcemanagement.entity.MeetingRoom;
import com.selim.resourcemanagement.entity.RoomReservation;
import com.selim.resourcemanagement.entity.User;
import com.selim.resourcemanagement.repository.MeetingRoomRepository;
import com.selim.resourcemanagement.repository.RoomReservationRepository;
import com.selim.resourcemanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MeetingRoomService 단위 테스트")
class MeetingRoomServiceTest {

    @Mock MeetingRoomRepository meetingRoomRepository;
    @Mock RoomReservationRepository roomReservationRepository;
    @Mock UserRepository userRepository;

    @InjectMocks MeetingRoomService meetingRoomService;

    private MeetingRoom room;
    private User user;

    @BeforeEach
    void setUp() {
        room = MeetingRoom.builder()
                .roomId(1L).roomName("회의실A").location("3층").capacity(10)
                .facilities("TV, 화이트보드").status("AVAILABLE").isActive(true).build();

        user = User.builder()
                .userId(1L).email("user@test.com").name("홍길동")
                .phone("010-1111-2222").role("USER").isActive(true).build();
    }

    @Test
    @DisplayName("활성 회의실 목록 조회")
    void getRooms_returnsActiveRooms() {
        given(meetingRoomRepository.findByIsActiveTrueOrderByRoomName()).willReturn(List.of(room));

        List<MeetingRoomDto.Response> rooms = meetingRoomService.getRooms();

        assertThat(rooms).hasSize(1);
        assertThat(rooms.get(0).getRoomName()).isEqualTo("회의실A");
    }

    @Test
    @DisplayName("회의실 예약 생성 성공")
    void createReservation_success() {
        MeetingRoomDto.ReservationCreateRequest req = new MeetingRoomDto.ReservationCreateRequest(
                1L, "2026-03-10", "09:00", "10:00", "주간 회의", 5, "테스트 메모");

        given(meetingRoomRepository.findById(1L)).willReturn(Optional.of(room));
        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(roomReservationRepository.findConflicting(any(), any(), any(), any()))
                .willReturn(List.of());

        RoomReservation saved = RoomReservation.builder()
                .reservationId(1L).room(room).user(user)
                .reservationDate(LocalDate.of(2026, 3, 10))
                .startTime("09:00").endTime("10:00")
                .meetingTitle("주간 회의").attendeeCount(5)
                .status("CONFIRMED").build();
        given(roomReservationRepository.save(any())).willReturn(saved);

        MeetingRoomDto.ReservationResponse res = meetingRoomService.createReservation(req, "user@test.com");

        assertThat(res.getMeetingTitle()).isEqualTo("주간 회의");
        assertThat(res.getStartTime()).isEqualTo("09:00");
        assertThat(res.getStatus()).isEqualTo("CONFIRMED");
    }

    @Test
    @DisplayName("시간대 중복 시 예약 생성 실패")
    void createReservation_conflict_throws() {
        MeetingRoomDto.ReservationCreateRequest req = new MeetingRoomDto.ReservationCreateRequest(
                1L, "2026-03-10", "09:00", "10:00", "충돌 회의", 3, null);

        RoomReservation existing = RoomReservation.builder()
                .reservationId(2L).room(room).user(user)
                .reservationDate(LocalDate.of(2026, 3, 10))
                .startTime("09:00").endTime("10:00")
                .meetingTitle("기존 예약").status("CONFIRMED").build();

        given(meetingRoomRepository.findById(1L)).willReturn(Optional.of(room));
        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(roomReservationRepository.findConflicting(any(), any(), any(), any()))
                .willReturn(List.of(existing));

        assertThatThrownBy(() -> meetingRoomService.createReservation(req, "user@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이미 예약이 있습니다");
    }

    @Test
    @DisplayName("본인 예약 취소 성공")
    void cancelReservation_ownerCancel_success() {
        RoomReservation reservation = RoomReservation.builder()
                .reservationId(1L).room(room).user(user)
                .reservationDate(LocalDate.of(2026, 3, 10))
                .startTime("09:00").endTime("10:00")
                .meetingTitle("주간 회의").status("CONFIRMED").build();

        given(roomReservationRepository.findById(1L)).willReturn(Optional.of(reservation));
        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(roomReservationRepository.save(any())).willReturn(reservation);

        meetingRoomService.cancelReservation(1L, "user@test.com");

        assertThat(reservation.getStatus()).isEqualTo("CANCELLED");
    }

    @Test
    @DisplayName("타인 예약 취소 시도 시 실패")
    void cancelReservation_otherUser_throws() {
        User otherUser = User.builder()
                .userId(2L).email("other@test.com").name("다른사람").role("USER").isActive(true).build();

        RoomReservation reservation = RoomReservation.builder()
                .reservationId(1L).room(room).user(otherUser)
                .reservationDate(LocalDate.of(2026, 3, 10))
                .startTime("09:00").endTime("10:00")
                .meetingTitle("타인 예약").status("CONFIRMED").build();

        given(roomReservationRepository.findById(1L)).willReturn(Optional.of(reservation));
        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));

        assertThatThrownBy(() -> meetingRoomService.cancelReservation(1L, "user@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("본인의 예약만 취소");
    }

    @Test
    @DisplayName("관리자는 타인 예약도 취소 가능")
    void cancelReservation_adminCanCancelOthers() {
        User admin = User.builder()
                .userId(3L).email("admin@test.com").name("관리자").role("SYSTEM_ADMIN").isActive(true).build();

        RoomReservation reservation = RoomReservation.builder()
                .reservationId(1L).room(room).user(user)
                .reservationDate(LocalDate.of(2026, 3, 10))
                .startTime("09:00").endTime("10:00")
                .meetingTitle("주간 회의").status("CONFIRMED").build();

        given(roomReservationRepository.findById(1L)).willReturn(Optional.of(reservation));
        given(userRepository.findByEmail("admin@test.com")).willReturn(Optional.of(admin));
        given(roomReservationRepository.save(any())).willReturn(reservation);

        assertThatCode(() -> meetingRoomService.cancelReservation(1L, "admin@test.com"))
                .doesNotThrowAnyException();

        assertThat(reservation.getStatus()).isEqualTo("CANCELLED");
    }

    @Test
    @DisplayName("회의실 삭제는 비활성화 처리")
    void deleteRoom_setsInactive() {
        given(meetingRoomRepository.findById(1L)).willReturn(Optional.of(room));
        given(meetingRoomRepository.save(any())).willReturn(room);

        meetingRoomService.deleteRoom(1L);

        assertThat(room.getIsActive()).isFalse();
    }
}
