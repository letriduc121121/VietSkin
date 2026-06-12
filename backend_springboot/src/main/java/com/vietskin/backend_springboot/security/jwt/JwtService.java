package com.vietskin.backend_springboot.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.refresh-secret}")
    private String refreshSecret;

    @Value("${jwt.access-token-expiry}")
    private long accessTokenExpiry;   // giây

    @Value("${jwt.refresh-token-expiry}")
    private long refreshTokenExpiry;  // giây

    private SecretKey getKey(String secretStr) {
        return Keys.hmacShaKeyFor(secretStr.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(Integer userId, String username, String roleCode) {
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claims(Map.of("username", username, "roleCode", roleCode))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiry * 1000))
                .signWith(getKey(secret))
                .compact();
    }

    public String generateRefreshToken(Integer userId, String username, String roleCode) {
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claims(Map.of("username", username, "roleCode", roleCode))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTokenExpiry * 1000))
                .signWith(getKey(refreshSecret))
                .compact();
    }

    public Claims parseAccessToken(String token) {
        return Jwts.parser()
                .verifyWith(getKey(secret))
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Claims parseRefreshToken(String token) {
        return Jwts.parser()
                .verifyWith(getKey(refreshSecret))
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenValid(String token) {
        try {
            parseAccessToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Integer getUserId(String token) {
        return Integer.valueOf(parseAccessToken(token).getSubject());
    }

    public String getRoleCode(String token) {
        return parseAccessToken(token).get("roleCode", String.class);
    }
}
