import type { JSX } from 'solid-js';
import type { ComponentSize, ComponentVariant } from '@pathscale/ui/dist/components/types';
import { Button, Tooltip, toastStore } from '@pathscale/ui';

export interface RtkLeaveButtonProps {
  size?: ComponentSize;
  variant?: ComponentVariant;
  onLeave?: () => void;
  label?: string;
  icon?: JSX.Element;
}

export default function RtkLeaveButton(props: RtkLeaveButtonProps) {
  const { size = 'md', variant = 'filled', label = 'Leave', icon, onLeave } = props;

  const handleClick = () => {
    toastStore.showWarning('Leaving the meeting...');
    onLeave?.();
  };

  return (
    <Tooltip message={label} position="top">
      <Button
        size={size}
        variant={variant}
        color="error"
        onClick={handleClick}
        startIcon={icon}
        class="leave red-icon"
      >
        {label}
      </Button>
    </Tooltip>
  );
}
