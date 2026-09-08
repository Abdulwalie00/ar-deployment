package com.lds.ppdoarbackend.config;

public class AppConstants {
    public static final String OLLAMA_API_URL = "http://ollama:11434/api/generate";
    // "http://ollama:11434/api/generate";

    public static final String OLLAMA_MODEL = "tinyllama";

    public static final String BACKEND_API_URL =  "http://localhost:1000/api/";

    public static final String FRONTEND_API_URL =  "http://localhost:4200";

    // Allow localhost and common private-network ranges so the UI works via machine IP.
    public static final String[] FRONTEND_ALLOWED_ORIGIN_PATTERNS = {
            "http://localhost:*",
            "http://127.0.0.1:*",
            "http://192.168.*:*",
            "http://10.*:*",
            "http://172.16.*:*",
            "http://172.17.*:*",
            "http://172.18.*:*",
            "http://172.19.*:*",
            "http://172.20.*:*",
            "http://172.21.*:*",
            "http://172.22.*:*",
            "http://172.23.*:*",
            "http://172.24.*:*",
            "http://172.25.*:*",
            "http://172.26.*:*",
            "http://172.27.*:*",
            "http://172.28.*:*",
            "http://172.29.*:*",
            "http://172.30.*:*",
            "http://172.31.*:*"
    };
    
    // Add other constants here
}