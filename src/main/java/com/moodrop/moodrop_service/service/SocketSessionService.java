package com.moodrop.moodrop_service.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SocketSessionService {

    // myId -> sessionId
    private final Map<String, String> socketMap = new ConcurrentHashMap<>();

    public void register(String myId, String sessionId) {
        socketMap.put(myId, sessionId);
    }

    public boolean isOnline(String myId) {
        return socketMap.containsKey(myId);
    }
}
