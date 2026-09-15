export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TopicSection {
  heading: string;
  body: string;
  code?: string;
}

export interface Topic {
  slug: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  summary: string;
  readMinutes: number;
  sections: TopicSection[];
  quiz: QuizQuestion[];
}

export const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

export const TOPICS: Topic[] = [
  {
    slug: 'change-detection-zonejs',
    title: 'Change Detection & Zone.js',
    category: 'Core Concepts',
    difficulty: 'Advanced',
    summary:
      'How Angular knows when to re-render, and the role Zone.js plays in triggering that process automatically.',
    readMinutes: 8,
    sections: [
      {
        heading: 'What change detection actually does',
        body: `Angular keeps a component tree in memory, and change detection is the process of walking that tree, comparing each binding's last-known value against its current value, and patching the DOM where they differ. It is not "magic reactivity" - it is a synchronous, depth-first traversal that runs on demand. The important interview distinction is between the *mechanism* (the tree walk) and the *trigger* (what causes the walk to start). Zone.js historically owned the trigger; Angular owns the mechanism.`,
      },
      {
        heading: 'Zone.js: monkey-patching the async APIs',
        body: `Zone.js patches browser and Node async APIs - setTimeout, addEventListener, Promise.then, XHR callbacks, and more - so that Angular can be notified the instant any of them fires. When a patched API resolves inside Angular's "zone", Zone.js emits a signal and Angular's ApplicationRef runs tick(), which triggers change detection from the root component down. This is why clicking a button, receiving an HTTP response, or a timer firing all "just work" without you manually calling anything - Zone.js is doing the bookkeeping, and Angular is reacting to it.`,
        code: `// Simplified mental model of what Zone.js enables\nclass NgZone {\n  onMicrotaskEmpty = new EventEmitter<void>();\n}\n\n// Angular subscribes once, application-wide:\nngZone.onMicrotaskEmpty.subscribe(() => {\n  applicationRef.tick(); // walks every component and checks bindings\n});`,
      },
      {
        heading: 'Why senior interviews probe this',
        body: `Zone-based change detection is a blunt instrument: any async event anywhere triggers a full tree walk by default, which is wasteful at scale. Interviewers ask about this to see if you understand the cost model - O(component count) per tick - and whether you know the escape hatches: NgZone.runOutsideAngular() to opt out of triggering CD for noisy async work (mousemove handlers, canvas animations), and ChangeDetectionStrategy.OnPush to prune whole subtrees from the walk. Angular's zoneless mode (stable since v18-20, provideExperimentalZonelessChangeDetection / provideZonelessChangeDetection) removes Zone.js entirely and relies on signals to schedule updates precisely instead of on a blanket tick.`,
      },
      {
        heading: 'Manual control APIs',
        body: `ChangeDetectorRef exposes the escape hatches you're expected to know: detectChanges() runs CD immediately for a component and its children; markForCheck() flags an OnPush component (and its ancestors) as dirty so the next tick includes it; detach() removes a component from the default tick cycle entirely, useful for a component you'll drive manually (e.g. a chart re-rendered on a rAF loop); and reattach() restores it.`,
        code: `constructor(private cdr: ChangeDetectorRef) {}\n\nngOnInit() {\n  this.cdr.detach();\n  setInterval(() => {\n    this.data = this.poll();\n    this.cdr.detectChanges(); // opt-in, controlled re-render\n  }, 1000);\n}`,
      },
    ],
    quiz: [
      {
        question: 'What is the primary job of Zone.js in a zone-based Angular app?',
        options: [
          'It diffs the virtual DOM',
          'It patches async browser APIs so Angular knows when to run change detection',
          'It compiles templates into JavaScript',
          'It manages the router state',
        ],
        correctIndex: 1,
        explanation:
          'Zone.js monkey-patches async APIs (setTimeout, Promise, DOM events, XHR) so it can notify Angular the instant one fires, which is what triggers ApplicationRef.tick().',
      },
      {
        question: 'What does NgZone.runOutsideAngular() do?',
        options: [
          'Destroys the component outside the zone',
          'Runs a callback so its async work does NOT trigger Angular change detection',
          'Forces synchronous change detection immediately',
          'Moves the component to a child injector',
        ],
        correctIndex: 1,
        explanation:
          'It executes the given function outside the Angular zone, so any async callbacks scheduled inside it (e.g. a mousemove listener) will not trigger a CD cycle - useful for high-frequency events.',
      },
      {
        question: 'What replaces Zone.js as the update trigger in zoneless Angular?',
        options: [
          'Manual setInterval polling',
          'Signals notifying Angular precisely which producers changed',
          'A WebSocket connection to the CLI',
          'The HttpClient interceptor chain',
        ],
        correctIndex: 1,
        explanation:
          'Zoneless Angular relies on signals (and markForCheck-style notifications from APIs like async pipe) to schedule change detection only where and when something actually changed.',
      },
    ],
  },
  {
    slug: 'onpush-strategy',
    title: 'OnPush Change Detection Strategy',
    category: 'Performance',
    difficulty: 'Advanced',
    summary:
      'Pruning the change detection tree by telling Angular a component only needs checking when its inputs change by reference.',
    readMinutes: 6,
    sections: [
      {
        heading: 'The contract you are signing',
        body: `Setting changeDetection: ChangeDetectionStrategy.OnPush tells Angular: "skip this component and its subtree during a default tick unless one of these things happens - an @Input() reference changes, an event originates from inside this component's template, an async pipe emits, or someone calls markForCheck() explicitly." The keyword is reference: mutating an object or pushing into an array in place will NOT trigger a re-check, because the reference is identical. This is the single most common OnPush bug in real codebases.`,
        code: `@Component({\n  selector: 'app-user-card',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n  template: \`<h3>{{ user().name }}</h3>\`,\n})\nexport class UserCard {\n  user = input.required<User>();\n}\n\n// Won't trigger OnPush re-check:\nthis.user.name = 'New Name';\n\n// Will:\nthis.user = { ...this.user, name: 'New Name' };`,
      },
      {
        heading: 'Why interviewers love this question',
        body: `It tests whether you actually understand immutability's role in Angular performance, not just that "OnPush is faster." A strong answer covers: it drastically cuts the number of components visited per tick in large trees, it pairs naturally with the async pipe (which calls markForCheck() on each emission for you), and it forces a discipline of treating state as immutable - which also happens to be exactly what NgRx/signals encourage, so the patterns reinforce each other.`,
      },
    ],
    quiz: [
      {
        question: 'Under OnPush, what causes a component to be re-checked?',
        options: [
          'Any change anywhere in the application',
          'A new @Input() reference, a DOM event from its own template, an async pipe emission, or a manual markForCheck()',
          'Only a full page reload',
          'Only changes to its own component-level signals, never inputs',
        ],
        correctIndex: 1,
        explanation:
          'OnPush narrows the triggers to those four cases; anything else is skipped for that subtree during a default tick.',
      },
      {
        question: 'Why does mutating an @Input() object in place fail to update an OnPush component?',
        options: [
          'OnPush components ignore objects entirely',
          'Because the reference identity is unchanged, so Angular\'s reference check finds nothing different',
          'Because objects cannot be passed as inputs',
          'Because mutation throws a runtime error in OnPush components',
        ],
        correctIndex: 1,
        explanation:
          'OnPush compares input references, not deep equality. Mutating in place keeps the same reference, so no change is detected.',
      },
    ],
  },
  {
    slug: 'signals',
    title: 'Signals',
    category: 'Core Concepts',
    difficulty: 'Intermediate',
    summary:
      "Angular's fine-grained reactive primitive: a wrapped value that tracks its own readers and notifies only them when it changes.",
    readMinutes: 7,
    sections: [
      {
        heading: 'The core primitives',
        body: `signal() creates a writable, observable value. computed() derives a new signal from others and memoizes its result, recalculating lazily only when a dependency actually changed. effect() runs a side effect automatically whenever any signal it read during its last run changes. Unlike RxJS Observables, signals are synchronous, have a current value you can read at any time with (), and don't need subscription management - there's nothing to unsubscribe from.`,
        code: `const count = signal(0);\nconst doubled = computed(() => count() * 2);\n\neffect(() => {\n  console.log(\`count is now \${count()}\`);\n});\n\ncount.set(5);   // logs "count is now 5", doubled() === 10\ncount.update(v => v + 1); // logs "count is now 6"`,
      },
      {
        heading: 'Why they enable zoneless Angular',
        body: `Because a signal knows exactly which computed()s and templates read it, Angular can schedule change detection precisely for the components that consumed a changed signal - no need to walk the entire tree on every async event. This is the mechanism that makes provideZonelessChangeDetection() viable: Zone.js's "check everything, every time" model is replaced by "check exactly what depends on what changed."`,
      },
      {
        heading: 'Signals vs RxJS - when to use which',
        body: `Signals are the right tool for synchronous UI state: form values, toggles, derived view state, counters. RxJS remains the right tool for asynchronous streams over time with operators like debounceTime, switchMap, retry, or combining multiple async sources. Angular provides toSignal() and toObservable() interop functions specifically because real apps need both - e.g. debounce a search input with RxJS, then convert the final stream to a signal for template consumption.`,
        code: `const searchTerm = signal('');\nconst results$ = toObservable(searchTerm).pipe(\n  debounceTime(300),\n  switchMap(term => this.api.search(term))\n);\nconst results = toSignal(results$, { initialValue: [] });`,
      },
    ],
    quiz: [
      {
        question: 'How does computed() decide whether to recalculate its value?',
        options: [
          'It recalculates on every change detection tick regardless of dependencies',
          'It tracks which signals were read during its last execution and only recomputes when one of them changes',
          'It polls its dependencies every 100ms',
          'It never recalculates after the first read',
        ],
        correctIndex: 1,
        explanation:
          'computed() is a memoized, lazily-evaluated derivation - it only re-runs its function when a signal it actually depends on changes.',
      },
      {
        question: 'What is the correct way to bridge an RxJS stream into a signal for template use?',
        options: [
          'Manually subscribe in ngOnInit and assign a plain field',
          'toSignal(observable$)',
          'Wrap the Observable in a computed()',
          'Signals cannot consume Observable data',
        ],
        correctIndex: 1,
        explanation:
          'toSignal() subscribes to the Observable for you and exposes its latest emission as a signal, with automatic cleanup tied to the injection context.',
      },
      {
        question: 'Why do signals help enable zoneless change detection?',
        options: [
          'They eliminate the need for a router',
          'They let Angular know precisely which view bindings depend on which values, avoiding a full tree walk',
          'They automatically minify the compiled output',
          'They replace TypeScript with a new template language',
        ],
        correctIndex: 1,
        explanation:
          'Because signal reads are tracked, Angular can schedule updates only for the exact consumers of a changed signal instead of checking the whole component tree.',
      },
    ],
  },
  {
    slug: 'rxjs-operators-subjects',
    title: 'RxJS Operators & Subjects',
    category: 'Reactive Programming',
    difficulty: 'Advanced',
    summary:
      'The flattening operators, subject variants, and cleanup patterns that come up constantly in senior-level RxJS questions.',
    readMinutes: 9,
    sections: [
      {
        heading: 'The four flattening operators, and when to use each',
        body: `switchMap cancels the previous inner Observable when a new source value arrives - correct for search-as-you-type or "latest request wins" scenarios. mergeMap runs all inner Observables concurrently with no cancellation - correct for fire-and-forget parallel work like batch uploads. concatMap queues inner Observables and runs them strictly in order, one at a time - correct when ordering matters, like sequential save operations. exhaustMap ignores new source values while an inner Observable is still running - correct for a submit button you want to debounce against double-clicks without cancelling the in-flight request.`,
        code: `searchInput$.pipe(\n  debounceTime(300),\n  distinctUntilChanged(),\n  switchMap(term => this.api.search(term)) // cancels stale search requests\n).subscribe(results => this.results = results);\n\nsubmit$.pipe(\n  exhaustMap(() => this.api.save(this.form.value)) // ignores clicks while saving\n).subscribe();`,
      },
      {
        heading: 'Subject, BehaviorSubject, ReplaySubject, AsyncSubject',
        body: `Subject is a multicast Observable with no memory - late subscribers get nothing until the next emission. BehaviorSubject requires an initial value and always replays the current value to new subscribers - the standard choice for state holders (e.g. a "current user" store). ReplaySubject(n) replays the last n emissions to new subscribers - useful for caching. AsyncSubject only emits the final value, and only on completion - rarely used outside very specific completion-signal scenarios.`,
      },
      {
        heading: 'Unsubscribing without leaking',
        body: `The idiomatic pattern is takeUntil(this.destroy$) combined with a Subject that fires in ngOnDestroy, or the newer takeUntilDestroyed() which reads the DestroyRef from the injection context automatically. The async pipe is the preferred default for template-bound streams because it subscribes and unsubscribes for you, and also calls markForCheck() automatically, which is why it pairs so well with OnPush.`,
        code: `private destroyRef = inject(DestroyRef);\n\nngOnInit() {\n  this.data$.pipe(\n    takeUntilDestroyed(this.destroyRef)\n  ).subscribe(v => this.value = v);\n}`,
      },
    ],
    quiz: [
      {
        question: 'Which flattening operator is correct for a type-ahead search box?',
        options: ['mergeMap', 'concatMap', 'switchMap', 'exhaustMap'],
        correctIndex: 2,
        explanation:
          'switchMap cancels the previous in-flight request whenever a new keystroke arrives, so only the latest search resolves - exactly what a search box needs.',
      },
      {
        question: 'Which Subject variant is the standard choice for representing "current state" that new subscribers should immediately receive?',
        options: ['Subject', 'BehaviorSubject', 'ReplaySubject(0)', 'AsyncSubject'],
        correctIndex: 1,
        explanation:
          'BehaviorSubject requires and holds a current value, immediately emitting it to any new subscriber - the natural fit for a state container.',
      },
      {
        question: 'What does exhaustMap do differently from switchMap?',
        options: [
          'It cancels the current inner Observable on a new source emission',
          'It ignores new source emissions while the current inner Observable is still active',
          'It runs every inner Observable concurrently',
          'It buffers all source emissions until completion',
        ],
        correctIndex: 1,
        explanation:
          'exhaustMap drops new source values while an inner subscription is in flight - useful to prevent duplicate submissions from a save/submit button.',
      },
    ],
  },
  {
    slug: 'ngrx-state-management',
    title: 'NgRx & State Management Patterns',
    category: 'State Management',
    difficulty: 'Advanced',
    summary:
      'The action/reducer/selector/effect cycle, and how to reason about when a global store is actually worth the complexity.',
    readMinutes: 8,
    sections: [
      {
        heading: 'The unidirectional data flow',
        body: `A component dispatches an Action (a plain, serializable object describing what happened, not what should happen). A pure Reducer function takes the current state and the action and returns a brand-new state object - never mutates the old one. Selectors are memoized pure functions that read specific, derived slices of state, so components only re-render when the slice they selected actually changes. Effects listen for actions, perform side effects (HTTP calls, localStorage writes), and dispatch new actions with the result - keeping reducers 100% pure and side-effect-free.`,
        code: `export const loadUsers = createAction('[Users] Load');\nexport const loadUsersSuccess = createAction(\n  '[Users] Load Success',\n  props<{ users: User[] }>()\n);\n\nexport const usersReducer = createReducer(\n  initialState,\n  on(loadUsersSuccess, (state, { users }) => ({ ...state, users }))\n);\n\nexport const loadUsers$ = createEffect(() =>\n  inject(Actions).pipe(\n    ofType(loadUsers),\n    switchMap(() => this.api.getUsers().pipe(\n      map(users => loadUsersSuccess({ users })),\n      catchError(() => of(loadUsersFailure()))\n    ))\n  )\n);`,
      },
      {
        heading: 'When NOT to reach for a global store',
        body: `A senior-level answer resists the reflex to always say "use NgRx." State that's genuinely local to one component tree (a form's draft values, an accordion's open/closed state) belongs in that component, not a global store - it adds indirection and boilerplate for no benefit. The rule of thumb interviewers want to hear: reach for a store when state needs to be shared across distant, unrelated parts of the tree, needs to survive route changes, or benefits from time-travel debugging / a single source of truth for caching server data.`,
      },
      {
        heading: 'Component Store and signal-based alternatives',
        body: `NgRx ComponentStore (and the newer @ngrx/signals SignalStore) offer the same reducer/selector discipline scoped to a single feature or component, without the ceremony of global actions - a good middle ground for feature-local state that's still complex enough to benefit from a structured pattern. This distinction (global store vs. scoped store vs. plain component state) is exactly the kind of judgment call senior interviews are probing for.`,
      },
    ],
    quiz: [
      {
        question: 'In the NgRx pattern, where should an HTTP call live?',
        options: ['Inside the reducer', 'Inside an Effect', 'Inside a Selector', 'Inside the Action creator'],
        correctIndex: 1,
        explanation:
          'Reducers must stay pure and synchronous. Side effects like HTTP calls belong in Effects, which listen for actions and dispatch new actions with the result.',
      },
      {
        question: 'Why must a reducer return a new state object instead of mutating the existing one?',
        options: [
          'NgRx enforces this at compile time only for style reasons',
          'Because selectors and OnPush components rely on reference changes to detect updates',
          'Mutating state throws a runtime exception in NgRx',
          'It has no real effect, it is purely a convention',
        ],
        correctIndex: 1,
        explanation:
          'Memoized selectors and OnPush components compare references. Mutating in place would leave the reference unchanged and silently break change detection and memoization.',
      },
      {
        question: 'What is the main argument for using ComponentStore/SignalStore instead of the global store?',
        options: [
          'They are faster at runtime in every case',
          'They scope reducer-style state management to a feature without the ceremony of app-wide actions',
          'They eliminate the need for selectors entirely',
          'They only work with zoneless applications',
        ],
        correctIndex: 1,
        explanation:
          'They give you the same structured, testable state pattern but scoped locally, which is a better fit when the state does not need to be shared app-wide.',
      },
    ],
  },
  {
    slug: 'dependency-injection',
    title: 'Dependency Injection & Hierarchical Injectors',
    category: 'Core Concepts',
    difficulty: 'Intermediate',
    summary:
      "How Angular's injector tree resolves providers, and why where you provide a service changes its lifetime and identity.",
    readMinutes: 7,
    sections: [
      {
        heading: 'The injector hierarchy',
        body: `Angular resolves a dependency by walking up an injector tree: element injector (the component and its view providers) -> module/environment injector -> platform injector -> null injector (which throws NullInjectorError if nothing resolved). providedIn: 'root' registers a singleton on the root environment injector, shared app-wide. Providing a service in a component's providers array creates a new instance for that component and every descendant that doesn't itself override it - this is how you get "one instance per component tree" behavior, e.g. a form-wizard state service scoped to just that wizard.`,
        code: `@Injectable({ providedIn: 'root' })\nexport class AuthService {} // one instance, app-wide\n\n@Component({\n  selector: 'app-wizard',\n  providers: [WizardStateService], // new instance per <app-wizard>\n})\nexport class WizardComponent {}`,
      },
      {
        heading: 'Injection tokens and multi-providers',
        body: `InjectionToken<T> is used to provide non-class dependencies (config objects, primitives, interfaces) since TypeScript interfaces disappear at runtime and can't be used as DI tokens. multi: true lets several providers contribute to the same token as an array - this is exactly how Angular implements HTTP_INTERCEPTORS internally, letting multiple libraries each register an interceptor without overwriting each other.`,
        code: `export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');\n\nproviders: [\n  { provide: API_BASE_URL, useValue: 'https://api.example.com' },\n  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },\n]`,
      },
      {
        heading: 'inject() vs constructor injection',
        body: `The inject() function (usable in field initializers, factory functions, and inside an injection context) has largely replaced constructor injection in standalone-era Angular because it works outside class constructors too - inside functional guards, resolvers, and interceptors, none of which are classes. Both resolve dependencies through the exact same injector tree; the difference is purely syntactic and about where you're allowed to call it.`,
      },
    ],
    quiz: [
      {
        question: "What happens if a service is provided in a component's `providers` array instead of `providedIn: 'root'`?",
        options: [
          'It becomes globally inaccessible',
          'A new instance is created for that component subtree instead of a single app-wide singleton',
          'It throws a compile error',
          'It is automatically tree-shaken away',
        ],
        correctIndex: 1,
        explanation:
          "Component-level providers create a scoped instance for that component and its descendants, distinct from the app-wide singleton providedIn: 'root' would create.",
      },
      {
        question: 'Why would you use an InjectionToken instead of a class as a DI token?',
        options: [
          'InjectionTokens are faster to resolve',
          'TypeScript interfaces and primitive types do not exist at runtime, so they cannot be used as DI tokens directly',
          'Class-based tokens are deprecated',
          'InjectionTokens do not require an @Injectable decorator anywhere',
        ],
        correctIndex: 1,
        explanation:
          'Interfaces and primitives are erased during TypeScript compilation, so DI (which resolves at runtime) needs a real token object - InjectionToken provides that.',
      },
      {
        question: 'What does `multi: true` do on a provider?',
        options: [
          'It creates multiple instances of the same singleton',
          'It lets several providers all contribute to an array resolved from the same token',
          'It duplicates the component using that provider',
          'It enables the provider only in test environments',
        ],
        correctIndex: 1,
        explanation:
          'multi: true tells Angular to collect every provider registered against that token into a single array, rather than the last one winning - used for things like HTTP_INTERCEPTORS.',
      },
    ],
  },
  {
    slug: 'standalone-components',
    title: 'Standalone Components',
    category: 'Architecture',
    difficulty: 'Intermediate',
    summary:
      'Why NgModules became optional, and how a component declares its own dependencies directly.',
    readMinutes: 6,
    sections: [
      {
        heading: 'What changed',
        body: `Before standalone components, every component had to be declared in exactly one NgModule, and that module's imports array determined what directives/pipes/components were available in its templates - a layer of indirection that added boilerplate and made dependency graphs hard to trace. A standalone component instead lists its own imports directly on the @Component decorator. Since Angular 19, standalone is the default for new components generated by the CLI - you no longer opt in, you'd have to opt out.`,
        code: `@Component({\n  selector: 'app-user-list',\n  imports: [CommonModule, RouterLink, UserCardComponent],\n  templateUrl: './user-list.html',\n})\nexport class UserListComponent {}`,
      },
      {
        heading: 'Bootstrapping without a root module',
        body: `bootstrapApplication(RootComponent, appConfig) replaces bootstrapModule(AppModule) entirely - there is no AppModule at all in a fully standalone app. Providers that used to live in an NgModule's providers array now live in ApplicationConfig, assembled with functions like provideRouter(), provideHttpClient(), and provideAnimations().`,
      },
      {
        heading: 'Why this matters for senior interviews',
        body: `The interesting discussion isn't "standalone exists," it's the architectural consequence: dependency graphs become explicit and traceable per-component instead of hidden inside module declarations, tree-shaking improves because unused standalone components are easier for the bundler to eliminate, and lazy-loading a single component (loadComponent in a route) becomes trivial without needing a whole feature module just to wrap it.`,
      },
    ],
    quiz: [
      {
        question: 'In a standalone component, where do you declare which directives/pipes it can use in its template?',
        options: [
          "In the closest ancestor's NgModule declarations array",
          "Directly in the component's own `imports` array on @Component",
          'In a global app.module.ts that is always required',
          'They are all globally available with no declaration needed',
        ],
        correctIndex: 1,
        explanation:
          'Standalone components declare their own template dependencies directly via the imports array on the @Component decorator.',
      },
      {
        question: 'What replaces AppModule.forRoot()-style provider registration in a fully standalone app?',
        options: [
          'ApplicationConfig passed to bootstrapApplication, assembled with provider functions like provideRouter()',
          'A global window object',
          'Angular no longer supports app-wide providers',
          'Every component must redeclare every provider itself',
        ],
        correctIndex: 0,
        explanation:
          'bootstrapApplication takes an ApplicationConfig object whose providers array is built from functions such as provideRouter(), provideHttpClient(), etc.',
      },
    ],
  },
  {
    slug: 'lifecycle-hooks',
    title: 'Component Lifecycle Hooks',
    category: 'Core Concepts',
    difficulty: 'Beginner',
    summary: 'The order Angular calls lifecycle hooks in, and what each one is actually safe to do.',
    readMinutes: 5,
    sections: [
      {
        heading: 'The full order, once, and then repeatedly',
        body: `On creation: constructor -> ngOnChanges (only if there are @Input()s, and only after the first values are bound) -> ngOnInit -> ngDoCheck -> ngAfterContentInit -> ngAfterContentChecked -> ngAfterViewInit -> ngAfterViewChecked. On every subsequent change detection cycle: ngOnChanges (if inputs changed) -> ngDoCheck -> ngAfterContentChecked -> ngAfterViewChecked. On removal: ngOnDestroy. The two most commonly misused are ngOnInit (safe to read @Input()s and kick off HTTP calls - the constructor is not, because DI hasn't finished setting bound inputs at that point) and ngAfterViewInit (the first point where @ViewChild references are guaranteed populated).`,
      },
      {
        heading: 'Common interview trap: reading a ViewChild too early',
        body: `Accessing an @ViewChild() reference inside ngOnInit will be undefined for most child types, because the view hasn't been initialized yet. It becomes available in ngAfterViewInit. A related trap: mutating a value that affects the parent's view inside ngAfterViewInit/ngAfterContentInit throws ExpressionChangedAfterItHasBeenCheckedError in dev mode, because you'd be changing a value after Angular already checked it in this pass - the fix is usually to defer with Promise.resolve().then() or restructure so the value is set before the relevant check.`,
        code: `@ViewChild(ChartComponent) chart!: ChartComponent;\n\nngOnInit() {\n  console.log(this.chart); // undefined\n}\n\nngAfterViewInit() {\n  console.log(this.chart); // populated\n}`,
      },
    ],
    quiz: [
      {
        question: 'Which hook is the first safe place to read a bound @Input() value reliably?',
        options: ['constructor', 'ngOnInit', 'ngAfterViewInit', 'ngOnDestroy'],
        correctIndex: 1,
        explanation:
          "By the time ngOnInit runs, Angular has already set all bound @Input()s at least once (via ngOnChanges); the constructor runs before DI has bound them.",
      },
      {
        question: 'When does an @ViewChild() reference first become reliably populated?',
        options: ['constructor', 'ngOnInit', 'ngAfterViewInit', 'ngOnChanges'],
        correctIndex: 2,
        explanation:
          "ngAfterViewInit runs after the component's own view (and its children's views) have been fully initialized, which is when ViewChild references are guaranteed to be set.",
      },
    ],
  },
  {
    slug: 'content-projection',
    title: 'Content Projection (ng-content)',
    category: 'Components',
    difficulty: 'Intermediate',
    summary: 'Letting a parent inject markup into a designated slot inside a reusable child component.',
    readMinutes: 5,
    sections: [
      {
        heading: 'Single-slot vs multi-slot projection',
        body: `<ng-content /> with no select attribute projects everything not otherwise matched. Adding select="[card-header]" (or a tag name, class, or attribute selector) creates a named slot that only receives matching content, letting one reusable component (e.g. a Card) define distinct header/body/footer regions that the parent fills in however it wants, while the Card itself controls the surrounding layout and styling.`,
        code: `// card.component.html\n<div class="card">\n  <header><ng-content select="[card-header]" /></header>\n  <section><ng-content /></section>\n</div>\n\n// usage\n<app-card>\n  <h2 card-header>Title</h2>\n  <p>Body content goes to the default slot.</p>\n</app-card>`,
      },
      {
        heading: 'ng-content vs @ContentChild',
        body: `ng-content is purely declarative projection - the component has no programmatic access to what was projected. @ContentChild()/@ContentChildren() let the component query into the projected content and read/interact with it in TypeScript (e.g. a Tabs component that needs to know how many Tab children were projected to render a matching set of headers). The interview-level distinction: ng-content is "where," ContentChild is "what and how many."`,
      },
    ],
    quiz: [
      {
        question: 'What does `<ng-content select="[card-header]" />` do?',
        options: [
          'Projects all content indiscriminately',
          'Creates a named slot that only receives content matching that selector',
          'Declares a new component input',
          'Injects a service into the component',
        ],
        correctIndex: 1,
        explanation:
          "The select attribute restricts that ng-content outlet to only projected elements matching the given selector, enabling multi-slot layouts.",
      },
      {
        question: 'When would you reach for @ContentChildren() instead of plain ng-content?',
        options: [
          'When you need programmatic access to the projected elements from TypeScript, not just visual placement',
          'When you want to disable content projection entirely',
          'They are interchangeable in every situation',
          'Only when using NgModules instead of standalone components',
        ],
        correctIndex: 0,
        explanation:
          '@ContentChildren gives you a QueryList in the component class so you can count, iterate, or call methods on the projected content, which plain ng-content cannot do.',
      },
    ],
  },
  {
    slug: 'directives-pipes',
    title: 'Custom Directives & Pipes',
    category: 'Components',
    difficulty: 'Intermediate',
    summary: 'Extending template syntax with your own attribute/structural directives and pure transformation pipes.',
    readMinutes: 6,
    sections: [
      {
        heading: 'Attribute vs structural directives',
        body: `An attribute directive changes the appearance or behavior of an existing element (e.g. a tooltip or a permission-based disable directive) without adding or removing elements from the DOM. A structural directive - built on ng-template, TemplateRef, and ViewContainerRef - controls whether and how many times a chunk of DOM is rendered at all, which is exactly what *ngIf and *ngFor do under the hood, and what Angular's built-in control flow (@if, @for) now does natively without needing the directive machinery for the common cases.`,
        code: `@Directive({ selector: '[appHighlight]' })\nexport class HighlightDirective {\n  private el = inject(ElementRef);\n  @HostListener('mouseenter') onEnter() {\n    this.el.nativeElement.style.background = 'yellow';\n  }\n  @HostListener('mouseleave') onLeave() {\n    this.el.nativeElement.style.background = '';\n  }\n}`,
      },
      {
        heading: 'Pure vs impure pipes',
        body: `A pipe is pure by default (pure: true), meaning Angular only re-invokes its transform() when the input reference changes - cheap, and the correct default for the vast majority of pipes. An impure pipe (pure: false) re-runs on every single change detection cycle regardless of whether its input changed, which is necessary for something like a pipe that filters an array in place (since mutating an array keeps the same reference) but is a well-known performance trap if overused, since it defeats the point of OnPush-style optimization.`,
      },
    ],
    quiz: [
      {
        question: 'What is the key difference between an attribute directive and a structural directive?',
        options: [
          'Attribute directives can only be used on <div> elements',
          'Structural directives control whether/how many times DOM is rendered; attribute directives only modify existing elements',
          'There is no functional difference, only syntax',
          'Structural directives cannot use @Input()',
        ],
        correctIndex: 1,
        explanation:
          'Structural directives (built on TemplateRef/ViewContainerRef) add, remove, or repeat DOM; attribute directives just change behavior/appearance of elements already in the DOM.',
      },
      {
        question: 'Why should impure pipes (`pure: false`) be used sparingly?',
        options: [
          'They are deprecated and will be removed',
          'They re-run on every change detection cycle regardless of whether their input changed, which can hurt performance',
          'They cannot accept arguments',
          'They only work inside NgModules',
        ],
        correctIndex: 1,
        explanation:
          'Impure pipes opt out of the reference-based memoization pure pipes get, so they execute far more often - fine occasionally, costly if overused across a large template.',
      },
    ],
  },
  {
    slug: 'forms',
    title: 'Reactive vs Template-Driven Forms',
    category: 'Forms',
    difficulty: 'Intermediate',
    summary: 'Two different philosophies for building forms, and why most senior teams default to reactive.',
    readMinutes: 7,
    sections: [
      {
        heading: 'Where the source of truth lives',
        body: `Template-driven forms build the form model implicitly from the template via ngModel and directives, with the model living largely in the DOM and synced asynchronously - convenient for very simple forms, but hard to unit test and hard to reason about for complex validation. Reactive forms build the form model explicitly in the component class with FormGroup/FormControl/FormArray, and the template just binds to that pre-existing model - synchronous, explicit, and straightforward to unit test without rendering the DOM at all.`,
        code: `form = new FormGroup({\n  email: new FormControl('', [Validators.required, Validators.email]),\n  password: new FormControl('', Validators.required),\n});\n\n// Fully testable without touching the DOM:\nit('marks email invalid for bad format', () => {\n  form.controls.email.setValue('not-an-email');\n  expect(form.controls.email.valid).toBeFalse();\n});`,
      },
      {
        heading: 'Custom validators and cross-field validation',
        body: `A custom validator is just a function: (control: AbstractControl) => ValidationErrors | null. Cross-field validation (e.g. "password" must equal "confirmPassword") is attached at the FormGroup level rather than an individual control, since it needs access to sibling controls. Async validators (returning an Observable/Promise) are used for things like "check if this username is already taken" against a server - Angular automatically marks the control PENDING while the async validator resolves.`,
        code: `function matchPasswords(group: AbstractControl): ValidationErrors | null {\n  const pass = group.get('password')?.value;\n  const confirm = group.get('confirm')?.value;\n  return pass === confirm ? null : { mismatch: true };\n}`,
      },
    ],
    quiz: [
      {
        question: 'What is the main architectural difference between reactive and template-driven forms?',
        options: [
          'Reactive forms cannot use validators',
          'In reactive forms the form model is built explicitly in the class; in template-driven forms it is built implicitly from the template',
          'Template-driven forms are always faster at runtime',
          'They are identical, only the import path differs',
        ],
        correctIndex: 1,
        explanation:
          'Reactive forms define FormGroup/FormControl explicitly in TypeScript, making the model the source of truth and easy to unit test; template-driven forms infer the model from directives in the template.',
      },
      {
        question: 'Where should a "passwords must match" validator be attached?',
        options: [
          'On the password FormControl only',
          'On the confirmPassword FormControl only',
          'On the parent FormGroup, since it needs access to both sibling controls',
          'It cannot be implemented with reactive forms',
        ],
        correctIndex: 2,
        explanation:
          'Cross-field validation needs to read multiple sibling controls at once, which only the parent FormGroup (or FormArray) has direct access to.',
      },
    ],
  },
  {
    slug: 'lazy-loading-guards',
    title: 'Lazy Loading & Route Guards',
    category: 'Routing',
    difficulty: 'Intermediate',
    summary: 'Splitting the bundle by route and controlling navigation with functional guards.',
    readMinutes: 6,
    sections: [
      {
        heading: 'loadComponent and loadChildren',
        body: `loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent) tells the Angular build to split that component (and its exclusive dependencies) into a separate JS chunk that's only fetched when the user navigates to that route - directly reducing initial bundle size. loadChildren does the same for a whole set of child routes (a feature area), typically pointing at a routes file that exports an array, rather than a whole NgModule as in the pre-standalone era.`,
        code: `export const routes: Routes = [\n  {\n    path: 'settings',\n    loadComponent: () =>\n      import('./settings/settings.component').then(m => m.SettingsComponent),\n  },\n  {\n    path: 'admin',\n    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),\n  },\n];`,
      },
      {
        heading: 'Functional guards',
        body: `Modern Angular guards (CanActivateFn, CanDeactivateFn, CanMatchFn, etc.) are plain functions, not injectable classes, and use inject() to pull in services - which is why they can only run inside an injection context. CanActivate decides whether a route can be entered; CanDeactivate decides whether the user can leave (e.g. "unsaved changes" confirmation); CanMatch decides whether a route config even matches at all, which lets you provide different lazy-loaded implementations behind the same path based on a condition (e.g. feature flag) without a redirect.`,
        code: `export const authGuard: CanActivateFn = (route, state) => {\n  const auth = inject(AuthService);\n  const router = inject(Router);\n  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);\n};`,
      },
    ],
    quiz: [
      {
        question: 'What is the main benefit of `loadComponent` on a route?',
        options: [
          'It disables change detection for that route',
          'It splits that component into a separate chunk fetched only when the route is visited, reducing initial bundle size',
          'It automatically generates unit tests for the component',
          'It makes the component render on the server only',
        ],
        correctIndex: 1,
        explanation:
          'Lazy-loaded routes are code-split, so their JavaScript is not part of the initial bundle and downloads only on navigation to that route.',
      },
      {
        question: 'Why are modern Angular guards written as functions instead of injectable classes?',
        options: [
          'Class-based guards were removed from Angular entirely',
          'Functional guards can use inject() directly and avoid the boilerplate of a class implementing an interface',
          'Functions execute faster than class methods',
          'Functional guards do not require any dependencies',
        ],
        correctIndex: 1,
        explanation:
          'Functional guards are plain functions that call inject() within the router\'s injection context, removing the need to declare a class and implement CanActivate purely for a small check.',
      },
    ],
  },
  {
    slug: 'performance-optimization',
    title: 'Performance Optimization',
    category: 'Performance',
    difficulty: 'Advanced',
    summary: 'The concrete levers - trackBy, pure pipes, OnPush, lazy loading, and bundle analysis - senior engineers are expected to name.',
    readMinutes: 8,
    sections: [
      {
        heading: 'trackBy and @for track',
        body: `Without a tracking function, Angular identifies list items by reference/index by default, so re-fetching a list (even with identical data) can cause every DOM node to be destroyed and recreated instead of reused - expensive and it also loses focus state, CSS transitions, etc. Legacy *ngFor uses trackBy: (index, item) => item.id; the built-in @for control flow requires a track expression directly: @for (item of items; track item.id).`,
        code: `@for (user of users(); track user.id) {\n  <app-user-card [user]="user" />\n}`,
      },
      {
        heading: 'OnPush + immutability + async pipe, together',
        body: `These three form the classic performance triangle in a senior answer: OnPush prunes the change-detection tree; immutable state updates guarantee OnPush actually notices real changes (since it compares references); and the async pipe both unwraps Observables in the template and calls markForCheck() on each emission, so you get precise, automatic re-checks without manual ChangeDetectorRef calls anywhere.`,
      },
      {
        heading: 'Bundle-level levers',
        body: `Route-level code splitting (loadComponent/loadChildren) keeps the initial bundle small. defer blocks (@defer) go further, deferring the load of a whole template region until a trigger fires - viewport visibility, interaction, idle time, or a timer - which is the modern replacement for manually wiring IntersectionObserver-based lazy rendering. ng build --stats-json plus source-map-explorer (or the Angular DevTools bundle view) is the standard way to find which dependency is unexpectedly bloating the bundle.`,
        code: `@defer (on viewport) {\n  <app-comments-section />\n} @placeholder {\n  <div class="skeleton"></div>\n}`,
      },
      {
        heading: 'Runtime profiling',
        body: `Angular DevTools' profiler records a timeline of change detection cycles and shows exactly which components were checked and how long each took per frame - the correct first step before optimizing blind. A red flag interviewers listen for: candidates who reach for OnPush or memoization everywhere by default instead of profiling first to confirm there's an actual bottleneck.`,
      },
    ],
    quiz: [
      {
        question: 'What problem does a track expression in @for solve?',
        options: [
          'It sorts the list automatically',
          'It lets Angular match items across re-renders by identity instead of destroying and recreating every DOM node',
          'It disables change detection for the list',
          'It converts the array into an Observable',
        ],
        correctIndex: 1,
        explanation:
          'Tracking by a stable identity (like an id) lets Angular reuse existing DOM nodes for items that still exist, instead of tearing down and rebuilding the whole list on every update.',
      },
      {
        question: 'What does the async pipe do that is especially valuable when paired with OnPush?',
        options: [
          'It converts Observables into Promises',
          'It subscribes/unsubscribes automatically and calls markForCheck() on each emission',
          'It disables the Observable after the first value',
          'It prevents the component from ever re-rendering',
        ],
        correctIndex: 1,
        explanation:
          "The async pipe manages the subscription lifecycle and notifies the OnPush component's change detector on each emission, so you get precise updates with no manual wiring.",
      },
      {
        question: 'What should you do before reaching for optimizations like OnPush everywhere?',
        options: [
          'Nothing, optimize preemptively across the whole app',
          'Profile with Angular DevTools (or similar) to confirm there is an actual bottleneck first',
          'Rewrite the app in a different framework',
          'Disable change detection app-wide',
        ],
        correctIndex: 1,
        explanation:
          'Profiling first avoids wasted effort and unnecessary complexity - you optimize the components that are actually expensive, not every component by default.',
      },
    ],
  },
  {
    slug: 'unit-testing',
    title: 'Unit Testing (TestBed & Spies)',
    category: 'Testing',
    difficulty: 'Intermediate',
    summary: 'Configuring an isolated test module, faking dependencies, and asserting on component/service behavior.',
    readMinutes: 6,
    sections: [
      {
        heading: 'TestBed basics',
        body: `TestBed.configureTestingModule({...}) builds a miniature, isolated Angular environment for the test - you register the component under test, any real or fake providers it needs, and stub out expensive dependencies (HTTP, routing, real services) with mocks or spies so the test stays fast and focused on one unit of behavior. fixture.detectChanges() manually triggers the first change detection cycle, since tests don't run inside Zone.js's automatic tick loop.`,
        code: `TestBed.configureTestingModule({\n  imports: [UserCardComponent],\n  providers: [{ provide: UserService, useValue: { getUser: () => of(mockUser) } }],\n});\nconst fixture = TestBed.createComponent(UserCardComponent);\nfixture.detectChanges();\nexpect(fixture.nativeElement.textContent).toContain(mockUser.name);`,
      },
      {
        heading: 'Spies for isolating behavior',
        body: `jasmine.createSpyObj() (or jest.fn() in a Jest setup) creates a fake implementation of a dependency so the test can assert on how it was called (toHaveBeenCalledWith) without invoking the real logic - critical for keeping unit tests from making real HTTP calls or depending on external state. HttpClientTestingModule / provideHttpClientTesting() plus HttpTestingController is the standard way to intercept and assert on outgoing HTTP requests without hitting a network.`,
      },
    ],
    quiz: [
      {
        question: 'Why do tests need to call `fixture.detectChanges()` manually?',
        options: [
          'Because TestBed disables the DOM entirely',
          'Because tests run outside the automatic Zone.js tick loop, so change detection must be triggered explicitly',
          'Because it deletes the component after the test',
          'It is optional and never actually needed',
        ],
        correctIndex: 1,
        explanation:
          'Unlike a running app, a test fixture does not automatically run change detection on async events, so you trigger it manually to render bindings before asserting on the DOM.',
      },
      {
        question: 'What is the purpose of a spy on an injected service in a component test?',
        options: [
          'To make the test slower but more realistic',
          'To fake the dependency so the test can assert on interactions without invoking real logic like HTTP calls',
          'To automatically generate the component template',
          'Spies are only usable in end-to-end tests, not unit tests',
        ],
        correctIndex: 1,
        explanation:
          'A spy replaces the real implementation, letting you control its return value and assert exactly how the component under test called it, keeping the test isolated and fast.',
      },
    ],
  },
  {
    slug: 'ssr-hydration',
    title: 'SSR & Hydration',
    category: 'Architecture',
    difficulty: 'Advanced',
    summary: 'Rendering the first paint on the server, then attaching interactivity on the client without re-rendering the DOM from scratch.',
    readMinutes: 6,
    sections: [
      {
        heading: 'Why SSR exists',
        body: `Server-side rendering executes the Angular app on the server (via Node) to produce fully-formed HTML for the initial response, improving perceived load time and enabling crawlers/social-preview bots that don't execute JavaScript to see real content - both are hard to get with a pure client-side-rendered SPA, where the initial HTML is just an empty <app-root></app-root> shell.`,
      },
      {
        heading: 'Non-destructive hydration',
        body: `Before Angular's non-destructive hydration (stabilized in v17+), the client would throw away the server-rendered DOM entirely and re-render everything from scratch on load - wasteful, and it caused a visible flicker. Hydration instead reuses the existing server-rendered DOM nodes, only attaching event listeners and internal state to them, which avoids layout thrash and is significantly faster to interactive. It's enabled via provideClientHydration() in the app config.`,
        code: `export const appConfig: ApplicationConfig = {\n  providers: [provideClientHydration(withEventReplay())],\n};`,
      },
      {
        heading: 'Event replay',
        body: `withEventReplay() captures user interactions (like a click) that happen after the server HTML has painted but before hydration has finished attaching listeners, and replays them once hydration completes - so an eager user clicking a button during that gap doesn't lose the click. This directly answers the classic "what happens if a user interacts before the app is interactive" interview question.`,
      },
    ],
    quiz: [
      {
        question: 'What problem does non-destructive hydration solve compared to older SSR approaches?',
        options: [
          'It removes the need for a server entirely',
          'It reuses server-rendered DOM nodes instead of destroying and re-rendering them from scratch on the client',
          'It disables client-side JavaScript permanently',
          'It only works for static pages with no interactivity',
        ],
        correctIndex: 1,
        explanation:
          'Non-destructive hydration attaches Angular\'s runtime to the existing server-rendered DOM rather than throwing it away and re-rendering, avoiding flicker and wasted work.',
      },
      {
        question: 'What does `withEventReplay()` do?',
        options: [
          'Records analytics events for later playback in a dashboard',
          'Captures and replays user interactions that occur in the gap before hydration finishes attaching listeners',
          'Replays server logs on the client',
          'It is unrelated to hydration and only used in testing',
        ],
        correctIndex: 1,
        explanation:
          'It ensures interactions (like clicks) that happen before hydration completes are not silently lost, replaying them once the app is fully interactive.',
      },
    ],
  },
  {
    slug: 'micro-frontends',
    title: 'Module Federation & Micro-Frontends',
    category: 'Architecture',
    difficulty: 'Advanced',
    summary: 'Splitting a large Angular application across independently deployed, independently built applications.',
    readMinutes: 7,
    sections: [
      {
        heading: 'The problem micro-frontends solve',
        body: `As an organization and codebase grow, a single monolithic Angular app can become a bottleneck: every team shares one build pipeline, one deploy cadence, and one set of framework/library versions, and a bug in one team's feature can block every other team's release. Micro-frontends split the application into independently built and independently deployable pieces - typically along team or feature-domain boundaries - that are composed together at runtime in the browser.`,
      },
      {
        heading: 'Module Federation, mechanically',
        body: `Webpack Module Federation (via @angular-architects/module-federation) lets one Angular application (the "host" / "shell") dynamically load and render a component or module from an entirely separately built and deployed Angular application (the "remote") at runtime, over the network, without either needing to be recompiled together. Each remote exposes specific modules/components in its webpack config; the host loads them via a dynamic import pointed at the remote's remoteEntry.js.`,
        code: `// shell's route config\n{\n  path: 'checkout',\n  loadChildren: () =>\n    loadRemoteModule({\n      remoteEntry: 'https://checkout.example.com/remoteEntry.js',\n      remoteName: 'checkout',\n      exposedModule: './Routes',\n    }).then(m => m.CHECKOUT_ROUTES),\n}`,
      },
      {
        heading: 'Real trade-offs, not just benefits',
        body: `A senior answer must cover the costs, not just the upside: shared dependencies (Angular itself, RxJS) need careful version alignment to avoid shipping duplicate copies to the browser or, worse, subtle runtime incompatibilities; cross-remote communication needs a deliberate contract (custom events, a shared minimal state library, or URL/query-param based coordination) since remotes can't just import each other's services directly; and the operational overhead of multiple CI/CD pipelines and versioned deployments is real and should be justified by actual team-scaling pain, not adopted preemptively.`,
      },
    ],
    quiz: [
      {
        question: 'What is the core capability Module Federation provides?',
        options: [
          'Combining multiple CSS files into one at build time',
          'Loading a component/module from a separately built and deployed application at runtime',
          'Automatically translating an app into multiple languages',
          'Merging multiple Git repositories into one',
        ],
        correctIndex: 1,
        explanation:
          'Module Federation enables one application (the host) to dynamically import code exposed by another independently built and deployed application (a remote) at runtime.',
      },
      {
        question: 'What is a genuine risk teams must manage when adopting micro-frontends?',
        options: [
          'There are no real risks, it is strictly an improvement',
          'Shared dependency version alignment across remotes, plus added CI/CD and coordination overhead',
          'Micro-frontends make the app impossible to test',
          'It eliminates the need for any routing',
        ],
        correctIndex: 1,
        explanation:
          'Keeping shared libraries like Angular/RxJS aligned across independently built remotes, plus the operational cost of multiple pipelines, are real trade-offs that must be weighed against the scaling benefits.',
      },
    ],
  },
  {
    slug: 'security-xss',
    title: 'Security & Sanitization (XSS)',
    category: 'Security',
    difficulty: 'Intermediate',
    summary: "Angular's built-in defenses against cross-site scripting, and the exact APIs that bypass them on purpose.",
    readMinutes: 6,
    sections: [
      {
        heading: 'Contextual auto-sanitization',
        body: `Angular sanitizes values interpolated into HTML, style, URL, and resource URL contexts by default, stripping anything that looks like it could execute script (e.g. a <script> tag or an onerror= handler smuggled into a bound property) before it reaches the DOM. This is why {{ userComment }} bound into a template is safe even if userComment contains raw HTML from an untrusted user - Angular escapes or strips it automatically based on the context it's bound into.`,
      },
      {
        heading: 'DomSanitizer and the bypass* methods',
        body: `When you genuinely need to render trusted-but-unusual content - a known-safe SVG, an embedded YouTube iframe URL, styles from a CMS - DomSanitizer exposes bypassSecurityTrustHtml/Style/Url/ResourceUrl/Script, each explicitly marking a value as safe for that one context. These are a deliberate escape hatch, not a convenience method: calling one on unvalidated user input reintroduces the exact XSS vulnerability Angular's default sanitization exists to prevent. A senior-level answer flags this as one of the most common real-world Angular security bugs - it's used to "make the sanitizer error go away" without validating where the value actually came from.`,
        code: `constructor(private sanitizer: DomSanitizer) {}\n\n// Only safe if videoUrl truly comes from a trusted, validated source:\nget safeUrl() {\n  return this.sanitizer.bypassSecurityTrustResourceUrl(this.videoUrl);\n}`,
      },
      {
        heading: 'Other framework-level protections',
        body: `Angular's HttpClient reads an XSRF token cookie and automatically attaches it as a header on outgoing requests to same-origin, state-changing calls, providing CSRF protection with no extra app code as long as the backend sets the cookie correctly. Angular templates never use eval() or Function() to compile bindings at runtime (they're precompiled ahead-of-time by the Ivy compiler), which closes off a whole class of template-injection attacks that plague less strict templating systems.`,
      },
    ],
    quiz: [
      {
        question: 'Why is {{ userInput }} generally safe from XSS even if userInput contains a `<script>` tag?',
        options: [
          'Angular deletes the userInput variable automatically',
          "Angular's contextual auto-sanitization strips or escapes dangerous content before it reaches the DOM",
          'Browsers block all script tags by default regardless of framework',
          'It is not safe, and Angular provides no protection here',
        ],
        correctIndex: 1,
        explanation:
          'Angular sanitizes values based on the binding context (HTML, style, URL, etc.), stripping content that could execute as script before rendering it.',
      },
      {
        question: 'What is the risk of calling `bypassSecurityTrustHtml()` on raw, unvalidated user input?',
        options: [
          'There is no risk, it is always safe to call',
          'It explicitly disables sanitization for that value, reopening the exact XSS vulnerability Angular normally prevents',
          'It only affects styling, never script execution',
          'It throws a compile-time error if misused',
        ],
        correctIndex: 1,
        explanation:
          'The bypassSecurityTrust* methods tell Angular to trust a value without sanitizing it - using them on untrusted input directly reintroduces XSS risk.',
      },
    ],
  },
  {
    slug: 'ivy-compiler',
    title: 'The Ivy Compiler & Angular Internals',
    category: 'Internals',
    difficulty: 'Advanced',
    summary: "How Angular's Ivy rendering pipeline compiles templates ahead-of-time into efficient instructions.",
    readMinutes: 7,
    sections: [
      {
        heading: 'Ahead-of-Time compilation by default',
        body: `Ivy compiles every component's template into a set of low-level "instructions" (functions like ɵɵelementStart, ɵɵtext, ɵɵproperty) at build time, ahead of time (AOT) - there is no runtime template-parsing step in production, unlike the older View Engine's more indirect compilation model. This is a large part of why Ivy improved both bundle size (tree-shakeable, per-component instruction sets instead of large monolithic runtime interpreters) and startup performance.`,
        code: `// Simplified illustration of what a template compiles down to:\nfunction UserCard_Template(rf, ctx) {\n  if (rf & 1) {\n    ɵɵelementStart(0, 'h3');\n    ɵɵtext(1);\n    ɵɵelementEnd();\n  }\n  if (rf & 2) {\n    ɵɵtextInterpolate(ctx.user.name);\n  }\n}`,
      },
      {
        heading: 'Locality and incremental compilation',
        body: `A core Ivy design goal is locality: compiling one component only needs that component's own metadata, not global knowledge of the whole application's module graph. This is what makes fast incremental rebuilds during development feasible, and it's also the technical enabler for standalone components - without locality, every component's compiled output could depend on which NgModule happened to declare it.`,
      },
      {
        heading: 'Why this comes up in senior interviews',
        body: `It's less about reciting internals and more about connecting the dots: interviewers want to see that you understand Ivy isn't just "a rendering engine swap" - it's the reason tree-shakeable, per-component compilation output is possible, which is the reason standalone components, granular lazy-loading (loadComponent for a single component, not just a whole module), and smaller production bundles all became viable together as a coherent architectural shift, not as unrelated features that happened to ship around the same time.`,
      },
    ],
    quiz: [
      {
        question: 'What does it mean that Ivy compiles templates "ahead-of-time" by default?',
        options: [
          'Templates are parsed and compiled in the browser at runtime',
          'Templates are compiled into low-level instructions at build time, with no runtime template-parsing step in production',
          'Templates cannot use expressions or bindings',
          'AOT is an optional flag that most apps disable',
        ],
        correctIndex: 1,
        explanation:
          'Ivy compiles each template into instruction functions during the build, so production apps ship compiled output rather than parsing templates at runtime.',
      },
      {
        question: 'What does "locality" in the Ivy compiler enable?',
        options: [
          'Faster network requests',
          'Compiling a component using only its own metadata, independent of the whole module graph - enabling fast incremental builds and standalone components',
          'Automatic translation of templates into multiple spoken languages',
          'Removing the need for TypeScript',
        ],
        correctIndex: 1,
        explanation:
          "Because Ivy doesn't need global module-graph knowledge to compile a single component, builds can be incremental and components can exist without being declared in an NgModule at all.",
      },
    ],
  },
];

export function getTopicBySlug(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

export function getCategories(): string[] {
  return Array.from(new Set(TOPICS.map((t) => t.category))).sort();
}
