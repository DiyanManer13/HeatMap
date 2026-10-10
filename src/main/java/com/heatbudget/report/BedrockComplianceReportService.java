package com.heatbudget.report;

import com.heatbudget.config.AwsProperties;
import com.heatbudget.dispatch.DispatchComparisonSummary;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.ContentBlock;
import software.amazon.awssdk.services.bedrockruntime.model.ConversationRole;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InferenceConfiguration;
import software.amazon.awssdk.services.bedrockruntime.model.Message;

@Service
@ConditionalOnProperty(prefix = "heatbudget.aws", name = "enabled", havingValue = "true")
public class BedrockComplianceReportService implements ComplianceReportService {
    private final BedrockRuntimeClient bedrockClient;
    private final AwsProperties properties;

    public BedrockComplianceReportService(BedrockRuntimeClient bedrockClient, AwsProperties properties) {
        this.bedrockClient = bedrockClient;
        this.properties = properties;
    }

    @Override
    public String generate(DispatchComparisonSummary summary) {
        String modelId = properties.bedrockModelIdOptional()
                .orElseThrow(() -> new IllegalStateException("AWS_BEDROCK_MODEL_ID is required for Bedrock reports"));
        String prompt = "Write a concise, plain-language compliance report in English. Do not give medical advice. "
                + "Simulation seed: " + summary.seed() + ". Baseline metrics: " + summary.baseline()
                + ". HeatBudget metrics: " + summary.heatAware() + ".";
        Message message = Message.builder().role(ConversationRole.USER).content(ContentBlock.fromText(prompt)).build();
        return bedrockClient.converse(ConverseRequest.builder()
                        .modelId(modelId)
                        .messages(List.of(message))
                        .inferenceConfig(InferenceConfiguration.builder().maxTokens(400).temperature(0.2F).build())
                        .build())
                .output().message().content().stream().map(ContentBlock::text).filter(text -> text != null).findFirst()
                .orElseThrow(() -> new IllegalStateException("Bedrock returned no report text"));
    }
}
