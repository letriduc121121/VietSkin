package com.vietskin.backend_springboot.common.sse;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Quản lý SSE emitters theo "room":
 *   receptionist       → lễ tân
 *   doctor:{doctorId}  → bác sĩ cụ thể
 *   patient:{userId}   → bệnh nhân cụ thể
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SseService {

    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<String, CopyOnWriteArrayList<SseEmitter>> rooms =
            new ConcurrentHashMap<>();

    public SseEmitter subscribe(String room) {
        SseEmitter emitter = new SseEmitter(0L); // không timeout
        rooms.computeIfAbsent(room, k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable cleanup = () -> removeEmitter(room, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            cleanup.run();
        }

        log.debug("SSE subscribe room={} total={}", room, rooms.getOrDefault(room, new CopyOnWriteArrayList<>()).size());
        return emitter;
    }

    private void removeEmitter(String room, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> list = rooms.get(room);
        if (list != null) list.remove(emitter);
    }

    public void publish(String room, String type, Object payload) {
        CopyOnWriteArrayList<SseEmitter> list = rooms.get(room);
        if (list == null || list.isEmpty()) {
            log.debug("SSE publish room={} type={} — no subscribers", room, type);
            return;
        }

        String json;
        try {
            json = objectMapper.writeValueAsString(Map.of("type", type, "payload", payload));
        } catch (Exception e) {
            log.error("SSE serialize error", e);
            return;
        }

        List<SseEmitter> dead = new java.util.ArrayList<>();
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event().data(json));
            } catch (Exception e) {
                dead.add(emitter);
            }
        }
        if (!dead.isEmpty()) list.removeAll(dead);
        log.debug("SSE publish room={} type={} delivered={}", room, type, list.size() - dead.size());
    }

    // ── Helpers theo role ───────────────────────────────────────────────────

    public void publishToReceptionist(String type, Object payload) {
        publish("receptionist", type, payload);
    }

    public void publishToDoctor(Integer doctorId, String type, Object payload) {
        publish("doctor:" + doctorId, type, payload);
    }

    public void publishToPatient(Integer userId, String type, Object payload) {
        publish("patient:" + userId, type, payload);
    }
}
