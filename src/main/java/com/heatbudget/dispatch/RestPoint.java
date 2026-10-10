package com.heatbudget.dispatch;

import com.heatbudget.sim.PuneLocation;

public record RestPoint(String id, String name, PuneLocation location, String category, String osmUrl,
						boolean verified) {
}
