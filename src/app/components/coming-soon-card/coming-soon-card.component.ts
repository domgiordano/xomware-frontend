import { Component, Input } from '@angular/core';

export interface ComingSoonApp {
  id: string;
  name: string;
  tagline: string;
  description: string;
  color: string;
  colorRgb: string;
  platform: string;
  logo: string;
}

@Component({
  selector: 'app-coming-soon-card',
  templateUrl: './coming-soon-card.component.html',
  styleUrls: ['./coming-soon-card.component.scss'],
})
export class ComingSoonCardComponent {
  @Input() app!: ComingSoonApp;
}
