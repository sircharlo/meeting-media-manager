import { describe, expect, it } from 'vitest';

import { piniaBreadcrumbActionTransformer } from '../index';

describe('piniaBreadcrumbActionTransformer', () => {
  it('drops breadcrumbs for read-only query actions', () => {
    expect(piniaBreadcrumbActionTransformer('isSettingInvalid')).toBeNull();
    expect(
      piniaBreadcrumbActionTransformer('areDependenciesSatisfied'),
    ).toBeNull();
  });

  it('keeps breadcrumbs for actions that change something', () => {
    expect(piniaBreadcrumbActionTransformer('addToAdditionMediaMap')).toBe(
      'addToAdditionMediaMap',
    );
  });
});
