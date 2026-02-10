package com.moodrop.moodrop_service.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ConnectionService {

    // myId -> remoteId
    private final Map<String, String> connections = new ConcurrentHashMap<>();

    public void connect(String myId, String remoteId) {
        connections.put(myId, remoteId);
        connections.put(remoteId, myId);
    }

    public String getRemote(String myId) {
        return connections.get(myId);
    }

    public boolean isConnected(String myId) {
        return connections.containsKey(myId);
    }

    public void disconnect(String myId) {
        String remote = connections.remove(myId);
        if (remote != null) connections.remove(remote);
    }
}
