package com.vietskin.backend_springboot.security;

import com.vietskin.backend_springboot.modules.users.entity.User;
import com.vietskin.backend_springboot.modules.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    // Gọi bằng userId (String) — khớp với JwtFilter
    @Override
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
        User user = userRepository.findById(Integer.valueOf(userId))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));

        return new org.springframework.security.core.userdetails.User(
                String.valueOf(user.getId()),
                user.getPasswordHash(),
                user.getActive(),
                true, true, true,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().getCode()))
        );
    }

    // Load bằng phone — dùng trong AuthService khi login
    public User loadUserEntityByPhone(String phone) {
        return userRepository.findByPhone(phone)
                .orElseThrow(() -> new UsernameNotFoundException("Số điện thoại không tồn tại"));
    }
}
