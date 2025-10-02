export const enterFullscreen = () => {
    if (!document.fullscreenElement && document.body.requestFullscreen) {
        document.body.requestFullscreen();
    }
};

export const exitFullscreen = () => {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
};

export const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        enterFullscreen();
    } else {
        exitFullscreen();
    }
};
