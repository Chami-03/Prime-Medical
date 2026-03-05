package com.medcenter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * PrimeMedical — Medical Center Management System ISP_G10 SLIIT 2026
 *
 * <p>Entry point for the Spring Boot application.
 */
@SpringBootApplication
@EnableScheduling
public class MedcenterApplication {

    public static void main(String[] args) {
        SpringApplication.run(MedcenterApplication.class, args);
    }
}
