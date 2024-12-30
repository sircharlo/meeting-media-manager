import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ExampleComponent from './../ExampleComponent.vue';

installQuasarPlugin();

describe('example Component', () => {
  it('should mount component with todos', async () => {
    const wrapper = mount(ExampleComponent, {
      props: {
        meta: {
          totalCount: 4,
        },
        title: 'Hello',
        todos: [
          { content: 'Hallo', id: 1 },
          { content: 'Hoi', id: 2 },
        ],
      },
    });
    // @ts-expect-error clickCount is not in the component
    expect(wrapper.vm.clickCount).toBe(0);
    await wrapper.find('.q-item').trigger('click');
    // @ts-expect-error clickCount is not in the component
    expect(wrapper.vm.clickCount).toBe(1);
  });

  it('should mount component without todos', () => {
    const wrapper = mount(ExampleComponent, {
      props: {
        meta: {
          totalCount: 4,
        },
        title: 'Hello',
      },
    });
    expect(wrapper.findAll('.q-item')).toHaveLength(0);
  });
});
