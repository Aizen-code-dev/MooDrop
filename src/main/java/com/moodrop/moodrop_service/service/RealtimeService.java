package com.moodrop.moodrop_service.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class RealtimeService {

    private final SimpMessagingTemplate messagingTemplate;
    private final ConnectionService connectionService;

    public RealtimeService(SimpMessagingTemplate messagingTemplate,
                           ConnectionService connectionService) {
        this.messagingTemplate = messagingTemplate;
        this.connectionService = connectionService;
    }

    public void notifyConnection(String myId) {
        String remote = connectionService.getRemote(myId);
        if (remote != null) {
            messagingTemplate.convertAndSend("/topic/status/" + myId, "CONNECTED");
            messagingTemplate.convertAndSend("/topic/status/" + remote, "CONNECTED");
        }
    }

    public void notifyDisconnection(String remoteId) {
        messagingTemplate.convertAndSend("/topic/status/" + remoteId, "DISCONNECTED");
    }
}
