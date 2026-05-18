package com.atomquest.modules.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Retrieval-Augmented Generation (RAG) service using pgvector.
 *
 * Use cases:
 * 1. HR Assistant: Answers goal policy questions by retrieving relevant HR knowledge base chunks.
 * 2. Semantic Goal Search: Finds semantically similar goals across the org.
 * 3. AI Performance Summary: Generates narrative summaries from achievement data.
 * 4. SMART Goal Suggestions: Refactors vague goals into SMART-compliant wording.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AIService {

    private static final String SMART_SYSTEM_PROMPT = """
            You are an expert HR performance management consultant. Transform vague or incomplete goal descriptions 
            into SMART goals: Specific, Measurable, Achievable, Relevant, and Time-bound. 
            Return ONLY the refined goal title and a one-line explanation of each SMART criterion.
            Format: "SMART Goal: [title]\\n- Specific: ...\\n- Measurable: ...\\n- Achievable: ...\\n- Relevant: ...\\n- Time-bound: ..."
            """;

    private static final String HR_SYSTEM_PROMPT = """
            You are an HR assistant for AtomQuest's Goal Setting portal. Answer questions strictly based on the 
            provided policy context. If the answer is not in the context, say "I don't have specific information 
            about that. Please contact HR directly." Be concise and professional.
            """;

    private static final String SUMMARY_SYSTEM_PROMPT = """
            You are a performance management analyst. Summarize the employee's quarterly achievements into a concise, 
            professional narrative (3-4 sentences). Highlight strengths, areas needing attention, and overall progress 
            trend. Use percentages and scores where available.
            """;

    private final OpenAIClient openAIClient;
    private final JdbcTemplate jdbcTemplate;

    // ===================== SMART Goal Suggestion =====================

    public String suggestSmartGoal(String draftTitle, String description) {
        String userMsg = "Draft goal: \"" + draftTitle + "\"\n" +
                (description != null && !description.isBlank() ? "Additional context: " + description : "");
        return openAIClient.chatCompletion(SMART_SYSTEM_PROMPT, userMsg);
    }

    // ===================== HR RAG Assistant =====================

    public String askHrAssistant(String question) {
        String context = retrieveHrContext(question);
        String userMsg = "Context:\n" + context + "\n\nQuestion: " + question;
        return openAIClient.chatCompletion(HR_SYSTEM_PROMPT, userMsg);
    }

    private String retrieveHrContext(String question) {
        List<Double> queryEmbedding = openAIClient.embed(question);
        if (queryEmbedding.isEmpty()) {
            // Fallback: return static policy summary
            return """
                    AtomQuest Goal Portal Rules:
                    - Total weightage across all goals must equal exactly 100%.
                    - Minimum weightage per individual goal: 10%.
                    - Maximum number of goals per employee per cycle: 8.
                    - Goals are locked after manager approval. Only admins can unlock them.
                    - Shared goals: recipients may only adjust weightage; title and target are read-only.
                    - Achievement updates by the primary owner auto-sync across all linked shared goal sheets.
                    """;
        }
        // pgvector cosine similarity search
        try {
            String vectorStr = queryEmbedding.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(",", "[", "]"));
            List<Map<String, Object>> results = jdbcTemplate.queryForList(
                    "SELECT title, content FROM hr_knowledge_base ORDER BY embedding <-> ?::vector LIMIT 3",
                    vectorStr
            );
            return results.stream()
                    .map(r -> "## " + r.get("title") + "\n" + r.get("content"))
                    .collect(Collectors.joining("\n\n"));
        } catch (Exception e) {
            log.warn("pgvector retrieval failed: {}", e.getMessage());
            return "Goal setting rules: total weightage must equal 100%, min 10% per goal, max 8 goals.";
        }
    }

    // ===================== Semantic Goal Search =====================

    public List<String> semanticSearchGoals(String query) {
        List<Double> queryEmbedding = openAIClient.embed(query);
        if (queryEmbedding.isEmpty()) {
            return List.of("Semantic search unavailable — AI key not configured.");
        }
        try {
            String vectorStr = queryEmbedding.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(",", "[", "]"));
            return jdbcTemplate.queryForList(
                    """
                    SELECT g.title FROM goals g
                    JOIN goal_embeddings ge ON g.id = ge.goal_id
                    ORDER BY ge.embedding <-> ?::vector
                    LIMIT 5
                    """,
                    String.class,
                    vectorStr
            );
        } catch (Exception e) {
            log.warn("Semantic goal search failed: {}", e.getMessage());
            return List.of();
        }
    }

    // ===================== Performance Summary =====================

    public String generatePerformanceSummary(List<Map<String, Object>> achievementData) {
        String data = achievementData.stream()
                .map(a -> "Goal: " + a.get("goalTitle") + " | Target: " + a.get("target") +
                        " | Actual: " + a.get("actual") + " | Score: " + a.get("score") + "%")
                .collect(Collectors.joining("\n"));
        return openAIClient.chatCompletion(SUMMARY_SYSTEM_PROMPT, "Achievement Data:\n" + data);
    }

    // ===================== Goal Embedding (Indexing) =====================

    public void indexGoalForSearch(String goalId, String goalText) {
        List<Double> embedding = openAIClient.embed(goalText);
        if (embedding.isEmpty()) return;

        String vectorStr = embedding.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(",", "[", "]"));
        try {
            jdbcTemplate.update(
                    "INSERT INTO goal_embeddings (goal_id, embedding) VALUES (?::uuid, ?::vector) ON CONFLICT (goal_id) DO UPDATE SET embedding = ?::vector",
                    goalId, vectorStr, vectorStr
            );
            log.debug("Goal {} indexed for semantic search", goalId);
        } catch (Exception e) {
            log.warn("Goal indexing failed for {}: {}", goalId, e.getMessage());
        }
    }
}
