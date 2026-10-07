package com.lds.ppdoarbackend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class JwtUtil {

    /** Claim that marks a short-lived token which only unlocks budget figures. */
    public static final String SCOPE_CLAIM = "scope";
    public static final String BUDGET_SCOPE = "budget-access";

    // No default on purpose: the secret must come from the environment (.env / JWT_SECRET),
    // never from source control.
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-minutes:120}")
    private long sessionMinutes;

    @Value("${budget.unlock-minutes:10}")
    private long budgetUnlockMinutes;

    private SecretKey signingKey;

    @PostConstruct
    void init() {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "jwt.secret (JWT_SECRET) is missing or shorter than 32 bytes. " +
                    "Set a long random value in the environment or .env file.");
        }
        signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    private SecretKey getSigningKey() {
        return signingKey;
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(UserDetails userDetails) {
        // Extract simple role strings
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .claim("roles", roles) // Store as simple strings
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + sessionMinutes * 60_000))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Issues a token proving the user re-entered their password a moment ago.
     * It is accepted only by the budget endpoints, and only for a few minutes.
     */
    public String generateBudgetToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .claim(SCOPE_CLAIM, BUDGET_SCOPE)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + getBudgetUnlockMillis()))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public long getBudgetUnlockMillis() {
        return budgetUnlockMinutes * 60_000;
    }

    /** True only for an unexpired budget token issued to this user. */
    public boolean isValidBudgetToken(String token, String username) {
        if (token == null || token.isBlank() || username == null) {
            return false;
        }
        try {
            Claims claims = extractAllClaims(token);
            return BUDGET_SCOPE.equals(claims.get(SCOPE_CLAIM, String.class))
                    && username.equals(claims.getSubject())
                    && claims.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /** Validates a normal sign-in token. Budget tokens are rejected here so they cannot be used to log in. */
    public Boolean validateToken(String token, UserDetails userDetails) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.get(SCOPE_CLAIM) == null
                    && userDetails.getUsername().equals(claims.getSubject())
                    && !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
