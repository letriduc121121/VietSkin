package com.vietskin.backend_springboot.common.sse;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * SSE endpoints — frontend subscribe theo role/id.
 *
 *   Lễ tân  : GET /api/sse/receptionist
 *   Bác sĩ  : GET /api/sse/doctor/{doctorId}
 *   Bệnh nhân: GET /api/sse/patient/{userId}
 *
 * Không yêu cầu auth header vì EventSource API không hỗ trợ custom headers.
 * SecurityConfig đã permit /api/sse/**.
 */
@RestController
@RequestMapping("/api/sse")
@RequiredArgsConstructor
public class SseController {

    private final SseService sseService;

    @GetMapping(value = "/receptionist", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter receptionist() {
        return sseService.subscribe("receptionist");
    }

    @GetMapping(value = "/doctor/{doctorId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter doctor(@PathVariable Integer doctorId) {
        return sseService.subscribe("doctor:" + doctorId);
    }

    @GetMapping(value = "/patient/{userId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter patient(@PathVariable Integer userId) {
        return sseService.subscribe("patient:" + userId);
    }
}
