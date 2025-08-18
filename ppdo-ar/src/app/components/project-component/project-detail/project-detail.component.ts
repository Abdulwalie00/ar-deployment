// app/components/project-component/project-detail/project-detail.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectConfirmationDialogComponent } from '../project-confirmation-dialog/project-confirmation-dialog.component';
import { ProjectDataService } from '../../../services/project-data.service';
import { Project, Comment } from '../../../models/project.model';
import { Observable, Subject, of } from 'rxjs';
import { switchMap, takeUntil, tap } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';
import { WebsocketService } from '../../../services/websocker.service';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PasswordVerificationDialogComponent } from '../../password-verification-dialog/password-verification-dialog.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ProjectConfirmationDialogComponent,
    FontAwesomeModule,
    PasswordVerificationDialogComponent
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css']
})
export class ProjectDetailComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('commentSection') private commentSection!: ElementRef;

  project$: Observable<Project | undefined>;
  currentProject: Project | undefined;
  comments: Comment[] = [];
  newComment = '';
  currentUser: User | null = null;

  showConfirmationDialog = false;
  dialogMessage = '';
  dialogAction: 'delete' | '' = '';

  showCarousel = false;
  currentImageIndex = 0;

  isBudgetVisible = false;
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  showPasswordDialog = false;
  // This will determine what to do after password is verified
  actionToPerformAfterVerification: 'viewBudget' | 'deleteProject' | null = null;

  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectDataService: ProjectDataService,
    private location: Location,
    private authService: AuthService,
    private userService: UserService,
    private websocketService: WebsocketService
  ) {
    this.project$ = of(undefined);
  }

  ngOnInit(): void {
    this.loadCurrentUser();

    this.project$ = this.route.paramMap.pipe(
      switchMap(params => {
        const projectId = params.get('id');
        if (projectId) {
          this.websocketService.connect(projectId);
          this.listenForNewComments();
          this.loadComments(projectId);
          return this.projectDataService.getProjectById(projectId);
        }
        return of(undefined);
      }),
      tap(project => {
        this.currentProject = project;
        if (!project) {
          this.router.navigate(['/project-list']);
        }
      }),
      takeUntil(this.destroy$)
    );
  }

  // --- Password and Action Handling ---

  toggleBudgetVisibility(): void {
    if (this.isBudgetVisible) {
      this.isBudgetVisible = false;
    } else {
      this.actionToPerformAfterVerification = 'viewBudget';
      this.showPasswordDialog = true;
    }
  }

  confirmDelete(): void {
    this.actionToPerformAfterVerification = 'deleteProject';
    this.showPasswordDialog = true;
  }

  onPasswordVerified(): void {
    this.showPasswordDialog = false;
    if (this.actionToPerformAfterVerification === 'viewBudget') {
      this.isBudgetVisible = true;
    } else if (this.actionToPerformAfterVerification === 'deleteProject') {
      if (!this.currentProject) return;
      this.dialogMessage = `Are you sure you want to delete project "${this.currentProject.title}"? This action cannot be undone.`;
      this.dialogAction = 'delete';
      this.showConfirmationDialog = true;
    }
    this.actionToPerformAfterVerification = null; // Reset action
  }

  onPasswordDialogClosed(): void {
    this.showPasswordDialog = false;
    this.actionToPerformAfterVerification = null; // Reset action
  }

  // Final deletion confirmation
  onConfirmation(confirmed: boolean): void {
    this.showConfirmationDialog = false;
    if (confirmed && this.dialogAction === 'delete' && this.currentProject) {
      this.projectDataService.deleteProject(this.currentProject.id).subscribe(() => {
        this.router.navigate(['/project-list']);
      });
    }
  }

  // --- Other Component Methods (no changes needed below) ---

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  listenForNewComments(): void {
    this.websocketService.comment$
      .pipe(takeUntil(this.destroy$))
      .subscribe(newComment => {
        if (newComment && !this.comments.some(c => c.id === newComment.id)) {
          this.comments.push(newComment);
          this.shouldScrollToBottom = true;
        }
      });
  }

  loadCurrentUser(): void {
    const username = this.authService.getUsername();
    if (username) {
      this.userService.getUserByUsername(username).pipe(takeUntil(this.destroy$)).subscribe(user => {
        this.currentUser = user;
      });
    }
  }

  loadComments(projectId: string): void {
    this.projectDataService.getComments(projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(comments => {
        this.comments = comments.sort((a, b) => new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime());
        this.shouldScrollToBottom = true;
      });
  }

  postComment(): void {
    if (!this.newComment.trim() || !this.currentProject) {
      return;
    }

    this.projectDataService.addComment(this.currentProject.id, this.newComment)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.newComment = '';
        },
        error: (err) => {
          console.error('Failed to post comment', err);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.websocketService.disconnect();
  }

  scrollToBottom(): void {
    try {
      this.commentSection.nativeElement.scrollTop = this.commentSection.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Could not scroll to bottom:', err);
    }
  }

  editProject(): void {
    if (this.currentProject) {
      this.router.navigate(['/project-edit', this.currentProject.id]);
    }
  }

  goBack(): void {
    this.location.back();
  }

  openCarousel(index: number): void {
    this.currentImageIndex = index;
    this.showCarousel = true;
  }

  closeCarousel(): void {
    this.showCarousel = false;
  }

  prevImage(): void {
    if (this.currentProject && this.currentProject.images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.currentProject.images.length) % this.currentProject.images.length;
    }
  }

  nextImage(): void {
    if (this.currentProject && this.currentProject.images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.currentProject.images.length;
    }
  }
}
