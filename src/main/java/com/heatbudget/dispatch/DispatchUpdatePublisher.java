package com.heatbudget.dispatch;

import java.io.IOException;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class DispatchUpdatePublisher {
    private static final long STREAM_TIMEOUT_MILLIS = 10 * 60 * 1000L;
    private final ConcurrentMap<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe() {
        String subscriberId = UUID.randomUUID().toString();
        SseEmitter emitter = new SseEmitter(STREAM_TIMEOUT_MILLIS);
        emitters.put(subscriberId, emitter);
        emitter.onCompletion(() -> emitters.remove(subscriberId));
        emitter.onTimeout(() -> emitters.remove(subscriberId));
        send(emitter, "connected", new StreamStatus("CONNECTED", Instant.now()));
        return emitter;
    }

    public void publish(DispatchComparison comparison) {
        DispatchComparisonSummary summary = DispatchComparisonSummary.from(comparison, Instant.now());
        emitters.forEach((subscriberId, emitter) -> {
            if (!send(emitter, "dispatch-comparison", summary)) {
                emitters.remove(subscriberId);
            }
        });
    }

    private boolean send(SseEmitter emitter, String eventName, Object payload) {
        try {
            emitter.send(SseEmitter.event().name(eventName).data(payload));
            return true;
        } catch (IOException exception) {
            emitter.completeWithError(exception);
            return false;
        }
    }

    private record StreamStatus(String status, Instant connectedAt) {
    }
}
