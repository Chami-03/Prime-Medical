package com.medcenter;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashTest {
    @Test
    public void testHash() {
        System.out.println("HASH_START");
        System.out.println(new BCryptPasswordEncoder().encode("pharmacist123"));
        System.out.println("HASH_END");
    }
}
