package com.heatbudget.dispatch;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.ObjectMapper;

class OpenStreetMapRestPointCatalogTests {
    private final OpenStreetMapRestPointCatalog catalog =
          new OpenStreetMapRestPointCatalog(RestClient.builder());

    @Test
    void parsesMappedDrinkingWaterAndParkAreasAsUnverifiedCandidates() throws Exception {
        var response = new ObjectMapper().readTree("""
                {"elements":[
                  {"type":"node","id":42,"lat":18.52,"lon":73.85,"tags":{"amenity":"drinking_water","name":"Public tap"}},
                  {"type":"way","id":99,"center":{"lat":18.53,"lon":73.86},"tags":{"leisure":"park"}},
                  {"type":"node","id":100,"lat":18.54,"lon":73.87,"tags":{"amenity":"cafe"}}
                ]}
                """);

        var points = catalog.parseElements(response);

        assertThat(points).hasSize(2);
        assertThat(points).extracting(RestPoint::category).containsExactly("Drinking water", "Park");
        assertThat(points).extracting(RestPoint::verified).containsOnly(false);
        assertThat(points.get(0).name()).isEqualTo("Public tap");
        assertThat(points.get(0).osmUrl()).isEqualTo("https://www.openstreetmap.org/node/42");
        assertThat(points.get(1).location().latitude()).isEqualTo(18.53);
    }
}
