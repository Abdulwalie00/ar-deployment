package com.lds.ppdoarbackend.repository;

import com.lds.ppdoarbackend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByUserIdAndIsRead(Long userId, boolean isRead);
    List<Notification> findByUserId(Long userId);
    List<Notification> findByUserIdAndProjectIdAndIsRead(Long userId, String projectId, boolean isRead);
}