package com.lds.ppdoarbackend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Allow same origin since frontend is now served from backend
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:8080")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
                
        registry.addMapping("/ws/**")
                .allowedOrigins("http://localhost:8080")
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}