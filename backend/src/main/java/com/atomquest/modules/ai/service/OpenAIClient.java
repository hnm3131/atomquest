package com.atomquest.modules.ai.service;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * AI client using Groq's OpenAI-compatible API.
 * Groq provides ultra-fast inference using LLaMA 3 models.
 * API docs: https://console.groq.com/docs/openai
 *
 * Falls back gracefully when GROQ_API_KEY is not configured.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OpenAIClient {

    // Groq API — fully OpenAI-compatible
    private static final String GROQ_BASE_URL = "https://api.groq.com/openai/v1";
    private static final String CHAT_URL      = GROQ_BASE_URL + "/chat/completions";
    private static final String EMBED_URL     = GROQ_BASE_URL + "/embeddings";

    // Groq models — use LLaMA 3.3 70B for chat, nomic-embed for embeddings
    private static final String CHAT_MODEL  = "llama-3.3-70b-versatile";
    private static final String EMBED_MODEL = "nomic-embed-text";

    private final RestTemplate restTemplate;

    @Value("${app.ai.groq-api-key:}")
    private String groqApiKey;

    // Fallback to legacy OpenAI key if Groq key is missing
    @Value("${app.ai.openai-api-key:}")
    private String openAiApiKey;

    /**
     * Returns true if either Groq or OpenAI key is configured.
     */
    public boolean isConfigured() {
        return isGroqConfigured() || isOpenAiConfigured();
    }

    private boolean isGroqConfigured() {
        return groqApiKey != null && !groqApiKey.isBlank();
    }

    private boolean isOpenAiConfigured() {
        return openAiApiKey != null && !openAiApiKey.isBlank();
    }

    private String activeApiKey() {
        return isGroqConfigured() ? groqApiKey : openAiApiKey;
    }

    private String activeChatUrl() {
        return isGroqConfigured() ? CHAT_URL : "https://api.openai.com/v1/chat/completions";
    }

    private String activeChatModel() {
        return isGroqConfigured() ? CHAT_MODEL : "gpt-3.5-turbo";
    }

    // -------------------------------------------------------------------------
    // Chat Completion
    // -------------------------------------------------------------------------

    /**
     * Sends a chat completion request to Groq (or OpenAI as fallback).
     *
     * @param systemPrompt  The system-level instruction
     * @param userMessage   The user's message
     * @return              The assistant's response text
     */
    public String chatCompletion(String systemPrompt, String userMessage) {
        if (!isConfigured()) {
            log.debug("No AI API key configured — returning fallback message.");
            return "[AI unavailable — configure GROQ_API_KEY in .env]";
        }
        try {
            HttpHeaders headers = buildHeaders(activeApiKey());
            Map<String, Object> body = Map.of(
                    "model", activeChatModel(),
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user",   "content", userMessage)
                    ),
                    "max_tokens", 1024,
                    "temperature", 0.7
            );
            ResponseEntity<ChatResponse> resp = restTemplate.exchange(
                    activeChatUrl(), HttpMethod.POST,
                    new HttpEntity<>(body, headers), ChatResponse.class);

            if (resp.getBody() != null && !resp.getBody().getChoices().isEmpty()) {
                return resp.getBody().getChoices().get(0).getMessage().getContent().trim();
            }
            return "No response from AI.";
        } catch (Exception e) {
            log.error("Groq chat completion failed: {}", e.getMessage());
            return "AI service temporarily unavailable. Please try again later.";
        }
    }

    // -------------------------------------------------------------------------
    // Embeddings (for pgvector semantic search)
    // -------------------------------------------------------------------------

    /**
     * Generates a text embedding vector using Groq's nomic-embed-text model.
     * Returns empty list if AI is not configured or call fails.
     */
    public List<Double> embed(String text) {
        if (!isConfigured()) {
            log.debug("No AI key configured — skipping embedding.");
            return List.of();
        }
        try {
            // Groq supports nomic-embed-text for embeddings
            String embedUrl  = isGroqConfigured() ? EMBED_URL : "https://api.openai.com/v1/embeddings";
            String embedModel = isGroqConfigured() ? EMBED_MODEL : "text-embedding-3-small";

            HttpHeaders headers = buildHeaders(activeApiKey());
            Map<String, Object> body = Map.of("model", embedModel, "input", text);

            ResponseEntity<EmbedResponse> resp = restTemplate.exchange(
                    embedUrl, HttpMethod.POST,
                    new HttpEntity<>(body, headers), EmbedResponse.class);

            if (resp.getBody() != null && !resp.getBody().getData().isEmpty()) {
                return resp.getBody().getData().get(0).getEmbedding();
            }
        } catch (Exception e) {
            log.warn("Embedding call failed: {} — semantic search will be skipped.", e.getMessage());
        }
        return List.of();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private HttpHeaders buildHeaders(String apiKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        return headers;
    }

    // ---- Response DTOs ----

    @Data
    public static class ChatResponse {
        private List<Choice> choices;

        @Data public static class Choice { private Message message; }
        @Data public static class Message { private String content; }
    }

    @Data
    public static class EmbedResponse {
        private List<EmbedData> data;

        @Data public static class EmbedData { private List<Double> embedding; }
    }
}
