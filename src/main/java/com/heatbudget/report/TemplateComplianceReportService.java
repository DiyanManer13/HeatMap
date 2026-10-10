package com.heatbudget.report;

import com.heatbudget.dispatch.DispatchComparisonSummary;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(prefix = "heatbudget.aws", name = "enabled", havingValue = "false", matchIfMissing = true)
public class TemplateComplianceReportService implements ComplianceReportService {
    @Override
    public String generate(DispatchComparisonSummary summary) {
        return "Pune simulation " + summary.seed() + ": HeatBudget completed " + summary.heatAware().completedOrders()
                + " orders, recorded " + summary.heatAware().ridersOverHeatLimit() + " riders over the heat limit, and paid "
                + summary.heatAware().pauseCredits() + " in simulated pause credits. This is decision support, not medical advice.";
    }
}
