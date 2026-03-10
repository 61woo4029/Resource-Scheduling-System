package com.selim.resourcemanagement.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("JwtTokenProvider 단위 테스트")
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    private static final String SECRET = "test-secret-key-for-unit-testing-only-must-be-long-enough";
    private static final long ACCESS_EXP = 3600000L;
    private static final long REFRESH_EXP = 604800000L;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(SECRET, ACCESS_EXP, REFRESH_EXP);
    }

    @Test
    @DisplayName("액세스 토큰 생성 및 이메일 추출")
    void generateAccessToken_extractEmail() {
        String token = jwtTokenProvider.generateAccessToken("user@test.com", "USER");

        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.getEmailFromToken(token)).isEqualTo("user@test.com");
    }

    @Test
    @DisplayName("액세스 토큰에서 역할(role) 추출")
    void generateAccessToken_extractRole() {
        String token = jwtTokenProvider.generateAccessToken("admin@test.com", "SYSTEM_ADMIN");

        assertThat(jwtTokenProvider.getRoleFromToken(token)).isEqualTo("SYSTEM_ADMIN");
    }

    @Test
    @DisplayName("리프레시 토큰 생성 및 유효성 검증")
    void generateRefreshToken_isValid() {
        String token = jwtTokenProvider.generateRefreshToken("user@test.com");

        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getEmailFromToken(token)).isEqualTo("user@test.com");
    }

    @Test
    @DisplayName("만료된 토큰은 유효하지 않음")
    void expiredToken_isInvalid() {
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider(SECRET, 1L, 1L);
        String token = shortLivedProvider.generateAccessToken("user@test.com", "USER");

        try { Thread.sleep(10); } catch (InterruptedException ignored) {}

        assertThat(shortLivedProvider.validateToken(token)).isFalse();
    }

    @Test
    @DisplayName("위조된 토큰은 유효하지 않음")
    void tamperedToken_isInvalid() {
        String token = jwtTokenProvider.generateAccessToken("user@test.com", "USER");
        String tampered = token.substring(0, token.length() - 5) + "xxxxx";

        assertThat(jwtTokenProvider.validateToken(tampered)).isFalse();
    }

    @Test
    @DisplayName("빈 문자열 토큰은 유효하지 않음")
    void emptyToken_isInvalid() {
        assertThat(jwtTokenProvider.validateToken("")).isFalse();
        assertThat(jwtTokenProvider.validateToken(null)).isFalse();
    }
}
