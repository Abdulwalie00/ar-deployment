// src/main/java/com/lds/ppdoarbackend/config/SecurityConfig.java

package com.lds.ppdoarbackend.config;

import com.lds.ppdoarbackend.security.JwtRequestFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Enable @PreAuthorize, @Secured, etc.
public class SecurityConfig {

    @Autowired
    private JwtRequestFilter jwtRequestFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // *** ADD THIS LINE TO ALLOW WEBSOCKET CONNECTIONS ***
                        .requestMatchers("/ws/**").permitAll()
                        // Allow public auth routes
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/files/**").permitAll()
                        .requestMatchers("/api/project-categories/**").permitAll()

                        // Allow users to access their own profile
                        .requestMatchers(HttpMethod.GET, "/api/users/username/**").authenticated()

                        .requestMatchers(HttpMethod.GET, "/api/notifications/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/notifications/**").authenticated()

                        // Allow preflight OPTIONS requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Only SUPERADMINs can access user management endpoints
                        .requestMatchers("/api/manage-users/**").hasRole("SUPERADMIN")

                        // Only ADMINS and SUPERADMINS can access project endpoints
                        .requestMatchers( "/api/projects/**").hasAnyRole("ADMIN", "SUPERADMIN", "USER")

                        // Allow authenticated users to comment
                        .requestMatchers("/api/projects/{projectId}/comments/**").authenticated()


                        // All other requests require authentication
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                );

        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}