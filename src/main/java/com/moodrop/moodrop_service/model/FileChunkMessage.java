package com.moodrop.moodrop_service.model;

public class FileChunkMessage {

    private String fromId;
    private String toId;

    private String fileName;
    private String fileType;
    private long fileSize;

    private int chunkIndex;
    private int totalChunks;

    private byte[] data;

    // ===== GETTERS =====
    public String getFromId() { return fromId; }
    public String getToId() { return toId; }
    public String getFileName() { return fileName; }
    public String getFileType() { return fileType; }
    public long getFileSize() { return fileSize; }
    public int getChunkIndex() { return chunkIndex; }
    public int getTotalChunks() { return totalChunks; }
    public byte[] getData() { return data; }

    // ===== SETTERS =====
    public void setFromId(String fromId) { this.fromId = fromId; }
    public void setToId(String toId) { this.toId = toId; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }
    public void setChunkIndex(int chunkIndex) { this.chunkIndex = chunkIndex; }
    public void setTotalChunks(int totalChunks) { this.totalChunks = totalChunks; }
    public void setData(byte[] data) { this.data = data; }
}
