import { overlayPosition } from "./canvas";

function TextEditorOverlay({
  pendingText,
  textInputRef,
  onBlur,
  onChange,
  onKeyDown
}) {
  if (!pendingText) {
    return null;
  }

  return (
    <textarea
      ref={textInputRef}
      className="text-editor"
      style={overlayPosition(pendingText)}
      value={pendingText.text}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder="Type text"
    />
  );
}

export default TextEditorOverlay;
