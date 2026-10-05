import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User, roleLabel } from '../../models/user.model';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { AppColorTheme, ThemeService } from '../../services/theme.service';
import { ToastService } from '../../services/toast.service';

interface ThemeChoice {
  key: AppColorTheme;
  label: string;
  primary: string;
  accent: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileForm: FormGroup;
  editMode = false;
  isSaving = false;
  showPassword = false;
  successMessage: string | null = null;
  initials: string = '';
  avatarColor: string = '#000000';
  selectedColorTheme: AppColorTheme = 'green';
  colorChoices: ThemeChoice[] = [
    { key: 'yellow', label: 'Yellow', primary: '#b7791f', accent: '#f6e05e' },
    { key: 'red', label: 'Red', primary: '#b4232f', accent: '#f97373' },
    { key: 'blue', label: 'Blue', primary: '#1d4ed8', accent: '#38bdf8' },
    { key: 'orange', label: 'Orange', primary: '#c2410c', accent: '#fb923c' },
    { key: 'green', label: 'Green', primary: '#136f63', accent: '#34d399' },
    { key: 'purple', label: 'Purple', primary: '#7e22ce', accent: '#c084fc' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private themeService: ThemeService,
    private toast: ToastService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.pattern(/^\S+$/)]],
      password: [''],
      confirmPassword: ['']
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.themeService.applySavedPreferences();
    this.selectedColorTheme = this.themeService.getColorTheme();

    const token = this.authService.getToken();
    if (token) {
      try {
        const decodedToken: { sub: string } = jwtDecode(token);
        const username = decodedToken.sub;

        this.userService.getUserByUsername(username).subscribe({
          next: (userData) => {
            this.user = userData;
            this.profileForm.patchValue(userData);
            this.createAvatar();
          },
          error: (err) => {
            console.error('Failed to fetch user profile', err);
            this.authService.logout();
          }
        });
      } catch (error) {
        console.error('Invalid token:', error);
        this.authService.logout();
      }
    }
  }

  setColorTheme(theme: AppColorTheme): void {
    this.selectedColorTheme = theme;
    this.themeService.setColorTheme(theme);
  }

  isThemeSelected(theme: AppColorTheme): boolean {
    return this.selectedColorTheme === theme;
  }

  createAvatar() {
    if (this.user) {
      this.initials = (this.user.firstName.charAt(0) + this.user.lastName.charAt(0)).toUpperCase();
      this.avatarColor = this.generateColor(this.user.username);
    }
  }

  generateColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    this.showPassword = false;
    if (!this.editMode && this.user) {
      this.profileForm.patchValue(this.user);
      this.profileForm.get('password')?.reset('');
      this.profileForm.get('confirmPassword')?.reset('');
    }
  }

  onSubmit() {
    if (this.profileForm.invalid || !this.user) {
      this.profileForm.markAllAsTouched();
      this.toast.warning(
        'Please check your details',
        this.profileForm.hasError('mismatch') ? 'The two passwords do not match.' : 'Some fields need your attention.'
      );
      return;
    }

    const formValues = this.profileForm.value;
    const usernameChanged = formValues.username.trim() !== this.user.username;
    const updatedUser: any = {
      ...this.user,
      firstName: formValues.firstName.trim(),
      lastName: formValues.lastName.trim(),
      email: formValues.email.trim(),
      username: formValues.username.trim(),
      divisionId: this.user.division?.id
    };

    if (formValues.password) {
      updatedUser.password = formValues.password;
    }

    this.isSaving = true;
    this.userService.updateUser(this.user.id, updatedUser).subscribe({
      next: (response) => {
        this.isSaving = false;

        // The sign-in token is tied to the old username, so a new
        // username (or password) requires signing in again.
        if (usernameChanged) {
          this.toast.success('Profile updated', 'Your username changed. Please sign in with your new username.');
          this.authService.logout();
          this.router.navigate(['/login']);
          return;
        }

        this.user = response;
        this.profileForm.patchValue(response);
        this.profileForm.get('password')?.reset('');
        this.profileForm.get('confirmPassword')?.reset('');
        this.createAvatar();
        this.editMode = false;
        this.userService.profileUpdated$.next(response);
        this.toast.success('Profile updated', formValues.password ? 'Your new password is now active.' : undefined);
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Failed to update user', err);
        this.toast.error(
          'Your profile could not be saved',
          err?.status >= 500 ? 'That username or email may already be used by another account.' : err
        );
      }
    });
  }

  roleName(): string {
    return roleLabel(this.user?.role);
  }

  fieldInvalid(name: string): boolean {
    const control = this.profileForm.get(name);
    return !!control && control.invalid && control.touched;
  }
}
