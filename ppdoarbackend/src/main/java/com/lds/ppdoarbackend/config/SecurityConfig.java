// src/main/java/com/lds/ppdoarbackend/config/SecurityConfig.java

package com.lds.ppdoarbackend.config;

import com.lds.ppdoarbackend.security.JwtRequestFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
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
                        // Spring forwards errors to /error; it must not demand sign-in again,
                        // or every 403/404/428 would turn into a 401 and sign the user out.
                        .requestMatchers("/error").permitAll()
                        // WebSocket handshake (comments)
                        .requestMatchers("/ws/**").permitAll()
                        // Login is public; verify-password needs a signed-in user
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/auth/**").authenticated()
                        // Images are shown with plain <img> tags, so reading them stays public;
                        // uploading requires sign-in.
                        .requestMatchers(HttpMethod.GET, "/api/files/**").permitAll()
                        .requestMatchers("/api/files/**").authenticated()

                        // Allow preflight OPTIONS requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Only SUPERADMINs can manage accounts and offices
                        .requestMatchers("/api/manage-users/**").hasRole("SUPERADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/users").hasRole("SUPERADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/users", "/api/users/").hasRole("SUPERADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasRole("SUPERADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/divisions/**").hasRole("SUPERADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/divisions/**").hasRole("SUPERADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/divisions/**").hasRole("SUPERADMIN")

                        // Project data: any role, but office and budget rules are enforced
                        // per request in ProjectAccessService.
                        .requestMatchers("/api/projects/**").hasAnyRole("ADMIN", "SUPERADMIN", "USER")

                        // All other requests require authentication
                        .anyRequest().authenticated()
                )
                // Answer 401 (not 403) for missing/expired sign-in so the app can
                // send the user back to the login page.
                .exceptionHandling(ex -> ex.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                );

        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}