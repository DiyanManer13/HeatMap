package com.heatbudget.config;

import jakarta.validation.constraints.NotBlank;
import java.util.Optional;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "heatbudget.aws")
public record AwsProperties(
        boolean enabled,
        @NotBlank String region,
        String snsTopicArn,
        String bedrockModelId,
        String secretsManagerSecretId
) {
    public Optional<String> snsTopicArnOptional() { return optionalValue(snsTopicArn); }
    public Optional<String> bedrockModelIdOptional() { return optionalValue(bedrockModelId); }
    public Optional<String> secretsManagerSecretIdOptional() { return optionalValue(secretsManagerSecretId); }

    private Optional<String> optionalValue(String value) {
        return value == null || value.isBlank() ? Optional.empty() : Optional.of(value);
    }
}
