package com.atomquest.shared.enums;

public enum UomType {
    NUMERIC_MIN,    // Higher is better (e.g., Revenue) — Achievement ÷ Target
    NUMERIC_MAX,    // Lower is better (e.g., TAT, Cost) — Target ÷ Achievement
    PERCENTAGE,     // Direct percentage tracking
    TIMELINE,       // Date-based completion
    ZERO_BASED      // Zero = Success (e.g., Safety incidents)
}
