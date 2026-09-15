import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Topic, TOPICS } from '../../data/topics.data';

type Mode = 'select' | 'quiz' | 'result';

interface QuestionResult {
  question: string;
  selectedIndex: number;
  correct: boolean;
}

const STORAGE_KEY = 'angular-guide:best-scores';

@Component({
  selector: 'app-gamify',
  imports: [RouterLink],
  templateUrl: './gamify.html',
  styleUrl: './gamify.scss',
})
export class Gamify {
  private readonly route = inject(ActivatedRoute);

  protected readonly topics = TOPICS;
  protected readonly mode = signal<Mode>('select');
  protected readonly activeTopic = signal<Topic | undefined>(undefined);

  protected readonly currentIndex = signal(0);
  protected readonly selectedOption = signal<number | null>(null);
  protected readonly answered = signal(false);
  protected readonly score = signal(0);
  protected readonly results = signal<QuestionResult[]>([]);

  protected readonly bestScores = signal<Record<string, number>>(this.loadBestScores());

  protected readonly currentQuestion = computed(() => {
    const topic = this.activeTopic();
    return topic ? topic.quiz[this.currentIndex()] : undefined;
  });

  protected readonly progressPercent = computed(() => {
    const topic = this.activeTopic();
    if (!topic) return 0;
    return Math.round(((this.currentIndex() + 1) / topic.quiz.length) * 100);
  });

  protected readonly isLastQuestion = computed(() => {
    const topic = this.activeTopic();
    return !!topic && this.currentIndex() === topic.quiz.length - 1;
  });

  protected readonly resultPercent = computed(() => {
    const topic = this.activeTopic();
    if (!topic || topic.quiz.length === 0) return 0;
    return Math.round((this.score() / topic.quiz.length) * 100);
  });

  protected readonly resultMessage = computed(() => {
    const pct = this.resultPercent();
    if (pct === 100) return "Perfect score — you're interview-ready on this one.";
    if (pct >= 70) return 'Solid grasp. Review the missed questions below.';
    if (pct >= 40) return 'Getting there — re-read the lecture and try again.';
    return "Worth another pass through the document before you retry.";
  });

  constructor() {
    const topicSlug = this.route.snapshot.queryParamMap.get('topic');
    if (topicSlug) {
      const topic = TOPICS.find((t) => t.slug === topicSlug);
      if (topic) {
        this.startQuiz(topic);
      }
    }
  }

  protected bestScoreFor(slug: string): number | undefined {
    return this.bestScores()[slug];
  }

  protected startQuiz(topic: Topic): void {
    this.activeTopic.set(topic);
    this.currentIndex.set(0);
    this.selectedOption.set(null);
    this.answered.set(false);
    this.score.set(0);
    this.results.set([]);
    this.mode.set('quiz');
  }

  protected selectOption(index: number): void {
    if (this.answered()) return;
    const question = this.currentQuestion();
    if (!question) return;

    this.selectedOption.set(index);
    this.answered.set(true);

    const correct = index === question.correctIndex;
    if (correct) {
      this.score.update((s) => s + 1);
    }
    this.results.update((r) => [...r, { question: question.question, selectedIndex: index, correct }]);
  }

  protected nextQuestion(): void {
    if (this.isLastQuestion()) {
      this.finishQuiz();
      return;
    }
    this.currentIndex.update((i) => i + 1);
    this.selectedOption.set(null);
    this.answered.set(false);
  }

  protected finishQuiz(): void {
    const topic = this.activeTopic();
    if (topic) {
      this.saveBestScore(topic.slug, this.resultPercent());
    }
    this.mode.set('result');
  }

  protected retry(): void {
    const topic = this.activeTopic();
    if (topic) this.startQuiz(topic);
  }

  protected backToSelection(): void {
    this.activeTopic.set(undefined);
    this.mode.set('select');
  }

  private loadBestScores(): Record<string, number> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private saveBestScore(slug: string, percent: number): void {
    try {
      const scores = this.loadBestScores();
      scores[slug] = Math.max(scores[slug] ?? 0, percent);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
      this.bestScores.set(scores);
    } catch {
      // localStorage unavailable (private mode, etc.) — degrade silently
    }
  }
}
