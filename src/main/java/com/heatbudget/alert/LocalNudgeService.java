package com.heatbudget.alert;

import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(prefix = "heatbudget.aws", name = "enabled", havingValue = "false", matchIfMissing = true)
public class LocalNudgeService implements NudgeService {
    @Override
    public NotificationResult sendRestNudge(RestNudge nudge) {
        return new NotificationResult("LOCAL_DEMO", UUID.randomUUID().toString(), false);
    }
}
