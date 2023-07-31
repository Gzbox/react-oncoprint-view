import _ from 'lodash';
import { OncoprintJS } from 'oncoprintjs';
import * as React from 'react';
import { transition } from './DeltaUtils';
import './styles.scss';

export const GENETIC_TRACK_GROUP_INDEX = 1;
export const CLINICAL_TRACK_GROUP_INDEX = 0;

const Oncoprint = (props) => {
  const divRefHandler = React.useRef(null);
  const oncoprintJs = React.useRef(null);
  const [lastTransitionProps, setLastTransitionProps] = React.useState({});
  const [trackSpecKeyToTrackId, setTrackSpecKeyToTrackId] = React.useState({});

  const getTrackSpecKey = (targetTrackId) => {
    let ret = null;

    _.forEach(this.trackSpecKeyToTrackId, (trackId, key) => {
      if (trackId === targetTrackId) {
        ret = key;
        return false;
      }
    });

    return ret;
  };

  const refreshOncoprint = (params) => {
    const start = performance.now();

    if (!oncoprintJs.current) {
      // instantiate new one
      oncoprintJs.current = new OncoprintJS(
        `#${params.divId}`,
        params.width,
        params.initParams,
      );
      oncoprintJs.current?.setTrackGroupLegendOrder([
        GENETIC_TRACK_GROUP_INDEX,
        CLINICAL_TRACK_GROUP_INDEX,
      ]);
      window.frontendOnc = oncoprintJs.current;
      if (params.broadcastOncoprintJsRef) {
        params.broadcastOncoprintJsRef(oncoprintJs.current);
      }
    }

    if (!oncoprintJs.current?.webgl_unavailable && oncoprintJs.current) {
      console.log('refreshOncoprint', oncoprintJs.current);
      transition(
        params,
        lastTransitionProps,
        oncoprintJs.current,
        () => trackSpecKeyToTrackId,
        () => {
          return params.molecularProfileIdToMolecularProfile;
        },
      );
      setLastTransitionProps(params);
    }
    console.log('oncoprint render time: ', performance.now() - start);
  };

  React.useEffect(() => {
    console.log('props:%o', props);
    refreshOncoprint(props);
    return () => {
      console.log('oncoprint unmount');
      oncoprintJs.current && oncoprintJs.current.destroy();
      oncoprintJs.current = null;
    };
  }, [props]);

  return <div id={props.divId} ref={divRefHandler} />;
};

export default React.memo(Oncoprint);
