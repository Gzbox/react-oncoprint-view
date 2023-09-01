import { useSize } from 'ahooks';
import _ from 'lodash';
import { OncoprintJS } from 'oncoprintjs';
import * as React from 'react';
import { transition } from './DeltaUtils';
import './styles.scss';

export const GENETIC_TRACK_GROUP_INDEX = 1;
export const CLINICAL_TRACK_GROUP_INDEX = 0;
const Oncoprint = (props) => {
  console.log('Oncoprint', props);
  const divRefHandler = React.useRef(null);
  const divSize = useSize(divRefHandler);
  const oncoprintJsRef = React.useRef(null);
  const lastTransitionProps = React.useRef({});
  const trackSpecKeyToTrackId = React.useRef({});

  const getTrackSpecKey = (targetTrackId) => {
    let ret = null;
    _.forEach(trackSpecKeyToTrackId.current, (trackId, key) => {
      if (trackId === targetTrackId) {
        ret = key;
        return false;
      }
    });
    return ret;
  };

  const sortByMutationType = () => {
    return (
      props.distinguishMutationType &&
      props.sortConfig &&
      props.sortConfig.sortByMutationType
    );
  };

  const sortByDrivers = () => {
    return (
      props.distinguishDrivers &&
      props.sortConfig &&
      props.sortConfig.sortByDrivers
    );
  };

  const refreshOncoprint = (params) => {
    const start = performance.now();
    if (!oncoprintJsRef.current) {
      // instantiate new one
      oncoprintJsRef.current = new OncoprintJS(
        `#react-oncoprintjs-view-container-div`,
        params.width,
        params.initParams,
      );
      oncoprintJsRef.current.setTrackGroupLegendOrder([
        GENETIC_TRACK_GROUP_INDEX,
        CLINICAL_TRACK_GROUP_INDEX,
      ]);
      window.frontendOnc = oncoprintJsRef.current;
      if (params.broadcastOncoprintJsRef) {
        params.broadcastOncoprintJsRef(oncoprintJsRef.current);
      }
    }
    if (!oncoprintJsRef.current.webgl_unavailable) {
      transition(
        params,
        lastTransitionProps.current || {},
        oncoprintJsRef.current,
        () => trackSpecKeyToTrackId.current,
        () => {
          return params.molecularProfileIdToMolecularProfile;
        },
      );
      lastTransitionProps.current = _.clone(params);
    }
    console.log('oncoprint render time: ', performance.now() - start);
  };

  React.useEffect(() => {
    refreshOncoprint({
      ...props,
      width: divSize?.width || divRefHandler?.current?.offsetWidth,
    });
  }, [props, divSize?.width]);

  React.useEffect(() => {
    return () => {
      if (oncoprintJsRef.current) {
        oncoprintJsRef.current.destroy();
        oncoprintJsRef.current = undefined;
      }
    };
  }, []);
  return <div id="react-oncoprintjs-view-container-div" ref={divRefHandler} />;
};

export default Oncoprint;
