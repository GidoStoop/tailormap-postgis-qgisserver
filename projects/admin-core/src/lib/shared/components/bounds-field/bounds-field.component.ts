import {
  Component, OnInit, ChangeDetectionStrategy, Input, forwardRef, ChangeDetectorRef, Output, EventEmitter, OnDestroy,
} from '@angular/core';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BoundsModel } from '@tailormap-viewer/api';
import { Subject, takeUntil } from 'rxjs';
import { AdminProjectionsHelper } from '../../../application/helpers/admin-projections-helper';

@Component({
  selector: 'tm-admin-bounds-form-field',
  templateUrl: './bounds-field.component.html',
  styleUrls: ['./bounds-field.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BoundsFieldComponent),
      multi: true,
    },
  ],
})
export class BoundsFieldComponent implements OnInit, OnDestroy, ControlValueAccessor {

  private _bounds: BoundsModel | null = null;
  private _projection: string | null = null;
  private destroyed = new Subject();

  @Input()
  public set bounds(bounds: BoundsModel | null) {
    this._bounds = bounds;
    if (bounds) {
      this.boundsForm.patchValue(bounds, { emitEvent: false });
    }
  }

  public get bounds(): BoundsModel | null {
    return this._bounds;
  }

  @Input()
  public set projection(projection: string | null) {
    this._projection = projection;
  }

  public get projection(): string | null {
    return this._projection;
  }

  @Input()
  public label: string | null = null;

  @Output()
  public changed = new EventEmitter<BoundsModel | null>();

  public disabled = false;
  private onChange: any | null = null;
  private onTouched: any | null = null;

  public boundsForm = new FormGroup({
    minx: new FormControl<number | null>(null),
    miny: new FormControl<number | null>(null),
    maxx: new FormControl<number | null>(null),
    maxy: new FormControl<number | null>(null),
  });

  constructor(private cdr: ChangeDetectorRef) {
  }

  public ngOnInit(): void {
    this.boundsForm.valueChanges
      .pipe(takeUntil(this.destroyed))
      .subscribe(bounds => {
        this.triggerChange(bounds);
      });
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public writeValue(obj: BoundsModel | null): void {
    this.bounds = obj;
    this.cdr.detectChanges();
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.boundsForm.disable();
    }
  }

  public setBoundsForProjection(projection: string | null) {
    if (!projection) {
      return;
    }
    const bounds = AdminProjectionsHelper.find(projection)?.bounds;
    if (bounds) {
      this.boundsForm.patchValue(bounds, { emitEvent: true });
    }
  }

  private triggerChange(bounds: typeof this.boundsForm.value) {
    if (typeof bounds.minx !== 'number'
      || typeof bounds.miny !== 'number'
      || typeof bounds.maxx !== 'number'
      || typeof bounds.maxy !== 'number'
    ) {
      return;
    }
    const boundsModel: BoundsModel = {
      minx: bounds.minx,
      miny: bounds.miny,
      maxx: bounds.maxx,
      maxy: bounds.maxy,
      crs: this.projection || undefined,
    };
    if (this.onChange) {
      this.onChange(boundsModel);
    }
    this.changed.emit(boundsModel);
  }

}
