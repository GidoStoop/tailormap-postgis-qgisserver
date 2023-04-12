import { render, screen, waitFor } from '@testing-library/angular';
import { GeoServiceFormDialogComponent } from './geo-service-form-dialog.component';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { SharedModule } from '@tailormap-viewer/shared';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { getGeoService } from '@tailormap-admin/admin-api';
import { GeoServiceFormComponent } from '../geo-service-form/geo-service-form.component';
import { GeoServiceService } from '../services/geo-service.service';
import { createGeoServiceMock } from '../helpers/mocks/geo-service.service.mock';
import { TestSaveHelper } from '../../test-helpers/test-save.helper';
import { SaveButtonComponent } from '../../shared/components/save-button/save-button.component';

const setup = async (editMode = false) => {
  const dialogRefMock = { close: jest.fn() };
  const { geoServiceService, updateGeoService$, updateGeoServiceDetails } = createGeoServiceMock();
  await render(GeoServiceFormDialogComponent, {
    imports: [SharedModule],
    declarations: [ GeoServiceFormComponent, SaveButtonComponent ],
    providers: [
      { provide: MatDialogRef, useValue: dialogRefMock },
      { provide: GeoServiceService, useValue: geoServiceService },
      { provide: MAT_DIALOG_DATA, useValue: { geoService: editMode ? getGeoService({ id: '2', title: 'my service', url: 'http://test.service' }) : null, parentNode: '1' } },
    ],
  });
  return {
    geoServiceService,
    dialogRefMock,
    updateGeoService$,
    updateGeoServiceDetails,
  };
};

describe('GeoServiceFormDialogComponent', () => {

  test('should render and handle cancel', async () => {
    const { dialogRefMock } = await setup();
    expect(screen.getByText('Create new service')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Cancel'));
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

  test('should save new node', async () => {
    const { geoServiceService, dialogRefMock } = await setup();
    expect(screen.getByText('Create new service')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('URL'), 'http://www.super-service.com');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save');
    expect(geoServiceService.createGeoService$).toHaveBeenCalledWith({
      url: 'http://www.super-service.com',
      title: '',
      protocol: 'wms',
    }, '1');
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

  test('should edit node', async () => {
    const { updateGeoService$, updateGeoServiceDetails, dialogRefMock } = await setup(true);
    expect(screen.getByText('Edit my service')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('wms'));
    await userEvent.click(await screen.findByText('wmts'));
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save');
    expect(updateGeoService$).toHaveBeenCalledWith('2', expect.anything());
    expect(updateGeoServiceDetails).toHaveBeenCalledWith({
      url: 'http://test.service',
      title: 'my service',
      protocol: 'wmts',
    });
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

});