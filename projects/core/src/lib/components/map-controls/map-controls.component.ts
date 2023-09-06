import {
  Component, OnInit, ChangeDetectionStrategy, ComponentRef, ViewChild, ViewContainerRef, OnDestroy, Input,
} from '@angular/core';
import { MapControlsService } from './map-controls.service';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { DynamicComponentsHelper } from '@tailormap-viewer/shared';
import { ComponentModel } from '@tailormap-viewer/api';
import { ComponentConfigHelper } from '../../shared/helpers/component-config.helper';

@Component({
  selector: 'tm-map-controls',
  templateUrl: './map-controls.component.html',
  styleUrls: ['./map-controls.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapControlsComponent implements OnInit, OnDestroy {

  @Input({ required: true })
  public config: ComponentModel[] = [];

  private destroyed = new Subject();

  private injectedComponents: ComponentRef<any>[] = [];

  @ViewChild('mapControlsContainer', { read: ViewContainerRef, static: true })
  private mapControlsContainer: ViewContainerRef | null = null;

  constructor(
    private mapControlsService: MapControlsService,
  ) { }

  public ngOnInit(): void {
    this.mapControlsService.getRegisteredComponents$()
      .pipe(
        takeUntil(this.destroyed),
        debounceTime(10),
      )
      .subscribe(components => {
        if (!this.mapControlsContainer) {
          return;
        }
        DynamicComponentsHelper.destroyComponents(this.injectedComponents);
        this.injectedComponents = DynamicComponentsHelper.createComponents(
          ComponentConfigHelper.filterDisabledComponents(components, this.config),
          this.mapControlsContainer,
        );
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
