import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfirmService } from '../services/confirm.service';

/** Implemented by pages with forms that can lose typed-in data. */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/** Asks before leaving a page whose form has unsaved edits. */
export const UnsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component): boolean | Observable<boolean> => {
  if (!component?.hasUnsavedChanges()) {
    return true;
  }

  return inject(ConfirmService).ask({
    title: 'Discard unsaved changes?',
    message: 'You have changes that have not been saved. If you leave now, they will be lost.',
    confirmText: 'Leave page',
    cancelText: 'Keep editing',
    tone: 'danger'
  });
};
