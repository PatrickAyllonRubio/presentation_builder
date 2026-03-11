import useResourcesStore from '../stores/resourcesStore.js';
import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';

export function useResources() {
  const state = useResourcesStore(
    (s) => ({
      resources: s.resources,
      removeResource: s.removeResource,
      clearAllResources: s.clearAllResources,
      getResourceCounts: s.getResourceCounts,
    }),
    shallow
  );

  // Memoizar counts usando la función del store
  const counts = useMemo(
    () => state.getResourceCounts(),
    [state.resources.svg.length, state.resources.image.length, state.resources.video.length]
  );

  return {
    resources: state.resources,
    counts,
    removeResource: state.removeResource,
    clearAllResources: state.clearAllResources,
  };
}