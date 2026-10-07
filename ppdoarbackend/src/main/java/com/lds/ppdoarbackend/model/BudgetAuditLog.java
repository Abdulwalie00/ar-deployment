package com.lds.ppdoarbackend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;

/** One row per budget view, export, change, or password re-check. Never updated or deleted by the app. */
@Data
@Entity
@Table(name = "budget_audit_log", indexes = {
        @Index(name = "idx_budget_audit_project", columnList = "projectId"),
        @Index(name = "idx_budget_audit_created", columnList = "createdAt")
})
public class BudgetAuditLog {

    public enum Action {
        /** Viewed one project's budget. */
        VIEW,
        /** Loaded budgets for a printed report. */
        EXPORT,
        /** Set or changed a budget. */
        CHANGE,
        /** Re-entered password and unlocked budgets. */
        UNLOCK,
        /** Wrong password or too many attempts while unlocking. */
        UNLOCK_FAILED,
        /** Asked for a budget they are not allowed to see. */
        DENIED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String projectId;
    private String projectTitle;
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Action action;

    private Double oldValue;
    private Double newValue;

    @Column(length = 500)
    private String details;

    @Column(length = 64)
    private String ipAddress;

    private Date createdAt;
}
