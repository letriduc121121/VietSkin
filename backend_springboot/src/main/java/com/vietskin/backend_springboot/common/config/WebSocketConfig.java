package com.vietskin.backend_springboot.common.config;

import com.vietskin.backend_springboot.common.websocket.AppWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import org.springframework.web.socket.server.support.WebSocketHttpRequestHandler;
import org.springframework.web.servlet.handler.SimpleUrlHandlerMapping;

import java.util.Map;

@Configuration
@RequiredArgsConstructor
public class WebSocketConfig {

    private final AppWebSocketHandler wsHandler;

    @Bean
    public SimpleUrlHandlerMapping webSocketHandlerMapping() {
        WebSocketHttpRequestHandler requestHandler =
                new WebSocketHttpRequestHandler(wsHandler, new DefaultHandshakeHandler());

        SimpleUrlHandlerMapping mapping = new SimpleUrlHandlerMapping();
        mapping.setOrder(1);
        mapping.setUrlMap(Map.of("/ws", requestHandler));
        return mapping;
    }
}
