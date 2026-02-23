import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit, OnChanges,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';

@Component({
  selector: 'hb-search-overlay',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './search-overlay.component.html',
  styleUrl:    './search-overlay.component.scss',
})
export class SearchOverlayComponent implements AfterViewInit, OnChanges {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  ngAfterViewInit(): void {
    if (this.isOpen) this.focusInput();
  }

  ngOnChanges(): void {
    if (this.isOpen) setTimeout(() => this.focusInput(), 50);
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('search-overlay')) {
      this.close();
    }
  }

  private focusInput(): void {
    this.searchInput?.nativeElement.focus();
  }
}
