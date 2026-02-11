package com.moodrop.moodrop_service.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class SignalingController {

    private final SimpMessagingTemplate messagingTemplate;

    // active users
    private final Map<String, String> users = new ConcurrentHashMap<>();

    public SignalingController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/register")
    public void register(String userId) {
        users.put(userId, userId);
        System.out.println("👤 Registered user: " + userId);
    }

    @MessageMapping("/connect")
    public void connect(Map<String, String> payload) {

        String from = payload.get("fromId");
        String to = payload.get("toId");

        System.out.println("🔗 Connect request from " + from + " to " + to);

        if (users.containsKey(to)) {

            messagingTemplate.convertAndSend("/topic/status/" + from, "CONNECTED");
            messagingTemplate.convertAndSend("/topic/status/" + to, "CONNECTED");

        } else {
            messagingTemplate.convertAndSend("/topic/status/" + from, "NOT_FOUND");
        }
    }
}
