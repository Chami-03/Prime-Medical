package com.primemedical.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum VisitType {
    CONSULTATION,
    FOLLOW_UP,
    REFILL,
    WALK_IN;

    @JsonCreator
    public static VisitType from(String value) {
        if (value == null) return null;
        String v = value.trim().toUpperCase().replace('-', '_').replace(' ', '_');
        // Map legacy/alternate names
        if ("REGULAR".equals(v)) {
            return CONSULTATION;
        }
        if ("EMERGENCY".equals(v)) {
            return WALK_IN;
        }
        // Accept common variants
        if ("FOLLOWUP".equals(v)) {
            return FOLLOW_UP;
        }
        if ("WALKIN".equals(v)) {
            return WALK_IN;
        }

        try {
            return VisitType.valueOf(v);
        } catch (IllegalArgumentException e) {
            // Let Jackson handle invalid values by throwing the same exception type
            throw new IllegalArgumentException("Unknown VisitType: " + value);
        }
    }
}
