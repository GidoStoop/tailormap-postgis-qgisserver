import { Injectable, NgZone } from '@angular/core';
import { OpenLayersMap } from '../openlayers-map/openlayers-map';
import { finalize, map, Observable, Subject, takeUntil, tap } from 'rxjs';
import { LayerManagerModel, MapViewerOptionsModel, ToolModel } from '../models';
import { ToolManagerModel } from '../models/tool-manager.model';

@Injectable({
  providedIn: 'root',
})
export class MapService {

  private readonly map: OpenLayersMap;

  constructor(
    private ngZone: NgZone,
  ) {
    this.map = new OpenLayersMap(this.ngZone);
  }

  public initMap(options: MapViewerOptionsModel) {
    this.map.initMap(options);
  }

  public render(el: HTMLElement) {
    this.map.render(el);
  }

  public getLayerManager$(): Observable<LayerManagerModel> {
    return this.map.getLayerManager$();
  }

  public getToolManager$(): Observable<ToolManagerModel> {
    return this.map.getToolManager$();
  }

  public createTool$(tool: ToolModel, enable?: boolean): Observable<[ ToolManagerModel, string ]> {
    let toolManager: ToolManagerModel;
    let toolId: string;
    return this.getToolManager$()
      .pipe(
        tap(manager => toolManager = manager),
        finalize(() => {
          if (!!toolId && !!toolManager) {
            toolManager.removeTool(toolId);
          }
        }),
        map(manager => {
          const id = manager.addTool(tool);
          if (enable) {
            manager.enableTool(id);
          }
          return [ manager, id ];
        }),
      );
  }

}
