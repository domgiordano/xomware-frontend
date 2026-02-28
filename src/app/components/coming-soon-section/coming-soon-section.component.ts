import { Component } from '@angular/core';
import { ComingSoonApp } from '../coming-soon-card/coming-soon-card.component';

@Component({
  selector: 'app-coming-soon-section',
  templateUrl: './coming-soon-section.component.html',
  styleUrls: ['./coming-soon-section.component.scss'],
})
export class ComingSoonSectionComponent {
  apps: ComingSoonApp[] = [
    {
      id: 'xomfit',
      name: 'xomfit',
      tagline: 'Train together. Track everything.',
      description: 'The social workout tracker built for lifters. Log sets, track PRs, compete with friends, and get AI coaching.',
      color: '#34C759',
      colorRgb: '52, 199, 89',
      platform: 'iOS',
      logo: 'assets/img/xomfit-placeholder.svg',
    },
    {
      id: 'float',
      name: 'float',
      tagline: 'Happy hour, found.',
      description: 'Discover the best deals near you — happy hours, specials, and secret deals. Live map of what\'s active right now.',
      color: '#FFB800',
      colorRgb: '255, 184, 0',
      platform: 'iOS',
      logo: 'assets/img/float-placeholder.svg',
    },
  ];
}
