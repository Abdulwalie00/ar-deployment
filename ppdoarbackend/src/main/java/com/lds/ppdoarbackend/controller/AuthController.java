package com.lds.ppdoarbackend.controller;

import com.lds.ppdoarbackend.dto.LoginRequest;
import com.lds.ppdoarbackend.dto.LoginResponse;
import com.lds.ppdoarbackend.dto.PasswordVerificationRequest;
import com.lds.ppdoarbackend.model.BudgetAuditLog;
import com.lds.ppdoarbackend.security.ClientIp;
import com.lds.ppdoarbackend.security.JwtUtil;
import com.lds.ppdoarbackend.security.LoginAttemptService;
import com.lds.ppdoarbackend.service.BudgetAuditService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final String LOGIN = "login";
    private static final String VERIFY = "verify-password";

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private LoginAttemptService attempts;

    @Autowired
    private BudgetAuditService budgetAudit;

    @PostMapping("/login")
    public ResponseEntity<?> createAuthenticationToken(@RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        String username = loginRequest.getUsername() == null ? "" : loginRequest.getUsername().trim();
        String clientIp = ClientIp.of(request);

        long waitSeconds = attempts.secondsUntilAllowed(LOGIN, username, clientIp);
        if (waitSeconds > 0) {
            return tooManyAttempts(waitSeconds);
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, loginRequest.getPassword())
            );
        } catch (AuthenticationException e) {
            attempts.recordFailure(LOGIN, username, clientIp);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Incorrect username or password."));
        }

        attempts.recordSuccess(LOGIN, username, clientIp);
        final UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        final String jwt = jwtUtil.generateToken(userDetails);

        return ResponseEntity.ok(new LoginResponse(jwt));
    }

    /**
     * Re-checks the signed-in user's password. On success it returns a short-lived
     * budget token that the budget endpoints require (see ProjectBudgetController).
     */
    @PostMapping("/verify-password")
    public ResponseEntity<?> verifyPassword(@RequestBody PasswordVerificationRequest request, HttpServletRequest httpRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        String clientIp = ClientIp.of(httpRequest);

        long waitSeconds = attempts.secondsUntilAllowed(VERIFY, currentUsername, clientIp);
        if (waitSeconds > 0) {
            budgetAudit.record(BudgetAuditLog.Action.UNLOCK_FAILED, currentUsername, null, "Blocked: too many attempts");
            return tooManyAttempts(waitSeconds);
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(currentUsername);
        if (request.getPassword() == null || !passwordEncoder.matches(request.getPassword(), userDetails.getPassword())) {
            attempts.recordFailure(VERIFY, currentUsername, clientIp);
            budgetAudit.record(BudgetAuditLog.Action.UNLOCK_FAILED, currentUsername, null, "Wrong password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Incorrect password."));
        }

        attempts.recordSuccess(VERIFY, currentUsername, clientIp);
        budgetAudit.record(BudgetAuditLog.Action.UNLOCK, currentUsername, null, null);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(Map.of(
                        "budgetToken", jwtUtil.generateBudgetToken(currentUsername),
                        "expiresInSeconds", jwtUtil.getBudgetUnlockMillis() / 1000
                ));
    }

    private static ResponseEntity<?> tooManyAttempts(long waitSeconds) {
        long minutes = Math.max(1, (waitSeconds + 59) / 60);
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(waitSeconds))
                .body(Map.of(
                        "message", "Too many incorrect attempts. Please wait " + minutes + " minute" + (minutes == 1 ? "" : "s") + " and try again.",
                        "retryAfterSeconds", waitSeconds
                ));
    }
}
