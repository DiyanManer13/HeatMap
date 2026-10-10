package com.heatbudget.alert;

import com.heatbudget.config.AwsProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import software.amazon.awssdk.services.sns.model.PublishResponse;

@Service
@ConditionalOnProperty(prefix = "heatbudget.aws", name = "enabled", havingValue = "true")
public class AwsSnsNudgeService implements NudgeService {
    private final SnsClient snsClient;
    private final AwsProperties properties;

    public AwsSnsNudgeService(SnsClient snsClient, AwsProperties properties) {
        this.snsClient = snsClient;
        this.properties = properties;
    }

    @Override
    public NotificationResult sendRestNudge(RestNudge nudge) {
        PublishRequest.Builder request = PublishRequest.builder().message(nudge.message());
        properties.snsTopicArnOptional().ifPresentOrElse(request::topicArn, () -> request.phoneNumber(nudge.targetPhoneNumber()));
        PublishResponse response = snsClient.publish(request.build());
        return new NotificationResult("AWS_SNS", response.messageId(), true);
    }
}
