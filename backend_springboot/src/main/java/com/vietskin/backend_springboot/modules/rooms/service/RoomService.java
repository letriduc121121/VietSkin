package com.vietskin.backend_springboot.modules.rooms.service;

import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.modules.doctors.repository.DoctorRepository;
import com.vietskin.backend_springboot.modules.rooms.dto.CreateRoomRequest;
import com.vietskin.backend_springboot.modules.rooms.entity.Room;
import com.vietskin.backend_springboot.modules.rooms.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final DoctorRepository doctorRepository;

    public List<Room> findAll() {
        return roomRepository.findAll()
                .stream()
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .toList();
    }

    public Room findOne(Integer id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Phòng khám không tồn tại"));
    }

    public Room create(CreateRoomRequest req) {
        Room room = new Room();
        room.setName(req.getName());
        room.setActive(true);

        if (req.getDoctorId() != null) {
            doctorRepository.findById(req.getDoctorId()).ifPresent(room::setDoctor);
        }

        return roomRepository.save(room);
    }

    public Room update(Integer id, CreateRoomRequest req) {
        Room room = findOne(id);

        if (req.getName()   != null) room.setName(req.getName());
        if (req.getActive() != null) room.setActive(req.getActive());

        // doctorId có thể set null để bỏ gắn bác sĩ
        if (req.getDoctorId() != null) {
            doctorRepository.findById(req.getDoctorId()).ifPresent(room::setDoctor);
        } else if (req.getDoctorId() == null && req.getName() != null) {
            // chỉ clear doctor khi request có field doctorId = null tường minh
            room.setDoctor(null);
        }

        return roomRepository.save(room);
    }

    /**
     * Bật / tắt phòng (lật trạng thái active).
     * Luật nghiệp vụ: KHÔNG cho tắt phòng khi vẫn còn bác sĩ phụ trách —
     * phải gỡ bác sĩ khỏi phòng trước. Bật lại thì không ràng buộc.
     */
    public Room toggleActive(Integer id) {
        Room room = findOne(id);
        boolean currentlyActive = Boolean.TRUE.equals(room.getActive());

        if (currentlyActive && room.getDoctor() != null) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Vui lòng gỡ bác sĩ phụ trách khỏi phòng trước khi tắt phòng.");
        }

        room.setActive(!currentlyActive);
        return roomRepository.save(room);
    }

    /**
     * "Xoá" phòng = tắt mềm (active=false), không xoá hẳn khỏi DB.
     * Cũng áp dụng luật phải gỡ bác sĩ trước khi tắt.
     */
    public Room remove(Integer id) {
        Room room = findOne(id);
        if (room.getDoctor() != null) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Vui lòng gỡ bác sĩ phụ trách khỏi phòng trước khi tắt phòng.");
        }
        room.setActive(false);
        return roomRepository.save(room);
    }
}
