import { Dimension } from "./dimension.js";

const EVENT_BEFORE_TOGGLE = "beforetoggle";
const EVENT_RESIZE = "resize";
const EVENT_SCROLL = "scroll";

const DEFAULT_PLACEMENT = "bottom";
const DEFAULT_OFFSET = 10;
const DEFAULT_PRESENTATION_MODE = false;

export class Popover {
  popoverNode = null;
  referenceNode = null;
  _clonedReferenceNode = null;

  defaultPlacement;
  offset;
  presentationMode;

  popoverRect = {};
  referenceRect = {};

  _listeners = {};

  constructor(
    referenceNode,
    popoverNode,
    {
      placement = DEFAULT_PLACEMENT,
      offset = DEFAULT_OFFSET,
      presentationMode = DEFAULT_PRESENTATION_MODE,
    } = {}
  ) {
    this.popoverNode = popoverNode;
    this.referenceNode = referenceNode;
    this.defaultPlacement = placement;
    this.offset = offset;
    this.presentationMode = presentationMode;

    this.originalPopoverStyle = { ...this.popoverNode.style };

    this.getMeasurements();
    this.setupListeners();

    return this.destroy.bind(this);
  }

  reflectReferenceInsidePopover() {
    const clonedReferenceNode = this.referenceNode.cloneNode(true);

    clonedReferenceNode.setAttribute("tabindex", "-1");
    clonedReferenceNode.setAttribute(
      "style",
      `
      top: ${this.referenceRect.top}px; 
      left: ${this.referenceRect.left}px; 
      position: fixed;
      pointer-events: none;
      `
    );

    this._clonedReferenceNode = clonedReferenceNode;

    this.popoverNode.appendChild(clonedReferenceNode);
  }

  clearReflectedReferenceNode() {
    this._clonedReferenceNode.remove();
  }

  getPopoverMeasurements() {
    this.popoverNode.style.visibility = "hidden";
    this.popoverNode.showPopover();
    /** */
    this.popoverRect = this.popoverNode.getBoundingClientRect();
    /** */
    this.popoverNode.hidePopover();
    this.popoverNode.style.visibility = "visible";
  }

  getReferenceMeasurements() {
    this.referenceRect = this.referenceNode.getBoundingClientRect();
  }

  getReferenceOffsets() {
    return {
      top: this.referenceRect.top,
      right: window.innerWidth - this.referenceRect.right,
      bottom: window.innerHeight - this.referenceRect.bottom,
      left: this.referenceRect.left,
    };
  }

  getMeasurements() {
    this.getPopoverMeasurements();
    this.getReferenceMeasurements();
  }

  setPopoverCoords({ x, y }) {
    this.popoverNode.style.top = `${y}px`;
    this.popoverNode.style.left = `${x}px`;
  }

  withOffset(value) {
    return value + this.offset;
  }

  getReferenceCenterByAxis(axis) {
    return axis === "x"
      ? this.referenceRect.left + this.referenceRect.width / 2
      : this.referenceRect.top + this.referenceRect.height / 2;
  }

  getPopoverCoordsByPlacement(attachingPlacement) {
    const coordsBySide = {
      [Dimension.SIDES.TOP]: {
        x: this.getReferenceCenterByAxis("x") - this.popoverRect.width / 2,
        y: this.referenceRect.top - this.withOffset(this.popoverRect.height),
      },
      [Dimension.SIDES.RIGHT]: {
        x: this.withOffset(this.referenceRect.right),
        y: this.getReferenceCenterByAxis("y") - this.popoverRect.height / 2,
      },
      [Dimension.SIDES.BOTTOM]: {
        x: this.getReferenceCenterByAxis("x") - this.popoverRect.width / 2,
        y: this.withOffset(this.referenceRect.bottom),
      },
      [Dimension.SIDES.LEFT]: {
        x: this.referenceRect.left - this.withOffset(this.popoverRect.width),
        y: this.getReferenceCenterByAxis("y") - this.popoverRect.height / 2,
      },
    };
    return coordsBySide[attachingPlacement];
  }

  calculatePopoverPosition() {
    const referenceOffsets = this.getReferenceOffsets();
    const targetOffset = referenceOffsets[this.defaultPlacement];
    const targetAttr = Dimension.getRelatedSpatialAttr(this.defaultPlacement);

    if (targetOffset >= this.withOffset(this.popoverRect[targetAttr])) {
      this.setPopoverCoords(
        this.getPopoverCoordsByPlacement(this.defaultPlacement)
      );
    } else {
      const availablePlacement =
        Dimension.getClockwiseSides()
          .filter((side) => side !== this.defaultPlacement)
          .find((side) => {
            const sideOffset = referenceOffsets[side];
            const sideAttr = Dimension.getRelatedSpatialAttr(side);
            return sideOffset > this.withOffset(this.popoverRect[sideAttr]);
          }) || this.defaultPlacement;

      this.setPopoverCoords(
        this.getPopoverCoordsByPlacement(availablePlacement)
      );
    }
  }

  handleBeforeToggle({ newState }) {
    if (newState === "open") {
      this.renderPopover();

      this.presentationMode && this.reflectReferenceInsidePopover();
    } else {
      this.presentationMode && this.clearReflectedReferenceNode();
    }
  }

  renderPopover() {
    this.getReferenceMeasurements();
    this.calculatePopoverPosition();
  }

  setupListeners() {
    this._listeners["render"] = this.renderPopover.bind(this);
    this._listeners["beforetoggle"] = this.handleBeforeToggle.bind(this);

    window.addEventListener(EVENT_SCROLL, this._listeners["render"]);
    window.addEventListener(EVENT_RESIZE, this._listeners["render"]);

    this.popoverNode.addEventListener(
      EVENT_BEFORE_TOGGLE,
      this._listeners["beforetoggle"]
    );
  }

  destroy() {
    window.removeEventListener(EVENT_SCROLL, this._listeners["render"]);
    window.removeEventListener(EVENT_RESIZE, this._listeners["render"]);

    this.popoverNode.removeEventListener(
      EVENT_BEFORE_TOGGLE,
      this._listeners["beforetoggle"]
    );

    this.popoverNode.style = { ...this.originalPopoverStyle };
  }
}
