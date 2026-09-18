package com.quantora.backend;

import com.quantora.backend.config.CorsProperties;
import com.quantora.backend.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({JwtProperties.class, CorsProperties.class})
public class QuaantoraApplication {

	public static void main(String[] args) {
		SpringApplication.run(QuaantoraApplication.class, args);
	}

}
