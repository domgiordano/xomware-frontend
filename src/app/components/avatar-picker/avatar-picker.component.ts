import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AVATAR_SWATCHES, APP_DEFAULT_AVATAR_COLOR } from '../../models/avatar-swatches';
import { UsersService } from '../../services/users.service';

export type AvatarChoice =
  | { kind: 'photo'; url: string }
  | { kind: 'stock'; color: string };

@Component({
  selector: 'app-avatar-picker',
  templateUrl: './avatar-picker.component.html',
  styleUrls: ['./avatar-picker.component.scss'],
})
export class AvatarPickerComponent {
  @Input() avatarUrl: string | null = null;
  @Input() stockColor: string | null = null;
  @Input() history: string[] = [];
  /** Pending in-flight choice the parent hasn't saved yet. */
  @Input() pending: AvatarChoice | null = null;
  @Output() choiceChange = new EventEmitter<AvatarChoice>();

  readonly swatches = AVATAR_SWATCHES;
  readonly defaultColor = APP_DEFAULT_AVATAR_COLOR;

  uploading = false;
  uploadError: string | null = null;

  constructor(private users: UsersService) {}

  /** What to render in the preview right now: pending wins over saved. */
  get activePhoto(): string | null {
    if (this.pending?.kind === 'photo') return this.pending.url;
    if (this.pending) return null;
    return this.avatarUrl;
  }

  get activeStock(): string | null {
    if (this.pending?.kind === 'stock') return this.pending.color;
    if (this.pending) return null;
    return this.stockColor;
  }

  get previewColor(): string {
    return this.activeStock || this.defaultColor;
  }

  get previewLabel(): string {
    if (this.activePhoto) return 'Custom photo';
    if (this.activeStock) return 'Stock avatar';
    return 'Default avatar';
  }

  pickStock(color: string): void {
    this.choiceChange.emit({ kind: 'stock', color });
  }

  pickPhoto(url: string): void {
    this.choiceChange.emit({ kind: 'photo', url });
  }

  isStockSelected(hex: string): boolean {
    return this.activeStock === hex && !this.activePhoto;
  }

  isPhotoSelected(url: string): boolean {
    return this.activePhoto === url;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploadError = null;
    this.uploading = true;
    this.users.uploadAvatar(file).subscribe({
      next: (url: string) => {
        this.uploading = false;
        this.choiceChange.emit({ kind: 'photo', url });
      },
      error: (err: Error) => {
        this.uploading = false;
        this.uploadError = err?.message || 'Upload failed.';
      },
    });
  }
}
