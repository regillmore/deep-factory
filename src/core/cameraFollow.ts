export interface CameraFollowPoint {
  x: number;
  y: number;
}

export interface CameraFollowOffset {
  x: number;
  y: number;
}

export interface RecenteredCameraFollowState {
  cameraPosition: CameraFollowPoint;
  offset: CameraFollowOffset;
}

export const createCameraFollowOffset = (
  cameraPosition: CameraFollowPoint,
  targetPosition: CameraFollowPoint
): CameraFollowOffset => ({
  x: cameraPosition.x - targetPosition.x,
  y: cameraPosition.y - targetPosition.y
});

export const absorbManualCameraDeltaIntoFollowOffset = (
  offset: CameraFollowOffset,
  lastAppliedCameraPosition: CameraFollowPoint | null,
  currentCameraPosition: CameraFollowPoint
): CameraFollowOffset => {
  if (lastAppliedCameraPosition === null) {
    return {
      x: offset.x,
      y: offset.y
    };
  }

  return {
    x: offset.x + (currentCameraPosition.x - lastAppliedCameraPosition.x),
    y: offset.y + (currentCameraPosition.y - lastAppliedCameraPosition.y)
  };
};

export const resolveCameraPositionFromFollowTarget = (
  targetPosition: CameraFollowPoint,
  offset: CameraFollowOffset
): CameraFollowPoint => ({
  x: targetPosition.x + offset.x,
  y: targetPosition.y + offset.y
});

export const recenterCameraOnFollowTarget = (
  targetPosition: CameraFollowPoint
): RecenteredCameraFollowState => ({
  cameraPosition: {
    x: targetPosition.x,
    y: targetPosition.y
  },
  offset: {
    x: 0,
    y: 0
  }
});
