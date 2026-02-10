package com.moodrop.moodrop_service.controller;

import com.moodrop.moodrop_service.service.ConnectionService;
import com.moodrop.moodrop_service.service.SocketSessionService;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class ConnectionSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ConnectionService connectionService;
    private final SocketSessionService socketSessionService;

    public ConnectionSocketController(SimpMessagingTemplate messagingTemplate,
                                      ConnectionService connectionService,
                                      SocketSessionService socketSessionService) {
        this.messagingTemplate = messagingTemplate;
        this.connectionService = connectionService;
        this.socketSessionService = socketSessionService;
    }

    @MessageMapping("/register")
    public void register(@Payload String myId,
                         @Header("simpSessionId") String sessionId) {
        socketSessionService.register(myId, sessionId);
    }
}
