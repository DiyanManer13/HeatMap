package com.heatbudget.dispatch;

import com.heatbudget.config.DispatchProperties;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Service;

@Service
public class PauseCreditService {
    private final DispatchProperties properties;

    public PauseCreditService(DispatchProperties properties) {
        this.properties = properties;
    }

    public BigDecimal creditFor(BigDecimal deliveryFee) {
        return deliveryFee.multiply(BigDecimal.valueOf(properties.pauseCreditShare()))
                .setScale(2, RoundingMode.HALF_UP);
    }
}
