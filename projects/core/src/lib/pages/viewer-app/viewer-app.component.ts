import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { map, Observable, of, Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { loadApplication } from '../../state/core.actions';
import { selectApplicationErrorMessage, selectApplicationLoadingState } from '../../state/core.selectors';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-viewer-app',
  templateUrl: './viewer-app.component.html',
  styleUrls: ['./viewer-app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerAppComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  public isLoading = false;
  public loadingFailed = false;
  public isLoaded = false;
  public errorMessage$: Observable<string | undefined> = of(undefined);

  constructor(
    private store$: Store,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) { }

  public ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroyed),
        map((params: ParamMap) => {
          const id = params.get('id');
          if (id) {
            return { id: +(id) };
          }
          const name = params.get('name');
          if (name) {
            return { name, version: params.get('version') || undefined };
          }
          return null;
        }),
      )
      .subscribe(loadApplicationParams => {
        this.store$.dispatch(loadApplication(loadApplicationParams || {}));
      });

    this.errorMessage$ = this.store$.select(selectApplicationErrorMessage);
    this.store$.select(selectApplicationLoadingState)
      .pipe(takeUntil(this.destroyed))
      .subscribe(loadingState => {
        this.isLoaded = loadingState === LoadingStateEnum.LOADED;
        this.isLoading = loadingState === LoadingStateEnum.LOADING;
        this.loadingFailed = loadingState === LoadingStateEnum.FAILED;
        this.cdr.detectChanges();
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
