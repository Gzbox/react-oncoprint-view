---
nav:
  title: Preview
  order: 0
---

# Demo

```jsx
import { Fragment, memo, useEffect, useRef, useState } from 'react';
import { OncoPrintView } from 'react-oncoprint-view';
import { mockData } from '../../mockData.js';
export default () => {
  const oncoPrintViewRef = useRef(null);
  const [minMap, setMinMap] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [showWhitespace, setShowWhitespace] = useState(true);
  const [linkOutIn, setLinkOutIn] = useState(false);
  const [keepSorted, setKeepSorted] = useState(true);
  const [currentHorzZoomValue, setCurrentHorzZoomValue] = useState();
  const [showClinicalTrackLegends, setShowClinicalTrackLegends] =
    useState(true);
  const [distinguishMutationType, setDistinguishMutationType] = useState(true);
  const [distinguishGermlineMutations, setDistinguishGermlineMutations] =
    useState(true);
  const [distinguishDrivers, setDistinguishDrivers] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  // 放大
  const onZoomInClick = () => {
    // console.log('zoom in', oncoPrintViewRef.current);
    oncoPrintViewRef.current?.setHorzZoom(
      oncoPrintViewRef.current.getHorzZoom() / 0.7,
    );
  };

  // 缩小
  const onZoomOutClick = () => {
    // console.log('zoom out');
    oncoPrintViewRef.current?.setHorzZoom(
      oncoPrintViewRef.current.getHorzZoom() * 0.7,
    );
  };

  return (
    <Fragment>
      <div>
        <button onClick={() => setMinMap(!minMap)}>小地图</button>
        <button onClick={() => setShowWhitespace(!showWhitespace)}>
          显示空白间隙
        </button>
        <button onClick={() => setLinkOutIn(!linkOutIn)}>样本支持跳转</button>
        <button onClick={() => setKeepSorted(!keepSorted)}>保持排序</button>
        <button
          onClick={() => setShowClinicalTrackLegends(!showClinicalTrackLegends)}
        >
          显示临床轨迹
        </button>
        <button
          onClick={() => setDistinguishMutationType(!distinguishMutationType)}
        >
          显示突变类型
        </button>
        <button
          onClick={() =>
            setDistinguishGermlineMutations(!distinguishGermlineMutations)
          }
        >
          显示区分种系突变
        </button>
        <button onClick={() => setDistinguishDrivers(!distinguishDrivers)}>
          显示突变驱动
        </button>
        <button onClick={onZoomOutClick}>缩小</button>
        <button disabled="true">{currentHorzZoomValue || '1'}</button>
        <button onClick={onZoomInClick}>放大</button>
      </div>
      <OncoPrintView
        {...mockData}
        showMinimap={minMap} // 是否显示小地图
        suppressRendering={isLoading} //  抑制渲染
        showWhitespaceBetweenColumns={showWhitespace} // 是否显示空白间隙
        caseLinkOutInTooltips={linkOutIn} // 是否将病例链接到案例中
        keepSorted={keepSorted} // 是否保持排序
        showClinicalTrackLegends={showClinicalTrackLegends} // 是否显示临床轨迹
        distinguishMutationType={distinguishMutationType} // 是否显示突变类型
        distinguishGermlineMutations={distinguishGermlineMutations} // 是否显示区分种系突变
        distinguishDrivers={distinguishDrivers} // 是否显示突变驱动
        hiddenIds={[]}
        sortConfig={{ sortByMutationType: true, sortByDrivers: true }}
        broadcastOncoprintJsRef={(oncoprintRef) => {
          console.log('oncoprintRef:%o', oncoprintRef);
          oncoPrintViewRef.current = oncoprintRef;
        }}
        geneticTracksOrder={[]}
        onSuppressRendering={() => {
          console.log('onSuppressRendering');
        }}
        onReleaseRendering={() => {
          console.log('onReleaseRendering');
        }}
        onMinimapClose={() => {
          console.log('onMinimapClose');
        }}
        onHorzZoom={(value) => {
          console.log('onHorzZoom', value);
          setCurrentHorzZoomValue(value);
        }}
        onDeleteClinicalTrack={(key) => {
          console.log(key);
        }}
        onTrackGapChange={(trackId, gapOn) => {
          console.log(trackId, gapOn);
        }}
        onTrackSortDirectionChange={(trackId, dir) => {
          console.log(trackId, dir);
        }}
      />
    </Fragment>
  );
};
```
