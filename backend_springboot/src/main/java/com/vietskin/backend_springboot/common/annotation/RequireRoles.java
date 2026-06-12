package com.vietskin.backend_springboot.common.annotation;

import org.springframework.security.access.prepost.PreAuthorize;
import java.lang.annotation.*;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@PreAuthorize("hasAnyRole(#roles)")
public @interface RequireRoles {
    String[] value();
}
