import {
  Component, ChangeDetectionStrategy, Input, OnChanges, Output, EventEmitter, SimpleChanges, DestroyRef,
} from '@angular/core';
import { AttributeDescriptorModel, FeatureTypeSettingsModel } from '@tailormap-admin/admin-api';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ArrayHelper } from '@tailormap-viewer/shared';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AttributeTypeHelper } from "@tailormap-viewer/api";

type CheckableAttribute =  'hidden' | 'readonly';

const attributeColumnLabels = [ 'label-enabled', 'label-editable', 'label-name', 'label-type', 'label-alias' ];
const attributeColumns = [ 'enabled', 'editable', 'name', 'type', 'alias' ];

const attributeExtraColumnLabels = ['label-sort'];
const attributeExtraColumns = ['sort'];

@Component({
  selector: 'tm-admin-feature-type-attributes',
  templateUrl: './feature-type-attributes.component.html',
  styleUrls: ['./feature-type-attributes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureTypeAttributesComponent implements OnChanges {

  public columnLabels = attributeColumnLabels;
  public columns = attributeColumns;

  @Input()
  public attributes: AttributeDescriptorModel[] = [];

  @Input()
  public featureTypeSettings: FeatureTypeSettingsModel | null = null;

  @Input()
  public catalogFeatureTypeSettings: FeatureTypeSettingsModel | null = null;

  @Input()
  public set showFullSettings(showFullSettings: boolean) {
    this.columnLabels = showFullSettings
      ? [ ...attributeColumnLabels, ...attributeExtraColumnLabels ]
      : attributeColumnLabels;
    this.columns = showFullSettings
      ? [ ...attributeColumns, ...attributeExtraColumns ]
      : attributeColumns;
  }

  @Output()
  public attributeEnabledChanged = new EventEmitter<Array<{ attribute: string; checked: boolean }>>();

  @Output()
  public attributeReadonlyChanged = new EventEmitter<Array<{ attribute: string; checked: boolean }>>();

  @Output()
  public attributeOrderChanged = new EventEmitter<string[]>();

  @Output()
  public aliasesChanged = new EventEmitter<Array<{ attribute: string; alias: string | undefined }>>();

  public catalogFeatureTypeReadOnly: Set<string> = new Set();

  public aliasForm: FormGroup = new FormGroup({});

  public someChecked: Record<CheckableAttribute, boolean> = { hidden: false, readonly: false };
  public allChecked: Record<CheckableAttribute, boolean> = { hidden: false, readonly: false };
  public checkedAttributes: Record<CheckableAttribute, Set<string>> = { hidden: new Set<string>(), readonly: new Set<string>() };

  public dataAttributes: Array<AttributeDescriptorModel & { alias?: string }> = [];
  public geomAttributes: AttributeDescriptorModel[] = [];

  constructor(
    private destroyRef: DestroyRef,
  ) {
    this.aliasForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(values => {
        const updatedAliases = Object.keys(values)
          .map(attribute => ({ attribute, alias: values[attribute] || undefined }));
        this.aliasesChanged.emit(updatedAliases);
      });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    const attributesChanged = !!changes['attributes'];
    if (this.attributes && (attributesChanged || this.changedSettings(changes, 'attributeOrder'))) {
      const attributeOrder = this.featureTypeSettings?.attributeOrder || [];
      const sortedAttributes = [...this.attributes].sort(ArrayHelper.getArraySorter('name', attributeOrder));
      this.dataAttributes = sortedAttributes.filter(a => !AttributeTypeHelper.isGeometryType(a.type));
      this.geomAttributes = sortedAttributes.filter(a => AttributeTypeHelper.isGeometryType(a.type));
    }
    if (this.attributes && attributesChanged) {
      const aliases = this.featureTypeSettings?.attributeSettings || {};
      Object.keys(this.aliasForm.controls).forEach(ctrl => this.aliasForm.removeControl(ctrl));
      this.dataAttributes.forEach(att => {
        const control = new FormControl<string>(aliases[att.name]?.title || '');
        if (!this.showFullSettings) {
          control.disable({ onlySelf: true, emitEvent: false });
        }
        this.aliasForm.addControl(att.name, control, { emitEvent: false });
      });
    }
    this.updateChecked(changes, 'hidden');
    this.updateChecked(changes, 'readonly');
    this.catalogFeatureTypeReadOnly = new Set(this.catalogFeatureTypeSettings?.readOnlyAttributes || []);
  }

  public toggleAllAttributes(type: CheckableAttribute) {
    const updatedAttributesChecked = this.dataAttributes.map(a => ({ attribute: a.name, checked: !this.allChecked[type] }));
    if (type === 'hidden') {
      this.attributeEnabledChanged.emit(updatedAttributesChecked);
    }
    if (type === 'readonly') {
      this.attributeReadonlyChanged.emit(updatedAttributesChecked);
    }
  }

  public toggleAttribute(type: CheckableAttribute, attribute: string) {
    const updatedAttributeChecked = [{ attribute, checked: !this.isAttributeEnabled(type, attribute) }];
    if (type === 'hidden') {
      this.attributeEnabledChanged.emit(updatedAttributeChecked);
    }
    if (type === 'readonly' && !this.isReadonlyFieldDisabled(attribute)) {
      this.attributeReadonlyChanged.emit(updatedAttributeChecked);
    }
  }

  public isAttributeEnabled(type: CheckableAttribute, attribute: string) {
    return this.checkedAttributes[type].has(attribute);
  }

  public updateChecked(changes: SimpleChanges, type: CheckableAttribute) {
    const attribute = type === 'hidden' ? 'hideAttributes' : 'readOnlyAttributes';
    if (this.changedSettings(changes, attribute)) {
      const hideAttributes = new Set((this.featureTypeSettings ? this.featureTypeSettings[attribute] : []) || []);
      this.checkedAttributes[type] = new Set(this.dataAttributes
        .map(a => a.name)
        .filter(a => !hideAttributes.has(a)));
      this.allChecked[type] = this.checkedAttributes[type].size === this.dataAttributes.length;
      this.someChecked[type] = this.checkedAttributes[type].size !== 0 && !this.allChecked[type];
    }
  }

  public dropTable($event: CdkDragDrop<AttributeDescriptorModel[], any>) {
    const attributes = [...this.dataAttributes];
    moveItemInArray(attributes, $event.previousIndex, $event.currentIndex);
    this.attributeOrderChanged.emit(attributes.map(a => a.name));
  }

  private changedSettings(changes: SimpleChanges, item: keyof FeatureTypeSettingsModel) {
    if (!changes['featureTypeSettings'] || !changes['featureTypeSettings'].previousValue) {
      return true;
    }
    return this.featureTypeSettings && this.featureTypeSettings[item] !== changes['featureTypeSettings'].previousValue[item];
  }

  public getTooltip(attributeName: string) {
    return this.catalogFeatureTypeReadOnly.has(attributeName)
      ? $localize `:@@admin-core.catalog.readonly-in-catalog:This attribute is set to not editable in the catalog and cannot be changed here`
      : null;
  }

  public isReadonlyFieldDisabled(attributeName: string) {
    return !this.isAttributeEnabled('hidden', attributeName)
      || this.catalogFeatureTypeReadOnly.has(attributeName);
  }

  public isReadonlyFieldChecked(attributeName: string) {
    return this.isAttributeEnabled('readonly', attributeName)
      && this.isAttributeEnabled('hidden', attributeName)
      && !this.catalogFeatureTypeReadOnly.has(attributeName);
  }

}
