import { useEffect, useRef, useState } from "react";
import ToolIcon from "./ToolIcon";
import { TOOL_ERASER, TOOL_HAND, TOOL_PEN, TOOL_TEXT } from "./constants";
import {
  ColorButton,
  ColorInput,
  DesktopToolboxCard,
  HistoryDock,
  MobileToolEdge,
  MobileToolbarBackdrop,
  MobileToolRail,
  MobileRailLabel,
  ToolButton,
  ToolButtonGrid,
  ToolSlider,
  ToolSliderIcon,
  ToolboxControls,
  ToolboxHeader,
  VerticalRange
} from "./styles";

function ToolboxPanel({
  activeTool,
  brushColor,
  brushSize,
  canRedo,
  canUndo,
  isDrawing,
  onBrushColorChange,
  onBrushSizeChange,
  onClearBoard,
  onRedo,
  onToolChange,
  onUndo
}) {
  const [isMobileToolbarOpen, setIsMobileToolbarOpen] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const inactivityTimerRef = useRef(null);
  const swipeStartXRef = useRef(null);

  function clearInactivityTimer() {
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }

  function collapseMobileToolbar() {
    clearInactivityTimer();
    setIsMobileToolbarOpen(false);
    setShowMoreTools(false);
  }

  function armInactivityCollapse() {
    clearInactivityTimer();
    inactivityTimerRef.current = window.setTimeout(() => {
      collapseMobileToolbar();
    }, 2600);
  }

  function openMobileToolbar() {
    setIsMobileToolbarOpen(true);
    armInactivityCollapse();
  }

  useEffect(() => {
    if (isMobileToolbarOpen) {
      armInactivityCollapse();
    }

    return () => {
      clearInactivityTimer();
    };
  }, [isMobileToolbarOpen, activeTool]);

  useEffect(() => {
    if (isDrawing) {
      collapseMobileToolbar();
    }
  }, [isDrawing]);

  function handleToolSelection(nextTool) {
    onToolChange(nextTool);
    collapseMobileToolbar();
  }

  function handleEdgeTouchStart(event) {
    swipeStartXRef.current = event.touches[0]?.clientX ?? null;
  }

  function handleEdgeTouchEnd(event) {
    if (swipeStartXRef.current == null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? swipeStartXRef.current;
    if (endX - swipeStartXRef.current > 18) {
      openMobileToolbar();
    }

    swipeStartXRef.current = null;
  }

  return (
    <>
      <DesktopToolboxCard aria-label="Whiteboard tools">
        <ToolboxHeader />

        <ToolButtonGrid>
          <ToolButton type="button" onClick={onUndo} aria-label="Undo" title="Undo" disabled={!canUndo}>
            <ToolIcon kind="undo" />
          </ToolButton>
          <ToolButton type="button" onClick={onRedo} aria-label="Redo" title="Redo" disabled={!canRedo}>
            <ToolIcon kind="redo" />
          </ToolButton>
          <ToolButton
            $active={activeTool === TOOL_PEN}
            type="button"
            onClick={() => onToolChange(TOOL_PEN)}
            aria-label="Pen"
            title="Pen"
          >
            <ToolIcon kind="pen" />
          </ToolButton>
          <ToolButton
            $active={activeTool === TOOL_ERASER}
            type="button"
            onClick={() => onToolChange(TOOL_ERASER)}
            aria-label="Eraser"
            title="Eraser"
          >
            <ToolIcon kind="eraser" />
          </ToolButton>
          <ToolButton
            $active={activeTool === TOOL_TEXT}
            type="button"
            onClick={() => onToolChange(TOOL_TEXT)}
            aria-label="Text"
            title="Text"
          >
            <ToolIcon kind="text" />
          </ToolButton>
          <ToolButton
            $active={activeTool === TOOL_HAND}
            type="button"
            onClick={() => onToolChange(TOOL_HAND)}
            aria-label="Pan"
            title="Pan"
          >
            <ToolIcon kind="hand" />
          </ToolButton>
        </ToolButtonGrid>

        <ToolboxControls>
          <ToolSlider htmlFor="brushSize" title="Thickness">
            <ToolSliderIcon aria-hidden="true">
              <ToolIcon kind="thickness" />
            </ToolSliderIcon>
            <VerticalRange
              id="brushSize"
              type="range"
              min="2"
              max="24"
              value={brushSize}
              onChange={onBrushSizeChange}
              aria-label="Thickness"
            />
          </ToolSlider>

          <ColorButton htmlFor="brushColor" title="Color">
            <ColorInput
              id="brushColor"
              type="color"
              value={brushColor}
              onChange={onBrushColorChange}
              aria-label="Color"
            />
          </ColorButton>

          <ToolButton
            $danger
            $fullWidth
            type="button"
            onClick={onClearBoard}
            aria-label="Full erase"
            title="Full erase"
          >
            <ToolIcon kind="clear" />
          </ToolButton>
        </ToolboxControls>
      </DesktopToolboxCard>

      <MobileToolbarBackdrop type="button" $open={isMobileToolbarOpen} onClick={collapseMobileToolbar} />

      <MobileToolEdge
        type="button"
        $open={isMobileToolbarOpen}
        $dimmed={isDrawing}
        aria-label="Open tools"
        onClick={openMobileToolbar}
        onTouchStart={handleEdgeTouchStart}
        onTouchEnd={handleEdgeTouchEnd}
      >
        <ToolIcon kind={activeTool} />
      </MobileToolEdge>

      <MobileToolRail $open={isMobileToolbarOpen} onPointerMove={armInactivityCollapse}>
        <MobileRailLabel>Tools</MobileRailLabel>
        <ToolButton $active={activeTool === TOOL_PEN} type="button" onClick={() => handleToolSelection(TOOL_PEN)}>
          <ToolIcon kind="pen" />
        </ToolButton>
        <ToolButton $active={activeTool === TOOL_ERASER} type="button" onClick={() => handleToolSelection(TOOL_ERASER)}>
          <ToolIcon kind="eraser" />
        </ToolButton>
        <ToolButton $active={activeTool === TOOL_TEXT} type="button" onClick={() => handleToolSelection(TOOL_TEXT)}>
          <ToolIcon kind="text" />
        </ToolButton>
        <ToolButton type="button" onClick={() => setShowMoreTools((current) => !current)}>
          <ToolIcon kind="more" />
        </ToolButton>
        {showMoreTools ? (
          <>
            <ToolButton $active={activeTool === TOOL_HAND} type="button" onClick={() => handleToolSelection(TOOL_HAND)}>
              <ToolIcon kind="hand" />
            </ToolButton>
            <ToolButton $danger type="button" onClick={() => { onClearBoard(); collapseMobileToolbar(); }}>
              <ToolIcon kind="clear" />
            </ToolButton>
          </>
        ) : null}
      </MobileToolRail>

      <HistoryDock>
        <ToolButton type="button" onClick={onUndo} aria-label="Undo" title="Undo" disabled={!canUndo}>
          <ToolIcon kind="undo" />
        </ToolButton>
        <ToolButton type="button" onClick={onRedo} aria-label="Redo" title="Redo" disabled={!canRedo}>
          <ToolIcon kind="redo" />
        </ToolButton>
      </HistoryDock>
    </>
  );
}

export default ToolboxPanel;
