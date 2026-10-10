package com.heatbudget.report;

import com.heatbudget.dispatch.DispatchComparisonSummary;

public interface ComplianceReportService {
    String generate(DispatchComparisonSummary summary);
}
