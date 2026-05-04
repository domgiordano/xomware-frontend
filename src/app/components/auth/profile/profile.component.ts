import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CognitoService, XomUser } from '../../../services/cognito.service';

/**
 * Phase 2 placeholder. Real profile editing (avatar, username changes, linked
 * apps) lands in Phase 3.
 */
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
  readonly user$: Observable<XomUser | null>;

  constructor(private cognito: CognitoService, private router: Router) {
    this.user$ = this.cognito.user$;
  }

  signOut(): void {
    this.cognito.signOut().subscribe({
      next: () => this.router.navigateByUrl('/'),
    });
  }
}
