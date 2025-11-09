import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
import type { ComponentSize } from '@pathscale/ui/dist/components/types';
import { Button } from '@pathscale/ui';

export type ControlBarVariant = 'button' | 'horizontal';

export interface RtkControlbarButtonProps {
  variant?: ControlBarVariant;
  showWarning?: boolean;
  size?: ComponentSize;
  label?: string;
  icon?: JSX.Element;
  warningIcon?: JSX.Element;
  isLoading?: boolean;
  disabled?: boolean;
  brandIcon?: boolean;
  onClick?: () => void;
  class?: string;
}

export default function RtkControlbarButton(props: RtkControlbarButtonProps) {
  const isHorizontal = props.variant === 'horizontal';

  return (
    <Button
      size={props.size ?? 'md'}
      variant={isHorizontal ? 'outlined' : 'filled'}
      color={props.showWarning ? 'warning' : 'neutral'}
      loading={props.isLoading}
      disabled={props.disabled}
      class={`flex items-center gap-2 ${
        isHorizontal ? 'w-full justify-start px-4 py-2' : 'aspect-square justify-center'
      } ${props.class ?? ''}`}
      onClick={props.onClick}
      startIcon={props.icon}
      endIcon={
        props.showWarning && props.warningIcon ? (
          <span class="text-warning">{props.warningIcon}</span>
        ) : undefined
      }
      aria-label={props.label}
    >
      <Show when={isHorizontal}>
        <span>{props.label}</span>
      </Show>
    </Button>
  );
}
