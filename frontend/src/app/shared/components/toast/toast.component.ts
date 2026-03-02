import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast/toast.service';

@Component({
  selector: 'hb-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast.component.html',
  styleUrl:    './toast.component.scss',
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
