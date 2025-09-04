import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Notification } from '../../models/notification.model';
import { NotificationService } from '../../services/notification.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleDot } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-notification-page',
  standalone: true,
  imports: [CommonModule, DatePipe, FontAwesomeModule],
  templateUrl: './notification-page.component.html',
  styleUrls: ['./notification-page.component.css']
})
export class NotificationPageComponent implements OnInit, OnDestroy {
  faCircleDot = faCircleDot;

  allNotifications: Notification[] = [];
  isLoading = true;
  private notificationsSubscription!: Subscription;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.fetchNotifications();
  }

  ngOnDestroy(): void {
    if (this.notificationsSubscription) {
      this.notificationsSubscription.unsubscribe();
    }
  }

  fetchNotifications(): void {
    this.isLoading = true;
    this.notificationsSubscription = this.notificationService.getAllNotifications().subscribe({
      next: (notifications) => {
        // Sort notifications by date, with the newest first
        this.allNotifications = notifications.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch notifications:', err);
        this.isLoading = false;
      }
    });
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          // Update the notification in the local array
          const index = this.allNotifications.findIndex(n => n.id === notification.id);
          if (index !== -1) {
            this.allNotifications[index].isRead = true;
          }
          this.navigateToProject(notification.project.id);
        },
        error: (err) => {
          console.error('Failed to mark notification as read:', err);
          this.navigateToProject(notification.project.id);
        }
      });
    } else {
      this.navigateToProject(notification.project.id);
    }
  }

  private navigateToProject(projectId: string): void {
    this.router.navigate(['/project-detail', projectId]);
  }
}
