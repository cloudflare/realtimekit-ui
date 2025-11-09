import { Modal, Button } from '@pathscale/ui';

export interface RtkLeaveMeetingProps {
  open: boolean;
  onClose: () => void;
  onLeave?: () => void;
  onEndAll?: () => void;
  canEndMeeting?: boolean;
  canJoinMainRoom?: boolean;
  onJoinMainRoom?: () => void;
  title?: string;
  message?: string;
}

export default function RtkLeaveMeeting(props: RtkLeaveMeetingProps) {
  const {
    open,
    onClose,
    onLeave,
    onEndAll,
    onJoinMainRoom,
    canEndMeeting = false,
    canJoinMainRoom = false,
    title = 'Leave Meeting',
    message = 'Are you sure you want to leave this meeting?',
  } = props;

  return (
    <Modal open={open} onClose={onClose} backdrop>
      <Modal.Header>
        <h3 class="text-lg font-semibold">{title}</h3>
      </Modal.Header>

      <Modal.Body>
        <p class="text-base-content">{message}</p>
      </Modal.Body>

      <Modal.Actions class="justify-end">
        <Button variant="outline" color="neutral" onClick={onClose}>
          Cancel
        </Button>

        {canJoinMainRoom && (
          <Button variant="soft" color="primary" onClick={onJoinMainRoom}>
            Return to Main Room
          </Button>
        )}

        <Button variant="filled" color="error" onClick={onLeave}>
          Leave
        </Button>

        {canEndMeeting && (
          <Button variant="filled" color="error" onClick={onEndAll}>
            End for All
          </Button>
        )}
      </Modal.Actions>
    </Modal>
  );
}
