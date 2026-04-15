package com.hikebuddy.room;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class RoomCleanupScheduler {

    private final RoomRepository          roomRepo;
    private final RoomMemberRepository    memberRepo;
    private final RoomMessageRepository   messageRepo;
    private final RoomUpdateRepository    updateRepo;
    private final RoomJoinRequestRepository joinRequestRepo;

    /**
     * Runs every day at 02:00 UTC.
     * Deletes rooms where: planned_date + duration_days + 1 (buffer) <= today
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void deleteExpiredRooms() {
        LocalDate cutoff = LocalDate.now();
        List<Room> expired = roomRepo.findAll().stream()
                .filter(r -> !r.getPlannedDate().plusDays(r.getDurationDays() + 1L).isAfter(cutoff))
                .toList();

        for (Room room : expired) {
            joinRequestRepo.deleteByRoomId(room.getId());
            messageRepo.deleteByRoomId(room.getId());
            updateRepo.deleteByRoomId(room.getId());
            memberRepo.deleteByIdRoomId(room.getId());
            roomRepo.delete(room);
        }

        if (!expired.isEmpty()) {
            log.info("RoomCleanup: deleted {} expired room(s)", expired.size());
        }
    }
}
