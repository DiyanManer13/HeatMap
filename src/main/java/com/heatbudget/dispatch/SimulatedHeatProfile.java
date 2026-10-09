package com.heatbudget.dispatch;

import java.time.Instant;
import java.time.ZoneId;
import org.springframework.stereotype.Service;

@Service
public class SimulatedHeatProfile {
    private static final ZoneId PUNE_TIMEZONE = ZoneId.of("Asia/Kolkata");

    public double wbgtAt(Instant time) {
        int hour = time.atZone(PUNE_TIMEZONE).getHour();
        if (hour < 9 || hour >= 20) {
            return 25;
        }
        if (hour < 11 || hour >= 17) {
            return 29;
        }
        return 34;
    }
}
