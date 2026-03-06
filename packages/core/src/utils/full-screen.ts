export const requestFullScreen = (el: HTMLElement) => {
  if (el == null) return;

  if (el.requestFullscreen != null) {
    el.requestFullscreen();
  } else if (el.mozRequestFullScreen != null) {
    /* Firefox */
    el.mozRequestFullScreen();
  } else if (el.webkitRequestFullscreen != null) {
    /* Chrome, Safari & Opera */
    el.webkitRequestFullscreen();
  } else if (el.msRequestFullscreen != null) {
    /* IE/Edge */
    el.msRequestFullscreen();
  }
};

export const exitFullScreen = () => {
  if (document.exitFullscreen != null) {
    document.exitFullscreen();
  } else if (document.mozExitFullScreen != null) {
    /* Firefox */
    document.mozExitFullScreen();
  } else if (document.webkitExitFullscreen != null) {
    /* Chrome, Safari & Opera */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen != null) {
    /* IE/Edge */
    document.msExitFullscreen();
  }
};

export const isFullScreenEnabled = () => {
  return document.fullscreenElement != null || document.webkitCurrentFullScreenElement != null;
};

export const isFullScreenSupported = () => {
  if (typeof document !== 'undefined') {
    return (
      document.fullscreenEnabled ||
      (document as any).mozFullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).msFullscreenEnabled
    );
  }

  return false;
};
