package com.vietskin.backend_springboot.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import org.springframework.cache.Cache;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
@Slf4j
public class CacheConfig implements CachingConfigurer {

    @Bean
    public RedisCacheConfiguration cacheConfiguration(ObjectMapper objectMapper) {
        // Cấu hình ObjectMapper để lưu thông tin kiểu dữ liệu (class type) vào JSON
        ObjectMapper cacheObjectMapper = objectMapper.copy();
        cacheObjectMapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );

        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(60)) // TTL mặc định là 60 phút
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer(cacheObjectMapper)));
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory, RedisCacheConfiguration cacheConfiguration) {
        // TTL riêng cho các cache dữ liệu động — phần còn lại dùng mặc định 60 phút
        Map<String, RedisCacheConfiguration> perCacheTtl = new HashMap<>();
        perCacheTtl.put("doctor_slots",      cacheConfiguration.entryTtl(Duration.ofSeconds(60)));  // slot trống đổi liên tục
        perCacheTtl.put("appointments_list", cacheConfiguration.entryTtl(Duration.ofSeconds(30)));  // danh sách lịch hẹn lễ tân — biến động mạnh
        perCacheTtl.put("patient_stats", cacheConfiguration.entryTtl(Duration.ofMinutes(10)));  // dashboard, không cần realtime
        perCacheTtl.put("service_stats", cacheConfiguration.entryTtl(Duration.ofMinutes(10)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(cacheConfiguration)
                .withInitialCacheConfigurations(perCacheTtl)
                .build();
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                log.error("Redis Cache GET thất bại (Redis có thể đã sập): {}", exception.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
                log.error("Redis Cache PUT thất bại (Redis có thể đã sập): {}", exception.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                log.error("Redis Cache EVICT thất bại (Redis có thể đã sập): {}", exception.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                log.error("Redis Cache CLEAR thất bại (Redis có thể đã sập): {}", exception.getMessage());
            }
        };
    }
}
