import { Project } from './project.model';
import { User } from './user.model';

export interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  dateCreated: Date;
  user: User;
  project: Project;
}
