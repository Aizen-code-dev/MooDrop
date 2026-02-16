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
    @GetMapping("/about")
    public String about() {
        return "about";
    }

    @GetMapping("/privacy-policy")
    public String privacy() {
        return "privacy";
    }

    @GetMapping("/terms-service")
    public String terms() {
        return "terms";
    }

    @GetMapping("/blog")
    public String blogHome() {
        return "blogs/blog/blog-home";
    }

    @GetMapping("/blog/how-peer-to-peer-file-sharing-works")
    public String blog1() {
        return "blogs/blog/how-peer-to-peer-file-sharing-works";
    }
    // Blog 2
    @GetMapping("/blog/p2p-vs-cloud-storage")
    public String blog2() {
        return "blogs/blog/p2p-vs-cloud-storage";
    }

    // Blog 3
    @GetMapping("/blog/how-webrtc-enables-secure-file-transfer")
    public String blog3() {
        return "blogs/blog/how-webrtc-enables-secure-file-transfer";
    }



}
