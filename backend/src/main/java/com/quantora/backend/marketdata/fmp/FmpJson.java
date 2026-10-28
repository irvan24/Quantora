package com.quantora.backend.marketdata.fmp;

import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;

final class FmpJson {

    private FmpJson() {
    }

    static String text(JsonNode node, String... keys) {
        for (String key : keys) {
            JsonNode value = node.path(key);
            if (value.isMissingNode() || value.isNull()) {
                continue;
            }
            String text = value.asString("").trim();
            if (!text.isEmpty() && !"null".equalsIgnoreCase(text)) {
                return text;
            }
        }
        return null;
    }

    static boolean bool(JsonNode node, String key) {
        JsonNode value = node.path(key);
        if (value.isMissingNode() || value.isNull()) {
            return false;
        }
        if (value.isBoolean()) {
            return value.asBoolean();
        }
        return "true".equalsIgnoreCase(value.asString(""));
    }

    static BigDecimal decimal(JsonNode node, String... keys) {
        for (String key : keys) {
            JsonNode value = node.path(key);
            if (value.isMissingNode() || value.isNull()) {
                continue;
            }
            if (value.isNumber()) {
                return value.decimalValue();
            }
            String text = value.asString("").trim().replace("%", "");
            if (text.isEmpty() || "null".equalsIgnoreCase(text)) {
                continue;
            }
            try {
                return new BigDecimal(text);
            } catch (NumberFormatException ignored) {
                // try next alias
            }
        }
        return null;
    }

    static Integer integer(JsonNode node, String... keys) {
        for (String key : keys) {
            JsonNode value = node.path(key);
            if (value.isMissingNode() || value.isNull()) {
                continue;
            }
            if (value.isNumber()) {
                return value.asInt();
            }
            String digits = value.asString("").replaceAll("[^0-9]", "");
            if (digits.isEmpty()) {
                continue;
            }
            try {
                return Integer.parseInt(digits);
            } catch (NumberFormatException ignored) {
                // try next alias
            }
        }
        return null;
    }
}
