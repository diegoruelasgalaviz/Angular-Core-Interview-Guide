import { Component } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DIFFICULTIES, TOPICS, getCategories } from '../../data/topics.data';

interface Highlight {
  icon: string;
  title: string;
  body: string;
}

@Component({
  selector: 'app-landing',
  imports: [RouterLink, LowerCasePipe],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  protected readonly topicCount = TOPICS.length;
  protected readonly categories = getCategories();
  protected readonly difficulties = DIFFICULTIES;
  protected readonly quizCount = TOPICS.reduce((sum, t) => sum + t.quiz.length, 0);

  protected readonly highlights: Highlight[] = [
    {
      icon: '⚡',
      title: 'Zero backend, zero setup',
      body: 'Every lecture, code sample, and quiz question is bundled directly into the app. Clone it, run ng serve, and start studying — no API keys, no database, no server.',
    },
    {
      icon: '🎯',
      title: 'Senior-level, not "getting started"',
      body: 'Topics are picked from what actually gets asked in senior Angular interviews: change detection internals, signals, NgRx trade-offs, SSR hydration, micro-frontends, and more.',
    },
    {
      icon: '🔍',
      title: 'Searchable & filterable',
      body: 'Filter the library by difficulty or category, or search by keyword to jump straight to the topic you need to brush up on before an interview.',
    },
    {
      icon: '🕹️',
      title: 'Gamified practice',
      body: 'Turn each topic into a scored quiz. Your best score per topic is saved locally in your browser so you can track improvement over time.',
    },
  ];
}
