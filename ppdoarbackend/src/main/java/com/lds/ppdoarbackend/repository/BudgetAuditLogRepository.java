package com.lds.ppdoarbackend.repository;

import com.lds.ppdoarbackend.model.BudgetAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BudgetAuditLogRepository extends JpaRepository<BudgetAuditLog, Long> {
    List<BudgetAuditLog> findTop50ByProjectIdOrderByCreatedAtDesc(String projectId);
}
