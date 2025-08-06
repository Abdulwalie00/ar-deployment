import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { jwtDecode } from 'jwt-decode';

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
  successMessage: string | null = null;
  initials: string = '';
  avatarColor: string = '#000000';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService
  ) {
    this.profileForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      email: [''],
      username: [''],
      password: [''],
      confirmPassword: ['']
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit() {
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
    if (!this.editMode && this.user) {
      this.profileForm.patchValue(this.user);
      this.profileForm.get('password')?.reset('');
      this.profileForm.get('confirmPassword')?.reset('');
    }
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      // Form is invalid, likely due to password mismatch
      console.error('Password mismatch');
      return;
    }
    if (this.profileForm.valid && this.user) {
      const formValues = this.profileForm.value;
      const updatedUser: any = {
        ...this.user,
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        email: formValues.email,
        username: formValues.username
      };

      if (formValues.password) {
        updatedUser.password = formValues.password;
      }

      this.userService.updateUser(this.user.id, updatedUser).subscribe({
        next: (response) => {
          this.user = response;
          this.profileForm.patchValue(response);
          this.createAvatar();
          this.editMode = false;
          this.successMessage = 'Profile updated successfully!';
          setTimeout(() => {
            this.successMessage = null;
            window.location.reload();
          }, 1000);
        },
        error: (err) => {
          console.error('Failed to update user', err);
        }
      });
    }
  }
}
