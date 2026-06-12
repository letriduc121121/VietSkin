package com.vietskin.backend_springboot.modules.chatbot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vietskin.backend_springboot.common.exception.AppException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Consumer;
import java.util.stream.Stream;

/**
 * Gọi API chat của Groq (OpenAI-compatible).
 * - chat(): gọi 1 lần, không streaming (dùng cho endpoint /api/chat đơn giản).
 * - streamCompletion(): streaming thật + hỗ trợ Tool Calling (dùng cho /api/chat/stream).
 */
@Slf4j
@Component
public class GroqClient {

    private final RestClient restClient;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String baseUrl;
    private final String model;

    public GroqClient(
            @Value("${groq.api-key}") String apiKey,
            @Value("${groq.base-url}") String baseUrl,
            @Value("${groq.model}") String model,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.model = model;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }

    // ── 1. Gọi thường (không streaming, không tool) ──────────────────────────

    public String chat(List<Map<String, String>> messages) {
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", messages,
                "temperature", 0.6,
                "max_tokens", 1024
        );
        try {
            GroqResponse resp = restClient.post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(GroqResponse.class);
            if (resp == null || resp.choices() == null || resp.choices().isEmpty()) {
                throw new AppException(HttpStatus.BAD_GATEWAY, "AI không trả về nội dung");
            }
            return resp.choices().get(0).message().content();
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(HttpStatus.BAD_GATEWAY, "Không gọi được dịch vụ AI: " + e.getMessage());
        }
    }

    // ── 2. Streaming thật + Tool Calling ─────────────────────────────────────

    /**
     * Gọi Groq ở chế độ streaming. Mỗi mảnh nội dung trả về sẽ được đẩy qua onDelta.
     * Nếu model quyết định gọi tool, các tool_calls được gom lại và trả về trong StreamResult
     * (lúc này onDelta KHÔNG được gọi vì model chưa sinh câu trả lời).
     *
     * @param tools danh sách tool (null/empty = không cho gọi tool, buộc model trả lời)
     */
    public StreamResult streamCompletion(List<Map<String, Object>> messages,
                                         List<Map<String, Object>> tools,
                                         Consumer<String> onDelta) {
        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", messages);
        body.put("stream", true);
        body.put("temperature", 0.4);
        body.put("max_tokens", 1024);
        if (tools != null && !tools.isEmpty()) {
            body.put("tools", tools);
            body.put("tool_choice", "auto");
        }

        StringBuilder content = new StringBuilder();
        Map<Integer, ToolAcc> toolAccs = new TreeMap<>();
        String[] finishReason = {null};

        try {
            String json = objectMapper.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl + "/chat/completions"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<Stream<String>> resp =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofLines());

            if (resp.statusCode() >= 400) {
                throw new AppException(HttpStatus.BAD_GATEWAY, "Dịch vụ AI trả lỗi HTTP " + resp.statusCode());
            }

            try (Stream<String> lines = resp.body()) {
                lines.forEach(line -> {
                    if (!line.startsWith("data:")) return;
                    String data = line.substring(5).trim();
                    if (data.isEmpty() || data.equals("[DONE]")) return;
                    try {
                        JsonNode choice = objectMapper.readTree(data).path("choices").path(0);
                        JsonNode delta = choice.path("delta");

                        JsonNode c = delta.path("content");
                        if (c.isTextual() && !c.asText().isEmpty()) {
                            content.append(c.asText());
                            onDelta.accept(c.asText());
                        }

                        JsonNode tcs = delta.path("tool_calls");
                        if (tcs.isArray()) {
                            for (JsonNode tc : tcs) {
                                int idx = tc.path("index").asInt(0);
                                ToolAcc acc = toolAccs.computeIfAbsent(idx, k -> new ToolAcc());
                                if (tc.hasNonNull("id")) acc.id = tc.get("id").asText();
                                JsonNode fn = tc.path("function");
                                if (fn.hasNonNull("name")) acc.name = fn.get("name").asText();
                                if (fn.hasNonNull("arguments")) acc.args.append(fn.get("arguments").asText());
                            }
                        }

                        if (choice.hasNonNull("finish_reason")) {
                            finishReason[0] = choice.get("finish_reason").asText();
                        }
                    } catch (Exception ignore) {
                        // bỏ qua dòng SSE lỗi định dạng
                    }
                });
            }

            List<ToolCall> toolCalls = new ArrayList<>();
            for (ToolAcc a : toolAccs.values()) {
                if (a.name != null) toolCalls.add(new ToolCall(a.id, a.name, a.args.toString()));
            }
            return new StreamResult(content.toString(), toolCalls, finishReason[0]);

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(HttpStatus.BAD_GATEWAY, "Không gọi được dịch vụ AI: " + e.getMessage());
        }
    }

    // ── Cấu trúc dữ liệu ─────────────────────────────────────────────────────

    private static class ToolAcc {
        String id;
        String name;
        final StringBuilder args = new StringBuilder();
    }

    public record ToolCall(String id, String name, String arguments) {}

    public record StreamResult(String content, List<ToolCall> toolCalls, String finishReason) {}

    // JSON trả về cho chế độ chat() thường
    public record GroqResponse(List<Choice> choices) {}
    public record Choice(Message message) {}
    public record Message(String role, String content) {}
}
