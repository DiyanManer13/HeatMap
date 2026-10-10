package com.heatbudget.aws;

import com.heatbudget.config.AwsProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;

@Service
@ConditionalOnBean(SecretsManagerClient.class)
public class AwsSecretReader {
    private final SecretsManagerClient secretsManagerClient;
    private final AwsProperties properties;

    public AwsSecretReader(SecretsManagerClient secretsManagerClient, AwsProperties properties) {
        this.secretsManagerClient = secretsManagerClient;
        this.properties = properties;
    }

    public String readConfiguredSecret() {
        String secretId = properties.secretsManagerSecretIdOptional()
                .orElseThrow(() -> new IllegalStateException("AWS_SECRET_ID is required to read a secret"));
        return secretsManagerClient.getSecretValue(GetSecretValueRequest.builder().secretId(secretId).build()).secretString();
    }
}
