package com.vietskin.backend_springboot.common.config;

import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    /**
     * Đăng ký Hibernate6Module để Jackson xử lý đúng lazy-loaded proxy.
     * - FORCE_LAZY_LOADING = false → serialize null thay vì trigger thêm query
     * - Tránh lỗi ByteBuddyInterceptor / hibernateLazyInitializer
     */
    @Bean
    public Hibernate6Module hibernate6Module() {
        Hibernate6Module module = new Hibernate6Module();
        module.enable(Hibernate6Module.Feature.FORCE_LAZY_LOADING);
        return module;
    }
}
