package com.vietskin.backend_springboot.common.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Quản lý WebSocket sessions theo room.
 *
 * Client kết nối:  ws://localhost:8080/ws?room=receptionist
 * Rooms:
 *   receptionist        → lễ tân
 *   doctor:{doctorId}   → bác sĩ
 *   patient:{userId}    → bệnh nhân
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AppWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<String, CopyOnWriteArrayList<WebSocketSession>> rooms =
            new ConcurrentHashMap<>();

    // ── Connection lifecycle ────────────────────────────────────────────────

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String room = getRoom(session);
        if (room == null) { closeQuietly(session); return; }

        rooms.computeIfAbsent(room, k -> new CopyOnWriteArrayList<>()).add(session);
        log.debug("[WS] Connected room={} sessionId={}", room, session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String room = getRoom(session);
        if (room != null) {
            CopyOnWriteArrayList<WebSocketSession> list = rooms.get(room);
            if (list != null) list.remove(session);
        }
        log.debug("[WS] Closed room={} status={}", room, status);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable e) {
        log.debug("[WS] Transport error session={}: {}", session.getId(), e.getMessage());
        afterConnectionClosed(session, CloseStatus.SERVER_ERROR);
    }

    // ── Publish ─────────────────────────────────────────────────────────────

    public void publishToRoom(String room, String type, Object payload) {
        CopyOnWriteArrayList<WebSocketSession> list = rooms.get(room);
        if (list == null || list.isEmpty()) return;

        String json;
        try {
            json = objectMapper.writeValueAsString(Map.of("type", type, "payload", payload));
        } catch (Exception e) {
            log.error("[WS] Serialize error", e);
            return;
        }

        TextMessage msg = new TextMessage(json);
        List<WebSocketSession> dead = new java.util.ArrayList<>();
        for (WebSocketSession s : list) {
            if (!s.isOpen()) { dead.add(s); continue; }
            try { s.sendMessage(msg); }
            catch (Exception e) { dead.add(s); }
        }
        if (!dead.isEmpty()) list.removeAll(dead);
    }

    public void publishToReceptionist(String type, Object payload) {
        publishToRoom("receptionist", type, payload);
    }

    public void publishToDoctor(Integer doctorId, String type, Object payload) {
        publishToRoom("doctor:" + doctorId, type, payload);
    }

    public void publishToPatient(Integer userId, String type, Object payload) {
        publishToRoom("patient:" + userId, type, payload);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private String getRoom(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null) return null;
        String query = uri.getQuery(); // "room=receptionist"
        if (query == null) return null;
        for (String part : query.split("&")) {
            if (part.startsWith("room=")) return part.substring(5);
        }
        return null;
    }

    private void closeQuietly(WebSocketSession session) {
        try { session.close(CloseStatus.BAD_DATA); } catch (Exception ignored) {}
    }
}
