package com.moodrop.moodrop_service.service;

import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FileTransferService {

    // key = receiverId + fileName
    private final Map<String, ByteArrayOutputStream> fileBuffer = new ConcurrentHashMap<>();

    public void appendChunk(String key, byte[] data) throws Exception {
        fileBuffer.computeIfAbsent(key, k -> new ByteArrayOutputStream())
                .write(data);
    }

    public byte[] completeFile(String key) {
        ByteArrayOutputStream out = fileBuffer.remove(key);
        return out != null ? out.toByteArray() : null;
    }

    public void clearAll() {
        fileBuffer.clear();
    }
}
