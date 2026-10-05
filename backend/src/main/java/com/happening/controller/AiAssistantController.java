package com.happening.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.happening.dto.AssistantChatRequest;
import com.happening.dto.AssistantChatResponse;
import com.happening.service.AiAssistantService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/assistant")
public class AiAssistantController {
    private final AiAssistantService assistantService;

    public AiAssistantController(AiAssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @PostMapping("/chat")
    @ResponseStatus(HttpStatus.OK)
    public AssistantChatResponse chat(@Valid @RequestBody AssistantChatRequest request) {
        return assistantService.chat(request);
    }
}
