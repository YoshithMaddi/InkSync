import ToolIcon from "./ToolIcon";
import { TOOL_ERASER, TOOL_HAND, TOOL_PEN, TOOL_TEXT } from "./constants";
import {
  ColorButton,
  ColorInput,
  ToolButton,
  ToolButtonGrid,
  ToolSlider,
  ToolSliderIcon,
  ToolboxBadge,
  ToolboxCard,
  ToolboxControls,
  ToolboxHeader,
  VerticalRange
} from "./styles";

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
    <ToolboxCard aria-label="Whiteboard tools">
      <ToolboxHeader>
        <ToolboxBadge>Tools</ToolboxBadge>
      </ToolboxHeader>

      <ToolButtonGrid>
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
    </ToolboxCard>
  );
}

export default ToolboxPanel;
