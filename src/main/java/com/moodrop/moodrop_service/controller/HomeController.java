package com.moodrop.moodrop_service.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.UUID;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home(Model model) {

        // Always generate fresh ID
        String myId = UUID.randomUUID().toString().substring(0, 6);

        model.addAttribute("myId", myId);
        model.addAttribute("connected", false);

        System.out.println("🆕 New client ID generated: " + myId);

        return "index";
    }
}
