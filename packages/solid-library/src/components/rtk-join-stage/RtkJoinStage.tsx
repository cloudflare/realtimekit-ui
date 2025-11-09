import { createSignal, Show } from 'solid-js';
import { Modal, Button, Flex, Loading } from '@pathscale/ui';

export interface RtkJoinStageProps {
  open: boolean;
  onJoin: () => Promise<void> | void;
  onCancel: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function RtkJoinStage(props: RtkJoinStageProps) {
  const [isLoading, setIsLoading] = createSignal(false);

  const handleJoin = async () => {
    if (isLoading()) return;
    setIsLoading(true);

    try {
      await props.onJoin?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal open={props.open} onClose={props.onCancel} backdrop size="md">
      <Modal.Header>
        <h3 class="text-lg font-semibold">{props.title ?? 'Join Stage'}</h3>
      </Modal.Header>

      <Modal.Body>
        <p class="text-base-content">
          {props.description ??
            `You're about to join the stage. Your microphone and camera may become visible to others.`}
        </p>
      </Modal.Body>

      <Modal.Actions class="justify-end">
        <Button variant="outline" color="neutral" onClick={props.onCancel} disabled={isLoading()}>
          {props.cancelLabel ?? 'Cancel'}
        </Button>

        <Button variant="filled" color="primary" onClick={handleJoin} disabled={isLoading()}>
          <Show when={isLoading()} fallback={props.confirmLabel ?? 'Join Stage'}>
            <Flex align="center" gap="sm">
              <Loading size="sm" />
              <span>Joining...</span>
            </Flex>
          </Show>
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
