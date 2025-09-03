package com.lds.ppdoarbackend.service;

import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

@Service
public class OllamaService {

public String generateNarrative(String prompt) {
    try {
        URL url = new URL("http://localhost:11434/api/generate");
        // URL url = new URL("http://ollama:11434/api/generate");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);

        String jsonInput = String.format("{\"model\":\"deepseek-r1:1.5b\",\"prompt\":%s}", 
            new ObjectMapper().writeValueAsString(prompt));
        conn.getOutputStream().write(jsonInput.getBytes());

        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        String line;
        StringBuilder fullResponse = new StringBuilder();
        ObjectMapper mapper = new ObjectMapper();
        while ((line = reader.readLine()) != null) {
            JsonNode node = mapper.readTree(line);
            if (node.has("response")) {
                fullResponse.append(node.get("response").asText());
            }
        }
        reader.close();
        conn.disconnect();
        return fullResponse.toString().trim();
    } catch (Exception e) {
        e.printStackTrace();
        return "";
    }
}

}