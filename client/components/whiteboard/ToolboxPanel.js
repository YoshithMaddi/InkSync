import ToolIcon from "./ToolIcon";
import { TOOL_ERASER, TOOL_PEN, TOOL_TEXT } from "./constants";

function ToolboxPanel({
  activeTool,
  brushColor,
  brushSize,
  onBrushColorChange,
  onBrushSizeChange,
  onClearBoard,
  onToolChange
}) {
  return (
    <section className="card toolbox-panel" aria-label="Whiteboard tools">
      <div className="toolbox-header">
        <div className="toolbox-badge">Tools</div>
      </div>

      <div className="tool-button-grid">
        <button
          className={`tool-button ${activeTool === TOOL_PEN ? "tool-button-active" : ""}`}
          type="button"
          onClick={() => onToolChange(TOOL_PEN)}
          aria-label="Pen"
          title="Pen"
        >
          <ToolIcon kind="pen" />
        </button>
        <button
          className={`tool-button ${activeTool === TOOL_ERASER ? "tool-button-active" : ""}`}
          type="button"
          onClick={() => onToolChange(TOOL_ERASER)}
          aria-label="Eraser"
          title="Eraser"
        >
          <ToolIcon kind="eraser" />
        </button>
        <button
          className={`tool-button ${activeTool === TOOL_TEXT ? "tool-button-active" : ""}`}
          type="button"
          onClick={() => onToolChange(TOOL_TEXT)}
          aria-label="Text"
          title="Text"
        >
          <ToolIcon kind="text" />
        </button>
      </div>

      <div className="toolbox-controls">
        <label className="tool-slider" htmlFor="brushSize" title="Thickness">
          <span className="tool-slider-icon" aria-hidden="true">
            <ToolIcon kind="thickness" />
          </span>
          <input
            id="brushSize"
            type="range"
            min="2"
            max="24"
            value={brushSize}
            onChange={onBrushSizeChange}
            aria-label="Thickness"
          />
        </label>

        <label className="color-button" htmlFor="brushColor" title="Color">
          <input
            id="brushColor"
            type="color"
            value={brushColor}
            onChange={onBrushColorChange}
            aria-label="Color"
          />
        </label>

        <button
          className="tool-button tool-button-danger full-width"
          type="button"
          onClick={onClearBoard}
          aria-label="Full erase"
          title="Full erase"
        >
          <ToolIcon kind="clear" />
        </button>
      </div>
    </section>
  );
}

export default ToolboxPanel;
