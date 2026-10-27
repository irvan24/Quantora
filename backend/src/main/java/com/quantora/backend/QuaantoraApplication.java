package com.quantora.backend;

import com.quantora.backend.config.ApiSecurityProperties;
import com.quantora.backend.config.AuthCookieProperties;
import com.quantora.backend.config.CorsProperties;
import com.quantora.backend.config.JwtProperties;
import com.quantora.backend.config.MarketDataProperties;
import com.quantora.backend.config.PasswordResetProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties({
        JwtProperties.class,
        CorsProperties.class,
        ApiSecurityProperties.class,
        AuthCookieProperties.class,
        PasswordResetProperties.class,
        MarketDataProperties.class
})
public class QuaantoraApplication {

	public static void main(String[] args) {
		SpringApplication.run(QuaantoraApplication.class, args);
	}

}
