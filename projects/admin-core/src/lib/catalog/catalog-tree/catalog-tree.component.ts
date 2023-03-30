import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { LoadingStateEnum, TreeService } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import {
  selectCatalogLoadError, selectCatalogLoadStatus, selectCatalogTree,
} from '../state/catalog.selectors';
import { expandTree, loadCatalog } from '../state/catalog.actions';
import { BehaviorSubject, filter, map, Observable, of, Subject, take, takeUntil } from 'rxjs';
import { CatalogTreeModel, CatalogTreeModelMetadataTypes } from '../models/catalog-tree.model';
import { CatalogTreeHelper } from '../helpers/catalog-tree.helper';
import { CatalogService } from '../services/catalog.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RoutesEnum } from '../../routes';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';

@Component({
  selector: 'tm-admin-catalog-tree',
  templateUrl: './catalog-tree.component.html',
  styleUrls: ['./catalog-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TreeService],
})
export class CatalogTreeComponent implements OnInit, OnDestroy {

  public isLoading$: Observable<boolean> = of(false);
  public errorMessage$: Observable<string | null> = of(null);
  private destroyed = new Subject();

  private selectedNodeId = new BehaviorSubject<string>('');

  constructor(
    private treeService: TreeService<CatalogTreeModelMetadataTypes, CatalogTreeModelTypeEnum>,
    private store$: Store,
    private catalogService: CatalogService,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  public ngOnInit(): void {
    this.isLoading$ = this.store$.select(selectCatalogLoadStatus)
      .pipe(map(loadStatus => loadStatus === LoadingStateEnum.LOADING));
    this.errorMessage$ = this.store$.select(selectCatalogLoadError)
      .pipe(map(error => error || null));
    const catalogTree$ = this.store$.select(selectCatalogTree)
      .pipe(
        filter(tree => !!tree && tree.length > 0),
        map((tree, idx) => {
          if (idx === 0) {
            this.expandTreeToSelectedItem();
          }
          return tree;
        }),
      );
    this.treeService.setDataSource(catalogTree$, () => true);
    this.treeService.nodeExpansionChangedSource$
      .pipe(takeUntil(this.destroyed))
      .subscribe(({ node, expanded }) => this.toggleExpansion(node, expanded));
    this.treeService.setSelectedNode(this.selectedNodeId.asObservable());

    this.route.url
      .pipe(takeUntil(this.destroyed))
      .subscribe(() => {
        const deconstructedUrl = this.readNodesFromUrl();
        const lastItem = deconstructedUrl.pop();
        this.selectedNodeId.next(lastItem ? lastItem.treeNodeId : '');
      });

    this.store$.select(selectCatalogLoadStatus)
      .pipe(take(1))
      .subscribe(loadStatus => {
        if (loadStatus === LoadingStateEnum.INITIAL || loadStatus === LoadingStateEnum.LOADED) {
          this.store$.dispatch(loadCatalog());
        }
      });
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public onRetryClick() {
    this.store$.dispatch(loadCatalog());
  }

  private toggleExpansion(node: CatalogTreeModel, expanded: boolean) {
    if (CatalogTreeHelper.isExpandableNode(node) && node.metadata && node.type) {
      this.store$.dispatch(expandTree({ id: node.metadata.id, nodeType: node.type }));
    }
    if (expanded && CatalogTreeHelper.isCatalogNode(node) && !!node.metadata) {
      this.catalogService.loadCatalogNodeItems$(node.metadata.id).subscribe();
    }
  }

  private readNodesFromUrl(): Array<{ type: CatalogTreeModelTypeEnum; treeNodeId: string; id: string }> {
    const currentRoute = this.router.url
      .replace(RoutesEnum.CATALOG, '')
      .split('/')
      .filter(part => !!part);
    const parts: Array<{ type: CatalogTreeModelTypeEnum; treeNodeId: string; id: string }> = [];
    if (currentRoute.length >= 2 && currentRoute[0] === 'node') {
      parts.push({ type: CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE, treeNodeId: CatalogTreeHelper.getIdForCatalogNode(currentRoute[1]), id: currentRoute[1] });
    }
    if (currentRoute.length >= 4 && currentRoute[2] === 'service') {
      parts.push({ type: CatalogTreeModelTypeEnum.SERVICE_TYPE, treeNodeId: CatalogTreeHelper.getIdForServiceNode(currentRoute[3]), id: currentRoute[3] });
    }
    if (currentRoute.length >= 4 && currentRoute[2] === 'feature-source') {
      parts.push({ type: CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE, treeNodeId: CatalogTreeHelper.getIdForFeatureSourceNode(currentRoute[3]), id: currentRoute[3] });
    }
    if (currentRoute.length >= 6 && currentRoute[4] === 'feature-type') {
      parts.push({ type: CatalogTreeModelTypeEnum.FEATURE_TYPE_TYPE, treeNodeId: CatalogTreeHelper.getIdForFeatureTypeNode(currentRoute[5]), id: currentRoute[5] });
    }
    if (currentRoute.length >= 6 && currentRoute[4] === 'layer') {
      parts.push({ type: CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE, treeNodeId: CatalogTreeHelper.getIdForLayerNode(currentRoute[5]), id: currentRoute[5] });
    }
    return parts;
  }

  private expandTreeToSelectedItem() {
    const urlParts = this.readNodesFromUrl();
    if (urlParts.length === 0) {
      return;
    }
    this.catalogService.expandTreeToSelectedItem(urlParts);
  }

}
