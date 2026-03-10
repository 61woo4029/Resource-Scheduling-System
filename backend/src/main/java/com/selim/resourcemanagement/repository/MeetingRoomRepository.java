package com.selim.resourcemanagement.repository;

import com.selim.resourcemanagement.entity.MeetingRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MeetingRoomRepository extends JpaRepository<MeetingRoom, Long> {
    List<MeetingRoom> findByIsActiveTrueOrderByRoomName();
}
