package com.moodrop.moodrop_service.config;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketEventListener {

    @EventListener
    public void handleConnect(SessionConnectEvent event) {
        System.out.println("🔗 STOMP Connect event received");
    }

    @EventListener
    public void handleConnected(SessionConnectedEvent event) {
        System.out.println("✅ STOMP Connected successfully");
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        System.out.println("❌ STOMP Disconnected");
    }
}
