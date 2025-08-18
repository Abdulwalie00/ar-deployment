package com.lds.ppdoarbackend.controller;

import com.lds.ppdoarbackend.dto.LoginRequest;
import com.lds.ppdoarbackend.dto.LoginResponse;
import com.lds.ppdoarbackend.dto.PasswordVerificationRequest;
import com.lds.ppdoarbackend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public LoginResponse createAuthenticationToken(@RequestBody LoginRequest loginRequest) throws Exception {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        final UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getUsername());
        final String jwt = jwtUtil.generateToken(userDetails);

        return new LoginResponse(jwt);
    }

    @PostMapping("/verify-password")
    public ResponseEntity<?> verifyPassword(@RequestBody PasswordVerificationRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        UserDetails userDetails = userDetailsService.loadUserByUsername(currentUsername);

        if (passwordEncoder.matches(request.getPassword(), userDetails.getPassword())) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.status(401).body("Incorrect password");
        }
    }
}