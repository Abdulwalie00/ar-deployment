package com.lds.ppdoarbackend.service;

import com.lds.ppdoarbackend.model.Notification;
import com.lds.ppdoarbackend.model.Project;
import com.lds.ppdoarbackend.model.User;
import com.lds.ppdoarbackend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public void createNotification(User user, Project project, String message) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setProject(project);
        notification.setMessage(message);
        notificationRepository.save(notification);
    }

    public List<Notification> getUnreadNotifications(User user) {
        return notificationRepository.findByUserIdAndIsRead(user.getId(), false);
    }

    public List<Notification> getAllNotifications(User user) {
        return notificationRepository.findByUserId(user.getId());
    }

    public void markAsRead(String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public void markProjectNotificationsAsRead(User user, String projectId) {
        List<Notification> notifications = notificationRepository.findByUserIdAndProjectIdAndIsRead(user.getId(), projectId, false);
        for (Notification notification : notifications) {
            notification.setRead(true);
        }
        notificationRepository.saveAll(notifications);
    }
}