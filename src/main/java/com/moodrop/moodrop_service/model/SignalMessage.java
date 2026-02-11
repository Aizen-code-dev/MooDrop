package com.moodrop.moodrop_service.model;

import tools.jackson.databind.JsonNode;

public class SignalMessage {

    private String type;
    private String from;
    private String to;
    private JsonNode data;

    public SignalMessage() {}

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }

    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }

    public JsonNode getData() { return data; }
    public void setData(JsonNode data) { this.data = data; }
}
