// src/main/java/com/lds/ppdoarbackend/config/WebConfig.java
package com.lds.ppdoarbackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${upload.dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Get the absolute path to the upload directory
        String absoluteUploadDir = Paths.get(uploadDir).toFile().getAbsolutePath();

        // Map the URL path to the file system directory
        registry.addResourceHandler("/api/files/**")
                .addResourceLocations("file:/" + absoluteUploadDir + "/");
    }
}