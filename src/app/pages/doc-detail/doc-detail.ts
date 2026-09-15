import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TOPICS, getTopicBySlug } from '../../data/topics.data';

@Component({
  selector: 'app-doc-detail',
  imports: [RouterLink],
  templateUrl: './doc-detail.html',
  styleUrl: './doc-detail.scss',
})
export class DocDetail {
  private readonly route = inject(ActivatedRoute);

  private readonly slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('slug') ?? '' },
  );

  protected readonly topic = computed(() => getTopicBySlug(this.slug()));

  protected readonly adjacent = computed(() => {
    const current = this.topic();
    if (!current) {
      return { prev: undefined, next: undefined };
    }
    const index = TOPICS.findIndex((t) => t.slug === current.slug);
    return {
      prev: index > 0 ? TOPICS[index - 1] : undefined,
      next: index >= 0 && index < TOPICS.length - 1 ? TOPICS[index + 1] : undefined,
    };
  });

  protected readonly copied = signal(false);

  protected copyLink(): void {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    });
  }
}
