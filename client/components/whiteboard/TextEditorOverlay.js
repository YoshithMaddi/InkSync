import { overlayPosition } from "./canvas";
import { TextEditor } from "./styles";

function TextEditorOverlay({
  camera,
  pendingText,
  textInputRef,
  viewport,
  onBlur,
  onChange,
  onKeyDown
}) {
  if (!pendingText) {
    return null;
  }

  return (
    <TextEditor
      autoFocus
      ref={textInputRef}
      style={overlayPosition(pendingText, camera, viewport)}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      value={pendingText.text}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder="Type text"
    />
  );
}

export default TextEditorOverlay;
