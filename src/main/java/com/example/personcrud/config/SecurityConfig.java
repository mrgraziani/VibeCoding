package com.example.personcrud.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.util.Map;

/**
 * Enterprise Security Configuration:
 * - Public read-only access (GET /api/**) for immediate zero-friction onboarding
 * - Role-Based Access Control (RBAC) on mutation endpoints (POST, PUT, DELETE)
 * - Administrative isolation for diagnostic lab endpoints (/api/system/**)
 * - Pre-configured demo accounts (admin, teacher, student) for instantaneous evaluation
 * - Standardized JSON 401/403 error contracts matching GlobalExceptionHandler
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder encoder) {
        UserDetails admin = User.builder()
                .username("admin")
                .password(encoder.encode("admin123"))
                .roles("ADMIN", "TEACHER", "STUDENT")
                .build();

        UserDetails teacher = User.builder()
                .username("teacher")
                .password(encoder.encode("teacher123"))
                .roles("TEACHER", "STUDENT")
                .build();

        UserDetails student = User.builder()
                .username("student")
                .password(encoder.encode("student123"))
                .roles("STUDENT")
                .build();

        return new InMemoryUserDetailsManager(admin, teacher, student);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .authorizeHttpRequests(auth -> auth
                        // Public Read-Only Access across all business entities & Actuator probes
                        .requestMatchers(HttpMethod.GET, "/api/**").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        // System diagnostics & batch executions require ROLE_ADMIN
                        .requestMatchers("/api/system/**").hasRole("ADMIN")
                        // Mutation endpoints (POST, PUT, DELETE) require at least TEACHER or ADMIN
                        .requestMatchers(HttpMethod.POST, "/api/**").hasAnyRole("TEACHER", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/**").hasAnyRole("TEACHER", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/**").hasAnyRole("TEACHER", "ADMIN")
                        .anyRequest().authenticated()
                )
                .httpBasic(basic -> basic.authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    Map<String, Object> body = Map.of(
                            "error", "Unauthorized: Authentication required",
                            "status", 401
                    );
                    response.getWriter().write(objectMapper.writeValueAsString(body));
                }))
                .exceptionHandling(ex -> ex.accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    Map<String, Object> body = Map.of(
                            "error", "Forbidden: Insufficient privileges for this operation",
                            "status", 403
                    );
                    response.getWriter().write(objectMapper.writeValueAsString(body));
                }));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
