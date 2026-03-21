package com.hikebuddy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HikeBuddyApplication {

    public static void main(String[] args) {
        SpringApplication.run(HikeBuddyApplication.class, args);
    }
}
