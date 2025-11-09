import { ParentProps, Show } from 'solid-js';
import type { ComponentSize } from '@pathscale/ui/dist/components/types';
import { Card, Flex } from '@pathscale/ui';

export interface RtkControlbarProps extends ParentProps {
  variant?: 'solid' | 'boxed';
  disableRender?: boolean;
  size?: ComponentSize;
  class?: string;
}

export default function RtkControlbar(props: RtkControlbarProps) {
  const cardVariant = props.variant === 'boxed' ? 'border' : 'filled';
  const background = props.variant === 'boxed' ? 'base-200' : 'base-300';

  return (
    <Show
      when={!props.disableRender}
      fallback={<div class="flex w-full justify-center">{props.children}</div>}
    >
      <Card
        variant={cardVariant as any}
        background={background}
        shadow="md"
        fullWidth
        class={`rounded-2xl p-2 sm:p-3 ${props.class ?? ''}`}
      >
        <Flex
          align="center"
          justify="center"
          gap={props.size === 'lg' ? 'lg' : props.size === 'sm' ? 'sm' : 'md'}
          wrap="wrap"
        >
          {props.children}
        </Flex>
      </Card>
    </Show>
  );
}
