import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { DIFFICULTIES, Difficulty, TOPICS, getCategories } from '../../data/topics.data';

@Component({
  selector: 'app-docs-list',
  imports: [RouterLink],
  templateUrl: './docs-list.html',
  styleUrl: './docs-list.scss',
})
export class DocsList {
  protected readonly difficulties = DIFFICULTIES;
  protected readonly categories = getCategories();
  protected readonly totalCount = TOPICS.length;

  protected readonly search = signal('');
  protected readonly selectedDifficulty = signal<Difficulty | 'All'>('All');
  protected readonly selectedCategory = signal<string>('All');

  protected readonly filteredTopics = computed(() => {
    const term = this.search().trim().toLowerCase();
    const difficulty = this.selectedDifficulty();
    const category = this.selectedCategory();

    return TOPICS.filter((topic) => {
      const matchesDifficulty = difficulty === 'All' || topic.difficulty === difficulty;
      const matchesCategory = category === 'All' || topic.category === category;
      const matchesSearch =
        term.length === 0 ||
        topic.title.toLowerCase().includes(term) ||
        topic.summary.toLowerCase().includes(term) ||
        topic.category.toLowerCase().includes(term);

      return matchesDifficulty && matchesCategory && matchesSearch;
    });
  });

  constructor(route: ActivatedRoute) {
    const qp = route.snapshot.queryParamMap;
    const difficulty = qp.get('difficulty');
    if (difficulty && (DIFFICULTIES as string[]).includes(difficulty)) {
      this.selectedDifficulty.set(difficulty as Difficulty);
    }
    const category = qp.get('category');
    if (category) {
      this.selectedCategory.set(category);
    }
  }

  protected updateSearch(value: string): void {
    this.search.set(value);
  }

  protected setDifficulty(value: Difficulty | 'All'): void {
    this.selectedDifficulty.set(value);
  }

  protected setCategory(value: string): void {
    this.selectedCategory.set(value);
  }

  protected clearFilters(): void {
    this.search.set('');
    this.selectedDifficulty.set('All');
    this.selectedCategory.set('All');
  }
}
