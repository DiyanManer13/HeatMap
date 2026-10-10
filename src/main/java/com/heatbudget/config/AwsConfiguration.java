package com.heatbudget.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.sns.SnsClient;

@Configuration
@ConditionalOnProperty(prefix = "heatbudget.aws", name = "enabled", havingValue = "true")
public class AwsConfiguration {
    private final AwsProperties properties;

    public AwsConfiguration(AwsProperties properties) {
        this.properties = properties;
    }

    @Bean(destroyMethod = "close")
    SnsClient snsClient() {
        return SnsClient.builder().region(Region.of(properties.region())).credentialsProvider(DefaultCredentialsProvider.create()).build();
    }

    @Bean(destroyMethod = "close")
    BedrockRuntimeClient bedrockRuntimeClient() {
        return BedrockRuntimeClient.builder().region(Region.of(properties.region())).credentialsProvider(DefaultCredentialsProvider.create()).build();
    }

    @Bean(destroyMethod = "close")
    SecretsManagerClient secretsManagerClient() {
        return SecretsManagerClient.builder().region(Region.of(properties.region())).credentialsProvider(DefaultCredentialsProvider.create()).build();
    }
}
