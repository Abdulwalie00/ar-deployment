package com.lds.ppdoarbackend.service;

import com.lds.ppdoarbackend.model.BudgetAuditLog;
import com.lds.ppdoarbackend.model.Project;
import com.lds.ppdoarbackend.repository.BudgetAuditLogRepository;
import com.lds.ppdoarbackend.security.ClientIp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

/** Records who viewed, exported or changed budget figures, and when. */
@Service
public class BudgetAuditService {

    private static final Logger log = LoggerFactory.getLogger(BudgetAuditService.class);

    @Autowired
    private BudgetAuditLogRepository repository;

    public void record(BudgetAuditLog.Action action, String username, Project project,
                       Double oldValue, Double newValue, String details) {
        BudgetAuditLog entry = new BudgetAuditLog();
        entry.setAction(action);
        entry.setUsername(username);
        if (project != null) {
            entry.setProjectId(project.getId());
            entry.setProjectTitle(project.getTitle());
        }
        entry.setOldValue(oldValue);
        entry.setNewValue(newValue);
        entry.setDetails(details);
        entry.setIpAddress(ClientIp.current());
        entry.setCreatedAt(new Date());
        try {
            repository.save(entry);
        } catch (RuntimeException e) {
            // Losing an audit row must not break the user's request, but it must be visible.
            log.error("Could not write budget audit entry {} for {}", action, username, e);
        }
    }

    public void record(BudgetAuditLog.Action action, String username, Project project, String details) {
        record(action, username, project, null, null, details);
    }

    public List<BudgetAuditLog> historyFor(String projectId) {
        return repository.findTop50ByProjectIdOrderByCreatedAtDesc(projectId);
    }
}
