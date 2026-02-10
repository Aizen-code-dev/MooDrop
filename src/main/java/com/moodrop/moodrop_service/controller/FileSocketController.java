package com.moodrop.moodrop_service.controller;

import com.moodrop.moodrop_service.model.FileChunkMessage;
import com.moodrop.moodrop_service.service.FileTransferService;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class FileSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final FileTransferService fileService;

    public FileSocketController(SimpMessagingTemplate messagingTemplate,
                                FileTransferService fileService) {
        this.messagingTemplate = messagingTemplate;
        this.fileService = fileService;
    }

    @MessageMapping("/file/send")
    public void receiveChunk(@Payload FileChunkMessage msg) throws Exception {
        String key = msg.getToId() + "_" + msg.getFileName();
        fileService.appendChunk(key, msg.getData());

        if (msg.getChunkIndex() + 1 == msg.getTotalChunks()) {
            fileService.completeFile(key); // optional
        }

        // forward chunk to receiver
        messagingTemplate.convertAndSend("/topic/file/" + msg.getToId(), msg);
    }
}
