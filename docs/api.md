---
nav:
  title: Function
  order: 1
---

```js
export declare type InitParams = {
    init_cell_width?: number;
    init_cell_padding?: number;
    cell_padding_off_cell_width_threshold?: number;
    init_horz_zoom?: number;
    init_vert_zoom?: number;
    init_track_group_padding?: number;
    init_cell_padding_on?: boolean;
    max_height?: number;
};
export declare type HorzZoomCallback = (zoom: number) => void;
export declare type MinimapCloseCallback = () => void;
export declare type CellMouseOverCallback = (uid: ColumnId | null, track_id?: TrackId) => void;
export declare type CellClickCallback = (uid: ColumnId | null, track_id?: TrackId) => void;
export declare type ClipboardChangeCallback = (ids: ColumnId[]) => void;
export default class Oncoprint {
    private ctr_selector;
    private width;
    private lastSortId;
    private incrementLastSortId;
    destroyed: boolean;
    webgl_unavailable: boolean;
    private $ctr;
    private $oncoprint_ctr;
    private $cell_div;
    private $header_div;
    private $legend_div;
    private $track_options_div;
    private $track_info_div;
    private $dummy_scroll_div;
    private $minimap_div;
    private $cell_canvas;
    private $cell_overlay_canvas;
    model: OncoprintModel;
    header_view: OncoprintHeaderView;
    cell_view: OncoprintWebGLCellView;
    minimap_view: OncoprintMinimapView;
    track_options_view: OncoprintTrackOptionsView;
    track_info_view: OncoprintTrackInfoView;
    label_view: OncoprintLabelView;
    legend_view: OncoprintLegendView;
    private keep_horz_zoomed_to_fit;
    private keep_horz_zoomed_to_fit_ids;
    private pending_resize_and_organize;
    private horz_zoom_callbacks;
    private minimap_close_callbacks;
    private cell_mouse_over_callbacks;
    private cell_click_callbacks;
    private id_clipboard;
    private clipboard_change_callbacks;
    private target_dummy_scroll_left;
    private target_dummy_scroll_top;
    private getCellViewHeight;
    constructor(ctr_selector: string, width: number, params?: InitParams);
    private _SetLegendTop;
    private setLegendTopAfterTimeout;
    private setHeight;
    private resizeAndOrganize;
    private resizeAndOrganizeAfterTimeout;
    private maxOncoprintScrollLeft;
    private maxOncoprintScrollTop;
    private maxDummyScrollDivScroll;
    setMinimapVisible(visible: boolean): void;
    scrollTo(left: number): void;
    onHorzZoom(callback: HorzZoomCallback): void;
    onMinimapClose(callback: MinimapCloseCallback): void;
    moveTrack(target_track: TrackId, new_previous_track: TrackId): void;
    setTrackGroupOrder(index: TrackGroupIndex, track_order: TrackId[], dont_sort?: boolean): void;
    setTrackGroupLegendOrder(group_order: TrackGroupIndex[]): void;
    keepSorted(keep_sorted?: boolean): void;
    addTracks(params_list: UserTrackSpec<Datum>[]): number[];
    removeTrack(track_id: TrackId): void;
    removeTracks(track_ids: TrackId[]): void;
    getTracks(): number[];
    removeAllTracks(): void;
    removeExpansionTracksFor(track_id: TrackId): void;
    disableTrackExpansion(track_id: TrackId): void;
    enableTrackExpansion(track_id: TrackId): void;
    removeAllExpansionTracksInGroup(index: TrackGroupIndex): void;
    setHorzZoomToFit(ids: ColumnId[]): void;
    updateHorzZoomToFitIds(ids: ColumnId[]): void;
    private updateHorzZoomToFit;
    private getHorzZoomToFit;
    private executeHorzZoomCallbacks;
    private executeMinimapCloseCallbacks;
    private doCellMouseOver;
    private doCellClick;
    getHorzZoom(): number;
    setHorzZoomCentered(z: number): void;
    setHorzZoom(z: number, still_keep_horz_zoomed_to_fit?: boolean): number;
    getVertZoom(): number;
    setVertZoom(z: number): number;
    private doSetScroll;
    private setDummyScrollDivScroll;
    setScroll(scroll_left: number, scroll_top: number): void;
    setZoom(zoom_x: number, zoom_y: number): void;
    setHorzScroll(s: number): number;
    setVertScroll(s: number): number;
    setViewport(vp: MinimapViewportSpec): void;
    getTrackData(track_id: TrackId): any[];
    getTrackDataIdKey(track_id: TrackId): string;
    /**
     * Sets the data for an Oncoprint track.
     *
     * @param track_id - the ID that identifies the track
     * @param {Object[]} data - the list of data for the cells
     * @param {string} data_id_key - name of the property of the
     * data objects to use as the (column) key
     */
    setTrackData(track_id: TrackId, data: Datum[], data_id_key: string & keyof Datum): void;
    setTrackImportantIds(track_id: TrackId, ids: ColumnId[] | undefined): void;
    setTrackGroupSortPriority(priority: TrackGroupIndex[]): void;
    resetSortableTracksSortDirection(): void;
    setTrackSortDirection(track_id: TrackId, dir: TrackSortDirection): TrackSortDirection;
    setTrackSortComparator(track_id: TrackId, sortCmpFn: TrackSortSpecification<Datum>): void;
    getTrackSortDirection(track_id: TrackId): TrackSortDirection;
    setTrackInfo(track_id: TrackId, msg: string): void;
    setTrackTooltipFn(track_id: TrackId, tooltipFn: TrackTooltipFn<Datum>): void;
    setShowTrackSublabels(show: boolean): void;
    setTrackShowGaps(track_id: TrackId, showGaps: boolean): void;
    sort(): void;
    shareRuleSet(source_track_id: TrackId, target_track_id: TrackId): void;
    setRuleSet(track_id: TrackId, rule_set_params: RuleSetParams): void;
    setSortConfig(params: SortConfig): void;
    setIdOrder(ids: ColumnId[]): void;
    setTrackGroupHeader(index: TrackGroupIndex, header?: TrackGroupHeader): void;
    disableInteraction(): void;
    enableInteraction(): void;
    suppressRendering(): void;
    releaseRendering(onComplete?: () => void): void;
    triggerPendingResizeAndOrganize(onComplete?: () => void): void;
    hideIds(to_hide: ColumnId[], show_others?: boolean): void;
    hideTrackLegends(track_ids: TrackId[]): void;
    showTrackLegends(track_ids: TrackId[]): void;
    setCellPaddingOn(cell_padding_on: boolean): void;
    setTrackCustomOptions(track_id: TrackId, options: CustomTrackOption[] | undefined): void;
    setTrackInfoTooltip(track_id: TrackId, $tooltip_elt: JQuery | undefined): void;
    setTrackMovable(track_id: TrackId, movable: boolean): void;
    setWidth(width: number): void;
    setColumnLabels(labels: ColumnProp<ColumnLabel>): void;
    setShowTrackLabels(s: boolean): void;
    onCellMouseOver(callback: CellMouseOverCallback): void;
    onCellClick(callback: CellClickCallback): void;
    toSVG(with_background?: boolean): SVGSVGElement;
    toCanvas(callback: (canvas: HTMLCanvasElement, truncated: boolean) => void, resolution?: number): HTMLImageElement;
    toDataUrl(callback: (dataURL: string) => void): void;
    highlightTrackLabelOnly(track_id: TrackId): void;
    setHighlightedTracks(track_ids: TrackId[]): void;
    setHighlightedIds(ids: ColumnId[]): void;
    getIdOrder(all?: boolean): string[];
    setIdClipboardContents(array: ColumnId[]): void;
    getIdClipboardContents(): string[];
    onClipboardChange(callback: ClipboardChangeCallback): void;
    destroy(): void;
    clearMouseOverEffects(): void;
}

```
