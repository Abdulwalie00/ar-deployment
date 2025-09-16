// src/main/java/com/lds/ppdoarbackend/config/WebConfig.java
package com.lds.ppdoarbackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${upload.dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Get the absolute path to the upload directory
        String absoluteUploadDir = Paths.get(uploadDir).toFile().getAbsolutePath();

        // Map the URL path to the file system directory for uploaded files
        registry.addResourceHandler("/api/files/**")
                .addResourceLocations("file:./uploads/");

        // Add this new configuration to serve the Angular app's static files.
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);
                        return requestedResource.exists() && requestedResource.isReadable() ? requestedResource
                                : new ClassPathResource("/static/index.html");
                    }
                });
        // Serve static resources from the frontend build (Angular files)
        registry.addResourceHandler("/browser/**", "/assets/**","/tests/**", "/images/**","/*.js", "/*.css", "/*.ico",
                        "/*.png", "/*.jpg", "/*.jpeg", "/*.gif", "/*.svg",
                        "/*.woff", "/*.woff2", "/*.ttf", "/*.eot", "/assets/logos/**")
                .addResourceLocations("classpath:/static/browser/", "classpath:/static/assets/")
                .resourceChain(true);
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Forward all relevant frontend routes to index.html for the SPA
        registry.addViewController("/")
                .setViewName("forward:/browser/index.html");
        registry.addViewController("/{path:[^\\.]*}")
                .setViewName("forward:/browser/index.html");
        registry.addViewController("/**/{path:[^\\.]*}")
                .setViewName("forward:/browser/index.html");
    }
}