import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-monster',
  templateUrl: './monster.component.html',
  styleUrls: ['./monster.component.scss'],
})
export class MonsterComponent {
  @Input() state = 'idle';
}
