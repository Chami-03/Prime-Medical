package com.primemedical.service;

import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.primemedical.dto.request.LoginRequest;
import com.primemedical.dto.response.LoginResponse;
import com.primemedical.entity.User;
import com.primemedical.exception.BadRequestException;
import com.primemedical.exception.ResourceNotFoundException;
import com.primemedical.repository.UserRepository;
import com.primemedical.security.JwtUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    /** Authenticate user and return JWT tokens. */
    public LoginResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        String password = request.getPassword() == null ? "" : request.getPassword().trim();

        if (normalizedEmail.isBlank()) {
            throw new BadRequestException("Email is required");
        }

        if (password.isBlank()) {
            throw new BadRequestException("Password is required");
        }

        Authentication authentication;
        try {
            authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    normalizedEmail, request.getPassword()));
        } catch (AuthenticationException ex) {
            throw new BadRequestException("Invalid email or password");
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user =
                userRepository
                        .findByEmail(normalizedEmail)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "User", "email", normalizedEmail));

        String accessToken = jwtUtil.generateAccessToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails.getUsername());

        log.info("User logged in: {}", user.getEmail());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFirstName() + " " + user.getLastName())
                .roles(
                        user.getRoles().stream()
                                .map(role -> role.getName().name())
                                .collect(Collectors.toList()))
                .build();
    }

        private String normalizeEmail(String email) {
                return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        }

    /** Refresh access token using a valid refresh token. */
    public LoginResponse refreshToken(String refreshToken) {
        if (!jwtUtil.isTokenValid(refreshToken)) {
            throw new BadRequestException("Invalid or expired refresh token");
        }

        String email = jwtUtil.extractUsername(refreshToken);
        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        UserDetails userDetails =
                org.springframework.security.core.userdetails.User.builder()
                        .username(user.getEmail())
                        .password(user.getPasswordHash())
                        .authorities(
                                user.getRoles().stream()
                                        .map(role -> "ROLE_" + role.getName().name())
                                        .toArray(String[]::new))
                        .build();

        String newAccessToken = jwtUtil.generateAccessToken(userDetails);
        String newRefreshToken = jwtUtil.generateRefreshToken(email);

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFirstName() + " " + user.getLastName())
                .roles(
                        user.getRoles().stream()
                                .map(role -> role.getName().name())
                                .collect(Collectors.toList()))
                .build();
    }

    /** Generate a password-reset token and email it to the user. */
    public void forgotPassword(String email) {
        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        // Generate a short-lived reset token (reuse JWT with 30-min expiry)
        String resetToken = jwtUtil.generateRefreshToken(email);
        String resetLink = "http://localhost:5173/reset-password?token=" + resetToken;

        emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
        log.info("Password reset email sent to: {}", email);
    }

    /** Reset a user's password using a valid reset token. */
    @Transactional
    public void resetPassword(String token, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new BadRequestException("Passwords do not match");
        }

        if (!jwtUtil.isTokenValid(token)) {
            throw new BadRequestException("Invalid or expired reset token");
        }

        String email = jwtUtil.extractUsername(token);
        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("Password reset successful for: {}", email);
    }
}
