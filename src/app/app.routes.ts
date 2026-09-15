import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing').then((m) => m.Landing),
    title: 'Angular Core Interview Guide — Senior Angular Interview Prep',
  },
  {
    path: 'docs',
    loadComponent: () => import('./pages/docs-list/docs-list').then((m) => m.DocsList),
    title: 'Documents — Angular Core Interview Guide',
  },
  {
    path: 'docs/:slug',
    loadComponent: () => import('./pages/doc-detail/doc-detail').then((m) => m.DocDetail),
    title: 'Document — Angular Core Interview Guide',
  },
  {
    path: 'gamify',
    loadComponent: () => import('./pages/gamify/gamify').then((m) => m.Gamify),
    title: 'Gamify — Angular Core Interview Guide',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
