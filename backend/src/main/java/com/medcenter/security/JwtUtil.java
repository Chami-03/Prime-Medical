package com.medcenter.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

/**
 * JWT utility for token generation, parsing, and validation. Uses HMAC-SHA256 with the JWT_SECRET
 * environment variable.
 */
@Component
public class JwtUtil {

    private final SecretKey signingKey;

    /** Access token lifetime — 15 minutes */
    private static final long ACCESS_TOKEN_EXPIRATION_MS = 15 * 60 * 1000L;

    /** Refresh token lifetime — 7 days */
    private static final long REFRESH_TOKEN_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000L;

    public JwtUtil(@Value("${app.jwt.secret}") String jwtSecret) {
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    // ── Token Generation ─────────────────────────────────────────

    /** Generate an access token (15-minute expiry) that includes the user's roles. */
    public String generateAccessToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        String roles =
                userDetails.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.joining(","));
        claims.put("roles", roles);
        claims.put("type", "ACCESS");

        return buildToken(claims, userDetails.getUsername(), ACCESS_TOKEN_EXPIRATION_MS);
    }

    /** Generate a refresh token (7-day expiry) using just the user's email. */
    public String generateRefreshToken(String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "REFRESH");

        return buildToken(claims, email, REFRESH_TOKEN_EXPIRATION_MS);
    }

    private String buildToken(Map<String, Object> extraClaims, String subject, long expirationMs) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(subject)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expirationMs))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    // ── Token Parsing ────────────────────────────────────────────

    /** Extract the username (email) from a JWT token. */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /** Extract the expiration date from a JWT token. */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /** Generic claim extractor. */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // ── Token Validation ─────────────────────────────────────────

    /** Check whether the token is structurally valid and not expired. */
    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /** Validate an access token against a specific UserDetails. */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}
