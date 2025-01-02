/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Store, StoreDefinition } from 'pinia';
import type { Mock } from 'vitest';
import type { UnwrapRef } from 'vue';

export function mockedStore<TStoreDef extends () => unknown>(
  useStore: TStoreDef,
): TStoreDef extends StoreDefinition<
  infer Id,
  infer State,
  infer Getters,
  infer Actions
>
  ? {
      [K in keyof Getters]: UnwrapRef<Getters[K]>;
    } & Store<
      Id,
      State,
      Record<string, never>,
      {
        [K in keyof Actions]: Actions[K] extends (...args: any[]) => any
          ? // 👇 depends on your testing framework
            Mock<Actions[K]>
          : Actions[K];
      }
    >
  : ReturnType<TStoreDef> {
  return useStore() as any;
}
