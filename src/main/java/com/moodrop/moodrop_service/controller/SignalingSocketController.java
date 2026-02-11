package com.moodrop.moodrop_service.controller;

import com.moodrop.moodrop_service.model.SignalMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class SignalingSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    public SignalingSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/signal")
    public void relaySignal(@Payload SignalMessage message) {

        messagingTemplate.convertAndSend(
                "/topic/signal/" + message.getTo(),
                message
        );
    }

}
