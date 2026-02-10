package com.moodrop.moodrop_service.controller;

import com.moodrop.moodrop_service.service.ConnectionService;
import com.moodrop.moodrop_service.service.RealtimeService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Controller
public class HomeController {

    private final ConnectionService connectionService;
    private final RealtimeService realtimeService;

    public HomeController(ConnectionService connectionService,
                          RealtimeService realtimeService) {
        this.connectionService = connectionService;
        this.realtimeService = realtimeService;
    }

    @GetMapping("/")
    public String home(@RequestParam(required = false) String myId,
                       Model model, HttpSession session) {

        if (session.getAttribute("myId") == null) {
            session.setAttribute("myId", UUID.randomUUID().toString().substring(0, 6));
        }

        String finalMyId = (String) session.getAttribute("myId");

        model.addAttribute("myId", finalMyId);
        model.addAttribute("connected", connectionService.isConnected(finalMyId));
        model.addAttribute("remoteId", connectionService.getRemote(finalMyId));

        return "index";
    }

    @PostMapping("/connect")
    public String connect(@RequestParam String remoteId, HttpSession session) {
        String myId = (String) session.getAttribute("myId");
        if (myId == null) return "redirect:/";

        connectionService.connect(myId, remoteId);
        realtimeService.notifyConnection(myId);

        return "redirect:/";
    }

    @PostMapping("/disconnect")
    @ResponseBody
    public void disconnect(HttpSession session) {
        String myId = (String) session.getAttribute("myId");
        if (myId != null) {
            String remote = connectionService.getRemote(myId);
            connectionService.disconnect(myId);
            if (remote != null) realtimeService.notifyDisconnection(remote);
        }
        session.invalidate();
    }
}
