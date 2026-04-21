import { overlayPosition } from "./canvas";
import { TextEditor } from "./styles";

function TextEditorOverlay({ camera, pendingText, textInputRef, onBlur, onChange, onKeyDown }) {
  if (!pendingText) {
    return null;
  }

  return (
    <TextEditor
      ref={textInputRef}
      style={overlayPosition(pendingText, camera)}
      value={pendingText.text}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder="Type text"
    />
  );
}

export default TextEditorOverlay;
