import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BoundsModel, I18nSettingsModel } from '@tailormap-viewer/api';
import { ApplicationModel, GroupModel, AuthorizationRuleGroup, AUTHORIZATION_RULE_ANONYMOUS } from '@tailormap-admin/admin-api';
import { Observable, debounceTime, filter, Subject, takeUntil } from 'rxjs';
import { FormHelper } from '../../helpers/form.helper';
import { GroupService } from '../../user/services/group.service';
import { AdminProjectionsHelper } from '../helpers/admin-projections-helper';
import { UpdateDraftApplicationModel } from '../models/update-draft-application.model';
import { LanguageHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-admin-application-form',
  templateUrl: './application-form.component.html',
  styleUrls: ['./application-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationFormComponent implements OnInit, OnDestroy {

  private _application: ApplicationModel | null = null;

  public availableLanguages = LanguageHelper.availableLanguages;

  @Input()
  public set application(application: ApplicationModel | null) {
    this._application = application;
    this.initForm(application);
  }
  public get application(): ApplicationModel | null {
    return this._application;
  }

  @Output()
  public updateApplication = new EventEmitter<UpdateDraftApplicationModel>();

  public projections = AdminProjectionsHelper.projections;

  public applicationForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9-]+$/),
      ],
    }),
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    adminComments: new FormControl(''),
    /* default to first crs from our supported collection of projections */
    crs: new FormControl(this.projections[0].code, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(5),
      ],
    }),
    defaultLanguage: new FormControl<string | null>(null),
    hideLanguageSwitcher: new FormControl<boolean | null>(null),
    initialExtent: new FormControl<BoundsModel | null>(null),
    maxExtent: new FormControl<BoundsModel | null>(null),
    authorizationRules: new FormControl<AuthorizationRuleGroup[]>([AUTHORIZATION_RULE_ANONYMOUS]),
  });


  private destroyed = new Subject();

  public get projection(): string | null {
    return this.applicationForm.get('crs')?.value || null;
  }

  public groups$: Observable<GroupModel[]>;
  constructor(groupDetailsService: GroupService) {
      this.groups$ = groupDetailsService.getGroups$();
  }

  public ngOnInit(): void {
    this.applicationForm.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        debounceTime(250),
        filter(() => this.isValidForm()),
      )
      .subscribe(value => {
        const application: Omit<ApplicationModel, 'id'> = {
          name: value.name || '',
          title: value.title || '',
          adminComments: value.adminComments || '',
          crs: value.crs || '',
          initialExtent: value.initialExtent || null,
          maxExtent: value.maxExtent || null,
          authorizationRules: value.authorizationRules || [],
        };
        const i18nSettings: I18nSettingsModel = {
          defaultLanguage: value.defaultLanguage || null,
          hideLanguageSwitcher: typeof value.hideLanguageSwitcher === 'boolean' ? value.hideLanguageSwitcher : false,
        };
        this.updateApplication.emit({ application, i18nSettings });
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private initForm(application: ApplicationModel | null) {
    this.applicationForm.patchValue({
      name: application ? application.name : '',
      title: application ? application.title : '',
      adminComments: application ? application.adminComments : '',
      crs: application ? application.crs : this.projections[0].code,
      initialExtent: application ? application.initialExtent : null,
      maxExtent: application ? application.maxExtent : null,
      defaultLanguage: typeof application?.settings?.i18nSettings?.defaultLanguage !== "undefined"
        ? application.settings.i18nSettings.defaultLanguage
        : null,
      hideLanguageSwitcher: typeof application?.settings?.i18nSettings?.hideLanguageSwitcher === "boolean"
        ? application.settings.i18nSettings.hideLanguageSwitcher
        : null,
      authorizationRules: application ? application.authorizationRules : [AUTHORIZATION_RULE_ANONYMOUS],
    }, { emitEvent: false });
  }

  private isValidForm(): boolean {
    const values = this.applicationForm.getRawValue();
    return FormHelper.isValidValue(values.name)
      && FormHelper.isValidValue(values.title)
      && FormHelper.isValidValue(values.crs)
      && this.applicationForm.dirty
      && this.applicationForm.valid;
  }

}
